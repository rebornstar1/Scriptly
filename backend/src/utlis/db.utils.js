import Document from "../models/document.model.js";
import { checkDocumentPermission } from "./auth.utils.js";
import Version from '../models/Version.js';

// Update your saveDocument function
export const saveDocument = async (id, data, title, user) => {
    try {
        console.log(`Attempting to save document ${id} for user ${user.username} (${user._id})`);
        
        // Find the document first
        const document = await Document.findById(id);
        
        if (!document) {
            console.log(`Document ${id} not found, creating new document`);
            // If document doesn't exist, create a new one
            const newDocument = new Document({
                _id: id,
                title: title || 'Untitled Document',
                data: data || {},
                owner: user._id,
                collaborators: [],
                isPublic: false
            });
            await newDocument.save();
            
            // Create initial version for new document
            if (data && Object.keys(data).length > 0) {
                try {
                    await createVersion(
                        id, 
                        title || 'Untitled Document', 
                        data, 
                        user._id.toString(),
                        'Initial document version'
                    );
                    console.log(`Initial version created for new document ${id}`);
                } catch (versionError) {
                    console.error('Error creating initial version:', versionError);
                }
            }
            
            console.log(`New document created: ${id} for user ${user.username}`);
            return newDocument;
        }
        
        // Debug: Log the document ownership details
        console.log(`Document owner: ${document.owner}`);
        console.log(`User ID: ${user._id}`);
        console.log(`Collaborators:`, document.collaborators);
        
        // Check if user has write access - Fixed permission check for collaborators array
        const hasWriteAccess = 
            document.owner.toString() === user._id.toString() || // Owner
            document.collaborators.some(collab => 
                collab.user.toString() === user._id.toString() && 
                (collab.permission === 'edit' || collab.permission === 'admin')
            ) || // Collaborator with edit/admin permission
            document.isPublic; // Public document (allow anyone to edit)
        
        console.log(`User has write access: ${hasWriteAccess}`);
        
        if (!hasWriteAccess) {
            // If user doesn't have access, add them as a collaborator (for real-time collaboration)
            console.log(`Adding user ${user.username} as collaborator to document ${id}`);
            document.collaborators.push({
                user: user._id,
                permission: 'edit',
                addedAt: new Date()
            });
            await document.save();
        }
        
        // Update the document
        const updateData = {};
        if (data !== null && data !== undefined) {
            updateData.data = data; // Now this will work because data is Mixed type
        }
        if (title !== undefined && title !== null) {
            updateData.title = title;
        }
        updateData.updatedAt = new Date();
        
        const updatedDocument = await Document.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        // Create a version snapshot only if there's actual content change
        if (data && typeof data === 'object' && data.ops && data.ops.length > 0) {
            try {
                await createVersion(
                    id, 
                    title || document.title, 
                    data, 
                    user._id.toString(),
                    'Document content updated'
                );
                console.log(`Version created for document ${id} by user ${user.username}`);
            } catch (versionError) {
                console.error('Error creating version:', versionError);
                // Don't throw here - document save was successful
            }
        }
        
        console.log(`Document ${id} saved successfully by user ${user.username}`);
        return updatedDocument;
        
    } catch (error) {
        console.error('Error saving document:', error);
        throw error;
    }
};

// Update findOrCreateDocument to handle collaborators array properly
export const findOrCreateDocument = async (id, title, user) => {
    if (!id) return null;
    
    try {
        console.log(`Finding or creating document ${id} for user ${user.username} (${user._id})`);
        
        // First, try to find the document
        let document = await Document.findById(id);
        
        if (document) {
            console.log(`Document found: ${document.title}`);
            console.log(`Document owner: ${document.owner}`);
            console.log(`User ID: ${user._id}`);
            console.log(`Collaborators:`, document.collaborators);
            
            // Check if user has access to this document
            const hasAccess = 
                document.owner.toString() === user._id.toString() || // Owner
                document.collaborators.some(collab => 
                    collab.user.toString() === user._id.toString()
                ) || // Collaborator
                document.isPublic; // Public document

            if (!hasAccess) {
                // Add user as collaborator for real-time collaboration
                console.log(`Adding user ${user.username} as collaborator to existing document ${id}`);
                document.collaborators.push({
                    user: user._id,
                    permission: 'edit',
                    addedAt: new Date()
                });
                await document.save();
            }
            
            return document;
        }
        
        // If document doesn't exist, create a new one
        document = new Document({
            _id: id,
            title: title || 'Untitled Document',
            data: {},
            owner: user._id,
            collaborators: [],
            isPublic: false
        });
        
        await document.save();
        console.log(`New document created: ${document.title} for user: ${user.username}`);
        return document;
        
    } catch (error) {
        console.error('Database error finding document:', error);
        throw error;
    }
};

// Version functions remain the same
export const createVersion = async (documentId, title, content, userId, changeDescription = 'Document updated') => {
    try {
        console.log(`Creating version for document ${documentId} by user ${userId}`);
        
        // Get the latest version number
        const latestVersion = await Version.findOne({ documentId }).sort({ versionNumber: -1 });
        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

        const version = new Version({
            documentId,
            versionNumber: nextVersionNumber,
            title,
            content,
            createdBy: userId,
            changeDescription
        });

        await version.save();
        console.log(`Version ${nextVersionNumber} created successfully for document ${documentId}`);
        return version;
    } catch (error) {
        console.error('Error creating version:', error);
        throw error;
    }
};

// Get all versions for a document
export const getDocumentVersions = async (documentId) => {
    try {
        console.log(`Fetching versions for document ${documentId}`);
        const versions = await Version.find({ documentId })
            .sort({ versionNumber: -1 })
            .select('versionNumber title createdBy createdAt changeDescription');
        
        console.log(`Found ${versions.length} versions for document ${documentId}`);
        return versions;
    } catch (error) {
        console.error('Error fetching versions:', error);
        throw error;
    }
};

// Get a specific version
export const getVersion = async (documentId, versionNumber) => {
    try {
        console.log(`Fetching version ${versionNumber} for document ${documentId}`);
        const version = await Version.findOne({ documentId, versionNumber });
        
        if (version) {
            console.log(`Version ${versionNumber} found for document ${documentId}`);
        } else {
            console.log(`Version ${versionNumber} not found for document ${documentId}`);
        }
        
        return version;
    } catch (error) {
        console.error('Error fetching version:', error);
        throw error;
    }
};