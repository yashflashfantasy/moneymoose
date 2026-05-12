async function handleRefresh(data) {
  try {
    const priceData = await fetchLatestPrice(data.instrumentKey);
    if (!priceData?.data) return;

    const detailsKey = Object.keys(priceData.data)[0];
    if (!detailsKey) return;

    const lastPrice = priceData.data[detailsKey]?.last_price;
    data.row.querySelector('.latest-price').textContent = formatPrice(lastPrice);

    // Persist latest price to backend so next page load shows it
    await saveToWatchlist({ instrument_key: data.instrumentKey, details: priceData.data, timestamp: Date.now() });
  } catch (err) {
    console.error('Refresh failed:', err);
    showToast('Refresh failed', 'error');
  }
}
