(function(){
'use strict';
var D=document,W=window,root=D.documentElement;
var reduce=W.matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=W.matchMedia('(hover: hover) and (pointer: fine)').matches;
function $(id){return D.getElementById(id);}
function all(sel,ctx){return Array.prototype.slice.call((ctx||D).querySelectorAll(sel));}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function two(n){return (n<10?'0':'')+n;}
function quote(s){return '« '+s+' »';}
function vt(fn){
  if(reduce||!D.startViewTransition){fn();return;}
  root.classList.add('vt-local');
  var done=function(){root.classList.remove('vt-local');},tr;
  try{tr=D.startViewTransition(fn);}catch(e){done();fn();return;}
  tr.finished.then(done,done);
}
function watch(node,fn,opts){
  if(!node||!('IntersectionObserver' in W)){fn(true);return;}
  new IntersectionObserver(function(es){es.forEach(function(e){fn(e.isIntersecting);});},opts||{}).observe(node);
}

/* ---------- Titre d'ouverture : les mots montent un par un ---------- */
(function(){
  var h1=D.querySelector('.hero h1');if(!h1||reduce)return;
  var i=0;
  all('.l',h1).forEach(function(l){
    var ws=l.textContent.trim().split(' ');l.textContent='';
    ws.forEach(function(w,k){
      var s=D.createElement('span');s.className='w';s.style.setProperty('--i',i++);s.textContent=w;l.appendChild(s);
      if(k<ws.length-1)l.appendChild(D.createTextNode(' '));
    });
  });
})();

/* ---------- La machine W-01 : une seule horloge, tout en découle ---------- */
var M=(function(){
  var svg=$('mach');if(!svg||!svg.createSVGPoint)return null;
  var NS='http://www.w3.org/2000/svg',PI=Math.PI;
  function el(t,a,p){var e=D.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
  var C1={x:320,y:210},N1=20,N2=12,RB=28,RH=22,CW=.6,T=3,V1=160,V2=120,GAP=84,VY=64,H0=356;
  var G=[{x:256.7,y:239.8,a:PI*.86},{x:383.3,y:239.8,a:PI*.14}];
  G.forEach(function(g){var p1=2*PI/N1,p2=2*PI/N2;g.c=g.a+PI-p2*(.5-g.a/p1);});
  function camR(a){a=((a+PI)%(2*PI)+2*PI)%(2*PI)-PI;return RB+(Math.abs(a)<CW?RH*.5*(1+Math.cos(PI*a/CW)):0);}
  var LABELS=[
    ['Mail client','Ligne Dataverse'],['PDF fournisseur','Message Teams'],['Export Excel','Rapport Power BI'],
    ['Ticket support','Workflow lancé'],['Réunion de 2 h','Compte rendu, 3 lignes'],['Formulaire web','Dossier créé'],
    ['Mail « URGENT »','Priorité : basse'],['Facture scannée','Écriture compta'],['Excel à 47 onglets','Un tableau de bord'],
    ['final_v12_OK_bis.xlsx','Une seule version'],['Classeur papier Airbnb','Boîtier Wigaly'],['Macro VBA de 2009','Flow Power Automate'],
    ['Post-it sur l’écran','Rappel Teams'],['« Un petit truc vite fait »','Appli en prod'],['Note de frais froissée','Remboursement validé'],
    ['Relance n° 4','Paiement reçu'],['Contrat de 80 pages','Clauses à risque listées'],['« L’IA décide ? »','Non, elle prépare']
  ];
  var SHORT=LABELS.filter(function(L){return Math.max(L[0].length,L[1].length)<=17;});
  var scn=$('scenery'),chipsIn=$('chipsIn'),chipsOut=$('chips'),puffsG=$('puffs'),ctr=$('ctr'),leds=$('leds').children;
  var g1=$('g1'),g2=$('g2'),g3=$('g3'),shaft=$('shaft'),head=$('head'),spring=$('spring');
  var upper=$('upper'),fore=$('fore'),elbow=$('elbow'),wrist=$('wrist'),f1=$('f1'),f2=$('f2');
  var vb={x:16,w:640},small=false,DX=560,beltInEl=null,beltOutEl=null,rollIn=[],rollOut=[];
  var t=0,beltIn=0,beltOut=0,theta=0,count=0,flash=0,run=true,pressing=false;
  var chips=[],puffs=[],pending=[],up=null,li=0,stamps=[],subs=[],quiet=true;
  var P={x:444,y:108},L1=100,L2=100,arm={x:452,y:236,grip:0,q:[],hold:null,busy:false};

  function build(){
    var r=svg.getBoundingClientRect();if(!r.width||!r.height)return;
    var w=r.width/(r.height/H0);small=w<760;if(w<500)w=500;
    DX=small?524:560;vb.w=w;vb.x=(small?358:336)-w/2;
    svg.setAttribute('viewBox',vb.x.toFixed(1)+' '+VY+' '+w.toFixed(1)+' '+H0);
    while(scn.firstChild)scn.removeChild(scn.firstChild);
    rollIn=[];rollOut=[];
    var L=vb.x-80,R=vb.x+vb.w+80,x;
    el('line',{x1:L,y1:392,x2:R,y2:392,stroke:'#fff','stroke-opacity':.3,'stroke-width':2},scn);
    for(x=180;x>L;x-=140)el('line',{x1:x,y1:346,x2:x,y2:392,stroke:'#fff','stroke-opacity':.35,'stroke-width':4},scn);
    for(x=490;x<R;x+=140)el('line',{x1:x,y1:276,x2:x,y2:392,stroke:'#fff','stroke-opacity':.35,'stroke-width':4},scn);
    el('rect',{x:L,y:334,width:226-L,height:12,rx:6,fill:'#fff','fill-opacity':.14},scn);
    beltInEl=el('line',{x1:L,y1:340,x2:226,y2:340,stroke:'#fff','stroke-width':3,'stroke-dasharray':'12 10','stroke-linecap':'round'},scn);
    el('rect',{x:470,y:264,width:R-470,height:12,rx:6,fill:'#fff','fill-opacity':.14},scn);
    beltOutEl=el('line',{x1:470,y1:270,x2:R,y2:270,stroke:'#fff','stroke-width':3,'stroke-dasharray':'12 10','stroke-linecap':'round'},scn);
    for(x=180;x>L;x-=140)rollIn.push(el('circle',{'class':'roller',cx:x,cy:340,r:9},scn));
    for(x=490;x<R;x+=140)rollOut.push(el('circle',{'class':'roller',cx:x,cy:270,r:9},scn));
  }

  function widthFor(a,b){return Math.min(214,Math.max(100,Math.max(a.length,b.length)*7.1+30));}
  function mkChip(x,a,b,user){
    var w=widthFor(a,b),g=el('g',{'class':'chip'+(user?' user':'')},chipsIn);
    var sh=el('rect',{x:-w/2,y:-13,width:w,height:34,rx:8,fill:'#071250','fill-opacity':.3},g);
    var r=el('rect',{'class':'face',x:-w/2,y:-17,width:w,height:34,rx:8,fill:'#fff'},g);
    var tx=el('text',{x:0,y:4.5,'text-anchor':'middle',fill:'#1634D0'},g);tx.textContent=a;
    return {g:g,r:r,sh:sh,tx:tx,w:w,L:[a,b],user:!!user,x:x,x0:x,bo:beltIn,y:320,h:34,pop:0,state:'in',stamped:false,wob:0,wobT:0};
  }
  function relabel(c,a,b){
    var w=widthFor(a,b);c.w=w;c.L=[a,b];c.user=true;c.pop=1;
    [c.sh,c.r].forEach(function(n){n.setAttribute('x',-w/2);n.setAttribute('width',w);});
    c.tx.textContent=a;c.g.setAttribute('class','chip user');
  }
  function ensureUp(){
    if(up)return;
    var n;
    if(pending.length){var p=pending.shift();n=[p.a,p.b,true];}
    else{var set=small?SHORT:LABELS,Lb=set[li++%set.length];n=[Lb[0],Lb[1],false];}
    up={n:n,w:widthFor(n[0],n[1])};
  }
  function spawnX(){return vb.x-116;}
  function leftmost(){var m=null;chips.forEach(function(c){if(c.state==='in'&&(!m||c.x<m.x))m=c;});return m;}
  function populate(){
    var edge=188,guard=0;
    while(guard++<16){
      ensureUp();
      var c=mkChip(edge-up.w/2,up.n[0],up.n[1],up.n[2]);up=null;chips.push(c);
      edge=c.x-c.w/2-GAP;
      if(c.x<spawnX())break;
    }
  }

  function ik(tx,ty){
    var dx=tx-P.x,dy=ty-P.y,hy=Math.sqrt(dx*dx+dy*dy)||1,d=Math.min(L1+L2-1,Math.max(10,hy)),a=Math.atan2(dy,dx),al=Math.acos((d*d+L1*L1-L2*L2)/(2*d*L1));
    var e1={x:P.x+L1*Math.cos(a-al),y:P.y+L1*Math.sin(a-al)},e2={x:P.x+L1*Math.cos(a+al),y:P.y+L1*Math.sin(a+al)};
    var e=(e1.y<e2.y-.5||(Math.abs(e1.y-e2.y)<=.5&&e1.x>e2.x))?e1:e2;
    return {e:e,w:{x:P.x+dx/hy*d,y:P.y+dy/hy*d}};
  }
  function ease(u){return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;}
  function tween(to,dur,cb){arm.q.push({to:to,dur:dur,cb:cb});}
  function armStep(dt){
    if(!arm.q.length)return;
    var k=arm.q[0];
    if(k.t===undefined){k.t=0;k.from={x:arm.x,y:arm.y,grip:arm.grip};}
    k.t+=dt;var u=Math.min(1,k.t/k.dur),e=ease(u);
    ['x','y','grip'].forEach(function(f){if(k.to[f]!==undefined)arm[f]=k.from[f]+(k.to[f]-k.from[f])*e;});
    if(u>=1){arm.q.shift();if(k.cb)k.cb();}
  }
  function pick(c){
    arm.busy=true;c.state='picked';
    tween({x:452,y:279},.28);
    tween({grip:1},.14,function(){arm.hold=c;chipsOut.appendChild(c.g);});
    tween({y:230},.22);tween({x:DX,y:180},.55);tween({y:209},.25);
    tween({grip:0},.14,function(){arm.hold=null;c.state='out';c.x0=c.x;c.y=250;c.bo=beltOut;});
    tween({y:170},.2);tween({x:452,y:236},.5,function(){arm.busy=false;});
  }
  function puff(x,y){
    if(quiet)return;
    for(var i=0;i<7;i++){
      var a=PI*(i/6)+PI,sp=60+Math.random()*60;
      puffs.push({x:x,y:y,vx:Math.cos(a)*sp*(i<3?-1:1)*(i%2?1:.6),vy:-Math.abs(Math.sin(a))*sp*.6-20,life:0,el:el('circle',{r:3,fill:'#fff',opacity:.8},puffsG)});
    }
  }
  function cycle(){
    if(stamps.length<2)return T;
    return (stamps[stamps.length-1]-stamps[0])/(stamps.length-1);
  }
  function stamp(c,hb){
    c.stamped=true;flash=1;c.tx.textContent=c.L[1];c.r.setAttribute('fill','#FFD166');c.tx.setAttribute('fill','#0E1322');
    puff(320,hb);
    if(quiet)return;
    count++;ctr.textContent=('000'+count).slice(-4);
    stamps.push(t);if(stamps.length>6)stamps.shift();
    var ev={a:c.L[0],b:c.L[1],user:c.user,count:count,cycle:cycle()};
    subs.forEach(function(f){f(ev);});
  }

  function step(dt){
    t+=dt;theta=(t/T)*2*PI;
    var r=camR(PI/2-theta),hb=290+(r-RB)+12;
    pressing=r>RB+.5;
    var waiting=false;
    chips.forEach(function(c){
      if(c.state==='in'&&c.x>=319.5){c.state='wait';c.x=320;c.wobT=0;c.wob=0;}
      if(c.state==='wait')waiting=true;
    });
    var danger=pressing&&chips.some(function(c){return c.state==='in'&&c.x>250&&c.x<330;});
    run=!waiting&&!danger;
    if(run)beltIn+=V1*dt;
    beltOut+=V2*dt;
    ensureUp();
    var lm=leftmost();
    if(!lm||lm.x-lm.w/2-GAP-up.w/2>=spawnX()){chips.push(mkChip(spawnX(),up.n[0],up.n[1],up.n[2]));up=null;}
    chips.forEach(function(c){
      if(c.pop>0)c.pop=Math.max(0,c.pop-dt*2.4);
      if(c.state==='in')c.x=c.x0+(beltIn-c.bo);
      else if(c.state==='wait'){
        if(pressing&&hb>=303&&!c.stamped)stamp(c,hb);
        if(pressing&&c.stamped){c.h=Math.min(34,Math.max(12,337-hb));c.wobT=0;c.wob=(34-c.h)*.6;}
        else if(c.stamped){
          c.wobT+=dt;c.h=34+c.wob*Math.exp(-c.wobT*10)*Math.sin(c.wobT*34);
          if(c.wobT>.4){c.state='in2';c.h=34;}
        }
      }
      else if(c.state==='in2'){c.x+=V1*dt;if(c.x>=452){c.x=452;c.state='tray';}}
      if(c.state==='tray'&&!arm.busy)pick(c);
      if(c.state==='picked'&&arm.hold===c){c.x=arm.x;c.y=arm.y+29;}
      if(c.state==='out'){c.x=c.x0+(beltOut-c.bo);if(c.x-c.w/2>vb.x+vb.w+60){c.state='done';if(c.g.parentNode)c.g.parentNode.removeChild(c.g);}}
    });
    chips=chips.filter(function(c){return c.state!=='done';});
    if(flash>0)flash-=dt*8;
    armStep(dt);
    puffs.forEach(function(q){q.life+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=120*dt;});
    puffs=puffs.filter(function(q){if(q.life>.5){if(q.el.parentNode)q.el.parentNode.removeChild(q.el);return false;}return true;});
  }

  function render(){
    var r=camR(PI/2-theta),headTop=290+(r-RB),shaftTop=C1.y+r,i;
    g1.setAttribute('transform','translate(320 210) rotate('+(theta*180/PI).toFixed(2)+')');
    [g2,g3].forEach(function(g,k){var gg=G[k],th=-theta*N1/N2+gg.c;g.setAttribute('transform','translate('+gg.x+' '+gg.y+') rotate('+(th*180/PI).toFixed(2)+')');});
    shaft.setAttribute('y',shaftTop.toFixed(1));shaft.setAttribute('height',Math.max(0,headTop-shaftTop).toFixed(1));
    head.setAttribute('y',headTop.toFixed(1));
    var collar=shaftTop+8,sp='';
    for(i=0;i<=6;i++){sp+=(i?' ':'')+(320+(i%2?13:-13)*(i&&i<6?1:0))+','+(collar+(290-collar)*i/6).toFixed(1);}
    spring.setAttribute('points',sp);
    if(beltInEl){beltInEl.style.strokeDashoffset=(-(beltIn%22)).toFixed(2);beltOutEl.style.strokeDashoffset=(-(beltOut%22)).toFixed(2);}
    var ri='rotate('+(beltIn/9).toFixed(3)+'rad)',ro='rotate('+(beltOut/9).toFixed(3)+'rad)';
    rollIn.forEach(function(c){c.style.transform=ri;});rollOut.forEach(function(c){c.style.transform=ro;});
    var k=ik(arm.x,arm.y);
    upper.setAttribute('x2',k.e.x.toFixed(1));upper.setAttribute('y2',k.e.y.toFixed(1));
    fore.setAttribute('x1',k.e.x.toFixed(1));fore.setAttribute('y1',k.e.y.toFixed(1));fore.setAttribute('x2',k.w.x.toFixed(1));fore.setAttribute('y2',k.w.y.toFixed(1));
    elbow.setAttribute('cx',k.e.x.toFixed(1));elbow.setAttribute('cy',k.e.y.toFixed(1));
    wrist.setAttribute('transform','translate('+k.w.x.toFixed(1)+' '+k.w.y.toFixed(1)+')');
    var open=14-arm.grip*8;
    [f1,f2].forEach(function(f,n){var s=n?1:-1;f.setAttribute('x1',s*open);f.setAttribute('y1',4);f.setAttribute('x2',(s*open*.6).toFixed(1));f.setAttribute('y2',26);});
    leds[0].setAttribute('class',run?'on':'');leds[1].setAttribute('class',pressing?'on':'');leds[2].setAttribute('class',arm.busy?'on':'');
    chips.forEach(function(c){
      var sy=c.h/34,sx=1+(1-sy)*.35,pp=1+Math.sin(c.pop*PI)*.16;
      c.g.setAttribute('transform','translate('+c.x.toFixed(1)+' '+(c.y+17-17*sy).toFixed(1)+') scale('+(sx*pp).toFixed(3)+' '+(sy*pp).toFixed(3)+')');
      if(c.state==='wait'&&c.stamped)c.r.setAttribute('fill',flash>.5?'#fff':'#FFD166');
    });
    puffs.forEach(function(q){q.el.setAttribute('cx',q.x.toFixed(1));q.el.setAttribute('cy',q.y.toFixed(1));q.el.setAttribute('r',(3+q.life*6).toFixed(1));q.el.setAttribute('opacity',Math.max(0,.8-q.life*1.6).toFixed(2));});
  }

  var heroVis=true,instVis=false,raf=0,last=null,ready=false;
  function loop(now){
    raf=0;
    if(last===null)last=now;
    var dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    step(dt);
    if(heroVis)render();
    if(heroVis||instVis)raf=W.requestAnimationFrame(loop);else last=null;
  }
  function kick(){if(ready&&!raf&&!reduce&&(heroVis||instVis)){last=null;raf=W.requestAnimationFrame(loop);}}
  /* Démarrage. La taille arrive par ResizeObserver, après la première mise en page : le script ne la force pas.
     566 pas d'amorçage mènent à une image lisible même figée (presse levée, une entrée en attente, une sortie portée par le bras). */
  function start(){
    if(ready)return;
    build();populate();
    for(var n=0;n<566;n++)step(1/60);
    quiet=false;stamps=[];ready=true;
    render();kick();
  }
  function resized(){if(ready){build();render();}else start();}
  if('ResizeObserver' in W){new ResizeObserver(resized).observe(svg);W.setTimeout(start,1500);}
  else{start();W.addEventListener('resize',resized);}
  watch(svg,function(v){heroVis=v;kick();});
  watch($('rules'),function(v){instVis=v;kick();});

  return {
    on:function(f){subs.push(f);},
    room:function(){return small?23:25;},
    inject:function(a,b){
      var best=null,lim=vb.x+8;
      chips.forEach(function(c){if(c.state==='in'&&!c.user&&c.x+c.w/2<206&&c.x-c.w/2>lim&&(!best||c.x>best.x))best=c;});
      if(best){relabel(best,a,b);if(reduce)render();return;}
      pending.push({a:a,b:b});up=null;
    }
  };
})();

/*{{REPLY}}*/

/* ---------- À vous : poser quelque chose sur le tapis ---------- */
(function(){
  var form=$('drop'),inp=$('drop-in'),out=$('drop-out');if(!form)return;
  function say(a,verbe,b){return quote(a)+verbe+quote(b)+(/[.!?…]$/.test(b)?'':'.');}
  function send(v){
    v=v.replace(/\s+/g,' ').trim();if(!v){inp.focus();return;}
    /* la réponse se calcule sur le texte entier, l'étiquette du tapis n'en garde que le début */
    var b=reply(v,M?M.room():25),a=reply.clip(v,24);
    inp.value='';
    if(reduce||!M){out.textContent=say(a,' devient ',b);return;}
    out.textContent=quote(a)+' est sur le tapis, la presse arrive.';
    M.inject(a,b);
  }
  form.addEventListener('submit',function(e){e.preventDefault();send(inp.value);});
  all('[data-try]',form).forEach(function(b){b.addEventListener('click',function(){send(b.getAttribute('data-try'));});});
  if(M)M.on(function(ev){if(ev.user)out.textContent=say(ev.a,' est devenu ',ev.b);});
})();

/* ---------- Instruments : ce que la page promet, mesuré sur la page ---------- */
(function(){
  var jr=$('journal'),mc=$('m-count'),my=$('m-cycle'),cc=$('ct-count'),ccp=cc&&cc.parentNode;
  if(M&&jr){
    M.on(function(ev){
      if(ccp){ccp.textContent='';cc.textContent=fmt(ev.count);ccp.appendChild(cc);ccp.appendChild(D.createTextNode(ev.count>1?' traités':' traité'));}
      mc.textContent=fmt(ev.count);
      mc.parentNode.querySelector('dt').textContent=(ev.count>1?'éléments traités':'élément traité')+' depuis votre arrivée';
      my.textContent=ev.cycle.toFixed(1).replace('.',',')+' s';
      var idle=jr.querySelector('.idle');if(idle)jr.removeChild(idle);
      var li=D.createElement('li'),tm=D.createElement('time'),a=D.createElement('span'),o=D.createElement('span'),sr=D.createElement('span'),b=D.createElement('b'),d=new Date();
      tm.textContent=two(d.getHours())+':'+two(d.getMinutes())+':'+two(d.getSeconds());
      try{tm.setAttribute('datetime',d.toISOString());}catch(e){}
      li.appendChild(tm);
      if(ev.user){var y=D.createElement('i');y.textContent='vous';li.appendChild(y);}
      a.className='ja';a.textContent=ev.a;
      o.className='jb';sr.className='vh';sr.textContent=' devient ';o.appendChild(sr);
      var ar=D.createElementNS('http://www.w3.org/2000/svg','svg');ar.setAttribute('viewBox','0 0 12 9');ar.setAttribute('aria-hidden','true');
      var pa=D.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d','M0 4.5h10M6.5 1l3.5 3.5L6.5 8');pa.setAttribute('fill','none');pa.setAttribute('stroke','currentColor');pa.setAttribute('stroke-width','1.6');
      ar.appendChild(pa);o.appendChild(ar);
      b.textContent=ev.b;o.appendChild(b);
      li.appendChild(a);li.appendChild(o);
      jr.insertBefore(li,jr.firstChild);
      while(jr.children.length>4)jr.removeChild(jr.lastChild);
    });
  }
  function measure(){
    var third=null,cook=null,here;
    try{here=new URL(location.href).origin;}catch(e){here=null;}
    try{
      if(here&&here!=='null'&&W.performance&&performance.getEntriesByType){
        third=0;
        performance.getEntriesByType('resource').forEach(function(e){
          try{var u=new URL(e.name,location.href);if(/^https?:$/.test(u.protocol)&&u.origin!==here)third++;}catch(_){}
        });
      }
    }catch(e){third=null;}
    try{var c=D.cookie;cook=c?c.split(';').length:0;}catch(e){cook=null;}
    var a=$('m-third'),b=$('m-cook'),n=$('m-note');
    if(a&&third!==null){a.textContent=third;a.parentNode.querySelector('dt').textContent=(third>1?'requêtes':'requête')+' vers un tiers pour afficher cette page';}
    if(b&&cook!==null){b.textContent=cook;b.parentNode.querySelector('dt').textContent=cook>1?'cookies déposés':'cookie déposé';}
    if(n&&third!==null&&cook!==null)n.hidden=false;
  }
  if(D.readyState==='complete')setTimeout(measure,400);else W.addEventListener('load',function(){setTimeout(measure,400);});
})();

/* ---------- Le plan : la couche lue s'allume sur le dessin ---------- */
(function(){
  var plan=$('plan'),box=D.querySelector('.layers');if(!plan||!box||!('IntersectionObserver' in W))return;
  var layers=all('.layer',box);
  function on(n){
    plan.setAttribute('data-on',n);box.classList.add('live');
    layers.forEach(function(l){l.classList.toggle('on',l.getAttribute('data-layer')===n);});
  }
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)on(e.target.getAttribute('data-layer'));});},{rootMargin:'-49% 0px -49% 0px'});
  layers.forEach(function(l){
    io.observe(l);
    if(fine)l.addEventListener('pointerenter',function(){on(l.getAttribute('data-layer'));});
  });
})();

/* ---------- Révélations au défilement : rien n'est masqué avant le premier geste ---------- */
(function(){
  if(reduce||!('IntersectionObserver' in W))return;
  var armed=false;
  function inView(n){var r=n.getBoundingClientRect();return r.top<W.innerHeight&&r.bottom>0;}
  function splitLines(h){
    var txt=h.textContent.replace(/\s+/g,' ').trim();
    h.setAttribute('data-full',txt);h.setAttribute('aria-label',txt);h.textContent='';
    var words=txt.split(' ').map(function(w){var s=D.createElement('span');s.style.display='inline-block';s.textContent=w;h.appendChild(s);h.appendChild(D.createTextNode(' '));return s;});
    var lines=[],top=null;
    words.forEach(function(s){if(top===null||Math.abs(s.offsetTop-top)>4){lines.push([]);top=s.offsetTop;}lines[lines.length-1].push(s.textContent);});
    h.textContent='';
    lines.forEach(function(l,k){var o=D.createElement('span'),i=D.createElement('span');o.className='ln';o.setAttribute('aria-hidden','true');i.style.setProperty('--k',k);i.textContent=l.join(' ');o.appendChild(i);h.appendChild(o);});
    h.classList.add('pre');
  }
  function restore(h){h.textContent=h.getAttribute('data-full');h.removeAttribute('aria-label');h.classList.remove('pre','in');}
  function arm(){
    if(armed)return;armed=true;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.unobserve(e.target);
      var n=e.target;
      if(n.classList.contains('split')){n.classList.add('in');n.classList.remove('pre');setTimeout(function(){restore(n);},1700);}
      else count(n);
    });},{threshold:.35});
    all('.split').forEach(function(h){if(!inView(h)){splitLines(h);io.observe(h);}});
    all('[data-count]').forEach(function(n){if(!inView(n)){n.textContent='0'+(n.getAttribute('data-suffix')||'');io.observe(n);}});
  }
  function count(n){
    var end=+n.getAttribute('data-count'),suf=n.getAttribute('data-suffix')||'',t0=null;
    function tick(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/1500);p=1-Math.pow(1-p,3);n.textContent=fmt(end*p)+suf;if(p<1)W.requestAnimationFrame(tick);}
    W.requestAnimationFrame(tick);
  }
  var go=function(){W.removeEventListener('scroll',go);var f=D.fonts&&D.fonts.ready;if(f&&f.then)f.then(arm,arm);else arm();};
  W.addEventListener('scroll',go,{passive:true});
})();

