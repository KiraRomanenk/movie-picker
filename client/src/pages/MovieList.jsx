import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';

export default function MovieList({ type, title, emptyText }) {
  const { user, token, loading: authLoading } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    fetch(`/api/lists/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Помилка');
        return r.json();
      })
      .then((data) => setMovies(data.movies || []))
      .catch(() => setError('Не вдалося завантажити список.'))
      .finally(() => setLoading(false));
  }, [type, token, authLoading]);

  if (authLoading || loading) return <p className="message">Завантаження...</p>;

  if (!user) {
    return (
      <div className="empty-state">
        <h2>{title}</h2>
        <p>Увійдіть, щоб побачити свій список.</p>
        <Link to="/login" className="btn">Увійти</Link>
      </div>
    );
  }

  return (
    <div className="section list-page">
      <h2 className="section-title">{title}</h2>
      {error && <p className="message error">{error}</p>}
      {!error && movies.length === 0 && (
        <div className="empty-state">
          <p>{emptyText}</p>
          <Link to="/" className="btn">Підібрати фільм</Link>
        </div>
      )}
      <div className="grid">
        {movies.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </div>
  );
}