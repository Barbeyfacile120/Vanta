# Vanta Launcher — Backend API

API server for tracking active Vanta Launcher users.

## Requirements

- Node.js (version 18 or newer)
- npm (installed with Node.js)
- PM2 (optional, for running in the background)

## Installation

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in the `.env` file (default values are ready to use):
   ```
   PORT=3000
   SESSION_TIMEOUT_MINUTES=10
   CLEANUP_INTERVAL_MINUTES=5
   ```

## Running

### Directly (test/debug mode):
```bash
npm start
```
The server listens on `0.0.0.0:3000` (or the port defined in `.env`).

### In the background using PM2 (production):

1. Install PM2 globally (if not already installed):
   ```bash
   npm install -g pm2
   ```

2. Start the server:
   ```bash
   pm2 start server.js --name vanta-api
   ```

3. Save the PM2 configuration (auto-start after system reboot):
   ```bash
   pm2 save
   pm2 startup
   ```
   Run the command displayed by `pm2 startup` as root/sudo.

### Useful PM2 commands:
| Command | Description |
|---|---|
| `pm2 status` | List running processes |
| `pm2 logs vanta-api` | View server logs |
| `pm2 restart vanta-api` | Restart the server |
| `pm2 stop vanta-api` | Stop the server |
| `pm2 delete vanta-api` | Remove the process from PM2 |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/vanta/ping` | Register/refresh an active player session |
| GET | `/api/vanta/active` | Fetch the list of active UUIDs |

### POST /api/vanta/ping
**Body (JSON):**
```json
{
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "username": "PlayerName"
}
```
**Response:**
```json
{ "status": "ok" }
```

### GET /api/vanta/active
**Response:**
```json
{ "active": ["uuid1", "uuid2", "..."] }
```

## How the mod connects to the backend

In the mod code, set the API endpoint to the public IP address of the Oracle server and port:

```
http://<ORACLE_PUBLIC_IP>:3000/api/vanta/ping
http://<ORACLE_PUBLIC_IP>:3000/api/vanta/active
```

Where `<ORACLE_PUBLIC_IP>` is the public IPv4 address of your Oracle Cloud instance (visible in the OCI panel).

---

## Oracle Cloud Always Free Configuration

To make the API server accessible from the outside, you need to open the port in two places:

### 1. Opening the port in the OCI panel (Oracle Cloud Infrastructure)

1. Log in to the [OCI Console](https://cloud.oracle.com).
2. Go to **Networking → Virtual Cloud Networks**.
3. Click on the VCN assigned to your instance.
4. In the left menu, select **Security Lists**.
5. Click on the active Security List (default: `Default Security List`).
6. Click **Add Ingress Rules**.
7. Fill in the form:
   - **Source Type:** CIDR
   - **Source CIDR:** `0.0.0.0/0` (or the IP range you want to allow traffic from)
   - **IP Protocol:** TCP
   - **Source Port Range:** (leave empty)
   - **Destination Port Range:** `3000`
   - **Description:** `Vanta Launcher API`
8. Click **Add Ingress Rules**.

### 2. Opening the port on the Ubuntu/Linux machine (iptables)

SSH into the instance and run:

```bash
# Check current iptables rules
sudo iptables -L -n -v

# Add a rule allowing port 3000
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT

# Save rules (to persist after reboot)
sudo apt-get update
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

> **Note:** Some Ubuntu images on Oracle Cloud use `iptables` by default, but it is recommended to check. If you are using `ufw`, run these commands instead:
> ```bash
> sudo ufw allow 3000/tcp
> sudo ufw reload
> ```

### Verification

After completing all steps, check server availability from the outside:

```bash
curl http://<ORACLE_PUBLIC_IP>:3000/api/vanta/active
```

You should receive the response:
```json
{ "active": [] }
```

---

## Logs and Monitoring

The server logs every user ping and periodic cleanup of inactive sessions to the console. All logs follow this format:

```
[YYYY-MM-DD HH:MM:SS] [Vanta API] ...
```

On startup, the server prints detailed information about its configuration and endpoints.