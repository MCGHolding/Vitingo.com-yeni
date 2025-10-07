import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Target,
  DollarSign,
  User,
  Building2,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  Globe,
  TrendingUp
} from 'lucide-react';

export default function NewOpportunityFormPage({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    contactPerson: '',
    amount: '',
    currency: 'TRY',
    status: 'open',
    stage: 'lead',
    priority: 'medium',
    closeDate: '',
    source: '',
    description: '',
    businessType: '',
    country: '',
    city: '',
    tradeShow: '',
    tradeShowDates: '',
    expectedRevenue: '',
    probability: '50',
    tags: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOpportunityInfo, setCreatedOpportunityInfo] = useState(null);
  
  // Dynamic data states
  const [customers, setCustomers] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fairs, setFairs] = useState([]);
  
  // Static options
  const currencies = [
    { value: 'TRY', label: '₺ Türk Lirası' },
    { value: 'USD', label: '$ ABD Doları' },
    { value: 'EUR', label: '€ Euro' },
    { value: 'GBP', label: '£ İngiliz Sterlini' }
  ];

  const statuses = [
    { value: 'open', label: 'Açık' },
    { value: 'qualified', label: 'Nitelikli' },
    { value: 'proposal', label: 'Teklif Aşamasında' },
    { value: 'negotiation', label: 'Görüşme Aşamasında' },
    { value: 'closed-won', label: 'Kazanıldı' },
    { value: 'closed-lost', label: 'Kaybedildi' }
  ];

  const stages = [
    { value: 'lead', label: 'Potansiyel Müşteri' },
    { value: 'contact', label: 'İletişim Kuruldu' },
    { value: 'demo', label: 'Demo/Sunum' },
    { value: 'proposal', label: 'Teklif Hazırlandı' },
    { value: 'negotiation', label: 'Pazarlık' },
    { value: 'closing', label: 'Kapanış' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'urgent', label: 'Acil' }
  ];

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referans' },
    { value: 'cold-call', label: 'Soğuk Arama' },
    { value: 'trade-show', label: 'Ticaret Fuarı' },
    { value: 'social-media', label: 'Sosyal Medya' },
    { value: 'email', label: 'E-posta Kampanyası' },
    { value: 'partner', label: 'İş Ortağı' },
    { value: 'other', label: 'Diğer' }
  ];

  // Load customers and fairs on component mount
  useEffect(() => {
    loadCustomers();
    loadFairs();
  }, []);

  const loadCustomers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        console.log('Customers loaded for opportunities:', data);
        setCustomers(data);
      } else {
        console.error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadFairs = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/fairs`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fairs loaded for opportunities:', data);
        setFairs(data);
      } else {
        console.error('Failed to load fairs');
      }
    } catch (error) {
      console.error('Error loading fairs:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation - required fields for opportunity
    const requiredFieldsValid = formData.title.trim() && formData.customer.trim() && 
        formData.amount.trim() && formData.closeDate.trim() && formData.stage.trim();
    
    if (!requiredFieldsValid) {
      toast({
        title: "Hata",
        description: "Zorunlu alanları doldurunuz: Başlık, Müşteri, Tutar, Kapanış Tarihi, Aşama",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Format opportunity data for backend
      const opportunityData = {
        title: formData.title,
        customer: formData.customer,
        contact_person: formData.contactPerson,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        status: formData.status,
        stage: formData.stage,
        priority: formData.priority,
        close_date: formData.closeDate,
        source: formData.source,
        description: formData.description,
        business_type: formData.businessType,
        country: formData.country,
        city: formData.city,
        trade_show: formData.tradeShow,
        trade_show_dates: formData.tradeShowDates,
        expected_revenue: parseFloat(formData.expectedRevenue) || parseFloat(formData.amount) || 0,
        probability: parseInt(formData.probability) || 50,
        created_at: new Date().toISOString(),
        tags: formData.tags || []
      };

      const response = await fetch(`${backendUrl}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityData),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Opportunity saved:', savedData);

        // Set success state with opportunity info
        setCreatedOpportunityInfo({
          title: formData.title,
          customer: formData.customer,
          amount: `${formData.amount} ${formData.currency}`,
          stage: stages.find(s => s.value === formData.stage)?.label || formData.stage
        });
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Failed to save opportunity:', errorData);
        toast({
          title: "Hata",
          description: "Satış fırsatı kaydedilirken hata oluştu: " + (errorData.detail || "Bilinmeyen hata"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting opportunity form:', error);
      toast({
        title: "Hata",
        description: "Satış fırsatı kaydedilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Target className="h-8 w-8 text-blue-600" />
              <span>Yeni Satış Fırsatı</span>
            </h1>
            <p className="text-gray-600 mt-1">Satış fırsatı detayları ve takip bilgileri</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              <X className="h-4 w-4 mr-2" />
              Kapat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 space-y-6">
        
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Temel Bilgiler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Başlık */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fırsat Başlığı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Satış fırsatı başlığı"
                  />
                </div>

                {/* Müşteri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Müşteri <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.customer}
                    onValueChange={(value) => handleInputChange('customer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(customer => (customer.companyName || customer.companyTitle || '').trim() !== '')
                        .map((customer) => {
                          const displayName = customer.companyName || customer.companyTitle || `Customer ${customer.id}`;
                          return (
                            <SelectItem key={customer.id} value={displayName}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* İletişim Kişisi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İletişim Kişisi
                  </label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    placeholder="Yetkili kişi adı"
                  />
                </div>

                {/* Kaynak */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fırsat Kaynağı
                  </label>
                  <Select 
                    value={formData.source}
                    onValueChange={(value) => handleInputChange('source', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kaynak seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finansal Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Finansal Bilgiler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tutar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tutar <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Para Birimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Para Birimi
                  </label>
                  <Select 
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Para birimi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gerçekleşme Olasılığı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Olasılık (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Beklenen Gelir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beklenen Gelir
                </label>
                <Input
                  type="number"
                  value={formData.expectedRevenue}
                  onChange={(e) => handleInputChange('expectedRevenue', e.target.value)}
                  placeholder="Beklenen gelir miktarı (opsiyonel)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Süreç Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Süreç Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Durum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aşama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aşama <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.stage}
                    onValueChange={(value) => handleInputChange('stage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aşama seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Öncelik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öncelik
                  </label>
                  <Select 
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kapanış Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beklenen Kapanış Tarihi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => handleInputChange('closeDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lokasyon ve Fuar Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Lokasyon ve Fuar Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ülke */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ülke
                  </label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Ülke adı"
                  />
                </div>

                {/* Şehir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Şehir adı"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ticaret Fuarı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticaret Fuarı
                  </label>
                  <Select 
                    value={formData.tradeShow}
                    onValueChange={(value) => handleInputChange('tradeShow', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fuar seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fairs
                        .filter(fair => (fair.name || '').trim() !== '')
                        .map((fair) => {
                          const displayName = fair.name || `Fair ${fair.id}`;
                          return (
                            <SelectItem key={fair.id} value={displayName}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fuar Tarihleri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuar Tarihleri
                  </label>
                  <Input
                    value={formData.tradeShowDates}
                    onChange={(e) => handleInputChange('tradeShowDates', e.target.value)}
                    placeholder="Fuar tarihi aralığı"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Açıklama */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Detaylar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* İş Türü */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Türü
                </label>
                <Input
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  placeholder="Satış, Hizmet, Danışmanlık, vb."
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama ve Notlar
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Satış fırsatı hakkında detaylar, notlar ve özel durumlar..."
                  rows={4}
                  className="resize-vertical"
                />
              </div>
            </CardContent>
          </Card>
        
        </div> {/* End of form content container */}
        
        {/* Submit Button - Inside form but outside content container */}
        <div className="px-6 pb-6">
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              <Target className="h-4 w-4 mr-2" />
              {isLoading ? 'Kaydediliyor...' : 'Fırsat Oluştur'}
            </Button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            {/* X Close Button */}
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Başarılı!
              </h2>
              
              <p className="text-gray-600 mb-4">
                <strong>{createdOpportunityInfo?.title}</strong> satış fırsatı başarı ile sisteme eklenmiştir.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  ✅ Fırsat artık "Tüm Fırsatlar" listesinde görünecektir.
                </p>
              </div>
              
              <Button onClick={() => setShowSuccessModal(false)} className="bg-green-600 hover:bg-green-700">
                Tamam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}