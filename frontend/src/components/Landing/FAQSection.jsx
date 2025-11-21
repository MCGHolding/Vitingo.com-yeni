import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Ücretsiz deneme nasıl başlar?',
    answer: '"Başla" butonuna tıklayarak hemen kaydolabilir ve 14 gün boyunca Vitingo CRM\'in tüm özelliklerini ücretsiz kullanabilirsiniz. Kredi kartı bilgisi gerekmez.'
  },
  {
    question: 'Planımı istediğim zaman değiştirebilir miyim?',
    answer: 'Evet, dilediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz. Değişiklik anlık olarak geçerli olur ve fiyat farkı oransal olarak hesaplanır.'
  },
  {
    question: 'Veri güvenliği nasıl sağlanır?',
    answer: 'Verileriniz AWS sunucularında şifrelenerek saklanır. Düzenli yedekleme, SSL sertifikası ve 2 faktörlü kimlik doğrulama ile maksimum güvenlik sağlanmıştır.'
  },
  {
    question: 'Kaç kullanıcı ekleyebilirim?',
    answer: 'Kullanıcı sayısı seçtiğiniz plana bağlıdır. Starter planla 5, Professional ile 10, Enterprise ile 20 kullanıcıya kadar ekleyebilirsiniz. Daha fazla kullanıcı için bizimle iletişime geçin.'
  },
  {
    question: 'Mobil uygulamalar var mı?',
    answer: 'Vitingo CRM web tabanlıdır ve tüm cihazlarda responsive olarak çalışır. iOS ve Android mobil uygulamalarımız yakında yayınlanacak.'
  },
  {
    question: 'İptal politikanız nedir?',
    answer: 'İstediğiniz zaman aboneliğinizi iptal edebilirsiniz. Herhangi bir ceza veya ek ücret yoktur. İptal sonrası verilerinizi 30 gün boyunca saklarken, dilerseniz dışa aktarabilirsiniz.'
  },
  {
    question: 'Teknik destek hizmeti var mı?',
    answer: 'Evet! Tüm planlar için 7/24 e-posta desteği sunuyoruz. Professional ve Enterprise planlar için canlı chat ve telefon desteği de mevcuttur.'
  },
  {
    question: 'Mevcut sistemimden veri taşıyabilir miyim?',
    answer: 'Evet, Excel, CSV veya diğer CRM sistemlerinden toplu veri aktarımı yapabilirsiniz. Teknik ekibimiz veri migrasyonunda size yardımcı olacaktır.'
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Sıkça Sorulan
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Sorular
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Merak ettiklerinizin cevapları
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-blue-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <p className="text-lg text-gray-700 mb-4">
            Daha fazla sorunuz mu var?
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300">
            Bize Ulaşın
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
