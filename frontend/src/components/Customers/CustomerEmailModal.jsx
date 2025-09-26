import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send,
  X,
  Mail,
  Paperclip,
  Type,
  Building
} from 'lucide-react';

export default function CustomerEmailModal({ customer, onClose }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [emailData, setEmailData] = useState({
    to: customer.email,
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  const customerName = customer.contactPerson || customer.companyName;
  const firstName = customer.contactPerson ? customer.contactPerson.split(' ')[0] : customer.companyName;
  const lastName = customer.contactPerson ? customer.contactPerson.split(' ').slice(1).join(' ') : 'Müşterisi';

  const emailTemplates = [
    {
      name: 'Hoş Geldiniz',
      subject: 'Vitingo CRM - İş Birliği Fırsatı',
      body: `Merhaba ${firstName},

${customer.companyName} ile iş birliği yapma fırsatı bulduğumuz için çok mutluyuz!

Sizinle yakın gelecekte detayları görüşmek üzere iletişim kuracağız.

İyi çalışmalar dileriz.

${currentUser.fullName}
Vitingo CRM Ekibi`
    },
    {
      name: 'Toplantı Daveti',
      subject: 'Toplantı Daveti - ${customer.companyName}',
      body: `Merhaba ${firstName},

Bu hafta içinde ${customer.companyName} ile ilgili bir toplantı düzenlenmesini planlıyoruz.

Detayları en kısa sürede sizinle paylaşacağız.

Saygılarımla,
${currentUser.fullName}`
    },
    {
      name: 'Proje Bilgilendirme',
      subject: 'Proje Güncellemesi - ${customer.companyName}',
      body: `Merhaba ${firstName},

${customer.companyName} için devam eden projelerimizle ilgili güncellemelerimizi paylaşmak istiyoruz.

Lütfen uygun olduğunuz bir zamanda bizimle iletişim kurun.

Saygılarımla,
${currentUser.fullName}`
    },
    {
      name: 'Teklif Sunumu',
      subject: 'Yeni Teklif Sunumu - ${customer.companyName}',
      body: `Merhaba ${firstName},

${customer.companyName} için özel olarak hazırladığımız teklifimizi sunmak istiyoruz.

Bu konuda detaylı görüşme yapmak üzere sizinle iletişim kurmayı planlıyoruz.

İyi günler dileriz,
${currentUser.fullName}`
    }
  ];

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyTemplate = (template) => {
    setEmailData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body
    }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotalSize = 25 * 1024 * 1024; // 25MB total
    
    let validFiles = [];
    let totalSize = emailData.attachments.reduce((sum, file) => sum + file.size, 0);
    
    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: "Dosya Çok Büyük",
          description: `${file.name} dosyası 10MB'dan büyük olamaz`,
          variant: "destructive",
        });
        continue;
      }
      
      if (totalSize + file.size > maxTotalSize) {
        toast({
          title: "Toplam Boyut Aşıldı",
          description: "Toplam dosya boyutu 25MB'ı geçemez",
          variant: "destructive",
        });
        break;
      }
      
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result
        };
        
        setEmailData(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachment]
        }));
      };
      reader.readAsDataURL(file);
      
      totalSize += file.size;
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      toast({
        title: "Dosya(lar) Eklendi",
        description: `${validFiles.length} dosya başarıyla eklendi`,
      });
    }
    
    // Clear input
    event.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
    
    toast({
      title: "Dosya Kaldırıldı",
      description: "Dosya eklerden kaldırıldı",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendEmail = async () => {
    if (!emailData.subject.trim() || !emailData.body.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Konu ve mesaj alanları zorunludur",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get backend URL from environment
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Prepare email data for backend
      const emailPayload = {
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        body: emailData.body,
        from_name: currentUser.fullName,
        from_email: currentUser.email,
        to_name: customerName,
        customer_id: customer.id,
        customer_company: customer.companyName,
        attachments: emailData.attachments
      };

      // Send email via backend API
      const response = await fetch(`${backendUrl}/api/send-customer-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      const result = await response.json();

      if (result.success) {
        // Also save to localStorage for tracking
        const email = {
          id: Date.now(),
          from: currentUser.email,
          fromName: currentUser.fullName,
          to: emailData.to,
          toName: customerName,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          body: emailData.body,
          timestamp: new Date().toISOString(),
          status: 'sent',
          attachments: emailData.attachments.length,
          message_id: result.message_id,
          customer_id: customer.id,
          customer_company: customer.companyName
        };

        const sentEmails = JSON.parse(localStorage.getItem('sent_customer_emails') || '[]');
        sentEmails.push(email);
        localStorage.setItem('sent_customer_emails', JSON.stringify(sentEmails));

        toast({
          title: "E-posta Gönderildi",
          description: `${customer.companyName} müşterisine e-posta başarıyla gönderildi`,
        });

        onClose();
      } else {
        throw new Error(result.error || 'E-posta gönderimi başarısız');
      }

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Hata",
        description: error.message || "E-posta gönderilemedi, lütfen tekrar deneyin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailHTML = () => {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailData.subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #059669, #10B981);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .email-body {
            padding: 30px;
        }
        .email-body h2 {
            color: #059669;
            margin-top: 0;
        }
        .customer-info {
            background-color: #f0fdf4;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #10B981;
        }
        .email-signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
        }
        .email-footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Vitingo CRM</h1>
        </div>
        
        <div class="email-body">
            <h2>${emailData.subject}</h2>
            
            <div class="customer-info">
                <strong>Müşteri:</strong> ${customer.companyName}<br>
                <strong>İletişim:</strong> ${customerName}<br>
                <strong>Sektör:</strong> ${customer.sector || 'Belirtilmemiş'}
            </div>
            
            <div style="white-space: pre-wrap;">${emailData.body}</div>
            
            <div class="email-signature">
                <p><strong>İletişim:</strong></p>
                <p>
                    <strong>${currentUser.fullName}</strong><br>
                    ${currentUser.department || 'Müşteri İlişkileri'}<br>
                    E-posta: ${currentUser.email}<br>
                    Vitingo CRM Sistemi
                </p>
            </div>
        </div>
        
        <div class="email-footer">
            <p>Bu e-posta Vitingo CRM sistemi tarafından otomatik olarak oluşturulmuştur.</p>
            <p>© ${new Date().getFullYear()} Vitingo CRM - Tüm hakları saklıdır</p>
        </div>
    </div>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-3">
              <Mail className="h-6 w-6" />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-green-500 text-white text-sm">
                  <Building className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <span>Müşteri E-postası - {customer.companyName}</span>
                <p className="text-green-100 text-sm font-normal">{customer.email}</p>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-green-600"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email Form */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <Type className="h-5 w-5" />
                  <span>E-posta Detayları</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alıcı *</label>
                    <Input
                      value={emailData.to}
                      onChange={(e) => handleInputChange('to', e.target.value)}
                      placeholder="E-posta adresi"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CC</label>
                      <Input
                        value={emailData.cc}
                        onChange={(e) => handleInputChange('cc', e.target.value)}
                        placeholder="Bilgi (opsiyonel)"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">BCC</label>
                      <Input
                        value={emailData.bcc}
                        onChange={(e) => handleInputChange('bcc', e.target.value)}
                        placeholder="Gizli bilgi (opsiyonel)"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konu *</label>
                    <Input
                      value={emailData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="E-posta konusu"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj *</label>
                    <textarea
                      value={emailData.body}
                      onChange={(e) => handleInputChange('body', e.target.value)}
                      placeholder="E-posta içeriğinizi yazın..."
                      rows={8}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Attachments List */}
                  {emailData.attachments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ekli Dosyalar ({emailData.attachments.length})
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3 bg-gray-50">
                        {emailData.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between bg-white p-2 rounded border"
                          >
                            <div className="flex items-center space-x-2">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium truncate max-w-48">
                                {attachment.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({formatFileSize(attachment.size)})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(attachment.id)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Maksimum dosya boyutu: 10MB, Toplam: 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Dosya Ekle ({emailData.attachments.length})
                  </Button>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={sendEmail}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Templates Sidebar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Müşteri E-posta Şablonları</span>
              </h3>
              
              <div className="space-y-3">
                {emailTemplates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent 
                      className="p-4"
                      onClick={() => applyTemplate(template)}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.subject}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Preview */}
              {(emailData.subject || emailData.body) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Önizleme</h4>
                  <div 
                    className="bg-gray-50 p-3 rounded text-xs border max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: getEmailHTML() }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}