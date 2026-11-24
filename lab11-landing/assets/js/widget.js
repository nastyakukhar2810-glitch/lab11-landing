/* widget.js — ЛР №11: калькулятор прогнозу балів НМТ (Vanilla JS).
   Захисне програмування: HTML5-атрибути + JS-валідація + безпечний вивід (лише textContent).
   Код ізольований в IIFE: нічого не потрапляє в глобальну область, а на сторінці
   може бути кілька екземплярів віджета ([data-widget="score-calculator"]). */
(() => {
  'use strict';

  // ===== Бізнес-правила (єдине місце, де лежать числа) =====
  const LIMITS = {
    score:   { min: 100, max: 200, message: 'Введіть свій поточний бал від 100 до 200.' },
    days:    { min: 1,   max: 365, message: 'Введіть кількість днів від 1 до 365.' },
    minutes: { min: 5,   max: 120, message: 'Оберіть час на день від 5 до 120 хвилин.' },
  };
  const TOPIC_FACTORS = { all: 1, stress: 1.2, spelling: 1, simplification: 0.9, apostrophe: 0.8 };
  const BONUSES = { spaced: 0.25, review: 0.15, streak: 0.1 };
  const TOPIC_MESSAGE = 'Оберіть тему зі списку.';
  const MAX_SCORE = 200;
  const TASKS_PER_MINUTE = 3; // одне завдання ≈ 20 секунд
  const DEFAULTS = { score: '150', days: '60', minutes: '20', topic: 'all' };

  const numberFormat = new Intl.NumberFormat('uk-UA');
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  // ===== Читання та нормалізація: усе з HTML — рядок, "брудні" дані =====
  function readInteger(input) {
    if (input.validity && input.validity.badInput) return NaN; // наприклад, "e" або "--5"
    const raw = String(input.value).trim();
    if (raw === '') return NaN;                                // порожнє поле
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;           // NaN / Infinity відсікаємо; 2.7 → 2
  }

  function checkRange(value, limits) {
    return Number.isInteger(value) && value >= limits.min && value <= limits.max;
  }

  // ===== Чиста функція розрахунку (нічого не знає про DOM) =====
  function calculate({ score, days, minutes, topic, spaced, review, streak }) {
    const multiplier = 1 + (spaced ? BONUSES.spaced : 0) + (review ? BONUSES.review : 0) + (streak ? BONUSES.streak : 0);
    const rawGain = Math.round((days * minutes / 100) * TOPIC_FACTORS[topic] * multiplier);
    const gain = Math.min(rawGain, MAX_SCORE - score); // стеля 200 балів
    return {
      gain,
      projected: score + gain,
      tasks: days * minutes * TASKS_PER_MINUTE,
      capped: rawGain > MAX_SCORE - score,
    };
  }

  // ===== Ініціалізація одного екземпляра віджета =====
  function initWidget(root) {
    const q = (selector) => root.querySelector(selector);
    const fields = {
      score: q('[data-field="score"]'),
      days: q('[data-field="days"]'),
      minutes: q('[data-field="minutes"]'),
      topic: q('[data-field="topic"]'),
      spaced: q('[data-field="spaced"]'),
      review: q('[data-field="review"]'),
      streak: q('[data-field="streak"]'),
    };
    const errors = {
      score: q('[data-error="score"]'),
      days: q('[data-error="days"]'),
      minutes: q('[data-error="minutes"]'),
      topic: q('[data-error="topic"]'),
    };
    const ui = {
      form: q('[data-calc="form"]'),
      reset: q('[data-calc="reset"]'),
      minutesOut: q('[data-out="minutes"]'),
      projected: q('[data-result="projected"]'),
      gain: q('[data-result="gain"]'),
      tasks: q('[data-result="tasks"]'),
      note: q('[data-result="note"]'),
    };

    // Відсутній елемент не повинен «класти» сторінку: гасимо віджет, решта JS працює
    const missing = [fields, errors, ui]
      .flatMap((group) => Object.entries(group))
      .filter(([, element]) => !element)
      .map(([name]) => name);
    if (missing.length > 0) {
      console.warn('[widget] Не знайдено елементи, віджет не запущено:', missing.join(', '));
      return;
    }

    function setFieldError(name, message) {
      const input = fields[name];
      const invalid = Boolean(message);
      input.setAttribute('aria-invalid', String(invalid));
      if (input.type !== 'range') {
        input.classList.toggle('border-red-500', invalid);
        input.classList.toggle('border-surface-2', !invalid);
      }
      errors[name].textContent = message; // тільки textContent — жодного innerHTML
      errors[name].classList.toggle('hidden', !invalid);
    }

    function showPlaceholders(noteText) {
      ui.projected.textContent = '—';
      ui.gain.textContent = '—';
      ui.tasks.textContent = '—';
      ui.note.textContent = noteText;
    }

    function render() {
      const score = readInteger(fields.score);
      const days = readInteger(fields.days);
      const minutes = readInteger(fields.minutes);
      const topic = fields.topic.value;

      const messages = {
        score: checkRange(score, LIMITS.score) ? '' : LIMITS.score.message,
        days: checkRange(days, LIMITS.days) ? '' : LIMITS.days.message,
        minutes: checkRange(minutes, LIMITS.minutes) ? '' : LIMITS.minutes.message,
        topic: hasOwn(TOPIC_FACTORS, topic) ? '' : TOPIC_MESSAGE,
      };
      Object.keys(messages).forEach((name) => setFieldError(name, messages[name]));

      ui.minutesOut.textContent = (checkRange(minutes, LIMITS.minutes) ? minutes : '—') + ' хв';

      if (Object.values(messages).some(Boolean)) {
        showPlaceholders('Виправте поля з помилками — і прогноз з’явиться.');
        return;
      }

      const result = calculate({
        score, days, minutes, topic,
        spaced: fields.spaced.checked,
        review: fields.review.checked,
        streak: fields.streak.checked,
      });

      ui.projected.textContent = numberFormat.format(result.projected);
      ui.gain.textContent = '+' + numberFormat.format(result.gain);
      ui.tasks.textContent = '≈ ' + numberFormat.format(result.tasks);
      if (score >= MAX_SCORE) {
        ui.note.textContent = 'Ти вже на максимумі — 200 балів. Підтримуй форму повтореннями.';
      } else if (result.capped) {
        ui.note.textContent = 'Прогноз впирається в стелю 200 балів — можна вчитися менше за день.';
      } else {
        ui.note.textContent = 'Орієнтовний прогноз: чим регулярніше вчишся, тим швидше росте бал.';
      }
    }

    // Швидке хаотичне введення: перераховуємо не частіше за один кадр
    let frame = 0;
    function scheduleRender() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; render(); });
    }

    ui.form.addEventListener('input', scheduleRender);
    ui.form.addEventListener('change', (event) => {
      // Дробове значення нормалізуємо в самому полі: 2.7 → 2
      const input = event.target;
      if (input === fields.score || input === fields.days) {
        const n = Number(String(input.value).trim());
        if (input.value !== '' && Number.isFinite(n) && n !== Math.trunc(n)) {
          input.value = String(Math.trunc(n));
        }
      }
      scheduleRender();
    });
    ui.form.addEventListener('submit', (event) => event.preventDefault()); // Enter не перезавантажує сторінку

    ui.reset.addEventListener('click', () => {
      fields.score.value = DEFAULTS.score;
      fields.days.value = DEFAULTS.days;
      fields.minutes.value = DEFAULTS.minutes;
      fields.topic.value = DEFAULTS.topic;
      fields.spaced.checked = false;
      fields.review.checked = false;
      fields.streak.checked = false;
      render();
    });

    render();
  }

  function initAll() {
    document.querySelectorAll('[data-widget="score-calculator"]').forEach(initWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
