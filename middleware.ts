// middleware.ts
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // URL solicitada
  const { pathname } = req.nextUrl

  // Permite pasar /login, /api/auth, 
  // y archivos estáticos (_next/static, etc.)
  // ajusta según tus necesidades
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next()
  }

  // Obtén el token, si existe
  // (Si definiste un NEXTAUTH_SECRET en tus env)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Si no hay token => redirige a /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Si sí hay token => sigue
  return NextResponse.next()
}

// Aplica el matcher en todas las rutas, excepto las que ya permitimos
export const config = {
  // 
  matcher: ["/((?!.*\\..*|_next/static).*)"],
}
