 const linked_clients = [
  {
    id: 1,
    api_key: "630be4f6-6430-4efd-8e23-cac6a1f2b7bc",
    api_secret: "wtw4gngbcl",
    redirect_uri: "http://127.0.0.1:5500/admin/dashboard.html",
    access_token: ""
  },
  {
    id: 2,
    api_secret: "6bv7bq1mxp",
    api_key: "59b045b6-86c3-44a4-9bb4-a579fbb9ea6d",
    redirect_uri: "http://127.0.0.1:5500/admin/dashboard.html",
    access_token: ""
  },
  {
    id: 3,
    api_secret: "0ein8peytc",
    api_key: "31ebaa40-82b3-4347-8e47-612aa7fbd133",
    redirect_uri: "http://127.0.0.1:5500/admin/dashboard.html",
    access_token: ""
  }
];

    // const logBox = document.getElementById("log");
    const log = (msg) => {
      console.log(msg);
      // logBox.textContent += msg + "\n";
    };

    // ===========================
    // STEP 1: HANDLE REDIRECT CODE (when Upstox redirects here)
    // ===========================
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      // We came back from Upstox login for one client
      const client = linked_clients.find(c => c.id === Number(state));
      if (client) {
        log(`🔑 Got code for client ${client.id}: ${code}`);
        exchangeCodeForToken(client, code);
      } else {
        log("❌ Unknown client in redirect state!");
      }
    }

    // ===========================
    // STEP 2: Function to open authorization URL
    // ===========================
    async function authorizeClient(client) {
      const authorizeUrl = new URL("https://api.upstox.com/v2/login/authorization/dialog");
      authorizeUrl.searchParams.append("client_id", client.api_key);
      authorizeUrl.searchParams.append("redirect_uri", client.redirect_uri);
      authorizeUrl.searchParams.append("response_type", "code");

      log(`🔗 Opening Upstox login for client ${client.id}...`);
      log(`${authorizeUrl}`);
      window.location.href = authorizeUrl.href; // redirect browser
    }

    // ===========================
    // STEP 3: Exchange code → token
    // ===========================
    async function exchangeCodeForToken(client, code) {
      const tokenUrl = "https://api.upstox.com/v2/login/authorization/token";

      const formBody = new URLSearchParams({
        code,
        client_id: client.api_key,
        client_secret: client.api_secret,
        redirect_uri: client.redirect_uri,
        grant_type: "authorization_code"
      });

      try {
        log(`🔁 Exchanging code for token (client ${client.id})...`);
        const response = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "accept": "application/json"
          },
          body: formBody.toString()
        });

        const data = await response.json();
        if (response.ok) {
          client.access_token = data.access_token;
          log(`✅ Token received for client ${client.id}`);
          log(JSON.stringify(data, null, 2));
          localStorage.setItem(`client_${client.id}_token`, data.access_token);
          log(`💾 Token saved in localStorage for client ${client.id}`);
        } else {
          log(`❌ Token fetch failed for client ${client.id}: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        log(`⚠️ Error: ${err.message}`);
      }
    }

    // ===========================
    // STEP 4: Button handler – refresh all tokens one by one
    // ===========================
    document.getElementById("refreshBtn").addEventListener("click", async () => {
      const linked_clients = [
        {
          id: 1,
          client_name: "Anupriya",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzWUFSRVAiLCJqdGkiOiI2OTFhOTczYWVmNjIyNjBhYTYwNDExZWIiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwMzMwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.MW0ghrri0X9GCtzkgmPMyq7DVihVXn71LM_6WGMjkVY"
        },
        {
          id: 2,
          client_name: "Muni Venkatesham",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNCM0EiLCJqdGkiOiI2OTFhOTc4ZWVmNjIyNjBhYTYwNDEyMTMiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwNDE0LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.mwYYxRDcwcOMTSszCM3wQGjQtj27bUJ8aPwDmATuon4"
        },
        {
          id: 3,
          client_name:"Muni Venkatesham 2",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNHNzgiLCJqdGkiOiI2OTFhOTdjZWIyNjM3MzRiMDhmNTNhOTQiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwNDc4LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.MjNdTk4HirZ9zNrFeOxih_5j3L0uiQVkrOb7o9DZK7Q"
        },
        {
          id: 4,
          client_name: "M Ganesh Kumar",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNERVoiLCJqdGkiOiI2OTFhOTgyNmYzZmJmODY2N2QwMjBiYTgiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwNTY2LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.N18COu3-znrOBrajnpgA_ULNXs9WlMU1jQMkulL9joA",
          order_id: 251117000040970
        },
        {
          id: 5,
          client_name: "Payyavula Sudhir",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNFVDQiLCJqdGkiOiI2OTFhOTg2Y2YzZmJmODY2N2QwMjBiYzQiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwNjM2LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.8twZfD4UMdAZjjWDAU4TRVTWKVsjWVqWeL9NQKo0Fik"
        },
        {
          id: 6,
          client_name: "Aaditya Maheshwari",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNRTjYiLCJqdGkiOiI2OTFhOTg5ODYyMjdjYzFjZTM3NDM4MDkiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwNjgwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.KaCEkYPYPqDLUINQeIgTCspBW_9L1WCKU0tqgxqAeWg"
        },
        {
          id: 7,
          client_name: "Avinash Reddy",
          access_token: "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNWRVEiLCJqdGkiOiI2OTFhOThkOGVmNjIyNjBhYTYwNDEyOTYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzMzUwNzQ0LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjM0MTY4MDB9.O4-GL4a9mFOo3SeAODbVg24JUznB2noRHc8TMFZXTzA"
        }
      ];
            async function fetchOrderDetails(accessToken, orderId) {
        const url = `https://api.upstox.com/v2/order/details?order_id=${encodeURIComponent(orderId)}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${accessToken}`
          }
        });
        const data = await res.json();
        console.log("Order Details:", data);
        return data;
      }

      console.log("🚨 Getting Order Details for ALL linked clients...");

        for (const client of linked_clients) {
          console.log(`🔵 Getting Order Detail for client: ${client.client_name}`);

          const result = await exitAllPositions(client.access_token);

          console.log(`🟢 Response for ${client.client_name}:`, result);
        }

        console.log("✅ Get Order Detail for All completed for all clients.");
    });