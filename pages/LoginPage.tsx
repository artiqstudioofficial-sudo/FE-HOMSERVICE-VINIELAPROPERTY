import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, currentUser, isAuthLoading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from?.pathname || '/', [location.state]);

  // Kalau user sudah login (session masih ada), langsung redirect berdasarkan role
  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser) return;

    if (currentUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (currentUser.role === 'technician') {
      navigate('/technician', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  }, [currentUser, isAuthLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const user = await login(username.trim(), password);
    setIsSubmitting(false);

    if (!user) {
      setError('Username atau password salah.');
      return;
    }

    // Redirect berdasarkan role
    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user.role === 'technician') {
      navigate('/technician', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  // Optional: tampilkan loading saat cek session awal (auth-me)
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-light-bg dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-gray-600 dark:text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-700 dark:text-gray-200 font-semibold">Memeriksa sesi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-light-bg dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl"
        data-aos="fade-up"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-poppins">
            Login Area
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Masuk sebagai Admin atau Teknisi.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username-input" className="sr-only">
                Username
              </label>
              <input
                id="username-input"
                name="username"
                type="text"
                autoComplete="username"
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="relative">
              <label htmlFor="password-input" className="sr-only">
                Password
              </label>
              <input
                id="password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
              >
                {showPassword ? (
                  // Eye Off
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.733 5.076A10.744 10.744 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    <path d="M14.1 14.1a3 3 0 0 0-4.2-4.2" />
                  </svg>
                ) : (
                  // Eye
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
