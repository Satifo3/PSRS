
const SYMBOLS=["R7","B7","AZU","LOTAD","CHERRY","REPLAY","POWER"];

/* v0.2 — 参考画像の右端にある 1〜21 配列をそのまま転記。
   1番が配列の先頭、21番が末尾。 */
const reelOrders=[
  [
    "AZU","REPLAY","POWER","CHERRY","LOTAD","B7","LOTAD","POWER","REPLAY","AZU",
    "CHERRY","R7","REPLAY","LOTAD","POWER","B7","AZU","REPLAY","LOTAD","POWER","R7"
  ],
  [
    "CHERRY","REPLAY","LOTAD","CHERRY","REPLAY","LOTAD","AZU","CHERRY","REPLAY","LOTAD",
    "B7","LOTAD","POWER","POWER","REPLAY","CHERRY","AZU","LOTAD","REPLAY","CHERRY","R7"
  ],
  [
    "CHERRY","LOTAD","REPLAY","POWER","AZU","LOTAD","REPLAY","POWER","AZU","LOTAD",
    "REPLAY","AZU","POWER","LOTAD","REPLAY","AZU","LOTAD","REPLAY","B7","POWER","R7"
  ]
];
const CELL=104;
let credit=500,payout=0,power=0,bd=0;
let spinning=false,autoStop=false;
let currentTargets=[0,0,0],stopDone=[true,true,true],animFrames=[null,null,null],spinStart=0;
let selectedOutcome=null;

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function art(sym){
  if(sym==="R7")return `
    <svg class="slot-svg seven-svg" viewBox="0 0 100 78" aria-label="赤7">
      <defs>
        <linearGradient id="r7g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff8b32"/><stop offset=".42" stop-color="#f04a23"/>
          <stop offset="1" stop-color="#c91b20"/>
        </linearGradient>
      </defs>
      <path d="M12 14 H88 L81 31 H61 L38 66 H16 L42 31 H12 Z"
            fill="url(#r7g)" stroke="#6b6b65" stroke-width="7" stroke-linejoin="round"/>
      <path d="M18 19 H80" stroke="#ffd39c" stroke-width="5" opacity=".8"/>
    </svg>`;
  if(sym==="B7")return `
    <svg class="slot-svg seven-svg" viewBox="0 0 100 78" aria-label="青7">
      <defs>
        <linearGradient id="b7g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#45a7ff"/><stop offset=".42" stop-color="#1971e5"/>
          <stop offset="1" stop-color="#173dc4"/>
        </linearGradient>
      </defs>
      <path d="M12 14 H88 L81 31 H61 L38 66 H16 L42 31 H12 Z"
            fill="url(#b7g)" stroke="#6b6b65" stroke-width="7" stroke-linejoin="round"/>
      <path d="M18 19 H80" stroke="#bfe3ff" stroke-width="5" opacity=".85"/>
    </svg>`;
  if(sym==="AZU")return `
    <svg class="slot-svg" viewBox="0 0 100 78" aria-label="ルリリ">
      <ellipse cx="43" cy="47" rx="26" ry="20" fill="#3389da" stroke="#31516e" stroke-width="5"/>
      <circle cx="72" cy="35" r="17" fill="#2473ce" stroke="#31516e" stroke-width="5"/>
      <circle cx="31" cy="31" r="10" fill="#6db8ee" stroke="#31516e" stroke-width="4"/>
      <circle cx="48" cy="31" r="10" fill="#6db8ee" stroke="#31516e" stroke-width="4"/>
      <circle cx="34" cy="47" r="3" fill="#13263d"/>
      <circle cx="47" cy="47" r="3" fill="#13263d"/>
      <path d="M37 56 Q42 60 48 55" fill="none" stroke="#173452" stroke-width="3"/>
      <path d="M65 48 Q57 58 49 58" fill="none" stroke="#31516e" stroke-width="5"/>
    </svg>`;
  if(sym==="LOTAD")return `
    <svg class="slot-svg" viewBox="0 0 100 78" aria-label="ハスボー">
      <ellipse cx="51" cy="41" rx="31" ry="17" fill="#66a73a" stroke="#394d25" stroke-width="5"/>
      <path d="M23 38 Q49 15 80 34 Q64 20 55 16 Q39 18 23 38Z" fill="#7ec84d" stroke="#394d25" stroke-width="4"/>
      <path d="M48 24 Q60 30 73 31" fill="none" stroke="#aee86a" stroke-width="4"/>
      <circle cx="41" cy="43" r="3" fill="#243018"/>
      <circle cx="57" cy="43" r="3" fill="#243018"/>
      <path d="M46 52 Q51 56 57 51" fill="none" stroke="#243018" stroke-width="3"/>
      <path d="M33 58 L26 68 M67 58 L74 68" stroke="#5a4426" stroke-width="5"/>
    </svg>`;
  if(sym==="CHERRY")return `
    <svg class="slot-svg" viewBox="0 0 100 78" aria-label="チェリー">
      <path d="M47 12 Q53 28 43 39 M53 14 Q65 26 73 36" fill="none" stroke="#438231" stroke-width="7"/>
      <path d="M52 13 Q69 3 82 13 Q69 23 54 18Z" fill="#54a93f" stroke="#355c29" stroke-width="4"/>
      <circle cx="34" cy="51" r="18" fill="#de2d24" stroke="#7a281d" stroke-width="5"/>
      <circle cx="67" cy="53" r="18" fill="#e53627" stroke="#7a281d" stroke-width="5"/>
      <circle cx="29" cy="45" r="5" fill="#ff7e55"/><circle cx="62" cy="47" r="5" fill="#ff7e55"/>
    </svg>`;
  if(sym==="REPLAY")return `
    <svg class="slot-svg" viewBox="0 0 100 78" aria-label="REPLAY">
      <ellipse cx="50" cy="39" rx="37" ry="24" fill="#c6b795" stroke="#777267" stroke-width="5"/>
      <path d="M18 39 H82" stroke="#ae752d" stroke-width="9" opacity=".75"/>
      <text x="50" y="46" text-anchor="middle" font-size="18" font-weight="900"
            font-family="Arial Black, sans-serif" fill="#f0eee5" stroke="#6a6965" stroke-width="1.4">REPLAY</text>
    </svg>`;
  return `
    <svg class="slot-svg" viewBox="0 0 100 78" aria-label="POWER">
      <path d="M13 29 Q27 17 39 29 L50 20 L61 29 Q74 17 87 29 L72 39 L79 54
               Q64 50 53 62 Q40 50 24 54 L31 40Z"
            fill="#343230" stroke="#242220" stroke-width="4" stroke-linejoin="round"/>
      <path d="M57 12 L39 40 H52 L43 68 L71 34 H58Z"
            fill="#ffd829" stroke="#7b6010" stroke-width="4" stroke-linejoin="round"/>
    </svg>`;
}

