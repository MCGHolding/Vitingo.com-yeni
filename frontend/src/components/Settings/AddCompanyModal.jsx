import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const COUNTRIES = [
  'Ülke Seçin',
  'ABD',
  'Afganistan',
  'Almanya',
  'Amerika Birleşik Devletleri',
  'Andorra',
  'Angola',
  'Antigua ve Barbuda',
  'Arjantin',
  'Arnavutluk',
  'Avustralya',
  'Avusturya',
  'Azerbaycan',
  'Bahama',
  'Bahreyn',
  'Bangladeş',
  'Barbados',
  'Belçika',
  'Belize',
  'Benin',
  'Beyaz Rusya',
  'Birleşik Arap Emirlikleri',
  'Birleşik Krallık',
  'Bolivya',
  'Bosna-Hersek',
  'Botsvana',
  'Brezilya',
  'Brunei',
  'Bulgaristan',
  'Burkina Faso',
  'Burundi',
  'Çad',
  'Çek Cumhuriyeti',
  'Çin',
  'Danimarka',
  'Doğu Timor',
  'Dominik',
  'Dominik Cumhuriyeti',
  'Ekvador',
  'Ekvator Ginesi',
  'El Salvador',
  'Endonezya',
  'Eritre',
  'Ermenistan',
  'Estonya',
  'Etiyopya',
  'Fas',
  'Fiji',
  'Fildişi Sahili',
  'Filipinler',
  'Filistin',
  'Finlandiya',
  'Fransa',
  'Gabon',
  'Gambiya',
  'Gana',
  'Gine',
  'Gine-Bissau',
  'Granada',
  'Grönland',
  'Guatemala',
  'Guyana',
  'Güney Afrika',
  'Güney Kore',
  'Güney Sudan',
  'Gürcistan',
  'Haiti',
  'Hırvatistan',
  'Hindistan',
  'Hollanda',
  'Honduras',
  'Irak',
  'İran',
  'İrlanda',
  'İspanya',
  'İsrail',
  'İsveç',
  'İsviçre',
  'İtalya',
  'İzlanda',
  'Jamaika',
  'Japonya',
  'Kamboçya',
  'Kamerun',
  'Kanada',
  'Karadağ',
  'Katar',
  'Kazakistan',
  'Kenya',
  'Kıbrıs',
  'Kırgızistan',
  'Kiribati',
  'Kolombiya',
  'Komorlar',
  'Kongo',
  'Kongo Demokratik Cumhuriyeti',
  'Kosova',
  'Kosta Rika',
  'Kuveyt',
  'Kuzey Kore',
  'Kuzey Makedonya',
  'Küba',
  'Laos',
  'Lesotho',
  'Letonya',
  'Liberya',
  'Libya',
  'Lihtenştayn',
  'Litvanya',
  'Lübnan',
  'Lüksemburg',
  'Macaristan',
  'Madagaskar',
  'Malavi',
  'Maldivler',
  'Malezya',
  'Mali',
  'Malta',
  'Marshall Adaları',
  'Mauritius',
  'Meksika',
  'Mısır',
  'Mikronezya',
  'Moğolistan',
  'Moldova',
  'Monako',
  'Mozambik',
  'Myanmar',
  'Namibya',
  'Nauru',
  'Nepal',
  'Nijer',
  'Nijerya',
  'Nikaragua',
  'Norveç',
  'Orta Afrika Cumhuriyeti',
  'Özbekistan',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua Yeni Gine',
  'Paraguay',
  'Peru',
  'Polonya',
  'Portekiz',
  'Romanya',
  'Ruanda',
  'Rusya',
  'Saint Kitts ve Nevis',
  'Saint Lucia',
  'Saint Vincent ve Grenadinler',
  'Samoa',
  'San Marino',
  'São Tomé ve Príncipe',
  'Senegal',
  'Seyşeller',
  'Sırbistan',
  'Sierra Leone',
  'Singapur',
  'Slovakya',
  'Slovenya',
  'Solomon Adaları',
  'Somali',
  'Sri Lanka',
  'Sudan',
  'Surinam',
  'Suriye',
  'Suudi Arabistan',
  'Svaziland',
  'Şili',
  'Tacikistan',
  'Tanzanya',
  'Tayland',
  'Tayvan',
  'Togo',
  'Tonga',
  'Trinidad ve Tobago',
  'Tunus',
  'Tuvalu',
  'Türkiye',
  'Türkmenistan',
  'Uganda',
  'Ukrayna',
  'Umman',
  'Uruguay',
  'Ürdün',
  'Vanuatu',
  'Vatikan',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Yeni Zelanda',
  'Yunanistan',
  'Zambiya',
  'Zimbabve'
];

const AddCompanyModal = ({ isOpen, onClose, onSave, editingCompany }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: 'Ülke Seçin'
  });

  useEffect(() => {
    if (editingCompany) {
      setFormData({
        name: editingCompany.name,
        country: editingCompany.country || 'Ülke Seçin'
      });
    } else {
      setFormData({
        name: '',
        country: 'Ülke Seçin'
      });
    }
  }, [editingCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Şirket adı zorunludur",
        variant: "destructive"
      });
      return;
    }

    if (formData.country === 'Ülke Seçin') {
      toast({
        title: "Eksik Bilgi",
        description: "Ülke seçimi zorunludur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const url = editingCompany 
        ? `${backendUrl}/api/group-companies/${editingCompany.id}`
        : `${backendUrl}/api/group-companies`;
      
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('İşlem başarısız');

      toast({
        title: "Başarılı",
        description: editingCompany ? "Şirket güncellendi" : "Şirket eklendi"
      });

      onSave();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Hata",
        description: "Şirket kaydedilirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingCompany ? 'Grup Şirketi Düzenle' : 'Grup Şirketi Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şirket Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: ABC Ltd. Şti."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ülke <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                <span>{editingCompany ? 'Güncelle' : 'Ekle'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCompanyModal;
