(function(){
  var ACCESS_KEY = document.querySelector('#cform input[name="access_key"]').value;
  var KEY_SET = ACCESS_KEY && ACCESS_KEY.indexOf("YOUR_") !== 0;
  var $ = function(id){ return document.getElementById(id); };

  /* published comments */
  var list = $("clist");
  var items = (window.COMMENTS || []).slice().sort(function(a,b){ return (b.date||"").localeCompare(a.date||""); });
  if(!items.length){
    var p = document.createElement("p");
    p.textContent = "No comments have been published yet. Be the first to add one.";
    list.appendChild(p);
  } else {
    items.forEach(function(c){
      var d = document.createElement("div"); d.className = "comment";
      var t = document.createElement("p"); t.textContent = c.text;
      var m = document.createElement("div"); m.className = "meta";
      m.textContent = (c.role || "Anonymous") + (c.date ? ", " + c.date : "");
      d.appendChild(t); d.appendChild(m); list.appendChild(d);
    });
  }

  /* open the form: only now does anything load from a third party */
  var loaded = false;
  var openBtn = $("openForm"), wrap = $("formWrap");
  openBtn.addEventListener("click", function(){
    var open = wrap.hidden;
    wrap.hidden = !open;
    openBtn.setAttribute("aria-expanded", String(open));
    openBtn.textContent = open ? "Hide the form" : "Write a comment";
    if(open && !loaded){
      loaded = true;
      var s = document.createElement("script");
      s.src = "https://web3forms.com/client/script.js";
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
  var form = $("cform"), status = $("cstatus"), btn = $("sendBtn");
  function say(text, cls){ status.textContent = text; status.className = "cstatus" + (cls ? " " + cls : ""); }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var text = msg.value.trim();
    if(text.length < 20){ say("Please write at least 20 characters.", "err"); msg.focus(); return; }
    if(!KEY_SET){ say("Comments are not switched on yet. Please check back soon.", "err"); return; }
    var captcha = form.querySelector('[name="h-captcha-response"]');
    if(!captcha || !captcha.value){ say("Please complete the bot check first.", "err"); return; }
    btn.disabled = true; say("Sending…");
    fetch("https://api.web3forms.com/submit", { method:"POST", body:new FormData(form), headers:{ "Accept":"application/json" } })
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(j && j.success){
          form.reset(); cnt.textContent = "0 of 1000 characters. At least 20 are needed.";
          if(window.hcaptcha){ try{ window.hcaptcha.reset(); }catch(_){} }
          say("Thank you. Your comment was sent for review. It may take a few days to appear, and not every comment is posted.", "ok");
        } else {
          try{ console.warn("Comment form response:", j); }catch(_){}
          say("Something went wrong and your comment was not sent. Please try again in a moment." + (j && j.message ? " (" + String(j.message).slice(0,160) + ")" : ""), "err");
          if(window.hcaptcha){ try{ window.hcaptcha.reset(); }catch(_){} }
        }
      })
      .catch(function(){ say("Your comment could not be sent. Check your connection and try again.", "err"); })
      .then(function(){ btn.disabled = false; });
  });
})();
