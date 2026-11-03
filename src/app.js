(function(){
'use strict';
/* ---------- model ---------- */
var MODS=[];
var TIERS={Core:'Do these first',Skim:'Skim for the vocabulary',Later:'Only if you have time'};
STAGE0.forEach(function(m,i){m.stage=0;m.n=i+1;m.label='B'+(i+1);m.phase=TIERS[m.tier];MODS.push(m);});
STAGE1.forEach(function(m,i){m.stage=1;m.n=i+1;m.label=String(i+1);MODS.push(m);});
var BY={};
MODS.forEach(function(m){
  m.link=ACADEMY+m.slug;
  m.secs=m.sec.map(function(s,i){var p=s.split(' | ');return {id:m.id+'.'+(i+1),n:i+1,t:p[0],h:p[1]||'',m:m};});
  BY[m.id]=m;
});
var SEC={};MODS.forEach(function(m){m.secs.forEach(function(s){SEC[s.id]=s;});});
var LS_KEY='cdsa-tracker-v4',LS_OLD='cdsa-tracker-v3';
var EXT_PER=4; // sections per study day once past the target date

/* ---------- state ---------- */
function def(){return {v:4,done:{},flag:{},notes:{},skip:{},open:{},labs:{},cnt:{},gate:{},rev:{},revN:0,focus:{},badges:{},fav:{},dnotes:{},dopen:{},hideDone:false,start:'',target:80,exam:'',days:[1,2,3,4,5,6],theme:'dark',timer:null,celeb:true,sound:false,cel:{}};}
var S=def(), memOnly=false;
function isDate(x){return typeof x==='string'&&/^\d{4}-\d\d-\d\d$/.test(x);}
function norm(d,old){
  var s=def();
  if(d&&typeof d==='object'){
    ['done','flag','notes','skip','open','labs','cnt','gate','rev','focus','badges','fav','cel'].forEach(function(k){if(d[k]&&typeof d[k]==='object')s[k]=d[k];});
    Object.keys(s.done).forEach(function(k){if(!SEC[k]||typeof s.done[k]!=='string')delete s.done[k];}); // unknown ids or odd values would break the planner
    if(!old){['dnotes','dopen'].forEach(function(k){if(d[k]&&typeof d[k]==='object')s[k]=d[k];});}
    if(isDate(d.start))s.start=d.start;
    if(isDate(d.exam))s.exam=d.exam;
    if(+d.target>=7)s.target=Math.min(400,Math.round(+d.target));
    if(Array.isArray(d.days)&&d.days.length)s.days=d.days.filter(function(x){return x>=0&&x<=6;});
    if(!s.days.length)s.days=[1,2,3,4,5,6];
    if(+d.revN>0)s.revN=+d.revN;
    s.hideDone=!!d.hideDone;
    if(typeof d.celeb==='boolean')s.celeb=d.celeb;
    if(typeof d.sound==='boolean')s.sound=d.sound;
    if(d.theme==='light'||d.theme==='dark'||d.theme==='system')s.theme=d.theme;
    if(d.timer&&+d.timer.end>0&&+d.timer.len>0)s.timer={end:+d.timer.end,len:+d.timer.len};
  }
  return s;
}
try{
  var raw=localStorage.getItem(LS_KEY),old=false;
  if(!raw){raw=localStorage.getItem(LS_OLD);old=!!raw;}
  if(raw)S=norm(JSON.parse(raw),old);
}catch(e){memOnly=true;}
var saveT=null;
function persist(){try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){memOnly=true;}}
function save(){clearTimeout(saveT);saveT=setTimeout(persist,250);}
window.addEventListener('pagehide',persist);

/* ---------- helpers ---------- */
function $(s,r){return (r||document).querySelector(s);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function pad(n){return String(n).padStart(2,'0');}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parse(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function todayD(){var n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());}
function diffDays(a,b){return Math.round((a-b)/86400000);}
function fmt(d){return d.toLocaleDateString(undefined,{day:'numeric',month:'short'});}
function fmtL(d){return d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});}
function fmtFull(d){return d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'});}
function pct(x){return Math.round(Math.max(0,Math.min(1,x))*100);}
function isStudy(d){return S.days.indexOf(d.getDay())>=0;}
function weekStart(d){return addDays(d,-((d.getDay()+6)%7));}
function fmtMin(m){m=Math.round(m);if(m<60)return m+'m';var h=Math.floor(m/60),r=m%60;return h+'h'+(r?' '+pad(r)+'m':'');}
var ICON={
  today:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  plan:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  path:'<svg viewBox="0 0 24 24"><path d="M4 6h3M4 12h3M4 18h3"/><path d="M11 6h9M11 12h9M11 18h9"/></svg>',
  prac:'<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/></svg>',
  exam:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></svg>',
  flag:'<svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  ext:'<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  share:'<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/></svg>'
};

/* ---------- numbers ---------- */
function modStat(m){var d=0;m.secs.forEach(function(s){if(S.done[s.id])d++;});return {done:d,total:m.secs.length,pct:m.secs.length?d/m.secs.length:0,skipped:!!S.skip[m.id]};}
function stageStat(stage){var d=0,t=0;MODS.forEach(function(m){if(m.stage!==stage||S.skip[m.id])return;var x=modStat(m);d+=x.done;t+=x.total;});return {done:d,total:t,pct:t?d/t:1};}
function planList(){var out=[];MODS.forEach(function(m){if(S.skip[m.id])return;m.secs.forEach(function(s){out.push({m:m,s:s});});});return out;}
function doneDates(){var c={};Object.keys(S.done).forEach(function(k){var v=S.done[k];if(isDate(v))c[v]=(c[v]||0)+1;});return c;}
function activeOn(c,d){return (c[ymd(d)]||0)>0||(S.focus[ymd(d)]||0)>0;}
function streakNow(c){
  var d=todayD(),n=0,i=0;
  for(;i<500;i++){
    if(activeOn(c,d))n++;
    else if(isStudy(d)&&i>0)break;
    d=addDays(d,-1);
  }
  return n;
}
function bestStreak(c){
  var keys=Object.keys(c).concat(Object.keys(S.focus)).sort();if(!keys.length)return 0;
  var d=parse(keys[0]),end=todayD(),run=0,best=0;
  while(d<=end){if(activeOn(c,d)){run++;if(run>best)best=run;}else if(isStudy(d)&&ymd(d)!==ymd(end))run=0;d=addDays(d,1);}
  return best;
}
function sumDays(map,n){var d=todayD(),t=0;for(var i=0;i<n;i++){t+=map[ymd(addDays(d,-i))]||0;}return t;}
function totalFocus(){var t=0;Object.keys(S.focus).forEach(function(k){t+=S.focus[k];});return t;}

/* The planner: spreads what is left between today and the target date.
   It is rebuilt on every render, so falling behind or getting ahead moves tomorrow's load by itself. */
function engine(){
  var t=todayD(),tk=ymd(t),start=S.start?parse(S.start):t;
  var pl=planList(),rem=[],dTodayList=[],doneCount=0;
  pl.forEach(function(x){var v=S.done[x.s.id];if(v){doneCount++;if(v===tk)dTodayList.push(x);}else rem.push(x);});
  var deadline=S.exam?addDays(parse(S.exam),-7):addDays(start,Math.max(7,S.target)-1);
  var first=t>start?t:start,slots=[],d=first,g=0;
  while(d<=deadline&&g<1500){if(isStudy(d))slots.push(d);d=addDays(d,1);g++;}
  var overdue=false;
  if(rem.length&&!slots.length&&t>=start){
    // past the target date: keep going at a fixed pace from today
    overdue=true;d=t;g=0;var need=Math.ceil(rem.length/EXT_PER)+1;
    while(slots.length<need&&g<4000){if(isStudy(d))slots.push(d);d=addDays(d,1);g++;}
  }
  var todayIsSlot=slots.length>0&&ymd(slots[0])===tk;
  var R0=rem.length+(todayIsSlot?dTodayList.length:0),quota=0;
  if(rem.length||dTodayList.length){quota=overdue?EXT_PER:(slots.length?Math.ceil(R0/slots.length):EXT_PER);}
  var todayItems=[],after=rem;
  if(todayIsSlot){var left=Math.max(0,quota-dTodayList.length);todayItems=rem.slice(0,left);after=rem.slice(left);}
  var fs=todayIsSlot?slots.slice(1):slots.slice();
  var days=[],modTarget={},secDate={};
  todayItems.forEach(function(x){modTarget[x.m.id]=t;secDate[x.s.id]=t;});
  if(after.length&&fs.length){
    var idx=0;
    if(overdue){fs.forEach(function(dt){if(idx<after.length){days.push({date:dt,items:after.slice(idx,idx+EXT_PER)});idx+=EXT_PER;}});}
    else{var base=Math.floor(after.length/fs.length),extra=after.length%fs.length;fs.forEach(function(dt,k){var n=base+(k<extra?1:0);if(n>0){days.push({date:dt,items:after.slice(idx,idx+n)});idx+=n;}});}
    days.forEach(function(dy){dy.items.forEach(function(x){modTarget[x.m.id]=dy.date;secDate[x.s.id]=dy.date;});});
  }
  var totalStudy=0,elapsed=0,dd2=start;g=0;
  while(dd2<=deadline&&g<1500){if(isStudy(dd2)){totalStudy++;if(dd2<t)elapsed++;}dd2=addDays(dd2,1);g++;}
  var ideal=totalStudy?Math.round(pl.length*elapsed/totalStudy):0;if(t<start)ideal=0;
  var lastDate=days.length?days[days.length-1].date:(todayItems.length?t:null);
  return {t:t,tk:tk,start:start,deadline:deadline,pl:pl,total:pl.length,done:doneCount,rem:rem,doneToday:dTodayList,todayItems:todayItems,quota:quota,todayIsSlot:todayIsSlot,days:days,modTarget:modTarget,secDate:secDate,overdue:overdue,ahead:doneCount-ideal,ideal:ideal,end:lastDate,slotsLeft:slots.length,dayNo:diffDays(t,start)+1,notStarted:t<start};
}
function history(E){
  var c={};Object.keys(S.done).forEach(function(k){var v=S.done[k];if(isDate(v)&&v<E.tk){(c[v]=c[v]||[]).push({m:SEC[k].m,s:SEC[k]});}});
  var out=[],d=E.start,g=0;
  while(d<E.t&&g<1500){var k=ymd(d),items=c[k]||[];if(isStudy(d)||items.length)out.push({key:k,date:d,items:items,kind:'past',missed:items.length===0});d=addDays(d,1);g++;}
  Object.keys(c).forEach(function(k){if(parse(k)<E.start&&!out.some(function(o){return o.key===k;}))out.unshift({key:k,date:parse(k),items:c[k],kind:'past',missed:false});});
  out.sort(function(a,b){return a.key<b.key?-1:1;});
  return out;
}

/* ---------- reviews, badges ---------- */
function reviewsDue(){
  var tk=ymd(todayD()),out=[];
  Object.keys(S.rev).forEach(function(id){var r=S.rev[id];if(r.due<=tk&&SEC[id])out.push({id:id,r:r,s:SEC[id]});});
  out.sort(function(a,b){return a.r.due<b.r.due?-1:a.r.due>b.r.due?1:0;});
  return out;
}
var BADGES=[
 ['first','First section',function(c){return c.done>=1;}],
 ['s25','25 sections',function(c){return c.done>=25;}],
 ['s100','100 sections',function(c){return c.done>=100;}],
 ['s250','250 sections',function(c){return c.done>=250;}],
 ['core','Core basics finished',function(c){return c.core;}],
 ['p25','SOC path 25%',function(c){return c.soc>=.25;}],
 ['p50','SOC path 50%',function(c){return c.soc>=.5;}],
 ['p75','SOC path 75%',function(c){return c.soc>=.75;}],
 ['p100','SOC path complete',function(c){return c.soc>=1;}],
 ['str7','7-day streak',function(c){return c.best>=7;}],
 ['str30','30-day streak',function(c){return c.best>=30;}],
 ['h10','10 focused hours',function(c){return c.hours>=10;}],
 ['h50','50 focused hours',function(c){return c.hours>=50;}],
 ['rev25','25 reviews done',function(c){return S.revN>=25;}]
];
function badgeCtx(){
  var c=doneDates(),core=true,any=false;
  MODS.forEach(function(m){if(m.stage===0&&m.tier==='Core'&&!S.skip[m.id]){any=true;var x=modStat(m);if(x.done<x.total)core=false;}});
  var dn=0;Object.keys(S.done).forEach(function(){dn++;});
  return {done:dn,core:any&&core,soc:stageStat(1).pct*(stageStat(1).total?1:0),best:bestStreak(c),hours:totalFocus()/60};
}
function awardBadges(){
  var c=badgeCtx(),fresh=[];
  BADGES.forEach(function(b){if(!S.badges[b[0]]&&b[2](c)){S.badges[b[0]]=ymd(todayD());fresh.push({id:b[0],label:b[1]});}});
  if(fresh.length)save();
  return fresh;
}

/* ---------- rank and milestones ---------- */
var STREAKS=[3,7,14,30];
var RANKS=[[0,'Recruit'],[.15,'Analyst'],[.4,'Hunter'],[.7,'Responder'],[1,'CDSA-ready']];
function socPct(){var s=stageStat(1);return s.total?s.done/s.total:0;}
function rankIdx(p){var r=0;RANKS.forEach(function(x,i){if(p>=x[0])r=i;});return r;}
function rankInfo(){var p=socPct(),i=rankIdx(p),nx=RANKS[i+1];return {p:p,i:i,name:RANKS[i][1],next:nx?nx[1]:'',nextAt:nx?nx[0]:1};}
var SHIELD='M24 3 40 9.5V26c0 12-7.5 20-16 24C15.5 46 8 38 8 26V9.5z';
function shield(p,uid,cls,label){
  var y=(52*(1-Math.max(0,Math.min(1,p)))).toFixed(1);
  return '<svg class="'+cls+'" viewBox="0 0 48 52"'+(label?' role="img" aria-label="'+esc(label)+'"':' aria-hidden="true"')+'><defs><clipPath id="'+uid+'"><rect x="0" y="'+y+'" width="48" height="52"/></clipPath></defs><path class="out" d="'+SHIELD+'"/><path class="fill" clip-path="url(#'+uid+')" d="'+SHIELD+'"/><path class="rim" d="'+SHIELD+'"/>'+(p>=1?'<path class="chk" d="m16 26 6 6 11-13"/>':'')+'</svg>';
}
/* Everything the user has earned so far. Keys in S.cel are milestones already celebrated (or sealed
   silently on load/restore), so a milestone fires once, on a real action, and never replays. */
function milestones(){
  var out=[],E=engine(),sn=streakNow(doneDates());
  MODS.forEach(function(m){var x=modStat(m);if(x.total&&x.done===x.total)out.push({key:'mod:'+m.id,type:'mod',label:m.name});});
  [0,1].forEach(function(st){var s=stageStat(st);if(s.total&&s.done===s.total)out.push({key:'stage:'+st,type:'stage',stage:st,total:s.total});});
  STREAKS.forEach(function(n){if(sn>=n)out.push({key:'streak:'+n,type:'streak',n:n});});
  for(var i=1;i<=rankIdx(socPct());i++)out.push({key:'rank:'+RANKS[i][1],type:'rank',label:RANKS[i][1]});
  if(E.todayIsSlot&&E.quota>0&&E.doneToday.length>=E.quota)out.push({key:'quota:'+E.tk,type:'quota'});
  var s1=stageStat(1);
  if(s1.total&&s1.done===s1.total&&GATE.every(function(g){return g.auto||S.gate[g.k];}))out.push({key:'ready',type:'ready'});
  return out;
}
function newMilestones(){
  var out=[];
  milestones().forEach(function(m){if(!S.cel[m.key]){S.cel[m.key]=1;out.push(m);}});
  if(out.length)save();
  return out;
}
function sealCel(){
  var old=ymd(addDays(todayD(),-45));
  Object.keys(S.cel).forEach(function(k){if(k.indexOf('quota:')===0&&k.slice(6)<old)delete S.cel[k];});
  milestones().forEach(function(m){S.cel[m.key]=1;});
}

/* ---------- celebrations ---------- */
var RMQ=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
function reduced(){return !!(RMQ&&RMQ.matches);}
var LOW=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=2;
var CAP=LOW?60:130,FXC=['#9FEF00','#5CB2FF','#FFAF00','#E8EEF8','#C6FF4D'];
var PS=[],cv=null,cg=null,rafId=0,tPrev=0,tStart=0;
function sizeCv(){if(!cv)return;var d=LOW?1:Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(innerWidth*d);cv.height=Math.round(innerHeight*d);cg.setTransform(d,0,0,d,0,0);}
function pStop(){cancelAnimationFrame(rafId);PS.length=0;if(cv){cv.remove();cv=null;cg=null;}}
function pStart(){
  if(cv)return;
  cv=document.createElement('canvas');cv.className='fx-cv';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
  cg=cv.getContext('2d');sizeCv();tPrev=0;tStart=Date.now();rafId=requestAnimationFrame(pLoop);
}
function pLoop(ts){
  var dt=tPrev?Math.min(.05,(ts-tPrev)/1000):.016;tPrev=ts;
  cg.clearRect(0,0,innerWidth,innerHeight);
  for(var i=PS.length-1;i>=0;i--){
    var p=PS[i];p.age+=dt;var u=p.age-p.delay;
    if(u<0)continue;
    if(u>=p.life||p.y>innerHeight+40){PS.splice(i,1);continue;}
    p.vy+=p.g*dt;p.vx*=p.drag;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
    cg.save();cg.globalAlpha=u>p.life*.7?Math.max(0,1-(u-p.life*.7)/(p.life*.3)):1;cg.translate(p.x,p.y);cg.rotate(p.r);cg.fillStyle=p.c;
    if(p.shape==='dot'){cg.beginPath();cg.arc(0,0,p.s*.35,0,6.283);cg.fill();}
    else if(p.shape==='star'){var s=p.s*.6;cg.beginPath();cg.moveTo(0,-s);cg.quadraticCurveTo(0,0,s,0);cg.quadraticCurveTo(0,0,0,s);cg.quadraticCurveTo(0,0,-s,0);cg.quadraticCurveTo(0,0,0,-s);cg.fill();}
    else{cg.scale(1,Math.cos(u*p.fl));cg.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);}
    cg.restore();
  }
  if(!PS.length||Date.now()-tStart>4500){pStop();return;}
  rafId=requestAnimationFrame(pLoop);
}
function pAdd(p){if(PS.length>=CAP)return;p.age=0;PS.push(p);}
function mk(o){return {x:o.x,y:o.y,vx:o.vx,vy:o.vy,g:o.g,drag:o.drag||.985,r:Math.random()*6.28,vr:(Math.random()-.5)*14,s:o.s,c:FXC[Math.floor(Math.random()*FXC.length)],shape:o.shape,life:o.life,delay:o.delay||0,fl:4+Math.random()*6};}
function burst(x,y,n,o){
  o=o||{};if(reduced()||!S.celeb)return;
  n=Math.min(n,CAP-PS.length);if(n<=0)return;pStart();
  for(var i=0;i<n;i++){
    var a=-Math.PI/2+(Math.random()-.5)*(o.spread||Math.PI*1.1),sp=(o.speed||420)*(.45+Math.random()*.65);
    pAdd(mk({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:o.g||900,s:(o.size||9)*(.6+Math.random()*.7),shape:o.shape||(Math.random()<.25?'dot':'rect'),life:(o.life||1.1)+Math.random()*.5}));
  }
}
function rain(n){ // full-width confetti, about two seconds
  if(reduced()||!S.celeb)return;
  n=Math.min(n,CAP-PS.length);if(n<=0)return;pStart();
  for(var i=0;i<n;i++)pAdd(mk({x:Math.random()*innerWidth,y:-12-Math.random()*40,vx:(Math.random()-.5)*120,vy:140+Math.random()*220,g:260,drag:.99,s:7+Math.random()*6,shape:Math.random()<.2?'dot':'rect',life:1.6+Math.random()*.5,delay:Math.random()*.45}));
}
var AC=null;
function tick(hi){ // one soft synthesized tick, only when Sound is switched on
  if(!S.sound||!S.celeb)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
    var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
    o.type='sine';o.frequency.setValueAtTime(hi?988:740,t);o.frequency.exponentialRampToValueAtTime(hi?1318:988,t+.06);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.16);
  }catch(e){}
}
window.addEventListener('resize',sizeCv);

var MOD_MSG=['Module cleared. On to the next.','Another module down.','Clean sweep. That module is done.','Module complete. Nice pace.','Cleared. Breathe, then keep going.'];
var QUOTA_MSG=['Today\'s quota cleared.','Daily target hit. Right on plan.','Quota done. Anything extra is a bonus.'];
var lastMsg={};
function varied(k,arr){var i,n=0;do{i=Math.floor(Math.random()*arr.length);n++;}while(arr.length>1&&i===lastMsg[k]&&n<9);lastMsg[k]=i;return arr[i];}
function flash(el,cls,ms){if(!el)return;el.classList.add(cls);setTimeout(function(){el.classList.remove(cls);},ms);}
function ctr(el){var r=el.getBoundingClientRect();return {x:Math.max(30,Math.min(innerWidth-30,r.left+r.width/2)),y:Math.max(40,Math.min(innerHeight-40,r.top+r.height/2))};}
function ringP(){var E=engine(),dn=E.doneToday.length,q=Math.max(E.quota,dn);return q?Math.min(1,dn/q):(E.total?E.done/E.total:0);}
function takeSnap(){var mp={};MODS.forEach(function(m){mp[m.id]=modStat(m).pct;});return {ring:ringP(),mp:mp};}

/* Effects are queued by after() (user actions only) and played once the new DOM is on screen. */
var FX=null,fxToast=false,achT=null;
function after(o){
  o=o||{};save();
  if(o.defer)return;
  var fresh=awardBadges(),ms=newMilestones();
  if(o.silent)return;
  var f=FX||(FX={ticks:[],ms:[],badges:[],snap:null,undo:null});
  if(o.tick&&o.tick.on)f.ticks.push(o.tick);
  f.ms=f.ms.concat(ms);f.badges=f.badges.concat(fresh);
  if(o.snap&&!f.snap)f.snap=o.snap;
  if(o.undo)f.undo=o.undo;
}
function bigOf(f){
  var c=[],has={};
  f.ms.forEach(function(m){
    if(m.type==='ready')c.push({pri:100,eyebrow:'Milestone unlocked',title:'Ready to book',sub:'Every item on the readiness checklist is ticked. Book your voucher and block out the seven days.'});
    else if(m.type==='stage'&&m.stage===1){has.p100=1;c.push({pri:90,eyebrow:'Stage complete',title:'SOC Analyst path complete',sub:'All '+m.total+' sections done. That clears the HTB requirement for the CDSA exam.'});}
    else if(m.type==='stage')c.push({pri:80,eyebrow:'Stage complete',title:'Basics complete',sub:'All '+m.total+' sections of Stage 0 are done. On to the SOC Analyst path.'});
    else if(m.type==='streak'){has['str'+m.n]=1;c.push({pri:70+m.n/100,eyebrow:'Streak milestone',title:m.n+'-day streak',sub:m.n+' study days in a row. Rest days do not break it.'});}
  });
  f.badges.forEach(function(b){if(!has[b.id])c.push({pri:60,eyebrow:'Badge unlocked',title:'New badge: '+b.label,sub:'It is now on your Milestones list on the Today page.'});});
  if(!c.length)return null;
  c.sort(function(a,b){return b.pri-a.pri;});
  var top=c[0];top.also=c.slice(1).map(function(x){return x.title;});
  return top;
}
function banner(b){
  var el=$('#ach');if(!el)return;
  el.innerHTML=shield(1,'achSh','shield ic','')+'<div class="tx"><span class="eyebrow">'+esc(b.eyebrow)+'</span><b>'+esc(b.title)+'</b><p>'+esc(b.sub)+'</p>'+(b.also&&b.also.length?'<p class="also">Also: '+esc(b.also.join(' · '))+'</p>':'')+'</div><button class="x" data-act="achClose" aria-label="Dismiss">Dismiss</button>';
  el.classList.add('on');clearTimeout(achT);achT=setTimeout(function(){el.classList.remove('on');},7000);
}
function ringAnim(rb,from){
  var c=rb.querySelectorAll('circle')[1];if(!c)return;
  var tot=parseFloat(c.getAttribute('stroke-dasharray')),fin=c.getAttribute('stroke-dashoffset');
  c.style.strokeDashoffset=(tot*(1-from)).toFixed(1);void c.getBoundingClientRect();c.style.strokeDashoffset=fin;
}
function playFx(){
  var f=FX;FX=null;fxToast=false;if(!f)return;
  if(!S.celeb){if(f.badges.length){toast('Milestone: '+f.badges[0].label,f.undo);fxToast=true;}return;}
  var rm=reduced(),big=bigOf(f),anchor=null,mods=f.ms.filter(function(m){return m.type==='mod';});
  f.ticks.forEach(function(t){
    var cb=document.querySelector('input[data-act="'+(t.kind==='sec'?'sec':'lab')+'"][data-id="'+t.id+'"]');if(!cb)return;
    anchor=anchor||cb;
    var row=cb.closest('.sec,.dr,.crow');
    if(rm){flash(cb,'hl',2200);flash(row,'hl',2200);}
    else{flash(cb,'pop',700);flash(row,'glow',1200);if(t.kind==='prob'){var q=ctr(cb);burst(q.x,q.y,9,{shape:'star',spread:Math.PI*2,speed:150,g:80,size:8,life:.55});}}
    tick(false);
  });
  if(f.snap&&!rm)Object.keys(f.snap.mp).forEach(function(id){
    var now=modStat(BY[id]).pct,from=f.snap.mp[id];if(now===from)return;
    var card=document.getElementById('m-'+id),bar=card&&card.querySelector('.mh .bar i');if(!bar)return;
    bar.style.width=pct(from)+'%';void bar.offsetWidth;bar.style.width=pct(now)+'%';
    if(now>=1&&from<1)bar.classList.add('shine');
  });
  mods.forEach(function(m){
    var card=document.getElementById('m-'+m.key.slice(4));
    if(rm){flash(card,'hl',2600);return;}
    flash(card,'just',1100);
    if(!big){var src=card?(card.querySelector('.mh .pr')||card):anchor;if(src){var q=ctr(src);burst(q.x,q.y,mods.length>1?30:64,{});}else burst(innerWidth/2,innerHeight*.35,64,{});}
  });
  var quota=f.ms.filter(function(m){return m.type==='quota';})[0],rb=$('.ringbox');
  if(rb&&f.snap&&!rm)ringAnim(rb,f.snap.ring);
  if(quota&&rb){
    if(rm){flash(rb,'hl',2600);flash($('.hero'),'hl',2600);}
    else{flash(rb,'pulse',1100);if(!big){var qc=ctr(rb);burst(qc.x,qc.y,44,{shape:'star',spread:Math.PI*2,speed:260,g:300,size:10,life:.9});}}
  }
  if(big){
    banner(big);rain(LOW?55:90);if(!rm&&!LOW){burst(40,innerHeight-30,22,{spread:1,speed:620});burst(innerWidth-40,innerHeight-30,22,{spread:1,speed:620});}
    tick(true);return;
  }
  var rank=f.ms.filter(function(m){return m.type==='rank';})[0],msg=null;
  if(mods.length){msg=mods.length>1?mods.length+' modules cleared. Keep going.':varied('mod',MOD_MSG);}
  else if(quota){msg=varied('quota',QUOTA_MSG);}
  else if(rank){msg='Rank up: '+rank.label;}
  if(msg){toast(msg,f.undo);fxToast=true;tick(true);}
}
function previewFx(){
  if(!S.celeb){toast('Switch Celebrations on to preview them');return;}
  banner({eyebrow:'Preview',title:'Celebrations are on',sub:'This is what a milestone looks like.',also:[]});
  rain(LOW?55:90);tick(true);
}

/* ---------- ui state ---------- */
var TABS=['today','plan','path','prac','exam'];
var NAV=[['today','Today','today'],['plan','Plan','plan'],['path','Modules','path'],['prac','Practice','prac'],['exam','Exam','exam']];
var tab=(function(){var h=(location.hash||'').replace('#','');if(h==='dash')h='today';return TABS.indexOf(h)>=0?h:'today';})();
var F={filter:'all',q:'',rq:'',rt:'All',rfav:false,ptab:'road'};
var toastT=null,undoFn=null,lastResetTap=0,lastDay=ymd(todayD());

function ring(p,size,stroke,color){
  var r=(size-stroke)/2,c=2*Math.PI*r,off=c*(1-Math.max(0,Math.min(1,p)));
  return '<svg viewBox="0 0 '+size+' '+size+'"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--ring-track)" stroke-width="'+stroke+'"/><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+(color||'var(--accent)')+'" stroke-width="'+stroke+'" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" style="transition:stroke-dashoffset .5s ease"/></svg>';
}
function secRow(x,idp){
  var on=!!S.done[x.s.id];
  return '<div class="dr'+(on?' done':'')+'"><input class="cb" type="checkbox" id="'+idp+x.s.id+'" data-act="sec" data-id="'+x.s.id+'"'+(on?' checked':'')+' aria-label="'+esc(x.s.t)+'"><label for="'+idp+x.s.id+'"><b>'+esc(x.s.t)+'</b><small><span class="chip'+(x.m.stage===0?' cy':' acc')+'">'+x.m.label+'</span> '+esc(x.m.name)+' · '+x.s.n+'/'+x.m.secs.length+(x.s.h?' · '+esc(x.s.h):'')+'</small></label></div>';
}

/* ---------- Today ---------- */
function viewToday(){
  var E=engine(),c=doneDates(),h='';
  var pctAll=E.total?E.done/E.total:0;
  h+='<div class="top"><div><div class="eyebrow">'+esc(fmtFull(E.t))+'</div><h1>'+(E.notStarted?'Your plan starts '+fmt(E.start):'Day '+E.dayNo+' · Today')+'</h1></div><div class="chips"><span class="chip acc" title="Your rank follows how much of the SOC Analyst path is done">Rank · '+esc(rankInfo().name)+'</span><button class="btn sm" data-act="share">'+ICON.share+'Share progress</button></div></div>';

  // mission
  var items=E.doneToday.concat(E.todayItems),dn=E.doneToday.length,quota=Math.max(E.quota,dn);
  var allDone=!E.rem.length&&!E.doneToday.length,restDay=!allDone&&!E.todayIsSlot&&!items.length,heroDone=allDone||(!restDay&&quota>0&&dn>=quota);
  h+='<section class="hero'+(heroDone?' done':'')+'"><div style="min-width:0">';
  if(!E.rem.length&&!E.doneToday.length){
    h+='<div class="eyebrow">All sections done</div><h2>The whole plan is complete.</h2><p class="hint">Keep reviewing, then go through the readiness checklist on the Exam tab.</p><div class="acts"><button class="btn primary" data-act="tab" data-id="exam">Open Exam tab</button></div>';
  }else if(!E.todayIsSlot&&!items.length){
    var nx=E.rem[0];
    h+='<div class="eyebrow">'+(E.notStarted?'Not started yet':E.overdue?'Past your target date':'Rest day')+'</div><h2>'+(E.overdue?'You are past the target date.':E.notStarted?'Starts on '+fmtL(E.start):'Nothing planned today.')+'</h2>'
     +'<p class="hint">'+(E.overdue?'Pick a later finish in Plan or Settings. Meanwhile the plan keeps going at '+EXT_PER+' sections per study day.':'Optional: get ahead by one section.')+'</p>'
     +(nx?'<div class="acts"><button class="btn primary" data-act="heroDone" data-id="'+nx.s.id+'">Do: '+esc(nx.s.t)+'</button><button class="btn" data-act="goto" data-id="'+nx.m.id+'">Open module</button></div>':'');
  }else{
    h+='<div class="eyebrow">'+(heroDone?'✓ Mission complete':'Today\'s mission')+'</div><h2>'+(heroDone?'Quota cleared. Nice work.':(quota-dn)+' more section'+((quota-dn)===1?'':'s')+' to stay on plan')+'</h2><p class="hint">'+dn+' of '+quota+' done. '+planLine(E)+'</p><div class="acts"><button class="btn" data-act="tab" data-id="plan">See the full plan</button></div>';
  }
  h+='</div><div class="ringbox">'+ring(quota?Math.min(1,dn/quota):pctAll,148,12)+'<div class="c"><b>'+(quota?dn+'/'+quota:pct(pctAll)+'%')+'</b><span>'+(quota?'today':'overall')+'</span></div></div></section>';
  if(items.length){
    h+='<section class="card"><h3>Today\'s sections</h3><div class="dlist">'+items.map(function(x){return secRow(x,'c-');}).join('')+'</div></section>';
  }

  // focus + review
  h+='<div class="grid2">'+timerCard()+reviewCard()+'</div>';

  // tiles
  var st=streakNow(c),best=bestStreak(c),wkMin=sumDays(S.focus,7);
  var paceMain=E.notStarted?'—':(E.ahead>=0?'+'+E.ahead:String(E.ahead));
  h+='<div class="tiles"><div class="tile"><b>'+st+'<small style="font-size:14px;font-weight:600"> day'+(st===1?'':'s')+'</small></b><span>Streak <span class="chip acc" style="margin-left:6px">'+esc(rankInfo().name)+'</span></span><small>Best '+best+'. Rest days do not break it</small></div>'
   +'<div class="tile"><b>'+fmtMin(S.focus[E.tk]||0)+'</b><span>Focused today</span><small>'+fmtMin(wkMin)+' in 7 days</small></div>'
   +'<div class="tile"><b class="'+(E.ahead<0?'warnt':'good')+'">'+paceMain+'</b><span>Pace</span><small>sections '+(E.ahead<0?'behind':'ahead of')+' the ideal line</small></div>'
   +'<div class="tile"><b style="font-size:20px;padding:3px 0">'+(E.end?fmt(E.end):(E.rem.length?'—':'Done'))+'</b><span>Forecast finish</span><small>Target '+fmt(E.deadline)+'</small></div></div>';

  // stage progress
  var s0=stageStat(0),s1=stageStat(1);
  h+='<div class="grid2"><section class="card"><h3>Progress</h3><div class="stagebar"><div class="sb"><div class="l"><b>Stage 0 · Basics</b><span>'+s0.done+' / '+s0.total+'</span></div><div class="bar cy"><i style="width:'+pct(s0.pct)+'%"></i></div></div><div class="sb"><div class="l"><b>Stage 1 · SOC Analyst path</b><span>'+s1.done+' / '+s1.total+'</span></div><div class="bar"><i style="width:'+pct(s1.pct)+'%"></i></div></div>';
  var phases=[];STAGE1.forEach(function(m){if(phases.indexOf(m.phase)<0)phases.push(m.phase);});
  phases.forEach(function(p){var d=0,t=0;STAGE1.forEach(function(m){if(m.phase===p){var x=modStat(m);d+=x.done;t+=x.total;}});h+='<div class="sb"><div class="l"><span style="font-family:var(--f-body)">'+esc(p)+'</span><span>'+d+' / '+t+'</span></div><div class="bar" style="height:5px"><i style="width:'+pct(t?d/t:0)+'%"></i></div></div>';});
  h+='</div><p class="note" style="margin-top:14px">HTB needs the SOC Analyst path at 100% before the CDSA exam. The basics are optional; skip modules you already know.</p></section>';

  // last 7 days chart
  var mx=1,bars=[];for(var i=6;i>=0;i--){var d=addDays(E.t,-i),n=c[ymd(d)]||0;if(n>mx)mx=n;bars.push({d:d,n:n,today:i===0,min:S.focus[ymd(d)]||0});}
  h+='<section class="card"><h3>Last 7 days</h3><div class="wk">'+bars.map(function(b){return '<div class="wc'+(b.today?' td':'')+'"><span class="wn mono">'+b.n+'</span><div class="wb"><i style="height:'+(b.n?Math.max(6,Math.round(b.n/mx*100)):2)+'%"></i></div><span class="wd">'+b.d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3)+'</span><span class="wm mono">'+(b.min?fmtMin(b.min):'')+'</span></div>';}).join('')+'</div><p class="note" style="margin-top:12px">Sections finished per day, with focused time underneath.</p></section></div>';

  // heatmap
  var dow=E.t.getDay(),weeks=18,firstD=addDays(E.t,-(weeks-1)*7-dow),cells='';
  for(var j=0;j<weeks*7;j++){var dd=addDays(firstD,j);if(dd>E.t){cells+='<i style="visibility:hidden"></i>';continue;}var n2=c[ymd(dd)]||0,lv=n2===0?'':n2<=2?'l1':n2<=4?'l2':n2<=7?'l3':'l4';cells+='<i class="'+lv+(ymd(dd)===E.tk?' today':'')+'" title="'+fmtL(dd)+': '+n2+' section'+(n2===1?'':'s')+'"></i>';}
  h+='<section class="card"><h3>Activity, last '+weeks+' weeks</h3><div class="heatwrap"><div class="heat">'+cells+'</div></div></section>';

  // badges
  h+='<section class="card"><h3>Milestones</h3><div class="badges">'+BADGES.map(function(b){var on=S.badges[b[0]];return '<span class="bdg'+(on?' on':'')+'" title="'+(on?'Earned '+esc(on):'Locked')+'">'+(on?'✓ ':'')+esc(b[1])+'</span>';}).join('')+'</div></section>';
  return h;
}
function planLine(E){
  if(E.notStarted)return '';
  if(E.overdue)return 'Past the target date.';
  var left=E.rem.length;
  return left+' section'+(left===1?'':'s')+' left, '+E.slotsLeft+' study day'+(E.slotsLeft===1?'':'s')+' until '+fmt(E.deadline)+'.';
}
function timerCard(){
  var tk=ymd(todayD()),run=S.timer&&S.timer.end>Date.now();
  var h='<section class="card"><h3>Focus timer</h3>';
  if(run){h+='<div class="tm mono" id="tm">'+clockLeft()+'</div><p class="note" style="margin:6px 0 12px">Session running. It keeps going if you reload.</p><div class="row-btn"><button class="btn" data-act="timerStop">Stop and log elapsed time</button></div>';}
  else{h+='<div class="tm mono" id="tm">'+fmtMin(S.focus[tk]||0)+'</div><p class="note" style="margin:6px 0 12px">focused today. Start a session, or log time you spent in a lab.</p><div class="row-btn"><button class="btn primary sm" data-act="timerStart" data-id="25">25 min</button><button class="btn sm" data-act="timerStart" data-id="50">50 min</button><button class="btn sm" data-act="timerStart" data-id="90">90 min</button><button class="btn sm ghost" data-act="logMin" data-id="15">+15m</button><button class="btn sm ghost" data-act="logMin" data-id="30">+30m</button></div>';}
  return h+'</section>';
}
function clockLeft(){var ms=Math.max(0,S.timer.end-Date.now()),s=Math.ceil(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60);}
function reviewCard(){
  var due=reviewsDue(),h='<section class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><h3 style="margin:0">Review queue</h3><span class="chip '+(due.length?'am':'')+'">'+due.length+' due</span></div>';
  if(!due.length){h+='<p class="note" style="margin-top:10px">Nothing to review right now. Each section you finish comes back after 1, 3, 7, 14 and 30 days so it sticks. Try to recall it before you check.</p></section>';return h;}
  h+='<p class="note" style="margin:10px 0 4px">Say the key idea from memory, then check yourself.</p>';
  due.slice(0,3).forEach(function(x){
    h+='<div class="rv"><div class="rvn"><b>'+esc(x.s.t)+'</b><small>'+esc(x.s.m.name)+'</small>'+(x.s.h?'<details><summary>Show the key idea</summary><p>'+esc(x.s.h)+'</p></details>':'')+'</div><div class="rvb"><button class="btn sm primary" data-act="rev" data-id="'+x.id+'" data-v="1">Got it</button><button class="btn sm" data-act="rev" data-id="'+x.id+'" data-v="0">Forgot</button></div></div>';
  });
  if(due.length>3)h+='<p class="note" style="margin-top:8px">+'+(due.length-3)+' more after these.</p>';
  return h+'</section>';
}

/* ---------- Plan ---------- */
var PRESETS=[30,50,80,120,155];
function dayCard(row,E){
  var key=row.key,items=row.items,n=0;items.forEach(function(x){if(S.done[x.s.id])n++;});
  var kind=row.kind,done=items.length>0&&n===items.length&&kind!=='future';
  var open=S.dopen[key]!==undefined?!!S.dopen[key]:kind==='today';
  var mods=[];items.forEach(function(x){if(mods.indexOf(x.m.name)<0)mods.push(x.m.name);});
  var sub=mods.length?mods.join(', '):(row.missed?'No sections logged':'Rest');
  var dayNo=diffDays(row.date,E.start)+1;
  var h='<article class="day'+(done?' done':'')+(kind==='today'?' today':'')+(row.missed?' missed':'')+'" id="d-'+key+'"><button class="dh" data-act="dayToggle" data-id="'+key+'" aria-expanded="'+open+'"><span class="dn mono">'+(done?'✓':dayNo)+'</span><span class="t"><b>'+fmtL(row.date)+'</b><small>'+esc(sub)+'</small></span>'
    +(kind==='today'?'<span class="chip acc">Today</span>':'')+(row.missed?'<span class="chip am">Missed</span>':'')
    +'<span class="mono cnt">'+(kind==='future'?items.length+' to do':n+'/'+items.length)+'</span>'+ICON.chev+'</button>';
  if(open){
    h+='<div class="db">';
    if(!items.length)h+='<p class="note" style="padding:10px 0">Nothing logged for this day.</p>';
    items.forEach(function(x){h+=secRow(x,'c-');});
    h+='<div class="dfoot"><textarea data-act="dnote" data-id="'+key+'" placeholder="Notes for this day: queries, event IDs, IoCs, things to revisit" aria-label="Notes for '+fmtL(row.date)+'">'+esc(S.dnotes[key]||'')+'</textarea>'
      +(kind!=='past'&&items.length?'<button class="btn sm" data-act="dayAll" data-id="'+key+'">'+(done?'Clear this day':'Mark day done')+'</button>':'')+'</div></div>';
  }
  return h+'</article>';
}
function viewPlan(){
  var E=engine();
  var h='<div class="top"><div><div class="eyebrow">Adapts to you</div><h1>Day-by-day plan</h1><p>Your plan starts the day you first opened this page and re-plans every day from what is left. Fall behind and the next days get a bit heavier; get ahead and they lighten.</p></div></div>';
  h+='<section class="card"><span class="note" style="display:block;margin-bottom:8px;font-weight:600">Finish the whole plan in</span><div class="pills">'
    +PRESETS.map(function(T){var on=!S.exam&&S.target===T;return '<button class="pill" data-act="preset" data-id="'+T+'" aria-pressed="'+on+'">'+T+' days</button>';}).join('')
    +'</div><p class="note" style="margin-top:12px">'+(S.exam?'Aiming to finish by '+fmtL(E.deadline)+', a week before your exam on '+fmtL(parse(S.exam))+'.':'Target finish: '+fmtL(E.deadline)+'.')+' Study days: '+S.days.slice().sort(function(a,b){return ((a+6)%7)-((b+6)%7);}).map(function(d){return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d];}).join(', ')+'. <button class="btn sm ghost" data-act="settings" style="display:inline-flex;min-height:0;padding:0 4px">Change in settings</button></p></section>';
  var hist=history(E),rows=hist.slice();
  var todayItems=E.doneToday.concat(E.todayItems);
  if(E.todayIsSlot||todayItems.length)rows.push({key:E.tk,date:E.t,items:todayItems,kind:'today'});
  E.days.forEach(function(d){rows.push({key:ymd(d.date),date:d.date,items:d.items,kind:'future'});});
  var pastMiss=0;hist.forEach(function(r){if(r.missed)pastMiss++;});
  h+='<div class="tiles"><div class="tile"><b>'+(E.notStarted?'—':'Day '+E.dayNo)+'</b><span>Today</span><small>of '+(diffDays(E.deadline,E.start)+1)+' to target</small></div>'
    +'<div class="tile"><b>'+E.done+' / '+E.total+'</b><span>Sections done</span></div>'
    +'<div class="tile"><b>'+E.quota+'</b><span>Per study day now</span><small>'+(E.ahead<0?'catching up':'on the current plan')+'</small></div>'
    +'<div class="tile"><b style="font-size:20px;padding:3px 0">'+(E.end?fmt(E.end):'Done')+'</b><span>Forecast finish</span><small>'+pastMiss+' missed day'+(pastMiss===1?'':'s')+' so far</small></div></div>';
  h+='<div class="tools"><button class="btn primary sm" data-act="jumpToday">Jump to today</button><button class="pill" data-act="hideDone" aria-pressed="'+S.hideDone+'">Hide past days</button><div class="pills" style="margin-left:auto"><button class="btn sm" data-act="dayExpand">Expand all</button><button class="btn sm" data-act="dayCollapse">Collapse all</button></div></div>';
  var startWk=weekStart(E.start),cur=null,body='',head='',wc=0,shown=0;
  function flush(){if(body){h+='<section class="weekgrp"><div class="wkh"><b>'+head+'</b><span class="mono">'+wc+' section'+(wc===1?'':'s')+'</span></div>'+body+'</section>';}body='';wc=0;}
  rows.forEach(function(r){
    if(S.hideDone&&r.kind==='past')return;
    var ws=weekStart(r.date),k=ymd(ws);
    if(k!==cur){flush();cur=k;head='Week '+(Math.floor(diffDays(ws,startWk)/7)+1)+' · '+fmt(ws)+' – '+fmt(addDays(ws,6));}
    wc+=r.items.length;body+=dayCard(r,E);shown++;
  });
  flush();
  if(!shown)h+='<div class="card empty">Nothing to show.</div>';
  return h;
}
function scrollToday(){
  var E=engine(),key=E.tk;
  if(!document.getElementById('d-'+key))key=E.days.length?ymd(E.days[0].date):null;
  var el=key?document.getElementById('d-'+key):null;
  if(el)el.scrollIntoView({block:'start'});
}

/* ---------- Modules ---------- */
function viewPath(){
  var h='<div class="top"><div><div class="eyebrow">'+MODS.reduce(function(n,m){return n+m.secs.length;},0)+' sections · '+MODS.length+' modules</div><h1>Modules</h1><p>Basics first, then the 15 SOC Analyst modules in a sensible order. Tick each section as you finish it on Academy.</p></div></div>';
  h+='<div class="tools"><input class="search" type="search" id="q" placeholder="Search modules and sections" value="'+esc(F.q)+'" aria-label="Search modules and sections"><div class="pills" id="pills">'
    +[['all','All'],['doing','In progress'],['todo','Not started'],['done','Done'],['flag','Bookmarked']].map(function(p){return '<button class="pill" data-act="filter" data-id="'+p[0]+'" aria-pressed="'+(F.filter===p[0])+'">'+p[1]+'</button>';}).join('')
    +'</div><div class="pills"><button class="btn sm" data-act="expandAll">Expand all</button><button class="btn sm" data-act="collapseAll">Collapse all</button></div></div>';
  return h+'<div id="plist" class="wrap" style="gap:26px"></div>';
}
function matchMod(m){
  var x=modStat(m),q=F.q.trim().toLowerCase();
  if(F.filter==='doing'&&!(x.done>0&&x.done<x.total))return null;
  if(F.filter==='todo'&&x.done!==0)return null;
  if(F.filter==='done'&&x.done!==x.total)return null;
  var secs=m.secs;
  if(F.filter==='flag'){secs=secs.filter(function(s){return S.flag[s.id];});if(!secs.length)return null;}
  if(q&&m.name.toLowerCase().indexOf(q)<0){secs=secs.filter(function(s){return s.t.toLowerCase().indexOf(q)>=0||s.h.toLowerCase().indexOf(q)>=0;});if(!secs.length)return null;}
  return secs;
}
function modCard(m,secs,E){
  var x=modStat(m),open=!!S.open[m.id]||(F.q.trim()&&secs.length<m.secs.length),tg=E.modTarget[m.id];
  var h='<article class="mod'+(open?' open':'')+(x.done===x.total?' done':'')+(x.skipped?' skipped':'')+'" id="m-'+m.id+'">';
  h+='<button class="mh" data-act="toggleMod" data-id="'+m.id+'" aria-expanded="'+(!!open)+'"><span class="idx">'+(x.done===x.total?'✓':m.label)+'</span><span class="t"><b>'+esc(m.name)+'</b><span class="meta"><span class="chip">'+m.diff+'</span>';
  if(m.stage===0)h+='<span class="chip '+(m.tier==='Core'?'acc':m.tier==='Skim'?'cy':'am')+'">'+m.tier+'</span>';
  if(x.skipped)h+='<span class="chip">Skipped</span>';else if(tg&&x.done<x.total)h+='<span class="chip">Forecast '+fmt(tg)+'</span>';
  h+='</span></span><span class="pr"><span>'+x.done+'/'+x.total+'</span><span class="bar"><i style="width:'+pct(x.pct)+'%"></i></span></span>'+ICON.chev+'</button>';
  if(open){
    h+='<div class="mb"><div class="mb-top"><a class="btn sm primary" href="'+m.link+'" target="_blank" rel="noopener">Open on Academy '+ICON.ext+'</a><button class="btn sm" data-act="markAll" data-id="'+m.id+'">Mark all done</button><button class="btn sm" data-act="clearAll" data-id="'+m.id+'">Clear</button>'+(m.stage===0?'<button class="btn sm ghost" data-act="skip" data-id="'+m.id+'">'+(x.skipped?'Include in plan':'Skip this module')+'</button>':'')+'</div><div class="secs">';
    secs.forEach(function(s){
      var dn=S.done[s.id],fl=S.flag[s.id];
      h+='<div class="sec'+(dn?' done':'')+'"><input class="cb" type="checkbox" id="m-c-'+s.id+'" data-act="sec" data-id="'+s.id+'"'+(dn?' checked':'')+' aria-label="'+esc(s.t)+'"><label class="tx" for="m-c-'+s.id+'"><b><span class="no">'+pad(s.n)+'</span>'+esc(s.t)+'</b>'+(s.h?'<small>'+esc(s.h)+'</small>':'')+'</label>'
        +(isDate(dn)?'<span class="d">'+fmt(parse(dn))+'</span>':'')+'<button class="flag'+(fl?' on':'')+'" data-act="flag" data-id="'+s.id+'" aria-pressed="'+(!!fl)+'" title="Bookmark to revisit" aria-label="Bookmark to revisit">'+ICON.flag+'</button></div>';
    });
    h+='</div>'+probBlock(m)+'<div class="guide"><div><h4>Why it matters</h4><p>'+esc(m.why)+'</p></div><div><h4>What you will learn</h4><ul>'+m.learn.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div><div><h4>Practice alongside</h4><ul>'+m.practice.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div><div><h4>You are ready to move on when you can</h4><ul>'+m.can.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div><div class="note-box"><h4>My notes and where I got stuck</h4><textarea data-act="note" data-id="'+m.id+'" placeholder="Queries, event IDs, commands, things to revisit" aria-label="Notes for '+esc(m.name)+'">'+esc(S.notes[m.id]||'')+'</textarea></div></div></div>';
  }
  return h+'</article>';
}
function renderList(){
  var el=$('#plist');if(!el)return;
  var E=engine(),h='',any=false;
  [0,1].forEach(function(stage){
    var s=stageStat(stage),body='',lastPhase=null;
    MODS.forEach(function(m){
      if(m.stage!==stage)return;var secs=matchMod(m);if(!secs)return;
      if(m.phase!==lastPhase){body+='<div class="phase">'+esc(m.phase)+'</div>';lastPhase=m.phase;}
      body+=modCard(m,secs,E);any=true;
    });
    if(!body)return;
    h+='<section class="stage"><div class="stage-h s'+stage+'"><span class="no">'+stage+'</span><div><h2>'+(stage===0?'Stage 0 · Basics':'Stage 1 · SOC Analyst path')+'</h2><p>'+(stage===0?'The Academy prerequisites path. Not required for the exam, but it makes everything after it easier.':'Required for the CDSA exam. Detecting Windows Attacks with Splunk sits right after Windows Attacks & Defense here; Academy lists it later.')+'</p></div><span class="r">'+s.done+' / '+s.total+'</span></div>'+body+'</section>';
  });
  el.innerHTML=any?h:'<div class="card empty">Nothing matches. Clear the search or pick another filter.</div>';
}


