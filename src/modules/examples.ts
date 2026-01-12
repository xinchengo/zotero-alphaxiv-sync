import { getString } from "../utils/locale";
import { syncAllPairs } from "./alphaxivSync";

/**
 * Decorator for logging function calls and errors
 * Useful for debugging and tracking execution flow
 */
function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

/**
 * Factory for registering basic Zotero extension functionality
 * Handles preferences UI and notifier registration
 */
export class BasicExampleFactory {
  /**
   * Register a notifier to monitor Zotero events
   * This allows the extension to react to item changes, tab events, etc.
   */
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    // Monitor tabs, items, files, and collection changes
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
      "collection-item",
    ]);

    // Ensure cleanup on shutdown
    Zotero.Plugins.addObserver({
      shutdown: ({ id }) => {
        if (id === addon.data.config.addonID)
          this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  /**
   * Register the preferences pane for the extension
   * This adds the extension's settings to Zotero's preferences
   */
  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: addon.data.config.addonID,
      src: rootURI + "content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
    });
  }
}

/**
 * Factory for registering prompt commands
 * These commands are accessible via Shift+P in Zotero
 */
export class PromptExampleFactory {
  /**
   * Register the main AlphaXiv sync command
   * Triggers bidirectional sync between Zotero and AlphaXiv
   */
  @example
  static registerAlphaxivSyncCommand() {
    ztoolkit.Prompt.register([
      {
        name: "alphaXiv Sync",
        label: "alphaXiv",
        callback: async () => {
          const popupWin = new ztoolkit.ProgressWindow(
            addon.data.config.addonName,
            {
              closeOnClick: true,
              closeTime: -1,
            },
          )
            .createLine({
              text: "alphaXiv sync started",
              type: "default",
              progress: 0,
            })
            .show();
          try {
            await syncAllPairs();
            popupWin.changeLine({
              text: "alphaXiv sync finished",
              type: "success",
              progress: 100,
            });
            popupWin.startCloseTimer(5000);
          } catch (e) {
            popupWin.changeLine({
              text: "alphaXiv sync failed",
              type: "error",
              progress: 100,
            });
            popupWin.startCloseTimer(8000);
            ztoolkit.getGlobal("alert")(String(e));
          }
        },
      },
    ]);
  }

  /**
   * Register debug command to show current configuration
   */
  @example
  static registerAlphaxivDebugCommand() {
    ztoolkit.Prompt.register([
      {
        name: "alphaXiv Debug",
        label: "alphaXiv Debug",
        callback: async () => {
          const { getPref } = await import("../utils/prefs");

          // Show current configuration
          const config = {
            enabled: getPref("enable"),
            apiKey: getPref("alphaxivApiKey") ? "***SET***" : "***NOT SET***",
            syncPairs: getPref("syncPairs"),
          };

          ztoolkit.getGlobal("alert")(
            `AlphaXiv Debug Info:\n\n` +
              `Enabled: ${config.enabled}\n` +
              `API Key: ${config.apiKey}\n` +
              `Sync Pairs: ${config.syncPairs || "***NOT SET***"}\n\n` +
              `Check Debug Output (Help -> Debug Output Logging -> View Output) for detailed logs.`,
          );
        },
      },
    ]);
  }

  /**
   * Register test configuration command
   */
  @example
  static registerAlphaxivTestCommand() {
    ztoolkit.Prompt.register([
      {
        name: "alphaXiv Test Config",
        label: "alphaXiv Test",
        callback: async () => {
          ztoolkit.log("alphaXiv Test: Starting configuration test");

          try {
            const { getPref } = await import("../utils/prefs");
            const { syncAllPairs } = await import("../modules/alphaxivSync");

            ztoolkit.log("alphaXiv Test: Preferences loaded");
            ztoolkit.log("alphaXiv Test: Enable setting:", getPref("enable"));
            ztoolkit.log(
              "alphaXiv Test: API Key set:",
              !!getPref("alphaxivApiKey"),
            );
            ztoolkit.log("alphaXiv Test: Sync pairs:", getPref("syncPairs"));

            // Test sync function call
            ztoolkit.log("alphaXiv Test: Calling syncAllPairs()");
            await syncAllPairs();
            ztoolkit.log("alphaXiv Test: syncAllPairs() completed");

            ztoolkit.getGlobal("alert")(
              "Test completed! Check debug output for details.",
            );
          } catch (e) {
            ztoolkit.log("alphaXiv Test: Error:", e);
            ztoolkit.getGlobal("alert")(`Test failed: ${e}`);
          }
        },
      },
    ]);
  }

