// Leads Management Mock Data - 20 days rule implementation

// Helper function to calculate days since last activity
const calculateDaysSince = (lastActivityDate) => {
  const today = new Date();
  const lastActivity = new Date(lastActivityDate);
  const diffTime = Math.abs(today - lastActivity);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Rule: If no activity for 20+ days, move to passive leads
const PASSIVE_LEAD_THRESHOLD_DAYS = 20;

// Active Leads (less than 20 days since last activity)
export const activeLeads = [
  {
    id: 1,
    name: "ABC Teknoloji Ltd.",
    contact: "Ahmet Yılmaz",
    email: "ahmet@abc.com",
    phone: "+90 532 555 0001",
    source: "website",
    value: 45000,
    stage: "qualified",
    lastActivity: "2025-09-20", // 5 days ago
    daysSinceActivity: null // Will be calculated
  },
  {
    id: 2,
    name: "XYZ Otomotiv A.Ş.",
    contact: "Fatma Demir",
    email: "fatma@xyz.com", 
    phone: "+90 533 555 0002",
    source: "referral",
    value: 67500,
    stage: "proposal",
    lastActivity: "2025-09-18", // 7 days ago
    daysSinceActivity: null
  },
  {
    id: 3,
    name: "DEF Yazılım Inc.",
    contact: "Mehmet Kaya",
    email: "mehmet@def.com",
    phone: "+90 534 555 0003", 
    source: "cold_call",
    value: 32000,
    stage: "negotiation",
    lastActivity: "2025-09-15", // 10 days ago
    daysSinceActivity: null
  },
  {
    id: 4,
    name: "GHI Elektronik Ltd.",
    contact: "Ayşe Öz",
    email: "ayse@ghi.com",
    phone: "+90 535 555 0004",
    source: "social_media",
    value: 28500,
    stage: "qualified",
    lastActivity: "2025-09-12", // 13 days ago
    daysSinceActivity: null
  },
  {
    id: 5,
    name: "JKL Medya A.Ş.",
    contact: "Murat Çelik",
    email: "murat@jkl.com",
    phone: "+90 536 555 0005",
    source: "email_campaign", 
    value: 19800,
    stage: "contacted",
    lastActivity: "2025-09-07", // 18 days ago
    daysSinceActivity: null
  }
];

// Passive Leads (20+ days since last activity)
export const passiveLeads = [
  {
    id: 6,
    name: "MNO İnşaat Ltd.",
    contact: "Ali Yıldız",
    email: "ali@mno.com",
    phone: "+90 537 555 0006",
    source: "trade_show",
    value: 125000,
    stage: "stalled",
    lastActivity: "2025-08-15", // 41 days ago
    daysSinceActivity: null,
    passiveSince: "2025-09-04", // Became passive 21 days ago
    reason: "No response to follow-ups"
  },
  {
    id: 7,
    name: "PQR Lojistik A.Ş.",
    contact: "Zeynep Aydın",
    email: "zeynep@pqr.com",
    phone: "+90 538 555 0007",
    source: "partner_referral",
    value: 89000,
    stage: "stalled",
    lastActivity: "2025-08-20", // 36 days ago
    daysSinceActivity: null,
    passiveSince: "2025-09-09",
    reason: "Budget constraints mentioned"
  },
  {
    id: 8,
    name: "STU Perakende Ltd.",
    contact: "Hasan Koç",
    email: "hasan@stu.com", 
    phone: "+90 539 555 0008",
    source: "google_ads",
    value: 54000,
    stage: "stalled", 
    lastActivity: "2025-08-10", // 46 days ago
    daysSinceActivity: null,
    passiveSince: "2025-08-30",
    reason: "Decision delayed indefinitely"
  },
  {
    id: 9,
    name: "VWX Turizm A.Ş.",
    contact: "Elif Şahin",
    email: "elif@vwx.com",
    phone: "+90 540 555 0009", 
    source: "linkedin",
    value: 73500,
    stage: "stalled",
    lastActivity: "2025-07-28", // 59 days ago
    daysSinceActivity: null,
    passiveSince: "2025-08-17",
    reason: "Contact changed company"
  },
  {
    id: 10,
    name: "YZ Danışmanlık Ltd.",
    contact: "Oğuz Ertürk",
    email: "oguz@yz.com",
    phone: "+90 541 555 0010",
    source: "website",
    value: 41200,
    stage: "stalled",
    lastActivity: "2025-08-05", // 51 days ago  
    daysSinceActivity: null,
    passiveSince: "2025-08-25",
    reason: "No longer interested"
  }
];

// Calculate days since activity for all leads
[...activeLeads, ...passiveLeads].forEach(lead => {
  lead.daysSinceActivity = calculateDaysSince(lead.lastActivity);
});

// Lead classification logic
export const classifyLead = (lead) => {
  const daysSinceActivity = calculateDaysSince(lead.lastActivity);
  
  if (daysSinceActivity >= PASSIVE_LEAD_THRESHOLD_DAYS) {
    return {
      status: 'passive',
      daysSinceActivity,
      shouldTransfer: true,
      message: `${daysSinceActivity} gündür işlem yok - Pasif lead'e aktarılmalı`
    };
  } else {
    return {
      status: 'active', 
      daysSinceActivity,
      shouldTransfer: false,
      daysUntilPassive: PASSIVE_LEAD_THRESHOLD_DAYS - daysSinceActivity,
      message: `${PASSIVE_LEAD_THRESHOLD_DAYS - daysSinceActivity} gün sonra pasif olacak`
    };
  }
};

// Summary statistics
export const leadsStats = {
  totalActiveLeads: activeLeads.length,
  totalPassiveLeads: passiveLeads.length,
  totalLeads: activeLeads.length + passiveLeads.length,
  activeValue: activeLeads.reduce((sum, lead) => sum + lead.value, 0),
  passiveValue: passiveLeads.reduce((sum, lead) => sum + lead.value, 0),
  totalValue: activeLeads.reduce((sum, lead) => sum + lead.value, 0) + 
              passiveLeads.reduce((sum, lead) => sum + lead.value, 0),
  averageActiveDays: activeLeads.reduce((sum, lead) => sum + lead.daysSinceActivity, 0) / activeLeads.length,
  averagePassiveDays: passiveLeads.reduce((sum, lead) => sum + lead.daysSinceActivity, 0) / passiveLeads.length,
  recentlyPassive: passiveLeads.filter(lead => calculateDaysSince(lead.passiveSince) <= 7).length, // Last 7 days
  riskOfPassive: activeLeads.filter(lead => lead.daysSinceActivity >= 15).length // 15+ days, close to 20
};

// Automatic lead transfer simulation (for future backend implementation)
export const automaticLeadTransfer = () => {
  const leadsToTransfer = activeLeads.filter(lead => 
    classifyLead(lead).shouldTransfer
  );
  
  console.log(`Found ${leadsToTransfer.length} leads to transfer to passive:`);
  leadsToTransfer.forEach(lead => {
    console.log(`- ${lead.name}: ${lead.daysSinceActivity} days inactive`);
  });
  
  return {
    count: leadsToTransfer.length,
    leads: leadsToTransfer,
    totalValue: leadsToTransfer.reduce((sum, lead) => sum + lead.value, 0)
  };
};

export { PASSIVE_LEAD_THRESHOLD_DAYS, calculateDaysSince };