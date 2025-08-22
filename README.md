
# Backend Server – FVG Global Assist

This repository contains the Node.js backend server for the FVG Global Assist project.  
It provides APIs for authentication, payments (Authorize.Net), and integration with the frontend (Webflow).

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/adeelfeb/fvg-server
cd fvg-server
````

### 2. Configure environment variables

Create a `.env` file in the root directory and add the required variables.

Make sure your database is running and migrations are applied if using Prisma.



### 3. Install dependencies

```bash
npm install


### 4. Start the server

``` 
 npm run dev
```

* The server will start on your local machine.
* Ngrok will automatically generate a **public URL** (e.g., `https://random-id.ngrok.io`).
* Copy this URL — you’ll need it to connect the backend with the frontend.

---

### 5. Connect with the frontend

* Open the Webflow **frontend Add Page** here:
  [https://fvg-global-assist.webflow.io/add](https://fvg-global-assist.webflow.io/add)

* Paste the **Ngrok URL** into the frontend’s API configuration (where the backend URL is required).

* After saving, the frontend will communicate with your backend APIs in real time.

---

## ✅ Notes

* Always use **Ngrok** or another tunneling service when testing locally, since the Webflow frontend needs a **publicly accessible URL**.
* When deploying to production, replace the Ngrok URL with your production server URL.
* Use the **Authorize.Net sandbox test cards** (e.g., `4111 1111 1111 1111`) to simulate payments.

---

## 📂 Useful Commands

```bash
# Run server in dev mode
npm run dev

# Run Prisma migrations (if using Prisma ORM)
npx prisma migrate dev

# Format code
npm run format

# Lint project
npm run lint
```

---

## 🛠 Tech Stack

* Node.js / Express.js
* Prisma ORM (PostgreSQL / MySQL supported)
* Authorize.Net (Payments)
* Ngrok (tunneling)
* JWT Authentication

---

## 👨‍💻 Developer Notes

* Make sure your `.env` file is **never committed** to GitHub.
* Keep your API keys secure.
* For production, update your environment to use **live Authorize.Net keys** instead of sandbox.



