import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Eye,
  EyeOff,
  LogIn,
  User,
  Lock,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Lütfen email giriniz');
      return;
    }
    
    if (!formData.password) {
      setError('Lütfen şifre giriniz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to tenant dashboard
        const tenantSlug = result.tenant.slug.replace(/_/g, '-'); // Convert to frontend format
        navigate(`/${tenantSlug}`);
      } else {
        setError(result.error || 'Giriş başarısız');
      }
    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (email) => {
    setFormData({
      email: email,
      password: 'Test123!'
    });
  };

  // fillDemoCredentials function removed - no longer needed without password requirement

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Vitingo</h1>
          <p className="text-blue-200 text-lg">CRM Yönetim Sistemi</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
              <LogIn className="h-6 w-6" />
              <span>Giriş Yap</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Kullanıcı Adı
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Kullanıcı adınızı giriniz"
                  className="h-12"
                  disabled={loading}
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                  Beni hatırla
                </label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Giriş Yap
                  </>
                )}
              </Button>
            </form>

            {/* Quick Login */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 text-center font-medium">Hızlı Giriş:</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      await login({ username: 'murb', password: '', rememberMe: false });
                      navigate('/quattro-stand');
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <div className="font-medium text-gray-900">👑 Süper Admin</div>
                  <div className="text-sm text-gray-600">murb - Murat Bucak</div>
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      await login({ username: 'biry', password: '', rememberMe: false });
                      navigate('/quattro-stand');
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <div className="font-medium text-gray-900">👔 Admin</div>
                  <div className="text-sm text-gray-600">biry - Birtan Yılmaz</div>
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      await login({ username: 'tame', password: '', rememberMe: false });
                      navigate('/quattro-stand');
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <div className="font-medium text-gray-900">💼 Müşteri Temsilcisi</div>
                  <div className="text-sm text-gray-600">tame - Tamer Erdim</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <div>
            <a
              href="/landing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ana Sayfa
            </a>
          </div>
          <p className="text-blue-200 text-sm">
            © 2024 Vitingo CRM - Tüm hakları saklıdır
          </p>
        </div>
      </div>
    </div>
  );
}