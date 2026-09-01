import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  MedicineDTO,
  MedicineFormatExcel,
  GetMedicineQueryDTO,
  CategoryDTO,
  FormsDTO,
} from './medicine.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MedicineService {
  constructor(private prismaService: PrismaService) { }
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
          code: medicine.code ? medicine.code : null,
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
      return { medicine: medicineCreated, message: 'Medicina creada exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateMedicine(id: number, medicine: MedicineDTO) {
    try {
      const [categoryId, formId] = await Promise.all([
        this.resolveCategory(medicine.category),
        this.resolveForm(medicine.form),
      ]);

      const medicineUpdated = await this.prismaService.medicine.update({
        data: {
          name: medicine.name,
          description: medicine.description,
          code: medicine.code ? medicine.code : null,
          categoryId,
          medicine: medicine.medicine,
          provider: medicine.provider ? medicine.provider : '',
          presentation: medicine.presentation ? medicine.presentation : '',
          temperate: medicine.temperate ? medicine.temperate : '',
          manufacturer: medicine.manufacturer ? medicine.manufacturer : '',
          activeIngredient: medicine.activeIngredient ? medicine.activeIngredient : '',
          countryOfOrigin: medicine.countryOfOrigin ? medicine.countryOfOrigin : '',
          formId,
        },
        where: { id: id },
      });

      return { medicine: medicineUpdated, message: 'Medicina actualizada exitosamente.' };
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

      return { category: categoryUpdated, message: 'Categoría actualizada exitosamente' };
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
      const medicineDeleted = await this.prismaService.medicine.delete({
        where: { id: id },
      });

      return { medicine: medicineDeleted, message: 'Medicina/Producto eliminado exitosamente' };
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

      return { category: categoryDeleted, message: 'Categoría eliminado exitosamente' };
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

      const headers = [
        'Nombre',
        'Descripcion',
        'Categoria',
        'Medicina',
        'Codigo',
        'Presentacion',
        'Temperatura',
        'Fabricante',
        'Principio_Activo',
        'Pais_Origen',
        'Forma',
      ];
      worksheet.addRow(headers);

      const exampleRows = [
        [
          'Acetaminofén',
          'FIEBRE - DOLOR - CONGESTION NASAL',
          'Analgésico',
          'Si',
          '00536128935',
          '325mg / Fenilefrina 5mg · 24 cápsulas',
          'Ambiente',
          'Rugby Laboratories',
          'Acetaminophen, Phenylephrine HCl',
          'UNITED STATES',
          'Caja',
        ],
        [
          'Ibuprofeno',
          'Esto es para el dolor muscular',
          'Antiinflamatorio',
          'Si',
          '',
          '400mg · 20 comprimidos',
          'Ambiente',
          'Pfizer',
          'Ibuprofeno',
          'VE',
          'Empaque',
        ],
      ];
      exampleRows.forEach((row) => worksheet.addRow(row));

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

        if (rowData['Nombre']) {
          rawData.push(rowData as unknown as MedicineFormatExcel);
        }
      });

      const createdMedicines: any[] = [];
      const skippedMedicines: string[] = [];

      for (const data of rawData) {
        const normalizedName = this.normalizeText(data.Nombre);

        const alreadyExists = medicineDB.some(
          (med) => this.normalizeText(med.name) === normalizedName,
        );

        if (alreadyExists) {
          skippedMedicines.push(data.Nombre);
          continue;
        }

        const normalizedCategory = this.normalizeText(data.Categoria);
        let category = categoriesDB.find(
          (cat) => this.normalizeText(cat.category) === normalizedCategory,
        );

        if (!category) {
          category = await this.prismaService.category.create({
            data: { category: this.toTitleCase(data.Categoria) },
          });
          categoriesDB.push(category);
        }

        let form;
        if (data.Forma) {
          const normalizedForm = this.normalizeText(data.Forma);
          form = formsDB.find(
            (f) => this.normalizeText(f.forms) === normalizedForm,
          );
          if (!form) {
            form = await this.prismaService.forms.create({
              data: { forms: this.toTitleCase(data.Forma) },
            });
            formsDB.push(form);
          }
        }

        const isMedicine = data.Medicina == 'Si';

        createdMedicines.push({
          name: data.Nombre,
          description: data.Descripcion,
          code: data.Codigo || undefined,
          categoryId: category.id,
          medicine: isMedicine,
          presentation: data.Presentacion || '',
          temperate: data.Temperatura || '',
          manufacturer: data.Fabricante || '',
          activeIngredient: data.Principio_Activo || '',
          countryOfOrigin: data.Pais_Origen || 'VE',
          formId: form && form.id ? form.id : 14,
        });
      }

      if (createdMedicines.length > 0) {
        await this.prismaService.medicine.createMany({
          data: createdMedicines,
          skipDuplicates: true,
        });
      }

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
