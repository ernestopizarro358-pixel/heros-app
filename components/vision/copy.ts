import type { VisionKind } from "@/lib/data/types";

/** All Portal / Antiportal wording in one place. */
export const VISION_COPY: Record<
  VisionKind,
  {
    title: string;
    other: { kind: VisionKind; label: string; href: string };
    intro: string;
    boardHint: string;
    beliefsLabel: string;
    beliefsPlaceholder: string;
    textLabel: string;
    textPlaceholder: string;
    slidePlaceholders: Record<string, string>;
  }
> = {
  portal: {
    title: "Portal",
    other: { kind: "antiportal", label: "Ir al Antiportal", href: "/antiportal" },
    intro:
      "Un día de tu vida dentro de un año, si haces todo bien. Escríbelo en primera persona y en presente, como si ya estuvieras ahí.",
    boardHint: "Imágenes de la vida que vas a construir.",
    beliefsLabel: "10 creencias clave",
    beliefsPlaceholder: "1… 2… 3…",
    textLabel: "Texto del Portal",
    textPlaceholder:
      "Amanece en… Escribe el día completo: qué ves al abrir los ojos, qué haces, con quién estás, cómo te sientes.",
    slidePlaceholders: {
      yo: "Cómo me veo y cómo soy dentro de un año. Mi cuerpo, cómo camino, cómo hablo, qué siento al mirarme…",
      ella: "Cómo es ella y cómo es nuestra relación. Dónde estamos, qué hacemos juntos, cómo me mira…",
      dinero: "Mi negocio y mis finanzas. Cuánto facturo, cómo trabajo, quién está en mi equipo, qué me permito…",
      panas: "Mis amistades. Con quién comparto, qué hacemos, cómo nos exigimos y nos admiramos…",
      hobbies: "Mis hobbies: leer, cantar, ajedrez, arte… Cómo los vivo y qué siento al hacerlos.",
      templo: "Mi espacio: mi casa, mi habitación. Qué hay, cómo se siente entrar, por qué ahora sí me representa…",
    },
  },
  antiportal: {
    title: "Antiportal",
    other: { kind: "portal", label: "Ir al Portal", href: "/portal" },
    intro:
      "Un día de tu vida dentro de un año si sigues tomando las mismas malas decisiones de hoy. Escríbelo sin suavizarlo: es dolor a propósito.",
    boardHint: "Imágenes del futuro que te espera si nada cambia.",
    beliefsLabel: "10 creencias que me hunden",
    beliefsPlaceholder: "1… 2… 3…",
    textLabel: "Texto del Antiportal",
    textPlaceholder:
      "Me despierto tarde otra vez… Escribe el día completo si sigues igual: cómo te ves, qué evitas, qué te dices a ti mismo.",
    slidePlaceholders: {
      yo: "Cómo me veo dentro de un año si sigo igual. Mi cuerpo, mi energía, cómo me siento al mirarme al espejo…",
      ella: "Cómo me va en el amor si no cambio nada. Lo que no me atreví a hacer, lo que perdí…",
      dinero: "Mi dinero y mi 'empresa' si sigo postergando. Cuánto tengo, de quién dependo…",
      panas: "Mis amistades si sigo escondiéndome. Quién sigue, quién se fue, de qué hablamos…",
      hobbies: "Lo que hago con mi tiempo libre si nada cambia. Las horas que se van sin darme cuenta…",
      templo: "Mi espacio dentro de un año si sigo igual. El mismo cuarto, el mismo desorden, la misma sensación…",
    },
  },
};

export const GENERIC_SLIDE_PLACEHOLDER = "Escribe esta slide en primera persona y en presente…";
