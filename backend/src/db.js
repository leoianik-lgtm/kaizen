const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbDir = process.env.DB_PATH || path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'kaizens.db');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db;
let SQL;

async function initDB() {
    SQL = await initSqlJs();
    
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
        console.log(`✅ Database loaded: ${dbPath}`);
    } else {
        db = new SQL.Database();
        console.log(`✅ Database created: ${dbPath}`);
    }
}

function saveDB() {
    if (db) {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
    }
}

const dbWrapper = {
    exec: (sql) => {
        db.run(sql);
        saveDB();
    },
    prepare: (sql) => ({
        run: (...params) => {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            stmt.step();
            stmt.free();
            saveDB();
            const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0;
            return { lastInsertRowid: lastId };
        },
        get: (...params) => {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const result = stmt.step() ? stmt.getAsObject() : null;
            stmt.free();
            return result;
        },
        all: (...params) => {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        }
    })
};

async function initDatabase() {
    await initDB();
    
    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS kaizens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kaizen_number TEXT UNIQUE NOT NULL,
            type_name TEXT NOT NULL,
            department_name TEXT NOT NULL,
            application_area TEXT NOT NULL,
            leader TEXT NOT NULL,
            team TEXT,
            sqdcep_category TEXT NOT NULL,
            
            -- Common fields
            problem TEXT NOT NULL,
            
            -- Quick Kaizen fields
            problem_sketch TEXT,
            improvement_future_situation TEXT,
            check_results TEXT,
            cost_summary TEXT,
            benefit_summary TEXT,
            cb_ratio_summary TEXT,
            standardization TEXT,
            
            -- Standard Kaizen fields
            root_cause_analysis TEXT,
            current_state_analysis TEXT,
            future_state_analysis TEXT,
            picture_of_solution TEXT,
            monitoring TEXT,
            benefit_detailed TEXT,
            cost_detailed TEXT,
            bc_detailed TEXT,
            standardization_detailed TEXT,
            
            -- Legacy fields (keep for compatibility)
            problem_description TEXT,
            improvement_description TEXT,
            results TEXT,
            cost REAL DEFAULT 0,
            benefit REAL DEFAULT 0,
            is_standardized INTEGER DEFAULT 0,
            standardization_notes TEXT,
            
            status TEXT DEFAULT 'Draft',
            submitted_date TEXT,
            completed_date TEXT,
            attachments TEXT, -- JSON array of SharePoint files
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_by TEXT,
            updated_at TEXT
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS action_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kaizen_id INTEGER NOT NULL,
            action_description TEXT NOT NULL,
            responsible_person TEXT NOT NULL,
            start_date TEXT,
            due_date TEXT NOT NULL,
            completed_date TEXT,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            deliverable_evidence_link TEXT,
            completion_date TEXT,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_by TEXT,
            updated_at TEXT,
            FOREIGN KEY (kaizen_id) REFERENCES kaizens(id) ON DELETE CASCADE
        )
    `);

    dbWrapper.exec(`
        CREATE INDEX IF NOT EXISTS idx_kaizens_status ON kaizens(status);
        CREATE INDEX IF NOT EXISTS idx_kaizens_department ON kaizens(department_name);
        CREATE INDEX IF NOT EXISTS idx_kaizens_created_at ON kaizens(created_at);
        CREATE INDEX IF NOT EXISTS idx_action_plans_kaizen ON action_plans(kaizen_id);
    `);

    console.log('✅ Database tables initialized');

    const count = dbWrapper.prepare('SELECT COUNT(*) as count FROM kaizens').get();
    if (count.count === 0) {
        insertSampleData();
    }
}

function insertSampleData() {
    // Quick Kaizen
    const insertQuick = dbWrapper.prepare(`
        INSERT INTO kaizens (kaizen_number, type_name, department_name, application_area,
                           leader, team, sqdcep_category, problem, problem_sketch,
                           improvement_future_situation, check_results, cost_summary,
                           benefit_summary, cb_ratio_summary, standardization,
                           status, submitted_date, completed_date, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertQuick.run('KZ-000001', 'Quick', 'Manufacturing', 'Assembly Line A', 'John Smith',
        'Team Alpha', 'C', 'High setup time on machine X causing production delays',
        'Current setup takes 30 minutes with manual tool changes. Operators struggle with heavy tooling and complex alignment procedures.',
        'Implement quick-change tooling system with pre-aligned fixtures. Target setup time: 5 minutes.',
        'Setup time reduced from 30min to 5min. Increased line efficiency by 15%. Zero alignment issues.',
        'Investment: $500 for quick-change fixtures and training',
        'Savings: $2000/month in reduced downtime and increased throughput',
        'ROI: 4x return in first month. Payback period: 2 weeks',
        'Quick-change procedure documented in SOP-123. All operators trained and certified.',
        'Completed', '2024-01-15T00:00:00', '2024-02-20T00:00:00', 'john.smith@volvo.com',
        '2024-01-10T10:30:00');

    // Standard Kaizen
    const insertStandard = dbWrapper.prepare(`
        INSERT INTO kaizens (kaizen_number, type_name, department_name, application_area,
                           leader, team, sqdcep_category, problem, root_cause_analysis,
                           current_state_analysis, future_state_analysis, picture_of_solution,
                           monitoring, benefit_detailed, cost_detailed, bc_detailed,
                           standardization_detailed, status, submitted_date, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStandard.run('KZ-000002', 'Standard', 'Quality', 'Inspection Station', 'Sarah Wilson',
        'Team Beta', 'Q', 'High defect rate (8%) in final inspection causing customer complaints',
        '5-Why Analysis: 1) High defects 2) Manual inspection errors 3) Operator fatigue 4) Poor lighting 5) No standardized checklist. Root cause: Inconsistent manual inspection process.',
        'Current: Manual visual inspection, 2 operators, 45sec/part, 8% defect escape rate, customer complaints increasing',
        'Future: Automated vision system + operator verification, 15sec/part, <1% defect rate, real-time feedback',
        'https://example.com/vision-system-layout.jpg',
        'Daily defect rate tracking, weekly calibration checks, monthly system performance review',
        'Reduced customer complaints by 90%, improved quality rating from 92% to 99.2%, prevented $200k in warranty costs',
        'Vision system: $12k, Installation: $2k, Training: $1k, Total: $15k',
        'Cost avoidance: $200k/year, Efficiency gains: $35k/year, ROI: 15.7x annually',
        'Vision system parameters documented in QC-456. Operator training program established. Monthly calibration schedule implemented.',
        'In Progress', '2024-02-01T00:00:00', 'sarah.wilson@volvo.com', '2024-01-25T14:20:00');

    // Another Quick Kaizen
    insertQuick.run('KZ-000003', 'Quick', 'Logistics', 'Warehouse Zone B', 'Mike Johnson',
        'Team Gamma', 'D', 'Slow material picking process affecting delivery times',
        'Pickers walk long distances. High-frequency items stored far from shipping dock. No clear picking route.',
        'Reorganize layout by frequency. Move fast-moving items closer to dock. Create optimized picking routes.',
        'Picking time reduced by 40%. Daily shipments increased from 85 to 120. Zero late deliveries.',
        'Layout change: $150 materials, Signage: $50',
        'Labor savings: $5000/month, Improved on-time delivery',
        'ROI: 25x return monthly. Payback: 1.2 weeks',
        'New warehouse layout map created and posted. Picking routes optimized and documented.',
        'Completed', '2024-01-20T00:00:00', '2024-02-10T00:00:00', 'mike.johnson@volvo.com',
        '2024-01-15T09:00:00');

    // Action Plans with new fields
    const insertAction = dbWrapper.prepare(`
        INSERT INTO action_plans (kaizen_id, action_description, responsible_person,
                                start_date, due_date, completed_date, status, notes,
                                deliverable_evidence_link, completion_date, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAction.run(1, 'Purchase quick-change tooling kit', 'Mike Johnson',
        '2024-01-15', '2024-01-30', '2024-01-28', 'Completed',
        'Ordered from supplier X, delivered on time',
        'https://example.com/purchase-order-123.pdf', '2024-01-28',
        'john.smith@volvo.com', '2024-01-15T10:00:00');

    insertAction.run(1, 'Train operators on new system', 'Sarah Wilson',
        '2024-02-01', '2024-02-15', '2024-02-14', 'Completed',
        'All 8 operators trained and certified',
        'https://example.com/training-certificates.pdf', '2024-02-14',
        'john.smith@volvo.com', '2024-01-15T10:00:00');

    insertAction.run(2, 'Install vision system hardware', 'Tech Team',
        '2024-02-05', '2024-02-20', null, 'In Progress',
        'Hardware 80% installed, calibration pending',
        'https://example.com/installation-progress.jpg', null,
        'sarah.wilson@volvo.com', '2024-02-01T14:00:00');

    insertAction.run(2, 'Develop inspection algorithms', 'AI Team',
        '2024-02-10', '2024-02-25', null, 'Pending',
        'Waiting for hardware completion',
        null, null, 'sarah.wilson@volvo.com', '2024-02-01T14:00:00');

    console.log('✅ Sample data inserted with new structure');
}

const dbReady = initDatabase();

module.exports = { db: dbWrapper, dbReady };