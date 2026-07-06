/* ============================================================================
   POLARIS CRM DEMO — app + simulation engine.
   One in-memory store cloned from PD (polaris-data.js). Every screen renders
   from the store, so the simulation's mutations reconcile everywhere.
   The sim is an array of {t, route, caption, fn} steps run by one timer —
   pause, reset and reduced-motion instant mode come free.
   ========================================================================== */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var S; /* the store */
  var INR = /inr/.test(location.search); /* ?inr = India cut: rupees, Indian numbers, WhatsApp-first */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function money(n) { return INR ? "₹" + n.toLocaleString("en-IN") : "£" + n.toLocaleString("en-GB"); }
  if (INR) (function () {
    var rup = function (v) { return v >= 3000 ? v * 100 : v * 10; }; /* big treatments in lakhs, small visits in thousands */
    window.PD.opps.forEach(function (o) { o.v = rup(o.v); });
    window.PD.closed.won.value *= 100; window.PD.closed.lost.value *= 100;
    window.PD.sofia.value = rup(window.PD.sofia.value);
    /* full India recast — names, clinic, links, phrasing — applied across every screen at once */
    var MAP = {
      "Harbourview Dental": "Lotus Dental Care", "hvd.link/book": "ldc.link/book",
      "Elena Marsh": "Ananya Rao", "Dr. Marsh": "Dr. Rao", "Tomas Reid": "Rohan Mehta", "Dr. Reid": "Dr. Mehta",
      "Maya Chen": "Maya Iyer", "Sofia Tanaka": "Sonali Tandon", "Hi Sofia": "Hi Sonali",
      "Liam O'Connor": "Arjun Nair", "Hi Liam": "Hi Arjun", "Daniel Park": "Devansh Kapoor", "Hi Daniel": "Hi Devansh",
      "Daniel Park's": "Devansh Kapoor's", "Hana Mori": "Sana Sheikh", "Hi Hana": "Hi Sana",
      "Chloe Bennett": "Kavya Menon", "Hi Chloe": "Hi Kavya", "Grace Whitmore": "Gauri Deshpande", "Hi Grace": "Hi Gauri",
      "Marcus Reed": "Manav Reddy", "Amara Osei": "Amrita Bose", "Yuki Yamamoto": "Yusuf Khan",
      "Tom Ellery": "Tarun Malhotra", "Peter Lindqvist": "Pranav Kulkarni", "Isabelle Fournier": "Ishita Fernandes",
      "Nadia Rahman": "Nadia Rahman", "Sarah Okonkwo": "Sarita Joshi", "Jonas Weber": "Jai Verma",
      "Emily Zhang": "Esha Shah", "Robert Fenwick": "Rahul Bhatt", "Aria Novak": "Aarohi Nambiar",
      "Oliver Danes": "Om Dwivedi", "Felix Arnaud": "Farhan Ali",
      "R. Calloway": "R. Chawla", "M. Osei": "M. Bose", "T. Nguyen": "T. Nair", "J. Weber": "J. Verma",
      "P. Lindqvist": "P. Kulkarni", "A. Novak": "A. Nambiar",
      "Ben Okafor": "Bilal Qureshi", "Rita Kaplan": "Ritika Kapadia", "Sam Whittle": "Sameer Wadhwa",
      "Lena Baros": "Leela Bajaj", "Aldo Ricci": "Aditya Rangan",
      "Marcus —": "Manav —", "School run is chaos": "School pickup is madness",
      "Bring any recent X-rays": "Bring any recent X-rays or scans"
    };
    var blob = JSON.stringify(window.PD);
    Object.keys(MAP).forEach(function (k) { blob = blob.split(k).join(MAP[k]); });
    window.PD = JSON.parse(blob);
    window.PD.sofia.phone = "+91 98200 21491";
    window.PD.link = "ldc.link/book";
  })();
  window.PD.link = window.PD.link || "hvd.link/book";
  function initials(n) { return n.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }
  function reset() { S = clone(window.PD); S.sim = { ran: false, bell: 0 }; }
  reset();

  /* ---------------- icons (tiny inline set) ---------------- */
  var IC = {
    dash: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/></svg>',
    convo: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><path d="M2 3h12v8H8l-3.5 3V11H2z"/></svg>',
    cal: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 6h13M5 1v3M11 1v3"/></svg>',
    people: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><circle cx="5.5" cy="5" r="2.4"/><path d="M1.5 14c.4-2.8 2-4.2 4-4.2s3.6 1.4 4 4.2M10.5 6.6a2.2 2.2 0 1 0 0-4.4M11 9.9c1.9.2 3.2 1.5 3.5 4.1"/></svg>',
    opp: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><path d="M2 2.5h3.4v11H2zM6.3 2.5h3.4v7H6.3zM10.6 2.5H14v9h-3.4z"/></svg>',
    auto: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><circle cx="8" cy="3" r="1.6"/><circle cx="3.5" cy="12.5" r="1.6"/><circle cx="12.5" cy="12.5" r="1.6"/><path d="M8 4.7v3M8 7.7l-3.6 3.4M8 7.7l3.6 3.4"/></svg>',
    rep: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/></svg>',
    gear: '<svg viewBox="0 0 16 16" fill="none" stroke-width="1.5"><circle cx="8" cy="8" r="2.3"/><path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4"/></svg>',
    sms: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 3h12v8H8l-3.5 3V11H2z"/></svg>',
    wa: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2a6 6 0 0 0-5.2 9L2 14l3.1-.8A6 6 0 1 0 8 2z"/></svg>',
    em: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="M1.5 4.5L8 9l6.5-4.5"/></svg>',
    call: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 2.5C3 8.9 7.1 13 13.5 13l.5-2.8-3-1-1.2 1.2A8.4 8.4 0 0 1 5.6 6.2L6.8 5l-1-3z"/></svg>',
    int: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M5.5 8h5M8 5.5v5"/></svg>'
  };
  function chIcon(ch) { return '<span class="chic">' + (IC[ch] || IC.sms) + "</span>"; }

  /* ---------------- router ---------------- */
  var VIEWS = ["dashboard", "conversations", "calendars", "contacts", "opportunities", "automation", "reputation", "settings"];
  function go(v, silent) {
    if (VIEWS.indexOf(v) === -1) v = "dashboard";
    $$(".view").forEach(function (el) { el.classList.toggle("on", el.id === "v-" + v); });
    $$(".nav button[data-v]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === v); });
    if (!silent && location.hash !== "#/" + v && history.replaceState) history.replaceState(null, "", "#/" + v);
    $(".main").scrollTop = 0;
  }
  addEventListener("hashchange", function () { go(location.hash.replace("#/", "")); });

  /* ---------------- renders ---------------- */
  function renderAll() {
    renderDash(); renderConvoList(); renderThread(S.threadOpen || "t1");
    renderKanban(); renderCalendar(); renderApptList(); renderWorkflows(); renderEnrolls();
    renderRep(); renderContacts(); renderBadge(); renderBell();
  }
  function renderBadge() {
    var n = S.threads.filter(function (t) { return t.unread; }).length;
    var b = $("#unreadBadge"); b.textContent = n; b.hidden = n === 0;
  }
  function renderBell() {
    var i = $("#bellCount"); i.textContent = S.sim.bell; i.hidden = S.sim.bell === 0;
  }

  /* dashboard — derived from the store so the sim reconciles */
  function renderDash() {
    var open = S.opps.length, openV = S.opps.reduce(function (a, o) { return a + o.v; }, 0);
    var won = S.closed.won, lost = S.closed.lost, ab = S.closed.abandoned;
    var total = open + won.count + lost.count + ab.count;
    var conv = Math.round((won.count / (total - open - ab.count + won.count)) * 100); /* won ÷ decided-ish; matches the 36% seed */
    conv = Math.round((won.count / (won.count + lost.count + open + ab.count)) * 100);
    var C = 2 * Math.PI * 34, segs = [], acc2 = 0;
    [[open, "#23272F"], [won.count, "#16A34A"], [lost.count, "#DC2626"], [ab.count, "#9CA3AF"]].forEach(function (s) {
      var frac = s[0] / total;
      segs.push('<circle cx="42" cy="42" r="34" fill="none" stroke="' + s[1] + '" stroke-width="10" stroke-dasharray="' + (C * frac).toFixed(1) + " " + C.toFixed(1) + '" stroke-dashoffset="' + (-C * acc2).toFixed(1) + '" transform="rotate(-90 42 42)"/>');
      acc2 += frac;
    });
    $("#wDonut").innerHTML = '<div class="donutrow"><svg width="84" height="84" viewBox="0 0 84 84">' + segs.join("") +
      '<text x="42" y="47" text-anchor="middle" font-size="17" font-weight="700" fill="#111827">' + total + "</text></svg>" +
      '<div class="legend"><span><i style="background:#2563EB"></i>Open · ' + open + "</span><span><i style=\"background:#16A34A\"></i>Won · " + won.count + "</span>" +
      '<span><i style="background:#DC2626"></i>Lost · ' + lost.count + '</span><span><i style="background:#9CA3AF"></i>Abandoned · ' + ab.count + "</span></div></div>";
    $("#wValue").innerHTML = '<div class="bignum" id="oppValue">' + money(openV) + "</div><div class=\"subrow\">Won " + money(won.value) + " · Lost " + money(lost.value) + "</div>";
    $("#wConv").innerHTML = '<div class="bignum">' + conv + "%<small>won ÷ all</small></div><div class=\"subrow\">New Patient Pipeline</div>";
    $("#wAppt").innerHTML = '<div class="bignum" id="apptNum">' + S.apptStat.booked + '</div><div class="subrow">show rate ' + S.apptStat.showRate + "%</div>";
    var mx = S.funnel[0][1];
    $("#wFunnel").innerHTML = S.funnel.map(function (f) {
      return '<div class="bar"><b>' + f[0] + '</b><div class="tr"><i style="width:' + (f[1] / mx * 100) + '%"></i></div><em>' + f[1] + " · " + Math.round(f[1] / mx * 100) + "%</em></div>";
    }).join("");
    var perStage = S.stages.map(function (_, i) { return S.opps.filter(function (o) { return o.st === i; }).length; });
    var pm = Math.max.apply(null, perStage);
    $("#wStages").innerHTML = '<div class="cols">' + perStage.map(function (c, i) {
      return '<div class="c"><i style="height:' + (c / pm * 70 + 6) + 'px"></i>' + c + "</div>";
    }).join("") + "</div>";
    $("#wTasks").innerHTML = S.tasks.map(function (t) {
      return '<div class="row2"><span>' + t.t + '</span><span class="due' + (t.over ? " over" : "") + '">' + t.due + "</span></div>";
    }).join("");
    $("#wManual").innerHTML = '<div class="manual"><span><b>' + S.manualActions + "</b> pending manual actions</span><a href=\"#\" onclick=\"return false\">Let's Go →</a></div>";
  }

  /* conversations */
  function snippet(t) {
    var m = t.msgs[t.msgs.length - 1];
    return m.who === "call" ? "Missed Call" : m.tx;
  }
  function renderConvoList() {
    $("#clist").innerHTML = S.threads.map(function (t) {
      return '<button class="cthread' + (t.unread ? " unread" : "") + (S.threadOpen === t.id ? " on" : "") + '" data-t="' + t.id + '">' +
        '<span class="av">' + initials(t.n) + '</span><span class="cb"><span class="l1"><b>' + t.n + "</b>" + chIcon(t.ch) +
        '<span class="tm">' + t.time + '</span></span><span class="snip">' + snippet(t) + "</span></span></button>";
    }).join("");
  }
  function bubble(m, wf) {
    if (m.who === "call") return '<div class="callcard' + (m.sim ? " sim-new" : "") + '"><span class="ic">' + IC.call + "</span><span><b>Missed Call</b><small>Duration 0:00 · " + m.tm + "</small></span></div>";
    if (m.who === "note") return '<div class="bub note">' + m.tx + '<span class="meta">Internal comment · ' + m.tm + "</span></div>";
    var meta = m.tm + (m.who === "out" ? " · Delivered" : "") + (m.auto ? " · Automated" : "");
    return '<div class="bub ' + (m.who === "in" ? "in" : "out") + (m.sim ? " sim-new" : "") + '">' + m.tx +
      (m.att ? '<div style="margin-top:6px"><span class="tag">📎 ' + m.att + "</span></div>" : "") +
      '<span class="meta">' + meta + (m.wf ? '<span class="wftag">' + m.wf + "</span>" : "") + "</span></div>";
  }
  function renderThread(id) {
    S.threadOpen = id;
    var t = S.threads.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    $("#thName").innerHTML = "<b>" + t.n + "</b>" + (t.phone ? ' <span class="mut2" style="color:var(--cap);font-size:11px">' + t.phone + "</span>" : "");
    var html = "", divDone = false;
    t.msgs.forEach(function (m) {
      if (m.new && !divDone) { html += '<div class="newdiv">NEW</div>'; divDone = true; }
      html += bubble(m);
    });
    $("#tmsgs").innerHTML = html;
    var box = $("#tmsgs"); box.scrollTop = box.scrollHeight;
    $("#cpFields").innerHTML =
      '<div class="fld"><label>First Name</label>' + t.n.split(" ")[0] + "</div>" +
      '<div class="fld"><label>Last Name</label>' + (t.n.split(" ")[1] || "—") + "</div>" +
      '<div class="fld"><label>Phone</label>' + (t.phone || (INR ? "+91 98200 002" : "07700 9002") + (("0" + t.id.replace("t", "")).slice(-2))) + "</div>" +
      '<div class="fld"><label>Contact Type</label>Lead</div>' +
      '<div class="fld"><label>Owner</label>' + S.me.n + '</div>' +
      '<div class="fld"><label>Tags</label>' + t.tags.map(function (g) { return '<span class="tag' + (g === "demo-simulation" ? " sim" : "") + '">' + g + "</span>"; }).join("") + "</div>" +
      '<div class="fld"><label>DND</label>' + ["Email", "Text", "Calls", "WhatsApp"].map(function (c) { return '<div class="dnd">' + c + '<span class="sw2"></span></div>'; }).join("") + "</div>";
    renderConvoList();
    renderBadge();
  }

  /* opportunities */
  function renderKanban() {
    $("#kanban").innerHTML = S.stages.map(function (st, i) {
      var cards = S.opps.filter(function (o) { return o.st === i; });
      var v = cards.reduce(function (a, o) { return a + o.v; }, 0);
      return '<div class="kcol" data-st="' + i + '"><h4>' + st + " — " + cards.length + "<em>" + money(v) + "</em></h4>" +
        cards.map(function (o) {
          return '<div class="kcard' + (o.sim ? " sim-new" : "") + '" draggable="true" data-o="' + o.id + '"><b>' + o.n + '</b><div class="kv">' + money(o.v) +
            (o.tag ? ' · <span class="tag' + (o.tag === "demo-simulation" ? " sim" : "") + '">' + o.tag + "</span>" : "") + "</div>" +
            '<div class="kfoot">' + o.days + "d in stage" + (o.chat ? ' · 💬' : "") + '<span class="av" title="' + S.staff[o.owner].n + '">' + initials(S.staff[o.owner].n) + "</span></div></div>";
        }).join("") + "</div>";
    }).join("");
    $("#closedRow").innerHTML = '<span class="pill">Won ' + S.closed.won.count + " · " + money(S.closed.won.value) +
      '</span><span class="pill">Lost ' + S.closed.lost.count + " · " + money(S.closed.lost.value) + " — “" + S.closed.lost.reason + "”" +
      '</span><span class="pill">Abandoned ' + S.closed.abandoned.count + "</span>";
    wireDrag();
  }
  function wireDrag() {
    var dragId = null;
    $$(".kcard").forEach(function (c) {
      c.addEventListener("dragstart", function () { dragId = c.getAttribute("data-o"); c.classList.add("dragging"); });
      c.addEventListener("dragend", function () { c.classList.remove("dragging"); });
    });
    $$(".kcol").forEach(function (col) {
      col.addEventListener("dragover", function (e) { e.preventDefault(); col.classList.add("dropover"); });
      col.addEventListener("dragleave", function () { col.classList.remove("dropover"); });
      col.addEventListener("drop", function (e) {
        e.preventDefault(); col.classList.remove("dropover");
        var o = S.opps.filter(function (x) { return x.id === dragId; })[0];
        if (o) { o.st = parseInt(col.getAttribute("data-st"), 10); o.days = 0; renderKanban(); renderDash(); }
      });
    });
  }

  /* calendar */
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  function renderCalendar() {
    var head = '<div class="hd"></div>' + DAYS.map(function (d, i) { return '<div class="hd">' + d + (i === 1 ? " · tomorrow" : "") + "</div>"; }).join("");
    var rows = "";
    for (var h = 8; h < 18; h++) {
      rows += '<div class="hr">' + h + ":00</div>";
      for (var d = 0; d < 5; d++) {
        var apt = S.appts.filter(function (a) { return a.d === d && a.h === h; })[0];
        rows += '<div class="cell">' + (apt ?
          '<div class="apt' + (apt.st === "No Show" ? " noshow" : "") + (apt.sim ? " sim-new" : "") + '" style="background:' + S.staff[apt.who].c + (apt.m ? ";top:50%" : "") + '" title="' + apt.n + " — " + apt.t + '">' +
          apt.n + "<small>" + apt.t + " · " + apt.st + "</small></div>" : "") + "</div>";
      }
    }
    $("#calgrid").innerHTML = head + rows;
  }
  function renderApptList() {
    $("#apptRows").innerHTML = S.appts.slice().sort(function (a, b) { return a.d - b.d || a.h - b.h; }).map(function (a) {
      var opts = ["Confirmed", "Showed", "No Show", "Cancelled", "Invalid"].map(function (o) {
        return "<option" + (o === a.st ? " selected" : "") + ">" + o + "</option>";
      }).join("");
      return '<div class="lr' + (a.sim ? " sim-new" : "") + '"><span class="who2">' + a.n + '</span><span class="mut2">' + DAYS[a.d] + " " + a.h + ":" + (a.m ? "30" : "00") + '</span><span class="mut2">' + a.t + '</span><span class="mut2">' + S.staff[a.who].n + "</span><select disabled>" + opts + "</select></div>";
    }).join("");
  }

  /* automation */
  function renderWorkflows() {
    $("#wfRows").innerHTML = S.wfs.map(function (w, i) {
      return '<button class="wrow" data-w="' + i + '"><span class="wname">' + w.n + '</span><span class="pub ' + (w.pub ? "on" : "off") + '">' + (w.pub ? "PUBLISHED" : "DRAFT") + '</span><span class="mut2">' + w.enr + ' enrolled</span><span class="mut2" style="margin-left:auto">Updated ' + w.upd + "</span></button>";
    }).join("");
    $("#wfCanvas").innerHTML = S.wfNodes.map(function (n, i) {
      return (i ? '<div class="connector"></div>' : "") +
        '<div class="node' + (n.k === "trigger" ? " trigger" : "") + '"><b><span class="ic2">' + (n.k === "trigger" ? "⚡" : n.k === "sms" ? "✉" : n.k === "wait" ? "⏱" : "⑂") + "</span>" + n.t + "</b>" +
        '<div class="nd">' + n.d + "</div>" + (n.d2 ? '<div class="nd">' + n.d2 + "</div>" : "") +
        (n.stat ? '<div class="nstat">' + n.stat + "</div>" : "") + "</div>";
    }).join("");
  }
  function renderEnrolls() {
    $("#enrollRows").innerHTML = S.enroll.map(function (e) {
      return '<div class="lr' + (e.sim ? " sim-new" : "") + '"><span class="who2">' + e.n + '</span><span class="mut2">Enrolled at ' + e.at + '</span><span class="mut2">' + e.why + '</span><span class="stchip ' + (e.st === "finished" ? "ok" : "warn") + '" style="margin-left:auto">' + e.st + "</span></div>";
    }).join("");
  }

  /* reputation */
  function renderRep() {
    var r = S.rep;
    $("#repGrid").innerHTML =
      '<div class="card widget"><h3>Invite Goals</h3><div class="bignum">' + r.goals[0] + "<small>/ " + r.goals[1] + ' this month</small></div><div class="fun" style="margin-top:8px"><div class="bar"><div class="tr" style="flex:1"><i style="width:' + (r.goals[0] / r.goals[1] * 100) + '%"></i></div></div></div></div>' +
      '<div class="card widget"><h3>Reviews Received</h3><div class="bignum">' + r.received + '<small>↑ ' + r.delta + " this month</small></div></div>" +
      '<div class="card widget"><h3>Average Rating</h3><div class="bignum">' + r.avg + '</div><div class="stars">★★★★★</div></div>' +
      '<div class="card widget"><h3>Invite Trends</h3><div class="subrow">SMS ' + r.sms + " · Email " + r.em + '</div><div class="cols" style="height:42px;margin-top:12px">' + [r.sms, r.em].map(function (v, i) { return '<div class="c"><i style="height:' + (v / r.sms * 42 + 6) + 'px"></i>' + (i ? "Email" : "SMS") + "</div>"; }).join("") + "</div></div>" +
      '<div class="card widget wide"><h3>Review Trends <small>last 6 months</small></h3><div class="cols">' + r.trend.map(function (v) { return '<div class="c"><i style="height:' + (v / 23 * 70 + 4) + 'px"></i>' + v + "</div>"; }).join("") + "</div></div>";
    $("#repRows").innerHTML = r.reviews.map(function (rv) {
      return '<div class="rrow"><span class="av">' + initials(rv.n) + '</span><span><b>' + rv.n + '</b> <span class="mut2" style="color:var(--cap)">· ' + (rv.src === "google" ? "Google" : "Facebook") + " · " + rv.d + '</span><div class="stars">' + "★".repeat(rv.stars) + "☆".repeat(5 - rv.stars) + "</div>" + rv.tx +
        (rv.draft ? '<div class="rdraft"><b>DRAFT REPLY</b><br>' + rv.draft + "</div>" : "") + '</span><span class="respond">Respond</span></div>';
    }).join("");
    $("#reqRows").innerHTML = r.requests.map(function (q) {
      return '<div class="lr"><span class="who2">' + q.n + "</span>" + chIcon(q.ch) + '<span class="mut2">' + q.d + '</span><span class="stchip ' + (q.st === "Clicked" ? "blue" : "mute") + '" style="margin-left:auto">' + q.st + "</span></div>";
    }).join("");
  }

  /* contacts */
  function renderContacts() {
    var seen = {}, rows = [];
    S.threads.forEach(function (t) { if (t.ch !== "int" && !seen[t.n]) { seen[t.n] = 1; rows.push({ n: t.n, tags: t.tags, act: t.time + " ago" }); } });
    S.opps.forEach(function (o) { if (!seen[o.n]) { seen[o.n] = 1; rows.push({ n: o.n, tags: [o.tag], act: o.days + "d ago" }); } });
    $("#ctBody").innerHTML = rows.map(function (c, i) {
      return "<tr><td><span class=\"av\" style=\"margin-right:8px\">" + initials(c.n) + "</span><b>" + c.n + "</b></td><td>(555) 01" + i + "-24" + i + "1</td><td>" + c.n.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com</td><td>Jun 2026</td><td>" + c.act + "</td><td>" + (c.tags || []).map(function (g) { return g ? '<span class="tag' + (g === "demo-simulation" ? " sim" : "") + '">' + g + "</span>" : ""; }).join("") + "</td></tr>";
    }).join("");
    $("#ctFoot").textContent = "Showing 1–" + rows.length + " of " + rows.length;
  }

  /* ---------------- toasts ---------------- */
  function toast(html) {
    var el = document.createElement("div"); el.className = "toast"; el.innerHTML = html;
    $("#toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 5200);
  }

  /* ---------------- THE SIMULATION ---------------- */
  var simTimer = [], simRunning = false;
  function cap(t) { $("#simCap").textContent = t; }
  var STEPS = [
    { t: 0, route: "conversations", c: "Step 1 of 7 — a call rings out. Nobody is free to answer.", fn: function () {
        S.sim.bell += 1; renderBell();
        S.threads.unshift({ id: "sim", n: S.sofia.n, ch: "call", unread: true, time: "now", phone: S.sofia.phone,
          tags: ["demo-simulation"], msgs: [{ who: "call", tx: "Missed Call", tm: "Just now", sim: true }] });
        renderConvoList(); renderBadge(); renderThread("sim");
      } },
    { t: 3, route: "conversations", c: "Step 2 of 7 — the workflow texts back automatically. No human touched it.", fn: function () {
        simThread().msgs.push({ who: "out", tx: "Hi " + S.sofia.n.split(" ")[0] + ", this is " + S.clinic + " — sorry we missed your call! Reply here or book directly: " + S.link, tm: "Just now", auto: true, wf: "Missed Call → Instant Text-Back", sim: true });
        renderThread("sim");
      } },
    { t: 6, route: "conversations", c: "Step 3 of 7 — the patient replies. The lead now exists in the system.", fn: function () {
        simThread().msgs.push({ who: "in", tx: "I chipped a tooth this morning — can I come in tomorrow??", tm: "Just now", sim: true });
        simThread().tags = ["demo-simulation", "missed-call-recovered"];
        renderThread("sim");
      } },
    { t: 9, route: "conversations", c: "Step 4 of 7 — booking link sent; she books the empty 10:30 slot.", fn: function () {
        simThread().msgs.push({ who: "out", tx: "That sounds painful — let's get you seen. Tomorrow 10:30 am with Dr. " + S.staff[1].n.split(" ").pop() + " is open, book it here: " + S.link, tm: "Just now", auto: true, sim: true });
        renderThread("sim");
      } },
    { t: 12, route: "calendars", c: "Step 5 of 7 — the appointment lands on tomorrow's calendar, confirmed.", fn: function () {
        toast("<b>New appointment</b> — " + S.sofia.n + " · Emergency Exam · tomorrow 10:30 AM"); /* fires ON the calendar cut: link sent → booking lands, causality visible */
        S.appts.push({ d: 1, h: 10, m: 30, len: 1, n: S.sofia.n, t: "Emergency Exam", who: 1, st: "Confirmed", sim: true });
        S.apptStat.booked += 1;
        renderCalendar(); renderApptList();
      } },
    { t: 16, route: "opportunities", c: "Step 6 of 7 — a new opportunity appears and moves to Consultation Booked.", fn: function () {
        S.opps.push({ id: "simo", n: S.sofia.n, v: S.sofia.value, st: 0, days: 0, tag: "demo-simulation", owner: 3, sim: true });
        renderKanban();
        simTimer.push(setTimeout(function () {
          var o = S.opps.filter(function (x) { return x.id === "simo"; })[0];
          if (o) { o.st = 2; renderKanban(); renderDash(); }
        }, RM ? 60 : 1600));
      } },
    { t: 21, route: "dashboard", c: "Step 7 of 7 — every number updates: value, open count, appointments.", fn: function () {
        renderDash();
      } },
    { t: 25, route: "dashboard", c: "Done in ~25 seconds. No human touched it. The run is logged under Automation → Enrollment History.", fn: function () {
        S.enroll.unshift({ n: S.sofia.n, at: "Just now", why: "Call Status", st: "finished", sim: true });
        S.wfs[0].enr += 1;
        renderEnrolls(); renderWorkflows();
        simRunning = false;
        $("#simGo").disabled = false;
      } }
  ];
  function simThread() { return S.threads.filter(function (t) { return t.id === "sim"; })[0]; }
  function runSim() {
    if (simRunning) return;
    resetSim(true);
    simRunning = true; S.sim.ran = true;
    $("#simGo").disabled = true;
    var speed = RM ? 0.28 : 1; /* reduced motion: brisk step-through, no pulses (CSS kills them) */
    STEPS.forEach(function (s) {
      simTimer.push(setTimeout(function () {
        go(s.route, true); cap(s.c); s.fn();
      }, s.t * 1000 * speed));
    });
  }
  function resetSim(silent) {
    simTimer.forEach(clearTimeout); simTimer = [];
    simRunning = false;
    var open = S.threadOpen && S.threadOpen !== "sim" ? S.threadOpen : "t1";
    reset(); S.threadOpen = open;
    renderAll();
    $("#simGo").disabled = false;
    cap(silent ? "Running…" : "Demo reset — sample data restored.");
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target;
    var nv = el.closest(".nav button[data-v]");
    if (nv) { go(nv.getAttribute("data-v")); return; }
    var th = el.closest(".cthread[data-t]");
    if (th) {
      var t = S.threads.filter(function (x) { return x.id === th.getAttribute("data-t"); })[0];
      if (t) { t.unread = false; }
      renderThread(th.getAttribute("data-t"));
      return;
    }
    var wr = el.closest(".wrow[data-w]");
    if (wr) { $("#builderWrap").hidden = false; $(".main").scrollTop = 0; return; }
    if (el.closest("#btnBackWf")) { $("#builderWrap").hidden = true; return; }
    if (el.closest("#simGo")) { runSim(); return; }
    if (el.closest("#simReset")) { resetSim(); return; }
    if (el.closest("#loginBtn")) { $("#login").hidden = true; return; }
    var ct = el.closest(".cal-tabs button[data-ct]");
    if (ct) {
      $$(".cal-tabs button").forEach(function (b) { b.classList.toggle("on", b === ct); });
      var list = ct.getAttribute("data-ct") === "list";
      $("#calGridWrap").hidden = list; $("#calListWrap").hidden = !list;
      return;
    }
  });
  addEventListener("keydown", function (e) {
    if (e.key === " " && simRunning && document.activeElement === document.body) { e.preventDefault(); resetSim(); cap("Paused (reset). Press Simulate to replay."); }
  });

  /* ---------------- boot ---------------- */
  $$(".nav button[data-v]").forEach(function (b) {
    var v = b.getAttribute("data-v");
    b.innerHTML = '<span style="display:inline-flex;width:16px;height:16px">' + (IC[b.getAttribute("data-ic")] || "") + "</span><span>" + b.textContent + "</span>" +
      (v === "conversations" ? '<span class="unread" id="unreadBadge" hidden>0</span>' : "");
  });
  if (INR) { var cs = document.querySelector(".chsel"); if (cs) cs.textContent = "WhatsApp ▾"; }
  (function brandChrome() { /* clinic + persona read from data, so the India cut recasts everything */
    document.title = "Polaris · " + window.PD.clinic;
    var loc = document.querySelector(".loc"); if (loc) loc.textContent = window.PD.clinic;
    var sub = document.querySelector(".login .sub"); if (sub) sub.textContent = window.PD.clinic + " · " + window.PD.me.role;
    var who = document.querySelector("#loginBtn b"); if (who) who.textContent = "Continue as " + window.PD.me.n;
    var ini = window.PD.me.n.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
    var av = document.querySelector("#loginBtn .av"); if (av) av.textContent = ini;
    var me = document.querySelector(".meav"); if (me) { me.textContent = ini; me.title = window.PD.me.n + " — " + window.PD.me.role; }
    var biz = document.querySelector("#v-settings .fld"); if (biz) biz.innerHTML = "<label>Business Name</label>" + window.PD.clinic;
  })();
  S.threadOpen = "t1";
  renderAll();
  go(location.hash.replace("#/", "") || "dashboard", true);
})();
