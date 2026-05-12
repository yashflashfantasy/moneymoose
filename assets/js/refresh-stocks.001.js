async function handleRefresh(data){
    const accessToken =
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0WkE2MkIiLCJqdGkiOiI2YTAyOTNjOWY3MTM3NTJlZDI1NzhlZTUiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzc4NTUzODAxLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3Nzg2MjMyMDB9.S8ezRPE_VhjBdC9u6PQCx5MVNAbrhwLbZECb-V-k0uM";
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