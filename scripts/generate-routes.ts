/**
 * Route codegen script
 * Scans pages and generates typed route definitions
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { getRouteGenConfig } from '../route-gen.config';

const config = getRouteGenConfig();
const PAGES_DIRS = (config.pagesDirs || ['app/(apps)/admin/(pages)']).map(dir => 
  join(process.cwd(), dir)
);
const OUTPUT_FILE = join(process.cwd(), config.outputFile || 'app/(apps)/admin/lib/routes.d.ts');

interface RouteInfo {
  routeId: string;
  path: string;
  params: Record<string, string>; // Type as string | number, etc.
  searchParams: Record<string, any>;
  filePath: string;
}

/**
 * Convert route path to camelCase route ID
 * /admin/brands/[id] -> brandDetail
 * /admin/brands/[id]/[idd] -> brandIddDetail
 */
function pathToRouteId(path: string): string {
  const parts = path
    .replace(/^\/admin\//, '')
    .split('/')
    .filter(Boolean);
  
  if (parts.length === 0) return 'home';
  
  // Find the last non-param part (the resource name)
  let resourceName = '';
  let paramParts: string[] = [];
  
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.startsWith('[') && part.endsWith(']')) {
      paramParts.unshift(part.slice(1, -1));
    } else {
      resourceName = part;
      break;
    }
  }
  
  // Convert resource name to camelCase
  const camelResource = resourceName
    .split(/[-_]/)
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  // If we have params, add them capitalized + "Detail"
  if (paramParts.length > 0) {
    const paramSuffix = paramParts
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
    return camelResource + paramSuffix + 'Detail';
  }
  
  return camelResource;
}

/**
 * Extract route from file path
 */
function extractRouteFromPath(filePath: string, pagesDir: string): string {
  const relativePath = relative(pagesDir, filePath);
  const pathParts = relativePath.split(/[/\\]/).filter(Boolean);
  
  // Remove 'page.tsx' from the end
  const routeParts = pathParts.slice(0, -1);
  
  // Build route path - detect if it's admin or other app
  // Pattern: (apps)/admin/(pages)/... or (apps)/other/(pages)/...
  let routePrefix = '/admin';
  if (pagesDir.includes('(apps)')) {
    const appMatch = pagesDir.match(/\(apps\)[\\/]([^\\/]+)/);
    if (appMatch) {
      routePrefix = `/${appMatch[1]}`;
    }
  }
  
  const route = `${routePrefix}/${routeParts.join('/')}`;
  return route;
}

/**
 * Parse TypeScript to extract createPage generic types
 * Improved parser that handles nested types better
 */
function parseCreatePageTypes(fileContent: string): {
  params?: Record<string, string>;
  searchParams?: Record<string, any>;
} {
  const result: {
    params?: Record<string, string>;
    searchParams?: Record<string, any>;
  } = {};
  
  // Match: createPage<{ id: number }, { tab: 'details' | 'settings' }>({...})
  const genericMatch = fileContent.match(/createPage\s*<([^>]+)>\s*\(/);
  let parts: string[] = [];
  
  if (genericMatch) {
    const generics = genericMatch[1];
    
    // Split generics by comma, respecting nested braces and angle brackets
    let depth = 0;
    let angleDepth = 0;
    let current = '';
    
    for (let i = 0; i < generics.length; i++) {
      const char = generics[i];
      if (char === '{') depth++;
      if (char === '}') depth--;
      if (char === '<') angleDepth++;
      if (char === '>') angleDepth--;
      
      if (char === ',' && depth === 0 && angleDepth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());
    
    // First part is params type
    if (parts[0]) {
      const paramsStr = parts[0].trim();
      if (paramsStr !== '{}' && paramsStr.startsWith('{')) {
        // Extract param types: { id: number } or { id: string }
        // Match patterns like: id: number, id: string, etc.
        const paramRegex = /(\w+)\s*:\s*(\w+)/g;
        let match;
        result.params = {};
        while ((match = paramRegex.exec(paramsStr)) !== null) {
          const [, name, type] = match;
          result.params[name] = type;
        }
      }
    }
  }
  
  // Extract searchParams from generic (second parameter)
  // Match: createPage<{ id: number }, { tab: 'details' | 'settings' | 'history' }>
  if (parts.length > 1 && parts[1]) {
    const searchParamsStr = parts[1].trim();
    if (searchParamsStr !== '{}' && searchParamsStr.startsWith('{')) {
      // Extract search param types from generic
      // Match patterns like: tab?: 'details' | 'settings' | 'history'
      // or: tab: 'details' | 'settings'
      const searchParamRegex = /(\w+)\??\s*:\s*([^;]+)/g;
      let match;
      result.searchParams = {};
      while ((match = searchParamRegex.exec(searchParamsStr)) !== null) {
        const [, name, type] = match;
        result.searchParams[name] = type.trim();
      }
    }
  }
  
  // Fallback: Extract searchParams from config object if not found in generic
  if (!result.searchParams || Object.keys(result.searchParams).length === 0) {
    // Match: searchParams: { tab: 'details' as 'details' | 'settings' | 'history' }
    const searchParamsConfigMatch = fileContent.match(/searchParams:\s*\{([^}]+)\}/s);
    if (searchParamsConfigMatch) {
      const configContent = searchParamsConfigMatch[1];
      result.searchParams = {};
      
      // Split by lines and process each
      const lines = configContent.split(/[,\n]/).filter(l => l.trim() && !l.trim().startsWith('//'));
      for (const line of lines) {
        const trimmed = line.trim();
        // Match: tab: 'details' or tab: 'details' as 'details' | 'settings'
        const match = trimmed.match(/(\w+)\s*:\s*(.+?)(?:\s*as\s*(.+))?$/);
        if (match) {
          const [, name, value, typeHint] = match;
          // Use type hint if available (the 'as' part), otherwise use the value
          const finalType = typeHint?.trim() || value.trim();
          result.searchParams[name] = finalType;
        }
      }
    }
  }
  
  return result;
}

/**
 * Check if a route should be included based on config
 */
function shouldIncludeRoute(route: string): boolean {
  // Check exclude patterns
  if (config.exclude && config.exclude.length > 0) {
    for (const pattern of config.exclude) {
      if (route.includes(pattern) || route.match(new RegExp(pattern))) {
        return false;
      }
    }
  }
  
  // Check include patterns (if specified)
  if (config.include && config.include.length > 0) {
    for (const pattern of config.include) {
      if (route.includes(pattern) || route.match(new RegExp(pattern))) {
        return true;
      }
    }
    return false; // Not in include list
  }
  
  return true; // Include by default
}

/**
 * Get custom route ID if mapped, otherwise use generated one
 */
function getRouteId(route: string, generatedId: string): string {
  if (config.routeIdMap && config.routeIdMap[route]) {
    return config.routeIdMap[route];
  }
  return generatedId;
}

/**
 * Scan directory for page.tsx files
 */
function scanPages(dir: string, baseRoute: string = '', pagesDir: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  if (!existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return routes;
  }
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const newBaseRoute = baseRoute ? `${baseRoute}/${entry.name}` : entry.name;
      routes.push(...scanPages(fullPath, newBaseRoute, pagesDir));
    } else if (entry.name === 'page.tsx') {
      // Found a page file
      const route = extractRouteFromPath(fullPath, pagesDir);
      
      // Check if route should be included
      if (!shouldIncludeRoute(route)) {
        continue; // Skip this route
      }
      
      const generatedRouteId = pathToRouteId(route);
      const routeId = getRouteId(route, generatedRouteId);
      
      // Read file to extract types
      let params: Record<string, string> = {};
      let searchParams: Record<string, any> = {};
      
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const extracted = parseCreatePageTypes(content);
        
        // Extract params from route path (default to string)
        const paramMatches = route.match(/\[([^\]]+)\]/g);
        if (paramMatches) {
          paramMatches.forEach(match => {
            const paramName = match.slice(1, -1);
            // Use extracted type if available, otherwise default to string
            params[paramName] = extracted.params?.[paramName] || 'string';
          });
        }
        
        // Extract searchParams - prioritize generic type, fallback to config object
        // First try to get from generic (second parameter)
        if (extracted.searchParams && Object.keys(extracted.searchParams).length > 0) {
          // Use types from generic
          Object.assign(searchParams, extracted.searchParams);
        } else {
          // Fallback: extract from config object
          // Try to match: searchParams: { tab: 'details' as 'details' | 'settings' }
          const searchParamsConfigMatch = content.match(/searchParams:\s*\{([^}]+)\}/s);
          if (searchParamsConfigMatch) {
            const configStr = searchParamsConfigMatch[1];
            const lines = configStr.split(/[,\n]/).filter(l => l.trim() && !l.trim().startsWith('//'));
            lines.forEach(line => {
              const trimmed = line.trim();
              // Match: tab: 'details' or tab: 'details' as 'details' | 'settings'
              const match = trimmed.match(/(\w+)\s*:\s*(.+?)(?:\s*as\s*(.+))?$/);
              if (match) {
                const [, name, value, typeHint] = match;
                // Use type hint if available (the 'as' part), otherwise use the value
                const finalType = typeHint?.trim() || value.trim();
                searchParams[name] = finalType;
              }
            });
          }
        }
      } catch (error) {
        console.warn(`Error reading ${fullPath}:`, error);
      }
      
      routes.push({
        routeId,
        path: route,
        params,
        searchParams,
        filePath: relative(process.cwd(), fullPath),
      });
    }
  }
  
  return routes;
}