/* ---------- Démo BambuStock ---------- */
(function(){
  var w=$('bs-w'),go=$('bs-go'),ring=$('bs-ring'),msg=$('bs-msg');if(!w||!go)return;
  var left=1000,parts=0,busy=false,PRICE=23/1000;
  function eur(n){return n.toFixed(2).replace('.',',')+' €';}
  function sync(){
    var g=+w.value;
    $('bs-wv').textContent=g+' g';w.setAttribute('aria-valuetext',g+' grammes');$('bs-cost').textContent=eur(g*PRICE);
    $('bs-left').textContent=fmt(left)+' g';$('bs-parts').textContent=parts+(parts>1?' pièces':' pièce');
    ring.style.strokeDasharray=(left/10)+' 100';
    if(!busy)go.textContent=left<g?'Changer la bobine':'Lancer l’impression';
  }
  w.addEventListener('input',function(){msg.textContent='';sync();});
  go.addEventListener('click',function(){
    if(busy)return;
    var g=+w.value;
    if(left<g){left=1000;msg.textContent='Bobine neuve en place.';sync();return;}
    busy=true;go.setAttribute('aria-disabled','true');go.textContent='Impression en cours…';msg.textContent='';
    left-=g;sync();
    setTimeout(function(){
      parts++;busy=false;go.removeAttribute('aria-disabled');
      msg.textContent='Impression réussie : la pièce entre en stock.';sync();
    },reduce?0:1100);
  });
  sync();
})();

