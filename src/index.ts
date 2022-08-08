import { getAvailableEditors, launchExternalEditor } from './editors/index';
import { FoundEditor } from './editors/shared';

async function launchEditor(editor: FoundEditor, fullPath: string) {
  return await launchExternalEditor(fullPath, editor);
}

export { getAvailableEditors, launchEditor };
