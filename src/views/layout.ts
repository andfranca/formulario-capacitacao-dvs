type Nav = "admin" | "criador";

interface LayoutOptions {
  title: string;
  body: string;
  nav?: Nav;
  scripts?: string[];
}

export function layout({ title, body, nav, scripts = [] }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Capacitações DVS</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body class="${nav ? "admin" : ""}">
${nav === "admin" ? adminNav() : ""}
${nav === "criador" ? criadorNav() : ""}
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
      <a href="/admin/perguntas">Perguntas</a>
      <a href="/admin/painel">Painel</a>
      <a href="/admin/criadores">Criadores de Curso</a>
      <form method="post" action="/logout" class="logout-form"><button type="submit" class="link-button">Sair</button></form>
    </nav>
  </div>
</header>`;
}

function criadorNav(): string {
  return `<header class="admin-header">
  <div class="container admin-header-inner">
    <a class="brand" href="/criador/capacitacoes">Capacitações DVS · Criador de Curso</a>
    <nav>
      <a href="/criador/capacitacoes">Meus cursos</a>
      <a href="/criador/capacitacoes/nova">Novo curso</a>
      <form method="post" action="/criador/logout" class="logout-form"><button type="submit" class="link-button">Sair</button></form>
    </nav>
  </div>
</header>`;
}
