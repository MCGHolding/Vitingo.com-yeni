import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { departments } from '../../utils/userUtils';
import { 
  User, 
  Mail, 
  Phone,
  Calendar,
  Building2,
  Shield,
  X,
  Save,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export default function EditUserModal({ user, onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    department: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form with existing user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        department: user.department || '',
        status: user.status || 'active'
      });
    }
  }, [user]);

  const statusOptions = [
    { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Pasif', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'former', label: 'Eski Çalışan', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad zorunludur';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad zorunludur';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!formData.department) {
      newErrors.department = 'Departman seçimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the user
      const updatedUser = {
        ...user,
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (onSave) {
        onSave(updatedUser);
      }
      
      toast({
        title: "Başarılı",
        description: `${formData.firstName} ${formData.lastName} başarıyla güncellendi`,
      });

      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Hata",
        description: "Kullanıcı güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span>Kullanıcı Düzenle - {user.firstName} {user.lastName}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-green-600"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* System Information (Read-only) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Sistem Bilgileri</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">ID:</span>
                  <span className="ml-2 text-gray-900">#{user.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Kullanıcı Adı:</span>
                  <span className="ml-2 text-gray-900">@{user.username}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Kayıt:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </span>
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
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    Ad *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Adı giriniz"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Soyad *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Soyadı giriniz"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>E-posta Adresi *</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Telefon Numarası</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+90 5XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Doğum Tarihi</span>
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Departman *</span>
                  </Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => handleInputChange('department', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Departman seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-600">{errors.department}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Hesap Durumu</span>
              </h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Kullanıcı Durumu
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                          {status.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Güncelle
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}