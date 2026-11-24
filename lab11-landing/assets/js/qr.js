/* qr.js — малює QR-код, що веде на сторінку оплати цього ж сайту (pay.html).
   Адреса береться з поточного місця розташування сторінки, тому після деплою
   QR автоматично містить живе посилання. Бібліотека qrcodejs підключена через CDN.
   Якщо бібліотека не завантажилась — показуємо звичайне посилання. */
(() => {
  'use strict';

  function init() {
    document.querySelectorAll('[data-qr-target]').forEach((box) => {
      const target = box.dataset.qrTarget;
      let url = '';
      try {
        url = new URL(target, document.baseURI).href;
      } catch (error) {
        return;
      }

      if (typeof window.QRCode === 'function') {
        box.replaceChildren();
        // eslint-disable-next-line no-new
        new window.QRCode(box, {
          text: url,
          width: 160,
          height: 160,
          colorDark: '#12181E',
          colorLight: '#FFFFFF',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
        box.setAttribute('role', 'img');
        box.setAttribute('aria-label', 'QR-код: сторінка оплати доступу');
        box.title = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.className = 'text-xs font-bold underline';
        link.textContent = 'Відкрити сторінку оплати';
        box.replaceChildren(link);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
