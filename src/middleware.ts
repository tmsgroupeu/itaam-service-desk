import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/api/auth')

  if (isAuthPage) return

  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.url)
    );
  }

  const role = (req.auth?.user as any)?.role

  // Enforce Employee role routing
  if (role === 'EMPLOYEE') {
    if (!req.nextUrl.pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
