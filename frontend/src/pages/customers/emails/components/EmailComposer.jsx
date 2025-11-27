import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Loader2, Paperclip } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '../../../../hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EmailComposer = ({ 
  customerId, 
  customer, 
  replyToEmail = null, 
  onClose, 
  onSent,
  isReply = false
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    to: '',
    toName: '',
    subject: '',
    body: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Load user email settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users/me/email-settings`);
        setUserSettings(response.data);
        
        // Add signature to body if exists
        if (response.data?.signature && !isReply) {
          setFormData(prev => ({
            ...prev,
            body: `\n\n${response.data.signature}`
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    
    fetchSettings();
  }, [isReply]);
  
  // Set initial data for reply
  useEffect(() => {
    if (replyToEmail) {
      setFormData({
        to: replyToEmail.from?.email || '',
        toName: replyToEmail.from?.name || '',
        subject: replyToEmail.subject?.startsWith('Re:') 
          ? replyToEmail.subject 
          : `Re: ${replyToEmail.subject}`,
        body: userSettings?.signature ? `\n\n${userSettings.signature}\n\n---\n${replyToEmail.bodyText}` : `\n\n---\n${replyToEmail.bodyText}`
      });
    } else if (customer?.contacts && customer.contacts.length > 0) {
      // Pre-fill with first contact
      const firstContact = customer.contacts[0];
      setFormData(prev => ({
        ...prev,
        to: firstContact.email || '',
        toName: firstContact.fullName || firstContact.name || ''
      }));
    }
  }, [replyToEmail, customer, userSettings]);
  
  const handleSend = async () => {
    // Validation
    if (!formData.to) {
      toast({
        title: "Eksik Bilgi",
        description: "Alıcı e-posta adresi gerekli",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.subject) {
      toast({
        title: "Eksik Bilgi",
        description: "E-posta konusu gerekli",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.body) {
      toast({
        title: "Eksik Bilgi",
        description: "E-posta içeriği gerekli",
        variant: "destructive"
      });
      return;
    }
    
    setSending(true);
    try {
      const emailData = {
        to: formData.to,
        toName: formData.toName,
        subject: formData.subject,
        bodyText: formData.body,
        bodyHtml: `<p>${formData.body.replace(/\n/g, '<br>')}</p>`,
        attachments: attachments,
        replyToEmailId: replyToEmail?.id || null
      };
      
      const response = await axios.post(
        `${BACKEND_URL}/api/customers/${customerId}/emails`,
        emailData
      );
      
      onSent(response.data);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.detail || "E-posta gönderilemedi",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  // Render as inline (for reply) or modal
  const content = (
    <div className={isReply ? 'space-y-4' : ''}>
      {/* To Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kime *
        </label>
        {customer?.contacts && customer.contacts.length > 0 ? (
          <Select 
            value={formData.to} 
            onValueChange={(value) => {
              const contact = customer.contacts.find(c => c.email === value);
              setFormData({
                ...formData,
                to: value,
                toName: contact?.fullName || contact?.name || ''
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alıcı seçin" />
            </SelectTrigger>
            <SelectContent>
              {customer.contacts.map(contact => (
                <SelectItem key={contact.email} value={contact.email}>
                  {contact.fullName || contact.name} ({contact.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="email"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            placeholder="ornek@firma.com"
            disabled={isReply}
          />
        )}
      </div>
      
      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Konu *
        </label>
        <Input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="E-posta konusu"
        />
      </div>
      
      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          İçerik *
        </label>
        <Textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="E-posta içeriğini yazın..."
          rows={isReply ? 8 : 12}
          className="resize-y"
        />
      </div>
      
      {/* From Info */}
      {userSettings?.senderEmail && (
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
          ℹ️ Alıcılar size <strong>{userSettings.senderEmail}</strong> adresinden cevap verecek
        </div>
      )}
      
      {/* Attachments (placeholder) */}
      {!isReply && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ekler
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
            <Paperclip className="h-5 w-5 mx-auto mb-1" />
            <p>Dosya eklemek için tıklayın</p>
            <p className="text-xs">(Çok yakında)</p>
          </div>
        </div>
      )}
    </div>
  );
  
  if (isReply) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Cevapla</h4>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {content}
        
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            İptal
          </Button>
          <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    );
  }
  
  // Modal version
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Yeni E-posta</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            content
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={sending}
          >
            İptal
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !formData.to || !formData.subject || !formData.body}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
  );
};

export default EmailComposer;
