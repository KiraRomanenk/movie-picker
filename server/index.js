import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './auth.js';
import listsRouter from './lists.js';

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/lists', listsRouter);

// Таблиця відповідності настроїв і жанрів TMDB.
// with    - потрібні жанри (',' означає "і", '|' означає "або")
// without - жанри, які виключаємо з видачі
// Жанри: 28 бойовик, 12 пригоди, 16 анімація, 35 комедія, 80 кримінал,
// 99 документальний, 18 драма, 10751 сімейний, 14 фентезі, 36 історичний,
// 27 жахи, 10402 музика, 9648 детектив, 10749 мелодрама, 878 фантастика,
// 53 трилер, 10752 військовий, 37 вестерн
const MOODS = {
  cry: { with: '18', without: '35,27,53,80,99,36,28,12,10752,878,16' },
  laugh: { with: '35', without: '27,53,80,10752,99,36' },
  love: { with: '10749', without: '27,53,80,10752,99,36' },
  scare: { with: '27|53', without: '35,16,10751,10402' },
  adrenaline: { with: '28|12', without: '27,10751,16,10402,99' },
  dream: { with: '14|878', without: '27,53,80,99,10752' },
};

// Допоміжна функція: запит до TMDB
async function tmdb(path, params = {}) {
  const query = new URLSearchParams({
    api_key: TMDB_KEY,
    language: 'uk-UA',
    ...params,
  });
  const response = await fetch(`${TMDB_URL}${path}?${query}`);
  if (!response.ok) throw new Error(`TMDB відповів зі статусом ${response.status}`);
  return response.json();
}

// Фільми, які зараз у тренді (для банера та рядка "У тренді")
app.get('/api/trending', async (req, res) => {
  try {
    const data = await tmdb('/trending/movie/week');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося отримати тренди' });
  }
});

// Підбір фільмів за параметрами користувача
app.get('/api/discover', async (req, res) => {
  const { genre, mood, yearFrom, yearTo, minRating, page } = req.query;

  const params = {
    sort_by: 'popularity.desc',
    'vote_count.gte': '300',
    include_adult: 'false',
    page: page || '1',
  };

  // Настрій перетворюється на потрібні та виключені жанри
  if (mood && MOODS[mood]) {
    params.with_genres = MOODS[mood].with;
    params.without_genres = MOODS[mood].without;
    if (!minRating) params['vote_average.gte'] = '6.5';
  } else if (genre) {
    params.with_genres = genre;
  }

  if (yearFrom) params['primary_release_date.gte'] = `${yearFrom}-01-01`;
  if (yearTo) params['primary_release_date.lte'] = `${yearTo}-12-31`;
  if (minRating) params['vote_average.gte'] = minRating;

  try {
    const data = await tmdb('/discover/movie', params);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося отримати дані від TMDB' });
  }
});

// ----- Переклад українською (неофіційна точка доступу Google Translate) -----
const translateCache = new Map();
const CYRILLIC = /[А-Яа-яІіЇїЄєҐґ]/;

async function translateChunk(text) {
  const url =
    'https://translate.googleapis.com/translate_a/single?' +
    new URLSearchParams({ client: 'gtx', sl: 'auto', tl: 'uk', dt: 't', q: text });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Переклад: статус ${response.status}`);
  const data = await response.json();
  return data[0].map((part) => part[0]).filter(Boolean).join('');
}

// Ділимо довгий текст на частини по реченнях
function splitSentences(text, max = 1200) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if (current && (current + ' ' + s).length > max) {
      chunks.push(current);
      current = s;
    } else {
      current = current ? current + ' ' + s : s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Переклад довгого тексту (зберігає абзаци)
async function translateText(text) {
  if (translateCache.has(text)) return translateCache.get(text);
  const result = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph.trim()) {
      result.push('');
      continue;
    }
    const parts = [];
    for (const chunk of splitSentences(paragraph)) {
      parts.push(await translateChunk(chunk));
    }
    result.push(parts.join(' '));
  }
  const translated = result.join('\n');
  translateCache.set(text, translated);
  return translated;
}

// Переклад імен персонажів (одним запитом), якщо TMDB дав їх не українською
async function translateCharacters(cast) {
  const need = cast.filter((a) => a.character && !CYRILLIC.test(a.character));
  if (need.length === 0) return cast;
  try {
    const joined = need.map((a) => a.character.replace(/\s*\n\s*/g, ' ')).join('\n');
    const lines = (await translateChunk(joined)).split('\n');
    if (lines.length === need.length) {
      need.forEach((a, i) => {
        if (lines[i].trim()) a.character = lines[i].trim();
      });
    }
  } catch (err) {
    // Якщо переклад не вдався, залишаємо оригінальні імена
  }
  return cast;
}

// Переклад тексту (використовується для відгуків)
app.post('/api/translate', async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim() || text.length > 10000) {
    return res.status(400).json({ error: 'Некоректний текст' });
  }
  try {
    const translation = await translateText(text);
    res.json({ translation });
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося перекласти' });
  }
});

// Детальна інформація про фільм: опис, актори, трейлер, відгуки
app.get('/api/movie/:id', async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Некоректний ідентифікатор' });
  }
  try {
    const [movie, reviews] = await Promise.all([
      tmdb(`/movie/${id}`, {
        append_to_response: 'videos,credits',
        include_video_language: 'uk,en,null',
      }),
      // Відгуки на TMDB здебільшого англійською
      tmdb(`/movie/${id}/reviews`, { language: 'en-US' }),
    ]);

    if (movie.credits?.cast) {
      movie.credits.cast = await translateCharacters(movie.credits.cast.slice(0, 12));
    }

    res.json({ movie, reviews: reviews.results.slice(0, 6) });
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося отримати фільм' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});