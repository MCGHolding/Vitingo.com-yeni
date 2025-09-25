// Survey System Mock Data - Fair Stand Production Customer Satisfaction

// Survey Questions for Fair Stand Production
export const surveyQuestions = [
  {
    id: 1,
    type: "multiple_choice",
    question: "Proje tasarım süreciyle ilgili genel memnuniyet seviyeniz nedir?",
    required: true,
    options: [
      { value: "5", label: "Çok Memnun" },
      { value: "4", label: "Memnun" },
      { value: "3", label: "Orta" },
      { value: "2", label: "Memnun Değil" },
      { value: "1", label: "Hiç Memnun Değil" }
    ]
  },
  {
    id: 2,
    type: "multiple_choice",
    question: "Tasarım ekibimizin profesyonelliği ve iletişimi nasıldı?",
    required: true,
    options: [
      { value: "excellent", label: "Mükemmel" },
      { value: "good", label: "İyi" },
      { value: "average", label: "Orta" },
      { value: "poor", label: "Kötü" },
      { value: "very_poor", label: "Çok Kötü" }
    ]
  },
  {
    id: 3,
    type: "checkbox",
    question: "Hangi hizmetlerimizden memnun kaldınız? (Birden fazla seçenek işaretleyebilirsiniz)",
    required: false,
    options: [
      { value: "design", label: "3D Tasarım ve Görselleştirme" },
      { value: "production", label: "Üretim Kalitesi" },
      { value: "installation", label: "Kurulum Hizmetleri" },
      { value: "logistics", label: "Lojistik ve Nakliye" },
      { value: "support", label: "Fuar Öncesi Teknik Destek" },
      { value: "timeline", label: "Teslimat Süresi" }
    ]
  },
  {
    id: 4,
    type: "multiple_choice",
    question: "Stand üretim kalitesini 1-10 arasında nasıl değerlendirirsiniz?",
    required: true,
    options: [
      { value: "10", label: "10 - Mükemmel" },
      { value: "9", label: "9 - Çok İyi" },
      { value: "8", label: "8 - İyi" },
      { value: "7", label: "7 - Orta Üstü" },
      { value: "6", label: "6 - Orta" },
      { value: "5", label: "5 - Orta Altı" },
      { value: "4", label: "4 - Kötü" },
      { value: "3", label: "3 - Çok Kötü" },
      { value: "2", label: "2 - Felaket" },
      { value: "1", label: "1 - Berbat" }
    ]
  },
  {
    id: 5,
    type: "text",
    question: "Fuar standınızın en beğendiğiniz özelliği neydi?",
    required: false,
    placeholder: "Örn: LED ekranlar, interaktif bölümler, renk uyumu..."
  },
  {
    id: 6,
    type: "multiple_choice",
    question: "Teslimat sürecinde yaşanan deneyim nasıldı?",
    required: true,
    options: [
      { value: "on_time", label: "Tam Zamanında Teslim" },
      { value: "early", label: "Erken Teslim" },
      { value: "slightly_late", label: "Hafif Gecikme (1-2 gün)" },
      { value: "late", label: "Gecikme (3+ gün)" },
      { value: "very_late", label: "Ciddi Gecikme (1+ hafta)" }
    ]
  },
  {
    id: 7,
    type: "checkbox",
    question: "Fuar sırasında hangi sorunlarla karşılaştınız? (Varsa işaretleyiniz)",
    required: false,
    options: [
      { value: "assembly", label: "Kurulum Zorlukları" },
      { value: "materials", label: "Malzeme Kalite Sorunları" },
      { value: "design_issues", label: "Tasarım ile İlgili Sorunlar" },
      { value: "electrical", label: "Elektrik/LED Sorunları" },
      { value: "structural", label: "Yapısal Sorunlar" },
      { value: "none", label: "Hiçbir Sorun Yaşamadım" }
    ]
  },
  {
    id: 8,
    type: "text",
    question: "Gelecek projelerimizde hangi iyileştirmeleri görmek istersiniz?",
    required: false,
    placeholder: "Önerilerinizi paylaşın..."
  },
  {
    id: 9,
    type: "multiple_choice",
    question: "Bizi başka müşterilere tavsiye etme olasılığınız ne kadar? (NPS)",
    required: true,
    options: [
      { value: "10", label: "10 - Kesinlikle Tavsiye Ederim" },
      { value: "9", label: "9 - Çok Büyük İhtimalle" },
      { value: "8", label: "8 - Büyük İhtimalle" },
      { value: "7", label: "7 - Muhtemelen" },
      { value: "6", label: "6 - Belki" },
      { value: "5", label: "5 - Kararsızım" },
      { value: "4", label: "4 - Muhtemelen Etmem" },
      { value: "3", label: "3 - Pek Etmem" },
      { value: "2", label: "2 - Etmem" },
      { value: "1", label: "1 - Asla Etmem" }
    ]
  },
  {
    id: 10,
    type: "text",
    question: "Eklemek istediğiniz başka yorumlarınız var mı?",
    required: false,
    placeholder: "Görüş ve önerileriniz bizim için çok değerli..."
  }
];

