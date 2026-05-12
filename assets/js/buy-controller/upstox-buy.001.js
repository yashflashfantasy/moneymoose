async function buyUpstox(row) {
  const result = await placeBuyOrder(row.instrumentKey, Number(row.lotSize), Number(row.currentPrice));
  return result;
}
