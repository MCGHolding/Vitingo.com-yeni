import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Ahmet Yılmaz',
    role: 'Genel Müdür',
    company: 'TechVision A.Ş.',
    image: 'https://ui-avatars.com/api/?name=Ahmet+Yilmaz&background=3b82f6&color=fff&size=128',
    rating: 5,
    text: 'Vitingo CRM sayesinde müşteri yönetimimiz çok daha etkili hale geldi. Özellikle lead takip sistemi ve raporlama özellikleri işimizi inanılmaz kolaylaştırdı.'
  },
  {
    name: 'Zeynep Demir',
    role: 'Satış Müdürü',
    company: 'Innovate Ltd.',
    image: 'https://ui-avatars.com/api/?name=Zeynep+Demir&background=9333ea&color=fff&size=128',
    rating: 5,
    text: 'Ekip olarak kullanmaya başladığımızdan beri satış süreçlerimiz hızlandı. Kullanıcı dostu arayüzü ve Türkçe desteği büyük artı.'
  },
  {
    name: 'Mehmet Kaya',
    role: 'Proje Koordinatörü',
    company: 'GlobalEx Grup',
    image: 'https://ui-avatars.com/api/?name=Mehmet+Kaya&background=ec4899&color=fff&size=128',
    rating: 5,
    text: 'Proje yönetimi ve fuar organizasyonlarımızı tek platformda yönetebilmemiz mükemmel. Ekibim Vitingo CRM\i çok beğendi.'
  },
  {
    name: 'Ayşe Özkan',
    role: 'İşletme Sahibi',
    company: 'Dijital Ajans Pro',
    image: 'https://ui-avatars.com/api/?name=Ayse+Ozkan&background=10b981&color=fff&size=128',
    rating: 5,
    text: 'Küçük bir ekiple büyük işler başarmanın yolu Vitingo CRM\den geçiyor. Fiyat-performans açısından harika!'
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Müşterilerimiz
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Ne Diyor?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Binlerce şirket Vitingo CRM ile iş süreçlerini optimize ediyor
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-blue-600 mb-4 opacity-50" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full"
                />
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-gray-500">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              5,000+
            </p>
            <p className="text-gray-600 mt-2">Aktif Kullanıcı</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              98%
            </p>
            <p className="text-gray-600 mt-2">Müşteri Memnuniyeti</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600">
              50M+
            </p>
            <p className="text-gray-600 mt-2">Yönetilen Proje</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              24/7
            </p>
            <p className="text-gray-600 mt-2">Destek Hizmeti</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
