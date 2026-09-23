"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Search,
  ChevronDown,
  UserRound,
  X,
  Plus,
} from "lucide-react";
import { useDemo } from "./demo-provider";
import { useEffect, useRef, type ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const { actor, setActor, data, busy, error, notice, clearNotice } = useDemo();
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);
  const profile =
    actor === "business"
      ? "Бизнес"
      : (data?.teams.find((t) => t.id === actor)?.name ?? "Команда");
  const links = [
    ["/", "Главная"],
    ["/catalog", "Каталог задач"],
    ["/tasks/new", "Разместить задачу"],
    ["/teams", "Команды"],
    ["/guide", "О платформе"],
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="SanaLink — главная">
            <Image
              src="/assets/svg/logo-mark.svg"
              alt=""
              width={34}
              height={34}
            />
            <span>
              Sana<span className="text-green">Link</span>
            </span>
          </Link>
          <nav className="nav-list" aria-label="Основная навигация">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="nav-item"
                aria-current={path === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="topbar-right">
            <Link
              href="/catalog#search"
              className="icon-button header-search"
              aria-label="Найти задачу"
            >
              <Search size={19} />
            </Link>
            <details className="profile-menu" ref={menu}>
              <summary aria-label="Открыть профиль">
                <span className="profile-avatar">
                  <UserRound size={17} />
                </span>
                <span className="profile-name">
                  {profile}
                  <small>Демо-профиль</small>
                </span>
                <ChevronDown size={14} />
              </summary>
              <div className="profile-dropdown">
                <p className="eyebrow">ДЕМО-РЕЖИМ</p>
                <label className="field">
                  <span>Роль и команда</span>
                  <select
                    aria-label="Демопрофиль"
                    value={actor}
                    onChange={(e) => {
                      setActor(e.target.value);
                      if (menu.current) menu.current.open = false;
                    }}
                    disabled={busy}
                  >
                    <option value="business">Бизнес</option>
                    {data?.teams.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.name} · студент
                      </option>
                    ))}
                  </select>
                </label>
                <Link
                  className="profile-workspace"
                  onClick={() => {
                    if (menu.current) menu.current.open = false;
                  }}
                  href={actor === "business" ? "/business" : "/team"}
                >
                  {actor === "business"
                    ? "Мои задачи и отклики"
                    : "Мои отклики"}
                  <ArrowRight size={16} />
                </Link>
                <p className="text-small muted">
                  Переключайте роли, чтобы пройти весь сценарий без регистрации.
                </p>
              </div>
            </details>
          </div>
        </div>
      </header>
      <div className="main-shell">
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="main-footer">
          <div className="footer-top">
            <div>
              <Link href="/" className="brand">
                <Image
                  src="/assets/svg/logo-mark.svg"
                  alt=""
                  width={30}
                  height={30}
                />
                <span>SanaLink</span>
              </Link>
              <p>
                Бизнес-задачи. Студенческие идеи.
                <br />
                Результат, который имеет значение.
              </p>
            </div>
            <div>
              <strong>Найти своё</strong>
              <Link href="/catalog">Каталог задач</Link>
              <Link href="/teams">Студенческие команды</Link>
              <Link href="/catalog?saved=1">Сохранённые задачи</Link>
            </div>
            <div>
              <strong>Начать работу</strong>
              <Link href="/tasks/new">Разместить задачу</Link>
              <Link href="/business">Кабинет бизнеса</Link>
              <Link href="/team">Кабинет команды</Link>
            </div>
            <div>
              <strong>О SanaLink</strong>
              <Link href="/guide">Как это работает</Link>
              <Link href="/guide#rating">Рейтинг готовности</Link>
              <span>Проект команды Aimens</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 SanaLink · HackAlem / AI Sana</span>
            <span>Демонстрационная платформа · синтетические данные</span>
          </div>
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
  return (
    <Link className="button primary" href="/tasks/new">
      <Plus size={18} />
      Разместить задачу
    </Link>
  );
}
