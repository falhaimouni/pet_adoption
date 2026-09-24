type XmlRow = Record<string, string | number | null | undefined>;

export function generateXml(rootName: string, itemName: string, rows: XmlRow[]): Buffer {
  const body = rows
    .map((row) => {
      const fields = Object.entries(row)
        .map(([key, value]) => `<${key}>${escapeXml(value)}</${key}>`)
        .join('');
      return `<${itemName}>${fields}</${itemName}>`;
    })
    .join('');

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><${rootName}>${body}</${rootName}>`, 'utf8');
}

function escapeXml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
