import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DonationsDTO,
  DetDonationDTO,
  GetDonationsQueryDTO,
} from './donations.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { AuditService } from 'src/audit/audit.service';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DonationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

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
    excludeId?: number,
  ): Promise<void> {
    const existing = await tx.donation.count({
      where: {
        controlNumber,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing > 0) {
      throw new ConflictException(
        `El número de control "${controlNumber}" ya existe en otra donación.`,
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

  private sumBenefited(dets: DetDonationDTO[]): number {
    return dets.reduce((sum, det) => sum + (det.benefited ?? 0), 0);
  }

  private async resolveMedicines(
    tx: any,
    dets: DetDonationDTO[],
  ): Promise<(DetDonationDTO & { medicineId: number })[]> {
    const [medicines, categories, forms] = await Promise.all([
      tx.medicine.findMany({ select: { id: true, name: true, code: true } }),
      tx.category.findMany(),
      tx.forms.findMany(),
    ]);

    const categoriesByKey = new Map<string, any>(
      categories.map((c: any) => [this.normalizeSearchKey(c.category), c]),
    );
    const formsByKey = new Map<string, any>(
      forms.map((f: any) => [this.normalizeSearchKey(f.forms), f]),
    );

    const resolved: (DetDonationDTO & { medicineId: number })[] = [];

    for (const det of dets) {
      if (det.medicineId) {
        const existing = medicines.find((m) => m.id === det.medicineId);
        if (existing) {
          resolved.push({ ...det, medicineId: existing.id });
          continue;
        }
      }

      const name = det.medicine?.name;
      if (!name)
        throw new Error(
          'Cada detalle debe incluir medicineId o el nombre de la medicina (medicine.name).',
        );

      const normalizedName = this.normalizeText(name);
      const match = medicines.find(
        (m) =>
          (det.medicine?.code && m.code && det.medicine.code === m.code) ||
          this.normalizeText(m.name) === normalizedName,
      );
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
        formId = 14;
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

      medicines.push({ id: created.id, name, code: created.code });
      resolved.push({ ...det, medicineId: created.id });
    }

    return resolved;
  }

  async getDonations(query?: GetDonationsQueryDTO) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 100;

    const where: any = {};
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
        },
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
              medicineId: { in: medicineIds },
              lote: { in: lotes },
            },
          })
        : [];

    // what got from inv >tie to> donations thingamajig
    const donationsWithDates = donations.map((donation) => {
      const batches: { medicineId: number; lote: string; storeId?: number }[] =
        [];

      const detDonationsWithDates = donation.detDonation.map((det) => {
        const lote = det.lote || donation.lote;

        const inventoryRecord =
          inventories.find(
            (inv) =>
              inv.donationId === donation.id &&
              inv.medicineId === det.medicineId &&
              inv.lote === lote,
          ) ??
          inventories.find(
            (inv) =>
              inv.donationId === donation.id &&
              inv.medicineId === det.medicineId &&
              inv.storeId === (det as any).storageId,
          ) ??
          inventories.find(
            (inv) =>
              inv.donationId === donation.id &&
              inv.medicineId === det.medicineId,
          );

        const historyRecord =
          histories.find(
            (h) =>
              h.donationId === donation.id &&
              h.medicineId === det.medicineId &&
              h.lote === lote,
          ) ??
          histories.find(
            (h) =>
              h.donationId === donation.id && h.medicineId === det.medicineId,
          );

        const storeId = inventoryRecord?.storeId ?? historyRecord?.storeId;
        batches.push({ medicineId: det.medicineId, lote, storeId });

        return {
          ...det,
          admissionDate:
            inventoryRecord?.admissionDate ?? historyRecord?.admissionDate,
          expirationDate:
            inventoryRecord?.expirationDate ?? historyRecord?.expirationDate,
        };
      });

      const matchedOutflows = outflowRecords.filter(
        (h) =>
          h.donationId !== donation.id &&
          h.date.getTime() >= donation.date.getTime() &&
          batches.some(
            (b) =>
              b.medicineId === h.medicineId &&
              b.lote === h.lote &&
              (b.storeId == null || b.storeId === h.storeId),
          ),
      );

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
      for (const h of matchedOutflows) {
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
      const newDonation = await this.prismaService.$transaction(
        async (tx) => {
          await this.validateControlNumberUnique(tx, donation.controlNumber);
          this.validateBenefitedForType(donation);

          const medicinesResolved: (DetDonationDTO & { medicineId: number })[] =
            await this.resolveMedicines(tx, donation.medicines);

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
          });

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
              description: `Donación ${donationCreated.controlNumber} (${donationCreated.type}) creada`,
              metadata: {
                before: null,
                after: donationCreated,
                payload: donation,
              },
            },
            tx,
          );

          const createdDets = await tx.detDonation.findMany({
            where: { donationId: donationCreated.id },
          });
          for (const det of createdDets) {
            await this.auditService.record(
              {
                action: 'CREATE',
                entity: 'DetDonation',
                entityId: det.id,
                description: `Detalle de donación ${donationCreated.id} (medicina ${det.medicineId})`,
                metadata: { before: null, after: det },
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
        },
        { timeout: 30000, maxWait: 20000 },
      );

      return {
        donation: newDonation,
        message: 'Donación registrada exitosamente.',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(
        'Error al crear la donación: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async updateDonation(id: number, donation: DonationsDTO) {
    try {
      return await this.prismaService.$transaction(
        async (tx) => {
          const originalDonation = await tx.donation.findUnique({
            where: { id },
            include: {
              detDonation: true,
              historyInventory: true,
            },
          });

          if (!originalDonation) throw new Error('Donación no encontrada');

          await this.validateControlNumberUnique(
            tx,
            donation.controlNumber,
            id,
          );
          this.validateBenefitedForType(donation);

          const medicinesResolved: (DetDonationDTO & { medicineId: number })[] =
            await this.resolveMedicines(tx, donation.medicines);

          let revertedShortfalls: Record<number, number> = {};
          if (donation.changeDonDetails === true) {
            const revertResult =
              await this.inventoryService.revertInventoryWithHistory(
                tx,
                originalDonation,
              );
            revertedShortfalls = revertResult.shortfalls ?? {};
          }

          const posteriores = await tx.historyInventory.findMany({
            where: {
              medicineId: { in: medicinesResolved.map((m) => m.medicineId) },
              storeId: { in: medicinesResolved.map((m) => m.storageId) },
              donationId: { not: id },
              createAt: { gt: originalDonation.updateAt },
            },
          });

          const updatedDonationType = donation.type || originalDonation.type;

          for (const med of medicinesResolved) {
            const consumoPosterior = posteriores
              .filter(
                (h) =>
                  h.medicineId === med.medicineId &&
                  h.storeId === med.storageId,
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
            date: donation.date,
            controlNumber: donation.controlNumber,
            benefited: this.sumBenefited(medicinesResolved),
            updateAt: new Date(),
          };
          if (donation.changeDonDetails) updateData.lote = donation.lote;

          const updatedDonation = await tx.donation.update({
            where: { id },
            data: updateData,
          });

          if (donation.changeDonDetails) {
            for (const med of medicinesResolved) {
              const shortfall = revertedShortfalls[med.medicineId] ?? 0;
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
              .map((med) => ({
                medicineId: med.medicineId,
                storeId: med.storageId,
                stock: med.amount - (revertedShortfalls[med.medicineId] ?? 0),
                admissionDate: donation.date,
                expirationDate: med.expirationDate,
                lote: med.lote,
              }))
              .filter((med) => med.stock > 0);

            if (inventoryMedicines.length > 0) {
              const inventoryDto = {
                donationId: updatedDonation.id,
                lote: updatedDonation.lote,
                medicines: inventoryMedicines,
                type: updatedDonation.type,
                date: updatedDonation.date,
                observations: 'Actualización con dependencias posteriores',
              };

              const result = await this.inventoryService.processInventory(
                inventoryDto,
                tx,
              );
              if (!result.success)
                throw new BadRequestException(result.message);
            }
          }

          await this.auditService.record(
            {
              action: 'UPDATE',
              entity: 'Donation',
              entityId: updatedDonation.id,
              description: `Donación ${updatedDonation.controlNumber} (${updatedDonation.type}) actualizada`,
              metadata: {
                before: originalDonation,
                after: updatedDonation,
                payload: donation,
              },
            },
            tx,
          );

          if (donation.changeDonDetails) {
            for (const det of originalDonation.detDonation) {
              await this.auditService.record(
                {
                  action: 'DELETE',
                  entity: 'DetDonation',
                  entityId: det.id,
                  description: `Detalle previo eliminado de donación ${id} (medicina ${det.medicineId})`,
                  metadata: { before: det, after: null },
                },
                tx,
              );
            }

            const newDets = await tx.detDonation.findMany({
              where: { donationId: id },
            });
            for (const det of newDets) {
              await this.auditService.record(
                {
                  action: 'CREATE',
                  entity: 'DetDonation',
                  entityId: det.id,
                  description: `Detalle nuevo de donación ${id} (medicina ${det.medicineId})`,
                  metadata: { before: null, after: det },
                },
                tx,
              );
            }
          }

          return {
            success: true,
            message: 'Donación actualizada correctamente.',
            data: updatedDonation,
          };
        },
        { timeout: 30000, maxWait: 20000 },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error desconocido en actualización de donación.',
      );
    }
  }

  async deleteDonation(id: number) {
    try {
      return await this.prismaService.$transaction(
        async (tx) => {
          // Obtener la donación con todos sus datos relacionados
          const donation = await tx.donation.findUnique({
            where: { id },
            include: {
              detDonation: true,
              historyInventory: true, // Asegurarnos de tener datos históricos
            },
          });

          if (!donation) {
            throw new BadRequestException('Donación no encontrada');
          }

          // Revertir inventario usando datos históricos
          await this.inventoryService.revertInventoryWithHistory(tx, donation);

          const inventoriesToDelete = await tx.inventory.findMany({
            where: { donationId: id },
          });

          // Eliminar registros relacionados en orden seguro
          await tx.historyInventory.deleteMany({
            where: { donationId: id },
          });

          await tx.detDonation.deleteMany({
            where: { donationId: id },
          });

          await tx.inventory.deleteMany({
            where: { donationId: id },
          });

          // Finalmente borrar la donación principal
          const deletedDonation = await tx.donation.delete({
            where: { id },
          });

          for (const det of donation.detDonation) {
            await this.auditService.record(
              {
                action: 'DELETE',
                entity: 'DetDonation',
                entityId: det.id,
                description: `Detalle eliminado de donación ${id} (medicina ${det.medicineId})`,
                metadata: { before: det, after: null },
              },
              tx,
            );
          }
          for (const hist of donation.historyInventory) {
            await this.auditService.record(
              {
                action: 'DELETE',
                entity: 'HistoryInventory',
                entityId: hist.id,
                description: `Historial de inventario eliminado de donación ${id}`,
                metadata: { before: hist, after: null },
              },
              tx,
            );
          }
          for (const inv of inventoriesToDelete) {
            await this.auditService.record(
              {
                action: 'DELETE',
                entity: 'Inventory',
                entityId: inv.id,
                description: `Inventario eliminado de donación ${id}`,
                metadata: { before: inv, after: null },
              },
              tx,
            );
          }
          await this.auditService.record(
            {
              action: 'DELETE',
              entity: 'Donation',
              entityId: deletedDonation.id,
              description: `Donación ${deletedDonation.controlNumber} eliminada`,
              metadata: { before: donation, after: null },
            },
            tx,
          );

          return {
            success: true,
            message:
              'Donación eliminada y cambios en inventario revertidos correctamente.',
            data: deletedDonation,
          };
        },
        { timeout: 30000, maxWait: 20000 },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(
        'Error al eliminar la donación: ' +
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

        // Logo a la derecha
        try {
          doc.image('src/assets/logo.png', TABLE_X + TABLE_W - LOGO_W, 10, {
            width: LOGO_W,
          });
        } catch (err) {
          console.warn('No se pudo cargar el logotipo:', err);
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
      console.error('Error generando PDF de donación:', error);
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

        // Logo a la izquierda, arriba del marco
        try {
          doc.image('src/assets/logo.png', 54.02, 10, { width: 200 });
        } catch (err) {
          console.warn('No se pudo cargar el logotipo:', err);
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
      console.error('Error generando certificado de donación:', error);
      throw new Error(
        'Error generando certificado de donación: ' +
          (error instanceof Error ? error.message : String(error)),
        { cause: error },
      );
    }
  }

  async downloadDonationExcelTemplate(res: any) {
    try {
      const medicines = await this.prismaService.medicine.findMany({
        select: { name: true, presentation: true },
        orderBy: { name: 'asc' },
      });

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
        ['Acetaminofén', 100, 'LOTE-001', new Date('2027-12-31')],
        ['', '', '', ''],
      ];
      exampleRows.forEach((row) => donationSheet.addRow(row));

      const medicinesSheet = workbook.addWorksheet('Medicinas', {
        state: 'visible',
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      medicinesSheet.columns = [
        { header: 'Medicina', key: 'medicine', width: 42 },
        { header: 'Presentación', key: 'presentation', width: 32 },
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
          medicine: med.name,
          presentation: med.presentation || '',
        });
      });

      if (medicines.length > 0) {
        const optionCount = medicines.length;
        const lastMedicineRow = optionCount + 1;
        const formula = `Medicinas!$A$2:$A$${lastMedicineRow}`;
        (donationSheet as any).dataValidations.add(`A2:A500`, {
          type: 'list',
          formulae: [formula],
          allowBlank: true,
          showErrorMessage: true,
          error: 'Selecciona una medicina de la lista o escribe una nueva.',
          errorTitle: 'Medicina no válida',
        });
      }

      (workbook as any).views = [{ activeTab: 0 }];

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="donacion_plantilla.xlsx"',
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      throw error;
    }
  }
}
