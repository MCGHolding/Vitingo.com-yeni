import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Users, ArrowRight } from 'lucide-react';

const ConvertToCustomerModal = ({ isOpen, onClose, prospectData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <Card className="w-full max-w-md mx-4 animate-in zoom-in-95 fade-in-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>Müşteriye Çevrildi!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Success Animation */}
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-in zoom-in-95" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {prospectData?.companyName || 'Müşteri Adayı'}
            </h3>
            <p className="text-gray-600">
              başarıyla müşteriye çevrildi
            </p>
          </div>

          {/* Status Change Visualization */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-4">
              {/* From: Prospect */}
              <div className="text-center">
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg px-4 py-2 mb-2">
                  <p className="text-sm font-semibold text-blue-700">Müşteri Adayı</p>
                </div>
                <p className="text-xs text-gray-500">Önceki Statü</p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-8 w-8 text-green-500" />

              {/* To: Customer */}
              <div className="text-center">
                <div className="bg-green-100 border-2 border-green-300 rounded-lg px-4 py-2 mb-2">
                  <p className="text-sm font-semibold text-green-700">Müşteri</p>
                </div>
                <p className="text-xs text-gray-500">Yeni Statü</p>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium mb-1">Artık Müşteri Listesinde</p>
                <p className="text-xs text-green-700">
                  <strong>{prospectData?.companyName}</strong> artık "Müşteriler" sayfasında görünecek ve "Müşteri Adayları" listesinden çıkarıldı.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onClose('all-customers')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6"
          >
            <Users className="h-5 w-5 mr-2" />
            Tamam - Müşteriler Sayfasına Git
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default ConvertToCustomerModal;
