/* pay.js — сторінка оплати: клієнт вказує ім’я та контакти, після чого переходить на оплату monobank.
   Сюди ведуть кнопки «Забрати доступ» / «Почати навчання» та QR-код з головної сторінки.
   Захисне програмування: HTML5-атрибути + JS-валідація + безпечний вивід (лише textContent),
   блокування кнопки від подвійного натискання. Код ізольований в IIFE. */
(() => {
  'use strict';

  // ===== Налаштування =====
  const MONOBANK_URL = 'https://base.monobank.ua/sp/9sTVYuCPsjT6M5';
  const STORAGE_KEY = 'ukrmovych:order';
  const SEND_TIMEOUT_MS = 8000;
  const PRICE = 99;

  // ===== Правила: повертають текст помилки або '' =====
  const REGEX_NAME = /^[\p{L}][\p{L}'’ʼ\- ]{1,59}$/u;
  const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const REGEX_PHONE = /^\+380\d{9}$/;

  const RULES = {
    name: (v) => (REGEX_NAME.test(v.trim()) ? '' : 'Введіть ім’я від 2 символів: лише літери, пробіл, дефіс або апостроф.'),
    email: (v) => (v.trim().length <= 120 && REGEX_EMAIL.test(v.trim()) ? '' : 'Введіть коректну електронну адресу, наприклад user@gmail.com.'),
    phone: (v) => (REGEX_PHONE.test(v) ? '' : 'Формат номера: +380XXXXXXXXX (9 цифр після +380).'),
  };
  const AGREE_ERROR = 'Потрібна згода з офертою та політикою конфіденційності.';

  // 0501234567 → +380501234567; будь-які пробіли, дужки й дефіси відсікаємо
  function normalizePhone(raw) {
    let digits = String(raw).replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '38' + digits;
    return digits ? '+' + digits.slice(0, 12) : '';
  }

  // sessionStorage може бути недоступним (приватний режим) — тоді просто працюємо без нього
  function readSaved() {
    try {
      const data = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
      return data && typeof data === 'object' ? data : null;
    } catch (error) {
      return null;
    }
  }
  function save(order) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (error) {
      /* не критично */
    }
  }

  function init() {
    const form = document.getElementById('pay-form');
    if (!form) return;
    const q = (selector) => form.querySelector(selector);
    const fields = { name: q('[data-field="name"]'), email: q('[data-field="email"]'), phone: q('[data-field="phone"]'), agree: q('[data-field="agree"]') };
    const errors = { name: q('[data-error="name"]'), email: q('[data-error="email"]'), phone: q('[data-error="phone"]'), agree: q('[data-error="agree"]') };
    const submit = document.getElementById('pay-submit');
    const status = document.getElementById('pay-status');
    const label = q('[data-submit-label]');

    const missing = [fields, errors].flatMap((g) => Object.entries(g)).filter(([, el]) => !el).map(([n]) => n);
    if (missing.length || !submit || !status) {
      console.warn('[pay] Не знайдено елементи форми оплати:', missing.join(', '));
      return;
    }

    const touched = new Set();
    let busy = false;
    const defaultLabel = label ? label.textContent : '';

    function setStatus(message, ok) {
      status.textContent = message; // тільки textContent
      status.classList.toggle('text-success', ok === true);
      status.classList.toggle('text-red-400', ok === false);
    }

    function setBusy(value) {
      busy = value;
      submit.disabled = value;
      submit.setAttribute('aria-busy', String(value));
      if (label) label.textContent = value ? 'Зачекайте…' : defaultLabel;
    }

    function paint(name, message, validated) {
      const input = fields[name];
      const invalid = Boolean(message);
      input.setAttribute('aria-invalid', String(invalid));
      if (input.type !== 'checkbox') {
        input.classList.toggle('border-red-500', invalid);
        input.classList.toggle('border-green-500', !invalid && validated);
        input.classList.toggle('border-surface-2', !invalid && !validated);
      }
      errors[name].textContent = message;
      errors[name].classList.toggle('hidden', !invalid);
    }

    function validate(name) {
      const input = fields[name];
      const message = name === 'agree' ? (input.checked ? '' : AGREE_ERROR) : RULES[name](input.value);
      paint(name, message, true);
      return !message;
    }

    Object.keys(fields).forEach((name) => {
      const input = fields[name];
      input.addEventListener(name === 'agree' ? 'change' : 'input', () => {
        if (name === 'phone') input.value = normalizePhone(input.value);
        touched.add(name);
        validate(name);
      });
      input.addEventListener('blur', () => {
        if (touched.has(name)) validate(name);
      });
    });

    // Повернулися з банку кнопкою «Назад» — дані вже вписані, кнопка не має лишатись заблокованою
    const saved = readSaved();
    if (saved) {
      if (typeof saved.name === 'string') fields.name.value = saved.name.slice(0, 60);
      if (typeof saved.email === 'string') fields.email.value = saved.email.slice(0, 120);
      if (typeof saved.phone === 'string') fields.phone.value = normalizePhone(saved.phone);
    }
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        setBusy(false);
        setStatus('', null);
      }
    });

    async function sendToEndpoint(endpoint, order) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(order),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
      } finally {
        window.clearTimeout(timer);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return; // захист від повторних натискань

      Object.keys(fields).forEach((name) => touched.add(name));
      const results = Object.keys(fields).map((name) => [name, validate(name)]);
      const firstBad = results.find(([, ok]) => !ok);
      if (firstBad) {
        setStatus('Перевірте поля, позначені червоним.', false);
        fields[firstBad[0]].focus();
        return;
      }

      setBusy(true);
      setStatus('', null);
      const order = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        phone: fields.phone.value,
        plan: 'full-access',
        price: PRICE,
        currency: 'UAH',
        createdAt: new Date().toISOString(),
      };
      save(order);

      const endpoint = (form.dataset.endpoint || '').trim();
      if (endpoint) {
        try {
          await sendToEndpoint(endpoint, order);
        } catch (error) {
          setBusy(false);
          setStatus('Не вдалося зберегти дані. Перевірте з’єднання та спробуйте ще раз.', false);
          return;
        }
      }

      setStatus('Дякуємо! Переходимо на захищену сторінку оплати monobank…', true);
      window.setTimeout(() => window.location.assign(MONOBANK_URL), 500);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