/* ---------- problems after each module ---------- */
function probId(k,i){return 'p.'+k+'.'+i;}
function probStat(m){var L=PROBLEMS[m.id]||[],d=0;L.forEach(function(p,i){if(S.labs[probId(m.id,i)])d++;});return {done:d,total:L.length};}
function probRow(id,p){
  var on=!!S.labs[id],src=SRC[p[1]]||SRC.drill,url=p[5]||'';
  var lv=p[2]?'<span class="chip">'+esc(p[2])+'</span>':'';
  var tag=p[4]==='core'?'<span class="chip acc">Do</span>':'<span class="chip">If time</span>';
  var link=url?'<a class="btn sm" href="'+url+'" target="_blank" rel="noopener">Open '+ICON.ext+'</a>':(src.u?'<a class="btn sm" href="'+src.u+'" target="_blank" rel="noopener">'+esc(src.n)+' '+ICON.ext+'</a>':'');
  return '<div class="crow prob'+(on?' done':'')+'"><label><input class="cb" type="checkbox" data-act="lab" data-id="'+id+'"'+(on?' checked':'')+'><span class="tx"><b>'+esc(p[0])+'</b><small>'+esc(p[3])+'</small><span class="meta">'+tag+(p[1]!=='drill'?'<span class="chip cy">'+esc(src.n)+'</span>':'<span class="chip">Drill</span>')+lv+'</span></span></label>'+link+'</div>';
}
function probBlock(m){
  var L=PROBLEMS[m.id];if(!L||!L.length)return '';
  var x=modStat(m),st=probStat(m),ready=x.done===x.total;
  return '<div class="probs'+(ready?' ready':'')+'"><div class="probs-h"><h4>After this module, do these</h4><span class="mono">'+st.done+'/'+st.total+'</span></div><p class="note">'+(ready?'Module finished. Now prove it on real data.':'Do these once the sections above are done. Reading is not the same as being able to do it.')+'</p><div class="checks">'+L.map(function(p,i){return probRow(probId(m.id,i),p);}).join('')+'</div></div>';
}
function viewRoadmap(){
  var tot=0,dn=0,h='';
  MODS.forEach(function(m){var st=probStat(m);tot+=st.total;dn+=st.done;});
  FINAL_PROBLEMS.forEach(function(p,i){tot++;if(S.labs[probId('final',i)])dn++;});
  h+='<section class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><h3 style="margin:0">Problem roadmap</h3><span class="mono good">'+dn+' / '+tot+'</span></div><div class="bar" style="margin:12px 0 8px"><i style="width:'+pct(tot?dn/tot:0)+'%"></i></div><p class="note">What to do after finishing each module, in path order. Gathered from HTB, CyberDefenders, Splunk BOTS, malware-traffic-analysis.net and people who passed the exam. Check how current each item is before you rely on it: platforms rename labs and move them between free and paid.</p></section>';
  [0,1].forEach(function(stage){
    var body='';
    MODS.forEach(function(m){
      if(m.stage!==stage)return;var L=PROBLEMS[m.id];if(!L)return;var st=probStat(m);
      body+='<details class="rm"'+(modStat(m).done===modStat(m).total&&st.done<st.total?' open':'')+'><summary><span class="idx">'+m.label+'</span><b>'+esc(m.name)+'</b><span class="mono">'+st.done+'/'+st.total+'</span></summary><div class="checks">'+L.map(function(p,i){return probRow(probId(m.id,i),p);}).join('')+'</div></details>';
    });
    h+='<section class="card"><h3>'+(stage===0?'Stage 0 · Basics drills':'Stage 1 · After each SOC module')+'</h3><div class="rmlist">'+body+'</div></section>';
  });
  var fb='';FINAL_PROBLEMS.forEach(function(p,i){fb+=probRow(probId('final',i),p);});
  h+='<section class="card"><h3>Final stage · Exam rehearsal</h3><p class="note" style="margin:-6px 0 8px">Do this after the whole path. It is the closest you get to the real thing.</p><div class="checks">'+fb+'</div></section>';
  h+='<section class="card"><h3>What people who passed said</h3><ul class="tips">'+PASSER_TIPS.map(function(t){return '<li>'+esc(t[0])+'<small>'+esc(t[1])+'</small></li>';}).join('')+'</ul></section>';
  return h;
}

/* ---------- Practice ---------- */
function resList(){
  var q=F.rq.trim().toLowerCase();
  var items=RESOURCES.filter(function(r){
    if(F.rt!=='All'&&r.type!==F.rt)return false;
    if(F.rfav&&!S.fav[r.id])return false;
    if(q&&(r.name+' '+r.desc+' '+r.host+' '+r.type).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  if(!items.length)return '<div class="empty">No resources match.</div>';
  return items.map(function(r){
    return '<div class="res"><button class="star'+(S.fav[r.id]?' on':'')+'" data-act="fav" data-id="'+r.id+'" aria-pressed="'+(!!S.fav[r.id])+'" aria-label="Favourite">'+ICON.star+'</button><a class="n" href="'+r.url+'" target="_blank" rel="noopener"><b>'+esc(r.name)+'</b><small>'+esc(r.desc)+'</small><em>'+esc(r.host)+'</em></a><span class="chip">'+r.type+'</span></div>';
  }).join('');
}
function viewPractice(){
  var h='<div class="top"><div><div class="eyebrow">Hands-on</div><h1>Practice</h1><p>Theory alone will not pass this exam. After each module, do the problems for it.</p></div></div>';
  h+='<div class="pills" style="margin-bottom:14px"><button class="pill" data-act="ptab" data-id="road" aria-pressed="'+(F.ptab!=='lib')+'">Problem roadmap</button><button class="pill" data-act="ptab" data-id="lib" aria-pressed="'+(F.ptab==='lib')+'">Labs and resources</button></div>';
  if(F.ptab!=='lib')return h+viewRoadmap();
  LABS.forEach(function(g){
    h+='<section class="card"><h3>'+esc(g.name)+'</h3>'+(g.blurb?'<p class="note" style="margin:-6px 0 8px">'+esc(g.blurb)+'</p>':'')+'<div class="checks">';
    g.items.forEach(function(it){
      if(it.kind==='count'){
        var n=S.cnt[it.id]||0;
        h+='<div class="crow'+(n>=it.total?' done':'')+'"><div class="tx" style="flex:1;min-width:0"><b>'+esc(it.name)+'</b>'+(it.note?'<small>'+esc(it.note)+'</small>':'')+(it.link?'<small><a href="'+it.link+'" target="_blank" rel="noopener">Open link</a></small>':'')+'</div><div class="count"><button class="btn sm" data-act="cnt" data-id="'+it.id+'" data-d="-1" aria-label="Decrease">−</button><b>'+n+'/'+it.total+'</b><button class="btn sm" data-act="cnt" data-id="'+it.id+'" data-d="1" aria-label="Increase">+</button></div></div>';
      }else{
        var on=!!S.labs[it.id];
        h+='<div class="crow'+(on?' done':'')+'"><label><input class="cb" type="checkbox" data-act="lab" data-id="'+it.id+'"'+(on?' checked':'')+'><span class="tx"><b>'+esc(it.name)+'</b>'+(it.note?'<small>'+esc(it.note)+'</small>':'')+'</span></label>'+(it.link?'<a class="btn sm" href="'+it.link+'" target="_blank" rel="noopener">Open '+ICON.ext+'</a>':'')+'</div>';
      }
    });
    h+='</div></section>';
  });
  h+='<section class="card"><h3>Resources</h3><div class="tools" style="margin-bottom:6px"><input class="search" type="search" id="rq" placeholder="Search resources" value="'+esc(F.rq)+'" aria-label="Search resources"><button class="pill" data-act="rfav" aria-pressed="'+F.rfav+'">Favourites only</button></div><div class="pills" id="rtypes" style="margin-bottom:6px">'
    +RES_TYPES.map(function(t){return '<button class="pill" data-act="rtype" data-id="'+t+'" aria-pressed="'+(F.rt===t)+'">'+t+'</button>';}).join('')+'</div><div id="rlist">'+resList()+'</div></section>';
  h+='<section class="card"><h3>Notes folder layout</h3><p class="note" style="margin:-6px 0 10px">A simple structure for Obsidian or any notes app that works on Windows and Mac.</p><div class="codebox"><pre>'+esc(FOLDER_TPL)+'</pre><button class="btn sm" data-act="copy" data-id="folder">'+ICON.copy+'Copy</button></div></section>';
  return h;
}

/* ---------- Exam ---------- */
function viewExam(){
  var s1=stageStat(1),pathDone=s1.done===s1.total&&s1.total>0,n=0;
  GATE.forEach(function(g){if(g.auto?pathDone:S.gate[g.k])n++;});
  var h='<div class="top"><div><div class="eyebrow">CDSA</div><h1>Exam prep</h1><p>What you need to be ready, what the exam looks like, and the templates to have in place before day one.</p></div></div>';
  h+='<section class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><h3 style="margin:0">Readiness</h3><span class="mono good">'+(n===GATE.length?'✓ Ready to book · ':'')+n+' / '+GATE.length+'</span></div><div class="bar" style="margin:12px 0 6px"><i style="width:'+pct(n/GATE.length)+'%"></i></div><div class="checks">';
  GATE.forEach(function(g){
    var on=g.auto?pathDone:!!S.gate[g.k];
    h+='<div class="crow'+(on?' done':'')+'"><label><input class="cb" type="checkbox" '+(g.auto?'disabled ':'data-act="gate" data-id="'+g.k+'" ')+(on?'checked':'')+'><span class="tx"><b>'+esc(g.t)+'</b>'+(g.auto?'<small>Ticks itself when every SOC Analyst section is done ('+s1.done+' / '+s1.total+').</small>':'')+'</span></label></div>';
  });
  h+='</div></section>';
  h+='<section class="card"><h3>Exam date</h3><div class="grid2" style="gap:14px"><label class="f">Date (optional)<input type="date" id="xDate" value="'+esc(S.exam)+'"></label><p class="note" style="align-self:end">'+(S.exam?'Your plan now aims to finish a week before this date. '+countdown(S.exam):'Set it once you have a date and the plan works backwards from it.')+'</p></div></section>';
  h+='<div class="tiles">'+EXAM_FACTS.map(function(f){return '<div class="tile"><b>'+f[0]+'</b><span>'+f[1]+'</span></div>';}).join('')+'</div>';
  h+='<section class="card"><h3>What to know about the exam</h3><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">'+EXAM_NOTES.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></section>';
  h+='<div class="grid2"><section class="card"><h3>Timeline template</h3><p class="note" style="margin:-6px 0 10px">Start it in the first minute and add a row for every finding.</p><div class="codebox"><pre>'+esc(TIMELINE_TPL)+'</pre><button class="btn sm" data-act="copy" data-id="timeline">'+ICON.copy+'Copy</button></div></section><section class="card"><h3>Report outline</h3><p class="note" style="margin:-6px 0 10px">The report decides the result. Write it while you investigate.</p><div class="codebox"><pre>'+esc(REPORT_TPL)+'</pre><button class="btn sm" data-act="copy" data-id="report">'+ICON.copy+'Copy</button></div></section></div>';
  h+='<section class="card"><h3>If I see this, I check that</h3><div class="evs">'+EVENTS.map(function(e){return '<div class="ev"><b>'+esc(e[0])+'</b><span class="mono">'+esc(e[1])+'</span><small>'+esc(e[2])+'</small></div>';}).join('')+'</div></section>';
  return h;
}
function countdown(d){var n=diffDays(parse(d),todayD());return n>0?n+' day'+(n===1?'':'s')+' to go.':n===0?'The exam is today.':'That date has passed.';}

/* ---------- render ---------- */
var TITLES={today:'Today',plan:'Day-by-day plan',path:'Modules',prac:'Practice',exam:'Exam prep'};
function chrome(){
  var nav='';NAV.forEach(function(n){nav+='<button data-act="tab" data-id="'+n[0]+'"'+(tab===n[0]?' aria-current="page"':'')+'>'+ICON[n[2]]+'<span>'+n[1]+'</span></button>';});
  $('#nav').innerHTML=nav;$('#bnav').innerHTML=nav;
  var s0=stageStat(0),s1=stageStat(1),ri=rankInfo(),stk=streakNow(doneDates()),sl='SOC path '+pct(ri.p)+'% complete';
  $('#rankcard').innerHTML=shield(ri.p,'shS','shield',sl)+'<div class="rk"><span class="eyebrow">Rank</span><span class="nm">'+esc(ri.name)+'</span><small>Streak '+stk+' day'+(stk===1?'':'s')+'</small><small>'+(ri.next?'Next: '+esc(ri.next)+' at '+pct(ri.nextAt)+'% of SOC':'SOC path complete')+'</small></div>';
  $('#mrank').innerHTML=shield(ri.p,'shM','shield',sl)+'<span class="nm">'+esc(ri.name)+'</span>';
  $('#mini').innerHTML='<div class="row"><span>Basics</span><b>'+s0.done+'/'+s0.total+'</b></div><div class="bar cy" style="margin-bottom:10px"><i style="width:'+pct(s0.pct)+'%"></i></div><div class="row"><span>SOC Analyst</span><b>'+s1.done+'/'+s1.total+'</b></div><div class="bar"><i style="width:'+pct(s1.pct)+'%"></i></div>';
}
function render(){
  var y=window.scrollY,ae=document.activeElement,fk=null;
  if(ae&&ae.dataset&&ae.dataset.act&&ae.dataset.id&&ae.tagName!=='TEXTAREA'&&ae.type!=='search')fk=[ae.dataset.act,ae.dataset.id,ae.id];
  var map={today:viewToday,plan:viewPlan,path:viewPath,prac:viewPractice,exam:viewExam};
  $('#view').innerHTML=map[tab]();
  if(tab==='path')renderList();
  chrome();
  document.title=TITLES[tab]+' · CDSA Study Tracker';
  window.scrollTo(0,y);
  if(fk){var e=fk[2]?document.getElementById(fk[2]):null;if(!e)e=document.querySelector('[data-act="'+fk[0]+'"][data-id="'+fk[1]+'"]');if(e)try{e.focus({preventScroll:true});}catch(x){}}
  playFx();
}
function applyTheme(){var r=document.documentElement;if(S.theme==='light'||S.theme==='dark')r.setAttribute('data-theme',S.theme);else r.removeAttribute('data-theme');}

/* ---------- actions ---------- */
function toast(msg,undo){
  var t=$('#toast');t.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button data-act="undo">Undo</button>':'');
  undoFn=undo||null;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on');undoFn=null;},undo?6000:2600);
}
function setSec(id,val){
  if(val){S.done[id]=ymd(todayD());if(!S.rev[id])S.rev[id]={st:0,due:ymd(addDays(todayD(),REVIEW_DAYS[0]))};}
  else{delete S.done[id];delete S.rev[id];}
}
function copyText(txt,label){
  function fb(){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}ta.remove();toast(ok?label+' copied':'Select and copy manually');}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){toast(label+' copied');},fb);}else fb();
}
var TPL={folder:FOLDER_TPL,timeline:TIMELINE_TPL,report:REPORT_TPL};
function go(t){tab=t;try{history.replaceState(null,'','#'+t);}catch(e){}render();window.scrollTo(0,0);if(t==='plan')setTimeout(scrollToday,0);}

/* timer */
var tmI=null;
function startTick(){clearInterval(tmI);tmI=setInterval(function(){
  var el=$('#tm');
  if(S.timer){if(S.timer.end<=Date.now()){finishTimer(true,true);}else if(el)el.textContent=clockLeft();}
},1000);}
function addFocus(min){var k=ymd(todayD());S.focus[k]=(S.focus[k]||0)+min;}
function finishTimer(complete,auto){
  if(!S.timer)return;var len=S.timer.len,mins=complete?len:Math.max(0,Math.round((len*60000-Math.max(0,S.timer.end-Date.now()))/60000));
  S.timer=null;if(mins>0)addFocus(mins);after({defer:!!auto});render();toast(complete?'Session done: '+len+' minutes logged':mins+' minutes logged');
}

function onAction(el){
  var a=el.dataset.act,id=el.dataset.id;
  switch(a){
    case 'tab':go(id);break;
    case 'goto':S.open[id]=1;F.filter='all';F.q='';tab='path';save();render();var t=document.getElementById('m-'+id);if(t)t.scrollIntoView({block:'start'});break;
    case 'heroDone':{var sn=takeSnap(),undoHero=function(){setSec(id,false);save();render();};setSec(id,true);after({snap:sn,tick:{id:id,on:true,kind:'sec'},undo:undoHero});render();if(!fxToast)toast('Marked done',undoHero);break;}
    case 'undo':if(undoFn){var f=undoFn;undoFn=null;f();$('#toast').classList.remove('on');}break;
    case 'toggleMod':if(S.open[id])delete S.open[id];else S.open[id]=1;save();renderList();break;
    case 'expandAll':MODS.forEach(function(m){S.open[m.id]=1;});save();renderList();break;
    case 'collapseAll':S.open={};F.q='';var q=$('#q');if(q)q.value='';save();renderList();break;
    case 'filter':F.filter=id;[].forEach.call(document.querySelectorAll('#pills .pill'),function(b){b.setAttribute('aria-pressed',b.dataset.id===id);});renderList();break;
    case 'markAll':{var snM=takeSnap();BY[id].secs.forEach(function(s){if(!S.done[s.id])setSec(s.id,true);});after({snap:snM});render();break;}
    case 'clearAll':BY[id].secs.forEach(function(s){setSec(s.id,false);});save();render();break;
    case 'skip':if(S.skip[id])delete S.skip[id];else S.skip[id]=1;save();render();break;
    case 'flag':if(S.flag[id])delete S.flag[id];else S.flag[id]=1;save();renderList();break;
    case 'cnt':{var it=null;LABS.forEach(function(g){g.items.forEach(function(x){if(x.id===id)it=x;});});S.cnt[id]=Math.max(0,Math.min(it.total,(S.cnt[id]||0)+(+el.dataset.d)));save();render();break;}
    case 'copy':copyText(TPL[id],'Template');break;
    case 'preset':S.target=+id;S.exam='';save();render();break;
    case 'hideDone':S.hideDone=!S.hideDone;save();render();break;
    case 'dayToggle':{var E=engine();var def0=(id===E.tk);var cur=S.dopen[id]!==undefined?!!S.dopen[id]:def0;S.dopen[id]=!cur;save();render();break;}
    case 'dayExpand':{var E1=engine(),r1=history(E1);r1.forEach(function(r){S.dopen[r.key]=true;});S.dopen[E1.tk]=true;E1.days.forEach(function(d){S.dopen[ymd(d.date)]=true;});save();render();break;}
    case 'dayCollapse':{var E2=engine(),r2=history(E2);r2.forEach(function(r){S.dopen[r.key]=false;});S.dopen[E2.tk]=false;E2.days.forEach(function(d){S.dopen[ymd(d.date)]=false;});save();render();break;}
    case 'dayAll':{var E3=engine(),items=null;
      if(id===E3.tk)items=E3.doneToday.concat(E3.todayItems);else E3.days.forEach(function(d){if(ymd(d.date)===id)items=d.items;});
      if(items){var snD=takeSnap(),all=items.every(function(x){return S.done[x.s.id];});items.forEach(function(x){if(all)setSec(x.s.id,false);else if(!S.done[x.s.id])setSec(x.s.id,true);});after({snap:snD});render();}break;}
    case 'jumpToday':{if(S.hideDone){S.hideDone=false;save();render();}scrollToday();break;}
    case 'fav':if(S.fav[id])delete S.fav[id];else S.fav[id]=1;save();{var rl=$('#rlist');if(rl)rl.innerHTML=resList();}break;
    case 'ptab':F.ptab=id;render();break;
    case 'rfav':F.rfav=!F.rfav;el.setAttribute('aria-pressed',F.rfav);$('#rlist').innerHTML=resList();break;
    case 'rtype':F.rt=id;[].forEach.call(document.querySelectorAll('#rtypes .pill'),function(b){b.setAttribute('aria-pressed',b.dataset.id===id);});$('#rlist').innerHTML=resList();break;
    case 'rev':{var r=S.rev[id];if(!r)break;if(el.dataset.v==='1'){S.revN++;var ns=r.st+1;if(ns>=REVIEW_DAYS.length)delete S.rev[id];else S.rev[id]={st:ns,due:ymd(addDays(todayD(),REVIEW_DAYS[ns]))};}else S.rev[id]={st:0,due:ymd(addDays(todayD(),1))};after();render();break;}
    case 'timerStart':S.timer={end:Date.now()+(+id)*60000,len:+id};save();render();startTick();break;
    case 'timerStop':finishTimer(false);break;
    case 'logMin':addFocus(+id);after();render();toast('Logged '+id+' minutes');break;
    case 'share':openShare();break;
    case 'settings':openSettings();break;
    case 'close':closeDlg();break;
    case 'day':{var dn=+el.dataset.d,i=S.days.indexOf(dn);if(i>=0){if(S.days.length>1)S.days.splice(i,1);}else S.days.push(dn);save();openSettings(true);render();break;}
    case 'theme':S.theme=el.dataset.v;applyTheme();save();openSettings(true);break;
    case 'celeb':S.celeb=!S.celeb;save();openSettings(true);break;
    case 'sound':S.sound=!S.sound;save();openSettings(true);tick(false);break;
    case 'celebTest':previewFx();break;
    case 'achClose':$('#ach').classList.remove('on');clearTimeout(achT);break;
    case 'markDone':{var n=0;[].forEach.call(document.querySelectorAll('#prior input:checked'),function(c){BY[c.value].secs.forEach(function(s){if(!S.done[s.id]){S.done[s.id]='x';n++;}});});after({silent:true});render();openSettings(true);toast(n+' sections marked done');break;}
    case 'startToday':S.start=ymd(todayD());save();render();openSettings(true);break;
    case 'export':doExport();break;
    case 'copyBackup':copyText(JSON.stringify(S),'Backup');break;
    case 'doImport':try{var o=JSON.parse($('#impText').value);S=norm(o,false);if(!S.start)S.start=ymd(todayD());FX=null;pStop();awardBadges();sealCel();save();applyTheme();render();closeDlg();toast('Backup imported');}catch(err){toast('That is not a valid backup');}break;
    case 'reset':{var now=Date.now();if(now-lastResetTap<4000){S=def();S.start=ymd(todayD());FX=null;save();applyTheme();render();closeDlg();toast('All progress erased');lastResetTap=0;}else{lastResetTap=now;el.textContent='Click again to erase everything';setTimeout(function(){if(el.isConnected)el.textContent='Reset all progress';},4000);}break;}
    case 'shareCopy':copyText($('#shareText').value,'Post text');break;
    case 'shareDl':shareDownload();break;
  }
}
function doExport(){
  var txt=JSON.stringify(S,null,2);
  try{var b=new Blob([txt],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='cdsa-tracker-backup-'+ymd(todayD())+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);toast('Backup downloaded');}catch(e){copyText(txt,'Backup');}
}

