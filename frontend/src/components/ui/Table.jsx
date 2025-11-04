import React from 'react';

export const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`table-elastic ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHead = ({ children }) => {
  return <thead>{children}</thead>;
};

export const TableBody = ({ children }) => {
  return <tbody>{children}</tbody>;
};

export const TableRow = ({ children, onClick, className = '' }) => {
  return (
    <tr
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHeader = ({ children, sortable, onSort, sorted, className = '' }) => {
  return (
    <th
      className={`${sortable ? 'cursor-pointer select-none hover:text-elastic-text-primary' : ''} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && sorted && (
          <span className="text-xs">
            {sorted === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

export const TableCell = ({ children, className = '' }) => {
  return <td className={className}>{children}</td>;
};
