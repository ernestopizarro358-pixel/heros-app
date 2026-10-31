"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";

/** Private access screen shown when the cloud backend is on and nobody is signed in. */
export function LoginScreen() {
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "in") {
        setError(await signIn(email, password));
      } else {
        const result = await signUp(email, password);
        setError(result.error);
        setNotice(result.notice);
        if (result.notice) setMode("in");
      }
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "in" ? "up" : "in");
    setError(null);
    setNotice(null);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-[#14110a] text-gold shadow-[0_0_40px_rgb(251_191_36/0.12)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M13.2 2 4.5 13.5h6.1L9.8 22l9.7-12h-6.3L13.2 2Z" />
            </svg>
          </span>
          <p className="label mt-5">Acceso privado</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink">Heroes App</h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "in" ? "Entra para ver tus hábitos, tu Portal y tus jefes." : "Crea tu cuenta para guardar todo en la nube."}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
          <label className="block">
            <span className="label">Correo</span>
            <input
              className="field mt-2"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </label>

          <label className="block">
            <span className="label">Contraseña</span>
            <input
              className="field mt-2"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "up" ? "Mínimo 6 caracteres" : "••••••••"}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-crimson/40 bg-[#1a0b0e] px-3 py-2 text-[13px] leading-snug text-rose-200">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-lg border border-mint/30 bg-[#0c1715] px-3 py-2 text-[13px] leading-snug text-mint">
              {notice}
            </p>
          )}

          <button type="submit" disabled={busy || !email || !password} className="btn btn-light w-full !py-3">
            {busy ? "Un momento…" : mode === "in" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          {mode === "in" ? "¿Primera vez aquí?" : "¿Ya tienes cuenta?"}{" "}
          <button type="button" onClick={switchMode} className="font-semibold text-soft underline-offset-4 hover:text-ink hover:underline">
            {mode === "in" ? "Crear cuenta" : "Entrar"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
