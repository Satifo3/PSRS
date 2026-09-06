
const SYMBOLS=["R7","B7","AZU","SEED","CHERRY","REPLAY","POWER"];
const reelOrders=[
  ["CHERRY","R7","SEED","REPLAY","AZU","POWER","B7","SEED","CHERRY","AZU","REPLAY","POWER","R7","SEED","AZU","B7","CHERRY","REPLAY","POWER","AZU"],
  ["SEED","AZU","R7","POWER","CHERRY","REPLAY","B7","AZU","SEED","POWER","CHERRY","R7","REPLAY","AZU","B7","SEED","POWER","CHERRY","AZU","REPLAY"],
  ["POWER","CHERRY","B7","AZU","REPLAY","SEED","R7","CHERRY","POWER","AZU","SEED","REPLAY","B7","POWER","CHERRY","R7","AZU","SEED","REPLAY","POWER"]
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
  if(sym==="R7")return `<div class="symbol"><div class="s7">7</div></div>`;
  if(sym==="B7")return `<div class="symbol"><div class="s7 blue">7</div></div>`;
  if(sym==="AZU")return `<div class="symbol azurill"><span class="txt">AZU</span></div>`;
  if(sym==="SEED")return `<div class="symbol"><div class="seed-art"></div></div>`;
  if(sym==="CHERRY")return `<div class="symbol"><div class="cherry-art"><i></i></div></div>`;
  if(sym==="REPLAY")return `<div class="symbol"><div class="replay-art">REPLAY</div></div>`;
  return `<div class="symbol power-art">⚡</div>`;
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
    if(r<.18)return {type:"REG",symbols:["R7","R7","B7"]};
    if(r<.31)return {type:"AZU",symbols:["AZU","AZU","AZU"]};
    if(r<.46)return {type:"SEED",symbols:["SEED","SEED","SEED"]};
    if(r<.58)return {type:"REPLAY",symbols:["REPLAY","REPLAY","REPLAY"]};
    if(r<.70)return {type:"POWER",symbols:["POWER","POWER","POWER"]};
    return {type:"MISS",symbols:[rnd(SYMBOLS),rnd(SYMBOLS),rnd(SYMBOLS)]};
  }
  if(r<.018)return {type:"BIG",symbols:[Math.random()<.5?"R7":"B7",null,null],same7:true};
  if(r<.043)return {type:"REG",symbols:["R7","R7","B7"]};
  if(r<.093)return {type:"AZU",symbols:["AZU","AZU","AZU"]};
  if(r<.16)return {type:"SEED",symbols:["SEED","SEED","SEED"]};
  if(r<.22)return {type:"CHERRY3",symbols:["CHERRY","CHERRY","CHERRY"]};
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
  else if(o.type==="SEED"){won=6;text="タネ役！ +6";flashWin()}
  else if(o.type==="CHERRY3"){won=6;text="チェリー3つ！ +6"}
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
