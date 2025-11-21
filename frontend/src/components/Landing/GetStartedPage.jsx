import React, { useState } from 'react';
import Navbar from './Navbar';
import { Check, Sparkles, Building2, User, Mail, Phone, MapPin, Lock, CreditCard } from 'lucide-react';

const plans = [
  {
    id: 'trial',
    name: 'Ücretsiz Deneme',
    icon: '🎁',
    price: 0,
    period: '14 gün',
    users: '15 kullanıcı',
    color: 'from-green-500 to-emerald-500',
    features: ['Tüm özellikler', '14 gün ücretsiz', '15 kullanıcıya kadar', 'Kredi kartı gerekmez']
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: '🚀',
    price: 29,
    yearlyPrice: 23,
    period: 'ay',
    users: '5 kullanıcı',
    color: 'from-blue-500 to-blue-600',
    features: ['Kişisel Dashboard', 'Tüm talepleri Görüntüleme', 'Temel Para Birimi', 'Standart Avans Talebi', 'E-posta desteği']
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: '🔥',
    price: 39,
    yearlyPrice: 31,
    period: 'ay',
    users: '10 kullanıcı',
    color: 'from-purple-500 to-purple-600',
    popular: true,
    features: ['Profesyonel Dashboard', 'Tüm özellikler', 'Çoklu Para Birimi', 'Profesyonel Fonksiyonlar', 'Öncelikli destek']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: '🏛️',
    price: 49,
    yearlyPrice: 39,
    period: 'ay',
    users: '50 kullanıcı',
    color: 'from-orange-500 to-orange-600',
    features: ['Tüm Professional özellikler', '50 kullanıcıya kadar', 'Özel entegrasyonlar', 'Özel eğitim', '7/24 destek']
  }
];

const GetStartedPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [isYearly, setIsYearly] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    taxNumber: '',
    address: '',
    city: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const calculateTotal = () => {
    if (selectedPlanData.id === 'trial') return 0;
    if (isYearly) {
      // Yıllık: (Aylık fiyat × 12) × 0.80 (%20 indirim)
      const yearlyTotal = selectedPlanData.price * 12 * 0.80;
      return yearlyTotal.toFixed(2);
    }
    return selectedPlanData.price;
  };
  
  const getMonthlyEquivalent = () => {
    if (selectedPlanData.id === 'trial') return 0;
    if (isYearly) {
      // Yıllık tutarın aylık karşılığı
      const yearlyTotal = selectedPlanData.price * 12 * 0.80;
      return (yearlyTotal / 12).toFixed(2);
    }
    return selectedPlanData.price;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', { ...formData, plan: selectedPlan, isYearly });
    // TODO: API call to create account
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Hemen Başlayın
            </h1>
            <p className="text-xl text-gray-600">
              Vitingo CRM ile işinizi büyütmeye şimdi başlayın
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Form Section */}
            <div className="lg:col-span-2">
              {/* Plan Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Seçimi</h2>
                
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-6 bg-gray-50 rounded-lg p-4">
                  <span className={`text-base font-semibold ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                    Aylık
                  </span>
                  <button
                    onClick={() => setIsYearly(!isYearly)}
                    className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
                    style={{ backgroundColor: isYearly ? '#3b82f6' : '#d1d5db' }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isYearly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-base font-semibold ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                    Yıllık
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    %20 indirim
                  </span>
                </div>

                {/* Plan Cards Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                            En Popüler
                          </span>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-2xl mb-1">{plan.icon}</div>
                          <h3 className="font-bold text-gray-900">{plan.name}</h3>
                        </div>
                        <div className="text-right">
                          {plan.id === 'trial' ? (
                            <>
                              <div className="text-3xl font-bold text-green-600">$0</div>
                              <div className="text-xs text-gray-500">{plan.period}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-3xl font-bold text-gray-900">
                                ${isYearly ? plan.yearlyPrice : plan.price}
                              </div>
                              <div className="text-xs text-gray-500">/{plan.period}</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{plan.users}</div>
                      <div className="space-y-1">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Şirket Bilgileri</h2>
                
                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Şirket Adı *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        placeholder="ABC Teknoloji A.Ş."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      İletişim Kişisi *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        required
                        placeholder="Ahmet Yılmaz"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        E-posta Adresi *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="info@sirket.com"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Telefon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+90 555 123 4567"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vergi Numarası
                    </label>
                    <input
                      type="text"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleInputChange}
                      placeholder="1234567890"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Address & City */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Adres
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Şirket adresi"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Şehir
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="İstanbul"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Şifre *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Şifre Tekrar *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-3 pt-4">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      required
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-600">
                      <a href="#" className="text-blue-600 hover:underline">Kullanım Koşulları</a> ve{' '}
                      <a href="#" className="text-blue-600 hover:underline">Gizlilik Politikası</a>'nı kabul ediyorum
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Sipariş Özeti</h3>
                
                {selectedPlanData && (
                  <>
                    {/* Selected Plan Info */}
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedPlanData.color} text-white mb-6`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-2xl mb-1">{selectedPlanData.icon}</div>
                          <h4 className="font-bold text-lg">{selectedPlanData.name}</h4>
                        </div>
                        <div className="text-right">
                          {selectedPlanData.id === 'trial' ? (
                            <div className="text-3xl font-bold">$0</div>
                          ) : (
                            <>
                              <div className="text-3xl font-bold">
                                ${calculateTotal()}
                              </div>
                              <div className="text-sm opacity-90">/{selectedPlanData.period}</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm opacity-90">{selectedPlanData.users}</div>
                    </div>

                    {/* Plan Details */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Dahil Olan Özellikler:</h4>
                      <ul className="space-y-2">
                        {selectedPlanData.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Billing Summary */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Periyot:</span>
                        <span className="font-semibold">{isYearly ? 'Yıllık' : 'Aylık'}</span>
                      </div>
                      {isYearly && selectedPlanData.id !== 'trial' && (
                        <div className="flex justify-between text-sm text-green-600 mb-2">
                          <span>Yıllık indirim:</span>
                          <span className="font-semibold">-${selectedPlanData.price - selectedPlanData.yearlyPrice}/ay</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold text-gray-900 mt-4">
                        <span>Toplam:</span>
                        <span className="text-2xl">${calculateTotal()}</span>
                      </div>
                      {selectedPlanData.id === 'trial' && (
                        <div className="text-xs text-gray-500 mt-2">
                          14 gün ücretsiz deneme • Kredi kartı gerekmez
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleSubmit}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      {selectedPlanData.id === 'trial' ? 'Ücretsiz Deneyin' : 'Hesap Oluştur ve Ödeme Yap'}
                    </button>

                    <p className="text-xs text-center text-gray-500 mt-4">
                      Güvenli ödeme • SSL korumalı
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600">
              Zaten hesabınız var mı?{' '}
              <a href="/" className="text-blue-600 font-semibold hover:underline">
                Giriş Yapın
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStartedPage;