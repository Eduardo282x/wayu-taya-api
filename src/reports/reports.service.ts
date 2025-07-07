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
    VerticalAlign,
    HeightRule,
    BorderStyle} from 'docx';
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
  
      const loteDiciembreTable = createTable([
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
                children: [new TextRun({ text: 'LOTE NOVIEMBRE 2024', bold: true })],
              }),
              loteDiciembreTable,
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
        transformation: { width: 180, height: 120 }, 
        type: 'png' 
      });
      
      // Header mejorado con mejor espaciado
      const header = new Header({ 
        children: [
          new Paragraph({ 
            alignment: AlignmentType.LEFT, 
            spacing: { after: 200 },
            children: [image] 
          })
        ] 
      });
    
      // Título principal con mejor tipografía y espaciado
      const title = new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400, before: 200 },
        children: [
          new TextRun({ 
            text: 'REPORTE DE MOVIMIENTOS DE DONACIÓN', 
            bold: true, 
            font: 'Calibri', 
            size: 32,
            color: '1F4E79' // Azul oscuro profesional
          })
        ],
      });
    
      // Descripción con mejor formato y línea divisoria visual
      const description = new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: `Este informe detalla las entradas y salidas de donaciones del proveedor "${provider}" para los lotes: ${lotes.join(', ')}.`,
            font: 'Calibri',
            size: 26,
            color: '404040' // Gris oscuro
          })
        ],
      });
    
      // Línea divisoria elegante
      const dividerLine = new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: '━'.repeat(80),
            font: 'Calibri',
            size: 20,
            color: 'B8CCE4' // Azul claro
          })
        ],
        alignment: AlignmentType.CENTER,
      });
    
      const entradas = await prisma.donation.findMany({
        where: { type: 'Entrada', provider: { name: provider }, lote: { in: lotes } },
        include: { detDonation: { include: { medicine: true } } },
      });
      if (entradas.length === 0) throw new Error('No se encontraron entradas para el proveedor y lotes indicados.');
      const lotesConfirmados = entradas.map(e => e.lote);
    
      const salidas = await prisma.donation.findMany({
        where: { type: 'Salida', lote: { in: lotesConfirmados } },
        include: {
          institution: {
            include: {
              parish: { include: { town: { include: { city: { include: { state: true } } } } } },
            },
          },
          detDonation: { include: { medicine: true } },
        },
      });
    
      const sections: (Paragraph | Table)[] = [];
      const medicineSummaries: (Paragraph | Table)[] = [];
      const medicinesMap: Record<string, { items: number; beneficiarios: number }> = {};
      const locations: { state: string; city: string; town: string; parish: string; institution: string }[] = [];
      const uniqueStates = new Set<string>();
      const uniqueCities = new Set<string>();
      const uniqueParishes = new Set<string>();
    
      for (const lote of lotesConfirmados) {
        const donacionesLote = salidas.filter(s => s.lote === lote);
        const salidasPorMes: Record<string, typeof donacionesLote> = {};
        for (const salida of donacionesLote) {
          const mesAnio = salida.date ? format(new Date(salida.date), 'MMMM yyyy') : 'Fecha desconocida';
          if (!salidasPorMes[mesAnio]) salidasPorMes[mesAnio] = [];
          salidasPorMes[mesAnio].push(salida);
        }
        const meses = Object.keys(salidasPorMes);
    
        const instituciones = new Set<string>();
        const centros = new Set<string>();
        let totalItems = 0;
        let totalBeneficiarios = 0;
    
        for (const salida of donacionesLote) {
          const nombre = salida.institution?.name || 'Sin institución';
          const tipo = salida.institution?.type || 'Desconocido';
          if (tipo === 'Centro de Salud') centros.add(nombre);
          else instituciones.add(nombre);
    
          const parish = salida.institution?.parish;
          if (parish) {
            uniqueParishes.add(parish.name);
            uniqueStates.add(parish.town.city.state.name);
            uniqueCities.add(parish.town.city.name);
            locations.push({
              state: parish.town.city.state.name,
              city: parish.town.city.name,
              town: parish.town.name,
              parish: parish.name,
              institution: salida.institution.name,
            });
          }
    
          for (const d of salida.detDonation) {
            totalItems += d.amount;
            totalBeneficiarios += d.amount * d.medicine.benefited;
            const medName = d.medicine.name;
            if (!medicinesMap[medName]) medicinesMap[medName] = { items: 0, beneficiarios: 0 };
            medicinesMap[medName].items += d.amount;
            medicinesMap[medName].beneficiarios += d.amount * d.medicine.benefited;
          }
        }
    
        // Título de lote con mejor diseño
        sections.push(new Paragraph({
          spacing: { after: 300, before: 400 },
          children: [
            new TextRun({ 
              text: `LOTE ${lote}`, 
              font: 'Calibri', 
              size: 30, 
              bold: true, 
              color: '1F4E79' // Azul oscuro
            })
          ],
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.LEFT,
        }));
    
        // Subtítulo descriptivo
        sections.push(new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Resumen de distribución por períodos',
              font: 'Calibri',
              size: 22,
              color: '595959', // Gris medio
              italics: true
            })
          ],
          alignment: AlignmentType.LEFT,
        }));
    
        const tableRows: TableRow[] = [];
        
        // Encabezado de tabla mejorado con gradiente visual
        tableRows.push(new TableRow({
          height: { value: 900, rule: HeightRule.ATLEAST },
          children: [
            new TableCell({ 
              shading: { fill: '1F4E79' }, // Azul oscuro
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: 'PERÍODOS', 
                  bold: true, 
                  font: 'Calibri', 
                  size: 26, 
                  color: 'FFFFFF' 
                })] 
              })] 
            }),
            new TableCell({ 
              shading: { fill: '2E5984' }, // Azul medio-oscuro
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: 'CENTROS DE SALUD', 
                  bold: true, 
                  font: 'Calibri', 
                  size: 26, 
                  color: 'FFFFFF' 
                })] 
              })] 
            }),
            new TableCell({ 
              shading: { fill: '3D648F' }, // Azul medio
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: 'INSTITUCIONES Y ORGANIZACIONES', 
                  bold: true, 
                  font: 'Calibri', 
                  size: 26, 
                  color: 'FFFFFF' 
                })] 
              })] 
            }),
            new TableCell({ 
              shading: { fill: '4C6F9A' }, // Azul medio-claro
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: 'BENEFICIARIOS', 
                  bold: true, 
                  font: 'Calibri', 
                  size: 26, 
                  color: 'FFFFFF' 
                })] 
              })] 
            }),
            new TableCell({ 
              shading: { fill: '5B7AA5' }, // Azul claro
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: 'ITEMS ENTREGADOS', 
                  bold: true, 
                  font: 'Calibri', 
                  size: 26, 
                  color: 'FFFFFF' 
                })] 
              })] 
            }),
          ],
        }));
    
        // Filas de datos con colores alternos
        meses.forEach((mes, i) => {
          const isFirst = i === 0;
          const isEven = i % 2 === 0;
          const bgColor = isEven ? 'F8F9FA' : 'FFFFFF'; // Alternancia sutil
          
          tableRows.push(new TableRow({
            height: { value: 700, rule: HeightRule.ATLEAST },
            children: [
              new TableCell({ 
                shading: { fill: bgColor },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER, 
                  children: [new TextRun({ 
                    text: mes, 
                    font: 'Calibri', 
                    size: 24, 
                    color: '404040' 
                  })] 
                })] 
              }),
              ...(isFirst ? [
                new TableCell({ 
                  rowSpan: meses.length, 
                  shading: { fill: 'E8F1FF' }, // Azul muy claro
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: `${centros.size}`, 
                      font: 'Calibri', 
                      size: 28, 
                      bold: true, 
                      color: '1F4E79' 
                    })] 
                  })] 
                }),
                new TableCell({ 
                  rowSpan: meses.length, 
                  shading: { fill: 'F0F0F0' }, // Gris claro
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: `${instituciones.size}`, 
                      font: 'Calibri', 
                      size: 28, 
                      bold: true, 
                      color: '404040' 
                    })] 
                  })] 
                }),
                new TableCell({ 
                  rowSpan: meses.length, 
                  shading: { fill: 'E8F1FF' }, // Azul muy claro
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: `${totalBeneficiarios.toLocaleString()}`, 
                      font: 'Calibri', 
                      size: 28, 
                      bold: true, 
                      color: '1F4E79' 
                    })] 
                  })] 
                }),
                new TableCell({ 
                  rowSpan: meses.length, 
                  shading: { fill: 'F0F0F0' }, // Gris claro
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: `${totalItems.toLocaleString()}`, 
                      font: 'Calibri', 
                      size: 28, 
                      bold: true, 
                      color: '404040' 
                    })] 
                  })] 
                }),
              ] : []),
            ],
          }));
        });
    
        sections.push(new Table({ 
          width: { size: 100, type: WidthType.PERCENTAGE }, 
          rows: tableRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: '1F4E79' },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: '1F4E79' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          }
        }));
    
        // Espacio después de cada tabla
        sections.push(new Paragraph({ text: '', spacing: { after: 400 } }));
      }
    
      // Títulos de sección de medicamentos (se agregarán directamente al documento)
      const medicineTitle = new Paragraph({
        spacing: { after: 300, before: 600 },
        children: [
          new TextRun({ 
            text: 'RESUMEN POR MEDICAMENTO', 
            font: 'Calibri', 
            size: 30, 
            bold: true, 
            color: '1F4E79' 
          })
        ],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      });
      
      const medicineSubtitle = new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: 'Detalle de distribución por tipo de medicamento',
            font: 'Calibri',
            size: 22,
            color: '595959',
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
      });
    
      for (const [medicine, data] of Object.entries(medicinesMap) as [string, { items: number; beneficiarios: number }][]) {
        medicineSummaries.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        medicineSummaries.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: '1F4E79' },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: '1F4E79' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
            rows: [
              new TableRow({
                height: { value: 600, rule: HeightRule.ATLEAST },
                children: [
                  new TableCell({ 
                    columnSpan: 2, 
                    shading: { fill: '1F4E79' }, 
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 150, bottom: 150, left: 100, right: 100 },
                    children: [new Paragraph({ 
                      alignment: AlignmentType.CENTER, 
                      children: [new TextRun({ 
                        text: medicine, 
                        bold: true, 
                        font: 'Calibri', 
                        size: 26, 
                        color: 'FFFFFF' 
                      })] 
                    })] 
                  }),
                ],
              }),
              new TableRow({
                height: { value: 500, rule: HeightRule.ATLEAST },
                children: [
                  new TableCell({ 
                    shading: { fill: 'B8CCE4' }, 
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [new Paragraph({ 
                      alignment: AlignmentType.CENTER, 
                      children: [new TextRun({ 
                        text: 'ITEMS ENTREGADOS', 
                        bold: true, 
                        font: 'Calibri', 
                        size: 24, 
                        color: '1F4E79' 
                      })] 
                    })] 
                  }),
                  new TableCell({ 
                    shading: { fill: 'D9D9D9' }, 
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [new Paragraph({ 
                      alignment: AlignmentType.CENTER, 
                      children: [new TextRun({ 
                        text: 'TOTAL BENEFICIARIOS', 
                        bold: true, 
                        font: 'Calibri', 
                        size: 24, 
                        color: '404040' 
                      })] 
                    })] 
                  }),
                ],
              }),
              new TableRow({
                height: { value: 600, rule: HeightRule.ATLEAST },
                children: [
                  new TableCell({ 
                    shading: { fill: 'F0F6FF' },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [new Paragraph({ 
                      alignment: AlignmentType.CENTER, 
                      children: [new TextRun({ 
                        text: `${data.items.toLocaleString()}`, 
                        font: 'Calibri', 
                        size: 28, 
                        bold: true, 
                        color: '1F4E79' 
                      })] 
                    })] 
                  }),
                  new TableCell({ 
                    shading: { fill: 'F8F8F8' },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [new Paragraph({ 
                      alignment: AlignmentType.CENTER, 
                      children: [new TextRun({ 
                        text: `${data.beneficiarios.toLocaleString()}`, 
                        font: 'Calibri', 
                        size: 28, 
                        bold: true, 
                        color: '404040' 
                      })] 
                    })] 
                  }),
                ],
              }),
            ],
          })
        );
      }
    
      // Título para resumen geográfico
      const geoTitle = new Paragraph({
        spacing: { after: 300, before: 600 },
        children: [
          new TextRun({ 
            text: 'RESUMEN GEOGRÁFICO', 
            font: 'Calibri', 
            size: 30, 
            bold: true, 
            color: '1F4E79' 
          })
        ],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      });
    
      const resumenGeo = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 3, color: '1F4E79' },
          bottom: { style: BorderStyle.SINGLE, size: 3, color: '1F4E79' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
        rows: [
          new TableRow({
            height: { value: 600, rule: HeightRule.ATLEAST },
            children: ['ESTADOS', 'MUNICIPIOS', 'PARROQUIAS'].map((txt, index) => {
              const colors = ['1F4E79', '2E5984', '3D648F']; // Gradiente de azules
              return new TableCell({ 
                shading: { fill: colors[index] }, 
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 150, bottom: 150, left: 100, right: 100 },
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER, 
                  children: [new TextRun({ 
                    text: txt, 
                    bold: true, 
                    font: 'Calibri', 
                    size: 26, 
                    color: 'FFFFFF' 
                  })] 
                })] 
              });
            }),
          }),
          new TableRow({
            height: { value: 700, rule: HeightRule.ATLEAST },
            children: [uniqueStates.size, uniqueCities.size, uniqueParishes.size].map((val, index) => {
              const colors = ['E8F1FF', 'F0F0F0', 'E8F1FF']; // Alternancia sutil
              const textColors = ['1F4E79', '404040', '1F4E79'];
              return new TableCell({ 
                shading: { fill: colors[index] },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 150, bottom: 150, left: 100, right: 100 },
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER, 
                  children: [new TextRun({ 
                    text: `${val}`, 
                    font: 'Calibri', 
                    size: 36, 
                    bold: true, 
                    color: textColors[index] 
                  })] 
                })] 
              });
            }),
          }),
        ],
      });
    
      // DEDUPLICACIÓN DE UBICACIONES (sin cambios en la lógica)
      const uniqueLocationsSet = new Set<string>();
      const uniqueLocations: { state: string; city: string; town: string; parish: string; institution: string }[] = [];
    
      for (const location of locations) {
        const locationKey = `${location.state}|${location.city}|${location.town}|${location.parish}|${location.institution}`;
        if (!uniqueLocationsSet.has(locationKey)) {
          uniqueLocationsSet.add(locationKey);
          uniqueLocations.push(location);
        }
      }
    
      const sortedLocations = [...uniqueLocations].sort((a, b) => {
        if (a.state !== b.state) return a.state.localeCompare(b.state);
        if (a.city !== b.city) return a.city.localeCompare(b.city);
        if (a.parish !== b.parish) return a.parish.localeCompare(b.parish);
        return a.institution.localeCompare(b.institution);
      });
    
      function getRowSpans(data: typeof sortedLocations, key: keyof typeof sortedLocations[0]) {
        const spans: { index: number; span: number }[] = [];
        let prev = null, count = 0, start = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i][key] !== prev) {
            if (count > 0) spans.push({ index: start, span: count });
            prev = data[i][key];
            count = 1;
            start = i;
          } else {
            count++;
          }
        }
        if (count > 0) spans.push({ index: start, span: count });
        return spans;
      }
    
      const stateSpans = getRowSpans(sortedLocations, 'state');
      const citySpans = getRowSpans(sortedLocations, 'city');
      const parishSpans = getRowSpans(sortedLocations, 'parish');
    
      // Título para ubicaciones detalladas
      const ubicacionesTitle = new Paragraph({
        spacing: { after: 300, before: 400 },
        children: [
          new TextRun({ 
            text: 'UBICACIONES DETALLADAS', 
            font: 'Calibri', 
            size: 28, 
            bold: true, 
            color: '1F4E79' 
          })
        ],
        alignment: AlignmentType.CENTER,
      });
    
      const ubicacionesTableRows: TableRow[] = [
        new TableRow({
          height: { value: 600, rule: HeightRule.ATLEAST },
          children: ['ESTADO', 'MUNICIPIO', 'PARROQUIA', 'INSTITUCIÓN'].map((txt, index) => {
            const colors = ['1F4E79', '2E5984', '3D648F', '4C6F9A']; // Gradiente de azules
            return new TableCell({ 
              shading: { fill: colors[index] }, 
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: txt, 
                  bold: true, 
                  font: 'Calibri', 
                  size: 24, 
                  color: 'FFFFFF' 
                })] 
              })] 
            });
          }),
        }),
      ];
    
      for (let i = 0; i < sortedLocations.length; i++) {
        const stateSpan = stateSpans.find(s => s.index === i);
        const citySpan = citySpans.find(s => s.index === i);
        const parishSpan = parishSpans.find(s => s.index === i);
        const isEven = i % 2 === 0;
        const bgColor = isEven ? 'F8F9FA' : 'FFFFFF';
    
        ubicacionesTableRows.push(new TableRow({
          height: { value: 500, rule: HeightRule.ATLEAST },
          children: [
            stateSpan
              ? new TableCell({
                  rowSpan: stateSpan.span,
                  shading: { fill: 'E8F1FF' },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: sortedLocations[i].state, 
                      font: 'Calibri', 
                      size: 22, 
                      bold: true, 
                      color: '1F4E79' 
                    })] 
                  })],
                })
              : undefined,
            citySpan
              ? new TableCell({
                  rowSpan: citySpan.span,
                  shading: { fill: 'F0F0F0' },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: sortedLocations[i].city, 
                      font: 'Calibri', 
                      size: 22, 
                      bold: true, 
                      color: '404040' 
                    })] 
                  })],
                })
              : undefined,
            parishSpan
              ? new TableCell({
                  rowSpan: parishSpan.span,
                  shading: { fill: 'E8F1FF' },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [new Paragraph({ 
                    alignment: AlignmentType.CENTER, 
                    children: [new TextRun({ 
                      text: sortedLocations[i].parish, 
                      font: 'Calibri', 
                      size: 22, 
                      color: '1F4E79' 
                    })] 
                  })],
                })
              : undefined,
            new TableCell({ 
              shading: { fill: bgColor },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER, 
                children: [new TextRun({ 
                  text: sortedLocations[i].institution, 
                  font: 'Calibri', 
                  size: 22, 
                  color: '404040' 
                })] 
              })] 
            }),
          ].filter(Boolean),
        }));
      }
    
      const ubicacionesTabla = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: '1F4E79' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: '1F4E79' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
        rows: ubicacionesTableRows,
      });
    
      // Pie de página con información adicional
      const footerInfo = new Paragraph({
        spacing: { before: 600, after: 200 },
        children: [
          new TextRun({
            text: `Documento generado el ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}`,
            font: 'Calibri',
            size: 20,
            color: '808080', // Gris medio
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
      });
    
      const finalDivider = new Paragraph({
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun({
            text: '━'.repeat(50),
            font: 'Calibri',
            size: 16,
            color: 'B8CCE4' // Azul claro
          })
        ],
        alignment: AlignmentType.CENTER,
      });
    
      const doc = new Document({
        sections: [
          {
            headers: { default: header },
            children: [
              title,
              description,
              dividerLine,
              ...sections,
              medicineTitle,
              medicineSubtitle,
              ...medicineSummaries,
              new Paragraph({ pageBreakBefore: true }),
              geoTitle,
              resumenGeo,
              new Paragraph({ text: '', spacing: { after: 400 } }),
              ubicacionesTitle,
              ubicacionesTabla,
              footerInfo,
              finalDivider,
            ],
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