import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, ArrowRight, UserPlus, Users } from 'lucide-react';

const ConfirmConvertModal = ({ isOpen, onClose, onConfirm, prospectData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>Müşteriye Çevir</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Company Info */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">{prospectData?.companyName}</h3>
                  <p className="text-sm text-gray-600">Müşteri Adayı</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Visualization */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-blue-700">Müşteri Adayı</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-500" />
              <div className="text-center">
                <div className="bg-green-100 border-2 border-green-400 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-green-700">Müşteri</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>{prospectData?.companyName}</strong> müşteri adayından <strong>müşteriye çevrilecek</strong>.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-orange-700">
              <li>✓ "Müşteriler" listesinde görünecek</li>
              <li>✓ "Müşteri Adayları" listesinden çıkacak</li>
            </ul>
          </div>

          {/* Question */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              Devam etmek istiyor musunuz?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Evet, Müşteriye Çevir
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmConvertModal;
