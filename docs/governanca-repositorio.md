# Governança do repositório

Fluxo adotado: `feature/*` → `develop` → `homolog` → `main`.

- `main` aceita mudanças somente por Pull Request, com os checks obrigatórios aprovados e a branch atualizada.
- Force push e exclusão da `main` são bloqueados.
- `homolog` representa o ambiente de homologação; `main`, produção.
- Os environments GitHub são `homolog` e `production`.
- O CODEOWNER é `@maypinheiro`. Em razão de o projeto possuir uma única mantenedora, aprovação de terceiro não é obrigatória; checks e resolução de conversas continuam obrigatórios.
- Deploys dependem de secrets cadastrados nos environments. Valores reais não são versionados.

A inclusão de `soat-architecture` foi dispensada por decisão da responsável pelo projeto.
