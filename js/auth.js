// js/auth.js - MODUL 12: login, register, logout (berbasis session)
const API = './api';
let csrf = '';
const $ = s => document.querySelector(s);

const el = {
  guest: $('#guest-box'), userBar: $('#user-bar'),
  name: $('#user-name'), role: $('#user-role'),
  loginForm: $('#login-form'), registerForm: $('#register-form'),
  logout: $('#logout-btn'), status: $('#auth-status')
};

function setStatus(message, type = '') {
  el.status.textContent = message;
  el.status.className = type;
}

function errorText(err) {
  const detail = Object.values(err.fields ?? {});
  return detail.length ? `${err.message}: ${detail.join('; ')}` : err.message;
}

async function post(path, body) {
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(payload?.error?.message ?? `HTTP ${res.status}`);
    err.status = res.status;
    err.fields = payload?.error?.fields ?? {};
    throw err;
  }
  return payload;
}

// Satu pintu untuk mengubah tampilan sesuai status login
function render(user) {
  csrf = user?.csrf_token ?? '';
  el.guest.hidden = Boolean(user);
  el.userBar.hidden = !user;
  if (user) {
    el.name.textContent = user.nama;
    el.role.textContent = user.role;
  }
  document.dispatchEvent(new CustomEvent('auth:change', { detail: { user } }));
}

async function loadMe() {
  try {
    const res = await fetch(`${API}/me.php`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return render(null);   // 401 = belum login (normal)
    const payload = await res.json();
    render(payload.data);
  } catch (err) {
    console.error(err);
    render(null);
  }
}

el.loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  setStatus('Memproses...');
  try {
    const res = await post('login.php', {
      email: $('#login-email').value,
      password: $('#login-password').value
    });
    el.loginForm.reset();
    setStatus('Login berhasil.', 'ok');
    render(res.data);
  } catch (err) {
    setStatus(errorText(err), 'fail');
  }
});

el.registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  setStatus('Memproses...');
  try {
    await post('register.php', {
      nama: $('#reg-nama').value,
      email: $('#reg-email').value,
      password: $('#reg-password').value
    });
    el.registerForm.reset();
    setStatus('Akun berhasil dibuat (role: viewer). Silakan masuk.', 'ok');
  } catch (err) {
    setStatus(errorText(err), 'fail');
  }
});

el.logout.addEventListener('click', async () => {
  try {
    await post('logout.php');
  } catch (err) {
    console.error(err);
  }
  setStatus('Anda sudah keluar.', 'ok');
  render(null);
});

// Dipicu crud.js bila server membalas 401 (sesi habis)
document.addEventListener('auth:expired', () => {
  setStatus('Sesi berakhir, silakan login kembali.', 'fail');
  render(null);
});

loadMe();