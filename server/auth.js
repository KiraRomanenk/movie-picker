import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Перевірка токена (використовуватимемо для обраного та переглянутого)
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Потрібна авторизація' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Недійсний або прострочений токен' });
  }
}

// Реєстрація
router.post('/register', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Заповніть усі поля' });
  }
  if (name.length > 50) {
    return res.status(400).json({ error: 'Імʼя не може бути довшим за 50 символів' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Некоректна електронна пошта' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль має містити щонайменше 6 символів' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash],
    );
    const user = result.rows[0];
    res.status(201).json({ token: createToken(user), user });
  } catch (err) {
    // 23505 - порушення унікальності (така пошта вже є)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Користувач із такою поштою вже існує' });
    }
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Вхід
router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Введіть пошту та пароль' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Невірна пошта або пароль' });
    }
    const publicUser = { id: user.id, name: user.name, email: user.email };
    res.json({ token: createToken(publicUser), user: publicUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Поточний користувач (перевірка токена)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [
      req.userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Користувача не знайдено' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

export default router;