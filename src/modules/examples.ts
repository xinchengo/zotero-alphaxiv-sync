import { getLocaleID, getString } from "../utils/locale";
import { syncAllPairs } from "./alphaxivSync";

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
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
    // Added "collection-item" to monitor collection changes
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
      "collection-item",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id }) => {
        if (id === addon.data.config.addonID)
          this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

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

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    // Register an event key for Alt+L
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log(ev, keyOptions.keyboard);
      if (keyOptions.keyboard?.equals("shift,l")) {
        addon.hooks.onShortcuts("larger");
      }
      if (ev.shiftKey && ev.key === "S") {
        addon.hooks.onShortcuts("smaller");
      }
    });

    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Example Shortcuts: Alt+L/S/C",
        type: "success",
      })
      .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutSmallerCallback() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "Smaller!",
        type: "default",
      })
      .show();
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet(win: _ZoteroTypes.MainWindow) {
    const doc = win.document;
    const styles = ztoolkit.UI.createElement(doc, "link", {
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${addon.data.config.addonRef}/content/zoteroPane.css`,
      },
    });
    doc.documentElement?.appendChild(styles);
    doc.getElementById("zotero-item-pane-content")?.classList.add("makeItRed");
  }

  @example
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`;
    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: getString("menuitem-label"),
      commandListener: (ev) => addon.hooks.onDialogEvents("dialogExample"),
      icon: menuIcon,
    });
  }

  @example
  static registerRightClickMenuPopup(win: Window) {
    ztoolkit.Menu.register(
      "item",
      {
        tag: "menu",
        label: getString("menupopup-label"),
        children: [
          {
            tag: "menuitem",
            label: getString("menuitem-submenulabel"),
            oncommand: "alert('Hello World! Sub Menuitem.')",
          },
        ],
      },
      "before",
      win.document?.querySelector(
        "#zotero-itemmenu-addontemplate-test",
      ) as XUL.MenuItem,
    );
  }

  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ztoolkit.Menu.register("menuFile", {
      tag: "menuitem",
      label: getString("menuitem-filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  @example
  static async registerExtraColumn() {
    const field = "test1";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: field,
      label: "text column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      iconPath: "chrome://zotero/skin/cross.png",
    });
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    const field = "test2";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: addon.data.config.addonID,
      dataKey: field,
      label: "custom column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      renderCell(index, data, column, isFirstColumn, doc) {
        ztoolkit.log("Custom column cell is rendered!");
        const span = doc.createElement("span");
        span.className = `cell ${column.className}`;
        span.style.background = "#0dd068";
        span.innerText = "⭐" + data;
        return span;
      },
    });
  }

  @example
  static registerItemPaneCustomInfoRow() {
    Zotero.ItemPaneManager.registerInfoRow({
      rowID: "example",
      pluginID: addon.data.config.addonID,
      editable: true,
      label: {
        l10nID: getLocaleID("item-info-row-example-label"),
      },
      position: "afterCreators",
      onGetData: ({ item }) => {
        return item.getField("title");
      },
      onSetData: ({ item, value }) => {
        item.setField("title", value);
      },
    });
  }

  @example
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "example",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example1-head-text"),
        icon: "chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example1-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/save.svg",
      },
      onRender: ({ body, item, editable, tabType }) => {
        body.textContent = JSON.stringify({
          id: item?.id,
          editable,
          tabType,
        });
      },
    });
  }

  @example
  static async registerReaderItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "reader-example",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example2-head-text"),
        // Optional
        l10nArgs: `{"status": "Initialized"}`,
        // Can also have a optional dark icon
        icon: "chrome://zotero/skin/16/universal/book.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/save.svg",
      },
      // Optional
      bodyXHTML:
        '<html:h1 id="test">THIS IS TEST</html:h1><browser disableglobalhistory="true" remote="true" maychangeremoteness="true" type="content" flex="1" id="browser" style="width: 180%; height: 280px"/>',
      // Optional, Called when the section is first created, must be synchronous
      onInit: ({ item }) => {
        ztoolkit.log("Section init!", item?.id);
      },
      // Optional, Called when the section is destroyed, must be synchronous
      onDestroy: (props) => {
        ztoolkit.log("Section destroy!");
      },
      // Optional, Called when the section data changes (setting item/mode/tabType/inTrash), must be synchronous. return false to cancel the change
      onItemChange: ({ item, setEnabled, tabType }) => {
        ztoolkit.log(`Section item data changed to ${item?.id}`);
        setEnabled(tabType === "reader");
        return true;
      },
      // Called when the section is asked to render, must be synchronous.
      onRender: ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        ztoolkit.log("Section rendered!", item?.id);
        const title = body.querySelector("#test") as HTMLElement;
        title.style.color = "red";
        title.textContent = "LOADING";
        setL10nArgs(`{ "status": "Loading" }`);
        setSectionSummary("loading!");
        setSectionButtonStatus("test", { hidden: true });
      },
      // Optional, can be asynchronous.
      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        ztoolkit.log("Section secondary render start!", item?.id);
        await Zotero.Promise.delay(1000);
        ztoolkit.log("Section secondary render finish!", item?.id);
        const title = body.querySelector("#test") as HTMLElement;
        title.style.color = "green";
        title.textContent = item.getField("title");
        setL10nArgs(`{ "status": "Loaded" }`);
        setSectionSummary("rendered!");
        setSectionButtonStatus("test", { hidden: false });
      },
      // Optional, Called when the section is toggled. Can happen anytime even if the section is not visible or not rendered
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },
      // Optional, Buttons to be shown in the section header
      sectionButtons: [
        {
          type: "test",
          icon: "chrome://zotero/skin/16/universal/empty-trash.svg",
          l10nID: getLocaleID("item-section-example2-button-tooltip"),
          onClick: ({ item, paneID }) => {
            ztoolkit.log("Section clicked!", item?.id);
            Zotero.ItemPaneManager.unregisterSection(paneID);
          },
        },
      ],
    });
  }
}

