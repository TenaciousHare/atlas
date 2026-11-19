import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { type Exercise } from "./useExercises";

export type Block = "warmup" | "main" | "cooldown";

export type TemplateExercise = {
  id: string;
  position: number;
  block: Block;
  sets: number;
  target_min: number | null;
  target_max: number | null;
  target_seconds: number | null;
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
  "id, position, block, sets, target_min, target_max, target_seconds, weight_kg, box_cm, notes, exercise:exercises(id, name, measure, uses_weight, unilateral)";

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

  return { templateName, items, addItem, isLoading, fetchError };
}
