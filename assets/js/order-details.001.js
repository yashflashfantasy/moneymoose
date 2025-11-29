  
// getOrderDetails("251113000175325","eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNBSDIiLCJqdGkiOiI2OTE1NzI0ZWEzNjg3NjZjOGIzZDE0NGYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMDEzMTk4LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjMwNzEyMDB9.rcVWmAT9qdfEZp9nEFB6w2z-VH1Vj9_b4hD4ESNXwZE");

//   async function getOrderDetails(orderId,ACCESS_TOKEN) {
//       const url = `https://api-hft.upstox.com/v3/orders?order_id=${orderId}`;
//       const response = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Accept": "application/json",
//           "Authorization": `Bearer ${ACCESS_TOKEN}`
//         }
//       });

//       const data = await response.json();
//       log("✅ Order details fetched:\n" + JSON.stringify(data, null, 2));

//       // Save order in IndexedDB
//       await saveOrderToDB(data);
//       log(`💾 Order ${orderId} saved to IndexedDB successfully!`);
//     }

//     function openDB() {
//       return new Promise((resolve, reject) => {
//         const request = indexedDB.open("UpstoxDB", 1);

//         request.onupgradeneeded = (event) => {
//           const db = event.target.result;
//           const store = db.createObjectStore("orders", { keyPath: "order_id" });
//           store.createIndex("timestamp", "timestamp", { unique: false });
//         };

//         request.onsuccess = (event) => resolve(event.target.result);
//         request.onerror = (event) => reject(event.target.error);
//       });
//     }

//     // Save order in IndexedDB
//     async function saveOrderToDB(order) {
//       const db = await openDB();
//       return new Promise((resolve, reject) => {
//         const tx = db.transaction("orders", "readwrite");
//         const store = tx.objectStore("orders");
//         store.put(order); // put = insert or update
//         tx.oncomplete = () => resolve(true);
//         tx.onerror = (event) => reject(event.target.error);
//       });
//     }