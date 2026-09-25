import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
async function moduleAt(path) {
  const built = await build({ entryPoints: [join(root, path)], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
}
const { default: translations } = await moduleAt('src/i18n/translations.ts');
const { interfaceText } = await moduleAt('src/i18n/interfaceText.ts');
const { translateText } = await moduleAt('src/i18n/text.ts');
const slots = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
test('all three dictionaries have identical keys and interpolation parameters', () => {
  for (const lang of ['ar', 'fr']) {
    assert.deepEqual(Object.keys(translations[lang]).sort(), Object.keys(translations.en).sort());
    for (const [key, english] of Object.entries(translations.en)) {
      assert(translations[lang][key].trim(), `${lang}.${key} is blank`);
      assert.deepEqual(slots(translations[lang][key]), slots(english), `${lang}.${key}`);
    }
  }
  for (const [source, values] of Object.entries(interfaceText)) {
    for (const lang of ['ar', 'fr']) {
      assert(values[lang].trim(), `${source}: missing ${lang}`);
      assert.deepEqual(slots(values[lang]), slots(source), `${source}: ${lang}`);
    }
  }
});
test('counts, names and translated errors retain their meaning', () => {
  assert.equal(translateText('Remove {name} from friends?', { name: 'Sara' }, 'fr'), 'Retirer Sara de vos amis ?');
  assert.match(translateText('{count} / 20 selected', { count: 3 }, 'ar'), /3/);
  assert.equal(translateText('Only PDF documents are allowed.', {}, 'fr'), 'Seuls les documents PDF sont autorisés.');
  assert.equal(translateText('User supplied text', {}, 'ar'), 'User supplied text');
});
function filesIn(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? filesIn(join(dir, entry.name)) : /\.tsx$/.test(entry.name) ? [join(dir, entry.name)] : []); }
const files = [...filesIn(join(root, 'src/pages')), ...filesIn(join(root, 'src/components'))];
const literalExceptions = new Set(['Petopia', 'petopia', 'English', 'Français', 'you@example.com', 'x']);
test('application JSX labels are translated and static translation keys exist', () => {
  const problems = [];
  const englishSources = new Set([...Object.values(translations.en), ...Object.keys(interfaceText)]);
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      let text;
      if (ts.isJsxText(node)) text = node.text.trim().replace(/\s+/g, ' ');
      if (ts.isJsxAttribute(node) && /^(placeholder|title|label|aria-label|alt|pageTitle|description|confirmLabel|actionLabel|trendValue)$/.test(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) text = node.initializer.text;
      if (text && /[A-Za-z]/.test(text) && !literalExceptions.has(text)) problems.push(`${file}: ${text}`);
      if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && !(node.arguments[0].text in translations.en)) problems.push(`${file}: missing key ${node.arguments[0].text}`);
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'tx' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && !englishSources.has(node.arguments[0].text)) problems.push(`${file}: missing source ${node.arguments[0].text}`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(problems, []);
});
