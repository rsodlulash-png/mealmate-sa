MealMate SA

A meal-planning web app for South African households. Users can search recipes, view ingredients, and generate a meal plan based on their household preferences. Recipe data comes from TheMealDB.

Live app: http://18.130.138.158
GitHub: https://github.com/rsodlulash-png/mealmate-sa
Video Demo: https://drive.google.com/file/d/1Td9OLCcU0JVzaBkT-2QxtkHh-axH5RDb/view?usp=sharing

The live link runs on the lab's load-balancer server, so it may stop working if the lab servers are stopped or reset.

Features
Search recipes by name, ingredient or category
View recipe details (ingredients, instructions, images, links)
Generate a meal plan from household preferences
Health-check endpoint to confirm the backend is running
Traffic is shared between two web servers by an Nginx load balancer

Grocery prices (ZAR) and nutrition info are not available yet because no verified data source is connected. The app returns "unavailable" instead of making up values.

Tech Stack
Technology	Use
HTML, CSS, JavaScript	Frontend (public/ folder)
Node.js 22 + Express 5	Backend and API
dotenv	Loads environment variables
TheMealDB API	Recipe data
Nginx	Reverse proxy and load balancer
systemd	Keeps the app running
Git / GitHub	Version control
Project Structure
mealmate-sa/
├── public/         # Frontend files
├── src/
│   ├── app.js      # Express app and routes
│   ├── server.js   # Starts the server
│   ├── routes/     # Recipes, prices, meal plans, nutrition
│   ├── services/   # TheMealDB logic
│   ├── middleware/ # Error handling
│   └── utils/      # Validation and helpers
├── tests/          # Automated tests
├── .env.example    # Environment variable template
└── package.json
Run Locally

Requirements: Git and Node.js 22 (npm comes with it).

bash
# 1. Clone the repo
git clone https://github.com/rsodlulash-png/mealmate-sa.git
cd mealmate-sa

# 2. Install dependencies
npm ci

# 3. Create your .env file
cp .env.example .env

# 4. Start the app
npm run dev

Your .env file should look like this:

PORT=3000
THEMEALDB_API_KEY=1

1 is TheMealDB's free test key. Never commit your real .env file (it is in .gitignore).

Then open:

App: http://localhost:3000
Health check: http://localhost:3000/api/health

Run the tests with npm test.

API Endpoints
Method	Endpoint	What it does
GET	/api	API info
GET	/api/health	Backend status
GET	/api/recipes	Random recipes
GET	/api/recipes?search=chicken	Search by name (falls back to ingredient)
GET	/api/recipes?category=Seafood	Filter by category
GET	/api/recipes/:id	One recipe's full details
GET	/api/prices?items=rice,eggs	Grocery prices (currently unavailable)
POST	/api/meal-plans/generate	Generate a meal plan
GET	/api/nutrition/:recipeId	Nutrition info (currently unavailable)

Example:

bash
curl -i http://localhost:3000/api/health
External API

