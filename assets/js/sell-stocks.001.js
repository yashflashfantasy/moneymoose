async function handleExit(data) {

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
    const url = "https://driver-jose-grade-naturals.trycloudflare.com/place-dhan-order";
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