/* ---------- Démo Home Guide ---------- */
(function(){
  var box=$('hg');if(!box)return;
  var tabs=all('[role=tab]',box);
  function show(tb,focus){
    tabs.forEach(function(x){var sel=x===tb;x.setAttribute('aria-selected',sel?'true':'false');x.tabIndex=sel?0:-1;$(x.getAttribute('aria-controls')).hidden=!sel;});
    if(focus)tb.focus();
  }
  tabs.forEach(function(tb,i){
    tb.addEventListener('click',function(){show(tb,false);});
    tb.addEventListener('keydown',function(e){
      var k=e.key,n=-1;
      if(k==='ArrowRight')n=(i+1)%tabs.length;else if(k==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(k==='Home')n=0;else if(k==='End')n=tabs.length-1;
      if(n>=0){e.preventDefault();show(tabs[n],true);}
    });
  });
})();

/* ---------- Démo Jukebox ---------- */
(function(){
  var list=$('jk-list'),box=$('jk');if(!list)return;
  var q=[{id:'a',t:'Flow Automate',by:'DJ Dataverse',v:0},{id:'b',t:'Macro de 2009',by:'Les VBA',v:4},{id:'c',t:'47 onglets',by:'Tableur Club',v:3},{id:'d',t:'Final v12 OK bis',by:'Les Versions',v:1}];
  var prog=.35,DUR=14,vis=false,raf=0,last=0,bar=null;
  function row(s){
    var li=D.createElement('li'),tt=D.createElement('span'),b=D.createElement('b'),a=D.createElement('span');
    li.style.viewTransitionName='jk-'+s.id;
    tt.className='jk-t';b.textContent=s.t;a.textContent=s.by;tt.appendChild(b);tt.appendChild(a);li.appendChild(tt);
    s.votes=D.createElement('span');s.votes.className='jk-v';li.appendChild(s.votes);
    s.btn=D.createElement('button');s.btn.type='button';s.btn.textContent='+1';s.btn.setAttribute('aria-label','+1 pour '+s.t);
    s.btn.addEventListener('click',function(){vote(s);});li.appendChild(s.btn);
    s.now=D.createElement('span');s.now.className='jk-now';
    var eq=D.createElement('span');eq.className='jk-eq';eq.setAttribute('aria-hidden','true');eq.appendChild(D.createElement('i'));eq.appendChild(D.createElement('i'));eq.appendChild(D.createElement('i'));
    s.now.appendChild(eq);s.now.appendChild(D.createTextNode('En cours'));li.appendChild(s.now);
    s.li=li;return li;
  }
  function sync(){
    var act=D.activeElement;
    q.forEach(function(s,i){
      var now=i===0;
      s.li.className=now?'now':'';s.votes.hidden=now;s.btn.hidden=now;s.now.hidden=!now;
      s.votes.textContent=s.v+(s.v>1?' votes':' vote');
      if(list.children[i]!==s.li){if(list.moveBefore){try{list.moveBefore(s.li,list.children[i]||null);}catch(e){list.insertBefore(s.li,list.children[i]||null);}}else list.insertBefore(s.li,list.children[i]||null);}
    });
    if(!bar){bar=D.createElement('i');bar.className='jk-bar';}
    q[0].li.appendChild(bar);paint();
    if(act&&act!==D.activeElement&&list.contains(act)&&!act.hidden)act.focus();
  }
  function paint(){if(bar)bar.style.transform='scaleX('+prog.toFixed(4)+')';}
  function sorted(){
    return [q[0]].concat(q.slice(1).map(function(s,i){return {s:s,i:i};}).sort(function(x,y){return y.s.v-x.s.v||x.i-y.i;}).map(function(o){return o.s;}));
  }
  function vote(s){
    s.v++;
    var nq=sorted(),moved=nq.some(function(x,i){return x!==q[i];});
    q=nq;if(moved)vt(sync);else sync();
  }
  function next(){
    var done=q[0];done.v=0;q=q.slice(1).concat([done]);prog=0;vt(sync);
  }
  function tick(ts){
    raf=0;if(!vis)return;
    if(!last)last=ts;
    prog+=Math.min(.1,(ts-last)/1000)/DUR;last=ts;
    if(prog>=1)next();else paint();
    raf=W.requestAnimationFrame(tick);
  }
  list.textContent='';q.forEach(function(s){list.appendChild(row(s));});sync();
  if(!reduce)watch(box,function(v){vis=v;last=0;if(v&&!raf)raf=W.requestAnimationFrame(tick);},{threshold:.3});
})();

/* ---------- Démo Boîtier ---------- */
(function(){
  var scr=$('bx-screen'),btn=$('bx-next');if(!scr||!btn)return;
  var pages=all('[data-page]',scr),dots=all('.bx-dots i'),i=0,turn=0;
  btn.addEventListener('click',function(){
    pages[i].hidden=true;if(dots[i])dots[i].className='';
    i=(i+1)%pages.length;turn+=90;
    pages[i].hidden=false;if(dots[i])dots[i].className='on';
    btn.style.transform='rotate('+turn+'deg)';
    if(!reduce){scr.classList.remove('flash');void scr.offsetWidth;scr.classList.add('flash');}
  });
})();

/* ---------- Contact ---------- */
(function(){
  var f=$('contact-form');if(!f)return;
  var st=$('form-status'),btn=f.querySelector('button[type=submit]'),label=btn.textContent;
  var ENDPOINT=f.getAttribute('data-endpoint')||'';
  var fields=all('[required]',f);
  function say(kind,txt){st.className='form-status'+(kind?' '+kind:'');st.textContent=txt;}
  function err(i,m){
    var box=i.parentNode,e=box.querySelector('.err');
    if(m){if(!e){e=D.createElement('p');e.className='err';e.id=i.id+'-err';box.appendChild(e);}e.textContent=m;i.setAttribute('aria-invalid','true');i.setAttribute('aria-describedby',e.id);}
    else{if(e)box.removeChild(e);i.removeAttribute('aria-invalid');i.removeAttribute('aria-describedby');}
  }
  function check(i){
    var v=i.value.trim(),m='';
    if(!v)m=i.getAttribute('data-req');
    else if(i.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))m='Cette adresse e-mail semble incomplète.';
    err(i,m);return !m;
  }
  fields.forEach(function(i){
    i.addEventListener('blur',function(){if(i.value.trim())check(i);});
    i.addEventListener('input',function(){if(i.getAttribute('aria-invalid')==='true')check(i);});
  });
  function sent(){f.reset();btn.textContent='Demande envoyée';btn.setAttribute('aria-disabled','true');say('ok','Demande envoyée. On revient vers vous rapidement.');}
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(btn.getAttribute('aria-disabled')==='true')return;
    var first=null;fields.forEach(function(i){if(!check(i)&&!first)first=i;});
    if(first){say('','');first.focus();return;}
    if(f.elements.site&&f.elements.site.value){sent();return;}
    if(!ENDPOINT){say('warn','Ce formulaire n’est pas encore raccordé : votre message n’a pas été envoyé.');return;}
    btn.setAttribute('aria-disabled','true');btn.textContent='Envoi en cours…';say('','');
    W.fetch(ENDPOINT,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify({nom:f.elements.nom.value.trim(),email:f.elements.email.value.trim(),besoin:f.elements.besoin.value.trim(),page:location.href})})
      .then(function(r){if(!r.ok)throw new Error(String(r.status));sent();})
      .catch(function(){btn.removeAttribute('aria-disabled');btn.textContent=label;say('bad','L’envoi a échoué. Vérifiez votre connexion puis réessayez.');});
  });
  all('[data-prefill]').forEach(function(a){a.addEventListener('click',function(){var b=f.elements.besoin;if(b&&!b.value.trim())b.value=a.getAttribute('data-prefill');});});
})();

