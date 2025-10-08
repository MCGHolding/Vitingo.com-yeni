import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { 
  X, 
  Save,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function NewNoteModal({ isOpen, onClose, opportunityId, opportunityTitle }) {
  const { toast } = useToast();
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen not içeriği girin",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // API call to save note
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/opportunities/${opportunityId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: noteContent,
          created_at: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Not başarıyla kaydedildi",
        });
        setNoteContent('');
        onClose();
      } else {
        throw new Error('Note save failed');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Hata",
        description: "Not kaydedilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNoteContent('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-start z-50">
      {/* Modal positioned to left side, max width 50% of screen */}
      <Card className="w-full max-w-2xl h-[90vh] ml-8 bg-white shadow-2xl flex flex-col">
        
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Yeni Not</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-green-600 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Opportunity info */}
          <div className="mt-2 text-green-100 text-sm">
            <p className="font-medium">{opportunityTitle}</p>
            <p className="text-xs opacity-75">Fırsat ID: {opportunityId}</p>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 p-6 flex flex-col">
          
          {/* Note info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Murat Bucak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note content label */}
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Not İçeriği
          </label>

          {/* Expandable textarea */}
          <div className="flex-1 flex flex-col">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Satış fırsatı ile ilgili notlarınızı buraya yazabilirsiniz...

Örnek kullanım alanları:
• Müşteri görüşme notları
• Teknik detaylar
• Fiyat görüşmeleri
• Proje gereksinimleri
• Rakip bilgileri
• Aksiyonlar ve hatırlatmalar"
              className="flex-1 min-h-[300px] resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
              style={{ minHeight: '300px' }}
            />
            
            {/* Character count */}
            <div className="mt-2 text-right text-xs text-gray-500">
              {noteContent.length} karakter
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="px-6"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !noteContent.trim()}
              className="bg-green-600 hover:bg-green-700 px-6 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}