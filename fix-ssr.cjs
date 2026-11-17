const fs = require('fs');
const files = ['frontend/app/page.tsx', 'frontend/app/agentic/page.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/href=\{"#\"\} onClick=\{\(e\) => e\.preventDefault\(\)\}/g, 'href="#!"');
    fs.writeFileSync(file, content);
    console.log('Fixed onClick in ' + file);
  }
}
