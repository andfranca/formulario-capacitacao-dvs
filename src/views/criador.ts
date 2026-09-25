import { layout } from "./layout";
import { escapeHtml } from "../utils/html";
import { AREAS, nomeArea } from "../data/areas";
import { TIPOS_CAPACITACAO, labelTipo } from "../data/tipos";
import type { CapacitacaoRecord, CapacitacaoComContagem } from "../services/capacitacoes";

function opcaoSelecionada(valor: string | undefined, alvo: string): string {
  return valor === alvo ? "selected" : "";
}

function listaErros(erros: string[]): string {
  if (erros.length === 0) return "";
  return `<section class="card erro"><ul>${erros.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></section>`;
}

export function paginaLoginCriador(erro?: string): string {
  return layout({
    title: "Login do Criador de Curso",
    body: `
      <section class="card login-card">
        <h1>Acesso do Criador de Curso</h1>
        ${erro ? `<p class="erro-texto">${escapeHtml(erro)}</p>` : ""}
        <form method="post" action="/criador/login">
          <div class="campo">
            <label for="email">E-mail</label>
            <input type="email" id="email" name="email" required autofocus>
          </div>
          <div class="campo">
            <label for="senha">Senha</label>
            <input type="password" id="senha" name="senha" required>
          </div>
          <button type="submit" class="button">Entrar</button>
        </form>
      </section>`,
  });
}

export function paginaListaCapacitacoesCriador(lista: CapacitacaoComContagem[]): string {
  const linhas = lista
    .map(
      (c) => `<tr>
        <td>${escapeHtml(c.codigo)}</td>
        <td>${escapeHtml(c.titulo)}</td>
        <td>${escapeHtml(labelTipo(c.tipo))}</td>
        <td>${escapeHtml(c.data_inicio)} – ${escapeHtml(c.data_fim)}</td>
        <td><span class="badge badge-${c.status}">${c.status === "ativa" ? "Ativa" : "Encerrada"}</span></td>
        <td><a href="/criador/capacitacoes/${c.id}">Ver link e QR Code</a></td>
      </tr>`,
    )
    .join("");

  return layout({
    title: "Meus cursos",
    nav: "criador",
    body: `
      <div class="page-header">
        <h1>Meus cursos</h1>
        <a class="button" href="/criador/capacitacoes/nova">Novo curso</a>
      </div>
      <section class="card table-wrap">
        <table>
          <thead>
            <tr><th>Código</th><th>Título</th><th>Tipo</th><th>Data</th><th>Status</th><th>Avaliação</th></tr>
          </thead>
          <tbody>${linhas || `<tr><td colspan="6">Você ainda não cadastrou nenhum curso.</td></tr>`}</tbody>
        </table>
      </section>`,
  });
}

interface FormularioNovaCapacitacao {
  erros?: string[];
  valores?: Record<string, string>;
}

export function paginaNovaCapacitacaoCriador({ erros = [], valores = {} }: FormularioNovaCapacitacao = {}): string {
  const opcoesArea = AREAS.map((a) => `<option value="${a.sigla}" ${opcaoSelecionada(valores.area, a.sigla)}>${escapeHtml(a.nome)}</option>`).join("");
  const opcoesTipo = TIPOS_CAPACITACAO.map(
    (t) => `<option value="${t.codigo}" data-tem-instrutor="${t.temInstrutor}" ${opcaoSelecionada(valores.tipo, t.codigo)}>${escapeHtml(t.label)}</option>`,
  ).join("");

  return layout({
    title: "Novo curso",
    nav: "criador",
    body: `
      <h1>Cadastro de Capacitação</h1>
      ${listaErros(erros)}
      <form method="post" action="/criador/capacitacoes" class="card">
        <div class="campo">
          <label for="titulo">Título da capacitação</label>
          <input type="text" id="titulo" name="titulo" maxlength="200" required value="${escapeHtml(valores.titulo ?? "")}">
        </div>
        <div class="campo">
          <label for="area">Área responsável</label>
          <select id="area" name="area" required>
            <option value="">Selecione...</option>
            ${opcoesArea}
          </select>
          <p class="ajuda">Não é possível alterar a área depois de criar a capacitação.</p>
        </div>
        <div class="campo">
          <label for="tipo">Tipo de capacitação</label>
          <select id="tipo" name="tipo" data-tipo-capacitacao required>
            <option value="">Selecione...</option>
            ${opcoesTipo}
          </select>
        </div>
        <div class="campo" data-campo-instrutor>
          <label for="instrutor">Instrutor ou tutor</label>
          <input type="text" id="instrutor" name="instrutor" maxlength="150" value="${escapeHtml(valores.instrutor ?? "")}">
        </div>
        <div class="campo">
          <label for="data_inicio">Data inicial</label>
          <input type="date" id="data_inicio" name="data_inicio" required value="${escapeHtml(valores.data_inicio ?? "")}">
        </div>
        <div class="campo">
          <label for="data_fim">Data final</label>
          <input type="date" id="data_fim" name="data_fim" required value="${escapeHtml(valores.data_fim ?? "")}">
          <p class="ajuda">Data de encerramento das aulas, ministração ou atividade prática.</p>
        </div>
        <div class="campo">
          <label for="numero_participantes">Número de participantes (opcional)</label>
          <input type="number" id="numero_participantes" name="numero_participantes" min="0" step="1" value="${escapeHtml(valores.numero_participantes ?? "")}">
        </div>
        <button type="submit" class="button">Cadastrar</button>
      </form>`,
    scripts: ["/js/form.js"],
  });
}

export function paginaVerCapacitacaoCriador(cap: CapacitacaoRecord, link: string, criada = false): string {
  return layout({
    title: `Curso ${cap.codigo}`,
    nav: "criador",
    body: `
      <h1>${escapeHtml(cap.titulo)}</h1>
      ${criada ? `<section class="card sucesso"><p>Curso registrado com sucesso.</p></section>` : ""}
      <section class="card">
        <dl class="details">
          <dt>Código</dt><dd>${escapeHtml(cap.codigo)}</dd>
          <dt>Área</dt><dd>${escapeHtml(nomeArea(cap.area))}</dd>
          <dt>Tipo</dt><dd>${escapeHtml(labelTipo(cap.tipo))}</dd>
          ${cap.instrutor ? `<dt>Instrutor/tutor</dt><dd>${escapeHtml(cap.instrutor)}</dd>` : ""}
          <dt>Data inicial</dt><dd>${escapeHtml(cap.data_inicio)}</dd>
          <dt>Data final</dt><dd>${escapeHtml(cap.data_fim)}</dd>
          <dt>Participantes</dt><dd>${cap.numero_participantes ?? "Não informado"}</dd>
          <dt>Status</dt><dd><span class="badge badge-${cap.status}">${cap.status === "ativa" ? "Ativa" : "Encerrada"}</span></dd>
          <dt>Link para avaliação</dt><dd><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></dd>
        </dl>
        <div class="qr-box">
          <img src="/qr/${encodeURIComponent(cap.codigo)}" alt="QR Code da avaliação" width="200" height="200">
        </div>
        <div class="actions">
          <button type="button" class="button" data-copy-link="${escapeHtml(link)}">Copiar link</button>
          <a class="button" href="/qr/${encodeURIComponent(cap.codigo)}" download="qr-${encodeURIComponent(cap.codigo)}.svg">Baixar QR Code</a>
        </div>
        <p class="ajuda">Para editar dados, encerrar o curso ou ver os resultados das avaliações, entre em contato com a administração.</p>
      </section>`,
    scripts: ["/js/form.js"],
  });
}
