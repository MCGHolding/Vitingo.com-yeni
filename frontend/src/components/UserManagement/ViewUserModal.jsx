import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { departments } from '../../utils/userUtils';
import { 
  X, 
  User, 
  Mail, 
  Phone,
  Calendar,
  Building2,
  Shield,
  Globe,
  MapPin,
  Clock
} from 'lucide-react';

export default function ViewUserModal({ user, onClose }) {
  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDepartmentLabel = (departmentValue) => {
    const dept = departments.find(d => d.value === departmentValue);
    return dept ? dept.label : departmentValue;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { label: 'Aktif', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'inactive':
        return { label: 'Pasif', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'former':
        return { label: 'Eski Çalışan', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      default:
        return { label: 'Bilinmiyor', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span>Kullanıcı Detayları</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-purple-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* User Avatar and Basic Info */}
            <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-lg">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-600 text-white text-2xl">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-lg text-gray-600 mb-2">@{user.username}</p>
                <Badge className={`${statusInfo.color} border`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>İletişim Bilgileri</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">E-posta Adresi</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefon Numarası</label>
                      <p className="text-gray-900">{user.phone || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Departman</label>
                      <p className="text-gray-900">{getDepartmentLabel(user.department)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Rol</label>
                      <p className="text-gray-900">
                        {user.role === 'super-admin' ? 'Süper Admin' : 
                         user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Kişisel Bilgiler</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Doğum Tarihi</label>
                    <p className="text-gray-900">{formatDate(user.birthDate)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Kayıt Tarihi</label>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Sistem Bilgileri</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="font-medium text-blue-800">Kullanıcı ID:</span>
                  <span className="ml-2 text-blue-900">#{user.id}</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="font-medium text-green-800">Kullanıcı Adı:</span>
                  <span className="ml-2 text-green-900">@{user.username}</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="font-medium text-purple-800">Hesap Durumu:</span>
                  <span className="ml-2 text-purple-900">{statusInfo.label}</span>
                </div>
              </div>

              {user.lastLogin && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Son Giriş:</span>
                    <span className="text-sm text-yellow-900">{formatDate(user.lastLogin)}</span>
                  </div>
                </div>
              )}
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
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6"
                onClick={() => {
                  // This would normally trigger edit mode
                  console.log('Edit user:', user);
                }}
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