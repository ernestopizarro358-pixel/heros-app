"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { describeContent, hasUserContent } from "@/lib/data/content";
import { readLocalSnapshot } from "@/lib/data/local/localRepository";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToast";
import { useConfirm } from "../ui/ConfirmProvider";

/**
 * First sign-in on a browser that already has local data while the account is
 * still empty: offers to upload it once. The answer is remembered per account.
 */
export function CloudMigration() {
  const ready = useAppStore((s) => s.ready);
  const userId = useAuth((s) => s.userId);
  const confirm = useConfirm();
  const asked = useRef(false);

  useEffect(() => {
    if (!ready || !userId || asked.current) return;
    const flag = `heroes-app:cloud-import:${userId}`;
    try {
      if (window.localStorage.getItem(flag)) return;
    } catch {
      return;
    }

    const local = readLocalSnapshot();
    const cloud = useAppStore.getState().exportData();
    if (!local || !hasUserContent(local) || hasUserContent(cloud)) return;

    asked.current = true;
    void (async () => {
      const upload = await confirm({
        title: "¿Subir tus datos a tu cuenta?",
        message: `Encontré datos guardados en este navegador (${describeContent(local)}) y tu cuenta aún está vacía. Si los subes, los tendrás en todos tus dispositivos.`,
        confirmLabel: "Subir mis datos",
        cancelLabel: "Empezar de cero",
      });
      try {
        window.localStorage.setItem(flag, upload ? "uploaded" : "skipped");
      } catch {
        /* the question may be asked again next time */
      }
      if (!upload) return;
      try {
        await useAppStore.getState().importData(local);
        toast("Tus datos ya están en tu cuenta ✓", "success");
      } catch (error) {
        console.error(error);
        try {
          window.localStorage.removeItem(flag);
        } catch {
          /* ignore */
        }
        toast("No se pudieron subir tus datos. Se intentará de nuevo la próxima vez.", "error", 7000);
      }
    })();
  }, [ready, userId, confirm]);

  return null;
}
