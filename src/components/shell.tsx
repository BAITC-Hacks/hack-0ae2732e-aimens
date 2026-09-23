"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Search, ChevronDown, UserRound, X } from "lucide-react";
import { useDemo } from "./demo-provider";
import { useLocale } from "./locale-provider";
import { useEffect, useRef, type ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { locale, setLocale } = useLocale();
  const languageLabel =
    locale === "kk"
      ? "Интерфейс тілі"
      : locale === "en"
        ? "Interface language"
        : "Язык интерфейса";
  const menu = useRef<HTMLDetailsElement>(null);
  const {
    actor,
    lastTeamActor,
    setActor,
    data,
    busy,
    loading,
    error,
    notice,
    clearNotice,
    refreshFailed,
    reload,
  } = useDemo();
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
  const teamMode = actor !== "business";
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
            <label className="language-control" data-no-translate>
              <span className="sr-only">{languageLabel}</span>
              <select
                aria-label={languageLabel}
                value={locale}
                onChange={(event) =>
                  setLocale(event.target.value as "ru" | "kk" | "en")
                }
              >
                <option value="ru">РУС</option>
                <option value="kk">ҚАЗ</option>
                <option value="en">ENG</option>
              </select>
            </label>
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
                  <span data-no-translate={teamMode || undefined}>
                    {profile}
                  </span>
                  <small>Демо-профиль</small>
                </span>
                <ChevronDown size={14} />
              </summary>
              <div className="profile-dropdown">
                <p className="eyebrow">ДЕМО-РЕЖИМ</p>
                <fieldset className="profile-role-switch" disabled={busy}>
                  <legend>Активная сторона</legend>
                  <div role="group" aria-label="Выберите сторону">
                    <button
                      type="button"
                      aria-pressed={!teamMode}
                      className={!teamMode ? "selected" : ""}
                      onClick={() => setActor("business")}
                    >
                      Бизнес
                    </button>
                    <button
                      type="button"
                      aria-pressed={teamMode}
                      className={teamMode ? "selected" : ""}
                      disabled={!teamMode && !data?.teams.length}
                      onClick={() => {
                        if (!teamMode && data?.teams.length) {
                          const rememberedTeam = data.teams.find(
                            (team) => team.id === lastTeamActor,
                          );
                          setActor(rememberedTeam?.id ?? data.teams[0].id);
                        }
                      }}
                    >
                      Команда
                    </button>
                  </div>
                </fieldset>
                {teamMode && (
                  <label className="field profile-team-select">
                    <span>Команда в профиле</span>
                    <select
                      aria-label="Команда в профиле"
                      value={actor}
                      onChange={(e) => setActor(e.target.value)}
                      disabled={busy}
                    >
                      {data?.teams.map((t) => (
                        <option value={t.id} key={t.id} data-no-translate>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="profile-create-team">
                  <div>
                    <strong>Создать отдельную команду</strong>
                    <span className="text-small muted">
                      Профиль бизнеса останется доступен в переключателе выше.
                    </span>
                  </div>
                  <Link
                    className="text-link"
                    href="/teams/new"
                    aria-label="Перейти к созданию команды"
                    onClick={() => {
                      if (menu.current) menu.current.open = false;
                    }}
                  >
                    Создать свою команду <ArrowRight size={16} />
                  </Link>
                </div>
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
                  Бизнес и студенческая команда — две стороны платформы. Команды
                  создаются отдельно и выбираются внутри стороны «Команда».
                </p>
              </div>
            </details>
          </div>
        </div>
        <div className="demo-toolbar">
          <div className="demo-toolbar-inner">
            <span className="demo-label">Демо без регистрации</span>
            <div className="role-switch" role="group" aria-label="Роль в демо">
              <button
                type="button"
                aria-pressed={actor === "business"}
                disabled={busy || loading}
                onClick={() => setActor("business")}
              >
                Бизнес
              </button>
              <button
                type="button"
                aria-pressed={actor !== "business"}
                disabled={busy || loading}
                onClick={() => setActor(lastTeamActor)}
              >
                Студент
              </button>
            </div>
            <span
              className="demo-context"
              data-no-translate={teamMode || undefined}
            >
              {actor === "business"
                ? "Публикуйте задачи и выбирайте команды"
                : profile}
            </span>
            <Link
              className="workspace-link"
              href={actor === "business" ? "/business" : "/team"}
            >
              {actor === "business" ? "Кабинет бизнеса" : "Мои отклики"}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
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
          {refreshFailed && (
            <button
              className="toast-retry"
              onClick={() => {
                void reload().catch(() => {});
              }}
            >
              Обновить данные
            </button>
          )}
          <button onClick={clearNotice} aria-label="Закрыть сообщение">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
