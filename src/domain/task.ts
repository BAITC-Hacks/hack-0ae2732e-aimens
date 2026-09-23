import { z } from "zod";

export const topics = [
  "Торговля",
  "Образование",
  "Логистика",
  "Здоровье",
  "Производство",
  "Финансы",
  "Туризм",
  "Сельское хозяйство",
  "Маркетинг",
  "IT и данные",
  "Экология",
  "Сервисы",
] as const;
export type Topic = (typeof topics)[number];
export const teamIconOptions = [
  { key: "shanyrak", label: "Шанырак" },
  { key: "yurt", label: "Юрта" },
  { key: "horse", label: "Конь" },
  { key: "tulpar", label: "Тулпар" },
  { key: "ornament", label: "Орнамент" },
  { key: "steppe", label: "Степь" },
  { key: "tulip", label: "Тюльпан" },
  { key: "sun", label: "Солнце" },
  { key: "bow", label: "Садак" },
  { key: "eagle", label: "Беркут" },
] as const;
export type TeamIconKey = (typeof teamIconOptions)[number]["key"];
export type TopicSuggestion = {
  topic: Topic;
  confidence: number;
  reason: string;
  mode: "openai" | "local";
};
export const accessLabels = {
  unknown: "Не уточнено",
  public: "Публичный источник",
  provided: "Будут предоставлены",
  request: "По запросу",
  none: "Данных нет",
} as const;
export const workFormatLabels = {
  remote: "Удалённо",
  hybrid: "Гибридный формат",
  onsite: "На месте",
  unspecified: "Формат не указан",
} as const;
export type WorkFormat = keyof typeof workFormatLabels;
export const workFormats = Object.entries(workFormatLabels).map(
  ([key, label]) => ({ key: key as WorkFormat, label }),
);
const text = z.string().trim().max(4000);
export const cardSchema = z.object({
  title: z.string().trim().max(160),
  topic: z.string().trim().max(60),
  context: text,
  need: text,
  users: text,
  dataDescription: text,
  dataAccess: z.enum(["unknown", "public", "provided", "request", "none"]),
  expectedResult: text,
  successMetric: text,
  successTarget: text,
  constraints: text,
  contact: text,
  interaction: text,
  workFormat: z
    .enum(["remote", "hybrid", "onsite", "unspecified"])
    .default("unspecified"),
  skills: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});
export type Card = z.infer<typeof cardSchema>;
export const emptyCard: Card = {
  title: "",
  topic: "Торговля",
  context: "",
  need: "",
  users: "",
  dataDescription: "",
  dataAccess: "unknown",
  expectedResult: "",
  successMetric: "",
  successTarget: "",
  constraints: "",
  contact: "",
  interaction: "",
  workFormat: "unspecified",
  skills: [],
};
export const fields = [
  {
    key: "context",
    label: "Что происходит сейчас",
    hint: "Опишите текущий процесс и его сложности",
  },
  {
    key: "need",
    label: "Что нужно изменить",
    hint: "Какую проблему должна решить команда?",
  },
  {
    key: "users",
    label: "Для кого решение",
    hint: "Кто будет пользоваться результатом?",
  },
  {
    key: "dataDescription",
    label: "Данные и материалы",
    hint: "Какие таблицы, примеры или источники доступны?",
  },
  {
    key: "expectedResult",
    label: "Ожидаемый результат",
    hint: "Прототип, отчёт, модель или работающий сервис",
  },
  {
    key: "successMetric",
    label: "Показатель успеха",
    hint: "Что измеряем: время, точность, количество ошибок?",
  },
  {
    key: "successTarget",
    label: "Целевое значение",
    hint: "Например: сократить время до 2 минут",
  },
  {
    key: "constraints",
    label: "Ограничения",
    hint: "Сроки, технологии, доступы или другие границы",
  },
  {
    key: "contact",
    label: "Контакт бизнеса",
    hint: "Почта или другой способ связи",
  },
  {
    key: "interaction",
    label: "Как будем взаимодействовать",
    hint: "Как часто доступны консультации и обратная связь?",
  },
] as const;
export type FieldKey = (typeof fields)[number]["key"];
export type QualityDimension = {
  field: FieldKey;
  label: string;
  max: number;
  score: number;
  reason: string;
};
export type QualityAssessment = {
  score: number;
  summary: string;
  dimensions: QualityDimension[];
  mode: "openai" | "local";
};
export const levels = [
  { key: "draft", label: "Черновик", min: 0 },
  { key: "working", label: "Рабочая", min: 40 },
  { key: "ready", label: "Готовая", min: 70 },
  { key: "priority", label: "Приоритетная", min: 90 },
] as const;
export function readinessLevel(score: number) {
  return [...levels].reverse().find((level) => score >= level.min) ?? levels[0];
}
export function normalizeMeaningfulText(value: string) {
  const normalized = value.normalize("NFKC").replace(/\s+/gu, " ").trim();
  return /[\p{L}\p{N}]/u.test(normalized) ? normalized : "";
}

function normalizeComparableText(value: string) {
  return normalizeMeaningfulText(value)
    .toLocaleLowerCase("ru")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

const absentDataPhrases = new Set([
  "нет",
  "нету",
  "нет данных",
  "нету данных",
  "данных нет",
  "пока нет данных",
  "данных пока нет",
  "данные отсутствуют",
  "данные пока отсутствуют",
  "пока данные отсутствуют",
  "данные не предоставлены",
  "данные пока не предоставлены",
  "данных не предоставлено",
  "данных пока не предоставлено",
  "данные не указаны",
  "данные пока не указаны",
  "данных не указано",
  "данных пока не указано",
  "данные не уточнены",
  "данные пока не уточнены",
  "данных не уточнено",
  "данных пока не уточнено",
  "данных не имеется",
  "данных пока не имеется",
  "информации нет",
  "информация отсутствует",
  "материалов нет",
  "материалы отсутствуют",
  "не уточнено",
  "не указано",
  "неизвестно",
  "не известно",
  "пока неизвестно",
  "пока не известно",
  "отсутствует",
  "отсутствуют",
]);

export function hasMeaningfulDataDescription(value: string) {
  return (
    !!normalizeMeaningfulText(value) &&
    !absentDataPhrases.has(normalizeComparableText(value))
  );
}

const junkAnswers = new Set([
  "123",
  "12345",
  "test",
  "тест",
  "asdf",
  "qwerty",
  "хрень",
  "заглушка",
  "не знаю",
  "потом",
  "lorem ipsum",
  "asdfasdf lorem ipsum",
  "asdfasdf",
  "qwertyuiop",
  "bla bla",
  "не знаю что написать",
]);

export function isUsefulAnswer(value: string, minWords = 2, minLength = 8) {
  const normalized = normalizeMeaningfulText(value);
  if (!normalized || normalized.length < minLength) return false;
  const comparable = normalizeComparableText(normalized);
  if (junkAnswers.has(comparable)) return false;
  const words = comparable.split(" ").filter((word) => word.length > 1);
  if (/(?:asdf|qwerty|lorem|ipsum|xxx|тесттест)/iu.test(comparable))
    return false;
  if (words.length >= 2 && new Set(words).size < Math.min(minWords, 2))
    return false;
  return words.length >= minWords;
}

export function computeReadiness(card: Card) {
  const has = (key: FieldKey) => {
    if (key === "contact")
      return (
        /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/u.test(card.contact) ||
        /https?:\/\/\S+/u.test(card.contact) ||
        (() => {
          const value = card.contact.trim();
          const digits = value.replace(/\D/gu, "").length;
          return digits >= 8 && digits <= 15 && /^[+\d()\s.-]+$/u.test(value);
        })()
      );
    if (key === "interaction") return isUsefulAnswer(card.interaction, 2, 12);
    if (key === "successMetric")
      return isUsefulAnswer(card.successMetric, 2, 8);
    if (key === "successTarget")
      return (
        isUsefulAnswer(card.successTarget, 1, 2) &&
        (/[\d%]/u.test(card.successTarget) ||
          /(?:снизить|увеличить|сократить|не более|не менее|минимум|максимум|до |от )/iu.test(
            card.successTarget,
          ))
      );
    return isUsefulAnswer(
      card[key],
      key === "users" ? 1 : 2,
      key === "users" ? 5 : 8,
    );
  };
  const hasData =
    hasMeaningfulDataDescription(card.dataDescription) &&
    isUsefulAnswer(card.dataDescription, 2, 12);
  const checks: [string, number, boolean, FieldKey, string][] = [
    ["Контекст", 10, has("context"), "context", "Опишите текущую ситуацию"],
    ["Потребность", 10, has("need"), "need", "Сформулируйте проблему"],
    [
      "Данные и доступ",
      20,
      hasData && !["unknown", "none"].includes(card.dataAccess),
      "dataDescription",
      "Укажите материалы и способ доступа",
    ],
    [
      "Результат",
      15,
      has("expectedResult"),
      "expectedResult",
      "Опишите ожидаемый результат",
    ],
    [
      "Критерий успеха",
      15,
      has("successMetric") && has("successTarget"),
      "successMetric",
      "Задайте показатель и целевое значение",
    ],
    [
      "Ограничения",
      10,
      has("constraints"),
      "constraints",
      "Обозначьте ограничения",
    ],
    [
      "Пользователи",
      10,
      has("users"),
      "users",
      "Укажите пользователей решения",
    ],
    ["Контакт", 5, has("contact"), "contact", "Добавьте контакт бизнеса"],
    [
      "Взаимодействие",
      5,
      has("interaction"),
      "interaction",
      "Опишите формат обратной связи",
    ],
  ];
  const breakdown = checks.map(([label, max, complete, field, tip]) => ({
    label,
    max,
    earned: complete ? max : 0,
    complete,
    field,
    tip,
  }));
  const score = breakdown.reduce((sum, row) => sum + row.earned, 0);
  return {
    score,
    level: readinessLevel(score),
    breakdown,
    missing: breakdown.filter((row) => !row.complete),
  };
}
export type Readiness = ReturnType<typeof computeReadiness>;
export function readinessFromAssessment(
  assessment: QualityAssessment,
): Readiness {
  const breakdown = assessment.dimensions.map((item) => ({
    label: item.label,
    max: item.max,
    earned: item.score,
    complete: item.score >= item.max,
    field: item.field,
    tip: item.reason,
  }));
  return {
    score: assessment.score,
    level: readinessLevel(assessment.score),
    breakdown,
    missing: breakdown.filter((row) => !row.complete),
  };
}
export type Task = {
  id: string;
  card: Card;
  rawDescription: string;
  company: string;
  createdAt: string;
  publishedAt: string | null;
  confirmedAt: string | null;
  readiness: Readiness;
  qualityAssessment?: QualityAssessment | null;
  proposalCount: number;
};
export type Team = {
  id: string;
  name: string;
  tagline: string;
  skills: string[];
  interests: string[];
  initials: string;
  points: number;
  university?: string;
  memberCount?: number;
  technologies?: string[];
  iconKey?: TeamIconKey;
  isCustom?: boolean;
};
export type Proposal = {
  id: string;
  taskId: string;
  teamId: string;
  idea: string;
  plan: string;
  duration: string;
  link: string;
  status: "pending" | "selected" | "rejected";
  createdAt: string;
};
export type Progress = {
  id: string;
  taskId: string;
  teamId: string;
  description: string;
  link: string;
  submittedAt: string;
  confirmedAt: string | null;
};
export type Snapshot = {
  tasks: Task[];
  teams: Team[];
  proposals: Proposal[];
  progress: Progress[];
};
const required = z
  .string()
  .trim()
  .min(1, "Заполните обязательное поле")
  .max(4000);
const webLink = z
  .string()
  .trim()
  .url("Введите корректную ссылку")
  .max(2000)
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "Ссылка должна начинаться с http:// или https://",
  );
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("save-task"),
    id: z.string().optional(),
    card: cardSchema,
    rawDescription: text,
    confirmed: z.boolean(),
    publish: z.boolean(),
    reviewToken: z.string().uuid().optional(),
  }),
  z.object({
    type: z.literal("create-team"),
    name: z.string().trim().min(2).max(60),
    interests: z.array(z.enum(topics)).min(1).max(4),
    iconKey: z.enum([
      "shanyrak",
      "yurt",
      "horse",
      "tulpar",
      "ornament",
      "steppe",
      "tulip",
      "sun",
      "bow",
      "eagle",
    ]),
  }),
  z.object({
    type: z.literal("propose"),
    taskId: required,
    idea: required,
    plan: required,
    duration: required,
    link: webLink,
  }),
  z.object({
    type: z.literal("decide"),
    proposalId: required,
    status: z.enum(["selected", "rejected"]),
  }),
  z.object({
    type: z.literal("submit-progress"),
    taskId: required,
    description: required,
    link: webLink,
  }),
  z.object({ type: z.literal("confirm-progress"), progressId: required }),
]);
export type Action = z.infer<typeof actionSchema>;
export type ActionResult = {
  taskId?: string;
  proposalId?: string;
  progressId?: string;
  teamId?: string;
};
export type Analysis = {
  mode: "openai" | "local";
  message: string;
  suggestions: Partial<Record<FieldKey, string>>;
  sources: Partial<Record<FieldKey, string>>;
  missingFields: (keyof Card)[];
  questions: { field: FieldKey; question: string }[];
  preliminaryReadiness?: Readiness;
};
