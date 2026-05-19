import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Package, LayoutDashboard, FileText, CheckCircle, AlertTriangle, 
  Settings, LogOut, UploadCloud, Cpu, Layers, Box,
  Search, Bell, Menu, ArrowRight, Lock, Mail, Activity, ShieldCheck, Plus, Play, XCircle, Truck, Clock, RefreshCw, FileDigit
} from 'lucide-react';

// --- ROLE-BASED SIDEBAR CONFIGURATION ---
const SIDEBAR_GROUPS = [
  {
    name: 'Dashboard',
    roles: ['Super Admin', 'Store Manager', 'Production Manager', 'Quality Control'],
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }
    ]
  },
  {
    name: 'Inventory',
    roles: ['Super Admin', 'Store Manager'],
    items: [
      { id: 'inv-inward', label: 'Invoice Inward', icon: FileText },
      { id: 'inv-items', label: 'Item Master', icon: Box },
      { id: 'inv-stock', label: 'Stock Summary', icon: Package },
      { id: 'inv-history', label: 'Audit & History', icon: Clock }
    ]
  },
  {
    name: 'Production',
    roles: ['Super Admin', 'Production Manager'],
    items: [
      { id: 'prod-plan', label: 'Prod Planning & BOM', icon: Layers },
      { id: 'prod-wip', label: 'WIP Tracking', icon: Activity },
    ]
  },
  {
    name: 'Quality',
    roles: ['Super Admin', 'Quality Control', 'Production Manager'],
    items: [
      { id: 'qc-queue', label: 'QC Queue', icon: ShieldCheck },
      { id: 'qc-reject', label: 'Rejections & Scrap', icon: AlertTriangle }
    ]
  },
  {
    name: 'Packing & Dispatch',
    roles: ['Super Admin'],
    items: [
      { id: 'disp-fg', label: 'Finished Goods', icon: Package },
      { id: 'disp-queue', label: 'Sales & Dispatch', icon: Truck }
    ]
  },
  {
    name: 'Intelligence',
    roles: ['Super Admin', 'Store Manager', 'Production Manager', 'Quality Control'],
    items: [
      { id: 'ai-insights', label: 'AI Insights', icon: Cpu }
    ]
  }
];

// --- SEED DATA (Simulated Database) ---
const INITIAL_INVENTORY = [
  { id: '1', sku: 'COMP-LED-3W', name: '3W White LED Round', type: 'Component', qty: 15000, qcHold: 0, minQty: 5000, status: 'Available', cost: 12 },
  { id: '2', sku: 'BODY-BLK-MED', name: 'Torch Body Black Med', type: 'Component', qty: 2400, qcHold: 0, minQty: 3000, status: 'Available', cost: 45 },
  { id: '3', sku: 'COMP-REF-SM', name: 'Reflector Small', type: 'Component', qty: 450, qcHold: 0, minQty: 1000, status: 'Critical', cost: 8 },
  { id: '4', sku: 'PKG-BOX-T100', name: 'Printed Box T-100', type: 'Packaging', qty: 1200, qcHold: 0, minQty: 2000, status: 'Warning', cost: 15 },
  { id: '5', sku: 'BATT-LI-18650', name: 'Lithium Cell 18650', type: 'Component', qty: 8500, qcHold: 0, minQty: 4000, status: 'Available', cost: 110 },
  { id: '6', sku: 'COMP-SWITCH-A', name: 'Tactical Push Switch', type: 'Component', qty: 1200, qcHold: 5000, minQty: 2000, status: 'Warning', cost: 5 },
  { id: '7', sku: 'FG-T100-BLK', name: 'Tactical Torch T-100 Black', type: 'Finished Good', qty: 4200, qcHold: 400, minQty: 1000, status: 'Available', cost: 350 },
  { id: '8', sku: 'FG-E200-YEL', name: 'Emergency Light E-200 Yellow', type: 'Finished Good', qty: 1200, qcHold: 0, minQty: 500, status: 'Available', cost: 850 },
];

const INITIAL_BOMS = {
  'FG-T100-BLK': [
    { sku: 'BODY-BLK-MED', qty: 1 },
    { sku: 'COMP-LED-3W', qty: 1 },
    { sku: 'COMP-REF-SM', qty: 1 },
    { sku: 'COMP-SWITCH-A', qty: 1 },
    { sku: 'BATT-LI-18650', qty: 1 },
    { sku: 'PKG-BOX-T100', qty: 1 }
  ],
  'FG-E200-YEL': [
    { sku: 'COMP-LED-3W', qty: 4 },
    { sku: 'BATT-LI-18650', qty: 2 },
    { sku: 'COMP-SWITCH-A', qty: 1 }
  ]
};

const INITIAL_QC_TASKS = [
  { id: 'QC-101', source: 'GRN-8490', sku: 'COMP-SWITCH-A', name: 'Tactical Push Switch', qty: 5000, status: 'Pending', type: 'Incoming' },
  { id: 'QC-102', source: 'PO-2024-44', sku: 'FG-T100-BLK', name: 'Tactical Torch T-100 Black', qty: 400, status: 'Pending', type: 'Final' },
];

const INITIAL_PRODUCTION = [
  { id: 'PRD-9921', fgSku: 'FG-T100-BLK', name: 'Tactical Torch T-100 Black', planned: 2000, completed: 0, status: 'In Production', stage: 'Assembly' },
  { id: 'PRD-9922', fgSku: 'FG-E200-YEL', name: 'Emergency Light E-200 Yellow', planned: 500, completed: 0, status: 'Material Reserved', stage: 'Kitting' },
];

