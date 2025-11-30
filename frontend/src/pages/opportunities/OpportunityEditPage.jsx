import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';

// Enum değerleri
const OPPORTUNITY_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referans' },
  { value: 'cold_call', label: 'Soğuk Arama' },
  { value: 'trade_fair', label: 'Ticaret Fuarı' },
  { value: 'social_media', label: 'Sosyal Medya' },
  { value: 'email_campaign', label: 'E-posta Kampanyası' },
  { value: 'partner', label: 'İş Ortağı' },
  { value: 'other', label: 'Diğer' }
];

const OPPORTUNITY_STAGES = [
  { value: 'potential', label: 'Potansiyel Müşteri' },
  { value: 'contacted', label: 'İletişim Kuruldu' },
  { value: 'demo', label: 'Demo/Sunum' },
  { value: 'proposal_sent', label: 'Teklif Hazırlandı' },
  { value: 'negotiation', label: 'Pazarlık' },
  { value: 'closing', label: 'Kapanış' },
  { value: 'lead', label: 'Potansiyel Müşteri' },
  { value: 'contact', label: 'İletişim Kuruldu' },
  { value: 'proposal', label: 'Teklif Hazırlandı' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' }
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Açık' },
  { value: 'won', label: 'Kazanıldı' },
  { value: 'lost', label: 'Kaybedildi' },
  { value: 'on_hold', label: 'Beklemede' },
  { value: 'qualified', label: 'Nitelikli' },
  { value: 'proposal', label: 'Teklif Aşamasında' },
  { value: 'negotiation', label: 'Görüşme Aşamasında' }
];

const CURRENCY_OPTIONS = [
  { value: 'TRY', label: 'Türk Lirası', symbol: '₺' },
  { value: 'USD', label: 'Amerikan Doları', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'İngiliz Sterlini', symbol: '£' }
];

const SIZE_UNIT_OPTIONS = [
  { value: 'm2', label: 'm²' },
  { value: 'sqft', label: 'sqft' }
];

const PROJECT_TYPES = [
  { value: 'stand_design', label: 'Stand Tasarım' },
  { value: 'stand_production', label: 'Stand Üretim' },
  { value: 'turnkey', label: 'Anahtar Teslim' },
  { value: 'rental', label: 'Kiralama' },
  { value: 'consultation', label: 'Danışmanlık' },
  { value: 'other', label: 'Diğer' }
];

export default function OpportunityEditPage({ opportunityId, onBack, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [fairs, setFairs] = useState([]);

  useEffect(() => {
    if (opportunityId) {
      fetchData();
    }
  }, [opportunityId]);

  const fetchData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const [opportunityRes, customersRes, leadsRes, fairsRes] = await Promise.all([
        fetch(`${backendUrl}/api/opportunities/${opportunityId}`),
        fetch(`${backendUrl}/api/customers`),
        fetch(`${backendUrl}/api/leads`),
        fetch(`${backendUrl}/api/fairs`)
      ]);
      
      const opportunity = await opportunityRes.json();
      const customersData = await customersRes.json();
      const leadsData = await leadsRes.json();
      const fairsData = await fairsRes.json();
      
      setFormData(opportunity);
      setCustomers(customersData.customers || customersData || []);
      setLeads(leadsData.leads || leadsData || []);
      setFairs(fairsData.fairs || fairsData || []);
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Hata",
        description: "Veri yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
    
    // Müşteri seçildiğinde müşteri adayını temizle
    if (field === 'customer' && value) {
      setFormData(prev => ({ ...prev, lead: '' }));
    }
    
    // Müşteri adayı seçildiğinde müşteriyi temizle
    if (field === 'lead' && value) {
      setFormData(prev => ({ ...prev, customer: '' }));
    }
  };

  const handleSave = async () => {
    // Validasyon
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'Fırsat başlığı zorunludur';
    if (!formData.amount) newErrors.amount = 'Tutar zorunludur';
    if (!formData.stage) newErrors.stage = 'Aşama zorunludur';
    if (!(formData.expectedCloseDate || formData.close_date || formData.closeDate)) {
      newErrors.expectedCloseDate = 'Beklenen kapanış tarihi zorunludur';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${backendUrl}/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Kaydetme başarısız');
      
      const updatedData = await response.json();
      
      toast({
        title: "Başarılı",
        description: "Satış fırsatı güncellendi"
      });
      
      if (onSave) onSave(updatedData);
      if (onBack) onBack();
    } catch (error) {
      console.error(error);
      toast({
        title: "Hata",
        description: "Kaydetme sırasında bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Satış Fırsatını Düzenle</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onBack}
              >
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>⏳ Kaydediliyor...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>💼 Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Fırsat Başlığı */}
            <div>
              <Label>Fırsat Başlığı <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Satış fırsatı başlığı"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Müşteri */}
              <div>
                <Label>Müşteri</Label>
                <Select
                  value={formData.customer || ''}
                  onValueChange={(value) => handleChange('customer', value)}
                  disabled={!!formData.lead}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.companyName || customer.name}>
                        {customer.companyName || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Müşteri Adayı */}
              <div>
                <Label>Müşteri Adayı</Label>
                <Select
                  value={formData.lead || ''}
                  onValueChange={(value) => handleChange('lead', value)}
                  disabled={!!formData.customer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri adayı seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.companyName || lead.name}>
                        {lead.companyName || lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* İletişim Kişisi */}
              <div>
                <Label>İletişim Kişisi</Label>
                <Input
                  value={formData.contact_person || formData.contactPerson || ''}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="İletişim kişisi"
                />
              </div>

              {/* Fırsat Kaynağı */}
              <div>
                <Label>Fırsat Kaynağı</Label>
                <Select
                  value={formData.source || ''}
                  onValueChange={(value) => handleChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kaynak seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OPPORTUNITY_SOURCES.map(source => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proje Türü */}
            <div>
              <Label>Proje Türü</Label>
              <Select
                value={formData.project_type || formData.projectType || ''}
                onValueChange={(value) => handleChange('project_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Proje türü seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Finansal Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Finansal Bilgiler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tutar */}
              <div>
                <Label>Tutar <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
              </div>

              {/* Para Birimi */}
              <div>
                <Label>Para Birimi</Label>
                <Select
                  value={formData.currency || 'TRY'}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.symbol} {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Olasılık */}
              <div>
                <Label>Olasılık (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability || 50}
                  onChange={(e) => handleChange('probability', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Beklenen Gelir */}
              <div>
                <Label>Beklenen Gelir</Label>
                <Input
                  type="text"
                  value={((formData.amount || 0) * ((formData.probability || 0) / 100)).toFixed(0)}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Otomatik hesaplanır</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Süreç Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Süreç Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Durum */}
              <div>
                <Label>Durum</Label>
                <Select
                  value={formData.status || 'open'}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aşama */}
              <div>
                <Label>Aşama <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.stage || ''}
                  onValueChange={(value) => handleChange('stage', value)}
                >
                  <SelectTrigger className={errors.stage ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Aşama seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OPPORTUNITY_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stage && <p className="text-red-500 text-sm mt-1">{errors.stage}</p>}
              </div>

              {/* Öncelik */}
              <div>
                <Label>Öncelik</Label>
                <Select
                  value={formData.priority || 'medium'}
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Beklenen Kapanış Tarihi */}
              <div>
                <Label>Beklenen Kapanış Tarihi <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={(formData.expectedCloseDate || formData.close_date || formData.closeDate || '').split('T')[0]}
                  onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
                  className={errors.expectedCloseDate ? 'border-red-500' : ''}
                />
                {errors.expectedCloseDate && <p className="text-red-500 text-sm mt-1">{errors.expectedCloseDate}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lokasyon ve Fuar Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>📍 Lokasyon ve Fuar Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ülke */}
              <div>
                <Label>Ülke</Label>
                <Input
                  value={formData.country || ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="Ülke"
                />
              </div>

              {/* Şehir */}
              <div>
                <Label>Şehir</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Şehir"
                />
              </div>

              {/* Ticaret Fuarı */}
              <div>
                <Label>Ticaret Fuarı</Label>
                <Select
                  value={formData.trade_show || formData.tradeShow || ''}
                  onValueChange={(value) => handleChange('trade_show', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fuar seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fairs.map(fair => (
                      <SelectItem key={fair.id} value={fair.name}>
                        {fair.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Başlama Tarihi */}
              <div>
                <Label>Başlama Tarihi</Label>
                <Input
                  type="date"
                  value={(formData.trade_show_start_date || formData.tradeShowStartDate || '').split('T')[0]}
                  onChange={(e) => handleChange('trade_show_start_date', e.target.value)}
                />
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={(formData.trade_show_end_date || formData.tradeShowEndDate || '').split('T')[0]}
                  onChange={(e) => handleChange('trade_show_end_date', e.target.value)}
                />
              </div>

              {/* Stand Büyüklüğü */}
              <div>
                <Label>Stand Büyüklüğü</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.stand_size || formData.standSize || ''}
                    onChange={(e) => handleChange('stand_size', parseFloat(e.target.value) || null)}
                    placeholder="Stand büyüklüğü"
                    className="flex-1"
                  />
                  <Select
                    value={formData.stand_size_unit || formData.standSizeUnit || 'm2'}
                    onValueChange={(value) => handleChange('stand_size_unit', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_UNIT_OPTIONS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detaylar */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* İş Türü */}
            <div>
              <Label>İş Türü</Label>
              <Input
                value={formData.business_type || formData.businessType || ''}
                onChange={(e) => handleChange('business_type', e.target.value)}
                placeholder="Satış, Hizmet, Danışmanlık, vb."
              />
            </div>

            {/* Açıklama ve Notlar */}
            <div>
              <Label>Açıklama ve Notlar</Label>
              <Textarea
                value={formData.description || formData.notes || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Satış fırsatı hakkında detaylar, notlar ve özel durumlar..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
