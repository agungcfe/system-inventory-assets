/**
 * AssetTrack - Login Page Script
 * - Toggle tampilkan/sembunyikan password
 * - Validasi form sisi klien
 * - "Ingat saya" (menyimpan username di localStorage)
 * - Simulasi proses login (ganti dengan request ke API backend)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'assettrack_remember_user';

  var form = document.getElementById('loginForm');
  var usernameInput = document.getElementById('username');
  var passwordInput = document.getElementById('password');
  var rememberInput = document.getElementById('remember');
  var toggleBtn = document.getElementById('togglePassword');
  var submitBtn = document.getElementById('submitBtn');
  var alertBox = document.getElementById('formAlert');
  var yearEl = document.getElementById('year');

  /* ---------- Helper ---------- */
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* abaikan */ }
  }
  function storageRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* abaikan */ }
  }

  function setFieldError(input, message) {
    var wrapper = input.closest('.input');
    var errorEl = document.getElementById(input.id + 'Error');
    if (message) {
      wrapper.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errorEl.id);
      errorEl.textContent = message;
    } else {
      wrapper.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      errorEl.textContent = '';
    }
  }

  function showAlert(type, message) {
    alertBox.className = 'alert alert--' + type;
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function hideAlert() {
    alertBox.hidden = true;
    alertBox.textContent = '';
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.querySelector('.btn__text').textContent = isLoading ? 'Memproses...' : 'Masuk';
  }

  /* ---------- Validasi ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateUsername() {
    var value = usernameInput.value.trim();
    if (!value) {
      setFieldError(usernameInput, 'Username atau email wajib diisi.');
      return false;
    }
    if (value.indexOf('@') !== -1 && !EMAIL_RE.test(value)) {
      setFieldError(usernameInput, 'Format email tidak valid.');
      return false;
    }
    if (value.indexOf('@') === -1 && value.length < 3) {
      setFieldError(usernameInput, 'Username minimal 3 karakter.');
      return false;
    }
    setFieldError(usernameInput, '');
    return true;
  }

  function validatePassword() {
    var value = passwordInput.value;
    if (!value) {
      setFieldError(passwordInput, 'Password wajib diisi.');
      return false;
    }
    if (value.length < 6) {
      setFieldError(passwordInput, 'Password minimal 6 karakter.');
      return false;
    }
    setFieldError(passwordInput, '');
    return true;
  }

  /* ---------- Toggle password ---------- */
  toggleBtn.addEventListener('click', function () {
    var show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    toggleBtn.setAttribute('aria-pressed', String(show));
    toggleBtn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    passwordInput.focus();
  });

  /* ---------- Validasi realtime ---------- */
  usernameInput.addEventListener('blur', function () {
    if (usernameInput.value) validateUsername();
  });
  passwordInput.addEventListener('blur', function () {
    if (passwordInput.value) validatePassword();
  });
  [usernameInput, passwordInput].forEach(function (input) {
    input.addEventListener('input', function () {
      if (input.closest('.input').classList.contains('is-invalid')) {
        input === usernameInput ? validateUsername() : validatePassword();
      }
      hideAlert();
    });
  });

  /* ---------- Ingat saya ---------- */
  var savedUser = storageGet(STORAGE_KEY);
  if (savedUser) {
    usernameInput.value = savedUser;
    rememberInput.checked = true;
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideAlert();

    var isUserValid = validateUsername();
    var isPassValid = validatePassword();

    if (!isUserValid || !isPassValid) {
      (isUserValid ? passwordInput : usernameInput).focus();
      return;
    }

    var payload = {
      username: usernameInput.value.trim(),
      password: passwordInput.value,
      remember: rememberInput.checked
    };

    if (payload.remember) {
      storageSet(STORAGE_KEY, payload.username);
    } else {
      storageRemove(STORAGE_KEY);
    }

    setLoading(true);

    /*
     * TODO: Ganti simulasi di bawah dengan request ke backend, contoh:
     *
     * fetch('/api/auth/login', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify(payload)
     * })
     *   .then(function (res) { if (!res.ok) throw new Error(); return res.json(); })
     *   .then(function () { window.location.href = 'dashboard.html'; })
     *   .catch(function () { showAlert('error', 'Username atau password salah.'); })
     *   .finally(function () { setLoading(false); });
     */
    setTimeout(function () {
      setLoading(false);
      showAlert('success', 'Login berhasil. Mengalihkan ke dashboard...');
      passwordInput.value = '';
    }, 1200);
  });

  /* ---------- Notifikasi dari halaman reset password ---------- */
  var params = new URLSearchParams(window.location.search);
  if (params.get('reset') === 'success') {
    showAlert('success', 'Password berhasil diubah. Silakan masuk dengan password baru Anda.');
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  /* Bawa email yang sudah diketik ke halaman lupa password */
  var forgotLink = document.getElementById('forgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', function () {
      var value = usernameInput.value.trim();
      if (EMAIL_RE.test(value)) {
        forgotLink.href = 'forgot-password.html?email=' + encodeURIComponent(value);
      }
    });
  }

  /* ---------- Tahun copyright ---------- */
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
