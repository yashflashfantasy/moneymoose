async function handleExit(data) {
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

  async function exitDhanPositions(data, client){
    const [segment, secId] = data.instrumentKey.split('|');   // "NSE_FO" , "53003"

    const exchangeSegment = segment.replace("FO", "FNO");    // "NSE_FNO"
    const securityId = secId;                                // "53003"
    const payload ={
        // correlationId: "123abc678",
        transactionType: "SELL",
        exchangeSegment: exchangeSegment,
        validity: "DAY",
        securityId: securityId,
        quantity: data.lotSize,
        price: "",
        afterMarketOrder: false,
        productType: "INTRADAY",
        orderType: "MARKET",
    };
    // console.log(orderDhanData);
    const url = "http://localhost:3000/place-dhan-order";
    payload.dhanClientId = client.client_id;
    console.log(url)
    console.log(payload)
    console.log({
            "Content-Type": "application/json",
            "access-token": client.access_token
        })
        // return;

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

    return await res.json();
  }

  console.log("🚨 Exiting ALL positions for ALL linked clients...");
  const activeClients = linked_clients.filter((c) => c.active);

  if (activeClients.length === 0) {
    console.warn("⚠️ No active clients found. Skipping order placement.");
    return;
  }
  for (const client of activeClients) {
    console.log(`🔵 Exiting positions for client: ${client.client_name}`);
    let result;
    if(client.platform == 'upstox'){
        result = await exitAllPositions(
        client.access_token,
        data.instrumentKey
        );
    }

    if(client.platform == 'dhan'){
        result = await exitDhanPositions(
            data,
            client
        )
    }
    

    console.log(`🟢 Response for ${client.client_name}:`, result);
  }
  

  console.log("✅ Exit All completed for all clients.");
}
