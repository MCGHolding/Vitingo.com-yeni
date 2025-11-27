import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmailSidebar from './components/EmailSidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import EmailComposer from './components/EmailComposer';
import { useToast } from '../../../hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EmailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [customer, setCustomer] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/customers`);
        const customers = response.data;
        const foundCustomer = customers.find(c => c.id === customerId);
        if (foundCustomer) {
          setCustomer(foundCustomer);
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    };
    
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);
  
  // Fetch emails
  useEffect(() => {
    if (customerId) {
      fetchEmails();
    }
  }, [customerId, filter, page]);
  
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter
      });
      
      const response = await axios.get(
        `${BACKEND_URL}/api/customers/${customerId}/emails?${params}`
      );
      
      setEmails(response.data.emails || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Hata",
        description: "E-postalar yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Email selected
  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    
    // Mark as read if unread inbound email
    if (!email.isRead && email.direction === 'inbound') {
      try {
        await axios.put(`${BACKEND_URL}/api/emails/${email.id}/read`);
        
        // Update local state
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, isRead: true } : e
        ));
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };
  
  // Toggle star
  const handleToggleStar = async (emailId) => {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/emails/${emailId}/star`);
      
      // Update local state
      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, isStarred: response.data.isStarred } : e
      ));
      
      // Update selected email if it's the same
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => ({ ...prev, isStarred: response.data.isStarred }));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      toast({
        title: "Hata",
        description: "Yıldızlama işlemi başarısız",
        variant: "destructive"
      });
    }
  };
  
  // Email sent
  const handleEmailSent = (newEmail) => {
    setEmails(prev => [newEmail, ...prev]);
    setShowComposer(false);
    toast({
      title: "Başarılı",
      description: "E-posta gönderildi",
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };
  
  // Delete email
  const handleDeleteEmail = async (emailId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/emails/${emailId}`);
      
      // Remove from list
      setEmails(prev => prev.filter(e => e.id !== emailId));
      
      // Clear selection if deleted email was selected
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      
      toast({
        title: "Başarılı",
        description: "E-posta silindi",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } catch (error) {
      console.error('Error deleting email:', error);
      toast({
        title: "Hata",
        description: "E-posta silinirken hata oluştu",
        variant: "destructive"
      });
    }
  };
  
  // Counts for sidebar
  const counts = {
    all: total,
    unread: emails.filter(e => !e.isRead && e.direction === 'inbound').length,
    starred: emails.filter(e => e.isStarred).length,
    sent: emails.filter(e => e.direction === 'outbound').length,
    awaiting: 0 // TODO: Calculate awaiting reply
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri</span>
          </button>
          <div className="border-l pl-3">
            <h1 className="text-xl font-semibold">E-posta Yönetimi</h1>
            <p className="text-sm text-gray-500">{customer?.companyName || 'Yükleniyor...'}</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowComposer(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <span>✉️</span>
          <span>Yeni E-posta</span>
        </button>
      </div>
      
      {/* 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel - Sidebar */}
        <EmailSidebar
          filter={filter}
          onFilterChange={(newFilter) => {
            setFilter(newFilter);
            setPage(1); // Reset to page 1 when filter changes
          }}
          counts={counts}
        />
        
        {/* Orta Panel - Email List */}
        <EmailList
          emails={emails}
          loading={loading}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          onToggleStar={handleToggleStar}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
        
        {/* Sağ Panel - Email Detail */}
        <EmailDetail
          email={selectedEmail}
          onDelete={handleDeleteEmail}
          onRefresh={fetchEmails}
          customerId={customerId}
          customer={customer}
        />
      </div>
      
      {/* Email Composer Modal */}
      {showComposer && (
        <EmailComposer
          customerId={customerId}
          customer={customer}
          onClose={() => setShowComposer(false)}
          onSent={handleEmailSent}
        />
      )}
    </div>
  );
};

export default EmailPage;
