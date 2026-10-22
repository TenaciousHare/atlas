import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import Layout from "./components/Layout";
import DailyForm from "./components/DailyForm";
import Dashboard from "./components/Dashboard";
import Exercises from "./components/Exercises";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (initializing) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Ładowanie…</p>
      </section>
    );
  }

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout email={session.user.email ?? ""} onLogout={handleLogout} />
          }
        >
          <Route index element={<DailyForm session={session} />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cwiczenia" element={<Exercises />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
