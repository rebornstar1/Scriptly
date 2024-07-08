// src/components/modals/ShareModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Search, Trash2, Users, Globe, Lock } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Collaborator {
  user: User;
  permission: 'read' | 'write' | 'admin';
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onUpdate?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen, onClose, documentId, documentTitle, onUpdate
}) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<User | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const getUserDisplayName = (user: User) =>
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username;

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:3001/api/documents/${documentId}/collaborators`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCollaborators(res.data.collaborators || []);
      setOwner(res.data.owner);
      setIsPublic(res.data.isPublic || false);
    } catch (err) {
      toast.error('Failed to load collaborators');
      console.error(err);
    }
  }, [documentId, token]);

  const searchUsers = useCallback(async () => {
    if (searchQuery.length < 2) return setSearchResults([]);
    setSearchLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/auth/users/search?query=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, token]);

  useEffect(() => {
    if (isOpen) fetchCollaborators();
  }, [isOpen, fetchCollaborators]);

  useEffect(() => {
    searchUsers();
  }, [searchQuery, searchUsers]);

  const shareWithUser = async (user: User, permission: 'read' | 'write' | 'admin') => {
    setLoading(true);
    try {
      await axios.post(
        `http://localhost:3001/api/documents/${documentId}/share`,
        { email: user.email, permission },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Shared with ${user.username}`);
      setSearchQuery('');
      setSearchResults([]);
      fetchCollaborators();
      onUpdate?.();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to share';
      toast.error(msg || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (userId: string, permission: 'read' | 'write' | 'admin') => {
    try {
      await axios.put(
        `http://localhost:3001/api/documents/${documentId}/collaborators/${userId}`,
        { permission },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Permissions updated');
      fetchCollaborators();
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to update permissions');
    }
  };

  const removeCollaborator = async (userId: string) => {
    try {
      await axios.delete(
        `http://localhost:3001/api/documents/${documentId}/collaborators/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Collaborator removed');
      fetchCollaborators();
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to remove collaborator');
    }
  };

  const toggleVisibility = async () => {
    try {
      await axios.put(
        `http://localhost:3001/api/documents/${documentId}/visibility`,
        { isPublic: !isPublic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsPublic(!isPublic);
      toast.success(`Document is now ${!isPublic ? 'public' : 'private'}`);
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>{documentTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-1 space-y-6">
          {/* Visibility */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex gap-2 items-center">
                    {isPublic ? (
                      <Globe className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-600" />
                    )}
                    <h3 className="font-medium">Document Visibility</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPublic ? 'Anyone can view this document' : 'Only collaborators can access'}
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={toggleVisibility} />
              </div>
            </CardContent>
          </Card>

          {/* Search Users */}
          <div className="space-y-3">
            <h3 className="font-medium">Add People</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, username, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <Card>
                <CardContent className="p-0 max-h-32 overflow-y-auto scrollbar-modal">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getUserDisplayName(user)[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{getUserDisplayName(user)}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {['read', 'write', 'admin'].map((level) => (
                          <Button
                            key={level}
                            size="sm"
                            variant="outline"
                            onClick={() => shareWithUser(user, level as 'read' | 'write' | 'admin')}
                            disabled={loading}
                            className="text-xs"
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Collaborators */}
          <div className="space-y-3">
            <h3 className="font-medium">People with access</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-modal">
              {owner && (
                <Card>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserDisplayName(owner)[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{getUserDisplayName(owner)} (You)</p>
                        <p className="text-xs text-muted-foreground">{owner.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Owner</Badge>
                  </CardContent>
                </Card>
              )}

              {collaborators.map(({ user, permission }) => (
                <Card key={user._id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserDisplayName(user)[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{getUserDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={permission}
                        onValueChange={(value) => updatePermission(user._id, value as any)}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCollaborator(user._id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {collaborators.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    No collaborators yet. Use the search above to add people.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
