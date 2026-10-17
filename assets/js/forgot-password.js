/**
 * AssetTrack - Forgot Password
 * Alur: input email -> kirim link -> layar "Cek Email" (kirim ulang + countdown)
 */
(function () {
  'use strict';

  var RESEND_SECONDS = 60;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var stepEmail = document.getElementById('stepEmail');
  var stepSent = document.getElementById('stepSent');
  var emailForm = document.getElementById('emailForm');
  var emailInput = document.getElementById('email');
  var emailError = document.getElementById('emailError');
  var emailAlert = document.getElementById('emailAlert');
  var emailSubmit = document.getElementById('emailSubmit');

  var sentEmail = document.getElementById('sentEmail');
  var sentAlert = document.getElementById('sentAlert');
  var resendBtn = document.getElementById('resendBtn');
  var resendText = resendBtn.querySelector('.btn__text');
  var changeEmailBtn = document.getElementById('changeEmailBtn');
  var demoResetLink = document.getElementById('demoResetLink');
  var stepTitleSent = document.getElementById('stepSentTitle');
  var badge = stepSent.querySelector('.step__badge');

  var stepperItems = document.querySelectorAll('.stepper__item');
  var countdownId = null;
  var currentEmail = '';
  var sentCount = 0;

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
    [stepEmail, stepSent].forEach(function (s) {
      var on = s === el;
      s.hidden = !on;
      s.classList.toggle('is-active', on);
    });
  }

  function setLoading(btn, isLoading, label) {
    btn.disabled = isLoading;
    btn.classList.toggle('is-loading', isLoading);
    if (label) btn.querySelector('.btn__text').textContent = label;
  }

  function showAlert(box, type, message) {
    box.className = 'alert alert--' + type;
    box.textContent = message;
    box.hidden = false;
  }

  function hideAlert(box) { box.hidden = true; }

  function setEmailError(message) {
    var wrap = emailInput.closest('.input');
    wrap.classList.toggle('is-invalid', !!message);
    emailError.textContent = message || '';
    if (message) {
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.setAttribute('aria-describedby', 'emailError');
    } else {
      emailInput.removeAttribute('aria-invalid');
      emailInput.removeAttribute('aria-describedby');
    }
  }

  function validateEmail() {
    var value = emailInput.value.trim();
    if (!value) { setEmailError('Email wajib diisi.'); return false; }
    if (!EMAIL_RE.test(value)) { setEmailError('Format email tidak valid. Contoh: nama@perusahaan.com'); return false; }
    setEmailError('');
    return true;
  }

  /* ---------- "API" (simulasi) ---------- */
  /**
   * TODO produksi: ganti dengan request ke backend, contoh:
   * return fetch('/api/auth/forgot-password', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ email: email })
   * }).then(function (res) { if (!res.ok) throw new Error(); });
   *
   * Demi keamanan, backend sebaiknya selalu membalas "sukses" walau email
   * tidak terdaftar, agar daftar email pengguna tidak bisa ditebak.
   */
  function requestResetLink(email) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ token: window.ResetToken.create(email) });
      }, 1200);
    });
  }

  /* ---------- Countdown kirim ulang ---------- */
  function startCountdown() {
    var remaining = RESEND_SECONDS;
    clearInterval(countdownId);
    resendBtn.disabled = true;
    resendText.innerHTML = 'Kirim ulang dalam <span id="resendTimer">' + remaining + '</span>d';

    countdownId = setInterval(function () {
      remaining -= 1;
      var timer = document.getElementById('resendTimer');
      if (timer) timer.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(countdownId);
        resendBtn.disabled = false;
        resendText.textContent = 'Kirim Ulang Email';
      }
    }, 1000);
  }

  function applyToken(token) {
    demoResetLink.href = window.ResetToken.buildResetUrl(token);
  }

  /* ---------- Langkah 1: submit email ---------- */
  emailInput.addEventListener('input', function () {
    if (emailInput.closest('.input').classList.contains('is-invalid')) validateEmail();
    hideAlert(emailAlert);
  });

  emailForm.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert(emailAlert);
    if (!validateEmail()) { emailInput.focus(); return; }

    currentEmail = emailInput.value.trim();
    setLoading(emailSubmit, true, 'Mengirim...');

    requestResetLink(currentEmail)
      .then(function (res) {
        sentCount = 1;
        badge.textContent = sentCount;
        sentEmail.textContent = currentEmail;
        applyToken(res.token);
        hideAlert(sentAlert);
        showStep(stepSent);
        setStepper(2);
        startCountdown();
        stepTitleSent.focus();
      })
      .catch(function () {
        showAlert(emailAlert, 'error', 'Gagal mengirim link. Periksa koneksi lalu coba lagi.');
      })
      .then(function () {
        setLoading(emailSubmit, false, 'Kirim Link Reset');
      });
  });

  /* ---------- Langkah 2: kirim ulang / ganti email ---------- */
  resendBtn.addEventListener('click', function () {
    setLoading(resendBtn, true, 'Mengirim ulang...');
    requestResetLink(currentEmail)
      .then(function (res) {
        sentCount += 1;
        badge.textContent = sentCount;
        applyToken(res.token);
        showAlert(sentAlert, 'success', 'Link baru telah dikirim ke ' + currentEmail + '. Link sebelumnya tidak berlaku lagi.');
        resendBtn.classList.remove('is-loading');
        startCountdown();
      })
      .catch(function () {
        setLoading(resendBtn, false, 'Kirim Ulang Email');
        showAlert(sentAlert, 'error', 'Gagal mengirim ulang. Coba lagi.');
      });
  });

  changeEmailBtn.addEventListener('click', function () {
    clearInterval(countdownId);
    showStep(stepEmail);
    setStepper(1);
    emailInput.focus();
    emailInput.select();
  });

  /* ---------- Prefill dari query (?email=) ---------- */
  var params = new URLSearchParams(window.location.search);
  if (params.get('email')) emailInput.value = params.get('email');

  setStepper(1);

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
