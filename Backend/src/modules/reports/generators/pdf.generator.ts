import PDFDocument from 'pdfkit';

interface PdfTable {
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}

interface PdfReport {
  title: string;
  period?: string;
  summary: Record<string, string | number>;
  table: PdfTable;
}

const PAGE_MARGIN = 48;
const HEADER_HEIGHT = 24;
const MIN_ROW_HEIGHT = 28;
const CELL_PADDING = 6;
const BODY_FONT_SIZE = 9;
const HEADER_FONT_SIZE = 9;
const HEADER_FILL = '#e9eef5';
const EVEN_ROW_FILL = '#f8fafc';
const BORDER_COLOR = '#cbd5e1';
const TEXT_COLOR = '#1f2937';

export function generatePdf(report: PdfReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: {
        Title: report.title,
        Author: 'Pet Adoption Center',
      },
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawReport(doc, report);
    doc.end();
  });
}

function drawReport(doc: PDFKit.PDFDocument, report: PdfReport): void {
  drawDocumentHeader(doc, report);
  drawSummary(doc, report.summary);
  drawDetails(doc, report.table);
}

function drawDocumentHeader(doc: PDFKit.PDFDocument, report: PdfReport): void {
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('PET ADOPTION CENTER', { align: 'center' })
    .moveDown(0.35);

  doc
    .fontSize(14)
    .fillColor('#334155')
    .text(report.title.toUpperCase(), { align: 'center' });

  if (report.period) {
    doc
      .moveDown(0.35)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text(`Period: ${report.period}`, { align: 'center' });
  }

  doc.moveDown(1.2);
}

function drawSummary(
  doc: PDFKit.PDFDocument,
  summary: Record<string, string | number>,
): void {
  const startX = doc.page.margins.left;
  const availableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columns = 2;
  const gap = 12;
  const itemWidth = (availableWidth - gap) / columns;
  const itemHeight = 42;
  let x = startX;
  let y = doc.y;

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(TEXT_COLOR)
    .text('Summary', startX, y);
  y = doc.y + 10;

  Object.entries(summary).forEach(([label, value], index) => {
    if (index > 0 && index % columns === 0) {
      x = startX;
      y += itemHeight + 8;
    }

    if (y + itemHeight > bottomY(doc)) {
      doc.addPage();
      y = doc.y;
    }

    doc
      .roundedRect(x, y, itemWidth, itemHeight, 4)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.8)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(label, x + 10, y + 8, { width: itemWidth - 20 });

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(TEXT_COLOR)
      .text(String(value), x + 10, y + 22, { width: itemWidth - 20 });

    x += itemWidth + gap;
  });

  doc.y = y + itemHeight + 24;
}

function drawDetails(doc: PDFKit.PDFDocument, table: PdfTable): void {
  const startX = doc.page.margins.left;

  ensureSpace(doc, 54);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(TEXT_COLOR)
    .text('Details', startX, doc.y);
  doc.moveDown(0.6);

  if (table.rows.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text('No data found', startX, doc.y);
    return;
  }

  const columnWidths = getColumnWidths(doc, table.headers);
  drawTableHeader(doc, table.headers, columnWidths);

  table.rows.forEach((row, index) => {
    const normalizedRow = columnWidths.map((_, cellIndex) =>
      formatCell(row[cellIndex]),
    );
    const rowHeight = calculateRowHeight(doc, normalizedRow, columnWidths);

    if (doc.y + rowHeight > bottomY(doc)) {
      doc.addPage();
      drawTableHeader(doc, table.headers, columnWidths);
    }

    drawTableRow(doc, row, columnWidths, index);
  });
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  headers: string[],
  columnWidths: number[],
): void {
  ensureSpace(doc, HEADER_HEIGHT + MIN_ROW_HEIGHT);

  const x = doc.page.margins.left;
  const y = doc.y;
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);

  doc.rect(x, y, tableWidth, HEADER_HEIGHT).fill(HEADER_FILL);
  drawCellBorders(doc, x, y, columnWidths, HEADER_HEIGHT);

  let currentX = x;
  headers.forEach((header, index) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(HEADER_FONT_SIZE)
      .fillColor(TEXT_COLOR)
      .text(header, currentX + CELL_PADDING, y + 7, {
        width: columnWidths[index] - CELL_PADDING * 2,
        height: HEADER_HEIGHT - CELL_PADDING,
      });
    currentX += columnWidths[index];
  });

  doc.y = y + HEADER_HEIGHT;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  row: Array<string | number | null | undefined>,
  columnWidths: number[],
  rowIndex: number,
): void {
  const normalizedRow = columnWidths.map((_, index) => formatCell(row[index]));
  const rowHeight = calculateRowHeight(doc, normalizedRow, columnWidths);

  const x = doc.page.margins.left;
  const y = doc.y;
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);

  if (rowIndex % 2 === 1) {
    doc.rect(x, y, tableWidth, rowHeight).fill(EVEN_ROW_FILL);
  }

  drawCellBorders(doc, x, y, columnWidths, rowHeight);

  let currentX = x;
  normalizedRow.forEach((value, index) => {
    doc
      .font('Helvetica')
      .fontSize(BODY_FONT_SIZE)
      .fillColor(TEXT_COLOR)
      .text(value, currentX + CELL_PADDING, y + CELL_PADDING, {
        width: columnWidths[index] - CELL_PADDING * 2,
        height: rowHeight - CELL_PADDING * 2,
      });

    currentX += columnWidths[index];
  });

  doc.y = y + rowHeight;
}

function calculateRowHeight(
  doc: PDFKit.PDFDocument,
  row: string[],
  columnWidths: number[],
): number {
  doc.font('Helvetica').fontSize(BODY_FONT_SIZE);

  const maxCellHeight = row.reduce((height, value, index) => {
    const textHeight = doc.heightOfString(value, {
      width: columnWidths[index] - CELL_PADDING * 2,
    });

    return Math.max(height, textHeight + CELL_PADDING * 2);
  }, MIN_ROW_HEIGHT);

  return Math.min(Math.max(maxCellHeight, MIN_ROW_HEIGHT), 120);
}

function drawCellBorders(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  columnWidths: number[],
  height: number,
): void {
  let currentX = x;

  doc
    .strokeColor(BORDER_COLOR)
    .lineWidth(0.5)
    .rect(x, y, columnWidths.reduce((total, width) => total + width, 0), height)
    .stroke();

  columnWidths.slice(0, -1).forEach((width) => {
    currentX += width;
    doc
      .moveTo(currentX, y)
      .lineTo(currentX, y + height)
      .stroke();
  });
}

function getColumnWidths(
  doc: PDFKit.PDFDocument,
  headers: string[],
): number[] {
  const availableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const weights = headers.map((header) => {
    const normalized = header.toLowerCase();

    if (['adopter', 'approved by', 'supplier', 'breed'].includes(normalized)) {
      return 1.35;
    }

    if (['pet', 'supply', 'adoption id'].includes(normalized)) {
      return 1.2;
    }

    if (['quantity', 'minimum', 'age', 'value'].includes(normalized)) {
      return 0.75;
    }

    return 1;
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);

  return weights.map((weight) => (availableWidth * weight) / totalWeight);
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
  if (doc.y + height > bottomY(doc)) {
    doc.addPage();
  }
}

function bottomY(doc: PDFKit.PDFDocument): number {
  return doc.page.height - doc.page.margins.bottom;
}

function formatCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value).replace(/\s+/g, ' ').trim();
}
