import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import SearchableSelect from '../ui/SearchableSelect';
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
    items: [
      { id: 1, name: '', quantity: '', unit: 'adet', unitPrice: '', total: 0 }
    ],
    vatRate: 20,
    discount: '',
    conditions: 'Fatura tarihi itibariyle vadesi gelmiş alacaklarımız için %2 aylık gecikme faizi uygulanacaktır. Bu fatura elektronik ortamda oluşturulmuş olup imzaya ihtiyaç duymamaktadır.',
    paymentTerm: '30'
  });

  // Customer and Products state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

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
    const discountPercent = parseNumber(formData.discount) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const vatAmount = (discountedSubtotal * formData.vatRate) / 100;
    const total = discountedSubtotal + vatAmount;

    setTotals({
      subtotal,
      vatAmount,
      discountAmount,
      total
    });
  }, [formData.items, formData.vatRate, formData.discount]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.items.some(item => item.name.trim())) {
      alert('En az bir ürün/hizmet adı girilmelidir');
      return;
    }

    // Create invoice object
    const invoice = {
      id: Date.now(), // Simple ID generation
      invoiceNumber: formData.invoiceNumber,
      customerName: 'Demo Müşteri', // In real app, this would come from customer selection
      date: formData.date,
      currency: formData.currency,
      amount: totals.total,
      status: 'draft',
      items: formData.items.filter(item => item.name.trim()).length,
      details: {
        ...formData,
        totals: totals
      }
    };

    // Save to localStorage (in real app, would save to backend)
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    existingInvoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));

    console.log('Invoice Data:', formData);
    console.log('Totals:', totals);
    
    alert('Fatura başarıyla oluşturuldu!');
    onBackToDashboard();
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
              <div className="grid grid-cols-3 gap-2">
                {currencies.slice(0, 3).map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      formData.currency === currency.code
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-sm font-bold">{currency.symbol}</div>
                      <div className="text-xs">{currency.code}</div>
                    </div>
                  </button>
                ))}
              </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
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

          <div className="overflow-x-auto">
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
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Ürün/Hizmet adı giriniz"
                        className="w-full"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">İskonto (%)</label>
                <Input
                  type="text"
                  value={formData.discount ? formatNumber(formData.discount) : ''}
                  onChange={(e) => {
                    const value = parseNumber(e.target.value);
                    setFormData(prev => ({ ...prev, discount: value }));
                  }}
                  placeholder="0,00"
                />
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
                    <span>İskonto ({formatNumber(formData.discount)}%):</span>
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
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Fatura Oluştur
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewInvoiceForm;