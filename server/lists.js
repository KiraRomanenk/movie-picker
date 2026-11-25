import express from 'express';
import pool from './db.js';
import { requireAuth } from './auth.js';

const router = express.Router();
const TMDB_URL = 'https://api.themoviedb.org/3';

// Дозволені таблиці. Інших назв сервер не приймає
const TABLES = { favorites: 'favorites', watched: 'watched' };

// Усі маршрути цього файлу вимагають авторизації
router.use(requireAuth);

// Чи є фільм в обраному та переглянутому поточного користувача
router.get('/status/:movieId', async (req, res) => {
  const movieId = Number(req.params.movieId);
  if (!Number.isInteger(movieId)) {
    return res.status(400).json({ error: 'Некоректний ідентифікатор' });
  }
  try {
    const fav = await pool.query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND movie_id = $2',
      [req.userId, movieId],
    );
    const wat = await pool.query(
      'SELECT 1 FROM watched WHERE user_id = $1 AND movie_id = $2',
      [req.userId, movieId],
    );
    res.json({ favorites: fav.rows.length > 0, watched: wat.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Список фільмів користувача (дані про фільми беремо з TMDB)
router.get('/:type', async (req, res) => {
  const table = TABLES[req.params.type];
  if (!table) return res.status(404).json({ error: 'Невідомий список' });

  try {
    const result = await pool.query(
      `SELECT movie_id FROM ${table} WHERE user_id = $1 ORDER BY id DESC`,
      [req.userId],
    );

    const movies = await Promise.all(
      result.rows.map(async (row) => {
        try {
          const query = new URLSearchParams({
            api_key: process.env.TMDB_API_KEY,
            language: 'uk-UA',
          });
          const response = await fetch(`${TMDB_URL}/movie/${row.movie_id}?${query}`);
          return response.ok ? await response.json() : null;
        } catch (err) {
          return null;
        }
      }),
    );

    res.json({ movies: movies.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Додати фільм у список
router.post('/:type/:movieId', async (req, res) => {
  const table = TABLES[req.params.type];
  const movieId = Number(req.params.movieId);
  if (!table || !Number.isInteger(movieId)) {
    return res.status(400).json({ error: 'Некоректний запит' });
  }
  try {
    await pool.query(
      `INSERT INTO ${table} (user_id, movie_id) VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO NOTHING`,
      [req.userId, movieId],
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Прибрати фільм зі списку
router.delete('/:type/:movieId', async (req, res) => {
  const table = TABLES[req.params.type];
  const movieId = Number(req.params.movieId);
  if (!table || !Number.isInteger(movieId)) {
    return res.status(400).json({ error: 'Некоректний запит' });
  }
  try {
    await pool.query(`DELETE FROM ${table} WHERE user_id = $1 AND movie_id = $2`, [
      req.userId,
      movieId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

export default router;