export class PromptExampleFactory {
  @example
  static registerNormalCommandExample() {
    ztoolkit.Prompt.register([
      {
        name: "Normal Command Test",
        label: "Plugin Template",
        callback(prompt) {
          ztoolkit.getGlobal("alert")("Command triggered!");
        },
      },
    ]);
  }

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
            `Check Debug Output (Help -> Debug Output Logging -> View Output) for detailed logs.`
          );
        },
      },
    ]);
  }

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
            ztoolkit.log("alphaXiv Test: API Key set:", !!getPref("alphaxivApiKey"));
            ztoolkit.log("alphaXiv Test: Sync pairs:", getPref("syncPairs"));
            
            // Test sync function call
            ztoolkit.log("alphaXiv Test: Calling syncAllPairs()");
            await syncAllPairs();
            ztoolkit.log("alphaXiv Test: syncAllPairs() completed");
            
            ztoolkit.getGlobal("alert")("Test completed! Check debug output for details.");
          } catch (e) {
            ztoolkit.log("alphaXiv Test: Error:", e);
            ztoolkit.getGlobal("alert")(`Test failed: ${e}`);
          }
        },
      },
    ]);
  }

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
              ztoolkit.getGlobal("alert")("Please set your AlphaXiv API key in preferences first.");
              return;
            }
            
            const baseUrl = getPref("alphaxivBaseUrl").trim() || "https://api-dev.alphaxiv.org";
            
            // Import AlphaxivClient class
            const { AlphaxivClient } = await import("../modules/alphaxivSync");
            const client = new (AlphaxivClient as any)({ apiKey, baseUrl });
            
            ztoolkit.log("alphaXiv List Folders: Fetching folders from API");
            const folders = await client.listFolders();
            
            ztoolkit.log("alphaXiv List Folders: Retrieved folders:", folders);
            
            let message = `Found ${folders.length} AlphaXiv folders:\n\n`;
            folders.forEach((folder: any, index: number) => {
              message += `${index + 1}. ${folder.name || 'Unnamed'}\n`;
              message += `   ID: ${folder.id}\n\n`;
            });
            
            if (folders.length === 0) {
              message = "No folders found. Make sure your API key has the correct permissions.";
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
            
            ztoolkit.log(`alphaXiv Test Import: Attempting to import ${testArxivId}`);
            
            const { importIntoZoteroByArxivId } = await import("../modules/alphaxivSync");
            const result = await importIntoZoteroByArxivId(testArxivId);
            
            ztoolkit.log(`alphaXiv Test Import: Import successful:`, result);
            ztoolkit.getGlobal("alert")(`Successfully imported arXiv paper ${testArxivId}! Check your library.`);
            
          } catch (e) {
            ztoolkit.log("alphaXiv Test Import: Error:", e);
            ztoolkit.getGlobal("alert")(`Import test failed: ${e}`);
          }
        },
      },
    ]);
  }

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
            ztoolkit.log("Smoke Test 1: Testing Zotero.Translate.Search with arXiv: prefix");
            try {
              const translate1 = new Zotero.Translate.Search();
              translate1.setIdentifier("arXiv:2301.00001");
              const translators1 = await translate1.getTranslators();
              
              if (translators1.length > 0) {
                results.push("✅ Test 1: Zotero.Translate.Search with arXiv: prefix - SUCCESS");
                ztoolkit.log("Smoke Test 1: Found translators:", translators1.length);
              } else {
                results.push("❌ Test 1: Zotero.Translate.Search with arXiv: prefix - NO TRANSLATORS");
              }
            } catch (e) {
              results.push(`❌ Test 1: Zotero.Translate.Search with arXiv: prefix - FAILED: ${e}`);
            }
            
            // Test 2: Test Zotero.Translate.Search without arXiv: prefix
            ztoolkit.log("Smoke Test 2: Testing Zotero.Translate.Search without arXiv: prefix");
            try {
              const translate2 = new Zotero.Translate.Search();
              translate2.setIdentifier("2301.00002");
              const translators2 = await translate2.getTranslators();
              
              if (translators2.length > 0) {
                results.push("✅ Test 2: Zotero.Translate.Search without arXiv: prefix - SUCCESS");
                ztoolkit.log("Smoke Test 2: Found translators:", translators2.length);
              } else {
                results.push("❌ Test 2: Zotero.Translate.Search without arXiv: prefix - NO TRANSLATORS");
              }
            } catch (e) {
              results.push(`❌ Test 2: Zotero.Translate.Search without arXiv: prefix - FAILED: ${e}`);
            }
            
            // Test 3: Test arXiv URL with Zotero.Translate.Web
            ztoolkit.log("Smoke Test 3: Testing arXiv URL with Zotero.Translate.Web");
            try {
              const arxivUrl = "https://arxiv.org/abs/2301.00003";
              
              await new Promise((resolve, reject) => {
                Zotero.HTTP.processDocuments(
                  [arxivUrl],
                  async function(doc) {
                    try {
                      const translate3 = new Zotero.Translate.Web();
                      translate3.setDocument(doc);
                      const translators3 = await translate3.getTranslators();
                      
                      if (translators3.length > 0) {
                        results.push("✅ Test 3: arXiv URL with Zotero.Translate.Web - SUCCESS");
                        ztoolkit.log("Smoke Test 3: Found web translators:", translators3.length);
                      } else {
                        results.push("❌ Test 3: arXiv URL with Zotero.Translate.Web - NO TRANSLATORS");
                      }
                      resolve(true);
                    } catch (error) {
                      results.push(`❌ Test 3: arXiv URL with Zotero.Translate.Web - FAILED: ${error}`);
                      resolve(false);
                    }
                  }
                );
              });
            } catch (e) {
              results.push(`❌ Test 3: arXiv URL with Zotero.Translate.Web - FAILED: ${e}`);
            }
            
            // Test 4: Test our import function
            ztoolkit.log("Smoke Test 4: Testing our importIntoZoteroByArxivId function");
            try {
              const { importIntoZoteroByArxivId } = await import("../modules/alphaxivSync");
              await importIntoZoteroByArxivId("2301.00004");
              results.push("✅ Test 4: importIntoZoteroByArxivId function - SUCCESS");
            } catch (e) {
              results.push(`❌ Test 4: importIntoZoteroByArxivId function - FAILED: ${e}`);
            }
            
            // Test 5: Test AlphaXiv API connection
            ztoolkit.log("Smoke Test 5: Testing AlphaXiv API");
            try {
              const { getPref } = await import("../utils/prefs");
              const { AlphaxivClient } = await import("../modules/alphaxivSync");
              
              const apiKey = getPref("alphaxivApiKey").trim();
              if (!apiKey) {
                results.push("⚠️ Test 5: AlphaXiv API - SKIPPED (no API key)");
              } else {
                const client = new (AlphaxivClient as any)({ apiKey });
                const folders = await client.listFolders();
                results.push(`✅ Test 5: AlphaXiv API - SUCCESS (${folders.length} folders)`);
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
            ztoolkit.getGlobal("alert")(`Smoke test failed with critical error: ${e}`);
          }
        },
      },
    ]);
  }

  @example
  static registerAnonymousCommandExample(window: Window) {
    ztoolkit.Prompt.register([
      {
        id: "search",
        callback: async (prompt) => {
          // https://github.com/zotero/zotero/blob/7262465109c21919b56a7ab214f7c7a8e1e63909/chrome/content/zotero/integration/quickFormat.js#L589
          function getItemDescription(item: Zotero.Item) {
            const nodes = [];
            let str = "";
            let author,
              authorDate = "";
            if (item.firstCreator) {
              author = authorDate = item.firstCreator;
            }
            let date = item.getField("date", true, true) as string;
            if (date && (date = date.substr(0, 4)) !== "0000") {
              authorDate += " (" + parseInt(date) + ")";
            }
            authorDate = authorDate.trim();
            if (authorDate) nodes.push(authorDate);

            const publicationTitle = item.getField(
              "publicationTitle",
              false,
              true,
            );
            if (publicationTitle) {
              nodes.push(`<i>${publicationTitle}</i>`);
            }
            let volumeIssue = item.getField("volume");
            const issue = item.getField("issue");
            if (issue) volumeIssue += "(" + issue + ")";
            if (volumeIssue) nodes.push(volumeIssue);

            const publisherPlace = [];
            let field;
            if ((field = item.getField("publisher")))
              publisherPlace.push(field);
            if ((field = item.getField("place"))) publisherPlace.push(field);
            if (publisherPlace.length) nodes.push(publisherPlace.join(": "));

            const pages = item.getField("pages");
            if (pages) nodes.push(pages);

            if (!nodes.length) {
              const url = item.getField("url");
              if (url) nodes.push(url);
            }

            // compile everything together
            for (let i = 0, n = nodes.length; i < n; i++) {
              const node = nodes[i];

              if (i != 0) str += ", ";

              if (typeof node === "object") {
                const label =
                  Zotero.getMainWindow().document.createElement("label");
                label.setAttribute("value", str);
                label.setAttribute("crop", "end");
                str = "";
              } else {
                str += node;
              }
            }
            if (str.length) str += ".";
            return str;
          }
          function filter(ids: number[]) {
            ids = ids.filter(async (id) => {
              const item = (await Zotero.Items.getAsync(id)) as Zotero.Item;
              return item.isRegularItem() && !(item as any).isFeedItem;
            });
            return ids;
          }
          const text = prompt.inputNode.value;
          prompt.showTip("Searching...");
          const s = new Zotero.Search();
          s.addCondition("quicksearch-titleCreatorYear", "contains", text);
          s.addCondition("itemType", "isNot", "attachment");
          let ids = await s.search();
          // prompt.exit will remove current container element.
          // @ts-expect-error ignore
          prompt.exit();
          const container = prompt.createCommandsContainer();
          container.classList.add("suggestions");
          ids = filter(ids);
          console.log(ids.length);
          if (ids.length == 0) {
            const s = new Zotero.Search();
            const operators = [
              "is",
              "isNot",
              "true",
              "false",
              "isInTheLast",
              "isBefore",
              "isAfter",
              "contains",
              "doesNotContain",
              "beginsWith",
            ];
            let hasValidCondition = false;
            let joinMode = "all";
            if (/\s*\|\|\s*/.test(text)) {
              joinMode = "any";
            }
            text.split(/\s*(&&|\|\|)\s*/g).forEach((conditinString: string) => {
              const conditions = conditinString.split(/\s+/g);
              if (
                conditions.length == 3 &&
                operators.indexOf(conditions[1]) != -1
              ) {
                hasValidCondition = true;
                s.addCondition(
                  "joinMode",
                  joinMode as _ZoteroTypes.Search.Operator,
                  "",
                );
                s.addCondition(
                  conditions[0] as string,
                  conditions[1] as _ZoteroTypes.Search.Operator,
                  conditions[2] as string,
                );
              }
            });
            if (hasValidCondition) {
              ids = await s.search();
            }
          }
          ids = filter(ids);
          console.log(ids.length);
          if (ids.length > 0) {
            ids.forEach((id: number) => {
              const item = Zotero.Items.get(id);
              const title = item.getField("title");
              const ele = ztoolkit.UI.createElement(window.document!, "div", {
                namespace: "html",
                classList: ["command"],
                listeners: [
                  {
                    type: "mousemove",
                    listener: function () {
                      // @ts-expect-error ignore
                      prompt.selectItem(this);
                    },
                  },
                  {
                    type: "click",
                    listener: () => {
                      prompt.promptNode.style.display = "none";
                      ztoolkit.getGlobal("Zotero_Tabs").select("zotero-pane");
                      ztoolkit.getGlobal("ZoteroPane").selectItem(item.id);
                    },
                  },
                ],
                styles: {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "start",
                },
                children: [
                  {
                    tag: "span",
                    styles: {
                      fontWeight: "bold",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    properties: {
                      innerText: title,
                    },
                  },
                  {
                    tag: "span",
                    styles: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    properties: {
                      innerHTML: getItemDescription(item),
                    },
                  },
                ],
              });
              container.appendChild(ele);
            });
          } else {
            // @ts-expect-error ignore
            prompt.exit();
            prompt.showTip("Not Found.");
          }
        },
      },
    ]);
  }

  @example
  static registerConditionalCommandExample() {
    ztoolkit.Prompt.register([
      {
        name: "Conditional Command Test",
        label: "Plugin Template",
        // The when function is executed when Prompt UI is woken up by `Shift + P`, and this command does not display when false is returned.
        when: () => {
          const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
          return items.length > 0;
        },
        callback(prompt) {
          prompt.inputNode.placeholder = "Hello World!";
          const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
          ztoolkit.getGlobal("alert")(
            `You select ${items.length} items!\n\n${items
              .map(
                (item, index) =>
                  String(index + 1) + ". " + item.getDisplayTitle(),
              )
              .join("\n")}`,
          );
        },
      },
    ]);
  }
}

