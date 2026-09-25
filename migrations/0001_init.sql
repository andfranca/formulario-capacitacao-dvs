-- Capacitações promovidas pela DVS
CREATE TABLE capacitacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  area TEXT NOT NULL,
  tipo TEXT NOT NULL,
  instrutor TEXT NULL,
  data_inicio TEXT NOT NULL,
  data_fim TEXT NOT NULL,
  numero_participantes INTEGER NULL,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Avaliações preenchidas pelos participantes
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
  q1 INTEGER NOT NULL CHECK (q1 BETWEEN 1 AND 10),
  q2 INTEGER NOT NULL CHECK (q2 BETWEEN 1 AND 10),
  q3 INTEGER NOT NULL CHECK (q3 BETWEEN 1 AND 10),
  q4 INTEGER NOT NULL CHECK (q4 BETWEEN 1 AND 10),
  q5 INTEGER NULL CHECK (q5 IS NULL OR q5 BETWEEN 1 AND 10),
  tempo TEXT NOT NULL CHECK (tempo IN ('insuficiente', 'adequado', 'longo')),
  comentario TEXT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_avaliacoes_capacitacao_id ON avaliacoes(capacitacao_id);
