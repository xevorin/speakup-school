// Запуск: node tests/logic.test.js
const assert = require('node:assert/strict');
const { scoreQuiz, levelFromPoints, QUESTIONS } = require('../js/quiz.js');
const { calcPackage, formatRub, validateLead } = require('../js/pricing.js');

let n = 0;
function t(name, fn) { fn(); n++; console.log('ok', name); }

t('4 вопроса по 4 варианта', () => {
  assert.equal(QUESTIONS.length, 4);
  QUESTIONS.forEach(q => assert.equal(q.options.length, 4));
});
t('границы уровней', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(levelFromPoints), ['A1', 'A1', 'A2', 'A2', 'B1', 'B1', 'B2']);
});
t('новичок, путешествия, не знает формат → группа A1', () => {
  const r = scoreQuiz([0, 0, 0, 3]);
  assert.equal(r.level, 'A1'); assert.equal(r.format, 'group');
});
t('свободно, экзамен, не знает → индивидуально B2', () => {
  const r = scoreQuiz([3, 3, 2, 3]);
  assert.equal(r.level, 'B2'); assert.equal(r.format, 'individual');
});
t('работа: A2 → пара, B1 → индивидуально', () => {
  assert.equal(scoreQuiz([1, 1, 1, 3]).format, 'pair');
  assert.equal(scoreQuiz([2, 2, 1, 3]).format, 'individual');
});
t('явный выбор формата побеждает цель', () => {
  const r = scoreQuiz([2, 1, 2, 2]);
  assert.equal(r.format, 'group'); assert.equal(r.level, 'A2');
  assert.equal(scoreQuiz([0, 0, 0, 1]).format, 'pair');
});
t('все 256 комбинаций дают валидный результат', () => {
  for (let i = 0; i < 256; i++) {
    const a = [i & 3, (i >> 2) & 3, (i >> 4) & 3, (i >> 6) & 3];
    const r = scoreQuiz(a);
    assert.ok(['A1', 'A2', 'B1', 'B2'].includes(r.level));
    assert.ok(['individual', 'pair', 'group'].includes(r.format));
    assert.ok(r.formatLabel && r.levelLabel && r.reason);
  }
});
t('неверные ответы бросают ошибку', () => {
  assert.throws(() => scoreQuiz([0, 0, 0]));
  assert.throws(() => scoreQuiz([0, 0, 0, 4]));
  assert.throws(() => scoreQuiz(null));
});
t('цены пакетов', () => {
  assert.deepEqual(calcPackage('individual', 8), { perLesson: 1400, total: 11200, saving: 0 });
  assert.deepEqual(calcPackage('individual', 16), { perLesson: 1260, total: 20160, saving: 2240 });
  assert.deepEqual(calcPackage('pair', 16), { perLesson: 891, total: 14256, saving: 1584 });
  assert.deepEqual(calcPackage('group', 16), { perLesson: 585, total: 9360, saving: 1040 });
  assert.equal(formatRub(11200), '11 200 ₽');
  assert.equal(formatRub(650), '650 ₽');
});
t('валидация формы', () => {
  const ok = { name: 'Оля', contact: '+7 900 123-45-67', time: 'Утро', consent: true };
  assert.deepEqual(validateLead(ok), {});
  assert.deepEqual(validateLead({ ...ok, contact: '@olya_en' }), {});
  assert.deepEqual(validateLead({ ...ok, contact: 't.me/olya_en' }), {});
  assert.ok(validateLead({ ...ok, contact: '123' }).contact);
  assert.ok(validateLead({ ...ok, contact: '@ab' }).contact);
  const e = validateLead({});
  assert.deepEqual(Object.keys(e).sort(), ['consent', 'contact', 'name', 'time']);
});
console.log(`\n${n} тестов прошли`);
