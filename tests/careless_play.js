// 300 careless-bot runs per chain rule through the real dealer and director: how often blasts chain. Run: node tests/careless_play.js
const load=require('./load');
function runs(mode,RUNS=300){
  const G=load();G.set('CHAIN_COUNT',mode);
  const st={runs:0,len:[],drops:0,blast:0,chain:{},quirk:0,paradox:0,score:[]};
  const api=G;const E=k=>api.get(k);
  for(let n=0;n<RUNS;n++){
    api.set('board',api.empty());api.set('placements',0);api.set('trays',0);api.set('cooldown',0);
    // deal through the real director
    const vmEval=s=>api.get(s);
    vmEval('(tray=dealTray(),planBoard(),0)');let score=0;
    for(;;){
      const tray=E('tray'),board=E('board'),legal=[];
      tray.forEach((p,s)=>{if(p)for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(E(`canPut(board,tray[${s}],${r},${c})`))legal.push([s,r,c])});
      if(!legal.length||E('placements')>=400)break;
      const [s,r,c]=legal[Math.floor(Math.random()*legal.length)];const res=E(`simulate(board,tray[${s}],${r},${c})`);
      st.drops++;if(res.caught>=E('BURST_MIN'))st.blast++;if(res.level>1)st.chain[res.level]=(st.chain[res.level]||0)+1;
      if(res.caught<E('BURST_MIN')){const t=api.copy(board),p=tray[s],pc=res.pc;for(const [a,b] of pc)t[a][b]=p.color;api.pull(t,pc,p.color,new Set(pc.map(([a,b])=>a*8+b)));if(api.flood(t,new Set(pc.map(([a,b])=>a*8+b)),p.color).size>=pc.length+3)st.quirk++}
      score+=res.gain;
      E(`(board=${JSON.stringify(res.g)},placements++,tray[${s}]=null,0)`);
      if(E('tray.every(x=>!x)'))E('(boardFx(),trays++,tray=dealTray(),planBoard(),0)');
    }
    st.len.push(E('placements'));st.score.push(score);
  }
  const med=a=>{const b=[...a].sort((x,y)=>x-y);return b[b.length>>1]},pct=(a,b)=>(100*a/b).toFixed(1)+'%';
  const ch=Object.values(st.chain).reduce((a,b)=>a+b,0);
  console.log(`${mode==='clump'?'4 together (new)':'pull 3 (original)'}: median run ${med(st.len)} placements, median score ${med(st.score)} · drops that blast ${pct(st.blast,st.drops)} · blasts that chain ${pct(ch,st.blast)} (${Object.entries(st.chain).map(([l,v])=>'×'+l+':'+v).join(' ')}) · non-blasting drops that join the piece to 3+ cubes of its colour: ${pct(st.quirk,st.drops-st.blast)}`);
}
runs('catch');runs('clump');
