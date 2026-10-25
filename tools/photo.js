(function(){
// Sizes are the same ones built into the ScanOrbit app.
var INCH=25.4,cfg=window.CFG||{};
var P=[
 ['us','Popular','USA passport & visa',2*INCH,2*INCH,600,600,0,240,'photo'],
 ['in','Popular','India visa & passport (abroad)',2*INCH,2*INCH,0,0,0,0,'photo'],
 ['uk','Popular','UK passport',35,45,0,0,0,0,'photo'],
 ['schengen','Popular','Schengen visa (Europe)',35,45,0,0,0,0,'photo'],
 ['ca-passport','More countries','Canada passport',50,70,0,0,0,0,'photo'],
 ['ca-visa','More countries','Canada visa',35,45,0,0,0,0,'photo'],
 ['au','More countries','Australia passport',35,45,0,0,0,0,'photo'],
 ['ae','More countries','UAE visa',43,55,0,0,0,0,'photo'],
 ['cn','More countries','China visa',33,48,0,0,0,0,'photo'],
 ['jp','More countries','Japan visa',45,45,0,0,0,0,'photo'],
 ['ssc','India exams','SSC exam photo',35,45,0,0,20,50,'photo'],
 ['bank-photo','India exams','Bank exam photo (IBPS / SBI)',35,40.25,200,230,20,50,'photo'],
 ['bank-sign','India exams','Bank exam signature (IBPS / SBI)',35,15,140,60,10,20,'other'],
 ['bank-thumb','India exams','Bank exam left thumb print',30,30,240,240,20,50,'other'],
 ['bank-note','India exams','Bank exam handwritten declaration',100,50,800,400,50,100,'other'],
 ['ssc-sign','India exams','SSC signature',60,20,0,0,10,20,'other'],
 ['upsc','India exams','UPSC photo',50,50,600,600,20,200,'photo'],
 ['nta','India exams','NEET / JEE passport photo',35,45,0,0,10,200,'photo'],
 ['neet-post','India exams','NEET postcard photo',4*INCH,6*INCH,0,0,10,200,'other'],
 ['std','Other','Standard photo',35,45,0,0,0,0,'photo']
].map(function(a){return{id:a[0],group:a[1],title:a[2],wMM:a[3],hMM:a[4],pw:a[5],ph:a[6],minKB:a[7],maxKB:a[8],kind:a[9]}});
var groups=cfg.groups||['Popular','More countries','India exams','Other'];
var sel=document.getElementById('preset'),info=document.getElementById('info'),file=document.getElementById('file'),go=document.getElementById('go'),list=document.getElementById('list'),fit=document.getElementById('fit'),cw=document.getElementById('cw'),ch=document.getElementById('ch'),ck=document.getElementById('ck'),custom=document.getElementById('custom');
var items=P.filter(function(p){return groups.indexOf(p.group)>-1});
var cur=null;groups.forEach(function(g){var og=document.createElement('optgroup');og.label=g;items.filter(function(p){return p.group===g}).forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.title;og.appendChild(o)});if(og.children.length)sel.appendChild(og)});
if(cfg.custom){var oc=document.createElement('option');oc.value='custom';oc.textContent='My own size (pixels and KB)';sel.appendChild(oc)}
function target(p){if(p.pw)return{w:p.pw,h:p.ph};return{w:Math.round(p.wMM/INCH*300),h:Math.round(p.hMM/INCH*300)}}
function describe(p){var t=target(p),s=t.w+' × '+t.h+' px';if(p.minKB||p.maxKB)s+=' · '+(p.minKB?p.minKB+'–':'up to ')+p.maxKB+' KB';return s}
function pick(){var id=sel.value;custom.style.display=id==='custom'?'flex':'none';
 if(id==='custom'){cur=null;info.textContent='Type the width and height in pixels and the largest file size in KB.';fit.value='crop';return}
 cur=P.filter(function(p){return p.id===id})[0];info.textContent='Output: '+describe(cur)+(cur.pw?'':' (print size at 300 dpi)');fit.value=cur.kind==='other'?'fit':'crop'}
sel.addEventListener('change',pick);
var chosen=null;
T.drop(document.getElementById('drop'),file,function(fs){chosen=fs.filter(function(f){return /^image\//.test(f.type)})[0]||null;list.innerHTML='';if(chosen){var li=document.createElement('li');li.innerHTML='<span class="name"></span><span class="meta"></span>';li.querySelector('.name').textContent=chosen.name;li.querySelector('.meta').textContent=T.fmt(chosen.size);list.appendChild(li)}go.disabled=!chosen;T.msg('')});
async function encode(img,w,h,mode,maxB,minB){
 function paint(q,scale){var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.imageSmoothingQuality='high';
  var iw=img.naturalWidth,ih=img.naturalHeight,s=mode==='crop'?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);s*=scale;var dw=iw*s,dh=ih*s;x.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);return c}
 var c=paint(0,1),top=await T.toBlob(c,'image/jpeg',0.95);
 if(!maxB||top.size<=maxB){return {blob:top,note:(minB&&top.size<minB)?'The file is smaller than '+Math.round(minB/1024)+' KB because the picture is small. Use a larger photo.':''}}
 var lo=0.05,hi=0.95,ok=null,low=await T.toBlob(c,'image/jpeg',lo);
 if(low.size>maxB)return {blob:low,note:'Could not reach '+Math.round(maxB/1024)+' KB at this pixel size. Try a simpler photo.'};
 for(var k=0;k<8;k++){var mid=(lo+hi)/2,b=await T.toBlob(c,'image/jpeg',mid);if(b.size<=maxB){ok=b;lo=mid}else hi=mid}
 var note='';if(minB&&ok.size<minB)note='The file is '+T.fmt(ok.size)+', a little under the '+Math.round(minB/1024)+' KB minimum. Use a photo with more detail.';
 return {blob:ok,note:note};
}
go.onclick=async function(){
 var w,h,maxB=0,minB=0;
 if(sel.value==='custom'){w=parseInt(cw.value,10);h=parseInt(ch.value,10);var k=parseInt(ck.value,10);if(!(w>0&&h>0)){T.msg('Enter the width and height in pixels.',true);return}maxB=k>0?k*1024:0}
 else{var t=target(cur);w=t.w;h=t.h;maxB=(cur.maxKB||0)*1024;minB=(cur.minKB||0)*1024}
 go.disabled=true;T.msg('Working…');
 try{var r=await T.readImg(chosen);URL.revokeObjectURL(r.url);var o=await encode(r.img,w,h,fit.value,maxB,minB);
  list.innerHTML='';var li=document.createElement('li');li.innerHTML='<img alt=""><span class="name"></span><span class="meta"></span><button>Download</button>';
  var u=URL.createObjectURL(o.blob);li.querySelector('img').src=u;var nm=T.base(chosen.name)+'-'+w+'x'+h+'.jpg';
  li.querySelector('.name').textContent=nm;li.querySelector('.meta').textContent=w+'×'+h+' px · '+T.fmt(o.blob.size);li.querySelector('button').onclick=function(){T.download(o.blob,nm)};list.appendChild(li);
  T.msg(o.note||'Done. Tap Download.',!!o.note);
 }catch(e){T.msg(e.message,true)}
 go.disabled=false;
};
pick();
})();