// Mock Customers with Projects
export const customersWithProjects = [
  {
    id: 1,
    name: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    email: "ahmet@abcteknoloji.com",
    phone: "+90 532 555 0001",
    projects: [
      {
        id: 101,
        name: "CeBIT Turkey 2024 Standı",
        city: "İstanbul",
        country: "Türkiye",
        deliveryDate: "2024-11-15",
        status: "completed",
        fairName: "CeBIT Turkey",
        standSize: "9x6 metre",
        surveyLink: null,
        customerRepresentative: "Elif Özkan"
      },
      {
        id: 107,
        name: "Mobile World Congress Barcelona",
        city: "Barcelona",
        country: "İspanya",
        deliveryDate: "2024-02-28",
        status: "completed",
        fairName: "Mobile World Congress",
        standSize: "12x8 metre",
        surveyLink: null,
        customerRepresentative: "Can Demir"
      },
      {
        id: 108,
        name: "ITU Telecom World Istanbul",
        city: "İstanbul",
        country: "Türkiye",
        deliveryDate: "2024-05-15",
        status: "completed",
        fairName: "ITU Telecom World",
        standSize: "15x10 metre",
        surveyLink: null,
        customerRepresentative: "Elif Özkan"
      },
      {
        id: 109,
        name: "Eurasia Boat Show Istanbul",
        city: "İstanbul",
        country: "Türkiye",
        deliveryDate: "2024-03-10",
        status: "completed",
        fairName: "Eurasia Boat Show",
        standSize: "8x6 metre",
        surveyLink: null,
        customerRepresentative: "Mert Kaya"
      }
    ]
  },
  {
    id: 2,
    name: "XYZ Otomotiv A.Ş.",
    contact: "Fatma Demir",
    email: "fatma@xyzotomotiv.com",
    phone: "+90 533 555 0002",
    projects: [
      {
        id: 102,
        name: "Automechanika İstanbul Standı",
        city: "İstanbul", 
        country: "Türkiye",
        deliveryDate: "2024-09-20",
        status: "completed",
        fairName: "Automechanika İstanbul",
        standSize: "12x8 metre",
        surveyLink: null,
        customerRepresentative: "Can Demir"
      },
      {
        id: 110,
        name: "IAA Mobility Münih",
        city: "Münih",
        country: "Almanya",
        deliveryDate: "2024-06-12",
        status: "completed",
        fairName: "IAA Mobility",
        standSize: "18x12 metre",
        surveyLink: null,
        customerRepresentative: "Selin Aydın"
      },
      {
        id: 111,
        name: "Paris Motor Show",
        city: "Paris",
        country: "Fransa",
        deliveryDate: "2024-08-05",
        status: "completed",
        fairName: "Paris Motor Show",
        standSize: "16x10 metre",
        surveyLink: null,
        customerRepresentative: "Can Demir"
      }
    ]
  },
  {
    id: 3,
    name: "DEF Yazılım Inc.",
    contact: "Mehmet Kaya",
    email: "mehmet@defyazilim.com",
    phone: "+90 534 555 0003",
    projects: [
      {
        id: 103,
        name: "GITEX Technology Week Standı",
        city: "Dubai",
        country: "BAE",
        deliveryDate: "2024-10-12",
        status: "completed", 
        fairName: "GITEX Technology Week",
        standSize: "15x10 metre",
        surveyLink: null,
        customerRepresentative: "Mert Kaya"
      }
    ]
  },
  {
    id: 4,
    name: "GHI Elektronik Ltd.",
    contact: "Ayşe Öz",
    email: "ayse@ghielektronik.com",
    phone: "+90 535 555 0004",
    projects: [
      {
        id: 104,
        name: "IFA Berlin Standı",
        city: "Berlin",
        country: "Almanya",
        deliveryDate: "2024-08-28",
        status: "completed",
        fairName: "IFA Berlin",
        standSize: "18x12 metre", 
        surveyLink: null
      }
    ]
  },
  {
    id: 5,
    name: "JKL Medya A.Ş.",
    contact: "Murat Çelik",
    email: "murat@jklmedya.com",
    phone: "+90 536 555 0005",
    projects: [
      {
        id: 105,
        name: "NAB Show Las Vegas Standı",
        city: "Las Vegas",
        country: "ABD",
        deliveryDate: "2024-04-15",
        status: "completed",
        fairName: "NAB Show",
        standSize: "21x15 metre",
        surveyLink: null
      }
    ]
  },
  {
    id: 6,
    name: "MNO İnşaat Ltd.",
    contact: "Ali Yıldız", 
    email: "ali@mnoinsaat.com",
    phone: "+90 537 555 0006",
    projects: [
      {
        id: 106,
        name: "Yapı Fuarı İzmir Standı",
        city: "İzmir",
        country: "Türkiye",
        deliveryDate: "2024-05-22",
        status: "completed",
        fairName: "Yapı Fuarı İzmir",
        standSize: "6x4 metre",
        surveyLink: null
      }
    ]
  }
];

