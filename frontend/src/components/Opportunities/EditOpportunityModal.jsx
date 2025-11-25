import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { 
  User, 
  DollarSign, 
  Building2, 
  Calendar, 
  MapPin,
  FileText,
  Target,
  Globe,
  X,
  Save
} from 'lucide-react';

export default function EditOpportunityModal({ opportunity, onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customer: '',
    subject: '',
    contactPerson: '',
    amount: '',
    currency: 'TRY',
    status: 'open-active',
    stage: '',
    details: '',
    businessType: '',
    country: '',
    tradeShowMonth: '',
    tradeShowName: '',
    tradeShowDates: '',
    city: ''
  });

  const [errors, setErrors] = useState({});

  // Populate form with existing data
  useEffect(() => {
    if (opportunity) {
      setFormData({
        customer: opportunity.customer || '',
        subject: opportunity.eventName || '',
        contactPerson: opportunity.contactPerson || '',
        amount: opportunity.amount ? opportunity.amount.toString() : '',
        currency: opportunity.currency || 'TRY',
        status: opportunity.status || 'open-active',
        stage: 'qualified', // Default stage
        details: '',
        businessType: '',
        country: opportunity.tags?.includes('ALMANYA') ? 'de' : 
                opportunity.tags?.includes('TÜRKİYE') ? 'tr' : '',
        tradeShowMonth: '',
        tradeShowName: opportunity.eventName || '',
        tradeShowDates: '',
        city: opportunity.tags?.includes('İSTANBUL') ? 'istanbul' :
              opportunity.tags?.includes('DÜSSELDORF') ? 'dusseldorf' : ''
      });
    }
  }, [opportunity]);

  const statusOptions = [
    { value: 'open', label: 'Açık - Aktif', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'won', label: 'Kazanıldı ✓', color: 'bg-blue-100 text-blue-800' },
    { value: 'lost', label: 'Kaybedildi ✗', color: 'bg-red-100 text-red-800' },
    { value: 'closed', label: 'Kapalı', color: 'bg-gray-100 text-gray-800' }
  ];

  const stageOptions = [
    { value: 'lead', label: 'Potansiyel Müşteri' },
    { value: 'qualified', label: 'Nitelikli Fırsat' },
    { value: 'proposal', label: 'Teklif Aşaması' },
    { value: 'negotiation', label: 'Müzakere' },
    { value: 'closing', label: 'Kapanış Aşaması' }
  ];

  const countries = [
    { value: 'tr', label: 'Türkiye' },
    { value: 'de', label: 'Almanya' },
    { value: 'us', label: 'Amerika Birleşik Devletleri' },
    { value: 'gb', label: 'Birleşik Krallık' },
    { value: 'fr', label: 'Fransa' }
  ];

  const getCitiesByCountry = (countryCode) => {
    const cityMap = {
      'tr': [
        { value: 'istanbul', label: 'İstanbul' },
        { value: 'ankara', label: 'Ankara' },
        { value: 'izmir', label: 'İzmir' },
        { value: 'bursa', label: 'Bursa' },
        { value: 'antalya', label: 'Antalya' }
      ],
      'de': [
        { value: 'frankfurt', label: 'Frankfurt am Main' },
        { value: 'munich', label: 'München' },
        { value: 'cologne', label: 'Köln' },
        { value: 'dusseldorf', label: 'Düsseldorf' },
        { value: 'hamburg', label: 'Hamburg' },
        { value: 'berlin', label: 'Berlin' }
      ]
    };
    
    return cityMap[countryCode] || [];
  };

  const availableCities = getCitiesByCountry(formData.country);

  const handleCountryChange = (value) => {
    handleInputChange('country', value);
    handleInputChange('city', '');
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer.trim()) {
      newErrors.customer = 'Müşteri adı zorunludur';
    }

    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = 'Geçerli bir tutar giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    // Update the opportunity
    const updatedOpportunity = {
      ...opportunity,
      customer: formData.customer,
      eventName: formData.subject || formData.tradeShowName || opportunity.eventName,
      amount: parseFloat(formData.amount) || opportunity.amount,
      currency: formData.currency,
      contactPerson: formData.contactPerson,
      lastUpdate: new Date().toISOString().split('T')[0]
    };

    if (onSave) {
      onSave(updatedOpportunity);
    }
    
    toast({
      title: "Başarılı",
      description: "Satış fırsatı başarıyla güncellendi",
    });

    if (onClose) {
      onClose();
    }
  };

  if (!opportunity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <Target className="h-6 w-6" />
              <span>Satış Fırsatı Düzenle - #{opportunity.id}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-green-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Customer and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Müşteri *</span>
                </Label>
                <Input
                  id="customer"
                  placeholder="Müşteri adını giriniz"
                  value={formData.customer}
                  onChange={(e) => handleInputChange('customer', e.target.value)}
                  className={errors.customer ? 'border-red-500' : ''}
                />
                {errors.customer && (
                  <p className="text-sm text-red-600">{errors.customer}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Satış Fırsatının Konusu</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Fırsat konusunu giriniz"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Contact Person and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Müşterideki İlgili Kişi</span>
                </Label>
                <Input
                  id="contactPerson"
                  placeholder="İlgili kişi adını giriniz"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Tutar</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`flex-1 ${errors.amount ? 'border-red-500' : ''}`}
                  />
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Row 3: Status and Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Badge className="h-4 w-4" />
                  <span>Durum</span>
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                          {status.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Aşama</span>
                </Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Country and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Ülke</span>
                </Label>
                <Select value={formData.country} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Şehir</span>
                </Label>
                <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6"
              >
                <Save className="h-4 w-4 mr-2" />
                Güncelle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}