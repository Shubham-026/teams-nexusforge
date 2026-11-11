import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve user role and auth token from cookies
  const role = request.cookies.get("user_role")?.value;
  const token = request.cookies.get("auth_token")?.value;

  // 1. Strict Protection for Website CMS: Admin / CTO ONLY
  if (pathname.startsWith("/cms")) {
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/tasks";
      url.searchParams.set("access_denied", "cms_admin_only");
      return NextResponse.redirect(url);
    }
  }

  // 2. Strict Protection for Team Management: Admin / CTO ONLY
  if (pathname.startsWith("/team")) {
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/tasks";
      url.searchParams.set("access_denied", "team_admin_only");
      return NextResponse.redirect(url);
    }
  }

  // 3. Strict Protection for CRM / Leads: Sales Manager, Lead Manager, CEO, Admin ONLY
  if (pathname.startsWith("/crm")) {
    const allowed = role === "admin" || role === "ceo" || role === "sales_manager" || role === "lead_manager";
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/tasks";
      url.searchParams.set("access_denied", "crm_sales_only");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/cms/:path*",
    "/team/:path*",
    "/crm/:path*",
  ],
};

