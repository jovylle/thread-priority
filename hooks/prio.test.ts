import { expect, test } from 'claude-code/testing'

const threads = [
  { threadId: 'a1', title: 'Fix login bug' },
  { threadId: 'b2', title: 'Write docs' },
  { threadId: 'c3', title: 'Fix billing bug' },
]

function setup(on: any) {
  const calls: { tool: string; args: any }[] = []
  const store: Record<string, unknown> = {}
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'prio' } }))
  on('store.get', (_: any, e: any) => ({ value: store[e.key] }))
  on('store.set', (_: any, e: any) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('mcp.call', (_: any, e: any) => {
    calls.push({ tool: e.tool, args: e.args })
    if (e.tool === 't3_thread_list')
      return {
        value: {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify({ threads }) }],
        },
      }
    return { value: { isError: false, content: [{ type: 'text', text: 'ok' }] } }
  })
  return calls
}

test('setting high pins the thread and /prio lists it first', async ($, on) => {
  const calls = setup(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const set = await $.command.run({ command: 'prio', args: 'high login' })
  expect(set.text).toContain('Marked "Fix login bug" as high')
  expect(calls.find(c => c.tool === 't3_thread_organize')?.args).toEqual({
    action: 'pin',
    threadId: 'a1',
  })

  const list = await $.command.run({ command: 'prio', args: '' })
  expect(list.text).toContain('HIGH (1)\n  Fix login bug  [a1]')
  expect(list.text).toContain('UNMARKED (2)')
})

test('low unpins, clear removes the mark', async ($, on) => {
  const calls = setup(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  await $.command.run({ command: 'prio', args: 'low docs' })
  expect(calls.at(-1)?.args).toEqual({ action: 'unpin', threadId: 'b2' })

  const cleared = await $.command.run({ command: 'prio', args: 'clear docs' })
  expect(cleared.text).toContain('Cleared')
  const list = await $.command.run({ command: 'prio', args: '' })
  expect(list.text).toContain('LOW (0)')
})

test('ambiguous and missing matches are reported, bad usage shows help', async ($, on) => {
  const calls = setup(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const many = await $.command.run({ command: 'prio', args: 'high bug' })
  expect(many.text).toContain('matches 2 threads')
  const none = await $.command.run({ command: 'prio', args: 'high zzz' })
  expect(none.text).toContain('No thread matches')
  const bad = await $.command.run({ command: 'prio', args: 'urgent docs' })
  expect(bad.text).toContain('Usage')
  expect(calls.some(c => c.tool === 't3_thread_organize')).toBe(false)
})
