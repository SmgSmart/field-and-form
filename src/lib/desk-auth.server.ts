import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";

const scryptAsync = promisify(scrypt);
const COOKIE = "desk_session";
const MAX_AGE = 60 * 60 * 24 * 14;

type AccountRow = {
  email: string;
  password_hash: string;
  failed_count: number | string;
  locked_until: unknown;
};

export type DeskResult<T> = { ok: true; data: T } | { ok: false; error: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  const expected = Buffer.from(hash, "base64url");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

function isFuture(value: unknown): boolean {
  if (!value) return false;
  const time = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(time) && time > Date.now();
}

function asCount(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cookieSecure(): boolean {
  try {
    const request = getRequest();
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (forwarded) return forwarded === "https";
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

function writeCookie(token: string): void {
  setCookie(COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: MAX_AGE,
  });
}

function clearCookie(): void {
  setCookie(COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: 0,
  });
}

async function openSession(): Promise<string> {
  const sql = await getSql();
  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into desk_session (token_hash, expires_at)
    values (${hashToken(token)}, now() + interval '14 days')
  `;
  writeCookie(token);
  return token;
}

export async function isDeskSignedIn(bearer?: string): Promise<boolean> {
  const token = bearer || getCookie(COOKIE) || "";
  if (!token || token.length < 20) return false;
  const sql = await getSql();
  await sql`delete from desk_session where expires_at <= now()`;
  const rows = await sql<{ ok: number }>`
    select 1 as ok from desk_session
    where token_hash = ${hashToken(token)} and expires_at > now()
  `;
  return Boolean(rows[0]);
}

export async function deskStatus(bearer?: string): Promise<{ configured: boolean; signedIn: boolean }> {
  const sql = await getSql();
  const rows = await sql<{ id: number }>`select id from desk_account where id = 1`;
  return { configured: Boolean(rows[0]), signedIn: await isDeskSignedIn(bearer) };
}

export async function createDeskAccount(email: string, password: string): Promise<DeskResult<{ token: string }>> {
  const sql = await getSql();
  const existing = await sql<{ id: number }>`select id from desk_account where id = 1`;
  if (existing[0]) return { ok: false, error: "An admin login already exists. Sign in with it." };
  const passwordHash = await hashPassword(password);
  const inserted = await sql<{ id: number }>`
    insert into desk_account (id, email, password_hash)
    select 1, ${email}, ${passwordHash}
    where not exists (select 1 from desk_account where id = 1)
    returning id
  `;
  if (!inserted[0]) return { ok: false, error: "An admin login already exists. Sign in with it." };
  const token = await openSession();
  return { ok: true, data: { token } };
}

export async function signInDeskAccount(email: string, password: string): Promise<DeskResult<{ token: string }>> {
  const sql = await getSql();
  const rows = await sql<AccountRow>`
    select email, password_hash, failed_count, locked_until
    from desk_account where id = 1
  `;
  const account = rows[0];
  if (!account) return { ok: false, error: "Create your admin login first." };
  if (isFuture(account.locked_until)) {
    return { ok: false, error: "Too many tries. Wait 15 minutes, then try again." };
  }
  const match = email === account.email && (await verifyPassword(password, account.password_hash));
  if (!match) {
    const next = asCount(account.failed_count) + 1;
    if (next >= 8) {
      await sql`
        update desk_account
        set failed_count = 0, locked_until = now() + interval '15 minutes'
        where id = 1
      `;
    } else {
      await sql`update desk_account set failed_count = ${next} where id = 1`;
    }
    return { ok: false, error: "That email or password is not right." };
  }
  await sql`update desk_account set failed_count = 0, locked_until = null where id = 1`;
  const token = await openSession();
  return { ok: true, data: { token } };
}

export async function signOutDeskAccount(bearer?: string): Promise<void> {
  const sql = await getSql();
  const cookie = getCookie(COOKIE) || "";
  const tokens = [bearer, cookie].filter((token): token is string => Boolean(token && token.length >= 20));
  for (const token of tokens) {
    await sql`delete from desk_session where token_hash = ${hashToken(token)}`;
  }
  clearCookie();
}
