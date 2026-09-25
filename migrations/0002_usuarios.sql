-- Contas de Criador de Curso (o Admin continua sendo a senha única via secret,
-- não entra nesta tabela). O Admin cria e exclui essas contas.
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  senha_salt TEXT NOT NULL,
  senha_iteracoes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- Registra quem cadastrou cada capacitação. NULL = cadastrada pelo Admin ou por
-- um Criador de Curso que já foi excluído (o histórico da capacitação permanece).
ALTER TABLE capacitacoes ADD COLUMN criado_por INTEGER NULL REFERENCES usuarios(id);
