import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  User,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Building2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw
} from 'lucide-react';

export default function NewUserFormModal({ onClose, onSave }) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    department: '',
    username: '',
    password: '',
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const departments = [
    { value: 'it', label: 'Bilgi İşlem' },
    { value: 'sales', label: 'Satış' },
    { value: 'marketing', label: 'Pazarlama' },
    { value: 'hr', label: 'İnsan Kaynakları' },
    { value: 'finance', label: 'Finans' },
    { value: 'operations', label: 'Operasyon' },
    { value: 'management', label: 'Yönetim' }
  ];

  const generateUsername = () => {
    if (formData.firstName && formData.lastName) {
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`;
      setFormData(prev => ({ ...prev, username }));
      toast({
        title: "Kullanıcı Adı Oluşturuldu",
        description: `Kullanıcı adı: ${username}`,
      });
    } else {
      toast({
        title: "Eksik Bilgi",
        description: "Önce ad ve soyad alanlarını doldurun.",
        variant: "destructive"
      });
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast({
      title: "Şifre Oluşturuldu",
      description: "Güvenli şifre otomatik olarak oluşturuldu.",
    });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: `${label} panoya kopyalandı.`,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen zorunlu alanları doldurunuz (Ad, Soyad, E-posta).",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Geçersiz E-posta",
        description: "Lütfen geçerli bir e-posta adresi giriniz.",
        variant: "destructive"
      });
      return;
    }

    const userData = {
      ...formData,
      id: Date.now(),
      fullName: `${formData.firstName} ${formData.lastName}`,
      role: 'user',
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0]
    };

    onSave(userData);
    
    toast({
      title: "Başarılı",
      description: "Yeni kullanıcı başarıyla oluşturuldu.",
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center space-x-3">
                <UserPlus className="h-7 w-7" />
                <span>Yeni Kullanıcı Oluştur</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Kişisel Bilgiler</h3>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Ad *
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Kullanıcının adını giriniz"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Soyad *
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Kullanıcının soyadını giriniz"
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      E-posta *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="kullanici@sirket.com"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Telefon
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+90 555 123 4567"
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Birth Date and Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Doğum Tarihi
                    </label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      Departman
                    </label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="h-12">
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
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-6 border-t pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Hesap Bilgileri</h3>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Kullanıcı Adı
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="kullanici.adi"
                      className="h-12 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateUsername}
                      className="h-12 px-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Otomatik
                    </Button>
                    {formData.username && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyToClipboard(formData.username, 'Kullanıcı adı')}
                        className="h-12 px-4"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Şifre
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Güvenli şifre"
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="h-12 px-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Oluştur
                    </Button>
                    {formData.password && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyToClipboard(formData.password, 'Şifre')}
                        className="h-12 px-4"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notlar
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Kullanıcı hakkında notlar..."
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-8 py-3"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Kullanıcı Oluştur
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}