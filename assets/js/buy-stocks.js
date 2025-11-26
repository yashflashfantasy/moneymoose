document.querySelector("#marketTableBody").addEventListener("click", (e) => {
    if (!e.target.matches("button[data-action]")) return;

    const btn = e.target;
    const action = btn.dataset.action;

    // Get the row
    const row = btn.closest("tr");

    // Extract the values you need
    const symbol = row.children[1].textContent.trim();
    const lotSize = row.children[2].textContent.trim();
    const instrumentKey = row.children[3].textContent.trim();

    switch (action) {
        case "buy":
            handleBuy({ instrumentKey, lotSize, symbol, row });
            break;

        case "exit":
            handleExit({ instrumentKey, lotSize, symbol, row });
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
    await buyUpstox(row);
    let res = await buyDhan(row);
    if (res) {
        const congratsModal = new bootstrap.Modal(document.getElementById("congratsModal"));
        congratsModal.show();
    }
}

document.getElementById('buyButton').addEventListener('click', async function (event) {
    event.preventDefault();
    console.log('Old Function');
});