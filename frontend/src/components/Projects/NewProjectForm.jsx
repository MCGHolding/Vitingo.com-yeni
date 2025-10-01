import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Save, Calendar, User, DollarSign, Folder } from 'lucide-react';

const NewProjectForm = ({ onBackToDashboard }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ongoing',
    startDate: '',
    endDate: '',
    budget: '',
    clientName: '',
    projectManager: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Yeni proje oluşturuluyor:', formData);
    // TODO: Backend'e kaydetme işlemi eklenecek
    alert('Proje başarıyla oluşturuldu!');
    onBackToDashboard();
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
              <h1 className="text-2xl font-bold text-gray-900">Yeni Proje</h1>
              <p className="text-gray-600">Yeni bir proje oluşturun</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center space-x-2 text-lg font-medium text-gray-900 mb-4">
            <Folder className="h-5 w-5" />
            <span>Proje Bilgileri</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Adı *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Proje adını giriniz"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Proje açıklamasını giriniz"
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Bütçe
              </label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  <SelectItem value="on-hold">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Müşteri
              </label>
              <Input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Müşteri adını giriniz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Proje Yöneticisi
              </label>
              <Input
                type="text"
                value={formData.projectManager}
                onChange={(e) => setFormData(prev => ({ ...prev, projectManager: e.target.value }))}
                placeholder="Proje yöneticisini giriniz"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              <Save className="h-4 w-4 mr-2" />
              Proje Oluştur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectForm;