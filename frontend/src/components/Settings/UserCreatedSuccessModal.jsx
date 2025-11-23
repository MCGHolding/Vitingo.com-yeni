import React, { useState } from 'react';
import { X, Check, Copy } from 'lucide-react';

const UserCreatedSuccessModal = ({ userData, onClose }) => {
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const openWhatsApp = () => {
    if (userData.whatsapp_link) {
      window.open(userData.whatsapp_link, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Kullanıcı Başarıyla Oluşturuldu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-medium">
              {userData.user?.name || 'Kullanıcı'} başarıyla oluşturuldu!
            </p>
            <p className="text-xs text-green-700 mt-1">
              Giriş bilgileri kullanıcıya gönderildi.
            </p>
          </div>

          {/* Login Credentials */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Giriş Bilgileri:</h3>
            
            {/* Email */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">
                Kullanıcı Adı (E-posta)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userData.credentials?.email || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => handleCopy(userData.credentials?.email || '', 'email')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Kopyala"
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Geçici Şifre
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userData.credentials?.password || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={() => handleCopy(userData.credentials?.password || '', 'password')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Kopyala"
                >
                  {copiedField === 'password' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ <span className="font-semibold">Güvenlik Notu:</span>
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Kullanıcı ilk girişte şifresini değiştirmek zorundadır.
            </p>
          </div>

          {/* WhatsApp Share */}
          {userData.whatsapp_link && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">WhatsApp ile Paylaş:</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userData.whatsapp_link}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                />
                <button
                  onClick={() => handleCopy(userData.whatsapp_link, 'whatsapp')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Kopyala"
                >
                  {copiedField === 'whatsapp' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={openWhatsApp}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  💬 WhatsApp'ta Aç
                </button>
              </div>
            </div>
          )}

          {/* Done Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCreatedSuccessModal;