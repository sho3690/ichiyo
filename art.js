/* 一日一頁 — その日の一枚。日付と漢字を種にして、毎日違う抽象画を描く。 */
(function(){
  'use strict';

  function hash(str){
    var h1=0xdeadbeef|0, h2=0x41c6ce57|0;
    for(var i=0;i<str.length;i++){var ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677);}
    h1=Math.imul(h1^(h1>>>16),2246822507); h1^=Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507); h2^=Math.imul(h1^(h1>>>13),3266489909);
    return (h1>>>0)^(h2>>>0);
  }
  function rng(seed){var a=seed>>>0; return function(){a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}

  var CREAM=[235,227,211], GOLD=[201,169,97], GROUND=[27,25,22];
  var ACCENTS=[[201,169,97],[75,90,122],[90,102,80],[122,74,74],[110,107,122],[142,122,74],[96,78,104]];
  function rgba(c,a){return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
  function mix(a,b,t){return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)];}
  var TAU=Math.PI*2;

  // 月と水面
  function moon(ctx,R,w,h,acc){
    var r=w*(0.24+R()*0.1), cx=w*(0.32+R()*0.36), cy=h*(0.28+R()*0.14);
    var g=ctx.createRadialGradient(cx-r*0.35,cy-r*0.35,r*0.05,cx,cy,r);
    g.addColorStop(0,'rgba(242,235,218,0.96)'); g.addColorStop(1,'rgba(214,202,178,0.78)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill();
    var hy=h*(0.58+R()*0.16);
    var g2=ctx.createLinearGradient(0,hy,0,h); g2.addColorStop(0,rgba(acc,0.6)); g2.addColorStop(1,rgba(GROUND,0.96));
    ctx.fillStyle=g2; ctx.fillRect(0,hy,w,h-hy);
    ctx.lineWidth=1; var n=3+Math.floor(R()*4);
    for(var i=0;i<n;i++){var y=hy+(h-hy)*(0.12+0.7*i/n), x0=w*(0.05+R()*0.3), x1=w*(0.6+R()*0.38);
      ctx.strokeStyle=rgba(i%2?CREAM:GOLD,0.28+R()*0.2); ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();}
  }
  // 霧の山
  function mist(ctx,R,w,h,acc){
    if(R()<0.7){var sr=w*(0.05+R()*0.06); ctx.fillStyle='rgba(235,227,211,0.6)'; ctx.beginPath(); ctx.arc(w*(0.2+R()*0.6),h*(0.14+R()*0.14),sr,0,TAU); ctx.fill();}
    var layers=4+Math.floor(R()*3);
    for(var i=0;i<layers;i++){
      var t=i/(layers-1), base=h*(0.36+0.5*t), amp=h*(0.04+R()*0.07), f1=0.8+R()*1.6, f2=2+R()*3, p1=R()*TAU, p2=R()*TAU;
      ctx.beginPath(); ctx.moveTo(0,h);
      for(var x=0;x<=w;x+=3){var y=base+Math.sin(x/w*TAU*f1+p1)*amp+Math.sin(x/w*TAU*f2+p2)*amp*0.35; ctx.lineTo(x,y);}
      ctx.lineTo(w,h); ctx.closePath();
      var top=mix(CREAM,acc,t), g=ctx.createLinearGradient(0,base-amp,0,h);
      g.addColorStop(0,rgba(top,0.22+0.45*t)); g.addColorStop(1,rgba(GROUND,0.55));
      ctx.fillStyle=g; ctx.fill();
    }
  }
  // 波
  function waves(ctx,R,w,h,acc){
    var n=12+Math.floor(R()*10), top=h*(0.32+R()*0.2), f=0.8+R()*1.6, ph=R()*TAU;
    var r=w*(0.1+R()*0.1); ctx.strokeStyle='rgba(235,227,211,0.7)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(w*(0.3+R()*0.4),top*0.55,r,0,TAU); ctx.stroke();
    ctx.lineWidth=1;
    for(var i=0;i<n;i++){var t=i/(n-1), y0=top+(h-top)*t, amp=h*0.008+h*0.06*t, a=0.14+0.42*(1-t);
      ctx.strokeStyle=i%3===0?rgba(GOLD,a):rgba(CREAM,a*0.8);
      ctx.beginPath();
      for(var x=0;x<=w;x+=3){var y=y0+Math.sin(x/w*TAU*f+ph+t*3)*amp; if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);}
      ctx.stroke();}
  }
  // 円環
  function rings(ctx,R,w,h,acc){
    var cx=w*(0.3+R()*0.4), cy=h*(0.34+R()*0.3), n=5+Math.floor(R()*5), maxR=Math.max(w,h)*(0.45+R()*0.3);
    for(var i=1;i<=n;i++){var r=maxR*i/n, gap=R()*1.6, s=R()*TAU;
      ctx.lineWidth=i%2?1:1.6; ctx.strokeStyle=i%3===0?rgba(GOLD,0.6):rgba(CREAM,0.34);
      ctx.beginPath(); ctx.arc(cx,cy,r,s,s+TAU-gap); ctx.stroke();}
    ctx.fillStyle=rgba(mix(acc,CREAM,0.25),0.95); ctx.beginPath(); ctx.arc(cx,cy,w*(0.03+R()*0.04),0,TAU); ctx.fill();
    var ang=R()*Math.PI; ctx.strokeStyle=rgba(CREAM,0.45); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*w*2,cy-Math.sin(ang)*w*2); ctx.lineTo(cx+Math.cos(ang)*w*2,cy+Math.sin(ang)*w*2); ctx.stroke();
  }
  // 点の格子
  function dots(ctx,R,w,h,acc){
    var step=w/(9+Math.floor(R()*6)), fx=w*(0.2+R()*0.6), fy=h*(0.2+R()*0.6), rad=Math.max(w,h)*(0.5+R()*0.4);
    for(var y=step/2;y<h;y+=step)for(var x=step/2;x<w;x+=step){
      var d=Math.min(1,Math.hypot(x-fx,y-fy)/rad), r=Math.max(0.35,(1-d)*step*0.3);
      ctx.fillStyle=d<0.22?rgba(GOLD,0.9):rgba(CREAM,0.2+0.55*(1-d));
      ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();}
    ctx.strokeStyle=rgba(GOLD,0.7); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(R()<0.5?0:w,h*(0.7+R()*0.3),w*(0.5+R()*0.4),0,TAU); ctx.stroke();
  }
  // 帯
  function bands(ctx,R,w,h,acc){
    var n=3+Math.floor(R()*3), y=h*(0.15+R()*0.2);
    for(var i=0;i<n;i++){var bh=h*(0.06+R()*0.14), t=i/(n-1);
      var g=ctx.createLinearGradient(0,y,w,y); g.addColorStop(0,rgba(mix(acc,CREAM,t*0.5),0.05)); g.addColorStop(0.5,rgba(mix(acc,CREAM,t*0.5),0.55)); g.addColorStop(1,rgba(mix(acc,CREAM,t*0.5),0.05));
      ctx.fillStyle=g; ctx.fillRect(0,y,w,bh); y+=bh+h*(0.04+R()*0.08);}
    var r=w*(0.08+R()*0.08); ctx.fillStyle=rgba(CREAM,0.9); ctx.beginPath(); ctx.arc(w*(0.2+R()*0.6),h*(0.65+R()*0.2),r,0,TAU); ctx.fill();
  }
  var MOTIFS=[moon,mist,waves,rings,dots,bands];

  function grain(ctx,w,h,R){
    var c=document.createElement('canvas'), gw=Math.max(1,Math.round(w/2)), gh=Math.max(1,Math.round(h/2));
    c.width=gw; c.height=gh; var g=c.getContext('2d'), img=g.createImageData(gw,gh), d=img.data;
    for(var i=0;i<d.length;i+=4){var v=(R()*255)|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=34;}
    g.putImageData(img,0,0);
    ctx.save(); ctx.globalCompositeOperation='overlay'; ctx.imageSmoothingEnabled=false; ctx.drawImage(c,0,0,w,h); ctx.restore();
  }
  function vignette(ctx,w,h){
    var g=ctx.createRadialGradient(w/2,h*0.45,Math.min(w,h)*0.28,w/2,h/2,Math.max(w,h)*0.78);
    g.addColorStop(0,rgba(GROUND,0)); g.addColorStop(1,rgba(GROUND,0.7)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  }

  function draw(canvas,seed,w,h){
    var dpr=Math.min(window.devicePixelRatio||1,3);
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px';
    var ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
    var R=rng(hash(String(seed)));
    var acc=ACCENTS[Math.floor(R()*ACCENTS.length)];
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2c2822'); g.addColorStop(1,'#1b1916'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    var hx=w*(0.2+R()*0.6), hy=h*(0.15+R()*0.5);
    g=ctx.createRadialGradient(hx,hy,0,hx,hy,Math.max(w,h)*0.7); g.addColorStop(0,rgba(acc,0.4)); g.addColorStop(1,rgba(acc,0)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    MOTIFS[Math.floor(R()*MOTIFS.length)](ctx,R,w,h,acc);
    grain(ctx,w,h,R);
    vignette(ctx,w,h);
  }
  window.IchiyoArt={draw:draw};
})();
