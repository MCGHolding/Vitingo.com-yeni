import React from 'react';
import { X, Calendar, DollarSign, MapPin, User, FileText, Hash } from 'lucide-react';

const ViewProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return 'Belirtilmemiş';
    return `${amount.toLocaleString()} ${currency || 'TRY'}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {project.projectNumber && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    {project.projectNumber}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'yeni' ? 'bg-purple-500/30' :
                  project.status === 'ongoing' ? 'bg-blue-500/30' :
                  project.status === 'completed' ? 'bg-green-500/30' :
                  'bg-red-500/30'
                }`}>
                  {project.status === 'yeni' ? 'Yeni' :
                   project.status === 'ongoing' ? 'Devam Ediyor' :
                   project.status === 'completed' ? 'Tamamlandı' :
                   'İptal Edildi'}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Temel Bilgiler */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Temel Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Müşteri</label>
                <p className="text-gray-900 font-medium">{project.customerName || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Fuar</label>
                <p className="text-gray-900 font-medium">{project.fairName || 'Belirtilmemiş'}</p>
              </div>
              {project.createdByName && (
                <div>
                  <label className="text-sm text-gray-600">Oluşturan</label>
                  <p className="text-gray-900 font-medium flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-500" />
                    {project.createdByName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lokasyon Bilgileri */}
          {(project.city || project.country) && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Lokasyon
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.city && (
                  <div>
                    <label className="text-sm text-gray-600">Şehir</label>
                    <p className="text-gray-900 font-medium">{project.city}</p>
                  </div>
                )}
                {project.country && (
                  <div>
                    <label className="text-sm text-gray-600">Ülke</label>
                    <p className="text-gray-900 font-medium">{project.country}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tarih Bilgileri */}
          {(project.fairStartDate || project.fairEndDate || project.contractDate) && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Tarihler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.contractDate && (
                  <div>
                    <label className="text-sm text-gray-600">Sözleşme Tarihi</label>
                    <p className="text-gray-900 font-medium">{formatDate(project.contractDate)}</p>
                  </div>
                )}
                {project.fairStartDate && (
                  <div>
                    <label className="text-sm text-gray-600">Fuar Başlangıç</label>
                    <p className="text-gray-900 font-medium">{formatDate(project.fairStartDate)}</p>
                  </div>
                )}
                {project.fairEndDate && (
                  <div>
                    <label className="text-sm text-gray-600">Fuar Bitiş</label>
                    <p className="text-gray-900 font-medium">{formatDate(project.fairEndDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finansal Bilgiler */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Finansal Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Sözleşme Tutarı</label>
                <p className="text-gray-900 font-medium text-lg">
                  {formatCurrency(project.contractAmount, project.currency)}
                </p>
              </div>
            </div>

            {/* Payment Terms */}
            {project.paymentTerms && project.paymentTerms.length > 0 && (
              <div className="mt-4">
                <label className="text-sm text-gray-600 block mb-2">Ödeme Koşulları</label>
                <div className="space-y-2">
                  {project.paymentTerms.map((term, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="text-gray-900 font-medium">%{term.percentage}</span>
                        <span className="text-gray-600 ml-2">
                          ({formatCurrency(term.amount, project.currency)})
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {term.dueType === 'pesin' ? 'Peşin' :
                         term.dueType === 'kurulum' ? 'Kurulum' :
                         term.dueType === 'takip' ? `${term.dueDays} gün sonra` :
                         term.dueType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notlar */}
          {project.notes && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProjectModal;
