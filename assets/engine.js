// Incident engine: branching decisions, gated story sections, saved progress.
(function () {
  var POINTS = { good: 2, ok: 1, bad: 0 };
  var PREFIX = 'sdlab:';

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* storage unavailable */ }
  }

  // ---- Module pages -------------------------------------------------------
  var moduleId = document.body.dataset.module;
  if (moduleId) {
    var key = PREFIX + moduleId;
    var state = read(key) || { choices: {} };
    var decisions = Array.prototype.slice.call(document.querySelectorAll('.decision'));

    decisions.forEach(function (d) {
      // Shuffle options so the right answer's position can't be learned.
      // Choices are saved by their authored index (data-idx), not display order.
      var choices = Array.prototype.slice.call(d.querySelectorAll('.choice'));
      choices.forEach(function (c, i) { c.dataset.idx = i; });
      for (var j = choices.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = choices[j]; choices[j] = choices[k]; choices[k] = tmp;
      }
      var parent = choices[0].parentNode;
      choices.forEach(function (c, pos) {
        parent.appendChild(c);
        var btn = c.querySelector('button');
        // Wrap the label so inline <strong>/<code> don't become flex items.
        var label = document.createElement('span');
        while (btn.firstChild) label.appendChild(btn.firstChild);
        btn.appendChild(label);
        var tag = document.createElement('span');
        tag.className = 'opt';
        tag.textContent = String.fromCharCode(65 + pos);
        btn.insertBefore(tag, btn.firstChild);
        btn.addEventListener('click', function () { choose(d, Number(c.dataset.idx), true); });
      });
      var saved = state.choices[d.dataset.id];
      if (saved !== undefined && findChoice(d, saved)) choose(d, saved, false);
    });

    function findChoice(d, idx) {
      return d.querySelector('.choice[data-idx="' + idx + '"]');
    }

    function choose(d, idx, byUser) {
      if (d.classList.contains('answered')) return;
      d.classList.add('answered');
      var choices = d.querySelectorAll('.choice');
      Array.prototype.forEach.call(choices, function (c) {
        var btn = c.querySelector('button');
        var out = c.querySelector('.outcome');
        btn.disabled = true;
        c.classList.add('v-' + (c.dataset.verdict || 'ok'));
        if (Number(c.dataset.idx) === idx) {
          c.classList.add('chosen');
          btn.setAttribute('aria-pressed', 'true');
          out.hidden = false;
        } else {
          c.classList.add('other');
          var t = document.createElement('button');
          t.type = 'button';
          t.className = 'whatif';
          t.textContent = 'What if I had picked this?';
          t.setAttribute('aria-expanded', 'false');
          t.addEventListener('click', function () {
            out.hidden = !out.hidden;
            t.setAttribute('aria-expanded', String(!out.hidden));
            t.textContent = out.hidden ? 'What if I had picked this?' : 'Hide';
          });
          btn.insertAdjacentElement('afterend', t);
        }
      });
      state.choices[d.dataset.id] = idx;
      document.querySelectorAll('[data-after="' + d.dataset.id + '"]').forEach(function (g) {
        g.classList.add('unlocked');
      });
      updateScore();
      if (byUser) {
        findChoice(d, idx).querySelector('.outcome').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function updateScore() {
      var score = 0, answered = 0;
      decisions.forEach(function (d) {
        var i = state.choices[d.dataset.id];
        if (i === undefined) return;
        var c = findChoice(d, i);
        if (!c) return;
        answered++;
        score += POINTS[c.dataset.verdict] || 0;
      });
      var max = decisions.length * 2;
      state.score = score;
      state.max = max;
      state.done = answered === decisions.length;
      write(key, state);

      document.querySelectorAll('[data-score]').forEach(function (el) {
        if (!state.done) { el.textContent = ''; return; }
        var pct = score / max;
        var rating = pct === 1 ? 'Staff-level instincts. Every call was the one a battle-scarred engineer would make.'
          : pct >= 0.6 ? 'Solid on-call. You kept it from getting worse. Go back and read the "what if" branches you skipped.'
          : 'Rough night, and that’s the point: you just learned it here instead of in production. Hit replay and try again.';
        el.innerHTML = '<strong>' + score + ' / ' + max + '</strong> ' + rating;
      });
    }

    document.querySelectorAll('[data-reset]').forEach(function (b) {
      b.addEventListener('click', function () { remove(key); location.reload(); });
    });
  }

  // ---- Copy buttons -------------------------------------------------------
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = document.getElementById(b.dataset.copy);
      if (!src) return;
      var text = src.innerText;
      var done = function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  // ---- Index page: chapter status ----------------------------------------
  document.querySelectorAll('[data-chapter]').forEach(function (el) {
    var s = read(PREFIX + el.dataset.chapter);
    var badge = el.querySelector('.status');
    if (!badge || !s) return;
    if (s.done) { badge.textContent = 'Resolved · ' + s.score + '/' + s.max; badge.classList.add('done'); }
    else if (s.choices && Object.keys(s.choices).length) { badge.textContent = 'In progress'; badge.classList.add('active'); }
  });
})();
