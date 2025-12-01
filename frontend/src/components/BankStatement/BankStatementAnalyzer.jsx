import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Copy, Plus } from 'lucide-react';
import AutoMatchBadge from './AutoMatchBadge';
import BulkActionModal from './BulkActionModal';
import AutoMatchNotificationModal from './AutoMatchNotificationModal';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Transaction Types
const TRANSACTION_TYPES = [
  { value: '', label: 'Seçiniz', color: 'gray' },
  { value: 'collection', label: 'Tahsilat', color: 'green', requiresCustomer: true },
  { value: 'payment', label: 'Ödeme', color: 'red' },
  { value: 'refund', label: 'İade', color: 'orange' },
  { value: 'cashback', label: 'Cashback', color: 'purple' },
  { value: 'fx_buy', label: 'Döviz Alım', color: 'blue', requiresCurrencyPair: true },
  { value: 'fx_sell', label: 'Döviz Satım', color: 'blue', requiresCurrencyPair: true },
  { value: 'cash_deposit', label: 'Nakit Yatan', color: 'teal' }
];

const CURRENCY_PAIRS = [
  { value: 'USD-AED', label: 'USD → AED' },
  { value: 'USD-EUR', label: 'USD → EUR' },
  { value: 'AED-USD', label: 'AED → USD' },
  { value: 'AED-EUR', label: 'AED → EUR' },
  { value: 'EUR-AED', label: 'EUR → AED' },
  { value: 'EUR-USD', label: 'EUR → USD' }
];

const BankStatementAnalyzer = ({ bankId }) => {
  // State
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [savingTransactions, setSavingTransactions] = useState({});
  
  // Multi-currency support
  const [selectedCurrency, setSelectedCurrency] = useState('AED');
  const [availableCurrencies, setAvailableCurrencies] = useState(['AED', 'USD', 'EUR', 'GBP']);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  
  // Filtering and bulk operations
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  
  // Auto-match notification
  const [showAutoMatchModal, setShowAutoMatchModal] = useState(false);
  const [autoMatchData, setAutoMatchData] = useState(null);
  
  // Customer modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [pendingCustomerTxnId, setPendingCustomerTxnId] = useState(null);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    country: 'UAE',
    city: 'Dubai'
  });
  const [customerErrors, setCustomerErrors] = useState({});
  const [savingCustomer, setSavingCustomer] = useState(false);
  
  // Load categories and customers
  useEffect(() => {
    loadCategories();
    loadCustomers();
  }, []);
  
  // Load statement when currency changes
  useEffect(() => {
    loadLatestStatement();
  }, [selectedCurrency]);
  
  const loadLatestStatement = async () => {
    try {
      // Get statements filtered by currency
      const listResponse = await fetch(`${API_URL}/api/banks/${bankId}/statements?currency=${selectedCurrency}`);
      if (listResponse.ok) {
        const statements = await listResponse.json();
        
        if (statements.length > 0) {
          // Get the full details of the most recent statement (with transactions)
          const latestId = statements[0].id;
          const detailResponse = await fetch(`${API_URL}/api/banks/${bankId}/statements/${latestId}`);
          
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
    } catch (error) {
      console.error('Failed to load statements:', error);
    }
  };
  
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/expense-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };
  
  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers`);
      const data = await response.json();
      // Backend'den direkt array dönüyor
      const customerList = Array.isArray(data) ? data : (data.customers || []);
      setCustomers(customerList);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
    }
  };
  
  // Dosya yükleme
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Sadece PDF dosyaları destekleniyor');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/api/banks/${bankId}/statements/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Yükleme başarısız');
      }
      
      const data = await response.json();
      
      setStatement({
        id: data.statementId,
        ...data.headerInfo,
        ...data.statistics
      });
      setTransactions(data.transactions || []);
      
      // Show auto-match notification modal if there are auto-matched transactions
      if (data.autoMatchedCount > 0 || data.suggestedCount > 0) {
        const autoMatched = (data.transactions || []).filter(t => t.autoMatched || t.suggestedMatch);
        setAutoMatchData({
          autoMatchedCount: data.autoMatchedCount || 0,
          suggestedCount: data.suggestedCount || 0,
          transactions: autoMatched
        });
        setShowAutoMatchModal(true);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [bankId]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading
  });
  
  // Para formatla
  const formatMoney = (amount, currency = 'AED') => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absAmount) + ' ' + currency;
  };
  
  // Yeni ekstre yükle
  const handleNewUpload = () => {
    setStatement(null);
    setTransactions([]);
    setError(null);
    setSelectedRows([]);
  };
  
  // Kopyalama
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(fieldName);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };
  
  // Calculate status
  const calculateStatus = (txn) => {
    if (!txn.type) return 'pending';
    if (txn.type === 'collection' && !txn.customerId) return 'pending';
    if ((txn.type === 'fx_buy' || txn.type === 'fx_sell') && !txn.currencyPair) return 'pending';
    if (typeRequiresCategory(txn.type) && !txn.categoryId) return 'pending';
    return 'completed';
  };
  
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
  
  // Kategori gerekli mi?
  const typeRequiresCategory = (type) => {
    return ['payment', 'refund', ''].includes(type);
  };
  
  // Tüm işlemi sıfırla
  const resetTransaction = async (txnId) => {
    setSaveStatus('saving');
    
    // Local state'i sıfırla
    setTransactions(prev => prev.map(txn => {
      if (txn.id !== txnId) return txn;
      
      return {
        ...txn,
        type: '',
        categoryId: null,
        subCategoryId: null,
        customerId: null,
        currencyPair: null,
        status: 'pending'
      };
    }));
    
    // Backend'e kaydet
    if (statement?.id) {
      try {
        const response = await fetch(
          `${API_URL}/api/banks/${bankId}/statements/${statement.id}/transactions/${txnId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: '',
              categoryId: null,
              subCategoryId: null,
              customerId: null,
              currencyPair: null,
              status: 'pending'
            })
          }
        );
        
        if (response.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('unsaved');
        }
      } catch (err) {
        console.error('Reset failed:', err);
        setSaveStatus('unsaved');
      }
    }
  };
  
  // İşlem güncelle (with auto-save)
  const handleTransactionUpdate = async (txnId, field, value) => {
    // Set saving status
    setSaveStatus('saving');
    
    // Optimistic update - önce local state'i güncelle
    setTransactions(prev => prev.map(txn => {
      if (txn.id !== txnId) return txn;
      
      const updated = { ...txn, [field]: value };
      
      // Tür değiştiğinde ilgili alanları temizle
      if (field === 'type') {
        if (value !== 'collection') updated.customerId = null;
        if (!['fx_buy', 'fx_sell'].includes(value)) updated.currencyPair = null;
        if (!typeRequiresCategory(value)) {
          updated.categoryId = null;
          updated.subCategoryId = null;
        }
      }
      
      // Kategori değiştiğinde alt kategoriyi temizle
      if (field === 'categoryId') {
        updated.subCategoryId = null;
      }
      
      // Durumu güncelle
      updated.status = calculateStatus(updated);
      
      return updated;
    }));
    
    // Backend'e kaydet (auto-save)
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
        
        // Backend'den gelen güncel transaction ile state'i senkronize et
        if (data.updatedTransaction) {
          setTransactions(prev => prev.map(txn => 
            txn.id === txnId ? { ...txn, ...data.updatedTransaction } : txn
          ));
        }
        
        // Save successful
        setSaveStatus('saved');
        
        // Check for similar transactions (bulk action opportunity)
        const currentTxn = transactions.find(t => t.id === txnId);
        if (currentTxn) {
          const normalized = normalizeDescription(currentTxn.description);
          const similarTxns = transactions.filter(t => 
            t.id !== txnId && 
            normalizeDescription(t.description) === normalized &&
            t.status === 'pending'
          );
          
          // If there are 2+ similar pending transactions, show bulk action modal
          if (similarTxns.length >= 2) {
            setBulkAction({
              field,
              value,
              similarTxns,
              normalizedDesc: normalized,
              sourceTxn: currentTxn
            });
            setShowBulkModal(true);
          }
        }
        
      } catch (err) {
        console.error('Transaction update failed:', err);
        setSaveStatus('unsaved');
      } finally {
        setSavingTransactions(prev => {
          const newState = { ...prev };
          delete newState[txnId];
          return newState;
        });
      }
    }
  };
  
  // Alt kategorileri getir
  const getSubCategories = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.subCategories || [];
  };
  
  // Tür rengi
  const getTypeColor = (type) => {
    const found = TRANSACTION_TYPES.find(t => t.value === type);
    const colorMap = {
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      teal: 'bg-teal-100 text-teal-800 border-teal-300',
      gray: 'bg-gray-100 text-gray-600 border-gray-300'
    };
    return colorMap[found?.color || 'gray'];
  };
  
  // Yeni müşteri ekle
  const handleAddCustomer = async () => {
    // Validasyon
    if (!newCustomerData.name.trim()) {
      setCustomerErrors({ name: 'Müşteri adı zorunlu' });
      return;
    }
    
    setSavingCustomer(true);
    setCustomerErrors({});
    
    try {
      // Backend Customer model'e uygun payload oluştur
      const customerPayload = {
        companyName: newCustomerData.name.trim(),
        companyTitle: newCustomerData.company || newCustomerData.name.trim(),
        email: newCustomerData.email || '',
        phone: newCustomerData.phone || '',
        address: newCustomerData.address || '',
        country: newCustomerData.country || 'UAE',
        city: newCustomerData.city || 'Dubai',
        relationshipType: 'Potansiyel Müşteri',
        status: 'active'
      };
      
      const response = await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Kaydetme hatası');
      }
      
      const newCustomer = await response.json();
      
      // Müşteri listesini güncelle
      setCustomers(prev => [...prev, newCustomer]);
      
      // Pending transaction'a müşteriyi ata
      if (pendingCustomerTxnId) {
        await handleTransactionUpdate(pendingCustomerTxnId, 'customerId', newCustomer.id);
        setPendingCustomerTxnId(null);
      }
      
      // Modal'ı kapat ve formu temizle
      setShowCustomerModal(false);
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        country: 'UAE',
        city: 'Dubai'
      });
      
    } catch (error) {
      console.error('Customer creation failed:', error);
      setCustomerErrors({ general: error.message || 'Bir hata oluştu' });
    } finally {
      setSavingCustomer(false);
    }
  };
  
  // Döviz çiftini tahmin et
  const suggestCurrencyPair = (description) => {
    const desc = description.toLowerCase();
    
    if (desc.includes('usd') && desc.includes('aed')) return 'USD-AED';
    if (desc.includes('usd') && desc.includes('eur')) return 'USD-EUR';
    if (desc.includes('aed') && desc.includes('usd')) return 'AED-USD';
    if (desc.includes('aed') && desc.includes('eur')) return 'AED-EUR';
    if (desc.includes('eur') && desc.includes('aed')) return 'EUR-AED';
    if (desc.includes('eur') && desc.includes('usd')) return 'EUR-USD';
    
    return null;
  };
  
  // Bulk action handler - Apply to similar transactions
  const handleBulkApply = async (shouldLearn = false) => {
    if (!bulkAction || !statement?.id) return;
    
    const { field, value, similarTxns } = bulkAction;
    
    setSaving(true);
    setShowBulkModal(false);
    
    try {
      // Prepare bulk update data
      const transactionIds = similarTxns.map(t => t.id);
      const updateData = { [field]: value };
      
      // Call backend bulk update endpoint
      const response = await fetch(
        `${API_URL}/api/banks/${bankId}/statements/${statement.id}/transactions/bulk`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionIds,
            updateData,
            shouldLearn
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Toplu güncelleme hatası');
      }
      
      const data = await response.json();
      
      // Update local state with backend response
      if (data.updatedTransactions) {
        setTransactions(prev => prev.map(txn => {
          const updated = data.updatedTransactions.find(u => u.id === txn.id);
          return updated ? { ...txn, ...updated } : txn;
        }));
      }
      
      // Show success message
      const learnMsg = shouldLearn ? ' ve pattern öğrenildi' : '';
      alert(`✅ ${transactionIds.length} işlem başarıyla güncellendi${learnMsg}!`);
      
      // Reload statement to get fresh data
      await loadLatestStatement();
      
    } catch (error) {
      console.error('Bulk update failed:', error);
      alert(`❌ Toplu güncelleme hatası: ${error.message}`);
    } finally {
      setSaving(false);
      setBulkAction(null);
    }
  };
  
  // Bulk action with learning
  const handleBulkApplyAndLearn = async () => {
    await handleBulkApply(true);
  };
  
  // Close bulk modal
  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
    setBulkAction(null);
  };
  
  // Kaydet ve Öğren
  const handleSave = async () => {
    // Önce tüm pending transaction'ları kontrol et
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    
    if (pendingCount > 0) {
      alert(`⚠️ Hata: ${pendingCount} işlem henüz tamamlanmadı. Tüm işlemleri kategorize ettikten sonra tekrar deneyin.`);
      return;
    }
    
    setSaving(true);
    try {
      // Backend'e complete isteği gönder (pattern learning)
      const response = await fetch(
        `${API_URL}/api/banks/${bankId}/statements/${statement.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error('Kaydetme hatası');
      }
      
      const data = await response.json();
      
      alert(`✅ Başarıyla kaydedildi!\n\n📚 ${data.learnedPatterns || 0} yeni pattern öğrenildi.\n\nBu pattern'lar gelecek ekstrelerde otomatik eşleştirme için kullanılacak.`);
      
      // Statement'ı completed olarak işaretle
      setStatement(prev => ({ ...prev, status: 'completed' }));
      
    } catch (error) {
      alert(`❌ Kaydetme hatası: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Otomatik eşleşmeyi onayla
  const handleConfirmMatch = async (txnId, patternId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/banks/${bankId}/statements/${statement.id}/transactions/${txnId}/confirm-match`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error('Onaylama hatası');
      }
      
      // UI güncelle
      setTransactions(prev => prev.map(txn => {
        if (txn.id === txnId) {
          return { 
            ...txn, 
            matchConfirmed: true,
            suggestedMatch: null 
          };
        }
        return txn;
      }));
      
      console.log('✅ Pattern onaylandı');
    } catch (error) {
      console.error('Pattern onaylama hatası:', error);
      alert('Pattern onaylanamadı');
    }
  };
  
  // Otomatik eşleşmeyi reddet
  const handleRejectMatch = async (txnId, patternId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/banks/${bankId}/statements/${statement.id}/transactions/${txnId}/reject-match`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error('Reddetme hatası');
      }
      
      // UI güncelle - işlemi sıfırla
      setTransactions(prev => prev.map(txn => {
        if (txn.id === txnId) {
          return {
            ...txn,
            type: '',
            categoryId: null,
            subCategoryId: null,
            customerId: null,
            currencyPair: null,
            autoMatched: false,
            matchedPatternId: null,
            confidence: null,
            suggestedMatch: null,
            status: 'pending',
            matchConfirmed: false
          };
        }
        return txn;
      }));
      
      console.log('✅ Pattern reddedildi');
    } catch (error) {
      console.error('Pattern reddetme hatası:', error);
      alert('Pattern reddedilemedi');
    }
  };
  
  // Öneriyi uygula (suggested match)
  const handleApplySuggestion = async (txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn?.suggestedMatch) return;
    
    const { learned, patternId, confidence } = txn.suggestedMatch;
    
    setTransactions(prev => prev.map(t => {
      if (t.id === txnId) {
        return {
          ...t,
          type: learned.type || '',
          categoryId: learned.categoryId,
          subCategoryId: learned.subCategoryId,
          customerId: learned.customerId,
          currencyPair: learned.currencyPair,
          autoMatched: true,
          matchedPatternId: patternId,
          confidence: confidence,
          suggestedMatch: null,
          status: calculateStatus({
            ...t,
            type: learned.type,
            customerId: learned.customerId,
            currencyPair: learned.currencyPair
          })
        };
      }
      return t;
    }));
    
    // Backend'e de kaydet
    if (statement?.id) {
      try {
        await handleTransactionUpdate(txnId, 'type', learned.type || '');
        if (learned.categoryId) {
          await handleTransactionUpdate(txnId, 'categoryId', learned.categoryId);
        }
        if (learned.subCategoryId) {
          await handleTransactionUpdate(txnId, 'subCategoryId', learned.subCategoryId);
        }
        if (learned.customerId) {
          await handleTransactionUpdate(txnId, 'customerId', learned.customerId);
        }
        if (learned.currencyPair) {
          await handleTransactionUpdate(txnId, 'currencyPair', learned.currencyPair);
        }
      } catch (error) {
        console.error('Öneri uygulama hatası:', error);
      }
    }
  };
  
  // Öneriyi kapat
  const handleCloseSuggestion = (txnId) => {
    setTransactions(prev => prev.map(t =>
      t.id === txnId ? { ...t, suggestedMatch: null } : t
    ));
  };
  
  // Pattern düzenleme modu
  const handleEditMatch = (txnId) => {
    setTransactions(prev => prev.map(t => 
      t.id === txnId ? { ...t, autoMatched: false, matchConfirmed: true } : t
    ));
  };
  
  // Excel export
  const handleExportExcel = () => {
    try {
      // Dynamic import xlsx
      import('xlsx').then((XLSX) => {
        // Prepare data for Excel
        const excelData = filteredTransactions.map(txn => {
          const typeLabel = TRANSACTION_TYPES.find(t => t.value === txn.type)?.label || '-';
          const category = categories.find(c => c.id === txn.categoryId);
          const subCategory = category?.subCategories?.find(s => s.id === txn.subCategoryId);
          const customer = customers.find(c => c.id === txn.customerId);
          
          return {
            'Tarih': txn.date,
            'Açıklama': txn.description,
            'Tür': typeLabel,
            'Kategori': category ? `${category.icon} ${category.name}` : '-',
            'Alt Kategori': subCategory?.name || '-',
            'Müşteri': customer?.companyName || customer?.name || '-',
            'Döviz Çifti': txn.currencyPair || '-',
            'Tutar': txn.amount,
            'Bakiye': txn.balance,
            'Durum': txn.status === 'completed' ? 'Tamamlandı' : 'Bekliyor',
            'Otomatik Eşleşti': txn.autoMatched ? 'Evet' : 'Hayır',
            'Güven Skoru': txn.confidence ? `%${Math.round(txn.confidence * 100)}` : '-'
          };
        });
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
          { wch: 12 }, // Tarih
          { wch: 40 }, // Açıklama
          { wch: 15 }, // Tür
          { wch: 20 }, // Kategori
          { wch: 20 }, // Alt Kategori
          { wch: 25 }, // Müşteri
          { wch: 15 }, // Döviz Çifti
          { wch: 15 }, // Tutar
          { wch: 15 }, // Bakiye
          { wch: 12 }, // Durum
          { wch: 12 }, // Otomatik Eşleşti
          { wch: 12 }  // Güven Skoru
        ];
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'İşlemler');
        
        // Add summary sheet
        const summaryData = [
          ['HESAP BİLGİLERİ'],
          [''],
          ['Banka', 'Wio Bank'],
          ['Hesap Sahibi', header.accountHolder || 'N/A'],
          ['Hesap No', header.accountNumber || 'N/A'],
          ['IBAN', header.iban || 'N/A'],
          ['Para Birimi', header.currency || 'AED'],
          [''],
          ['DÖNEM BİLGİLERİ'],
          [''],
          ['Başlangıç', header.periodStart || 'N/A'],
          ['Bitiş', header.periodEnd || 'N/A'],
          [''],
          ['BAKİYE BİLGİLERİ'],
          [''],
          ['Açılış Bakiyesi', statement?.openingBalance || 0],
          ['Toplam Giren', stats.totalIncoming],
          ['Toplam Çıkan', stats.totalOutgoing],
          ['Kapanış Bakiyesi', stats.closingBalance],
          [''],
          ['İŞLEM İSTATİSTİKLERİ'],
          [''],
          ['Toplam İşlem', stats.transactionCount],
          ['Tamamlanan', stats.categorizedCount],
          ['Bekleyen', stats.pendingCount],
          ['Tamamlanma Oranı', `%${stats.completedPercent}`],
          ['Otomatik Eşleşen', stats.autoMatchedCount],
          ['Önerilen', stats.suggestedCount]
        ];
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');
        
        // Generate filename
        const filename = `Wio_Bank_Ekstre_${header.periodStart || 'tarihsiz'}_${header.currency || 'AED'}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, filename);
        
        console.log(`✅ Excel exported: ${filename}`);
      });
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Excel dışa aktarma hatası: ' + error.message);
    }
  };
  
  // İstatistikler
  const stats = useMemo(() => {
    const incoming = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const outgoing = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const autoMatched = transactions.filter(t => t.autoMatched && !t.matchConfirmed).length;
    const suggested = transactions.filter(t => t.suggestedMatch).length;
    
    // Closing Balance = Opening + Incoming - Outgoing
    const openingBalance = statement?.openingBalance || 0;
    const calculatedClosing = openingBalance + incoming - outgoing;
    const closingBalance = statement?.closingBalance || calculatedClosing;
    
    return {
      totalIncoming: incoming,
      totalOutgoing: outgoing,
      closingBalance: closingBalance,
      transactionCount: transactions.length,
      categorizedCount: completed,
      pendingCount: pending,
      completedPercent: transactions.length > 0 ? Math.round((completed / transactions.length) * 100) : 0,
      autoMatchedCount: autoMatched,
      suggestedCount: suggested
    };
  }, [transactions, statement]);
  
  // Filtered transactions
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
  
  // Shared header data
  const header = statement || {};
  
  return (
    <div className="p-6 space-y-6">
      {/* Header - Always Visible */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏦 Wio Bank - Hesap Ekstresi
          </h2>
          
          {/* Save Status Indicator */}
          {statement && (
            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span>✅</span> Kaydedildi
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <span className="animate-spin">🔄</span> Kaydediliyor...
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-sm text-yellow-600 flex items-center gap-1">
                  <span>⚠️</span> Kaydedilmemiş değişiklikler
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Currency Tabs - Always Visible */}
        <div className="flex items-center gap-2">
          {availableCurrencies.map(currency => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCurrency === currency
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {currency === 'AED' && '🇦🇪'} 
              {currency === 'USD' && '🇺🇸'} 
              {currency === 'EUR' && '🇪🇺'} 
              {currency === 'GBP' && '🇬🇧'} 
              {' '}{currency}
            </button>
          ))}
        </div>
      </div>
      
      {/* Conditional Content: Upload Area OR Statement Details */}
      {!statement ? (
        <>
          {/* Upload Area for selected currency */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all
              ${
                isDragActive
                  ? 'border-green-500 bg-green-50'
                  : uploading
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="text-6xl animate-bounce">⏳</div>
                <p className="text-lg font-medium text-gray-700">PDF işleniyor...</p>
                <p className="text-sm text-gray-500">Ekstre parse ediliyor, lütfen bekleyin</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-7xl">📄</div>
                <p className="text-2xl font-medium text-gray-700">
                  {isDragActive ? 'Dosyayı bırakın...' : `${selectedCurrency} PDF Ekstresi Yükle`}
                </p>
                <p className="text-gray-500">
                  Sürükle & Bırak veya tıklayın
                </p>
                <p className="text-sm text-gray-400">
                  Desteklenen format: PDF (Wio Bank)
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">⚠️ Hata</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Statement Details - When statement exists */}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleNewUpload}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
        >
          <Upload className="h-4 w-4" />
          Yeni Ekstre Yükle
        </button>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Excel İndir
        </button>
        <button
          onClick={handleSave}
          disabled={saving || stats.pendingCount > 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
        >
          {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet ve Öğren'}
        </button>
      </div>
      
      {/* Hesap Bilgileri Kartı */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-purple-800 mb-4">HESAP BİLGİLERİ</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dönem */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-2">📅 DÖNEM</div>
            <div className="font-semibold text-gray-800">{header.periodStart || 'N/A'}</div>
            <div className="text-gray-400 my-1">─</div>
            <div className="font-semibold text-gray-800">{header.periodEnd || 'N/A'}</div>
          </div>
          
          {/* Hesap Sahibi */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-2">🏢 HESAP SAHİBİ</div>
            <div className="font-semibold text-gray-800 text-sm leading-relaxed">
              {header.accountHolder || 'N/A'}
            </div>
          </div>
          
          {/* Para Birimi / Faiz */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-2">💰 PARA BİRİMİ / FAİZ</div>
            <div className="font-semibold text-gray-800">{header.currency || 'AED'}</div>
            <div className="text-sm text-gray-500 mt-1">Faiz: {header.interestRate || '0%'}</div>
          </div>
          
          {/* Hesap Türü */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-2">📂 HESAP TÜRÜ</div>
            <div className="font-semibold text-gray-800 text-sm">{header.accountType || 'N/A'}</div>
            <div className="text-sm text-gray-500 mt-1">Açılış: {header.accountOpened || 'N/A'}</div>
          </div>
          
          {/* Hesap No */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-2">🔢 HESAP NO</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{header.accountNumber || 'N/A'}</span>
              {header.accountNumber && (
                <button
                  onClick={() => copyToClipboard(header.accountNumber, 'accountNumber')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Kopyala"
                >
                  {copySuccess === 'accountNumber' ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* IBAN */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="text-xs text-gray-500 mb-2">🆔 IBAN</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-xs">{header.iban || 'N/A'}</span>
              {header.iban && (
                <button
                  onClick={() => copyToClipboard(header.iban, 'iban')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Kopyala"
                >
                  {copySuccess === 'iban' ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {/* Açılış Bakiyesi */}
        {statement.openingBalance !== undefined && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-600 mb-1 font-medium">💰 AÇILIŞ</div>
            <div className="text-base font-bold text-slate-700">{formatMoney(statement.openingBalance)}</div>
            <div className="text-xs text-slate-500">{statement.currency || 'AED'}</div>
          </div>
        )}
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <div className="text-xs text-green-600 mb-1 font-medium">💵 GİREN</div>
          <div className="text-base font-bold text-green-700">
            {formatMoney(stats.totalIncoming, header.currency)}
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <div className="text-xs text-red-600 mb-1 font-medium">💸 ÇIKAN</div>
          <div className="text-base font-bold text-red-700">
            {formatMoney(stats.totalOutgoing, header.currency)}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <div className="text-xs text-blue-600 mb-1 font-medium">💰 KAPANIŞ</div>
          <div className="text-base font-bold text-blue-700">
            {formatMoney(stats.closingBalance)}
          </div>
          <div className="text-xs text-blue-600">{statement.currency || 'AED'}</div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-600 mb-1 font-medium">🔄 İŞLEM</div>
          <div className="text-base font-bold text-gray-700">{stats.transactionCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">adet</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <div className="text-xs text-green-600 mb-1 font-medium">✅ TAMAM</div>
          <div className="text-base font-bold text-green-700">{stats.categorizedCount}</div>
          <div className="text-xs text-green-600">%{stats.completedPercent}</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <div className="text-xs text-yellow-600 mb-1 font-medium">⏳ BEKLE</div>
          <div className="text-base font-bold text-yellow-700">{stats.pendingCount}</div>
          <div className="text-xs text-yellow-600">%{100 - stats.completedPercent}</div>
        </div>
      </div>
      
      {/* Akıllı Eşleştirme Özeti */}
      {(stats.autoMatchedCount > 0 || stats.suggestedCount > 0) && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-800">Akıllı Eşleştirme</h3>
              <p className="text-sm text-purple-600 mt-0.5">
                {stats.autoMatchedCount > 0 && (
                  <span className="mr-3">
                    ✨ {stats.autoMatchedCount} işlem otomatik eşleştirildi
                  </span>
                )}
                {stats.suggestedCount > 0 && (
                  <span>💡 {stats.suggestedCount} öneri mevcut</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtreleme ve Arama Barı */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Açıklamada ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tür: Tümü</option>
            {TRANSACTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Durum: Tümü</option>
            <option value="pending">⏳ Bekliyor</option>
            <option value="completed">✅ Tamamlandı</option>
          </select>
          
          {/* Clear Filters */}
          {(searchQuery || typeFilter || statusFilter || quickFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('');
                setStatusFilter('');
                setQuickFilter('');
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              ✕ Temizle
            </button>
          )}
        </div>
        
        {/* Quick Filters */}
        {groupedDescriptions.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-2 font-medium">Hızlı Filtreler:</div>
            <div className="flex flex-wrap gap-2">
              {groupedDescriptions.map(([normalized, data]) => (
                <button
                  key={normalized}
                  onClick={() => setQuickFilter(quickFilter === normalized ? '' : normalized)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    quickFilter === normalized
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {normalized.slice(0, 30)}{normalized.length > 30 ? '...' : ''} ({data.count})
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Filter Results */}
        {filteredTransactions.length !== transactions.length && (
          <div className="mt-3 text-sm text-gray-600">
            {filteredTransactions.length} / {transactions.length} işlem gösteriliyor
          </div>
        )}
      </div>
      
      {/* İşlemler Tablosu */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            İşlemler ({filteredTransactions.length})
          </h3>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
              className="rounded"
            />
            Sadece Bekleyenler
          </label>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(filteredTransactions.map(t => t.id));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase w-40">Tür</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase w-40">Kategori</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase w-40">Alt Kategori</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase w-16">Durum</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase w-16">🔄</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => {
                const typeConfig = TRANSACTION_TYPES.find(t => t.value === txn.type);
                const showCustomerField = txn.type === 'collection';
                const showCurrencyField = ['fx_buy', 'fx_sell'].includes(txn.type);
                const showCategoryFields = typeRequiresCategory(txn.type);
                
                return (
                  <React.Fragment key={txn.id}>
                    <tr className={`hover:bg-gray-50 ${txn.status === 'pending' ? 'bg-yellow-50/30' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(txn.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(prev => [...prev, txn.id]);
                            } else {
                              setSelectedRows(prev => prev.filter(id => id !== txn.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      
                      {/* Tarih */}
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {txn.date}
                      </td>
                      
                      {/* Açıklama */}
                      <td className="px-3 py-3 text-sm text-gray-800 max-w-xs">
                        <div className="truncate" title={txn.description}>
                          {txn.description}
                        </div>
                        {txn.autoMatched && txn.confidence > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            🤖 %{Math.round(txn.confidence * 100)} güven
                          </div>
                        )}
                      </td>
                      
                      {/* Tür */}
                      <td className="px-3 py-3">
                        <div className="relative flex items-center gap-1">
                          <select
                            value={txn.type || ''}
                            onChange={(e) => handleTransactionUpdate(txn.id, 'type', e.target.value)}
                            className={`w-full px-2 py-1.5 pr-8 border rounded-lg text-sm font-medium ${getTypeColor(txn.type)}`}
                          >
                            {TRANSACTION_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          {txn.type && (
                            <button
                              onClick={() => handleTransactionUpdate(txn.id, 'type', '')}
                              className="absolute right-2 text-gray-400 hover:text-red-500 text-sm font-bold"
                              title="Tür seçimini kaldır"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Kategori */}
                      <td className="px-3 py-3">
                        <div className="relative flex items-center gap-1">
                          <select
                            value={txn.categoryId || ''}
                            onChange={(e) => handleTransactionUpdate(txn.id, 'categoryId', e.target.value || null)}
                            disabled={!showCategoryFields}
                            className={`w-full px-2 py-1.5 pr-8 border rounded-lg text-sm ${
                              !showCategoryFields ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300'
                            }`}
                          >
                            <option value="">─</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                          </select>
                          {txn.categoryId && showCategoryFields && (
                            <button
                              onClick={() => handleTransactionUpdate(txn.id, 'categoryId', null)}
                              className="absolute right-2 text-gray-400 hover:text-red-500 text-sm font-bold"
                              title="Kategori seçimini kaldır"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Alt Kategori */}
                      <td className="px-3 py-3">
                        <div className="relative flex items-center gap-1">
                          <select
                            value={txn.subCategoryId || ''}
                            onChange={(e) => handleTransactionUpdate(txn.id, 'subCategoryId', e.target.value || null)}
                            disabled={!showCategoryFields || !txn.categoryId}
                            className={`w-full px-2 py-1.5 pr-8 border rounded-lg text-sm ${
                              !showCategoryFields || !txn.categoryId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300'
                            }`}
                          >
                            <option value="">─</option>
                            {getSubCategories(txn.categoryId).map(sub => (
                              <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                          {txn.subCategoryId && showCategoryFields && txn.categoryId && (
                            <button
                              onClick={() => handleTransactionUpdate(txn.id, 'subCategoryId', null)}
                              className="absolute right-2 text-gray-400 hover:text-red-500 text-sm font-bold"
                              title="Alt kategori seçimini kaldır"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Tutar */}
                      <td className={`px-3 py-3 text-sm font-medium text-right whitespace-nowrap ${
                        txn.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.amount >= 0 ? '+' : ''}{formatMoney(txn.amount, header.currency)}
                      </td>
                      
                      {/* Bakiye */}
                      <td className="px-3 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                        {formatMoney(txn.balance, header.currency)}
                      </td>
                      
                      {/* Durum */}
                      <td className="px-3 py-3 text-center">
                        {txn.autoMatched && !txn.matchConfirmed ? (
                          <span className="text-purple-600 text-xl" title="Otomatik eşleştirildi">🤖</span>
                        ) : txn.status === 'completed' ? (
                          <span className="text-green-600 text-xl">✅</span>
                        ) : (
                          <span className="text-yellow-600 text-xl">⏳</span>
                        )}
                      </td>
                      
                      {/* Aksiyon */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => resetTransaction(txn.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="İşlemi Sıfırla"
                        >
                          🔄
                        </button>
                      </td>
                    </tr>
                    
                    {/* Otomatik Eşleştirme Badge */}
                    {txn.autoMatched && !txn.matchConfirmed && (
                      <tr className="bg-green-50/50">
                        <td></td>
                        <td></td>
                        <td colSpan={8} className="px-3 py-2">
                          <AutoMatchBadge
                            pattern={txn.matchedPatternId ? 'Öğrenilmiş pattern' : ''}
                            confidence={txn.confidence || 0}
                            matchCount={0}
                            confirmCount={0}
                            isAutoMatched={true}
                            onConfirm={() => handleConfirmMatch(txn.id, txn.matchedPatternId)}
                            onReject={() => handleRejectMatch(txn.id, txn.matchedPatternId)}
                            onEdit={() => handleEditMatch(txn.id)}
                          />
                        </td>
                      </tr>
                    )}
                    
                    {/* Öneri Badge */}
                    {txn.suggestedMatch && !txn.autoMatched && (
                      <tr className="bg-yellow-50/50">
                        <td></td>
                        <td></td>
                        <td colSpan={8} className="px-3 py-2">
                          <AutoMatchBadge
                            pattern={txn.suggestedMatch.pattern}
                            confidence={txn.suggestedMatch.confidence || 0}
                            matchCount={txn.suggestedMatch.matchCount || 0}
                            confirmCount={txn.suggestedMatch.confirmCount || 0}
                            isAutoMatched={false}
                            onConfirm={() => handleApplySuggestion(txn.id)}
                            onReject={() => handleCloseSuggestion(txn.id)}
                            onEdit={() => handleCloseSuggestion(txn.id)}
                          />
                        </td>
                      </tr>
                    )}
                    
                    {/* Koşullu Satır - Müşteri */}
                    {showCustomerField && (
                      <tr className="bg-green-50/30 border-t">
                        <td></td>
                        <td></td>
                        <td colSpan={8} className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 font-medium whitespace-nowrap">🏢 Müşteri:</label>
                            <div className="relative flex-1">
                              <select
                                value={txn.customerId || ''}
                                onChange={(e) => handleTransactionUpdate(txn.id, 'customerId', e.target.value || null)}
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">Müşteri seçin...</option>
                                {customers.map(customer => (
                                  <option key={customer.id} value={customer.id}>
                                    {customer.companyName || customer.name || 'İsimsiz Müşteri'}
                                  </option>
                                ))}
                              </select>
                              {txn.customerId && (
                                <button
                                  onClick={() => handleTransactionUpdate(txn.id, 'customerId', null)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-sm font-bold"
                                  title="Müşteri seçimini kaldır"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setPendingCustomerTxnId(txn.id);
                                setShowCustomerModal(true);
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                            >
                              <Plus className="h-4 w-4" />
                              Yeni
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Koşullu Satır - Döviz Çifti */}
                    {showCurrencyField && (
                      <tr className="bg-blue-50/30 border-t">
                        <td></td>
                        <td></td>
                        <td colSpan={8} className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 font-medium whitespace-nowrap">💱 Döviz Çifti:</label>
                            <div className="relative flex-1">
                              <select
                                value={txn.currencyPair || suggestCurrencyPair(txn.description) || ''}
                                onChange={(e) => handleTransactionUpdate(txn.id, 'currencyPair', e.target.value || null)}
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">Seçiniz...</option>
                                {CURRENCY_PAIRS.map(pair => (
                                  <option key={pair.value} value={pair.value}>
                                    {pair.label} {suggestCurrencyPair(txn.description) === pair.value ? '(önerilen)' : ''}
                                  </option>
                                ))}
                              </select>
                              {txn.currencyPair && (
                                <button
                                  onClick={() => handleTransactionUpdate(txn.id, 'currencyPair', null)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-sm font-bold"
                                  title="Döviz çifti seçimini kaldır"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        {selectedRows.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Seçili: {selectedRows.length} satır
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                📁 Toplu Tür Ata
              </button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                📂 Toplu Kategori Ata
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bilgi Notu */}
      {stats.pendingCount > 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm text-yellow-700 font-medium mb-1">
              {stats.pendingCount} işlem bekliyor
            </p>
            <p className="text-sm text-yellow-600">
              Tüm işlemleri kategorize etmelisiniz. Kaydet butonu aktif olacak.
            </p>
          </div>
        </div>
      ) : stats.transactionCount > 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="text-sm text-green-700 font-medium mb-1">
              Tüm işlemler tamamlandı!
            </p>
            <p className="text-sm text-green-600">
              Şimdi kaydet butonuna tıklayarak sisteme öğretebilirsiniz.
            </p>
          </div>
        </div>
      ) : null}
        </>
      )}
      
      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={showBulkModal}
        onClose={handleCloseBulkModal}
        bulkAction={bulkAction}
        onApply={handleBulkApply}
        onApplyAndLearn={handleBulkApplyAndLearn}
      />
      
      {/* Auto-Match Notification Modal */}
      <AutoMatchNotificationModal
        isOpen={showAutoMatchModal}
        onClose={() => setShowAutoMatchModal(false)}
        autoMatchedCount={autoMatchData?.autoMatchedCount || 0}
        suggestedCount={autoMatchData?.suggestedCount || 0}
        transactions={autoMatchData?.transactions || []}
      />
      
      {/* Yeni Müşteri Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Yeni Müşteri Ekle
              </h2>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setPendingCustomerTxnId(null);
                  setCustomerErrors({});
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {customerErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  ⚠️ {customerErrors.general}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri / Şirket Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    customerErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ABC Trading LLC"
                />
                {customerErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{customerErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="info@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="+971 50 123 4567"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                  <select
                    value={newCustomerData.country}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="UAE">🇦🇪 BAE</option>
                    <option value="Turkey">🇹🇷 Türkiye</option>
                    <option value="USA">🇺🇸 ABD</option>
                    <option value="UK">🇬🇧 İngiltere</option>
                    <option value="Germany">🇩🇪 Almanya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={newCustomerData.city}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Dubai"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={2}
                  placeholder="Adres detayları..."
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setPendingCustomerTxnId(null);
                  setCustomerErrors({});
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={savingCustomer}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {savingCustomer ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankStatementAnalyzer;