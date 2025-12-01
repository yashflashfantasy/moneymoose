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
        productType: "MARGIN",
        orderType: "MARKET"
    };
    console.log(orderDhanData);
    let res = await placeOrdersForAllDhanClients(orderDhanData,row.currentPrice);
    return res;
}

async function placeOrdersForAllDhanClients(orderData,currentPrice){
console.log("🚀 Placing orders for all clients...");

    const activeDhanClients = linked_clients.filter(c => c.active && c.platform == 'dhan');

    if (activeDhanClients.length === 0) {
        console.warn("⚠️ No active clients found. Skipping order placement.");
        return;
    }

    const results = await Promise.all(
        activeDhanClients.map(client => placeDhanOrder(client, orderData,currentPrice))
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

async function placeDhanOrder(client, payload, currentPrice) {
    try {
        console.log(`📤 Placing Dhan order for client ${client.client_name || client.id}`);
        
        // Validate client data
        if (!client || !client.client_id || !client.access_token) {
            console.error(`❌ Invalid client data for Dhan order`);
            return { 
                clientId: client?.id, 
                success: false, 
                error: "Invalid client data or missing credentials" 
            };
        }

        // Validate current price
        if (!currentPrice || currentPrice <= 0 || !isFinite(currentPrice)) {
            console.error(`❌ Invalid current price: ${currentPrice}`);
            return { 
                clientId: client.id, 
                success: false, 
                error: "Invalid current price" 
            };
        }

        // Get client margin from database
        const savedClients = await getAllClientsFromDB();
        const saved = savedClients.find(x => x.id === client.id);
        
        if (!saved || typeof saved.available_margin !== 'number') {
            console.error(`❌ Invalid client margin data for ${client.client_name || client.id}`);
            return { 
                clientId: client.id, 
                success: false, 
                error: "Invalid client data or margin" 
            };
        }

        console.log(`💰 Available Margin: ₹${saved.available_margin}`);
        console.log(`💵 Current Price: ₹${currentPrice}`);
        console.log(`📦 Original Quantity: ${payload.quantity}`);

        // Calculate adjusted quantity based on available margin
        const lotSize = payload.quantity;
        const availableMargin = saved.available_margin;

        // Keep a safety buffer of 10% to account for market fluctuations
        const safetyBuffer = 0.90; // Use only 90% of available margin
        const usableMargin = availableMargin * safetyBuffer;

        // Calculate how many lots can be bought
        const costPerLot = lotSize * currentPrice;
        const maxLots = Math.floor(usableMargin / costPerLot);

        // Calculate final quantity
        let finalQuantity = maxLots * lotSize;

        console.log(`🛡️ Usable Margin (with 10% buffer): ₹${usableMargin.toFixed(2)}`);
        console.log(`📦 Lot Size: ${lotSize}`);
        console.log(`💵 Cost per Lot: ₹${costPerLot.toFixed(2)}`);
        console.log(`🔢 Max Lots: ${maxLots}`);
        console.log(`📊 Final Quantity: ${finalQuantity}`);
        console.log(`💸 Total Cost: ₹${(finalQuantity * currentPrice).toFixed(2)}`);

        // Validate final quantity - always buy at least 1 lot
        if (finalQuantity <= 0 || !isFinite(finalQuantity)) {
            console.warn(`⚠️ Calculated quantity is ${finalQuantity}. Forcing minimum of 1 lot.`);
            console.log(`💰 Usable Margin: ₹${usableMargin.toFixed(2)}, Cost per Lot: ₹${costPerLot.toFixed(2)}`);
            finalQuantity = lotSize; // Always buy at least 1 lot
            console.log(`📊 Adjusted Final Quantity to minimum: ${finalQuantity}`);
        }

        // Verify the calculation
        if (finalQuantity * currentPrice > usableMargin) {
            console.error(`❌ Calculation error: Final quantity exceeds usable margin`);
            return { 
                clientId: client.id, 
                success: false, 
                error: "Quantity calculation error" 
            };
        }

        console.log("✅ Order quantity adjusted successfully");

        // Create adjusted payload without mutating original
        const adjustedPayload = {
            ...payload,
            quantity: finalQuantity,
            dhanClientId: client.client_id
        };

        const url = " https://lotus-ratings-vocabulary-slowly.trycloudflare.com/place-dhan-order";

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accessToken: client.access_token,
                payload: adjustedPayload
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ Error placing Dhan order for client ${client.client_name || client.id}:`, errorText);
            return { 
                clientId: client.id, 
                success: false, 
                error: errorText 
            };
        }

        const result = await res.json();
        console.log(`✅ Dhan order placed successfully for client ${client.client_name || client.id}:`, result);

        // Save order to database
        await saveOrder(client.id, result);

        return {
            clientId: client.id,
            success: true,
            orderData: result,
            accessToken: client.access_token
        };

    } catch (error) {
        console.error(`⚠️ Network error for Dhan client ${client.client_name || client.id}:`, error.message);
        return { 
            clientId: client.id, 
            success: false, 
            error: error.message 
        };
    }
}