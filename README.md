# КіноПідбір

Вебзастосунок підбору фільмів за параметрами користувача (настрій, жанр, роки випуску, рейтинг). Курсова робота.

## Технології
- Frontend: React (Vite), JavaScript, CSS
- Backend: Node.js, Express
- База даних: PostgreSQL
- Джерело даних про фільми: TMDB API

## Запуск

1. Отримайте ключ API на https://www.themoviedb.org (Settings → API).
2. Запустіть PostgreSQL у Docker:
   ```
   docker run --name movie-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=moviedb -p 5433:5432 -v movie-db-data:/var/lib/postgresql/data -d postgres:16
   ```
3. Сервер:
   ```
   cd server
   npm install
   ```
   Створіть файл `server/.env` за зразком `server/.env.example` і впишіть свої значення. Далі:
   ```
   npm run initdb
   npm run dev
   ```
4. Клієнт (в іншому терміналі):
   ```
   cd client
   npm install
   npm run dev
   ```
5. Відкрийте http://localhost:5173/

This product uses the TMDB API but is not endorsed or certified by TMDB.