// Unit tests for the rule-set switches (plan/02 §2.3 in the Clank repo). Run: node tests/variants.js (exit code 1 on any failure)
const load=require('./load');
let fails=0;const check=(name,ok,info='')=>{console.log(`${ok?'ok  ':'FAIL'} ${name}${info?' · '+info:''}`);if(!ok)fails++};
function rngf(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const one={cells:[[0,0]],color:0};
// a red (0) single cube dropped at (4,2) catches the red cubes stacked under it in column 2, so it blasts and the blast touches (3,2)
function redStack(G,n=3){const b=G.empty();for(let r=5;r<5+n;r++)b[r][2]=0;return b}

{const G=load();
  for(const name of Object.keys(G.get('RULESETS')))check(`rule set ${name} round-trips`,G.get('applyRules')(name)&&G.get('rulesName')()===name);
  check('unknown rule set is refused',G.get('applyRules')('nope')===false);
  G.get('applyRules')('C7');check('C7: pull 4, 4 together',G.get('BURST_MIN')===4&&G.get('CHAIN_COUNT')==='clump');
  G.get('applyRules')('S');check('S after C7 resets every switch',G.get('BURST_MIN')===3&&G.get('CHAIN_COUNT')==='catch'&&G.get('CRATER_BLOCK')===true);
  G.get('applyRules')('C5');check('the default is C5',JSON.stringify(G.get('ruleValues')())===JSON.stringify(load().get('ruleValues')()));
}
// C7: BURST_MIN 4 for drops
{const G=load();const b=redStack(G,3);
  G.get('applyRules')('C5');const a=G.simulate(b,one,4,2);
  G.get('applyRules')('C7');const c=G.simulate(b,one,4,2);b[4][7]=0;const d=G.simulate(b,one,4,2);
  check('C7: catching 3 blasts under C5 but not C7, catching 4 blasts under C7',a.level===1&&c.level===0&&c.caught===3&&d.caught===4&&d.level===1);
}
// C1: a group touching the blast that sees 2 of its colour chains when CHAIN_CATCH is 2
{const G=load();const b=redStack(G);b[3][2]=1;b[3][5]=1;b[0][2]=1;
  const lv=name=>{G.get('applyRules')(name);return G.simulate(b,one,4,2).level};
  check('C1: a touching cube that pulls 2 chains under C1 only',lv('S')===1&&lv('C1')===2&&lv('C5')===1,`S ${lv('S')} · C1 ${lv('C1')} · C5 ${lv('C5')}`);
}
// C2: a clump of 3 touching the blast blasts with no pull
{const G=load();const b=redStack(G);b[3][2]=1;b[3][3]=1;b[2][3]=1;
  G.get('applyRules')('S');const s=G.simulate(b,one,4,2);G.get('applyRules')('C2');const c=G.simulate(b,one,4,2);
  const burst2=c.steps.find(st=>st.type==='burst'&&st.level===2);
  check('C2: an L of 3 blue touching the blast chains under C2, not under S',s.level===1&&c.level===2&&burst2&&[...burst2.set].sort((x,y)=>x-y).join()===[19,26,27].join()&&!c.steps.slice(1).some(st=>st.type==='pull'));
}
// C6: a drop that pulls 1 but joins a clump of piece size + 3 blasts under DROP_COUNT 'clump'
{const G=load();const b=G.empty();b[4][5]=0;b[3][5]=0;b[2][5]=0;
  G.get('applyRules')('C5');const a=G.simulate(b,one,4,4);G.get('applyRules')('C5C6');const c=G.simulate(b,one,4,4);
  check('C6: pull 1 + clump of 4 blasts under C5C6 only',a.level===0&&a.n===1&&c.caught===1&&c.n===3&&c.level===1&&c.gain===40,`C5 n ${a.n} level ${a.level} · C5C6 n ${c.n} level ${c.level} gain ${c.gain}`);
  b[3][5]=-1;const d=G.simulate(b,one,4,4);check('C6: a clump of 3 still cools',d.level===0&&d.n===1);
}
// CRATER_BLOCK: with it off, a later group can pull a cube out of the crater an earlier group formed (the crater then holds an empty cell)
{const SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,1],[1,0],[1,1],[1,2]],[[0,0],[1,0],[2,0],[2,1]]];
  const on=load(),off=load();off.set('CRATER_BLOCK',false);const R=rngf(11);let stolen=0,withBlock=0,tried=0;
  const emptyCell=(G,b,p,res)=>{const g=G.copy(b);for(const [r,c] of res.pc)g[r][c]=p.color;for(const st of res.steps){if(st.type==='pull')for(const m of st.moves){g[m.fr][m.fc]=-1;g[m.tr][m.tc]=st.color}
    else if(st.type==='burst'){if([...st.set].some(k=>g[k/8|0][k%8]<0))return true;for(const k of st.set)g[k/8|0][k%8]=-1}else if(st.type==='polish')for(const k of st.set)g[k/8|0][k%8]=-1}return false};
  while(tried<120000&&stolen<3){const dens=.35+R()*.35,b=on.empty();for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=R();b[r][c]=x<dens?Math.floor(R()*5):-1}
    const p={cells:SH[Math.floor(R()*SH.length)],color:Math.floor(R()*5)},r=Math.floor(R()*8),c=Math.floor(R()*8),x=off.simulate(b,p,r,c);if(!x||x.level<2)continue;tried++;
    if(emptyCell(off,b,p,x)){stolen++;if(emptyCell(on,b,p,on.simulate(b,p,r,c)))withBlock++}}
  check('CRATER_BLOCK: off lets a later group steal from the crater, on never does',stolen>0&&withBlock===0,`${stolen} steals found in ${tried} chaining drops`);
}
// RUST_CHARGE: rust cells a charge tray plans
{const G=load();G.set('board',G.empty());G.set('placements',20);G.set('cooldown',0);
  check('charge plans 2 rust by default',G.get('directorRule()')==='charge'&&G.get('rustAmount()')===2);
  G.set('RUST_CHARGE',4);G.get('planBoard()');check('RUST_CHARGE 4 plans 4 rust',G.get('plannedRust').length===4);
}
// DRIFT_SLOPE / DRIFT_CAP: at k = 1 a cap of 0 recolours nothing; slope 10 and cap 1 give every piece its dud colour
{const G=load();const R0=Math.random;
  const deal=(cfg,seed)=>{Math.random=rngf(seed);G.set('board',G.empty());G.set('placements',100);G.set('cooldown',0);for(const [k,v] of Object.entries(cfg))G.set(k,v);const t=G.get('dealTray()');Math.random=R0;return t};
  const base={KILL_STYLE:'drift',DIRECTOR:'auto',DRIFT_SLOPE:.75,DRIFT_CAP:.85};let same=0,dud=0;
  for(let s=1;s<=20;s++){const a=deal({...base,DRIFT_CAP:0},s),b=deal({...base,KILL_STYLE:'none'},s);if(JSON.stringify(a)===JSON.stringify(b))same++;
    const c=deal({...base,DRIFT_SLOPE:10,DRIFT_CAP:1},s);if(c.every(p=>p.color===0))dud++}
  check('DRIFT_CAP 0 deals exactly the no-drift trays',same===20,`${same}/20`);
  check('DRIFT_SLOPE 10, DRIFT_CAP 1: every piece takes its dud colour',dud===20,`${dud}/20`);
}
console.log(fails?`${fails} failed`:'all passed');
process.exit(fails?1:0);