/* ---------- Rideau d'ouverture : il quitte le document une fois levé ---------- */
(function(){
  var l=D.querySelector('.loader');if(!l)return;
  function rm(){if(l.parentNode)l.parentNode.removeChild(l);}
  l.addEventListener('animationend',function(e){if(e.animationName==='curtain')rm();});
  /* filet de sécurité : sur une connexion lente, l'animation peut finir avant que ce script ne s'exécute */
  W.setTimeout(rm,4000);
})();

/* ---------- Navigation : se range en descendant, revient en remontant ---------- */
(function(){
  var nav=$('nav');if(!nav)return;
  var lastY=0,bar=nav.querySelector('.progress'),css=W.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()');
  W.addEventListener('scroll',function(){
    var y=W.scrollY||0;
    nav.classList.toggle('away',y>lastY&&y>240);lastY=y;
    if(bar&&!css){var h=root.scrollHeight-W.innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,y/h):0).toFixed(4)+')';}
  },{passive:true});
  if(!('IntersectionObserver' in W))return;
  var links={};all('nav a',nav).forEach(function(a){links[a.getAttribute('href').slice(1)]=a;});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    var a=links[e.target.id];if(!a)return;
    if(e.isIntersecting){for(var k in links)links[k].removeAttribute('aria-current');a.setAttribute('aria-current','true');}
    else a.removeAttribute('aria-current');
  });},{rootMargin:'-45% 0px -50% 0px'});
  for(var id in links){var s=$(id);if(s)io.observe(s);}
})();

