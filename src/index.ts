import { Hono } from "hono";
import type { Env } from "./env";
import { publicRoutes } from "./routes/public";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { criadorRoutes } from "./routes/criador";
import { layout } from "./views/layout";

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  console.error(err);
  return c.html(
    layout({
      title: "Erro",
      body: `<section class="card erro">
        <h1>Ocorreu um erro inesperado</h1>
        <p>Tente novamente em instantes. Se o problema persistir, entre em contato com o GGQ.</p>
      </section>`,
    }),
    500,
  );
});

app.notFound((c) =>
  c.html(
    layout({
      title: "Não encontrada",
      body: `<section class="card">
        <h1>Página não encontrada</h1>
        <p>O endereço acessado não existe.</p>
      </section>`,
    }),
    404,
  ),
);

app.route("/", publicRoutes);
app.route("/", authRoutes);
app.route("/admin", adminRoutes);
app.route("/criador", criadorRoutes);

export default app;
