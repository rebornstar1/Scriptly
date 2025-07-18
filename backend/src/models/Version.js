import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
    documentId: {
        type: String,
        required: true,
        index: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed, // Mixed type to handle Quill Delta objects
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    changeDescription: {
        type: String,
        default: 'Document updated'
    }
}, {
    minimize: false // This ensures empty objects are saved
});

// Compound index for efficient querying
versionSchema.index({ documentId: 1, versionNumber: -1 });

export default mongoose.model('Version', versionSchema);