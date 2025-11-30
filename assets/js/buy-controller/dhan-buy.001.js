async function buyDhan(row){
    console.log(row);
    const [segment, secId] = row.instrumentKey.split('|');   // "NSE_FO" , "53003"

    const exchangeSegment = segment.replace("FO", "FNO");    // "NSE_FNO"
    const securityId = secId;                                // "53003"
    const orderDhanData ={
        // correlationId: "123abc678",
        transactionType: "BUY",
        exchangeSegment: exchangeSegment,
        validity: "DAY",
        securityId: securityId,
        quantity: row.lotSize,
        price: "",
        afterMarketOrder: false,
        productType: "INTRADAY",
        orderType: "MARKET"
    };
    console.log(orderDhanData);
    let res = await placeOrdersForAllDhanClients(orderDhanData);
    return res;
}

async function placeOrdersForAllDhanClients(orderData){
console.log("🚀 Placing orders for all clients...");

    const activeDhanClients = linked_clients.filter(c => c.active && c.platform == 'dhan');

    if (activeDhanClients.length === 0) {
        console.warn("⚠️ No active clients found. Skipping order placement.");
        return;
    }

    const results = await Promise.all(
        activeDhanClients.map(client => placeDhanOrder(client, orderData))
    );

    console.log("📊 Order Summary:", results);

    // ---- NEW: Fetch order details for each client ----
    // for (const r of results) {
    //     if (!r.success) continue;

    //     for (const orderId of r.orderIds) {
    //         console.log(`🔍 Fetching order details for ${orderId}...`);

    //         const details = await fetchOrderDetails(orderId, r.accessToken);

    //         console.log(`📦 Order Detail (${orderId}):`, details);


    //         // OPTIONAL: Update UI based on order detail
    //         // handleOrderStatusUpdate(details);
    //     }
    // }

    // console.log("📊 Order Results Summary:");
    results.forEach(r => {
        if (r.success) {
            console.log(`✅ Client ${r.clientId}: Success`);
        } else {
            console.log(`❌ Client ${r.clientId}: Failed - ${r.error}`);
        }
    });
}

async function placeDhanOrder(client, payload) {
    const url = "https://textiles-grey-knowing-collapse.trycloudflare.com/place-dhan-order";
    payload.dhanClientId = client.client_id;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            accessToken: client.access_token,
            payload: payload
        })
    });

    await saveOrder(client.id,res.json());

    return await res.json();
}