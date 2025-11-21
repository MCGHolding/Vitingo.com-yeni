import React, { useState } from 'react';
import { Check, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    icon: '🚀',
    monthlyPrice: '29',
    yearlyPrice: '23',
    currency: '€',
    users: '5 kullanıcıya kadar',
    features: [
      'Kişisel Dashboard',
      'Tüm talepleri Görüntüleme',
      'Temel Para Biriminde avans talebi',
      'Standart Avans Talebi',
      'Standart Avans Kapama Süresi'
    ],
    buttonText: 'Tümünü Gör',
    popular: false
  },
  {
    name: 'Professional',
    icon: '🔥',
    monthlyPrice: '39',
    yearlyPrice: '31',
    currency: '$',
    users: '10 kullanıcıya kadar',
    features: [
      'Profesyonel Dashboard',
      'Tüm talepleri Görüntüleme',
      'Çoklu Para Birimi avans talebi',
      'Profesyonel Avans Talebi Fonksiyonları',
      'Profesyonel Avans Kapama Fonksiyonları'
    ],
    buttonText: 'Tümünü Gör',
    popular: true
  },
  {
    name: 'Enterprise',
    icon: '🏛️',
    monthlyPrice: '99',
    yearlyPrice: '79',
    currency: '$',
    users: '20 kullanıcıya kadar',
    features: [
      'Profesyonel Dashboard',
      'Tüm talepleri Görüntüleme',
      'Çoklu Para Birimi avans talebi',
      'Profesyonel Avans Talebi Fonksiyonları',
      'Profesyonel Avans Kapama Fonksiyonları'
    ],
    buttonText: 'Tümünü Gör',
    popular: false
  }
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Size Uygun
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Planı Seçin
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            İhtiyaçlarınıza göre esnek fiyatlandırma seçenekleri
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-lg font-semibold ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Aylık
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ backgroundColor: isYearly ? '#3b82f6' : '#d1d5db' }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-semibold ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yıllık
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              %20 indirim
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105 z-10'
                  : 'bg-white border-2 border-gray-200 hover:border-blue-600 hover:shadow-xl'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-full text-sm font-bold shadow-lg">
                    <Crown className="w-4 h-4" />
                    En Popüler
                  </div>
                </div>
              )}

              {/* Plan Icon & Name */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{plan.icon}</div>
                <h3 className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.currency}{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className={`text-lg ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>/ay</span>
                </div>
                <p className={`mt-2 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                  {plan.users}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-blue-200' : 'text-green-500'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-blue-50' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white text-purple-600 hover:bg-blue-50 hover:shadow-lg'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Text */}
        <p className="text-center text-gray-600 mt-12 text-lg">
          <span className="font-semibold">14 gün ücretsiz deneme</span> • İstediğiniz zaman iptal edin
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
