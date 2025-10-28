cat > vite.config.js <<'EOF'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  root: 'frontend',
  build: {
    outDir: '../public',
    emptyOutDir: true,
  }
})
EOF

