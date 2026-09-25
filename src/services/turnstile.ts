export async function verificarTurnstile(secretKey: string, token: string | undefined, ip: string | undefined): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secretKey);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  const resposta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const resultado = (await resposta.json()) as { success: boolean };
  return resultado.success === true;
}
