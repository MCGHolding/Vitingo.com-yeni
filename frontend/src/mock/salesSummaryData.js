// Sales Summary Mock Data

export const salesSummaryData = {
  monthly: {
    title: "Aylık Satış Özeti",
    subtitle: "Bu ayın detaylı performansı",
    currentEarnings: 6890680,
    currentSales: 1540,
    previousEarnings: 5234567,
    previousSales: 1234,
    chartData: [
      { period: 1, iphone: 12, ipad: 8, total: 20 },
      { period: 2, iphone: 15, ipad: 12, total: 27 },
      { period: 3, iphone: 18, ipad: 15, total: 33 },
      { period: 4, iphone: 22, ipad: 18, total: 40 },
      { period: 5, iphone: 28, ipad: 25, total: 53 },
      { period: 6, iphone: 24, ipad: 22, total: 46 },
      { period: 7, iphone: 32, ipad: 28, total: 60 },
      { period: 8, iphone: 35, ipad: 30, total: 65 }
    ]
  },
  daily: {
    title: "Günlük Satış Özeti", 
    subtitle: "Son 7 günün performansı",
    currentEarnings: 234560,
    currentSales: 67,
    previousEarnings: 198450,
    previousSales: 52,
    chartData: [
      { period: 'Pzt', iphone: 8, ipad: 5, total: 13 },
      { period: 'Sal', iphone: 12, ipad: 8, total: 20 },
      { period: 'Çar', iphone: 15, ipad: 10, total: 25 },
      { period: 'Per', iphone: 18, ipad: 12, total: 30 },
      { period: 'Cum', iphone: 22, ipad: 15, total: 37 },
      { period: 'Cmt', iphone: 16, ipad: 11, total: 27 },
      { period: 'Paz', iphone: 10, ipad: 7, total: 17 }
    ]
  },
  weekly: {
    title: "Haftalık Satış Özeti",
    subtitle: "Son 8 haftanın performansı", 
    currentEarnings: 1456780,
    currentSales: 425,
    previousEarnings: 1234560,
    previousSales: 378,
    chartData: [
      { period: 'H1', iphone: 45, ipad: 32, total: 77 },
      { period: 'H2', iphone: 52, ipad: 38, total: 90 },
      { period: 'H3', iphone: 48, ipad: 35, total: 83 },
      { period: 'H4', iphone: 58, ipad: 42, total: 100 },
      { period: 'H5', iphone: 62, ipad: 45, total: 107 },
      { period: 'H6', iphone: 55, ipad: 40, total: 95 },
      { period: 'H7', iphone: 68, ipad: 48, total: 116 },
      { period: 'H8', iphone: 72, ipad: 52, total: 124 }
    ]
  },
  yearly: {
    title: "Yıllık Satış Özeti",
    subtitle: "Son 12 ayın performansı",
    currentEarnings: 58256789,
    currentSales: 15420,
    previousEarnings: 42345678,
    previousSales: 12850,
    chartData: [
      { period: 'Oca', iphone: 450, ipad: 320, total: 770 },
      { period: 'Şub', iphone: 520, ipad: 380, total: 900 },
      { period: 'Mar', iphone: 480, ipad: 350, total: 830 },
      { period: 'Nis', iphone: 580, ipad: 420, total: 1000 },
      { period: 'May', iphone: 620, ipad: 450, total: 1070 },
      { period: 'Haz', iphone: 550, ipad: 400, total: 950 },
      { period: 'Tem', iphone: 680, ipad: 480, total: 1160 },
      { period: 'Ağu', iphone: 720, ipad: 520, total: 1240 },
      { period: 'Eyl', iphone: 650, ipad: 470, total: 1120 },
      { period: 'Eki', iphone: 780, ipad: 560, total: 1340 },
      { period: 'Kas', iphone: 820, ipad: 590, total: 1410 },
      { period: 'Ara', iphone: 880, ipad: 630, total: 1510 }
    ]
  }
};