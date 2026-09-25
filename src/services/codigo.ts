// Lógica pura de geração do código da capacitação (SIGLA-DDMMAA[-N]),
// separada do acesso ao D1 para facilitar testes (seção 30/34 da especificação).

export function formatarDataCodigo(data: Date): string {
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const aa = String(data.getFullYear()).slice(-2);
  return `${dd}${mm}${aa}`;
}

export function gerarCodigoCandidato(sigla: string, data: Date, tentativa: number): string {
  const base = `${sigla}-${formatarDataCodigo(data)}`;
  return tentativa <= 1 ? base : `${base}-${tentativa}`;
}

export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}
