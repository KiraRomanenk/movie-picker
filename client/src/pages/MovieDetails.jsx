import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280';
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';
const PROFILE_URL = 'https://image.tmdb.org/t/p/w185';

function formatRuntime(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} год ${m} хв` : `${m} хв`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function Review({ review }) {
  const [open, setOpen] = useState(false);
  const [translation, setTranslation] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  const rating = review.author_details?.rating;
  const text = showTranslation && translation ? translation : review.content;
  const isLong = text.length > 400;

  const handleTranslate = async () => {
    // Переклад уже є: просто перемикаємо між оригіналом і перекладом
    if (translation) {
      setShowTranslation(!showTranslation);
      return;
    }
    setTranslating(true);
    setTranslateError('');
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: review.content }),
      });
      if (!response.ok) throw new Error('Помилка');
      const data = await response.json();
      setTranslation(data.translation);
      setShowTranslation(true);
    } catch (err) {
      setTranslateError('Не вдалося перекласти. Спробуйте пізніше.');
    } finally {
      setTranslating(false);
    }
  };

  let translateLabel = 'Перекласти українською';
  if (translating) translateLabel = 'Перекладаю...';
  else if (translation) translateLabel = showTranslation ? 'Показати оригінал' : 'Показати переклад';

  return (
    <div className="review">
      <div className="review-head">
        <div className="avatar">{review.author.charAt(0).toUpperCase()}</div>
        <div>
          <strong>{review.author}</strong>
          {rating && (
            <span className="review-rating">
              <Icon name="star" size={13} filled /> {rating}/10
            </span>
          )}
        </div>
      </div>

      <p className={open ? 'review-text open' : 'review-text'}>{text}</p>

      {isLong && (
        <button className="link-btn" onClick={() => setOpen(!open)}>
          {open ? 'Згорнути' : 'Читати повністю'}
        </button>
      )}

      <div className="translate-row">
        <button className="link-btn" onClick={handleTranslate} disabled={translating}>
          {translateLabel}
        </button>
        {showTranslation && translation && <span className="mt-note">Машинний переклад</span>}
        {translateError && <span className="translate-error">{translateError}</span>}
      </div>
    </div>
  );
}

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTrailer, setShowTrailer] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ favorites: false, watched: false });

  useEffect(() => {
    setLoading(true);
    setError('');
    setMovie(null);
    setShowTrailer(false);
    window.scrollTo(0, 0);

    fetch(`/api/movie/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Помилка');
        return r.json();
      })
      .then((data) => {
        setMovie(data.movie);
        setReviews(data.reviews || []);
      })
      .catch(() => setError('Не вдалося завантажити фільм.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Закриття трейлера клавішею Escape
  useEffect(() => {
    if (!showTrailer) return;
    const onKey = (e) => e.key === 'Escape' && setShowTrailer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showTrailer]);

    // Перевіряємо, чи є фільм в обраному та переглянутому
  useEffect(() => {
    setStatus({ favorites: false, watched: false });
    if (!token) return;
    fetch(`/api/lists/status/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => {});
  }, [id, token]);

  // Додати або прибрати фільм зі списку
  const toggleList = async (type) => {
    if (!token) {
      navigate('/login');
      return;
    }
    const active = status[type];
    try {
      const response = await fetch(`/api/lists/${type}/${id}`, {
        method: active ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setStatus({ ...status, [type]: !active });
    } catch (err) {
      // Якщо запит не вдався, стан кнопки не змінюємо
    }
  };
  if (loading) return <p className="message">Завантаження...</p>;
  if (error || !movie) {
    return <p className="message error">{error || 'Фільм не знайдено.'}</p>;
  }

  const director = movie.credits?.crew?.find((p) => p.job === 'Director');
  const cast = (movie.credits?.cast || []).slice(0, 12);
  const videos = (movie.videos?.results || []).filter((v) => v.site === 'YouTube');
  const trailer =
    videos.find((v) => v.type === 'Trailer') ||
    videos.find((v) => v.type === 'Teaser') ||
    videos[0];
  const countries = movie.production_countries?.map((c) => c.name).join(', ');

  return (
    <div className="details">
      <section
        className="details-hero"
        style={{
          backgroundImage: movie.backdrop_path
            ? `url(${BACKDROP_URL}${movie.backdrop_path})`
            : 'none',
        }}
      >
        <div className="details-inner">
          <div className="details-main">
            <Link to="/" className="back-link">
              <Icon name="back" size={18} /> Назад
            </Link>
            <h1 className="details-title">{movie.title}</h1>
            {movie.tagline && <p className="tagline">{movie.tagline}</p>}

            <div className="genre-tags">
              {movie.genres?.map((g) => (
                <span key={g.id}>{g.name}</span>
              ))}
            </div>

            <div className="details-score">
              <Icon name="star" size={22} filled /> {movie.vote_average.toFixed(1)}
              <span>({movie.vote_count} оцінок)</span>
            </div>

            <p className="details-overview">{movie.overview || 'Опис відсутній.'}</p>

            <div className="details-actions">
              {trailer ? (
                <button className="btn" onClick={() => setShowTrailer(true)}>
                  <Icon name="play" size={18} filled /> Дивитись трейлер
                </button>
              ) : (
                <span className="no-trailer">Трейлер недоступний</span>
              )}
              <button
                className={`btn btn-ghost ${status.favorites ? 'on' : ''}`}
                onClick={() => toggleList('favorites')}
              >
                <Icon name="love" size={18} filled={status.favorites} />{' '}
                {status.favorites ? 'В обраному' : 'В обране'}
              </button>
              <button
                className={`btn btn-ghost ${status.watched ? 'on' : ''}`}
                onClick={() => toggleList('watched')}
              >
                <Icon name="eye" size={18} />{' '}
                {status.watched ? 'Переглянуто' : 'Позначити переглянутим'}
              </button>
            </div>
          </div>

          <aside className="details-panel">
            {movie.poster_path && (
              <img src={`${POSTER_URL}${movie.poster_path}`} alt={movie.title} />
            )}
            <div className="fact">
              <small>Прем'єра</small>
              {formatDate(movie.release_date)}
            </div>
            <div className="fact">
              <small>Режисер</small>
              {director ? director.name : '—'}
            </div>
            <div className="fact">
              <small>Тривалість</small>
              {formatRuntime(movie.runtime)}
            </div>
            <div className="fact">
              <small>Країна</small>
              {countries || '—'}
            </div>
          </aside>
        </div>
      </section>

      {cast.length > 0 && (
        <div className="section">
          <h2 className="section-title">В ролях</h2>
          <div className="row">
            {cast.map((actor, i) => (
              <div
                className="cast-card"
                key={actor.id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {actor.profile_path ? (
                  <img src={`${PROFILE_URL}${actor.profile_path}`} alt={actor.name} loading="lazy" />
                ) : (
                  <div className="cast-photo">
                    <Icon name="user" size={36} />
                  </div>
                )}
                <strong>{actor.name}</strong>
                <span>{actor.character}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">Відгуки глядачів</h2>
        {reviews.length > 0 ? (
          <>
            <p className="reviews-note">
              Відгуки з TMDB наведено мовою оригіналу. Натисніть «Перекласти українською», щоб прочитати переклад.
            </p>
            <div className="reviews">
              {reviews.map((r) => (
                <Review key={r.id} review={r} />
              ))}
            </div>
          </>
        ) : (
          <p className="message">Для цього фільму ще немає відгуків.</p>
        )}
      </div>

      {showTrailer && trailer && (
        <div className="modal" onClick={() => setShowTrailer(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowTrailer(false)}
              aria-label="Закрити"
            >
              <Icon name="close" size={32} />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
              title="Трейлер"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}