  /**
   * Register command to list all AlphaXiv folders
   */
  @example
  static registerAlphaxivListFoldersCommand() {
    ztoolkit.Prompt.register([
      {
        name: "alphaXiv List Folders",
        label: "alphaXiv Folders",
        callback: async () => {
          ztoolkit.log("alphaXiv List Folders: Starting");

          try {
            const { getPref } = await import("../utils/prefs");
            const apiKey = getPref("alphaxivApiKey").trim();

            if (!apiKey) {
              ztoolkit.getGlobal("alert")(
                "Please set your AlphaXiv API key in preferences first.",
              );
              return;
            }

            const baseUrl =
              getPref("alphaxivBaseUrl").trim() ||
              "https://api-dev.alphaxiv.org";

            // Import AlphaxivClient class
            const { AlphaxivClient } = await import("../modules/alphaxivSync");
            const client = new (AlphaxivClient as any)({ apiKey, baseUrl });

            ztoolkit.log("alphaXiv List Folders: Fetching folders from API");
            const folders = await client.listFolders();

            ztoolkit.log("alphaXiv List Folders: Retrieved folders:", folders);

            let message = `Found ${folders.length} AlphaXiv folders:\n\n`;
            folders.forEach((folder: any, index: number) => {
              message += `${index + 1}. ${folder.name || "Unnamed"}\n`;
              message += `   ID: ${folder.id}\n\n`;
            });

            if (folders.length === 0) {
              message =
                "No folders found. Make sure your API key has the correct permissions.";
            }

            ztoolkit.getGlobal("alert")(message);
          } catch (e) {
            ztoolkit.log("alphaXiv List Folders: Error:", e);
            ztoolkit.getGlobal("alert")(`Failed to list folders: ${e}`);
          }
        },
      },
    ]);
  }

  /**
   * Register command to test importing a single arXiv paper
   */
  @example
  static registerAlphaxivTestImportCommand() {
    ztoolkit.Prompt.register([
      {
        name: "alphaXiv Test Import",
        label: "alphaXiv Import Test",
        callback: async () => {
          ztoolkit.log("alphaXiv Test Import: Starting smoke test");

          try {
            // Test importing a known arXiv paper (use a more recent one)
            const testArxivId = "2312.00001"; // December 2023 paper (without arXiv: prefix to test auto-formatting)

            ztoolkit.log(
              `alphaXiv Test Import: Attempting to import ${testArxivId}`,
            );

            const { importIntoZoteroByArxivId } =
              await import("../modules/alphaxivSync");
            const result = await importIntoZoteroByArxivId(testArxivId);

            ztoolkit.log(`alphaXiv Test Import: Import successful:`, result);
            ztoolkit.getGlobal("alert")(
              `Successfully imported arXiv paper ${testArxivId}! Check your library.`,
            );
          } catch (e) {
            ztoolkit.log("alphaXiv Test Import: Error:", e);
            ztoolkit.getGlobal("alert")(`Import test failed: ${e}`);
          }
        },
      },
    ]);
  }

