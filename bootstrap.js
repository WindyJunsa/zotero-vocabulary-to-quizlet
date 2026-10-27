function uiText(key,args) { return vocabularyContext?.VocabularyI18n?.t(key,args) || key; }
var chromeHandle;
var vocabularyContext;
var dialogs = new Set();
const MENU_ID = 'vocabulary-to-quizlet-menu';
const DRAFT_PREF = 'extensions.vocabulary-to-quizlet.drafts';
function install() {}
function uninstall() {}
async function startup({ rootURI }) {
  await Zotero.initializationPromise;
  chromeHandle = Components.classes['@mozilla.org/addons/addon-manager-startup;1']
    .getService(Components.interfaces.amIAddonManagerStartup)
    .registerChrome(Services.io.newURI(rootURI + 'manifest.json'), [['content', 'vocabulary-to-quizlet', rootURI]]);
  vocabularyContext = { Zotero, Services, Components };
  Services.scriptloader.loadSubScript(rootURI + 'i18n.js', vocabularyContext);
  for (const win of Zotero.getMainWindows()) addMenu(win);
  Services.scriptloader.loadSubScript(rootURI + 'core.js', vocabularyContext);
  Services.scriptloader.loadSubScript(rootURI + 'vocabulary.js', vocabularyContext);
  vocabularyContext.Vocabulary.start();
}
function addMenu(win) {
  if (win.document.getElementById(MENU_ID)) return;
  const popup = win.document.getElementById('menu_ToolsPopup');
  if (!popup) return;
  const item = win.document.createXULElement('menuitem');
  item.id = MENU_ID;
  item.setAttribute('label', uiText("Vocabulary to Quizlet…"));
  item.addEventListener('command', () => openVocabulary(win).catch(error => {
    Zotero.logError(error);
    Services.prompt.alert(win, 'Vocabulary to Quizlet', uiText("Could not read annotations: ") + error.message);
  }));
  popup.appendChild(item);
}
function onMainWindowLoad({ window }) { addMenu(window); vocabularyContext?.Vocabulary.addWindow(window); }
function onMainWindowUnload({ window }) { window.document.getElementById(MENU_ID)?.remove(); vocabularyContext?.Vocabulary.removeWindow(window); }
function shutdown() {
  vocabularyContext?.Vocabulary.stop();
  vocabularyContext = null;
  for (const win of Zotero.getMainWindows()) win.document.getElementById(MENU_ID)?.remove();
  for (const dialog of dialogs) { if (!dialog.closed) dialog.close(); }
  dialogs.clear();
  chromeHandle?.destruct();
  chromeHandle = null;
}
async function openVocabulary(win) {
  const attachments = new Map();
  const add = item => { if (item?.isPDFAttachment?.() && !item.deleted) attachments.set(item.id, item); };
  const reader = win.Zotero_Tabs && Zotero.Reader.getByTabID(win.Zotero_Tabs.selectedID);
  if (reader) add(await Zotero.Items.getAsync(reader.itemID));
  else {
    for (const item of win.ZoteroPane.getSelectedItems()) {
      if (item.isAttachment()) add(item);
      else if (item.isRegularItem()) {
        for (const attachment of await Zotero.Items.getAsync(item.getAttachments())) add(attachment);
      }
    }
  }
  if (!attachments.size) {
    Services.prompt.alert(win, 'Vocabulary to Quizlet', uiText("Open a PDF, or select books/PDFs in your Zotero library first."));
    return;
  }
  let drafts;
  try { drafts = JSON.parse(Zotero.Prefs.get(DRAFT_PREF, true) || '{}'); }
  catch { throw new Error(uiText("Saved vocabulary drafts could not be read. They have been left unchanged.")); }
  const rows = [];
  for (const attachment of attachments.values()) {
    for (const annotation of attachment.getAnnotations()) {
      if (annotation.deleted || !['highlight', 'underline'].includes(annotation.annotationType)) continue;
      const id = annotation.libraryID + ':' + annotation.key;
      const raw = annotation.annotationComment || '';
      const parsed = new win.DOMParser().parseFromString(raw, 'text/html');
      for (const br of parsed.querySelectorAll('br')) br.replaceWith(parsed.createTextNode(' '));
      const comment = parsed.body.textContent || '';
      rows.push({ id, term: annotation.annotationText || '', meaning: drafts[id]?.meaning ?? comment,
        selected: true, color: annotation.annotationColor || '', tags: annotation.getTags().map(t => t.tag),
        source: attachment.getField('title'), page: annotation.annotationPageLabel || '' });
    }
  }
  const payload = {
    rows,
    translate: uiText,
    language: vocabularyContext?.VocabularyI18n?.language() || "en",
    save: values => {
      // Merge with the latest saved values so separate review windows cannot erase one another.
      const current = JSON.parse(Zotero.Prefs.get(DRAFT_PREF, true) || '{}');
      for (const value of values) current[value.id] = { meaning: value.meaning };
      Zotero.Prefs.set(DRAFT_PREF, JSON.stringify(current), true);
    },
    copy: text => Components.classes['@mozilla.org/widget/clipboardhelper;1']
      .getService(Components.interfaces.nsIClipboardHelper).copyString(text),
    openQuizlet: () => Zotero.launchURL('https://quizlet.com/create-set')
  };
  const dialog = win.openDialog('chrome://vocabulary-to-quizlet/content/review.xhtml',
    '', 'chrome,centerscreen,resizable,width=1000,height=720', payload);
  dialogs.add(dialog);
  dialog.addEventListener('unload', () => dialogs.delete(dialog), { once: true });
}
