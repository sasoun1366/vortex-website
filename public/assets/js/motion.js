/* ==========================================================================
   VORTEX — MOTION ENGINE
   لودر · پیشرفت اسکرول · ریویل با تأخیر پله‌ای · شمارنده‌ها · تیلت کارت‌ها
   کرسر سفارشی · پارالاکس · بازگشت به بالا
   همه‌چیز با prefers-reduced-motion احترام می‌گذارد و روی موبایل سبک می‌شود.
   ========================================================================== */
(function () {
  "use strict";

  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- ۱) لودر ---------------------------------------------------- */
  function loader() {
    const el = $("#vx-loader");
    if (!el) return;
    const hide = () => {
      el.classList.add("done");
      setTimeout(() => el.remove(), 700);
      document.documentElement.classList.add("vx-ready");
      startHeroIfNeeded();
    };
    if (RM) return hide();
    const min = 620;                       // کمتر از این، لودر «فلاش» به‌نظر می‌رسد
    const t0 = performance.now();
    const done = () => setTimeout(hide, Math.max(0, min - (performance.now() - t0)));
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done);
    setTimeout(hide, 3200);                // سقف ایمنی
  }

  /* ---------- ۲) پیشرفت اسکرول ------------------------------------------- */
  function progress() {
    const bar = $("#vx-progress");
    if (!bar) return;
    let raf = null;
    const paint = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
      bar.style.transform = `scaleX(${p})`;
      raf = null;
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    addEventListener("resize", paint, { passive: true });
    paint();
  }

  /* ---------- ۳) ریویل با تأخیر پله‌ای ------------------------------------ */
  function reveal() {
    const els = $$("[data-reveal],.vx-line,.mask-img,.reveal");
    if (!("IntersectionObserver" in window) || RM) {
      els.forEach(e => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: .08 });

    // تأخیر پله‌ای داخل هر گروه
    $$("[data-stagger]").forEach(group => {
      const step = Number(group.dataset.stagger) || 90;
      $$("[data-reveal],.reveal", group).forEach((el, i) => el.style.setProperty("--d", `${i * step}ms`));
    });
    els.forEach(e => io.observe(e));
  }

  /* ---------- ۴) شمارنده‌های عددی ----------------------------------------- */
  const toFa = (x) => x.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]).replace(/,/g, "٬");
  const countText = (el) => {
    const lang = document.documentElement.lang || "fa";
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset["suffix" + (lang === "en" ? "En" : "Fa")] || el.dataset.suffix || "";
    const fmt = (n) => (lang === "fa" ? toFa(n.toLocaleString("en-US")) : n.toLocaleString("en-US")) + suffix;
    return { target, fmt };
  };
  const counted = new WeakSet();

  function counters() {
    const els = $$("[data-count]");

    // اعدادی که قبلاً شمرده شده‌اند → در زبان فعلی دوباره نوشته شوند
    els.forEach(el => {
      if (counted.has(el)) { const { target, fmt } = countText(el); el.textContent = fmt(target); }
    });

    const pending = els.filter(el => !counted.has(el));
    if (!pending.length) return;

    const run = (el) => {
      counted.add(el);
      const { target, fmt } = countText(el);
      if (RM) { el.textContent = fmt(target); return; }
      el.textContent = fmt(0);
      const dur = 1500, t0 = performance.now();
      const tick = (t) => {
        const prog = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - prog, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (prog < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) { pending.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: .4 });
    pending.forEach(el => io.observe(el));
  }

  /* ---------- ۵) تیلت سه‌بعدی + درخشش ------------------------------------- */
  function tilt() {
    if (!FINE || RM) return;
    $$(".card,.cat-card").forEach(card => {
      if (!$(".tilt-glare", card)) {
        const g = document.createElement("div");
        g.className = "tilt-glare";
        (card.querySelector(".card-media") || card).appendChild(g);
      }
      let raf = null;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const ry = (px - .5) * 8, rx = (.5 - py) * 8;
          card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
          const g = $(".tilt-glare", card);
          if (g) { g.style.setProperty("--gx", (px * 100) + "%"); g.style.setProperty("--gy", (py * 100) + "%"); }
          raf = null;
        });
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- ۶) کرسر سفارشی --------------------------------------------- */
  function cursor() {
    if (!FINE || RM) return;
    const ring = document.createElement("div");
    const dot  = document.createElement("div");
    ring.id = "vx-cursor"; dot.id = "vx-cursor-dot";
    document.body.append(ring, dot);
    document.documentElement.classList.add("vx-cursor-on");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      dot.classList.add("on"); ring.classList.add("on");
    }, { passive: true });
    (function loop() {
      rx += (x - rx) * .16; ry += (y - ry) * .16;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) rotate(45deg)`;
      requestAnimationFrame(loop);
    })();
    const grow = (v) => ring.classList.toggle("grow", v);
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("a,button,.card,.cat-card,.gal,input,textarea,.quote");
      grow(Boolean(t));
    });
  }

  /* ---------- ۷) پارالاکس -------------------------------------------------- */
  function parallax() {
    const els = $$("[data-parallax]");
    if (!els.length || RM) return;
    let raf = null;
    const paint = () => {
      const vh = innerHeight;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = Number(el.dataset.parallax) || .12;
        const mid = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0,${(-mid * speed).toFixed(1)}px,0)`;
      });
      raf = null;
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    addEventListener("resize", paint, { passive: true });
    paint();
  }

  /* ---------- ۸) بازگشت به بالا ------------------------------------------- */
  function toTop() {
    const btn = document.createElement("button");
    btn.id = "to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "back to top");
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
    document.body.appendChild(btn);
    const paint = () => btn.classList.toggle("on", scrollY > 700);
    addEventListener("scroll", paint, { passive: true });
    btn.addEventListener("click", () => scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }));
    paint();
  }

  /* ---------- ۹) تیترهای دوخطی هیرو (ماسک) -------------------------------- */
  function heroLines() {
    const h1 = $(".hero h1");
    if (!h1 || RM || h1.dataset.splitDone) return;
    h1.dataset.splitDone = "1";
    const html = h1.innerHTML;
    const parts = html.split(/<br\s*\/?>/i);
    h1.innerHTML = parts.map((line, i) =>
      `<span class="line-mask"><span style="--d:${140 + i * 130}ms">${line}</span></span>`).join("");
  }
  function startHeroIfNeeded() { heroLines(); }

  /* ---------- ۱۰) سایه/نور محیطی ملایم با حرکت ماوس ---------------------- */
  function spotlightCursor() {
    if (!FINE || RM) return;
    const blobs = $$(".glow-blob");
    if (!blobs.length) return;
    let raf = null;
    addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const dx = (e.clientX / innerWidth - .5) * 26;
        const dy = (e.clientY / innerHeight - .5) * 26;
        blobs.forEach((b, i) => {
          const f = (i % 2 ? -1 : 1);
          b.style.marginInlineStart = (dx * f).toFixed(1) + "px";
          b.style.marginTop = (dy * f).toFixed(1) + "px";
        });
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------- اجرا -------------------------------------------------------- */
  function boot() {
    loader();
    progress();
    heroLines();
    reveal();
    counters();
    tilt();
    cursor();
    parallax();
    toTop();
    spotlightCursor();

    // بعد از تغییر زبان، تأخیر پله‌ای و متن‌های دوباره‌ساخته‌شده دوباره تنظیم شوند
    window.vxMotionRefresh = () => { counters(); tilt(); };

    const mo = new MutationObserver(() => {
      counters();
      tilt();
    });
    ["#featured-grid", "#shop-grid", "#soon-grid"].forEach(sel => {
      const host = $(sel);
      if (host) mo.observe(host, { childList: true });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
