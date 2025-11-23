import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, projectName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8" />
              <h2 className="text-xl font-bold">Projeyi Sil</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-red-700 p-2 rounded-full transition-colors"
              disabled={loading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-lg mb-4">
            <strong>"{projectName}"</strong> projesini silmek istediğinizden emin misiniz?
          </p>
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Bu işlem geri alınamaz!
            </p>
            <p className="text-red-700 text-sm mt-1">
              Proje ve ilgili tüm veriler kalıcı olarak silinecektir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Siliniyor...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Evet, Sil</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
