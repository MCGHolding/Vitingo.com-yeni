import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  User, 
  Phone, 
  Mail, 
  Briefcase,
  Tag,
  X,
  Save,
  CheckCircle,
  Plus
} from 'lucide-react';

const EditContactModal = ({ contact, supplier, onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [contactUpdated, setContactUpdated] = useState(false);
  const [updatedContactInfo, setUpdatedContactInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    position: '',
    tags: [],
    notes: ''
  });

  const [currentTag, setCurrentTag] = useState('');

  // Initialize form data when contact prop changes
  useEffect(() => {
    if (contact) {
      setFormData({
        full_name: contact.full_name || '',
        mobile: contact.mobile || '',
        email: contact.email || '',
        position: contact.position || '',
        tags: contact.tags || [],
        notes: contact.notes || ''
      });
    }
  }, [contact]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleGoBack = () => {
    setContactUpdated(false);
  };

  const handleGoToList = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.full_name.trim()) {
      toast({
        title: "Hata",
        description: "Ad Soyadı alanı zorunludur",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      // Update contact
      const response = await fetch(`${backendUrl}/api/supplier-contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update contact');
      }

      const updatedContact = await response.json();

      // Set success state
      setUpdatedContactInfo({
        name: updatedContact.full_name,
        position: updatedContact.position,
        email: updatedContact.email,
        mobile: updatedContact.mobile,
        tags_count: updatedContact.tags ? updatedContact.tags.length : 0
      });
      setContactUpdated(true);

      toast({
        title: "Başarılı",
        description: "Yetkili kişi başarıyla güncellendi",
        variant: "default"
      });

      // Call onSave callback to refresh parent data
      if (onSave) {
        onSave();
      }

    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Hata",
        description: error.message || "Yetkili kişi güncellenirken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contactUpdated ? 'Yetkili Kişi Güncellendi!' : 'Yetkili Kişi Düzenle'}
              </h1>
              <p className="text-gray-600">
                {contactUpdated 
                  ? 'Yetkili kişi bilgileri başarıyla güncellendi'
                  : `${supplier?.company_short_name} - ${contact.full_name}`
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {contactUpdated ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tebrikler, Yetkili Kişi Başarı ile Güncellendi!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{updatedContactInfo?.name}</strong> bilgileri başarıyla güncellendi.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Ad Soyadı:</span>
                        <span className="text-sm text-gray-900">{updatedContactInfo?.name}</span>
                      </div>
                      {updatedContactInfo?.position && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Görevi:</span>
                          <span className="text-sm text-gray-900">{updatedContactInfo?.position}</span>
                        </div>
                      )}
                      {updatedContactInfo?.mobile && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Cep Telefonu:</span>
                          <span className="text-sm text-gray-900">{updatedContactInfo?.mobile}</span>
                        </div>
                      )}
                      {updatedContactInfo?.email && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Email:</span>
                          <span className="text-sm text-gray-900">{updatedContactInfo?.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Etiket Sayısı:</span>
                        <span className="text-sm text-gray-900">{updatedContactInfo?.tags_count} etiket</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      🎉 Yetkili kişi bilgileri başarıyla güncellendi ve değişiklikler kaydedildi.
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Tekrar Düzenle</span>
                    </Button>
                    
                    <Button onClick={handleGoToList} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Listeye Dön</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Kişisel Bilgiler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Soyadı *
                      </label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Ad Soyadı"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Görevi
                      </label>
                      <Input
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        placeholder="Örn: İş Geliştirme Müdürü"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>İletişim Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cep Telefonu
                      </label>
                      <Input
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        placeholder="0535 555 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Etiketler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Etiket girin..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Notlar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Bu kişi hakkında ek notlar..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditContactModal;