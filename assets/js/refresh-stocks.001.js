async function handleRefresh(data){
    const accessToken =
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4RkE4R0giLCJqdGkiOiI2OTNlYzJiNTU1MmY0YTYwMDQzNWM0NmUiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc2NTcyMDc1NywiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzY1NzQ5NjAwfQ.txOBJPc9lG51-km4EHWaVOt9dVbutKtohjjj9XH589I";
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