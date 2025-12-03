import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExpenseCategoriesSettings from '../../components/Settings/ExpenseCategoriesSettings';

const ExpenseCategoriesPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(`/${tenantSlug}/ayarlar`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span>
            <span>Geri</span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ExpenseCategoriesSettings />
      </div>
    </div>
  );
};

export default ExpenseCategoriesPage;
