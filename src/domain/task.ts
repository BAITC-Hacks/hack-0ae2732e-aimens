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

// Heuristic for optional advice only; readiness measures confirmed completeness.
export function isUsefulAnswer(value: string, minWords = 2, minLength = 8) {
  const normalized = normalizeMeaningfulText(value);
  if (!normalized || normalized.length < minLength) return false;
  const comparable = normalizeComparableText(normalized);
  if (junkAnswers.has(comparable)) return false;
  const words = comparable.split(" ").filter((word) => word.length > 1);
  if (/(?:asdf|qwerty|lorem|ipsum|xxx|тесттест)/iu.test(comparable))
    return false;
  const uniqueWords = new Set(words);
  if (words.length >= 2 && uniqueWords.size < Math.min(minWords, 2))
    return false;
  if (words.length >= 3 && uniqueWords.size / words.length < 0.5) return false;
  // Reject keyboard mash while allowing short legitimate abbreviations (AI, KPI).
  const letters = comparable.replace(/[^\p{L}]/gu, "");
  const vowels = (letters.match(/[aeiouyаеёиоуыэюяәіңғүұқөһ]/giu) ?? []).length;
  if (letters.length >= 8 && vowels / letters.length < 0.12) return false;
  return words.length >= minWords;
}

export function computeReadiness(card: Card) {
  const has = (key: FieldKey) => !!normalizeMeaningfulText(card[key]);
  const hasData = hasMeaningfulDataDescription(card.dataDescription);
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
// Advisory scores have their own boundary and never replace computeReadiness.
export const qualityAssessmentSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    summary: z.string().trim().min(3).max(500),
    mode: z.enum(["openai", "local"]),
    dimensions: z
      .array(
        z.object({
          field: z.enum(
            fields.map((field) => field.key) as [FieldKey, ...FieldKey[]],
          ),
          label: z.string().trim().min(1).max(100),
          max: z.number().int().min(1).max(20),
          score: z.number().int().min(0).max(20),
          reason: z.string().trim().min(3).max(240),
        }),
      )
      .length(9),
  })
  .superRefine((assessment, context) => {
    const expected = computeReadiness(emptyCard).breakdown;
    const validDimensions = expected.every((rule) => {
      const matching = assessment.dimensions.filter(
        (row) => row.field === rule.field,
      );
      return (
        matching.length === 1 &&
        matching[0].max === rule.max &&
        matching[0].score <= rule.max
      );
    });
    const total = assessment.dimensions.reduce(
      (sum, row) => sum + row.score,
      0,
    );
    if (!validDimensions || total !== assessment.score) {
      context.addIssue({
        code: "custom",
        message: "Некорректная разбивка рекомендательной оценки",
      });
    }
  });
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
