var secondsCounter = null;
var timeStop = { // Объект для записи последнего Stop-времени
  h: 0,
  m: 0,
  s: 0,
  ms: 0
};
var timerBox = document.getElementById('timerBox');
var timerTable = timerBox.getElementsByClassName('main-timer')[0];
var miliSeconds = timerBox.getElementsByClassName('miliSeconds')[0];

// Отработка поведения кнопок через атрибут data-action
timerBox.onclick = function(e) {
    var target = e.target;
    var action = target.getAttribute('data-action');
    if (action == 'start') {
      target.value = 'Stop';
      target.setAttribute('data-action', 'stop');
      timer.start()
    };
    if (action == 'stop') {
      target.value = 'Start';
      target.setAttribute('data-action', 'start');
      timer.stop()
    };
    if (action == 'reset') {
      var clearButton = timerBox.querySelector("[data-action='stop']");
      if (clearButton) {
        clearButton.value = 'Start';
        clearButton.setAttribute('data-action', 'start');
      };
      timer.reset()
    };
    if (action == 'split') {
      timer.split()
    }

  }
  // Объект timer с публичными методами start, pause и stop
var timer = {
  h: 0,
  m: 0,
  s: 0,
  ms: 0,
  recNum: 0,
  timingBox: [], // Здесь будем хранить массив с объектами Split
  startTrigger: 0, // Показывает в каком состоянии таймер: 0 - пауза или стоп, 1 - работает

  start: function() {
    if (timer.startTrigger == 0) {
      secondsCounter = setInterval(function() {
        // Здесь проблема. Если указывать интервал до 25 мс, таймер значительно увеличивает отставание
        timer.ms += 25;
        // Обновление миллисекунд сделано отдельно ради оптимизации (реже обновлять innerHTML всего таймера)
        // Каждую секунду обновляем счетчики на экране
        if (timer.ms == 1000) {
          timer.ms = 0;
          timer.s += 1;
          if (timer.s == 60) {
            timer.m += 1;
            timer.s = 0
          };
          if (timer.m == 60) {
            timer.h += 1;
            timer.m = 0
          };
          timer._refreshTimeTable(timer.h, timer.m, timer.s, timer.ms);
        }
        miliSeconds.innerHTML = timer._getRightFormatMs(timer.ms);
      }, 25);
      timer.startTrigger = 1;
    }
  },

  stop: function() { // Чтобы не добавлять паралельный счетчик для отсчета времени от последнего Stop, запоминаем последнее время Stop (timeStop{h,m,s,ms}) и вычитаем его из нынешнего Stop (timer{h,m,s,ms})
    if (timer.startTrigger === 1) { // Для правильного учета разрядов чисел, добавляем переходящую 1 в соседний разряд, если разница между текущим интервалом и прошлым отрицательная. Т.е. если вычитаются 1 мин 20 сек из 2 мин 10 сек получается следующее: 10 сек - 20 сек = -10 сек, что есть ошибка и 2 мин из 1 мин получается 1 мин, что тоже неверно. Ведь реальная разница 90 сек, т.е. 0 мин 90 сек. Для коррекции в таких случаях: 10 + (100 - 20) = 90 и к минутам добавляем единицу и получается 2 - (1+1) = 0. В итоге выходит 0 мин 90 сек
      clearInterval(secondsCounter);
      if (timer.ms < timeStop.ms) {
        timeStop.ms = timer.ms + (1000 - timeStop.ms);
        timeStop.s += 1;
      } else {
        timeStop.ms = (timer.ms - timeStop.ms);
      };
      if (timer.s < timeStop.s) {
        timeStop.s = timer.s + (100 - timeStop.s);
        timeStop.m += 1;
      } else {
        timeStop.s = (timer.s - timeStop.s);
      };
      if (timer.m < timeStop.m) {
        timeStop.m = timer.m + (100 - timeStop.m);
        timeStop.h += 1;
      } else {
        timeStop.m = (timer.m - timeStop.m);
      };
      if (timer.h < timeStop.h) {
        timeStop.h = timer.h + (100 - timeStop.h);
      } else {
        timeStop.h = (timer.h - timeStop.h);
      };
      var timerStop = (timer._getRightFormat(timeStop.h, timeStop.m, timeStop.s) + timer._getRightFormatMs(timeStop.ms));
      var stopRec = new timer.Timing('Stop', timerStop);
      stopRec.returnTimeRec();
      timeStop.h = timer.h;
      timeStop.m = timer.m;
      timeStop.s = timer.s;
      timeStop.ms = timer.ms;
      timer.startTrigger = 0;
    }
  },

  split: function() {
    if (timer.startTrigger === 1) {
      var timerSplit = (timer._getRightFormat(timer.h, timer.m, timer.s) + timer._getRightFormatMs(timer.ms));
      var splitRec = new timer.Timing('Split', timerSplit);
      splitRec.returnTimeRec();
    }
  },

  reset: function() {
    timer._clearTimings();
    clearInterval(secondsCounter);
    timer.h = 0;
    timer.m = 0;
    timer.s = 0;
    timer.ms = 0;
    timeStop.h = 0;
    timeStop.m = 0;
    timeStop.s = 0;
    timeStop.ms = 0;
    timer.startTrigger = 0;
    timer._refreshTimeTable(timer.h, timer.m, timer.s, timer.ms);
  },
  // Функция обновляющая данные таймера на экране
  _refreshTimeTable(h, m, s, ms) {
    timerTable.innerHTML = timer._getRightFormat(h, m, s);
    if (timer.startTrigger === 0) {
      miliSeconds.innerHTML = timer._getRightFormatMs(ms);
    }
  },

  // Функция, возврающая данные для вывода в табло таймера. Добавляет спереди 0 для чисел меньших 10
  _getRightFormat: function(hours, minutes, seconds) {
    if (hours < 10) {
      hours = '0' + hours
    };
    if (minutes < 10) {
      minutes = '0' + minutes
    };
    if (seconds < 10) {
      seconds = '0' + seconds
    };
    return (hours + ':' + minutes + ':' + seconds);
  },
  _getRightFormatMs: function(ms) { // Тоже самое, но для миллисекунд
    if (ms === 0) {
      return ('.000');
    }
    if (ms < 10) {
      ms = '.00' + ms;
      return ms;
    };
    if (ms < 100) {
      ms = '.0' + ms;
      return ms;
    };
    return '.' + ms;
  },
  Timing: function(eventType, timeRec) { // Конструктор для создания объекта по событию Split и Stop
    this.number = ++timer.recNum;
    this.eventType = eventType;
    this.timeRec = timeRec;
    this.returnTimeRec = function() { // Метод для добавления себя в массив timingBox и добавления элемента в DOM
      var insertPoint = document.getElementById('timingBox');
      var insertElem = document.createElement('p');
      insertElem.innerHTML = (this.number + ' ' + this.eventType + ': ' + this.timeRec);
      insertPoint.appendChild(insertElem);
      timer.timingBox.push(this);
    }
  },
  _clearTimings: function() { // Сырой вариант очистки массива и удаления всех созданных объектов с метками времени
    timer.timingBox = [];
    timer.recNum = 0;
    var timingBox = document.getElementById('timingBox');
    timingBox.innerHTML = '';
  }
}
