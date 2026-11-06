# thread-priority

Mark T3 Code threads as high, medium or low priority and see them grouped by priority, using a `/prio` slash command.

## Install

```
/plugin install thread-priority --marketplace jovylle/thread-priority
```

Answer `y` to add the marketplace, then pick a scope.

## Usage

- `/prio` lists threads grouped as High, Medium, Low and Unmarked.
- `/prio high|medium|low <thread id or title text>` sets a priority. High also pins the thread in T3 Code; medium and low unpin it.
- `/prio clear <thread id or title text>` removes the mark.

Priorities are stored locally between sessions.

## Requirements

Runs inside T3 Code, and calls its thread tools through the `t3-code` MCP server. Status: early (0.1.0), not yet tested against every T3 Code version.

## License

MIT