  /**
   * Register comprehensive smoke test command
   * Tests all major functionality of the extension
   */
  @example
  static registerAlphaxivSmokeTestCommand() {
    ztoolkit.Prompt.register([
      {
        name: "alphaXiv Smoke Test",
        label: "alphaXiv Smoke Test",
        callback: async () => {
          ztoolkit.log("alphaXiv Smoke Test: Starting comprehensive test");

          const results: string[] = [];

          try {
            // Test 1: Test Zotero.Translate.Search with arXiv: prefix
            ztoolkit.log(
              "Smoke Test 1: Testing Zotero.Translate.Search with arXiv: prefix",
            );
            try {
              const translate1 = new Zotero.Translate.Search();
              translate1.setIdentifier("arXiv:2301.00001");
              const translators1 = await translate1.getTranslators();

              if (translators1.length > 0) {
                results.push(
                  "✅ Test 1: Zotero.Translate.Search with arXiv: prefix - SUCCESS",
                );
                ztoolkit.log(
                  "Smoke Test 1: Found translators:",
                  translators1.length,
                );
              } else {
                results.push(
                  "❌ Test 1: Zotero.Translate.Search with arXiv: prefix - NO TRANSLATORS",
                );
              }
            } catch (e) {
              results.push(
                `❌ Test 1: Zotero.Translate.Search with arXiv: prefix - FAILED: ${e}`,
              );
            }

            // Test 2: Test Zotero.Translate.Search without arXiv: prefix
            ztoolkit.log(
              "Smoke Test 2: Testing Zotero.Translate.Search without arXiv: prefix",
            );
            try {
              const translate2 = new Zotero.Translate.Search();
              translate2.setIdentifier("2301.00002");
              const translators2 = await translate2.getTranslators();

              if (translators2.length > 0) {
                results.push(
                  "✅ Test 2: Zotero.Translate.Search without arXiv: prefix - SUCCESS",
                );
                ztoolkit.log(
                  "Smoke Test 2: Found translators:",
                  translators2.length,
                );
              } else {
                results.push(
                  "❌ Test 2: Zotero.Translate.Search without arXiv: prefix - NO TRANSLATORS",
                );
              }
            } catch (e) {
              results.push(
                `❌ Test 2: Zotero.Translate.Search without arXiv: prefix - FAILED: ${e}`,
              );
            }

            // Test 3: Test arXiv URL with Zotero.Translate.Web
            ztoolkit.log(
              "Smoke Test 3: Testing arXiv URL with Zotero.Translate.Web",
            );
            try {
              const arxivUrl = "https://arxiv.org/abs/2301.00003";

              await new Promise((resolve, reject) => {
                Zotero.HTTP.processDocuments([arxivUrl], async function (doc) {
                  try {
                    const translate3 = new Zotero.Translate.Web();
                    translate3.setDocument(doc);
                    const translators3 = await translate3.getTranslators();

                    if (translators3.length > 0) {
                      results.push(
                        "✅ Test 3: arXiv URL with Zotero.Translate.Web - SUCCESS",
                      );
                      ztoolkit.log(
                        "Smoke Test 3: Found web translators:",
                        translators3.length,
                      );
                    } else {
                      results.push(
                        "❌ Test 3: arXiv URL with Zotero.Translate.Web - NO TRANSLATORS",
                      );
                    }
                    resolve(true);
                  } catch (error) {
                    results.push(
                      `❌ Test 3: arXiv URL with Zotero.Translate.Web - FAILED: ${error}`,
                    );
                    resolve(false);
                  }
                });
              });
            } catch (e) {
              results.push(
                `❌ Test 3: arXiv URL with Zotero.Translate.Web - FAILED: ${e}`,
              );
            }

            // Test 4: Test our import function
            ztoolkit.log(
              "Smoke Test 4: Testing our importIntoZoteroByArxivId function",
            );
            try {
              const { importIntoZoteroByArxivId } =
                await import("../modules/alphaxivSync");
              await importIntoZoteroByArxivId("2301.00004");
              results.push(
                "✅ Test 4: importIntoZoteroByArxivId function - SUCCESS",
              );
            } catch (e) {
              results.push(
                `❌ Test 4: importIntoZoteroByArxivId function - FAILED: ${e}`,
              );
            }

            // Test 5: Test AlphaXiv API connection
            ztoolkit.log("Smoke Test 5: Testing AlphaXiv API");
            try {
              const { getPref } = await import("../utils/prefs");
              const { AlphaxivClient } =
                await import("../modules/alphaxivSync");

              const apiKey = getPref("alphaxivApiKey").trim();
              if (!apiKey) {
                results.push("⚠️ Test 5: AlphaXiv API - SKIPPED (no API key)");
              } else {
                const client = new (AlphaxivClient as any)({ apiKey });
                const folders = await client.listFolders();
                results.push(
                  `✅ Test 5: AlphaXiv API - SUCCESS (${folders.length} folders)`,
                );
              }
            } catch (e) {
              results.push(`❌ Test 5: AlphaXiv API - FAILED: ${e}`);
            }

            // Show results
            const summary = results.join("\n");
            ztoolkit.log("alphaXiv Smoke Test: Results:", results);
            ztoolkit.getGlobal("alert")(`Smoke Test Results:\n\n${summary}`);
          } catch (e) {
            ztoolkit.log("alphaXiv Smoke Test: Critical error:", e);
            ztoolkit.getGlobal("alert")(
              `Smoke test failed with critical error: ${e}`,
            );
          }
        },
      },
    ]);
  }
}
