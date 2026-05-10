async function handleRefresh(data){
    const accessToken =
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0WkE2MkIiLCJqdGkiOiI2YTAwMzdhOGMxNmQyYzUwMmRlZGQxODUiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzc4Mzk5MTQ0LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3Nzg0NTA0MDB9.ljpHiiaFLI5s5Lv6fZMMBAVOxi10AAUGXv5jLoOKXLM";
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