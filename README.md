# Vistula Task Manager

A simple Task Manager web application built for **Practical Assignment 1 – Task Manager & Team Collaboration** (Team Project – IT, Vistula University).

- **Student ID:** 74169
- **GitHub account:** [vistula-team-project-74169](https://github.com/vistula-team-project-74169)

## Links

| Resource | URL |
|---|---|
| Repository | https://github.com/vistula-team-project-74169/vistula-task-manager |
| Live application | https://vistula-team-project-74169.github.io/vistula-task-manager/ |
| Contributor page | https://vistula-team-project-74169.github.io/vistula-task-manager/contribution.html |
| Contributor JSON | https://vistula-team-project-74169.github.io/vistula-task-manager/contribution.json |

## Team collaboration (Pull Requests)

| Direction | Pull Request |
|---|---|
| Partner's PR merged into **this** repository | _PR_LINK_INCOMING (to be added after merge)_ |
| **My** PR merged into partner's repository | _PR_LINK_OUTGOING (to be added after merge)_ |

## Features

- Display all tasks stored in Supabase
- Add a new task (title, description)
- Edit an existing task
- Mark a task as completed / incomplete
- Delete a task
- Error messages shown in `#status-message` when an operation fails

## Technologies

- HTML, CSS, plain JavaScript (`fetch()`)
- Supabase (PostgreSQL) with its auto-generated REST API
- GitHub Pages hosting (root of `main` branch)

## REST API used

Base URL: `https://qoenvfmetouiiznrbaed.supabase.co/rest/v1`

| Method | Endpoint | Used for |
|---|---|---|
| GET | `/tasks?select=*` | Load all tasks |
| GET | `/tasks?id=eq.{id}&select=*` | Load one task before editing |
| POST | `/tasks` | Create a task |
| PUT | `/tasks?id=eq.{id}` | Save an edited task (complete record) |
| PATCH | `/tasks?id=eq.{id}` | Toggle completion status |
| DELETE | `/tasks?id=eq.{id}` | Delete a task |

## Project files

| File | Purpose |
|---|---|
| `index.html` | Main Task Manager page |
| `app.js` | Application logic (REST calls, rendering) |
| `style.css` | Styling |
| `config.json` | Public Supabase configuration (`supabaseUrl`, `supabasePublishableKey`, `tableName`) |
| `supabase-setup.sql` | SQL used to create the `tasks` table and RLS policies |
| `contribution.html` | Contributor page – added by partner via Pull Request |
| `contribution.json` | Contributor info – added by partner via Pull Request |

## Database

Table `tasks`:

| Column | Type | Notes |
|---|---|---|
| id | BIGINT | Primary key, generated automatically |
| title | TEXT | Required |
| description | TEXT | Optional |
| completed | BOOLEAN | Default `false` |

Row Level Security is enabled with policies that allow public (anon) select, insert, update and delete on this demonstration table. Only the public publishable key is included in the frontend.
