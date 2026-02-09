
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const proPath = path.join(__dirname, '../pro');

const args = process.argv.slice(2);
const providerArg = args.find(arg => arg.startsWith('--provider='));
const urlArg = args.find(arg => arg.startsWith('--url='));

const provider = providerArg ? providerArg.split('=')[1] : 'sqlite';
// Default URL handling: If sqlite, file path. If pro DB, use env variable or provided string.
// Note: For Pro DBs, usually we want 'env("DATABASE_URL")' in the schema, not the literal URL.
const url = urlArg ? `"${urlArg.split('=')[1]}"` : (provider === 'sqlite' ? '"file:./dev.db"' : 'env("DATABASE_URL")');

// "Licensing" Check
if (provider !== 'sqlite') {
    // Check if strict pro module file exists
    if (!fs.existsSync(path.join(proPath, 'LICENSE.check'))) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: Pro module (pro/LICENSE.check) is missing.');
        console.error('To build for Enterprise databases (MSSQL, MySQL, PostgreSQL), you must include the Pro module.');
        process.exit(1);
    }
    console.log('\x1b[32m%s\x1b[0m', 'Pro module verified. Configuring for ' + provider + '...');
} else {
    console.log('Configuring for Community Edition (SQLite)...');
}

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Regex to replace datasource block
// Matches "datasource db {" until the closing "}"
const datasourceRegex = /datasource db \{[\s\S]*?\}/;

const newDatasource = `datasource db {
  provider = "${provider}"
  url      = ${url}
}`;

if (schemaContent.match(datasourceRegex)) {
    schemaContent = schemaContent.replace(datasourceRegex, newDatasource);
} else {
    // If not found, prepend it (though it should exist)
    schemaContent = newDatasource + '\n\n' + schemaContent;
}

fs.writeFileSync(schemaPath, schemaContent);
console.log(`schema.prisma updated to use provider: ${provider}`);
