type CsvRow = Record<string, string | number | null | undefined>;

export function generateCsv(rows: CsvRow[], headers?: string[]): Buffer {
  const csvHeaders = headers ?? Object.keys(rows[0] ?? {});

  if (csvHeaders.length === 0) {
    return Buffer.from('', 'utf8');
  }

  const lines = [
    csvHeaders.map(escapeCsvValue).join(','),
    ...rows.map((row) =>
      csvHeaders.map((header) => escapeCsvValue(row[header])).join(','),
    ),
  ];

  return Buffer.from(lines.join('\n'), 'utf8');
}

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}
