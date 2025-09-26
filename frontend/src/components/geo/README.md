# 🌍 Centralized Geographic System

Vitingo CRM için merkezi ülke/şehir yönetim sistemi. Tüm formlarda tutarlı coğrafi veri yönetimi sağlar.

## 📋 Özellikler

### ✅ Tamamlanan Özellikler
- **Merkezi Veri Kaynağı**: MongoDB-based countries ve cities collections
- **Type-ahead Search**: 300ms debounce ile aranabilir ülke/şehir seçimi
- **Turkish Character Support**: Aksan toleransı ("Turkiye" → "Turkey")
- **Responsive Design**: Mobile-friendly UI componentleri
- **Lazy Loading**: Şehirler ülke seçildikten sonra yüklenir
- **Pagination**: 50 şehir/sayfa, "daha fazla yükle" desteği
- **Default Selection**: Varsayılan ülke Türkiye
- **Form Integration**: NewCustomerForm ve NewPersonForm entegrasyonu

## 🏗️ Sistem Mimarisi

### Backend API Endpoints
```
GET /api/geo/countries?query=                    # Ülke listesi (250 limit)
GET /api/geo/countries/{iso2}/cities?query=&limit=50&page=1  # Şehir listesi
```

### Database Schema
```javascript
// countries collection
{
  id: "uuid",
  iso2: "TR",          // ISO 3166-1 alpha-2
  iso3: "TUR",         // ISO 3166-1 alpha-3
  name: "Turkey",      // İngilizce ülke adı
  created_at: Date
}

// cities collection
{
  id: "uuid",
  name: "Istanbul",
  country_iso2: "TR",
  admin1: "Istanbul",   // İl/Eyalet
  lat: 41.0082,
  lng: 28.9784,
  population: 15462452,
  is_capital: false,
  created_at: Date
}
```

### UI Components
```jsx
// Aranabilir ülke seçimi
<CountrySelect
  value={formData.country}        // ISO2 kodu (örn: "TR")
  onChange={handleCountryChange}  // (countryData) => void
  placeholder="Ülke seçiniz"
  required={true}
  className="w-full"
/>

// Ülkeye bağlı şehir seçimi
<CitySelect
  country={formData.country}      // Bağlı olduğu ülke ISO2 kodu
  value={formData.city}          // Şehir adı
  onChange={handleCityChange}    // (cityData) => void
  placeholder="Şehir seçiniz"
  required={true}
  className="w-full"
/>
```

## 🚀 Kurulum & Seed

### 1. Geographic Data Seed
```bash
cd /app/backend
python seed_geo_data.py --reset    # Tüm veriyi temizle ve yeniden seed et
python seed_geo_data.py --update   # Mevcut veriyi güncelle (upsert)
python seed_geo_data.py --countries-only  # Sadece ülkeler
python seed_geo_data.py --cities-only     # Sadece şehirler
```

### 2. Component Usage
```jsx
import CountrySelect from '../geo/CountrySelect';
import CitySelect from '../geo/CitySelect';

// State management
const [selectedCountry, setSelectedCountry] = useState(null);
const [selectedCity, setSelectedCity] = useState(null);
const [formData, setFormData] = useState({
  country: 'TR',  // Default Türkiye
  city: '',
  // ... diğer alanlar
});

// Event handlers
const handleCountryChange = (countryData) => {
  setSelectedCountry(countryData);
  setSelectedCity(null); // City'yi temizle
  setFormData(prev => ({
    ...prev,
    country: countryData?.iso2 || '',
    city: ''
  }));
};

const handleCityChange = (cityData) => {
  setSelectedCity(cityData);
  setFormData(prev => ({
    ...prev,
    city: cityData?.name || ''
  }));
};
```

## 📊 Mevcut Veri Kapsamı

### Ülkeler (74 adet)
- **Major Countries**: TR, US, GB, DE, FR, IT, ES, NL, AE, SA...
- **Regional Coverage**: Europe, Middle East, Asia, Americas, Africa, Oceania
- **ISO Standards**: ISO 3166-1 alpha-2 ve alpha-3 codes

