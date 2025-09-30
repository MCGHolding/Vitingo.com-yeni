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
  Building,
  ArrowLeft
} from 'lucide-react';

const EditInvoiceForm = ({ invoice, onBackToAllInvoices, onSaveSuccess }) => {
  // Number formatting functions
  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    
    const numStr = parseFloat(value).toString();
    const parts = numStr.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (parts[1]) {
      return `${integerPart},${parts[1]}`;
    }
    
    return integerPart;
  };

  const parseNumber = (value) => {
    if (!value && value !== 0) return '';
    
    const strValue = value.toString();
    const cleanValue = strValue.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    
    return isNaN(num) ? '' : num;
  };

  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoice_number || '',
    currency: invoice?.currency || 'USD',
    date: invoice?.date || new Date().toISOString().split('T')[0],
    customerId: invoice?.customer_id || '',
    items: invoice?.items || [
      { id: 1, name: '', quantity: '', unit: 'adet', unitPrice: '', total: 0 }
    ],
    vatRate: invoice?.vat_rate || 20,
    discount: invoice?.discount || '',
    discountType: invoice?.discount_type || 'percentage',
    conditions: invoice?.conditions || 'Fatura tarihi itibariyle vadesi gelmiş alacaklarımız için %2 aylık gecikme faizi uygulanacaktır. Bu fatura elektronik ortamda oluşturulmuş olup imzaya ihtiyaç duymamaktadır.',
    paymentTerm: invoice?.payment_term || '30'
  });

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

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountValue = parseNumber(formData.discount) || 0;
    
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

  // Find and set selected customer on mount
  useEffect(() => {
    if (customers.length > 0 && formData.customerId) {
      const customer = customers.find(c => c.id === formData.customerId);
      setSelectedCustomer(customer);
    }
  }, [customers, formData.customerId]);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
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

  const handleItemChange = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = calculateItemTotal(
              field === 'quantity' ? value : item.quantity,
              field === 'unitPrice' ? value : item.unitPrice
            );
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addNewItem = () => {
    const newId = Math.max(...formData.items.map(item => item.id), 0) + 1;
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

  const removeItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleVatRateClick = (rate) => {
    setFormData(prev => ({ ...prev, vatRate: rate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer selection
    if (!formData.customerId) {
      alert('Lütfen bir müşteri seçiniz');
      return;
    }

    const currentSelectedCustomer = customers.find(c => c.id === formData.customerId);
    if (!currentSelectedCustomer) {
      alert('Seçili müşteri bulunamadı. Lütfen tekrar müşteri seçiniz');
      return;
    }

    const validItems = formData.items.filter(item => {
      const hasName = item.name && item.name.trim() !== '';
      const hasQuantity = item.quantity && parseNumber(item.quantity) > 0;
      const hasPrice = item.unitPrice && parseNumber(item.unitPrice) > 0;
      return hasName && hasQuantity && hasPrice;
    });

    if (validItems.length === 0) {
      alert('En az bir ürün/hizmet bilgisi girilmelidir');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const subtotalAmount = validItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
      const discountValue = parseNumber(formData.discount) || 0;
      
      let discountAmount = 0;
      if (formData.discountType === 'percentage') {
        discountAmount = (subtotalAmount * discountValue) / 100;
      } else if (formData.discountType === 'fixed') {
        discountAmount = discountValue;
      }
      
      const discountedSubtotal = subtotalAmount - discountAmount;
      const vatAmount = (discountedSubtotal * formData.vatRate) / 100;
      const totalAmount = discountedSubtotal + vatAmount;
      
      const updatedInvoice = {
        invoice_number: formData.invoiceNumber,
        customer_id: formData.customerId,
        customer_name: currentSelectedCustomer?.companyName || 'Unknown Customer',
        date: formData.date,
        currency: formData.currency,
        items: validItems.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          product_id: item.productId || null,
          name: item.name.trim(),
          quantity: parseFloat(item.quantity) || 1.0,
          unit: item.unit || 'adet',
          unit_price: parseFloat(item.unitPrice) || 0.0,
          total: parseFloat(item.total) || 0.0
        })),
        subtotal: subtotalAmount,
        vat_rate: parseFloat(formData.vatRate),
        vat_amount: vatAmount,
        discount: parseFloat(formData.discount) || 0,
        discount_type: formData.discountType,
        discount_amount: discountAmount,
        total: totalAmount,
        conditions: formData.conditions,
        payment_term: formData.paymentTerm
      };

      const response = await fetch(`${backendUrl}/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInvoice)
      });

      if (response.ok) {
        const savedInvoice = await response.json();
        console.log('Invoice updated successfully:', savedInvoice);
        setShowSuccessModal(true);
      } else {
        const errorText = await response.text();
        console.error('Failed to update invoice:', errorText);
        alert('Fatura güncellenemedi: ' + errorText);
      }
      
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Fatura güncellenirken hata oluştu: ' + error.message);
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
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fatura Düzenle</h1>
            <p className="text-gray-600">Fatura bilgilerini güncelleyin</p>
          </div>
        </div>
        <Button
          onClick={onBackToAllInvoices}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tüm Faturalar</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Header Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Fatura Bilgileri
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fatura No *
              </label>
              <Input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Fatura numarası"
                className="font-mono"
                disabled
              />
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Para Birimi *
              </label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{currency.symbol}</span>
                        <span>{currency.code} - {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tarih *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Seçili Müşteri</h3>
              <div className="text-sm text-blue-700">
                <p className="font-semibold">{selectedCustomer.companyName}</p>
                {selectedCustomer.companyTitle && (
                  <p className="text-blue-700">Ünvan: {selectedCustomer.companyTitle}</p>
                )}
                <p>{selectedCustomer.address}</p>
                <p>{selectedCustomer.city} {selectedCustomer.country}</p>
                {selectedCustomer.phone && <p>Tel: {selectedCustomer.phone}</p>}
                {selectedCustomer.taxOffice && (
                  <p className="text-xs">
                    Vergi Dairesi: {selectedCustomer.taxOffice} - {selectedCustomer.taxNumber}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Ürün ve Hizmetler
            </h2>
            <Button
              type="button"
              onClick={addNewItem}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ürün Ekle
            </Button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                {/* Item Name */}
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ürün/Hizmet Adı
                  </label>
                  <Input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    placeholder="Ürün veya hizmet adı"
                    className="text-sm"
                  />
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Miktar
                  </label>
                  <Input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                    placeholder="1"
                    className="text-sm"
                  />
                </div>

                {/* Unit */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Birim
                  </label>
                  <Select
                    value={item.unit}
                    onValueChange={(value) => handleItemChange(item.id, 'unit', value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adet">Adet</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="m">Metre</SelectItem>
                      <SelectItem value="m2">Metrekare</SelectItem>
                      <SelectItem value="saat">Saat</SelectItem>
                      <SelectItem value="gün">Gün</SelectItem>
                      <SelectItem value="ay">Ay</SelectItem>
                      <SelectItem value="paket">Paket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Unit Price */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Birim Fiyat
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                      placeholder="0,00"
                      className="text-sm pr-8"
                    />
                    {selectedCurrency && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-gray-500">{selectedCurrency.symbol}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Toplam
                  </label>
                  <div className="text-sm font-medium text-gray-900 py-2">
                    {selectedCurrency?.symbol}{formatNumber(item.total.toFixed(2))}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Hesaplamalar
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - VAT and Discount */}
            <div className="space-y-6">
              {/* VAT Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KDV Oranı (%)
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((rate) => (
                    <Button
                      key={rate}
                      type="button"
                      onClick={() => handleVatRateClick(rate)}
                      variant={formData.vatRate === rate ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      {rate}
                    </Button>
                  ))}
                  <Select
                    value={formData.vatRate.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vatRate: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 36 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          %{i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İndirim
                </label>
                <div className="flex gap-2">
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder={formData.discountType === 'percentage' ? '0' : '0,00'}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Vadesi
                </label>
                <Select
                  value={formData.paymentTerm}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerm: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTerms.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column - Totals */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutar Özeti</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">
                    {selectedCurrency?.symbol}{formatNumber(totals.subtotal.toFixed(2))}
                  </span>
                </div>
                
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      İndirim ({formData.discountType === 'percentage' ? `%${formData.discount}` : 'Sabit'}):
                    </span>
                    <span className="font-medium text-red-600">
                      -{selectedCurrency?.symbol}{formatNumber(totals.discountAmount.toFixed(2))}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">KDV (%{formData.vatRate}):</span>
                  <span className="font-medium">
                    {selectedCurrency?.symbol}{formatNumber(totals.vatAmount.toFixed(2))}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Genel Toplam:</span>
                    <span className="text-green-600">
                      {selectedCurrency?.symbol}{formatNumber(totals.total.toFixed(2))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Koşullar ve Notlar
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genel Koşullar
            </label>
            <textarea
              value={formData.conditions}
              onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Fatura ile ilgili özel koşullar, notlar veya açıklamalar..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onBackToAllInvoices}
            variant="outline"
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Güncelleniyor...' : 'Faturayı Güncelle'}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fatura Güncellendi!
            </h3>
            <p className="text-gray-600 mb-6">
              Fatura bilgileri başarıyla güncellendi.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={onBackToAllInvoices}
                variant="outline"
                className="flex-1"
              >
                Tüm Faturalar
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onSaveSuccess) {
                    onSaveSuccess();
                  }
                }}
                className="flex-1"
              >
                Tamam
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          onProductAdded={(product) => {
            setProducts(prev => [...prev, product]);
            setShowAddProductModal(false);
          }}
        />
      )}
    </div>
  );
};

export default EditInvoiceForm;