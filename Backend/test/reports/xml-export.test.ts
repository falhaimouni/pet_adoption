import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateXml } from '../../src/modules/reports/generators/xml.generator';

test('XML export escapes user content and preserves Unicode, numbers and empty fields', () => {
  const xml = generateXml('pets', 'pet', [{ name: 'قطة & <cat> "\' ', age: 0, notes: null }]).toString('utf8');
  assert.equal(xml, '<?xml version="1.0" encoding="UTF-8"?><pets><pet><name>قطة &amp; &lt;cat&gt; &quot;&apos; </name><age>0</age><notes></notes></pet></pets>');
});

test('XML export supports empty reports', () => {
  assert.equal(generateXml('pets', 'pet', []).toString(), '<?xml version="1.0" encoding="UTF-8"?><pets></pets>');
});
