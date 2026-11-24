/* interactions.js — ЛР №11: оживляє решту сторінки.
   1) міні-тренажер у секції «Тренажер» (теми + клікабельні відповіді);
   2) форма підписки з валідацією. Усе — Vanilla JS, виведення лише через textContent. */
(() => {
  'use strict';

  // ================= 1. Міні-тренажер =================
  // Слова з {hl} підсвічуються брендовим кольором, як у макеті чату.
  const QUIZ = [
    {
      topic: 'spelling', number: 14,
      question: ['Букву ', { hl: 'и' }, ' на місці пропуску треба писати в усіх словах кожного рядка, ОКРІМ:'],
      options: ['бр…ніти, вел…тень, кр…ниця', 'гр…міти, к…шеня, ч…ревики', 'гл…бочінь, м…нулий, ч…тати', 'кр…латий, д…ректор, б…нзин'],
      correct: 1,
      explanation: 'У слові черевики пишемо е, в усіх інших словах цього рядка — и.',
    },
    {
      topic: 'stress', number: 15,
      question: ['У якому слові наголос поставлено правильно? (наголошений склад — великою літерою)'],
      options: ['кАталог', 'квартАл', 'цЕмент', 'чОрнило'],
      correct: 1,
      explanation: 'Наголос: квартАл. Решту виправляємо: каталОг, цемЕнт, чорнИло.',
    },
    {
      topic: 'simplification', number: 16,
      question: ['У якому слові спрощення в групі приголосних НЕ відбувається?'],
      options: ['щасливий', 'виїзний', 'чесний', 'кістлявий'],
      correct: 3,
      explanation: 'Винятки без спрощення: кістлявий, хвастливий, пестливий, шістнадцять. У решті слів спрощення є.',
    },
    {
      topic: 'apostrophe', number: 17,
      question: ['У якому слові апостроф НЕ пишемо?'],
      options: ['м’ясо', 'п’ять', 'в’язати', 'морквяний'],
      correct: 3,
      explanation: 'Після групи приголосних апостроф не ставимо: морквяний. У м’ясо, п’ять, в’язати він потрібен.',
    },
  ];
  const LETTERS = ['A', 'B', 'C', 'D'];

  function initQuiz() {
    const chips = Array.from(document.querySelectorAll('[data-topic]'));
    const numberEl = document.getElementById('quiz-number');
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next');
    const badgeEl = document.getElementById('quiz-badge');
    if (!chips.length || !numberEl || !questionEl || !optionsEl || !feedbackEl || !nextBtn || !badgeEl) {
      console.warn('[quiz] Не знайдено елементи міні-тренажера — блок не запущено.');
      return;
    }

    let current = 0;
    let answered = false;

    function setChips() {
      chips.forEach((chip) => {
        const active = chip.dataset.topic === QUIZ[current].topic;
        chip.setAttribute('aria-pressed', String(active));
        chip.classList.toggle('border-brand', active);
        chip.classList.toggle('text-white', active);
        chip.classList.toggle('border-surface-2', !active);
        chip.classList.toggle('text-muted', !active);
      });
    }

    function renderQuestion(index) {
      current = index;
      answered = false;
      const item = QUIZ[index];

      numberEl.textContent = 'Питання #' + item.number;
      questionEl.replaceChildren(
        ...item.question.map((part) => {
          if (typeof part === 'string') return document.createTextNode(part);
          const span = document.createElement('span');
          span.className = 'text-brand';
          span.textContent = part.hl;
          return span;
        })
      );

      optionsEl.replaceChildren(
        ...item.options.map((text, i) => {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.dataset.index = String(i);
          btn.className = 'quiz-option flex min-h-11 w-full items-center gap-2 rounded-lg border border-surface-2 bg-ink p-2.5 text-left text-xs transition-colors hover:border-brand';
          const letter = document.createElement('b');
          letter.className = 'quiz-letter inline-grid size-5 shrink-0 place-items-center rounded bg-surface-2';
          letter.textContent = LETTERS[i];
          btn.append(letter, document.createTextNode(text));
          li.append(btn);
          return li;
        })
      );

      feedbackEl.textContent = '';
      nextBtn.classList.add('hidden');
      badgeEl.classList.add('invisible');
      setChips();
    }

    function answer(index) {
      if (answered) return; // повторні швидкі кліки ігноруємо
      answered = true;
      const item = QUIZ[current];
      const buttons = Array.from(optionsEl.querySelectorAll('button'));

      buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === item.correct) btn.classList.add('quiz-option--correct');
        else if (i === index) btn.classList.add('quiz-option--wrong');
      });

      const ok = index === item.correct;
      badgeEl.classList.toggle('invisible', !ok);
      feedbackEl.textContent = (ok ? 'Правильно! ' : 'Не зовсім. ') + item.explanation;
      nextBtn.classList.remove('hidden');
      nextBtn.focus();
      // Таймер знижки слухає цю подію: після мікротесту знижка знову доступна
      window.dispatchEvent(new CustomEvent('ukrmovych:answered'));
    }

    optionsEl.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-index]');
      if (btn && optionsEl.contains(btn)) answer(Number(btn.dataset.index));
    });
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const index = QUIZ.findIndex((item) => item.topic === chip.dataset.topic);
        if (index !== -1) renderQuestion(index);
      });
    });
    nextBtn.addEventListener('click', () => renderQuestion((current + 1) % QUIZ.length));

    renderQuestion(0);
  }

  // ================= 2. Форма підписки у футері =================
  const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  function initSubscribe() {
    const form = document.querySelector('[data-mail-form="subscribe"]');
    const input = document.getElementById('sub-email');
    const status = document.getElementById('sub-status');
    if (!form || !input || !status) return;
    const button = form.querySelector('button[type="submit"]');
    let busy = false;

    function setStatus(message, ok) {
      status.textContent = message; // тільки textContent
      status.classList.toggle('text-success', ok);
      status.classList.toggle('text-red-400', !ok);
    }

    input.addEventListener('input', () => {
      input.classList.remove('border-red-500');
      input.setAttribute('aria-invalid', 'false');
      status.textContent = '';
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (busy) return; // захист від повторних натискань
      const value = input.value.trim();
      if (!REGEX_EMAIL.test(value)) {
        input.classList.add('border-red-500');
        input.setAttribute('aria-invalid', 'true');
        setStatus('Введіть коректну адресу, наприклад user@gmail.com.', false);
        input.focus();
        return;
      }
      busy = true;
      if (button) button.disabled = true;
      form.reset();
      setStatus('Дякуємо! Підписку оформлено (демонстрація).', true);
      window.setTimeout(() => { busy = false; if (button) button.disabled = false; }, 1500);
    });
  }

  function init() {
    initQuiz();
    initSubscribe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
