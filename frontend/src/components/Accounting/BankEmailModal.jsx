import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send,
  X,
  Mail,
  Paperclip,
  Type,
  Building2,
  Globe,
  CheckCircle,
  ArrowLeft,
  Home
} from 'lucide-react';

export default function BankEmailModal({ banks, mode, onClose }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: mode === 'single' ? `Banka Bilgileri - ${banks[0]?.bank_name}` : `Banka Bilgileri - ${banks[0]?.country}`,
    body: generateDefaultBody(),
    attachments: []
  });
  const [isLoading, setIsLoading] = useState(false);

  function generateDefaultBody() {
    if (mode === 'single' && banks.length === 1) {
      const bank = banks[0];
      return `Merhaba,

Aşağıdaki banka bilgilerini sizinle paylaşıyorum:

🏦 Banka Bilgileri:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Banka Adı: ${bank.bank_name}
Ülke: ${bank.country === 'Turkey' ? 'Türkiye 🇹🇷' : bank.country === 'UAE' ? 'BAE 🇦🇪' : bank.country === 'USA' ? 'ABD 🇺🇸' : bank.country}

${bank.swift_code ? `SWIFT Kodu: ${bank.swift_code}` : ''}
${bank.iban ? `IBAN: ${bank.iban}` : ''}
${bank.routing_number ? `Routing Number: ${bank.routing_number}` : ''}
${bank.us_account_number ? `Account Number: ${bank.us_account_number}` : ''}
${bank.branch_name ? `Şube: ${bank.branch_name}` : ''}
${bank.branch_code ? `Şube Kodu: ${bank.branch_code}` : ''}
${bank.account_holder ? `Hesap Sahibi: ${bank.account_holder}` : ''}
${bank.account_number ? `Hesap No: ${bank.account_number}` : ''}
${bank.bank_address ? `Banka Adresi: ${bank.bank_address}` : ''}
${bank.recipient_address ? `Alıcı Adresi: ${bank.recipient_address}` : ''}
${bank.recipient_name ? `Alıcı İsmi: ${bank.recipient_name}` : ''}
${bank.recipient_zip_code ? `Zip Code: ${bank.recipient_zip_code}` : ''}

İyi çalışmalar dileriz.

${currentUser?.fullName || 'Vitingo CRM Kullanıcısı'}
Vitingo CRM Sistemi`;
    } else {
      const country = banks[0]?.country;
      const countryName = country === 'Turkey' ? 'Türkiye 🇹🇷' : country === 'UAE' ? 'BAE 🇦🇪' : country === 'USA' ? 'ABD 🇺🇸' : country;
      
      let body = `Merhaba,

Aşağıdaki ${countryName} banka bilgilerini sizinle paylaşıyorum:

🏦 ${countryName} Banka Bilgileri:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

      banks.forEach((bank, index) => {
        body += `${index + 1}. ${bank.bank_name}
`;
        if (bank.swift_code) body += `   SWIFT: ${bank.swift_code}\n`;
        if (bank.iban) body += `   IBAN: ${bank.iban}\n`;
        if (bank.routing_number) body += `   Routing Number: ${bank.routing_number}\n`;
        if (bank.us_account_number) body += `   Account Number: ${bank.us_account_number}\n`;
        if (bank.branch_name) body += `   Şube: ${bank.branch_name}\n`;
        if (bank.account_holder) body += `   Hesap Sahibi: ${bank.account_holder}\n`;
        body += '\n';
      });

      body += `İyi çalışmalar dileriz.

${currentUser?.fullName || 'Vitingo CRM Kullanıcısı'}
Vitingo CRM Sistemi`;

      return body;
    }
  }

  const emailTemplates = [
    {
      name: 'Standart Banka Bilgileri',
      subject: mode === 'single' ? `Banka Bilgileri - ${banks[0]?.bank_name}` : `${banks[0]?.country} Banka Bilgileri`,
      body: generateDefaultBody()
    },
    {
      name: 'Resmi Banka Bildirimi',
      subject: mode === 'single' ? `Resmi Banka Bilgileri - ${banks[0]?.bank_name}` : `${banks[0]?.country} Resmi Banka Bilgileri`,
      body: `Sayın Yetkili,

Ekte/aşağıda belirtilen banka hesap bilgilerini resmi olarak bildiririz:

${generateDefaultBody().split('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')[1]}

Saygılarımızla.

${currentUser?.fullName || 'Vitingo CRM Kullanıcısı'}
Finans Departmanı`
    }
  ];

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (template) => {
    setEmailData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body
    }));
  };

  const handleSendEmail = async () => {
    if (!emailData.to.trim()) {
      toast({
        title: "Hata",
        description: "Alıcı email adresi zorunludur",
        variant: "destructive"
      });
      return;
    }

    if (!emailData.subject.trim()) {
      toast({
        title: "Hata", 
        description: "Email konusu zorunludur",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create mailto link for now (can be replaced with email service)
      const mailtoLink = `mailto:${emailData.to}${emailData.cc ? `?cc=${emailData.cc}` : ''}${emailData.bcc ? `&bcc=${emailData.bcc}` : ''}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      
      window.location.href = mailtoLink;
      
      toast({
        title: "Başarılı",
        description: "Email istemciniz açıldı",
        variant: "default"
      });
      
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Hata",
        description: "Email gönderilirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {mode === 'single' ? <Building2 className="h-5 w-5 text-blue-600" /> : <Globe className="h-5 w-5 text-blue-600" />}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {mode === 'single' ? 'Banka Bilgisi Gönder' : 'Ülke Bankalarını Gönder'}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {mode === 'single' 
                    ? `${banks[0]?.bank_name} banka bilgilerini email ile gönderin`
                    : `${banks[0]?.country} ülkesine ait ${banks.length} banka bilgisini email ile gönderin`
                  }
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-6">
          {/* Email Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type className="inline h-4 w-4 mr-1" />
              Hazır Şablonlar
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {emailTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {template.subject}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alıcı *
              </label>
              <Input
                type="email"
                value={emailData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="ornek@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CC
              </label>
              <Input
                type="email"
                value={emailData.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                placeholder="cc@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BCC
              </label>
              <Input
                type="email"
                value={emailData.bcc}
                onChange={(e) => handleInputChange('bcc', e.target.value)}
                placeholder="bcc@email.com"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konu *
            </label>
            <Input
              value={emailData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Email konusunu giriniz"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik *
            </label>
            <textarea
              value={emailData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Email içeriğinizi yazınız..."
              className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </CardContent>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          
          <Button 
            onClick={handleSendEmail}
            disabled={isLoading || !emailData.to.trim() || !emailData.subject.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Gönderiliyor...' : 'Email Gönder'}
          </Button>
        </div>
      </Card>
    </div>
  );
}