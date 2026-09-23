"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  BookOpen,
  LayoutGrid,
  Plus,
  Users,
  X,
} from "lucide-react";
import { useDemo } from "./demo-provider";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { actor, setActor, data, busy, error, notice, clearNotice } = useDemo();
  const links = [
    {
      href: "/",
      label: "Каталог задач",
      shortLabel: "Каталог",
      icon: LayoutGrid,
    },
    {
      href: actor === "business" ? "/business" : "/team",
      label: actor === "business" ? "Мои задачи и отклики" : "Мои отклики",
      shortLabel: actor === "business" ? "Мои задачи" : "Отклики",
      icon: BriefcaseBusiness,
    },
    { href: "/teams", label: "Команды", shortLabel: "Команды", icon: Users },
    {
      href: "/guide",
      label: "Как это работает",
      shortLabel: "Правила",
      icon: BookOpen,
    },
  ];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link
            href="/"
            className="brand"
            aria-label="Практика — каталог задач"
          >
            <span className="brand-mark" aria-hidden="true">
              п
            </span>
            <span className="brand-name">
              практика<span>.</span>
            </span>
          </Link>
          <nav className="nav-list" aria-label="Основная навигация">
            {links.map(({ href, label, shortLabel, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={path === href ? "page" : undefined}
                className={`nav-item ${path === href ? "active" : ""}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="nav-label-full" aria-hidden="true">
                  {label}
                </span>
                <span className="nav-label-short" aria-hidden="true">
                  {shortLabel}
                </span>
              </Link>
            ))}
          </nav>
          <div className="topbar-right">
            <span className="demo-label">Демо</span>
            <label className="actor-control">
              <span className="actor-caption">Роль</span>
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
        </div>
      </header>
      <div className="main-shell">
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="main-footer">
          <span>Powered by HackAlem · Практика для бизнеса и команд</span>
          <Link href="/guide">
            Правила работы <ArrowRight size={16} aria-hidden="true" />
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
      Мои отклики <ArrowRight size={18} />
    </Link>
  );
}
