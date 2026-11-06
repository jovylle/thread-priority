import type { Register } from 'claude-code'

const SERVER = 't3-code'
const LEVELS = ['high', 'medium', 'low'] as const
type Level = (typeof LEVELS)[number]
type Thread = { id: string; title: string }

const USAGE =
  'Usage: /prio              list threads by priority\n' +
  '       /prio high|medium|low <thread id or title text>\n' +
  '       /prio clear <thread id or title text>'

function textOf(result: { content: { type: string; text?: string }[] }): string {
  return result.content.map(c => c.text ?? '').join('\n')
}

function toThreads(raw: unknown): Thread[] {
  const rows = Array.isArray(raw)
    ? raw
    : ((raw as { threads?: unknown[] } | null)?.threads ?? [])
  return rows
    .map(r => r as Record<string, unknown>)
    .filter(r => r && (r.id || r.threadId))
    .map(r => ({
      id: String(r.id ?? r.threadId),
      title: String(r.title ?? r.name ?? '(untitled)'),
    }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prio',
      description: 'Mark T3 Code threads high/medium/low priority and list them',
    })
    return next(e)
  })

  on('command.run', { command: 'prio' }, async ($, e) => {
    const call = (tool: string, args: Record<string, unknown>) =>
      $.mcp.call(SERVER, tool, args)

    const listThreads = async (): Promise<Thread[] | string> => {
      const res = await call('t3_thread_list', { allProjects: true, limit: 100 })
      if (res.isError) return 'Could not list threads: ' + textOf(res)
      if (res.structuredContent) return toThreads(res.structuredContent)
      try {
        return toThreads(JSON.parse(textOf(res)))
      } catch {
        return 'Unrecognized thread list format:\n' + textOf(res).slice(0, 500)
      }
    }

    const marks = ((await $.store.get('marks')) ?? {}) as Record<string, Level>
    const [word, ...rest] = e.args.trim().split(/\s+/).filter(Boolean)

    if (!word) {
      const threads = await listThreads()
      if (typeof threads === 'string') return { text: threads }
      const lines: string[] = []
      for (const level of LEVELS) {
        const hit = threads.filter(t => marks[t.id] === level)
        lines.push(`${level.toUpperCase()} (${hit.length})`)
        for (const t of hit) lines.push(`  ${t.title}  [${t.id}]`)
      }
      const unmarked = threads.filter(t => !marks[t.id])
      lines.push(`UNMARKED (${unmarked.length})`)
      for (const t of unmarked.slice(0, 15)) lines.push(`  ${t.title}  [${t.id}]`)
      if (unmarked.length > 15) lines.push(`  ...and ${unmarked.length - 15} more`)
      return { text: lines.join('\n') }
    }

    const isClear = word === 'clear'
    if (!isClear && !LEVELS.includes(word as Level)) return { text: USAGE }
    const query = rest.join(' ').trim()
    if (!query) return { text: USAGE }

    const threads = await listThreads()
    if (typeof threads === 'string') return { text: threads }
    const q = query.toLowerCase()
    const hits = threads.filter(
      t => t.id === query || t.title.toLowerCase().includes(q),
    )
    if (hits.length === 0) return { text: `No thread matches "${query}".` }
    if (hits.length > 1)
      return {
        text:
          `"${query}" matches ${hits.length} threads; use an id:\n` +
          hits.map(t => `  ${t.title}  [${t.id}]`).join('\n'),
      }

    const t = hits[0]
    if (isClear) delete marks[t.id]
    else marks[t.id] = word as Level
    await $.store.set('marks', marks)
    // High priority pins the thread in T3 Code; anything else unpins it.
    await call('t3_thread_organize', {
      action: !isClear && word === 'high' ? 'pin' : 'unpin',
      threadId: t.id,
    })
    return {
      text: isClear
        ? `Cleared priority on "${t.title}".`
        : `Marked "${t.title}" as ${word}.`,
    }
  })
}
