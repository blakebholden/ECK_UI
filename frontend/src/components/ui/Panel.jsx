import React from 'react';

export const Panel = ({ children, className = '' }) => {
  return (
    <div className={`panel-elastic p-6 ${className}`}>
      {children}
    </div>
  );
};

export const PanelHeader = ({ children, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
};

export const PanelTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-2xl font-semibold text-elastic-text-primary ${className}`}>
      {children}
    </h2>
  );
};

export const PanelBody = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
