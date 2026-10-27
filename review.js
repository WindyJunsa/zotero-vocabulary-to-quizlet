const payload = window.arguments[0];
const rows = payload.rows;
const $ = id => document.getElementById(id);
const element = name => document.createElementNS('http://www.w3.org/1999/xhtml', name);
let dirty = false;
const visible = () => VocabularyCore.select(rows, $('color').value, $('tagged').checked);
function refresh() {
  const result = VocabularyCore.exportRows(visible());
  $('preview').value = result.text;
  $('status').textContent = `${visible().length} marked passages · ${result.count} cards ready · ${result.missing} missing a word or meaning · ${result.duplicates} exact duplicates omitted`;
  $('copy').disabled = !result.count || !!result.missing;
}
function render() {
  $('rows').replaceChildren();
  for (const row of visible()) {
    const tr = element('tr');
    const selectedCell = element('td'), checkbox = element('input');
    checkbox.type = 'checkbox'; checkbox.checked = row.selected;
    checkbox.setAttribute('aria-label', 'Include ' + row.term);
    checkbox.addEventListener('change', () => { row.selected = checkbox.checked; refresh(); });
    selectedCell.append(checkbox); tr.append(selectedCell);
    for (const field of ['term', 'meaning']) {
      const td = element('td'), input = element('textarea');
      input.value = row[field]; input.required = true;
      input.setAttribute('aria-label', field === 'term' ? 'Word or phrase' : 'English meaning for ' + row.term);
      input.addEventListener('input', () => { row[field] = input.value; if (field === 'meaning') dirty = true; refresh(); });
      td.append(input); tr.append(td);
    }
    const source = element('td'); source.textContent = row.source + (row.page ? ' · p. ' + row.page : '');
    tr.append(source); $('rows').append(tr);
  }
  refresh();
}
for (const color of [...new Set(rows.map(r => r.color))].sort()) {
  if (!color) continue;
  const option = element('option'); option.value = color;
  const names = { '#ffd400': 'Yellow', '#ff6666': 'Red', '#5fb236': 'Green', '#2ea8e5': 'Blue', '#a28ae5': 'Purple', '#e56eee': 'Magenta', '#f19837': 'Orange', '#aaaaaa': 'Gray' };
  option.textContent = names[color.toLowerCase()] || color; $('color').append(option);
}
$('color').addEventListener('change', render);
$('tagged').addEventListener('change', render);
$('selectAll').addEventListener('click', () => { visible().forEach(r => r.selected = true); render(); });
$('selectNone').addEventListener('click', () => { visible().forEach(r => r.selected = false); render(); });
function action(fn, message) {
  try { fn(); $('status').textContent = message; }
  catch (error) { $('status').textContent = 'Could not complete action: ' + error.message; }
}
function save() { payload.save(rows); dirty = false; }
$('save').addEventListener('click', () => action(save, 'Meanings saved locally. PDF annotations are unchanged. Word edits apply to this export only.'));
$('copy').addEventListener('click', () => {
  const result = VocabularyCore.exportRows(visible());
  if (!result.count || result.missing) return;
  action(() => { save(); payload.copy(result.text); }, `${result.count} cards copied; meanings saved. Paste into Quizlet’s Import box.`);
});
$('open').addEventListener('click', () => action(payload.openQuizlet, 'Quizlet opened. Choose Import and paste the copied cards.'));
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
render();
