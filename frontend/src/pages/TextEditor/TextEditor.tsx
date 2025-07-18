import { useCallback } from "react";
import { useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

import { useParams } from "react-router-dom";
import "./TextEditor.css";

import { io, Socket } from "socket.io-client";
import { useAuth } from "../../hooks/useAuth";
import ShareModal from "../../components/sharing/ShareModal";
import ChatPanel from "../../components/chat/ChatPanel";
import VersionHistory from "../../components/VersionHistory/VersionHistory";
import { Button } from "../../components/ui/button";
import { Share, MessageCircle, RotateCcw, Eye } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'https://scriptly-eglj.onrender.com';

interface DocumentData {
  data?: unknown;
  title?: string;
  owner?: unknown;
  collaborators?: unknown[];
  isPublic?: boolean;
}

interface VersionData {
  content: unknown;
  title: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
}

const TextEditor = () => {
  const { id: documentId } = useParams();
  const { token, user } = useAuth();

  console.log("Document ID:", documentId);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [quill, setQuill] = useState<Quill | null>(null);
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Version control states
  const [currentVersion, setCurrentVersion] = useState<VersionData | null>(null);
  const [isViewingVersion, setIsViewingVersion] = useState(false);
  const [originalContent, setOriginalContent] = useState<unknown>(null);
  const [originalTitle, setOriginalTitle] = useState<string>("");

  // Auto-save functionality
  useEffect(() => {
    if (socket === null || quill === null || isViewingVersion) return;

    const interval = setInterval(() => {
      socket.emit("save-document", {
        data: quill.getContents(),
        title: documentTitle,
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill, documentTitle, isViewingVersion]);

  // Load document
  useEffect(() => {
    if (quill === null || socket === null) return;

    socket.once("load-document", (document: DocumentData) => {
      if (document.data) {
        quill.setContents(document.data as any || "");
        setOriginalContent(document.data);
      }
      setDocumentTitle(document.title || "Untitled Document");
      setOriginalTitle(document.title || "Untitled Document");
      quill.enable();
    });

    socket.emit("get-document", documentId, documentTitle);

    return () => {};
  }, [documentId, quill, socket]);

  // Initialize socket
  useEffect(() => {
    const socketOptions = {
      auth: {} as Record<string, string>
    };
    
    if (token) {
      socketOptions.auth.token = token;
    }

    const socket = io(`${API_URL}`, socketOptions);
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Handle version control events
  useEffect(() => {
    if (socket === null || quill === null) return;

    const handleVersionLoaded = (versionData: VersionData) => {
      if (quill) {
        // Save current state before loading version
        setOriginalContent(quill.getContents());
        setOriginalTitle(documentTitle);
        
        // Load the version content
        quill.setContents(versionData.content as any);
        setDocumentTitle(versionData.title);
        setCurrentVersion(versionData);
        setIsViewingVersion(true);
        
        // Disable editing when viewing a version
        quill.disable();
      }
    };

    socket.on('version-loaded', handleVersionLoaded);

    return () => {
      socket.off('version-loaded', handleVersionLoaded);
    };
  }, [socket, quill, documentTitle]);

  // Handle real-time changes
  useEffect(() => {
    if (socket === null || quill === null) return;

    const handler = (delta: any) => {
      if (!isViewingVersion) {
        quill.updateContents(delta);
      }
    };
    socket.on("receive-changes", handler);
    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill, isViewingVersion]);

  useEffect(() => {
    if (socket === null || quill === null || isViewingVersion) return;

    const handler = (delta: any, _oldDelta: any, source: string) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill, isViewingVersion]);

  // Version control functions
  const exitVersionView = () => {
    if (socket && quill && originalContent) {
      // Re-enable editing
      quill.enable();
      setIsViewingVersion(false);
      setCurrentVersion(null);
      
      // Restore original content
      quill.setContents(originalContent as any);
      setDocumentTitle(originalTitle);
    }
  };

  const restoreVersion = () => {
    if (currentVersion && socket && quill) {
      // Save the version content as the current document
      const data = quill.getContents();
      socket.emit("save-document", { data, title: currentVersion.title });
      
      // Exit version view
      setIsViewingVersion(false);
      setCurrentVersion(null);
      quill.enable();
      
      // Update states
      setOriginalContent(data);
      setOriginalTitle(currentVersion.title);
    }
  };

  // Test function to create manual version
  const createManualVersion = () => {
    if (socket && quill) {
      const content = quill.getContents();
      console.log('Creating manual version with content:', content);
      socket.emit('create-version', {
        title: documentTitle,
        content: content,
        description: 'Manual version created for testing'
      });
    }
  };

  const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
    if (wrapper === null) return;

    wrapper.innerHTML = "";

    const editor = document.createElement("div");
    wrapper.append(editor);

    const quillInstance = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: [] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          ["blockquote", "code-block"],
          [{ script: "sub" }, { script: "super" }],
          ["link"],
        ],
      },
    });

    quillInstance.setText("Loading...");
    quillInstance.disable();
    quillInstance.setText("");

    setQuill(quillInstance);
  }, []);

  if (!documentId) {
    return <div>Document ID not found</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Version viewing banner */}
      {isViewingVersion && currentVersion && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700/50 px-6 py-2 z-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Viewing Version {currentVersion.versionNumber} - {new Date(currentVersion.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={restoreVersion}
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Restore This Version</span>
              </Button>
              <Button
                onClick={exitVersionView}
                size="sm"
                variant="outline"
              >
                Back to Current
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with editable title and share button */}
      <div className="bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-b border-border/50 shadow-sm backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-3 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Editable Document Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                onBlur={() => {
                  if (socket && quill && !isViewingVersion) {
                    socket.emit("save-document", {
                      data: quill.getContents(),
                      title: documentTitle,
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="text-xl font-bold bg-transparent border-none outline-none focus:bg-white focus:px-3 focus:py-1 focus:rounded-lg focus:shadow-sm transition-all duration-200 min-w-0 w-full max-w-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Untitled Document"
                spellCheck={false}
                disabled={isViewingVersion}
              />
            </div>
            
            {/* Document Status Indicator */}
            <div className="flex items-center gap-2 mx-3 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isViewingVersion ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
              <span className="hidden sm:inline">
                {isViewingVersion ? 'Viewing Version' : 'Auto-saved'}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={createManualVersion}
              size="sm"
              variant="outline"
              className="gap-2 hidden sm:flex"
            >
              <RotateCcw className="h-4 w-4" />
              Save Version
            </Button>
            
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              size="sm"
              variant={isChatOpen ? "default" : "outline"}
              className="gap-2 transition-all duration-200 hover:shadow-md"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              onClick={() => setIsShareModalOpen(true)}
              size="sm"
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Share className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Editor and Version History */}
      <div className="flex flex-1 overflow-hidden bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 dark:from-gray-900/50 dark:via-gray-900 dark:to-blue-950/30">
        {/* Editor Container */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Editor with improved styling */}
            <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl border overflow-hidden backdrop-blur-sm ${
              isViewingVersion ? 'border-yellow-200 dark:border-yellow-700' : 'border-gray-200/50 dark:border-gray-700/50'
            }`}>
              <div id="container" ref={wrapperRef} className="min-h-[70vh]" />
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Version History - Fixed to properly display inside the sidebar */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-hidden hidden lg:flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <RotateCcw className="h-4 w-4 mr-2" />
              Version History
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <VersionHistory socket={socket} documentId={documentId || ''} />
          </div>
        </div>
      </div>
      
      {/* Enhanced Status bar */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-t border-border/50 px-6 py-2 flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="opacity-70">Doc: {documentId?.substring(0, 8)}...</span>
          {user && (
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className={socket ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
            {socket ? '● Connected' : '○ Disconnected'}
          </span>
          <span className="text-xs opacity-60">
            {isViewingVersion 
              ? `Viewing Version ${currentVersion?.versionNumber}` 
              : `Last saved: ${new Date().toLocaleTimeString()}`}
          </span>
        </div>
      </div>

      {/* Mobile Version History (only shows on smaller screens) - Updated for better mobile display */}
      <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 max-h-60 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <RotateCcw className="h-4 w-4 mr-2" />
            Version History
          </h3>
        </div>
        <VersionHistory socket={socket} documentId={documentId || ''} />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={documentId}
        documentTitle={documentTitle}
        onUpdate={() => {}}
      />

      {/* Chat Panel */}
      <ChatPanel
        socket={socket}
        currentUser={user}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
};

export default TextEditor;