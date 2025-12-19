/**
 * Next.js plugin for automatic route generation
 * Integrates route generation into Next.js build/dev lifecycle
 */

import type { NextConfig } from 'next';
import { execSync } from 'child_process';
import { watch } from 'chokidar';
import { join } from 'path';
import { getRouteGenConfig } from './route-gen.config';

const config = getRouteGenConfig();
const PAGES_DIRS = (config.pagesDirs || ['app/(apps)/admin/(pages)']).map(dir => 
  join(process.cwd(), dir)
);

function generateRoutes() {
  if (isGenerating) {
    return; // Prevent concurrent generations
  }
  
  isGenerating = true;
  try {
    const output = execSync('tsx scripts/generate-routes.ts', { 
      stdio: 'pipe', // Use pipe to avoid cluttering output
      cwd: process.cwd(),
      encoding: 'utf-8',
    });
    // Show output in dev mode for debugging
    if (process.env.NODE_ENV !== 'production') {
      const lines = output.toString().split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        console.log('📝 Route generation output:');
        lines.forEach(line => console.log(`   ${line}`));
      }
    }
  } catch (error: any) {
    const errorMessage = error?.stderr?.toString() || error?.message || String(error);
    console.error('❌ Failed to generate routes:', errorMessage);
    // Don't exit in dev mode, but fail in build
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } finally {
    isGenerating = false;
  }
}

let watcher: any = null;
let isGenerating = false;
let hasGenerated = false;

export function withRouteGeneration(
  nextConfig: NextConfig = {},
  options: {
    watch?: boolean; // Watch for changes in dev mode (overrides config)
    pagesDirs?: string[]; // Override pages directories
  } = {}
) {
  const enableWatch = options.watch !== undefined ? options.watch : (config.watch ?? true);
  const pagesDirs = options.pagesDirs ? options.pagesDirs.map(d => join(process.cwd(), d)) : PAGES_DIRS;

  // Generate routes immediately when plugin is loaded (before Next.js starts)
  if (!hasGenerated) {
    console.log('🔧 Generating routes before Next.js compilation...');
    generateRoutes();
    hasGenerated = true;
  }

  // Set up file watcher in dev mode (runs once when plugin loads)
  // IMPORTANT: Keep watcher reference alive to prevent garbage collection
  if (enableWatch && !watcher && process.env.NODE_ENV !== 'production') {
    // Watch all configured directories - use proper path joining for Windows
    const watchPatterns = pagesDirs.map(dir => join(dir, '**', 'page.tsx'));
    console.log('👀 Watching for changes in:', watchPatterns.join(', '));
    
    watcher = watch(watchPatterns, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true, // Don't trigger on initial scan
      usePolling: process.platform === 'win32', // Use polling on Windows for better reliability
      interval: 1000, // Poll every 1 second on Windows
      atomic: true, // Wait for atomic writes to complete
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });

    let debounceTimer: NodeJS.Timeout;
    const debouncedGenerate = (filePath: string) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        console.log(`🔄 Regenerating routes (triggered by: ${relativePath})...`);
        generateRoutes();
      }, 300); // Reduced debounce for faster response
    };

    watcher
      .on('add', (filePath) => {
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        console.log(`📄 Page file added: ${relativePath}`);
        debouncedGenerate(filePath);
      })
      .on('change', (filePath) => {
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        console.log(`📝 Page file changed: ${relativePath}`);
        debouncedGenerate(filePath);
      })
      .on('unlink', (filePath) => {
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        console.log(`🗑️  Page file removed: ${relativePath}`);
        debouncedGenerate(filePath);
      })
      .on('error', (error) => {
        console.error('❌ Watcher error:', error);
      })
      .on('ready', () => {
        console.log('✅ Route generation watcher active and ready');
        console.log(`   Watching ${watchPatterns.length} pattern(s) for changes`);
        console.log(`   Platform: ${process.platform}, Polling: ${process.platform === 'win32' ? 'enabled' : 'disabled'}`);
      })
      .on('raw', (event, path, details) => {
        // Debug: log raw file system events
        if (process.env.DEBUG_ROUTE_WATCHER) {
          console.log(`🔍 Raw event: ${event} on ${path}`);
        }
      });

    // Keep watcher reference alive by storing it globally
    // This prevents Next.js from garbage collecting it
    (global as any).__routeGenWatcher = watcher;
    
    // Prevent process from exiting (keeps watcher alive)
    // This is critical for the watcher to continue working
    process.on('SIGINT', () => {
      if (watcher) {
        watcher.close();
      }
    });
    
    process.on('SIGTERM', () => {
      if (watcher) {
        watcher.close();
      }
    });
    
    console.log('✅ Route generation watcher initialized');
    console.log('   💡 Tip: Save a page.tsx file to test the watcher');
    console.log('   🔍 Debug: Set DEBUG_ROUTE_WATCHER=1 to see raw file events');
  }

  return {
    ...nextConfig,
    
    // Add empty turbopack config to silence the warning
    // Routes are generated before Next.js starts, so we don't need build hooks
    turbopack: nextConfig.turbopack || {},
  };
}

