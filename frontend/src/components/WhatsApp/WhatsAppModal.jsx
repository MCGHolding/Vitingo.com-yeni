import React, { useState, useEffect } from 'react';

const WhatsAppModal = ({ isOpen, onClose, recipient, defaultMessage = '', messageType = 'custom' }) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [phone, setPhone] = useState(recipient?.phone || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setPhone(recipient?.phone || '');
      setMessage(defaultMessage);
    }
  }, [isOpen, recipient, defaultMessage]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/whatsapp/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      let content = template.content;
      
      // Değişkenleri doldur
      content = content.replace(/{customerName}/g, recipient?.name || recipient?.companyName || '');
      content = content.replace(/{companyName}/g, 'Quattro Stand');
      content = content.replace(/{invoiceNo}/g, recipient?.invoiceNo || '');
      content = content.replace(/{amount}/g, recipient?.amount ? `₺${recipient.amount.toLocaleString('tr-TR')}` : '');
      content = content.replace(/{dueDate}/g, recipient?.dueDate || '');
      content = content.replace(/{daysOverdue}/g, recipient?.daysOverdue || '');
      content = content.replace(/{totalDebt}/g, recipient?.totalDebt ? `₺${recipient.totalDebt.toLocaleString('tr-TR')}` : '');
      content = content.replace(/{overdueAmount}/g, recipient?.overdueAmount ? `₺${recipient.overdueAmount.toLocaleString('tr-TR')}` : '');
      content = content.replace(/{receiptNo}/g, recipient?.receiptNo || '');
      content = content.replace(/{date}/g, new Date().toLocaleDateString('tr-TR'));
      
      setMessage(content);
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    if (!phone) {
      alert('Telefon numarası gerekli');
      return;
    }
    if (!message) {
      alert('Mesaj içeriği gerekli');
      return;
    }
    
    setSending(true);
    try {
      const response = await fetch(`${backendUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message,
          recipientName: recipient?.name || recipient?.companyName || '',
          recipientType: recipient?.type || 'customer',
          recipientId: recipient?.id || '',
          messageType: selectedTemplate || 'custom'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // WhatsApp Web'i yeni pencerede aç
        window.open(data.whatsappUrl, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Mesaj gönderilirken hata oluştu');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">WhatsApp Mesajı</h3>
              <p className="text-green-100 text-sm">{recipient?.name || recipient?.companyName || 'Alıcı'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🇹🇷 +90</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Şablon Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj Şablonu</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Şablon seçin veya özel mesaj yazın...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mesaj */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj İçeriği</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Mesajınızı yazın..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length} karakter</p>
          </div>

          {/* Önizleme */}
          {message && (
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Önizleme:</p>
              <div className="bg-green-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {message}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !phone || !message}
            className={`px-6 py-2 rounded-lg font-medium flex items-center transition ${
              sending || !phone || !message
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent mr-2"></div>
                Gönderiliyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp'ta Aç
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
