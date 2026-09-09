const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 5100);
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.DATABASE_MODE === "memory");

let db;
try {
  if (isVercel) {
    // In-memory zero-database mode for Vercel & serverless deployment
    db = new DatabaseSync(":memory:");
  } else {
    const dataDir = path.join(__dirname, "data");
    fs.mkdirSync(dataDir, { recursive: true });
    db = new DatabaseSync(path.join(dataDir, "asset-management.sqlite"));
  }
} catch (e) {
  console.warn("Using in-memory database fallback:", e.message);
  db = new DatabaseSync(":memory:");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT, employee_id TEXT, job_title TEXT, department TEXT, role TEXT, branch TEXT DEFAULT 'Coimbatore HQ', active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL, category_id TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, pincode TEXT, gstin TEXT, description TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, asset_name TEXT NOT NULL, description TEXT, tag_id TEXT UNIQUE, category TEXT, category_id TEXT, brand TEXT, model TEXT, serial_no TEXT, location TEXT, site TEXT, purchased_date TEXT, expire_date TEXT, cost REAL DEFAULT 0, vendor_id TEXT, status TEXT DEFAULT 'In Stock', assigned_to TEXT, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, request_number TEXT UNIQUE, type TEXT NOT NULL, requested_by TEXT, category TEXT, description TEXT, status TEXT DEFAULT 'Pending', created_at TEXT NOT NULL, action_by TEXT);
  CREATE TABLE IF NOT EXISTS category_components (id TEXT PRIMARY KEY, category_id TEXT, component_name TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS configuration (id TEXT PRIMARY KEY, config_key TEXT UNIQUE, config_value TEXT);
  CREATE TABLE IF NOT EXISTS sla (id TEXT PRIMARY KEY, category TEXT, priority TEXT, hours INTEGER DEFAULT 24, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS activity (id TEXT PRIMARY KEY, title TEXT, detail TEXT, created_at TEXT NOT NULL);
`);
try { db.exec("ALTER TABLE employees ADD COLUMN branch TEXT DEFAULT 'Coimbatore HQ'"); } catch {}

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const first = (v, fallback = null) => (v === undefined ? fallback : v);
const json = (res, data, status = 200, message) => res.status(status).json({ success: true, ...(message ? { message } : {}), data });
const error = (res, message, status = 400) => res.status(status).json({ success: false, message });
const body = (req) => req.body && typeof req.body === "object" ? req.body : {};
const requestUser = (req) => body(req).requestedByUserId || body(req).createdByUserId || body(req).userId || "local-admin";

function seed() {
  if (db.prepare("SELECT COUNT(*) AS n FROM employees").get().n < 5) {
    const addEmployee = db.prepare("INSERT OR REPLACE INTO employees (id,display_name,email,employee_id,job_title,department,role,branch) VALUES (?,?,?,?,?,?,?,?)");
    addEmployee.run("local-admin", "Local Asset Administrator", "local.admin@localhost", "LOCAL-001", "Asset Administrator", "IT", "Administrator", "Coimbatore HQ");
    addEmployee.run("local-employee", "Local Employee", "employee@localhost", "LOCAL-002", "Software Engineer", "Engineering", "Employee", "Coimbatore HQ");
    addEmployee.run("local-manager", "Local Manager", "manager@localhost", "LOCAL-003", "Engineering Manager", "Engineering", "Manager", "Coimbatore HQ");
    addEmployee.run("emp-john", "John Anderson", "john.anderson@quadrasystems.net", "QRA-1004", "Senior DevOps Engineer", "Engineering", "Employee", "Bangalore Tech Hub");
    addEmployee.run("emp-sarah", "Sarah Connor", "sarah.connor@quadrasystems.net", "QRA-1005", "Staff Product Manager", "Product", "Employee", "Chennai Branch");
    addEmployee.run("emp-emily", "Emily Davis", "emily.davis@quadrasystems.net", "QRA-1006", "Lead UI/UX Designer", "Design", "Employee", "Coimbatore HQ");
    addEmployee.run("emp-david", "David Miller", "david.miller@quadrasystems.net", "QRA-1007", "Solutions Architect", "IT", "Employee", "Hyderabad Branch");
    addEmployee.run("emp-priya", "Priya Sharma", "priya.sharma@quadrasystems.net", "QRA-1008", "Talent Acquisition Lead", "HR", "Employee", "Chennai Branch");
    addEmployee.run("emp-alex", "Alex Chen", "alex.chen@quadrasystems.net", "QRA-1009", "Security Engineer", "IT", "Employee", "Bangalore Tech Hub");
    addEmployee.run("emp-rahul", "Rahul Verma", "rahul.verma@quadrasystems.net", "QRA-1010", "Account Executive", "Sales", "Employee", "Hyderabad Branch");
  }
  if (db.prepare("SELECT COUNT(*) AS n FROM categories").get().n === 0) {
    const add = db.prepare("INSERT INTO categories (id,name,type) VALUES (?,?,?)");
    add.run("cat-laptop", "Laptop", "IT"); 
    add.run("cat-monitor", "Monitor", "IT"); 
    add.run("cat-mobile", "Mobile", "IT"); 
    add.run("cat-headphone", "Headphone", "IT");
    add.run("cat-accessory", "Accessory", "IT");
    add.run("cat-printer", "Printer", "IT");
    add.run("cat-furniture", "Furniture", "Non-IT");
    add.run("cat-projector", "Projector", "Non-IT");
    add.run("cat-server", "Server", "IT");
  }
  if (db.prepare("SELECT COUNT(*) AS n FROM brands").get().n === 0) {
    const add = db.prepare("INSERT INTO brands (id,name) VALUES (?,?)");
    add.run(id(), "Apple"); add.run(id(), "Dell"); add.run(id(), "Lenovo"); add.run(id(), "HP"); add.run(id(), "Bose"); add.run(id(), "Logitech"); add.run(id(), "Steelcase"); add.run(id(), "Epson");
  }
  if (db.prepare("SELECT COUNT(*) AS n FROM vendors").get().n === 0) {
    const add = db.prepare("INSERT INTO vendors (id,name,address,pincode,gstin,description) VALUES (?,?,?,?,?,?)");
    add.run("vendor-apple", "Apple Enterprise India", "Bengaluru Tech Park", "560001", "GST-APPLE-001", "Corporate hardware supply");
    add.run("vendor-01", "Local Technology Supplies", "Coimbatore IT Park", "641001", "33AABCL1234F1Z5", "Enterprise IT and hardware supplier");
    add.run("vendor-office", "Office Systems Partners", "Coimbatore Commercial Suite", "641018", "GST-OFFICE-003", "Print and meeting-room equipment");
    add.run("vendor-workplace", "Workplace Essentials", "Chennai Industrial Estate", "600018", "GST-WORK-002", "Furniture and facilities supplier");
  }
  if (db.prepare("SELECT COUNT(*) AS n FROM assets").get().n < 6) {
    const addAsset = db.prepare("INSERT OR REPLACE INTO assets (id,asset_name,description,tag_id,category,brand,model,serial_no,location,site,cost,status,assigned_to,purchased_date,expire_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    addAsset.run("demo-ast-001", 'MacBook Pro 16"', "M2 Max, 32GB RAM", "AST-001", "Laptop", "Apple", 'MacBook Pro 16"', "C02G40L3MD6R", "HQ - Floor 3", "Coimbatore HQ", 2499, "Assigned", "emp-john", "2023-01-15", "2026-01-15", now());
    addAsset.run("demo-ast-002", "Dell XPS 15", "Intel i9, 32GB RAM", "AST-002", "Laptop", "Dell", "XPS 15 9520", "DLXPS15-992", "Chennai Office - Floor 2", "Chennai Branch", 1999, "Assigned", "emp-sarah", "2023-03-22", "2026-03-22", now());
    addAsset.run("demo-ast-003", "iPhone 13 Pro", "256GB Sierra Blue", "AST-003", "Mobile", "Apple", "iPhone 13 Pro", "F2LZ79010D9", "Hyderabad Hub - Floor 1", "Hyderabad Branch", 1099, "Reserved", null, "2023-01-10", "2025-01-10", now());
    addAsset.run("demo-ast-004", "Dell U2720Q Monitor", "4K UHD IPS USB-C", "AST-004", "Monitor", "Dell", "U2720Q", "CN049182749", "HQ - Floor 1", "Coimbatore HQ", 650, "Assigned", "emp-emily", "2022-11-05", "2025-11-05", now());
    addAsset.run("demo-ast-005", "Bose QuietComfort 45", "Noise Cancelling Headphones", "AST-005", "Headphone", "Bose", "QC45", "BSQC45-8831", "Storage Room B", "Bangalore Tech Hub", 329, "In Stock", null, "2023-06-18", "2025-06-18", now());
    addAsset.run("demo-ast-006", "HP LaserJet Pro", "Multi-function Office Printer", "AST-006", "Printer", "HP", "M428fdw", "HPPRNT-4402", "HQ - Floor 2", "Chennai Branch", 450, "Under Maintenance", null, "2022-09-30", "2024-09-30", now());
    addAsset.run("demo-ast-007", "ThinkPad X1 Carbon Gen 11", "Intel Core i7 13th Gen, 32GB RAM, 1TB SSD", "AST-007", "Laptop", "Lenovo", "X1 Carbon Gen 11", "LN-X1C-9921", "IT Staging Room", "Bangalore Tech Hub", 1850, "In Stock", null, "2024-01-12", "2027-01-12", now());
    addAsset.run("demo-ast-008", "Apple Studio Display 27\"", "5K Retina Display with Center Stage", "AST-008", "Monitor", "Apple", "Studio Display", "AP-SD-5541", "Hyderabad Design Suite", "Hyderabad Branch", 1599, "In Stock", null, "2023-08-20", "2026-08-20", now());
    addAsset.run("demo-ast-009", "Logitech MX Master 3S Combo", "Ergonomic Performance Keyboard and Mouse", "AST-009", "Accessory", "Logitech", "MX Keys + Master 3S", "LG-MX-8832", "IT Storage Shelf A", "Coimbatore HQ", 220, "In Stock", null, "2024-02-01", "2026-02-01", now());
    addAsset.run("demo-ast-010", "Samsung Galaxy S24 Ultra", "512GB Titanium Grey Enterprise Edition", "AST-010", "Mobile", "Samsung", "S24 Ultra", "SM-S928B-01", "Device Locker 3", "Bangalore Tech Hub", 1299, "In Stock", null, "2024-03-10", "2026-03-10", now());
    addAsset.run("demo-nonit-001", "Steelcase Gesture Ergonomic Chair", "3D liveback lumbar support, headrest", "QNonIT-000001", "Furniture", "Steelcase", "Gesture 3D", "SC-GEST-01", "Engineering Bay Floor 3", "Coimbatore HQ", 950, "In Stock", null, "2023-04-15", "2028-04-15", now());
    addAsset.run("demo-nonit-002", "Herman Miller Aeron Chair", "Mineral Mesh, PostureFit SL, Size B", "QNonIT-000002", "Furniture", "Herman Miller", "Aeron Remastered", "HM-AER-02", "Product Suite Floor 2", "Chennai Branch", 1395, "Assigned", "emp-sarah", "2023-05-10", "2028-05-10", now());
    addAsset.run("demo-nonit-003", "Epson PowerLite Conference Projector", "6000 lumens laser, WUXGA wireless", "QNonIT-000003", "Projector", "Epson", "EB-L630U", "EP-PRJ-03", "Boardroom Alpha", "Bangalore Tech Hub", 2400, "In Stock", null, "2023-09-01", "2027-09-01", now());
  }
  if (db.prepare("SELECT COUNT(*) AS n FROM requests").get().n === 0) {
    const addReq = db.prepare("INSERT INTO requests (id,request_number,type,requested_by,category,description,status,created_at) VALUES (?,?,?,?,?,?,?,?)");
    addReq.run("req-miracle-01", "REQ-2026-101", "Asset", "emp-john", "Laptop", "Laptop i5 - 16gb ram", "Pending", now());
    addReq.run("req-tatiana-02", "REQ-2026-102", "Asset", "emp-sarah", "Headphone", "Headphone", "Pending", now());
    addReq.run("req-alfonso-03", "REQ-2026-103", "Asset", "emp-emily", "Laptop", "Laptop i5 - 16gb ram", "Pending", now());
  }
}
seed();

function assetRow(row) {
  if (!row) return null;
  const assigned = row.assigned_to ? db.prepare("SELECT * FROM employees WHERE id=?").get(row.assigned_to) : null;
  const vendor = row.vendor_id ? db.prepare("SELECT name FROM vendors WHERE id=?").get(row.vendor_id) : null;
  return {
    ID: row.id, AssetName: row.asset_name, Description: row.description, AssetTagID: row.tag_id,
    IsAssigned: row.status === "Assigned", PurchasedDate: row.purchased_date, Brand: row.brand, BrandName: row.brand,
    Cost: row.cost, Model: row.model, SerialNo: row.serial_no, Location: row.location, LocationName: row.location,
    Category: row.category, Site: row.site || "Coimbatore HQ", Branch: row.site || "Coimbatore HQ", AssetPhotoURL: [], ExpireDate: row.expire_date, VendorID: row.vendor_id,
    VendorName: vendor?.name || null, SupportDocsURL: [], Status: row.status, CreatedAt: row.created_at, CreatedBy: "local-admin",
    ModifiedAt: null, ModifiedBy: null, AssignedToUserID: row.assigned_to, AssignedToName: assigned?.display_name || null,
    AssignedToDepartment: assigned?.department || null, LostByUserID: null, LostByName: null, LostRequestNumber: null,
  };
}
function employeeRow(row) {
  if (!row) return null;
  return { ID: row.id, DisplayName: row.display_name, Mail: row.email, EmployeeId: row.employee_id, JobTitle: row.job_title, Department: row.department, AssetRole: row.role, AssetRoleName: row.role, Branch: row.branch || "Coimbatore HQ" };
}
function requestRow(row) {
  if (!row) return null;
  const requester = row.requested_by ? db.prepare("SELECT * FROM employees WHERE id=?").get(row.requested_by) : null;
  const manager = requester?.department ? db.prepare("SELECT * FROM employees WHERE department=? AND role='Manager' ORDER BY display_name LIMIT 1").get(requester.department) : null;
  const category = row.category ? db.prepare("SELECT * FROM categories WHERE name=? LIMIT 1").get(row.category) : null;
  const status = String(row.status || "Pending");
  const statusMap = {
    "Manager Pending": { manager: "Pending", admin: "Pending", overall: "ManagerPending" },
    "Manager Rejected": { manager: "Rejected", admin: "Pending", overall: "ManagerRejected" },
    "Manager Reprogress": { manager: "Re-Progress", admin: "Pending", overall: "ManagerReprogress" },
    "Admin Pending": { manager: "Approved", admin: "Pending", overall: "AdminApprovalPending" },
    "Admin Approved": { manager: "Approved", admin: "Approved", overall: "AdminApproved" },
    "Admin Rejected": { manager: "Approved", admin: "Rejected", overall: "AdminRejected" },
    "Admin Reprogress": { manager: "Approved", admin: "Re-Progress", overall: "AdminReprogress" },
  };
  const mapped = statusMap[status] || (row.type === "Asset" ? { manager: "Pending", admin: "Pending", overall: "ManagerPending" } : null);
  const managerStatus = mapped?.manager || (status === "Approved" || status === "Completed" ? "Approved" : status === "Rejected" ? "Rejected" : "Pending");
  const adminStatus = mapped?.admin || (status === "Approved" || status === "Completed" ? "Approved" : status === "Rejected" ? "Rejected" : "Pending");
  const overallStatus = mapped?.overall || (row.type === "Asset" ? "ManagerPending" : status);
  const common = {
    ID: row.id, RequestNumber: row.request_number, RequestType: row.type, ReqType: row.type,
    RequestedByUserID: row.requested_by, RequestedByID: row.requested_by, RequestedByName: requester?.display_name || null,
    RequestedByMail: requester?.email || null, RequestedByEmail: requester?.email || null, RequestedByJobTitle: requester?.job_title || null,
    RequestedByDepartment: requester?.department || null, Category: row.category, CategoryID: category?.id || null,
    CategoryName: row.category, AssetType: row.category, PurposeOfRequest: row.description || "", Description: row.description,
    ReqStatus: row.status, Status: row.status, CreatedAt: row.created_at, RequestedAt: row.created_at, RequestedDate: row.created_at,
    CreatedBy: row.requested_by, ModifiedAt: null, ModifiedBy: row.action_by || null,
    ManagerID: manager?.id || null, ManagerName: manager?.display_name || null, ManagerEmail: manager?.email || null,
    AssignedManagerID: manager?.id || null, AssignedManagerName: manager?.display_name || null, AssignedManagerMail: manager?.email || null,
    ManagerApprovalStatus: managerStatus, AdminApprovalStatus: adminStatus, OverallStatus: overallStatus,
    ManagerApprovedDate: managerStatus === "Approved" ? row.created_at : null, AdminApprovedDate: adminStatus === "Approved" ? row.created_at : null,
    AssignedAdminID: row.action_by || "local-admin", AssignedAdminName: row.action_by ? (db.prepare("SELECT display_name FROM employees WHERE id=?").get(row.action_by)?.display_name || null) : "Local Asset Administrator",
    AssignedAdminMailID: "local.admin@localhost", ApprovedAdminID: adminStatus === "Approved" ? "local-admin" : null,
    ApprovedAdminName: adminStatus === "Approved" ? "Local Asset Administrator" : null, IsAdminOverride: false,
  };
  if (row.type === "Repair") {
    const asset = requester ? db.prepare("SELECT * FROM assets WHERE assigned_to=? ORDER BY created_at DESC LIMIT 1").get(row.requested_by) : null;
    return { ...common, AssetID: asset?.id || null, AssetName: asset?.asset_name || row.category || "Asset", AssetTagID: asset?.tag_id || null, IssueType: "Hardware fault", ProblemCategory: row.category || "General", Problem: row.description || "Repair required", AttachmentURL: [], RequestStatus: status === "Approved" ? "Approved" : status === "Rejected" ? "Rejected" : "Pending", AdminRejectionReason: null, ApprovedAdminID: status === "Approved" ? "local-admin" : null, ApprovedAdminName: status === "Approved" ? "Local Asset Administrator" : null, ApprovedDate: status === "Approved" ? row.created_at : null, ReplacementRequestID: null, ReplacementRequestNumber: null };
  }
  if (row.type === "Upgrade") return { ...common, ComponentName: "Hardware", ComponentDisplayName: "Hardware", CurrentSpecification: "Current configuration", RequiredSpecfication: "Improved configuration", ReasonForUpgrade: row.description, ReqStatus: status === "Approved" ? "Completed" : status === "Rejected" ? "Rejected" : status === "Pending" ? "Pending" : status };
  if (row.type === "HR") return { ...common, HRRequestID: row.request_number, RequestedUserName: requester?.display_name || null, RequestedUserMailID: requester?.email || null, AssignedAdminID: "local-admin", AssignedAdminName: "Local Asset Administrator", AssignedAdminMailID: "local.admin@localhost", ApplicantCount: 1, Status: status === "Pending" ? "Pending" : status };
  if (row.type === "Handover") return { ...common, HandoverRequestID: row.request_number, RequestedUserName: requester?.display_name || null, RequestedUserMailID: requester?.email || null, Reason: row.category || "Other", AdditionalNotes: row.description, ItemCount: requester ? db.prepare("SELECT COUNT(*) AS n FROM assets WHERE assigned_to=?").get(row.requested_by).n : 0, ActionedItemCount: 0 };
  if (row.type === "Lost") return { ...common, EmployeeUserID: row.requested_by, EmployeeName: requester?.display_name || null, EmployeeMail: requester?.email || null, ReportedByUserID: row.requested_by, ReportedByName: requester?.display_name || null, ReportedByMail: requester?.email || null, ReportedByRole: "Employee", LostDate: row.created_at, HowLost: row.category || "Unknown", AdditionalDetails: row.description, ManagerApprovalStatus: "Pending", RequestStatus: status === "Pending" ? "Pending" : status === "Approved" ? "Completed" : "InProgress", ItemCount: 1, PendingItemCount: 1 };
  return common;
}
function nextTag() {
  const row = db.prepare("SELECT tag_id FROM assets WHERE tag_id LIKE 'AST%' ORDER BY CAST(SUBSTR(tag_id,4) AS INTEGER) DESC LIMIT 1").get();
  return `AST${String((row ? Number(row.tag_id.slice(3)) : 0) + 1).padStart(5, "0")}`;
}
function createRequest(type, payload) {
  const requestId = id();
  const number = `${type.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  db.prepare("INSERT INTO requests (id,request_number,type,requested_by,category,description,status,created_at) VALUES (?,?,?,?,?,?,?,?)").run(requestId, number, type, requestUser({ body: () => payload }), payload.category || payload.Category || null, payload.description || payload.Description || null, "Pending", now());
  db.prepare("INSERT INTO activity (id,title,detail,created_at) VALUES (?,?,?,?)").run(id(), `${type} request created`, number, now());
  return requestRow(db.prepare("SELECT * FROM requests WHERE id=?").get(requestId));
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => { req.localUser = "local-admin"; next(); });

app.get("/health", (_req, res) => json(res, { service: "asset-management-local-api", database: "sqlite", login: "local", status: "ok" }));
app.get("/api/local-profile", (_req, res) => json(res, employeeRow(db.prepare("SELECT * FROM employees WHERE id='local-admin'").get())));

// Inventory and asset master data
app.get("/asset/inventory", (req, res) => {
  const q = String(req.query.search || "").trim();
  const rows = q ? db.prepare("SELECT * FROM assets WHERE asset_name LIKE ? OR tag_id LIKE ? OR serial_no LIKE ? ORDER BY created_at DESC").all(`%${q}%`, `%${q}%`, `%${q}%`) : db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all();
  json(res, rows.map(assetRow));
});
app.get("/asset/all", (_req, res) => json(res, db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all().map(assetRow)));
app.get("/asset/inventory/stats", (_req, res) => {
  const rows = db.prepare("SELECT status,COUNT(*) n FROM assets GROUP BY status").all();
  const map = Object.fromEntries(rows.map(r => [r.status, r.n]));
  json(res, { TotalCount: rows.reduce((n, r) => n + r.n, 0), InStockCount: map["In Stock"] || 0, AssignedCount: map.Assigned || 0, UnderMaintenanceCount: map["Under Maintenance"] || 0, EndOfUseCount: map["End of Use"] || 0, ReservedCount: map.Reserved || 0 });
});
app.get("/asset/inventory/next-tag-id", (_req, res) => json(res, { nextTagId: nextTag() }));
app.get("/asset/inventory/:id", (req, res) => {
  let row = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  if (!row) {
    const rawId = req.params.id || "ast-01";
    const isMonitor = /monitor|screen|display/i.test(rawId);
    const isHeadphone = /head|audio|ear/i.test(rawId);
    const isChair = /chair|furniture/i.test(rawId);
    const name = isMonitor ? "Dell UltraSharp 27\" 4K Monitor" : isHeadphone ? "Jabra Evolve2 65 Headset" : isChair ? "Ergonomic Task Chair" : "Dell Latitude 5440";
    const cat = isMonitor ? "Monitor" : isHeadphone ? "Headphone" : isChair ? "Furniture" : "Laptop";
    row = {
      id: rawId,
      asset_name: name,
      description: "Standard corporate enterprise device",
      tag_id: rawId.startsWith("AST") ? rawId : `AST${rawId.replace(/\D/g, "").padStart(5, "0") || "00012"}`,
      category: cat,
      brand: isMonitor || !isHeadphone ? "Dell" : "Jabra",
      model: isMonitor ? "U2723QE 4K IPS" : isHeadphone ? "Evolve2 65 Wireless" : "Latitude 5440 i5/16GB",
      serial_no: `SN-${rawId.toUpperCase().slice(-8) || "99214"}`,
      location: "Coimbatore",
      site: "HQ",
      cost: isMonitor ? 35000 : isHeadphone ? 18000 : 65000,
      status: "Assigned",
      created_at: "2024-01-15T09:00:00.000Z",
      assigned_to: "emp-sarah",
      purchased_date: "2024-01-15T00:00:00.000Z",
      expire_date: "2027-01-15T00:00:00.000Z",
    };
  }
  json(res, assetRow(row));
});
app.get("/asset/inventory/:id/history", (req, res) => {
  const row = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  const assetId = row?.id || req.params.id;
  json(res, [
    { ID: `history-1-${assetId}`, AssetID: assetId, EventType: "Created", OldStatus: null, NewStatus: "In Stock", ReferenceType: "Procurement", PerformedBy: "local-admin", EventDate: "2024-01-15T09:00:00.000Z", CreatedAt: "2024-01-15T09:00:00.000Z" },
    { ID: `history-2-${assetId}`, AssetID: assetId, EventType: "StatusChange", OldStatus: "In Stock", NewStatus: "Assigned", ReferenceType: "Assignment", PerformedBy: "local-admin", EventDate: "2024-01-16T10:00:00.000Z", CreatedAt: "2024-01-16T10:00:00.000Z" }
  ]);
});
app.get("/asset/inventory/:id/assignments", (req, res) => {
  const row = db.prepare("SELECT a.*,e.display_name,e.email,e.department FROM assets a LEFT JOIN employees e ON e.id=a.assigned_to WHERE a.id=?").get(req.params.id);
  if (!row?.assigned_to) return json(res, []);
  json(res, [{ ID: `assignment-${row.id}`, UserID: row.assigned_to, DisplayName: row.display_name, Department: row.department, Mail: row.email, AssetID: row.id, AssignedAt: row.created_at, CheckoutAt: null, AssignedBy: "local-admin" }]);
});
app.get("/asset/inventory/:id/component-specs", (_req, res) => json(res, []));
app.get("/asset/requests/:id/component-specs", (_req, res) => json(res, []));
app.post("/asset/inventory", (req, res) => {
  const p = body(req); const assetId = id(); const tag = nextTag();
  db.prepare("INSERT INTO assets (id,asset_name,description,tag_id,category,brand,model,serial_no,location,site,purchased_date,expire_date,cost,vendor_id,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(assetId, p.AssetName || p.assetName || "Unnamed asset", p.Description || null, tag, p.Category || p.category || "Other", p.Brand || null, p.Model || null, p.SerialNo || null, p.Location || null, p.Site || null, p.PurchasedDate || null, p.ExpireDate || null, Number(p.Cost || 0), p.VendorID || null, p.Status || "In Stock", now());
  json(res, assetRow(db.prepare("SELECT * FROM assets WHERE id=?").get(assetId)), 201);
});
app.put("/asset/inventory/:id", (req, res) => { const p = body(req); db.prepare("UPDATE assets SET asset_name=COALESCE(?,asset_name),description=COALESCE(?,description),category=COALESCE(?,category),brand=COALESCE(?,brand),model=COALESCE(?,model),serial_no=COALESCE(?,serial_no),location=COALESCE(?,location),site=COALESCE(?,site),cost=COALESCE(?,cost),status=COALESCE(?,status) WHERE id=?").run(p.AssetName, p.Description, p.Category, p.Brand, p.Model, p.SerialNo, p.Location, p.Site, p.Cost === undefined ? null : Number(p.Cost), p.Status, req.params.id); json(res, assetRow(db.prepare("SELECT * FROM assets WHERE id=?").get(req.params.id))); });
app.delete("/asset/inventory/:id", (req, res) => { db.prepare("DELETE FROM assets WHERE id=?").run(req.params.id); json(res, null, 200, "Asset deleted"); });
app.post("/asset/inventory/bulk", (req, res) => { const p = body(req); const quantity = Math.max(1, Number(p.quantity || p.Quantity || 1)); const rows=[]; for(let i=0;i<quantity;i++){ const assetId=id(); db.prepare("INSERT INTO assets (id,asset_name,tag_id,category,status,created_at) VALUES (?,?,?,?,?,?)").run(assetId,p.AssetName || "New asset",nextTag(),p.Category || "Other",p.Status || "In Stock",now()); rows.push({ID:assetId,AssetTagID:assetRow(db.prepare("SELECT * FROM assets WHERE id=?").get(assetId)).AssetTagID}); } json(res, rows, 201); });
app.post("/asset/inventory/:id/assign", (req, res) => {
  const p = body(req);
  const targetUser = p.employeeId || p.userId || p.UserID || p.assignedToUserId || "local-employee";
  const emp = db.prepare("SELECT * FROM employees WHERE id=? OR employee_id=?").get(targetUser, targetUser);
  const asset = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  if (asset) {
    db.prepare("UPDATE assets SET assigned_to=?, status='Assigned' WHERE id=?").run(emp?.id || targetUser, asset.id);
    db.prepare("INSERT INTO activity (id, title, detail, created_at) VALUES (?, ?, ?, ?)").run(
      id(),
      "Asset Assigned",
      `Asset ${asset.tag_id} (${asset.asset_name}) assigned to ${emp?.display_name || targetUser}${p.notes ? ` - ${p.notes}` : ""}`,
      now()
    );
  }
  const updated = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  json(res, assetRow(updated));
});
app.post("/asset/inventory/:id/return", (req, res) => {
  const asset = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  if (asset) {
    const prevAssignee = asset.assigned_to ? db.prepare("SELECT display_name FROM employees WHERE id=?").get(asset.assigned_to)?.display_name : null;
    db.prepare("UPDATE assets SET assigned_to=NULL, status='In Stock' WHERE id=?").run(asset.id);
    db.prepare("INSERT INTO activity (id, title, detail, created_at) VALUES (?, ?, ?, ?)").run(
      id(),
      "Asset Returned",
      `Asset ${asset.tag_id} (${asset.asset_name}) returned to In Stock${prevAssignee ? ` from ${prevAssignee}` : ""}`,
      now()
    );
  }
  const updated = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  json(res, assetRow(updated));
});

// Non-IT assets share the same local asset store, but expose the richer
// location/AMC/value shape expected by the dedicated Non-IT screens.
function nonITRow(row) {
  if (!row) return null;
  const category = row.category_id ? db.prepare("SELECT * FROM categories WHERE id=?").get(row.category_id) : db.prepare("SELECT * FROM categories WHERE name=? AND type='Non-IT' LIMIT 1").get(row.category);
  const vendor = row.vendor_id ? db.prepare("SELECT name FROM vendors WHERE id=?").get(row.vendor_id) : null;
  return { ID: row.id, AssetTag: row.tag_id, AssetCategoryID: category?.id || row.category_id || null, CategoryName: category?.name || row.category, Location: row.location, LocationName: row.location, Floor: null, VendorID: row.vendor_id, VendorName: vendor?.name || null, Status: row.status, AMCExpiryDate: row.expire_date, Value: row.cost, Attachments: [], FieldValues: [], CreatedAt: row.created_at, CreatedBy: "local-admin", ModifiedAt: null, ModifiedBy: null };
}
app.get("/asset/non-it-assets", (req,res)=>{
  const categoryId=String(req.query.categoryId||"").trim();
  const rows=db.prepare("SELECT a.* FROM assets a LEFT JOIN categories c ON c.id=a.category_id WHERE COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='Non-IT' ORDER BY a.created_at DESC").all();
  json(res,rows.map(nonITRow).filter(r=>!categoryId||r.AssetCategoryID===categoryId));
});
app.get("/asset/non-it-assets/next-tag-preview", (_req,res)=>{
  const row=db.prepare("SELECT tag_id FROM assets WHERE tag_id LIKE 'QNonIT-%' ORDER BY tag_id DESC LIMIT 1").get();
  const n=row ? Number(String(row.tag_id).split('-')[1])+1 : 1;
  json(res,{nextTagId:`QNonIT-${String(n).padStart(6,'0')}`});
});
app.get("/asset/non-it-assets/:id/history", (req,res)=>{
  const row=db.prepare("SELECT * FROM assets WHERE id=?").get(req.params.id);
  json(res,row?[{ID:`nonit-history-${row.id}`,NonITRequestID:row.id,EventType:"Created",OldStatus:null,NewStatus:row.status,PerformedBy:"local-admin",EventDate:row.created_at,CreatedAt:row.created_at}]:[]);
});
app.get("/asset/non-it-assets/:id", (req, res) => {
  let row = db.prepare("SELECT * FROM assets WHERE id=? OR tag_id=?").get(req.params.id, req.params.id);
  if (!row) {
    const rawId = req.params.id || "nonit-01";
    const isPrinter = /printer/i.test(rawId);
    const isProjector = /projector/i.test(rawId);
    const name = isPrinter ? "HP LaserJet Pro Enterprise" : isProjector ? "Epson EB-E01 Projector" : "Ergonomic Task Chair High-Back";
    const cat = isPrinter ? "Printer" : isProjector ? "Projector" : "Furniture";
    row = {
      id: rawId,
      asset_name: name,
      description: "Non-IT physical operational asset",
      tag_id: rawId.startsWith("QNonIT") ? rawId : `QNonIT-${rawId.replace(/\D/g, "").padStart(6, "0") || "000101"}`,
      category: cat,
      category_id: "furniture-cat-01",
      brand: isPrinter ? "HP" : isProjector ? "Epson" : "Steelcase",
      model: isPrinter ? "LaserJet Enterprise M406dn" : isProjector ? "EB-E01 XGA" : "Series 1 Mesh",
      serial_no: `SN-NONIT-${rawId.toUpperCase().slice(-6) || "5521"}`,
      location: "Coimbatore HQ - Floor 2",
      site: "HQ",
      cost: isPrinter ? 28000 : isProjector ? 42000 : 14500,
      status: isPrinter ? "Under Maintenance" : "In Stock",
      created_at: "2024-02-10T10:00:00.000Z",
      assigned_to: null,
      purchased_date: "2024-02-10T00:00:00.000Z",
      expire_date: "2027-02-10T00:00:00.000Z",
    };
  }
  json(res, nonITRow(row));
});
app.post("/asset/non-it-assets", (req,res)=>{
  const p=body(req); const category=db.prepare("SELECT * FROM categories WHERE id=? AND type='Non-IT'").get(p.AssetCategoryID);
  if(!category) return error(res,"A valid Non-IT category is required");
  const assetId=id(); const tag=nextTag();
  db.prepare("INSERT INTO assets (id,asset_name,description,tag_id,category,category_id,location,expire_date,cost,vendor_id,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(assetId,p.AssetTag||category.name,category.name,tag,category.name,category.id,p.Location||null,p.AMCExpiryDate||null,Number(p.Value||0),p.VendorID||null,p.Status||"In Stock",now());
  json(res,nonITRow(db.prepare("SELECT * FROM assets WHERE id=?").get(assetId)),201);
});
app.put("/asset/non-it-assets/:id", (req,res)=>{
  const p=body(req); const category=p.AssetCategoryID?db.prepare("SELECT * FROM categories WHERE id=? AND type='Non-IT'").get(p.AssetCategoryID):null;
  db.prepare("UPDATE assets SET category=COALESCE(?,category),category_id=COALESCE(?,category_id),location=COALESCE(?,location),expire_date=COALESCE(?,expire_date),cost=COALESCE(?,cost),vendor_id=COALESCE(?,vendor_id),status=COALESCE(?,status) WHERE id=?").run(category?.name||null,category?.id||null,p.Location,p.AMCExpiryDate,p.Value===undefined?null:Number(p.Value),p.VendorID,p.Status,req.params.id);
  json(res,nonITRow(db.prepare("SELECT * FROM assets WHERE id=?").get(req.params.id)));
});
app.delete("/asset/non-it-assets/:id", (req,res)=>{db.prepare("DELETE FROM assets WHERE id=?").run(req.params.id);json(res,null,200,"Non-IT asset deleted")});

const master = {
  brands: ["id", "name"], vendors: ["id", "name"], categories: ["id", "name"],
};
app.get("/asset/masters/:kind", (req, res) => {
  const kind=req.params.kind;
  if(kind === "category-components") return json(res, db.prepare("SELECT id AS ID,category_id AS CategoryID,component_name AS ComponentName FROM category_components WHERE active=1 ORDER BY component_name").all());
  if(kind === "non-it-fields" || kind === "repair-issue-types" || kind === "repair-problem-categories") return json(res, []);
  const cfg=master[kind]; if(!cfg) return json(res, []);
  const table=kind;
  const rows = table === "categories" && req.query.type
    ? db.prepare("SELECT * FROM categories WHERE active=1 AND type=? ORDER BY name").all(String(req.query.type))
    : db.prepare(`SELECT * FROM ${table} WHERE active=1 ORDER BY name`).all();
  json(res, rows.map(r => kind === "brands" ? {ID:r.id,BrandName:r.name,CategoryID:r.category_id} : kind === "vendors" ? {ID:r.id,VendorName:r.name,VendorAddress:r.address,Pincode:r.pincode,GSTIN:r.gstin,Description:r.description} : {ID:r.id,CategoryName:r.name,CategoryType:r.type}));
});
app.post("/asset/masters/:kind", (req,res)=>{ const p=body(req), kind=req.params.kind; if(kind === "category-components") { const ids=Array.isArray(p.CategoryIDs)?p.CategoryIDs:[p.CategoryID]; const out=[]; for(const c of ids){const i=id();db.prepare("INSERT INTO category_components (id,category_id,component_name) VALUES (?,?,?)").run(i,c,p.ComponentName);out.push({ID:i,CategoryID:c,ComponentName:p.ComponentName});} return json(res,out,201); } if(!master[kind]) return json(res,p,201); const i=id(); if(kind==='brands')db.prepare("INSERT INTO brands (id,name,category_id) VALUES (?,?,?)").run(i,p.BrandName,p.CategoryID||null); else if(kind==='vendors')db.prepare("INSERT INTO vendors (id,name,address,pincode,gstin,description) VALUES (?,?,?,?,?,?)").run(i,p.VendorName,p.VendorAddress||null,p.Pincode||null,p.GSTIN||null,p.Description||null); else db.prepare("INSERT INTO categories (id,name,type) VALUES (?,?,?)").run(i,p.CategoryName,p.CategoryType||'IT'); json(res,{ID:i,...p},201); });
app.put("/asset/masters/:kind/:id", (req,res)=>{ const p=body(req),k=req.params.kind; if(k==='brands')db.prepare("UPDATE brands SET name=COALESCE(?,name),category_id=COALESCE(?,category_id) WHERE id=?").run(p.BrandName,p.CategoryID,req.params.id); else if(k==='vendors')db.prepare("UPDATE vendors SET name=COALESCE(?,name),address=COALESCE(?,address),pincode=COALESCE(?,pincode),gstin=COALESCE(?,gstin),description=COALESCE(?,description) WHERE id=?").run(p.VendorName,p.VendorAddress,p.Pincode,p.GSTIN,p.Description,req.params.id); else if(k==='categories')db.prepare("UPDATE categories SET name=COALESCE(?,name),type=COALESCE(?,type) WHERE id=?").run(p.CategoryName,p.CategoryType,req.params.id); json(res,{ID:req.params.id,...p}); });
app.delete("/asset/masters/:kind/:id", (req,res)=>{ const table=master[req.params.kind]?.[0] === 'id' ? req.params.kind : null; if(table)db.prepare(`UPDATE ${table} SET active=0 WHERE id=?`).run(req.params.id); json(res,null,200,"Deleted"); });

// Requests use one local workflow table; the UI retains its existing request panels and statuses.
function requestCollection(type) {
  return {
    list: (req,res) => {
      let rows=db.prepare("SELECT * FROM requests WHERE type=? ORDER BY created_at DESC").all(type);
      const userId=String(req.query.userId||"").trim();
      const managerId=String(req.query.managerId||"").trim();
      const adminId=String(req.query.adminId||"").trim();
      if(userId) rows=rows.filter(r=>r.requested_by===userId);
      if(managerId) rows=rows.filter(r=>["Pending","Manager Pending","Manager Reprogress"].includes(r.status));
      if(adminId) rows=rows.filter(r=>["Admin Pending","Admin Reprogress","Pending","InProgress"].includes(r.status));
      json(res, rows.map(requestRow));
    },
    detail: (req,res) => json(res, requestRow(db.prepare("SELECT * FROM requests WHERE id=?").get(req.params.id))),
    action: (req,res) => { 
      const p=body(req); 
      const rawStatus=p.action || p.Action || p.status || p.Status || "Approved"; 
      const isAdmin = req.path.includes("admin");
      const status = rawStatus === "Approve" 
        ? (isAdmin ? "Admin Approved" : "Admin Pending") 
        : rawStatus === "Reject" 
        ? (isAdmin ? "Admin Rejected" : "Manager Rejected") 
        : rawStatus; 
      db.prepare("UPDATE requests SET status=?,action_by=? WHERE id=?").run(status,requestUser(req),req.params.id); 
      const row = db.prepare("SELECT * FROM requests WHERE id=?").get(req.params.id);
      const assignedAssetId = p.assignedAssetId || p.AssignedAssetID || p.assetId || p.AssetID;
      if (assignedAssetId && row?.requested_by) {
        db.prepare("UPDATE assets SET assigned_to=?,status='Assigned' WHERE id=? OR tag_id=?").run(row.requested_by, assignedAssetId, assignedAssetId);
      }
      return json(res, row ? requestRow(row) : { id: req.params.id, status }); 
    },
    create: (req, res) => {
      const p = body(req);
      const created = createRequest(type, p);
      return json(res, created, 201);
    },
  };
}

// These collection-level routes must be registered before the generic
// /:id handlers below, otherwise Express treats the descriptive path segment
// as a request ID and returns the wrong shape to the client.
app.get("/asset/requests/lookup/available-assets", (_req,res)=>json(res,db.prepare("SELECT id AS ID,asset_name AS AssetName,tag_id AS AssetTagID,serial_no AS SerialNo,model AS Model FROM assets WHERE status='In Stock' ORDER BY asset_name").all()));
app.get("/asset/hr-requests/category-summary", (_req,res)=>{
  const rows=db.prepare("SELECT category, status, COUNT(*) AS n FROM requests WHERE type='HR' GROUP BY category,status").all();
  const names=[...new Set(rows.map(r=>r.category).filter(Boolean))];
  json(res,names.map(name=>{const of=rows.filter(r=>r.category===name);return {CategoryName:name,PendingCount:of.filter(r=>r.status==='Pending').reduce((s,r)=>s+r.n,0),CompletedCount:of.filter(r=>r.status==='Completed').reduce((s,r)=>s+r.n,0),RejectedCount:of.filter(r=>r.status==='Rejected').reduce((s,r)=>s+r.n,0),TotalCount:of.reduce((s,r)=>s+r.n,0)}}));
});
app.get("/asset/hr-requests/eligible-applicants", (_req,res)=>json(res,db.prepare("SELECT id AS ApplicantID,display_name AS ApplicantName,email AS ApplicantMailID,NULL AS JoiningDate,id AS AdUserId FROM employees WHERE active=1 ORDER BY display_name").all()));
app.get("/asset/hr-requests/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM requests WHERE (id=? OR request_number=?) AND type='HR'").get(req.params.id, req.params.id) 
    || db.prepare("SELECT * FROM requests WHERE id=? OR request_number=?").get(req.params.id, req.params.id)
    || db.prepare("SELECT * FROM requests WHERE type='HR' ORDER BY created_at DESC LIMIT 1").get();
  if (!row) return error(res, "HR request not found", 404);
  const base = requestRow(row);
  const applicants = [
    {
      ID: `applicant-${row.id}-1`,
      HRRequestID: row.request_number,
      ApplicantID: row.requested_by || "cand-001",
      ApplicantName: base.RequestedUserName || "Rahul Sharma",
      ApplicantMailID: base.RequestedUserMailID || "rahul.sharma@quadrasystems.net",
      JoiningDate: "2026-03-15",
      Status: base.Status || "Pending",
      CreatedAt: row.created_at,
      WorkEmail: base.RequestedUserMailID || null,
      ResolvedUserID: row.requested_by || null,
      HasEntraIdentity: true,
    }
  ];
  const items = [
    {
      ID: `item-${row.id}-1`,
      ApplicantAssetHRReqID: `applicant-${row.id}-1`,
      CategoryID: "a786ba8b-a9a3-461f-9d08-2ce76220fe37",
      CategoryName: row.category || "Laptop",
      ApprovedAdminID: "local-admin",
      ApprovedAdminName: "Local Asset Administrator",
      ApprovedAdminMailID: "local.admin@localhost",
      ApprovedDate: row.created_at,
      Status: "Approved",
    }
  ];
  json(res, { request: base, applicants, items, ...base });
});

for (const [pathName,type] of [["requests","Asset"],["hr-requests","HR"],["repair-requests","Repair"],["upgrade-requests","Upgrade"],["lost-requests","Lost"],["handover-requests","Handover"]]) {
  const c=requestCollection(type);
  app.get(`/asset/${pathName}`, c.list); app.post(`/asset/${pathName}`, c.create);
  if (pathName !== "hr-requests") app.get(`/asset/${pathName}/:id`, c.detail);
  app.post(`/asset/${pathName}/:id/manager-action`, c.action); app.post(`/asset/${pathName}/:id/admin-action`, c.action); app.post(`/asset/${pathName}/:id/manager-reprogress`, c.action); app.post(`/asset/${pathName}/:id/admin-reprogress`, c.action);
  app.post(`/asset/${pathName}/:id/attachments`, (_req,res)=>json(res,[])); app.get(`/asset/${pathName}/:id/reprogress`, (_req,res)=>json(res,[])); app.get(`/asset/${pathName}/:id/admin-reprogress`, (_req,res)=>json(res,[]));
}
app.get("/asset/requests/reprogress/:id/respond", (_req,res)=>json(res,[])); app.post("/asset/requests/reprogress/:id/respond", (_req,res)=>json(res,{})); app.post("/asset/requests/admin-reprogress/:id/respond", (_req,res)=>json(res,{}));

// Employees and related local lookup data
app.get("/asset/employees", (req,res)=>{
  let rows=db.prepare("SELECT * FROM employees WHERE active=1 ORDER BY display_name").all();
  const q=String(req.query.search||"").toLowerCase();
  const department=String(req.query.department||"").trim();
  if(q) rows=rows.filter(r=>(r.display_name+r.email+r.department+r.employee_id).toLowerCase().includes(q));
  if(department) rows=rows.filter(r=>r.department===department);
  const totalCount=db.prepare("SELECT COUNT(*) AS n FROM employees WHERE active=1").get().n;
  const page=Math.max(1,Number(req.query.page||1)); const limit=Math.max(1,Math.min(100,Number(req.query.limit||100)));
  const paged=rows.slice((page-1)*limit,page*limit);
  json(res,{users:paged.map(employeeRow),totalCount,filteredCount:rows.length,departments:[...new Set(rows.map(r=>r.department).filter(Boolean))].map(Department=>({Department,UserCount:rows.filter(r=>r.department===Department).length}))});
});
app.get("/asset/employees/:userId", (req,res)=>{
  const row = db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.userId)
    || db.prepare("SELECT * FROM employees WHERE employee_id=?").get(req.params.userId)
    || db.prepare("SELECT * FROM employees WHERE active=1 LIMIT 1").get();
  json(res, employeeRow(row));
});
app.get("/asset/employees/:userId/assets", (req,res)=>{
  let targetId = req.params.userId;
  const emp = db.prepare("SELECT id FROM employees WHERE id=?").get(targetId)
    || db.prepare("SELECT id FROM employees WHERE employee_id=?").get(targetId);
  if (emp) targetId = emp.id;
  json(res,db.prepare("SELECT a.id AS AssetID,a.id AS MappingID,a.asset_name AS AssetName,a.tag_id AS AssetTagID,a.category AS Category,a.serial_no AS SerialNo,a.model AS Model,a.description AS Description,a.status AS Status,a.created_at AS AssignedAt,a.location AS Location,a.site AS Branch,a.cost AS Value,a.expire_date AS AMCExpiryDate,a.vendor_id AS VendorID,(SELECT name FROM vendors v WHERE v.id=a.vendor_id) AS VendorName FROM assets a WHERE a.assigned_to=?").all(targetId));
});
app.get("/asset/employees/team/:managerId", (req,res)=>{
  const manager=db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.managerId);
  if(!manager) return json(res,[]);
  const members=db.prepare("SELECT e.*,COUNT(a.id) AS asset_count FROM employees e LEFT JOIN assets a ON a.assigned_to=e.id WHERE e.active=1 AND e.department=? AND e.id<>? GROUP BY e.id ORDER BY e.display_name").all(manager.department,manager.id);
  json(res,members.map(e=>({ID:e.id,DisplayName:e.display_name,Mail:e.email,JobTitle:e.job_title,Department:e.department,AssetCount:e.asset_count||0})));
});
app.get("/EntraADUsers", (_req,res)=>json(res,db.prepare("SELECT * FROM employees WHERE active=1").all().map(employeeRow)));
app.get("/department/:path", (_req,res)=>json(res,[])); app.get("/location/:path", (_req,res)=>json(res,[])); app.get("/location/app-locations", (_req,res)=>json(res,[{ID:"local-hq",Name:"Local HQ",LocationName:"Local HQ",Status:"active"}]));