/* settings */
var dlg;
function openSettings(keep){
  var E=engine();
  var h='<div class="dlg"><header><h3>Settings</h3><button class="btn sm ghost" data-act="close">Close</button></header><div class="body">';
  h+='<div><h4>Plan</h4><div class="grid2" style="gap:12px"><label class="f">Finish in (days from start)<input type="number" id="sTarget" min="7" max="400" value="'+S.target+'"></label><label class="f">Exam date (optional)<input type="date" id="sExam" value="'+esc(S.exam)+'"></label></div>'
    +'<div style="margin-top:12px"><span class="note" style="display:block;margin-bottom:6px">Study days</span><div class="days">'+[[1,'Mon'],[2,'Tue'],[3,'Wed'],[4,'Thu'],[5,'Fri'],[6,'Sat'],[0,'Sun']].map(function(d){return '<button data-act="day" data-d="'+d[0]+'" aria-pressed="'+(S.days.indexOf(d[0])>=0)+'">'+d[1]+'</button>';}).join('')+'</div></div>'
    +'<p class="note" style="margin-top:10px">Started '+fmtL(E.start)+' (the day you first opened this page). The plan finishes by '+fmtL(E.deadline)+(S.exam?', a week before your exam':'')+'. It is rebuilt every day from what is left.</p>'
    +'<details style="margin-top:8px"><summary class="note" style="cursor:pointer">Advanced: change start date</summary><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><input type="date" id="sStart" value="'+esc(S.start)+'" style="max-width:200px"><button class="btn sm" data-act="startToday">Use today</button></div></details></div>';
  h+='<div><h4>Theme</h4><div class="seg">'+['system','light','dark'].map(function(t){return '<button data-act="theme" data-v="'+t+'" aria-pressed="'+(S.theme===t)+'">'+t[0].toUpperCase()+t.slice(1)+'</button>';}).join('')+'</div></div>';
  h+='<div><h4>Celebrations</h4>'
    +'<div class="swrow"><div><b id="lbCel">Celebrations</b><small>Pops, confetti and milestone banners when you finish things.'+(reduced()?' Your device asks for reduced motion, so you get static highlights and no particles.':' Respects the reduced-motion setting on your device.')+'</small></div><div class="swctl"><span class="mono">'+(S.celeb?'On':'Off')+'</span><button class="switch" role="switch" aria-checked="'+S.celeb+'" aria-labelledby="lbCel" data-act="celeb"></button></div></div>'
    +'<div class="swrow"><div><b id="lbSnd">Sound</b><small>One soft tick, generated in the browser. Off by default.</small></div><div class="swctl"><span class="mono">'+(S.sound?'On':'Off')+'</span><button class="switch" role="switch" aria-checked="'+S.sound+'" aria-labelledby="lbSnd" data-act="sound"></button></div></div>'
    +'<div style="margin-top:6px"><button class="btn sm" data-act="celebTest">Preview a celebration</button></div></div>';
  h+='<div><h4>Already finished some modules?</h4><div class="mlist" id="prior">'+MODS.map(function(m){var x=modStat(m);return '<label><input class="cb" type="checkbox" value="'+m.id+'"'+(x.done===x.total?' checked disabled':'')+'><span>'+esc(m.name)+'</span></label>';}).join('')+'</div><div style="margin-top:10px"><button class="btn sm" data-act="markDone">Mark selected as done</button></div></div>';
  h+='<div><h4>Backup</h4><p class="note" style="margin-bottom:10px">Progress is saved in this browser only. Export a backup now and then, and before clearing site data.'+(memOnly?' <b class="warnt">Browser storage is unavailable right now, so progress will not persist.</b>':'')+'</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="export">Download backup</button><button class="btn sm" data-act="copyBackup">Copy backup</button></div><label class="f" style="margin-top:12px">Restore: paste a backup, or choose a file<textarea id="impText" placeholder="Paste backup JSON here"></textarea></label><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center"><button class="btn sm" data-act="doImport">Restore from text</button><input type="file" id="impFile" accept="application/json,.json" style="max-width:230px"></div></div>';
  h+='<div><button class="btn sm danger" data-act="reset">Reset all progress</button></div></div></div>';
  dlg.innerHTML=h;
  if(!keep){if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');}
}
function closeDlg(){if(dlg.close)dlg.close();else dlg.removeAttribute('open');}

/* share */
function shareStats(){
  var E=engine(),c=doneDates(),s1=stageStat(1),s0=stageStat(0),all=E.total?E.done/E.total:0;
  return {E:E,all:all,s0:s0,s1:s1,streak:streakNow(c),hours:totalFocus()/60,day:E.notStarted?0:E.dayNo};
}
function shareText(){
  var x=shareStats();
  return 'Day '+x.day+' of working through the HTB SOC Analyst path for the CDSA: '+x.E.done+' of '+x.E.total+' sections done ('+pct(x.all)+'%), '+x.streak+'-day streak, '+Math.round(x.hours*10)/10+' focused hours. Studying one section at a time. #CDSA #BlueTeam #HackTheBox';
}
function drawShare(cv){
  var x=shareStats(),W=1200,H=630,g=cv.getContext('2d');cv.width=W;cv.height=H;
  var dark=document.documentElement.getAttribute('data-theme')==='dark'||(!document.documentElement.getAttribute('data-theme')&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
  var bg=dark?'#0B0F19':'#F1F4F9',card=dark?'#111927':'#FFFFFF',fg=dark?'#E8EEF8':'#0B1220',mu=dark?'#A3B0C5':'#4A5870',ac=dark?'#9FEF00':'#2F7D00',tr=dark?'#1B2639':'#E3E9F1';
  g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.fillStyle=card;rr(g,40,40,W-80,H-80,28);g.fill();
  g.fillStyle=mu;g.font='600 24px ui-monospace,Menlo,Consolas,monospace';g.fillText('HTB SOC ANALYST PATH  ·  CDSA  ·  '+rankInfo().name.toUpperCase(),90,110);
  g.fillStyle=fg;g.font='700 64px system-ui,Segoe UI,Arial,sans-serif';g.fillText('Day '+x.day+' of my CDSA study plan',90,200);
  // ring
  var cx=300,cy=400,r=120;g.lineWidth=26;g.lineCap='round';g.strokeStyle=tr;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();
  g.strokeStyle=ac;g.beginPath();g.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*x.all);g.stroke();
  g.fillStyle=fg;g.textAlign='center';g.font='700 64px system-ui,Segoe UI,Arial,sans-serif';g.fillText(pct(x.all)+'%',cx,cy+20);g.fillStyle=mu;g.font='500 22px system-ui,Segoe UI,Arial,sans-serif';g.fillText(x.E.done+' / '+x.E.total+' sections',cx,cy+56);g.textAlign='left';
  var stats=[[x.streak+(x.streak===1?' day':' days'),'streak'],[(Math.round(x.hours*10)/10)+' h','focused time'],[x.s1.done+' / '+x.s1.total,'SOC Analyst path'],[x.s0.done+' / '+x.s0.total,'basics']];
  stats.forEach(function(s,i){var px=560+(i%2)*300,py=330+Math.floor(i/2)*130;g.fillStyle=fg;g.font='700 44px system-ui,Segoe UI,Arial,sans-serif';g.fillText(s[0],px,py);g.fillStyle=mu;g.font='500 22px system-ui,Segoe UI,Arial,sans-serif';g.fillText(s[1],px,py+34);});
}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function openShare(){
  dlg.innerHTML='<div class="dlg"><header><h3>Share your progress</h3><button class="btn sm ghost" data-act="close">Close</button></header><div class="body"><canvas id="shareCv" style="width:100%;height:auto;border-radius:12px;border:1px solid var(--line)"></canvas><label class="f">Post text<textarea id="shareText"></textarea></label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary sm" data-act="shareCopy">Copy post text</button><button class="btn sm" data-act="shareDl">Download image</button></div><p class="note">Paste it into LinkedIn, Reddit or Discord. Nothing is uploaded anywhere.</p></div></div>';
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
  drawShare($('#shareCv'));$('#shareText').value=shareText();
}
function shareDownload(){
  try{$('#shareCv').toBlob(function(b){var u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='cdsa-progress.png';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);toast('Image downloaded');});}catch(e){toast('Right-click the image to save it');}
}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.dataset.act;
  if(a==='sec'||a==='lab'||a==='gate'||a==='note'||a==='dnote')return;
  onAction(el);
});
document.addEventListener('change',function(e){
  var el=e.target;
  if(el.id==='sStart'&&el.value){S.start=el.value;save();render();openSettings(true);return;}
  if(el.id==='sTarget'){var v=Math.round(+el.value);if(v>=7){S.target=Math.min(400,v);S.exam='';save();render();openSettings(true);}return;}
  if(el.id==='sExam'||el.id==='xDate'){S.exam=el.value||'';save();render();if(el.id==='sExam')openSettings(true);return;}
  if(el.id==='impFile'&&el.files&&el.files[0]){var r=new FileReader();r.onload=function(){$('#impText').value=String(r.result);toast('File loaded. Press Restore.');};r.readAsText(el.files[0]);return;}
  var a=el.dataset&&el.dataset.act,id=el.dataset&&el.dataset.id;
  if(a==='sec'){var snap=takeSnap();setSec(id,el.checked);after({snap:snap,tick:{id:id,on:el.checked,kind:'sec'}});var sc=window.scrollY;if(tab==='path'){renderList();chrome();playFx();}else render();window.scrollTo(0,sc);var again=document.getElementById(el.id);if(again)try{again.focus({preventScroll:true});}catch(x){}}
  else if(a==='lab'){if(el.checked)S.labs[id]=1;else delete S.labs[id];after({tick:{id:id,on:el.checked,kind:id.indexOf('p.')===0?'prob':'lab'}});render();}
  else if(a==='gate'){if(el.checked)S.gate[id]=1;else delete S.gate[id];after();render();}
});
document.addEventListener('input',function(e){
  var el=e.target;
  if(el.id==='q'){F.q=el.value;renderList();return;}
  if(el.id==='rq'){F.rq=el.value;$('#rlist').innerHTML=resList();return;}
  if(!el.dataset)return;
  if(el.dataset.act==='dnote'){S.dnotes[el.dataset.id]=el.value;if(!el.value)delete S.dnotes[el.dataset.id];save();return;}
  if(el.dataset.act==='note'){S.notes[el.dataset.id]=el.value;if(!el.value)delete S.notes[el.dataset.id];save();}
});
window.addEventListener('hashchange',function(){var h=(location.hash||'').replace('#','');if(h==='dash')h='today';if(TABS.indexOf(h)>=0&&h!==tab){tab=h;render();if(h==='plan')setTimeout(scrollToday,0);}});

/* ---------- clock and day rollover ---------- */
function tickClock(){
  var n=new Date(),txt=n.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  [].forEach.call(document.querySelectorAll('.clock'),function(c){c.textContent=txt;});
  var k=ymd(todayD());
  if(k!==lastDay){lastDay=k;render();toast('New day: '+fmtL(todayD()));}
  if(S.timer&&S.timer.end<=Date.now())finishTimer(true,true);
}
setInterval(tickClock,15000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)tickClock();});
window.addEventListener('focus',tickClock);

/* ---------- boot ---------- */
dlg=$('#dlg');
dlg.addEventListener('click',function(e){if(e.target===dlg)closeDlg();});
if(!S.start){S.start=ymd(todayD());persist();}
applyTheme();
awardBadges();
sealCel();
render();
tickClock();
startTick();
if(tab==='plan')setTimeout(scrollToday,0);
})();

