"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import type { DayKey, Habit } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHashFocus } from "@/lib/useHashFocus";
import { useToday } from "@/lib/useToday";
import { SectionTitle } from "../ui/SectionTitle";
import { AddHabitForm } from "./AddHabitForm";
import { HabitCard } from "./HabitCard";
import { RewardModal, type RewardReveal } from "./RewardModal";

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** Priority habits first; manual order inside each block. */
export const sortHabits = (habits: Habit[]) =>
  [...habits].sort((a, b) => Number(b.priority) - Number(a.priority) || a.position - b.position);

export function HabitsSection() {
  const habits = useAppStore((s) => s.habits);
  const addHabit = useAppStore((s) => s.addHabit);
  const updateHabit = useAppStore((s) => s.updateHabit);
  const reorderHabits = useAppStore((s) => s.reorderHabits);
  const today = useToday();
  const [reveal, setReveal] = useState<RewardReveal | null>(null);
  const [dragging, setDragging] = useState(false);
  useHashFocus();

  const sorted = useMemo(() => sortHabits(habits), [habits]);
  const ids = useMemo(() => sorted.map((h) => h.id), [sorted]);
  const doneToday = sorted.filter((h) => h.completions.includes(today)).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    // Re-enable layout animations only after dnd-kit has reset its transforms.
    requestAnimationFrame(() => setDragging(false));
    if (!over || active.id === over.id) return;
    const from = sorted.find((h) => h.id === active.id);
    const to = sorted.find((h) => h.id === over.id);
    // Priority habits always stay in the top block.
    if (!from || !to || from.priority !== to.priority) return;
    reorderHabits(arrayMove(ids, ids.indexOf(from.id), ids.indexOf(to.id)));
  };

  const togglePriority = useCallback(
    (id: string) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      void updateHabit(id, { priority: !habit.priority });
      // Follow the card to its new place.
      setTimeout(() => {
        document.getElementById(`habit-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 450);
    },
    [habits, updateHabit],
  );

  const showReward = useCallback(
    (habit: Habit) => habit.reward && setReveal({ habitName: habit.name, reward: habit.reward, priority: habit.priority }),
    [],
  );

  return (
    <section>
      <SectionTitle
        action={
          sorted.length > 0 && (
            <span className="label">
              Hoy: <span className={doneToday === sorted.length ? "text-mint" : "text-soft"}>{doneToday}</span> /{" "}
              {sorted.length}
            </span>
          )
        }
      >
        Rastreador de hábitos
      </SectionTitle>

      <div className="mt-4 space-y-3.5">
        {sorted.length === 0 && <EmptyHabits />}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[verticalOnly]}
          onDragStart={() => setDragging(true)}
          onDragCancel={() => setDragging(false)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {sorted.map((habit) => (
                <SortableHabit
                  key={habit.id}
                  habit={habit}
                  today={today}
                  layoutEnabled={!dragging}
                  onReward={showReward}
                  onPriorityChange={togglePriority}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        <AddHabitForm onAdd={(name, reward) => addHabit(name, { reward })} />
      </div>

      <RewardModal reveal={reveal} onClose={() => setReveal(null)} />
    </section>
  );
}

function SortableHabit({
  habit,
  today,
  layoutEnabled,
  onReward,
  onPriorityChange,
}: {
  habit: Habit;
  today: DayKey;
  layoutEnabled: boolean;
  onReward: (habit: Habit) => void;
  onPriorityChange: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: "relative",
      }}
    >
      <motion.div
        layout={layoutEnabled ? "position" : false}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: isDragging ? 1.02 : 1 }}
        exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        <HabitCard
          habit={habit}
          today={today}
          onReward={onReward}
          onPriorityChange={onPriorityChange}
          dragging={isDragging}
          handleProps={{ ...attributes, ...listeners, ref: setActivatorNodeRef }}
        />
      </motion.div>
    </div>
  );
}

function EmptyHabits() {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_30%,#2b2b2b,#0d0d0d)] text-2xl text-soft">
        ✓
      </div>
      <p className="mt-4 text-lg font-bold">Tu primer hábito empieza aquí</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
        Convierte los inputs de tu Ley Causal en acciones diarias. Escríbelo abajo y, si quieres, ponle una recompensa.
      </p>
    </div>
  );
}
