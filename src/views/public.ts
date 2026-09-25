import { layout } from "./layout";
import { escapeHtml } from "../utils/html";
import { nomeArea } from "../data/areas";
import { labelTipo } from "../data/tipos";
import { MUNICIPIOS_RS } from "../data/municipios-rs";
import { CRS_LIST } from "../data/crs";
import type { CapacitacaoRecord } from "../services/capacitacoes";

export function paginaInicial(): string {
  return layout({
    title: "Início",
    body: `
      <section class="card">
        <h1>Capacitações DVS</h1>
        <p>Sistema de cadastro, avaliação e acompanhamento das capacitações promovidas pela
        Divisão de Vigilância Sanitária (DVS/CEVS/SES-RS).</p>
        <p>Se você recebeu um link ou QR Code para avaliar uma capacitação, utilize-o diretamente.</p>
        <div class="actions">
          <a class="button" href="/login">Acesso administrativo</a>
          <a class="button secondary" href="/criador/login">Acesso do Criador de Curso</a>
        </div>
      </section>`,
  });
}

export function paginaNaoEncontrada(): string {
  return layout({
    title: "Não encontrada",
    body: `
      <section class="card">
        <h1>Página não encontrada</h1>
        <p>O link acessado não corresponde a nenhuma capacitação cadastrada.</p>
      </section>`,
  });
}

export function paginaEncerrada(): string {
  return layout({
    title: "Avaliação encerrada",
    body: `
      <section class="card">
        <h1>Esta avaliação foi encerrada</h1>
        <p>A capacitação relacionada a este link não está mais recebendo respostas.</p>
      </section>`,
  });
}

export function paginaConfirmacaoResposta(): string {
  return layout({
    title: "Obrigado",
    body: `
      <section class="card">
        <h1>Obrigado pela sua participação</h1>
        <p>Sua avaliação foi registrada com sucesso.</p>
      </section>`,
  });
}

interface DadosFormularioAvaliacao {
  cap: CapacitacaoRecord;
  q5Aplicavel: boolean;
  turnstileSiteKey: string;
  erros?: string[];
  valores?: Record<string, string>;
}

function opcaoSelecionada(valor: string | undefined, alvo: string): string {
  return valor === alvo ? "selected" : "";
}

function marcado(valor: string | undefined, alvo: string): string {
  return valor === alvo ? "checked" : "";
}

function escalaNotas(nome: string, valorAtual: string | undefined): string {
  const opcoes = Array.from({ length: 10 }, (_, i) => i + 1)
    .map(
      (n) => `<label class="escala-opcao">
        <input type="radio" name="${nome}" value="${n}" ${marcado(valorAtual, String(n))} required>
        <span>${n}</span>
      </label>`,
    )
    .join("");
  return `<div class="escala">${opcoes}</div>`;
}

