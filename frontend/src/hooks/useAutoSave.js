import { useState, useCallback } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Custom hook for auto-saving transaction updates
 * Handles optimistic updates and backend synchronization
 */
export const useAutoSave = (bankId, statement, setTransactions, setSaveStatus) => {
  const [savingTransactions, setSavingTransactions] = useState({});
  
  // Calculate transaction status
  const calculateStatus = (txn) => {
    if (!txn.type) return 'pending';
    if (txn.type === 'collection' && !txn.customerId) return 'pending';
    if ((txn.type === 'fx_buy' || txn.type === 'fx_sell') && !txn.currencyPair) return 'pending';
    return 'completed';
  };
  
  // Check if type requires category
  const typeRequiresCategory = (type) => {
    return ['payment', 'refund', ''].includes(type);
  };
  
  // Update transaction with auto-save
  const handleTransactionUpdate = useCallback(async (txnId, field, value) => {
    setSaveStatus('saving');
    
    // Optimistic update - update local state first
    setTransactions(prev => prev.map(txn => {
      if (txn.id !== txnId) return txn;
      
      const updated = { ...txn, [field]: value };
      
      // Clear related fields when type changes
      if (field === 'type') {
        if (value !== 'collection') updated.customerId = null;
        if (!['fx_buy', 'fx_sell'].includes(value)) updated.currencyPair = null;
        if (!typeRequiresCategory(value)) {
          updated.categoryId = null;
          updated.subCategoryId = null;
        }
      }
      
      // Clear sub-category when category changes
      if (field === 'categoryId') {
        updated.subCategoryId = null;
      }
      
      // Update status
      updated.status = calculateStatus(updated);
      
      return updated;
    }));
    
    // Backend save (auto-save)
    if (statement?.id) {
      setSavingTransactions(prev => ({ ...prev, [txnId]: true }));
      
      try {
        const updateData = { [field]: value };
        
        const response = await fetch(
          `${API_URL}/api/banks/${bankId}/statements/${statement.id}/transactions/${txnId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          }
        );
        
        if (!response.ok) {
          throw new Error('Kaydetme hatası');
        }
        
        const data = await response.json();
        
        // Sync with backend response
        if (data.updatedTransaction) {
          setTransactions(prev => prev.map(txn => 
            txn.id === txnId ? { ...txn, ...data.updatedTransaction } : txn
          ));
        }
        
        // Save successful
        setSaveStatus('saved');
        
        // Return updated transaction for bulk action check
        return data.updatedTransaction;
        
      } catch (err) {
        console.error('Transaction update failed:', err);
        setSaveStatus('unsaved');
        return null;
      } finally {
        setSavingTransactions(prev => {
          const newState = { ...prev };
          delete newState[txnId];
          return newState;
        });
      }
    }
  }, [bankId, statement, setTransactions, setSaveStatus]);
  
  return {
    savingTransactions,
    handleTransactionUpdate,
    calculateStatus,
    typeRequiresCategory
  };
};
