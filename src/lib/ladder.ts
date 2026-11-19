// Rozwija drabinę w listę szczebli.
// krok 1, szczyt 3 → [1, 2, 3]
// krok 2, szczyt 6 → [2, 4, 6]
export function ladderRungs(step: number, top: number) {
  const rungs: number[] = [];
  for (let reps = step; reps <= top; reps += step) {
    rungs.push(reps);
  }
  return rungs;
}
