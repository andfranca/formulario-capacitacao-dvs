interface LayoutOptions {
  title: string;
  body: string;
  admin?: boolean;
  scripts?: string[];
}

export function layout({ title, body, admin = false, scripts = [] }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Capacitações DVS</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body class="${admin ? "admin" : ""}">
${admin ? adminNav() : ""}
<main class="container">
${body}
</main>
${scripts.map((s) => `<script src="${s}"></script>`).join("\n")}
</body>
</html>`;
}

function adminNav(): string {
  return `<header class="admin-header">
  <div class="container admin-header-inner">
    <a class="brand" href="/admin/capacitacoes">Capacitações DVS · Administração</a>
    <nav>
      <a href="/admin/capacitacoes">Capacitações</a>
      <a href="/admin/painel">Painel</a>
      <form method="post" action="/logout" class="logout-form"><button type="submit" class="link-button">Sair</button></form>
    </nav>
  </div>
</header>`;
}
