"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { credentialsMatch, safeNextPath, sessionCookieName, sessionMaxAge, sessionToken } from "@/lib/auth";

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/"));
  if (!credentialsMatch(username, password)) {
    redirect(`/login?error=${encodeURIComponent("Username or password is wrong.")}&next=${encodeURIComponent(next)}`);
  }

  const jar = await cookies();
  jar.set(sessionCookieName, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge,
  });
  redirect(next);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(sessionCookieName);
  redirect("/login");
}
