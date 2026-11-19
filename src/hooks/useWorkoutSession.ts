import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { expandTemplate } from "../lib/expandTemplate";
import { type Exercise } from "./useExercises";
import { type TemplateExercise } from "./useTemplateExercises";

export type SessionSet = {
  id: string;
  position: number;
  set_no: number;
  rung_no: number | null;
  side: "L" | "R" | null;
  reps: number | null;
  seconds: number | null;
  weight_kg: number | null;
  box_cm: number | null;
  done: boolean;
  exercise: Exercise;
};

// rozgrzewka / rozciąganie: tylko nazwa do odhaczenia
export type CheckItem = {
  id: string;
  block: "warmup" | "cooldown";
  notes: string | null;
  exercise: Pick<Exercise, "name">;
};

type Session = {
  date: string;
  finished_at: string | null;
  template_id: string | null;
  template: { name: string } | null;
};

// pola serii, które można zmienić w trakcie treningu
export type SetChanges = Partial<
  Pick<SessionSet, "reps" | "seconds" | "weight_kg" | "box_cm" | "done">
>;

const SET_COLUMNS =
  "id, position, set_no, rung_no, side, reps, seconds, weight_kg, box_cm, done, exercise:exercises(id, name, measure, uses_weight, unilateral)";

// Tworzy trening z planu: 1 wiersz w workout_sessions + serie w session_sets.
// Zwraca id nowego treningu albo błąd.
export async function startSession(
  templateId: string,
  items: TemplateExercise[],
) {
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({ template_id: templateId })
    .select("id")
    .single();
  if (error) return { error };

  const sets = expandTemplate(items).map((set) => ({
    ...set,
    session_id: session.id,
  }));
  if (sets.length > 0) {
    const { error: setsError } = await supabase
      .from("session_sets")
      .insert(sets);
    if (setsError) {
      // sprzątamy pusty trening, żeby nie wisiał w historii
      await supabase.from("workout_sessions").delete().eq("id", session.id);
      return { error: setsError };
    }
  }
  return { id: session.id as string };
}

export default function useWorkoutSession(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  // pozycje ćwiczeń, które w planie miały box (pokazujemy pole „cm”)
  const [boxPositions, setBoxPositions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function load() {
      const [sessionResult, setsResult] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select(
            "date, finished_at, template_id, template:workout_templates(name)",
          )
          .eq("id", sessionId)
          .single()
          .overrideTypes<Session, { merge: false }>(),
        supabase
          .from("session_sets")
          .select(SET_COLUMNS)
          .eq("session_id", sessionId)
          .order("position")
          .order("set_no")
          .order("rung_no")
          .order("side")
          .overrideTypes<SessionSet[], { merge: false }>(),
      ]);
      if (sessionResult.error || setsResult.error) {
        setIsLoading(false);
        setFetchError(true);
        console.error(sessionResult.error ?? setsResult.error);
        return;
      }

      // rozgrzewkę i rozciąganie bierzemy prosto z planu
      const templateId = sessionResult.data.template_id;
      if (templateId) {
        const { data, error } = await supabase
          .from("template_exercises")
          .select("id, block, notes, exercise:exercises(name)")
          .eq("template_id", templateId)
          .in("block", ["warmup", "cooldown"])
          .order("position")
          .overrideTypes<CheckItem[], { merge: false }>();
        if (error) console.error(error);
        setCheckItems(data ?? []);
      }

      setSession(sessionResult.data);
      setSets(setsResult.data);
      setBoxPositions(
        setsResult.data
          .filter((set) => set.box_cm !== null)
          .map((set) => set.position),
      );
      setIsLoading(false);
    }
    load();
  }, [sessionId]);

  // zmiana tylko na ekranie (np. wpisywanie liczby w pole)
  function editSet(id: string, changes: SetChanges) {
    setSets((prev) =>
      prev.map((set) => (set.id === id ? { ...set, ...changes } : set)),
    );
  }

  // zapis serii do bazy (aktualne wartości z ekranu + ewentualne zmiany)
  async function saveSet(id: string, changes: SetChanges = {}) {
    const set = sets.find((s) => s.id === id);
    if (!set) return null;
    const next = { ...set, ...changes };
    editSet(id, changes);
    const { error } = await supabase
      .from("session_sets")
      .update({
        reps: next.reps,
        seconds: next.seconds,
        weight_kg: next.weight_kg,
        box_cm: next.box_cm,
        done: next.done,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      // cofamy odhaczenie na ekranie, żeby nie kłamało
      editSet(id, { done: set.done });
      return error;
    }
    return null;
  }

  async function finishSession() {
    const finishedAt = new Date().toISOString();
    const { error } = await supabase
      .from("workout_sessions")
      .update({ finished_at: finishedAt, updated_at: finishedAt })
      .eq("id", sessionId);
    if (error) return error;
    setSession((prev) => (prev ? { ...prev, finished_at: finishedAt } : prev));
    return null;
  }

  return {
    session,
    sets,
    checkItems,
    boxPositions,
    editSet,
    saveSet,
    finishSession,
    isLoading,
    fetchError,
  };
}
