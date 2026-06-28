import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function skillsApiPlugin() {
  return {
    name: 'skills-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/skills')) {
          const skillsDir = path.resolve(__dirname, 'skills');
          
          if (req.method === 'GET' && req.url === '/api/skills') {
            try {
              if (!fs.existsSync(skillsDir)) {
                fs.mkdirSync(skillsDir, { recursive: true });
              }
              
              const getAllSkills = (dir: string, baseDir: string): { name: string; content: string }[] => {
                let results: { name: string; content: string }[] = [];
                if (!fs.existsSync(dir)) return results;
                const list = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of list) {
                  const fullPath = path.join(dir, item.name);
                  if (item.isDirectory()) {
                    results = results.concat(getAllSkills(fullPath, baseDir));
                  } else if (item.name === 'SKILL.md') {
                    const relativeName = path.relative(baseDir, dir).replace(/\\/g, '/');
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    results.push({ name: relativeName, content });
                  }
                }
                return results;
              };

              const skills = getAllSkills(skillsDir, skillsDir).filter(s => s.content);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(skills));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          if (req.method === 'POST' && req.url === '/api/skills') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { name, content } = JSON.parse(body);
                if (!name || !content) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Name and content required' }));
                }
                const dirPath = path.join(skillsDir, name);
                if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                }
                fs.writeFileSync(path.join(dirPath, 'SKILL.md'), content);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        if (req.url.startsWith('/api/chat_logs')) {
          const chatLogsDir = path.resolve(__dirname, 'chat_logs');
          
          if (req.method === 'GET' && req.url === '/api/chat_logs') {
            try {
              if (!fs.existsSync(chatLogsDir)) {
                fs.mkdirSync(chatLogsDir, { recursive: true });
              }
              
              const files = fs.readdirSync(chatLogsDir);
              const groups: Record<string, { userFile?: string; aiFile?: string }> = {};
              
              for (const file of files) {
                if (file.endsWith('.txt')) {
                  const match = file.match(/^(\d{4}_\d{2}_\d{2}__\d{2}_\d{2}_\d{2})__(user_command|ai_response)\.txt$/);
                  if (match) {
                    const timestamp = match[1];
                    const type = match[2];
                    if (!groups[timestamp]) groups[timestamp] = {};
                    if (type === 'user_command') {
                      groups[timestamp].userFile = file;
                    } else if (type === 'ai_response') {
                      groups[timestamp].aiFile = file;
                    }
                  }
                }
              }
              
              const chatLogs: { id: string; timestamp: string; rawTimestamp: string; userContent: string; aiContent: string; title: string }[] = [];
              
              for (const [timestamp, filesObj] of Object.entries(groups)) {
                let userContent = '';
                let aiContent = '';
                
                if (filesObj.userFile) {
                  userContent = fs.readFileSync(path.join(chatLogsDir, filesObj.userFile), 'utf-8');
                }
                if (filesObj.aiFile) {
                  aiContent = fs.readFileSync(path.join(chatLogsDir, filesObj.aiFile), 'utf-8');
                }
                
                const cleanUserContent = userContent.trim();
                let title = 'محادثة مخصصة';
                if (cleanUserContent) {
                  const firstLine = cleanUserContent.split('\n')[0].trim();
                  title = firstLine.length > 55 ? firstLine.substring(0, 55) + '...' : firstLine;
                }
                
                const parts = timestamp.split('__');
                const datePart = parts[0]?.replace(/_/g, '-') || '';
                const timePart = parts[1]?.replace(/_/g, ':') || '';
                const formattedTime = `${datePart} ${timePart}`;
                
                chatLogs.push({
                  id: timestamp,
                  timestamp: formattedTime,
                  rawTimestamp: timestamp,
                  userContent,
                  aiContent,
                  title
                });
              }
              
              chatLogs.sort((a, b) => b.rawTimestamp.localeCompare(a.rawTimestamp));
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(chatLogs));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        skillsApiPlugin(),
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Nima POS & ERP',
            short_name: 'NimaPOS',
            description: 'Advanced Offline-First POS and ERP System',
            theme_color: '#4f46e5',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            maximumFileSizeToCacheInBytes: 5000000 // 5MB limit for caching
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: ['./__tests__/setup.ts'],
        globals: true
      }
    };
});
