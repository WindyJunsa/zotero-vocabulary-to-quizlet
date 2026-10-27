const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function host(locale) {
  const prefs=new Map();
  const ctx=vm.createContext({Zotero:{locale,Prefs:{get:k=>prefs.get(k),set:(k,v)=>prefs.set(k,v)}}});
  vm.runInContext(fs.readFileSync(__dirname+'/i18n.js','utf8'),ctx);
  return {i:ctx.VocabularyI18n,prefs};
}
test('Armenian locale auto-detection and English fallback',()=>{
  for(const locale of ['hy','hy-AM','hy_AM']) assert.equal(host(locale).i.language(),'hy');
  for(const locale of ['en-US','zh-CN',undefined]) assert.equal(host(locale).i.language(),'en');
});
test('language selection persists separately from vocabulary and preserves literal substitutions',()=>{
  const {i,prefs}=host('zh-CN');
  prefs.set('extensions.vocabulary-to-quizlet.wordbook.v1','saved words');
  i.setLanguage('hy'); assert.equal(i.t('＋ Add to Vocabulary'),'＋ Ավելացնել բառապաշարին');
  assert.equal(i.t('English meaning for {term}',{term:'<տուն>'}),'«<տուն>» բառի անգլերեն իմաստը');
  i.setLanguage('en'); assert.equal(i.t('＋ Add to Vocabulary'),'＋ Add to Vocabulary');
  assert.equal(prefs.get('extensions.vocabulary-to-quizlet.wordbook.v1'),'saved words');
  assert.throws(()=>i.setLanguage('invalid'));
});
test('every Armenian message is nonempty and preserves interpolation parameters',()=>{
  const {i}=host('hy');
  for(const [key,value] of Object.entries(i.hy)) {
    assert.ok(value.trim(),key);
    assert.deepEqual((key.match(/\{\w+\}/g)||[]).sort(),(value.match(/\{\w+\}/g)||[]).sort(),key);
  }
});
test('sidebar language switch and selection popup render Armenian while preserving the wordbook',()=>{
  const prefs=new Map();
  const doc={activeElement:null,defaultView:{MozXULElement:{insertFTLIfNeeded(){}},setTimeout}};
  class Node {
    constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.style={};this.ownerDocument=doc;this.isConnected=true;this.value='';}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    setAttribute(k,v){this[k]=v;}
    addEventListener(k,fn){this.handlers[k]=fn;}
    contains(){return false;}
    remove(){this.isConnected=false;}
  }
  doc.createElementNS=(_,tag)=>new Node(tag);
  const ctx=vm.createContext({VocabularyCore:require('./core.js'),Components:{},Zotero:{
    locale:'en-US',Prefs:{get:k=>prefs.get(k),set:(k,v)=>prefs.set(k,v)},
    Utilities:{randomString:()=> 'word-1'},getMainWindows:()=>[],logError(e){throw e;},
    ItemPaneManager:{registerSection:()=> 'pane'},Reader:{registerEventListener(){}}
  }});
  for(const file of ['i18n.js','vocabulary.js']) vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx);
  ctx.Vocabulary.start();ctx.Vocabulary.saveSelection('տուն','house',{itemID:1,title:'Book',page:'1'});
  const stored=prefs.get('extensions.vocabulary-to-quizlet.wordbook.v1');
  const body=new Node('body');ctx.Vocabulary.mount({body,item:{id:1}});
  const all=n=>[n,...n.children.flatMap(all)];
  const selector=all(body).find(n=>n.tag==='select');selector.value='hy';selector.handlers.change();
  assert.equal(body.children[0].lang,'hy');
  assert.ok(all(body).some(n=>n.textContent==='Պատճենել ամբողջ ցուցակը'));
  assert.ok(all(body).some(n=>n.value==='house'));
  let popup;ctx.Vocabulary.selectionPopup({reader:{},doc,params:{annotation:{text:'տուն'}},append:n=>popup=n});
  assert.ok(all(popup).some(n=>n.textContent==='＋ Ավելացնել բառապաշարին'));
  assert.equal(prefs.get('extensions.vocabulary-to-quizlet.wordbook.v1'),stored);
});
