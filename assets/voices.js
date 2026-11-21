(function(){
  var $ = function(id){ return document.getElementById(id); };
  var form = $("cform");
  var API = (form.getAttribute("data-api") || "").replace(/\/$/, "");
  var SITEKEY = form.getAttribute("data-sitekey") || "";
  var CONFIGURED = API.indexOf("YOUR-") < 0 && SITEKEY.indexOf("YOUR_") < 0 && API && SITEKEY;

  /* published comments: any typed into comments.js, plus approved ones from the comment server */
  var list = $("clist");
  function render(items){
    list.textContent = "";
    items = items.slice().sort(function(a,b){ return (b.date||"").localeCompare(a.date||""); });
    if(!items.length){
      var p = document.createElement("p");
      p.textContent = "No comments have been published yet. Be the first to add one.";
      list.appendChild(p); return;
    }
    items.forEach(function(c){
      var d = document.createElement("div"); d.className = "comment";
      var t = document.createElement("p"); t.textContent = c.text;
      var m = document.createElement("div"); m.className = "meta";
      m.textContent = (c.role || "Anonymous") + (c.date ? ", " + c.date : "");
      d.appendChild(t); d.appendChild(m); list.appendChild(d);
    });
  }
  var staticItems = (window.COMMENTS || []).slice();
  render(staticItems);
  if(CONFIGURED){
    fetch(API + "/comments").then(function(r){ return r.json(); }).then(function(rows){
      if(Array.isArray(rows)) render(staticItems.concat(rows));
    }).catch(function(){});
  }

  /* open the form: the Cloudflare bot check only loads now */
  var loaded = false, widget = null;
  var openBtn = $("openForm"), wrap = $("formWrap");
  window.__unfmlTurnstile = function(){
    try{ widget = window.turnstile.render("#ts", { sitekey: SITEKEY }); }catch(_){}
  };
  openBtn.addEventListener("click", function(){
    var open = wrap.hidden;
    wrap.hidden = !open;
    openBtn.setAttribute("aria-expanded", String(open));
    openBtn.textContent = open ? "Hide the form" : "Write a comment";
    if(open && !loaded && CONFIGURED){
      loaded = true;
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__unfmlTurnstile";
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    }
    if(open){ $("msg").focus(); }
  });

  /* character count */
  var msg = $("msg"), cnt = $("msgcount");
  msg.addEventListener("input", function(){
    cnt.textContent = msg.value.length + " of 1000 characters. At least 20 are needed.";
  });

  /* send */
  var status = $("cstatus"), btn = $("sendBtn");
  function say(text, cls){ status.textContent = text; status.className = "cstatus" + (cls ? " " + cls : ""); }
  function resetCaptcha(){ if(window.turnstile && widget !== null){ try{ window.turnstile.reset(widget); }catch(_){} } }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var text = msg.value.trim();
    if(text.length < 20){ say("Please write at least 20 characters.", "err"); msg.focus(); return; }
    if(!CONFIGURED){ say("Comments are not switched on yet. Please check back soon.", "err"); return; }
    var token = window.turnstile && widget !== null ? window.turnstile.getResponse(widget) : "";
    if(!token){ say("Please complete the bot check first.", "err"); return; }
    btn.disabled = true; say("Sending…");
    fetch(API + "/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, role: $("role").value, token: token, website: form.elements["website"].value })
    })
      .then(function(r){ return r.json().catch(function(){ return {}; }); })
      .then(function(j){
        if(j && j.ok){
          form.reset(); cnt.textContent = "0 of 1000 characters. At least 20 are needed.";
          say("Thank you. Your comment was sent for review. It may take a few days to appear, and not every comment is posted.", "ok");
        } else {
          say((j && j.error) ? j.error : "Something went wrong and your comment was not sent. Please try again in a moment.", "err");
        }
        resetCaptcha();
      })
      .catch(function(){ say("Your comment could not be sent. Check your connection and try again.", "err"); resetCaptcha(); })
      .then(function(){ btn.disabled = false; });
  });
})();
