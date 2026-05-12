const form = document.getElementById('consultForm');
const submitBtn = document.getElementById('submitBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');

let rawResult = '';
let modalRaw = '';

// ── 생성 ──────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    child_name: document.getElementById('child_name').value,
    child_age: document.getElementById('child_age').value,
    parent_name: document.getElementById('parent_name').value,
    parent_type: document.getElementById('parent_type').value,
    episode: document.getElementById('episode').value,
    writing_change: document.getElementById('writing_change').value,
    attitude_change: document.getElementById('attitude_change').value,
    curriculum: document.getElementById('curriculum').value,
    followup: document.getElementById('followup').value,
  };

  submitBtn.disabled = true;
  loadingOverlay.style.display = 'flex';
  resultSection.style.display = 'none';

  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.error) {
      alert('오류가 발생했어요: ' + result.error);
      return;
    }

    rawResult = result.result;
    resultContent.innerHTML = marked.parse(rawResult);
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 히스토리 저장
    saveHistory(data, rawResult);

  } catch (error) {
    alert('연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
  } finally {
    submitBtn.disabled = false;
    loadingOverlay.style.display = 'none';
  }
});

// ── 복사 ──────────────────────────────────────────
function copyResult() {
  navigator.clipboard.writeText(rawResult).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ 복사됨!';
    setTimeout(() => { btn.textContent = '복사하기'; }, 2000);
  });
}

function copyModal() {
  navigator.clipboard.writeText(modalRaw).then(() => {
    const btns = document.querySelectorAll('.modal-actions button');
    btns[0].textContent = '✓ 복사됨!';
    setTimeout(() => { btns[0].textContent = '복사하기'; }, 2000);
  });
}

// ── 히스토리 저장 ──────────────────────────────────
function saveHistory(data, result) {
  const history = getHistory();
  const item = {
    id: Date.now(),
    date: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    child_name: data.child_name,
    child_age: data.child_age,
    parent_name: data.parent_name,
    parent_type: data.parent_type,
    result: result,
  };
  history.unshift(item); // 최신순
  if (history.length > 50) history.pop(); // 최대 50개
  localStorage.setItem('braining_history', JSON.stringify(history));
  renderHistoryList();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('braining_history')) || [];
  } catch {
    return [];
  }
}

// ── 히스토리 렌더링 ────────────────────────────────
function renderHistoryList() {
  const history = getHistory();
  const list = document.getElementById('historyList');

  if (history.length === 0) {
    list.innerHTML = '<p class="history-empty">아직 생성된 상담 기록이 없어요.</p>';
    return;
  }

  list.innerHTML = history.map(item => `
    <div class="history-item" onclick="openModal(${item.id})">
      <div class="history-item-main">
        <span class="history-name">${item.child_name} (${item.child_age}세)</span>
        <span class="history-parent">${item.parent_name} · ${item.parent_type}</span>
      </div>
      <div class="history-item-meta">
        <span class="history-date">${item.date}</span>
        <button class="history-delete" onclick="deleteHistory(event, ${item.id})">삭제</button>
      </div>
    </div>
  `).join('');
}

// ── 히스토리 토글 ──────────────────────────────────
function toggleHistory() {
  const panel = document.getElementById('historyPanel');
  const btn = document.getElementById('historyToggleBtn');
  const isVisible = panel.style.display !== 'none';

  if (isVisible) {
    panel.style.display = 'none';
    btn.textContent = '📋 상담 기록 보기';
  } else {
    panel.style.display = 'block';
    renderHistoryList();
    btn.textContent = '📋 상담 기록 닫기';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── 히스토리 삭제 ──────────────────────────────────
function deleteHistory(e, id) {
  e.stopPropagation();
  const history = getHistory().filter(item => item.id !== id);
  localStorage.setItem('braining_history', JSON.stringify(history));
  renderHistoryList();
}

function clearHistory() {
  if (confirm('상담 기록을 모두 삭제할까요?')) {
    localStorage.removeItem('braining_history');
    renderHistoryList();
  }
}

// ── 모달 ───────────────────────────────────────────
function openModal(id) {
  const item = getHistory().find(h => h.id === id);
  if (!item) return;

  modalRaw = item.result;
  document.getElementById('modalTitle').textContent =
    `${item.child_name} (${item.child_age}세) / ${item.parent_name} — ${item.date}`;
  document.getElementById('modalContent').innerHTML = marked.parse(item.result);
  document.getElementById('historyModal').style.display = 'flex';
}

function closeModal(e) {
  if (e.target === document.getElementById('historyModal')) {
    document.getElementById('historyModal').style.display = 'none';
  }
}
