/* eslint-disable no-useless-catch */
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import {
  MedicineDTO,
  MedicineFormatExcel,
  GetMedicineQueryDTO,
  CategoryDTO,
  FormsDTO,
} from './medicine.dto';
import {
  medicineImportRowSchema,
  MedicineImportRowError,
} from './dto/medicine-import.schema';
import * as ExcelJS from 'exceljs';

const MEDICINE_EXCEL_FIELDS = {
  code: 'Codigo',
  name: 'Nombre',
  presentation: 'Presentacion',
  form: 'Forma',
  category: 'Categoria',
  medicine: 'Medicina',
  lote: 'Lote (base)',
  temperate: 'Temperatura',
  manufacturer: 'Fabricante',
  provider: 'Proveedor',
  activeIngredient: 'Principio Activo',
  countryOfOrigin: 'Pais Origen',
  description: 'Descripcion',
} as const;

type MedicineExcelField = keyof typeof MEDICINE_EXCEL_FIELDS;

@Injectable()
export class MedicineService {
  constructor(
    private prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}
  async getMedicine(query?: GetMedicineQueryDTO) {
    const page = query?.page ?? 1;
    const size = query?.size ?? 100;

    const where: any = {};
    if (query?.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    const [medicines, total] = await Promise.all([
      this.prismaService.medicine.findMany({
        where,
        include: {
          category: true,
          form: true,
        },
        orderBy: { id: 'asc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prismaService.medicine.count({ where }),
    ]);

    return {
      medicines,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }
  async getCategory() {
    const categories = await this.prismaService.category.findMany();

    return { categories };
  }
  async getForms() {
    const forms = await this.prismaService.forms.findMany();

    return { forms };
  }

  private toTitleCase(value: string): string {
    const collapsed = value.trim().replace(/\s+/g, ' ');
    return collapsed.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private normalizeSearchKey(value: string): string {
    return this.normalizeText(value).replace(/\s+/g, ' ');
  }

  /** Normaliza un código para compararlo (trim, conservando el valor real). */
  private normalizeCode(code?: string | null): string | null {
    const normalized = code?.trim();
    return normalized ? normalized : null;
  }

  /** Clave case-insensitive para comparar códigos en memoria. */
  private codeKey(code?: string | null): string | null {
    return this.normalizeCode(code)?.toLowerCase() ?? null;
  }

  /**
   * Evita códigos repetidos entre medicinas. Un código vacío/nulo no se valida
   * porque es opcional; la comparación ignora espacios y mayúsculas.
   */
  private async assertCodeAvailable(
    tx: any,
    code: string | null | undefined,
    excludeId?: number,
  ): Promise<void> {
    const normalized = this.normalizeCode(code);
    if (!normalized) return;

    const existing = (await tx.medicine.findFirst({
      where: {
        code: { equals: normalized, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true },
    })) as { id: number; name: string } | null;

    if (existing) {
      throw new ConflictException(
        `Ya existe una medicina con el código "${normalized}" (${existing.name}).`,
      );
    }
  }

  private async resolveCategory(value: string, tx: any): Promise<number> {
    const label = value?.trim() || 'General';
    const key = this.normalizeSearchKey(label);
    // 1) Coincidencia exacta insensible a mayúsculas (consulta dirigida).
    const exact = await tx.category.findFirst({
      where: { category: { equals: label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (exact) return exact.id;
    // 2) Coincidencia insensible a acentos sobre el catálogo (pequeño).
    const categories = await tx.category.findMany({
      select: { id: true, category: true },
    });
    const existing = categories.find(
      (c: any) => this.normalizeSearchKey(c.category) === key,
    );
    if (existing) return existing.id;
    const created = await tx.category.create({
      data: { category: this.toTitleCase(label) },
    });
    return created.id;
  }

  private async resolveForm(
    value: string | undefined,
    tx: any,
  ): Promise<number> {
    const label = value?.trim() || 'No especificada';
    const key = this.normalizeSearchKey(label);
    const exact = await tx.forms.findFirst({
      where: { forms: { equals: label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (exact) return exact.id;
    const forms = await tx.forms.findMany({
      select: { id: true, forms: true },
    });
    const existing = forms.find(
      (f: any) => this.normalizeSearchKey(f.forms) === key,
    );
    if (existing) return existing.id;

    // Nunca se usa un id fijo: si el catálogo está vacío esta misma consulta
    // crea la forma por defecto y la FK queda satisfecha.
    const created = await tx.forms.create({
      data: { forms: this.toTitleCase(label) },
    });
    return created.id;
  }

  async createMedicine(medicine: MedicineDTO) {
    try {
      // Resolución de categoría/forma y escritura en una sola transacción:
      // si algo falla, no quedan categorías/formas huérfanas creadas.
      const medicineCreated = await this.prismaService.$transaction(
        async (tx) => {
          const [categoryId, formId] = await Promise.all([
            this.resolveCategory(medicine.category, tx),
            this.resolveForm(medicine.form, tx),
          ]);

          await this.assertCodeAvailable(tx, medicine.code);

          return tx.medicine.create({
            data: {
              name: medicine.name,
              description: medicine.description,
              code: medicine.code,
              lote: medicine.lote,
              categoryId,
              medicine: medicine.medicine,
              provider: medicine.provider ? medicine.provider : '',
              presentation: medicine.presentation ? medicine.presentation : '',
              temperate: medicine.temperate ? medicine.temperate : '',
              manufacturer: medicine.manufacturer ? medicine.manufacturer : '',
              activeIngredient: medicine.activeIngredient
                ? medicine.activeIngredient
                : '',
              countryOfOrigin: medicine.countryOfOrigin
                ? medicine.countryOfOrigin
                : '',
              formId,
            },
          });
        },
      );

      await this.auditService.record({
        action: 'CREATE',
        entity: 'Medicine',
        entityId: medicineCreated.id,
        description: `Medicina "${medicineCreated.name}" creada`,
        metadata: { before: null, after: medicineCreated, payload: medicine },
      });
      return {
        medicine: medicineCreated,
        message: 'Medicina creada exitosamente.',
      };
    } catch (error) {
      throw error;
    }
  }

  async updateMedicine(id: number, medicine: MedicineDTO) {
    try {
      const before = await this.prismaService.medicine.findUnique({
        where: { id },
      });

      const medicineUpdated = await this.prismaService.$transaction(
        async (tx) => {
          const [categoryId, formId] = await Promise.all([
            this.resolveCategory(medicine.category, tx),
            this.resolveForm(medicine.form, tx),
          ]);

          await this.assertCodeAvailable(tx, medicine.code, id);

          return tx.medicine.update({
            data: {
              name: medicine.name,
              description: medicine.description,
              code: medicine.code,
              lote: medicine.lote,
              categoryId,
              medicine: medicine.medicine,
              provider: medicine.provider ? medicine.provider : '',
              presentation: medicine.presentation ? medicine.presentation : '',
              temperate: medicine.temperate ? medicine.temperate : '',
              manufacturer: medicine.manufacturer ? medicine.manufacturer : '',
              activeIngredient: medicine.activeIngredient
                ? medicine.activeIngredient
                : '',
              countryOfOrigin: medicine.countryOfOrigin
                ? medicine.countryOfOrigin
                : '',
              formId,
            },
            where: { id: id },
          });
        },
      );

      await this.auditService.record({
        action: 'UPDATE',
        entity: 'Medicine',
        entityId: medicineUpdated.id,
        description: `Medicina "${medicineUpdated.name}" actualizada`,
        metadata: { before, after: medicineUpdated, payload: medicine },
      });

      return {
        medicine: medicineUpdated,
        message: 'Medicina actualizada exitosamente.',
      };
    } catch (error) {
      throw error;
    }
  }
  //Categoria
  async updateCategory(id: number, category: CategoryDTO) {
    try {
      const categoryUpdated = await this.prismaService.category.update({
        data: {
          category: category.category,
        },
        where: { id: id },
      });

      return {
        category: categoryUpdated,
        message: 'Categoría actualizada exitosamente',
      };
    } catch (error) {
      throw error;
    }
  }
  //Formas
  async updateForms(id: number, forms: FormsDTO) {
    try {
      const formUpdated = await this.prismaService.forms.update({
        data: {
          forms: forms.forms,
        },
        where: { id: id },
      });

      return { form: formUpdated, message: 'Forma actualizada exitosamente' };
    } catch (error) {
      throw error;
    }
  }
  async deleteMedicine(id: number) {
    try {
      const before = await this.prismaService.medicine.findUnique({
        where: { id },
      });
      const medicineDeleted = await this.prismaService.medicine.delete({
        where: { id: id },
      });

      await this.auditService.record({
        action: 'DELETE',
        entity: 'Medicine',
        entityId: medicineDeleted.id,
        description: `Medicina "${medicineDeleted.name}" eliminada`,
        metadata: { before, after: null },
      });

      return {
        medicine: medicineDeleted,
        message: 'Medicina/Producto eliminado exitosamente',
      };
    } catch (error) {
      throw error;
    }
  }

  //categoria
  async deleteCategory(id: number) {
    try {
      const categoryDeleted = await this.prismaService.category.delete({
        where: { id: id },
      });

      return {
        category: categoryDeleted,
        message: 'Categoría eliminado exitosamente',
      };
    } catch (error) {
      throw error;
    }
  }

  //formas
  async deleteForms(id: number) {
    try {
      const formDeleted = await this.prismaService.forms.delete({
        where: { id: id },
      });

      return { form: formDeleted, message: 'Forma eliminada exitosamente' };
    } catch (error) {
      throw error;
    }
  }

  async downloadExcelTemplate(): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Medicinas');

      const columns = Object.keys(
        MEDICINE_EXCEL_FIELDS,
      ) as MedicineExcelField[];
      const headers = columns.map((key) => MEDICINE_EXCEL_FIELDS[key]);
      worksheet.addRow(headers);

      const exampleRows: Record<MedicineExcelField, string>[] = [
        {
          code: '0001',
          name: 'Acetaminofén',
          presentation: '325mg / Fenilefrina 5mg · 24 cápsulas',
          form: 'Caja',
          category: 'Analgésico',
          medicine: 'Si',
          lote: 'L2024-001',
          temperate: 'Ambiente',
          manufacturer: 'Rugby Laboratories',
          provider: 'Proveedor Ejemplo',
          activeIngredient: 'Acetaminophen, Phenylephrine HCl',
          countryOfOrigin: 'UNITED STATES',
          description: 'FIEBRE - DOLOR - CONGESTION NASAL',
        },
        {
          code: '0002',
          name: 'Ibuprofeno',
          presentation: '400mg · 20 comprimidos',
          form: 'Empaque',
          category: 'Antiinflamatorio',
          medicine: 'Si',
          lote: 'L2024-002',
          temperate: 'Ambiente',
          manufacturer: 'Pfizer',
          provider: 'Proveedor Ejemplo 2',
          activeIngredient: 'Ibuprofeno',
          countryOfOrigin: 'VE',
          description: 'Esto es para el dolor muscular',
        },
      ];
      exampleRows.forEach((row) =>
        worksheet.addRow(columns.map((key) => row[key] ?? '')),
      );

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw error;
    }
  }

  async uploadExcel(file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new ConflictException(
        'No se recibió ningún archivo. Selecciona un Excel e intenta de nuevo.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(Buffer.from(file.buffer) as any);
    } catch {
      throw new ConflictException(
        'El archivo no es un Excel válido o está dañado.',
      );
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new ConflictException(
        'El archivo no contiene ninguna hoja de cálculo.',
      );
    }

    const rawRows: { data: MedicineFormatExcel; row: number }[] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        headers = [];
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value || '').trim();
        });
        return;
      }

      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
        }
      });

      if (rowData[MEDICINE_EXCEL_FIELDS.name]) {
        rawRows.push({
          data: rowData as unknown as MedicineFormatExcel,
          row: rowNumber,
        });
      }
    });

    if (rawRows.length === 0) {
      throw new ConflictException(
        'El archivo no contiene filas con el nombre de la medicina.',
      );
    }
    if (rawRows.length > 5000) {
      throw new ConflictException(
        'El archivo supera el máximo de 5000 filas por carga.',
      );
    }

    // Validación con zod (fuente única): las filas inválidas se reportan por
    // fila/campo y no se insertan.
    const invalidRows: MedicineImportRowError[] = [];
    const validRows: MedicineFormatExcel[] = [];
    for (const { data, row } of rawRows) {
      const parsed = medicineImportRowSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          invalidRows.push({
            row,
            field: issue.path.join('.') || '(fila)',
            message: issue.message,
          });
        }
        continue;
      }
      validRows.push(parsed.data as unknown as MedicineFormatExcel);
    }

    // Todo el lote se escribe en una transacción: si algo falla no quedan
    // categorías/formas huérfanas ni medicinas a medias.
    const result = await this.prismaService.$transaction(
      async (tx) => {
        const medicineDB = await tx.medicine.findMany({
          select: { id: true, name: true, code: true },
        });
        const createdMedicines: any[] = [];
        const skippedMedicines: string[] = [];
        const duplicateCodeItems: { name: string; code: string }[] = [];
        const existingCodes = new Set(
          medicineDB
            .map((med) => this.codeKey(med.code))
            .filter((code): code is string => code !== null),
        );
        const existingNames = new Set(
          medicineDB.map((med) => this.normalizeText(med.name)),
        );
        const batchCodes = new Set<string>();
        const batchNames = new Set<string>();

        for (const data of validRows) {
          const name = data[MEDICINE_EXCEL_FIELDS.name]?.trim();
          const normalizedName = this.normalizeText(name ?? '');

          if (
            existingNames.has(normalizedName) ||
            batchNames.has(normalizedName)
          ) {
            skippedMedicines.push(name ?? '');
            continue;
          }

          const rowCode = this.normalizeCode(data[MEDICINE_EXCEL_FIELDS.code]);
          const rowCodeKey = this.codeKey(rowCode);
          if (
            rowCodeKey &&
            (existingCodes.has(rowCodeKey) || batchCodes.has(rowCodeKey))
          ) {
            duplicateCodeItems.push({
              name: name ?? '',
              code: rowCode,
            });
            skippedMedicines.push(name ?? '');
            continue;
          }

          const categoryId = await this.resolveCategory(
            data[MEDICINE_EXCEL_FIELDS.category] ?? '',
            tx,
          );
          const formId = await this.resolveForm(
            data[MEDICINE_EXCEL_FIELDS.form],
            tx,
          );
          const medicineValue = this.normalizeText(
            String(data[MEDICINE_EXCEL_FIELDS.medicine] ?? ''),
          );

          createdMedicines.push({
            name,
            description: data[MEDICINE_EXCEL_FIELDS.description] ?? '',
            code: rowCode ?? undefined,
            categoryId,
            medicine: medicineValue === 'si',
            lote: data[MEDICINE_EXCEL_FIELDS.lote] || '',
            provider: data[MEDICINE_EXCEL_FIELDS.provider] || '',
            presentation: data[MEDICINE_EXCEL_FIELDS.presentation] || '',
            temperate: data[MEDICINE_EXCEL_FIELDS.temperate] || '',
            manufacturer: data[MEDICINE_EXCEL_FIELDS.manufacturer] || '',
            activeIngredient:
              data[MEDICINE_EXCEL_FIELDS.activeIngredient] || '',
            countryOfOrigin:
              data[MEDICINE_EXCEL_FIELDS.countryOfOrigin] || 'VE',
            formId,
          });

          batchNames.add(normalizedName);
          if (rowCodeKey) batchCodes.add(rowCodeKey);
        }

        if (createdMedicines.length > 0) {
          await tx.medicine.createMany({ data: createdMedicines });
        }

        await this.auditService.record(
          {
            action: 'CREATE',
            entity: 'Medicine',
            entityId: null,
            description: `Carga masiva de medicinas: ${createdMedicines.length} agregada(s), ${skippedMedicines.length} omitida(s), ${duplicateCodeItems.length} con código duplicado, ${invalidRows.length} inválida(s)`,
            metadata: {
              inserted: createdMedicines.length,
              skipped: skippedMedicines.length,
              medicines: createdMedicines.map((m) => m.name),
              skippedItems: skippedMedicines,
              duplicateCodeItems,
              invalidRows,
            },
          },
          tx,
        );

        return {
          inserted: createdMedicines.length,
          skipped: skippedMedicines.length,
          skippedItems: skippedMedicines,
          duplicateCodeItems,
          invalidRows,
        };
      },
      { timeout: 60_000, maxWait: 20_000 },
    );

    return {
      message:
        `Carga completada: ${result.inserted} medicina(s) agregada(s), ` +
        `${result.skipped} ya existían (por nombre o código) y fueron omitidas, ` +
        `${invalidRows.length} fila(s) inválida(s).`,
      data: result,
    };
  }

  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
