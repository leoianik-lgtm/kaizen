const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireApiKey, requireAuth } = require('../middleware/apiAuth');
const { requireAuthOrSWA } = require('../auth');

// GET /api/kaizens/export - Export all data for Power BI (no pagination)
router.get('/export', requireApiKey, (req, res) => {
    try {
        const query = `
            SELECT 
                k.*,
                CAST((k.benefit / NULLIF(k.cost, 0)) AS REAL) as cost_benefit_ratio,
                COUNT(ap.id) as action_count
            FROM kaizens k
            LEFT JOIN action_plans ap ON k.id = ap.kaizen_id
            GROUP BY k.id
            ORDER BY k.created_at DESC
        `;
        
        const kaizens = db.prepare(query).all() || [];
        
        const formattedKaizens = kaizens.map(k => ({
            ID: k.id,
            KaizenNumber: k.kaizen_number,
            TypeName: k.type_name,
            DepartmentName: k.department_name,
            ApplicationArea: k.application_area,
            Leader: k.leader,
            Team: k.team,
            SQDCEPCategory: k.sqdcep_category,
            ProblemDescription: k.problem_description,
            ImprovementDescription: k.improvement_description,
            Results: k.results,
            Cost: k.cost,
            Benefit: k.benefit,
            CostBenefitRatio: k.cost_benefit_ratio,
            IsStandardized: k.is_standardized === 1,
            StandardizationNotes: k.standardization_notes,
            Status: k.status,
            SubmittedDate: k.submitted_date,
            CompletedDate: k.completed_date,
            CreatedBy: k.created_by,
            CreatedAt: k.created_at,
            UpdatedBy: k.updated_by,
            UpdatedAt: k.updated_at,
            ActionCount: k.action_count
        }));
        
        res.json(formattedKaizens);
        
    } catch (error) {
        console.error('Error in GET /api/kaizens/export:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/kaizens/download-db - Download SQLite database file
router.get('/download-db', requireApiKey, (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, '..', '..', 'data', 'kaizens.db');
        
        if (!fs.existsSync(dbPath)) {
            return res.status(404).json({ error: 'Database file not found' });
        }
        
        res.download(dbPath, 'kaizens.db', (err) => {
            if (err) {
                console.error('Error downloading database:', err);
                res.status(500).json({ error: 'Failed to download database' });
            }
        });
        
    } catch (error) {
        console.error('Error in GET /api/kaizens/download-db:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/kaizens - Listar kaizens com paginação e filtros
router.get('/', requireAuthOrSWA, (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const department = req.query.department || '';
        
        const offset = (page - 1) * limit;
        
        // Build WHERE clause
        let whereConditions = [];
        let params = [];
        
        if (status) {
            whereConditions.push('k.status = ?');
            params.push(status);
        }
        
        if (department) {
            whereConditions.push('k.department_name = ?');
            params.push(department);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';
        
        // Query principal
        const query = `
            SELECT 
                k.*,
                CAST((k.benefit / NULLIF(k.cost, 0)) AS REAL) as cost_benefit_ratio,
                COUNT(ap.id) as action_count
            FROM kaizens k
            LEFT JOIN action_plans ap ON k.id = ap.kaizen_id
            ${whereClause}
            GROUP BY k.id
            ORDER BY k.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        
        const kaizens = db.prepare(query).all(...params) || [];
        
        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM kaizens k ${whereClause}`;
        const countParams = whereConditions.length > 0 ? params.slice(0, -2) : [];
        const countResult = db.prepare(countQuery).get(...countParams);
        const total = countResult?.total || 0;
        
        // Format para frontend
        const formattedKaizens = kaizens.map(k => ({
            ID: k.id,
            KaizenNumber: k.kaizen_number,
            TypeName: k.type_name,
            DepartmentName: k.department_name,
            ApplicationArea: k.application_area,
            Leader: k.leader,
            Team: k.team,
            SQDCEPCategory: k.sqdcep_category,
            ProblemDescription: k.problem_description,
            ImprovementDescription: k.improvement_description,
            Results: k.results,
            Cost: k.cost,
            Benefit: k.benefit,
            CostBenefitRatio: k.cost_benefit_ratio,
            IsStandardized: k.is_standardized === 1,
            Status: k.status,
            SubmittedDate: k.submitted_date,
            CompletedDate: k.completed_date,
            CreatedBy: k.created_by,
            CreatedAt: k.created_at,
            ActionCount: k.action_count
        }));
        
        res.json({
            kaizens: formattedKaizens,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error in GET /api/kaizens:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/kaizens/:id - Buscar kaizen específico
router.get('/:id', requireAuthOrSWA, (req, res) => {
    try {
        const { id } = req.params;
        
        const kaizen = db.prepare('SELECT * FROM kaizens WHERE id = ?').get(id);
        
        if (!kaizen) {
            return res.status(404).json({ error: 'Kaizen not found' });
        }
        
        // Buscar action plans
        const actions = db.prepare('SELECT * FROM action_plans WHERE kaizen_id = ?').all(id);
        
        res.json({
            kaizen,
            actions
        });
        
    } catch (error) {
        console.error('Error in GET /api/kaizens/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/kaizens - Criar novo kaizen
router.post('/', requireAuth, (req, res) => {
    try {
        const data = req.body;
        
        // Validações básicas
        if (!data.type_name || !data.department_name || !data.application_area || 
            !data.leader || !data.sqdcep_category || !data.problem) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Validações específicas por tipo
        if (data.type_name === 'Quick') {
            if (!data.problem_sketch || !data.improvement_future_situation) {
                return res.status(400).json({ error: 'Missing required Quick Kaizen fields' });
            }
        } else if (data.type_name === 'Standard') {
            if (!data.root_cause_analysis || !data.current_state_analysis || 
                !data.future_state_analysis || !data.standardization_detailed) {
                return res.status(400).json({ error: 'Missing required Standard Kaizen fields' });
            }
        }
        
        // Gerar kaizen number
        const { max_id } = db.prepare('SELECT MAX(id) as max_id FROM kaizens').get();
        const kaizen_number = `KZ-${String((max_id || 0) + 1).padStart(6, '0')}`;
        
        // Pegar usuário autenticado (vindo do SWA)
        const created_by = req.user?.userId || 'system';
        const created_at = new Date().toISOString();
        
        // Preparar campos para inserção
        const fields = [
            'kaizen_number', 'type_name', 'department_name', 'application_area',
            'leader', 'team', 'sqdcep_category', 'problem', 'status', 'created_by', 'created_at'
        ];
        
        const values = [
            kaizen_number, data.type_name, data.department_name, data.application_area,
            data.leader, data.team, data.sqdcep_category, data.problem, 'Draft', created_by, created_at
        ];
        
        // Adicionar campos específicos do tipo
        const optionalFields = [
            'problem_sketch', 'improvement_future_situation', 'check_results',
            'cost_summary', 'benefit_summary', 'cb_ratio_summary', 'standardization',
            'root_cause_analysis', 'current_state_analysis', 'future_state_analysis',
            'picture_of_solution', 'monitoring', 'benefit_detailed', 'cost_detailed',
            'bc_detailed', 'standardization_detailed'
        ];
        
        optionalFields.forEach(field => {
            if (data[field]) {
                fields.push(field);
                values.push(data[field]);
            }
        });
        
        // Inserir kaizen
        const placeholders = fields.map(() => '?').join(', ');
        const insert = db.prepare(`
            INSERT INTO kaizens (${fields.join(', ')})
            VALUES (${placeholders})
        `);
        
        const result = insert.run(...values);
        
        res.status(201).json({
            id: result.lastInsertRowid,
            kaizen_number,
            message: 'Kaizen created successfully'
        });
        
    } catch (error) {
        console.error('Error in POST /api/kaizens:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;