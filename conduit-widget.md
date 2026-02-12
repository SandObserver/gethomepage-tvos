# Minimal Conduit Widget for Homepage

<img src="./screenshots/conduit-widget.png" width="350px">

Add a Conduit stats widget to Homepage using `stats.json`.

---

## 1️⃣ Install Conduit

Install Conduit with a **persistent volume** and enable **JSON stats** as instructed (`--stats-file`) as instructed in the official docs:  
https://github.com/ssmirr/conduit/releases/latest  

---

## 2️⃣ Make stats.json Accessible

Homepage needs access to the file. Use a solution like **nginx** or any lightweight web server; eg: `http://your-server/stats.json`

---

## 3️⃣ Add the Widget to services.yaml

```yaml
widget:
  type: customapi
  url: http://your-server/stats.json
  refreshInterval: 10000
  method: GET
  mappings:
    - field: Field_!
      label: Label_1
      format: Format_1
    - field: Field_2
      label: Label_2
      format: Format_2
```

---

## Available Fields

| Field | Description | Format |
|--------|------------|--------|
| `connectingClients` | Connecting clients | number |
| `connectedClients` | Connected clients | number |
| `totalBytesUp` | Upload | bytes |
| `totalBytesDown` | Download | bytes |
| `uptimeSeconds` | Uptime | duration |

Customize the mappings to your preference.  
Once `stats.json` is reachable, Homepage will update automatically.
