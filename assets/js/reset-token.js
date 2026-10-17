/**
 * AssetTrack - Helper token reset password (MODE DEMO)
 *
 * Halaman ini belum punya backend, jadi token dibuat di browser agar alur
 * forgot -> cek email -> klik link -> password baru bisa dicoba end-to-end.
 *
 * PENTING untuk produksi: token HARUS dibuat, disimpan, dan diverifikasi
 * oleh server (acak, sekali pakai, ada masa berlaku). Ganti fungsi di sini
 * dengan pemanggilan API backend.
 */
(function (window) {
  'use strict';

  var TTL_MINUTES = 15;

  function toBase64Url(str) {
    return window.btoa(encodeURIComponent(str))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(window.atob(b64));
  }

  function randomId() {
    var arr = new Uint8Array(8);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.prototype.map.call(arr, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  /** Buat token untuk email tertentu. */
  function create(email) {
    var payload = {
      email: email,
      exp: Date.now() + TTL_MINUTES * 60 * 1000,
      nonce: randomId()
    };
    return toBase64Url(JSON.stringify(payload));
  }

  /**
   * Baca & cek token.
   * @returns {{valid:boolean, reason?:string, email?:string}}
   */
  function verify(token) {
    if (!token) return { valid: false, reason: 'missing' };
    try {
      var data = JSON.parse(fromBase64Url(token));
      if (!data || typeof data.email !== 'string' || typeof data.exp !== 'number') {
        return { valid: false, reason: 'invalid' };
      }
      if (Date.now() > data.exp) return { valid: false, reason: 'expired', email: data.email };
      return { valid: true, email: data.email };
    } catch (e) {
      return { valid: false, reason: 'invalid' };
    }
  }

  /** Buat URL halaman reset dari token. */
  function buildResetUrl(token) {
    return 'reset-password.html?token=' + encodeURIComponent(token);
  }

  window.ResetToken = {
    TTL_MINUTES: TTL_MINUTES,
    create: create,
    verify: verify,
    buildResetUrl: buildResetUrl
  };
})(window);
