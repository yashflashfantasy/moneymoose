let linked_clients = [];

async function loadLinkedClients() {
  try {
    const res = await fetch('http://localhost:3000/clients');
    const json = await res.json();
    linked_clients = json.data || [];
  } catch (err) {
    console.error('Failed to load clients from backend:', err);
  }
}

loadLinkedClients();
