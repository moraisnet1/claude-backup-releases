# Claude Backup — distribuição

Este repositório contém apenas os arquivos públicos de distribuição do Claude Backup:

- **Releases**: o `ClaudeBackup-<versão>.exe` de cada versão (imutáveis).
- **canais/stable.json** e **canais/beta.json**: manifestos de atualização, assinados
  com Ed25519 (`.sig`). O aplicativo confere a assinatura e o SHA-256 antes de instalar.

O código-fonte e os dados dos usuários não ficam aqui.
