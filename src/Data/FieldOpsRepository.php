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
            throw new RuntimeException('Arquivo de dados de exemplo não encontrado.');
        }

        $payload = json_decode(file_get_contents($seedPath) ?: '', true);
        if (!is_array($payload)) {
            throw new RuntimeException('O arquivo de dados de exemplo contém JSON inválido.');
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
