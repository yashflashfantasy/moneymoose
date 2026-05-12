async function handleRefresh(data) {
  try {
    const priceData = await fetchLatestPrice(data.instrumentKey);
    if (!priceData?.data) return;

    const detailsKey = Object.keys(priceData.data)[0];
    if (!detailsKey) return;

    const details = priceData.data[detailsKey];
    data.row.querySelector('.latest-price').textContent = formatPrice(details.last_price);
    await updateInstrumentDetailsInDB(data.instrumentKey, priceData.data);
    console.log('💾 Price updated for:', data.instrumentKey);
  } catch (err) {
    console.error('Refresh failed:', err);
  }
}
