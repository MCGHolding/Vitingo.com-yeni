import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import ViewPersonModal from './ViewPersonModal';
import EditPersonModal from './EditPersonModal';
import ActionMenuPersonPopover from './ActionMenuPersonPopover';
import { useToast } from '../../hooks/use-toast';
import { 
  UserRound,
  Search,
  Filter,
  Download,
  X,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowLeft,
  Users,
  UserCheck,
  UserPlus,
  Truck
} from 'lucide-react';
import { allPeople } from '../../mock/peopleData';

export default function AllPeoplePage({ onBackToDashboard, people: peopleProp = [], refreshPeople, onUpdatePerson }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('');
  
  // Modal states
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Use props people if provided, otherwise fall back to mock data
  const [people, setPeople] = useState(peopleProp.length > 0 ? peopleProp : allPeople);

  // Refresh people on component mount
  React.useEffect(() => {
    if (refreshPeople) {
      refreshPeople();
    }
  }, [refreshPeople]);

  // Update people when props change
  React.useEffect(() => {
    if (peopleProp.length > 0) {
      setPeople(peopleProp);
    }
  }, [peopleProp]);

  // Calculate stats dynamically (with safe checks)
  const peopleStats = {
    totalPeople: people?.length || 0,
    activePeople: people?.filter(p => p.status === 'active').length || 0,
    customers: people?.filter(p => p.relationshipType === 'customer' || p.relationship_type === 'customer').length || 0,
    potentialCustomers: people?.filter(p => p.relationshipType === 'potential_customer' || p.relationship_type === 'potential_customer').length || 0,
    contacts: people?.filter(p => p.relationshipType === 'kontak' || p.relationship_type === 'kontak').length || 0,
    suppliers: people?.filter(p => p.relationshipType === 'supplier' || p.relationship_type === 'supplier').length || 0
  };

  const filteredPeople = (people || []).filter(person => {
    const matchesSearch = searchTerm === '' || 
      (person.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.jobTitle || person.job_title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTagSearch = tagSearchTerm === '' || 
      (person.tags || []).some(tag => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()));
    
    const matchesSector = selectedSector === '' || person.sector === selectedSector;
    const matchesRelationship = selectedRelationship === '' || 
      person.relationshipType === selectedRelationship || 
      person.relationship_type === selectedRelationship;
    
    return matchesSearch && matchesTagSearch && matchesSector && matchesRelationship;
  });

  const uniqueSectors = [...new Set((people || []).map(person => person.sector).filter(s => s))];
  const relationshipTypes = [
    { value: 'customer', label: 'Müşteri' },
    { value: 'potential_customer', label: 'Potansiyel Müşteri' },
    { value: 'kontak', label: 'Kontak' },
    { value: 'supplier', label: 'Tedarikçi' }
  ];

  const getRelationshipBadgeColor = (type) => {
    switch (type) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'potential_customer': return 'bg-orange-100 text-orange-800';
      case 'kontak': return 'bg-gray-100 text-gray-800';
      case 'supplier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Modal handlers
  const handleViewPerson = (person) => {
    setSelectedPerson(person);
    setShowViewModal(true);
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setShowEditModal(true);
    setShowViewModal(false);
  };

  const handleSavePerson = (updatedPerson) => {
    const updatedPeople = people.map(p => 
      p.id === updatedPerson.id ? updatedPerson : p
    );
    setPeople(updatedPeople);
    
    // Also update parent component if callback provided
    if (onUpdatePerson) {
      onUpdatePerson(updatedPerson);
    }
    
    setShowEditModal(false);
    setSelectedPerson(null);
  };

  const handleDeletePerson = (person) => {
    if (window.confirm(`${person.fullName} kişisini silmek istediğinizden emin misiniz?`)) {
      const updatedPeople = people.filter(p => p.id !== person.id);
      setPeople(updatedPeople);
      
      toast({
        title: "Başarılı",
        description: `${person.fullName} başarıyla silindi.`,
      });
    }
  };

  const handleSharePerson = (person) => {
    navigator.clipboard.writeText(`${person.fullName} - ${person.company} - ${person.phone}`);
    toast({
      title: "Paylaşıldı",
      description: `${person.fullName} bilgileri panoya kopyalandı.`,
    });
  };

  const handleMessagePerson = (person) => {
    if (person.phone) {
      window.open(`sms:${person.phone}`, '_blank');
    } else {
      toast({
        title: "Telefon Bulunamadı",
        description: `${person.fullName} için telefon numarası kayıtlı değil.`,
        variant: "destructive"
      });
    }
  };

  const handleMailPerson = (person) => {
    if (person.email) {
      window.open(`mailto:${person.email}`, '_blank');
    } else {
      toast({
        title: "E-posta Bulunamadı",
        description: `${person.fullName} için e-posta adresi kayıtlı değil.`,
        variant: "destructive"
      });
    }
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedPerson(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToDashboard}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kapat</span>
            </Button>
            <div className="flex items-center space-x-2">
              <UserRound className="h-6 w-6 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tüm Kişiler</h1>
                <p className="text-sm text-gray-600">Sistemde kayıtlı tüm kişiler ve iletişim bilgileri</p>
              </div>
            </div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Kişi</p>
                  <p className="text-2xl font-bold text-gray-900">{peopleStats.totalPeople}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Kişi</p>
                  <p className="text-2xl font-bold text-gray-900">{peopleStats.activePeople}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{peopleStats.customers}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tedarikçi</p>
                  <p className="text-2xl font-bold text-gray-900">{peopleStats.suppliers}</p>
                </div>
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ara</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="İsim, şirket, e-posta, ünvan ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tag Ara</label>
                <Input
                  placeholder="Tag ara (örn: TEKNOLOJI)..."
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sektör</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tüm Sektörler</option>
                  {uniqueSectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">İlişki Tipi</label>
                <select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tüm İlişkiler</option>
                  {relationshipTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{filteredPeople.length} kişi</span> bulundu
              </p>
              {(searchTerm || tagSearchTerm || selectedSector || selectedRelationship) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setTagSearchTerm('');
                    setSelectedSector('');
                    setSelectedRelationship('');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* People Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kişi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şirket/Ünvan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İlişki Tipi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sektör</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiketler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPeople.map((person, index) => (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        #{String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <UserRound className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{person.fullName}</div>
                            <div className="text-sm text-gray-500">{person.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.company}</div>
                        <div className="text-sm text-gray-500">{person.jobTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.phone}</div>
                        <div className="text-sm text-gray-500">{person.website}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRelationshipBadgeColor(person.relationshipType)}>
                          {person.relationshipText}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {(person.tags || []).map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleViewPerson(person)}
                            className="text-blue-600 hover:text-blue-900" 
                            title="Detayları Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditPerson(person)}
                            className="text-green-600 hover:text-green-900" 
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <ActionMenuPersonPopover
                            person={person}
                            onDelete={handleDeletePerson}
                            onShare={handleSharePerson}
                            onMessage={handleMessagePerson}
                            onMail={handleMailPerson}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {filteredPeople.length === 0 && (
          <div className="text-center py-12">
            <UserRound className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Kişi bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Arama kriterlerinize uygun kişi bulunmamaktadır.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewModal && selectedPerson && (
        <ViewPersonModal
          person={selectedPerson}
          onClose={closeModals}
          onEdit={handleEditPerson}
        />
      )}

      {showEditModal && selectedPerson && (
        <EditPersonModal
          person={selectedPerson}
          onClose={closeModals}
          onSave={handleSavePerson}
        />
      )}
    </div>
  );
}