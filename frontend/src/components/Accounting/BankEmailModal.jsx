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
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmailInfo, setSentEmailInfo] = useState(null);

  function generateDefaultBody() {
    if (mode === 'single' && banks.length === 1) {
      const bank = banks[0];
      const companyName = bank.company_name || 'Şirket';
      const countryFlag = bank.country === 'Turkey' ? '🇹🇷' : bank.country === 'UAE' ? '🇦🇪' : bank.country === 'USA' ? '🇺🇸' : '';
      const countryName = bank.country === 'Turkey' ? 'Türkiye' : bank.country === 'UAE' ? 'BAE' : bank.country === 'USA' ? 'ABD' : bank.country;
      
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Banka Bilgileri</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">${companyName}</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">Merhaba,</p>
              <p style="margin: 15px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Aşağıda <strong>${companyName}</strong> şirketimize ait banka bilgilerini bulabilirsiniz.
              </p>
            </td>
          </tr>
          
          <!-- Bank Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td colspan="2" style="padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                          <h2 style="margin: 0; color: #667eea; font-size: 18px; font-weight: 600;">🏦 ${bank.bank_name}</h2>
                          <p style="margin: 5px 0 0 0; color: #999999; font-size: 13px;">${countryFlag} ${countryName}</p>
                        </td>
                      </tr>
                      
                      ${bank.swift_code ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px; width: 140px;">SWIFT Kodu:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.swift_code}</td>
                      </tr>` : ''}
                      
                      ${bank.iban ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">IBAN:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500; font-family: monospace;">${bank.iban}</td>
                      </tr>` : ''}
                      
                      ${bank.routing_number ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Routing Number:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.routing_number}</td>
                      </tr>` : ''}
                      
                      ${bank.us_account_number ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Account Number:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.us_account_number}</td>
                      </tr>` : ''}
                      
                      ${bank.account_holder ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Hesap Sahibi:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.account_holder}</td>
                      </tr>` : ''}
                      
                      ${bank.branch_name ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Şube:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px;">${bank.branch_name}${bank.branch_code ? ` (${bank.branch_code})` : ''}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6;">
                İyi çalışmalar dileriz.<br>
                <strong style="color: #333333;">${currentUser?.fullName || 'Vitingo CRM Kullanıcısı'}</strong><br>
                <span style="color: #999999; font-size: 12px;">Vitingo CRM</span>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else {
      // Multiple banks - HTML template
      const country = banks[0]?.country;
      const countryFlag = country === 'Turkey' ? '🇹🇷' : country === 'UAE' ? '🇦🇪' : country === 'USA' ? '🇺🇸' : '';
      const countryName = country === 'Turkey' ? 'Türkiye' : country === 'UAE' ? 'BAE' : country === 'USA' ? 'ABD' : country;
      
      // Generate bank cards HTML
      const bankCardsHtml = banks.map((bank, index) => {
        const companyName = bank.company_name || 'Şirket Bilgisi Yok';
        
        return `
          <!-- Bank Card ${index + 1} -->
          <tr>
            <td style="padding: 0 40px ${index === banks.length - 1 ? '30px' : '15px'} 40px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <!-- Bank Header -->
                      <tr>
                        <td colspan="2" style="padding-bottom: 8px;">
                          <h2 style="margin: 0; color: #667eea; font-size: 18px; font-weight: 600;">🏦 ${bank.bank_name}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                          <p style="margin: 0; color: #666666; font-size: 13px;">
                            <strong style="color: #333333;">Şirket:</strong> ${companyName}
                          </p>
                          <p style="margin: 5px 0 0 0; color: #999999; font-size: 13px;">${countryFlag} ${countryName}</p>
                        </td>
                      </tr>
                      
                      ${bank.swift_code ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px; width: 140px;">SWIFT Kodu:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.swift_code}</td>
                      </tr>` : ''}
                      
                      ${bank.iban ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">IBAN:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500; font-family: monospace;">${bank.iban}</td>
                      </tr>` : ''}
                      
                      ${bank.routing_number ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Routing Number:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.routing_number}</td>
                      </tr>` : ''}
                      
                      ${bank.us_account_number ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Account Number:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.us_account_number}</td>
                      </tr>` : ''}
                      
                      ${bank.account_holder ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Hesap Sahibi:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.account_holder}</td>
                      </tr>` : ''}
                      
                      ${bank.branch_name ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Şube:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px;">${bank.branch_name}${bank.branch_code ? ` (${bank.branch_code})` : ''}</td>
                      </tr>` : ''}
                      
                      ${bank.account_number ? `
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 13px;">Hesap No:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: 500;">${bank.account_number}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }).join('');
      
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Banka Bilgileri</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.9; font-size: 14px;">${countryFlag} ${countryName} - ${banks.length} Banka</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">Merhaba,</p>
              <p style="margin: 15px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Aşağıda <strong>${countryName}</strong> bölgesine ait ${banks.length} adet banka hesap bilgilerini bulabilirsiniz.
              </p>
            </td>
          </tr>
          
          <!-- Bank Cards -->
          ${bankCardsHtml}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6;">
                İyi çalışmalar dileriz.<br>
                <strong style="color: #333333;">${currentUser?.fullName || 'Vitingo CRM Kullanıcısı'}</strong><br>
                <span style="color: #999999; font-size: 12px;">Vitingo CRM</span>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const requestData = {
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        body: emailData.body,
        from_name: currentUser?.fullName || 'Vitingo CRM Kullanıcısı',
        from_email: currentUser?.email || 'info@quattrostand.com',
        to_name: emailData.to.split('@')[0],
        banks: banks,
        mode: mode,
        attachments: emailData.attachments
      };

      const response = await fetch(`${backendUrl}/api/send-bank-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        setSentEmailInfo({
          to: emailData.to,
          subject: emailData.subject,
          message_id: result.message_id
        });
        setEmailSent(true);
        
        toast({
          title: "Başarılı",
          description: "Email başarıyla gönderildi",
          variant: "default"
        });
      } else {
        throw new Error(result.error || 'Email gönderilemedi');
      }

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Hata",
        description: error.message || "Email gönderilirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoBack = () => {
    setEmailSent(false);
  };
  
  const handleGoToDashboard = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${emailSent ? 'bg-green-100' : 'bg-blue-100'}`}>
                {emailSent ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  mode === 'single' ? <Building2 className="h-5 w-5 text-blue-600" /> : <Globe className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {emailSent ? 'Email Gönderildi!' : (mode === 'single' ? 'Banka Bilgisi Gönder' : 'Ülke Bankalarını Gönder')}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {emailSent 
                    ? `${sentEmailInfo?.to || ''} adresine email başarıyla gönderildi`
                    : (mode === 'single' 
                      ? `${banks[0]?.bank_name} banka bilgilerini email ile gönderin`
                      : `${banks[0]?.country} ülkesine ait ${banks.length} banka bilgisini email ile gönderin`
                    )
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
          {emailSent ? (
            /* Success Message */
            <div className="text-center py-8">
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tebrikler, Mailiniz Başarı ile Gönderilmiştir
              </h2>
              
              <p className="text-gray-600 mb-6">
                {mode === 'single' 
                  ? `${banks[0]?.bank_name} banka bilgileri ${sentEmailInfo?.to || ''} adresine başarıyla gönderildi.`
                  : `${banks[0]?.country} ülkesine ait ${banks.length} banka bilgisi ${sentEmailInfo?.to || ''} adresine başarıyla gönderildi.`
                }
              </p>
              
              {sentEmailInfo?.message_id && (
                <div className="bg-gray-50 p-3 rounded-lg mb-6">
                  <p className="text-sm text-gray-500">
                    <strong>Email ID:</strong> {sentEmailInfo.message_id}
                  </p>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  📧 Email başarıyla gönderildi ve alıcı tarafından kısa sürede okunacaktır.
                </p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-lg">
          {emailSent ? (
            <>
              <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Geri Dön</span>
              </Button>
              
              <Button onClick={handleGoToDashboard} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </Card>
    </div>
  );
}