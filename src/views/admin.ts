import { layout } from "./layout";
import { escapeHtml } from "../utils/html";
import { AREAS, nomeArea } from "../data/areas";
import { TIPOS_CAPACITACAO, labelTipo } from "../data/tipos";
import { taxaResposta, formatarPercentual, formatarNumero } from "../utils/stats";
import type { CapacitacaoRecord, CapacitacaoComContagem } from "../services/capacitacoes";
import type { CriadorComContagem } from "../services/usuarios";
import type { ResultadoPergunta } from "../services/resultados";
import type { Pergunta } from "../services/perguntas";

function opcaoSelecionada(valor: string | undefined, alvo: string): string {
  return valor === alvo ? "selected" : "";
}

function listaErros(erros: string[]): string {
  if (erros.length === 0) return "";
  return `<section class="card erro"><ul>${erros.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></section>`;
}

export function paginaLogin(erro?: string): string {
  return layout({
    title: "Login administrativo",
    body: `
      <section class="card login-card">
        <h1>Acesso administrativo</h1>
        ${erro ? `<p class="erro-texto">${escapeHtml(erro)}</p>` : ""}
        <form method="post" action="/login">
          <div class="campo">
            <label for="senha">Senha</label>
            <input type="password" id="senha" name="senha" required autofocus>
          </div>
          <button type="submit" class="button">Entrar</button>
        </form>
      </section>`,
  });
}

export function paginaListaCapacitacoes(lista: CapacitacaoComContagem[]): string {
  const linhas = lista
    .map((c) => {
      const taxa = formatarPercentual(taxaResposta(c.respostas, c.numero_participantes));
      return `<tr>
        <td>${escapeHtml(c.codigo)}</td>
        <td>${escapeHtml(c.titulo)}</td>
        <td>${escapeHtml(c.area)}</td>
        <td>${escapeHtml(labelTipo(c.tipo))}</td>
        <td>${escapeHtml(c.data_inicio)} – ${escapeHtml(c.data_fim)}</td>
        <td><span class="badge badge-${c.status}">${c.status === "ativa" ? "Ativa" : "Encerrada"}</span></td>
        <td>${c.numero_participantes ?? "-"}</td>
        <td>${c.respostas}</td>
        <td>${taxa}</td>
        <td>${escapeHtml(c.criado_por_nome ?? "Admin")}</td>
        <td class="acoes">
          <a href="/admin/capacitacoes/${c.id}">Ver</a>
          <a href="/admin/capacitacoes/${c.id}/editar">Editar</a>
          <a href="/admin/capacitacoes/${c.id}/resultados">Resultados</a>
          <form method="post" action="/admin/capacitacoes/${c.id}/status" class="inline-form">
            <input type="hidden" name="status" value="${c.status === "ativa" ? "encerrada" : "ativa"}">
            <button type="submit" class="link-button">${c.status === "ativa" ? "Encerrar" : "Reabrir"}</button>
          </form>
        </td>
      </tr>`;
    })
    .join("");

  return layout({
    title: "Capacitações",
    nav: "admin",
    body: `
      <div class="page-header">
        <h1>Capacitações</h1>
        <a class="button" href="/admin/capacitacoes/nova">Nova capacitação</a>
      </div>
      <div class="exportar">
        <a href="/admin/exportar/capacitacoes.csv">Exportar capacitações (CSV)</a> ·
        <a href="/admin/exportar/avaliacoes.csv">Exportar avaliações (CSV)</a> ·
        <a href="/admin/exportar/consolidado.csv">Exportar base consolidada (CSV)</a>
      </div>
      <section class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Título</th><th>Área</th><th>Tipo</th><th>Data</th>
              <th>Status</th><th>Participantes</th><th>Respostas</th><th>Taxa de resposta</th><th>Criado por</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>${linhas || `<tr><td colspan="11">Nenhuma capacitação cadastrada.</td></tr>`}</tbody>
        </table>
      </section>`,
  });
}

interface FormularioNovaCapacitacao {
  erros?: string[];
  valores?: Record<string, string>;
}

