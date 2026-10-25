var files=[],list=document.getElementById('list'),go=document.getElementById('go');
function render(){list.innerHTML='';files.forEach(function(f,i){var li=document.createElement('li');li.innerHTML='<span class="name"></span><span class="meta"></span><button aria-label="Remove">✕</button>';li.querySelector('.name').textContent=f.name;li.querySelector('.meta').textContent=T.fmt(f.size);li.querySelector('button').onclick=function(){files.splice(i,1);render()};list.appendChild(li)});go.disabled=!files.length}
T.drop(document.getElementById('drop'),document.getElementById('file'),function(fs){files=files.concat(fs.filter(function(f){return /^image\//.test(f.type)}));render();T.msg('')});
async function shrink(file,target){
 var r=await T.readImg(file),img=r.img,w=img.naturalWidth,h=img.naturalHeight;URL.revokeObjectURL(r.url);
 var scale=1,best=null;
 for(var round=0;round<12;round++){
  var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
  var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
  var lo=0.1,hi=0.95,ok=null;
  var top=await T.toBlob(c,'image/jpeg',hi);
  if(top.size<=target){return top}
  var low=await T.toBlob(c,'image/jpeg',lo);
  if(low.size<=target){
   for(var k=0;k<7;k++){var mid=(lo+hi)/2;var b=await T.toBlob(c,'image/jpeg',mid);if(b.size<=target){ok=b;lo=mid}else{hi=mid}}
   return ok||low;
  }
  best=low;scale*=0.85;if(c.width<120)break;
 }
 return best;
}
go.onclick=async function(){
 var target=Math.max(5,parseInt(document.getElementById('kb').value,10)||100)*1024;
 go.disabled=true;T.msg('Working…');list.innerHTML='';
 for(var i=0;i<files.length;i++){
  var f=files[i];
  try{
   var out=await shrink(f,target),li=document.createElement('li'),name=T.base(f.name)+'-compressed.jpg';
   li.innerHTML='<span class="name"></span><span class="meta"></span><button>Download</button>';
   li.querySelector('.name').textContent=name;
   li.querySelector('.meta').textContent=T.fmt(f.size)+' → '+T.fmt(out.size);
   (function(o,n){li.querySelector('button').onclick=function(){T.download(o,n)}})(out,name);
   list.appendChild(li);
  }catch(e){var li2=document.createElement('li');li2.textContent=f.name+': '+e.message;list.appendChild(li2)}
 }
 T.msg('Done. Tap Download next to each file.');go.disabled=false;
};
