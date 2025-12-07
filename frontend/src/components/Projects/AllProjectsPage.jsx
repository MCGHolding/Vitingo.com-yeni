import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Plus, Search, Filter, Folder, Calendar, User, DollarSign, Eye, Edit2, LayoutGrid, List, Hash, Trash2, Building, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useParams } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import ViewProjectModal from './ViewProjectModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SuccessModal from './SuccessModal';

const AllProjectsPage = ({ onBackToDashboard, onEditProject }) => {
  const { tenantSlug } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (tenantSlug) {
      apiClient.setTenantSlug(tenantSlug);
    }
    loadProjects();
  }, [tenantSlug]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProjects();
      
      if (response && response.status === 'success') {
        const data = response.data || [];
        setProjects(data);
        console.log(`✅ Loaded ${data.length} projects from tenant-aware API`);
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

  const handleDeleteClick = (projectId, projectName) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      await apiClient.deleteProject(projectToDelete.id);
      setDeleteModalOpen(false);
      setSuccessMessage(`"${projectToDelete.name}" projesi başarıyla silindi.`);
      setSuccessModalOpen(true);
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Hata",
        description: "Proje silinirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Projeler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Button>
          <h1 className="text-2xl font-bold">Projeler</h1>
          <span className="text-sm text-gray-500">
            {filteredProjects.length} proje
          </span>
        </div>
        <Button
          onClick={() => {/* Navigate to new project */}}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Proje
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Proje ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz proje bulunmuyor.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id || project.projectNumber}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Folder className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-xs text-gray-500">{project.projectNumber}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(project.id || project.projectNumber, project.name);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="w-4 h-4" />
                  <span>{project.companyName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{project.startDate || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{project.totalAmount ? `${project.totalAmount.toLocaleString()} ${project.currency}` : 'N/A'}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status || 'N/A'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject && onEditProject(project.id || project.projectNumber);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Şirket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
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
                <tr key={project.id || project.projectNumber} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProject(project)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.projectNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {project.companyName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.startDate || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {project.totalAmount ? `${project.totalAmount.toLocaleString()} ${project.currency}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject && onEditProject(project.id || project.projectNumber);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(project.id || project.projectNumber, project.name);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Project Modal */}
      {selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onEdit={() => {
            onEditProject && onEditProject(selectedProject.id || selectedProject.projectNumber);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name}
        deleting={deleting}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={successMessage}
      />
    </div>
  );
};

export default AllProjectsPage;
