import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, FileText, User, Building, Calendar, Signature, Send, AlertTriangle } from 'lucide-react';
import { handoverTemplates } from '../../mock/handoverData';

const HandoverFormPage = () => {
  const { token } = useParams();
  const [handoverData, setHandoverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [acceptanceChecked, setAcceptanceChecked] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerTitle, setCustomerTitle] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Fetch handover data from backend
  useEffect(() => {
    const fetchHandoverData = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/handovers/${token}`);
        const data = await response.json();
        
        if (data.error) {
          setError('Teslim formu bulunamadı veya süresi dolmuş olabilir.');
          setLoading(false);
          return;
        }
        
        setHandoverData(data);
        setCustomerName(data.customer?.contact || '');
        setCustomerCompany(data.customer?.name || '');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching handover data:', error);
        setError('Teslim formu yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    if (token) {
      fetchHandoverData();
    }
  }, [token]);

  // Initialize canvas
  useEffect(() => {
    if (showSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 200;
      
      // Set styles
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill with white background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [showSignature]);

  // Mouse/Touch drawing handlers
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save signature data
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const submitHandover = async () => {
    if (!acceptanceChecked || !signatureData || !customerName.trim()) {
      alert('Lütfen tüm alanları doldurun ve imzanızı atın.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${backendUrl}/api/handovers/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_title: customerTitle,
          customer_company: customerCompany,
          signature_base64: signatureData,
          acceptance_confirmed: acceptanceChecked
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'Form gönderim hatası');
      }
      
    } catch (error) {
      console.error('Handover submission error:', error);
      alert('Teslim formu gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Teslim formu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-xl shadow-lg">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {handoverData?.language === 'en' ? 'Handover Completed' : 'Teslim İşlemi Tamamlandı'}
          </h2>
          <p className="text-gray-600 mb-6">
            {handoverData?.language === 'en' 
              ? 'Thank you for confirming the handover. A satisfaction survey will be sent to your email shortly.'
              : 'Teslim işlemini onayladığınız için teşekkürler. Yakında e-postanıza bir memnuniyet anketi gönderilecektir.'
            }
          </p>
          <div className="text-sm text-gray-500">
            {handoverData?.language === 'en' ? 'Reference' : 'Referans'}: {token}
          </div>
        </div>
      </div>
    );
  }

  if (!handoverData) return null;

  const template = handoverTemplates[handoverData.language] || handoverTemplates.en;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
                <p className="text-gray-600">{handoverData.project?.name}</p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">
              {handoverData.language === 'en' ? 'Project Details' : 'Proje Detayları'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span><strong>{handoverData.language === 'en' ? 'Customer' : 'Müşteri'}:</strong> {handoverData.customer?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span><strong>{handoverData.language === 'en' ? 'Contact' : 'İletişim'}:</strong> {handoverData.customer?.contact}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span><strong>{handoverData.language === 'en' ? 'Project' : 'Proje'}:</strong> {handoverData.project?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span><strong>{template.dateLabel}:</strong> {new Date().toLocaleDateString(handoverData.language === 'tr' ? 'tr-TR' : 'en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Handover Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="p-6">
            <div className="prose max-w-none">
              {template.content.map((paragraph, index) => (
                <p key={index} className="mb-3 text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Acceptance Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-start space-x-3 mb-6">
              <input
                type="checkbox"
                id="acceptance"
                checked={acceptanceChecked}
                onChange={(e) => {
                  setAcceptanceChecked(e.target.checked);
                  if (e.target.checked) {
                    setShowSignature(true);
                  }
                }}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="acceptance" className="text-gray-700 font-medium cursor-pointer">
                {template.acceptanceText}
              </label>
            </div>

            {/* Signature Section */}
            {showSignature && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Signature className="h-5 w-5 mr-2" />
                  {template.signatureLabel}
                </h4>

                {/* Customer Info Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {template.nameLabel} *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={handoverData.language === 'en' ? 'Enter your full name' : 'Adınızı soyadınızı girin'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {template.titleLabel}
                    </label>
                    <input
                      type="text"
                      value={customerTitle}
                      onChange={(e) => setCustomerTitle(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={handoverData.language === 'en' ? 'Your title/position' : 'Ünvanınız'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {template.companyLabel}
                    </label>
                    <input
                      type="text"
                      value={customerCompany}
                      onChange={(e) => setCustomerCompany(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={handoverData.language === 'en' ? 'Company name' : 'Şirket adı'}
                    />
                  </div>
                </div>

                {/* Signature Canvas */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {handoverData.language === 'en' ? 'Digital Signature *' : 'Dijital İmza *'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="border border-gray-200 rounded cursor-crosshair"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-600">
                        {handoverData.language === 'en' 
                          ? 'Please sign above using your mouse or touchscreen'
                          : 'Lütfen yukarıya fareyle veya dokunmatik ekranla imzanızı atın'
                        }
                      </p>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {handoverData.language === 'en' ? 'Clear' : 'Temizle'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitHandover}
                  disabled={!acceptanceChecked || !signatureData || !customerName.trim() || isSubmitting}
                  className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                    acceptanceChecked && signatureData && customerName.trim() && !isSubmitting
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{handoverData.language === 'en' ? 'Submitting...' : 'Gönderiliyor...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>{template.submitButton}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverFormPage;