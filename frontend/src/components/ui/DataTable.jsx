import React, { useState, useMemo } from 'react';
import { FolderOpen, Search, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './Button';

export function DataTable({ 
  columns, 
  data, 
  isLoading, 
  emptyTitle = "No data available", 
  emptyDescription = "Get started by adding your first record.", 
  actionButton = null,
  searchableFields = [], // Array of keys to search against
  csvFilename = "export.csv"
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 1. Search Filter
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchTerm || searchableFields.length === 0) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => {
      return searchableFields.some(field => {
        // Handle nested fields like "customer.full_name"
        const keys = field.split('.');
        let value = item;
        for (const k of keys) {
          if (value === null || value === undefined) break;
          value = value[k];
        }
        return value && value.toString().toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, searchableFields]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const keys = sortConfig.key.split('.');
        let aVal = a;
        let bVal = b;
        for (const k of keys) {
          aVal = aVal ? aVal[k] : null;
          bVal = bVal ? bVal[k] : null;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Clear sort on third click
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  // 3. CSV Export
  const downloadCSV = () => {
    if (!sortedData || sortedData.length === 0) return;

    // Build headers from column definitions that have accessors or raw values
    const exportColumns = columns.filter(c => c.accessor || c.csvValue);
    
    const csvRows = [];
    // Header row
    csvRows.push(exportColumns.map(c => `"${c.header}"`).join(','));
    
    // Data rows
    sortedData.forEach(row => {
      const values = exportColumns.map(c => {
        let val = '';
        if (c.csvValue) {
          val = c.csvValue(row);
        } else if (c.accessor) {
          const keys = c.accessor.split('.');
          val = row;
          for (const k of keys) {
            val = val ? val[k] : '';
          }
        }
        // Escape quotes
        val = (val || '').toString().replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', csvFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        <div className="animate-pulse flex flex-col">
          <div className="h-14 bg-slate-50 border-b border-slate-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
              {[...Array(columns.length)].map((_, j) => (
                <div key={j} className="h-4 bg-slate-200 rounded w-full"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-soft border border-slate-200 p-12 md:p-24 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-brand-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{emptyTitle}</h3>
        <p className="text-slate-500 max-w-sm mb-6">{emptyDescription}</p>
        {actionButton}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all duration-300 shadow-sm"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={downloadCSV} className="w-full sm:w-auto shadow-sm">
          <Download className="w-4 h-4 mr-2 text-slate-500" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-4 uppercase tracking-wider text-xs ${col.className || ''} ${col.accessor ? 'cursor-pointer hover:bg-slate-200/50 transition-colors select-none group/header' : ''}`}
                  onClick={() => col.accessor && requestSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.accessor && (
                      <span className={`transition-opacity duration-200 ${sortConfig.key === col.accessor ? 'opacity-100 text-brand-600' : 'opacity-0 group-hover/header:opacity-40 text-slate-400'}`}>
                        {sortConfig.key === col.accessor && sortConfig.direction === 'desc' ? (
                          <ChevronDown className="w-4 h-4 -ml-1" />
                        ) : (
                          <ChevronUp className="w-4 h-4 -ml-1" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length > 0 ? (
              sortedData.map((row, i) => (
                <tr key={i} className="hover:bg-brand-50/50 transition-colors duration-200 group">
                  {columns.map((col, j) => (
                    <td key={j} className={`px-6 py-4 text-slate-700 ${col.className || ''}`}>
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  No records match your search "<strong>{searchTerm}</strong>"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
