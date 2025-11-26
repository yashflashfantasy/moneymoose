// List of linked clients
const linked_clients = [
  {
    id: 1,
    client_name: "Anupriya",
    trading_limit: "5000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzWUFSRVAiLCJqdGkiOiI2OTI2NTljZmQwMjhiZDU2YjY1MWNlNDAiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxMDM5LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.A-JnvAnr6_9wygO9sG22GytNtB1mdeOBAWcd6QHQCZA",
  },
  {
    id: 2,
    client_name: "Muni Venkatesham",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNCM0EiLCJqdGkiOiI2OTI2NWEwZmQwMjhiZDU2YjY1MWNlNDgiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxMTAzLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.XOhsLmCZ7scpSpKcRkju-Bfly_7E4_EWNtVOxhxzPZ0",
  },
  {
    id: 3,
    client_name: "Muni Venkatesham 2",
    trading_limit: "8000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNHNzgiLCJqdGkiOiI2OTI2NWE0OGQwMjhiZDU2YjY1MWNlNGYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxMTYwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.wVk-jGyZ8nZee0Io99YWX_yOhTFwwHKDUH2pU5VN4NM",
  },
  {
    id: 4,
    client_name: "M Ganesh Kumar",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNERVoiLCJqdGkiOiI2OTI2NWFjMDU3NzRmYTdhZGVhNTI2NjUiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxMjgwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.icBSuI4G3LEZ9R_rsvBj85A-pUpY55bHRJOBF5azu3c",
  },
  {
    id: 5,
    client_name: "Payyavula Sudhir",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNFVDQiLCJqdGkiOiI2OTI2NWFmYjU3NzRmYTdhZGVhNTI2NjkiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxMzM5LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.kzgeAi1_cWjLFGW2vTlP6Lsyu87QXnxwEhUhAyfmLp8",
  },
  {
    id: 6,
    client_name: "Aaditya Maheshwari",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNRTjYiLCJqdGkiOiI2OTI2NWIyZWQwMjhiZDU2YjY1MWNlNTgiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxMzkwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.9zi0ZWN09sgFR_TxbEWYcVqQUNLoNBdJw2UOZF76GeQ",
  },
  {
    id: 7,
    client_name: "Avinash Reddy",
    trading_limit: "5000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNWRVEiLCJqdGkiOiI2OTI2NWI2MWQwMjhiZDU2YjY1MWNlNWIiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MTIxNDQxLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxOTQ0MDB9.9JXcd1tmV5_DfPGpfZA_IzlChkc6nICWs65WNntQay4",
  },
  {
    id: 8,
    client_name: "Kotrappa Gangadhar",
    trading_limit: "8000",
    client_id: "1107441964",
    active: false,
    platform:'dhan',
    access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzY0MjA3OTYzLCJpYXQiOjE3NjQxMjE1NjMsInRva2VuQ29uc3VtZXJUeXBlIjoiU0VMRiIsIndlYmhvb2tVcmwiOiIiLCJkaGFuQ2xpZW50SWQiOiIxMTA3NDQxOTY0In0.S7CTGQ3rMxajya6BwNpEjKK2tCpaHBvgvwzm1sFVz4Z09VzwTVA2D3ANTyWGcggAqakcMyONRgbIZmN2BEKJEA"
  }
];