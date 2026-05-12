// Listens for instrument-selected (fired by instrument-search.001.js)
// and saves the selected instrument to IndexedDB, then populates the dashboard table.

document.addEventListener('instrument-selected', async (e) => {
  const { instrumentKey, tradingSymbol, lotSize, name } = e.detail;

  const [priceData, contracts] = await Promise.all([
    fetchLatestPrice(instrumentKey),
    fetchOptionContracts(instrumentKey),
  ]);

  await saveInstrumentToDB({
    instrument_key: instrumentKey,
    name,
    details:        priceData?.data,
    bought_at:      '-',
    exit_at:        '-',
    trading_symbol: tradingSymbol,
    lot_size:       lotSize,
    contracts:      contracts?.data || [],
    timestamp:      Date.now(),
  });

  await populateTable();
});
