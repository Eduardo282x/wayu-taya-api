import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {   Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    HeadingLevel,
    Header,
    ImageRun,
    VerticalAlign} from 'docx';
    import { readFileSync } from 'fs';
import { format } from 'date-fns';
import { ReportsDTO } from './reports.dto';

const prisma = new PrismaClient();

@Injectable()
export class ReportsService {
/*
  async generateCenteredTextDoc(): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '¡Hola desde el servicio de Reports!',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

    async generatePersonReport(): Promise<Buffer> {
    const people = [
      { name: 'Carlos', email: 'carlos@example.com' },
      { name: 'Maria', email: 'maria@example.com' },
    ];
  
    const rows = people.map(person =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(person.name)] }),
          new TableCell({ children: [new Paragraph(person.email)] }),
        ],
      }),
    );
  
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Reporte de Personas', bold: true, size: 28 })],
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('Nombre')] }),
                    new TableCell({ children: [new Paragraph('Correo')] }),
                  ],
                }),
                ...rows,
              ],
            }),
          ],
        },
      ],
    });
  
    return await Packer.toBuffer(doc);
  }
  
  async generateDonationReportTemplate(): Promise<Buffer> {
    const logoImage = readFileSync('src/assets/logo.png');

    const image = new ImageRun({
      data: logoImage,
      transformation: {
        width: 150,
        height: 100,
      }, type: 'png',
    });

    const header = new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [image],
        }),
      ],
    });

    const title = new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'FUNDACIÓN WAYUU TAYA – DIRECT RELIEF',
          bold: true,
        }),
      ],
    });

    const subtitle = new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'REPORTE DE DONACIÓN DE INSUMOS RECIBIDOS',
          bold: true,
        }),
      ],
    });

    const intro = new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text:
            'En los meses agosto y noviembre del año 2024, recibimos por parte de DIRECT RELIEF una donación importante de medicamentos los cuales fueron distribuidos a centros de salud e instituciones del País.',
        }),
      ],
    });

    const createTable = (headers: string[], numRows: number = 4) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: headers.map(
              (h) =>
                new TableCell({
                  shading: {
                    fill: 'CCE5FF',
                  },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: h, bold: true })],
                    }),
                  ],
                })
            ),
          }),
          ...Array.from({ length: numRows }).map(
            () =>
              new TableRow({
                children: headers.map(
                  () =>
                    new TableCell({
                      children: [new Paragraph('')],
                    })
                ),
              })
          ),
        ],
      });

    const loteAgostoTable = createTable([
      'Meses',
      'Centros de Salud',
      'Instituciones y Organizaciones',
      'Beneficiarios',
      'Items Entregados',
    ]);

    const loteNoviembreTable = createTable([
      'Meses',
      'Centros de Salud',
      'Instituciones y Organizaciones',
      'Beneficiarios',
      'Items Entregados',
    ]);

    const vitaminasTable = createTable(
      ['Vitaminas', 'BT Entregados', 'Beneficiarios'],
      2
    );

    const estadosTable = createTable(['Estados', 'Municipios', 'Parroquias'], 2);

    const nombreCentrosTitle = new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'NOMBRE DE CENTROS DE SALUD E INSTITUCIONES BENEFICIADAS',
          bold: true,
        }),
      ],
    });

    const centrosSaludTable = createTable(
      ['Estado', 'Municipio', 'Parroquia', 'Centro de Salud'],
      5
    );

    const institucionesTable = createTable(
      ['Municipio', 'Parroquia', 'Organizaciones e Instituciones'],
      5
    );

    const doc = new Document({
      sections: [
        {
          headers: {
            default: header,
          },
          children: [
            title,
            subtitle,
            intro,
            new Paragraph({
              children: [new TextRun({ text: 'LOTE AGOSTO 2024', bold: true })],
            }),
            loteAgostoTable,
            new Paragraph({
              children: [new TextRun({ text: 'LOTE NOVIEMBRE 2024', bold: true })],
            }),
            loteNoviembreTable,
            new Paragraph({
              children: [new TextRun({ text: 'VITAMINAS CENTRUM Y KIRKHUMANITARIAN', bold: true })],
            }),
            vitaminasTable,
            new Paragraph({
              children: [new TextRun({ text: 'ESTADÍSTICAS GEOGRÁFICAS', bold: true })],
            }),
            estadosTable,
            nombreCentrosTitle,
            centrosSaludTable,
            new Paragraph({
              children: [new TextRun({ text: 'INSTITUCIONES BENEFICIADAS', bold: true })],
            }),
            institucionesTable,
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }


  /*
  async generateReportByProviderAndLots(providerName: string, lotes: string[]): Promise<Buffer> {
    try {
      const logoImage = readFileSync('src/assets/logo.png');
      const headerImage = new ImageRun({
        data: logoImage,
        transformation: { width: 100, height: 50 },
        type: 'png',
      });

      const header = new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [headerImage],
          }),
        ],
      });

      const title = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: 'REPORTE DE DONACIÓN POR PROVEEDOR Y LOTE',
            bold: true,
          }),
        ],
      });

      const donations = await prisma.donation.findMany({
        where: {
          provider: { name: providerName },
          lote: { in: lotes },
        },
        include: {
          provider: true,
          institution: true,
          detDonation: { include: { medicine: true } },
        },
      });

      const groupedByLote: Record<string, typeof donations> = {};
      donations.forEach((donation) => {
        if (!groupedByLote[donation.lote]) {
          groupedByLote[donation.lote] = [];
        }
        groupedByLote[donation.lote].push(donation);
      });

      const tables = Object.entries(groupedByLote).map(([lote, lotDonations]) => {
        const rows = lotDonations.map((donation) => {
          const institution = donation.institution?.name || 'Sin institución';
          const totalItems = donation.detDonation.reduce((acc, det) => acc + det.amount, 0);
          const totalBeneficiaries = donation.detDonation.reduce((acc, det) => acc + (det.medicine.benefited * det.amount), 0);

          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(lote)] }),
              new TableCell({ children: [new Paragraph(institution)] }),
              new TableCell({ children: [new Paragraph(totalItems.toString())] }),
              new TableCell({ children: [new Paragraph(totalBeneficiaries.toString())] }),
            ],
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Lote')] }),
                new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Institución')] }),
                new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Items')] }),
                new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Beneficiarios')] }),
              ],
            }),
            ...rows,
          ],
        });
      });

      const doc = new Document({
        sections: [
          {
            headers: { default: header },
            children: [
              title,
              new Paragraph({
                spacing: { after: 300 },
                children: [
                  new TextRun(`Este reporte contiene las donaciones realizadas por ${providerName} en los lotes seleccionados.`),
                ],
              }),
              ...tables,
            ],
          },
        ],
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      console.error('Error en generateReportByProviderAndLots:', error);
      throw new Error('No se pudo generar el documento Word.');
    }
  }

/*
  async generateReportByProviderAndLots(providerName: string, lotes: string[]): Promise<Buffer> {
    try {
      const logoImage = readFileSync('src/assets/logo.png');
      const image = new ImageRun({
        data: logoImage,
        transformation: { width: 100, height: 50 },
        type: 'png',
      });
  
      const header = new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [image],
          }),
        ],
      });
  
      const title = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: 'REPORTE DE DONACIÓN POR PROVEEDOR Y LOTE',
            bold: true,
          }),
        ],
      });
  
      // Buscar donaciones ENTRADA con type exacto 'Entrada'
      const entradas = await prisma.donation.findMany({
        where: {
          type: 'Entrada',
          provider: { name: providerName },
          lote: { in: lotes },
        },
        include: {
          detDonation: { include: { medicine: true } },
        },
      });
  
      if (entradas.length === 0) {
        throw new Error('No se encontraron donaciones de entrada para ese proveedor y lotes.');
      }
  
      const lotesConfirmados = entradas.map(e => e.lote);
  
      // Buscar donaciones SALIDA con type exacto 'Salida'
      const salidas = await prisma.donation.findMany({
        where: {
          type: 'Salida',
          lote: { in: lotesConfirmados },
        },
        include: {
          institution: true,
          detDonation: { include: { medicine: true } },
        },
      });
  
      type SalidaGrouped = Record<
        string,
        {
          [institutionName: string]: number;
        }
      >;
  
      const salidasAgrupadas: SalidaGrouped = {};
  
      for (const salida of salidas) {
        const lote = salida.lote;
        const institutionName = salida.institution?.name || 'Sin institución';
  
        if (!salidasAgrupadas[lote]) salidasAgrupadas[lote] = {};
        if (!salidasAgrupadas[lote][institutionName]) salidasAgrupadas[lote][institutionName] = 0;
  
        const totalItemsSalida = salida.detDonation.reduce((acc, det) => acc + det.amount, 0);
        salidasAgrupadas[lote][institutionName] += totalItemsSalida;
      }
  
      const rows: TableRow[] = [];
  
      for (const entrada of entradas) {
        const lote = entrada.lote;
        const totalItemsEntrada = entrada.detDonation.reduce((acc, det) => acc + det.amount, 0);
  
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: lote, bold: true })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `Proveedor: ${providerName}`, bold: true })],
                  }),
                ],
              }),
              new TableCell({
                children: [new Paragraph(totalItemsEntrada.toString())],
              }),
              new TableCell({
                children: [new Paragraph('')],
              }),
            ],
          }),
        );
  
        const salidaPorInstitucion = salidasAgrupadas[lote] || {};
  
        for (const [institutionName, cantidad] of Object.entries(salidaPorInstitucion)) {
          rows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('')] }),
                new TableCell({ children: [new Paragraph(institutionName)] }),
                new TableCell({ children: [new Paragraph(cantidad.toString())] }),
                new TableCell({ children: [new Paragraph('')] }),
              ],
            }),
          );
        }
      }
  
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Lote')] }),
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Institución / Proveedor')] }),
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Cantidad Items')] }),
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Observaciones')] }),
            ],
          }),
          ...rows,
        ],
      });
  
      const doc = new Document({
        sections: [
          {
            headers: { default: header },
            children: [
              title,
              new Paragraph({
                spacing: { after: 300 },
                children: [
                  new TextRun({
                    text: `Reporte de donaciones del proveedor ${providerName} para lotes: ${lotesConfirmados.join(', ')}`,
                  }),
                ],
              }),
              table,
            ],
          },
        ],
      });
  
      return await Packer.toBuffer(doc);
    } catch (error) {
      console.error('Error en generateReportByProviderAndLots:', error);
      throw new Error('Error generando el documento Word.');
    }
  }
  */
  //commented lines are only trys and/or tests//
  async generateSampleDoc(providerName: string, lotes: string[]): Promise<Buffer> {
    try {
      if (!providerName || lotes.length === 0) {
        throw new Error('Se requiere el nombre del proveedor y al menos un lote.');
      }
  
      const logoImage = readFileSync('src/assets/logo.png');
  
      const image = new ImageRun({
        data: logoImage,
        transformation: {
          width: 150,
          height: 100,
        },
        type: 'png',
      });
  
      const header = new Header({
        children: [
          new Paragraph({ alignment: AlignmentType.LEFT, children: [image] }),
        ],
      });
  
      const title = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [
          new TextRun({ text: 'REPORTE DE MOVIMIENTOS DE DONACIÓN', bold: true }),
        ],
      });
  
