import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import prompts from 'prompts';
import {
  getAllEnvFiles,
  getAvailableSections,
  validateVarName,
  zodTypeOptions,
  createZodSchema,
  getDefaultValueForType,
  validateValue,
  addVarToEnvFile,
  addVarToT3Env,
  normalizeEnvFileSpacing,
} from '../lib/utils';

export function registerAddEnvCommand(command: Command) {
  command
    .command('add:env')
    .description('Add environment variables interactively with validation')
    .option('-f, --file <file>', 'Specific .env file to update (default: detects and updates all existing .env files)')
    .argument('<vars>', 'Comma-separated variable names (e.g., DATABASE_URL,API_KEY)')
    .action(async (varsArg: string, options) => {
      // Determine which files to update
      const filesToUpdate: string[] = [];
      
      if (options.file) {
        // If specific file provided, only update that one
        filesToUpdate.push(options.file);
      } else {
        // Default: detect all existing .env files in root directory
        try {
          filesToUpdate.push(...getAllEnvFiles());
        } catch (error) {
          console.error('❌ Error reading directory:', error);
          process.exit(1);
        }
      }
      
      if (filesToUpdate.length === 0) {
        console.log('ℹ️  No .env files found. Creating .env and .env.example...');
        filesToUpdate.push('.env', '.env.example');
      }
      
      const filePaths = filesToUpdate.map(file => ({
        name: file,
        path: join(process.cwd(), file),
      }));
      
      console.log(`📋 Will update ${filePaths.length} file(s): ${filePaths.map(f => f.name).join(', ')}`);
      
      // Parse variable names
      let varNames = varsArg.split(',').map(v => v.trim()).filter(Boolean);
      
      if (varNames.length === 0) {
        console.error('❌ No variable names provided');
        process.exit(1);
      }
      
      // Validate and retry variable names interactively
      console.log('🔍 Validating variable name format...\n');
      const validatedVarNames: string[] = [];
      
      for (let i = 0; i < varNames.length; i++) {
        let varName = varNames[i];
        let validation = validateVarName(varName);
        let isRetry = false;
        
        while (!validation.valid) {
          if (isRetry) {
            console.error(`❌ ${varName}: ${validation.error}`);
            console.log('   Please enter a valid variable name...\n');
          } else {
            console.error(`❌ ${varName}: ${validation.error}`);
          }
          
          const retryResponse = await prompts({
            type: 'text',
            name: 'varName',
            message: isRetry 
              ? `Variable name (validation failed, please try again):`
              : `Variable name (${validation.error}):`,
            initial: varName.toUpperCase(),
            validate: (value: string) => {
              if (!value.trim()) return 'Variable name is required';
              const v = validateVarName(value.trim());
              if (!v.valid) return v.error || 'Invalid format';
              return true;
            },
          });
          
          if (retryResponse.varName === undefined) {
            console.log('❌ Variable name input cancelled');
            console.log('⏭️  Skipping this variable');
            break;
          }
          
          varName = retryResponse.varName.trim();
          validation = validateVarName(varName);
          isRetry = true;
        }
        
        if (validation.valid) {
          console.log(`✅ ${varName}: Valid format`);
          validatedVarNames.push(varName);
        }
      }
      
      if (validatedVarNames.length === 0) {
        console.error('\n❌ No valid variable names provided');
        process.exit(1);
      }
      
      // Update varNames to use validated names
      varNames = validatedVarNames;
      
      console.log(`\n📝 Adding ${varNames.length} environment variable(s)...\n`);
      
      // Get available sections
      const availableSections = getAvailableSections();
      
      if (availableSections.length > 0) {
        console.log(`📋 Found ${availableSections.length} section(s) in .env.example: ${availableSections.join(', ')}`);
      } else {
        console.log(`ℹ️  No sections found in .env.example (you can create new sections)`);
      }
      
      // Collect all variable configurations before writing anything
      interface VarConfig {
        varName: string;
        finalVarName: string;
        sectionName: string;
        isClient: boolean;
        varType: string;
        defaultValue: string;
        minLength?: number;
      }
      
      const varConfigs: VarConfig[] = [];
      
      // Process each variable - collect data only, don't write yet
      for (const varName of varNames) {
        console.log(`\n🔧 Configuring: ${varName}`);
        
        // Step 1: Ask for section (with option to add new at bottom)
        let sectionName: string;
        const sectionChoices = [
          ...availableSections.map(s => ({ title: s, value: s })),
          { title: '➕ Add new section', value: '__NEW__' },
        ];
        
        const sectionResponse = await prompts({
          type: 'select',
          name: 'section',
          message: 'Select section:',
          choices: sectionChoices,
        });
        
        if (!sectionResponse.section) {
          console.error('\n❌ Operation cancelled: Section selection was cancelled');
          console.error('   No changes were made.');
          process.exit(1);
        }
        
        if (sectionResponse.section === '__NEW__') {
          const newSectionResponse = await prompts({
            type: 'text',
            name: 'sectionName',
            message: 'Enter new section name:',
            validate: (value: string) => {
              if (!value.trim()) return 'Section name is required';
              return true;
            },
          });
          
          if (!newSectionResponse.sectionName) {
            console.error('\n❌ Operation cancelled: Section name input was cancelled');
            console.error('   No changes were made.');
            process.exit(1);
          }
          sectionName = newSectionResponse.sectionName;
        } else {
          sectionName = sectionResponse.section;
        }
        
        // Normalize section name to uppercase for consistency
        sectionName = sectionName.toUpperCase();
        
        // Step 2: Ask for server runtime or client
        const envTypeResponse = await prompts({
          type: 'select',
          name: 'envType',
          message: 'Environment type:',
          choices: [
            { title: 'Server Runtime', value: 'server' },
            { title: 'Client (NEXT_PUBLIC_*)', value: 'client' },
          ],
          initial: varName.startsWith('NEXT_PUBLIC_') ? 1 : 0,
        });
        
        if (!envTypeResponse.envType) {
          console.error('\n❌ Operation cancelled: Environment type selection was cancelled');
          console.error('   No changes were made.');
          process.exit(1);
        }
        
        const isClient = envTypeResponse.envType === 'client';
        
        // Auto-prefix client variables with NEXT_PUBLIC_ if not already present
        let finalVarName = varName;
        if (isClient && !varName.startsWith('NEXT_PUBLIC_')) {
          finalVarName = `NEXT_PUBLIC_${varName}`;
          console.log(`   ℹ️  Auto-prefixed with NEXT_PUBLIC_: ${finalVarName}`);
        }
        
        // Step 3: Ask for type
        const typeResponse = await prompts({
          type: 'select',
          name: 'type',
          message: 'Select variable type:',
          choices: zodTypeOptions,
        });
        
        if (!typeResponse.type) {
          console.error('\n❌ Operation cancelled: Type selection was cancelled');
          console.error('   No changes were made.');
          process.exit(1);
        }
        
        const varType = typeResponse.type;
        let minLength: number | undefined;
        
        // If string-min, ask for min length
        if (varType === 'string-min') {
          const minLengthResponse = await prompts({
            type: 'number',
            name: 'minLength',
            message: 'Minimum length:',
            initial: 1,
            min: 1,
          });
          
          if (minLengthResponse.minLength === undefined) {
            console.error('\n❌ Operation cancelled: Minimum length input was cancelled');
            console.error('   No changes were made.');
            process.exit(1);
          }
          
          minLength = minLengthResponse.minLength;
        }
        
        // Step 4: Ask for default value (pre-filled based on type) with retry on validation failure
        const schema = createZodSchema(varType, minLength);
        const defaultValueForType = getDefaultValueForType(varType, varName);
        
        // First, ask if they want to use the suggested value or enter custom
        const valueChoiceResponse = await prompts({
          type: 'select',
          name: 'valueChoice',
          message: 'Default value:',
          choices: [
            { title: `Use suggested: ${defaultValueForType}`, value: 'suggested' },
            { title: 'Enter custom value', value: 'custom' },
          ],
          initial: 0,
        });
        
        if (!valueChoiceResponse.valueChoice) {
          console.error('\n❌ Operation cancelled: Default value selection was cancelled');
          console.error('   No changes were made.');
          process.exit(1);
        }
        
        let defaultValue: string = defaultValueForType;
        let validationPassed = false;
        let isRetry = false;
        
        // If custom, prompt for value
        if (valueChoiceResponse.valueChoice === 'custom') {
          while (!validationPassed) {
            const defaultValueResponse = await prompts({
              type: 'text',
              name: 'defaultValue',
              message: isRetry 
                ? `Custom value (validation failed, please try again):`
                : 'Enter custom value:',
              initial: isRetry ? defaultValue : '',
              validate: (value: string) => {
                if (varType === 'string' && value.trim() === '') {
                  return true; // Allow empty strings for string type
                }
                if (varType !== 'string' && !value.trim()) {
                  return 'Default value is required';
                }
                return true;
              },
            });
            
            if (defaultValueResponse.defaultValue === undefined) {
              console.error('\n❌ Operation cancelled: Default value input was cancelled');
              console.error('   No changes were made.');
              process.exit(1);
            }
            
            defaultValue = defaultValueResponse.defaultValue || '';
            
            // Validate default value
            const validation = validateValue(defaultValue, schema, varType);
            
            if (!validation.valid) {
              console.error(`❌ Validation failed: ${validation.error}`);
              console.log('   Please enter a valid value...\n');
              isRetry = true;
              // Loop will continue and prompt again
            } else {
              console.log(`✅ Default value validated`);
              validationPassed = true;
            }
          }
        } else {
          // Use suggested value, but still validate it
          const validation = validateValue(defaultValueForType, schema, varType);
          if (!validation.valid) {
            console.error(`❌ Suggested value validation failed: ${validation.error}`);
            console.error('   Please use custom value option instead.');
            process.exit(1);
          }
          defaultValue = defaultValueForType;
          console.log(`✅ Using suggested value: ${defaultValue}`);
        }
        
        // Store configuration for later writing
        varConfigs.push({
          varName,
          finalVarName,
          sectionName,
          isClient,
          varType,
          defaultValue,
          minLength,
        });
      }
      
      // Only write files if we got here (all variables configured successfully)
      console.log('\n💾 Writing changes to files...\n');
      
      // Group variables by section for cleaner output
      const varsBySection = new Map<string, string[]>();
      for (const config of varConfigs) {
        if (!varsBySection.has(config.sectionName)) {
          varsBySection.set(config.sectionName, []);
        }
        varsBySection.get(config.sectionName)!.push(config.finalVarName);
      }
      
      // Write to all target files
      for (const fileInfo of filePaths) {
        const addedVars: string[] = [];
        
        for (const config of varConfigs) {
          // Add to .env file
          addVarToEnvFile(fileInfo.path, config.finalVarName, config.defaultValue, config.sectionName);
          addedVars.push(config.finalVarName);
        }
        
        // Format the file after adding variables
        if (existsSync(fileInfo.path)) {
          const content = readFileSync(fileInfo.path, 'utf-8');
          const lines = content.split('\n');
          const normalized = normalizeEnvFileSpacing(lines);
          writeFileSync(fileInfo.path, normalized.join('\n') + '\n', 'utf-8');
        }
        
        // Show summary for this file
        const sectionsList = Array.from(varsBySection.keys()).map(s => `"${s}"`).join(', ');
        console.log(`✅ ${fileInfo.name}: Added ${addedVars.length} variable(s) in section(s) ${sectionsList}`);
      }
      
      // Add to t3-env schema (only once, not per file)
      console.log('\n📝 Updating t3-env schemas...');
      const schemaUpdates: string[] = [];
      const schemaSkips: string[] = [];
      
      for (const config of varConfigs) {
        const result = addVarToT3Env(config.finalVarName, config.varType, config.isClient, config.minLength);
        if (result === 'exists') {
          schemaSkips.push(config.finalVarName);
        } else if (result === 'added') {
          schemaUpdates.push(`${config.finalVarName} (${config.isClient ? 'client' : 'server'})`);
        }
      }
      
      if (schemaUpdates.length > 0) {
        console.log(`   ✅ Added: ${schemaUpdates.join(', ')}`);
      }
      if (schemaSkips.length > 0) {
        console.log(`   ⚠️  Already exists: ${schemaSkips.join(', ')}`);
      }
      
      console.log('\n✨ Done! All variables added successfully.');
    });
}

