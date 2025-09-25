import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  X, 
  User, 
  DollarSign, 
  Calendar, 
  MapPin,
  FileText,
  Target,
  Globe,
  Building2
} from 'lucide-react';

export default function ViewOpportunityModal({ opportunity, onClose }) {
  if (!opportunity) return null;

  const formatCurrency = (amount, currency) => {
    if (amount === 0) return '-';
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'TRY': '₺'
    };

    return `${symbols[currency] || currency} ${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (statusText) => {
    if (statusText.includes('Teklif Bekleniyor')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (statusText.includes('Teklif Gönderildi')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (statusText.includes('Tasarım')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (statusText.includes('Brief')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const tagColors = {
    'ALMANYA': 'bg-red-500 text-white',
    'DÜSSELDORF': 'bg-purple-500 text-white',
    'MEDICA': 'bg-teal-500 text-white',
    'BAE': 'bg-red-500 text-white',
    'DUBAİ': 'bg-orange-500 text-white',
    'GULFOOD': 'bg-teal-500 text-white',
    'TÜRKİYE': 'bg-red-500 text-white',
    'İSTANBUL': 'bg-purple-500 text-white'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Satış Fırsatı Detayları</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>Fırsat No & Müşteri</span>
                  </label>
                  <div className="text-lg">
                    <span className="font-bold text-blue-600">#{opportunity.id}</span>
                    <span className="mx-2">-</span>
                    <span className="font-semibold text-gray-900">{opportunity.customer}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span>Etkinlik Adı</span>
                  </label>
                  <p className="text-lg font-medium text-gray-900">{opportunity.eventName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Tutar</span>
                  </label>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(opportunity.amount, opportunity.currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4" />
                    <span>Durum</span>
                  </label>
                  <Badge className={`${getStatusColor(opportunity.statusText)} border px-3 py-1`}>
                    {opportunity.statusText}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4" />
                    <span>İletişim Kişisi</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {opportunity.contactPerson.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{opportunity.contactPerson}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Son Güncelleme</span>
                  </label>
                  <p className="text-gray-900">{formatDate(opportunity.lastUpdate)}</p>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center space-x-2 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>Etiketler</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {opportunity.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className={`text-xs px-3 py-1 ${tagColors[tag] || 'bg-gray-500 text-white'} border-0`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Ek Bilgiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Para Birimi:</span>
                  <span className="ml-2 text-gray-900">{opportunity.currency}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Kayıt Tarihi:</span>
                  <span className="ml-2 text-gray-900">{formatDate(opportunity.lastUpdate)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Kapat
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6"
              >
                Düzenle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}