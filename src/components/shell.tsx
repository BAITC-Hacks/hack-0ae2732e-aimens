"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  LayoutGrid,
  BriefcaseBusiness,
  Users,
  BookOpen,
  Plus,
  ArrowRight,
  Sprout,
  X,
  FlaskConical,
  FolderOpen,
} from "lucide-react";
import { useDemo } from "./demo-provider";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { actor, setActor, data, busy, error, notice, clearNotice } = useDemo();
  const team = data?.teams.find((team) => team.id === actor);
  const links = [
    { href: "/", label: "Каталог задач", icon: LayoutGrid },
    {
      href: actor === "business" ? "/business" : "/team",
      label: actor === "business" ? "Мои задачи и отклики" : "Мои отклики",
      icon: BriefcaseBusiness,
    },
    { href: "/teams", label: "Команды", icon: Users },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <Sprout size={25} />
          </span>
          практика<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">БИЗНЕС + НОВЫЕ ТАЛАНТЫ</div>
        <nav className="nav-list" aria-label="Основная навигация">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path === href ? "active" : ""}`}
            >
              <Icon size={19} />
              <span>{label}</span>
              {href === "/" && (
                <span className="nav-count">
                  {data?.tasks.filter((t) => t.publishedAt).length ?? "—"}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">ВМЕСТЕ — ПОЛЕЗНЕЕ</span>
          <h3>
            Задача бизнеса.
            <br />
            Возможность для вас.
          </h3>
          <p>Учитесь на реальных задачах и создавайте то, что нужно людям.</p>
          <Link href="/guide">
            Как это работает <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link href="/guide" className={path === "/guide" ? "active" : ""}>
            <BookOpen size={18} />
            Гид по платформе
          </Link>
          <div className="sidebar-footer">
            AI SANA · HACKALEM 2026<span>Демо для совместной работы</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <FolderOpen size={17} />
            <span>Рабочее пространство</span>
            <span className="crumb-divider">/</span>
            <strong>
              {path === "/"
                ? "Каталог"
                : path.startsWith("/tasks")
                  ? "Задачи"
                  : path === "/teams"
                    ? "Команды"
                    : path === "/guide"
                      ? "Гид"
                      : "Кабинет"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="demo-label">
              <FlaskConical size={14} />
              Демо
            </span>
            <label className="actor-control">
              <span className="profile-avatar">
                {actor === "business" ? "Б" : team?.initials}
              </span>
              <select
                aria-label="Демопрофиль"
                value={actor}
                onChange={(event) => setActor(event.target.value)}
                disabled={busy}
              >
                <option value="business">Бизнес</option>
                {data?.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="main-footer">
          <span>Практика начинается с хорошей задачи.</span>
          <Link href="/guide">
            Узнать больше <ArrowRight size={13} />
          </Link>
        </footer>
      </div>
      {(error || notice) && (
        <div
          className={`toast ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>
          <button onClick={clearNotice} aria-label="Закрыть сообщение">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
export function NewTaskButton() {
  const { actor } = useDemo();
  return actor === "business" ? (
    <Link className="button primary" href="/tasks/new">
      <Plus size={18} />
      Предложить задачу
    </Link>
  ) : (
    <Link className="button primary" href="/team">
      Мои отклики <ArrowUpRight size={17} />
    </Link>
  );
}
