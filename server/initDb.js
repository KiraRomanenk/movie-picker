import fs from 'fs';
import pool from './db.js';

// Читаємо SQL-скрипт і виконуємо його в базі
const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

try {
  await pool.query(sql);
  console.log('Таблиці створено (або вони вже існують).');
} catch (err) {
  console.error('Помилка:', err.message);
} finally {
  await pool.end();
}