// Survey Responses Mock Data - Multiple responses per customer
export const surveyResponses = [
  {
    id: 1,
    customerId: 1,
    customerName: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    projectId: 101,
    projectName: "CeBIT Turkey 2024 Standı",
    surveyToken: "abc123def456",
    responses: {
      1: "5", // Çok Memnun
      2: "excellent", // Mükemmel
      3: ["design", "production", "timeline"], // Birden fazla seçim
      4: "9", // 9 puan
      5: "LED ekranlar ve interaktif dokunmatik paneller gerçekten etkileyiciydi",
      6: "on_time", // Tam zamanında
      7: ["none"], // Sorun yaşamadım  
      8: "Daha fazla LED kullanımı ve ses sistemi iyileştirmeleri",
      9: "9", // NPS 9
      10: "Harika bir deneyimdi, teşekkürler!"
    },
    submittedAt: "2024-11-20T10:30:00Z",
    ipAddress: "192.168.1.100"
  },
  {
    id: 2,
    customerId: 2,
    customerName: "XYZ Otomotiv A.Ş.",
    contact: "Fatma Demir",
    projectId: 102,
    projectName: "Automechanika İstanbul Standı",
    surveyToken: "xyz789ghi012",
    responses: {
      1: "4", // Memnun
      2: "good", // İyi
      3: ["production", "installation", "support"],
      4: "8", // 8 puan
      5: "Araç sergi alanı ve LED ışıklandırma çok profesyoneldi",
      6: "on_time",
      7: ["electrical"], // Elektrik sorunları
      8: "Ses sisteminde iyileştirme yapılabilir",
      9: "8", // NPS 8
      10: "Genel olarak başarılı bir proje oldu"
    },
    submittedAt: "2024-09-25T14:15:00Z",
    ipAddress: "192.168.1.105"
  },
  {
    id: 3,
    customerId: 1,
    customerName: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    projectId: 107,
    projectName: "Mobile World Congress Barcelona",
    surveyToken: "abc456def789",
    responses: {
      1: "5", // Çok Memnun
      2: "excellent",
      3: ["design", "production", "logistics", "support"],
      4: "10", // 10 puan
      5: "Hologram teknolojisi ve VR bölümü müthişti",
      6: "early", // Erken teslim
      7: ["none"],
      8: "Daha büyük LED duvarları olabilir",
      9: "10", // NPS 10
      10: "Mükemmel bir iş çıkardınız, Barcelona'da çok beğeni topladık!"
    },
    submittedAt: "2024-02-28T09:45:00Z",
    ipAddress: "192.168.1.100"
  },
  {
    id: 4,
    customerId: 3,
    customerName: "DEF Yazılım Inc.",
    contact: "Mehmet Kaya",
    projectId: 103,
    projectName: "GITEX Technology Week Standı",
    surveyToken: "def345ghi678",
    responses: {
      1: "3", // Orta
      2: "average", // Orta
      3: ["design", "timeline"],
      4: "6", // 6 puan
      5: "Yazılım demo alanları güzeldi ama teknik sorunlar oldu",
      6: "slightly_late", // Hafif gecikme
      7: ["assembly", "electrical"], // Kurulum ve elektrik sorunları
      8: "Kurulum ekibinin daha deneyimli olması gerekiyor",
      9: "5", // NPS 5
      10: "Ortalama bir deneyim, geliştirilmesi gereken alanlar var"
    },
    submittedAt: "2024-10-18T16:20:00Z",
    ipAddress: "192.168.1.110"
  },
  {
    id: 5,
    customerId: 4,
    customerName: "GHI Elektronik Ltd.",
    contact: "Ayşe Öz",
    projectId: 104,
    projectName: "IFA Berlin Standı",
    surveyToken: "ghi567jkl890",
    responses: {
      1: "5", // Çok Memnun
      2: "excellent",
      3: ["design", "production", "installation", "logistics"],
      4: "9", // 9 puan
      5: "Ürün sergileme alanları ve aydınlatma sistemi harika",
      6: "on_time",
      7: ["none"],
      8: "İnteraktif ekranlar daha büyük olabilir",
      9: "9", // NPS 9
      10: "Berlin'de çok başarılı geçti, tebrikler!"
    },
    submittedAt: "2024-09-05T11:10:00Z",
    ipAddress: "192.168.1.115"
  },
  {
    id: 6,
    customerId: 1,
    customerName: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    projectId: 108,
    projectName: "ITU Telecom World Istanbul",
    surveyToken: "abc789def012",
    responses: {
      1: "4", // Memnun
      2: "good",
      3: ["design", "production", "timeline"],
      4: "8", // 8 puan
      5: "5G demo alanı ve hologram gösterileri etkileyiciydi",
      6: "on_time",
      7: ["materials"], // Malzeme kalite sorunları
      8: "Malzeme kalitesinde iyileştirme yapılmalı",
      9: "7", // NPS 7
      10: "İyi bir proje ama bazı detaylarda eksiklik vardı"
    },
    submittedAt: "2024-05-15T13:25:00Z",
    ipAddress: "192.168.1.100"
  },
  {
    id: 7,
    customerId: 5,
    customerName: "JKL Medya A.Ş.",
    contact: "Murat Çelik",
    projectId: 105,
    projectName: "NAB Show Las Vegas Standı",
    surveyToken: "jkl123mno456",
    responses: {
      1: "5", // Çok Memnun
      2: "excellent",
      3: ["design", "production", "logistics", "support"],
      4: "10", // 10 puan
      5: "4K LED duvarı ve ses sistemi mükemmeldi",
      6: "on_time",
      7: ["none"],
      8: "Her şey harikaydı, devam edin böyle",
      9: "10", // NPS 10
      10: "Las Vegas'ta büyük ilgi gördük, ekibinizi tebrik ediyorum!"
    },
    submittedAt: "2024-04-20T08:50:00Z",
    ipAddress: "192.168.1.120"
  },
  {
    id: 8,
    customerId: 1,
    customerName: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    projectId: 109,
    projectName: "Eurasia Boat Show Istanbul",
    surveyToken: "abc012def345",
    responses: {
      1: "3", // Orta
      2: "average",
      3: ["design", "installation"],
      4: "7", // 7 puan
      5: "Tasarım güzeldi ama kurulum sorunları yaşandı",
      6: "late", // Gecikme
      7: ["assembly", "structural"], // Kurulum ve yapısal sorunlar
      8: "Kurulum sürecinde daha dikkatli olunmalı",
      9: "6", // NPS 6
      10: "Ortalama bir deneyim, beklentilerimi tam karşılamadı"
    },
    submittedAt: "2024-03-10T12:40:00Z",
    ipAddress: "192.168.1.100"
  }
];

