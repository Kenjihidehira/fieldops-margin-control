<?php

declare(strict_types=1);

use FieldOps\Controllers\ApiController;
use FieldOps\Data\FieldOpsRepository;
use FieldOps\Services\MarginControlService;
use FieldOps\Support\Response;

spl_autoload_register(function (string $class): void {
    $prefix = 'FieldOps\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . $relative . '.php';
    if (is_file($path)) {
        require $path;
    }
});

$repository = new FieldOpsRepository(dirname(__DIR__) . '/data/seed.json');
$service = new MarginControlService($repository);
$controller = new ApiController($service);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!str_starts_with($path, '/api')) {
    Response::html(file_get_contents(dirname(__DIR__) . '/resources/views/dashboard.html') ?: '');
    return;
}

try {
    match ([$method, $path]) {
        ['GET', '/api/health'] => Response::json(['ok' => true, 'service' => 'fieldops-margin-control']),
        ['GET', '/api/summary'] => Response::json($controller->summary()),
        ['GET', '/api/projects'] => Response::json($controller->projects()),
        ['GET', '/api/work-orders'] => Response::json($controller->workOrders($_GET)),
        ['GET', '/api/invoices'] => Response::json($controller->invoices($_GET)),
        ['GET', '/api/alerts'] => Response::json($controller->alerts()),
        ['GET', '/api/automations'] => Response::json($controller->automationSuggestions()),
        ['POST', '/api/automations/run'] => Response::json($controller->runAutomations(readJsonBody())),
        default => Response::json(['error' => 'Rota não encontrada'], 404),
    };
} catch (Throwable $error) {
    Response::json(['error' => $error->getMessage()], 500);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input') ?: '{}';
    $payload = json_decode($raw, true);
    return is_array($payload) ? $payload : [];
}
