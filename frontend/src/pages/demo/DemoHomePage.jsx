/**
 * Demo Home Page
 * ===============
 * Demo modülünün ana sayfası
 * 
 * Tüm demo özelliklerini listeler ve durumlarını gösterir
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import {
  Users,
  LayoutDashboard,
  Mail,
  Zap,
  Sparkles,
  Globe,
  Flag,
  Package,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock
} from 'lucide-react';

const DemoHomePage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const { user } = useAuth();

  // Feature flag durumları
  const customerV2Enabled = useFeatureFlag('customer_module_v2');
  const dashboardV2Enabled = useFeatureFlag('dashboard_v2');
  const emailThreadsEnabled = useFeatureFlag('email_threads');
  const leadGenEnabled = useFeatureFlag('lead_generation');
  const aiFeaturesEnabled = useFeatureFlag('ai_features');

  const demoModules = [
    {
      id: 'customers-v2',
      name: 'Müşteriler V2',
      description: 'Gelişmiş müşteri yönetimi: Bulk actions, 360° görünüm, Kanban, health scoring',
      icon: Users,
      href: `/demo/musteriler-v2`,
      status: customerV2Enabled ? 'active' : 'development',
      features: [
        'Bulk seçim ve toplu işlemler',
        'Gelişmiş arama ve filtreleme',
        'Kanban görünümü',
        '360° müşteri detay sayfası',
        'Müşteri sağlık skoru',
        'Segmentasyon'
      ]
    },
    {
      id: 'dashboard-v2',
      name: 'Dashboard V2',
      description: 'Yeni modern dashboard tasarımı ve gelişmiş widgetlar',
      icon: LayoutDashboard,
      href: `/demo/dashboard-v2`,
      status: dashboardV2Enabled ? 'active' : 'planned',
      features: [
        'Modern UI tasarımı',
        'Özelleştirilebilir widgetlar',
        'Gerçek zamanlı metrikler',
        'Sürükle-bırak düzenleme'
      ]
    },
    {
      id: 'email-threads',
      name: 'E-posta Threads',
      description: 'Müşteri e-posta yazışmalarını CRM içinde görüntüle ve yanıtla',
      icon: Mail,
      href: `/demo/email-threads`,
      status: emailThreadsEnabled ? 'active' : 'development',
      features: [
        'İki yönlü e-posta entegrasyonu',
        'Thread görünümü',
        'CRM içinden yanıtlama',
        'Otomatik müşteri eşleştirme'
      ]
    },
    {
      id: 'lead-gen',
      name: 'Lead Generation',
      description: 'Apollo.io ve RocketReach entegrasyonu ile lead bulma',
      icon: Zap,
      href: `/demo/lead-gen`,
      status: leadGenEnabled ? 'active' : 'planned',
      features: [
        'Apollo.io entegrasyonu',
        'RocketReach entegrasyonu',
        'Kredi bazlı sistem',
        'Outbound kampanyalar',
        'E-posta sekansları'
      ]
    },
    {
      id: 'ai-features',
      name: 'AI Özellikleri',
      description: 'Yapay zeka destekli özellikler',
      icon: Sparkles,
      href: `/demo/ai-features`,
      status: aiFeaturesEnabled ? 'active' : 'experimental',
      features: [
        'AI destekli stand tasarım önerileri',
        'Otomatik teklif oluşturma',
        'Müşteri analizi',
        'Tahmine dayalı satış'
      ]
    }
  ];

  const adminModules = [
    {
      id: 'global-data',
      name: 'Global Data Yönetimi',
      description: 'Para birimi, ülke, şehir yönetimi',
      icon: Globe,
      href: `/demo/admin/global-data`,
      requiredRole: 'super-admin'
    },
    {
      id: 'feature-flags',
      name: 'Feature Flags',
      description: 'Özellik flag\'lerini yönet',
      icon: Flag,
      href: `/demo/admin/feature-flags`,
      requiredRole: 'super-admin'
    },
    {
      id: 'packages',
      name: 'Paket Yönetimi',
      description: 'SaaS paketlerini düzenle',
      icon: Package,
      href: `/demo/admin/packages`,
      requiredRole: 'super-admin'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Aktif
          </span>
        );
      case 'development':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Geliştiriliyor
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3" />
            Planlandı
          </span>
        );
      case 'experimental':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Sparkles className="w-3 h-3" />
            Deneysel
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Demo Modülleri</h1>
        <p className="mt-2 text-gray-600">
          Geliştirme aşamasındaki yeni özellikleri test edin. 
          Bu özellikler henüz canlıya alınmamıştır.
        </p>
      </div>

      {/* Demo Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {demoModules.map((module) => {
          const Icon = module.icon;
          const isActive = module.status === 'active';
          
          return (
            <div
              key={module.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
                isActive ? 'hover:shadow-md hover:border-purple-300' : 'opacity-75'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  {getStatusBadge(module.status)}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {module.description}
                </p>

                <div className="space-y-2 mb-4">
                  {module.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  {module.features.length > 3 && (
                    <div className="text-sm text-gray-400">
                      +{module.features.length - 3} daha fazla özellik
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/${tenantSlug}${module.href}`)}
                  disabled={!isActive}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isActive ? (
                    <>
                      Deneyin
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Yakında
                      <Lock className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Section */}
      {user?.role === 'super-admin' && (
        <>
          <div className="border-t border-gray-200 pt-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Admin Araçları</h2>
            <p className="mt-1 text-gray-600">
              Platform yönetimi için araçlar (sadece super-admin)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adminModules.map((module) => {
              const Icon = module.icon;
              
              return (
                <div
                  key={module.id}
                  onClick={() => navigate(`/${tenantSlug}${module.href}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{module.name}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Quick Stats */}
      <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-4">Demo İstatistikleri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-bold">
              {demoModules.filter(m => m.status === 'active').length}
            </div>
            <div className="text-purple-200 text-sm">Aktif Modül</div>
          </div>
          <div>
            <div className="text-3xl font-bold">
              {demoModules.filter(m => m.status === 'development').length}
            </div>
            <div className="text-purple-200 text-sm">Geliştiriliyor</div>
          </div>
          <div>
            <div className="text-3xl font-bold">
              {demoModules.filter(m => m.status === 'planned').length}
            </div>
            <div className="text-purple-200 text-sm">Planlandı</div>
          </div>
          <div>
            <div className="text-3xl font-bold">
              {demoModules.reduce((acc, m) => acc + m.features.length, 0)}
            </div>
            <div className="text-purple-200 text-sm">Toplam Özellik</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHomePage;
