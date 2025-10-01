import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Plus, Search, Play, Calendar, User, DollarSign } from 'lucide-react';

const OngoingProjectsPage = ({ onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - sadece devam eden projeler
  const ongoingProjects = [
    {
      id: 1,
      name: 'Web Sitesi Yenileme',
      description: 'Kurumsal web sitesi yenileme projesi',
      status: 'ongoing',
      startDate: '2024-09-01',
      endDate: '2024-12-15',
      budget: 50000,
      clientName: 'ABC Şirketi',
      projectManager: 'Ahmet Yılmaz',
      progress: 65
    },
    {
      id: 4,
      name: 'CRM Sistemi',
      description: 'Müşteri ilişkileri yönetim sistemi',
      status: 'ongoing',
      startDate: '2024-10-01',
      endDate: '2025-03-15',
      budget: 120000,
      clientName: 'DEF Holdings',
      projectManager: 'Fatma Özkan',
      progress: 25
    }
  ];

  const filteredProjects = ongoingProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Devam Eden Projeler</h1>
              <p className="text-gray-600">{filteredProjects.length} aktif proje</p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Proje
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
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

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Play className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-gray-600">{project.description}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Devam Ediyor
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">İlerleme</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-600">Müşteri</div>
                    <div className="font-medium">{project.clientName}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-600">Proje Yöneticisi</div>
                    <div className="font-medium">{project.projectManager}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-600">Bitiş Tarihi</div>
                    <div className="font-medium">{project.endDate}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-600">Bütçe</div>
                    <div className="font-medium">₺{project.budget.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  İlerleme Güncelle
                </Button>
                <Button variant="outline" size="sm">
                  Düzenle
                </Button>
                <Button variant="outline" size="sm">
                  Detaylar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Devam eden proje bulunamadı</h3>
            <p className="text-gray-600">Şu anda aktif olan bir proje bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingProjectsPage;