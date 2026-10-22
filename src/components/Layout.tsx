import { NavLink, Outlet } from "react-router-dom";

export default function Layout({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded text-sm transition ${
      isActive
        ? "bg-brand-gold text-brand-bg font-medium"
        : "text-zinc-400 hover:text-zinc-100"
    }`;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-tight text-zinc-100">
            A.T.L.A.S.
          </span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkClass}>
              Dodaj wpis
            </NavLink>
            <NavLink to="/cwiczenia" className={linkClass}>
              Ćwiczenia
            </NavLink>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-500 sm:block">{email}</span>
          <button
            onClick={onLogout}
            className="rounded border border-brand-border px-3 py-1 text-sm text-zinc-300 hover:bg-brand-surface"
          >
            Wyloguj
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
