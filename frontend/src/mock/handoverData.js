// Handover Forms Mock Data

// Handover form templates by language
export const handoverTemplates = {
  tr: {
    title: "Fuar Standı Teslim Formu",
    content: [
      "Bu belge ile aşağıda detayları verilen fuar standının teslim edildiğini beyan ederiz:",
      "• Stand tasarımı projeye uygun şekilde tamamlanmıştır",
      "• Tüm elektrik tesisatları çalışır durumda ve güvenlik standartlarına uygundur", 
      "• Ses ve görüntü sistemleri test edilmiş ve sorunsuz çalışmaktadır",
      "• Stand yüzeyleri temiz ve hasarsız şekilde teslim edilmiştir",
      "• Dekorasyon ve sergi materyalleri eksiksiz yerleştirilmiştir",
      "• İtfaiye ve güvenlik önlemleri alınmış, gerekli belgeler hazırlanmıştır",
      "• Stand anahtarları ve teknik dokümantasyon teslim edilmiştir"
    ],
    acceptanceText: "Yukarıda belirtilen standı eksiksiz ve çalışır durumda teslim aldığımı beyan ederim.",
    signatureLabel: "Dijital İmza",
    submitButton: "Teslim Formunu Onayla",
    nameLabel: "Ad Soyad",
    titleLabel: "Ünvan", 
    companyLabel: "Şirket",
    dateLabel: "Tarih"
  },
  en: {
    title: "Fair Stand Handover Form",
    content: [
      "This document certifies the handover of the fair stand with details specified below:",
      "• Stand design has been completed according to the project specifications",
      "• All electrical installations are functional and comply with safety standards",
      "• Audio and visual systems have been tested and are working properly", 
      "• Stand surfaces have been delivered clean and undamaged",
      "• Decoration and exhibition materials have been completely installed",
      "• Fire safety and security measures have been taken, required documents prepared",
      "• Stand keys and technical documentation have been delivered"
    ],
    acceptanceText: "I hereby confirm that I have received the above-mentioned stand in complete and working condition.",
    signatureLabel: "Digital Signature",
    submitButton: "Confirm Handover Form",
    nameLabel: "Full Name",
    titleLabel: "Title",
    companyLabel: "Company", 
    dateLabel: "Date"
  }
};

// Mock handover records
export const handoverRecords = [
  {
    id: 1,
    customerId: 1,
    customerName: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    projectId: 101,
    projectName: "CeBIT Turkey 2024 Standı",
    customerRepresentative: "Elif Özkan",
    language: "tr",
    sentAt: "2024-11-20T10:30:00Z",
    completedAt: "2024-11-20T14:45:00Z",
    status: "completed", // pending, completed, expired
    handoverToken: "ho_abc123def456",
    handoverLink: "https://docu-sign-2.preview.emergentagent.com/handover/ho_abc123def456",
    signatureData: {
      customerName: "Ahmet Yılmaz",
      customerTitle: "Genel Müdür",
      customerCompany: "ABC Teknoloji Ltd.", 
      signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0..."
    },
    autoSurveyTriggered: true,
    surveyToken: "abc123def456"
  },
  {
    id: 2,
    customerId: 2,
    customerName: "XYZ Otomotiv A.Ş.",
    contact: "Fatma Demir", 
    projectId: 102,
    projectName: "Automechanika İstanbul Standı",
    customerRepresentative: "Can Demir",
    language: "tr",
    sentAt: "2024-11-18T09:15:00Z",
    completedAt: null,
    status: "pending",
    handoverToken: "ho_xyz789ghi012",
    handoverLink: "https://docu-sign-2.preview.emergentagent.com/handover/ho_xyz789ghi012",
    signatureData: null,
    autoSurveyTriggered: false,
    surveyToken: null
  },
  {
    id: 3,
    customerId: 3,
    customerName: "DEF Yazılım Inc.",
    contact: "Mehmet Kaya",
    projectId: 103, 
    projectName: "GITEX Technology Week Standı",
    customerRepresentative: "Mert Kaya",
    language: "en", // Foreign customer
    sentAt: "2024-11-15T16:20:00Z",
    completedAt: "2024-11-16T11:30:00Z", 
    status: "completed",
    handoverToken: "ho_def345ghi678",
    handoverLink: "https://docu-sign-2.preview.emergentagent.com/handover/ho_def345ghi678",
    signatureData: {
      customerName: "Mehmet Kaya",
      customerTitle: "CTO",
      customerCompany: "DEF Yazılım Inc.",
      signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", 
      ipAddress: "10.0.1.50",
      userAgent: "Mozilla/5.0..."
    },
    autoSurveyTriggered: true,
    surveyToken: "def345ghi678"
  },
  {
    id: 4,
    customerId: 1,
    customerName: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    projectId: 107,
    projectName: "Mobile World Congress Barcelona", 
    customerRepresentative: "Can Demir",
    language: "en", // International fair
    sentAt: "2024-10-25T12:00:00Z",
    completedAt: "2024-10-25T18:45:00Z",
    status: "completed",
    handoverToken: "ho_abc456def789", 
    handoverLink: "https://docu-sign-2.preview.emergentagent.com/handover/ho_abc456def789",
    signatureData: {
      customerName: "Ahmet Yılmaz",
      customerTitle: "General Manager", 
      customerCompany: "ABC Teknoloji Ltd.",
      signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      ipAddress: "87.247.181.25",
      userAgent: "Mozilla/5.0..."
    },
    autoSurveyTriggered: true,
    surveyToken: "abc456def789"
  },
  {
    id: 5,
    customerId: 4,
    customerName: "GHI İnşaat Ltd.",
    contact: "Zeynep Arslan",
    projectId: 106,
    projectName: "Yapı Fuarı İzmir Standı",
    customerRepresentative: "Mert Kaya", 
    language: "tr",
    sentAt: "2024-11-10T14:30:00Z",
    completedAt: null,
    status: "pending",
    handoverToken: "ho_ghi901jkl234",
    handoverLink: "https://docu-sign-2.preview.emergentagent.com/handover/ho_ghi901jkl234",
    signatureData: null,
    autoSurveyTriggered: false,
    surveyToken: null
  }
];

