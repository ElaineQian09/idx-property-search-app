# Commit Conventions

Use this format for every commit:

```text
type(scope): concise imperative summary
```

The scope is optional. Keep the subject below 72 characters, start it with a lowercase
letter, and describe the change rather than the task being worked on.

## Allowed types

| Type | Use for |
| --- | --- |
| `feat` | A user-facing capability. |
| `fix` | A defect correction. |
| `docs` | Documentation only. |
| `test` | Adding or updating tests. |
| `refactor` | Restructuring without changing behavior. |
| `chore` | Tooling, dependencies, or repository maintenance. |
| `ci` | Continuous-integration configuration. |

## Examples

```text
feat(filters): add maximum price validation
fix(api): return 404 for unknown listing IDs
test(properties): cover invalid pagination parameters
docs: document local database setup
chore: ignore generated coverage reports
```
