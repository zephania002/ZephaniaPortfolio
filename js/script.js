/* Site settings: set these once. Empty values hide or adapt the related UI. */
const CONFIG = {
  github: '',        // e.g. https://github.com/yourname
  linkedin: '',      // e.g. https://www.linkedin.com/in/yourname
  formspreeId: '',   // e.g. abcdwxyz from https://formspree.io
  email: 'zephany001@gmail.com'
};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

$$('[data-link]').forEach(a => { const u = CONFIG[a.dataset.link]; if (u) a.href = u; else a.hidden = true; });
$('#yr').textContent = new Date().getFullYear();

const tbtn = $('#theme');
function setTheme(t, save) {
  root.dataset.theme = t;
  tbtn.textContent = t === 'dark' ? '\u2600' : '\u263E';
  tbtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  $('meta[name=theme-color]').content = t === 'dark' ? '#0c1226' : '#faf8f3';
  if (save) try { localStorage.setItem('theme', t); } catch (e) {}
}
setTheme(root.dataset.theme);
tbtn.onclick = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);

const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
const onScroll = () => nav.classList.toggle('solid', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const scrim = $('#scrim');
function toggleMenu(open) {
  menu.classList.toggle('open', open); scrim.classList.toggle('show', open); nav.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
links0();
function links0() { $$('a', menu).forEach((a, i) => a.style.setProperty('--i', i)); }
scrim.onclick = () => toggleMenu(false);
addEventListener('resize', () => { if (innerWidth > 860) toggleMenu(false); });
burger.onclick = () => toggleMenu(!menu.classList.contains('open'));
$$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

const links = $$('a', menu);
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .15 });
$$('.sec h2, .card, .svc, .rail li').forEach(el => { el.classList.add('rv'); rv.observe(el); });

$$('.chip').forEach(c => c.onclick = () => {
  $$('.chip').forEach(x => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); });
  $$('.card').forEach(card => card.hidden = c.dataset.f !== 'all' && !card.dataset.cat.split(' ').includes(c.dataset.f));
});

const modal = $('#modal');
$$('.card .link').forEach(b => b.onclick = () => {
  const card = b.closest('.card');
  $('#mt').textContent = card.dataset.title;
  $('#mb').innerHTML = $('.case', card).innerHTML;
  modal.showModal();
});
$('#close').onclick = () => modal.close();
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

const form = $('#form'), status = $('#status');
const rules = {
  name: v => v.trim() ? '' : 'Enter your name.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.',
  subject: v => v.trim() ? '' : 'Enter a subject.',
  message: v => v.trim().length >= 10 ? '' : 'Write at least 10 characters.'
};
form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  for (const k in rules) {
    const msg = rules[k](form.elements[k].value);
    $(`[data-e=${k}]`).textContent = msg; form.elements[k].setAttribute('aria-invalid', !!msg);
    if (msg) ok = false;
  }
  if (!ok) return status.textContent = 'Fix the highlighted fields and send again.';
  const data = new FormData(form);
  if (data.get('_gotcha')) return;
  if (!CONFIG.formspreeId) {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(data.get('message') + '\n\n' + data.get('name') + ' <' + data.get('email') + '>')}`;
    return;
  }
  const btn = $('button[type=submit]', form); btn.disabled = true; status.textContent = 'Sending…';
  try {
    const r = await fetch('https://formspree.io/f/' + CONFIG.formspreeId, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!r.ok) throw 0;
    form.reset(); status.textContent = 'Message sent. I will reply soon.';
  } catch { status.textContent = `Message not sent. Email me at ${CONFIG.email} instead.`; }
  btn.disabled = false;
});

// Footer reveal
const foot = $('#foot');
$$('.foot-main > *, .foot-grid > *').forEach(el => el.classList.add('fi'));
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { foot.classList.add('in'); o.disconnect(); } }), { threshold: .2 }).observe(foot);

// Particle network (hero and footer): light, pauses off-screen, static when motion is reduced
function particles(cv) {
  const ctx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, pts = [], run = false, raf;
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.round(Math.min(70, w * h / 16000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      if (!still) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
      ctx.fillStyle = 'rgba(160,172,255,.8)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.3); ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let k = i + 1; k < pts.length; k++) {
      const d = Math.hypot(pts[i].x - pts[k].x, pts[i].y - pts[k].y);
      if (d < 120) { ctx.strokeStyle = `rgba(127,140,255,${.28 * (1 - d / 120)})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[k].x, pts[k].y); ctx.stroke(); }
    }
    if (run && !still) raf = requestAnimationFrame(draw);
  };
  size(); draw();
  addEventListener('resize', () => { size(); draw(); });
  if (!still) new IntersectionObserver(([e]) => { run = e.isIntersecting; cancelAnimationFrame(raf); if (run) draw(); }).observe(cv);
}
$$('.fx').forEach(particles);
