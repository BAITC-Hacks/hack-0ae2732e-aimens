"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Check, ArrowUpRight } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { DataGate, TaskCard, categoryAsset } from "@/components/ui";
import { topics } from "@/domain/task";

export default function HomePage() {
  const { data } = useDemo();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const tasks = data?.tasks.filter((t) => t.publishedAt) ?? [];
  return (
    <DataGate>
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> БИЗНЕС + СТУДЕНЧЕСКИЕ КОМАНДЫ
          </div>
          <h1>
            Бизнесу — решение
            <br />
            <span>Команде — опыт</span>
          </h1>
          <p>
            Опишите, что нужно улучшить — команды предложат понятный план и прототип.
            <br />
            Вы выбираете решение, студенты получают опыт на реальном проекте.
          </p>
          <div className="hero-actions">
            <Link href="/tasks/new" className="button primary">
              Разместить задачу <ArrowUpRight size={17} />
            </Link>
            <Link href="/catalog" className="button secondary">
              Найти задачу <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-proof">
            <span className="avatar-stack">
              <i>NL</i>
              <i>QA</i>
              <i>DB</i>
            </span>
            <span>
              <strong>{data?.teams.length} команд уже в демо</strong>
              <br />
              Аналитики, разработчики и дизайнеры
            </span>
          </div>
        </div>
        <div className="hero-art">
          <Image
            src="/assets/svg/hero-illustration.svg"
            alt="Бизнес и студенческая команда вместе работают над решением задачи"
            width={680}
            height={490}
            priority
          />
          <div className="hero-caption">
            <Check size={16} />
            <span>Идея становится реальным опытом</span>
          </div>
        </div>
      </section>
      <form
        className="home-search"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/catalog?q=${encodeURIComponent(query)}`);
        }}
      >
        <Search size={22} />
        <input
          aria-label="Поиск задач на главной"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Какую задачу хотите решить?"
        />
        <span>От аналитики до первого прототипа</span>
        <button className="button primary">
          Найти задачу <ArrowRight size={17} />
        </button>
      </form>
      <section className="trust-strip" aria-label="Статистика демоплатформы">
        <div>
          <strong>{tasks.length}</strong>
          <span>открытых задач</span>
        </div>
        <div>
          <strong>{data?.teams.length}</strong>
          <span>студенческих команд</span>
        </div>
        <div>
          <strong>{topics.length}</strong>
          <span>направлений практики</span>
        </div>
        <p>
          <Check size={18} /> Открытый выбор. Прозрачный рейтинг.
          <br />
          <span>Данные демо — всё можно попробовать.</span>
        </p>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div className="heading-copy">
            <span className="eyebrow">ОТ ИНТЕРЕСА — К ДЕЛУ</span>
            <h2>Задачи, с которых стоит начать</h2>
            <p>Чем полнее описание, тем проще сделать первый шаг.</p>
          </div>
          <Link href="/catalog" className="text-link">
            Все задачи <ArrowRight size={18} />
          </Link>
        </div>
        <div className="featured-grid">
          {tasks.slice(0, 3).map((task) => (
            <TaskCard key={task.id} task={task} visual />
          ))}
        </div>
      </section>
      <section className="category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">НАЙДИТЕ СВОЁ НАПРАВЛЕНИЕ</span>
            <h2>Разные задачи. Общий интерес.</h2>
          </div>
        </div>
        <div className="category-grid">
          {topics.map((topic) => (
            <Link
              key={topic}
              href={`/catalog?topic=${encodeURIComponent(topic)}`}
              className="category-card"
            >
              <Image
                src={`/assets/svg/${categoryAsset(topic)}.svg`}
                alt=""
                width={36}
                height={36}
              />
              <strong>{topic}</strong>
              <span>
                {tasks.filter((t) => t.card.topic === topic).length} задач{" "}
                <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-section how-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ПОНЯТНО НА КАЖДОМ ШАГЕ</span>
            <h2>Вместе — от задачи к результату</h2>
          </div>
          <Link href="/guide" className="text-link">
            Как это работает <ArrowRight size={18} />
          </Link>
        </div>
        <div className="how-grid">
          {[
            [
              "01",
              "Опишите задачу",
              "Помощник задаст вопросы. Дополните карточку и узнайте её готовность.",
              "document",
            ],
            [
              "02",
              "Найдите друг друга",
              "Команды предлагают идеи. Бизнес сам решает, с кем работать.",
              "team",
            ],
            [
              "03",
              "Покажите результат",
              "Первый подтверждённый результат приносит команде опыт и 10 баллов.",
              "chart",
            ],
          ].map(([n, title, text, icon]) => (
            <article key={n}>
              <div className="how-top">
                <Image
                  src={`/assets/svg/${icon}.svg`}
                  alt=""
                  width={30}
                  height={30}
                />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="audience-grid">
        <article className="audience-business">
          <span className="eyebrow">ДЛЯ БИЗНЕСА</span>
          <h2>
            Свежий взгляд
            <br />
            на вашу задачу
          </h2>
          <p>
            Сформулируйте потребность, сравните предложения и выберите одну или
            несколько команд.
          </p>
          <Link href="/tasks/new" className="button primary">
            Начать с задачи <ArrowRight size={17} />
          </Link>
          <Image
            src="/assets/svg/company.svg"
            alt=""
            width={110}
            height={110}
          />
        </article>
        <article className="audience-students">
          <span className="eyebrow">ДЛЯ СТУДЕНТОВ</span>
          <h2>
            Практика, которую
            <br />
            хочется показать
          </h2>
          <p>
            Выбирайте задачи по интересам. Предлагайте идеи, проверяйте гипотезы
            и собирайте портфолио.
          </p>
          <Link href="/teams" className="button secondary">
            Выбрать команду <ArrowRight size={17} />
          </Link>
          <Image
            src="/assets/svg/students.svg"
            alt=""
            width={110}
            height={110}
          />
        </article>
      </section>
      <section className="final-cta">
        <div>
          <span className="eyebrow">СЛЕДУЮЩИЙ ШАГ — ВАШ</span>
          <h2>За каждой задачей — возможность.</h2>
          <p>Посмотрите, что можно сделать вместе уже сегодня.</p>
        </div>
        <Link href="/catalog" className="button primary">
          Открыть каталог <ArrowRight size={18} />
        </Link>
      </section>
    </DataGate>
  );
}
