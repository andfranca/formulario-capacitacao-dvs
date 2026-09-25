// Coordenadorias Regionais de Saúde do RS (1ª a 18ª), lista fechada.
export const CRS_LIST: string[] = Array.from({ length: 18 }, (_, i) => `${i + 1}ª CRS`);

export function isCrsValido(valor: string): boolean {
  return CRS_LIST.includes(valor);
}
