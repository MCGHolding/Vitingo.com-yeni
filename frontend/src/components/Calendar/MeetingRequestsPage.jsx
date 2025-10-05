import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Video, Users, Calendar, Plus, Check, X, Clock3, Search } from 'lucide-react';

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
    attendee_ids: []
  });

  // System users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const platformOptions = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'WebEx'];

  // Load meeting requests
  const loadMeetingRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/meeting-requests?user_id=${currentUser.id}`);
      if (response.ok) {
        const requests = await response.json();
        setMeetingRequests(requests);
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
      const response = await fetch(`${BACKEND_URL}/api/users`);
      if (response.ok) {
        const usersData = await response.json();
        // Filter out current user
        const filteredUsers = usersData.filter(user => user.id !== currentUser.id);
        setUsers(filteredUsers);
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
          attendee_ids: []
        });
        loadMeetingRequests();
      }
    } catch (error) {
      console.error('Error creating meeting request:', error);
    }
  };

  // Respond to meeting request
  const handleResponse = async (requestId, response) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          response: response,
          user_id: currentUser.id
        })
      });

      if (res.ok) {
        loadMeetingRequests(); // Reload to reflect changes
      }
    } catch (error) {
      console.error('Error responding to meeting request:', error);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Toplantı Talepleri</h1>
            <p className="text-gray-600">Gelen ve gönderilen toplantı taleplerini yönetin</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Toplantı Talebi</span>
        </button>
      </div>

      {/* Meeting Requests List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Toplantı talepleri yükleniyor...</div>
          </div>
        ) : meetingRequests.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henüz toplantı talebi yok</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {meetingRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Meeting Subject */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {request.subject}
                    </h3>

                    {/* Meeting Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Date and Time */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Tarih: {formatDate(request.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            Saat: {formatTime(request.start_time)} - {formatTime(request.end_time)}
                          </span>
                        </div>
                      </div>

                      {/* Location/Platform */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {request.meeting_type === 'physical' ? (
                            <>
                              <MapPin className="h-4 w-4" />
                              <span>Fiziki: {request.location}</span>
                            </>
                          ) : (
                            <>
                              <Video className="h-4 w-4" />
                              <span>Sanal: {request.platform}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Katılımcılar: {request.attendee_names.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Organizer Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                      <span>Organize Eden: {request.organizer_name}</span>
                      <span>•</span>
                      <span>{new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>

                    {/* Action Buttons - Only show if user is not organizer */}
                    {request.organizer_id !== currentUser.id && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleResponse(request.id, 'accepted')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          <Check className="h-3 w-3" />
                          <span>Kabul</span>
                        </button>
                        <button
                          onClick={() => handleResponse(request.id, 'maybe')}
                          className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                        >
                          <Clock3 className="h-3 w-3" />
                          <span>Belki</span>
                        </button>
                        <button
                          onClick={() => handleResponse(request.id, 'declined')}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          <X className="h-3 w-3" />
                          <span>Reddet</span>
                        </button>
                      </div>
                    )}

                    {/* Show status if user is organizer */}
                    {request.organizer_id === currentUser.id && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Durum:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getResponseColor(request.status)}`}>
                          {request.status === 'pending' ? 'Bekliyor' : request.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
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
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Kullanıcı ara (ad, email, departman)..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                  <p className="text-xs text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-600">
                                    {user.department}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {user.role}
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
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={!requestForm.subject || !requestForm.date || !requestForm.start_time || !requestForm.end_time}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md"
                >
                  Toplantı Talebi Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRequestsPage;