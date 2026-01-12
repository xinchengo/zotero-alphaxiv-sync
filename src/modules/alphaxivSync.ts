import { getPref } from "../utils/prefs";

type SyncPair = {
  zoteroLibraryID: number;
  zoteroCollectionKey: string;
  alphaxivFolderId: string;
};

type AlphaxivFolderPaper = {
  paperGroupId?: string;
  universalPaperId?: string;
};

type AlphaxivFolder = {
  id: string;
  name?: string;
};

function parseSyncPairs(): SyncPair[] {
  const raw = getPref("syncPairs").trim();
  ztoolkit.log("parseSyncPairs: Raw syncPairs preference:", raw);
  
  if (!raw) {
    ztoolkit.log("parseSyncPairs: No sync pairs configured");
    return [];
  }
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
    ztoolkit.log("parseSyncPairs: Parsed JSON:", parsed);
  } catch (e) {
    ztoolkit.log("parseSyncPairs: JSON parse error:", e);
    throw new Error("syncPairs must be valid JSON");
  }
  
  if (!Array.isArray(parsed)) {
    ztoolkit.log("parseSyncPairs: Parsed value is not an array");
    return [];
  }
  
  const result = parsed
    .map((p, index) => {
      ztoolkit.log(`parseSyncPairs: Processing pair ${index}:`, p);
      if (!p || typeof p !== "object") {
        ztoolkit.log(`parseSyncPairs: Pair ${index} is not an object`);
        return null;
      }
      const zoteroLibraryID = (p as any).zoteroLibraryID;
      const zoteroCollectionKey = (p as any).zoteroCollectionKey;
      const alphaxivFolderId = (p as any).alphaxivFolderId;
      
      if (typeof zoteroLibraryID !== "number") {
        ztoolkit.log(`parseSyncPairs: Pair ${index} has invalid zoteroLibraryID:`, zoteroLibraryID);
        return null;
      }
      if (typeof zoteroCollectionKey !== "string") {
        ztoolkit.log(`parseSyncPairs: Pair ${index} has invalid zoteroCollectionKey:`, zoteroCollectionKey);
        return null;
      }
      if (typeof alphaxivFolderId !== "string") {
        ztoolkit.log(`parseSyncPairs: Pair ${index} has invalid alphaxivFolderId:`, alphaxivFolderId);
        return null;
      }
      
      const validPair = { zoteroLibraryID, zoteroCollectionKey, alphaxivFolderId };
      ztoolkit.log(`parseSyncPairs: Valid pair ${index}:`, validPair);
      return validPair;
    })
    .filter(Boolean) as SyncPair[];
    
  ztoolkit.log(`parseSyncPairs: Returning ${result.length} valid pairs:`, result);
  return result;
}

function getArxivIdFromItem(item: Zotero.Item): string | null {
  const fields = ["archiveLocation", "url", "extra", "DOI"] as const;
  ztoolkit.log(`getArxivIdFromItem: Processing item ${item.id} - ${item.getField("title")}`);
  
  for (const field of fields) {
    try {
      const v = item.getField(field as any, false, true) as any;
      if (typeof v !== "string") continue;
      ztoolkit.log(`getArxivIdFromItem: Checking field ${field}: "${v}"`);
      const arxiv = extractArxivId(v);
      if (arxiv) {
        ztoolkit.log(`getArxivIdFromItem: Found arXiv ID ${arxiv} in field ${field}`);
        return arxiv;
      }
    } catch (e) {
      ztoolkit.log(`getArxivIdFromItem: Error reading field ${field}:`, e);
      continue;
    }
  }
  ztoolkit.log(`getArxivIdFromItem: No arXiv ID found for item ${item.id}`);
  return null;
}

