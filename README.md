# Vocabulary to Quizlet

**Author: Huziqian** · Zotero 10 · Armenian → English vocabulary study

Select a word in Zotero's PDF reader and click **＋ Add to Vocabulary** in
the selection popup. The word is saved to a persistent **Vocabulary** section
in Zotero's right sidebar, with a book icon. No highlight is required.

## Reading workflow

1. Select an Armenian word or phrase in a PDF.
2. Optionally type an English meaning; click **Add to Vocabulary**.
3. With **Translate to English on add** enabled, missing meanings are filled
   through the installed [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate)
   plugin, using its configured provider. Only the selected text is translated.
4. Open the Vocabulary book icon on the right. Edit meanings, search, filter
   by current PDF, open source pages, or remove a word with an Undo option.
5. Click **Copy whole list** or **Copy & Open Quizlet**. On Quizlet, choose
   **Create → Flashcard set → Import**, paste, and set **Tab** between terms
   and definitions and **New line** between cards. Review and save.

Review machine translations, especially Armenian inflected forms. Without
Translate for Zotero, capture and manual meanings still work. A manual meaning
is never overwritten by an in-flight translation.

## Installation

Download the `.xpi` from Releases when available, or build it locally.
In Zotero: **Tools → Plugins → gear → Install Plugin From File**.
The extension ID is unchanged from 0.1.x, so this updates the existing add-on.

## Data and limits

- The wordbook persists locally across tabs and restarts, in Zotero preferences.
  It is not synced to other computers through Zotero Sync.
- Identical terms merge source references; one editable meaning per term.
  Different senses can be written together in that meaning field.
- PDF annotations, books, and existing notes are not modified.
- This add-on stores no translation API keys or Quizlet credentials.
- The whole active list is exported regardless of the search/current-PDF
  filter. Missing meanings block export instead of silently dropping words.
- Direct Quizlet API publishing is not implemented. **Copy & Open** copies
  locally and opens Quizlet; it does not upload or publish automatically.
- The legacy Tools → Vocabulary to Quizlet dialog remains available to export
  old highlights/comments separately. Its drafts are preserved.
- The HTTPS update feed currently contains no releases. Updates are manual.

## Development

No npm dependencies.

```sh
node --test test.cjs vocabulary.test.cjs
python build.py
```

The XPI and source ZIP appear in `dist/`. An explicit build allowlist excludes
personal vocabulary, credentials, Zotero data, and Git metadata.

Tests cover export formatting, duplicates, missing meanings, persistence,
corrupt-data protection, and translation races/failures. Live UI verification
is recorded in release notes; mocked tests alone do not prove UI compatibility.

## References

- [Zotero plugin APIs](https://www.zotero.org/support/dev/zotero_7_for_developers)
- [Quizlet text import](https://help.quizlet.com/hc/en-au/articles/360029977151-Creating-sets-by-importing-content)

Independent project, not affiliated with Zotero or Quizlet.
