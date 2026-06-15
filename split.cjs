const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'src/features/dashboard/components/Dashboards.tsx');
const destDir = path.join(__dirname, 'src/features/dashboard/components');

let content = fs.readFileSync(srcFile, 'utf8');

// Find the start of the first dashboard component
const firstMatch = content.match(/\/\* ---------------- SUPER ADMIN ---------------- \*\//);
const header = content.substring(0, firstMatch.index);

const dashboards = [
  'SuperAdminDashboard',
  'ServiceAdminDashboard',
  'LandlordDashboard',
  'TenantDashboard',
  'ContractorDashboard',
  'RealtorDashboard'
];

let indexExports = '';

for (let i = 0; i < dashboards.length; i++) {
  const name = dashboards[i];
  let nextMatchIndex = content.length;
  if (i < dashboards.length - 1) {
    const nextNameMatch = new RegExp(`\\/\\* ---------------- .* ---------------- \\*\\/\\s*export function ${dashboards[i+1]}`);
    const nextMatch = content.match(nextNameMatch);
    if (nextMatch) {
      nextMatchIndex = nextMatch.index;
    }
  }

  const currentMatch = content.match(new RegExp(`\\/\\* ---------------- .* ---------------- \\*\\/\\s*export function ${name}`));
  
  if (currentMatch) {
    const componentBody = content.substring(currentMatch.index, nextMatchIndex);
    const fileContent = header + '\n' + componentBody;
    fs.writeFileSync(path.join(destDir, `${name}.tsx`), fileContent, 'utf8');
    indexExports += `export * from './${name}';\n`;
  }
}

fs.writeFileSync(path.join(destDir, 'index.ts'), indexExports, 'utf8');
fs.unlinkSync(srcFile);

// Also fix app.dashboard.tsx
const appDashPath = path.join(__dirname, 'src/routes/app.dashboard.tsx');
let appDash = fs.readFileSync(appDashPath, 'utf8');
appDash = appDash.replace(/@\/features\/dashboard\/components\/Dashboards/g, '@/features/dashboard/components');
fs.writeFileSync(appDashPath, appDash, 'utf8');

console.log('Split completed successfully.');
