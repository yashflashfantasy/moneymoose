document.addEventListener('instrument-selected', async (e) => {
  const { instrumentKey, tradingSymbol, lotSize, name } = e.detail;

  const [priceData, contracts] = await Promise.all([
    fetchLatestPrice(instrumentKey),
    fetchOptionContracts(instrumentKey),
  ]);

  await saveToWatchlist({
    instrument_key: instrumentKey,
    name,
    trading_symbol: tradingSymbol,
    lot_size:       lotSize,
    details:        priceData?.data || {},
    contracts:      contracts?.data || [],
    timestamp:      Date.now(),
  });

  await populateTable();
});
