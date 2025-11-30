async function buyUpstox(row){
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

    await placeOrdersForAllClients(orderData, row.currentPrice);
}

async function placeOrdersForAllClients(orderData, currentPrice) {
    console.log("🚀 Placing orders for all clients...");

    const activeClients = linked_clients.filter(c => c.active && c.platform=='upstox');

    if (activeClients.length === 0) {
        console.warn("⚠️ No active clients found. Skipping order placement.");
        return;
    }

    console.log(activeClients);

    const results = await Promise.all(
        activeClients.map(client => placeOrderForClient(client, orderData, currentPrice))
    );

    console.log("📊 Order Summary:", results);

    // Fetch order details for each client
    for (const r of results) {
        if (!r.success) continue;

        for (const orderId of r.orderIds) {
            console.log(`🔍 Fetching order details for ${orderId}...`);

            const details = await fetchOrderDetails(orderId, r.accessToken);

            console.log(`📦 Order Detail (${orderId}):`, details);

            await saveOrder(r.clientId, details);
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