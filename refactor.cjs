const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirsToCreate = [
  'features/auth/components',
  'features/auth/store',
  'features/auth/utils',
  'features/dashboard/components',
  'core/api',
  'core/error-handling',
  'core/config',
  'core/db',
  'shared/components',
  'shared/hooks',
  'shared/utils'
];

dirsToCreate.forEach(dir => {
  fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
});

const moves = [
  ['components/auth', 'features/auth/components'], // Note: this moves the contents or directory? We want contents. We'll do a custom move.
];

function moveItem(srcPath, destPath) {
  const fullSrc = path.join(srcDir, srcPath);
  const fullDest = path.join(srcDir, destPath);
  if (!fs.existsSync(fullSrc)) return;

  if (fs.statSync(fullSrc).isDirectory()) {
      fs.renameSync(fullSrc, fullDest);
  } else {
      fs.renameSync(fullSrc, fullDest);
  }
}

function moveContents(srcDirRel, destDirRel) {
    const fullSrc = path.join(srcDir, srcDirRel);
    const fullDest = path.join(srcDir, destDirRel);
    if (!fs.existsSync(fullSrc)) return;

    fs.readdirSync(fullSrc).forEach(item => {
        fs.renameSync(path.join(fullSrc, item), path.join(fullDest, item));
    });
    fs.rmdirSync(fullSrc);
}

// Perform moves
try {
  moveContents('components/auth', 'features/auth/components');
  moveItem('lib/auth-store.ts', 'features/auth/store/auth-store.ts');
  moveItem('lib/roles.ts', 'features/auth/utils/roles.ts');

  moveContents('components/dashboards', 'features/dashboard/components');
  
  moveContents('lib/api', 'core/api');
  moveItem('lib/error-capture.ts', 'core/error-handling/error-capture.ts');
  moveItem('lib/error-page.ts', 'core/error-handling/error-page.ts');
  moveItem('lib/lovable-error-reporting.ts', 'core/error-handling/lovable-error-reporting.ts');
  moveItem('lib/config.server.ts', 'core/config/config.server.ts');
  moveItem('lib/supabase.ts', 'core/db/supabase.ts');
  moveItem('lib/supabase-queries.ts', 'core/db/supabase-queries.ts');

  moveItem('components/ui', 'shared/components/ui');
  moveItem('components/common', 'shared/components/common');
  moveItem('components/brand', 'shared/components/brand');
  moveItem('components/charts', 'shared/components/charts');
  moveItem('components/app', 'shared/components/app');

  moveContents('hooks', 'shared/hooks');
  moveItem('lib/utils.ts', 'shared/utils/utils.ts');
  moveItem('lib/mock-data.ts', 'shared/utils/mock-data.ts');
} catch (e) {
  console.log("Error moving files:", e);
}

// Clean up empty directories
['components', 'lib'].forEach(dir => {
    const fullDir = path.join(srcDir, dir);
    if (fs.existsSync(fullDir)) {
        try { fs.rmdirSync(fullDir); } catch(e) { console.log(`Could not rmdir ${dir}`); }
    }
});

// Import replacements
const replacements = [
  { from: /@\/components\/auth/g, to: '@/features/auth/components' },
  { from: /@\/lib\/auth-store/g, to: '@/features/auth/store/auth-store' },
  { from: /@\/lib\/roles/g, to: '@/features/auth/utils/roles' },
  { from: /@\/components\/dashboards/g, to: '@/features/dashboard/components' },
  { from: /@\/lib\/api/g, to: '@/core/api' },
  { from: /@\/lib\/error-capture/g, to: '@/core/error-handling/error-capture' },
  { from: /@\/lib\/error-page/g, to: '@/core/error-handling/error-page' },
  { from: /@\/lib\/lovable-error-reporting/g, to: '@/core/error-handling/lovable-error-reporting' },
  { from: /@\/lib\/config\.server/g, to: '@/core/config/config.server' },
  { from: /@\/lib\/supabase/g, to: '@/core/db/supabase' },
  { from: /@\/lib\/supabase-queries/g, to: '@/core/db/supabase-queries' },
  { from: /@\/components\/ui/g, to: '@/shared/components/ui' },
  { from: /@\/components\/common/g, to: '@/shared/components/common' },
  { from: /@\/components\/brand/g, to: '@/shared/components/brand' },
  { from: /@\/components\/charts/g, to: '@/shared/components/charts' },
  { from: /@\/components\/app/g, to: '@/shared/components/app' },
  { from: /@\/hooks/g, to: '@/shared/hooks' },
  { from: /@\/lib\/utils/g, to: '@/shared/utils/utils' },
  { from: /@\/lib\/mock-data/g, to: '@/shared/utils/mock-data' },
];

function processDir(dirPath) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const {from, to} of replacements) {
                // To avoid double replacements or overlapping, ensure we replace correctly
                if (from.test(content)) {
                    content = content.replace(from, to);
                    modified = true;
                }
            }

            // Fix `import ... from "@/core/db/supabase-queries"` where it matched `@/lib/supabase` then `-queries`
            // Wait, we had two rules: 
            // `@/lib/supabase` -> `@/core/db/supabase`
            // `@/lib/supabase-queries` -> `@/core/db/supabase-queries`
            // If `@/lib/supabase` runs first, `@/lib/supabase-queries` becomes `@/core/db/supabase-queries`, which is fine!
            // But we can clean it up:
            content = content.replace(/@\/core\/db\/supabase-queries-queries/g, '@/core/db/supabase-queries');

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated imports in ${fullPath}`);
            }
        }
    }
}

processDir(srcDir);
console.log("Refactoring complete.");
