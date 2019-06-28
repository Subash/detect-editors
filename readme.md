### Detect Code Editors
Extracted manually from https://github.com/desktop/desktop/tree/development/app/src/lib/editors

```javascript
const detectEditors = require('detect-editors');
detectEditors
  .getAvailableEditors()
  .then((editors)=> {
    console.log(editors);
  })
  .catch((err)=> console.log(err));
});
```

License -> https://github.com/desktop/desktop/blob/development/LICENSE
