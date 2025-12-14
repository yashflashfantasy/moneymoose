async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UpstoxDB", 2); // bump version

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("watchlist")) {
        const store = db.createObjectStore("watchlist", {
          keyPath: "instrument_key",
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains("clients")) {
        db.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("orders")) {
        const store = db.createObjectStore("orders", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("client_id", "client_id", { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function getAllSavedInstruments() {
  const db = await openDB(); // use the same openDB() helper
  return new Promise((resolve, reject) => {
    const tx = db.transaction("watchlist", "readonly");
    const store = tx.objectStore("watchlist");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveInstrumentToDB(instrument) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // Always check store existence (extra safe)
    if (!db.objectStoreNames.contains("watchlist")) {
      console.error(
        "❌ Object store 'watchlist' not found — need to recreate DB."
      );
      db.close();
      indexedDB.deleteDatabase("UpstoxDB");
      alert("Database reset — please refresh page.");
      reject("Object store missing");
      return;
    }

    const tx = db.transaction("watchlist", "readwrite");
    const store = tx.objectStore("watchlist");
    store.put(instrument);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (event) => reject(event.target.error);
  });
}

async function updateInstrumentDetailsInDB(instrumentKey, newDetails) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("watchlist", "readwrite");
    const store = tx.objectStore("watchlist");

    // 1. Get existing object
    const getReq = store.get(instrumentKey);

    getReq.onsuccess = () => {
      const instrument = getReq.result;

      if (!instrument) {
        console.warn("⚠️ Instrument not found in DB:", instrumentKey);
        resolve(false);
        return;
      }

      // 2. Update details + timestamp
      instrument.details = newDetails;
      instrument.timestamp = Date.now();

      // 3. Save updated object
      const putReq = store.put(instrument);

      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (e) => reject(e.target.error);
    };

    getReq.onerror = (e) => reject(e.target.error);
  });
}

async function deleteInstrumentFromDB(instrumentKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("watchlist", "readwrite");
    const store = tx.objectStore("watchlist");

    const req = store.delete(instrumentKey);

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function saveOrder(clientId, fullDetails) {
  await refreshClientMargin(clientId);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readwrite");
    const store = tx.objectStore("orders");

    store.add({
      client_id: clientId,
      details: fullDetails,
      ts: Date.now(),
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

// IndexedDB functions
async function getAllOrdersFromDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UpstoxDB", 2);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["orders"], "readonly");
      const store = transaction.objectStore("orders");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("orders")) {
        db.createObjectStore("orders", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}



async function getOrdersByClient(clientId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readonly");
    const store = tx.objectStore("orders");
    const idx = store.index("client_id");

    const req = idx.getAll(IDBKeyRange.only(clientId));

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function updateClientMarginInDB(clientId, availableMargin) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readwrite");
    const store = tx.objectStore("clients");

    const getReq = store.get(clientId);

    getReq.onsuccess = () => {
      let client = getReq.result;

      if (!client) {
        // create new entry if not exists
        client = { id: clientId };
      }

      client.available_margin = availableMargin;

      const putReq = store.put(client);

      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (e) => reject(e.target.error);
    };

    getReq.onerror = (e) => reject(e.target.error);
  });
}

async function getAllClientsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readonly");
    const store = tx.objectStore("clients");
    const req = store.getAll();

    req.onsuccess = () => {
      resolve(Array.from(req.result)); // ensure real array
    };
    req.onerror = () => reject(req.error);
  });
}

async function refreshClientMargin(clientId) {
  try {
    // Get client using existing function
    const client = getClientById(clientId);

    if (!client) {
      console.error("Client not found with id:", clientId);
      return null;
    }

    console.log("Client found:", client);

    let latestMargin = 0;

    // Fetch latest margin based on platform
    if (client.platform === "upstox") {
      const res = await getFundsAndMargin(client.access_token);
      latestMargin = res?.data?.equity?.available_margin ?? 0;
    // } else if (client.platform === "dhan") {
    //   const res = await getDhanFunds(client.access_token);
    //   latestMargin = res?.availabelBalance ?? 0;
    } else {
      console.warn("Unknown platform:", client.platform);
    }

    console.log("Latest margin fetched:", latestMargin);

    // Update client in IndexedDB
    const db = await openDB();
    const tx = db.transaction("clients", "readwrite");
    const store = tx.objectStore("clients");

    const updatedClient = {
      ...client,
      available_margin: latestMargin
    };

    const putReq = store.put(updatedClient);
    await new Promise((resolve, reject) => {
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });

    // Wait for transaction to complete
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    db.close();

    console.log("✅ Margin updated successfully for client:", clientId);
    return latestMargin;

  } catch (error) {
    console.error("❌ Error refreshing client margin:", error);
    return null;
  }
}

function getClientById(id) {
  return linked_clients.find(c => c.id === id);
}

// async function getDhanFunds(access_token) {
//   const r = await fetch("https://raw-harvey-celebrity-couple.trycloudflare.com/dhan-get-funds", {
//     method: "GET",
//     headers: { "access-token": access_token },
//   });
//   const json = await r.json();
//   return json;
// }