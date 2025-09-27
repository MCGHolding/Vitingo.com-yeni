import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import SearchableSelect from '../ui/SearchableSelect';
import AddProductModal from './AddProductModal';
import { 
  Plus,
  Trash2,
  Save,
  FileText,
  Calendar,
  DollarSign,
  Package,
  Calculator,
  User,
  Building
} from 'lucide-react';

const NewInvoiceForm = ({ onBackToDashboard }) => {
  // Number formatting functions
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

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    customerId: '', // Selected customer ID
    customerName: '', // Manual customer name input
    items: [
      { id: 1, name: '', quantity: '', unit: 'adet', unitPrice: '', total: 0 }
    ],
    vatRate: 20,
    discount: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    conditions: 'Fatura tarihi itibariyle vadesi gelmiş alacaklarımız için %2 aylık gecikme faizi uygulanacaktır. Bu fatura elektronik ortamda oluşturulmuş olup imzaya ihtiyaç duymamaktadır.',
    paymentTerm: '30'
  });

  // Customer and Products state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [totals, setTotals] = useState({
    subtotal: 0,
    vatAmount: 0,
    discountAmount: 0,
    total: 0
  });

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'TL', symbol: '₺', name: 'Turkish Lira' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
  ];

  const paymentTerms = [
    { value: '0', label: 'Peşin' },
    { value: '15', label: '15 Gün' },
    { value: '30', label: '30 Gün' },
    { value: '45', label: '45 Gün' },
    { value: '60', label: '60 Gün' },
    { value: '90', label: '90 Gün' }
  ];

  // Generate unique invoice number
  const generateInvoiceNumber = (currency, date) => {
    const invoiceDate = new Date(date);
    const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const year = invoiceDate.getFullYear();
    
    // For demo purposes, using a simple counter (in real app, this would come from backend)
    const invoiceCounter = String(1001).padStart(6, '0');
    
    return `${currency}-${month}${year}${invoiceCounter}`;
  };

  // Update invoice number when currency or date changes
  useEffect(() => {
    const newInvoiceNumber = generateInvoiceNumber(formData.currency, formData.date);
    setFormData(prev => ({
      ...prev,
      invoiceNumber: newInvoiceNumber
    }));
  }, [formData.currency, formData.date]);

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountValue = parseNumber(formData.discount) || 0;
    
    // Calculate discount amount based on discount type
    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (formData.discountType === 'fixed') {
      discountAmount = discountValue;
    }
    
    const discountedSubtotal = subtotal - discountAmount;
    const vatAmount = (discountedSubtotal * formData.vatRate) / 100;
    const total = discountedSubtotal + vatAmount;

    setTotals({
      subtotal,
      vatAmount,
      discountAmount,
      total
    });
  }, [formData.items, formData.vatRate, formData.discount, formData.discountType]);

  // Load customers and products on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Load customers and products in parallel
      const [customersResponse, productsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/customers`),
        fetch(`${backendUrl}/api/products`)
      ]);
      
      if (customersResponse.ok) {
        const customerData = await customersResponse.json();
        setCustomers(customerData);
      }
      
      if (productsResponse.ok) {
        const productData = await productsResponse.json();
        setProducts(productData);
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customerId
    }));
  };

  const handleProductSelect = (itemId, productId) => {
    const product = products.find(p => p.id === productId);
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: productId,
            name: product ? product.name : '',
            unit: product ? product.unit : 'adet',
            unitPrice: product ? product.default_price : '',
            total: calculateItemTotal(item.quantity, product ? product.default_price : 0)
          };
        }
        return item;
      })
    }));
  };

  const calculateItemTotal = (quantity, unitPrice) => {
    const qty = parseNumber(quantity) || 0;
    const price = parseNumber(unitPrice) || 0;
    return qty * price;
  };

  const handleCurrencyChange = (currency) => {
    setFormData(prev => ({
      ...prev,
      currency
    }));
  };

  const handleDateChange = (date) => {
    // Validate date (cannot be from previous year)
    const selectedDate = new Date(date);
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    if (selectedDate.getFullYear() < previousYear) {
      alert('Fatura tarihi bir önceki yıldan olamaz');
      return;
    }

    setFormData(prev => ({
      ...prev,
      date
    }));
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item };
        
        if (field === 'quantity' || field === 'unitPrice') {
          // Parse the number value
          const numValue = parseNumber(value);
          updatedItem[field] = numValue;
          
          // Calculate total for this item
          const qty = parseNumber(updatedItem.quantity) || 0;
          const price = parseNumber(updatedItem.unitPrice) || 0;
          updatedItem.total = qty * price;
        } else {
          updatedItem[field] = value;
        }
        
        return updatedItem;
      }
      return item;
    });

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addNewItem = () => {
    const newId = Math.max(...formData.items.map(item => item.id)) + 1;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: newId,
        name: '',
        quantity: '',
        unit: 'adet',
        unitPrice: '',
        total: 0
      }]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const handleProductAdded = async (newProduct) => {
    // Refresh products list to include the newly added product
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/products`);
      
      if (response.ok) {
        const productData = await response.json();
        setProducts(productData);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const validItems = formData.items.filter(item => item.name && item.name.trim());
    
    if (validItems.length === 0) {
      alert('En az bir ürün/hizmet adı girilmelidir');
      return;
    }

    // Validate that each item has required fields
    const invalidItems = validItems.filter(item => 
      !item.name.trim() || 
      isNaN(parseNumber(item.quantity)) || 
      parseNumber(item.quantity) <= 0 ||
      isNaN(parseNumber(item.unitPrice)) ||
      parseNumber(item.unitPrice) <= 0
    );

    if (invalidItems.length > 0) {
      alert('Tüm ürün/hizmetler için geçerli miktar ve birim fiyat girilmelidir');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Create invoice object for backend
      const invoice = {
        invoice_number: formData.invoiceNumber || `INV-${Date.now()}`,
        customer_id: formData.customerId || null,
        customer_name: selectedCustomer ? selectedCustomer.companyName : (formData.customerName || 'Genel Müşteri'),
        date: formData.date,
        currency: formData.currency,
        items: validItems.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          product_id: item.productId || null,
          name: item.name.trim(),
          quantity: parseFloat(parseNumber(item.quantity)) || 1,
          unit: item.unit || 'adet',
          unit_price: parseFloat(parseNumber(item.unitPrice)) || 0,
          total: parseFloat(item.total) || 0
        })),
        subtotal: parseFloat(totals.subtotal) || 0,
        vat_rate: parseFloat(formData.vatRate) || 0,
        vat_amount: parseFloat(totals.vatAmount) || 0,
        discount: parseFloat(parseNumber(formData.discount)) || 0,
        discount_type: formData.discountType || 'percentage',
        discount_amount: parseFloat(totals.discountAmount) || 0,
        total: parseFloat(totals.total) || 0,
        conditions: formData.conditions || '',
        payment_term: formData.paymentTerm || '30'
      };

      console.log('Sending invoice data to backend:', JSON.stringify(invoice, null, 2));

      const response = await fetch(`${backendUrl}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice)
      });

      if (response.ok) {
        const savedInvoice = await response.json();
        console.log('Invoice saved successfully:', savedInvoice);
        
        // Show success modal
        setShowSuccessModal(true);
      } else {
        // Handle different error types
        let errorMessage = 'Fatura kaydedilirken hata oluştu';
        
        try {
          const errorData = await response.json();
          console.error('Backend error:', errorData);
          
          // Handle different error response formats
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      
      // Better error display
      let displayMessage = 'Bilinmeyen bir hata oluştu';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        displayMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
      } else if (error.message) {
        displayMessage = error.message;
      }
      
      alert(`Fatura kaydedilemedi: ${displayMessage}`);
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Fatura</h1>
            <p className="text-gray-600">Modern fatura oluşturma sistemi</p>
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
        {/* Invoice Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-start mb-8">
            {/* Company Logo & Info */}
            <div className="flex flex-col">
              <div className="w-48 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">BAŞARI</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Başarı Uluslararası Fuarcılık A.Ş.</p>
                <p>Küçükyalı Merkez Mh. Şevki Çavuş Sok.</p>
                <p>Merve Apt. No:9/7</p>
                <p>34840 Maltepe / İstanbul</p>
                <p className="mt-2 font-medium">Tel: +90 216 123 45 67</p>
                <p className="text-xs text-gray-500 mt-2">Küçükyalı Vergi Dairesi</p>
                <p className="text-xs text-gray-500">7210421828</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">FATURA</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fatura No:</label>
                  <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                    {formData.invoiceNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Currency, Date and Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Para Birimi
              </label>
              <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-gray-500">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date - Daraltılmış */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tarih
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-10"
                required
              />
            </div>

            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Müşteri Seç *
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
              
              {/* Fallback Manual Customer Input */}
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Veya müşteri adını manuel giriniz:
                </label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Örn: ABC Şirketi"
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Selected Customer Info */}
          {selectedCustomer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Fatura Kesilecek Müşteri
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-semibold">{selectedCustomer.companyName}</p>
                {selectedCustomer.companyTitle && (
                  <p className="text-blue-700">Ünvan: {selectedCustomer.companyTitle}</p>
                )}
                <p>{selectedCustomer.address}</p>
                <p>{selectedCustomer.city} {selectedCustomer.country}</p>
                {selectedCustomer.phone && <p>Tel: {selectedCustomer.phone}</p>}
                {selectedCustomer.taxOffice && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-600">
                      {selectedCustomer.taxOffice} - {selectedCustomer.taxNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">Ürün ve Hizmetler</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Ürün Ekle</span>
            </Button>
          </div>

          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-16">Sıra No</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Ürün ve Hizmet Adı</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-24">Miktar</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-24">Birim</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Birim Fiyat</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-32">Tutar</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 w-16">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <SearchableSelect
                        options={products.map(product => ({
                          id: product.id,
                          label: product.name,
                          sublabel: `${product.default_price ? formatNumber(product.default_price) + ' ' + product.currency : ''} / ${product.unit}`.trim(),
                          data: product
                        }))}
                        value={item.productId || ''}
                        onChange={(productId) => handleProductSelect(item.id, productId)}
                        placeholder="Ürün/Hizmet seçin..."
                        searchPlaceholder="Ürün ara..."
                        className="min-w-[300px]"
                        emptyMessage="Ürün bulunamadı"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="text"
                        value={item.quantity ? formatNumber(item.quantity) : ''}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="adet">Adet</option>
                        <option value="kg">Kg</option>
                        <option value="m2">M²</option>
                        <option value="m3">M³</option>
                        <option value="lt">Litre</option>
                        <option value="saat">Saat</option>
                        <option value="gün">Gün</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">
                          {selectedCurrency?.symbol}
                        </span>
                        <Input
                          type="text"
                          value={item.unitPrice ? formatNumber(item.unitPrice) : ''}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-8"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="bg-gray-50 px-3 py-2 rounded font-medium">
                        {selectedCurrency?.symbol}{formatNumber(item.total.toFixed(2))}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={addNewItem}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Yeni satır ekle"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Satırı sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Calculator className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Hesaplamalar</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">KDV Oranı (%)</label>
                <select
                  value={formData.vatRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vatRate: parseFloat(e.target.value) }))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 25 }, (_, i) => i + 1).map(rate => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İskonto Türü</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'percentage', discount: '' }))}
                    className={`p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      formData.discountType === 'percentage'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    Yüzdelik (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'fixed', discount: '' }))}
                    className={`p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      formData.discountType === 'fixed'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    Sabit Tutar ({selectedCurrency?.symbol || '$'})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 text-sm">
                    {formData.discountType === 'percentage' ? '%' : selectedCurrency?.symbol || '$'}
                  </span>
                  <Input
                    type="text"
                    value={formData.discount ? formatNumber(formData.discount) : ''}
                    onChange={(e) => {
                      const value = parseNumber(e.target.value);
                      setFormData(prev => ({ ...prev, discount: value }));
                    }}
                    placeholder={formData.discountType === 'percentage' ? '0,00' : '0,00'}
                    className="pl-8"
                  />
                </div>
                {formData.discountType === 'percentage' && formData.discount > 100 && (
                  <p className="text-xs text-red-600 mt-1">İskonto oranı %100'den fazla olamaz</p>
                )}
                {formData.discountType === 'fixed' && parseNumber(formData.discount) > totals.subtotal && (
                  <p className="text-xs text-red-600 mt-1">Sabit iskonto ara toplamdan fazla olamaz</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vade</label>
                <select
                  value={formData.paymentTerm}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerm: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentTerms.map(term => (
                    <option key={term.value} value={term.value}>{term.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Fatura Özeti</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">{selectedCurrency?.symbol}{formatNumber(totals.subtotal.toFixed(2))}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>
                      İskonto ({formatNumber(formData.discount)}{formData.discountType === 'percentage' ? '%' : selectedCurrency?.symbol}):
                    </span>
                    <span>-{selectedCurrency?.symbol}{formatNumber(totals.discountAmount.toFixed(2))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">KDV ({formData.vatRate}%):</span>
                  <span className="font-medium">{selectedCurrency?.symbol}{formatNumber(totals.vatAmount.toFixed(2))}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Genel Toplam:</span>
                  <span className="text-blue-600">{selectedCurrency?.symbol}{formatNumber(totals.total.toFixed(2))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Koşullar ve Şartlar</h3>
          <textarea
            value={formData.conditions}
            onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Koşullar ve şartlar..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Fatura Oluşturuluyor...' : 'Fatura Oluştur'}
          </Button>
        </div>
      </form>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          onProductAdded={handleProductAdded}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]" 
             style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center animate-pulse">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎉 Tebrikler!</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                <strong>Yeni bir fatura oluşturdunuz!</strong>
                <br /><br />
                Faturanız yönetici onayına sunulmuştur.
                <br /><br />
                Faturanızın durumunu <span className="font-bold text-blue-600">Onay Bekleyen Faturalar</span> bölümünden takip edebilirsiniz.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  onBackToDashboard();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
              >
                📊 Dashboard'a Dön
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Reset form for new invoice
                  setFormData({
                    invoiceNumber: '',
                    currency: 'USD',
                    date: new Date().toISOString().split('T')[0],
                    customerId: '',
                    items: [
                      { id: 1, name: '', quantity: '', unit: 'adet', unitPrice: '', total: 0 }
                    ],
                    vatRate: 20,
                    discount: '',
                    discountType: 'percentage',
                    conditions: 'Fatura tarihi itibariyle vadesi gelmiş alacaklarımız için %2 aylık gecikme faizi uygulanacaktır. Bu fatura elektronik ortamda oluşturulmuş olup imzaya ihtiyaç duymamaktadır.',
                    paymentTerm: '30'
                  });
                }}
                variant="outline"
                className="flex-1 py-3 text-base font-semibold"
              >
                ➕ Yeni Fatura
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInvoiceForm;