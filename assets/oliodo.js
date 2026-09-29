// Patisserie Oliodo. — site script (2026-09 / v4)
// 動きの目的：ヒーローの登場（第一印象）／写真の段階的な表示（読む順番）／
// 大切にしていることの写真切り替え（今読んでいる項目の強調）／パフェの横移動（コレクションを歩いて見る体験）
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ヘッダー：ページ上端を過ぎたら帯を敷く（スクロールイベントは使わない）
  var mh = document.querySelector('.masthead');
  if (mh && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:120px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (en) { mh.classList.toggle('is-solid', !en[0].isIntersecting); }).observe(sentinel);
    // 今見ているセクションをナビで示す
    var links = {};
    document.querySelectorAll('.gnav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = links[e.target.id]; if (a) a.classList.toggle('is-current', e.isIntersecting); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) secIO.observe(el); });
  }

  // モバイルメニュー
  var btn = document.getElementById('menuBtn'), nav = document.getElementById('gnav');
  if (btn && nav) {
    var close = function () { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // 表示アニメーション
  var items = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  // ヒーロー写真の切り替え（数枚をゆっくりクロスフェード）
  var hero = document.getElementById('heroMedia');
  if (hero) {
    var hs = hero.querySelectorAll('picture'), dots = document.querySelectorAll('.hero-dots i'), hi = 0, SLIDE = 6500;
    document.documentElement.style.setProperty('--slide', (SLIDE / 1000) + 's');
    var show = function (n) {
      hs[hi].classList.remove('is-on'); if (dots[hi]) dots[hi].classList.remove('is-on');
      hi = n; hs[hi].classList.add('is-on');
      if (dots[hi]) { void dots[hi].offsetWidth; dots[hi].classList.add('is-on'); }
    };
    if (dots[0]) setTimeout(function () { dots[0].classList.add('is-on'); }, 60);
    if (hs.length > 1 && !reduce) setInterval(function () { if (!document.hidden) show((hi + 1) % hs.length); }, SLIDE);
  }

  // 大切にしていること：読んでいる項目に合わせて写真を切り替え
  var values = document.querySelectorAll('.value[data-stage]');
  var stage = document.querySelectorAll('.values-stage figure');
  if (values.length && stage.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = +en.target.dataset.stage;
        values.forEach(function (v) { v.classList.toggle('is-active', v === en.target); });
        stage.forEach(function (f, j) { f.classList.toggle('is-on', j === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    values.forEach(function (v) { vio.observe(v); });
  } else {
    document.documentElement.classList.add('no-stage');
  }

  // ===== スクロール連動の演出（GSAP ScrollTrigger）=====
  // ・文章の塗り：読む速さに合わせて一文字ずつ濃くなる
  // ・写真の帯：近づくように寄っていく
  // ・写真の視差、背景のモノグラムの漂い、2025 の横移動
  // ・パフェ：縦スクロールで横に流す（コレクションを歩いて見る）
  function splitChars(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function (ch) { var sp = document.createElement('span'); sp.className = 'c'; sp.textContent = ch; frag.appendChild(sp); });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(el);
  }

  function motion() {
    var sec = document.getElementById('parfait'), track = document.getElementById('pfTrack');
    var wide = window.matchMedia('(min-width: 901px)').matches;
    if (reduce || !window.gsap || !window.ScrollTrigger) { if (sec) sec.classList.add('is-native'); return; }
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('js-motion');

    // 慣性のある滑らかなスクロール（マウス操作の端末のみ）
    if (window.Lenis && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); if (id.length < 2) return;
          var t = document.querySelector(id); if (!t) return;
          e.preventDefault(); lenis.scrollTo(t, { offset: -90, duration: 1.4 });
        });
      });
    }

    // 並んだ要素は少しずつ時間差で
    document.querySelectorAll('.flow-list li, .terms-grid .term, .b2b-facts > *').forEach(function (el, i, all) {
      var sib = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.transitionDelay = (sib * 0.08) + 's';
    });

    document.querySelectorAll('[data-fill]').forEach(function (el) {
      splitChars(el);
      gsap.to(el.querySelectorAll('.c'), { opacity: 1, ease: 'none', stagger: 0.02,
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 } });
    });

    var heroImg = document.querySelector('[data-hero]');
    if (heroImg) gsap.to(heroImg, { yPercent: 8, scale: 1.08, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    document.querySelectorAll('[data-zoom]').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.closest('.band'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    document.querySelectorAll('.band-word').forEach(function (w) {
      gsap.fromTo(w, { xPercent: 4 }, { xPercent: -2, ease: 'none',
        scrollTrigger: { trigger: w.closest('.band'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    document.querySelectorAll('[data-parallax]').forEach(function (img) {
      gsap.set(img, { scale: 1.08 });
      gsap.fromTo(img, { yPercent: -3.5 }, { yPercent: 3.5, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    document.querySelectorAll('[data-drift]').forEach(function (wm) {
      if (wm.classList.contains('wm-statement')) { gsap.set(wm, { yPercent: -50 }); }
      gsap.fromTo(wm, { y: 60 }, { y: -60, ease: 'none',
        scrollTrigger: { trigger: wm.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    var year = document.querySelector('.award-year');
    if (year) gsap.set(year, { x: 0, y: 0, xPercent: -50, yPercent: -52 });
    if (year) gsap.fromTo(year, { xPercent: -47 }, { xPercent: -53, ease: 'none',
      scrollTrigger: { trigger: '#award', start: 'top bottom', end: 'bottom top', scrub: true } });

    if (sec && track) {
      if (!wide) { sec.classList.add('is-native'); }
      else {
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var bar = document.getElementById('pfBar');
        gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true,
            onUpdate: function (st) { if (bar) bar.style.transform = 'scaleX(' + st.progress.toFixed(3) + ')'; } } });
      }
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
  motion();

  // 品書き：名前にカーソルを乗せると写真が浮かぶ（デスクトップのみ）
  var menu = document.getElementById('menu'), flo = document.getElementById('menuFloat');
  if (menu && flo && window.matchMedia('(hover: hover) and (min-width: 900px)').matches) {
    var fimg = flo.querySelector('img'), tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    var loop = function () {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      flo.style.transform = 'translate3d(' + (cx + 40) + 'px,' + (cy - 180) + 'px,0) scale(' + (flo.classList.contains('is-on') ? 1 : .85) + ')';
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    menu.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    menu.querySelectorAll('li').forEach(function (li) {
      li.addEventListener('pointerenter', function (e) {
        if (!flo.classList.contains('is-on')) { cx = tx = e.clientX; cy = ty = e.clientY; }
        fimg.src = li.dataset.img; flo.classList.add('is-on'); if (!raf) raf = requestAnimationFrame(loop);
      });
    });
    menu.addEventListener('pointerleave', function () { flo.classList.remove('is-on'); if (!raf) raf = requestAnimationFrame(loop); });
  }

  // お問い合わせタブ
  var tabs = document.querySelectorAll('[role="tab"]');
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    var sent = document.getElementById('sent'); if (sent) sent.hidden = true;
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { select(t); }); });
  var q = new URLSearchParams(location.search).get('tab');
  if (q) { var t0 = document.getElementById('tab-' + q); if (t0) select(t0); }

  // フォーム：メールアプリで送る
  document.querySelectorAll('form[data-subject]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var body = '[' + f.dataset.subject + ']\n\n';
      f.querySelectorAll('input,select,textarea').forEach(function (el) {
        var lb = f.querySelector('label[for="' + el.id + '"]');
        var name = lb ? lb.childNodes[0].textContent.trim() : el.name;
        body += name + '：' + el.value + '\n';
      });
      var who = (f.querySelector('[name="company"]') || f.querySelector('[name="name"]') || {}).value || '';
      location.href = 'mailto:w.sato@oliodo.com?subject=' + encodeURIComponent('[Oliodo.] ' + f.dataset.subject + '　' + who) + '&body=' + encodeURIComponent(body);
      var sent = document.getElementById('sent'); if (sent) sent.hidden = false;
    });
  });
})();
