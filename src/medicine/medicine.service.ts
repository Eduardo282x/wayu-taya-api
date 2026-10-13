/* eslint-disable no-useless-catch */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import {
  MedicineDTO,
  MedicineFormatExcel,
  GetMedicineQueryDTO,
  CategoryDTO,
  FormsDTO,
} from './medicine.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

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

  private async resolveCategory(value: string): Promise<number> {
    const key = this.normalizeSearchKey(value);
    const categories = await this.prismaService.category.findMany({
      select: { id: true, category: true },
    });
    const existing = categories.find(
      (c) => this.normalizeSearchKey(c.category) === key,
    );
    if (existing) return existing.id;
    const created = await this.prismaService.category.create({
      data: { category: this.toTitleCase(value) },
    });
    return created.id;
  }

  private async resolveForm(value?: string): Promise<number> {
    if (!value || !this.normalizeSearchKey(value)) return 14;
    const key = this.normalizeSearchKey(value);
    const forms = await this.prismaService.forms.findMany({
      select: { id: true, forms: true },
    });
    const existing = forms.find(
      (f) => this.normalizeSearchKey(f.forms) === key,
    );
    if (existing) return existing.id;
    const created = await this.prismaService.forms.create({
      data: { forms: this.toTitleCase(value) },
    });
    return created.id;
  }

  async createMedicine(medicine: MedicineDTO) {
    try {
      const [categoryId, formId] = await Promise.all([
        this.resolveCategory(medicine.category),
        this.resolveForm(medicine.form),
      ]);

      const medicineCreated = await this.prismaService.medicine.create({
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

      const [categoryId, formId] = await Promise.all([
        this.resolveCategory(medicine.category),
        this.resolveForm(medicine.form),
      ]);

      const medicineUpdated = await this.prismaService.medicine.update({
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

  async downloadExcelTemplate(res: Response) {
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

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="medicine_template.xlsx"',
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      throw error;
    }
  }

  async uploadExcel(file: Express.Multer.File) {
    try {
      const medicineDB = await this.prismaService.medicine.findMany();
      const categoriesDB = await this.prismaService.category.findMany();
      const formsDB = await this.prismaService.forms.findMany();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(file.buffer) as any);
      const worksheet = workbook.getWorksheet(1);

      const rawData: MedicineFormatExcel[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '');
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
          rawData.push(rowData as unknown as MedicineFormatExcel);
        }
      });

      const createdMedicines: any[] = [];
      const skippedMedicines: string[] = [];

      for (const data of rawData) {
        const normalizedName = this.normalizeText(
          data[MEDICINE_EXCEL_FIELDS.name],
        );

        const alreadyExists = medicineDB.some(
          (med) => this.normalizeText(med.name) === normalizedName,
        );

        if (alreadyExists) {
          skippedMedicines.push(data[MEDICINE_EXCEL_FIELDS.name]);
          continue;
        }

        const normalizedCategory = this.normalizeText(
          data[MEDICINE_EXCEL_FIELDS.category],
        );
        let category = categoriesDB.find(
          (cat) => this.normalizeText(cat.category) === normalizedCategory,
        );

        if (!category) {
          category = await this.prismaService.category.create({
            data: {
              category: this.toTitleCase(data[MEDICINE_EXCEL_FIELDS.category]),
            },
          });
          categoriesDB.push(category);
        }

        let form;
        if (data[MEDICINE_EXCEL_FIELDS.form]) {
          const normalizedForm = this.normalizeText(
            data[MEDICINE_EXCEL_FIELDS.form],
          );
          form = formsDB.find(
            (f) => this.normalizeText(f.forms) === normalizedForm,
          );
          if (!form) {
            form = await this.prismaService.forms.create({
              data: {
                forms: this.toTitleCase(data[MEDICINE_EXCEL_FIELDS.form]),
              },
            });
            formsDB.push(form);
          }
        }

        const isMedicine = data[MEDICINE_EXCEL_FIELDS.medicine] == 'Si';

        createdMedicines.push({
          name: data[MEDICINE_EXCEL_FIELDS.name],
          description: data[MEDICINE_EXCEL_FIELDS.description],
          code: data[MEDICINE_EXCEL_FIELDS.code].toString() || undefined,
          categoryId: category.id,
          medicine: isMedicine,
          lote: data[MEDICINE_EXCEL_FIELDS.lote] || '',
          provider: data[MEDICINE_EXCEL_FIELDS.provider] || '',
          presentation: data[MEDICINE_EXCEL_FIELDS.presentation] || '',
          temperate: data[MEDICINE_EXCEL_FIELDS.temperate] || '',
          manufacturer: data[MEDICINE_EXCEL_FIELDS.manufacturer] || '',
          activeIngredient: data[MEDICINE_EXCEL_FIELDS.activeIngredient] || '',
          countryOfOrigin: data[MEDICINE_EXCEL_FIELDS.countryOfOrigin] || 'VE',
          formId: form && form.id ? form.id : 14,
        });
      }

      if (createdMedicines.length > 0) {
        await this.prismaService.medicine.createMany({
          data: createdMedicines,
          skipDuplicates: true,
        });
      }

      await this.auditService.record({
        action: 'CREATE',
        entity: 'Medicine',
        entityId: null,
        description: `Carga masiva de medicinas: ${createdMedicines.length} agregada(s), ${skippedMedicines.length} omitida(s)`,
        metadata: {
          inserted: createdMedicines.length,
          skipped: skippedMedicines.length,
          medicines: createdMedicines.map((m) => m.name),
          skippedItems: skippedMedicines,
        },
      });

      return {
        message:
          `Carga completada: ${createdMedicines.length} medicina(s) agregada(s), ` +
          `${skippedMedicines.length} ya existían y fueron omitidas.`,
        data: {
          inserted: createdMedicines.length,
          skipped: skippedMedicines.length,
          skippedItems: skippedMedicines,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
