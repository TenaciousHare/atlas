import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";

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
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight">A.T.L.A.S. 4.0</h1>
      <p className="mt-2 text-slate-500">
        Zalogowano jako {session.user.email}
      </p>
      <button
        onClick={handleLogout}
        className="mt-6 rounded border px-4 py-2 text-sm"
      >
        Wyloguj
      </button>
    </section>
  );
}

export default App;
