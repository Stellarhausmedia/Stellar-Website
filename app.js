/* Stellar Haus Media — shared behaviour + effects (reduced-motion safe, never gates content) */
(function () {
  var root = document.documentElement, RM = root.classList.contains("rm");
  var G = !RM && window.gsap && window.ScrollTrigger;
  if (G) gsap.registerPlugin(ScrollTrigger);

  /* ONE-THEME MODE: the page never mixes dark and light sections any more (the owner found the
     alternation jarring). Every themed element is remapped to a single family per mode — dark =
     navy shades only, light = pale shades only; the mint/gold statement fields stay in both.
     The head script restores html.light from localStorage before first paint; this remap runs
     before any module reads section classes (same synchronous IIFE). */
  var themeHooks = []; /* modules that cache theme-derived colours register a refresh here */
  var THEME_KEYS = ["s-ink", "s-ink2", "s-surf", "s-surf2", "s-surf3", "s-lt", "s-lt2", "s-lt3", "s-per", "s-white", "s-gold", "s-goldd", "s-mint2", "s-mintd", "s-rose", "s-rosed"];
  var THEME_DARK = { "s-lt": "s-surf", "s-lt2": "s-surf2", "s-lt3": "s-surf3", "s-per": "s-surf2", "s-white": "s-surf", "s-gold": "s-goldd", "s-mint2": "s-mintd", "s-rose": "s-rosed" }; /* dark mode deepens every closing field — no bright block at the end of the page */
  var THEME_LIGHT = { "s-ink": "s-lt", "s-ink2": "s-per", "s-surf": "s-lt2", "s-surf2": "s-gold", "s-surf3": "s-lt3" }; /* light mode: ink→pink, ink2→periwinkle, surf→mint, surf2→gold, surf3→coral — five brand fields */
  function applyTheme(light) {
    root.classList.toggle("light", light);
    var nodes = [], seen = [];
    for (var i = 0; i < THEME_KEYS.length; i++) {
      var found = document.getElementsByClassName(THEME_KEYS[i]);
      for (var j = 0; j < found.length; j++) if (seen.indexOf(found[j]) < 0) { seen.push(found[j]); nodes.push(found[j]); }
    }
    nodes.forEach(function (el) {
      if (!el.getAttribute("data-sc")) {
        for (var k = 0; k < THEME_KEYS.length; k++) if (el.classList.contains(THEME_KEYS[k])) { el.setAttribute("data-sc", THEME_KEYS[k]); break; }
      }
      var auth = el.getAttribute("data-sc");
      var target = light ? (THEME_LIGHT[auth] || auth) : (THEME_DARK[auth] || auth);
      for (var m = 0; m < THEME_KEYS.length; m++) if (THEME_KEYS[m] !== target) el.classList.remove(THEME_KEYS[m]);
      el.classList.add(target);
    });
    var tg = document.querySelector(".tgl");
    if (tg) tg.setAttribute("aria-pressed", light ? "true" : "false");
  }
  applyTheme(root.classList.contains("light"));
  [].slice.call(document.querySelectorAll(".tgl")).forEach(function (b) {
    b.addEventListener("click", function () {
      var light = !root.classList.contains("light");
      applyTheme(light);
      try { localStorage.setItem("shm_theme", light ? "light" : "dark"); } catch (e) {}
      themeHooks.forEach(function (f) { try { f(); } catch (e) {} });
    });
  });

  /* loading screen */
  var _loader = document.getElementById("loader");
  if (_loader && root.classList.contains("loading")) {
    setTimeout(function () { _loader.classList.add("lift"); }, 1100);
    setTimeout(function () { root.classList.remove("loading"); }, 1950);
  }

  /* Lenis smooth scroll (driven by GSAP ticker when available so ScrollTrigger stays in sync) */
  var lenis = null;
  if (!RM && window.Lenis) {
    /* touch scrolling stays NATIVE (no syncTouch): in this Lenis build (1.3.25) the syncTouch path
       preventDefaults touchend, which kills tap→click synthesis — verified empirically: with it on,
       NOTHING on the page is tappable on a touch device. Scroll-driven scenes track native touch
       scroll fine via ScrollTrigger; the phone hero gets its pacing from the longer runway instead. */
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    if (G) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }

  /* smooth in-page anchor links */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length > 1) {
        var el = document.querySelector(id);
        if (el) { e.preventDefault(); if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.2 }); else el.scrollIntoView({ behavior: "smooth" }); }
      }
    });
  });

  /* smooth page transitions between internal pages: the page fades while the star winks, then we go */
  if (!RM) {
    var ptOv = null;
    /* CRITICAL: browsers restore back/forward pages from cache exactly as they left — mid-wink,
       that means a faded page behind a solid colour panel ("all the text disappeared"). Reset. */
    addEventListener("pageshow", function () {
      document.body.classList.remove("pt-out");
      if (ptOv) ptOv.classList.remove("go");
    });
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || a.getAttribute("aria-current") === "page") return;
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;
        e.preventDefault();
        if (!ptOv) {
          ptOv = document.createElement("div"); ptOv.className = "pt"; ptOv.setAttribute("aria-hidden", "true");
          ptOv.innerHTML = '<svg viewBox="0 0 100 100"><path d="M50 0 L58.6 41.4 L100 50 L58.6 58.6 L50 100 L41.4 58.6 L0 50 L41.4 41.4 Z" fill="url(#sg)" mask="url(#ap)"/></svg>';
          document.body.appendChild(ptOv);
        }
        /* a random brand colour behind the wink each time (book palette hues only — never white) */
        var ptCols = document.documentElement.classList.contains("light") ? ["#E9EDF7", "#DCE3F1", "#D3DCEF"] : ["#080B14", "#0C1120", "#121A2E", "#10172A"]; /* the wink panel matches the active theme family */
        ptOv.style.background = ptCols[(Math.random() * ptCols.length) | 0];
        ptOv.classList.add("go");
        document.body.classList.add("pt-out"); /* fades main/header/footer, not the winking star */
        setTimeout(function () { location.href = href; }, 430);
      });
    });
  }

  var nav = document.getElementById("nav");
  if (nav) addEventListener("scroll", function () { nav.classList.toggle("small", scrollY > 30); }, { passive: true });

  var b = document.getElementById("burger"), m = document.getElementById("mobile"), sc = document.getElementById("scrim"), mc = document.getElementById("mclose");
  function openM(o) { if (!m) return; m.classList.toggle("open", o); if (sc) sc.classList.toggle("open", o); if (b) b.setAttribute("aria-expanded", o); m.setAttribute("aria-hidden", !o); if (lenis) { if (o) lenis.stop(); else lenis.start(); } /* the page must not scroll behind the open drawer (touch pans chain through otherwise) */ }
  if (b) b.addEventListener("click", function () { openM(true); });
  if (mc) mc.addEventListener("click", function () { openM(false); });
  if (sc) sc.addEventListener("click", function () { openM(false); });
  if (m) m.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { openM(false); }); });

  /* CUBERTO-principle word-by-word: the big headings (and the defining line) split into word
     units that cascade in as their reveal fires. Reduced motion keeps plain unsplit text. */
  if (!RM) {
    /* Japanese (and Thai) write without spaces — split(' ') would treat a whole heading as one
       word. Intl.Segmenter (Baseline 2024) finds the word boundaries; without it, the heading
       animates as one block, which the design already tolerates. */
    var segLang = (document.documentElement.lang || "").slice(0, 2);
    var wordSeg = (segLang === "ja" || segLang === "th") && window.Intl && Intl.Segmenter ? new Intl.Segmenter(segLang, { granularity: "word" }) : null;
    function wordParts(s) {
      if (!wordSeg) return s.split(/(\s+)/);
      var out = []; var iter = wordSeg.segment(s);
      var arr = Array.from ? Array.from(iter) : [];
      for (var q = 0; q < arr.length; q++) out.push(arr[q].segment);
      return out;
    }
    document.querySelectorAll("h1.reveal, h2.reveal, .s-mint p.reveal:not(.muted)").forEach(function (el) {
      if (el.classList.contains("glitch-h")) return; /* the glitch relies on data-text pseudo layers */
      if (el.closest(".final-l")) return; /* the closing line gets the Instrument line-mask treatment below, not the per-word split */
      var wi = 0, lastW = null;
      [].slice.call(el.childNodes).forEach(function (nd) {
        if (nd.nodeType === 3) {
          var parts = wordParts(nd.nodeValue), frag = document.createDocumentFragment();
          parts.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); lastW = null; return; }
            if (/^[.,!?;:…"'’)\]、。！？」』）・]+$/.test(t) && lastW) { lastW.appendChild(document.createTextNode(t)); return; } /* bare punctuation glues to the previous word — no orphan line breaks */
            var w = document.createElement("span"); w.className = "w"; w.style.setProperty("--wi", Math.min(wi++, 26)); w.textContent = t;
            frag.appendChild(w); lastW = w;
          });
          el.replaceChild(frag, nd);
        } else if (nd.nodeType === 1 && nd.tagName !== "BR") {
          nd.classList.add("w"); nd.style.setProperty("--wi", Math.min(wi++, 26)); lastW = nd;
        } else { lastW = null; }
      });
      if (wi) el.classList.add("wsplit");
    });
  }

  /* INSTRUMENT-principle stacked closing type: "Let's / fill your / chairs." — each line rises
     from behind its own mask, heavily staggered, for a deliberate editorial finish. The three
     spans are already one-line-each; we clip each and slide an inner riser up. Reduced-motion /
     no-JS keep the lines shown flat (the reveal still un-hides them). */
  if (!RM) {
    var closeH = document.querySelector(".final-l h2");
    if (closeH) {
      var lns = [].slice.call(closeH.children).filter(function (c) { return c.tagName === "SPAN"; });
      if (lns.length) {
        closeH.classList.add("instr");
        lns.forEach(function (ln, i) {
          var inner = document.createElement("i");
          while (ln.firstChild) inner.appendChild(ln.firstChild);
          ln.appendChild(inner);
          ln.className = "ln"; ln.style.setProperty("--li", i);
        });
      }
    }
  }

  /* the "one connected system" engine flows left→right as you scroll: each stage lights in turn,
     the gradient joins draw between them one by one, and a glow rides the leading stage — the
     patient moving attract→capture→book→show up→bring back. Reduced-motion / no-JS show every
     stage readable and (under .rm) the joins full via .drawn; nothing is ever hidden. */
  if (G) {
    document.querySelectorAll(".engine").forEach(function (eng) {
      var stgs = [].slice.call(eng.querySelectorAll(".stg"));
      var joins = [].slice.call(eng.querySelectorAll(".join"));
      if (stgs.length < 2) return;
      eng.classList.add("flow");
      var N = stgs.length, tF = 0, pF = 0, litF = -1;
      var stF = ScrollTrigger.create({ trigger: eng, start: "top 82%", end: "bottom 62%", scrub: true, onUpdate: function (s) { tF = s.progress; } });
      tF = stF.progress; pF = tF;
      function rendF() {
        var span = pF * (N + 0.3); /* small tail so the last stage fully lights before the section leaves */
        var lit = Math.max(0, Math.min(N, Math.floor(span + 0.001)));
        for (var j = 0; j < joins.length; j++) {
          var f = Math.max(0, Math.min(1, span - (j + 1))); /* join j draws as the flow crosses stage j → j+1 */
          joins[j].style.transform = "scaleX(" + f.toFixed(3) + ")";
        }
        if (lit !== litF) {
          litF = lit;
          for (var i = 0; i < N; i++) { stgs[i].classList.toggle("lit", i < lit); stgs[i].classList.toggle("now", i === lit - 1); }
        }
      }
      rendF();
      (function loopF() {
        var d = tF - pF;
        if (Math.abs(d) > 0.0006) { pF += d * 0.12; if (Math.abs(tF - pF) < 0.0006) pF = tF; rendF(); }
        requestAnimationFrame(loopF);
      })();
    });
  }

  if (!RM && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    /* belt-and-braces: observer delivery has proven unreliable in some engine states, and hidden
       text is unacceptable — a cheap scroll sweep force-reveals anything in view the observer
       missed, at the same visual moments. No-ops entirely once everything is revealed. */
    var pending = [].slice.call(document.querySelectorAll(".reveal")), sweepReq = false;
    function sweep() {
      sweepReq = false;
      var vh2 = innerHeight + 60;
      for (var i = pending.length - 1; i >= 0; i--) {
        var el = pending[i];
        if (el.classList.contains("in")) { pending.splice(i, 1); continue; }
        var r = el.getBoundingClientRect();
        if (r.top < vh2 && r.bottom > -60 && (r.width || r.height)) { el.classList.add("in"); pending.splice(i, 1); }
      }
    }
    addEventListener("scroll", function () { if (!sweepReq && pending.length) { sweepReq = true; requestAnimationFrame(sweep); } }, { passive: true });
    setTimeout(sweep, 350); setTimeout(sweep, 1500);
    /* the engine's left→right flow is driven by the scroll-scrubbed module below when GSAP is
       present; only fall back to the all-at-once "drawn" fill if ScrollTrigger is missing */
    if (!G) document.querySelectorAll(".engine").forEach(function (eng) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { eng.classList.add("drawn"); o.disconnect(); } }); }, { threshold: 0.3 });
      o.observe(eng);
    });
    document.querySelectorAll(".chat").forEach(function (chat) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { chat.classList.add("play"); chat.querySelectorAll(".bub").forEach(function (bb, i) { setTimeout(function () { bb.classList.add("in"); }, 350 + i * 760); }); o.disconnect(); } }); }, { threshold: 0.35 });
      o.observe(chat);
    });
    /* the 21x stat counts up when it scrolls into view */
    document.querySelectorAll(".stat .num").forEach(function (num) {
      var tn = num.firstChild;
      if (!tn || tn.nodeType !== 3) return;
      var final = parseInt(tn.nodeValue, 10);
      if (!final) return;
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          o.disconnect();
          var t0 = null;
          function step(ts) {
            if (!t0) t0 = ts;
            var k = Math.min(1, (ts - t0) / 1100);
            k = 1 - Math.pow(1 - k, 3);
            tn.nodeValue = String(Math.round(k * final));
            if (k < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: 0.5 });
      o.observe(num);
    });
    /* the ad mini-scene: the ad loads up, the view zooms out to a desktop monitor (a customer
       looking at it), then a cursor glides in and clicks the ad. JS-only presentation — the
       plain card is what no-JS / reduced-motion visitors see. */
    document.querySelectorAll(".adcard").forEach(function (card) {
      var scene = document.createElement("div"); scene.className = "adscene";
      var mon = document.createElement("div"); mon.className = "admon";
      var scr = document.createElement("div"); scr.className = "adscreen";
      card.parentNode.insertBefore(scene, card);
      scene.appendChild(mon); mon.appendChild(scr); scr.appendChild(card);
      var stand = document.createElement("div"); stand.className = "adstand";
      var base = document.createElement("div"); base.className = "adbase";
      scene.appendChild(stand); scene.appendChild(base);
      var cur = document.createElement("div"); cur.className = "adcur";
      cur.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 2 L20 12 L12 13.5 L9 21 Z" fill="#EAEEF7" stroke="#080B14" stroke-width="1.4"/></svg>';
      var ring = document.createElement("i"); ring.className = "adring";
      scr.appendChild(cur); scr.appendChild(ring);
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          o.disconnect();
          card.classList.add("built"); /* 1: the ad loads up */
          setTimeout(function () { scene.classList.add("zoom"); }, 1400); /* 2: zoom out to the desktop */
          setTimeout(function () { /* 3: the cursor flies in to the ad's button */
            var btn = card.querySelector(".bt .cta");
            var sr = scr.getBoundingClientRect();
            if (btn && sr.width) {
              var br = btn.getBoundingClientRect();
              cur.style.setProperty("--cx0", (sr.width + 30) + "px");
              cur.style.setProperty("--cy0", Math.round(sr.height * 0.15) + "px");
              cur.style.setProperty("--cx1", Math.round(br.left - sr.left + br.width / 2 - 4) + "px");
              cur.style.setProperty("--cy1", Math.round(br.top - sr.top + br.height / 2 - 2) + "px");
              ring.style.left = Math.round(br.left - sr.left + br.width / 2 - 17) + "px";
              ring.style.top = Math.round(br.top - sr.top + br.height / 2 - 17) + "px";
            }
            scene.classList.add("cursor");
          }, 2500);
          setTimeout(function () { scene.classList.add("clicked"); }, 3900); /* 4: click */
        });
      }, { threshold: 0.35 });
      o.observe(card);
    });
    /* the footer glitch fires once as it scrolls into view (so touch users see it too) */
    document.querySelectorAll(".glitch-h").forEach(function (g) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          o.disconnect();
          g.classList.add("fire");
          setTimeout(function () { g.classList.remove("fire"); }, 350); /* re-arm the hover version */
        });
      }, { threshold: 0.5 });
      o.observe(g);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll(".engine").forEach(function (e) { e.classList.add("drawn"); });
    document.querySelectorAll(".chat .bub").forEach(function (x) { x.classList.add("in"); });
    document.querySelectorAll(".adcard").forEach(function (c) { c.classList.add("built"); });
  }

  document.querySelectorAll(".slider").forEach(function (sl) {
    var track = sl.querySelector(".track");
    if (!track || !track.children.length) return;
    var imgs = track.children.length, idx = 0, dots = sl.querySelectorAll(".dots i");
    function go(n) { idx = (n + imgs) % imgs; track.style.transform = "translateX(" + (-idx * 100) + "%)"; dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); }); }
    var p = sl.querySelector(".prev"), nx = sl.querySelector(".next");
    if (p) p.addEventListener("click", function () { go(idx - 1); });
    if (nx) nx.addEventListener("click", function () { go(idx + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
    var x0 = null;
    sl.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); x0 = null; });
    go(0);
  });

  /* home hero star: assembles, then the PORTAL module (below) takes over on scroll.
     The split-into-pieces moment now lives on the front-desk page. */
  var portalS = 1, portalY = 0; /* the hero star's portal scale + downward travel — written by the portal module, applied by the magnetic loop */
  var discHideBottom = 0; /* the hero-bottom offset at which the portal disc hides — the colour morph inks the background just before this, so the darkness always arrives via the growing circle, never early behind it */
  var bendAdd = null; /* set by the bendy-card module; later modules (film strip) can enrol elements */
  var stage = document.getElementById("stage");
  if (stage) {
    if (RM) { stage.classList.add("shown"); }
    else {
      /* first visit: hold the assemble until the loader lifts; via timeout so the scattered
         state paints first and the transition actually animates */
      var t0 = root.classList.contains("loading") ? 1500 : 60;
      setTimeout(function () { stage.classList.add("shown"); }, t0);
    }
  }

  /* front-desk: scroll-bound split — the section holds while the whole star breaks into four
     (the four timings light one by one) and "One desk, every hour." rises in the centre.
     Reduced-motion / no-JS see the split star, title and all rows statically. */
  var fdStage = document.getElementById("stage-fd");
  if (fdStage) {
    var fdSec = fdStage.closest("section");
    fdStage.classList.add("shown");
    if (!G) {
      fdStage.classList.add("burst"); /* static split for reduced-motion / no-ScrollTrigger */
    } else {
      (function () {
        var rows3 = [].slice.call(fdSec.querySelectorAll(".daynight .row"));
        var title3 = fdSec.querySelector(".fd-title");
        var pieces3 = ["p-top", "p-right", "p-bottom", "p-left"].map(function (c) { return fdStage.querySelector("." + c); });
        var dirs3 = [[0, -1], [1, -0.62], [0, 1], [-1, 0.62]]; /* E/W pieces climb/dip as they travel so they clear the centred title instead of crossing the text line */
        fdSec.classList.add("fdshow");
        fdSec.style.height = "230vh";
        fdSec.style.padding = "0";
        var tD = 0, pD = 0, litD = -1;
        var stD = ScrollTrigger.create({ trigger: fdSec, start: "top top", end: "bottom bottom", scrub: true, onUpdate: function (self) { tD = self.progress; } });
        tD = stD.progress; pD = tD;
        function ss(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
        function rendD() {
          var spread = ss(pD / 0.55) * fdStage.offsetWidth * 0.62;
          var rot = ss(pD / 0.55) * 9;
          for (var i = 0; i < 4; i++) {
            if (pieces3[i]) pieces3[i].style.transform = "translate(" + (dirs3[i][0] * spread).toFixed(1) + "px," + (dirs3[i][1] * spread).toFixed(1) + "px) rotate(" + ((i % 2 ? 1 : -1) * rot).toFixed(1) + "deg)";
          }
          if (title3) { var tf = ss((pD - 0.28) / 0.32); title3.style.opacity = tf.toFixed(3); title3.style.transform = "scale(" + (0.94 + tf * 0.06).toFixed(3) + ")"; }
          var k = Math.min(4, Math.floor(ss((pD - 0.3) / 0.65) * 4.6));
          if (k !== litD) { litD = k; rows3.forEach(function (r, i) { r.classList.toggle("lit", i < k); }); }
        }
        rendD();
        (function td() {
          var d = tD - pD;
          if (Math.abs(d) > 0.0004) { pD += d * 0.09; if (Math.abs(tD - pD) < 0.0004) pD = tD; rendD(); }
          requestAnimationFrame(td);
        })();
      })();
    }
  }

  /* hairy interactive North Star on the footer logo (Stripe "backbone" principle, own code):
     filaments radiate from behind the mark and bend away from the pointer — the burst look the
     owner picked over an outline-hugging variant (tried 2026-07-02, reverted on his feedback).
     Decoration only: reduced-motion / no-JS get the plain logo; the loop runs only in view. */
  if (!RM && window.CanvasRenderingContext2D && !matchMedia("(pointer:coarse)").matches) { /* the filaments bend away from the POINTER — on touch there is none, so phones get the clean mark */
    document.querySelectorAll(".fstar").forEach(function (host) {
      var cv = document.createElement("canvas");
      cv.setAttribute("aria-hidden", "true");
      host.appendChild(cv);
      var ctx = cv.getContext("2d");
      if (!ctx) return;
      var DPR = Math.min(2, window.devicePixelRatio || 1);
      var w = 0, h = 0, cx = 0, cy = 0, Rm = 0, N = 210, fils = []; /* denser coat per owner feedback */
      function filCols() { return root.classList.contains("light") ? [[12, 95, 80], [124, 90, 14], [158, 42, 18], [12, 95, 80]] : [[95, 227, 198], [244, 204, 133], [255, 140, 122], [95, 227, 198]]; } /* deep variants on the pale footer, bright on the dark one */
      var cols = filCols();
      function frac(n) { var s = Math.sin(n) * 43758.5453; return s - Math.floor(s); }
      function build() {
        var hr = host.getBoundingClientRect(), rc = cv.getBoundingClientRect();
        w = rc.width; h = rc.height;
        if (!w || !h) return;
        cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        cx = w / 2; cy = h / 2; Rm = hr.width / 2; fils = [];
        for (var i = 0; i < N; i++) {
          var a = (i / N) * Math.PI * 2 + (frac(i * 12.9898) - 0.5) * 0.05;
          fils.push({ a: a, r0: Rm * (0.5 + frac(i * 9.7) * 0.25), len: Rm * (0.5 + frac(i * 7.31) * 0.8), phase: frac(i * 3.7) * 6.28, sway: 0.4 + frac(i * 5.1) * 0.9, col: cols[i % cols.length] });
        }
      }
      build(); addEventListener("resize", build); addEventListener("load", build); setTimeout(build, 700);
      themeHooks.push(function () { cols = filCols(); build(); });
      var px = -1e4, py = -1e4, t = 0, foot = host.closest("footer") || host;
      foot.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
      foot.addEventListener("pointerleave", function () { px = -1e4; py = -1e4; });
      var raf = null, inview = false;
      function draw() {
        raf = null;
        if (!inview) return;
        if (!fils.length || !w) { build(); raf = requestAnimationFrame(draw); return; }
        t += 0.016;
        ctx.clearRect(0, 0, w, h); ctx.lineCap = "round";
        for (var i = 0; i < fils.length; i++) {
          var f = fils[i], ca = Math.cos(f.a), sa = Math.sin(f.a);
          var x0 = cx + ca * f.r0, y0 = cy + sa * f.r0;
          var L = f.r0 + f.len, tipx = cx + ca * L, tipy = cy + sa * L;
          var dx = tipx - px, dy = tipy - py, d = Math.sqrt(dx * dx + dy * dy) || 1, infl = Rm * 2.1, push = 0;
          if (d < infl) { push = (1 - d / infl) * Rm * 0.55; tipx += (dx / d) * push; tipy += (dy / d) * push; }
          var swayAmt = Math.sin(t * f.sway + f.phase) * Rm * 0.07;
          var mx = (x0 + tipx) / 2 - sa * swayAmt, my = (y0 + tipy) / 2 + ca * swayAmt;
          var al = 0.12 + (push / Rm) * 0.6; if (al > 0.6) al = 0.6; /* slightly softer per hair now the coat is denser */
          var cs = f.col[0] + "," + f.col[1] + "," + f.col[2];
          var g = ctx.createLinearGradient(x0, y0, tipx, tipy);
          g.addColorStop(0, "rgba(" + cs + ",0)");
          g.addColorStop(0.5, "rgba(" + cs + "," + al.toFixed(3) + ")");
          g.addColorStop(1, "rgba(" + cs + ",0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, tipx, tipy); ctx.stroke();
        }
        raf = requestAnimationFrame(draw);
      }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { inview = e.isIntersecting; if (inview && !raf) raf = requestAnimationFrame(draw); });
        }).observe(host);
      } else { inview = true; raf = requestAnimationFrame(draw); }
    });
  }

  /* contact chooser: the three send buttons carry a ready-made message composed live from the
     form fields (owner-requested; wording tweakable). Also records which page sent the lead. */
  (function () {
    var form = document.querySelector(".form");
    var wa = document.getElementById("go-wa"), em = document.getElementById("go-em");
    if (!form || !wa || !em) return;
    var src = document.getElementById("lead-source");
    if (src) src.value = (document.referrer && document.referrer.indexOf(location.host) > -1) ? (document.referrer.split(location.host)[1] || "/") : location.pathname;
    function val(n) { var f = form.querySelector('[name="' + n + '"]'); return f && f.value ? f.value.trim() : ""; }
    function checked(n) { return [].slice.call(form.querySelectorAll('[name="' + n + '"]:checked')).map(function (c) { return c.value; }); }
    function fileName() { var f = form.querySelector('input[type="file"]'); return f && f.files && f.files[0] ? f.files[0].name : ""; }
    /* localized pages inject window.__i18n before this script; English is the fallback */
    var T = window.__i18n || {};
    function tt(k, en) { return T[k] || en; }
    function compose() {
      var L = [tt("hi", "Hi Stellar Haus Media,")];
      if (val("name")) L.push(tt("im", "I'm {name}.").replace("{name}", val("name")));
      var ints = checked("interest");
      if (ints.length) L.push(tt("interested", "I'm interested in: {list}.").replace("{list}", ints.join(tt("listSep", ", "))));
      if (checked("budget").length) L.push(tt("budget", "Rough budget: {band}.").replace("{band}", checked("budget")[0]));
      if (val("message")) L.push(val("message"));
      if (val("email")) L.push(tt("reach", "Reach me: {email}").replace("{email}", val("email")));
      if (fileName()) L.push(tt("file", "(I've got a file to share: {file})").replace("{file}", fileName()));
      if (src && src.value) L.push(tt("via", "(via {page})").replace("{page}", src.value));
      return L.join("\n");
    }
    function sync() {
      var fn = form.querySelector(".fname");
      if (fn) fn.textContent = fileName() || tt("chooseFile", "Choose a file…");
      var enc = encodeURIComponent(compose());
      wa.href = "https://wa.me/918072644417?text=" + enc;
      em.href = "mailto:stellarhausmedia@gmail.com?subject=" + encodeURIComponent(val("name") ? tt("subjectNamed", "Enquiry — {name}").replace("{name}", val("name")) : tt("subject", "Enquiry")) + "&body=" + enc;
    }
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    sync();
  })();

  /* smooth FAQ accordion — grid-rows (open + close, reduced-motion safe) */
  document.querySelectorAll(".faq details").forEach(function (d) {
    var sm = d.querySelector("summary"), a = d.querySelector(".a");
    if (!sm || !a) return;
    var busy = false, t;
    function settle(fn) {
      function cb(ev) { if (ev && ev.propertyName !== "grid-template-rows") return; a.removeEventListener("transitionend", cb); clearTimeout(t); fn(); }
      a.addEventListener("transitionend", cb);
      t = setTimeout(function () { cb(); }, 560);
    }
    sm.addEventListener("click", function (e) {
      if (RM) return;
      e.preventDefault();
      if (busy) return; busy = true;
      if (!d.open) {
        d.classList.add("opening");
        d.open = true;
        void a.offsetHeight;
        requestAnimationFrame(function () { d.classList.remove("opening"); });
        settle(function () { busy = false; });
      } else {
        d.classList.add("closing");
        settle(function () { d.open = false; d.classList.remove("closing"); busy = false; });
      }
    });
  });

  if (!RM) {
    document.querySelectorAll(".btn-dark, .btn-mint, .fcta").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) { var r = btn.getBoundingClientRect(); btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.15) + "px," + ((e.clientY - r.top - r.height / 2) * 0.25) + "px)"; });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
    var hs = document.querySelector(".hero .stage");
    if (hs) {
      var tX = 0, tY = 0, cX = 0, cY = 0;
      /* portalS is written by the portal module below; this loop is the single transform writer */
      addEventListener("mousemove", function (e) {
        var r = hs.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var dist = Math.sqrt(dx * dx + dy * dy), R = r.width * 0.7;
        if (dist < R) { var f = 1 - dist / R; tX = dx * 0.16 * f; tY = dy * 0.16 * f; } else { tX = 0; tY = 0; }
      }, { passive: true });
      (function loop() { if (portalS > 1.05) { tX = 0; tY = 0; } cX += (tX - cX) * 0.08; cY += (tY - cY) * 0.08; hs.style.transform = "translate(" + cX.toFixed(2) + "px," + (cY + portalY).toFixed(2) + "px) scale(" + portalS.toFixed(3) + ")"; requestAnimationFrame(loop); })();
    }
  }

  /* nav logo hover: the same minimal RGB-split colour glitch as the footer motto (.glitch-h) —
     pure CSS on .brand:hover (.brand-word already carries the data-text pseudo layers). No JS. */

  /* OFFBRAND-principle portal (home hero): scrolling swells the North Star until you pass through
     its centre hole — a disc in the glow's lighter-navy (--surf-3) grows with it — into the
     .s-surf3 problem section, which is that exact same pink, so the whole zoom stays one colour.
     Scroll-tied, fully reversible; reduced-motion / no-JS keep the normal static hero. */
  if (G) {
    (function () {
      var st2 = document.getElementById("stage");
      var hero2 = st2 && st2.closest(".hero");
      if (!st2 || !hero2) return;
      if (!(window.CSS && CSS.supports && CSS.supports("overflow", "clip"))) return; /* without clip support the swollen star would escape the hero — those browsers keep the normal hero */
      var wrap2 = hero2.querySelector(".wrap");
      var starEl = st2.querySelector(".star");
      if (!wrap2 || !starEl) return;
      hero2.classList.add("portal");
      /* phones get a longer runway: a thumb-flick covers far more scroll than a wheel notch, so
         260vh compresses the whole zoom into one gesture — 340vh keeps it a played moment */
      hero2.style.height = matchMedia("(pointer:coarse)").matches ? "340vh" : "260vh";
      /* pin the scene from the very first scrolled pixel: the nav is in flow, so a sticky top of
         0 only engages after the wrap has already slid up by the nav's height — the owner read
         that slide as "scrolls a little down and then expands". Pinning at the nav's bottom edge
         means scroll #1 is pure zoom, nothing translates. */
      var navEl = document.querySelector(".nav");
      function pinTop() { wrap2.style.top = (navEl ? navEl.offsetHeight : 0) + "px"; }
      pinTop(); addEventListener("resize", pinTop);
      var disc = document.createElement("div"); disc.className = "p-disc"; disc.setAttribute("aria-hidden", "true");
      hero2.appendChild(disc); /* fixed-position: lives outside the scaled stage so it renders crisp at native size */
      var aura2 = st2.querySelector(".aura");
      var fadeEls = [].slice.call(wrap2.querySelectorAll("h1, .lead, .btn, .free"));
      var pT = 0, pp = 0, untransitioned = false, discGone = false, force = false;
      ScrollTrigger.create({ trigger: hero2, start: 0, end: "bottom bottom", scrub: true, onUpdate: function (self) { pT = self.progress; } }); /* start at absolute 0: the in-flow nav puts the hero top 76px down — the very first scrolled pixel must already swell the star */
      /* the next section's top padding decides how soon its first text line can enter the
         viewport — the disc must be gone before that (matters on phones, where the padding is
         small). Re-measured on resize; the lerp gate is also forced open so the disc re-glues
         to the re-laid-out hole instead of keeping a stale centre/scale. */
      var nextSec = hero2.nextElementSibling, nextPad = 120;
      while (nextSec && nextSec.tagName !== "SECTION") nextSec = nextSec.nextElementSibling;
      function measurePad() { if (nextSec) { var v = parseFloat(getComputedStyle(nextSec).paddingTop); if (v > 0) nextPad = v; } }
      measurePad();
      addEventListener("resize", function () { measurePad(); force = true; });
      (function ptick() {
        /* the disc is position:fixed — once the hero scrolls past, it must vanish or it sits over
           every section below for the rest of the page (text paints underneath it). Checked every
           frame, outside the lerp gate, so it can never freeze in the covering state. It hides
           just before the next section's first text line reaches the viewport bottom (capped at
           0.92vh so the morph background behind has finished its ink→surf-3 blend), and re-shows
           on the way back up. */
        var thr = Math.min(innerHeight * 0.92, innerHeight - nextPad + 24);
        discHideBottom = thr;
        var gone = hero2.getBoundingClientRect().bottom <= thr;
        if (gone !== discGone) {
          discGone = gone; disc.style.visibility = gone ? "hidden" : "";
          if (!gone) force = true; /* re-entering from below: the gate is settled at pp==1, so force one pass to re-glue position/size — else the disc re-shows wherever it froze */
        }
        var diff = pT - pp;
        if (Math.abs(diff) > 0.0004 || force) {
          force = false;
          pp += diff * 0.09;
          if (Math.abs(pT - pp) < 0.0004) pp = pT;
          /* the hero copy carries .reveal transitions — kill them once the portal starts so the
             per-frame fade tracks the scroll instantly instead of smearing through a .8s ease */
          if (!untransitioned && pp > 0.01) { untransitioned = true; fadeEls.forEach(function (el) { el.style.transition = "none"; }); }
          var fade = Math.min(1, pp / 0.3);
          for (var i = 0; i < fadeEls.length; i++) { var fe = fadeEls[i]; fe.style.opacity = (1 - fade).toFixed(3); fe.style.transform = "translateY(" + (fade * 36).toFixed(1) + "px)"; fe.style.visibility = fade > 0.98 ? "hidden" : ""; /* a fully faded CTA must not stay clickable/tabbable */ }
          var t2 = Math.max(0, pp / 0.85); /* swell starts at the very first scrolled pixel — no dead zone */
          portalS = 1 + Math.pow(t2, 2.2) * 36; /* the magnetic loop applies this to the stage */
          /* the star travels DOWN as it swells, so the hole zooms into the viewport centre */
          var wr2 = wrap2.getBoundingClientRect();
          var baseC = wr2.top + st2.offsetTop + st2.offsetHeight / 2;
          var f2 = Math.max(0, Math.min(1, pp / 0.5)); f2 = f2 * f2 * (3 - 2 * f2);
          portalY = (innerHeight / 2 - baseC) * f2;
          /* the fixed surf-3 disc glues to the hole centre each frame, scaled near-native for a crisp edge */
          var sr2 = st2.getBoundingClientRect();
          disc.style.left = (sr2.left + sr2.width / 2).toFixed(1) + "px";
          disc.style.top = (sr2.top + sr2.height / 2).toFixed(1) + "px";
          disc.style.setProperty("--ds", ((sr2.width * 0.145 * 1.04) / (disc.offsetWidth || 1)).toFixed(4));
          /* the owner's design: the circle stays the glow's lighter-navy core the WHOLE way and
             never changes colour — the section it opens into (.s-surf3) is that exact same tone,
             so the hand-off is same-on-same, invisible. No per-frame colour blend, nothing to
             lag. The next-section darkness the old build introduced here is gone entirely. */
          hero2.classList.toggle("zooming", pp > 0.12);
          hero2.classList.toggle("zoomdeep", pp > 0.3); /* past the fade window the shadow filters drop entirely — they were the scrub's main cost at portal scale */
          if (aura2) aura2.style.opacity = Math.max(0, 1 - pp * 4).toFixed(3);
          /* near the end the star's mint/gold arms fade out — the pink-3 disc stays, so what's
             left is a clean navy field handing off into the surf-3 section, seamless */
          starEl.style.opacity = pp > 0.9 ? Math.max(0, 1 - (pp - 0.9) / 0.08).toFixed(3) : "1";
        }
        requestAnimationFrame(ptick);
      })();
    })();
  }

  /* OBYS-principle template showcase, HORIZONTAL (websites page): the demo cards sweep across a
     held stage as you scroll — several visible at once, free-flowing (no forced stepping, no
     counter), the centred card's name as a giant ghost behind, a horizontal progress rail.
     Every card opens its live demo; the drag rows stay as the reduced-motion / no-JS fallback
     and a sr-only list keeps every demo reachable for screen readers. */
  if (G) {
    (function () {
      var ws = document.querySelector(".ws");
      var sec = ws && ws.closest("section");
      if (!ws || !sec) return;
      var all2 = [].slice.call(ws.querySelectorAll(".ws-card"));
      var seen2 = {}, cards2 = [];
      all2.forEach(function (c) {
        var nm = ((c.querySelector(".ws-meta b") || {}).textContent || "").trim();
        if (!nm || seen2[nm]) return; seen2[nm] = 1; cards2.push(c);
      });
      var n = cards2.length;
      if (n < 4) return;
      ws.classList.add("obys-on");
      sec.classList.add("tplshow");
      var hold = document.createElement("div"); hold.className = "tp-hold";
      var stage2 = document.createElement("div"); stage2.className = "tp-stage";
      stage2.setAttribute("data-lenis-prevent", ""); /* the box owns the wheel — Lenis must not smooth-scroll the page while the cursor is inside */
      var ghost2 = document.createElement("div"); ghost2.className = "tp-ghost"; ghost2.setAttribute("aria-hidden", "true");
      var row2 = document.createElement("div"); row2.className = "tp-row";
      var meta2 = document.createElement("div"); meta2.className = "tp-meta"; meta2.setAttribute("aria-hidden", "true");
      var mCat = document.createElement("span"); meta2.appendChild(mCat);
      var rail = document.createElement("div"); rail.className = "tp-rail"; rail.setAttribute("aria-hidden", "true");
      var thumb = document.createElement("i"); rail.appendChild(thumb);
      stage2.appendChild(ghost2); stage2.appendChild(row2); stage2.appendChild(meta2); stage2.appendChild(rail);
      hold.appendChild(stage2);
      sec.appendChild(hold);
      var items = cards2.map(function (c) {
        row2.appendChild(c);
        return { card: c, name: ((c.querySelector(".ws-meta b") || {}).textContent || "").trim(), cat: ((c.querySelector(".ws-meta span") || {}).textContent || "").trim() };
      });
      /* screen readers get the whole list regardless of what's on stage */
      var srl = document.createElement("ul"); srl.className = "sr-only";
      items.forEach(function (it) {
        var li = document.createElement("li"), a2 = document.createElement("a");
        a2.href = it.card.href; a2.target = "_blank"; a2.rel = "noopener"; a2.tabIndex = -1;
        a2.textContent = it.name + " — " + it.cat;
        li.appendChild(a2); srl.appendChild(li);
      });
      sec.appendChild(srl);
      /* Obys-style focus brackets: the centred demo sits framed between two brackets */
      var brL = document.createElement("i"); brL.className = "tp-br l"; brL.setAttribute("aria-hidden", "true");
      var brR = document.createElement("i"); brR.className = "tp-br r"; brR.setAttribute("aria-hidden", "true");
      stage2.appendChild(brL); stage2.appendChild(brR);
      /* the box owns its own scroll (in px along the strip): cursor inside + wheel = browse the
         demos, page never moves; cursor outside = the page scrolls past normally — no more
         scrolling through all 26 demos to reach the rest of the page */
      var target2 = 0, p2 = 0, rw2 = 0, maxX2 = 1, act = -1, padX = 0, cw0 = 1;
      /* the browse range runs first-card-centred .. last-card-centred, so the end demos can sit in the brackets too */
      function meas2() {
        rw2 = row2.scrollWidth; padX = innerWidth * 0.06; cw0 = items[0].card.offsetWidth || 1;
        maxX2 = Math.max(1, rw2 - 2 * padX - cw0);
        /* re-round to the NEW card pitch — after rotation/resize the old pixel target falls
           between grid points and a demo would rest half out of the brackets */
        var st5 = maxX2 / Math.max(1, n - 1);
        target2 = Math.max(0, Math.min(maxX2, Math.round(target2 / st5) * st5));
        p2 = Math.min(p2, maxX2);
        act = -1; render2(); /* a settled strip must not sit at a stale X after resize/rotation */
      }
      meas2(); addEventListener("resize", meas2); addEventListener("load", meas2); setTimeout(meas2, 900);
      /* focus / find-in-page must never shear the clipped box (overflow:clip blocks it; this is the older-browser belt) */
      stage2.addEventListener("scroll", function () { stage2.scrollLeft = 0; stage2.scrollTop = 0; });
      var lastIn = 0, settled2 = true; /* snap bookkeeping: a demo must never rest half in / half out of the brackets */
      stage2.addEventListener("wheel", function (e) {
        if (e.ctrlKey) return; /* pinch/ctrl zoom stays the browser's */
        e.preventDefault(); e.stopPropagation();
        var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
        target2 = Math.max(0, Math.min(maxX2, target2 + (e.deltaY + e.deltaX) * k * 1.15));
        lastIn = performance.now(); settled2 = false;
      }, { passive: false });
      /* touch: horizontal swipes browse the strip, vertical swipes scroll the page (touch-action:pan-y);
         a dominant-axis gate keeps diagonal page-scrolls from slewing the strip sideways */
      var tx0 = 0, ty0 = 0, tBase = 0, tAxis = 0, fingerOn2 = false;
      stage2.addEventListener("touchstart", function (e) { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; tBase = target2; tAxis = 0; fingerOn2 = true; settled2 = true; /* never snap while a thumb is on the glass */ }, { passive: true });
      stage2.addEventListener("touchmove", function (e) {
        var dx = tx0 - e.touches[0].clientX, dy = ty0 - e.touches[0].clientY;
        if (!tAxis) { if (Math.abs(dx) > 8 || Math.abs(dy) > 8) tAxis = Math.abs(dx) > Math.abs(dy) ? 1 : -1; else return; }
        if (tAxis === 1) { target2 = Math.max(0, Math.min(maxX2, tBase + dx * 1.6)); lastIn = performance.now(); settled2 = false; }
      }, { passive: true });
      stage2.addEventListener("touchend", function () { tAxis = 0; fingerOn2 = false; lastIn = performance.now(); settled2 = false; }, { passive: true }); /* arm the snap only on release */
      stage2.addEventListener("touchcancel", function () { tAxis = 0; fingerOn2 = false; lastIn = performance.now(); settled2 = false; }, { passive: true });
      /* keyboard: focusing a card glides it into the brackets, and the tab window recentres
         immediately on the focused card (not on the lerping `best`) so held-Tab reaches every demo */
      items.forEach(function (it, idx) {
        it.card.addEventListener("focus", function () {
          var rr = row2.getBoundingClientRect(), r = it.card.getBoundingClientRect();
          target2 = Math.max(0, Math.min(maxX2, (r.left - rr.left + r.width / 2) - padX - cw0 / 2));
          for (var q = 0; q < n; q++) items[q].card.tabIndex = Math.abs(q - idx) <= 2 ? 0 : -1;
        });
      });
      function render2() {
        var x = (innerWidth / 2 - padX - cw0 / 2) - p2;
        row2.style.transform = "translateY(-50%) translateX(" + x.toFixed(1) + "px)";
        var rot = Math.max(-4, Math.min(4, (target2 - p2) * 0.02));
        var cxv = innerWidth / 2, best = -1, bd2 = 1e9;
        for (var i = 0; i < n; i++) {
          var r = items[i].card.getBoundingClientRect();
          var cc = r.left + r.width / 2, dd = Math.abs(cc - cxv);
          if (dd < bd2) { bd2 = dd; best = i; }
          if (r.right < -80 || r.left > innerWidth + 80) continue;
          var f3 = Math.max(0, 1 - dd / (innerWidth * 0.5));
          items[i].card.style.transform = "scale(" + (0.88 + Math.pow(f3, 1.4) * 0.14).toFixed(4) + ") rotate(" + (rot * f3 * 0.4).toFixed(2) + "deg)";
        }
        if (best > -1 && best !== act) {
          act = best;
          ghost2.textContent = items[best].name;
          mCat.textContent = items[best].cat;
          for (var q = 0; q < n; q++) {
            items[q].card.tabIndex = Math.abs(q - best) <= 2 ? 0 : -1;
            items[q].card.classList.toggle("dim", q !== best); /* the framed demo in colour, the rest grayed */
          }
        }
        thumb.style.transform = "scaleX(" + Math.max(0, Math.min(1, p2 / maxX2)).toFixed(4) + ")";
      }
      render2();
      (function t3() {
        if (!settled2 && !fingerOn2 && performance.now() - lastIn > 260) {
          /* input rested — glide the nearest demo fully into the brackets (card centres sit at
             even steps of the browse range, so rounding lands one exactly in frame) */
          settled2 = true;
          var step2 = maxX2 / Math.max(1, n - 1);
          target2 = Math.max(0, Math.min(maxX2, Math.round(target2 / step2) * step2));
        }
        var diff = target2 - p2;
        if (Math.abs(diff) > 0.3) {
          p2 += diff * 0.09;
          if (Math.abs(target2 - p2) < 0.3) p2 = target2;
          render2();
        }
        requestAnimationFrame(t3);
      })();
    })();
  }

  /* the funnel comparison lights up level by level, bound to scroll: both columns together,
     ending on the red "leave" vs the mint "booked chair" */
  if (G) {
    document.querySelectorAll(".funnels").forEach(function (fu) {
      var cols2 = [].slice.call(fu.querySelectorAll(".funnel ol"));
      if (cols2.length < 2) return;
      var rows2 = cols2.map(function (o) { return [].slice.call(o.children); });
      var maxR = Math.max(rows2[0].length, rows2[1].length);
      fu.classList.add("seq");
      var lit = -1;
      ScrollTrigger.create({
        trigger: fu, start: "top 85%", end: "bottom 62%", scrub: true,
        onUpdate: function (self) {
          /* +1.3 tail: the last level (leave / booked chair) lights at ~75% of the range, while
             the block is still comfortably mid-viewport — not as the section exits */
          var k = Math.min(maxR, Math.floor(self.progress * (maxR + 1.3)));
          if (k === lit) return;
          lit = k;
          rows2.forEach(function (rr) { rr.forEach(function (li, i) { li.classList.toggle("lit", i < k); }); });
        }
      });
    });
  }

  /* OTTOGRAFIE-principle film strip (content page): the section holds and the eight carousel
     slides open across the screen, sweeping right to left as you scroll, with "The formula, in
     one carousel." showing through the gaps behind them. The clickable slider stays as the
     reduced-motion / no-JS fallback. */
  if (G) {
    (function () {
      var slider = document.querySelector(".slider");
      var sec = slider && slider.closest("section");
      if (!slider || !sec) return;
      var imgs = [].slice.call(slider.querySelectorAll(".track img"));
      if (imgs.length < 3) return;
      var h2s = sec.querySelector("h2");
      sec.classList.add("filmshow");
      var hold = document.createElement("div"); hold.className = "fs-hold"; hold.style.height = "220vh";
      var stg = document.createElement("div"); stg.className = "fs-stage";
      var gh = document.createElement("div"); gh.className = "fs-ghost"; gh.setAttribute("aria-hidden", "true");
      gh.textContent = h2s ? h2s.textContent : "";
      var row = document.createElement("div"); row.className = "fs-row";
      /* lightbox: tap a slide and it enlarges over the blurred page */
      var lbx = document.createElement("div"); lbx.className = "lbx";
      var lbi = document.createElement("img");
      lbx.appendChild(lbi); document.body.appendChild(lbx);
      lbx.addEventListener("click", function () { lbx.classList.remove("on"); });
      addEventListener("keydown", function (e) { if (e.key === "Escape") lbx.classList.remove("on"); });
      imgs.forEach(function (im) {
        var c = document.createElement("div"); c.className = "fs-card";
        var i2 = im.cloneNode(false);
        c.appendChild(i2); row.appendChild(c);
        c.addEventListener("click", function () { lbi.src = i2.getAttribute("src"); lbi.alt = i2.getAttribute("alt") || ""; lbx.classList.add("on"); });
        if (bendAdd) bendAdd(c); /* the strip cards get the bendy edges too (clip mode) */
      });
      stg.appendChild(gh); stg.appendChild(row); hold.appendChild(stg); sec.appendChild(hold);
      var tF = 0, pF = 0, rw = 0;
      function meas() { rw = row.scrollWidth; rend(); } /* re-render after measuring so a settled strip doesn't sit at a stale X */
      meas(); addEventListener("resize", meas); addEventListener("load", meas); setTimeout(meas, 800);
      var stF = ScrollTrigger.create({ trigger: hold, start: "top top", end: "bottom bottom", scrub: true, onUpdate: function (self) { tF = self.progress; } });
      tF = stF.progress; pF = tF;
      function rend() {
        var sx = innerWidth * 0.65, ex = -(rw - innerWidth * 0.5);
        row.style.transform = "translateX(" + (sx + (ex - sx) * pF).toFixed(1) + "px)";
      }
      rend();
      (function tf() {
        var d = tF - pF;
        if (Math.abs(d) > 0.0004) { pF += d * 0.08; if (Math.abs(tF - pF) < 0.0004) pF = tF; rend(); }
        requestAnimationFrame(tf);
      })();
    })();
  }

  /* Robin Noguier-style services showcase: card TRAYS that stack over each other as you scroll —
     the heading tray first, then one opaque card per service (name, description and arrow INSIDE
     the card), each new card sliding up to cover the pile while the covered ones settle back and
     dim. Wheel gestures step one tray at a time while the section is pinned, so the footer is only
     reachable after all five. Ticks on the right edge jump between services. Built from the .work
     list — the no-JS / reduced-motion fallback — so the copy lives in one place. */
  if (G) {
    (function () {
      var work = document.querySelector(".work");
      var sec = work && work.closest("section");
      if (!work || !sec) return;
      var rows = [].slice.call(work.querySelectorAll("a"));
      if (rows.length < 2) return;
      var wrapEl = sec.querySelector(".wrap");
      if (!wrapEl) return;
      var n = rows.length, T = n + 1; /* intro tray + one per service */
      sec.classList.add("svcshow", "ss-on");
      sec.style.height = (100 + (T - 1) * 80) + "vh";
      sec.style.padding = "0";
      var stage = document.createElement("div"); stage.className = "ss-stage";
      var inn = document.createElement("div"); inn.className = "wrap ss-in";
      stage.appendChild(inn);
      var slides = document.createElement("div"); slides.className = "ss-slides";
      inn.appendChild(slides);
      /* tray 0: the section heading takes the big-title slot, then glides away */
      var intro = document.createElement("div"); intro.className = "ss-slide intro";
      var eyebrow = wrapEl.querySelector(".eyebrow"), h2 = wrapEl.querySelector("h2");
      if (eyebrow) intro.appendChild(eyebrow);
      if (h2) intro.appendChild(h2);
      slides.appendChild(intro);
      var trays = [{ sl: intro, card: null, cin: null, shade: null, links: [] }];
      rows.forEach(function (a, i) {
        var num = ((a.querySelector(".n") || {}).textContent || ("0" + (i + 1))).trim();
        var name = ((a.querySelector(".nm") || {}).textContent || "").trim();
        var sl = document.createElement("div"); sl.className = "ss-slide";
        var card = document.createElement("div"); card.className = "ss-card svc" + (i % 5); /* each service its own brand colour */
        var numEl = document.createElement("span"); numEl.className = "num"; numEl.setAttribute("aria-hidden", "true"); numEl.textContent = num;
        var cin = document.createElement("div"); cin.className = "cin";
        var nm = document.createElement("a"); nm.className = "nm"; nm.href = a.getAttribute("href"); nm.textContent = name;
        var dc = document.createElement("p"); dc.className = "dc"; dc.textContent = (a.querySelector(".dc") || {}).textContent || "";
        var go = document.createElement("a"); go.className = "go"; go.href = a.getAttribute("href"); go.textContent = "→"; go.setAttribute("aria-label", name);
        cin.appendChild(nm); cin.appendChild(dc); cin.appendChild(go);
        var shade = document.createElement("i"); shade.className = "shade"; shade.setAttribute("aria-hidden", "true");
        card.appendChild(numEl); card.appendChild(cin); card.appendChild(shade);
        sl.appendChild(card);
        slides.appendChild(sl);
        trays.push({ sl: sl, card: card, cin: cin, shade: shade, links: [nm, go] });
      });
      rows.forEach(function (a) { a.tabIndex = -1; }); /* the sr-only fallback is for screen readers; keep its links out of the tab order */
      /* tick pagination on the right edge — one per service, click to jump */
      var ticksBox = document.createElement("div"); ticksBox.className = "ss-ticks";
      var ticks = rows.map(function (a, i) {
        var b = document.createElement("button"); b.type = "button";
        b.setAttribute("aria-label", ((a.querySelector(".nm") || {}).textContent || "").trim());
        b.addEventListener("click", function () {
          var y = sec.getBoundingClientRect().top + window.scrollY + (i + 1) * ((sec.offsetHeight - innerHeight) / (T - 1));
          if (lenis) lenis.scrollTo(y, { duration: 1 }); else window.scrollTo({ top: y, behavior: "smooth" });
        });
        ticksBox.appendChild(b); return b;
      });
      inn.appendChild(ticksBox);
      sec.appendChild(stage);
      trays[0].sl.classList.add("on");
      var target = 0, p = 0, H = stage.offsetHeight || innerHeight, focusIdx = -1, lastT = -1, lastMove = 0, settled = true, wheelLock = 0;
      var fingerDown = false; /* the settle-snap must never tug the page while a thumb is on the glass.
         touch events, not pointer events: pointercancel fires at pan start while the finger is still down */
      addEventListener("touchstart", function () { fingerDown = true; }, { passive: true });
      addEventListener("touchend", function () { fingerDown = false; settled = false; lastMove = performance.now(); }, { passive: true }); /* re-arm the settle-snap after every touch — a tap can cancel an in-flight snap, and without this the deck parks between trays */
      addEventListener("touchcancel", function () { fingerDown = false; settled = false; lastMove = performance.now(); }, { passive: true });
      addEventListener("resize", function () { H = stage.offsetHeight || innerHeight; });
      var st = ScrollTrigger.create({
        trigger: sec, start: "top top", end: "bottom bottom",
        onUpdate: function (self) { target = self.progress * (T - 1); }
      });
      target = st.progress * (T - 1); p = target;
      /* one tray per wheel gesture while the section is pinned — like the reference, the footer
         is only reachable after stepping through every card. At the ends, scroll passes freely. */
      addEventListener("wheel", function (e) {
        var top = sec.getBoundingClientRect().top + window.scrollY;
        var span = sec.offsetHeight - innerHeight, per = span / (T - 1);
        var y = window.scrollY;
        if (y < top - 4 || y > top + span + 4) return; /* not pinned — scroll freely */
        var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; /* normalise line-mode wheels */
        var dir = dy > 0 ? 1 : -1;
        var idx = Math.round((y - top) / per);
        if ((idx <= 0 && dir < 0) || (idx >= T - 1 && dir > 0)) return; /* at the ends, let them leave */
        e.preventDefault(); e.stopImmediatePropagation();
        if (Math.abs(dy) < 8) return; /* ignore inertial dribble */
        var now = performance.now();
        if (now - wheelLock < 650) return; /* one step per gesture */
        wheelLock = now;
        var ny = top + Math.max(0, Math.min(T - 1, idx + dir)) * per;
        if (lenis) lenis.scrollTo(ny, { duration: 0.95 }); else window.scrollTo({ top: ny, behavior: "smooth" });
      }, { passive: false, capture: true });
      function render() {
        var rot = Math.max(-6, Math.min(6, (target - p) * 14)); /* tilt while gliding, settle straight */
        for (var i = 0; i < T; i++) {
          var d = p - i, e = trays[i], on = d > -1.15 && d < 2.3; /* covered cards stay in the pile a while */
          if (on !== e.sl.classList.contains("on")) e.sl.classList.toggle("on", on);
          if (!on) continue;
          /* deck maths: an incoming card rises the full stage height to COVER the pile;
             a covered card stays put, drifting up a touch and shrinking beneath the new one */
          var ty = d < 0 ? (-d * H) : (-d * H * 0.045);
          e.sl.style.transform = "translateY(" + ty.toFixed(1) + "px)";
          if (e.card) {
            var sc = d > 0 ? Math.max(0.9, 1 - d * 0.04) : 1;
            var rf = Math.max(0, 1 - Math.abs(d)); /* only the card in motion tilts */
            e.card.style.transform = "scale(" + sc.toFixed(4) + ") rotate(" + (rot * rf).toFixed(2) + "deg)";
            e.shade.style.opacity = Math.max(0, Math.min(0.55, d * 0.45)).toFixed(3); /* the pile dims as it's covered */
            e.cin.style.transform = "translateY(" + (d < 0 ? (-d * H * 0.06) : 0).toFixed(1) + "px)"; /* content lags inside the rising card */
          }
        }
        var near = Math.max(0, Math.min(T - 1, Math.round(p)));
        for (var j = 0; j < ticks.length; j++) ticks[j].classList.toggle("on", j === near - 1); /* intro tray lights no tick */
        if (near !== focusIdx) { /* only the resting tray's links are tabbable — never an off-screen one */
          focusIdx = near;
          for (var q = 0; q < T; q++) for (var L = 0; L < trays[q].links.length; L++) trays[q].links[L].tabIndex = (q === near) ? 0 : -1;
        }
      }
      render();
      (function tick() {
        if (target !== lastT) { lastT = target; lastMove = performance.now(); settled = false; }
        else if (!settled && !fingerDown && performance.now() - lastMove > 280 && st.isActive) {
          /* scrolling rested between trays — settle onto the nearest one, like the reference */
          settled = true;
          var nr = Math.round(target);
          if (nr >= 0 && nr <= T - 1 && Math.abs(target - nr) > 0.04) {
            var y = sec.getBoundingClientRect().top + window.scrollY + nr * ((sec.offsetHeight - innerHeight) / (T - 1));
            if (lenis) lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo({ top: y, behavior: "smooth" });
          }
        }
        var diff = target - p;
        if (Math.abs(diff) > 0.0004) {
          p += diff * 0.085;
          if (Math.abs(target - p) < 0.0004) p = target;
          render();
        }
        requestAnimationFrame(tick);
      })();
    })();
  }

  /* HELLOMONDAY-principle bendy cards: the card's surface moves into an SVG whose edges curve
     smoothly toward the cursor and spring back. Fine-pointer motion users only — everyone else
     keeps the plain untouched card. Own implementation. */
  if (!RM && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    (function () {
      var M = 36, IN = 120, cards = []; /* wider influence + slower lerp below = the softer, smoother bend the owner asked for */
      var mx = -1e4, my = -1e4;
      addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
      function draw(cd) {
        var el = cd.el, w = el.offsetWidth, h = el.offsetHeight;
        if (!w || !h) return;
        var o = cd.mode === "clip" ? 0 : M;
        var r = Math.min(cd.r, w / 2, h / 2);
        function pt(x, y) { return (x + o).toFixed(1) + "," + (y + o).toFixed(1); }
        var cx0 = Math.max(r + 6, Math.min(w - r - 6, cd.c[0] * w));
        var cy1 = Math.max(r + 6, Math.min(h - r - 6, cd.c[1] * h));
        var cx2 = Math.max(r + 6, Math.min(w - r - 6, cd.c[2] * w));
        var cy3 = Math.max(r + 6, Math.min(h - r - 6, cd.c[3] * h));
        var d =
          "M" + pt(r, 0) +
          "Q" + pt(cx0, cd.b[0]) + " " + pt(w - r, 0) +
          "A" + r + " " + r + " 0 0 1 " + pt(w, r) +
          "Q" + pt(w + cd.b[1], cy1) + " " + pt(w, h - r) +
          "A" + r + " " + r + " 0 0 1 " + pt(w - r, h) +
          "Q" + pt(cx2, h + cd.b[2]) + " " + pt(r, h) +
          "A" + r + " " + r + " 0 0 1 " + pt(0, h - r) +
          "Q" + pt(cd.b[3], cy3) + " " + pt(0, r) +
          "A" + r + " " + r + " 0 0 1 " + pt(r, 0) + "Z";
        if (cd.mode === "clip") { el.style.clipPath = 'path("' + d + '")'; } /* image cards bend by clipping their own surface */
        else {
          cd.svg.setAttribute("viewBox", "0 0 " + (w + 2 * M) + " " + (h + 2 * M));
          /* pin the svg box to the drawn size: cards narrower than their wrap (.cal has a
             max-width) otherwise get the face scaled/centred to the wrap — visibly offset */
          cd.svg.style.width = (w + 2 * M) + "px"; cd.svg.style.height = (h + 2 * M) + "px";
          cd.path.setAttribute("d", d);
        }
      }
      function bendify(el) {
        var cs = getComputedStyle(el);
        var cd = { el: el, mode: el.classList.contains("fs-card") ? "clip" : "svg", r: parseFloat(cs.borderTopLeftRadius) || 16, b: [0, 0, 0, 0], c: [0.5, 0.5, 0.5, 0.5] };
        if (cd.mode === "svg") {
          var wrap = document.createElement("div"); wrap.className = "bend-wrap";
          el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("class", "bend-svg"); svg.setAttribute("aria-hidden", "true");
          var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("fill", cs.backgroundColor);
          path.setAttribute("stroke", cs.borderTopColor); path.setAttribute("stroke-width", "1");
          svg.appendChild(path);
          wrap.insertBefore(svg, el);
          el.style.background = "transparent"; el.style.borderColor = "transparent"; el.style.boxShadow = "none";
          cd.svg = svg; cd.path = path;
        }
        cards.push(cd); draw(cd);
      }
      [].slice.call(document.querySelectorAll(".adcard, .funnel, .cal")).forEach(bendify);
      bendAdd = bendify;
      /* the film strip is built by an earlier module, before bendAdd exists — enrol its cards now */
      [].slice.call(document.querySelectorAll(".fs-card")).forEach(bendify);
      var redraw = function () { cards.forEach(draw); };
      themeHooks.push(function () { /* re-sample the painted faces — the theme just changed the underlying card colours */
        cards.forEach(function (cd) {
          if (cd.mode !== "svg") return;
          cd.el.style.background = ""; cd.el.style.borderColor = "";
          var cs2 = getComputedStyle(cd.el);
          cd.path.setAttribute("fill", cs2.backgroundColor); cd.path.setAttribute("stroke", cs2.borderTopColor);
          cd.el.style.background = "transparent"; cd.el.style.borderColor = "transparent";
        });
      });
      addEventListener("resize", redraw); addEventListener("load", redraw);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw); /* font swap reflows the cards */
      function edgeB(dist) { var f = 1 - Math.min(1, Math.abs(dist) / IN); return f * f * 26 * (dist < 0 ? -1 : 1); }
      (function bloop() {
        for (var i = 0; i < cards.length; i++) {
          var cd = cards[i], rect = cd.el.getBoundingClientRect();
          if (!rect.width) continue;
          var sc = rect.width / (cd.el.offsetWidth || rect.width) || 1;
          var lx = (mx - rect.left) / sc, ly = (my - rect.top) / sc;
          var w = cd.el.offsetWidth, h = cd.el.offsetHeight;
          var near = lx > -IN && lx < w + IN && ly > -IN && ly < h + IN && rect.top < innerHeight && rect.bottom > 0;
          var tb = [0, 0, 0, 0], tc = [0.5, 0.5, 0.5, 0.5];
          if (near) {
            var fx = Math.max(0.12, Math.min(0.88, lx / w)), fy = Math.max(0.12, Math.min(0.88, ly / h));
            if (lx > 0 && lx < w) { tb[0] = edgeB(ly); tb[2] = edgeB(ly - h); tc[0] = fx; tc[2] = fx; }
            if (ly > 0 && ly < h) { tb[1] = edgeB(lx - w); tb[3] = edgeB(lx); tc[1] = fy; tc[3] = fy; }
          }
          var moved = false;
          for (var k = 0; k < 4; k++) {
            var nb = cd.b[k] + (tb[k] - cd.b[k]) * 0.085;
            var nc = cd.c[k] + (tc[k] - cd.c[k]) * 0.085;
            if (Math.abs(nb - cd.b[k]) > 0.01 || Math.abs(nc - cd.c[k]) > 0.001) moved = true;
            cd.b[k] = nb; cd.c[k] = nc;
          }
          if (moved) draw(cd);
        }
        requestAnimationFrame(bloop);
      })();
    })();
  }

  /* (the 14islands paint-drop trail was built here, then removed on the owner's call — the
     footer already carries the hairy star, glitch, stamp and curtain; the trail was one too many) */

  /* the content calendar is tied to scroll: the section holds (sticky, same natural mechanism as
     the services trays — no ScrollTrigger pin, which felt jerky) and the days paint in as you
     scroll, unpainting if you scroll back, until the month is full — then the page moves on.
     Reduced-motion / no-JS see the fully coloured month, never held. */
  if (G) {
    document.querySelectorAll(".cal").forEach(function (cal) {
      var cells = [].slice.call(cal.querySelectorAll(".cal-grid i:not(.x)")); /* .x = the blank lead-in slots before the 1st — never painted */
      var calSec = cal.closest("section");
      var calWrap = calSec && calSec.querySelector(".wrap");
      if (!cells.length || !calSec || !calWrap) return;
      cal.classList.add("will");
      /* hold only if the whole block fits the viewport — on small phones it would clip below the
         fold for the entire hold, so there the paint scrubs in free flow instead. Content height
         is measured from the children (the sticky wrap itself is stretched to 100svh). */
      function calContentH() {
        var t = Infinity, b = -Infinity;
        for (var i = 0; i < calWrap.children.length; i++) {
          var r = calWrap.children[i].getBoundingClientRect();
          if (r.height === 0) continue;
          if (r.top < t) t = r.top; if (r.bottom > b) b = r.bottom;
        }
        return b > t ? b - t : 0;
      }
      var fits = calContentH() <= innerHeight - 40;
      if (fits) {
        calSec.classList.add("calshow");
        calSec.style.height = "240vh";
        calSec.style.padding = "0";
        /* the first measurement is pre-fonts; re-check after load and on rotation, demoting the
           hold (free-flow paint keeps working) if the block no longer fits */
        var demote = function () {
          if (calSec.classList.contains("calshow") && calContentH() > innerHeight - 40) {
            calSec.classList.remove("calshow"); calSec.style.height = ""; calSec.style.padding = "";
            if (window.ScrollTrigger) ScrollTrigger.refresh();
          }
        };
        addEventListener("load", demote); addEventListener("resize", demote);
      }
      var painted = -1;
      ScrollTrigger.create({
        trigger: fits ? calSec : cal, start: fits ? "top top" : "top 80%", end: fits ? "bottom bottom" : "+=120%", scrub: true,
        onUpdate: function (self) {
          /* +2 gives a small tail so the month completes just before the hold releases */
          var k = Math.min(cells.length, Math.floor(self.progress * (cells.length + 2)));
          if (k === painted) return;
          painted = k;
          for (var i = 0; i < cells.length; i++) cells[i].classList.toggle("pnt", i < k);
        }
      });
    });
  }

  /* scroll-driven spotlight on the featured-work services list (row nearest the focus line lights up; skipped when the RN showcase has taken over the section) */
  if (!RM) {
    var work = document.querySelector(".work");
    var wrows = work && !work.closest(".ss-on") ? [].slice.call(work.querySelectorAll("a")) : [];
    if (work && wrows.length) {
      work.classList.add("sfx");
      (function spotlight() {
        var vh = window.innerHeight || 800, wr = work.getBoundingClientRect();
        if (wr.bottom > -120 && wr.top < vh + 120) {
          var focus = vh * 0.44, range = vh * 0.30;
          for (var i = 0; i < wrows.length; i++) {
            var r = wrows[i].getBoundingClientRect(), c = r.top + r.height / 2;
            var p = 1 - Math.min(1, Math.abs(c - focus) / range);
            p = p * p * (3 - 2 * p); /* smoothstep */
            if (wrows[i]._p === undefined || Math.abs(wrows[i]._p - p) > 0.002) { wrows[i].style.setProperty("--p", p.toFixed(3)); wrows[i]._p = p; }
          }
        }
        requestAnimationFrame(spotlight);
      })();
    }
  }

  /* draggable website gallery (Obys-style): grab-and-drag with inertia + ambient drift. Reduced-motion / no-JS keeps the native horizontal scroll so all cards stay reachable. */
  if (!RM) {
    document.querySelectorAll(".ws").forEach(function (ws) {
      if (ws.classList.contains("obys-on")) return; /* the vertical showcase took this section over */
      var rows = [].slice.call(ws.querySelectorAll(".ws-row"));
      if (!rows.length) return;
      rows.forEach(function (row) { row.innerHTML += row.innerHTML; }); /* duplicate once for a seamless loop */
      ws.classList.add("ws-js");
      var st = rows.map(function (row) { return { row: row, x: 0, half: 0, v: 0, dir: row.classList.contains("rev") ? 1 : -1 }; });
      function measure() { st.forEach(function (s) { s.half = s.row.scrollWidth / 2; }); }
      measure(); addEventListener("resize", measure); addEventListener("load", measure); setTimeout(measure, 900);
      var AUTO = 0.35, dragging = false, hovering = false, lastX = 0;
      (function loop() {
        for (var i = 0; i < st.length; i++) {
          var s = st[i];
          if (!dragging) {
            if (Math.abs(s.v) > 0.06) { s.x += s.v; s.v *= 0.90; }
            else if (!hovering) { s.x += AUTO * s.dir; }
          }
          if (s.half > 0) { while (s.x <= -s.half) s.x += s.half; while (s.x > 0) s.x -= s.half; }
          s.row.style.transform = "translateX(" + s.x.toFixed(2) + "px)";
        }
        requestAnimationFrame(loop);
      })();
      function endDrag() { dragging = false; ws.classList.remove("grabbing"); }
      var draggedDist = 0;
      ws.addEventListener("pointerenter", function () { hovering = true; });
      ws.addEventListener("pointerleave", function () { hovering = false; }); /* release is handled by pointerup/cancel (with pointer capture), so a vertical drift out of bounds won't abort a drag */
      ws.addEventListener("pointerdown", function (e) { dragging = true; draggedDist = 0; lastX = e.clientX; ws.classList.add("grabbing"); if (ws.setPointerCapture) { try { ws.setPointerCapture(e.pointerId); } catch (_) {} } });
      ws.addEventListener("pointermove", function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; draggedDist += Math.abs(dx); for (var i = 0; i < st.length; i++) { st[i].x += dx; st[i].v = dx; } });
      ws.addEventListener("click", function (e) { if (draggedDist > 8 && e.detail > 0) { e.preventDefault(); e.stopPropagation(); } draggedDist = 0; }, true); /* a drag-release must not open the demo link — but keyboard clicks (detail 0) always pass */
      ws.addEventListener("pointerup", endDrag);
      ws.addEventListener("pointercancel", endDrag);
      ws.addEventListener("dragstart", function (e) { e.preventDefault(); });
    });
  }

  /* GSAP ScrollTrigger — depth pass */
  if (G) {
    gsap.utils.toArray(".hero .wrap, .phero .wrap").forEach(function (w) {
      var sec = w.closest("section");
      if (sec && !sec.classList.contains("portal") && !sec.classList.contains("no-recede")) gsap.to(w, { yPercent: -6, opacity: 0.12, scale: 0.9, transformOrigin: "50% 35%", ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } }); /* the portal fades its own content; the contact form must never fade under the reader */
    });
    /* (.adscene, not .adcard: the ad card now lives inside the desktop-scene wrapper, which owns
       the parallax so the card doesn't slide around inside its monitor. .cal is excluded — it's
       pinned and scrubbed by its own calendar module.) */
    gsap.utils.toArray(".slider, .adscene, .chat, .funnels, .dlcard, .carousel, .stat").forEach(function (el) {
      gsap.fromTo(el, { y: 72 }, { y: -72, ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "bottom 8%", scrub: 0.6 } });
    });
    /* (heading-plane parallax intentionally omitted: the headings carry .reveal, and a GSAP transform there clobbers the reveal slide-up — depth comes from the media planes + hero recede instead) */
    /* media settles into place with a gentle scrubbed scale as it rises into view */
    gsap.utils.toArray(".adscene, .chat, .carousel, .slider").forEach(function (el) {
      gsap.fromTo(el, { scale: 1.055 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 45%", scrub: 0.8 } });
    });
    /* (the footer arrival is now the TRUE refokus curtain, driven inside the colour-morph loop:
       the page's colour layer lifts like a card off the footer fixed beneath it) */
    addEventListener("load", function () { ScrollTrigger.refresh(); });
    setTimeout(function () { ScrollTrigger.refresh(); }, 800);
  }

  /* scroll-driven section colour-morph */
  if (!RM) {
    var CM = { "s-surf": [18, 26, 46], "s-surf2": [16, 23, 42], "s-surf3": [26, 36, 64], "s-ink": [8, 11, 20], "s-ink2": [12, 17, 32], "s-lt": [240, 183, 166], "s-lt2": [150, 222, 199], "s-lt3": [229, 151, 127], "s-per": [157, 178, 240], "s-white": [255, 255, 255], "s-goldd": [42, 33, 12], "s-mint": [95, 227, 198], "s-mint2": [95, 227, 198], "s-mintd": [13, 41, 33], "s-rose": [255, 140, 122], "s-rosed": [46, 18, 11], "s-gold": [244, 204, 133] };
    var panels = [];
    /* sections only — the footer self-paints ink beneath the curtain now, and keeping it as a
       panel made the lifting card morph to ink-on-ink, erasing the curtain's contrast */
    [].slice.call(document.querySelectorAll("main section")).forEach(function (el) {
      for (var k in CM) { if (el.classList.contains(k)) { panels.push({ el: el, c: CM[k] }); break; } }
    });
    if (panels.length >= 1) { /* >=1: contact has a single section and still needs the layer for the curtain */
      root.classList.add("morph");
      var bgl = document.createElement("div"); bgl.className = "bg-layer";
      document.body.insertBefore(bgl, document.body.firstChild);
      bgl.style.background = "rgb(" + panels[0].c.join(",") + ")";
      function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
      var last = "", footEl = document.querySelector("footer.foot"), lastReveal = -1;
      function colOf(p) { for (var k in CM) { if (p.el.classList.contains(k)) return CM[k]; } return p.c; } /* classes are theme-remapped live */
      /* REFOKUS footer reveal: the last section becomes an opaque sheet (its own morph colour,
         forced over the transparent-section rule); the footer is pulled up UNDERNEATH it by a
         negative margin, so scrolling slides the sheet up and off to uncover the stationary
         footer beneath. A jagged gradient-bar curtain skirts the sheet's bottom edge. */
      /* the footer sits at z-index -2, BEHIND the fixed colour layer; as its region scrolls into
         view paint() lifts the colour layer by exactly that amount, uncovering the whole footer
         from underneath (it never moves, so all of it — star, headline, stamp, links — shows).
         The last .final section carries a jagged gradient-bar curtain at its trailing edge that
         skirts the seam into the footer. */
      var revCap = panels[panels.length - 1].el;
      if (footEl && revCap && revCap.classList.contains("final")) {
        revCap.classList.add("reveal-cap");
        bgl.classList.add("capped"); /* only pages with the .final curtain get the curved card-lift; bare subpages reveal the footer with a clean straight edge */
        var cur = document.createElement("div"); cur.className = "rv-curtain"; cur.setAttribute("aria-hidden", "true");
        for (var ci = 0; ci < 56; ci++) cur.appendChild(document.createElement("i"));
        revCap.appendChild(cur);
      }
      /* paint() reads LIVE geometry every time (no cached tops — layouts change late and cached
         boundaries froze wrong colours over text) and is driven by BOTH raw scroll events and a
         rAF loop: if either mechanism is starved, the other keeps the colours truthful. */
      function paint() {
        try {
          var ih2 = innerHeight, T = Math.min(280, ih2 * 0.42), y = window.scrollY + ih2 * 0.42;
          var tops2 = panels.map(function (p) { return p.el.getBoundingClientRect().top + window.scrollY; });
          /* behind the portal the background must finish its ink→surf-3 blend by the exact scroll
             where the disc hides — but no earlier than needed. Both are navy family, so this is subtle
             anyway; the offset just keeps the swap hidden under the circle. */
          var pOff = discHideBottom > 0 ? Math.max(ih2 * 0.35, discHideBottom - ih2 * 0.42 + T / 2 + 28) : ih2 * 0.8;
          var col = colOf(panels[0]), i, off;
          for (i = 0; i < panels.length; i++) {
            off = (i + 1 < panels.length && panels[i].el.classList.contains("portal")) ? pOff : 0;
            var nt = (i + 1 < panels.length) ? (tops2[i + 1] - off) : Infinity;
            if (y < nt) { col = colOf(panels[i]); break; }
          }
          for (i = 0; i < panels.length - 1; i++) {
            off = panels[i].el.classList.contains("portal") ? pOff : 0;
            var bd = tops2[i + 1] - off;
            if (y > bd - T / 2 && y < bd + T / 2) { var t = (y - (bd - T / 2)) / T; t = t < 0 ? 0 : t > 1 ? 1 : t; t = t * t * (3 - 2 * t); col = lerp(colOf(panels[i]), colOf(panels[i + 1]), t); break; }
          }
          var s = "rgb(" + Math.round(col[0]) + "," + Math.round(col[1]) + "," + Math.round(col[2]) + ")";
          if (s !== last) { bgl.style.background = s; last = s; }
          /* the reveal: as the footer's region enters the viewport, lift the colour layer by that
             exact amount, uncovering the stationary footer beneath — content sliding up off it */
          if (footEl) {
            var fr2 = footEl.getBoundingClientRect();
            var reveal = Math.max(0, Math.min(fr2.height, ih2 - fr2.top));
            if (reveal !== lastReveal) {
              bgl.style.transform = reveal > 0 ? "translateY(" + (-reveal).toFixed(1) + "px)" : "";
              if ((reveal > 0.5) !== (lastReveal > 0.5)) bgl.classList.toggle("lift", reveal > 0.5);
              lastReveal = reveal;
            }
          }
        } catch (err) {
          /* the colour surface must NEVER freeze — log once, keep going */
          if (!window.__morphErr) { window.__morphErr = 1; console.error("morph:", err && err.message, err); }
        }
      }
      paint();
      addEventListener("scroll", paint, { passive: true });
      addEventListener("resize", paint);
      (function frame() { paint(); requestAnimationFrame(frame); })();
    }
  }

  /* top scroll-progress bar — stands in for the hidden native scrollbar.
     Writes transform directly on scroll (compositor-only, no layout thrash); scroll height is
     re-measured only on resize/load so the per-scroll path stays a single cheap style write. */
  (function () {
    var bar = document.getElementById("scrollprog");
    if (!bar) return;
    var d = document.documentElement, max = 1;
    function upd() { var p = (window.scrollY || d.scrollTop || 0) / max; bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, p)) + ")"; }
    function measure() { max = (d.scrollHeight - d.clientHeight) || 1; upd(); }
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", measure);
    addEventListener("load", measure);
    measure();
  })();

  /* footer back-to-top — smooth via Lenis when present, honours reduced motion */
  (function () {
    var t = document.getElementById("totop");
    if (!t) return;
    t.addEventListener("click", function () {
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
    });
  })();
})();
