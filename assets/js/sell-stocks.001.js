async function handleExit(data) {

  async function exitDhanPositions(data, client, currentPrice){
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
        productType: "MARGIN",
        orderType: "MARKET",
    };
    // console.log(orderDhanData);
    // const url = "https://toward-races-proceeding-chances.trycloudflare.com/place-dhan-order";
    // payload.dhanClientId = client.client_id;

    let clientPositons =  await getDhanPositions(client);
    console.log(clientPositons);
    // return false;
    await placeDhanOrder(client, payload, currentPrice)

    // const res = await fetch(url, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //         accessToken: client.access_token,
    //         payload: payload
    //     })
    // });

    // return await res.json();
  }

  data.btn.disabled = true;

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
            client,
            data.currentPrice
        )
    }

    data.btn.disabled = false;
    

    console.log(`🟢 Response for ${client.client_name}:`, result);
  }

  // async function getDhanPositions(client){
  //   const url = "https://toward-races-proceeding-chances.trycloudflare.com/dhan-positions";


  //   const res = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //           "Content-Type": "application/json",
  //           "access-token": client.access_token
  //       }
  //   });
  //   return res.json();
  // }

  async function getDhanPositions(client) {
    const url = "https://toward-races-proceeding-chances.trycloudflare.com/dhan-positions";
    const res = await fetch(url, { method: "GET",
        headers: {
            "Content-Type": "application/json",
            "access-token": client.access_token
        } });
    return res.json();
  }

  
}
