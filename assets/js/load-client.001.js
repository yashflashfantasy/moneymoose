let linked_clients = [];

async function loadLinkedClients() {
  try {
    const res = await fetch(`${BACKEND_URL}/clients`);
    const json = await res.json();
    linked_clients = json.data || [];
  } catch (err) {
    console.error('Failed to load clients from backend:', err);
  }
}

loadLinkedClients();
