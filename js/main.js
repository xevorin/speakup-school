(function () {
  'use strict';
  var Q = window.SpeakUpQuiz;
  var C = window.SpeakUpCalc;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    if (text != null) n.textContent = text;
    return n;
  }

  function goTo(id, focusEl) {
    var target = document.getElementById(id);
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (focusEl) setTimeout(function () { focusEl.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
  }

  /* ---------- Form prefill ---------- */
  var form = document.getElementById('lead-form');
  var recBox = document.getElementById('signup-rec');
  var nameInput = document.getElementById('f-name');

  function prefill(format, level, note) {
    if (format) form.format.value = format;
    if (level) form.level.value = level;
    if (note) { recBox.textContent = note; recBox.hidden = false; }
  }

  /* ---------- Quiz ---------- */
  var app = document.getElementById('quiz-app');
  var answers = [];
  var step = 0;

  function renderQuestion() {
    var q = Q.QUESTIONS[step];
    var total = Q.QUESTIONS.length;
    app.innerHTML = '';

    var meta = el('div', { class: 'quiz__meta' });
    meta.appendChild(el('span', { 'aria-live': 'polite' }, 'Вопрос ' + (step + 1) + ' из ' + total));
    var back = el('button', { type: 'button', class: 'quiz__back' }, 'Назад');
    back.hidden = step === 0;
    back.addEventListener('click', function () { step--; renderQuestion(); });
    meta.appendChild(back);
    app.appendChild(meta);

    var prog = el('div', { class: 'prog', role: 'progressbar', 'aria-label': 'Прогресс теста', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(step) });
    var bar = el('i');
    bar.style.width = (step / total * 100) + '%';
    prog.appendChild(bar);
    app.appendChild(prog);

    var h = el('h3', { class: 'quiz__q', tabindex: '-1', id: 'quiz-q' }, q.text);
    app.appendChild(h);

    var list = el('div', { class: 'quiz__opts', role: 'group', 'aria-labelledby': 'quiz-q' });
    q.options.forEach(function (opt, i) {
      var b = el('button', { type: 'button', class: 'opt', 'aria-pressed': String(answers[step] === i) }, opt.label);
      b.addEventListener('click', function () {
        answers[step] = i;
        answers.length = step + 1;
        if (step < total - 1) { step++; renderQuestion(); } else { renderResult(); }
      });
      list.appendChild(b);
    });
    app.appendChild(list);
    return h;
  }

  function renderResult() {
    var r = Q.scoreQuiz(answers);
    app.innerHTML = '';
    var box = el('div', { class: 'result' });

    var prog = el('div', { class: 'prog', role: 'progressbar', 'aria-label': 'Прогресс теста', 'aria-valuemin': '0', 'aria-valuemax': '4', 'aria-valuenow': '4' });
    var bar = el('i'); bar.style.width = '100%'; prog.appendChild(bar);
    box.appendChild(el('p', { class: 'result__label' }, 'Тест пройден'));
    box.appendChild(prog);

    var h = el('h3', { tabindex: '-1' }, 'Вам подойдёт: ' + r.formatLabel.toLowerCase() + ', уровень ' + r.level);
    h.style.marginTop = '20px';
    box.appendChild(h);

    var cards = el('div', { class: 'result__cards' });
    [['Формат', r.formatLabel], ['Примерный уровень', r.levelLabel]].forEach(function (pair) {
      var c = el('div', { class: 'result__card' });
      c.appendChild(el('small', null, pair[0]));
      c.appendChild(el('b', null, pair[1]));
      cards.appendChild(c);
    });
    box.appendChild(cards);
    box.appendChild(el('p', { class: 'result__why' }, r.reason));

    var actions = el('div', { class: 'result__actions' });
    var cta = el('a', { class: 'btn btn--red', href: '#signup' }, 'Записаться на пробный урок');
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      prefill(r.format, r.level, 'По тесту: ' + r.formatLabel.toLowerCase() + ', уровень ' + r.levelLabel + '. Мы уже подставили это в заявку, можно поменять.');
      goTo('signup', nameInput);
    });
    var again = el('button', { type: 'button', class: 'btn btn--ghost' }, 'Пройти заново');
    again.addEventListener('click', function () { answers = []; step = 0; renderQuestion().focus(); });
    actions.appendChild(cta);
    actions.appendChild(again);
    box.appendChild(actions);
    box.appendChild(el('p', { class: 'result__note' }, 'Точный уровень методист определит на пробном уроке.'));

    app.appendChild(box);
    h.focus();
  }

  if (Q && app) renderQuestion();

  // Фокус на вопрос после перехода, но не при первой загрузке
  app.addEventListener('click', function (e) {
    if (e.target.closest('.opt, .quiz__back')) {
      var q = document.getElementById('quiz-q');
      if (q) q.focus();
    }
  });

  /* ---------- Pricing ---------- */
  function updatePrices(lessons) {
    document.querySelectorAll('.plan').forEach(function (plan) {
      var p = C.calcPackage(plan.dataset.format, lessons);
      plan.querySelector('[data-per]').textContent = C.formatRub(p.perLesson);
      plan.querySelector('[data-total]').textContent = C.formatRub(p.total) + ' за ' + lessons + ' уроков';
      plan.querySelector('[data-saving]').textContent = p.saving ? 'Экономия ' + C.formatRub(p.saving) : '';
    });
  }
  document.querySelectorAll('input[name="pack"]').forEach(function (r) {
    r.addEventListener('change', function () { updatePrices(Number(r.value)); });
  });
  updatePrices(Number(document.querySelector('input[name="pack"]:checked').value));

  document.querySelectorAll('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var lessons = document.querySelector('input[name="pack"]:checked').value;
      prefill(a.dataset.pick, null, 'Вы выбрали: ' + Q.FORMATS[a.dataset.pick].toLowerCase() + ', пакет на ' + lessons + ' уроков.');
      goTo('signup', nameInput);
    });
  });

  /* ---------- FAQ ---------- */
  document.querySelectorAll('.faq__q button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      document.getElementById(btn.getAttribute('aria-controls')).hidden = open;
    });
  });

  /* ---------- Lead form ---------- */
  var success = document.getElementById('lead-success');
  var fields = { name: 'f-name', contact: 'f-contact', time: 'f-time', consent: 'f-consent' };

  function showErrors(errors) {
    Object.keys(fields).forEach(function (k) {
      var input = document.getElementById(fields[k]);
      var err = document.getElementById(fields[k] + '-err');
      if (errors[k]) { input.setAttribute('aria-invalid', 'true'); err.textContent = errors[k]; }
      else { input.removeAttribute('aria-invalid'); err.textContent = ''; }
    });
  }

  function readForm() {
    return { name: nameInput.value, contact: form.contact.value, time: form.time.value, consent: form.consent.checked };
  }

  var submitted = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitted = true;
    var errors = C.validateLead(readForm());
    showErrors(errors);
    var first = Object.keys(fields).filter(function (k) { return errors[k]; })[0];
    if (first) { document.getElementById(fields[first]).focus(); return; }

    // Демо: ничего не отправляем
    var name = nameInput.value.trim();
    document.getElementById('lead-success-text').textContent =
      name + ', методист свяжется с вами в течение дня и предложит время пробного урока.';
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  form.addEventListener('input', function () { if (submitted) showErrors(C.validateLead(readForm())); });
  form.addEventListener('change', function () { if (submitted) showErrors(C.validateLead(readForm())); });

  document.getElementById('lead-again').addEventListener('click', function () {
    form.reset();
    submitted = false;
    showErrors({});
    recBox.hidden = true;
    success.hidden = true;
    form.hidden = false;
    nameInput.focus();
  });
})();
