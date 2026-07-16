const fs = require('fs');
const file = 'src/routes/app.property.$id.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replaceAll('border-violet-200 text-violet-700 hover:bg-violet-100', 'border-primary/50 text-primary hover:bg-primary/10');
fs.writeFileSync(file, content);
console.log('Replaced all violet classes with primary theme classes.');