app.get("/asset/admin-dashboard/recent-activities", (req,res)=>{
  const limit=Math.max(1,Math.min(20,Number(req.query.top||5)));
  const rows=db.prepare("SELECT id,title,detail,created_at FROM activity ORDER BY created_at DESC LIMIT ?").all(limit);
  json(res,rows.map(row=>({ID:row.id,ActivityType:/assign/i.test(row.title)?"Assigned":/approv/i.test(row.title)?"Approved":/reject/i.test(row.title)?"Rejected":/reprogress/i.test(row.title)?"Reprogress":/request/i.test(row.title)?"Requested":/add/i.test(row.title)?"Added":"Updated",Description:row.detail ? `${row.title}: ${row.detail}` : row.title,OccurredAt:row.created_at,Title:row.title,Detail:row.detail,CreatedAt:row.created_at})));
});
app.get("/asset/admin-dashboard", (_req,res)=>{
  const total=db.prepare("SELECT COUNT(*) AS n,COALESCE(SUM(cost),0) AS value FROM assets").get();
  json(res,{assetCount:total.n,totalAssetValue:total.value,assignedCount:db.prepare("SELECT COUNT(*) AS n FROM assets WHERE status='Assigned'").get().n,pendingRequestCount:db.prepare("SELECT COUNT(*) AS n FROM requests WHERE status LIKE '%Pending%'").get().n});
});
app.get("/asset/configuration", (_req,res)=>json(res,db.prepare("SELECT id AS ID,config_key AS ConfigKey,config_value AS ConfigValue FROM configuration ORDER BY config_key").all()));
app.put("/asset/configuration/:id", (req,res)=>{ const p=body(req); db.prepare("UPDATE configuration SET config_value=? WHERE id=?").run(p.ConfigValue||p.value||"",req.params.id); json(res,{ID:req.params.id,...p}); });
app.get("/asset/sla-configuration", (_req,res)=>json(res,db.prepare("SELECT id AS ID,category AS RequestTypeName,CASE WHEN priority='High' THEN 1 ELSE 1 END AS ManagerApproval,1 AS AdminApproval,CASE WHEN priority='High' THEN 1 ELSE 3 END AS ManagerApprovalDays,CASE WHEN priority='High' THEN 1 ELSE 3 END AS AdminApprovalDays,active AS IsActive,'local-admin' AS CreatedBy,NULL AS CreatedAt,NULL AS ModifiedBy,NULL AS ModifiedAt FROM sla WHERE active=1 ORDER BY category").all()));
app.post("/asset/sla-configuration", (req,res)=>{
  const p=body(req); const recordId=id();
  db.prepare("INSERT INTO sla (id,category,priority,hours,active) VALUES (?,?,?,?,1)").run(recordId,p.RequestTypeName||p.category||"Asset Request",(p.AdminApprovalDays||p.ManagerApprovalDays||3)<=1?"High":"Normal",Math.max(Number(p.AdminApprovalDays||p.ManagerApprovalDays||3)*24,1));
  json(res,{ID:recordId,RequestTypeName:p.RequestTypeName||"Asset Request",ManagerApproval:!!p.ManagerApproval,AdminApproval:!!p.AdminApproval,ManagerApprovalDays:Number(p.ManagerApprovalDays||0),AdminApprovalDays:Number(p.AdminApprovalDays||0),IsActive:true,CreatedBy:p.CreatedBy||"local-admin",CreatedAt:now(),ModifiedBy:null,ModifiedAt:null},201);
});
app.put("/asset/sla-configuration/:id", (req,res)=>{
  const p=body(req); const current=db.prepare("SELECT * FROM sla WHERE id=?").get(req.params.id);
  if(!current) return error(res,"SLA configuration not found",404);
  const hours=Math.max(Number(p.AdminApprovalDays||p.ManagerApprovalDays||Math.ceil(current.hours/24)||1)*24,1);
  db.prepare("UPDATE sla SET category=COALESCE(?,category),hours=COALESCE(?,hours),active=COALESCE(?,active) WHERE id=?").run(p.RequestTypeName||null,hours,p.IsActive===undefined?null:(p.IsActive?1:0),req.params.id);
  json(res,{ID:req.params.id,RequestTypeName:p.RequestTypeName||current.category,ManagerApproval:p.ManagerApproval===undefined?true:!!p.ManagerApproval,AdminApproval:p.AdminApproval===undefined?true:!!p.AdminApproval,ManagerApprovalDays:Number(p.ManagerApprovalDays||Math.ceil(current.hours/24)),AdminApprovalDays:Number(p.AdminApprovalDays||Math.ceil(current.hours/24)),IsActive:p.IsActive===undefined?!!current.active:!!p.IsActive,CreatedBy:"local-admin",CreatedAt:null,ModifiedBy:p.ModifiedBy||"local-admin",ModifiedAt:now()});
});
app.get("/asset/reports", (req,res)=>{
  const branch=String(req.query.branch||"").trim();
  const hasBranch = branch && branch !== "All" && branch !== "All Branches";
  const bFilter = hasBranch ? " AND COALESCE(site, location, 'Coimbatore HQ') LIKE '%' || ? || '%' " : "";
  const bParam = hasBranch ? [branch] : [];

  const total=db.prepare(`SELECT COUNT(*) n,COALESCE(SUM(cost),0) value FROM assets WHERE 1=1 ${bFilter}`).get(...bParam);
  const assigned=db.prepare(`SELECT COUNT(*) n FROM assets WHERE status='Assigned' ${bFilter}`).get(...bParam).n;
  const repair=db.prepare(`SELECT COUNT(*) n FROM assets WHERE status='Under Maintenance' ${bFilter}`).get(...bParam).n;
  const itCount=db.prepare(`SELECT COUNT(*) n FROM assets a LEFT JOIN categories c ON c.id=a.category_id WHERE COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='IT' ${hasBranch ? " AND COALESCE(a.site, a.location, 'Coimbatore HQ') LIKE '%' || ? || '%' " : ""}`).get(...bParam).n;
  const nonItCount=total.n-itCount;
  const monthlyPurchases=db.prepare(`SELECT substr(purchased_date,1,7) AS month, SUM(CASE WHEN COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='IT' THEN 1 ELSE 0 END) AS it_count, SUM(CASE WHEN COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='IT' THEN COALESCE(a.cost,0) ELSE 0 END) AS it_cost, SUM(CASE WHEN COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='Non-IT' THEN 1 ELSE 0 END) AS non_it_count, SUM(CASE WHEN COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='Non-IT' THEN COALESCE(a.cost,0) ELSE 0 END) AS non_it_value FROM assets a LEFT JOIN categories c ON c.id=a.category_id WHERE purchased_date IS NOT NULL ${hasBranch ? " AND COALESCE(a.site, a.location, 'Coimbatore HQ') LIKE '%' || ? || '%' " : ""} GROUP BY substr(purchased_date,1,7) ORDER BY month DESC LIMIT 12`).all(...bParam);
  const stockStatusSummary=db.prepare(`SELECT CASE WHEN COALESCE(c.type,CASE WHEN a.category='Furniture' THEN 'Non-IT' ELSE 'IT' END)='Non-IT' THEN 'Non-IT' ELSE 'IT' END AS asset_kind,a.category,COALESCE(a.site, a.location, 'Coimbatore HQ') AS branch,a.status,COUNT(*) AS asset_count,COALESCE(SUM(a.cost),0) AS total_cost FROM assets a LEFT JOIN categories c ON c.id=a.category_id WHERE 1=1 ${hasBranch ? " AND COALESCE(a.site, a.location, 'Coimbatore HQ') LIKE '%' || ? || '%' " : ""} GROUP BY asset_kind,a.category,branch,a.status ORDER BY asset_kind,a.category,branch,a.status`).all(...bParam);
  const assignmentByDepartment=db.prepare(`SELECT COALESCE(e.department,'Unassigned') AS department,COUNT(*) AS assigned_count FROM assets a LEFT JOIN employees e ON e.id=a.assigned_to WHERE a.status='Assigned' ${hasBranch ? " AND COALESCE(a.site, a.location, 'Coimbatore HQ') LIKE '%' || ? || '%' " : ""} GROUP BY COALESCE(e.department,'Unassigned') ORDER BY assigned_count DESC,department`).all(...bParam);
  const requestVolume={NewRequestCount:db.prepare("SELECT COUNT(*) n FROM requests WHERE type='Asset'").get().n,RepairRequestCount:db.prepare("SELECT COUNT(*) n FROM requests WHERE type='Repair'").get().n,UpgradeRequestCount:db.prepare("SELECT COUNT(*) n FROM requests WHERE type='Upgrade'").get().n,HRRequestCount:db.prepare("SELECT COUNT(*) n FROM requests WHERE type='HR'").get().n};
  const available=db.prepare(`SELECT COUNT(*) n FROM assets WHERE status IN ('In Stock','Reserved') ${bFilter}`).get(...bParam).n;
  const branchRows = db.prepare("SELECT COALESCE(site, location, 'Coimbatore HQ') AS branch, COUNT(*) AS total_assets, SUM(CASE WHEN status='Assigned' THEN 1 ELSE 0 END) AS assigned_assets, SUM(CASE WHEN status IN ('In Stock','Reserved') THEN 1 ELSE 0 END) AS unassigned_assets, SUM(CASE WHEN status='Under Maintenance' THEN 1 ELSE 0 END) AS maintenance_assets, ROUND(SUM(CASE WHEN status='Assigned' THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*), 1) AS utilization_rate FROM assets GROUP BY branch ORDER BY total_assets DESC").all();
  json(res,{kpi:{TotalAssetValue:total.value,AssetsAssignedCount:assigned,AvailableStockCount:available,UnderRepairCount:repair,TotalITAssetCount:itCount,TotalNonITAssetCount:nonItCount},monthlyPurchases:monthlyPurchases.map(r=>({MonthLabel:r.month,ITCount:r.it_count||0,ITCost:r.it_cost||0,NonITCount:r.non_it_count||0,NonITValue:r.non_it_value||0})),stockStatusSummary:stockStatusSummary.map(r=>({AssetKind:r.asset_kind,CategoryName:r.category,Branch:r.branch,Status:r.status,AssetCount:r.asset_count,TotalCost:r.total_cost})),assignmentByDepartment:assignmentByDepartment.map(r=>({Department:r.department,AssignedCount:r.assigned_count})),requestVolume,branchDistribution:branchRows});
});
app.get("/asset/reports/department-assignments", (req,res)=>{
  const department=String(req.query.department||"").trim();
  const branch=String(req.query.branch||"").trim();
  const hasBranch = branch && branch !== "All" && branch !== "All Branches";
  const rows=db.prepare(`SELECT e.id AS user_id,e.display_name,e.email,e.department,COALESCE(a.site, a.location, 'Coimbatore HQ') AS branch,a.id AS asset_id,a.asset_name,a.tag_id,a.category,a.status,a.created_at FROM assets a JOIN employees e ON e.id=a.assigned_to WHERE a.status='Assigned' AND (?='' OR e.department=?) ${hasBranch ? " AND COALESCE(a.site, a.location, 'Coimbatore HQ') LIKE '%' || ? || '%' " : ""} ORDER BY e.display_name,a.asset_name`).all(...(hasBranch ? [department, department, branch] : [department, department]));
  json(res,rows.map(r=>({UserID:r.user_id,DisplayName:r.display_name,Mail:r.email,Department:r.department,Branch:r.branch,AssetID:r.asset_id,AssetName:r.asset_name,AssetTagID:r.tag_id,Category:r.category,Status:r.status,AssignedAt:r.created_at})));
});

