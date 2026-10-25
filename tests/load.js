// loads the game's real rule code (tuning → core → director → chain trace) out of index.html into a sandbox
const fs=require('fs'),vm=require('vm');
module.exports=function(path=require('path').join(__dirname,'..','index.html')){
  const s=fs.readFileSync(path,'utf8');
  const a=s.indexOf('// ---- tuning ----'),b=s.indexOf('// ---- juice');
  const store={};
  const ctx={Math,JSON,Set,Map,Array,Object,Number,String,console,performance:{now:()=>0},
    document:{getElementById:()=>({getContext:()=>({})})},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v}};
  vm.createContext(ctx);
  vm.runInContext(s.slice(a,b)+';this.api={simulate,traceChain,empty,copy,flood,pull,N,RUST,set:(k,v)=>eval(k+"="+JSON.stringify(v)),get:k=>eval(k)};',ctx);
  return ctx.api;
};
