import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const distDir = path.join(repoRoot, 'dist')
const docsDir = path.join(repoRoot, 'docs')
const docsAssetsDir = path.join(docsDir, 'assets')

if (!existsSync(distDir)) {
  throw new Error(`dist directory not found at ${distDir}. Run the Vite build first.`)
}

mkdirSync(docsDir, { recursive: true })

for (const entry of readdirSync(docsDir)) {
  if (entry === 'assets' || entry === 'index.html') {
    rmSync(path.join(docsDir, entry), { recursive: true, force: true })
  }
}

if (existsSync(docsAssetsDir)) {
  rmSync(docsAssetsDir, { recursive: true, force: true })
}

cpSync(path.join(distDir, 'index.html'), path.join(docsDir, 'index.html'))
cpSync(path.join(distDir, 'assets'), docsAssetsDir, { recursive: true })

for (const entry of readdirSync(distDir)) {
  if (entry === 'index.html' || entry === 'assets') continue
  cpSync(path.join(distDir, entry), path.join(docsDir, entry), { recursive: true })
}

console.log('Synced dist/index.html, dist/assets, and extra dist files -> docs/')
