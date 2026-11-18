# Security Review - WebLab (Modul 13)

Ruang lingkup: proyek WebLab lokal (`http://localhost/pemweb-obe/` / `http://pemweb-obe.test/`), DB development. Tidak ada pengujian pada sistem pihak lain. Evidence tidak memuat secret (password/token di-crop atau disamarkan).

## 1. Checklist OWASP Top 10:2025

| OWASP | Area | Hasil review | Status |
| :--- | :--- | :--- | :--- |
| **A01** | Access control | Role check server-side (401/403). Viewer DELETE ditolak. CSRF token ditambahkan (F02) | OK setelah F02 |
| **A02** | Misconfiguration / secrets | `.env`/`vendor` ter-track (F01), DB `root` (F03) | OK setelah F01, F03 |
| **A03** | Supply chain | `composer audit` dijalankan (F04): `No security vulnerability advisories found.`; `composer.lock` di-commit | OK |
| **A04** | Cryptographic failures | Password `password_hash`/`password_verify` (hash 60 karakter di DB). HTTPS belum diterapkan di localhost | OK, residual: HTTPS production |
| **A05** | Injection / XSS | Prepared statement; output `textContent`; payload SQLi/XSS gagal | OK (bukti D poin 2-3) |
| **A06** | Insecure design | Role matrix, registrasi publik selalu `viewer`, validasi server | OK |
| **A07** | Authentication | `session_regenerate_id`, cookie `HttpOnly`/`SameSite`, error login generik. Belum ada pembatasan percobaan login | Sebagian, residual |
| **A08** | Integrity | Tidak ada script CDN/pihak ketiga; `composer.lock` mengunci versi | OK |
| **A09** | Logging | Error detail ke `error_log`; belum ada log audit (login gagal, hapus data) | Sebagian, residual |
| **A10** | Exceptional conditions | Global `try/catch` → 500 generik tanpa stack trace/password (uji: matikan MySQL → 500 generik, dari Modul 11) | OK |

## 2. Tabel Temuan

| ID | Judul Temuan | Kategori OWASP | Lokasi | Severity | Status | Ringkasan Perbaikan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F01** | File `.env` dan folder `vendor/` terlacak di Git | A02 Misconfiguration / Secrets | `.gitignore`, `.env`, `vendor/` | Medium | Fixed | Perbaiki aturan `.gitignore`, jalankan `git rm --cached`, sediakan `.env.example`, rotasi kredensial DB |
| **F02** | Endpoint pengubah data (POST/PUT/DELETE) belum memiliki proteksi CSRF | A01 Broken Access Control | `config/auth.php`, `api/login.php`, `api/me.php`, `api/alats.php`, `js/auth.js`, `js/crud.js` | Medium | Fixed | Implementasi fungsi `requireCsrf()` berbasis session token dan pengiriman header `X-CSRF-Token` |
| **F03** | Koneksi database menggunakan akun superuser `root` | A02 Misconfiguration | `.env`, MySQL user privileges | Medium | Fixed | Buat akun `weblab_app` dengan hak akses minimum (`SELECT, INSERT, UPDATE, DELETE` pada `pemweb_obe.*`) |
| **F04** | Audit dependensi pihak ketiga dan penguncian versi paket | A03 Software Supply Chain Failures | `composer.json`, `composer.lock` | Informational / Low | Fixed | Jalankan `composer audit` (`No security vulnerability advisories found.`) dan commit `composer.lock` ke repository |

**Alasan severity (impact, likelihood, exposure, kontrol):**
- **F01 Medium:** kredensial publik di GitHub, tetapi hanya untuk DB lokal dan tidak terjangkau dari internet.
- **F02 Medium:** aksi ubah/hapus bisa dipicu memakai sesi korban; kemungkinan diturunkan `SameSite=Lax` dan request JSON.
- **F03 Medium:** bila aplikasi bocor, akun `root` berarti kendali penuh DB; kemungkinan rendah karena query memakai prepared statement.
- **F04 Informational/Low:** pemeriksaan rutin rantai pasok pustaka (`vlucas/phpdotenv` dan dependensinya) menunjukkan tidak ada advisory kerentanan (0 vulnerabilities), serta versi telah dikunci melalui `composer.lock`.

## 3. Before-After

### F01 - `.env` dan `vendor` ter-track
- **Before:** `git ls-files` menampilkan `.env` dan banyak file `vendor/`; `git check-ignore -v .env` kosong (screenshot).
- **Patch:** commit `"fix(security): perbaiki .gitignore, lepas .env dan vendor dari tracking, perbarui dokumentasi README"` (hash: `c319d6b`).
- **After:** `git check-ignore -v .env` menampilkan aturan; `git ls-files .env` kosong (screenshot). Aplikasi tetap berjalan.

### F02 - CSRF
- **Before:** `POST /api/alats.php` tanpa token = `201 Created` (screenshot).
- **Patch:** `requireCsrf()` di `config/auth.php`, token dikirim saat `login`/`me`, header `X-CSRF-Token` di frontend (commit hash: `38860ec`).
- **After:** tanpa/salah token = `403 CSRF_INVALID`; token benar = `201 Created`; UI tetap berfungsi (screenshot).

### F03 - DB memakai `root`
- **Before:** `DB_USER=root`.
- **Patch:** user `weblab_app` dengan `SELECT, INSERT, UPDATE, DELETE` pada `pemweb_obe.*` saja (SQL: `docs/db-least-privilege.sql`).
- **After:** `SHOW GRANTS` hanya 4 hak; `DROP TABLE` ditolak (`ERROR 1142`); aplikasi normal.

## 4. Dependency Audit
- **Perintah:** `composer audit`
- **Hasil:** `No security vulnerability advisories found.` (0 kerentanan pada paket `vlucas/phpdotenv` beserta dependensinya).
- **Keputusan tindak lanjut:** Mempertahankan versi paket saat ini, mengunci pohon dependensi dengan menyertakan `composer.lock` ke dalam Git, dan menjadwalkan pemeriksaan `composer audit` secara berkala.
- **`npm audit`:** N/A (tidak memakai npm).

## 5. Area yang Diuji dan Dinyatakan Aman
SQL injection (payload pada `q`, `id`, login) gagal; XSS (payload `<img onerror>`) tampil sebagai teks; viewer `DELETE` manual = `403 Forbidden` dan data tetap utuh.

## 6. Risiko Residual

| Risiko | Kategori | Alasan / tindak lanjut |
| :--- | :--- | :--- |
| `.env` lama masih ada di histori Git | B Perlu tindak lanjut | Kredensial lama sudah diganti (akun baru); membersihkan histori (`git filter-repo`) berisiko, masuk backlog |
| Tidak ada pembatasan percobaan login (brute force) | B Perlu tindak lanjut | Backlog: rate limiting / lockout |
| Cookie belum `Secure` di localhost | A Diterima sementara | Wajib `Secure` + HTTPS saat production |
| Belum ada header keamanan (`nosniff`, CSP) | B Perlu tindak lanjut | Backlog |
| Belum ada log audit (login gagal, hapus data) | B Perlu tindak lanjut | Saat ini hanya `error_log` |
| Registrasi memberi pesan "email sudah terdaftar" | A Diterima sementara | Memungkinkan enumerasi email; dampak rendah untuk aplikasi lab |
| Role disimpan di session sampai login ulang | A Diterima sementara | Perubahan role di DB baru berlaku setelah login ulang |