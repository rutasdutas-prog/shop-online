const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = 'C:\\xampp\\htdocs\\shop\\src\\app\\(dashboard)';

walkDir(targetDir, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Include requireStore or requireUser import if we are modifying this file
  let needsRequireStore = false;
  let needsRequireUser = false;

  // Replace auth.getUser block
  const userBlockRegex = /const\s+\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)\r?\n(?:\s*if\s*\(!user\)\s*redirect\(['"`]\/login['"`]\)\r?\n)?/g;
  
  // Replace store fetch block
  const storeBlockRegex = /const\s+\{\s*data:\s*store\s*\}\s*=\s*await\s+supabase\s*\.from\(['"`]stores['"`]\)\s*\.select\([^)]*\)\s*\.eq\([^)]*\)\s*\.single\(\)\r?\n(?:\s*if\s*\(!store\)\s*redirect\(['"`]\/dashboard\/setup['"`]\)\r?\n)?/g;
  
  const hasUser = userBlockRegex.test(content);
  const hasStore = storeBlockRegex.test(content);
  
  if (hasUser && hasStore) {
    if (filePath.includes('setup') || filePath.includes('layout.tsx')) {
        needsRequireUser = true;
        content = content.replace(userBlockRegex, 'const { user, store } = await requireUser()\n');
        content = content.replace(storeBlockRegex, '');
    } else {
        needsRequireStore = true;
        content = content.replace(userBlockRegex, 'const { user, store } = await requireStore()\n');
        content = content.replace(storeBlockRegex, '');
    }
  } else if (hasUser) {
    needsRequireUser = true;
    content = content.replace(userBlockRegex, 'const { user, store } = await requireUser()\n');
  }

  // Add import if needed
  if ((needsRequireStore || needsRequireUser) && !content.includes('@/lib/dal')) {
    const importStatement = needsRequireStore 
      ? `import { requireStore } from '@/lib/dal'\n`
      : `import { requireUser } from '@/lib/dal'\n`;
      
    // find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
    } else {
        content = importStatement + content;
    }
  }

  // Also some files might have `const supabase = await createClient()` which we leave intact because they might use supabase for other things.
  // But wait, what if they don't use it anymore? TypeScript will complain if unused, but it's fine for now, we just want to speed it up.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
});
