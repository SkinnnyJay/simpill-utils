# request-context.utils

- Build: `npm run build`
- Test: `npm test`, `npm run test:coverage`
- Lint/format: `npm run check:fix`, `npm run verify`
- Exports: `.`, `./client`, `./server`, `./shared`. Server uses Node `async_hooks` AsyncLocalStorage; client stub returns undefined.
