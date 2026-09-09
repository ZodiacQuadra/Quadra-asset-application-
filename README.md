# Quadra-asset-application-

An enterprise IT & Non-IT Asset Management System built with **React 18**, **Fluent UI v9**, **Vite**, and **Express**.

Designed for zero-configuration, zero-database deployment on **Vercel** with full in-memory interactive mock data.

---

## 🚀 Instant Vercel Deployment

This project is 100% Vercel-ready with zero database setup required. All data is served in-memory with rich enterprise sample records.

### Method 1: Import via Vercel Dashboard
1. Push this repository to your GitHub account:
   ```bash
   git remote add origin https://github.com/ZodiacQuadra/Quadra-asset-application-.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import **`Quadra-asset-application-`**.
4. Keep the default settings (Framework: Vite, Root Directory: `./`).
5. Click **Deploy**.

Your application will be live in ~1 minute!

---

## 🛠 Features

- **IT Asset Inventory:** Track Laptops, Desktops, Monitors, Keyboards, Mobile Phones, Headphones, Printers, and Network devices.
- **Add / Edit Asset Dialog:** Auto-generated Asset Tags, Category dropdown, Brand suggestions, Vendor picker, and file attachments.
- **Non-IT Asset Inventory:** Facilities, ergonomic furniture, projectors, HVAC with Book Value counters and AMC expiration alerts.
- **Role-Based Access Control (RBAC):** Switch seamlessly between **Administrator**, **Manager**, **HR**, and **Employee** roles.
- **Approval Workflows:**
  - Asset Procurement Requests
  - Defect Repair & Maintenance
  - Hardware Component Upgrades
  - Device Handovers / Check-ins
  - Lost Asset Incident Reports
  - HR New Hire Onboarding Kits
- **Reports & Analytics:** Stock status distribution, Department assignment matrix, and Aging & Warranty Insights.
- **Master Data Configuration:** Category management, Hardware Brands, Suppliers/Vendors, SLA rules, and Role Hardware Templates.
- **Global Search:** Multi-entity search across names, tags, serial numbers, and custodians.

---

## 💻 Running Locally

### Prerequisites
- Node.js >= 20.x

### Quick Start
```bash
# 1. Start Backend API (Port 5100)
cd backend
npm install
node server.js

# 2. In a separate terminal, start Frontend (Port 53010)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:53010/` to explore the application.
