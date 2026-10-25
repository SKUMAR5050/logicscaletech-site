var file=null,src=null,go=document.getElementById('go'),list=document.getElementById('list'),info=document.getElementById('info');
T.drop(document.getElementById('drop'),document.getElementById('file'),async function(fs){
 var f=fs[0];if(!f)return;list.innerHTML='';T.msg('');
 try{src=await PDFLib.PDFDocument.load(await T.buf(f));file=f;info.textContent=f.name+' has '+src.getPageCount()+' pages.';go.disabled=false}
 catch(e){file=null;src=null;go.disabled=true;info.textContent='';T.msg('That PDF could not be opened (it may be password-protected).',true)}
});
function parse(s,n){
 var parts=s.split(',').map(function(p){return p.trim()}).filter(Boolean),res=[];
 parts.forEach(function(p){var m=p.match(/^(\d+)\s*-\s*(\d+)$/),a,b;
  if(m){a=+m[1];b=+m[2]}else if(/^\d+$/.test(p)){a=b=+p}else throw new Error('Cannot read "'+p+'". Use numbers like 1-3, 5.');
  if(a<1||b<a||b>n)throw new Error('Pages must be between 1 and '+n+': "'+p+'".');
  var idx=[];for(var i=a;i<=b;i++)idx.push(i-1);res.push({label:p,idx:idx})});
 if(!res.length)throw new Error('Enter the pages you want.');return res;
}
async function make(idx){var d=await PDFLib.PDFDocument.create(),ps=await d.copyPages(src,idx);ps.forEach(function(p){d.addPage(p)});return new Blob([await d.save()],{type:'application/pdf'})}
go.onclick=async function(){
 go.disabled=true;list.innerHTML='';T.msg('Working…');
 try{
  var parts=parse(document.getElementById('rng').value,src.getPageCount()),mode=document.getElementById('mode').value,base=T.base(file.name);
  var jobs=mode==='one'?[{label:'selected pages',idx:[].concat.apply([],parts.map(function(p){return p.idx}))}]:parts;
  for(var i=0;i<jobs.length;i++){
   var blob=await make(jobs[i].idx),name=base+(mode==='one'?'-extract':'-pages-'+jobs[i].label.replace(/\s+/g,''))+'.pdf';
   var li=document.createElement('li');li.innerHTML='<span class="name"></span><span class="meta"></span><button>Download</button>';
   li.querySelector('.name').textContent=name;li.querySelector('.meta').textContent=jobs[i].idx.length+' pages, '+T.fmt(blob.size);
   (function(b,n){li.querySelector('button').onclick=function(){T.download(b,n)}})(blob,name);list.appendChild(li);
  }
  T.msg('Done. Tap Download next to each file.');
 }catch(e){T.msg(e.message,true)}
 go.disabled=false;
};
