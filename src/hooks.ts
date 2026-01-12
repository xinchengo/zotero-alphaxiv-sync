import { BasicExampleFactory, PromptExampleFactory } from "./modules/examples";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";

/**
 * Main startup hook
 * Initializes the extension and registers core functionality
 */
async function onStartup() {
  ztoolkit.log("AlphaXiv Extension: onStartup called");

  // Wait for Zotero to be fully initialized
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  ztoolkit.log("AlphaXiv Extension: Zotero ready, initializing extension");

  // Initialize localization
  initLocale();

  // Register preferences pane
  BasicExampleFactory.registerPrefs();

  // Register notifier for monitoring Zotero events
  BasicExampleFactory.registerNotifier();

  // Initialize all main windows
  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );

  // Mark as initialized
  addon.data.initialized = true;

  // Trigger initial sync on startup
  ztoolkit.log(
    "AlphaXiv Extension: Plugin initialized, triggering initial sync",
  );
  try {
    const { syncAllPairs } = await import("./modules/alphaxivSync");
    await syncAllPairs();
  } catch (e) {
    ztoolkit.log("AlphaXiv Extension: Initial sync failed:", e);
  }
}

/**
 * Main window load hook
 * Sets up UI elements and commands for each Zotero window
 */
async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  // Insert localization file
  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  // Show startup notification
  const popupWin = new ztoolkit.ProgressWindow(addon.data.config.addonName, {
    closeOnClick: true,
    closeTime: -1,
  })
    .createLine({
      text: getString("startup-begin"),
      type: "default",
      progress: 0,
    })
    .show();

  await Zotero.Promise.delay(1000);
  popupWin.changeLine({
    progress: 30,
    text: `[30%] ${getString("startup-begin")}`,
  });

  // Register AlphaXiv commands
  PromptExampleFactory.registerAlphaxivSyncCommand();
  PromptExampleFactory.registerAlphaxivDebugCommand();
  PromptExampleFactory.registerAlphaxivTestCommand();
  PromptExampleFactory.registerAlphaxivListFoldersCommand();
  PromptExampleFactory.registerAlphaxivTestImportCommand();
  PromptExampleFactory.registerAlphaxivSmokeTestCommand();

  await Zotero.Promise.delay(1000);

  popupWin.changeLine({
    progress: 100,
    text: `[100%] ${getString("startup-finish")}`,
  });
  popupWin.startCloseTimer(5000);
}

/**
 * Main window unload hook
 * Cleanup when a window is closed
 */
async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

/**
 * Shutdown hook
 * Cleanup when the extension is disabled or Zotero closes
 */
function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

/**
 * Notifier event dispatcher
 * Handles events from Zotero (item changes, tab changes, etc.)
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  ztoolkit.log("notify", event, type, ids, extraData);

  // Trigger sync when items are added to collections
  if (event === "add" && type === "collection-item") {
    ztoolkit.log("onNotify: Items added to collection, triggering sync");
    try {
      const { syncAllPairs } = await import("./modules/alphaxivSync");
      await syncAllPairs();
    } catch (e) {
      ztoolkit.log("onNotify: Auto-sync failed:", e);
    }
  }
}

/**
 * Preferences event dispatcher
 * Handles events from the preferences UI
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

// Export all hooks
export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
};
