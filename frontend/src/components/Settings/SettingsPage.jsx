import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Building2, 
  Users, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Receipt, 
  UserCog, 
  Briefcase, 
  DollarSign, 
  FileText, 
  Settings as SettingsIcon, 
  Building, 
  Package,
  FolderTree,
  Lock,
  Eye,
  Zap
} from 'lucide-react';

const SettingsPage = ({ onBack, currentUser, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const settingsCards = [
    {
      id: 'profile',
      title: 'Profil Ayarları',
      description: 'Kişisel bilgilerinizi görüntüleyin ve güncelleyin',
      icon: User,
      color: 'blue',
      adminOnly: false,
      category: 'Genel'
    },
    {
      id: 'security',
      title: 'Güvenlik Ayarları',
      description: 'Şifre değiştirme ve güvenlik seçenekleri',
      icon: Shield,
      color: 'green',
      adminOnly: false,
      category: 'Genel'
    },
    {
      id: 'company',
      title: 'Şirket Bilgileri',
      description: 'Şirket detayları ve abonelik bilgileri',
      icon: Building2,
      color: 'purple',
      adminOnly: false,
      category: 'Genel'
    },
    {
      id: 'group-companies',
      title: 'Grup Şirketleri',
      description: 'Grup şirketlerinizi yönetin',
      icon: Building,
      color: 'indigo',
      adminOnly: false,
      category: 'Organizasyon'
    },
    {
      id: 'contract-management',
      title: 'Sözleşme Yönetimi',
      description: 'Sözleşme şablonlarını ve sözleşmeleri yönetin',
      icon: FileText,
      color: 'emerald',
      adminOnly: false,
      category: 'Organizasyon'
    },
    {
      id: 'bank-management',
      title: 'Banka Yönetimi',
      description: 'Grup şirketlerine ait banka hesaplarını yönetin',
      icon: Landmark,
      color: 'cyan',
      adminOnly: false,
      category: 'Finans'
    },
    {
      id: 'advance-rules',
      title: 'Avans Kuralları',
      description: 'Avans kapama süreleri ve kuralları',
      icon: Wallet,
      color: 'orange',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'user-management',
      title: 'Kullanıcı Yönetimi',
      description: 'Takım üyeleri ve kullanıcı limitleri',
      icon: Users,
      color: 'blue',
      adminOnly: true,
      category: 'Organizasyon'
    },
    {
      id: 'user-positions',
      title: 'Kullanıcı Pozisyonları',
      description: 'Sistem kullanıcı pozisyonlarını yönetin',
      icon: UserCog,
      color: 'teal',
      adminOnly: true,
      category: 'Organizasyon'
    },
    {
      id: 'position-hierarchy',
      title: 'Pozisyon Hiyerarşisi',
      description: 'Pozisyon ve yönetici ilişkilerini tanımlayın',
      icon: FolderTree,
      color: 'cyan',
      adminOnly: true,
      category: 'Organizasyon'
    },
    {
      id: 'expense-centers',
      title: 'Masraf Merkezleri',
      description: 'Proje ve genel gider türlerini yönetin',
      icon: Briefcase,
      color: 'yellow',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'credit-cards',
      title: 'Kredi Kartları',
      description: 'Şirket kredi kartlarını yönetin',
      icon: CreditCard,
      color: 'red',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'bank-management',
      title: 'Banka Yönetimi',
      description: 'Banka hesaplarınızı yönetin',
      icon: Landmark,
      color: 'emerald',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'cc-categories',
      title: 'Kredi Kartı Harcama Kategorileri',
      description: 'Kredi kartı işlemleri için özel kategoriler oluşturun',
      icon: Receipt,
      color: 'pink',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'advance-categories',
      title: 'Avans Kategorileri',
      description: 'Avans kategorilerini yönetin',
      icon: DollarSign,
      color: 'lime',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'supplier-management',
      title: 'Tedarikçi Yönetimi',
      description: 'Tedarikçilerinizi yönetin',
      icon: Package,
      color: 'violet',
      adminOnly: true,
      category: 'Organizasyon'
    },
    {
      id: 'department-management',
      title: 'Departman Yönetimi',
      description: 'Şirket departmanlarını yönetin',
      icon: Building2,
      color: 'sky',
      adminOnly: true,
      category: 'Organizasyon'
    },
    {
      id: 'expense-categories',
      title: 'Harcama Kategorileri',
      description: 'Harcama kategorileri ve alt kategorilerini yönetin',
      icon: FileText,
      color: 'amber',
      adminOnly: true,
      category: 'Finans'
    },
    {
      id: 'library',
      title: 'Kütüphane',
      description: 'Para birimleri ve ülkeleri yönetin',
      icon: Package,
      color: 'slate',
      adminOnly: true,
      category: 'Sistem'
    },
    {
      id: 'user-permissions',
      title: 'Kullanıcı Yetkileri',
      description: 'Kullanıcılara özel modül ve işlem yetkilerini yönetin',
      icon: Lock,
      color: 'rose',
      adminOnly: true,
      category: 'Sistem'
    },
    {
      id: 'document-permissions',
      title: 'Belge Erişim Yetkileri',
      description: 'Kullanıcıların belge görüntüleme yetkilerini yönetin',
      icon: Eye,
      color: 'fuchsia',
      adminOnly: true,
      category: 'Sistem'
    },
    {
      id: 'payment-permissions',
      title: 'Ödeme İşleme Yetkileri',
      description: 'Kullanıcıların ödeme işleme yetkilerini yönetin',
      icon: DollarSign,
      color: 'emerald',
      adminOnly: true,
      category: 'Sistem'
    },
    {
      id: 'app-settings',
      title: 'Uygulama Ayarları',
      description: 'Uygulamanın genel görünümü ve entegrasyonları',
      icon: Zap,
      color: 'orange',
      adminOnly: true,
      category: 'Sistem'
    }
  ];

  // Arama ve filtreleme
  const filteredCards = settingsCards.filter(card => {
    const matchesSearch = 
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Kategorilere göre grupla
  const groupedCards = filteredCards.reduce((acc, card) => {
    if (!acc[card.category]) {
      acc[card.category] = [];
    }
    acc[card.category].push(card);
    return acc;
  }, {});

  const handleCardClick = (cardId) => {
    console.log('Settings card clicked:', cardId);
    
    // Navigate to specific pages
    if (onNavigate) {
      onNavigate(cardId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Geri</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
                <p className="text-sm text-gray-600">Sistem ayarlarını yönetin</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-600 font-semibold">
                {currentUser?.name?.charAt(0) || 'M'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name || 'Murat Bucak'}</p>
                <p className="text-xs text-gray-600 bg-green-600 text-white px-2 py-0.5 rounded-full inline-block">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Ayarlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Settings Cards by Category */}
        {Object.keys(groupedCards).map((category) => (
          <div key={category} className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="h-1 w-12 bg-blue-600 rounded-full mr-3"></div>
              {category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedCards[category].map((card) => {
                const Icon = card.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  purple: 'bg-purple-100 text-purple-600',
                  orange: 'bg-orange-100 text-orange-600',
                  red: 'bg-red-100 text-red-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                  teal: 'bg-teal-100 text-teal-600',
                  cyan: 'bg-cyan-100 text-cyan-600',
                  indigo: 'bg-indigo-100 text-indigo-600',
                  pink: 'bg-pink-100 text-pink-600',
                  emerald: 'bg-emerald-100 text-emerald-600',
                  lime: 'bg-lime-100 text-lime-600',
                  violet: 'bg-violet-100 text-violet-600',
                  sky: 'bg-sky-100 text-sky-600',
                  amber: 'bg-amber-100 text-amber-600',
                  slate: 'bg-slate-100 text-slate-600',
                  rose: 'bg-rose-100 text-rose-600',
                  fuchsia: 'bg-fuchsia-100 text-fuchsia-600'
                };

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {card.adminOnly && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {card.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Results */}
        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <SettingsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç Bulunamadı</h3>
            <p className="text-gray-600">"{searchTerm}" araması için ayar bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
