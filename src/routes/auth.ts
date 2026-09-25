import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";
import { criarCookieSessao, sessaoValida, senhaCorreta, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "../services/auth";
import { paginaLogin } from "../views/admin";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get("/login", (c) => c.html(paginaLogin()));

authRoutes.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const senha = typeof body.senha === "string" ? body.senha : "";

  if (!senhaCorreta(senha, c.env.ADMIN_PASSWORD)) {
    return c.html(paginaLogin("Senha incorreta."), 401);
  }

  const cookieValue = await criarCookieSessao(c.env.SESSION_SECRET, { role: "admin" });
  setCookie(c, SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
  return c.redirect("/admin/capacitacoes", 303);
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.redirect("/login", 303);
});

export const exigirAdmin: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const cookieValue = getCookie(c, SESSION_COOKIE_NAME);
  const sessao = await sessaoValida(c.env.SESSION_SECRET, cookieValue);
  if (!sessao || sessao.role !== "admin") {
    return c.redirect("/login", 303);
  }
  await next();
};
