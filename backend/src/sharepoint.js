const https = require('https');

const SHAREPOINT_SITE = 'volvogroup.sharepoint.com';
const SITE_PATH = '/sites/unit-wmit';
const FOLDER_PATH = '/Kaizen files';

class SharePointService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry > Date.now()) {
            return this.accessToken;
        }

        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID || 'common';

        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const scope = 'https://graph.microsoft.com/.default';

        const postData = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope: scope,
            grant_type: 'client_credentials'
        }).toString();

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'login.microsoftonline.com',
                path: `/${tenantId}/oauth2/v2.0/token`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.access_token) {
                            this.accessToken = response.access_token;
                            this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000; // 1min buffer
                            resolve(this.accessToken);
                        } else {
                            reject(new Error('Failed to get access token: ' + data));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    async uploadFile(fileName, fileBuffer, kaizenNumber) {
        try {
            const token = await this.getAccessToken();
            const folderName = `KZ-Files/${kaizenNumber}`;
            
            // Create folder if not exists
            await this.createFolder(folderName, token);
            
            // Upload file
            const uploadPath = `/v1.0/sites/${SHAREPOINT_SITE}:${SITE_PATH}:/drive/root:${FOLDER_PATH}/${folderName}/${fileName}:/content`;
            
            return new Promise((resolve, reject) => {
                const options = {
                    hostname: 'graph.microsoft.com',
                    path: uploadPath,
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/octet-stream',
                        'Content-Length': fileBuffer.length
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            if (res.statusCode === 200 || res.statusCode === 201) {
                                resolve({
                                    id: response.id,
                                    name: response.name,
                                    url: response.webUrl,
                                    downloadUrl: response['@microsoft.graph.downloadUrl']
                                });
                            } else {
                                reject(new Error(`Upload failed: ${res.statusCode} - ${data}`));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    });
                });

                req.on('error', reject);
                req.write(fileBuffer);
                req.end();
            });
        } catch (error) {
            throw new Error(`SharePoint upload failed: ${error.message}`);
        }
    }

    async createFolder(folderPath, token) {
        const pathParts = folderPath.split('/');
        let currentPath = FOLDER_PATH;
        
        for (const part of pathParts) {
            if (!part) continue;
            
            const createPath = `/v1.0/sites/${SHAREPOINT_SITE}:${SITE_PATH}:/drive/root:${currentPath}:/children`;
            
            await new Promise((resolve, reject) => {
                const postData = JSON.stringify({
                    name: part,
                    folder: {},
                    '@microsoft.graph.conflictBehavior': 'ignore'
                });

                const options = {
                    hostname: 'graph.microsoft.com',
                    path: createPath,
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        // Ignore conflicts (folder already exists)
                        resolve();
                    });
                });

                req.on('error', reject);
                req.write(postData);
                req.end();
            });
            
            currentPath += `/${part}`;
        }
    }
}

module.exports = new SharePointService();