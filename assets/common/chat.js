/* 상담 챗봇 (공통, 프로토타입)
   - 오른쪽 아래 챗봇 버튼 / 프로젝트 상세 제목 줄 [문의하기]를 누르면 site.js가 이 파일을 불러와 OP.chat.open(ctx)
   - ctx = { key, cat, no, title } 이면 그 프로젝트 문의, 없으면 일반 상담
   - 주제 버튼 → 내용 입력 → 접수. 대화는 계정·프로젝트별로 이 브라우저(op.pchat)에 저장되고
     마이페이지 문의내역(op.inquiries)에도 '프로젝트 문의' / '상담 문의'로 남는다
   - 공개 프로젝트 상세(omicspharm-project-detail-prot.html)는 같은 모양의 창을 페이지 안에 따로 가지고 있음 */
(function () {
  var OP = window.OP = window.OP || {};
  var STORE = 'op.pchat';
  var TOPICS = {
    project: [
      ['견적·비용', '견적이나 비용에 대해 궁금한 점을 적어주세요.\n예) 견적 항목 설명, 결제 조건'],
      ['계약', '계약에 대해 궁금한 점을 적어주세요.\n예) 계약서 양식, 서명 방법'],
      ['분석·일정', '분석 진행이나 일정에 대해 궁금한 점을 적어주세요.\n예) 시료 발송 방법, 중간 결과 공유 시점'],
      ['결과보고서', '결과보고서에 대해 궁금한 점이나 수정이 필요한 내용을 적어주세요.\n예) 그래프 추가, 통계 방법 변경'],
      ['기타', '궁금한 점을 자유롭게 적어주세요.']
    ],
    general: [
      ['분석 의뢰', '어떤 분석을 의뢰하고 싶으신가요?\n예) 혈장 단백체 정량, 시료 20개'],
      ['서비스 이용', '서비스 이용에 대해 궁금한 점을 적어주세요.\n예) 견적은 어떻게 받나요?'],
      ['분석파트너 등록', '분석파트너 등록에 대해 궁금한 점을 적어주세요.\n예) 파트너 인증 서류, 견적 제안 방법'],
      ['계정·회원정보', '계정이나 회원정보에 대해 궁금한 점을 적어주세요.'],
      ['기타', '궁금한 점을 자유롭게 적어주세요.']
    ]
  };
  var CLIP = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 6l-6 6a2 2 0 003 3l6-6a4 4 0 00-6-6l-6 6"/></svg>';
  var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var hm = function (t) { var d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  var readS = function () { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; } };
  var mob = function () { return matchMedia('(max-width:640px)').matches; };

  var pq, dim, log, tx, send, fileIn, att, ctx, th, key, ses, me;

  function build() {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="pq-dim" id="pqDim" hidden></div>' +
      '<section class="pq" id="pq" role="dialog" aria-modal="true" aria-labelledby="pqTitle" hidden>' +
        '<div class="pq-hd"><div><h2 id="pqTitle">상담 챗봇</h2><p><i></i>OmicsPharm 컨설턴트가 확인 후 답변드립니다 · 평일 1일 이내</p></div>' +
          '<button type="button" class="pq-x" id="pqX" aria-label="닫기"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg></button></div>' +
        '<div class="pq-prj" id="pqPrjBox"><small><b id="pqCat"></b><span id="pqNo"></span></small><strong id="pqPrj"></strong></div>' +
        '<div class="pq-log" id="pqLog" aria-live="polite"></div>' +
        '<div class="pq-ft">' +
          '<div class="pq-att" id="pqAtt" hidden>' + CLIP.replace(/20/g, '14') + '<span></span><button type="button" aria-label="첨부 취소">×</button></div>' +
          '<div class="pq-in"><button type="button" class="pq-ib" id="pqClip" aria-label="파일 첨부">' + CLIP + '</button><input type="file" id="pqFile" hidden>' +
            '<textarea id="pqTx" rows="1" placeholder="궁금한 점을 입력해주세요"></textarea>' +
            '<button type="button" class="pq-ib pq-send" id="pqSend" aria-label="보내기" disabled><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16V4M5 9l5-5 5 5"/></svg></button></div>' +
          '<p class="pq-note" id="pqNote"></p>' +
        '</div>' +
      '</section>');
    var $ = function (s) { return document.querySelector(s); };
    pq = $('#pq'); dim = $('#pqDim'); log = $('#pqLog'); tx = $('#pqTx'); send = $('#pqSend'); fileIn = $('#pqFile'); att = $('#pqAtt');
    $('#pqX').addEventListener('click', close); dim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pq.hidden) close(); });
    window.addEventListener('resize', function () { if (isOpen()) place(); });
    log.addEventListener('click', function (e) { var b = e.target.closest('#pqChips button'); if (b) pick(+b.dataset.i); });
    tx.addEventListener('input', sync);
    tx.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!send.disabled) submit(); } });
    $('#pqClip').addEventListener('click', function () { fileIn.click(); });
    fileIn.addEventListener('change', function () { att.hidden = !fileIn.files[0]; att.querySelector('span').textContent = fileIn.files[0] ? fileIn.files[0].name : ''; sync(); });
    att.querySelector('button').addEventListener('click', function () { fileIn.value = ''; att.hidden = true; sync(); });
    send.addEventListener('click', submit);
  }
  var topics = function () { return TOPICS[ctx ? 'project' : 'general']; };
  var save = function () { try { var all = readS(); all[key] = th; localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) {} };
  var down = function () { log.scrollTop = log.scrollHeight; };
  function bubble(m) {
    var el = document.createElement('div');
    el.className = 'pq-m' + (m.me ? ' me' : '');
    var file = m.file ? '<div class="file">' + CLIP.replace(/20/g, '14') + esc(m.file) + '</div>' : '';
    var done = m.done ? '<dl class="pq-done"><div><dt>접수번호</dt><dd>' + esc(m.done) + '</dd></div><div><dt>주제</dt><dd>' + esc(th.topic) + '</dd></div><a href="mypage-inquiry.html?id=' + encodeURIComponent(m.done) + '">문의내역에서 보기 ›</a></dl>' : '';
    el.innerHTML = (m.me ? '' : '<span class="av" aria-hidden="true"></span>') +
      '<div>' + (m.me ? '' : '<span class="who">' + (m.who || 'OmicsPharm') + '</span>') + (m.t ? '<div class="bb">' + esc(m.t) + file + '</div>' : '') + done + '</div>' +
      '<time>' + hm(m.at) + '</time>';
    log.appendChild(el);
  }
  function chips() {
    var c = document.createElement('div'); c.className = 'pq-chips'; c.id = 'pqChips';
    c.innerHTML = topics().map(function (t, i) { return '<button type="button" data-i="' + i + '">' + t[0] + '</button>'; }).join('');
    log.appendChild(c);
  }
  function add(m) { m.at = m.at || Date.now(); th.msgs.push(m); save(); bubble(m); down(); }
  function bot(m, then) {
    var t = document.createElement('div'); t.className = 'pq-m';
    t.innerHTML = '<span class="av" aria-hidden="true"></span><div class="bb pq-typing"><i></i><i></i><i></i></div>';
    log.appendChild(t); down();
    setTimeout(function () { t.remove(); add(m); if (then) then(); }, 650);
  }
  function render() {
    log.innerHTML = '<span class="pq-day">' + (th.msgs[0] ? new Date(th.msgs[0].at) : new Date()).toLocaleDateString('ko-KR') + '</span>';
    th.msgs.forEach(bubble);
    if (!th.topic) chips();
    if (th.qid) { // 컨설턴트 답변이 등록되었으면 대화에 표시 (마이페이지 문의내역과 같은 데이터)
      var Q; try { Q = JSON.parse(localStorage.getItem('op.inquiries') || '[]'); } catch (e) { Q = []; }
      var q = Q.filter(function (v) { return v.id === th.qid; })[0];
      if (q && q.answer) bubble({ who: 'OmicsPharm 컨설턴트', t: q.answer.body, at: q.answer.at });
    }
    down();
  }
  // 창은 챗봇 버튼 바로 위에 붙임
  function place() {
    var f = document.querySelector('.op-chat');
    if (!f || mob()) return;
    var r = f.getBoundingClientRect();
    if (!r.width) return;
    pq.style.bottom = (innerHeight - r.top + 16) + 'px';
    pq.style.right = (innerWidth - r.right) + 'px';
    pq.style.height = 'min(640px, ' + Math.max(420, r.top - 16 - 88) + 'px)';
  }
  var isOpen = function () { return pq && !pq.hidden && pq.classList.contains('on'); };
  function open(c) {
    ses = OP.session && OP.session();
    if (!ses) { location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); return; }
    if (!pq) build();
    ctx = c && c.title ? c : null;
    me = ((OP.account && OP.account(ses.email)) || {}).name || '회원';
    key = (ses.email || '') + '|' + (ctx ? ctx.key : 'general');
    th = readS()[key] || { msgs: [], topic: '', qid: '' };
    document.getElementById('pqTitle').textContent = ctx ? '프로젝트 문의' : '상담 챗봇';
    document.getElementById('pqPrjBox').hidden = !ctx;
    if (ctx) { document.getElementById('pqCat').textContent = ctx.cat || ''; document.getElementById('pqNo').textContent = ctx.no || ''; document.getElementById('pqPrj').textContent = ctx.title; }
    document.getElementById('pqNote').textContent = ctx ? '이 프로젝트 담당 OmicsPharm 컨설턴트가 확인합니다.' : 'OmicsPharm 컨설턴트가 확인합니다.';
    if (!th.msgs.length) th.msgs.push({ t: me + '님, 안녕하세요.\n' + (ctx ? '이 프로젝트에 대해 어떤 점이 궁금하신가요?' : '무엇을 도와드릴까요?'), at: Date.now() });
    render(); place();
    pq.hidden = dim.hidden = false; if (mob()) document.documentElement.style.overflow = 'hidden';
    void pq.offsetWidth; pq.classList.add('on'); dim.classList.add('on');
    setTimeout(function () { (th.topic ? tx : pq.querySelector('.pq-chips button') || tx).focus({ preventScroll: true }); }, 320);
  }
  function close() {
    if (!pq) return;
    pq.classList.remove('on'); dim.classList.remove('on');
    document.documentElement.style.overflow = '';
    setTimeout(function () { if (!pq.classList.contains('on')) pq.hidden = dim.hidden = true; }, 300);
  }
  function pick(i) {
    var T = topics()[i]; th.topic = T[0];
    var c = document.getElementById('pqChips'); if (c) c.remove();
    add({ me: true, t: T[0] });
    bot({ t: T[1] }, function () { tx.focus(); });
  }
  function sync() { send.disabled = !tx.value.trim() && !fileIn.files[0]; tx.style.height = 'auto'; tx.style.height = Math.min(tx.scrollHeight, 120) + 'px'; }
  function submit() {
    var t = tx.value.trim(), f = fileIn.files[0] ? fileIn.files[0].name : '';
    if (!t && !f) return;
    if (!th.topic) { th.topic = '기타'; var c = document.getElementById('pqChips'); if (c) c.remove(); }
    add({ me: true, t: t, file: f });
    tx.value = ''; fileIn.value = ''; att.hidden = true; sync();
    var L; try { L = JSON.parse(localStorage.getItem('op.inquiries') || '[]'); } catch (e) { L = []; }
    var first = !th.qid;
    if (first) { // 첫 메시지: 문의 접수 (마이페이지 문의내역에 등록)
      var a = (OP.account && OP.account(ses.email)) || {};
      th.qid = 'Q-' + Date.now().toString(36).toUpperCase(); save();
      L.unshift({ id: th.qid, at: Date.now(), owner: ses.email || '', type: ctx ? '프로젝트 문의' : '상담 문의', svc: th.topic, ref: ctx ? ctx.title : '', name: a.name || '', org: a.org || '', email: ses.email || '', phone: a.phone || '',
        title: '[' + th.topic + '] ' + (ctx ? ctx.title : (t || f).slice(0, 30)), body: t, file: f });
    } else { // 이어서 보낸 메시지는 같은 문의에 덧붙임
      L.forEach(function (q) { if (q.id === th.qid) { q.body += '\n\n' + t; if (f && !q.file) q.file = f; } });
    }
    try { localStorage.setItem('op.inquiries', JSON.stringify(L.slice(0, 50))); } catch (e) {}
    if (first) bot({ t: '문의가 접수되었습니다.\n컨설턴트가 확인 후 이 대화창과 마이페이지 문의내역으로 답변드립니다. 추가로 전할 내용이 있으면 이어서 보내주세요.', done: th.qid });
  }
  OP.chat = { open: open, close: close, isOpen: isOpen };
})();
