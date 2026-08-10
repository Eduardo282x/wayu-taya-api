import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  MedicineDTO,
  MedicineFormatExcel,
  CategoryDTO,
  FormsDTO,
} from './medicine.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MedicineService {
  constructor(private prismaService: PrismaService) {}
  async getMedicine() {
    return await this.prismaService.medicine.findMany({
      include: {
        category: true,
        form: true,
      },
    });
  }
  async getCategory() {
    return await this.prismaService.category.findMany();
  }
  async getForms() {
    return await this.prismaService.forms.findMany();
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

      await this.prismaService.medicine.create({
        data: {
          name: medicine.name,
          description: medicine.description,
          code: medicine.code ? medicine.code : null,
          categoryId,
          medicine: medicine.medicine,
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
      baseResponse.message = 'Medicina creada exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al crear el Medicina.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }
  //Categorias
  async createCategory(category: CategoryDTO) {
    try {
      await this.prismaService.category.create({
        data: {
          category: category.category,
        },
      });
      baseResponse.message = 'Categoría creada exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'error al crear el Categoría.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }
  //Formas
  async createForms(forms: FormsDTO) {
    try {
      await this.prismaService.forms.create({
        data: {
          forms: forms.forms,
        },
      });
      baseResponse.message = 'Forma creada exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al crear la Forma.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }
  async updateMedicine(id: number, medicine: MedicineDTO) {
    try {
      const [categoryId, formId] = await Promise.all([
        this.resolveCategory(medicine.category),
        this.resolveForm(medicine.form),
      ]);

      await this.prismaService.medicine.update({
        data: {
          name: medicine.name,
          description: medicine.description,
          code: medicine.code ? medicine.code : null,
          categoryId,
          medicine: medicine.medicine,
          presentation: medicine.presentation,
          temperate: medicine.temperate,
          manufacturer: medicine.manufacturer,
          activeIngredient: medicine.activeIngredient,
          countryOfOrigin: medicine.countryOfOrigin,
          formId,
        },
        where: { id: id },
      });

      baseResponse.message = 'Medicina actualizada exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al actualizar la Medicina.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }
  //Categoria
  async updateCategory(id: number, category: CategoryDTO) {
    try {
      await this.prismaService.category.update({
        data: {
          category: category.category,
        },
        where: { id: id },
      });

      baseResponse.message = 'Categoría actualizada exitosamente';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al actualizar la Categoría.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }
  //Formas
  async updateForms(id: number, forms: FormsDTO) {
    try {
      await this.prismaService.forms.update({
        data: {
          forms: forms.forms,
        },
        where: { id: id },
      });

      baseResponse.message = 'Forma actualizada exitosamente';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al actualizar la Forma.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }
  async deleteMedicine(id: number) {
    try {
      await this.prismaService.medicine.delete({
        where: { id: id },
      });

      baseResponse.message = 'Medicina/Producto eliminado exitosamente';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al eliminar la Medicina/Producto.' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }

  //categoria
  async deleteCategory(id: number) {
    try {
      await this.prismaService.category.delete({
        where: { id: id },
      });

      baseResponse.message = 'Categoría eliminado exitosamente';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al eliminar la Categoría: ' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
    }
  }

  //formas
  async deleteForms(id: number) {
    try {
      await this.prismaService.forms.delete({
        where: { id: id },
      });

      baseResponse.message = 'Forma eliminada exitosamente';
      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al eliminar la Forma: ' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
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
    } catch {
      badResponse.message = 'Error al generar el archivo Excel.';
      return badResponse;
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

      baseResponse.data = {
        inserted: createdMedicines.length,
        skipped: skippedMedicines.length,
        skippedItems: skippedMedicines,
      };

      baseResponse.message =
        `Carga completada: ${createdMedicines.length} medicina(s) agregada(s), ` +
        `${skippedMedicines.length} ya existían y fueron omitidas.`;

      return baseResponse;
    } catch (error) {
      badResponse.message =
        'Error al cargar las medicinas desde Excel: ' +
        (error instanceof Error ? error.message : String(error));
      return badResponse;
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