export function paginaAvaliacao({ cap, q5Aplicavel, turnstileSiteKey, erros = [], valores = {} }: DadosFormularioAvaliacao): string {
  const opcoesMunicipio = MUNICIPIOS_RS.map(
    (m) => `<option value="${escapeHtml(m)}" ${opcaoSelecionada(valores.municipio, m)}>${escapeHtml(m)}</option>`,
  ).join("");
  const opcoesCrs = CRS_LIST.map(
    (c) => `<option value="${escapeHtml(c)}" ${opcaoSelecionada(valores.crs, c)}>${escapeHtml(c)}</option>`,
  ).join("");

  const tipoServidorMunicipal = valores.tipo_servidor !== "estadual";

  return layout({
    title: "Avaliação",
    body: `
      <section class="card">
        <h1>Avaliação sobre capacitação promovida pela DVS</h1>
        <p class="subtitulo">A sua contribuição é muito importante para a nossa melhoria contínua!</p>
        <p>Considerando que o Sistema de Gestão da Qualidade implantado na Divisão de Vigilância Sanitária
        (DVS/CEVS) tem entre seus princípios o engajamento de pessoas e a melhoria contínua, este formulário
        foi elaborado para apoiar o aprimoramento das capacitações com base nas respostas dos participantes.</p>
        <p>A resposta é voluntária, porém incentivada, pois contribui para a reflexão sobre o alcance dos
        objetivos da capacitação.</p>
        <p>O Grupo de Gestão da Qualidade (GGQ) avaliará as respostas recebidas e poderá compartilhar
        informações pertinentes com os responsáveis pelas capacitações visando possíveis melhorias.</p>
      </section>

      <section class="card">
        <dl class="details">
          <dt>Capacitação</dt><dd>${escapeHtml(cap.titulo)}</dd>
          <dt>Área responsável</dt><dd>${escapeHtml(nomeArea(cap.area))}</dd>
          <dt>Tipo</dt><dd>${escapeHtml(labelTipo(cap.tipo))}</dd>
          ${cap.instrutor ? `<dt>Instrutor/tutor</dt><dd>${escapeHtml(cap.instrutor)}</dd>` : ""}
          <dt>Data inicial</dt><dd>${escapeHtml(cap.data_inicio)}</dd>
          <dt>Data final</dt><dd>${escapeHtml(cap.data_fim)}</dd>
        </dl>
      </section>

      ${erros.length > 0 ? `<section class="card erro"><ul>${erros.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></section>` : ""}

      <form method="post" class="card">
        <h2>Identificação</h2>
        <div class="campo">
          <label for="nome">Nome (opcional)</label>
          <input type="text" id="nome" name="nome" maxlength="150" value="${escapeHtml(valores.nome ?? "")}">
        </div>
        <div class="campo">
          <label for="email">E-mail (opcional)</label>
          <input type="email" id="email" name="email" maxlength="254" value="${escapeHtml(valores.email ?? "")}">
        </div>

        <fieldset class="campo">
          <legend>Tipo de servidor</legend>
          <label><input type="radio" name="tipo_servidor" value="municipal" data-tipo-servidor ${tipoServidorMunicipal ? "checked" : ""} required> Municipal</label>
          <label><input type="radio" name="tipo_servidor" value="estadual" data-tipo-servidor ${!tipoServidorMunicipal ? "checked" : ""}> Estadual</label>
        </fieldset>

        <div class="campo" data-campo-municipal>
          <label for="municipio">Município</label>
          <select id="municipio" name="municipio">
            <option value="">Selecione...</option>
            ${opcoesMunicipio}
          </select>
        </div>

        <div class="campo" data-campo-estadual>
          <label for="crs">CRS</label>
          <select id="crs" name="crs">
            <option value="">Selecione...</option>
            ${opcoesCrs}
          </select>
        </div>

        <div class="campo">
          <label for="formacao">Formação</label>
          <select id="formacao" name="formacao" data-formacao required>
            <option value="">Selecione...</option>
            <option value="ensino_medio" ${opcaoSelecionada(valores.formacao, "ensino_medio")}>Ensino médio</option>
            <option value="tecnico" ${opcaoSelecionada(valores.formacao, "tecnico")}>Técnico</option>
            <option value="superior" ${opcaoSelecionada(valores.formacao, "superior")}>Superior</option>
          </select>
        </div>

        <div class="campo" data-campo-curso>
          <label for="curso">Informe o nome do curso</label>
          <input type="text" id="curso" name="curso" maxlength="200" value="${escapeHtml(valores.curso ?? "")}">
        </div>

        <h2>Avaliação</h2>
        <p>Marque sua percepção pessoal nas escalas abaixo: 1 (nem um pouco) a 10 (absolutamente).</p>

        <div class="campo">
          <label>Q1. Compreendi a importância do que foi abordado na capacitação para o trabalho na VISA.</label>
          ${escalaNotas("q1", valores.q1)}
        </div>
        <div class="campo">
          <label>Q2. O conteúdo preparado foi adequado? (Abrangeu os pontos relevantes na profundidade adequada.)</label>
          ${escalaNotas("q2", valores.q2)}
        </div>
        <div class="campo">
          <label>Q3. Compreendi como executar na prática profissional.</label>
          ${escalaNotas("q3", valores.q3)}
        </div>
        <div class="campo">
          <label>Q4. As estratégias de ensino utilizadas na capacitação facilitaram o aprendizado.</label>
          ${escalaNotas("q4", valores.q4)}
        </div>
        ${
          q5Aplicavel
            ? `<div class="campo">
                <label>Q5. O instrutor ou tutor foi solícito.</label>
                ${escalaNotas("q5", valores.q5)}
              </div>`
            : ""
        }

        <div class="campo">
          <fieldset>
            <legend>O tempo destinado à capacitação foi:</legend>
            <label><input type="radio" name="tempo" value="insuficiente" ${marcado(valores.tempo, "insuficiente")} required> Insuficiente</label>
            <label><input type="radio" name="tempo" value="adequado" ${marcado(valores.tempo, "adequado")}> Adequado</label>
            <label><input type="radio" name="tempo" value="longo" ${marcado(valores.tempo, "longo")}> Longo</label>
          </fieldset>
        </div>

        <div class="campo">
          <label for="comentario">Caso desejar, deixe comentários complementares.</label>
          <textarea id="comentario" name="comentario" maxlength="2000" rows="4">${escapeHtml(valores.comentario ?? "")}</textarea>
        </div>

        <div class="campo cf-turnstile" data-sitekey="${escapeHtml(turnstileSiteKey)}"></div>

        <button type="submit" class="button">Enviar avaliação</button>
      </form>`,
    scripts: ["https://challenges.cloudflare.com/turnstile/v0/api.js", "/js/form.js"],
  });
}
