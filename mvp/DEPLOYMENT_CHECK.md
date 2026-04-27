# Deployment Check

Latest deployment marker after stored city-intelligence and anonymous-memory cookie type fixes.

Expected Vercel commit must be newer than `53476d9` and include:

- `app/api/memory/route.ts` cookie guard: `visitor.shouldSetCookie && visitor.anonymousId`
- `app/api/trips/route.ts` cookie guard: `visitor.shouldSetCookie && visitor.anonymousId`
- `/api/city-intelligence`
- stored city intelligence ranking layer
