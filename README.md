<!-- Title + Logo -->
<br />
<div align="center">

# Trail Eyes Server

  <img src="https://github.com/trilliumlab/forest-park-reports-app/raw/dev/assets/icon/icon.png" alt="Logo" width="80" height="80">

  The backend for [Trail Eyes App][client-url], written in Deno.

  Development sponsored by Portland State University and NSF award CIF-2046175.

[![Build Status][actions-shield]][actions-url]
[![Last Commit][last-commit-shield]][last-commit-url]
[![License][license-shield]][license-url]
</div>

## About

Trail Eyes is developed in Deno/typescript.
For more information, see the [Deno Docs][deno-docs-url].

## How to Build

### Required

- [Deno][deno-dep-url] >= `1.40`
- a [PostgreSQL][postgresql-dep-url] >= `14` server

### Installation

1. Clone this project:
   ```bash
   git clone https://github.com/trilliumlab/forest-park-reports-server.git
   ```

2. Most work happens on the dev branch. To switch to the dev branch:
   ```bash
   git checkout dev
   ```

4. Copy the included `config.example.jsonc` to `config.jsonc` and add your PostgreSQL database credentials.
   ```bash
   cp config.example.jsonc config.jsonc
   ```

### Running

To run the server:
```bash
deno task start
```

You can also configure the server to automatically restart when you make changes:
```bash
deno task watch
```

## Project Structure

```ini
forest-park-reports-server
├── editor # An editor for importing trails and relations from openstreetmap.
├── relations # Relations data; generated from editor.
├── reversed # List of trails that need to be reversed; generated from editor.
├── scripts # Scripts for mapping elevation data to trails.
├── drizzle # Contains generated drizzle migration data.
├── src # Source typescript code for the server.
│   ├── database # Database schema.
│   ├── models # Data models.
│   ├── routes # API routes.
│   └── services # Services for interacting with the database and filesystem (images).
├── ways # List of trails; generated from editor.
├── config.jsonc # Server configuration file, use config.example.jsonc as a template.
├── drizzle.config.ts # Configuration for drizzle-kit (ORM).
└── deno.jsonc # Deno configuration file.
```

## Contributing

Contributions are welcomed! If you have any suggestions, feel free to open a pull request.

1. Fork the project.
2. Create a new branch `git checkout -b feature/new-feature-name`
3. Commit your changes `git commit -m 'Added new feature`
4. Push your changes `git push`
5. Open a [pull request][pr-url].

Not up for a pull request? Feel free to open an [issue][issues-url].

## License

Trail Eyes is provided under the MIT license. See [LICENSE.md](LICENSE.md)

<!-- Repository Links -->
[client-url]: https://github.com/trilliumlab/forest-park-reports-app
[pr-url]: https://github.com/trilliumlab/forest-park-reports-server/pulls
[issues-url]: https://github.com/trilliumlab/forest-park-reports-server/issues

<!-- Status Links -->
[actions-url]: https://github.com/trilliumlab/forest-park-reports-server/actions/workflows/deno.yml
[actions-shield]: https://img.shields.io/github/actions/workflow/status/trilliumlab/forest-park-reports-server/deno.yml?style=for-the-badge
[last-commit-url]: https://github.com/trilliumlab/forest-park-reports-server/commits/dev/
[last-commit-shield]: https://img.shields.io/github/last-commit/trilliumlab/forest-park-reports-server/dev?style=for-the-badge
[license-url]: LICENSE.md
[license-shield]: https://img.shields.io/github/license/trilliumlab/forest-park-reports-server?style=for-the-badge

<!-- Dependency Links -->
[deno-dep-url]: https://deno.com/
[postgresql-dep-url]: https://www.postgresql.org/

<!-- Docs Links -->
[deno-docs-url]: https://docs.deno.com/runtime/manual/