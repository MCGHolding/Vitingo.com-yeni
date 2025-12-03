import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
// TODO: Import advance management component when fixed

const AdvanceListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();

  const handleBack = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleNewAdvance = () => {
    navigate(`/${tenantSlug}/avanslar/yeni`);
  };

  const handleFinanceApproval = () => {
    navigate(`/${tenantSlug}/avanslar/finans-onayi`);
  };

  const handleClosed = () => {
    navigate(`/${tenantSlug}/avanslar/kapanmis`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avanslar</h1>
          <p className="text-gray-600 mt-1">Avans talepleri ve onayları</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleFinanceApproval}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Finans Onayı
          </button>
          <button
            onClick={handleClosed}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Kapanmış Avanslar
          </button>
          <button
            onClick={handleNewAdvance}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Yeni Avans
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Avanslar Modülü</h2>
          <p className="text-gray-600 mb-4">
            Avans talepleri, onaylar ve kapatma işlemleri burada görüntülenecek.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleNewAdvance}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Yeni Avans Talebi Oluştur
            </button>
            <button
              onClick={handleFinanceApproval}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Finans Onayları
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvanceListPage;
