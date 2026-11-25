import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import MovieCard from '../components/MovieCard';

const GENRES = [
  { id: 28, name: 'Бойовик' },
  { id: 12, name: 'Пригоди' },
  { id: 16, name: 'Анімація' },
  { id: 35, name: 'Комедія' },
  { id: 80, name: 'Кримінал' },
  { id: 99, name: 'Документальний' },
  { id: 18, name: 'Драма' },
  { id: 10751, name: 'Сімейний' },
  { id: 14, name: 'Фентезі' },
  { id: 36, name: 'Історичний' },
  { id: 27, name: 'Жахи' },
  { id: 10402, name: 'Музика' },
  { id: 9648, name: 'Детектив' },
  { id: 10749, name: 'Мелодрама' },
  { id: 878, name: 'Фантастика' },
  { id: 53, name: 'Трилер' },
  { id: 10752, name: 'Військовий' },
  { id: 37, name: 'Вестерн' },
];

// id настрою збігається з назвою іконки
const MOODS = [
  { id: 'cry', name: 'Поплакати' },
  { id: 'laugh', name: 'Посміятись' },
  { id: 'love', name: 'Закохатись' },
  { id: 'scare', name: 'Полякатись' },
  { id: 'adrenaline', name: 'Адреналін' },
  { id: 'dream', name: 'Помріяти' },
];

const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minRating, setMinRating] = useState('');

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const filtersRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetch('/api/trending')
      .then((r) => r.json())
      .then((data) => setTrending(data.results || []))
      .catch(() => setTrending([]));
  }, []);

  const heroMovies = trending.filter((m) => m.backdrop_path).slice(0, 5);
  const hero = heroMovies[heroIndex];

  const selectMood = (id) => {
    setMood(mood === id ? '' : id);
    setGenre('');
  };
  const selectGenre = (id) => {
    setGenre(genre === id ? '' : id);
    setMood('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);

    const params = new URLSearchParams();
    if (genre) params.set('genre', genre);
    if (mood) params.set('mood', mood);
    if (yearFrom) params.set('yearFrom', yearFrom);
    if (yearTo) params.set('yearTo', yearTo);
    if (minRating) params.set('minRating', minRating);

    try {
      const response = await fetch(`/api/discover?${params}`);
      if (!response.ok) throw new Error('Помилка сервера');
      const data = await response.json();
      setMovies(data.results || []);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      setError('Не вдалося завантажити фільми. Спробуйте пізніше.');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {hero && (
        <div
          className="hero"
          key={hero.id}
          style={{ backgroundImage: `url(${BACKDROP_URL}${hero.backdrop_path})` }}
        >
          <div className="hero-content">
            <span className="hero-label">У тренді цього тижня</span>
            <h1>{hero.title}</h1>
            <div className="hero-meta">
              <Icon name="star" size={16} filled /> {hero.vote_average.toFixed(1)} ·{' '}
              {hero.release_date ? hero.release_date.slice(0, 4) : ''}
            </div>
            <p>{hero.overview}</p>
            <div className="hero-actions">
              <button
                className="btn"
                onClick={() => filtersRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Підібрати фільм
              </button>
              <Link className="btn btn-ghost" to={`/movie/${hero.id}`}>
                Докладніше
              </Link>
            </div>
          </div>
          <div className="dots">
            {heroMovies.map((m, i) => (
              <button
                key={m.id}
                className={`dot ${i === heroIndex ? 'active' : ''}`}
                onClick={() => setHeroIndex(i)}
                aria-label={`Фільм ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            <Icon name="trend" size={26} /> У тренді
          </h2>
          <div className="row">
            {trending.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="section" ref={filtersRef}>
        <h2 className="section-title">
          <Icon name="sliders" size={26} /> Підбір за параметрами
        </h2>
        <form className="filters" onSubmit={handleSubmit}>
          <h3>Який у вас настрій?</h3>
          <div className="chips">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.id}
                className={`chip mood-chip ${mood === m.id ? 'active' : ''}`}
                onClick={() => selectMood(m.id)}
              >
                <Icon name={m.id} size={20} /> {m.name}
              </button>
            ))}
          </div>

          <h3>Або оберіть жанр</h3>
          <div className="chips">
            {GENRES.map((g) => (
              <button
                type="button"
                key={g.id}
                className={`chip ${genre === g.id ? 'active' : ''}`}
                onClick={() => selectGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="fields">
            <label>
              Рік від
              <input type="number" min="1900" max="2026" placeholder="2000"
                value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} />
            </label>
            <label>
              Рік до
              <input type="number" min="1900" max="2026" placeholder="2026"
                value={yearTo} onChange={(e) => setYearTo(e.target.value)} />
            </label>
            <label>
              Мін. рейтинг (0-10)
              <input type="number" min="0" max="10" step="0.5" placeholder="7"
                value={minRating} onChange={(e) => setMinRating(e.target.value)} />
            </label>
            <button type="submit" className="btn">Підібрати</button>
          </div>
        </form>
      </div>

      <div className="section" ref={resultsRef}>
        {loading && <p className="message">Завантаження...</p>}
        {error && <p className="message error">{error}</p>}
        {!loading && !error && searched && movies.length === 0 && (
          <p className="message">За вашими параметрами нічого не знайдено.</p>
        )}
        {movies.length > 0 && (
          <>
            <h2 className="section-title">
              <Icon name="dream" size={26} /> Підібрано для вас
            </h2>
            <div className="grid">
              {movies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}