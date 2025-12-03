import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { getFreshPresignedUrl } from '../utils/s3';
import { 
  ArrowLeftIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MessageSquareIcon,
  FileTextIcon,
  CalendarIcon,
  Banknote as BanknoteIcon,
  FolderIcon,
  UserIcon,
  BuildingIcon,
  ImageIcon,
  FileIcon,
  PaperclipIcon,
  SendIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  RefreshCwIcon
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const FinanceApprovalDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [advanceRequest, setAdvanceRequest] = useState(null);
  const [expenseLines, setExpenseLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState({}); // Store converted amounts for each expense line
  const [projects, setProjects] = useState([]); // Cost center projects
  const [expenseTypes, setExpenseTypes] = useState([]); // Cost center expense types
  
  // Modal states (showDocumentModal removed - using showFilePreview instead)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedExpenseIndex, setSelectedExpenseIndex] = useState(null);
  const [questionText, setQuestionText] = useState('');
  
  // Messages/Questions
  const [messages, setMessages] = useState([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  // File Preview states (like AdvanceClosingDetail)
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Reject Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectScope, setRejectScope] = useState('all'); // 'all' or 'lines'
  const [rejecting, setRejecting] = useState(false);

  // Check if user has finance permission
  const hasFinancePermission = () => {
    const userRole = user?.role?.name;
    return ['Super Admin', 'Süper Admin', 'Admin', 'Finans', 'Muhasebe'].includes(userRole);
  };

  useEffect(() => {
    fetchAdvanceDetails();
  }, [requestId]);

  const fetchAdvanceDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch advance request details and cost center data in parallel
      const [advanceResponse, projectsResponse, expenseTypesResponse, expenseResponse] = await Promise.all([
        axios.get(`${API}/api/advance-requests/${requestId}/details`),
        axios.get(`${API}/api/cost-centers/projects`),
        axios.get(`${API}/api/cost-centers/expense-types`),
        axios.get(`${API}/api/advance-expenses/${requestId}`)
      ]);
      
      setProjects(projectsResponse.data);
      setExpenseTypes(expenseTypesResponse.data);
      
      const expenses = expenseResponse.data || [];
      
      // Process expenses with attached files from backend
      const expensesWithFiles = expenses.map((expense, index) => ({
        ...expense,
        id: expense.id || `expense-${index}`,
        documentStatus: expense.documentStatus || expense.document_status || 'Belgesiz',
        // Use real attachedFile if exists (backend returns it as-is from database)
        attachedFile: expense.attachedFile ? {
          name: expense.attachedFile.name || expense.attachedFile.original_filename || expense.attachedFile.filename,
          type: expense.attachedFile.type || expense.attachedFile.content_type,
          url: expense.attachedFile.url || expense.attachedFile.file_url,
          preview: expense.attachedFile.url || expense.attachedFile.file_url
        } : null
      }));
      
      setExpenseLines(expensesWithFiles);
      
      // Set advance request first so convertExpenseAmount can access it
      setAdvanceRequest(advanceResponse.data);
      
      // Trigger currency conversions for all expenses
      const advanceCurrency = advanceResponse.data.currency;
      console.log('💰 Advance currency:', advanceCurrency);
      
      for (const expense of expensesWithFiles) {
        if (expense.amount && expense.currency) {
          console.log(`Processing expense: ${expense.amount} ${expense.currency}`);
          if (expense.currency !== advanceCurrency) {
            console.log(`Will convert ${expense.amount} ${expense.currency} to ${advanceCurrency}`);
            await convertExpenseAmount(expense.id, expense.amount, expense.currency, advanceCurrency);
          }
        }
      }
      
      // Fetch messages/questions for this advance
      await fetchMessages();
      
    } catch (error) {
      console.error('Error fetching advance details:', error);
      toast.error('Avans detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Convert expense amount to advance currency
  const convertExpenseAmount = async (lineId, amount, fromCurrency, advanceCurrency) => {
    console.log('🔄 Converting:', { lineId, amount, fromCurrency, advanceCurrency });
    
    if (!amount || parseFloat(amount) === 0) {
      setConvertedAmounts(prev => ({ ...prev, [lineId]: null }));
      return;
    }
    
    if (!advanceCurrency) {
      console.error('❌ advanceCurrency is undefined!');
      return;
    }
    
    if (fromCurrency === advanceCurrency) {
      console.log('✅ Same currency, no conversion needed');
      setConvertedAmounts(prev => ({ ...prev, [lineId]: null }));
      return;
    }
    
    try {
      console.log('📡 Calling conversion API...', { from: fromCurrency, to: advanceCurrency, amount });
      const response = await axios.post(`${API}/api/currency/convert`, {
        amount: parseFloat(amount),
        from_currency: fromCurrency,
        to_currency: advanceCurrency
      });
      
      console.log('✅ Conversion result:', response.data);
      
      setConvertedAmounts(prev => ({
        ...prev,
        [lineId]: {
          amount: response.data.converted_amount,
          currency: advanceCurrency,
          rate: response.data.exchange_rate
        }
      }));
    } catch (error) {
      console.error('❌ Currency conversion error:', error.response?.data || error.message);
      setConvertedAmounts(prev => ({ ...prev, [lineId]: null }));
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'TRY': '₺', 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'AFN': '؋', 'ALL': 'L', 'AMD': '֏', 'ANG': 'ƒ',
      'AOA': 'Kz', 'ARS': '$', 'AUD': 'A$', 'AWG': 'ƒ', 'AZN': '₼', 'BAM': 'KM', 'BBD': '$', 'BDT': '৳', 'BGN': 'лв',
      'BHD': '.د.ب', 'BIF': 'FBu', 'BMD': '$', 'BND': '$', 'BOB': 'Bs.', 'BRL': 'R$', 'BSD': '$', 'BTN': 'Nu.',
      'BWP': 'P', 'BYN': 'Br', 'BZD': 'BZ$', 'CAD': 'C$', 'CDF': 'FC', 'CHF': 'CHF', 'CLP': '$', 'CNY': '¥',
      'COP': '$', 'CRC': '₡', 'CUP': '₱', 'CVE': '$', 'CZK': 'Kč', 'DJF': 'Fdj', 'DKK': 'kr', 'DOP': 'RD$',
      'DZD': 'دج', 'EGP': '£', 'ERN': 'Nfk', 'ETB': 'Br', 'FJD': '$', 'FKP': '£', 'FOK': 'kr', 'GEL': '₾',
      'GGP': '£', 'GHS': '₵', 'GIP': '£', 'GMD': 'D', 'GNF': 'FG', 'GTQ': 'Q', 'GYD': '$', 'HKD': 'HK$',
      'HNL': 'L', 'HRK': 'kn', 'HTG': 'G', 'HUF': 'Ft', 'IDR': 'Rp', 'ILS': '₪', 'IMP': '£', 'INR': '₹',
      'IQD': 'ع.د', 'IRR': '﷼', 'ISK': 'kr', 'JEP': '£', 'JMD': 'J$', 'JOD': 'JD', 'JPY': '¥', 'KES': 'KSh',
      'KGS': 'лв', 'KHR': '៛', 'KID': '$', 'KMF': 'CF', 'KRW': '₩', 'KWD': 'KD', 'KYD': '$', 'KZT': '₸',
      'LAK': '₭', 'LBP': '£', 'LKR': '₨', 'LRD': '$', 'LSL': 'M', 'LYD': 'LD', 'MAD': 'MAD', 'MDL': 'lei',
      'MGA': 'Ar', 'MKD': 'ден', 'MMK': 'K', 'MNT': '₮', 'MOP': 'MOP$', 'MRU': 'UM', 'MUR': '₨', 'MVR': 'Rf',
      'MWK': 'MK', 'MXN': '$', 'MYR': 'RM', 'MZN': 'MT', 'NAD': '$', 'NGN': '₦', 'NIO': 'C$', 'NOK': 'kr',
      'NPR': '₨', 'NZD': 'NZ$', 'OMR': '﷼', 'PAB': 'B/.', 'PEN': 'S/.', 'PGK': 'K', 'PHP': '₱', 'PKR': '₨',
      'PLN': 'zł', 'PYG': 'Gs', 'QAR': '﷼', 'RON': 'lei', 'RSD': 'Дин.', 'RUB': '₽', 'RWF': 'R₣', 'SAR': '﷼',
      'SBD': '$', 'SCR': '₨', 'SDG': 'ج.س.', 'SEK': 'kr', 'SGD': 'S$', 'SHP': '£', 'SLE': 'Le', 'SLL': 'Le',
      'SOS': 'S', 'SRD': '$', 'SSP': '£', 'STN': 'Db', 'SYP': '£', 'SZL': 'E', 'THB': '฿', 'TJS': 'SM',
      'TMT': 'T', 'TND': 'د.ت', 'TOP': 'T$', 'TTD': 'TT$', 'TVD': '$', 'TWD': 'NT$', 'TZS': 'TSh', 'UAH': '₴',
      'UGX': 'USh', 'UYU': '$U', 'UZS': 'лв', 'VES': 'Bs.', 'VND': '₫', 'VUV': 'VT', 'WST': 'WS$', 'XAF': 'FCFA',
      'XCD': '$', 'XDR': 'XDR', 'XOF': 'CFA', 'XPF': '₣', 'YER': '﷼', 'ZAR': 'R', 'ZMW': 'ZK', 'ZWL': 'Z$'
    };
    return symbols[currency] || currency;
  };


  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/api/finance-messages/${requestId}`);
      setMessages(response.data || []);
    } catch (error) {
      console.log('Messages not found or error:', error);
      setMessages([]);
    }
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    const numAmount = parseFloat(amount) || 0;
    const formatter = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const symbol = getCurrencySymbol(currency);
    return `${formatter.format(numAmount)} ${symbol}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih belirtilmemiş';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get cost center name
  const getCostCenterName = (expense) => {
    if (!expense.cost_center_type || !expense.cost_center_id) {
      return null;
    }
    
    console.log('🔍 [FinanceApproval] Finding cost center:', {
      type: expense.cost_center_type,
      id: expense.cost_center_id,
      projects: projects,
      expenseTypes: expenseTypes
    });
    
    if (expense.cost_center_type === 'project') {
      const project = projects.find(p => p.id === expense.cost_center_id);
      console.log('📂 [FinanceApproval] Project search result:', project);
      return project ? project.project_name : 'Proje bulunamadı';
    } else if (expense.cost_center_type === 'general_expense') {
      const expenseType = expenseTypes.find(t => t.id === expense.cost_center_id);
      console.log('📋 [FinanceApproval] Expense type search result:', expenseType);
      return expenseType ? expenseType.expense_type_name : 'Gider türü bulunamadı';
    }
    
    return null;
  };

  const getTotalExpenses = () => {
    // Only count expenses that are NOT rejected, use converted amounts
    const total = expenseLines
      .filter(line => line.financeStatus !== 'rejected')
      .reduce((total, line) => {
        const convertedAmount = convertedAmounts[line.id]?.amount || parseFloat(line.amount) || 0;
        console.log(`Line ${line.id}: original=${line.amount} ${line.currency}, converted=${convertedAmount}, hasConversion=${!!convertedAmounts[line.id]}`);
        return total + convertedAmount;
      }, 0);
    console.log('💰 Total Expenses:', total, 'Converted amounts:', convertedAmounts);
    return total;
  };
  
  // Get rejected expenses total
  const getRejectedExpensesTotal = () => {
    // Use converted amounts for rejected expenses too
    return expenseLines
      .filter(line => line.financeStatus === 'rejected')
      .reduce((total, line) => {
        const convertedAmount = convertedAmounts[line.id]?.amount || parseFloat(line.amount) || 0;
        return total + convertedAmount;
      }, 0);
  };
  
  // Check if there are any rejected lines
  const hasRejectedLines = () => {
    return expenseLines.some(line => line.financeStatus === 'rejected');
  };
  
  // Check if ALL lines are rejected
  const allLinesRejected = () => {
    return expenseLines.length > 0 && expenseLines.every(line => line.financeStatus === 'rejected');
  };
  
  // Calculate partial approval amount (approved_amount - rejected expenses)
  const getPartialApprovalAmount = () => {
    const approvedAmount = parseFloat(advanceRequest?.approved_amount || 0);
    const rejectedTotal = getRejectedExpensesTotal();
    return approvedAmount - rejectedTotal;
  };

  const getBalance = () => {
    const totalExpenses = getTotalExpenses();
    const approvedAmount = parseFloat(advanceRequest?.approved_amount || 0);
    return approvedAmount - totalExpenses; // Positive = refund to company, Negative = owes from company
  };

  // Handle individual expense line approval
  const handleApproveExpenseLine = async (index) => {
    try {
      setProcessing(true);
      
      const expense = expenseLines[index];
      
      // TOGGLE: If already approved, reset to initial state
      if (expense.financeStatus === 'approved') {
        const updatedExpenses = [...expenseLines];
        const resetExpense = { ...updatedExpenses[index] };
        delete resetExpense.financeStatus;
        updatedExpenses[index] = resetExpense;
        setExpenseLines(updatedExpenses);
        setProcessing(false);
        return;
      }
      
      await axios.post(`${API}/api/finance-approval/expense-line/${expense.id}/approve`);
      
      // Update local state
      const updatedExpenses = [...expenseLines];
      updatedExpenses[index] = { ...updatedExpenses[index], financeStatus: 'approved' };
      setExpenseLines(updatedExpenses);
      
      // toast.success('Harcama kalemi onaylandı'); // Removed per user request
    } catch (error) {
      console.error('Error approving expense line:', error);
      toast.error('Harcama kalemi onaylanırken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle individual expense line rejection
  const handleRejectExpenseLine = async (index) => {
    try {
      setProcessing(true);
      
      const expense = expenseLines[index];
      
      // TOGGLE: If already rejected, reset to initial state
      if (expense.financeStatus === 'rejected') {
        const updatedExpenses = [...expenseLines];
        const resetExpense = { ...updatedExpenses[index] };
        delete resetExpense.financeStatus;
        updatedExpenses[index] = resetExpense;
        setExpenseLines(updatedExpenses);
        setProcessing(false);
        return;
      }
      
      await axios.post(`${API}/api/finance-approval/expense-line/${expense.id}/reject`);
      
      // Update local state
      const updatedExpenses = [...expenseLines];
      updatedExpenses[index] = { ...updatedExpenses[index], financeStatus: 'rejected' };
      setExpenseLines(updatedExpenses);
      
      // toast.success('Harcama kalemi reddedildi'); // Removed per user request
    } catch (error) {
      console.error('Error rejecting expense line:', error);
      toast.error('Harcama kalemi reddedilirken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle resetting expense line status
  const handleResetExpenseLineStatus = async (index) => {
    try {
      setProcessing(true);
      
      // Update local state - remove financeStatus completely to reset to initial state
      const updatedExpenses = [...expenseLines];
      const resetExpense = { ...updatedExpenses[index] };
      delete resetExpense.financeStatus; // Remove financeStatus completely
      updatedExpenses[index] = resetExpense;
      
      console.log('Reset expense line:', updatedExpenses[index]); // Debug log
      setExpenseLines(updatedExpenses);
      
      // toast.success('Harcama kalemi durumu sıfırlandı'); // Removed per user request
    } catch (error) {
      console.error('Error resetting expense line:', error);
      toast.error('Harcama kalemi sıfırlanırken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle partial approval (when some lines are rejected)
  const handlePartialApproval = async () => {
    try {
      setProcessing(true);
      
      const rejectedLineIds = expenseLines
        .filter(line => line.financeStatus === 'rejected')
        .map(line => line.id);
      
      const partialApprovalData = {
        rejected_line_ids: rejectedLineIds
        // DO NOT send approved_amount - it must remain unchanged (the paid amount)
      };
      
      await axios.post(`${API}/api/finance-approval/${requestId}/partial-approve`, partialApprovalData);
      
      toast.success('Kısmi onay başarılı. Avans kapamaya döndü.');
      
      // Navigate back to finance approval list
      navigate('/dashboard/finance-approval');
      
    } catch (error) {
      console.error('Error partial approving:', error);
      toast.error(error.response?.data?.detail || 'Kısmi onay sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle asking question about expense line
  const handleAskQuestion = async () => {
    if (!questionText.trim()) {
      toast.error('Lütfen bir soru yazın');
      return;
    }

    try {
      setProcessing(true);
      
      await axios.post(`${API}/api/finance-messages`, {
        advance_request_id: requestId,
        expense_line_index: selectedExpenseIndex,
        message: questionText,
        from_finance: true
      });
      
      setQuestionText('');
      setShowQuestionModal(false);
      setSelectedExpenseIndex(null);
      
      // Refresh messages
      await fetchMessages();
      
      toast.success('Soru gönderildi');
    } catch (error) {
      console.error('Error sending question:', error);
      toast.error('Soru gönderilirken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle document preview - SAME AS ADVANCE CLOSING DETAIL
  const handleDocumentPreview = (expense) => {
    if (expense.attachedFile) {
      console.log('📎 Previewing file:', expense.attachedFile);
      console.log('📎 File type:', expense.attachedFile.type);
      console.log('📎 File URL:', expense.attachedFile.url);
      previewFileAttachment(expense.attachedFile);
    }
  };

  // Preview file attachment - COPIED FROM ADVANCE CLOSING DETAIL
  // File preview function - uses centralized S3 utility
  const previewFileAttachment = async (fileData) => {
    if (!fileData) {
      console.error('No file data provided');
      toast.error('Dosya verisi bulunamadı');
      return;
    }
    
    try {
      toast.loading('Belge yükleniyor...', { id: 'file-preview' });
      
      // Get fresh presigned URL using centralized utility
      const presignedUrl = await getFreshPresignedUrl(fileData, 3600);
      
      toast.dismiss('file-preview');
      
      if (!presignedUrl) {
        throw new Error('Presigned URL oluşturulamadı');
      }
      
      // Set preview file with fresh URL
      const safeFileData = {
        name: fileData.name || fileData.original_filename || 'Bilinmeyen dosya',
        type: fileData.type || fileData.content_type || 'application/octet-stream',
        url: presignedUrl,
        ...fileData
      };
      
      setPreviewFile(safeFileData);
      setShowFilePreview(true);
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      
    } catch (error) {
      toast.dismiss('file-preview');
      console.error('Error getting presigned URL:', error);
      toast.error('Dosya URL\'si oluşturulamadı: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Image zoom and pan functions - COPIED FROM ADVANCE CLOSING DETAIL
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

  const zoomIn = () => {
    const newScale = Math.min(3, imageScale + 0.2);
    setImageScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(0.5, imageScale - 0.2);
    setImageScale(newScale);
  };

  const resetImageView = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Handle saving changes (individual item approvals/rejections)
  const handleSaveChanges = async () => {
    try {
      setProcessing(true);
      
      // Get all items with status changes
      const changedItems = expenseLines.filter(line => line.financeStatus);
      console.log('Saving individual changes:', changedItems);
      
      // Individual changes are already saved to backend when user clicks approve/reject
      // This button just confirms all changes have been saved
      toast.success(`${changedItems.length} değişiklik kaydedildi`);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Değişiklikler kaydedilirken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle approving entire advance request (back to Finance Approval list)
  const handleApproveAdvance = async () => {
    try {
      setProcessing(true);
      
      await axios.post(`${API}/api/advance-requests/${requestId}/finance-approve`);
      
      toast.success('Avans onaylandı');
      navigate('/dashboard/finance-approval');
      
    } catch (error) {
      console.error('Error approving advance:', error);
      toast.error('Avans onaylanırken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle rejecting entire advance request (keep in Finance Approval)
  const handleRejectAdvance = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Ret gerekçesi en az 10 karakter olmalıdır');
      return;
    }
    
    try {
      setRejecting(true);
      
      await axios.post(`${API}/api/finance-approval/${requestId}/reject`, {
        reason: rejectReason.trim(),
        scope: rejectScope
      });
      
      toast.success('Talep reddedildi ve talep sahibine iade edildi');
      setShowRejectModal(false);
      
      // Navigate with state to trigger refresh in parent list
      navigate('/dashboard/finance-approval', {
        state: { 
          refreshList: true,
          rejectedId: requestId,
          message: 'Talep başarıyla reddedildi'
        }
      });
      
    } catch (error) {
      console.error('Error rejecting advance:', error);
      toast.error(error.response?.data?.detail || 'Talep reddedilirken hata oluştu');
    } finally {
      setRejecting(false);
    }
  };

  const getDocumentIcon = (fileName) => {
    if (!fileName) return PaperclipIcon;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return ImageIcon;
    } else if (['pdf'].includes(extension)) {
      return FileTextIcon;
    } else {
      return FileIcon;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Onaylı</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Reddedildi</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finans onay detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!advanceRequest) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Avans bilgileri bulunamadı</p>
        <Button 
          onClick={() => navigate('/dashboard/finance-approval')} 
          variant="outline" 
          className="mt-4"
        >
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/dashboard/finance-approval')}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Finans Onayı Detayı
            </h1>
            <p className="text-sm text-gray-600">
              {advanceRequest.advance_number || `AVS-${requestId.slice(0, 8)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Mesajlar butonu kaldırıldı */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid ${getBalance() !== 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
        {/* 1. Paid Advance (Approved Amount) */}
        <Card className="p-4 bg-green-50">
          <div className="text-sm font-medium text-gray-600 mb-2 text-center">ÖDENEN AVANS</div>
          <div className="text-2xl font-bold text-green-600 text-center">
            {formatCurrency(advanceRequest?.approved_amount || 0, advanceRequest?.currency || 'TRY')}
          </div>
        </Card>

        {/* 2. Total Expenses */}
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 mb-2 text-center">TOPLAM HARCANAN</div>
          <div className="text-2xl font-bold text-blue-600 text-center">
            {formatCurrency(getTotalExpenses(), advanceRequest?.currency || 'TRY')}
          </div>
        </Card>

        {/* 3. Expense Difference */}
        <Card className={`p-4 ${
          getBalance() > 0 ? 'bg-orange-50' : getBalance() < 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className="text-sm font-medium text-gray-600 mb-2 text-center">HARCAMA FARKI</div>
          <div className={`text-2xl font-bold text-center ${
            getBalance() > 0 ? 'text-orange-600' : getBalance() < 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(getBalance()), advanceRequest?.currency || 'TRY')}
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {getBalance() > 0 ? '(İade Edilecek)' : getBalance() < 0 ? 'Fazla harcama beyan edildi' : '(Dengede)'}
          </div>
        </Card>

        {/* 4. Status Box - Only show if there's a difference - FINANCE VERSION */}
        {getBalance() !== 0 && (
          <Card className={`p-4 border-2 ${
            getBalance() < 0 
              ? 'bg-green-600 border-green-700' 
              : 'bg-red-600 border-red-700'
          }`}>
            <div className="text-sm font-medium text-white mb-2 text-center">BAKİYE</div>
            <div className="text-2xl font-bold text-white text-center">
              {formatCurrency(Math.abs(getBalance()), advanceRequest?.currency || 'TRY')}
            </div>
            <div className="text-xs text-white mt-1 text-center">
              {getBalance() < 0 
                ? 'Personel şirketten alacaklı' 
                : 'Personel şirkete borçlu'
              }
            </div>
          </Card>
        )}
      </div>

      {/* Advance Details */}
      <Card className="p-3">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Avans Detayları</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="space-y-2">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Talep Eden:</span>
              <span className="ml-2">{advanceRequest.requester_name || 'Bilinmiyor'}</span>
            </div>
            
            <div className="flex items-center">
              <FolderIcon className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Kategori:</span>
              <span className="ml-2">{advanceRequest.category}</span>
            </div>
            
            <div className="flex items-center">
              <BuildingIcon className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Proje:</span>
              <span className="ml-2 truncate">{advanceRequest.project_name || advanceRequest.project || 'Belirtilmemiş'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <BanknoteIcon className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Talep Edilen:</span>
              <span className="ml-2 font-bold text-blue-600">
                {formatCurrency(advanceRequest.amount, advanceRequest.currency)}
              </span>
            </div>
            
            <div className="flex items-center">
              <BanknoteIcon className="w-4 h-4 mr-3 text-green-400" />
              <span className="font-medium">Ödenen:</span>
              <span className="ml-2 font-bold text-green-600">
                {formatCurrency(advanceRequest.approved_amount, advanceRequest.currency)}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Talep Tarihi:</span>
              <span className="ml-2">{formatDate(advanceRequest.request_date)}</span>
            </div>
            
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Kapama Tarihi:</span>
              <span className="ml-2">{formatDate(advanceRequest.closure_date)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <FileTextIcon className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium">Açıklama:</span>
                <p className="ml-2 text-gray-600 break-words">{advanceRequest.description || 'Açıklama bulunmuyor'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Expense Lines */}
      <Card className="p-3">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Harcama Detayları ({expenseLines.length} kalem)
        </h3>
        
        {expenseLines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz harcama kalemi bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-4">
            {expenseLines.map((line, index) => {
              const DocumentIconComponent = getDocumentIcon(line.attachedFile?.name);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Row 1: Date, Supplier, Amount */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm font-medium">{formatDate(line.date)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <BuildingIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm">{line.supplier || 'Tedarikçi belirtilmemiş'}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-purple-600">
                            {formatCurrency(line.amount, line.currency)}
                          </div>
                          {/* Show converted amount if different currency */}
                          {convertedAmounts[line.id] && (
                            <div className="text-xs text-gray-500 mt-1">
                              ≈ {formatCurrency(convertedAmounts[line.id].amount, advanceRequest?.currency)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Category, Subcategory */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                          <FolderIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm">{line.category}</span>
                          {line.subcategory && (
                            <>
                              <span className="text-gray-400 mx-2">→</span>
                              <span className="text-sm text-gray-600">{line.subcategory}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Row 3: Description */}
                      {line.description && (
                        <div className="flex items-start">
                          <FileTextIcon className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600">{line.description}</p>
                        </div>
                      )}

                      {/* Row 4: Document Status, Finance Status and Action Icons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={line.documentStatus === 'Belgeli' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {line.documentStatus || 'Belgesiz'}
                          </Badge>
                          
                          {getStatusBadge(line.financeStatus)}
                          
                          {line.attachedFile && (
                            <div className="flex items-center space-x-2">
                              <DocumentIconComponent className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-gray-600">
                                {line.attachedFile.name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Icons */}
                        <div className="flex items-center space-x-2">
                          {/* Document Preview Icon */}
                          {line.attachedFile && (
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDocumentPreview(line);
                              }}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 cursor-pointer"
                              data-preview-eye="true"
                              aria-label="Belgeyi önizle"
                              title="Belgeyi Önizle"
                            >
                              <EyeIcon className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          
                          {/* Only show approve/reject buttons for users with finance permission */}
                          {hasFinancePermission() && (
                            <>
                              {/* Approve Icon */}
                              <Button
                                onClick={() => handleApproveExpenseLine(index)}
                                disabled={processing}
                                variant="outline"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  line.financeStatus === 'approved' ? 'bg-green-100 border-green-300' :
                                  'hover:bg-green-50'
                                }`}
                                title={line.financeStatus === 'approved' ? 'Onayı Geri Al' : 'Harcamayı Onayla'}
                              >
                                <CheckCircleIcon className={`w-4 h-4 ${
                                  line.financeStatus === 'approved' ? 'text-green-600' : 
                                  'text-gray-600 hover:text-green-600'
                                }`} />
                              </Button>
                              
                              {/* Reject Icon */}
                              <Button
                                onClick={() => handleRejectExpenseLine(index)}
                                disabled={processing}
                                variant="outline"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  line.financeStatus === 'rejected' ? 'bg-red-100 border-red-300' :
                                  'hover:bg-red-50'
                                }`}
                                title={line.financeStatus === 'rejected' ? 'Reddi Geri Al' : 'Harcamayı Reddet'}
                              >
                                <XCircleIcon className={`w-4 h-4 ${
                                  line.financeStatus === 'rejected' ? 'text-red-600' : 
                                  'text-gray-600 hover:text-red-600'
                                }`} />
                              </Button>
                              
                              {/* Reset Icon - Only show when status is set */}
                              {(line.financeStatus === 'approved' || line.financeStatus === 'rejected') && (
                                <Button
                                  onClick={() => handleResetExpenseLineStatus(index)}
                                  disabled={processing}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-purple-300 hover:bg-purple-50"
                                  title="Durumu Sıfırla"
                                >
                                  <RefreshCwIcon className="w-4 h-4 text-purple-600" />
                                </Button>
                              )}
                              
                              {/* Question Icon */}
                              <Button
                                onClick={() => {
                                  setSelectedExpenseIndex(index);
                                  setShowQuestionModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Soru Sor"
                              >
                                <MessageSquareIcon className="w-4 h-4 text-orange-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Row 5: Cost Center Info */}
                      {getCostCenterName(line) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-start space-x-2">
                            <FolderIcon className="w-4 h-4 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-700">Masraf Merkezi: </span>
                              <span className="text-sm text-gray-900 font-medium">
                                {getCostCenterName(line)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({line.cost_center_type === 'project' ? 'Proje' : 'Genel Gider'})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Row 6: Payment Method Info */}
                      {line.payment_method && line.payment_method !== 'cash' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-start space-x-2">
                            <BanknoteIcon className="w-4 h-4 text-teal-600 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-700">Ödeme Yöntemi: </span>
                              {line.payment_method === 'credit_card' && (line.credit_card_id || line.creditCardId) && (
                                <div className="text-sm text-gray-900 mt-1">
                                  <span className="font-medium">Kredi Kartı</span>
                                  {(() => {
                                    const cardDetails = line.credit_card_details || line.creditCardDetails;
                                    if (cardDetails) {
                                      const bankName = cardDetails?.bank_name || cardDetails?.bankName;
                                      const holderName = cardDetails?.card_holder_name || cardDetails?.cardHolderName;
                                      const last4 = cardDetails?.card_last_4_digits || cardDetails?.cardLast4Digits;
                                      
                                      return (
                                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                          {bankName && <div>• Banka: {bankName}</div>}
                                          {holderName && <div>• Kart Sahibi: {holderName}</div>}
                                          {last4 && <div>• Kart: •••• {last4}</div>}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                              {line.payment_method === 'bank_transfer' && (line.bank_transfer_details || line.bankTransfer) && (
                                <div className="text-sm text-gray-900 mt-1">
                                  <span className="font-medium">Banka Transferi</span>
                                  {(() => {
                                    const transferDetails = line.bank_transfer_details || line.bankTransfer;
                                    const recipientName = transferDetails?.recipient_name || transferDetails?.recipientName;
                                    const bankName = transferDetails?.bank_name || transferDetails?.bankName;
                                    const description = transferDetails?.transfer_description || transferDetails?.transferDescription;
                                    
                                    return (
                                      <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                        {recipientName && <div>• Alıcı: {recipientName}</div>}
                                        {bankName && <div>• Banka: {bankName}</div>}
                                        {description && <div>• Açıklama: {description}</div>}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Bottom Action Buttons */}
      <Card className="p-3">
        <div className="flex justify-center space-x-3">
          {/* Only show action buttons for users with finance permission */}
          {hasFinancePermission() && (
            <>
              {/* Onayla Button - Disabled if any line is rejected */}
              {(advanceRequest?.closing_status === 'submitted' || advanceRequest?.status === 'finance_pending') && (
                <Button
                  onClick={handleApproveAdvance}
                  disabled={processing || hasRejectedLines()}
                  size="sm"
                  className="px-6 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={hasRejectedLines() ? 'Reddedilen satırlar var, kısmi onay veya tam red kullanın' : 'Avansı onayla'}
                >
                  ✅ Onayla
                </Button>
              )}
              
              {/* Partial Approval Button - Only show when there are rejected lines BUT NOT ALL */}
              {hasRejectedLines() && !allLinesRejected() && (advanceRequest?.closing_status === 'submitted' || advanceRequest?.status === 'finance_pending') && (
                <Button
                  onClick={handlePartialApproval}
                  disabled={processing}
                  size="sm"
                  className="px-6 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white"
                >
                  🟠 KISMİ ONAY
                </Button>
              )}
              
              {/* Reddet Button - Only for submitted requests */}
              {(advanceRequest?.closing_status === 'submitted' || advanceRequest?.status === 'finance_pending') && (
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  variant="outline"
                  size="sm"
                  className="px-6 py-2 text-sm font-semibold border-red-300 text-red-700 hover:bg-red-50"
                >
                  ❌ Reddet
                </Button>
              )}
            </>
          )}
          
          {/* Warning for draft requests */}
          {advanceRequest?.closing_status === 'draft' && (
            <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-md">
              ⚠️ Bu talep henüz finans onayına gönderilmemiş
            </div>
          )}
          
          {/* Warning if all lines rejected */}
          {allLinesRejected() && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">
              ⚠️ Tüm satırlar reddedildi
            </div>
          )}
          
          {/* Info for users without permission */}
          {!hasFinancePermission() && (
            <div className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-md">
              ℹ️ Bu avansınız finans onayı bekliyor. Onaylandığında bilgilendirileceksiniz.
            </div>
          )}
        </div>
      </Card>

      {/* File Preview Modal - SAME AS ADVANCE CLOSING DETAIL */}
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
              {previewFile && previewFile.type?.startsWith('image/') && (
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
                  Dosya: {previewFile.name}
                </p>
                {previewFile.type?.startsWith('image/') ? (
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
                        src={previewFile?.url || previewFile?.path || previewFile?.s3_path || previewFile?.preview || previewFile?.name}
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
              onClick={() => setShowFilePreview(false)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Modal */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Harcama Hakkında Soru Sor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Sorunuzu yazın:</Label>
              <Textarea
                id="question"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Bu harcama ile ilgili sorunuzu buraya yazın..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionModal(false);
                setQuestionText('');
                setSelectedExpenseIndex(null);
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleAskQuestion}
              disabled={processing || !questionText.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <SendIcon className="w-4 h-4 mr-2" />
              Soru Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages Modal */}
      <Dialog open={showMessagesModal} onOpenChange={setShowMessagesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Mesajlar ve Sorular</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz mesaj bulunmamaktadır.
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg ${
                    message.from_finance 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'bg-green-50 border-l-4 border-green-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {message.from_finance ? 'Finans Departmanı' : 'Talep Eden'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                  {message.expense_line_index !== null && (
                    <div className="mt-2 text-xs text-gray-500">
                      Harcama Kalemi: {message.expense_line_index + 1}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Avans Talebini Reddet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              ⚠️ Bu talebi reddederseniz, talep sahibine iade edilecek ve düzenleme yapılabilecektir.
            </div>
            
            <div>
              <Label>Ret Gerekçesi *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reddetme sebebinizi detaylı olarak yazınız (en az 10 karakter)"
                className="mt-2 min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectReason.length} / 500 karakter
              </p>
            </div>
            
            <div>
              <Label>Ret Kapsamı</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectScope"
                    value="all"
                    checked={rejectScope === 'all'}
                    onChange={(e) => setRejectScope(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Tüm talebi reddet</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Talep sahibi tüm harcamaları düzenleyebilir
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
                setRejectScope('all');
              }}
              disabled={rejecting}
            >
              İptal
            </Button>
            <Button
              onClick={handleRejectAdvance}
              disabled={rejecting || rejectReason.trim().length < 10}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting ? 'Reddediliyor...' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default FinanceApprovalDetail;