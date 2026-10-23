/* Kilaw Smile v3 — tampilan & input (memakai KGCore dari core.js) */
(function () {
  'use strict';
  var K = window.KGCore, $ = function (id) { return document.getElementById(id); };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var el = {}, svg, stainsG, stainEls = [], lastCur = null, tab = 'home', t0 = performance.now(), settingsArm = 0;

  function vibrate(ms) { if (K.S.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* abaikan */ } } }
  function toast(text, type) {
    var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = text; el.toasts.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
    while (el.toasts.children.length > 3) el.toasts.removeChild(el.toasts.firstChild);
  }
  function nowSec() { return (performance.now() - t0) / 1000; }

  // ---------- koordinat gigi
  function toView(cx, cy) {
    var r = svg.getBoundingClientRect(), m = Math.min(r.width, r.height), s = 512 / m;
    return { x: (cx - (r.left + (r.width - m) / 2)) * s, y: (cy - (r.top + (r.height - m) / 2)) * s };
  }
  function toClient(vx, vy) {
    var r = svg.getBoundingClientRect(), m = Math.min(r.width, r.height), s = m / 512;
    return { x: r.left + (r.width - m) / 2 + vx * s, y: r.top + (r.height - m) / 2 + vy * s };
  }
  function stainAt(cx, cy, pad) {
    var p = toView(cx, cy), best = -1, bd = Infinity, st = K.S.cur.stains;
    for (var i = 0; i < st.length; i++) {
      if (st[i].hp <= 0) continue;
      var sp = K.SPOTS[st[i].p], dx = (p.x - sp.x) / (sp.rx + pad), dy = (p.y - sp.y) / (sp.ry + pad), d = dx * dx + dy * dy;
      if (d <= 1 && d < bd) { bd = d; best = i; }
    }
    return best;
  }

  // ---------- efek
  function floatText(type, text, cx, cy) {
    var host = el.stage; if (host.querySelectorAll('.float').length > 24) return;
    var r = host.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'float ' + type; d.textContent = text;
    d.style.left = Math.max(26, Math.min(r.width - 26, cx - r.left)) + 'px'; d.style.top = Math.max(18, cy - r.top - 12) + 'px';
    host.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 850);
  }
  function stainCenter(i) { var sp = K.SPOTS[K.S.cur.stains[i].p]; return toClient(sp.x, sp.y); }
  function bump(i) { var e = stainEls[i]; if (!e) return; e.classList.remove('hit'); void e.getBoundingClientRect(); e.classList.add('hit'); }
  function ripple(cx, cy, cls) {
    var r = el.stage.getBoundingClientRect(), d = document.createElement('div'); d.className = 'ripple' + (cls ? ' ' + cls : '');
    d.style.left = (cx - r.left) + 'px'; d.style.top = (cy - r.top) + 'px'; el.stage.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 420);
  }
  K.G.setFx(function (type, text, x) {
    x = x || {};
    if (type === 'crit') vibrate(12); else if (type === 'mega' || type === 'fever' || type === 'clean' || type === 'instant' || type === 'jackpot') vibrate(25);
    if (type === 'tap' || type === 'sweep' || type === 'crit' || type === 'mega' || type === 'instant') {
      if (x.i !== undefined) bump(x.i);
      if (x.auto) return;
      var c = x.pos || (x.i !== undefined ? stainCenter(x.i) : null); if (c) floatText(type, text, c.x, c.y);
    } else if (type === 'stainGone' || type === 'jackpot') {
      var c2 = stainCenter(x.i); popStain(x.i); floatText(type === 'jackpot' ? 'jackpot' : 'money', text, c2.x, c2.y - 14);
    } else if (type === 'clean') {
      toast(text, x.lucky ? 'lucky' : 'clean'); el.tooth.classList.add('sparkle'); setTimeout(function () { el.tooth.classList.remove('sparkle'); }, 700);
    } else if (type === 'newTooth') { buildStains(true); } else if (type === 'limit') { openLimit(x); } else if (type === 'trophy') { showBanner(x && x.id); if (achvEl && !achvEl.hidden) renderAchv(); if (x && x.id === 't16') setTimeout(openEnding, 1800); } else { toast(text, type); }
  });

  // ---------- noda
  function buildStains(animate) {
    stainsG.innerHTML = ''; stainEls = []; lastCur = K.S.cur;
    K.S.cur.stains.forEach(function (s) {
      var sp = K.SPOTS[s.p], e = document.createElementNS(SVGNS, 'ellipse');
      e.setAttribute('cx', sp.x); e.setAttribute('cy', sp.y); e.setAttribute('rx', sp.rx); e.setAttribute('ry', sp.ry);
      e.setAttribute('class', 'stain k-' + (s.k || 'n') + (animate ? ' born' : '')); stainsG.appendChild(e); stainEls.push(e);
    });
    refreshStains();
  }
  function popStain(i) { var e = stainEls[i]; if (e) e.classList.add('gone'); }
  function refreshStains() {
    if (K.S.cur !== lastCur) buildStains(false);
    var cur = K.S.cur, wk = K.dps() > 0 ? K.weakest() : -1;
    for (var i = 0; i < cur.stains.length; i++) {
      var s = cur.stains[i], e = stainEls[i]; if (!e) continue;
      if (s.hp <= 0) { e.classList.add('gone'); continue; }
      var f = s.hp / s.max; e.classList.remove('gone');
      e.style.transform = 'scale(' + (0.32 + 0.68 * f).toFixed(3) + ')'; e.style.opacity = (0.55 + 0.45 * f).toFixed(2);
      e.classList.toggle('auto', i === wk);
    }
  }

  // ---------- input gigi
  function cooldownAnim() {
    var f = el.cdfill; f.style.transition = 'none'; f.style.width = '0%'; void f.offsetWidth;
    f.style.transition = 'width ' + K.D.cdSec.toFixed(3) + 's linear'; f.style.width = '100%';
  }
  function setupStage() {
    var ptr = {};
    el.stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.fabs')) return;   // ikon mengambang: bukan ketukan gigi
      ptr[e.pointerId] = { x: e.clientX, y: e.clientY, dist: 0 };
      try { el.stage.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      K.sync(nowSec());
      var i = K.T.clearUntil >= 0 ? -1 : stainAt(e.clientX, e.clientY, 20);
      if (i >= 0) {
        var r = K.doTap(i, false, { x: e.clientX, y: e.clientY });
        if (r < 0) ripple(e.clientX, e.clientY, 'cd'); else { el.tooth.classList.add('pressed'); cooldownAnim(); }
      } else ripple(e.clientX, e.clientY);
      refreshTop(); e.preventDefault();
    });
    el.stage.addEventListener('pointermove', function (e) {
      var p = ptr[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.dist += Math.sqrt(dx * dx + dy * dy); p.x = e.clientX; p.y = e.clientY;
      if (p.dist >= 36) {
        p.dist -= 36;
        if (K.D.sweep && K.T.clearUntil < 0) { K.sync(nowSec()); var i = stainAt(e.clientX, e.clientY, 14); if (i >= 0) { K.doScrub(i, { x: e.clientX, y: e.clientY }); refreshTop(); } }
      }
    });
    var end = function (e) { delete ptr[e.pointerId]; if (!Object.keys(ptr).length) el.tooth.classList.remove('pressed'); };
    el.stage.addEventListener('pointerup', end); el.stage.addEventListener('pointercancel', end);
    el.stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  // ---------- tips / tutorial
  function ownedCount() { return Object.keys(K.S.skills).length + Object.keys(K.S.perm).length; }
  function itemCount() { return K.S.tapLv.concat(K.S.gens).reduce(function (a, b) { return a + b; }, 0); }
  var STEPS = [
    { t: 'Ketuk noda coklat di gigi sampai hilang. Setiap noda yang hilang memberi uang.', done: function (S) { return S.stainsCleared >= 1; } },
    { t: 'Ketuk 🛠️ di pojok kanan atas untuk membeli alat dengan uang. Alat ketuk menambah daya, alat otomatis membersihkan noda sendiri.', done: function () { return itemCount() >= 1; } },
    { t: 'Bersihkan semua noda sampai progres bar penuh: gigi bersih memberi SP (poin skill). Garis di bawah gigi adalah cooldown ketukan.', done: function (S) { return S.teeth >= 1; } },
    { t: 'Ketuk 🌳 di sisi kanan gigi dan ambil “Awal Baru”. Tiap skill yang diambil membuka cabang baru. Geser dan cubit layar untuk menjelajah pohon.', done: function () { return ownedCount() >= 1; } },
    { t: 'Pilih cabang: Damage, Penghasilan, Hoki (kritis dan SP tambahan), Tempo (cooldown), Kekerasan Noda, Otomatis, atau Spesial. Angka di 🌳 = skill yang bisa dibeli sekarang.', done: function () { return ownedCount() >= 4; } },
    { t: 'Geraham (gigi ke-10, 20, …) lebih keras tapi hadiahnya jauh lebih besar.', done: function (S) { return S.teeth >= 11; } },
    { t: 'Setelah ' + K.P.prestigeAt + ' gigi, tombol 🏗️ Renovasi di halaman Skill aktif: semua progres direset, tetapi tiap ⭐ bintang bisa membuat 1 skill permanen.', done: function (S) { return S.prestiges >= 1; } }
  ];
  var LOOP = ['Hoki menambah peluang kritis, SP tambahan, dan uang jackpot.', 'Kurangi kekerasan noda agar gigi lebih cepat bersih.', 'Skill ⭐ permanen tetap ada setelah Renovasi, termasuk yang butuh banyak SP.',
    'Cooldown yang pendek membuat ketukan lebih sering dihitung. Kombo menambah bonus saat mengetuk beruntun.', 'Alat otomatis tetap bekerja walau panel Alat ditutup.'];
  var tipIdx = 0, tipAt = 0;
  function refreshTip() {
    var S = K.S;
    if (S.tutOff || tab !== 'home' || S.tut < TUT.length) { el.tip.hidden = true; return; }
    var txt = null;
    for (var i = 0; i < STEPS.length; i++) if (!STEPS[i].done(S)) { txt = STEPS[i].t; break; }
    if (txt === null) {
      if (nowSec() - tipAt > 20) { tipAt = nowSec(); tipIdx = (tipIdx + 1) % LOOP.length; }
      txt = LOOP[tipIdx];
    }
    el.tip.hidden = false; if (el.tipText.textContent !== txt) el.tipText.textContent = txt;
  }

  function affordableCount() {
    var n = 0;
    ['tap', 'gen'].forEach(function (kind) {
      var arr = kind === 'tap' ? K.TAPU : K.GENS;
      for (var i = 0; i < arr.length; i++) if (K.isUnlocked(kind, i) && K.S.money >= K.itemCost(kind, i, 1)) n++;
    });
    return n;
  }

  // ---------- header
  function refreshTop() {
    var S = K.S, sp = K.spAvail(), spec = K.spec(), p = K.progress();
    el.money.textContent = 'Rp ' + K.fmt(S.money);
    el.dps.textContent = 'ketuk ' + K.fmt(K.tapDamage()) + ' · otomatis ' + K.fmt(K.dps()) + '/dtk';
    el.sp.textContent = sp; el.sp.parentNode.classList.toggle('has', sp > 0);
    var aff = affordableCount(); el.menuBadge.textContent = aff; el.menuBadge.hidden = aff <= 0;
    var av = K.availableSkills(); el.fabSkillBadge.textContent = av; el.fabSkillBadge.hidden = av <= 0; el.fabSkill.classList.toggle('has', av > 0);
    el.drawerMoney.textContent = 'Rp ' + K.fmt(S.money);
    el.stars.textContent = S.stars; el.stars.parentNode.hidden = !(S.stars > 0 || S.prestiges > 0);
    el.cleanbar.style.width = (K.T.clearUntil >= 0 ? 100 : Math.round(p * 100)) + '%';
    var willSp = Math.floor(Math.pow(S.teeth + 1, K.P.spExp) + 1e-9) - Math.floor(Math.pow(S.teeth, K.P.spExp) + 1e-9);
    el.cleanLabel.innerHTML = '<b>' + (spec.boss ? 'Geraham' : 'Gigi') + ' ke-' + (S.cur.n + 1) + '</b> · ' + Math.round(p * 100) + '%' +
      (willSp > 0 ? ' · <i>+1 SP saat bersih</i>' : ' · SP berikutnya di gigi ke-' + K.spNextTooth());
    if (S.teeth >= K.P.hardCap) el.cleanLabel.innerHTML = '<b>Gigi ke-' + (S.cur.n + 1) + '</b> · ' + Math.round(p * 100) + '% · <i>Level maks, Renovasi untuk lanjut</i>';
    el.cleanWrap.classList.toggle('boss', spec.boss);
    var parts = [];
    if (K.D.combo && K.T.combo >= 2) parts.push('Kombo ×' + K.comboMult().toFixed(2));
    if (K.feverOn()) parts.push('🔥 Demam ×' + K.D.feverMult + ' · ' + Math.ceil(K.T.feverUntil - K.T.clock) + 'dtk');
    el.status.textContent = parts.join('  ·  ');
    refreshStains(); refreshTip();
  }

  // ---------- alat
  var SECTIONS = [
    { kind: 'tap', title: '👆 Alat ketuk', sub: 'Menambah daya setiap ketukan', arr: K.TAPU },
    { kind: 'gen', title: '⚙️ Alat otomatis', sub: 'Membersihkan noda tanpa diketuk', arr: K.GENS }
  ];
  function buildItems() {
    var html = '';
    SECTIONS.forEach(function (sec) {
      html += '<h5 class="sec"><span>' + sec.title + '</span><small data-sub="' + sec.kind + '">' + sec.sub + '</small></h5>';
      sec.arr.forEach(function (it, i) {
        html += '<button type="button" class="card gen" data-kind="' + sec.kind + '" data-i="' + i + '"><span class="ico">' + it.icon + '</span>' +
          '<span class="gmain"><b>' + it.name + '</b><small class="gdesc">' + it.desc + '</small><small class="gstat"></small></span>' +
          '<span class="gbuy"><span class="gcnt"></span><span class="gcost"></span></span></button>';
      });
    });
    el.gens.innerHTML = html;
    el.gens.addEventListener('click', function (e) {
      var b = e.target.closest('.gen'); if (!b) return;
      if (K.buyItem(b.dataset.kind, +b.dataset.i, K.T.buyQty)) { refreshAll(); K.save(); }
    });
  }
  function refreshItems() {
    var cards = el.gens.querySelectorAll('.gen'), shownLocked = {};
    for (var c = 0; c < cards.length; c++) {
      var b = cards[c], kind = b.dataset.kind, i = +b.dataset.i, it = K.item(kind, i), n = K.lvl(kind, i);
      var rm = K.room(kind, i), q = K.T.buyQty === 'max' ? Math.max(1, K.maxQty(kind, i)) : K.T.buyQty; q = Math.max(1, Math.min(q, rm));
      var cost = K.itemCost(kind, i, q), can = rm > 0 && K.S.money >= cost;
      var unlocked = K.isUnlocked(kind, i);
      if (!unlocked) shownLocked[kind] = (shownLocked[kind] || 0) + 1;
      b.hidden = !unlocked && shownLocked[kind] > 1;
      b.classList.toggle('can', can); b.classList.toggle('locked', !unlocked); b.classList.toggle('maxed', rm <= 0);
      b.querySelector('.gcnt').textContent = n ? 'Lv ' + n + '/' + K.itemMax(kind) : '';
      b.querySelector('.gcost').textContent = !unlocked ? '???' : rm <= 0 ? 'MAKS ✓' : (q > 1 ? '+' + q + ' · ' : '') + 'Rp ' + K.fmt(cost);
      var stat;
      if (!unlocked) stat = 'Kumpulkan uang lebih banyak';
      else if (kind === 'tap') {
        var each = it.add * K.mult(n, K.TAP_MILES) * (1 + K.D.dmgPct) * K.D.dmgMult, nm = K.TAP_MILES.filter(function (m) { return m > n; })[0];
        stat = '+' + K.fmt(each) + ' daya ketuk/level' + (nm ? ' · ×' + (nm === K.TAP_MILES[K.TAP_MILES.length - 1] ? 3 : 2) + ' di Lv ' + nm : '');
      } else {
        var eg = it.dps * K.mult(n, K.GEN_MILES) * K.D.dpsF, ng = K.GEN_MILES.filter(function (m) { return m > n; })[0];
        stat = K.fmt(eg) + ' daya/dtk per unit' + (n ? ' · total ' + K.fmt(K.genDps(i) * K.D.dpsF) : '') + (ng ? ' · ×' + (ng === K.GEN_MILES[K.GEN_MILES.length - 1] ? 3 : 2) + ' di ' + ng : '');
      }
      b.querySelector('.gstat').textContent = stat;
    }
    el.gens.querySelector('[data-sub="tap"]').textContent = 'Daya ketuk sekarang: ' + K.fmt(K.tapDamage());
    el.gens.querySelector('[data-sub="gen"]').textContent = 'Daya otomatis: ' + K.fmt(K.dps()) + '/dtk';
  }

  // ---------- pohon skill: bisa digeser dan di-zoom
  var tree = { nodes: {}, lines: {}, view: { x: 0, y: 0, s: 0.9 }, seen: {}, fitted: false };
  function svgEl(n, a) { var e = document.createElementNS(SVGNS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function buildTree() {
    var pos = K.layout();
    K.TREE.forEach(function (n) {
      tree.lines[n.id] = [];
      n.parents.forEach(function (pid) {
        var a = pos[pid], b = pos[n.id];
        var l = svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'tline' }); l.style.setProperty('--nc', K.CAT[n.cat]);
        el.treeLines.appendChild(l); tree.lines[n.id].push({ l: l, from: pid });
      });
    });
    K.TREE.forEach(function (n) {
      var p = pos[n.id], g = svgEl('g', { class: 'tnode', transform: 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')' });
      g.dataset.id = n.id; g.style.setProperty('--nc', K.CAT[n.cat]);
      g.appendChild(svgEl('circle', { class: 'base', r: 27 }));
      var ic = svgEl('text', { class: 'ic' }); ic.textContent = n.icon; g.appendChild(ic);
      var lb = svgEl('text', { class: 'lb', y: 45 }); lb.textContent = n.name; g.appendChild(lb);
      var st = svgEl('text', { class: 'star', y: -33 }); st.textContent = '⭐'; g.appendChild(st);
      var cg = svgEl('g', { class: 'cost', transform: 'translate(20,-20)' });
      if (n.rp) cg.setAttribute('class', 'cost rp'); cg.appendChild(svgEl('circle', { r: 11 })); var ct = svgEl('text', {}); ct.textContent = n.cost; cg.appendChild(ct); g.appendChild(cg);
      el.treeNodes.appendChild(g); tree.nodes[n.id] = g;
    });
  }
  function applyView() {
    var v = tree.view; el.treeG.setAttribute('transform', 'translate(' + v.x.toFixed(1) + ',' + v.y.toFixed(1) + ') scale(' + v.s.toFixed(3) + ')');
    el.treeWrap.classList.toggle('far', v.s < 0.6);
  }
  function zoomAt(cx, cy, factor) {
    var v = tree.view, ns = Math.max(0.08, Math.min(3.2, v.s * factor)); factor = ns / v.s;
    v.x = cx - (cx - v.x) * factor; v.y = cy - (cy - v.y) * factor; v.s = ns; applyView();
  }
  function fitTree() {
    var r = el.treeWrap.getBoundingClientRect(); if (!r.width) return;
    tree.view.s = r.width < 420 ? 0.85 : 1; tree.view.x = r.width / 2; tree.view.y = r.height / 2; applyView(); tree.fitted = true;
  }
  function refreshTree() {
    var fresh = [];
    K.TREE.forEach(function (n) {
      var g = tree.nodes[n.id], st = K.nodeState(n.id), vis = st !== 'hidden';
      g.style.display = vis ? '' : 'none';
      var can = st === 'open' && K.canBuySkill(n.id);
      var cls = 'tnode st-' + st + (can ? ' can' : '');
      if (vis && !tree.seen[n.id]) { tree.seen[n.id] = 1; if (tree.ready) { cls += ' born'; fresh.push(g); } }
      g.setAttribute('class', cls);
      var lk = st === 'locked';
      g.querySelector('.ic').textContent = lk ? '❔' : n.icon; g.querySelector('.lb').textContent = lk ? '???' : n.name;
      tree.lines[n.id].forEach(function (e) {
        var show = vis && K.nodeState(e.from) !== 'hidden';
        e.l.style.display = show ? '' : 'none';
        e.l.setAttribute('class', 'tline' + (K.owned(n.id) ? ' on' : (n.join && K.owned(e.from) ? ' half' : '')));
      });
    });
    tree.ready = true;
    setTimeout(function () { fresh.forEach(function (g) { g.classList.remove('born'); }); }, 500);
    el.spInfo.textContent = K.spAvail(); el.starInfo.textContent = K.S.stars; el.spNext.textContent = K.spNextTooth();
  }
  function setupTree() {
    var ptrs = {}, start = null, pinch = null, moved = false;
    var w = el.treeWrap;
    var rel = function (e) { var r = w.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    w.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.treectl')) return;   // tombol zoom: jangan ditangkap kanvas
      try { w.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      ptrs[e.pointerId] = rel(e); var ids = Object.keys(ptrs);
      if (ids.length === 1) { moved = false; start = { x: ptrs[ids[0]].x, y: ptrs[ids[0]].y, vx: tree.view.x, vy: tree.view.y }; pinch = null; }
      else if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; moved = true; }
      el.treeHelp.style.opacity = 0;
    });
    w.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = rel(e); var ids = Object.keys(ptrs);
      if (ids.length === 1 && start) {
        var p = ptrs[ids[0]], dx = p.x - start.x, dy = p.y - start.y;
        if (Math.hypot(dx, dy) > 7) moved = true;
        if (moved) { tree.view.x = start.vx + dx; tree.view.y = start.vy + dy; applyView(); }
      } else if (ids.length >= 2 && pinch) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.d > 0 && d > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d);
        pinch.d = d;
      }
    });
    var up = function (e) {
      var wasOne = Object.keys(ptrs).length === 1; delete ptrs[e.pointerId];
      if (wasOne && !moved) {
        var t = document.elementFromPoint(e.clientX, e.clientY), g = t && t.closest ? t.closest('.tnode') : null;
        if (g && g.style.display !== 'none') openNode(g.dataset.id);
      }
      var ids = Object.keys(ptrs);
      if (ids.length === 1) { start = { x: ptrs[ids[0]].x, y: ptrs[ids[0]].y, vx: tree.view.x, vy: tree.view.y }; pinch = null; moved = true; }
      if (!ids.length) { start = null; pinch = null; }
    };
    w.addEventListener('pointerup', up); w.addEventListener('pointercancel', function (e) { delete ptrs[e.pointerId]; start = null; pinch = null; });
    w.addEventListener('wheel', function (e) { e.preventDefault(); var p = rel(e); zoomAt(p.x, p.y, e.deltaY < 0 ? 1.25 : 1 / 1.25); }, { passive: false });
    $('zIn').addEventListener('click', function () { var r = w.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.6); });
    $('zOut').addEventListener('click', function () { var r = w.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.6); });
    $('zFit').addEventListener('click', fitTree);
  }
  function openNode(id) {
    if (K.nodeState(id) === 'locked') {
      var ln = K.NODE[id];
      openSheet('<div class="sh-ico">❔</div><h3>Skill Tersembunyi</h3><p class="warn">Terbuka bila kamu punya ' + ln.need.map(function (q) { return q.n + ' skill ' + K.CAT_NAME[q.c] + ' (sekarang ' + K.countCat(q.c) + ')'; }).join(' dan ') + '. Pilih jalur dengan bijak.</p><div class="row"><button class="btn" id="shClose">Tutup</button></div>');
      $('shClose').onclick = closeSheet; return;
    }
    var n = K.NODE[id], st = K.nodeState(id), d = K.describe(n), par = n.parents.map(function (p) { return (K.owned(p) ? '✓ ' : '✗ ') + K.NODE[p].name; }).join(', ');
    var html = '<div class="sh-ico">' + n.icon + '</div><h3>' + n.name + '</h3><div class="sh-sub">' + K.CAT_NAME[n.cat] + ' · biaya ' + n.cost + ' SP' + (n.rp ? ' + Rp ' + K.fmt(K.rpOf(n)) : '') +
      (st === 'perm' ? ' · <b>permanen ⭐</b>' : st === 'owned' ? ' · <b>dimiliki</b>' : '') + '</div><ul class="sh-lines">' +
      d.lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' + (d.note ? '<p class="muted">' + d.note + '</p>' : '');
    if (st === 'ghost') html += '<p class="warn">Butuh semua: ' + par + '</p>';
    else if (n.join) html += '<p class="muted" style="font-size:12px">Induk: ' + par + '</p>';
    if (st === 'open' && !K.canBuySkill(id)) html += '<p class="warn">' + (K.spAvail() < n.cost ? 'Poin skill kurang (punya ' + K.spAvail() + '). Bersihkan gigi untuk mendapatkannya.' : 'Uang kurang: butuh Rp ' + K.fmt(K.rpOf(n)) + '.') + '</p>';
    html += '<div class="row">';
    if (st === 'open') html += '<button class="btn primary" id="shBuy"' + (K.canBuySkill(id) ? '' : ' disabled') + '>Ambil (' + n.cost + ' SP' + (n.rp ? ' + Rp ' + K.fmt(K.rpOf(n)) : '') + ')</button>';
    if (st === 'open' || st === 'owned') html += '<button class="btn gold" id="shPerm"' + (K.canMakePerm(id) ? '' : ' disabled') + '>⭐ Jadikan permanen</button>';
    html += '<button class="btn" id="shClose">Tutup</button></div>';
    if (st === 'open' || st === 'owned') html += '<p class="muted" style="margin-top:10px;font-size:12px">1 ⭐ membuat skill ini permanen (tetap setelah Renovasi), berapa pun biaya SP-nya' + (st === 'owned' ? '. SP yang sudah dipakai dikembalikan.' : '.') + ' Bintang Anda: ' + K.S.stars + '.</p>';
    openSheet(html);
    var b = $('shBuy'); if (b) b.onclick = function () { if (!sheetArmed()) return; if (K.buySkill(id)) { toast(n.name + ' diambil!', 'ok'); vibrate(20); closeSheet(); refreshAll(); K.save(); } };
    var p = $('shPerm'); if (p) p.onclick = function () { if (!sheetArmed()) return; if (K.makePerm(id)) { toast(n.name + ' kini permanen ⭐', 'ok'); vibrate(25); closeSheet(); refreshAll(); K.save(); } };
    $('shClose').onclick = closeSheet;
  }

  // ---------- statistik (halaman) & pengaturan (lembar)
  function refreshStats() {
    var S = K.S, D = K.D;
    var rows = [['Bintang tersedia', S.stars + ' ⭐'], ['Skill permanen', Object.keys(S.perm).length + ' / ' + K.TREE.length], ['Gigi bersih (putaran ini)', S.teeth],
      ['Gigi bersih (sepanjang masa)', S.teethTotal], ['Uang sepanjang masa', 'Rp ' + K.fmt(S.moneyTotal)], ['Daya ketuk', K.fmt(K.tapDamage())], ['Daya otomatis / detik', K.fmt(K.dps())],
      ['Cooldown ketuk', D.cdSec.toFixed(2) + ' dtk'], ['Peluang kritis', Math.round(D.critChance * 100) + '% (×' + D.critMulti.toFixed(1) + ')'], ['Hoki', Math.round(D.luck * 100) + '%'],
      ['Kekerasan noda', '−' + Math.round((1 - D.hardF) * 100) + '%'], ['Bonus uang per noda', '+' + Math.round((((1 + D.income) * D.incomeMult) - 1) * 100) + '%'],
      ['Peluang noda langsung hilang', Math.round(D.instChance * 100) + '%'], ['Peluang SP tambahan', Math.round(D.spChance * 100) + '%'],
      ['Ketukan', S.taps.toLocaleString('id-ID')], ['Sapuan', S.scrubs.toLocaleString('id-ID')], ['Ketukan kritis', S.crits.toLocaleString('id-ID')],
      ['Noda dibersihkan', S.stainsCleared.toLocaleString('id-ID')], ['Bintang diperoleh / Renovasi', S.starsEarned + ' ⭐ / ' + S.prestiges + '×'], ['Mulai bermain', new Date(S.started).toLocaleDateString('id-ID')]];
    var got = K.TROPHIES.filter(function (t) { return S.trophies[t.id]; }).length;
    el.stats.innerHTML = '<div class="titleline"><span>Gelar</span><b>' + K.titleNow() + '</b><button type="button" id="btnTitle">Ganti</button></div>' +
      '<div class="achcard" id="btnAchv"><i>🏆</i><div><b>Pencapaian</b><small>' + got + ' / ' + K.TROPHIES.length + ' terbuka · ' + K.achvPoints().got + ' / ' + K.achvPoints().all + ' poin</small></div><span>›</span></div>' +
      rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
  }
  function openDevDone(dv) {
    if (dv.achv) { openEnding(); return; }
    openSheet('<div class="sh-ico">🛠️</div><h3>Kode developer diterapkan</h3><p>Gigi: ' + (dv.teeth || 'tetap') + ' · Level alat: ' + (dv.items || 'tetap') + ' · Skill permanen: ' + (dv.skills ? 'semua' : 'tetap') + '</p><div class="row"><button class="btn primary" id="shClose">Tutup</button></div>');
    $('shClose').onclick = closeSheet;
  }
  function openEnding() {
    var S = K.S, p = K.achvPoints(), days = Math.max(1, Math.round((Date.now() - S.started) / 864e5));
    openSheet('<div class="sh-ico">🌸</div><h3>Tamat Sejati</h3><p>Semua pencapaian terbuka. Terima kasih sudah memainkan sampai akhir.</p>' +
      '<div class="stats" style="margin:8px 0"><div><span>Gigi bersih</span><b>' + S.teethTotal.toLocaleString('id-ID') + '</b></div><div><span>Renovasi</span><b>' + S.prestiges + '×</b></div><div><span>Poin pencapaian</span><b>' + p.got + ' / ' + p.all + '</b></div><div><span>Lama bermain</span><b>' + days + ' hari</b></div></div>' +
      '<p class="muted" style="font-size:12px;text-align:center">Gelar “Penjaga Senyum” sudah kamu pakai. — ShimaYuu</p><div class="row"><button class="btn primary" id="shClose">Tutup</button></div>');
    $('shClose').onclick = closeSheet;
  }
  function openTitles() {
    var S = K.S, html = '<div class="sh-ico">🎖️</div><h3>Pilih gelar</h3><div class="row" style="flex-wrap:wrap">';
    html += '<button class="btn' + (!S.title ? ' primary' : '') + '" data-t="">Otomatis</button>';
    K.TROPHIES.forEach(function (t) { if (S.trophies[t.id] && t.title) html += '<button class="btn' + (S.title === t.id ? ' primary' : '') + '" data-t="' + t.id + '">' + t.title + '</button>'; });
    html += '</div><div class="row" style="margin-top:12px"><button class="btn" id="shClose">Tutup</button></div>';
    openSheet(html); $('shClose').onclick = closeSheet;
    el.sheetBody.querySelectorAll('[data-t]').forEach(function (b) {
      b.onclick = function () { if (!sheetArmed()) return; K.setTitle(b.dataset.t); K.save(); closeSheet(); refreshStats(); if (achvEl && !achvEl.hidden) renderAchv(); };
    });
  }
  function openSettings() {
    var S = K.S;
    openSheet('<div class="sh-ico">⚙️</div><h3>Pengaturan</h3>' +
      '<label class="opt"><input type="checkbox" id="optVib"' + (S.settings.vibrate ? ' checked' : '') + '> Getar saat kritis</label>' +
      '<label class="opt"><input type="checkbox" id="optTips"' + (!S.tutOff ? ' checked' : '') + '> Tampilkan tips di Beranda</label>' +
      '<div class="sh-sec">Simpanan</div><p class="muted" style="font-size:12px">Progres tersimpan otomatis di perangkat ini. Untuk pindah perangkat, buat kode lalu tempel di perangkat lain.</p>' +
      '<textarea id="saveCode" rows="3" spellcheck="false" placeholder="Kode simpanan"></textarea>' +
      '<div class="row"><button class="btn" id="btnExport" type="button">Buat kode</button><button class="btn" id="btnImport" type="button">Muat kode</button></div>' +
      '<button class="btn danger" id="btnReset" type="button">Hapus semua progres</button>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" id="shClose">Selesai</button></div>');
    $('shClose').onclick = closeSheet; settingsArm = 0;
    $('optVib').onchange = function () { K.S.settings.vibrate = this.checked; K.save(); };
    $('optTips').onchange = function () { K.S.tutOff = !this.checked; K.save(); refreshTip(); };
    $('btnExport').onclick = function () {
      var ta = $('saveCode'); ta.value = K.exportCode(); ta.select();
      try { var pr = navigator.clipboard && navigator.clipboard.writeText(ta.value); if (pr && pr.catch) pr.catch(function () { /* izin ditolak: abaikan */ }); } catch (e) { /* abaikan */ }
      toast('Kode simpanan dibuat. Salin dan simpan di tempat aman.', 'ok');
    };
    $('btnImport').onclick = function () {
      var dv = K.devCode($('saveCode').value);
      if (dv) { resetTreeView(); buildStains(false); closeSheet(); refreshStats(); setPage('home'); setTimeout(function () { openDevDone(dv); }, 250); return; }
      try { K.importCode($('saveCode').value); resetTreeView(); buildStains(false); closeSheet(); toast('Simpanan dimuat.', 'ok'); setPage('home'); } catch (e) { toast('Kode tidak valid.', 'err'); }
    };
    $('btnReset').onclick = function () {
      var b = this;
      if (Date.now() - settingsArm < 4000) { K.reset(); resetTreeView(); buildStains(false); closeSheet(); toast('Progres dihapus.', 'ok'); setPage('home'); }
      else { settingsArm = Date.now(); b.textContent = 'Yakin? Ketuk lagi untuk menghapus'; setTimeout(function () { if (b.isConnected && Date.now() - settingsArm >= 3900) b.textContent = 'Hapus semua progres'; }, 4100); }
    };
  }
  function resetTreeView() { tree.seen = {}; tree.ready = false; }

  // ---------- Renovasi (penjelasan + konfirmasi), dibuka dari halaman Skill
  function openPrestige() {
    var S = K.S, g = K.starsGain(), need = K.P.prestigeAt, have = S.teeth, ready = g >= 1;
    var nextAt = Math.pow(g + 1, 2) + K.P.starOffset;
    var perm = Object.keys(S.perm).length;
    var html = '<div class="sh-ico">🏗️</div><h3>Renovasi Klinik</h3>' +
      '<div class="sh-sec">Progres</div><div class="pbar"><div style="width:' + Math.min(100, Math.round(have / need * 100)) + '%"></div></div>' +
      '<p class="muted" style="margin:0 0 4px">Gigi bersih putaran ini: <b>' + have + ' / ' + need + '</b> — ' + (ready ? '<b style="color:#8BD66B">siap direnovasi</b>' : 'butuh ' + (need - have) + ' gigi lagi') + '</p>' +
      '<div class="sh-sec">Bintang yang didapat</div>' +
      '<p style="margin:2px 0"><b>' + g + ' ⭐</b> sekarang → bintang Anda menjadi <b>' + (S.stars + g) + ' ⭐</b>' + (ready ? '. Bintang berikutnya di gigi ke-' + nextAt + '.' : '.') + '</p>' +
      '<p class="muted" style="font-size:12px;margin:2px 0">Bintang = akar kuadrat dari (gigi − ' + K.P.starOffset + '): 25 gigi = 4 ⭐, 40 = 5 ⭐, 60 = 7 ⭐, 100 = 9 ⭐. Makin dalam, makin banyak.</p>' +
      '<div class="sh-sec">Fungsi bintang</div><ul class="sh-list"><li><b>1 ⭐ = 1 skill permanen</b>, skill apa pun yang sudah terungkap, berapa pun biaya SP-nya (4, 6, atau lebih).</li>' +
      '<li>Skill permanen tetap aktif di setiap putaran, jadi putaran berikutnya lebih cepat dan bisa lebih dalam.</li>' +
      '<li>Cara memakainya: buka detail skill lalu ketuk “⭐ Jadikan permanen”. Skill yang sudah dibeli dengan SP juga bisa dijadikan permanen, dan SP-nya dikembalikan.</li></ul>' +
      '<div class="sh-sec">Yang direset</div><ul class="sh-list"><li>Uang, alat, dan gigi kembali ke awal</li><li>Semua skill yang dibeli dengan SP, beserta SP-nya</li></ul>' +
      '<div class="sh-sec">Yang tetap</div><ul class="sh-list"><li>Bintang (' + S.stars + ' ⭐ tersimpan + yang baru)</li><li>Skill permanen (' + perm + ' / ' + K.TREE.length + ')</li><li>Statistik</li></ul>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" id="shGo"' + (ready ? '' : ' disabled') + '>Renovasi (+' + g + ' ⭐)</button><button class="btn" id="shClose">Batal</button></div>';
    openSheet(html); presSeen = true; $('shClose').onclick = closeSheet;
    $('shGo').onclick = function () {
      if (!sheetArmed() || !K.prestige()) return;
      K.save(); closeSheet(); resetTreeView(); buildStains(true);
      toast('Klinik direnovasi! +' + g + ' ⭐ — ketuk skill lalu “Jadikan permanen”.', 'ok'); refreshAll();
    };
  }

  // ---------- batas level: sarankan Renovasi, atau lanjut
  function openLimit(x) {
    var g = x.gain, html = '<div class="sh-ico">' + (x.cap ? '🏆' : '🏁') + '</div><h3>' + (x.cap ? 'Level maksimum tercapai!' : 'Gigi ke-' + x.level + ' bersih') + '</h3>';
    if (x.cap) html += '<p>Batas tertinggi (gigi ke-' + K.P.hardCap + ') sudah tercapai dan tidak bisa dilewati. Gigi terakhir tetap bisa dibersihkan untuk uang. Renovasi untuk mendapat <b>' + g + ' ⭐' + '</b> dan mulai lagi lebih kuat.</p>';
    else html += '<p>Ini batas yang disarankan untuk putaran ini. Renovasi sekarang untuk <b>' + g + ' ⭐</b> dan mulai lagi lebih kuat, atau lanjutkan bermain (saran berikutnya di gigi ke-' + Math.min(K.P.hardCap, x.level + K.P.askStep) + ').</p>';
    html += '<div class="row"><button class="btn primary" id="shLimGo">🏗️ Renovasi</button><button class="btn" id="shClose">' + (x.cap ? 'Nanti' : 'Lanjutkan') + '</button></div>';
    openSheet(html); $('shClose').onclick = closeSheet;
    $('shLimGo').onclick = function () { if (!sheetArmed()) return; closeSheet(); setTimeout(openPrestige, 220); };
  }

  // ---------- halaman Pencapaian (gaya achievement game)
  var achvEl, achvFilter = 'all', bannerT = 0;
  function achvFmt(v) { return v >= 1e6 ? K.fmt(v) : Math.floor(v).toLocaleString('id-ID'); }
  function achvBuild() {
    achvEl = document.createElement('div'); achvEl.id = 'achv'; achvEl.hidden = true;
    achvEl.innerHTML = '<div class="pagebar"><button class="back" type="button" id="avBack">←</button><span class="ptitle">🏆 Pencapaian</span></div><div id="avBody"></div>';
    $('app').appendChild(achvEl);
    $('avBack').onclick = function () { achvEl.hidden = true; };
    achvEl.addEventListener('click', function (e) {
      var f = e.target.closest('[data-f]'); if (f) { achvFilter = f.dataset.f; renderAchv(); return; }
      if (e.target.closest('#avTitle')) openTitles();
    });
    var bn = document.createElement('div'); bn.id = 'achBanner'; bn.hidden = true; $('app').appendChild(bn);
  }
  function openAchv() { achvFilter = 'all'; renderAchv(); achvEl.hidden = false; $('avBody').scrollTop = 0; }
  function showBanner(id) {
    var t = K.TROPHIES.filter(function (q) { return q.id === id; })[0], bn = $('achBanner'); if (!t || !bn) return;
    bn.className = 'tier-' + t.tier; bn.innerHTML = '<i>' + t.icon + '</i><div><small>Pencapaian terbuka · ' + K.TIER_NAME[t.tier] + '</small><b>' + t.name + '</b></div><span>' + t.pts + '</span>';
    bn.hidden = false; void bn.offsetWidth; bn.classList.add('show'); clearTimeout(bannerT);
    bannerT = setTimeout(function () { bn.classList.remove('show'); setTimeout(function () { bn.hidden = true; }, 400); }, 3400);
  }
  function renderAchv() {
    var S = K.S, got = 0, pts = K.achvPoints(), n = K.TROPHIES.length;
    K.TROPHIES.forEach(function (t) { if (S.trophies[t.id]) got++; });
    var pct = Math.round(got / n * 100), C = 2 * Math.PI * 38;
    var h = '<div class="avhero"><svg viewBox="0 0 90 90" width="104" height="104"><circle cx="45" cy="45" r="38" class="rbg"/><circle cx="45" cy="45" r="38" class="rfg" stroke-dasharray="' + (C * pct / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 45 45)"/><text x="45" y="50" text-anchor="middle">' + pct + '%</text></svg>' +
      '<div class="avinfo"><div class="avpts">' + pts.got + '<small> / ' + pts.all + ' poin</small></div><div class="avsub">' + got + ' dari ' + n + ' pencapaian</div>' +
      '<button type="button" id="avTitle" class="avtitle">🎖️ ' + K.titleNow() + ' <span>ganti</span></button></div></div>';
    h += '<div class="avchips">' + [['all', 'Semua'], ['got', 'Terbuka'], ['lock', 'Terkunci']].map(function (f) { return '<button type="button" data-f="' + f[0] + '" class="' + (achvFilter === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>';
    var any = false;
    K.ACH_CATS.forEach(function (cat) {
      var list = K.TROPHIES.filter(function (t) { var g = !!S.trophies[t.id]; return t.cat === cat[0] && (achvFilter === 'all' || (achvFilter === 'got') === g); });
      if (!list.length) return; any = true;
      h += '<h4 class="avcat">' + cat[1] + '</h4>';
      list.forEach(function (t) {
        var g = !!S.trophies[t.id], cur = Math.min(t.cur(), t.goal), p = Math.round(cur / t.goal * 100), sc = t.secret && !g;
        h += '<div class="ac tier-' + t.tier + (g ? ' got' : '') + '"><div class="ai"><i>' + (g ? t.icon : sc ? '❔' : '🔒') + '</i></div><div class="am"><b>' + (sc ? '???' : t.name) + '</b><small>' + (sc ? 'Pencapaian rahasia. Buka semua pencapaian lain untuk menemukannya.' : t.desc + (t.title ? ' · Gelar “' + t.title + '”' : '')) + '</small>' +
          (g ? '<em>✓ Terbuka ' + new Date(S.trophies[t.id]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + '</em>'
             : sc ? '<em>Rahasia</em>' : '<div class="ap"><span style="width:' + p + '%"></span></div><em>' + achvFmt(cur) + ' / ' + achvFmt(t.goal) + '</em>') +
          '</div><div class="ar"><span class="pt">' + t.pts + '</span><small>' + K.TIER_NAME[t.tier] + '</small></div></div>';
      });
    });
    if (!any) h += '<p class="avempty">Belum ada yang cocok dengan filter ini.</p>';
    $('avBody').innerHTML = h;
  }

  // ---------- tutorial: sorotan + kartu petunjuk (tidak memblokir sentuhan)
  var presSeen = false, tutEl, tutHi, tutBox, tutTxt, tutN = 0;
  function qs(q) { return document.querySelector(q); }
  function sheetOpen() { return !el.sheet.hidden; }
  function firstStain() { var cur = K.S.cur; for (var i = 0; i < cur.stains.length; i++) if (cur.stains[i].hp > 0 && stainEls[i]) return stainEls[i]; return null; }
  var TUT = [
    { show: function () { return tab === 'home' && !sheetOpen(); }, tg: firstStain, txt: '👆 Ketuk noda di gigi sampai hilang.', done: function (S) { return S.stainsCleared >= 1; } },
    { show: function () { return tab === 'home' && !sheetOpen(); }, tg: firstStain, txt: 'Bagus! Bersihkan semua noda. Gigi bersih memberi uang dan poin skill (SP).', done: function (S) { return S.teethTotal >= 1; } },
    { show: function (S) { return tab === 'home' && !sheetOpen() && S.money >= K.itemCost('tap', 0, 1); },
      tg: function () { return el.drawer.hidden ? el.btnMenu : qs('.gen[data-kind="tap"][data-i="0"]'); },
      txt: function () { return el.drawer.hidden ? '🛠️ Uangmu cukup! Buka Alat untuk membeli upgrade.' : 'Beli Sikat Gigi: daya ketukmu naik tiap level.'; }, done: function (S) { return S.tapLv[0] >= 1; } },
    { show: function () { return tab === 'home' && !sheetOpen() && K.spAvail() >= 1; },
      tg: function () { return el.drawer.hidden ? el.fabSkill : el.drawerClose; },
      txt: function () { return el.drawer.hidden ? '🌳 Kamu punya SP! Buka pohon Skill.' : 'Tutup panel Alat dulu.'; }, done: function () { return tab === 'skills'; } },
    { show: function () { return tab === 'skills'; }, tg: function () { return sheetOpen() ? $('shBuy') : tree.nodes.r0; },
      txt: function () { return sheetOpen() ? 'Ketuk Ambil.' : 'Ketuk skill “Awal Baru”, lalu Ambil dengan SP-mu. Setelah itu tiga jalur terbuka: Damage, Penghasilan, Hoki.'; }, done: function () { return ownedCount() >= 1; } },
    { show: function () { return tab === 'skills' && !sheetOpen(); }, tg: function () { return el.btnPres; },
      txt: '🏗️ Ini Renovasi (prestise): mengulang dari awal untuk ⭐ yang membuat skill jadi permanen. Ketuk untuk membaca.', done: function () { return presSeen; } },
    { quiet: true, intro: 'Lanjutkan: bersihkan gigi, beli alat dan skill. Capai gigi ke-' + K.P.prestigeAt + ' untuk Renovasi pertama!', done: function (S) { return S.teeth >= K.P.prestigeAt; } },
    { show: function () { return true; },
      tg: function () { return sheetOpen() && $('shGo') ? $('shGo') : (tab === 'skills' ? el.btnPres : el.fabSkill); },
      txt: function () { return sheetOpen() && $('shGo') ? 'Ketuk Renovasi: kamu mulai ulang dan dapat ⭐.' : '🎉 Gigi ke-' + K.P.prestigeAt + '! Saatnya Renovasi: buka 🌳 Skill lalu ketuk 🏗️ Renovasi.'; }, done: function (S) { return S.prestiges >= 1; } },
    { show: function () { return true; },
      tg: function () { return tab !== 'skills' ? el.fabSkill : (sheetOpen() ? ($('shPerm') || $('shBuy')) : tree.nodes.r0); },
      txt: function () { return tab !== 'skills' ? '⭐ Pakai bintangmu: buka Skill.' : (sheetOpen() ? 'Ketuk ⭐ Jadikan permanen: skill ini tetap aktif setelah Renovasi.' : 'Ketuk skill “Awal Baru”, lalu ⭐ Jadikan permanen.'); },
      done: function (S) { return Object.keys(S.perm).length >= 1; } }
  ];
  function tutBuild() {
    tutEl = document.createElement('div'); tutEl.id = 'tut'; tutEl.hidden = true;
    tutEl.innerHTML = '<div id="tutHi"></div><div id="tutBox"><p id="tutTxt"></p><button type="button" id="tutSkip">Lewati tutorial</button></div>';
    $('app').appendChild(tutEl); tutHi = $('tutHi'); tutBox = $('tutBox'); tutTxt = $('tutTxt');
    $('tutSkip').onclick = function () { K.S.tut = TUT.length; K.save(); tutEl.hidden = true; refreshTip(); };
  }
  function tutTick(depth) {
    var S = K.S; if (!tutEl) return;
    if (S.tut >= TUT.length) { tutEl.hidden = true; return; }
    var st = TUT[S.tut];
    if (st.done(S)) {
      S.tut++; K.save();
      if (S.tut >= TUT.length) toast('🎓 Tutorial selesai! Selamat bermain.', 'ok'); else if (TUT[S.tut].intro) toast(TUT[S.tut].intro, 'ok');
      if (!depth) tutTick(1);
      return;
    }
    if (st.quiet || !st.show(S)) { tutEl.hidden = true; return; }
    var t = st.tg(); if (!t) { tutEl.hidden = true; return; }
    var r = t.getBoundingClientRect(); if (!r.width || !r.height) { tutEl.hidden = true; return; }
    var pad = 8, vh = window.innerHeight;
    tutHi.style.left = (r.left - pad) + 'px'; tutHi.style.top = (r.top - pad) + 'px'; tutHi.style.width = (r.width + pad * 2) + 'px'; tutHi.style.height = (r.height + pad * 2) + 'px';
    tutTxt.textContent = typeof st.txt === 'function' ? st.txt() : st.txt;
    if (r.top + r.height / 2 < vh / 2) { tutBox.style.top = (r.bottom + pad + 12) + 'px'; tutBox.style.bottom = 'auto'; }
    else { tutBox.style.bottom = (vh - r.top + pad + 12) + 'px'; tutBox.style.top = 'auto'; }
    tutEl.hidden = false;
  }

  // ---------- sheet, panel Alat, halaman
  var sheetAt = 0;
  function sheetArmed() { return Date.now() - sheetAt > 450; }
  function openSheet(html) { sheetAt = Date.now(); el.sheetBody.innerHTML = html; el.sheet.hidden = false; requestAnimationFrame(function () { el.sheet.classList.add('on'); }); }
  function closeSheet() { el.sheet.classList.remove('on'); setTimeout(function () { el.sheet.hidden = true; }, 160); }
  function showOffline(r) {
    var m = Math.round(r.full / 60), span = m >= 120 ? Math.floor(m / 60) + ' jam ' + (m % 60) + ' mnt' : m + ' menit';
    openSheet('<div class="sh-ico">🌙</div><h3>Selamat datang kembali!</h3><p>Asisten tetap bekerja selama ' + span + ' saat Anda pergi.</p><p class="big">+Rp ' + K.fmt(r.gain) + '</p>' +
      (r.full > r.secs ? '<p class="muted">Dihitung maksimal ' + Math.round(r.secs / 3600 * 10) / 10 + ' jam. Skill Otomatis menaikkan batas dan efisiensinya.</p>' : '') +
      '<div class="row"><button class="btn primary" id="shClose">Lanjut</button></div>');
    $('shClose').onclick = closeSheet;
  }
  function openDrawer() { el.drawer.hidden = false; refreshItems(); requestAnimationFrame(function () { el.drawer.classList.add('on'); }); }
  function closeDrawer() { if (el.drawer.hidden) return; el.drawer.classList.remove('on'); setTimeout(function () { el.drawer.hidden = true; }, 150); }
  function setPage(t) {
    tab = t; $('app').setAttribute('data-page', t);
    $('pane-skills').hidden = t !== 'skills'; $('pane-stats').hidden = t !== 'stats';
    closeDrawer(); refreshAll();
    if (t === 'skills') requestAnimationFrame(function () { if (!tree.fitted) fitTree(); });
  }
  function refreshAll() {
    refreshTop();
    if (!el.drawer.hidden) refreshItems();
    if (tab === 'skills') { refreshTree(); refreshPres(); } else if (tab === 'stats') refreshStats();
  }
  function refreshPres() {
    var g = K.starsGain(); el.btnPres.classList.toggle('ready', g >= 1);
    el.presBadge.textContent = '+' + g; el.presBadge.hidden = g < 1;
  }

  function setup() {
    ['stage', 'money', 'dps', 'cleanbar', 'cleanLabel', 'cleanWrap', 'sp', 'stars', 'status', 'gens', 'spInfo', 'starInfo', 'spNext', 'toasts', 'sheet', 'sheetBody',
      'btnPres', 'presBadge', 'stats', 'qty', 'tooth', 'drawer', 'drawerMoney', 'drawerClose', 'btnMenu', 'menuBadge', 'tip', 'tipText', 'tipClose', 'fabSkill', 'fabSkillBadge', 'fabStats',
      'backSkills', 'backStats', 'btnSettings', 'cdfill', 'treeWrap', 'treeSvg', 'treeG', 'treeLines', 'treeNodes', 'treeHelp'].forEach(function (k) { el[k] = $(k); });
    svg = el.tooth; stainsG = $('stains');
    setupStage(); buildItems(); buildTree(); setupTree(); buildStains(false);
    el.qty.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      K.T.buyQty = b.dataset.q === 'max' ? 'max' : +b.dataset.q;
      Array.prototype.forEach.call(el.qty.children, function (c) { c.classList.toggle('on', c === b); }); refreshItems();
    });
    el.btnMenu.addEventListener('click', function () { if (el.drawer.hidden) openDrawer(); else closeDrawer(); });
    el.drawerClose.addEventListener('click', closeDrawer);
    el.drawer.addEventListener('click', function (e) { if (e.target === el.drawer) closeDrawer(); });
    el.fabSkill.addEventListener('click', function () { setPage('skills'); });
    el.fabStats.addEventListener('click', function () { setPage('stats'); });
    el.backSkills.addEventListener('click', function () { setPage('home'); });
    el.backStats.addEventListener('click', function () { setPage('home'); });
    el.btnPres.addEventListener('click', openPrestige);
    el.btnSettings.addEventListener('click', openSettings);
    el.sheet.addEventListener('click', function (e) { if (e.target === el.sheet && sheetArmed()) closeSheet(); });
    el.tipClose.addEventListener('click', function () { K.S.tutOff = true; K.save(); refreshTip(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) K.save(); });
    window.addEventListener('pagehide', K.save);
    el.stats.addEventListener('click', function (e) { if (e.target.closest('#btnTitle')) openTitles(); if (e.target.closest('#btnAchv')) openAchv(); });
    achvBuild(); tutBuild();
  }

  function start() {
    K.init(); setup();
    var gap = (Date.now() - K.S.saved) / 1000;
    if (gap > 60 && K.dps() > 0) { var r = K.offlineGain(gap); if (r.gain > 0) showOffline(r); }
    refreshTree(); setPage('home');
    var last = Date.now(), lastSave = Date.now(), lastUi = 0; window.__kgPaused = false;
    setInterval(function () {
      if (window.__kgPaused) return;
      var now = Date.now(), dt = (now - last) / 1000; last = now;
      if (dt > 20) { var r2 = K.offlineGain(dt); if (r2.gain > 0) showOffline(r2); dt = 0; }
      K.step(Math.min(dt, 1)); K.sync(nowSec()); lastUi += dt; refreshTop();
      if ((tutN = (tutN + 1) % 3) === 0) tutTick();
      if (lastUi >= 0.5) { lastUi = 0; if (!el.drawer.hidden) refreshItems(); if (tab === 'skills') { refreshTree(); refreshPres(); } else if (tab === 'stats') refreshStats(); }
      if (now - lastSave > 8000) { lastSave = now; K.save(); }
    }, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
