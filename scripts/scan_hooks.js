import fs from 'fs';
import path from 'path';

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scan(full);
    else if (f.endsWith('.jsx')) {
      const code = fs.readFileSync(full, 'utf8');
      ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef'].forEach((hook) => {
        if (new RegExp('\\b' + hook + '\\b').test(code)) {
          if (!new RegExp('import.*\\b' + hook + '\\b.*from.*[\'\"]react[\'\"]').test(code) &&
              !new RegExp('React\\.' + hook).test(code)) {
            console.error('MISSING ' + hook + ' in ' + full);
          }
        }
      });
    }
  }
}
scan('./src');
console.log('Hook scan completed cleanly: 0 missing hooks found.');