function extractArxivId(text: string): string | null {
  const normalized = text.trim();
  const m1 = normalized.match(/\b(\d{4}\.\d{4,5})(v\d+)?\b/i);
  if (m1) return m1[1];
  const m2 = normalized.match(
    /arxiv\.org\/(?:abs|pdf)\/([^?\s/#]+)(?:\.pdf)?/i,
  );
  if (m2) return m2[1].replace(/v\d+$/i, "");
  const m3 = normalized.match(/\barxiv:\s*([^\s;]+)/i);
  if (m3) return m3[1].replace(/v\d+$/i, "");
  return null;
}

class AlphaxivClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(params: { apiKey: string; baseUrl?: string }) {
    this.apiKey = params.apiKey;
    this.baseUrl = (params.baseUrl || "https://api.alphaxiv.org")
      .trim()
      .replace(/\/+$/, "");
  }

  private async requestJson<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    const bodyString = body === undefined ? undefined : JSON.stringify(body);
    if (bodyString !== undefined) headers["Content-Type"] = "application/json";
    
    ztoolkit.log(`AlphaxivClient: ${method} ${url}`, body ? { body } : {});
    
    try {
      const xhr = await Zotero.HTTP.request(method, url, {
        headers,
        body: bodyString,
        timeout: 30000,
      });
      
      ztoolkit.log(`AlphaxivClient: Response status ${xhr.status} for ${method} ${path}`);
      
      if (xhr.status < 200 || xhr.status >= 300) {
        throw new Error(`HTTP ${xhr.status}: ${xhr.responseText}`);
      }
      
      const text = xhr.responseText || "";
      const result = JSON.parse(text) as T;
      ztoolkit.log(`AlphaxivClient: Parsed response for ${method} ${path}:`, result);
      return result;
    } catch (e) {
      ztoolkit.log(`AlphaxivClient: Error in ${method} ${path}:`, e);
      throw e;
    }
  }

  async listFolders(): Promise<AlphaxivFolder[]> {
    return this.requestJson<AlphaxivFolder[]>("GET", "/folders/v3");
  }

  async getFolderWithPapers(folderId: string): Promise<AlphaxivFolder | null> {
    try {
      // Get all folders - papers are included in each folder
      const folders = await this.listFolders();
      const folder = folders.find(f => f.id === folderId);
      return folder || null;
    } catch (e) {
      ztoolkit.log(`AlphaxivClient: Failed to get folder ${folderId}:`, e);
      return null;
    }
  }

  async addPapersToFolder(folderId: string, paperGroupIds: string[]) {
    if (paperGroupIds.length === 0) return;
    await this.requestJson(
      "POST",
      `/folders/v3/${encodeURIComponent(folderId)}/add-papers`,
      {
        paperGroupIds,
      },
    );
  }

  async getPaperGroupId(unresolved: string): Promise<string> {
    const data = await this.requestJson<any>(
      "GET",
      `/papers/v3/${encodeURIComponent(unresolved)}`,
    );
    const groupId = data?.groupId || data?.paperGroupId || data?.paperGroupID;
    if (typeof groupId === "string" && groupId) return groupId;
    throw new Error("alphaXiv paper metadata missing groupId");
  }
}

