import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import VitingoPhoneInput from '../ui/SupplierPhone';
import { useToast } from '../../hooks/use-toast';
import { generateUsername, generatePassword, departments, sendWelcomeEmail } from '../../utils/userUtils';
import { 
  X, 
  User, 
  Mail, 
  Phone,
  Calendar,
  Building2,
  Shield,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export default function UserManagementModal({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    department: ''
  });

  const [generatedCredentials, setGeneratedCredentials] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate username when first name or last name changes
    if (name === 'firstName' || name === 'lastName') {
      const firstName = name === 'firstName' ? value : formData.firstName;
      const lastName = name === 'lastName' ? value : formData.lastName;
      
      if (firstName && lastName) {
        const username = generateUsername(firstName, lastName);
        setGeneratedCredentials(prev => ({
          ...prev,
          username
        }));
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setGeneratedCredentials(prev => ({
      ...prev,
      password
    }));
    toast({
      title: "Şifre Oluşturuldu",
      description: "Yeni güvenli şifre otomatik olarak oluşturuldu",
    });
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

    if (!generatedCredentials.username) {
      newErrors.username = 'Kullanıcı adı oluşturulamadı';
    }

    if (!generatedCredentials.password) {
      newErrors.password = 'Şifre oluşturulamadı';
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
      const userData = {
        ...formData,
        username: generatedCredentials.username,
        createdAt: new Date().toISOString(),
        status: 'active',
        role: 'user'
      };

      // Send welcome email
      await sendWelcomeEmail(userData, generatedCredentials.password);

      if (onSave) {
        onSave({ ...userData, password: generatedCredentials.password });
      }

      toast({
        title: "Başarılı",
        description: `${formData.firstName} ${formData.lastName} başarıyla oluşturuldu ve hoş geldin e-postası gönderildi`,
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        department: ''
      });

      setGeneratedCredentials({
        username: '',
        password: ''
      });

      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Hata",
        description: "Kullanıcı oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate password when component mounts
  React.useEffect(() => {
    if (!generatedCredentials.password) {
      const password = generatePassword();
      setGeneratedCredentials(prev => ({
        ...prev,
        password
      }));
    }
  }, [generatedCredentials.password]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <User className="h-6 w-6" />
              <span>Yeni Kullanıcı Oluştur</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-purple-600"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <VitingoPhoneInput
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    placeholder="Telefon numarası giriniz"
                    label=""
                    className="my-0"
                    required
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

            {/* Generated Credentials */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Sistem Tarafından Oluşturulan Bilgiler</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Kullanıcı Adı
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={generatedCredentials.username}
                      readOnly
                      className="bg-gray-50"
                    />
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Otomatik
                    </Badge>
                  </div>
                  {errors.username && (
                    <p className="text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Geçici Şifre
                  </Label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={generatedCredentials.password}
                        readOnly
                        className="bg-gray-50 pr-20"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleGeneratePassword}
                          disabled={isSubmitting}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      Güvenli
                    </Badge>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📧 E-posta Bilgilendirmesi</h4>
                <p className="text-sm text-blue-700">
                  Kullanıcı oluşturulduktan sonra, giriş bilgileri ve profil düzenleme linki otomatik olarak 
                  kullanıcının e-posta adresine gönderilecektir.
                </p>
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
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Kullanıcı Oluştur
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