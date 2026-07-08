<?php

declare(strict_types=1);

namespace FieldOps\Data;

use RuntimeException;

final class FieldOpsRepository
{
    private array $seed;

    public function __construct(string $seedPath)
    {
        if (!is_file($seedPath)) {
            throw new RuntimeException('Seed file not found.');
        }

        $payload = json_decode(file_get_contents($seedPath) ?: '', true);
        if (!is_array($payload)) {
            throw new RuntimeException('Seed file is invalid JSON.');
        }

        $this->seed = $payload;
    }

    public function company(): array
    {
        return $this->seed['company'] ?? [];
    }

    public function projects(): array
    {
        return $this->seed['projects'] ?? [];
    }

    public function workOrders(): array
    {
        return $this->seed['workOrders'] ?? [];
    }

    public function invoices(): array
    {
        return $this->seed['invoices'] ?? [];
    }

    public function materials(): array
    {
        return $this->seed['materials'] ?? [];
    }

    public function crews(): array
    {
        return $this->seed['crews'] ?? [];
    }
}
