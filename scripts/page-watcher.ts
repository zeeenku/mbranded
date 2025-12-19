/**
 * File watcher for auto-generating page.tsx templates
 * Watches for new or empty page.tsx files and auto-fills them with the createPage pattern
 */

import { watch } from 'chokidar';
import { readFile, writeFile, stat } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';

const PAGES_DIR = join(process.cwd(), 'app/(apps)/admin/(pages)');
const CREATE_PAGE_PATTERN = /createPage/;
const MIN_FILE_SIZE = 50; // Bytes - if file is smaller, consider it empty/new

/**
 * Extract route from file path
 * Example: app/(apps)/admin/(pages)/brands/[id]/page.tsx → /admin/brands/[id]
 */
function extractRouteFromPath(filePath: string): {
  route: string;
  params: string[];
  pageName: string;
} {
  const relativePath = relative(PAGES_DIR, filePath);
  const pathParts = relativePath.split(/[/\\]/).filter(Boolean);
  
  // Remove 'page.tsx' from the end
  const routeParts = pathParts.slice(0, -1);
  
  // Extract params (folders starting with [)
  const params: string[] = [];
  const routeSegments: string[] = [];
  
  routeParts.forEach(part => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1);
      params.push(paramName);
      routeSegments.push(part);
    } else {
      routeSegments.push(part);
    }
  });
  
  const route = `/admin/${routeSegments.join('/')}`;
  const pageName = routeSegments[routeSegments.length - 1] || 'page';
  
  return { route, params, pageName };
}

/**
 * Generate page name for the component
 */
function generatePageName(route: string): string {
  const parts = route.split('/').filter(Boolean);
  if (parts.length === 1) return 'Home';
  
  const lastPart = parts[parts.length - 1];
  // Convert [id] to Detail, or capitalize first letter
  if (lastPart.startsWith('[')) {
    const beforeParam = parts[parts.length - 2];
    return beforeParam ? `${capitalize(beforeParam)} Detail` : 'Detail';
  }
  
  return capitalize(lastPart);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate page template based on route and params
 */
function generatePageTemplate(
  route: string,
  params: string[],
  pageName: string
): string {
  const displayName = generatePageName(route);
  const hasParams = params.length > 0;
  const paramsType = hasParams
    ? `{ ${params.map(p => `${p}: string`).join('; ')} }`
    : '{}';
  
  const paramsComment = hasParams
    ? ` * Params: { ${params.map(p => `${p}: string`).join(', ')} } (auto-inferred from ${params.map(p => `[${p}]`).join(', ')} folder${params.length > 1 ? 's' : ''})\n`
    : '';
  
  const paramsUsage = hasParams
    ? `  const { ${params.join(', ')} } = await params;\n\n`
    : '';
  
  const paramsDisplay = hasParams
    ? `      <p className="text-gray-600">${params.map(p => `${capitalize(p)}: {${p}}`).join(', ')}</p>\n`
    : '';

  return `/**
 * Admin ${displayName} Page
 * Route: ${route} (auto-inferred)
${paramsComment} */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

export const page = createPage({
  searchParams: {},
})(async ({ params, searchParams }) => {
${paramsUsage}  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">${displayName}</h1>
      <p className="text-gray-600">Welcome to the ${displayName.toLowerCase()} page</p>
${paramsDisplay}    </div>
  );
});

export default page;
`;
}

/**
 * Check if file needs template generation
 */
async function needsTemplate(filePath: string): Promise<boolean> {
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      return true;
    }
    
    const stats = await stat(filePath);
    
    // If file is very small (likely empty or just created), generate template
    if (stats.size < MIN_FILE_SIZE) {
      return true;
    }
    
    // Check if file already has createPage pattern
    const content = await readFile(filePath, 'utf-8');
    
    // If file has createPage, don't overwrite
    if (CREATE_PAGE_PATTERN.test(content)) {
      return false;
    }
    
    // If file has some content but no createPage, check if it's a valid React component
    // If it's just a comment or minimal content, we can still generate
    const trimmedContent = content.trim();
    if (trimmedContent.length > 200 && !trimmedContent.includes('export')) {
      // File has substantial content but no exports - might be user's work in progress
      // Don't overwrite
      return false;
    }
    
    // File exists but doesn't have createPage pattern - generate template
    return true;
  } catch (error) {
    // If we can't read it, assume it needs a template
    console.warn(`Warning: Could not read ${filePath}, will attempt to generate template`);
    return true;
  }
}

/**
 * Process a page file - generate template if needed
 */
export async function processPageFile(filePath: string, isNewFile: boolean = false) {
  try {
    const needsUpdate = await needsTemplate(filePath);
    if (!needsUpdate) {
      if (isNewFile) {
        console.log(`ℹ️  File already has createPage pattern: ${relative(process.cwd(), filePath)}`);
      }
      return; // File already has the correct format
    }
    
    const { route, params } = extractRouteFromPath(filePath);
    const pageName = generatePageName(route);
    const template = generatePageTemplate(route, params, pageName);
    
    // Check if file exists and has substantial content - if so, don't overwrite
    const fileExists = existsSync(filePath);
    if (fileExists) {
      try {
        const existingContent = await readFile(filePath, 'utf-8');
        const trimmedContent = existingContent.trim();
        
        // If file has substantial content (more than just a comment or whitespace), don't overwrite
        // But if it's just a comment or very minimal, we can still generate
        if (trimmedContent.length > 100 && 
            (trimmedContent.includes('export') || 
             trimmedContent.includes('function') || 
             trimmedContent.includes('const') ||
             trimmedContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length > 3)) {
          // File has substantial content - don't overwrite, just log
          console.log(`⚠️  File has content but missing createPage pattern: ${relative(process.cwd(), filePath)}`);
          console.log(`   Route would be: ${route}`);
          console.log(`   Please add createPage manually or clear the file to auto-generate`);
          return;
        }
        // Otherwise, it's just a comment or minimal content - safe to overwrite
      } catch {
        // If we can't read, proceed with generation
      }
    }
    
    await writeFile(filePath, template, 'utf-8');
    console.log(`✅ Auto-generated template for: ${route}`);
    console.log(`   File: ${relative(process.cwd(), filePath)}`);
    if (params.length > 0) {
      console.log(`   Params: ${params.join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

/**
 * Main watcher function
 */
export async function startPageWatcher() {
  console.log('🔍 Starting page watcher...');
  console.log(`📁 Watching: ${PAGES_DIR}`);
  
  const watcher = watch(`${PAGES_DIR}/**/page.tsx`, {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
  });
  
  watcher
    .on('add', async (filePath) => {
      console.log(`\n📄 New file detected: ${relative(process.cwd(), filePath)}`);
      await processPageFile(filePath, true);
    })
    .on('change', async (filePath) => {
      // Only process if file seems empty or doesn't have createPage
      const needsUpdate = await needsTemplate(filePath);
      if (needsUpdate) {
        console.log(`\n📝 File changed (needs template): ${relative(process.cwd(), filePath)}`);
        await processPageFile(filePath, false);
      }
    })
    .on('error', (error) => {
      console.error('❌ Watcher error:', error);
    });
  
  console.log('✅ Page watcher is running. Create new page.tsx files to auto-generate templates!\n');
  
  // Process existing files on startup
  watcher.on('ready', () => {
    console.log('✨ Initial scan complete\n');
  });
  
  return watcher;
}

// Run if executed directly
if (require.main === module) {
  startPageWatcher().catch(console.error);
}

