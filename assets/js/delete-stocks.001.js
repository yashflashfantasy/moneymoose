async function handleDelete({ instrumentKey, row, btn }) {
  const ok = await showConfirm('Remove this instrument from watchlist?');
  btn.disabled = false;
  if (!ok) return;
  await deleteFromWatchlist(instrumentKey);
  row.remove();
}
