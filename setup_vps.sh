#!/bin/bash
echo "Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default
cat << 'EOF' > /etc/nginx/conf.d/magister.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
systemctl restart nginx
ufw allow 80/tcp

echo "Configuring PM2..."
pm2 delete all || true

echo "Starting Frontend..."
cd /root/magister/magister_tech_app
pm2 serve dist 5173 --name "magister-frontend" --spa

echo "Starting Backend..."
cd /root/magister/magister_tech_backend
pm2 start npx --name "magister-backend" -- ts-node src/server.ts

pm2 save
echo "SETUP COMPLETE!"
