import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Signature,
  AlertCircle,
  DollarSign,
  Banknote,
  CreditCard,
  FileCheck,
  Building,
  User,
  Calendar
} from 'lucide-react';

const CollectionReceiptApprovalPage = ({ signatureKey }) => {
  const [receiptData, setReceiptData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null); // null, 'approved', 'rejected'
  const [formData, setFormData] = useState({
    signer_name: '',
    signer_title: '',
    comments: ''
  });

  useEffect(() => {
    if (signatureKey) {
      loadReceiptData();
    }
  }, [signatureKey]);

  const loadReceiptData = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipt-approval/${signatureKey}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded receipt data:', data);
        setReceiptData(data);
      } else {
        const error = await response.text();
        console.error('Failed to load receipt data:', error);
        alert('Makbuz yüklenemedi: ' + error);
      }
    } catch (error) {
      console.error('Error loading receipt data:', error);
      alert('Hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (status) => {
    if (!formData.signer_name.trim()) {
      alert('Lütfen adınızı ve soyadınızı girin');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const submissionData = {
        signature_key: signatureKey,
        status: status,
        signer_name: formData.signer_name,
        signer_title: formData.signer_title,
        signature_date: new Date().toISOString().split('T')[0],
        comments: formData.comments
      };

      const response = await fetch(`${backendUrl}/api/collection-receipt-approval/${signatureKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Approval result:', result);
        setApprovalStatus(status);
      } else {
        const error = await response.text();
        console.error('Failed to submit approval:', error);
        alert('İşlem tamamlanamadı: ' + error);
      }
    } catch (error) {
      console.error('Error submitting approval:', error);
      alert('Hata oluştu: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '0,00';
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const downloadReceiptPDF = async () => {
    if (!receiptData?.receipt) return;
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts/${receiptData.receipt.id}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tahsilat_Makbuzu_${receiptData.receipt.receipt_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('PDF dosyası indirilemedi');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('PDF indirme hatası: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Tahsilat makbuzu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Makbuz Bulunamadı</h1>
          <p className="mt-2 text-gray-600">İstenen tahsilat makbuzu bulunamadı veya erişim hakkınız bulunmuyor.</p>
        </div>
      </div>
    );
  }

  // Show success message if already processed
  if (approvalStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          {approvalStatus === 'approved' ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Makbuz İmzalandı!</h2>
              <p className="text-gray-600 mb-6">
                Tahsilat makbuzu başarıyla imzalandı. Makbuz sisteme kaydedildi.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Makbuz Reddedildi</h2>
              <p className="text-gray-600 mb-6">
                Tahsilat makbuzu reddedildi. İlgili taraflara bildirim gönderildi.
              </p>
            </>
          )}
          
          <Button
            onClick={downloadReceiptPDF}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Makbuzu PDF İndir
          </Button>
        </div>
      </div>
    );
  }

  const receipt = receiptData.receipt;
  const paymentDetails = receipt.payment_details || {};

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tahsilat Makbuzu İmzalama</h1>
                <p className="text-gray-600">Makbuz No: {receipt.receipt_number}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Clock className="w-4 h-4 mr-1" />
                İmza Bekliyor
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Önemli Bilgilendirme</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Bu tahsilat makbuzu dijital olarak imzalanmak üzere size gönderilmiştir. 
                     Makbuzu imzalamadan önce tüm bilgileri dikkatlice kontrol ediniz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tahsilat Makbuzu Detayları</h2>
          
          {/* Company Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Şirket Bilgileri
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Şirket:</strong> {receipt.company_name}</p>
                <p><strong>Adres:</strong> {receipt.company_address}</p>
                <p><strong>Telefon:</strong> {receipt.company_phone}</p>
                <p><strong>E-posta:</strong> {receipt.company_email}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Ödeme Yapan
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Ad/Şirket:</strong> {receipt.payer_name}</p>
                <p><strong>E-posta:</strong> {receipt.payer_email}</p>
                <p><strong>Ödeme Sebebi:</strong> {receipt.payment_reason}</p>
              </div>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Makbuz Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <p><strong>Makbuz No:</strong> {receipt.receipt_number}</p>
              <p><strong>Düzenleme Tarihi:</strong> {new Date(receipt.issue_date).toLocaleDateString('tr-TR')}</p>
              <p><strong>Düzenleyen:</strong> {receipt.issuer_name} - {receipt.issuer_title}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Ödeme Detayları
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Banknote className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Nakit:</span>
                <span className="text-sm">₺{formatNumber(paymentDetails.cash_amount || 0)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Kredi Kartı:</span>
                <span className="text-sm">₺{formatNumber(paymentDetails.credit_card_amount || 0)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Çek:</span>
                <span className="text-sm">₺{formatNumber(paymentDetails.check_amount || 0)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Senet:</span>
                <span className="text-sm">₺{formatNumber(paymentDetails.promissory_note_amount || 0)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Toplam Tutar:</span>
                <span className="text-2xl font-bold text-green-600">₺{formatNumber(receipt.total_amount)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Yazıyla:</strong> {receipt.total_amount_words}
              </p>
            </div>
          </div>
        </div>

        {/* Signature Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">İmzalama Bilgileri</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad *
              </label>
              <Input
                type="text"
                required
                value={formData.signer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, signer_name: e.target.value }))}
                placeholder="İmzalayan kişinin ad soyad"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ünvan
              </label>
              <Input
                type="text"
                value={formData.signer_title}
                onChange={(e) => setFormData(prev => ({ ...prev, signer_title: e.target.value }))}
                placeholder="Ünvan veya görev (opsiyonel)"
                className="w-full"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ek Yorumlar (Opsiyonel)
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Ek yorumlarınızı buraya yazabilirsiniz"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Dikkat:</strong> Bu makbuzu dijital olarak imzalayarak, yukarıda belirtilen ödeme tutarını 
              aldığınızı teyit etmiş olursunuz. İmzalanan makbuz yasal olarak geçerlidir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleSubmit('approved')}
              disabled={isSubmitting || !formData.signer_name.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Signature className="mr-2 h-4 w-4" />
              )}
              Makbuzu İmzala ve Onayla
            </Button>
            
            <Button
              onClick={() => handleSubmit('rejected')}
              disabled={isSubmitting || !formData.signer_name.trim()}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Makbuzu Reddet
            </Button>

            <Button
              onClick={downloadReceiptPDF}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionReceiptApprovalPage;