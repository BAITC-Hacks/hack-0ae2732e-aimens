import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { computeReadiness, emptyCard } from "@/domain/task";

export default function GuidePage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">КАК ВСЁ УСТРОЕНО</div>
          <h1>От потребности к практике</h1>
          <p>
            Бизнес формулирует задачу. Команды предлагают решение. Результат
            проверяет бизнес.
          </p>
        </div>
        <Link href="/" className="button primary">
          В каталог <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="info-note">
        <Info size={18} />
        <span>
          Это демо без аккаунтов. Меняйте роль в правом верхнем углу: бизнес или
          одна из пяти команд. Созданные задачи, решения и результаты
          сохраняются после перезапуска приложения.
        </span>
      </div>
      <div className="guide-grid">
        <section className="panel">
          <div className="eyebrow">01 · ДЛЯ БИЗНЕСА</div>
          <h2>Найдите команду для задачи</h2>
          <ol>
            <li>Опишите потребность своими словами в конструкторе.</li>
            <li>
              Ответьте на 3–5 уточняющих вопросов. Без API-ключа работает явно
              обозначенный локальный помощник.
            </li>
            <li>
              Дополните карточку, проверьте сведения и подтвердите публикацию.
              Рейтинг меняется по мере заполнения.
            </li>
            <li>
              Сравните предложения в кабинете. Выберите одну или несколько
              команд либо отклоните все.
            </li>
            <li>
              Изучите первый результат и подтвердите его. Команда получит 10
              баллов.
            </li>
          </ol>
        </section>
        <section className="panel">
          <div className="eyebrow">02 · ДЛЯ КОМАНДЫ</div>
          <h2>Получите реальный опыт</h2>
          <ol>
            <li>
              Выберите демопрофиль команды. Навыки команды не ограничивают
              доступ к каталогу.
            </li>
            <li>Найдите интересную задачу. Фильтруйте по теме и готовности.</li>
            <li>
              Предложите идею, план, срок и ссылку на прототип. Даже задача с
              рейтингом ниже 40 принимает отклики.
            </li>
            <li>
              После выбора бизнесом отправьте первый результат из раздела «Мои
              отклики».
            </li>
            <li>
              Получите 10 баллов после подтверждения. Одна задача даёт команде
              эту награду только один раз.
            </li>
          </ol>
        </section>
        <section className="panel">
          <div className="eyebrow">ПРОЗРАЧНАЯ ФОРМУЛА</div>
          <h2>Из чего складывается рейтинг</h2>
          {computeReadiness(emptyCard).breakdown.map((row) => (
            <div className="guide-score-row" key={row.field}>
              <span>{row.label}</span>
              <strong>{row.max} баллов</strong>
            </div>
          ))}
          <p style={{ marginTop: 18 }}>
            Баллы считают правила приложения. Для данных нужны и материалы, и
            способ доступа; для успеха — показатель и целевое значение. Пустые
            поля и данные со статусом «нет» или «не уточнено» дают 0.
          </p>
        </section>
        <section className="panel">
          <div className="eyebrow">ЧТО ОЗНАЧАЮТ УРОВНИ</div>
          <h2>Готовность к совместной работе</h2>
          <div className="guide-score-row">
            <span>Черновик</span>
            <strong>0–39</strong>
          </div>
          <div className="guide-score-row">
            <span>Рабочая</span>
            <strong>40–69</strong>
          </div>
          <div className="guide-score-row">
            <span>Готовая</span>
            <strong>70–89</strong>
          </div>
          <div className="guide-score-row">
            <span>Приоритетная</span>
            <strong>90–100</strong>
          </div>
          <p style={{ marginTop: 18 }}>
            Рейтинг отражает полноту подтверждённых сведений. Он не проверяет
            истинность данных и реализуемость обещаний.
          </p>
          <p style={{ marginTop: 14 }}>
            В каталоге выше задачи с большим рейтингом. При равенстве —
            опубликованные раньше, затем по идентификатору. Публикация доступна
            при любом балле после подтверждения карточки.
          </p>
          <p style={{ marginTop: 14 }}>
            Изменения редактора видны как предварительные. Публичная карточка и
            её позиция обновятся вместе после подтверждённого сохранения.
          </p>
        </section>
      </div>
    </>
  );
}
