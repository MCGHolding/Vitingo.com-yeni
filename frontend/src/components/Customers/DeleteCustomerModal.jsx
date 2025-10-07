import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Trash2, UserX, Building, FileText, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DeleteCustomerModal = ({ customer, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('check'); // 'check', 'confirm', 'success'
  const [loading, setLoading] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState([]);
  const [error, setError] = useState('');

  // Check if customer can be deleted when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      checkCustomerDeletion();
    }
  }, [isOpen, customer]);

  const checkCustomerDeletion = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}/can-delete`);
      
      if (!response.ok) {
        throw new Error('Müşteri kontrol edilirken hata oluştu');
      }
      
      const data = await response.json();
      setCanDelete(data.canDelete);
      setRelatedRecords(data.relatedRecords || []);
      setStep('confirm');
      
    } catch (error) {
      console.error('Error checking customer deletion:', error);
      setError('Müşteri kontrolü yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      setError('');

      if (canDelete) {
        // Permanently delete customer
        const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Müşteri silinirken hata oluştu');
        }

        setStep('success');
        
      } else {
        // Deactivate customer (move to passive)
        const response = await fetch(`${BACKEND_URL}/api/customers/${customer.id}/deactivate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'inactive',
            reason: 'Has related records - moved to passive customers'
          })
        });

        if (!response.ok) {
          throw new Error('Müşteri pasifleştirilirken hata oluştu');
        }

        setStep('success');
      }

    } catch (error) {
      console.error('Error processing customer action:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('check');
    setError('');
    setRelatedRecords([]);
    setCanDelete(false);
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
        
        {/* Loading Step */}
        {step === 'check' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Müşteri Kontrol Ediliyor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    <strong>{customer?.company_name}</strong> müşterisi kontrol ediliyor...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button variant="outline" onClick={handleClose}>
                    Kapat
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {canDelete ? (
                  <>
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <span>Müşteriyi Sil</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-5 w-5 text-orange-500" />
                    <span>Müşteriyi Pasifleştir</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Customer Info */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer?.company_name}</h3>
                      {customer?.contact_person && (
                        <p className="text-sm text-gray-600">{customer.contact_person}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warning Message */}
              {canDelete ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">Kalıcı Silme İşlemi</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Bu müşteriyi <strong>kalıcı olarak silmek</strong> istediğinizden emin misiniz?
                      </p>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        ⚠️ Bu işlem geri alınamaz
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800 mb-2">Pasif Müşteri Yapılacak</h4>
                      <p className="text-sm text-orange-700 mb-3">
                        Bu müşteriye bağlı kayıtlar bulunduğu için silinemez. 
                        <strong> Pasif müşteriler arasına alınacaktır.</strong>
                      </p>
                      
                      {/* Related Records */}
                      {relatedRecords.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-orange-800 mb-2">İlişkili Kayıtlar:</p>
                          <div className="flex flex-wrap gap-1">
                            {relatedRecords.map((record, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-white border-orange-300"
                              >
                                {record}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 mt-2">
                        📋 İlişkili kayıtlar korunacak
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleConfirmAction}
                  disabled={loading}
                  className={`flex-1 ${canDelete 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {canDelete ? 'Kalıcı Sil' : 'Pasifleştir'}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
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
                
                {canDelete ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Müşteri Başarıyla Silindi
                    </h3>
                    <p className="text-gray-600">
                      <strong>{customer?.company_name}</strong> kalıcı olarak sistemden kaldırıldı.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Müşteri Pasifleştirildi
                    </h3>
                    <p className="text-gray-600">
                      <strong>{customer?.company_name}</strong> pasif müşteriler arasına alındı.
                    </p>
                  </div>
                )}
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

export default DeleteCustomerModal;