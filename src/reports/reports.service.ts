import { Injectable } from '@nestjs/common';
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
    Media,ImageRun} from 'docx';
    import { readFileSync } from 'fs';

@Injectable()
export class ReportsService {

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

  // report.service.ts
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
}
