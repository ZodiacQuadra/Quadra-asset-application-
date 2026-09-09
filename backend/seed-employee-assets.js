const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/asset-management.sqlite');

const extraAssets = [
  { id: 'asset-monitor-sarah', name: 'Dell 27-inch 4K Monitor', tag: 'AST09002', cat: 'Monitor', model: 'UltraSharp U2723QE', cost: 48000, user: 'emp-sarah' },
  { id: 'asset-mouse-sarah', name: 'Apple Magic Mouse 2', tag: 'AST09003', cat: 'Accessories', model: 'A1657', cost: 7500, user: 'emp-sarah' },
  { id: 'asset-laptop-michael', name: 'ThinkPad X1 Carbon Gen 11', tag: 'AST09004', cat: 'Laptop', model: 'X1 Carbon', cost: 145000, user: 'emp-michael' },
  { id: 'asset-mba-emily', name: 'MacBook Air 15 M2', tag: 'AST09005', cat: 'Laptop', model: 'MBA 15', cost: 125000, user: 'emp-emily' },
  { id: 'asset-kb-emily', name: 'Logitech MX Keys Mini', tag: 'AST09006', cat: 'Keyboard', model: 'MX Keys', cost: 9500, user: 'emp-emily' },
  { id: 'asset-monitor-david', name: 'Dell 34-inch Curved Monitor', tag: 'AST09007', cat: 'Monitor', model: 'P3421W', cost: 52000, user: 'emp-david' },
  { id: 'asset-headset-david', name: 'Jabra Evolve2 65 Headset', tag: 'AST09008', cat: 'Headphones', model: 'Evolve2 65', cost: 18500, user: 'emp-david' },
];

for (const a of extraAssets) {
  const existing = db.prepare('SELECT id FROM assets WHERE id=?').get(a.id);
  if (!existing) {
    db.prepare("INSERT INTO assets (id, asset_name, tag_id, category, model, cost, status, assigned_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))").run(a.id, a.name, a.tag, a.cat, a.model, a.cost, 'Assigned', a.user);
  }
}

console.log('Updated asset counts per employee:');
console.log(db.prepare('SELECT assigned_to, COUNT(*) as c FROM assets WHERE assigned_to IS NOT NULL GROUP BY assigned_to').all());
