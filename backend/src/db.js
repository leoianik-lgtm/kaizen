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
            problem_description TEXT NOT NULL,
            improvement_description TEXT NOT NULL,
            results TEXT,
            cost REAL DEFAULT 0,
            benefit REAL DEFAULT 0,
            is_standardized INTEGER DEFAULT 0,
            standardization_notes TEXT,
            status TEXT DEFAULT 'Draft',
            submitted_date TEXT,
            completed_date TEXT,
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
    const insertKaizen = dbWrapper.prepare(`
        INSERT INTO kaizens (kaizen_number, type_name, department_name, application_area,
                           leader, team, sqdcep_category, problem_description,
                           improvement_description, results, cost, benefit, is_standardized,
                           standardization_notes, status, submitted_date, completed_date,
                           created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertKaizen.run('KZ-000001', 'Quick', 'Manufacturing', 'Assembly Line A', 'John Smith',
        'Team Alpha', 'Cost', 'High setup time on machine X causing delays',
        'Implemented quick-change tooling system', 'Reduced setup time from 30min to 5min',
        500.00, 2000.00, 1, 'Documented in SOP-123', 'Completed',
        '2024-01-15T00:00:00', '2024-02-20T00:00:00', 'john.smith@volvo.com',
        '2024-01-10T10:30:00');

    insertKaizen.run('KZ-000002', 'Standard', 'Quality', 'Inspection Station', 'Sarah Wilson',
        'Team Beta', 'Quality', 'High defect rate in final inspection',
        'Implemented automated vision system', 'Reduced defects by 75%',
        15000.00, 50000.00, 0, null, 'In Progress',
        '2024-02-01T00:00:00', null, 'sarah.wilson@volvo.com',
        '2024-01-25T14:20:00');

    insertKaizen.run('KZ-000003', 'Quick', 'Logistics', 'Warehouse Zone B', 'Mike Johnson',
        'Team Gamma', 'Delivery', 'Slow material picking process',
        'Reorganized warehouse layout by frequency', 'Reduced picking time by 40%',
        200.00, 5000.00, 1, 'New layout map created', 'Completed',
        '2024-01-20T00:00:00', '2024-02-10T00:00:00', 'mike.johnson@volvo.com',
        '2024-01-15T09:00:00');

    const insertAction = dbWrapper.prepare(`
        INSERT INTO action_plans (kaizen_id, action_description, responsible_person,
                                start_date, due_date, completed_date, status, notes,
                                created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAction.run(1, 'Purchase quick-change tooling kit', 'Mike Johnson',
        '2024-01-15', '2024-01-30', '2024-01-28', 'Completed',
        'Ordered from supplier X', 'john.smith@volvo.com', '2024-01-15T10:00:00');

    insertAction.run(1, 'Train operators on new system', 'Sarah Wilson',
        '2024-02-01', '2024-02-15', '2024-02-14', 'Completed',
        'Training completed successfully', 'john.smith@volvo.com', '2024-01-15T10:00:00');

    insertAction.run(2, 'Install vision system hardware', 'Tech Team',
        '2024-02-05', '2024-02-20', null, 'In Progress',
        'Hardware 80% installed', 'sarah.wilson@volvo.com', '2024-02-01T14:00:00');

    console.log('✅ Sample data inserted');
}

const dbReady = initDatabase();

module.exports = { db: dbWrapper, dbReady };