export function cloneSeed(seed) {
  return structuredClone(seed);
}

export function normalizeState(value, fallback) {
  const valid = value && ["projects", "workOrders", "invoices", "materials", "crews"]
    .every((key) => Array.isArray(value[key]));
  return structuredClone(valid ? value : fallback);
}

function enrichProjects(state) {
  return state.projects.map((project) => {
    const forecastProfit = project.contractValue - project.forecastCost;
    const forecastMargin = project.contractValue ? forecastProfit / project.contractValue * 100 : 0;
    const targetProfit = project.contractValue * project.marginTarget / 100;
    const marginAtRisk = Math.max(0, targetProfit - forecastProfit);
    const riskPenalty = { critical: 28, high: 18, moderate: 10, low: 2 }[project.risk] ?? 8;
    return {
      ...project,
      forecastMargin: Number(forecastMargin.toFixed(1)),
      forecastProfit: Math.round(forecastProfit),
      marginGap: Number(Math.max(0, project.marginTarget - forecastMargin).toFixed(1)),
      marginAtRisk: Math.round(marginAtRisk),
      healthScore: Math.max(0, Math.min(100, Math.round(100 - riskPenalty - Math.max(0, project.marginTarget - forecastMargin) * 3))),
    };
  });
}

function enrichWorkOrders(state) {
  const projects = new Map(state.projects.map((project) => [project.id, project]));
  return state.workOrders.map((order) => ({
    ...order,
    projectName: projects.get(order.projectId)?.name ?? order.projectId,
    customer: projects.get(order.projectId)?.customer ?? "Cliente desconhecido",
  }));
}

function enrichInvoices(state) {
  const projects = new Map(state.projects.map((project) => [project.id, project]));
  return state.invoices.map((invoice) => ({
    ...invoice,
    projectName: projects.get(invoice.projectId)?.name ?? invoice.projectId,
  }));
}

function buildAlerts(state, projects, workOrders) {
  const alerts = [];
  projects.filter((project) => project.risk === "critical").forEach((project) => alerts.push({
    id: `margin-${project.id}`,
    severity: "critical",
    title: `${project.id} abaixo da margem`,
    detail: `${project.marginGap} pontos de desvio e ${project.marginAtRisk} em risco`,
  }));
  workOrders.filter((order) => order.sla !== "on_track").slice(0, 2).forEach((order) => alerts.push({
    id: `sla-${order.id}`,
    severity: order.sla === "breached" ? "critical" : "high",
    title: `${order.id} exige decisao`,
    detail: `${order.projectName} - ${order.status}`,
  }));
  return { alerts: alerts.slice(0, 5) };
}

function buildAutomations(state, workOrders) {
  const shortages = state.materials.filter((item) => item.available < item.minimum);
  return { suggestions: [
    { channel: "OS", action: "Priorizar fila de SLA", count: workOrders.filter((item) => item.sla !== "on_track").length, impact: "reduzir atrasos de campo" },
    { channel: "CP", action: "Abrir cotacoes de material", count: shortages.length, impact: "proteger margem e cronograma" },
    { channel: "FN", action: "Liberar faturas prontas", count: state.invoices.filter((item) => item.state === "ready").length, impact: "antecipar entrada de caixa" },
  ] };
}

export function buildDashboard(state, params = new URLSearchParams()) {
  const projects = enrichProjects(state);
  const allOrders = enrichWorkOrders(state);
  const status = params.get("status") ?? "all";
  const priority = params.get("priority") ?? "all";
  const search = (params.get("search") ?? "").trim().toLowerCase();
  const workOrders = allOrders.filter((order) =>
    (status === "all" || order.status === status)
    && (priority === "all" || order.priority === priority)
    && (!search || `${order.id} ${order.projectId} ${order.projectName} ${order.customer}`.toLowerCase().includes(search)),
  );
  const contractValue = projects.reduce((sum, project) => sum + project.contractValue, 0);
  const forecastCost = projects.reduce((sum, project) => sum + project.forecastCost, 0);
  const shortages = state.materials.filter((item) => item.available < item.minimum);
  return {
    summary: {
      totalMarginPercent: Number(((contractValue - forecastCost) / contractValue * 100).toFixed(1)),
      totalMarginDollars: contractValue - forecastCost,
      marginAtRisk: projects.reduce((sum, project) => sum + project.marginAtRisk, 0),
      crewUtilization: Math.round(state.crews.reduce((sum, crew) => sum + crew.utilization, 0) / Math.max(state.crews.length, 1)),
      openWorkOrders: allOrders.filter((order) => order.status !== "closed").length,
      materialShortages: shortages.length,
      pendingInvoices: state.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
      invoiceCount: state.invoices.length,
    },
    projects: { projects },
    alerts: buildAlerts(state, projects, allOrders),
    automations: buildAutomations(state, allOrders),
    workOrders: { count: workOrders.length, workOrders },
    invoices: { count: state.invoices.length, invoices: enrichInvoices(state) },
    lastAutomation: state.lastAutomation ?? null,
  };
}

export function applyAction(state, input) {
  if (input.action !== "run_automations") throw new Error("Acao nao suportada.");
  const candidates = state.workOrders.filter((order) => order.sla !== "on_track").slice(0, 3);
  return {
    ...state,
    lastAutomation: {
      sent: candidates.length,
      orderIds: candidates.map((order) => order.id),
      at: new Date().toISOString(),
    },
  };
}
