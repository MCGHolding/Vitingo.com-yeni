import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Save,
  CheckCircle,
  Star,
  Award
} from 'lucide-react';

const ScoreSupplierModal = ({ supplier, onClose, onSave }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [scoreGiven, setScoreGiven] = useState(false);
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!score || score < 1 || score > 5) {
      toast({
        title: "Hata",
        description: "Puan 1-5 arasında olmalıdır",
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
          score: parseInt(score),
          score_note: note.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update supplier score');
      }

      const updatedSupplier = await response.json();
      
      setScoreGiven(true);

      toast({
        title: "Başarılı",
        description: "Tedarikçi puanı başarıyla güncellendi",
        variant: "default"
      });

      if (onSave) {
        onSave(updatedSupplier);
      }

    } catch (error) {
      console.error('Error updating supplier score:', error);
      toast({
        title: "Hata",
        description: "Puan güncellenirken hata oluştu", 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {scoreGiven ? 'Puan Verildi!' : 'Tedarikçi Puanla'}
              </h1>
              <p className="text-gray-600">
                {scoreGiven 
                  ? 'Tedarikçi puanı başarıyla güncellendi'
                  : `${supplier?.company_short_name} tedarikçisini puanlayın`
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {scoreGiven ? (
            /* Success State */
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tebrikler, Puan Başarı ile Verildi!
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    <strong>{supplier?.company_short_name}</strong> tedarikçisine <strong>{score} yıldız</strong> puanı verildi.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="text-left space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Tedarikçi:</span>
                        <span className="text-sm text-gray-900">{supplier?.company_short_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Verilen Puan:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(parseInt(score))}
                          <span className="text-sm text-gray-900 ml-2">({score}/5)</span>
                        </div>
                      </div>
                      {note && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Not:</span>
                          <p className="text-sm text-gray-900 mt-1">{note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 text-sm">
                      🌟 Puan başarıyla kaydedildi ve tedarikçi profilinde görünecektir.
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tamam</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Tedarikçi Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Firma:</span>
                        <span className="text-sm text-gray-900">{supplier?.company_short_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Tür:</span>
                        <span className="text-sm text-gray-900">{supplier?.supplier_type || 'Bilinmiyor'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Uzmanlık:</span>
                        <span className="text-sm text-gray-900">{supplier?.specialty || 'Bilinmiyor'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Puan Ver</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puan (1-5) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="1-5 arasında puan verin"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1: Çok kötü, 2: Kötü, 3: Orta, 4: İyi, 5: Mükemmel
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puan Notu (Opsiyonel)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Puanınızın nedenini açıklayın..."
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-yellow-600 hover:bg-yellow-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Kaydediliyor...' : 'Puan Ver'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreSupplierModal;