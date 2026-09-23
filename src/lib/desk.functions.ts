import { createServerFn } from "@tanstack/react-start";
import { deskGate } from "@/lib/desk-middleware";

export type DeskStatus = { configured: boolean; signedIn: boolean };

function cleanEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 120);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const getDeskStatus = createServerFn({ method: "GET" })
  .middleware([deskGate])
  .handler(async ({ context }): Promise<DeskStatus> => {
    const { deskStatus } = await import("@/lib/desk-auth.server");
    return deskStatus(context.deskToken);
  });

export const createDeskAdmin = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => {
    const email = cleanEmail(input.email ?? "");
    const password = input.password ?? "";
    if (!isEmail(email)) throw new Error("Use a real email address.");
    if (password.length < 8) throw new Error("Use at least 8 characters.");
    if (password.length > 72) throw new Error("That password is too long.");
    return { email, password };
  })
  .handler(async ({ data }) => {
    const { createDeskAccount } = await import("@/lib/desk-auth.server");
    return createDeskAccount(data.email, data.password);
  });

export const signInDesk = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => {
    const email = cleanEmail(input.email ?? "");
    const password = input.password ?? "";
    if (!email || !password) throw new Error("Enter your email and password.");
    return { email, password: password.slice(0, 72) };
  })
  .handler(async ({ data }) => {
    const { signInDeskAccount } = await import("@/lib/desk-auth.server");
    return signInDeskAccount(data.email, data.password);
  });

export const signOutDesk = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .handler(async ({ context }) => {
    const { signOutDeskAccount } = await import("@/lib/desk-auth.server");
    await signOutDeskAccount(context.deskToken);
    return { ok: true as const };
  });
