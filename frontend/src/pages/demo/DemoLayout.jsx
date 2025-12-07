/**
 * Demo Layout
 * ============
 * Demo modülü için ana layout component
 * 
 * Özellikleri:
 * - Feature flag kontrolü (demo_module açık mı?)
 * - Rol kontrolü (super-admin veya admin mi?)
 * - Demo banner gösterimi
 * - Erişim reddi durumunda uyarı
 */

import React, { Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useFeatureFlag, useDemoAccess } from '../../hooks/useFeatureFlag';
import { 
  Beaker, 
  AlertTriangle, 
  ArrowLeft, 
  Lock,
  Sparkles 
} from 'lucide-react';

const DemoLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenantSlug } = useTenant();
  const hasDemoAccess = useDemoAccess();
  const isDemoEnabled = useFeatureFlag('demo_module');

  // Loading durumu
  if (isDemoEnabled === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Demo modülü kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Demo erişimi yoksa
  if (!hasDemoAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Demo Erişimi Kısıtlı
          </h1>
          
          <p className="text-gray-600 mb-6">
            {!isDemoEnabled 
              ? 'Demo modülü bu tenant için aktif değil.'
              : 'Demo modülüne erişim için admin yetkisi gerekiyor.'
            }
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/${tenantSlug}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard'a Dön
            </button>
          </div>
          
          {user && (
            <p className="mt-6 text-sm text-gray-500">
              Giriş yapan: {user.fullName} ({user.role})
            </p>
          )}
        </div>
      </div>
    );
  }

  // Demo erişimi var - içeriği göster
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <Beaker className="w-4 h-4" />
              <span className="text-sm font-medium">Demo Modu</span>
            </div>
            <span className="text-purple-200 text-sm">
              Geliştirme aşamasındaki özellikleri test ediyorsunuz
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Yeni özellikler burada önizlenir</span>
            </div>
            
            <button
              onClick={() => navigate(`/${tenantSlug}`)}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Canlıya Dön
            </button>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Dikkat:</strong> Bu özellikler henüz tamamlanmamıştır. 
            Veriler gerçek sistemle senkronize olmayabilir.
          </span>
        </div>
      </div>

      {/* Demo Content */}
      <div className="p-6">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Yükleniyor...</p>
              </div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default DemoLayout;
