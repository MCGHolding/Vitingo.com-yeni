import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, FileText, User, Building, Calendar, Signature, Send, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';

const ExpenseReceiptApprovalPage = () => {
  const { token } = useParams();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [acceptanceChecked, setAcceptanceChecked] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signerCompany, setSignerCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Fetch expense receipt data from backend
  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://teklifpro-2.preview.emergentagent.com';
        const response = await fetch(`${backendUrl}/api/expense-receipt-approval/${token}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.message || 'Makbuz bulunamadı veya süresi dolmuş olabilir.');
          setLoading(false);
          return;
        }
        
        setReceiptData(data);
        
        // Pre-fill signer information from supplier data
        if (data.supplier_contact_name) {
          setSignerName(data.supplier_contact_name);
        }
        if (data.supplier_contact_specialty) {
          setSignerTitle(data.supplier_contact_specialty);
        }
        if (data.supplier_company_name) {
          setSignerCompany(data.supplier_company_name);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching receipt data:', error);
        setError('Makbuz yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [token]);

  // Format currency
  const formatCurrency = (amount, currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'TRY': '₺',
      'AED': 'د.إ'
    };
    
    return `${symbols[currency] || currency} ${amount?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Signature canvas functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save signature as base64
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    setSignatureData(dataURL);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleApprove = () => {
    if (!acceptanceChecked) {
      alert('Lütfen makbuzu onayladığınızı belirtmek için kutucuğu işaretleyin.');
      return;
    }
    
    if (!signerName.trim()) {
      alert('Lütfen adınızı soyadınızı girin.');
      return;
    }
    
    setShowSignature(true);
  };

  const handleSubmitApproval = async () => {
    if (!signatureData) {
      alert('Lütfen imzanızı atın.');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://teklifpro-2.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/expense-receipt-approval/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_data: signatureData,
          signer_name: signerName,
          signer_title: signerTitle,
          signer_company: signerCompany,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.message || 'Onay işlemi başarısız');
      }
    } catch (error) {
      console.error('Error submitting approval:', error);
      alert('Onay gönderilirken bir hata oluştu: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Makbuz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Makbuz Bulunamadı</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Lütfen e-posta ile gönderilen linki kontrol edin veya gönderen kişi ile iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Makbuz Onaylandı!</h2>
          <p className="text-gray-600 mb-4">
            <strong>{receiptData.receipt_number}</strong> numaralı gider makbuzu başarıyla onaylandı.
          </p>
          <p className="text-sm text-gray-500">
            Onay bilginiz sisteme kaydedildi ve ilgili kişilere bildirilecektir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gider Makbuzu Onayı</h1>
              <p className="text-gray-600">Aşağıdaki makbuzu incelendip onaylamanız gerekmektedir</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-blue-800 text-sm">
                Bu makbuzu onayladığınızda, tutar ve detayları onaylamış olursunuz.
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-green-600" />
            Makbuz Detayları
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Makbuz Numarası</label>
              <p className="text-lg font-semibold text-blue-600">#{receiptData.receipt_number}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
              <p className="text-lg text-gray-900">{formatDate(receiptData.date)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(receiptData.amount, receiptData.currency)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi</label>
              <p className="text-lg text-gray-900">{receiptData.supplier_name}</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{receiptData.description}</p>
            </div>

            {/* Bank Information */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Banka Bilgileri</label>
              <div className="bg-gray-50 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                {receiptData.is_usa_bank ? (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Routing Number:</span>
                      <p className="font-medium">{receiptData.supplier_routing_number}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Account Number:</span>
                      <p className="font-medium">{receiptData.supplier_us_account_number}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm text-gray-600">Bank Address:</span>
                      <p className="font-medium">{receiptData.supplier_bank_address}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">IBAN:</span>
                      <p className="font-medium">{receiptData.supplier_iban}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Banka:</span>
                      <p className="font-medium">{receiptData.supplier_bank_name}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Form */}
        {!showSignature ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-600" />
              Onay Bilgileri
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adınız ve soyadınız"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uzmanlık</label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Uzmanlık alanınız (opsiyonel)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şirket</label>
                <input
                  type="text"
                  value={signerCompany}
                  onChange={(e) => setSignerCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şirket adı (opsiyonel)"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acceptance"
                  checked={acceptanceChecked}
                  onChange={(e) => setAcceptanceChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="acceptance" className="text-sm text-gray-700">
                  Bu gider makbuzunun detaylarını inceledim ve onaylıyorum.
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleApprove}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                İmzalama Adımına Geç
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Signature className="w-6 h-6 mr-2 text-green-600" />
              Dijital İmza
            </h2>
            
            <p className="text-gray-600 mb-4">
              Makbuzu onaylamak için aşağıdaki alana imzanızı atın:
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border border-gray-300 rounded w-full cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={clearSignature}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Temizle
              </button>
              
              <button
                onClick={() => setShowSignature(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Geri
              </button>
              
              <button
                onClick={handleSubmitApproval}
                disabled={isSubmitting || !signatureData}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Onaylanıyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Makbuzu Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseReceiptApprovalPage;