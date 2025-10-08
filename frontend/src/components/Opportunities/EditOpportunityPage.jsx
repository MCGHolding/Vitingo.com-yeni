import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  ArrowLeft,
  Edit3, 
  Save,
  X,
  User, 
  DollarSign, 
  Calendar, 
  MapPin,
  FileText,
  Target,
  Globe,
  Building2,
  Briefcase,
  TrendingUp,
  Clock,
  Percent,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Package,
  Calendar as EventIcon,
  Info,
  Eye,
  Download,
  Check
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import FilePreviewModal from '../ui/FilePreviewModal';

export default function EditOpportunityPage({ opportunity, onBack, onSave }) {
  const { toast } = useToast();
  const [editingSections, setEditingSections] = useState({});
  const [formData, setFormData] = useState(opportunity || {});
  const [loading, setLoading] = useState(false);
  
  // File preview modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);

  useEffect(() => {
    if (opportunity) {
      setFormData(opportunity);
    }
  }, [opportunity]);

  const formatCurrency = (amount, currency) => {
    if (amount === 0) return '-';
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺'
    };

    return `${symbols[currency] || currency} ${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (statusText) => {
    if (statusText && statusText.includes('Teklif Bekleniyor')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (statusText && statusText.includes('Teklif Gönderildi')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (statusText && statusText.includes('Tasarım')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (statusText && statusText.includes('Brief')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const handleEditSection = (sectionId) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSaveSection = async (sectionId) => {
    try {
      setLoading(true);
      
      // API call to update opportunity
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/opportunities/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingSections(prev => ({
          ...prev,
          [sectionId]: false
        }));
        
        toast({
          title: "Başarılı",
          description: "Değişiklikler kaydedildi",
        });

        if (onSave) {
          onSave(formData);
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: "Hata",
        description: "Değişiklikler kaydedilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilePreview = (files, title, initialIndex = 0) => {
    // Convert file IDs to preview format with sample data
    const previewData = files.map((fileId, index) => ({
      id: fileId,
      name: `${title.replace(/\s+/g, '_')}_${index + 1}.pdf`, // Default to PDF, can be enhanced
      url: `/api/files/${fileId}`, // Backend endpoint for file serving
      size: 1024 * 1024 * 2.5, // Sample 2.5MB
      type: 'application/pdf' // Default type, can be enhanced
    }));

    setPreviewFiles(previewData);
    setPreviewTitle(title);
    setPreviewInitialIndex(initialIndex);
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewFiles([]);
    setPreviewTitle('');
    setPreviewInitialIndex(0);
  };

  const tagColors = {
    'ALMANYA': 'bg-red-500 text-white',
    'DÜSSELDORF': 'bg-purple-500 text-white',
    'MEDICA': 'bg-teal-500 text-white',
    'BAE': 'bg-red-500 text-white',
    'DUBAİ': 'bg-orange-500 text-white',
    'GULFOOD': 'bg-teal-500 text-white',
    'TÜRKİYE': 'bg-red-500 text-white',
    'İSTANBUL': 'bg-purple-500 text-white'
  };

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Fırsat bulunamadı</h3>
          <p className="text-gray-600 mt-1">Düzenlenecek fırsat verisi yüklenemedi.</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Geri Dön</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Satış Fırsatı Düzenle</h1>
              <p className="text-gray-600">{formData.customer} - {formData.eventName || formData.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="px-3 py-1 text-sm">
              Fırsat No: {formData.displayIndex || formData.id}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        
        {/* TEMEL BİLGİLER */}
        <Card className="border border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Temel Bilgiler</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {editingSections.basic ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSaveSection('basic')}
                      disabled={loading}
                      className="h-8"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSection('basic')}
                      className="h-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSection('basic')}
                    className="h-8"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Müşteri</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.customer || ''}
                      onChange={(e) => handleInputChange('customer', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{formData.customer}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Satış Fırsatı Adı</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.eventName || formData.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{formData.eventName || formData.title}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Fırsat Kaynağı</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.source || ''}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.source || '-'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Proje Türü</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.project_type || ''}
                      onChange={(e) => handleInputChange('project_type', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.project_type || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">İş Türü</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.business_type || ''}
                      onChange={(e) => handleInputChange('business_type', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.business_type || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Ülke</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.country || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Şehir</label>
                  {editingSections.basic ? (
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.city || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SÜREÇ BİLGİLERİ */}
        <Card className="border border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Süreç Bilgileri</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {editingSections.process ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSaveSection('process')}
                      disabled={loading}
                      className="h-8"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSection('process')}
                      className="h-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSection('process')}
                    className="h-8"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Durum</label>
                  {editingSections.process ? (
                    <Select value={formData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Açık</SelectItem>
                        <SelectItem value="won">Kazanıldı</SelectItem>
                        <SelectItem value="lost">Kaybedildi</SelectItem>
                        <SelectItem value="negotiation">Müzakere</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>
                      <Badge className={`${getStatusColor(formData.statusText)} border px-3 py-1`}>
                        {formData.statusText}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Aşama</label>
                  {editingSections.process ? (
                    <Select value={formData.stage || ''} onValueChange={(value) => handleInputChange('stage', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Aşama seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Yeni Fırsat</SelectItem>
                        <SelectItem value="qualified">Nitelikli Fırsat</SelectItem>
                        <SelectItem value="proposal">Teklif Bekleniyor</SelectItem>
                        <SelectItem value="negotiation">Müzakere</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{formData.stage || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Kullanıcı Adı Soyadı</label>
                  {editingSections.process ? (
                    <Input
                      value={formData.contactPerson || formData.contact_person || ''}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          {(formData.contactPerson || formData.contact_person || 'NN').split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-gray-900">{formData.contactPerson || formData.contact_person || '-'}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Başarı Olasılığı (%)</label>
                  {editingSections.process ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability || 50}
                      onChange={(e) => handleInputChange('probability', parseInt(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.probability || 50}%</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Son Güncelleme</label>
                  <p className="text-gray-900">{formatDate(formData.updated_at || formData.lastUpdate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Oluşturulma Tarihi</label>
                  <p className="text-gray-900">{formatDate(formData.created_at || formData.lastUpdate)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FİNANSAL BİLGİLER */}
        <Card className="border border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Finansal Bilgiler</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {editingSections.financial ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSaveSection('financial')}
                      disabled={loading}
                      className="h-8"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSection('financial')}
                      className="h-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSection('financial')}
                    className="h-8"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Öngörülen Gelir</label>
                  {editingSections.financial ? (
                    <Input
                      type="number"
                      value={formData.amount || formData.expected_revenue || 0}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(formData.amount || formData.expected_revenue || 0, formData.currency)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Para Birimi</label>
                  {editingSections.financial ? (
                    <Select value={formData.currency || 'TRY'} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Para birimi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{formData.currency || 'TRY'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Başarı Olasılığı</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{width: `${formData.probability || 50}%`}}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{formData.probability || 50}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Beklenen Gelir</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency((formData.amount || 0) * (formData.probability || 50) / 100, formData.currency)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DETAYLAR */}
        <Card className="border border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Proje Bilgileri</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {editingSections.details ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSaveSection('details')}
                      disabled={loading}
                      className="h-8"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSection('details')}
                      className="h-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSection('details')}
                    className="h-8"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Açıklama ve Notlar</label>
                {editingSections.details ? (
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full min-h-[100px]"
                    placeholder="Fırsat hakkında açıklama ve notlar..."
                  />
                ) : (
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-md min-h-[60px]">
                    {formData.description || 'Açıklama eklenmemiş.'}
                  </p>
                )}
              </div>

              {/* Dosyalar */}
              {((formData.design_files && formData.design_files.length > 0) || 
                (formData.sample_files && formData.sample_files.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tasarım Dosyaları */}
                  {formData.design_files && formData.design_files.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Tasarım Dosyaları</label>
                      <div className="space-y-2">
                        {formData.design_files.map((fileId, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <span className="text-sm text-gray-700">Dosya {index + 1}</span>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 hover:bg-blue-50"
                                onClick={() => handleFilePreview(formData.design_files, 'Tasarım Dosyaları', index)}
                              >
                                <Eye className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Örnek Dosyalar */}
                  {formData.sample_files && formData.sample_files.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Örnek Resim ve Videolar</label>
                      <div className="space-y-2">
                        {formData.sample_files.map((fileId, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <span className="text-sm text-gray-700">Dosya {index + 1}</span>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 hover:bg-blue-50"
                                onClick={() => handleFilePreview(formData.sample_files, 'Örnek Resim ve Videolar', index)}
                              >
                                <Eye className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ETİKETLER */}
        {formData.tags && formData.tags.length > 0 && (
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span>Etiketler</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {editingSections.tags ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSaveSection('tags')}
                        disabled={loading}
                        className="h-8"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSection('tags')}
                        className="h-8"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSection('tags')}
                      className="h-8"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Düzenle
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {editingSections.tags ? (
                <Input
                  value={(formData.tags || []).join(', ')}
                  onChange={(e) => handleInputChange('tags', e.target.value.split(', ').filter(tag => tag.trim()))}
                  className="w-full"
                  placeholder="Etiketleri virgülle ayırarak giriniz"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className={`text-xs px-3 py-1 ${tagColors[tag] || 'bg-gray-500 text-white'} border-0`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}