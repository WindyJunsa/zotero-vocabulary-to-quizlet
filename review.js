const t = (key,args) => payload.translate(key,args);
const payload = window.arguments[0];
const rows = payload.rows;
const $ = id => document.getElementById(id);
const element = name => document.createElementNS('http://www.w3.org/1999/xhtml', name);
document.documentElement.lang = payload.language;
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const labels = []; while (walker.nextNode()) labels.push(walker.currentNode);
for (const node of labels) { const text=node.nodeValue.trim(); if(text) node.nodeValue=node.nodeValue.replace(text,t(text)); }
let dirty = false;
const visible = () => VocabularyCore.select(rows, $('color').value, $('tagged').checked);
function refresh() {
  const result = VocabularyCore.exportRows(visible());
  $('preview').value = result.text;
  $('status').textContent = t('Marked passages: {marked} · Ready cards: {count} · Incomplete: {missing} · Exact duplicates omitted: {duplicates}',{marked:visible().length,...result});
  $('copy').disabled = !result.count || !!result.missing;
}
function render() {
  $('rows').replaceChildren();
  for (const row of visible()) {
    const tr = element('tr');
    const selectedCell = element('td'), checkbox = element('input');
    checkbox.type = 'checkbox'; checkbox.checked = row.selected;
    checkbox.setAttribute('aria-label', t('Include {term}',{term:row.term}));
    checkbox.addEventListener('change', () => { row.selected = checkbox.checked; refresh(); });
    selectedCell.append(checkbox); tr.append(selectedCell);
    for (const field of ['term', 'meaning']) {
      const td = element('td'), input = element('textarea');
      input.value = row[field]; input.required = true;
      input.setAttribute('aria-label', field === 'term' ? t("Word or phrase") : t('English meaning for {term}',{term:row.term}));
      input.addEventListener('input', () => { row[field] = input.value; if (field === 'meaning') dirty = true; refresh(); });
      td.append(input); tr.append(td);
    }
    const source = element('td'); source.textContent = row.source + (row.page ? t(" · p. ") + row.page : '');
    tr.append(source); $('rows').append(tr);
  }
  refresh();
}
for (const color of [...new Set(rows.map(r => r.color))].sort()) {
  if (!color) continue;
  const option = element('option'); option.value = color;
  const names = { '#ffd400': t("Yellow"), '#ff6666': t("Red"), '#5fb236': t("Green"), '#2ea8e5': t("Blue"), '#a28ae5': t("Purple"), '#e56eee': t("Magenta"), '#f19837': t("Orange"), '#aaaaaa': t("Gray") };
  option.textContent = names[color.toLowerCase()] || color; $('color').append(option);
}
$('color').addEventListener('change', render);
$('tagged').addEventListener('change', render);
$('selectAll').addEventListener('click', () => { visible().forEach(r => r.selected = true); render(); });
$('selectNone').addEventListener('click', () => { visible().forEach(r => r.selected = false); render(); });
function action(fn, message) {
  try { fn(); $('status').textContent = message; }
  catch (error) { $('status').textContent = t("Could not complete action: ") + error.message; }
}
function save() { payload.save(rows); dirty = false; }
$('save').addEventListener('click', () => action(save, t("Meanings saved locally. PDF annotations are unchanged. Word edits apply to this export only.")));
$('copy').addEventListener('click', () => {
  const result = VocabularyCore.exportRows(visible());
  if (!result.count || result.missing) return;
  action(() => { save(); payload.copy(result.text); }, t('{count} cards copied; meanings saved. Paste into Quizlet’s Import box.',{count:result.count}));
});
$('open').addEventListener('click', () => action(payload.openQuizlet, t("Quizlet opened. Choose Import and paste the copied cards.")));
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
render();
