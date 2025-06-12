'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { CSVRow, EnrichmentField, RowEnrichmentResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Check, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface VirtualTableProps {
  rows: CSVRow[];
  fields: EnrichmentField[];
  results: Map<number, RowEnrichmentResult>;
  emailColumn?: string;
  onRowClick?: (rowIndex: number) => void;
  onCopyRow?: (rowIndex: number) => void;
  height?: number;
  rowHeight?: number;
  currentProcessingRow?: number;
}

interface TableColumn {
  key: string;
  title: string;
  width: number;
  minWidth: number;
  resizable: boolean;
  sortable: boolean;
}

export function VirtualTable({
  rows,
  fields,
  results,
  emailColumn,
  onRowClick,
  onCopyRow,
  height = 600,
  rowHeight = 48,
  currentProcessingRow = -1
}: VirtualTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const listRef = useRef<List>(null);

  // Calculate columns
  const columns = useMemo((): TableColumn[] => {
    const emailCol: TableColumn = {
      key: 'email',
      title: emailColumn || 'Email',
      width: 250,
      minWidth: 200,
      resizable: true,
      sortable: true
    };

    const fieldCols: TableColumn[] = fields.map(field => ({
      key: field.name,
      title: field.displayName,
      width: 180,
      minWidth: 120,
      resizable: true,
      sortable: true
    }));

    const actionCol: TableColumn = {
      key: 'actions',
      title: 'Actions',
      width: 120,
      minWidth: 100,
      resizable: false,
      sortable: false
    };

    return [emailCol, ...fieldCols, actionCol];
  }, [fields, emailColumn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return rows;

    return [...rows].sort((a, b) => {
      const aIndex = rows.indexOf(a);
      const bIndex = rows.indexOf(b);

      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'email') {
        aValue = emailColumn ? a[emailColumn] : Object.values(a)[0];
        bValue = emailColumn ? b[emailColumn] : Object.values(b)[0];
      } else {
        const aResult = results.get(aIndex);
        const bResult = results.get(bIndex);
        aValue = aResult?.enrichments[sortConfig.key]?.value || '';
        bValue = bResult?.enrichments[sortConfig.key]?.value || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, results, sortConfig, emailColumn]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleRowSelect = (rowIndex: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(rowIndex);
      } else {
        newSet.delete(rowIndex);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, index) => index)));
    }
  };

  const getRowStatus = (rowIndex: number) => {
    const result = results.get(rowIndex);
    if (!result) {
      return currentProcessingRow === rowIndex ? 'processing' : 'pending';
    }
    return result.status || 'completed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Row component for virtual scrolling
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = sortedData[index];
    const originalIndex = rows.indexOf(row);
    const result = results.get(originalIndex);
    const status = getRowStatus(originalIndex);
    const isSelected = selectedRows.has(originalIndex);
    const isProcessing = currentProcessingRow === originalIndex;

    const emailValue = emailColumn ? row[emailColumn] : Object.values(row)[0];

    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        } ${isProcessing ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
      >
        {/* Selection checkbox */}
        <div className="w-12 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleRowSelect(originalIndex, e.target.checked)}
            className="rounded border-gray-300"
          />
        </div>

        {/* Status indicator */}
        <div className="w-12 flex items-center justify-center">
          {getStatusIcon(status)}
        </div>

        {/* Email column */}
        <div className="flex-shrink-0 px-3 py-2 truncate" style={{ width: columnWidths.email || 250 }}>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {emailValue || '-'}
          </span>
        </div>

        {/* Field columns */}
        {fields.map((field) => {
          const enrichment = result?.enrichments[field.name];
          const value = enrichment?.value;
          const confidence = enrichment?.confidence;

          return (
            <div
              key={field.name}
              className="flex-shrink-0 px-3 py-2 truncate"
              style={{ width: columnWidths[field.name] || 180 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {formatValue(value)}
                </span>
                {confidence && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(confidence * 100)}%
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {/* Actions column */}
        <div className="flex-shrink-0 px-3 py-2" style={{ width: 120 }}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRowClick?.(originalIndex)}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyRow?.(originalIndex)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }, [sortedData, rows, results, fields, emailColumn, selectedRows, currentProcessingRow, columnWidths, onRowClick, onCopyRow]);

  // Header component
  const Header = () => (
    <div className="flex items-center border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
      {/* Selection header */}
      <div className="w-12 flex items-center justify-center py-3">
        <input
          type="checkbox"
          checked={selectedRows.size === rows.length && rows.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300"
        />
      </div>

      {/* Status header */}
      <div className="w-12 flex items-center justify-center py-3">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</span>
      </div>

      {/* Column headers */}
      {columns.map((column) => (
        <div
          key={column.key}
          className="flex-shrink-0 px-3 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
          style={{ width: columnWidths[column.key] || column.width }}
          onClick={() => column.sortable && handleSort(column.key)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {column.title}
            </span>
            {column.sortable && sortConfig?.key === column.key && (
              sortConfig.direction === 'asc' ? 
                <ChevronUp className="h-3 w-3" /> : 
                <ChevronDown className="h-3 w-3" />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Auto-scroll to current processing row
  useEffect(() => {
    if (currentProcessingRow >= 0 && listRef.current) {
      listRef.current.scrollToItem(currentProcessingRow, 'center');
    }
  }, [currentProcessingRow]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <Header />
      <List
        ref={listRef}
        height={height}
        itemCount={sortedData.length}
        itemSize={rowHeight}
        overscanCount={10}
        className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {Row}
      </List>
      
      {/* Footer with selection info */}
      {selectedRows.size > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedRows.size} of {rows.length} rows selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button variant="outline" size="sm">
                Copy Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
