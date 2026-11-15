// Confere os manifestos dos canais antes de aceitar uma alteração na main:
// assinatura Ed25519 com a chave pública do app, formato, URLs só deste
// repositório e série que nunca volta atrás (em relação à main).
// Uso: node .github/scripts/validar-canais.js [pasta-da-main-para-comparar]
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..', '..');
const base = process.argv[2] ? path.resolve(process.argv[2]) : null;
const repo = process.env.GITHUB_REPOSITORY || 'moraisnet1/claude-backup-releases';
const publica = crypto.createPublicKey(fs.readFileSync(path.join(raiz, 'chave-publica.pem')));
if (publica.asymmetricKeyType !== 'ed25519') throw new Error('chave-publica.pem não é Ed25519');

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const erros = [];
const erro = (m) => erros.push(m);

for (const canal of ['stable', 'beta']) {
  const arq = path.join(raiz, 'canais', canal + '.json');
  if (!fs.existsSync(arq)) { erro(canal + ': canais/' + canal + '.json não existe'); continue; }
  const texto = fs.readFileSync(arq, 'utf8');
  let sig;
  try { sig = Buffer.from(fs.readFileSync(arq + '.sig', 'utf8').trim(), 'base64'); } catch { erro(canal + ': assinatura ausente'); continue; }
  if (sig.length !== 64 || !crypto.verify(null, Buffer.from(texto), publica, sig)) { erro(canal + ': assinatura Ed25519 não confere'); continue; }
  let m;
  try { m = JSON.parse(texto); } catch { erro(canal + ': JSON inválido'); continue; }
  if (m.canal !== canal) erro(canal + ': campo canal = ' + m.canal);
  if (!Number.isInteger(m.serie) || m.serie < 1) erro(canal + ': série inválida');
  if (!Array.isArray(m.versoes)) { erro(canal + ': versoes não é lista'); continue; }
  const vistas = new Set();
  for (const v of m.versoes) {
    const id = canal + ' ' + (v && v.versao);
    if (!v || !SEMVER.test(String(v.versao))) { erro(id + ': versão inválida'); continue; }
    if (vistas.has(v.versao)) erro(id + ': versão repetida');
    vistas.add(v.versao);
    if (!String(v.url).startsWith('https://github.com/' + repo + '/releases/download/')) erro(id + ': URL fora deste repositório');
    if (!/^[0-9a-f]{64}$/.test(String(v.sha256))) erro(id + ': sha256 inválido');
    if (!Number.isInteger(v.tamanho) || v.tamanho <= 0) erro(id + ': tamanho inválido');
    if (canal === 'stable' && String(v.versao).includes('-')) erro(id + ': versão de teste no canal stable');
  }
  if (base) {
    const antes = path.join(base, 'canais', canal + '.json');
    if (fs.existsSync(antes)) {
      const textoAntes = fs.readFileSync(antes, 'utf8');
      const a = JSON.parse(textoAntes);
      if (texto !== textoAntes && !(m.serie > a.serie)) erro(canal + ': a série precisa aumentar (' + a.serie + ' → ' + m.serie + ')');
      for (const v of a.versoes || []) {
        const agora = m.versoes.find((x) => x.versao === v.versao);
        if (!agora) erro(canal + ' ' + v.versao + ': versão publicada não pode sumir (bloqueie em vez de apagar)');
        else if (agora.sha256 !== v.sha256 || agora.url !== v.url) erro(canal + ' ' + v.versao + ': arquivo de versão publicada não pode mudar');
      }
    }
  }
}

if (erros.length) { console.error('Manifestos recusados:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log('Manifestos ok (assinatura, formato e série).');
