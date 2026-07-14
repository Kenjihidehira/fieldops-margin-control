type DashboardState = {
  status: string;
  priority: string;
  search: string;
  risk: string;
  automationRuns: number;
};

type Project = {
  id: string;
  name: string;
  customer: string;
  segment: string;
  progress: number;
  forecastMargin: number;
  forecastProfit: number;
  marginAtRisk: number;
  marginGap: number;
  risk: string;
  healthScore: number;
};

const state: DashboardState = {
  status: "all",
  priority: "all",
  search: "",
  risk: "all",
  automationRuns: 0
};

function qs(selector: string): HTMLElement {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Elemento não encontrado: ${selector}`);
  return node as HTMLElement;
}

async function api(path: string, options?: RequestInit): Promise<any> {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function money(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function label(value: string): string {
  const labels = {
    all: "Todos",
    in_progress: "Em andamento",
    waiting_parts: "Aguardando peças",
    scheduled: "Agendada",
    blocked: "Bloqueada",
    closed: "Fechada",
    on_track: "No prazo",
    at_risk: "Em risco",
    delayed: "Atrasada",
    critical: "Crítico",
    high: "Alto",
    moderate: "Moderado",
    low: "Baixo",
    ready: "Pronta",
    overdue: "Vencida",
    draft: "Rascunho"
  };
  return labels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function riskLoad(project: Project): number {
  return Math.min(100, Math.max(8, project.marginGap * 8 + (project.risk === "critical" ? 26 : 0)));
}

function renderSummary(summary: any): void {
  qs("#totalMarginPercent").textContent = `${summary.totalMarginPercent}%`;
  qs("#totalMarginDollars").textContent = `${money(summary.totalMarginDollars)} lucro previsto`;
  qs("#marginAtRisk").textContent = money(summary.marginAtRisk);
  qs("#crewUtilization").textContent = `${summary.crewUtilization}%`;
  qs("#openWorkOrders").textContent = String(summary.openWorkOrders);
  qs("#materialShortages").textContent = String(summary.materialShortages);
  qs("#pendingInvoices").textContent = money(summary.pendingInvoices);
  qs("#invoiceCount").textContent = `${summary.invoiceCount} faturas`;
}

function renderMarginMap(projects: Project[]): void {
  const positions = [
    { x: 14, y: 26 },
    { x: 39, y: 17 },
    { x: 65, y: 30 },
    { x: 28, y: 63 },
    { x: 57, y: 70 },
    { x: 79, y: 56 }
  ];

  qs("#marginMap").innerHTML = projects.map((project, index) => {
    const point = positions[index % positions.length];
    const size = 58 + riskLoad(project) * 0.42;
    return `
      <article class="map-node ${project.risk}" style="--x:${point.x}%; --y:${point.y}%; --size:${size}px">
        <span>${project.id.replace("P-", "")}</span>
        <strong>${project.forecastMargin}%</strong>
        <small>${money(project.marginAtRisk)}</small>
      </article>
    `;
  }).join("");
}

function renderProjects(projects: Project[]): void {
  const visible = state.risk === "all" ? projects : projects.filter((project) => project.risk === state.risk);
  qs("#projectBoard").innerHTML = visible.map((project) => `
    <article class="project-card ${project.risk}">
      <header>
        <span>${project.id}</span>
        <b>${label(project.risk)}</b>
      </header>
      <strong>${project.name}</strong>
      <small>${project.segment} | ${project.customer}</small>
      <div class="project-metrics">
        <div><span>${project.progress}%</span><small>progresso</small></div>
        <div><span>${project.forecastMargin}%</span><small>margem</small></div>
        <div><span>${project.healthScore}</span><small>pontuação</small></div>
      </div>
      <div class="risk-meter"><i style="width:${riskLoad(project)}%"></i></div>
      <footer><span>${money(project.marginAtRisk)}</span><small>margem em risco</small></footer>
    </article>
  `).join("");
}

function renderAlerts(payload: any): void {
  qs("#alertList").innerHTML = payload.alerts.map((item: any) => `
    <article class="decision-card ${item.severity}">
      <span>!</span>
      <div>
        <strong>${item.title}</strong>
        <small>${item.detail}</small>
      </div>
    </article>
  `).join("");
}

function renderAutomations(payload: any): void {
  qs("#automationList").innerHTML = payload.suggestions.map((item: any) => `
    <article class="automation-item">
      <span>${item.channel.slice(0, 2).toUpperCase()}</span>
      <div>
        <strong>${item.action}</strong>
        <small>${item.count} itens | ${item.impact}</small>
      </div>
    </article>
  `).join("");
}

function renderWorkOrders(payload: any): void {
  qs("#workOrderCount").textContent = `${payload.count} ordens de serviço ativas`;
  qs("#workOrderBody").innerHTML = payload.workOrders.map((order: any) => `
    <article class="timeline-item ${order.priority}">
      <span class="timeline-pin"></span>
      <div>
        <strong>${order.id} | ${order.projectName}</strong>
        <small>${order.type} | ${order.assignee}</small>
      </div>
      <b>${label(order.status)}</b>
      <em>${order.dueDate}</em>
      <span class="sla ${order.sla}">${label(order.sla)}</span>
      <strong>${money(order.estimatedValue)}</strong>
    </article>
  `).join("");
}

function renderInvoices(payload: any): void {
  qs("#invoiceBody").innerHTML = payload.invoices.map((invoice: any) => `
    <article class="invoice-card ${invoice.state}">
      <span>${invoice.id}</span>
      <strong>${money(invoice.amount)}</strong>
      <small>${invoice.projectName}</small>
      <b>${label(invoice.state)}</b>
    </article>
  `).join("");
}

async function loadDashboard(): Promise<void> {
  const params = new URLSearchParams({ status: state.status, priority: state.priority, search: state.search });
  const [summary, projects, alerts, automations, workOrders, invoices] = await Promise.all([
    api("/api/summary"),
    api("/api/projects"),
    api("/api/alerts"),
    api("/api/automations"),
    api(`/api/work-orders?${params}`),
    api("/api/invoices")
  ]);

  renderSummary(summary);
  renderMarginMap(projects.projects);
  renderProjects(projects.projects);
  renderAlerts(alerts);
  renderAutomations(automations);
  renderWorkOrders(workOrders);
  renderInvoices(invoices);
}

async function runAutomations(): Promise<void> {
  const result = await api("/api/automations/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 3 })
  });

  state.automationRuns += result.sent;
  qs("#automationLog").textContent = `${result.sent} enviadas | ${state.automationRuns} nesta sessão`;
}

function bindEvents(): void {
  qs("#refreshBtn").addEventListener("click", loadDashboard);
  qs("#runAutomationBtn").addEventListener("click", runAutomations);
  qs("#riskFilter").addEventListener("change", (event) => {
    state.risk = (event.target as HTMLSelectElement).value;
    loadDashboard();
  });
  qs("#statusFilter").addEventListener("change", (event) => {
    state.status = (event.target as HTMLSelectElement).value;
    loadDashboard();
  });
  qs("#priorityFilter").addEventListener("change", (event) => {
    state.priority = (event.target as HTMLSelectElement).value;
    loadDashboard();
  });
  qs("#searchInput").addEventListener("input", (event) => {
    state.search = (event.target as HTMLInputElement).value;
    loadDashboard();
  });
}

bindEvents();
loadDashboard().catch((error) => {
  qs("#automationLog").textContent = error.message;
});
