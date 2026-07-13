<?php

declare(strict_types=1);

namespace FieldOps\Services;

use FieldOps\Data\FieldOpsRepository;

final class MarginControlService
{
    public function __construct(private readonly FieldOpsRepository $repository)
    {
    }

    public function summary(): array
    {
        $projects = $this->projects();
        $orders = $this->repository->workOrders();
        $invoices = $this->repository->invoices();
        $materials = $this->repository->materials();
        $crews = $this->repository->crews();

        $contractValue = array_sum(array_column($projects, 'contractValue'));
        $forecastCost = array_sum(array_column($projects, 'forecastCost'));
        $marginDollars = $contractValue - $forecastCost;
        $marginPercent = $contractValue > 0 ? round(($marginDollars / $contractValue) * 100, 1) : 0;

        return [
            'company' => $this->repository->company(),
            'totalMarginPercent' => $marginPercent,
            'totalMarginDollars' => $marginDollars,
            'marginAtRisk' => array_sum(array_column($projects, 'marginAtRisk')),
            'crewUtilization' => round(array_sum(array_column($crews, 'utilization')) / max(count($crews), 1)),
            'openWorkOrders' => count(array_filter($orders, fn ($order) => $order['status'] !== 'closed')),
            'materialShortages' => count($this->materialShortages()),
            'pendingInvoices' => array_sum(array_column($invoices, 'amount')),
            'invoiceCount' => count($invoices),
            'slaDelays' => count(array_filter($orders, fn ($order) => $order['sla'] !== 'on_track')),
        ];
    }

    public function projects(): array
    {
        return array_map(function (array $project): array {
            $contract = (float) $project['contractValue'];
            $forecast = (float) $project['forecastCost'];
            $targetMargin = (float) $project['marginTarget'];
            $forecastMargin = $contract > 0 ? (($contract - $forecast) / $contract) * 100 : 0;
            $targetDollars = $contract * ($targetMargin / 100);
            $forecastDollars = $contract - $forecast;
            $marginAtRisk = max(0, $targetDollars - $forecastDollars);

            return [
                ...$project,
                'forecastMargin' => round($forecastMargin, 1),
                'forecastProfit' => round($forecastDollars),
                'marginGap' => round($targetMargin - $forecastMargin, 1),
                'marginAtRisk' => round($marginAtRisk),
                'healthScore' => $this->healthScore($project['progress'], $forecastMargin, $targetMargin, $project['risk']),
            ];
        }, $this->repository->projects());
    }

    public function workOrders(array $filters = []): array
    {
        $projects = $this->indexBy($this->repository->projects(), 'id');
        $orders = array_map(function (array $order) use ($projects): array {
            $project = $projects[$order['projectId']] ?? [];
            return [
                ...$order,
                'projectName' => $project['name'] ?? $order['projectId'],
                'customer' => $project['customer'] ?? 'Cliente desconhecido',
            ];
        }, $this->repository->workOrders());

        return array_values(array_filter($orders, function (array $order) use ($filters): bool {
            $status = $filters['status'] ?? 'all';
            $priority = $filters['priority'] ?? 'all';
            $search = strtolower(trim((string) ($filters['search'] ?? '')));

            if ($status !== 'all' && $order['status'] !== $status) {
                return false;
            }

            if ($priority !== 'all' && $order['priority'] !== $priority) {
                return false;
            }

            if ($search !== '') {
                $haystack = strtolower($order['id'] . ' ' . $order['projectName'] . ' ' . $order['customer']);
                return str_contains($haystack, $search);
            }

            return true;
        }));
    }

    public function invoices(array $filters = []): array
    {
        $state = $filters['state'] ?? 'all';
        $projects = $this->indexBy($this->repository->projects(), 'id');
        $invoices = array_map(function (array $invoice) use ($projects): array {
            return [
                ...$invoice,
                'projectName' => $projects[$invoice['projectId']]['name'] ?? $invoice['projectId'],
            ];
        }, $this->repository->invoices());

        if ($state === 'all') {
            return $invoices;
        }

        return array_values(array_filter($invoices, fn (array $invoice): bool => $invoice['state'] === $state));
    }

