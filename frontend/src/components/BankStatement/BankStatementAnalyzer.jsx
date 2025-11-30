import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Copy } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BankStatementAnalyzer = ({ bankId }) => {
  const [statement, setStatement] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  
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
      setStatement(data);
      
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
    setError(null);
  };
  
  // Kopyalama
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(fieldName);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };
  
  // Excel export
  const handleExportExcel = () => {
    // TODO: Excel export implementation
    alert('Excel export yakında eklenecek');
  };
  
  // Ekstre yüklenmemişse - Upload Area göster
  if (!statement) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🏦 Wio Bank - Hesap Ekstresi
        </h2>
        
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
                {isDragActive ? 'Dosyayı bırakın...' : 'PDF Ekstre Yükle'}
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
      </div>
    );
  }
  
  // Ekstre yüklendiyse - Detayları göster
  const { headerInfo, statistics, transactions } = statement;
  const header = headerInfo || {};
  const stats = statistics || {};
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🏦 Wio Bank - Hesap Ekstresi
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleNewUpload}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            Yeni Ekstre Yükle
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Excel İndir
          </button>
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Giren */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-xs text-green-700 mb-1 font-medium">💵 GİREN</div>
          <div className="text-lg font-bold text-green-700">
            {formatMoney(stats.totalIncoming || 0, header.currency)}
          </div>
        </div>
        
        {/* Çıkan */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs text-red-700 mb-1 font-medium">💸 ÇIKAN</div>
          <div className="text-lg font-bold text-red-700">
            {formatMoney(stats.totalOutgoing || 0, header.currency)}
          </div>
        </div>
        
        {/* Net */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs text-blue-700 mb-1 font-medium">📊 NET</div>
          <div className={`text-lg font-bold ${
            (stats.netChange || 0) >= 0 ? 'text-blue-700' : 'text-red-700'
          }`}>
            {(stats.netChange || 0) >= 0 ? '+' : ''}{formatMoney(stats.netChange || 0, header.currency)}
          </div>
        </div>
        
        {/* Toplam İşlem */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-700 mb-1 font-medium">🔄 İŞLEM</div>
          <div className="text-lg font-bold text-gray-700">
            {stats.transactionCount || 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">adet</div>
        </div>
        
        {/* Bekleyen */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-xs text-yellow-700 mb-1 font-medium">⏳ BEKLEYEN</div>
          <div className="text-lg font-bold text-yellow-700">
            {stats.pendingCount || 0}
          </div>
          <div className="text-xs text-yellow-600 mt-0.5">
            {stats.transactionCount > 0
              ? `${Math.round(((stats.pendingCount || 0) / stats.transactionCount) * 100)}%`
              : '0%'}
          </div>
        </div>
      </div>
      
      {/* İşlemler Tablosu (Sadece görüntüleme) */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-800">
            İşlemler ({transactions?.length || 0})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bakiye
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions && transactions.length > 0 ? (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {txn.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {txn.description}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium text-right whitespace-nowrap ${
                      txn.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.amount >= 0 ? '+' : ''}{formatMoney(txn.amount, header.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                      {formatMoney(txn.balance, header.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    İşlem bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Bilgi Notu */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-2xl">ℹ️</span>
        <div className="flex-1">
          <p className="text-sm text-blue-700 font-medium mb-1">
            Ekstre başarıyla yüklendi!
          </p>
          <p className="text-sm text-blue-600">
            Sonraki adımda her işlem için Tür, Kategori ve Alt Kategori seçebileceksiniz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankStatementAnalyzer;