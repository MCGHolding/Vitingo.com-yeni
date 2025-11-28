import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react';

// 10 Profesyonel Kapak Sayfası Şablonları
const COVER_TEMPLATES = [
  {
    id: 'modern_minimal',
    name: 'Modern Minimal',
    preview: 'Temiz çizgiler, büyük başlık, minimal tasarım',
    layout: 'center'
  },
  {
    id: 'professional_classic',
    name: 'Profesyonel Klasik',
    preview: 'Üstte logo, orta kısımda bilgiler, klasik düzen',
    layout: 'top'
  },
  {
    id: 'elegant_sidebar',
    name: 'Zarif Yan Panel',
    preview: 'Soldaki renkli panel, sağda bilgiler',
    layout: 'sidebar'
  },
  {
    id: 'bold_geometric',
    name: 'Cesur Geometrik',
    preview: 'Geometrik şekiller, modern ve dikkat çekici',
    layout: 'geometric'
  },
  {
    id: 'executive_split',
    name: 'Executive Bölünmüş',
    preview: 'İki renkli bölüm, profesyonel ve dengeli',
    layout: 'split'
  },
  {
    id: 'creative_diagonal',
    name: 'Yaratıcı Çapraz',
    preview: 'Çapraz kesim, dinamik ve modern',
    layout: 'diagonal'
  },
  {
    id: 'corporate_header',
    name: 'Kurumsal Başlık',
    preview: 'Renkli üst bant, alt kısımda detaylar',
    layout: 'header'
  },
  {
    id: 'artistic_wave',
    name: 'Sanatsal Dalga',
    preview: 'Dalgalı şekiller, yaratıcı ve akıcı',
    layout: 'wave'
  },
  {
    id: 'tech_gradient',
    name: 'Tech Gradient',
    preview: 'Gradient arka plan, modern tech görünümü',
    layout: 'gradient'
  },
  {
    id: 'luxury_frame',
    name: 'Lüks Çerçeve',
    preview: 'Çerçeveli tasarım, prestijli görünüm',
    layout: 'frame'
  }
];

const CoverPageDesigner = ({ isOpen, onClose, profileData, opportunityData, onSave, userData }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern_minimal');
  const [coverData, setCoverData] = useState({
    companyLogo: '',
    companyName: '',
    proposalTitle: '',
    country: '',
    city: '',
    startDate: '',
    endDate: '',
    venue: '',
    preparedBy: '',
    preparedByTitle: 'Proje Müdürü',
    preparedDate: new Date().toLocaleDateString('tr-TR')
  });
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Auto-fill from profile, opportunity, and user data
  useEffect(() => {
    if (!isOpen) return;
    
    // Start with profile data
    const newData = {
      companyLogo: profileData?.branding?.logo_url || '',
      companyName: profileData?.company_info?.name || '',
      proposalTitle: '',
      country: '',
      city: '',
      startDate: '',
      endDate: '',
      venue: '',
      preparedBy: userData?.name || 'Demo User',
      preparedByTitle: userData?.title || 'Proje Müdürü',
      preparedDate: new Date().toLocaleDateString('tr-TR')
    };

    // Override with opportunity data if available
    if (opportunityData) {
      newData.proposalTitle = opportunityData.fairName || opportunityData.projectName || '';
      newData.country = opportunityData.country || '';
      newData.city = opportunityData.city || '';
      newData.startDate = opportunityData.startDate || opportunityData.eventStartDate || '';
      newData.endDate = opportunityData.endDate || opportunityData.eventEndDate || '';
      newData.venue = opportunityData.venue || opportunityData.fairCenter || '';
      if (opportunityData.assignedTo) {
        newData.preparedBy = opportunityData.assignedTo;
      }
    }

    setCoverData(newData);
  }, [isOpen, profileData, opportunityData, userData]);

  const renderTemplatePreview = (templateId, colors) => {
    const { primary_color, secondary_color, accent_color } = colors;
    
    const templates = {
      modern_minimal: (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 relative">
          {coverData.companyLogo && (
            <img src={coverData.companyLogo} alt="Logo" className="h-16 mb-8 object-contain" />
          )}
          <h1 className="text-4xl font-bold text-center mb-4" style={{ color: primary_color }}>
            {coverData.proposalTitle || 'Teklif Başlığı'}
          </h1>
          <div className="w-24 h-1 mb-6" style={{ backgroundColor: accent_color }}></div>
          <div className="text-center space-y-2 text-gray-600">
            <p className="text-lg">{coverData.companyName}</p>
            <p>{coverData.city}, {coverData.country}</p>
            <p>{coverData.startDate} - {coverData.endDate}</p>
          </div>
          <div className="absolute bottom-8 text-sm text-gray-500">
            <p>{coverData.preparedBy} • {coverData.preparedDate}</p>
          </div>
        </div>
      ),
      
      professional_classic: (
        <div className="w-full h-full bg-white p-8 relative">
          <div className="flex items-center justify-between mb-12" style={{ borderBottom: `3px solid ${primary_color}`, paddingBottom: '1rem' }}>
            {coverData.companyLogo && (
              <img src={coverData.companyLogo} alt="Logo" className="h-12 object-contain" />
            )}
            <div className="text-right">
              <p className="text-sm text-gray-500">{coverData.preparedDate}</p>
            </div>
          </div>
          <div className="mt-16">
            <h1 className="text-5xl font-bold mb-8" style={{ color: primary_color }}>
              {coverData.proposalTitle || 'Teklif Başlığı'}
            </h1>
            <div className="space-y-4 text-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: accent_color }}></div>
                <span className="text-gray-700">{coverData.venue}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: accent_color }}></div>
                <span className="text-gray-700">{coverData.city}, {coverData.country}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: accent_color }}></div>
                <span className="text-gray-700">{coverData.startDate} - {coverData.endDate}</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-8">
            <p className="text-gray-600">{coverData.preparedBy}</p>
            <p className="text-sm text-gray-500">{coverData.preparedByTitle}</p>
          </div>
        </div>
      ),
      
      elegant_sidebar: (
        <div className="w-full h-full flex">
          <div className="w-1/3 p-8 text-white flex flex-col justify-between" style={{ background: `linear-gradient(180deg, ${primary_color} 0%, ${secondary_color} 100%)` }}>
            {coverData.companyLogo && (
              <img src={coverData.companyLogo} alt="Logo" className="h-14 object-contain brightness-0 invert" />
            )}
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase mb-1 opacity-80">Etkinlik</p>
                <p className="font-semibold">{coverData.proposalTitle}</p>
              </div>
              <div>
                <p className="text-xs uppercase mb-1 opacity-80">Lokasyon</p>
                <p className="font-semibold">{coverData.city}</p>
                <p className="text-sm">{coverData.country}</p>
              </div>
              <div>
                <p className="text-xs uppercase mb-1 opacity-80">Tarih</p>
                <p className="font-semibold">{coverData.startDate}</p>
                <p className="text-sm">-</p>
                <p className="font-semibold">{coverData.endDate}</p>
              </div>
            </div>
            <div className="text-xs">
              <p>{coverData.preparedBy}</p>
              <p className="opacity-80">{coverData.preparedDate}</p>
            </div>
          </div>
          <div className="flex-1 bg-white p-8 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 text-gray-800">{coverData.companyName}</h1>
              <p className="text-xl text-gray-600 mb-8">Teklif Sunumu</p>
              <div className="w-32 h-1 mx-auto" style={{ backgroundColor: accent_color }}></div>
            </div>
          </div>
        </div>
      ),

      bold_geometric: (
        <div className="w-full h-full bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: primary_color, transform: 'translate(30%, -30%)' }}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 opacity-10" style={{ backgroundColor: secondary_color, transform: 'translate(-40%, 40%) rotate(45deg)' }}></div>
          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            {coverData.companyLogo && (
              <img src={coverData.companyLogo} alt="Logo" className="h-12 object-contain" />
            )}
            <div>
              <h1 className="text-5xl font-black mb-6" style={{ color: primary_color }}>
                {coverData.proposalTitle}
              </h1>
              <div className="space-y-2 text-lg">
                <p className="font-semibold text-gray-800">{coverData.venue}</p>
                <p className="text-gray-600">{coverData.city}, {coverData.country}</p>
                <p className="text-gray-600">{coverData.startDate} - {coverData.endDate}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-semibold text-gray-800">{coverData.companyName}</p>
                <p className="text-sm text-gray-500">{coverData.preparedBy}</p>
              </div>
              <p className="text-sm text-gray-500">{coverData.preparedDate}</p>
            </div>
          </div>
        </div>
      ),

      executive_split: (
        <div className="w-full h-full flex">
          <div className="w-1/2 p-8 flex flex-col justify-center" style={{ backgroundColor: primary_color }}>
            <div className="text-white">
              {coverData.companyLogo && (
                <img src={coverData.companyLogo} alt="Logo" className="h-16 mb-8 object-contain brightness-0 invert" />
              )}
              <h1 className="text-4xl font-bold mb-4">{coverData.proposalTitle}</h1>
              <div className="w-20 h-1 mb-6" style={{ backgroundColor: accent_color }}></div>
              <p className="text-xl mb-2">{coverData.companyName}</p>
            </div>
          </div>
          <div className="w-1/2 bg-white p-8 flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Etkinlik Merkezi</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.venue}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Lokasyon</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.city}, {coverData.country}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Tarih</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.startDate} - {coverData.endDate}</p>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">{coverData.preparedBy}</p>
                <p className="text-xs text-gray-500">{coverData.preparedByTitle} • {coverData.preparedDate}</p>
              </div>
            </div>
          </div>
        </div>
      ),

      creative_diagonal: (
        <div className="w-full h-full bg-white relative overflow-hidden">
          <div className="absolute inset-0" style={{ 
            background: `linear-gradient(135deg, ${primary_color} 0%, ${primary_color} 40%, white 40%, white 100%)` 
          }}></div>
          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            <div className="text-white">
              {coverData.companyLogo && (
                <img src={coverData.companyLogo} alt="Logo" className="h-14 object-contain brightness-0 invert" />
              )}
            </div>
            <div className="ml-auto w-3/5">
              <h1 className="text-4xl font-bold mb-4 text-gray-800">{coverData.proposalTitle}</h1>
              <div className="w-24 h-1 mb-4" style={{ backgroundColor: accent_color }}></div>
              <div className="space-y-2 text-gray-700">
                <p className="font-semibold">{coverData.venue}</p>
                <p>{coverData.city}, {coverData.country}</p>
                <p>{coverData.startDate} - {coverData.endDate}</p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="font-semibold text-gray-800">{coverData.companyName}</p>
              <p className="text-sm text-gray-600">{coverData.preparedBy}</p>
              <p className="text-xs text-gray-500">{coverData.preparedDate}</p>
            </div>
          </div>
        </div>
      ),

      corporate_header: (
        <div className="w-full h-full flex flex-col">
          <div className="p-6 text-white" style={{ background: `linear-gradient(90deg, ${primary_color} 0%, ${secondary_color} 100%)` }}>
            <div className="flex items-center justify-between">
              {coverData.companyLogo && (
                <img src={coverData.companyLogo} alt="Logo" className="h-10 object-contain brightness-0 invert" />
              )}
              <p className="text-sm">{coverData.preparedDate}</p>
            </div>
          </div>
          <div className="flex-1 bg-white p-8 flex flex-col justify-center">
            <h1 className="text-5xl font-bold mb-8 text-gray-800">{coverData.proposalTitle}</h1>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Şirket</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.companyName}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Etkinlik Merkezi</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.venue}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Lokasyon</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.city}, {coverData.country}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Tarih</p>
                <p className="text-lg font-semibold text-gray-800">{coverData.startDate} - {coverData.endDate}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-gray-700">{coverData.preparedBy} • {coverData.preparedByTitle}</p>
            </div>
          </div>
        </div>
      ),

      artistic_wave: (
        <div className="w-full h-full bg-white relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,30 Q25,20 50,30 T100,30 L100,100 L0,100 Z" fill={primary_color} opacity="0.1"/>
            <path d="M0,50 Q25,40 50,50 T100,50 L100,100 L0,100 Z" fill={secondary_color} opacity="0.1"/>
          </svg>
          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            {coverData.companyLogo && (
              <img src={coverData.companyLogo} alt="Logo" className="h-12 object-contain" />
            )}
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4" style={{ color: primary_color }}>{coverData.proposalTitle}</h1>
              <div className="w-32 h-1 mx-auto mb-6" style={{ backgroundColor: accent_color }}></div>
              <p className="text-xl text-gray-700 mb-2">{coverData.companyName}</p>
              <p className="text-lg text-gray-600">{coverData.venue}</p>
              <p className="text-gray-600">{coverData.city}, {coverData.country}</p>
              <p className="text-gray-600">{coverData.startDate} - {coverData.endDate}</p>
            </div>
            <div className="text-center text-sm text-gray-500">
              <p>{coverData.preparedBy} • {coverData.preparedByTitle}</p>
              <p>{coverData.preparedDate}</p>
            </div>
          </div>
        </div>
      ),

      tech_gradient: (
        <div className="w-full h-full relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, ${primary_color}20 0%, ${secondary_color}20 50%, ${accent_color}20 100%)` 
        }}>
          <div className="absolute inset-0 backdrop-blur-3xl"></div>
          <div className="relative z-10 p-8 h-full flex flex-col justify-center items-center text-center">
            {coverData.companyLogo && (
              <img src={coverData.companyLogo} alt="Logo" className="h-16 mb-8 object-contain" />
            )}
            <h1 className="text-5xl font-black mb-6 text-gray-800">{coverData.proposalTitle}</h1>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primary_color }}></div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: secondary_color }}></div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent_color }}></div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-md">
              <p className="text-xl font-semibold text-gray-800 mb-4">{coverData.companyName}</p>
              <div className="space-y-2 text-gray-700">
                <p>{coverData.venue}</p>
                <p>{coverData.city}, {coverData.country}</p>
                <p>{coverData.startDate} - {coverData.endDate}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600">{coverData.preparedBy}</p>
                <p className="text-xs text-gray-500">{coverData.preparedDate}</p>
              </div>
            </div>
          </div>
        </div>
      ),

      luxury_frame: (
        <div className="w-full h-full bg-white p-4 relative">
          <div className="w-full h-full border-4 p-6 flex flex-col justify-between" style={{ borderColor: primary_color }}>
            <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8" style={{ borderColor: accent_color }}></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8" style={{ borderColor: accent_color }}></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8" style={{ borderColor: accent_color }}></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8" style={{ borderColor: accent_color }}></div>
            
            <div className="text-center mt-8">
              {coverData.companyLogo && (
                <img src={coverData.companyLogo} alt="Logo" className="h-14 mx-auto mb-6 object-contain" />
              )}
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Teklif Sunumu</p>
              <h1 className="text-4xl font-serif font-bold mb-2" style={{ color: primary_color }}>
                {coverData.proposalTitle}
              </h1>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-xl font-semibold text-gray-800">{coverData.companyName}</p>
              <div className="w-24 h-px mx-auto" style={{ backgroundColor: accent_color }}></div>
              <p className="text-gray-700">{coverData.venue}</p>
              <p className="text-gray-600">{coverData.city}, {coverData.country}</p>
              <p className="text-gray-600">{coverData.startDate} - {coverData.endDate}</p>
            </div>
            
            <div className="text-center text-sm text-gray-500 mb-8">
              <p>{coverData.preparedBy} • {coverData.preparedByTitle}</p>
              <p>{coverData.preparedDate}</p>
            </div>
          </div>
        </div>
      )
    };

    return templates[templateId] || templates.modern_minimal;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">AI Kapak Sayfası Tasarımcısı</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Template List */}
            <div className="col-span-3 space-y-2">
              <h3 className="font-semibold text-gray-700 mb-3">Şablon Seç</h3>
              {COVER_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    {selectedTemplate === template.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{template.preview}</p>
                </button>
              ))}
            </div>

            {/* Middle: Preview */}
            <div className="col-span-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Önizleme</h3>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">A4 Portre</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '210/297' }}>
                {renderTemplatePreview(selectedTemplate, profileData?.branding || { 
                  primary_color: '#1a73e8', 
                  secondary_color: '#34a853', 
                  accent_color: '#fbbc04' 
                })}
              </div>
            </div>

            {/* Right: Edit Fields */}
            <div className="col-span-3 space-y-3">
              <h3 className="font-semibold text-gray-700 mb-3">Bilgileri Düzenle</h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teklif Konusu</label>
                <input
                  type="text"
                  value={coverData.proposalTitle}
                  onChange={(e) => setCoverData(prev => ({ ...prev, proposalTitle: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Etkinlik Merkezi</label>
                <input
                  type="text"
                  value={coverData.venue}
                  onChange={(e) => setCoverData(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={coverData.city}
                    onChange={(e) => setCoverData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ülke</label>
                  <input
                    type="text"
                    value={coverData.country}
                    onChange={(e) => setCoverData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç</label>
                  <input
                    type="text"
                    value={coverData.startDate}
                    onChange={(e) => setCoverData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş</label>
                  <input
                    type="text"
                    value={coverData.endDate}
                    onChange={(e) => setCoverData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hazırlayan</label>
                <input
                  type="text"
                  value={coverData.preparedBy}
                  onChange={(e) => setCoverData(prev => ({ ...prev, preparedBy: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Görev</label>
                <input
                  type="text"
                  value={coverData.preparedByTitle}
                  onChange={(e) => setCoverData(prev => ({ ...prev, preparedByTitle: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={() => {
              onSave({ template: selectedTemplate, data: coverData });
              onClose();
            }}
            className="px-6 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition font-medium"
          >
            Kaydet ve Kullan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverPageDesigner;
