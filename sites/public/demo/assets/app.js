const filters = { status: "all", priority: "all", search: "", risk: "all" };
let session = { canWrite: false };
function qs(selector) { const node = document.querySelector(selector); if (!node) throw new Error(`Elemento nao encontrado: ${selector}`); return node; }
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
function label(value) {
  const labels = { all: "Todos", in_progress: "Em andamento", waiting_parts: "Aguardando pecas", scheduled: "Agendada", blocked: "Bloqueada", closed: "Fechada", on_track: "No prazo", at_risk: "Em risco", delayed: "Atrasada", breached: "Vencida", critical: "Critico", high: "Alto", moderate: "Moderado", low: "Baixo", ready: "Pronta", overdue: "Vencida", draft: "Rascunho" };
  return labels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
async function requestState(path = "", options) {
  const response = await fetch(`/api/state${path}`, options);
  const payload = await response.json();
  if (!response.ok) { if (payload.signInUrl) window.location.href = payload.signInUrl; throw new Error(payload.error || `HTTP ${response.status}`); }
  return payload;
}
function riskLoad(project) { return Math.min(100, Math.max(8, project.marginGap * 8 + (project.risk === "critical" ? 26 : 0))); }
function render(payload) {
  const { summary, projects, alerts, automations, workOrders, invoices } = payload;
  qs("#totalMarginPercent").textContent = `${summary.totalMarginPercent}%`;
  qs("#totalMarginDollars").textContent = `${money(summary.totalMarginDollars)} lucro previsto`;
  qs("#marginAtRisk").textContent = money(summary.marginAtRisk);
  qs("#crewUtilization").textContent = `${summary.crewUtilization}%`;
  qs("#openWorkOrders").textContent = summary.openWorkOrders;
  qs("#materialShortages").textContent = summary.materialShortages;
  qs("#pendingInvoices").textContent = money(summary.pendingInvoices);
  qs("#invoiceCount").textContent = `${summary.invoiceCount} faturas`;
  const positions = [{ x: 14, y: 26 }, { x: 39, y: 17 }, { x: 65, y: 30 }, { x: 28, y: 63 }, { x: 57, y: 70 }, { x: 79, y: 56 }];
  qs("#marginMap").innerHTML = projects.projects.map((project, index) => { const point = positions[index % positions.length]; const size = 58 + riskLoad(project) * 0.42; return `<article class="map-node ${project.risk}" style="--x:${point.x}%; --y:${point.y}%; --size:${size}px"><span>${project.id.replace("P-", "")}</span><strong>${project.forecastMargin}%</strong><small>${money(project.marginAtRisk)}</small></article>`; }).join("");
  const visible = filters.risk === "all" ? projects.projects : projects.projects.filter((project) => project.risk === filters.risk);
  qs("#projectCount").textContent = `${visible.length} de ${projects.projects.length} projetos`;
  qs("#projectBoard").setAttribute("aria-busy", "false");
  qs("#projectBoard").innerHTML = visible.length ? visible.map((project) => `<article class="project-card ${project.risk}"><header><span>${project.id}</span><b>${label(project.risk)}</b></header><strong>${project.name}</strong><small>${project.segment} | ${project.customer}</small><div class="project-metrics"><div><span>${project.progress}%</span><small>progresso</small></div><div><span>${project.forecastMargin}%</span><small>margem</small></div><div><span>${project.healthScore}</span><small>pontuacao</small></div></div><div class="risk-meter"><i style="width:${riskLoad(project)}%"></i></div><footer><span>${money(project.marginAtRisk)}</span><small>margem em risco</small></footer></article>`).join("") : '<div class="empty-state"><strong>Nenhum projeto encontrado</strong><span>Selecione outro nivel de risco.</span></div>';
  qs("#alertList").innerHTML = alerts.alerts.map((item) => `<article class="decision-card ${item.severity}"><span>!</span><div><strong>${item.title}</strong><small>${item.detail}</small></div></article>`).join("");
  qs("#automationList").innerHTML = automations.suggestions.map((item) => `<article class="automation-item"><span>${item.channel.slice(0, 2).toUpperCase()}</span><div><strong>${item.action}</strong><small>${item.count} itens | ${item.impact}</small></div></article>`).join("");
  qs("#workOrderCount").textContent = `${workOrders.count} ordens de servico ativas`;
  qs("#workOrderBody").setAttribute("aria-busy", "false");
  qs("#workOrderBody").innerHTML = workOrders.workOrders.length ? workOrders.workOrders.map((order) => `<article class="timeline-item ${order.priority}"><span class="timeline-pin"></span><div><strong>${order.id} | ${order.projectName}</strong><small>${order.type} | ${order.assignee}</small></div><b>${label(order.status)}</b><em>${order.dueDate}</em><span class="sla ${order.sla}">${label(order.sla)}</span><strong>${money(order.estimatedValue)}</strong></article>`).join("") : '<div class="empty-state"><strong>Nenhuma ordem encontrada</strong><span>Ajuste ou limpe os filtros da fila.</span></div>';
  qs("#invoiceBody").innerHTML = invoices.invoices.map((invoice) => `<article class="invoice-card ${invoice.state}"><span>${invoice.id}</span><strong>${money(invoice.amount)}</strong><small>${invoice.projectName}</small><b>${label(invoice.state)}</b></article>`).join("");
  if (payload.lastAutomation) qs("#automationLog").textContent = `${payload.lastAutomation.sent} despachos registrados`;
  renderSession(payload.session);
}
function renderSession(next) {
  session = next;
  let element = document.querySelector("#auth-session");
  if (!element) { element = document.createElement("a"); element.id = "auth-session"; element.className = "auth-session"; qs(".topbar-controls").prepend(element); }
  element.textContent = session.authenticated ? `Sessao: ${session.displayName} | Sair` : "Modo demo | Entrar para salvar";
  element.href = session.authenticated ? session.signOutUrl : session.signInUrl;
}
async function loadDashboard() {
  setBusy(true);
  try {
    render(await requestState(`?${new URLSearchParams(filters)}`));
  } finally {
    setBusy(false);
  }
}
async function runAutomations() {
  if (!session.canWrite) { window.location.href = session.signInUrl; return; }
  setBusy(true);
  try {
    render(await requestState("", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "run_automations" }) }));
  } finally {
    setBusy(false);
  }
}
function setBusy(isBusy) {
  qs("#projectBoard").setAttribute("aria-busy", String(isBusy));
  qs("#workOrderBody").setAttribute("aria-busy", String(isBusy));
  qs("#refreshBtn").disabled = isBusy;
  qs("#runAutomationBtn").disabled = isBusy;
}
function debounce(callback, delay = 220) {
  let timeout;
  return (...args) => { window.clearTimeout(timeout); timeout = window.setTimeout(() => callback(...args), delay); };
}
qs("#refreshBtn").addEventListener("click", () => loadDashboard().catch(showError));
qs("#runAutomationBtn").addEventListener("click", () => runAutomations().catch(showError));
qs("#riskFilter").addEventListener("change", (event) => { filters.risk = event.target.value; loadDashboard().catch(showError); });
qs("#statusFilter").addEventListener("change", (event) => { filters.status = event.target.value; loadDashboard().catch(showError); });
qs("#priorityFilter").addEventListener("change", (event) => { filters.priority = event.target.value; loadDashboard().catch(showError); });
qs("#searchInput").addEventListener("input", debounce((event) => { filters.search = event.target.value; loadDashboard().catch(showError); }));
qs("#clearProjectFilter").addEventListener("click", () => { filters.risk = "all"; qs("#riskFilter").value = "all"; loadDashboard().catch(showError); });
qs("#clearOrderFilters").addEventListener("click", () => {
  Object.assign(filters, { status: "all", priority: "all", search: "" });
  qs("#statusFilter").value = "all";
  qs("#priorityFilter").value = "all";
  qs("#searchInput").value = "";
  loadDashboard().catch(showError);
});
document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("active"));
  item.classList.add("active");
}));
function showError(error) { setBusy(false); qs("#automationLog").textContent = `Falha ao carregar: ${error.message}`; }
loadDashboard().catch(showError);
