# harness-demo-bookmarks

A small Next.js bookmarks app that the [harness-demo](https://github.com/floatrx/harness-demo) loop works on.

Every pull request here is opened by the harness runner after its contracts pass — and none is merged by it: a
human reviews and merges. The tasks themselves live in `.harness/tasks/` on the machine that runs the loop
(gitignored), so each pull request body carries the spec, the plan, the acceptance criteria and the review verdicts.

- A footer `agent: stand-in` means the work came from the scripted fake agent (zero tokens): it demonstrates the
  delivery path, not code quality.
- A footer `agent: claude` means real Claude Code units wrote it.

Made with `harness example`. Locally: `pnpm install && pnpm dev`, tests with `pnpm test`.