/* ---------- Curseur et boutons aimantés (souris uniquement) ---------- */
(function(){
  if(!fine||reduce)return;
  var cur=D.querySelector('.cur');
  if(cur){
    var mx=0,my=0,cx=0,cy=0,on=false,raf=0;
    var loop=function(){
      cx+=(mx-cx)*.2;cy+=(my-cy)*.2;cur.style.transform='translate('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px)';
      raf=(Math.abs(mx-cx)+Math.abs(my-cy)>.2)?W.requestAnimationFrame(loop):0;
    };
    W.addEventListener('pointermove',function(e){
      if(e.pointerType&&e.pointerType!=='mouse')return;
      mx=e.clientX;my=e.clientY;
      if(!on){on=true;cx=mx;cy=my;cur.classList.add('live');}
      if(!raf)raf=W.requestAnimationFrame(loop);
    },{passive:true});
    D.addEventListener('mouseleave',function(){on=false;cur.classList.remove('live');});
    D.addEventListener('mouseover',function(e){var t=e.target&&e.target.closest?e.target.closest('a,button,input,textarea,label'):null;cur.classList.toggle('big',!!t&&!t.matches('input,textarea'));});
  }
  all('.mag').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-(r.left+r.width/2))*.22).toFixed(1)+'px,'+((e.clientY-(r.top+r.height/2))*.32).toFixed(1)+'px)';});
    b.addEventListener('pointerleave',function(){b.style.transform='';});
  });
})();

if(W.console&&console.log)console.log('%cwigaly','font:700 22px sans-serif;color:#1634D0','\nVous inspectez ? Bienvenue. Zéro dépendance, zéro traceur, une machine qui tourne.');
})();
