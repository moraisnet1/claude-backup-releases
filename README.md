# Claude Backup — distribuição

Este repositório contém apenas os arquivos públicos de distribuição do Claude Backup:

- **Releases**: o `ClaudeBackup-<versão>.exe` de cada versão (imutáveis).
- **canais/stable.json** e **canais/beta.json**: manifestos de atualização, assinados
  com Ed25519 (`.sig`). O aplicativo confere a assinatura e o SHA-256 antes de instalar.

O código-fonte e os dados dos usuários não ficam aqui.

## Proteção e validação

- A branch `main` não aceita push direto, force push nem exclusão: tudo entra por
  pull request.
- O check **manifestos** (`.github/workflows/validar.yml`) precisa passar antes do
  merge: confere a assinatura Ed25519 com `chave-publica.pem`, o formato, que as URLs
  são releases deste repositório, que a série só aumenta e que nenhuma versão
  publicada some ou muda de arquivo (versões com problema são bloqueadas, não apagadas).
- Secret Scanning e Push Protection estão ativos.
- Relatos de segurança: aba **Security → Report a vulnerability**.
