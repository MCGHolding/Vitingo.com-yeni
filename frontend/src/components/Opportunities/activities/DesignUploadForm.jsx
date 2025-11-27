import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { 
  Upload, 
  Image,
  FileText,
  Download,
  Eye,
  Save,
  X,
  Plus,
  Trash2,
  Star,
  Clock,
  User,
  Tag,
  FolderOpen
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

const EXISTING_VERSIONS = [
  {
    id: '1',
    version: 'V1.0',
    title: 'İlk Tasarım Taslağı',
    description: 'Müşterinin istekleri doğrultusunda hazırlanan ilk konsept tasarım',
    files: [
      { name: 'stand_tasarim_v1_1.jpg', type: 'image', size: '2.3 MB' },
      { name: 'stand_tasarim_v1_2.jpg', type: 'image', size: '1.8 MB' },
      { name: 'teknik_cizim_v1.pdf', type: 'pdf', size: '890 KB' }
    ],
    created_at: '2024-10-05T14:30:00Z',
    created_by: 'Murat Bucak',
    is_approved: false,
    is_current: false
  },
  {
    id: '2',
    version: 'V1.1',
    title: 'Revize Tasarım',
    description: 'Müşteri geribildirimleri doğrultusunda güncellenen tasarım',
    files: [
      { name: 'stand_tasarim_v1_1_rev.jpg', type: 'image', size: '2.5 MB' },
      { name: 'malzeme_listesi_v1_1.pdf', type: 'pdf', size: '450 KB' }
    ],
    created_at: '2024-10-07T10:15:00Z',
    created_by: 'Murat Bucak',
    is_approved: true,
    is_current: true
  }
];

export default function DesignUploadForm({ opportunityId, opportunityTitle, onSave, onCancel }) {
  const { toast } = useToast();
  const [versions, setVersions] = useState(EXISTING_VERSIONS);
  const [newVersion, setNewVersion] = useState({
    title: '',
    description: '',
    files: []
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const getNextVersion = () => {
    if (versions.length === 0) return 'V1.0';
    
    const lastVersion = versions[versions.length - 1].version;
    const match = lastVersion.match(/V(\d+)\.(\d+)/);
    
    if (match) {
      const major = parseInt(match[1]);
      const minor = parseInt(match[2]);
      return `V${major}.${minor + 1}`;
    }
    
    return 'V1.0';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleInputChange = (field, value) => {
    setNewVersion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (fileList) => {
    const processedFiles = fileList.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type === 'application/pdf' ? 'pdf' : 'file',
      size: formatFileSize(file.size),
      file: file
    }));

    setNewVersion(prev => ({
      ...prev,
      files: [...prev.files, ...processedFiles]
    }));
  };

  const removeFile = (fileId) => {
    setNewVersion(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  const handleSave = async () => {
    if (!newVersion.title.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tasarım başlığı girin",
        variant: "destructive"
      });
      return;
    }

    if (newVersion.files.length === 0) {
      toast({
        title: "Eksik Dosya",
        description: "Lütfen en az bir dosya yükleyin",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const designVersion = {
        type: 'design_upload',
        opportunity_id: opportunityId,
        data: {
          ...newVersion,
          version: getNextVersion(),
          created_at: new Date().toISOString(),
          created_by: 'Murat Bucak',
          is_approved: false,
          is_current: true
        },
        created_at: new Date().toISOString(),
        id: Date.now().toString()
      };

      toast({
        title: "Başarılı",
        description: `Tasarım ${getNextVersion()} başarıyla yüklendi`,
      });

      onSave(designVersion);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tasarım yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Info */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Upload className="h-8 w-8 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900">Tasarım Versiyonu Yükle</h3>
              <p className="text-sm text-orange-700">Yeni tasarım versiyonları yükleyin ve yönetin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Existing Versions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Mevcut Versiyonlar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className={`p-4 border-2 rounded-lg ${
                      version.is_current 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          version.is_current
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}>
                          {version.version}
                        </div>
                        {version.is_approved && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-xs font-medium">Onaylandı</span>
                          </div>
                        )}
                        {version.is_current && (
                          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            Güncel
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">{version.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{version.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      {version.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center space-x-2">
                            {file.type === 'image' ? (
                              <Image className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">({file.size})</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                              onClick={() => {
                                setPreviewFile({ ...file, url: `https://via.placeholder.com/800x600?text=${file.name}` });
                                setShowPreview(true);
                              }}
                            >
                              <Eye className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-green-100">
                              <Download className="h-3 w-3 text-green-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3" />
                        <span>{version.created_by}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(version.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - New Version Upload */}
        <div className="space-y-4">
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2 text-orange-900">
                <Plus className="h-5 w-5" />
                <span>Yeni Versiyon: {getNextVersion()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Versiyon Başlığı
                </label>
                <Input
                  value={newVersion.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="örn: Müşteri Revizesi, Final Tasarım..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Açıklama
                </label>
                <Textarea
                  value={newVersion.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Bu versiyonda yapılan değişiklikler ve önemli notlar..."
                  className="min-h-[80px]"
                />
              </div>

              {/* File Upload Area */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Dosyalar
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Dosyaları buraya sürükleyin
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    veya bilgisayarınızdan seçin
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-upload').click()}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dosya Seç
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    JPG, PNG, PDF dosyaları desteklenir (Maks. 10MB)
                  </p>
                </div>
              </div>

              {/* Uploaded Files */}
              {newVersion.files.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Yüklenen Dosyalar ({newVersion.files.length})
                  </label>
                  {newVersion.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                      <div className="flex items-center space-x-2">
                        {file.type === 'image' ? (
                          <Image className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">({file.size})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewFile(file);
                            setShowPreview(true);
                          }}
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
          className="px-6"
        >
          <X className="h-4 w-4 mr-2" />
          İptal
        </Button>
        <Button
          onClick={handleSave}
          disabled={uploading || !newVersion.title.trim() || newVersion.files.length === 0}
          className="bg-orange-600 hover:bg-orange-700 px-6"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Yükleniyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Versiyon Kaydet
            </>
          )}
        </Button>
      </div>

      {/* Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{previewFile.name}</h3>
                  <p className="text-xs text-gray-500">{previewFile.size}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowPreview(false);
                  setPreviewFile(null);
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-100px)] bg-gray-100 flex items-center justify-center">
              {previewFile.type === 'image' ? (
                <img 
                  src={previewFile.url || (previewFile.file ? URL.createObjectURL(previewFile.file) : '')} 
                  alt={previewFile.name}
                  className="max-w-full max-h-full rounded shadow-lg"
                />
              ) : previewFile.type === 'pdf' ? (
                <div className="w-full h-[600px] bg-white rounded shadow-lg">
                  <iframe 
                    src={previewFile.url || (previewFile.file ? URL.createObjectURL(previewFile.file) : '')}
                    className="w-full h-full"
                    title={previewFile.name}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Bu dosya türü için önizleme desteklenmiyor</p>
                  <p className="text-sm text-gray-500 mt-2">{previewFile.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}