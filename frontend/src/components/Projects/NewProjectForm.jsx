import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Save, Plus, Edit2, FolderKanban, Calendar, DollarSign, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import PaymentTermsBuilder from './PaymentTermsBuilder';
import AddFairModal from './AddFairModal';

const CURRENCIES = [
  { value: 'TRY', label: '₺ TRY' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' }
];

export default function NewProjectForm({ onClose, onSave }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fairs, setFairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showAddFairModal, setShowAddFairModal] = useState(false);
  const [cityEditable, setCityEditable] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    customerName: '',
    fairId: '',
    fairStartDate: '',
    fairEndDate: '',
    city: '',
    country: 'TR',
    contractAmount: 0,
    currency: 'TRY',
    paymentTerms: [],
    notes: ''
  });

  useEffect(() => {
    loadFairs();
    loadCustomers();
  }, []);

  const loadFairs = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/fairs/all`);
      if (response.ok) {
        const data = await response.json();
        setFairs(data);
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        // Filter only active customers (not prospects, not passive)
        const activeCustomers = data.filter(c => !c.isProspect && c.status !== 'passive');
        setCustomers(activeCustomers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleFairChange = (fairId) => {
    const selectedFair = fairs.find(f => f.id === fairId);
    if (selectedFair) {
      setFormData({
        ...formData,
        fairId: fairId,
        fairStartDate: selectedFair.defaultStartDate || '',
        fairEndDate: selectedFair.defaultEndDate || '',
        city: selectedFair.defaultCity || '',
        country: selectedFair.defaultCountry || 'TR'
      });
      setCityEditable(false);
    }
  };

  const handleFairAdded = (newFair) => {
    setFairs([...fairs, newFair]);
    handleFairChange(newFair.id);
    setShowAddFairModal(false);
  };

  const fillTestData = () => {
    // Select random customer
    if (customers.length > 0) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      
      // Select random fair
      if (fairs.length > 0) {
        const randomFair = fairs[Math.floor(Math.random() * fairs.length)];
        
        // Generate random project name
        const projectNames = [
          'Premium Stand Tasarımı',
          'Modüler Fuar Standı',
          'Özel Tasarım Projesi',
          'VIP Lounge Standı',
          'İnteraktif Stand Projesi'
        ];
        const randomName = projectNames[Math.floor(Math.random() * projectNames.length)];
        
        // Generate random amount between 25000-150000
        const randomAmount = Math.floor(Math.random() * (150000 - 25000) + 25000);
        
        // Random currency
        const currencies = ['TRY', 'USD', 'EUR'];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        
        setFormData({
          name: `${randomCustomer.companyName} - ${randomName}`,
          customerId: randomCustomer.id,
          customerName: randomCustomer.companyName,
          fairId: randomFair.id,
          fairName: randomFair.name,
          fairStartDate: randomFair.defaultStartDate || randomFair.startDate,
          fairEndDate: randomFair.defaultEndDate || randomFair.endDate,
          city: randomFair.defaultCity || randomFair.city,
          country: randomFair.defaultCountry || randomFair.country,
          contractAmount: randomAmount,
          currency: randomCurrency,
          paymentTerms: [],
          notes: 'Test verisi ile otomatik oluşturuldu',
          status: 'yeni',
          isNew: true,
          createdFrom: 'manual'
        });
        
        toast({
          title: "Test verisi dolduruldu",
          description: "Form rastgele test verileriyle dolduruldu"
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.customerId || !formData.fairId) {
      toast({
        title: "Eksik Bilgi",
        description: "Proje adı, müşteri ve fuar seçimi zorunludur",
        variant: "destructive"
      });
      return;
    }

    if (formData.contractAmount <= 0) {
      toast({
        title: "Geçersiz Tutar",
        description: "Sözleşme tutarı 0'dan büyük olmalıdır",
        variant: "destructive"
      });
      return;
    }

    const totalPercentage = formData.paymentTerms.reduce((sum, term) => sum + term.percentage, 0);
    if (formData.paymentTerms.length > 0 && totalPercentage !== 100) {
      toast({
        title: "Ödeme Koşulları Hatası",
        description: "Ödeme koşullarının toplamı %100 olmalıdır",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const selectedFair = fairs.find(f => f.id === formData.fairId);
      
      const projectData = {
        ...formData,
        fairName: selectedFair?.name || '',
        status: 'yeni',
        isNew: true,
        createdFrom: 'manual'
      };

      const response = await fetch(`${backendUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) throw new Error('Proje oluşturulamadı');

      const result = await response.json();
      
      toast({
        title: "Başarılı",
        description: "Proje başarıyla oluşturuldu"
      });

      if (onSave) onSave(result.project);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Hata",
        description: "Proje oluşturulurken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header - Same style as NewCustomerForm */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FolderKanban className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Proje</h1>
            <p className="text-gray-600">Proje bilgilerini girin ve ödeme koşullarını belirleyin</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={fillTestData} 
            className="flex items-center space-x-2 text-green-600 border-green-300 hover:bg-green-50"
            type="button"
          >
            <FileText className="h-4 w-4" />
            <span>Test Verisi Doldur</span>
          </Button>
          <Button variant="outline" onClick={onClose} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Proje Bilgileri - Card format like NewCustomerForm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Proje Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Adı <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: ABC Şirketi - ISK-SODEX 2025"
                required
              />
            </div>

            {/* Customer and Fair Selection - Same Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(customerId) => {
                    const selectedCustomer = customers.find(c => c.id === customerId);
                    setFormData({ 
                      ...formData, 
                      customerId: customerId,
                      customerName: selectedCustomer?.companyName || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Henüz müşteri eklenmemiş.
                  </p>
                )}
              </div>

              {/* Fair Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Adı <span className="text-red-500">*</span>
                </label>
                <Select value={formData.fairId} onValueChange={handleFairChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fuar seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fairs.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                    <div className="border-t mt-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFairModal(true)}
                        className="w-full px-2 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Fuar Ekle
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fair Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Başlangıç <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.fairStartDate}
                  onChange={(e) => setFormData({ ...formData, fairStartDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuar Bitiş <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.fairEndDate}
                  onChange={(e) => setFormData({ ...formData, fairEndDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şehir <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Şehir"
                    disabled={!cityEditable}
                    required
                    className={!cityEditable ? 'bg-gray-100' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCityEditable(!cityEditable)}
                    title={cityEditable ? "Kilitle" : "Düzenle"}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {cityEditable ? "Şehir değiştirilebilir" : "Fuar'dan otomatik geldi"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ülke
                </label>
                <Input
                  value={formData.country}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Fuar'dan otomatik geldi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sözleşme Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Sözleşme Bilgileri</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sözleşme Tutarı <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.contractAmount}
                  onChange={(e) => setFormData({ ...formData, contractAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                  className="flex-1"
                />
                <Select 
                  value={formData.currency} 
                  onValueChange={(v) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Ödeme Koşulları</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentTermsBuilder 
              paymentTerms={formData.paymentTerms} 
              onChange={(t) => setFormData({ ...formData, paymentTerms: t })} 
              contractAmount={formData.contractAmount} 
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Notlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Proje hakkında notlar..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              'Oluşturuluyor...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Proje Oluştur
              </>
            )}
          </Button>
        </div>
      </form>

      <AddFairModal 
        isOpen={showAddFairModal} 
        onClose={() => setShowAddFairModal(false)} 
        onFairAdded={handleFairAdded} 
      />
    </div>
  );
}