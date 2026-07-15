# FieldOps Margin Control

[![CI](https://github.com/Kenjihidehira/fieldops-margin-control/actions/workflows/ci.yml/badge.svg)](https://github.com/Kenjihidehira/fieldops-margin-control/actions/workflows/ci.yml)
[![Demo pública](https://img.shields.io/badge/demo-pública-0f766e)](https://fieldops-margin.dadosepesquisa.chatgpt.site)

Painel comercial em PHP + TypeScript para empresas de obras e serviços de campo que precisam proteger margem de projeto enquanto coordenam equipes, materiais, ordens de serviço e faturamento.

Este é um sistema de negócio para portfólio, não um modelo de tutorial. Ele demonstra uma API PHP organizada em camadas de controle, serviço e repositório, além de uma interface TypeScript consumindo endpoints reais.

## Prova comercial publicada

- **Demo:** [fieldops-margin.dadosepesquisa.chatgpt.site](https://fieldops-margin.dadosepesquisa.chatgpt.site)
- **Autenticação:** indicadores públicos de demonstração e execuções operacionais protegidas por Sign in with ChatGPT.
- **Persistência:** projetos, ordens e auditoria de automações ficam em workspace D1 isolado por usuário.
- **Segurança operacional:** a automação registra intenção e auditoria, sem fechar ordens ou SLA automaticamente.
- **Entrega:** CI valida PHP, TypeScript, regras de negócio, build Vinext e migration reversível.
- **Arquitetura:** [`docs/architecture.md`](docs/architecture.md).

## Valor Comercial

Empresas de serviço em campo costumam perder margem por atrasos em ordens de serviço, falta de materiais, equipes subutilizadas e faturamento lento. Este app dá ao gerente operacional uma torre de controle para:

- Previsão de margem por projeto e margem em risco.
- Monitoramento de utilização de equipes.
- Alertas de atraso de SLA.
- Impacto financeiro de falta de materiais.
- Filtro de ordens de serviço.
- Prontidão de faturamento.
- Simulação de automações para compras, cobrança e despacho.

## Stack

- PHP 8.2+ com API leve em estilo MVC
- Fonte TypeScript em `resources/ts/app.ts`
- Módulo compilado para navegador em `public/assets/app.js`
- Sistema visual do painel em `public/assets/styles.css`
- Dados JSON de exemplo em `data/seed.json`
- Scripts de validação em Node sem pacotes externos
- Dockerfile para publicação com ambiente PHP
- Vinext/React e Cloudflare D1 na versão comercial hospedada

## Telas e prévia

Prévia visual:

```text
docs/dashboard-preview.svg
```

Interface principal:

- Faixa de KPIs de margem, risco, utilização de equipe, ordens, materiais e faturamento.
- Quadro de margem por projeto com indicação de risco.
- Fila de alertas.
- Sugestões de automação.
- Tabelas de ordens de serviço e faturas.

## Endpoints da API

Documentados em:

```text
docs/api-endpoints.md
```

Principais endpoints:

- `GET /api/health`
- `GET /api/summary`
- `GET /api/projects`
- `GET /api/work-orders`
- `GET /api/invoices`
- `GET /api/alerts`
- `GET /api/automations`
- `POST /api/automations/run`

## Como Rodar Localmente

Instale PHP 8.2+.

```bash
php -S 127.0.0.1:8080 -t public
```

Acesse:

```text
http://127.0.0.1:8080
```

## Build do TypeScript

O repositório evita dependências npm de propósito. O script de build transpila o TypeScript usado aqui para um módulo de navegador.

```bash
node scripts/build-ts.mjs
```

## Validação

```bash
node scripts/build-ts.mjs
node tests/business-rules.test.mjs
node tests/static-check.test.mjs
node tests/smoke.test.mjs
```

Se PHP estiver disponível:

```bash
composer run lint
php -S 127.0.0.1:8080 -t public
```

## Docker

```bash
docker build -t fieldops-margin-control .
docker run --rm -p 8080:8080 fieldops-margin-control
```

A versão comercial está publicada no [OpenAI Sites](https://fieldops-margin.dadosepesquisa.chatgpt.site). O código implantado e sua configuração ficam em `sites/`; a API PHP continua sendo uma alternativa executável por Docker.

## Diferenciais Comerciais

- Domínio operacional e financeiro prático, útil em propostas freelance.
- Servidor orientado a API que pode evoluir para Laravel.
- Interface TypeScript com filtros reais e estado de automação.
- Dados de exemplo modelando economia de projetos, ordens, materiais, faturas e equipes.
- Simulação de automação segura para demo, sem serviços externos ou secrets.

## Melhorias Possíveis

- Adaptar MySQL ou PostgreSQL para instalações da API PHP fora do Sites.
- Adicionar migrations/controllers Laravel se Composer estiver disponível.
- Adicionar permissões granulares por perfil.
- Exportar faturas em PDF.
- Integrar webhooks com QuickBooks, Slack ou WhatsApp.
- Criar worker de fila para automações reais.
