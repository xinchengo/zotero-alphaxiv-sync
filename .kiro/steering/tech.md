# Technology Stack

## Framework & Platform

- **Platform**: Zotero 7+ Extension (Firefox XUL-based)
- **Language**: TypeScript with ES2020+ features
- **Build Target**: Firefox 115+ compatibility
- **Template Base**: [zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)

## Core Dependencies

- **zotero-plugin-toolkit**: ^5.1.0-beta.13 - Main toolkit for Zotero plugin development
- **zotero-types**: ^4.1.0-beta.4 - TypeScript definitions for Zotero APIs
- **zotero-plugin-scaffold**: ^0.8.2 - Build and development tooling

## Build System

- **Bundler**: ESBuild for TypeScript compilation and bundling
- **Package Manager**: npm
- **Build Tool**: zotero-plugin-scaffold
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier

## Development Tools

- **TypeScript**: ^5.9.3 with strict type checking
- **Testing**: Mocha + Chai for unit tests
- **Hot Reload**: Automatic rebuild and reload during development

## Common Commands

```bash
# Development (with hot reload)
npm start

# Build for production
npm run build

# Run tests
npm run test

# Lint and format
npm run lint:check
npm run lint:fix

# Release (version bump, build, and publish)
npm run release

# Update dependencies
npm update --save
```

## API Integration

- **AlphaXiv API**: RESTful API with Bearer token authentication
- **Zotero APIs**: Native Zotero JavaScript APIs for collections, items, and import
- **HTTP Client**: Zotero.HTTP for API requests

## Architecture Patterns

- **Event-driven**: Uses Zotero's notifier system for reactive updates
- **Modular**: Separated concerns (sync logic, preferences, UI examples)
- **Lifecycle hooks**: Bootstrap pattern with startup/shutdown hooks
- **Preference binding**: Automatic UI-to-preference synchronization
