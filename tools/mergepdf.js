var items=[],list=document.getElementById('list'),go=document.getElementById('go');
function render(){list.innerHTML='';items.forEach(function(f,i){var li=document.createElement('li');
 li.innerHTML='<span class="name"></span><span class="meta"></span><button aria-label="Move up">↑</button><button aria-label="Move down">↓</button><button aria-label="Remove">✕</button>';
 li.querySelector('.name').textContent=(i+1)+'. '+f.name;li.querySelector('.meta').textContent=T.fmt(f.size);
 var b=li.querySelectorAll('button');
 b[0].onclick=function(){if(i>0){var t=items[i];items[i]=items[i-1];items[i-1]=t;render()}};
 b[1].onclick=function(){if(i<items.length-1){var t=items[i];items[i]=items[i+1];items[i+1]=t;render()}};
 b[2].onclick=function(){items.splice(i,1);render()};
 list.appendChild(li)});go.disabled=items.length<2}
T.drop(document.getElementById('drop'),document.getElementById('file'),function(fs){
 items=items.concat(fs.filter(function(f){return f.type==='application/pdf'||/\.pdf$/i.test(f.name)}));render();T.msg(items.length<2?'Add at least two PDFs.':'')});
go.onclick=async function(){
 go.disabled=true;T.msg('Merging…');
 try{
  var out=await PDFLib.PDFDocument.create();
  for(var i=0;i<items.length;i++){
   var src;try{src=await PDFLib.PDFDocument.load(await T.buf(items[i]))}catch(e){throw new Error(items[i].name+' could not be opened (it may be password-protected).')}
   var pages=await out.copyPages(src,src.getPageIndices());pages.forEach(function(p){out.addPage(p)});
  }
  var bytes=await out.save();T.download(new Blob([bytes],{type:'application/pdf'}),'merged.pdf');
  T.msg('Done. merged.pdf ('+out.getPageCount()+' pages, '+T.fmt(bytes.length)+') is downloading.');
 }catch(e){T.msg(e.message,true)}
 go.disabled=items.length<2;
};
