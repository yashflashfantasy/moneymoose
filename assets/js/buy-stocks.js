document.querySelector("#marketTableBody").addEventListener("click", (e) => {
    if (!e.target.matches("button[data-action]")) return;

    const btn = e.target;
    const action = btn.dataset.action;

    // Get the row
    const row = btn.closest("tr");

    // Extract the values you need
    const symbol = row.children[1].textContent.trim();
    const lotSize = row.children[2].textContent.trim();
    const instrumentKey = row.children[3].textContent.trim();

    switch (action) {
        case "buy":
            handleBuy({ instrumentKey, lotSize, symbol, row });
            break;

        case "exit":
            handleExit({ instrumentKey, lotSize, symbol, row });
            break;

        case "refresh":
            handleRefresh({ instrumentKey, lotSize, symbol, row });
            break;

        case "delete":
            handleDelete({ instrumentKey, lotSize, symbol, row });
            break;
    }
});

async function handleRefresh(data){
    const accessToken =
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzWUFSRVAiLCJqdGkiOiI2OTIzYWM4MDU0ZDU3NTI1YTFiNGY3NDciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ1NjAwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.AoV-lyuWg8pnJD-i_FvkyObsTPcGzRl4CHmU6-pcnNs";
    const priceData = await fetchLatestPrice(data.instrumentKey, accessToken);
    const detailKeys = Object.keys(priceData.data);
    if (detailKeys.length === 0) {
      return;
    }

    const detailsKey = detailKeys[0];
    const details = priceData.data[detailsKey];

    data.row.querySelector(".latest-price").textContent = details.last_price
    await updateInstrumentDetailsInDB(data.instrumentKey, priceData.data);

    console.log("💾 Updated DB entry for:", data.instrumentKey);
}

async function handleBuy(row){
    console.log(row);
    // Common order data
    const orderData = {
        quantity: row.lotSize,
        product: "D",
        validity: "DAY",
        price: 0,
        tag: "string",
        instrument_token: row.instrumentKey,
        order_type: "MARKET",
        transaction_type: "BUY",
        disclosed_quantity: 0,
        trigger_price: 0,
        is_amo: false,
        slice: true
    };

    placeOrdersForAllClients(orderData);
}

async function handleDelete({ instrumentKey, row }) {
    const ok = confirm("Are you sure you want to delete this instrument?");
    if (!ok) return;

    // 1. Remove from DB
    await deleteInstrumentFromDB(instrumentKey);

    // 2. Remove from UI
    row.remove();

    console.log(`🗑️ Deleted item with instrument_key=${instrumentKey}`);
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

async function placeOrdersForAllClients(orderData) {
    console.log("🚀 Placing orders for all clients...");

    const activeClients = linked_clients.filter(c => c.active);

    if (activeClients.length === 0) {
        console.warn("⚠️ No active clients found. Skipping order placement.");
        return;
    }

    const results = await Promise.all(
        activeClients.map(client => placeOrderForClient(client, orderData))
    );

    console.log("📊 Order Summary:", results);

    // ---- NEW: Fetch order details for each client ----
    for (const r of results) {
        if (!r.success) continue;

        for (const orderId of r.orderIds) {
            console.log(`🔍 Fetching order details for ${orderId}...`);

            const details = await fetchOrderDetails(orderId, r.accessToken);

            console.log(`📦 Order Detail (${orderId}):`, details);


            // OPTIONAL: Update UI based on order detail
            // handleOrderStatusUpdate(details);
        }
    }

    console.log("📊 Order Results Summary:");
    results.forEach(r => {
        if (r.success) {
            console.log(`✅ Client ${r.clientId}: Success`);
        } else {
            console.log(`❌ Client ${r.clientId}: Failed - ${r.error}`);
        }
    });
}

async function placeOrderForClient(client, orderData) {
  try {

    const response = await fetch("https://api-hft.upstox.com/v3/order/place", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${client.access_token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error placing order for client ${client.client_name}:`, errorText);
      return { clientId: client.id, success: false, error: errorText };
    }

    const result = await response.json();
    console.log(`✅ Order placed successfully for client ${client.client_name}:`, result);
    
    return {
      clientId: client.id,
      success: true,
      orderIds: result?.data?.order_ids || [],
      accessToken: client.access_token
    };

  } catch (error) {
    console.error(`⚠️ Network error for client ${client.client_name}:`, error.message);
    return { clientId: client.id, success: false, error: error.message };
  }
}

async function fetchOrderDetails(orderId, accessToken) {
    const url = `https://api.upstox.com/v2/order/details?order_id=${orderId}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        const result = await response.json();
        const timestamp = Date.now();
        localStorage.setItem('order_' + timestamp, JSON.stringify(result));
        return result;

    } catch (error) {
        console.error(`❌ Error fetching order details for ${orderId}:`, error);
        return null;
    }
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

document.getElementById('buyButton').addEventListener('click', async function (event) {
    event.preventDefault();
    console.log('Old Function');
});