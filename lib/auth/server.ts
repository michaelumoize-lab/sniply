import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});

export async function getAuthenticatedUser() {
  const { data: session, error } = await auth.getSession();
  if (error || !session?.user?.id) {
    return null;
  }
  return session.user;
}
