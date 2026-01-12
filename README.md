# Zotero-AlphaXiv Sync Extension

[![zotero target version](https://img.shields.io/badge/Zotero-7-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

A Zotero extension that provides **bidirectional synchronization** between Zotero collections and AlphaXiv folders for arXiv papers.

## 🚀 Features

- **Bidirectional Sync**: Synchronizes arXiv papers between configurable pairs of Zotero collections and AlphaXiv folders
- **ArXiv-Only Focus**: Ignores all non-arXiv papers during synchronization
- **Automatic Import**: Uses Zotero's import system to automatically add missing arXiv papers
- **Configurable Pairs**: Multiple sync pairs can be configured through Zotero's preferences interface
- **Manual Sync Trigger**: Sync can be triggered via command prompt (`Shift+P → "alphaXiv Sync"`)

## 🎯 Use Cases

Perfect for researchers and academics who:

- Use both Zotero for reference management and AlphaXiv for paper organization
- Work primarily with arXiv preprints
- Want to keep their paper collections synchronized across both platforms
- Need automated import of arXiv papers into Zotero

## 📋 Requirements

- **Zotero 7+**: This extension is built for Zotero 7 and later versions
- **AlphaXiv Account**: You need an AlphaXiv account and API key

## 🛠 Installation

### From Release (Recommended)

1. Download the latest `.xpi` file from the [Releases](../../releases) page
2. In Zotero, go to `Tools → Add-ons`
3. Click the gear icon and select `Install Add-on From File...`
4. Select the downloaded `.xpi` file
5. Restart Zotero

### From Source

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Install the built `.xpi` file from `.scaffold/build/` directory

## ⚙️ Configuration

### 1. Get Your AlphaXiv API Key

1. Log in to your AlphaXiv account
2. Go to your account settings
3. Generate an API key
4. Copy the API key (format: `axv1_...`)

### 2. Configure the Extension

1. In Zotero, go to `Edit → Preferences → AlphaXiv Sync`
2. Enter your AlphaXiv API key
3. Configure sync pairs in JSON format:

```json
[
  {
    "zoteroLibraryID": 1,
    "zoteroCollectionKey": "YOUR_COLLECTION_KEY",
    "alphaxivFolderId": "YOUR_ALPHAXIV_FOLDER_ID"
  }
]
```

### 3. Find Collection and Folder IDs

#### Zotero Collection Key:

1. Right-click on a collection in Zotero
2. Select "Show Collection Key" (or check the URL in Zotero web)
3. Use the displayed key

#### AlphaXiv Folder ID:

1. Use the debug command `Shift+P → "alphaXiv List Folders"` to see all your folders
2. Copy the desired folder ID from the list

## 🎮 Usage

### Manual Sync

Press `Shift+P` in Zotero and type one of these commands:

- **"alphaXiv Sync"** - Perform full bidirectional sync
- **"alphaXiv Test Import"** - Test importing a single arXiv paper
- **"alphaXiv Smoke Test"** - Run comprehensive functionality tests
- **"alphaXiv Debug"** - Show current configuration
- **"alphaXiv List Folders"** - List all AlphaXiv folders

### Automatic Sync

The extension monitors collection changes and can trigger automatic syncs (feature in development).

## 🧪 Testing & Debugging

The extension includes comprehensive testing tools:

### Smoke Test

Run `Shift+P → "alphaXiv Smoke Test"` to verify:

- Zotero import functionality
- AlphaXiv API connectivity
- Extension configuration
- End-to-end sync process

### Debug Commands

- **Debug Info**: Shows current configuration and status
- **Test Import**: Imports a test arXiv paper to verify functionality
- **List Folders**: Displays all available AlphaXiv folders

### Debug Logging

Enable debug logging in Zotero:

1. Go to `Help → Debug Output Logging`
2. Enable logging and view output
3. Look for `[Zotero Plugin Template]` entries

## 🔧 How It Works

### Sync Process

1. **Collection Analysis**: Scans configured Zotero collections for arXiv papers
2. **Folder Analysis**: Retrieves papers from corresponding AlphaXiv folders
3. **Bidirectional Comparison**: Identifies missing papers in both directions
4. **Zotero → AlphaXiv**: Adds missing arXiv papers to AlphaXiv folders
5. **AlphaXiv → Zotero**: Imports missing papers into Zotero collections

### ArXiv ID Detection

The extension automatically detects arXiv IDs from various Zotero fields:

- Archive Location
- URL
- Extra field
- DOI field

### Import Method

Uses Zotero's web translator system to import arXiv papers:

- Loads arXiv abstract pages
- Extracts metadata using Zotero's arXiv translator
- Imports papers with full metadata

## 🛠 Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/your-username/zotero-alphaxiv-sync.git
cd zotero-alphaxiv-sync

# Install dependencies
npm install

# Start development server with hot reload
npm start
```

### Build for Production

```bash
# Build the extension
npm run build

# The built .xpi file will be in .scaffold/build/
```

### Project Structure

```
├── src/
│   ├── modules/
│   │   ├── alphaxivSync.ts    # Core sync functionality
│   │   ├── examples.ts        # Debug commands and UI examples
│   │   └── preferenceScript.ts # Preferences logic
│   ├── utils/                 # Utility functions
│   ├── hooks.ts              # Lifecycle event handlers
│   └── index.ts              # Main entry point
├── addon/
│   ├── content/
│   │   └── preferences.xhtml  # Preferences UI
│   ├── locale/               # Localization files
│   └── manifest.json         # Extension manifest
└── .kiro/steering/           # AI assistant guidance
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the AGPL-3.0-or-later license. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with [Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template)
- Uses [Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- Powered by [AlphaXiv API](https://alphaxiv.org)

## 📞 Support

- **Issues**: Report bugs and request features on [GitHub Issues](../../issues)
- **Documentation**: Check the [Wiki](../../wiki) for detailed guides
- **Community**: Join discussions in [GitHub Discussions](../../discussions)

## 🔄 Changelog

### v1.0.0

- Initial release
- Bidirectional sync between Zotero and AlphaXiv
- Comprehensive testing suite
- Debug commands and smoke tests
- Optimized import functionality

---

**Note**: This extension is not officially affiliated with Zotero or AlphaXiv. It's an independent project created to bridge these two excellent research tools.
