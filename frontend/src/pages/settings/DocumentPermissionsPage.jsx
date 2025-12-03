import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DocumentPermissionsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(`/${tenantSlug}/ayarlar`)} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Belge Erişim Yetkileri</h1>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">🚧 Bu servis yakında hizmetinizde</p>
      </div>
    </div>
  );
};

export default DocumentPermissionsPage;
