import { Hono } from "hono";
import type { Env } from "../env";
import { buscarCapacitacaoPorCodigo } from "../services/capacitacoes";
import { criarAvaliacao } from "../services/avaliacoes";
import { verificarTurnstile } from "../services/turnstile";
import { gerarQrCodeSvg } from "../services/qrcode";
import { validarNovaAvaliacao } from "../utils/validation";
import { tipoTemInstrutor } from "../data/tipos";
import { paginaInicial, paginaNaoEncontrada, paginaEncerrada, paginaAvaliacao, paginaConfirmacaoResposta } from "../views/public";

export const publicRoutes = new Hono<{ Bindings: Env }>();

publicRoutes.get("/", (c) => c.html(paginaInicial()));

publicRoutes.get("/avaliar/:codigo/obrigado", (c) => c.html(paginaConfirmacaoResposta()));

publicRoutes.get("/avaliar/:codigo", async (c) => {
  const cap = await buscarCapacitacaoPorCodigo(c.env.DB, c.req.param("codigo"));
  if (!cap) return c.html(paginaNaoEncontrada(), 404);
  if (cap.status === "encerrada") return c.html(paginaEncerrada());

  return c.html(
    paginaAvaliacao({
      cap,
      q5Aplicavel: tipoTemInstrutor(cap.tipo),
      turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
    }),
  );
});

publicRoutes.post("/avaliar/:codigo", async (c) => {
  const codigo = c.req.param("codigo");
  const cap = await buscarCapacitacaoPorCodigo(c.env.DB, codigo);
  if (!cap) return c.html(paginaNaoEncontrada(), 404);
  if (cap.status === "encerrada") return c.html(paginaEncerrada());

  const q5Aplicavel = tipoTemInstrutor(cap.tipo);
  const body = (await c.req.parseBody()) as Record<string, unknown>;

  const turnstileToken = typeof body["cf-turnstile-response"] === "string" ? (body["cf-turnstile-response"] as string) : undefined;
  const turnstileOk = await verificarTurnstile(c.env.TURNSTILE_SECRET_KEY, turnstileToken, c.req.header("CF-Connecting-IP"));

  const resultado = validarNovaAvaliacao(body, q5Aplicavel);

  if (!turnstileOk || !resultado.valid) {
    const erros = [...(resultado.valid ? [] : resultado.errors), ...(turnstileOk ? [] : ["Verificação de segurança falhou. Tente novamente."])];
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(
      paginaAvaliacao({
        cap,
        q5Aplicavel,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        erros,
        valores,
      }),
      400,
    );
  }

  await criarAvaliacao(c.env.DB, cap.id, resultado.data);
  return c.redirect(`/avaliar/${encodeURIComponent(codigo)}/obrigado`, 303);
});

publicRoutes.get("/qr/:codigo", async (c) => {
  const codigo = c.req.param("codigo");
  const cap = await buscarCapacitacaoPorCodigo(c.env.DB, codigo);
  if (!cap) return c.notFound();

  const link = `${new URL(c.req.url).origin}/avaliar/${encodeURIComponent(codigo)}`;
  const svg = await gerarQrCodeSvg(link);
  return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
});
