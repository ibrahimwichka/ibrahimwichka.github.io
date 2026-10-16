(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const EMAIL = 'wichkaibrahim06@outlook.com';
  const LINKS = {
    github: 'https://github.com/ibrahimwichka',
    linkedin: 'https://www.linkedin.com/in/ibrahim-wichka-96a15024b/',
    scholar: 'https://scholar.google.com/citations?user=kFej9DMAAAAJ&hl=en',
    doi: 'https://doi.org/10.1016/j.csbj.2024.10.019',
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // Show Ctrl instead of ⌘ off Apple platforms
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  if (!isMac) $$('.mod-key').forEach((k) => { k.textContent = 'Ctrl'; });

  /* ─────────────── Toast + clipboard ─────────────── */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 1800);
  }

  async function copy(text, msg = 'Copied to clipboard') {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      ta.remove();
    }
    toast(msg);
  }

  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', () => copy(EMAIL, '✓ Email copied')));
  $$('[data-copy-target]').forEach((b) => b.addEventListener('click', () => {
    const src = document.getElementById(b.dataset.copyTarget);
    copy(src.textContent, '✓ BibTeX copied');
    b.textContent = 'copied';
    setTimeout(() => { b.textContent = 'copy'; }, 1500);
  }));

  /* ─────────────── Theme ─────────────── */
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const currentTheme = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  function syncThemeUI() {
    const t = currentTheme();
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    themeMeta.setAttribute('content', t === 'light' ? '#f7f9fc' : '#0a0f1c');
  }
  function setTheme(t) {
    if (t === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    store.set('theme', t);
    syncThemeUI();
    if (net) net.refreshColor();
  }
  const toggleTheme = () => setTheme(currentTheme() === 'light' ? 'dark' : 'light');
  themeBtn.addEventListener('click', toggleTheme);
  syncThemeUI();

  /* ─────────────── Scroll: nav, progress, back-to-top ─────────────── */
  const nav = $('#nav');
  const bar = $('.progress span');
  const toTop = $('#to-top');
  const ring = $('.ring-fg');
  const CIRC = 2 * Math.PI * 21;
  ring.style.strokeDasharray = String(CIRC);

  let lastY = window.scrollY;
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    bar.style.transform = `scaleX(${p})`;
    ring.style.strokeDashoffset = String(CIRC * (1 - p));
    nav.classList.toggle('is-scrolled', y > 8);
    if (!document.body.classList.contains('menu-open') && !nav.contains(document.activeElement)) {
      if (Math.abs(y - lastY) > 4) nav.classList.toggle('is-hidden', y > lastY && y > 260);
    }
    toTop.classList.toggle('is-show', y > 640);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ─────────────── Active section in nav ─────────────── */
  const navLinks = $$('.nav-links a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
    // Clear highlight when back in the hero
    const ho = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.remove('is-active'));
    }, { rootMargin: '-45% 0px -50% 0px' });
    ho.observe($('#top'));
  }

  /* ─────────────── Mobile menu ─────────────── */
  const menuBtn = $('#menu-toggle');
  const menu = $('#mobile-menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { menu.removeAttribute('inert'); nav.classList.remove('is-hidden'); }
    else menu.setAttribute('inert', '');
  }
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 860) setMenu(false); });

  /* ─────────────── Reveal on scroll ─────────────── */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => ro.observe(el));
  }

  /* ─────────────── Experience accordion ─────────────── */
  const jobs = $$('.job');
  const toggleAll = $('#toggle-all');
  function setJob(job, open) {
    job.classList.toggle('is-open', open);
    $('.job-head', job).setAttribute('aria-expanded', String(open));
    const body = $('.job-body', job);
    if (open) body.removeAttribute('inert'); else body.setAttribute('inert', '');
  }
  const allOpen = () => jobs.every((j) => j.classList.contains('is-open'));
  function syncToggleAll() {
    toggleAll.textContent = allOpen() ? '[−] collapse all' : '[+] expand all';
  }
  function setAllJobs(open) { jobs.forEach((j) => setJob(j, open)); syncToggleAll(); }
  jobs.forEach((job) => {
    setJob(job, job.hasAttribute('data-open'));
    $('.job-head', job).addEventListener('click', () => {
      setJob(job, !job.classList.contains('is-open'));
      syncToggleAll();
    });
  });
  toggleAll.addEventListener('click', () => setAllJobs(!allOpen()));
  syncToggleAll();

  /* ─────────────── Generic dropdowns (Cite) ─────────────── */
  $$('.dd-toggle').forEach((btn) => {
    const body = document.getElementById(btn.getAttribute('aria-controls'));
    body.setAttribute('inert', '');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      body.classList.toggle('is-open', open);
      if (open) body.removeAttribute('inert'); else body.setAttribute('inert', '');
    });
  });

  /* ─────────────── Skills grep ─────────────── */
  const filter = $('#skill-filter');
  const count = $('#grep-count');
  const cards = $$('.skill-card');
  const allChips = $$('.skill-card .chip');
  const showTotal = () => { count.textContent = `${allChips.length} skills`; };
  showTotal();
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let total = 0;
    cards.forEach((card) => {
      let hits = 0;
      $$('.chip', card).forEach((c) => {
        const hit = q !== '' && c.textContent.toLowerCase().includes(q);
        c.classList.toggle('is-match', hit);
        c.classList.toggle('is-dim', q !== '' && !hit);
        if (hit) hits += 1;
      });
      card.classList.toggle('is-dim', q !== '' && hits === 0);
      total += hits;
    });
    if (q === '') showTotal();
    else count.textContent = `${total} match${total === 1 ? '' : 'es'}`;
  });
  filter.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { filter.value = ''; filter.dispatchEvent(new Event('input')); }
  });

  /* ─────────────── Command palette ─────────────── */
  const palette = $('#palette');
  const pInput = $('#palette-input');
  const pList = $('#palette-list');
  let lastFocus = null;
  let selected = 0;
  let visible = [];

  const go = (sel) => {
    const el = $(sel);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const openUrl = (u) => window.open(u, '_blank', 'noopener');

  const commands = [
    { group: 'Navigate', icon: '#', label: 'About', hint: '01', run: () => go('#about') },
    { group: 'Navigate', icon: '#', label: 'Experience', hint: '02', run: () => go('#experience') },
    { group: 'Navigate', icon: '#', label: 'Education', hint: '03', run: () => go('#education') },
    { group: 'Navigate', icon: '#', label: 'Publications', hint: '04', run: () => go('#publications') },
    { group: 'Navigate', icon: '#', label: 'Skills', hint: '05', run: () => go('#skills') },
    { group: 'Navigate', icon: '#', label: 'Contact', hint: '06', run: () => go('#contact') },
    { group: 'Navigate', icon: '↑', label: 'Back to top', hint: '', run: () => go('#top') },
    { group: 'Actions', icon: '⧉', label: 'Copy email address', hint: EMAIL, run: () => copy(EMAIL, '✓ Email copied') },
    { group: 'Actions', icon: '@', label: 'Send an email', hint: 'mailto', run: () => { window.location.href = 'mailto:' + EMAIL; } },
    { group: 'Actions', icon: '◐', label: 'Toggle light / dark theme', hint: '', run: toggleTheme },
    { group: 'Actions', icon: '+', label: 'Expand all experience', hint: '', run: () => { setAllJobs(true); go('#experience'); } },
    { group: 'Actions', icon: '/', label: 'Search skills', hint: 'grep', run: () => { go('#skills'); setTimeout(() => filter.focus({ preventScroll: true }), reduceMotion ? 0 : 500); } },
    { group: 'Links', icon: '↗', label: 'GitHub', hint: 'github.com/ibrahimwichka', run: () => openUrl(LINKS.github) },
    { group: 'Links', icon: '↗', label: 'LinkedIn', hint: 'in/ibrahim-wichka', run: () => openUrl(LINKS.linkedin) },
    { group: 'Links', icon: '↗', label: 'Google Scholar', hint: 'scholar.google.com', run: () => openUrl(LINKS.scholar) },
    { group: 'Links', icon: '↗', label: 'Publication (DOI)', hint: '10.1016/j.csbj.2024.10.019', run: () => openUrl(LINKS.doi) },
  ];

  function render() {
    const q = pInput.value.trim().toLowerCase();
    visible = commands.filter((c) => !q || `${c.group} ${c.label} ${c.hint}`.toLowerCase().includes(q));
    selected = Math.min(selected, Math.max(0, visible.length - 1));
    pList.innerHTML = '';
    if (!visible.length) {
      const li = document.createElement('li');
      li.className = 'palette-empty';
      li.textContent = 'No results.';
      pList.appendChild(li);
      pInput.removeAttribute('aria-activedescendant');
      return;
    }
    let group = '';
    visible.forEach((c, idx) => {
      if (c.group !== group) {
        group = c.group;
        const g = document.createElement('li');
        g.className = 'palette-group';
        g.setAttribute('role', 'presentation');
        g.textContent = group;
        pList.appendChild(g);
      }
      const li = document.createElement('li');
      li.className = 'palette-item';
      li.id = `pi-${idx}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(idx === selected));
      const icon = document.createElement('span');
      icon.className = 'pi-icon';
      icon.textContent = c.icon;
      const label = document.createElement('span');
      label.textContent = c.label;
      li.append(icon, label);
      if (c.hint) {
        const hint = document.createElement('span');
        hint.className = 'pi-hint';
        hint.textContent = c.hint;
        li.appendChild(hint);
      }
      li.addEventListener('mousemove', () => { if (selected !== idx) { selected = idx; updateSelection(); } });
      li.addEventListener('click', () => runCommand(idx));
      pList.appendChild(li);
    });
    pInput.setAttribute('aria-activedescendant', `pi-${selected}`);
  }

  function updateSelection() {
    $$('.palette-item', pList).forEach((li) => {
      const on = li.id === `pi-${selected}`;
      li.setAttribute('aria-selected', String(on));
      if (on) li.scrollIntoView({ block: 'nearest' });
    });
    pInput.setAttribute('aria-activedescendant', `pi-${selected}`);
  }

  function openPalette() {
    if (!palette.hidden) return;
    lastFocus = document.activeElement;
    setMenu(false);
    palette.hidden = false;
    document.body.classList.add('palette-open');
    pInput.value = '';
    selected = 0;
    render();
    requestAnimationFrame(() => pInput.focus());
  }
  function closePalette() {
    if (palette.hidden) return;
    palette.hidden = true;
    document.body.classList.remove('palette-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function runCommand(idx) {
    const c = visible[idx];
    if (!c) return;
    closePalette();
    c.run();
  }

  $('#open-palette').addEventListener('click', openPalette);
  $$('[data-close]', palette).forEach((el) => el.addEventListener('click', closePalette));
  pInput.addEventListener('input', () => { selected = 0; render(); });
  pInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (visible.length) { selected = (selected + 1) % visible.length; updateSelection(); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (visible.length) { selected = (selected - 1 + visible.length) % visible.length; updateSelection(); } }
    else if (e.key === 'Enter') { e.preventDefault(); runCommand(selected); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  });

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') {
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
      return;
    }
    if (e.key === 'Escape') {
      if (!palette.hidden) closePalette();
      else if (menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    }
  });

  /* ─────────────── Cursor spotlight ─────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    let mx = 0;
    let my = 0;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', mx + 'px');
        root.style.setProperty('--my', my + 'px');
        raf = 0;
      });
    }, { passive: true });
  }

  /* ─────────────── Hero network canvas ─────────────── */
  var net = (() => {
    const canvas = $('#net');
    const hero = $('#top');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let pts = [];
    let raf = 0;
    let running = false;
    let inView = true;
    let rgb = '94,234,212';
    const mouse = { x: -9999, y: -9999 };
    const LINK = 135;
    const MOUSE_LINK = 190;

    const toRgb = (hex) => {
      const m = hex.replace('#', '').trim();
      const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
      const n = parseInt(full, 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    };

    function seed() {
      const n = Math.max(24, Math.min(95, Math.round((w * h) / 15000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.3 + 0.7,
      }));
    }

    function size() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const widthChanged = Math.abs(rect.width - w) > 1;
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || !pts.length) seed();
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const light = root.getAttribute('data-theme') === 'light';
      const lineA = light ? 0.28 : 0.2;
      const dotA = light ? 0.55 : 0.5;
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const o = (1 - Math.sqrt(d2) / LINK) * lineA;
            ctx.strokeStyle = `rgba(${rgb},${o})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < MOUSE_LINK) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - md / MOUSE_LINK) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${rgb},${dotA})`;
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      for (const p of pts) {
        // gentle pull toward the cursor
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_LINK && d > 1) { p.vx += (dx / d) * 0.006; p.vy += (dy / d) * 0.006; }
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 0.5) { p.vx *= 0.5 / sp; p.vy *= 0.5 / sp; }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) { p.vx *= -1; p.x = Math.max(0, Math.min(w, p.x)); }
        if (p.y < 0 || p.y > h) { p.vy *= -1; p.y = Math.max(0, Math.min(h, p.y)); }
      }
    }

    function loop() {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduceMotion || !inView || document.hidden) return;
      running = true;
      loop();
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function refreshColor() {
      rgb = toRgb(getComputedStyle(root).getPropertyValue('--accent'));
      if (!running) draw();
    }

    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        if (inView) start(); else stop();
      }).observe(hero);
    }

    rgb = toRgb(getComputedStyle(root).getPropertyValue('--accent'));
    size();
    start();
    return { refreshColor };
  })();
})();
