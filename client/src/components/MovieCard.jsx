import { Link } from 'react-router-dom';
import Icon from './Icon';

const POSTER_URL = 'https://image.tmdb.org/t/p/w342';

export default function MovieCard({ movie, index = 0 }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="card"
      style={{ animationDelay: `${(index % 12) * 0.05}s` }}
    >
      {movie.poster_path ? (
        <img src={`${POSTER_URL}${movie.poster_path}`} alt={movie.title} loading="lazy" />
      ) : (
        <div className="no-poster">Немає постера</div>
      )}
      <div className="rating">
        <Icon name="star" size={13} filled /> {movie.vote_average.toFixed(1)}
      </div>
      <div className="overlay">
        <span>{movie.overview || 'Опис відсутній.'}</span>
      </div>
      <div className="card-info">
        <h3>{movie.title}</h3>
        <div className="year">
          {movie.release_date ? movie.release_date.slice(0, 4) : '—'}
        </div>
      </div>
    </Link>
  );
}