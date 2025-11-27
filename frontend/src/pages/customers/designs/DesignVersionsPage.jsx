import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload, Download, Share2, Trash2, ChevronDown, ChevronUp,
  FileText, Image, Mail, MessageSquare, CheckCircle, X, AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DesignVersionsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState(null);
  
  // New version form state
  const [versionName, setVersionName] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareVersion, setShareVersion] = useState(null);
  const [shareChannel, setShareChannel] = useState('email');
  const [shareRecipient, setShareRecipient] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  // Fetch customer data
  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  // Fetch design versions
  useEffect(() => {
    if (customer) {
      fetchVersions();
    }
  }, [customer]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers/${customerId}`);
      if (!response.ok) throw new Error('Müşteri bulunamadı');
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Müşteri yüklenemedi');
    }
  };

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/customers/${customerId}/designs`);
      if (!response.ok) throw new Error('Versiyonlar yüklenemedi');
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  // File upload with react-dropzone
  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    
    const uploadPromises = acceptedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(
          `${API_URL}/api/customers/${customerId}/designs/upload-file`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Dosya yüklenemedi');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`${file.name} yüklenemedi: ${error.message}`);
        return null;
      }
    });
    
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r !== null);
    
    setUploadedFiles(prev => [...prev, ...successfulUploads]);
    setUploading(false);
  }, [customerId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
      'application/pdf': ['.pdf'],
      'application/postscript': ['.ai'],
      'image/vnd.adobe.photoshop': ['.psd']
    }
  });

  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateVersion = async () => {
    if (!versionName.trim()) {
      alert('Lütfen versiyon adı girin');
      return;
    }
    
    if (uploadedFiles.length === 0) {
      alert('Lütfen en az bir dosya yükleyin');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/customers/${customerId}/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          versionName,
          files: uploadedFiles,
          notes
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Versiyon oluşturulamadı');
      }
      
      // Reset form
      setVersionName('');
      setNotes('');
      setUploadedFiles([]);
      
      // Refresh versions list
      await fetchVersions();
      
      alert('Tasarım versiyonu başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Error creating version:', error);
      alert(error.message);
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!window.confirm('Bu versiyonu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/api/customers/${customerId}/designs/${versionId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) throw new Error('Versiyon silinemedi');
      
      await fetchVersions();
      alert('Versiyon silindi');
    } catch (error) {
      console.error('Error deleting version:', error);
      alert(error.message);
    }
  };

  const openShareModal = (version) => {
    setShareVersion(version);
    setShareChannel('email');
    setShareRecipient(customer?.email || '');
    setShareMessage(`Merhaba,\n\n${version.versionName} tasarım versiyonunu sizinle paylaşıyoruz.\n\nİyi günler.`);
    setShareModalOpen(true);
  };

  const handleShare = async () => {
    if (!shareRecipient.trim()) {
      alert('Lütfen alıcı bilgisi girin');
      return;
    }
    
    setSharing(true);
    
    try {
      const response = await fetch(
        `${API_URL}/api/customers/${customerId}/designs/${shareVersion.id}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: shareChannel,
            recipient: shareRecipient,
            message: shareMessage
          })
        }
      );
      
      if (!response.ok) throw new Error('Paylaşım başarısız');
      
      setShareModalOpen(false);
      await fetchVersions();
      alert(`Tasarım ${shareChannel === 'email' ? 'e-posta' : 'WhatsApp'} ile paylaşıldı!`);
    } catch (error) {
      console.error('Error sharing:', error);
      alert(error.message);
    } finally {
      setSharing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  if (loading && !customer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate(`/customers/${customerId}`)}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Müşteri Sayfasına Dön
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tasarım Versiyon Yönetimi
          </h1>
          <p className="text-gray-600">
            {customer?.companyName || 'Müşteri'} - Tasarım Dosyaları
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Yeni Versiyon Oluştur</h2>
            
            {/* Version Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versiyon Adı *
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="ör: İlk Tasarım, Revize 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Versiyon hakkında notlar..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosyalar *
              </label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                {uploading ? (
                  <p className="text-sm text-gray-600">Yükleniyor...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Dosyaları sürükleyin veya tıklayın
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, PDF, AI, PSD
                    </p>
                  </>
                )}
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.filename)}
                        <span className="text-sm text-gray-700 truncate">
                          {file.filename}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeUploadedFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateVersion}
              disabled={uploading || !versionName.trim() || uploadedFiles.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Versiyon Oluştur
            </button>
          </div>
        </div>

        {/* Right: Versions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tüm Versiyonlar</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Henüz tasarım versiyonu oluşturulmamış</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Version Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {version.versionName}
                          </h3>
                          {version.isLatest && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Son Versiyon
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            v{version.versionNumber}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(version.createdAt)}
                        </p>
                        {version.notes && (
                          <p className="text-sm text-gray-600 mt-2">{version.notes}</p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openShareModal(version)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Paylaş"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setExpandedVersion(
                            expandedVersion === version.id ? null : version.id
                          )}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                          title="Detaylar"
                        >
                          {expandedVersion === version.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(version.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Files Summary */}
                    <div className="text-sm text-gray-600 mb-2">
                      {version.files.length} dosya • {' '}
                      {formatFileSize(
                        version.files.reduce((sum, f) => sum + f.size, 0)
                      )}
                    </div>

                    {/* Expanded Details */}
                    {expandedVersion === version.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Files */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Dosyalar
                          </h4>
                          <div className="space-y-2">
                            {version.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getFileIcon(file.filename)}
                                  <span className="text-sm text-gray-700 truncate">
                                    {file.filename}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </span>
                                </div>
                                <a
                                  href={`${API_URL}${file.url}`}
                                  download
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="İndir"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Share History */}
                        {version.shares && version.shares.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Paylaşım Geçmişi
                            </h4>
                            <div className="space-y-2">
                              {version.shares.map((share, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 text-sm bg-gray-50 p-2 rounded"
                                >
                                  {share.channel === 'email' ? (
                                    <Mail className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <MessageSquare className="w-4 h-4 text-green-500" />
                                  )}
                                  <span className="text-gray-700">{share.recipient}</span>
                                  <span className="text-gray-500 text-xs">
                                    {formatDate(share.sentAt)}
                                  </span>
                                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Tasarımı Paylaş</h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paylaşım Kanalı
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShareChannel('email')}
                    className={`flex-1 py-2 px-4 rounded-md border-2 transition-colors ${
                      shareChannel === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Mail className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">E-posta</span>
                  </button>
                  <button
                    onClick={() => setShareChannel('whatsapp')}
                    className={`flex-1 py-2 px-4 rounded-md border-2 transition-colors ${
                      shareChannel === 'whatsapp'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {shareChannel === 'email' ? 'E-posta Adresi' : 'Telefon Numarası'}
                </label>
                <input
                  type="text"
                  value={shareRecipient}
                  onChange={(e) => setShareRecipient(e.target.value)}
                  placeholder={
                    shareChannel === 'email'
                      ? 'ornek@sirket.com'
                      : '+90 555 123 4567'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesaj
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  {sharing ? 'Gönderiliyor...' : 'Paylaş'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
