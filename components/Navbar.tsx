import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Logo: React.FC = () => (
  <Link to="/" className="flex items-center space-x-2.5">
    <img src="./logo.png" width="150" height="150" />
  </Link>
);

const NavLinks: React.FC<{ className?: string; onLinkClick?: () => void }> = ({
  className,
  onLinkClick,
}) => {
  const linkStyle =
    'text-gray-600 dark:text-gray-300 hover:text-primary transition-colors duration-300 text-base font-semibold';
  const activeLinkStyle = { color: '#14B8A6' };

  return (
    <nav className={className}>
      <NavLink
        to="/"
        className={linkStyle}
        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
        onClick={onLinkClick}
      >
        Home
      </NavLink>
      <NavLink
        to="/services"
        className={linkStyle}
        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
        onClick={onLinkClick}
      >
        Services
      </NavLink>
      <NavLink
        to="/about"
        className={linkStyle}
        style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
        onClick={onLinkClick}
      >
        About
      </NavLink>
    </nav>
  );
};

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        hasScrolled ? 'bg-white/95 dark:bg-dark-bg/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Logo />
        <div className="hidden md:flex items-center space-x-6">
          <NavLinks className="flex items-center space-x-10" />
          <ThemeToggle />
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Hi, {currentUser.name.split(' ')[0]}
              </span>
              {currentUser.role === 'admin' && (
                <Link to="/admin" className="text-sm font-semibold text-primary hover:underline">
                  Dashboard
                </Link>
              )}
              {currentUser.role === 'technician' && (
                <Link
                  to="/technician"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={logout}
                className="bg-red-500 text-white font-bold px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-300 text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/contact"
              className="bg-primary text-white font-bold px-6 py-2 rounded-full hover:bg-primary-dark transition-all duration-300"
            >
              Booking
            </Link>
          )}
        </div>
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-800 dark:text-gray-100 focus:outline-none"
          >
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              ></path>
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-dark-bg py-4 px-6 border-t dark:border-gray-700">
          <NavLinks className="flex flex-col space-y-4 items-center" onLinkClick={closeMenu} />
          {currentUser ? (
            <div className="flex flex-col items-center mt-4 gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Hi, {currentUser.name}
              </span>
              {currentUser.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="font-semibold text-primary hover:underline"
                >
                  Dashboard
                </Link>
              )}
              {currentUser.role === 'technician' && (
                <Link
                  to="/technician"
                  onClick={closeMenu}
                  className="font-semibold text-primary hover:underline"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="w-full text-center bg-red-500 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-red-600 transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/contact"
              onClick={closeMenu}
              className="mt-4 block text-center bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-primary-dark transition-colors duration-300"
            >
              Booking
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
