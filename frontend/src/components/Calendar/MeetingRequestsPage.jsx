import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Video, Users, Calendar, Plus, Check, X, Clock3, Search, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import MeetingDetailsModal from './MeetingDetailsModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MeetingRequestsPage = ({ currentUser = { id: 'demo_user', name: 'Demo User' } }) => {
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    subject: '',
    date: '',
    start_time: '',
    end_time: '',
    meeting_type: 'physical',
    location: '',
    platform: 'Zoom',
    meeting_link: '',
    attendee_ids: []
  });

  // System users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'sent', 'received'
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const platformOptions = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'WebEx'];

  // Load meeting requests
  const loadMeetingRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/meeting-requests?user_id=${currentUser.id}`);
      if (response.ok) {
        const requests = await response.json();
        
        // Filter out past meetings - only show today and future meetings
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const filteredRequests = requests.filter(request => {
          const requestDate = new Date(request.date);
          return requestDate >= today;
        });
        
        setMeetingRequests(filteredRequests);
        console.log(`✅ Loaded ${filteredRequests.length} upcoming meetings (filtered ${requests.length - filteredRequests.length} past meetings)`);
      }
    } catch (error) {
      console.error('Error loading meeting requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load system users  
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Initialize users if needed
      await fetch(`${BACKEND_URL}/api/users/initialize`, { method: 'POST' });
      
      const response = await fetch(`${BACKEND_URL}/api/users`);
      if (response.ok) {
        const usersData = await response.json();
        // Filter out current user
        const filteredUsers = usersData.filter(user => user.id !== currentUser.id);
        setUsers(filteredUsers);
        console.log(`Loaded ${filteredUsers.length} company employees`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadMeetingRequests();
    loadUsers();
  }, []);

  // Create meeting request
  const handleCreateRequest = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/meeting-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestForm,
          organizer_id: currentUser.id
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setRequestForm({
          subject: '',
          date: '',
          start_time: '',
          end_time: '',
          meeting_type: 'physical',
          location: '',
          platform: 'Zoom',
          meeting_link: '',
          attendee_ids: []
        });
        loadMeetingRequests();
      }
    } catch (error) {
      console.error('Error creating meeting request:', error);
    }
  };

  // Response state management
  const [responseLoading, setResponseLoading] = useState(null);
  const [responseMessage, setResponseMessage] = useState(null);

  // Respond to meeting request
  const handleResponse = async (requestId, response) => {
    setResponseLoading(requestId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          response: response
        })
      });

      if (res.ok) {
        const result = await res.json();
        setResponseMessage({
          type: 'success',
          text: result.message || 'Yanıtınız başarıyla kaydedildi'
        });
        loadMeetingRequests(); // Reload to reflect changes
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setResponseMessage(null);
        }, 3000);
      } else {
        throw new Error('Response failed');
      }
    } catch (error) {
      console.error('Error responding to meeting request:', error);
      setResponseMessage({
        type: 'error',
        text: 'Yanıtınız kaydedilemedi. Lütfen tekrar deneyin.'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setResponseMessage(null);
      }, 3000);
    } finally {
      setResponseLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5); // HH:MM format
  };

  const getResponseColor = (response) => {
    switch (response) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'maybe': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter meeting requests based on active tab
  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'sent':
        return meetingRequests.filter(request => request.organizer_id === currentUser.id);
      case 'received':
        return meetingRequests.filter(request => 
          request.organizer_id !== currentUser.id && 
          request.attendee_ids.includes(currentUser.id)
        );
      default:
        return meetingRequests;
    }
  };

  const filteredRequests = getFilteredRequests();

  // Count requests for tab badges
  const getRequestCounts = () => {
    const sent = meetingRequests.filter(request => request.organizer_id === currentUser.id).length;
    const received = meetingRequests.filter(request => 
      request.organizer_id !== currentUser.id && 
      request.attendee_ids.includes(currentUser.id)
    ).length;
    const pendingReceived = meetingRequests.filter(request => 
      request.organizer_id !== currentUser.id && 
      request.attendee_ids.includes(currentUser.id) &&
      (!request.responses || !request.responses[currentUser.id])
    ).length;
    
    return { sent, received, pendingReceived, total: meetingRequests.length };
  };

  const counts = getRequestCounts();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Toplantı Talepleri</h1>
              <p className="text-gray-600 mt-1">Gelen ve gönderilen toplantı taleplerini yönetin</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Toplantı Talebi
          </Button>
        </div>
      </div>

      {/* Response Message */}
      {responseMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          responseMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {responseMessage.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <span>{responseMessage.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Card className="mb-8">
        <CardHeader className="pb-0">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Tüm Talepler</span>
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                  {counts.total}
                </Badge>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'received'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Gelen Davetler</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                  {counts.received}
                </Badge>
                {counts.pendingReceived > 0 && (
                  <Badge variant="destructive" className="bg-red-100 text-red-600">
                    {counts.pendingReceived} Bekliyor
                  </Badge>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'sent'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Gönderdiğim Talepler</span>
                <Badge variant="secondary" className="bg-green-100 text-green-600">
                  {counts.sent}
                </Badge>
              </div>
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Meeting Requests List */}
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Toplantı talepleri yükleniyor...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                {activeTab === 'received' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Gelen Davet Yok</h3>
                    <p className="text-gray-500 mb-2">Size gönderilen toplantı daveti bulunmuyor</p>
                    <p className="text-gray-400 text-sm">Birisi size toplantı daveti gönderdiğinde burada görüntülenecektir</p>
                  </div>
                )}
                {activeTab === 'sent' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Talep Yok</h3>
                    <p className="text-gray-500 mb-2">Henüz toplantı talebi göndermediniz</p>
                    <p className="text-gray-400 text-sm">Yeni bir toplantı talebi oluşturmak için yukarıdaki butonu kullanın</p>
                  </div>
                )}
                {activeTab === 'all' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Toplantı Talebi Yok</h3>
                    <p className="text-gray-500">Henüz hiç toplantı talebi bulunmuyor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl text-gray-900">
                      {request.subject}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Detaylar
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Organize Eden: <strong>{request.organizer_name}</strong></span>
                    <span className="mx-2">•</span>
                    <span>{new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Meeting Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Date and Time */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Tarih</p>
                          <p className="font-semibold text-gray-900">{formatDate(request.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Saat</p>
                          <p className="font-semibold text-gray-900">
                            {formatTime(request.start_time)} - {formatTime(request.end_time)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location/Platform */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${request.meeting_type === 'physical' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                          {request.meeting_type === 'physical' ? (
                            <MapPin className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Video className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {request.meeting_type === 'physical' ? 'Konum' : 'Platform'}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {request.meeting_type === 'physical' ? request.location : request.platform}
                          </p>
                        </div>
                      </div>
                      
                      {/* Meeting Link - Only for virtual meetings */}
                      {request.meeting_type === 'virtual' && request.meeting_link && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Toplantı Linki</p>
                            <a
                              href={request.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Toplantıya Katıl
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendees Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Katılımcılar</p>
                        <p className="font-semibold text-gray-900">{request.attendee_names.length} Kişi Davet Edildi</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {request.attendee_names.map((name, index) => {
                        const attendeeId = request.attendee_ids[index];
                        const response = request.responses && request.responses[attendeeId];
                        return (
                          <div key={attendeeId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{name}</span>
                            </div>
                            {response ? (
                              <div>
                                {response.response === 'accepted' && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <Check className="h-3 w-3 mr-1" />
                                    Kabul
                                  </Badge>
                                )}
                                {response.response === 'maybe' && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    <Clock3 className="h-3 w-3 mr-1" />
                                    Belki
                                  </Badge>
                                )}
                                {response.response === 'declined' && (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                    <X className="h-3 w-3 mr-1" />
                                    Reddet
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Bekliyor
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  
                  {/* Action Buttons - Only show if user is not organizer */}
                  {request.organizer_id !== currentUser.id && (
                    <div className="border-t pt-6 mt-6">
                      {/* Current user response status */}
                      {request.responses && request.responses[currentUser.id] ? (
                        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Mevcut Yanıtınız</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {request.responses[currentUser.id].response === 'accepted' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <Check className="h-3 w-3 mr-1" />
                                    Kabul Ettiniz
                                  </Badge>
                                )}
                                {request.responses[currentUser.id].response === 'maybe' && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Clock3 className="h-3 w-3 mr-1" />
                                    Belki Dediniz
                                  </Badge>
                                )}
                                {request.responses[currentUser.id].response === 'declined' && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <X className="h-3 w-3 mr-1" />
                                    Reddettiniz
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-blue-600 mt-1">
                                Yanıtınızı değiştirmek için aşağıdaki butonları kullanabilirsiniz
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <div>
                              <p className="text-sm font-medium text-amber-900">Yanıt Bekleniyor</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Bu toplantı davetine henüz yanıt vermediniz. Lütfen katılım durumunuzu belirtin.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Response Buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleResponse(request.id, 'accepted')}
                          disabled={responseLoading === request.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {responseLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Kabul Et
                        </Button>
                        <Button
                          onClick={() => handleResponse(request.id, 'maybe')}
                          disabled={responseLoading === request.id}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                        >
                          {responseLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Clock3 className="h-4 w-4 mr-2" />
                          )}
                          Belki
                        </Button>
                        <Button
                          onClick={() => handleResponse(request.id, 'declined')}
                          disabled={responseLoading === request.id}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          {responseLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Reddet
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show status if user is organizer */}
                  {request.organizer_id === currentUser.id && (
                    <div className="text-sm text-gray-600 mt-4 pt-4 border-t">
                      <span className="font-medium">Durum:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getResponseColor(request.status)}`}>
                        {request.status === 'pending' ? 'Bekliyor' : request.status}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Yeni Toplantı Talebi</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konu *
                </label>
                <input
                  type="text"
                  value={requestForm.subject}
                  onChange={(e) => setRequestForm({...requestForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toplantı konusunu girin"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    value={requestForm.date}
                    onChange={(e) => setRequestForm({...requestForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Saati *
                  </label>
                  <input
                    type="time"
                    value={requestForm.start_time}
                    onChange={(e) => setRequestForm({...requestForm, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Saati *
                  </label>
                  <input
                    type="time"
                    value={requestForm.end_time}
                    onChange={(e) => setRequestForm({...requestForm, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplantı Türü *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="meeting_type"
                      value="physical"
                      checked={requestForm.meeting_type === 'physical'}
                      onChange={(e) => setRequestForm({...requestForm, meeting_type: e.target.value})}
                      className="mr-2"
                    />
                    Fiziki
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="meeting_type"
                      value="virtual"
                      checked={requestForm.meeting_type === 'virtual'}
                      onChange={(e) => setRequestForm({...requestForm, meeting_type: e.target.value})}
                      className="mr-2"
                    />
                    Sanal
                  </label>
                </div>
              </div>

              {/* Conditional Location/Platform */}
              {requestForm.meeting_type === 'physical' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres *
                  </label>
                  <textarea
                    value={requestForm.location}
                    onChange={(e) => setRequestForm({...requestForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Toplantı adresini girin"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform *
                    </label>
                    <select
                      value={requestForm.platform}
                      onChange={(e) => setRequestForm({...requestForm, platform: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {platformOptions.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Toplantı Linki
                    </label>
                    <input
                      type="url"
                      value={requestForm.meeting_link}
                      onChange={(e) => setRequestForm({...requestForm, meeting_link: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://zoom.us/j/123456789 veya Google Meet linki"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Toplantı linkinizi buraya kopyalayın. Katılımcılar bu linke tıklayarak toplantıya katılabilecek.
                    </p>
                  </div>
                </div>
              )}

              {/* Attendees */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Katılımcılar ({requestForm.attendee_ids.length} kişi seçildi)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestForm({
                          ...requestForm,
                          attendee_ids: users.map(user => user.id)
                        });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Tümünü Seç
                    </button>
                    <span className="text-xs text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestForm({
                          ...requestForm,
                          attendee_ids: []
                        });
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Tümünü Temizle
                    </button>
                  </div>
                </div>

                {/* Search box */}
                <div className="mb-2 relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Kullanıcı ara (ad, email, departman)..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                {isLoadingUsers ? (
                  <div className="text-sm text-gray-500 py-4">Kullanıcılar yükleniyor...</div>
                ) : (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                    {users.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        Sistem kayıtlı kullanıcı bulunamadı
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {(() => {
                          const filteredUsers = users.filter(user => {
                            if (!userSearchTerm) return true;
                            const searchLower = userSearchTerm.toLowerCase();
                            return (
                              user.name.toLowerCase().includes(searchLower) ||
                              user.email.toLowerCase().includes(searchLower) ||
                              (user.department && user.department.toLowerCase().includes(searchLower))
                            );
                          });

                          // Group by department
                          const groupedUsers = filteredUsers.reduce((groups, user) => {
                            const dept = user.department || 'Diğer';
                            if (!groups[dept]) groups[dept] = [];
                            groups[dept].push(user);
                            return groups;
                          }, {});

                          return Object.keys(groupedUsers).sort().map(department => (
                            <div key={department} className="mb-3">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                                {department}
                              </div>
                              {groupedUsers[department].map(user => (
                          <label key={user.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={requestForm.attendee_ids.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRequestForm({
                                    ...requestForm,
                                    attendee_ids: [...requestForm.attendee_ids, user.id]
                                  });
                                } else {
                                  setRequestForm({
                                    ...requestForm,
                                    attendee_ids: requestForm.attendee_ids.filter(id => id !== user.id)
                                  });
                                }
                              }}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    {user.email}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium text-gray-700">
                                    {user.department}
                                  </p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {user.role === 'admin' ? '👑 Yönetici' : 
                                     user.role === 'manager' ? '📋 Müdür' : 
                                     '👤 Çalışan'}
                                  </p>
                                </div>
                              </div>
                              {user.phone && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {user.phone}
                                </p>
                              )}
                            </div>
                          </label>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected users summary */}
                {requestForm.attendee_ids.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <p className="text-xs text-blue-700 font-medium mb-1">Seçilen Katılımcılar:</p>
                    <div className="flex flex-wrap gap-1">
                      {requestForm.attendee_ids.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                          <span
                            key={userId}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                          >
                            {user.name}
                            <button
                              onClick={() => {
                                setRequestForm({
                                  ...requestForm,
                                  attendee_ids: requestForm.attendee_ids.filter(id => id !== userId)
                                });
                              }}
                              className="ml-1 hover:text-blue-600"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!requestForm.subject || !requestForm.date || !requestForm.start_time || !requestForm.end_time}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Toplantı Talebi Oluştur
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        currentUser={currentUser}
        onResponseSuccess={(response, message) => {
          // Reload meeting requests to reflect changes
          loadMeetingRequests();
          // Show success message
          setResponseMessage({
            type: 'success',
            text: message
          });
          
          // Clear message after 3 seconds
          setTimeout(() => {
            setResponseMessage(null);
          }, 3000);
        }}
      />
    </div>
  );
};

export default MeetingRequestsPage;