import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import SearchableSelect from '../ui/SearchableSelect';
import { 
  Plus,
  Trash2,
  Save,
  CreditCard,
  Calendar,
  DollarSign,
  Package,
  Calculator,
  User,
  Building,
  Banknote,
  Receipt
} from 'lucide-react';

const NewCollectionForm = ({ onBackToDashboard }) => {
  // Number formatting functions (same as invoice form)
  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    
    // Convert to string and handle decimal places
    const numStr = parseFloat(value).toString();
    const parts = numStr.split('.');
    
    // Format integer part with thousands separator
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Handle decimal part (use comma as decimal separator)
    if (parts[1]) {
      return `${integerPart},${parts[1]}`;
    }
    
    return integerPart;
  };

  const parseNumber = (value) => {
    if (!value && value !== 0) return '';
    
    // Convert to string if it's a number
    const strValue = value.toString();
    
    // Remove thousand separators (dots) and convert comma to dot for parsing
    const cleanValue = strValue.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    
    return isNaN(num) ? '' : num;
  };

  // Validate decimal places for amounts (max 2 decimal places)
  const validateAmount = (value, itemType = '') => {
    if (!value && value !== 0) return { isValid: true, value: '', error: '' };
    
    // Convert to string for decimal place checking
    const strValue = value.toString();
    const cleanValue = strValue.replace(/\./g, '').replace(',', '.');
    
    // Check for valid number
    const num = parseFloat(cleanValue);
    if (isNaN(num)) {
      return { isValid: false, value: '', error: 'Geçerli bir sayı giriniz' };
    }
    
    // Check decimal places
    const parts = cleanValue.split('.');
    if (parts[1] && parts[1].length > 2) {
      return { 
        isValid: false, 
        value: num, 
        error: `${itemType === 'check' ? 'Çek t' : 'T'}utarı en fazla 2 ondalık basamağa sahip olabilir` 
      };
    }
    
    // Check for negative numbers
    if (num < 0) {
      return { 
        isValid: false, 
        value: num, 
        error: `${itemType === 'check' ? 'Çek t' : 'T'}utar negatif olamaz` 
      };
    }
    
    return { isValid: true, value: num, error: '' };
  };

  // Currencies
  const currencies = [
    { code: 'TL', symbol: '₺', name: 'Türk Lirası' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
  ];

  // Collection Types
  const collectionTypes = [
    { id: 'transfer', name: 'Havale/EFT', icon: Building },
    { id: 'cash', name: 'Nakit', icon: Banknote },
    { id: 'check', name: 'Çek', icon: Receipt },
    { id: 'promissory', name: 'Senet', icon: Package },
    { id: 'credit_card', name: 'Kredi Kartı', icon: CreditCard }
  ];

  const [formData, setFormData] = useState({
    // Main form fields
    customerId: '',
    supplierId: '',
    contactPersonId: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    
    // Collection items (can add multiple payment methods)
    collectionItems: [
      { 
        id: 1, 
        type: '', 
        amount: '', 
        currency: 'TL',
        // Transfer fields
        bankId: '',
        // Check fields
        checkDate: '',
        checkNumber: '',
        checkBank: '',
        // Promissory fields
        promissoryDate: '',
        promissoryNumber: '',
        promissoryBank: ''
      }
    ]
  });

  // Data state
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [projects, setProjects] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Totals
  const [totals, setTotals] = useState({
    totalCollected: 0,
    remaining: 0
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Mock Projects Data
  const mockProjects = [
    { id: '1', name: 'Dubai Expo 2025 Projesi', customer_id: '', description: 'Dubai fuarı organizasyon projesi' },
    { id: '2', name: 'İstanbul CNR Fuar Projesi', customer_id: '', description: 'CNR Expo İstanbul fuar projesi' },
    { id: '3', name: 'Almanya Hannover Messe 2025', customer_id: '', description: 'Hannover fuarı katılım projesi' },
    { id: '4', name: 'Tekstil Fuarı İzmir 2025', customer_id: '', description: 'İzmir tekstil fuarı projesi' },
    { id: '5', name: 'Gıda Teknolojileri Fuarı', customer_id: '', description: 'Gıda teknolojileri fuarı projesi' },
    { id: '6', name: 'Otomotiv Yan Sanayi Fuarı', customer_id: '', description: 'Otomotiv fuarı projesi' },
    { id: '7', name: 'Teknoloji Zirvesi 2025', customer_id: '', description: 'Teknoloji zirvesi organizasyonu' },
    { id: '8', name: 'Medikal Cihazlar Fuarı', customer_id: '', description: 'Medikal cihazlar fuarı projesi' },
    { id: '9', name: 'Enerji Teknolojileri Fuarı', customer_id: '', description: 'Enerji teknolojileri fuarı projesi' },
    { id: '10', name: 'İnşaat ve Yapı Fuarı 2025', customer_id: '', description: 'İnşaat fuarı projesi' }
  ];

  // Mock Contact Persons Data
  const mockContactPersons = [
    { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '+90 532 123 4567', company_id: '', type: 'customer' },
    { id: '2', name: 'Ayşe Kaya', email: 'ayse@example.com', phone: '+90 533 234 5678', company_id: '', type: 'customer' },
    { id: '3', name: 'Mehmet Öz', email: 'mehmet@example.com', phone: '+90 534 345 6789', company_id: '', type: 'supplier' },
    { id: '4', name: 'Fatma Demir', email: 'fatma@example.com', phone: '+90 535 456 7890', company_id: '', type: 'supplier' },
    { id: '5', name: 'Ali Çelik', email: 'ali@example.com', phone: '+90 536 567 8901', company_id: '', type: 'customer' }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Load customers, suppliers, and banks in parallel
      const [customersResponse, suppliersResponse, banksResponse] = await Promise.all([
        fetch(`${backendUrl}/api/customers`),
        fetch(`${backendUrl}/api/suppliers`),
        fetch(`${backendUrl}/api/banks`)
      ]);
      
      if (customersResponse.ok) {
        const customerData = await customersResponse.json();
        setCustomers(customerData);
        console.log('Customers loaded:', customerData.length);
      }
      
      if (suppliersResponse.ok) {
        const supplierData = await suppliersResponse.json();
        setSuppliers(supplierData);
        console.log('Suppliers loaded:', supplierData.length);
      }
      
      if (banksResponse.ok) {
        const bankData = await banksResponse.json();
        setBanks(bankData);
        console.log('Banks loaded:', bankData.length);
      }
      
      // Set mock data
      setProjects(mockProjects);
      setContactPersons(mockContactPersons);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set mock data on error
      setProjects(mockProjects);
      setContactPersons(mockContactPersons);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Calculate totals
  useEffect(() => {
    const totalCollected = formData.collectionItems.reduce((sum, item) => {
      return sum + (parseNumber(item.amount) || 0);
    }, 0);
    
    setTotals({
      totalCollected,
      remaining: 0 // No remaining since there's no total amount field
    });
  }, [formData.collectionItems]);

  // Handler functions
  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({
      ...prev,
      customerId: customerId,
      supplierId: '', // Clear supplier when customer is selected
      contactPersonId: '' // Clear contact person
    }));
  };

  const handleSupplierChange = (supplierId) => {
    setFormData(prev => ({
      ...prev,
      supplierId: supplierId,
      customerId: '', // Clear customer when supplier is selected
      contactPersonId: '' // Clear contact person
    }));
  };

  const addCollectionItem = () => {
    const newItem = {
      id: Date.now(),
      type: '',
      amount: '',
      currency: 'TL',
      bankId: '',
      checkDate: '',
      checkNumber: '',
      checkBank: '',
      promissoryDate: '',
      promissoryNumber: '',
      promissoryBank: ''
    };
    
    setFormData(prev => ({
      ...prev,
      collectionItems: [...prev.collectionItems, newItem]
    }));
  };

  const removeCollectionItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      collectionItems: prev.collectionItems.filter(item => item.id !== itemId)
    }));
  };

  const updateCollectionItem = (itemId, field, value) => {
    // Special validation for amount field
    if (field === 'amount') {
      const currentItem = formData.collectionItems.find(item => item.id === itemId);
      const validation = validateAmount(value, currentItem?.type);
      
      // Update validation errors
      setValidationErrors(prev => ({
        ...prev,
        [`amount_${itemId}`]: validation.isValid ? '' : validation.error
      }));
      
      // Only update if validation passes or if clearing the field
      if (validation.isValid || value === '') {
        setFormData(prev => ({
          ...prev,
          collectionItems: prev.collectionItems.map(item => 
            item.id === itemId ? { ...item, [field]: validation.value } : item
          )
        }));
      }
    } else {
      // Regular field update
      setFormData(prev => ({
        ...prev,
        collectionItems: prev.collectionItems.map(item => 
          item.id === itemId ? { ...item, [field]: value } : item
        )
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerId && !formData.supplierId) {
      alert('Lütfen müşteri veya tedarikçi seçiniz');
      return;
    }
    
    if (formData.customerId && formData.supplierId) {
      alert('Müşteri ve tedarikçi aynı anda seçilemez');
      return;
    }
    
    if (formData.collectionItems.length === 0) {
      alert('Lütfen en az bir tahsilat türü ekleyiniz');
      return;
    }
    
    // Check if at least one collection item has amount
    const totalCollected = formData.collectionItems.reduce((sum, item) => sum + (parseNumber(item.amount) || 0), 0);
    if (totalCollected <= 0) {
      alert('Lütfen tahsilat tutarlarını giriniz');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const collectionData = {
        customer_type: formData.customerId ? 'customer' : 'supplier',
        customer_id: formData.customerId || null,
        supplier_id: formData.supplierId || null,
        contact_person_id: formData.contactPersonId,
        date: formData.date,
        project_id: formData.projectId,
        total_amount: totalCollected, // Use calculated total from collection items
        currency: 'TL', // Default currency
        collection_items: formData.collectionItems.map(item => ({
          type: item.type,
          amount: parseNumber(item.amount),
          currency: item.currency,
          bank_id: item.bankId || null,
          check_date: item.checkDate || null,
          check_number: item.checkNumber || null,
          check_bank: item.checkBank || null,
          promissory_date: item.promissoryDate || null,
          promissory_number: item.promissoryNumber || null,
          promissory_bank: item.promissoryBank || null
        }))
      };
      
      console.log('Submitting collection:', collectionData);
      
      const response = await axios.post(`${backendUrl}/api/collections`, collectionData);
      console.log('Collection created successfully:', response.data);
      
      alert('Tahsilat başarıyla kaydedildi ve makbuz gönderildi!');
      onBackToDashboard();
      
    } catch (error) {
      console.error('Collection submission error:', error);
      let errorMessage = 'Bilinmeyen bir hata oluştu';
      
      if (error.response) {
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.message || errorData.error || `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      } else {
        errorMessage = error.message || 'Beklenmeyen bir hata oluştu';
      }
      
      alert(`Tahsilat kaydedilemedi: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default to TL currency symbol
  const defaultCurrency = currencies.find(c => c.code === 'TL');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Tahsilat</h1>
            <p className="text-gray-600">Müşteri ve tedarikçi tahsilatlarını kaydedin</p>
          </div>
        </div>
        <Button
          onClick={onBackToDashboard}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <span>Dashboard'a Dön</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri
              </label>
              <SearchableSelect
                options={customers.map(customer => ({
                  id: customer.id,
                  label: customer.companyName,
                  sublabel: `${customer.city || ''} ${customer.country || ''}`.trim() || customer.email
                }))}
                value={formData.customerId}
                onChange={handleCustomerChange}
                placeholder={isLoadingData ? "Müşteriler yükleniyor..." : "Müşteri seçiniz..."}
                searchPlaceholder="Müşteri ara..."
                disabled={isLoadingData || formData.supplierId} // Disable if supplier is selected
                className="w-full"
              />
            </div>

            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tedarikçi
              </label>
              <SearchableSelect
                options={suppliers.map(supplier => ({
                  id: supplier.id,
                  label: supplier.company_short_name,
                  sublabel: `${supplier.city || ''} ${supplier.country || ''}`.trim() || supplier.email
                }))}
                value={formData.supplierId}
                onChange={handleSupplierChange}
                placeholder={isLoadingData ? "Tedarikçiler yükleniyor..." : "Tedarikçi seçiniz..."}
                searchPlaceholder="Tedarikçi ara..."
                disabled={isLoadingData || formData.customerId} // Disable if customer is selected
                className="w-full"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* Contact Person */}
            {(formData.customerId || formData.supplierId) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetkili Kişi
                </label>
                <SearchableSelect
                  options={contactPersons
                    .filter(person => 
                      (formData.customerId && person.type === 'customer') ||
                      (formData.supplierId && person.type === 'supplier')
                    )
                    .map(person => ({
                      id: person.id,
                      label: person.name,
                      sublabel: `${person.email} - ${person.phone}`
                    }))
                  }
                  value={formData.contactPersonId}
                  onChange={(id) => setFormData(prev => ({ ...prev, contactPersonId: id }))}
                  placeholder="Yetkili kişi seçiniz..."
                  searchPlaceholder="Kişi ara..."
                  className="w-full"
                />
              </div>
            )}

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje
              </label>
              <SearchableSelect
                options={projects.map(project => ({
                  id: project.id,
                  label: project.name,
                  sublabel: project.description
                }))}
                value={formData.projectId}
                onChange={(id) => setFormData(prev => ({ ...prev, projectId: id }))}
                placeholder="Proje seçiniz..."
                searchPlaceholder="Proje ara..."
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Collection Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">Tahsilat Türleri</h3>
            </div>
          </div>

          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-16">Sıra No</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Tahsilat Türü</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Tutar</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-24">Para Birimi</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-48">Ek Bilgiler</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-20">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {formData.collectionItems.map((item, index) => {
                  const TypeIcon = collectionTypes.find(t => t.id === item.type)?.icon || Package;
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      {/* Row Number */}
                      <td className="py-3 px-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </td>
                      
                      {/* Collection Type */}
                      <td className="py-3 px-2">
                        <Select 
                          value={item.type} 
                          onValueChange={(value) => updateCollectionItem(item.id, 'type', value)}
                        >
                          <SelectTrigger className="w-full min-w-[200px]">
                            <SelectValue placeholder="Tür seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {collectionTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center space-x-2">
                                  <type.icon className="h-4 w-4" />
                                  <span>{type.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      {/* Amount */}
                      <td className="py-3 px-2">
                        <Input
                          type="text"
                          value={item.amount ? formatNumber(item.amount) : ''}
                          onChange={(e) => {
                            const value = parseNumber(e.target.value);
                            updateCollectionItem(item.id, 'amount', value);
                          }}
                          placeholder="0,00"
                          className="w-full"
                        />
                      </td>
                      
                      {/* Currency */}
                      <td className="py-3 px-2">
                        <Select 
                          value={item.currency} 
                          onValueChange={(value) => updateCollectionItem(item.id, 'currency', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      {/* Additional Info */}
                      <td className="py-3 px-2">
                        {/* Bank Selection for Transfer */}
                        {item.type === 'transfer' && (
                          <SearchableSelect
                            options={banks.map(bank => ({
                              id: bank.id,
                              label: bank.bank_name,
                              sublabel: `${bank.country} - ${bank.iban || bank.us_account_number || ''}`
                            }))}
                            value={item.bankId}
                            onChange={(value) => updateCollectionItem(item.id, 'bankId', value)}
                            placeholder="Banka seçin..."
                            searchPlaceholder="Banka ara..."
                            className="w-full min-w-[200px]"
                          />
                        )}
                        
                        {/* Check Fields */}
                        {item.type === 'check' && (
                          <div className="grid grid-cols-1 gap-2 min-w-[200px]">
                            <Input
                              type="date"
                              value={item.checkDate}
                              onChange={(e) => updateCollectionItem(item.id, 'checkDate', e.target.value)}
                              placeholder="Çek Tarihi"
                              className="text-xs"
                            />
                            <Input
                              type="text"
                              value={item.checkNumber}
                              onChange={(e) => updateCollectionItem(item.id, 'checkNumber', e.target.value)}
                              placeholder="Çek No"
                              className="text-xs"
                            />
                            <Input
                              type="text"
                              value={item.checkBank}
                              onChange={(e) => updateCollectionItem(item.id, 'checkBank', e.target.value)}
                              placeholder="Çek Bankası"
                              className="text-xs"
                            />
                          </div>
                        )}
                        
                        {/* Promissory Note Fields */}
                        {item.type === 'promissory' && (
                          <div className="grid grid-cols-1 gap-2 min-w-[200px]">
                            <Input
                              type="date"
                              value={item.promissoryDate}
                              onChange={(e) => updateCollectionItem(item.id, 'promissoryDate', e.target.value)}
                              placeholder="Senet Tarihi"
                              className="text-xs"
                            />
                            <Input
                              type="text"
                              value={item.promissoryNumber}
                              onChange={(e) => updateCollectionItem(item.id, 'promissoryNumber', e.target.value)}
                              placeholder="Senet No"
                              className="text-xs"
                            />
                            <Input
                              type="text"
                              value={item.promissoryBank}
                              onChange={(e) => updateCollectionItem(item.id, 'promissoryBank', e.target.value)}
                              placeholder="Senet Bankası"
                              className="text-xs"
                            />
                          </div>
                        )}
                        
                        {/* Cash and Credit Card - No additional fields */}
                        {(item.type === 'cash' || item.type === 'credit_card' || !item.type) && (
                          <div className="text-sm text-gray-500 italic">
                            {item.type === 'cash' && 'Nakit ödeme'}
                            {item.type === 'credit_card' && 'Kredi kartı ödemesi'}
                            {!item.type && 'Tür seçiniz'}
                          </div>
                        )}
                      </td>
                      
                      {/* Action Buttons */}
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1">
                          {/* Add Button - Always show */}
                          <button
                            type="button"
                            onClick={addCollectionItem}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Yeni satır ekle"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          {/* Remove Button - Only show if more than 1 item */}
                          {formData.collectionItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCollectionItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Satırı sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-1 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Toplam Tahsilat Tutarı</p>
              <p className="text-2xl font-bold text-green-600">
                ₺{formatNumber(totals.totalCollected)}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToDashboard}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || totals.totalCollected <= 0}
            className="flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Calculator className="h-4 w-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Tahsilat Yap</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewCollectionForm;