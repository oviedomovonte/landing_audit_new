(() => {
  const CATS = [
    { label: 'Projects', h: ['Name', 'Key', 'Type'], rows: [['Platform Engineering','PLAT','Software'],['Customer Support','SUP','Service management'],['Marketing Ops','MKT','Business'],['Mobile App','MOB','Software'],['IT Requests','ITR','Service management']] },
    { label: 'Workflows', h: ['Name', 'Statuses', 'Projects'], rows: [['Software Simplified Workflow','5 statuses','PLAT, MOB'],['Support Triage','7 statuses','SUP'],['Marketing Review','4 statuses','MKT'],['IT Request Flow','6 statuses','ITR']] },
    { label: 'Schemes', h: ['Name', 'Type', 'Projects'], rows: [['Default Permission Scheme','Permission','MKT, ITR'],['PLAT Issue Type Scheme','Issue type','PLAT'],['Support Notification Scheme','Notification','SUP'],['Mobile Screen Scheme','Screen','MOB']] },
    { label: 'Users', h: ['Name', 'Status', 'Group'], rows: [['Ana Ruiz','Active','jira-admins'],['Daniel Okafor','Active','developers'],['Mei Tanaka','Inactive','—'],['Lucas Ferreira','Active','service-desk-agents']] },
    { label: 'Custom fields', h: ['Name', 'Field type', 'Contexts'], rows: [['Story Points','Number','2'],['Customer Tier','Select list','1'],['Release Train','Labels','Global'],['Root Cause','Text field','1']] },
  ];
  const STATUS = ['Queued', 'Fetching', 'Fetched'];
  const STATUS_COLOR = ['#8A92A8', '#69AAFF', '#A3AABD'];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  let cat = 0, status = CATS.map(() => 0), timers = [];

  // Build hero flow rows and sidebar
  const flowRows = $('#flow-rows'), catList = $('#cat-list');
  CATS.forEach((c, i) => {
    const row = el('div', 'flow-row');
    row.append(el('span', 'flow-row-label', c.label));
    const track = el('span', 'flow-track'); track.append(el('span', 'flow-bar')); row.append(track);
    row.append(el('span', 'flow-row-status'));
    flowRows.append(row);
    const b = el('button', 'cat'); b.type = 'button';
    b.append(el('span', 'cat-name', c.label), el('span', 'cat-status'));
    b.addEventListener('click', () => { cat = i; render(); });
    catList.append(b);
  });

  function render() {
    const done = status.filter(s => s === 2).length;
    [...flowRows.children].forEach((row, i) => {
      const s = status[i];
      const bar = row.querySelector('.flow-bar');
      bar.style.width = ['0%', '55%', '100%'][s];
      bar.style.background = s === 2 ? '#0474EF' : '#69AAFF';
      const st = row.querySelector('.flow-row-status');
      st.textContent = STATUS[s]; st.style.color = STATUS_COLOR[s];
    });
    $('#flow-summary').textContent = done === CATS.length ? 'All categories fetched' : `${done} of ${CATS.length} fetched`;
    $('#flow-export').classList.toggle('is-ready', done === CATS.length);

    [...catList.children].forEach((b, i) => {
      b.setAttribute('aria-pressed', String(i === cat));
      const st = b.querySelector('.cat-status');
      st.textContent = STATUS[status[i]];
      st.style.color = status[i] === 2 && i === cat ? '#69AAFF' : STATUS_COLOR[status[i]];
    });

    const c = CATS[cat], s = status[cat];
    $('#mock-title').textContent = c.label;
    $('#mock-meta').textContent = s === 2 ? `${c.rows.length} sample records · ready to review` : s === 1 ? 'Fetching from Jira…' : 'Waiting to fetch';
    const table = $('#mock-table');
    table.classList.toggle('is-loading', s === 1);
    table.classList.toggle('is-dim', s !== 2);
    const head = $('#mock-thead'); head.replaceChildren(...c.h.map(t => el('span', null, t)));
    $('#mock-rows').replaceChildren(...c.rows.map(r => { const d = el('div', 'trow'); d.append(...r.map(t => el('span', null, t))); return d; }));
  }

  function runFetch() {
    timers.forEach(clearTimeout); timers = [];
    if (reduced) { status = CATS.map(() => 2); render(); return; }
    status = CATS.map(() => 0); render();
    CATS.forEach((_, i) => {
      timers.push(setTimeout(() => { status[i] = 1; render(); }, 500 + i * 650));
      timers.push(setTimeout(() => { status[i] = 2; render(); }, 1100 + i * 650));
    });
  }
  $('#fetch-all').addEventListener('click', runFetch);
  runFetch();

  // Scroll-lit headline
  const lit = $('#problem-h');
  const KEY = new Set(['Projects,', 'schemes,', 'workflows', 'fields,']);
  const words = lit.getAttribute('aria-label').split(' ');
  lit.replaceChildren(...words.map(w => { const s = el('span', null, w + ' '); s.setAttribute('aria-hidden', 'true'); s.dataset.key = KEY.has(w) ? '1' : ''; return s; }));
  const spans = [...lit.children], N = spans.length;
  function updateLit() {
    let p = 1;
    if (!reduced) {
      const r = lit.getBoundingClientRect(), vh = window.innerHeight;
      p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.5)));
    }
    spans.forEach((s, i) => {
      const o = Math.min(1, Math.max(0, p * (N + 3) - i));
      s.style.opacity = (0.14 + 0.86 * o).toFixed(3);
      s.style.color = s.dataset.key && o > 0.6 ? '#69AAFF' : '#F1F1F1';
    });
  }

  // Sticky header state
  const header = $('.site-header');
  const onScroll = () => { header.classList.toggle('is-scrolled', window.scrollY > 12); updateLit(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Getting started guide
  const gsGrid = $('.gs-grid');
  if (gsGrid) {
    const items = [...gsGrid.querySelectorAll('.gs-item')];
    const shots = [...gsGrid.querySelectorAll('.gs-shot')];
    const count = $('#gs-count');
    let cur = 0, auto = !reduced;
    const go = (i, user) => {
      cur = (i + items.length) % items.length;
      if (user) { auto = false; gsGrid.classList.remove('is-auto'); }
      items.forEach((it, k) => {
        const on = k === cur;
        it.classList.toggle('is-active', on);
        const b = it.querySelector('.gs-btn');
        on ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current');
      });
      shots.forEach((s, k) => { s.classList.toggle('is-active', k === cur); s.setAttribute('aria-hidden', String(k !== cur)); });
      count.textContent = `Step ${cur + 1} of ${items.length}`;
    };
    items.forEach((it, i) => {
      it.querySelector('.gs-btn').addEventListener('click', () => go(i, true));
      it.querySelector('.gs-bar').addEventListener('animationend', () => { if (auto) go(cur + 1); });
    });
    const fit = () => shots.forEach(sh => {
      const fr = sh.querySelector('.gs-frame'), sc = sh.querySelector('.gs-screen');
      if (!fr || !sc) return;
      const w = sc.offsetWidth, h = sc.offsetHeight;
      const k = Math.min(1.15, sh.clientWidth / w, sh.clientHeight / h);
      sc.style.transform = `scale(${k})`;
      fr.style.width = (w * k) + 'px'; fr.style.height = (h * k) + 'px';
    });
    fit(); window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    $('#gs-prev').addEventListener('click', () => go(cur - 1, true));
    $('#gs-next').addEventListener('click', () => go(cur + 1, true));
    go(0);
    if (auto) {
      gsGrid.classList.add('is-auto', 'is-paused');
      let visible = false, hover = false;
      const sync = () => gsGrid.classList.toggle('is-paused', !visible || hover);
      gsGrid.addEventListener('mouseenter', () => { hover = true; sync(); });
      gsGrid.addEventListener('mouseleave', () => { hover = false; sync(); });
      if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }, { threshold: 0.35 }).observe(gsGrid);
      else { visible = true; sync(); }
    }
  }

  // Reveal on scroll
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('is-hidden'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(n => {
      if (n.getBoundingClientRect().top < window.innerHeight) return;
      n.classList.add('is-hidden'); io.observe(n);
    });
  }
})();
