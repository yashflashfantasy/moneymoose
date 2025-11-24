async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UpstoxDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create store if it doesn't exist
      if (!db.objectStoreNames.contains("watchlist")) {
        const store = db.createObjectStore("watchlist", {
          keyPath: "instrument_key",
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      // Clients store
      if (!db.objectStoreNames.contains("clients")) {
        db.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}