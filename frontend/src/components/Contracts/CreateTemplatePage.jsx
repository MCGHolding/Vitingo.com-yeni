import React from 'react';
import { ArrowLeft } from 'lucide-react';

const CreateTemplatePage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Geri
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Şablon Oluştur</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        <h2 className="text-xl font-semibold mb-4">Şablon Oluşturma - Yakında</h2>
        <p className="text-gray-600">Bu özellik yakında eklenecek...</p>
      </div>
    </div>
  );
};

export default CreateTemplatePage;