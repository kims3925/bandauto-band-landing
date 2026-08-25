/**
 * 미리보기 화면 공용 샘플 데이터 세트 — 단일 원본 (2026-08-25)
 *
 * ★ 이 파일이 유일한 원본입니다.
 *   화면 HTML 에 적힌 숫자는 전부 여기서 나온 값이어야 합니다. 대시보드는 30건인데
 *   주문 화면은 12건이면 그 순간 조작된 화면처럼 보입니다. 값을 고칠 일이 생기면
 *   **여기를 먼저 고치고** `node check-consistency.mjs` 로 화면과 어긋나지 않는지 확인하십시오.
 *
 * ★ 실데이터 금지
 *   고객 실명·연락처·주소, 실제 밴드명(가족함께수산 등), 도매처 실상호, 도매 단가,
 *   결제 승인번호, 사업자번호, 실제 매출 절대액은 이 파일에 절대 넣지 않습니다.
 *   전화번호는 실제로 배정되지 않는 010-0000 대역을 쓰고 뒷자리는 **** 로 가립니다.
 *   상호는 실존 업체와 겹치지 않도록 "예시" 를 붙인 가공 이름만 씁니다.
 *
 * ★ 기준일은 하드코딩하지 않습니다 (2026-08-25 수정)
 *   날짜를 박아 두면 석 달 뒤에 들어온 사장님이 석 달 전 날짜의 "오늘 매출"을 봅니다.
 *   관리하지 않는 제품처럼 보이므로, **가장 최근 금요일**을 매번 계산합니다.
 *   금요일로 고정하는 이유는 주문이 몰리는 요일이라 화면이 비어 보이지 않기 때문입니다.
 *   금액·건수는 그대로 두므로 요일 곡선의 앞뒤가 맞습니다.
 */

const DEMO = {
  /* ── 가게와 기준일 ─────────────────────────────────── */
  // 실존 업체와 겹치면 그쪽에서 항의가 들어온다. "예시" 를 붙여 검색해도 걸리지 않는
  // 가공 상호만 쓴다. 실제 고객 밴드명(가족함께수산 등)은 절대 넣지 않는다.
  shop: {
    name: '예시수산',
    bandName: '예시수산 소매밴드',
    mallName: '예시수산 쇼핑몰',
  },
  // 가장 최근 금요일(오늘이 금요일이면 오늘). 화면마다 "오늘"이 어긋나지 않도록
  // 이 한 곳에서만 계산하고, 모든 화면이 여기서 값을 읽는다.
  today: (function () {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() - ((d.getDay() - 5 + 7) % 7))   // 5 = 금요일
    const mm = d.getMonth() + 1
    const dd = d.getDate()
    return {
      date: d,
      short: `${mm}월 ${dd}일`,
      label: `${mm}월 ${dd}일 (금)`,
      deadline: '오후 3시 마감',
    }
  })(),

  /* ── 도매처 3곳 (발주서가 "도매처별 양식"을 보이려면 최소 3곳) ── */
  wholesalers: [
    { id: 'A', name: '도매처 A', deadline: '15:00', format: '엑셀' },
    { id: 'B', name: '도매처 B', deadline: '14:00', format: '텍스트' },
    { id: 'C', name: '도매처 C', deadline: '16:00', format: '엑셀' },
  ],

  /* ── 상품 8종 — 소싱·AI가격·상품목록·발주서가 공유 ──────
     ⚠️ 마진율(%)은 데이터에도 화면에도 두지 않는다 (2026-08-25 사장님 결정).
        랜딩은 공개 페이지라 소매 고객도 본다. 원가 대비 몇 % 를 붙이는지
        공개적으로 알리는 셈이 되므로 비율 표기는 쓰지 않는다.
        배송비는 4,000원 기준. */
  // 품절 1종과 매진임박 2종을 일부러 섞었다. 전부 판매중이면 재고 기능이 화면에 안 드러난다.
  products: [
    { id: 1, name: '통영 생굴 1kg',      emoji: '🦪', cost: 12000, price: 18900, stock: 20, left: 3,  vendor: 'A', state: 'soon' },
    { id: 2, name: '손질 갈치 (대) 2미',  emoji: '🐟', cost: 15500, price: 23900, stock: 30, left: 12, vendor: 'A', state: 'on'   },
    { id: 3, name: '반건조 가자미 5미',   emoji: '🐠', cost: 11000, price: 17900, stock: 25, left: 18, vendor: 'A', state: 'on'   },
    { id: 4, name: '완도 활전복 10미',    emoji: '🐚', cost: 28000, price: 42900, stock: 12, left: 4,  vendor: 'B', state: 'soon' },
    { id: 5, name: '제주 옥돔 3미',       emoji: '🐡', cost: 22000, price: 33900, stock: 15, left: 9,  vendor: 'B', state: 'on'   },
    { id: 6, name: '법성포 굴비 10미',    emoji: '🍢', cost: 32000, price: 48900, stock: 10, left: 6,  vendor: 'B', state: 'on'   },
    { id: 7, name: '국산 새우살 500g',    emoji: '🦐', cost: 9800,  price: 15900, stock: 25, left: 0,  vendor: 'C', state: 'out'  },
    { id: 8, name: '손질 오징어 1kg',     emoji: '🦑', cost: 8500,  price: 13900, stock: 40, left: 22, vendor: 'C', state: 'on'   },
  ],

  /* ── 오늘 지표 — 대시보드 카드에 그대로 ───────────────── */
  // 카드 812,000 + 무통장 472,000 = 매출 1,284,000. 합이 맞아야 한다.
  // 사장님들은 숫자를 더해 본다. 어긋나면 제품 전체의 계산을 못 믿게 된다.
  metrics: {
    revenue: 1284000,
    orders: 30,
    card:  { count: 18, amount: 812000 },
    cash:  { count: 12, amount: 472000 },
    newOrders: 7,
    awaitingDeposit: { count: 4, amount: 158000 },
    awaitingApproval: 3,
    sourcingDetected: { total: 12, saved: 5, dup: 2, filtered: 1 },
    notify: { sent: 24, failed: 1 },
  },

  /* ── 고객 8명 — 실제로 배정되지 않는 번호 대역만 ───────── */
  customers: [
    { name: '김O진', phone: '010-0000-****' },
    { name: '박O수', phone: '010-0000-****' },
    { name: '이O민', phone: '010-0000-****' },
    { name: '정O아', phone: '010-0000-****' },
    { name: '최O호', phone: '010-0000-****' },
    { name: '강O빈', phone: '010-0000-****' },
    { name: '윤O래', phone: '010-0000-****' },
    { name: '한O결', phone: '010-0000-****' },
  ],

  /* ── 좌측 메뉴 — 실제 관리자 패널과 동일 구성 ───────────
     아직 미리보기를 안 만든 메뉴도 남겨둔다. 메뉴를 지우면 제품이 작아 보인다.
     ready:false 면 눌렀을 때 "상담 때 보여드립니다" 안내가 뜬다. */
  menu: [
    { group: '소싱', items: [
      { label: '대시보드',     icon: '📊', href: 'manager.html',           ready: true  },
      { label: '도매 모니터링', icon: '📡', href: 'manager-sourcing.html',  ready: true  },
      { label: '채널 관리',     icon: '🏪', href: '#',                      ready: false },
      { label: '밴드 계정',     icon: '🔑', href: '#',                      ready: false },
    ]},
    { group: '상품', items: [
      { label: 'AI 상세·가격',  icon: '🤖', href: 'manager-ai.html',        ready: true  },
      { label: '발행 승인함',   icon: '✅', href: 'manager-approve.html',   ready: true  },
      { label: '상품 목록',     icon: '📦', href: '#',                      ready: false },
      { label: '카테고리 관리', icon: '🗂️', href: '#',                      ready: false },
    ]},
    { group: '주문·발주', items: [
      { label: '통합 주문',     icon: '🧾', href: 'manager-orders.html',    ready: true  },
      { label: '원클릭 발주서', icon: '📤', href: 'manager-purchase.html',  ready: true  },
      { label: '입금·결제 확인', icon: '💰', href: '#',                     ready: false },
      { label: '송장 일괄등록', icon: '🚚', href: '#',                      ready: false },
    ]},
    { group: '광고·응대', items: [
      { label: '종합발행',      icon: '📰', href: '#',                      ready: false },
      { label: '콜라주',        icon: '🖼️', href: '#',                      ready: false },
      { label: '카톡광고',      icon: '💬', href: '#',                      ready: false },
      { label: '통합 인박스',   icon: '📥', href: '#',                      ready: false },
    ]},
    { group: '리포트·설정', items: [
      { label: '매출 리포트',   icon: '📈', href: '#',                      ready: false },
      { label: '자동화 설정',   icon: '⚙️', href: '#',                      ready: false },
      { label: '밴드 연동/API', icon: '🔌', href: '#',                      ready: false },
    ]},
  ],

  /* ── 화면 순환 순서 — 하단 "다음 화면 →" 이 이 순서로 돈다 ── */
  tour: [
    { file: 'manager.html',          title: '오늘 대시보드',        step: ''       },
    { file: 'manager-sourcing.html', title: '도매 모니터링·보관함', step: 'Step 1' },
    { file: 'manager-ai.html',       title: 'AI 상세페이지·가격',   step: 'Step 2' },
    { file: 'manager-approve.html',  title: '발행 승인함',          step: 'Step 3' },
    { file: 'manager-orders.html',   title: '통합 주문',            step: 'Step 4' },
    { file: 'manager-purchase.html', title: '원클릭 발주서',        step: 'Step 5' },
  ],

  /* ── 검사기(check-demo.mjs)가 쓰는 금지 문자열 ──────────
     실제 고객·운영 식별자가 데모에 새어 들어오면 잡아낸다. */
  blacklist: [
    '가족함께수산', 'withfamily', 'band.us/@',
    '경영매니저', '경영푸드', '경영반찬', '장해정',
    'snsauto', 'abcpharm', 'hublink.im/sourcing',
    'catricia2022', 'terror8710', 'jins3925',
    'sk-ant-', 'AIzaSy', 'Bearer ',
  ],

  /* ── 랜딩 주소 (돌아가기·신청 버튼) ─────────────────── */
  landing: { home: '../index.html', apply: '../index.html#apply' },
}

if (typeof window !== 'undefined') window.DEMO = DEMO
if (typeof module !== 'undefined' && module.exports) module.exports = DEMO
