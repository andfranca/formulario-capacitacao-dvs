-- Perguntas do formulário deixam de ser fixas no código e passam a ser um
-- template único, compartilhado por todos os cursos, editável pelo Admin.
-- Substitui as colunas q1-q5/tempo/comentario de "avaliacoes" (usadas só em
-- testes até agora) por um modelo genérico de perguntas + respostas.

DROP TABLE avaliacoes;

CREATE TABLE avaliacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capacitacao_id INTEGER NOT NULL REFERENCES capacitacoes(id),
  nome TEXT NULL,
  email TEXT NULL,
  tipo_servidor TEXT NOT NULL CHECK (tipo_servidor IN ('municipal', 'estadual')),
  municipio TEXT NULL,
  crs TEXT NULL,
  formacao TEXT NOT NULL CHECK (formacao IN ('ensino_medio', 'tecnico', 'superior')),
  curso TEXT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_avaliacoes_capacitacao_id ON avaliacoes(capacitacao_id);

CREATE TABLE perguntas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('escala_1_10', 'sim_nao', 'multipla_escolha', 'texto_livre')),
  obrigatoria INTEGER NOT NULL DEFAULT 1,
  somente_com_instrutor INTEGER NOT NULL DEFAULT 0,
  ativa INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Opções de perguntas do tipo "multipla_escolha". Ficam fixas após a criação
-- da pergunta (não há edição de opções nesta versão): o próprio id da opção é
-- o valor armazenado em respostas.valor, garantindo que respostas antigas não
-- percam o sentido caso o texto da opção seja levemente reformulado depois.
CREATE TABLE pergunta_opcoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pergunta_id INTEGER NOT NULL REFERENCES perguntas(id),
  texto TEXT NOT NULL,
  ordem INTEGER NOT NULL
);
CREATE INDEX idx_pergunta_opcoes_pergunta_id ON pergunta_opcoes(pergunta_id);

CREATE TABLE respostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(id),
  pergunta_id INTEGER NOT NULL REFERENCES perguntas(id),
  valor TEXT NOT NULL
);
CREATE INDEX idx_respostas_avaliacao_id ON respostas(avaliacao_id);
CREATE INDEX idx_respostas_pergunta_id ON respostas(pergunta_id);

-- Perguntas padrão, equivalentes às antigas Q1-Q5 + tempo + comentário.
INSERT INTO perguntas (texto, tipo, obrigatoria, somente_com_instrutor, ativa, ordem, created_at, updated_at) VALUES
  ('Compreendi a importância do que foi abordado na capacitação para o trabalho na VISA.', 'escala_1_10', 1, 0, 1, 1, datetime('now'), datetime('now')),
  ('O conteúdo preparado foi adequado? (Abrangeu os pontos relevantes na profundidade adequada.)', 'escala_1_10', 1, 0, 1, 2, datetime('now'), datetime('now')),
  ('Compreendi como executar na prática profissional.', 'escala_1_10', 1, 0, 1, 3, datetime('now'), datetime('now')),
  ('As estratégias de ensino utilizadas na capacitação facilitaram o aprendizado.', 'escala_1_10', 1, 0, 1, 4, datetime('now'), datetime('now')),
  ('O instrutor ou tutor foi solícito.', 'escala_1_10', 1, 1, 1, 5, datetime('now'), datetime('now')),
  ('O tempo destinado à capacitação foi:', 'multipla_escolha', 1, 0, 1, 6, datetime('now'), datetime('now')),
  ('Caso desejar, deixe comentários complementares.', 'texto_livre', 0, 0, 1, 7, datetime('now'), datetime('now'));

INSERT INTO pergunta_opcoes (pergunta_id, texto, ordem)
SELECT id, 'Insuficiente', 1 FROM perguntas WHERE ordem = 6;
INSERT INTO pergunta_opcoes (pergunta_id, texto, ordem)
SELECT id, 'Adequado', 2 FROM perguntas WHERE ordem = 6;
INSERT INTO pergunta_opcoes (pergunta_id, texto, ordem)
SELECT id, 'Longo', 3 FROM perguntas WHERE ordem = 6;
