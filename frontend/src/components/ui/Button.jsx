import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium py-2 px-4 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-elastic-blue-500';

  const variants = {
    primary: 'bg-elastic-blue-600 hover:bg-elastic-blue-500 text-white',
    secondary: 'bg-elastic-dark-600 hover:bg-elastic-dark-500 text-elastic-text-primary',
    ghost: 'bg-transparent hover:bg-elastic-dark-600 text-elastic-text-primary',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const Link = ({
  children,
  href,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`text-elastic-blue-600 hover:text-elastic-blue-500 transition-colors cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </a>
  );
};
