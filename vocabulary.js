/* Copyright 2026 Huziqian. Selection capture and persistent vocabulary sidebar. */
var Vocabulary = (() => {
  const ID = 'vocabulary-to-quizlet@personal.local';
  const PREF = 'extensions.vocabulary-to-quizlet.wordbook.v1';
  const AUTO = 'extensions.vocabulary-to-quizlet.translate-on-add';
  const FTL = 'vocabulary-to-quizlet.ftl';
  const BASE = 'chrome://vocabulary-to-quizlet/content/';
  const views = new Map();
  const pending = new Set();
  const popups = new Set();
  let paneID, alive = false;
  function read() {
    const data = JSON.parse(Zotero.Prefs.get(PREF, true) || '{"version":1,"entries":[]}');
    if (data.version !== 1 || !Array.isArray(data.entries)) throw new Error('Vocabulary data cannot be read. Existing data has not been changed.');
    return data;
  }
  function write(change) {
    const data = read();
    const result = change(data.entries);
    Zotero.Prefs.set(PREF, JSON.stringify(data), true);
    refresh();
    return result;
  }
  function make(doc, tag, text, cls) {
    const node = doc.createElementNS('http://www.w3.org/1999/xhtml', tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function copy(text) {
    Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper).copyString(text);
  }
  function report(view, message) { view.status.textContent = message; }
  function action(view, task) {
    try { return task(); } catch (error) { report(view, error.message || String(error)); Zotero.logError(error); }
  }
  function addWindow(win) { win.MozXULElement.insertFTLIfNeeded(FTL); }
  function removeWindow(win) {
    for (const [body] of views) if (body.ownerDocument.defaultView === win) views.delete(body);
    win.document.querySelector(`link[href="${FTL}"]`)?.remove();
  }
  function refresh() {
    for (const [body, view] of views) {
      if (!body.isConnected) { views.delete(body); continue; }
      renderList(view);
    }
  }
  function edit(id, field, value) {
    write(entries => {
      const entry = entries.find(e => e.id === id && !e.deleted);
      if (!entry) return;
      entry[field] = value;
      if (field === 'meaning') entry.meaningRevision = (entry.meaningRevision || 0) + 1;
      entry.updated = new Date().toISOString();
    });
  }
  async function translate(id) {
    const entry = read().entries.find(e => e.id === id && !e.deleted);
    if (!entry || pending.has(id)) return;
    const api = Zotero.PDFTranslate?.api;
    if (!api?.translate) throw new Error('Enable Translate for Zotero, or type an English meaning.');
    const revision = entry.meaningRevision || 0;
    const originalTerm = entry.term;
    pending.add(id); refresh();
    try {
      const result = await api.translate(originalTerm, { pluginID: ID, langfrom: 'hy', langto: 'en', itemID: entry.sources[0]?.itemID });
      if (!alive) return;
      if (!result?.result || (result.status && !['success', 'done'].includes(result.status))) {
        // Providers may use different success states; a nonempty result is authoritative unless explicitly failed.
        if (!result?.result || ['fail','failure','error'].includes(result.status)) throw new Error('Translation failed. Please enter the English meaning manually.');
      }
      write(entries => {
        const current = entries.find(e => e.id === id && !e.deleted);
        if (!current || current.term !== originalTerm || (current.meaningRevision || 0) !== revision) return;
        current.meaning = VocabularyCore.clean(result.result);
        current.translationError = '';
        current.updated = new Date().toISOString();
      });
    } catch (error) {
      if (alive) write(entries => { const current = entries.find(e => e.id === id); if (current) current.translationError = 'Translation unavailable — enter a meaning or retry.'; });
      Zotero.logError(error);
    } finally { pending.delete(id); if (alive) refresh(); }
  }
  function saveSelection(term, meaning, source) {
    term = VocabularyCore.clean(term);
    if (!term) throw new Error('Select a word or phrase first.');
    return write(entries => {
      let entry = entries.find(e => !e.deleted && VocabularyCore.clean(e.term) === term);
      if (entry) {
        if (!entry.sources.some(s => s.itemID === source.itemID && s.page === source.page)) entry.sources.push(source);
        if (!entry.meaning && meaning.trim()) { entry.meaning = meaning.trim(); entry.meaningRevision = (entry.meaningRevision || 0) + 1; }
      } else {
        entry = { id: Zotero.Utilities.randomString(16), term, meaning: meaning.trim(), meaningRevision: 0, sources: [source], created: new Date().toISOString(), updated: new Date().toISOString() };
        entries.unshift(entry);
      }
      return { id: entry.id, needsMeaning: !entry.meaning };
    });
  }
  function selectionPopup({ reader, doc, params, append }) {
    const term = VocabularyCore.clean(params.annotation?.text);
    if (!term) return;
    const box = make(doc, 'div', undefined, 'hq-vocab-popup');
    box.style.cssText = 'border-top:1px solid #9995;margin-top:8px;padding-top:8px;display:flex;flex-direction:column;gap:6px;';
    const meaning = make(doc, 'input');
    meaning.type = 'text'; meaning.placeholder = 'English meaning (optional)';
    meaning.setAttribute('aria-label', 'Vocabulary English meaning');
    meaning.style.cssText = 'box-sizing:border-box;width:100%;padding:7px;border:1px solid #9998;border-radius:5px;background:transparent;color:inherit;';
    const button = make(doc, 'button', '＋ Add to Vocabulary');
    button.type = 'button'; button.style.cssText = 'padding:9px;border:1px solid #9998;border-radius:6px;cursor:pointer;color:inherit;background:transparent;';
    const label = make(doc, 'label'); label.style.cssText = 'font-size:11px;display:flex;gap:5px;align-items:center;';
    const auto = make(doc, 'input'); auto.type = 'checkbox'; auto.checked = Zotero.Prefs.get(AUTO, true) !== false;
    auto.addEventListener('change', () => Zotero.Prefs.set(AUTO, auto.checked, true));
    label.append(auto, make(doc, 'span', 'Translate to English on add'));
    label.title = 'Uses your configured Translate for Zotero service. Only the selected text is sent for translation.';
    const status = make(doc, 'span'); status.style.fontSize = '11px'; status.setAttribute('role', 'status');
    button.addEventListener('click', async () => {
      try {
        const item = Zotero.Items.get(reader.itemID);
        const source = { itemID: reader.itemID, libraryID: item?.libraryID, key: item?.key, title: item?.getField('title') || 'PDF', page: params.annotation?.pageLabel || '', pageIndex: params.annotation?.position?.pageIndex };
        const saved = saveSelection(term, meaning.value, source);
        button.textContent = '✓ In Vocabulary';
        status.textContent = saved.needsMeaning ? 'Saved. Add a meaning in the Vocabulary sidebar.' : 'Saved to Vocabulary sidebar.';
        showSidebar(reader);
        if (auto.checked && saved.needsMeaning) {
          if (Zotero.PDFTranslate?.api?.translate) { status.textContent = 'Saved — translating to English…'; await translate(saved.id); status.textContent = 'Saved. Review the English meaning in Vocabulary.'; }
          else status.textContent = 'Saved. Enable Translate for Zotero or enter a meaning in the sidebar.';
        }
      } catch (error) { status.textContent = error.message || String(error); Zotero.logError(error); }
    });
    box.append(meaning, button, label, status);
    // Let popup text inputs receive keyboard events without reader shortcuts.
    box.addEventListener('keydown', event => event.stopPropagation());
    append(box);
    for (const old of popups) if (!old.isConnected) popups.delete(old);
    popups.add(box);
  }
  function showSidebar(reader) {
    const doc = reader?._window?.document || Zotero.getMainWindow()?.document;
    if (!doc) return;
    // Use Zotero's own navigation control so its section and pane state stay consistent.
    const nav = [...doc.querySelectorAll('item-pane-sidenav, #zotero-context-pane-sidenav')]
      .flatMap(el => [...el.querySelectorAll('[data-pane]')]).find(el => el.dataset.pane === paneID);
    if (nav) nav.click();
    else {
      const section = [...doc.querySelectorAll('item-pane-custom-section')].find(el => el.paneID === paneID);
      if (section) { section.querySelector('collapsible-section')?.setAttribute('open', 'true'); section.scrollIntoView({ block: 'start' }); }
    }
  }
  function renderList(view) {
    try {
      const entries = read().entries.filter(e => !e.deleted);
      const filter = view.search.value.toLocaleLowerCase();
      const visible = entries.filter(e => (!view.current.checked || e.sources.some(s => s.itemID === view.itemID)) && (!filter || (e.term + ' ' + e.meaning).toLocaleLowerCase().includes(filter)));
      const incomplete = entries.filter(e => !VocabularyCore.clean(e.meaning)).length;
      view.count.textContent = `${entries.length} words · ${incomplete} need meanings`;
      // Preserve a user's in-progress edit while another translation finishes.
      const focused = view.doc.activeElement;
      if (view.list.contains(focused)) { view.deferred = true; return; }
      view.list.replaceChildren(); view.deferred = false;
      if (!visible.length) view.list.append(make(view.doc, 'p', entries.length ? 'No matching words.' : 'Select text in a PDF, then click Add to Vocabulary.', 'hq-vocab-hint'));
      for (const entry of visible) {
        const card = make(view.doc, 'article', undefined, 'hq-vocab-card');
        const term = make(view.doc, 'input'); term.value = entry.term; term.setAttribute('aria-label', 'Word or phrase');
        const meaning = make(view.doc, 'textarea'); meaning.value = entry.meaning; meaning.rows = 2;
        meaning.placeholder = pending.has(entry.id) ? 'Translating…' : 'Enter English meaning';
        meaning.setAttribute('aria-label', 'English meaning for ' + entry.term);
        term.addEventListener('change', () => action(view, () => edit(entry.id, 'term', term.value)));
        meaning.addEventListener('input', () => action(view, () => edit(entry.id, 'meaning', meaning.value)));
        const footer = make(view.doc, 'div', undefined, 'hq-vocab-row');
        const source = entry.sources[0];
        const sourceButton = make(view.doc, 'button', source?.title + (source?.page ? ' · p. ' + source.page : ''), 'hq-vocab-source');
        sourceButton.title = 'Open source PDF';
        sourceButton.addEventListener('click', () => Zotero.Reader.open(source.itemID, Number.isInteger(source.pageIndex) ? { pageIndex: source.pageIndex } : undefined).catch(Zotero.logError));
        const retry = make(view.doc, 'button', pending.has(entry.id) ? 'Translating…' : 'Translate'); retry.disabled = pending.has(entry.id);
        retry.title = 'Translate Armenian to English using Translate for Zotero';
        retry.addEventListener('click', () => translate(entry.id).catch(error => report(view, error.message)));
        const remove = make(view.doc, 'button', 'Remove');
        remove.addEventListener('click', () => action(view, () => {
          write(items => { items.find(e => e.id === entry.id).deleted = true; });
          view.undoID = entry.id; view.undo.hidden = false; report(view, 'Removed from this list. Undo is available.');
        }));
        footer.append(retry, remove);
        card.append(term, meaning, sourceButton, footer);
        if (entry.translationError) card.append(make(view.doc, 'small', entry.translationError));
        view.list.append(card);
      }
    } catch (error) { report(view, error.message); }
  }
  function mount({ body, item }) {
    if (views.has(body)) { const view = views.get(body); view.itemID = item?.id; renderList(view); return; }
    const doc = body.ownerDocument;
    doc.defaultView.MozXULElement?.insertFTLIfNeeded(FTL);
    const root = make(doc, 'section', undefined, 'hq-vocab');
    const style = make(doc, 'link'); style.rel = 'stylesheet'; style.href = BASE + 'vocabulary.css';
    const count = make(doc, 'p', '', 'hq-vocab-count');
    const search = make(doc, 'input'); search.placeholder = 'Search vocabulary'; search.setAttribute('aria-label', 'Search vocabulary');
    const filter = make(doc, 'label', undefined, 'hq-vocab-filter');
    const current = make(doc, 'input'); current.type = 'checkbox'; filter.append(current, make(doc, 'span', 'Current PDF only'));
    const buttons = make(doc, 'div', undefined, 'hq-vocab-row');
    const copyButton = make(doc, 'button', 'Copy whole list');
    const quizlet = make(doc, 'button', 'Copy & Open Quizlet', 'hq-vocab-primary');
    buttons.append(copyButton, quizlet);
    const status = make(doc, 'p', '', 'hq-vocab-status'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const undo = make(doc, 'button', 'Undo remove'); undo.hidden = true;
    const list = make(doc, 'div', undefined, 'hq-vocab-list');
    const view = { body, doc, root, count, search, current, status, undo, list, itemID: item?.id };
    const exportAll = open => action(view, () => {
      const result = VocabularyCore.exportRows(read().entries.filter(e => !e.deleted).map(e => ({...e,selected:true})));
      if (result.missing) { report(view, `Fill English meanings for ${result.missing} word(s) before exporting.`); return; }
      if (!result.count) { report(view,'Your vocabulary list is empty.'); return; }
      copy(result.text);
      if (open) Zotero.launchURL('https://quizlet.com/create-set');
      report(view, `${result.count} cards copied. In Quizlet choose Import, paste, then select Tab and New line.`);
    });
    copyButton.addEventListener('click', () => exportAll(false));
    quizlet.addEventListener('click', () => exportAll(true));
    search.addEventListener('input', () => renderList(view)); current.addEventListener('change', () => renderList(view));
    list.addEventListener('focusout', () => doc.defaultView.setTimeout(() => { if (alive && view.deferred) renderList(view); }, 0));
    undo.addEventListener('click', () => action(view, () => { write(entries => { const entry=entries.find(e=>e.id===view.undoID); if(entry) entry.deleted=false; }); undo.hidden=true; report(view,'Word restored.'); }));
    root.append(style, count, search, filter, buttons, status, undo, list,
      make(doc,'p','Words are saved locally. Check machine translations before studying. Quizlet import requires pasting the copied list.','hq-vocab-hint'));
    body.replaceChildren(root); views.set(body, view); renderList(view);
  }
  function start() {
    alive = true;
    for (const win of Zotero.getMainWindows()) addWindow(win);
    paneID = Zotero.ItemPaneManager.registerSection({
      paneID: 'huziqian-vocabulary', pluginID: ID,
      header: { l10nID: 'hq-vocabulary-header', icon: BASE + 'vocabulary.svg' },
      sidenav: { l10nID: 'hq-vocabulary-nav', icon: BASE + 'vocabulary.svg' },
      onInit: ({doc}) => doc.defaultView.MozXULElement?.insertFTLIfNeeded(FTL),
      onItemChange: ({setEnabled}) => setEnabled(true),
      onRender: mount,
      onDestroy: ({body}) => views.delete(body)
    });
    if (!paneID) throw new Error('Zotero could not register the Vocabulary sidebar.');
    Zotero.Reader.registerEventListener('renderTextSelectionPopup', selectionPopup, ID);
  }
  function stop() {
    alive = false;
    Zotero.Reader.unregisterEventListener('renderTextSelectionPopup', selectionPopup);
    if (paneID) Zotero.ItemPaneManager.unregisterSection(paneID);
    for (const box of popups) box.remove(); popups.clear();
    for (const win of Zotero.getMainWindows()) removeWindow(win);
    views.clear(); pending.clear();
  }
  return {start, stop, addWindow, removeWindow, saveSelection, read, edit, translate, selectionPopup, mount};
})();
