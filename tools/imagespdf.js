var items=[],list=document.getElementById('list'),go=document.getElementById('go');
function render(){list.innerHTML='';items.forEach(function(it,i){var li=document.createElement('li');
 li.innerHTML='<img alt=""><span class="name"></span><span class="meta"></span><button aria-label="Move up">↑</button><button aria-label="Move down">↓</button><button aria-label="Remove">✕</button>';
 li.querySelector('img').src=it.url;li.querySelector('.name').textContent=(i+1)+'. '+it.file.name;li.querySelector('.meta').textContent=T.fmt(it.file.size);
 var b=li.querySelectorAll('button');
 b[0].onclick=function(){if(i>0){var t=items[i];items[i]=items[i-1];items[i-1]=t;render()}};
 b[1].onclick=function(){if(i<items.length-1){var t=items[i];items[i]=items[i+1];items[i+1]=t;render()}};
 b[2].onclick=function(){URL.revokeObjectURL(it.url);items.splice(i,1);render()};
 list.appendChild(li)});go.disabled=!items.length}
T.drop(document.getElementById('drop'),document.getElementById('file'),function(fs){
 fs.filter(function(f){return /^image\//.test(f.type)}).forEach(function(f){items.push({file:f,url:URL.createObjectURL(f)})});render();T.msg('')});
go.onclick=async function(){
 go.disabled=true;T.msg('Building your PDF…');
 try{
  var pdf=await PDFLib.PDFDocument.create(),a4=document.getElementById('size').value==='a4';
  for(var i=0;i<items.length;i++){
   var r=await T.readImg(items[i].file),img=r.img,w=img.naturalWidth,h=img.naturalHeight;URL.revokeObjectURL(r.url);
   var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0);
   var jb=await T.toBlob(c,'image/jpeg',0.92),emb=await pdf.embedJpg(await jb.arrayBuffer());
   if(a4){var PW=595.28,PH=841.89,m=28,s=Math.min((PW-2*m)/w,(PH-2*m)/h),dw=w*s,dh=h*s,pg=pdf.addPage([PW,PH]);pg.drawImage(emb,{x:(PW-dw)/2,y:(PH-dh)/2,width:dw,height:dh})}
   else{var pg2=pdf.addPage([w,h]);pg2.drawImage(emb,{x:0,y:0,width:w,height:h})}
  }
  var bytes=await pdf.save();T.download(new Blob([bytes],{type:'application/pdf'}),'images.pdf');
  T.msg('Done. Your PDF ('+T.fmt(bytes.length)+') is downloading.');
 }catch(e){T.msg('Something went wrong: '+e.message,true)}
 go.disabled=!items.length;
};
