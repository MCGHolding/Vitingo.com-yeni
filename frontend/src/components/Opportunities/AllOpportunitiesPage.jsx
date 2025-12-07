import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useParams } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import ViewOpportunityModal from './ViewOpportunityModal';
import EditOpportunityModal from './EditOpportunityModal';
import ActionMenuPopover from './ActionMenuPopover';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  FileText,
  X,
  List,
  BarChart,
  Zap,
  Star
} from 'lucide-react';

export default function AllOpportunitiesPage({ onBackToDashboard, opportunities, onEditOpportunity, onViewOpportunity }) {
  const { tenantSlug } = useParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('id');
  
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const tagColors = {
    'urgent': 'bg-red-500 text-white',
    'high': 'bg-orange-500 text-white',
    'medium': 'bg-yellow-500 text-white', 
    'low': 'bg-green-500 text-white',
    'priority': 'bg-blue-500 text-white'
  };

  useEffect(() => {
    if (tenantSlug) {
      apiClient.setTenantSlug(tenantSlug);
    }
    loadOpportunities();
  }, [tenantSlug]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getOpportunities();
      
      if (response && response.status === 'success') {
        const data = response.data || [];
        setAllOpportunities(data);
        console.log(`✅ Loaded ${data.length} opportunities from tenant-aware API`);
        console.log(`📊 Tenant: ${response.tenant?.name}`);
      }
    } catch (error) {
      console.error('❌ Error loading opportunities:', error);
      setError('Satış fırsatları yüklenirken hata oluştu');
      toast({
        title: "Hata",
        description: "Satış fırsatları yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (opportunity) => {
    setOpportunityToDelete(opportunity);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!opportunityToDelete) return;

    setDeleteLoading(true);
    try {
      await apiClient.deleteOpportunity(opportunityToDelete.id);
      
      toast({
        title: "Başarılı",
        description: `"${opportunityToDelete.name}" fırsatı silindi.`,
        variant: "success"
      });
      
      setDeleteModalOpen(false);
      loadOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: "Hata",
        description: "Fırsat silinirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter(opp => {
      const matchesSearch = !searchTerm || 
        opp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
      const matchesCurrency = currencyFilter === 'all' || opp.currency === currencyFilter;
      const matchesCountry = countryFilter === 'all' || opp.country === countryFilter;
      
      return matchesSearch && matchesStatus && matchesCurrency && matchesCountry;
    });
  }, [allOpportunities, searchTerm, statusFilter, currencyFilter, countryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Fırsatlar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Satış Fırsatları</h1>
          <p className="text-gray-500 mt-1">{filteredOpportunities.length} fırsat</p>
        </div>
        <Button onClick={() => {/* Navigate to new */}}>Yeni Fırsat</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Fırsat ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="open">Açık</SelectItem>
            <SelectItem value="won">Kazanıldı</SelectItem>
            <SelectItem value="lost">Kaybedildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredOpportunities.map((opp) => (
          <Card key={opp.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">{opp.name}</CardTitle>
              <p className="text-sm text-gray-500">{opp.companyName}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{opp.value?.toLocaleString()} {opp.currency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{opp.expectedCloseDate}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge className={opp.status === 'won' ? 'bg-green-500' : opp.status === 'lost' ? 'bg-red-500' : 'bg-blue-500'}>
                    {opp.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewOpportunity && onViewOpportunity(opp)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEditOpportunity && onEditOpportunity(opp)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(opp)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fırsatı Sil</DialogTitle>
            <DialogDescription>
              "{opportunityToDelete?.name}" fırsatını silmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
