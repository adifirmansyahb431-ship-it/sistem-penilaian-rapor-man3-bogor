const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 3000;
const JWT_SECRET = 'man3-bogor-rapor-secret-key';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./rapor.db', (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'admin'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS nilai_siswa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nis TEXT,
        nama TEXT,
        kelas TEXT,
        semester TEXT,
        uh1 INTEGER,
        uh2 INTEGER,
        uh3 INTEGER,
        uh4 INTEGER,
        uh5 INTEGER,
        sts INTEGER,
        sas INTEGER,
        hadir INTEGER,
        sakit INTEGER,
        izin INTEGER,
        alpha INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('Error checking admin user:', err.message);
        return;
      }

      if (!row) {
        db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          ['admin', 'admin123', 'admin'],
          (insertErr) => {
            if (insertErr) {
              console.error('Failed to create default admin:', insertErr.message);
            } else {
              console.log('Default admin user created: admin / admin123');
            }
          }
        );
      }
    });
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid' });
    }
    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }

    if (!row) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const token = jwt.sign({ id: row.id, username: row.username, role: row.role }, JWT_SECRET, {
      expiresIn: '8h'
    });

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: { username: row.username, role: row.role }
    });
  });
});

app.post('/api/rapor/input', authenticateToken, (req, res) => {
  const {
    nis,
    nama,
    kelas,
    semester,
    uh1,
    uh2,
    uh3,
    uh4,
    uh5,
    sts,
    sas,
    hadir,
    sakit,
    izin,
    alpha
  } = req.body;

  if (!nis || !nama || !kelas || !semester) {
    return res.status(400).json({
      success: false,
      message: 'NIS, nama, kelas, dan semester wajib diisi.'
    });
  }

  const query = `
    INSERT INTO nilai_siswa (
      nis, nama, kelas, semester,
      uh1, uh2, uh3, uh4, uh5,
      sts, sas,
      hadir, sakit, izin, alpha
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    nis, nama, kelas, semester,
    Number(uh1 || 0),
    Number(uh2 || 0),
    Number(uh3 || 0),
    Number(uh4 || 0),
    Number(uh5 || 0),
    Number(sts || 0),
    Number(sas || 0),
    Number(hadir || 0),
    Number(sakit || 0),
    Number(izin || 0),
    Number(alpha || 0)
  ], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan data.',
        error: err.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data berhasil disimpan.',
      id: this.lastID
    });
  });
});

app.get('/api/rapor/data', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM nilai_siswa ORDER BY created_at DESC';

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data.',
        error: err.message
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

app.delete('/api/rapor/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM nilai_siswa WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus data.',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data berhasil dihapus.' });
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log('Login demo: username = admin, password = admin123');
});
