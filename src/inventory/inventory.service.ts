/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
import {
  HistoryQueryDto,
  InventoryDto,
  InventoryMoveDto,
  InventoryOutDTO,
  GetInventoryQueryDto,
  AlertsQueryDto,
} from './inventory.dto';

/** Umbrales por defecto de las alertas, configurables por entorno. */
const DEFAULT_EXPIRY_WINDOW_DAYS =
  Number.parseInt(process.env.ALERTS_EXPIRY_DAYS ?? '30', 10) || 30;
const DEFAULT_MIN_STOCK =
  Number.parseInt(process.env.ALERTS_MIN_STOCK ?? '10', 10) || 0;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly logger: FileLoggerService,
  ) {}

  async getInventory(query?: GetInventoryQueryDto) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 100;

    const where: any = {};
    if (query?.storeId) {
      where.storeId = query.storeId;
    }
    if (query?.medicineId) {
      where.medicineId = query.medicineId;
    }
    if (query?.name) {
      where.medicine = {
        name: { contains: query.name, mode: 'insensitive' },
      };
    }

    const [paginatedGroups, total] = await Promise.all([
      this.prisma.inventory.groupBy({
        by: ['medicineId'],
        where,
        orderBy: { medicineId: 'asc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.inventory
        .groupBy({
          by: ['medicineId'],
          where,
        })
        .then((groups) => groups.length),
    ]);

    const medicineIds = paginatedGroups.map((g) => g.medicineId);

    const inventory = await this.prisma.inventory.findMany({
      where: {
        medicineId: { in: medicineIds },
        ...(query?.storeId ? { storeId: query.storeId } : {}),
        ...(query?.name
          ? {
              medicine: { name: { contains: query.name, mode: 'insensitive' } },
            }
          : {}),
      },
      include: {
        donation: true,
        medicine: true,
        store: true,
      },
    });

    const groupedByMedicine = inventory.reduce(
      (acc, item) => {
        const medicineId = item.medicine.id;
        if (!acc[medicineId]) {
          acc[medicineId] = {
            id: item.id,
            medicine: item.medicine,
            totalStock: 0,
            stores: [] as {
              id: number;
              name: string;
              address: string;
              amount: number;
              capacity: number;
              usedCapacity: number;
              availableCapacity: number;
              capacityPercentage: number;
            }[],
            datesMedicine: [],
            lotes: [] as {
              name: string;
              storeId: number;
              medicineId: number;
              expirationDate: Date;
              admissionDate: Date;
            }[],
            expirationSet: new Set<string>(),
          };
        }
        acc[medicineId].totalStock += item.stock;

        if (!acc[medicineId].stores.some((s) => s.id === item.store.id)) {
          const totalAmountStore = inventory
            .filter(
              (inv) =>
                inv.medicine.id === medicineId &&
                inv.store.id === item.store.id,
            )
            .reduce((sum, inv) => sum + inv.stock, 0);

          const storeUsed = inventory
            .filter((inv) => inv.store.id === item.store.id)
            .reduce((sum, inv) => sum + inv.stock, 0);
          const storeCapacity = item.store.capacity ?? 0;
          const storeAvailable = Math.max(storeCapacity - storeUsed, 0);
          const storePercentage =
            storeCapacity > 0
              ? Math.round((storeUsed / storeCapacity) * 10000) / 100
              : 0;

          acc[medicineId].stores.push({
            id: item.store.id,
            name: item.store.name,
            address: item.store.address,
            amount: totalAmountStore,
            capacity: storeCapacity,
            usedCapacity: storeUsed,
            availableCapacity: storeAvailable,
            capacityPercentage: storePercentage,
          });
        }

        // acc[medicineId].datesMedicine.push({
        //   admissionDate: item.admissionDate,
        //   expirationDate: item.expirationDate,
        // })

        const expDateStr = item.expirationDate.toISOString();
        if (!acc[medicineId].expirationSet.has(expDateStr)) {
          acc[medicineId].datesMedicine.push({
            admissionDate: item.admissionDate,
            expirationDate: item.expirationDate,
          });
          acc[medicineId].expirationSet.add(expDateStr);
        }

        if (
          !acc[medicineId].lotes.some(
            (lote) => lote.name === item.lote && lote.storeId === item.store.id,
          )
        ) {
          acc[medicineId].lotes.push({
            name: item.lote,
            storeId: item.store.id,
            medicineId: item.medicine.id,
            expirationDate: item.expirationDate,
            admissionDate: item.admissionDate,
          });
        }

        return acc;
      },
      {} as Record<
        number,
        {
          id: number;
          medicine: (typeof inventory)[number]['medicine'];
          totalStock: number;
          stores: {
            id: number;
            name: string;
            address: string;
            amount: number;
            capacity: number;
            usedCapacity: number;
            availableCapacity: number;
            capacityPercentage: number;
          }[];
          datesMedicine: any[];
          lotes: {
            name: string;
            storeId: number;
            medicineId: number;
            expirationDate: Date;
            admissionDate: Date;
          }[];
          expirationSet: Set<string>;
        }
      >,
    );

    const groupedInventory = Object.values(groupedByMedicine).map((item) => {
      const { expirationSet: _expirationSet, ...rest } = item;
      return rest;
    });

    return {
      inventory: groupedInventory,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  /**
   * Resumen agregado del inventario: total de unidades, desglose por almacén y
   * separación medicamento/producto. Se calcula con agregados de Prisma (sin
   * cargar filas) para no penalizar el tiempo de respuesta.
   */
  async getInventorySummary(query?: GetInventoryQueryDto) {
    const where: any = {};
    if (query?.storeId) {
      where.storeId = query.storeId;
    }
    if (query?.name) {
      where.medicine = {
        name: { contains: query.name, mode: 'insensitive' },
      };
    }

    // Una sola pasada agrupada por almacén + medicina: de aquí se derivan los
    // totales, el desglose por almacén y el de medicamento/producto.
    const groups = await this.prisma.inventory.groupBy({
      by: ['storeId', 'medicineId'],
      where,
      _sum: { stock: true },
      _count: { _all: true },
    });

    const medicineIds = [...new Set(groups.map((g) => g.medicineId))];

    const [stores, medicines] = await Promise.all([
      this.prisma.store.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          capacity: true,
          deleted: true,
        },
      }),
      medicineIds.length
        ? this.prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            select: { id: true, medicine: true },
          })
        : Promise.resolve([]),
    ]);

    const medicineFlagById = new Map<number, boolean>(
      medicines.map((m): [number, boolean] => [m.id, m.medicine]),
    );

    // Acumuladores por almacén y por medicina.
    const perStore = new Map<
      number,
      { items: number; records: number; medicines: Set<number> }
    >();
    const perMedicine = new Map<number, number>();

    let totalItems = 0;
    let totalRecords = 0;

    for (const group of groups) {
      const items = group._sum.stock ?? 0;
      const records = group._count._all;

      totalItems += items;
      totalRecords += records;

      const store = perStore.get(group.storeId) ?? {
        items: 0,
        records: 0,
        medicines: new Set<number>(),
      };
      store.items += items;
      store.records += records;
      store.medicines.add(group.medicineId);
      perStore.set(group.storeId, store);

      perMedicine.set(
        group.medicineId,
        (perMedicine.get(group.medicineId) ?? 0) + items,
      );
    }

    // Desglose medicamento vs producto (unidades y cantidad distinta).
    let medicamentosItems = 0;
    let medicamentosCount = 0;
    let productosItems = 0;
    let productosCount = 0;
    for (const [medicineId, items] of perMedicine) {
      if (medicineFlagById.get(medicineId) ?? false) {
        medicamentosItems += items;
        medicamentosCount += 1;
      } else {
        productosItems += items;
        productosCount += 1;
      }
    }

    // Se listan todos los almacenes activos (0 si no tienen stock) y cualquier
    // almacén con inventario aunque esté marcado como eliminado, para no ocultar
    // datos existentes.
    const byStore = stores
      .filter((store) => !store.deleted || perStore.has(store.id))
      .map((store) => {
        const accumulated = perStore.get(store.id);
        const items = accumulated?.items ?? 0;
        const usedCapacity = items;
        const capacity = store.capacity ?? 0;
        const availableCapacity = Math.max(capacity - usedCapacity, 0);
        const capacityPercentage =
          capacity > 0
            ? Math.round((usedCapacity / capacity) * 10000) / 100
            : 0;

        return {
          storeId: store.id,
          storeName: store.name,
          address: store.address,
          items,
          records: accumulated?.records ?? 0,
          medicines: accumulated?.medicines.size ?? 0,
          capacity,
          usedCapacity,
          availableCapacity,
          capacityPercentage,
        };
      })
      .sort((a, b) => b.items - a.items);

    return {
      totalItems,
      totalRecords,
      totalMedicines: medicineIds.length,
      medicamentos: { items: medicamentosItems, count: medicamentosCount },
      productos: { items: productosItems, count: productosCount },
      byStore,
    };
  }
  /*
        async createInventoryOld(inventory: InventoryDto) {
            try {
                // register for Inventory
                const dataInventory = inventory.medicines.map(item => {
                    return {
                        donationId: inventory.donationId,
                        medicineId: item.medicineId,
                        stock: item.stock,
                        storeId: item.storeId,
                        admissionDate: item.admissionDate,
                        expirationDate: item.expirationDate
                    }
                })
    
                await this.prisma.inventory.createMany({
                    data: dataInventory,
                });
    
                const dataHistorialInventory = dataInventory.map(item => {
                    return {
                        ...item,
                        type: inventory.type,
                        amount: item.stock,
                        date: new Date(),
                        observations: inventory.observations,
                    }
                })
    
                // register for History 
                await this.prisma.historyInventory.createMany({
                    data: dataHistorialInventory,
                });
    
                baseResponse.message = 'Guardado en el inventario exitosamente.';
                return baseResponse;
            } catch (error) {
                badResponse.message = 'Error guardar en el inventario: ' + (error instanceof Error ? error.message : String(error))
                return badResponse;
            }
        }
    */
  async getHistory(query?: HistoryQueryDto) {
    try {
      const page = query?.page ?? 1;
      const size = query?.size ?? 100;

      const where: any = {};
      if (query) {
        const fromDate =
          query.from && !isNaN(Date.parse(query.from.toString()))
            ? new Date(query.from)
            : null;
        const toDate =
          query.to && !isNaN(Date.parse(query.to.toString()))
            ? new Date(query.to)
            : null;

        if (fromDate || toDate) {
          where.date = {};
          if (fromDate) where.date.gte = fromDate;
          if (toDate) where.date.lte = toDate;
        }
      }

      const [history, total] = await Promise.all([
        this.prisma.historyInventory.findMany({
          where,
          orderBy: { date: 'desc' },
          skip: (page - 1) * size,
          take: size,
          include: {
            medicine: true,
            store: true,
            donation: true,
          },
        }),
        this.prisma.historyInventory.count({ where }),
      ]);

      return {
        history,
        pagination: {
          total,
          page,
          size,
          totalPages: Math.ceil(total / size),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Alertas de salud: lotes próximos a vencer y medicinas con stock bajo.
   * Umbrales por defecto configurables por env.
   */
  async getAlerts(query?: AlertsQueryDto) {
    const days = query?.days ?? DEFAULT_EXPIRY_WINDOW_DAYS;
    const minStock = query?.minStock ?? DEFAULT_MIN_STOCK;
    const storeId = query?.storeId;

    const now = new Date();
    const limitDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const storeFilter = storeId ? { storeId } : {};

    const [expiringLotes, lowStock] = await Promise.all([
      this.prisma.inventory.findMany({
        where: {
          ...storeFilter,
          stock: { gt: 0 },
          expirationDate: { lte: limitDate },
        },
        include: { medicine: true, store: true },
        orderBy: { expirationDate: 'asc' },
      }),
      this.prisma.inventory.groupBy({
        by: ['medicineId', 'storeId'],
        where: storeFilter,
        _sum: { stock: true },
        having: { stock: { _sum: { lt: minStock } } },
      }),
    ]);

    // Resuelve nombres de medicina/almacén en una sola consulta por tabla.
    const medicineIds = [...new Set(lowStock.map((l) => l.medicineId))];
    const storeIds = [...new Set(lowStock.map((l) => l.storeId))];

    const medicines: { id: number; name: string; presentation: string }[] =
      medicineIds.length
        ? await this.prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            select: { id: true, name: true, presentation: true },
          })
        : [];
    const stores: { id: number; name: string }[] = storeIds.length
      ? await this.prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true },
        })
      : [];

    const medicineById = new Map<
      number,
      { id: number; name: string; presentation: string }
    >();
    for (const m of medicines) medicineById.set(m.id, m);
    const storeById = new Map<number, { id: number; name: string }>();
    for (const s of stores) storeById.set(s.id, s);

    return {
      thresholds: { days, minStock },
      expiringLotes: expiringLotes.map((inv) => ({
        inventoryId: inv.id,
        medicineId: inv.medicineId,
        medicineName: inv.medicine?.name ?? null,
        storeId: inv.storeId,
        storeName: inv.store?.name ?? null,
        lote: inv.lote,
        stock: inv.stock,
        expirationDate: inv.expirationDate,
        daysToExpire: Math.ceil(
          (inv.expirationDate.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      })),
      lowStock: lowStock.map((row) => ({
        medicineId: row.medicineId,
        medicineName: medicineById.get(row.medicineId)?.name ?? null,
        presentation: medicineById.get(row.medicineId)?.presentation ?? null,
        storeId: row.storeId,
        storeName: storeById.get(row.storeId)?.name ?? null,
        totalStock: row._sum.stock ?? 0,
      })),
    };
  }

  private async runInventoryTransaction<T>(
    operation: (tx: any) => Promise<T>,
  ): Promise<T> {
    const attempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          timeout: 60_000,
          maxWait: 20_000,
          isolationLevel: 'Serializable',
        } as any);
      } catch (error) {
        lastError = error;
        const code = (error as { code?: string } | null)?.code;
        const retryable = code === 'P2034' || code === 'P2028';
        if (attempt < attempts && retryable) {
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              150 * attempt + Math.floor(Math.random() * 200),
            ),
          );
          continue;
        }
        throw error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('No se pudo completar la transacción de inventario.');
  }

  async processInventory(inventory: InventoryDto, tx?: any) {
    const prismaService = tx || this.prisma;
    const executor = tx
      ? async (cb: (trx: any) => Promise<any>) => cb(prismaService)
      : (cb: (trx: any) => Promise<any>) => this.runInventoryTransaction(cb);

    return await executor(async (trx) => {
      if (
        !Array.isArray(inventory.medicines) ||
        inventory.medicines.length === 0
      ) {
        throw new BadRequestException(
          'No hay medicinas para procesar en el inventario.',
        );
      }

      // Une líneas repetidas de la misma medicina/almacén/lote para que una
      // carga con duplicados no cree filas ni descuentos duplicados.
      const merged = new Map<string, (typeof inventory.medicines)[number]>();
      for (const item of inventory.medicines) {
        if (!Number.isInteger(item.stock) || item.stock <= 0) {
          throw new BadRequestException(
            `La cantidad de la medicina ${item.medicineId} debe ser un entero mayor a 0.`,
          );
        }
        if (!item.storeId || !item.medicineId) {
          throw new BadRequestException(
            'Cada movimiento debe incluir medicina y almacén.',
          );
        }
        const key = `${item.medicineId}|${item.storeId}|${item.lote ?? ''}`;
        const existing = merged.get(key);
        if (existing) {
          existing.stock += item.stock;
        } else {
          merged.set(key, { ...item });
        }
      }
      inventory = { ...inventory, medicines: [...merged.values()] };

      const isUpdate =
        inventory.observations?.includes(
          'Actualización con dependencias posteriores',
        ) ?? false;

      // La limpieza del historial de la actualización anterior debe ocurrir
      // ANTES de comprobar duplicados; de lo contrario un reintento de una
      // operación ya confirmada se rechaza como "ya aplicada".
      if (isUpdate) {
        await trx.historyInventory.deleteMany({
          where: {
            donationId: inventory.donationId,
            observations: 'Actualización con dependencias posteriores',
          },
        });
      }

      // Validación de duplicado exacto: donación ya procesada con mismos datos
      if (!isUpdate) {
        const duplicado = await trx.historyInventory.findMany({
          where: {
            donationId: inventory.donationId,
            type: inventory.type,
            date: inventory.date,
            observations: inventory.observations,
          },
        });

        if (
          duplicado.length > 0 &&
          duplicado.length === inventory.medicines.length
        ) {
          const coincide = duplicado.every((hist) => {
            const med = inventory.medicines.find(
              (m) =>
                m.medicineId === hist.medicineId &&
                m.storeId === hist.storeId &&
                (m.lote ?? '') === (hist.lote ?? ''),
            );
            return med && med.stock === hist.amount;
          });

          if (coincide) {
            throw new BadRequestException(
              'Esta acción de inventario ya fue aplicada con los mismos detalles.',
            );
          }
        }
      }

      const donationRow = await trx.donation.findUnique({
        where: { id: inventory.donationId },
        select: {
          id: true,
          controlNumber: true,
          type: true,
          date: true,
          lote: true,
        },
      });

      const lote = inventory.lote || donationRow?.lote;

      if (!lote)
        throw new Error('No se pudo determinar el lote de la donación.');

      // Snapshot legible (una consulta por catálogo) para que el log no
      // dependa de filas que luego se borran o cambian.
      const [medicineRows, storeRows] = await Promise.all([
        trx.medicine.findMany({
          where: {
            id: {
              in: [...new Set(inventory.medicines.map((m) => m.medicineId))],
            },
          },
          select: { id: true, name: true, code: true },
        }),
        trx.store.findMany({
          where: {
            id: { in: [...new Set(inventory.medicines.map((m) => m.storeId))] },
          },
          select: { id: true, name: true },
        }),
      ]);
      const donationRef = buildDonationRef(donationRow);
      const medicineById = new Map<number, any>(
        medicineRows.map((m) => [m.id, m]),
      );
      const storeById = new Map<number, any>(storeRows.map((s) => [s.id, s]));

      const historyData: any[] = [];
      const newInventoryRecords: any[] = [];
      const inventoryAudit: {
        action: string;
        entityId: number | null;
        medicineId: number;
        storeId: number;
        lote: string;
        movement: string;
        amount: number;
        before: unknown;
        after: unknown;
      }[] = [];

      for (const item of inventory.medicines) {
        const expectedLote = item.lote || lote;
        // Se relee por ítem: una línea anterior pudo haber cambiado el stock.
        const matchingRecords: any[] = await trx.inventory.findMany({
          where: {
            medicineId: item.medicineId,
            storeId: item.storeId,
            lote: expectedLote,
          },
          orderBy: { id: 'asc' },
        });
        const record = matchingRecords[0];
        const availableStock = matchingRecords.reduce(
          (sum, row) => sum + row.stock,
          0,
        );

        if (inventory.type === 'Entrada') {
          if (record) {
            const beforeStock = record.stock;
            await trx.inventory.update({
              where: { id: record.id },
              data: {
                stock: { increment: item.stock },
                updateAt: new Date(),
              },
            });

            inventoryAudit.push({
              action: 'UPDATE',
              entityId: record.id,
              medicineId: item.medicineId,
              storeId: record.storeId,
              lote: record.lote,
              movement: 'Entrada',
              amount: item.stock,
              before: { stock: beforeStock },
              after: { stock: beforeStock + item.stock },
            });

            historyData.push({
              medicineId: item.medicineId,
              storeId: item.storeId,
              donationId: inventory.donationId,
              amount: item.stock,
              type: 'Entrada',
              date: inventory.date,
              observations: inventory.observations || '',
              admissionDate: record.admissionDate,
              expirationDate: record.expirationDate,
              lote: record.lote,
            });
          } else {
            newInventoryRecords.push({
              donationId: inventory.donationId,
              medicineId: item.medicineId,
              storeId: item.storeId,
              stock: item.stock,
              admissionDate: item.admissionDate,
              expirationDate: item.expirationDate,
              lote: expectedLote,
            });

            historyData.push({
              medicineId: item.medicineId,
              storeId: item.storeId,
              donationId: inventory.donationId,
              amount: item.stock,
              type: 'Entrada',
              date: inventory.date,
              observations: inventory.observations || '',
              admissionDate: item.admissionDate,
              expirationDate: item.expirationDate,
              lote: expectedLote,
            });
          }
        } else if (inventory.type === 'Salida') {
          if (matchingRecords.length === 0) {
            throw new BadRequestException(
              `No se encontró inventario para la medicina ${item.medicineId} en el almacén ${item.storeId}.`,
            );
          }

          if (availableStock < item.stock) {
            throw new BadRequestException(
              `Stock insuficiente para la medicina ${item.medicineId}: disponible ${availableStock}, solicitado ${item.stock}.`,
            );
          }

          // Descuento atómico por fila. Si otra transacción consumió el stock
          // entre la lectura y el update, el updateMany no afecta filas y se
          // aborta para que la transacción se reintente.
          let remaining = item.stock;
          for (const row of matchingRecords) {
            if (remaining <= 0) break;
            const take = Math.min(row.stock, remaining);
            if (take <= 0) continue;

            const updated = await trx.inventory.updateMany({
              where: { id: row.id, stock: { gte: take } },
              data: {
                stock: { decrement: take },
                updateAt: new Date(),
              },
            });
            if (updated.count === 0) {
              throw new Error(
                'El stock cambió mientras se procesaba la salida. Intenta de nuevo.',
              );
            }

            if (row.stock - take === 0) {
              await trx.inventory.delete({ where: { id: row.id } });
            }
            remaining -= take;
          }

          if (remaining > 0) {
            throw new BadRequestException(
              `Stock insuficiente para la medicina ${item.medicineId}: no se pudieron descontar ${item.stock} unidades.`,
            );
          }

          inventoryAudit.push({
            action: availableStock === item.stock ? 'DELETE' : 'UPDATE',
            entityId: record.id,
            medicineId: item.medicineId,
            storeId: record.storeId,
            lote: record.lote,
            movement: 'Salida',
            amount: item.stock,
            before: { stock: availableStock },
            after: { stock: availableStock - item.stock },
          });

          historyData.push({
            medicineId: item.medicineId,
            storeId: item.storeId,
            donationId: inventory.donationId,
            amount: item.stock,
            type: 'Salida',
            date: inventory.date,
            observations: inventory.observations || '',
            admissionDate: record.admissionDate,
            expirationDate: record.expirationDate,
            lote: record.lote,
          });
        }
      }

      if (newInventoryRecords.length) {
        await trx.inventory.createMany({ data: newInventoryRecords });

        const createdInventory = await trx.inventory.findMany({
          where: {
            donationId: inventory.donationId,
            medicineId: { in: newInventoryRecords.map((r) => r.medicineId) },
          },
        });
        for (const rec of newInventoryRecords) {
          const createdRow = createdInventory.find(
            (c: any) =>
              c.medicineId === rec.medicineId &&
              c.storeId === rec.storeId &&
              c.lote === rec.lote,
          );
          inventoryAudit.push({
            action: 'CREATE',
            entityId: createdRow?.id ?? null,
            medicineId: rec.medicineId,
            storeId: rec.storeId,
            lote: rec.lote,
            movement: 'Entrada',
            amount: rec.stock,
            before: null,
            after: createdRow ?? rec,
          });
        }
      }
      if (historyData.length) {
        await trx.historyInventory.createMany({ data: historyData });
      }

      for (const entry of inventoryAudit) {
        const medicineRef = buildMedicineRef(
          medicineById.get(entry.medicineId),
        );
        const storeRef = buildStoreRef(storeById.get(entry.storeId));
        await this.auditService.record(
          {
            action: entry.action,
            entity: 'Inventory',
            entityId: entry.entityId,
            description: `${entry.movement} de ${entry.amount} unidades de ${medicineLabel(
              medicineRef,
            )} (lote ${entry.lote}, almacén ${storeLabel(
              storeRef,
            )}) — donación ${donationLabel(donationRef)}`,
            metadata: {
              movement: entry.movement,
              amount: entry.amount,
              medicineId: entry.medicineId,
              storeId: entry.storeId,
              lote: entry.lote,
              donationId: inventory.donationId,
              before: entry.before,
              after: entry.after,
              refs: buildRefs({
                donation: donationRef,
                medicine: medicineRef,
                store: storeRef,
              }),
            },
          },
          trx,
        );
      }

      if (historyData.length) {
        const createdHistory = await trx.historyInventory.findMany({
          where: {
            donationId: inventory.donationId,
            type: inventory.type,
            date: inventory.date,
            observations: inventory.observations || '',
          },
        });
        for (const h of createdHistory) {
          const medicineRef = buildMedicineRef(medicineById.get(h.medicineId));
          const storeRef = buildStoreRef(storeById.get(h.storeId));
          await this.auditService.record(
            {
              action: 'CREATE',
              entity: 'HistoryInventory',
              entityId: h.id,
              description: `Movimiento ${h.type} de ${h.amount} unidades de ${medicineLabel(
                medicineRef,
              )} (lote ${h.lote}, almacén ${storeLabel(
                storeRef,
              )}) — donación ${donationLabel(donationRef)}`,
              metadata: {
                before: null,
                after: h,
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                  store: storeRef,
                }),
              },
            },
            trx,
          );
        }
      }

      return {
        success: true,
        message: `Inventario procesado correctamente como ${inventory.type}`,
      };
    });
  }

  async revertInventoryWithHistory(tx: any, originalDonation: any) {
    interface HistoryRecord {
      id: number;
      medicineId: number;
      storeId: number;
      donationId: number;
      amount: number;
      type: string;
      date: Date;
      observations: string | null;
      admissionDate: Date;
      expirationDate: Date;
      createAt: Date;
      updateAt: Date;
      lote: string;
    }

    try {
      const allMovementRecords = (await tx.historyInventory.findMany({
        where: {
          donationId: originalDonation.id,
          deleted: false,
          type: { in: ['Entrada', 'Salida'] },
        },
        orderBy: { id: 'desc' },
      })) as HistoryRecord[];

      const updateRecords = allMovementRecords.filter((record) =>
        (record.observations ?? '').includes(
          'Actualización con dependencias posteriores',
        ),
      );
      const originalRecords = allMovementRecords.filter(
        (record) =>
          !(record.observations ?? '').includes(
            'Actualización con dependencias posteriores',
          ),
      );

      const lastReversion = await tx.historyInventory.findFirst({
        where: {
          donationId: originalDonation.id,
          deleted: false,
          type: { in: ['Reversión Entrada', 'Reversión Salida'] },
        },
        orderBy: { id: 'desc' },
        select: { id: true, createAt: true },
      });

      const latestAt = (records: HistoryRecord[]): Date | null =>
        records.reduce<Date | null>(
          (latest, record) =>
            !latest || record.createAt.getTime() > latest.getTime()
              ? record.createAt
              : latest,
          null,
        );

      const latestUpdateAt = latestAt(updateRecords);
      const latestOriginalAt = latestAt(originalRecords);

      // Los movimientos efectivos son la última actualización, salvo que una
      // reversión posterior los haya dejado sin efecto. Si no hay
      // actualización, se usan los originales con la misma comprobación.
      let effectiveRecords: HistoryRecord[];
      if (
        updateRecords.length > 0 &&
        (!lastReversion ||
          (latestUpdateAt != null &&
            latestUpdateAt.getTime() > lastReversion.createAt.getTime()))
      ) {
        effectiveRecords = updateRecords;
      } else if (
        lastReversion &&
        (latestUpdateAt == null ||
          lastReversion.createAt.getTime() >= latestUpdateAt.getTime())
      ) {
        effectiveRecords = [];
      } else {
        const alreadyReverted =
          lastReversion != null &&
          (latestOriginalAt == null ||
            lastReversion.createAt.getTime() >= latestOriginalAt.getTime());
        effectiveRecords = alreadyReverted ? [] : originalRecords;
      }

      if (effectiveRecords.length === 0) {
        return {
          success: true,
          message: 'No había movimientos efectivos por revertir.',
          shortfalls: {},
        };
      }

      const historyRecords = effectiveRecords;
      const donationRef = buildDonationRef(originalDonation);
      const [medicineRows, storeRows] = await Promise.all([
        tx.medicine.findMany({
          where: {
            id: { in: [...new Set(historyRecords.map((r) => r.medicineId))] },
          },
          select: { id: true, name: true, code: true },
        }),
        tx.store.findMany({
          where: {
            id: { in: [...new Set(historyRecords.map((r) => r.storeId))] },
          },
          select: { id: true, name: true },
        }),
      ]);
      const medicineById = new Map<number, any>(
        medicineRows.map((m) => [m.id, m]),
      );
      const storeById = new Map<number, any>(storeRows.map((s) => [s.id, s]));

      const groups: {
        medicineId: number;
        storeId: number;
        lote: string;
        records: HistoryRecord[];
      }[] = [];

      for (const record of historyRecords) {
        const group = groups.find(
          (g) =>
            g.medicineId === record.medicineId &&
            g.storeId === record.storeId &&
            g.lote === record.lote,
        );
        if (group) {
          group.records.push(record);
        } else {
          groups.push({
            medicineId: record.medicineId,
            storeId: record.storeId,
            lote: record.lote,
            records: [record],
          });
        }
      }

      const shortfalls: Record<number, number> = {};
      const shortfallsByKey: Record<string, number> = {};

      for (const { medicineId, storeId, lote, records } of groups) {
        const typedRecords = records;
        const medicineRef = buildMedicineRef(medicineById.get(medicineId));
        const storeRef = buildStoreRef(storeById.get(storeId));

        let netChange = 0;
        for (const record of typedRecords) {
          netChange +=
            record.type === 'Entrada' ? record.amount : -record.amount;
        }

        if (netChange === 0) {
          continue;
        }

        // Se leen TODAS las filas de inventario de esa clave: si el historial
        // antiguo dejó duplicados, la reversión no debe ajustar solo una.
        const currentRows: any[] = await tx.inventory.findMany({
          where: { medicineId, storeId, lote },
          orderBy: { id: 'asc' },
        });
        const currentInventory = currentRows[0];
        const currentStock = currentRows.reduce(
          (sum, row) => sum + row.stock,
          0,
        );

        const isEntryContribution = netChange > 0;
        let newStock = currentStock;
        let revertedAmount = 0;
        let shortfall = 0;

        if (isEntryContribution) {
          // Solo puede quitarse lo que aún existe; el resto ya fue consumido
          // o transferido y se reporta como faltante.
          revertedAmount = Math.min(netChange, currentStock);
          shortfall = netChange - revertedAmount;
          newStock = currentStock - revertedAmount;

          let remaining = revertedAmount;
          for (const row of currentRows) {
            if (remaining <= 0) break;
            const take = Math.min(row.stock, remaining);
            if (take <= 0) continue;
            if (take === row.stock) {
              await tx.inventory.delete({ where: { id: row.id } });
            } else {
              await tx.inventory.update({
                where: { id: row.id },
                data: {
                  stock: row.stock - take,
                  updateAt: new Date(),
                },
              });
            }
            remaining -= take;
          }
        } else {
          revertedAmount = Math.abs(netChange);
          newStock = currentStock + revertedAmount;

          if (currentInventory) {
            await tx.inventory.update({
              where: { id: currentInventory.id },
              data: {
                stock: { increment: revertedAmount },
                updateAt: new Date(),
              },
            });
          } else {
            // Si el inventario original ya no existe (p. ej. una salida que lo
            // consumió por completo), el stock restaurado debe colgar de la
            // donación de origen, no de la salida que se está revirtiendo.
            const sourceHistory = await tx.historyInventory.findFirst({
              where: {
                medicineId,
                storeId,
                lote,
                type: 'Entrada',
                deleted: false,
              },
              orderBy: { id: 'desc' },
            });
            await tx.inventory.create({
              data: {
                donationId: sourceHistory?.donationId ?? originalDonation.id,
                medicineId,
                storeId,
                lote,
                stock: newStock,
                admissionDate: typedRecords[0].admissionDate,
                expirationDate: typedRecords[0].expirationDate,
              },
            });
          }
        }

        if (newStock < 0) newStock = 0;

        if (shortfall > 0) {
          shortfalls[medicineId] = (shortfalls[medicineId] ?? 0) + shortfall;
          const key = `${medicineId}|${storeId}|${lote}`;
          shortfallsByKey[key] = (shortfallsByKey[key] ?? 0) + shortfall;
        }

        const observations =
          shortfall > 0
            ? `Reversión ajustada (${shortfall} unidades ya salidas/transferidas) | donación ${originalDonation.id}`
            : `Reversión de donación ${originalDonation.id}`;

        const reversionType = isEntryContribution
          ? 'Reversión Entrada'
          : 'Reversión Salida';
        const reversion = await tx.historyInventory.create({
          data: {
            medicineId,
            storeId,
            donationId: originalDonation.id,
            lote,
            amount: revertedAmount,
            type: reversionType,
            date: new Date(),
            observations,
            admissionDate: typedRecords[0].admissionDate,
            expirationDate: typedRecords[0].expirationDate,
          },
        });

        const inventoryAction = currentInventory
          ? newStock === 0
            ? 'DELETE'
            : 'UPDATE'
          : newStock > 0
            ? 'CREATE'
            : null;
        if (inventoryAction) {
          await this.auditService.record(
            {
              action: inventoryAction,
              entity: 'Inventory',
              entityId: currentInventory?.id ?? null,
              description: `${reversionType} de ${revertedAmount} unidades de ${medicineLabel(
                medicineRef,
              )} (lote ${lote}, almacén ${storeLabel(
                storeRef,
              )}) — donación ${donationLabel(donationRef)}`,
              metadata: {
                reversalType: reversionType,
                revertedAmount,
                shortfall,
                medicineId,
                storeId,
                lote,
                donationId: originalDonation.id,
                before: currentInventory ? { stock: currentStock } : null,
                after: { stock: newStock },
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
            action: 'CREATE',
            entity: 'HistoryInventory',
            entityId: reversion.id,
            description: `Movimiento ${reversionType} de ${revertedAmount} unidades de ${medicineLabel(
              medicineRef,
            )} (lote ${lote}, almacén ${storeLabel(
              storeRef,
            )}) — donación ${donationLabel(donationRef)}`,
            metadata: {
              before: null,
              after: reversion,
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

      return {
        success: true,
        message: 'Reversión completada exitosamente',
        shortfalls,
        shortfallsByKey,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Fallo en reversión por historial: ${message}`, {
        cause: error,
      });
    }
  }

  async transferMedicineBetweenStores(params: InventoryMoveDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const medicineIds = [
          ...new Set(params.movements.map((m) => m.medicineId)),
        ];
        const storeIds = [
          ...new Set(
            params.movements.flatMap((m) => [m.sourceStoreId, m.targetStoreId]),
          ),
        ];
        const [medicineRows, storeRows] = await Promise.all([
          tx.medicine.findMany({
            where: { id: { in: medicineIds } },
            select: { id: true, name: true, code: true },
          }),
          tx.store.findMany({
            where: { id: { in: storeIds } },
            select: { id: true, name: true },
          }),
        ]);
        const medicineById = new Map<number, any>(
          medicineRows.map((m) => [m.id, m]),
        );
        const storeById = new Map<number, any>(storeRows.map((s) => [s.id, s]));
        const donationRefCache = new Map<
          number,
          ReturnType<typeof buildDonationRef>
        >();
        const donationRefOf = async (donationId: number) => {
          if (donationRefCache.has(donationId)) {
            return donationRefCache.get(donationId);
          }
          const row = await tx.donation.findUnique({
            where: { id: donationId },
            select: {
              id: true,
              controlNumber: true,
              type: true,
              date: true,
              lote: true,
            },
          });
          const ref = buildDonationRef(row);
          donationRefCache.set(donationId, ref);
          return ref;
        };

        for (const movement of params.movements) {
          const { medicineId, sourceStoreId, quantity, targetStoreId } =
            movement;

          // Buscar la entrada en inventario desde el almacén fuente
          const sourceInventory = await tx.inventory.findFirst({
            where: {
              medicineId,
              storeId: sourceStoreId,
            },
          });

          if (!sourceInventory || sourceInventory.stock < quantity) {
            throw new Error(
              `Stock insuficiente en el almacén fuente (Medicina ID: ${medicineId}, Almacén ID: ${sourceStoreId}).`,
            );
          }

          const donationRef = await donationRefOf(sourceInventory.donationId);
          const medicineRef = buildMedicineRef(medicineById.get(medicineId));
          const sourceStoreRef = buildStoreRef(storeById.get(sourceStoreId));
          const targetStoreRef = buildStoreRef(storeById.get(targetStoreId));

          // Reducir stock del almacén fuente
          const sourceBefore = sourceInventory.stock;
          const reduceAmount = await tx.inventory.update({
            where: { id: sourceInventory.id },
            data: {
              stock: {
                decrement: quantity,
              },
            },
          });

          if (reduceAmount.stock == 0) {
            await tx.inventory.delete({
              where: { id: sourceInventory.id },
            });
          }

          await this.auditService.record(
            {
              action: reduceAmount.stock == 0 ? 'DELETE' : 'UPDATE',
              entity: 'Inventory',
              entityId: sourceInventory.id,
              description: `Transferencia: ${quantity} unidades de ${medicineLabel(
                medicineRef,
              )} desde almacén ${storeLabel(
                sourceStoreRef,
              )} hacia ${storeLabel(targetStoreRef)} — donación ${donationLabel(
                donationRef,
              )}`,
              metadata: {
                movement: 'Transferencia Salida',
                medicineId,
                storeId: sourceStoreId,
                lote: sourceInventory.lote,
                amount: quantity,
                targetStoreId,
                before: { stock: sourceBefore },
                after: { stock: reduceAmount.stock },
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                  store: sourceStoreRef,
                  targetStore: targetStoreRef,
                }),
              },
            },
            tx,
          );

          // Verificar si ya existe entrada en el almacén destino con mismo lote
          const destinationInventory = await tx.inventory.findFirst({
            where: {
              medicineId,
              storeId: targetStoreId,
              donationId: sourceInventory.donationId,
              lote: sourceInventory.lote,
              admissionDate: sourceInventory.admissionDate,
              expirationDate: sourceInventory.expirationDate,
            },
          });

          const destinationBefore = destinationInventory?.stock ?? 0;
          let destinationId: number | null;
          if (destinationInventory) {
            // Si existe, incrementar stock
            await tx.inventory.update({
              where: { id: destinationInventory.id },
              data: {
                stock: {
                  increment: quantity,
                },
              },
            });
            destinationId = destinationInventory.id;
          } else {
            // Si no existe, crear nueva entrada
            const createdDestination = await tx.inventory.create({
              data: {
                medicineId,
                storeId: targetStoreId,
                donationId: sourceInventory.donationId,
                lote: sourceInventory.lote,
                admissionDate: sourceInventory.admissionDate,
                expirationDate: sourceInventory.expirationDate,
                stock: quantity,
              },
            });
            destinationId = createdDestination.id;
          }

          await this.auditService.record(
            {
              action: destinationInventory ? 'UPDATE' : 'CREATE',
              entity: 'Inventory',
              entityId: destinationId,
              description: `Transferencia: ${quantity} unidades de ${medicineLabel(
                medicineRef,
              )} desde ${storeLabel(sourceStoreRef)} hacia almacén ${storeLabel(
                targetStoreRef,
              )} — donación ${donationLabel(donationRef)}`,
              metadata: {
                movement: 'Transferencia Entrada',
                medicineId,
                storeId: targetStoreId,
                lote: sourceInventory.lote,
                amount: quantity,
                sourceStoreId,
                before: destinationInventory
                  ? { stock: destinationBefore }
                  : null,
                after: { stock: destinationBefore + quantity },
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                  store: targetStoreRef,
                  targetStore: sourceStoreRef,
                }),
              },
            },
            tx,
          );

          // Registrar la transferencia en el historial: sin esto el stock
          // se mueve pero el historial no cuadra con el inventario.
          const transferDate = new Date();
          const transferOut = await tx.historyInventory.create({
            data: {
              medicineId,
              storeId: sourceStoreId,
              donationId: sourceInventory.donationId,
              amount: quantity,
              type: 'Transferencia Salida',
              date: transferDate,
              observations: `Transferencia al almacén ${targetStoreId}`,
              admissionDate: sourceInventory.admissionDate,
              expirationDate: sourceInventory.expirationDate,
              lote: sourceInventory.lote,
            },
          });
          const transferIn = await tx.historyInventory.create({
            data: {
              medicineId,
              storeId: targetStoreId,
              donationId: sourceInventory.donationId,
              amount: quantity,
              type: 'Transferencia Entrada',
              date: transferDate,
              observations: `Transferencia desde el almacén ${sourceStoreId}`,
              admissionDate: sourceInventory.admissionDate,
              expirationDate: sourceInventory.expirationDate,
              lote: sourceInventory.lote,
            },
          });

          await this.auditService.record(
            {
              action: 'CREATE',
              entity: 'HistoryInventory',
              entityId: transferOut.id,
              description: `Movimiento Transferencia Salida de ${quantity} unidades de ${medicineLabel(
                medicineRef,
              )} (lote ${sourceInventory.lote}, almacén ${storeLabel(
                sourceStoreRef,
              )}) — donación ${donationLabel(donationRef)}`,
              metadata: {
                before: null,
                after: transferOut,
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                  store: sourceStoreRef,
                }),
              },
            },
            tx,
          );
          await this.auditService.record(
            {
              action: 'CREATE',
              entity: 'HistoryInventory',
              entityId: transferIn.id,
              description: `Movimiento Transferencia Entrada de ${quantity} unidades de ${medicineLabel(
                medicineRef,
              )} (lote ${sourceInventory.lote}, almacén ${storeLabel(
                targetStoreRef,
              )}) — donación ${donationLabel(donationRef)}`,
              metadata: {
                before: null,
                after: transferIn,
                refs: buildRefs({
                  donation: donationRef,
                  medicine: medicineRef,
                  store: targetStoreRef,
                }),
              },
            },
            tx,
          );
        }

        return {
          success: true,
          message: 'Todas las transferencias fueron completadas con éxito.',
        };
      });
    } catch (error) {
      this.logger.error({
        timestamp: new Date(),
        level: 'ERROR',
        message: 'Error en la transferencia de inventario',
        internalDetail: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `No se pudo completar la transferencia: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  async removeInventory(data: InventoryOutDTO) {
    try {
      // find in the inventory the record
      const inventory = await this.prisma.inventory.findFirst({
        where: {
          medicineId: data.medicineId,
          storeId: data.storeId,
          ...(data.lote ? { lote: data.lote } : {}),
        },
      });

      if (!inventory) {
        throw new NotFoundException(
          'No se encontró el inventario para esta medicina y almacén.',
        );
      }

      const amount = data.amount;
      if (inventory.stock < amount) {
        throw new BadRequestException(
          `Cantidad insuficiente: hay ${inventory.stock}, se solicitó ${amount}`,
        );
      }

      const [medicineRow, storeRow, donationRow] = await Promise.all([
        this.prisma.medicine.findUnique({
          where: { id: data.medicineId },
          select: { id: true, name: true, code: true },
        }),
        this.prisma.store.findUnique({
          where: { id: data.storeId },
          select: { id: true, name: true },
        }),
        this.prisma.donation.findUnique({
          where: { id: inventory.donationId },
          select: {
            id: true,
            controlNumber: true,
            type: true,
            date: true,
            lote: true,
          },
        }),
      ]);
      const medicineRef = buildMedicineRef(medicineRow);
      const storeRef = buildStoreRef(storeRow);
      const donationRef = buildDonationRef(donationRow);

      //update or delete stock
      await this.prisma.$transaction(async (tx) => {
        const beforeStock = inventory.stock;
        if (inventory.stock - amount === 0) {
          // if stock is 0, delete the record
          await tx.inventory.delete({
            where: { id: inventory.id },
          });
        } else {
          // if theres still stock, decrement the amount
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              stock: { decrement: amount },
              updateAt: new Date(),
            },
          });
        }

        await this.auditService.record(
          {
            action: beforeStock - amount === 0 ? 'DELETE' : 'UPDATE',
            entity: 'Inventory',
            entityId: inventory.id,
            description: `Salida manual: ${amount} unidades de ${medicineLabel(
              medicineRef,
            )} (lote ${inventory.lote}, almacén ${storeLabel(
              storeRef,
            )}) — donación ${donationLabel(donationRef)}`,
            metadata: {
              movement: 'Salida',
              medicineId: data.medicineId,
              storeId: data.storeId,
              lote: inventory.lote,
              amount,
              observations: data.observations,
              before: { stock: beforeStock },
              after: { stock: beforeStock - amount },
              refs: buildRefs({
                donation: donationRef,
                medicine: medicineRef,
                store: storeRef,
              }),
            },
          },
          tx,
        );

        // register in history
        const history = await tx.historyInventory.create({
          data: {
            medicineId: data.medicineId,
            storeId: data.storeId,
            donationId: inventory.donationId,
            amount: data.amount,
            type: 'Salida',
            date: new Date(),
            observations: data.observations,
            admissionDate: inventory.admissionDate,
            expirationDate: inventory.expirationDate,
            lote: inventory.lote,
          },
        });

        await this.auditService.record(
          {
            action: 'CREATE',
            entity: 'HistoryInventory',
            entityId: history.id,
            description: `Movimiento Salida de ${amount} unidades de ${medicineLabel(
              medicineRef,
            )} (lote ${inventory.lote}, almacén ${storeLabel(
              storeRef,
            )}) — donación ${donationLabel(donationRef)}`,
            metadata: {
              before: null,
              after: history,
              refs: buildRefs({
                donation: donationRef,
                medicine: medicineRef,
                store: storeRef,
              }),
            },
          },
          tx,
        );
      });

      return { message: 'Salida registrada correctamente del inventario.' };
    } catch (error) {
      throw error;
    }
  }
}
