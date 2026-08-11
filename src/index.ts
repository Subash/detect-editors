import { spawn, SpawnOptions } from 'node:child_process'
import { access } from 'node:fs/promises'
import { getAvailableEditors as getAvailableEditorsDarwin } from './editors/darwin'
import { getAvailableEditors as getAvailableEditorsLinux } from './editors/linux'
import { getAvailableEditors as getAvailableEditorsWindows } from './editors/win32'

/**
 * A found external editor on the user's machine
 */
export type Editor = {
  /**
   * The friendly name of the editor, to be used in labels
   */
  editor: string
  /**
   * The executable associated with the editor to launch
   */
  path: string
}

let editorCache: ReadonlyArray<Editor> | null = null

/**
 * Resolve a list of installed editors on the user's machine, using the known
 * install identifiers that each OS supports, sorted by name.
 */
export async function getAvailableEditors(): Promise<ReadonlyArray<Editor>> {
  if (!editorCache || editorCache.length === 0) {
    if (process.platform === 'darwin') {
      editorCache = await getAvailableEditorsDarwin()
    } else if (process.platform === 'win32') {
      editorCache = await getAvailableEditorsWindows()
    } else if (process.platform === 'linux') {
      editorCache = await getAvailableEditorsLinux()
    } else {
      throw new Error(
        `Platform not currently supported for resolving editors: ${process.platform}`
      )
    }
  }

  return editorCache.toSorted((a, b) => a.editor.localeCompare(b.editor))
}

/**
 * Open a given file or folder in the desired external editor.
 *
 * @param editor The external editor to launch.
 * @param path A folder or file path to pass as an argument when launching.
 */
export async function launchEditor(
  editor: Editor,
  path: string
): Promise<void> {
  const exists = await access(editor.path).then(
    () => true,
    () => false
  )

  if (!exists) {
    throw new Error(
      `Could not find executable for '${editor.editor}' at path '${editor.path}'.`
    )
  }

  return new Promise<void>((resolve, reject) => {
    const opts: SpawnOptions = {
      // Make sure the editor processes are detached from this process.
      // Otherwise, some editors (like Notepad++) will be killed when the
      // parent exits.
      detached: true,
      stdio: 'ignore',
    }

    // In macOS we can use `open`, which will open the right executable file
    // for us, we only need the path to the editor .app folder.
    const child =
      process.platform === 'darwin'
        ? spawn('open', ['-a', editor.path, path], opts)
        : spawn(editor.path, [path], opts)

    child.on('error', reject)
    child.on('spawn', resolve)
    child.unref() // Don't wait for the editor to exit
  }).catch((e: unknown) => {
    throw new Error(
      e && typeof e === 'object' && 'code' in e && e.code === 'EACCES'
        ? `Not permitted to start '${editor.editor}' at path '${editor.path}'.`
        : `Something went wrong while trying to start '${editor.editor}'.`
    )
  })
}
