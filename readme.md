### Detect Code Editors

Extracted from https://github.com/desktop/desktop/tree/development/app/src/lib/editors

```javascript
import path from 'node:path';
import { getAvailableEditors, launchEditor } from 'detect-editors';

const editors = await getAvailableEditors();
const file = path.resolve('readme.md');
await launchEditor(editors[0], file);
```

License -> https://github.com/desktop/desktop/blob/development/LICENSE
