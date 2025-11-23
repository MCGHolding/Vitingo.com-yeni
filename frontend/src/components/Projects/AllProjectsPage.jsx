import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Plus, Search, Filter, Folder, Calendar, User, DollarSign, Eye, Edit2, LayoutGrid, List, Hash, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import ViewProjectModal from './ViewProjectModal';

const AllProjectsPage = ({ onBackToDashboard, onEditProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedProject, setSelectedProject] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Force component identification
    document.title = 'REAL AllProjectsPage - UPDATED';
    console.log('🔥🔥🔥 REAL AllProjectsPage MOUNTED - UPDATED VERSION 🔥🔥🔥');
    console.log('onEditProject callback:', typeof onEditProject);
    console.log('onBackToDashboard callback:', typeof onBackToDashboard);
    
    // Global test fonksiyonu
    window.testButtonClick = () => {
      alert('TEST BUTTON ÇALIŞIYOR!');
      console.log('Test button clicked!');
    };
    
    console.log('Global test function created. Call window.testButtonClick() to test.');
    
    loadProjects();
  }, []);

  useEffect(() => {
    console.log('📊 selectedProject changed:', selectedProject?.name || 'null');
  }, [selectedProject]);

  const loadProjects = async () => {
    console.log('🚀 AllProjectsPage: loadProjects called - UPDATED VERSION');
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      console.log('🔗 Backend URL:', backendUrl);
      const response = await fetch(`${backendUrl}/api/projects`);
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Projects loaded:', data.length, 'projects');
        console.log('First project:', data[0]?.name);
        setProjects(data);
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      toast({
        title: "Hata",
        description: "Projeler yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId, projectName) => {
    if (!window.confirm(`"${projectName}" projesini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Proje başarıyla silindi"
        });
        loadProjects(); // Listeyi yenile
      } else {
        throw new Error('Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Hata",
        description: "Proje silinirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'yeni': { label: 'Yeni', className: 'bg-purple-100 text-purple-800' },
      'ongoing': { label: 'Devam Ediyor', className: 'bg-blue-100 text-blue-800' },
      'completed': { label: 'Tamamlandı', className: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'İptal Edildi', className: 'bg-red-100 text-red-800' },
      'on-hold': { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status] || statusConfig['yeni'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.customerName && project.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.projectNumber && project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Projeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <div 
          key={project.id} 
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow" 
          style={{ position: 'relative' }}
          onClick={() => {
            console.log('KART TIKLANDI:', project.name);
            alert('KART TIKLANDI: ' + project.name);
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            </div>
            {getStatusBadge(project.status)}
          </div>

          {project.projectNumber && (
            <div className="mb-3 flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
              <Hash className="h-4 w-4 mr-1" />
              <span className="font-mono font-medium">{project.projectNumber}</span>
            </div>
          )}
          
          {project.notes && (
            <p className="text-gray-600 mb-4 text-sm line-clamp-2">{project.notes}</p>
          )}
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Müşteri:</span>
              <span className="font-medium">{project.customerName || 'Belirtilmemiş'}</span>
            </div>

            {project.createdByName && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Oluşturan:</span>
                <span className="font-medium">{project.createdByName}</span>
              </div>
            )}
            
            {project.fairName && (
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Fuar:</span>
                <span className="font-medium">{project.fairName}</span>
              </div>
            )}
            
            {project.city && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Şehir:</span>
                <span className="font-medium">{project.city}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Sözleşme Tutarı:</span>
              <span className="font-medium">
                {project.contractAmount ? 
                  `${project.contractAmount.toLocaleString()} ${project.currency || 'TRY'}` : 
                  'Belirtilmemiş'}
              </span>
            </div>

            {project.contractDate && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Sözleşme Tarihi:</span>
                <span className="font-medium">
                  {new Date(project.contractDate).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2" style={{ zIndex: 100, position: 'relative' }}>
            <button 
              onMouseDown={() => {
                alert('DÜZENLE - MouseDown: ' + project.name);
                console.log('Edit mousedown');
              }}
              className="px-3 py-2 text-sm border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              style={{ zIndex: 200, position: 'relative', pointerEvents: 'auto' }}
            >
              <Edit2 className="h-4 w-4" />
              <span>Düzenle</span>
            </button>
            <button 
              onMouseDown={() => {
                alert('GÖRÜNTÜLE - MouseDown: ' + project.name);
                console.log('View mousedown');
                setSelectedProject(project);
              }}
              className="px-3 py-2 text-sm border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              style={{ zIndex: 200, position: 'relative', pointerEvents: 'auto' }}
            >
              <Eye className="h-4 w-4" />
              <span>Görüntüle</span>
            </button>
            <button 
              onMouseDown={() => {
                alert('SİL - MouseDown: ' + project.name);
                console.log('Delete mousedown');
                handleDelete(project.id, project.name);
              }}
              className="px-3 py-2 text-sm border-2 border-red-600 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              style={{ zIndex: 200, position: 'relative', pointerEvents: 'auto' }}
            >
              <Trash2 className="h-4 w-4" />
              <span>Sil</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Proje No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Proje Adı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Müşteri
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Oluşturan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tutar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredProjects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                {project.projectNumber ? (
                  <span className="text-sm font-mono font-medium text-gray-900">
                    {project.projectNumber}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                {project.fairName && (
                  <div className="text-sm text-gray-500">{project.fairName}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{project.customerName || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{project.createdByName || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {project.contractAmount ? 
                    `${project.contractAmount.toLocaleString()} ${project.currency}` : 
                    '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(project.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('✏️ Edit clicked (list view):', project.id);
                      alert('Düzenle: ' + project.name);
                      if (onEditProject) {
                        onEditProject(project.id);
                      }
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Düzenle"
                    style={{ zIndex: 10, position: 'relative' }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔍 View clicked (list view):', project.name);
                      alert('Görüntüle: ' + project.name);
                      setSelectedProject(project);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Görüntüle"
                    style={{ zIndex: 10, position: 'relative' }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🗑️ Delete clicked (list view):', project.name);
                      alert('Sil: ' + project.name);
                      handleDelete(project.id, project.name);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Sil"
                    style={{ zIndex: 10, position: 'relative' }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Geri</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tüm Projeler</h1>
              <p className="text-gray-600">{filteredProjects.length} proje bulundu</p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Proje
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Proje adı, müşteri veya proje numarası ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
              </Button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 ml-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid Görünümü"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Liste Görünümü"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects View */}
        {viewMode === 'grid' ? <GridView /> : <ListView />}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Proje bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinize uygun proje bulunamadı.</p>
          </div>
        )}
      </div>

      {/* View Project Modal */}
      {selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default AllProjectsPage;
