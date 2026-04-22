# Copilot Instructions for Order Processing

## Scope

- Work only in the Angular frontend under `app/` unless I explicitly ask for something else.
- Treat the backend under `api/` and `containers/` as read-only reference context.
- Be aware of the backend architecture and current API contracts so frontend pages and components fit the system that already exists.

## Project Context

This workspace is an order-processing system with three layers:

1. `app/` is the Angular frontend.
2. `api/` is the Express + TypeScript API backed by MongoDB.
3. `containers/` contains backend processing services that communicate through Kafka.

The UI work should reflect that this is an operational system, not just a generic CRUD app.

## Frontend Scope

- Build pages, components, routes, services, and UI state for the Angular app.
- Prefer adding or updating code only inside `app/src/app/` unless a frontend change clearly requires `app/src/styles.css`, Angular config, or package metadata.
- Do not edit backend models, routes, Kafka handlers, Docker files, or container logic unless I explicitly request it.

## Angular Standards

- Use Angular standalone components only.
- Keep the existing file pattern for each page or component: `.ts`, `.html`, `.css`, and `.spec.ts` together in one folder.
- Put route-level pages in `app/src/app/features/`.
- Put reusable UI in `app/src/app/shared/`.
- Put API services in `app/src/app/shared/services/`.
- Put shared frontend types in `app/src/app/shared/models/` when needed.
- Update `app/src/app/app.routes.ts` when adding pages.
- Update `app/src/app/app.config.ts` when a provider is required, such as `provideHttpClient()`.

## Current Frontend Stack

- Angular 21
- TypeScript 5.9
- PrimeNG 21
- PrimeIcons 7
- TailwindCSS 4
- Vitest for tests

Match the existing app structure and keep new code simple, typed, and consistent with the current standalone-component approach.

## Backend Awareness

Do not hard-code backend endpoint definitions in these instructions.

When frontend work depends on API contracts, inspect the backend route files first and use them as the source of truth:

- `api/src/routes/`

Do not hard-code backend model definitions in these instructions.

When frontend work depends on data shapes, use the backend as the source of truth and inspect these files first:

- `api/src/models/`

When frontend work depends on backend processing context, inspect these locations first:

- `containers/`
- `api/src/kafka/`

Expect those models and route contracts to change over time. Keep frontend types and forms aligned to the current backend code.

If a requested UI depends on backend behavior that does not exist yet, call that out instead of inventing it.

## API Integration Rules

- Encapsulate API calls in Angular services instead of calling `HttpClient` directly from templates or spreading requests across many components.
- Use typed request and response shapes.
- Keep API base URLs centralized instead of hard-coding them in many files.
- Handle loading, empty, and error states in every data-driven page.
- Prefer frontend behavior that degrades gracefully if backend data is missing or delayed.

## UI and Component Guidance

- Focus on pages and components for an order-processing workflow: dashboard, inventory, sales, order status, and related detail views.
- Build interfaces that make operational state clear: statuses, counts, low stock, processing progress, and action availability.
- Use PrimeNG where it helps, but do not force it into every component.
- Keep components focused. Split out reusable cards, tables, filters, forms, and status badges when a page starts to grow.
- Make layouts responsive by default.

## Working Rules

- Do not add npm packages unless I ask.
- Do not change backend code just to make the frontend easier.
- Do not invent endpoints, fields, or workflows that are not present in the codebase without labeling them as assumptions.
- Prefer minimal, targeted changes over broad refactors.
- When building a new page, include routing, any required services or models, and a basic test file when appropriate.

## Preferred Copilot Behavior

- Assume I want implementation, not just suggestions, unless I ask for design discussion only.
- When a frontend task depends on backend behavior, inspect the backend first and align the Angular code to what actually exists.
- If the backend and requested UI do not match, explain the mismatch clearly and then implement the best frontend-safe version.
- Optimize for usable pages and components rather than placeholder scaffolding.

## Primary Goal

Help me build the Angular frontend for this order-processing system quickly and accurately, while staying aware of the API and event-driven backend that the UI is representing.