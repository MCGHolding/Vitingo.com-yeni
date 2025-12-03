import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';

const AdvanceFinanceApprovalPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleBack = () => {
    navigate(`/${tenantSlug}/avanslar`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Finans Onayı</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Finans Onay Bekleyen Avanslar</h2>
          <p className="text-gray-600 mb-4">
            Finans departmanı onayı bekleyen avans talepleri burada listelenecek.
          </p>
          <p className="text-sm text-gray-500">
            Onay/Red işlemleri, açıklama ekleme ve belge görüntüleme özellikleri olacak.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvanceFinanceApprovalPage;
