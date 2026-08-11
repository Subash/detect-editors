import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { cwd, execPath, platform } from 'node:process'
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

test('launchEditor does not wait for the editor', async () => {
  // an "editor" that ignores its arguments and outlives the launch by a while
  const dir = await mkdtemp(join(tmpdir(), 'detect-editors-'))
  const path = join(dir, platform === 'win32' ? 'editor.cmd' : 'editor')
  await writeFile(
    path,
    platform === 'win32' ? '@timeout /t 30\n' : '#!/bin/sh\nsleep 30\n',
    { mode: 0o755 }
  )

  // launch it from a child process and see whether that process is free to
  // exit, rather than being held open until the editor is done
  const child = spawn(
    execPath,
    [
      '-e',
      `require(${JSON.stringify(resolve('lib/index.js'))})` +
        `.launchEditor(${JSON.stringify({
          editor: 'Test',
          path,
        })}, ${JSON.stringify(dir)})`,
    ],
    { stdio: 'inherit' }
  )

  const start = Date.now()
  const [code] = await once(child, 'exit')
  const elapsed = Date.now() - start

  assert.equal(code, 0)
  assert.ok(elapsed < 5000, `expected a prompt exit, took ${elapsed}ms`)
})