// Keep the specific role-template paths above the generic /:id route. Without
// this ordering Express treats "mismatches" and "category-usage" as IDs and
// returns an object where the React screens expect arrays/usage metadata.
app.get("/asset/role-templates/category-usage/:userId", (req,res)=>{
  // The local demo account is intentionally given a small, visible allowance
  // so the request flow can be exercised without a production role-template
  // store. Other users keep the real empty-state response.
  if (req.params.userId !== "local-admin") return json(res,{roleTemplateId:null,roleName:null,items:[]});
  const categories=db.prepare("SELECT id AS CategoryID,name AS CategoryName FROM categories WHERE type='IT' AND name IN ('Laptop','Monitor','Mobile Phone') ORDER BY name").all();
  json(res,{roleTemplateId:"demo-admin-role",roleName:"Administrator standard role",items:categories.map(c=>({CategoryID:c.CategoryID,CategoryName:c.CategoryName,RoleQuantity:2,HeldCount:0,PendingCount:0,Remaining:2}))});
});
app.get("/asset/role-templates/mismatches", (_req,res)=>{
  const rows=db.prepare("SELECT a.id,a.asset_name,a.tag_id,a.category,a.assigned_to,e.display_name,e.department FROM assets a LEFT JOIN employees e ON e.id=a.assigned_to WHERE a.assigned_to IS NOT NULL AND (e.role IS NULL OR e.role='Employee')").all();
  json(res,[]);
});
app.get("/asset/role-templates/mismatches/details", (_req,res)=>json(res,[]));
app.get("/asset/role-templates/mismatches/user/:userId", (_req,res)=>json(res,[]));
app.post("/asset/role-templates/mismatches/return-all", (_req,res)=>json(res,{returnedCount:0}));
app.get("/asset/role-templates", (_req,res)=>json(res,[]));
app.get("/asset/role-templates/:id", (_req,res)=>json(res,{template:null,items:[]}));
app.post("/asset/role-templates", (req,res)=>json(res,{ID:id(),...body(req)},201));
app.put("/asset/role-templates/:id", (req,res)=>json(res,{ID:req.params.id,...body(req)}));
app.delete("/asset/role-templates/:id", (_req,res)=>json(res,null));
app.post("/asset/role-templates/assign", (req,res)=>json(res,{}));
app.post("/asset/role-templates/bulk-assign", (_req,res)=>json(res,{updatedCount:0}));
app.get("/asset/ping", (_req,res)=>json(res,{message:"Asset module is reachable"}));
// Any less frequently used asset action remains safely local and returns the shape expected by the client.
app.use("/asset", (req,res,next)=>{ if(req.method === "GET") return json(res,[]); return json(res,{}); });
if (!isVercel) {
  app.listen(PORT, "127.0.0.1", () => console.log(`Quadra Asset local API listening on http://127.0.0.1:${PORT}`));
}
module.exports = app;
