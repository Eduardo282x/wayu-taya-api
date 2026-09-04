import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationsDTO, DetDonationDTO, GetDonationsQueryDTO } from './donations.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DonationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly inventoryService: InventoryService,
  ) { }

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
      where.controlNumber = { contains: query.controlNumber, mode: 'insensitive' };
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

    // grab from inv where id is from above
    const inventories = await this.prismaService.inventory.findMany({
      where: {
        donationId: { in: donationIds },
      },
    });

    // what got from inv >tie to> donations thingamajig
    const donationsWithDates = donations.map((donation) => {
      const detDonationsWithDates = donation.detDonation.map((det) => {
        const inventoryRecord = inventories.find(
          (inv) =>
            inv.donationId === donation.id &&
            inv.medicineId === det.medicineId &&
            inv.storeId === (det as any).storageId &&
            inv.lote === (det.lote || donation.lote),
        );

        return {
          ...det,
          admissionDate: inventoryRecord?.admissionDate,
          expirationDate: inventoryRecord?.expirationDate,
        };
      });

      return {
        ...donation,
        detDonation: detDonationsWithDates,
      };
    });

    return {
      donations: donationsWithDates,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      }
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
        message: 'Donación registrada exitosamente.'
      }
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
      return await this.prismaService.$transaction(async (tx) => {
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

        if (donation.changeDonDetails === true) {
          await this.inventoryService.revertInventoryWithHistory(
            tx,
            originalDonation,
          );
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
          await tx.detDonation.deleteMany({ where: { donationId: id } });

          const newDetails = medicinesResolved.map((m) => ({
            donationId: id,
            medicineId: m.medicineId,
            amount: m.amount,
            benefited: m.benefited ?? 0,
            lote: m.lote || donation.lote || '',
          }));
          await tx.detDonation.createMany({ data: newDetails });

          const inventoryDto = {
            donationId: updatedDonation.id,
            lote: updatedDonation.lote,
            medicines: medicinesResolved.map((med) => ({
              medicineId: med.medicineId,
              storeId: med.storageId,
              stock: med.amount,
              admissionDate: donation.date,
              expirationDate: med.expirationDate,
              lote: med.lote,
            })),
            type: updatedDonation.type,
            date: updatedDonation.date,
            observations: 'Actualización con dependencias posteriores',
          };

          const result = await this.inventoryService.processInventory(
            inventoryDto,
            tx,
          );
          if (!result.success) throw new BadRequestException(result.message);
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
      return await this.prismaService.$transaction(async (tx) => {
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

      const inventories = await this.prismaService.inventory.findMany({
        where: { donationId },
      });

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
          { header: 'Cant.', width: 29 },                   // Ajustado (-2)
          { header: 'Unid', width: 39 },                   // Ajustado (-8)
          { header: 'Lote', width: 45 },                   // Ajustado (-11)
          { header: 'País de Origen', width: 45 },
          { header: 'Fabricante', width: 55 },             // Ajustado (-12)
          { header: 'Expira', width: 45 },                 // Ajustado (-7)
          { header: 'Valor', width: 35 },                  // Ajustado (+5 para dar más espacio al precio)
        ];

        const title =
          type === 'normal' ? 'FACTURA NO COMERCIAL' : 'NOTA DE ENTREGA';
        const subtitle =
          'Asistencia de Salud — No para reventa o fines comerciales';

        const formatExpiration = (date: Date): string => {
          const d = new Date(date);
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${month}/${day}/${d.getFullYear()}`;
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
          .text(`Número de Donación: ${donation.controlNumber}`, TABLE_X, 92, { continued: true });
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
          { label: 'Email:', value: inst?.email || '', bold: false, email: true },
        ];

        const boxHeight = rowsData.length * 17 + 4;
        doc.fillColor(LIGHT).rect(TABLE_X, y, TABLE_W, boxHeight).fill();

        rowsData.forEach((row, i) => {
          const rowY = y + 4 + i * 13;
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
              width: 240,
              underline: !!row.email,
            });
        });

        // R.I.F. y Teléfono a la derecha
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('black')
          .text(`R.I.F.: ${inst?.rif || 'Sin registro'}`, TABLE_X + 380, y + 4, {
            width: 172,
            align: 'left',
          });
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
          doc.fillColor(NAVY).rect(TABLE_X, startY, TABLE_W, headerHeight).fill();
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
          const candidates = inventories.filter(
            (inv) => inv.medicineId === det.medicineId,
          );
          const inventory =
            candidates.find((inv) => inv.lote === (det.lote || donation.lote)) ||
            candidates[0];

          const expirationDate = inventory?.expirationDate
            ? formatExpiration(inventory.expirationDate)
            : '';

          const productDesc = `${det.medicine.name}${det.medicine.presentation ? ' ' + det.medicine.presentation : ''
            }`;

          const rowCells = [
            det.medicine.code !== '' ? det.medicine.code : 'Sin código',
            productDesc,
            det.amount.toString(),
            det.medicine.form?.forms || '',
            det.lote || donation.lote || '',
            det.medicine.countryOfOrigin !== '' ? det.medicine.countryOfOrigin : '-',
            det.medicine.manufacturer || '',
            expirationDate !== '' ? expirationDate : 'Sin fecha',
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
              .lineWidth(1)           // Ancho de la línea en puntos (opcional)
              .strokeColor('#000000') // Color negro para el borde
              .rect(x, startY, columns[i].width, rowHeight) // Reemplaza rowHeight por la altura de tu celda
              .stroke();              // Renderiza el contorno

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

        // Pie de página
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('black')
          .text(
            '- SIN VALOR COMERCIAL -',
            TABLE_X,
            Math.max(startY + 20, doc.page.height - 60),
            { width: TABLE_W, align: 'center' },
          );

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

      const headers = [
        'Medicina',
        'Cantidad',
        'Lote',
        'Fecha de Expiración',
      ];
      donationSheet.columns = [
        { header: headers[0], key: 'medicina', width: 48 },
        { header: headers[1], key: 'cantidad', width: 14 },
        { header: headers[2], key: 'lote', width: 18 },
        { header: headers[3], key: 'fechaExpiracion', width: 22 },
      ];

      donationSheet.getColumn(2).numFmt = '0';
      donationSheet.getColumn(4).numFmt = 'yyyy-mm-dd';

      donationSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
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
      medicinesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
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
