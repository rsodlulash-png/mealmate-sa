MealMate SA
A personalised South African household meal-planning application.

MealMate SA helps households discover recipes, review ingredients, and generate meal plans based on household preferences. It uses recipe data from TheMealDB and provides a Node.js/Express backend with a browser-based frontend.

Live application: http://18.130.138.158
GitHub repository: https://github.com/rsodlulash-png/mealmate-sa
The live URL is the public entry point on the assignment's load-balancer server. It may stop working if the provided lab servers are stopped, reset, or deallocated.

Table of contents
1. Features
2. Technology stack
3. Application architecture
4. Project structure
5. Run locally
6. Environment variables and secrets
7. Application API endpoints
8. External API integration
9. Deployment architecture
10. Deploy to the web servers
11. Configure the load balancer
12. Deployment testing and results
13. Updating and maintaining the deployment
14. Challenges and solutions
15. Known limitations and future improvements
16. Credits and documentation
Features
- Search for recipes by name, ingredient, and category.
- View recipe details, including ingredients, measurements, instructions, images, and available source/video links.
- Generate a meal plan using submitted household preferences.
- Request grocery-price information in South African rand (ZAR).
- Request nutritional information for a selected recipe.
- Use a health-check endpoint to confirm that the backend is running.
- Access the application through a public Nginx load balancer that distributes requests between two web servers.
The application only presents verified data as available. In particular, it does not invent grocery prices, nutritional values, cooking times, serving quantities, or halal certification when a trusted source has not supplied them.
Technology stack
Technology	Purpose
HTML, CSS and browser JavaScript	Frontend interface served from the public/ directory
Node.js 22	JavaScript runtime for the backend
Express 5	HTTP server, static-file hosting, and application API routes
dotenv	Loads environment variables from the local .env file
Node.js built-in fetch	Makes HTTPS requests to TheMealDB
Node.js built-in test runner (node:test)	Runs the automated test suite
Nginx	Reverse proxy on the web servers and round-robin load balancer on LB01
systemd	Keeps the application running and starts it after a server reboot
Git and GitHub	Source-code version control and repository hosting


The production servers used Ubuntu 20.04.6 LTS (ARM64), Node.js v22.23.5, npm 10.9.9 and Nginx 1.18.0.
Application architecture
The frontend is stored in public/. Express serves these files and exposes the application's JSON API. The backend calls TheMealDB for recipe information and normalises the external response into MealMate SA's recipe format.

The deployment uses three Ubuntu servers:
                         Website visitors
                                |
                                | HTTP :80
                                v
                  +---------------------------+
                  | LB01 - Nginx load balancer|
                  | Public IP: 18.130.138.158 |
                  +---------------------------+
                         /             \
              round-robin               round-robin
                   /                       \
       Private IP :3000                 Private IP :3000
                 /                           \
                v                             v
    +-----------------------+      +-----------------------+
    | Web01                 |      | Web02                 |
    | 10.30.31.201          |      | 10.30.20.174          |
    | Node/Express :3000    |      | Node/Express :3000    |
    | Nginx :80             |      | Nginx :80             |
    | systemd: mealmate     |      | systemd: mealmate     |
    +-----------------------+      +-----------------------+
Request flow
1. A visitor opens http://18.130.138.158.
2. Nginx on LB01 accepts the HTTP request on port 80.
3. The LB01 Nginx upstream group selects a backend server using its default round-robin method.
4. LB01 forwards the request to either Web01 at 10.30.31.201:3000 or Web02 at 10.30.20.174:3000 over the private network.
5. The Node.js/Express application on the selected server returns the frontend file or API response.
Important configuration detail: LB01's upstream points directly to the Node.js applications on port 3000. The separate Nginx services on Web01 and Web02 listen on port 80 and reverse-proxy to their local Node.js application at 127.0.0.1:3000 for direct access to those web servers. Traffic forwarded by LB01 uses the private IP and port 3000, so it does not pass through the backend servers' Nginx listeners.
Project structure
mealmate-sa/
├── public/                 # Frontend files served by Express
├── src/
│   ├── app.js               # Express application and route registration
│   ├── server.js            # Starts the HTTP server
│   ├── routes/              # Recipes, prices, meal plans and nutrition routes
│   ├── services/            # TheMealDB and application service logic
│   ├── middleware/          # Error-handling middleware
│   └── utils/               # Validation and shared utilities
├── tests/                   # Automated tests
├── .env.example             # Safe environment-variable template
├── .gitignore               # Excludes local secrets and dependencies
├── package.json
├── package-lock.json
└── README.md
Run locally
Prerequisites
Install the following on your development computer:
- Git
- Node.js 22 (or a compatible supported Node.js version)
- npm, which is included with Node.js
Check that Node.js and npm are available:
node --version
npm --version
1. Clone the repository
git clone https://github.com/rsodlulash-png/mealmate-sa.git
cd mealmate-sa
2. Install dependencies
npm ci
npm ci installs the exact dependency versions recorded in package-lock.json.
3. Create your local environment file
cp .env.example .env
nano .env
The .env file should contain values similar to:
PORT=3000
THEMEALDB_API_KEY=1
The value 1 is TheMealDB's test key for development and educational use. A different key can be set through THEMEALDB_API_KEY when one is available. Do not put real keys or passwords in the README or commit them to Git.
4. Start the development server
npm run dev
Open the application at:
- Frontend: http://localhost:3000
- API information: http://localhost:3000/api
- Health check: http://localhost:3000/api/health
The development command uses Node's watch mode. To run the application without watch mode, use:
npm start
5. Run automated tests
Stop the development server if necessary, then run:
npm test
This runs the project's tests using Node.js's built-in test runner (node --test). The command exits with a non-zero status if a test fails.
Environment variables and secrets
Variable	Purpose	Example
PORT	Port used by the Node.js application	3000
THEMEALDB_API_KEY	API key inserted into TheMealDB V1 request URL	1 for development/educational use


The repository includes .env.example as a template. The real .env file is excluded by .gitignore (.env and .env.* are ignored, while .env.example is allowed). This keeps API credentials out of GitHub.

On the servers, the .env file was transferred separately from the developer's WSL Ubuntu environment using scp and secured with:
chmod 600 .env
This makes the file readable and writable only by its owner. Never copy the private SSH key to a web server; use it from the local development machine to connect to the servers.
Application API endpoints
All routes below are provided by the MealMate SA Express application. They are not separate third-party APIs.
Method	Endpoint	Purpose
GET	/api	Returns API name, version and endpoint information
GET	/api/health	Returns the backend health status and a timestamp
GET	/api/recipes	Returns random recipes when no filters are supplied
GET	/api/recipes?search=chicken	Searches by recipe name; if no name match is found, the service also tries the ingredient search
GET	/api/recipes?category=Seafood	Filters recipes by category
GET	/api/recipes/:id	Returns full details for one recipe ID
GET	/api/prices?items=rice,eggs	Returns grocery price records; currently indicates that verified prices are unavailable
POST	/api/meal-plans/generate	Validates household preferences and generates a meal plan
GET	/api/nutrition/:recipeId	Retrieves the recipe and returns nutrition availability information; verified nutrient values are currently unavailable


Example health-check request:
curl -i http://localhost:3000/api/health
Example recipe search:
curl -sS -G http://localhost:3000/api/recipes \
  --data-urlencode "search=chicken"
Example category search:
curl -sS -G http://localhost:3000/api/recipes \
  --data-urlencode "category=Seafood"
For the meal-plan endpoint, send a JSON POST request to /api/meal-plans/generate using the household-preference fields required by the application's request validator and frontend form.
External API integration
TheMealDB — recipe data
MealMate SA uses TheMealDB as its external recipe-data provider. The backend uses TheMealDB's V1 JSON API over HTTPS. The API supplies recipe names, category and area, ingredient names and measures, instructions, thumbnail image URLs, optional source links and optional YouTube links.

Official documentation:
- TheMealDB API documentation
- TheMealDB API guide
- TheMealDB terms of use
The backend uses these V1 request patterns:
TheMealDB endpoint	Use in MealMate SA
search.php?s=<name>	Search recipes by name
filter.php?i=<ingredient>	Search by a main ingredient when a name search has no results
filter.php?c=<category>	Find recipes in a category
lookup.php?i=<id>	Retrieve full recipe details
random.php	Retrieve a random recipe when the recipe list is opened without a search or category


The API base URL pattern is:
https://www.themealdb.com/api/json/v1/<API_KEY>/
The code reads THEMEALDB_API_KEY from the environment and falls back to the public test key 1 if the variable is not set. The recipe service validates the HTTP response and JSON structure, applies a request timeout, normalises provider fields, extracts ingredient/measure pairs, and handles provider errors.

Attribution: Recipe data and recipe artwork displayed by the application are sourced from TheMealDB. Please retain the source attribution and follow TheMealDB's current terms of use when using its data and images.
Grocery prices and nutrition data
MealMate SA also exposes its own /api/prices and /api/nutrition/:recipeId routes, but these do not currently connect to an external supermarket-price or nutrition provider.
- The price service returns available: false and null price/retailer/source fields rather than displaying invented supermarket prices.
- The nutrition service returns available: false and null nutrient values because the standard TheMealDB recipe response does not provide complete verified nutrition data and no separate nutrition provider is connected yet.
These are application endpoints prepared for future provider integration, not claims of live external integrations.
Deployment architecture
The application was deployed to three provided Ubuntu servers:
Server	Role	Address used in the deployment
LB01 (7407-lb-01)	Public Nginx load balancer	Public IP 18.130.138.158
Web01 (7407-web-01)	MealMate SA Node.js application	Private IP 10.30.31.201, application port 3000
Web02 (7407-web-02)	Second MealMate SA Node.js application	Private IP 10.30.20.174, application port 3000


The web servers each run a separate copy of the application. Nginx on LB01 sends requests to the web servers using their private IP addresses. This keeps backend-to-backend traffic inside the server network rather than sending it over the public internet.
Network access required
Configure the lab firewall/security-group rules so that:
- The public web entry point (LB01) accepts inbound TCP port 80 from intended visitors.
- LB01 can reach Web01 and Web02 on TCP port 3000 over the private network.
- SSH (TCP port 22) is restricted to the administrators' access as required by the lab.
- Backend port 3000 should not be unnecessarily exposed to the public internet; allow the load balancer/private network to reach it.
The deployment was tested successfully from LB01 to both private backend addresses on port 3000.
Deploy to the web servers
These instructions describe the deployment used for this project. Run the Web01 steps on Web01 and repeat them on Web02. Replace placeholders such as <WEB01_PUBLIC_IP> with the public IP assigned by the lab environment. Do not use the placeholder text literally.
1. Connect from the local WSL Ubuntu terminal
The SSH private key stays on the local development machine. Connect from local WSL, not from one web server to another:
ssh -i ~/.ssh/school -o IdentitiesOnly=yes ubuntu@<WEB01_PUBLIC_IP>
Repeat with the Web02 public IP when configuring the second server.
2. Install or verify server packages
On each web server:
sudo apt update
sudo apt install -y git nginx
node --version
npm --version
nginx -v
The deployed environment used Node.js v22.23.5, npm 10.9.9 and Nginx 1.18.0. Install a compatible Node.js 22 release if it is not already present.
3. Clone the repository and install production dependencies
On each web server:
git clone https://github.com/rsodlulash-png/mealmate-sa.git
cd ~/mealmate-sa
npm ci --omit=dev
If the repository has already been cloned on that server, update it instead:
cd ~/mealmate-sa
git pull origin main
npm ci --omit=dev
4. Transfer the environment file securely
From the local WSL Ubuntu terminal, in the local project directory, transfer the local .env file to each web server. Do not run these scp commands from a remote server:
cd ~/mealmate-sa
scp -i ~/.ssh/school .env ubuntu@<WEB01_PUBLIC_IP>:/home/ubuntu/mealmate-sa/.env
scp -i ~/.ssh/school .env ubuntu@<WEB02_PUBLIC_IP>:/home/ubuntu/mealmate-sa/.env
On each web server, secure the file:
cd ~/mealmate-sa
chmod 600 .env
5. Create a systemd service on each web server
On both Web01 and Web02, create the service file:
sudo nano /etc/systemd/system/mealmate.service
Use this configuration:
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
Save the file, then enable and start the service:
sudo systemctl daemon-reload
sudo systemctl enable mealmate
sudo systemctl start mealmate
sudo systemctl status mealmate --no-pager
The service runs the npm start command from the project directory. Restart=always allows systemd to restart the application if the process exits, and enable configures it to start during boot.

Check the application directly on each web server:
curl -i http://localhost:3000/api/health
The expected result is HTTP/1.1 200 OK with JSON containing "success":true and "status":"online".
6. Configure Nginx on each web server
On both Web01 and Web02, create the site configuration:
sudo nano /etc/nginx/sites-available/mealmate-sa
Use this reverse-proxy configuration:
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
Enable the site and remove the default Nginx site if it is enabled:
sudo ln -sfn /etc/nginx/sites-available/mealmate-sa /etc/nginx/sites-enabled/mealmate-sa
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
The proxy_pass directive forwards requests received on the web server's port 80 to its local Node.js application on port 3000. The forwarded headers preserve the original host and client/proxy information.

In the deployed configuration, Web01 used its public IP (18.170.29.94) for server_name, while Web02 used _ as a catch-all. The shared example above uses _ so that it can be applied to either server.

Check the web server through Nginx:
curl -i http://localhost/api/health
Repeat the application and Nginx checks on the other web server before configuring the load balancer.
Configure the load balancer
LB01 runs Nginx as the public entry point. It does not need a copy of the MealMate SA Node.js application or a mealmate systemd service; its role is to proxy requests to Web01 and Web02.
1. Connect to LB01 and verify backend connectivity
From the local WSL Ubuntu terminal:
ssh -i ~/.ssh/school -o IdentitiesOnly=yes ubuntu@18.130.138.158
On LB01, install/verify Nginx:
sudo apt update
sudo apt install -y nginx
sudo systemctl status nginx --no-pager
Before configuring the upstream, test that LB01 can reach both applications over their private addresses:
curl -i --max-time 5 http://10.30.31.201:3000/api/health
curl -i --max-time 5 http://10.30.20.174:3000/api/health
Both requests returned HTTP 200 OK during deployment. This check is important: a load balancer cannot forward requests to a backend that is unreachable on the configured address and port.
2. Create the LB01 Nginx configuration
sudo nano /etc/nginx/sites-available/mealmate-sa
Add:
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
How this configuration works:
- upstream mealmate_backend defines the group of backend application servers.
- Each server line gives Nginx a backend's private IP address and application port.
- With multiple upstream servers and no alternative balancing directive configured, Nginx uses round-robin selection by default.
- proxy_pass http://mealmate_backend forwards incoming requests to the upstream group.
- The proxy_set_header directives pass the host, client IP, forwarding chain and original protocol to the backend.
3. Enable the load-balancer site and reload Nginx
On LB01:
sudo ln -sfn /etc/nginx/sites-available/mealmate-sa /etc/nginx/sites-enabled/mealmate-sa
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
Do not reload Nginx if sudo nginx -t reports an error. Correct the configuration and run the test again first.
4. Open the application through LB01
The public application address is:
http://18.130.138.158
The expected request path is visitor → LB01 Nginx → one of the two backend Node.js applications.
Deployment testing and results
Testing was carried out from the servers and through the public load-balancer address.
Backend connectivity
From LB01, the following checks were run:
curl -i --max-time 5 http://10.30.31.201:3000/api/health
curl -i --max-time 5 http://10.30.20.174:3000/api/health
Result: both Web01 and Web02 returned HTTP 200 OK and reported that the backend was online.
Load-balancer health check
On LB01:
curl -i http://localhost/api/health
Result: HTTP/1.1 200 OK, with a JSON response similar to:
{
  "success": true,
  "status": "online",
  "message": "MealMate SA backend is running."
}
Verify round-robin distribution
To see which backend Nginx selected, a temporary response header was added inside the LB01 location / block during testing:
add_header X-Backend-Server $upstream_addr always;
After validating the configuration and reloading Nginx, ten requests were sent to the health endpoint:
for i in {1..10}; do
    curl -sI http://localhost/api/health | grep -i X-Backend-Server
done
The observed results alternated between the two private backend addresses:
X-Backend-Server: 10.30.31.201:3000
X-Backend-Server: 10.30.20.174:3000
X-Backend-Server: 10.30.31.201:3000
X-Backend-Server: 10.30.20.174:3000
X-Backend-Server: 10.30.31.201:3000
X-Backend-Server: 10.30.20.174:3000
X-Backend-Server: 10.30.31.201:3000
X-Backend-Server: 10.30.20.174:3000
X-Backend-Server: 10.30.31.201:3000
X-Backend-Server: 10.30.20.174:3000
Backend	Requests observed	Share of test requests
Web01 (10.30.31.201:3000)	5	50%
Web02 (10.30.20.174:3000)	5	50%
Total	10	100%


This is evidence that the configured upstream was distributing these ten requests evenly using round-robin selection. The diagnostic header was temporary: it was removed after the test so that the backend private addresses would not be exposed in normal response headers.
Final checks after removing the diagnostic header
After removing the temporary header, the following commands were run on LB01:
sudo nginx -t
sudo systemctl reload nginx
curl -i http://localhost/api/health
curl -I http://localhost/
Results:
- sudo nginx -t reported that the Nginx syntax was OK and the test was successful.
- The health endpoint continued to return HTTP/1.1 200 OK.
- The homepage returned HTTP/1.1 200 OK with Content-Type: text/html.
- The application was also opened successfully in a browser through http://18.130.138.158.
These tests demonstrate application availability through LB01 and the observed 5-to-5 distribution in the ten-request round-robin test. They are a deployment smoke test, not a long-duration load, stress, or failure-recovery test.
Updating and maintaining the deployment
When new code is pushed to GitHub, update both web servers. Run these commands on Web01 and then repeat them on Web02:
cd ~/mealmate-sa
git pull origin main
npm ci --omit=dev
sudo systemctl restart mealmate
sudo systemctl status mealmate --no-pager
The .env file is stored separately on each server and should remain in place during an application update. If the application needs a new environment variable, update the local .env.example, update each server's .env securely, and never commit the real .env file.

Useful troubleshooting commands:
# Application service status
sudo systemctl status mealmate --no-pager

# Follow application logs
sudo journalctl -u mealmate -f

# Validate Nginx configuration
sudo nginx -t

# Check Nginx service status
sudo systemctl status nginx --no-pager

# Follow Nginx error log
sudo tail -f /var/log/nginx/error.log
Challenges and solutions
Challenge	How it was resolved
The SSH private key was available on the local WSL Ubuntu machine, not on the web servers. An attempt to SSH from one remote server to another could not use that local key.	SSH connections and scp transfers were performed from the local WSL terminal. The private key was kept on the developer machine rather than copied to the servers.
Web02 initially displayed the default Nginx welcome page instead of MealMate SA.	A dedicated mealmate-sa Nginx site was created, enabled in sites-enabled, and the default site was removed. The configuration was tested with nginx -t before reloading Nginx.
The application needed to keep running after the SSH session ended and after a server reboot.	A mealmate systemd service was created on each web server, enabled at boot and configured to restart the application if the process exits.
The load balancer needed to reach both web servers reliably.	The upstream was configured with the servers' private IP addresses and port 3000. Each backend health endpoint was tested directly from LB01 before testing the public route.
It was necessary to prove which backend received a request because both servers returned the same health-check JSON.	A temporary X-Backend-Server response header was used for ten test requests. The results showed five requests to each backend. The diagnostic header was removed after verification.
The application requires API credentials, but secrets must not be stored in the public repository.	.env is excluded by .gitignore, .env.example provides the variable names, and the real environment file was transferred to each server separately and protected with chmod 600.
Recipe data does not include verified supermarket prices or complete nutrition facts.	Price and nutrition services return unavailable/null values instead of inventing information. These services are documented as future integration points.


Known limitations and future improvements
- No verified live South African supermarket-price provider is connected yet. Grocery prices are marked unavailable until a reliable source is integrated.
- No dedicated nutrition-data provider is connected yet. Calories, protein, carbohydrates and fat therefore remain unavailable instead of being estimated without evidence.
- TheMealDB V1 response does not consistently include structured preparation/cooking times or serving quantities. Those values are left unavailable when not provided.
- A recipe's category or tags are not proof of halal certification. MealMate SA does not claim halal certification based on recipe data alone.
- The deployment currently uses HTTP. HTTPS with a domain name and TLS certificate can be configured if a domain is assigned and the assignment environment supports it.
- Further deployment tests could include sustained traffic, backend failure simulation, and recovery testing.
Credits and documentation
MealMate SA uses and acknowledges the following open-source software and external resource:
- TheMealDB — recipe data, recipe images and API. Website · API documentation · Terms of use.
- Node.js — JavaScript runtime and built-in modules, including fetch and the test runner. Official documentation.
- Express.js — backend routing and static-file serving. Official documentation.
- dotenv — loading environment variables from .env. Project documentation.
- Nginx — reverse proxy and upstream load balancing. HTTP load-balancing documentation · Proxy module documentation.
- Git and GitHub — version control and source-code hosting. Git documentation · GitHub documentation.
The application uses the Node.js built-in test runner; no separate third-party test framework is listed in package.json.
