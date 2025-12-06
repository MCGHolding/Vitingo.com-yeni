import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Edit, Trash2, Search, Globe, Share2, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import BankEmailModal from './BankEmailModal';
import BankStatementAnalyzer from '../BankStatement/BankStatementAnalyzer';

const AllBanksPage = ({ onBackToDashboard, onNewBank, onEditBank }) => {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [groupCompanies, setGroupCompanies] = useState([]);
  
  // Tab state
  const [activeMainTab, setActiveMainTab] = useState('banks'); // 'banks' | 'accounts' | 'statements'
  
  // Bankalar (sadece ad + ülke) - master data
  const [bankList, setBankList] = useState([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ name: '', country: 'TR' });
  const [editingBank, setEditingBank] = useState(null);
  
  // Banka Hesapları
  const [selectedBankId, setSelectedBankId] = useState('');
  
  // Yeni Hesap Ekleme
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [newAccount, setNewAccount] = useState({
    currency: 'TRY',
    iban: '',
    swift: '',
    accountNo: '',
    branchName: '',
    companyId: '',
    companyName: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Para birimleri ve ülke IBAN formatları
  const currencies = [
    { code: 'TRY', name: 'Türk Lirası', flag: '🇹🇷', country: 'TR', ibanLength: 26 },
    { code: 'USD', name: 'Amerikan Doları', flag: '🇺🇸', country: 'US', ibanLength: 0 },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺', country: 'DE', ibanLength: 22 },
    { code: 'GBP', name: 'İngiliz Sterlini', flag: '🇬🇧', country: 'GB', ibanLength: 22 },
    { code: 'AED', name: 'BAE Dirhemi', flag: '🇦🇪', country: 'AE', ibanLength: 23 },
    { code: 'SAR', name: 'Suudi Riyali', flag: '🇸🇦', country: 'SA', ibanLength: 24 },
    { code: 'CHF', name: 'İsviçre Frangı', flag: '🇨🇭', country: 'CH', ibanLength: 21 },
  ];
  
  // Türk bankaları SWIFT kodları
  const turkishBankSwiftCodes = {
    '0001': 'TCZBTR2A', '0004': 'TRHBTR2A', '0010': 'TELOTR2A', '0012': 'TVBATR2A',
    '0015': 'VAKFTRIS', '0017': 'KLNPTRIS', '0032': 'BTVOTR2A', '0046': 'AKBKTRIS',
    '0059': 'SEBATRIS', '0062': 'GARBTRIS', '0064': 'ISABTR2A', '0067': 'YAABORIS',
    '0091': 'AABORIS', '0092': 'CIABORIS', '0096': 'TGBATRIS', '0099': 'INGBTRIS',
    '0100': 'ADYBTRIS', '0103': 'FABORIS', '0108': 'TRLBTRIS', '0109': 'ICBKTRIS',
    '0111': 'FINBTRIS', '0115': 'DNZBTRIS', '0121': 'OABORIS', '0123': 'TSFBTRIS',
    '0124': 'ABORTR2A', '0125': 'BABORTR2A', '0134': 'DENITRIS', '0135': 'AFKBTRIS',
    '0137': 'FABORIS', '0142': 'ICBKTRIS', '0143': 'AKTFTRIS', '0146': 'EABORIS',
    '0148': 'KLABORIS', '0203': 'ALBTTR2A', '0205': 'KTEFTRIS', '0206': 'TGBATRIS',
    '0210': 'ZABORIS', '0215': 'VKFTTR2A',
  };
  
  // Statements state
  const [selectedBankForStatement, setSelectedBankForStatement] = useState(null);
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  
  // Statement upload modal
  const [showStatementUploadModal, setShowStatementUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [statementMeta, setStatementMeta] = useState({
    startDate: '',
    endDate: '',
    openingBalance: '',
    closingBalance: '',
    currency: 'TRY',
  });
  
  // Transaction types & categories
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [updatedTransactions, setUpdatedTransactions] = useState({});
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState('single'); // 'single' or 'country'
  const [bankToShare, setBankToShare] = useState(null);
  const [selectedShareCountry, setSelectedShareCountry] = useState('');
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBanks, setEmailBanks] = useState([]);
  const [emailMode, setEmailMode] = useState('single'); // 'single' or 'country'
  
  // Countries list
  const countries = [
    { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
    { code: 'US', name: 'Amerika', flag: '🇺🇸' },
    { code: 'GB', name: 'İngiltere', flag: '🇬🇧' },
    { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
    { code: 'AE', name: 'BAE', flag: '🇦🇪' },
    { code: 'SA', name: 'Suudi Arabistan', flag: '🇸🇦' },
    { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
    { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
    { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
    { code: 'NL', name: 'Hollanda', flag: '🇳🇱' },
    { code: 'CH', name: 'İsviçre', flag: '🇨🇭' }
  ];

  // Load group companies
  const loadGroupCompanies = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/group-companies`);
      
      if (response.ok) {
        const companies = await response.json();
        setGroupCompanies(Array.isArray(companies) ? companies : []);
      }
    } catch (error) {
      console.error('Error loading group companies:', error);
    }
  };

  // Load banks from backend
  const loadBanks = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/banks`);
      
      if (response.ok) {
        const banksData = await response.json();
        console.log('Loaded banks:', banksData);
        setBanks(banksData);
      } else {
        console.error('Failed to load banks:', response.statusText);
        setBanks([]);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      setBanks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load banks and companies on component mount
  useEffect(() => {
    loadGroupCompanies();
    loadBanks();
  }, []);

  // Mevcut bankalardan benzersiz banka isimlerini çıkar ve bankList'e aktar
  useEffect(() => {
    if (banks.length > 0 && bankList.length === 0) {
      const uniqueBanks = [];
      const seenNames = new Set();
      
      banks.forEach(account => {
        const name = account.bank_name;
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          uniqueBanks.push({
            id: `bank-${Date.now()}-${Math.random()}`,
            name: name,
            country: account.country || 'TR',
            created_at: account.created_at || new Date().toISOString()
          });
        }
      });
      
      if (uniqueBanks.length > 0) {
        setBankList(uniqueBanks);
      }
    }
  }, [banks, bankList.length]);

  // Grup şirketlerini yükle
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/group-companies`);
        if (response.ok) {
          const data = await response.json();
          setCompanies(Array.isArray(data) ? data : data.companies || []);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };
    loadCompanies();
  }, []);

  // İşlem türlerini yükle
  useEffect(() => {
    const loadTransactionTypes = async () => {
      try {
        const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/settings/transaction-types`);
        if (response.ok) {
          const types = await response.json();
          setTransactionTypes(types);
        }
      } catch (error) {
        console.error('Error loading transaction types:', error);
      }
    };
    loadTransactionTypes();
  }, []);

  // Filter banks based on search and company
  useEffect(() => {
    let filtered = [...banks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(bank => 
        bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bank.company_name && bank.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Company filter
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(bank => bank.company_id === selectedCompany);
    }

    setFilteredBanks(filtered);
  }, [banks, searchQuery, selectedCompany]);
  
  // Group banks by company
  const groupedBanks = filteredBanks.reduce((groups, bank) => {
    const companyKey = bank.company_id || 'ungrouped';
    if (!groups[companyKey]) {
      groups[companyKey] = [];
    }
    groups[companyKey].push(bank);
    return groups;
  }, {});

  const handleEdit = (bank) => {
    console.log('Edit bank:', bank);
    if (onEditBank) {
      onEditBank(bank);
    }
  };

  const handleDelete = (bank) => {
    setBankToDelete(bank);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!bankToDelete) return;

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/banks/${bankToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setBankToDelete(null);
        loadBanks(); // Reload banks
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Banka silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting bank:', error);
      alert(`Banka silinemedi: ${error.message}`);
    }
  };

  const handleShareSingle = (bank) => {
    setEmailBanks([bank]);
    setEmailMode('single');
    setShowEmailModal(true);
  };

  const handleShareByCountry = () => {
    setShareMode('country');
    setShowShareModal(true);
  };

  const handleCountryShareConfirm = () => {
    if (!selectedShareCountry) return;
    
    const countryBanks = filteredBanks.filter(bank => bank.country === selectedShareCountry);
    setEmailBanks(countryBanks);
    setEmailMode('country');
    setShowShareModal(false);
    setShowEmailModal(true);
    setSelectedShareCountry('');
  };
  
  // Ekstre fonksiyonları
  const handleStatementUpload = async (e, bankId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Sadece PDF dosyaları yükleyebilirsiniz');
      return;
    }
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${backendUrl}/api/banks/${bankId}/statements/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        
        const newStatement = {
          id: result.statementId || result.id,
          bankId: bankId,
          filename: result.fileName || file.name,
          period: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
          uploadDate: new Date().toLocaleDateString('tr-TR'),
          file: file,
          
          // Tarih bilgileri
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          
          // Bakiye bilgileri
          currency: result.currency,
          openingBalance: result.openingBalance,
          closingBalance: result.closingBalance,
          netChange: result.netChange,
          
          // Toplam bilgiler
          totalIncoming: result.totalIncoming,
          totalOutgoing: result.totalOutgoing,
          
          // İşlem istatistikleri
          transactionCount: result.transactionCount,
          categorizedCount: result.categorizedCount,
          pendingCount: result.pendingCount,
          
          // Detaylar
          transactions: result.transactions || [],
          statistics: {
            transactionCount: result.transactionCount,
            categorizedCount: result.categorizedCount,
            pendingCount: result.pendingCount
          }
        };
        
        setStatements(prev => [...prev, newStatement]);
        alert(`✅ Ekstre parse edildi!\n📊 ${result.transactionCount || 0} işlem bulundu\n✓ ${result.categorizedCount || 0} işlem otomatik eşleşti`);
      } else {
        const error = await response.json();
        alert('❌ Yükleme hatası: ' + (error.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Yükleme hatası: ' + error.message);
    }
  };

  const viewStatement = async (statement) => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/banks/${statement.bankId}/statements/${statement.id}`);
      
      if (response.ok) {
        const fullStatement = await response.json();
        setSelectedStatement(fullStatement);
        setUpdatedTransactions({});
        setShowTransactionsModal(true);
      } else {
        alert('Ekstre detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Error loading statement:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleTransactionUpdate = (txnId, field, value) => {
    setUpdatedTransactions(prev => ({
      ...prev,
      [txnId]: {
        ...prev[txnId],
        [field]: value
      }
    }));
  };

  const handleSaveTransactions = async () => {
    if (Object.keys(updatedTransactions).length === 0) {
      alert('Değişiklik yapılmadı');
      return;
    }

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/banks/${selectedStatement.bankId}/statements/${selectedStatement.id}/transactions/bulk`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionIds: Object.keys(updatedTransactions),
            updateData: updatedTransactions,
            shouldLearn: true
          })
        }
      );

      if (response.ok) {
        alert(`✅ ${Object.keys(updatedTransactions).length} işlem kaydedildi ve akıllı öğrenme aktif edildi!`);
        setUpdatedTransactions({});
        setShowTransactionsModal(false);
        setSelectedStatement(null);
      } else {
        alert('Kaydetme hatası');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Hata: ' + error.message);
    }
  };

  const downloadStatement = (statement) => {
    if (statement.file) {
      const url = URL.createObjectURL(statement.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = statement.filename;
      link.click();
    }
  };

  const deleteStatement = (statementId) => {
    if (window.confirm('Bu ekstreyi silmek istediğinize emin misiniz?')) {
      setStatements(prev => prev.filter(s => s.id !== statementId));
    }
  };

  // ==================== VALİDASYON FONKSİYONLARI ====================
  
  const validateIBAN = (iban, currency) => {
    if (!iban) return { valid: false, error: 'IBAN zorunludur' };
    
    const cleanIBAN = iban.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const currencyInfo = currencies.find(c => c.code === currency);
    const expectedCountry = currencyInfo?.country || 'TR';
    
    if (currency === 'TRY' && !cleanIBAN.startsWith('TR')) {
      return { valid: false, error: 'Türk Lirası hesabı için IBAN "TR" ile başlamalıdır' };
    }
    
    if (!/^[A-Z]{2}/.test(cleanIBAN)) {
      return { valid: false, error: 'IBAN ülke kodu ile başlamalıdır (örn: TR, DE, GB)' };
    }
    
    if (currency === 'TRY' && cleanIBAN.length !== 26) {
      return { valid: false, error: `Türk IBAN'ı 26 karakter olmalıdır (şu an: ${cleanIBAN.length})` };
    }
    
    if (!/^[A-Z0-9]+$/.test(cleanIBAN)) {
      return { valid: false, error: 'IBAN sadece harf ve rakam içermelidir' };
    }
    
    const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);
    const numericIBAN = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());
    
    let remainder = numericIBAN;
    while (remainder.length > 2) {
      const block = remainder.slice(0, 9);
      remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(9);
    }
    
    if (parseInt(remainder, 10) % 97 !== 1) {
      return { valid: false, error: 'Geçersiz IBAN kontrol numarası' };
    }
    
    return { valid: true, error: null };
  };

  const validateSWIFT = (swift) => {
    if (!swift) return { valid: false, error: 'SWIFT kodu zorunludur' };
    
    const cleanSwift = swift.replace(/\s/g, '').toUpperCase();
    
    if (cleanSwift.length !== 8 && cleanSwift.length !== 11) {
      return { valid: false, error: 'SWIFT kodu 8 veya 11 karakter olmalıdır' };
    }
    
    if (!/^[A-Z]{4}/.test(cleanSwift)) {
      return { valid: false, error: 'İlk 4 karakter banka kodu olmalıdır (sadece harf)' };
    }
    
    if (!/^[A-Z]{4}[A-Z]{2}/.test(cleanSwift)) {
      return { valid: false, error: '5-6. karakterler ülke kodu olmalıdır (sadece harf)' };
    }
    
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}/.test(cleanSwift)) {
      return { valid: false, error: '7-8. karakterler lokasyon kodu olmalıdır' };
    }
    
    if (cleanSwift.length === 11 && !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}[A-Z0-9]{3}$/.test(cleanSwift)) {
      return { valid: false, error: '9-11. karakterler şube kodu olmalıdır' };
    }
    
    return { valid: true, error: null };
  };

  const detectSwiftFromIBAN = (iban) => {
    if (!iban) return null;
    
    const cleanIBAN = iban.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    if (!cleanIBAN.startsWith('TR') || cleanIBAN.length < 10) return null;
    
    const bankCode = cleanIBAN.substring(4, 8);
    
    return turkishBankSwiftCodes[bankCode] || null;
  };

  const formatIBAN = (value) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  // ==================== HANDLER FONKSİYONLARI ====================
  
  const handleIBANChange = (e) => {
    const rawValue = e.target.value;
    const cleaned = rawValue.replace(/[^A-Z0-9\s]/gi, '');
    const formatted = formatIBAN(cleaned);
    
    if (formatted.replace(/\s/g, '').length > 34) return;
    
    setNewAccount(prev => ({ ...prev, iban: formatted }));
    
    const detectedSwift = detectSwiftFromIBAN(formatted);
    if (detectedSwift && !newAccount.swift) {
      setNewAccount(prev => ({ ...prev, swift: detectedSwift }));
    }
    
    if (touched.iban) {
      const validation = validateIBAN(formatted, newAccount.currency);
      setErrors(prev => ({ ...prev, iban: validation.error }));
    }
  };

  const handleSWIFTChange = (e) => {
    const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    if (value.length > 11) return;
    
    setNewAccount(prev => ({ ...prev, swift: value }));
    
    if (touched.swift) {
      const validation = validateSWIFT(value);
      setErrors(prev => ({ ...prev, swift: validation.error }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'iban') {
      const validation = validateIBAN(newAccount.iban, newAccount.currency);
      setErrors(prev => ({ ...prev, iban: validation.error }));
    }
    
    if (field === 'swift') {
      const validation = validateSWIFT(newAccount.swift);
      setErrors(prev => ({ ...prev, swift: validation.error }));
    }
    
    if (field === 'companyId' && !newAccount.companyId) {
      setErrors(prev => ({ ...prev, companyId: 'Firma seçimi zorunludur' }));
    }
    
    if (field === 'address' && !newAccount.address.trim()) {
      setErrors(prev => ({ ...prev, address: 'Adres zorunludur' }));
    }
  };

  const handleCurrencyChange = (currencyCode) => {
    setNewAccount(prev => ({ ...prev, currency: currencyCode }));
    
    if (newAccount.iban && touched.iban) {
      const validation = validateIBAN(newAccount.iban, currencyCode);
      setErrors(prev => ({ ...prev, iban: validation.error }));
    }
  };

  const closeModal = () => {
    setShowAddAccount(false);
    setEditingAccount(null);
    setNewAccount({
      currency: 'TRY',
      iban: '',
      swift: '',
      accountNo: '',
      branchName: '',
      companyId: '',
      companyName: '',
      address: '',
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmitAccount = async () => {
    setTouched({ iban: true, swift: true, companyId: true, address: true });
    
    const ibanValidation = validateIBAN(newAccount.iban, newAccount.currency);
    const swiftValidation = validateSWIFT(newAccount.swift);
    
    const newErrors = {
      iban: ibanValidation.error,
      swift: swiftValidation.error,
      companyId: !newAccount.companyId ? 'Firma seçimi zorunludur' : null,
      address: !newAccount.address.trim() ? 'Adres zorunludur' : null,
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(e => e)) {
      return;
    }
    
    const selectedBank = bankList.find(b => b.id === selectedBankId);
    const selectedCompany = companies.find(c => c.id === newAccount.companyId);
    const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
    
    const accountData = {
      bank_name: selectedBank?.name || '',
      country: selectedBank?.country || 'TR',
      currency: newAccount.currency,
      iban: newAccount.iban.replace(/\s/g, ''),
      swift_code: newAccount.swift,
      account_number: newAccount.accountNo || '',
      branch_name: newAccount.branchName,
      company_id: newAccount.companyId,
      company_name: selectedCompany?.name || newAccount.companyName,
      account_holder: selectedCompany?.name || newAccount.companyName,
      address: newAccount.address,
    };
    
    try {
      let response;
      
      if (editingAccount) {
        response = await fetch(`${backendUrl}/api/banks/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData)
        });
      } else {
        response = await fetch(`${backendUrl}/api/banks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData)
        });
      }
      
      if (response.ok) {
        const savedAccount = await response.json();
        
        if (editingAccount) {
          setBanks(prev => prev.map(b => b.id === editingAccount.id ? savedAccount : b));
        } else {
          setBanks(prev => [...prev, savedAccount]);
        }
        
        closeModal();
      } else {
        alert('İşlem başarısız');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleDeleteBank = async (bankId) => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const bankToDelete = bankList.find(b => b.id === bankId);
      
      if (bankToDelete) {
        // Bu bankaya ait tüm hesapları bul ve sil
        const accountsToDelete = banks.filter(account => 
          account.bank_name?.toLowerCase() === bankToDelete.name.toLowerCase()
        );
        
        // Her hesabı backend'den sil
        for (const account of accountsToDelete) {
          try {
            await fetch(`${backendUrl}/api/banks/${account.id}`, {
              method: 'DELETE',
            });
          } catch (err) {
            console.error('Error deleting account:', err);
          }
        }
        
        // Local state'den tüm hesapları sil
        setBanks(prev => prev.filter(account => 
          account.bank_name?.toLowerCase() !== bankToDelete.name.toLowerCase()
        ));
      }
      
      // BankList'den sil
      setBankList(prev => prev.filter(b => b.id !== bankId));
      
      if (selectedBankId === bankId) {
        setSelectedBankId('');
      }
    } catch (error) {
      console.error('Delete error:', error);
      // Network hatası olsa bile local'den sil
      setBankList(prev => prev.filter(b => b.id !== bankId));
      
      if (selectedBankId === bankId) {
        setSelectedBankId('');
      }
    }
  };

  const handleSaveBank = async () => {
    if (!newBank.name) {
      alert('Banka adı gerekli');
      return;
    }
    
    const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
    
    if (editingBank) {
      // Düzenleme - Backend'e güncelleme isteği
      try {
        await fetch(`${backendUrl}/api/banks/${editingBank.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bank_name: newBank.name,
            country: newBank.country
          })
        });
      } catch (error) {
        console.error('Update error:', error);
      }
      
      // Local state güncelle
      setBankList(prev => prev.map(b => 
        b.id === editingBank.id 
          ? { ...b, name: newBank.name, country: newBank.country }
          : b
      ));
    } else {
      // Yeni ekleme - Backend'e kaydet
      const bankData = {
        bank_name: newBank.name,
        country: newBank.country,
      };
      
      let savedBank = null;
      
      try {
        const response = await fetch(`${backendUrl}/api/banks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bankData)
        });
        
        if (response.ok) {
          savedBank = await response.json();
        }
      } catch (error) {
        console.error('Save error:', error);
      }
      
      // Local state'e ekle
      const bank = {
        id: savedBank?.id || `bank-${Date.now()}-${Math.random()}`,
        name: newBank.name,
        country: newBank.country,
        created_at: new Date().toISOString()
      };
      setBankList(prev => [...prev, bank]);
    }
    
    // Formu temizle ve kapat
    setNewBank({ name: '', country: 'TR' });
    setShowAddBank(false);
    setEditingBank(null);
  };
  
  const getCountryInfo = (countryCode) => {
    return countries.find(c => c.code === countryCode) || { name: countryCode, flag: '🏦', code: countryCode };
  };

  const renderBankDetails = (bank) => {
    if (bank.country === 'Turkey' || bank.country === 'UAE') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          {bank.swift_code && (
            <div><span className="font-medium">SWIFT:</span> {bank.swift_code}</div>
          )}
          {bank.iban && (
            <div><span className="font-medium">IBAN:</span> {bank.iban}</div>
          )}
          {bank.branch_name && (
            <div><span className="font-medium">Şube:</span> {bank.branch_name}</div>
          )}
          {bank.branch_code && (
            <div><span className="font-medium">Şube Kodu:</span> {bank.branch_code}</div>
          )}
          {bank.account_holder && (
            <div><span className="font-medium">Hesap Sahibi:</span> {bank.account_holder}</div>
          )}
          {bank.account_number && (
            <div><span className="font-medium">Hesap No:</span> {bank.account_number}</div>
          )}
        </div>
      );
    } else if (bank.country === 'USA') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          {bank.routing_number && (
            <div><span className="font-medium">Routing Number:</span> {bank.routing_number}</div>
          )}
          {bank.us_account_number && (
            <div><span className="font-medium">Account Number:</span> {bank.us_account_number}</div>
          )}
          {bank.bank_address && (
            <div><span className="font-medium">Banka Adresi:</span> {bank.bank_address}</div>
          )}
          {bank.recipient_address && (
            <div><span className="font-medium">Alıcı Adresi:</span> {bank.recipient_address}</div>
          )}
          {bank.recipient_name && (
            <div><span className="font-medium">Alıcı İsmi:</span> {bank.recipient_name}</div>
          )}
          {bank.recipient_zip_code && (
            <div><span className="font-medium">Zip Code:</span> {bank.recipient_zip_code}</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tüm Bankalar</h1>
            <p className="text-gray-600">Kayıtlı banka bilgilerinizi yönetin</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={onNewBank}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Building2 className="h-4 w-4" />
            <span>Yeni Banka</span>
          </Button>
          <Button
            onClick={handleShareByCountry}
            variant="outline"
            className="flex items-center space-x-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4" />
            <span>Paylaş</span>
          </Button>
          <Button
            variant="outline"
            onClick={onNewBank}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          <button 
            onClick={() => setActiveMainTab('banks')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeMainTab === 'banks' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🏦 Bankalar
          </button>
          <button 
            onClick={() => setActiveMainTab('accounts')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeMainTab === 'accounts' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💳 Banka Hesapları
          </button>
          <button 
            onClick={() => setActiveMainTab('statements')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeMainTab === 'statements' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Ekstreler
          </button>
        </nav>
      </div>

      {/* Tab Content: Bankalar */}
      {activeMainTab === 'banks' && (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bankalar</h3>
              <p className="text-sm text-gray-500">Çalıştığınız bankaları ekleyin</p>
            </div>
            <button
              onClick={() => {
                setEditingBank(null);
                setNewBank({ name: '', country: 'TR' });
                setShowAddBank(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <span className="mr-2">+</span> Yeni Banka
            </button>
          </div>
          
          {/* Banka Ekleme Formu */}
          {showAddBank && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">
                {editingBank ? 'Banka Düzenle' : 'Yeni Banka Ekle'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı *</label>
                  <input
                    type="text"
                    value={newBank.name}
                    onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
                    placeholder="Örn: Garanti BBVA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                  <select
                    value={newBank.country}
                    onChange={(e) => setNewBank({ ...newBank, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleSaveBank}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingBank ? 'Güncelle' : 'Kaydet'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddBank(false);
                      setNewBank({ name: '', country: 'TR' });
                      setEditingBank(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Banka Listesi - Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bankList.map(bank => {
              const country = countries.find(c => c.code === bank.country);
              return (
                <div
                  key={bank.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition group relative"
                >
                  {/* Düzenle/Sil Butonları - Hover'da görünür */}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBank(bank);
                        setShowAddBank(true);
                        setNewBank({ name: bank.name, country: bank.country });
                      }}
                      className="p-1.5 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 shadow-sm transition"
                      title="Düzenle"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`"${bank.name}" bankasını silmek istediğinize emin misiniz?\n\nBu bankaya ait hesaplar da silinecektir.`)) {
                          handleDeleteBank(bank.id);
                        }
                      }}
                      className="p-1.5 bg-white hover:bg-red-50 rounded-lg border border-gray-200 shadow-sm transition text-red-500"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Banka İçeriği */}
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country?.flag || '🏦'}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{bank.name}</h4>
                      <p className="text-xs text-gray-500">{country?.name || bank.country}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Boş durum veya ekleme kartı */}
            {bankList.length === 0 && !showAddBank && (
              <div
                onClick={() => setShowAddBank(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <span className="text-3xl">➕</span>
                <p className="mt-2 text-sm text-gray-500">İlk bankayı ekle</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Banka Hesapları */}
      {activeMainTab === 'accounts' && (
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Banka Hesapları</h3>
              <p className="text-sm text-gray-500">Banka hesap bilgilerinizi yönetin</p>
            </div>
          </div>
          
          {/* Banka yoksa uyarı */}
          {bankList.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="mt-2 text-yellow-800 font-medium">Önce &quot;Bankalar&quot; sekmesinden banka eklemelisiniz</p>
              <button
                onClick={() => setActiveMainTab('banks')}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Banka Ekle
              </button>
            </div>
          ) : (
            <>
              {/* Banka Seçimi */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Banka Seçin</label>
                <div className="flex flex-wrap gap-2">
                  {bankList.map(bank => {
                    const country = countries.find(c => c.code === bank.country);
                    return (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`px-4 py-2 rounded-lg border transition flex items-center space-x-2 ${
                          selectedBankId === bank.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span>{country?.flag || '🏦'}</span>
                        <span>{bank.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Seçili Banka Hesapları */}
              {selectedBankId && (
                <div>
                  {/* Hesap listesi - mevcut banks array'inden bu bankaya ait olanlar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {banks
                      .filter(account => {
                        const selectedBank = bankList.find(b => b.id === selectedBankId);
                        return selectedBank && account.bank_name?.toLowerCase().includes(selectedBank.name.toLowerCase());
                      })
                      .map(account => (
                        <div key={account.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                {currencies.find(c => c.code === account.currency)?.flag} {account.currency || 'TRY'}
                              </span>
                              {account.branch_name && (
                                <span className="text-sm text-gray-500">{account.branch_name}</span>
                              )}
                            </div>
                            
                            {/* Düzenle/Sil Butonları */}
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setNewAccount({
                                    currency: account.currency || 'TRY',
                                    iban: account.iban || '',
                                    swift: account.swift_code || '',
                                    accountNo: account.account_number || '',
                                    branchName: account.branch_name || '',
                                    accountHolder: account.account_holder || '',
                                  });
                                  setEditingAccount(account);
                                  setShowAddAccount(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                                title="Düzenle"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
                                    try {
                                      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
                                      await fetch(`${backendUrl}/api/banks/${account.id}`, {
                                        method: 'DELETE'
                                      });
                                      // Sadece local state'i güncelle, loadBanks() çağırma
                                      setBanks(prev => prev.filter(b => b.id !== account.id));
                                    } catch (error) {
                                      console.error('Delete error:', error);
                                    }
                                  }
                                }}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-500"
                                title="Sil"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {account.iban && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">IBAN</span>
                                <span className="font-mono text-gray-900">{account.iban}</span>
                              </div>
                            )}
                            {account.swift_code && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">SWIFT</span>
                                <span className="font-mono text-gray-900">{account.swift_code}</span>
                              </div>
                            )}
                            {account.account_number && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Hesap No</span>
                                <span className="font-mono text-gray-900">{account.account_number}</span>
                              </div>
                            )}
                            {account.account_holder && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Hesap Sahibi</span>
                                <span className="text-gray-900">{account.account_holder}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    
                    {/* Yeni hesap ekle kartı */}
                    <div
                      onClick={() => setShowAddAccount(true)}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition flex flex-col items-center justify-center min-h-[150px]"
                    >
                      <span className="text-3xl">➕</span>
                      <p className="mt-2 text-sm text-gray-500">Yeni Hesap Ekle</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Banka seçilmemişse */}
              {!selectedBankId && (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <span className="text-4xl">👆</span>
                  <p className="mt-2 text-gray-600">Hesapları görmek için yukarıdan bir banka seçin</p>
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* Tab Content: Ekstreler */}
      {activeMainTab === 'statements' && (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Banka Ekstreleri</h3>
            <p className="text-gray-500 text-sm">Banka ekstrelerinizi yükleyin ve görüntüleyin</p>
          </div>
          
          {/* Banka Seçimi */}
          {banks.length > 0 ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Banka Seçin</label>
                <div className="flex flex-wrap gap-2">
                  {banks.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBankForStatement(bank.id)}
                      className={`px-4 py-2 rounded-lg border transition ${
                        selectedBankForStatement === bank.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {bank.bank_name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Ekstre Yükleme Alanı */}
              {selectedBankForStatement && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Yükleme Kutusu */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer"
                    onClick={() => document.getElementById('statement-upload').click()}
                  >
                    <input
                      type="file"
                      id="statement-upload"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleStatementUpload(e, selectedBankForStatement)}
                    />
                    <div className="text-4xl mb-3">📄</div>
                    <p className="font-medium text-gray-900">PDF Ekstre Yükle</p>
                    <p className="text-sm text-gray-500 mt-1">Sürükle & Bırak veya tıklayın</p>
                    <p className="text-xs text-gray-400 mt-2">Desteklenen format: PDF</p>
                  </div>
                  
                  {/* Yüklenen Ekstreler Listesi */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Yüklenen Ekstreler</h4>
                    {statements.filter(s => s.bankId === selectedBankForStatement).length === 0 ? (
                      <p className="text-gray-500 text-sm">Henüz ekstre yüklenmemiş</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {statements
                          .filter(s => s.bankId === selectedBankForStatement)
                          .map(statement => (
                            <div key={statement.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
                              {/* Header */}
                              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">📄</span>
                                  <div>
                                    <p className="font-semibold text-white text-sm">{statement.filename}</p>
                                    <p className="text-blue-100 text-xs">Yüklenme: {statement.uploadDate}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => downloadStatement(statement)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition"
                                    title="İndir"
                                  >
                                    <span className="text-white">⬇️</span>
                                  </button>
                                  <button
                                    onClick={() => deleteStatement(statement.id)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition"
                                    title="Sil"
                                  >
                                    <span className="text-white">🗑️</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Body */}
                              <div className="p-4 space-y-3">
                                {/* Tarih Aralığı */}
                                {statement.periodStart && statement.periodEnd && (
                                  <div className="flex items-center justify-between text-sm">
                                    <div>
                                      <p className="text-gray-500 text-xs">Başlangıç</p>
                                      <p className="font-semibold text-gray-900">
                                        {statement.periodStart}
                                      </p>
                                    </div>
                                    <div className="text-gray-300 text-xl">→</div>
                                    <div className="text-right">
                                      <p className="text-gray-500 text-xs">Bitiş</p>
                                      <p className="font-semibold text-gray-900">
                                        {statement.periodEnd}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Bakiye Bilgileri */}
                                {statement.openingBalance !== undefined && statement.closingBalance !== undefined && (
                                  <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">Açılış Bakiyesi</span>
                                      <span className="font-semibold text-gray-900">
                                        {statement.openingBalance?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {statement.currency || 'AED'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">Kapanış Bakiyesi</span>
                                      <span className="font-semibold text-green-600">
                                        {statement.closingBalance?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {statement.currency || 'AED'}
                                      </span>
                                    </div>
                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 font-medium">Net Değişim</span>
                                        <span className={`font-bold ${statement.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {statement.netChange >= 0 ? '+' : ''}
                                          {statement.netChange?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {statement.currency || 'AED'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Gelen/Giden Özeti */}
                                {statement.totalIncoming !== undefined && statement.totalOutgoing !== undefined && (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-green-50 rounded-lg p-2 text-center">
                                      <p className="text-green-600 font-medium">Toplam Gelen</p>
                                      <p className="text-green-700 font-bold text-sm">
                                        +{statement.totalIncoming?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2 text-center">
                                      <p className="text-red-600 font-medium">Toplam Giden</p>
                                      <p className="text-red-700 font-bold text-sm">
                                        -{statement.totalOutgoing?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* İşlem İstatistikleri */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-3">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                      📊 {statement.statistics?.transactionCount || 0} işlem
                                    </span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                      ✓ {statement.statistics?.categorizedCount || 0}
                                    </span>
                                    {(statement.statistics?.pendingCount || 0) > 0 && (
                                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                                        ⚠ {statement.statistics.pendingCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Görüntüle Butonu */}
                                <button
                                  onClick={() => viewStatement(statement)}
                                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium flex items-center justify-center space-x-2"
                                >
                                  <span>📊</span>
                                  <span>İşlemleri Görüntüle</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz banka eklenmemiş</h3>
              <p className="text-gray-500 mb-4">Ekstre yüklemek için önce banka eklemelisiniz</p>
              <Button onClick={onNewBank} className="bg-green-600 hover:bg-green-700">
                <Building2 className="h-4 w-4 mr-2" />
                Yeni Banka Ekle
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Dikkat!</h3>
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                <strong>&quot;{bankToDelete?.bank_name}&quot;</strong> bankası kayıtlarımızdan silinecektir.
                <br /><br />
                Bu işlem geri alınamaz. Onaylıyor musunuz?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBankToDelete(null);
                }}
                variant="outline"
                className="flex-1 py-3"
              >
                İptal Et
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3"
              >
                ✓ Onaylıyorum
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
              {shareMode === 'single' ? 'Banka Bilgisi Paylaş' : 'Ülke Bankalarını Paylaş'}
            </h3>
            
            {shareMode === 'country' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paylaşılacak Ülkeyi Seçin
                </label>
                <select
                  value={selectedShareCountry}
                  onChange={(e) => setSelectedShareCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Ülke seçin...</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {shareMode === 'single' && bankToShare && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900">{bankToShare.bank_name}</h4>
                <p className="text-sm text-gray-600">{getCountryInfo(bankToShare.country).flag} {getCountryInfo(bankToShare.country).name}</p>
              </div>
            )}

            {shareMode === 'country' && selectedShareCountry && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900">
                  {getCountryInfo(selectedShareCountry).flag} {getCountryInfo(selectedShareCountry).name} 
                </h4>
                <p className="text-sm text-gray-600">
                  {filteredBanks.filter(bank => bank.country === selectedShareCountry).length} banka bilgisi paylaşılacak
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowShareModal(false);
                  setBankToShare(null);
                  setSelectedShareCountry('');
                }}
                variant="outline"
                className="flex-1 py-3"
              >
                İptal
              </Button>
              <Button
                onClick={handleCountryShareConfirm}
                disabled={shareMode === 'country' && !selectedShareCountry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:opacity-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Penceresini Aç
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Hesap Ekleme Modal - Profesyonel */}
      {showAddAccount && selectedBankId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {editingAccount ? 'Banka Hesabı Düzenle' : 'Yeni Banka Hesabı'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {bankList.find(b => b.id === selectedBankId)?.name}
                  </p>
                </div>
                <button onClick={closeModal} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Para Birimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi *</label>
                <div className="flex flex-wrap gap-2">
                  {currencies.map(curr => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`px-3 py-2 rounded-lg border transition flex items-center space-x-2 ${
                        newAccount.currency === curr.code
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{curr.flag}</span>
                      <span className="font-medium">{curr.code}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* IBAN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN *
                  {newAccount.currency === 'TRY' && (
                    <span className="text-gray-400 font-normal ml-2">TR ile başlamalı, 26 karakter</span>
                  )}
                </label>
                <input
                  type="text"
                  value={newAccount.iban}
                  onChange={handleIBANChange}
                  onBlur={() => handleBlur('iban')}
                  placeholder={newAccount.currency === 'TRY' ? 'TR00 0000 0000 0000 0000 0000 00' : 'IBAN numaranızı girin'}
                  className={`w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-wider transition ${
                    touched.iban && errors.iban
                      ? 'border-red-500 bg-red-50 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {touched.iban && errors.iban && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.iban}
                  </p>
                )}
                {touched.iban && !errors.iban && newAccount.iban && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span> Geçerli IBAN
                  </p>
                )}
              </div>
              
              {/* SWIFT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT Kodu *
                  <span className="text-gray-400 font-normal ml-2">8 veya 11 karakter</span>
                </label>
                <input
                  type="text"
                  value={newAccount.swift}
                  onChange={handleSWIFTChange}
                  onBlur={() => handleBlur('swift')}
                  placeholder="TGBATRIS"
                  className={`w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-wider transition ${
                    touched.swift && errors.swift
                      ? 'border-red-500 bg-red-50 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {touched.swift && errors.swift && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.swift}
                  </p>
                )}
                {touched.swift && !errors.swift && newAccount.swift && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <span className="mr-1">✓</span> Geçerli SWIFT kodu
                  </p>
                )}
                {newAccount.swift && detectSwiftFromIBAN(newAccount.iban) === newAccount.swift && (
                  <p className="mt-1 text-sm text-blue-600 flex items-center">
                    <span className="mr-1">🔍</span> IBAN&apos;dan otomatik tespit edildi
                  </p>
                )}
              </div>
              
              {/* Şube ve Hesap No - Yan Yana */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şube Adı</label>
                  <input
                    type="text"
                    value={newAccount.branchName}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, branchName: e.target.value }))}
                    placeholder="Levent Şubesi"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hesap No
                    <span className="text-gray-400 font-normal ml-1">(Opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={newAccount.accountNo}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountNo: e.target.value }))}
                    placeholder="1234567-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Firma Ünvanı - Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma Ünvanı *</label>
                <select
                  value={newAccount.companyId}
                  onChange={(e) => {
                    const company = companies.find(c => c.id === e.target.value);
                    setNewAccount(prev => ({
                      ...prev,
                      companyId: e.target.value,
                      companyName: company?.name || ''
                    }));
                    if (e.target.value) {
                      setErrors(prev => ({ ...prev, companyId: null }));
                    }
                  }}
                  onBlur={() => handleBlur('companyId')}
                  className={`w-full px-4 py-3 border rounded-lg transition ${
                    touched.companyId && errors.companyId
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Firma Seçin --</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {touched.companyId && errors.companyId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.companyId}
                  </p>
                )}
                {companies.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">
                    ⚠️ Ayarlar → Grup Şirketleri&apos;nden şirket eklemelisiniz
                  </p>
                )}
              </div>
              
              {/* Adres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                <textarea
                  value={newAccount.address}
                  onChange={(e) => {
                    setNewAccount(prev => ({ ...prev, address: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, address: null }));
                    }
                  }}
                  onBlur={() => handleBlur('address')}
                  placeholder="Banka şubesinin veya hesap sahibinin adresi"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg transition resize-none ${
                    touched.address && errors.address
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {touched.address && errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.address}
                  </p>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Zorunlu alanlar
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitAccount}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center"
                >
                  <span className="mr-2">{editingAccount ? '✓' : '+'}</span>
                  {editingAccount ? 'Güncelle' : 'Hesap Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Transactions Modal */}
      {showTransactionsModal && selectedStatement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-xl">
                    {selectedStatement.fileName || 'Banka Ekstresi'}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-green-100 text-sm">
                    <span>📊 {selectedStatement.transactionCount} İşlem</span>
                    <span>✓ {selectedStatement.categorizedCount} Kategorize</span>
                    <span>⚠ {selectedStatement.pendingCount} Bekliyor</span>
                    <span>💰 Bakiye: {selectedStatement.closingBalance?.toLocaleString('tr-TR')} TRY</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTransactionsModal(false);
                    setSelectedStatement(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem Türü</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alt Kategori</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedStatement.transactions?.map((txn, idx) => {
                        const txnId = txn.id || `txn-${idx}`;
                        const updated = updatedTransactions[txnId] || {};
                        const currentType = updated.type || txn.type || '';
                        const currentCategoryId = updated.categoryId || txn.categoryId || '';
                        const currentSubCategoryId = updated.subCategoryId || txn.subCategoryId || '';
                        
                        const selectedType = transactionTypes.find(t => t.id === currentType);
                        const availableSubTypes = selectedType?.subTypes || [];
                        
                        return (
                          <tr key={idx} className={`hover:bg-gray-50 ${txn.autoMatched ? 'bg-green-50' : txn.suggestedMatch ? 'bg-yellow-50' : ''}`}>
                            <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                              {new Date(txn.date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-900 max-w-xs">
                              <div className="truncate" title={txn.description}>
                                {txn.description}
                              </div>
                              {txn.autoMatched && (
                                <span className="text-green-600 text-[10px]">🤖 Otomatik eşleşti</span>
                              )}
                              {txn.suggestedMatch && (
                                <span className="text-orange-600 text-[10px]">💡 Öneri var</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-right whitespace-nowrap">
                              {txn.amount > 0 ? (
                                <span className="text-green-600 font-semibold">
                                  +{txn.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-red-600 font-semibold">
                                  {txn.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={currentType}
                                onChange={(e) => handleTransactionUpdate(txnId, 'type', e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                              >
                                <option value="">-- İşlem Türü Seç --</option>
                                {transactionTypes.map(type => (
                                  <option key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              {currentType ? (
                                <select
                                  value={currentCategoryId}
                                  onChange={(e) => {
                                    handleTransactionUpdate(txnId, 'categoryId', e.target.value);
                                    handleTransactionUpdate(txnId, 'subCategoryId', '');
                                  }}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                                >
                                  <option value="">-- Kategori Seç --</option>
                                  {availableSubTypes.map(sub => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-gray-400">Önce tür seçin</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Alt kategori"
                                value={currentSubCategoryId}
                                onChange={(e) => handleTransactionUpdate(txnId, 'subCategoryId', e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              {txn.autoMatched ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ {Math.round(txn.confidence * 100)}%
                                </span>
                              ) : txn.suggestedMatch ? (
                                <button
                                  onClick={() => {
                                    const match = txn.suggestedMatch;
                                    handleTransactionUpdate(txnId, 'type', match.learned.type);
                                    handleTransactionUpdate(txnId, 'categoryId', match.learned.categoryId);
                                    handleTransactionUpdate(txnId, 'subCategoryId', match.learned.subCategoryId);
                                  }}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200"
                                >
                                  ? {Math.round(txn.suggestedMatch.confidence * 100)}%
                                </button>
                              ) : updated.type ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  ✏️ Manuel
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  ○ Bekliyor
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-600">
                Toplam: {selectedStatement.transactionCount} işlem
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowTransactionsModal(false);
                    setSelectedStatement(null);
                  }}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
                >
                  Kapat
                </button>
                <button
                  onClick={handleSaveTransactions}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center"
                >
                  <span className="mr-2">💾</span>
                  Kaydet ve Öğren ({Object.keys(updatedTransactions).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <BankEmailModal
          banks={emailBanks}
          mode={emailMode}
          onClose={() => {
            setShowEmailModal(false);
            setEmailBanks([]);
          }}
        />
      )}
    </div>
  );
};

export default AllBanksPage;