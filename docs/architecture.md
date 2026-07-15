# Arquitetura da prova comercial

## Visao geral

```mermaid
flowchart LR
  B[Dashboard publico] --> API[/api/state]
  API --> AUTH[Sign in with ChatGPT]
  API --> DOMAIN[Margem, SLA e despacho]
  API --> DB[(D1 por usuario)]
  CI[GitHub Actions] --> PHP[PHP 8.3 e testes]
  CI --> BUILD[Build Vinext]
```

O sistema PHP e TypeScript permanece como implementacao principal. O deploy em `sites/` reproduz as regras comerciais no edge para disponibilizar uma demonstracao publica sem depender de servidor PHP.

## Limites e seguranca

- Visitantes consultam o seed; despachos exigem login e ficam isolados por usuario.
- A automacao registra uma intencao auditavel e nao fecha ordens ou altera SLA sem confirmacao humana.
- O backend aceita somente `run_automations` e limita a fila a tres ordens de risco.
- Identidade e propriedade do workspace nao podem ser sobrescritas pelo cliente.

## Persistencia

O D1 guarda o estado da prova por usuario. A migration de `workspaces` possui scripts de subida e reversao, com criacao idempotente no primeiro acesso. Em producao, projetos, ordens, materiais, equipes, faturas e eventos devem usar tabelas normalizadas e controle de papeis.

## Qualidade

A CI valida sintaxe PHP 8.3, regras de margem, checks estaticos, smoke test, dominio hospedado e build. A separacao entre dominio, rota e banco evita acoplamento entre interface e persistencia.
