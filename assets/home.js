/* hero numbers */
$("heroN").textContent = ALLN.toLocaleString("en-US");
$("heroCost").textContent = mil(ALLTOTAL*0.035);
$("heroGap").textContent = mil(ALLTOTAL*0.016);

/* scale comparison */
function scale(){
  const n = Math.max(1, parseFloat($("sCount").value)||1);
  const avg = Math.max(1, parseFloat($("sAvg").value)||1);
  const sPool = n*avg*0.019;
  const xPool = ALLTOTAL*0.035;
  const perS = avg*0.019;
    $("sMeta").textContent = n.toLocaleString("en-US")+" people, about "+usd(perS)+" each";
  $("xMeta").textContent = ALLN.toLocaleString("en-US")+" people";
  const max = Math.max(sPool,xPool);
  $("sBar").textContent = mil(sPool);
  $("xBar").textContent = mil(xPool);
  $("sBar").style.width = Math.max(18,sPool/max*100)+"%";
  $("xBar").style.width = Math.max(18,xPool/max*100)+"%";
  const r1 = sPool/xPool, r2 = n/ALLN;
  const f = x => (x>=10?Math.round(x):x.toFixed(1))+"x";
  $("vMoney").textContent = r1<1 ? Math.round(r1*100)+"%" : f(r1);
  $("vMoneyT").textContent = r1<1 ? "is the size of the support staff raise pool compared with the executive and faculty pool" : "the support staff raise pool compared with the executive and faculty pool";
  $("vPeople").textContent = f(r2);
  $("vPeopleT").textContent = "as many people are sharing the support staff pool";
  $("vPer").textContent = "$10,500";
  $("vPerT").textContent = "is the raise for an executive earning $300,000, compared with $1,900 for a support staff member earning $100,000";
}
$("sCount").addEventListener("input",scale);
$("sAvg").addEventListener("input",scale);
scale();
