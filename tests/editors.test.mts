import assert from 'node:assert/strict'
import { cwd } from 'node:process'
import test from 'node:test'
import { getAvailableEditors, launchEditor } from '../lib/index.js'
import type { Editor } from '../lib/index.js'

test('getAvailableEditors returns the editors on this system', async () => {
  const editors = await getAvailableEditors()

  // no editor is guaranteed to be installed anywhere, not even on a mac, so
  // this only checks the shape of whatever came back
  for (const editor of editors) {
    assert.equal(typeof editor.editor, 'string')
    assert.ok(editor.editor.length > 0)
    assert.ok(editor.path.length > 0)
  }
})

test('getAvailableEditors sorts by name', async () => {
  const editors = await getAvailableEditors()
  const names = editors.map(editor => editor.editor)

  assert.deepEqual(
    names,
    names.toSorted((a, b) => a.localeCompare(b))
  )
})

test('getAvailableEditors caches', async () => {
  assert.deepEqual(await getAvailableEditors(), await getAvailableEditors())
})

test('launchEditor rejects when the executable is gone', async () => {
  const editor: Editor = { editor: 'Nope', path: '/nope' }

  await assert.rejects(() => launchEditor(editor, cwd()), {
    message: /Could not find executable/,
  })
})
