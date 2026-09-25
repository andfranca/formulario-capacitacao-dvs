import QRCode from "qrcode";

// Gera SVG (string) — evita qualquer dependência de canvas, o que não existe no runtime de Workers.
export async function gerarQrCodeSvg(texto: string): Promise<string> {
  return QRCode.toString(texto, { type: "svg", margin: 1, width: 220 });
}
