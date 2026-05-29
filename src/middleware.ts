import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isApi = req.nextUrl.pathname.startsWith("/api")

  if (isApi || isAuthPage) return

  if (!isLoggedIn) {
    return Response.redirect(new URL("/auth/signin", req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
