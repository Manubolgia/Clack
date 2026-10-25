// Randomised invariant tests for the magnet pull and the chain, under both chain rules. Run: node tests/chains.js (exit code 1 on any failure)
const load=require('./load');
function rngf(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[0,3]],[[0,1],[1,0],[1,1],[1,2]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]];
function suite(mode,CASES=20000){
  const G=load();G.set('CHAIN_COUNT',mode);const {simulate,traceChain,copy,flood,pull,N}=G;const MAX=G.get('MAX_CHAIN'),BM=G.get('BURST_MIN'),AM=G.get('AFTERSHOCK_MIN');
  const R=rngf(mode==='clump'?7:7),fail={replay:0,trace:0,emptyCraterCell:0,gain:0,level:0,determinism:0};
  let blasts=0,chains=0,lv={},waves=0,groups=0,paradox=0,orderLoss=0,orderGain=0,dropQuirk=0,drops=0;const ex={};
  for(let n=0;n<CASES;n++){
    const dens=.25+R()*.45,b=G.empty();for(let r=0;r<N;r++)for(let c=0;c<N;c++){const x=R();b[r][c]=x<dens?Math.floor(R()*5):x<dens+.06?-2:-1}
    const p={cells:SH[Math.floor(R()*SH.length)],color:Math.floor(R()*5)},legal=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){const x=simulate(b,p,r,c);if(x)legal.push([r,c])}
    if(!legal.length){n--;continue}const [ar,ac]=legal[Math.floor(R()*legal.length)],res=simulate(b,p,ar,ac);drops++;
    if(JSON.stringify(simulate(b,p,ar,ac))!==JSON.stringify(res))fail.determinism++;
    // replay the steps the way the animation does and check every invariant along the way
    const g=copy(b);for(const [r,c] of res.pc)g[r][c]=p.color;const b0=copy(g),tr=traceChain(b0,res.steps);
    let gain=0,cur=0;const wakes={};
    for(const st of res.steps){
      if(st.type==='pull')for(const m of st.moves){g[m.fr][m.fc]=-1;g[m.tr][m.tc]=st.color}
      else if(st.type==='wake')(wakes[cur]=wakes[cur]||[]).push([...st.set].sort((a,b)=>a-b).join());
      else if(st.type==='polish'){for(const k of st.set){if(g[k/N|0][k%N]!==-2)fail.replay++;g[k/N|0][k%N]=-1}gain+=st.set.size*5}
      else{cur=st.level;const empt=[...st.set].filter(k=>g[k/N|0][k%N]<0);if(empt.length){fail.emptyCraterCell++;if(!ex.empty)ex.empty={b0:copy(b0),steps:res.steps,level:st.level,empt,mode}}for(const k of st.set)g[k/N|0][k%N]=-1;gain+=st.set.size*10*st.level;blasts+=st.level===1;if(st.level>1){chains++}lv[st.level]=(lv[st.level]||0)+1}
    }
    if(JSON.stringify(g)!==JSON.stringify(res.g))fail.replay++;
    if(gain!==res.gain)fail.gain++;if(res.level>MAX)fail.level++;
    // the near-miss display (trace) must agree with the resolver: its ok groups are exactly the wake steps
    for(const L in tr){const ok=tr[L].filter(x=>x.ok).map(x=>[...x.grp].sort((a,b)=>a-b).join());if(JSON.stringify(ok)!==JSON.stringify(wakes[L]||[]))fail.trace++;
      waves++;
      // order dependence: compare each group's outcome inside the wave with its outcome on the board right after the blast
      const pre=(()=>{const h=copy(b0);for(const st of res.steps){if(st.type==='burst'&&st.level===+L){for(const k of st.set)h[k/N|0][k%N]=-1;break}if(st.type==='pull')for(const m of st.moves){h[m.fr][m.fc]=-1;h[m.tr][m.tc]=st.color}else if(st.type==='burst')for(const k of st.set)h[k/N|0][k%N]=-1;else if(st.type==='polish')for(const k of st.set)h[k/N|0][k%N]=-1}
        const ps=res.steps.find(s=>s.type==='polish'&&res.steps.indexOf(s)===res.steps.findIndex(x=>x.type==='burst'&&x.level===+L)+1);if(ps)for(const k of ps.set)h[k/N|0][k%N]=-1;return h})();
      for(const x of tr[L]){groups++;const t=copy(pre),r2=pull(t,[...x.grp].map(k=>[k/N|0,k%N]),x.color,x.grp),alone=mode==='clump'?flood(t,r2.clump,x.color).size>=AM:r2.caught>=BM;
        if(alone&&!x.ok)orderLoss++;if(!alone&&x.ok)orderGain++;
        if(mode==='catch'&&!x.ok&&flood(copy(pre),x.grp,x.color).size>=4){paradox++;if(!ex.paradox)ex.paradox={board:pre,grp:[...x.grp]}}}}
    // the same quirk on a drop: no blast although the piece ends up in a clump of 4+
    if(res.caught<BM){const t=copy(b);for(const [r,c] of res.pc)t[r][c]=p.color;pull(t,res.pc,p.color,new Set(res.pc.map(([r,c])=>r*N+c)));if(flood(t,new Set(res.pc.map(([r,c])=>r*N+c)),p.color).size>=4)dropQuirk++}
  }
  const pct=(a,b)=>(100*a/b).toFixed(1)+'%';
  console.log(`\n=== chain rule: ${mode==='clump'?'4 together (new default)':'pull 3 (original)'} — ${drops} random drops ===`);
  console.log('invariants (all must be 0):',JSON.stringify(fail));
  console.log(`blasting drops: ${pct(blasts,drops)} · chain levels reached: ${Object.entries(lv).filter(([l])=>l>1).map(([l,v])=>'×'+l+' '+v).join(', ')} · drops that chain: ${pct(Object.entries(lv).filter(([l])=>l==2).reduce((s,[,v])=>s+v,0),drops)}`);
  console.log(`touching groups tested: ${groups}; outcome changed by another group in the same wave: lost ${orderLoss} (${pct(orderLoss,groups)}), gained ${orderGain} (${pct(orderGain,groups)})`);
  if(mode==='catch')console.log(`"contact paradox" (group already part of a clump of 4+ but doesn't chain): ${paradox} (${pct(paradox,groups)} of groups)`);
  console.log(`drops with no blast although the piece sits in a clump of 4+ after its pull: ${dropQuirk} (${pct(dropQuirk,drops)})`);
  if(ex.empty)console.log('example crater with an empty cell at level',ex.empty.level,ex.empty.empt);
  return fail;
}
const a=suite('catch'),b=suite('clump');
process.exit(Object.values(a).concat(Object.values(b)).some(v=>v)?1:0);
