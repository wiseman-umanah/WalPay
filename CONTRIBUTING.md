# Contributing to WalPay

Thanks for your interest in improving WalPay! This document outlines how to propose changes, report bugs, and keep the developer experience consistent across frontend, backend, and Cadence layers.

## Getting started
- **Node.js 20+ and pnpm 8+** are required across the repo.
- Install dependencies per package: `pnpm install --filter ./frontend` (and equivalents for backend and smart_contract).
- Copy the relevant `.env.example` (or create one) for each package before running local services.

## Workflow
1. **Open an issue** describing the bug/improvement. For quick fixes, reference an existing issue in your PR.
2. **Create a topic branch** from `main`, e.g. `git checkout -b feat/update-fees`.
3. **Write tests** wherever possible:
   - Frontend: prefer Vitest/React Testing Library (add under `frontend/src/__tests__`).
   - Backend: add integration tests (Jest or custom harness) under `backend/tests`.
   - Cadence: extend `cadence/tests` and run `flow test`.
4. **Run checks** before opening a PR:
   ```bash
   pnpm --filter ./frontend lint
   pnpm --filter ./frontend build
   pnpm --filter ./backend test   # add tests if/when harness exists
   flow test                      # from smart_contract/
   ```
5. **Submit a pull request** with:
   - A concise title (e.g. `feat: expose seller earnings on dashboard`)
   - A checklist covering tests, docs, and deployment steps
   - Links to relevant issues or discussions

## Code style guidelines
- **TypeScript/React:** follow ESLint + Prettier defaults. Keep Tailwind class names grouped logically (layout → spacing → color).
- **Backend (Node.js):** prefer async/await, small pure utilities, and descriptive error messages. Use the provided `HttpError` helper for user-facing errors.
- **Cadence:** maintain resource safety rules, add doc comments for new public functions, and avoid breaking changes to contract interfaces without bumping deployment docs.

## Documentation updates
- Update the appropriate README when changing setup steps or environment variables.
- Architecture changes should be recorded in `docs/architecture.md` (add diagrams, sequence descriptions, or decision records).
- Keep changelog entries short; detail goes into the PR description.

## Reporting issues
When filing issues, include:
- Environment details (OS, Node.js, Flow CLI versions)
- Steps to reproduce and expected vs. actual behavior
- Logs or screenshots if relevant

Security vulnerabilities should be reported privately to the core maintainers. Contact details are listed in the repository security policy (add `SECURITY.md` if absent).

Thank you for helping WalPay grow!
