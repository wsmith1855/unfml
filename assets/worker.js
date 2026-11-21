// UNFML comments: a small Cloudflare Worker.
// Visitors submit a comment (checked by Cloudflare Turnstile). It waits in "pending".
// You open /admin, then click Approve or Deny. Approved comments appear on the site.
// Storage: one Cloudflare KV namespace bound as COMMENTS (two keys: "pending", "approved").
// No IP addresses or other visitor details are stored.

const ROLES = ["", "Support staff", "Faculty or academic staff", "Executive or administrator", "Student", "Alum or community member", "Other"];
const MAX_PENDING = 300;
const MAX_APPROVED = 500;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
}
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const h = { "Vary": "Origin" };
  if (origin && allowedOrigins(env).includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}
function json(data, status, extra) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, extra || {}) });
}
async function load(env, key) {
  const v = await env.COMMENTS.get(key, "json");
  return Array.isArray(v) ? v : [];
}
async function save(env, key, arr) {
  await env.COMMENTS.put(key, JSON.stringify(arr));
}
function newId() {
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  return Date.now().toString(36) + "-" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
function today() { return new Date().toISOString().slice(0, 10); }

function safeEqual(a, b) {
  const enc = new TextEncoder(); const x = enc.encode(a), y = enc.encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
function authed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const h = request.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  let decoded = "";
  try { decoded = atob(h.slice(6)); } catch (_) { return false; }
  const i = decoded.indexOf(":");
  const pass = i >= 0 ? decoded.slice(i + 1) : decoded;
  return safeEqual(pass, env.ADMIN_PASSWORD);
}
function needAuth() {
  return new Response("Sign in to moderate comments.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="UNFML moderation", charset="UTF-8"', "Cache-Control": "no-store" } });
}

async function verifyTurnstile(token, env) {
  if (!token || !env.TURNSTILE_SECRET) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const j = await r.json();
    return !!(j && j.success);
  } catch (_) { return false; }
}

async function handleSubmit(request, env, cors) {
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).includes(origin)) return json({ ok: false, error: "Not allowed from this address." }, 403, cors);
  let data;
  try { data = await request.json(); } catch (_) { return json({ ok: false, error: "Bad request." }, 400, cors); }
  if (data.website) return json({ ok: true }, 200, cors); // honeypot: pretend success
  const message = String(data.message || "").replace(/\r\n/g, "\n").trim();
  const role = String(data.role || "");
  if (message.length < 20) return json({ ok: false, error: "Please write at least 20 characters." }, 400, cors);
  if (message.length > 1000) return json({ ok: false, error: "That comment is too long." }, 400, cors);
  if (!ROLES.includes(role)) return json({ ok: false, error: "Bad request." }, 400, cors);
  if (!(await verifyTurnstile(data.token, env))) return json({ ok: false, error: "The bot check did not pass. Please try it again." }, 400, cors);
  const pending = await load(env, "pending");
  if (pending.length >= MAX_PENDING) return json({ ok: false, error: "Too many comments are waiting right now. Please try again later." }, 429, cors);
  pending.push({ id: newId(), date: today(), role, text: message });
  await save(env, "pending", pending);
  return json({ ok: true }, 200, cors);
}

async function handleComments(request, env, cors) {
  const approved = await load(env, "approved");
  const out = approved.map((c) => ({ date: c.date, role: c.role, text: c.text })).reverse();
  return json(out, 200, Object.assign({ "Cache-Control": "public, max-age=60" }, cors));
}

function page(body, count) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Comments${count ? " (" + count + ")" : ""}</title>
<style>
:root{--g:#18453b;--l:#b7cdc4;--bg:#f4f7f5;--ink:#16211d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
header{background:var(--g);color:#fff;padding:18px 20px}header h1{margin:0;font-size:20px}header p{margin:4px 0 0;color:var(--l)}
main{max-width:760px;margin:0 auto;padding:20px}h2{margin:28px 0 10px;font-size:18px}
.card{background:#fff;border:1px solid #d5e0db;border-radius:10px;padding:14px;margin:0 0 14px}
.meta{color:#52645d;font-size:14px;margin-bottom:8px}textarea{width:100%;min-height:110px;font:inherit;padding:10px;border:1px solid #b9c9c2;border-radius:8px}
.row{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:10px 20px;cursor:pointer}
.ok{background:var(--g);color:#fff}.no{background:#e7ecea;color:#16211d}.empty{color:#52645d}
</style></head><body><header><h1>UNFML comment moderation</h1><p>Nothing is public until you approve it. Edit the text first if you need to remove a name or detail.</p></header><main>${body}</main></body></html>`;
}

async function handleAdmin(request, env) {
  const pending = await load(env, "pending");
  const approved = await load(env, "approved");
  let html = `<h2>Waiting for review (${pending.length})</h2>`;
  if (!pending.length) html += `<p class="empty">Nothing waiting.</p>`;
  pending.slice().reverse().forEach((c) => {
    html += `<form class="card" method="post" action="/admin/act"><input type="hidden" name="id" value="${esc(c.id)}">
<div class="meta">${esc(c.date)} &middot; ${esc(c.role || "Anonymous")}</div>
<textarea name="text" maxlength="1000">${esc(c.text)}</textarea>
<div class="row"><button class="ok" name="action" value="approve">Approve and publish</button><button class="no" name="action" value="deny">Deny and delete</button></div></form>`;
  });
  html += `<h2>Published (${approved.length})</h2>`;
  if (!approved.length) html += `<p class="empty">Nothing published yet.</p>`;
  approved.slice().reverse().forEach((c) => {
    html += `<form class="card" method="post" action="/admin/act"><input type="hidden" name="id" value="${esc(c.id)}">
<div class="meta">${esc(c.date)} &middot; ${esc(c.role || "Anonymous")}</div><p style="white-space:pre-wrap;margin:0">${esc(c.text)}</p>
<div class="row"><button class="no" name="action" value="remove">Remove from site</button></div></form>`;
  });
  return new Response(page(html, pending.length), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function handleAct(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const site = request.headers.get("Sec-Fetch-Site");
  if (!((origin && origin === url.origin) || site === "same-origin")) return new Response("Blocked.", { status: 403 });
  const form = await request.formData();
  const id = String(form.get("id") || ""), action = String(form.get("action") || "");
  const pending = await load(env, "pending");
  const approved = await load(env, "approved");
  if (action === "approve") {
    const i = pending.findIndex((c) => c.id === id);
    if (i >= 0) {
      const c = pending.splice(i, 1)[0];
      const text = String(form.get("text") || c.text).replace(/\r\n/g, "\n").trim().slice(0, 1000);
      if (text) approved.push({ id: c.id, date: c.date, role: c.role, text });
      while (approved.length > MAX_APPROVED) approved.shift();
      await save(env, "pending", pending); await save(env, "approved", approved);
    }
  } else if (action === "deny") {
    await save(env, "pending", pending.filter((c) => c.id !== id));
  } else if (action === "remove") {
    await save(env, "approved", approved.filter((c) => c.id !== id));
  }
  return new Response(null, { status: 303, headers: { Location: "/admin", "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/submit" && request.method === "POST") return handleSubmit(request, env, cors);
    if (url.pathname === "/comments" && request.method === "GET") return handleComments(request, env, cors);
    if (url.pathname === "/admin" && request.method === "GET") return authed(request, env) ? handleAdmin(request, env) : needAuth();
    if (url.pathname === "/admin/act" && request.method === "POST") return authed(request, env) ? handleAct(request, env) : needAuth();
    return new Response("Not found", { status: 404 });
  },
};