function buildReels(){
  reelOrders.forEach((arr,i)=>{
    const el=$("#reel"+i);el.innerHTML="";
    // Repeat 5x to create a long smooth strip.
    for(let n=0;n<5;n++)arr.forEach(sym=>{
      const c=document.createElement("div");c.className="reel-cell";c.dataset.sym=sym;
      c.innerHTML=`<div class="art">${art(sym)}</div>`;el.appendChild(c);
    });
    currentTargets[i]=arr.length*2+3+i*2;
    setReelPos(i,currentTargets[i],false);
  });
}
function setReelPos(i,index,animate=true,duration=800){
  const el=$("#reel"+i);
  const offset=-(index*cellSize()-cellSize());
  if(!animate){el.style.transition="none";el.style.transform=`translate3d(0,${offset}px,0)`;return}
  el.style.transition=`transform ${duration}ms cubic-bezier(.12,.72,.1,1)`;
  requestAnimationFrame(()=>el.style.transform=`translate3d(0,${offset}px,0)`);
}
function cellSize(){return $("#reel0 .reel-cell")?.getBoundingClientRect().height||CELL}

function display(){ 
  $("#credit").textContent=String(Math.max(0,credit)).padStart(4,"0");
  $("#payout").textContent=String(Math.max(0,payout)).padStart(4,"0");
  $("#bdRemain").textContent=`${bd} GAME`;
  $("#powerNum").textContent=`${power}/16`;
  $("#powerGauge").innerHTML=Array.from({length:16},(_,i)=>`<span class="power-lamp ${i<power?"on":""}"></span>`).join("");
}
function msg(t){$("#message").textContent=t}
function setStops(on){$$(".stop-btn").forEach(b=>b.disabled=!on)}
function weightedOutcome(){
  // BD is intentionally more generous and visually slower.
  const r=Math.random();
  if(bd>0){
    if(r<.09)return {type:"BIG",symbols:["R7","R7","R7"]};
    if(r<.18)return {type:"REG",symbols:Math.random()<.5?["R7","R7","B7"]:["B7","B7","R7"]};
    if(r<.31)return {type:"AZU",symbols:["AZU","AZU","AZU"]};
    if(r<.46)return {type:"LOTAD",symbols:["LOTAD","LOTAD","LOTAD"]};
    if(r<.58)return {type:"REPLAY",symbols:["REPLAY","REPLAY","REPLAY"]};
    if(r<.70)return {type:"POWER",symbols:["POWER","POWER","POWER"]};
    return {type:"MISS",symbols:[rnd(SYMBOLS),rnd(SYMBOLS),rnd(SYMBOLS)]};
  }
  if(r<.018)return {type:"BIG",symbols:[Math.random()<.5?"R7":"B7",null,null],same7:true};
  if(r<.043)return {type:"REG",symbols:Math.random()<.5?["R7","R7","B7"]:["B7","B7","R7"]};
  if(r<.093)return {type:"AZU",symbols:["AZU","AZU","AZU"]};
  if(r<.16)return {type:"LOTAD",symbols:["LOTAD","LOTAD","LOTAD"]};
  if(r<.22)return {type:"CHERRY",symbols:["CHERRY",rnd(SYMBOLS),rnd(SYMBOLS)]};
  if(r<.29)return {type:"REPLAY",symbols:["REPLAY","REPLAY","REPLAY"]};
  if(r<.35)return {type:"POWER",symbols:["POWER","POWER","POWER"]};
  return {type:"MISS",symbols:[rnd(SYMBOLS),rnd(SYMBOLS),rnd(SYMBOLS)]};
}
function normalizeOutcome(o){
  if(o.same7){const s=o.symbols[0];o.symbols=[s,s,s]}
  if(o.type==="MISS"){
    // prevent accidental jackpot in miss state
    if(o.symbols[0]===o.symbols[1]&&o.symbols[1]===o.symbols[2])o.symbols[2]=rnd(SYMBOLS.filter(x=>x!==o.symbols[0]));
  }
  return o;
}
function findTargetIndex(reelIndex,sym){
  const arr=reelOrders[reelIndex];
  let candidates=[];
  arr.forEach((s,j)=>{if(s===sym)candidates.push(j)});
  const base=arr.length*3;
  const j=rnd(candidates);
  return base+j;
}
function startVisualSpin(i){
  const el=$("#reel"+i);
  el.style.transition="none";
  let pos=currentTargets[i]*cellSize();
  let last=performance.now();
  const speed=(bd>0?0.27:0.48) * cellSize(); // px per ~16ms
  function frame(now){
    if(stopDone[i])return;
    const dt=Math.min(32,now-last);last=now;
    pos += speed*(dt/16);
    const len=reelOrders[i].length*cellSize();
    if(pos>len*3.9)pos-=len;
    el.style.transform=`translate3d(0,${-(pos-cellSize())}px,0)`;
    animFrames[i]=requestAnimationFrame(frame);
  }
  animFrames[i]=requestAnimationFrame(frame);
}
async function spin(){
  if(spinning)return;
  if(credit<3){msg("コインが足りません。RESETで補充してください。");return}
  credit-=3;payout=0;spinning=true;stopDone=[false,false,false];
  selectedOutcome=normalizeOutcome(weightedOutcome());
  display();setStops(true);$("#spinBtn").disabled=true;
  msg(bd>0?`BD TIME 残り${bd}G：リールが少し遅い！`:"リール回転中… STOPで止めよう！");
  for(let i=0;i<3;i++)startVisualSpin(i);

  if(autoStop){
    await sleep(bd>0?650:850);stopReel(0);
    await sleep(bd>0?420:520);stopReel(1);
    await sleep(bd>0?420:520);stopReel(2);
  }else{
    // safety autostop: user can still play manually
    setTimeout(()=>{if(spinning&&!stopDone[0])stopReel(0)},4200);
    setTimeout(()=>{if(spinning&&!stopDone[1])stopReel(1)},5100);
    setTimeout(()=>{if(spinning&&!stopDone[2])stopReel(2)},6000);
  }
}
function stopReel(i){
  if(!spinning||stopDone[i])return;
  // enforce left-to-right stop, like GBA control feel
  if(i>0 && !stopDone[i-1]){msg("左のリールから順番にSTOP！");return}
  stopDone[i]=true;
  if(animFrames[i])cancelAnimationFrame(animFrames[i]);
  const sym=selectedOutcome.symbols[i];
  const target=findTargetIndex(i,sym);
  currentTargets[i]=target;
  setReelPos(i,target,true,bd>0?420:520);
  const b=$(`.stop-btn[data-stop="${i}"]`);b.classList.add("active");setTimeout(()=>b.classList.remove("active"),220);
  if(stopDone.every(Boolean))setTimeout(resolveOutcome,600);
}
async function resolveOutcome(){
  setStops(false);spinning=false;$("#spinBtn").disabled=false;
  const o=selectedOutcome;
  let won=0,replay=false,text="";
  if(o.type==="BIG"){won=300;text="🎉 BIG BONUS！ 同色777！ +300";bd=0;flashWin()}
  else if(o.type==="REG"){won=90;text="✨ REG BONUS！ 右リール色違い7！ +90";flashWin()}
  else if(o.type==="AZU"){won=12;text="ルリリ役！ +12";flashWin()}
  else if(o.type==="LOTAD"){won=6;text="ハスボー役！ +6";flashWin()}
  else if(o.type==="CHERRY"){won=2;text="チェリー！ +2"}
  else if(o.type==="REPLAY"){won=4;replay=true;text="REPLAY！ +4 ＆ もう一回"}
  else if(o.type==="POWER"){won=3;power=Math.min(16,power+1);text="⚡ POWER！ +3 / ゲージ+1"}
  else text="はずれ。次のSPINへ！";
  credit+=won;payout=won;
  if(bd>0)bd--;
  display();msg(text);
  await maybeBD();
  if(replay){
    setTimeout(()=>{if(!spinning)spin()},900);
  }
}
function flashWin(){
  $("#slotArea").animate(
    [{filter:"brightness(1)"},{filter:"brightness(1.55) saturate(1.4)"},{filter:"brightness(1)"}],
    {duration:650,iterations:3}
  );
}
async function maybeBD(){
  // Rough prototype event rate; POWER changes odds toward larger BD values.
  if(bd>0||Math.random()>.15)return;
  msg("⚡ ピカチュウイベント！ BDルーレット！");
  const spans=$$("#bdRoulette .bd-numbers span");
  let idx=0;
  for(let n=0;n<22;n++){
    spans.forEach(x=>x.classList.remove("hit"));spans[idx%6].classList.add("hit");idx++;
    await sleep(55+n*4);
  }
  const weights=[Math.max(8,28-power),18,18+power,12+power,7+power,4+power];
  const total=weights.reduce((a,b)=>a+b,0);let r=Math.random()*total,hit=0;
  for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0){hit=i;break}}
  spans.forEach(x=>x.classList.remove("hit"));spans[hit].classList.add("hit");
  if(hit===0){msg("💥 BDルーレット失敗。POWERは保持！");}
  else{bd=hit;power=0;msg(`⚡ BD TIME ${hit} GAME 獲得！`);}
  display();
  setTimeout(()=>spans.forEach(x=>x.classList.remove("hit")),1800);
}
function reset(){credit=500;payout=0;power=0;bd=0;display();msg("リセットしました。3コインBET。")}
$("#spinBtn").addEventListener("click",spin);
$$(".stop-btn").forEach(b=>b.addEventListener("click",()=>stopReel(Number(b.dataset.stop))));
$("#autoBtn").addEventListener("click",()=>{autoStop=!autoStop;$("#autoBtn").classList.toggle("active",autoStop);$("#autoBtn").textContent=autoStop?"AUTO: ON":"AUTO STOP";});
$("#helpBtn").onclick=()=>$("#helpModal").classList.remove("hidden");
$("#closeHelp").onclick=()=>$("#helpModal").classList.add("hidden");
$("#helpModal").addEventListener("click",e=>{if(e.target.id==="helpModal")$("#helpModal").classList.add("hidden")});
$("#credit").addEventListener("dblclick",reset);
buildReels();display();setStops(false);
