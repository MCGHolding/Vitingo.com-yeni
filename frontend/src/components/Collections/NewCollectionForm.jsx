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
    totalAmount: '',
    currency: 'TL',
    
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
    
    const totalAmount = parseNumber(formData.totalAmount) || 0;
    const remaining = totalAmount - totalCollected;
    
    setTotals({
      totalCollected,
      remaining
    });
  }, [formData.collectionItems, formData.totalAmount]);

  // Handler functions
  const handleCustomerTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      customerType: type,
      customerId: '',
      supplierId: '',
      contactPersonId: ''
    }));
  };

  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({
      ...prev,
      customerId: customerId
    }));
  };

  const handleSupplierChange = (supplierId) => {
    setFormData(prev => ({
      ...prev,
      supplierId: supplierId
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
    setFormData(prev => ({
      ...prev,
      collectionItems: prev.collectionItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerType) {
      alert('Lütfen müşteri veya tedarikçi seçiniz');
      return;
    }
    
    if (formData.customerType === 'customer' && !formData.customerId) {
      alert('Lütfen müşteri seçiniz');
      return;
    }
    
    if (formData.customerType === 'supplier' && !formData.supplierId) {
      alert('Lütfen tedarikçi seçiniz');
      return;
    }
    
    if (!formData.totalAmount) {
      alert('Lütfen tahsilat tutarı giriniz');
      return;
    }
    
    if (formData.collectionItems.length === 0) {
      alert('Lütfen en az bir tahsilat türü ekleyiniz');
      return;
    }
    
    // Check if total amounts match
    if (Math.abs(totals.remaining) > 0.01) {
      alert('Tahsilat tutarı ile tahsilat türlerinin toplamı eşit olmalıdır');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const collectionData = {
        customer_type: formData.customerType,
        customer_id: formData.customerType === 'customer' ? formData.customerId : null,
        supplier_id: formData.customerType === 'supplier' ? formData.supplierId : null,
        contact_person_id: formData.contactPersonId,
        date: formData.date,
        project_id: formData.projectId,
        total_amount: parseNumber(formData.totalAmount),
        currency: formData.currency,
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

  const selectedCurrency = currencies.find(c => c.code === formData.currency);

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
            {/* Customer Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahsilat Türü *
              </label>
              <Select 
                value={formData.customerType} 
                onValueChange={handleCustomerTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri veya Tedarikçi seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Müşteriden Tahsilat</SelectItem>
                  <SelectItem value="supplier">Tedarikçiye Ödeme</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Customer Selection */}
            {formData.customerType === 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
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
                  disabled={isLoadingData}
                  className="w-full"
                />
              </div>
            )}

            {/* Supplier Selection */}
            {formData.customerType === 'supplier' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tedarikçi *
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
                  disabled={isLoadingData}
                  className="w-full"
                />
              </div>
            )}

            {/* Contact Person */}
            {(formData.customerId || formData.supplierId) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetkili Kişi
                </label>
                <SearchableSelect
                  options={contactPersons
                    .filter(person => 
                      (formData.customerType === 'customer' && person.type === 'customer') ||
                      (formData.customerType === 'supplier' && person.type === 'supplier')
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

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahsilat Tutarı *
              </label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={formData.totalAmount ? formatNumber(formData.totalAmount) : ''}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    setFormData(prev => ({ ...prev, totalAmount: value }));
                  }}
                  placeholder="0,00"
                  className="flex-1"
                />
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="w-24">
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
              </div>
            </div>
          </div>
        </div>

        {/* Collection Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">Tahsilat Türleri</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCollectionItem}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Tahsilat Türü Ekle</span>
            </Button>
          </div>

          <div className="space-y-4">
            {formData.collectionItems.map((item, index) => {
              const TypeIcon = collectionTypes.find(t => t.id === item.type)?.icon || Package;
              
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* Row Number */}
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium mt-2">
                      {index + 1}
                    </div>
                    
                    {/* Collection Type */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tahsilat Türü
                        </label>
                        <Select 
                          value={item.type} 
                          onValueChange={(value) => updateCollectionItem(item.id, 'type', value)}
                        >
                          <SelectTrigger>
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
                      </div>
                      
                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tutar
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={item.amount ? formatNumber(item.amount) : ''}
                            onChange={(e) => {
                              const value = parseNumber(e.target.value);
                              updateCollectionItem(item.id, 'amount', value);
                            }}
                            placeholder="0,00"
                            className="flex-1"
                          />
                          <Select 
                            value={item.currency} 
                            onValueChange={(value) => updateCollectionItem(item.id, 'currency', value)}
                          >
                            <SelectTrigger className="w-24">
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
                        </div>
                      </div>
                      
                      {/* Bank Selection for Transfer */}
                      {item.type === 'transfer' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Banka Hesabı
                          </label>
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
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    {formData.collectionItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCollectionItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300 mt-7"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Additional Fields for Check */}
                  {item.type === 'check' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ml-12">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Çek Tarihi
                        </label>
                        <Input
                          type="date"
                          value={item.checkDate}
                          onChange={(e) => updateCollectionItem(item.id, 'checkDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Çek No
                        </label>
                        <Input
                          type="text"
                          value={item.checkNumber}
                          onChange={(e) => updateCollectionItem(item.id, 'checkNumber', e.target.value)}
                          placeholder="Çek numarası"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Çek Bankası
                        </label>
                        <Input
                          type="text"
                          value={item.checkBank}
                          onChange={(e) => updateCollectionItem(item.id, 'checkBank', e.target.value)}
                          placeholder="Banka adı"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Fields for Promissory Note */}
                  {item.type === 'promissory' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ml-12">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senet Tarihi
                        </label>
                        <Input
                          type="date"
                          value={item.promissoryDate}
                          onChange={(e) => updateCollectionItem(item.id, 'promissoryDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senet No
                        </label>
                        <Input
                          type="text"
                          value={item.promissoryNumber}
                          onChange={(e) => updateCollectionItem(item.id, 'promissoryNumber', e.target.value)}
                          placeholder="Senet numarası"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senet Bankası
                        </label>
                        <Input
                          type="text"
                          value={item.promissoryBank}
                          onChange={(e) => updateCollectionItem(item.id, 'promissoryBank', e.target.value)}
                          placeholder="Banka adı"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Toplam Tahsilat Tutarı</p>
              <p className="text-2xl font-bold text-blue-600">
                {selectedCurrency.symbol}{formatNumber(formData.totalAmount || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Toplanan Tutar</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedCurrency.symbol}{formatNumber(totals.totalCollected)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Kalan Tutar</p>
              <p className={`text-2xl font-bold ${Math.abs(totals.remaining) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedCurrency.symbol}{formatNumber(totals.remaining)}
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
            disabled={isSubmitting || Math.abs(totals.remaining) > 0.01}
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