(function(){
// Same QR types and same rules as the ScanOrbit app.
var cfg=window.CFG||{},type=document.getElementById('type'),fields=document.getElementById('fields'),cv=document.getElementById('cv'),bp=document.getElementById('png'),bs=document.getElementById('svg');
var DEF={
 text:[['text','Message or link','textarea','Type a message, website or anything']],
 wifi:[['ssid','Wi-Fi name','text',''],['pass','Password (leave empty for an open network)','text','']],
 upi:[['upi','UPI ID','text','name@bank'],['name','Payee name (optional)','text',''],['amount','Amount in INR (optional)','text','']],
 contact:[['name','Name','text',''],['phone','Phone number','text',''],['email','Email (optional)','text','']]
};
function wifiEscape(t){return t.replace(/([\;,:"])/g,'\\$1')}
function content(kind){
 function v(k){var e=fields.querySelector('[data-k="'+k+'"]');return e?e.value.trim():''}
 if(kind==='wifi'){if(!v('ssid'))return '';var p=v('pass');return 'WIFI:T:'+(p?'WPA':'nopass')+';S:'+wifiEscape(v('ssid'))+';'+(p?'P:'+wifiEscape(p)+';':'')+';'}
 if(kind==='upi'){if(!/^[^\s@]+@[^\s@]+$/.test(v('upi')))return '';var out='upi://pay?pa='+encodeURIComponent(v('upi')).replace(/%40/g,'@');if(v('name'))out+='&pn='+encodeURIComponent(v('name'));var am=parseFloat(v('amount').replace(',','.'));if(am>0)out+='&am='+am.toFixed(2);return out+'&cu=INR'}
 if(kind==='contact'){if(!v('name')&&!v('phone'))return '';var L=['BEGIN:VCARD','VERSION:3.0','FN:'+v('name'),'N:'+v('name')+';;;;'];if(v('phone'))L.push('TEL;TYPE=CELL:'+v('phone'));if(v('email'))L.push('EMAIL:'+v('email'));L.push('END:VCARD');return L.join('\n')}
 return v('text');
}
function utf8Bytes(text){var out='';for(var i=0;i<text.length;){var code=text.codePointAt(i);i+=code>0xffff?2:1;
 if(code<0x80)out+=String.fromCharCode(code);else if(code<0x800)out+=String.fromCharCode(0xc0|(code>>6),0x80|(code&63));
 else if(code<0x10000)out+=String.fromCharCode(0xe0|(code>>12),0x80|((code>>6)&63),0x80|(code&63));
 else out+=String.fromCharCode(0xf0|(code>>18),0x80|((code>>12)&63),0x80|((code>>6)&63),0x80|(code&63))}return out}
var qrObj=null;
function build(){fields.innerHTML='';DEF[type.value].forEach(function(f){
 var l=document.createElement('label');l.className='f';l.textContent=f[1];var el=document.createElement(f[2]==='textarea'?'textarea':'input');
 if(f[2]!=='textarea')el.type='text';else el.rows=3;el.placeholder=f[3];el.dataset.k=f[0];el.addEventListener('input',draw);l.appendChild(el);fields.appendChild(l)});draw()}
function draw(){
 var data=content(type.value),ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
 if(!data){qrObj=null;bp.disabled=bs.disabled=true;T.msg('Fill in the details to see your QR code.');return}
 try{var q=qrcode(0,'M');q.addData(utf8Bytes(data),'Byte');q.make();qrObj=q;
  var n=q.getModuleCount(),quiet=4,tot=n+quiet*2,px=Math.floor(cv.width/tot),off=Math.floor((cv.width-px*tot)/2);
  ctx.fillStyle='#000';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))ctx.fillRect(off+(c+quiet)*px,off+(r+quiet)*px,px,px);
  bp.disabled=bs.disabled=false;T.msg('');
 }catch(e){qrObj=null;bp.disabled=bs.disabled=true;T.msg('That is too long for a QR code. Shorten it.',true)}
}
type.addEventListener('change',build);
bp.onclick=function(){var big=document.createElement('canvas'),n=qrObj.getModuleCount(),quiet=4,px=Math.max(4,Math.floor(1024/(n+quiet*2))),s=(n+quiet*2)*px;big.width=big.height=s;var x=big.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,s,s);x.fillStyle='#000';
 for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qrObj.isDark(r,c))x.fillRect((c+quiet)*px,(r+quiet)*px,px,px);big.toBlob(function(b){T.download(b,'scanorbit-qr.png')},'image/png')};
bs.onclick=function(){var n=qrObj.getModuleCount(),quiet=4,s=n+quiet*2,p='';
 for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qrObj.isDark(r,c))p+='M'+(c+quiet)+' '+(r+quiet)+'h1v1h-1z';
 var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+s+' '+s+'" shape-rendering="crispEdges"><rect width="'+s+'" height="'+s+'" fill="#fff"/><path d="'+p+'" fill="#000"/></svg>';
 T.download(new Blob([svg],{type:'image/svg+xml'}),'scanorbit-qr.svg')};
if(cfg.type)type.value=cfg.type;
build();
})();
