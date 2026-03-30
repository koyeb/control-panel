# Application Structure

## Overview

```
public/             # Static assets
tests/              # E2E tests
src/
├── main.tsx        # Application entry point
├── model.ts        # TypeScript definitions of domain models
├── side-effects.ts # Global side effects
├── styles.css      # Global styles
├── api/            # API client and reusable hooks / domain mappers
├── application/    # Framework adapters and 3rd-party service integrations
├── components/     # Global / transversal React components
├── hooks/          # Global / transversal React hooks
├── intl/           # Internationalization
├── layouts/        # Page layout templates
├── modules/        # Feature-specific UI organized by domain
├── pages/          # Page components
├── routes/         # File-based routing (TanStack Router)
└── utils/          # Generic helper functions
```

## Custom Data

The `data/` folder is gitignored, allowing developers to store local files without committing them to the repository.
