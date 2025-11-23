import React from 'react';
import { X, FileText, CheckCircle, XCircle } from 'lucide-react';

const ViewTemplateModal = ({ template, onClose }) => {
  if (!template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
              <p className="text-sm text-gray-600">{template.description || 'Açıklama yok'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Oluşturma Yöntemi</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{template.creation_method}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Dosya Tipi</p>
              <p className="text-sm font-medium text-gray-900 uppercase">
                {template.original_file?.file_type || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Oluşturulma Tarihi</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(template.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Alan Sayısı</p>
              <p className="text-sm font-medium text-gray-900">{template.fields?.length || 0} alan</p>
            </div>
          </div>

          {/* Fields List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Şablon Alanları</h3>
            {template.fields && template.fields.length > 0 ? (
              <div className="space-y-3">
                {template.fields
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((field) => (
                    <div key={field.field_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{field.field_name}</h4>
                            {field.is_required ? (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Zorunlu</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Opsiyonel</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Anahtar:</span> {field.field_key}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Tip:</span>{' '}
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {field.field_type}
                              </span>
                            </p>
                            {field.dropdown_options && field.dropdown_options.length > 0 && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Seçenekler:</span>{' '}
                                {field.dropdown_options.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {field.is_required ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Bu şablonda henüz alan tanımlanmamış</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTemplateModal;
