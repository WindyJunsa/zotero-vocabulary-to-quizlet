/* Copyright 2026 Huziqian. English / Armenian interface strings. */
var VocabularyI18n = (() => {
  const pref = 'extensions.vocabulary-to-quizlet.interface-language';
  const hy = {
  "Vocabulary": "Բառապաշար",
  "Interface language": "Միջերեսի լեզու",
  "Automatic": "Ավտոմատ",
  "Vocabulary data cannot be read. Existing data has not been changed.": "Հնարավոր չէ կարդալ բառապաշարի տվյալները։ Առկա տվյալները չեն փոխվել։",
  "Enable Translate for Zotero, or type an English meaning.": "Միացրեք Translate for Zotero հավելումը կամ գրեք անգլերեն իմաստը։",
  "Translation failed. Please enter the English meaning manually.": "Թարգմանությունը չհաջողվեց։ Մուտքագրեք անգլերեն իմաստը ձեռքով։",
  "Translation unavailable — enter a meaning or retry.": "Թարգմանությունն անհասանելի է․ մուտքագրեք իմաստը կամ կրկին փորձեք։",
  "Select a word or phrase first.": "Նախ ընտրեք բառ կամ արտահայտություն։",
  "English meaning (optional)": "Անգլերեն իմաստ (ըստ ցանկության)",
  "Vocabulary English meaning": "Բառի անգլերեն իմաստը",
  "＋ Add to Vocabulary": "＋ Ավելացնել բառապաշարին",
  "Translate to English on add": "Ավելացնելիս թարգմանել անգլերեն",
  "Uses your configured Translate for Zotero service. Only the selected text is sent for translation.": "Օգտագործում է Translate for Zotero-ի ձեր կարգավորած ծառայությունը։ Թարգմանության է ուղարկվում միայն ընտրված տեքստը։",
  "✓ In Vocabulary": "✓ Բառապաշարում է",
  "Saved. Add a meaning in the Vocabulary sidebar.": "Պահպանված է։ Կողային բառապաշարում ավելացրեք իմաստը։",
  "Saved to Vocabulary sidebar.": "Պահպանված է կողային բառապաշարում։",
  "Saved — translating to English…": "Պահպանված է․ թարգմանվում է անգլերեն…",
  "Saved. Review the English meaning in Vocabulary.": "Պահպանված է։ Բառապաշարում ստուգեք անգլերեն իմաստը։",
  "Saved. Enable Translate for Zotero or enter a meaning in the sidebar.": "Պահպանված է։ Միացրեք Translate for Zotero-ն կամ կողային վահանակում գրեք իմաստը։",
  "Words: {count} · Missing meanings: {missing}": "Բառեր՝ {count} · Առանց իմաստի՝ {missing}",
  "No matching words.": "Համապատասխան բառեր չկան։",
  "Select text in a PDF, then click Add to Vocabulary.": "PDF-ում ընտրեք տեքստը, ապա սեղմեք «Ավելացնել բառապաշարին»։",
  "Word or phrase": "Բառ կամ արտահայտություն",
  "Translating…": "Թարգմանվում է…",
  "Enter English meaning": "Մուտքագրեք անգլերեն իմաստը",
  "English meaning for {term}": "«{term}» բառի անգլերեն իմաստը",
  " · p. ": " · էջ ",
  "Open source PDF": "Բացել սկզբնաղբյուր PDF-ը",
  "Translate": "Թարգմանել",
  "Translate Armenian to English using Translate for Zotero": "Թարգմանել հայերենից անգլերեն՝ Translate for Zotero-ով",
  "Remove": "Հեռացնել",
  "Removed from this list. Undo is available.": "Հեռացված է ցուցակից։ Հնարավոր է վերականգնել։",
  "Search vocabulary": "Որոնել բառապաշարում",
  "Current PDF only": "Միայն ընթացիկ PDF-ը",
  "Copy whole list": "Պատճենել ամբողջ ցուցակը",
  "Copy & Open Quizlet": "Պատճենել և բացել Quizlet-ը",
  "Undo remove": "Վերականգնել հեռացվածը",
  "Fill English meanings for {count} word(s) before exporting.": "Արտահանելուց առաջ լրացրեք {count} բառի անգլերեն իմաստը։",
  "Your vocabulary list is empty.": "Ձեր բառացանկը դատարկ է։",
  "{count} cards copied. In Quizlet choose Import, paste, then select Tab and New line.": "Պատճենված քարտեր՝ {count}։ Quizlet-ում ընտրեք Import, տեղադրեք և ընտրեք Tab ու New line։",
  "Word restored.": "Բառը վերականգնված է։",
  "Words are saved locally. Check machine translations before studying. Quizlet import requires pasting the copied list.": "Բառերը պահպանվում են այս համակարգչում։ Սովորելուց առաջ ստուգեք մեքենայական թարգմանությունները։ Quizlet ներմուծելու համար տեղադրեք պատճենված ցուցակը։",
  "Zotero could not register the Vocabulary sidebar.": "Zotero-ն չկարողացավ գրանցել բառապաշարի կողային վահանակը։",
  "Vocabulary to Quizlet…": "Բառապաշար՝ Quizlet-ի համար…",
  "Could not read annotations: ": "Հնարավոր չէ կարդալ նշումները․ ",
  "Open a PDF, or select books/PDFs in your Zotero library first.": "Նախ բացեք PDF կամ ընտրեք գրքեր/PDF-ներ Zotero-ի գրադարանում։",
  "Saved vocabulary drafts could not be read. They have been left unchanged.": "Պահպանված բառապաշարի սևագրերը հնարավոր չէ կարդալ։ Դրանք չեն փոխվել։",
  "Include {term}": "Ներառել «{term}»",
  "Marked passages: {marked} · Ready cards: {count} · Incomplete: {missing} · Exact duplicates omitted: {duplicates}": "Նշված հատվածներ՝ {marked} · Պատրաստ քարտեր՝ {count} · Թերի՝ {missing} · Բաց թողնված կրկնօրինակներ՝ {duplicates}",
  "Yellow": "Դեղին",
  "Red": "Կարմիր",
  "Green": "Կանաչ",
  "Blue": "Կապույտ",
  "Purple": "Մանուշակագույն",
  "Magenta": "Մաջենտա",
  "Orange": "Նարնջագույն",
  "Gray": "Մոխրագույն",
  "Could not complete action: ": "Գործողությունը չհաջողվեց․ ",
  "Meanings saved locally. PDF annotations are unchanged. Word edits apply to this export only.": "Իմաստները պահպանված են այս համակարգչում։ PDF-ի նշումները չեն փոխվել։ Բառերի փոփոխությունները վերաբերում են միայն այս արտահանմանը։",
  "{count} cards copied; meanings saved. Paste into Quizlet’s Import box.": "Պատճենված քարտեր՝ {count}․ իմաստները պահպանված են։ Տեղադրեք Quizlet-ի Import դաշտում։",
  "Quizlet opened. Choose Import and paste the copied cards.": "Quizlet-ը բացված է։ Ընտրեք Import և տեղադրեք պատճենված քարտերը։",
  "Review your marked words and English meanings, then copy them into Quizlet.": "Ստուգեք նշված բառերն ու անգլերեն իմաստները, ապա պատճենեք դրանք Quizlet։",
  "Meanings come from annotation comments or your saved edits. Check that they are English. This tool does not translate automatically or change PDF annotations.": "Իմաստները վերցվում են նշումների մեկնաբանություններից կամ պահպանված խմբագրումներից։ Ստուգեք, որ դրանք անգլերեն են։ Այս պատուհանը չի թարգմանում ավտոմատ և չի փոխում PDF-ի նշումները։",
  "Mark color": "Նշման գույնը",
  "All colors": "Բոլոր գույները",
  "Only tagged “vocab”": "Միայն «vocab» պիտակով",
  "Select visible": "Ընտրել ցուցադրվածները",
  "Deselect visible": "Չեղարկել ցուցադրվածների ընտրությունը",
  "Export": "Արտահանել",
  "English meaning": "Անգլերեն իմաստ",
  "Source": "Աղբյուր",
  "Save meanings": "Պահպանել իմաստները",
  "Copy for Quizlet": "Պատճենել Quizlet-ի համար",
  "Open Quizlet": "Բացել Quizlet-ը",
  "Export preview (one card per line)": "Արտահանման նախադիտում (մեկ քարտ՝ յուրաքանչյուր տողում)",
  "In Quizlet: Create → Flashcard set → Import. Paste, choose Tab between term and definition and New line between cards, then review and save. Nothing is sent until you paste it there.": "Quizlet-ում՝ Create → Flashcard set → Import։ Տեղադրեք, ընտրեք Tab՝ բառի և իմաստի միջև, և New line՝ քարտերի միջև, ապա ստուգեք ու պահպանեք։ Ոչինչ չի ուղարկվում, մինչև այն չտեղադրեք այնտեղ։"
};
  function language() {
    const chosen = typeof Zotero !== 'undefined' ? Zotero.Prefs.get(pref, true) : undefined;
    const locale = chosen && chosen !== 'auto' ? chosen : (typeof Zotero !== 'undefined' ? Zotero.locale : 'en');
    return /^hy(?:[-_]|$)/i.test(locale || '') ? 'hy' : 'en';
  }
  function t(key, args = {}) {
    return (language() === 'hy' ? hy[key] || key : key).replace(/\{(\w+)\}/g, (match, name) => args[name] ?? match);
  }
  function setLanguage(value) {
    if (!['auto', 'en', 'hy'].includes(value)) throw new Error('Unsupported interface language');
    Zotero.Prefs.set(pref, value, true);
  }
  return {t, language, setLanguage, pref, hy};
})();
