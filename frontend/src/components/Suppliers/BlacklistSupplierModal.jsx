import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Save,
  CheckCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';

const BlacklistSupplierModal = ({ supplier, onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [blacklisted, setBlacklisted] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!reason.trim()) {
      toast({
        title: "Hata",
        description: "Kara listeye alma nedeni zorunludur",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'blacklisted',
          blacklist_reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to blacklist supplier');
      }

      const updatedSupplier = await response.json();
      
      setBlacklisted(true);

      toast({
        title: "Başarılı",
        description: "Tedarikçi kara listeye alındı",
        variant: "default"
      });

      if (onSave) {
        onSave(updatedSupplier);
      }

    } catch (error) {
      console.error('Error blacklisting supplier:', error);
      toast({
        title: "Hata",
        description: "Kara listeye alınırken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {blacklisted ? 'Kara Listeye Alındı!' : 'Tedarikçiyi Kara Listeye Al'}
              </h1>
              <p className="text-gray-600">
                {blacklisted 
                  ? 'Tedarikçi kara listeye başarıyla eklendi'
                  : `${supplier?.company_short_name} tedarikçisini kara listeye al`
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {blacklisted ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tedarikçi Kara Listeye Alındı!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{supplier?.company_short_name}</strong> tedarikçisi kara listeye başarıyla eklendi.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Tedarikçi:</span>
                        <span className="text-sm text-gray-900">{supplier?.company_short_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Durum:</span>
                        <span className="text-sm text-red-600 font-medium">Kara Listede</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Kara Listeye Alma Nedeni:</span>
                        <p className="text-sm text-gray-900 mt-1">{reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="text-left">
                        <p className="text-orange-800 text-sm font-medium">Önemli Bilgi</p>
                        <p className="text-orange-700 text-sm mt-1">
                          Bu tedarikçi artık kara listede ve gelecek işlemlerde görünmeyecektir. 
                          Kara listeden çıkarmak için yönetici yetkisi gereklidir.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tamam</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Warning */}
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="text-red-800 font-medium">Dikkat!</h3>
                      <p className="text-red-700 text-sm mt-1">
                        Bu işlem tedarikçiyi kara listeye alacaktır. Kara listedeki tedarikçiler 
                        gelecek işlemlerde görünmez ve otomatik olarak filtrelenir.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Tedarikçi Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Firma:</span>
                        <span className="text-sm text-gray-900">{supplier?.company_short_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Ünvan:</span>
                        <span className="text-sm text-gray-900">{supplier?.company_title || 'Bilinmiyor'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">E-posta:</span>
                        <span className="text-sm text-gray-900">{supplier?.email || 'Bilinmiyor'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Telefon:</span>
                        <span className="text-sm text-gray-900">{supplier?.phone || 'Bilinmiyor'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reason Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Kara Listeye Alma Nedeni</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neden *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tedarikçiyi kara listeye alma nedeninizi detaylı olarak açıklayın..."
                      className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={4}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bu bilgi raporlarda görünecek ve kara listeden çıkarma işlemlerinde referans olacaktır.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'İşleniyor...' : 'Kara Listeye Al'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlacklistSupplierModal;