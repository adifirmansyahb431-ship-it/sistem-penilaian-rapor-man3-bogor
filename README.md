# Sistem Penilaian Rapor MAN 3 Bogor

Aplikasi berbasis Node.js + Express untuk mengelola data penilaian siswa dengan fitur:
- Login admin
- Input nilai siswa
- Ulangan Harian 1-5
- Asesmen Sumatif Tengah Semester
- Asesmen Sumatif Akhir Semester
- Absensi siswa
- Daftar data nilai
- Hapus data

## Login default
- Username: `admin`
- Password: `admin123`

## Teknologi
- Node.js
- Express
- SQLite
- JWT untuk autentikasi

## Instalasi

```bash
npm install
node server.js
```

Buka browser:

```text
http://localhost:3000
```

## Catatan
Aplikasi ini dibuat untuk kebutuhan demo awal sistem penilaian rapor sekolah. Untuk penggunaan nyata, bisa dikembangkan dengan:
- database MySQL/PostgreSQL
- sistem user guru dan wali kelas
- fitur export rapor PDF
- fitur cetak raport dan rekap nilai

