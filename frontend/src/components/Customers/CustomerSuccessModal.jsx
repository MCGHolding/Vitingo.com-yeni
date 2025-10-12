import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Users, UserPlus } from 'lucide-react';

const CustomerSuccessModal = ({ isOpen, onClose, customerData, isProspect }) => {
  if (!isOpen) return null;

  const categoryInfo = isProspect ? {
    title: "Müşteri Adayı",
    description: "Müşteri adayları listesine",
    icon: UserPlus,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    route: "customer-prospects"
  } : {
    title: "Müşteri",
    description: "Tüm müşteriler listesine",
    icon: Users,
    iconColor: "text-green-500",
    bgColor: "bg-green-50",
    route: "all-customers"
  };

  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <Card className="w-full max-w-md mx-4 animate-in zoom-in-95 fade-in-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>Başarıyla Kaydedildi!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Company Info */}
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-in zoom-in-95" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {customerData?.companyName || 'Müşteri'}
            </h3>
            <p className="text-gray-600">
              başarıyla sisteme kaydedildi
            </p>
          </div>

          {/* Category Badge */}
          <div className={`${categoryInfo.bgColor} border border-gray-200 rounded-lg p-4`}>
            <div className="flex items-center justify-center space-x-3">
              <CategoryIcon className={`h-8 w-8 ${categoryInfo.iconColor}`} />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Kaydedildiği Kategori</p>
                <p className={`text-lg font-semibold ${categoryInfo.iconColor}`}>
                  {categoryInfo.title}
                </p>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-700">
              <strong>{customerData?.companyName || 'Müşteri'}</strong>
              <br />
              {categoryInfo.description} eklendi
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onClose(categoryInfo.route)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Tamam - {categoryInfo.title} Sayfasına Git
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerSuccessModal;