The backend uses TheMealDB V1 API (https://www.themealdb.com/api/json/v1/<API_KEY>/):

TheMealDB endpoint	Used for
search.php?s=	Search by name
filter.php?i=	Search by ingredient
filter.php?c=	Filter by category
lookup.php?i=	Recipe details
random.php	Random recipe

Recipe data and images belong to TheMealDB. Please keep the attribution and follow their terms of use.

Deployment

The app runs on three Ubuntu servers:

Server	Role	Address
LB01	Nginx load balancer	Public IP 18.130.138.158
Web01	Node.js app	10.30.31.201:3000
Web02	Node.js app	10.30.20.174:3000
Visitor --> LB01 (Nginx, port 80) --round-robin--> Web01 :3000
                                                \-> Web02 :3000
Deploy on Web01 and Web02 (repeat on both)

1. Connect from your local machine (SSH key stays local):

bash
ssh -i ~/.ssh/school -o IdentitiesOnly=yes ubuntu@<WEB_PUBLIC_IP>

2. Install packages:

bash
sudo apt update
sudo apt install -y git nginx

3. Clone and install:

bash
git clone https://github.com/rsodlulash-png/mealmate-sa.git
cd ~/mealmate-sa
npm ci --omit=dev

4. Copy the .env file (run from your local machine) and secure it:

bash
scp -i ~/.ssh/school .env ubuntu@<WEB_PUBLIC_IP>:/home/ubuntu/mealmate-sa/.env
# then on the server:
chmod 600 .env

5. Create a systemd service at /etc/systemd/system/mealmate.service:

ini
[Unit]
Description=MealMate SA Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mealmate-sa
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

Start it:

bash
sudo systemctl daemon-reload
sudo systemctl enable mealmate
sudo systemctl start mealmate
curl -i http://localhost:3000/api/health

6. Configure Nginx in /etc/nginx/sites-available/mealmate-sa:

nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

Enable it:

bash
sudo ln -sfn /etc/nginx/sites-available/mealmate-sa /etc/nginx/sites-enabled/mealmate-sa
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
Configure the Load Balancer (LB01)

1. Check LB01 can reach both backends:

bash
curl -i --max-time 5 http://10.30.31.201:3000/api/health
curl -i --max-time 5 http://10.30.20.174:3000/api/health

2. Create /etc/nginx/sites-available/mealmate-sa:

nginx
upstream mealmate_backend {
    server 10.30.31.201:3000;
    server 10.30.20.174:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        proxy_pass http://mealmate_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

3. Enable it and reload:

bash
sudo ln -sfn /etc/nginx/sites-available/mealmate-sa /etc/nginx/sites-enabled/mealmate-sa
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

Nginx uses round-robin by default, so requests alternate between Web01 and Web02.

Firewall Notes
LB01 should accept public traffic on port 80
LB01 must reach Web01 and Web02 on port 3000 (private network)
Keep SSH (port 22) restricted to admins
Port 3000 should not be open to the public
Testing

Health check through the load balancer (on LB01):

bash
curl -i http://localhost/api/health

Result: 200 OK with "status":"online".

Round-robin test: I temporarily added add_header X-Backend-Server $upstream_addr always; to the LB01 config and sent 10 requests. The responses alternated between the two servers.

Backend	Requests	Share
Web01	5	50%
Web02	5	50%

I removed the header afterwards, then ran nginx -t, reloaded Nginx, and confirmed the homepage and health endpoint still returned 200 OK. The app also opened in a browser at http://18.130.138.158.

This was a basic smoke test, not a full load or failure test.

Updating the Deployment

On Web01, then Web02:

bash
cd ~/mealmate-sa
git pull origin main
npm ci --omit=dev
sudo systemctl restart mealmate
sudo systemctl status mealmate --no-pager

Useful troubleshooting commands:

bash
sudo journalctl -u mealmate -f            # app logs
sudo nginx -t                             # check Nginx config
sudo tail -f /var/log/nginx/error.log     # Nginx errors
Challenges and Solutions
Challenge	Solution
SSH key was only on my local machine, so I couldn't SSH between servers	Ran all ssh and scp commands from local WSL
Web02 showed the default Nginx page	Created the mealmate-sa site, enabled it, and removed the default site
App needed to survive logout and reboot	Created a systemd service on each server
Hard to tell which backend handled a request	Used a temporary X-Backend-Server header, then removed it
API keys must not be public	Used .env + .gitignore, copied .env to servers with scp, and set chmod 600
No verified price or nutrition data	Endpoints return "unavailable" instead of fake values
Known Limitations and Future Improvements
No live supermarket price provider yet
No nutrition data provider yet
TheMealDB doesn't reliably give cooking times or servings
Halal status can't be confirmed from recipe data
Only HTTP for now (HTTPS needs a domain and certificate)
More testing needed (heavy traffic, server failure, recovery)
Credits
TheMealDB for recipe data and images
Node.js, Express, dotenv
Nginx for the reverse proxy and load balancing
Git and GitHub for version control
