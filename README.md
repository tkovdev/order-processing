# Order Processing

## Overview

This repository contains the order-processing system with three main parts:

- `app/`: Angular frontend
- `api/`: Express + TypeScript API
- `containers/`: background processing services

## Issue And PR Automation Flow

This project uses GitHub Actions to automate backend issue closure and frontend integration issue creation.

### Where to put `closes #...`

Put `closes #<issue-number>` in the PR description (recommended).

Example:

```text
closes #12
```

Notes:

- You can also include closing keywords in commit messages.
- The automation reads PR title/body and commit messages.

### Required labels and behavior

For a backend issue to auto-close on PR approval and spawn a frontend integration issue:

1. Backend issue must include labels:
   - `back-end`
   - `api-ready`
2. PR must include label:
   - `auto-close-on-approval`
3. PR text or commit messages must include a closing keyword, for example:
   - `closes #12`
   - `fixes #12`
   - `resolves #12`

### End-to-end sequence

1. Implement changes on a branch and open a PR.
2. Reference the issue in PR description (recommended) with `closes #...`.
3. Add PR label `auto-close-on-approval`.
4. Approve the PR.
5. Workflow closes the linked backend issue.
6. Closing that qualifying backend issue triggers creation of a frontend integration issue.

### Workflow files

- `.github/workflows/close-linked-issues.yaml`
- `.github/workflows/spawn-frontend-integration.yaml`
