# thread-priority

Mark T3 Code threads as **high**, **medium** or **low** priority and see them grouped by priority, with one slash command: `/prio`.

Landing page: https://jovylle.github.io/thread-priority/

## Install

At the prompt of a Claude Code session:

```
/plugin install thread-priority --marketplace jovylle/thread-priority
```

Answer `y` to add the marketplace, then pick a scope.

## Usage

| Command | What it does |
| --- | --- |
| `/prio` | Lists threads grouped as High, Medium, Low and Unmarked |
| `/prio high <thread>` | Marks a thread high and pins it in T3 Code |
| `/prio medium <thread>` | Marks a thread medium (unpins it) |
| `/prio low <thread>` | Marks a thread low (unpins it) |
| `/prio clear <thread>` | Removes the mark (unpins it) |

`<thread>` is a thread id or part of its title. If several threads match, the command lists them so you can use an id.

Priorities are stored locally and persist between sessions.

## How it works

The mod calls T3 Code's thread tools through the `t3-code` MCP server: `t3_thread_list` to read threads and `t3_thread_organize` to pin or unpin. Your marks live in the mod's own store, not in T3 Code.

## Limits

- Early release (0.1.0). The command logic has tests against a simulated T3 Code (`claude plugin test`), but it has not been verified against every T3 Code version.
- It is a slash command. It cannot add an entry to T3 Code's right-click menu on a thread; that menu belongs to the T3 Code app, not to mods.
- Marks are not shown in T3 Code's thread list; use `/prio` to see them.

## Development

```
claude plugin validate .
claude plugin test .
```

## License

MIT
