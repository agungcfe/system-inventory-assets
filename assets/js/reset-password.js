/**
 * AssetTrack - Reset Password
 * Alur: cek token di URL -> input password baru + konfirmasi
 *       -> konfirmasi -> sukses -> redirect otomatis ke login
 */
(function () {
  'use strict';

  var REDIRECT_SECONDS = 5;
  var LOGIN_URL = 'login.html?reset=success';

  var stepInvalid = document.getElementById('stepInvalid');
  var stepReset = document.getElementById('stepReset');
  var stepDone = document.getElementById('stepDone');
  var invalidMessage = document.getElementById('invalidMessage');
  var resetEmail = document.getElementById('resetEmail');

  var form = document.getElementById('resetForm');
  var pwInput = document.getElementById('newPassword');
  var confirmInput = document.getElementById('confirmPassword');
  var submitBtn = document.getElementById('resetSubmit');
  var resetAlert = document.getElementById('resetAlert');
  var strength = document.getElementById('strength');
  var strengthText = document.getElementById('strengthText');
  var rulesItems = document.querySelectorAll('#rulesList li');
  var matchHint = document.getElementById('matchHint');

  var redirectTimer = document.getElementById('redirectTimer');
  var redirectBar = document.getElementById('redirectBar');
  var stepDoneTitle = document.getElementById('stepDoneTitle');
  var stepperItems = document.querySelectorAll('.stepper__item');

  var RULES = {
    length: function (v) { return v.length >= 8; },
    upper: function (v) { return /[A-Z]/.test(v); },
    lower: function (v) { return /[a-z]/.test(v); },
    number: function (v) { return /\d/.test(v); },
    symbol: function (v) { return /[^A-Za-z0-9\s]/.test(v); }
  };
  var LEVEL_LABELS = ['Kekuatan password', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat'];

  var token = null;
  var tokenInfo = null;

  /* ---------- Helper UI ---------- */
  function setStepper(active) {
    Array.prototype.forEach.call(stepperItems, function (item) {
      var step = Number(item.getAttribute('data-step'));
      item.classList.toggle('is-done', step < active);
      item.classList.toggle('is-active', step === active);
      if (step === active) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function showStep(el) {
    [stepInvalid, stepReset, stepDone].forEach(function (s) {
      var on = s === el;
      s.hidden = !on;
      s.classList.toggle('is-active', on);
    });
  }

  function showAlert(type, message) {
    resetAlert.className = 'alert alert--' + type;
    resetAlert.textContent = message;
    resetAlert.hidden = false;
  }

  /* ---------- Toggle tampilkan password ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-toggle]'), function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      input.focus();
    });
  });

  /* ---------- Validasi realtime ---------- */
  function checkRules(value) {
    var passed = 0;
    var allOk = true;
    Array.prototype.forEach.call(rulesItems, function (li) {
      var ok = RULES[li.getAttribute('data-rule')](value);
      li.classList.toggle('is-valid', ok);
      if (ok) passed += 1; else allOk = false;
    });
    return { passed: passed, allOk: allOk };
  }

  function getLevel(value, passed) {
    if (!value) return 0;
    if (passed <= 2) return 1;
    if (passed === 3 || value.length < 8) return 2;
    if (passed === 4) return 3;
    return value.length >= 12 ? 4 : 3;
  }

  function checkMatch() {
    var wrap = confirmInput.closest('.input');
    var pw = pwInput.value;
    var cf = confirmInput.value;

    wrap.classList.remove('is-valid', 'is-invalid');
    matchHint.className = 'form__hint';
    matchHint.textContent = '';

    if (!cf) return false;
    if (pw === cf) {
      wrap.classList.add('is-valid');
      matchHint.classList.add('is-ok');
      matchHint.textContent = 'Password cocok.';
      return true;
    }
    // tampilkan error hanya jika panjang sudah setara / lebih
    if (cf.length >= pw.length || !pw.startsWith(cf)) {
      wrap.classList.add('is-invalid');
      matchHint.classList.add('is-error');
      matchHint.textContent = 'Password tidak sama.';
    }
    return false;
  }

  function update() {
    var value = pwInput.value;
    var result = checkRules(value);
    var level = getLevel(value, result.passed);
    strength.setAttribute('data-level', String(level));
    strengthText.textContent = LEVEL_LABELS[level];

    var match = checkMatch();
    submitBtn.disabled = !(result.allOk && match);
    resetAlert.hidden = true;
    return result.allOk && match;
  }

  pwInput.addEventListener('input', update);
  confirmInput.addEventListener('input', update);

  /* ---------- "API" (simulasi) ---------- */
  /**
   * TODO produksi: ganti dengan request ke backend, contoh:
   * return fetch('/api/auth/reset-password', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ token: token, password: password })
   * }).then(function (res) { if (!res.ok) throw new Error(); });
   */
  function submitNewPassword(/* token, password */) {
    return new Promise(function (resolve) { setTimeout(resolve, 1300); });
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!update()) {
      showAlert('error', 'Lengkapi semua syarat password dan pastikan konfirmasi sama.');
      return;
    }

    // Cek ulang masa berlaku token sebelum dikirim
    var check = window.ResetToken.verify(token);
    if (!check.valid) { showInvalid(check.reason); return; }

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.querySelector('.btn__text').textContent = 'Menyimpan...';

    submitNewPassword(token, pwInput.value)
      .then(function () {
        pwInput.value = '';
        confirmInput.value = '';
        // hapus token dari URL agar link tidak bisa dipakai lagi dari riwayat
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', 'reset-password.html');
        }
        showDone();
      })
      .catch(function () {
        showAlert('error', 'Gagal menyimpan password. Coba lagi.');
        submitBtn.disabled = false;
      })
      .then(function () {
        submitBtn.classList.remove('is-loading');
        submitBtn.querySelector('.btn__text').textContent = 'Konfirmasi Password';
      });
  });

  /* ---------- Layar sukses + redirect ---------- */
  function showDone() {
    showStep(stepDone);
    setStepper(5); // semua langkah selesai
    stepDoneTitle.focus();

    var remaining = REDIRECT_SECONDS;
    redirectTimer.textContent = remaining;
    // animasi progress bar
    requestAnimationFrame(function () {
      redirectBar.style.transition = 'width ' + REDIRECT_SECONDS + 's linear';
      redirectBar.style.width = '100%';
    });

    var id = setInterval(function () {
      remaining -= 1;
      redirectTimer.textContent = Math.max(remaining, 0);
      if (remaining <= 0) {
        clearInterval(id);
        window.location.href = LOGIN_URL;
      }
    }, 1000);
  }

  /* ---------- Link tidak valid ---------- */
  function showInvalid(reason) {
    var messages = {
      missing: 'Link reset password tidak lengkap. Pastikan Anda membuka link langsung dari email.',
      invalid: 'Link reset password tidak valid. Silakan minta link baru.',
      expired: 'Link reset password sudah kedaluwarsa (berlaku ' + window.ResetToken.TTL_MINUTES + ' menit). Silakan minta link baru.'
    };
    invalidMessage.textContent = messages[reason] || messages.invalid;
    showStep(stepInvalid);
    setStepper(3);
  }

  /* ---------- Init ---------- */
  token = new URLSearchParams(window.location.search).get('token');
  tokenInfo = window.ResetToken.verify(token);

  if (tokenInfo.valid) {
    resetEmail.textContent = tokenInfo.email;
    showStep(stepReset);
    setStepper(3);
    pwInput.focus();
  } else {
    showInvalid(tokenInfo.reason);
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
