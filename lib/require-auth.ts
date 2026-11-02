import { getCurrentUser, type SessionData } from "./auth";

/** Throws a Response if no valid session. Returns user data otherwise. */
export async function requireAuth(): Promise<SessionData> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
