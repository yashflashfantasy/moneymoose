async function handleDelete({ instrumentKey, row, btn }) {
    const ok = confirm("Are you sure you want to delete this instrument?");
    btn.disabled = false;
    if (!ok) return;

    // 1. Remove from DB
    await deleteInstrumentFromDB(instrumentKey);

    // 2. Remove from UI
    row.remove();

    console.log(`🗑️ Deleted item with instrument_key=${instrumentKey}`);
}