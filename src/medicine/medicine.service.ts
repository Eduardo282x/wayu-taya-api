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
                    benefited: medicine.benefited ? medicine.benefited : 1,
                }
            });
            baseResponse.message = 'Medicina creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear el Medicina.' + error
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
            baseResponse.message = 'Categoría creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'error al crear el Categoría.' + error
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
            baseResponse.message = 'Forma creada exitosamente.'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al crear la Forma.' + error
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
                    benefited: medicine.benefited
                },
                where: { id: id }
            });

            baseResponse.message = 'Medicina actualizada exitosamente.'
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

            baseResponse.message = 'Categoría actualizada exitosamente'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Categoría.' + error
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

            baseResponse.message = 'Forma actualizada exitosamente'
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al actualizar la Forma.' + error
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

            baseResponse.message = 'Categoría eliminado exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la Categoría: ' + error
            return badResponse;
        }
    }
    //formas
    async deleteForms(id: number) {
        try {
            await this.prismaService.forms.delete({
                where: { id: id }
            })

            baseResponse.message = 'Forma eliminada exitosamente';
            return baseResponse;
        } catch (error) {
            badResponse.message = 'Error al eliminar la Forma: ' + error
            return badResponse;
        }
    }

    async downloadExcelTemplate(res: Response) {
        const headers = [
            "Nombre", "Descripcion", "Categoria", "Medicina", "Unidad",
            "Cantidad", "Temperatura", "Manofacturador", "Principio_Activo",
            "Pais_Origen", "Forma", "Beneficiado"
        ];
        const exampleRows = [
            [
                "Paracetamol",
                "Analgésico",
                "Categoría General",
                "Si",
                "mg",
                100,
                "Ambiente",
                "Farmacéutica Ágil",
                "Paracetamol",
                "VE",
                "Tableta",
                "1"
            ],
            [
                "Ibuprofeno",
                "Esto es para el dolor muscular",
                "Antiinflamatorio",  // sin acento en "Categoria"
                "Si",
                "mg",
                200,
                "Ambiente",
                "Farmaceutica Agile",  // sin acento en "Farmaceutica"
                "Ibuprofeno",
                "VE",
                "Tableta",
                "1"
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
            const medicineDB = await this.prismaService.medicine.findMany();
            const categoriesDB = await this.prismaService.category.findMany();
            const formsDB = await this.prismaService.forms.findMany();

            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData: MedicineFormatExcel[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

            const createdMedicines: MedicineDTO[] = [];
            const skippedMedicines: string[] = [];

            for (const data of rawData) {
                const normalizedName = this.normalizeText(data.Nombre);

                // Verificar si la medicina ya existe por nombre (puedes agregar manufacturer, formId, etc.)
                const alreadyExists = medicineDB.some(med =>
                    this.normalizeText(med.name) === normalizedName
                );

                if (alreadyExists) {
                    skippedMedicines.push(data.Nombre);
                    continue;
                }
                // Normalizar y buscar categoría
                const normalizedCategory = this.normalizeText(data.Categoria);
                let category = categoriesDB.find(cat => this.normalizeText(cat.category) === normalizedCategory);

                if (!category) {
                    category = await this.prismaService.category.create({
                        data: { category: data.Categoria }
                    });
                    categoriesDB.push(category);
                }

                // Normalizar y buscar forma
                let form;
                if (data.Forma) {
                    const normalizedForm = this.normalizeText(data.Forma);
                    form = formsDB.find(f => this.normalizeText(f.forms) === normalizedForm);
                    if (!form) {
                        form = await this.prismaService.forms.create({
                            data: { forms: data.Forma }
                        });
                        formsDB.push(form);
                    }
                }

                const isMedicine = data.Medicina == 'Si'

                // Preparar objeto MedicineDTO para crear
                const medicineDTO: MedicineDTO = {
                    name: data.Nombre,
                    description: data.Descripcion,
                    categoryId: category.id,
                    medicine: isMedicine,
                    unit: data.Unidad || '',
                    amount: data.Cantidad || 0,
                    temperate: data.Temperatura || '',
                    manufacturer: data.Manofacturador || '',
                    activeIngredient: data.Principio_Activo || '',
                    countryOfOrigin: data.Pais_Origen || 'VE',
                    formId: form && form.id ? form.id : 14,
                    benefited: data.Beneficiado || 1,
                };

                createdMedicines.push(medicineDTO);
            }

            // Guardar solo las nuevas medicinas
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
            badResponse.message = 'Error al cargar las medicinas desde Excel: ' + error;
            return badResponse;
        }
    }

    normalizeText(text: string): string {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

}
