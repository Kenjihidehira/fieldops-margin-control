# Endpoints da API

URL base ao rodar localmente:

```text
http://127.0.0.1:8080
```

## Saúde

```http
GET /api/health
```

Retorna o status do serviço.

## Resumo

```http
GET /api/summary
```

Retorna KPIs consolidados: percentual de margem, margem em valor, margem em risco, utilização da equipe, quantidade de ordens, falta de materiais, valor de faturas e atrasos de SLA.

## Projetos

```http
GET /api/projects
```

Retorna economia dos projetos com margem prevista, lucro previsto, diferença de margem, margem em risco e pontuação de saúde.

## Ordens de Serviço

```http
GET /api/work-orders?status=all&priority=all&search=riverside
```

Parâmetros suportados:

- `status`: `all`, `in_progress`, `waiting_parts`, `scheduled`, `blocked`
- `priority`: `all`, `critical`, `high`, `medium`, `low`
- `search`: busca livre por ordem, projeto ou cliente

## Faturas

```http
GET /api/invoices?state=ready
```

Estados suportados: `all`, `ready`, `overdue`, `draft`.

## Alertas

```http
GET /api/alerts
```

Retorna alertas operacionais combinando risco de SLA, material, orçamento, equipe e cobrança.

## Sugestões de Automação

```http
GET /api/automations
```

Retorna oportunidades simuladas de automação para compras, cobrança e despacho.

## Rodar Automações

```http
POST /api/automations/run
Content-Type: application/json

{"limit":3}
```

Retorna um lote simulado. A operação é segura para demo e não envia mensagens externas.
