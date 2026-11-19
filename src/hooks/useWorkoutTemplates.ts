import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export type WorkoutTemplate = {
  id: string;
  name: string;
};

export default function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    supabase
      .from("workout_templates")
      .select("id, name")
      .order("name")
      .then(({ data, error }) => {
        setIsLoading(false);
        if (error) {
          setFetchError(true);
          console.error(error);
        }
        if (!data) return;
        setTemplates(data);
      });
  }, []);

  async function addTemplate(newTemplate: Omit<WorkoutTemplate, "id">) {
    const { data, error } = await supabase
      .from("workout_templates")
      .insert(newTemplate)
      .select("id, name")
      .single();
    if (error) return error;
    setTemplates((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "pl")),
    );
    return null;
  }

  return { templates, addTemplate, isLoading, fetchError };
}
