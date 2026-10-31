(function(){
// QR maker for the free tools pages. Everything is drawn in the browser.
var cfg=window.CFG||{},type=document.getElementById('type'),fields=document.getElementById('fields'),cv=document.getElementById('cv'),bp=document.getElementById('png'),bs=document.getElementById('svg');
var TYPES=[['wifi','Wi-Fi'],['upi','UPI payment'],['contact','Contact (vCard)'],['whatsapp','WhatsApp chat'],['url','Website link'],['email','Email'],['sms','SMS text message'],['phone','Phone call'],['text','Message or text']];
var DEF={
 wifi:[['ssid','Wi-Fi name','text',''],['pass','Password (leave empty for an open network)','text','']],
 upi:[['upi','UPI ID','text','name@bank'],['name','Payee name (optional)','text',''],['amount','Amount in INR (optional)','text','']],
 contact:[['name','Full name','text','Full name'],['phone','Phone number (with +91)','text','+91'],['email','Email (optional)','text',''],['org','Company (optional)','text',''],['title','Job title (optional)','text',''],['url','Website (optional)','text','yourwebsite.com'],['adr','Address or city (optional)','text','']],
 whatsapp:[['wa','WhatsApp number','text','10-digit number, or with country code'],['msg','Ready message (optional)','textarea','Hello, I saw your QR code']],
 url:[['link','Website link','text','https://yourwebsite.com']],
 email:[['to','Email address','text','name@example.com'],['subject','Subject (optional)','text',''],['body','Message (optional)','textarea','']],
 sms:[['num','Phone number (with +91)','text','+91'],['msg','Message (optional)','textarea','']],
 phone:[['num','Phone number (with +91)','text','+91']],
 text:[['text','Message or text','textarea','Type a message, or anything']]
};
var COLORS=[['Black','#000000'],['Navy','#0B1B5C'],['Blue','#2F4BD6'],['Green','#0F5F3A'],['Maroon','#7A1F1F']];
var qrObj=null,qrData='';

function wifiEscape(t){return t.replace(/([\\;,:"])/g,'\\$1')}
function vEsc(t){return t.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n')}
function digits(t){return t.replace(/[^0-9]/g,'')}
function v(k){var e=fields.querySelector('[data-k="'+k+'"]');return e?e.value.trim():''}

function vcard(nl){
 var name=v('name');if(!name&&!v('phone'))return '';
 var parts=name.split(/\s+/).filter(Boolean),given=parts.length>1?parts.slice(0,-1).join(' '):parts[0]||'',fam=parts.length>1?parts[parts.length-1]:'';
 var L=['BEGIN:VCARD','VERSION:3.0','N:'+vEsc(fam)+';'+vEsc(given)+';;;','FN:'+vEsc(name||v('phone'))];
 if(v('org'))L.push('ORG:'+vEsc(v('org')));
 if(v('title'))L.push('TITLE:'+vEsc(v('title')));
 if(v('phone'))L.push('TEL;TYPE=CELL:'+v('phone').replace(/[^0-9+\-() ]/g,''));
 if(v('email'))L.push('EMAIL:'+v('email'));
 var u=v('url');if(u){if(!/^[a-z][a-z0-9+.\-]*:/i.test(u))u='https://'+u;L.push('URL:'+u)}
 if(v('adr'))L.push('ADR;TYPE=WORK:;;'+vEsc(v('adr'))+';;;;');
 L.push('END:VCARD');return L.join(nl||'\n');
}
function content(kind){
 if(kind==='wifi'){if(!v('ssid'))return '';var p=v('pass');return 'WIFI:T:'+(p?'WPA':'nopass')+';S:'+wifiEscape(v('ssid'))+';'+(p?'P:'+wifiEscape(p)+';':'')+';'}
 if(kind==='upi'){if(!/^[^\s@]+@[^\s@]+$/.test(v('upi')))return '';var out='upi://pay?pa='+encodeURIComponent(v('upi')).replace(/%40/g,'@');if(v('name'))out+='&pn='+encodeURIComponent(v('name'));var am=parseFloat(v('amount').replace(',','.'));if(am>0)out+='&am='+am.toFixed(2);return out+'&cu=INR'}
 if(kind==='contact')return vcard('\n');
 if(kind==='whatsapp'){var d=digits(v('wa'));if(d.length===10&&/^[6-9]/.test(d))d='91'+d;if(d.length<8)return '';return 'https://wa.me/'+d+(v('msg')?'?text='+encodeURIComponent(v('msg')):'')}
 if(kind==='url'){var u=v('link');if(!u)return '';if(!/^[a-z][a-z0-9+.\-]*:/i.test(u))u='https://'+u;return u}
 if(kind==='email'){var t=v('to');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))return '';var q=[];if(v('subject'))q.push('subject='+encodeURIComponent(v('subject')));if(v('body'))q.push('body='+encodeURIComponent(v('body')));return 'mailto:'+t+(q.length?'?'+q.join('&'):'')}
 if(kind==='sms'){var n=v('num').replace(/[^0-9+]/g,'');if(digits(n).length<5)return '';return 'SMSTO:'+n+':'+v('msg')}
 if(kind==='phone'){var n2=v('num').replace(/[^0-9+]/g,'');if(digits(n2).length<5)return '';return 'tel:'+n2}
 return v('text');
}
function utf8Bytes(text){var out='';for(var i=0;i<text.length;){var code=text.codePointAt(i);i+=code>0xffff?2:1;
 if(code<0x80)out+=String.fromCharCode(code);else if(code<0x800)out+=String.fromCharCode(0xc0|(code>>6),0x80|(code&63));
 else if(code<0x10000)out+=String.fromCharCode(0xe0|(code>>12),0x80|((code>>6)&63),0x80|(code&63));
 else out+=String.fromCharCode(0xf0|(code>>18),0x80|((code>>12)&63),0x80|((code>>6)&63),0x80|(code&63))}return out}

// extra controls (colour, safety level, PNG size) and the contact-file button
var opts=document.createElement('div');opts.className='row';opts.id='opts';
opts.innerHTML='<label class="f">Colour<select id="qcol">'+COLORS.map(function(c){return '<option value="'+c[1]+'">'+c[0]+'</option>'}).join('')+'</select></label>'+
 '<label class="f">Error correction<select id="qec"><option value="M">Normal (M)</option><option value="L">Small code (L)</option><option value="Q">Strong (Q)</option><option value="H">Strongest (H)</option></select></label>'+
 '<label class="f">PNG size<select id="qsz"><option value="512">512 px (web)</option><option value="1024" selected>1024 px (print)</option><option value="2048">2048 px (large print)</option></select></label>';
fields.parentNode.insertBefore(opts,fields.nextSibling);
var qcol=document.getElementById('qcol'),qec=document.getElementById('qec'),qsz=document.getElementById('qsz');
var vcf=document.createElement('button');vcf.className='btn ghost';vcf.id='vcf';vcf.type='button';vcf.textContent='Download contact file (.vcf)';vcf.style.display='none';vcf.disabled=true;
bs.parentNode.appendChild(vcf);
[qcol,qec].forEach(function(e){e.addEventListener('change',draw)});

// build the type list from this script, so every page offers every type
type.innerHTML=TYPES.map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>'}).join('');

function build(){fields.innerHTML='';DEF[type.value].forEach(function(f){
 var l=document.createElement('label');l.className='f';l.textContent=f[1];var el=document.createElement(f[2]==='textarea'?'textarea':'input');
 if(f[2]!=='textarea')el.type='text';else el.rows=3;el.placeholder=f[3];el.dataset.k=f[0];el.addEventListener('input',draw);l.appendChild(el);fields.appendChild(l)});
 vcf.style.display=type.value==='contact'?'':'none';draw()}

function paint(ctx,n,px,off,quiet,color){ctx.fillStyle=color;for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qrObj.isDark(r,c))ctx.fillRect(off+(c+quiet)*px,off+(r+quiet)*px,px,px)}
function draw(){
 var data=content(type.value),ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
 qrData=data;
 if(!data){qrObj=null;bp.disabled=bs.disabled=vcf.disabled=true;T.msg('Fill in the details to see your QR code.');return}
 try{var q=qrcode(0,qec.value);q.addData(utf8Bytes(data),'Byte');q.make();qrObj=q;
  var n=q.getModuleCount(),quiet=4,tot=n+quiet*2,px=Math.floor(cv.width/tot),off=Math.floor((cv.width-px*tot)/2);
  paint(ctx,n,px,off,quiet,qcol.value);
  bp.disabled=bs.disabled=false;vcf.disabled=type.value!=='contact';T.msg('');
 }catch(e){qrObj=null;bp.disabled=bs.disabled=vcf.disabled=true;T.msg('That is too long for a QR code. Shorten it, or choose a smaller error correction.',true)}
}
function fname(ext){var base='scanorbit-qr-'+type.value;if(type.value==='contact'){var s=v('name').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(s)base='contact-qr-'+s}return base+'.'+ext}
type.addEventListener('change',build);
bp.onclick=function(){if(!qrObj)return;var n=qrObj.getModuleCount(),quiet=4,size=parseInt(qsz.value,10)||1024,px=Math.max(4,Math.floor(size/(n+quiet*2))),s=(n+quiet*2)*px,big=document.createElement('canvas');big.width=big.height=s;var x=big.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,s,s);paint(x,n,px,0,quiet,qcol.value);big.toBlob(function(b){T.download(b,fname('png'))},'image/png')};
bs.onclick=function(){if(!qrObj)return;var n=qrObj.getModuleCount(),quiet=4,s=n+quiet*2,p='';
 for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qrObj.isDark(r,c))p+='M'+(c+quiet)+' '+(r+quiet)+'h1v1h-1z';
 var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+s+' '+s+'" shape-rendering="crispEdges"><rect width="'+s+'" height="'+s+'" fill="#fff"/><path d="'+p+'" fill="'+qcol.value+'"/></svg>';
 T.download(new Blob([svg],{type:'image/svg+xml'}),fname('svg'))};
vcf.onclick=function(){var d=vcard('\r\n');if(!d)return;T.download(new Blob([d+'\r\n'],{type:'text/vcard;charset=utf-8'}),fname('vcf'))};
if(cfg.type&&DEF[cfg.type])type.value=cfg.type;
build();
})();
