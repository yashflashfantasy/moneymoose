// List of linked clients
const linked_clients = [
  {
    id: 1,
    client_name: "Anupriya",
    trading_limit: "5000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzWUFSRVAiLCJqdGkiOiI2OTIzYWM4MDU0ZDU3NTI1YTFiNGY3NDciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ1NjAwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.AoV-lyuWg8pnJD-i_FvkyObsTPcGzRl4CHmU6-pcnNs",
  },
  {
    id: 2,
    client_name: "Muni Venkatesham",
    trading_limit: "10000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNCM0EiLCJqdGkiOiI2OTIzYWNiZDU0ZDU3NTI1YTFiNGY3NDgiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ1NjYxLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.lAkyl49fiK5mCT0cyBBnveuxcGz-vY32NievrPLNBAU",
  },
  {
    id: 3,
    client_name: "Muni Venkatesham 2",
    trading_limit: "8000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNHNzgiLCJqdGkiOiI2OTIzYWRhODU0ZDU3NTI1YTFiNGY3NGMiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ1ODk2LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.GFq_XO-PKmYt1Zqq3tWLaSyDKKnioNYFHMKuqTWIpLc",
  },
  {
    id: 4,
    client_name: "M Ganesh Kumar",
    trading_limit: "10000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNERVoiLCJqdGkiOiI2OTIzYWRlODU0ZDU3NTI1YTFiNGY3NGYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ1OTYwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.3u4Ecb3GBdrsUkUr7ZJQWm6XHJeTUAEi98KUEv4bhWw",
  },
  {
    id: 5,
    client_name: "Payyavula Sudhir",
    trading_limit: "10000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNFVDQiLCJqdGkiOiI2OTIzYWUyMWRmODMxMjRkNGYyZmE2OTkiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ2MDE3LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.l1zZc6WnJcDp4vFlUdt2_QBIK62FNtN373ugr_yAnYM",
  },
  {
    id: 6,
    client_name: "Aaditya Maheshwari",
    trading_limit: "10000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNRTjYiLCJqdGkiOiI2OTIzYWU2MzU0ZDU3NTI1YTFiNGY3NTYiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ2MDgzLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.F7XkPyH_rPP7789EWvVS31zo6226y12x6kV5LORjXGY",
  },
  {
    id: 7,
    client_name: "Avinash Reddy",
    trading_limit: "5000",
    active: true,
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNWRVEiLCJqdGkiOiI2OTIzYWVhZWRmODMxMjRkNGYyZmE2OWMiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ2MTU4LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.Nogx2Z8c9XWZ7LM3EM3uz1EEedXlRpNjPj9c81fD_VE",
  },
];