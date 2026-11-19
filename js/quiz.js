/* Speak Up — данные и логика теста на уровень.
   Функции чистые: работают и в браузере (window.SpeakUpQuiz), и в Node (require). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpeakUpQuiz = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var QUESTIONS = [
    {
      id: 'base',
      text: 'Что у вас сейчас с английским?',
      options: [
        { label: 'Почти с нуля, знаю алфавит', points: 0 },
        { label: 'Помню школьную базу, но многое забыл', points: 1 },
        { label: 'Читаю и понимаю простые тексты', points: 2 },
        { label: 'Смотрю сериалы с английскими субтитрами', points: 3 }
      ]
    },
    {
      id: 'speak',
      text: 'Сможете рассказать о себе по-английски?',
      options: [
        { label: 'Нет, только пару фраз', points: 0 },
        { label: 'Да, но медленно и с паузами', points: 1 },
        { label: 'Да, с ошибками, но без пауз', points: 2 },
        { label: 'Да, свободно', points: 3 }
      ]
    },
    {
      id: 'goal',
      text: 'Зачем вам английский?',
      options: [
        { label: 'Путешествовать и общаться', goal: 'travel' },
        { label: 'Работа и собеседования', goal: 'work' },
        { label: 'Сдать экзамен: IELTS, ЕГЭ, ОГЭ', goal: 'exam' },
        { label: 'Для себя, чтобы не забыть', goal: 'hobby' }
      ]
    },
    {
      id: 'format',
      text: 'Как вам комфортнее заниматься?',
      options: [
        { label: 'Один на один с преподавателем', format: 'individual' },
        { label: 'Вдвоём с другом или партнёром', format: 'pair' },
        { label: 'В небольшой группе', format: 'group' },
        { label: 'Пока не знаю', format: 'any' }
      ]
    }
  ];

  var LEVELS = {
    A1: 'A1 — начальный',
    A2: 'A2 — элементарный',
    B1: 'B1 — средний',
    B2: 'B2 — выше среднего'
  };

  var FORMATS = {
    individual: 'Индивидуально',
    pair: 'В паре',
    group: 'Группа до 5 человек'
  };

  function levelFromPoints(points) {
    if (points <= 1) return 'A1';
    if (points <= 3) return 'A2';
    if (points <= 5) return 'B1';
    return 'B2';
  }

  /**
   * answers — массив из 4 индексов выбранных вариантов (0–3).
   * Возвращает { level, levelLabel, format, formatLabel, points, reason }.
   */
  function scoreQuiz(answers) {
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
      throw new Error('Нужно ' + QUESTIONS.length + ' ответа, получено: ' + (answers && answers.length));
    }
    var picked = answers.map(function (a, i) {
      var opt = QUESTIONS[i].options[a];
      if (!Number.isInteger(a) || !opt) throw new Error('Неверный ответ на вопрос ' + (i + 1) + ': ' + a);
      return opt;
    });

    var points = picked[0].points + picked[1].points;
    var level = levelFromPoints(points);
    var goal = picked[2].goal;
    var format = picked[3].format;
    var reason;

    if (format !== 'any') {
      reason = 'Вы сами выбрали этот формат — подберём под него группу или преподавателя.';
    } else if (goal === 'exam') {
      format = 'individual';
      reason = 'Для экзамена нужна программа под конкретный тест и разбор ваших ошибок, это проще один на один.';
    } else if (goal === 'work') {
      format = (level === 'B1' || level === 'B2') ? 'individual' : 'pair';
      reason = format === 'individual'
        ? 'С вашим уровнем быстрее всего готовиться к рабочим созвонам и собеседованиям один на один.'
        : 'В паре больше разговорной практики, чем в группе, и дешевле, чем индивидуально.';
    } else {
      format = 'group';
      reason = 'Для разговорного английского группа даёт больше живой речи, а урок стоит дешевле.';
    }

    return {
      level: level,
      levelLabel: LEVELS[level],
      format: format,
      formatLabel: FORMATS[format],
      points: points,
      reason: reason
    };
  }

  return { QUESTIONS: QUESTIONS, LEVELS: LEVELS, FORMATS: FORMATS, levelFromPoints: levelFromPoints, scoreQuiz: scoreQuiz };
});
