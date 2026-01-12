# Project Structure

## Directory Organization

```
├── .kiro/                    # Kiro IDE configuration
├── addon/                    # Static extension files
│   ├── bootstrap.js          # Extension bootstrap entry point
│   ├── manifest.json         # Extension manifest (templated)
│   ├── prefs.js             # Default preference values
│   ├── content/             # UI and assets
│   │   ├── preferences.xhtml # Preferences UI layout
│   │   └── icons/           # Extension icons
│   └── locale/              # Internationalization files
│       ├── en-US/           # English locale
│       └── zh-CN/           # Chinese locale
├── src/                     # TypeScript source code
│   ├── index.ts            # Main entry point
│   ├── addon.ts            # Base addon class
│   ├── hooks.ts            # Lifecycle event handlers
│   ├── modules/            # Feature modules
│   │   ├── alphaxivSync.ts # Core sync functionality
│   │   ├── examples.ts     # UI examples and factories
│   │   └── preferenceScript.ts # Preferences logic
│   └── utils/              # Utility functions
│       ├── locale.ts       # Localization helpers
│       ├── prefs.ts        # Preference management
│       └── ztoolkit.ts     # Toolkit initialization
├── typings/                # TypeScript type definitions
├── test/                   # Test files
└── .scaffold/build/        # Build output directory
```

## Key File Purposes

### Core Files

- **src/index.ts**: Plugin initialization and global setup
- **src/addon.ts**: Main addon class with data structure and lifecycle
- **src/hooks.ts**: Event dispatcher for all plugin lifecycle events

### Sync Implementation

- **src/modules/alphaxivSync.ts**: Complete AlphaXiv API integration and sync logic
- **src/modules/preferenceScript.ts**: Preferences UI binding and validation

### Configuration Files

- **addon/manifest.json**: Extension metadata (uses template variables)
- **addon/prefs.js**: Default preference values
- **zotero-plugin.config.ts**: Build configuration
- **package.json**: Project metadata and build scripts

### UI Files

- **addon/content/preferences.xhtml**: Preferences panel layout
- **addon/locale/**: Localization strings for UI elements

## Architecture Patterns

### Module Organization

- **Factory Pattern**: UI components organized in factory classes (BasicExampleFactory, UIExampleFactory, etc.)
- **Event-Driven**: All functionality triggered through hooks.ts dispatcher
- **Separation of Concerns**: Sync logic, UI, and preferences are separate modules

### Naming Conventions

- **Files**: camelCase for TypeScript, kebab-case for config files
- **Classes**: PascalCase with descriptive suffixes (Factory, Helper, Client)
- **Functions**: camelCase with verb-noun pattern
- **Constants**: UPPER_SNAKE_CASE for environment variables

### Template Variables

Files use `__variableName__` placeholders replaced during build:

- `__addonName__`, `__addonID__`, `__addonRef__`
- `__buildVersion__`, `__buildTime__`
- `__author__`, `__description__`, `__homepage__`
