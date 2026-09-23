import { createMiddleware } from "@tanstack/react-start";
import { getDeskToken } from "@/lib/desk-session";

/**
 * Attaches whether this request holds the single desk session.
 * The token rides sessionStorage in the preview iframe and an httpOnly cookie
 * everywhere else. A Grok sign-in does not count.
 */
export const deskGate = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    return next({ sendContext: { deskToken: getDeskToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { isDeskSignedIn } = await import("@/lib/desk-auth.server");
    assertSameSiteRequest();
    const deskSignedIn = await isDeskSignedIn(context.deskToken);
    return next({ context: { deskSignedIn, deskToken: context.deskToken } });
  });