const INITIAL_SALES_ORDERS = [
  { id: 'SO-10045', customer: 'Delta Outdoors Ltd', fgSku: 'FG-T100-BLK', qty: 1500, status: 'Pending Dispatch', date: '2026-05-18' },
  { id: 'SO-10046', customer: 'National Hardware Grid', fgSku: 'FG-E200-YEL', qty: 400, status: 'Pending Dispatch', date: '2026-05-19' },
];

const MOCK_USERS = {
  'superadmin@gmail.com': { email: 'superadmin@gmail.com', name: 'System Admin', role: 'Super Admin', initials: 'SA', password: '12345' },
  'store@gmail.com': { email: 'store@gmail.com', name: 'Store Manager', role: 'Store Manager', initials: 'SM', password: '12345' },
  'production@gmail.com': { email: 'production@gmail.com', name: 'Prod Manager', role: 'Production Manager', initials: 'PM', password: '12345' },
  'qc@gmail.com': { email: 'qc@gmail.com', name: 'QC Manager', role: 'Quality Control', initials: 'QC', password: '12345' },
};

const OlightLogo = ({ className }) => (
  <svg viewBox="0 0 130 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="olight-hole">
      <rect width="28" height="28" fill="white" />
      <path d="M14 7 A 7 7 0 1 0 14 21 A 8.5 8.5 0 1 1 14 7 Z" fill="black" />
    </mask>
    <circle cx="14" cy="14" r="10" mask="url(#olight-hole)" />
    <text x="32" y="20.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="18" letterSpacing="1.5">OLIGHT</text>
  </svg>
);

export default function OLightFunc() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Global State DB
  const [db, setDb] = useState({
    inventory: INITIAL_INVENTORY,
    boms: INITIAL_BOMS,
    qcTasks: INITIAL_QC_TASKS,
    productionOrders: INITIAL_PRODUCTION,
    salesOrders: INITIAL_SALES_ORDERS,
    rejections: [],
    auditLogs: [
      { id: 'LOG-001', time: new Date().toISOString(), user: 'System', action: 'System Initialized', details: 'Master data loaded.' }
    ],
  });

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Centralized state mutation with audit logging
  const executeTransaction = (actionName, details, mutationFn) => {
    setDb(prev => {
      const newState = mutationFn(prev);
      const log = { id: `LOG-${Math.floor(Math.random()*10000)}`, time: new Date().toISOString(), user: user.name, action: actionName, details };
      return { ...newState, auditLogs: [log, ...newState.auditLogs] };
    });
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const activeItemLabel = SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Workspace';
  const activeGroup = SIDEBAR_GROUPS.find(g => g.items.some(i => i.id === activeTab))?.name || 'Overview';

  return (
    <div className="flex h-screen bg-zinc-200/50 font-sans text-zinc-900 overflow-hidden selection:bg-teal-700/30">
      
      {/* High-Density Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-teal-600/20 p-1.5 rounded-full">
            <CheckCircle className="text-teal-500" size={16} />
          </div>
          <span className="font-semibold tracking-wide text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Tighter, Seamless App Shell Layout */}
      <div className="flex w-full h-full p-2 gap-2">
        
        {/* Dense Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-56' : 'w-16'} bg-zinc-950 text-zinc-300 rounded-2xl transition-all duration-300 flex flex-col shadow-xl z-20 flex-shrink-0 relative overflow-hidden border border-zinc-800/80`}>
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-teal-900/20 to-transparent opacity-50 pointer-events-none"></div>

          <div className="h-14 flex items-center justify-between px-4 relative z-10 border-b border-zinc-800/50">
            {isSidebarOpen && (
              <div className="flex items-center gap-2 overflow-hidden text-white">
                <OlightLogo className="h-5 w-auto text-teal-500" />
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors ml-auto">
              <Menu size={16} strokeWidth={2.5} />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
            {SIDEBAR_GROUPS.filter(group => group.roles.includes(user.role)).map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-3 mt-1">
                  {isSidebarOpen ? group.name : '•••'}
                </div>
                {group.items.map(item => (
                  <SidebarItem 
                    key={item.id}
                    icon={<item.icon size={16} strokeWidth={2.5}/>} 
                    label={item.label} 
                    isActive={activeTab === item.id} 
                    onClick={() => setActiveTab(item.id)} 
                    open={isSidebarOpen} 
                  />
                ))}
              </div>
            ))}
          </nav>

          <div className="p-3 relative z-10 border-t border-zinc-900">
             <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-1.5 flex flex-col gap-0.5">
                <SidebarItem icon={<Settings size={16}/>} label="Settings" isActive={false} onClick={() => {}} open={isSidebarOpen} />
                <SidebarItem icon={<LogOut size={16}/>} label="Logout" isActive={false} onClick={() => setUser(null)} open={isSidebarOpen} />
             </div>
          </div>
        </aside>

        {/* Main Interface Content */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200/60 flex flex-col min-w-0 overflow-hidden relative">
          
          <header className="h-14 bg-white border-b border-zinc-100 px-6 flex items-center justify-between z-10 flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                {activeGroup === 'Dashboard' && user.role === 'Super Admin' ? 'Command Center' : `${activeGroup} / ${activeItemLabel}`}
                {activeTab === 'dashboard' && <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[9px] uppercase px-1.5 py-0.5 rounded font-black ml-2 hidden md:inline-block">Live</span>}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden lg:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                <input 
                  type="text" 
                  placeholder="Search SKUs, POs, Invoices..." 
                  className="pl-9 pr-3 py-1.5 bg-zinc-100/80 border border-transparent rounded-lg text-xs focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none w-64 transition-all font-medium placeholder:font-normal"
                />
              </div>
              
              <button className="relative p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all">
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 cursor-pointer group">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-zinc-900 leading-none group-hover:text-teal-700 transition-colors">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{user.role}</p>
                </div>
                <div className="h-7 w-7 bg-teal-800 text-white rounded-md flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.initials}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 lg:p-8 bg-zinc-50/50 custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-8">
              {activeTab === 'dashboard' && <DashboardView user={user} db={db} />}
              
              {/* Inventory Group */}
              {activeTab === 'inv-inward' && <InwardWizard showToast={showToast} db={db} executeTransaction={executeTransaction} />}
              {activeTab === 'inv-items' && <ItemMasterModule db={db} />}
              {activeTab === 'inv-stock' && <StockSummaryModule db={db} />}
              {activeTab === 'inv-history' && <AuditHistoryModule db={db} />}
              
              {/* Production Group */}
              {activeTab === 'prod-plan' && <ProductionPlanModule db={db} executeTransaction={executeTransaction} showToast={showToast} />}
              {activeTab === 'prod-wip' && <WIPTrackingModule db={db} executeTransaction={executeTransaction} showToast={showToast} />}
              
              {/* Quality Group */}
              {activeTab === 'qc-queue' && <QCModule db={db} executeTransaction={executeTransaction} showToast={showToast} />}
              {activeTab === 'qc-reject' && <RejectionsModule db={db} />}
              
              {/* Dispatch Group */}
              {activeTab === 'disp-fg' && <FinishedGoodsModule db={db} />}
              {activeTab === 'disp-queue' && <DispatchModule db={db} executeTransaction={executeTransaction} showToast={showToast} />}
              
              {/* Intelligence */}
              {activeTab === 'ai-insights' && <AIInsightsModule db={db} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, isActive, onClick, open }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
        isActive 
          ? 'bg-teal-900/80 text-teal-400 border border-teal-800/50 shadow-inner' 
          : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
      } ${!open && 'justify-center px-0'}`}
      title={!open ? label : ''}
    >
      <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-105 text-teal-400' : 'group-hover:scale-105'}`}>
        {icon}
      </div>
      {open && <span className={`font-semibold whitespace-nowrap text-xs tracking-wide relative z-10`}>{label}</span>}
    </button>
  );
}

function KPICard({ title, value, trend, alert, icon }) {
  return (
    <div className={`group bg-white p-4 py-5 rounded-2xl border shadow-sm transition-all duration-200 ${alert ? 'border-red-200/60 bg-red-50/30' : 'border-zinc-200 hover:border-teal-300/50'}`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-zinc-500 text-[11px] font-bold tracking-wider uppercase">{title}</h4>
        {icon && (
          <div className={`p-1.5 rounded-lg ${alert ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors'}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-black tracking-tight ${alert ? 'text-red-600' : 'text-zinc-900'}`}>{value}</span>
      </div>
      {trend && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'text-emerald-700 bg-emerald-100/80' : 'text-zinc-600 bg-zinc-100'}`}>
            {trend}
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold">vs last month</span>
        </div>
      )}
    </div>
  );
}

// --- DASHBOARD VIEWS ---

function DashboardView({ user, db }) {
  // Calculate dynamic inventory values
  const valMap = { 'Component': 0, 'Raw Material': 0, 'WIP': 0, 'Finished Good': 0, 'Packaging': 0 };
  let totalVal = 0;
  db.inventory.forEach(item => {
    const val = item.qty * item.cost;
    totalVal += val;
    valMap[item.type] = (valMap[item.type] || 0) + val;
  });

  const chartData = [
    { name: 'Components', value: valMap['Component'] },
    { name: 'WIP', value: valMap['WIP'] },
    { name: 'Finished Goods', value: valMap['Finished Good'] },
    { name: 'Packaging', value: valMap['Packaging'] },
  ];

  const totalStr = `₹${(totalVal / 1000000).toFixed(2)}M`;
  const dispatchReady = db.inventory.filter(i => i.type === 'Finished Good').reduce((acc, i) => acc + i.qty, 0);
  const qcCount = db.qcTasks.length;
  const lowStockCount = db.inventory.filter(i => i.qty < i.minQty).length;

  const productionTrend = [
    { day: 'Mon', planned: 4000, actual: 3800 },
    { day: 'Tue', planned: 4500, actual: 4600 },
    { day: 'Wed', planned: 4000, actual: 3950 },
    { day: 'Thu', planned: 5000, actual: 4800 },
    { day: 'Fri', planned: 5000, actual: 5100 },
    { day: 'Sat', planned: 2500, actual: 2700 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Dense AI Banner */}
      <div className="relative bg-[#0d1317] rounded-2xl p-5 shadow-md border border-teal-900/40 overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-5 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 opacity-5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 bg-black/40 border border-teal-800/50 p-3 rounded-xl">
          <Cpu className="text-teal-400" size={20} strokeWidth={1.5} />
        </div>
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-white tracking-tight">Gemini Intelligence active</h3>
            <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span> Live Sync
            </span>
          </div>
          <div className="space-y-1.5 text-zinc-400 text-xs font-medium">
            {lowStockCount > 0 ? (
              <p className="flex items-start gap-2 bg-white/5 p-2 px-3 rounded-lg border border-white/5">
                <span className="text-teal-500 font-bold">→</span> 
                <span><strong className="text-white">Shortage Predicted:</strong> {lowStockCount} items are below minimum stock. <button className="text-teal-400 hover:text-teal-300 underline underline-offset-2 decoration-teal-500/30 ml-1 transition-colors">Expedite Purchase Orders</button></span>
              </p>
            ) : (
              <p className="flex items-start gap-2 bg-white/5 p-2 px-3 rounded-lg border border-white/5">
                <span className="text-teal-500 font-bold">→</span> 
                <span><strong className="text-white">Production Readiness:</strong> All active BOMs have sufficient inventory to complete runs.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Role KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Inventory Value" value={totalStr} trend="+2.4%" icon={<Activity size={16}/>} />
        <KPICard title={user.role === 'Store Manager' ? "Low Stock Alerts" : "Pending QC Tasks"} value={user.role === 'Store Manager' ? lowStockCount : qcCount} alert={(user.role === 'Store Manager' ? lowStockCount : qcCount) > 0} icon={<ShieldCheck size={16}/>} />
        <KPICard title="Active Prod. Orders" value={db.productionOrders.length} icon={<Layers size={16}/>} />
        <KPICard title="Dispatch Ready FG" value={dispatchReady.toLocaleString()} icon={<Package size={16}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1 */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-zinc-900">Inventory Value Allocation</h3>
            <button className="text-[11px] text-teal-700 font-bold hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">Full Report</button>
          </div>
          <div className="h-[260px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#115e59" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10}} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <RechartsTooltip cursor={{fill: '#fafafa'}} formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="url(#colorValue)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-zinc-900">Production Output vs Plan</h3>
            <select className="bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-lg px-2 py-1 text-zinc-700 outline-none">
              <option>Past 7 Days</option>
              <option>Past 30 Days</option>
            </select>
          </div>
          <div className="h-[260px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10}} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                <Area type="monotone" name="Actual Qty" dataKey="actual" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" activeDot={{r: 5, strokeWidth: 0, fill: '#0f766e'}} />
                <Area type="monotone" name="Planned Qty" dataKey="planned" stroke="#d4d4d8" strokeWidth={2} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MODULE: INWARD WIZARD ---

function InwardWizard({ showToast, db, executeTransaction }) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappedQty, setMappedQty] = useState(5000);

  const handleProcessAI = () => {
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); setStep(2); }, 1500);
  };

  const handleConfirm = () => {
    const qty = parseInt(mappedQty);
    executeTransaction('Invoice Inward', `Processed INV-4421 for 3W White LED Round. Qty: ${qty}`, (prev) => {
      // Create QC Task
      const newQcTask = { id: `QC-${Math.floor(200 + Math.random()*800)}`, source: 'INV-4421', sku: 'COMP-LED-3W', name: '3W White LED Round', qty: qty, status: 'Pending', type: 'Incoming' };
      // Increase QC Hold Stock for item
      const updatedInv = prev.inventory.map(i => i.sku === 'COMP-LED-3W' ? { ...i, qcHold: (i.qcHold || 0) + qty } : i);
      return { ...prev, qcTasks: [newQcTask, ...prev.qcTasks], inventory: updatedInv };
    });
    showToast(`Inward confirmed! ${mappedQty} units sent to QC Hold.`);
    setStep(1); 
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-zinc-50 border-b border-zinc-200 p-4 px-6">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-600 rounded-full z-0 transition-all duration-500 ease-out" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          {['Upload', 'AI Extractions', 'Verification', 'QC Routing'].map((label, index) => {
            const s = index + 1; const isActive = step === s; const isPassed = step > s;
            return (
              <div key={s} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => isPassed && setStep(s)}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all duration-300 ${isActive ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-100' : isPassed ? 'bg-zinc-800 text-white' : 'bg-white border border-zinc-300 text-zinc-400 group-hover:border-zinc-400'}`}>
                  {isPassed ? <CheckCircle size={14} strokeWidth={3} /> : s}
                </div>
                <span className={`absolute top-9 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-teal-700' : isPassed ? 'text-zinc-800' : 'text-zinc-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 lg:p-8 min-h-[400px] flex flex-col mt-4">
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="text-center mb-6"><h2 className="text-xl font-bold text-zinc-900 tracking-tight">Invoice Digitization</h2></div>
            <div className="w-full max-w-xl border-2 border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 flex flex-col items-center justify-center transition-all hover:bg-teal-50/50 hover:border-teal-300 cursor-pointer">
              <UploadCloud size={24} className="text-teal-600 mb-4" />
              <button onClick={handleProcessAI} disabled={isProcessing} className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2">
                {isProcessing ? 'Processing...' : 'Extract Data with AI'}
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3 mb-6">
              <CheckCircle className="text-emerald-600" size={16} />
              <div><h4 className="text-emerald-900 font-bold text-xs">Confidence Score: 98%</h4></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-auto">
              {[{l: 'Supplier', v: 'ABC Components'}, {l: 'Invoice No.', v: 'INV-4421'}, {l: 'Date', v: '18 May 2026'}, {l: 'Amount', v: '₹ 24,780.00'}].map(item => (
                <div key={item.l} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">{item.l}</span><span className="font-bold text-sm">{item.v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-100">
              <button onClick={() => setStep(1)} className="text-zinc-500 font-bold text-xs">Cancel</button>
              <button onClick={() => setStep(3)} className="bg-teal-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2">Proceed <ArrowRight size={14}/></button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <table className="w-full text-left whitespace-nowrap border border-zinc-200 rounded-xl overflow-hidden mb-auto">
              <thead className="bg-zinc-50/80 text-zinc-500 border-b border-zinc-200">
                <tr><th className="p-3 font-bold text-[10px] uppercase">Desc</th><th className="p-3 font-bold text-[10px] uppercase">Match</th><th className="p-3 font-bold text-[10px] uppercase text-right">Qty</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="p-3 text-xs font-semibold">3W White LED Round</td>
                  <td className="p-2"><select className="border border-teal-200 bg-teal-50 text-teal-900 rounded-lg p-1.5 text-xs font-bold w-full"><option>COMP-LED-3W</option></select></td>
                  <td className="p-2 text-right"><input type="number" value={mappedQty} onChange={(e)=>setMappedQty(e.target.value)} className="border border-zinc-200 rounded-lg p-1.5 text-right w-24 text-xs font-bold" /></td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-100">
              <button onClick={() => setStep(2)} className="text-zinc-500 font-bold text-xs">Back</button>
              <button onClick={() => setStep(4)} className="bg-teal-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2">Confirm <ArrowRight size={14}/></button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4 mb-auto">
              <AlertTriangle className="text-amber-600" size={20} />
              <div>
                <h4 className="text-amber-900 font-bold text-sm mb-1">Mandatory QC Hold Triggered</h4>
                <p className="text-amber-800 text-xs mb-4">Items will be quarantined.</p>
                <div className="flex gap-4">
                  <select className="flex-1 border border-amber-300 bg-amber-50 rounded-lg p-2 text-xs font-bold text-amber-900"><option>Rack A - QC Hold</option></select>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-100">
              <button onClick={() => setStep(3)} className="text-zinc-500 font-bold text-xs">Back</button>
              <button onClick={handleConfirm} className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2"><CheckCircle size={14} className="text-teal-400" /> Post Ledger Entry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MODULE: INVENTORY TABLES ---

function ItemMasterModule({ db }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-zinc-100 flex justify-between items-center"><h2 className="font-bold text-zinc-900 text-sm">Item Master Directory</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Name</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Type</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Std Cost</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Min Qty</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.inventory.map(item => (
              <tr key={item.id} className="hover:bg-zinc-50/50">
                <td className="p-3 px-4 font-bold text-zinc-800">{item.sku}</td>
                <td className="p-3 px-4 text-zinc-600 font-semibold">{item.name}</td>
                <td className="p-3 px-4"><span className="bg-zinc-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase text-zinc-600">{item.type}</span></td>
                <td className="p-3 px-4 text-zinc-800 font-bold">₹{item.cost}</td>
                <td className="p-3 px-4 text-zinc-500 font-semibold">{item.minQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockSummaryModule({ db }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-zinc-100 flex justify-between items-center"><h2 className="font-bold text-zinc-900 text-sm">Live Stock Balances</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Available Qty</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">QC Hold</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Total Physical</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.inventory.map(item => (
              <tr key={item.id} className="hover:bg-zinc-50/50">
                <td className="p-3 px-4 font-bold text-zinc-800">{item.sku} <span className="text-zinc-400 font-normal">({item.name})</span></td>
                <td className="p-3 px-4 text-right font-black text-teal-700 text-sm">{item.qty.toLocaleString()}</td>
                <td className="p-3 px-4 text-right font-bold text-amber-600">{(item.qcHold || 0).toLocaleString()}</td>
                <td className="p-3 px-4 text-right font-bold text-zinc-800">{(item.qty + (item.qcHold||0)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditHistoryModule({ db }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-zinc-100 flex justify-between items-center"><h2 className="font-bold text-zinc-900 text-sm">System Audit Trail</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">Log ID</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Time</th><th className="p-3 px-4 font-bold uppercase text-[10px]">User</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Action</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Details</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-zinc-50/50">
                <td className="p-3 px-4 font-bold text-zinc-500">{log.id}</td>
                <td className="p-3 px-4 text-zinc-600">{new Date(log.time).toLocaleTimeString()}</td>
                <td className="p-3 px-4 font-bold text-zinc-800">{log.user}</td>
                <td className="p-3 px-4"><span className="bg-zinc-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase text-zinc-600">{log.action}</span></td>
                <td className="p-3 px-4 text-zinc-500 truncate max-w-xs">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MODULE: PRODUCTION & BOM ---

function ProductionPlanModule({ db, executeTransaction, showToast }) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSku, setSelectedSku] = useState('FG-T100-BLK');
  const [orderQty, setOrderQty] = useState(1000);
  const [shortages, setShortages] = useState([]);

  const handleSimulate = () => {
    const bom = db.boms[selectedSku];
    let foundShortages = [];
    bom.forEach(comp => {
      const required = comp.qty * parseInt(orderQty);
      const stock = db.inventory.find(i => i.sku === comp.sku)?.qty || 0;
      if (stock < required) foundShortages.push({ sku: comp.sku, required, stock });
    });
    setShortages(foundShortages);
    return foundShortages.length === 0;
  };

  const handleCreatePO = () => {
    if (!handleSimulate()) {
      showToast("Cannot create order: BOM Shortages detected.");
      return;
    }
    
    executeTransaction('Create Production Order', `PO for ${orderQty}x ${selectedSku}`, (prev) => {
      // Reserve inventory (deduct from available)
      const bom = prev.boms[selectedSku];
      const updatedInv = prev.inventory.map(item => {
        const comp = bom.find(b => b.sku === item.sku);
        if (comp) return { ...item, qty: item.qty - (comp.qty * parseInt(orderQty)) };
        return item;
      });

      const newPO = { id: `PRD-${Math.floor(1000 + Math.random() * 9000)}`, fgSku: selectedSku, name: prev.inventory.find(i => i.sku === selectedSku)?.name || 'New Torch', planned: parseInt(orderQty), completed: 0, status: 'Material Reserved', stage: 'Kitting' };
      return { ...prev, inventory: updatedInv, productionOrders: [newPO, ...prev.productionOrders] };
    });
    
    setIsCreating(false);
    showToast(`Production Order created! Materials reserved and deducted from available stock.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div><h2 className="font-bold text-zinc-900 text-sm">Active Production Orders</h2><p className="text-zinc-500 text-[11px] font-medium mt-0.5">Manage BOM explosions and WIP stages.</p></div>
        <button onClick={() => setIsCreating(!isCreating)} className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
          {isCreating ? <XCircle size={14}/> : <Plus size={14}/>} {isCreating ? 'Cancel' : 'Create Order'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-md animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-zinc-900 text-xs mb-4 uppercase tracking-wider">New Production Run & Live BOM Check</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Target SKU</label><select value={selectedSku} onChange={e=>{setSelectedSku(e.target.value); setShortages([]);}} className="w-full border border-zinc-300 bg-zinc-50 rounded-lg p-2 text-xs font-bold"><option value="FG-T100-BLK">Tactical Torch T-100 Black</option><option value="FG-E200-YEL">Emergency Light E-200 Yellow</option></select></div>
            <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Planned Qty</label><input type="number" value={orderQty} onChange={e=>{setOrderQty(e.target.value); setShortages([]);}} className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold" /></div>
            <div className="flex items-end gap-2">
              <button onClick={handleSimulate} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 p-2 rounded-lg text-xs font-bold"><RefreshCw size={14} className="inline mr-1"/> Check</button>
              <button onClick={handleCreatePO} className="flex-1 bg-zinc-900 hover:bg-black text-white p-2 rounded-lg text-xs font-bold"><Play size={14} className="inline mr-1"/> Execute</button>
            </div>
          </div>
          
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Live BOM Explosion Requirements</p>
             <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-700">
               {db.boms[selectedSku].map(c => {
                 const req = c.qty * orderQty;
                 const short = shortages.find(s => s.sku === c.sku);
                 return (
                    <span key={c.sku} className={`px-2 py-1 rounded border shadow-sm ${short ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-zinc-200'}`}>
                      {req}x {c.sku} {short && `(Need ${short.required - short.stock} more)`}
                    </span>
                 )
               })}
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="text-zinc-500 bg-zinc-50/80 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">Order ID</th><th className="p-3 px-4 font-bold uppercase text-[10px]">SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Progress</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Stage</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.productionOrders.map(po => (
              <tr key={po.id} className="hover:bg-zinc-50/50">
                <td className="p-3 px-4 font-bold text-teal-700">{po.id}</td>
                <td className="p-3 px-4 font-bold text-zinc-800">{po.fgSku}</td>
                <td className="p-3 px-4"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-zinc-200 rounded-full"><div className="h-full bg-teal-500" style={{width: `${(po.completed/po.planned)*100}%`}}></div></div><span className="text-[10px] font-bold text-zinc-500">{po.completed} / {po.planned}</span></div></td>
                <td className="p-3 px-4 text-zinc-600 font-semibold">{po.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WIPTrackingModule({ db, executeTransaction, showToast }) {
  const STAGES = ['Kitting', 'Assembly', 'Testing', 'Packing', 'Completed'];

  const advanceWIP = (poId, currentStage, planned, fgSku) => {
    const nextIdx = STAGES.indexOf(currentStage) + 1;
    if (nextIdx >= STAGES.length) return;
    const nextStage = STAGES[nextIdx];

    executeTransaction('WIP Advance', `${poId} moved to ${nextStage}`, (prev) => {
      let updatedOrders = prev.productionOrders.map(po => po.id === poId ? { ...po, stage: nextStage, status: nextStage === 'Completed' ? 'Completed' : 'In Production', completed: nextStage === 'Completed' ? planned : 0 } : po);
      
      let updatedInv = prev.inventory;
      if (nextStage === 'Completed') {
        // Add to FG Stock
        updatedInv = updatedInv.map(i => i.sku === fgSku ? { ...i, qty: i.qty + planned } : i);
      }
      return { ...prev, productionOrders: updatedOrders, inventory: updatedInv };
    });

    if (nextStage === 'Completed') {
       showToast(`${poId} Completed! ${planned} units of ${fgSku} added to Finished Goods Inventory.`);
    } else {
       showToast(`${poId} moved to ${nextStage} stage.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div><h2 className="font-bold text-zinc-900 text-sm">WIP Kanban Board</h2><p className="text-zinc-500 text-[11px] font-medium mt-0.5">Advance production orders through line stages.</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {db.productionOrders.filter(po => po.status !== 'Completed').map(po => (
          <div key={po.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div><span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{po.id}</span><h3 className="font-bold text-zinc-900 mt-1">{po.name}</h3></div>
              <span className="font-black text-lg text-zinc-800">{po.planned} <span className="text-xs text-zinc-400 font-semibold uppercase">units</span></span>
            </div>
            
            <div className="flex justify-between items-center relative mb-6 mt-6">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-100 z-0 rounded-full"></div>
              {STAGES.map((s, idx) => {
                const isActive = po.stage === s;
                const isPassed = STAGES.indexOf(po.stage) >= idx;
                return (
                  <div key={s} className="relative z-10 flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-teal-500 border-teal-200 ring-4 ring-teal-50' : isPassed ? 'bg-teal-700 border-teal-700' : 'bg-white border-zinc-300'}`}></div>
                    <span className={`absolute top-4 text-[9px] font-bold uppercase text-center w-16 -ml-8 ${isActive ? 'text-teal-700' : isPassed ? 'text-zinc-500' : 'text-zinc-300'}`}>{s}</span>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <button onClick={() => advanceWIP(po.id, po.stage, po.planned, po.fgSku)} className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                Advance Stage <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MODULE: QUALITY CONTROL ---

function QCModule({ db, executeTransaction, showToast }) {
  const handleQCAction = (taskId, action, sku, qty) => {
    executeTransaction(`QC ${action}`, `Task ${taskId} for ${qty}x ${sku}`, (prev) => {
      const updatedTasks = prev.qcTasks.filter(t => t.id !== taskId);
      let updatedInv = prev.inventory;
      let updatedRej = prev.rejections;

      if (action === 'Pass') {
        // Move from qcHold to qty
        updatedInv = updatedInv.map(i => i.sku === sku ? { ...i, qcHold: Math.max(0, (i.qcHold || 0) - qty), qty: i.qty + qty } : i);
      } else {
        // Move from qcHold to Scrapped (just remove from qcHold and log in rejections)
        updatedInv = updatedInv.map(i => i.sku === sku ? { ...i, qcHold: Math.max(0, (i.qcHold || 0) - qty) } : i);
        updatedRej = [{ id: `REJ-${Math.floor(Math.random()*1000)}`, sku, qty, reason: 'Failed Incoming QC', date: new Date().toISOString() }, ...updatedRej];
      }

      return { ...prev, qcTasks: updatedTasks, inventory: updatedInv, rejections: updatedRej };
    });

    if (action === 'Pass') showToast(`Task ${taskId} Passed! Inventory marked as Available.`);
    else showToast(`Task ${taskId} Rejected! Items moved to Scrap / Rejection zone.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div><h2 className="font-bold text-zinc-900 text-sm">Quality Control Queue</h2><p className="text-zinc-500 text-[11px] font-medium mt-0.5">Inspect incoming holds and final FG.</p></div>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-lg">{db.qcTasks.length} Pending</span>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="text-zinc-500 bg-zinc-50/80 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">Task</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Type</th><th className="p-3 px-4 font-bold uppercase text-[10px]">SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Qty</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.qcTasks.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-zinc-400 font-bold">No Pending Tasks</td></tr>}
            {db.qcTasks.map(task => (
              <tr key={task.id} className="hover:bg-zinc-50/50">
                <td className="p-3 px-4 font-bold text-zinc-800">{task.id}</td>
                <td className="p-3 px-4"><span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{task.type}</span></td>
                <td className="p-3 px-4 font-bold text-zinc-800">{task.sku}</td>
                <td className="p-3 px-4 font-black text-zinc-700 text-sm text-right">{task.qty.toLocaleString()}</td>
                <td className="p-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>handleQCAction(task.id, 'Reject', task.sku, task.qty)} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-bold">Reject</button>
                    <button onClick={()=>handleQCAction(task.id, 'Pass', task.sku, task.qty)} className="bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-1.5 rounded font-bold shadow-sm flex items-center gap-1"><CheckCircle size={14}/> Pass</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RejectionsModule({ db }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-zinc-100"><h2 className="font-bold text-zinc-900 text-sm">Rejections & Scrap Record</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">Record ID</th><th className="p-3 px-4 font-bold uppercase text-[10px]">SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Qty</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Reason</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.rejections.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-zinc-400 font-bold">No rejections recorded.</td></tr>}
            {db.rejections.map(rej => (
              <tr key={rej.id} className="hover:bg-zinc-50/50">
                <td className="p-3 px-4 font-bold text-red-700">{rej.id}</td>
                <td className="p-3 px-4 font-bold text-zinc-800">{rej.sku}</td>
                <td className="p-3 px-4 text-right font-black text-zinc-800">{rej.qty}</td>
                <td className="p-3 px-4 text-zinc-600">{rej.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MODULE: DISPATCH & FG ---

function FinishedGoodsModule({ db }) {
  const fgStock = db.inventory.filter(i => i.type === 'Finished Good');
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-zinc-100"><h2 className="font-bold text-zinc-900 text-sm">Dispatch-Ready Finished Goods</h2></div>
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
          <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">FG SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Product Name</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Sellable Qty</th></tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {fgStock.map(fg => (
            <tr key={fg.id} className="hover:bg-zinc-50/50">
              <td className="p-3 px-4 font-bold text-zinc-800">{fg.sku}</td>
              <td className="p-3 px-4 text-zinc-600 font-semibold">{fg.name}</td>
              <td className="p-3 px-4 text-right font-black text-teal-700 text-sm">{fg.qty.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DispatchModule({ db, executeTransaction, showToast }) {
  const handleDispatch = (orderId, sku, qty) => {
    executeTransaction('Sales Dispatch', `Fulfilled ${orderId}: ${qty}x ${sku}`, (prev) => {
      const updatedInv = prev.inventory.map(item => item.sku === sku ? { ...item, qty: Math.max(0, item.qty - qty) } : item);
      const updatedOrders = prev.salesOrders.map(so => so.id === orderId ? { ...so, status: 'Dispatched' } : so);
      return { ...prev, inventory: updatedInv, salesOrders: updatedOrders };
    });
    showToast(`Order ${orderId} Dispatched! ${qty} units of ${sku} deducted.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div><h2 className="font-bold text-zinc-900 text-sm">Sales Orders & Dispatch</h2></div>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="text-zinc-500 bg-zinc-50/80 border-b border-zinc-100">
            <tr><th className="p-3 px-4 font-bold uppercase text-[10px]">Order ID</th><th className="p-3 px-4 font-bold uppercase text-[10px]">Customer</th><th className="p-3 px-4 font-bold uppercase text-[10px]">FG SKU</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Qty</th><th className="p-3 px-4 font-bold uppercase text-[10px] text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {db.salesOrders.map(order => {
              const fgStock = db.inventory.find(i => i.sku === order.fgSku)?.qty || 0;
              const canFulfill = fgStock >= order.qty;
              const isDispatched = order.status === 'Dispatched';
              return (
                <tr key={order.id} className={`hover:bg-zinc-50/50 ${isDispatched ? 'opacity-50' : ''}`}>
                  <td className="p-3 px-4 font-bold text-zinc-800">{order.id}</td>
                  <td className="p-3 px-4 font-semibold text-zinc-600">{order.customer}</td>
                  <td className="p-3 px-4 font-bold text-zinc-800">{order.fgSku}</td>
                  <td className="p-3 px-4 font-black text-zinc-700 text-right">{order.qty.toLocaleString()}</td>
                  <td className="p-3 px-4 text-right">
                    {isDispatched ? <span className="text-zinc-400 font-bold text-[10px] uppercase">Dispatched</span> : 
                      <button onClick={()=>handleDispatch(order.id, order.fgSku, order.qty)} disabled={!canFulfill} className={`px-3 py-1.5 rounded flex items-center justify-end gap-2 font-bold ml-auto ${canFulfill ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        {canFulfill ? 'Dispatch Order' : 'Out of Stock'}
                      </button>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MODULE: AI INSIGHTS ---

function AIInsightsModule({ db }) {
  const lowStock = db.inventory.filter(i => i.qty < i.minQty);
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0b] rounded-2xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden text-zinc-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600 opacity-5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3"><Cpu className="text-teal-400"/> Gemini AI Core</h2>
        
        <div className="space-y-4 relative z-10">
          <div className="bg-black/50 border border-zinc-800/80 rounded-xl p-4">
             <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Inventory Predictions</h3>
             {lowStock.length > 0 ? lowStock.map(item => (
                <div key={item.sku} className="flex gap-3 text-sm mb-2"><span className="text-red-400 font-bold">[WARN]</span><span><strong className="text-white">{item.sku}</strong> will completely stock-out in ~3.2 days based on current BOM allocations. Suggested reorder: {(item.minQty * 1.5).toLocaleString()} units.</span></div>
             )) : <div className="text-sm text-teal-400 font-medium">All inventory streams are healthy. No stock-outs predicted in the next 14 days.</div>}
          </div>

          <div className="bg-black/50 border border-zinc-800/80 rounded-xl p-4">
             <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">WIP & Quality Optimization</h3>
             <div className="flex gap-3 text-sm mb-2"><span className="text-teal-400 font-bold">[INFO]</span><span>Vendor "ABC Components" (COMP-SWITCH-A) has a 0% rejection rate this month. Consider expanding PO allocations.</span></div>
             <div className="flex gap-3 text-sm mb-2"><span className="text-teal-400 font-bold">[INFO]</span><span>Production Line 1 is operating at 94% efficiency. BOM waste variance is well below the 2% threshold.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AUTH ---

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('superadmin@gmail.com');
  const [password, setPassword] = useState('12345');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser && foundUser.password === password) onLogin(foundUser);
    else setError('Authentication failed.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden font-sans text-zinc-100 selection:bg-teal-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#0a0a0b] to-black z-0"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px] animate-pulse"></div>
      
      <div className="relative z-10 w-full max-w-[360px] animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4 text-white"><OlightLogo className="h-6 w-auto text-teal-500" /></div>
          <h1 className="text-xl font-bold tracking-tight text-white">Workspace Login</h1>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-700 via-teal-400 to-teal-700"></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-xs font-bold">{error}</div>}
            <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">System Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-zinc-800 rounded-lg text-sm text-white outline-none focus:border-teal-500" /></div>
            <div><label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Passkey</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-zinc-800 rounded-lg text-sm text-white outline-none focus:border-teal-500 tracking-widest" /></div>
            <button type="submit" className="w-full bg-teal-700 hover:bg-teal-600 text-white py-2.5 rounded-lg text-sm font-bold mt-2">Authenticate</button>
          </form>
          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-[9px] font-bold text-zinc-600 uppercase mb-3">Quick Roles</p>
            <div className="flex justify-center gap-1.5">
              {['superadmin', 'store', 'production', 'qc'].map(role => (
                <button key={role} onClick={()=>{setEmail(`${role}@gmail.com`); setPassword('12345');}} className="bg-zinc-800/50 hover:bg-teal-900/30 text-zinc-400 px-2 py-1 rounded text-[10px] font-bold capitalize">{role}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
