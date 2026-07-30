/* ===================================================
   ESTYMATOR · shared.js
   Cursor · Canvas · Hamburger · Scroll reveal
   =================================================== */

(function () {

  /* ── HAMBURGER ──────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const nlinks = document.querySelector('.nlinks');
  if (toggle && nlinks) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      nlinks.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close on nav link click
    nlinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        nlinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── CUSTOM CURSOR ──────────────────────────────── */
  const cur  = document.getElementById('cur');
  const cur2 = document.getElementById('cur2');
  if (cur && cur2) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cur.style.transform = 'translate(' + (mx - 8) + 'px,' + (my - 8) + 'px)';
    }, { passive: true });
    (function animC() {
      rx += (mx - rx) * .12; ry += (my - ry) * .12;
      cur2.style.transform = 'translate(' + (rx - 22) + 'px,' + (ry - 22) + 'px)';
      requestAnimationFrame(animC);
    })();
    document.querySelectorAll('a,button,.acard,.tcard,.eitem,.step,.step-box,.card,.blog-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
    });
  }

  /* ── ANIMATED BACKGROUND CANVAS ────────────────── */
  const canvas = document.getElementById('bgCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    function resizeCvs() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCvs();
    window.addEventListener('resize', resizeCvs);

    const colors = [
      'rgba(0,27,46,', 'rgba(17,74,107,', 'rgba(180,29,21,',
      'rgba(222,192,173,', 'rgba(232,167,132,'
    ];
    const pts = [];
    for (let i = 0; i < 80; i++) pts.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .5,
      vy: (Math.random() - .5) * .5,
      r: Math.random() * 3 + 1,
      ci: Math.floor(Math.random() * colors.length)
    });

    let hmx = window.innerWidth / 2, hmy = window.innerHeight / 2;
    document.addEventListener('mousemove', e => { hmx = e.clientX; hmy = e.clientY; });
    // Touch support
    document.addEventListener('touchmove', e => {
      hmx = e.touches[0].clientX; hmy = e.touches[0].clientY;
    }, { passive: true });

    function drawBg() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;  if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        const dx = hmx - p.x, dy = hmy - p.y, d = Math.sqrt(dx*dx+dy*dy);
        if (d < 100) { p.x -= dx*.004; p.y -= dy*.004; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = colors[p.ci] + '0.55)'; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx+dy*dy);
          if (d < 140) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(17,74,107,${.3*(1-d/140)})`;
            ctx.lineWidth = .5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawBg);
    }
    drawBg();
  }

  /* ── SCROLL REVEAL ──────────────────────────────── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });

  function observeRv() {
    document.querySelectorAll('.rv:not(.vis), .rv2:not(.vis)').forEach(el => obs.observe(el));
    document.querySelectorAll('.rv-stagger > *').forEach(el => {
      if (!el.classList.contains('rv') && !el.classList.contains('rv2')) {
        el.classList.add('rv');
        obs.observe(el);
      }
    });
  }
  observeRv();
  window._estObserveRv = observeRv;

})();
