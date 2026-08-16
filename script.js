/* ============================================================
   Autonomous EDA Agent — frontend logic
   Talks to a FastAPI backend exposing:
     GET  /health
     POST /analyze   (multipart: user_aim, file)
     POST /clean     (json: session_id, decisions)
     GET  /download/{session_id}
============================================================ */

const STORAGE_KEY = "eda_agent_api_base";

const els = {
  statusPill: document.getElementById("statusPill"),
  settingsBtn: document.getElementById("settingsBtn"),
  modal: document.getElementById("settingsModal"),
  apiUrlInput: document.getElementById("apiUrlInput"),
  saveApiBtn: document.getElementById("saveApiBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  apiStatus: document.getElementById("apiStatus"),

  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  dzText: document.getElementById("dzText"),
  aimInput: document.getElementById("aimInput"),
  runBtn: document.getElementById("runBtn"),
  consoleBody: document.getElementById("consoleBody"),

  emptyState: document.getElementById("emptyState"),
  dashboard: document.getElementById("dashboard"),
  tiles: document.getElementById("tiles"),
  summaryText: document.getElementById("summaryText"),
  factsGrid: document.getElementById("factsGrid"),
  vizGrid: document.getElementById("vizGrid"),
  describeTable: document.getElementById("describeTable"),
  duplicatesRow: document.getElementById("duplicatesRow"),
  cleaningList: document.getElementById("cleaningList"),
  applyCleanBtn: document.getElementById("applyCleanBtn"),
  resultCard: document.getElementById("resultCard"),
  cleanResultTiles: document.getElementById("cleanResultTiles"),
  cleaningLog: document.getElementById("cleaningLog"),
  downloadBtn: document.getElementById("downloadBtn"),
};

let apiBase = localStorage.getItem(STORAGE_KEY) || "";
let selectedFile = null;
let lastResult = null; // full /analyze response
let sessionId = null;

/* ---------------- status pill ---------------- */
function setStatus(state, label) {
  els.statusPill.className = "status-pill status-" + state;
  els.statusPill.innerHTML = `<span class="status-dot"></span>${label}`;
}

/* ---------------- settings modal ---------------- */
function openModal() {
  els.apiUrlInput.value = apiBase;
  els.apiStatus.textContent = "";
  els.apiStatus.className = "modal-status";
  els.modal.classList.remove("hidden");
}
function closeModal() { els.modal.classList.add("hidden"); }

els.settingsBtn.addEventListener("click", openModal);
els.closeModalBtn.addEventListener("click", closeModal);
els.modal.addEventListener("click", (e) => { if (e.target === els.modal) closeModal(); });

els.saveApiBtn.addEventListener("click", async () => {
  const url = els.apiUrlInput.value.trim().replace(/\/+$/, "");
  if (!url) {
    els.apiStatus.textContent = "Enter a URL first.";
    els.apiStatus.className = "modal-status err";
    return;
  }
  els.apiStatus.textContent = "Testing connection…";
  els.apiStatus.className = "modal-status";
  const ok = await testHealth(url);
  if (ok) {
    apiBase = url;
    localStorage.setItem(STORAGE_KEY, apiBase);
    els.apiStatus.textContent = "Connected.";
    els.apiStatus.className = "modal-status ok";
    setStatus("connected", "Connected");
    updateRunButton();
    setTimeout(closeModal, 600);
  } else {
    els.apiStatus.textContent = "Could not reach that URL. Check it's running and CORS is enabled.";
    els.apiStatus.className = "modal-status err";
    setStatus("error", "Not connected");
  }
});

async function testHealth(url) {
  try {
    const res = await fetch(url + "/health", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

(async function init() {
  if (apiBase) {
    setStatus("busy", "Checking…");
    const ok = await testHealth(apiBase);
    setStatus(ok ? "connected" : "error", ok ? "Connected" : "Not connected");
    if (!ok) openModal();
  } else {
    setStatus("idle", "Not connected");
    openModal();
  }
  updateRunButton();
})();

/* ---------------- file upload ---------------- */
els.dropzone.addEventListener("click", () => els.fileInput.click());
els.dropzone.addEventListener("dragover", (e) => { e.preventDefault(); els.dropzone.classList.add("drag-over"); });
els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("drag-over"));
els.dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  els.dropzone.classList.remove("drag-over");
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
els.fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
  selectedFile = file;
  els.dzText.innerHTML = `<strong>${escapeHtml(file.name)}</strong><br><span class="dz-sub">${(file.size / 1024).toFixed(1)} KB — click to change</span>`;
  updateRunButton();
}

els.aimInput.addEventListener("input", updateRunButton);

function updateRunButton() {
  els.runBtn.disabled = !(selectedFile && apiBase);
}

/* ---------------- run agent ---------------- */
els.runBtn.addEventListener("click", runAgent);

async function runAgent() {
  if (!selectedFile || !apiBase) return;

  els.runBtn.disabled = true;
  els.runBtn.textContent = "Running…";
  setStatus("busy", "Analyzing");
  clearConsole();
  logConsole("Uploading dataset…", "dim");

  const aim = els.aimInput.value.trim() || "General exploratory analysis of this dataset.";
  const form = new FormData();
  form.append("user_aim", aim);
  form.append("file", selectedFile);

  try {
    const res = await fetch(apiBase + "/analyze", { method: "POST", body: form });
    if (!res.ok) {
      const errBody = await safeJson(res);
      throw new Error(errBody?.detail || `Request failed (${res.status})`);
    }
    const data = await res.json();
    lastResult = data;
    sessionId = data.session_id;

    await playConsoleSteps(data.findings || []);
    logConsole("Report and visualizations ready.", "ok");

    setStatus("connected", "Ready");
    renderDashboard(data);
  } catch (err) {
    logConsole("Error: " + err.message, "err");
    setStatus("error", "Failed");
  } finally {
    els.runBtn.disabled = false;
    els.runBtn.textContent = "Run agent";
  }
}

/* ---------------- console ---------------- */
function clearConsole() { els.consoleBody.innerHTML = ""; }

function logConsole(text, cls) {
  const p = document.createElement("p");
  p.className = "console-line" + (cls ? " " + cls : "");
  p.textContent = text;
  els.consoleBody.appendChild(p);
  els.consoleBody.scrollTop = els.consoleBody.scrollHeight;
}

function actionLabel(action) {
  const map = {
    check_missing_values: "Checking missing values",
    check_dtypes: "Inspecting column types",
    check_duplicates: "Scanning for duplicate rows",
    check_outliers: "Scanning for outliers",
    get_correlation: "Computing correlations",
    check_categorical: "Summarizing categorical columns",
    bivariate_analysis: "Comparing column relationships",
  };
  return map[action] || action;
}

async function playConsoleSteps(findings) {
  for (const f of findings) {
    const match = f.match(/^\[(.+?)\]/);
    const action = match ? match[1] : "step";
    logConsole(actionLabel(action) + " — done", "ok");
    await sleep(280);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function safeJson(res) { try { return await res.json(); } catch { return null; } }

/* ---------------- dashboard render ---------------- */
function renderDashboard(data) {
  els.emptyState.classList.add("hidden");
  els.dashboard.classList.remove("hidden");
  els.resultCard.classList.add("hidden");

  renderTiles(data);
  renderSummary(data.summary || "");
  renderFacts(data.interesting_facts || "");
  renderViz(data.visualizations || []);
  renderDescribeTable(data.describe_stats || {});
  renderDuplicatesToggle(data.duplicate_rows || 0);
  renderCleaningProposals(data.cleaning_proposals || []);
}

function renderTiles(data) {
  const [rows, cols] = data.shape || [0, 0];
  const dtypes = data.dtypes || {};
  const numericCount = Object.values(dtypes).filter((t) =>
    /int|float|number/i.test(t)
  ).length;
  const missingCount = (data.cleaning_proposals || []).length;
  const dupCount = data.duplicate_rows || 0;

  const tiles = [
    { label: "Rows", value: rows.toLocaleString(), cls: "tile-blue" },
    { label: "Columns", value: cols.toLocaleString(), cls: "tile-teal" },
    { label: "Numeric fields", value: numericCount, cls: "tile-violet" },
    { label: "Columns with missing data", value: missingCount, cls: "tile-amber" },
    { label: "Duplicate rows", value: dupCount.toLocaleString(), cls: "tile-rose" },
  ];

  els.tiles.innerHTML = tiles
    .map(
      (t) => `<div class="tile ${t.cls}">
        <div class="tile-value">${t.value}</div>
        <div class="tile-label">${t.label}</div>
      </div>`
    )
    .join("");
}

function renderSummary(text) {
  els.summaryText.innerHTML = markdownishToHtml(text);
}

const FACT_STYLES = [
  { icon: "◆", cls: "tile-blue", color: "var(--accent-blue)" },
  { icon: "●", cls: "tile-teal", color: "var(--accent-teal)" },
  { icon: "▲", cls: "tile-violet", color: "var(--accent-violet)" },
  { icon: "■", cls: "tile-amber", color: "var(--accent-amber)" },
  { icon: "★", cls: "tile-rose", color: "var(--accent-rose)" },
];

function renderFacts(text) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[\s\-\*•]+/, "").trim())
    .filter(Boolean);

  if (!lines.length) {
    els.factsGrid.innerHTML = `<p class="prose">No standout facts surfaced for this dataset.</p>`;
    return;
  }

  els.factsGrid.innerHTML = lines
    .map((line, i) => {
      const style = FACT_STYLES[i % FACT_STYLES.length];
      return `<div class="fact-card ${style.cls}">
        <span class="fact-icon" style="background:${style.color}">${style.icon}</span>
        <span class="fact-text">${escapeHtml(line)}</span>
      </div>`;
    })
    .join("");
}

function renderViz(images) {
  if (!images.length) {
    els.vizGrid.innerHTML = `<p class="prose">No charts were generated for this dataset.</p>`;
    return;
  }
  els.vizGrid.innerHTML = images
    .map((b64) => `<div class="viz-item"><img src="data:image/png;base64,${b64}" alt="EDA chart" loading="lazy"/></div>`)
    .join("");
}

const STAT_ROW_ORDER = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"];
const STAT_ROW_LABELS = {
  count: "Count", mean: "Mean", std: "Std Dev", min: "Min",
  "25%": "25%", "50%": "Median", "75%": "75%", max: "Max",
};

function renderDescribeTable(describeStats) {
  const columns = Object.keys(describeStats);
  if (!columns.length) {
    els.describeTable.innerHTML = `<tr><td class="prose">No numeric columns to summarize.</td></tr>`;
    return;
  }

  const thead = `<thead><tr><th>Statistic</th>${columns
    .map((c) => `<th>${escapeHtml(c)}</th>`)
    .join("")}</tr></thead>`;

  const rowsPresent = STAT_ROW_ORDER.filter((stat) =>
    columns.some((c) => describeStats[c] && describeStats[c][stat] !== undefined)
  );

  const tbody = `<tbody>${rowsPresent
    .map((stat) => {
      const cells = columns
        .map((c) => {
          const v = describeStats[c] ? describeStats[c][stat] : null;
          return `<td>${v === null || v === undefined ? "—" : formatStatValue(v)}</td>`;
        })
        .join("");
      return `<tr><td>${STAT_ROW_LABELS[stat] || stat}</td>${cells}</tr>`;
    })
    .join("")}</tbody>`;

  els.describeTable.innerHTML = thead + tbody;
}

function formatStatValue(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return escapeHtml(String(v));
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function renderDuplicatesToggle(dupCount) {
  if (!dupCount) {
    els.duplicatesRow.classList.add("hidden");
    els.duplicatesRow.innerHTML = "";
    return;
  }
  els.duplicatesRow.classList.remove("hidden");
  els.duplicatesRow.innerHTML = `
    <div class="cleaning-info">
      <div class="cleaning-col">Duplicate rows</div>
      <div class="cleaning-reason">${dupCount} exact duplicate row${dupCount === 1 ? "" : "s"} found across the dataset</div>
    </div>
    <span class="cleaning-badge">drop_duplicates</span>
    <label class="switch">
      <input type="checkbox" checked id="dupToggle">
      <span class="slider"></span>
    </label>`;
}

function renderCleaningProposals(proposals) {
  const dupToggleVisible = !els.duplicatesRow.classList.contains("hidden");
  if (!proposals.length) {
    els.cleaningList.innerHTML = `<p class="prose">No missing data found — nothing to clean${dupToggleVisible ? " here" : ""}.</p>`;
    els.applyCleanBtn.classList.toggle("hidden", !dupToggleVisible);
    return;
  }
  els.applyCleanBtn.classList.remove("hidden");
  els.cleaningList.innerHTML = proposals
    .map(
      (p, i) => `<div class="cleaning-row" data-column="${escapeHtml(p.column)}">
        <div class="cleaning-info">
          <div class="cleaning-col">${escapeHtml(p.column)}</div>
          <div class="cleaning-reason">${escapeHtml(p.reason)}</div>
        </div>
        <span class="cleaning-badge">${escapeHtml(p.action)}</span>
        <label class="switch">
          <input type="checkbox" checked data-column="${escapeHtml(p.column)}" id="chk-${i}">
          <span class="slider"></span>
        </label>
      </div>`
    )
    .join("");
}

/* ---------------- apply cleaning ---------------- */
els.applyCleanBtn.addEventListener("click", async () => {
  if (!sessionId) return;
  els.applyCleanBtn.disabled = true;
  els.applyCleanBtn.textContent = "Applying…";

  const decisions = {};
  document.querySelectorAll("#cleaningList input[type=checkbox]").forEach((cb) => {
    decisions[cb.dataset.column] = cb.checked;
  });
  const dupToggle = document.getElementById("dupToggle");
  const dropDuplicates = dupToggle ? dupToggle.checked : false;

  try {
    const res = await fetch(apiBase + "/clean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, decisions, drop_duplicates: dropDuplicates }),
    });
    if (!res.ok) {
      const errBody = await safeJson(res);
      throw new Error(errBody?.detail || `Request failed (${res.status})`);
    }
    const data = await res.json();
    renderCleanResult(data);
  } catch (err) {
    logConsole("Cleaning error: " + err.message, "err");
  } finally {
    els.applyCleanBtn.disabled = false;
    els.applyCleanBtn.textContent = "Apply cleaning";
  }
});

function renderCleanResult(data) {
  const [rows, cols] = data.cleaned_shape || [0, 0];
  els.cleanResultTiles.innerHTML = `
    <div class="tile tile-blue"><div class="tile-value">${rows.toLocaleString()}</div><div class="tile-label">Rows</div></div>
    <div class="tile tile-teal"><div class="tile-value">${cols.toLocaleString()}</div><div class="tile-label">Columns</div></div>
    <div class="tile tile-amber"><div class="tile-value">${data.remaining_missing_values}</div><div class="tile-label">Missing values left</div></div>
  `;
  els.cleaningLog.innerHTML = (data.cleaning_log || [])
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join("");
  els.resultCard.classList.remove("hidden");
  els.downloadBtn.dataset.sessionId = sessionId;
  els.resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------------- download ---------------- */
els.downloadBtn.addEventListener("click", async () => {
  if (!sessionId) return;
  els.downloadBtn.textContent = "Preparing…";
  try {
    const res = await fetch(apiBase + "/download/" + sessionId);
    if (!res.ok) throw new Error("Download failed (" + res.status + ")");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned_${sessionId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    logConsole("Download error: " + err.message, "err");
  } finally {
    els.downloadBtn.textContent = "Download cleaned CSV";
  }
});

/* ---------------- helpers ---------------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownishToHtml(text) {
  const lines = text.split("\n").map((l) => l.trim());
  let html = "";
  let inList = false;
  for (const line of lines) {
    if (!line) continue;
    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${escapeHtml(line.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, ""))}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      const boldish = escapeHtml(line).replace(/^#+\s*/, "");
      html += `<p><strong>${boldish}</strong></p>`;
    }
  }
  if (inList) html += "</ul>";
  return html || "<p>No summary available.</p>";
}
