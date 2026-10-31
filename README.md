# Heroes App

Mi app personal de desarrollo personal, construida sobre la **ley causal**:
*estado inicial + causas (inputs) → efecto*.

| Sección | Para qué sirve |
|---|---|
| **Hábitos** | Convertir los inputs en acciones diarias. Rachas, últimos 30 días, prioridad ⚡ y recompensas con caja de regalo. |
| **Portal** | Un día de mi vida dentro de un año si hago todo bien. Tablero, 10 creencias, slides y el texto del día. |
| **Antiportal** | El mismo día si sigo tomando las mismas malas decisiones. Es el dolor que empuja. |
| **Ley Causal** | El mapa: estado inicial → inputs → efecto. Los inputs se convierten en hábitos o en jefes. |
| **Lucha contra el Jefe** | Ingeniería inversa de creencias. Cada jefe tiene 100 HP y baja con creencias, aprendizajes y soluciones cumplidas. |

## Cómo correrla

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Para probarla en el celular dentro de la misma red Wi-Fi, usa la URL
«Network» que muestra la terminal (por ejemplo `http://192.168.0.6:3000`).

Otros comandos:

```bash
npm run build      # build de producción
npm run start      # servir el build
npm run typecheck  # comprobar tipos
```

## Dónde se guardan los datos

La app tiene dos modos, elegidos con la variable `NEXT_PUBLIC_DATA_BACKEND`:

| Valor | Qué hace |
|---|---|
| `local` (por defecto) | Guarda todo en `localStorage` del navegador. Sin cuenta ni internet. Cada navegador tiene sus propios datos. |
| `supabase` | Guarda todo en tu base de datos de Supabase detrás de un inicio de sesión. Los mismos datos en el celular y en la computadora. |

Copia `.env.example` a `.env.local` y rellena lo que necesites. Las variables `NEXT_PUBLIC_*` se
incrustan al compilar: si las cambias en Vercel, hay que volver a desplegar.

## Modo nube (Supabase)

1. **Esquema.** En Supabase → SQL Editor, ejecuta `supabase/schema.sql` (crea las tablas, los índices,
   las políticas RLS y los permisos; solo `authenticated` puede leer o escribir, y cada usuario solo ve
   sus propias filas).
2. **Variables.** `NEXT_PUBLIC_DATA_BACKEND=supabase`, `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API). La clave *publishable* es pública
   por diseño: la protección real es RLS.
3. **Tu cuenta.** Abre la app, pulsa **Crear cuenta** y regístrate con tu correo. Si Supabase tiene
   activada la confirmación por correo (lo está por defecto), abre el enlace que te llega.
4. **Cierra el registro.** Una vez creada tu cuenta, en Supabase → Authentication → Sign In / Providers
   desactiva **Allow new users to sign up**. Así nadie más puede crear cuentas con tu clave pública.
5. **Datos que ya tenías.** Si en ese navegador había datos en `localStorage` y tu cuenta está vacía, la
   app te pregunta al entrar si quieres subirlos. También puedes usar **Ajustes → Importar JSON**.

Cómo funciona por dentro: la UI nunca toca el almacenamiento directamente; todo pasa por `lib/store` →
`lib/data/repository.ts`. `lib/data/local/` y `lib/data/supabase/` implementan la misma interfaz. Las
escrituras a Supabase van en una cola (para respetar las claves foráneas) y la pantalla se actualiza al
instante (optimista). Si cambias algo desde otro dispositivo, la app recarga los datos al volver a la
pestaña tras 30 segundos fuera.

## Desplegar en Vercel

1. En Vercel: **Add New → Project**, importa este repositorio de GitHub. Vercel detecta Next.js solo.
2. En **Environment Variables** añade las tres variables del modo nube (ver arriba) para *Production*,
   *Preview* y *Development*.
3. **Deploy.**
4. En Supabase → Authentication → URL Configuration, pon tu dirección de Vercel como **Site URL** (y
   añádela a *Redirect URLs*). Sin esto, el enlace del correo de confirmación apunta a `localhost`.

> Con `NEXT_PUBLIC_DATA_BACKEND=local` los datos viven en cada navegador. Usa **Ajustes → Exportar /
> Importar JSON** (clic en tu avatar) para hacer respaldos o mover datos entre dispositivos.

## Estructura

```
app/                    rutas: /habitos /portal /antiportal /ley-causal /jefe
components/
  auth/                 pantalla de inicio de sesión
  shell/                header, pestañas, ajustes, puerta de sesión, migración local → nube
  ui/                   modal, confirmación, textarea auto-resize, autosave, toasts, iconos
  habits/               tarjeta, círculo de completar, racha, 30 días, caja de regalo, drag & drop
  vision/               Portal y Antiportal (mismos componentes, tema distinto), modo lectura, comparativa
  causal/               objetivos causales e inputs
  boss/                 arena, sprites pixel art, HP, ataques, registro, salón de derrotados
lib/
  data/                 tipos, interfaces de repositorio; local/ (localStorage) y supabase/
  auth/                 estado de sesión (Supabase Auth)
  supabase/             cliente de Supabase
  store/                store global (Zustand) con actualizaciones optimistas + toasts
  date.ts               "hoy" y fechas en America/La_Paz
  streak.ts             racha actual y más larga
  boss.ts               HP derivado de las entradas
  game.config.ts        ← valores de daño (CRE 2, APR 1, SOL 10/20/35) y sprites
  sound.ts              sonidos sintetizados con Web Audio (sin archivos)
supabase/schema.sql     tablas, índices, RLS y permisos
```

## Reglas importantes

- **Zona horaria:** el día cambia a medianoche de Bolivia (`America/La_Paz`), no en UTC.
- **Racha actual:** días seguidos cumplidos terminando hoy. Si hoy aún no está marcado, cuenta hasta ayer
  sin romperse.
- **HP de los jefes:** no se guarda; se calcula como `100 − daño de todas las entradas`. Por eso, al
  borrar una entrada el jefe recupera exactamente lo que esa entrada le quitó. Las soluciones solo hacen
  daño al cumplirse (o de forma proporcional si tienen contador).
- **Cambiar el daño:** edita `lib/game.config.ts`.
