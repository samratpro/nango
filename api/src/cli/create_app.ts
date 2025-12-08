import fs from 'fs';
import path from 'path';

const appName = process.argv[2];

if (!appName) {
    console.error('Usage: npm run startapp <appName>');
    process.exit(1);
}

// Ensure valid name
if (!/^[a-z0-9_]+$/.test(appName)) {
    console.error('App name must be lowercase alphanumeric/underscores only');
    process.exit(1);
}

const appsDir = path.join(__dirname, '../apps');
const appPath = path.join(appsDir, appName);

if (fs.existsSync(appPath)) {
    console.error(`App '${appName}' already exists at ${appPath}`);
    process.exit(1);
}

console.log(`Creating app: ${appName}...`);

try {
    fs.mkdirSync(appPath, { recursive: true });

    // 1. Create models.ts
    const className = capitalize(appName) + 'Item';
    const tableName = appName + '_items';

    const modelsContent = `import { Model } from '../../core/model';
import { CharField, TextField, BooleanField, DateTimeField } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';

@registerAdmin({
    appName: '${appName.charAt(0).toUpperCase() + appName.slice(1)}',
    displayName: '${className}',
    icon: 'folder', // feather icon name
    permissions: ['view', 'add', 'change', 'delete'],
    listDisplay: ['id', 'name', 'isActive', 'createdAt'],
    searchFields: ['name']
})
export class ${className} extends Model {
    static getTableName(): string {
        return '${tableName}';
    }

    // Define Fields
    name = new CharField({ maxLength: 100 });
    
    description = new TextField({ nullable: true });

    isActive = new BooleanField({ default: true });
    
    createdAt = new DateTimeField({ default: () => new Date().toISOString() });
}
`;
    fs.writeFileSync(path.join(appPath, 'models.ts'), modelsContent);

    // 2. Create index.ts
    const indexContent = `export * from './models';
`;
    fs.writeFileSync(path.join(appPath, 'index.ts'), indexContent);

    console.log('✓ Created directory structure');
    console.log('✓ Created Default Model');

    console.log('\nSUCCESS! Next steps:');
    console.log(`1. Open src/index.ts`);
    console.log(`2. Add to imports: import './apps/${appName}/models';`);
    console.log(`3. Restart the server`);

} catch (e) {
    console.error('Failed to create app:', e);
    process.exit(1);
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
