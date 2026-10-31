import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { newId } from "../../id";
import { DATA_VERSION, DEFAULT_SLIDES, INSPIRATION_SLOTS, SLIDE_IMAGE_SLOTS } from "../defaults";
import { normalizeData } from "../normalize";
import type { DataRepository } from "../repository";
import type {
  AppData,
  Boss,
  BossEntry,
  CausalGoal,
  Habit,
  HabitLink,
  VisionBoard,
  VisionKind,
  VisionSlide,
} from "../types";

/**
 * Supabase implementation of `DataRepository` (tables in `supabase/schema.sql`).
 *
 * Every write goes through a single FIFO queue. The store fires persistence
 * calls without waiting for each other ("create habit", then "link it to an
 * input"), and the foreign keys need them to land in the order they were
 * issued. The queue keeps going after a failed write.
 */

type Row = Record<string, unknown>;

const PAGE_SIZE = 1000;
const CHUNK_SIZE = 400;
const KINDS: VisionKind[] = ["portal", "antiportal"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const uuidOrNull = (v: unknown): string | null => (typeof v === "string" && UUID_RE.test(v) ? v.toLowerCase() : null);

function isoOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const time = Date.parse(v);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}
const isoOrNow = (v: unknown): string => isoOrNull(v) ?? new Date().toISOString();

function check(error: PostgrestError | null, action: string): void {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function chunks<T>(items: T[], size = CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Reads a whole table page by page (the API returns at most 1000 rows per request). */
async function fetchAll(client: SupabaseClient, table: string, orderBy: string[]): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table).select("*");
    for (const column of orderBy) query = query.order(column, { ascending: true });
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    check(error, `Leer ${table}`);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

// ───────────────────────── Row ↔ domain mapping ─────────────────────────

function linkColumns(link: HabitLink | null | undefined) {
  return {
    link_kind: link?.kind ?? null,
    link_goal_id: link?.kind === "input" ? uuidOrNull(link.goalId) : null,
    link_input_id: link?.kind === "input" ? uuidOrNull(link.inputId) : null,
    link_boss_id: link?.kind === "solution" ? uuidOrNull(link.bossId) : null,
    link_entry_id: link?.kind === "solution" ? uuidOrNull(link.entryId) : null,
  };
}

function linkFromRow(row: Row): HabitLink | null {
  if (row.link_kind === "input") {
    return { kind: "input", goalId: str(row.link_goal_id), inputId: str(row.link_input_id) };
  }
  if (row.link_kind === "solution") {
    return { kind: "solution", bossId: str(row.link_boss_id), entryId: str(row.link_entry_id) };
  }
  return null;
}

const habitRow = (userId: string, habit: Habit): Row => ({
  id: habit.id,
  user_id: userId,
  name: habit.name,
  reward: habit.reward,
  priority: habit.priority,
  position: habit.position,
  ...linkColumns(habit.link),
  created_at: isoOrNow(habit.createdAt),
});

const goalRow = (userId: string, goal: CausalGoal): Row => ({
  id: goal.id,
  user_id: userId,
  effect: goal.effect,
  initial_state: goal.initialState,
  target_date: goal.targetDate,
  is_main: goal.isMain,
  created_at: isoOrNow(goal.createdAt),
});

const inputRows = (userId: string, goal: CausalGoal, withBoss = true): Row[] =>
  goal.inputs.map((input, position) => ({
    id: input.id,
    user_id: userId,
    goal_id: goal.id,
    text: input.text,
    status: input.status,
    habit_id: uuidOrNull(input.habitId),
    boss_id: withBoss ? uuidOrNull(input.bossId) : null,
    position,
  }));

const bossRow = (userId: string, boss: Boss): Row => ({
  id: boss.id,
  user_id: userId,
  number: boss.number,
  name: boss.name,
  sprite_id: boss.spriteId,
  started_at: boss.startedAt,
  defeated_at: isoOrNull(boss.defeatedAt),
  source_goal_id: uuidOrNull(boss.sourceInput?.goalId),
  source_input_id: uuidOrNull(boss.sourceInput?.inputId),
  created_at: isoOrNow(boss.createdAt),
});

function entryRow(userId: string, bossId: string, entry: BossEntry): Row {
  const solution = entry.type === "solution";
  const target = solution && entry.target && entry.target > 1 ? Math.round(entry.target) : null;
  return {
    id: entry.id,
    user_id: userId,
    boss_id: bossId,
    type: entry.type,
    text: entry.text,
    size: solution ? (entry.size ?? "small") : null,
    target,
    progress: solution ? Math.max(0, Math.round(entry.progress ?? 0)) : 0,
    completed_at: solution ? isoOrNull(entry.completedAt) : null,
    habit_id: solution ? uuidOrNull(entry.habitId) : null,
    created_at: isoOrNow(entry.createdAt),
  };
}

function entryFromRow(row: Row): BossEntry {
  const type = row.type === "learning" || row.type === "solution" ? row.type : "belief";
  const entry: BossEntry = { id: str(row.id), type, text: str(row.text), createdAt: isoOrNow(row.created_at) };
  if (type === "solution") {
    entry.size = row.size === "medium" || row.size === "large" ? row.size : "small";
    entry.target = typeof row.target === "number" ? row.target : null;
    entry.progress = num(row.progress);
    entry.completedAt = isoOrNull(row.completed_at);
    entry.habitId = strOrNull(row.habit_id);
  }
  return entry;
}

// ───────────────────────── Import hygiene ─────────────────────────

/**
 * Makes a snapshot safe to insert: ids that are not UUIDs are replaced (and
 * every reference to them follows), references to records that do not exist
 * are cleared, and the "one main goal" / "unique boss number" rules hold.
 */
function sanitize(data: AppData): AppData {
  const ids = new Map<string, string>();
  const remap = (id: string): string => {
    const valid = uuidOrNull(id);
    if (valid) return valid;
    let mapped = ids.get(id);
    if (!mapped) {
      mapped = newId();
      ids.set(id, mapped);
    }
    return mapped;
  };

  const habits = data.habits.map((h) => ({ ...h, id: remap(h.id) }));
  const goals = data.goals.map((g) => ({ ...g, id: remap(g.id), inputs: g.inputs.map((i) => ({ ...i, id: remap(i.id) })) }));
  const bosses = data.bosses.map((b) => ({ ...b, id: remap(b.id), entries: b.entries.map((e) => ({ ...e, id: remap(e.id) })) }));

  const habitIds = new Set(habits.map((h) => h.id));
  const goalIds = new Set(goals.map((g) => g.id));
  const inputIds = new Set(goals.flatMap((g) => g.inputs.map((i) => i.id)));
  const bossIds = new Set(bosses.map((b) => b.id));
  const entryIds = new Set(bosses.flatMap((b) => b.entries.map((e) => e.id)));
  const known = (id: string | null, set: Set<string>) => (id && set.has(remap(id)) ? remap(id) : null);

  let hasMain = false;
  let maxNumber = bosses.reduce((max, b) => Math.max(max, b.number), 0);
  const usedNumbers = new Set<number>();

  return {
    ...data,
    version: DATA_VERSION,
    habits: habits.map((h) => {
      const link = h.link;
      let next: HabitLink | null = null;
      if (link?.kind === "input") {
        const goalId = known(link.goalId, goalIds);
        const inputId = known(link.inputId, inputIds);
        if (goalId && inputId) next = { kind: "input", goalId, inputId };
      } else if (link?.kind === "solution") {
        const bossId = known(link.bossId, bossIds);
        const entryId = known(link.entryId, entryIds);
        if (bossId && entryId) next = { kind: "solution", bossId, entryId };
      }
      return { ...h, link: next };
    }),
    goals: goals.map((g) => {
      const isMain = g.isMain && !hasMain;
      if (isMain) hasMain = true;
      return {
        ...g,
        isMain,
        inputs: g.inputs.map((i) => ({ ...i, habitId: known(i.habitId, habitIds), bossId: known(i.bossId, bossIds) })),
      };
    }),
    bosses: bosses.map((b) => {
      let number = b.number;
      if (usedNumbers.has(number)) number = ++maxNumber;
      usedNumbers.add(number);
      const goalId = b.sourceInput ? known(b.sourceInput.goalId, goalIds) : null;
      const inputId = b.sourceInput ? known(b.sourceInput.inputId, inputIds) : null;
      return {
        ...b,
        number,
        sourceInput: goalId && inputId ? { goalId, inputId } : null,
        entries: b.entries.map((e) => ({ ...e, habitId: known(e.habitId ?? null, habitIds) })),
      };
    }),
    visions: {
      portal: { ...data.visions.portal, slides: data.visions.portal.slides.map((s) => ({ ...s, id: remap(s.id) })) },
      antiportal: { ...data.visions.antiportal, slides: data.visions.antiportal.slides.map((s) => ({ ...s, id: remap(s.id) })) },
    },
  };
}

// ───────────────────────── Repository ─────────────────────────

export function createSupabaseRepository(client: SupabaseClient, userId: string): DataRepository {
  let tail: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
    const run = tail.then(work);
    tail = run.catch(() => undefined);
    return run;
  };

  const boardIds: Partial<Record<VisionKind, string>> = {};

  const boardId = async (kind: VisionKind): Promise<string> => {
    const cached = boardIds[kind];
    if (cached) return cached;
    const found = await client.from("vision_boards").select("id").eq("kind", kind).maybeSingle();
    check(found.error, "Leer tablero");
    if (found.data) return (boardIds[kind] = str(found.data.id));
    const created = await client.from("vision_boards").insert({ user_id: userId, kind }).select("id").single();
    check(created.error, "Crear tablero");
    return (boardIds[kind] = str(created.data?.id));
  };

  /** First sign-in: creates both boards with the six default slides, and the settings row. */
  const ensureDefaults = async () => {
    const created = await client
      .from("vision_boards")
      .upsert(
        KINDS.map((kind) => ({ user_id: userId, kind })),
        { onConflict: "user_id,kind", ignoreDuplicates: true },
      )
      .select("id, kind");
    check(created.error, "Crear tableros");

    const slides = (created.data ?? []).flatMap((board) =>
      DEFAULT_SLIDES.map(({ key, title }, position) => ({
        id: newId(),
        user_id: userId,
        board_id: board.id,
        key,
        title,
        text: "",
        position,
      })),
    );
    if (slides.length) check((await client.from("vision_slides").insert(slides)).error, "Crear slides");

    const settings = await client
      .from("user_settings")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
    check(settings.error, "Crear ajustes");
  };

  /** Mirrors `urls` (4 slide slots or the inspiration board) into `vision_images`. */
  const syncImages = async (board: string, slideId: string | null, urls: (string | null)[]) => {
    const rows = urls.flatMap((url, slot) =>
      url ? [{ user_id: userId, board_id: board, slide_id: slideId, slot, url }] : [],
    );

    let removal = client.from("vision_images").delete().eq("board_id", board);
    removal = slideId ? removal.eq("slide_id", slideId) : removal.is("slide_id", null);
    if (rows.length) removal = removal.not("slot", "in", `(${rows.map((r) => r.slot).join(",")})`);
    check((await removal).error, "Quitar imágenes");

    if (rows.length) {
      const saved = await client.from("vision_images").upsert(rows, { onConflict: "board_id,slide_id,slot" });
      check(saved.error, "Guardar imágenes");
    }
  };

  const insertRows = async (table: string, rows: Row[]) => {
    for (const part of chunks(rows)) check((await client.from(table).insert(part)).error, `Guardar ${table}`);
  };

  const wipe = async (table: string) =>
    check((await client.from(table).delete().eq("user_id", userId)).error, `Vaciar ${table}`);

  const load = async (): Promise<AppData> => {
    await ensureDefaults();

    const [settings, habits, completions, boards, slides, images, goals, inputs, bosses, entries] = await Promise.all([
      fetchAll(client, "user_settings", ["user_id"]),
      fetchAll(client, "habits", ["position", "id"]),
      fetchAll(client, "habit_completions", ["habit_id", "day"]),
      fetchAll(client, "vision_boards", ["kind"]),
      fetchAll(client, "vision_slides", ["position", "id"]),
      fetchAll(client, "vision_images", ["id"]),
      fetchAll(client, "causal_goals", ["created_at", "id"]),
      fetchAll(client, "causal_inputs", ["position", "id"]),
      fetchAll(client, "bosses", ["number"]),
      fetchAll(client, "boss_entries", ["created_at", "id"]),
    ]);

    const daysByHabit = new Map<string, string[]>();
    for (const row of completions) push(daysByHabit, str(row.habit_id), str(row.day));

    const imagesBySlot = new Map<string, Map<number, string>>();
    for (const row of images) {
      const key = `${str(row.board_id)}|${str(row.slide_id)}`;
      const slots = imagesBySlot.get(key) ?? new Map<number, string>();
      slots.set(num(row.slot), str(row.url));
      imagesBySlot.set(key, slots);
    }
    const slotsOf = (board: string, slide: string | null) => imagesBySlot.get(`${board}|${slide ?? ""}`) ?? new Map<number, string>();
    const toArray = (slots: Map<number, string>, length: number) =>
      Array.from({ length }, (_, slot) => slots.get(slot) ?? null);

    const visions = {} as Record<VisionKind, VisionBoard>;
    for (const kind of KINDS) {
      const row = boards.find((b) => b.kind === kind);
      if (!row) throw new Error(`Falta el tablero «${kind}» en Supabase.`);
      const id = str(row.id);
      boardIds[kind] = id;

      const inspirationSlots = slotsOf(id, null);
      const highestSlot = Math.max(-1, ...inspirationSlots.keys());
      visions[kind] = {
        kind,
        beliefs: str(row.beliefs),
        text: str(row.text),
        inspiration: toArray(inspirationSlots, Math.max(num(row.inspiration_slots, INSPIRATION_SLOTS), highestSlot + 1)),
        slides: slides
          .filter((s) => s.board_id === id)
          .map(
            (s): VisionSlide => ({
              id: str(s.id),
              key: str(s.key),
              title: str(s.title),
              text: str(s.text),
              images: toArray(slotsOf(id, str(s.id)), SLIDE_IMAGE_SLOTS),
            }),
          ),
      };
    }

    const inputsByGoal = new Map<string, CausalGoal["inputs"]>();
    for (const row of inputs) {
      push(inputsByGoal, str(row.goal_id), {
        id: str(row.id),
        text: str(row.text),
        status: row.status === "in_progress" || row.status === "done" ? row.status : "pending",
        habitId: strOrNull(row.habit_id),
        bossId: strOrNull(row.boss_id),
      });
    }

    const entriesByBoss = new Map<string, BossEntry[]>();
    for (const row of entries) push(entriesByBoss, str(row.boss_id), entryFromRow(row));

    const settingsRow = settings[0];

    return normalizeData({
      version: DATA_VERSION,
      habits: habits.map(
        (row): Habit => ({
          id: str(row.id),
          name: str(row.name),
          reward: strOrNull(row.reward),
          priority: row.priority === true,
          position: num(row.position),
          completions: daysByHabit.get(str(row.id)) ?? [],
          link: linkFromRow(row),
          createdAt: isoOrNow(row.created_at),
        }),
      ),
      visions,
      goals: goals.map(
        (row): CausalGoal => ({
          id: str(row.id),
          effect: str(row.effect),
          targetDate: strOrNull(row.target_date),
          initialState: str(row.initial_state),
          isMain: row.is_main === true,
          inputs: inputsByGoal.get(str(row.id)) ?? [],
          createdAt: isoOrNow(row.created_at),
        }),
      ),
      bosses: bosses.map(
        (row): Boss => ({
          id: str(row.id),
          number: num(row.number),
          name: str(row.name),
          spriteId: str(row.sprite_id, "knight"),
          startedAt: str(row.started_at),
          defeatedAt: isoOrNull(row.defeated_at),
          sourceInput:
            row.source_goal_id && row.source_input_id
              ? { goalId: str(row.source_goal_id), inputId: str(row.source_input_id) }
              : null,
          entries: entriesByBoss.get(str(row.id)) ?? [],
          createdAt: isoOrNow(row.created_at),
        }),
      ),
      settings: {
        userName: str(settingsRow?.user_name, "Santiago"),
        soundEnabled: settingsRow?.sound_enabled !== false,
      },
    });
  };

  const replaceAll = async (input: AppData) => {
    const data = sanitize(input);

    // Children first is not needed (cascades), but this order keeps every FK satisfied.
    for (const table of ["bosses", "causal_goals", "habits", "vision_images", "vision_slides"]) await wipe(table);

    await insertRows("habits", data.habits.map((h) => habitRow(userId, h)));
    await insertRows(
      "habit_completions",
      data.habits.flatMap((h) => h.completions.map((day) => ({ habit_id: h.id, user_id: userId, day }))),
    );

    await insertRows("causal_goals", data.goals.map((g) => goalRow(userId, g)));
    // Inputs go in without their boss (the boss points back at the input); linked afterwards.
    await insertRows("causal_inputs", data.goals.flatMap((g) => inputRows(userId, g, false)));

    await insertRows("bosses", data.bosses.map((b) => bossRow(userId, b)));
    await insertRows("boss_entries", data.bosses.flatMap((b) => b.entries.map((e) => entryRow(userId, b.id, e))));

    const linked = data.goals.filter((g) => g.inputs.some((i) => i.bossId));
    for (const goal of linked) {
      check(
        (await client.from("causal_inputs").upsert(inputRows(userId, goal), { onConflict: "id" })).error,
        "Enlazar inputs con jefes",
      );
    }

    const savedBoards = await client
      .from("vision_boards")
      .upsert(
        KINDS.map((kind) => ({
          user_id: userId,
          kind,
          beliefs: data.visions[kind].beliefs,
          text: data.visions[kind].text,
          inspiration_slots: Math.min(200, Math.max(1, data.visions[kind].inspiration.length)),
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,kind" },
      )
      .select("id, kind");
    check(savedBoards.error, "Guardar tableros");

    for (const board of savedBoards.data ?? []) {
      const kind = board.kind as VisionKind;
      boardIds[kind] = str(board.id);
      const vision = data.visions[kind];
      await insertRows(
        "vision_slides",
        vision.slides.map((s, position) => ({
          id: s.id,
          user_id: userId,
          board_id: board.id,
          key: s.key,
          title: s.title,
          text: s.text,
          position,
        })),
      );
      const images = [
        ...vision.inspiration.map((url, slot) => ({ slideId: null as string | null, slot, url })),
        ...vision.slides.flatMap((s) => s.images.map((url, slot) => ({ slideId: s.id as string | null, slot, url }))),
      ];
      await insertRows(
        "vision_images",
        images.flatMap(({ slideId, slot, url }) =>
          url ? [{ user_id: userId, board_id: board.id, slide_id: slideId, slot, url }] : [],
        ),
      );
    }

    check(
      (
        await client.from("user_settings").upsert(
          {
            user_id: userId,
            user_name: data.settings.userName,
            sound_enabled: data.settings.soundEnabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      ).error,
      "Guardar ajustes",
    );
  };

  return {
    load: () => enqueue(load),
    replaceAll: (data) => enqueue(() => replaceAll(data)),

    habits: {
      create: (habit) =>
        enqueue(async () => {
          check((await client.from("habits").insert(habitRow(userId, habit))).error, "Crear hábito");
          await insertRows(
            "habit_completions",
            habit.completions.map((day) => ({ habit_id: habit.id, user_id: userId, day })),
          );
        }),

      update: (id, patch) =>
        enqueue(async () => {
          const row: Row = {};
          if ("name" in patch) row.name = patch.name;
          if ("reward" in patch) row.reward = patch.reward ?? null;
          if ("priority" in patch) row.priority = patch.priority;
          if ("link" in patch) Object.assign(row, linkColumns(patch.link));
          if (Object.keys(row).length === 0) return;
          check((await client.from("habits").update(row).eq("id", id)).error, "Actualizar hábito");
        }),

      remove: (id) =>
        enqueue(async () => {
          check((await client.from("habits").delete().eq("id", id)).error, "Borrar hábito");
        }),

      reorder: (orderedIds) =>
        enqueue(async () => {
          const results = await Promise.all(
            orderedIds.map((id, position) => client.from("habits").update({ position }).eq("id", id)),
          );
          for (const result of results) check(result.error, "Reordenar hábitos");
        }),

      setCompletion: (habitId, day, done) =>
        enqueue(async () => {
          const result = done
            ? await client
                .from("habit_completions")
                .upsert({ habit_id: habitId, user_id: userId, day }, { onConflict: "habit_id,day", ignoreDuplicates: true })
            : await client.from("habit_completions").delete().eq("habit_id", habitId).eq("day", day);
          check(result.error, "Guardar día del hábito");
        }),
    },

    visions: {
      updateBoard: (kind, patch) =>
        enqueue(async () => {
          const id = await boardId(kind);
          const row: Row = { updated_at: new Date().toISOString() };
          if (patch.beliefs !== undefined) row.beliefs = patch.beliefs;
          if (patch.text !== undefined) row.text = patch.text;
          if (patch.inspiration) row.inspiration_slots = Math.min(200, Math.max(1, patch.inspiration.length));
          check((await client.from("vision_boards").update(row).eq("id", id)).error, "Guardar tablero");
          if (patch.inspiration) await syncImages(id, null, patch.inspiration);
        }),

      upsertSlide: (kind, slide, position) =>
        enqueue(async () => {
          const board = await boardId(kind);
          const saved = await client.from("vision_slides").upsert(
            { id: slide.id, user_id: userId, board_id: board, key: slide.key, title: slide.title, text: slide.text, position },
            { onConflict: "id" },
          );
          check(saved.error, "Guardar slide");
          await syncImages(board, slide.id, slide.images);
        }),

      removeSlide: (kind, slideId) =>
        enqueue(async () => {
          const board = await boardId(kind);
          check((await client.from("vision_slides").delete().eq("id", slideId)).error, "Borrar slide");

          // Close the gap so a new slide never ties with an existing position.
          const rest = await client.from("vision_slides").select("id, position").eq("board_id", board).order("position").order("id");
          check(rest.error, "Leer slides");
          const stale = (rest.data ?? []).flatMap((s, position) => (s.position === position ? [] : [{ id: s.id, position }]));
          const results = await Promise.all(stale.map((s) => client.from("vision_slides").update({ position: s.position }).eq("id", s.id)));
          for (const result of results) check(result.error, "Reordenar slides");
        }),
    },

    goals: {
      saveGoal: (goal) =>
        enqueue(async () => {
          // Only one main goal may exist: demote the others before promoting this one.
          if (goal.isMain) {
            check(
              (await client.from("causal_goals").update({ is_main: false }).eq("is_main", true).neq("id", goal.id)).error,
              "Cambiar objetivo principal",
            );
          }
          check((await client.from("causal_goals").upsert(goalRow(userId, goal), { onConflict: "id" })).error, "Guardar objetivo");

          const rows = inputRows(userId, goal);
          if (rows.length) check((await client.from("causal_inputs").upsert(rows, { onConflict: "id" })).error, "Guardar inputs");

          let removal = client.from("causal_inputs").delete().eq("goal_id", goal.id);
          if (rows.length) removal = removal.not("id", "in", `(${goal.inputs.map((i) => i.id).join(",")})`);
          check((await removal).error, "Quitar inputs");
        }),

      removeGoal: (goalId) =>
        enqueue(async () => {
          check((await client.from("causal_goals").delete().eq("id", goalId)).error, "Borrar objetivo");
        }),
    },

    bosses: {
      create: (boss) =>
        enqueue(async () => {
          check((await client.from("bosses").insert(bossRow(userId, boss))).error, "Crear jefe");
          await insertRows("boss_entries", boss.entries.map((e) => entryRow(userId, boss.id, e)));
        }),

      update: (id, patch) =>
        enqueue(async () => {
          const row: Row = {};
          if ("name" in patch) row.name = patch.name;
          if ("spriteId" in patch) row.sprite_id = patch.spriteId;
          if ("defeatedAt" in patch) row.defeated_at = isoOrNull(patch.defeatedAt);
          if ("sourceInput" in patch) {
            row.source_goal_id = uuidOrNull(patch.sourceInput?.goalId);
            row.source_input_id = uuidOrNull(patch.sourceInput?.inputId);
          }
          if (Object.keys(row).length === 0) return;
          check((await client.from("bosses").update(row).eq("id", id)).error, "Actualizar jefe");
        }),

      remove: (id) =>
        enqueue(async () => {
          check((await client.from("bosses").delete().eq("id", id)).error, "Borrar jefe");
        }),

      upsertEntry: (bossId, entry) =>
        enqueue(async () => {
          check((await client.from("boss_entries").upsert(entryRow(userId, bossId, entry), { onConflict: "id" })).error, "Guardar entrada");
        }),

      removeEntry: (bossId, entryId) =>
        enqueue(async () => {
          check((await client.from("boss_entries").delete().eq("id", entryId).eq("boss_id", bossId)).error, "Borrar entrada");
        }),
    },

    settings: {
      save: (settings) =>
        enqueue(async () => {
          const saved = await client.from("user_settings").upsert(
            { user_id: userId, user_name: settings.userName, sound_enabled: settings.soundEnabled, updated_at: new Date().toISOString() },
            { onConflict: "user_id" },
          );
          check(saved.error, "Guardar ajustes");
        }),
    },
  };
}
