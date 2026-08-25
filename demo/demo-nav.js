/**
 * 미리보기 화면 공용 크롬 — 좌측 메뉴 · 모바일 서랍 · 하단 순환 버튼 · 계측 (2026-08-25)
 *
 * ★ 왜 JS 로 만드나
 *   메뉴와 하단 버튼을 화면마다 손으로 넣으면 화면을 늘릴 때마다 빠뜨린다.
 *   여기서 한 번 만들면 이 파일을 부르는 모든 화면에 자동으로 생긴다.
 *
 * ★ 본문은 건드리지 않는다
 *   표·카드 같은 실제 내용은 각 HTML 에 정적으로 박아 둔다. 검색엔진이 화면 내용을
 *   그대로 읽어가야 하기 때문이다(색인 허용이 이 미리보기의 부수 목적이다).
 *   이 스크립트는 껍데기(메뉴·배너·하단바)만 만든다.
 *
 * 각 화면은 <body data-screen="manager-sourcing.html"> 로 자기 위치를 알린다.
 */
;(function () {
  var D = window.DEMO
  if (!D) return

  var here =
    document.body.getAttribute('data-screen') ||
    (location.pathname.split('/').pop() || 'manager.html')

  /* ── 계측 ────────────────────────────────────────────
     랜딩과 같은 이름의 이벤트를 쓴다. GA4 가 붙기 전에도 dataLayer 에 쌓아 두어
     나중에 태그만 붙이면 과거 정의 그대로 잡히게 한다. */
  window.dataLayer = window.dataLayer || []
  function track(name, params) {
    var payload = Object.assign({ event: name }, params || {})
    window.dataLayer.push(payload)
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {})
  }

  var idx = D.tour.findIndex(function (t) { return t.file === here })
  var cur = idx >= 0 ? D.tour[idx] : null

  // 화면 열람 — 어느 화면을 열었는지
  track('preview_open', { screen: here, screen_name: cur ? cur.title : here })

  // 한 방문에서 몇 장을 봤는지. sessionStorage 로 세어 방문 단위로 유지한다.
  try {
    var KEY = 'bandauto_preview_seen'
    var seen = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    if (seen.indexOf(here) === -1) seen.push(here)
    sessionStorage.setItem(KEY, JSON.stringify(seen))
    track('preview_depth', { depth: seen.length, screens: seen.join(',') })
    // 신청 폼에서 "미리보기를 본 방문자"를 구분할 수 있게 표식을 남긴다.
    localStorage.setItem('bandauto_preview_seen_any', '1')
  } catch (e) { /* 사생활 보호 모드 등 — 계측 실패가 화면을 막지는 않는다 */ }

  /* ── 좌측 메뉴 ──────────────────────────────────────
     실제 관리자 패널과 같은 구성. 아직 안 만든 화면도 남겨 둔다 —
     메뉴를 지우면 제품이 실제보다 작아 보인다. */
  var side = document.querySelector('.side')
  if (side) {
    var html =
      '<a class="brand" href="manager.html">' +
      '<span class="mark">밴</span><b>' + D.shop.name + '</b></a><nav>'
    D.menu.forEach(function (g) {
      html += '<div class="grp">' + g.group + '</div>'
      g.items.forEach(function (it) {
        var on = it.ready && it.href === here
        var cls = 'nav-i' + (on ? ' on' : '') + (it.ready ? '' : ' soon')
        var href = it.ready ? it.href : 'javascript:void(0)'
        html +=
          '<a class="' + cls + '" href="' + href + '"' +
          (it.ready ? '' : ' data-soon="1"') + '>' +
          '<i>' + it.icon + '</i>' + it.label + '</a>'
      })
    })
    html += '</nav><div class="side-foot">' + D.shop.name + ' · 미리보기<br>실제 화면은 로그인 후 사용합니다.</div>'
    side.innerHTML = html

    // 아직 안 만든 메뉴 — 지금 무엇을 볼 수 있는지 알려준다.
    side.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-soon]')
      if (!a) return
      e.preventDefault()
      alert('이 화면은 준비 중입니다.\n무료체험 상담 때 직접 보여드립니다.')
    })
  }

  /* ── 모바일 서랍 ────────────────────────────────────
     좁은 화면에서 사이드바가 숨으면 다른 화면으로 갈 길이 없어진다. */
  var topbar = document.querySelector('.topbar')
  if (side && topbar) {
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'menubtn'
    btn.setAttribute('aria-label', '메뉴 열기')
    btn.setAttribute('aria-expanded', 'false')
    btn.innerHTML = '<span aria-hidden="true">☰</span>메뉴'
    var right = topbar.querySelector('.right')
    ;(right || topbar).appendChild(btn)

    var back = document.createElement('div')
    back.className = 'navback'
    document.body.appendChild(back)

    function setOpen(open) {
      side.classList.toggle('open', open)
      back.classList.toggle('on', open)
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
      btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기')
      document.body.style.overflow = open ? 'hidden' : ''
    }
    btn.addEventListener('click', function () { setOpen(!side.classList.contains('open')) })
    back.addEventListener('click', function () { setOpen(false) })
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false) })
    side.addEventListener('click', function (e) { if (e.target.closest('a[href]:not([data-soon])')) setOpen(false) })
  }

  /* ── 하단 고정 3버튼 — 한 장만 보고 이탈하는 걸 막는다 ── */
  var main = document.querySelector('.main')
  if (main && cur) {
    var next = D.tour[(idx + 1) % D.tour.length]
    var bar = document.createElement('div')
    bar.className = 'tourbar'
    bar.innerHTML =
      '<a class="back" href="' + D.landing.home + '" data-ev="back">←<span> 랜딩으로</span></a>' +
      '<a class="next" href="' + next.file + '" data-ev="next">다음 화면 → ' + next.title + '</a>' +
      '<span class="pos">' + (idx + 1) + ' / ' + D.tour.length + '</span>' +
      '<a class="apply" href="' + D.landing.apply + '" data-ev="apply">무료체험 신청</a>'
    main.appendChild(bar)

    bar.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-ev]')
      if (!a) return
      var ev = a.getAttribute('data-ev')
      if (ev === 'next') track('preview_next', { from: here, to: next.file })
      if (ev === 'apply') track('apply_click', { source: 'preview_' + here })
      if (ev === 'back') track('preview_back', { from: here })
    })
  }

  /* ── 상단 배너의 신청 버튼도 계측 ─────────────────── */
  var demobar = document.querySelector('.demobar')
  if (demobar) {
    demobar.addEventListener('click', function (e) {
      var a = e.target.closest('a.cta')
      if (a) track('apply_click', { source: 'preview_bar_' + here })
    })
  }
})()
