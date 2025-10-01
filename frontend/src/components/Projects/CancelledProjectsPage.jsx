import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Search, X, Calendar, User, DollarSign, AlertCircle } from 'lucide-react';

const CancelledProjectsPage = ({ onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - sadece iptal edilen projeler
  const cancelledProjects = [
    {
      id: 3,
      name: 'ERP Entegrasyonu',
      description: 'Mevcut sistemle ERP entegrasyonu',
      status: 'cancelled',
      startDate: '2024-08-01',
      plannedEndDate: '2024-11-30',
      cancelledDate: '2024-09-15',
      budget: 30000,
      spentAmount: 12000,
      clientName: '123 Ltd.',
      projectManager: 'Ayşe Kaya',
      cancellationReason: 'Müşteri bütçe kısıtlaması',
      completedPercentage: 30
    },
    {
      id: 6,
      name: 'Kurumsal Portal',
      description: 'İç kullanım için portal sistemi',
      status: 'cancelled',
      startDate: '2024-05-01',
      plannedEndDate: '2024-10-01',
      cancelledDate: '2024-07-20',
      budget: 45000,
      spentAmount: 25000,
      clientName: 'Internal Project',
      projectManager: 'Murat Şen',
      cancellationReason: 'Teknik zorluklar ve kaynak yetersizliği',
      completedPercentage: 55
    }
  ];

  const filteredProjects = cancelledProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (percentage) => {
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const calculateWastedBudget = (budget, spentAmount) => {
    const wastedPercentage = ((spentAmount / budget) * 100).toFixed(1);
    return { amount: spentAmount, percentage: wastedPercentage };
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
              <h1 className="text-2xl font-bold text-gray-900">İptal Edilen Projeler</h1>
              <p className="text-gray-600">{filteredProjects.length} iptal edilmiş proje</p>
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
          {filteredProjects.map((project) => {
            const wastedBudget = calculateWastedBudget(project.budget, project.spentAmount);
            
            return (
              <div key={project.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-gray-600">{project.description}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    İptal Edildi
                  </span>
                </div>

                {/* Progress at Cancellation */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">İptal Anındaki İlerleme</span>
                    <span className="font-medium">{project.completedPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(project.completedPercentage)}`}
                      style={{ width: `${project.completedPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-red-800">İptal Sebebi:</div>
                      <div className="text-sm text-red-700">{project.cancellationReason}</div>
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
                      <div className="text-sm text-gray-600">İptal Tarihi</div>
                      <div className="font-medium text-red-600">{project.cancelledDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Harcanan Miktar</div>
                      <div className="font-medium text-red-600">
                        ₺{project.spentAmount.toLocaleString()}
                        <span className="text-xs text-gray-500 block">
                          Toplam bütçenin %{wastedBudget.percentage}'i
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loss Analysis */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Planlanan Bütçe</div>
                    <div className="font-semibold text-gray-900">₺{project.budget.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Harcanan Miktar</div>
                    <div className="font-semibold text-red-600">₺{project.spentAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Kaybedilen Yatırım</div>
                    <div className="font-semibold text-red-600">%{wastedBudget.percentage}</div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    İptal Raporu
                  </Button>
                  <Button variant="outline" size="sm">
                    Detaylar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <X className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">İptal edilmiş proje bulunamadı</h3>
            <p className="text-gray-600">Şu anda iptal edilmiş bir proje bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelledProjectsPage;