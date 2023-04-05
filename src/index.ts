import * as editors from './editors/index';
import { FoundEditor } from './editors/shared';

export type Editor = FoundEditor;

export async function launchEditor(
  editor: Editor,
  path: string
): Promise<void> {
  await editors.launchExternalEditor(path, editor);
}

export async function getAvailableEditors(): Promise<readonly Editor[]> {
  return await editors.getAvailableEditors();
}
