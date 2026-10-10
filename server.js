const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = './data/scripts.json';
const UPLOADS_DIR = './data/uploads';
const ADMIN_KEY = 'DRAKEADMIN';

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ scripts: [] }, null, 2));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function lerDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function salvarDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(403).json({ erro: 'Acesso negado' });
  next();
}

// ==================== API PÚBLICA ====================

app.get('/api/scripts', (req, res) => {
  const db = lerDB();
  const q = (req.query.q || '').toLowerCase();
  let list = db.scripts;
  if (q) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.credit.toLowerCase().includes(q) ||
      s.game.toLowerCase().includes(q)
    );
  }
  list = list.slice().sort((a, b) => b.time - a.time);
  res.json(list);
});

app.get('/api/scripts/:id', (req, res) => {
  const db = lerDB();
  const s = db.scripts.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ erro: 'Não encontrado' });
  res.json(s);
});

app.get('/api/scripts/:id/code', (req, res) => {
  const db = lerDB();
  const s = db.scripts.find(x => x.id === req.params.id);
  if (!s) return res.status(404).send('-- Não encontrado');
  s.plays = (s.plays || 0) + 1;
  salvarDB(db);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(s.code);
});

app.post('/api/scripts/:id/play', (req, res) => {
  const db = lerDB();
  const s = db.scripts.find(x => x.id === req.params.id);
  if (s) {
    s.plays = (s.plays || 0) + 1;
    salvarDB(db);
  }
  res.json({ ok: true });
});

// ==================== API ADMIN ====================

app.post('/api/admin/login', (req, res) => {
  const { key } = req.body;
  if (key === ADMIN_KEY) return res.json({ ok: true });
  res.status(403).json({ ok: false });
});

app.post('/api/admin/scripts', checkAdmin, upload.single('image'), (req, res) => {
  const { name, credit, game, code } = req.body;
  if (!name || !code) return res.status(400).json({ erro: 'Falta nombre o código' });

  const db = lerDB();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name,
    credit: credit || 'Anônimo',
    game: game || 'Roblox',
    code,
    image: req.file ? '/uploads/' + req.file.filename : (req.body.image || ''),
    time: Date.now(),
    plays: 0
  };
  db.scripts.push(entry);
  salvarDB(db);
  res.json(entry);
});

app.put('/api/admin/scripts/:id', checkAdmin, (req, res) => {
  const db = lerDB();
  const idx = db.scripts.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ erro: 'Não encontrado' });
  const { name, credit, game, code, image } = req.body;
  if (name) db.scripts[idx].name = name;
  if (credit) db.scripts[idx].credit = credit;
  if (game) db.scripts[idx].game = game;
  if (code) db.scripts[idx].code = code;
  if (image !== undefined) db.scripts[idx].image = image;
  salvarDB(db);
  res.json(db.scripts[idx]);
});

app.delete('/api/admin/scripts/:id', checkAdmin, (req, res) => {
  const db = lerDB();
  const s = db.scripts.find(x => x.id === req.params.id);
  if (s && s.image && s.image.startsWith('/uploads/')) {
    const filePath = '.' + s.image;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.scripts = db.scripts.filter(x => x.id !== req.params.id);
  salvarDB(db);
  res.json({ ok: true });
});

app.delete('/api/admin/scripts', checkAdmin, (req, res) => {
  const db = lerDB();
  db.scripts.forEach(s => {
    if (s.image && s.image.startsWith('/uploads/')) {
      const filePath = '.' + s.image;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });
  db.scripts = [];
  salvarDB(db);
  res.json({ ok: true });
});

// ==================== INICIAR ====================

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  DRAKE EXE WEB');
  console.log('========================================');
  console.log('  Servidor:    http://localhost:' + PORT);
  console.log('  Admin:       http://localhost:' + PORT + '/admin.html');
  console.log('  Clave admin: ' + ADMIN_KEY);
  console.log('========================================');
  console.log('');
});