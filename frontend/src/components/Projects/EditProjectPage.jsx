import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Save, Calendar, DollarSign, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import PaymentTermsBuilder from './PaymentTermsBuilder';

const CURRENCIES = [
  { value: 'TRY', label: '₺ TRY' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' }
];

export default function EditProjectPage({ projectId, onClose, onSave }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fairs, setFairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [groupCompanies, setGroupCompanies] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    companyName: '',
    customerId: '',
    customerName: '',
    fairId: '',
    fairName: '',
    fairStartDate: '',
    fairEndDate: '',
    city: '',
    country: 'TR',
    contractDate: '',
    contractAmount: 0,
    currency: 'TRY',
    paymentTerms: [],
    notes: '',
    status: 'yeni'
  });

  useEffect(() => {
    loadFairs();
    loadCustomers();
    loadGroupCompanies();
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Loaded project data:', data);
        console.log('🏢 Company ID:', data.companyId);
        console.log('👤 Customer ID:', data.customerId);
        console.log('🎪 Fair ID:', data.fairId);
        console.log('📅 Contract Date:', data.contractDate);
        console.log('💰 Contract Amount:', data.contractAmount);
        console.log('💳 Payment Terms:', data.paymentTerms);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Hata",
        description: "Proje yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

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
        console.log('👤 Customers loaded:', data.length, 'customers');
        console.log('👤 First customer:', data[0]);
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadGroupCompanies = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/group-companies`);
      if (response.ok) {
        const data = await response.json();
        let companies = Array.isArray(data) ? data : [];
        
        // If no group companies, add fallback
        if (companies.length === 0) {
          companies.push({
            id: 'default',
            name: 'Varsayılan Şirket'
          });
        }
        
        console.log('🏢 Group Companies loaded:', companies.length, 'companies');
        console.log('🏢 First company:', companies[0]);
        setGroupCompanies(companies);
      }
    } catch (error) {
      console.error('Error loading group companies:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Proje güncellenemedi');

      const result = await response.json();
      
      toast({
        title: "Başarılı",
        description: "Proje başarıyla güncellendi"
      });

      if (onSave) onSave(result);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Hata",
        description: "Proje güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Geri</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proje Düzenle</h1>
              <p className="text-gray-600">{formData.name}</p>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Kaydet
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proje Adı ve Şirketi Seç - Same Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proje Adı *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Proje adını girin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şirketi Seç *</label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => {
                      const selectedCompany = groupCompanies.find(c => c.id === value);
                      handleInputChange('companyId', value);
                      handleInputChange('companyName', selectedCompany?.name || '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şirket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri *</label>
                  <Select value={formData.customerId} onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    handleInputChange('customerId', value);
                    handleInputChange('customerName', customer?.companyName || '');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuar *</label>
                  <Select value={formData.fairId} onValueChange={(value) => {
                    const fair = fairs.find(f => f.id === value);
                    handleInputChange('fairId', value);
                    handleInputChange('fairName', fair?.name || '');
                    handleInputChange('fairStartDate', fair?.start_date || '');
                    handleInputChange('fairEndDate', fair?.end_date || '');
                    handleInputChange('city', fair?.city || '');
                    handleInputChange('country', fair?.country || 'TR');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fuar seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {fairs.map(fair => (
                        <SelectItem key={fair.id} value={fair.id}>
                          {fair.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Şehir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ülke</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Ülke"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finansal Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Finansal Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sözleşme Tutarı *</label>
                  <Input
                    type="number"
                    value={formData.contractAmount}
                    onChange={(e) => handleInputChange('contractAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sözleşme Tarihi</label>
                <Input
                  type="date"
                  value={formData.contractDate}
                  onChange={(e) => handleInputChange('contractDate', e.target.value)}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Koşulları</label>
                <PaymentTermsBuilder
                  paymentTerms={formData.paymentTerms}
                  onPaymentTermsChange={(terms) => handleInputChange('paymentTerms', terms)}
                  contractAmount={formData.contractAmount}
                  currency={formData.currency}
                  contractDate={formData.contractDate}
                  fairStartDate={formData.fairStartDate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notlar */}
          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Proje ile ilgili notlar..."
              />
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
