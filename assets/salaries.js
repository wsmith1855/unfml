/* ladder */
const list = $("list");
let group = "all", query = "";
const chipDefs = [["all","Everyone ("+DATA.length+")"],["E","Executives ("+sub.E.n+")"],["D","Deans ("+sub.D.n+")"],["C","Chairs ("+sub.C.n+")"],["F","Faculty ("+sub.F.n+")"]];
$("chips").innerHTML = chipDefs.map(c=>'<button class="chip" type="button" data-g="'+c[0]+'" aria-pressed="'+(c[0]==="all")+'">'+c[1]+'</button>').join("");
function render(){
  const f = query.trim().toLowerCase();
  const rows = DATA.filter(r=>(group==="all"||r.g===group)&&(!f||r.name.toLowerCase().includes(f)||r.title.toLowerCase().includes(f)));
  list.innerHTML = "";
  const frag = document.createDocumentFragment();
  rows.forEach((r,i)=>{
    const li = document.createElement("li");
    li.className = "row"+(r.pay===MAX?" top":"");
    li.innerHTML = '<div class="who"><b></b><small></small></div><div class="track" role="img"><div class="bar"></div></div><div class="amt"></div>';
    li.querySelector("b").textContent = r.name;
    li.querySelector("small").textContent = r.title;
    li.querySelector(".amt").textContent = usd(r.pay);
    li.querySelector(".track").setAttribute("aria-label", r.name+": "+usd(r.pay));
    li.querySelector(".bar").dataset.w = (r.pay/MAX*100).toFixed(2);
    frag.appendChild(li);
  });
  list.appendChild(frag);
  $("empty").hidden = rows.length>0;
  const s = rows.reduce((a,r)=>a+r.pay,0);
  $("count").textContent = rows.length+" shown, "+mil(s)+" combined";
}
function fill(){ document.querySelectorAll(".bar").forEach(b=>b.style.width=b.dataset.w+"%"); }
render();
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduce || !("IntersectionObserver" in window)){ fill(); }
else{
  const io = new IntersectionObserver(es=>{ if(es[0].isIntersecting){ fill(); io.disconnect(); } },{threshold:.02});
  io.observe(list);
}
$("q").addEventListener("input",e=>{ query = e.target.value; render(); fill(); });
$("chips").addEventListener("click",e=>{
  const b = e.target.closest(".chip"); if(!b) return;
  group = b.dataset.g;
  document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed", String(c===b)));
  render(); fill();
});
