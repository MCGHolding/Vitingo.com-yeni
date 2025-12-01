import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Custom hook for managing bank statement data
 * Handles loading, updating, and state management for statements
 */
export const useStatement = (bankId, selectedCurrency) => {
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  
  // Load statement when currency changes
  useEffect(() => {
    if (bankId && selectedCurrency) {
      loadLatestStatement();
    }
  }, [bankId, selectedCurrency]);
  
  const loadLatestStatement = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get statements filtered by currency
      const listResponse = await fetch(
        `${API_URL}/api/banks/${bankId}/statements?currency=${selectedCurrency}`
      );
      
      if (listResponse.ok) {
        const statements = await listResponse.json();
        
        if (statements.length > 0) {
          // Get the full details of the most recent statement
          const latestId = statements[0].id;
          const detailResponse = await fetch(
            `${API_URL}/api/banks/${bankId}/statements/${latestId}`
          );
          
          if (detailResponse.ok) {
            const fullStatement = await detailResponse.json();
            
            setStatement({
              id: fullStatement.id,
              periodStart: fullStatement.periodStart,
              periodEnd: fullStatement.periodEnd,
              accountHolder: fullStatement.accountHolder,
              iban: fullStatement.iban,
              accountNumber: fullStatement.accountNumber,
              currency: fullStatement.currency || 'AED',
              accountType: fullStatement.accountType,
              accountOpened: fullStatement.accountOpened,
              interestRate: fullStatement.interestRate,
              openingBalance: fullStatement.openingBalance,
              closingBalance: fullStatement.closingBalance,
              totalIncoming: fullStatement.totalIncoming,
              totalOutgoing: fullStatement.totalOutgoing,
              netChange: fullStatement.netChange,
              transactionCount: fullStatement.transactionCount,
              categorizedCount: fullStatement.categorizedCount,
              pendingCount: fullStatement.pendingCount,
              status: fullStatement.status
            });
            
            setTransactions(fullStatement.transactions || []);
            setSaveStatus('saved');
          }
        } else {
          // No statement for this currency yet
          setStatement(null);
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error('Failed to load statements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    statement,
    setStatement,
    transactions,
    setTransactions,
    loading,
    error,
    setError,
    saveStatus,
    setSaveStatus,
    loadLatestStatement
  };
};
