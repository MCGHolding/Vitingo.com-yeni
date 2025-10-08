import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  X, 
  FileText,
  Clock,
  User,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function NotesHistoryModal({ isOpen, onClose, opportunityId, opportunityTitle, onAddNew }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notes when modal opens
  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchNotes();
    }
  }, [isOpen, opportunityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/opportunities/${opportunityId}/notes`);
      
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      } else {
        throw new Error('Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Show sample notes for demo purposes
      setSampleNotes();
    } finally {
      setLoading(false);
    }
  };

  const setSampleNotes = () => {
    const sampleNotes = [
      {
        id: '1',
        content: 'Müşteri ile ilk görüşme yapıldı. Stand boyutu konusunda kararsızlar. 3x6 veya 3x9 arasında seçim yapacaklar.',
        author: 'Murat Bucak',
        created_at: '2024-10-08T10:30:00Z',
        updated_at: '2024-10-08T10:30:00Z'
      },
      {
        id: '2',
        content: 'Tasarım önerilerini sundum. Özellikle LED aydınlatma ve interaktif ekran konusunda olumlu geribildirim aldım.',
        author: 'Murat Bucak',
        created_at: '2024-10-07T14:15:00Z',
        updated_at: '2024-10-07T14:15:00Z'
      },
      {
        id: '3',
        content: 'Fiyat teklifi hazırlandı ve müşteriye gönderildi. 48 saat içinde geri dönüş bekleniyor.',
        author: 'Murat Bucak',
        created_at: '2024-10-06T09:45:00Z',
        updated_at: '2024-10-06T09:45:00Z'
      },
      {
        id: '4',
        content: 'Müşteri bütçe konusunda tereddütlü. Alternatif çözüm seçenekleri sunuldu.',
        author: 'Murat Bucak',
        created_at: '2024-10-05T16:20:00Z',
        updated_at: '2024-10-05T16:20:00Z'
      }
    ];
    setNotes(sampleNotes);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} hafta önce`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ay önce`;
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/opportunities/${opportunityId}/notes/${noteId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setNotes(notes.filter(note => note.id !== noteId));
          toast({
            title: "Başarılı",
            description: "Not başarıyla silindi",
          });
        } else {
          throw new Error('Failed to delete note');
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        toast({
          title: "Hata",
          description: "Not silinirken hata oluştu",
          variant: "destructive"
        });
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[85vh] bg-white shadow-2xl flex flex-col">
        
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Gelişmeler & Notlar</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onAddNew}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Not</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-blue-600 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Opportunity info */}
          <div className="mt-2 text-blue-100 text-sm">
            <p className="font-medium">{opportunityTitle}</p>
            <p className="text-xs opacity-75">Toplam {notes.length} not</p>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-2 text-gray-600">Notlar yükleniyor...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz not eklenmemiş</h3>
                <p className="text-gray-600 mb-4">Bu fırsat için ilk notu eklemek üzere "Yeni Not" butonuna tıklayın.</p>
                <Button onClick={onAddNew} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Notu Ekle
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-6 space-y-6">
                {notes.map((note, index) => (
                  <div key={note.id} className="relative">
                    
                    {/* Timeline line */}
                    {index !== notes.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                    )}
                    
                    {/* Note card */}
                    <div className="flex space-x-4">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      
                      {/* Note content */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{note.author}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(note.created_at)}</span>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                              {getTimeAgo(note.created_at)}
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-blue-100"
                              onClick={() => console.log('Edit note:', note.id)}
                            >
                              <Edit3 className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-100"
                              onClick={() => handleDelete(note.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Note content */}
                        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </div>
                        
                        {/* Update indicator */}
                        {note.updated_at !== note.created_at && (
                          <div className="mt-2 text-xs text-gray-400 italic">
                            Düzenlendi: {formatDate(note.updated_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}