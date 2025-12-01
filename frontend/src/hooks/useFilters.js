import { useState, useMemo } from 'react';

/**
 * Custom hook for managing transaction filters
 * Handles search, type filter, status filter, quick filter, and pending-only toggle
 */
export const useFilters = (transactions) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  
  // Normalize description for grouping
  const normalizeDescription = (desc) => {
    if (!desc) return '';
    return desc
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '')  // Remove dates
      .replace(/\(rate: [\d.]+\)/gi, '')     // Remove rate info
      .replace(/for \w+ \d{4}/gi, '')        // Remove "for Jan 2025"
      .replace(/\d{2}-\d{2}-\d{4}/g, '')     // Remove dates with dashes
      .replace(/\s+/g, ' ')                  // Normalize spaces
      .trim();
  };
  
  // Group transactions by normalized description
  const groupedDescriptions = useMemo(() => {
    const groups = {};
    transactions.forEach(txn => {
      const normalized = normalizeDescription(txn.description);
      if (!groups[normalized]) {
        groups[normalized] = { count: 0, ids: [], original: txn.description };
      }
      groups[normalized].count++;
      groups[normalized].ids.push(txn.id);
    });
    
    return Object.entries(groups)
      .filter(([_, data]) => data.count > 1)  // Only show 2+ occurrences
      .sort((a, b) => b[1].count - a[1].count)  // Sort by count descending
      .slice(0, 10);  // Top 10
  }, [transactions]);
  
  // Filtered transactions based on all filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Quick filter (normalized description)
    if (quickFilter) {
      filtered = filtered.filter(t => 
        normalizeDescription(t.description) === quickFilter
      );
    }
    
    // Pending only toggle
    if (showPendingOnly) {
      filtered = filtered.filter(t => t.status === 'pending');
    }
    
    return filtered;
  }, [transactions, searchQuery, typeFilter, statusFilter, quickFilter, showPendingOnly]);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setQuickFilter('');
  };
  
  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    quickFilter,
    setQuickFilter,
    showPendingOnly,
    setShowPendingOnly,
    groupedDescriptions,
    filteredTransactions,
    clearFilters,
    normalizeDescription
  };
};
