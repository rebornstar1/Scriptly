import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import ShareModal from "../../components/sharing/ShareModal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Skeleton } from "../../components/ui/skeleton";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { AlertCircle, FileText, Plus, Search, Edit, Share, Trash2, Globe, Calendar, Check, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'https://scriptly-eglj.onrender.com';

interface Document {
  _id: string;
  title: string;
  owner?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  collaborators?: Array<{
    user: {
      _id: string;
      username: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    permission: string;
  }>;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<Document | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/documents`);
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents. Please try again later.");
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to create documents");
      return;
    }

    const loadingToast = toast.loading("Creating new document...");
    try {
      const response = await axios.post(`${API_URL}/api/documents`, {
        title: `Untitled Document - ${Math.floor(Math.random() * 900 + 100)}`,
      });
      toast.dismiss(loadingToast);
      toast.success("Document created successfully");
      navigate(`/documents/${response.data._id}`);
    } catch (err: unknown) {
      console.error("Error creating document:", err);
      toast.dismiss(loadingToast);
      const errorResponse = err as { response?: { status?: number } };
      if (errorResponse.response?.status === 401) {
        toast.error("Please sign in to create documents");
      } else {
        toast.error("Failed to create document");
      }
      setError("Failed to create a new document. Please try again.");
    }
  };

  const openDeleteModal = (doc: Document, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    const loadingToast = toast.loading("Deleting document...");
    try {
      await axios.delete(`${API_URL}/api/documents/${documentToDelete._id}`);
      setDocuments(documents.filter((doc) => doc._id !== documentToDelete._id));
      toast.dismiss(loadingToast);
      toast.success("Document deleted successfully");
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to delete document");
      setError("Failed to delete the document. Please try again.");
    } finally {
      closeDeleteModal();
    }
  };

  // Share modal handlers
  const openShareModal = (doc: Document, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentToShare(doc);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setDocumentToShare(null);
  };

  // Start editing a document title
  const handleStartRename = (doc: Document, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(doc._id);
    setEditTitle(doc.title || "Untitled Document");
  };

  // Save the updated document title
  const handleSaveRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editTitle.trim()) {
      setEditTitle("Untitled Document");
    }

    const loadingToast = toast.loading("Updating document title...");
    try {
      await axios.patch(`${API_URL}/api/documents/${id}/title`, {
        title: editTitle.trim() || "Untitled Document",
      });

      // Update local state
      setDocuments(
        documents.map((doc) =>
          doc._id === id
            ? { ...doc, title: editTitle.trim() || "Untitled Document" }
            : doc
        )
      );

      // Exit edit mode
      setEditingId(null);
      toast.dismiss(loadingToast);
      toast.success("Document renamed successfully");
    } catch (err) {
      console.error("Error renaming document:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to rename document");
      setError("Failed to rename the document. Please try again.");
    }
  };

  // Cancel renaming
  const handleCancelRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
    toast.dismiss();
  };

  // Handle keyboard events during rename
  const handleRenameKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename(id, e);
    } else if (e.key === "Escape") {
      handleCancelRename(e as unknown as React.MouseEvent);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if user can edit/delete a document
  const canUserEditDocument = (doc: Document) => {
    if (!isAuthenticated || !user) return false;

    // User is the owner
    if (doc.owner && doc.owner._id === user.id) return true;

    // User is a collaborator with write/admin permission
    if (doc.collaborators) {
      const collaboration = doc.collaborators.find(collab => collab.user._id === user.id);
      if (collaboration && ['write', 'admin'].includes(collaboration.permission)) {
        return true;
      }
    }

    // Legacy documents without owner (for backward compatibility)
    if (!doc.owner) return true;

    return false;
  };

  const getDocumentOwnerDisplay = (doc: Document) => {
    if (doc.owner) {
      return doc.owner.firstName
        ? `${doc.owner.firstName} ${doc.owner.lastName || ''}`.trim()
        : doc.owner.username;
    }
    return null;
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-gray-100 py-8 px-4 sm:px-6">
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: "#1E3A31",
              color: "#86EFAC",
              borderLeft: "4px solid #22C55E",
            },
          },
          error: {
            style: {
              background: "#3A1E1E",
              color: "#FCA5A5",
              borderLeft: "4px solid #EF4444",
            },
          },
          loading: {
            style: {
              background: "#1E293A",
              color: "#93C5FD",
              borderLeft: "4px solid #3B82F6",
            },
          },
          duration: 3000,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-100">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Document
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "<span className="font-medium text-gray-300">{documentToDelete?.title || 'Untitled Document'}</span>"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal} className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-900 hover:bg-red-800 text-red-100">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      {documentToShare && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={closeShareModal}
          documentId={documentToShare._id}
          documentTitle={documentToShare.title}
          onUpdate={fetchDocuments}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header with search and create button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              My Documents
            </h1>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents..."
                className="pl-10 w-full bg-gray-800/60 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-blue-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isAuthenticated && (
              <Button
                onClick={handleCreateDocument}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg shadow-blue-900/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 bg-red-900/50 border-red-800 text-red-200" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 bg-gray-700" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24 bg-gray-700" />
                      <Skeleton className="h-4 w-24 bg-gray-700" />
                      <Skeleton className="h-4 w-20 bg-gray-700" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="mt-12 p-8 text-center bg-gray-800/60 border-gray-700 shadow-xl backdrop-blur-sm">
            <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
              <FileText className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-1">
              No documents found
            </h3>
            <p className="text-gray-400 mb-5">
              {searchTerm
                ? "No documents matching your search criteria."
                : "Get started by creating your first document."}
            </p>
            {searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm("")} className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
                Clear search
              </Button>
            ) : (
              <Button onClick={handleCreateDocument} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create a document
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc._id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group bg-gray-800/60 border-gray-700/70 hover:border-blue-700/50 backdrop-blur-sm"
                onClick={() =>
                  editingId !== doc._id && navigate(`/documents/${doc._id}`)
                }
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-900/40 flex items-center justify-center mr-4 text-blue-400">
                          <FileText className="h-6 w-6" />
                        </div>

                        {editingId === doc._id ? (
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              ref={editInputRef}
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => handleRenameKeyDown(doc._id, e)}
                              className="text-lg font-semibold bg-gray-700 border-gray-600 text-gray-100"
                              autoComplete="off"
                            />
                            <Button
                              size="sm"
                              className="ml-2 bg-blue-700 hover:bg-blue-600"
                              onClick={(e) => handleSaveRename(doc._id, e)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={handleCancelRename}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <h2 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                            {doc.title || "Untitled Document"}
                          </h2>
                        )}
                      </div>

                      <div className="mt-2 ml-14 flex flex-wrap items-center text-sm text-gray-400 gap-x-4 gap-y-1">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          Last edited: {formatDate(doc.updatedAt)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          Created: {formatDate(doc.createdAt)}
                        </span>
                        {getDocumentOwnerDisplay(doc) && (
                          <div className="flex items-center">
                            <Avatar className="h-4 w-4 mr-1 bg-gray-700">
                              <AvatarFallback className="text-xs text-gray-300 bg-blue-900/30">
                                {getDocumentOwnerDisplay(doc)?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            Owner: {getDocumentOwnerDisplay(doc)}
                          </div>
                        )}
                        {doc.isPublic && (
                          <Badge variant="secondary" className="text-green-400 bg-green-900/30 border border-green-700/50">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>

                    {editingId !== doc._id && canUserEditDocument(doc) && (
                      <div
                        className="flex items-center space-x-2 sm:justify-end md:opacity-0 md:group-hover:opacity-100 sm:opacity-10 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-400 hover:text-orange-300 bg-orange-900/20 border-orange-800/30 hover:bg-orange-900/40"
                          onClick={(e) => handleStartRename(doc, e)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Rename
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-400 hover:text-blue-300 bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/40"
                          onClick={(e) => openShareModal(doc, e)}
                        >
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openDeleteModal(doc, e)}
                          className="text-red-400 hover:text-red-300 bg-red-900/20 border-red-800/30 hover:bg-red-900/40"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;