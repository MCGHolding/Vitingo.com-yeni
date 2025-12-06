import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Building2, Edit, Trash2, Search, Globe, Share2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import BankEmailModal from './BankEmailModal';
import BankStatementAnalyzer from '../BankStatement/BankStatementAnalyzer';
import { validateIBAN as validateIBANUtil, formatIBAN as formatIBANUtil, getIBANPlaceholder, IBAN_SPECS } from '../../utils/ibanValidator';

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
  
  // Ref for file input (React pattern instead of document.getElementById)
  const statementFileInputRef = useRef(null);
  
  // New upload modal state
  const [showNewUploadModal, setShowNewUploadModal] = useState(false);
  const [selectedBankForUpload, setSelectedBankForUpload] = useState('');
  
  // New bank accounts tab states
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [accountForm, setAccountForm] = useState({
    groupCompany: '',
    country: '',
    bankName: '',
    swiftCode: '',
    iban: '',
    branchName: '',
    branchCode: '',
    accountHolder: '',
    accountNumber: '',
    currency: 'TRY',
    accountType: 'current'
  });
  
  // IBAN Validation state
  const [ibanValidation, setIbanValidation] = useState({
    valid: false,
    error: null,
    message: '',
    touched: false
  });
  
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

  // Load bank accounts from backend
  const loadBankAccounts = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/bank-accounts`);
      
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  // Handle IBAN input change with real-time validation
  const handleAccountIBANChange = (e) => {
    const rawValue = e.target.value;
    const formatted = formatIBANUtil(rawValue);
    
    // Update form state
    setAccountForm(prev => ({ ...prev, iban: formatted }));
    
    // Mark as touched
    setIbanValidation(prev => ({ ...prev, touched: true }));
    
    // Run validation
    console.log('🔍 IBAN Validation Debug:', {
      formatted,
      selectedCountry: accountForm.country,
      formState: accountForm
    });
    
    const validation = validateIBANUtil(formatted, accountForm.country);
    
    console.log('📊 Validation Result:', validation);
    
    setIbanValidation({
      valid: validation.valid,
      error: validation.error,
      message: validation.message,
      touched: true,
      countryCode: validation.countryCode,
      countryName: validation.countryName,
      formatted: validation.formatted
    });
  };

  // Save bank account
  const handleSaveAccount = async () => {
    console.log('🔵 handleSaveAccount called');
    console.log('📋 accountForm:', accountForm);
    console.log('🔍 selectedAccount:', selectedAccount);
    console.log('🆕 showAccountForm:', showAccountForm);
    
    // Validate IBAN before saving
    if (accountForm.iban && !ibanValidation.valid && ibanValidation.touched) {
      alert('❌ Lütfen geçerli bir IBAN girin');
      return;
    }
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const data = {
        ...accountForm,
        status: 'active'
      };
      
      console.log('📤 Data to send:', data);
      
      if (selectedAccount && !showAccountForm) {
        // Update existing account
        const response = await fetch(`${backendUrl}/api/bank-accounts/${selectedAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await loadBankAccounts();
          setIsEditing(false);
          setSelectedAccount(null);
          setIbanValidation({
            valid: false,
            error: null,
            message: '',
            touched: false
          });
          console.log('✅ Hesap güncellendi');
        } else {
          const error = await response.json();
          alert('❌ Güncelleme hatası: ' + (error.detail || 'Bilinmeyen hata'));
        }
      } else {
        // Create new account
        const response = await fetch(`${backendUrl}/api/bank-accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await loadBankAccounts();
          setShowAccountForm(false);
          setAccountForm({
            groupCompany: '',
            country: '',
            bankName: '',
            swiftCode: '',
            iban: '',
            branchName: '',
            branchCode: '',
            accountHolder: '',
            accountNumber: '',
            currency: 'TRY',
            accountType: 'current'
          });
          setIbanValidation({
            valid: false,
            error: null,
            message: '',
            touched: false
          });
          console.log('✅ Hesap oluşturuldu');
        } else {
          const error = await response.json();
          alert('❌ Oluşturma hatası: ' + (error.detail || 'Bilinmeyen hata'));
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('❌ Hata: ' + error.message);
    }
  };

  // Delete bank account
  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/bank-accounts/${accountId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadBankAccounts();
        setSelectedAccount(null);
        console.log('✅ Hesap silindi');
      } else {
        const error = await response.json();
        alert('❌ Silme hatası: ' + (error.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('❌ Hata: ' + error.message);
    }
  };


  // Load statements from backend
  const loadStatements = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Her banka için statements çek
      const allStatements = [];
      for (const bank of banks) {
        try {
          const response = await fetch(`${backendUrl}/api/banks/${bank.id}/statements`);
          if (response.ok) {
            const bankStatements = await response.json();
            // Her statement'a bankId ekle
            bankStatements.forEach(stmt => {
              allStatements.push({
                ...stmt,
                id: stmt.statementId || stmt.id,
                bankId: bank.id,
                filename: stmt.fileName,
                uploadDate: stmt.createdAt ? new Date(stmt.createdAt).toLocaleDateString('tr-TR') : '',
                startDate: stmt.periodStart,
                endDate: stmt.periodEnd,
                periodStart: stmt.periodStart,
                periodEnd: stmt.periodEnd,
                totalTransactions: stmt.transactionCount,
                statistics: {
                  transactionCount: stmt.transactionCount,
                  categorizedCount: stmt.categorizedCount,
                  pendingCount: stmt.pendingCount
                }
              });
            });
          }
        } catch (err) {
          console.error(`Error loading statements for bank ${bank.id}:`, err);
        }
      }
      
      console.log('✅ Loaded statements from backend:', allStatements.length);
      setStatements(allStatements);
    } catch (error) {
      console.error('Error loading statements:', error);
    }
  };

  // Load banks and companies on component mount
  useEffect(() => {
    loadGroupCompanies();
    loadBanks();
    loadBankAccounts();
  }, []);
  
  // Load statements when banks are loaded
  useEffect(() => {
    if (banks.length > 0) {
      loadStatements();
    }
  }, [banks]);

  // Mevcut bankalardan benzersiz banka isimlerini çıkar ve bankList'e aktar
  useEffect(() => {
    if (banks.length > 0) {
      const uniqueBanks = [];
      const seenNames = new Set();
      
      banks.forEach(account => {
        const name = account.bank_name;
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          uniqueBanks.push({
            id: account.id || `bank-${Date.now()}-${Math.random()}`,
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
  }, [banks]);

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
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📤 Upload started:', { bankId, fileName: file.name, fileSize: file.size });
    
    if (file.type !== 'application/pdf') {
      alert('Sadece PDF dosyaları yükleyebilirsiniz');
      e.target.value = ''; // Reset input
      return;
    }
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('🚀 Sending to API:', `${backendUrl}/api/banks/${bankId}/statements/upload`);
      
      const response = await fetch(`${backendUrl}/api/banks/${bankId}/statements/upload`, {
        method: 'POST',
        body: formData
      });
      
      console.log('📥 API Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Parse result:', result);
        
        const newStatement = {
          id: result.statementId || result.id,
          bankId: bankId,
          filename: result.fileName || file.name,
          period: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
          uploadDate: new Date().toLocaleDateString('tr-TR'),
          file: file,
          
          // Tarih bilgileri
          periodStart: result.headerInfo?.periodStart,
          periodEnd: result.headerInfo?.periodEnd,
          startDate: result.headerInfo?.periodStart,
          endDate: result.headerInfo?.periodEnd,
          
          // Bakiye bilgileri
          currency: result.headerInfo?.currency,
          openingBalance: result.headerInfo?.openingBalance,
          closingBalance: result.headerInfo?.closingBalance,
          netChange: result.statistics?.netChange,
          
          // Toplam bilgiler
          totalIncoming: result.statistics?.totalIncoming,
          totalOutgoing: result.statistics?.totalOutgoing,
          totalCredits: result.statistics?.totalIncoming,
          totalDebits: result.statistics?.totalOutgoing,
          
          // İşlem istatistikleri
          transactionCount: result.statistics?.transactionCount,
          totalTransactions: result.statistics?.transactionCount,
          categorizedCount: result.statistics?.categorizedCount,
          pendingCount: result.statistics?.pendingCount,
          
          // Detaylar
          transactions: result.transactions || [],
          statistics: result.statistics || {
            transactionCount: 0,
            categorizedCount: 0,
            pendingCount: 0
          }
        };
        
        setStatements(prev => [...prev, newStatement]);
        console.log(`✅ Ekstre parse edildi: ${result.statistics?.transactionCount || 0} işlem bulundu`);
        // Alert kaldırıldı - sessiz yükleme
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        alert('❌ Yükleme hatası: ' + (error.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('❌ Yükleme hatası: ' + error.message);
    } finally {
      // Always reset the file input to allow re-uploading the same file
      e.target.value = '';
      console.log('🔄 File input reset');
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

  const deleteStatement = async (statement) => {
    if (window.confirm('Bu ekstreyi silmek istediğinize emin misiniz?')) {
      try {
        const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        
        // Backend'e DELETE isteği gönder
        const response = await fetch(`${backendUrl}/api/banks/${statement.bankId}/statements/${statement.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Başarılı silme - frontend state'ini güncelle
          setStatements(prev => prev.filter(s => s.id !== statement.id));
          console.log('✅ Ekstre silindi:', statement.id);
        } else {
          const error = await response.json();
          alert('❌ Silme hatası: ' + (error.detail || 'Bilinmeyen hata'));
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Silme hatası: ' + error.message);
      }
    }
  };

  const handleStatementFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Sadece PDF dosyaları yükleyebilirsiniz');
      return;
    }
    
    setUploadingFile(file);
    setShowStatementUploadModal(true);
  };

  const saveStatement = async () => {
    if (!uploadingFile) return;
    
    const selectedBank = bankList.find(b => b.id === selectedBankForStatement);
    
    // Backend'e yükle ve parse et
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const formData = new FormData();
      formData.append('file', uploadingFile);
      
      const response = await fetch(`${backendUrl}/api/banks/${selectedBankForStatement}/statements/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Backend'den gelen veya kullanıcıdan girilen bilgileri birleştir
        const newStatement = {
          id: result.statementId || result.id || Date.now().toString(),
          bankId: selectedBankForStatement,
          bankName: selectedBank?.name || '',
          filename: result.fileName || uploadingFile.name,
          
          // Kullanıcı girdileri varsa onları kullan, yoksa backend'den gelenleri
          periodStart: statementMeta.startDate || result.periodStart,
          periodEnd: statementMeta.endDate || result.periodEnd,
          startDate: statementMeta.startDate ? new Date(statementMeta.startDate).toLocaleDateString('tr-TR') : result.periodStart,
          endDate: statementMeta.endDate ? new Date(statementMeta.endDate).toLocaleDateString('tr-TR') : result.periodEnd,
          period: statementMeta.startDate && statementMeta.endDate 
            ? `${new Date(statementMeta.startDate).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })} - ${new Date(statementMeta.endDate).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`
            : result.period,
          
          currency: statementMeta.currency || result.currency,
          openingBalance: statementMeta.openingBalance ? parseFloat(statementMeta.openingBalance) : result.openingBalance,
          closingBalance: statementMeta.closingBalance ? parseFloat(statementMeta.closingBalance) : result.closingBalance,
          netChange: result.netChange,
          
          totalIncoming: result.totalIncoming,
          totalOutgoing: result.totalOutgoing,
          totalTransactions: result.transactionCount || 0,
          totalCredits: result.totalIncoming,
          totalDebits: result.totalOutgoing,
          
          transactionCount: result.transactionCount,
          categorizedCount: result.categorizedCount,
          pendingCount: result.pendingCount,
          
          uploadDate: new Date().toLocaleDateString('tr-TR'),
          status: 'processed'
        };
        
        setStatements(prev => [...prev, newStatement]);
        alert(`✅ Ekstre kaydedildi!\n📊 ${result.transactionCount || 0} işlem parse edildi`);
      } else {
        const error = await response.json();
        alert('❌ Yükleme hatası: ' + (error.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Yükleme hatası: ' + error.message);
    }
    
    // Modal kapat ve temizle
    setShowStatementUploadModal(false);
    setUploadingFile(null);
    setStatementMeta({ startDate: '', endDate: '', openingBalance: '', closingBalance: '', currency: 'TRY' });
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
      
      // Backend'den bankaları yeniden yükle
      await loadBanks();
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
    
    // Backend'den bankaları yeniden yükle
    await loadBanks();
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
        <div className="grid grid-cols-12 gap-6 p-6">
          
          {/* SOL PANEL: HESAP LİSTESİ */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              
              {/* Header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Banka Hesapları</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {bankAccounts.length} hesap
                </span>
              </div>
              
              {/* Arama */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Hesap ara..." 
                    value={accountSearchTerm}
                    onChange={(e) => setAccountSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
              
              {/* Hesap Listesi - Şirketlere Göre Gruplandırılmış */}
              <div className="max-h-[500px] overflow-y-auto">
                {(() => {
                  // Hesapları filtrele
                  const filteredAccounts = bankAccounts.filter(acc => 
                    !accountSearchTerm || 
                    acc.bankName?.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
                    acc.iban?.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
                    acc.accountHolder?.toLowerCase().includes(accountSearchTerm.toLowerCase())
                  );
                  
                  // Şirketlere göre grupla
                  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
                    const companyName = account.accountHolder || 'Diğer';
                    if (!groups[companyName]) {
                      groups[companyName] = [];
                    }
                    groups[companyName].push(account);
                    return groups;
                  }, {});
                  
                  return Object.entries(groupedAccounts).map(([companyName, accounts]) => (
                    <div key={companyName} className="mb-4">
                      {/* Şirket Başlığı */}
                      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">🏢</span>
                            <span className="font-semibold text-gray-800 text-sm">{companyName}</span>
                          </div>
                          <span className="text-xs bg-white px-2 py-0.5 rounded text-gray-600">
                            {accounts.length} hesap
                          </span>
                        </div>
                      </div>
                      
                      {/* Şirketin Hesapları */}
                      <div className="divide-y divide-gray-100">
                        {accounts.map(account => (
                    <div 
                      key={account.id}
                      onClick={() => {
                        setSelectedAccount(account);
                        setAccountForm({
                          groupCompany: account.groupCompany || '',
                          country: account.country || '',
                          bankName: account.bankName || '',
                          swiftCode: account.swiftCode || '',
                          iban: account.iban || '',
                          branchName: account.branchName || '',
                          branchCode: account.branchCode || '',
                          accountHolder: account.accountHolder || '',
                          accountNumber: account.accountNumber || '',
                          currency: account.currency || 'TRY',
                          accountType: account.accountType || 'current'
                        });
                        // Validate existing IBAN when account is selected
                        if (account.iban) {
                          const validation = validateIBANUtil(account.iban, account.country);
                          setIbanValidation({
                            valid: validation.valid,
                            error: validation.error,
                            message: validation.message,
                            touched: true,
                            countryCode: validation.countryCode,
                            countryName: validation.countryName,
                            formatted: validation.formatted
                          });
                        } else {
                          setIbanValidation({
                            valid: false,
                            error: null,
                            message: '',
                            touched: false
                          });
                        }
                        setShowAccountForm(false);
                        setIsEditing(false);
                      }}
                      className={`p-4 cursor-pointer transition ${
                        selectedAccount?.id === account.id 
                          ? 'bg-green-50 border-l-4 border-green-500' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedAccount?.id === account.id ? 'bg-white shadow-sm' : 'bg-gray-100'
                          }`}>
                            <span className="text-lg">
                              {account.country === 'TR' ? '🇹🇷' : 
                               account.country === 'AE' ? '🇦🇪' : 
                               account.country === 'US' ? '🇺🇸' : 
                               account.country === 'DE' ? '🇩🇪' : 
                               account.country === 'GB' ? '🇬🇧' : '🏦'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{account.bankName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {account.iban?.substring(0, 18)}****
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                          account.currency === 'USD' ? 'bg-blue-100 text-blue-700' :
                          account.currency === 'EUR' ? 'bg-purple-100 text-purple-700' :
                          account.currency === 'TRY' ? 'bg-red-100 text-red-700' :
                          account.currency === 'AED' ? 'bg-emerald-100 text-emerald-700' :
                          account.currency === 'GBP' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {account.currency}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Bakiye:</span>
                        <span className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(account.balance || 0)} {account.currency}
                        </span>
                      </div>
                    </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Yeni Hesap Butonu */}
              <div className="p-3 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setSelectedAccount(null);
                    setAccountForm({
                      groupCompany: '',
                      country: '',
                      bankName: '',
                      swiftCode: '',
                      iban: '',
                      branchName: '',
                      branchCode: '',
                      accountHolder: '',
                      accountNumber: '',
                      currency: 'TRY',
                      accountType: 'current'
                    });
                    setIbanValidation({
                      valid: false,
                      error: null,
                      message: '',
                      touched: false
                    });
                    setShowAccountForm(true);
                    setIsEditing(false);
                  }}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 font-medium"
                >
                  <span>➕</span>
                  <span>Yeni Hesap Ekle</span>
                </button>
              </div>
              
            </div>
          </div>
          
          {/* SAĞ PANEL: HESAP DETAY / FORM */}
          <div className="col-span-8">
            {selectedAccount || showAccountForm ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <div>
                      <h2 className="text-white font-semibold text-lg">
                        {selectedAccount && !showAccountForm ? 'Hesap Detayları' : 'Yeni Hesap Ekle'}
                      </h2>
                      <p className="text-green-100 text-sm">
                        {selectedAccount && !showAccountForm ? 'Banka hesap bilgilerini görüntüle ve düzenle' : 'Yeni banka hesabı oluştur'}
                      </p>
                    </div>
                  </div>
                  {selectedAccount && !showAccountForm && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition"
                      >
                        ✏️ Düzenle
                      </button>
                      <button 
                        onClick={() => handleDeleteAccount(selectedAccount.id)}
                        className="px-3 py-1.5 bg-red-500/80 text-white text-sm rounded-lg hover:bg-red-600 transition"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Form İçeriği */}
                <div className="p-6 space-y-6">
                  
                  {/* BÖLÜM 1: Grup Şirketi Seçimi */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg">🏢</span>
                      <h3 className="font-semibold text-gray-800">Grup Şirketi Seçimi</h3>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grup Şirketi *</label>
                      <select 
                        value={accountForm.groupCompany}
                        onChange={(e) => {
                          const company = groupCompanies.find(c => c.id === e.target.value);
                          setAccountForm(prev => ({
                            ...prev, 
                            groupCompany: e.target.value,
                            accountHolder: company?.name || '',
                            country: company?.country || ''
                          }));
                        }}
                        disabled={selectedAccount && !isEditing && !showAccountForm}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white disabled:bg-gray-100"
                      >
                        <option value="">Şirket seçin...</option>
                        {groupCompanies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                      {accountForm.accountHolder && (
                        <p className="mt-2 text-sm text-green-600 flex items-center">
                          <span className="mr-1">✓</span>
                          Hesap sahibi otomatik olarak <strong className="mx-1">&quot;{accountForm.accountHolder}&quot;</strong> şeklinde doldurulacaktır
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* BÖLÜM 2: Ülke Seçimi */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg">🌍</span>
                      <h3 className="font-semibold text-gray-800">Ülke Seçimi</h3>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ülke * <span className="text-gray-400 font-normal">(Grup şirketine göre otomatik belirlenir)</span>
                      </label>
                      <select 
                        value={accountForm.country}
                        disabled={true}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      >
                        <option value="">Ülke seçin...</option>
                        <option value="AE">🇦🇪 BAE (Birleşik Arap Emirlikleri)</option>
                        <option value="TR">🇹🇷 Türkiye</option>
                        <option value="SA">🇸🇦 Suudi Arabistan</option>
                        <option value="DE">🇩🇪 Almanya</option>
                        <option value="US">🇺🇸 ABD</option>
                        <option value="GB">🇬🇧 İngiltere</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* BÖLÜM 3: Banka Bilgileri */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg">🏦</span>
                      <h3 className="font-semibold text-gray-800">Banka Bilgileri</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Banka Adı */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Banka Adı *</label>
                        <select 
                          value={accountForm.bankName}
                          onChange={(e) => setAccountForm(prev => ({...prev, bankName: e.target.value}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white disabled:bg-gray-100"
                        >
                          <option value="">Banka seçiniz...</option>
                          {bankList.map(bank => (
                            <option key={bank.id} value={bank.name}>{bank.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* SWIFT Kodu */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT Kodu *</label>
                        <input 
                          type="text" 
                          value={accountForm.swiftCode}
                          onChange={(e) => setAccountForm(prev => ({...prev, swiftCode: e.target.value.toUpperCase()}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          placeholder="Örn: TGBATRISXXX"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none uppercase disabled:bg-gray-100"
                        />
                      </div>
                      
                      {/* IBAN */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IBAN *</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={accountForm.iban}
                            onChange={handleAccountIBANChange}
                            disabled={selectedAccount && !isEditing && !showAccountForm}
                            placeholder={accountForm.country ? getIBANPlaceholder(accountForm.country) : "Örn: TR12 3456 7890 1234 5678 9012 34"}
                            maxLength={accountForm.country && IBAN_SPECS[accountForm.country] ? IBAN_SPECS[accountForm.country].length + Math.floor(IBAN_SPECS[accountForm.country].length / 4) : 42}
                            className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 outline-none disabled:bg-gray-100 transition-all
                              ${ibanValidation.touched && accountForm.iban ? 
                                (ibanValidation.valid ? 
                                  'border-green-500 focus:border-green-500 focus:ring-green-200' : 
                                  'border-red-500 focus:border-red-500 focus:ring-red-200'
                                ) : 
                                'border-gray-300 focus:border-green-500 focus:ring-green-500'
                              }`}
                          />
                          {/* Validation Icon */}
                          {ibanValidation.touched && accountForm.iban && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {ibanValidation.valid ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        {/* Validation Message */}
                        {ibanValidation.touched && accountForm.iban && (
                          <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${ibanValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {ibanValidation.valid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="font-medium">{ibanValidation.message}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="font-medium">{ibanValidation.message}</span>
                              </>
                            )}
                          </p>
                        )}
                        {!ibanValidation.touched && !accountForm.iban && (
                          <p className="mt-1 text-xs text-gray-500">IBAN 40+ ülke için gerçek zamanlı doğrulanır (MOD-97 kontrolü)</p>
                        )}
                      </div>
                      
                      {/* Şube Adı */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Şube Adı</label>
                        <input 
                          type="text" 
                          value={accountForm.branchName}
                          onChange={(e) => setAccountForm(prev => ({...prev, branchName: e.target.value}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          placeholder="Örn: Downtown Dubai Branch"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-100"
                        />
                      </div>
                      
                      {/* Şube Kodu */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Şube Kodu</label>
                        <input 
                          type="text" 
                          value={accountForm.branchCode}
                          onChange={(e) => setAccountForm(prev => ({...prev, branchCode: e.target.value}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          placeholder="Örn: 033"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-100"
                        />
                      </div>
                      
                      {/* Hesap Sahibi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hesap Sahibi</label>
                        <input 
                          type="text" 
                          value={accountForm.accountHolder}
                          disabled
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                        />
                        {accountForm.accountHolder && (
                          <p className="mt-1 text-xs text-green-600 flex items-center">
                            <span className="mr-1">✓</span>
                            Otomatik dolduruldu: {accountForm.accountHolder}
                          </p>
                        )}
                      </div>
                      
                      {/* Hesap Numarası */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hesap Numarası <span className="text-gray-400 font-normal">(Opsiyonel)</span>
                        </label>
                        <input 
                          type="text" 
                          value={accountForm.accountNumber}
                          onChange={(e) => setAccountForm(prev => ({...prev, accountNumber: e.target.value}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          placeholder="Örn: 1234567890123456"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-100"
                        />
                      </div>
                      
                      {/* Para Birimi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi *</label>
                        <select 
                          value={accountForm.currency}
                          onChange={(e) => setAccountForm(prev => ({...prev, currency: e.target.value}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white disabled:bg-gray-100"
                        >
                          <option value="TRY">🇹🇷 TRY - Türk Lirası</option>
                          <option value="USD">🇺🇸 USD - Amerikan Doları</option>
                          <option value="EUR">🇪🇺 EUR - Euro</option>
                          <option value="AED">🇦🇪 AED - BAE Dirhemi</option>
                          <option value="GBP">🇬🇧 GBP - İngiliz Sterlini</option>
                          <option value="SAR">🇸🇦 SAR - Suudi Riyali</option>
                        </select>
                      </div>
                      
                      {/* Hesap Türü */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hesap Türü</label>
                        <select 
                          value={accountForm.accountType}
                          onChange={(e) => setAccountForm(prev => ({...prev, accountType: e.target.value}))}
                          disabled={selectedAccount && !isEditing && !showAccountForm}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white disabled:bg-gray-100"
                        >
                          <option value="current">Vadesiz Hesap</option>
                          <option value="savings">Vadeli Hesap</option>
                          <option value="foreign">Döviz Hesabı</option>
                        </select>
                      </div>
                      
                    </div>
                  </div>
                  
                  {/* BÖLÜM 4: Bakiye Bilgileri (Sadece mevcut hesaplarda göster) */}
                  {selectedAccount && !showAccountForm && (
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-lg">💰</span>
                        <h3 className="font-semibold text-white">Bakiye Bilgileri</h3>
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded">Ekstreden Otomatik</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Açılış Bakiyesi</p>
                          <p className="text-white text-xl font-bold mt-1">
                            {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(selectedAccount.openingBalance || 0)} {selectedAccount.currency}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Güncel Bakiye</p>
                          <p className="text-green-400 text-xl font-bold mt-1">
                            {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(selectedAccount.balance || 0)} {selectedAccount.currency}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Son İşlem</p>
                          <p className="text-white text-xl font-bold mt-1">
                            {selectedAccount.lastTransactionDate || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Butonlar */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        setAccountForm({
                          groupCompany: '',
                          country: '',
                          bankName: '',
                          swiftCode: '',
                          iban: '',
                          branchName: '',
                          branchCode: '',
                          accountHolder: '',
                          accountNumber: '',
                          currency: 'TRY',
                          accountType: 'current'
                        });
                        setSelectedAccount(null);
                        setShowAccountForm(false);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      Temizle
                    </button>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => {
                          setSelectedAccount(null);
                          setShowAccountForm(false);
                          setIsEditing(false);
                        }}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        İptal
                      </button>
                      {(isEditing || showAccountForm) && (
                        <button 
                          onClick={() => handleSaveAccount()}
                          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 font-medium"
                        >
                          <span>💾</span>
                          <span>Kaydet</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>
            ) : (
              /* Hesap seçilmediğinde */
              <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center py-20">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">👆</span>
                  <p className="text-gray-500 text-lg">Hesapları görmek için soldan bir hesap seçin</p>
                  <p className="text-gray-400 text-sm mt-2">veya yeni hesap ekleyin</p>
                </div>
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* Tab Content: Ekstreler */}
      {activeMainTab === 'statements' && (
        <div className="p-6">
          {/* Header with Upload Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Banka Ekstreleri</h3>
              <p className="text-gray-500 text-sm">Yüklenmiş banka ekstrelerinizi görüntüleyin</p>
            </div>
            <button
              onClick={() => setShowNewUploadModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition"
            >
              <span className="text-lg">📤</span>
              <span>Yeni Ekstre Yükle</span>
            </button>
          </div>
          
          {/* Bankaları ve ekstrelerini göster - sadece ekstre olanlar */}
          {banks.length > 0 ? (
            <>
              {/* Ekstre olan bankaları filtrele */}
              {banks.filter(bank => statements.some(s => s.bankId === bank.id)).length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed">
                  <span className="text-6xl mb-4 block">📄</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ekstre yüklenmemiş</h3>
                  <p className="text-gray-500 mb-4">İlk ekstreyi yüklemek için yukarıdaki butona tıklayın</p>
                  <button
                    onClick={() => setShowNewUploadModal(true)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Yeni Ekstre Yükle
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {banks
                    .filter(bank => statements.some(s => s.bankId === bank.id))
                    .map(bank => {
                      const bankStatements = statements.filter(s => s.bankId === bank.id);
                      return (
                        <div key={bank.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          {/* Bank Header */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">🏦</span>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{bank.bank_name}</h4>
                                  <p className="text-sm text-gray-500">{bankStatements.length} ekstre</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedBankForUpload(bank.id);
                                  setShowNewUploadModal(true);
                                }}
                                className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                              >
                                + Yeni Ekstre
                              </button>
                            </div>
                          </div>
                          
                          {/* Statements Grid */}
                          <div className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                              {bankStatements.map(statement => (
                                <div key={statement.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
                                  
                                  {/* Header - Para birimine göre renk */}
                                  <div className={`px-4 py-2.5 flex items-center justify-between ${
                                    statement.currency === 'USD' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                                    statement.currency === 'EUR' ? 'bg-gradient-to-r from-purple-600 to-violet-600' :
                                    statement.currency === 'GBP' ? 'bg-gradient-to-r from-gray-700 to-gray-800' :
                                    statement.currency === 'TRY' ? 'bg-gradient-to-r from-red-600 to-rose-600' :
                                    statement.currency === 'AED' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                                    statement.currency === 'SAR' ? 'bg-gradient-to-r from-green-700 to-emerald-700' :
                                    'bg-gradient-to-r from-gray-600 to-gray-700'
                                  }`}>
                                    <div className="flex items-center space-x-2">
                                      <span>📄</span>
                                      <span className="text-white font-medium text-sm truncate max-w-[200px]">{statement.filename}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">{statement.currency || 'TRY'}</span>
                                      <button
                                        onClick={() => downloadStatement(statement)}
                                        className="p-1 hover:bg-white/20 rounded transition opacity-0 group-hover:opacity-100"
                                        title="İndir"
                                      >
                                        <span className="text-white text-sm">⬇️</span>
                                      </button>
                                      <button
                                        onClick={() => deleteStatement(statement)}
                                        className="p-1 hover:bg-white/20 rounded transition opacity-0 group-hover:opacity-100"
                                        title="Sil"
                                      >
                                        <span className="text-white text-sm">🗑️</span>
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Body */}
                                  <div className="p-3">
                                    {/* Tarih Aralığı */}
                                    <div className="flex items-center justify-between text-sm mb-3">
                                      <span className="text-gray-500">
                                        {statement.periodStart || '-'} → {statement.periodEnd || '-'}
                                      </span>
                                    </div>
                                    
                                    {/* Açılış ve Kapanış Bakiyesi */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                                        <p className="text-xs text-gray-500">Açılış</p>
                                        <p className="font-semibold text-gray-900 text-sm">
                                          {new Intl.NumberFormat('tr-TR', { 
                                            style: 'currency', 
                                            currency: statement.currency || 'TRY',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                          }).format(statement.openingBalance || 0)}
                                        </p>
                                      </div>
                                      <div className="bg-green-50 rounded-lg px-3 py-2">
                                        <p className="text-xs text-gray-500">Kapanış</p>
                                        <p className="font-semibold text-green-700 text-sm">
                                          {new Intl.NumberFormat('tr-TR', { 
                                            style: 'currency', 
                                            currency: statement.currency || 'TRY',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                          }).format(statement.closingBalance || 0)}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* İşlem Özeti ve Buton */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <span>📊 {statement.transactionCount || statement.statistics?.transactionCount || 0}</span>
                                        <span className="text-green-600">↓ {new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(statement.totalIncoming || 0)}</span>
                                        <span className="text-red-500">↑ {new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(statement.totalOutgoing || 0)}</span>
                                      </div>
                                      <button
                                        onClick={() => viewStatement(statement)}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                                      >
                                        Görüntüle
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
      
      {/* New Upload Modal */}
      {showNewUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Ekstre Yükle</h3>
            
            {/* Bank Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Banka Seçin</label>
              <select
                value={selectedBankForUpload}
                onChange={(e) => setSelectedBankForUpload(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Banka Seçiniz --</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.bank_name}</option>
                ))}
              </select>
            </div>
            
            {/* File Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 hover:bg-purple-50 transition cursor-pointer mb-4"
              onClick={() => {
                if (selectedBankForUpload) {
                  statementFileInputRef.current?.click();
                } else {
                  alert('Lütfen önce bir banka seçin');
                }
              }}
            >
              <input
                ref={statementFileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (selectedBankForUpload) {
                    handleStatementUpload(e, selectedBankForUpload);
                    setShowNewUploadModal(false);
                    setSelectedBankForUpload('');
                  }
                }}
              />
              <div className="text-4xl mb-2">📄</div>
              <p className="font-medium text-gray-900">PDF Ekstre Yükle</p>
              <p className="text-sm text-gray-500 mt-1">Tıklayın veya dosya sürükleyin</p>
              <p className="text-xs text-gray-400 mt-2">Desteklenen format: PDF</p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowNewUploadModal(false);
                setSelectedBankForUpload('');
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBanksPage;