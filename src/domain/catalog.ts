import { type Task, type Team, type WorkFormat, levels } from "./task";

export type CatalogSort = "readiness" | "newest" | "oldest";
export type CatalogFilters = {
  query?: string;
  topic?: string;
  level?: (typeof levels)[number]["key"] | "";
  workFormat?: WorkFormat | "";
  sort?: CatalogSort;
};

const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase("ru").trim();

function comparePublication(a: Task, b: Task) {
  return (a.publishedAt ?? "").localeCompare(b.publishedAt ?? "");
}

export function compareCatalogTasks(a: Task, b: Task) {
  return (
    b.readiness.score - a.readiness.score ||
    comparePublication(a, b) ||
    a.id.localeCompare(b.id)
  );
}

/** Filters only the presentation; readiness never restricts access to a task. */
export function filterCatalog(tasks: Task[], filters: CatalogFilters = {}) {
  const terms = normalize(filters.query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const filtered = tasks.filter((task) => {
    if (!task.publishedAt) return false;
    if (filters.topic && task.card.topic !== filters.topic) return false;
    if (filters.level && task.readiness.level.key !== filters.level)
      return false;
    if (
      filters.workFormat &&
      (task.card.workFormat ?? "unspecified") !== filters.workFormat
    )
      return false;
    const searchable = normalize(
      [
        task.company,
        task.card.title,
        task.card.topic,
        task.card.context,
        task.card.need,
        task.card.expectedResult,
        ...(task.card.skills ?? []),
      ].join(" "),
    );
    return terms.every((term) => searchable.includes(term));
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "newest")
      return comparePublication(b, a) || a.id.localeCompare(b.id);
    if (filters.sort === "oldest")
      return comparePublication(a, b) || a.id.localeCompare(b.id);
    return compareCatalogTasks(a, b);
  });
}

export type TaskRecommendation = {
  task: Task;
  /** Counts profile matches and is independent from the task readiness score. */
  matchScore: number;
  reasons: string[];
};

export function recommendationForTask(
  task: Task,
  team: Team,
): TaskRecommendation {
  const topicMatches = team.interests.some(
    (interest) => normalize(interest) === normalize(task.card.topic),
  );
  const teamSkills = new Set(
    [...team.skills, ...(team.technologies ?? [])].map(normalize),
  );
  const seen = new Set<string>();
  const matchedSkills = (task.card.skills ?? []).filter((skill) => {
    const key = normalize(skill);
    if (!teamSkills.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const reasons: string[] = [];
  if (topicMatches)
    reasons.push(`Тема «${task.card.topic}» входит в интересы команды`);
  if (matchedSkills.length)
    reasons.push(`Совпадают навыки: ${matchedSkills.join(", ")}`);
  return {
    task,
    matchScore: (topicMatches ? 2 : 0) + matchedSkills.length,
    reasons,
  };
}

/** A separate suggestion list; callers keep the complete catalog available. */
export function recommendTasks(
  tasks: Task[],
  team?: Team,
  limit = 3,
): TaskRecommendation[] {
  if (!team || limit <= 0) return [];
  return tasks
    .filter((task) => task.publishedAt)
    .map((task) => recommendationForTask(task, team))
    .filter((match) => match.matchScore > 0)
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore || compareCatalogTasks(a.task, b.task),
    )
    .slice(0, limit);
}
