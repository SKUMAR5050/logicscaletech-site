(function(){
// Photo and signature resizer. Everything is done in the browser.
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
var sel=document.getElementById('preset'),info=document.getElementById('info'),file=document.getElementById('file'),go=document.getElementById('go'),list=document.getElementById('list'),fit=document.getElementById('fit'),custom=document.getElementById('custom');
var items=P.filter(function(p){return cfg.ids?cfg.ids.indexOf(p.id)>-1:groups.indexOf(p.group)>-1});
var cur=null;
groups.forEach(function(g){var og=document.createElement('optgroup');og.label=g;items.filter(function(p){return p.group===g}).forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.title;og.appendChild(o)});if(og.children.length)sel.appendChild(og)});
if(cfg.custom){var oc=document.createElement('option');oc.value='custom';oc.textContent='My own size (set pixels and KB myself)';if(cfg.start==='custom')sel.insertBefore(oc,sel.firstChild);else sel.appendChild(oc)}

// the "my own size" panel is built here, so every page gets the same controls
custom.className='row';
custom.innerHTML='<label class="f">Width<input type="number" id="cw" min="1" step="any" placeholder="e.g. 200"></label>'+
 '<label class="f">Height<input type="number" id="ch" min="1" step="any" placeholder="e.g. 230"></label>'+
 '<label class="f">Unit<select id="cu"><option value="px">pixels (px)</option><option value="cm">centimetres (cm)</option><option value="mm">millimetres (mm)</option><option value="in">inches</option></select></label>'+
 '<label class="f" id="cdl" style="display:none">DPI (print quality)<input type="number" id="cd" min="72" max="1200" value="300"></label>'+
 '<label class="f">Smallest file size (KB)<input type="number" id="cmin" min="0" step="any" placeholder="optional, e.g. 20"></label>'+
 '<label class="f">Largest file size (KB)<input type="number" id="ck" min="0" step="any" placeholder="optional, e.g. 50"></label>'+
 '<p class="msg" style="flex-basis:100%;margin:0">Copy the numbers from your exam notice. Leave width and height empty to keep the picture’s own pixels and change only the KB. If you fill only one of width or height, the other follows the picture’s shape.</p>';
var cw=document.getElementById('cw'),ch=document.getElementById('ch'),ck=document.getElementById('ck'),cmin=document.getElementById('cmin'),cu=document.getElementById('cu'),cd=document.getElementById('cd'),cdl=document.getElementById('cdl');
cu.addEventListener('change',function(){cdl.style.display=cu.value==='px'?'none':''});

function target(p){if(p.pw)return{w:p.pw,h:p.ph};return{w:Math.round(p.wMM/INCH*300),h:Math.round(p.hMM/INCH*300)}}
function describe(p){var t=target(p),s=t.w+' × '+t.h+' px';if(p.minKB||p.maxKB)s+=' · '+(p.minKB?p.minKB+'–':'up to ')+p.maxKB+' KB';return s}
function pick(){var id=sel.value;custom.style.display=id==='custom'?'flex':'none';
 if(id==='custom'){cur=null;info.textContent='Type the size from your notice. Make the file smaller or larger in KB, and set the size in pixels, cm, mm or inches.';fit.value='crop';return}
 cur=P.filter(function(p){return p.id===id})[0];info.textContent='Output: '+describe(cur)+(cur.pw?'':' (print size at 300 dpi)');fit.value=cur.kind==='other'?'fit':'crop'}
sel.addEventListener('change',pick);
var chosen=null;
T.drop(document.getElementById('drop'),file,function(fs){chosen=fs.filter(function(f){return /^image\//.test(f.type)})[0]||null;list.innerHTML='';if(chosen){var li=document.createElement('li');li.innerHTML='<span class="name"></span><span class="meta"></span>';li.querySelector('.name').textContent=chosen.name;li.querySelector('.meta').textContent='Original: '+T.fmt(chosen.size);list.appendChild(li)}go.disabled=!chosen;T.msg('')});

// make a JPEG bigger without changing how it looks: add harmless comment blocks after the file start
async function pad(blob,want){
 var u=new Uint8Array(await blob.arrayBuffer()),extra=want-u.length;if(extra<=0)return blob;
 var parts=[u.subarray(0,2)],left=extra;
 while(left>0){var pl=Math.min(65533,Math.max(1,left-4));var seg=new Uint8Array(4+pl);seg[0]=0xFF;seg[1]=0xFE;seg[2]=((pl+2)>>8)&255;seg[3]=(pl+2)&255;seg.fill(0x20,4);parts.push(seg);left-=seg.length}
 parts.push(u.subarray(2));return new Blob(parts,{type:'image/jpeg'})}

async function encode(img,w,h,mode,maxB,minB,canShrink){
 var notes=[];
 function paint(ww,hh){var c=document.createElement('canvas');c.width=ww;c.height=hh;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,ww,hh);x.imageSmoothingQuality='high';
  var iw=img.naturalWidth,ih=img.naturalHeight,s=mode==='crop'?Math.max(ww/iw,hh/ih):Math.min(ww/iw,hh/ih);var dw=iw*s,dh=ih*s;x.drawImage(img,(ww-dw)/2,(hh-dh)/2,dw,dh);return c}
 async function squeeze(c){ // best quality that stays under maxB, or null
  var low=await T.toBlob(c,'image/jpeg',0.05);if(low.size>maxB)return null;
  var lo=0.05,hi=0.95,ok=low;for(var k=0;k<9;k++){var mid=(lo+hi)/2,b=await T.toBlob(c,'image/jpeg',mid);if(b.size<=maxB){ok=b;lo=mid}else hi=mid}return ok}
 var cw0=w,ch0=h,c=paint(w,h),out=await T.toBlob(c,'image/jpeg',0.95);
 if(maxB&&out.size>maxB){
  var ok=await squeeze(c);
  if(!ok&&canShrink){var f=1;while(!ok&&f>0.1){f*=0.85;cw0=Math.max(8,Math.round(w*f));ch0=Math.max(8,Math.round(h*f));ok=await squeeze(paint(cw0,ch0))}
   if(ok)notes.push('To reach '+Math.round(maxB/1024)+' KB the picture was also made smaller, to '+cw0+' × '+ch0+' px.')}
  if(!ok){var l=await T.toBlob(paint(w,h),'image/jpeg',0.05);return{blob:l,w:w,h:h,note:'Could not reach '+Math.round(maxB/1024)+' KB at '+w+' × '+h+' px. Try a smaller pixel size or a simpler photo.',bad:true}}
  out=ok}
 if(minB&&out.size<minB){
  var want=minB+Math.min(2048,Math.round(minB*0.03)+256);if(maxB&&want>maxB)want=Math.round((minB+maxB)/2);
  var before=out.size;out=await pad(out,want);
  notes.push('The file was '+T.fmt(before)+', so it was made larger to '+T.fmt(out.size)+' by adding invisible padding. The picture looks the same.')}
 return{blob:out,w:cw0,h:ch0,note:notes.join(' '),bad:false}}

function num(e){var v=parseFloat(e.value);return v>0?v:0}
function toPx(v,u,dpi){return u==='px'?Math.round(v):Math.round(v/(u==='cm'?2.54:u==='mm'?25.4:1)*dpi)}

go.onclick=async function(){
 var maxB=0,minB=0,canShrink=false,w,h;
 go.disabled=true;T.msg('Working…');
 try{
  var r=await T.readImg(chosen);URL.revokeObjectURL(r.url);var img=r.img,ar=img.naturalWidth/img.naturalHeight;
  if(sel.value==='custom'){
   var uw=num(cw),uh=num(ch),dpi=Math.max(72,Math.min(1200,num(cd)||300)),mn=num(cmin),mx=num(ck);
   if(mn&&mx&&mn>mx){T.msg('The smallest size is bigger than the largest size. Please check the two KB boxes.',true);go.disabled=false;return}
   if(!uw&&!uh){w=img.naturalWidth;h=img.naturalHeight;canShrink=true}
   else if(uw&&uh){w=toPx(uw,cu.value,dpi);h=toPx(uh,cu.value,dpi)}
   else if(uw){w=toPx(uw,cu.value,dpi);h=Math.max(1,Math.round(w/ar))}
   else{h=toPx(uh,cu.value,dpi);w=Math.max(1,Math.round(h*ar))}
   if(w>8000||h>8000||w<8||h<8){T.msg('That size is not possible. Use between 8 and 8000 pixels.',true);go.disabled=false;return}
   maxB=Math.round(mx*1024);minB=Math.round(mn*1024);
   if(!maxB&&!minB&&!(uw||uh)){T.msg('Type a size in pixels or a file size in KB first.',true);go.disabled=false;return}
  }else{var t=target(cur);w=t.w;h=t.h;maxB=(cur.maxKB||0)*1024;minB=(cur.minKB||0)*1024}
  var o=await encode(img,w,h,fit.value,maxB,minB,canShrink);
  list.innerHTML='';var li=document.createElement('li');li.innerHTML='<img alt=""><span class="name"></span><span class="meta"></span><button>Download</button>';
  var u=URL.createObjectURL(o.blob);li.querySelector('img').src=u;var nm=T.base(chosen.name)+'-'+o.w+'x'+o.h+'.jpg';
  li.querySelector('.name').textContent=nm;li.querySelector('.meta').textContent=o.w+'×'+o.h+' px · '+T.fmt(o.blob.size)+' (was '+T.fmt(chosen.size)+')';li.querySelector('button').onclick=function(){T.download(o.blob,nm)};list.appendChild(li);
  T.msg(o.note||'Done. Tap Download.',o.bad);
 }catch(e){T.msg(e.message,true)}
 go.disabled=false;
};
if(cfg.def){cw.value=cfg.def[0];ch.value=cfg.def[1];ck.value=cfg.def[2]}
if(cfg.start&&Array.prototype.some.call(sel.options,function(o){return o.value===cfg.start}))sel.value=cfg.start;
pick();
})();
