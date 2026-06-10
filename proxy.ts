import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Portón beta: borrar este archivo el día del launch y el sitio queda abierto.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esPublico =
    pathname.startsWith("/acceso") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    /\.(svg|png|jpg|jpeg|webp|gif|ico|txt|xml|woff2?)$/.test(pathname);

  if (esPublico) return NextResponse.next();

  if (request.cookies.get("tlacuilo_beta")?.value === "ok") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/acceso";
  url.search = "";
  return NextResponse.redirect(url);
}
