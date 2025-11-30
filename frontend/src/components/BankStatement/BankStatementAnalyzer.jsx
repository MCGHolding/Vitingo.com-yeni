import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Download, Save, Check, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Transaction Types
const TRANSACTION_TYPES = [
  { value: '', label: 'Seçiniz', color: 'gray' },
  { value: 'collection', label: 'Tahsilat', color: 'green', hasCustomer: true },
  { value: 'payment', label: 'Ödeme', color: 'red' },
  { value: 'refund', label: 'İade', color: 'orange' },
  { value: 'cashback', label: 'Cashback', color: 'purple' },
  { value: 'fx_buy', label: 'Döviz Alım', color: 'blue', hasCurrencyPair: true },
  { value: 'fx_sell', label: 'Döviz Satım', color: 'blue', hasCurrencyPair: true },
  { value: 'cash_deposit', label: 'Nakit Yatan', color: 'teal' }
];

const CURRENCY_PAIRS = [
  'USD-AED', 'USD-EUR', 'AED-USD', 'AED-EUR', 'EUR-AED', 'EUR-USD'
];

const BankStatementAnalyzer = ({ bankId }) => {
  // State
  const [statement, setStatement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    showPendingOnly: false
  });
  
  const [selectedRows, setSelectedRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Load categories and customers
  useEffect(() => {
    loadCategories();
    loadCustomers();
  }, []);
  
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
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/api/banks/${bankId}/statements/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      setStatement({
        id: data.statementId,
        ...data.headerInfo,
        ...data.statistics
      });
      setTransactions(data.transactions);
      
      alert(`✅ ${data.autoMatchedCount} işlem otomatik eşleştirildi!`);
    } catch (error) {
      alert('Yükleme hatası: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  // Update transaction
  const handleTransactionUpdate = async (txnId, field, value) => {
    setTransactions(prev => prev.map(txn => {
      if (txn.id === txnId) {
        const updated = { ...txn, [field]: value };
        
        // Clear dependent fields
        if (field === 'type') {
          if (value !== 'collection') updated.customerId = null;
          if (value !== 'fx_buy' && value !== 'fx_sell') updated.currencyPair = null;
        }
        
        if (field === 'categoryId') {
          updated.subCategoryId = null;
        }
        
        // Check completion
        updated.status = checkTransactionComplete(updated) ? 'completed' : 'pending';
        
        return updated;
      }
      return txn;
    }));
    
    // Update backend
    try {
      await fetch(`${API_URL}/api/banks/${bankId}/statements/${statement.id}/transactions/${txnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };
  
  const checkTransactionComplete = (txn) => {
    if (!txn.type) return false;
    if (txn.type === 'collection' && !txn.customerId) return false;
    if ((txn.type === 'fx_buy' || txn.type === 'fx_sell') && !txn.currencyPair) return false;
    return true;
  };
  
  // Save statement
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/banks/${bankId}/statements/${statement.id}/complete`, {
        method: 'POST'
      });
      
      const data = await response.json();
      alert(`✅ Kaydedildi! ${data.learnedPatterns} yeni pattern öğrenildi.`);
      
      setStatement(prev => ({ ...prev, status: 'completed' }));
    } catch (error) {
      alert('Kaydetme hatası: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Statistics
  const stats = useMemo(() => {
    const incoming = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const outgoing = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    
    return {
      incoming,
      outgoing,
      net: incoming - outgoing,
      total: transactions.length,
      completed,
      pending,
      completedPercent: transactions.length > 0 ? Math.round((completed / transactions.length) * 100) : 0
    };
  }, [transactions]);
  
  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (filters.search && !txn.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type && txn.type !== filters.type) return false;
      if (filters.category && txn.categoryId !== filters.category) return false;
      if (filters.showPendingOnly && txn.status !== 'pending') return false;
      return true;
    });
  }, [transactions, filters]);
  
  // UI Components
  const UploadArea = () => (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Banka Ekstresi Yükle</h3>
      <p className="text-gray-500 mb-4">Wio Bank PDF ekstrenizi yükleyin</p>
      <label className="cursor-pointer">
        <span className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block">
          {uploading ? '⏳ Yükleniyor...' : '📤 Dosya Seç'}
        </span>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  );
  
  const HeaderInfoCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">📅 DÖNEM</div>
        <div className="font-medium">{statement.periodStart}</div>
        <div className="font-medium">{statement.periodEnd}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">🏢 HESAP SAHİBİ</div>
        <div className="font-medium text-sm">{statement.accountHolder}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">💰 PARA BİRİMİ</div>
        <div className="font-medium">{statement.currency}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">📊 FAİZ ORANI</div>
        <div className="font-medium">{statement.interestRate}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">📂 HESAP TÜRÜ</div>
        <div className="font-medium text-sm">{statement.accountType}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">🔢 HESAP NO</div>
        <div className="font-medium">{statement.accountNumber}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">🆔 IBAN</div>
        <div className="font-medium text-xs">{statement.iban}</div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-1">📆 AÇILIŞ</div>
        <div className="font-medium">{statement.accountOpened}</div>
      </div>
    </div>
  );
  
  const StatisticsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">💵 GİREN</span>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-600">
          {stats.incoming.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">{statement.currency}</div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">💸 ÇIKAN</span>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </div>
        <div className="text-2xl font-bold text-red-600">
          {stats.outgoing.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">{statement.currency}</div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">📊 NET</span>
          <Activity className="h-4 w-4 text-blue-600" />
        </div>
        <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">{statement.currency}</div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="text-sm text-gray-500 mb-2">🔄 İŞLEM</div>
        <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
        <div className="text-xs text-gray-500">adet</div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">✅ TAMAM</span>
          <Check className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-xs text-gray-500">{stats.completedPercent}%</div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">⏳ BEKLE</span>
          <Clock className="h-4 w-4 text-yellow-600" />
        </div>
        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        <div className="text-xs text-gray-500">{100 - stats.completedPercent}%</div>
      </div>
    </div>
  );
  
  if (!statement) {
    return <UploadArea />;
  }
  
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <label className="cursor-pointer">
          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            Yeni Ekstre Yükle
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
        
        <button
          onClick={handleSave}
          disabled={saving || stats.pending > 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet ve Öğren'}
        </button>
        
        {stats.pending > 0 && (
          <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm inline-flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {stats.pending} işlem bekliyor
          </span>
        )}
      </div>
      
      {/* Header Info */}
      <HeaderInfoCards />
      
      {/* Statistics */}
      <StatisticsCards />
      
      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="🔍 Açıklamada ara..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          />
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Tüm Türler</option>
            {TRANSACTION_TYPES.filter(t => t.value).map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showPendingOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, showPendingOnly: e.target.checked }))}
            />
            <span>⏳ Sadece Bekleyenler</span>
          </label>
        </div>
      </div>
      
      {/* Transactions Table - Will be implemented in next part */}
      <div className="bg-white rounded-lg border p-4">
        <p className="text-gray-500 text-center py-8">
          İşlem tablosu yakında eklenecek... ({filteredTransactions.length} işlem)
        </p>
      </div>
    </div>
  );
};

export default BankStatementAnalyzer;
