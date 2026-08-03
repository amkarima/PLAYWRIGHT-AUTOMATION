import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// Helper function to ensure URL has a protocol
const ensureProtocol = (url: string): string => {
  if (!url) return 'https://localhost';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Helper function to get header value (can be string or string array)
const getHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.ENV': JSON.stringify(process.env.ENV || 'int'),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/xray': {
        target: (req) => {
          const targetUrl = getHeaderValue(req.headers['x-xray-target-url']);
          return ensureProtocol(targetUrl || 'jira.steelhome.internal');
        },
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/xray/, ''),
        configure: (proxy, options) => {
          // Configure agent to bypass SSL certificate validation for internal networks
          proxy.options.agent = new https.Agent({ rejectUnauthorized: false });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add authorization header
            const xrayConfig = getHeaderValue(req.headers['x-xray-config']);
            if (xrayConfig) {
              try {
                const parsedConfig = JSON.parse(xrayConfig);
                proxyReq.setHeader('Authorization', `Bearer ${parsedConfig.token}`);
              } catch (e) {
                console.error('Failed to parse Xray config:', e);
              }
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('Xray proxy error:', err);
          });
        }
      },
      '/api/gitlab': {
        target: (req) => {
          const gitlabConfig = getHeaderValue(req.headers['x-gitlab-config']);
          if (gitlabConfig) {
            try {
              const parsedConfig = JSON.parse(gitlabConfig);
              return ensureProtocol(parsedConfig.baseUrl || 'gitlab.com');
            } catch (e) {
              console.error('Failed to parse GitLab config:', e);
            }
          }
          return ensureProtocol('gitlab.com');
        },
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/gitlab/, ''),
        configure: (proxy, options) => {
          // Configure agent to bypass SSL certificate validation for internal networks
          proxy.options.agent = new https.Agent({ rejectUnauthorized: false });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add authorization header
            const authHeader = getHeaderValue(req.headers['x-gitlab-auth']);
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
            
            // Ensure target is properly set
            const gitlabConfig = getHeaderValue(req.headers['x-gitlab-config']);
            if (gitlabConfig) {
              try {
                const parsedConfig = JSON.parse(gitlabConfig);
                proxy.options.target = ensureProtocol(parsedConfig.baseUrl || 'gitlab.com');
              } catch (e) {
                console.error('Failed to parse GitLab config:', e);
                proxy.options.target = ensureProtocol('gitlab.com');
              }
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('GitLab proxy error:', err);
          });
        }
      }
    }
  }
});