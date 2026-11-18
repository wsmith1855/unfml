$("groups").innerHTML = ["E","D","C","F"].map(k=>
  '<div class="group"><b>'+sub[k].n.toLocaleString("en-US")+'</b><p class="n">'+GROUPS[k]+'</p><span>'+mil(sub[k].s)+' in combined pay</span><span>'+mil(sub[k].s*0.035)+' at 3.5%</span><span>'+sub[k].hi+' paid $200,000+, '+LOW[k].m[0].toLocaleString("en-US")+' at $100,000–$199,999, '+LOW[k].u[0].toLocaleString("en-US")+' under $100,000</span></div>'
).join("");

/* calculator */
function calc(){
  const pct = Math.max(0, parseFloat($("pct").value)||0);
  const sal = Math.max(1, parseFloat($("sal").value)||1);
  const pool = ALLTOTAL*pct/100;
  $("rPool").textContent = mil(pool);
  $("rPoolT").textContent = "Yearly cost of a "+pct+"% raise for the "+ALLN.toLocaleString("en-US")+" executives, deans, chairs and faculty with reported pay";
  $("rFull").textContent = Math.round(pool/sal).toLocaleString("en-US");
  $("rFullT").textContent = "Employees at "+usd(sal)+" whose entire salary that money would cover";
  $("rRaises").textContent = Math.round(ALLTOTAL/sal).toLocaleString("en-US");
  $("rRaisesT").textContent = "Employees at "+usd(sal)+" who could each get a "+pct+"% raise from that same money";
}
$("pct").addEventListener("input",calc);
$("sal").addEventListener("input",calc);
calc();
