document.querySelector("#marketTableBody").addEventListener("click", async (e) => {
    if (!e.target.matches("button[data-action]")) return;

    const btn = e.target;
    const action = btn.dataset.action;
    console.log(action);
    // Disable button to prevent double clicks
    if (action === "buy" && btn.disabled) {
        console.log("⚠️ Button already disabled, ignoring click");
        return;
    }
    if (action === "exit" && btn.disabled) {
        console.log("⚠️ Button already disabled, ignoring click");
        return;
    }

    // Get the row
    const row = btn.closest("tr");

    // Extract the values you need
    const symbol = row.children[1].textContent.trim();
    const lotSize = row.children[2].textContent.trim();
    const instrumentKey = row.children[3].textContent.trim();
    const currentPrice = row.children[4].textContent.trim();

    console.log(`🎯 Action: ${action} for ${symbol} at ${new Date().toISOString()}`);

    switch (action) {
        case "buy":
            await handleBuy({ instrumentKey, lotSize, symbol, row, btn, currentPrice });
            break;

        case "exit":
            handleExit({ instrumentKey, lotSize, symbol, row, btn, currentPrice });
            break;

        case "refresh":
            handleRefresh({ instrumentKey, lotSize, symbol, row });
            break;

        case "delete":
            handleDelete({ instrumentKey, lotSize, symbol, row });
            break;
    }
});

async function handleBuy(row){
    console.log('here!!!! How Many times, it should be only loggded Once')
    // Disable button and show loading state
    const originalText = row.btn.innerHTML;
    row.btn.disabled = true;
    row.btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing...';
    await buyUpstox(row);
    await buyDhan(row);
    // if (res) {
        // const congratsModal = new bootstrap.Modal(document.getElementById("congratsModal"));
        // congratsModal.show();
        row.btn.disabled = false;
        console.log(originalText);
        row.btn.innerHTML = originalText;
    // }
}