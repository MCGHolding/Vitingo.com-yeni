// Growth Rate Mock Data - Comparison with same period of previous year

export const growthData = {
  weekly: {
    title: "Haftalık Büyüme",
    subtitle: "Geçen senenin aynı haftasına göre",
    currentPeriod: "2025 - 38. Hafta",
    previousPeriod: "2024 - 38. Hafta",
    currentValue: 156800,  // This week's sales
    previousValue: 128900, // Same week last year
    growthRate: null, // Will be calculated
    icon: "📊"
  },
  monthly: {
    title: "Aylık Büyüme", 
    subtitle: "Geçen senenin aynı ayına göre",
    currentPeriod: "Eylül 2025",
    previousPeriod: "Eylül 2024", 
    currentValue: 2847500,  // This month's sales
    previousValue: 2340000, // Same month last year
    growthRate: null, // Will be calculated
    icon: "📈"
  },
  yearly: {
    title: "Yıllık Büyüme",
    subtitle: "Geçen yıla göre",
    currentPeriod: "2025 Yılı",
    previousPeriod: "2024 Yılı",
    currentValue: 28475000, // This year's total sales
    previousValue: 23400000, // Last year's total sales
    growthRate: null, // Will be calculated
    icon: "🎯"
  }
};

// Calculate growth rates
Object.keys(growthData).forEach(period => {
  const data = growthData[period];
  data.growthRate = ((data.currentValue - data.previousValue) / data.previousValue * 100).toFixed(1);
});

// Additional comparison data for detailed view
export const detailedGrowthComparison = {
  weekly: {
    metrics: [
      { name: "Satış", current: 156800, previous: 128900, unit: "₺" },
      { name: "Müşteri", current: 45, previous: 38, unit: "adet" },
      { name: "Ortalama Sipariş", current: 3485, previous: 3392, unit: "₺" },
      { name: "Dönüşüm", current: 6.8, previous: 5.9, unit: "%" }
    ]
  },
  monthly: {
    metrics: [
      { name: "Satış", current: 2847500, previous: 2340000, unit: "₺" },
      { name: "Müşteri", current: 892, previous: 734, unit: "adet" },
      { name: "Ortalama Sipariş", current: 3192, previous: 3188, unit: "₺" },
      { name: "Dönüşüm", current: 7.2, previous: 6.1, unit: "%" }
    ]
  },
  yearly: {
    metrics: [
      { name: "Satış", current: 28475000, previous: 23400000, unit: "₺" },
      { name: "Müşteri", current: 8920, previous: 7340, unit: "adet" },
      { name: "Ortalama Sipariş", current: 3193, previous: 3189, unit: "₺" },
      { name: "Dönüşüm", current: 7.4, previous: 6.3, unit: "%" }
    ]
  }
};