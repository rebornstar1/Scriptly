import express from 'express';
import { getDocumentVersions, getVersion } from '../utlis/db.utils.js';
import { authenticate } from '../middleware/auth.middleware.js';
import Document from '../models/document.model.js'; // Add this import

const router = express.Router();

// Get all versions for a document
router.get('/:documentId', authenticate, async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user._id;
        
        // Check if user has access to the document
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const hasAccess = 
            document.owner.toString() === userId.toString() || 
            document.collaborators.some(collab => collab.toString() === userId.toString()) ||
            document.isPublic;
            
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const versions = await getDocumentVersions(documentId);
        res.json(versions);
    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
});

// Get a specific version
router.get('/:documentId/:versionNumber', authenticate, async (req, res) => {
    try {
        const { documentId, versionNumber } = req.params;
        const userId = req.user._id;
        
        // Check if user has access to the document
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        const hasAccess = 
            document.owner.toString() === userId.toString() || 
            document.collaborators.some(collab => collab.toString() === userId.toString()) ||
            document.isPublic;
            
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const version = await getVersion(documentId, parseInt(versionNumber));
        
        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }
        
        res.json(version);
    } catch (error) {
        console.error('Error fetching version:', error);
        res.status(500).json({ error: 'Failed to fetch version' });
    }
});

export default router;