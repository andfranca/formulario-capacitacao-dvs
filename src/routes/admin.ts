import { Hono } from "hono";
import type { Env } from "../env";
import { exigirAdmin } from "./auth";
import {
  criarCapacitacao,
  listarCapacitacoes,
  buscarCapacitacaoPorId,
  atualizarCapacitacao,
  alternarStatusCapacitacao,
} from "../services/capacitacoes";
import { contarRespostas, buscarRespostasPorCapacitacao } from "../services/avaliacoes";
import { calcularResultadosPerguntas } from "../services/resultados";
import { calcularIndicadoresPainel } from "../services/painel";
import { exportarCapacitacoesCsv, exportarAvaliacoesCsv, exportarConsolidadoCsv } from "../services/exportacao";
import { criarCriador, listarCriadores, excluirCriador } from "../services/usuarios";
import {
  listarPerguntas,
  buscarPerguntaPorId,
  perguntasParaResultados,
  criarPergunta,
  atualizarPergunta,
  alternarAtivaPergunta,
} from "../services/perguntas";
import {
  validarNovaCapacitacao,
  validarEdicaoCapacitacao,
  validarNovoCriador,
  validarNovaPergunta,
  validarEdicaoPergunta,
} from "../utils/validation";
import { isUniqueConstraintError } from "../services/codigo";
import { tipoTemInstrutor } from "../data/tipos";
import {
  paginaListaCapacitacoes,
  paginaNovaCapacitacao,
  paginaVerCapacitacao,
  paginaEditarCapacitacao,
  paginaResultados,
  paginaPainel,
  paginaListaCriadores,
  paginaNovoCriador,
  paginaListaPerguntas,
  paginaNovaPergunta,
  paginaEditarPergunta,
} from "../views/admin";

export const adminRoutes = new Hono<{ Bindings: Env }>();

adminRoutes.use("*", exigirAdmin);

adminRoutes.get("/capacitacoes", async (c) => {
  const lista = await listarCapacitacoes(c.env.DB);
  return c.html(paginaListaCapacitacoes(lista));
});

adminRoutes.get("/capacitacoes/nova", (c) => c.html(paginaNovaCapacitacao()));

adminRoutes.post("/capacitacoes", async (c) => {
  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const resultado = validarNovaCapacitacao(body);

  if (!resultado.valid) {
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(paginaNovaCapacitacao({ erros: resultado.errors, valores }), 400);
  }

  const cap = await criarCapacitacao(c.env.DB, resultado.data);
  return c.redirect(`/admin/capacitacoes/${cap.id}?criada=1`, 303);
});

adminRoutes.get("/capacitacoes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const cap = await buscarCapacitacaoPorId(c.env.DB, id);
  if (!cap) return c.notFound();

  const link = `${new URL(c.req.url).origin}/avaliar/${encodeURIComponent(cap.codigo)}`;
  const criada = c.req.query("criada") === "1";
  return c.html(paginaVerCapacitacao(cap, link, criada));
});

adminRoutes.get("/capacitacoes/:id/editar", async (c) => {
  const id = Number(c.req.param("id"));
  const cap = await buscarCapacitacaoPorId(c.env.DB, id);
  if (!cap) return c.notFound();
  return c.html(paginaEditarCapacitacao(cap));
});

adminRoutes.post("/capacitacoes/:id/editar", async (c) => {
  const id = Number(c.req.param("id"));
  const cap = await buscarCapacitacaoPorId(c.env.DB, id);
  if (!cap) return c.notFound();

  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const resultado = validarEdicaoCapacitacao(body);

  if (!resultado.valid) {
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(paginaEditarCapacitacao(cap, { erros: resultado.errors, valores }), 400);
  }

  await atualizarCapacitacao(c.env.DB, id, resultado.data);
  return c.redirect(`/admin/capacitacoes/${id}`, 303);
});

adminRoutes.post("/capacitacoes/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const novoStatus = String(body.status ?? "");
  if (novoStatus !== "ativa" && novoStatus !== "encerrada") return c.text("Status inválido.", 400);

  const cap = await alternarStatusCapacitacao(c.env.DB, id, novoStatus);
  if (!cap) return c.notFound();
  return c.redirect("/admin/capacitacoes", 303);
});

