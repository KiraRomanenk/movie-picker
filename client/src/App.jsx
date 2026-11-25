import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Icon from './components/Icon';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Placeholder from './pages/Placeholder';
import AuthPage from './pages/AuthPage';
import MovieList from './pages/MovieList';
import { useAuth } from './context/AuthContext';
import './App.css';

function Navbar() {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Кіно<span>Підбір</span>
      </Link>

      <div className="nav-links">
        <NavLink to="/" end className={linkClass}>
          <Icon name="home" size={18} /> Головна
        </NavLink>
        <NavLink to="/favorites" className={linkClass}>
          <Icon name="love" size={18} /> Обране
        </NavLink>
        <NavLink to="/watched" className={linkClass}>
          <Icon name="eye" size={18} /> Переглянуте
        </NavLink>
      </div>

      {user ? (
        <div className="nav-auth">
          <span className="nav-user">
            <Icon name="user" size={18} /> {user.name}
          </span>
          <button className="btn btn-small btn-ghost" onClick={logout}>
            Вийти
          </button>
        </div>
      ) : (
        <Link to="/login" className="btn btn-small">
          <Icon name="user" size={18} /> Увійти
        </Link>
      )}
    </nav>
  );
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route
          path="/favorites"
          element={
            <MovieList
              key="favorites"
              type="favorites"
              title="Обране"
              emptyText="У вас ще немає обраних фільмів."
            />
          }
        />
        <Route
          path="/watched"
          element={
            <MovieList
              key="watched"
              type="watched"
              title="Переглянуте"
              emptyText="Ви ще не позначили жодного фільму переглянутим."
            />
          }
        />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="*" element={<Placeholder title="Сторінку не знайдено" />} />
      </Routes>
      <p className="footer">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  );
}

export default App;