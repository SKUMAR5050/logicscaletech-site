(function(){
var files=[],list=document.getElementById('list'),go=document.getElementById('go'),fmt=document.getElementById('fmt'),q=document.getElementById('q'),qw=document.getElementById('qw');
var EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
function render(){list.innerHTML='';files.forEach(function(f,i){var li=document.createElement('li');li.innerHTML='<span class="name"></span><span class="meta"></span><button aria-label="Remove">✕</button>';li.querySelector('.name').textContent=f.name;li.querySelector('.meta').textContent=T.fmt(f.size);li.querySelector('button').onclick=function(){files.splice(i,1);render()};list.appendChild(li)});go.disabled=!files.length}
function sync(){qw.style.display=fmt.value==='image/png'?'none':''}
fmt.addEventListener('change',sync);sync();
T.drop(document.getElementById('drop'),document.getElementById('file'),function(fs){files=files.concat(fs.filter(function(f){return /^image\//.test(f.type)}));render();T.msg('')});
go.onclick=async function(){
 var type=fmt.value,qual=Math.min(1,Math.max(0.1,(parseInt(q.value,10)||90)/100));
 go.disabled=true;T.msg('Working…');list.innerHTML='';
 for(var i=0;i<files.length;i++){
  var f=files[i];
  try{
   var r=await T.readImg(f),img=r.img,c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
   var x=c.getContext('2d');if(type==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}
   x.drawImage(img,0,0);URL.revokeObjectURL(r.url);
   var blob=await T.toBlob(c,type,type==='image/png'?undefined:qual);
   if(!blob||blob.type!==type){throw new Error('This browser cannot make '+EXT[type].toUpperCase()+' files. Try JPG or PNG.')}
   var name=T.base(f.name)+'.'+EXT[type],li=document.createElement('li');
   li.innerHTML='<span class="name"></span><span class="meta"></span><button>Download</button>';
   li.querySelector('.name').textContent=name;li.querySelector('.meta').textContent=T.fmt(f.size)+' → '+T.fmt(blob.size);
   (function(b,n){li.querySelector('button').onclick=function(){T.download(b,n)}})(blob,name);list.appendChild(li);
  }catch(e){var l2=document.createElement('li');l2.textContent=f.name+': '+e.message;list.appendChild(l2)}
 }
 T.msg('Done. Tap Download next to each file.');go.disabled=false;
};
})();
