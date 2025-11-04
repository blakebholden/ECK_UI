import React from 'react';

export const Badge = ({ children, status = 'default', className = '' }) => {
  const baseStyles = 'px-3 py-1 rounded-full text-xs font-medium inline-block';

  const statusStyles = {
    healthy: 'bg-elastic-success/20 text-elastic-success',
    warning: 'bg-elastic-warning/20 text-elastic-warning',
    error: 'bg-elastic-danger/20 text-elastic-danger',
    default: 'bg-elastic-dark-600 text-elastic-text-primary',
  };

  return (
    <span className={`${baseStyles} ${statusStyles[status]} ${className}`}>
      {children}
    </span>
  );
};

export const HealthBadge = ({ health }) => {
  const healthMap = {
    'green': { status: 'healthy', text: 'Healthy' },
    'yellow': { status: 'warning', text: 'Warning' },
    'red': { status: 'error', text: 'Error' },
  };

  const { status, text } = healthMap[health] || { status: 'default', text: health };

  return <Badge status={status}>{text}</Badge>;
};
