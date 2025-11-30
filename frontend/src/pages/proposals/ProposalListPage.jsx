import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Search, FileText, Send, Eye, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  draft: { label: 'Taslak', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  sent: { label: 'Gönderildi', color: 'bg-blue-100 text-blue-800', icon: '🔵' },
  viewed: { label: 'Görüntülendi', color: 'bg-cyan-100 text-cyan-800', icon: '👁' },
  accepted: { label: 'Kabul Edildi', color: 'bg-green-100 text-green-800', icon: '🟢' },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-800', icon: '🔴' }
};

const ProposalListPage = ({ onNewProposal, onViewProposal }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    draft: 0,
    sent: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    total_amount: 0
  });

  useEffect(() => {
    loadProposals();
    
    // Check URL for status filter
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    if (status && ['draft', 'sent', 'viewed', 'accepted', 'rejected'].includes(status)) {
      setStatusFilter(status);
    }
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/proposals?user_id=demo-user`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProposals(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (proposalList) => {
    const newStats = {
      draft: proposalList.filter(p => p.status === 'draft').length,
      sent: proposalList.filter(p => p.status === 'sent').length,
      viewed: proposalList.filter(p => p.status === 'viewed').length,
      accepted: proposalList.filter(p => p.status === 'accepted').length,
      rejected: proposalList.filter(p => p.status === 'rejected').length,
      total_amount: proposalList.reduce((sum, p) => sum + (p.pricing_summary?.total || 0), 0)
    };
    setStats(newStats);
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'TRY' ? '₺' : '€';
    return `${symbol}${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.proposal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.customer_snapshot?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.project_info?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teklifler</h1>
            <p className="text-gray-600 mt-1">Tüm tekliflerinizi görüntüleyin ve yönetin</p>
          </div>
          <Button onClick={onNewProposal}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Teklif
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter('draft')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taslak</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                </div>
                <FileText className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter('sent')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gönderilen</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                </div>
                <Send className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter('viewed')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Görüntülenen</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.viewed}</p>
                </div>
                <Eye className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter('accepted')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kabul</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter('rejected')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Red</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Değer</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(stats.total_amount)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Teklif numarası, müşteri veya proje ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="draft">Taslak</option>
                <option value="sent">Gönderildi</option>
                <option value="viewed">Görüntülendi</option>
                <option value="accepted">Kabul Edildi</option>
                <option value="rejected">Reddedildi</option>
              </select>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proposals Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Yükleniyor...</p>
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Arama kriterlerine uygun teklif bulunamadı' 
                    : 'Henüz teklif oluşturmadınız'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={onNewProposal}>
                    İlk Teklifi Oluştur
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teklif No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proje
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tutar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksiyonlar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProposals.map((proposal) => {
                      const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
                      
                      return (
                        <tr key={proposal.id} className="hover:bg-gray-50 cursor-pointer">
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            onClick={() => onViewProposal && onViewProposal(proposal.id)}
                          >
                            {proposal.proposal_number}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                            onClick={() => onViewProposal && onViewProposal(proposal.id)}
                          >
                            {proposal.customer_snapshot?.company_name || '-'}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                            onClick={() => onViewProposal && onViewProposal(proposal.id)}
                          >
                            {proposal.project_info?.name || '-'}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            onClick={() => onViewProposal && onViewProposal(proposal.id)}
                          >
                            {formatCurrency(proposal.pricing_summary?.total || 0, proposal.settings?.currency_code)}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap"
                            onClick={() => onViewProposal && onViewProposal(proposal.id)}
                          >
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <span className="mr-1">{statusConfig.icon}</span>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                            onClick={() => onViewProposal && onViewProposal(proposal.id)}
                          >
                            {formatDate(proposal.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onViewProposal && onViewProposal(proposal.id)}
                              >
                                Görüntüle
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination placeholder */}
        {filteredProposals.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Toplam {filteredProposals.length} teklif
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalListPage;
