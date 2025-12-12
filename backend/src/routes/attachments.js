const express = require('express');
const multer = require('multer');
const router = express.Router();
const { db } = require('../db');
const sharepoint = require('../sharepoint');
const { requireAuth } = require('../middleware/apiAuth');

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip)$/i;
        if (allowedTypes.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// POST /api/attachments/:kaizenId - Upload file to SharePoint
router.post('/:kaizenId', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const { kaizenId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Get kaizen to verify it exists and get kaizen number
        const kaizen = db.prepare('SELECT kaizen_number FROM kaizens WHERE id = ?').get(kaizenId);
        if (!kaizen) {
            return res.status(404).json({ error: 'Kaizen not found' });
        }

        // Upload to SharePoint
        const uploadResult = await sharepoint.uploadFile(
            file.originalname,
            file.buffer,
            kaizen.kaizen_number
        );

        // Get current attachments
        const currentKaizen = db.prepare('SELECT attachments FROM kaizens WHERE id = ?').get(kaizenId);
        let attachments = [];
        
        if (currentKaizen.attachments) {
            try {
                attachments = JSON.parse(currentKaizen.attachments);
            } catch (e) {
                attachments = [];
            }
        }

        // Add new attachment
        const newAttachment = {
            id: uploadResult.id,
            name: uploadResult.name,
            url: uploadResult.url,
            downloadUrl: uploadResult.downloadUrl,
            uploadedBy: req.user?.userId || 'system',
            uploadedAt: new Date().toISOString()
        };

        attachments.push(newAttachment);

        // Update kaizen with new attachments
        db.prepare('UPDATE kaizens SET attachments = ?, updated_at = ? WHERE id = ?')
          .run(JSON.stringify(attachments), new Date().toISOString(), kaizenId);

        res.json({
            message: 'File uploaded successfully',
            attachment: newAttachment
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/attachments/:kaizenId - List attachments for a kaizen
router.get('/:kaizenId', requireAuth, (req, res) => {
    try {
        const { kaizenId } = req.params;

        const kaizen = db.prepare('SELECT attachments FROM kaizens WHERE id = ?').get(kaizenId);
        if (!kaizen) {
            return res.status(404).json({ error: 'Kaizen not found' });
        }

        let attachments = [];
        if (kaizen.attachments) {
            try {
                attachments = JSON.parse(kaizen.attachments);
            } catch (e) {
                attachments = [];
            }
        }

        res.json({ attachments });

    } catch (error) {
        console.error('Error getting attachments:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/attachments/:kaizenId/:attachmentId - Remove attachment
router.delete('/:kaizenId/:attachmentId', requireAuth, (req, res) => {
    try {
        const { kaizenId, attachmentId } = req.params;

        const kaizen = db.prepare('SELECT attachments FROM kaizens WHERE id = ?').get(kaizenId);
        if (!kaizen) {
            return res.status(404).json({ error: 'Kaizen not found' });
        }

        let attachments = [];
        if (kaizen.attachments) {
            try {
                attachments = JSON.parse(kaizen.attachments);
            } catch (e) {
                attachments = [];
            }
        }

        // Remove attachment from array
        attachments = attachments.filter(att => att.id !== attachmentId);

        // Update kaizen
        db.prepare('UPDATE kaizens SET attachments = ?, updated_at = ? WHERE id = ?')
          .run(JSON.stringify(attachments), new Date().toISOString(), kaizenId);

        res.json({ message: 'Attachment removed successfully' });

    } catch (error) {
        console.error('Error removing attachment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;