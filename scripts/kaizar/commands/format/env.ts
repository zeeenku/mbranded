import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getAllEnvFiles, normalizeEnvFileSpacing } from '../../lib/utils';

export function registerFormatEnvCommand(command: Command) {
  command
    .command('format:env')
    .description('Reformat all .env files in the codebase (normalize spacing, preserve comments)')
    .option('-f, --file <file>', 'Specific .env file to format (default: all .env files)')
    .action((options) => {
      const envFiles: string[] = [];
      
      if (options.file) {
        // Format specific file
        const filePath = join(process.cwd(), options.file);
        if (existsSync(filePath)) {
          envFiles.push(filePath);
        } else {
          console.error(`❌ File not found: ${options.file}`);
          process.exit(1);
        }
      } else {
        // Find all .env files in root directory
        try {
          const fileNames = getAllEnvFiles();
          envFiles.push(...fileNames.map(file => join(process.cwd(), file)));
        } catch (error) {
          console.error('❌ Error reading directory:', error);
          process.exit(1);
        }
      }
      
      if (envFiles.length === 0) {
        console.log('ℹ️  No .env files found to format.');
        return;
      }
      
      console.log(`🔧 Formatting ${envFiles.length} .env file(s)...\n`);
      
      for (const filePath of envFiles) {
        const fileName = filePath.split(/[/\\]/).pop();
        
        if (!existsSync(filePath)) {
          console.log(`⚠️  ${fileName}: File not found, skipping`);
          continue;
        }
        
        try {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          const normalized = normalizeEnvFileSpacing(lines);
          const newContent = normalized.join('\n') + '\n';
          
          // Only write if content changed
          if (content !== newContent) {
            writeFileSync(filePath, newContent, 'utf-8');
            console.log(`✅ ${fileName}: Formatted`);
          } else {
            console.log(`ℹ️  ${fileName}: Already formatted`);
          }
        } catch (error) {
          console.error(`❌ ${fileName}: Error formatting - ${error}`);
        }
      }
      
      console.log('\n✨ Done!');
    });
}

