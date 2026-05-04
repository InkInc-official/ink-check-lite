/**
 * Ink Check Lite — フロントエンドロジック
 * Ink Inc. | AI Creation, Human Care. The Future Drawn Together.
 */

const API = window.location.origin;

// ── 日付表示 ──────────────────────────────────
const now = new Date();
document.getElementById("form-date").textContent =
  `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")} ストレスチェック`;

// ── タブ切替 ──────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.tab}`).classList.add("active");
  });
});

// ── スコアボタン ──────────────────────────────
const scoreValues = {};
const SCORE_FIELDS = ["score_private","score_rest","score_rhythm","score_mental","score_fan","score_stream"];
const SCORE_LABELS = {
  score_private: "プライベート",
  score_rest:    "休息",
  score_rhythm:  "生活リズムの乱れ",
  score_mental:  "精神的な落ち込み",
  score_fan:     "配信やファン対応",
  score_stream:  "配信準備・配信内容",
};

document.querySelectorAll(".score-item").forEach(item => {
  const field = item.dataset.field;
  const buttons = item.querySelectorAll(".score-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      scoreValues[field] = parseInt(btn.dataset.value, 10);
      item.classList.add("selected");
    });
  });
});

// ── フォーム送信 ──────────────────────────────
const form = document.getElementById("check-form");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const submitSpinner = document.getElementById("submit-spinner");
const errorMsg = document.getElementById("error-msg");
const submitResult = document.getElementById("submit-result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;

  const liverName = document.getElementById("liver_name").value.trim();
  if (!liverName) { showError("名前を入力してください。"); return; }

  const unselected = SCORE_FIELDS.filter(f => scoreValues[f] === undefined);
  if (unselected.length > 0) {
    showError(`未選択の項目があります：${unselected.map(f => SCORE_LABELS[f]).join("、")}`);
    return;
  }

  const payload = {
    liver_name: liverName,
    ...Object.fromEntries(SCORE_FIELDS.map(f => [f, scoreValues[f]])),
    memo: document.getElementById("memo").value.trim() || null,
  };

  setLoading(true);
  try {
    const res = await fetch(`${API}/api/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`サーバーエラー (${res.status})`);
    const data = await res.json();

    // 結果表示
    form.style.display = "none";
    submitResult.hidden = false;

    const levelMsg = {
      GREEN:  "今のあなたの状態は良好です🟢 この調子で無理せず続けましょう。",
      YELLOW: "少し気になる点があります🟡 無理せず休息を取るようにしましょう。",
      RED:    "かなりつらい状態かもしれません🔴 信頼できる人に相談することをお勧めします。",
    };
    document.getElementById("result-msg").textContent = levelMsg[data.alert_level] || "";

  } catch (err) {
    showError(`送信に失敗しました。再度お試しください。(${err.message})`);
  } finally {
    setLoading(false);
  }
});

// 続けて記録するボタン
document.getElementById("result-close-btn").addEventListener("click", () => {
  form.style.display = "block";
  submitResult.hidden = true;
  form.reset();
  Object.keys(scoreValues).forEach(k => delete scoreValues[k]);
  document.querySelectorAll(".score-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".score-item").forEach(i => i.classList.remove("selected"));
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
  errorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function setLoading(loading) {
  submitBtn.disabled = loading;
  submitLabel.hidden = loading;
  submitSpinner.hidden = !loading;
}

// ── 集計画面 ──────────────────────────────────
let chartInstance = null;

document.getElementById("stats-search-btn").addEventListener("click", loadStats);
document.getElementById("stats-name").addEventListener("keydown", e => {
  if (e.key === "Enter") loadStats();
});

async function loadStats() {
  const name = document.getElementById("stats-name").value.trim();
  if (!name) return;

  try {
    const res = await fetch(`${API}/api/responses?liver=${encodeURIComponent(name)}`);
    const data = await res.json();

    if (data.length === 0) {
      document.getElementById("stats-empty").textContent = `「${name}」の回答データがありません`;
      document.getElementById("stats-empty").style.display = "block";
      document.getElementById("stats-content").style.display = "none";
      return;
    }

    document.getElementById("stats-empty").style.display = "none";
    document.getElementById("stats-content").style.display = "block";

    renderChart(data);
    renderHistory(data);
  } catch(e) {
    document.getElementById("stats-empty").textContent = "データの取得に失敗しました";
    document.getElementById("stats-empty").style.display = "block";
  }
}

function renderChart(data) {
  const labels = data.map(r => r.submitted_at.slice(0,10));
  const FIELDS = [
    { key: "score_private", label: "プライベート",     color: "#7c6af7" },
    { key: "score_rest",    label: "休息",             color: "#4fdc8f" },
    { key: "score_rhythm",  label: "生活リズム",        color: "#f5c842" },
    { key: "score_mental",  label: "精神的な落ち込み",  color: "#f05a5a" },
    { key: "score_fan",     label: "配信・ファン対応",  color: "#f5884a" },
    { key: "score_stream",  label: "配信準備・内容",    color: "#5ab4f5" },
  ];

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById("stats-chart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: FIELDS.map(f => ({
        label: f.label,
        data: data.map(r => r[f.key]),
        borderColor: f.color,
        backgroundColor: f.color + "22",
        tension: 0.3,
        pointRadius: 5,
        fill: false,
      }))
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 1, max: 5,
          ticks: {
            stepSize: 1,
            color: "#9090a8",
            callback: v => ({1:"1 良好",2:"2",3:"3 注意",4:"4",5:"5 危険"}[v]||v),
          },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        x: {
          ticks: { color: "#9090a8" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
      plugins: {
        legend: { labels: { color: "#f0f0f5", font: { size: 11 } } },
        tooltip: {
          backgroundColor: "#22222e",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleColor: "#f0f0f5",
          bodyColor: "#9090a8",
        },
      },
    },
  });
}

function renderHistory(data) {
  const list = document.getElementById("history-list");
  list.innerHTML = "";

  const sorted = [...data].sort((a,b) => b.submitted_at.localeCompare(a.submitted_at));
  sorted.forEach(r => {
    const avg = ((r.score_private+r.score_rest+r.score_rhythm+r.score_mental+r.score_fan+r.score_stream)/6).toFixed(1);
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <span class="history-date">${r.submitted_at.slice(0,16).replace("T"," ")}</span>
      <span class="alert-badge alert-${r.alert_level}">${r.alert_level}</span>
      <span class="history-avg">avg ${avg}</span>
    `;
    list.appendChild(item);
  });
}
