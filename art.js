/* 一日一頁 — その日の一枚。
   日付から画風（12種）と枠（5種）を巡回で決め、日付+漢字を種にして細部を決める。
   連続する日は必ず別の画風・別の枠になる。 */
(function(){
  'use strict';

  function hash(str){
    var h1=0xdeadbeef|0, h2=0x41c6ce57|0;
    for(var i=0;i<str.length;i++){var ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677);}
    h1=Math.imul(h1^(h1>>>16),2246822507); h1^=Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507); h2^=Math.imul(h1^(h1>>>13),3266489909);
    return ((h1>>>0)^(h2>>>0))>>>0;
  }
  function rng(seed){var a=seed>>>0; return function(){a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};}
  var TAU=Math.PI*2;
  function rgba(c,a){return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
  function hex(c){return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}
  function mix(a,b,t){return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)];}
  function pick(R,arr){return arr[Math.floor(R()*arr.length)];}

  // ---------- 色 ----------
  var PAPER ={name:'paper',  light:true, ground:[239,231,214], ink:[42,38,34],    acc:[180,70,58],   extra:[[47,74,110],[120,110,90],[196,160,90]]};
  var DARKS=[
    {name:'warm',   ground:[36,33,27],   ink:[235,227,211], acc:[201,169,97],  extra:[[122,74,74],[90,102,80],[110,107,122]]},
    {name:'indigo', ground:[28,36,55],   ink:[230,226,214], acc:[201,169,97],  extra:[[75,90,122],[160,120,110],[120,140,150]]},
    {name:'oxblood',ground:[58,35,35],   ink:[236,220,200], acc:[217,178,106], extra:[[122,74,74],[90,80,70],[170,120,100]]},
    {name:'moss',   ground:[38,43,34],   ink:[227,230,213], acc:[201,169,97],  extra:[[90,102,80],[150,140,110],[70,90,90]]},
    {name:'slate',  ground:[38,40,45],   ink:[226,225,220], acc:[163,90,74],   extra:[[110,107,122],[96,78,104],[130,140,150]]}
  ];

  // ---------- 下地・仕上げ ----------
  function paper(ctx,R,w,h,P){
    ctx.save(); ctx.strokeStyle=rgba(P.ink,0.07); ctx.lineWidth=1;
    var n=Math.round(w*h/700);
    for(var i=0;i<n;i++){var x=R()*w,y=R()*h,l=2+R()*9,a=R()*TAU; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); ctx.stroke();}
    ctx.restore();
  }
  function grain(ctx,w,h,R,alpha){
    var c=document.createElement('canvas'), gw=Math.max(1,Math.round(w/2)), gh=Math.max(1,Math.round(h/2));
    c.width=gw; c.height=gh; var g=c.getContext('2d'), img=g.createImageData(gw,gh), d=img.data;
    for(var i=0;i<d.length;i+=4){var v=(R()*255)|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=alpha;}
    g.putImageData(img,0,0);
    ctx.save(); ctx.globalCompositeOperation='overlay'; ctx.imageSmoothingEnabled=false; ctx.drawImage(c,0,0,w,h); ctx.restore();
  }
  function vignette(ctx,w,h,P){
    var g=ctx.createRadialGradient(w/2,h*0.45,Math.min(w,h)*0.28,w/2,h/2,Math.max(w,h)*0.78);
    g.addColorStop(0,rgba(P.ground,0)); g.addColorStop(1,rgba(P.ground,0.7)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  }
  function haze(ctx,R,w,h,P){
    var c=pick(R,[P.acc].concat(P.extra)), hx=w*(0.2+R()*0.6), hy=h*(0.15+R()*0.5);
    var g=ctx.createRadialGradient(hx,hy,0,hx,hy,Math.max(w,h)*0.7); g.addColorStop(0,rgba(c,0.4)); g.addColorStop(1,rgba(c,0));
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  }

  // ---------- 画風 ----------
  // 霧の山・月と水面
  function mist(ctx,R,w,h,P){
    var acc=pick(R,[P.acc].concat(P.extra));
    if(R()<0.5){
      var r=w*(0.22+R()*0.1), cx=w*(0.32+R()*0.36), cy=h*(0.28+R()*0.14);
      var g=ctx.createRadialGradient(cx-r*0.35,cy-r*0.35,r*0.05,cx,cy,r); g.addColorStop(0,rgba(P.ink,0.96)); g.addColorStop(1,rgba(mix(P.ink,P.ground,0.15),0.8));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill();
      var hy=h*(0.58+R()*0.16), g2=ctx.createLinearGradient(0,hy,0,h); g2.addColorStop(0,rgba(acc,0.6)); g2.addColorStop(1,rgba(P.ground,0.96));
      ctx.fillStyle=g2; ctx.fillRect(0,hy,w,h-hy); ctx.lineWidth=1;
      for(var i=0,n=3+Math.floor(R()*4);i<n;i++){var y=hy+(h-hy)*(0.12+0.7*i/n); ctx.strokeStyle=rgba(i%2?P.ink:P.acc,0.28+R()*0.2); ctx.beginPath(); ctx.moveTo(w*(0.05+R()*0.3),y); ctx.lineTo(w*(0.6+R()*0.38),y); ctx.stroke();}
    }else{
      if(R()<0.7){ctx.fillStyle=rgba(P.ink,0.6); ctx.beginPath(); ctx.arc(w*(0.2+R()*0.6),h*(0.14+R()*0.14),w*(0.05+R()*0.06),0,TAU); ctx.fill();}
      var layers=4+Math.floor(R()*3);
      for(var L=0;L<layers;L++){var t=L/(layers-1), base=h*(0.36+0.5*t), amp=h*(0.04+R()*0.07), f1=0.8+R()*1.6, f2=2+R()*3, p1=R()*TAU, p2=R()*TAU;
        ctx.beginPath(); ctx.moveTo(0,h); for(var x=0;x<=w;x+=3)ctx.lineTo(x,base+Math.sin(x/w*TAU*f1+p1)*amp+Math.sin(x/w*TAU*f2+p2)*amp*0.35); ctx.lineTo(w,h); ctx.closePath();
        var gg=ctx.createLinearGradient(0,base-amp,0,h); gg.addColorStop(0,rgba(mix(P.ink,acc,t),0.22+0.45*t)); gg.addColorStop(1,rgba(P.ground,0.55)); ctx.fillStyle=gg; ctx.fill();}
    }
  }
  // 平面構成
  function bauhaus(ctx,R,w,h,P){
    var cols=[P.ink,P.acc].concat(P.extra), n=3+Math.floor(R()*3);
    for(var i=0;i<n;i++){var c=pick(R,cols), t=Math.floor(R()*4), x=w*R(), y=h*R(), s=Math.min(w,h)*(0.22+R()*0.42);
      ctx.fillStyle=rgba(c,0.92); ctx.beginPath();
      if(t===0)ctx.arc(x,y,s/2,0,TAU);
      else if(t===1){ctx.moveTo(x,y);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s);ctx.closePath();}
      else if(t===2)ctx.rect(x-s/2,y-s*0.08,s,s*0.16);
      else {ctx.moveTo(x,y);ctx.arc(x,y,s,0,Math.PI/2);ctx.closePath();}
      ctx.fill();}
    var yy=h*R(); ctx.strokeStyle=rgba(P.ink,0.85); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(w,yy+(R()-0.5)*h*0.3); ctx.stroke();
    var ax=w*R(),ay=h*R(); ctx.beginPath(); ctx.moveTo(ax,0); ctx.lineTo(ax+(R()-0.5)*w*0.2,h); ctx.stroke();
  }
  // 墨
  function brush(ctx,R,ink,p0,p1,p2,width){
    var N=70, prev=null;
    for(var i=0;i<=N;i++){var t=i/N, x=(1-t)*(1-t)*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], y=(1-t)*(1-t)*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1];
      var wd=width*(0.2+Math.sin(t*Math.PI)*0.9)*(0.85+R()*0.3);
      if(prev){ctx.strokeStyle=rgba(ink,0.88); ctx.lineWidth=Math.max(0.5,wd); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(prev[0],prev[1]); ctx.lineTo(x,y); ctx.stroke();
        for(var d=0;d<3;d++){var off=(R()-0.5)*wd*1.7; ctx.strokeStyle=rgba(ink,0.22); ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(prev[0],prev[1]+off); ctx.lineTo(x,y+off); ctx.stroke();}}
      prev=[x,y];}
  }
  function inkwash(ctx,R,w,h,P){
    paper(ctx,R,w,h,P);
    for(var i=0,nw=1+Math.floor(R()*3);i<nw;i++){var x=w*R(), y=h*(0.2+R()*0.6), ang=R()*TAU, r=w*(0.1+R()*0.12);
      for(var s=0,steps=10+Math.floor(R()*12);s<steps;s++){x+=Math.cos(ang)*w*0.035; y+=Math.sin(ang)*w*0.035; ang+=(R()-0.5)*0.5; r*=0.96+R()*0.08;
        ctx.fillStyle=rgba(P.ink,0.025+R()*0.02); ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();}}
    for(var k=0,ns=1+Math.floor(R()*2);k<ns;k++)brush(ctx,R,P.ink,[w*(0.1+R()*0.3),h*(0.15+R()*0.5)],[w*(0.3+R()*0.4),h*(0.2+R()*0.6)],[w*(0.6+R()*0.35),h*(0.4+R()*0.5)],w*(0.025+R()*0.03));
    if(R()<0.5){ctx.fillStyle=rgba(P.acc,0.85); var sz=w*0.05; ctx.fillRect(w*(0.7+R()*0.15),h*(0.1+R()*0.15),sz,sz);}
  }
  // 円相
  function enso(ctx,R,w,h,P){
    paper(ctx,R,w,h,P);
    var cx=w/2+(R()-0.5)*w*0.1, cy=h/2+(R()-0.5)*h*0.1, r=Math.min(w,h)*(0.3+R()*0.08), start=R()*TAU, span=TAU*(0.82+R()*0.14), N=100, base=Math.min(w,h)*(0.05+R()*0.03), prev=null;
    for(var i=0;i<=N;i++){var t=i/N, a=start+t*span, rr=r*(1+(R()-0.5)*0.04), x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
      var lw=base*(0.3+0.9*Math.sin(Math.PI*Math.min(1,t*1.12)))*(0.85+R()*0.3);
      if(prev){ctx.strokeStyle=rgba(P.ink,0.9); ctx.lineWidth=Math.max(0.5,lw); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(prev[0],prev[1]); ctx.lineTo(x,y); ctx.stroke();
        for(var d=0;d<4;d++){var off=(R()-0.5)*lw*1.5, ox=Math.cos(a)*off, oy=Math.sin(a)*off; ctx.strokeStyle=rgba(P.ink,0.2); ctx.lineWidth=0.7; ctx.beginPath(); ctx.moveTo(prev[0]+ox,prev[1]+oy); ctx.lineTo(x+ox,y+oy); ctx.stroke();}}
      prev=[x,y];}
    ctx.fillStyle=rgba(P.ink,0.05); ctx.beginPath(); ctx.arc(cx+w*0.1,cy+h*0.15,r*0.7,0,TAU); ctx.fill();
  }
  // 銅版画（ハッチング）
  function hatch(ctx,R,w,h,P){
    var cx=w*(0.35+R()*0.3), cy=h*(0.3+R()*0.3), r=Math.min(w,h)*(0.28+R()*0.1), la=R()*TAU, lx=Math.cos(la), ly=-Math.abs(Math.sin(la))-0.3, L=Math.hypot(lx,ly); lx/=L; ly/=L;
    var ang=R()*Math.PI, sp=Math.max(2.4,Math.min(w,h)/80), diag=Math.hypot(w,h);
    ctx.lineCap='round';
    for(var pass=0;pass<2;pass++){var a=ang+pass*Math.PI/3, dx=Math.cos(a),dy=Math.sin(a), nx=-dy, ny=dx;
      for(var o=-diag;o<diag;o+=sp){var prev=null;
        for(var t=-diag;t<diag;t+=2){var x=w/2+nx*o+dx*t, y=h/2+ny*o+dy*t; if(x<-2||y<-2||x>w+2||y>h+2){prev=null;continue;}
          var d=Math.hypot(x-cx,y-cy), shade;
          if(d<r){var z=Math.sqrt(1-(d/r)*(d/r)), nX=(x-cx)/r, nY=(y-cy)/r; shade=1-Math.max(0,nX*lx+nY*ly+z*0.6);} else shade=0.2+0.35*(y/h);
          var lw=pass===0?shade*2.2:Math.max(0,(shade-0.5)*2.6);
          if(lw>0.15&&prev){ctx.strokeStyle=rgba(P.ink,Math.min(1,0.3+shade)); ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(prev[0],prev[1]); ctx.lineTo(x,y); ctx.stroke();}
          prev=[x,y];}}}
  }
  // 網点
  function halftone(ctx,R,w,h,P){
    var ang=(10+R()*35)*Math.PI/180, step=Math.max(3.5,Math.min(w,h)/(20+R()*10)), diag=Math.hypot(w,h);
    var fx=w*(0.25+R()*0.5), fy=h*(0.25+R()*0.5), rad=Math.max(w,h)*(0.55+R()*0.3), by=h*(0.5+R()*0.3), cols=[P.ink,P.acc];
    for(var c=0;c<2;c++){var a=ang+c*Math.PI/6, dx=Math.cos(a),dy=Math.sin(a), nx=-dy, ny=dx; ctx.fillStyle=rgba(cols[c],c?0.85:0.95);
      for(var o=-diag;o<diag;o+=step)for(var t=-diag;t<diag;t+=step){var x=w/2+nx*o+dx*t, y=h/2+ny*o+dy*t; if(x<-step||y<-step||x>w+step||y>h+step)continue;
        var v=c===0?1-Math.min(1,Math.hypot(x-fx,y-fy)/rad):Math.max(0,1-Math.abs(y-by)/(h*0.22)), r=v*step*0.55;
        if(r>0.3){ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();}}}
  }
  // 織物
  function weave(ctx,R,w,h,P){
    var cols=[P.ink,P.acc].concat(P.extra), x=0, y=0;
    while(x<w){var sw=w*(0.03+R()*0.12); ctx.fillStyle=rgba(pick(R,cols),0.5+R()*0.45); ctx.fillRect(x,0,sw,h); x+=sw;}
    while(y<h){var sh=h*(0.03+R()*0.12); ctx.fillStyle=rgba(pick(R,cols),0.35+R()*0.3); ctx.fillRect(0,y,w,sh); y+=sh;}
    ctx.strokeStyle=rgba(P.ground,0.35); ctx.lineWidth=1;
    for(var i=1.5;i<w;i+=3){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();}
    for(var j=1.5;j<h;j+=3){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(w,j);ctx.stroke();}
  }
  // 星図
  function stars(ctx,R,w,h,P){
    var g=ctx.createRadialGradient(w*0.5,h*0.95,0,w*0.5,h*0.95,h); g.addColorStop(0,rgba(P.acc,0.2)); g.addColorStop(1,rgba(P.acc,0)); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    for(var i=0,n=70+Math.floor(R()*60);i<n;i++){ctx.fillStyle=rgba(P.ink,0.3+R()*0.7); ctx.beginPath(); ctx.arc(R()*w,R()*h,R()*R()*1.8+0.3,0,TAU); ctx.fill();}
    var pts=[]; for(var j=0,m=5+Math.floor(R()*5);j<m;j++)pts.push([w*(0.15+R()*0.7),h*(0.12+R()*0.7)]);
    ctx.strokeStyle=rgba(P.ink,0.55); ctx.lineWidth=0.8; ctx.beginPath(); pts.forEach(function(p,i){if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);}); ctx.stroke();
    pts.forEach(function(p){ctx.fillStyle=rgba(P.acc,0.95); ctx.beginPath(); ctx.arc(p[0],p[1],2.2,0,TAU); ctx.fill(); ctx.strokeStyle=rgba(P.acc,0.5); ctx.beginPath(); ctx.arc(p[0],p[1],5,0,TAU); ctx.stroke();});
    ctx.strokeStyle=rgba(P.ink,0.25); ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(w*0.5,h*0.55,w*0.6,h*0.25,(R()-0.5)*0.6,0,TAU); ctx.stroke();
    if(R()<0.6){var mx=w*(0.2+R()*0.6),my=h*(0.15+R()*0.2),mr=w*0.06; ctx.fillStyle=rgba(P.ink,0.95); ctx.beginPath(); ctx.arc(mx,my,mr,0,TAU); ctx.fill(); ctx.fillStyle=hex(P.ground); ctx.beginPath(); ctx.arc(mx+mr*0.45,my-mr*0.2,mr*0.9,0,TAU); ctx.fill();}
  }
  // 切り絵
  function collage(ctx,R,w,h,P){
    var cols=[P.ink,P.acc].concat(P.extra,[mix(P.ink,P.ground,0.5)]);
    for(var i=0,n=5+Math.floor(R()*4);i<n;i++){var cx=w*R(), cy=h*R(), rx=w*(0.15+R()*0.3), ry=h*(0.12+R()*0.3), k=8+Math.floor(R()*6);
      ctx.save(); ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3; ctx.fillStyle=rgba(pick(R,cols),0.85+R()*0.15);
      ctx.beginPath(); for(var j=0;j<k;j++){var a=j/k*TAU, jr=0.8+R()*0.4, x=cx+Math.cos(a)*rx*jr, y=cy+Math.sin(a)*ry*jr; if(j)ctx.lineTo(x,y); else ctx.moveTo(x,y);} ctx.closePath(); ctx.fill(); ctx.restore();}
    paper(ctx,R,w,h,P);
  }
  // 等高線
  var MS={1:[3,2],2:[1,2],3:[3,1],4:[0,1],5:[0,3,1,2],6:[0,2],7:[0,3],8:[0,3],9:[0,2],10:[0,1,3,2],11:[0,1],12:[3,1],13:[1,2],14:[3,2]};
  function contour(ctx,R,w,h,P){
    var peaks=[]; for(var i=0,np=2+Math.floor(R()*3);i<np;i++)peaks.push([w*R(),h*R(),Math.min(w,h)*(0.2+R()*0.35),0.6+R()*0.8]);
    var cell=Math.max(2.5,Math.min(w,h)/64), cols=Math.ceil(w/cell)+1, rows=Math.ceil(h/cell)+1, grid=new Float32Array(cols*rows), maxv=0;
    for(var j=0;j<rows;j++)for(var c=0;c<cols;c++){var x=c*cell,y=j*cell,v=0; for(var p=0;p<peaks.length;p++){var q=peaks[p],d2=((x-q[0])*(x-q[0])+(y-q[1])*(y-q[1]))/(q[2]*q[2]); v+=q[3]*Math.exp(-d2);} grid[j*cols+c]=v; if(v>maxv)maxv=v;}
    var levels=10+Math.floor(R()*6); ctx.lineWidth=1;
    for(var L=1;L<=levels;L++){var lv=maxv*L/(levels+1); ctx.strokeStyle=L%4===0?rgba(P.acc,0.85):rgba(P.ink,0.45); ctx.beginPath();
      for(var jj=0;jj<rows-1;jj++)for(var ii=0;ii<cols-1;ii++){var a=grid[jj*cols+ii],b=grid[jj*cols+ii+1],cc=grid[(jj+1)*cols+ii+1],d=grid[(jj+1)*cols+ii];
        var idx=(a>lv?8:0)|(b>lv?4:0)|(cc>lv?2:0)|(d>lv?1:0); if(idx===0||idx===15)continue;
        var x0=ii*cell,y0=jj*cell, E=[[x0+cell*(lv-a)/(b-a),y0],[x0+cell,y0+cell*(lv-b)/(cc-b)],[x0+cell*(lv-d)/(cc-d),y0+cell],[x0,y0+cell*(lv-a)/(d-a)]], segs=MS[idx];
        for(var s=0;s<segs.length;s+=2){ctx.moveTo(E[segs[s]][0],E[segs[s]][1]); ctx.lineTo(E[segs[s+1]][0],E[segs[s+1]][1]);}}
      ctx.stroke();}
    ctx.fillStyle=rgba(P.acc,0.9); peaks.forEach(function(q){ctx.beginPath(); ctx.arc(q[0],q[1],2,0,TAU); ctx.fill();});
  }
  // 波
  function waves(ctx,R,w,h,P){
    var n=12+Math.floor(R()*10), top=h*(0.32+R()*0.2), f=0.8+R()*1.6, ph=R()*TAU;
    ctx.strokeStyle=rgba(P.ink,0.7); ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(w*(0.3+R()*0.4),top*0.55,w*(0.1+R()*0.1),0,TAU); ctx.stroke(); ctx.lineWidth=1;
    for(var i=0;i<n;i++){var t=i/(n-1), y0=top+(h-top)*t, amp=h*0.008+h*0.06*t, a=0.14+0.42*(1-t); ctx.strokeStyle=i%3===0?rgba(P.acc,a):rgba(P.ink,a*0.8);
      ctx.beginPath(); for(var x=0;x<=w;x+=3){var y=y0+Math.sin(x/w*TAU*f+ph+t*3)*amp; if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke();}
  }
  // 円環
  function rings(ctx,R,w,h,P){
    var cx=w*(0.3+R()*0.4), cy=h*(0.34+R()*0.3), n=5+Math.floor(R()*5), maxR=Math.max(w,h)*(0.45+R()*0.3);
    for(var i=1;i<=n;i++){var r=maxR*i/n, gap=R()*1.6, s=R()*TAU; ctx.lineWidth=i%2?1:1.6; ctx.strokeStyle=i%3===0?rgba(P.acc,0.6):rgba(P.ink,0.34); ctx.beginPath(); ctx.arc(cx,cy,r,s,s+TAU-gap); ctx.stroke();}
    ctx.fillStyle=rgba(mix(pick(R,P.extra),P.ink,0.25),0.95); ctx.beginPath(); ctx.arc(cx,cy,w*(0.03+R()*0.04),0,TAU); ctx.fill();
    var ang=R()*Math.PI; ctx.strokeStyle=rgba(P.ink,0.45); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*w*2,cy-Math.sin(ang)*w*2); ctx.lineTo(cx+Math.cos(ang)*w*2,cy+Math.sin(ang)*w*2); ctx.stroke();
  }

  // 巡回の順。連続する日が似ないように並べてある（2026-09-13 が「霧の山」になる位置）
  var ORDER=[
    {name:'collage', fn:collage,  paperMaybe:true,  haze:false, grain:false, vignette:false},
    {name:'halftone',fn:halftone, paperMaybe:true,  haze:false, grain:false, vignette:false},
    {name:'enso',    fn:enso,     paper:true},
    {name:'contour', fn:contour,  paperMaybe:true,  haze:true,  grain:true,  vignette:false},
    {name:'rings',   fn:rings,    haze:true,  grain:true,  vignette:true},
    {name:'waves',   fn:waves,    haze:true,  grain:true,  vignette:true},
    {name:'mist',    fn:mist,     haze:true,  grain:true,  vignette:true},
    {name:'bauhaus', fn:bauhaus,  paperMaybe:true,  haze:false, grain:false, vignette:false},
    {name:'inkwash', fn:inkwash,  paper:true},
    {name:'stars',   fn:stars,    haze:false, grain:true,  vignette:true, indigo:true},
    {name:'weave',   fn:weave,    haze:false, grain:true,  vignette:false},
    {name:'hatch',   fn:hatch,    paperMaybe:true,  haze:false, grain:false, vignette:false}
  ];
  var FRAMES=['wide','arch','tondo','tall','square'];
  var EPOCH=Date.UTC(2026,8,7);
  function mod(n,m){return ((n%m)+m)%m;}
  function dayIndex(date){var p=date.split('-'); return Math.round((Date.UTC(+p[0],+p[1]-1,+p[2])-EPOCH)/86400000);}

  function plan(date,kanji){
    var seed=hash(date+kanji), R=rng(seed), di=dayIndex(date);
    var style=ORDER[mod(di,ORDER.length)], frame=FRAMES[mod(di,FRAMES.length)], pal;
    if(style.paper)pal=PAPER;
    else if(style.paperMaybe&&R()<0.35)pal=PAPER;
    else if(style.indigo&&R()<0.7)pal=DARKS[1];
    else pal=pick(R,DARKS);
    return {style:style.name, frame:frame, palette:pal.name, light:!!pal.light, seed:seed, _style:style, _pal:pal};
  }

  function draw(canvas,date,kanji,w,h){
    var p=plan(date,kanji), S=p._style, P=p._pal;
    var dpr=Math.min(window.devicePixelRatio||1,3);
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px';
    var ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
    var R=rng(p.seed^0x9e3779b9);
    if(P.light){ctx.fillStyle=hex(P.ground); ctx.fillRect(0,0,w,h);}
    else{var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,hex(mix(P.ground,[255,255,255],0.05))); g.addColorStop(1,hex(mix(P.ground,[0,0,0],0.2))); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);}
    if(!P.light&&S.haze)haze(ctx,R,w,h,P);
    S.fn(ctx,R,w,h,P);
    if(!P.light&&S.grain!==false)grain(ctx,w,h,R,34);
    if(P.light&&!S.paper)paper(ctx,R,w,h,P);
    if(!P.light&&S.vignette)vignette(ctx,w,h,P);
    return p;
  }
  window.IchiyoArt={draw:draw,plan:plan,FRAMES:FRAMES};
})();
