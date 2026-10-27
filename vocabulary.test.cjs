const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function host() {
  const prefs = new Map(); let sequence = 0, translator;
  const context = vm.createContext({
    VocabularyCore: require('./core.js'), Components: {}, Services: {},
    Zotero: {
      Prefs: {get:key=>prefs.get(key),set:(key,value)=>prefs.set(key,value)},
      Utilities: {randomString:()=>String(++sequence)}, getMainWindows:()=>[],
      ItemPaneManager: {registerSection:()=> 'test-pane',unregisterSection(){}},
      Reader:{registerEventListener(){},unregisterEventListener(){}},
      PDFTranslate:{api:{translate: (...args)=>translator(...args)}}, logError(){}
    }
  });
  vm.runInContext(fs.readFileSync(__dirname+'/vocabulary.js','utf8'),context);
  context.Vocabulary.start();
  return {v:context.Vocabulary,prefs,set translator(value){translator=value;}};
}
const source = {itemID:5,title:'Book',page:'2'};
test('capture persists an unhighlighted selection and merges repeated words across sources',()=>{
  const h=host(); const first=h.v.saveSelection(' տուն ','house',source);
  h.v.saveSelection('տուն','',{...source,itemID:9});
  const entries=h.v.read().entries;
  assert.equal(entries.length,1); assert.equal(entries[0].term,'տուն');
  assert.equal(entries[0].meaning,'house'); assert.equal(entries[0].sources.length,2);
  assert.equal(first.needsMeaning,false);
});
test('translation explicitly targets English and persists its result',async()=>{
  const h=host(); h.translator=async(term,options)=>{
    assert.equal(term,'տուն'); assert.equal(options.langto,'en'); assert.equal(options.langfrom,'hy');
    return {result:'house',status:'success'};
  };
  const saved=h.v.saveSelection('տուն','',source); await h.v.translate(saved.id);
  assert.equal(h.v.read().entries[0].meaning,'house');
});
test('late machine translation cannot overwrite a manual meaning',async()=>{
  const h=host(); let resolve;
  h.translator=()=>new Promise(r=>resolve=r);
  const saved=h.v.saveSelection('տուն','',source); const work=h.v.translate(saved.id);
  h.v.edit(saved.id,'meaning','my carefully checked meaning');
  resolve({result:'house',status:'success'}); await work;
  assert.equal(h.v.read().entries[0].meaning,'my carefully checked meaning');
});
test('late translation cannot attach to a renamed word',async()=>{
  const h=host(); let resolve; h.translator=()=>new Promise(r=>resolve=r);
  const saved=h.v.saveSelection('տուն','',source); const work=h.v.translate(saved.id);
  h.v.edit(saved.id,'term','different word'); resolve({result:'house'}); await work;
  assert.equal(h.v.read().entries[0].meaning,'');
});
test('failed translation keeps the saved word and shows a recoverable error',async()=>{
  const h=host(); h.translator=async()=>{throw new Error('Offline');};
  const saved=h.v.saveSelection('տուն','',source); await h.v.translate(saved.id);
  assert.equal(h.v.read().entries[0].term,'տուն'); assert.match(h.v.read().entries[0].translationError,/unavailable/);
});
test('corrupt stored vocabulary is preserved rather than overwritten',()=>{
  const h=host(); h.prefs.set('extensions.vocabulary-to-quizlet.wordbook.v1','broken');
  assert.throws(()=>h.v.saveSelection('տուն','house',source));
  assert.equal(h.prefs.get('extensions.vocabulary-to-quizlet.wordbook.v1'),'broken');
});
test('shutdown prevents in-flight translations from changing saved data',async()=>{
  const h=host(); let resolve; h.translator=()=>new Promise(r=>resolve=r);
  const saved=h.v.saveSelection('տուն','',source); const work=h.v.translate(saved.id);
  h.v.stop(); resolve({result:'house'}); await work;
  assert.equal(h.v.read().entries[0].meaning,'');
});
