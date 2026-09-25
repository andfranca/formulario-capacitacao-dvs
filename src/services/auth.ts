// Sessão administrativa sem estado: o cookie carrega um payload {exp} assinado
// com HMAC-SHA256 (Web Crypto nativa), verificado a cada request administrativo.
// Não há tabela de sessões nem biblioteca de autenticação.

export const SESSION_COOKIE_NAME = "sessao";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function criarCookieSessao(secret: string): Promise<string> {
  const exp = Date.now() + SESSION_DURATION_MS;
  const payload = JSON.stringify({ exp });
  const payloadBytes = new TextEncoder().encode(payload);
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function sessaoValida(secret: string, cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const partes = cookieValue.split(".");
  if (partes.length !== 2) return false;
  const [payloadPart, signaturePart] = partes;

  try {
    const payloadBytes = base64UrlDecode(payloadPart);
    const signatureBytes = base64UrlDecode(signaturePart);
    const key = await importKey(secret);
    const assinaturaValida = await crypto.subtle.verify("HMAC", key, signatureBytes, payloadBytes);
    if (!assinaturaValida) return false;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as { exp: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Comparação em tempo constante para reduzir vazamento de informação por timing.
export function senhaCorreta(senhaEnviada: string, senhaEsperada: string): boolean {
  const a = new TextEncoder().encode(senhaEnviada);
  const b = new TextEncoder().encode(senhaEsperada);
  const tamanho = Math.max(a.length, b.length, 1);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < tamanho; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
