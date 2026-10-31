import { createLocalRepository } from "./local/localRepository";
import type { DataRepository } from "./repository";
import { createSupabaseRepository } from "./supabase/supabaseRepository";
import { getSupabase } from "../supabase/client";

/**
 * "local"    → localStorage in this browser (default, no account needed).
 * "supabase" → Postgres on Supabase, behind a login. Set with NEXT_PUBLIC_DATA_BACKEND.
 */
export type DataBackend = "local" | "supabase";
export const DATA_BACKEND: DataBackend = process.env.NEXT_PUBLIC_DATA_BACKEND === "supabase" ? "supabase" : "local";

let repository: DataRepository | null = null;

/** Single entry point to persistence. Components only reach it through the store. */
export function getRepository(): DataRepository {
  if (!repository) {
    if (DATA_BACKEND === "supabase") throw new Error("Inicia sesión para cargar tus datos.");
    repository = createLocalRepository();
  }
  return repository;
}

let boundUserId: string | null = null;

/** Cloud mode: binds the repository to the signed-in user (or releases it on sign-out). Idempotent. */
export function bindCloudRepository(userId: string | null): void {
  if (userId === boundUserId && (userId === null || repository)) return;
  boundUserId = userId;
  repository = userId ? createSupabaseRepository(getSupabase(), userId) : null;
}

export type * from "./types";
export type * from "./repository";
