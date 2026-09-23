"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Users } from "lucide-react";
import {
  teamIconOptions,
  topics,
  type TeamIconKey,
  type Topic,
} from "@/domain/task";
import { useDemo } from "@/components/demo-provider";
import { TeamIcon } from "@/components/team-icon";

export default function CreateTeamPage() {
  const { act, setActor, busy } = useDemo();
  const router = useRouter();
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<Topic[]>([]);
  const [iconKey, setIconKey] = useState<TeamIconKey>("shanyrak");
  const [error, setError] = useState("");

  const toggleInterest = (topic: Topic) => {
    setInterests((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : current.length < 4
          ? [...current, topic]
          : current,
    );
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (interests.length === 0) {
      setError("Выберите хотя бы одно направление команды.");
      return;
    }
    try {
      const result = await act(
        { type: "create-team", name, interests, iconKey },
        "Команда создана. Вы вошли в её профиль.",
      );
      if (!result.teamId) throw new Error("Сервер не вернул профиль команды.");
      setActor(result.teamId);
      router.push("/team");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось создать команду.",
      );
    }
  }

  return (
    <div className="page-wrap narrow-page">
      <Link className="text-link" href="/teams">
        <ArrowLeft size={16} /> Все команды
      </Link>
      <div className="page-heading" style={{ marginTop: 24 }}>
        <div>
          <div className="eyebrow">ОТДЕЛЬНО ОТ ПРОФИЛЯ БИЗНЕСА</div>
          <h1>Создайте профиль команды</h1>
          <p>
            Название, направления и символ помогут бизнесу узнать вашу команду.
            После создания вы сможете переключаться между бизнесом и командой.
          </p>
        </div>
      </div>

      <form className="panel create-team-form" onSubmit={submit}>
        <label className="field" htmlFor="team-name">
          <span>Название команды</span>
          <input
            id="team-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={60}
            required
            placeholder="Например, Qyran Lab"
          />
          <small className="muted">
            Выберите короткое имя, которое будет видно в каталоге и откликах.
          </small>
        </label>

        <fieldset className="team-choice-group">
          <legend>
            Чем занимается команда <small>выберите от 1 до 4 направлений</small>
          </legend>
          <div className="team-topic-options">
            {topics.map((topic) => (
              <label
                className={
                  "team-topic-option " +
                  (interests.includes(topic) ? "selected" : "")
                }
                key={topic}
              >
                <input
                  type="checkbox"
                  checked={interests.includes(topic)}
                  onChange={() => toggleInterest(topic)}
                  disabled={!interests.includes(topic) && interests.length >= 4}
                />
                <span>{topic}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="team-choice-group">
          <legend>Значок команды <small>10 символов с мотивами Казахстана</small></legend>
          <div className="team-icon-options">
            {teamIconOptions.map((option) => (
              <button
                className={
                  "team-icon-option " +
                  (iconKey === option.key ? "selected" : "")
                }
                type="button"
                key={option.key}
                aria-pressed={iconKey === option.key}
                onClick={() => setIconKey(option.key)}
              >
                <TeamIcon iconKey={option.key} size={26} />
                <span>{option.label}</span>
                {iconKey === option.key && (
                  <Check size={14} className="icon-choice-check" />
                )}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="info-note">
          <Users size={18} />В деморежиме команда создаётся сразу и становится
          активным профилем.
        </div>
        <div className="form-actions">
          <button
            className="button primary"
            type="submit"
            disabled={busy || name.trim().length < 2 || interests.length === 0}
          >
            {busy ? "Создаём команду…" : "Создать команду"}
          </button>
          <Link className="button secondary" href="/teams">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
