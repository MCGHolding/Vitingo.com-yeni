import React from 'react';
import { Users, UserCheck, FolderKanban, Calendar, CreditCard, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Lead Yönetimi',
    description: 'Potansiyel müşterilerinizi sistematik bir şekilde takip edin ve fırsatları kaçırmayın.',
    image: 'https://images.unsplash.com/photo-1601509876296-aba16d4c10a4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc2Mzc0NDc3M3ww&ixlib=rb-4.1.0&q=85',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    icon: UserCheck,
    title: 'Müşteri Yönetimi',
    description: 'Aktif, pasif ve favori müşterilerinizi organize edin. Tüm müşteri bilgileriniz tek platformda.',
    image: 'https://images.unsplash.com/photo-1576267423048-15c0040fec78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc2Mzc0NDc3M3ww&ixlib=rb-4.1.0&q=85',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    icon: FolderKanban,
    title: 'Proje Yönetimi',
    description: 'Projelerinizi baştan sona takip edin. Görevler, milestone\lar ve teslimler tek ekranda.',
    image: 'https://images.unsplash.com/photo-1601509876282-529dfa08c46e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxidXNpbmVzcyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc2Mzc0NDc3M3ww&ixlib=rb-4.1.0&q=85',
    gradient: 'from-pink-500 to-pink-600'
  },
  {
    icon: Calendar,
    title: 'Fuar Yönetimi',
    description: 'Fuarları ve etkinlikleri planlayın, takip edin. Katılımcılarınızı kolayca yönetin.',
    image: 'https://images.unsplash.com/photo-1739298061740-5ed03045b280?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHxidXNpbmVzcyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDB8fHx8MTc2Mzc0NDc3M3ww&ixlib=rb-4.1.0&q=85',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    icon: CreditCard,
    title: 'Ödeme Takibi',
    description: 'Vadeli ödemelerinizi kontrol altında tutun. Tahsilat ve ödeme planlarını yönetin.',
    image: 'https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg',
    gradient: 'from-green-500 to-green-600'
  },
  {
    icon: BarChart3,
    title: 'Raporlama & Dashboard',
    description: 'Kapsamlı analiz ve raporlarla işinizin nabzını tutun. Gerçek zamanlı veriler.',
    image: 'https://images.unsplash.com/photo-1759661966728-4a02e3c6ed91?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxwcm9kdWN0aXZpdHklMjBkYXNoYm9hcmR8ZW58MHx8fHwxNzYzNzQ0NzgwfDA&ixlib=rb-4.1.0&q=85',
    gradient: 'from-orange-500 to-orange-600'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Tüm İhtiyaçlarınız
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Tek Platformda
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vitingo CRM, bir CRM programında bulunması gereken tüm özellikleri modern ve kullanıcı dostu bir arayüzle sunuyor.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>

                {/* Image */}
                <div className="relative rounded-xl overflow-hidden aspect-video">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            Tüm Özellikleri Keşfedin
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
