const mainRoutes = {
  root: "Dashboard",
  "goods-receipt": "Goods Receipts",
  "sales-order": "Sales Order",
  delivery: "Delivery",
  diversion: "Diversion",
  finance: "Finance",
  reports: "Reports",
  "party-ledger": "Party Ledger",
  profile: "Profile",
  "user-admin": "User Adminstration",
  "data-management": "Data Management",
  "dealer-requests": "DMS Order Request",
  "dealer-sales-order": "Dealer SO Create",
  "physical-inventory": "Physical Inventory",
  "stock-report": "Stock Report",
  "damage-data-entry": "Rake Arrival Report",
};

const subRoutes = {
  overview: "Overview",
  create: "Create",
  "sales-order": "Sales Order",
  list: "List",
  "invoice-create": "Invoice Create",
  "invoice-list": "Invoice List",
  "user-profile": "User Profile",
  "user-create": "User Create",
  "user-list": "User List",
  "cfa-depot-map": "CFA Depot Map",
  "cs-bh-depot-map-unmap": "CS BH Depot Map",
  "rr-delete": "RR Delete",
  "dms-details": "DMS Details",
  "user-permissions": "User Permissions",
  "le-register": "le-register",
  "fi-daywise": "fi-daywise",
  "stock-overview-report": "stock-overview-report",
  "debit-credit-report": "debit-credit-report",
  "sales-register-report": "sales-register-report",
  "collection-report": "collection-report",
  "dealer-requests": "dealer-requests",
  "create-inventory": "create-inventory",
  "inventory-report": "inventory-report",
  "approve-inventory": "approve-inventory",
  "display-inventory": "display-inventory",
  "comparative-reports": "comparative-reports",
  "rake-details": "rake-details",
  "rake-data": "rake-data",
  "rake-arrival-report": "rake-arrival-report",
  "rake-report": "rake-report",
  "consolidated-report-exception": "rake-exception",
  "display-damage": "display-damage",
  "compliance-reports": "compliance-reports",
  "rr-summary-report": "rr-summary-report",
  "shipping-type": "Shipping Type",
  "plants-management": "Plants Management",
  "materials-management": "Materials Management",
  "cfa-management": "CFA Management",
  "incoterm-management": "Incoterm Management",
  "gr-material-management": "GR Material Management",
  "valuation-type-management":"Valuation Type", // Date: 15/01/2025 Valuation Type New Tab Requirement
  "give-rr-permission":'give-rr-permission'
};

const decideMainRoute = (location) => {
  let locationPaths = location.split("/");
  return locationPaths.length > 2
    ? mainRoutes[locationPaths[2]] || "404"
    : "404";
};

const decideSubRoute = (location) => {
  let locationPaths = location.split("/");
  return locationPaths.length > 3
    ? subRoutes[locationPaths[3]] || "404"
    : "404";
};

module.exports = { decideMainRoute, decideSubRoute };