// User roles for access control
export const userPermissions = {
  admin: {
    role: "admin",
    canViewAll: true,
    canSendHandovers: true,
    canManageUsers: true
  },
  "Elif Özkan": {
    role: "representative", 
    canViewAll: false,
    canSendHandovers: true,
    customersAssigned: [1, 3] // Can only see handovers for these customers
  },
  "Can Demir": {
    role: "representative",
    canViewAll: false, 
    canSendHandovers: true,
    customersAssigned: [1, 2]
  },
  "Mert Kaya": {
    role: "representative",
    canViewAll: false,
    canSendHandovers: true, 
    customersAssigned: [3, 4]
  },
  "Selin Aydın": {
    role: "representative",
    canViewAll: false,
    canSendHandovers: true,
    customersAssigned: [4, 5]
  }
};

// Helper function to get user's accessible handovers
export const getAccessibleHandovers = (userRole, userName) => {
  if (userRole === 'admin') {
    return handoverRecords;
  }
  
  const userPerms = userPermissions[userName];
  if (!userPerms || userPerms.canViewAll) {
    return handoverRecords;
  }
  
  // Filter by assigned customers
  return handoverRecords.filter(handover => 
    userPerms.customersAssigned.includes(handover.customerId) ||
    handover.customerRepresentative === userName
  );
};

// Reminder schedule for surveys after handover completion
export const reminderSchedule = {
  initialDelay: 3, // days after handover completion to send first survey
  reminderInterval: 10, // days between reminder emails
  maxReminders: 5 // maximum number of reminder emails
};

// Email templates for handover process
export const handoverEmailTemplates = {
  tr: {
    subject: "Fuar Standı Teslim Formu - {projectName}",
    body: `
      Sayın {customerName},
      
      {projectName} projeniz kapsamında hazırlanan fuar standınız tamamlanmıştır.
      
      Standınızı teslim alabilmek için aşağıdaki linke tıklayarak teslim formunu doldurunuz:
      
      {handoverLink}
      
      Bu form ile standın eksiksiz ve çalışır durumda teslim edildiğini beyan etmiş olacaksınız.
      
      Teşekkürler,
      Vitingo CRM Ekibi
    `
  },
  en: {
    subject: "Fair Stand Handover Form - {projectName}", 
    body: `
      Dear {customerName},
      
      Your fair stand for the {projectName} project has been completed.
      
      To receive your stand, please click the link below to fill out the handover form:
      
      {handoverLink}
      
      This form confirms that the stand has been delivered complete and in working condition.
      
      Best regards,
      Vitingo CRM Team
    `
  }
};