adminRoutes.get("/capacitacoes/:id/resultados", async (c) => {
  const id = Number(c.req.param("id"));
  const cap = await buscarCapacitacaoPorId(c.env.DB, id);
  if (!cap) return c.notFound();

  const [totalRespostas, respostasBrutas, todasPerguntas] = await Promise.all([
    contarRespostas(c.env.DB, id),
    buscarRespostasPorCapacitacao(c.env.DB, id),
    listarPerguntas(c.env.DB),
  ]);
  const idsComResposta = new Set(respostasBrutas.map((r) => r.pergunta_id));
  const perguntas = perguntasParaResultados(todasPerguntas, tipoTemInstrutor(cap.tipo), idsComResposta);
  const resultados = calcularResultadosPerguntas(perguntas, respostasBrutas);
  return c.html(paginaResultados(cap, totalRespostas, resultados));
});

adminRoutes.get("/painel", async (c) => {
  const filtros = {
    area: c.req.query("area") || undefined,
    tipo: c.req.query("tipo") || undefined,
    periodoInicio: c.req.query("periodo_inicio") || undefined,
    periodoFim: c.req.query("periodo_fim") || undefined,
  };
  const indicadores = await calcularIndicadoresPainel(c.env.DB, filtros);
  return c.html(paginaPainel(indicadores, filtros));
});

adminRoutes.get("/exportar/capacitacoes.csv", async (c) => {
  const csv = await exportarCapacitacoesCsv(c.env.DB);
  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="capacitacoes.csv"',
  });
});

adminRoutes.get("/exportar/avaliacoes.csv", async (c) => {
  const csv = await exportarAvaliacoesCsv(c.env.DB);
  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="avaliacoes.csv"',
  });
});

adminRoutes.get("/exportar/consolidado.csv", async (c) => {
  const csv = await exportarConsolidadoCsv(c.env.DB);
  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="consolidado.csv"',
  });
});

adminRoutes.get("/criadores", async (c) => {
  const lista = await listarCriadores(c.env.DB);
  return c.html(paginaListaCriadores(lista));
});

adminRoutes.get("/criadores/novo", (c) => c.html(paginaNovoCriador()));

adminRoutes.post("/criadores", async (c) => {
  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const resultado = validarNovoCriador(body);

  if (!resultado.valid) {
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(paginaNovoCriador({ erros: resultado.errors, valores }), 400);
  }

  try {
    await criarCriador(c.env.DB, resultado.data.nome, resultado.data.email, resultado.data.senha);
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
      return c.html(paginaNovoCriador({ erros: ["Já existe uma conta com esse e-mail."], valores }), 400);
    }
    throw err;
  }

  return c.redirect("/admin/criadores", 303);
});

adminRoutes.post("/criadores/:id/excluir", async (c) => {
  const id = Number(c.req.param("id"));
  await excluirCriador(c.env.DB, id);
  return c.redirect("/admin/criadores", 303);
});

adminRoutes.get("/perguntas", async (c) => {
  const perguntas = await listarPerguntas(c.env.DB);
  return c.html(paginaListaPerguntas(perguntas));
});

adminRoutes.get("/perguntas/nova", (c) => c.html(paginaNovaPergunta()));

adminRoutes.post("/perguntas", async (c) => {
  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const resultado = validarNovaPergunta(body);

  if (!resultado.valid) {
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(paginaNovaPergunta({ erros: resultado.errors, valores }), 400);
  }

  await criarPergunta(c.env.DB, resultado.data);
  return c.redirect("/admin/perguntas", 303);
});

adminRoutes.get("/perguntas/:id/editar", async (c) => {
  const id = Number(c.req.param("id"));
  const pergunta = await buscarPerguntaPorId(c.env.DB, id);
  if (!pergunta) return c.notFound();
  return c.html(paginaEditarPergunta(pergunta));
});

adminRoutes.post("/perguntas/:id/editar", async (c) => {
  const id = Number(c.req.param("id"));
  const pergunta = await buscarPerguntaPorId(c.env.DB, id);
  if (!pergunta) return c.notFound();

  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const resultado = validarEdicaoPergunta(body);

  if (!resultado.valid) {
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(paginaEditarPergunta(pergunta, { erros: resultado.errors, valores }), 400);
  }

  await atualizarPergunta(c.env.DB, id, resultado.data);
  return c.redirect("/admin/perguntas", 303);
});

adminRoutes.post("/perguntas/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const body = (await c.req.parseBody()) as Record<string, unknown>;
  await alternarAtivaPergunta(c.env.DB, id, String(body.ativa) === "1");
  return c.redirect("/admin/perguntas", 303);
});
