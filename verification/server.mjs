// Isolated browser-verification server. Never loads .env or changes production auth.
import { createServer } from '../node_modules/vite/dist/node/index.js'
import react from '../node_modules/@vitejs/plugin-react/dist/index.js'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({
  root,
  configFile: false,
  envDir: false,
  appType: 'custom',
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://127.0.0.1:4173/api'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://watchup-verification.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('verification-only-public-placeholder'),
  },
  plugins: [react(), {
    name: 'verification-document',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.headers.accept?.includes('text/html')) return next()
        const source = await readFile(new URL('./index.html', import.meta.url), 'utf8')
        const html = await vite.transformIndexHtml(req.url, source)
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })
    },
  }],
  server: { host: '127.0.0.1', port: 4173, strictPort: true, watch: { usePolling: true, interval: 200 } },
})
await server.listen()
server.printUrls()
