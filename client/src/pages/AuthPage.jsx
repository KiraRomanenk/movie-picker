import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Якщо користувач уже увійшов, переходимо на головну
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Сталася помилка');
        return;
      }
      login(data.token, data.user);
    } catch (err) {
      setError('Не вдалося з’єднатися із сервером.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{isRegister ? 'Реєстрація' : 'Вхід'}</h2>

        {isRegister && (
          <label>
            Імʼя
            <input type="text" value={name} maxLength={50} required
              onChange={(e) => setName(e.target.value)} />
          </label>
        )}

        <label>
          Електронна пошта
          <input type="email" value={email} required
            onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Пароль
          <input type="password" value={password} required minLength={6}
            onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Зачекайте...' : isRegister ? 'Зареєструватися' : 'Увійти'}
        </button>

        <p className="auth-switch">
          {isRegister ? (
            <>Уже є акаунт? <Link to="/login">Увійти</Link></>
          ) : (
            <>Ще немає акаунта? <Link to="/register">Зареєструватися</Link></>
          )}
        </p>
      </form>
    </div>
  );
}