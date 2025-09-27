import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  User,
  Building,
  Phone,
  Mail,
  Save,
  CheckCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

const ContactRegistrationPage = () => {
  const { registrationKey } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [contact, setContact] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    position: '',
    notes: ''
  });
  const [updateCompleted, setUpdateCompleted] = useState(false);

  useEffect(() => {
    if (registrationKey) {
      loadContactByRegistrationKey();
    }
  }, [registrationKey]);

  const loadContactByRegistrationKey = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/contact-registration/${registrationKey}`);
      
      if (!response.ok) {
        throw new Error('Registration key not found or expired');
      }
      
      const data = await response.json();
      setContact(data.contact);
      setSupplier(data.supplier);
      
      // Pre-populate form with existing contact data
      setFormData({
        full_name: data.contact.full_name || '',
        mobile: data.contact.mobile || '',
        email: data.contact.email || '',
        position: data.contact.position || '',
        notes: data.contact.notes || ''
      });
      
    } catch (error) {
      console.error('Error loading contact:', error);
      toast({
        title: "Hata",
        description: "Kayıt linki geçersiz veya süresi dolmuş",
        variant: "destructive"
      });
    } finally {
      setPageLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.full_name.trim() || !formData.mobile.trim() || !formData.email.trim()) {
      toast({
        title: "Hata",
        description: "Ad, telefon ve e-posta alanları zorunludur",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Hata",
        description: "Geçerli bir e-posta adresi giriniz",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/contact-registration/${registrationKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update contact');
      }

      const updatedContact = await response.json();
      setContact(updatedContact);
      setUpdateCompleted(true);

      toast({
        title: "Başarılı",
        description: "Bilgileriniz başarıyla güncellendi",
        variant: "default"
      });

    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Hata",
        description: error.message || "Bilgiler güncellenirken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sayfa yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!contact || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz Link</h2>
            <p className="text-gray-600">
              Bu kayıt linki geçersiz veya süresi dolmuş. Lütfen yeni bir link talep ediniz.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {updateCompleted ? 'Bilgiler Güncellendi!' : 'Bilgilerinizi Güncelleyin'}
          </h1>
          <p className="text-gray-600">
            {updateCompleted 
              ? 'Bilgileriniz başarıyla güncellendi ve kaydedildi'
              : 'Lütfen güncel bilgilerinizi girerek kayıt işlemini tamamlayın'
            }
          </p>
        </div>

        {updateCompleted ? (
          /* Success State */
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Tebrikler! Bilgileriniz Kaydedildi
                </h2>
                
                <p className="text-gray-600 mb-6">
                  <strong>{contact.full_name}</strong>, bilgileriniz başarıyla güncellendi.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Ad Soyad:</span>
                      <span className="text-sm text-gray-900">{contact.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Firma:</span>
                      <span className="text-sm text-gray-900">{supplier.company_short_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Pozisyon:</span>
                      <span className="text-sm text-gray-900">{contact.position || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">E-posta:</span>
                      <span className="text-sm text-gray-900">{contact.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Telefon:</span>
                      <span className="text-sm text-gray-900">{contact.mobile}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    🎉 Kayıt işleminiz tamamlandı. İlgili ekip sizinle iletişime geçecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Firma Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Firma:</span>
                      <span className="text-sm text-gray-900">{supplier.company_short_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Ünvan:</span>
                      <span className="text-sm text-gray-900">{supplier.company_title || 'Belirtilmemiş'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Kişisel Bilgileriniz</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad *
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Adınız ve soyadınız"
                    required
                  />
                </div>

                {/* Mobile Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cep Telefonu *
                  </label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="0535 555 0000"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="ornek@email.com"
                    required
                  />
                </div>

                {/* Position Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pozisyon
                  </label>
                  <Input
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Örn: İş Geliştirme Müdürü"
                  />
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Ek bilgiler..."
                    className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                <Save className="h-5 w-5 mr-2" />
                {isLoading ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactRegistrationPage;