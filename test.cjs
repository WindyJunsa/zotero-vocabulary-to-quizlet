const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./core.js');
test('Zotero mandatory manifest fields and secure update requirement are satisfied', () => {
  const manifest = JSON.parse(fs.readFileSync(__dirname + '/manifest.json', 'utf8'));
  const app = manifest.applications.zotero;
  for (const name of ['id', 'update_url', 'strict_min_version', 'strict_max_version']) assert.ok(app[name], name + ' is required');
  assert.equal(new URL(app.update_url).protocol, 'https:');
  assert.equal(new URL(app.update_url).hostname, 'raw.githubusercontent.com');
  assert.equal(manifest.author, 'Huziqian');
});
const row = (term, meaning, extra = {}) => ({ term, meaning, selected: true, ...extra });
test('Armenian Unicode survives export; embedded separators cannot create extra cards', () => {
  assert.equal(core.exportRows([row('տուն', 'house\n home\tbuilding')]).text, 'տուն\thouse home building');
});
test('missing meanings are reported, never silently exported', () => {
  const result = core.exportRows([row('տուն', ''), row('ես', 'I'), row('ignored', '', { selected: false })]);
  assert.equal(result.missing, 1); assert.equal(result.count, 1);
});
test('only exact pairs deduplicate; different senses of a word survive', () => {
  const result = core.exportRows([row('word', 'one'), row('word', 'one'), row('word', 'two')]);
  assert.equal(result.duplicates, 1); assert.equal(result.count, 2);
});
test('color and vocab tag filters combine', () => {
  const rows = [row('a', 'b', { color: 'blue', tags: ['Vocab'] }), row('c', 'd', { color: 'red', tags: ['vocab'] }), row('e', 'f', { color: 'blue', tags: [] })];
  assert.equal(core.select(rows, 'blue', true).length, 1);
  assert.equal(core.select(rows, '', false).length, 3);
});
test('HTML-looking vocabulary remains literal text', () => {
  assert.equal(core.exportRows([row('<img onerror=bad>', 'literal')]).text, '<img onerror=bad>\tliteral');
});
test('empty collection produces an empty export', () => assert.equal(core.exportRows([]).count, 0));
function host() {
  let payload, stored = '{}', copied = '', launched = '';
  const attachment = { id: 5, isPDFAttachment: () => true, getField: () => 'Book', getAnnotations: () => [
    { libraryID: 1, key: 'ABC', annotationType: 'highlight', annotationText: 'տուն', annotationComment: 'house', annotationColor: '#ffd400', annotationPageLabel: '2', getTags: () => [{ tag: 'vocab' }] },
    { annotationType: 'note' }, { annotationType: 'highlight', deleted: true }
  ] };
  const win = { Zotero_Tabs: { selectedID: 'pdf' },
    DOMParser: class { parseFromString(value) { return { body: { textContent: value }, querySelectorAll: () => [] }; } },
    openDialog: (...args) => { payload = args[3]; return { addEventListener() {} }; } };
  const context = vm.createContext({
    Zotero: { Reader: { getByTabID: () => ({ itemID: 5 }) }, Items: { getAsync: async () => attachment },
      Prefs: { get: () => stored, set: (key, value) => stored = value }, launchURL: url => launched = url },
    Components: { classes: { '@mozilla.org/widget/clipboardhelper;1': { getService: () => ({ copyString: value => copied = value }) } }, interfaces: {} },
    Services: {}
  });
  vm.runInContext(fs.readFileSync(__dirname + '/bootstrap.js', 'utf8'), context);
  return { context, win, get payload() { return payload; }, get stored() { return JSON.parse(stored); }, get copied() { return copied; }, get launched() { return launched; } };
}
test('host integration: reads active PDF, excludes notes/deleted marks, exports and saves draft', async () => {
  const h = host(); await h.context.openVocabulary(h.win);
  assert.equal(h.payload.rows.length, 1);
  assert.equal(h.payload.rows[0].meaning, 'house');
  h.payload.rows[0].meaning = 'home'; h.payload.save(h.payload.rows);
  assert.equal(h.stored['1:ABC'].meaning, 'home');
  h.payload.copy(core.exportRows(h.payload.rows).text);
  assert.equal(h.copied, 'տուն\thome');
  h.payload.openQuizlet(); assert.equal(h.launched, 'https://quizlet.com/create-set');
  await h.context.openVocabulary(h.win); assert.equal(h.payload.rows[0].meaning, 'home');
});
test('host integration: saving one review preserves drafts from another', async () => {
  const h = host(); await h.context.openVocabulary(h.win);
  h.payload.save([{ id: '2:OTHER', meaning: 'other meaning' }]);
  h.payload.save([{ id: '1:ABC', meaning: 'house' }]);
  assert.equal(h.stored['2:OTHER'].meaning, 'other meaning');
});
