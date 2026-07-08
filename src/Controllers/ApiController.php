<?php

declare(strict_types=1);

namespace FieldOps\Controllers;

use FieldOps\Services\MarginControlService;

final class ApiController
{
    public function __construct(private readonly MarginControlService $service)
    {
    }

    public function summary(): array
    {
        return $this->service->summary();
    }

    public function projects(): array
    {
        return ['projects' => $this->service->projects()];
    }

    public function workOrders(array $filters): array
    {
        $orders = $this->service->workOrders($filters);
        return ['count' => count($orders), 'workOrders' => $orders];
    }

    public function invoices(array $filters): array
    {
        $invoices = $this->service->invoices($filters);
        return ['count' => count($invoices), 'invoices' => $invoices];
    }

    public function alerts(): array
    {
        return ['alerts' => $this->service->alerts()];
    }

    public function automationSuggestions(): array
    {
        return ['suggestions' => $this->service->automationSuggestions()];
    }

    public function runAutomations(array $payload): array
    {
        return $this->service->runAutomations((int) ($payload['limit'] ?? 3));
    }
}
