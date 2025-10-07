import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, Users, FileText, Check, Clock3, Ban, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MeetingDetailsModal = ({ isOpen, onClose, request, currentUser, onResponseSuccess }) => {
  const [isResponding, setIsResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  if (!isOpen || !request) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5); // HH:MM format
  };

  const handleResponse = async (response) => {
    setIsResponding(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/meeting-requests/${request.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: request.id,
          response: response,
          message: responseMessage
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (onResponseSuccess) {
          onResponseSuccess(response, result.message);
        }
        onClose();
      } else {
        throw new Error('Response failed');
      }
    } catch (error) {
      console.error('Error responding to meeting request:', error);
      alert('Yanıtınız kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsResponding(false);
    }
  };

  // Check if user already responded
  const userResponse = request.responses && request.responses[currentUser.id];
  const isOrganizer = request.organizer_id === currentUser.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Toplantı Detayları</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {isOrganizer ? 'Organize ettiğiniz toplantı' : 'Size gönderilen toplantı daveti'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Meeting Title */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {request.subject}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Organize Eden: <strong>{request.organizer_name}</strong></span>
                <span>•</span>
                <span>{new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Details Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Toplantı Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date and Time */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Tarih</p>
                  <p className="text-gray-600">{formatDate(request.date)}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Saat</p>
                  <p className="text-gray-600">
                    {formatTime(request.start_time)} - {formatTime(request.end_time)}
                  </p>
                </div>
              </div>
            </div>

            {/* Location/Platform */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                {request.meeting_type === 'physical' ? (
                  <>
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Konum</p>
                      <p className="text-gray-600">{request.location}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Platform</p>
                      <p className="text-gray-600">{request.platform}</p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Meeting Link for Virtual Meetings */}
              {request.meeting_type === 'virtual' && request.meeting_link && (
                <div className="flex items-start space-x-3">
                  <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Toplantı Linki</p>
                    <a
                      href={request.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {request.meeting_link}
                    </a>
                  </div>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Katılımcılar ({request.attendee_names.length} kişi)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {request.attendee_names.map((name, index) => {
                const attendeeId = request.attendee_ids[index];
                const response = request.responses && request.responses[attendeeId];
                
                return (
                  <div key={attendeeId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{name}</span>
                    {response ? (
                      <div className="flex items-center space-x-1">
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
            </CardContent>
          </Card>

          {/* User Response Section - Only show if user is not organizer */}
          {!isOrganizer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yanıtınız</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                {userResponse ? (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-blue-700 font-medium">Mevcut Yanıtınız:</span>
                        {userResponse.response === 'accepted' && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <Check className="h-4 w-4 mr-1" />
                            Kabul Ettiniz
                          </Badge>
                        )}
                        {userResponse.response === 'maybe' && (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            <Clock3 className="h-4 w-4 mr-1" />
                            Belki Dediniz
                          </Badge>
                        )}
                        {userResponse.response === 'declined' && (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            <Ban className="h-4 w-4 mr-1" />
                            Reddettiniz
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-blue-600">
                        Yanıtınızı değiştirmek için aşağıdaki butonları kullanabilirsiniz
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800 font-medium">
                          Bu toplantı davetine henüz yanıt vermediniz
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Lütfen katılım durumunuzu belirtmek için aşağıdaki butonları kullanın
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Optional Response Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yanıt Mesajı (İsteğe bağlı)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Toplantı hakkında bir mesajınız varsa buraya yazabilirsiniz..."
                />
              </div>

              {/* Response Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleResponse('accepted')}
                  disabled={isResponding}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
                >
                  {isResponding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Kabul Et</span>
                </button>
                
                <button
                  onClick={() => handleResponse('maybe')}
                  disabled={isResponding}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
                >
                  {isResponding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Clock3 className="h-4 w-4" />
                  )}
                  <span>Belki</span>
                </button>
                
                <button
                  onClick={() => handleResponse('declined')}
                  disabled={isResponding}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"
                >
                  {isResponding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  <span>Reddet</span>
                </button>
              </div>
            </div>
          )}

          {/* Organizer View - Show Response Summary */}
          {isOrganizer && (
            <div className="border-t pt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Yanıt Özeti</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(request.responses || {}).filter(r => r.response === 'accepted').length}
                    </div>
                    <div className="text-sm text-gray-600">Kabul</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {Object.values(request.responses || {}).filter(r => r.response === 'maybe').length}
                    </div>
                    <div className="text-sm text-gray-600">Belki</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(request.responses || {}).filter(r => r.response === 'declined').length}
                    </div>
                    <div className="text-sm text-gray-600">Reddet</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;