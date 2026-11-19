import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { type Exercise } from "./useExercises";

export type Block = "warmup" | "main" | "cooldown";
export type Scheme = "straight" | "ladder";

export type TemplateExercise = {
  id: string;
  position: number;
  block: Block;
  sets: number;
  scheme: Scheme;
  target_min: number | null;
  target_max: number | null;
  target_seconds: number | null;
  ladder_step: number | null;
  ladder_top: number | null;
  weight_kg: number | null;
  box_cm: number | null;
  notes: string | null;
  exercise: Exercise;
};

export type NewTemplateExercise = Omit<
  TemplateExercise,
  "id" | "position" | "exercise"
> & { exercise_id: string };

const COLUMNS =
  "id, position, block, sets, scheme, target_min, target_max, target_seconds, ladder_step, ladder_top, weight_kg, box_cm, notes, exercise:exercises(id, name, measure, uses_weight, unilateral)";

export default function useTemplateExercises(templateId: string) {
  const [templateName, setTemplateName] = useState("");
  const [items, setItems] = useState<TemplateExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase
        .from("workout_templates")
        .select("name")
        .eq("id", templateId)
        .single(),
      supabase
        .from("template_exercises")
        .select(COLUMNS)
        .eq("template_id", templateId)
        .order("position")
        .overrideTypes<TemplateExercise[], { merge: false }>(),
    ]).then(([template, list]) => {
      setIsLoading(false);
      if (template.error || list.error) {
        setFetchError(true);
        console.error(template.error ?? list.error);
        return;
      }
      setTemplateName(template.data.name);
      setItems(list.data);
    });
  }, [templateId]);

  async function addItem(newItem: NewTemplateExercise) {
    const lastPosition = items.at(-1)?.position ?? 0;
    const { data, error } = await supabase
      .from("template_exercises")
      .insert({
        ...newItem,
        template_id: templateId,
        position: lastPosition + 1,
      })
      .select(COLUMNS)
      .single()
      .overrideTypes<TemplateExercise, { merge: false }>();
    if (error) return error;
    setItems((prev) => [...prev, data]);
    return null;
  }

  // zamienia miejscami ćwiczenie z sąsiadem w tej samej części treningu
  async function moveItem(id: string, direction: "up" | "down") {
    const item = items.find((i) => i.id === id);
    if (!item) return null;
    const sameBlock = items.filter((i) => i.block === item.block);
    const index = sameBlock.findIndex((i) => i.id === id);
    const neighbour = sameBlock[direction === "up" ? index - 1 : index + 1];
    if (!neighbour) return null;

    const [first, second] = await Promise.all([
      supabase
        .from("template_exercises")
        .update({ position: neighbour.position })
        .eq("id", item.id),
      supabase
        .from("template_exercises")
        .update({ position: item.position })
        .eq("id", neighbour.id),
    ]);
    const error = first.error ?? second.error;
    if (error) return error;

    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === item.id) return { ...i, position: neighbour.position };
          if (i.id === neighbour.id) return { ...i, position: item.position };
          return i;
        })
        .sort((a, b) => a.position - b.position),
    );
    return null;
  }

  async function removeItem(id: string) {
    const { error } = await supabase
      .from("template_exercises")
      .delete()
      .eq("id", id);
    if (error) return error;
    setItems((prev) => prev.filter((i) => i.id !== id));
    return null;
  }

  return {
    templateName,
    items,
    addItem,
    moveItem,
    removeItem,
    isLoading,
    fetchError,
  };
}
