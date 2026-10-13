import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import DailyForm from "./components/DailyForm";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 1. odczytaj sesję zapisaną w localStorage (przeżywa F5)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    // 2. nasłuchuj zmian: login, logout, odświeżenie tokenu
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. sprzątanie przy odmontowaniu
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (initializing) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Ładowanie…</p>
      </section>
    );
  }

  if (!session) return <Login />;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-slate-500">{session.user.email}</span>
        <button
          onClick={handleLogout}
          className="rounded border px-3 py-1 text-sm"
        >
          Wyloguj
        </button>
      </header>
      <main>
        <DailyForm session={session} />
      </main>
    </div>
  );
}

export default App;
