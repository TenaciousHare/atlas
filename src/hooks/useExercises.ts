import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export type Exercise = {
  id: string;
  name: string;
  measure: "reps" | "time";
  uses_weight: boolean;
  unilateral: boolean;
};

export default function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    supabase
      .from("exercises")
      .select("id, name, measure, uses_weight, unilateral")
      .order("name")
      .then(({ data, error }) => {
        setIsLoading(false);
        if (error) {
          setFetchError(true);
          console.error(error);
        }
        if (!data) return;
        setExercises(data);
      });
  }, []);

  return { exercises, setExercises, isLoading, fetchError };
}
