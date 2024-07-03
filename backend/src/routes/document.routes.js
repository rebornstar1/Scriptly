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


router.post('/:id/collaborators', authenticate, async (req, res) => {
    try {
        const { userId, permission } = req.body;
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner && document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Only document owner can add collaborators.' });
        }

        const existingCollaborator = document.collaborators.find(
            collab => collab.user.toString() === userId
        );

        if (existingCollaborator) {
            return res.status(400).json({ message: 'User is already a collaborator' });
        }

        document.collaborators.push({
            user: userId,
            permission: permission || 'write'
        });

        await document.save();

        const updatedDocument = await Document.findById(req.params.id)
            .populate('owner', 'username email firstName lastName')
            .populate('collaborators.user', 'username email firstName lastName');

        res.json(updatedDocument);
    } catch (error) {
        console.error('Error adding collaborator:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id/collaborators/:userId', authenticate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner && document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Only document owner can remove collaborators.' });
        }

        document.collaborators = document.collaborators.filter(
            collab => collab.user.toString() !== req.params.userId
        );

        await document.save();

        res.json({ message: 'Collaborator removed successfully' });
    } catch (error) {
        console.error('Error removing collaborator:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/collaborators', authenticate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('owner', 'username email firstName lastName')
            .populate('collaborators.user', 'username email firstName lastName');

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const hasPermission = await checkDocumentPermission(document, req.user, 'read');
        if (!hasPermission) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            owner: document.owner,
            collaborators: document.collaborators,
            isPublic: document.isPublic
        });
    } catch (error) {
        console.error('Error fetching collaborators:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/collaborators/:userId', authenticate, async (req, res) => {
    try {
        const { permission } = req.body;
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner && document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Only document owner can update permissions.' });
        }

        const collaborator = document.collaborators.find(
            collab => collab.user.toString() === req.params.userId
        );

        if (!collaborator) {
            return res.status(404).json({ message: 'Collaborator not found' });
        }

        collaborator.permission = permission;
        await document.save();

        res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
        console.error('Error updating collaborator permissions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:id/share', authenticate, async (req, res) => {
    try {
        const { email, username, permission } = req.body;
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner && document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Only document owner can share documents.' });
        }

        const User = (await import('../models/user.model.js')).default;
        
        let targetUser;
        if (email) {
            targetUser = await User.findOne({ email });
        } else if (username) {
            targetUser = await User.findOne({ username });
        } else {
            return res.status(400).json({ message: 'Email or username is required' });
        }

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingCollaborator = document.collaborators.find(
            collab => collab.user.toString() === targetUser._id.toString()
        );

        if (existingCollaborator) {
            existingCollaborator.permission = permission || 'write';
        } else {
            document.collaborators.push({
                user: targetUser._id,
                permission: permission || 'write'
            });
        }

        await document.save();

        const populatedDocument = await Document.findById(req.params.id)
            .populate('collaborators.user', 'username email firstName lastName');

        const collaborator = populatedDocument.collaborators.find(
            collab => collab.user._id.toString() === targetUser._id.toString()
        );

        res.json({
            message: existingCollaborator ? 'Permissions updated successfully' : 'Document shared successfully',
            collaborator
        });
    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/visibility', authenticate, async (req, res) => {
    try {
        const { isPublic } = req.body;
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner && document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Only document owner can change visibility.' });
        }

        document.isPublic = isPublic;
        await document.save();

        res.json({ 
            message: `Document is now ${isPublic ? 'public' : 'private'}`,
            isPublic: document.isPublic
        });
    } catch (error) {
        console.error('Error updating document visibility:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;