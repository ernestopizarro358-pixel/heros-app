"use client";

import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { getSupabase } from "../supabase/client";

/**
 * Session state for the cloud backend. Components never see Supabase Auth
 * directly: they read `status` / `userId` and call the actions below, which
 * resolve to a Spanish error message (or `null` on success).
 */

type Status = "checking" | "signed-out" | "signed-in";

interface AuthState {
  status: Status;
  userId: string | null;
  email: string | null;
  /** Starts listening to the session. Returns the cleanup function. */
  init(): () => void;
  signIn(email: string, password: string): Promise<string | null>;
  /** `notice` is set when the account needs e-mail confirmation before it can sign in. */
  signUp(email: string, password: string): Promise<{ error: string | null; notice: string | null }>;
  signOut(): Promise<void>;
}

export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de entrar: te enviamos un enlace.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ese correo ya tiene una cuenta. Entra con tu contraseña.";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled") || m.includes("signups are disabled")) {
    return "El registro de cuentas nuevas está desactivado.";
  }
  if (m.includes("password should be at least") || m.includes("weak password")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (m.includes("failed to fetch") || m.includes("network")) return "No hay conexión con el servidor. Revisa tu internet.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Ese correo no parece válido.";
  return `No se pudo completar la acción: ${message}`;
}

export const useAuth = create<AuthState>()((set) => {
  const apply = (session: Session | null) => {
    const userId = session?.user.id ?? null;
    const email = session?.user.email ?? null;
    // Token refreshes fire the listener too: only react when who is signed in changes.
    set((s) =>
      s.status !== "checking" && s.userId === userId && s.email === email
        ? s
        : { status: userId ? "signed-in" : "signed-out", userId, email },
    );
  };

  return {
    status: "checking",
    userId: null,
    email: null,

    init() {
      const { data } = getSupabase().auth.onAuthStateChange((_event, session) => apply(session));
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      return error ? friendlyAuthError(error.message) : null;
    },

    async signUp(email, password) {
      const { data, error } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return { error: friendlyAuthError(error.message), notice: null };
      // No session yet = Supabase is waiting for the user to confirm the e-mail.
      return {
        error: null,
        notice: data.session ? null : "Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego entra aquí.",
      };
    },

    async signOut() {
      await getSupabase().auth.signOut();
    },
  };
});
