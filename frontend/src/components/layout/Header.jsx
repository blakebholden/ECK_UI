import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ path, children }) => (
    <button
      onClick={() => navigate(path)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive(path)
          ? 'text-elastic-blue-600 border-b-2 border-elastic-blue-600'
          : 'text-elastic-text-secondary hover:text-elastic-text-primary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <header className="bg-elastic-dark-900 border-b border-elastic-dark-600 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-16">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src="/elasticsearch-logo-svgrepo-com.svg"
            alt="Elastic Logo"
            className="h-8 w-8"
          />
          <span className="text-white font-semibold text-xl">
            elastic
          </span>
        </div>

        <nav className="flex items-center">
          <NavLink path="/">ECK</NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;