    public function alerts(): array
    {
        $projects = $this->projects();
        $criticalProjects = array_filter($projects, fn (array $project): bool => $project['risk'] === 'critical');
        $shortages = $this->materialShortages();
        $delayedOrders = array_filter($this->repository->workOrders(), fn (array $order): bool => $order['sla'] !== 'on_track');
        $lowCrews = array_filter($this->repository->crews(), fn (array $crew): bool => $crew['utilization'] < 60);
        $overdueInvoices = array_filter($this->repository->invoices(), fn (array $invoice): bool => $invoice['state'] === 'overdue');

        return [
            ['severity' => 'critical', 'title' => count($delayedOrders) . ' atrasos de SLA', 'detail' => 'Ordens de serviço precisam de atenção do despacho.'],
            ['severity' => 'high', 'title' => count($shortages) . ' faltas de material', 'detail' => 'R$ ' . number_format(array_sum(array_column($shortages, 'impact')), 0, ',', '.') . ' de impacto na margem.'],
            ['severity' => 'high', 'title' => count($criticalProjects) . ' projetos acima do orçamento', 'detail' => 'R$ ' . number_format(array_sum(array_column($criticalProjects, 'marginAtRisk')), 0, ',', '.') . ' em risco previsto.'],
            ['severity' => 'medium', 'title' => count($lowCrews) . ' equipes abaixo de 60%', 'detail' => 'Rebalancear mão de obra antes do fechamento da folha.'],
            ['severity' => 'medium', 'title' => count($overdueInvoices) . ' invoices vencidas', 'detail' => 'Fluxo de cobrança já pode ser acionado.'],
        ];
    }

    public function automationSuggestions(): array
    {
        $shortages = $this->materialShortages();
        $readyInvoices = array_filter($this->repository->invoices(), fn (array $invoice): bool => $invoice['state'] === 'ready');
        $delayed = array_filter($this->repository->workOrders(), fn (array $order): bool => $order['sla'] !== 'on_track');

        return [
            [
                'action' => 'Recomprar materiais automaticamente',
                'channel' => 'Compras',
                'impact' => 'R$ ' . number_format(array_sum(array_column($shortages, 'impact')), 0, ',', '.') . ' de margem protegida',
                'count' => count($shortages),
            ],
            [
                'action' => 'Enviar lembretes de invoice',
                'channel' => 'Cobrança',
                'impact' => 'R$ ' . number_format(array_sum(array_column($readyInvoices, 'amount')), 0, ',', '.') . ' prontos para cobrança',
                'count' => count($readyInvoices),
            ],
            [
                'action' => 'Escalar atrasos de SLA',
                'channel' => 'Despacho',
                'impact' => count($delayed) . ' ordens priorizadas',
                'count' => count($delayed),
            ],
        ];
    }

    public function runAutomations(int $limit = 3): array
    {
        $items = array_slice($this->automationSuggestions(), 0, max(1, min($limit, 5)));
        return [
            'sent' => count($items),
            'message' => count($items) . ' fluxos de automação simulados.',
            'items' => $items,
        ];
    }

    private function materialShortages(): array
    {
        return array_values(array_filter(
            $this->repository->materials(),
            fn (array $material): bool => $material['available'] < $material['minimum']
        ));
    }

    private function healthScore(int $progress, float $forecastMargin, float $targetMargin, string $risk): int
    {
        $riskPenalty = ['low' => 0, 'moderate' => 10, 'high' => 22, 'critical' => 34][$risk] ?? 12;
        $marginPenalty = max(0, ($targetMargin - $forecastMargin) * 2.5);
        return (int) max(1, min(99, round(100 - $riskPenalty - $marginPenalty + ($progress / 12))));
    }

    private function indexBy(array $rows, string $key): array
    {
        $indexed = [];
        foreach ($rows as $row) {
            $indexed[$row[$key]] = $row;
        }
        return $indexed;
    }
}