export class HelperExampleFactory {
  @example
  static async dialogExample() {
    const dialogData: { [key: string | number]: any } = {
      inputValue: "test",
      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      },
    };
    const dialogHelper = new ztoolkit.Dialog(10, 2)
      .addCell(0, 0, {
        tag: "h1",
        properties: { innerHTML: "Helper Examples" },
      })
      .addCell(1, 0, {
        tag: "h2",
        properties: { innerHTML: "Dialog Data Binding" },
      })
      .addCell(2, 0, {
        tag: "p",
        properties: {
          innerHTML:
            "Elements with attribute 'data-bind' are binded to the prop under 'dialogData' with the same name.",
        },
        styles: {
          width: "200px",
        },
      })
      .addCell(3, 0, {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "dialog-checkbox",
        },
        properties: { innerHTML: "bind:checkbox" },
      })
      .addCell(
        3,
        1,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-checkbox",
          attributes: {
            "data-bind": "checkboxValue",
            "data-prop": "checked",
            type: "checkbox",
          },
          properties: { label: "Cell 1,0" },
        },
        false,
      )
      .addCell(4, 0, {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "dialog-input",
        },
        properties: { innerHTML: "bind:input" },
      })
      .addCell(
        4,
        1,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-input",
          attributes: {
            "data-bind": "inputValue",
            "data-prop": "value",
            type: "text",
          },
        },
        false,
      )
      .addCell(5, 0, {
        tag: "h2",
        properties: { innerHTML: "Toolkit Helper Examples" },
      })
      .addCell(
        6,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("clipboardExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:clipboard",
              },
            },
          ],
        },
        false,
      )
      .addCell(
        7,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("filePickerExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:filepicker",
              },
            },
          ],
        },
        false,
      )
      .addCell(
        8,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("progressWindowExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:progressWindow",
              },
            },
          ],
        },
        false,
      )
      .addCell(
        9,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("vtableExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:virtualized-table",
              },
            },
          ],
        },
        false,
      )
      .addButton("Confirm", "confirm")
      .addButton("Cancel", "cancel")
      .addButton("Help", "help", {
        noClose: true,
        callback: (e) => {
          dialogHelper.window?.alert(
            "Help Clicked! Dialog will not be closed.",
          );
        },
      })
      .setDialogData(dialogData)
      .open("Dialog Example");
    addon.data.dialog = dialogHelper;
    await dialogData.unloadLock.promise;
    addon.data.dialog = undefined;
    if (addon.data.alive)
      ztoolkit.getGlobal("alert")(
        `Close dialog with ${dialogData._lastButtonId}.\nCheckbox: ${dialogData.checkboxValue}\nInput: ${dialogData.inputValue}.`,
      );
    ztoolkit.log(dialogData);
  }

  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
        "text/unicode",
      )
      .addText(
        '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
        "text/html",
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"],
      ],
      "image.png",
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
