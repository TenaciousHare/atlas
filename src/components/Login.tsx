import { useState, type SyntheticEvent } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center text-zinc-100">
          A.T.L.A.S. 4.0
        </h1>
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm text-zinc-400">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.com"
            required
            className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm text-zinc-400">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 bg-brand-surface border-brand-border text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {errorMsg && (
          <p role="alert" className="text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-gold text-brand-bg py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Logowanie…" : "Zaloguj"}
        </button>
      </form>
    </section>
  );
}