export function paginaNovaCapacitacao({ erros = [], valores = {} }: FormularioNovaCapacitacao = {}): string {
  const opcoesArea = AREAS.map((a) => `<option value="${a.sigla}" ${opcaoSelecionada(valores.area, a.sigla)}>${escapeHtml(a.nome)}</option>`).join("");
  const opcoesTipo = TIPOS_CAPACITACAO.map(
    (t) => `<option value="${t.codigo}" data-tem-instrutor="${t.temInstrutor}" ${opcaoSelecionada(valores.tipo, t.codigo)}>${escapeHtml(t.label)}</option>`,
  ).join("");

  return layout({
    title: "Nova capacitação",
    nav: "admin",
    body: `
      <h1>Cadastro de Capacitação</h1>
      ${listaErros(erros)}
      <form method="post" action="/admin/capacitacoes" class="card">
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

export function paginaVerCapacitacao(cap: CapacitacaoRecord, link: string, criada = false): string {
  return layout({
    title: `Capacitação ${cap.codigo}`,
    nav: "admin",
    body: `
      <h1>${escapeHtml(cap.titulo)}</h1>
      ${criada ? `<section class="card sucesso"><p>Capacitação registrada com sucesso.</p></section>` : ""}
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
          <a class="button secondary" href="/admin/capacitacoes/${cap.id}/editar">Editar</a>
          <a class="button secondary" href="/admin/capacitacoes/${cap.id}/resultados">Resultados</a>
        </div>
      </section>`,
    scripts: ["/js/form.js"],
  });
}

export function paginaEditarCapacitacao(cap: CapacitacaoRecord, { erros = [], valores = {} }: FormularioNovaCapacitacao = {}): string {
  const opcoesTipo = TIPOS_CAPACITACAO.map(
    (t) =>
      `<option value="${t.codigo}" data-tem-instrutor="${t.temInstrutor}" ${opcaoSelecionada(valores.tipo ?? cap.tipo, t.codigo)}>${escapeHtml(t.label)}</option>`,
  ).join("");

  const v = {
    titulo: valores.titulo ?? cap.titulo,
    tipo: valores.tipo ?? cap.tipo,
    instrutor: valores.instrutor ?? cap.instrutor ?? "",
    data_inicio: valores.data_inicio ?? cap.data_inicio,
    data_fim: valores.data_fim ?? cap.data_fim,
    numero_participantes: valores.numero_participantes ?? (cap.numero_participantes?.toString() ?? ""),
    status: valores.status ?? cap.status,
  };

  return layout({
    title: `Editar ${cap.codigo}`,
    nav: "admin",
    body: `
      <h1>Editar capacitação ${escapeHtml(cap.codigo)}</h1>
      ${listaErros(erros)}
      <form method="post" action="/admin/capacitacoes/${cap.id}/editar" class="card">
        <div class="campo">
          <label>Área responsável</label>
          <input type="text" value="${escapeHtml(nomeArea(cap.area))}" disabled>
          <p class="ajuda">A área não pode ser alterada. Cadastre uma nova capacitação se necessário.</p>
        </div>
        <div class="campo">
          <label for="titulo">Título da capacitação</label>
          <input type="text" id="titulo" name="titulo" maxlength="200" required value="${escapeHtml(v.titulo)}">
        </div>
        <div class="campo">
          <label for="tipo">Tipo de capacitação</label>
          <select id="tipo" name="tipo" data-tipo-capacitacao required>
            ${opcoesTipo}
          </select>
        </div>
        <div class="campo" data-campo-instrutor>
          <label for="instrutor">Instrutor ou tutor</label>
          <input type="text" id="instrutor" name="instrutor" maxlength="150" value="${escapeHtml(v.instrutor)}">
        </div>
        <div class="campo">
          <label for="data_inicio">Data inicial</label>
          <input type="date" id="data_inicio" name="data_inicio" required value="${escapeHtml(v.data_inicio)}">
        </div>
        <div class="campo">
          <label for="data_fim">Data final</label>
          <input type="date" id="data_fim" name="data_fim" required value="${escapeHtml(v.data_fim)}">
        </div>
        <div class="campo">
          <label for="numero_participantes">Número de participantes</label>
          <input type="number" id="numero_participantes" name="numero_participantes" min="0" step="1" value="${escapeHtml(v.numero_participantes)}">
        </div>
        <div class="campo">
          <label for="status">Status</label>
          <select id="status" name="status" required>
            <option value="ativa" ${opcaoSelecionada(v.status, "ativa")}>Ativa</option>
            <option value="encerrada" ${opcaoSelecionada(v.status, "encerrada")}>Encerrada</option>
          </select>
        </div>
        <button type="submit" class="button">Salvar</button>
      </form>`,
    scripts: ["/js/form.js"],
  });
}

function barrasDistribuicao(dist: { nota: number; quantidade: number }[]): string {
  const maximo = Math.max(1, ...dist.map((d) => d.quantidade));
  return `<div class="distribuicao">
    ${dist
      .map(
        (d) => `<div class="distribuicao-barra">
          <div class="barra" style="height:${Math.round((d.quantidade / maximo) * 100)}%"></div>
          <span class="distribuicao-label">${d.nota}</span>
          <span class="distribuicao-qtd">${d.quantidade}</span>
        </div>`,
      )
      .join("")}
  </div>`;
}

function blocoResultadoPergunta(resultado: ResultadoPergunta): string {
  const titulo = escapeHtml(resultado.pergunta.texto);

  switch (resultado.tipo) {
    case "escala_1_10":
      return `<div class="questao-resultado">
        <h3>${titulo}</h3>
        <p>${resultado.totalRespostas} respostas · Média: ${formatarNumero(resultado.media)} · Mediana: ${formatarNumero(resultado.mediana)}</p>
        ${barrasDistribuicao(resultado.distribuicao)}
      </div>`;

    case "sim_nao":
    case "multipla_escolha":
      return `<div class="questao-resultado">
        <h3>${titulo}</h3>
        <p>${resultado.totalRespostas} respostas</p>
        <table>
          <thead><tr><th>Opção</th><th>Quantidade</th><th>Percentual</th></tr></thead>
          <tbody>
            ${resultado.opcoes.map((o) => `<tr><td>${escapeHtml(o.label)}</td><td>${o.quantidade}</td><td>${o.percentual}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>`;

    case "texto_livre":
      return `<div class="questao-resultado">
        <h3>${titulo}</h3>
        ${
          resultado.textos.length === 0
            ? "<p>Nenhuma resposta registrada.</p>"
            : `<ul class="comentarios">${resultado.textos.map((t) => `<li><strong>${escapeHtml(t.nome)}:</strong> ${escapeHtml(t.texto)}</li>`).join("")}</ul>`
        }
      </div>`;
  }
}

export function paginaResultados(cap: CapacitacaoRecord, totalRespostas: number, resultados: ResultadoPergunta[]): string {
  const taxa = formatarPercentual(taxaResposta(totalRespostas, cap.numero_participantes));

  return layout({
    title: `Resultados ${cap.codigo}`,
    nav: "admin",
    body: `
      <h1>Resultados: ${escapeHtml(cap.titulo)}</h1>
      <section class="card">
        <dl class="details">
          <dt>Código</dt><dd>${escapeHtml(cap.codigo)}</dd>
          <dt>Área</dt><dd>${escapeHtml(nomeArea(cap.area))}</dd>
          <dt>Tipo</dt><dd>${escapeHtml(labelTipo(cap.tipo))}</dd>
          <dt>Participantes</dt><dd>${cap.numero_participantes ?? "Não informado"}</dd>
          <dt>Respostas</dt><dd>${totalRespostas}</dd>
          <dt>Taxa de resposta</dt><dd>${taxa}</dd>
        </dl>
      </section>

      <section class="card">
        <h2>Perguntas de avaliação</h2>
        ${resultados.map(blocoResultadoPergunta).join("")}
      </section>`,
  });
}

export interface IndicadoresPainel {
  totalCapacitacoes: number;
  capacitacoesComResposta: number;
  totalParticipantes: number;
  totalRespostas: number;
  taxaGeral: string;
  porArea: { area: string; respostas: number; participantes: number; taxa: string }[];
  porCapacitacao: { codigo: string; titulo: string; taxa: string }[];
  evolucao: { periodo: string; respostas: number }[];
}

export function paginaPainel(indicadores: IndicadoresPainel, filtros: { area?: string; tipo?: string; periodoInicio?: string; periodoFim?: string }): string {
  const opcoesArea = AREAS.map((a) => `<option value="${a.sigla}" ${opcaoSelecionada(filtros.area, a.sigla)}>${escapeHtml(a.nome)}</option>`).join("");
  const opcoesTipo = TIPOS_CAPACITACAO.map((t) => `<option value="${t.codigo}" ${opcaoSelecionada(filtros.tipo, t.codigo)}>${escapeHtml(t.label)}</option>`).join("");

  return layout({
    title: "Painel",
    nav: "admin",
    body: `
      <h1>Painel</h1>

      <form method="get" class="card filtros">
        <div class="campo">
          <label for="area">Área</label>
          <select id="area" name="area">
            <option value="">Todas</option>
            ${opcoesArea}
          </select>
        </div>
        <div class="campo">
          <label for="tipo">Tipo</label>
          <select id="tipo" name="tipo">
            <option value="">Todos</option>
            ${opcoesTipo}
          </select>
        </div>
        <div class="campo">
          <label for="periodo_inicio">De</label>
          <input type="date" id="periodo_inicio" name="periodo_inicio" value="${escapeHtml(filtros.periodoInicio ?? "")}">
        </div>
        <div class="campo">
          <label for="periodo_fim">Até</label>
          <input type="date" id="periodo_fim" name="periodo_fim" value="${escapeHtml(filtros.periodoFim ?? "")}">
        </div>
        <button type="submit" class="button">Filtrar</button>
      </form>

      <section class="cards-indicadores">
        <div class="card indicador"><span class="valor">${indicadores.totalCapacitacoes}</span><span class="rotulo">Capacitações cadastradas</span></div>
        <div class="card indicador"><span class="valor">${indicadores.capacitacoesComResposta}</span><span class="rotulo">Capacitações com ao menos 1 resposta</span></div>
        <div class="card indicador"><span class="valor">${indicadores.totalParticipantes}</span><span class="rotulo">Participantes (informados)</span></div>
        <div class="card indicador"><span class="valor">${indicadores.totalRespostas}</span><span class="rotulo">Respostas registradas</span></div>
        <div class="card indicador"><span class="valor">${indicadores.taxaGeral}</span><span class="rotulo">Taxa geral de resposta</span></div>
      </section>
      <p class="ajuda">A taxa geral considera apenas capacitações com número de participantes informado.</p>

      <section class="card">
        <h2>Taxa de resposta por área</h2>
        <table>
          <thead><tr><th>Área</th><th>Participantes</th><th>Respostas</th><th>Taxa</th></tr></thead>
          <tbody>
            ${indicadores.porArea.map((a) => `<tr><td>${escapeHtml(a.area)}</td><td>${a.participantes}</td><td>${a.respostas}</td><td>${a.taxa}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Taxa de resposta por capacitação</h2>
        <table>
          <thead><tr><th>Código</th><th>Título</th><th>Taxa</th></tr></thead>
          <tbody>
            ${indicadores.porCapacitacao.map((c) => `<tr><td>${escapeHtml(c.codigo)}</td><td>${escapeHtml(c.titulo)}</td><td>${c.taxa}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Evolução da taxa de resposta ao longo do tempo</h2>
        <table>
          <thead><tr><th>Mês</th><th>Respostas</th></tr></thead>
          <tbody>
            ${indicadores.evolucao.map((e) => `<tr><td>${escapeHtml(e.periodo)}</td><td>${e.respostas}</td></tr>`).join("")}
          </tbody>
        </table>
      </section>`,
  });
}

export function paginaListaCriadores(lista: CriadorComContagem[]): string {
  const linhas = lista
    .map(
      (u) => `<tr>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${u.capacitacoes_criadas}</td>
        <td class="acoes">
          <form method="post" action="/admin/criadores/${u.id}/excluir" class="inline-form" data-confirmar="Excluir a conta de ${escapeHtml(u.nome)}? As capacitações já cadastradas por ela permanecem no sistema.">
            <button type="submit" class="link-button">Excluir</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  return layout({
    title: "Criadores de Curso",
    nav: "admin",
    body: `
      <div class="page-header">
        <h1>Criadores de Curso</h1>
        <a class="button" href="/admin/criadores/novo">Novo Criador de Curso</a>
      </div>
      <section class="card table-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Cursos cadastrados</th><th>Ações</th></tr>
          </thead>
          <tbody>${linhas || `<tr><td colspan="4">Nenhum Criador de Curso cadastrado.</td></tr>`}</tbody>
        </table>
      </section>`,
    scripts: ["/js/form.js"],
  });
}

interface FormularioNovoCriador {
  erros?: string[];
  valores?: Record<string, string>;
}

export function paginaNovoCriador({ erros = [], valores = {} }: FormularioNovoCriador = {}): string {
  return layout({
    title: "Novo Criador de Curso",
    nav: "admin",
    body: `
      <h1>Novo Criador de Curso</h1>
      ${listaErros(erros)}
      <form method="post" action="/admin/criadores" class="card">
        <div class="campo">
          <label for="nome">Nome</label>
          <input type="text" id="nome" name="nome" maxlength="150" required value="${escapeHtml(valores.nome ?? "")}">
        </div>
        <div class="campo">
          <label for="email">E-mail (será o login)</label>
          <input type="email" id="email" name="email" maxlength="254" required value="${escapeHtml(valores.email ?? "")}">
        </div>
        <div class="campo">
          <label for="senha">Senha inicial</label>
          <input type="password" id="senha" name="senha" minlength="8" required>
          <p class="ajuda">Mínimo de 8 caracteres. Repasse essa senha ao Criador de Curso — não há tela de recuperação nesta versão.</p>
        </div>
        <button type="submit" class="button">Criar conta</button>
      </form>`,
  });
}

const LABEL_TIPO_PERGUNTA: Record<string, string> = {
  escala_1_10: "Escala 1 a 10",
  sim_nao: "Sim/Não",
  multipla_escolha: "Múltipla escolha",
  texto_livre: "Texto livre",
};

export function paginaListaPerguntas(perguntas: Pergunta[]): string {
  const linhas = perguntas
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.texto)}</td>
        <td>${escapeHtml(LABEL_TIPO_PERGUNTA[p.tipo] ?? p.tipo)}</td>
        <td>${p.obrigatoria ? "Sim" : "Não"}</td>
        <td>${p.somenteComInstrutor ? "Sim" : "Não"}</td>
        <td><span class="badge badge-${p.ativa ? "ativa" : "encerrada"}">${p.ativa ? "Ativa" : "Inativa"}</span></td>
        <td class="acoes">
          <a href="/admin/perguntas/${p.id}/editar">Editar</a>
          <form method="post" action="/admin/perguntas/${p.id}/status" class="inline-form">
            <input type="hidden" name="ativa" value="${p.ativa ? "0" : "1"}">
            <button type="submit" class="link-button">${p.ativa ? "Desativar" : "Reativar"}</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  return layout({
    title: "Perguntas do formulário",
    nav: "admin",
    body: `
      <div class="page-header">
        <h1>Perguntas do formulário de avaliação</h1>
        <a class="button" href="/admin/perguntas/nova">Nova pergunta</a>
      </div>
      <p class="ajuda">Este é o template único usado por todos os cursos. Perguntas desativadas somem dos
      formulários novos, mas as respostas já registradas continuam disponíveis nos resultados.</p>
      <section class="card table-wrap">
        <table>
          <thead>
            <tr><th>Pergunta</th><th>Tipo</th><th>Obrigatória</th><th>Somente c/ instrutor</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>${linhas || `<tr><td colspan="6">Nenhuma pergunta cadastrada.</td></tr>`}</tbody>
        </table>
      </section>`,
  });
}

interface FormularioPergunta {
  erros?: string[];
  valores?: Record<string, string>;
}

export function paginaNovaPergunta({ erros = [], valores = {} }: FormularioPergunta = {}): string {
  return layout({
    title: "Nova pergunta",
    nav: "admin",
    body: `
      <h1>Nova pergunta</h1>
      ${listaErros(erros)}
      <form method="post" action="/admin/perguntas" class="card">
        <div class="campo">
          <label for="texto">Texto da pergunta</label>
          <textarea id="texto" name="texto" maxlength="500" rows="2" required>${escapeHtml(valores.texto ?? "")}</textarea>
        </div>
        <div class="campo">
          <label for="tipo">Tipo de resposta</label>
          <select id="tipo" name="tipo" data-tipo-pergunta required>
            <option value="">Selecione...</option>
            <option value="escala_1_10" ${opcaoSelecionada(valores.tipo, "escala_1_10")}>Escala de 1 a 10</option>
            <option value="sim_nao" ${opcaoSelecionada(valores.tipo, "sim_nao")}>Sim/Não</option>
            <option value="multipla_escolha" ${opcaoSelecionada(valores.tipo, "multipla_escolha")}>Múltipla escolha</option>
            <option value="texto_livre" ${opcaoSelecionada(valores.tipo, "texto_livre")}>Texto livre</option>
          </select>
        </div>
        <div class="campo" data-campo-opcoes-pergunta>
          <label for="opcoes">Opções (uma por linha)</label>
          <textarea id="opcoes" name="opcoes" rows="4">${escapeHtml(valores.opcoes ?? "")}</textarea>
          <p class="ajuda">Depois de criada, as opções não podem mais ser editadas. Para mudar as opções, desative esta pergunta e crie uma nova.</p>
        </div>
        <div class="campo">
          <label><input type="checkbox" name="obrigatoria" ${valores.obrigatoria === undefined || valores.obrigatoria === "on" ? "checked" : ""}> Resposta obrigatória</label>
        </div>
        <div class="campo">
          <label><input type="checkbox" name="somente_com_instrutor" ${valores.somente_com_instrutor === "on" ? "checked" : ""}> Perguntar somente quando a capacitação tiver instrutor/tutor</label>
        </div>
        <button type="submit" class="button">Cadastrar</button>
      </form>`,
    scripts: ["/js/form.js"],
  });
}

export function paginaEditarPergunta(pergunta: Pergunta, { erros = [], valores = {} }: FormularioPergunta = {}): string {
  const v = {
    texto: valores.texto ?? pergunta.texto,
    obrigatoria: valores.obrigatoria ?? (pergunta.obrigatoria ? "on" : ""),
    somente_com_instrutor: valores.somente_com_instrutor ?? (pergunta.somenteComInstrutor ? "on" : ""),
  };

  return layout({
    title: "Editar pergunta",
    nav: "admin",
    body: `
      <h1>Editar pergunta</h1>
      ${listaErros(erros)}
      <form method="post" action="/admin/perguntas/${pergunta.id}/editar" class="card">
        <div class="campo">
          <label>Tipo de resposta</label>
          <input type="text" value="${escapeHtml(LABEL_TIPO_PERGUNTA[pergunta.tipo] ?? pergunta.tipo)}" disabled>
          <p class="ajuda">O tipo não pode ser alterado depois de criada.</p>
        </div>
        ${
          pergunta.tipo === "multipla_escolha"
            ? `<div class="campo">
                <label>Opções</label>
                <p>${pergunta.opcoes.map((o) => escapeHtml(o.texto)).join(", ")}</p>
              </div>`
            : ""
        }
        <div class="campo">
          <label for="texto">Texto da pergunta</label>
          <textarea id="texto" name="texto" maxlength="500" rows="2" required>${escapeHtml(v.texto)}</textarea>
        </div>
        <div class="campo">
          <label><input type="checkbox" name="obrigatoria" ${v.obrigatoria === "on" ? "checked" : ""}> Resposta obrigatória</label>
        </div>
        <div class="campo">
          <label><input type="checkbox" name="somente_com_instrutor" ${v.somente_com_instrutor === "on" ? "checked" : ""}> Perguntar somente quando a capacitação tiver instrutor/tutor</label>
        </div>
        <button type="submit" class="button">Salvar</button>
      </form>`,
  });
}
