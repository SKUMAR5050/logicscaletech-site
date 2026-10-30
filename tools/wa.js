(function(){
var cc=document.getElementById('cc'),num=document.getElementById('num'),txt=document.getElementById('txt'),out=document.getElementById('out'),cp=document.getElementById('copy'),op=document.getElementById('open'),cv=document.getElementById('cv'),bp=document.getElementById('png');
var qrObj=null;
function digits(s){return (s||'').replace(/\D/g,'')}
function link(){
 var c=digits(cc.value).replace(/^0+/,''),n=digits(num.value).replace(/^0+/,'');
 if(!c||!n)return '';
 var all=c+n;if(all.length<8||all.length>15)return '';
 var m=txt.value.trim();
 return 'https://wa.me/'+all+(m?'?text='+encodeURIComponent(m):'');
}
function blank(){var x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height)}
function draw(){
 var l=link();blank();out.value=l;
 if(!l){qrObj=null;cp.disabled=bp.disabled=true;op.style.pointerEvents='none';op.style.opacity='.45';op.href='#';
  T.msg(num.value?'Check the country code and number. Use digits only.':'Type a number to see your link and QR code.',!!num.value);return}
 try{var q=qrcode(0,'M');q.addData(l,'Byte');q.make();qrObj=q;
  var n=q.getModuleCount(),quiet=4,tot=n+quiet*2,px=Math.floor(cv.width/tot),off=Math.floor((cv.width-px*tot)/2),x=cv.getContext('2d');
  x.fillStyle='#000';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))x.fillRect(off+(c+quiet)*px,off+(r+quiet)*px,px,px);
  cp.disabled=bp.disabled=false;op.style.pointerEvents='';op.style.opacity='';op.href=l;T.msg('');
 }catch(e){qrObj=null;cp.disabled=bp.disabled=true;T.msg('The message is too long for a QR code. Shorten it.',true)}
}
[cc,num,txt].forEach(function(e){e.addEventListener('input',draw)});
cp.onclick=function(){var l=out.value;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(l).then(function(){T.msg('Link copied.')},function(){out.select();T.msg('Press Ctrl+C or long-press to copy.')})}else{out.select();T.msg('Press Ctrl+C or long-press to copy.')}};
bp.onclick=function(){var big=document.createElement('canvas'),n=qrObj.getModuleCount(),quiet=4,px=Math.max(4,Math.floor(1024/(n+quiet*2))),s=(n+quiet*2)*px;big.width=big.height=s;var x=big.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,s,s);x.fillStyle='#000';
 for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(qrObj.isDark(r,c))x.fillRect((c+quiet)*px,(r+quiet)*px,px,px);big.toBlob(function(b){T.download(b,'whatsapp-qr.png')},'image/png')};
draw();
})();
