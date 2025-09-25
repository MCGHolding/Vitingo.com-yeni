import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { 
  X,
  Users,
  User,
  Crown,
  Briefcase,
  UserCheck,
  Loader2,
  Shield
} from 'lucide-react';

export default function UserSwitchModal({ onClose }) {
  const { switchUser, getAvailableUsers, getRoleName } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const availableUsers = getAvailableUsers();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'sales_manager': return Briefcase;
      case 'sales_rep': return UserCheck;
      default: return User;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'sales_manager': return 'bg-blue-100 text-blue-800';
      case 'sales_rep': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUserSwitch = async (userId) => {
    setLoading(true);
    setSelectedUserId(userId);

    try {
      await switchUser(userId);
      const switchedUser = availableUsers.find(u => u.id === userId);
      
      toast({
        title: "Kullanıcı Değiştirildi",
        description: `${switchedUser.fullName} olarak oturum açıldı.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSelectedUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span>Kullanıcı Değiştir</span>
                <Badge className="bg-white/20 text-white">Admin Yetkisi</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Kullanılabilir Kullanıcılar</h3>
              </div>
              <p className="text-sm text-gray-600">
                Admin yetkileriyle şifre girmeden diğer kullanıcı hesaplarına geçiş yapabilirsiniz.
              </p>
            </div>

            <div className="space-y-4">
              {availableUsers.map((targetUser) => {
                const RoleIcon = getRoleIcon(targetUser.role);
                const isLoading = loading && selectedUserId === targetUser.id;
                
                return (
                  <div
                    key={targetUser.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {targetUser.avatar ? (
                            <img 
                              src={targetUser.avatar} 
                              alt="Avatar" 
                              className="h-12 w-12 rounded-full object-cover" 
                            />
                          ) : (
                            <User className="h-6 w-6 text-white" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{targetUser.fullName}</h4>
                            <Badge className={getRoleBadgeColor(targetUser.role)}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {getRoleName(targetUser.role)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{targetUser.email}</p>
                          <p className="text-xs text-gray-500">
                            Departman: {targetUser.department} • Kullanıcı Adı: {targetUser.username}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleUserSwitch(targetUser.id)}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Geçiliyor...
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Geç
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {availableUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Kullanıcı Bulunamadı</h3>
                <p className="text-gray-600">Geçiş yapılabilecek kullanıcı bulunmuyor.</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Bu özellik sadece admin kullanıcıları tarafından kullanılabilir.
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Kapat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}