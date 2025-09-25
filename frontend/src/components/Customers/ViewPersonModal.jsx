import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  X,
  UserRound,
  Building,
  Phone,
  Mail,
  Globe,
  Calendar,
  MapPin
} from 'lucide-react';

export default function ViewPersonModal({ person, onClose, onEdit }) {
  if (!person) return null;

  const getRelationshipBadgeColor = (type) => {
    switch (type) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'potential_customer': return 'bg-orange-100 text-orange-800';
      case 'kontak': return 'bg-gray-100 text-gray-800';
      case 'supplier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center space-x-2">
                <UserRound className="h-6 w-6" />
                <span>Kişi Detayları</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(person)}
                  className="text-white hover:bg-white/20"
                >
                  Düzenle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Person Photo and Basic Info */}
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                  {person.avatar ? (
                    <img src={person.avatar} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <UserRound className="h-10 w-10 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{person.fullName}</h3>
                  <Badge className={getRelationshipBadgeColor(person.relationshipType)}>
                    {person.relationshipText}
                  </Badge>
                  <div className="mt-2 space-y-1">
                    {person.tags && person.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {person.company && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-gray-600" />
                    Şirket Bilgileri
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Şirket</label>
                      <p className="text-gray-900">{person.company}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">İş Ünvanı</label>
                      <p className="text-gray-900">{person.jobTitle || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Sektör</label>
                      <p className="text-gray-900">{person.sector || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-gray-600" />
                  İletişim Bilgileri
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Telefon
                    </label>
                    <p className="text-gray-900">{person.phone || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      E-posta ({person.emailType === 'is' ? 'İş' : 'Kişisel'})
                    </label>
                    <p className="text-gray-900">{person.email || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      Web Sitesi
                    </label>
                    <p className="text-gray-900">
                      {person.website ? (
                        <a href={person.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {person.website}
                        </a>
                      ) : (
                        'Belirtilmemiş'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Ek Bilgiler
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                    <p className="text-gray-900">{person.createdDate || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Son Aktivite</label>
                    <p className="text-gray-900">{person.lastActivity || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Durum</label>
                    <Badge variant={person.status === 'active' ? 'default' : 'secondary'}>
                      {person.status === 'active' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Öncelik</label>
                    <Badge variant={
                      person.priority === 'high' ? 'destructive' : 
                      person.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {person.priority === 'high' ? 'Yüksek' : 
                       person.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {person.notes && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Notlar</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{person.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => onEdit(person)}
              >
                Düzenle
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Kapat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}