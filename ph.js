"use strict";
var PHV = "1.2（第 77 批・資安）";
var XRE = /^[A-Za-z0-9_-]{20,120}$/, TRE = /^[0-9a-f]{32}$/;
var X = "", T = "", DK = "", SHR = "", ME = null, IDLE_MIN = 30, LAST = Date.now(), PING = 0, IDT = 0;
var APP = null;
function $(s, r) { return (r || document).querySelector(s); }
function h(t, a, kids) {
  var x = document.createElement(t);
  for (var k in (a || {})) { if (k === "text") x.textContent = a[k]; else if (k.slice(0, 2) === "on") x[k] = a[k]; else if (a[k] !== null && a[k] !== undefined && a[k] !== false) x.setAttribute(k, a[k]); }
  (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) x.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return x;
}
function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {  } }
function ssGet(k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }
function ssSet(k, v) { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) {  } }
function rnd32() { var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return (b + 256).toString(16).slice(-2); }).join(""); }

var XC = "1.hficedae.q0ASjmr28kaOyrZUH7s2P7CkZXxdoYHwftEd0PWaywexdE0WJUb7_zsxyVeJXi5EGEhdfNw2f0CWO3LgA5rQk-H8nZQ-HfyHGkU";
function xdec(c) {
  var m = /^1\.([0-9a-z]{8})\.([A-Za-z0-9_-]{20,240})$/.exec(String(c || "")); if (!m) return "";
  try {
    var b = atob(m[2].replace(/-/g, "+").replace(/_/g, "/")), seed = 2166136261, k, out = "", i;
    for (i = 0; i < m[1].length; i++) { seed ^= m[1].charCodeAt(i); seed = Math.imul(seed, 16777619) >>> 0; }
    for (i = 0; i < b.length; i++) { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; k = seed & 255; out += String.fromCharCode(b.charCodeAt(i) ^ k); }
    return XRE.test(out) ? out : "";
  } catch (e) { return ""; }
}
(function () {
  var m = /(?:^#|&)x=([A-Za-z0-9_-]{20,120})(?:&|$)/.exec(location.hash || ""), cx = xdec(XC);
  try { if (!cx && typeof window.PH_XC === "string") cx = xdec(window.PH_XC); if (!cx && typeof window.PH_X === "string" && XRE.test(window.PH_X)) cx = window.PH_X; } catch (e) {  }
  var sm = /(?:^#|&)s=([0-9a-f]{32})(?:&|$)/.exec(location.hash || "");
  if (sm) { SHR = sm[1]; try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {  } }
  var rx = XRE.test(lsGet("phx")) ? lsGet("phx") : "";
  if (m) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {  } }
  if (cx) { X = cx; lsSet("phx", X); }
  else if (m && (m[1] === rx || window.confirm("這條連結要連到後端（…" + m[1].slice(-6) + "）" + (rx ? "，跟這台原本連的（…" + rx.slice(-6) + "）不一樣" : "") + "。\n只有開發者給你的正式連結才按「確定」；不確定請按「取消」。"))) { X = m[1]; lsSet("phx", X); }
  else X = rx;
  DK = TRE.test(lsGet("phdk")) ? lsGet("phdk") : rnd32(); lsSet("phdk", DK);
  T = TRE.test(ssGet("pht")) && ssGet("phtx") === X ? ssGet("pht") : "";
})();

function post(fn, a, ms) {
  var ctl = window.AbortController ? new AbortController() : null, tm = 0;
  if (ctl) tm = setTimeout(function () { try { ctl.abort(); } catch (e) {  } }, ms || 40000);
  var o = { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ v: 1, fn: fn, t: T, dk: DK, a: a || [] }), credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" };
  if (ctl) o.signal = ctl.signal;
  return fetch("https://script.google.com/macros/s/" + X + "/exec", o).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json().catch(function () { throw new Error("後端回的格式不對"); });
  }).then(function (j) { clearTimeout(tm); return j; }, function (e) { clearTimeout(tm); throw (e && e.name === "AbortError") ? new Error("等太久沒回應") : e; });
}
var SAFE = { phBoot: 1 };
function call(fn, args, opt) {
  opt = opt || {};
  var tries = SAFE[fn] ? 3 : 1, n = 0;
  return new Promise(function (ok, bad) {
    function go() {
      n++;
      post(fn, args, opt.ms).then(function (j) {
        if (!j || j.ok !== 1) {
          var code = j && j.code || "", msg = j && j.err || "";
          if (code === "tok") { logout("expired"); return; }
          var e = new Error(msg || "後端沒有回應"); e.code = code; bad(e); return;
        }
        PING = Date.now();
        ok(j.r);
      }, function (err) {
        if (n < tries) { setTimeout(go, 900 * n); return; }
        var off = navigator.onLine === false, e = new Error(off ? "連不上（沒有網路），網路好了再試一次" : "連不上 PH資料庫的後端（" + String(err && err.message || err) + "）：網路正常的話，請開發者執行 yzPhCheck 檢查"); e.net = true; bad(e);
      });
    }
    go();
  });
}

function card(kids, cls) {
  stopIdle();
  APP.className = "ph-app"; APP.innerHTML = "";
  APP.appendChild(h("div", { class: "ph-scr " + (cls || "") }, [h("div", { class: "ph-card" }, kids)]));
}
function title(sub) { return [h("h1", { class: "ph-t" }, ["🗂 PH資料庫"]), sub ? h("p", { class: "ph-sub", text: sub }) : null]; }
function msgEl() { return h("div", { class: "ph-msg", role: "status", "aria-live": "polite" }); }

function scrNoX() {
  card(title("網站還沒設定好").concat([h("p", { class: "ph-note", text: "這一台還不知道 PH資料庫在哪裡：請開發者在網站放 cfg.js（Apps Script 執行 yzPhLink 會給內容）。" })]));
}

function scrLogin(why) {
  ssSet("pht", ""); T = ""; ME = null;
  var emp = h("input", { class: "ph-in", id: "ph-emp", maxlength: "20", autocomplete: "off", spellcheck: "false", "aria-label": "員工編號" });
  var nm = h("input", { class: "ph-in", id: "ph-name", maxlength: "20", autocomplete: "off", spellcheck: "false", "aria-label": "姓名" });
  if (typeof QC !== "undefined" && QC.empKeys) QC.empKeys(emp, { title: "⌨ 員工編號：", next: nm, nextLabel: "下一格（姓名）" });
  var m = msgEl(), busy = false;
  if (why === "expired") m.textContent = "閒置太久（或在別的地方登出了），請重新登入。";
  else if (why === "out") m.textContent = "已登出。";
  var go = h("button", { type: "button", class: "ph-btn pri", id: "ph-go", text: "登入" });
  go.onclick = function () {
    if (busy) return;
    var e = String(emp.value || "").replace(/\s+/g, ""), n = String(nm.value || "").replace(/\s+/g, " ").trim();
    if (!e || !n) { m.textContent = "員工編號、姓名都要打"; try { (e ? nm : emp).focus(); } catch (x) {  } return; }
    busy = true; go.disabled = true; m.textContent = "⏳ 確認中…";
    call("phLogin", [e, n], { ms: 60000 }).then(function (r) {
      busy = false; go.disabled = false;
      if (r && r.need === "code") { scrCode(r.sec); return; }
      if (r && TRE.test(r.t || "")) { enter(r); return; }
      m.textContent = "❌ " + String(r && r.err || "員工編號或姓名不對");
    }, function (x) { busy = false; go.disabled = false; m.textContent = "❌ " + x.message; });
  };
  [emp, nm].forEach(function (x) { x.onkeydown = function (ev) { if (ev.key === "Enter") go.onclick(); }; });
  card(title("主管專用・請用自己的員工編號、姓名").concat([
    h("label", { class: "ph-lb", for: "ph-emp", text: "員工編號" }), emp,
    h("label", { class: "ph-lb", for: "ph-name", text: "姓名" }), nm,
    go, m,
    h("p", { class: "ph-note" }, ["要跟「主管名單」上的一字不差，每次登入 LINE「藥戰手冊」都會收到驗證碼。", h("br"), "閒置 " + IDLE_MIN + " 分鐘自動登出；共用電腦用完請按「登出」。"])
  ]), "login");
  if (!("ontouchstart" in window)) try { emp.focus(); } catch (e) {  }
}

function scrCode(sec) {
  var a = h("input", { class: "ph-in ph-box", inputmode: "numeric", maxlength: "3", autocomplete: "one-time-code", "aria-label": "驗證碼前 3 個數字" });
  var b = h("input", { class: "ph-in ph-box", inputmode: "numeric", maxlength: "3", autocomplete: "off", "aria-label": "驗證碼後 3 個數字" });
  var m = msgEl(), busy = false;
  var put = function (v) { v = String(v || "").replace(/\D/g, "").slice(0, 6); a.value = v.slice(0, 3); b.value = v.slice(3); if (v.length >= 3 && v.length < 6) b.focus(); };
  a.oninput = function () { var v = a.value.replace(/\D/g, ""); if (v.length > 3) { put(v); return; } a.value = v; if (v.length === 3) b.focus(); };
  b.oninput = function () { b.value = b.value.replace(/\D/g, "").slice(0, 3); if (b.value.length === 3) ok.onclick(); };
  b.onkeydown = function (ev) { if (ev.key === "Backspace" && !b.value) a.focus(); if (ev.key === "Enter") ok.onclick(); };
  a.onpaste = function (ev) { var t = (ev.clipboardData || window.clipboardData).getData("text"); if (/\d/.test(t)) { ev.preventDefault(); put(t); } };
  var ok = h("button", { type: "button", class: "ph-btn pri", id: "ph-codego", text: "確認" });
  ok.onclick = function () {
    if (busy) return;
    var v = (a.value + b.value).replace(/\D/g, "");
    if (v.length !== 6) { m.textContent = "要 6 個數字"; return; }
    busy = true; ok.disabled = true; m.textContent = "⏳ 確認中…";
    call("phCode", [sec, v]).then(function (r) {
      busy = false; ok.disabled = false;
      if (r && TRE.test(r.t || "")) { enter(r); return; }
      if (r && r.gone) { scrLogin(); $(".ph-msg").textContent = "❌ " + r.err; return; }
      m.textContent = "❌ " + String(r && r.err || "驗證碼不對"); a.value = ""; b.value = ""; a.focus();
    }, function (x) { busy = false; ok.disabled = false; m.textContent = "❌ " + x.message; });
  };
  var back = h("button", { type: "button", class: "ph-btn", text: "← 回登入" }); back.onclick = function () { scrLogin(); };
  card(title("🔐 LINE 驗證碼（每次登入都要）").concat([
    h("p", { class: "ph-sub2", text: "驗證碼已經傳到你的 LINE「藥戰手冊」（5 分鐘內有效）" }),
    h("label", { class: "ph-lb", text: "6 位數驗證碼" }), h("div", { class: "ph-boxes" }, [a, b]),
    ok, back, m,
    h("p", { class: "ph-note" }, ["沒收到：確認 LINE「藥戰手冊」的通知有打開；等一下按「← 回登入」再試。", h("br"), "驗證碼不要給任何人看。"])
  ]), "code");
  try { a.focus(); } catch (e) {  }
}

function enter(r) {
  T = r.t; ssSet("pht", T); ssSet("phtx", X); ME = r.me || {}; IDLE_MIN = r.idle || 30; LAST = Date.now(); PING = Date.now();
  main();
}
function main() {
  APP.className = "ph-app in"; APP.innerHTML = "";
  var who = h("span", { class: "ph-who", text: (ME.name || "") + (ME.emp ? " " + ME.emp : "") + (ME.dev ? "（開發者）" : "") });
  var idle = h("span", { class: "ph-idle", id: "ph-idle" });
  var out = h("button", { type: "button", class: "ph-out", id: "ph-out", text: "登出" }); out.onclick = function () { bye(false); };
  APP.appendChild(h("header", { class: "ph-bar" }, [h("b", { class: "ph-bt", text: "🗂 PH資料庫" }), h("span", { class: "ph-bs" }, [who, idle, out])]));
  var col = h("main", { class: "ph-main" });
  APP.appendChild(col);
  wm();
  if (typeof QC !== "undefined") QC.draw(col);
  startIdle();
}
function bye(forget) {
  var t = T;
  if (t) post("phOut", [forget ? 1 : 0]).catch(function () {  });
  logout("out");
}
function logout(why) {
  stopIdle();
  if (typeof QC !== "undefined" && QC.reset) QC.reset();
  PHRS = null;
  var w = $("#ph-wm"); if (w) w.remove();
  scrLogin(why);
}

function startIdle() {
  stopIdle();
  var tick = function () {
    var left = IDLE_MIN * 60e3 - (Date.now() - LAST), el = $("#ph-idle");
    if (left <= 0) { bye(false); var m = $(".ph-msg"); if (m) m.textContent = "閒置超過 " + IDLE_MIN + " 分鐘，已經自動登出。"; return; }
    if (el) { var s = Math.ceil(left / 1000); el.textContent = "閒置 " + Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2) + " 後登出"; }
  };
  IDT = setInterval(tick, 1000); tick();
}
function stopIdle() { if (IDT) clearInterval(IDT); IDT = 0; }
function poke() {
  LAST = Date.now();
  if (T && Date.now() - PING > 5 * 60e3) { PING = Date.now(); call("phBoot", []).then(function (r) { if (r && r.st === "lock") logout("expired"); }, function () {  }); }
}
["pointerdown", "keydown", "touchstart", "wheel"].forEach(function (ev) { document.addEventListener(ev, poke, { passive: true, capture: true }); });

function wm(who) {
  var old = $("#ph-wm"); if (old) old.remove();
  var d = new Date(), p = function (n) { return ("0" + n).slice(-2); };
  var txt = (who || ((ME && ME.name || "") + " " + (ME && ME.emp || ""))) + "　" + d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + "　內部資料，請勿外傳";
  var c = document.createElement("canvas"), g = c.getContext("2d"), W = 460, H = 220;
  c.width = W; c.height = H;
  g.translate(W / 2, H / 2); g.rotate(-0.38); g.font = "600 15px system-ui,'Noto Sans TC',sans-serif"; g.fillStyle = "rgba(31,42,46,0.075)"; g.textAlign = "center"; g.fillText(txt, 0, 0);
  var w = h("div", { id: "ph-wm", "aria-hidden": "true" }); w.style.backgroundImage = "url(" + c.toDataURL() + ")";
  document.body.appendChild(w);
}

var PHRS = null;
window.PH_SET = function (A, tk) {
  var el = tk.el, toast = tk.toast;
  var box = el("div", { class: "drvbox phrs" });
  A.appendChild(el("h3", { text: "👥 主管名單（可以登入 PH資料庫的人）" }));
  A.appendChild(box);
  var drawList = function (list) {
    box.innerHTML = "";
    box.appendChild(el("div", { class: "okm", text: "目前 " + list.length + " 位。登入要員工編號、姓名都跟這裡一樣（姓名一字不差）。開發者不用在名單上。" }));
    var tb = el("table", { class: "phrt" }, [el("thead", {}, [el("tr", {}, [el("th", { text: "員工編號" }), el("th", { text: "姓名" }), el("th", { text: "備註" }), el("th", { text: "" })])])]);
    var bd = el("tbody");
    list.forEach(function (p) {
      var del = el("button", { type: "button", class: "btn", text: "刪掉" });
      del.onclick = function () {
        if (del.dataset.sure !== "1") { del.dataset.sure = "1"; del.textContent = "確定刪掉？"; return; }
        rs("del", p.emp, "刪掉了：" + p.name);
      };
      bd.appendChild(el("tr", {}, [el("td", { text: p.emp }), el("td", { text: p.name }), el("td", { text: p.note || "" }), el("td", {}, [del])]));
    });
    tb.appendChild(bd);
    if (list.length) box.appendChild(el("div", { class: "tscroll phrsc" }, [tb]));
    var e = el("input", { placeholder: "員工編號", "aria-label": "新增：員工編號", maxlength: "20" }), n = el("input", { placeholder: "姓名", "aria-label": "新增：姓名", maxlength: "20" }), nt = el("input", { placeholder: "備註（可以不寫）", "aria-label": "新增：備註", maxlength: "40" });
    if (typeof QC !== "undefined" && QC.empKeys) QC.empKeys(e, { title: "⌨ 新增：員工編號：", next: n, nextLabel: "下一格（姓名）" });
    var add = el("button", { type: "button", class: "btn pri", text: "＋ 新增一位" });
    add.onclick = function () { if (!e.value.trim() || !n.value.trim()) { toast("員工編號、姓名都要打"); return; } rs("add", JSON.stringify({ emp: e.value.trim(), name: n.value.trim(), note: nt.value.trim() }), "加好了：" + n.value.trim()); };
    box.appendChild(el("div", { class: "lockp phadd" }, [e, n, nt, add]));
    var ta = el("textarea", { rows: "4", class: "phpaste", placeholder: "從 Excel 選兩欄（員工編號、姓名，第三欄備註可以不要）→ 複製 → 貼在這裡；也可以貼名單的截圖（照片）", "aria-label": "貼上主管名單" });
    var fi = el("input", { type: "file", accept: ".xlsx,.csv,.txt,image/*", "aria-label": "選 Excel、CSV 檔或名單的照片" });
    var pv = el("div", { class: "note phpv" }), ok = el("button", { type: "button", class: "btn pri", text: "✔ 用這份換掉整份名單", disabled: "disabled" }), got = [];
    var show = function (rows) {
      got = rows; ok.disabled = !rows.length;
      pv.textContent = rows.length ? "讀到 " + rows.length + " 位（前幾位：" + rows.slice(0, 3).map(function (r) { return r.emp + " " + r.name; }).join("、") + (rows.length > 3 ? "…" : "") + "）。按下面的按鍵換掉整份名單。" : "沒有讀到人（要有員工編號、姓名兩欄）。";
    };
    ta.oninput = function () { show(phRows(ta.value)); };
    var ocr = function (blob) {
      pv.textContent = "⏳ 讀圖片上的字…（10～30 秒）"; ok.disabled = true;
      phShrink(blob, 2000).then(function (u) { return call("phOcr", [u.split(",")[1], "image/jpeg"], { ms: 120000 }); }).then(function (r) {
        if (!r || r.err) { pv.textContent = "❌ " + (r && r.err || "讀不到"); return; }
        var rows = phOcrRows(r.text || "");
        ta.value = rows.map(function (x) { return x.emp + "\t" + x.name; }).join("\n");
        show(rows);
        pv.textContent = rows.length ? "📷 從圖片讀到 " + rows.length + " 位（上面的格子可以改；辨識可能會錯，請一位一位看過）。按下面的按鍵換掉整份名單。" : "📷 圖片上找不到「員工編號＋姓名」：請改用貼上文字或 Excel。";
      }, function (x) { pv.textContent = "❌ " + String(x && x.message || x); });
    };
    ta.addEventListener("paste", function (ev) {
      var it = [].slice.call((ev.clipboardData && ev.clipboardData.items) || []).filter(function (x) { return x.kind === "file" && /^image\//.test(x.type); })[0];
      if (!it) return;
      ev.preventDefault(); ocr(it.getAsFile());
    });
    fi.onchange = function () {
      var f = fi.files && fi.files[0]; if (!f) return;
      if (/^image\//.test(f.type)) { ocr(f); return; }
      pv.textContent = "⏳ 讀檔中…";
      (/\.xlsx$/i.test(f.name) ? phXlsx(f) : f.text()).then(function (t) { show(phRows(t)); }, function (x) { pv.textContent = "❌ 讀不到這個檔：" + String(x && x.message || x); });
    };
    ok.onclick = function () { if (!got.length) return; if (ok.dataset.sure !== "1") { ok.dataset.sure = "1"; ok.textContent = "確定要換掉整份名單（" + got.length + " 位）？"; return; } rs("put", JSON.stringify(got), "名單換好了：" + got.length + " 位"); };
    box.appendChild(el("details", { class: "phimp" }, [el("summary", { text: "⬆ 匯入整份名單（Excel、CSV、或貼上）" }), el("div", { class: "phimpb" }, [fi, ta, pv, ok])]));
  };
  var rs = function (act, a, done) {
    box.classList.add("busy");
    call("phRoster", [act, a], { ms: 60000 }).then(function (r) {
      box.classList.remove("busy");
      if (r && r.err) { toast("❌ " + r.err); return; }
      PHRS = r.list || []; drawList(PHRS); if (done) toast(done);
      if (act !== "list" && typeof QC !== "undefined" && QC.dropPeople) QC.dropPeople();
    }, function (x) { box.classList.remove("busy"); toast("❌ " + x.message); });
  };
  if (PHRS) drawList(PHRS); else { box.appendChild(el("div", { class: "note", text: "⏳ 讀取中…" })); rs("list", ""); }
  var mh = el("h3", { text: "📦 從藥戰手冊搬過來（查核和查檢的舊資料）" }); mh.hidden = true;
  A.appendChild(mh);
  var mg = el("div", { class: "drvbox phmig" }), mm = el("div", { class: "note phmm" }), bar = el("div", { class: "phpb" }, [el("i")]);
  var go = el("button", { type: "button", class: "btn pri", text: "開始搬" });
  mg.appendChild(el("div", { class: "note", text: "送出過的紀錄、明細、修改紀錄、PDF（含舊版）、院名標誌、設定（院區、表單、鎖住、可以修改的人）一起搬過來；藥戰手冊那邊的不刪。搬到一半斷了：再按一次接著搬；搬過的不會重複。還沒送出的暫存不搬。" }));
  mg.appendChild(go); mg.appendChild(bar); mg.appendChild(mm); mg.hidden = true;
  A.appendChild(mg);
  call("phMig", ["info"]).then(function (r) {
    if (r && r.done && !r.busy) { mh.remove(); mg.remove(); return; }
    mh.hidden = false; mg.hidden = false;
    if (!r || r.err) { mm.textContent = "❌ " + (r && r.err || ""); return; }
    if (!r.hb) { go.disabled = true; mm.textContent = "⚠ 還沒接上藥戰手冊（PH資料庫的指令碼屬性 HB_URL、PH_LINK_KEY；藥戰手冊也要有一樣的 PH_LINK_KEY）"; return; }
    if (r.done) { go.textContent = "再搬一次（只搬新的）"; mm.textContent = "✅ 搬過了：" + r.done; }
    if (r.busy) { go.textContent = "接著搬"; mm.textContent = "上次搬到一半：按「接著搬」"; }
  }, function (x) { mm.textContent = "❌ " + x.message; });
  go.onclick = function () {
    go.disabled = true; bar.classList.add("on"); mm.textContent = "⏳ 跟藥戰手冊拿清單…（不要關掉這一頁）";
    var step = function () {
      call("phMig", ["step"], { ms: 90000 }).then(function (r) {
        if (!r || r.err) { go.disabled = false; mm.textContent = "❌ " + (r && r.err || "搬家停了") + "（再按一次接著搬）"; return; }
        if (r.wait) { setTimeout(step, 3000); return; }
        if (r.more) { bar.firstChild.style.width = Math.round(r.n / Math.max(1, r.total) * 100) + "%"; mm.textContent = "⏳ 搬檔中：" + r.n + "／" + r.total + (r.fail ? "（" + r.fail + " 個拿不到）" : ""); step(); return; }
        bar.firstChild.style.width = "100%"; go.disabled = false; go.textContent = "再搬一次（只搬新的）";
        mm.textContent = "✅ 搬好了：" + r.n + " 份、" + r.files + " 個檔" + (r.fail ? "（" + r.fail + " 個檔拿不到：那幾份的 PDF 會顯示「不見了」）" : "") + "。到「📁 查閱」看看。";
        toast("搬好了"); if (typeof QC !== "undefined") {  }
      }, function (x) { go.disabled = false; mm.textContent = "❌ " + x.message + "（再按一次接著搬）"; });
    };
    step();
  };
};

function phShrink(blob, max) {
  return new Promise(function (ok, bad) {
    var u = URL.createObjectURL(blob), im = new Image();
    im.onload = function () {
      var sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * sc)); c.height = Math.max(1, Math.round(im.naturalHeight * sc));
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.88));
    };
    im.onerror = function () { URL.revokeObjectURL(u); bad(new Error("這不是看得懂的圖片")); };
    im.src = u;
  });
}
var PH_HD = /^(員工編號|員工|編號|姓名|名字|備註|主管|名單|主管名單|單位|職稱|部門|科別|序號|電話|分機)$/;
function phOcrRows(t) {
  var EMP = /(?:^|[^A-Za-z0-9])([A-Za-z]{0,3}\d{3,8})(?![A-Za-z0-9])/, NM = /[\u3400-\u9fff]{2,5}/g;
  var names = function (l) { return (l.match(NM) || []).filter(function (x) { return !PH_HD.test(x); }); };
  var rows = [], seen = {};
  var put = function (e, n) { e = e.toUpperCase(); if (seen[e] || !n) return; seen[e] = 1; rows.push({ emp: e, name: n }); };
  String(t || "").split(/\r?\n/).forEach(function (l) { var m = EMP.exec(l), n = names(l); if (m && n.length) put(m[1], n[0]); });
  if (rows.length) return rows;
  var es = [], ns = [];
  String(t || "").split(/\r?\n/).forEach(function (l) { var m = EMP.exec(l); if (m) es.push(m[1]); else ns = ns.concat(names(l)); });
  for (var i = 0; i < Math.min(es.length, ns.length); i++) put(es[i], ns[i]);
  return rows;
}
function phRows(txt) {
  var out = [], seen = {};
  String(txt || "").replace(/^﻿/, "").split(/\r?\n/).forEach(function (line) {
    if (!line.trim()) return;
    var c = line.indexOf("\t") >= 0 ? line.split("\t") : phCsv(line);
    c = c.map(function (x) { return String(x || "").replace(/^"|"$/g, "").trim(); });
    var e = (c[0] || "").replace(/[\s　]+/g, ""), n = (c[1] || "").replace(/[\s　]+/g, " ").trim();
    if (!e || !n || /編號|工號|emp/i.test(e) || !/[0-9A-Za-z]/.test(e)) return;
    var k = e.toUpperCase().replace(/^0+(?=\d)/, "");
    if (seen[k]) return; seen[k] = 1;
    out.push({ emp: e.slice(0, 20), name: n.slice(0, 20), note: (c[2] || "").slice(0, 40) });
  });
  return out.slice(0, 2000);
}
function phCsv(line) {
  var out = [], cur = "", q = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}
function phXlsx(file) {
  if (!window.DecompressionStream) return Promise.reject(new Error("這個瀏覽器不能讀 Excel：請在 Excel 裡複製、貼上，或存成 CSV"));
  return file.arrayBuffer().then(function (buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf), files = {};
    var eo = -1;
    for (var i = u.length - 22; i >= Math.max(0, u.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eo = i; break; }
    if (eo < 0) throw new Error("不是 Excel 檔");
    var n = dv.getUint16(eo + 10, true), p = dv.getUint32(eo + 16, true);
    for (var k = 0; k < n; k++) {
      var meth = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + nl));
      var ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      files[name] = { m: meth, d: u.subarray(ds, ds + csz) };
      p += 46 + nl + xl + cl;
    }
    var get = function (nm) {
      var f = files[nm]; if (!f) return Promise.resolve("");
      if (f.m === 0) return Promise.resolve(new TextDecoder().decode(f.d));
      return new Response(new Blob([f.d]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
    };
    var sheet = Object.keys(files).filter(function (x) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(x); }).sort()[0];
    if (!sheet) throw new Error("Excel 裡沒有工作表");
    return Promise.all([get("xl/sharedStrings.xml"), get(sheet)]).then(function (r) {
      var dp = new DOMParser(), ss = [];
      if (r[0]) Array.prototype.forEach.call(dp.parseFromString(r[0], "application/xml").getElementsByTagName("si"), function (si) { ss.push(Array.prototype.map.call(si.getElementsByTagName("t"), function (t) { return t.textContent; }).join("")); });
      var lines = [];
      Array.prototype.forEach.call(dp.parseFromString(r[1], "application/xml").getElementsByTagName("row"), function (row) {
        var cells = [];
        Array.prototype.forEach.call(row.getElementsByTagName("c"), function (c) {
          var ref = c.getAttribute("r") || "", col = 0, m = /^([A-Z]+)/.exec(ref);
          if (m) for (var j = 0; j < m[1].length; j++) col = col * 26 + m[1].charCodeAt(j) - 64;
          var v = c.getElementsByTagName("v")[0], t = c.getAttribute("t"), val = "";
          if (t === "s" && v) val = ss[+v.textContent] || ""; else if (t === "inlineStr") val = Array.prototype.map.call(c.getElementsByTagName("t"), function (x) { return x.textContent; }).join(""); else if (v) val = v.textContent;
          cells[(col || cells.length + 1) - 1] = val;
        });
        lines.push(Array.prototype.map.call(cells, function (x) { return x || ""; }).join("\t"));
      });
      return lines.join("\n");
    });
  });
}

window.PH_SHARE = function (o) { return call("phShare", ["make", "", JSON.stringify(o)], { ms: 60000 }); };
window.PH_SHARE_OFF = function (t) { return call("phShare", ["off", t]); };
function scrShare() {
  card(title("⏳ 讀取中…"));
  post("phView", [SHR]).then(function (j) {
    var r = j && j.ok === 1 ? j.r : null;
    if (!r || !r.ok || !r.sum) { card(title("QR 打不開").concat([h("p", { class: "ph-note", text: (r && r.err) || (j && j.err) || "請再跟主管要一個新的 QR。" })])); return; }
    APP.className = "ph-app in"; APP.innerHTML = "";
    var left = h("span", { class: "ph-who", id: "ph-qrleft" });
    APP.appendChild(h("header", { class: "ph-bar" }, [h("b", { class: "ph-bt", text: "🗂 PH資料庫" }), h("span", { class: "ph-bs" }, [left])]));
    var col = h("main", { class: "ph-main" }), wrap = h("div", { class: "qcz qcroot phshr" }), inner = h("div", { class: "wrap" });
    wrap.appendChild(inner); col.appendChild(wrap); APP.appendChild(col);
    wm("QR 檢視");
    if (typeof QC !== "undefined" && QC.sumBox) inner.appendChild(QC.sumBox(r.sum, "製表：" + (r.sum.at || "") + "。這是 QR 檢視：只看得到這個月的彙整（不能看每一份、不能填、不能改）；QR 時間到了這一頁就清掉。"));
    var tm = 0, tick = function () {
      var s = Math.max(0, Math.round((r.exp - Date.now()) / 1000));
      left.textContent = "📱 QR 檢視・剩 " + Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2);
      if (!s) { clearInterval(tm); [].slice.call(document.querySelectorAll(".dayv")).forEach(function (x) { x.remove(); }); card(title("QR 時間到了").concat([h("p", { class: "ph-note", text: "這一頁已經清掉了。要再看，請跟主管要一個新的 QR。" })])); var w = $("#ph-wm"); if (w) w.remove(); }
    };
    tm = setInterval(tick, 1000); tick();
  }, function (e) { card(title("QR 打不開").concat([h("p", { class: "ph-note", text: "連不上（" + String(e && e.message || e) + "），網路好了再掃一次。" })])); });
}
function phStart() {
  APP = $("#app");
  if (window.top !== window.self) { document.documentElement.innerHTML = ""; return; }
  if (!X) { scrNoX(); return; }
  if (SHR) { scrShare(); return; }
  if (!T) { scrLogin(); return; }
  card(title("⏳ 讀取中…"));
  call("phBoot", []).then(function (r) {
    if (!r || r.st === "lock" || !r.ok) { scrLogin(r && r.st === "lock" ? "expired" : ""); return; }
    enter({ t: T, me: r.me, idle: r.idle });
  }, function (x) { scrLogin(); var m = $(".ph-msg"); if (m) m.textContent = "❌ " + x.message; });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", phStart); else phStart();

var QC = (function () {
"use strict";
var Q = { boot: false, busy: false, none: false, dev: false, may: false, me: { name: "", emp: "" }, cfg: null, drafts: {}, list: null, listBusy: false, people: null, root: null, ov: null, tab: "fill", err: "", draftLoaded: {}, sending: false, whoC: {} };
var SITES = {}, SORD = [];
var TITLE = "台北藥劑科門診 藥袋列印品質 暨 調劑品質 查檢表";
var ITEMS = ["藥袋列印品質：列印字樣能清楚辨識無斷句、條碼刷讀檢測", "藥袋調劑品質：劑型、規格、藥品、用法、數量，是否正確"];
var S = { site: "a", sig: null, rows: {}, edit: null, ce: { emp: "", name: "" } };
var $ = function (s, r) { return (r || document).querySelector(s); };
function el(t, a, kids) { var x = document.createElement(t); for (var k in (a || {})) { if (k === "text") x.textContent = a[k]; else if (k.slice(0, 2) === "on") x[k] = a[k]; else if (a[k] !== null && a[k] !== undefined) x.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c) x.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return x; }
function ovl() {
  if (!Q.ov || !Q.ov.isConnected) { Q.ov = el("div", { class: "qcz qcov" }, [el("div", { class: "toast", id: "qc-toast", role: "status" })]); document.body.appendChild(Q.ov); }
  return Q.ov;
}
function toast(s) { ovl(); var t = $("#qc-toast"); t.textContent = s; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("on"); }, 2600); }
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function today() { var d = new Date(); return d.getFullYear() + "/" + pad2(d.getMonth() + 1) + "/" + pad2(d.getDate()); }
function R(i) { return S.rows[i] || (S.rows[i] = { d: "", no: "", n: "", a: "", am: "", b: "", bm: "" }); }
function me() { return (Q.me.name || "藥師") + (Q.me.emp ? "（" + Q.me.emp + "）" : ""); }
function ceOf(sg) { var m = /^(.*)（([A-Z0-9\-]+)）$/.exec(String(sg && sg.who || "")); return m ? { emp: m[2], name: m[1] } : { emp: "", name: String(sg && sg.who || "") }; }
function ceReady() { return !!(S.ce && S.ce.emp && S.ce.name); }
function ceWho() { return S.ce.name + "（" + S.ce.emp + "）"; }
function ceFocus() { var x = $(S.ce.emp ? "#qc-cename" : "#qc-ceemp"); if (x) x.focus(); }
function bagSigDrop() {
  if (S.sig && S.sig.who !== ceWho()) { S.sig.img = null; S.sig = null; var b = document.querySelector(".qcz .paper:not(.pidp) .signrow .sigbox"); if (b) { b.classList.remove("done"); b.innerHTML = ""; b.appendChild(el("span", { class: "ph", text: "✍️ 點這裡電子簽名" })); } toast("查檢者換了：簽名拿掉了，請重新簽"); }
}
function ceFields(st, o) {
  st = st || S.ce; o = o || { id: 1, kp: "⌨ 查檢者 員工編號：", drop: bagSigDrop };
  var ro = !!S.edit, auto = st.auto && st.auto === st.name ? st.name : "";
  var emp = el("input", { id: o.id ? "qc-ceemp" : null, class: "ceemp", value: st.emp, "aria-label": "查檢者 員工編號", inputmode: TOUCH ? "none" : "text", autocapitalize: "characters", autocorrect: "off", lang: "en", autocomplete: "off", spellcheck: "false", maxlength: "12" });
  var nm = el("input", { id: o.id ? "qc-cename" : null, class: "cename", value: st.name, "aria-label": "查檢者 姓名", autocomplete: "off", maxlength: "12" });
  if (ro) { emp.readOnly = true; nm.readOnly = true; emp.title = nm.title = "修改的時候，查檢者不變"; }
  var box = function (t, inp, c) { var b = el("label", { class: "cebox " + c + (inp.value ? " has" : "") }, [el("span", { class: "celb", text: t }), inp]); return b; };
  var bE = box("員工編號", emp, "cbe"), bN = box("姓名", nm, "cbn"), upd = function () { bE.classList.toggle("has", !!emp.value); bN.classList.toggle("has", !!nm.value); };
  var out = [bE, bN];
  if (ro) return out;
  var changed = function () { o.drop(st); };
  var autoName = function () {
    var e = st.emp, fill = function (n) { if (st.emp !== e || (st.name && st.name !== auto)) return; if (n) { st.name = n; nm.value = n; auto = n; } else if (auto && st.name === auto) { st.name = ""; nm.value = ""; auto = ""; } st.auto = auto; upd(); changed(); };
    if (!e || e.length < 2 || (st.name && st.name !== auto)) return;
    clearTimeout(autoName.t);
    autoName.t = setTimeout(function () {
      if (Q.whoC[e] !== undefined) { fill(Q.whoC[e]); return; }
      api("who", e).then(function (x) { Q.whoC[e] = x.name || ""; fill(Q.whoC[e]); }, function () {  });
    }, 350);
  };
  var en = forceKeys(emp, codeChar, 12, st.emp, function (v) { st.emp = v; upd(); changed(); autoName(); });
  emp.oninput = function () { if (en.comp()) return; var v = emp.value.replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).toUpperCase().replace(/[^A-Z0-9\-]/g, ""); if (v !== emp.value) emp.value = v; st.emp = v; en.sync(v); upd(); changed(); autoName(); };
  nm.oninput = function () { st.name = nm.value.trim(); auto = ""; st.auto = ""; upd(); changed(); };
  if (TOUCH) { emp.addEventListener("focus", function () { kpOpen(emp, null, 0, { title: o.kp, letters: true, sym: "-", max: 12, next: nm, nextLabel: "下一格（姓名）" }); }); emp.addEventListener("blur", function () { setTimeout(function () { if (KP && KP.inp === emp && document.activeElement !== emp) kpClose(); }, 0); }); }
  return out;
}
function isDev() { return !!Q.dev; }
function mayEdit() { return !!(Q.dev || Q.may); }
function mkey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1); }
function lockAt(key) {
  var c = Q.cfg || {}, L = (c.lock || {})[key] || {}, p = key.split("-");
  if (L.at) return new Date(L.at);
  if (c.autoDay) return new Date(+p[0], +p[1], c.autoDay, 0, 0);
  return null;
}
function isLocked(key) { var L = ((Q.cfg || {}).lock || {})[key] || {}; if (L.st === "lock") return true; if (L.st === "open") return false; var t = lockAt(key); return !!(t && new Date() >= t); }
function canEdit(rec) { return mayEdit() && !isLocked(mkey(rec.at)); }

function api(act, a, b) {
  return call("hbQc", [act, a === undefined ? "" : a, b === undefined ? "" : b], { ms: 120000 }).then(function (r) {
    if (r && r.st === "lock") { logout("expired"); throw new Error("驗證過期了"); }
    if (!r) throw new Error("後端沒有回應");
    if (r.err) throw new Error(r.err);
    if (r.st && !r.ok) throw new Error(r.st === "closed" ? "手冊還沒開放" : "現在不能用（請重新整理）");
    return r;
  }, function (e) { if (e && e.code === "bad") throw new Error("藥戰手冊的後端還不認得「查核和查檢」：Apps Script 的 03_藥戰網頁 要換成第 70 批、部署新版本"); throw e; });
}
function errText(e) { return String(e && e.message || e || "出錯了"); }
function toB64(blob) { return new Promise(function (ok, bad) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result).replace(/^data:[^,]*,/, "")); }; fr.onerror = function () { bad(new Error("讀不到 PDF")); }; fr.readAsDataURL(blob); }); }
function b64Bytes(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function pdfJpegs(u8) {
  var bin = "", out = [], CH = 32768;
  for (var i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  var re = /\/Filter \/DCTDecode \/Length (\d+) >>\nstream\n/g, m;
  while ((m = re.exec(bin))) { var st = m.index + m[0].length, n = +m[1]; out.push("data:image/jpeg;base64," + btoa(bin.substr(st, n))); re.lastIndex = st + n; }
  return out;
}
function fetchPdf(r, ver) {
  if (ver === undefined && r.pdf && r.pngs) return Promise.resolve(r);
  return api("pdf", r.id, ver === undefined ? "" : String(ver)).then(function (x) {
    var u8 = b64Bytes(x.b64), o = ver === undefined ? r : { id: r.id, form: r.form, site: r.site, at: r.at };
    o.pdf = new Blob([u8], { type: "application/pdf" }); o.pngs = pdfJpegs(u8); o.png = o.pngs[0]; o.file = x.name;
    if (!o.pngs.length) throw new Error("PDF 打不開");
    return o;
  });
}
function fetchAll(list, what) {
  var i = 0;
  return (function next() {
    if (i >= list.length) return Promise.resolve(list);
    var r = list[i++];
    if (list.length > 1) toast(what + "：拿 PDF 中（" + i + "／" + list.length + "）");
    return fetchPdf(r).then(next);
  })();
}
function mkRec(x) {
  var d = x.data || {}, r = { id: x.id, form: x.form, site: x.site, at: new Date(x.at), used: x.used, ng: x.ng, by: x.by || "", hn: x.hn || 0, edits: (x.eds || []).map(function (e) { return { who: e.who, at: new Date(e.at) }; }) };
  if (x.form === "pid") r.secs = (d.secs || []).map(function (s) { var c = JSON.parse(JSON.stringify(s)); return c; }); else { r.rows = d.rows || []; r.sig = d.sig || null; }
  return r;
}
function noImgSig(s) { return s ? { who: s.who, at: s.at } : null; }
var QC_CSS = ".qcz{--ink:#1F2A2E;--ink2:#4A5565;--muted:#6B7680;--line:#1F2A2E;--line2:#C9D2CF;--bg:#F4F7F6;--paper:#fff;--accent:#1B7F5C;--ok:#15803D;--okbg:#E8F6EE;--bad:#B91C1C;--badbg:#FDECEC;--hi:#FFF4CC}\n.qcz *{box-sizing:border-box}\n.qcz{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,\"Noto Sans TC\",\"PingFang TC\",\"Microsoft JhengHei\",sans-serif;font-size:15px}\n.qcz .top{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--line2);padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}\n.qcz .top b{font-size:15px}\n.qcz .seg{display:inline-flex;border:1px solid var(--line2);border-radius:999px;overflow:hidden}\n.qcz .seg button{border:0;background:#fff;padding:7px 14px;font:inherit;cursor:pointer;color:var(--ink2)}\n.qcz .seg button.on{background:var(--accent);color:#fff;font-weight:700}\n.qcz .note{font-size:12.5px;color:var(--muted)}\n.qcz .wrap{max-width:1180px;margin:16px auto;padding:0 16px 80px}\n.qcz .paper{background:var(--paper);border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:20px 22px 26px}\n.qcz .hd{display:flex;align-items:center;gap:12px;min-height:56px}\n.qcz .logo{display:flex;align-items:center;gap:10px}\n.qcz .logo i{width:44px;height:44px;border-radius:8px;background:#C62828;display:grid;place-items:center;color:#fff;font-style:normal;font-weight:900;font-size:22px}\n.qcz .logo span{font-weight:800;font-size:20px;letter-spacing:.08em}\n.qcz .logo small{display:block;font-size:11px;color:var(--muted);letter-spacing:0;font-weight:600}\n.qcz .logo.kid i{background:linear-gradient(135deg,#E53935,#F06292)}\n.qcz h1{font-size:clamp(18px,2.6vw,30px);margin:10px 0 4px;text-align:center;letter-spacing:.04em;font-weight:900;text-wrap:balance}\n.qcz .signrow{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin:6px 0 10px;flex-wrap:wrap}\n.qcz .signrow .lb{font-weight:800;font-size:18px}\n.qcz .cebox{position:relative;display:inline-flex;align-items:stretch;width:8.5em;height:50px;border:1.5px solid #9AA7A3;border-radius:8px;background:#fff;cursor:text}\n.qcz .cebox:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px rgba(27,127,92,.15)}\n.qcz .cebox input{flex:1;min-width:0;width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink);padding:18px 10px 4px;border-radius:8px}\n.qcz .cebox .celb{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9AA7A3;font-size:15px;font-weight:600;pointer-events:none;transition:top .12s,font-size .12s,color .12s}\n.qcz .cebox.has .celb,.qcz .cebox:focus-within .celb{top:12px;font-size:11px;color:var(--ink2)}\n.qcz .cbe input{text-transform:uppercase;letter-spacing:.04em}\n.qcz .cebox:has(input[readonly]){background:#F1F4F3}\n@media (max-width:560px){.qcz .signrow{justify-content:flex-start}.qcz .signrow .lb{flex-basis:100%}.qcz .cebox{flex:1 1 40%;width:auto}.qcz .signrow .sigbox{flex-basis:100%}}\n.qcz .msum{border:1.5px solid var(--accent);border-radius:12px;background:#fff;padding:12px 14px;margin:8px 0 14px}\n.qcz .msum .mshd{display:flex;flex-wrap:wrap;align-items:center;gap:8px}\n.qcz .msum .mshd b{font-size:17px;margin-right:auto}\n.qcz .msum .mshd .btn{padding:7px 12px;font-size:14px}\n@media (max-width:560px){.qcz .msum .mshd b{flex-basis:100%}.qcz .msum .mshd .btn{padding:6px 10px;font-size:13px}}\n.qcz .msum h4{margin:14px 0 6px;color:var(--accent);font-size:15px}\n.qcz .msum .mswrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\n.qcz .mstab{border-collapse:collapse;width:100%;min-width:520px;font-size:14px}\n.qcz .mstab th,.qcz .mstab td{border:1px solid var(--line2);padding:6px 8px;text-align:left;vertical-align:top}\n.qcz .mstab th{background:#E8F1EE;font-weight:800;white-space:nowrap}\n.qcz .mstab td.num{text-align:center;font-variant-numeric:tabular-nums}\n.qcz .mstab td.b{font-weight:800}\n.qcz .mstab td.red{color:var(--bad);font-weight:700}\n.qcz .msumbtn.on{border-color:var(--accent);color:var(--accent)}\n.qcz .qrv{display:flex;align-items:center;justify-content:center;background:rgba(15,25,22,.6)}\n.qcz .qrbox{background:#fff;border-radius:14px;padding:18px 20px;max-width:420px;width:calc(100% - 32px);text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}\n.qcz .qrbox h3{margin:0;font-size:17px}\n.qcz .qrbox .qrimg{width:min(300px,70vw);height:auto;image-rendering:pixelated;border:1px solid var(--line2);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}\n.qcz .mstab th:first-child,.qcz .mstab td:first-child{min-width:8.5em}\n.qcz .qrbox .qrt{font-size:14px;color:var(--ink2)}\n.qcz .qrbox .qrleft{color:var(--bad);font-variant-numeric:tabular-nums}\n.qcz .pastebox{min-width:200px;min-height:38px;border:1.5px dashed #9AA7A3;border-radius:8px;padding:8px 10px;font-size:13px;color:var(--muted);background:#FAFCFB;cursor:text;outline:none;caret-color:transparent;overflow:hidden;max-height:60px}\n.qcz .pastebox:empty::before{content:attr(data-ph)}\n.qcz .pastebox:focus{border-color:var(--accent);background:#F1F7F5}\n.qcz .attbox{margin-top:16px;border:1px dashed var(--line2);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}\n.qcz .atthd{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}\n.qcz .attrow{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}\n.qcz .attpick{position:relative;overflow:hidden;display:inline-flex;align-items:center;padding:8px 14px}\n.qcz .attpick input{position:absolute;inset:0;opacity:0;cursor:pointer}\n.qcz .attpaste{flex:1 1 220px}\n.qcz .attth{display:flex;flex-wrap:wrap;gap:8px}\n.qcz .attit{position:relative;width:96px;height:96px;border:1px solid var(--line2);border-radius:8px;overflow:hidden;background:#fff}\n.qcz .attit img{width:100%;height:100%;object-fit:cover}\n.qcz .attit span{position:absolute;left:4px;bottom:3px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;border-radius:4px;padding:0 5px}\n.qcz .attit .attx{position:absolute;right:3px;top:3px;border:0;border-radius:999px;width:26px;height:26px;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;font-size:13px}\n.qcz .pline .cebox{width:7.5em;height:46px}\n.qcz .pline .cebox input{border:0;border-bottom:0;background:transparent;padding:17px 9px 3px;border-radius:8px;outline:0}\n.qcz .pline .cebox input:focus{outline:0}\n.qcz .pline{gap:10px 18px}\n.qcz .pgrp{display:inline-flex;align-items:center;gap:6px 8px;flex-wrap:nowrap}\n@media (max-width:760px){.qcz .pgrp{flex-wrap:wrap}}\n@media (max-width:560px){.qcz .pgrp{width:100%}.qcz .pgrp>.plb:first-child{flex-basis:100%}.qcz .pgrp .pemp,.qcz .pgrp .pname{flex:1 1 40%;width:auto}.qcz .pgrp .cebox{flex:1 1 40%}.qcz .pgrp .sigbox{flex:1 1 60%}}\n.qcz .kbdh{margin:2px 0 8px;font-size:12.5px}\n.qcz td.c:focus{outline:3px solid var(--accent);outline-offset:-3px}\n.qcz .pop button.tdy{font-weight:800;border-color:var(--accent);color:var(--accent)}\n.qcz .sigbox{min-width:220px;min-height:52px;border:1.5px dashed #9AA7A3;border-radius:8px;display:flex;align-items:center;gap:10px;padding:4px 10px;cursor:pointer;background:#FAFCFB}\n.qcz .sigbox.done{border-style:solid;border-color:var(--accent);background:#fff}\n.qcz .sigbox img{height:44px;max-width:180px;pointer-events:none;-webkit-user-drag:none;user-select:none}\n.qcz .sigbox.done{user-select:none;-webkit-user-select:none}\n.qcz .sigbox .st{font-size:12.5px;color:var(--ink2);line-height:1.35}\n.qcz .sigbox .ph{color:var(--muted);font-size:14px}\n.qcz .tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch}\n.qcz table{border-collapse:collapse;width:100%;min-width:920px;table-layout:fixed}\n.qcz th,.qcz td{border:1px solid var(--line);padding:0;height:34px;font-size:15px;text-align:center;vertical-align:middle}\n.qcz thead th{font-size:clamp(14px,1.6vw,19px);font-weight:900;text-align:left;padding:8px 12px;line-height:1.5;vertical-align:top}\n.qcz thead th.diag{position:relative;text-align:right;vertical-align:middle;padding-right:18px;background:linear-gradient(to top right,transparent calc(50% - .6px),#3B82C4 50%,transparent calc(50% + .6px))}\n.qcz tr.sub th{font-weight:800;font-size:15px;padding:4px 2px;text-align:center;border-bottom:1.5px solid var(--line)}\n.qcz tr.sub th.colh{cursor:pointer;color:var(--accent);text-decoration:underline dotted;text-underline-offset:3px}\n.qcz tr.sub th.colh:hover{background:#F1F7F5}\n.qcz tr.sub.thick th{border-top:3px solid var(--line)}\n.qcz tbody.sec{border-top:3px solid var(--line)}\n.qcz td.c{cursor:pointer;position:relative;user-select:none}\n.qcz td.c:hover{background:#F1F7F5}\n.qcz td.c.on{background:var(--okbg);color:var(--ok);font-weight:900;font-size:19px}\n.qcz td.c.on.badc{background:var(--badbg);color:var(--bad)}\n.qcz td input{width:100%;height:100%;min-height:32px;border:0;background:transparent;font:inherit;text-align:center;padding:2px 4px;color:var(--ink)}\n.qcz td input:focus{outline:2px solid var(--accent);outline-offset:-2px;background:#fff}\n.qcz td.memo input{text-align:left}\n.qcz td.memo.need input{background:var(--hi)}\n.qcz td.dt{cursor:pointer}\n.qcz td.dt span{display:block;padding:6px 2px;min-height:32px;font-variant-numeric:tabular-nums;white-space:nowrap;font-size:14px}\n.qcz td.dt span:empty::after{content:\"點一下\";color:#B8C2BF;font-size:12px}\n.qcz .pop{position:absolute;z-index:50;background:#fff;border:1px solid var(--line2);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:6px;min-width:190px}\n.qcz .pop button{font:inherit;font-size:14px;text-align:left;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:7px 10px;cursor:pointer}\n.qcz .pop button:hover{background:#F1F7F5}\n.qcz .pop button.pri{background:var(--accent);border-color:var(--accent);color:#fff}\n.qcz .pop .row{display:flex;gap:6px;align-items:center}\n.qcz .pop select,.qcz .pop input{font:inherit;font-size:14px;padding:5px;border:1px solid var(--line2);border-radius:6px}\n.qcz .pop .t{font-size:12px;color:var(--muted);padding:0 2px}\n.qcz .bar{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}\n.qcz .btn{font:inherit;border-radius:10px;padding:10px 18px;border:1px solid var(--line2);background:#fff;cursor:pointer}\n.qcz .btn.pri{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:800}\n.qcz .msg{margin-top:12px;font-size:14px;line-height:1.6}\n.qcz .msg .bad{color:var(--bad)}\n.qcz .msg .okm{color:var(--ok)}\n.qcz .modal{position:fixed;inset:0;background:rgba(10,20,25,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}\n.qcz .dlg{background:#fff;border-radius:14px;padding:16px 18px;width:min(560px,100%)}\n.qcz .dlg h3{margin:0 0 8px}\n.qcz .sigfs{position:fixed;inset:0;z-index:150;background:#fff;display:flex;flex-direction:column}\n.qcz .sigfs .sgin{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;overflow:hidden;background:#fff}\n.qcz .sigfs .sgstage{position:absolute;inset:0}\n.qcz .sigfs .pad{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block;background:repeating-linear-gradient(0deg,#fff 0,#fff 49px,#F0F3F2 50px)}\n.qcz .sigfs .base{position:absolute;left:5%;right:5%;bottom:calc(max(8px,env(safe-area-inset-bottom,0px)) + 28px);border-bottom:2px dashed #C9D2CF;pointer-events:none}\n.qcz .sigfs .base span{position:absolute;left:0;bottom:6px;color:#B8C2BF;font-size:15px}\n.qcz .sigfs .sgbar{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;align-items:flex-start;gap:8px;padding:max(8px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) 18px max(10px,env(safe-area-inset-left,0px));pointer-events:none;background:linear-gradient(to bottom,rgba(255,255,255,.88) 0,rgba(255,255,255,.55) 65%,rgba(255,255,255,0) 100%)}\n.qcz .sigfs.rot .sgbar{padding:8px 12px 18px}\n.qcz .sigfs .sgt{display:flex;flex-direction:column;gap:2px;min-width:0;margin-right:auto;padding-top:2px}\n.qcz .sigfs .sgt b{font-size:15px;color:#1F2A2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.qcz .sigfs .sgt .who{font-size:12px;color:#6B7680;display:block;line-height:1.35}\n.qcz .sigfs .sgbtns{display:flex;gap:8px;flex:none;pointer-events:none}\n.qcz .sigfs .sgbtns .btn{pointer-events:auto;border-radius:999px;padding:9px 18px;font-size:16px;font-weight:700;min-height:42px;background:rgba(255,255,255,.96);border:1px solid #C9D2CF;box-shadow:0 3px 10px rgba(0,0,0,.16);touch-action:manipulation}\n.qcz .sigfs .sgbtns .btn.fix.on{background:#FFF4CC;border-color:#E8C66A;color:#7A5200}\n.qcz .sigfs .sgbtns .btn.pri{background:var(--accent);color:#fff;border-color:var(--accent)}\n.qcz .sigfs .wipehint{position:absolute;right:12px;bottom:max(8px,env(safe-area-inset-bottom,0px));color:#AEB8B5;font-size:12px;pointer-events:none;z-index:2}\n.qcz .sigfs .rothint{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:2;pointer-events:none;background:rgba(31,42,46,.78);color:#fff;font-size:15px;padding:10px 16px;border-radius:12px;max-width:80%;text-align:center;opacity:0;transition:opacity .4s}\n.qcz .sigfs.rot .rothint.on{opacity:1}\n@media (max-width:560px),(max-height:430px){.qcz .sigfs .sgt .who{display:none}.qcz .sigfs .sgbtns .btn{padding:8px 14px;font-size:15px;min-height:40px}}\n.qcz .sigfs.rot .sgt .who{display:none}\n.qcz .sigbox.done{touch-action:none}\n.qcz .sigbox .gs{font-size:11px;color:var(--muted)}\n.qcz .tabs{display:inline-flex;border:1px solid var(--line2);border-radius:10px;overflow:hidden}\n.qcz .tabs button{border:0;background:#fff;padding:7px 14px;font:inherit;cursor:pointer}\n.qcz .tabs button.on{background:#1F2A2E;color:#fff;font-weight:700}\n@media (max-width:520px){.qcz .tabs .tsub{display:none}}\n.qcz .arch h2{font-size:20px;margin:4px 0 12px}\n.qcz .yr{margin:14px 0 6px;font-weight:900;font-size:18px}\n.qcz .mgrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}\n@media (max-width:640px){.qcz .mgrid{grid-template-columns:repeat(4,minmax(0,1fr))}}\n.qcz .mb{font:inherit;border:1px solid var(--line2);background:#fff;border-radius:10px;padding:8px 4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:58px}\n.qcz .mb b{font-size:16px}\n.qcz .mb small{font-size:11.5px;color:var(--muted)}\n.qcz .mb .ng{color:var(--bad);font-size:11.5px;font-weight:700}\n.qcz .mb.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent) inset}\n.qcz .mb:disabled{opacity:.4;cursor:default}\n.qcz .rlist{margin-top:14px;display:flex;flex-direction:column;gap:8px}\n.qcz .ritem{display:flex;align-items:center;gap:10px;border:1px solid var(--line2);border-radius:10px;padding:8px 12px;flex-wrap:wrap}\n.qcz .ritem .t{flex:1 1 220px;min-width:0}\n.qcz .ritem .t b{display:block}\n.qcz .ritem .t small{color:var(--muted)}\n.qcz .ritem .ngt{color:var(--bad);font-size:13px;width:100%}\n.qcz .pdfv{position:fixed;inset:0;z-index:160;background:rgba(10,20,25,.6);display:flex;flex-direction:column}\n.qcz .pdfv .pvbar{display:flex;gap:8px;align-items:center;padding:10px 14px;background:#fff}\n.qcz .pdfv .pvbar b{margin-right:auto}\n.qcz .pdfv .pvbody{flex:1;overflow:auto;padding:12px;display:flex;justify-content:center}\n.qcz .pdfv .pvbody img{max-width:min(100%,900px);height:auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.3)}\n.qcz .dlg .dlgb{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap}\n.qcz .dlg .hint{font-size:12.5px;color:var(--muted);margin-top:6px}\n.qcz .who{display:inline-flex;align-items:center;gap:6px;font-size:13.5px}\n.qcz .who select{font:inherit;padding:5px 8px;border:1px solid var(--line2);border-radius:8px;background:#fff}\n.qcz .editbar{background:#FFF7E0;border:1px solid #E8C66A;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:14px;line-height:1.6}\n.qcz .editbar b{color:#8A5A00}\n.qcz .sigbox.lockd{cursor:not-allowed;opacity:.85}\n.qcz .lk{font-size:11.5px;font-weight:700;color:#8A5A00}\n.qcz .mb .lk{display:block}\n.qcz .ritem .ro{font-size:12.5px;color:var(--muted)}\n.qcz .ritem .ed{font-size:12.5px;color:#8A5A00;width:100%}\n.qcz .lockp{border:1px dashed #E8C66A;background:#FFFBEF;border-radius:10px;padding:10px 12px;margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:14px}\n.qcz .lockp input{font:inherit;padding:5px 6px;border:1px solid var(--line2);border-radius:6px}\n.qcz .ydl{display:inline-flex;gap:8px;flex-wrap:wrap;margin-left:10px;vertical-align:middle}\n.qcz .ydl .btn{padding:5px 12px;font-size:14px}\n.qcz .set h2{font-size:20px;margin:4px 0 12px}\n.qcz .set h3{font-size:16px;margin:18px 0 8px}\n.qcz .plist{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}\n.qcz .plist label{display:flex;gap:8px;align-items:center;border:1px solid var(--line2);border-radius:10px;padding:8px 10px;cursor:pointer}\n.qcz .plist label.dev{background:#F1F7F5;cursor:default}\n.qcz .set select{font:inherit;padding:6px 8px;border:1px solid var(--line2);border-radius:8px}\n.qcz .drvbox{border:1px solid var(--line2);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start}\n.qcz .drvbox .tree{margin:0;font-size:13px;line-height:1.6;background:#F7FAF9;border-radius:8px;padding:10px 12px;overflow-x:auto;max-width:100%}\n.qcz .paper.pidp h1{font-size:clamp(18px,2.4vw,28px)}\n.qcz .paper.pidp .h1b{margin-top:6px}\n.qcz .pgbrk{margin:22px 0 4px;text-align:center;color:var(--muted);font-size:13px;letter-spacing:.2em}\n.qcz .psec{margin:14px 0 18px}\n.qcz .pline{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-bottom:6px;font-size:16px}\n.qcz .pline .plb{font-weight:800;font-size:17px;white-space:nowrap}\n.qcz .pline input{font:inherit;border:0;border-bottom:1.5px solid var(--ink);background:#FAFCFB;padding:5px 6px;min-width:0;border-radius:4px 4px 0 0}\n.qcz .pline input:focus{outline:2px solid var(--accent);outline-offset:1px}\n.qcz .pline .pemp{width:8.5em;text-transform:uppercase;letter-spacing:.04em}\n.qcz .pline .pname{width:7em}\n.qcz .pline .psig{min-width:150px;min-height:44px;padding:2px 8px}\n.qcz .pline .psig img{height:34px;max-width:110px}\n.qcz .pline .psig .st{font-size:11.5px}\n.qcz .pdt{display:inline-block;min-width:8.5em;padding:6px 8px;border-bottom:1.5px solid var(--ink);background:#FAFCFB;cursor:pointer;font-variant-numeric:tabular-nums;border-radius:4px 4px 0 0}\n.qcz .pdt:empty::after{content:\"點一下\";color:#B8C2BF;font-size:13px}\n.qcz .pap button{padding:6px 12px}\n.qcz table.ptab{min-width:560px}\n.qcz table.ptab th{font-size:17px;font-weight:900;text-align:center;padding:6px;vertical-align:middle;border-bottom:2.5px solid var(--line)}\n.qcz table.ptab thead tr th{border-top:3px solid var(--line)}\n.qcz table.ptab th.pev{cursor:pointer;color:var(--accent);text-decoration:underline dotted;text-underline-offset:3px}\n.qcz table.ptab th.pev:hover{background:#F1F7F5}\n.qcz table.ptab th.pevh{border-bottom:1px solid var(--line)}\n.qcz table.ptab thead tr.pev2 th{border-top:1px solid var(--line);font-size:16px;padding:4px 2px}\n.qcz table.ptab td.pit{text-align:left;padding:6px 10px;font-weight:700;font-size:15.5px;line-height:1.5}\n.qcz table.ptab td.pc{font-size:16px;font-weight:700;white-space:nowrap}\n.qcz table.ptab td.pc.on{font-size:19px;font-weight:900}\n.qcz table.ptab tbody tr:last-child td{border-bottom:3px solid var(--line)}\n.qcz .pnbox{display:flex;gap:8px;align-items:flex-start;margin-top:6px;flex-wrap:wrap}\n.qcz .pnbox textarea{flex:1 1 260px;min-width:0;font:inherit;padding:6px 8px;border:1px solid var(--line2);border-radius:8px}\n.qcz .pnbox .btn{padding:5px 12px;font-size:14px}\n.qcz .draftbar{background:#EEF6FF;border:1px solid #9CC3EA;border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}\n.qcz .draftbar .btn{padding:5px 12px;font-size:14px}\n.qcz .ftag{display:inline-block;font-size:12px;font-weight:700;border-radius:999px;padding:1px 8px;margin-left:6px;background:#E8F0F7;color:#24527A;vertical-align:middle}\n.qcz .ftag.pid{background:#F3EAF8;color:#6B2C8A}\n.qcz .fchips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px}\n.qcz .fchips button{font:inherit;font-size:13.5px;border:1px solid var(--line2);background:#fff;border-radius:999px;padding:5px 12px;cursor:pointer}\n.qcz .fchips button.on{background:#1F2A2E;color:#fff;border-color:#1F2A2E}\n.qcz .pdfv .pvbody{flex-direction:column;align-items:center;gap:14px}\n@media (max-width:640px){.qcz table.ptab{min-width:0}\n.qcz table.ptab td.pit{font-size:14.5px;padding:5px 6px}\n.qcz table.ptab td.pc{white-space:normal;font-size:14px;padding:4px 2px;line-height:1.25}\n.qcz table.ptab td.pc.on{font-size:18px}\n.qcz table.ptab th{font-size:15px}}\n.qcz .flist{display:flex;flex-direction:column;gap:10px}\n.qcz .frow{border:1px solid var(--line2);border-radius:10px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end}\n.qcz .frow .fhd{display:flex;align-items:center;gap:8px;width:100%;flex-wrap:wrap}\n.qcz .frow .fhd .btn{padding:4px 10px;font-size:14px}\n.qcz .frow .fhd .fprev{margin-right:auto;font-size:15px}\n.qcz .frow .fsh{display:flex;align-items:center;gap:4px;font-size:14px}\n.qcz .frow .ff{display:flex;flex-direction:column;gap:3px;font-size:12.5px;color:var(--muted);min-width:0}\n.qcz .frow .ff input{font:inherit;font-size:15px;color:var(--ink);padding:6px 8px;border:1px solid var(--line2);border-radius:8px;min-width:0}\n.qcz .frow .ff .ficon{width:4.5em;text-align:center}\n.qcz .frow .ff.grow{flex:1 1 180px}\n.qcz .frow .ff.full{width:100%}\n.qcz .logo.hasimg .lgimg{height:48px;max-width:min(320px,70vw);object-fit:contain;display:block}\n.qcz .sprev{margin-right:auto;min-width:0}\n.qcz .sprev .hd{min-height:0}\n.qcz .sprev .logo span{font-size:16px}\n.qcz .sprev .logo i{width:34px;height:34px;font-size:17px}\n.qcz .lgrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;color:var(--ink);font-size:14px}\n.qcz .lgrow input[type=file]{font-size:13px;max-width:100%}\n.qcz .lgrow .btn{padding:4px 10px;font-size:14px}\n.qcz .toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#1F2A2E;color:#fff;padding:9px 16px;border-radius:10px;font-size:14px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:200}\n.qcz .toast.on{opacity:1}\n@media (max-width:640px){.qcz .paper{padding:14px 10px}\n.qcz .signrow{justify-content:flex-start}}\n.qcz.qcroot{font-size:15px;color:var(--ink);background:var(--bg);border-radius:12px;padding:10px 0 20px;margin:6px 0 30px;font-family:system-ui,-apple-system,\"Noto Sans TC\",\"PingFang TC\",\"Microsoft JhengHei\",sans-serif}\n.qcz .qtop{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:6px 16px 0}\n.qcz .wrap{max-width:none;margin:12px auto 0;padding:0 12px 10px}\n.qcz button:disabled{opacity:.55;cursor:default}\n.qcz.qcov{position:static}\n.qcz.qcov .toast{z-index:9600}\n.qcz .pop{z-index:9200}\n.qcz .kp{position:fixed;left:0;right:0;bottom:0;z-index:180;background:#D5DBE0;padding:6px max(6px,env(safe-area-inset-right,0px)) calc(6px + env(safe-area-inset-bottom,0px)) max(6px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:var(--kg,6px);box-shadow:0 -4px 16px rgba(0,0,0,.18);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-sizing:border-box}\n.qcz .kp .kph{display:flex;align-items:center;gap:6px;padding:0 4px;font-size:calc(var(--kf,20px) * .7);color:#1F2A2E;width:100%;max-width:var(--kw,1100px);margin:0 auto;min-width:0}\n.qcz .kp .kph span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}\n.qcz .kp .kph b{font-size:var(--kf,20px);letter-spacing:.06em;font-variant-numeric:tabular-nums;min-width:4ch;background:#fff;border-radius:6px;padding:1px 10px;flex:none}\n.qcz .kp .kbody{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,3.3fr);gap:calc(var(--kg,6px) + 4px);width:100%;max-width:var(--kw,1100px);margin:0 auto}\n.qcz .kp.w9 .kbody{grid-template-columns:minmax(0,9fr) minmax(0,3.6fr)}\n.qcz .kp .kl{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:var(--kh,46px);gap:var(--kg,6px);align-content:start}\n.qcz .kp.w9 .kl{grid-template-columns:repeat(9,minmax(0,1fr))}\n.qcz .kp .kn{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(4,minmax(var(--kh,46px),1fr));gap:var(--kg,6px);padding-left:calc(var(--kg,6px) + 4px);border-left:2px solid #B8C2CC}\n.qcz .kp.w9 .kl{grid-auto-rows:minmax(var(--kh,46px),1fr)}\n.qcz .kp.w9 .kn{grid-template-rows:repeat(4,var(--kh,46px))}\n.qcz .kp button{border:0;border-radius:8px;background:#fff;color:#111;font:inherit;font-size:var(--kf,20px);font-weight:600;box-shadow:0 1px 0 rgba(0,0,0,.28);cursor:pointer;padding:0;min-width:0;min-height:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .05s,background .05s}\n.qcz .kp .kl button,.qcz .kp .kn button{height:100%}\n.qcz .kp .kn button{font-size:calc(var(--kf,20px) * 1.15)}\n.qcz .kp button.dn,.qcz .kp button:active{background:#9FB0BF;transform:scale(.94)}\n.qcz .kp .kn button.fn{background:#AEB7C0;font-size:var(--kf,20px)}\n.qcz .kp .kr{display:flex;gap:var(--kg,6px);justify-content:center;width:100%;max-width:var(--kw,1100px);margin:0 auto}\n.qcz .kp .kr button{flex:1 1 0;height:var(--kh,46px)}\n.qcz .kp .kr button.fn{background:#AEB7C0;font-size:calc(var(--kf,20px) * .8)}\n.qcz .kp .kr button.go{background:var(--accent);color:#fff;font-size:calc(var(--kf,20px) * .85)}\n.qcz .kp .kr button.go.dn{background:#14684B}\n.qcz .kp.numonly .kbody{grid-template-columns:minmax(0,1fr);max-width:var(--kwn,460px)}\n.qcz .kp.numonly .kn{padding-left:0;border-left:0;grid-template-rows:repeat(4,var(--kh,46px))}\n.qcz .kp.numonly .kr,.qcz .kp.numonly .kph{max-width:var(--kwn,460px)}\n.qcz .kp{z-index:9300}\n.qcz .modal{z-index:9350}\n.qcz .sigfs{z-index:9400}\n.qcz .sigfs{touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}\n.qcz .sigfs .sgbtns .btn{touch-action:manipulation}\nhtml.qcsiglock,html.qcsiglock body{overscroll-behavior:none!important;overflow:hidden!important}\n.qcz .pdfv{z-index:9450}\n.qcz .pdfv .pvbar{flex-wrap:wrap}\n#qc-printpage{display:none}\n@media print{\n  body.qcprint>*:not(#qc-printpage){display:none!important}\n  body.qcprint::before{content:none!important;display:none!important}\n  body.qcprint #qc-printpage{display:block!important}\n  body.qcprint #qc-printpage img{display:block;width:210mm;height:297mm;object-fit:contain;page-break-after:always;break-after:page}\n  body.qcprint #qc-printpage img:last-child{page-break-after:auto;break-after:auto}\n}\n@media (pointer:coarse){.qcz input,.qcz select,.qcz textarea{font-size:16px!important}}\n.qcz .kp.vvfit{left:0;right:auto;bottom:auto;top:0;transform-origin:0 0}";
QC_CSS += ".qcz table.mstab{table-layout:auto;min-width:0}.qcz .mstab td{overflow-wrap:anywhere;height:auto}.qcz .pdfv .pvbody{justify-content:flex-start}.qcz .pdfv .pvbody img{flex-shrink:0}.qcz .mstab td.nw{white-space:nowrap;overflow-wrap:normal}.qcz .mstab .msday{font:inherit;font-weight:800;color:var(--accent);background:none;border:0;padding:0;margin:0;cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;white-space:nowrap}.qcz .mstab .msday:hover{text-decoration-style:solid}.qcz .mstab .msday:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:3px}.qcz .msum h4 .mshint{font-weight:400;color:var(--muted);font-size:13px;margin-left:6px}.qcz .dayv{position:fixed;inset:0;z-index:9450;background:rgba(15,25,22,.6);display:flex;align-items:center;justify-content:center;padding:16px}.qcz .daybox{background:#fff;border-radius:14px;width:min(980px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.3)}.qcz .dayhd{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line2);background:#F1F7F5}.qcz .dayhd b{margin-right:auto;font-size:17px}.qcz .dayhd .btn{padding:7px 14px;font-size:14px;white-space:nowrap;flex-shrink:0}.qcz .daybd{overflow:auto;padding:4px 16px 18px;-webkit-overflow-scrolling:touch}.qcz .daybd h4{margin:16px 0 6px;color:var(--accent);font-size:15px}.qcz .daybd .note{margin:6px 0}.qcz .daybd .mswrap{overflow-x:auto}.qcz .dayrec{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:7px 0;border-bottom:1px dashed var(--line2);font-size:14px}.qcz .dayrec:last-child{border-bottom:0}.qcz .dayrec span{margin-right:auto}.qcz .dayrec .btn{padding:5px 12px;font-size:13px}@media (max-width:640px){.qcz .mstab th{white-space:normal}.qcz table.mstab.mscard,.qcz .mstab.mscard tbody{display:block;border:0}.qcz .mstab.mscard thead{display:none}.qcz .mstab.mscard tr{display:block;border:1px solid var(--line2);border-radius:10px;margin:0 0 10px;padding:4px 12px;background:#fff}.qcz .mstab.mscard td{display:flex;gap:10px;align-items:flex-start;border:0;border-bottom:1px dashed #E3E9E7;padding:7px 0;line-height:1.45;min-width:0!important;text-align:left!important}.qcz .mstab.mscard td:last-child{border-bottom:0}.qcz .mstab.mscard td::before{content:attr(data-l);flex:0 0 7em;color:var(--muted);font-weight:700;font-size:13px;line-height:1.6}.qcz .dayhd{padding:10px 12px}.qcz .dayhd b{font-size:15px}.qcz .mstab.mscard td.emp{display:none}.qcz .dayv{padding:0;align-items:stretch}.qcz .daybox{border-radius:0;max-height:none;height:100%;width:100%}.qcz .daybd{padding:2px 12px 24px}}";
function render() {
  kpClose();
  if (S.form === "pid") return renderPid();
  $("#qc-paper").classList.remove("pidp"); $("#qc-draft").hidden = true;
  var C = SITES[S.site], P = $("#qc-paper"); P.innerHTML = "";
  if (S.edit) P.appendChild(el("div", { class: "editbar" }, [el("b", { text: "✏️ 正在修改：" }), fmtAt(S.edit.at) + "　" + C.name + "（查檢者 " + S.edit.sig.who + "）。改好按「💾 存修改」＝PDF 重做、記下修改的人和時間；舊的那一份留著（開發者看得到）。查檢者的簽名不變。"]));
  $("#qc-send").textContent = S.edit ? "💾 存修改（PDF 重做）" : "✅ 送出（變成 PDF 保留）";
  $("#qc-clear").textContent = S.edit ? "取消修改" : "全部清掉";
  Array.prototype.forEach.call(document.querySelectorAll("#qc-site button"), function (x) { x.disabled = !!S.edit; });
  P.appendChild(logoEl(C));
  P.appendChild(el("h1", { text: TITLE }));
  var sig = el("div", { class: "sigbox" + (S.sig ? " done" : ""), role: "button", tabindex: "0", title: "點一下：電子簽名（簽完自動寫上今天的年月日、時間）" });
  if (S.sig) { sig.appendChild(S.sig.img ? el("img", { src: S.sig.img, alt: "簽名", draggable: "false" }) : el("span", { class: "ph", text: "✍️ 簽名在原本的 PDF 上" })); sig.appendChild(el("div", { class: "st" }, [el("div", { text: S.sig.who }), el("div", { text: S.sig.at })])); }
  else sig.appendChild(el("span", { class: "ph", text: "✍️ 點這裡電子簽名" }));
  var sgo = function () { if (S.edit) { toast("修改的時候，查檢者的簽名不變（修改的人會記在修改紀錄）"); return; } if (!ceReady()) { toast("先打查檢者的員工編號和姓名"); ceFocus(); return; } signOpen(); };
  if (S.edit) sig.classList.add("lockd");
  var g0 = null, swiped = false;
  if (S.sig && !S.edit) {
    sig.title = "點一下：重新簽名；上下滑：刪掉簽名";
    sig.querySelector(".st").appendChild(el("div", { class: "gs", text: "↕ 上下滑＝刪掉重簽" }));
    sig.onpointerdown = function (e) { g0 = { x: e.clientX, y: e.clientY }; swiped = false; try { sig.setPointerCapture(e.pointerId); } catch (x) {} };
    sig.onpointermove = function (e) {
      if (!g0 || swiped) return;
      var dx = Math.abs(e.clientX - g0.x), dy = Math.abs(e.clientY - g0.y);
      if (dy >= Math.max(36, sig.offsetHeight * 0.7) && dx <= dy * 0.6) { swiped = true; g0 = null; sigDel(); }
    };
    sig.onpointerup = sig.onpointercancel = function () { g0 = null; };
  }
  sig.onclick = function () { if (swiped) { swiped = false; return; } sgo(); }; sig.onkeydown = function (e) { if (e.key === "Enter") sgo(); };
  P.appendChild(el("div", { class: "signrow" }, [el("span", { class: "lb", text: "查檢者：" })].concat(ceFields(), [sig])));
  if (!TOUCH) P.appendChild(kbdHint());
  var tb = el("table", { "aria-label": TITLE });
  var cg = el("colgroup"); [10.5, 9, 7, 7, 7, 17, 7, 7, 28.5].forEach(function (w) { cg.appendChild(el("col", { style: "width:" + w + "%" })); }); tb.appendChild(cg);
  var th = el("thead"), tr0 = el("tr");
  tr0.appendChild(el("th", { colspan: "3", class: "diag", text: "查檢項目" }));
  tr0.appendChild(el("th", { colspan: "3", text: ITEMS[0] }));
  tr0.appendChild(el("th", { colspan: "3", text: ITEMS[1] }));
  th.appendChild(tr0); tb.appendChild(th);
  var idx = 0;
  for (var s = 0; s < C.secs; s++) {
    var body = el("tbody", { class: "sec" });
    var hr = el("tr", { class: "sub" + (s ? " thick" : "") });
    ["日期", "領藥號", "筆數", "符合", "不符", "不符事項", "符合", "不符", "不符事項"].forEach(function (t, c) {
      var th = el("th", { scope: "col", text: t });
      if (c === 3 || c === 6) {
        var k = c === 3 ? "a" : "b";
        th.className = "colh"; th.tabIndex = 0; th.title = "點一下：整欄打勾（第 " + (k === "a" ? 1 : 2) + " 項，整張表）";
        th.onclick = (function (kk, el0) { return function (e) { colPop(el0, kk); e.stopPropagation(); }; })(k, th);
        th.onkeydown = (function (kk, el0) { return function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); colPop(el0, kk); } }; })(k, th);
      }
      hr.appendChild(th);
    });
    body.appendChild(hr);
    for (var r = 0; r < C.rows; r++) body.appendChild(rowEl(idx++));
    tb.appendChild(body);
  }
  P.appendChild(el("div", { class: "tscroll" }, [tb]));
}
var TOUCH = !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
function codeChar(e) { var c = e.code || ""; if (/^Key[A-Z]$/.test(c)) return c.slice(3); if (/^(Digit|Numpad)[0-9]$/.test(c)) return c.slice(-1); if (c === "Minus" || c === "NumpadSubtract") return "-"; return ""; }
function dateChar(e) { var c = e.code || ""; if (/^(Digit|Numpad)[0-9]$/.test(c)) return c.slice(-1); if (/^(Slash|NumpadDivide|Period|NumpadDecimal|Minus|NumpadSubtract)$/.test(c)) return "/"; return ""; }
function noEnglish(inp, d) { return forceKeys(inp, codeChar, 16, d.no || "", function (v) { d.no = v; }); }
function forceKeys(inp, mapFn, max, init, onSet) {
  var want = init, comp = false;
  var put = function (v, at) { inp.value = v; want = v; onSet(v); try { inp.setSelectionRange(at, at); } catch (e) {} };
  inp.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var ch = mapFn(e); if (!ch) return;
    e.preventDefault();
    var v = comp ? want : inp.value, a = comp ? v.length : inp.selectionStart, b = comp ? v.length : inp.selectionEnd;
    if (v.length - (b - a) >= max) return;
    put(v.slice(0, a) + ch + v.slice(b), a + 1);
  });
  inp.addEventListener("compositionstart", function () { comp = true; setTimeout(function () { inp.blur(); inp.focus(); comp = false; put(want, want.length); }, 0); });
  inp.addEventListener("compositionend", function () { comp = false; setTimeout(function () { put(want, want.length); }, 0); });
  return { comp: function () { return comp; }, sync: function (v) { want = v; } };
}
var KP = null;
function kpClose() { if (KP) { KP.box.remove(); document.body.style.paddingBottom = ""; kpVV(false); KP = null; } }
function kpSize() {
  if (!KP) return;
  var vv = window.visualViewport, b = KP.box, sc = vv ? vv.scale || 1 : 1;
  var SW = vv ? vv.width * sc : window.innerWidth, SH = vv ? vv.height * sc : window.innerHeight;
  var land = SW > SH, w9 = land || SW >= 900, kh, kg = SW < 400 ? 4 : SW < 700 ? 6 : 8;
  if (w9) kh = Math.round(Math.max(36, Math.min(SW >= 900 && !land ? 60 : 56, (SH * (SH < 500 ? 0.6 : 0.42) - 60) / 5)));
  else kh = Math.round(Math.max(40, Math.min(SW >= 600 ? 64 : 54, SH * 0.058, (SW - 30) / 9.3 * 1.15)));
  var kf = Math.round(Math.max(17, Math.min(28, kh * 0.46)));
  b.classList.toggle("w9", w9 && !b.classList.contains("numonly"));
  b.style.setProperty("--kh", kh + "px"); b.style.setProperty("--kf", kf + "px"); b.style.setProperty("--kg", kg + "px");
  b.style.setProperty("--kw", (SW >= 1200 ? 1100 : SW) + "px"); b.style.setProperty("--kwn", Math.min(SW, SW >= 600 ? 520 : SW) + "px");
}
function kpFit() {
  if (!KP) return;
  var vv = window.visualViewport, b = KP.box;
  kpSize();
  if (!vv || (Math.abs(vv.scale - 1) < 0.02 && vv.offsetLeft < 1 && vv.offsetTop < 1 && Math.abs(vv.width - document.documentElement.clientWidth) < 2)) { b.classList.remove("vvfit"); b.style.width = b.style.transform = ""; document.body.style.paddingBottom = b.offsetHeight + "px"; return; }
  var sc = vv.scale || 1;
  b.classList.add("vvfit");
  b.style.width = (vv.width * sc) + "px";
  var hh = b.offsetHeight;
  b.style.transform = "translate(" + vv.offsetLeft + "px," + (vv.offsetTop + vv.height - hh / sc) + "px) scale(" + (1 / sc) + ")";
}
function kpVV(on) {
  var vv = window.visualViewport; if (!vv) { if (on) kpSize(); return; }
  if (on) { vv.addEventListener("resize", kpFit); vv.addEventListener("scroll", kpFit); window.addEventListener("orientationchange", kpFit); kpFit(); }
  else { vv.removeEventListener("resize", kpFit); vv.removeEventListener("scroll", kpFit); window.removeEventListener("orientationchange", kpFit); }
}
function kpOpen(inp, d, i, o) {
  if (KP && KP.inp === inp) return;
  kpClose();
  o = o || { title: "⌨ 英數鍵盤・第 " + (i + 1) + " 列 領藥號：", letters: true, sym: "-", max: 16 };
  var val = el("b", { class: "kpv", text: inp.value });
  var box = el("div", { class: "kp" + (o.letters ? "" : " numonly"), role: "group", "aria-label": o.letters ? "英數小鍵盤" : "數字小鍵盤" });
  var set = function (v) { inp.value = v; inp.dispatchEvent(new Event("input")); val.textContent = inp.value; };
  var btn = function (t, cls, fn, lab, rpt, late) {
    var b = el("button", { type: "button", class: cls || "", text: t, "aria-label": lab || t }), took = 0, tm = null;
    var up = function () { b.classList.remove("dn"); clearTimeout(tm); clearInterval(tm); tm = null; };
    b.onpointerdown = function (e) {
      e.preventDefault();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      b.classList.add("dn");
      if (late) return;
      took = Date.now(); fn();
      if (rpt) tm = setTimeout(function () { tm = setInterval(function () { if (!KP) { up(); return; } fn(); }, 90); }, 450);
    };
    b.onpointerup = b.onpointercancel = b.onpointerleave = up;
    b.onmousedown = function (e) { e.preventDefault(); };
    b.oncontextmenu = function (e) { e.preventDefault(); };
    b.onclick = function (e) { e.stopPropagation(); if (Date.now() - took < 800) return; fn(); };
    return b;
  };
  box.appendChild(el("div", { class: "kph" }, [el("span", { text: o.title }), val]));
  var add = function (ch) { return btn(ch, "k", function () { if (inp.value.length < o.max) set(inp.value + ch); }); };
  var L = o.letters ? el("div", { class: "kl", "aria-label": "字母" }, Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map(add)) : null;
  var N = el("div", { class: "kn", "aria-label": "數字" }, Array.from("123456789").map(add).concat([add(o.sym), add("0"), btn("⌫", "fn kdel", function () { set(inp.value.slice(0, -1)); }, "刪掉一個字", true)]));
  box.appendChild(el("div", { class: "kbody" }, [L, N]));
  if (!o.letters) {
    box.appendChild(el("div", { class: "kr" }, [btn("清掉", "fn kclr", function () { set(""); }), btn("好了", "go kok", function () { kpClose(); if (o.done) o.done(); }, "好了", false, true)]));
    box.onclick = function (e) { e.stopPropagation(); };
    ovl().appendChild(box); KP = { box: box, inp: inp }; kpVV(true);
    document.body.style.paddingBottom = box.offsetHeight + "px";
    var r0 = inp.getBoundingClientRect(), t0 = window.innerHeight - box.offsetHeight;
    if (r0.bottom > t0 - 8) window.scrollBy(0, r0.bottom - t0 + 24);
    return;
  }
  var nx = o.next || (inp.parentNode.nextSibling && inp.parentNode.nextSibling.querySelector("input"));
  box.appendChild(el("div", { class: "kr" }, [btn("清掉", "fn kclr", function () { set(""); }), btn("完成", "fn kok", function () { kpClose(); inp.blur(); }, "完成", false, true), btn("下一格 →", "go knext", function () { kpClose(); if (nx) nx.focus(); }, o.nextLabel || "下一格（筆數）", false, true)]));
  box.onclick = function (e) { e.stopPropagation(); };
  ovl().appendChild(box);
  KP = { box: box, inp: inp }; kpVV(true);
  document.body.style.paddingBottom = box.offsetHeight + "px";
  var r = inp.getBoundingClientRect(), top = window.innerHeight - box.offsetHeight;
  if (r.bottom > top - 8) window.scrollBy(0, r.bottom - top + 24);
}
function rowEl(i) {
  var d = R(i), tr = el("tr", { "data-i": String(i) });
  var dt = el("td", { class: "dt", title: "點一下：自己填入／選日期／同上" }, [el("span", { text: d.d })]);
  dt.onclick = function (e) { datePop(dt, i); e.stopPropagation(); };
  tr.appendChild(dt);
  [["no", "領藥號"], ["n", "筆數"]].forEach(function (f) {
    var isNo = f[0] === "no";
    var inp = el("input", { value: d[f[0]], "aria-label": "第 " + (i + 1) + " 列 " + f[1], inputmode: isNo ? (TOUCH ? "none" : "text") : "numeric", autocapitalize: isNo ? "characters" : null, autocorrect: isNo ? "off" : null, lang: isNo ? "en" : null, autocomplete: "off", spellcheck: "false", maxlength: isNo ? "16" : "4", placeholder: isNo ? "" : "" });
    var en = isNo ? noEnglish(inp, d) : null;
    if (isNo && TOUCH) { inp.addEventListener("focus", function () { kpOpen(inp, d, i); }); inp.addEventListener("click", function () { if (!KP) kpOpen(inp, d, i); }); inp.addEventListener("blur", function () { setTimeout(function () { if (KP && KP.inp === inp && document.activeElement !== inp) kpClose(); }, 0); }); }
    inp.oninput = function () {
      if (en && en.comp()) return;
      var v = inp.value.replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
      v = isNo ? v.toUpperCase().replace(/[^A-Z0-9\-]/g, "") : v.replace(/[^0-9]/g, "");
      if (v !== inp.value) { var at = inp.selectionStart; inp.value = v; try { inp.setSelectionRange(at, at); } catch (e) {} }
      d[f[0]] = v; if (en) en.sync(v);
    };
    tr.appendChild(el("td", {}, [inp]));
  });
  ["a", "b"].forEach(function (k) {
    ["ok", "ng"].forEach(function (v) {
      var c = el("td", { class: "c" + (d[k] === v ? " on" + (v === "ng" ? " badc" : "") : ""), "data-k": k, "data-v": v, role: "checkbox", "aria-checked": String(d[k] === v), tabindex: "0", "aria-label": "第 " + (i + 1) + " 列 第 " + (k === "a" ? 1 : 2) + " 項 " + (v === "ok" ? "符合" : "不符"), text: d[k] === v ? "✔" : "" });
      c.onclick = function (e) { e.stopPropagation(); popClose(); setChk(i, k, d[k] === v ? "" : v); if (d[k] !== "ng") bagFocus(i, k, v); };
      c.onkeydown = function (e) { bagKey(e, i, k, v); };
      tr.appendChild(c);
    });
    var m = el("input", { value: d[k + "m"], "aria-label": "第 " + (i + 1) + " 列 第 " + (k === "a" ? 1 : 2) + " 項 不符事項", placeholder: d[k] === "ng" ? "請寫不符事項" : "" });
    m.oninput = function () { d[k + "m"] = m.value; m.parentNode.classList.toggle("need", d[k] === "ng" && !m.value.trim()); };
    tr.appendChild(el("td", { class: "memo" + (d[k] === "ng" && !d[k + "m"].trim() ? " need" : "") }, [m]));
  });
  return tr;
}
var BAGC = [["a", "ok"], ["a", "ng"], ["b", "ok"], ["b", "ng"]];
function pasteBox(label, got) {
  var b = el("div", { class: "pastebox", contenteditable: "true", role: "textbox", "aria-label": label, "data-ph": label });
  b.addEventListener("paste", function (e) {
    e.preventDefault();
    var fs = [].slice.call((e.clipboardData && e.clipboardData.items) || []).filter(function (x) { return x.kind === "file" && /^image\//.test(x.type); }).map(function (x) { return x.getAsFile(); });
    if (!fs.length) { toast("剪貼簿裡沒有圖片（先在別的地方「複製圖片」再貼）"); return; }
    fs.forEach(function (f) { got(f); });
    b.blur();
  });
  b.addEventListener("beforeinput", function (e) { if (e.inputType !== "insertFromPaste") e.preventDefault(); });
  b.addEventListener("drop", function (e) { e.preventDefault(); var f = [].slice.call((e.dataTransfer && e.dataTransfer.files) || []).filter(function (x) { return /^image\//.test(x.type); }); f.forEach(function (x) { got(x); }); });
  return b;
}
function kbdHint() { return el("div", { class: "kbdh note", text: "⌨ 點一格＝打勾（再點＝拿掉）；選到格子按 Y＝符合、N＝不符（自動往下一列）、↑↓←→ 移動、Delete＝清掉；點欄標題「符合」＝整欄打勾。簽名可以不簽。" }); }
function bagFocus(i, k, v) { var x = document.querySelector("tr[data-i='" + i + "'] td.c[data-k='" + k + "'][data-v='" + v + "']"); if (x) { x.focus(); try { x.scrollIntoView({ block: "nearest" }); } catch (e) {  } } return !!x; }
function keyOf(e) { if (e.ctrlKey || e.metaKey || e.altKey) return ""; var c = e.code || ""; if (c === "KeyY") return "y"; if (c === "KeyN") return "n"; return String(e.key || "").toLowerCase(); }
function bagKey(e, i, k, v) {
  var d = R(i), q = keyOf(e), n = SITES[S.site].secs * SITES[S.site].rows, ci = 0;
  BAGC.forEach(function (x, z) { if (x[0] === k && x[1] === v) ci = z; });
  if (q === " " || q === "enter") { e.preventDefault(); setChk(i, k, d[k] === v ? "" : v); if (d[k] !== "ng") bagFocus(i, k, v); }
  else if (q === "y") { e.preventDefault(); setChk(i, k, "ok"); if (!bagFocus(i + 1, k, "ok")) bagFocus(i, k, "ok"); }
  else if (q === "n") { e.preventDefault(); setChk(i, k, "ng"); }
  else if (q === "delete" || q === "backspace") { e.preventDefault(); d[k] = ""; d[k + "m"] = ""; redrawRow(i); bagFocus(i, k, v); }
  else if (q === "arrowdown" && i + 1 < n) { e.preventDefault(); bagFocus(i + 1, k, v); }
  else if (q === "arrowup" && i > 0) { e.preventDefault(); bagFocus(i - 1, k, v); }
  else if (q === "arrowright" && ci < 3) { e.preventDefault(); bagFocus(i, BAGC[ci + 1][0], BAGC[ci + 1][1]); }
  else if (q === "arrowleft" && ci > 0) { e.preventDefault(); bagFocus(i, BAGC[ci - 1][0], BAGC[ci - 1][1]); }
}
function redrawRow(i) { var old = document.querySelector("tr[data-i='" + i + "']"); if (old) old.parentNode.replaceChild(rowEl(i), old); }
function setChk(i, k, v) { R(i)[k] = v; redrawRow(i); if (v === "ng") { var m = document.querySelector("tr[data-i='" + i + "'] td.memo:nth-of-type(" + (k === "a" ? 6 : 9) + ") input"); if (m) m.focus(); } }

var POP = null;
function popClose() { if (POP) { if (KP && POP.contains(KP.inp)) kpClose(); POP.remove(); POP = null; } }
function popAt(anchor, kids) {
  popClose();
  var p = el("div", { class: "pop", role: "dialog" }, kids);
  ovl().appendChild(p);
  var r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
  var x = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - w - 8), y = window.scrollY + r.bottom + 4;
  if (r.bottom + h + 8 > window.innerHeight) y = window.scrollY + r.top - h - 4;
  p.style.left = Math.max(8, x) + "px"; p.style.top = Math.max(window.scrollY + 8, y) + "px";
  p.onclick = function (e) { e.stopPropagation(); };
  POP = p; return p;
}
document.addEventListener("click", popClose);
document.addEventListener("keydown", function (e) { if (e.key === "Escape") popClose(); });
function datePop(td, i) {
  dateTool(td, { label: "第 " + (i + 1) + " 列的日期", get: function () { return R(i).d; }, set: function (v) { R(i).d = v; }, prev: function () { return i > 0 ? R(i - 1).d : ""; }, redraw: function () { redrawRow(i); } });
}
function parse(s) { var m = /^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/.exec(s || ""); if (!m) return null; var y = +m[1]; if (y < 1000) y += 1911; return { y: y, m: +m[2], dd: +m[3] }; }
function normDate(s) {
  s = String(s || "").trim().replace(/[.\-年月]/g, "/").replace(/日$/, "").replace(/\s+/g, "");
  if (!s) return "";
  var m = /^(\d{1,2})\/(\d{1,2})$/.exec(s); if (m) return new Date().getFullYear() + "/" + pad2(+m[1]) + "/" + pad2(+m[2]);
  m = /^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/.exec(s); if (m) { var y = +m[1]; if (y < 1000) y += 1911; return y + "/" + pad2(+m[2]) + "/" + pad2(+m[3]); }
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(s); if (m) return m[1] + "/" + m[2] + "/" + m[3];
  return s;
}
function colPop(th, k) {
  var C = SITES[S.site], n = C.secs * C.rows, ng = 0, okN = 0;
  for (var i = 0; i < n; i++) { if (R(i)[k] === "ng") ng++; else if (R(i)[k] === "ok") okN++; }
  var no = k === "a" ? "1" : "2";
  var all = el("button", { type: "button", class: "pri colall", text: "✔ 整欄打勾（第 " + no + " 項，整張表 " + n + " 列）" });
  var off = el("button", { type: "button", class: "coloff", text: "✕ 拿掉整欄的勾（不符不動）" });
  popAt(th, [el("div", { class: "t", text: "第 " + no + " 項・符合" + (ng ? "（不符的 " + ng + " 列不會動）" : "") }), all, okN ? off : null]);
  all.onclick = function () { popClose(); for (var i = 0; i < n; i++) if (R(i)[k] !== "ng") R(i)[k] = "ok"; render(); toast("第 " + no + " 項：整欄打勾" + (ng ? "（不符的 " + ng + " 列沒動）" : "")); };
  off.onclick = function () { popClose(); for (var i = 0; i < n; i++) if (R(i)[k] === "ok") R(i)[k] = ""; render(); toast("第 " + no + " 項：拿掉整欄的勾"); };
}
function rowUsed(d) { return !!(d.d || d.no || d.n || d.a === "ng" || d.b === "ng" || (d.am || "").trim() || (d.bm || "").trim()); }
function chkPop(td, i, k, v) {
  var d = R(i), on = d[k] === v, name = v === "ok" ? "符合" : "不符";
  var one = el("button", { type: "button", class: "pri", text: on ? "✕ 取消勾「" + name + "」" : "✔ 勾「" + name + "」" });
  var all = el("button", { type: "button", text: "✔✔ 全勾（這一列兩項都符合）" });
  var clr = el("button", { type: "button", class: "clr1", text: "清掉" });
  popAt(td, [el("div", { class: "t", text: "第 " + (i + 1) + " 列・第 " + (k === "a" ? "1" : "2") + " 項" }), one, all, clr]);
  one.onclick = function () { popClose(); setChk(i, k, on ? "" : v); };
  all.onclick = function () { popClose(); d.a = "ok"; d.b = "ok"; redrawRow(i); };
  clr.onclick = function () { popClose(); d[k] = ""; d[k + "m"] = ""; redrawRow(i); };
}

function sigDel() {
  if (!S.sig) return;
  S.sig.img = null; S.sig = null; render(); toast("🗑 簽名刪掉了，請重新簽");
}
function signOpen(thenSend, o) {

  var bx = el("div", { class: "sigfs", role: "dialog", "aria-modal": "true", "aria-label": "電子簽名" });
  var cv = el("canvas", { class: "pad", "aria-label": "在這裡簽名" });
  var ok = el("button", { type: "button", class: "btn pri sgok", text: thenSend ? "✅ 確定送出" : "✅ 確定" }), clr = el("button", { type: "button", class: "btn", text: "重簽" }), no = el("button", { type: "button", class: "btn", text: "取消" });
  var FIX = true; try { FIX = localStorage.getItem("qc_sigfix") !== "0"; } catch (e) {  }
  var fixB = el("button", { type: "button", class: "btn fix", "aria-pressed": "true" });
  var rh = el("div", { class: "rothint", text: "📱 請把手機轉橫的簽（畫面已經轉好了）；按「確定」後自動轉正" });
  var wh = el("div", { class: "wipehint" });
  var stage = el("div", { class: "sgstage" }, [cv, el("div", { class: "base" }, [el("span", { text: "請在這條線上簽名" })]), wh, rh]);
  var fixPaint = function () {
    fixB.textContent = FIX ? "📌 固定中" : "📌 固定"; fixB.classList.toggle("on", FIX); fixB.setAttribute("aria-pressed", String(FIX));
    fixB.title = FIX ? "固定中：怎麼滑都不會刪掉簽名（要重簽按「重簽」）。按一下關掉固定" : "按一下固定：簽的時候怎麼滑都不會刪掉簽名";
    wh.textContent = FIX ? "📌 固定中：滑動不會刪掉簽名，要重簽按「重簽」" : "↕ 往上滑到頂／往下滑到底＝刪掉重簽";
  };
  fixPaint();
  fixB.onclick = function () { FIX = !FIX; try { localStorage.setItem("qc_sigfix", FIX ? "1" : "0"); } catch (e) {  } fixPaint(); toast(FIX ? "📌 固定：簽的時候不會因為滑動刪掉簽名" : "已經不固定：往上／往下滑到底＝刪掉重簽"); };
  var sgin = el("div", { class: "sgin" });
  var ttl = o ? o.title : thenSend ? "✍️ 電子簽名（查檢者）：簽好按「確定送出」＝完成這張表" : "✍️ 電子簽名（查檢者）";
  sgin.appendChild(stage);
  sgin.appendChild(el("div", { class: "sgbar" }, [el("div", { class: "sgt" }, [el("b", { text: ttl }), el("span", { class: "who", text: "簽好會自動寫上：" + (o ? o.who : me()) + "、今天的年月日和時間；簽名只畫進 PDF，送出後馬上刪掉（不留簽名檔）" })]), el("div", { class: "sgbtns" }, [fixB, clr, no, ok])]));
  bx.appendChild(sgin);
  ovl().appendChild(bx);
  var coarse = window.matchMedia && matchMedia("(pointer:coarse)").matches, ROT = false;
  if (coarse) {
    try { var fq = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (fq && fq.then) fq.then(function () { try { var lq = screen.orientation.lock("landscape"); if (lq && lq.catch) lq.catch(function () {}); } catch (e) {} }).catch(function () {}); } catch (e) {}
  }
  document.documentElement.style.overflow = "hidden";
  var lockY = window.scrollY || window.pageYOffset || 0, bs = document.body.style, old = { p: bs.position, t: bs.top, w: bs.width, l: bs.left, r: bs.right };
  document.documentElement.classList.add("qcsiglock");
  bs.position = "fixed"; bs.top = (-lockY) + "px"; bs.left = "0"; bs.right = "0"; bs.width = "100%";
  var noMove = function (e) { if (e.target && e.target.closest && e.target.closest(".sgbtns")) return; if (e.cancelable) e.preventDefault(); };
  var noZoom = function (e) { if (e.cancelable) e.preventDefault(); };
  bx.addEventListener("touchstart", noMove, { passive: false });
  bx.addEventListener("touchmove", noMove, { passive: false });
  document.addEventListener("touchmove", noMove, { passive: false });
  document.addEventListener("gesturestart", noZoom, { passive: false });
  document.addEventListener("gesturechange", noZoom, { passive: false });
  bx.addEventListener("dblclick", noZoom);
  var ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1, strokes = [], cur = null;
  var paint = function () {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0B2E4F";
    cv.setAttribute("data-n", String(strokes.length));
    strokes.forEach(function (st) { ctx.lineWidth = st.w; ctx.beginPath(); st.p.forEach(function (q, k) { if (k) ctx.lineTo(q.x * cv.clientWidth, q.y * cv.clientHeight); else ctx.moveTo(q.x * cv.clientWidth, q.y * cv.clientHeight); }); if (st.p.length === 1) ctx.lineTo(st.p[0].x * cv.clientWidth + .1, st.p[0].y * cv.clientHeight); ctx.stroke(); });
  };
  var size = function () {
    var W = window.innerWidth, H = window.innerHeight;
    ROT = coarse && H > W;
    bx.classList.toggle("rot", ROT);
    sgin.style.width = ROT ? H + "px" : ""; sgin.style.height = ROT ? W + "px" : ""; sgin.style.transform = ROT ? "translate(" + W + "px,0) rotate(90deg)" : "";
    if (ROT && !rh.dataset.shown) { rh.dataset.shown = "1"; rh.classList.add("on"); setTimeout(function () { rh.classList.remove("on"); }, 3200); }
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr); paint();
  };
  size(); window.addEventListener("resize", size);
  var pos = function (e) {
    if (!ROT) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }
    var lx = e.clientY, ly = window.innerWidth - e.clientX;
    return { x: lx / cv.clientWidth, y: ly / cv.clientHeight };
  };
  cv.onpointerdown = function (e) { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = { w: Math.max(2.5, Math.min(5, cv.clientWidth / 260)), p: [pos(e)] }; strokes.push(cur); paint(); };
  cv.onpointermove = function (e) {
    if (!cur) return;
    var q = pos(e); cur.p.push(q);
    if (wipeHit(cur, q)) { strokes.pop(); cur = null; wipe(); return; }
    paint();
  };
  var wipeHit = function (st, q) {
    if (FIX) return false;
    var p = st.p, a = p[0], W = cv.clientWidth, H = cv.clientHeight, e = Math.max(0.03, 16 / H), x0 = 1e9, x1 = -1e9;
    if (p.length < 2) return false;
    p.forEach(function (r) { x0 = Math.min(x0, r.x * W); x1 = Math.max(x1, r.x * W); });
    var up = q.y <= e && a.y - q.y >= 0.3, down = q.y >= 1 - e && q.y - a.y >= 0.3;
    return (up || down) && (x1 - x0) <= Math.abs(q.y - a.y) * H * 0.5;
  };
  var wipe = function () {
    if (!strokes.length) { toast("還沒有簽名可以刪"); return; }
    strokes = []; paint(); toast("🗑 簽名刪掉了，請重新簽");
  };
  cv.onpointerup = cv.onpointercancel = function (e) {
    var st = cur; cur = null; if (!st) return;
    var q = e.clientX || e.clientY ? pos(e) : st.p[st.p.length - 1];
    if (wipeHit(st, q)) { strokes.pop(); wipe(); }
  };
  var close = function () {
    window.removeEventListener("resize", size); document.documentElement.style.overflow = ""; bx.remove();
    document.removeEventListener("touchmove", noMove, { passive: false }); document.removeEventListener("gesturestart", noZoom, { passive: false }); document.removeEventListener("gesturechange", noZoom, { passive: false });
    document.documentElement.classList.remove("qcsiglock");
    bs.position = old.p; bs.top = old.t; bs.left = old.l; bs.right = old.r; bs.width = old.w;
    window.scrollTo(0, lockY);
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    try { if (document.fullscreenElement && document.exitFullscreen) { var q = document.exitFullscreen(); if (q && q.catch) q.catch(function () {}); } } catch (e) {}
  };
  clr.onclick = function () { wipe(); };
  no.onclick = close;
  ok.onclick = function () {
    if (!strokes.length) { toast("請先簽名"); return; }
    var W = cv.clientWidth, H = cv.clientHeight, x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    strokes.forEach(function (st) { st.p.forEach(function (q) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }); });
    var m = 12, sx = Math.max(0, x0 * W - m), sy = Math.max(0, y0 * H - m), sw = Math.min(W, x1 * W + m) - sx, sh = Math.min(H, y1 * H + m) - sy;
    var out = document.createElement("canvas"), sc = Math.min(1, 600 / sw, 220 / sh) * 2;
    out.width = Math.max(1, Math.round(sw * sc)); out.height = Math.max(1, Math.round(sh * sc));
    out.getContext("2d").drawImage(cv, sx * dpr, sy * dpr, sw * dpr, sh * dpr, 0, 0, out.width, out.height);
    var d = new Date();
    if (o) { var g = { img: out.toDataURL("image/png"), who: o.who, at: today() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) }; strokes = []; close(); o.done(g); return; }
    S.sig = { img: out.toDataURL("image/png"), who: ceWho(), at: today() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) };
    strokes = []; close(); render();
    if (thenSend) { toast("簽好了：送出、變成 PDF"); doSend(); }
    else toast("簽好了（" + S.sig.at + "）：填好按最下面「✅ 送出」才算完成");
  };
}

function check() {
  var C = SITES[S.site], n = C.secs * C.rows, used = 0, bad = [], ngs = [];
  for (var i = 0; i < n; i++) {
    var d = R(i), any = rowUsed(d);
    if (!any) continue;
    used++;
    var miss = [];
    if (!d.d) miss.push("日期"); if (!d.no) miss.push("領藥號"); if (!d.n) miss.push("筆數");
    if (!d.a) miss.push("第 1 項符合／不符"); if (!d.b) miss.push("第 2 項符合／不符");
    if (d.a === "ng" && !d.am.trim()) miss.push("第 1 項的不符事項"); if (d.b === "ng" && !d.bm.trim()) miss.push("第 2 項的不符事項");
    if (miss.length) bad.push("第 " + (i + 1) + " 列：還沒填 " + miss.join("、"));
    if (d.a === "ng" || d.b === "ng") ngs.push("第 " + (i + 1) + " 列（" + (d.no || "沒寫領藥號") + "）：" + [d.a === "ng" ? "列印品質：" + (d.am || "—") : "", d.b === "ng" ? "調劑品質：" + (d.bm || "—") : ""].filter(Boolean).join("；"));
  }
  if (!S.edit && !ceReady()) bad.unshift("查檢者的" + (!S.ce.emp ? "員工編號" : "姓名") + "還沒打");
  if (!used) bad.unshift("還沒有填任何一列");
  return { used: used, bad: bad, ngs: ngs };
}
function doSend() {
  if (S.form === "pid") return pidSend();
  if (Q.sending) return;
  var r = check(), m = $("#qc-msg"); m.innerHTML = "";
  if (r.bad.length) { m.appendChild(el("div", { class: "bad", text: "⚠️ 還不能送出：" })); r.bad.slice(0, 8).forEach(function (s) { m.appendChild(el("div", { class: "bad", text: "・" + s })); }); return; }
  var C = SITES[S.site], rows = [];
  for (var i = 0; i < C.secs * C.rows; i++) rows.push(JSON.parse(JSON.stringify(R(i))));
  if (S.edit) {
    var E = S.edit;
    if (!canEdit(E)) { m.appendChild(el("div", { class: "bad", text: isLocked(mkey(E.at)) ? "🔒 這個月已經鎖住了，只能查閱，不能存修改。" : "⚠️ 你沒有「編輯修改」的權限（開發者在設定裡勾）。" })); return; }
    saveEdit(E, { form: "bag", site: E.site, at: E.at, rows: rows, sig: E.sig, edits: E.edits, att: attOf("bag").slice() }, { rows: rows, sig: noImgSig(E.sig) });
    return;
  }
  var sg = S.sig || { who: ceWho(), at: "", none: 1 };
  submitNew({ form: "bag", site: S.site, rows: rows, sig: sg, ce: { emp: S.ce.emp, name: S.ce.name }, at: new Date(), att: attOf("bag").slice() }, { rows: rows, sig: noImgSig(sg) });
}
function busyMsg(t) { var m = $("#qc-msg"); m.innerHTML = ""; m.appendChild(el("div", { class: "okm", text: t })); }
function failMsg(e) { var m = $("#qc-msg"); m.innerHTML = ""; m.appendChild(el("div", { class: "bad", text: "⚠️ 沒有存好：" + errText(e) + "（表格、簽名都還在，網路好了再按一次）" })); }
function sendBtns(on) { Q.sending = on; ["#qc-send", "#qc-clear", "#qc-draft"].forEach(function (s) { var b = $(s); if (b) b.disabled = on; }); }
function submitNew(rec, data) {
  sendBtns(true); busyMsg("⏳ 變成 PDF、存到雲端硬碟中…");
  makePdf(rec).then(function () { return toB64(rec.pdf); }).then(function (b64) {
    return api("send", JSON.stringify({ form: rec.form, site: rec.site, data: data }), b64);
  }).then(function (x) {
    sendBtns(false);
    var nr = mkRec(x.rec); nr.pdf = rec.pdf; nr.pngs = rec.pngs; nr.png = rec.png; nr.file = x.file;
    if (Q.list) Q.list.unshift(nr);
    wipeSigs(rec);
    if (rec.form === "pid") { S.pid = pidNew(); Q.drafts.pid = null; Q.draftLoaded.pid = false; } else { S.rows = {}; S.sig = null; }
    attOf(rec.form || "bag").length = 0;
    render();
    var m = $("#qc-msg"); m.innerHTML = "";
    m.appendChild(el("div", { class: "okm", text: "✅ 送出了：變成 PDF（" + nr.pngs.length + " 頁）保留（填了 " + nr.used + (nr.form === "pid" ? " 段、不符合 " + nr.ng + " 項" : " 列、不符 " + nr.ng + " 列") + "）。到「📁 查閱」看。" }));
    m.appendChild(el("div", { class: "okm", text: "🗑 簽名的圖已經刪掉（只留在 PDF 上，不另外存簽名檔）" + (nr.form === "pid" ? "；暫存也清掉了" : "") + "。" }));
    m.appendChild(el("div", { class: "okm drv", text: "☁ 存在雲端硬碟：" + (x.path || x.file) }));
    var b = el("button", { type: "button", class: "btn", text: "👀 看這一份 PDF" }); b.onclick = function () { showPdf(nr); }; m.appendChild(b);
    var bp = el("button", { type: "button", class: "btn", style: "margin-left:8px", text: "🖨 列印" }); bp.onclick = function () { printRecs([nr]); }; m.appendChild(bp);
    toast("✅ 送出了，可以填下一張");
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
  }, function (e) { sendBtns(false); failMsg(e); });
}
function wipeSigs(rec) {
  if (rec.sig) rec.sig.img = null;
  (rec.secs || []).forEach(function (s) { if (s.tsig) s.tsig.img = null; if (s.csig) s.csig.img = null; });
}
function saveEdit(E, rec, data) {
  sendBtns(true); busyMsg("⏳ PDF 重做、存到雲端硬碟中…");
  fetchPdf(E).then(function () {
    rec.at = E.at; rec.edits = (E.edits || []).concat([{ who: me(), at: new Date() }]);
    rec.keep = (E.pngs || []).slice(rec.form === "pid" ? 2 : 1);
    return makePdf(rec, rec.form === "pid" ? E.pngs : E.png);
  }).then(function () { return toB64(rec.pdf); }).then(function (b64) {
    return api("edit", JSON.stringify({ id: E.id, data: data }), b64);
  }).then(function (x) {
    sendBtns(false);
    var nr = mkRec(x.rec); nr.pdf = rec.pdf; nr.pngs = rec.pngs; nr.png = rec.png; nr.file = x.file;
    if (Q.list) Q.list = Q.list.map(function (r) { return r.id === nr.id ? nr : r; });
    S.edit = null; loadSite(S.site); render();
    var m = $("#qc-msg"); m.innerHTML = "";
    var last = nr.edits[nr.edits.length - 1];
    m.appendChild(el("div", { class: "okm", text: "💾 存好了：PDF 重做（第 " + nr.edits.length + " 次修改，記下 " + (last ? last.who + "、" + fmtAt(last.at) : me()) + "）；舊的那一份留著（開發者看得到）。" }));
    var b = el("button", { type: "button", class: "btn", text: "👀 看改好的 PDF" }); b.onclick = function () { showPdf(nr); }; m.appendChild(b);
    showPdf(nr);
  }, function (e) { sendBtns(false); failMsg(e); });
}
var A4 = { w: 1240, h: 1754 };
function loadImg(src) { return new Promise(function (ok) { if (!src) { ok(null); return; } var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }); }
function drawForm(rec, prev) {
  var C = SITES[rec.site], cv = document.createElement("canvas"); cv.width = A4.w; cv.height = A4.h;
  var g = cv.getContext("2d"), F = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif";
  g.fillStyle = "#fff"; g.fillRect(0, 0, A4.w, A4.h); g.fillStyle = "#111"; g.strokeStyle = "#111"; g.textBaseline = "middle";
  var L = 70, Rr = A4.w - 70, y = 70;
  drawLogo(g, C, L, y, F);
  y += 100; g.fillStyle = "#111"; g.textAlign = "center"; fitText(g, TITLE, A4.w / 2, y, A4.w - 140, 40, "900", F);
  return Promise.all([loadImg(rec.sig && rec.sig.img), loadImg(!(rec.sig && rec.sig.img) && prev)]).then(function (two) {
    var im = two[0], old = two[1];
    y += 56; g.textAlign = "right"; g.font = "800 26px " + F;
    var ce = rec.ce || ceOf(rec.sig), ceT = "員工編號：" + (ce.emp || "＿＿＿＿") + "　姓名：" + (ce.name || "＿＿＿＿");
    g.font = "700 24px " + F; var ceW = Math.min(g.measureText(ceT).width, 520); g.font = "800 26px " + F;
    g.fillText("查檢者：", Rr - 300 - 6 - ceW - 8, y + 24);
    fitText(g, ceT, Rr - 300 - 6, y + 24, 520, 24, "700", F); g.textAlign = "right";
    g.strokeStyle = "#999"; g.strokeRect(Rr - 290, y - 6, 290, 64);
    if (im) { var sc = Math.min(140 / im.width, 56 / im.height); g.drawImage(im, Rr - 284, y - 2, im.width * sc, im.height * sc); }
    else if (old) g.drawImage(old, Rr - 286, y - 4, 146, 62, Rr - 286, y - 4, 146, 62);
    g.textAlign = "left"; g.font = "15px " + F; g.fillStyle = "#333"; g.fillText(rec.sig ? rec.sig.who : "", Rr - 138, y + 12); g.fillText(rec.sig ? rec.sig.at || (im || old ? "" : "（沒有簽名）") : "", Rr - 138, y + 38);
    y += 78;
    var W = [10.5, 9, 7, 7, 7, 17, 7, 7, 28.5], tw = Rr - L, xs = [L]; W.forEach(function (w) { xs.push(xs[xs.length - 1] + tw * w / 100); });
    var nRows = C.secs * (C.rows + 1), hh = Math.min(48, Math.floor((A4.h - 80 - y - 130) / nRows));
    g.strokeStyle = "#111"; g.lineWidth = 2;
    g.strokeRect(L, y, tw, 130); g.beginPath(); g.moveTo(xs[3], y); g.lineTo(xs[3], y + 130); g.moveTo(xs[6], y); g.lineTo(xs[6], y + 130); g.stroke();
    g.strokeStyle = "#3B82C4"; g.lineWidth = 1; g.beginPath(); g.moveTo(L, y); g.lineTo(xs[3], y + 130); g.stroke(); g.strokeStyle = "#111"; g.lineWidth = 2;
    g.font = "900 26px " + F; g.textAlign = "right"; g.fillStyle = "#111"; g.fillText("查檢項目", xs[3] - 18, y + 65);
    var wrap = function (t, x, yy, w, lh) { var line = "", ly = yy; Array.from(t).forEach(function (ch) { if (g.measureText(line + ch).width > w) { g.fillText(line, x, ly); line = ch; ly += lh; } else line += ch; }); g.fillText(line, x, ly); };
    g.textAlign = "left"; g.font = "800 23px " + F; wrap(ITEMS[0], xs[3] + 12, y + 26, xs[6] - xs[3] - 24, 36); wrap(ITEMS[1], xs[6] + 12, y + 26, Rr - xs[6] - 24, 36);
    y += 130;
    var idx = 0;
    for (var sct = 0; sct < C.secs; sct++) {
      g.lineWidth = 3; g.beginPath(); g.moveTo(L, y); g.lineTo(Rr, y); g.stroke(); g.lineWidth = 1.5;
      g.font = "800 " + Math.min(20, hh * .5) + "px " + F; g.textAlign = "center";
      ["日期", "領藥號", "筆數", "符合", "不符", "不符事項", "符合", "不符", "不符事項"].forEach(function (t, k) { g.fillText(t, (xs[k] + xs[k + 1]) / 2, y + hh / 2); });
      g.strokeRect(L, y, tw, hh); xs.slice(1, -1).forEach(function (x) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + hh); g.stroke(); });
      y += hh;
      for (var rr = 0; rr < C.rows; rr++) {
        var d = rec.rows[idx++] || {};
        g.strokeRect(L, y, tw, hh); xs.slice(1, -1).forEach(function (x) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + hh); g.stroke(); });
        g.font = Math.min(19, hh * .46) + "px " + F; g.fillStyle = "#111"; g.textAlign = "center";
        var cell = function (k, t, col) { if (!t) return; g.fillStyle = col || "#111"; var w = xs[k + 1] - xs[k] - 10, s = t; while (g.measureText(s).width > w && s.length > 1) s = s.slice(0, -1); g.fillText(s === t ? s : s.slice(0, -1) + "…", (xs[k] + xs[k + 1]) / 2, y + hh / 2); };
        cell(0, d.d); cell(1, d.no); cell(2, d.n);
        cell(3, d.a === "ok" ? "✔" : "", "#15803D"); cell(4, d.a === "ng" ? "✔" : "", "#B91C1C"); cell(5, d.am, "#B91C1C");
        cell(6, d.b === "ok" ? "✔" : "", "#15803D"); cell(7, d.b === "ng" ? "✔" : "", "#B91C1C"); cell(8, d.bm, "#B91C1C");
        y += hh;
      }
    }
    g.lineWidth = 3; g.beginPath(); g.moveTo(L, y); g.lineTo(Rr, y); g.stroke();
    g.font = "15px " + F; g.fillStyle = "#666"; g.textAlign = "right"; g.fillText("送出：" + fmtAt(rec.at) + "（電子查檢表）", Rr, A4.h - 50);
    var ed = rec.edits || [];
    if (ed.length) { var last = ed[ed.length - 1]; g.fillStyle = "#8A5A00"; g.textAlign = "left"; g.fillText("修改：" + last.who + "　" + fmtAt(last.at) + "（共 " + ed.length + " 次）", L, A4.h - 50); }
    return cv;
  });
}
function fmtAt(d) { return d.getFullYear() + "/" + pad2(d.getMonth() + 1) + "/" + pad2(d.getDate()) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
function pdfFromJpeg(jpg, w, h) { return pdfPages([{ jpg: jpg, w: w, h: h }]); }
function pdfPages(pages) {
  var enc = function (s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
  var parts = [], off = [], len = 0;
  var push = function (x) { var b = typeof x === "string" ? enc(x) : x; parts.push(b); len += b.length; };
  push("%PDF-1.4\n");
  var obj = function (n, body, stream) { off[n] = len; push(n + " 0 obj\n" + body + (stream ? "\nstream\n" : "\nendobj\n")); if (stream) { push(stream); push("\nendstream\nendobj\n"); } };
  var cs = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q", kids = pages.map(function (_, i) { return (3 + i * 3) + " 0 R"; }).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [" + kids + "] /Count " + pages.length + " >>");
  pages.forEach(function (pg, i) {
    var n = 3 + i * 3;
    obj(n, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 " + (n + 1) + " 0 R >> >> /Contents " + (n + 2) + " 0 R >>");
    obj(n + 1, "<< /Type /XObject /Subtype /Image /Width " + pg.w + " /Height " + pg.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + pg.jpg.length + " >>", pg.jpg);
    obj(n + 2, "<< /Length " + cs.length + " >>", enc(cs));
  });
  var N = 3 + pages.length * 3, xo = len, x = "xref\n0 " + N + "\n0000000000 65535 f \n";
  for (var k = 1; k < N; k++) x += ("0000000000" + off[k]).slice(-10) + " 00000 n \n";
  push(x + "trailer\n<< /Size " + N + " /Root 1 0 R >>\nstartxref\n" + xo + "\n%%EOF\n");
  return new Blob(parts, { type: "application/pdf" });
}
function jpgBytes(u) { var b = atob(u.split(",")[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(a) { var c = 0xFFFFFFFF; for (var i = 0; i < a.length; i++) c = CRC[(c ^ a[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) {
  var u8 = function (s) { return new TextEncoder().encode(s); }, parts = [], cd = [], off = 0;
  var le = function (v, n) { var a = new Uint8Array(n); for (var i = 0; i < n; i++) a[i] = (v >>> (8 * i)) & 255; return a; };
  var cat = function (arr) { var L = arr.reduce(function (s, x) { return s + x.length; }, 0), o = new Uint8Array(L), p = 0; arr.forEach(function (x) { o.set(x, p); p += x.length; }); return o; };
  files.forEach(function (f) {
    var nm = u8(f.name), d = typeof f.data === "string" ? u8(f.data) : f.data, c = crc32(d);
    var lh = cat([le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(c, 4), le(d.length, 4), le(d.length, 4), le(nm.length, 2), le(0, 2), nm]);
    cd.push(cat([le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(c, 4), le(d.length, 4), le(d.length, 4), le(nm.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(off, 4), nm]));
    parts.push(lh, d); off += lh.length + d.length;
  });
  var cdb = cat(cd);
  parts.push(cdb, cat([le(0x06054b50, 4), le(0, 2), le(0, 2), le(files.length, 2), le(files.length, 2), le(cdb.length, 4), le(off, 4), le(0, 2)]));
  return new Blob(parts, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
function xlsx(sheets) {
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var col = function (i) { var s = ""; i++; while (i) { var r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
  var F = [{ name: "[Content_Types].xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") + "</Types>" },
    { name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: "xl/workbook.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") + "</sheets></workbook>" },
    { name: "xl/_rels/workbook.xml.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: "xl/styles.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFB91C1C"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F6EE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }];
  sheets.forEach(function (s, si) {
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' + s.cols.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols><sheetData>";
    s.rows.forEach(function (row, ri) {
      x += '<row r="' + (ri + 1) + '">';
      row.forEach(function (c, ci) {
        var v = c && typeof c === "object" ? c.v : c, st = ri === 0 ? 1 : (c && typeof c === "object" ? c.s : 0), ref = col(ci) + (ri + 1);
        if (v === "" || v === null || v === undefined) return;
        x += typeof v === "number" ? '<c r="' + ref + '" s="' + st + '"><v>' + v + "</v></c>" : '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + esc(v) + "</t></is></c>";
      });
      x += "</row>";
    });
    x += "</sheetData>" + (s.filter ? '<autoFilter ref="A1:' + col(s.cols.length - 1) + Math.max(1, s.rows.length) + '"/>' : "") + "</worksheet>";
    F.push({ name: "xl/worksheets/sheet" + (si + 1) + ".xml", data: x });
  });
  return zipStore(F);
}
function rid() { return Math.random().toString(36).slice(2, 12); }
function save(blob, name) {
  var u = URL.createObjectURL(blob), a = el("a", { href: u, download: name }); document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
  window.__lastSave = { blob: blob, name: name };
}
var YN = { ok: "符合", ng: "不符" };
function yearXlsx(y) {
  var list = yearRecs(y), st = [["月份", "份數", "藥袋（份）", "病人辨識（份）", "填的列數／段數", "不符（筆）", "有不符的份數", "不符率", "鎖住了嗎"]], pd = [["月份", "送出時間", "院區", "第幾段", "查檢對象員工編號", "查檢對象", "日期", "上／下午", "查檢者"].concat(PID_ITEMS.map(function (t, j) { return "第 " + (j + 1) + " 項"; }), ["備註", "修改紀錄"])], det = [["月份", "送出時間", "院區", "查檢者", "第幾列", "日期", "領藥號", "筆數", "藥袋列印品質", "不符事項", "藥袋調劑品質", "不符事項", "修改紀錄"]];
  var tot = [0, 0, 0, 0, 0, 0];
  for (var m = 1; m <= 12; m++) {
    var L = list.filter(function (r) { return r.at.getMonth() + 1 === m; }), used = 0, ng = 0, ngf = 0, nb = 0, np = 0;
    L.forEach(function (r) { used += r.used; ng += r.ng; if (r.ng) ngf++; if (r.form === "pid") np++; else nb++; });
    tot[0] += L.length; tot[1] += used; tot[2] += ng; tot[3] += ngf; tot[4] += nb; tot[5] += np;
    st.push([m + " 月", L.length, nb, np, used, ng ? { v: ng, s: 2 } : 0, ngf, used ? Math.round(ng / used * 1000) / 10 + "%" : "—", !L.length ? "—" : isLocked(y + "-" + m) ? "🔒 鎖住" : "可以改"]);
  }
  st.push([{ v: "全年", s: 1 }, { v: tot[0], s: 1 }, { v: tot[4], s: 1 }, { v: tot[5], s: 1 }, { v: tot[1], s: 1 }, { v: tot[2], s: tot[2] ? 2 : 1 }, { v: tot[3], s: 1 }, { v: tot[1] ? Math.round(tot[2] / tot[1] * 1000) / 10 + "%" : "—", s: 1 }, ""]);
  list.forEach(function (r) {
    var eds = (r.edits || []).map(function (e) { return e.who + " " + fmtAt(e.at); }).join("；");
    if (r.form === "pid") {
      r.secs.forEach(function (s, k) { if (!secUsed(s)) return; pd.push([(r.at.getMonth() + 1) + " 月", fmtAt(r.at), (SITES[r.site] || { name: r.site }).name, k + 1, s.emp, s.name, s.d, s.ap, s.csig ? s.csig.who : ""].concat(s.it.map(function (v) { return v === "ng" ? { v: "不符合", s: 2 } : v === "ok" ? "符合" : ""; }), [s.note || "", eds])); });
      return;
    }
    r.rows.forEach(function (d, i) {
      if (!rowUsed(d)) return;
      det.push([(r.at.getMonth() + 1) + " 月", fmtAt(r.at), (SITES[r.site] || { name: r.site }).name, r.sig ? r.sig.who : "", i + 1, d.d, d.no, d.n === "" ? "" : +d.n, d.a === "ng" ? { v: "不符", s: 2 } : YN[d.a] || "", d.am, d.b === "ng" ? { v: "不符", s: 2 } : YN[d.b] || "", d.bm, eds]);
    });
  });
  save(xlsx([{ name: "每月統計", cols: [10, 8, 10, 13, 13, 10, 13, 9, 11], rows: st }, { name: "藥袋明細", cols: [8, 17, 10, 17, 8, 12, 11, 6, 13, 24, 13, 24, 30], rows: det, filter: true }, { name: "病人辨識明細", cols: [8, 17, 10, 7, 14, 10, 12, 8, 17, 8, 8, 8, 8, 8, 8, 8, 28, 30], rows: pd, filter: true }]), "qc-" + y + "-" + rid() + ".xlsx");
  toast("⬇ 整年 Excel：藥袋 " + (det.length - 1) + " 筆、病人辨識 " + (pd.length - 1) + " 段");
}
function monthRecs(y, m) { return yearRecs(y).filter(function (r) { return r.at.getMonth() + 1 === +m; }); }
function pctOf(a, b) { return b ? Math.round(a / b * 1000) / 10 + "%" : "—"; }
function dayKey(s) { var p = parse(s); return p ? p.y + "/" + pad2(p.m) + "/" + pad2(p.dd) : ""; }
function pidShort(j) { return PID_ITEMS[j].replace(/^\d+\./, "").split(/[，(（]/)[0]; }
function msumSecs(y, m) {
  var list = monthRecs(y, m), secs = [], sname = function (id) { return (SITES[id] || { name: id || "—" }).name; };
  var ov = {}, tot = { n: 0, u: 0, ng: 0, nf: 0 };
  var bag = { rows: 0, pcs: 0, a: { ok: 0, ng: 0 }, b: { ok: 0, ng: 0 } }, pid = { secs: 0, it: PID_ITEMS.map(function () { return { ok: 0, ng: 0, no: 0 }; }) };
  var who = {}, day = {}, ngs = [], dd = {};
  var DD = function (k, r) { var o = dd[k] || (dd[k] = { bag: [], pid: [], recs: [] }); if (o.recs.indexOf(r) < 0) o.recs.push(r); return o; };
  var W = function (k) { return who[k] || (who[k] = { bf: 0, br: 0, ps: 0, ng: 0 }); };
  var D = function (k) { return day[k] || (day[k] = { b: 0, p: 0, ng: 0 }); };
  list.forEach(function (r) {
    var f = r.form || "bag", k = f + "|" + r.site, o = ov[k] || (ov[k] = { f: f, s: r.site, n: 0, u: 0, ng: 0, nf: 0 });
    o.n++; o.u += r.used; o.ng += r.ng; if (r.ng) o.nf++;
    tot.n++; tot.u += r.used; tot.ng += r.ng; if (r.ng) tot.nf++;
    if (f === "pid") {
      (r.secs || []).forEach(function (s) {
        if (!secUsed(s)) return;
        pid.secs++;
        var cw = s.csig && s.csig.who || "（沒簽）", w = W(cw), dk = dayKey(s.d) || "（沒寫日期）", dd0 = D(dk), n0 = 0, bad = [], nOk = 0;
        w.ps++; dd0.p++;
        (s.it || []).forEach(function (v, j) {
          if (!pid.it[j]) return;
          if (v === "ng") { pid.it[j].ng++; n0++; bad.push(pidShort(j)); ngs.push([dk, sname(r.site), FORMS.pid, (s.name || "—") + (s.emp ? "（" + s.emp + "）" : ""), pidShort(j), (s.note || "").trim(), cw]); }
          else if (v === "ok") { pid.it[j].ok++; nOk++; } else pid.it[j].no++;
        });
        w.ng += n0; dd0.ng += n0;
        DD(dk, r).pid.push({ site: sname(r.site), obj: (s.name || "—") + (s.emp ? "（" + s.emp + "）" : ""), ap: s.ap || "", who: cw, bad: bad, ok: nOk, note: (s.note || "").trim() });
      });
      return;
    }
    var bw = recWho(r), w = W(bw);
    w.bf++;
    (r.rows || []).forEach(function (d) {
      if (!rowUsed(d)) return;
      bag.rows++; w.br++;
      var n = parseInt(d.n, 10); if (n > 0) bag.pcs += n;
      var dk = dayKey(d.d) || "（沒寫日期）", dd0 = D(dk), n0 = 0;
      dd0.b++;
      DD(dk, r).bag.push({ site: sname(r.site), who: bw, no: d.no || "—", n: d.n === "" || d.n === undefined ? "" : String(d.n), a: d.a || "", am: (d.am || "").trim(), b: d.b || "", bm: (d.bm || "").trim() });
      if (d.a === "ok") bag.a.ok++; else if (d.a === "ng") { bag.a.ng++; n0++; ngs.push([dk, sname(r.site), FORMS.bag, d.no || "—", "藥袋列印品質", (d.am || "").trim(), bw]); }
      if (d.b === "ok") bag.b.ok++; else if (d.b === "ng") { bag.b.ng++; n0++; ngs.push([dk, sname(r.site), FORMS.bag, d.no || "—", "藥袋調劑品質", (d.bm || "").trim(), bw]); }
      w.ng += n0; dd0.ng += n0;
    });
  });
  var B = function (v) { return { v: v, b: 1 }; }, R = function (v) { return v ? { v: v, red: 1 } : 0; };
  var ovr = Object.keys(ov).sort().map(function (k) { var o = ov[k]; return [FORMS[o.f], sname(o.s), o.n, o.u, R(o.ng), o.nf, pctOf(o.ng, o.u)]; });
  ovr.push([B("合計"), B(""), B(tot.n), B(tot.u), tot.ng ? { v: tot.ng, b: 1, red: 1 } : B(0), B(tot.nf), B(pctOf(tot.ng, tot.u))]);
  secs.push({ t: "一、總覽（表單 × 院區）", head: ["表單", "院區", "份數", "填的列／段", "不符（筆）", "有不符的份數", "不符率"], w: [20, 16, 10, 14, 13, 15, 12], rows: ovr });
  if (list.some(function (r) { return (r.form || "bag") === "bag"; })) {
    var it = function (nm, o) { return [nm, o.ok + o.ng, o.ok, R(o.ng), pctOf(o.ng, o.ok + o.ng)]; };
    secs.push({ t: "二、" + FORMS.bag + "：項目統計（查檢 " + bag.rows + " 列、藥袋 " + bag.pcs + " 筆）", head: ["項目", "查檢（列）", "符合", "不符", "不符率"], w: [40, 15, 15, 15, 15], rows: [it("藥袋列印品質：列印字樣能清楚辨識無斷句、條碼刷讀檢測", bag.a), it("藥袋調劑品質：劑型、規格、藥品、用法、數量，是否正確", bag.b)] });
  }
  if (list.some(function (r) { return r.form === "pid"; })) {
    secs.push({ t: "三、" + FORMS.pid + "：項目統計（查檢 " + pid.secs + " 段）", head: ["項目", "符合", "不符", "沒勾", "不符率"], w: [52, 12, 12, 12, 12], rows: pid.it.map(function (o, j) { return [PID_ITEMS[j], o.ok, R(o.ng), o.no, pctOf(o.ng, o.ok + o.ng)]; }) });
  }
  secs.push({ t: "四、查檢者", head: ["查檢者", "藥袋（份）", "藥袋（列）", "病人辨識（段）", "不符（筆）"], w: [32, 17, 17, 17, 17], rows: Object.keys(who).sort().map(function (k) { var o = who[k]; return [k, o.bf, o.br, o.ps, R(o.ng)]; }) });
  secs.push({ day: 1, t: "五、每日（照表上填的日期）", head: ["日期", "藥袋（列）", "病人辨識（段）", "不符（筆）"], w: [31, 23, 23, 23], rows: Object.keys(day).sort().map(function (k) { var o = day[k]; return [k, o.b, o.p, R(o.ng)]; }) });
  ngs.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  secs.push({ ngl: 1, t: "六、不符明細（" + ngs.length + " 筆）", head: ["日期", "院區", "表單", "領藥號／查檢對象", "項目", "不符事項", "查檢者"], w: [11, 10, 13, 15, 17, 18, 16], rows: ngs.length ? ngs.map(function (x) { return x.map(function (v, i) { return i === 4 ? { v: v, red: 1 } : v; }); }) : [["這個月沒有不符 👍", "", "", "", "", "", ""]], wrap: 1 });
  return { y: +y, m: +m, n: list.length, secs: secs, dd: dd, lock: isLocked(y + "-" + m) };
}
function cv0(c) { return c && typeof c === "object" ? c.v : c; }
function msumView(y, m) {
  var S0 = msumSecs(y, m);
  var pdfB = el("button", { type: "button", class: "btn msumpdf", text: "⬇ 彙整 PDF", title: "下載 PDF（可以列印）" }), xlsB = el("button", { type: "button", class: "btn msumxls", text: "⬇ 彙整 Excel" });
  pdfB.onclick = function () { msumPdf(y, m); }; xlsB.onclick = function () { msumXlsx(y, m); };
  var btns = [pdfB, xlsB];
  if (typeof window.PH_SHARE === "function") {
    var qrB = el("button", { type: "button", class: "btn msumqr", text: "📱 QR", title: "QR 給別人看（當下用：10 分鐘）" });
    qrB.onclick = function () { msumQr(y, m); };
    btns.push(qrB);
  }
  return msumBox(S0, btns, S0.lock ? "🔒 這個月鎖住了：彙整不會再變。" : "隨時看都是最新的（照目前送出的算；修改、新送出的會跟著變）。");
}
function msumPack(y, m) { var S0 = msumSecs(y, m); return { y: S0.y, m: S0.m, n: S0.n, lock: S0.lock ? 1 : 0, secs: S0.secs, at: fmtAt(new Date()) }; }
function msumBox(S0, btns, note) {
  var box = el("div", { class: "msum", id: "qc-msum" }), y = S0.y, m = S0.m;
  box.appendChild(el("div", { class: "mshd" }, [el("b", { text: "📊 " + y + " 年 " + m + " 月 彙整（民國 " + (y - 1911) + " 年）" })].concat(btns || [])));
  if (note) box.appendChild(el("div", { class: "note", text: note }));
  (S0.secs || []).forEach(function (s) {
    var isDay = !!(s.day || /^五、每日/.test(s.t || ""));
    box.appendChild(el("h4", {}, [s.t, isDay && (s.rows || []).length ? el("span", { class: "mshint", text: "點日期看那一天" }) : null]));
    box.appendChild(el("div", { class: "mswrap" }, [msTable(s.head, s.rows, isDay ? function (dk) { dayPop(S0, dk); } : null)]));
  });
  return box;
}
function msTable(head, rows, onDay) {
  var tb = el("table", { class: "mstab" + (head.length >= 6 ? " mscard" : "") }), tr = el("tr");
  head.forEach(function (h) { tr.appendChild(el("th", { text: h })); });
  tb.appendChild(el("thead", {}, [tr]));
  var bd = el("tbody");
  rows.forEach(function (row) {
    var r = el("tr");
    row.forEach(function (c, i) {
      var o = c && typeof c === "object" ? c : { v: c }, t = String(o.v === undefined || o.v === null ? "" : o.v);
      var num = typeof o.v === "number" || /^[\d.]+%$|^—$/.test(t), dt = /^\d{4}\/\d{2}\/\d{2}$/.test(t);
      var td = el("td", { class: ((o.b ? "b" : "") + (o.red ? " red" : "") + (num ? " num" : "") + (num || dt ? " nw" : "") + (t === "" ? " emp" : "")).trim() || null, "data-l": head[i] || "" });
      if (i === 0 && onDay && t && !o.b) { var bt = el("button", { type: "button", class: "msday", title: "看 " + t + " 這一天", text: t }); bt.onclick = function () { onDay(t); }; td.appendChild(bt); }
      else td.textContent = t;
      r.appendChild(td);
    });
    bd.appendChild(r);
  });
  tb.appendChild(bd);
  return tb;
}
function dayPop(S0, dk) {
  var D = S0.dd && S0.dd[dk], sum = null, ngSec = null;
  (S0.secs || []).forEach(function (s) {
    if (s.day || /^五、每日/.test(s.t || "")) (s.rows || []).forEach(function (r) { if (cv0(r[0]) === dk) sum = r; });
    if (s.ngl || /^六、不符明細/.test(s.t || "")) ngSec = s;
  });
  var x = el("button", { type: "button", class: "btn", text: "關閉" }), bd = el("div", { class: "daybd" });
  var hd = "📅 " + dk + (sum ? "　藥袋 " + cv0(sum[1]) + " 列・病人辨識 " + cv0(sum[2]) + " 段・不符 " + (cv0(sum[3]) || 0) + " 筆" : "");
  if (D) {
    if (D.bag.length) {
      bd.appendChild(el("h4", { text: "📋 " + FORMS.bag + "（" + D.bag.length + " 列）" }));
      bd.appendChild(el("div", { class: "mswrap" }, [msTable(["院區", "查檢者", "領藥號", "筆數", "列印品質", "調劑品質", "不符事項"], D.bag.map(function (b) {
        var yn = function (v) { return v === "ng" ? { v: "不符", red: 1 } : YN[v] || ""; };
        return [b.site, b.who, b.no, b.n, yn(b.a), yn(b.b), [b.am ? "列印：" + b.am : "", b.bm ? "調劑：" + b.bm : ""].filter(Boolean).join("；")];
      }))]));
    }
    if (D.pid.length) {
      bd.appendChild(el("h4", { text: "🪪 " + FORMS.pid + "（" + D.pid.length + " 段）" }));
      bd.appendChild(el("div", { class: "mswrap" }, [msTable(["院區", "查檢對象", "上／下午", "查檢者", "不符的項目", "備註"], D.pid.map(function (p) {
        return [p.site, p.obj, p.ap, p.who, p.bad.length ? { v: p.bad.join("、"), red: 1 } : p.ok ? "全部符合" : "（沒勾）", p.note];
      }))]));
    }
    if (D.recs.length) {
      bd.appendChild(el("h4", { text: "📄 這一天的表單（" + D.recs.length + " 份）" }));
      var lst = el("div", { class: "dayrecs" });
      D.recs.slice().sort(function (a, b) { return a.at - b.at; }).forEach(function (r) {
        var b = el("button", { type: "button", class: "btn", text: "👀 PDF" }); b.onclick = function () { showPdf(r); };
        lst.appendChild(el("div", { class: "dayrec" }, [el("span", { text: (FORMS[r.form || "bag"] || "") + "・" + ((SITES[r.site] || { name: r.site }).name || "") + "・送出 " + fmtAt(r.at) + "・" + recWho(r) }), b]));
      });
      bd.appendChild(lst);
    }
    if (!D.bag.length && !D.pid.length) bd.appendChild(el("div", { class: "note", text: "這一天沒有資料。" }));
  } else {
    var rows = ngSec ? (ngSec.rows || []).filter(function (r) { return cv0(r[0]) === dk; }) : [];
    bd.appendChild(el("div", { class: "note", text: "QR 檢視只看得到這一天的不符明細（看不到每一份）。" }));
    bd.appendChild(el("h4", { text: "不符明細（" + rows.length + " 筆）" }));
    if (rows.length) bd.appendChild(el("div", { class: "mswrap" }, [msTable(ngSec.head.slice(1), rows.map(function (r) { return r.slice(1); }))]));
    else bd.appendChild(el("div", { class: "note", text: "這一天沒有不符 👍" }));
  }
  var v = el("div", { class: "dayv", role: "dialog", "aria-modal": "true", "aria-label": dk + " 這一天" }, [el("div", { class: "daybox" }, [el("div", { class: "dayhd" }, [el("b", { text: hd }), x]), bd])]);
  var close = function () { v.remove(); };
  x.onclick = close;
  v.addEventListener("click", function (e) { if (e.target === v) close(); });
  v.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  ovl().appendChild(v); x.focus();
}
function msumQr(y, m) {
  toast("📱 做 QR 中…");
  window.PH_SHARE(msumPack(y, m)).then(function (r) {
    if (!r || !r.qr) { toast("做不了 QR：" + (r && r.err || "後端沒有回應")); return; }
    var n = r.qr.length, q = 4, sc = Math.max(4, Math.floor(300 / (n + q * 2))), cv = document.createElement("canvas"), W = (n + q * 2) * sc;
    cv.width = W; cv.height = W; cv.className = "qrimg"; cv.setAttribute("aria-label", "QR 碼");
    var g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, W); g.fillStyle = "#000";
    r.qr.forEach(function (row, ri) { for (var ci = 0; ci < row.length; ci++) if (row.charAt(ci) === "1") g.fillRect((ci + q) * sc, (ri + q) * sc, sc, sc); });
    var left = el("b", { class: "qrleft" }), stop = el("button", { type: "button", class: "btn pri qrstop", text: "⛔ 停用並關閉" });
    var v = el("div", { class: "pdfv qrv", role: "dialog", "aria-modal": "true", "aria-label": "QR" }, [el("div", { class: "qrbox" }, [
      el("h3", { text: "📱 " + y + " 年 " + m + " 月 彙整：請對方用手機相機掃" }), cv,
      el("div", { class: "note", text: "掃的人不用登入，只看得到這個月的彙整（不能看每一份、不能填、不能改）。" }),
      el("div", { class: "qrt" }, ["⏳ 剩下 ", left, "（時間到、或按下面的按鍵關掉＝馬上不能掃）"]), stop])]);
    var tm = 0, done = false, end = function (silent) {
      if (done) return; done = true; clearInterval(tm); v.remove();
      window.PH_SHARE_OFF(r.t).then(function () {}, function () {});
      if (!silent) toast("⛔ QR 停用了");
    };
    var tick = function () { var s = Math.max(0, Math.round((r.exp - Date.now()) / 1000)); left.textContent = Math.floor(s / 60) + " 分 " + pad2(s % 60) + " 秒"; if (!s) { end(true); toast("⏰ QR 時間到了，已經不能掃"); } };
    tick(); tm = setInterval(tick, 1000);
    stop.onclick = function () { end(false); };
    v.addEventListener("keydown", function (e) { if (e.key === "Escape") end(false); });
    ovl().appendChild(v); stop.focus();
  }, function (e) { toast("做不了 QR：" + errText(e)); });
}
function msumPdf(y, m) {
  var S0 = msumSecs(y, m), F = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif", pages = [], g = null, cvs = null, L = 70, Wd = A4.w - 140, yy = 0, BOT = A4.h - 90;
  var newPage = function () {
    cvs = document.createElement("canvas"); cvs.width = A4.w; cvs.height = A4.h; g = cvs.getContext("2d"); pages.push(cvs);
    g.fillStyle = "#fff"; g.fillRect(0, 0, A4.w, A4.h); g.textBaseline = "middle"; g.fillStyle = "#111";
    if (pages.length === 1) {
      g.textAlign = "center"; g.font = "900 40px " + F; g.fillText(y + " 年 " + m + " 月　查核和查檢 彙整", A4.w / 2, 100);
      g.font = "20px " + F; g.fillStyle = "#555"; g.fillText("民國 " + (y - 1911) + " 年 " + m + " 月　共 " + S0.n + " 份　" + (S0.lock ? "🔒 已鎖住" : "（製表當下的資料）") + "　製表：" + fmtAt(new Date()) + "　" + me(), A4.w / 2, 146);
      yy = 190;
    } else yy = 70;
  };
  var lines = function (t, w) { var out = [], line = ""; Array.from(String(t)).forEach(function (ch) { if (g.measureText(line + ch).width > w && line) { out.push(line); line = ch; } else line += ch; }); out.push(line); return out.slice(0, 4); };
  var drawRow = function (s, xs, row, head) {
    g.font = (head ? "800 " : "") + "19px " + F;
    var cells = row.map(function (c, i) { var o = c && typeof c === "object" ? c : { v: c }; g.font = (head || o.b ? "800 " : "") + "19px " + F; return { o: o, ls: lines(o.v === undefined || o.v === null ? "" : o.v, xs[i + 1] - xs[i] - 16) }; });
    var h = Math.max(42, Math.max.apply(null, cells.map(function (c) { return c.ls.length; })) * 26 + 16);
    return { h: h, paint: function () {
      if (head) { g.fillStyle = "#E8F1EE"; g.fillRect(L, yy, Wd, h); }
      g.strokeStyle = "#333"; g.lineWidth = 1.2; g.strokeRect(L, yy, Wd, h);
      cells.forEach(function (c, i) {
        if (i) { g.beginPath(); g.moveTo(xs[i], yy); g.lineTo(xs[i], yy + h); g.stroke(); }
        g.font = (head || c.o.b ? "800 " : "") + "19px " + F; g.fillStyle = c.o.red ? "#B91C1C" : "#111";
        var num = typeof c.o.v === "number" || /^[\d.]+%$|^—$/.test(String(c.o.v));
        g.textAlign = head || num ? "center" : "left";
        var x = head || num ? (xs[i] + xs[i + 1]) / 2 : xs[i] + 8, y0 = yy + h / 2 - (c.ls.length - 1) * 13;
        c.ls.forEach(function (t, k) { g.fillText(t, x, y0 + k * 26); });
      });
      yy += h;
    } };
  };
  newPage();
  S0.secs.forEach(function (s) {
    var xs = [L]; s.w.forEach(function (w) { xs.push(xs[xs.length - 1] + Wd * w / 100); });
    var hd = drawRow(s, xs, s.head, true);
    if (yy + 50 + hd.h + 42 > BOT) newPage();
    g.textAlign = "left"; g.font = "900 24px " + F; g.fillStyle = "#1B7F5C"; g.fillText(s.t, L, yy + 22); yy += 46;
    hd = drawRow(s, xs, s.head, true); hd.paint();
    s.rows.forEach(function (row) {
      var r = drawRow(s, xs, row, false);
      if (yy + r.h > BOT) { newPage(); g.textAlign = "left"; g.font = "800 20px " + F; g.fillStyle = "#555"; g.fillText(s.t + "（續）", L, yy + 16); yy += 36; drawRow(s, xs, s.head, true).paint(); }
      r.paint();
    });
    yy += 30;
  });
  pages.forEach(function (c, i) { var gg = c.getContext("2d"); gg.textAlign = "center"; gg.textBaseline = "middle"; gg.font = "18px " + F; gg.fillStyle = "#666"; gg.fillText(y + " 年 " + m + " 月 彙整　第 " + (i + 1) + "／" + pages.length + " 頁", A4.w / 2, A4.h - 45); });
  var jp = pages.map(function (c) { return c.toDataURL("image/jpeg", 0.9); });
  window.__lastMsum = { pages: jp.length };
  save(pdfPages(jp.map(function (u) { return { jpg: jpgBytes(u), w: A4.w, h: A4.h }; })), "qc-sum-" + y + "-" + pad2(m) + ".pdf");
  toast("⬇ " + y + " 年 " + m + " 月 彙整 PDF（" + jp.length + " 頁）");
  return jp;
}
function msumXlsx(y, m) {
  var S0 = msumSecs(y, m), rows = [[{ v: y + " 年 " + m + " 月 查核和查檢 彙整（民國 " + (y - 1911) + " 年）　共 " + S0.n + " 份　製表：" + fmtAt(new Date()), s: 1 }]];
  var X = function (c) { var o = c && typeof c === "object" ? c : { v: c }; return o.red ? { v: o.v, s: 2 } : o.b ? { v: o.v, s: 1 } : o.v; };
  S0.secs.forEach(function (s) {
    rows.push([]); rows.push([{ v: s.t, s: 1 }]);
    rows.push(s.head.map(function (h) { return { v: h, s: 1 }; }));
    s.rows.forEach(function (r) { rows.push(r.map(X)); });
  });
  var last = S0.secs[S0.secs.length - 1], dayS = S0.secs.filter(function (s) { return /^五、/.test(s.t); })[0];
  var ngRows = [last.head].concat(/沒有不符/.test(cv0(last.rows[0][0])) ? [] : last.rows.map(function (r) { return r.map(X); }));
  save(xlsx([{ name: "彙整", cols: [44, 14, 13, 16, 13, 16, 14], rows: rows }, { name: "不符明細", cols: [12, 10, 16, 18, 22, 30, 18], rows: ngRows, filter: true }, { name: "每日", cols: [14, 12, 15, 12], rows: [dayS.head].concat(dayS.rows.map(function (r) { return r.map(X); })) }]), "qc-sum-" + y + "-" + pad2(m) + ".xlsx");
  toast("⬇ " + y + " 年 " + m + " 月 彙整 Excel");
}
function makePdf(rec, prev) {
  var fin = function (pages) {
    return attPages(rec).then(function (extra) {
      rec.pngs = pages.concat(extra, rec.keep || []); rec.png = rec.pngs[0];
      rec.pdf = pdfPages(rec.pngs.map(function (u) { return { jpg: jpgBytes(u), w: A4.w, h: A4.h }; }));
      rec.file = "qc-" + Math.random().toString(36).slice(2, 14) + ".pdf";
      return rec;
    });
  };
  if (rec.form === "pid") return drawPid(rec, prev).then(function (cvs) { return fin(cvs.map(function (cv) { return cv.toDataURL("image/jpeg", 0.9); })); });
  return drawForm(rec, prev).then(function (cv) { return fin([cv.toDataURL("image/jpeg", 0.9)]); });
}
var ATT_MAX = 6;
function attOf(f) { if (!S.att) S.att = { bag: [], pid: [] }; return S.att[f] || (S.att[f] = []); }
function shrinkImg(file, max) {
  return new Promise(function (ok, bad) {
    var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * sc)); c.height = Math.max(1, Math.round(im.naturalHeight * sc));
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); ok({ u: c.toDataURL("image/jpeg", 0.82), w: c.width, h: c.height });
    };
    im.onerror = function () { URL.revokeObjectURL(u); bad(new Error("這不是看得懂的圖片")); };
    im.src = u;
  });
}
function attAdd(f, files) {
  var L = attOf(f), n = 0;
  return files.reduce(function (p, file) {
    return p.then(function () {
      if (L.length >= ATT_MAX) return;
      return shrinkImg(file, 1600).then(function (o) { L.push(o); n++; }, function (e) { toast("❌ " + e.message); });
    });
  }, Promise.resolve()).then(function () { render(); if (n) toast("📎 附了 " + n + " 張照片（PDF 最後面）"); if (L.length >= ATT_MAX && files.length > n) toast("照片最多 " + ATT_MAX + " 張"); });
}
function attBox(f) {
  var L = attOf(f), box = el("div", { class: "attbox" });
  box.appendChild(el("div", { class: "atthd" }, [el("b", { text: "📎 附照片（" + L.length + "／" + ATT_MAX + "）" }), el("span", { class: "note", text: "放在 PDF 的最後面（每頁 2 張）。照片上有病人資料的話，只會留在 PDF 裡。" })]));
  if (S.edit) box.appendChild(el("div", { class: "note", text: "修改：原本附的照片會留著；這裡可以再多附。" }));
  var fi = el("input", { type: "file", accept: "image/*", multiple: "multiple", class: "attfile", "aria-label": "選照片或拍照" });
  fi.onchange = function () { attAdd(f, [].slice.call(fi.files || [])); };
  var pick = el("label", { class: "btn attpick" }, ["📷 選照片／拍照", fi]);
  var pz = pasteBox("📋 或在這裡貼上（Ctrl+V；手機長按→貼上）", function (file) { attAdd(f, [file]); });
  pz.classList.add("attpaste");
  if (L.length < ATT_MAX) box.appendChild(el("div", { class: "attrow" }, [pick, pz]));
  var th = el("div", { class: "attth" });
  L.forEach(function (o, i) {
    var x = el("button", { type: "button", class: "attx", "aria-label": "拿掉第 " + (i + 1) + " 張", text: "✕" });
    x.onclick = function () { L.splice(i, 1); render(); toast("拿掉了"); };
    th.appendChild(el("div", { class: "attit" }, [el("img", { src: o.u, alt: "附的照片 " + (i + 1) }), el("span", { text: String(i + 1) }), x]));
  });
  if (L.length) box.appendChild(th);
  return box;
}
function attPages(rec) {
  var L = rec.att || [];
  if (!L.length) return Promise.resolve([]);
  var F = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif", C = SITES[rec.site] || { name: "" };
  return Promise.all(L.map(function (o) { return loadImg(o.u || o); })).then(function (ims) {
    var out = [];
    for (var p = 0; p < ims.length; p += 2) {
      var cv = document.createElement("canvas"); cv.width = A4.w; cv.height = A4.h;
      var g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, A4.w, A4.h); g.textBaseline = "middle"; g.fillStyle = "#111";
      g.textAlign = "center"; g.font = "800 30px " + F; g.fillText("附件照片　" + C.name + "　" + (FORMS[rec.form || "bag"] || "") + "　" + fmtAt(rec.at instanceof Date ? rec.at : new Date()), A4.w / 2, 70);
      [0, 1].forEach(function (z) {
        var im = ims[p + z]; if (!im) return;
        var top = 110 + z * 810, bw = A4.w - 140, bh = 760, sc = Math.min(bw / im.width, bh / im.height), w = im.width * sc, h = im.height * sc;
        g.drawImage(im, (A4.w - w) / 2, top + (bh - h) / 2, w, h);
        g.strokeStyle = "#999"; g.lineWidth = 1; g.strokeRect((A4.w - w) / 2, top + (bh - h) / 2, w, h);
        g.font = "20px " + F; g.fillStyle = "#444"; g.fillText("照片 " + (p + z + 1) + "／" + ims.length, A4.w / 2, top + bh + 22);
      });
      out.push(cv.toDataURL("image/jpeg", 0.88));
    }
    return out;
  });
}
function printRecs(list) {
  return fetchAll(list, "列印").then(function (rs) {
    var pp = document.getElementById("qc-printpage");
    if (!pp) { pp = el("div", { id: "qc-printpage", "aria-hidden": "true" }); document.body.appendChild(pp); }
    pp.innerHTML = "";
    var loads = []; rs.forEach(function (r) { pagesOf(r).forEach(function (u) { loads.push(new Promise(function (ok) { var im = el("img", { src: u, alt: "" }); im.onload = im.onerror = ok; pp.appendChild(im); })); }); });
    return Promise.all(loads).then(function () {
      var st = el("style", { id: "qc-printcss" }); st.textContent = "@page{size:A4 portrait;margin:0}";
      document.head.appendChild(st); document.body.classList.add("qcprint");
      var done = function () { document.body.classList.remove("qcprint"); try { st.remove(); } catch (e) {  } window.removeEventListener("afterprint", done); };
      window.addEventListener("afterprint", done);
      setTimeout(function () { try { window.print(); } catch (e) { toast("這個瀏覽器不能直接列印：請按「⬇ 下載 PDF」再印"); } setTimeout(done, 1500); }, 50);
    });
  }, function (e) { toast("列印不了：" + errText(e)); });
}
function showPdf(rec, tag) {
  var go = function (o) {
    var url = URL.createObjectURL(o.pdf);
    var dl = el("a", { class: "btn", href: url, download: o.file || "qc.pdf", text: "⬇ 下載 PDF" }), op = el("a", { class: "btn", href: url, target: "_blank", rel: "noopener", text: "↗ 另開" }), x = el("button", { type: "button", class: "btn", text: "關閉" });
    var pr = el("button", { type: "button", class: "btn pri pvprint", text: "🖨 列印" }); pr.onclick = function () { printRecs([o]); };
    var C = SITES[o.site] || { name: "" };
    var v = el("div", { class: "pdfv", role: "dialog", "aria-modal": "true", "aria-label": "PDF" }, [el("div", { class: "pvbar" }, [el("b", { text: "📄 " + (tag ? "【" + tag + "】" : "") + C.name + "　" + FORMS[o.form || "bag"] + "　" + fmtAt(o.at) }), pr, op, dl, x]), el("div", { class: "pvbody" }, pagesOf(o).map(function (u, i) { return el("img", { src: u, alt: "PDF 第 " + (i + 1) + " 頁" }); }))]);
    x.onclick = function () { v.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 3e4); };
    v.addEventListener("keydown", function (e) { if (e.key === "Escape") x.onclick(); });
    ovl().appendChild(v); x.focus();
  };
  if (rec.pdf && rec.pngs) go(rec); else { toast("PDF 拿取中…"); fetchPdf(rec).then(go, function (e) { toast("打不開 PDF：" + errText(e)); }); }
}
function yearRecs(y) { return (Q.list || []).filter(function (r) { return r.at.getFullYear() === +y; }).sort(function (a, b) { return a.at - b.at; }); }
function yearPdf(y, ff) {
  var list = yearRecs(y).filter(function (r) { return !ff || (r.form || "bag") === ff; });
  if (!list.length) { toast("這一年沒有"); return; }
  return fetchAll(list, "整年 PDF").then(function (rs) {
    var pg = []; rs.forEach(function (r) { pagesOf(r).forEach(function (u) { pg.push({ jpg: jpgBytes(u), w: A4.w, h: A4.h }); }); });
    save(pdfPages(pg), "qc-" + y + "-" + rid() + ".pdf");
    toast("⬇ 整年 PDF：" + rs.length + " 份、" + pg.length + " 頁");
  }, function (e) { toast("整年 PDF 沒做好：" + errText(e)); });
}
var PID_TITLE = "藥劑科門急診組交付藥品病人辨識查檢表";
var PID_ITEMS = ["1.請領藥者出示證件，若無證件時，需以開放性問法詢問病人身份相關問題，內容可為姓名、科別、年齡、醫師姓名。", "2.核對病人身份與處方箋基本資料相符", "3.歸還病人身分證件(若無證件時則不需要)", "4.依交付藥品標準作業流程作業", "5.目視藥袋上姓名詢問病人姓名", "6.確認藥袋為該病人之藥品無誤", "7.依目視耳聞之病人姓名唱名"];
var PID_SECS = 6, PID_PER_PAGE = 3;
var FORMS = { bag: "藥袋列印品質", pid: "交付藥品病人辨識" };
var FDEF = { bag: { name: "藥袋列印品質", icon: "📋", title: TITLE }, pid: { name: "交付藥品病人辨識", icon: "🪪", title: PID_TITLE } };
var FCFG = [{ id: "bag", name: FDEF.bag.name, icon: FDEF.bag.icon, hide: false, title: FDEF.bag.title }, { id: "pid", name: FDEF.pid.name, icon: FDEF.pid.icon, hide: false, title: FDEF.pid.title }];
function fc(id) { for (var i = 0; i < FCFG.length; i++) if (FCFG[i].id === id) return FCFG[i]; return null; }
function fLabel(id) { var c = fc(id); return (c.icon ? c.icon + " " : "") + c.name; }
function renderFormBtns() {
  var F = $("#qc-form"); F.innerHTML = "";
  FCFG.forEach(function (c) {
    if (c.hide) return;
    var b = el("button", { type: "button", "data-f": c.id, class: S.form === c.id ? "on" : "", text: fLabel(c.id) });
    b.onclick = function () { setForm(c.id); };
    F.appendChild(b);
  });
}
function fitText(g, t, x, y, maxW, size, weight, F) { var sz = size; g.font = weight + " " + sz + "px " + F; while (g.measureText(t).width > maxW && sz > 18) { sz -= 1; g.font = weight + " " + sz + "px " + F; } g.fillText(t, x, y); }
function pidBlank() { return { emp: "", name: "", tsig: null, d: "", ap: "", it: ["", "", "", "", "", "", ""], note: "", noteOn: false, csig: null, ce: { emp: "", name: "" } }; }
function pidNew() { var a = []; for (var k = 0; k < PID_SECS; k++) a.push(pidBlank()); return a; }
S.form = "bag"; S.pid = pidNew();
var STORE = {};
function stash() { STORE[S.site] = { rows: S.rows, sig: S.sig, pid: S.pid, ce: S.ce, att: S.att }; }
function loadSite(ns) { S.site = ns; var st = STORE[ns] || {}; S.rows = st.rows || {}; S.sig = st.sig || null; S.pid = st.pid || pidNew(); S.ce = st.ce || { emp: "", name: "" }; S.att = st.att || { bag: [], pid: [] }; siteBtns(); }
function secUsed(s) { return !!(s.emp || s.name || s.tsig || s.d || s.ap || s.csig || (s.note || "").trim() || s.it.some(function (v) { return v === "ng"; })); }
function apNow() { return new Date().getHours() < 12 ? "上午" : "下午"; }
function cloneSecs(a) { return a.map(function (s) { var c = JSON.parse(JSON.stringify(s)); c.tsig = s.tsig; c.csig = s.csig; return c; }); }
function sigBox(sig, o) {
  var b = el("div", { class: "sigbox psig " + (o.cls || "") + (sig ? " done" : ""), role: "button", tabindex: "0", title: o.locked ? "修改的時候簽名不變" : "點一下：電子簽名" });
  if (sig) { b.appendChild(sig.img ? el("img", { src: sig.img, alt: "簽名", draggable: "false" }) : el("span", { class: "ph", text: "✍️ 在原本的 PDF 上" })); b.appendChild(el("div", { class: "st" }, [el("div", { text: sig.who }), el("div", { text: sig.at })])); }
  else b.appendChild(el("span", { class: "ph", text: o.ph }));
  var g0 = null, swiped = false;
  if (o.locked) b.classList.add("lockd");
  else if (sig) {
    b.onpointerdown = function (e) { g0 = { x: e.clientX, y: e.clientY }; swiped = false; try { b.setPointerCapture(e.pointerId); } catch (x) {} };
    b.onpointermove = function (e) { if (!g0 || swiped) return; var dx = Math.abs(e.clientX - g0.x), dy = Math.abs(e.clientY - g0.y); if (dy >= Math.max(30, b.offsetHeight * 0.7) && dx <= dy * 0.6) { swiped = true; g0 = null; o.del(); } };
    b.onpointerup = b.onpointercancel = function () { g0 = null; };
  }
  var open = function () { if (o.locked) { toast("修改的時候，原本的簽名不變（修改的人會記在修改紀錄）"); return; } o.open(); };
  b.onclick = function () { if (swiped) { swiped = false; return; } open(); };
  b.onkeydown = function (e) { if (e.key === "Enter") open(); };
  return b;
}
function renderPid() {
  var C = SITES[S.site], P = $("#qc-paper"); P.innerHTML = ""; P.classList.add("pidp");
  if (S.edit) P.appendChild(el("div", { class: "editbar" }, [el("b", { text: "✏️ 正在修改：" }), fmtAt(S.edit.at) + "　" + C.name + "　" + FORMS.pid + "查檢表。改好按「💾 存修改」＝PDF 重做、記下修改的人和時間；舊的那一份留著。已經簽的名字不變；空的段可以新填（要簽名）。"]));
  else if (Q.drafts.pid) P.appendChild(el("div", { class: "draftbar" }, [el("b", { text: "💾 有暫存：" + Q.drafts.pid.at + "（" + ((SITES[Q.drafts.pid.site] || {}).name || "") + "）" }), "　存在雲端：換電腦、晚一點都能接著填；送出後暫存就刪掉"].concat(Q.draftLoaded.pid ? [] : [el("button", { type: "button", class: "btn dload", text: "📂 拿回暫存的" })])));
  var dl = P.querySelector(".dload"); if (dl) dl.onclick = pidDraftLoad;
  $("#qc-send").textContent = S.edit ? "💾 存修改（PDF 重做）" : "✅ 送出（變成 PDF 保留）";
  $("#qc-clear").textContent = S.edit ? "取消修改" : "全部清掉";
  $("#qc-draft").hidden = !!S.edit;
  Array.prototype.forEach.call(document.querySelectorAll("#qc-site button"), function (x) { x.disabled = !!S.edit; });
  var head = function () {
    P.appendChild(logoEl(C));
    P.appendChild(el("h1", { text: PID_TITLE }));
  };
  head();
  if (!TOUCH) P.appendChild(kbdHint());
  S.pid.forEach(function (s, k) {
    if (k === PID_PER_PAGE) { P.appendChild(el("div", { class: "pgbrk", "aria-hidden": "true" }));    P.appendChild(el("h1", { class: "h1b", text: PID_TITLE })); }
    P.appendChild(pidSec(s, k));
  });
  P.appendChild(attBox("pid"));
}
function pidSec(s, k) {
  var sec = el("section", { class: "psec", "data-k": String(k), "aria-label": "第 " + (k + 1) + " 段" });
  var lockT = !!(S.edit && s.tsig), lockC = !!(S.edit && s.csig);
  var emp = el("input", { class: "pemp", value: s.emp, placeholder: "員工編號", "aria-label": "第 " + (k + 1) + " 段 查檢對象 員工編號", inputmode: TOUCH ? "none" : "text", autocapitalize: "characters", autocorrect: "off", lang: "en", autocomplete: "off", spellcheck: "false", maxlength: "12" });
  var nm = el("input", { class: "pname", value: s.name, placeholder: "藥師名字", "aria-label": "第 " + (k + 1) + " 段 查檢對象 名字", autocomplete: "off", maxlength: "12" });
  var en = forceKeys(emp, codeChar, 12, s.emp, function (v) { s.emp = v; autoName(); });
  if (!Q.autoNm) Q.autoNm = {};
  var auto = Q.autoNm[k] && Q.autoNm[k] === s.name ? s.name : "";
  var autoName = function () {
    var e = s.emp, mine = s.name && s.name !== auto, fill = function (n) { if (s.emp !== e || (s.name && s.name !== auto)) return; if (n) { s.name = n; nm.value = n; auto = n; } else if (auto && s.name === auto) { s.name = ""; nm.value = ""; auto = ""; } Q.autoNm[k] = auto; };
    if (!e || e.length < 2 || mine) return;
    clearTimeout(autoName.t);
    autoName.t = setTimeout(function () {
      if (Q.whoC[e] !== undefined) { fill(Q.whoC[e]); return; }
      api("who", e).then(function (x) { Q.whoC[e] = x.name || ""; fill(Q.whoC[e]); }, function () {  });
    }, 350);
  };
  emp.oninput = function () { if (en.comp()) return; var v = emp.value.replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).toUpperCase().replace(/[^A-Z0-9\-]/g, ""); if (v !== emp.value) emp.value = v; s.emp = v; en.sync(v); autoName(); };
  nm.oninput = function () { s.name = nm.value.trim(); auto = ""; Q.autoNm[k] = ""; };
  if (TOUCH) { emp.addEventListener("focus", function () { kpOpen(emp, null, 0, { title: "⌨ 第 " + (k + 1) + " 段 查檢對象 員工編號：", letters: true, sym: "-", max: 12, next: nm, nextLabel: "下一格（名字）" }); }); emp.addEventListener("blur", function () { setTimeout(function () { if (KP && KP.inp === emp && document.activeElement !== emp) kpClose(); }, 0); }); }
  var tsig = sigBox(s.tsig, { cls: "ptsig", ph: "✍️ 藥師簽名", locked: lockT, open: function () {
    if (!s.emp || !s.name) { toast("先打查檢對象的員工編號和名字"); (s.emp ? nm : emp).focus(); return; }
    signOpen(false, { title: "✍️ 查檢對象（被查的藥師）簽名：" + s.name + "（" + s.emp + "）", who: s.name + "（" + s.emp + "）", done: function (g) { s.tsig = g; render(); toast("查檢對象簽好了"); } });
  }, del: function () { s.tsig.img = null; s.tsig = null; render(); toast("🗑 簽名刪掉了，請重新簽"); } });
  var dt = el("span", { class: "pdt", role: "button", tabindex: "0", title: "點一下：自己填入／選日期／同上", text: s.d || "" });
  var dOpen = function (e) { dateTool(dt, { label: "第 " + (k + 1) + " 段的日期", get: function () { return s.d; }, set: function (v) { s.d = v; if (v && !s.ap) s.ap = apNow(); }, prev: function () { for (var j = k - 1; j >= 0; j--) if (S.pid[j].d) return S.pid[j].d; return ""; }, prevLabel: "⬆ 同上（跟上一段一樣）", redraw: render }); if (e) e.stopPropagation(); };
  dt.onclick = dOpen; dt.onkeydown = function (e) { if (e.key === "Enter") dOpen(e); };
  var ap = el("span", { class: "seg pap", role: "radiogroup", "aria-label": "上／下午" }, ["上午", "下午"].map(function (t) { var b = el("button", { type: "button", class: s.ap === t ? "on" : "", text: t, "aria-pressed": String(s.ap === t) }); b.onclick = function () { s.ap = s.ap === t ? "" : t; render(); }; return b; }));
  var csig = sigBox(s.csig, { cls: "pcsig", ph: "✍️ 查檢者簽名", locked: lockC, open: function () {
    if (!(s.ce && s.ce.emp && s.ce.name)) { toast("先打查檢者的員工編號和姓名"); return; }
    signOpen(false, { title: "✍️ 查檢者簽名（第 " + (k + 1) + " 段）", who: s.ce.name + "（" + s.ce.emp + "）", done: function (g) { s.csig = g; if (!s.ap) s.ap = apNow(); render(); toast("第 " + (k + 1) + " 段：查檢者簽好了"); } });
  }, del: function () { s.csig.img = null; s.csig = null; render(); toast("🗑 簽名刪掉了，請重新簽"); } });
  sec.appendChild(el("div", { class: "pline" }, [
    el("span", { class: "pgrp" }, [el("span", { class: "plb", text: "查檢對象：" }), emp, nm, tsig, el("span", { class: "plb", text: "藥師" })]),
    el("span", { class: "pgrp" }, [el("span", { class: "plb", text: "日期：" }), dt, ap]),
    el("span", { class: "pgrp" }, [el("span", { class: "plb", text: "查檢者：" })].concat(ceFields(s.ce || (s.ce = { emp: "", name: "" }), { kp: "⌨ 第 " + (k + 1) + " 段 查檢者 員工編號：", drop: function (st) {
      if (s.csig && s.csig.who !== st.name + "（" + st.emp + "）") { s.csig.img = null; s.csig = null; var b = document.querySelector(".psec[data-k='" + k + "'] .pcsig"); if (b) { b.classList.remove("done"); b.innerHTML = ""; b.appendChild(el("span", { class: "ph", text: "✍️ 查檢者簽名" })); } toast("查檢者換了：簽名拿掉了，請重新簽"); }
    } }), [csig]))]));
  var tb = el("table", { class: "ptab", "aria-label": "第 " + (k + 1) + " 段 標準作業流程" });
  tb.appendChild(el("colgroup", {}, [el("col", { style: "width:" + (innerWidth < 640 ? 62 : 70) + "%" }), el("col", { style: "width:" + (innerWidth < 640 ? 19 : 15) + "%" }), el("col", { style: "width:" + (innerWidth < 640 ? 19 : 15) + "%" })]));
  var hp = el("th", { scope: "col", class: "colh pev", tabindex: "0", title: "點一下：全部符合（這一段／整張表）", text: "符合" });
  hp.onclick = function (e) { pidColPop(hp, k); e.stopPropagation(); };
  hp.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pidColPop(hp, k); } };
  tb.appendChild(el("thead", {}, [
    el("tr", {}, [el("th", { rowspan: "2", text: "標準作業流程" }), el("th", { colspan: "2", class: "pevh", text: "評核" })]),
    el("tr", { class: "pev2" }, [hp, el("th", { scope: "col", text: "不符" })])]));
  var bd = el("tbody");
  PID_ITEMS.forEach(function (t, j) {
    var tr = el("tr", { "data-j": String(j) }, [el("td", { class: "pit", text: t })]);
    [["ok", "符合"], ["ng", "不符合"]].forEach(function (o) {
      var on = s.it[j] === o[0];
      var c = el("td", { class: "c pc" + (on ? " on" + (o[0] === "ng" ? " badc" : "") : ""), "data-v": o[0], role: "checkbox", "aria-checked": String(on), tabindex: "0", "aria-label": "第 " + (k + 1) + " 段 第 " + (j + 1) + " 項 " + o[1], text: on ? "✔" : "" });
      c.onclick = function (e) { e.stopPropagation(); popClose(); s.it[j] = on ? "" : o[0]; render(); pidFocus(k, j, o[0]); };
      c.onkeydown = function (e) { pidKey(e, k, j, o[0]); };
      tr.appendChild(c);
    });
    bd.appendChild(tr);
  });
  tb.appendChild(bd);
  sec.appendChild(el("div", { class: "tscroll" }, [tb]));
  if (s.noteOn || s.note) {
    var ta = el("textarea", { class: "pnote", rows: "2", placeholder: "備註（不一定要寫）", "aria-label": "第 " + (k + 1) + " 段 備註" }); ta.value = s.note;
    ta.oninput = function () { s.note = ta.value; };
    var rm = el("button", { type: "button", class: "btn pnrm", text: "✕ 拿掉備註" }); rm.onclick = function () { s.note = ""; s.noteOn = false; render(); };
    sec.appendChild(el("div", { class: "pnbox" }, [el("span", { class: "plb", text: "備註：" }), ta, rm]));
  } else {
    var ad = el("button", { type: "button", class: "btn pnadd", text: "＋新增備註" }); ad.onclick = function () { s.noteOn = true; render(); var t2 = document.querySelector(".psec[data-k='" + k + "'] .pnote"); if (t2) t2.focus(); };
    sec.appendChild(el("div", { class: "pnbox" }, [ad]));
  }
  return sec;
}
function pidFocus(k, j, v) { var x = document.querySelector(".psec[data-k='" + k + "'] tr[data-j='" + j + "'] td.pc[data-v='" + v + "']"); if (x) { x.focus(); try { x.scrollIntoView({ block: "nearest" }); } catch (e) {  } } return !!x; }
function pidKey(e, k, j, v) {
  var s = S.pid[k], q = keyOf(e), last = PID_ITEMS.length - 1;
  var next = function (vv) { if (j < last) pidFocus(k, j + 1, vv); else if (!pidFocus(k + 1, 0, vv)) pidFocus(k, j, vv); };
  if (q === " " || q === "enter") { e.preventDefault(); s.it[j] = s.it[j] === v ? "" : v; render(); pidFocus(k, j, v); }
  else if (q === "y") { e.preventDefault(); s.it[j] = "ok"; render(); next("ok"); }
  else if (q === "n") { e.preventDefault(); s.it[j] = "ng"; render(); next("ng"); }
  else if (q === "delete" || q === "backspace") { e.preventDefault(); s.it[j] = ""; render(); pidFocus(k, j, v); }
  else if (q === "arrowdown") { e.preventDefault(); if (j < last) pidFocus(k, j + 1, v); else pidFocus(k + 1, 0, v); }
  else if (q === "arrowup") { e.preventDefault(); if (j > 0) pidFocus(k, j - 1, v); else pidFocus(k - 1, last, v); }
  else if (q === "arrowright" && v === "ok") { e.preventDefault(); pidFocus(k, j, "ng"); }
  else if (q === "arrowleft" && v === "ng") { e.preventDefault(); pidFocus(k, j, "ok"); }
}
function pidChkPop(td, k, j, v) {
  var s = S.pid[k], on = s.it[j] === v, name = v === "ok" ? "符合" : "不符合";
  var one = el("button", { type: "button", class: "pri", text: on ? "✕ 取消勾「" + name + "」" : "✔ 勾「" + name + "」" });
  var all = el("button", { type: "button", class: "pall", text: "✔✔ 這一段 7 項全部符合" });
  var clr = el("button", { type: "button", class: "clr1", text: "清掉" });
  popAt(td, [el("div", { class: "t", text: "第 " + (k + 1) + " 段・第 " + (j + 1) + " 項" }), one, all, clr]);
  one.onclick = function () { popClose(); s.it[j] = on ? "" : v; render(); };
  all.onclick = function () { popClose(); s.it = s.it.map(function (x) { return x === "ng" ? x : "ok"; }); render(); };
  clr.onclick = function () { popClose(); s.it[j] = ""; render(); };
}
function pidColPop(th, k) {
  var a1 = el("button", { type: "button", class: "pri psecall", text: "✔ 這一段全部符合（第 " + (k + 1) + " 段）" });
  var a2 = el("button", { type: "button", class: "pallsheet", text: "✔ 整張表全部符合（6 段）" });
  var off = el("button", { type: "button", class: "psecoff", text: "✕ 拿掉這一段的「符合」" });
  popAt(th, [el("div", { class: "t", text: "評核・符合（不符合的不會動）" }), a1, a2, off]);
  var fill = function (s) { s.it = s.it.map(function (x) { return x === "ng" ? x : "ok"; }); };
  a1.onclick = function () { popClose(); fill(S.pid[k]); render(); toast("第 " + (k + 1) + " 段：全部符合"); };
  a2.onclick = function () { popClose(); S.pid.forEach(fill); render(); toast("整張表：全部符合"); };
  off.onclick = function () { popClose(); var s = S.pid[k]; s.it = s.it.map(function (x) { return x === "ok" ? "" : x; }); render(); };
}
function pidCe(k) {
  for (var z = k; z >= 0; z--) { var c = S.pid[z] && S.pid[z].ce; if (c && c.emp && c.name) return c; }
  return { emp: "", name: "" };
}
function pidCheck() {
  var used = 0, bad = [], ngs = [];
  S.pid.forEach(function (s, k) {
    if (!secUsed(s)) return;
    used++;
    var miss = [];
    if (!s.emp) miss.push("查檢對象員工編號"); if (!s.name) miss.push("查檢對象名字");
    if (!s.d) miss.push("日期"); if (!s.ap) miss.push("上／下午");
    if (!(pidCe(k).emp && pidCe(k).name)) miss.push("查檢者員工編號、姓名");
    var no = []; s.it.forEach(function (v, j) { if (!v) no.push(j + 1); }); if (no.length) miss.push("第 " + no.join("、") + " 項符合／不符合");
    if (miss.length) bad.push("第 " + (k + 1) + " 段：還沒填 " + miss.join("、"));
    s.it.forEach(function (v, j) { if (v === "ng") ngs.push("第 " + (k + 1) + " 段（" + (s.name || "—") + "）：" + PID_ITEMS[j].split(/[，(]/)[0] + " 不符合"); });
  });
  if (!used) bad.unshift("還沒有填任何一段");
  return { used: used, bad: bad, ngs: ngs };
}
function pidSend() {
  if (Q.sending) return;
  var r = pidCheck(), m = $("#qc-msg"); m.innerHTML = "";
  if (r.bad.length) { m.appendChild(el("div", { class: "bad", text: "⚠️ 還不能送出：" })); r.bad.slice(0, 8).forEach(function (s) { m.appendChild(el("div", { class: "bad", text: "・" + s })); }); return; }
  var secs = cloneSecs(S.pid);
  secs.forEach(function (s, k) { var c = pidCe(k); if (secUsed(s) && !s.csig) s.csig = { who: c.name + "（" + c.emp + "）", at: "" }; });
  var data = { secs: secs.map(function (s) { var c = JSON.parse(JSON.stringify(s)); c.tsig = noImgSig(s.tsig); c.csig = noImgSig(s.csig); delete c.noteOn; return c; }) };
  if (S.edit) {
    var E = S.edit;
    if (!canEdit(E)) { m.appendChild(el("div", { class: "bad", text: isLocked(mkey(E.at)) ? "🔒 這個月已經鎖住了，只能查閱，不能存修改。" : "⚠️ 你沒有「編輯修改」的權限（開發者在設定裡勾）。" })); return; }
    saveEdit(E, { form: "pid", site: E.site, secs: secs, att: attOf("pid").slice() }, data);
    return;
  }
  submitNew({ form: "pid", site: S.site, secs: secs, sig: null, at: new Date(), att: attOf("pid").slice() }, data);
}
function pidDraft() {
  if (!S.pid.some(secUsed)) { toast("還沒有填任何東西"); return; }
  var b = $("#qc-draft"); if (b) b.disabled = true;
  api("draftput", "pid", JSON.stringify({ site: S.site, secs: cloneSecs(S.pid) })).then(function (x) {
    if (b) b.disabled = false;
    Q.drafts.pid = { at: x.at, site: S.site }; Q.draftLoaded.pid = true;
    render(); toast("💾 暫存好了（" + x.at + "）");
  }, function (e) { if (b) b.disabled = false; toast("暫存沒成功：" + errText(e)); });
}
function pidDraftLoad() {
  api("draftget", "pid").then(function (x) {
    if (x.none) { Q.drafts.pid = null; render(); toast("沒有暫存的"); return; }
    var o = null; try { o = JSON.parse(x.json); } catch (e) { o = null; }
    if (!o || !Array.isArray(o.secs)) { toast("暫存的看不懂"); return; }
    if (SITES[x.site] && x.site !== S.site) { stash(); loadSite(x.site); }
    var secs = pidNew(); o.secs.slice(0, PID_SECS).forEach(function (s, k) { secs[k] = Object.assign(pidBlank(), s); });
    S.pid = secs; Q.draftLoaded.pid = true;
    render(); toast("📂 拿回暫存的（" + x.at + "）");
  }, function (e) { toast("拿不到暫存的：" + errText(e)); });
}
var PID_GEO = (function () {
  var L = 70, R = A4.w - 70, top = 212, secH = 486, g = [];
  for (var k = 0; k < PID_SECS; k++) { var y = top + (k % PID_PER_PAGE) * secH; g.push({ page: Math.floor(k / PID_PER_PAGE), y: y, ts: { x: L + 380, y: y + 2, w: 140, h: 46 }, cs: { x: L + 520, y: y + 52, w: 150, h: 46 } }); }
  return { L: L, R: R, g: g };
})();
function drawPid(rec, prev) {
  var C = SITES[rec.site], F = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif", L = PID_GEO.L, Rr = PID_GEO.R, W = Rr - L;
  var srcs = [];
  rec.secs.forEach(function (s) { srcs.push(s.tsig && s.tsig.img, s.csig && s.csig.img); });
  return Promise.all(srcs.map(loadImg).concat((prev || []).map(loadImg))).then(function (ims) {
    var old = ims.slice(srcs.length), cvs = [];
    for (var pg = 0; pg < Math.ceil(PID_SECS / PID_PER_PAGE); pg++) {
      var cv = document.createElement("canvas"); cv.width = A4.w; cv.height = A4.h;
      var g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, A4.w, A4.h); g.textBaseline = "middle";
      drawLogo(g, C, L, 60, F);
      g.fillStyle = "#111"; g.textAlign = "center"; fitText(g, PID_TITLE, A4.w / 2, 166, A4.w - 140, 40, "900", F);
      cvs.push(cv);
    }
    var sigAt = function (g, im, box, page, s) {
      if (im) { var sc = Math.min(box.w / im.width, box.h / im.height); g.drawImage(im, box.x, box.y, im.width * sc, im.height * sc); }
      else if (s && old[page]) g.drawImage(old[page], box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
    };
    rec.secs.forEach(function (s, k) {
      var G = PID_GEO.g[k], g = cvs[G.page].getContext("2d"), y = G.y, used = secUsed(s);
      g.textBaseline = "middle"; g.fillStyle = "#111"; g.textAlign = "left";
      g.font = "800 25px " + F; g.fillText("查檢對象：", L, y + 26);
      g.strokeStyle = "#111"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L + 128, y + 44); g.lineTo(L + 372, y + 44); g.stroke();
      g.font = "21px " + F; if (used && s.name) g.fillText((s.name + "（" + s.emp + "）").slice(0, 14), L + 132, y + 26);
      sigAt(g, ims[k * 2], G.ts, G.page, s.tsig);
      g.font = "800 25px " + F; g.fillText("藥師", L + 528, y + 26);
      g.fillText("日期：", L + 600, y + 26);
      var p = parse(s.d); g.font = "22px " + F;
      g.fillText(p ? p.y + " 年 " + pad2(p.m) + " 月 " + pad2(p.dd) + " 日" : "＿＿年＿＿月＿＿日", L + 676, y + 26);
      g.font = "800 23px " + F; g.fillText("上午／下午", L + 930, y + 26);
      if (s.ap) { g.strokeStyle = "#B91C1C"; g.lineWidth = 2.5; g.beginPath(); g.ellipse(L + 930 + (s.ap === "上午" ? 24 : 82), y + 26, 34, 19, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = "#111"; }
      g.font = "800 25px " + F; g.fillStyle = "#111"; g.fillText("查檢者：", L + 420, y + 75);
      g.strokeStyle = "#999"; g.lineWidth = 1; g.strokeRect(G.cs.x - 4, G.cs.y - 2, G.cs.w + 8, G.cs.h + 4);
      sigAt(g, ims[k * 2 + 1], G.cs, G.page, s.csig);
      g.font = "16px " + F; g.fillStyle = "#333"; if (s.csig) { g.fillText(s.csig.who, G.cs.x + G.cs.w + 16, y + 64); g.fillText(s.csig.at, G.cs.x + G.cs.w + 16, y + 88); }
      if (s.tsig) { g.font = "14px " + F; g.fillStyle = "#666"; g.fillText("簽：" + s.tsig.at, L, y + 75); }
      var ty = y + 108, c1 = L + W * 0.70, c2 = L + W * 0.85, hh = 72, rh = [70, 35, 35, 35, 35, 35, 35];
      g.strokeStyle = "#111"; g.lineWidth = 3; g.strokeRect(L, ty, W, hh + rh.reduce(function (a, b) { return a + b; }, 0));
      g.lineWidth = 1.5; g.beginPath(); g.moveTo(c1, ty); g.lineTo(c1, ty + hh + rh.reduce(function (a, b) { return a + b; }, 0)); g.stroke();
      g.font = "800 24px " + F; g.textAlign = "center"; g.fillStyle = "#111"; g.fillText("標準作業流程", (L + c1) / 2, ty + hh / 2); g.fillText("評核", (c1 + Rr) / 2, ty + hh / 4);
      g.beginPath(); g.moveTo(c1, ty + hh / 2); g.lineTo(Rr, ty + hh / 2); g.moveTo(c2, ty + hh / 2); g.lineTo(c2, ty + hh); g.stroke();
      g.font = "800 21px " + F; g.fillText("符合", (c1 + c2) / 2, ty + hh * 3 / 4); g.fillText("不符", (c2 + Rr) / 2, ty + hh * 3 / 4);
      g.lineWidth = 3; g.beginPath(); g.moveTo(L, ty + hh); g.lineTo(Rr, ty + hh); g.stroke(); g.lineWidth = 1.5;
      var yy = ty + hh;
      PID_ITEMS.forEach(function (t, j) {
        var h = rh[j];
        g.beginPath(); g.moveTo(c2, yy); g.lineTo(c2, yy + h); g.stroke();
        if (j) { g.beginPath(); g.moveTo(L, yy); g.lineTo(Rr, yy); g.stroke(); }
        g.textAlign = "left"; g.fillStyle = "#111"; g.font = "700 21px " + F;
        var line = "", ly = yy + (j ? h / 2 : 18), lines = 0;
        Array.from(t).forEach(function (ch) { if (g.measureText(line + ch).width > c1 - L - 20) { g.fillText(line, L + 10, ly); line = ch; ly += 26; lines++; } else line += ch; });
        g.fillText(line, L + 10, ly);
        [["ok", c1, c2], ["ng", c2, Rr]].forEach(function (o) {
          if (s.it[j] !== o[0]) return;
          g.font = "900 26px " + F; g.fillStyle = o[0] === "ng" ? "#B91C1C" : "#15803D"; g.textAlign = "center";
          g.fillText("✔", (o[1] + o[2]) / 2, yy + h / 2);
        });
        yy += h;
      });
      g.fillStyle = "#111"; g.textAlign = "left";
      if ((s.note || "").trim()) { g.font = "17px " + F; g.fillStyle = "#8A5A00"; var nt = "備註：" + s.note.trim().replace(/\s+/g, " "); while (g.measureText(nt).width > W && nt.length > 4) nt = nt.slice(0, -2); g.fillText(nt, L, yy + 18); }
    });
    cvs.forEach(function (cv, i) {
      var g = cv.getContext("2d"); g.font = "15px " + F; g.fillStyle = "#666"; g.textAlign = "right"; g.textBaseline = "middle";
      g.fillText("送出：" + fmtAt(rec.at) + "（電子查檢表）　第 " + (i + 1) + "／" + cvs.length + " 頁", Rr, A4.h - 26);
      var ed = rec.edits || []; if (ed.length) { var last = ed[ed.length - 1]; g.fillStyle = "#8A5A00"; g.textAlign = "left"; g.fillText("修改：" + last.who + "　" + fmtAt(last.at) + "（共 " + ed.length + " 次）", L, A4.h - 26); }
    });
    return cvs;
  });
}
function dateTool(td, o) {
  var now = new Date();
  var tdy = el("button", { type: "button", class: "tdy", text: "📆 今日（" + now.getFullYear() + "/" + pad2(now.getMonth() + 1) + "/" + pad2(now.getDate()) + "）" });
  var own = el("button", { type: "button", text: "✍️ 自己填入" });
  var pick = el("button", { type: "button", text: "📅 從年月日選" });
  var same = el("button", { type: "button", text: o.prevLabel || "⬆ 同上（跟上一列一樣）" });
  var clr = el("button", { type: "button", text: "清掉" });
  var p = popAt(td, [el("div", { class: "t", text: o.label }), tdy, own, pick, same, clr]);
  var pv = o.prev();
  if (!pv) { same.disabled = true; same.title = "上面還沒有日期"; same.style.opacity = .45; }
  var fin = function (v) { o.set(v); popClose(); o.redraw(); };
  own.onclick = function () {
    p.innerHTML = "";
    var inp = el("input", { value: o.get(), placeholder: "例：11/04、2026/11/04、115/11/04", "aria-label": "日期", inputmode: TOUCH ? "none" : "numeric", lang: "en", autocomplete: "off" });
    var ok = el("button", { type: "button", class: "pri", text: "好了" });
    p.appendChild(el("div", { class: "t", text: "自己打（數字和「/」；西元、民國、只打月日都可以）" })); p.appendChild(inp); p.appendChild(ok);
    var done = function () { kpClose(); fin(normDate(inp.value)); };
    forceKeys(inp, dateChar, 10, inp.value, function () {});
    inp.oninput = function () { var v = inp.value.replace(/[０-９／]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/[.\-]/g, "/").replace(/[^0-9\/]/g, ""); if (v !== inp.value) inp.value = v; };
    inp.focus();
    if (TOUCH) kpOpen(inp, null, 0, { title: "🔢 " + o.label + "：", letters: false, sym: "/", max: 10, done: done });
    ok.onclick = done; inp.onkeydown = function (e) { if (e.key === "Enter") done(); };
  };
  pick.onclick = function () {
    p.innerHTML = "";
    var cur = parse(o.get()) || { y: now.getFullYear(), m: now.getMonth() + 1, dd: now.getDate() };
    var ys = el("select", { "aria-label": "年" }), ms = el("select", { "aria-label": "月" }), ds = el("select", { "aria-label": "日" });
    for (var y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) ys.appendChild(el("option", { value: String(y), text: y + " 年（民國 " + (y - 1911) + "）" }));
    for (var m = 1; m <= 12; m++) ms.appendChild(el("option", { value: String(m), text: m + " 月" }));
    var fillD = function () { var n = new Date(+ys.value, +ms.value, 0).getDate(), k = Math.min(+ds.value || cur.dd, n); ds.innerHTML = ""; for (var x = 1; x <= n; x++) ds.appendChild(el("option", { value: String(x), text: x + " 日" })); ds.value = String(k); };
    ys.value = String(cur.y); ms.value = String(cur.m); ds.value = ""; fillD(); ds.value = String(cur.dd);
    ys.onchange = fillD; ms.onchange = fillD;
    var ok = el("button", { type: "button", class: "pri", text: "好了" });
    p.appendChild(el("div", { class: "t", text: "選年、月、日" })); p.appendChild(el("div", { class: "row" }, [ys, ms, ds])); p.appendChild(ok);
    ok.onclick = function () { fin(ys.value + "/" + pad2(+ms.value) + "/" + pad2(+ds.value)); };
  };
  tdy.onclick = function () { var v = now.getFullYear() + "/" + pad2(now.getMonth() + 1) + "/" + pad2(now.getDate()); fin(v); toast("今日：" + v); };
  same.onclick = function () { if (same.disabled) return; fin(pv); toast("跟上面一樣：" + pv); };
  clr.onclick = function () { fin(""); };
}
function siteBtns() { Array.prototype.forEach.call(document.querySelectorAll("#qc-site button"), function (x) { x.classList.toggle("on", x.getAttribute("data-s") === S.site); }); }
function logoEl(C) {
  var mark = C.logo ? el("img", { class: "lgimg", src: C.logo, alt: C.name + " 標誌" }) : el("i", { text: "✚" });
  return el("div", { class: "hd" }, [el("div", { class: "logo" + (C.kid ? " kid" : "") + (C.logo ? " hasimg" : "") }, [mark, C.showName === false ? null : el("span", {}, [C.name, C.sub ? el("small", { text: C.sub }) : null])])]);
}
function drawLogo(g, C, L, y, F) {
  var x = L + 70;
  if (C.logo && C.logoIm && C.logoIm.complete && C.logoIm.naturalWidth) {
    var im = C.logoIm, sc = Math.min(64 / im.naturalHeight, 420 / im.naturalWidth);
    g.drawImage(im, L, y - 4, im.naturalWidth * sc, im.naturalHeight * sc); x = L + im.naturalWidth * sc + 14;
  } else { g.fillStyle = C.kid ? "#E53935" : "#C62828"; g.fillRect(L, y, 56, 56); g.fillStyle = "#fff"; g.font = "900 34px " + F; g.textAlign = "center"; g.fillText("✚", L + 28, y + 30); }
  if (C.showName === false) return;
  g.fillStyle = "#111"; g.textAlign = "left"; g.font = "800 30px " + F; g.fillText(C.name, x, y + (C.sub ? 20 : 28)); if (C.sub) { g.font = "600 16px " + F; g.fillStyle = "#666"; g.fillText(C.sub, x, y + 46); }
}
function renderSiteBtns() {
  var B = $("#qc-site"); if (!B) return; B.innerHTML = "";
  SORD.forEach(function (id) {
    var C = SITES[id]; if (!C || C.hide) return;
    var b = el("button", { type: "button", "data-s": id, class: S.site === id ? "on" : "", text: C.name });
    b.disabled = !!S.edit;
    b.onclick = function () { if (S.edit) return; if (id === S.site) return; stash(); loadSite(id); $("#qc-msg").innerHTML = ""; render(); };
    B.appendChild(b);
  });
}
function applyS() {
  if (SITES[S.site] && SITES[S.site].hide && !S.edit) { var v = SORD.filter(function (id) { return !SITES[id].hide; })[0]; if (v) { stash(); loadSite(v); } }
  renderSiteBtns(); render();
}
function setForm(f) {
  if (S.edit) { toast("修改中：先存修改或取消修改"); return; }
  S.form = f; $("#qc-msg").innerHTML = "";
  Array.prototype.forEach.call(document.querySelectorAll("#qc-form button"), function (x) { x.classList.toggle("on", x.getAttribute("data-f") === f); });
  $("#qc-paper").classList.toggle("pidp", f === "pid");
  $("#qc-draft").hidden = f !== "pid";
  render();
}
function pagesOf(r) { return r.pngs || (r.png ? [r.png] : []); }
function recWho(r) {
  if (r.form !== "pid") return r.sig ? r.sig.who : "—";
  var a = []; (r.secs || []).forEach(function (s) { if (s.csig && a.indexOf(s.csig.who) < 0) a.push(s.csig.who); }); return a.join("、") || "—";
}
function recNgs(r) {
  if (r.form === "pid") { var o = []; (r.secs || []).forEach(function (s, k) { (s.it || []).forEach(function (v, j) { if (v === "ng") o.push("第 " + (k + 1) + " 段（" + (s.name || "—") + "）：" + PID_ITEMS[j].split(/[，(]/)[0] + " 不符合"); }); }); return o; }
  return (r.rows || []).map(function (d, i) { return d.a === "ng" || d.b === "ng" ? "第 " + (i + 1) + " 列（" + (d.no || "—") + "）：" + [d.a === "ng" ? "列印品質：" + (d.am || "—") : "", d.b === "ng" ? "調劑品質：" + (d.bm || "—") : ""].filter(Boolean).join("；") : ""; }).filter(Boolean);
}
function applyCfg(c) {
  Q.cfg = c;
  var old = SITES; SITES = {}; SORD = [];
  (c.sites || []).forEach(function (s, i) {
    var o = old[s.id] || {};
    SITES[s.id] = { id: s.id, name: s.name, sub: s.sub || "", kid: i > 0, secs: 3, rows: 8, showName: s.showName !== false, hide: !!s.hide, hasLogo: !!s.logo, lv: s.lv || 0, logo: s.logo && o.lv === (s.lv || 0) ? o.logo : null, logoIm: s.logo && o.lv === (s.lv || 0) ? o.logoIm : null };
    SORD.push(s.id);
    if (s.logo && !SITES[s.id].logo) logoGet(s.id);
  });
  if (!SITES[S.site] || SITES[S.site].hide) { var v = SORD.filter(function (id) { return !SITES[id].hide; })[0] || SORD[0]; S.site = v; }
  FCFG = (c.forms || []).map(function (f) { return { id: f.id, name: f.name, icon: f.icon || "", hide: !!f.hide, title: f.title }; });
  FCFG.forEach(function (f) { FORMS[f.id] = f.name; });
  TITLE = fc("bag").title; PID_TITLE = fc("pid").title;
  if (fc(S.form).hide && !S.edit) { var w = FCFG.filter(function (f) { return !f.hide; })[0]; if (w) S.form = w.id; }
}
function logoGet(id) {
  var C = SITES[id]; if (!C || C.logoBusy) return; C.logoBusy = true;
  api("logo", id).then(function (x) {
    var u = "data:" + x.mime + ";base64," + x.b64, im = new Image();
    im.onload = function () { var D = SITES[id]; if (!D) return; D.logo = u; D.logoIm = im; D.logoBusy = false; if (Q.root && Q.root.isConnected) { render(); if (Q.tab === "set") renderSet(); } };
    im.onerror = function () { C.logoBusy = false; };
    im.src = u;
  }, function () { C.logoBusy = false; });
}
function cfgOut() {
  return { sites: SORD.map(function (id) { var C = SITES[id]; return { id: id, name: C.name, sub: C.sub, showName: C.showName !== false, hide: !!C.hide }; }), forms: FCFG, editors: Q.cfg.editors || [], autoDay: Q.cfg.autoDay || 0 };
}
function cfgSave(msg) {
  return api("cfgset", JSON.stringify(cfgOut())).then(function (x) { applyCfg(x.cfg); renderFormBtns(); applyS(); if (Q.tab === "set") renderSet(); if (msg) toast(msg); }, function (e) { toast("沒存好：" + errText(e)); boot(true); });
}
function applyF() { cfgSave(); }

var SEL = null, FF = "", MSUM = "";
function fOK(r) { return !FF || (r.form || "bag") === FF; }
function startEdit(r) {
  if (!canEdit(r)) { toast(isLocked(mkey(r.at)) ? "🔒 這個月鎖住了，只能查閱" : "你沒有「編輯修改」的權限"); return; }
  stash();
  S.att = { bag: [], pid: [] };
  S.edit = r; S.site = r.site; S.form = r.form || "bag";
  Array.prototype.forEach.call(document.querySelectorAll("#qc-form button"), function (x) { x.classList.toggle("on", x.getAttribute("data-f") === S.form); });
  if (S.form === "pid") S.pid = cloneSecs(r.secs).map(function (s) { var o = Object.assign(pidBlank(), s); o.ce = ceOf(s.csig); return o; });
  else { S.sig = r.sig; S.ce = ceOf(r.sig); S.rows = {}; (r.rows || []).forEach(function (d, i) { S.rows[i] = JSON.parse(JSON.stringify(d)); }); }
  siteBtns();
  $("#qc-msg").innerHTML = ""; qgo("fill"); render(); try { Q.root.scrollIntoView(); } catch (e) {  }
  fetchPdf(r).then(function () {  }, function () {  });
}
function stopEdit() { S.edit = null; loadSite(S.site); $("#qc-msg").innerHTML = ""; render(); }
function showHist(r) {
  api("hist", r.id).then(function (x) {
    var bx = el("div", { class: "modal", role: "dialog", "aria-modal": "true" }), dl = el("div", { class: "dlg" });
    dl.appendChild(el("h3", { text: "🕘 舊版：" + fmtAt(r.at) + "　" + (SITES[r.site] || { name: "" }).name }));
    (x.list || []).slice().reverse().forEach(function (h) {
      var n = h.i + 1, b = el("button", { type: "button", class: "btn", style: "padding:5px 12px", text: "📄 看" });
      b.onclick = function () { toast("PDF 拿取中…"); fetchPdf(r, h.i).then(function (o) { showPdf(o, "舊版 " + n); }, function (e) { toast("打不開：" + errText(e)); }); };
      dl.appendChild(el("div", { class: "ritem", style: "margin-bottom:6px" }, [el("div", { class: "t" }, [el("b", { text: "第 " + n + " 版（" + (n === 1 ? "原本送出的" : "修改後") + "）" }), el("small", { text: "用到 " + fmtAt(new Date(h.at)) + "（" + h.who + " 改了）　填了 " + h.used + (r.form === "pid" ? " 段、不符合 " + h.ng + " 項" : " 列、不符 " + h.ng + " 列") })]), b]));
    });
    var xx = el("button", { type: "button", class: "btn", text: "關閉" }); xx.onclick = function () { bx.remove(); };
    dl.appendChild(el("div", { class: "dlgb" }, [xx])); bx.appendChild(dl); bx.onclick = function (e) { if (e.target === bx) bx.remove(); };
    ovl().appendChild(bx);
  }, function (e) { toast("拿不到舊版：" + errText(e)); });
}
function lockSet(key, L, msg) { api("lock", key, JSON.stringify(L)).then(function (x) { applyCfg(x.cfg); renderArch(); toast(msg); }, function (e) { toast("沒存好：" + errText(e)); }); }
function lockPanel(y, m) {
  var key = y + "-" + m, L = (Q.cfg.lock || {})[key] || { st: "", at: "" }, lk = isLocked(key), t = lockAt(key);
  var p = el("div", { class: "lockp" });
  p.appendChild(el("b", { text: lk ? "🔒 " + m + " 月鎖住了（大家只能查閱）" : "🔓 " + m + " 月可以修改（有勾的人）" }));
  var b1 = el("button", { type: "button", class: "btn lkon", style: "padding:5px 12px", text: "🔒 現在鎖住" }); b1.onclick = function () { lockSet(key, { st: "lock", at: L.at || "" }, "🔒 " + m + " 月鎖住了"); };
  var b2 = el("button", { type: "button", class: "btn lkoff", style: "padding:5px 12px", text: "🔓 打開（可以再改）" }); b2.onclick = function () { lockSet(key, { st: "open", at: L.at || "" }, "🔓 " + m + " 月打開了"); };
  p.appendChild(lk ? b2 : b1);
  var inp = el("input", { type: "datetime-local", value: L.at || "", "aria-label": "自動鎖住的時間" });
  var b3 = el("button", { type: "button", class: "btn lkat", style: "padding:5px 12px", text: "⏰ 設定" }); b3.onclick = function () { lockSet(key, { st: "", at: inp.value }, inp.value ? "⏰ " + inp.value.replace("T", " ") + " 自動鎖住" : "不自動鎖住"); };
  p.appendChild(el("span", { text: "自動鎖住時間：" })); p.appendChild(inp); p.appendChild(b3);
  p.appendChild(el("span", { class: "note", style: "width:100%", text: L.st === "lock" ? "（開發者按了鎖住）" : L.st === "open" ? "（開發者按了打開：時間到也不會自動鎖）" : t ? "（" + fmtAt(t) + " 自動鎖住" + (L.at ? "" : "：照設定裡的「每個月自動鎖住」") + "）" : "（沒有設定時間：開發者自己按鎖住）" }));
  return p;
}
function listLoad(force) {
  if (Q.listBusy || (Q.list && !force)) return;
  Q.listBusy = true;
  api("list").then(function (x) { Q.listBusy = false; Q.list = (x.recs || []).map(mkRec); if (Q.tab === "arch") renderArch(); }, function (e) { Q.listBusy = false; Q.err = errText(e); if (Q.tab === "arch") renderArch(); });
}
function renderArch() {
  var A = $("#qc-arch"); if (!A) return; A.innerHTML = "";
  A.appendChild(el("h2", {}, ["📁 查閱：送出的查檢表（PDF）", el("button", { type: "button", class: "btn rld", style: "margin-left:10px;padding:4px 10px;font-size:13px", onclick: function () { Q.err = ""; Q.list = null; renderArch(); } }, ["🔄 重新整理"])]));
  A.appendChild(el("div", { class: "note", text: "按年、按月排；月份下面紅字＝那個月有「不符」，🔒＝鎖住了（只能查閱）。點一個月份＝列出那個月的每一份。你現在是：" + me() + (isDev() ? "（開發者）" : mayEdit() ? "（可以修改）" : "（只能查閱）") + "。" }));
  if (!Q.list) { A.appendChild(el("p", { class: "note", text: Q.err ? "⚠️ " + Q.err : "⏳ 讀取中…" })); listLoad(); return; }
  var ARCH = Q.list;
  var fcs = el("div", { class: "fchips", role: "group", "aria-label": "表單" }, [["", "全部"]].concat(FCFG.map(function (c) { return [c.id, fLabel(c.id)]; })).map(function (o) { var b = el("button", { type: "button", "data-ff": o[0], class: FF === o[0] ? "on" : "", text: o[1] }); b.onclick = function () { FF = o[0]; renderArch(); }; return b; }));
  A.appendChild(fcs);
  var by = {};
  ARCH.filter(fOK).forEach(function (r) { var y = r.at.getFullYear(), m = r.at.getMonth() + 1; ((by[y] = by[y] || {})[m] = by[y][m] || []).push(r); });
  Object.keys(by).sort(function (a, b) { return b - a; }).forEach(function (y) {
    var nY = yearRecs(y).filter(fOK).length;
    var yp = el("button", { type: "button", class: "btn ypdf", text: "⬇ 整年 PDF（" + nY + " 份）" }); yp.onclick = function () { yearPdf(y, FF); };
    var yx = el("button", { type: "button", class: "btn yxls", text: "⬇ 整年 Excel 統計表" }); yx.onclick = function () { yearXlsx(y); };
    A.appendChild(el("div", { class: "yr" }, [y + " 年（民國 " + (y - 1911) + " 年）", el("span", { class: "ydl" }, [yp, yx])]));
    var gd = el("div", { class: "mgrid" });
    for (var m = 1; m <= 12; m++) {
      var list = by[y][m] || [], ngR = list.reduce(function (s, r) { return s + r.ng; }, 0), ngF = list.filter(function (r) { return r.ng; }).length, lk = list.length && isLocked(y + "-" + m);
      var b = el("button", { type: "button", class: "mb" + (SEL === y + "-" + m ? " on" : ""), "aria-label": m + " 月：" + list.length + " 份" + (ngR ? "，不符 " + ngR + " 筆" : "") + (lk ? "，鎖住了" : "") }, [el("b", { text: m + " 月" + (lk ? " 🔒" : "") }), el("small", { text: list.length ? list.length + " 份" : "—" }), ngR ? el("span", { class: "ng", text: "⚠ 不符 " + ngR + " 筆（" + ngF + " 份）" }) : null]);
      if (!list.length) b.disabled = true;
      b.onclick = (function (key) { return function () { SEL = key; renderArch(); }; })(y + "-" + m);
      gd.appendChild(b);
    }
    A.appendChild(gd);
    if (SEL && SEL.indexOf(y + "-") === 0) {
      var mm = +SEL.split("-")[1], items = (by[y][mm] || []).slice().sort(function (a, b) { return b.at - a.at; }), rl = el("div", { class: "rlist" }), mlk = isLocked(y + "-" + mm);
      items.forEach(function (r) {
        var ngs = recNgs(r);
        var v = el("button", { type: "button", class: "btn", text: "📄 看 PDF" }); v.onclick = function () { showPdf(r); };
        var pv1 = el("button", { type: "button", class: "btn rprint", text: "🖨 列印" }); pv1.onclick = function () { printRecs([r]); };
        var act = [v, pv1];
        if (canEdit(r)) { var e1 = el("button", { type: "button", class: "btn redit", text: "✏️ 修改" }); e1.onclick = function () { startEdit(r); }; act.push(e1); }
        else act.push(el("span", { class: "ro", text: mlk ? "🔒 鎖住了：只能查閱" : "只能查閱（沒有修改權限）" }));
        if (isDev() && r.hn) { var hb = el("button", { type: "button", class: "btn rhist", text: "🕘 舊版（" + r.hn + "）" }); hb.onclick = function () { showHist(r); }; act.push(hb); }
        var eds = r.edits || [], last = eds[eds.length - 1];
        rl.appendChild(el("div", { class: "ritem" }, [el("div", { class: "t" }, [el("b", {}, [fmtAt(r.at) + "　" + (SITES[r.site] || { name: "（院區）" }).name, el("span", { class: "ftag" + (r.form === "pid" ? " pid" : ""), text: fLabel(r.form || "bag") })]), el("small", { text: "查檢者：" + recWho(r) + "　填了 " + r.used + (r.form === "pid" ? " 段" : " 列") })])].concat(act, [eds.length ? el("div", { class: "ed", text: "✏️ 改過 " + eds.length + " 次（最後：" + last.who + "　" + fmtAt(last.at) + "）" }) : null, ngs.length ? el("div", { class: "ngt", text: "⚠ " + ngs.join("　") }) : null])));
      });
      var pAll = el("button", { type: "button", class: "btn mprint", style: "margin-left:10px;padding:5px 12px;font-size:14px", text: "🖨 這個月全部列印（" + items.length + " 份）" }); pAll.onclick = (function (it) { return function () { printRecs(it); }; })(items);
      var sumK = y + "-" + mm, sumB = el("button", { type: "button", class: "btn msumbtn" + (MSUM === sumK ? " on" : ""), style: "margin-left:10px;padding:5px 12px;font-size:14px", text: MSUM === sumK ? "📊 收起彙整" : "📊 這個月彙整" });
      sumB.onclick = (function (k) { return function () { MSUM = MSUM === k ? "" : k; renderArch(); if (MSUM) { var bx = $("#qc-msum"); if (bx) try { bx.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {  } } }; })(sumK);
      A.appendChild(el("div", { class: "yr", style: "font-size:15px" }, [y + " 年 " + mm + " 月：" + items.length + " 份", pAll, sumB]));
      if (MSUM === sumK) A.appendChild(msumView(+y, mm));
      if (isDev()) A.appendChild(lockPanel(y, mm));
      else if (!mlk && mayEdit() && lockAt(y + "-" + mm)) A.appendChild(el("div", { class: "note", text: "⏰ " + fmtAt(lockAt(y + "-" + mm)) + " 以後鎖住（只能查閱）" }));
      A.appendChild(rl);
    }
  });
  if (!ARCH.length) A.appendChild(el("p", { class: "note", text: "還沒有送出的查檢表。" }));
}
function renderSet() {
  var A = $("#qc-set"); if (!A) return; A.innerHTML = "";
  A.appendChild(el("h2", { text: "⚙ 設定（開發者）" }));
  if (typeof window.PH_SET === "function") try { window.PH_SET(A, { el: el, toast: toast }); } catch (e) {  }
  if (!window.PH_SET) {
  A.appendChild(el("h3", { text: "☁ 存放位置：雲端硬碟裡的新資料夾「" + (Q.folder || "查核和查檢") + "」" }));
  var dv = el("div", { class: "drvbox" });
  dv.appendChild(el("div", { class: "okm", text: "✅ 已經建立了。資料夾、試算表的 ID 加密存在指令碼屬性（QC_FOLDER_ID、QC_SHEET_ID），畫面、程式都不會寫出來。" }));
  dv.appendChild(el("pre", { class: "tree", text: "📁 " + (Q.folder || "查核和查檢") + "\n├─ 📊 查核和查檢紀錄_（亂碼）（全新的試算表）\n│   ├─ 送出紀錄（每一份：時間、表單、院區代號、誰送的、不符幾筆）\n│   ├─ 藥袋明細、病人辨識明細（每一列／每一段）\n│   ├─ 修改紀錄（誰、什麼時候）\n│   ├─ 設定（院區、表單按鍵、可以修改的人、鎖住；整串加密）\n│   └─ 暫存（還沒送出的；送出就刪）\n├─ 📁 PDF → 📁 年 → 📁 月 → qc-（亂碼）.pdf\n├─ 📁 舊版（修改前的 PDF）\n├─ 📁 院名標誌（檔名亂碼）\n└─ 📁 暫存" }));
  dv.appendChild(el("div", { class: "note", text: "「⬇ 整年 Excel」每次按都是當下重新做一個全新的 Excel 檔（不會改到雲端的試算表）。院區在試算表上只寫代號，院名只在加密的設定裡。" }));
  A.appendChild(dv);
  }
  A.appendChild(el("h3", { text: "🏥 院區（填表最上面的院區按鍵、表單和 PDF 上的院名、標誌）" }));
  A.appendChild(el("div", { class: "note", text: "可以改：院名、英文小字、標誌（上傳圖片，放雲端「院名標誌」資料夾，檔名亂碼）、標誌已經有院名就不要另外寫院名、順序（↑↓）、隱藏（以前送出的照樣查得到）。至少要留一個院區。新的 PDF 跟著；已經送出的 PDF 不會變。" }));
  var sl = el("div", { class: "flist slist" });
  SORD.forEach(function (id, i) {
    var C = SITES[id];
    var up = el("button", { type: "button", class: "btn sup", text: "↑", "aria-label": "往前" }), dn = el("button", { type: "button", class: "btn sdn", text: "↓", "aria-label": "往後" });
    up.disabled = i === 0; dn.disabled = i === SORD.length - 1;
    up.onclick = function () { SORD.splice(i - 1, 0, SORD.splice(i, 1)[0]); cfgSave("順序換好了"); };
    dn.onclick = function () { SORD.splice(i + 1, 0, SORD.splice(i, 1)[0]); cfgSave("順序換好了"); };
    var nm = el("input", { class: "sname", value: C.name, maxlength: "20", "aria-label": "院名" });
    var sb = el("input", { class: "ssub", value: C.sub, maxlength: "40", "aria-label": "英文小字", placeholder: "（可以空白）" });
    var sh = el("input", { type: "checkbox", class: "sshow" }); sh.checked = !C.hide;
    var sn = el("input", { type: "checkbox", class: "sshowname" }); sn.checked = C.showName !== false;
    var fi = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", class: "slogo", "aria-label": "上傳標誌" });
    var rmL = el("button", { type: "button", class: "btn srmlogo", text: "拿掉標誌" }); rmL.disabled = !C.hasLogo;
    var rs = el("button", { type: "button", class: "btn sreset", text: "還原預設" });
    nm.onchange = function () { var v = nm.value.trim(); if (!v) { nm.value = C.name; toast("院名不能空白"); return; } C.name = v; cfgSave("院名存好了"); };
    sb.onchange = function () { C.sub = sb.value.trim(); cfgSave("英文小字存好了"); };
    sh.onchange = function () { if (!sh.checked && SORD.filter(function (x) { return !SITES[x].hide; }).length <= 1) { sh.checked = true; toast("至少要留一個院區"); return; } C.hide = !sh.checked; cfgSave(C.name + (C.hide ? "：藏起來了" : "：顯示")); };
    sn.onchange = function () { C.showName = sn.checked; cfgSave(); };
    var logoFile = function (file) {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast("圖片太大（最多 2 MB）"); return; }
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image();
        im.onload = function () { toast("標誌上傳中…"); api("logoput", id, String(rd.result)).then(function (x) { SITES[id].lv = -1; applyCfg(x.cfg); SITES[id].logo = rd.result; SITES[id].logoIm = im; render(); renderSet(); toast("標誌換好了（雲端「院名標誌」資料夾，檔名亂碼）"); }, function (e) { toast("沒上傳好：" + errText(e)); }); };
        im.onerror = function () { toast("這個檔案不是圖片"); };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    };
    fi.onchange = function () { logoFile(fi.files && fi.files[0]); };
    var pz = pasteBox("📋 在這裡貼上圖片（Ctrl+V；手機長按→貼上）", function (f) { logoFile(f); });
    pz.classList.add("lgpaste");
    rmL.onclick = function () { api("logodel", id).then(function (x) { applyCfg(x.cfg); SITES[id].logo = null; SITES[id].logoIm = null; C.showName = true; cfgSave("標誌拿掉了（用預設的）"); }, function (e) { toast("沒拿掉：" + errText(e)); }); };
    rs.onclick = function () { var d = { a: "院區甲", b: "院區乙" }; C.name = d[id] || "院區"; C.sub = ""; C.showName = true; C.hide = false; (C.hasLogo ? api("logodel", id).then(function (x) { applyCfg(x.cfg); }) : Promise.resolve()).then(function () { cfgSave("還原成預設"); }); };
    sl.appendChild(el("div", { class: "frow", "data-sid": id }, [
      el("div", { class: "fhd" }, [up, dn, el("div", { class: "sprev" }, [logoEl(C)]), el("label", { class: "fsh" }, [sh, "顯示"]), rs]),
      el("label", { class: "ff grow" }, [el("span", { text: "院名" }), nm]),
      el("label", { class: "ff grow" }, [el("span", { text: "英文小字" }), sb]),
      el("div", { class: "ff full" }, [el("span", { text: "標誌（院徽、院名圖）" }), el("div", { class: "lgrow" }, [fi, pz, rmL, el("label", { class: "fsh" }, [sn, "旁邊寫院名（標誌已經有院名就拿掉勾）"])])])]));
  });
  A.appendChild(sl);
  A.appendChild(el("h3", { text: "📋 表單按鍵（填表最上面的按鍵）" }));
  A.appendChild(el("div", { class: "note", text: "可以改：按鍵名稱、圖示（空白＝不要圖示）、順序（↑↓）、隱藏（暫時不用；以前送出的照樣查得到）、表單上的大標題（新的 PDF 跟著；已經送出的 PDF 不會變）。至少要留一個表單。" }));
  var fl = el("div", { class: "flist" });
  FCFG.forEach(function (c, i) {
    var up = el("button", { type: "button", class: "btn fup", text: "↑", "aria-label": "往前" }), dn = el("button", { type: "button", class: "btn fdn", text: "↓", "aria-label": "往後" });
    up.disabled = i === 0; dn.disabled = i === FCFG.length - 1;
    up.onclick = function () { FCFG.splice(i - 1, 0, FCFG.splice(i, 1)[0]); cfgSave("順序換好了"); };
    dn.onclick = function () { FCFG.splice(i + 1, 0, FCFG.splice(i, 1)[0]); cfgSave("順序換好了"); };
    var ic = el("input", { class: "ficon", value: c.icon, maxlength: "4", "aria-label": "圖示", placeholder: "無" });
    var nm = el("input", { class: "fname", value: c.name, maxlength: "20", "aria-label": "按鍵名稱" });
    var tt = el("input", { class: "ftitle", value: c.title, maxlength: "40", "aria-label": "表單上的大標題" });
    var sh = el("input", { type: "checkbox", class: "fshow" }); sh.checked = !c.hide;
    var rs = el("button", { type: "button", class: "btn freset", text: "還原預設" });
    ic.onchange = function () { c.icon = ic.value.trim(); cfgSave("圖示存好了"); };
    nm.onchange = function () { var v = nm.value.trim(); if (!v) { nm.value = c.name; toast("名稱不能空白"); return; } c.name = v; cfgSave("名稱存好了"); };
    tt.onchange = function () { var v = tt.value.trim(); if (!v) { tt.value = c.title; toast("大標題不能空白"); return; } c.title = v; cfgSave("大標題存好了（新的 PDF 跟著）"); };
    sh.onchange = function () { if (!sh.checked && FCFG.filter(function (x) { return !x.hide; }).length <= 1) { sh.checked = true; toast("至少要留一個表單"); return; } c.hide = !sh.checked; cfgSave(c.name + (c.hide ? "：藏起來了" : "：顯示")); };
    rs.onclick = function () { var d = FDEF[c.id]; c.name = d.name; c.icon = d.icon; c.title = d.title; c.hide = false; cfgSave("還原成預設"); };
    fl.appendChild(el("div", { class: "frow", "data-id": c.id }, [
      el("div", { class: "fhd" }, [up, dn, el("b", { class: "fprev", text: fLabel(c.id) }), el("label", { class: "fsh" }, [sh, "顯示"]), rs]),
      el("label", { class: "ff" }, [el("span", { text: "圖示" }), ic]),
      el("label", { class: "ff grow" }, [el("span", { text: "按鍵名稱" }), nm]),
      el("label", { class: "ff full" }, [el("span", { text: "表單上的大標題（PDF 也跟著）" }), tt])]));
  });
  A.appendChild(fl);
  A.appendChild(el("h3", { text: "可以「編輯修改」送出的查檢表的人" }));
  A.appendChild(el("div", { class: "note", text: "勾了＝在「📁 查閱」可以按 ✏️ 修改（還沒鎖住的月份）；沒勾＝只能查閱。" + (window.PH_SET ? "主管名單上的人都能填新的。名單＝主管名單＋開發者。" : "核可過的藥師都能填新的。名單＝手冊的核可名單。") }));
  var pl = el("div", { class: "plist" });
  if (!Q.people) { pl.appendChild(el("span", { class: "note", text: "⏳ 名單讀取中…" })); api("people").then(function (x) { Q.people = x.people || []; if (Q.tab === "set") renderSet(); }, function (e) { Q.people = []; toast("名單讀不到：" + errText(e)); }); }
  else (Q.people.length ? Q.people : []).forEach(function (p) {
    var ed = Q.cfg.editors || [], c = el("input", { type: "checkbox", "data-uid": p.uid, "data-emp": p.emp }); c.checked = !!p.dev || ed.indexOf(p.uid) >= 0; c.disabled = !!p.dev;
    c.onchange = function () { var a = (Q.cfg.editors || []).slice(), i = a.indexOf(p.uid); if (c.checked && i < 0) a.push(p.uid); if (!c.checked && i >= 0) a.splice(i, 1); Q.cfg.editors = a; cfgSave((p.name || p.emp) + (c.checked ? "：可以修改" : "：只能查閱")); };
    pl.appendChild(el("label", { class: p.dev ? "dev" : "" }, [c, (p.name || "（沒有名字）") + (p.emp ? "（" + p.emp + "）" : "") + (p.dev ? "　開發者（一定可以）" : "")]));
  });
  if (Q.people && !Q.people.length) pl.appendChild(el("span", { class: "note", text: window.PH_SET ? "主管名單上還沒有人（上面「👥 主管名單」先加）。" : "核可名單上還沒有人。" }));
  A.appendChild(pl);
  A.appendChild(el("h3", { text: "每個月自動鎖住（過了時間＝只能查閱）" }));
  var sel = el("select", { id: "qc-autoday", "aria-label": "每個月自動鎖住" });
  [[0, "不自動：開發者自己按「🔒 鎖住」"], [1, "下個月 1 號 00:00 鎖住"], [3, "下個月 3 號 00:00 鎖住"], [5, "下個月 5 號 00:00 鎖住"], [10, "下個月 10 號 00:00 鎖住"]].forEach(function (o) { sel.appendChild(el("option", { value: String(o[0]), text: o[1] })); });
  sel.value = String(Q.cfg.autoDay || 0); sel.onchange = function () { Q.cfg.autoDay = +sel.value; cfgSave("存好了"); };
  A.appendChild(sel);
  A.appendChild(el("div", { class: "note", style: "margin-top:8px", text: "個別月份：到「📁 查閱」點那個月 → 下面黃色框「🔒 現在鎖住／🔓 打開／⏰ 自動鎖住時間」（個別月份的設定比這裡優先）。" }));
}
function qgo(v) {
  if (v === "set" && !isDev()) v = "fill";
  Q.tab = v;
  Array.prototype.forEach.call(document.querySelectorAll("#qc-tabs button"), function (x) { x.classList.toggle("on", x.getAttribute("data-v") === v); });
  $("#qc-vfill").hidden = v !== "fill"; $("#qc-varch").hidden = v !== "arch"; $("#qc-vset").hidden = v !== "set";
  $("#qc-site").style.visibility = v === "fill" ? "" : "hidden"; $("#qc-form").style.display = v === "fill" ? "" : "none";
  if (v === "arch") renderArch(); if (v === "set") renderSet();
}

function skeleton() {
  var tabs = el("span", { class: "tabs", id: "qc-tabs" }, [["fill", "📝 填表"], ["arch", "📁 查閱", "（PDF）"], ["set", "⚙ 設定", "（開發者）"]].map(function (t) { var b = el("button", { type: "button", "data-v": t[0], class: t[0] === "fill" ? "on" : "" }, [t[1]].concat(t[2] ? [el("span", { class: "tsub", text: t[2] })] : []));    b.onclick = function () { qgo(t[0]); }; return b; }));
  var root = el("div", { class: "qcz qcroot" }, [
    el("div", { class: "qtop" }, [tabs, el("span", { class: "seg", id: "qc-form" }), el("span", { class: "seg", id: "qc-site" })]),
    el("div", { class: "wrap", id: "qc-vfill" }, [el("div", { class: "paper", id: "qc-paper" }),
      el("div", { class: "bar" }, [el("button", { type: "button", class: "btn", id: "qc-clear", text: "全部清掉" }), el("button", { type: "button", class: "btn", id: "qc-draft", hidden: "hidden", text: "💾 暫存（晚一點再填）" }), el("button", { type: "button", class: "btn pri", id: "qc-send", text: "✅ 送出（變成 PDF 保留）" })]),
      el("div", { class: "msg", id: "qc-msg", role: "status" })]),
    el("div", { class: "wrap", id: "qc-varch", hidden: "hidden" }, [el("div", { class: "paper arch", id: "qc-arch" })]),
    el("div", { class: "wrap", id: "qc-vset", hidden: "hidden" }, [el("div", { class: "paper set", id: "qc-set" })])
  ]);
  return root;
}
function wire() {
  $("#qc-send").onclick = function () { doSend(); };
  $("#qc-draft").onclick = function () { pidDraft(); };
  $("#qc-clear").onclick = function () {
    if (S.edit) { stopEdit(); toast("不改了（原本那一份沒變）"); return; }
    if (S.form === "pid") { S.pid = pidNew(); attOf("pid").length = 0; Q.draftLoaded.pid = false; $("#qc-msg").innerHTML = ""; render(); if (Q.drafts.pid) toast("清掉了（暫存的還在：可以按「📂 拿回暫存的」）"); return; }
    S.rows = {}; S.sig = null; S.ce = { emp: "", name: "" }; attOf("bag").length = 0; $("#qc-msg").innerHTML = ""; render();
  };
  $("#qc-tabs [data-v=set]").hidden = !isDev();
}
function setupView(box) {
  box.innerHTML = "";
  box.appendChild(el("h2", { text: "🔍 查核和查檢" }));
  if (!isDev()) { box.appendChild(el("p", { class: "note", text: "開發者還沒開好「查核和查檢」（要先在雲端硬碟建立資料夾）。請開發者到這裡按「建立」。" })); return; }
  box.appendChild(el("div", { class: "note", text: "第一次用：按下去＝在你的雲端硬碟建立一個新的資料夾「查核和查檢」，裡面放一個全新的試算表（不跟藥戰手冊、補藥神器共用）＋ PDF、舊版、院名標誌、暫存四個資料夾。資料夾、試算表的 ID 自動加密存在指令碼屬性，畫面和程式都不會寫出來。" }));
  var mk = el("button", { type: "button", class: "btn pri mkdrv", text: "📁 建立新的資料夾「查核和查檢」＋全新試算表" });
  mk.onclick = function () { mk.disabled = true; mk.textContent = "⏳ 建立中…"; api("setup").then(function () { toast("建立好了"); boot(true); }, function (e) { mk.disabled = false; mk.textContent = "📁 再試一次"; toast("沒建好：" + errText(e)); }); };
  box.appendChild(mk);
}
function boot(force) {
  if (Q.busy || (Q.boot && !force)) return;
  Q.busy = true; Q.err = "";
  var P = $("#qc-paper"); if (P && !Q.boot) P.textContent = "⏳ 讀取中…";
  api("boot").then(function (x) {
    Q.busy = false; Q.boot = true; Q.dev = !!x.dev; Q.me = x.me || Q.me;
    if (x.none) { Q.none = true; $("#qc-tabs").style.display = "none"; $("#qc-form").style.display = "none"; $("#qc-site").style.display = "none"; $("#qc-vfill .bar").style.display = "none"; setupView($("#qc-paper")); return; }
    Q.none = false; Q.may = !!x.may; Q.drafts = x.drafts || {}; Q.folder = x.folder;
    $("#qc-tabs").style.display = ""; $("#qc-site").style.display = ""; $("#qc-vfill .bar").style.display = "";
    applyCfg(x.cfg); wire(); renderFormBtns(); renderSiteBtns(); qgo(Q.tab || "fill"); render();
  }, function (e) {
    Q.busy = false; Q.err = errText(e);
    var P2 = $("#qc-paper"); if (P2) { P2.innerHTML = ""; P2.appendChild(el("p", { class: "bad", text: "⚠️ " + Q.err })); P2.appendChild(el("button", { type: "button", class: "btn", text: "🔄 再試一次", onclick: function () { boot(true); } })); }
  });
}
function draw(col) {
  injectCss();
  if (!Q.root) { Q.root = skeleton(); }
  col.appendChild(Q.root);
  if (!Q.boot) boot();
}
function reset() {
  if (Q.root) try { Q.root.remove(); } catch (e) {  }
  if (Q.ov) try { Q.ov.remove(); } catch (e) {  }
  var pp = document.getElementById("qc-printpage"); if (pp) pp.remove();
  Q = { boot: false, busy: false, none: false, dev: false, may: false, me: { name: "", emp: "" }, cfg: null, drafts: {}, list: null, listBusy: false, people: null, root: null, ov: null, tab: "fill", err: "", draftLoaded: {}, sending: false, whoC: {} };
  S = { site: "a", sig: null, rows: {}, edit: null, form: "bag", pid: pidNew(), ce: { emp: "", name: "" } }; STORE = {}; SITES = {}; SORD = []; POP = null; KP = null;
}
function injectCss() {
  if (document.getElementById("qc-css")) return;
  var st = document.createElement("style"); st.id = "qc-css"; st.textContent = QC_CSS; document.head.appendChild(st);
}
function empKeys(inp, o) {
  o = o || {};
  injectCss();
  var max = o.max || 20;
  inp.setAttribute("inputmode", TOUCH ? "none" : "text"); inp.setAttribute("autocapitalize", "characters"); inp.setAttribute("autocorrect", "off"); inp.setAttribute("lang", "en"); inp.setAttribute("spellcheck", "false");
  var en = forceKeys(inp, codeChar, max, inp.value || "", function (v) { if (o.onSet) o.onSet(v); });
  inp.addEventListener("input", function () {
    if (en.comp()) return;
    var v = inp.value.replace(/[！-～]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).toUpperCase().replace(/[^A-Z0-9\-]/g, "").slice(0, max);
    if (v !== inp.value) inp.value = v;
    en.sync(v); if (o.onSet) o.onSet(v);
  });
  if (!TOUCH) return;
  var open = function () { kpOpen(inp, null, 0, { title: o.title || "⌨ 員工編號：", letters: true, sym: "-", max: max, next: o.next || null, nextLabel: o.nextLabel || (o.next ? "下一格" : "完成") }); };
  inp.addEventListener("focus", open);
  inp.addEventListener("click", function () { if (!KP || KP.inp !== inp) open(); });
  inp.addEventListener("blur", function () { setTimeout(function () { if (KP && KP.inp === inp && document.activeElement !== inp) kpClose(); }, 0); });
}
return { sumBox: function (S0, note) { injectCss(); return msumBox(S0, [], note); }, draw: draw, reset: reset, ready: function () { return Q.boot && !Q.none; }, empKeys: empKeys, dropPeople: function () { Q.people = null; if (Q.tab === "set") renderSet(); } };
})();
