import { ladderRungs } from "./ladder";
import type { TemplateExercise } from "../hooks/useTemplateExercises";

// Jeden wiersz do wstawienia w session_sets (bez id i session_id).
export type PlannedSet = {
  exercise_id: string;
  position: number;
  set_no: number;
  rung_no: number | null;
  side: "L" | "R" | null;
  reps: number | null;
  seconds: number | null;
  weight_kg: number | null;
  box_cm: number | null;
};

// Rozwija przepis z planu w listę serii do zrobienia.
// Tylko część główna (main): rozgrzewkę i rozciąganie tylko odhaczamy.
// Pompki 3×15            → 3 wiersze
// Pistols 3×5, L/P       → 6 wierszy (1L, 1R, 2L, 2R, 3L, 3R)
// Podciąganie 3× 1-2-3   → 9 wierszy (3 serie × 3 szczeble)
export function expandTemplate(items: TemplateExercise[]) {
  const planned: PlannedSet[] = [];

  for (const item of items) {
    if (item.block !== "main") continue;

    const sides = item.exercise.unilateral ? (["L", "R"] as const) : [null];
    // drabina → lista szczebli, zwykła seria → jedna „pusta” pozycja
    const rungs =
      item.scheme === "ladder" &&
      item.ladder_step !== null &&
      item.ladder_top !== null
        ? ladderRungs(item.ladder_step, item.ladder_top)
        : [null];

    for (let setNo = 1; setNo <= item.sets; setNo++) {
      rungs.forEach((rungReps, index) => {
        for (const side of sides) {
          planned.push({
            exercise_id: item.exercise.id,
            position: item.position,
            set_no: setNo,
            rung_no: rungReps === null ? null : index + 1,
            side,
            // szczebel drabiny = tyle powtórzeń, ile mówi szczebel;
            // zakres 8–10 → startujemy od dolnej granicy
            reps: rungReps ?? item.target_min,
            seconds: item.target_seconds,
            weight_kg: item.weight_kg,
            box_cm: item.box_cm,
          });
        }
      });
    }
  }

  return planned;
}
