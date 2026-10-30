(function(){
var amt=document.getElementById('amt'),rate=document.getElementById('rate'),res=document.getElementById('res');
var inr=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2});
function mode(){return document.querySelector('input[name="mode"]:checked').value}
function calc(){
 var a=parseFloat(amt.value),g=parseFloat(rate.value);
 if(!(a>=0)||!(g>=0)){res.innerHTML='';T.msg('Enter the amount and the GST rate.');return}
 var base,tax,total;
 if(mode()==='add'){base=a;tax=a*g/100;total=a+tax}else{total=a;base=a/(1+g/100);tax=a-base}
 T.msg('');
 res.innerHTML='<div><small>Price before GST</small><b>'+inr.format(base)+'</b></div><div><small>GST amount</small><b>'+inr.format(tax)+'</b></div><div class="big"><small>Final price</small><b>'+inr.format(total)+'</b></div><div><small>CGST ('+(g/2)+'%)</small><b>'+inr.format(tax/2)+'</b></div><div><small>SGST ('+(g/2)+'%)</small><b>'+inr.format(tax/2)+'</b></div>';
}
amt.addEventListener('input',calc);rate.addEventListener('input',calc);
Array.prototype.forEach.call(document.querySelectorAll('input[name="mode"]'),function(e){e.addEventListener('change',calc)});
calc();
})();
