import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Search, CheckSquare, Calendar, User, DollarSign, Award } from 'lucide-react';

const CompletedProjectsPage = ({ onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - sadece tamamlanan projeler
  const completedProjects = [
    {
      id: 2,
      name: 'Mobil Uygulama',
      description: 'iOS ve Android mobil uygulama geliştirme',
      status: 'completed',
      startDate: '2024-06-01',
      endDate: '2024-09-30',
      actualEndDate: '2024-09-28',
      budget: 75000,
      finalCost: 72000,
      clientName: 'XYZ Tech',
      projectManager: 'Mehmet Demir',
      rating: 4.8
    },
    {
      id: 5,
      name: 'E-ticaret Platformu',
      description: 'Online satış platformu geliştirme',
      status: 'completed',
      startDate: '2024-03-15',
      endDate: '2024-07-30',
      actualEndDate: '2024-08-05',
      budget: 95000,
      finalCost: 98000,
      clientName: 'E-Commerce Ltd.',
      projectManager: 'Ali Veli',
      rating: 4.5
    }
  ];

  const filteredProjects = completedProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  const isOverBudget = (budget, finalCost) => finalCost > budget;
  const isLate = (endDate, actualEndDate) => new Date(actualEndDate) > new Date(endDate);

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
              <h1 className="text-2xl font-bold text-gray-900">Tamamlanan Projeler</h1>
              <p className="text-gray-600">{filteredProjects.length} tamamlanmış proje</p>
            </div>
          </div>
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
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-gray-600">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Tamamlandı
                  </span>
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4 text-yellow-500" />
                    {getRatingStars(project.rating)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Müşteri</div>
                    <div className="font-medium">{project.clientName}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Proje Yöneticisi</div>
                    <div className="font-medium">{project.projectManager}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Tamamlanma</div>
                    <div className={`font-medium ${isLate(project.endDate, project.actualEndDate) ? 'text-red-600' : 'text-green-600'}`}>
                      {project.actualEndDate}
                      {isLate(project.endDate, project.actualEndDate) && (
                        <span className="text-xs text-red-600 block">
                          ({Math.ceil((new Date(project.actualEndDate) - new Date(project.endDate)) / (1000 * 60 * 60 * 24))} gün gecikme)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Maliyet</div>
                    <div className={`font-medium ${isOverBudget(project.budget, project.finalCost) ? 'text-red-600' : 'text-green-600'}`}>
                      ₺{project.finalCost.toLocaleString()}
                      <span className="text-xs text-gray-500 block">
                        Bütçe: ₺{project.budget.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Indicators */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Zaman Performansı</div>
                  <div className={`font-semibold ${isLate(project.endDate, project.actualEndDate) ? 'text-red-600' : 'text-green-600'}`}>
                    {isLate(project.endDate, project.actualEndDate) ? 'Gecikti' : 'Zamanında'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Bütçe Performansı</div>
                  <div className={`font-semibold ${isOverBudget(project.budget, project.finalCost) ? 'text-red-600' : 'text-green-600'}`}>
                    {isOverBudget(project.budget, project.finalCost) ? 'Bütçe Aşıldı' : 'Bütçe İçinde'}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Rapor Görüntüle
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
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tamamlanan proje bulunamadı</h3>
            <p className="text-gray-600">Henüz tamamlanmış bir proje bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedProjectsPage;