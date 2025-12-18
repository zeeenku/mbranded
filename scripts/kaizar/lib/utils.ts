import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Types
export interface EnvSection {
  name: string;
  startLine: number;
  endLine: number;
  lines: string[];
}

// Parse .env file with sections
export function parseEnvFileWithSections(filePath: string): {
  sections: EnvSection[];
  allLines: string[];
} {
  if (!existsSync(filePath)) {
    return { sections: [], allLines: [] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const sections: EnvSection[] = [];
  
  let currentSection: EnvSection | null = null;
  
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    // Detect section header: # * SECTION_NAME (trim first to handle whitespace/line endings)
    const trimmed = line.trim();
    const sectionMatch = trimmed.match(/^# \* (.+)$/);
    if (sectionMatch) {
      // Close previous section
      if (currentSection !== null) {
        currentSection.endLine = index - 1;
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        name: sectionMatch[1],
        startLine: index,
        endLine: lines.length - 1,
        lines: [line],
      };
    } else if (currentSection !== null) {
      currentSection.lines.push(line);
    }
  }
  
  // Close last section
  if (currentSection !== null) {
    currentSection.endLine = lines.length - 1;
    sections.push(currentSection);
  }
  
  return { sections, allLines: lines };
}

// Get available sections from .env.example
export function getAvailableSections(): string[] {
  const examplePath = join(process.cwd(), '.env.example');
  
  if (!existsSync(examplePath)) {
    console.warn(`⚠️  .env.example not found at ${examplePath}`);
    return [];
  }
  
  const { sections } = parseEnvFileWithSections(examplePath);
  
  if (sections.length === 0) {
    console.warn(`⚠️  No sections found in .env.example`);
  }
  
  return sections.map(s => s.name);
}

// Validate variable name format
export function validateVarName(varName: string): { valid: boolean; error?: string } {
  // Must be uppercase
  if (varName !== varName.toUpperCase()) {
    return { valid: false, error: 'Variable name must be UPPERCASE' };
  }
  
  // Must start with letter or underscore
  if (!/^[A-Z_]/.test(varName)) {
    return { valid: false, error: 'Variable name must start with letter or underscore' };
  }
  
  // Only letters, numbers, and underscores
  if (!/^[A-Z0-9_]+$/.test(varName)) {
    return { valid: false, error: 'Variable name can only contain letters, numbers, and underscores' };
  }
  
  // Cannot be just numbers
  if (/^\d+$/.test(varName)) {
    return { valid: false, error: 'Variable name cannot be only numbers' };
  }
  
  return { valid: true };
}

// Popular Zod type options
export const zodTypeOptions = [
  { title: 'URI/URL (z.url())', value: 'url' },
  { title: 'String (z.string().min(1))', value: 'string' },
  { title: 'Number (z.number())', value: 'number' },
  { title: 'Boolean (z.boolean())', value: 'boolean' },
  { title: 'Email (z.string().email().min(1))', value: 'email' },
  { title: 'Port (z.number().int().positive().max(65535))', value: 'port' },
  { title: 'String with min length (z.string().min(n))', value: 'string-min' },
];

// Create Zod schema from type
export function createZodSchema(type: string, minLength?: number): z.ZodTypeAny {
  switch (type) {
    case 'string':
      return z.string();
    case 'url':
      return z.url();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'string-min':
      return z.string().min(minLength || 1);
    case 'email':
      return z.string().email();
    case 'port':
      return z.number().int().positive().max(65535);
    default:
      return z.string();
  }
}

// Validate value against schema
export function validateValue(value: string, schema: z.ZodTypeAny, type: string): {
  valid: boolean;
  parsed?: any;
  error?: string;
} {
  try {
    let parsed: any = value;
    
    // Parse based on type
    if (type === 'number' || type === 'port') {
      parsed = Number(value);
      if (isNaN(parsed)) {
        return { valid: false, error: 'Invalid number' };
      }
    } else if (type === 'boolean') {
      parsed = value.toLowerCase() === 'true' || value === '1';
    }
    
    schema.parse(parsed);
    return { valid: true, parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map((e: z.ZodIssue) => e.message).join(', '),
      };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

// Convert variable name to a human-readable placeholder
export function varNameToPlaceholder(varName: string): string {
  // Remove NEXT_PUBLIC_ prefix if present
  let name = varName.replace(/^NEXT_PUBLIC_/, '');
  
  // Convert UPPER_SNAKE_CASE to lower_snake_case
  name = name.toLowerCase();
  
  // Replace underscores with spaces for readability
  name = name.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, (char) => char.toUpperCase());
  
  return name;
}

// Get default value for type based on variable name
export function getDefaultValueForType(type: string, varName?: string): string {
  // If no varName provided, return basic defaults
  if (!varName) {
    switch (type) {
      case 'url':
        return 'http://localhost:3000';
      case 'string':
      case 'string-min':
        return '';
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      case 'email':
        return 'user@example.com';
      case 'port':
        return '3000';
      default:
        return '';
    }
  }
  
  const placeholder = varNameToPlaceholder(varName);
  const lowerPlaceholder = placeholder.toLowerCase().replace(/\s+/g, '_');
  
  switch (type) {
    case 'url':
      if (varName.toLowerCase().includes('api')) {
        return 'http://localhost:3000/api';
      }
      if (varName.toLowerCase().includes('app')) {
        return 'http://localhost:3000';
      }
      if (varName.toLowerCase().includes('database') || varName.toLowerCase().includes('db')) {
        return 'postgresql://user:password@localhost:5432/dbname';
      }
      if (varName.toLowerCase().includes('redis')) {
        return 'redis://localhost:6379';
      }
      return 'http://localhost:3000';
    case 'string':
      // Generate dynamic placeholder like "your_open_ai_key_here"
      return `your_${lowerPlaceholder}_here`;
    case 'number':
      // Try to extract number from variable name, otherwise default to 0
      const numMatch = varName.match(/\d+/);
      return numMatch ? numMatch[0] : '0';
    case 'boolean':
      return 'false';
    case 'email':
      // Generate email based on variable name
      const emailName = lowerPlaceholder.replace(/_/g, '.');
      return `${emailName}@example.com`;
    case 'port':
      // Try to extract port number, otherwise default to 3000
      const portMatch = varName.match(/(\d{4,5})/);
      return portMatch ? portMatch[1] : '3000';
    case 'string-min':
      return `your_${lowerPlaceholder}_here`;
    default:
      return '';
  }
}

// Normalize spacing in .env file (remove excessive blank lines, ensure consistent spacing)
// SAFE: Preserves ALL comments, sections, and content - only normalizes excessive blank lines
// Adds 2-3 empty lines between sections for better readability
export function normalizeEnvFileSpacing(lines: string[]): string[] {
  const normalized: string[] = [];
  let consecutiveEmptyLines = 0;
  let lastWasSectionHeader = false;
  let emptyLinesAfterSection = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isSectionHeader = /^# \* /.test(trimmed);
    const isEmpty = trimmed === '';
    
    // Section headers: ensure 2-3 blank lines before (if not first line)
    if (isSectionHeader) {
      // Add 2-3 blank lines before section if not first line
      if (normalized.length > 0) {
        // Remove any trailing empty lines first
        while (normalized.length > 0 && normalized[normalized.length - 1] === '') {
          normalized.pop();
        }
        // Add 2-3 empty lines before new section
        normalized.push('');
        normalized.push('');
        normalized.push('');
      }
      normalized.push(line);
      consecutiveEmptyLines = 0;
      lastWasSectionHeader = true;
      emptyLinesAfterSection = 0;
      continue;
    }
    
    // Empty lines: track after section headers
    if (isEmpty) {
      consecutiveEmptyLines++;
      if (lastWasSectionHeader) {
        emptyLinesAfterSection++;
        // Keep up to 2 empty lines after section header
        if (emptyLinesAfterSection <= 2) {
          normalized.push('');
        }
      } else {
        // Between other content, limit to 1-2 consecutive empty lines
        if (consecutiveEmptyLines <= 2) {
          normalized.push('');
        }
      }
      continue;
    }
    
    // Reset counters for non-empty lines
    consecutiveEmptyLines = 0;
    lastWasSectionHeader = false;
    emptyLinesAfterSection = 0;
    
    // ALL other lines (comments, variables, etc.) - preserve EXACTLY as-is
    normalized.push(line);
  }
  
  // Remove trailing empty lines
  while (normalized.length > 0 && normalized[normalized.length - 1] === '') {
    normalized.pop();
  }
  
  return normalized;
}

// Add variable to .env file in correct section
export function addVarToEnvFile(
  filePath: string,
  varName: string,
  varValue: string,
  sectionName: string
): void {
  const { sections, allLines } = parseEnvFileWithSections(filePath);
  
  // Normalize section name to uppercase for consistency
  const normalizedSectionName = sectionName.toUpperCase();
  
  // Find target section (case-insensitive match)
  let targetSection = sections.find(s => s.name.toUpperCase() === normalizedSectionName);
  
  // If section doesn't exist, create it at the end
  if (!targetSection) {
    // Ensure there's a blank line before new section
    if (allLines.length > 0 && allLines[allLines.length - 1] !== '') {
      allLines.push('');
    }
    allLines.push(`# * ${normalizedSectionName}`);
    allLines.push(`${varName}=${varValue}`);
    const normalized = normalizeEnvFileSpacing(allLines);
    writeFileSync(filePath, normalized.join('\n') + '\n', 'utf-8');
    return;
  }
  
  // Check if variable already exists
  const existingVarIndex = allLines.findIndex((line, idx) => {
    if (idx < targetSection!.startLine || idx > targetSection!.endLine) return false;
    const match = line.match(/^([^=:#]+)=/);
    return match && match[1].trim() === varName;
  });
  
  if (existingVarIndex !== -1) {
    // Update existing variable
    allLines[existingVarIndex] = `${varName}=${varValue}`;
  } else {
    // Find insertion point: after section header and any comments, before variables
    let insertIndex = targetSection.startLine + 1;
    let lastCommentIndex = -1;
    let firstVarIndex = -1;
    
    // Scan through section to find best insertion point
    for (let i = targetSection.startLine + 1; i <= targetSection.endLine; i++) {
      const line = allLines[i];
      const trimmed = line.trim();
      
      // Check if we've hit the next section
      if (trimmed.startsWith('# * ')) {
        break;
      }
      
      if (trimmed === '') {
        continue;
      }
      
      if (trimmed.startsWith('#') && !trimmed.startsWith('# * ')) {
        // It's a comment, remember its position
        lastCommentIndex = i;
      } else if (/^[^=:#]+=/.test(trimmed)) {
        // It's a variable
        if (firstVarIndex === -1) {
          firstVarIndex = i;
        }
        break;
      }
    }
    
    // Insert after last comment, or before first variable, or at end of section
    if (lastCommentIndex !== -1) {
      insertIndex = lastCommentIndex + 1;
    } else if (firstVarIndex !== -1) {
      insertIndex = firstVarIndex;
    } else {
      insertIndex = targetSection.endLine + 1;
    }
    
    // Insert variable
    allLines.splice(insertIndex, 0, `${varName}=${varValue}`);
  }
  
  // Normalize spacing and write
  const normalized = normalizeEnvFileSpacing(allLines);
  writeFileSync(filePath, normalized.join('\n') + '\n', 'utf-8');
}

// Add variable to t3-env schema
export function addVarToT3Env(varName: string, zodType: string, isClient: boolean, minLength?: number): 'added' | 'exists' | 'error' {
  const envFile = isClient
    ? join(process.cwd(), 'config/env/client.ts')
    : join(process.cwd(), 'config/env/server.ts');
  
  if (!existsSync(envFile)) {
    console.error(`❌ Env file not found: ${envFile}`);
    return 'error';
  }
  
  let content = readFileSync(envFile, 'utf-8');
  
  // Find the server/client object
  const envType = isClient ? 'client' : 'server';
  const regex = new RegExp(`(${envType}:\\s*\\{[\\s\\S]*?)(})`);
  
  if (!regex.test(content)) {
    console.error(`❌ Could not find ${envType} object in ${envFile}`);
    return 'error';
  }
  
  // Check if variable already exists
  const varExists = new RegExp(`\\s+${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`).test(content);
  if (varExists) {
    return 'exists';
  }
  
  // Create the zod schema string - ensure all variables are required
  let zodSchema = '';
  switch (zodType) {
    case 'string':
      // Make string required with .min(1)
      zodSchema = `z.string().min(1)`;
      break;
    case 'url':
      // URL is already required (can't be empty), but we can add .min(1) for consistency
      zodSchema = `z.url()`;
      break;
    case 'number':
      // Number is already required
      zodSchema = `z.number()`;
      break;
    case 'boolean':
      // Boolean is already required
      zodSchema = `z.boolean()`;
      break;
    case 'string-min':
      // Already has min length validation
      zodSchema = `z.string().min(${minLength || 1})`;
      break;
    case 'email':
      // Make email required with .min(1)
      zodSchema = `z.string().email().min(1)`;
      break;
    case 'port':
      // Port is already required (number validation)
      zodSchema = `z.number().int().positive().max(65535)`;
      break;
    default:
      // Default to required string
      zodSchema = `z.string().min(1)`;
  }
  
  // Add the variable to the schema
  content = content.replace(
    regex,
    `$1\n    ${varName}: ${zodSchema},\n  $2`
  );
  
  // If client env, also add to runtimeEnv
  if (isClient) {
    const runtimeEnvRegex = /(runtimeEnv:\s*\{[\s\S]*?)(})/;
    if (runtimeEnvRegex.test(content)) {
      content = content.replace(
        runtimeEnvRegex,
        `$1\n    ${varName}: process.env.${varName},\n  $2`
      );
    }
  }
  
  writeFileSync(envFile, content, 'utf-8');
  return 'added';
}

// Get all .env files in the root directory
export function getAllEnvFiles(): string[] {
  const rootDir = process.cwd();
  const envFiles: string[] = [];
  
  try {
    const files = readdirSync(rootDir);
    for (const file of files) {
      if (file.startsWith('.env') && !file.includes('node_modules')) {
        const filePath = join(rootDir, file);
        const stats = statSync(filePath);
        if (stats.isFile()) {
          envFiles.push(file);
        }
      }
    }
    
    // Sort: .env.example first (blueprint), then others alphabetically
    envFiles.sort((a, b) => {
      if (a === '.env.example') return -1;
      if (b === '.env.example') return 1;
      return a.localeCompare(b);
    });
  } catch (error) {
    console.error('❌ Error reading directory:', error);
    throw error;
  }
  
  return envFiles;
}

