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
// C6: the director's best catch counts what the drop counts, so its duds can't blast through the clump route
{const G=load();const b=G.empty();b[3][3]=0;b[3][4]=0;b[4][3]=0;b[4][4]=0; // a red 2×2: one red cube pulls at most 2, but joins 4
  G.get('applyRules')('C5');const a=G.get('bestCatch')(b,one);G.get('applyRules')('C5C6');const c=G.get('bestCatch')(b,one);
  check('C6: best catch is 2 under C5 and 4 under C5C6 (the clump route)',a===2&&c===4,`C5 ${a} · C5C6 ${c}`);
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
// rust variants (plan/02 §2.6): R2 RUST_CALM, R4 RUST_OPEN, R5 RUST_SPREAD
{const G=load();const plan=(placements,cooldown,cfg={})=>{G.set('board',G.empty());G.set('placements',placements);G.set('cooldown',cooldown);
    G.set('RUST_CALM',0);G.set('RUST_OPEN',0);for(const [k,v] of Object.entries(cfg))G.set(k,v);return G.get('rustAmount()')};
  check('R2: RUST_CALM 1 plans 1 rust on a calm tray from CALM_START on, none in the opening',plan(20,2)===0&&plan(20,2,{RUST_CALM:1})===1&&plan(6,0,{RUST_CALM:1})===0&&plan(20,0,{RUST_CALM:1})===2);
  check('R4: RUST_OPEN 6 plans RUST_CHARGE in the opening from placement 6',plan(6,0)===0&&plan(3,0,{RUST_OPEN:6})===0&&plan(6,0,{RUST_OPEN:6})===2&&plan(9,0,{RUST_OPEN:6})===2&&plan(20,2,{RUST_OPEN:6})===0);
  const b=G.empty();b[4][7]=-2;G.set('board',b);G.set('RUST_SPREAD',false);const ring=G.get('rustPlan(3)');G.set('RUST_SPREAD',true);const sp=G.get('rustPlan(3)');
  const touch=(x,pl)=>[[0,1],[0,-1],[1,0],[-1,0]].some(([dr,dc])=>{const r=x[0]+dr,c=x[1]+dc;return r>=0&&c>=0&&r<8&&c<8&&(b[r][c]===-2||pl.some(y=>y[0]===r&&y[1]===c))});
  check('R5: RUST_SPREAD plans next to rust (as a growing patch) instead of the ring start',JSON.stringify(ring)!==JSON.stringify(sp)&&sp.every((x,i)=>touch(x,sp.slice(0,i))),`ring ${JSON.stringify(ring)} · spread ${JSON.stringify(sp)}`);
  G.set('board',G.empty());check('R5: with no rust on the board the spread falls back to the ring order',JSON.stringify(G.get('rustPlan(3)'))===JSON.stringify(ring));G.set('RUST_SPREAD',false);
}
// rusted cubes (CLAUDE.md §11.3, owner's definition 2026-10-26): RUSTED − colour, inert, blocks lines, a blast polishes it back
{const G=load(),RD=G.get('RUSTED'),set=cfg=>{for(const [k,v] of Object.entries({RUST_CUBES:true,RUSTED_LINES:'block',RUSTED_POLISH:'restore',RUSTED_USED:true,...cfg}))G.set(k,v)};
  set({RUST_CUBES:false});const b=G.empty();b[0][3]=2;G.set('board',b);G.set('plannedRust',[[0,3],[0,4]]);G.get('boardFx()');
  const off=G.get('board')[0][3],offE=G.get('board')[0][4];set({});const b2=G.empty();b2[0][3]=2;G.set('board',b2);G.set('plannedRust',[[0,3],[0,4]]);G.get('boardFx()');
  check('rusted cubes: planned rust lands on a cube only with RUST_CUBES',off===2&&offE===-2&&G.get('board')[0][3]===RD-2&&G.get('board')[0][4]===-2);
  {const after=G.get('board');after[3][0]=1;G.set('board',after);const withCubes=G.get('rustPlan(2)');G.set('RUST_CUBES',false);const without=G.get('rustPlan(2)');G.set('RUST_CUBES',true);
   G.set('RUST_MAX',2);const capped=G.get('rustPlan(2)').length;G.set('RUST_MAX',36);
   check('rusted cubes: the rust plan takes cubes too, and rust plus rusted cubes count toward RUST_MAX',JSON.stringify(withCubes)==='[[3,0],[2,0]]'&&JSON.stringify(without)==='[[2,0],[1,0]]'&&capped===0,`${JSON.stringify(withCubes)} · ${JSON.stringify(without)} · capped ${capped}`)}
  // red magnet at (4,2); red cubes under it in column 2 at rows 6 and 7; a rusted red cube at (5,2) between them
  const col=()=>{const g=G.empty();g[5][2]=RD-0;g[6][2]=0;g[7][2]=0;return g};
  set({});const a=G.simulate(col(),one,4,2);set({RUSTED_LINES:'pass'});const p=G.simulate(col(),one,4,2);
  check('rusted cubes: they block magnet lines; with RUSTED_LINES pass the line sees past (but the cubes stop at the coat)',a.caught===0&&p.caught===2&&p.g[5][2]===RD&&p.g[6][2]===0,`block ${a.caught} · pass ${p.caught}`);
  {set({});const g=col(),u=G.get('usedN')(g);G.set('RUSTED_USED',false);const v=G.get('usedN')(g);
   check('rusted cubes: used for the director unless RUSTED_USED is off',u===3&&v===2,`used ${u} · with RUSTED_USED off ${v}`)}
  // a red stack blasts under a dropped red cube at (4,2); a rusted red cube touches the crater at (6,3), with red cubes (6,4) and (6,5)
  // and (7,4) next to it: once cleaned it makes 4 together with them, so under C5 it chains if it may join the next wave
  const nb=()=>{const g=redStack(G,3);g[6][3]=RD-0;g[6][4]=0;g[6][5]=0;g[7][4]=0;return g};
  G.get('applyRules')('C5');
  set({});const r=G.simulate(nb(),one,4,2);set({RUSTED_POLISH:'chain'});const c=G.simulate(nb(),one,4,2);set({RUSTED_POLISH:'empty'});const e=G.simulate(nb(),one,4,2);
  check('rusted cubes: restore = a normal cube after the chain, +5, and it sits the chain out',r.level===1&&r.g[6][3]===0&&r.gain===40+5&&r.steps[r.steps.length-1].type==='clean',`level ${r.level} gain ${r.gain} cell ${r.g[6][3]}`);
  check('rusted cubes: chain = cleaned at once, so it joins the next touch wave (4 together → ×2)',c.level===2&&c.gain===40+5+4*20,`chain level ${c.level} gain ${c.gain}`);
  check('rusted cubes: empty = the cube goes with the rust',e.level===1&&e.g[6][3]===-1&&e.gain===45&&e.steps.some(st=>st.type==='polish'&&st.set.has(51)));
  // randomised invariants with rusted cubes on the board, for every polish and line mode (as in tests/chains.js)
  const R=rngf(23),SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,1],[1,0],[1,1],[1,2]],[[0,0],[1,0],[2,0],[2,1]]];
  for(const rules of ['S','C5'])for(const pol of ['restore','chain','empty'])for(const lines of ['block','pass']){G.get('applyRules')(rules);set({RUSTED_POLISH:pol,RUSTED_LINES:lines});
    const fail={replay:0,trace:0,crater:0,gain:0,determinism:0};let cleans=0,chains=0;
    for(let n=0;n<4000;n++){const dens=.3+R()*.4,b=G.empty();for(let r=0;r<8;r++)for(let c=0;c<8;c++){const x=R();b[r][c]=x<dens?Math.floor(R()*5):x<dens+.05?-2:x<dens+.12?RD-Math.floor(R()*5):-1}
      const p={cells:SH[Math.floor(R()*SH.length)],color:Math.floor(R()*5)},r=Math.floor(R()*8),c=Math.floor(R()*8),res=G.simulate(b,p,r,c);if(!res){n--;continue}
      if(JSON.stringify(G.simulate(b,p,r,c))!==JSON.stringify(res))fail.determinism++;
      const g=G.copy(b);for(const [a,d] of res.pc)g[a][d]=p.color;const tr=G.traceChain(G.copy(g),res.steps);let gain=0,cur=0;const wakes={};
      for(const st of res.steps){
        if(st.type==='pull')for(const m of st.moves){g[m.fr][m.fc]=-1;g[m.tr][m.tc]=st.color}
        else if(st.type==='wake')(wakes[cur]=wakes[cur]||[]).push([...st.set].sort((x,y)=>x-y).join());
        else if(st.type==='polish'){for(const k of st.set){const v=g[k/8|0][k%8];if(v!==-2&&!(pol==='empty'&&v<=RD))fail.replay++;g[k/8|0][k%8]=-1}gain+=st.set.size*5}
        else if(st.type==='clean'){for(const k of st.set){const v=g[k/8|0][k%8];if(v>RD)fail.replay++;g[k/8|0][k%8]=RD-v}gain+=st.set.size*5;cleans+=st.set.size}
        else{cur=st.level;if([...st.set].some(k=>g[k/8|0][k%8]<0))fail.crater++;for(const k of st.set)g[k/8|0][k%8]=-1;gain+=st.set.size*10*st.level;if(st.level>1)chains++}}
      if(JSON.stringify(g)!==JSON.stringify(res.g))fail.replay++;if(gain!==res.gain)fail.gain++;
      for(const L in tr){const ok=tr[L].filter(x=>x.ok).map(x=>[...x.grp].sort((a,b)=>a-b).join());if(JSON.stringify(ok)!==JSON.stringify(wakes[L]||[]))fail.trace++}}
    check(`rusted cubes, ${rules}, polish ${pol}, lines ${lines}: replay, gain, craters, trace and determinism hold`,Object.values(fail).every(v=>v===0),`${JSON.stringify(fail)} · ${cleans} cubes cleaned, ${chains} chain blasts`)}
  set({RUST_CUBES:false});
}
console.log(fails?`${fails} failed`:'all passed');
process.exit(fails?1:0);
