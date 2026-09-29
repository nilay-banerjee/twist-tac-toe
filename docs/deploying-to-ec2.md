# Deploying to EC2

Both halves run on one Linux EC2 instance behind nginx, on a single domain (`t3.nilaycodes.in`):

- nginx serves the built client from `/var/www/twist-tac-toe` and forwards only `/socket.io/` to the Node server.
- The Node server runs under PM2 on port 8080, which is never exposed to the internet.
- certbot manages HTTPS for the whole domain, WebSocket included.

The site and the socket share one origin, so no separate API subdomain is needed.

## Instance setup

1. Open ports 22, 80 and 443 in the instance's security group. Keep 8080 closed; only nginx talks to Node.
2. Install Node 18 or newer (Vite 5 needs it), nginx, PM2 (`npm install -g pm2`) and certbot with its nginx plugin.
3. Clone the repo on the instance, for example to `~/twist-tac-toe`.

## Server

```sh
cd ~/twist-tac-toe/server
cp .env_example .env
```

Set these in `server/.env`:

```sh
PORT=8080
BACKEND_URL=https://t3.nilaycodes.in
CLIENT_URL=https://t3.nilaycodes.in
```

`CLIENT_URL` is the only origin allowed through CORS. Leaving it unset allows any origin.

Build and start it under PM2, from `server/`, because `dotenv` reads `.env` from the working directory:

```sh
npm ci
npm run build
pm2 start npm --name t3-server -- start
pm2 save
pm2 startup   # prints a command to run once, so PM2 comes back after a reboot
```

Run exactly one instance, and don't use PM2 cluster mode (`-i`). Games and reconnect recovery live in the process's memory, so a second process would split them. For the same reason, restarting the server ends every game in progress.

## Client

Vite bakes `VITE_BACKEND_URL` into the bundle at build time, so set it on the build command and rebuild whenever it changes:

```sh
cd ~/twist-tac-toe/client
npm ci
VITE_BACKEND_URL=https://t3.nilaycodes.in npm run build
sudo mkdir -p /var/www/twist-tac-toe
sudo rsync -a --delete dist/ /var/www/twist-tac-toe/
```

Keep the files under `/var/www`. nginx's user usually can't read inside a home directory.

## nginx

On Ubuntu, put this in `/etc/nginx/sites-available/twist-tac-toe` and symlink it into `sites-enabled/`. On Amazon Linux, use `/etc/nginx/conf.d/twist-tac-toe.conf`. Either way the main `nginx.conf` already provides the `events` and `http` blocks, so this file holds only the `map` and `server` blocks:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    server_name t3.nilaycodes.in;

    root /var/www/twist-tac-toe;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    location / {
        try_files $uri /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

What each part is for:

- `try_files $uri /index.html` sends routes like `/game/ABC123` and `/join/ABC123` to the app. Without it, reloading or opening a shared link returns a 404.
- `no-cache` on `index.html` makes browsers check for a new version after each deploy. A stale copy would point at hashed JS files that `rsync --delete` has already removed, leaving a blank page.
- Everything under `/assets/` has a content hash in its file name, so browsers can cache it for a year.
- The `map` sends `Connection: upgrade` only when the browser asks for a WebSocket. The `Upgrade` and `Connection` headers are what let Socket.IO use WebSockets through the proxy; without them it falls back to HTTP long-polling.
- `127.0.0.1` rather than `localhost` stops nginx from also trying `::1`.

Check the config and reload:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS

```sh
sudo certbot --nginx -d t3.nilaycodes.in
```

certbot adds the `listen 443 ssl` lines and the HTTP-to-HTTPS redirect to the server block. The page and the socket are on the same domain, so the one certificate covers both. Browsers block a plain `ws://` socket from an HTTPS page, so this step is required, not optional.

## Redeploying

```sh
cd ~/twist-tac-toe
git pull

cd server
npm ci
npm run build
pm2 restart t3-server   # ends any games in progress

cd ../client
npm ci
VITE_BACKEND_URL=https://t3.nilaycodes.in npm run build
sudo rsync -a --delete dist/ /var/www/twist-tac-toe/
```

A client-only change doesn't need the PM2 restart.
