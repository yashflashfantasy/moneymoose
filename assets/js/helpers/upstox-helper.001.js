async function fetchOrderDetails(orderId, accessToken) {
  const url = `https://api.upstox.com/v2/order/details?order_id=${orderId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    const timestamp = Date.now();
    localStorage.setItem("order_" + timestamp, JSON.stringify(result));
    // await sendToSlack('Test New');
    return result;
  } catch (error) {
    console.error(`❌ Error fetching order details for ${orderId}:`, error);
    return null;
  }
}

async function placeOrderForClient(client, orderData, currentPrice) {
  try {
    console.log(client);
    
    const savedClients = await getAllClientsFromDB();
    const saved = savedClients.find(x => x.id === client.id);
    
    // Validate saved client data
    if (!saved || typeof saved.available_margin !== 'number') {
      console.error(`❌ Invalid client data for ${client.client_name}`);
      return { clientId: client.id, success: false, error: "Invalid client data or margin" };
    }
    
    console.log(saved.available_margin);
    console.log(currentPrice);
    console.log(orderData.quantity);

    // Validate inputs
    if (!currentPrice || currentPrice <= 0) {
      console.error(`❌ Invalid current price: ${currentPrice}`);
      return { clientId: client.id, success: false, error: "Invalid current price" };
    }

    const lotSize = orderData.quantity;
    const availableMargin = saved.available_margin;

    // Keep a safety buffer of 10% to account for market fluctuations
    const safetyBuffer = 0.90; // Use only 90% of available margin
    const usableMargin = availableMargin * safetyBuffer;

    // Calculate how many lots can be bought
    const costPerLot = lotSize * currentPrice;
    const maxLots = Math.floor(usableMargin / costPerLot);

    // Calculate final quantity
    let finalQuantity = maxLots * lotSize;

    console.log(`💰 Available Margin: ₹${availableMargin}`);
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
        return { clientId: client.id, success: false, error: "Quantity calculation error" };
    }

    console.log("✅ Order quantity adjusted successfully");

    // Create a new order object to avoid mutating the original
    const clientOrderData = {
        ...orderData,
        quantity: 20
    };

    console.log(clientOrderData,"clientOrderData");
    // return;
    const response = await fetch("https://api-hft.upstox.com/v3/order/place", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${client.access_token}`,
      },
      body: JSON.stringify(clientOrderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Error placing order for client ${client.client_name}:`,
        errorText
      );
      return { clientId: client.id, success: false, error: errorText };
    }

    const result = await response.json();
    console.log(
      `✅ Order placed successfully for client ${client.client_name}:`,
      result
    );

    return {
      clientId: client.id,
      success: true,
      orderIds: result?.data?.order_ids || [],
      accessToken: client.access_token,
    };
  } catch (error) {
    console.error(
      `⚠️ Network error for client ${client.client_name}:`,
      error.message
    );
    return { clientId: client.id, success: false, error: error.message };
  }
}

async function fetchLatestPrice(instrumentKey, accessToken) {
  const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${instrumentKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Price fetch error:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("📈 Latest price:", data);
    return data;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return null;
  }
}

async function fetchOptionContracts(instrumentKey, accessToken) {
  try {
    const url = `https://api.upstox.com/v2/option/contract?instrument_key=${encodeURIComponent(
      instrumentKey
    )}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    return data?.data || [];
  } catch (e) {
    console.error("❌ Error fetching option contracts:", e);
    return [];
  }
}

async function exitAllPositions(accessToken, instrument_key) {
  const segment = instrument_key.split("|")[0];

  console.log(segment); // "NSE_FO"
  const url = `https://api.upstox.com/v2/order/positions/exit?segment=${segment}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    return result;
  } catch (err) {
    console.error("❌ Error exiting positions:", err);
    return { error: true, detail: err };
  }
}

async function getFundsAndMargin(accessToken) {
  const url = "https://api.upstox.com/v2/user/get-funds-and-margin";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await res.json();
}
