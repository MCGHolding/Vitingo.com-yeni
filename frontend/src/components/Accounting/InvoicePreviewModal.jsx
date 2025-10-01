import React from 'react';
import { X, FileText, Building, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';

const InvoicePreviewModal = ({ invoice, onClose }) => {
  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    
    const numStr = value.toString();
    const parts = numStr.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (parts[1]) {
      return `${integerPart},${parts[1]}`;
    }
    
    return integerPart;
  };

  const getCurrencySymbol = (currencyCode) => {
    const currencies = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'TL': '₺',
      'AED': 'د.إ'
    };
    return currencies[currencyCode] || '';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'draft': 'Taslak',
      'pending': 'Beklemede',
      'paid': 'Ödendi',
      'overdue': 'Vadesi Geçti'
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Fatura Önizleme</h2>
              <p className="text-sm text-gray-600">{invoice.invoice_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8">
          {/* Company Header */}
          <div className="text-center mb-8">
            <div className="bg-blue-600 text-white p-6 rounded-lg mb-4">
              <h1 className="text-2xl font-bold mb-2">Başarı Uluslararası Fuarcılık A.Ş.</h1>
              <div className="text-blue-100 text-sm">
                <div>Küçükyalı Merkez Mh. Şevki Çavuş Sok.</div>
                <div>Merve Apt. No:9/7</div>
                <div>34840 Maltepe / İstanbul</div>
                <div>Tel: +90 216 123 45 67</div>
                <div>Küçükyalı Vergi Dairesi</div>
                <div>7210421828</div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column - Invoice Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                FATURA
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fatura No:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Para birimi:</span>
                  <span className="font-medium">{invoice.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarih:</span>
                  <span className="font-medium">
                    {new Date(invoice.date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durum:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Customer Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Müşteri Bilgileri
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-2">
                  {invoice.customer_name}
                </div>
                {invoice.customer_address && (
                  <div className="text-sm text-gray-600 mb-1">
                    {invoice.customer_address}
                  </div>
                )}
                {invoice.customer_city && invoice.customer_country && (
                  <div className="text-sm text-gray-600 mb-1">
                    {invoice.customer_city}, {invoice.customer_country}
                  </div>
                )}
                {invoice.customer_phone && (
                  <div className="text-sm text-gray-600 mb-1">
                    Tel: {invoice.customer_phone}
                  </div>
                )}
                {invoice.customer_tax_info && (
                  <div className="text-sm text-gray-600">
                    {invoice.customer_tax_info}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ürün ve Hizmetler</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                      Sıra
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                      Ürün/Hizmet Adı
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                      Miktar
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                      Birim
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 border-b">
                      Birim Fiyat
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 border-b">
                      Toplam
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items && invoice.items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 border-b">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 border-b">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border-b">
                        {getCurrencySymbol(invoice.currency)}{formatNumber(item.unit_price?.toFixed(2))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 border-b">
                        {getCurrencySymbol(invoice.currency)}{formatNumber(item.total?.toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">
                    {getCurrencySymbol(invoice.currency)}{formatNumber(invoice.subtotal?.toFixed(2))}
                  </span>
                </div>
                
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      İndirim ({invoice.discount_type === 'percentage' ? `%${invoice.discount}` : 'Sabit'}):
                    </span>
                    <span className="font-medium text-red-600">
                      -{getCurrencySymbol(invoice.currency)}{formatNumber(invoice.discount_amount?.toFixed(2))}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">KDV (%{invoice.vat_rate}):</span>
                  <span className="font-medium">
                    {getCurrencySymbol(invoice.currency)}{formatNumber(invoice.vat_amount?.toFixed(2))}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Genel Toplam:</span>
                    <span className="text-blue-600">
                      {getCurrencySymbol(invoice.currency)}{formatNumber(invoice.total?.toFixed(2))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms & Conditions */}
          {(invoice.payment_term || invoice.conditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {invoice.payment_term && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ödeme Koşulları</h4>
                  <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    Ödeme Vadesi: {invoice.payment_term} gün
                  </div>
                </div>
              )}
              
              {invoice.conditions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Genel Koşullar</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {invoice.conditions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button
            onClick={async () => {
              try {
                console.log('Modal PDF indirme başlatılıyor:', invoice.id);
                const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
                console.log('Backend URL:', backendUrl);
                
                const pdfUrl = `${backendUrl}/api/invoices/${invoice.id}/pdf`;
                console.log('PDF URL:', pdfUrl);
                
                const response = await fetch(pdfUrl);
                console.log('Response status:', response.status);
                
                if (response.ok) {
                  const blob = await response.blob();
                  console.log('Blob size:', blob.size);
                  
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Fatura_${invoice.invoice_number}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  console.log('Modal PDF indirme tamamlandı');
                } else {
                  const errorText = await response.text();
                  console.error('Modal PDF indirme hatası:', response.status, errorText);
                  alert(`PDF dosyası indirilemedi: ${response.status} - ${errorText}`);
                }
              } catch (error) {
                console.error('Modal PDF indirme hatası:', error);
                alert(`PDF dosyası indirilemedi: ${error.message}`);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            PDF İndir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;