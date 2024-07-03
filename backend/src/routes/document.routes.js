import express from 'express';
import Document from '../models/document.model.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { checkDocumentPermission } from '../utils/auth.utils.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
    try {
        let query = {};
        
        if (req.user) {
            query = {
                $or: [
                    { owner: req.user._id },
                    { 'collaborators.user': req.user._id },
                    { isPublic: true },
                    { owner: { $exists: false } } 
                ]
            };
        } else {
            query = {
                $or: [
                    { isPublic: true },
                    { owner: { $exists: false } }
                ]
            };
        }

        const documents = await Document.find(query, { data: 0 })
            .populate('owner', 'username email firstName lastName')
            .populate('collaborators.user', 'username email firstName lastName')
            .sort({ updatedAt: -1 });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { hasPermission, document } = await checkDocumentPermission(
            req.params.id, 
            req.user, 
            'read'
        );

        if (!hasPermission || !document) {
            return res.status(404).json({ message: 'Document not found or access denied' });
        }

        // Parse the data field if it exists
        const response = {
            _id: document._id,
            title: document.title,
            data: document.data ? JSON.parse(document.data) : '',
            owner: document.owner,
            collaborators: document.collaborators,
            isPublic: document.isPublic,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', authenticate, async (req, res) => {
    try {
        const { title, isPublic } = req.body;

        const newDocument = await Document.create({
            _id: Math.random().toString(36).substring(2, 10),
            title: title || 'Untitled Document',
            data: '',
            owner: req.user._id,
            isPublic: isPublic || false
        });

        const populatedDocument = await Document.findById(newDocument._id)
            .populate('owner', 'username email firstName lastName');

        res.status(201).json(populatedDocument);
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch('/:id/title', optionalAuth, async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const { hasPermission, document } = await checkDocumentPermission(
            req.params.id, 
            req.user, 
            'write'
        );

        if (!hasPermission || !document) {
            return res.status(403).json({ message: 'Access denied or document not found' });
        }

        const updatedDocument = await Document.findByIdAndUpdate(
            req.params.id,
            { title },
            { new: true }
        ).populate('owner', 'username email firstName lastName')
         .populate('collaborators.user', 'username email firstName lastName');

        res.json(updatedDocument);
    } catch (error) {
        console.error('Error updating document title:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:id', authenticate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner && document.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only document owner can delete.' });
        }

        await Document.findByIdAndDelete(req.params.id);

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;