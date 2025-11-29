async function handleDelete({ instrumentKey, row }) {
    const ok = confirm("Are you sure you want to delete this instrument?");
    if (!ok) return;

    // 1. Remove from DB
    await deleteInstrumentFromDB(instrumentKey);

    // 2. Remove from UI
    row.remove();

    console.log(`🗑️ Deleted item with instrument_key=${instrumentKey}`);
}