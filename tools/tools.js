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

/* feedback bar */
(function(){try{
var host=document.querySelector('main');var anchor=document.querySelector('section.app');if(!host||!anchor)return;
var st=document.createElement('style');st.textContent='.fb{margin:28px 0 0;padding:16px 18px;border:1px solid var(--line,#E3E0D8);border-radius:14px;background:#fff}.fb b{display:block;margin-bottom:10px}.fb button,.fb a.b{font:inherit;font-weight:600;font-size:14px;border:1px solid var(--line,#E3E0D8);background:#F5F3EE;color:#15171C;border-radius:10px;padding:9px 14px;margin:0 8px 8px 0;cursor:pointer;text-decoration:none;display:inline-block}.fb button:hover,.fb a.b:hover{border-color:#2F4BD6;color:#2F4BD6}.fb small{display:block;color:#5B616E;margin-top:2px}';document.head.appendChild(st);
var t=document.title.split('|')[0].trim();
function mail(sub,body){return 'mailto:support@logicscaletech.com?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body)}
var d=document.createElement('div');d.className='fb';d.setAttribute('role','group');d.setAttribute('aria-label','Feedback');
d.innerHTML='<b>Was this tool helpful?</b><span id="fbq"><button type="button" id="fby">Yes, it worked</button><button type="button" id="fbn">Not really</button></span><span id="fba"></span><small>Tell us what to fix or which tool to add next. Your files are never sent to us.</small>';
anchor.parentNode.insertBefore(d,anchor);
var q=d.querySelector('#fbq'),a=d.querySelector('#fba');
d.querySelector('#fby').onclick=function(){q.style.display='none';a.innerHTML='<p style="margin:0 0 8px">Thank you! Glad it helped.</p><a class="b" href="'+mail('Feedback: '+t,'What I liked or what tool I would like next:\n\n\nPage: '+location.href)+'">Suggest a tool or improvement</a>'};
d.querySelector('#fbn').onclick=function(){q.style.display='none';a.innerHTML='<p style="margin:0 0 8px">Sorry about that. Please tell us what went wrong.</p><a class="b" href="'+mail('Problem: '+t,'What went wrong (browser, phone or computer, file size):\n\n\nPage: '+location.href)+'">Report a problem</a>'};
}catch(e){}})();
