/* plugins.js — ЛР №10: ініціалізація JS-плагінів, підключених через CDN
   Swiper.js (слайдер відгуків), Fancybox v5 (галерея), Typed.js (ефект друку в Hero).
   Усе обгорнуто в DOMContentLoaded: код стартує, коли DOM уже побудовано. */

document.addEventListener('DOMContentLoaded', () => {
  // Повага до налаштувань доступності: без автоматичної анімації
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== 1. Swiper.js — слайдер відгуків =====
  if (typeof Swiper !== 'undefined' && document.querySelector('.reviews-swiper')) {
    new Swiper('.reviews-swiper', {
      loop: true,
      spaceBetween: 24,
      grabCursor: true,
      keyboard: { enabled: true },
      autoplay: reduceMotion ? false : {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true, // зупинка автоплею при наведенні миші
      },
      pagination: { el: '.reviews-pagination', clickable: true },
      navigation: { nextEl: '.reviews-next', prevEl: '.reviews-prev' },
      // Брейкпоінти: мобільні — 1 слайд, планшети — 2, десктопи — 3
      breakpoints: {
        320: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
      a11y: {
        prevSlideMessage: 'Попередній відгук',
        nextSlideMessage: 'Наступний відгук',
        paginationBulletMessage: 'Перейти до відгуку {{index}}',
        slideLabelMessage: 'Відгук {{index}} з {{slidesLength}}',
      },
    });
  }

  // ===== 2. Fancybox v5 — галерея зображень (єдиний альбом) =====
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind("[data-fancybox='ukrmovych-gallery']", {
      Carousel: { transition: 'fade' },        // ефект переходу між зображеннями
      Images: { Panzoom: { maxScale: 3 } },    // зум до 3x
      l10n: {
        CLOSE: 'Закрити', NEXT: 'Далі', PREV: 'Назад',
        TOGGLE_ZOOM: 'Збільшити / зменшити',
        TOGGLE_THUMBS: 'Мініатюри',
        TOGGLE_FULLSCREEN: 'На весь екран',
      },
    });
  }

  // ===== 3. Typed.js — ефект друку тексту в Hero =====
  const typedEl = document.getElementById('typed-text');
  if (typeof Typed !== 'undefined' && typedEl && !reduceMotion) {
    new Typed('#typed-text', {
      strings: [
        'персоналізовані лайфхаки',
        'інтервальне повторення',
        'розбір кожної помилки',
        'всі 233 слова НМТ',
      ],
      typeSpeed: 50,   // швидкість друку, мс
      backSpeed: 30,   // швидкість стирання, мс
      backDelay: 1600, // пауза перед стиранням, мс
      loop: true,
    });
  }
});
