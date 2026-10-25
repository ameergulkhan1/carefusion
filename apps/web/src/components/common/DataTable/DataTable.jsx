import React from 'react';
import './DataTable.css';

const DataTable = ({ columns = [], data = [], onRowClick }) => {
  const getCellValue = (row, col) => {
    const rawValue = row?.[col.accessor];

    if (typeof col.render === 'function') {
      return col.render(rawValue, row);
    }

    // Prevent React runtime errors when value is an object/array and no renderer is provided.
    if (rawValue !== null && typeof rawValue === 'object') {
      return '';
    }

    return rawValue ?? '';
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} onClick={() => onRowClick && onRowClick(row)}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>{getCellValue(row, col)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;