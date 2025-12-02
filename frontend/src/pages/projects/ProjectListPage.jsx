import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import AllProjectsPage from '../../components/Projects/AllProjectsPage';

const ProjectListPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const location = useLocation();
  const { tenant } = useTenant();

  // URL'den filtre belirle
  const getFilterFromPath = () => {
    const path = location.pathname;
    if (path.includes('/devam-eden')) return 'ongoing';
    if (path.includes('/tamamlanan')) return 'completed';
    if (path.includes('/iptal')) return 'cancelled';
    return 'all';
  };

  const currentFilter = getFilterFromPath();

  // Navigation handlers
  const handleBackToDashboard = () => {
    navigate(`/${tenantSlug}`);
  };

  const handleEditProject = (projectId) => {
    navigate(`/${tenantSlug}/projeler/${projectId}/duzenle`);
  };

  const handleNewProject = () => {
    navigate(`/${tenantSlug}/projeler/yeni`);
  };

  // OngoingProjectsPage, CompletedProjectsPage, CancelledProjectsPage için
  // farklı component render et veya AllProjectsPage'e filter prop gönder
  
  return (
    <AllProjectsPage
      onBackToDashboard={handleBackToDashboard}
      onEditProject={handleEditProject}
      filter={currentFilter}
    />
  );
};

export default ProjectListPage;
