/**
 * Standalone route watcher
 * Watches for page.tsx changes and regenerates routes
 * Run alongside Next.js dev server: pnpm run dev:routes
 */

import { watch } from 'chokidar';
import { execSync } from 'child_process';
import { join } from 'path';
import { getRouteGenConfig } from '../route-gen.config';

const config = getRouteGenConfig();
const PAGES_DIRS = (config.pagesDirs || ['app/(apps)/admin/(pages)']).map(dir => 
  join(process.cwd(), dir)
);

let isGenerating = false;

function generateRoutes() {
  if (isGenerating) {
    console.log('⏳ Generation already in progress, skipping...');
    return;
  }
  
  isGenerating = true;
  try {
    console.log('🔄 Regenerating routes...');
    const output = execSync('tsx scripts/generate-routes.ts', { 
      stdio: 'inherit', // Show output directly
      cwd: process.cwd(),
    });
    console.log('✅ Routes regenerated successfully');
  } catch (error: any) {
    console.error('❌ Failed to generate routes:', error.message);
  } finally {
    isGenerating = false;
  }
}

console.log('🔍 Starting route watcher...');
console.log(`📁 Watching directories: ${PAGES_DIRS.join(', ')}`);

// Watch all configured directories
const watchPatterns = PAGES_DIRS.map(dir => join(dir, '**', 'page.tsx'));

console.log('📍 Watch patterns:', watchPatterns);

const watcher = watch(watchPatterns, {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true,
  usePolling: true, // Always use polling for reliability
  interval: 500, // Poll every 500ms
  // Don't use atomic or awaitWriteFinish - they interfere with editor atomic writes
  // Editors like VS Code delete the file and create a new one (atomic write)
  // We need to catch the 'add' event that happens after the delete
});

let debounceTimer: NodeJS.Timeout | null = null;
const debouncedGenerate = (filePath: string) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`\n📝 File changed: ${relativePath}`);
    generateRoutes();
    debounceTimer = null;
  }, 300);
};

watcher
  .on('add', (filePath) => {
    // Atomic writes (editor saves) trigger 'add' event instead of 'change'
    // This is because editors delete the file and create a new one
    const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`\n📝 [FILE UPDATE] ${relativePath}`);
    console.log(`   Event: add (likely atomic write from editor)`);
    console.log(`   Time: ${new Date().toLocaleTimeString()}`);
    debouncedGenerate(filePath);
  })
  .on('change', (filePath) => {
    // Regular file changes
    const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`\n📝 [FILE UPDATE] ${relativePath}`);
    console.log(`   Event: change`);
    console.log(`   Time: ${new Date().toLocaleTimeString()}`);
    debouncedGenerate(filePath);
  })
  .on('unlink', (filePath) => {
    // File deletion - regenerate routes to remove it
    const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`\n🗑️  [FILE DELETED] ${relativePath}`);
    debouncedGenerate(filePath);
  })
  .on('error', (error) => {
    console.error('\n❌ [ERROR] Watcher error:', error);
  })
  .on('ready', () => {
    console.log('✅ Route watcher is ready and monitoring for changes');
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Polling: enabled (500ms interval)`);
    console.log(`   Watching ${watchPatterns.length} pattern(s):`);
    watchPatterns.forEach((p, i) => {
      console.log(`     ${i + 1}. ${p}`);
    });
    console.log('\n   💡 Save any page.tsx file to trigger route regeneration');
    console.log('   ⚡ The watcher will detect both "add" and "change" events\n');
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down route watcher...');
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down route watcher...');
  watcher.close();
  process.exit(0);
});

