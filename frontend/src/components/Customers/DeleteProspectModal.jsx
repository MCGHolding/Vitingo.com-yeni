import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Building } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const DeleteProspectModal = ({ prospect, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('confirm'); // 'confirm', 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${BACKEND_URL}/api/customer-prospects/${prospect.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Müşteri adayı silinirken hata oluştu');
      }

      setStep('success');

    } catch (error) {
      console.error('Error deleting prospect:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setError('');
    onClose();
  };

  const handleSuccessClose = () => {
    handleClose();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        
        {/* Confirmation Step */}
        {step === 'confirm' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                <span>Müşteri Adayını Sil</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Prospect Info */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{prospect?.company_short_name}</h3>
                      {prospect?.email && (
                        <p className="text-sm text-gray-600">{prospect.email}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Kalıcı Silme İşlemi</h4>
                    <p className="text-sm text-red-700 mb-3">
                      Bu müşteri adayını <strong>kalıcı olarak silmek</strong> istediğinizden emin misiniz?
                    </p>
                    <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded inline-block">
                      ⚠️ Bu işlem geri alınamaz
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Siliniyor...
                    </div>
                  ) : (
                    'Kalıcı Sil'
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

            </CardContent>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>İşlem Tamamlandı</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Müşteri Adayı Başarıyla Silindi
                  </h3>
                  <p className="text-gray-600">
                    <strong>{prospect?.company_short_name}</strong> kalıcı olarak sistemden kaldırıldı.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSuccessClose}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Tamam
              </Button>

            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
};

export default DeleteProspectModal;
