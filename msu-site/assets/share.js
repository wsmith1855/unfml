/* share links: built from this page's own address when clicked, no outside scripts */
(function(){
  var page = location.href.split("#")[0];
  var text = "Support staff got 1.9%. Executives got 3.5%. Twice the people, about half the raise money.";
  var x = "https://x.com/intent/post?text="+encodeURIComponent(text)+"&url="+encodeURIComponent(page);
  var fb = "https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(page);
  document.querySelectorAll(".shx").forEach(function(a){a.href = x;});
  document.querySelectorAll(".shfb").forEach(function(a){a.href = fb;});
})();
