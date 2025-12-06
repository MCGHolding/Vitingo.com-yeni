import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';

const PublicHandoverSign = () => {
  const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
  const { token } = useParams();
  const signatureRef = useRef(null);
  
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    loadReceipt();
  }, [token]);
  
  const loadReceipt = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/handover-receipts/public/${token}`);
      if (response.ok) {
        const data = await response.json();
        setReceipt(data.receipt);
        
        if (data.receipt.status === 'signed') {
          setSigned(true);
        }
      } else {
        setError('Belge bulunamadı veya süresi dolmuş');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Lütfen imzanızı çizin');
      return;
    }
    
    if (!signerName.trim()) {
      alert('Lütfen adınızı girin');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const signatureData = signatureRef.current.toDataURL('image/png');
      
      const response = await fetch(`${backendUrl}/api/handover-receipts/public/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signatureData,
          signerName: signerName.trim()
        })
      });
      
      if (response.ok) {
        setSigned(true);
      } else {
        alert('İmza kaydedilemedi');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };
  
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <span className="text-6xl block mb-4">❌</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hata</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-4">✅</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {receipt?.language === 'tr' ? 'Teşekkürler!' : 'Thank You!'}
          </h1>
          <p className="text-gray-600">
            {receipt?.language === 'tr' 
              ? 'Teslim belgesi başarıyla imzalandı.'
              : 'The handover receipt has been successfully signed.'
            }
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light text-orange-600">Quattro</h1>
          <p className="text-xs text-gray-400">Graphics • Stand • Print • Copy</p>
        </div>
        
        {/* Document */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          
          <h2 className="text-xl font-bold text-center mb-6">
            {receipt?.language === 'tr' ? 'Stand Teslim Tutanağı' : 'Exhibition Booth Hand Over Receipt'}
          </h2>
          
          {/* Details */}
          <div className="space-y-2 text-sm mb-6">
            <p><strong>Customer:</strong> {receipt?.customerName}</p>
            <p><strong>Exhibition:</strong> {receipt?.exhibitionName}</p>
            <p><strong>Location:</strong> {receipt?.exhibitionLocation}</p>
            <p><strong>Booth:</strong> {receipt?.hallBoothNo}</p>
            <p><strong>Stand Area:</strong> {receipt?.standArea} m²</p>
            <p><strong>Handover Date:</strong> {receipt?.handoverDate ? new Date(receipt.handoverDate).toLocaleDateString('en-GB') : '-'}</p>
          </div>
          
          <p className="text-sm text-gray-700 mb-8">
            I have seen, approved and received the {receipt?.standArea} m² {receipt?.standType} constructed stand 
            which produced and prepared by {receipt?.designCompany} on behalf of {receipt?.customerName}.
          </p>
          
          {/* Signature Area */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">
              {receipt?.language === 'tr' ? 'Müşteri İmzası' : 'Customer Signature'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">
                {receipt?.language === 'tr' ? 'Adınız Soyadınız *' : 'Your Full Name *'}
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder={receipt?.language === 'tr' ? 'Adınızı girin' : 'Enter your name'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">
                {receipt?.language === 'tr' ? 'İmzanız *' : 'Your Signature *'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40 rounded-lg'
                  }}
                  backgroundColor="rgb(249, 250, 251)"
                />
              </div>
              <button
                onClick={clearSignature}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                {receipt?.language === 'tr' ? 'Temizle' : 'Clear'}
              </button>
            </div>
            
            <button
              onClick={handleSign}
              disabled={submitting}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
            >
              {submitting 
                ? (receipt?.language === 'tr' ? 'Kaydediliyor...' : 'Saving...') 
                : (receipt?.language === 'tr' ? 'İmzala ve Onayla' : 'Sign & Confirm')
              }
            </button>
            
          </div>
          
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Quattro Stand Events LLC. All rights reserved.
        </p>
        
      </div>
    </div>
  );
};

export default PublicHandoverSign;
