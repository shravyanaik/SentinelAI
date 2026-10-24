const form = document.getElementById("action-form");
const evaluateButton = document.getElementById("evaluate-button");
const resultBox = document.getElementById("result-box");
const resultSymbol = document.getElementById("result-symbol");
const resultOverline = document.getElementById("result-overline");
const resultTitle = document.getElementById("result-title");
const resultReason = document.getElementById("result-reason");
const resultMeta = document.getElementById("result-meta");
const auditBody = document.getElementById("audit-body");

const scenarios = {
  safe: {
    action: "Read public weather data",
    resource: "Public weather API",
    sensitivity: "Public",
    destination: "public_weather_api"
  },
  sensitive: {
    action: "Send customer data by email",
    resource: "Confidential customer records",
    sensitivity: "Confidential",
    destination: "unknown.external@example.com"
  },
  impact: {
    action: "Delete all records",
    resource: "Production database",
    sensitivity: "Internal",
    destination: "approved_internal_system"
  }
};

document.querySelectorAll("[data-scenario]").forEach(button => {
  button.addEventListener("click", () => {
    const data = scenarios[button.dataset.scenario];
    Object.entries(data).forEach(([key, value]) => {
      document.getElementById(key).value = value;
    });
    document.querySelectorAll("[data-scenario]").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    document.getElementById("action").focus();
  });
});

function decisionClass(decision) {
  if (decision === "ALLOW") return "allow";
  if (decision === "BLOCK") return "block";
  return "review";
}

function decisionSymbol(decision) {
  if (decision === "ALLOW") return "✓";
  if (decision === "BLOCK") return "⊘";
  return "⚑";
}

function showResult(result) {
  const kind = decisionClass(result.decision);
  resultBox.className = `result-box ${kind}`;
  resultSymbol.textContent = decisionSymbol(result.decision);
  resultOverline.textContent = `POLICY DECISION · ${result.policy.toUpperCase()}`;
  resultTitle.textContent = result.decision;
  resultReason.textContent = result.reason;
  resultMeta.textContent = "✓ Decision recorded in demo audit log · No action executed";
}

function showError(message) {
  resultBox.className = "result-box block";
  resultSymbol.textContent = "!";
  resultOverline.textContent = "INPUT / SERVER ERROR";
  resultTitle.textContent = "Could not evaluate action";
  resultReason.textContent = message;
  resultMeta.textContent = "No decision was recorded";
}

function safeText(value) {
  return String(value ?? "");
}

function createCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = safeText(text);
  if (className) cell.className = className;
  return cell;
}

function renderLogs(logs) {
  document.getElementById("audit-total").textContent = logs.length;
  document.getElementById("total-count").textContent = logs.length;
  document.getElementById("allow-count").textContent = logs.filter(x => x.decision === "ALLOW").length;
  document.getElementById("block-count").textContent = logs.filter(x => x.decision === "BLOCK").length;
  document.getElementById("review-count").textContent = logs.filter(x => x.decision === "REQUIRE HUMAN APPROVAL").length;

  auditBody.replaceChildren();
  if (!logs.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 5;
    const wrap = document.createElement("div");
    wrap.className = "empty-audit";
    const symbol = document.createElement("span");
    symbol.textContent = "≡";
    const title = document.createElement("strong");
    title.textContent = "No evaluations yet";
    const detail = document.createElement("small");
    detail.textContent = "Run an action in the simulator to create your first audit entry.";
    wrap.append(symbol, title, detail);
    cell.append(wrap);
    row.append(cell);
    auditBody.append(row);
    return;
  }

  logs.forEach(entry => {
    const row = document.createElement("tr");
    row.append(createCell(entry.time));
    row.append(createCell(entry.action));
    row.append(createCell(entry.resource));
    const decisionCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `decision-pill ${decisionClass(entry.decision)}`;
    pill.textContent = `${decisionSymbol(entry.decision)} ${entry.decision}`;
    decisionCell.append(pill);
    row.append(decisionCell);
    row.append(createCell(entry.reason, "reason-cell"));
    auditBody.append(row);
  });
}

async function loadLogs() {
  try {
    const response = await fetch("/api/logs");
    if (!response.ok) throw new Error("Could not retrieve the audit log.");
    const data = await response.json();
    renderLogs(data.logs || []);
  } catch (error) {
    document.getElementById("backend-status").textContent = "Backend connection issue";
  }
}

async function checkBackend() {
  const status = document.getElementById("backend-status");
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("offline");
    const data = await response.json();
    status.textContent = data.status === "ok" ? "Connected · Simulation only" : "Backend unavailable";
  } catch {
    status.textContent = "Backend unavailable";
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  evaluateButton.disabled = true;
  evaluateButton.querySelector("span:first-child").textContent = "Evaluating…";
  const payload = {
    action: document.getElementById("action").value.trim(),
    resource: document.getElementById("resource").value.trim(),
    sensitivity: document.getElementById("sensitivity").value,
    destination: document.getElementById("destination").value.trim()
  };
  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The server rejected this request.");
    showResult(data.result);
    await loadLogs();
  } catch (error) {
    showError(error.message || "Unable to connect to the local Flask server. Check that it is running.");
  } finally {
    evaluateButton.disabled = false;
    evaluateButton.querySelector("span:first-child").textContent = "Evaluate action";
  }
});

document.getElementById("refresh-logs").addEventListener("click", loadLogs);

checkBackend();
loadLogs();
