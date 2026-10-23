/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DonationsDTO,
  DetDonationDTO,
  GetDonationsQueryDTO,
} from './donations.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { AuditService } from 'src/audit/audit.service';
import {
  buildDonationRef,
  buildMedicineRef,
  buildRefs,
  buildStoreRef,
  donationLabel,
  medicineLabel,
  storeLabel,
} from 'src/audit/audit-labels';
import { FileLoggerService } from 'src/common/logger/file-logger.service';
import { loadLogo } from 'src/common/utils/load-logo';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DonationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly logger: FileLoggerService,
  ) {}

  /** Los conflictos de escritura/deadlocks son transitorios y se reintentan. */
  private isRetryableTransactionError(error: unknown): boolean {
    const code = (error as { code?: string } | null)?.code;
    return code === 'P2034' || code === 'P2028';
  }

  private isPrismaError(error: unknown): boolean {
    const code = (error as { code?: string } | null)?.code;
    return typeof code === 'string' && /^P\d{4}$/.test(code);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Transacción interactiva con aislamiento Serializable y reintentos para
   * evitar que dos usuarios dejen el inventario inconsistente.
   */
  private async withTransaction<T>(
    operation: (tx: any) => Promise<T>,
  ): Promise<T> {
    const attempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.prismaService.$transaction(operation, {
          timeout: 60_000,
          maxWait: 20_000,
          isolationLevel: 'Serializable',
        } as any);
      } catch (error) {
        lastError = error;
        if (attempt < attempts && this.isRetryableTransactionError(error)) {
          await this.delay(150 * attempt + Math.floor(Math.random() * 200));
          continue;
        }
        throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('No se pudo completar la transacción.');
  }

  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private toTitleCase(value: string): string {
    const collapsed = value.trim().replace(/\s+/g, ' ');
    return collapsed.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private normalizeSearchKey(value: string): string {
    return this.normalizeText(value).replace(/\s+/g, ' ');
  }

  private async validateControlNumberUnique(
    tx: any,
    controlNumber: string,
    type: string,
    excludeId?: number,
  ): Promise<void> {
    // Solo se compara contra donaciones activas del mismo tipo: una donación
    // eliminada (soft-delete) libera el número de control para reutilizarlo.
    const existing = await tx.donation.count({
      where: {
        controlNumber,
        type,
        deleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing > 0) {
      throw new ConflictException(
        `El número de control "${controlNumber}" ya existe en otra donación de tipo "${type}".`,
      );
    }
  }

  private validateBenefitedForType(donation: DonationsDTO): void {
    if (donation.type === 'Salida') {
      for (const [index, det] of donation.medicines.entries()) {
        if (
          det.benefited == null ||
          typeof det.benefited !== 'number' ||
          det.benefited < 1
        ) {
          throw new BadRequestException(
            `Las donaciones de salida requieren el campo "benefited" (mayor o igual a 1) en el medicamento #${index + 1}.`,
          );
        }
      }
    }
  }

  /**
   * Valida y normaliza los detalles que llegan del cliente. El DTO ya filtra
   * tipos, pero esta capa protege también llamadas internas y datos heredados.
   */
  private validateMedicineDetails(
    medicines: DetDonationDTO[],
  ): DetDonationDTO[] {
    if (!Array.isArray(medicines) || medicines.length === 0) {
      throw new BadRequestException(
        'Debe incluir al menos una medicina en la donación.',
      );
    }
    if (medicines.length > 500) {
      throw new BadRequestException(
        'Una donación no puede superar las 500 medicinas.',
      );
    }

    return medicines.map((det, index) => {
      const amount = Number(det.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new BadRequestException(
          `La cantidad del medicamento #${index + 1} debe ser un entero mayor a 0.`,
        );
      }
      if (
        !Number.isInteger(Number(det.storageId)) ||
        Number(det.storageId) <= 0
      ) {
        throw new BadRequestException(
          `Selecciona un almacén válido para el medicamento #${index + 1}.`,
        );
      }
      if (
        !(det.expirationDate instanceof Date) ||
        Number.isNaN(det.expirationDate.getTime())
      ) {
        throw new BadRequestException(
          `La fecha de vencimiento del medicamento #${index + 1} no es válida.`,
        );
      }
      if (
        det.benefited != null &&
        (!Number.isInteger(Number(det.benefited)) || Number(det.benefited) < 0)
      ) {
        throw new BadRequestException(
          `Los beneficiados del medicamento #${index + 1} deben ser un entero mayor o igual a 0.`,
        );
      }

      return {
        ...det,
        amount,
        storageId: Number(det.storageId),
        benefited: Number(det.benefited ?? 0),
        lote: (det.lote ?? '').trim(),
      };
    });
  }

  /**
   * Une líneas repetidas de la misma medicina/almacén/lote. Sin esto, el
   * procesamiento de inventario podía crear filas duplicadas o descontar dos
   * veces el mismo stock.
   */
  private mergeDuplicateDetails(
    medicines: (DetDonationDTO & { medicineId: number })[],
  ): (DetDonationDTO & { medicineId: number })[] {
    const merged = new Map<string, DetDonationDTO & { medicineId: number }>();

    for (const det of medicines) {
      const lote = (det.lote ?? '').trim();
      const key = `${det.medicineId}|${det.storageId}|${lote}`;
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...det, lote });
        continue;
      }

      if (existing.expirationDate.getTime() !== det.expirationDate.getTime()) {
        throw new BadRequestException(
          `La medicina ${det.medicineId} aparece más de una vez para el mismo almacén y lote, pero con fechas de vencimiento distintas. Unifícalas antes de guardar.`,
        );
      }

      existing.amount += det.amount;
      existing.benefited = (existing.benefited ?? 0) + (det.benefited ?? 0);
    }

    return [...merged.values()];
  }

  /**
   * Detecta cambios en los detalles sin confiar únicamente en el flag del
   * cliente. La fecha de vencimiento se resuelve en inventario/historial, así
   * que aquí se comparan los campos que sí están persistidos en DetDonation.
   */
  private detailsDiffer(
    originalDonation: any,
    medicines: (DetDonationDTO & { medicineId: number })[],
  ): boolean {
    const original = (originalDonation.detDonation ?? []).map((det: any) => {
      const lote = (det.lote || originalDonation.lote || '').trim();
      return `${det.medicineId}|${lote}|${det.amount}|${det.benefited ?? 0}`;
    });
    const current = medicines.map((det) => {
      const lote = (det.lote || originalDonation.lote || '').trim();
      return `${det.medicineId}|${lote}|${det.amount}|${det.benefited ?? 0}`;
    });

    return (
      original.length !== current.length ||
      [...original].sort().join('\n') !== [...current].sort().join('\n')
    );
  }

  /** Verifica que los almacenes existan y estén activos antes de escribir. */
  private async validateStores(
    tx: any,
    medicines: (DetDonationDTO & { medicineId: number })[],
  ): Promise<void> {
    const storeIds = [
      ...new Set(medicines.map((det) => Number(det.storageId))),
    ];
    const stores = await tx.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, deleted: true },
    });
    const byId = new Map<number, any>(stores.map((s: any) => [s.id, s]));

    for (const id of storeIds) {
      const store = byId.get(id);
      if (!store) {
        throw new BadRequestException(
          `El almacén con id ${id} no existe. Actualiza los almacenes y vuelve a intentar.`,
        );
      }
      if (store.deleted) {
        throw new BadRequestException(
          `El almacén "${store.name}" está eliminado y no puede recibir movimientos.`,
        );
      }
    }
  }

  private sumBenefited(dets: DetDonationDTO[]): number {
    return dets.reduce((sum, det) => sum + (det.benefited ?? 0), 0);
  }

  private async resolveMedicines(
    tx: any,
    dets: DetDonationDTO[],
  ): Promise<(DetDonationDTO & { medicineId: number })[]> {
    // Catálogos pequeños (categorías/formas): se cargan una vez y se indexan.
    const [categories, forms] = await Promise.all([
      tx.category.findMany(),
      tx.forms.findMany(),
    ]);

    const categoriesByKey = new Map<string, any>(
      categories.map((c: any) => [this.normalizeSearchKey(c.category), c]),
    );
    const formsByKey = new Map<string, any>(
      forms.map((f: any) => [this.normalizeSearchKey(f.forms), f]),
    );

    // Catálogo de medicinas: consulta DIRIGIDA por id/código del payload en vez
    // de cargar toda la tabla. El matching por nombre (insensible a acentos) se
    // resuelve sobre los candidatos; si un detalle solo trae nombre y no hay
    // coincidencia dirigida, se carga una proyección mínima como respaldo.
    const ids = [
      ...new Set(
        dets
          .map((d) => d.medicineId)
          .filter((v): v is number => typeof v === 'number' && v > 0),
      ),
    ];
    const codes = [
      ...new Set(
        dets
          .map((d) => d.medicine?.code)
          .filter((v): v is string => typeof v === 'string' && v.length > 0),
      ),
    ];

    const medicineSelect = { id: true, name: true, code: true } as const;
    const or: any[] = [];
    if (ids.length) or.push({ id: { in: ids } });
    if (codes.length) or.push({ code: { in: codes } });

    const directed: any[] = or.length
      ? await tx.medicine.findMany({
          where: { OR: or },
          select: medicineSelect,
        })
      : [];

    const byId = new Map<number, any>();
    const byCode = new Map<string, any>();
    const byName = new Map<string, any>();
    const indexMedicine = (m: any): void => {
      byId.set(m.id, m);
      if (m.code) byCode.set(m.code, m);
      byName.set(this.normalizeText(m.name), m);
    };
    directed.forEach(indexMedicine);

    // Respaldo: solo si hay detalles por nombre que no se resolvieron por
    // id/código (p. ej. medicinas nuevas o solo-nombre).
    const unresolvedByName = dets.some(
      (d) =>
        (!d.medicineId || !byId.has(d.medicineId)) &&
        d.medicine?.name &&
        !byName.has(this.normalizeText(d.medicine.name)) &&
        !(d.medicine.code && byCode.has(d.medicine.code)),
    );
    if (unresolvedByName) {
      const all: any[] = await tx.medicine.findMany({
        select: medicineSelect,
      });
      all.forEach((m) => {
        if (!byId.has(m.id)) indexMedicine(m);
      });
    }

    const resolved: (DetDonationDTO & { medicineId: number })[] = [];

    for (const det of dets) {
      if (det.medicineId) {
        const existing = byId.get(det.medicineId);
        if (existing) {
          resolved.push({ ...det, medicineId: existing.id });
          continue;
        }
      }

      const name = det.medicine?.name;
      if (!name) {
        throw new BadRequestException(
          det.medicineId
            ? `La medicina con id ${det.medicineId} ya no existe. Actualiza el catálogo y vuelve a seleccionarla.`
            : 'Cada detalle debe incluir una medicina válida.',
        );
      }

      const normalizedName = this.normalizeText(name);
      const match =
        (det.medicine?.code ? byCode.get(det.medicine.code) : undefined) ??
        byName.get(normalizedName);
      if (match) {
        resolved.push({ ...det, medicineId: match.id });
        continue;
      }

      const categoryValue = det.medicine?.category;
      let categoryId: number;
      if (!categoryValue || !this.normalizeSearchKey(categoryValue)) {
        if (categories.length > 0) {
          categoryId = categories[0].id;
        } else {
          const createdCategory = await tx.category.create({
            data: { category: 'General' },
          });
          categoryId = createdCategory.id;
          categories.push(createdCategory);
        }
      } else {
        const key = this.normalizeSearchKey(categoryValue);
        let category = categoriesByKey.get(key);
        if (!category) {
          category = await tx.category.create({
            data: { category: this.toTitleCase(categoryValue) },
          });
          categories.push(category);
          categoriesByKey.set(key, category);
        }
        categoryId = category.id;
      }

      const formValue = det.medicine?.form;
      let formId: number;
      if (!formValue || !this.normalizeSearchKey(formValue)) {
        const key = this.normalizeSearchKey('No especificada');
        let form = formsByKey.get(key);
        if (!form) {
          form = await tx.forms.create({
            data: { forms: 'No especificada' },
          });
          forms.push(form);
          formsByKey.set(key, form);
        }
        formId = form.id;
      } else {
        const key = this.normalizeSearchKey(formValue);
        let form = formsByKey.get(key);
        if (!form) {
          form = await tx.forms.create({
            data: { forms: this.toTitleCase(formValue) },
          });
          forms.push(form);
          formsByKey.set(key, form);
        }
        formId = form.id;
      }

      const created = await tx.medicine.create({
        data: {
          name,
          description: det.medicine?.description ?? '',
          code: det.medicine?.code ?? null,
          categoryId,
          medicine: det.medicine?.medicine ?? true,
          presentation: det.medicine?.presentation ?? '',
          temperate: det.medicine?.temperate ?? '',
          manufacturer: det.medicine?.manufacturer ?? '',
          activeIngredient: det.medicine?.activeIngredient ?? '',
          countryOfOrigin: det.medicine?.countryOfOrigin ?? 'VE',
          formId,
        },
      });

      indexMedicine({ id: created.id, name, code: created.code });
      resolved.push({ ...det, medicineId: created.id });
    }

    return resolved;
  }

  private buildDonationWhere(query?: GetDonationsQueryDTO): any {
    // Las donaciones con soft-delete no se listan.
    const where: any = { deleted: false };
    if (query?.lote) {
      where.lote = { contains: query.lote, mode: 'insensitive' };
    }
    if (query?.controlNumber) {
      where.controlNumber = {
        contains: query.controlNumber,
        mode: 'insensitive',
      };
    }
    if (query?.type) {
      where.type = query.type;
    }
    if (query?.providerId) {
      where.providerId = query.providerId;
    }
    if (query?.institutionId) {
      where.institutionId = query.institutionId;
    }
    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = query.startDate;
      if (query.endDate) where.date.lte = query.endDate;
    }
    return where;
  }

  /**
   * Resumen agregado del conjunto de donaciones que cumple el mismo filtro de
   * `getDonations`. Se calcula con agregados de Prisma (sin cargar filas) para
   * no penalizar el tiempo de respuesta.
   */
  async getDonationsSummary(query?: GetDonationsQueryDTO) {
    const where = this.buildDonationWhere(query);

    // Añade el tipo como condición AND para no pisar un `type` ya filtrado.
    const withType = (type: string): any => ({
      ...where,
      AND: [...(where.AND ?? []), { type }],
    });

    // conteo de donaciones por tipo + rango real de fechas.
    const donationsByType = this.prismaService.donation.groupBy({
      by: ['type'],
      where,
      _count: { _all: true },
      _min: { date: true },
      _max: { date: true },
    });

    // items/beneficiados por tipo (una sola pasada agregada por cada tipo).
    const itemsByType = (type: 'Entrada' | 'Salida') =>
      this.prismaService.detDonation.aggregate({
        where: { donation: withType(type) },
        _sum: { amount: true, benefited: true },
      });

    const [grouped, entrada, salida] = await Promise.all([
      donationsByType,
      itemsByType('Entrada'),
      itemsByType('Salida'),
    ]);

    const countsByType = new Map<string, number>(
      grouped.map((row) => [row.type, row._count._all]),
    );
    const entradaDonations = countsByType.get('Entrada') ?? 0;
    const salidaDonations = countsByType.get('Salida') ?? 0;
    const totalDonations = entradaDonations + salidaDonations;

    const entradaItems = entrada._sum.amount ?? 0;
    const salidaItems = salida._sum.amount ?? 0;
    const entradaBenefited = entrada._sum.benefited ?? 0;
    const salidaBenefited = salida._sum.benefited ?? 0;
    const totalItems = entradaItems + salidaItems;
    const totalBenefited = entradaBenefited + salidaBenefited;

    // El rango de fechas se obtiene del mínimo/máximo entre los grupos de tipo.
    const dates = grouped
      .flatMap((row) => [row._min.date, row._max.date])
      .filter((value): value is Date => value instanceof Date);
    const dateRange =
      dates.length > 0
        ? {
            from: new Date(Math.min(...dates.map((d) => d.getTime()))),
            to: new Date(Math.max(...dates.map((d) => d.getTime()))),
          }
        : null;

    return {
      totalDonations,
      totalItems,
      totalBenefited,
      entrada: {
        donations: entradaDonations,
        items: entradaItems,
        benefited: entradaBenefited,
      },
      salida: {
        donations: salidaDonations,
        items: salidaItems,
        benefited: salidaBenefited,
      },
      averageItemsPerDonation:
        totalDonations > 0
          ? Number((totalItems / totalDonations).toFixed(2))
          : 0,
      dateRange,
    };
  }

  async getDonations(query?: GetDonationsQueryDTO) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 100;

    const where = this.buildDonationWhere(query);

    // grab all
    const [donations, total] = await Promise.all([
      this.prismaService.donation.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * size,
        take: size,
        include: {
          detDonation: {
            include: { medicine: true },
          },
          institution: true,
          provider: true,
        },
      }),
      this.prismaService.donation.count({ where }),
    ]);

    // id from all 4 inven
    const donationIds = donations.map((donation) => donation.id);

    // grab from inv/history where id is from above: el inventario desaparece
    // cuando el stock llega a 0, por lo que el historial es el respaldo.
    const [inventories, histories] = await Promise.all([
      this.prismaService.inventory.findMany({
        where: {
          donationId: { in: donationIds },
        },
      }),
      this.prismaService.historyInventory.findMany({
        where: {
          donationId: { in: donationIds },
          type: { in: ['Entrada', 'Salida'] },
        },
        orderBy: { id: 'desc' },
      }),
    ]);

    // Salidas y transferencias que afectaron a los lotes de estas donaciones,
    // para avisar si editar la donación descontará unidades ya movidas.
    const medicineIds = [
      ...new Set(
        donations.flatMap((d) => d.detDonation.map((det) => det.medicineId)),
      ),
    ];
    const lotes = [
      ...new Set(
        donations.flatMap((d) =>
          d.detDonation.map((det) => det.lote || d.lote),
        ),
      ),
    ];
    const outflowRecords =
      medicineIds.length && lotes.length
        ? await this.prismaService.historyInventory.findMany({
            where: {
              type: { in: ['Salida', 'Transferencia Salida'] },
              deleted: false,
              medicineId: { in: medicineIds },
              lote: { in: lotes },
            },
          })
        : [];

    // Índices en memoria (una sola pasada) para evitar `.find`/`.filter`
    // anidados O(página × detalles × filas).
    const putFirst = <T>(map: Map<string, T>, key: string, value: T): void => {
      if (!map.has(key)) map.set(key, value);
    };

    const invByDML = new Map<string, any>();
    const invByDMS = new Map<string, any>();
    const invByDM = new Map<string, any>();
    for (const inv of inventories) {
      putFirst(
        invByDML,
        `${inv.donationId}|${inv.medicineId}|${inv.lote}`,
        inv,
      );
      putFirst(
        invByDMS,
        `${inv.donationId}|${inv.medicineId}|${inv.storeId}`,
        inv,
      );
      putFirst(invByDM, `${inv.donationId}|${inv.medicineId}`, inv);
    }

    const histByDML = new Map<string, any>();
    const histByDM = new Map<string, any>();
    for (const h of histories) {
      putFirst(histByDML, `${h.donationId}|${h.medicineId}|${h.lote}`, h);
      putFirst(histByDM, `${h.donationId}|${h.medicineId}`, h);
    }

    const outflowByMLS = new Map<string, any[]>();
    const outflowByML = new Map<string, any[]>();
    for (const h of outflowRecords) {
      const keyML = `${h.medicineId}|${h.lote}`;
      const arrML = outflowByML.get(keyML);
      if (arrML) arrML.push(h);
      else outflowByML.set(keyML, [h]);

      const keyMLS = `${keyML}|${h.storeId}`;
      const arrMLS = outflowByMLS.get(keyMLS);
      if (arrMLS) arrMLS.push(h);
      else outflowByMLS.set(keyMLS, [h]);
    }

    // what got from inv >tie to> donations thingamajig
    const donationsWithDates = donations.map((donation) => {
      const batches: { medicineId: number; lote: string; storeId?: number }[] =
        [];

      const detDonationsWithDates = donation.detDonation.map((det) => {
        const lote = det.lote || donation.lote;
        const dm = `${donation.id}|${det.medicineId}`;

        const inventoryRecord =
          invByDML.get(`${dm}|${lote}`) ??
          invByDMS.get(`${dm}|${(det as any).storageId}`) ??
          invByDM.get(dm);

        const historyRecord =
          histByDML.get(`${dm}|${lote}`) ?? histByDM.get(dm);

        const storeId = inventoryRecord?.storeId ?? historyRecord?.storeId;
        batches.push({ medicineId: det.medicineId, lote, storeId });

        return {
          ...det,
          storageId: storeId ?? null,
          admissionDate:
            inventoryRecord?.admissionDate ?? historyRecord?.admissionDate,
          expirationDate:
            inventoryRecord?.expirationDate ?? historyRecord?.expirationDate,
        };
      });

      const matchedOutflows = new Map<number, any>();
      for (const b of batches) {
        const candidates =
          (b.storeId != null
            ? outflowByMLS.get(`${b.medicineId}|${b.lote}|${b.storeId}`)
            : outflowByML.get(`${b.medicineId}|${b.lote}`)) ?? [];
        for (const h of candidates) {
          if (
            h.donationId !== donation.id &&
            h.date.getTime() >= donation.date.getTime()
          ) {
            matchedOutflows.set(h.id, h);
          }
        }
      }

      const outflowMap = new Map<
        string,
        {
          medicineId: number;
          lote: string;
          storeId: number;
          salidas: number;
          transferencias: number;
        }
      >();
      for (const h of matchedOutflows.values()) {
        const key = `${h.medicineId}|${h.lote}|${h.storeId}`;
        const current = outflowMap.get(key) ?? {
          medicineId: h.medicineId,
          lote: h.lote,
          storeId: h.storeId,
          salidas: 0,
          transferencias: 0,
        };
        if (h.type === 'Transferencia Salida') {
          current.transferencias += h.amount;
        } else {
          current.salidas += h.amount;
        }
        outflowMap.set(key, current);
      }
      const outflows = [...outflowMap.values()].map((outflow) => ({
        ...outflow,
        total: outflow.salidas + outflow.transferencias,
      }));

      return {
        ...donation,
        detDonation: detDonationsWithDates,
        hasOutflows: outflows.length > 0,
        outflows,
      };
    });

    return {
      donations: donationsWithDates,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async createDonation(donation: DonationsDTO) {
    try {
      const newDonation = await this.withTransaction(async (tx) => {
        await this.validateControlNumberUnique(
          tx,
          donation.controlNumber,
          donation.type,
        );
        this.validateBenefitedForType(donation);
        this.validateMedicineDetails(donation.medicines);

        const resolved = await this.resolveMedicines(tx, donation.medicines);
        const medicinesResolved = this.mergeDuplicateDetails(
          this.validateMedicineDetails(resolved),
        );
        await this.validateStores(tx, medicinesResolved);

        const donationCreated = await tx.donation.create({
          data: {
            institutionId: donation.institutionId,
            providerId: donation.providerId,
            type: donation.type,
            date: donation.date,
            controlNumber: donation.controlNumber,
            lote: donation.lote,
            benefited: this.sumBenefited(medicinesResolved),
          },
          include: {
            institution: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        });

        const donationRef = buildDonationRef(donationCreated);
        const donationRefs = buildRefs({
          donation: donationRef,
          institution: donationCreated.institution ?? undefined,
          provider: donationCreated.provider ?? undefined,
        });
        const consignee =
          donationCreated.institution?.name || donationCreated.provider?.name;

        const dataDetDonation = medicinesResolved.map((pro) => ({
          donationId: donationCreated.id,
          medicineId: pro.medicineId,
          amount: pro.amount,
          benefited: pro.benefited ?? 0,
          lote: pro.lote || donation.lote || '',
        }));
        await tx.detDonation.createMany({ data: dataDetDonation });

        const inventoryDto = {
          donationId: donationCreated.id,
          lote: donation.lote,
          medicines: medicinesResolved.map((med) => ({
            medicineId: med.medicineId,
            storeId: med.storageId,
            stock: med.amount,
            admissionDate: donation.date,
            expirationDate: med.expirationDate,
            lote: med.lote,
          })),
          type: donation.type,
          date: donation.date,
          observations: '',
        };

        const result = await this.inventoryService.processInventory(
          inventoryDto,
          tx,
        );
        if (!result.success) throw new BadRequestException(result.message);

        await this.auditService.record(
          {
            action: 'CREATE',
            entity: 'Donation',
            entityId: donationCreated.id,
            description: `Donación ${donationLabel(donationRef)} creada${
              consignee ? ` para ${consignee}` : ''
            }`,
            metadata: {
              before: null,
              after: donationCreated,
              payload: donation,
              refs: donationRefs,
            },
          },
          tx,
        );

        const createdDets = await tx.detDonation.findMany({
          where: { donationId: donationCreated.id },
          include: {
            medicine: { select: { id: true, name: true, code: true } },
          },
        });
        for (const det of createdDets) {
          const medicineRef = buildMedicineRef(det.medicine);
          await this.auditService.record(
            {
              action: 'CREATE',
              entity: 'DetDonation',
              entityId: det.id,
              description: `Detalle de donación ${donationLabel(
                donationRef,
              )}: ${det.amount} x ${medicineLabel(medicineRef)} (lote ${det.lote})`,
              metadata: {
                before: null,
                after: det,
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                }),
              },
            },
            tx,
          );
        }

        return {
          success: true,
          message:
            'Donación creada exitosamente y acción de inventario procesada.',
          data: donationCreated,
        };
      });

      return {
        donation: newDonation,
        message: 'Donación registrada exitosamente.',
      };
    } catch (error) {
      if (error instanceof HttpException || this.isPrismaError(error)) {
        throw error;
      }
      throw new BadRequestException(
        'No se pudo crear la donación. ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async updateDonation(id: number, donation: DonationsDTO) {
    try {
      return await this.withTransaction(async (tx) => {
        const originalDonation = await tx.donation.findUnique({
          where: { id },
          include: {
            detDonation: {
              include: {
                medicine: { select: { id: true, name: true, code: true } },
              },
            },
            historyInventory: true,
            institution: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        });

        if (!originalDonation)
          throw new NotFoundException('La donación no existe o fue eliminada.');
        if (originalDonation.deleted)
          throw new BadRequestException(
            'La donación fue eliminada y no puede actualizarse.',
          );

        await this.validateControlNumberUnique(
          tx,
          donation.controlNumber,
          donation.type,
          id,
        );
        this.validateBenefitedForType(donation);
        this.validateMedicineDetails(donation.medicines);

        const resolved = await this.resolveMedicines(tx, donation.medicines);
        const medicinesResolved = this.mergeDuplicateDetails(
          this.validateMedicineDetails(resolved),
        );
        await this.validateStores(tx, medicinesResolved);

        const headerChanged =
          donation.type !== originalDonation.type ||
          donation.lote !== originalDonation.lote ||
          donation.date.getTime() !== originalDonation.date.getTime();
        const changeDonDetails =
          donation.changeDonDetails === true ||
          headerChanged ||
          this.detailsDiffer(originalDonation, medicinesResolved);

        let revertedShortfallsByKey: Record<string, number> = {};
        if (changeDonDetails) {
          const revertResult =
            await this.inventoryService.revertInventoryWithHistory(
              tx,
              originalDonation,
            );
          revertedShortfallsByKey = revertResult.shortfallsByKey ?? {};
        }

        const posteriores = await tx.historyInventory.findMany({
          where: {
            medicineId: { in: medicinesResolved.map((m) => m.medicineId) },
            storeId: { in: medicinesResolved.map((m) => m.storageId) },
            donationId: { not: id },
            deleted: false,
            createAt: { gt: originalDonation.updateAt },
          },
        });

        const updatedDonationType = donation.type || originalDonation.type;
        const reversionWarnings: string[] = [];

        for (const med of medicinesResolved) {
          const consumoPosterior = posteriores
            .filter(
              (h) =>
                h.medicineId === med.medicineId && h.storeId === med.storageId,
            )
            .reduce(
              (acc, h) => acc + (h.type === 'Salida' ? h.amount : -h.amount),
              0,
            );

          if (
            updatedDonationType === 'Entrada' &&
            med.amount < consumoPosterior
          ) {
            throw new Error(
              `No se puede reducir la cantidad de medicina ${med.medicineId} a ${med.amount} porque se usaron ${consumoPosterior} unidades en salidas posteriores.`,
            );
          }
        }

        const updateData: any = {
          institutionId: donation.institutionId,
          providerId: donation.providerId,
          type: updatedDonationType,
          lote: donation.lote,
          date: donation.date,
          controlNumber: donation.controlNumber,
          benefited: this.sumBenefited(medicinesResolved),
          updateAt: new Date(),
        };

        const updatedDonation = await tx.donation.update({
          where: { id },
          data: updateData,
          include: {
            institution: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        });

        if (changeDonDetails) {
          for (const med of medicinesResolved) {
            const key = `${med.medicineId}|${med.storageId}|${(med.lote || donation.lote || '').trim()}`;
            const shortfall = revertedShortfallsByKey[key] ?? 0;
            if (shortfall > 0) {
              reversionWarnings.push(
                `La medicina ${med.medicineId} tenía ${shortfall} unidad(es) ya salidas o transferidas.`,
              );
            }
            if (shortfall > med.amount) {
              throw new BadRequestException(
                `No se puede actualizar la medicina ${med.medicineId}: ${shortfall} unidades ya fueron salidas o transferidas y la nueva cantidad (${med.amount}) es menor.`,
              );
            }
          }

          await tx.detDonation.deleteMany({ where: { donationId: id } });

          const newDetails = medicinesResolved.map((m) => ({
            donationId: id,
            medicineId: m.medicineId,
            amount: m.amount,
            benefited: m.benefited ?? 0,
            lote: m.lote || donation.lote || '',
          }));
          await tx.detDonation.createMany({ data: newDetails });

          // Se descuenta lo ya salido/transferido para no recrear unidades
          // que dejaron de existir en el inventario.
          const inventoryMedicines = medicinesResolved
            .map((med) => {
              const key = `${med.medicineId}|${med.storageId}|${(med.lote || donation.lote || '').trim()}`;
              return {
                medicineId: med.medicineId,
                storeId: med.storageId,
                stock: med.amount - (revertedShortfallsByKey[key] ?? 0),
                admissionDate: donation.date,
                expirationDate: med.expirationDate,
                lote: med.lote,
              };
            })
            .filter((med) => med.stock > 0);

          if (inventoryMedicines.length > 0) {
            const inventoryDto = {
              donationId: updatedDonation.id,
              lote: updatedDonation.lote,
              medicines: inventoryMedicines,
              type: donation.type,
              date: donation.date,
              observations: 'Actualización con dependencias posteriores',
            };

            const result = await this.inventoryService.processInventory(
              inventoryDto,
              tx,
            );
            if (!result.success) throw new BadRequestException(result.message);
          }
        }

        const donationRef = buildDonationRef(updatedDonation);
        const donationRefs = buildRefs({
          donation: donationRef,
          institution: updatedDonation.institution ?? undefined,
          provider: updatedDonation.provider ?? undefined,
        });

        await this.auditService.record(
          {
            action: 'UPDATE',
            entity: 'Donation',
            entityId: updatedDonation.id,
            description: `Donación ${donationLabel(donationRef)} actualizada`,
            metadata: {
              before: originalDonation,
              after: updatedDonation,
              payload: donation,
              refs: donationRefs,
            },
          },
          tx,
        );

        if (changeDonDetails) {
          for (const det of originalDonation.detDonation) {
            const medicineRef = buildMedicineRef(det.medicine);
            await this.auditService.record(
              {
                action: 'DELETE',
                entity: 'DetDonation',
                entityId: det.id,
                description: `Detalle previo eliminado de donación ${donationLabel(
                  donationRef,
                )}: ${det.amount} x ${medicineLabel(medicineRef)} (lote ${det.lote})`,
                metadata: {
                  before: det,
                  after: null,
                  refs: buildRefs({
                    donation: donationRef,
                    medicine: medicineRef,
                  }),
                },
              },
              tx,
            );
          }

          const newDets = await tx.detDonation.findMany({
            where: { donationId: id },
            include: {
              medicine: { select: { id: true, name: true, code: true } },
            },
          });
          for (const det of newDets) {
            const medicineRef = buildMedicineRef(det.medicine);
            await this.auditService.record(
              {
                action: 'CREATE',
                entity: 'DetDonation',
                entityId: det.id,
                description: `Detalle nuevo de donación ${donationLabel(
                  donationRef,
                )}: ${det.amount} x ${medicineLabel(medicineRef)} (lote ${det.lote})`,
                metadata: {
                  before: null,
                  after: det,
                  refs: buildRefs({
                    donation: donationRef,
                    medicine: medicineRef,
                  }),
                },
              },
              tx,
            );
          }
        }

        return {
          success: true,
          message:
            reversionWarnings.length > 0
              ? `Donación actualizada. Avisos: ${reversionWarnings.join(' ')}`
              : 'Donación actualizada correctamente.',
          data: { ...updatedDonation, warnings: reversionWarnings },
        };
      });
    } catch (error) {
      if (error instanceof HttpException || this.isPrismaError(error)) {
        throw error;
      }
      throw new BadRequestException(
        'No se pudo actualizar la donación. ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async deleteDonation(id: number) {
    try {
      return await this.withTransaction(async (tx) => {
        // Obtener la donación con todos sus datos relacionados
        const donation = await tx.donation.findUnique({
          where: { id },
          include: {
            detDonation: {
              include: {
                medicine: { select: { id: true, name: true, code: true } },
              },
            },
            historyInventory: {
              include: {
                medicine: { select: { id: true, name: true, code: true } },
                store: { select: { id: true, name: true } },
              },
            },
            institution: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
          },
        });

        if (!donation) {
          throw new BadRequestException('Donación no encontrada');
        }

        // Revertir inventario usando datos históricos. Se conserva el
        // resultado para informar unidades que ya no pudieron revertirse.
        const revertResult =
          await this.inventoryService.revertInventoryWithHistory(tx, donation);
        const shortfalls = (revertResult.shortfalls ?? {}) as Record<
          number,
          number
        >;

        // El historial no se borra físicamente: se marca como eliminado para
        // conservar la bitácora y el asiento de reversión recién creado.
        const now = new Date();
        await tx.historyInventory.updateMany({
          where: { id: { in: donation.historyInventory.map((h) => h.id) } },
          data: { deleted: true, deletedAt: now },
        });

        // Los detalles operativos sí se eliminan para que no sigan
        // contando en reportes de la donación.
        await tx.detDonation.deleteMany({
          where: { donationId: id },
        });

        // NO se eliminan las filas de inventario por `donationId`: el stock
        // de una misma medicina/almacén/lote puede estar compartido entre
        // donaciones y la fila conserva el id de la primera. Borrarla aquí
        // eliminaba stock de otras donaciones. La reversión de arriba ya
        // dejó el stock en el valor correcto.

        // La restricción única incluye `deleted`. Si ya existe otra donación
        // eliminada con el mismo número/tipo, se archiva su número antes de
        // eliminar esta para que el soft-delete no falle con un 409.
        const archivedCollision = await tx.donation.findFirst({
          where: {
            controlNumber: donation.controlNumber,
            type: donation.type,
            deleted: true,
            id: { not: id },
          },
          select: { id: true, controlNumber: true },
        });
        if (archivedCollision) {
          await tx.donation.update({
            where: { id: archivedCollision.id },
            data: {
              controlNumber: `${archivedCollision.controlNumber}#DEL-${archivedCollision.id}`,
            },
          });
        }

        // Soft-delete de la donación: mantiene la FK del historial válida y
        // la oculta de listados y reportes.
        const deletedDonation = await tx.donation.update({
          where: { id },
          data: { deleted: true },
        });

        const donationRef = buildDonationRef(deletedDonation);
        const donationRefs = buildRefs({
          donation: donationRef,
          institution: donation.institution ?? undefined,
          provider: donation.provider ?? undefined,
        });

        for (const det of donation.detDonation) {
          const medicineRef = buildMedicineRef(det.medicine);
          await this.auditService.record(
            {
              action: 'DELETE',
              entity: 'DetDonation',
              entityId: det.id,
              description: `Detalle eliminado de donación ${donationLabel(
                donationRef,
              )}: ${det.amount} x ${medicineLabel(medicineRef)} (lote ${det.lote})`,
              metadata: {
                before: det,
                after: null,
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                }),
              },
            },
            tx,
          );
        }
        for (const hist of donation.historyInventory) {
          const medicineRef = buildMedicineRef(hist.medicine);
          const storeRef = buildStoreRef(hist.store);
          await this.auditService.record(
            {
              action: 'UPDATE',
              entity: 'HistoryInventory',
              entityId: hist.id,
              description: `Historial de inventario marcado como eliminado de donación ${donationLabel(
                donationRef,
              )}: ${hist.type} de ${hist.amount} x ${medicineLabel(
                medicineRef,
              )} (lote ${hist.lote}, almacén ${storeLabel(storeRef)})`,
              metadata: {
                before: { deleted: false },
                after: { deleted: true, deletedAt: now },
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                  store: storeRef,
                }),
              },
            },
            tx,
          );
        }
        await this.auditService.record(
          {
            action: 'DELETE',
            entity: 'Donation',
            entityId: deletedDonation.id,
            description: `Donación ${donationLabel(donationRef)} eliminada`,
            metadata: {
              before: donation,
              after: { deleted: true },
              shortfalls,
              refs: donationRefs,
            },
          },
          tx,
        );

        const shortfallCount = Object.values(shortfalls).reduce(
          (sum, value) => sum + value,
          0,
        );
        return {
          success: true,
          message:
            shortfallCount > 0
              ? `Donación eliminada. ${shortfallCount} unidad(es) no pudieron revertirse porque ya habían salido o se transfirieron.`
              : 'Donación eliminada y cambios en inventario revertidos correctamente.',
          data: deletedDonation,
        };
      });
    } catch (error) {
      if (error instanceof HttpException || this.isPrismaError(error)) {
        throw error;
      }
      throw new BadRequestException(
        'No se pudo eliminar la donación. ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async generateDonationPDF(donationId: number, type: 'normal' | 'delivery') {
    try {
      const donation = await this.prismaService.donation.findUnique({
        where: { id: donationId },
        include: {
          detDonation: { include: { medicine: { include: { form: true } } } },
          provider: true,
          institution: true,
        },
      });

      if (!donation) {
        throw new Error('Donación no encontrada');
      }

      const [inventories, histories] = await Promise.all([
        this.prismaService.inventory.findMany({
          where: { donationId },
        }),
        this.prismaService.historyInventory.findMany({
          where: { donationId },
        }),
      ]);

      const filePDF = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

        const buffers: Uint8Array[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        );

        // Colores de la referencia
        const NAVY = '#1B365D';
        const TEAL = '#2E7B88';
        const LIGHT = '#F4F7F9';
        const GRAY_TEXT = '#545454';
        const LINE = '#D9D9D9';
        const EMAIL_BLUE = '#0000FF';

        // Dimensiones de la tabla
        const TABLE_X = 50;
        const TABLE_W = 500;
        const LOGO_W = 170;

        const columns = [
          { header: 'Material', width: 57 },
          { header: 'Producto / Descripción', width: 150 }, // Ajustado (-30)
          { header: 'Cant.', width: 29 }, // Ajustado (-2)
          { header: 'Unid', width: 39 }, // Ajustado (-8)
          { header: 'Lote', width: 45 }, // Ajustado (-11)
          { header: 'País de Origen', width: 45 },
          { header: 'Fabricante', width: 55 }, // Ajustado (-12)
          { header: 'Expira', width: 45 }, // Ajustado (-7)
          { header: 'Valor', width: 35 }, // Ajustado (+5 para dar más espacio al precio)
        ];

        const title =
          type === 'normal' ? 'FACTURA NO COMERCIAL' : 'NOTA DE ENTREGA';
        const subtitle =
          'Asistencia de Salud — No para reventa o fines comerciales';

        const formatExpiration = (
          date: Date | string | null | undefined,
        ): string => {
          if (!date) return 'Sin Fecha';
          // Asegurarnos de que sea un objeto Date válido por si viene como string desde la BD
          const parsedDate = new Date(date);
          if (isNaN(parsedDate.getTime())) return 'Sin Fecha';

          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          return `${day}/${month}/${year}`;
        };

        // Logo a la derecha (se omite si el asset no está disponible)
        const logoRight = loadLogo();
        if (logoRight) {
          doc.image(logoRight, TABLE_X + TABLE_W - LOGO_W, 10, {
            width: LOGO_W,
          });
        } else {
          this.logger.warn({
            timestamp: new Date(),
            level: 'WARN',
            message: 'No se pudo cargar el logotipo para el PDF de donación',
          });
        }

        // Título y subtítulo
        doc
          .font('Helvetica-Bold')
          .fontSize(15)
          .fillColor(NAVY)
          .text(title, TABLE_X, 58, { width: TABLE_W - LOGO_W - 30 });
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(GRAY_TEXT)
          .text(subtitle, TABLE_X, 77, { width: TABLE_W - LOGO_W - 30 });

        // Línea de datos
        const fechaStr = donation.date.toLocaleDateString('es-VE');
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('black')
          .text(`Número de Donación: ${donation.controlNumber}`, TABLE_X, 92, {
            continued: true,
          });
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Fecha: ', TABLE_X + 260, 92, {
            width: 100,
            align: 'left',
            continued: true,
          });
        doc.font('Helvetica').text(fechaStr);

        // Banda teal "DATOS DEL CONSIGNATARIO"
        let y = 122;
        doc.fillColor(TEAL).rect(TABLE_X, y, TABLE_W, 18).fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('white')
          .text('DATOS DEL CONSIGNATARIO', TABLE_X + 8, y + 5, {
            width: TABLE_W - 16,
          });
        y += 18;

        // Caja gris con los datos del consignatario
        const inst = donation.institution;
        const rowsData = [
          { label: 'Nombre', value: inst?.name || '', bold: true },
          { label: 'Dirección:', value: inst?.address || '', bold: false },
          { label: 'Atención:', value: inst?.responsible || '', bold: false },
          {
            label: 'Email:',
            value: inst?.email || '',
            bold: false,
            email: true,
          },
        ];

        const valueWidth = 240;
        const rowHeights = rowsData.map((row) => {
          doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
          const textHeight = doc.heightOfString(row.value, {
            width: valueWidth,
          });
          return Math.max(13, textHeight + 4);
        });
        const boxHeight = rowHeights.reduce((acc, h) => acc + h, 0) + 4;
        doc.fillColor(LIGHT).rect(TABLE_X, y, TABLE_W, boxHeight).fill();

        let rowY = y + 4;
        rowsData.forEach((row, i) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(8.5)
            .fillColor('black')
            .text(row.label, TABLE_X + 8, rowY, { width: 80 });
          doc
            .font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(8.5)
            .fillColor(row.email ? EMAIL_BLUE : 'black')
            .text(row.value, TABLE_X + 60, rowY, {
              width: valueWidth,
              underline: !!row.email,
            });
          rowY += rowHeights[i];
        });

        // R.I.F. y Teléfono a la derecha
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('black')
          .text(
            `R.I.F.: ${inst?.rif || 'Sin registro'}`,
            TABLE_X + 380,
            y + 4,
            {
              width: 172,
              align: 'left',
            },
          );
        doc.text(`Teléfono: ${inst?.phone || ''}`, TABLE_X + 380, y + 17, {
          width: 172,
          align: 'left',
        });
        y += boxHeight + 8;

        // Línea divisoria
        doc.fillColor(LINE).rect(TABLE_X, y, TABLE_W, 1).fill();
        y += 6;

        // Encabezado de la tabla
        let startY = y;
        const headerHeight = 28;
        const pageBottomMargin = 60;

        function drawTableHeader() {
          doc
            .fillColor(NAVY)
            .rect(TABLE_X, startY, TABLE_W, headerHeight)
            .fill();
          let hx = TABLE_X;
          doc.font('Helvetica-Bold').fontSize(10).fillColor('white');
          for (const col of columns) {
            doc.text(col.header, hx + 2, startY + 3, {
              width: col.width - 4,
              align: 'center',
            });
            hx += col.width;
          }
          startY += headerHeight;
        }

        function ensureTableSpace(needed: number) {
          const pageBottom =
            doc.page.height - doc.page.margins.bottom - pageBottomMargin;
          if (startY + needed > pageBottom) {
            doc.addPage();
            startY = doc.page.margins.top + 20;
            drawTableHeader();
          }
        }

        drawTableHeader();

        const cellFontSizes = [7.5, 7.5, 9, 8, 8, 8, 8, 8, 9.2];

        // Filas
        donation.detDonation.forEach((det) => {
          const lote = det.lote || donation.lote;

          const inventoryCandidates = inventories.filter(
            (inv) => inv.medicineId === det.medicineId,
          );
          const inventory =
            inventoryCandidates.find((inv) => inv.lote === lote) ||
            inventoryCandidates[0];

          const historyCandidates = histories.filter(
            (h) => h.medicineId === det.medicineId,
          );
          const history =
            historyCandidates.find((h) => h.lote === lote) ||
            historyCandidates[0];

          // La fecha se toma del inventario actual o, si el lote ya fue
          // consumido/eliminado, del historial persistente de la donación.
          const expirationDate = formatExpiration(
            inventory?.expirationDate ?? history?.expirationDate,
          );

          const productDesc = `${det.medicine.name}${
            det.medicine.presentation ? ' ' + det.medicine.presentation : ''
          }`;

          const rowCells = [
            det.medicine.code !== '' ? det.medicine.code : 'Sin código',
            productDesc,
            det.amount.toString(),
            det.medicine.form?.forms || '',
            det.lote,
            det.medicine.countryOfOrigin !== ''
              ? det.medicine.countryOfOrigin
              : '-',
            det.medicine.manufacturer || '',
            expirationDate,
            '0.00',
          ];

          const textHeights = rowCells.map((cell, i) => {
            doc.font('Helvetica').fontSize(cellFontSizes[i]);
            return doc.heightOfString(cell, {
              width: columns[i].width - 3,
            });
          });
          const rowHeight = Math.max(...textHeights) + 8;

          ensureTableSpace(rowHeight);

          let x = TABLE_X;
          for (let i = 0; i < columns.length; i++) {
            // 1. Dibujar el borde de la celda
            doc
              .lineWidth(1) // Ancho de la línea en puntos (opcional)
              .strokeColor('#000000') // Color negro para el borde
              .rect(x, startY, columns[i].width, rowHeight) // Reemplaza rowHeight por la altura de tu celda
              .stroke(); // Renderiza el contorno

            // 2. Renderizar el texto dentro de la celda
            doc
              .font('Helvetica')
              .fontSize(cellFontSizes[i])
              .fillColor('black')
              .text(rowCells[i], x + 3, startY + 3, {
                width: columns[i].width - 3,
                align: i === 2 || i === 3 || i === 8 ? 'center' : 'left',
              });
            x += columns[i].width;
          }

          startY += rowHeight;
        });

        // Pie de página: se dibuja en el pie de la última página sin crear una nueva.
        // Al relajar temporalmente el margen inferior, PDFKit no dispara nextSection().
        const footerY = doc.page.height - 45;
        const originalBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('black')
          .text('- SIN VALOR COMERCIAL -', TABLE_X, footerY, {
            width: TABLE_W,
            align: 'center',
          });
        doc.page.margins.bottom = originalBottomMargin;

        doc.end();
      });

      return filePDF;
    } catch (error) {
      this.logger.error({
        timestamp: new Date(),
        level: 'ERROR',
        message: 'Error generando PDF de donación',
        internalDetail: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        'Error generando PDF de donación: ' +
          (error instanceof Error ? error.message : String(error)),
        { cause: error },
      );
    }
  }

  async downloadCertificateDonationPDF(donationId: number) {
    try {
      const donation = await this.prismaService.donation.findUnique({
        where: { id: donationId },
        include: {
          institution: true,
          provider: true,
        },
      });

      if (!donation) {
        throw new Error('Donación no encontrada');
      }

      const filePDF = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

        const buffers: Uint8Array[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        );

        const NAVY = '#1B365D';
        const LIGHT = '#F4F7F9';
        const GRAY_TEXT = '#545454';

        const MONTHS = [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ];

        const date = donation.date;
        const fechaCorta = `${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
        const fechaLarga = `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;

        const consignatario =
          donation.institution?.name || donation.provider?.name || '—';

        const FRAME_X = 51.36;
        const FRAME_W = 494.04;
        const X_LEFT = 52.68;
        const RIGHT_X = 348.67;

        // Logo a la izquierda, arriba del marco (se omite si no está el asset)
        const logoLeft = loadLogo();
        if (logoLeft) {
          doc.image(logoLeft, 54.02, 10, { width: 200 });
        } else {
          this.logger.warn({
            timestamp: new Date(),
            level: 'WARN',
            message: 'No se pudo cargar el logotipo para el certificado',
          });
        }

        // Banda con el título
        doc.fillColor(NAVY).rect(50.88, 127.1, 494.16, 14.64).fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('white')
          .text('CERTIFICADO DE DONACIÓN DE SALUD', 50.88, 129.5, {
            width: 494.16,
            align: 'center',
          });

        // Caja con los datos de la donación
        doc.fillColor(LIGHT).rect(50.88, 141.62, 494.16, 58.2).fill();

        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('black')
          .text('Fundación Wayuu Taya', X_LEFT, 146, {
            width: 280,
          });

        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor('black')
          .text(fechaCorta, RIGHT_X, 144, { width: 190 });

        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('black')
          .text('Número de Donación: ', X_LEFT, 160, { continued: true });
        doc.font('Helvetica-Bold').text(donation.controlNumber);

        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('black')
          .text('Fecha: ', RIGHT_X, 160, { width: 180, continued: true });
        doc.font('Helvetica').text(fechaLarga, { width: 150 });

        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('black')
          .text('Consignatario: ', X_LEFT, 174, { continued: true });
        doc.font('Helvetica-Bold').text(consignatario);

        // Párrafo de certificación
        doc
          .font('Helvetica')
          .fontSize(11.5)
          .fillColor('black')
          .text(
            'Este documento certifica que La Fundación Wayuu Taya ha donado provisiones médicas al consignatario mencionado arriba. Este envío es un regalo de buena fé sin ninguna consideración de valor monetario de parte del que lo reciba con respecto al valor comercial de las provisiones médicas.',
            X_LEFT,
            266,
            { width: FRAME_W - 8, lineGap: 4, align: 'justify' },
          );

        // Firma
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('black')
          .text('Atentamente,', X_LEFT, 410);

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('black')
          .text('Roger Ibarra', FRAME_X, 444, {
            width: FRAME_W,
            align: 'center',
          });
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('black')
          .text('Gerente Regional Zulia', FRAME_X, 459, {
            width: FRAME_W,
            align: 'center',
          })
          .text('0412-5677012', FRAME_X, 474, {
            width: FRAME_W,
            align: 'center',
          })
          .text('roger@wayuutaya.org', FRAME_X, 489, {
            width: FRAME_W,
            align: 'center',
          });

        // Pie de página
        doc
          .font('Helvetica-Oblique')
          .fontSize(9)
          .fillColor(GRAY_TEXT)
          .text('FUNDACIÓN WAYUU TAYA  |  RIF J-30955405-0', FRAME_X, 511, {
            width: FRAME_W,
            align: 'center',
          });

        doc.end();
      });

      return filePDF;
    } catch (error) {
      this.logger.error({
        timestamp: new Date(),
        level: 'ERROR',
        message: 'Error generando certificado de donación',
        internalDetail: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        'Error generando certificado de donación: ' +
          (error instanceof Error ? error.message : String(error)),
        { cause: error },
      );
    }
  }

  async downloadDonationExcelTemplate(): Promise<Buffer> {
    try {
      const medicines = await this.prismaService.medicine.findMany({
        select: { name: true, presentation: true },
        orderBy: { name: 'asc' },
      });

      const formatMedicineLabel = (
        name: string,
        presentation?: string | null,
      ): string =>
        presentation && presentation.trim()
          ? `${name} - ${presentation.trim()}`
          : name;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Wayu Taya';

      const donationSheet = workbook.addWorksheet('Donacion', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      const headers = ['Medicina', 'Cantidad', 'Lote', 'Fecha de Expiración'];
      donationSheet.columns = [
        { header: headers[0], key: 'medicina', width: 48 },
        { header: headers[1], key: 'cantidad', width: 14 },
        { header: headers[2], key: 'lote', width: 18 },
        { header: headers[3], key: 'fechaExpiracion', width: 22 },
      ];

      donationSheet.getColumn(2).numFmt = '0';
      donationSheet.getColumn(4).numFmt = 'yyyy-mm-dd';

      donationSheet.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      donationSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0250B0' },
      };

      const exampleRows: any[] = [
        [
          'Acetaminofén - 100ml x 24 pastillas',
          100,
          'LOTE-001',
          new Date('2027-12-31'),
        ],
        ['', '', '', ''],
      ];
      exampleRows.forEach((row) => donationSheet.addRow(row));

      const medicinesSheet = workbook.addWorksheet('Medicinas', {
        state: 'visible',
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      medicinesSheet.columns = [
        { header: 'Medicina', key: 'medicine', width: 64 },
      ];
      medicinesSheet.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      medicinesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0250B0' },
      };

      medicines.forEach((med) => {
        medicinesSheet.addRow({
          medicine: formatMedicineLabel(med.name, med.presentation),
        });
      });

      if (medicines.length > 0) {
        const optionCount = medicines.length;
        const lastMedicineRow = optionCount + 1;
        const formula = `Medicinas!$A$2:$A$${lastMedicineRow}`;
        // Sugerencia no obligatoria: el desplegable muestra los medicamentos
        // registrados, pero se permite escribir cualquier nombre libremente.
        (donationSheet as any).dataValidations.add(`A2:A500`, {
          type: 'list',
          formulae: [formula],
          allowBlank: true,
          showErrorMessage: false,
        });
      }

      (workbook as any).views = [{ activeTab: 0 }];

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw error;
    }
  }
}