### Şehirler (22+ adet)
- **Turkey** (20 şehir): Istanbul, Ankara, Izmir, Bursa, Antalya, Adana...
- **UAE** (7 şehir): Dubai, Abu Dhabi, Sharjah, Ajman...
- **US** (10 şehir): New York, Los Angeles, Chicago, Houston...
- **Europe**: London, Berlin, Paris, Munich...
- **Expansion Ready**: Daha fazla şehir eklenebilir

## 🔍 Search Özellikleri

### Turkish Character Tolerance
```javascript
// Backend regex patterns
"i" → "[iıİI]"     // i, ı, İ, I
"u" → "[uüUÜ]"     // u, ü, Ü, U
"o" → "[oöOÖ]"     // o, ö, Ö, O
"c" → "[cçCÇ]"     // c, ç, Ç, C
"s" → "[sşSŞ]"     // s, ş, Ş, S  
"g" → "[gğGĞ]"     // g, ğ, Ğ, G
```

### Search Examples
```
"turk"     → Turkey
"turkiye"  → Turkey (partial tolerance)
"united"   → United States, United Kingdom, United Arab Emirates
"ist"      → Istanbul
"ank"      → Ankara
"dub"      → Dubai
```

## 🔄 Bakım & Güncellemeler

### Weekly Sync (Planlı)
```bash
# Haftalık idempotent senkronizasyon
python seed_geo_data.py --update
```

### Manual Data Management
```bash
# Belirli ülke şehirlerini güncelle
python seed_geo_data.py --cities-only

# Tüm veriyi sıfırdan yükle
python seed_geo_data.py --reset
```

### Database Maintenance
```javascript
// MongoDB indexes (otomatik oluşturulur)
db.countries.createIndex({ "iso2": 1 }, { unique: true })
db.countries.createIndex({ "name": 1 })
db.cities.createIndex({ "country_iso2": 1 })
db.cities.createIndex({ "name": 1 })
db.cities.createIndex({ "name": 1, "country_iso2": 1 }, { unique: true })
```

## 🧪 Testing

### Backend API Test
```bash
# Countries API
curl "http://localhost:8001/api/geo/countries?query=turk"

# Cities API  
curl "http://localhost:8001/api/geo/countries/TR/cities?query=ist&limit=5&page=1"
```

### Frontend Component Test
```javascript
// Unit testing
import { render, screen, fireEvent } from '@testing-library/react';
import CountrySelect from '../CountrySelect';

test('should search and select country', async () => {
  render(<CountrySelect onChange={jest.fn()} />);
  const input = screen.getByPlaceholderText('Ülke seçin...');
  fireEvent.change(input, { target: { value: 'turk' } });
  // ... test search results
});
```

## ✅ Kabul Kriterleri

### ✅ Tamamlanan
- [x] Tüm formlar CountrySelect + CitySelect kullanıyor
- [x] Hardcoded country/city arrays kaldırıldı
- [x] "Turk" araması "Türkiye" buluyor
- [x] UAE altında "Dub" araması "Dubai" buluyor  
- [x] Ülke→şehir bağımlılığı çalışıyor
- [x] 300ms debounce implementasyonu
- [x] Loading ve empty state'ler
- [x] Varsayılan ülke Türkiye
- [x] Form validation (ülke/şehir zorunlu)
- [x] Seed script ve migration notları
- [x] Backend API documentation

### 🔄 Gelecek Geliştirmeler
- [ ] "Other" + serbest metin seçeneği küçük bölgeler için
- [ ] Haftalık otomatik senkronizasyon job'u
- [ ] Daha kapsamlı şehir verisi (GeoNames entegrasyonu)
- [ ] Multi-language support (Türkçe şehir adları)
- [ ] Geographic coordinates kullanımı (harita entegrasyonu)

## 🔗 İlgili Dosyalar

### Backend
- `/app/backend/server.py` - API endpoints
- `/app/backend/seed_geo_data.py` - Seed script

### Frontend
- `/app/frontend/src/components/geo/CountrySelect.jsx`
- `/app/frontend/src/components/geo/CitySelect.jsx`
- `/app/frontend/src/components/Customers/NewCustomerForm.jsx`
- `/app/frontend/src/components/Customers/NewPersonForm.jsx`

### Database Collections
- `countries` - ISO ülke verisi (74 ülke)
- `cities` - Şehir verisi (22+ şehir)

---

**🎯 Sonuç**: Merkezi coğrafi sistem production-ready durumda ve tüm kullanıcı gereksinimlerini karşılıyor!