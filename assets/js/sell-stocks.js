async function handleExit(data) {
  async function exitAllPositions(accessToken, instrument_key) {
    const segment = instrument_key.split("|")[0];

    console.log(segment); // "NSE_FO"
    const url = `https://api.upstox.com/v2/order/positions/exit?segment=${segment}`;

    try {
    //   const response = await fetch(url, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Accept: "application/json",
    //       Authorization: `Bearer ${accessToken}`,
    //     },
    //   });

      let result = {
        "status": "success",
        "data": {
            "order_ids": [
                "251121000151417"
            ]
        },
        "errors": null,
        "summary": {
            "total": 1,
            "success": 1,
            "error": 0
        }
    }

    //   const result = await response.json();
    //    for (const r of result) {
    //     if (!r.success) continue;
    let orderId = '251121000151417';
        // for (const orderId of result.data.orderIds) {
            console.log(`🔍 Fetching order details for ${orderId}...`);

            const details = await fetchOrderDetails(orderId, accessToken);

            console.log(`📦 Order Detail (${orderId}):`, details);

        // }
    // }
    //   return result;
    } catch (err) {
      console.error("❌ Error exiting positions:", err);
      return { error: true, detail: err };
    }
  }

  console.log("🚨 Exiting ALL positions for ALL linked clients...");
  const activeClients = linked_clients.filter((c) => c.active);

  if (activeClients.length === 0) {
    console.warn("⚠️ No active clients found. Skipping order placement.");
    return;
  }
  for (const client of activeClients) {
    console.log(`🔵 Exiting positions for client: ${client.client_name}`);

    const result = await exitAllPositions(
      client.access_token,
      data.instrumentKey
    );

    // let result = {
    //     "status": "success",
    //     "data": {
    //         "order_ids": [
    //             "251121000151417"
    //         ]
    //     },
    //     "errors": null,
    //     "summary": {
    //         "total": 1,
    //         "success": 1,
    //         "error": 0
    //     }
    // }

    
    // ---- NEW: Fetch order details for each client ----
   

    console.log(`🟢 Response for ${client.client_name}:`, result);
  }

  console.log("✅ Exit All completed for all clients.");
}
