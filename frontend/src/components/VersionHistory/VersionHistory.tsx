import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '../ui/button';
import { History, RefreshCw, Eye, X } from 'lucide-react';
import './VersionHistory.css';

interface Version {
  versionNumber: number;
  title: string;
  createdBy: string;
  createdAt: string;
  changeDescription?: string;
}

interface VersionHistoryProps {
  socket: Socket | null;
  documentId: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ socket, documentId }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socket) {
      setLoading(true);
      console.log('Requesting versions for document:', documentId);
      socket.emit('get-versions');
      
      const handleVersionsList = (versionsList: Version[]) => {
        console.log('Received versions:', versionsList);
        setVersions(versionsList);
        setLoading(false);
      };

      const handleError = (error: { message: string }) => {
        console.error('Version history error:', error);
        setLoading(false);
      };

      const handleDocumentSaved = () => {
        console.log('Document saved, refreshing versions');
        // Refresh versions after document save
        socket.emit('get-versions');
      };

      socket.on('versions-list', handleVersionsList);
      socket.on('error', handleError);
      socket.on('document-saved', handleDocumentSaved);

      return () => {
        socket.off('versions-list', handleVersionsList);
        socket.off('error', handleError);
        socket.off('document-saved', handleDocumentSaved);
      };
    }
  }, [socket, documentId]);

  const loadVersion = (versionNumber: number) => {
    if (socket) {
      console.log('Loading version:', versionNumber);
      socket.emit('load-version', versionNumber);
    }
  };

  const refreshVersions = () => {
    if (socket) {
      console.log('Refreshing versions for document:', documentId);
      setLoading(true);
      socket.emit('get-versions');
    }
  };

  return (
    <div className="version-history-sidebar">
      <div className="version-history-header">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Document Versions</h3>
        <Button
          onClick={refreshVersions}
          size="sm"
          variant="ghost"
          className="p-1 h-7 w-7"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {loading ? (
        <div className="loading">Loading versions...</div>
      ) : versions.length === 0 ? (
        <div className="no-versions">No versions found</div>
      ) : (
        <div className="versions-list">
          {versions.map((version) => (
            <div key={version.versionNumber} className="version-item">
              <div className="version-info">
                <div className="version-title">
                  <strong>Version {version.versionNumber}</strong>
                  {version.title && ` - ${version.title.substring(0, 20)}${version.title.length > 20 ? '...' : ''}`}
                </div>
                <div className="version-meta">
                  <span className="version-date">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                  <div className="version-author">
                    by {version.createdBy}
                  </div>
                </div>
                {version.changeDescription && (
                  <div className="version-description">
                    {version.changeDescription}
                  </div>
                )}
              </div>
              <Button
                onClick={() => loadVersion(version.versionNumber)}
                size="sm"
                className="gap-1 py-1 px-3 h-8"
              >
                <Eye className="h-3 w-3" />
                <span>Load</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;