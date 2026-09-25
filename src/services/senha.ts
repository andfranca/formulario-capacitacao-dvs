// Hash de senha via PBKDF2 (Web Crypto nativa) — sem biblioteca de autenticação.
const ITERACOES_PADRAO = 100_000;
const TAMANHO_SALT = 16;
const TAMANHO_HASH_BITS = 256;

function paraBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function deBase64(valor: string): Uint8Array {
  return Uint8Array.from(atob(valor), (c) => c.charCodeAt(0));
}

async function derivarHash(senha: string, salt: Uint8Array, iteracoes: number): Promise<Uint8Array> {
  const chaveBase = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: iteracoes, hash: "SHA-256" },
    chaveBase,
    TAMANHO_HASH_BITS,
  );
  return new Uint8Array(bits);
}

export interface SenhaHash {
  hash: string;
  salt: string;
  iteracoes: number;
}

export async function gerarHashSenha(senha: string): Promise<SenhaHash> {
  const salt = crypto.getRandomValues(new Uint8Array(TAMANHO_SALT));
  const hashBytes = await derivarHash(senha, salt, ITERACOES_PADRAO);
  return { hash: paraBase64(hashBytes), salt: paraBase64(salt), iteracoes: ITERACOES_PADRAO };
}

export async function verificarSenha(senha: string, senhaHash: SenhaHash): Promise<boolean> {
  const salt = deBase64(senhaHash.salt);
  const hashCalculado = await derivarHash(senha, salt, senhaHash.iteracoes);
  const hashEsperado = deBase64(senhaHash.hash);
  if (hashCalculado.length !== hashEsperado.length) return false;
  let diff = 0;
  for (let i = 0; i < hashCalculado.length; i++) diff |= hashCalculado[i] ^ hashEsperado[i];
  return diff === 0;
}
