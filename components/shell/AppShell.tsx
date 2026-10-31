"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { DATA_BACKEND, bindCloudRepository } from "@/lib/data";
import { useAppStore } from "@/lib/store/useAppStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { LoginScreen } from "../auth/LoginScreen";
import { ConfirmProvider } from "../ui/ConfirmProvider";
import { XIcon } from "../ui/icons";
import { Toaster } from "../ui/Toaster";
import { CloudMigration } from "./CloudMigration";
import { Header } from "./Header";
import { NavTabs } from "./NavTabs";

const CLOUD = DATA_BACKEND === "supabase";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      {CLOUD ? (
        <CloudGate>
          <AppFrame>{children}</AppFrame>
        </CloudGate>
      ) : (
        <AppFrame>{children}</AppFrame>
      )}
      <Toaster />
    </ConfirmProvider>
  );
}

/** Cloud mode only: shows the app to a signed-in user, the login screen otherwise. */
function CloudGate({ children }: { children: ReactNode }) {
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);

  useEffect(() => (isSupabaseConfigured ? init() : undefined), [init]);

  useEffect(() => {
    if (status === "signed-out") {
      bindCloudRepository(null);
      useAppStore.getState().reset();
    }
  }, [status]);

  if (!isSupabaseConfigured) return <ConfigError />;
  if (status === "checking") return <Splash />;
  if (status === "signed-out") return <LoginScreen />;
  return <>{children}</>;
}

function AppFrame({ children }: { children: ReactNode }) {
  const ready = useAppStore((s) => s.ready);
  const loadError = useAppStore((s) => s.loadError);
  const hydrate = useAppStore((s) => s.hydrate);
  const refresh = useAppStore((s) => s.refresh);
  const saveError = useAppStore((s) => s.saveError);
  const dismissSaveError = useAppStore((s) => s.dismissSaveError);
  const userId = useAuth((s) => s.userId);

  useEffect(() => {
    if (CLOUD) {
      if (!userId) return;
      bindCloudRepository(userId);
    }
    void hydrate();
  }, [userId, hydrate]);

  // Cloud data can change from another device: reload after the tab has been away for a while.
  useEffect(() => {
    if (!CLOUD) return;
    let hiddenAt: number | null = null;
    const onChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > 30_000) void refresh();
      hiddenAt = null;
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [refresh]);

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-6 sm:pt-8">
        <Header />
        <NavTabs />
        <main className="mt-7">
          {ready ? children : loadError ? <LoadErrorState message={loadError} onRetry={() => void hydrate()} /> : <LoadingState />}
        </main>
      </div>

      {CLOUD && <CloudMigration />}

      <AnimatePresence>
        {saveError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 z-[950] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-crimson/40 bg-[#1a0b0e] p-4 text-sm text-rose-100 shadow-2xl"
          >
            <span className="flex-1">{saveError}</span>
            <button onClick={dismissSaveError} aria-label="Cerrar aviso" className="text-rose-200/70 hover:text-white">
              <XIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-56 animate-pulse bg-surface/60" />
      ))}
    </div>
  );
}

function LoadErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const signOut = useAuth((s) => s.signOut);
  return (
    <div role="alert" className="card mx-auto max-w-md space-y-4 p-6 text-center">
      <p className="label !text-rose-300">No se pudo cargar</p>
      <p className="text-sm leading-relaxed text-soft">{message}</p>
      <div className="flex justify-center gap-2">
        <button className="btn btn-light" onClick={onRetry}>
          Reintentar
        </button>
        {CLOUD && (
          <button className="btn btn-ghost" onClick={() => void signOut()}>
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy="true" aria-label="Cargando">
      <span className="h-2 w-2 animate-pulse rounded-full bg-gold shadow-[0_0_18px_rgb(251_191_36/0.7)]" />
    </div>
  );
}

function ConfigError() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div role="alert" className="card max-w-md space-y-3 p-6">
        <p className="label !text-rose-300">Falta configurar Supabase</p>
        <p className="text-sm leading-relaxed text-soft">
          La app está en modo nube pero faltan las variables <code className="font-mono text-gold-soft">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="font-mono text-gold-soft">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>. Añádelas en tu hosting y vuelve a desplegar.
        </p>
      </div>
    </div>
  );
}
