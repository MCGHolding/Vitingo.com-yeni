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
  Plus
} from 'lucide-react';

export default function NewOpportunityForm({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customer: '',
    lead: '',
    subject: '',
    contactPerson: '',
    amount: '',
    currency: 'TRY',
    status: 'open',
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
  const [fairs, setFairs] = useState([]);
  const [loadingFairs, setLoadingFairs] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Load fairs, customers, and leads from database on component mount
  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    const loadFairs = async () => {
      setLoadingFairs(true);
      try {
        const response = await fetch(`${backendUrl}/api/fairs`);
        
        if (response.ok) {
          const fairsData = await response.json();
          setFairs(fairsData);
          console.log('Fairs loaded for dropdown:', fairsData.length);
        } else {
          console.error('Failed to load fairs');
          toast({
            title: "Uyarı",
            description: "Fuarlar yüklenirken sorun oluştu",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading fairs:', error);
        toast({
          title: "Hata",
          description: "Fuarlar yüklenemedi",
          variant: "destructive"
        });
      } finally {
        setLoadingFairs(false);
      }
    };

    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await fetch(`${backendUrl}/api/customers`);
        
        if (response.ok) {
          const customersData = await response.json();
          setCustomers(customersData);
          console.log('Customers loaded for dropdown:', customersData.length);
        } else {
          console.error('Failed to load customers');
          toast({
            title: "Uyarı",
            description: "Müşteriler yüklenirken sorun oluştu",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        toast({
          title: "Hata",
          description: "Müşteriler yüklenemedi",
          variant: "destructive"
        });
      } finally {
        setLoadingCustomers(false);
      }
    };

    const loadLeads = async () => {
      setLoadingLeads(true);
      try {
        const response = await fetch(`${backendUrl}/api/leads`);
        
        if (response.ok) {
          const leadsData = await response.json();
          setLeads(leadsData);
          console.log('Leads loaded for dropdown:', leadsData.length);
        } else {
          console.error('Failed to load leads');
          toast({
            title: "Uyarı",
            description: "Müşteri adayları yüklenirken sorun oluştu",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading leads:', error);
        toast({
          title: "Hata",
          description: "Müşteri adayları yüklenemedi",
          variant: "destructive"
        });
      } finally {
        setLoadingLeads(false);
      }
    };

    loadFairs();
    loadCustomers();
    loadLeads();
  }, []);

  const statusOptions = [
    { value: 'open', label: 'Açık - Aktif', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'closed', label: 'Kapalı', color: 'bg-gray-100 text-gray-800' }
  ];

  const stageOptions = [
    { value: 'lead', label: 'Potansiyel Müşteri' },
    { value: 'qualified', label: 'Nitelikli Fırsat' },
    { value: 'proposal', label: 'Teklif Aşaması' },
    { value: 'negotiation', label: 'Müzakere' },
    { value: 'closing', label: 'Kapanış Aşaması' }
  ];

  const businessTypes = [
    { value: 'manufacturing', label: 'Üretim' },
    { value: 'service', label: 'Hizmet' },
    { value: 'retail', label: 'Perakende' },
    { value: 'technology', label: 'Teknoloji' },
    { value: 'healthcare', label: 'Sağlık' },
    { value: 'education', label: 'Eğitim' },
    { value: 'finance', label: 'Finans' }
  ];

  const countries = [
    { value: 'tr', label: 'Türkiye' },
    { value: 'de', label: 'Almanya' },
    { value: 'us', label: 'Amerika Birleşik Devletleri' },
    { value: 'gb', label: 'Birleşik Krallık' },
    { value: 'fr', label: 'Fransa' },
    { value: 'it', label: 'İtalya' },
    { value: 'es', label: 'İspanya' }
  ];

  const months = [
    { value: '1', label: 'Ocak' },
    { value: '2', label: 'Şubat' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' },
    { value: '5', label: 'Mayıs' },
    { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' },
    { value: '8', label: 'Ağustos' },
    { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  const getCitiesByCountry = (countryCode) => {
    const cityMap = {
      'tr': [
        { value: 'istanbul', label: 'İstanbul' },
        { value: 'ankara', label: 'Ankara' },
        { value: 'izmir', label: 'İzmir' },
        { value: 'bursa', label: 'Bursa' },
        { value: 'antalya', label: 'Antalya' },
        { value: 'gaziantep', label: 'Gaziantep' },
        { value: 'adana', label: 'Adana' },
        { value: 'konya', label: 'Konya' }
      ],
      'de': [
        { value: 'frankfurt', label: 'Frankfurt am Main' },
        { value: 'munich', label: 'München' },
        { value: 'cologne', label: 'Köln' },
        { value: 'dusseldorf', label: 'Düsseldorf' },
        { value: 'hamburg', label: 'Hamburg' },
        { value: 'berlin', label: 'Berlin' },
        { value: 'hannover', label: 'Hannover' },
        { value: 'stuttgart', label: 'Stuttgart' },
        { value: 'nuremberg', label: 'Nürnberg' }
      ],
      'us': [
        { value: 'las-vegas', label: 'Las Vegas' },
        { value: 'chicago', label: 'Chicago' },
        { value: 'new-york', label: 'New York' },
        { value: 'atlanta', label: 'Atlanta' },
        { value: 'orlando', label: 'Orlando' }
      ]
    };
    
    return cityMap[countryCode] || [];
  };

  const availableCities = getCitiesByCountry(formData.country);

  const handleCountryChange = (value) => {
    handleInputChange('country', value);
    // Reset city when country changes
    handleInputChange('city', '');
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer && !formData.lead) {
      newErrors.customer = 'Müşteri veya Müşteri Adayı seçimi zorunludur';
    }

    if (!formData.stage) {
      newErrors.stage = 'Aşama seçimi zorunludur';
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

    // Save logic here
    if (onSave) {
      onSave(formData);
    }
    
    toast({
      title: "Başarılı",
      description: "Satış fırsatı başarıyla oluşturuldu",
    });

    // Reset form
    setFormData({
      customer: '',
      subject: '',
      contactPerson: '',
      amount: '',
      currency: 'TRY',
      status: 'open',
      stage: '',
      details: '',
      businessType: '',
      country: '',
      tradeShowMonth: '',
      tradeShowName: '',
      tradeShowDates: '',
      city: ''
    });

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <Target className="h-6 w-6" />
              <span>Yeni Satış Fırsatı</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-orange-600"
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
                  <span>Aşama *</span>
                </Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger className={errors.stage ? 'border-red-500' : ''}>
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
                {errors.stage && (
                  <p className="text-sm text-red-600">{errors.stage}</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label htmlFor="details" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Detaylar</span>
              </Label>
              <Textarea
                id="details"
                placeholder="Satış fırsatı hakkında detaylı bilgi giriniz..."
                value={formData.details}
                onChange={(e) => handleInputChange('details', e.target.value)}
                rows={4}
              />
            </div>

            {/* Row 4: Business Type and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>İş Konusu</span>
                </Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </div>

            {/* Trade Show Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Fuar Bilgileri</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Fuar Ayı</span>
                  </Label>
                  <Select value={formData.tradeShowMonth} onValueChange={(value) => handleInputChange('tradeShowMonth', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="tradeShowName" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Fuar Adı</span>
                  </Label>
                  <Select 
                    value={formData.tradeShowName} 
                    onValueChange={(value) => handleInputChange('tradeShowName', value)}
                    disabled={loadingFairs}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingFairs ? "Fuarlar yükleniyor..." : "Fuar seçiniz"} />
                    </SelectTrigger>
                    <SelectContent>
                      {fairs
                        .filter(fair => fair.name && fair.name.trim() !== '') // Filter out fairs with empty names
                        .map((fair) => (
                        <SelectItem key={fair.id} value={fair.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{fair.name}</span>
                            <span className="text-xs text-gray-500">
                              {fair.city}, {fair.country} • {fair.startDate} - {fair.endDate}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {fairs.filter(fair => fair.name && fair.name.trim() !== '').length === 0 && !loadingFairs && (
                        <SelectItem value="no-fairs" disabled>
                          Henüz fuar bulunmuyor
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeShowDates" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Fuar Tarihleri</span>
                  </Label>
                  <Input
                    id="tradeShowDates"
                    placeholder="Örn: 15-18 Mart 2024"
                    value={formData.tradeShowDates}
                    onChange={(e) => handleInputChange('tradeShowDates', e.target.value)}
                  />
                </div>
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
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6"
              >
                Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}