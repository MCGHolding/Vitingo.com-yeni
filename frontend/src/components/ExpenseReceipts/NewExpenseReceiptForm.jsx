import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import SearchableSelect from '../ui/SearchableSelect';
import { useToast } from '../../hooks/use-toast';
import { useCurrency } from '../../hooks/useCurrency';
import { 
  Receipt,
  Calendar,
  DollarSign,
  User,
  Phone,
  CreditCard,
  Building2,
  Globe,
  FileText,
  Save,
  CheckCircle,
  Mail
} from 'lucide-react';
import EmailModal from '../UserManagement/EmailModal';

const NewExpenseReceiptForm = ({ onBackToDashboard }) => {
  const { toast } = useToast();
  const { formatCurrency, getCurrencySymbol, getCurrencyOptions } = useCurrency();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    supplier_id: '',
    sender_bank_id: '',
    amount: '',
    description: ''
  });
  
  const [supplierData, setSupplierData] = useState({
    phone: '',
    iban: '',
    bank_name: '',
    country: '',
    // USA bank fields
    routing_number: '',
    us_account_number: '',
    bank_address: ''
  });

  const [isUSABank, setIsUSABank] = useState(false);
  
  const [suppliers, setSuppliers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptCreated, setReceiptCreated] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Load suppliers and banks on mount
  useEffect(() => {
    loadSuppliers();
    loadBanks();
  }, []);

  // Load supplier details when supplier changes
  useEffect(() => {
    if (formData.supplier_id) {
      loadSupplierDetails(formData.supplier_id);
    } else {
      setSupplierData({
        phone: '',
        iban: '',
        bank_name: '',
        country: ''
      });
    }
  }, [formData.supplier_id]);

  const loadSuppliers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadBanks = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/banks`);
      if (response.ok) {
        const data = await response.json();
        setBanks(data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const loadSupplierDetails = async (supplierId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/suppliers/${supplierId}`);
      if (response.ok) {
        const supplier = await response.json();
        setSupplierData({
          phone: supplier.phone || '',
          iban: supplier.iban || '',
          bank_name: supplier.bank_name || '',
          country: supplier.country || '',
          // USA bank fields from supplier
          routing_number: supplier.usa_routing_number || '',
          us_account_number: supplier.usa_account_number || '',
          bank_address: supplier.usa_bank_address || ''
        });
        
        // Auto-detect USA bank if supplier has USA bank info
        if (supplier.is_usa_bank || supplier.usa_routing_number) {
          setIsUSABank(true);
        }
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupplierDataChange = (field, value) => {
    setSupplierData(prev => ({ ...prev, [field]: value }));
  };

  const getSupplierName = () => {
    const supplier = suppliers.find(s => s.id === formData.supplier_id);
    return supplier ? supplier.company_short_name : '';
  };

  const getSupplierSpecialty = () => {
    const supplier = suppliers.find(s => s.id === formData.supplier_id);
    return supplier ? supplier.specialty || 'Belirtilmemiş' : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplier_id || !formData.amount || !formData.description) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast({
        title: "Hata",
        description: "Tutar 0'dan büyük olmalıdır",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/expense-receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create expense receipt');
      }

      const newReceipt = await response.json();
      setCreatedReceipt(newReceipt);
      setReceiptCreated(true);

      toast({
        title: "Başarılı",
        description: "Gider makbuzu başarıyla oluşturuldu",
        variant: "default"
      });

    } catch (error) {
      console.error('Error creating expense receipt:', error);
      toast({
        title: "Hata",
        description: error.message || "Gider makbuzu oluşturulurken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setReceiptCreated(false);
    setCreatedReceipt(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      currency: 'USD',
      supplier_id: '',
      sender_bank_id: '',
      amount: '',
      description: ''
    });
  };

  const handleSendEmail = () => {
    setShowEmailModal(true);
  };

  if (receiptCreated) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tebrikler, Gider Makbuzu Başarı ile Oluşturuldu!
              </h2>
              
              <p className="text-gray-600 mb-6">
                <strong>{createdReceipt?.receipt_number}</strong> numaralı gider makbuzu oluşturuldu ve tedarikçiye gönderilmek üzere hazırlandı.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Makbuz No:</span>
                    <span className="text-sm text-gray-900 font-mono">{createdReceipt?.receipt_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Alıcı:</span>
                    <span className="text-sm text-gray-900">{createdReceipt?.supplier_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Tutar:</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {formatCurrency(createdReceipt?.amount, createdReceipt?.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Durum:</span>
                    <span className="text-sm text-orange-600 font-medium">Onay Bekliyor</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  📧 Tedarikçiye onay linki içeren e-posta gönderilecek. Tedarikçi makbuzu onayladığında "Onaylanmış Makbuzlar" bölümünde görünecektir.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={handleGoBack} variant="outline" className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4" />
                  <span>Yeni Makbuz Oluştur</span>
                </Button>
                
                <Button onClick={handleSendEmail} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>E-posta Gönder</span>
                </Button>
                
                <Button onClick={onBackToDashboard} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Dashboard'a Dön</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Modal */}
        {showEmailModal && createdReceipt && (
          <EmailModal 
            recipientEmail={suppliers.find(s => s.id === createdReceipt.supplier_id)?.email || ''}
            recipientName={createdReceipt.supplier_name}
            subject={`Gider Makbuzu Onay - ${createdReceipt.receipt_number}`}
            defaultMessage={`Tebrikler, Firmamız tarafından oluşturulan gider makbuzu ektedir, Ödemenizin gerçekleşebilmesi için Onaylıyorum butonuna basmanız ve ardından formu imzalayıp Gönder butonuna basmanız gerekmektedir. Ödemeniz bu formda belirtilen banka hesabınıza 3 gün içerisinde gönderilecektir.

Link: ${window.location.origin}/expense-receipt-approval/${createdReceipt.approval_link}

Makbuz Numarası: ${createdReceipt.receipt_number}
Tutar: ${formatCurrency(createdReceipt.amount, createdReceipt.currency)}
Tarih: ${new Date(createdReceipt.date).toLocaleDateString('tr-TR')}`}
            onClose={() => setShowEmailModal(false)}
            onSent={() => {
              setShowEmailModal(false);
              toast({
                title: "Başarılı",
                description: "Onay e-postası tedarikçiye gönderildi",
                variant: "default"
              });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Gider Makbuzu</h1>
          <p className="text-gray-600">Tedarikçiye ödeme yapmak için gider makbuzu oluşturun</p>
        </div>
        <Button variant="outline" onClick={onBackToDashboard}>
          Dashboard'a Dön
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Makbuz Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Makbuz Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              {/* Para Birimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para Birimi <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={getCurrencyOptions()}
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                  placeholder="Para birimi seçin"
                />
              </div>

              {/* Tutar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
                {formData.amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(parseFloat(formData.amount) || 0, formData.currency)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alıcı Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Alıcı Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tedarikçi Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alıcı Adı (Tedarikçi) <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={suppliers.map(supplier => ({
                  value: supplier.id,
                  label: `${supplier.company_short_name} - ${supplier.specialty || 'Belirtilmemiş'}`
                }))}
                value={formData.supplier_id}
                onValueChange={(value) => handleInputChange('supplier_id', value)}
                placeholder="Tedarikçi seçin"
              />
            </div>

            {formData.supplier_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Seçili Tedarikçi Bilgileri</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Ad:</span>
                    <span>{getSupplierName()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Uzmanlık:</span>
                    <span>{getSupplierSpecialty()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Otomatik doldurulacak alanlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={supplierData.phone}
                    onChange={(e) => handleSupplierDataChange('phone', e.target.value)}
                    placeholder="Otomatik doldurulur"
                    className="pl-10"
                    readOnly
                  />
                </div>
              </div>

              {/* IBAN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alıcı IBAN
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={supplierData.iban}
                    onChange={(e) => handleSupplierDataChange('iban', e.target.value)}
                    placeholder="Tedarikçi IBAN'ı"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Banka Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banka Adı
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={supplierData.bank_name}
                    onChange={(e) => handleSupplierDataChange('bank_name', e.target.value)}
                    placeholder="Banka adı"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Ülke */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={supplierData.country}
                    onChange={(e) => handleSupplierDataChange('country', e.target.value)}
                    placeholder="Ülke"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gönderici Banka */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Gönderici Banka</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gönderici Banka
              </label>
              <SearchableSelect
                options={banks.map(bank => ({
                  value: bank.id,
                  label: `${bank.bank_name} - ${bank.account_holder}`
                }))}
                value={formData.sender_bank_id}
                onValueChange={(value) => handleInputChange('sender_bank_id', value)}
                placeholder="Gönderici banka seçin"
              />
            </div>
          </CardContent>
        </Card>

        {/* Açıklama */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Açıklama</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Gider makbuzu açıklaması..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBackToDashboard}>
            İptal
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Kaydediliyor...' : 'Gider Makbuzu Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewExpenseReceiptForm;