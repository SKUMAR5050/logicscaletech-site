(function(){
var T=window.T={};
T.fmt=function(b){return b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB'};
T.msg=function(t,err){var m=document.getElementById('msg');if(m){m.textContent=t;m.className='msg'+(err?' err':'')}};
T.download=function(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)};
T.drop=function(el,input,onFiles){
 el.addEventListener('click',function(){input.click()});
 el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});
 ['dragover','dragenter'].forEach(function(ev){el.addEventListener(ev,function(e){e.preventDefault();el.classList.add('over')})});
 ['dragleave','drop'].forEach(function(ev){el.addEventListener(ev,function(e){e.preventDefault();el.classList.remove('over')})});
 el.addEventListener('drop',function(e){onFiles(Array.from(e.dataTransfer.files))});
 input.addEventListener('change',function(){onFiles(Array.from(input.files));input.value=''});
};
T.readImg=function(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file);var i=new Image();i.onload=function(){res({img:i,url:u})};i.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Could not read '+file.name))};i.src=u})};
T.toBlob=function(c,type,q){return new Promise(function(r){c.toBlob(r,type,q)})};
T.buf=function(file){return file.arrayBuffer()};
T.base=function(n){return n.replace(/\.[^.]+$/,'')};
})();