// Survey Statistics
export const surveyStats = {
  totalSent: 15,
  totalCompleted: 8,
  responseRate: 53.3,
  averageNPS: 8.2,
  averageSatisfaction: 4.3,
  completionTime: 4.2, // minutes
  lastResponse: "2024-12-01T15:45:00Z"
};

// Generate unique survey token
export const generateSurveyToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Email template for survey invitation
export const surveyEmailTemplate = (customer, project, surveyLink) => {
  return {
    to: customer.email,
    subject: `${project.fairName} - Müşteri Memnuniyet Anketi`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Değerli Görüşünüz Bizim İçin Önemli!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333;">Sayın <strong>${customer.contact}</strong>,</p>
          
          <p style="color: #555; line-height: 1.6;">
            <strong>${project.fairName}</strong> fuarı için hazırladığımız stand projenizle ilgili deneyiminizi öğrenmek istiyoruz.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin-top: 0;">Proje Detayları:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Proje:</strong> ${project.name}</li>
              <li><strong>Fuar:</strong> ${project.fairName}</li>
              <li><strong>Lokasyon:</strong> ${project.city}, ${project.country}</li>
              <li><strong>Teslimat Tarihi:</strong> ${new Date(project.deliveryDate).toLocaleDateString('tr-TR')}</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Anketi tamamlamanız yaklaşık <strong>3-5 dakika</strong> sürecektir. 
            Görüşleriniz gelecekteki projelerimizi daha da iyileştirmemize yardımcı olacaktır.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${surveyLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              🗳️ Ankete Başla
            </a>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center;">
            Bu anket linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 14px;">
            Vitingo CRM | Fuar Stand Üretim ve Tasarım
          </p>
        </div>
      </div>
    `
  };
};