/**
 * Generate TypeScript definition file
 */
function generateRoutesFile(routes: RouteInfo[]): string {
  const routeIds = routes.map(r => r.routeId);
  const routeIdType = routeIds.map(id => `'${id}'`).join(' | ');
  
  let output = `/**
 * Auto-generated route definitions
 * DO NOT EDIT - This file is generated by scripts/generate-routes.ts
 * Run: pnpm run generate:routes
 */

export const routes = {
`;

  // Generate route objects
  for (const route of routes) {
    // Format params type - use proper TypeScript types
    let paramsType = '{}';
    if (Object.keys(route.params).length > 0) {
      const paramEntries = Object.entries(route.params).map(([k, v]) => {
        // Map string type names to actual TypeScript types
        const type = v === 'number' ? 'number' : v === 'string' ? 'string' : 'string';
        return `${k}: ${type}`;
      });
      paramsType = `{ ${paramEntries.join('; ')} }`;
    }
    
    // Format search params type - read from actual file to get proper types
    let searchParamsType = '{}';
    if (Object.keys(route.searchParams).length > 0) {
      try {
        const fileContent = readFileSync(join(process.cwd(), route.filePath), 'utf-8');
        // Try to extract the searchParams type from createPage generic
        // Match: createPage<{ id: number }, { tab: 'details' | 'settings' | 'history' }>
        const genericMatch = fileContent.match(/createPage\s*<[^,]+,\s*\{([^}]+(?:\}[^}]*)*)\}\s*>/s);
        if (genericMatch) {
          // Extract search params from generic type - handle nested braces
          const searchTypeStr = genericMatch[1];
          const searchEntries: string[] = [];
          
          // Parse the search params type, handling union types
          // Match: tab: 'details' | 'settings' | 'history'
          // We need to match the full type including unions
          let pos = 0;
          while (pos < searchTypeStr.length) {
            // Skip whitespace
            while (pos < searchTypeStr.length && /\s/.test(searchTypeStr[pos])) pos++;
            if (pos >= searchTypeStr.length) break;
            
            // Match param name
            const nameMatch = searchTypeStr.slice(pos).match(/^(\w+)\s*:/);
            if (!nameMatch) break;
            
            const name = nameMatch[1];
            pos += nameMatch[0].length;
            
            // Skip whitespace
            while (pos < searchTypeStr.length && /\s/.test(searchTypeStr[pos])) pos++;
            
            // Extract the type value (could be union, string literal, etc.)
            let typeValue = '';
            let depth = 0;
            let inString = false;
            let stringChar = '';
            
            while (pos < searchTypeStr.length) {
              const char = searchTypeStr[pos];
              
              if (!inString && (char === "'" || char === '"')) {
                inString = true;
                stringChar = char;
                typeValue += char;
              } else if (inString && char === stringChar) {
                inString = false;
                typeValue += char;
              } else if (!inString && char === '{') {
                depth++;
                typeValue += char;
              } else if (!inString && char === '}') {
                if (depth === 0) break;
                depth--;
                typeValue += char;
              } else if (!inString && char === ';' && depth === 0) {
                break;
              } else {
                typeValue += char;
              }
              
              pos++;
            }
            
            searchEntries.push(`${name}?: ${typeValue.trim()}`);
            
            // Skip semicolon if present
            if (pos < searchTypeStr.length && searchTypeStr[pos] === ';') pos++;
          }
          
          if (searchEntries.length > 0) {
            searchParamsType = `{ ${searchEntries.join('; ')} }`;
          } else {
            // Fallback: use string for all
            const searchEntries = Object.keys(route.searchParams).map(k => `${k}?: string`);
            searchParamsType = `{ ${searchEntries.join('; ')} }`;
          }
        } else {
          // Fallback: use string for all
          const searchEntries = Object.keys(route.searchParams).map(k => `${k}?: string`);
          searchParamsType = `{ ${searchEntries.join('; ')} }`;
        }
      } catch {
        // Fallback: use string for all
        const searchEntries = Object.keys(route.searchParams).map(k => `${k}?: string`);
        searchParamsType = `{ ${searchEntries.join('; ')} }`;
      }
    }
    
    // Generate the route object with proper types
    // Use satisfies to ensure type checking without literal narrowing
    // The values are just for structure - types come from RouteParams<T>
    output += `  ${route.routeId}: {
    path: '${route.path}' as const,
    params: {} satisfies ${paramsType},
    search: {} satisfies ${searchParamsType},
  },
`;
  }

  output += `} as const;

export type RouteId = ${routeIdType};

// Explicit type definitions for each route
// This ensures strict type checking - no number/string coercion
export type RouteParamsMap = {
`;
  
  // Generate explicit type mapping
  for (const route of routes) {
    let paramsType = '{}';
    if (Object.keys(route.params).length > 0) {
      const paramEntries = Object.entries(route.params).map(([k, v]) => {
        const type = v === 'number' ? 'number' : 'string';
        return `${k}: ${type}`;
      });
      paramsType = `{ ${paramEntries.join('; ')} }`;
    }
    output += `  ${route.routeId}: ${paramsType};\n`;
  }
  
  output += `};

export type RouteSearchMap = {
`;
  
  // Generate explicit search params type mapping
  for (const route of routes) {
    let searchParamsType = '{}';
    if (Object.keys(route.searchParams).length > 0) {
      try {
        const fileContent = readFileSync(join(process.cwd(), route.filePath), 'utf-8');
        const genericMatch = fileContent.match(/createPage\s*<[^,]+,\s*\{([^}]+(?:\}[^}]*)*)\}\s*>/s);
        if (genericMatch) {
          const searchTypeStr = genericMatch[1];
          const searchEntries: string[] = [];
          
          let pos = 0;
          while (pos < searchTypeStr.length) {
            while (pos < searchTypeStr.length && /\s/.test(searchTypeStr[pos])) pos++;
            if (pos >= searchTypeStr.length) break;
            
            const nameMatch = searchTypeStr.slice(pos).match(/^(\w+)\s*:/);
            if (!nameMatch) break;
            
            const name = nameMatch[1];
            pos += nameMatch[0].length;
            
            while (pos < searchTypeStr.length && /\s/.test(searchTypeStr[pos])) pos++;
            
            let typeValue = '';
            let depth = 0;
            let inString = false;
            let stringChar = '';
            
            while (pos < searchTypeStr.length) {
              const char = searchTypeStr[pos];
              
              if (!inString && (char === "'" || char === '"')) {
                inString = true;
                stringChar = char;
                typeValue += char;
              } else if (inString && char === stringChar) {
                inString = false;
                typeValue += char;
              } else if (!inString && char === '{') {
                depth++;
                typeValue += char;
              } else if (!inString && char === '}') {
                if (depth === 0) break;
                depth--;
                typeValue += char;
              } else if (!inString && char === ';' && depth === 0) {
                break;
              } else {
                typeValue += char;
              }
              
              pos++;
            }
            
            searchEntries.push(`${name}?: ${typeValue.trim()}`);
            
            if (pos < searchTypeStr.length && searchTypeStr[pos] === ';') pos++;
          }
          
          if (searchEntries.length > 0) {
            searchParamsType = `{ ${searchEntries.join('; ')} }`;
          } else {
            const searchEntries = Object.keys(route.searchParams).map(k => `${k}?: string`);
            searchParamsType = `{ ${searchEntries.join('; ')} }`;
          }
        } else {
          const searchEntries = Object.keys(route.searchParams).map(k => `${k}?: string`);
          searchParamsType = `{ ${searchEntries.join('; ')} }`;
        }
      } catch {
        const searchEntries = Object.keys(route.searchParams).map(k => `${k}?: string`);
        searchParamsType = `{ ${searchEntries.join('; ')} }`;
      }
    }
    output += `  ${route.routeId}: ${searchParamsType};\n`;
  }
  
  output += `};

// Path to RouteId mapping for type inference
export type RoutePathToId = {
`;
  
  // Generate path to id mapping
  for (const route of routes) {
    output += `  '${route.path}': '${route.routeId}';\n`;
  }
  
  output += `};

// Type helpers that use the explicit type maps
export type RouteParams<T extends RouteId> = RouteParamsMap[T];
export type RouteSearch<T extends RouteId> = RouteSearchMap[T];
export type RoutePath<T extends RouteId> = typeof routes[T]['path'];

// Union of all route paths (for use in TypedLink)
// This is the union of all path strings from the routes object
export type RoutePathUnion = 
`;

  // Generate union of all paths
  const pathUnions = routes.map(r => `  | '${r.path}'`).join('\n');
  output += pathUnions;
  output += `;
`;

  return output;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning pages directories...');
  console.log(`📁 Directories: ${PAGES_DIRS.map(d => relative(process.cwd(), d)).join(', ')}`);
  
  const allRoutes: RouteInfo[] = [];
  
  // Scan all configured directories
  for (const pagesDir of PAGES_DIRS) {
    if (!existsSync(pagesDir)) {
      console.warn(`⚠️  Directory not found: ${relative(process.cwd(), pagesDir)}`);
      continue;
    }
    
    const routes = scanPages(pagesDir, '', pagesDir);
    allRoutes.push(...routes);
  }
  
  console.log(`✅ Found ${allRoutes.length} routes:`);
  allRoutes.forEach(route => {
    console.log(`   ${route.routeId} -> ${route.path}`);
  });
  
  if (config.exclude && config.exclude.length > 0) {
    console.log(`\n🚫 Excluded patterns: ${config.exclude.join(', ')}`);
  }
  if (config.include && config.include.length > 0) {
    console.log(`\n✅ Included patterns: ${config.include.join(', ')}`);
  }
  
  console.log('\n📝 Generating routes.d.ts...');
  const content = generateRoutesFile(allRoutes);
  
  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) {
    require('fs').mkdirSync(outputDir, { recursive: true });
  }
  
  writeFileSync(OUTPUT_FILE, content, 'utf-8');
  console.log(`✅ Generated: ${relative(process.cwd(), OUTPUT_FILE)}`);
  console.log('\n✨ Done! Routes are now type-safe.');
}

if (require.main === module) {
  main();
}

export { scanPages, generateRoutesFile, pathToRouteId };

