async function handleRefresh(data){
    const accessToken =
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4RkE4R0giLCJqdGkiOiI2OTY1YjM0MWI1OTZjOTRjMTNlYTNlODEiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc2ODI3MjcwNSwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzY4MzQxNjAwfQ.b7yp-7uHzfQ33NF2g4lNKBTeAQNQYEh1bTpbLHOZl_A";
    const priceData = await fetchLatestPrice(data.instrumentKey, accessToken);
    // await sendToSlack(JSON.stringify(priceData));
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