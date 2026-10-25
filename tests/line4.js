// Line of 4 blue cubes with a blast touching 1-4 of them. Run: node tests/line4.js [index.html] [clump|catch]
const G=require('./load')(process.argv[2]||undefined);G.set('CHAIN_COUNT',process.argv[3]||'clump');const {simulate,empty,traceChain,copy}=G;
// a line of 4 blue (1) on row 3, cols 2-5. A red piece lands on row 4 right under it and catches 3 red cubes
// stacked under its first cell (rows 5-7), so it blasts and the blast touches the line from below.
function run(name,w,col){
  const b=empty();for(let c=2;c<=5;c++)b[3][c]=1;
  for(let r=5;r<=7;r++)b[r][col]=0;
  const p={cells:Array.from({length:w},(_,i)=>[0,i]),color:0},res=simulate(b,p,4,col);
  const b0=copy(b);for(const [r,c] of res.pc)b0[r][c]=0;
  const tr=traceChain(b0,res.steps)[1]||[];
  const g=tr.find(x=>x.color===1);
  console.log(`${name} → touching blue cubes: [${g?[...g.grp].map(k=>'c'+k%8):'-'}], they catch ${g?g.caught:0} → ${res.level>1?'CHAIN ×'+res.level:'no chain'}`);
}
console.log('Line of 4 blue cubes on row 3 (cols 2-5). A red blast on row 4 touches it from below.\n');
run('A  blast under col 2 only (end of line)   ',1,2);
run('B  blast under col 3 only (inside)        ',1,3);
run('C  blast under cols 2-3                   ',2,2);
run('D  blast under cols 3-4 (two middle cubes)',2,3);
run('E  blast under cols 2-4                   ',3,2);
run('F  blast under cols 2-5 (whole line)      ',4,2);
