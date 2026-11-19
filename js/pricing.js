/* Speak Up — расчёт цен пакетов и проверка формы. Чистые функции, без DOM. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpeakUpCalc = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PRICES = { individual: 1400, pair: 990, group: 650 };
  var DISCOUNT_16 = 0.1; // скидка 10% на пакет из 16 уроков

  function calcPackage(format, lessons) {
    var base = PRICES[format];
    if (!base) throw new Error('Неизвестный формат: ' + format);
    if (lessons !== 8 && lessons !== 16) throw new Error('Пакет бывает на 8 или 16 уроков');
    var perLesson = lessons === 16 ? Math.round(base * (1 - DISCOUNT_16)) : base;
    var total = perLesson * lessons;
    return { perLesson: perLesson, total: total, saving: base * lessons - total };
  }

  function formatRub(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function validateLead(data) {
    var errors = {};
    var name = (data.name || '').trim();
    var contact = (data.contact || '').trim();

    if (name.length < 2) errors.name = 'Напишите, как к вам обращаться';

    if (!contact) {
      errors.contact = 'Оставьте телефон или ник в Telegram';
    } else if (/^[+\d(]/.test(contact)) {
      var digits = contact.replace(/\D/g, '');
      if (/[^\d\s()+-]/.test(contact) || digits.length < 10 || digits.length > 15) {
        errors.contact = 'Телефон в формате +7 900 123-45-67';
      }
    } else {
      var nick = contact.replace(/^(https?:\/\/)?t\.me\//i, '').replace(/^@/, '');
      if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(nick)) {
        errors.contact = 'Ник в Telegram: @ и от 5 латинских букв или цифр';
      }
    }

    if (!data.time) errors.time = 'Выберите удобное время';
    if (!data.consent) errors.consent = 'Нужно согласие на обработку данных';
    return errors;
  }

  return { PRICES: PRICES, DISCOUNT_16: DISCOUNT_16, calcPackage: calcPackage, formatRub: formatRub, validateLead: validateLead };
});
