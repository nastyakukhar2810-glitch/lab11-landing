# UkrMovych — лендинг (ЛР №11)

Лендинг тренажера української мови **UkrMovych** («+1 бал на НМТ за 20 секунд щодня») з інтегрованими динамічними медіакомпонентами.

## JS-бібліотеки (через CDN, Vanilla JS)

| Бібліотека | Де використано | Налаштування |
|---|---|---|
| Swiper.js v11 | слайдер відгуків (6 слайдів): автоплей, стрілки, пагінація, брейкпоінти 1/2/3 слайди | `assets/js/plugins.js` |
| Fancybox v5 | галерея з 6 екранів тренажера (єдиний альбом `data-fancybox`), ефект fade, зум | `assets/js/plugins.js` |
| Typed.js | ефект друку тексту в Hero-секції | `assets/js/plugins.js` |

Стилі плагінів підключені в `<head>`, скрипти — перед `</body>`, ініціалізація обгорнута в `DOMContentLoaded`.

## ЛР №11: інтерактивний віджет і Edge Cases

Секція `#calculator` — калькулятор прогнозу балу НМТ (`assets/js/widget.js`): поточний бал, днів до іспиту, слабка тема, хвилини на день та три додаткові опції. Результат перераховується миттєво (`input` / `change`).

Захист від Edge Cases на трьох рівнях: HTML5 (`type`, `min`, `max`, `step`, `required`), JS-валідація (порожнє поле, текст, 0, від'ємні, надвеликі, дробові значення, підміна `select`, відсутні DOM-елементи) і безпечний вивід лише через `textContent`. Код ізольований в IIFE, на сторінці можливі кілька екземплярів віджета.

`assets/js/interactions.js` — міні-тренажер у секції «Тренажер» (теми й відповіді клікаються) і форма підписки з валідацією.

Флешкартки (3D-переворот) — секція `#how`. Окремі сторінки: `oferta.html` (публічна оферта) і `privacy.html` (політика конфіденційності).

### Оплата: сторінка `pay.html`

Усі кнопки оплати («Забрати доступ», «Почати навчання», «Почати в боті», контакт бота) та QR-код ведуть на `pay.html`. Клієнт вказує ім’я, e-mail і телефон (валідація: HTML5 + JS у `assets/js/pay.js`, вивід через `textContent`, захист від подвійного натискання), погоджується з офертою й переходить на захищену сторінку monobank (`MONOBANK_URL` у `pay.js`). QR малює `assets/js/qr.js` (qrcodejs, CDN) і завжди містить адресу `pay.html` опублікованого сайту. Щоб дані клієнта надходили власнику, впишіть адресу сервісу форм у `data-endpoint` форми `#pay-form`; поки він порожній, дані лишаються лише в `sessionStorage` браузера.

## Технології

HTML5, Tailwind CSS (CDN), `custom-styles.css`, Font Awesome, Google Fonts (Inter), Git, GitHub, Vercel/Netlify.

## Структура

```
lab11-landing/
├── index.html
├── pay.html
├── oferta.html
├── privacy.html
├── custom-styles.css
├── assets/
│   ├── images/    hero.png, logo.png
│   ├── icons/     icon-*.png
│   ├── gallery/   шість екранів тренажера (+ thumbs/ — мініатюри)
│   └── js/        plugins.js (ЛР №10), validation.js (ЛР №9), widget.js + interactions.js (ЛР №11), pay.js, qr.js
└── README.md
```

## Запуск локально

Відкрити папку у VS Code → Live Server → `index.html`.

## Демо

- GitHub: _посилання на репозиторій_
- Live Demo: _посилання Vercel / Netlify_
