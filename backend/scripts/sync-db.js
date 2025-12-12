const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sHwF3liJ22MNaA2RmFSDiV5/FNbRXs0A16nTywbA4HA=';
const API_URL = 'https://kaizen-bba6guhvhhdxf2ba.swedencentral-01.azurewebsites.net/api/kaizens/download-db';
const DB_PATH = path.join(__dirname, '..', 'data', 'kaizens.db');

console.log('📥 Downloading database from production...');

const options = {
    headers: {
        'x-api-key': API_KEY
    }
};

https.get(API_URL, options, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Error: ${response.statusCode} ${response.statusMessage}`);
        
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
            console.error('Response body:', body);
            process.exit(1);
        });
        return;
    }

    const fileStream = fs.createWriteStream(DB_PATH);
    
    response.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        console.log('✅ Database downloaded successfully!');
        console.log(`📁 Saved to: ${DB_PATH}`);
        process.exit(0);
    });

    fileStream.on('error', (err) => {
        fs.unlink(DB_PATH, () => {});
        console.error('❌ Error writing file:', err.message);
        process.exit(1);
    });

}).on('error', (err) => {
    console.error('❌ Error downloading:', err.message);
    process.exit(1);
});

console.log('Request URL:', API_URL);
console.log('Request headers:', options.headers);
