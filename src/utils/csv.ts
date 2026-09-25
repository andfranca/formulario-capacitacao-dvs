const BOM = "﻿";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[";\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Gera CSV com separador ";" (compatível com a configuração regional pt-BR do Excel)
// e BOM UTF-8, para abrir corretamente em ferramentas comuns usadas no Brasil.
export function gerarCsv(colunas: string[], linhas: Record<string, unknown>[]): string {
  const cabecalho = colunas.map(escapeCsvField).join(";");
  const corpo = linhas.map((linha) => colunas.map((coluna) => escapeCsvField(linha[coluna])).join(";"));
  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}