      const description = new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `Este informe detalla las entradas y salidas de donaciones del proveedor "${providerName}" para los lotes: ${lotes.join(', ')}.`,
          }),
        ],
      });
  
      const entradas = await prisma.donation.findMany({
        where: {
          type: 'Entrada',
          provider: { name: providerName },
          lote: { in: lotes },
        },
        include: {
          detDonation: { include: { medicine: true } },
        },
      });
  
      if (entradas.length === 0) {
        throw new Error('No se encontraron entradas para el proveedor y lotes indicados.');
      }
  
      const lotesConfirmados = entradas.map(e => e.lote);
  
      const salidas = await prisma.donation.findMany({
        where: {
          type: 'Salida',
          lote: { in: lotesConfirmados },
        },
        include: {
          institution: true,
          detDonation: { include: { medicine: true } },
        },
      });
  
      const rows: TableRow[] = [];
  
      for (const entrada of entradas) {
        const lote = entrada.lote;
        const totalEntrada = entrada.detDonation.reduce((acc, d) => acc + d.amount, 0);
  
        rows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lote, bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Entrada de proveedor: ${providerName}`, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(`${totalEntrada}`)] }),
              new TableCell({ children: [new Paragraph('')] }),
            ],
          })
        );
  
        const instituciones = salidas.filter(s => s.lote === lote);
  
        for (const salida of instituciones) {
          const nombre = salida.institution?.name || 'Sin institución';
          const cantidad = salida.detDonation.reduce((acc, d) => acc + d.amount, 0);
          const beneficiarios = salida.detDonation.reduce((acc, d) => acc + (d.medicine.benefited * d.amount), 0);
  
          rows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('')] }),
                new TableCell({ children: [new Paragraph(nombre)] }),
                new TableCell({ children: [new Paragraph(`${cantidad}`)] }),
                new TableCell({ children: [new Paragraph(`${beneficiarios}`)] }),
              ],
            })
          );
        }
      }
  
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Lote')] }),
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Proveedor / Institución')] }),
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Cantidad')] }),
              new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph('Beneficiarios')] }),
            ],
          }),
          ...rows,
        ],
      });
  
      const doc = new Document({
        sections: [
          {
            headers: { default: header },
            children: [title, description, table],
          },
        ],
      });
  
      return await Packer.toBuffer(doc);
    } catch (error) {
      throw new Error(`Error al generar el documento de ejemplo: ${error}`);
    }
  }
  

  async generateFormattedReport(providerName: string, lotes: string[]): Promise<Buffer> {
    try {
      if (!providerName || !lotes.length) throw new Error('Proveedor y lotes son requeridos');
  
      const logoImage = readFileSync('src/assets/logo.png');
      const image = new ImageRun({ data: logoImage, transformation: { width: 100, height: 50 }, type: 'png' });
      const header = new Header({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [image] })] });
  
      const title = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [new TextRun({ text: 'FUNDACIÓN WAYUU TAYA – DIRECT RELIEF', bold: true })],
      });
  
      const subtitle = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'REPORTE DE DONACIÓN DE INSUMOS RECIBIDOS', bold: true })],
      });
  
      const intro = new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun({
          text: `En los meses ${lotes.join(' y ')}, recibimos por parte de ${providerName.toUpperCase()} una donación importante de medicamentos los cuales fueron distribuidos a centros de salud e instituciones del País.`,
        })],
      });
  
      const content: (Paragraph | Table)[] = [title, subtitle, intro];
  
      for (const lote of lotes) {
        const salidas = await prisma.donation.findMany({
          where: { type: 'Salida', lote, provider: { name: providerName } },
          include: {
            institution: true,
            detDonation: true,
          },
        });
  
        const instituciones = new Set<string>();
        const centrosSalud = new Set<string>();
        let totalItems = 0;
  
        for (const don of salidas) {
          if (don.institution?.name) instituciones.add(don.institution.name);
          // suponiendo que el campo "institution" representa centros también
          totalItems += don.detDonation.reduce((sum, d) => sum + d.amount, 0);
        }
  
        const beneficiarios = totalItems; // provisional
  
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: ['Meses', 'Centros de Salud', 'Instituciones y Organizaciones', 'Beneficiarios', 'Items Entregados'].map(
                text => new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })
              )
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(lote)] }),
                new TableCell({ children: [new Paragraph(centrosSalud.size.toString())] }),
                new TableCell({ children: [new Paragraph(instituciones.size.toString())] }),
                new TableCell({ children: [new Paragraph(beneficiarios.toString())] }),
                new TableCell({ children: [new Paragraph(totalItems.toString())] }),
              ],
            }),
          ],
        });
  
        content.push(new Paragraph({ text: `LOTE ${lote.toUpperCase()}`, spacing: { after: 200 }, children: [new TextRun({ bold: true })] }));
        content.push(table);
      }
  
      const doc = new Document({ sections: [{ headers: { default: header }, children: content }] });
      return await Packer.toBuffer(doc);
    } catch (error) {
      throw new Error(`Error al generar el documento formateado: ${error}`);
    }
  };


  async generateUnifiedDonationReport(dto: ReportsDTO): Promise<Buffer> {
    try {
      const { provider, lotes } = dto;
  
      if (!provider || !lotes || lotes.length === 0) {
        throw new Error('Se requiere el nombre del proveedor y al menos un lote.');
      }
  
      const logoImage = readFileSync('src/assets/logo.png');
  
      const image = new ImageRun({
        data: logoImage,
        transformation: { width: 150, height: 100 },
        type: 'png',
      });
  
      const header = new Header({
        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [image] })],
      });
  
      const title = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [new TextRun({ text: 'REPORTE DE MOVIMIENTOS DE DONACIÓN', bold: true, font: 'Calibri' })],
      });
  
      const description = new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `Este informe detalla las entradas y salidas de donaciones del proveedor "${provider}" para los lotes: ${lotes.join(', ')}.`,
            font: 'Calibri',
            size: 24,
          }),
        ],
      });
  
      // Consulta de entradas
      const entradas = await prisma.donation.findMany({
        where: {
          type: 'Entrada',
          provider: { name: provider },
          lote: { in: lotes },
        },
        include: {
          detDonation: { include: { medicine: true } },
        },
      });
  
      if (entradas.length === 0) {
        throw new Error('No se encontraron entradas para el proveedor y lotes indicados.');
      }
  
      const lotesConfirmados = entradas.map(e => e.lote);
  
      // Consulta de salidas
      const salidas = await prisma.donation.findMany({
        where: {
          type: 'Salida',
          lote: { in: lotesConfirmados },
        },
        include: {
          institution: true,
          detDonation: { include: { medicine: true } },
        },
      });
  
      const sections: (Paragraph | Table)[] = [];
      const medicineSummaries: (Paragraph | Table)[] = [];
      const medicinesMap: Record<string, { items: number; beneficiarios: number }> = {};
  
      for (const lote of lotesConfirmados) {
        // Filtra todas las salidas de este lote
        const donacionesLote = salidas.filter(s => s.lote === lote);
  
        // Agrupa salidas por mes/año
        const salidasPorMes: Record<string, typeof donacionesLote> = {};
        for (const salida of donacionesLote) {
          const mesAnio = salida.date ? format(new Date(salida.date), 'MMMM yyyy') : 'Fecha desconocida';
          if (!salidasPorMes[mesAnio]) salidasPorMes[mesAnio] = [];
          salidasPorMes[mesAnio].push(salida);
        }
        const meses = Object.keys(salidasPorMes);
  
        // Calcula totales para las columnas fusionadas
        const instituciones = new Set<string>();
        const centros = new Set<string>();
        let totalItems = 0;
        let totalBeneficiarios = 0;
  
        for (const salida of donacionesLote) {
          const nombre = salida.institution?.name || 'Sin institución';
          const tipo = salida.institution?.type || 'Desconocido';
          if (tipo === 'Centro de Salud') {
            centros.add(nombre);
          } else {
            instituciones.add(nombre);
          }
          for (const d of salida.detDonation) {
            totalItems += d.amount;
            totalBeneficiarios += d.amount * d.medicine.benefited;
  
            const medName = d.medicine.name;
            if (!medicinesMap[medName]) {
              medicinesMap[medName] = { items: 0, beneficiarios: 0 };
            }
            medicinesMap[medName].items += d.amount;
            medicinesMap[medName].beneficiarios += d.amount * d.medicine.benefited;
          }
        }
  
        // Nombre del lote justo antes de la tabla
        sections.push(new Paragraph({
          text: `LOTE ${lote}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 10 },
          children: [new TextRun({ font: 'Calibri', size: 28, bold: true })],
        }));
  
        // Construye la tabla con rowSpan para las columnas fusionadas
        const tableRows: TableRow[] = [];
  
        // Fila de encabezados
        tableRows.push(new TableRow({
          children: [
            new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Mes', bold: true, font: 'Calibri', size: 24 })] })] }),
            new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Centros de Salud', bold: true, font: 'Calibri', size: 24 })] })] }),
            new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Instituciones y Organizaciones', bold: true, font: 'Calibri', size: 24 })] })] }),
            new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Beneficiarios', bold: true, font: 'Calibri', size: 24 })] })] }),
            new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Items entregados', bold: true, font: 'Calibri', size: 24 })] })] }),
          ],
        }));
  
        meses.forEach((mes, i) => {
          const isFirst = i === 0;
          tableRows.push(new TableRow({
            children: [
              // Celda de mes
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mes, font: 'Calibri', size: 24 })] })] }),
              // Las demás celdas solo en la primera fila, luego se fusionan verticalmente (rowSpan)
              ...(isFirst ? [
                new TableCell({
                  rowSpan: meses.length,
                  children: [new Paragraph({ children: [new TextRun({ text: `${centros.size}`, font: 'Calibri', size: 24 })] })],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  rowSpan: meses.length,
                  children: [new Paragraph({ children: [new TextRun({ text: `${instituciones.size}`, font: 'Calibri', size: 24 })] })],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  rowSpan: meses.length,
                  children: [new Paragraph({ children: [new TextRun({ text: `${totalBeneficiarios}`, font: 'Calibri', size: 24 })] })],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  rowSpan: meses.length,
                  children: [new Paragraph({ children: [new TextRun({ text: `${totalItems}`, font: 'Calibri', size: 24 })] })],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ] : []),
            ],
          }));
        });
  
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        }));
      }
  
      // Resumen por medicina
      for (const [medicine, data] of Object.entries(medicinesMap)) {
        medicineSummaries.push(new Paragraph({ text: '', spacing: { after: 300 } }));
        medicineSummaries.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    shading: { fill: 'E6F0FA' },
                    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: medicine, bold: true, font: 'Calibri', size: 24 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Items Entregados', bold: true, font: 'Calibri', size: 24 })] })] }),
                  new TableCell({ shading: { fill: 'CCE5FF' }, children: [new Paragraph({ children: [new TextRun({ text: 'Total Beneficiarios', bold: true, font: 'Calibri', size: 24 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${data.items}`, font: 'Calibri', size: 24 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${data.beneficiarios}`, font: 'Calibri', size: 24 })] })] }),
                ],
              }),
            ],
          })
        );
      }
  
      const doc = new Document({
        sections: [
          {
            headers: { default: header },
            children: [title, description, ...sections, ...medicineSummaries],
          },
        ],
      });
  
      return await Packer.toBuffer(doc);
    } catch (error) {
      throw new Error(`Error al generar el documento: ${error}`);
    }
}

}
// 🤡🤡🤡🤡🤡🤡🤡