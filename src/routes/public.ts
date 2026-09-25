import { Hono } from "hono";
import type { Env } from "../env";
import { buscarCapacitacaoPorCodigo } from "../services/capacitacoes";
import { criarAvaliacao } from "../services/avaliacoes";
import { verificarTurnstile } from "../services/turnstile";
import { gerarQrCodeSvg } from "../services/qrcode";
import { listarPerguntas, perguntasAplicaveis } from "../services/perguntas";
import { validarParticipante, validarRespostas } from "../utils/validation";
import { tipoTemInstrutor } from "../data/tipos";
import { paginaInicial, paginaNaoEncontrada, paginaEncerrada, paginaAvaliacao, paginaConfirmacaoResposta } from "../views/public";

export const publicRoutes = new Hono<{ Bindings: Env }>();

publicRoutes.get("/", (c) => c.html(paginaInicial()));

publicRoutes.get("/avaliar/:codigo/obrigado", (c) => c.html(paginaConfirmacaoResposta()));

publicRoutes.get("/avaliar/:codigo", async (c) => {
  const cap = await buscarCapacitacaoPorCodigo(c.env.DB, c.req.param("codigo"));
  if (!cap) return c.html(paginaNaoEncontrada(), 404);
  if (cap.status === "encerrada") return c.html(paginaEncerrada());

  const todasPerguntas = await listarPerguntas(c.env.DB, { apenasAtivas: true });
  const perguntas = perguntasAplicaveis(todasPerguntas, tipoTemInstrutor(cap.tipo));

  return c.html(
    paginaAvaliacao({
      cap,
      perguntas,
      turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
    }),
  );
});

publicRoutes.post("/avaliar/:codigo", async (c) => {
  const codigo = c.req.param("codigo");
  const cap = await buscarCapacitacaoPorCodigo(c.env.DB, codigo);
  if (!cap) return c.html(paginaNaoEncontrada(), 404);
  if (cap.status === "encerrada") return c.html(paginaEncerrada());

  const todasPerguntas = await listarPerguntas(c.env.DB, { apenasAtivas: true });
  const perguntas = perguntasAplicaveis(todasPerguntas, tipoTemInstrutor(cap.tipo));

  const body = (await c.req.parseBody()) as Record<string, unknown>;

  const turnstileToken = typeof body["cf-turnstile-response"] === "string" ? (body["cf-turnstile-response"] as string) : undefined;
  const turnstileOk = await verificarTurnstile(c.env.TURNSTILE_SECRET_KEY, turnstileToken, c.req.header("CF-Connecting-IP"));

  const resultadoParticipante = validarParticipante(body);
  const resultadoRespostas = validarRespostas(body, perguntas);

  if (!turnstileOk || !resultadoParticipante.valid || !resultadoRespostas.valid) {
    const erros = [
      ...(resultadoParticipante.valid ? [] : resultadoParticipante.errors),
      ...(resultadoRespostas.valid ? [] : resultadoRespostas.errors),
      ...(turnstileOk ? [] : ["Verificação de segurança falhou. Tente novamente."]),
    ];
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(
      paginaAvaliacao({
        cap,
        perguntas,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        erros,
        valores,
      }),
      400,
    );
  }

  await criarAvaliacao(c.env.DB, cap.id, resultadoParticipante.data, resultadoRespostas.data);
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