async function importIntoZoteroByArxivId(arxivId: string, collectionKey?: string, libraryID?: number) {
  ztoolkit.log(`importIntoZoteroByArxivId: Attempting to import ${arxivId}`);
  
  // Ensure arXiv ID has proper format (arXiv:XXXX.XXXXX) for logging, but use bare ID for URL
  const formattedArxivId = arxivId.startsWith('arXiv:') ? arxivId : `arXiv:${arxivId}`;
  const bareArxivId = formattedArxivId.replace(/^arXiv:/, ''); // Remove arXiv: prefix for URL
  ztoolkit.log(`importIntoZoteroByArxivId: Using formatted identifier: ${formattedArxivId}, bare ID: ${bareArxivId}`);
  
  // Based on smoke test results, Zotero.Translate.Search doesn't work for arXiv identifiers
  // Skip directly to the working URL-based approach
  try {
    ztoolkit.log(`importIntoZoteroByArxivId: Using arXiv URL approach for ${bareArxivId}`);
    
    const arxivUrl = `https://arxiv.org/abs/${bareArxivId}`;
    ztoolkit.log(`importIntoZoteroByArxivId: Using URL: ${arxivUrl}`);
    
    // Use processDocuments to load the arXiv page - this method works based on smoke test
    return new Promise((resolve, reject) => {
      Zotero.HTTP.processDocuments(
        [arxivUrl],
        async function(doc) {
          try {
            ztoolkit.log(`importIntoZoteroByArxivId: Document loaded for ${arxivUrl}`);
            
            const translate = new Zotero.Translate.Web();
            translate.setDocument(doc);
            
            // Set target library and collection if provided
            if (libraryID !== undefined) {
              translate.setLibraryID(libraryID);
            }
            if (collectionKey && libraryID !== undefined) {
              const collection = Zotero.Collections.getByLibraryAndKey(libraryID, collectionKey);
              if (collection) {
                translate.setCollection(collection);
              }
            }
            
            const translators = await translate.getTranslators();
            ztoolkit.log(`importIntoZoteroByArxivId: Found ${translators.length} web translators for ${arxivUrl}`);
            
            if (translators.length === 0) {
              throw new Error(`No web translators found for arXiv URL: ${arxivUrl}`);
            }
            
            // Use the first available translator
            translate.setTranslator(translators[0]);
            
            const items = await translate.translate();
            ztoolkit.log(`importIntoZoteroByArxivId: Successfully imported ${items.length} items via URL`);
            
            resolve(items);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
    
  } catch (e) {
    ztoolkit.log(`importIntoZoteroByArxivId: Import failed for ${formattedArxivId}:`, e);
    throw new Error(`Failed to import arXiv paper ${formattedArxivId}: ${e}`);
  }
}

async function getCollectionItemsForPair(
  pair: SyncPair,
): Promise<Zotero.Item[]> {
  ztoolkit.log(`getCollectionItemsForPair: Looking for collection ${pair.zoteroCollectionKey} in library ${pair.zoteroLibraryID}`);
  
  const collection = Zotero.Collections.getByLibraryAndKey(
    pair.zoteroLibraryID,
    pair.zoteroCollectionKey,
  );
  
  if (!collection) {
    ztoolkit.log(`getCollectionItemsForPair: Collection not found`);
    return [];
  }
  
  ztoolkit.log(`getCollectionItemsForPair: Found collection "${collection.name}"`);
  
  const ids = collection.getChildItems(true, false);
  ztoolkit.log(`getCollectionItemsForPair: Collection has ${ids.length} child items`);
  
  const items = Zotero.Items.get(ids) as Zotero.Item[];
  const regularItems = items.filter((it) => it?.isRegularItem?.());
  ztoolkit.log(`getCollectionItemsForPair: ${regularItems.length} regular items found`);
  
  return regularItems;
}

export async function syncAllPairs() {
  ztoolkit.log("syncAllPairs: Starting sync process");
  
  if (!getPref("enable")) {
    ztoolkit.log("syncAllPairs: Sync disabled in preferences");
    return;
  }
  
  const apiKey = getPref("alphaxivApiKey").trim();
  if (!apiKey) {
    ztoolkit.log("syncAllPairs: Missing API key");
    throw new Error("Missing alphaXiv API key in preferences");
  }
  
  const pairs = parseSyncPairs();
  ztoolkit.log("syncAllPairs: Found sync pairs:", pairs);
  if (pairs.length === 0) {
    ztoolkit.log("syncAllPairs: No sync pairs configured");
    return;
  }

  const client = new AlphaxivClient({ apiKey });
  ztoolkit.log("syncAllPairs: Created AlphaXiv client");
  
  const folders = await client.listFolders();
  ztoolkit.log("syncAllPairs: Retrieved folders from AlphaXiv:", folders.length);

  for (const pair of pairs) {
    ztoolkit.log(`syncAllPairs: Processing pair - Zotero: ${pair.zoteroLibraryID}/${pair.zoteroCollectionKey}, AlphaXiv: ${pair.alphaxivFolderId}`);
    
    const folder = folders.find((f) => f.id === pair.alphaxivFolderId);
    if (!folder) {
      ztoolkit.log(`syncAllPairs: AlphaXiv folder ${pair.alphaxivFolderId} not found in available folders`);
      ztoolkit.log(`syncAllPairs: Available folder IDs:`, folders.map(f => f.id));
      continue;
    }
    
    // Papers are included directly in the folder object
    const alphaxivPapers = (folder as any).papers || [];
    ztoolkit.log(`syncAllPairs: Found ${alphaxivPapers.length} papers in AlphaXiv folder ${folder.name || folder.id}`);
    
    const alphaxivArxivIds = new Set<string>();
    for (const p of alphaxivPapers) {
      if (typeof p.universalPaperId !== "string") continue;
      const arxivId = extractArxivId(p.universalPaperId);
      if (arxivId) alphaxivArxivIds.add(arxivId);
    }
    ztoolkit.log(`syncAllPairs: Extracted ${alphaxivArxivIds.size} arXiv IDs from AlphaXiv:`, Array.from(alphaxivArxivIds));

    const items = await getCollectionItemsForPair(pair);
    ztoolkit.log(`syncAllPairs: Found ${items.length} items in Zotero collection`);
    
    const zoteroArxivIds = new Set(
      items
        .map((item) => getArxivIdFromItem(item))
        .filter((v): v is string => typeof v === "string" && !!v),
    );
    ztoolkit.log(`syncAllPairs: Extracted ${zoteroArxivIds.size} arXiv IDs from Zotero:`, Array.from(zoteroArxivIds));

    const missingInAlphaxiv: string[] = [];
    for (const arxivId of zoteroArxivIds) {
      if (alphaxivArxivIds.has(arxivId)) continue;
      missingInAlphaxiv.push(arxivId);
    }
    ztoolkit.log(`syncAllPairs: ${missingInAlphaxiv.length} papers missing in AlphaXiv:`, missingInAlphaxiv);
    
    const paperGroupIdsToAdd: string[] = [];
    for (const arxivId of missingInAlphaxiv) {
      try {
        const paperGroupId = await client.getPaperGroupId(arxivId);
        paperGroupIdsToAdd.push(paperGroupId);
        ztoolkit.log(`syncAllPairs: Got paper group ID for ${arxivId}: ${paperGroupId}`);
      } catch (e) {
        ztoolkit.log(`syncAllPairs: Failed to get paper group ID for ${arxivId}:`, e);
      }
    }
    
    if (paperGroupIdsToAdd.length > 0) {
      ztoolkit.log(`syncAllPairs: Adding ${paperGroupIdsToAdd.length} papers to AlphaXiv folder`);
      await client.addPapersToFolder(pair.alphaxivFolderId, paperGroupIdsToAdd);
    }

    const missingInZotero: string[] = [];
    for (const alphaxivArxivId of alphaxivArxivIds) {
      if (zoteroArxivIds.has(alphaxivArxivId)) continue;
      missingInZotero.push(alphaxivArxivId);
    }
    ztoolkit.log(`syncAllPairs: ${missingInZotero.length} papers missing in Zotero:`, missingInZotero);
    
    for (const alphaxivArxivId of missingInZotero) {
      try {
        ztoolkit.log(`syncAllPairs: Importing ${alphaxivArxivId} into Zotero collection`);
        await importIntoZoteroByArxivId(alphaxivArxivId, pair.zoteroCollectionKey, pair.zoteroLibraryID);
      } catch (e) {
        ztoolkit.log(`syncAllPairs: Failed to import ${alphaxivArxivId}:`, e);
      }
    }
  }
  
  ztoolkit.log("syncAllPairs: Sync process completed");
}

export async function importMissingFromAlphaxivExample(arxivIds: string[]) {
  for (const arxivId of arxivIds) {
    await importIntoZoteroByArxivId(arxivId);
  }
}

export { AlphaxivClient, importIntoZoteroByArxivId };
