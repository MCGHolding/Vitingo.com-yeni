import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Plus, Search, Filter, Folder, Calendar, User, DollarSign, Trash2, Eye } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const AllProjectsPage = ({ onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
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
    (project.customerName && project.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Proje adı veya müşteri ara..."
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
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                </div>
                {getStatusBadge(project.status)}
              </div>
              
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Müşteri:</span>
                  <span className="font-medium">{project.clientName}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Proje Yöneticisi:</span>
                  <span className="font-medium">{project.projectManager}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Tarih:</span>
                  <span className="font-medium">{project.startDate} - {project.endDate}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Bütçe:</span>
                  <span className="font-medium">₺{project.budget.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Düzenle
                </Button>
                <Button variant="outline" size="sm">
                  Görüntüle
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Proje bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinize uygun proje bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProjectsPage;