import { useState, type SyntheticEvent } from "react";
import useWorkoutTemplates from "../hooks/useWorkoutTemplates";

export default function WorkoutTemplates() {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [nameError, setNameError] = useState(false);
  const { templates, addTemplate, isLoading, fetchError } =
    useWorkoutTemplates();

  async function handleAdd(e: SyntheticEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setNameError(false);
    const error = await addTemplate({ name: name.trim() });

    if (error?.code === "23505") {
      setErrorMessage("Plan o tej nazwie już istnieje");
      setNameError(true);
      return;
    } else if (error) {
      setErrorMessage("Wystąpił błąd, spróbuj ponownie");
      return;
    }

    setName("");
  }

  let statusMessage = "";

  if (isLoading) {
    statusMessage = "Ładowanie ...";
  } else if (fetchError) {
    statusMessage = "Nie udało się pobrać planów. Odśwież stronę.";
  } else if (templates.length === 0) {
    statusMessage = "Brak planów — dodaj pierwszy powyżej.";
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-10">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">Dodaj plan</h2>
      <form onSubmit={handleAdd} className="mb-10 space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="template-name"
            className="block text-sm text-zinc-400"
          >
            Nazwa planu
          </label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMessage(null);
              setNameError(false);
            }}
            aria-invalid={nameError}
            aria-describedby="template-name-error"
            required
            placeholder="A1"
            className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500 aria-invalid:border-red-400"
          />
        </div>
        <button
          className="w-full rounded bg-brand-gold text-brand-bg py-2 font-medium"
          type="submit"
        >
          Dodaj
        </button>
        <div
          id="template-name-error"
          className="text-sm text-red-400"
          role="alert"
        >
          {errorMessage}
        </div>
      </form>

      <h2 className="mb-3 text-xl font-semibold text-zinc-100">Moje plany</h2>
      <div role="status">
        <p className="text-sm text-zinc-500">{statusMessage}</p>
      </div>
      {templates.length > 0 && (
        <ul className="divide-y divide-brand-border">
          {templates.map((template) => (
            <li key={template.id} className="py-2 text-zinc-100">
              {template.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
