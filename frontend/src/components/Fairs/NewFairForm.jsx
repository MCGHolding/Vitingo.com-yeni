import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  MapPin,
  Calendar,
  Building2,
  Globe,
  Plus,
  Save
} from 'lucide-react';

// New Sector Modal Component
const NewSectorModal = ({ isOpen, onClose, onSave }) => {
  const [newSectorName, setNewSectorName] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!newSectorName.trim()) {
      toast({
        title: "Hata",
        description: "Sektör adı boş olamaz.",
        variant: "destructive"
      });
      return;
    }

    onSave(newSectorName.trim());
    setNewSectorName('');
    onClose();
    
    toast({
      title: "Başarılı",
      description: `"${newSectorName}" sektörü eklendi.`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Yeni Sektör Ekle</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Sektör Adı
            </label>
            <Input
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              placeholder="Örn: Yapay Zeka, Blockchain, Yeşil Enerji..."
              className="w-full"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Ekle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NewFairForm({ onClose, onSave }) {
  const { toast } = useToast();
  const [showNewSectorModal, setShowNewSectorModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    sector: '',
    cycle: ''
  });

  // Default sectors list
  const [sectors, setSectors] = useState([
    'Teknoloji',
    'Otomotiv',
    'Gıda ve İçecek',
    'Tekstil ve Moda',
    'Sağlık ve Tıp',
    'İnşaat ve Mimarlık',
    'Eğitim',
    'Turizm ve Otelcilik',
    'Tarım ve Hayvancılık',
    'Makine ve Sanayi',
    'Enerji',
    'Çevre ve Geri Dönüşüm',
    'Güvenlik',
    'Elektronik',
    'Kimya',
    'Mobilya',
    'Spor ve Rekreasyon',
    'Sanat ve Kültür'
  ]);

  const cycles = [
    { value: '6_months', label: '6 ayda 1' },
    { value: 'yearly', label: 'Her sene' },
    { value: '2_years', label: '2 senede bir' },
    { value: '3_years', label: '3 senede bir' }
  ];

  const countries = [
    'Türkiye',
    'Almanya',
    'Fransa',
    'İtalya',
    'İspanya',
    'İngiltere',
    'ABD',
    'Kanada',
    'Japonya',
    'Güney Kore',
    'Çin',
    'Singapur',
    'BAE',
    'Suudi Arabistan'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addNewSector = (sectorName) => {
    setSectors(prev => [...prev, sectorName]);
    setFormData(prev => ({
      ...prev,
      sector: sectorName
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.city || !formData.country || 
        !formData.startDate || !formData.endDate || !formData.sector || !formData.cycle) {
      toast({
        title: "Eksik Bilgiler",
        description: "Lütfen tüm zorunlu alanları doldurunuz.",
        variant: "destructive"
      });
      return;
    }

    // Date validation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      toast({
        title: "Tarih Hatası",
        description: "Bitiş tarihi, başlangıç tarihinden sonra olmalıdır.",
        variant: "destructive"
      });
      return;
    }

    // Create fair object
    const fairData = {
      ...formData,
      id: Date.now(),
      status: 'active',
      organizer: 'Vitingo Events',
      participants: 0,
      budget: 0,
      revenue: 0,
      description: `${formData.sector} sektörü fuarı`,
      createdDate: new Date().toISOString().split('T')[0]
    };

    onSave(fairData);
    
    toast({
      title: "Başarılı",
      description: `"${formData.name}" fuarı başarıyla oluşturuldu.`,
    });
    
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
          <Card className="border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center space-x-3">
                  <MapPin className="h-7 w-7" />
                  <span>Yeni Fuar Oluştur</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Fuar Bilgileri</h3>
                  </div>

                  {/* Fair Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Fuar Adı *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Örn: Teknoloji Fuarı 2025"
                      className="h-12"
                    />
                  </div>

                  {/* Location Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Şehir *
                      </label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Örn: İstanbul"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Ülke *
                      </label>
                      <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Ülke seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Date Information */}
                <div className="space-y-6 border-t pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Fuar Tarihleri</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Başlangıç Tarihi *
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Bitiş Tarihi *
                      </label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Sector and Cycle */}
                <div className="space-y-6 border-t pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Globe className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Kategori Bilgileri</h3>
                  </div>

                  {/* Sector with Add Button */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Sektör *
                    </label>
                    <div className="flex space-x-2">
                      <Select 
                        value={formData.sector} 
                        onValueChange={(value) => handleInputChange('sector', value)}
                      >
                        <SelectTrigger className="h-12 flex-1">
                          <SelectValue placeholder="Sektör seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>
                              {sector}
                            </SelectItem>
                          ))}
                          <div className="border-t my-2">
                            <button
                              type="button"
                              onClick={() => setShowNewSectorModal(true)}
                              className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-blue-600"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Yeni Sektör Ekle</span>
                            </button>
                          </div>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewSectorModal(true)}
                        className="h-12 px-4"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cycle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Döngü *
                    </label>
                    <Select value={formData.cycle} onValueChange={(value) => handleInputChange('cycle', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Fuar döngüsünü seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {cycles.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="px-8 py-3"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Fuarı Kaydet
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Sector Modal */}
      <NewSectorModal
        isOpen={showNewSectorModal}
        onClose={() => setShowNewSectorModal(false)}
        onSave={addNewSector}
      />
    </>
  );
}