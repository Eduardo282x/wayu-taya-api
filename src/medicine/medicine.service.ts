import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MedicineDTO, MedicineFormatExcel, CategoryDTO, FormsDTO } from './medicine.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';
import * as XLSX from 'xlsx';
import { Response } from 'express';

@Injectable()
export class MedicineService {

    constructor(private prismaService: PrismaService) {

    }
    async getMedicine() {
        return await this.prismaService.medicine.findMany({
            include: {
                category: true,
                form: true,
            }
        });
    }
    async getCategory() {
        return await this.prismaService.category.findMany();
    }
    async getForms() {
        return await this.prismaService.forms.findMany();
    }
    async createMedicine(medicine: MedicineDTO) {
        try {
            await this.prismaService.medicine.create({
                data: {
                    name: medicine.name,
                    description: medicine.description,
                    categoryId: medicine.categoryId,
                    medicine: medicine.medicine,
                    unit: medicine.unit ? medicine.unit : '',
                    amount: medicine.amount ? medicine.amount : 0,
                    temperate: medicine.temperate ? medicine.temperate : '',
                    manufacturer: medicine.manufacturer ? medicine.manufacturer : '',
                    activeIngredient: medicine.activeIngredient ? medicine.activeIngredient : '',
                    countryOfOrigin: medicine.countryOfOrigin ? medicine.countryOfOrigin : '',
                    formId: medicine.formId ? medicine.formId : 14,
                }
            });
            baseResponse.message = 'Medicina creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'error al crear el Medicina.' + error
            return badResponse;
        }
    }
    //Categorias
    async createCategory(category: CategoryDTO) {
        try {
            await this.prismaService.category.create({
                data: {
                    category: category.category
                }
            });
            baseResponse.message = 'Medicina creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'error al crear el Medicina.' + error
            return badResponse;
        }
    }
    //Formas
    async createForms(forms: FormsDTO) {
        try {
            await this.prismaService.forms.create({
                data: {
                    forms: forms.forms
                }
            });
            baseResponse.message = 'Medicina creado exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'error al crear el Medicina.' + error
            return badResponse;
        }
    }
    async updateMedicine(id: number, medicine: MedicineDTO) {
        try {
            await this.prismaService.medicine.update({
                data: {
                    name: medicine.name,
                    description: medicine.description,
                    categoryId: medicine.categoryId,
                    medicine: medicine.medicine,
                    unit: medicine.unit,
                    amount: medicine.amount,
                    temperate: medicine.temperate,
                    manufacturer: medicine.manufacturer,
                    activeIngredient: medicine.activeIngredient,
                    countryOfOrigin: medicine.countryOfOrigin,
                    formId: medicine.formId,
                },
                where: { id: id }
            });

            baseResponse.message = 'exito al actualizar la Medicina.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Medicina.' + error
            return badResponse;
        }
    }
    //Categoria
    async updateCategory(id: number, category: CategoryDTO) {
        try {
            await this.prismaService.category.update({
                data: {
                    category: category.category
                },
                where: { id: id }
            });

            baseResponse.message = 'exito al actualizar la Medicina.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Medicina.' + error
            return badResponse;
        }
    }
    //Formas
    async updateForms(id: number, forms: FormsDTO) {
        try {
            await this.prismaService.forms.update({
                data: {
                    forms: forms.forms
                },
                where: { id: id }
            });

            baseResponse.message = 'exito al actualizar la Medicina.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Medicina.' + error
            return badResponse;
        }
    }
    async deleteMedicine(id: number) {
        try {
            await this.prismaService.medicine.delete({
                where: { id: id }
            })

            baseResponse.message = 'Medicina/Producto eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la Medicina/Producto.' + error
            return badResponse;
        }
    }
    //categoria
    async deleteCategory(id: number) {
        try {
            await this.prismaService.category.delete({
                where: { id: id }
            })

            baseResponse.message = 'Medicina/Producto eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la Medicina/Producto.' + error
            return badResponse;
        }
    }
    //formas
    async deleteForms(id: number) {
        try {
            await this.prismaService.forms.delete({
                where: { id: id }
            })

            baseResponse.message = 'Medicina/Producto eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la Medicina/Producto.' + error
            return badResponse;
        }
    }

    async downloadExcelTemplate(res: Response) {
        const headers = [
            "Nombre", "Descripcion", "Categoria", "Medicina", "Cantidad",
            "Unidad", "Temperatura", "Manofacturador", "Principio_Activo",
            "Pais_Origen", "Forma"
        ];
        const exampleRows = [
            [
                "Paracetamol",
                "Analgésico",
                "Categoría General",
                "Si",
                100,
                "mg",
                "Ambiente",
                "Farmacéutica Ágil",
                "Paracetamol",
                "VE",
                "Tableta"
            ],
            [
                "Pasta Dental Infantil",
                "Pasta dental con flúor para niños.",
                "Higiene Personal",  // sin acento en "Categoria"
                "No",
                0,
                "",
                "",
                "", 
                "",
                "",
                ""
            ]
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
        XLSX.utils.book_append_sheet(wb, ws, 'Medicinas');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="medicine_template.xlsx"');
        res.send(buffer);
    }

    async uploadExcel(file: Express.Multer.File) {
        try {
            const categoriesDB = await this.prismaService.category.findMany();
            const formsDB = await this.prismaService.forms.findMany();

            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData: MedicineFormatExcel[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

            function normalizeText(text: string): string {
                return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            }

            const createdMedicines = [];

            for (const data of rawData) {
                // Normalizar y buscar categoría
                const normalizedCategory = normalizeText(data.categoryId);
                let category = categoriesDB.find(cat => normalizeText(cat.category) === normalizedCategory);

                if (!category) {
                    category = await this.prismaService.category.create({
                        data: { category: data.categoryId }
                    });
                    categoriesDB.push(category);
                }

                // Normalizar y buscar forma
                const normalizedForm = normalizeText(data.forms);
                let form = formsDB.find(f => normalizeText(f.forms) === normalizedForm);

                if (!form) {
                    form = await this.prismaService.forms.create({
                        data: { forms: data.forms }
                    });
                    formsDB.push(form);
                }

                // Preparar objeto MedicineDTO para crear
                const medicineDTO: MedicineDTO = {
                    name: data.name,
                    description: data.description,
                    categoryId: category.id,
                    medicine: data.medicine,
                    unit: data.unit || '',
                    amount: data.amount || 0,
                    temperate: data.temperate || '',
                    manufacturer: data.manufacturer || '',
                    activeIngredient: data['Principio Activo'] || '',
                    countryOfOrigin: data['Pais de Origen'] || 'VE',
                    formId: form.id || 14,
                };

                // Crear medicina usando la función que ya tienes
                const response = await this.createMedicine(medicineDTO);
                if (response.data) {
                    createdMedicines.push(response.data);
                }
            }

            baseResponse.data = createdMedicines;
            baseResponse.message = 'Medicinas cargadas y creadas exitosamente.';
            return baseResponse;

        } catch (error) {
            badResponse.message = 'Error al cargar las medicinas desde Excel: ' + error;
            return badResponse;
        }
    }

}
