import { getAvailableEditors, launchExternalEditor } from './editors/index';

async function launchEditor(editor: any, fullPath: any) {
  return await launchExternalEditor(fullPath, editor);
}

export { getAvailableEditors, launchEditor };
