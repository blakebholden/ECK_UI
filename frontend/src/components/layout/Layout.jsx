import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-elastic-dark-800">
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
