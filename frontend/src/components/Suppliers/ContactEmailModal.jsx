import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Send,
  CheckCircle,
  Mail,
  User,
  Building
} from 'lucide-react';

const ContactEmailModal = ({ contact, supplier, onClose, onSent }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    to: contact?.email || '',
    subject: `${supplier?.company_short_name} ile İlgili Bilgilendirme`,
    message: `Merhaba ${contact?.full_name || 'Sayın Yetkili'},

${supplier?.company_short_name} firması ile ilgili size ulaşmak istiyoruz.

İyi çalışmalar.`
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.to.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Hata",
        description: "Tüm alanlar zorunludur",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.to)) {
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
      
      const response = await fetch(`${backendUrl}/api/send-contact-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          message: formData.message,
          contact_id: contact?.id,
          supplier_id: supplier?.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send email');
      }

      const result = await response.json();
      
      setEmailSent(true);

      toast({
        title: "Başarılı",
        description: "E-posta başarıyla gönderildi",
        variant: "default"
      });

      if (onSent) {
        onSent(result);
      }

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Hata",
        description: error.message || "E-posta gönderilirken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {emailSent ? 'E-posta Gönderildi!' : 'E-posta Gönder'}
              </h1>
              <p className="text-gray-600">
                {emailSent 
                  ? 'E-posta başarıyla gönderildi'
                  : `${contact?.full_name || 'Yetkili kişi'}ye e-posta gönder`
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {emailSent ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tebrikler, E-posta Başarı ile Gönderildi!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{contact?.full_name}</strong> kişisine e-posta başarıyla gönderildi.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Alıcı:</span>
                        <span className="text-sm text-gray-900">{formData.to}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Konu:</span>
                        <span className="text-sm text-gray-900">{formData.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Durum:</span>
                        <span className="text-sm text-green-600 font-medium">Gönderildi</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      📧 E-posta başarıyla gönderildi ve kayıt altına alındı.
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tamam</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact & Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Alıcı Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Yetkili Kişi:</span>
                        <span className="text-sm text-gray-900">{contact?.full_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Firma:</span>
                        <span className="text-sm text-gray-900">{supplier?.company_short_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Pozisyon:</span>
                        <span className="text-sm text-gray-900">{contact?.position || 'Belirtilmemiş'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>E-posta Detayları</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* To Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alıcı E-posta *
                    </label>
                    <Input
                      type="email"
                      value={formData.to}
                      onChange={(e) => handleInputChange('to', e.target.value)}
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konu *
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="E-posta konusu"
                      required
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesaj *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="E-posta mesajınızı yazın..."
                      className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Profesyonel ve kibar bir dil kullanınız
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Gönderiliyor...' : 'E-posta Gönder'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactEmailModal;