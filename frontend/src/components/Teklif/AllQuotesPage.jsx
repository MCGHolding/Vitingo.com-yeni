import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Plus, Trash2, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AllQuotesPage = ({ onBackToDashboard, onNewTeklif }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/quotes`);
      if (!response.ok) {
        throw new Error('Teklifler yüklenemedi');
      }
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      setError('Teklifler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quoteId) => {
    if (!window.confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Teklif silinemedi');
      }

      // Refresh list
      loadQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Teklif silinirken bir hata oluştu');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      draft: 'Taslak',
      sent: 'Gönderildi',
      won: 'Kazanıldı',
      lost: 'Kaybedildi',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.draft}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tüm Teklifler</h1>
            <p className="text-gray-600 mt-1">{quotes.length} teklif bulundu</p>
          </div>
          <Button
            onClick={onNewTeklif}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Teklif</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                Teklifler yükleniyor...
              </div>
            </CardContent>
          </Card>
        ) : quotes.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz teklif oluşturulmamış
                </h3>
                <p className="text-gray-500 mb-4">
                  İlk teklifinizi oluşturmak için butona tıklayın
                </p>
                <Button onClick={onNewTeklif}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Teklif Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Quotes Table */
          <Card>
            <CardHeader>
              <CardTitle>Teklif Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Teklif Başlığı</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Teklif Tarihi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Geçerlilik</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Durum</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Konum</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{quote.title}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {quote.quote_date}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {quote.validity_date || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(quote.status)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {quote.city && quote.country ? `${quote.city}, ${quote.country}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleDelete(quote.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Sil"
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
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <Button variant="outline" onClick={onBackToDashboard}>
            Dashboard'a Dön
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AllQuotesPage;
