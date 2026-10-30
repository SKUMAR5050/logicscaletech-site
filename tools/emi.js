(function(){
var amt=document.getElementById('amt'),rate=document.getElementById('rate'),ten=document.getElementById('ten'),unit=document.getElementById('unit'),res=document.getElementById('res'),bar=document.getElementById('bar'),lg=document.getElementById('lg');
var inr=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
function calc(){
 var P=parseFloat(amt.value),R=parseFloat(rate.value),t=parseFloat(ten.value);
 if(!(P>0)||!(R>=0)||!(t>0)){res.innerHTML='';bar.innerHTML='';lg.textContent='';T.msg('Enter the loan amount, the rate and the time.');return}
 var n=Math.round(unit.value==='y'?t*12:t);if(n<1){T.msg('The time is too short.',true);return}
 var r=R/12/100,emi=r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1),total=emi*n,intr=total-P;
 T.msg('');
 res.innerHTML='<div class="big"><small>Monthly EMI</small><b>'+inr.format(emi)+'</b></div><div><small>Total interest</small><b>'+inr.format(intr)+'</b></div><div><small>Total payment</small><b>'+inr.format(total)+'</b></div><div><small>Number of EMIs</small><b>'+n+'</b></div>';
 var pp=Math.round(P/total*100);
 bar.innerHTML='<i style="width:'+pp+'%;background:var(--accent)"></i><i style="width:'+(100-pp)+'%;background:#E0A458"></i>';
 lg.textContent='Blue: loan amount ('+pp+'%). Orange: interest ('+(100-pp)+'%).';
}
[amt,rate,ten,unit].forEach(function(e){e.addEventListener('input',calc);e.addEventListener('change',calc)});
calc();
})();
