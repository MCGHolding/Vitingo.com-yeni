import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import AmountInput from '../ui/AmountInput';
import {
  PlusIcon,
  XIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    currency: '', // Empty initially - will be set from user settings
    category: '',
    project: '',
    description: '',
    request_date: new Date().toISOString().split('T')[0],
    closure_type: '',
    closure_days: '',
    closure_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '' });
  const [addingProject, setAddingProject] = useState(false);
  
  // Currencies state
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  
  // User's allowed currencies from new API
  const [userAllowedCurrencies, setUserAllowedCurrencies] = useState([]);
  
  // Base currency state
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [baseCurrencyChecked, setBaseCurrencyChecked] = useState(false);
  
  // AmountInput component handles formatting now
  
  // Advance rules state
  const [advanceRules, setAdvanceRules] = useState(null);
  const [showMediumModal, setShowMediumModal] = useState(false);
  const [showExtendedModal, setShowExtendedModal] = useState(false);
  const [advanceUsage, setAdvanceUsage] = useState(null);
  const [loadingAdvanceData, setLoadingAdvanceData] = useState(false);
  
  // Advance eligibility state
  const [eligibility, setEligibility] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  
  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({
    title: '',
    message: '',
    details: {}
  });

  // Check if user has admin permissions
  const hasAdminPermissions = () => {
    if (!user?.role) return false;
    return user.role.name === 'Süper Admin' || user.role.name === 'Admin' || user.role.permissions?.includes('*');
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(`${API}/categories`);
      const categoriesData = response.data?.categories || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      toast.error('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await axios.get(`${API}/cost-centers/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Projeler yüklenirken hata oluştu');
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch currencies
  const fetchCurrencies = async () => {
    try {
      setLoadingCurrencies(true);
      const response = await axios.get(`${API}/currencies`);
      setCurrencies(response.data);
      
      // Load user's currency settings FIRST
      let userBaseCurrency = null;
      if (user?.id) {
        try {
          const token = localStorage.getItem('token');
          const settings = await getCurrencySettings(user.id, token);
          console.log('📖 User currency settings:', settings);
          setUserAllowedCurrencies(settings.allowedCurrencies || []);
          userBaseCurrency = settings.baseCurrency;
        } catch (error) {
          console.error('Error fetching user currency settings:', error);
          setUserAllowedCurrencies([]);
        }
      }
      
      // Set currency: user base > TRY fallback
      if (userBaseCurrency) {
        setFormData(prev => ({ ...prev, currency: userBaseCurrency }));
        console.log('✅ Set currency to user base:', userBaseCurrency);
      } else if (response.data.length > 0) {
        const defaultCurrency = response.data.find(c => c.code === 'TRY') || response.data[0];
        setFormData(prev => ({ ...prev, currency: defaultCurrency.code }));
        console.log('⚠️ Fallback to default currency:', defaultCurrency.code);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Fallback to default currencies if API fails
      setCurrencies([
        { code: 'TRY', symbol: '₺' },
        { code: 'USD', symbol: '$' },
        { code: 'EUR', symbol: '€' }
      ]);
      setUserAllowedCurrencies([]);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  // Fetch base currency
  const fetchBaseCurrency = async () => {
    try {
      const response = await axios.get(`${API}/company/base-currency`);
      setBaseCurrency(response.data.base_currency);
      setBaseCurrencyChecked(true);
    } catch (error) {
      console.error('Error fetching base currency:', error);
      setBaseCurrency(null);
      setBaseCurrencyChecked(true);
    }
  };

  // Fetch advance rules and usage
  const fetchAdvanceRules = async () => {
    try {
      const rulesResponse = await axios.get(`${API}/advance-rules`);
      setAdvanceRules(rulesResponse.data);
      
      const usageResponse = await axios.get(`${API}/advance-usage`);
      setAdvanceUsage(usageResponse.data);
      console.log('📊 Advance usage data:', usageResponse.data);
    } catch (error) {
      console.error('Error fetching advance data:', error);
    }
  };

  // Fetch advance eligibility
  const fetchEligibility = async () => {
    try {
      setLoadingEligibility(true);
      const response = await axios.get(`${API}/advance-eligibility`);
      setEligibility(response.data);
    } catch (error) {
      console.error('Error fetching eligibility:', error);
      toast.error('Avans uygunluk bilgileri alınamadı');
    } finally {
      setLoadingEligibility(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
    fetchProjects();
    fetchCurrencies();
    fetchBaseCurrency();
    fetchAdvanceRules();
    fetchEligibility();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if base currency is set
    if (!baseCurrency) {
      toast.error(
        'Lütfen önce temel para biriminizi ayarlayın',
        {
          description: 'Ayarlar → Kütüphane → Para Birimleri sayfasından temel para biriminizi seçebilirsiniz.',
          duration: 5000
        }
      );
      
      // Navigate to currency settings after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/settings', { state: { openTab: 'library', openSubTab: 'currencies' } });
      }, 2000);
      
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        project: formData.project,
        description: formData.description,
        closure_days: parseInt(formData.closure_days)
      };
      
      await axios.post(`${API}/advance-requests`, requestData);
      
      toast.success('Avans talebi başarıyla oluşturuldu!');
      
      // Form'u temizle
      setFormData({
        amount: '',
        currency: 'TRY',
        category: '',
        project: '',
        description: '',
        request_date: new Date().toISOString().split('T')[0],
        closure_type: '',
        closure_days: '',
        closure_date: ''
      });
      
      // Eligibility'yi yenile
      fetchEligibility();
      
    } catch (error) {
      const errorDetail = error.response?.data?.detail || 'Avans talebi oluşturulurken hata oluştu';
      
      // Check if it's a limit exceeded error
      if (errorDetail.includes('toplam izin verilen avans limitini') || errorDetail.includes('aşmaktadır')) {
        // Parse error message for structured display
        const amountMatch = errorDetail.match(/(\d+[\d,]*\.?\d*)\s*TRY/g);
        const details = {
          requestedAmount: amountMatch?.[0] || '',
          maxLimit: amountMatch?.[1] || '',
          currentOpen: errorDetail.match(/Mevcut açık avanslarınız:\s*([\d,]+\.?\d*\s*TRY)/)?.[1] || '',
          remainingLimit: errorDetail.match(/Kalan limit:\s*([\d,]+\.?\d*\s*TRY)/)?.[1] || ''
        };
        
        setErrorModalData({
          title: 'Avans Limit Aşımı',
          message: errorDetail,
          details: details
        });
        setShowErrorModal(true);
      } else {
        // For other errors, use toast
        toast.error(errorDetail);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategori adı boş olamaz');
      return;
    }

    setAddingCategory(true);
    try {
      await axios.post(`${API}/categories`, {
        name: newCategoryName.trim()
      });
      
      toast.success('Kategori başarıyla eklendi');
      setNewCategoryName('');
      setShowAddCategory(false);
      
      // Refresh categories
      await fetchCategories();
      
      // Auto-select the new category
      setFormData(prev => ({...prev, category: newCategoryName.trim()}));
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kategori eklenirken hata oluştu');
    } finally {
      setAddingCategory(false);
    }
  };

  // Add new project
  const handleAddProject = async () => {
    if (!newProjectData.name.trim()) {
      toast.error('Proje adı boş olamaz');
      return;
    }

    setAddingProject(true);
    try {
      const response = await axios.post(`${API}/cost-centers/projects`, {
        project_name: newProjectData.name.trim()
      });
      
      toast.success('Proje başarıyla eklendi');
      const addedProjectName = newProjectData.name.trim();
      setNewProjectData({ name: '', description: '' });
      setShowAddProject(false);
      
      // Refresh projects
      await fetchProjects();
      
      // Auto-select the new project
      setFormData(prev => ({...prev, project: addedProjectName}));
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Proje eklenirken hata oluştu');
    } finally {
      setAddingProject(false);
    }
  };

  // Auto-fill description based on amount, category and project
  const updateDescription = () => {
    if (formData.amount && formData.category && formData.project) {
      const autoDescription = `${formData.category} talebi - ${formData.project} projesi için ${formData.amount} ${formData.currency} avans talebi. Proje ihtiyaçları doğrultusunda kullanılacak ve belirlenen sürede kapatılacaktır.`;
      setFormData(prev => ({ ...prev, description: autoDescription }));
    }
  };

  // Calculate closure date based on request date and selected days
  const calculateClosureDate = (days) => {
    if (!formData.request_date || !days) return '';
    
    const requestDate = new Date(formData.request_date);
    const closureDate = new Date(requestDate);
    closureDate.setDate(closureDate.getDate() + parseInt(days));
    
    return closureDate.toISOString().split('T')[0];
  };

  // Handle quick days selection
  const handleQuickDaysSelection = (days) => {
    if (!advanceRules) return;
    
    // Check if this is medium days and rules are enabled
    if (advanceRules.rules_enabled && days === advanceRules.medium_days.toString()) {
      setShowMediumModal(true);
      return;
    }
    
    // Check if this is extended days and rules are enabled
    if (advanceRules.rules_enabled && days === advanceRules.extended_days.toString()) {
      setShowExtendedModal(true);
      return;
    }
    
    // For standard days or when rules are disabled
    const calculatedClosureDate = calculateClosureDate(days);
    setFormData(prev => ({
      ...prev,
      closure_type: 'days',
      closure_days: days,
      closure_date: calculatedClosureDate
    }));
  };

  // Handle medium days modal - show extended option
  const handleUseMediumDaysExtended = async () => {
    setLoadingAdvanceData(true);
    try {
      await axios.post(`${API}/advance-usage/use-extended`);
      
      // Use extended days (60)
      const calculatedClosureDate = calculateClosureDate(advanceRules.extended_days.toString());
      setFormData(prev => ({
        ...prev,
        closure_type: 'days',
        closure_days: advanceRules.extended_days.toString(),
        closure_date: calculatedClosureDate
      }));
      
      // Refresh usage data
      await fetchAdvanceRules();
      
      toast.success(`${advanceRules.extended_days} günlük hakkınız kullanıldı`);
      setShowMediumModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hak kullanımında hata oluştu');
    } finally {
      setLoadingAdvanceData(false);
    }
  };

  // Handle medium days modal - use standard
  const handleUseMediumDaysStandard = () => {
    const calculatedClosureDate = calculateClosureDate(advanceRules.standard_days.toString());
    setFormData(prev => ({
      ...prev,
      closure_type: 'days',
      closure_days: advanceRules.standard_days.toString(),
      closure_date: calculatedClosureDate
    }));
    setShowMediumModal(false);
  };

  // Handle medium days modal - use medium (30 days)
  const handleUseMediumDays = () => {
    const calculatedClosureDate = calculateClosureDate(advanceRules.medium_days.toString());
    setFormData(prev => ({
      ...prev,
      closure_type: 'days',
      closure_days: advanceRules.medium_days.toString(),
      closure_date: calculatedClosureDate
    }));
    setShowMediumModal(false);
  };

  // Handle extended days modal - use extended
  const handleUseExtendedDays = async () => {
    setLoadingAdvanceData(true);
    try {
      await axios.post(`${API}/advance-usage/use-extended`);
      
      // Use extended days
      const calculatedClosureDate = calculateClosureDate(advanceRules.extended_days.toString());
      setFormData(prev => ({
        ...prev,
        closure_type: 'days',
        closure_days: advanceRules.extended_days.toString(),
        closure_date: calculatedClosureDate
      }));
      
      // Refresh usage data
      await fetchAdvanceRules();
      
      toast.success(`${advanceRules.extended_days} günlük hakkınız kullanıldı`);
      setShowExtendedModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Hak kullanımında hata oluştu');
    } finally {
      setLoadingAdvanceData(false);
    }
  };

  // Handle extended days modal - use standard
  const handleUseExtendedDaysStandard = () => {
    const calculatedClosureDate = calculateClosureDate(advanceRules.standard_days.toString());
    setFormData(prev => ({
      ...prev,
      closure_type: 'days',
      closure_days: advanceRules.standard_days.toString(),
      closure_date: calculatedClosureDate
    }));
    setShowExtendedModal(false);
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  React.useEffect(() => {
    updateDescription();
  }, [formData.amount, formData.category, formData.project]);

  // Update closure date when request date changes and days are selected
  React.useEffect(() => {
    if (formData.closure_type === 'days' && formData.closure_days && formData.request_date) {
      const calculatedDate = calculateClosureDate(formData.closure_days);
      setFormData(prev => ({ ...prev, closure_date: calculatedDate }));
    }
  }, [formData.request_date, formData.closure_days, formData.closure_type]);

  return (
    <div className="max-w-4xl mx-auto" data-testid="new-request-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
            <PlusIcon className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Yeni İş Avansı Talebi</h2>
        </div>
        <p className="text-gray-600">Lütfen talep bilgilerinizi eksiksiz doldurun</p>
      </div>

      {/* Eligibility Check */}
      {loadingEligibility ? (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="loading-spinner mr-3"></div>
            <span>Avans uygunluk durumunuz kontrol ediliyor...</span>
          </div>
        </Card>
      ) : eligibility && (() => {
        // 🎯 STARTER PAKET KONTROLLERİ
        const selectedPlan = user?.company?.selected_plan || user?.company?.subscription_plan;
        const isStarter = selectedPlan === 'starter';
        
        // Starter paketinde limit gösterme
        if (isStarter) {
          return null;
        }
        
        // KIRMIZI UYARI: Avans talebi oluşturamazsınız
        if (!eligibility.can_request) {
          return (
            <Card className="p-6 mb-6 border-2 border-red-200 bg-red-50" data-testid="eligibility-warning">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <XIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    Yeni Avans Talebi Oluşturamazsınız
                  </h3>
                  <p className="text-red-800 mb-4">
                    {eligibility.message}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-900">Açık Avans Durumu</div>
                      <div className="text-gray-600">
                        {eligibility.open_advances || 0} / {eligibility.max_open_advances || 6} avans
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-900">Açık Avans Limiti</div>
                      <div className="text-gray-600">
                        ₺{(eligibility.used_amount || 0).toLocaleString('tr-TR')} / ₺{(eligibility.max_total_amount || 300000).toLocaleString('tr-TR')} {eligibility.currency || 'TRY'}
                      </div>
                      <div className="text-sm text-red-700 mt-1 font-medium">
                        Kalan: ₺{(eligibility.remaining_amount || 0).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        }
        
        // YEŞİL BAŞARI: Yeni avans talebi oluşturabilirsiniz
        return (
          <Card className="p-6 mb-6 border-2 border-green-200 bg-green-50" data-testid="eligibility-success">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Yeni Avans Talebi Oluşturabilirsiniz
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-gray-900">Açık Avans</div>
                    <div className="text-gray-600">
                      {eligibility.open_advances || 0} / {eligibility.max_open_advances || 6}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-gray-900">Açık Avans Limiti</div>
                    <div className="text-gray-600">
                      ₺{(eligibility.used_amount || 0).toLocaleString('tr-TR')} / ₺{(eligibility.max_total_amount || 300000).toLocaleString('tr-TR')} {eligibility.currency || 'TRY'}
                    </div>
                    <div className="text-sm text-green-700 mt-1 font-medium">
                      Kalan: ₺{(eligibility.remaining_amount || 0).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      <Card className={`p-8 shadow-lg ${!eligibility?.can_request ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Talep Detayları</h3>
          <div className="w-16 h-1 bg-teal-500 rounded-full"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="amount" className="form-label">Talep Tutarı *</Label>
              <AmountInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({...formData, amount: value})}
                placeholder="0,00"
                required
                data-testid="request-amount-input"
              />
            </div>

            <div>
              <Label htmlFor="currency" className="form-label">Para Birimi *</Label>
              <Select value={formData.currency || undefined} onValueChange={(value) => setFormData({...formData, currency: value})}>
                <SelectTrigger data-testid="currency-select" className="form-input">
                  <SelectValue placeholder="Para birimi seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingCurrencies ? (
                    <SelectItem value="TRY" disabled>Yükleniyor...</SelectItem>
                  ) : currencies.length > 0 ? (
                    (() => {
                      // Filter by user's allowed currencies from new API
                      const filteredCurrencies = userAllowedCurrencies.length > 0
                        ? currencies.filter(c => userAllowedCurrencies.includes(c.code))
                        : currencies;
                      
                      return filteredCurrencies.length > 0 ? (
                        filteredCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="TRY" disabled>
                          Para birimi ayarlanmamış. Lütfen Ayarlar'dan para birimi ekleyin.
                        </SelectItem>
                      );
                    })()
                  ) : (
                    (() => {
                      // Fallback currencies filtered by user settings
                      const fallbackCurrencies = [
                        { code: 'TRY', symbol: '₺' },
                        { code: 'USD', symbol: '$' },
                        { code: 'EUR', symbol: '€' }
                      ];
                      
                      const filteredFallback = userAllowedCurrencies.length > 0
                        ? fallbackCurrencies.filter(c => userAllowedCurrencies.includes(c.code))
                        : fallbackCurrencies;
                      
                      return filteredFallback.length > 0 ? (
                        filteredFallback.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="TRY" disabled>
                          Para birimi ayarlanmamış. Lütfen Ayarlar'dan para birimi ekleyin.
                        </SelectItem>
                      );
                    })()
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="form-label">Kategori *</Label>
            <Select value={formData.category} onValueChange={(value) => {
              if (value === 'add_new_category') {
                setShowAddCategory(true);
              } else {
                setFormData({...formData, category: value});
              }
            }}>
              <SelectTrigger data-testid="category-select" className="form-input">
                <SelectValue placeholder={loadingCategories ? "Kategoriler yükleniyor..." : "Kategori seçin"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      {category.is_default && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Varsayılan
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {hasAdminPermissions() && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <SelectItem value="add_new_category" className="text-teal-600 font-medium">
                      <div className="flex items-center">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Yeni Kategori Ekle
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Add New Category Dialog */}
          {showAddCategory && (
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogContent data-testid="add-category-dialog">
                <DialogHeader>
                  <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-category-name" className="form-label">
                      Kategori Adı *
                    </Label>
                    <Input
                      id="new-category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="form-input"
                      placeholder="Örn: Eğitim Avansı"
                      maxLength={50}
                      data-testid="new-category-input"
                    />
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Bilgilendirme</p>
                      <p className="text-sm text-blue-700">
                        Eklenen kategori tüm şirket kullanıcıları tarafından görülebilir olacaktır.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      disabled={addingCategory}
                      className="flex-1"
                      data-testid="cancel-category-btn"
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleAddCategory}
                      disabled={addingCategory || !newCategoryName.trim()}
                      className="btn-primary flex-1"
                      data-testid="save-category-btn"
                    >
                      {addingCategory ? (
                        <div className="loading-spinner mr-2"></div>
                      ) : (
                        <PlusIcon className="w-4 h-4 mr-2" />
                      )}
                      <span>{addingCategory ? 'Ekleniyor...' : 'Kategori Ekle'}</span>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Add New Project Dialog */}
          {showAddProject && (
            <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
              <DialogContent data-testid="add-project-dialog">
                <DialogHeader>
                  <DialogTitle>Yeni Proje Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-project-name" className="form-label">
                      Proje Adı *
                    </Label>
                    <Input
                      id="new-project-name"
                      value={newProjectData.name}
                      onChange={(e) => setNewProjectData(prev => ({...prev, name: e.target.value}))}
                      className="form-input"
                      placeholder="Örn: Web Geliştirme Projesi"
                      maxLength={100}
                      data-testid="new-project-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-project-description" className="form-label">
                      Açıklama (Opsiyonel)
                    </Label>
                    <textarea
                      id="new-project-description"
                      value={newProjectData.description}
                      onChange={(e) => setNewProjectData(prev => ({...prev, description: e.target.value}))}
                      className="form-input min-h-[80px] resize-none"
                      placeholder="Proje hakkında kısa açıklama..."
                      maxLength={200}
                      rows={3}
                      data-testid="new-project-description-input"
                    />
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Bilgilendirme</p>
                      <p className="text-sm text-blue-700">
                        Eklenen proje tüm şirket kullanıcıları tarafından kullanılabilir olacaktır.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddProject(false);
                        setNewProjectData({ name: '', description: '' });
                      }}
                      disabled={addingProject}
                      className="flex-1"
                      data-testid="cancel-project-btn"
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleAddProject}
                      disabled={addingProject || !newProjectData.name.trim()}
                      className="btn-primary flex-1"
                      data-testid="save-project-btn"
                    >
                      {addingProject ? (
                        <div className="loading-spinner mr-2"></div>
                      ) : (
                        <PlusIcon className="w-4 h-4 mr-2" />
                      )}
                      <span>{addingProject ? 'Ekleniyor...' : 'Proje Ekle'}</span>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Project */}
          <div>
            <Label htmlFor="project" className="form-label">Proje/Saha Adı *</Label>
            <Select value={formData.project} onValueChange={(value) => {
              if (value === 'add_new_project') {
                setShowAddProject(true);
              } else {
                setFormData({...formData, project: value});
              }
            }}>
              <SelectTrigger data-testid="project-select" className="form-input">
                <SelectValue placeholder={loadingProjects ? "Projeler yükleniyor..." : "Proje seçin"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.project_name || project.name}>
                    <div className="flex items-center justify-between w-full">
                      <div className="font-medium">{project.project_name || project.name}</div>
                      {project.is_default && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Varsayılan
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {hasAdminPermissions() && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <SelectItem value="add_new_project" className="text-teal-600 font-medium">
                      <div className="flex items-center">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Yeni Proje Ekle
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Medium Days Modal (30 gün) */}
          {showMediumModal && advanceRules && advanceUsage && (
            <Dialog open={showMediumModal} onOpenChange={setShowMediumModal}>
              <DialogContent data-testid="medium-days-modal" className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-center">
                    Orta Süre Seçeneği ({advanceRules.medium_days} Gün)
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800 mb-2">
                      <strong>Standart kapama süresi {advanceRules.standard_days} gündür</strong>
                    </div>
                    <div className="text-sm text-blue-700">
                      Sadece yoğun sezon için bir takvim yılında en fazla {advanceRules.yearly_medium_limit} defa {advanceRules.medium_days} gün seçeneği sunulur.
                    </div>
                  </div>

                  <div className={`text-center p-3 border rounded-lg ${
                    advanceUsage.can_use_medium 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      advanceUsage.can_use_medium ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {advanceUsage.can_use_medium ? '✅' : '⚠️'} Bu Yılki Kullanım Durumunuz
                    </div>
                    <div className={`text-sm mt-2 ${
                      advanceUsage.can_use_medium ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <strong>{advanceRules.medium_days} günlük avans:</strong> {advanceUsage.used_medium_advances}/{advanceUsage.yearly_medium_limit} kez kullanıldı
                    </div>
                    {advanceUsage.can_use_medium ? (
                      <div className="text-sm text-green-700 mt-1 font-medium">
                        Kalan hakkınız: {advanceUsage.remaining_medium} kez
                      </div>
                    ) : (
                      <div className="text-sm text-red-700 mt-1 font-medium">
                        Yıllık limitiniz dolmuştur.
                      </div>
                    )}
                  </div>

                  <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-sm text-purple-800 font-medium">
                      ℹ️ Uzun Süre Alternatifi
                    </div>
                    <div className="text-sm text-purple-700 mt-1">
                      Eğer daha fazla süreye ihtiyacınız varsa, {advanceRules.extended_days} günlük seçeneğini de kullanabilirsiniz
                      (Yıllık limit: {advanceRules.yearly_extended_limit} defa)
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleUseMediumDaysStandard}
                      disabled={loadingAdvanceData}
                      className="flex-1"
                      data-testid="use-standard-from-medium-btn"
                    >
                      {advanceRules.standard_days} Gün (Standart)
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowMediumModal(false);
                        handleQuickDaysSelection(advanceRules.extended_days.toString());
                      }}
                      disabled={loadingAdvanceData}
                      className="flex-1"
                      data-testid="switch-to-extended-btn"
                    >
                      {advanceRules.extended_days} Gün (Uzun)
                    </Button>
                    
                    <Button
                      onClick={handleUseMediumDays}
                      disabled={loadingAdvanceData || !advanceUsage.can_use_medium}
                      className="btn-primary flex-1"
                      data-testid="use-medium-days-btn"
                    >
                      {advanceRules.medium_days} Gün Hakkını Kullan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Extended Days Modal (60 gün) */}
          {showExtendedModal && advanceRules && advanceUsage && (
            <Dialog open={showExtendedModal} onOpenChange={setShowExtendedModal}>
              <DialogContent data-testid="extended-days-modal" className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-center">
                    Uzun Süre Seçeneği ({advanceRules.extended_days} Gün)
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800 mb-2">
                      <strong>Standart kapama süresi {advanceRules.standard_days} gündür</strong>
                    </div>
                    <div className="text-sm text-blue-700">
                      Sadece yoğun sezon için bir takvim yılında en fazla {advanceRules.yearly_extended_limit} defa {advanceRules.extended_days} gün seçeneği sunulur.
                    </div>
                  </div>

                  <div className={`text-center p-3 border rounded-lg ${
                    advanceUsage.can_use_extended 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      advanceUsage.can_use_extended ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {advanceUsage.can_use_extended ? '✅' : '⚠️'} Bu Yılki Kullanım Durumunuz
                    </div>
                    <div className={`text-sm mt-2 ${
                      advanceUsage.can_use_extended ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <strong>{advanceRules.extended_days} günlük avans:</strong> {advanceUsage.used_extended_advances}/{advanceUsage.yearly_extended_limit} kez kullanıldı
                    </div>
                    {advanceUsage.can_use_extended ? (
                      <div className="text-sm text-green-700 mt-1 font-medium">
                        Kalan hakkınız: {advanceUsage.remaining_extended} kez
                      </div>
                    ) : (
                      <div className="text-sm text-red-700 mt-1 font-medium">
                        Yıllık limitiniz dolmuştur. Lütfen standart süreyi kullanın.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {advanceUsage.can_use_extended ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleUseExtendedDaysStandard}
                          disabled={loadingAdvanceData}
                          className="flex-1"
                          data-testid="use-standard-from-extended-btn"
                        >
                          {advanceRules.standard_days} Gün (Standart)
                        </Button>
                        <Button
                          onClick={handleUseExtendedDays}
                          disabled={loadingAdvanceData}
                          className="btn-primary flex-1"
                          data-testid="use-extended-days-btn"
                        >
                          {loadingAdvanceData ? (
                            <div className="loading-spinner mr-2"></div>
                          ) : (
                            <CheckIcon className="w-4 h-4 mr-2" />
                          )}
                          <span>Hakkı Kullan ({advanceRules.extended_days} Gün)</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleUseExtendedDaysStandard}
                        className="btn-primary w-full"
                        data-testid="only-standard-from-extended-btn"
                      >
                        Tamam ({advanceRules.standard_days} Gün)
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description" className="form-label">Açıklama *</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input min-h-[120px] resize-none"
              placeholder="Tutar, kategori ve proje girince otomatik doldurulur..."
              required
              rows={4}
              data-testid="description-input"
            />
          </div>

          {/* Request Date and Closure Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="request_date" className="form-label">Talep Tarihi *</Label>
              <Input
                id="request_date"
                type="date"
                value={formData.request_date}
                onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                className="form-input modern-date-picker"
                required
                data-testid="request-date-input"
              />
            </div>

            <div>
              <Label className="form-label">Kapama Tarihi *</Label>
              
              {/* Quick Days Selection */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  {advanceRules ? [
                    advanceRules.standard_days.toString(),
                    advanceRules.medium_days.toString(),
                    advanceRules.extended_days.toString()
                  ].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleQuickDaysSelection(days)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.closure_type === 'days' && formData.closure_days === days
                          ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } ${
                        // Disable extended days button if no rights left and rules enabled
                        advanceRules.rules_enabled && 
                        days === advanceRules.extended_days.toString() && 
                        advanceUsage && 
                        !advanceUsage.can_use_extended
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      disabled={
                        advanceRules.rules_enabled && 
                        days === advanceRules.extended_days.toString() && 
                        advanceUsage && 
                        !advanceUsage.can_use_extended
                      }
                      data-testid={`closure-${days}-days`}
                    >
                      {days} Gün
                      {/* Show rights info for medium and extended days when rules are enabled */}
                      {advanceRules.rules_enabled && (
                        <>
                          {days === advanceRules.medium_days.toString() && (
                            <span className="text-xs block">
                              ({advanceRules.yearly_medium_limit} hak/yıl)
                            </span>
                          )}
                          {days === advanceRules.extended_days.toString() && (
                            <span className="text-xs block text-teal-600">
                              ({advanceRules.yearly_extended_limit || 0} hak/yıl)
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )) : (
                    // Loading state or no rules
                    [15, 30, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                      >
                        {days} Gün
                      </button>
                    ))
                  )}
                </div>
                
                {/* Calculated Date Display */}
                {formData.closure_type === 'days' && formData.closure_date && (
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg" data-testid="calculated-closure-date">
                    <div className="flex items-center">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span>
                        <strong>Kapama Tarihi:</strong> {formatDateForDisplay(formData.closure_date)} 
                        <span className="text-gray-500 ml-2">
                          ({formData.closure_days} gün sonra)
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Date Selection - More Prominent */}
              <div className="mt-4 space-y-2 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <Label className="text-base font-semibold text-indigo-900">Özel Tarih Seçin</Label>
                </div>
                <p className="text-sm text-indigo-700 mb-3">
                  Yukarıdaki standart sürelerden farklı bir kapanış tarihi istiyorsanız buradan özel tarih belirleyebilirsiniz.
                </p>
                <Input
                  type="date"
                  value={formData.closure_type === 'date' ? formData.closure_date : ''}
                  onChange={(e) => setFormData({...formData, closure_type: 'date', closure_date: e.target.value, closure_days: ''})}
                  className="form-input modern-date-picker border-2 border-indigo-300 focus:border-indigo-500"
                  placeholder="dd.mm.yyyy"
                  data-testid="closure-date-input"
                  min={formData.request_date}
                />
                
                {/* Manual Date Display */}
                {formData.closure_type === 'date' && formData.closure_date && (
                  <div className="text-sm text-indigo-600 bg-white px-3 py-2 rounded-lg border border-indigo-200 mt-2" data-testid="manual-closure-date">
                    <div className="flex items-center">
                      <CheckIcon className="w-4 h-4 text-indigo-500 mr-2" />
                      <span>
                        <strong>Seçilen Kapama Tarihi:</strong> {formatDateForDisplay(formData.closure_date)}
                        {formData.request_date && (() => {
                          const startDate = new Date(formData.request_date);
                          const endDate = new Date(formData.closure_date);
                          const diffTime = Math.abs(endDate - startDate);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return (
                            <span className="text-indigo-500 ml-2 font-medium">
                              ({diffDays} gün sonra)
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <CheckIcon className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">Bilgilendirme</p>
              <p className="text-sm text-blue-700">
                Talebiniz oluşturulduktan sonra yöneticinize e-posta bildirimi gönderilecektir.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={loading || !formData.amount || !formData.category || !formData.project || !formData.description || !formData.closure_days || !eligibility?.can_request}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center"
              data-testid="submit-request-btn"
            >
              {loading ? (
                <div className="loading-spinner mr-2"></div>
              ) : (
                <PlusIcon className="w-5 h-5 mr-2" />
              )}
              <span>{loading ? 'Gönderiliyor...' : 'Talep Gönder'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Error Modal for Limit Exceeded */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg 
                  className="w-6 h-6 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <span className="text-red-900">{errorModalData.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Main Message */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="ml-3">
                  <p className="text-sm text-red-800 leading-relaxed">
                    {errorModalData.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Breakdown */}
            {errorModalData.details && Object.keys(errorModalData.details).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm">Detaylı Bilgi:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {errorModalData.details.requestedAmount && (
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-600">Talep Edilen Miktar:</span>
                      <span className="text-sm font-semibold text-gray-900">{errorModalData.details.requestedAmount}</span>
                    </div>
                  )}
                  {errorModalData.details.currentOpen && (
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-600">Mevcut Açık Avanslar:</span>
                      <span className="text-sm font-semibold text-gray-900">{errorModalData.details.currentOpen}</span>
                    </div>
                  )}
                  {errorModalData.details.maxLimit && (
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="text-sm text-blue-700 font-medium">Maksimum İzin Verilen Limit:</span>
                      <span className="text-sm font-bold text-blue-900">{errorModalData.details.maxLimit}</span>
                    </div>
                  )}
                  {errorModalData.details.remainingLimit && (
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-200">
                      <span className="text-sm text-green-700 font-medium">Kalan Kullanılabilir Limit:</span>
                      <span className="text-sm font-bold text-green-900">{errorModalData.details.remainingLimit}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Suggestion */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg 
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Önerilen Çözüm:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Talep miktarınızı kalan limit dahilinde düşürün</li>
                    <li>Veya mevcut açık avanslarınızdan birini kapatarak yeni limit oluşturun</li>
                    <li>Daha fazla bilgi için finans departmanı ile iletişime geçin</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowErrorModal(false)}
              className="px-6"
            >
              Kapat
            </Button>
            <Button
              onClick={() => {
                setShowErrorModal(false);
                // Focus on amount input
                document.querySelector('input[data-testid="request-amount-input"]')?.focus();
              }}
              className="px-6 bg-emerald-600 hover:bg-emerald-700"
            >
              Miktarı Düzenle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default NewRequest;
