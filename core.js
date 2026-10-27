/* Pure export functions, shared by the plugin and tests. */
var VocabularyCore = (() => {
  const clean = value => String(value || '').normalize('NFC').replace(/[\t\r\n\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim();
  function select(rows, color, tagged) {
    return rows.filter(r => (!color || r.color === color) && (!tagged || r.tags.some(t => t.toLowerCase() === 'vocab')));
  }
  function exportRows(rows) {
    const seen = new Set(), lines = [];
    let missing = 0, duplicates = 0;
    for (const row of rows) {
      if (!row.selected) continue;
      const term = clean(row.term), meaning = clean(row.meaning);
      if (!term || !meaning) { missing++; continue; }
      const key = JSON.stringify([term, meaning]);
      if (seen.has(key)) { duplicates++; continue; }
      seen.add(key);
      lines.push(term + '\t' + meaning);
    }
    return { text: lines.join('\n'), count: lines.length, missing, duplicates };
  }
  return { clean, select, exportRows };
})();
if (typeof module !== 'undefined') module.exports = VocabularyCore;
