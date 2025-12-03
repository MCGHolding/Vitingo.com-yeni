import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import AmountInput from './ui/AmountInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { getFreshPresignedUrl } from '../utils/s3';
import { 
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  Banknote as BanknoteIcon,
  FileTextIcon,
  ArrowLeftIcon,
  SaveIcon,
  EyeIcon,
  PaperclipIcon,
  XIcon,
  XCircleIcon,
  SendIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create empty expense line helper function
const createEmptyExpenseLine = (currency = 'TRY', advanceCurrency = null) => ({
  id: Date.now() + Math.random(),
  date: new Date().toISOString().split('T')[0],
  supplier: '',
  category: '',
  subcategory: '',
  description: '',
  amount: '',
  currency: advanceCurrency || currency, // Prefer advance's currency, fallback to user's base currency
  documentStatus: 'Belgeli', // Default: Belgeli
  attachedFile: null,
  // NEW: Payment method fields
  paymentMethod: 'cash', // Default: cash (nakit)
  creditCardId: null, // Selected company credit card ID
  bankTransfer: {
    recipientName: '',
    bankName: '',
    transferDescription: ''
  },
  // NEW: Cost center fields
  costCenterType: '', // 'project' or 'general_expense'
  costCenterId: '' // Project ID or General Expense Type ID
});

const AdvanceClosingDetail = () => {
  const { user } = useAuth();
  const { requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [advanceRequest, setAdvanceRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userBaseCurrency, setUserBaseCurrency] = useState('TRY'); // User's base currency
  const [allowedCurrencies, setAllowedCurrencies] = useState(['TRY', 'USD', 'EUR']); // User's allowed currencies (base + extras)
  const [expenseLines, setExpenseLines] = useState([]); // Start empty, will be populated after currency is fetched
  const [processing, setProcessing] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState({}); // Store converted amounts for each expense line
  
  // Dynamic dropdown data
  const [suppliers, setSuppliers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [companyCreditCards, setCompanyCreditCards] = useState([]); // NEW: Company credit cards
  const [projects, setProjects] = useState([]); // NEW: Projects for cost center
  const [expenseTypes, setExpenseTypes] = useState([]); // NEW: General expense types for cost center
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewSubcategoryModal, setShowNewSubcategoryModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState('');
  const [currentLineId, setCurrentLineId] = useState(null);
  
  // File upload states
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false); // Track file upload status
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialExpenseLines, setInitialExpenseLines] = useState([]);
  
  // Confirmation modal for unsaved changes
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Image zoom and pan states
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Check if this is a read-only view (MUST be after advanceRequest useState)
  // Read-only: closed/approved advances
  // Editable: draft, rejected (editable_by_owner), paid (not yet submitted)
  const isReadOnly = React.useMemo(() => {
    if (location.state?.fromClosedAdvances) return true;
    
    // Rejected requests are editable
    const status = advanceRequest?.status;
    const closingStatus = advanceRequest?.closing_status;
    const editableByOwner = advanceRequest?.editable_by_owner;
    
    if (status === 'rejected' || closingStatus === 'rejected') {
      return !editableByOwner; // If marked as editable_by_owner, allow editing
    }
    
    // Approved/closed are read-only
    if (status === 'approved' || status === 'closed' || closingStatus === 'approved' || closingStatus === 'closed') {
      return true;
    }
    
    return false;
  }, [location.state, advanceRequest]);

  // Initialize with one empty expense line and fetch dropdown data
  useEffect(() => {
    setExpenseLines([createEmptyExpenseLine()]);
    fetchDropdownData();
  }, []);

  // Clear any potential cached data on component mount AND unmount
  React.useEffect(() => {
    // Clear any localStorage that might interfere
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('expense') || key.includes('advance') || key.includes('test')) {
        localStorage.removeItem(key);
      }
    });

    // Cleanup on unmount
    return () => {
      // Clear state when leaving the component
      setExpenseLines([createEmptyExpenseLine()]);
      // Force garbage collection
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    };
  }, [requestId]);


  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [suppliersRes, categoriesRes, creditCardsRes, projectsRes, expenseTypesRes] = await Promise.all([
        axios.get(`${API}/suppliers`),
        axios.get(`${API}/harcama-kategorileri`),  // ✅ YENİ: Harcama Kategorileri modülü ile senkronize
        axios.get(`${API}/credit-cards`),  // ✅ Değiştirildi: company-credit-cards → credit-cards (Hem bireysel hem kurumsal kartlar)
        axios.get(`${API}/cost-centers/projects`),
        axios.get(`${API}/cost-centers/expense-types`)
      ]);
      
      // Backend response formatını kontrol et ve güvenli array set et
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : (suppliersRes.data?.data || []));
      setExpenseCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data?.data || []));
      // Backend {success: true, cards: [...]} formatında döndürüyor
      const cardsData = creditCardsRes.data?.cards || creditCardsRes.data;
      setCompanyCreditCards(Array.isArray(cardsData) ? cardsData : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.data || []));
      setExpenseTypes(Array.isArray(expenseTypesRes.data) ? expenseTypesRes.data : (expenseTypesRes.data?.data || []));
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      // Hata durumunda boş arrayler set et
      setSuppliers([]);
      setExpenseCategories([]);
      setCompanyCreditCards([]);
      setProjects([]);
      setExpenseTypes([]);
    }
  };

  // Fetch saved expenses for this advance request
  const fetchSavedExpenses = async (currency = 'TRY') => {
    try {
      // Check if we're being told to force reload from backend
      const forceReload = location.state?.forceReload;
      
      if (!forceReload) {
        // First check if we have preserved expense lines from navigation
        const preservedExpenseLines = location.state?.preservedExpenseLines;
        if (preservedExpenseLines && preservedExpenseLines.length > 0) {
          setExpenseLines(preservedExpenseLines);
          toast.success('Çalışmakta olan harcamalar geri yüklendi');
          return;
        }
      }

      // Always fetch from backend (fresh data)
      const response = await axios.get(`${API}/advance-expenses/${requestId}`);
      
      if (response.data && response.data.length > 0) {
        // Ensure all expenses have payment method fields
        const normalizedExpenses = response.data.map(expense => {
          // Handle bank transfer details - convert snake_case to camelCase
          let bankTransfer = {
            recipientName: '',
            bankName: '',
            transferDescription: ''
          };
          
          if (expense.bank_transfer_details) {
            bankTransfer = {
              recipientName: expense.bank_transfer_details.recipient_name || '',
              bankName: expense.bank_transfer_details.bank_name || '',
              transferDescription: expense.bank_transfer_details.transfer_description || ''
            };
          } else if (expense.bankTransfer) {
            bankTransfer = expense.bankTransfer;
          }
          
          return {
            ...expense,
            paymentMethod: expense.payment_method || expense.paymentMethod || 'cash',
            creditCardId: expense.credit_card_id || expense.creditCardId || null,
            bankTransfer: bankTransfer,
            // NEW: Cost center normalization
            costCenterType: expense.cost_center_type || expense.costCenterType || '',
            costCenterId: expense.cost_center_id || expense.costCenterId || ''
          };
        });
        
        // Use data as-is - backend already handles test data filtering
        setExpenseLines(normalizedExpenses);
        setInitialExpenseLines(JSON.parse(JSON.stringify(normalizedExpenses))); // Deep copy for comparison
        setHasUnsavedChanges(false);
        
        // Trigger currency conversions for all loaded expenses
        response.data.forEach(line => {
          if (line.amount && line.currency) {
            convertExpenseAmount(line.id, line.amount, line.currency);
          }
        });
        
        const message = location.state?.message || 'Kaydedilmiş harcamalar yüklendi';
        toast.success(message);
      } else {
        // No saved expenses, force clean start with single empty line (use advance's currency)
        const emptyLine = [createEmptyExpenseLine(currency)];
        setExpenseLines(emptyLine);
        setInitialExpenseLines(JSON.parse(JSON.stringify(emptyLine)));
        setHasUnsavedChanges(false);
        if (forceReload) {
          toast.info('Henüz kaydedilmiş harcama bulunmuyor - temiz sayfa yüklendi');
        }
      }
    } catch (error) {
      console.error('Error fetching saved expenses:', error);
      // If error, keep default empty expense line with advance's currency
      setExpenseLines([createEmptyExpenseLine(currency)]);
    }
  };

  // Fetch advance request details
  useEffect(() => {
    const fetchAdvanceRequest = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/advance-requests/paid`);
        const request = response.data.find(r => r.id === requestId);
        
        if (!request) {
          console.log('Request not found in paid advances, searching in other types...');
          let foundRequest = null;
          
          try {
            // Search in approved advances
            const approvedResponse = await axios.get(`${API}/advance-requests/approved`);
            foundRequest = approvedResponse.data.find(r => r.id === requestId);
            console.log('Searched in approved advances:', foundRequest ? 'FOUND' : 'NOT FOUND');
            
            if (!foundRequest) {
              // Search in pending advances
              const pendingResponse = await axios.get(`${API}/advance-requests/pending`);
              foundRequest = pendingResponse.data.find(r => r.id === requestId);
              console.log('Searched in pending advances:', foundRequest ? 'FOUND' : 'NOT FOUND');
            }
            
          } catch (searchError) {
            console.error('Error searching in other advance types:', searchError);
          }
          
          if (!foundRequest) {
            // Last resort: use universal search endpoint
            console.log('Trying universal search endpoint...');
            try {
              const universalResponse = await axios.get(`${API}/advance-requests/${requestId}/details`);
              foundRequest = universalResponse.data;
              console.log('Found via universal search:', foundRequest);
            } catch (universalError) {
              console.error('Universal search also failed:', universalError);
            }
          }
          
          if (!foundRequest) {
            console.error(`CRITICAL: Advance ${requestId} not found in any category!`);
            
            // Check if we have advance data from navigation state (backup)
            const backupAdvanceData = location.state?.advanceData;
            if (backupAdvanceData) {
              console.log('Using backup advance data from navigation state:', backupAdvanceData);
              setAdvanceRequest(backupAdvanceData);
              toast.success('Avans bilgileri navigation state\'ten yüklendi');
            } else {
              // Create a mock advance request to prevent ComingSoon page
              const mockAdvance = {
                id: requestId,
                advance_number: `Mock-${requestId.slice(-8)}`,
                requester_name: 'Unknown User',
                amount: 0,
                approved_amount: 0,
                currency: 'TRY',
                status: 'unknown'
              };
              console.log('Creating mock advance to prevent ComingSoon:', mockAdvance);
              setAdvanceRequest(mockAdvance);
              toast.warning('Avans bilgileri bulunamadı - mock veri ile devam ediliyor');
            }
          } else {
            console.log('Found request:', foundRequest);
            setAdvanceRequest(foundRequest);
          }
        } else {
          console.log('Found request in paid advances:', request);
          setAdvanceRequest(request);
        }
        await fetchDropdownData();
        
        // Skip automatic cleanup to avoid deleting legitimate data
        console.log('Skipping auto cleanup to preserve legitimate data');
        
        // Currency will be determined after advanceRequest is set
        // We'll fetch expenses in a separate useEffect when advanceRequest changes
        
        // Clear navigation state after using it
        if (location.state) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (error) {
        console.error('Error fetching advance request:', error);
        toast.error('Avans bilgileri alınırken hata oluştu');
        navigate('/dashboard/closing');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchAdvanceRequest();
    }
  }, [requestId, navigate]);

  // Fetch user's base currency and allowed currencies
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/users/${user?.id}/settings/currencies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const baseCurrency = response.data?.baseCurrency || 'TRY';
        const allowed = response.data?.allowedCurrencies || ['TRY'];
        setUserBaseCurrency(baseCurrency);
        setAllowedCurrencies(allowed);
        console.log('✅ User base currency:', baseCurrency);
        console.log('✅ User allowed currencies:', allowed);
      } catch (error) {
        console.error('❌ Error fetching user currency:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
        setUserBaseCurrency('TRY'); // Fallback
        setAllowedCurrencies(['TRY']); // Fallback to only base currency
      }
    };
    
    if (user?.id) {
      fetchUserCurrency();
    }
  }, [user?.id]);

  // Fetch saved expenses when advanceRequest is loaded
  useEffect(() => {
    if (advanceRequest && requestId && advanceRequest.id === requestId) {
      // Use advance's original currency for new expense lines
      const currency = advanceRequest.currency || userBaseCurrency;
      console.log('Advance loaded, fetching expenses with currency:', currency);
      fetchSavedExpenses(currency);
    }
  }, [advanceRequest?.id, requestId, advanceRequest?.currency, userBaseCurrency]); // Added advanceRequest?.currency dependency

  // Add new expense line
  const addExpenseLine = () => {
    // Use advance's original currency, fallback to user's base currency
    const advanceCurrency = advanceRequest?.currency;
    setExpenseLines([...expenseLines, createEmptyExpenseLine(userBaseCurrency, advanceCurrency)]);
  };

  // Remove expense line
  const removeExpenseLine = (id) => {
    if (expenseLines.length > 1) {
      setExpenseLines(expenseLines.filter(line => line.id !== id));
    }
  };

  // Update expense line
  const updateExpenseLine = (id, field, value) => {
    setExpenseLines(prevLines => 
      prevLines.map(line => {
        if (line.id === id) {
          // Handle nested objects (e.g., bankTransfer)
          if (field === 'bankTransfer') {
            return { ...line, bankTransfer: { ...line.bankTransfer, ...value } };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Convert expense amount to advance currency
  const convertExpenseAmount = async (lineId, amount, fromCurrency) => {
    // If amount is empty or 0, don't convert
    if (!amount || parseFloat(amount) === 0) {
      setConvertedAmounts(prev => ({ ...prev, [lineId]: null }));
      return;
    }
    
    const advanceCurrency = advanceRequest?.currency;
    
    // If same currency, no conversion needed
    if (fromCurrency === advanceCurrency) {
      setConvertedAmounts(prev => ({ ...prev, [lineId]: null }));
      return;
    }
    
    try {
      const response = await axios.post(`${API}/currency/convert`, {
        amount: parseFloat(amount),
        from_currency: fromCurrency,
        to_currency: advanceCurrency
      });
      
      setConvertedAmounts(prev => ({
        ...prev,
        [lineId]: {
          amount: response.data.converted_amount,
          currency: advanceCurrency,
          rate: response.data.exchange_rate
        }
      }));
    } catch (error) {
      console.error('Currency conversion error:', error);
      // If conversion fails, clear converted amount
      setConvertedAmounts(prev => ({ ...prev, [lineId]: null }));
    }
  };
  
  // Update expense line with currency conversion
  const updateExpenseLineWithConversion = (id, field, value) => {
    updateExpenseLine(id, field, value);
    
    // If amount or currency changed, trigger conversion
    const line = expenseLines.find(l => l.id === id);
    if (field === 'amount' || field === 'currency') {
      const amount = field === 'amount' ? value : line?.amount;
      const currency = field === 'currency' ? value : line?.currency;
      
      if (amount && currency) {
        convertExpenseAmount(id, amount, currency);
      }
    }
  };


  // Handle file attachment
  const handleFileAttachment = async (lineId, event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type (images and PDFs allowed)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Sadece resim ve PDF dosyaları yüklenebilir');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      try {
        setUploadingFile(true); // Disable all buttons
        toast.loading('Belge yükleniyor...', { id: 'file-upload' });
        
        // Upload file to server
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API}/upload-expense-file`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        // Use new S3 response format
        const fileData = {
          file_id: response.data.file_id,
          name: response.data.name,
          type: response.data.type,
          size: response.data.size,
          s3_key: response.data.s3_key,
          url: response.data.url  // Pre-signed S3 URL
        };

        // Update BOTH attachedFile AND documentStatus in ONE update
        setExpenseLines(prevLines => 
          prevLines.map(line => 
            line.id === lineId 
              ? { ...line, attachedFile: fileData, documentStatus: 'Belgeli' }
              : line
          )
        );
        
        toast.success('Belge AWS S3\'e yüklendi', { id: 'file-upload' });
        
        console.log('File uploaded to S3:', {
          lineId,
          fileName: fileData.name,
          s3_key: fileData.s3_key,
          hasUrl: !!fileData.url
        });
        
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('Dosya yüklenirken hata oluştu', { id: 'file-upload' });
      } finally {
        setUploadingFile(false); // Re-enable all buttons
      }
    }
  };

  // Remove file attachment
  const removeFileAttachment = (lineId) => {
    // No need to revoke URL anymore since it's a server URL
    // Update both attachedFile AND documentStatus
    updateExpenseLine(lineId, 'attachedFile', null);
    updateExpenseLine(lineId, 'documentStatus', 'Belgesiz');
    toast.success('Dosya kaldırıldı');
  };

  // Preview file
  const previewFileAttachment = async (fileData) => {
    // Ensure file data has required fields
    if (!fileData) {
      console.error('No file data provided');
      return;
    }
    
    // Get fresh presigned URL
    toast.loading('Belge yükleniyor...', { id: 'file-preview' });
    const freshUrl = await getFreshPresignedUrl(fileData, 900); // 15 min
    toast.dismiss('file-preview');
    
    if (!freshUrl) {
      toast.error('Belge URL\'si oluşturulamadı');
      return;
    }
    
    // Add default values for missing fields
    const safeFileData = {
      name: fileData.name || fileData.original_filename || 'Bilinmeyen dosya',
      type: fileData.type || fileData.content_type || 'application/octet-stream',
      url: freshUrl,
      ...fileData
    };
    
    setPreviewFile(safeFileData);
    setShowFilePreview(true);
    // Reset zoom and pan
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Image zoom and pan functions
  const handleImageWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(3, imageScale + delta));
    setImageScale(newScale);
  };

  const handleImageMouseDown = (e) => {
    if (imageScale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleImageMouseMove = (e) => {
    if (isDragging && imageScale > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleImageMouseUp = () => {
    setIsDragging(false);
  };

  const resetImageView = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    const newScale = Math.min(3, imageScale + 0.2);
    setImageScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(0.5, imageScale - 0.2);
    setImageScale(newScale);
    if (newScale === 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // Create new supplier
  const createNewSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    try {
      const response = await axios.post(`${API}/suppliers`, {
        name: newSupplierName.trim()
      });
      
      const newSupplier = response.data;
      setSuppliers([...suppliers, newSupplier]);
      
      // Update current line with new supplier
      if (currentLineId) {
        updateExpenseLine(currentLineId, 'supplier', newSupplier.name);
      }
      
      setNewSupplierName('');
      setShowNewSupplierModal(false);
      setCurrentLineId(null);
      toast.success('Yeni tedarikçi eklendi');
    } catch (error) {
      toast.error('Tedarikçi eklenirken hata oluştu');
    }
  };

  // Create new expense category
  const createNewExpenseCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await axios.post(`${API}/harcama-kategorileri`, {
        name: newCategoryName.trim(),
        subcategories: []
      });
      
      // Backend response.data içinde {id, message} döner, kategoriyi refetch edelim
      const categoryId = response.data.id;
      
      // Yeni kategoriyi listeye ekle
      const newCategory = {
        id: categoryId,
        name: newCategoryName.trim(),
        subcategories: []
      };
      
      setExpenseCategories([...expenseCategories, newCategory]);
      
      // Update current line with new category
      if (currentLineId) {
        updateExpenseLine(currentLineId, 'category', newCategory.name);
      }
      
      setNewCategoryName('');
      setShowNewCategoryModal(false);
      setCurrentLineId(null);
      toast.success('Yeni kategori eklendi');
    } catch (error) {
      console.error('Kategori eklenirken hata:', error);
      toast.error('Kategori eklenirken hata oluştu');
    }
  };

  // Create new subcategory
  const createNewSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryForSubcategory) return;
    
    try {
      const category = expenseCategories.find(cat => cat.name === selectedCategoryForSubcategory);
      if (!category) return;
      
      await axios.post(`${API}/harcama-kategorileri/${category.id}/subcategories`, {
        name: newSubcategoryName.trim()
      });
      
      // Backend'den yeni subcategory objesi döner: {id: "uuid", name: "..."}
      // Update local state
      const newSubcategoryObj = {
        id: Date.now().toString(), // Geçici ID, refetch ile güncellenecek
        name: newSubcategoryName.trim()
      };
      
      const updatedCategories = expenseCategories.map(cat => 
        cat.id === category.id 
          ? { 
              ...cat, 
              subcategories: [...(cat.subcategories || []), newSubcategoryObj] 
            }
          : cat
      );
      setExpenseCategories(updatedCategories);
      
      // Update current line with new subcategory
      if (currentLineId) {
        updateExpenseLine(currentLineId, 'subcategory', newSubcategoryName.trim());
      }
      
      setNewSubcategoryName('');
      setSelectedCategoryForSubcategory('');
      setShowNewSubcategoryModal(false);
      setCurrentLineId(null);
      toast.success('Yeni alt kategori eklendi');
    } catch (error) {
      toast.error('Alt kategori eklenirken hata oluştu');
    }
  };

  // Validate expense line - all fields required
  const isExpenseLineValid = (line) => {
    return (
      line.date &&
      line.supplier &&
      line.category &&
      line.subcategory &&
      line.description &&
      line.amount &&
      parseFloat(line.amount) > 0 &&
      line.currency &&
      line.documentStatus &&
      // If documentStatus is "Belgeli", file is required
      (line.documentStatus === 'Belgesiz' || line.attachedFile)
    );
  };

  // Check if all expense lines are valid
  const areAllExpenseLinesValid = () => {
    return expenseLines.length > 0 && expenseLines.every(line => isExpenseLineValid(line));
  };

  // Calculate totals (in advance currency)
  const totalExpenses = expenseLines.reduce((sum, line) => {
    const amount = parseFloat(line.amount) || 0;
    
    // If line has converted amount (different currency), use that
    if (convertedAmounts[line.id]) {
      return sum + convertedAmounts[line.id].amount;
    }
    
    // If same currency as advance, use original amount
    return sum + amount;
  }, 0);

  const remainingBalance = (advanceRequest?.approved_amount || 0) - totalExpenses;

  // Format currency
  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'TRY': '₺',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'AFN': '؋',
      'ALL': 'L',
      'AMD': '֏',
      'ANG': 'ƒ',
      'AOA': 'Kz',
      'ARS': '$',
      'AUD': 'A$',
      'AWG': 'ƒ',
      'AZN': '₼',
      'BAM': 'KM',
      'BBD': '$',
      'BDT': '৳',
      'BGN': 'лв',
      'BHD': '.د.ب',
      'BIF': 'FBu',
      'BMD': '$',
      'BND': '$',
      'BOB': 'Bs.',
      'BRL': 'R$',
      'BSD': '$',
      'BTN': 'Nu.',
      'BWP': 'P',
      'BYN': 'Br',
      'BZD': 'BZ$',
      'CAD': 'C$',
      'CDF': 'FC',
      'CHF': 'CHF',
      'CLP': '$',
      'CNY': '¥',
      'COP': '$',
      'CRC': '₡',
      'CUP': '₱',
      'CVE': '$',
      'CZK': 'Kč',
      'DJF': 'Fdj',
      'DKK': 'kr',
      'DOP': 'RD$',
      'DZD': 'دج',
      'EGP': '£',
      'ERN': 'Nfk',
      'ETB': 'Br',
      'FJD': '$',
      'FKP': '£',
      'FOK': 'kr',
      'GEL': '₾',
      'GGP': '£',
      'GHS': '₵',
      'GIP': '£',
      'GMD': 'D',
      'GNF': 'FG',
      'GTQ': 'Q',
      'GYD': '$',
      'HKD': 'HK$',
      'HNL': 'L',
      'HRK': 'kn',
      'HTG': 'G',
      'HUF': 'Ft',
      'IDR': 'Rp',
      'ILS': '₪',
      'IMP': '£',
      'INR': '₹',
      'IQD': 'ع.د',
      'IRR': '﷼',
      'ISK': 'kr',
      'JEP': '£',
      'JMD': 'J$',
      'JOD': 'JD',
      'JPY': '¥',
      'KES': 'KSh',
      'KGS': 'лв',
      'KHR': '៛',
      'KID': '$',
      'KMF': 'CF',
      'KRW': '₩',
      'KWD': 'KD',
      'KYD': '$',
      'KZT': '₸',
      'LAK': '₭',
      'LBP': '£',
      'LKR': '₨',
      'LRD': '$',
      'LSL': 'M',
      'LYD': 'LD',
      'MAD': 'MAD',
      'MDL': 'lei',
      'MGA': 'Ar',
      'MKD': 'ден',
      'MMK': 'K',
      'MNT': '₮',
      'MOP': 'MOP$',
      'MRU': 'UM',
      'MUR': '₨',
      'MVR': 'Rf',
      'MWK': 'MK',
      'MXN': '$',
      'MYR': 'RM',
      'MZN': 'MT',
      'NAD': '$',
      'NGN': '₦',
      'NIO': 'C$',
      'NOK': 'kr',
      'NPR': '₨',
      'NZD': 'NZ$',
      'OMR': '﷼',
      'PAB': 'B/.',
      'PEN': 'S/.',
      'PGK': 'K',
      'PHP': '₱',
      'PKR': '₨',
      'PLN': 'zł',
      'PYG': 'Gs',
      'QAR': '﷼',
      'RON': 'lei',
      'RSD': 'Дин.',
      'RUB': '₽',
      'RWF': 'R₣',
      'SAR': '﷼',
      'SBD': '$',
      'SCR': '₨',
      'SDG': 'ج.س.',
      'SEK': 'kr',
      'SGD': 'S$',
      'SHP': '£',
      'SLE': 'Le',
      'SLL': 'Le',
      'SOS': 'S',
      'SRD': '$',
      'SSP': '£',
      'STN': 'Db',
      'SYP': '£',
      'SZL': 'E',
      'THB': '฿',
      'TJS': 'SM',
      'TMT': 'T',
      'TND': 'د.ت',
      'TOP': 'T$',
      'TTD': 'TT$',
      'TVD': '$',
      'TWD': 'NT$',
      'TZS': 'TSh',
      'UAH': '₴',
      'UGX': 'USh',
      'UYU': '$U',
      'UZS': 'лв',
      'VES': 'Bs.',
      'VND': '₫',
      'VUV': 'VT',
      'WST': 'WS$',
      'XAF': 'FCFA',
      'XCD': '$',
      'XDR': 'XDR',
      'XOF': 'CFA',
      'XPF': '₣',
      'YER': '﷼',
      'ZAR': 'R',
      'ZMW': 'ZK',
      'ZWL': 'Z$'
    };
    return symbols[currency] || currency;
  };

  const formatCurrency = (amount, currency) => {
    const symbol = getCurrencySymbol(currency);
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${symbol}`;
  };

  // Save expenses (without closing)
  const handleSave = async () => {
    try {
      setProcessing(true);
      
      // Validate expense lines
      const validExpenses = expenseLines.filter(line => 
        line.amount && parseFloat(line.amount) > 0
      );
      
      if (validExpenses.length === 0) {
        toast.error('En az bir geçerli harcama satırı ekleyin');
        return;
      }

      // Validate cost center selection (mandatory)
      const missingCostCenter = validExpenses.find(line => 
        !line.costCenterType || !line.costCenterId
      );
      
      if (missingCostCenter) {
        toast.error('Her harcama için bir masraf merkezi (Proje veya Genel Gider Türü) seçmelisiniz');
        return;
      }

      // Log before sending to see what we're sending
      console.log('=== SAVING EXPENSES ===');
      validExpenses.forEach((line, idx) => {
        console.log(`Line ${idx}:`, {
          documentStatus: line.documentStatus,
          attachedFile: line.attachedFile,
          hasUrl: !!line.attachedFile?.url
        });
      });
      
      const expenseData = {
        advance_request_id: requestId,
        expenses: validExpenses.map(line => ({
          date: line.date,
          supplier: line.supplier,
          category: line.category,
          subcategory: line.subcategory,
          description: line.description,
          amount: parseFloat(line.amount),
          currency: line.currency,
          document_status: line.documentStatus,
          attached_file: line.attachedFile ? {
            name: line.attachedFile.name,
            type: line.attachedFile.type,
            url: line.attachedFile.url
          } : null,
          // NEW: Payment method fields
          payment_method: line.paymentMethod || 'cash',
          credit_card_id: line.paymentMethod === 'credit_card' ? line.creditCardId : null,
          bank_transfer_details: line.paymentMethod === 'bank_transfer' ? {
            recipient_name: line.bankTransfer?.recipientName || '',
            bank_name: line.bankTransfer?.bankName || '',
            transfer_description: line.bankTransfer?.transferDescription || ''
          } : null,
          // NEW: Cost center fields
          cost_center_type: line.costCenterType,
          cost_center_id: line.costCenterId
        }))
      };

      console.log('Sending to backend:', JSON.stringify(expenseData, null, 2));
      await axios.post(`${API}/advance-expenses`, expenseData);
      
      toast.success('Harcamalar kaydedildi');
      setHasUnsavedChanges(false);
      
      // Immediately fetch fresh data from backend to ensure sync
      setTimeout(async () => {
        try {
          const response = await axios.get(`${API}/advance-expenses/${requestId}`);
          if (response.data && response.data.length > 0) {
            // Normalize data to ensure consistent field names
            const normalizedExpenses = response.data.map(expense => {
              // Handle bank transfer details - convert snake_case to camelCase
              let bankTransfer = {
                recipientName: '',
                bankName: '',
                transferDescription: ''
              };
              
              if (expense.bank_transfer_details) {
                bankTransfer = {
                  recipientName: expense.bank_transfer_details.recipient_name || '',
                  bankName: expense.bank_transfer_details.bank_name || '',
                  transferDescription: expense.bank_transfer_details.transfer_description || ''
                };
              } else if (expense.bankTransfer) {
                bankTransfer = expense.bankTransfer;
              }
              
              return {
                ...expense,
                paymentMethod: expense.payment_method || expense.paymentMethod || 'cash',
                creditCardId: expense.credit_card_id || expense.creditCardId || null,
                bankTransfer: bankTransfer,
                // NEW: Cost center normalization
                costCenterType: expense.cost_center_type || expense.costCenterType || '',
                costCenterId: expense.cost_center_id || expense.costCenterId || ''
              };
            });
            
            setExpenseLines(normalizedExpenses);
            setInitialExpenseLines(JSON.parse(JSON.stringify(normalizedExpenses)));
            console.log('Fresh data loaded after save:', normalizedExpenses);
          }
        } catch (error) {
          console.error('Error refreshing after save:', error);
        }
      }, 500); // Small delay to ensure backend processing is complete
      
    } catch (error) {
      console.error('Error saving expenses:', error);
      toast.error(error.response?.data?.detail || 'Kaydetme sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Save and close advance
  const handleSaveAndClose = async () => {
    try {
      setProcessing(true);
      
      // Validate expense lines
      const validExpenses = expenseLines.filter(line => 
        line.amount && parseFloat(line.amount) > 0
      );
      
      if (validExpenses.length === 0) {
        toast.error('En az bir geçerli harcama satırı ekleyin');
        return;
      }

      // Validate cost center selection (mandatory)
      const missingCostCenter = validExpenses.find(line => 
        !line.costCenterType || !line.costCenterId
      );
      
      if (missingCostCenter) {
        toast.error('Her harcama için bir masraf merkezi (Proje veya Genel Gider Türü) seçmelisiniz');
        return;
      }
      
      // Log before sending to see what we're sending
      console.log('=== SAVING AND CLOSING EXPENSES ===');
      validExpenses.forEach((line, idx) => {
        console.log(`Line ${idx}:`, {
          documentStatus: line.documentStatus,
          attachedFile: line.attachedFile,
          hasUrl: !!line.attachedFile?.url
        });
      });

      // STEP 1: Save expenses first
      console.log('STEP 1: Saving expenses...');
      const expenseData = {
        advance_request_id: requestId,
        expenses: validExpenses.map(line => ({
          date: line.date,
          supplier: line.supplier,
          category: line.category,
          subcategory: line.subcategory,
          description: line.description,
          amount: parseFloat(line.amount),
          currency: line.currency,
          document_status: line.documentStatus,
          attached_file: line.attachedFile ? {
            name: line.attachedFile.name,
            type: line.attachedFile.type,
            url: line.attachedFile.url,
            s3_key: line.attachedFile.s3_key || line.attachedFile.path
          } : null,
          // NEW: Payment method fields
          payment_method: line.paymentMethod || 'cash',
          credit_card_id: line.paymentMethod === 'credit_card' ? line.creditCardId : null,
          bank_transfer_details: line.paymentMethod === 'bank_transfer' ? {
            recipient_name: line.bankTransfer?.recipientName || '',
            bank_name: line.bankTransfer?.bankName || '',
            transfer_description: line.bankTransfer?.transferDescription || ''
          } : null,
          // NEW: Cost center fields
          cost_center_type: line.costCenterType,
          cost_center_id: line.costCenterId
        }))
      };

      console.log('Sending to backend (Save):', JSON.stringify(expenseData, null, 2));
      
      try {
        const saveResponse = await axios.post(`${API}/advance-expenses`, expenseData);
        console.log('✅ Save successful:', saveResponse.data);
        toast.success('Harcamalar kaydedildi');
      } catch (saveError) {
        console.error('❌ Save failed:', saveError);
        throw new Error('Harcamalar kaydedilemedi: ' + (saveError.response?.data?.detail || saveError.message));
      }
      
      // STEP 2: Then close the advance (only if save succeeded)
      console.log('STEP 2: Closing advance...');
      const closingData = {
        notes: `Avans kapatıldı. Toplam harcama: ${formatCurrency(totalExpenses, 'TRY')}`,
        total_expenses: totalExpenses,
        remaining_balance: remainingBalance
      };

      try {
        const closeResponse = await axios.post(`${API}/advance-requests/${requestId}/close`, closingData);
        console.log('✅ Close successful:', closeResponse.data);
      } catch (closeError) {
        console.error('❌ Close failed:', closeError);
        throw new Error('Kapatma işlemi başarısız: ' + (closeError.response?.data?.detail || closeError.message));
      }
      
      // Success - both save and close completed
      toast.success('✅ Harcamalar kaydedildi ve avans kapatıldı');
      navigate('/dashboard/closing');
      
    } catch (error) {
      console.error('❌ Error in save and close:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Specific error messages
      if (error.response?.status === 400) {
        toast.error('Kaydetme hatası: ' + (error.response?.data?.detail || 'Geçersiz veri'));
      } else if (error.response?.status === 404) {
        toast.error('Avans talebi bulunamadı');
      } else {
        toast.error(error.response?.data?.detail || 'İşlem sırasında hata oluştu. Lütfen konsol loglarını kontrol edin.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Submit for finance approval (initial or resubmit after rejection)
  const handleSubmitForApproval = async () => {
    try {
      setProcessing(true);
      
      // Validate: check if there are saved expenses
      if (expenseLines.length === 0) {
        toast.error('En az bir harcama kalemi girmelisiniz');
        return;
      }
      
      // Check if there are unsaved changes
      if (hasUnsavedChanges) {
        toast.error('Önce değişiklikleri kaydedin');
        return;
      }
      
      // Submit for finance approval
      await axios.post(`${API}/advance-closing/${requestId}/submit`);
      
      toast.success('Talep finans onayına gönderildi');
      
      // Refresh to show updated status
      await fetchAdvanceRequest();
      
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast.error(error.response?.data?.detail || 'Talep gönderilirken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600">Avans bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (!advanceRequest) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Avans Talebi Bulunamadı</h2>
          <p className="text-gray-600 mb-2">Aradığınız avans talebi sistemde bulunmuyor.</p>
          <p className="text-sm text-gray-500">ID: {requestId}</p>
        </div>
        <div className="space-x-4">
          <Button onClick={() => navigate('/dashboard/closing')} className="mt-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Avans Listesine Dön
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Sayfayı Yenile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="advance-closing-detail-page">

      {/* Rejection Warning Banner */}
      {advanceRequest.closing_status === 'rejected' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">
                Finans Tarafından Reddedildi {advanceRequest.last_rejection_at && `(${new Date(advanceRequest.last_rejection_at).toLocaleDateString('tr-TR')})`}
              </p>
              {advanceRequest.last_rejection_reason && (
                <p className="mt-1 text-sm text-red-700">
                  <strong>Gerekçe:</strong> {advanceRequest.last_rejection_reason}
                </p>
              )}
              {advanceRequest.closing_revision > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  Revizyon: {advanceRequest.closing_revision}
                </p>
              )}
            </div>
          </div>
          {!isReadOnly && (
            <div className="mt-3">
              <Button
                onClick={handleSubmitForApproval}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
                disabled={hasUnsavedChanges}
              >
                <SendIcon className="w-4 h-4 mr-2" />
                Düzelt ve Finans Onayına Tekrar Gönder
              </Button>
              {hasUnsavedChanges && (
                <p className="text-xs text-red-600 mt-1">
                  * Önce değişiklikleri kaydedin
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => {
              const fromClosedAdvances = location.state?.fromClosedAdvances;
              
              // Check for unsaved changes (only in edit mode)
              if (!isReadOnly && hasUnsavedChanges) {
                setPendingNavigation(fromClosedAdvances ? 'closed' : 'closing');
                setShowUnsavedModal(true);
                return;
              }
              
              if (fromClosedAdvances) {
                console.log('Returning to closed advances page');
                navigate('/dashboard/closed');
              } else {
                console.log('Returning to advance closing page');
                navigate('/dashboard/closing');
              }
            }}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {location.state?.fromClosedAdvances ? 'Kapanmış Avanslara Dön' : 'Geri'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isReadOnly ? 'Kapanmış Avans Detayları' : 'Harcama Detayları'}
            </h1>
            <p className="text-gray-600 mt-1">
              {advanceRequest.advance_number} - {advanceRequest.requester_name}
              {isReadOnly && <span className="ml-2 text-green-600">✅ Kapatılmış</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className={`grid ${remainingBalance !== 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-6 mb-8`}>
        {/* 1. Paid Advance Amount (Approved Amount) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center bg-green-50">
          <div className="text-sm font-medium text-gray-600 mb-2">ÖDENEN AVANS</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(advanceRequest?.approved_amount || 0, advanceRequest?.currency || 'TRY')}
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">TOPLAM HARCANAN</div>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(totalExpenses, advanceRequest?.currency || 'TRY')}
          </div>
        </div>

        {/* 3. Expense Difference */}
        <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${
          remainingBalance > 0 ? 'bg-orange-50' : remainingBalance < 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className="text-sm font-medium text-gray-600 mb-2">HARCAMA FARKI</div>
          <div className={`text-3xl font-bold ${
            remainingBalance > 0 ? 'text-orange-600' : remainingBalance < 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(remainingBalance), advanceRequest?.currency || 'TRY')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {remainingBalance > 0 ? '(İade Edilecek)' : remainingBalance < 0 ? '(Eksik Kalan)' : '(Dengede)'}
          </div>
        </div>

        {/* 4. Status Box - Only show if there's a difference */}
        {remainingBalance !== 0 && (
          <div className={`rounded-lg border-2 p-6 text-center ${
            remainingBalance < 0 
              ? 'bg-green-600 border-green-700' 
              : 'bg-red-600 border-red-700'
          }`}>
            <div className="text-2xl font-bold text-white mb-2">
              {formatCurrency(Math.abs(remainingBalance), advanceRequest?.currency || 'TRY')}
            </div>
            <div className="text-sm font-medium text-white leading-relaxed">
              {remainingBalance < 0 
                ? 'fazla harcamanız var ve şirketten alacaklısınız' 
                : 'az harcamanız var ve şirkete borçlusunuz'
              }
            </div>
          </div>
        )}
      </div>

      {/* Expense Lines Table */}
      <div className="space-y-4">
        {expenseLines.map((line, index) => (
          <Card key={line.id} className="p-6 bg-white border border-gray-200">
            {/* First Row: Date, Supplier, Category, Subcategory */}
            <div className="grid grid-cols-12 gap-4 mb-4">
              {/* Date */}
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Tarih *</Label>
                <Input
                  type="date"
                  value={line.date}
                  onChange={(e) => updateExpenseLine(line.id, 'date', e.target.value)}
                  className="h-10"
                  required
                />
              </div>

              {/* Supplier */}
              <div className="col-span-3">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Tedarikçi Adı *</Label>
                <select
                  value={line.supplier}
                  onChange={(e) => {
                    if (e.target.value === 'NEW_SUPPLIER') {
                      setCurrentLineId(line.id);
                      setShowNewSupplierModal(true);
                    } else {
                      updateExpenseLine(line.id, 'supplier', e.target.value);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  required
                >
                  <option value="">Seçiniz</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                  ))}
                  <option value="NEW_SUPPLIER" className="text-blue-600">+ Yeni Ekle</option>
                </select>
              </div>

              {/* Category */}
              <div className="col-span-3">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Kategori *</Label>
                <select
                  value={line.category || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    const selectedValue = e.target.value;
                    if (selectedValue === 'NEW_CATEGORY') {
                      setCurrentLineId(line.id);
                      setShowNewCategoryModal(true);
                    } else {
                      updateExpenseLine(line.id, 'category', selectedValue);
                      updateExpenseLine(line.id, 'subcategory', '');
                    }
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seçiniz</option>
                  {expenseCategories.map((category, categoryIndex) => (
                    <option key={`category-${category.id || categoryIndex}`} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                  <option value="NEW_CATEGORY" className="text-blue-600">+ Yeni Ekle</option>
                </select>
              </div>

              {/* Subcategory */}
              <div className="col-span-3">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Alt Kategori *</Label>
                <select
                  value={line.subcategory}
                  onChange={(e) => {
                    if (e.target.value === 'NEW_SUBCATEGORY') {
                      setCurrentLineId(line.id);
                      setSelectedCategoryForSubcategory(line.category);
                      setShowNewSubcategoryModal(true);
                    } else {
                      updateExpenseLine(line.id, 'subcategory', e.target.value);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  disabled={!line.category}
                  required
                >
                  <option value="">Seçiniz</option>
                  {line.category && 
                    expenseCategories
                      .find(cat => cat.name === line.category)
                      ?.subcategories?.map((subcategory, subIndex) => {
                        // Backend'ten {id, name} formatında geliyor
                        const subName = typeof subcategory === 'string' ? subcategory : subcategory.name;
                        const subId = typeof subcategory === 'string' ? subIndex : subcategory.id;
                        return (
                          <option key={`subcategory-${subId}`} value={subName}>
                            {subName}
                          </option>
                        );
                      })
                  }
                  {line.category && (
                    <option value="NEW_SUBCATEGORY" className="text-blue-600">+ Yeni Ekle</option>
                  )}
                </select>
              </div>

              {/* Delete/Add Button */}
              <div className="col-span-1 flex justify-end space-x-1">
                {!location.state?.fromClosedAdvances && (
                  <>
                    {index === expenseLines.length - 1 ? (
                      <>
                        <Button
                          onClick={addExpenseLine}
                          disabled={uploadingFile}
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 h-10 w-10"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                        {expenseLines.length > 1 && (
                          <Button
                            onClick={() => removeExpenseLine(line.id)}
                            disabled={uploadingFile}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-10 w-10"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={() => removeExpenseLine(line.id)}
                        disabled={uploadingFile}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 h-10 w-10"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Second Row: Description, Amount, Currency, Document Status, Attachment */}
            <div className="grid grid-cols-12 gap-4">
              {/* Description */}
              <div className="col-span-5">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Açıklama *</Label>
                <Input
                  value={line.description}
                  onChange={(e) => updateExpenseLine(line.id, 'description', e.target.value)}
                  placeholder="Açıklama giriniz..."
                  className="h-10"
                  required
                />
              </div>

              {/* Amount with Converted Value */}
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Tutar *</Label>
                <AmountInput
                  value={line.amount}
                  onChange={(value) => updateExpenseLineWithConversion(line.id, 'amount', value)}
                  placeholder="0,00"
                  className="h-10"
                  required
                />
                {/* Show converted amount if different currency */}
                {convertedAmounts[line.id] && (
                  <div className="text-xs text-gray-500 mt-1">
                    ≈ {formatCurrency(convertedAmounts[line.id].amount, convertedAmounts[line.id].currency)}
                  </div>
                )}
              </div>

              {/* Currency */}
              <div className="col-span-1">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Birim *</Label>
                <select
                  value={line.currency}
                  onChange={(e) => updateExpenseLineWithConversion(line.id, 'currency', e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  required
                >
                  {allowedCurrencies.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Document Status */}
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Belge</Label>
                <select
                  value={line.documentStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    updateExpenseLine(line.id, 'documentStatus', newStatus);
                    // If "Belgesiz" is selected, remove the attached file
                    if (newStatus === 'Belgesiz' && line.attachedFile) {
                      updateExpenseLine(line.id, 'attachedFile', null);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="Belgeli">Belgeli</option>
                  <option value="Belgesiz">Belgesiz</option>
                </select>
              </div>

              {/* Attachment Button - Only show if "Belgeli" is selected */}
              {line.documentStatus === 'Belgeli' && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Dosya</Label>
                  <div className="flex space-x-1">
                    {!line.attachedFile ? (
                      <>
                        <input
                          type="file"
                          id={`file-input-${line.id}`}
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileAttachment(line.id, e)}
                          disabled={uploadingFile}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 border-dashed border-2"
                          onClick={() => document.getElementById(`file-input-${line.id}`).click()}
                          disabled={uploadingFile}
                        >
                          <PaperclipIcon className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 cursor-pointer"
                          data-preview-eye="true"
                          aria-label="Belgeyi önizle"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          previewFileAttachment(line.attachedFile);
                        }}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFileAttachment(line.id);
                        }}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              )}

              {/* NEW: Cost Center Section */}
              <div className="col-span-12 mt-4 pt-4 border-t border-gray-200">
                <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                  Masraf Merkezi <span className="text-red-500">*</span>
                </Label>
                
                <div className="grid grid-cols-12 gap-4">
                  {/* Project or General Expense Type Selection */}
                  <div className="col-span-6">
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Proje</Label>
                    <select
                      value={line.costCenterType === 'project' ? line.costCenterId : ''}
                      onChange={(e) => {
                        const projectId = e.target.value;
                        setExpenseLines(prevLines => 
                          prevLines.map(l => {
                            if (l.id === line.id) {
                              if (projectId) {
                                return { ...l, costCenterType: 'project', costCenterId: projectId };
                              } else {
                                return { ...l, costCenterType: '', costCenterId: '' };
                              }
                            }
                            return l;
                          })
                        );
                        setHasUnsavedChanges(true);
                      }}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                      disabled={line.costCenterType === 'general_expense' && line.costCenterId}
                    >
                      <option value="">Proje seçiniz...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_name}
                        </option>
                      ))}
                    </select>
                    {projects.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Henüz proje eklenmemiş. Süper Admin ayarlardan proje ekleyebilir.
                      </p>
                    )}
                  </div>

                  <div className="col-span-6">
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Genel Gider Türü</Label>
                    <select
                      value={line.costCenterType === 'general_expense' ? line.costCenterId : ''}
                      onChange={(e) => {
                        const typeId = e.target.value;
                        setExpenseLines(prevLines => 
                          prevLines.map(l => {
                            if (l.id === line.id) {
                              if (typeId) {
                                return { ...l, costCenterType: 'general_expense', costCenterId: typeId };
                              } else {
                                return { ...l, costCenterType: '', costCenterId: '' };
                              }
                            }
                            return l;
                          })
                        );
                        setHasUnsavedChanges(true);
                      }}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                      disabled={line.costCenterType === 'project' && line.costCenterId}
                    >
                      <option value="">Genel gider türü seçiniz...</option>
                      {expenseTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.expense_type_name}
                        </option>
                      ))}
                    </select>
                    {expenseTypes.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Henüz genel gider türü eklenmemiş. Süper Admin ayarlardan ekleyebilir.
                      </p>
                    )}
                  </div>
                </div>

                {!line.costCenterId && (
                  <p className="text-xs text-red-600 mt-2">
                    * Bir proje veya genel gider türü seçmelisiniz (zorunlu)
                  </p>
                )}
              </div>

              {/* NEW: Payment Method Section */}
              <div className="col-span-12 mt-4 pt-4 border-t border-gray-200">
                <Label className="text-sm font-semibold text-gray-800 mb-3 block">Ödeme Yöntemi</Label>
                
                {/* Payment Method Dropdown */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Yöntem</Label>
                    <select
                      value={line.paymentMethod || 'cash'}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        updateExpenseLine(line.id, 'paymentMethod', newMethod);
                        // Reset dependent fields
                        if (newMethod === 'cash') {
                          updateExpenseLine(line.id, 'creditCardId', null);
                          updateExpenseLine(line.id, 'bankTransfer', {
                            recipientName: '',
                            bankName: '',
                            transferDescription: ''
                          });
                        }
                      }}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                    >
                      <option value="cash">Nakit</option>
                      <option value="credit_card">Kredi Kartı</option>
                      <option value="bank_transfer">Banka Transferi</option>
                    </select>
                  </div>

                  {/* Conditional: Credit Card Selection */}
                  {line.paymentMethod === 'credit_card' && (
                    <div className="col-span-8">
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">Kredi Kartı Seç</Label>
                      <select
                        value={line.creditCardId || ''}
                        onChange={(e) => updateExpenseLine(line.id, 'creditCardId', e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                        required
                      >
                        <option value="">Kredi kartı seçiniz...</option>
                        {companyCreditCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {/* Backend'den hazır display_name kullan veya fallback */}
                            {card.display_name || `${card.bank_name || 'Banka'} - ${card.card_holder_name || 'Kart Sahibi'} (••••${card.card_last_4_digits || '****'})`}
                          </option>
                        ))}
                      </select>
                      {companyCreditCards.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Henüz kredi kartı eklenmemiş. Süper Admin ayarlardan kart ekleyebilir.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Conditional: Bank Transfer Details */}
                  {line.paymentMethod === 'bank_transfer' && (
                    <>
                      <div className="col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">Havale Kime Yapıldı</Label>
                        <Input
                          value={line.bankTransfer?.recipientName || ''}
                          onChange={(e) => updateExpenseLine(line.id, 'bankTransfer', {
                            ...line.bankTransfer,
                            recipientName: e.target.value
                          })}
                          placeholder="Ad Soyad"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">Yapılan Banka</Label>
                        <Input
                          value={line.bankTransfer?.bankName || ''}
                          onChange={(e) => updateExpenseLine(line.id, 'bankTransfer', {
                            ...line.bankTransfer,
                            bankName: e.target.value
                          })}
                          placeholder="Banka adı"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="col-span-12 mt-2">
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">Havale Açıklaması</Label>
                        <Textarea
                          value={line.bankTransfer?.transferDescription || ''}
                          onChange={(e) => updateExpenseLine(line.id, 'bankTransfer', {
                            ...line.bankTransfer,
                            transferDescription: e.target.value
                          })}
                          placeholder="Havale ile ilgili ek bilgiler..."
                          className="min-h-[60px]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        {location.state?.fromClosedAdvances ? (
          // Read-only mode for closed advances
          <div className="flex justify-center space-x-4">
            <div className="px-6 py-2 text-sm text-gray-500 flex items-center">
              ✅ Bu avans kapatılmıştır
            </div>
          </div>
        ) : (
          // Normal edit mode
          <>
            <Button
              onClick={handleSave}
              disabled={processing || !areAllExpenseLinesValid() || uploadingFile}
              className="px-6 py-2 font-medium bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingFile ? 'Belge yükleniyor...' : 'Kaydet'}
            </Button>

            <Button
              onClick={() => {
                if (hasUnsavedChanges) {
                  setPendingNavigation('summary');
                  setShowUnsavedModal(true);
                  return;
                }
                navigate(`/dashboard/closing-summary/${requestId}`, {
                  state: {
                    advanceRequest,
                    expenseLines: expenseLines
                      .filter(line => line.amount && parseFloat(line.amount) > 0)
                      .map(line => ({
                        ...line,
                        // Ensure payment method fields are preserved
                        payment_method: line.paymentMethod || line.payment_method || 'cash',
                        credit_card_id: line.creditCardId || line.credit_card_id,
                        bank_transfer_details: line.bankTransfer || line.bank_transfer_details
                      }))
                  }
                });
              }}
              disabled={!areAllExpenseLinesValid() || uploadingFile}
              className="px-6 py-2 font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingFile ? 'Belge yükleniyor...' : 'KAPAMA ÖZETİ'}
            </Button>
            
            <Button
              onClick={handleSaveAndClose}
              disabled={processing || !areAllExpenseLinesValid() || uploadingFile}
              className="px-6 py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'İşleniyor...' : uploadingFile ? 'Belge yükleniyor...' : 'Kaydet ve Avansı Kapat'}
            </Button>
          </>
        )}
      </div>

      {/* New Supplier Modal */}
      <Dialog open={showNewSupplierModal} onOpenChange={setShowNewSupplierModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-supplier-name">Tedarikçi Adı *</Label>
              <Input
                id="new-supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Tedarikçi adını girin..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewSupplierModal(false);
                setNewSupplierName('');
                setCurrentLineId(null);
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={createNewSupplier}
              disabled={!newSupplierName.trim()}
              className="btn-primary"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Category Modal */}
      <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-category-name">Kategori Adı *</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategori adını girin..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewCategoryModal(false);
                setNewCategoryName('');
                setCurrentLineId(null);
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={createNewExpenseCategory}
              disabled={!newCategoryName.trim()}
              className="btn-primary"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Subcategory Modal */}
      <Dialog open={showNewSubcategoryModal} onOpenChange={setShowNewSubcategoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Alt Kategori Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-select">Ana Kategori *</Label>
              <select
                id="category-select"
                value={selectedCategoryForSubcategory}
                onChange={(e) => setSelectedCategoryForSubcategory(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Kategori seçiniz</option>
                {expenseCategories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="new-subcategory-name">Alt Kategori Adı *</Label>
              <Input
                id="new-subcategory-name"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Alt kategori adını girin..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewSubcategoryModal(false);
                setNewSubcategoryName('');
                setSelectedCategoryForSubcategory('');
                setCurrentLineId(null);
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={createNewSubcategory}
              disabled={!newSubcategoryName.trim() || !selectedCategoryForSubcategory}
              className="btn-primary"
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <Dialog open={showFilePreview} onOpenChange={(open) => {
        setShowFilePreview(open);
        if (!open) {
          setPreviewFile(null);
          resetImageView();
        }
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Dosya Önizleme</span>
              {previewFile && previewFile.type && previewFile.type.startsWith('image/') && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    disabled={imageScale <= 0.5}
                  >
                    <ZoomOutIcon className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-500 min-w-[60px] text-center">
                    {Math.round(imageScale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    disabled={imageScale >= 3}
                  >
                    <ZoomInIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetImageView}
                  >
                    <RotateCcwIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewFile && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Dosya: {previewFile.name || 'Bilinmeyen dosya'}
                </p>
                {previewFile.type && previewFile.type.startsWith('image/') ? (
                  previewFile.url ? (
                  <div 
                    className="relative border rounded-lg overflow-hidden bg-gray-50"
                    style={{ height: '500px' }}
                  >
                    <div
                      className="w-full h-full overflow-hidden cursor-move"
                      onWheel={handleImageWheel}
                      onMouseDown={handleImageMouseDown}
                      onMouseMove={handleImageMouseMove}
                      onMouseUp={handleImageMouseUp}
                      onMouseLeave={handleImageMouseUp}
                      style={{
                        cursor: imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                      }}
                    >
                      <img
                        src={previewFile?.url || previewFile?.path || previewFile?.s3_path || previewFile?.name}
                        alt={previewFile?.name || 'Dosya'}
                        className="transition-transform duration-100 select-none"
                        style={{
                          transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                          transformOrigin: 'center center',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                        draggable={false}
                      />
                    </div>
                    {imageScale > 1 && (
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Sürükleyerek hareket ettirin
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Mouse wheel ile zoom yapın
                    </div>
                  </div>
                  ) : (
                    <div className="bg-gray-100 p-8 rounded-lg">
                      <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Dosya URL'si bulunamadı</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Dosya yüklenirken bir hata oluşmuş olabilir.
                      </p>
                    </div>
                  )
                ) : previewFile.type === 'application/pdf' ? (
                  <div className="bg-gray-100 p-8 rounded-lg">
                    <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">PDF Dosyası</p>
                    <p className="text-sm text-gray-500 mt-2">
                      PDF önizlemesi tarayıcınızda desteklenmiyor.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-8 rounded-lg">
                    <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Dosya Önizlemesi</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Bu dosya türü için önizleme desteklenmiyor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFilePreview(false);
                setPreviewFile(null);
                resetImageView();
              }}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Modal */}
      <Dialog open={showUnsavedModal} onOpenChange={setShowUnsavedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Kaydedilmemiş Değişiklikler</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Kaydedilmemiş değişiklikleriniz var. Bu sayfadan ayrılırsanız tüm değişiklikler kaybolacak.
            </p>
            <p className="text-gray-600 mt-3 text-sm">
              Devam etmek istiyor musunuz?
            </p>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsavedModal(false);
                setPendingNavigation(null);
              }}
            >
              İptal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setShowUnsavedModal(false);
                
                // Execute pending navigation
                if (pendingNavigation === 'summary') {
                  navigate(`/dashboard/closing-summary/${requestId}`, {
                    state: {
                      advanceRequest,
                      expenseLines: expenseLines
                        .filter(line => line.amount && parseFloat(line.amount) > 0)
                        .map(line => ({
                          ...line,
                          // Ensure payment method fields are preserved
                          payment_method: line.paymentMethod || line.payment_method || 'cash',
                          credit_card_id: line.creditCardId || line.credit_card_id,
                          bank_transfer_details: line.bankTransfer || line.bank_transfer_details
                        }))
                    }
                  });
                } else if (pendingNavigation === 'closed') {
                  navigate('/dashboard/closed');
                } else if (pendingNavigation === 'closing') {
                  navigate('/dashboard/closing');
                }
                
                setPendingNavigation(null);
              }}
            >
              Değişiklikleri Kaydetmeden Devam Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvanceClosingDetail;