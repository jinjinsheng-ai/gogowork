import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  writeBatch,
  getDocs 
} from 'firebase/firestore';
import { 
  ClipboardList, 
  Wrench, 
  CalendarClock, 
  Save, 
  Printer, 
  Plus, 
  Search, 
  User, 
  MapPin, 
  FileText,
  CheckSquare,
  Activity,
  Trash2,
  Share2,
  MessageCircle,
  Settings,
  Edit2,
  X,
  Check,
  Building2,
  List,
  Tags,
  Users,
  ArrowLeft,
  ArrowRightCircle,
  Layers,
  Download,
  Bell, 
  Clock,
  History,
  Filter,
  Upload,
  Database,
  Eraser,
  Calendar as CalendarIcon, 
  ChevronLeft,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  PieChart, 
  TrendingUp,
  AlertCircle,
  LayoutDashboard,
  AlertTriangle,
  Hammer,
  Zap,
  PlayCircle,
  CheckCircle, 
  HelpCircle,
  Timer,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Layout,
  Home,
  Package,
  FileSpreadsheet,
  FileOutput,
  Box,
  RefreshCw,
  ArrowRightLeft,
  Recycle,
  Trash,
  LogOut,
  Shield,
  Lock,
  Target,
  Eye,
  EyeOff,
  CopyPlus
} from 'lucide-react';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helper Functions ---
const parseCSV = (str) => {
    const result = []; let row = []; let inQuotes = false; let val = '';
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (inQuotes) {
            if (c === '"') {
                if (i + 1 < str.length && str[i + 1] === '"') { val += '"'; i++; } else { inQuotes = false; }
            } else { val += c; }
        } else {
            if (c === '"') { inQuotes = true; } 
            else if (c === ',') { row.push(val); val = ''; } 
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && i + 1 < str.length && str[i+1] === '\n') i++;
                row.push(val); result.push(row); row = []; val = '';
            } else { val += c; }
        }
    }
    if (val || row.length > 0) { row.push(val); result.push(row); }
    return result;
};

const normalizeStaffList = (list) => {
    if (!list || !Array.isArray(list)) return [];
    return list.map(item => { if (typeof item === 'string') { return { name: item, password: null }; } return item; });
};

const useConfirm = () => {
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '確認', message: '', onConfirm: null, isDanger: true });
    const confirm = ({ title = "確認", message, onConfirm, isDanger = true }) => { setConfirmState({ isOpen: true, title, message, onConfirm, isDanger }); };
    const close = () => setConfirmState(prev => ({ ...prev, isOpen: false }));
    const ConfirmDialog = () => {
        if (!confirmState.isOpen) return null;
        return (
            <div className="fixed inset-0 bg-slate-900/40 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
                    <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-full ${confirmState.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{confirmState.isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}</div><h3 className="text-lg font-bold text-slate-800">{confirmState.title}</h3></div>
                    <p className="text-slate-600 mb-8 leading-relaxed whitespace-pre-line text-sm">{confirmState.message}</p>
                    <div className="flex justify-end gap-3"><button onClick={close} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition font-medium text-sm">取消</button><button onClick={() => { confirmState.onConfirm(); close(); }} className={`px-5 py-2.5 text-white rounded-xl shadow-lg shadow-blue-500/30 transition font-medium text-sm flex items-center gap-2 ${confirmState.isDanger ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>{confirmState.isDanger ? '確定' : '我知道了'}</button></div>
                </div>
            </div>
        );
    };
    return { confirm, ConfirmDialog };
};

const useMessageModal = () => {
    const [msgState, setMsgState] = useState({ isOpen: false, title: '通知訊息預覽', content: '', link: '' });
    const openMessage = (title, content, link = '') => { setMsgState({ isOpen: true, title, content, link }); };
    const closeMessage = () => setMsgState(prev => ({ ...prev, isOpen: false }));
    const MessageModal = () => {
        const [text, setText] = useState(msgState.content); const [copyStatus, setCopyStatus] = useState('複製內容');
        useEffect(() => { setText(msgState.content); setCopyStatus('複製內容'); }, [msgState.content, msgState.isOpen]);
        if (!msgState.isOpen) return null;
        const handleCopy = () => { const textarea = document.createElement('textarea'); textarea.value = text; document.body.appendChild(textarea); textarea.select(); try { document.execCommand('copy'); setCopyStatus('已複製！'); setTimeout(() => setCopyStatus('複製內容'), 2000); } catch (err) { alert('複製失敗'); } document.body.removeChild(textarea); };
        return (
            <div className="fixed inset-0 bg-slate-900/40 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full flex flex-col max-h-[90vh] border border-white/20"><div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3"><div className="flex items-center gap-2 text-slate-800 font-bold text-lg"><div className="p-2 bg-green-50 rounded-full"><MessageCircle className="text-[#06C755]" size={20} /></div><h3>{msgState.title}</h3></div><button onClick={closeMessage} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition"><X size={20} /></button></div><div className="mb-4"><p className="text-sm text-slate-500 mb-2">已自動儲存工單。您可以編輯以下內容並傳送：</p><textarea className="w-full h-48 md:h-64 p-4 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-slate-50 outline-none transition" value={text} onChange={(e) => setText(e.target.value)} /></div>{msgState.link && (<div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-blue-700 text-sm overflow-hidden"><LinkIcon size={16} className="shrink-0" /><span className="truncate">偵測到連結，可直接開啟測試：</span></div><a href={msgState.link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1 shrink-0 shadow-sm">開啟 <ExternalLink size={12} /></a></div>)}<div className="flex flex-col sm:flex-row gap-3 justify-end mt-auto"><button onClick={handleCopy} className={`px-5 py-2.5 text-white rounded-xl shadow-md transition font-medium text-sm flex items-center justify-center gap-2 w-full sm:w-auto ${copyStatus === '已複製！' ? 'bg-slate-700' : 'bg-[#06C755] hover:bg-[#05b34c]'}`}>{copyStatus === '已複製！' ? <Check size={16} /> : <Copy size={16} />}{copyStatus}</button></div></div>
            </div>
        );
    };
    return { openMessage, MessageModal };
};

const useFirestoreList = (user, docName, defaultValue) => {
    const [data, setData] = useState(defaultValue); const [loading, setLoading] = useState(true);
    useEffect(() => { if (!user) { setLoading(false); return; } const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', docName); const unsubscribe = onSnapshot(docRef, (snapshot) => { if (snapshot.exists()) { setData(snapshot.data().value); } else { setData(defaultValue); } setLoading(false); }, (error) => { console.error(error); setLoading(false); }); return () => unsubscribe(); }, [user, docName]);
    const updateData = async (newData) => { if (!user) return; const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', docName); try { await setDoc(docRef, { value: newData }); } catch (e) { alert("儲存失敗，請檢查網路連線"); } };
    return [data, updateData, loading];
};

const useCollectionList = (user, collectionName, defaultValue = []) => {
    const [data, setData] = useState(defaultValue); const [loading, setLoading] = useState(true);
    useEffect(() => { if (!user) { setLoading(false); return; } const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName); const q = query(colRef); const unsubscribe = onSnapshot(q, (snapshot) => { const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); setData(list); setLoading(false); }, (error) => { console.error(error); setLoading(false); }); return () => unsubscribe(); }, [user, collectionName]);
    return [data, loading];
};

const DEFAULT_STAFF_LIST = ['Patty', 'Martin', 'Owen'];
const DEFAULT_CYCLES = ['7天', '14天', '1個月', '3個月', '6個月', '1年', '2年']; 
const DEFAULT_SERVICE_ITEMS = ['安裝', '拆除', '檢修', '保養', '設定調整', '測試'];
const DEFAULT_LOCATION_TYPES = ['商辦', '廠區']; 
const DEFAULT_CUSTOMERS = [ { name: '科技大樓站', address: '台北市大安區復興南路二段', type: '商辦' }, { name: '台北車站', address: '台北市中正區北平西路3號', type: '商辦' }, { name: '市政府站', address: '台北市信義區忠孝東路五段', type: '商辦' }, { name: '南港展覽館', address: '台北市南港區經貿二路', type: '商辦' }, { name: '西門站', address: '台北市萬華區寶慶路', type: '商辦' }, { name: '松山機場站', address: '台北市松山區敦化北路', type: '商辦' }, { name: '大安森林公園站', address: '台北市大安區信義路三段', type: '商辦' }, { name: '五股一廠', address: '新北市五股區五權路', type: '廠區' }, { name: '林口二廠', address: '新北市林口區文化一路', type: '廠區' } ];
const DEFAULT_STATIONS = ['B1 機房', 'B2 機房', '1F 大廳', '2F 月台', 'R 層', '戶外區', '行控中心'];
const DEFAULT_EQUIPMENT = ['空調箱 (AHU)', '送風機 (FCU)', '冰水主機', '冷卻水塔', '通風扇', '配電盤', '發電機', '監視攝影機', '消防泵浦'];
const DEFAULT_SPECS = ['20RT', '50RT', '100RT', '10HP', '20HP', '200A', '400A', '1000KW', '變頻式', '標準型'];
const DEFAULT_PARTS = ['濾網 (50x50)', '皮帶 (A-30)', '接觸器 (Mg)', '保險絲', '軸承', '扇葉', '冷媒 (R410A)', '燈管', '控制機板'];
const DEFAULT_CHECKLIST_TEMPLATE = ["箱內清潔", "箱體風扇運轉是否正常", "設備風扇運轉是否正常", "門板按鈕/開關功能測試是否正常", "門板指示燈測試是否正常", "濾網清潔", "接點端子緊固", "接地線檢查", "電池外觀檢查", "系統錯誤碼檢查"];
const DEFAULT_PERMISSIONS = { showAssets: true, showInventory: true, showStats: true, showSchedule: true, allowDelete: true, adminPassword: 'admin' };
const STATUS_OPTIONS = ['待處理', '已建立', '已讀取', '進行中', '已完成', '已結案', '待補全', '待追蹤', '需複查', '正常'];

const DEFAULT_ASSET_DATA = { name: '', brand: '', model: '', serialNumber: '', installationDate: '', warrantyDate: '', customerName: '', location: '', notes: '', image: '', images: [], status: '使用中', scrapInfo: null };
const DEFAULT_INVENTORY_ITEM = { name: '', model: '', serialNumber: '', category: '耗材', quantity: 0, safeStock: 5, unit: '個', location: '', notes: '', lastRestockDate: '', usageLog: [], image: '', images: [] };
const DEFAULT_DISPATCH_DATA = { date: new Date().toISOString().slice(0, 10), constructionDate: '', isMultiDay: false, constructionEndDate: '', customerName: '', customerAddress: '', locationType: '', contactPerson: '', contactPhone: '', hasLine: false, station: '', equipment: '', assetId: '', spec: '', dispatcher: '', serviceEngineer: '', assistants: [], serviceItem: '', reportTime: '', replyTime: '', description: '', photoIssue: '', status: '待處理' };
const DEFAULT_MAINTENANCE_DATA = { date: new Date().toISOString().slice(0, 10), customerName: '', customerAddress: '', locationType: '', contactPerson: '', contactPhone: '', hasLine: false, station: '', equipment: '', assetId: '', spec: '', cycle: '', serviceEngineer: '', assistants: [], arrivalTime: '', completionTime: '', ac_rt: '', ac_s_amp: '', ac_t_amp: '', checklist: [], replacedParts: [], remarks: '', customerSignature: '', engineerSignature: '', photoBefore: '', photoAfter: '', status: '進行中', testOk: false, dismantledDescription: '', dismantledParts: [], dismantledProcessed: false };
const DEFAULT_REPAIR_DATA = { date: new Date().toISOString().slice(0, 10), customerName: '', customerAddress: '', locationType: '', contactPerson: '', contactPhone: '', station: '', equipment: '', assetId: '', spec: '', serviceItem: '', serviceEngineer: '', assistants: [], arrivalTime: '', completionTime: '', description: '', causeAnalysis: '', solution: '', testOk: false, revisitNeeded: null, replacedParts: [], customerSignature: '', engineerSignature: '', photoBefore: '', photoAfter: '', status: '進行中', dismantledDescription: '', dismantledParts: [], dismantledProcessed: false };
const DEFAULT_CONSTRUCTION_DATA = { date: new Date().toISOString().slice(0, 10), customerName: '', customerAddress: '', locationType: '', contactPerson: '', contactPhone: '', station: '', equipment: '', assetId: '', spec: '', serviceItem: '施工', serviceEngineer: '', assistants: [], arrivalTime: '', completionTime: '', description: '', constructionDetails: '', testOk: false, revisitNeeded: null, replacedParts: [], customerSignature: '', engineerSignature: '', photoBefore: '', photoAfter: '', status: '進行中', dismantledDescription: '', dismantledParts: [], dismantledProcessed: false };
const DEFAULT_SCHEDULE_DATA = { customerName: '', customerAddress: '', locationType: '', station: '', equipment: '', assetId: '', cycle: '半年', lastMaintenanceDate: new Date().toISOString().slice(0, 10), nextMaintenanceDate: '', serviceEngineer: '', contactPerson: '' };
const DEFAULT_CAPA_DATA = { date: new Date().toISOString().slice(0, 10), sourceOrderId: '', customerName: '', customerAddress: '', locationType: '', contactPerson: '', contactPhone: '', station: '', equipment: '', assetId: '', spec: '', problemDescription: '', rootCauseAnalysis: '', correctiveAction: '', preventiveAction: '', serviceEngineer: '', assistants: [], testOk: false, revisitNeeded: null, customerSignature: '', engineerSignature: '', photoBefore: '', photoAfter: '', status: '進行中' };

const compressImage = (file) => new Promise((resolve) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (event) => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; const MAX_HEIGHT = 600; let width = img.width; let height = img.height; if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.5)); }; }; });
const downloadImage = (e, base64Data, filenamePrefix = 'photo') => { e.preventDefault(); e.stopPropagation(); if (!base64Data) return; const link = document.createElement('a'); link.href = base64Data; link.download = `${filenamePrefix}_${new Date().getTime()}.jpg`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
const calculateNextDate = (lastDate, cycle) => { if (!lastDate || !cycle) return ''; const date = new Date(lastDate); if (cycle === '半年') { date.setMonth(date.getMonth() + 6); return date.toISOString().slice(0, 10); } if (cycle === '一年') { date.setFullYear(date.getFullYear() + 1); return date.toISOString().slice(0, 10); } const dayMatch = cycle.match(/(\d+)\s*(天|日)/); if (dayMatch) { date.setDate(date.getDate() + parseInt(dayMatch[1])); return date.toISOString().slice(0, 10); } const weekMatch = cycle.match(/(\d+)\s*週/); if (weekMatch) { date.setDate(date.getDate() + parseInt(weekMatch[1]) * 7); return date.toISOString().slice(0, 10); } const monthMatch = cycle.match(/(\d+)\s*(個月|月)/); if (monthMatch) { date.setMonth(date.getMonth() + parseInt(monthMatch[1])); return date.toISOString().slice(0, 10); } const yearMatch = cycle.match(/(\d+)\s*年/); if (yearMatch) { date.setFullYear(date.getFullYear() + parseInt(yearMatch[1])); return date.toISOString().slice(0, 10); } return ''; };
const getStatusColor = (nextDate) => { if (!nextDate) return 'text-slate-400'; const today = new Date(); today.setHours(0,0,0,0); const target = new Date(nextDate); const diffTime = target - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays < 0) return 'text-red-600 font-bold'; if (diffDays <= 7) return 'text-amber-500 font-bold'; return 'text-emerald-600'; };
const getStatusText = (nextDate) => { if (!nextDate) return '未排程'; const today = new Date(); today.setHours(0,0,0,0); const target = new Date(nextDate); const diffTime = target - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays < 0) return `已過期 ${Math.abs(diffDays)} 天`; if (diffDays === 0) return '今天到期'; if (diffDays <= 7) return `剩餘 ${diffDays} 天`; return '排程中'; };
const getOrderStatusBadge = (order) => { 
    let status = order.status || '進行中'; 
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200/60'; 
    let icon = HelpCircle; 
    
    if (status === '已完成' || status === '已結案' || status === '正常') { colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm'; icon = CheckCircle; } 
    else if (status === '待補全') { colorClass = 'bg-orange-50 text-orange-700 border-orange-200/60 shadow-sm'; icon = AlertTriangle; } 
    else if (status === '待追蹤' || status === '需複查') { colorClass = 'bg-amber-50 text-amber-700 border-amber-200/60 shadow-sm'; icon = AlertCircle; } 
    else if (status === '待處理' || status === '已建立') { colorClass = 'bg-blue-50 text-blue-700 border-blue-200/60 shadow-sm'; icon = Clock; } 
    else if (status === '已讀取') { colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200/60 shadow-sm'; icon = Eye; } 
    else if (status === '進行中') { colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200/60 shadow-sm'; icon = Timer; } 
    
    const IconComp = icon; 
    return (<span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${colorClass}`}><IconComp size={14} />{status}</span>); 
};
const getConstructionStatus = (dateStr) => { if (!dateStr) return null; const today = new Date(); today.setHours(0, 0, 0, 0); const target = new Date(dateStr); const diffTime = target - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays < 0) return { type: 'overdue', label: `已過期 ${Math.abs(diffDays)} 天`, color: 'bg-red-100 text-red-700 border-red-200 font-bold' }; if (diffDays === 0) return { type: 'today', label: '🔥 今天施工', color: 'bg-red-500 text-white border-red-600 animate-pulse font-bold shadow-md' }; if (diffDays <= 3) return { type: 'urgent', label: `⚠️ 剩餘 ${diffDays} 天`, color: 'bg-amber-100 text-amber-700 border-amber-200 font-bold' }; if (diffDays <= 7) return { type: 'upcoming', label: `即將到來 (${diffDays}天)`, color: 'bg-blue-50 text-blue-600 border-blue-100' }; return null; };
const getWarrantyStatus = (warrantyDate) => {
    if (!warrantyDate) return { text: '未知', color: 'bg-slate-100 text-slate-500 border-slate-200' }; const today = new Date(); today.setHours(0,0,0,0); const target = new Date(warrantyDate); if (target < today) return { text: '已過保', color: 'bg-red-50 text-red-600 border-red-200' }; const diffTime = target - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays <= 90) return { text: '即將過保', color: 'bg-amber-50 text-amber-600 border-amber-200' }; return { text: '保固中', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }; 
};

// 取得當下 local 的 datetime-local 格式字串 (YYYY-MM-DDThh:mm)
const getNowLocalString = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
};

const checkCompleteness = (order, type) => { 
    const missing = []; const currentType = type || order.type;
    if (['maintenance', 'repair', 'construction', 'capa'].includes(currentType)) {
        if (!order.engineerSignature) missing.push('工程師簽名'); 
        if (!order.customerSignature) missing.push('客戶簽名');
        if (currentType !== 'capa') { if (!order.arrivalTime) missing.push('到廠時間'); if (!order.completionTime) missing.push('完工時間'); }
    }
    if (currentType === 'dispatch') { if (!order.customerName) missing.push('客戶名稱'); if (!order.dispatcher) missing.push('派工人員'); if (!order.serviceEngineer) missing.push('服務工程師'); if (!order.serviceItem) missing.push('工作項目'); } 
    else if (currentType === 'maintenance') { const uncheckedItems = (order.checklist || []).filter(i => !i.ok && !i.ng); if (uncheckedItems.length > 0) missing.push(`尚有 ${uncheckedItems.length} 個檢查項目未勾選`); if (!order.remarks) missing.push('工況描述 (備註說明)'); if (!order.testOk) missing.push('保養作業完成確認'); } 
    else if (currentType === 'repair') { if (!order.description) missing.push('故障情形描述'); if (!order.causeAnalysis) missing.push('故障原因'); if (!order.solution) missing.push('解決方式'); if (!order.testOk) missing.push('復歸測試正常 (完工確認)'); } 
    else if (currentType === 'construction') { if (!order.constructionDetails) missing.push('施作內容詳述'); if (!order.testOk) missing.push('完工驗收正常 (完工確認)'); } 
    else if (currentType === 'capa') { if (!order.problemDescription) missing.push('異常狀況描述'); if (!order.rootCauseAnalysis) missing.push('根本原因分析'); if (!order.correctiveAction) missing.push('矯正措施'); if (!order.preventiveAction) missing.push('預防措施'); if (!order.testOk) missing.push('驗證正常 (完工確認)'); }
    return missing; 
};

const calculateOrderStatus = (data, type) => { if (type === 'dispatch') return data.status || '待處理'; const missingFields = checkCompleteness(data, type); const isDataComplete = missingFields.length === 0; if (type === 'maintenance') { if (data.completionTime) return isDataComplete ? '已完成' : '待補全'; return '進行中'; } if (type === 'repair' || type === 'construction' || type === 'capa') { if (data.revisitNeeded === false && data.testOk) return isDataComplete ? '已結案' : '待補全'; if (data.revisitNeeded === true) return '待追蹤'; return '進行中'; } return '進行中'; };
const formatEngineerTeam = (primary, assistants) => { const primaryText = primary || '未指定'; const assistantText = (assistants && assistants.length > 0) ? ` (協: ${assistants.join(', ')})` : ''; return `${primaryText}${assistantText}`; };
const formatDispatchMessage = (data, customBaseUrl) => { const engineerTeam = formatEngineerTeam(data.serviceEngineer, data.assistants); let link = 'https://example.com/form'; if (customBaseUrl) { link = `${customBaseUrl}?id=${data.id}`; } else if (typeof window !== 'undefined') { const baseUrl = window.location.href.split('?')[0]; link = `${baseUrl}?id=${data.id}`; } const constDateStr = data.isMultiDay && data.constructionEndDate ? `${data.constructionDate} ~ ${data.constructionEndDate}` : (data.constructionDate || '未定'); return { text: `【派工單通知】\n單號：${data.id || '尚未儲存'}\n填單連結：${link}\n填單日期：${data.date}\n預定施工日：${constDateStr}\n客戶：${data.customerName} (${data.locationType || '未指定'})\n地址：${data.customerAddress || '無'}\n站別：${data.station || '無'}\n派工人員：${data.dispatcher}\n工程師：${engineerTeam}\n設備：${data.equipment} (${data.spec || '無規格'})\n工況描述：${data.description || '無'}\n狀態：${data.status || '處理中'}`, link: link }; };
const formatPartsList = (parts) => { if (!parts || parts.length === 0) return '無'; return parts.map(p => `- ${p.name} ${p.model ? `(${p.model})` : ''} x ${p.qty} ${p.isWarranty ? '[保固]' : ''}${p.isQuote ? '[報價]' : ''}${p.isSecondhand ? '[二手]' : ''}${p.serialNumbers?.length ? ` (S/N: ${p.serialNumbers.filter(Boolean).join(',')})` : ''}`).join('\n'); };
const formatMaintenanceMessage = (data) => { const checklist = data.checklist || []; const ngItems = checklist.filter(item => item.ng).map(item => item.name).join(', '); const result = ngItems ? `⚠️ 異常項目：${ngItems}` : '✅ 檢查項目全數正常'; const partsText = formatPartsList(data.replacedParts); const engineerTeam = formatEngineerTeam(data.serviceEngineer, data.assistants); const dateStr = data.isMultiDay && data.endDate ? `${data.date} ~ ${data.endDate}` : data.date; return `【保養單完成通知】\n單號：${data.id || '尚未儲存'}\n日期：${dateStr}\n客戶：${data.customerName}\n站別：${data.station || '無'}\n設備：${data.equipment}\n工程師：${engineerTeam}\n------------------\n${result}\n------------------\n[量測數據]\n電壓 AC (RT/ST/RS): ${data.ac_rt || 0}/${data.ac_st || 0}/${data.ac_rs || 0} V\n電壓 DC: ${data.dc_v || 0} V\n電流 AC (R/S/T): ${data.ac_r_amp || 0}/${data.ac_s_amp || 0}/${data.ac_t_amp || 0} A\n------------------\n[零件更換]\n${partsText}\n------------------\n備註：${data.remarks || '無'}`; };
const formatRepairMessage = (data) => { const partsText = formatPartsList(data.replacedParts); const engineerTeam = formatEngineerTeam(data.serviceEngineer, data.assistants); const dateStr = data.isMultiDay && data.endDate ? `${data.date} ~ ${data.endDate}` : data.date; return `【報修單結案報告】\n單號：${data.id || '尚未儲存'}\n日期：${dateStr}\n客戶：${data.customerName}\n站別：${data.station || '無'}\n設備：${data.equipment}\n工程師：${engineerTeam}\n------------------\n故障原因：${data.causeAnalysis || '未填寫'}\n解決方式：${data.solution || '未填寫'}\n------------------\n[更換零件]\n${partsText}\n------------------\n復工測試：${data.testOk ? '正常' : '待確認'}\n後續追蹤：${data.revisitNeeded ? '需要再訪' : '結案'}`; };
const formatConstructionMessage = (data) => { const partsText = formatPartsList(data.replacedParts); const engineerTeam = formatEngineerTeam(data.serviceEngineer, data.assistants); const dateStr = data.isMultiDay && data.endDate ? `${data.date} ~ ${data.endDate}` : data.date; return `【施工單結案報告】\n單號：${data.id || '尚未儲存'}\n日期：${dateStr}\n客戶：${data.customerName}\n站別：${data.station || '無'}\n設備：${data.equipment}\n工程師：${engineerTeam}\n------------------\n施工描述：${data.description || '未填寫'}\n施作內容：${data.constructionDetails || '未填寫'}\n------------------\n[使用材料/零件]\n${partsText}\n------------------\n完工測試：${data.testOk ? '正常' : '待確認'}\n後續追蹤：${data.revisitNeeded ? '需要再訪' : '結案'}`; };
const formatCapaMessage = (data) => { const engineerTeam = formatEngineerTeam(data.serviceEngineer, data.assistants); const dateStr = data.isMultiDay && data.endDate ? `${data.date} ~ ${data.endDate}` : data.date; return `【矯正預防措施(CAPA)報告】\n單號：${data.id || '尚未儲存'}\n日期：${dateStr}\n關聯單號：${data.sourceOrderId || '無'}\n客戶：${data.customerName}\n設備：${data.equipment}\n負責人：${engineerTeam}\n------------------\n[根本原因]\n${data.rootCauseAnalysis || '未填寫'}\n------------------\n[措施計畫]\n矯正：${data.correctiveAction || '未填寫'}\n預防：${data.preventiveAction || '未填寫'}\n------------------\n驗證結果：${data.testOk ? '驗證通過結案' : '待持續追蹤'}`; };

const Card = ({ children, className = "" }) => (<div className={`bg-white rounded-[24px] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-100/80 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] ${className}`}>{children}</div>);
const Label = ({ children, required, className = "" }) => (<label className={`block text-sm font-bold text-slate-700 mb-2 tracking-wide ${className}`}>{children}{required && <span className="text-rose-500 ml-1">*</span>}</label>);

const INPUT_BASE_CLASS = "w-full sm:text-sm p-3.5 transition-all duration-200 outline-none placeholder:text-slate-400";
const INPUT_EDITABLE_CLASS = "rounded-2xl border border-slate-200 shadow-sm bg-white hover:border-blue-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15";
const INPUT_READONLY_CLASS = "rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 shadow-none text-slate-500 cursor-not-allowed";

const Input = ({ type = "text", value, disabled, readOnly, className = "", ...props }) => {
    const isNonEditable = disabled || readOnly;
    return (<input type={type} className={`${INPUT_BASE_CLASS} ${isNonEditable ? INPUT_READONLY_CLASS : INPUT_EDITABLE_CLASS} ${className}`} value={value || ''} disabled={disabled} readOnly={readOnly} {...props} />);
};
const Select = ({ options = [], value, disabled, readOnly, className = "", ...props }) => {
    const isNonEditable = disabled || readOnly;
    return (<select className={`${INPUT_BASE_CLASS} appearance-none cursor-pointer ${isNonEditable ? INPUT_READONLY_CLASS : INPUT_EDITABLE_CLASS} ${className}`} value={value || ''} disabled={disabled} readOnly={readOnly} {...props}><option value="">請選擇...</option>{options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select>);
};
const DatalistInput = ({ options = [], value, listId, disabled, readOnly, className = "", ...props }) => {
    const isNonEditable = disabled || readOnly;
    return (<><input list={listId} className={`${INPUT_BASE_CLASS} ${isNonEditable ? INPUT_READONLY_CLASS : INPUT_EDITABLE_CLASS} ${className}`} value={value || ''} disabled={disabled} readOnly={readOnly} {...props} /><datalist id={listId}>{options.map(opt => (<option key={opt} value={opt} />))}</datalist></>);
};
const Textarea = ({ value, disabled, readOnly, className = "", ...props }) => {
    const isNonEditable = disabled || readOnly;
    return (<textarea className={`${INPUT_BASE_CLASS} ${isNonEditable ? INPUT_READONLY_CLASS : INPUT_EDITABLE_CLASS} ${className}`} value={value || ''} disabled={disabled} readOnly={readOnly} {...props} />);
};

const SectionTitle = ({ title, icon: Icon, className = "mt-8" }) => (<div className={`flex items-center gap-3 mb-6 pb-3 border-b border-slate-100 text-slate-800 font-bold text-lg tracking-wide ${className}`}>{Icon && <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl text-slate-600 shadow-inner"><Icon size={20} /></div>}<h3>{title}</h3></div>);
const PhotoUpload = ({ label, value, onChange, disabled = false }) => {
    const fileInputRef = useRef(null); 
    const [isCompressing, setIsCompressing] = useState(false); 
    const { confirm, ConfirmDialog } = useConfirm(); 
    
    const handleFileChange = async (e) => { 
        const file = e.target.files[0]; 
        if (file) { 
            setIsCompressing(true); 
            try { 
                const compressedBase64 = await compressImage(file); 
                onChange(compressedBase64); 
            } catch (error) { 
                console.error("Compression failed", error); 
                alert("照片處理失敗，請重試"); 
            } finally { 
                setIsCompressing(false); 
            } 
        } 
    }; 
    
    const handleRemove = () => { 
        confirm({ 
            title: "移除照片", 
            message: "確定要移除這張照片嗎？", 
            onConfirm: () => { 
                onChange(''); 
                if (fileInputRef.current) fileInputRef.current.value = ''; 
            } 
        }); 
    }; 
    
    return (
        <div className="w-full">
            <ConfirmDialog />
            <Label>{label}</Label>
            <div className={`border-2 border-dashed rounded-2xl h-48 flex items-center justify-center bg-slate-50 relative overflow-hidden transition ${value ? 'border-emerald-400' : 'border-slate-200 hover:border-blue-400'}`}>
                {isCompressing && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <span className="text-blue-600 font-medium animate-pulse">處理中...</span>
                    </div>
                )}
                {value ? (
                    <div className="relative w-full h-full group">
                        <img src={value} alt="Preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                            <button type="button" onClick={(e) => downloadImage(e, value, 'photo')} className="bg-blue-500/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition" title="下載照片">
                                <Download size={16} />
                            </button>
                            {!disabled && (
                                <button type="button" onClick={handleRemove} className="bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition" title="移除照片">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`flex flex-col items-center justify-center text-slate-400 gap-3 cursor-pointer w-full h-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !disabled && fileInputRef.current.click()}>
                        <div className="p-3 bg-white rounded-full shadow-sm"><Camera size={28} className="text-slate-300" /></div>
                        <span className="text-sm font-medium">點擊拍攝或上傳</span><span className="text-xs text-slate-400">(系統將自動壓縮)</span>
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} disabled={disabled} />
            </div>
        </div>
    ); 
};

const MultiPhotoUpload = ({ label, images = [], onChange, disabled = false }) => {
    const fileInputRef = useRef(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setIsCompressing(true);
            try {
                const newImages = await Promise.all(files.map(file => compressImage(file)));
                onChange([...images, ...newImages]);
            } catch (error) {
                console.error("Compression failed", error);
                alert("照片處理失敗，請重試");
            } finally {
                setIsCompressing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (indexToRemove) => {
        confirm({
            title: "移除照片",
            message: "確定要移除這張照片嗎？",
            onConfirm: () => {
                onChange(images.filter((_, index) => index !== indexToRemove));
            }
        });
    };

    return (
        <div className="w-full">
            <ConfirmDialog />
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-4">
                {images.map((img, index) => (
                    <div key={index} className="relative w-24 h-24 md:w-32 md:h-32 border border-slate-200 rounded-2xl bg-white flex items-center justify-center overflow-hidden group">
                        <img src={img} alt={`Preview ${index}`} className="w-full h-full object-contain p-1" />
                        <div className="absolute top-1 right-1 flex flex-col gap-1.5 z-20 opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => downloadImage(e, img, `photo_${index}`)} className="bg-blue-500/80 backdrop-blur-sm text-white p-1.5 rounded-full shadow hover:bg-blue-600 transition" title="下載照片">
                                <Download size={14} />
                            </button>
                            {!disabled && (
                                <button type="button" onClick={() => handleRemove(index)} className="bg-red-500/80 backdrop-blur-sm text-white p-1.5 rounded-full shadow hover:bg-red-600 transition md:opacity-0 group-hover:opacity-100" title="移除照片">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {!disabled && (
                    <div className={`w-24 h-24 md:w-32 md:h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden transition hover:border-blue-400 cursor-pointer ${isCompressing ? 'border-blue-300' : 'border-slate-200'}`} onClick={() => !disabled && !isCompressing && fileInputRef.current.click()}>
                        {isCompressing ? (
                            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1"></div>
                                <span className="text-blue-600 font-medium text-[10px]">處理中</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-2 bg-white rounded-full shadow-sm mb-1"><Camera size={20} className="text-slate-400" /></div>
                                <span className="text-xs font-medium text-slate-500 text-center">新增照片</span>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple capture="environment" onChange={handleFileChange} disabled={disabled || isCompressing} />
                    </div>
                )}
            </div>
        </div>
    );
};

const SignaturePad = ({ label, value, onChange, disabled = false }) => { const canvasRef = useRef(null); const [isDrawing, setIsDrawing] = useState(false); useEffect(() => { const canvas = canvasRef.current; if (canvas && value) { const ctx = canvas.getContext('2d'); const img = new Image(); img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); }; img.src = value; } }, []); const getCoordinates = (event) => { if (!canvasRef.current) return; const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect(); let clientX, clientY; if (event.touches && event.touches.length > 0) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; } else { clientX = event.clientX; clientY = event.clientY; } return { x: clientX - rect.left, y: clientY - rect.top }; }; const startDrawing = (event) => { if (disabled) return; event.preventDefault(); setIsDrawing(true); const coords = getCoordinates(event); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'; ctx.moveTo(coords.x, coords.y); }; const draw = (event) => { if (!isDrawing || disabled) return; event.preventDefault(); const coords = getCoordinates(event); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(coords.x, coords.y); ctx.stroke(); }; const stopDrawing = () => { if (disabled) return; if (isDrawing) { setIsDrawing(false); const canvas = canvasRef.current; onChange(canvas.toDataURL()); } }; const clearSignature = () => { if (disabled) return; const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); onChange(''); }; return (<div className="w-full"><Label>{label}</Label><div className="border border-slate-200 rounded-2xl overflow-hidden bg-white touch-none relative" style={{ height: '160px' }}>{disabled && !value && (<div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm bg-slate-50">未簽署</div>)}{disabled && value && (<img src={value} alt="Signature" className="w-full h-full object-contain" />)}<canvas ref={canvasRef} width={400} height={160} className={`w-full h-full ${disabled ? 'hidden' : 'block cursor-crosshair'}`} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} /></div>{!disabled && (<button type="button" onClick={clearSignature} className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg transition"><Eraser size={12} /> 清除重簽</button>)}</div>); };
const SimplePieChart = ({ title, percentage, color, subText, icon: Icon }) => { const radius = 30; const circumference = 2 * Math.PI * radius; const offset = circumference - (percentage / 100) * circumference; const getColorHex = (c) => { if (c.includes('emerald')) return '#10b981'; if (c.includes('amber')) return '#f59e0b'; if (c.includes('blue')) return '#3b82f6'; if (c.includes('red')) return '#ef4444'; return '#cbd5e1'; }; const strokeColor = getColorHex(color); return ( <div className="flex flex-col items-center p-2"> <h4 className="text-slate-600 font-semibold mb-2 flex items-center gap-2 text-sm">{Icon && <Icon size={16} />}{title}</h4> <div className="relative w-28 h-28"> <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80"> <circle cx="40" cy="40" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="transparent" /> <circle cx="40" cy="40" r={radius} stroke={strokeColor} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" /> </svg> <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-xl font-bold ${color.replace('bg-', 'text-').replace('-500', '-600')}`}>{percentage}%</span></div> </div> <p className="text-xs text-slate-400 mt-2">{subText}</p> </div> ); };
const DualBarChart = ({ data, color1, color2, label1, label2, height = 200 }) => { if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-slate-300">尚無數據</div>; return ( <div className="w-full overflow-x-auto"> <div className="flex items-end justify-start gap-4 px-2 pt-8 pb-2 min-w-max" style={{ height: `${height + 40}px` }}> {data.map((d, i) => ( <div key={i} className="flex flex-col items-center min-w-[80px] group relative h-full justify-end"> <div className="flex gap-1 items-end h-full w-full justify-center px-2"> <div className="relative flex flex-col items-center justify-end h-full w-4 md:w-6"><div className={`w-full rounded-t-sm transition-all duration-700 ease-out ${color1} opacity-90 hover:opacity-100`} style={{ height: `${d.value1}%`, minHeight: '4px' }}><div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 border rounded shadow-sm z-10 whitespace-nowrap">{d.value1}%</div></div></div> <div className="relative flex flex-col items-center justify-end h-full w-4 md:w-6"><div className={`w-full rounded-t-sm transition-all duration-700 ease-out ${color2} opacity-90 hover:opacity-100`} style={{ height: `${d.value2}%`, minHeight: '4px' }}><div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 border rounded shadow-sm z-10 whitespace-nowrap">{d.value2}%</div></div></div> </div> <p className="text-xs text-slate-500 mt-2 text-center truncate w-full px-1" title={d.label}>{d.label}</p> </div> ))} </div> <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-slate-100"> <div className="flex items-center gap-1 text-xs text-slate-600"><div className={`w-3 h-3 rounded-sm ${color1}`}></div>{label1}</div> <div className="flex items-center gap-1 text-xs text-slate-600"><div className={`w-3 h-3 rounded-sm ${color2}`}></div>{label2}</div> </div> </div> ); };
const GenericPieChart = ({ data }) => { if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-slate-300">尚無數據</div>; const total = data.reduce((sum, item) => sum + item.value, 0); let currentAngle = 0; const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6']; if (data.length === 1) { return ( <div className="flex flex-col md:flex-row items-center justify-center gap-6 h-full p-2"> <div className="relative w-32 h-32 shrink-0"><svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full"><circle cx="0" cy="0" r="1" fill={colors[0]} /><circle cx="0" cy="0" r="0.6" fill="white" /></svg><div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-xs text-slate-500">總計</span><span className="text-xl font-bold text-slate-700">{total}</span></div></div> <div className="flex-1 w-full"><div className="flex items-center justify-between text-sm mb-1"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[0] }}></span><span className="text-slate-600 font-medium">{data[0].label}</span></div><span className="font-bold text-slate-700">{data[0].value} (100%)</span></div></div> </div> ) } return ( <div className="flex flex-col md:flex-row items-center justify-center gap-6 h-full p-2"> <div className="relative w-36 h-36 shrink-0"><svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">{data.map((item, index) => { const sliceAngle = (item.value / total) * 2 * Math.PI; const x1 = Math.cos(currentAngle); const y1 = Math.sin(currentAngle); const x2 = Math.cos(currentAngle + sliceAngle); const y2 = Math.sin(currentAngle + sliceAngle); const isLargeArc = sliceAngle > Math.PI ? 1 : 0; const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${isLargeArc} 1 ${x2} ${y2} Z`; currentAngle += sliceAngle; return (<path key={index} d={pathData} fill={colors[index % colors.length]} stroke="white" strokeWidth="0.05" className="hover:opacity-80 transition-opacity cursor-pointer"><title>{`${item.label}: ${item.value}`}</title></path>); })}<circle cx="0" cy="0" r="0.6" fill="white" /></svg><div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-xs text-slate-500 font-medium">總計</span><span className="text-lg font-bold text-slate-700">{parseFloat(total.toFixed(1))}</span></div></div> <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">{data.map((item, index) => (<div key={index} className="flex items-center justify-between text-sm group"><div className="flex items-center gap-2 overflow-hidden"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></span><span className="text-slate-600 truncate" title={item.label}>{item.label}</span></div><div className="flex items-center gap-2 shrink-0"><span className="font-bold text-slate-700">{item.value}</span><span className="text-xs text-slate-400 w-10 text-right">{Math.round((item.value/total)*100)}%</span></div></div>))}</div> </div> ); };
const EngineerTeamSelector = ({ staffList, primary, assistants = [], onChange, labelPrimary = "服務工程師" }) => { const [selectedAssistant, setSelectedAssistant] = useState(''); const handleAddAssistant = () => { if (selectedAssistant && !assistants.includes(selectedAssistant)) { onChange({ primary, assistants: [...assistants, selectedAssistant] }); setSelectedAssistant(''); } }; const handleRemoveAssistant = (name) => { onChange({ primary, assistants: assistants.filter(a => a !== name) }); }; const handlePrimaryChange = (e) => { const newPrimary = e.target.value; let newAssistants = assistants; if (assistants.includes(newPrimary)) { newAssistants = assistants.filter(a => a !== newPrimary); } onChange({ primary: newPrimary, assistants: newAssistants }); }; const availableAssistants = staffList.filter(s => s !== primary && !assistants.includes(s)); return ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div><Label required>{labelPrimary}</Label><Select value={primary} onChange={handlePrimaryChange} options={staffList} /></div> <div><Label>協助工程師</Label><div className="flex gap-2 mb-2"><select className={`flex-1 ${INPUT_BASE_CLASS.replace('w-full', '')} appearance-none cursor-pointer ${INPUT_EDITABLE_CLASS}`} value={selectedAssistant} onChange={(e) => setSelectedAssistant(e.target.value)}><option value="">選擇協助人員...</option>{availableAssistants.map(s => <option key={s} value={s}>{s}</option>)}</select><button type="button" onClick={handleAddAssistant} disabled={!selectedAssistant} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition"><Plus size={18} /></button></div><div className="flex flex-wrap gap-2 min-h-[24px]">{assistants.length > 0 ? assistants.map(a => (<span key={a} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-slate-200 animate-in fade-in zoom-in duration-200">{a}<button type="button" onClick={() => handleRemoveAssistant(a)} className="text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 p-0.5"><X size={12} /></button></span>)) : <span className="text-xs text-slate-400 py-1">無協助人員</span>}</div></div> </div> ); };

const ReplacementPartManager = ({ partsList, inventoryItems, replacedParts = [], onUpdate, listIdPrefix }) => {
    const [partName, setPartName] = useState('');
    const [model, setModel] = useState('');
    const [qty, setQty] = useState('');
    const [isWarranty, setIsWarranty] = useState(false);
    const [isQuote, setIsQuote] = useState(false);
    const [isSecondhand, setIsSecondhand] = useState(false);
    const [serialNumbers, setSerialNumbers] = useState([]);

    const availableSNs = (() => {
        if (!isSecondhand || !partName || !inventoryItems) return [];
        const target = inventoryItems.find(i => 
            i.name === partName && 
            i.category === '二手備品' && 
            (!model || i.model === model)
        );
        if (!target || !target.serialNumber) return [];
        return target.serialNumber.split(',').map(s => s.trim()).filter(Boolean);
    })();

    const handleAddPart = () => { 
        if (partName && qty) { 
            if (isSecondhand && availableSNs.length > 0) {
                const requiredCount = Math.min(parseInt(qty) || 0, availableSNs.length);
                const selectedCount = (serialNumbers || []).filter(Boolean).length;
                if (selectedCount < requiredCount) {
                    alert("請為二手備品選擇對應的序號！");
                    return;
                }
            }

            const newPart = { 
                name: partName, 
                model: model || '', 
                qty: qty, 
                isWarranty: isWarranty || false, 
                isQuote: isQuote || false, 
                isSecondhand: isSecondhand || false,
                serialNumbers: serialNumbers || []
            }; 
            onUpdate([...replacedParts, newPart]);
            
            // 寫入清單後清空輸入框狀態
            setPartName(''); setModel(''); setQty(''); setIsWarranty(false); setIsQuote(false); setIsSecondhand(false); setSerialNumbers([]); 
        } 
    };

    const handleRemovePart = (index) => { onUpdate(replacedParts.filter((_, i) => i !== index)); };

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
            <div className="flex flex-wrap gap-2 items-end mb-2">
                <div className="flex-1 min-w-[120px]">
                    <Label>零件/材料名稱</Label>
                    <DatalistInput listId={`${listIdPrefix}-parts-list`} value={partName} onChange={(e) => setPartName(e.target.value)} options={partsList} placeholder="手動輸入或選擇..." />
                </div>
                <div className="w-24">
                    <Label>型號/規格</Label>
                    <Input value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="w-16">
                    <Label>數量</Label>
                    <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pb-3">
                    <label className="flex items-center cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-200"><input type="checkbox" checked={isWarranty} onChange={(e) => setIsWarranty(e.target.checked)} className="mr-1.5" /><span className="text-sm font-medium">保固</span></label>
                    <label className="flex items-center cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-200"><input type="checkbox" checked={isQuote} onChange={(e) => setIsQuote(e.target.checked)} className="mr-1.5" /><span className="text-sm font-medium">報價</span></label>
                    <label className="flex items-center cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-200"><input type="checkbox" checked={isSecondhand} onChange={(e) => setIsSecondhand(e.target.checked)} className="mr-1.5" /><span className="text-sm font-medium">二手</span></label>
                </div>
                <button type="button" onClick={handleAddPart} className="bg-blue-600 text-white px-3 py-2.5 rounded-xl hover:bg-blue-700 mb-0.5 shadow-sm"><Plus size={18} /></button>
            </div>
            
            {isSecondhand && parseInt(qty) > 0 && availableSNs.length > 0 && (
                <div className="w-full mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
                    <Label className="text-amber-800 text-xs mb-2">請選擇二手備品序號 (庫存可用: {availableSNs.length})</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Array.from({ length: Math.min(parseInt(qty) || 0, availableSNs.length) }).map((_, idx) => (
                            <select 
                                key={idx}
                                value={serialNumbers?.[idx] || ''}
                                onChange={(e) => {
                                    const newSNs = [...(serialNumbers || [])];
                                    newSNs[idx] = e.target.value;
                                    setSerialNumbers(newSNs);
                                }}
                                className={`${INPUT_BASE_CLASS} !py-1.5 !px-2 !text-xs border-amber-200 focus:border-amber-400 focus:ring-amber-200 rounded-lg bg-white`}
                            >
                                <option value="">-- 選擇序號 --</option>
                                {availableSNs.map(sn => {
                                    const isSelectedByOther = serialNumbers?.includes(sn) && serialNumbers[idx] !== sn;
                                    return (
                                        <option key={sn} value={sn} disabled={isSelectedByOther}>
                                            {sn} {isSelectedByOther ? '(已選)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        ))}
                    </div>
                    {(parseInt(qty) || 0) > availableSNs.length && (
                        <div className="text-xs text-red-500 mt-2 font-medium">⚠️ 需求數量大於庫存帶有序號的數量。</div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                {replacedParts.map((part, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-sm shadow-sm">
                        <div>
                            <span className="font-medium text-slate-700">{part.name} {part.model ? `(${part.model})` : ''} x {part.qty}</span>
                            {part.isWarranty && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-xs ml-1 font-bold border border-green-100">保固</span>}
                            {part.isQuote && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-xs ml-1 font-bold border border-amber-100">報價</span>}
                            {part.isSecondhand && <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg text-xs ml-1 font-bold border border-purple-100">二手</span>}
                            {part.serialNumbers && part.serialNumbers.length > 0 && (<div className="text-[10px] text-slate-400 mt-1">S/N: {part.serialNumbers.filter(Boolean).join(', ')}</div>)}
                        </div>
                        <button type="button" onClick={() => handleRemovePart(index)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                ))}
                {replacedParts.length === 0 && <p className="text-center text-slate-400 text-xs py-2">無更換紀錄</p>}
            </div>
        </div>
    );
};

const ConstructionAlertPanel = ({ orders, onView }) => {
    const alerts = orders.filter(o => o.type === 'dispatch' && o.constructionDate && !['已完成', '已結案', '正常', '已取消'].includes(o.status)).map(o => ({ ...o, alertStatus: getConstructionStatus(o.constructionDate) })).filter(o => o.alertStatus !== null && (o.alertStatus.type === 'today' || o.alertStatus.type === 'urgent' || o.alertStatus.type === 'overdue')).sort((a, b) => new Date(a.constructionDate) - new Date(b.constructionDate));
    if (alerts.length === 0) return null;
    return (<div className="mb-6 animate-in fade-in slide-in-from-top-4"><div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 shadow-sm"><div className="flex items-center gap-2 mb-3 text-orange-800 font-bold"><div className="p-1.5 bg-orange-100 rounded-full animate-pulse"><AlertTriangle size={18} /></div><span>施工提醒 ({alerts.length} 筆即將到期或過期)</span></div><div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">{alerts.map(order => (<div key={order.id} onClick={() => onView(order)} className="min-w-[240px] bg-white p-3 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition cursor-pointer group"><div className="flex justify-between items-start mb-2"><span className={`text-[10px] px-2 py-0.5 rounded border ${order.alertStatus.color}`}>{order.alertStatus.label}</span><span className="text-xs text-slate-400">{order.constructionDate}{order.isMultiDay && order.constructionEndDate && ` ~ ${order.constructionEndDate.slice(5)}`}</span></div><div className="font-bold text-slate-700 text-sm truncate group-hover:text-blue-600 transition-colors">{order.customerName}</div><div className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1"><Wrench size={12}/> {order.equipment || '未指定'}</div></div>))}</div></div></div>);
};

const InventoryManager = ({ onCancel, parts, onUpdateParts, orders, readOnly }) => {
    const [items, loading] = useCollectionList(auth.currentUser, 'inventory_items', []);
    const [viewMode, setViewMode] = useState('list');
    const [activeInvTab, setActiveInvTab] = useState('list');
    const [formData, setFormData] = useState(DEFAULT_INVENTORY_ITEM);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showHistory, setShowHistory] = useState(null);
    const { confirm, ConfirmDialog } = useConfirm();
    const [adjustState, setAdjustState] = useState({ isOpen: false, item: null });

    const handleSave = async (e) => { e.preventDefault(); const itemId = isEditing && formData.id ? formData.id : crypto.randomUUID(); const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', itemId); try { await setDoc(docRef, { ...formData, quantity: Number(formData.quantity) || 0, safeStock: Number(formData.safeStock) || 0, updatedAt: new Date().toISOString() }); if (onUpdateParts && parts) { const partString = `${formData.name}${formData.model ? ` (${formData.model})` : ''}`.trim(); if (!parts.includes(partString)) { onUpdateParts([...parts, partString]); } } setViewMode('list'); setFormData(DEFAULT_INVENTORY_ITEM); setIsEditing(false); } catch (error) { console.error(error); alert("儲存失敗"); } };
    const handleSyncFromSettings = async () => { if (!parts || parts.length === 0) return; confirm({ title: "同步設定清單", message: `將檢查 ${parts.length} 個設定中的零件項目，並將不存在於庫存的項目自動加入。\n確定要執行嗎？`, onConfirm: async () => { const batch = writeBatch(db); let count = 0; parts.forEach(partStr => { let name = partStr; let model = ''; if (partStr.includes('(') && partStr.includes(')')) { const start = partStr.indexOf('('); const end = partStr.lastIndexOf(')'); name = partStr.substring(0, start).trim(); model = partStr.substring(start + 1, end).trim(); } const exists = items.some(i => (i.name === name && i.model === model) || (`${i.name} (${i.model})` === partStr)); if (!exists) { const newId = crypto.randomUUID(); const ref = doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', newId); batch.set(ref, { ...DEFAULT_INVENTORY_ITEM, id: newId, name: name, model: model, quantity: 0, category: '耗材', updatedAt: new Date().toISOString() }); count++; } }); if (count > 0) { try { await batch.commit(); alert(`同步完成：已新增 ${count} 個項目至庫存。`); } catch(e) { console.error(e); alert("同步失敗"); } } else { alert("同步完成：設定中的零件皆已存在於庫存中。"); } } }); };
    const handleEdit = (item) => { setFormData(item); setIsEditing(true); setViewMode('form'); };
    const handleDelete = (id) => { confirm({ title: "刪除庫存項目", message: "確定要刪除此庫存項目嗎？此操作無法復原。", onConfirm: async () => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', id)); } catch (e) { console.error(e); alert("刪除失敗"); } } }); };
    const handleAdjustmentClick = (item) => { setAdjustState({ isOpen: true, item: item }); };

    const filteredItems = items.filter(item => { if (searchTerm) { const term = searchTerm.toLowerCase(); return (item.name?.toLowerCase().includes(term) || item.model?.toLowerCase().includes(term) || item.serialNumber?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term)); } return true; });
    const newItemsList = filteredItems.filter(item => item.category !== '二手備品');
    const secondhandItemsList = filteredItems.filter(item => item.category === '二手備品');
    const displayItems = activeInvTab === 'secondhand' ? secondhandItemsList : newItemsList;
    const displayLowStockItems = displayItems.filter(item => item.quantity <= item.safeStock);

    const ItemHistoryModal = () => { if (!showHistory) return null; const item = items.find(i => i.id === showHistory); if (!item) return null; const logs = (item.usageLog || []).sort((a, b) => new Date(b.date) - new Date(a.date)); return (<div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col border border-white/20"><div className="flex justify-between items-center mb-4 border-b pb-3"><div><h3 className="text-xl font-bold text-slate-800">{item.name} 歷史紀錄</h3><div className="text-sm text-slate-500 mt-1">{item.model || '無型號'}</div></div><button onClick={() => setShowHistory(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button></div><div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">{logs.length === 0 ? (<div className="text-center py-10 text-slate-400">尚無使用紀錄</div>) : (<div className="space-y-3">{logs.map((log, idx) => { let typeLabel = '工單扣除'; let qtyClass = 'text-red-600 bg-red-50'; let prefix = '-'; if (log.type) { typeLabel = log.type; if (log.action === 'add') { qtyClass = 'text-emerald-600 bg-emerald-50'; prefix = '+'; } else if (log.action === 'sub') { qtyClass = 'text-red-600 bg-red-50'; prefix = '-'; } else { qtyClass = 'text-slate-500 bg-slate-100'; prefix = ''; } } else { typeLabel = '工單使用'; qtyClass = 'text-red-600 bg-red-50'; prefix = '-'; } return (<div key={idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-100"><div className="flex-1"><div className="text-sm font-bold text-slate-700 flex items-center gap-2">{log.date}<span className={`text-[10px] px-1.5 py-0.5 rounded border ${qtyClass.replace('text-', 'border-').replace('bg-', 'border-opacity-20 ')}`}>{typeLabel}</span></div><div className="text-xs text-slate-500 mt-1">{log.orderId ? `單號: ${log.orderId}` : (log.note || '無備註')}{log.customer && ` | ${log.customer}`}</div>{log.image && (<div className="mt-2"><img src={log.image} alt="紀錄照片" className="h-16 w-auto rounded-lg border border-slate-200 object-cover" /></div>)}</div><div className={`font-bold px-2 py-1 rounded text-sm ${qtyClass} shrink-0 ml-2`}>{prefix}{log.qty}</div></div>); })}</div>)}</div></div></div>); };
    const InventoryAdjustmentModal = () => { if (!adjustState.isOpen || !adjustState.item) return null; const item = adjustState.item; const [type, setType] = useState('補貨入庫'); const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); const [linkedOrderId, setLinkedOrderId] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); const qty = parseInt(amount); if (!qty || qty <= 0) { alert("請輸入有效的數量"); return; } let change = qty; let isAdd = true; let newLastRestockDate = item.lastRestockDate; switch (type) { case '補貨入庫': case '測試歸還': isAdd = true; if (type === '補貨入庫') { newLastRestockDate = new Date().toISOString().slice(0, 10); } break; case '測試借出': isAdd = false; break; default: isAdd = true; } const currentQty = parseInt(item.quantity) || 0; const newQty = isAdd ? currentQty + change : currentQty - change; if (newQty < 0) { alert("庫存不足以扣除"); return; } const logEntry = { date: new Date().toISOString().slice(0, 10), type: type, qty: qty, action: isAdd ? 'add' : 'sub', note: note, orderId: linkedOrderId || null, customer: linkedOrderId ? orders.find(o => o.id === linkedOrderId)?.customerName : null }; const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', item.id); try { await setDoc(docRef, { ...item, quantity: newQty, lastRestockDate: newLastRestockDate, usageLog: [...(item.usageLog || []), logEntry] }); setAdjustState({ isOpen: false, item: null }); } catch (error) { console.error(error); alert("異動失敗"); } }; return (<div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/20"><div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ArrowRightLeft size={20} className="text-blue-600"/> 庫存異動</h3><button onClick={() => setAdjustState({isOpen: false, item: null})}><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div><div className="mb-4"><div className="font-bold text-slate-700">{item.name}</div><div className="text-xs text-slate-500 mb-2">目前庫存: {item.quantity} {item.unit}</div></div><form onSubmit={handleSubmit} className="space-y-3"><div><Label>異動類型</Label><Select value={type} onChange={(e) => setType(e.target.value)} options={['補貨入庫', '測試借出', '測試歸還']} /></div><div className="animate-in fade-in"><Label>關聯工單 (選填)</Label><select className={`${INPUT_BASE_CLASS} appearance-none cursor-pointer ${INPUT_EDITABLE_CLASS}`} value={linkedOrderId} onChange={(e) => setLinkedOrderId(e.target.value)}><option value="">-- 無關聯工單 --</option>{orders && orders.map(o => (<option key={o.id} value={o.id}>{o.date} - {o.customerName} ({o.serviceEngineer || '未指派'})</option>))}</select></div><div><Label>數量</Label><Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="請輸入正整數" autoFocus /></div><div><Label>備註說明</Label><Textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：廠商進貨、測試用途..."></Textarea></div><div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setAdjustState({isOpen: false, item: null})} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl text-sm">取消</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm shadow-md">確認異動</button></div></form></div></div>); };

    if (viewMode === 'form') { 
        return (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">{isEditing ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}{isEditing ? '編輯庫存項目' : '新增庫存項目'}</h2>
                    <button onClick={() => { setViewMode('list'); setFormData(DEFAULT_INVENTORY_ITEM); }} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回列表</button>
                </div>
                <Card className="p-6">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <MultiPhotoUpload label="物品照片 (可多張)" images={formData.images || (formData.image ? [formData.image] : [])} onChange={(vals) => setFormData({...formData, images: vals, image: vals[0] || ''})} />
                            </div>
                            <div><Label required>物品名稱</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="例如：空氣濾網" /></div>
                            <div><Label>型號/規格</Label><Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} placeholder="例如：50x50 cm" /></div>
                            <div><Label>序號 (S/N)</Label><Input value={formData.serialNumber || ''} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} placeholder="原廠機身序號" /></div>
                            <div><Label>類別</Label><Select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} options={['耗材', '工具', '備品', '二手備品', '儀器', '其他']} /></div>
                            <div><Label>單位</Label><Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="例如：個、箱、組" /></div>
                            <div><Label required>目前數量</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required /></div>
                            {formData.category !== '二手備品' && (
                                <div><Label>安全庫存量 (低於此數值將警示)</Label><Input type="number" value={formData.safeStock} onChange={(e) => setFormData({...formData, safeStock: e.target.value})} /></div>
                            )}
                            <div><Label>存放位置</Label><Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="例如：B1 倉庫 A-01" /></div>
                            <div><Label>最近補貨日期</Label><Input type="date" value={formData.lastRestockDate} onChange={(e) => setFormData({...formData, lastRestockDate: e.target.value})} /></div>
                            <div className="md:col-span-2"><Label>備註</Label><Textarea rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="其他說明..."></Textarea></div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition font-medium text-sm">取消</button>
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition font-medium text-sm flex items-center gap-2"><Save size={16}/> 儲存</button>
                        </div>
                    </form>
                </Card>
            </div>
        ); 
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ConfirmDialog />
            <ItemHistoryModal />
            <InventoryAdjustmentModal />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Box className="text-blue-600" /> 庫存管理</h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回總覽</button>
                </div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit flex-wrap gap-1">
                <button onClick={() => setActiveInvTab('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeInvTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Box size={16} /> 新品庫存</button>
                <button onClick={() => setActiveInvTab('secondhand')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeInvTab === 'secondhand' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><RefreshCw size={16} /> 二手備品</button>
            </div>
            {(activeInvTab === 'list' || activeInvTab === 'secondhand') && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600"><Box size={24} /></div>
                            <div>
                                <div className="text-sm text-slate-500 font-medium">{activeInvTab === 'secondhand' ? '二手品項總計' : '新品品項總計'}</div>
                                <div className="text-2xl font-bold text-slate-800">{displayItems.length} <span className="text-xs font-normal text-slate-400">項</span></div>
                            </div>
                        </Card>
                        {activeInvTab === 'list' && (
                            <Card className="p-4 flex items-center gap-4 border-l-4 border-l-red-500">
                                <div className="p-3 bg-red-50 rounded-full text-red-600"><AlertTriangle size={24} /></div>
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">庫存不足警示</div>
                                    <div className="text-2xl font-bold text-red-600">{displayLowStockItems.length} <span className="text-xs font-normal text-slate-400">項</span></div>
                                </div>
                            </Card>
                        )}
                    </div>
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋名稱、型號、類別..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm w-full focus:ring-2 focus:ring-blue-200 outline-none" />
                            </div>
                            <div className="flex gap-2">
                                {!readOnly && activeInvTab === 'list' && <button onClick={handleSyncFromSettings} className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl text-sm hover:bg-amber-100 flex items-center gap-2 shadow-sm transition"><RefreshCw size={16} /> 匯入</button>}
                                {!readOnly && <button onClick={() => { setFormData({ ...DEFAULT_INVENTORY_ITEM, category: activeInvTab === 'secondhand' ? '二手備品' : '耗材' }); setIsEditing(false); setViewMode('form'); }} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm"><Plus size={16} /> 新增</button>}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">物品名稱 / 型號 / 序號</th>
                                        <th className="px-6 py-3 font-medium">類別</th>
                                        <th className="px-6 py-3 font-medium">存放位置</th>
                                        <th className="px-6 py-3 font-medium text-center">庫存數量</th>
                                        {activeInvTab === 'list' && <th className="px-6 py-3 font-medium text-center">狀態</th>}
                                        <th className="px-6 py-3 font-medium text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayItems.length === 0 ? (
                                        <tr><td colSpan={activeInvTab === 'list' ? "6" : "5"} className="text-center py-12 text-slate-400">{activeInvTab === 'secondhand' ? '尚無二手備品資料，請點擊新增' : '尚無新品庫存資料，請點擊新增'}</td></tr>
                                    ) : displayItems.map(item => { 
                                        const isLowStock = item.quantity <= item.safeStock; 
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {(item.images?.[0] || item.image) ? (
                                                            <img src={item.images?.[0] || item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 shrink-0"><ImageIcon size={18} /></div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-800">{item.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                型號: <span className="font-mono">{item.model || '-'}</span>
                                                            </div>
                                                            {item.serialNumber && (
                                                                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2" title={item.serialNumber}>
                                                                    S/N: <span className="font-mono">{item.serialNumber}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    <span className={`px-2 py-1 rounded text-xs ${item.category === '二手備品' ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100'}`}>{item.category}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    <div>{item.location || '-'}</div>
                                                    {item.lastRestockDate && <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10}/> 補貨: {item.lastRestockDate}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-bold text-lg text-slate-700">{item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span></div>
                                                    {activeInvTab === 'list' && <div className="text-xs text-slate-400 mt-1">安全水位: {item.safeStock}</div>}
                                                </td>
                                                {activeInvTab === 'list' && (
                                                    <td className="px-6 py-4 text-center">
                                                        {isLowStock ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200"><AlertTriangle size={12} /> 庫存不足</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle size={12} /> 充足</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    {!readOnly && <button onClick={() => handleAdjustmentClick(item)} className="text-orange-600 hover:bg-orange-50 p-1.5 rounded-lg transition" title="庫存異動"><ArrowRightLeft size={16}/></button>}
                                                    <button onClick={() => setShowHistory(item.id)} className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition" title="歷史紀錄"><History size={16}/></button>
                                                    {!readOnly && <button onClick={() => handleEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" title="編輯"><Edit2 size={16}/></button>}
                                                    {!readOnly && <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="刪除"><Trash2 size={16}/></button>}
                                                </td>
                                            </tr>
                                        ); 
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

const ExportModal = ({ isOpen, onClose, orders, onExportComplete }) => {
    const EXPORT_CATEGORIES = [{ id: 'basic', label: '基本資料' }, { id: 'task', label: '任務內容' }, { id: 'field', label: '現場資訊' }];
    const EXPORT_OPTIONS = [{ key: 'id', label: '單號', category: 'basic', default: true }, { key: 'date', label: '日期', category: 'basic', default: true }, { key: 'type', label: '類型', category: 'basic', default: true }, { key: 'status', label: '狀態', category: 'basic', default: true }, { key: 'customerName', label: '客戶名稱', category: 'basic', default: true }, { key: 'station', label: '站別', category: 'field', default: true }, { key: 'equipment', label: '設備名稱', category: 'field', default: true }, { key: 'serviceEngineer', label: '工程師', category: 'task', default: true }, { key: 'assistants', label: '協助人員', category: 'task', default: false }, { key: 'description', label: '描述/備註', category: 'task', default: true }, { key: 'dismantledDescription', label: '拆回舊品', category: 'task', default: false }, { key: 'checklist', label: '檢查結果', category: 'task', default: false }, { key: 'replacedParts', label: '更換零件', category: 'task', default: true }];
    const [selectedFields, setSelectedFields] = useState(EXPORT_OPTIONS.filter(o => o.default).map(o => o.key));
    if (!isOpen) return null;
    const toggleField = (key) => { if (selectedFields.includes(key)) { setSelectedFields(selectedFields.filter(k => k !== key)); } else { setSelectedFields([...selectedFields, key]); } };
    const handleExport = () => {
        const header = selectedFields.map(key => { const opt = EXPORT_OPTIONS.find(o => o.key === key); return opt ? opt.label : key; }).join(',');
        const rows = orders.map(order => { return selectedFields.map(key => { let val = order[key]; if (key === 'replacedParts' && Array.isArray(val)) { val = val.map(p => `${p.name}*${p.qty}${p.isSecondhand ? '(二手)' : ''}${p.serialNumbers?.length ? `[SN:${p.serialNumbers.filter(Boolean).join(',')}]` : ''}`).join('; '); } else if (key === 'dismantledDescription') { if (order.dismantledParts && order.dismantledParts.length > 0) { val = order.dismantledParts.map(p => `${p.name}*${p.qty}`).join('; '); } else { val = order.dismantledDescription || ''; } } else if (key === 'checklist' && Array.isArray(val)) { const ngItems = val.filter(i => i.ng).map(i => i.name); val = ngItems.length > 0 ? `異常:${ngItems.join(';')}` : '全部正常'; } else if (key === 'assistants' && Array.isArray(val)) { val = val.join(', '); } else if (typeof val === 'boolean') { val = val ? '是' : '否'; } else if (val === null || val === undefined) { val = ''; } const stringVal = String(val).replace(/"/g, '""'); return `"${stringVal}"`; }).join(','); });
        const csvContent = "\uFEFF" + [header, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `工單匯出_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); onClose(); if (onExportComplete) onExportComplete();
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full flex flex-col max-h-[90vh] border border-white/20">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet className="text-emerald-600" /> 匯出工單內容</h3><button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition"><X size={20}/></button></div>
                <div className="mb-4 flex-1 overflow-hidden flex flex-col"><div className="flex justify-between items-center mb-2 shrink-0"><span className="text-sm font-medium text-slate-700">選擇匯出欄位 ({selectedFields.length})</span><div className="flex gap-2 text-xs"><button onClick={() => setSelectedFields(EXPORT_OPTIONS.map(o => o.key))} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">全選</button><button onClick={() => setSelectedFields([])} className="text-slate-500 hover:bg-slate-50 px-2 py-1 rounded">清空</button></div></div><div className="overflow-y-auto pr-2 custom-scrollbar p-1 flex-1">{EXPORT_CATEGORIES.map(category => { const categoryOptions = EXPORT_OPTIONS.filter(opt => opt.category === category.id); if (categoryOptions.length === 0) return null; return (<div key={category.id} className="mb-4 last:mb-0"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1 flex items-center gap-2">{category.label}</h4><div className="grid grid-cols-2 gap-2">{categoryOptions.map(opt => (<label key={opt.key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition select-none bg-white"><input type="checkbox" checked={selectedFields.includes(opt.key)} onChange={() => toggleField(opt.key)} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 shrink-0"/><span className="text-sm text-slate-700 truncate" title={opt.label}>{opt.label}</span></label>))}</div></div>); })}</div></div>
                <div className="flex justify-end gap-3 pt-2 shrink-0"><button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition font-medium text-sm">取消</button><button onClick={handleExport} disabled={selectedFields.length === 0} className="bg-[#06C755] text-white px-5 py-2.5 rounded-xl hover:bg-[#05b34c] shadow-md transition font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Download size={16} /> 匯出 CSV 檔案</button></div>
            </div>
        </div>
    );
};

const StaffManager = ({ onCancel, staffList, orders }) => {
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const staffData = React.useMemo(() => { const stats = {}; staffList.forEach(name => { stats[name] = { name, primaryCount: 0, assistantCount: 0, totalOrders: 0, orders: [], lastActive: null }; }); orders.forEach(order => { const processStaff = (name, role) => { if (!name) return; if (!stats[name]) { stats[name] = { name, primaryCount: 0, assistantCount: 0, totalOrders: 0, orders: [], lastActive: null }; } if (role === 'primary') stats[name].primaryCount++; if (role === 'assistant') stats[name].assistantCount++; if (!stats[name].orders.find(o => o.id === order.id)) { stats[name].orders.push(order); stats[name].totalOrders++; } if (!stats[name].lastActive || new Date(order.date) > new Date(stats[name].lastActive)) { stats[name].lastActive = order.date; } }; if (order.serviceEngineer) processStaff(order.serviceEngineer, 'primary'); if (order.assistants && Array.isArray(order.assistants)) { order.assistants.forEach(assistant => processStaff(assistant, 'assistant')); } }); return Object.values(stats).sort((a, b) => b.totalOrders - a.totalOrders); }, [orders, staffList]);
    const filteredStaff = staffData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const StaffHistoryModal = () => { if (!selectedStaff) return null; const historyOrders = [...selectedStaff.orders].sort((a, b) => new Date(b.date) - new Date(a.date)); return (<div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col border border-white/20"><div className="flex justify-between items-start mb-6 border-b pb-4"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner"><User size={32} /></div><div><h3 className="text-2xl font-bold text-slate-800">{selectedStaff.name}</h3><div className="text-sm text-slate-500 mt-1 flex items-center gap-2"><Clock size={14} /> 最近活動: {selectedStaff.lastActive || '無紀錄'}</div></div></div><button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><X size={20}/></button></div><div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"><div className="text-xs text-slate-500 mb-1">總工單數</div><div className="text-xl font-bold text-slate-800">{selectedStaff.totalOrders}</div></div><div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center"><div className="text-xs text-blue-600 mb-1">主責 (Primary)</div><div className="text-xl font-bold text-blue-700">{selectedStaff.primaryCount}</div></div><div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center"><div className="text-xs text-purple-600 mb-1">協助 (Assistant)</div><div className="text-xl font-bold text-purple-700">{selectedStaff.assistantCount}</div></div></div><div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><List size={18} /> 工單歷史紀錄</div><div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">{historyOrders.length === 0 ? (<div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">尚無相關工單紀錄</div>) : (historyOrders.map(order => { const isPrimary = order.serviceEngineer === selectedStaff.name; return (<div key={order.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition group"><div className="flex justify-between items-start mb-1"><div className="flex items-center gap-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${order.type === 'maintenance' ? 'bg-emerald-100 text-emerald-700' : order.type === 'repair' ? 'bg-amber-100 text-amber-700' : order.type === 'construction' ? 'bg-indigo-100 text-indigo-700' : order.type === 'capa' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{order.type === 'maintenance' ? '保養' : order.type === 'repair' ? '報修' : order.type === 'construction' ? '施工' : order.type === 'capa' ? 'CAPA' : '派工'}</span><span className="text-sm font-bold text-slate-700">{order.date}</span></div><div className="flex items-center gap-2"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPrimary ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-700'}`}>{isPrimary ? '主責' : '協助'}</span>{getOrderStatusBadge(order)}</div></div><div className="font-medium text-slate-800 mb-1">{order.customerName} - {order.equipment || '一般'}</div><div className="text-sm text-slate-600 truncate">{order.description || order.problemDescription || (order.checklist ? '例行保養檢查' : '無描述')}</div><div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200/50 flex justify-between"><span>單號: {order.id}</span><span>站別: {order.station || '未指定'}</span></div></div>); }))}</div></div></div>); };
    return (<div className="space-y-6"><StaffHistoryModal /><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-blue-600" /> 人員統計管理</h2><div className="flex gap-2"><button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回總覽</button></div></div><Card className="p-0 overflow-hidden min-h-[60vh] flex flex-col"><div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center"><div className="flex items-center gap-2 text-slate-500 text-sm"><Users size={16} /> 共 {filteredStaff.length} 位人員</div><div className="relative w-full md:w-64"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋工程師姓名..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm w-full focus:ring-2 focus:ring-blue-200 outline-none transition" /></div></div><div className="p-6 overflow-y-auto bg-slate-50/50 flex-1"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredStaff.map((staff) => (<button key={staff.name} onClick={() => setSelectedStaff(staff)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition group text-left relative overflow-hidden"><div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div><div className="flex items-center gap-4 mb-4 relative z-10"><div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"><User size={24} /></div><div><h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors">{staff.name}</h4><div className="text-xs text-slate-500 flex items-center gap-1"><Wrench size={12} /> 工程團隊</div></div></div><div className="space-y-2 relative z-10"><div className="flex justify-between items-center text-sm"><span className="text-slate-500">總工單數</span><span className="font-bold text-slate-800">{staff.totalOrders}</span></div><div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex"><div className="bg-blue-500 h-full" style={{ width: `${(staff.primaryCount / (staff.totalOrders || 1)) * 100}%` }}></div><div className="bg-purple-400 h-full" style={{ width: `${(staff.assistantCount / (staff.totalOrders || 1)) * 100}%` }}></div></div><div className="flex justify-between text-[10px] text-slate-400 pt-1"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 主責 {staff.primaryCount}</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400"></div> 協助 {staff.assistantCount}</span></div></div><div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 relative z-10"><span className="flex items-center gap-1"><CalendarIcon size={12} /> 最近活動</span><span>{staff.lastActive ? new Date(staff.lastActive).toLocaleDateString() : '無紀錄'}</span></div></button>))}</div>{filteredStaff.length === 0 && (<div className="text-center py-20 text-slate-400 flex flex-col items-center"><Users size={48} className="mb-4 text-slate-200" /><p>找不到符合條件的人員資料</p></div>)}</div></Card></div>);
};

const AssetManager = ({ onCancel, customers, equipmentList, stations, orders, readOnly }) => {
    const [assets, loading] = useCollectionList(auth.currentUser, 'equipment_assets', []);
    const [viewMode, setViewMode] = useState('list');
    const [formData, setFormData] = useState(DEFAULT_ASSET_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterStation, setFilterStation] = useState('');
    const [filterEquipment, setFilterEquipment] = useState('');
    const [assetStatusFilter, setAssetStatusFilter] = useState('使用中');
    const [scrapState, setScrapState] = useState({ isOpen: false, asset: null });
    const { confirm, ConfirmDialog } = useConfirm();
    const [showHistory, setShowHistory] = useState(null);
    
    // 分頁狀態
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // 當篩選條件改變時，自動回到第一頁
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCustomer, filterStation, filterEquipment, assetStatusFilter, searchTerm]);

    const handleSave = async (e) => { e.preventDefault(); const assetId = isEditing && formData.id ? formData.id : crypto.randomUUID(); const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'equipment_assets', assetId); try { await setDoc(docRef, { ...formData, updatedAt: new Date().toISOString() }); setViewMode('list'); setFormData(DEFAULT_ASSET_DATA); setIsEditing(false); } catch (error) { console.error("Error saving asset:", error); alert("儲存失敗"); } };
    const handleEdit = (asset) => { setFormData(asset); setIsEditing(true); setViewMode('form'); };
    const handleCopy = (asset) => { const { id, updatedAt, scrapInfo, ...rest } = asset; setFormData({ ...rest, status: '使用中', scrapInfo: null }); setIsEditing(false); setViewMode('form'); };
    const handleDelete = (id) => { confirm({ title: "永久刪除資產", message: "確定要永久刪除此設備資產嗎？此操作無法復原。\n(若為正常汰換，建議改用「報廢」功能以保留履歷)", onConfirm: async () => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment_assets', id)); } catch (e) { console.error("Error deleting asset:", e); alert("刪除失敗"); } } }); };
    
    const filteredAssets = assets.filter(asset => { 
        const currentStatus = asset.status || '使用中';
        if (currentStatus !== assetStatusFilter) return false;
        if (filterCustomer && asset.customerName !== filterCustomer) return false; 
        if (filterStation && asset.location !== filterStation) return false; 
        if (filterEquipment && asset.name !== filterEquipment) return false; 
        if (searchTerm) { const term = searchTerm.toLowerCase(); return (asset.name?.toLowerCase().includes(term) || asset.brand?.toLowerCase().includes(term) || asset.model?.toLowerCase().includes(term) || asset.serialNumber?.toLowerCase().includes(term)); } 
        return true; 
    });

    // 計算分頁資料
    const totalPages = Math.max(1, Math.ceil(filteredAssets.length / itemsPerPage));
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const AssetHistoryModal = () => { if (!showHistory) return null; const asset = assets.find(a => a.id === showHistory); if (!asset) return null; const assetOrders = orders.filter(o => o.assetId === showHistory || (o.equipment === asset.name && o.customerName === asset.customerName && (!o.assetId))).sort((a, b) => new Date(b.date) - new Date(a.date)); return (<div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col"><div className="flex justify-between items-start mb-4 border-b pb-4"><div><h3 className="text-xl font-bold text-slate-800">{asset.name} 歷史履歷</h3><div className="text-sm text-slate-500 mt-1 flex gap-3"><span>{asset.brand} {asset.model}</span><span className="text-slate-300">|</span><span>S/N: {asset.serialNumber || '無'}</span></div></div><button onClick={() => setShowHistory(null)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20}/></button></div><div className="overflow-y-auto flex-1 space-y-3 pr-2">{assetOrders.length === 0 ? (<p className="text-center text-slate-400 py-10">尚無相關維修紀錄</p>) : (assetOrders.map(order => (<div key={order.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50"><div className="flex justify-between items-start mb-1"><div className="flex items-center gap-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${order.type === 'maintenance' ? 'bg-emerald-100 text-emerald-700' : order.type === 'repair' ? 'bg-amber-100 text-amber-700' : order.type === 'capa' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{order.type === 'maintenance' ? '保養' : order.type === 'repair' ? '報修' : order.type === 'construction' ? '施工' : order.type === 'capa' ? 'CAPA' : '派工'}</span><span className="text-sm font-bold text-slate-700">{order.date}</span></div>{getOrderStatusBadge(order)}</div><div className="text-sm text-slate-600 mb-1">{order.description || order.problemDescription || (order.checklist ? `保養檢查 (異常: ${order.checklist.filter(i=>i.ng).length}項)` : '無描述')}</div><div className="text-xs text-slate-400 flex justify-between mt-2 pt-2 border-t border-slate-50"><span>工程師: {order.serviceEngineer || '未指定'}</span><span>單號: {order.id}</span></div></div>)))}</div></div></div>); };
    
    const ScrapAssetModal = () => {
        if (!scrapState.isOpen || !scrapState.asset) return null;
        const [scrapDate, setScrapDate] = useState(new Date().toISOString().slice(0, 10));
        const [scrapReason, setScrapReason] = useState('設備老舊/損壞');
        const [linkedOrderId, setLinkedOrderId] = useState('');
        const [note, setNote] = useState('');
        const asset = scrapState.asset;

        const handleScrapSubmit = async (e) => {
            e.preventDefault();
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'equipment_assets', asset.id);
            try {
                await setDoc(docRef, {
                    ...asset,
                    status: '已報廢',
                    scrapInfo: { date: scrapDate, reason: scrapReason, orderId: linkedOrderId, note: note },
                    updatedAt: new Date().toISOString()
                });
                setScrapState({ isOpen: false, asset: null });
            } catch (error) { console.error(error); alert("報廢失敗"); }
        };

        return (
            <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/20">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Recycle size={20} className="text-orange-600"/> 資產報廢作業</h3>
                        <button type="button" onClick={() => setScrapState({isOpen: false, asset: null})} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="font-bold text-slate-700">{asset.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{asset.customerName} - {asset.location || '未指定位置'}</div>
                    </div>
                    <form onSubmit={handleScrapSubmit} className="space-y-4">
                        <div><Label>報廢日期</Label><Input type="date" value={scrapDate} onChange={(e) => setScrapDate(e.target.value)} required /></div>
                        <div><Label>報廢原因</Label><Select value={scrapReason} onChange={(e) => setScrapReason(e.target.value)} options={['設備老舊/損壞', '效能不佳汰換', '客戶要求', '合約終止', '其他']} /></div>
                        <div className="animate-in fade-in">
                            <Label>關聯工單 (選填)</Label>
                            <select className={`${INPUT_BASE_CLASS} appearance-none cursor-pointer ${INPUT_EDITABLE_CLASS}`} value={linkedOrderId} onChange={(e) => setLinkedOrderId(e.target.value)}>
                                <option value="">-- 無關聯工單 --</option>
                                {orders && orders.filter(o => o.customerName === asset.customerName && (o.type === 'repair' || o.type === 'construction')).map(o => (<option key={o.id} value={o.id}>{o.date} - 單號: {o.id.slice(-6)} ({o.type === 'repair' ? '報修' : '施工'})</option>))}
                            </select>
                            <div className="text-[10px] text-slate-400 mt-1">僅顯示此客戶 ({asset.customerName}) 的「報修」與「施工」歷史工單</div>
                        </div>
                        <div><Label>備註說明</Label><Textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="後續處理方式、回收紀錄等..."></Textarea></div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setScrapState({isOpen: false, asset: null})} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl text-sm transition">取消</button>
                            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 text-sm shadow-md transition flex items-center gap-1"><Recycle size={14}/> 確認報廢</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (viewMode === 'form') { return (<div className="max-w-3xl mx-auto"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">{isEditing ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}{isEditing ? '編輯設備資產' : '新增設備資產'}</h2><button onClick={() => { setViewMode('list'); setFormData(DEFAULT_ASSET_DATA); }} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回列表</button></div><Card className="p-6"><form onSubmit={handleSave} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="md:col-span-2"><MultiPhotoUpload label="設備照片 (可多張)" images={formData.images || (formData.image ? [formData.image] : [])} onChange={(vals) => setFormData({...formData, images: vals, image: vals[0] || ''})} /></div><div><Label required>客戶名稱</Label><DatalistInput listId="customers-list" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} options={customers.map(c => c.name)} required placeholder="選擇或手動輸入..." /></div><div><Label>所在位置/站別</Label><DatalistInput listId="asset-stations-list" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} options={stations} placeholder="選擇或手動輸入..." /></div><div><Label required>設備名稱</Label><DatalistInput listId="asset-equipment-list" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} options={equipmentList} required placeholder="選擇或手動輸入..." /></div><div><Label>廠牌 (Brand)</Label><Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="例如：Hitachi, Daikin" /></div><div><Label>型號 (Model)</Label><Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} placeholder="例如：R410A-20RT" /></div><div><Label>序號 (S/N)</Label><Input value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} placeholder="原廠機身序號" /></div><div><Label>安裝日期</Label><Input type="date" value={formData.installationDate} onChange={(e) => setFormData({...formData, installationDate: e.target.value})} /></div><div><Label>保固到期日</Label><Input type="date" value={formData.warrantyDate} onChange={(e) => setFormData({...formData, warrantyDate: e.target.value})} /></div><div className="md:col-span-2"><Label>備註</Label><Textarea rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="其他補充資訊..."></Textarea></div></div><div className="pt-4 border-t border-slate-100 flex justify-end gap-3"><button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition font-medium text-sm">取消</button><button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition font-medium text-sm flex items-center gap-2"><Save size={16}/> 儲存資產</button></div></form></Card></div>); }
    return (<div className="space-y-6"><ConfirmDialog /><AssetHistoryModal /><ScrapAssetModal /><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Package className="text-blue-600" /> 設備資產庫</h2><div className="flex gap-2"><button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回總覽</button>{!readOnly && <button onClick={() => { setFormData(DEFAULT_ASSET_DATA); setIsEditing(false); setViewMode('form'); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm"><Plus size={16} /> 新增資產</button>}</div></div><Card className="p-0 overflow-hidden"><div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center"><div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-fit shrink-0"><button onClick={() => setAssetStatusFilter('使用中')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${assetStatusFilter === '使用中' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><CheckCircle size={16} /> 使用中</button><button onClick={() => setAssetStatusFilter('已報廢')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${assetStatusFilter === '已報廢' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Recycle size={16} /> 已報廢</button></div><div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto items-start lg:items-center"><div className="flex flex-wrap items-center gap-2 w-full lg:w-auto"><Filter className="text-slate-400 hidden md:block" size={16} /><select className="pl-2 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 md:w-auto" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}><option value="">所有客戶</option>{customers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select><select className="pl-2 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 md:w-auto" value={filterStation} onChange={(e) => setFilterStation(e.target.value)}><option value="">所有站別</option>{stations.map(s => <option key={s} value={s}>{s}</option>)}</select><select className="pl-2 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white flex-1 md:w-auto" value={filterEquipment} onChange={(e) => setFilterEquipment(e.target.value)}><option value="">所有設備</option>{equipmentList.map(e => <option key={e} value={e}>{e}</option>)}</select></div><div className="relative w-full lg:w-64 shrink-0"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋名稱、型號、序號..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm w-full focus:ring-2 focus:ring-blue-200 outline-none" /></div></div></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-600 border-b border-slate-200"><tr><th className="px-6 py-3 font-medium">客戶/位置</th><th className="px-6 py-3 font-medium">設備名稱</th><th className="px-6 py-3 font-medium">廠牌/型號</th><th className="px-6 py-3 font-medium">序號 (S/N)</th><th className="px-6 py-3 font-medium">{assetStatusFilter === '已報廢' ? '報廢資訊' : '保固狀態'}</th><th className="px-6 py-3 font-medium text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{paginatedAssets.length === 0 ? (<tr><td colSpan="6" className="text-center py-12 text-slate-400">目前沒有符合條件的資料</td></tr>) : paginatedAssets.map(asset => { const warranty = getWarrantyStatus(asset.warrantyDate); return (<tr key={asset.id} className="hover:bg-slate-50 transition group"><td className="px-6 py-4"><div className="font-bold text-slate-800">{asset.customerName}</div><div className="text-xs text-slate-500">{asset.location || '-'}</div></td><td className="px-6 py-4"><div className="flex items-center gap-3">{(asset.images?.[0] || asset.image) ? (<img src={asset.images?.[0] || asset.image} alt={asset.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white shrink-0" />) : (<div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 shrink-0"><Package size={18} /></div>)}<div className="font-medium text-slate-700">{asset.name}</div></div></td><td className="px-6 py-4 text-slate-600"><div>{asset.brand || '-'}</div><div className="text-xs text-slate-400">{asset.model || '-'}</div></td><td className="px-6 py-4 font-mono text-xs text-slate-500">{asset.serialNumber || '-'}</td><td className="px-6 py-4">{assetStatusFilter === '已報廢' ? (<div className="text-xs"><div className="text-red-600 font-bold mb-0.5">{asset.scrapInfo?.date || '未知日期'}</div><div className="text-slate-500">{asset.scrapInfo?.reason || '無說明'}</div>{asset.scrapInfo?.orderId && <div className="text-blue-500 text-[10px] mt-1 flex items-center gap-1" title={asset.scrapInfo.orderId}><LinkIcon size={10}/> 關聯單號</div>}</div>) : (<span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${warranty.color}`}>{warranty.text}</span>)}</td><td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => setShowHistory(asset.id)} className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition" title="查看歷史"><History size={16}/></button>{assetStatusFilter === '使用中' && !readOnly && <button onClick={() => handleCopy(asset)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition" title="複製新增"><Copy size={16}/></button>}{!readOnly && <button onClick={() => handleEdit(asset)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" title="編輯"><Edit2 size={16}/></button>}{assetStatusFilter === '使用中' && !readOnly && <button onClick={() => setScrapState({isOpen: true, asset})} className="text-orange-600 hover:bg-orange-50 p-1.5 rounded-lg transition" title="報廢資產"><Recycle size={16}/></button>}{!readOnly && <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="永久刪除"><Trash2 size={16}/></button>}</td></tr>); })}</tbody></table></div>
        {filteredAssets.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-500">
                    顯示 {((currentPage - 1) * itemsPerPage) + 1} 至 {Math.min(currentPage * itemsPerPage, filteredAssets.length)} 筆，共 <span className="font-bold text-slate-700">{filteredAssets.length}</span> 筆
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-medium text-slate-600 transition">首頁</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-medium text-slate-600 transition"><ChevronLeft size={14}/></button>
                    <span className="text-sm font-medium text-slate-700 px-2">第 {currentPage} / {totalPages} 頁</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-medium text-slate-600 transition"><ChevronRight size={14}/></button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-medium text-slate-600 transition">最末頁</button>
                </div>
            </div>
        )}
        </Card></div>);
};

const DismantledProcessingModal = ({ isOpen, order, onClose, assetList }) => {
    const [items] = useCollectionList(auth.currentUser, 'inventory_items', []);
    const [action, setAction] = useState('二手入庫');
    const [itemName, setItemName] = useState('');
    const [itemModel, setItemModel] = useState('');
    const [itemBrand, setItemBrand] = useState('');
    const [itemSerialNumbers, setItemSerialNumbers] = useState(['']); // 新增：處理手動輸入的多序號
    const [qty, setQty] = useState('1');
    const [processing, setProcessing] = useState(false);
    const [distributions, setDistributions] = useState({});

    useEffect(() => {
        if (order && order.dismantledParts) {
            const initialDists = {};
            order.dismantledParts.forEach((part, idx) => {
                const q = parseInt(part.qty) || 1;
                initialDists[idx] = { 
                    recycle: q, 
                    scrap: 0, 
                    model: part.model || '', 
                    brand: '', 
                    serialNumbers: Array(q).fill('') // 新增：依數量建立序號陣列
                };
            });
            setDistributions(initialDists);
        }
    }, [order]);

    if (!isOpen || !order) return null;

    const hasParts = order.dismantledParts && order.dismantledParts.length > 0;

    const processItem = async (name, quantity, processAction, model, brand, serialNumbers) => {
        if (processAction === '直接報廢') {
            let availableAssetsForScrap = assetList?.filter(a => a.customerName === order.customerName && a.name === name.trim() && (!a.status || a.status === '使用中')) || [];

            for (let i = 0; i < quantity; i++) {
                const sn = serialNumbers[i] || '';
                let existingAsset = null;
                if (sn) existingAsset = availableAssetsForScrap.find(a => a.serialNumber === sn);
                if (!existingAsset) existingAsset = availableAssetsForScrap.find(a => !a.serialNumber) || availableAssetsForScrap[0];

                if (existingAsset) {
                    availableAssetsForScrap = availableAssetsForScrap.filter(a => a.id !== existingAsset.id);
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment_assets', existingAsset.id), {
                        ...existingAsset, status: '已報廢', brand: brand || existingAsset.brand, model: model || existingAsset.model, serialNumber: sn || existingAsset.serialNumber, scrapInfo: { date: new Date().toISOString().slice(0, 10), reason: '從工單拆回直接報廢', orderId: order.id, note: `由工單 ${order.id} 退料處理` }, updatedAt: new Date().toISOString()
                    });
                } else {
                    const newAssetId = crypto.randomUUID();
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment_assets', newAssetId), {
                        ...DEFAULT_ASSET_DATA, id: newAssetId, name: name.trim(), brand: brand || '', model: model || '', serialNumber: sn, customerName: order.customerName, location: order.station || '未指定', status: '已報廢', scrapInfo: { date: new Date().toISOString().slice(0, 10), reason: '從工單拆回直接報廢', orderId: order.id, note: `由工單 ${order.id} 退料處理` }, updatedAt: new Date().toISOString()
                    });
                }
            }
        } else {
            // 二手入庫
            const invColRef = collection(db, 'artifacts', appId, 'public', 'data', 'inventory_items');
            const invSnapshot = await getDocs(invColRef);
            const currentItems = invSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            
            let targetItem = currentItems.find(i => i.name === name.trim() && i.category === '二手備品' && (!model || i.model === model));
            if (!targetItem) targetItem = currentItems.find(i => i.name === name.trim() && (!model || i.model === model));
            const itemId = targetItem ? targetItem.id : crypto.randomUUID();
            
            const validSns = serialNumbers.filter(Boolean).map(s => s.trim());
            const snString = validSns.join(', ');
            const extraNote = [brand ? `廠牌:${brand}` : '', snString ? `S/N:${snString}` : ''].filter(Boolean).join(', ');
            const fullNote = `從工單 ${order.id} 拆回` + (extraNote ? ` (${extraNote})` : '');
            
            const logEntry = { date: new Date().toISOString().slice(0, 10), type: '拆機入庫', qty: quantity, action: 'add', note: fullNote, orderId: order.id, customer: order.customerName, image: '' };
            let updatedQuantity = targetItem ? parseInt(targetItem.quantity) : 0;
            updatedQuantity += quantity;
            
            let updatedSns = targetItem?.serialNumber || '';
            if (snString) {
                const existing = updatedSns.split(',').map(s => s.trim()).filter(Boolean);
                updatedSns = Array.from(new Set([...existing, ...validSns])).join(', ');
            }
            
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', itemId), {
                ...(targetItem || { ...DEFAULT_INVENTORY_ITEM, id: itemId, name: name.trim(), model: model || '', category: '二手備品' }),
                quantity: updatedQuantity, 
                serialNumber: updatedSns, 
                usageLog: [...(targetItem?.usageLog || []), logEntry], 
                updatedAt: new Date().toISOString()
            });
        }
    };

    const handleDistChange = (idx, field, value, totalStr) => {
        if (['brand', 'serialNumbers', 'model'].includes(field)) {
            setDistributions(prev => ({ ...prev, [idx]: { ...(prev[idx] || {}), [field]: value } }));
            return;
        }
        
        const total = parseInt(totalStr) || 0;
        let val = value === '' ? 0 : parseInt(value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > total) val = total;
        
        setDistributions(prev => {
            const updated = { ...(prev[idx] || { recycle: total, scrap: 0, brand: '', serialNumbers: Array(total).fill(''), model: '' }) };
            updated[field] = val;
            const otherField = field === 'recycle' ? 'scrap' : 'recycle';
            updated[otherField] = total - val;
            return { ...prev, [idx]: updated };
        });
    };

    const handleManualQtyChange = (e) => {
        const val = e.target.value;
        setQty(val);
        const num = parseInt(val) || 1;
        setItemSerialNumbers(prev => {
            const newArr = [...prev];
            if (newArr.length < num) {
                while(newArr.length < num) newArr.push('');
            } else if (newArr.length > num) {
                newArr.length = num;
            }
            return newArr;
        });
    };

    const handleProcess = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (!hasParts) {
                if (!itemName || !qty || parseInt(qty) <= 0) {
                    alert("請輸入正確的名稱與數量");
                    setProcessing(false);
                    return;
                }
                await processItem(itemName, parseInt(qty), action, itemModel, itemBrand, itemSerialNumbers);
            } else {
                for (let i = 0; i < order.dismantledParts.length; i++) {
                    const part = order.dismantledParts[i];
                    const dist = distributions[i] || { recycle: parseInt(part.qty) || 0, scrap: 0, model: part.model || '', brand: '', serialNumbers: [] };
                    
                    if (dist.recycle + dist.scrap !== (parseInt(part.qty) || 0)) {
                        alert(`「${part.name}」的處理數量總和不等於預計退回數量，請檢查！`);
                        setProcessing(false);
                        return;
                    }

                    const recycleSns = (dist.serialNumbers || []).slice(0, dist.recycle);
                    const scrapSns = (dist.serialNumbers || []).slice(dist.recycle, dist.recycle + dist.scrap);

                    if (dist.recycle > 0) {
                        await processItem(part.name, dist.recycle, '二手入庫', dist.model, dist.brand, recycleSns);
                    }
                    if (dist.scrap > 0) {
                        await processItem(part.name, dist.scrap, '直接報廢', dist.model, dist.brand, scrapSns);
                    }
                }
            }
            await handleCompleteOrder();
            alert(`拆回舊品處理完成！`);
            setItemName('');
            setItemModel('');
            setItemBrand('');
            setItemSerialNumbers(['']);
            setQty('1');
        } catch (error) {
            console.error(error);
            alert("處理失敗");
        } finally {
            setProcessing(false);
        }
    };

    const handleCompleteOrder = async () => {
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'maintenance_orders', order.id), { ...order, dismantledProcessed: true, updatedAt: new Date().toISOString() });
            onClose();
        } catch (error) { console.error(error); alert("標記失敗"); }
    };

    const nameOptions = action === '二手入庫' ? Array.from(new Set(items.map(i => i.name))) : Array.from(new Set(assetList?.filter(a => a.customerName === order.customerName && (!a.status || a.status === '使用中')).map(a => a.name) || []));

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full border border-white/20 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Recycle size={20} className="text-emerald-600"/> 處理拆回品 (內勤建檔)</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-1">
                    {hasParts ? (
                        <div className="space-y-3">
                            <div className="text-sm font-bold text-slate-700 mb-2">工單內登錄之舊品：</div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2">舊品名稱 & 型號</th>
                                            <th className="px-4 py-2">補充資訊 (廠牌 / 序號)</th>
                                            <th className="px-4 py-2 text-center w-16">總計</th>
                                            <th className="px-4 py-2 text-center w-24 text-emerald-700">入庫數量</th>
                                            <th className="px-4 py-2 text-center w-24 text-orange-700">報廢數量</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.dismantledParts.map((part, idx) => {
                                            const dist = distributions[idx] || { recycle: parseInt(part.qty) || 0, scrap: 0, model: part.model || '', brand: '', serialNumbers: [] };
                                            return (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-bold text-slate-700 mb-1">{part.name}</div>
                                                    <input type="text" placeholder="型號/規格" value={dist.model} onChange={(e) => handleDistChange(idx, 'model', e.target.value)} className="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-blue-400 bg-white" />
                                                </td>
                                                <td className="px-4 py-3 align-top space-y-1.5">
                                                    <input type="text" placeholder="廠牌 (如: Hitachi)" value={dist.brand} onChange={(e) => handleDistChange(idx, 'brand', e.target.value)} className="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-blue-400 bg-white" />
                                                    {Array.from({ length: parseInt(part.qty) || 1 }).map((_, snIdx) => {
                                                        const isRecycle = snIdx < dist.recycle;
                                                        const isScrap = snIdx >= dist.recycle && snIdx < (dist.recycle + dist.scrap);
                                                        let colorClass = "border-slate-200 focus:border-blue-400 bg-white";
                                                        let labelSuffix = "";
                                                        
                                                        if (isRecycle) {
                                                            colorClass = "border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/50 text-emerald-900 placeholder:text-emerald-500/60";
                                                            labelSuffix = " (入庫)";
                                                        } else if (isScrap) {
                                                            colorClass = "border-orange-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-orange-50/50 text-orange-900 placeholder:text-orange-500/60";
                                                            labelSuffix = " (報廢)";
                                                        }
                                                        
                                                        return (
                                                            <div key={snIdx} className="relative">
                                                                <input type="text" placeholder={`機身序號 (S/N) - 第 ${snIdx + 1} 台${labelSuffix}`} value={dist.serialNumbers?.[snIdx] || ''} onChange={(e) => {
                                                                    const newSns = [...(dist.serialNumbers || Array(parseInt(part.qty) || 1).fill(''))];
                                                                    newSns[snIdx] = e.target.value;
                                                                    handleDistChange(idx, 'serialNumbers', newSns);
                                                                }} className={`w-full text-xs border rounded p-1.5 outline-none transition-all ${colorClass}`} />
                                                                {isRecycle && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-sm"></div>}
                                                                {isScrap && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-sm"></div>}
                                                            </div>
                                                        );
                                                    })}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-600 text-base align-middle">{part.qty}</td>
                                                <td className="px-4 py-3 align-middle">
                                                    <input type="number" min="0" max={part.qty} value={dist.recycle} onChange={(e) => handleDistChange(idx, 'recycle', e.target.value, part.qty)} className="w-full border border-emerald-300 rounded-lg p-1.5 text-center outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 bg-emerald-50 font-bold text-emerald-700 transition-all shadow-sm" />
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <input type="number" min="0" max={part.qty} value={dist.scrap} onChange={(e) => handleDistChange(idx, 'scrap', e.target.value, part.qty)} className="w-full border border-orange-300 rounded-lg p-1.5 text-center outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 bg-orange-50 font-bold text-orange-700 transition-all shadow-sm" />
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-100">
                                <HelpCircle size={14} className="shrink-0 mt-0.5"/> 
                                <div>
                                    為了資產紀錄的完整性，系統已自動依據退料數量展開「序號 (S/N)」輸入框。<br/>
                                    <div className="flex items-center gap-4 mt-1 font-medium">
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm"></span> 綠色欄位對應 <b>二手入庫</b></span>
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 shadow-sm"></span> 橘色欄位對應 <b>直接報廢</b></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <div className="text-xs font-bold text-amber-800 mb-1">工單舊版文字紀錄：</div>
                                <div className="text-sm text-amber-900 whitespace-pre-wrap">{order.dismantledDescription || '無特別註明'}</div>
                            </div>
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label required>物品名稱</Label>
                                        <DatalistInput listId="dismantled-items-list" value={itemName} onChange={(e) => setItemName(e.target.value)} options={nameOptions} placeholder="輸入或選擇物品名稱..." required />
                                    </div>
                                    <div><Label>廠牌</Label><Input value={itemBrand} onChange={(e) => setItemBrand(e.target.value)} placeholder="例如: Daikin" /></div>
                                    <div><Label>型號/規格</Label><Input value={itemModel} onChange={(e) => setItemModel(e.target.value)} placeholder="例如: 20RT" /></div>
                                    
                                    <div>
                                        <Label required>處置方式</Label>
                                        <Select value={action} onChange={(e) => setAction(e.target.value)} options={['二手入庫', '直接報廢']} required />
                                    </div>
                                    <div>
                                        <Label required>數量</Label>
                                        <Input type="number" min="1" value={qty} onChange={handleManualQtyChange} required />
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label>序號 (S/N) - 依據上方數量填寫對應台數</Label>
                                        {itemSerialNumbers.map((sn, idx) => {
                                            const isRecycle = action === '二手入庫';
                                            const colorClass = isRecycle 
                                                ? "border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/50 text-emerald-900 placeholder:text-emerald-500/60"
                                                : "border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-orange-50/50 text-orange-900 placeholder:text-orange-500/60";
                                            const labelSuffix = isRecycle ? " (入庫)" : " (報廢)";
                                            return (
                                                <div key={idx} className="relative">
                                                    <Input value={sn} onChange={(e) => {
                                                        const newArr = [...itemSerialNumbers];
                                                        newArr[idx] = e.target.value;
                                                        setItemSerialNumbers(newArr);
                                                    }} placeholder={`原廠機身序號 ${idx + 1}${labelSuffix}`} className={`!py-2.5 !text-sm transition-all ${colorClass}`} />
                                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm ${isRecycle ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center gap-4">
                    <button onClick={handleCompleteOrder} className="text-slate-500 px-4 py-2 hover:bg-slate-50 rounded-xl text-sm transition font-medium">跳過並標記結案</button>
                    <button onClick={handleProcess} disabled={processing} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 text-sm shadow-md font-bold transition flex items-center gap-2 shrink-0 disabled:opacity-50">
                        {processing ? '處理中...' : '確認批次處理'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatisticsPanel = ({ orders, onCancel }) => {
    const maintenanceOrders = orders.filter(o => o.type === 'maintenance');
    const maintenanceCompleted = maintenanceOrders.filter(o => o.completionTime || (o.checklist && o.checklist.length > 0)); 
    const maintenanceRate = maintenanceOrders.length > 0 ? Math.round((maintenanceCompleted.length / maintenanceOrders.length) * 100) : 0;
    const repairOrders = orders.filter(o => o.type === 'repair' || o.type === 'construction');
    const repairCompleted = repairOrders.filter(o => o.testOk || o.completionTime);
    const repairRate = repairOrders.length > 0 ? Math.round((repairCompleted.length / repairOrders.length) * 100) : 0;
    const statsByLocation = orders.reduce((acc, curr) => { const loc = curr.locationType || '未分類'; const cust = curr.customerName || '未指定客戶'; if (!acc.types[loc]) acc.types[loc] = { mTotal: 0, mDone: 0, rTotal: 0, rDone: 0 }; if (!acc.custs[cust]) acc.custs[cust] = { mTotal: 0, mDone: 0, rTotal: 0, rDone: 0 }; if (curr.type === 'maintenance') { acc.types[loc].mTotal++; acc.custs[cust].mTotal++; if (curr.completionTime || (curr.checklist && curr.checklist.length > 0)) { acc.types[loc].mDone++; acc.custs[cust].mDone++; } } else if (curr.type === 'repair' || curr.type === 'construction') { acc.types[loc].rTotal++; acc.custs[cust].rTotal++; if (curr.testOk || curr.completionTime) { acc.types[loc].rDone++; acc.custs[cust].rDone++; } } return acc; }, { types: {}, custs: {} });
    const equipmentFaults = repairOrders.reduce((acc, curr) => { const eq = curr.equipment || '未指定設備'; acc[eq] = (acc[eq] || 0) + 1; return acc; }, {});
    const sortedFaults = Object.entries(equipmentFaults).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ label: name, value: count })).slice(0, 5);
    const partsStats = orders.reduce((acc, curr) => { if (curr.replacedParts && Array.isArray(curr.replacedParts)) { curr.replacedParts.forEach(part => { if (part.name) { acc[part.name] = (acc[part.name] || 0) + (parseInt(part.qty) || 1); } }); } return acc; }, {});
    const sortedParts = Object.entries(partsStats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ label: name, value: qty }));
    const locationChartData = Object.entries(statsByLocation.types).map(([type, data]) => ({ label: type, value1: data.mTotal > 0 ? Math.round((data.mDone / data.mTotal) * 100) : 0, value2: data.rTotal > 0 ? Math.round((data.rDone / data.rTotal) * 100) : 0, sub1: `${data.mDone}/${data.mTotal} 單`, sub2: `${data.rDone}/${data.rTotal} 單` }));
    const customerChartData = Object.entries(statsByLocation.custs).map(([cust, data]) => ({ label: cust, value1: data.mTotal > 0 ? Math.round((data.mDone / data.mTotal) * 100) : 0, value2: data.rTotal > 0 ? Math.round((data.rDone / data.rTotal) * 100) : 0, sub1: `${data.mDone}/${data.mTotal} 單`, sub2: `${data.rDone}/${data.rTotal} 單` }));
    return (
        <div className="space-y-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><PieChart className="text-blue-600" /> 統計分析看板</h2><button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回總覽</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="p-6 bg-white border-t-4 border-t-blue-500"><h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-blue-500"/> 總體平均績效</h3><div className="flex justify-around items-center h-48"><SimplePieChart title="保養完成率" percentage={maintenanceRate} color="text-emerald-500" subText={`${maintenanceCompleted.length}/${maintenanceOrders.length} 單`} icon={Activity}/><div className="h-32 w-px bg-slate-200 mx-2"></div><SimplePieChart title="報修/施工完成率" percentage={repairRate} color="text-amber-500" subText={`${repairCompleted.length}/${repairOrders.length} 單`} icon={Wrench}/></div></Card><Card className="p-6"><SectionTitle title="各場域類別完成率 (平均)" icon={Building2} className="mt-0" /><div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">{locationChartData.length === 0 ? (<p className="text-center text-slate-400 py-8">尚無分類數據</p>) : (locationChartData.map((d, i) => (<div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-100"><h4 className="text-md font-bold text-slate-700 mb-2 border-b pb-2 border-slate-200">{d.label}</h4><div className="flex justify-around items-center"><SimplePieChart title="保養" percentage={d.value1} color="text-emerald-500" subText={d.sub1}/><div className="h-20 w-px bg-slate-200 mx-1"></div><SimplePieChart title="報修" percentage={d.value2} color="text-amber-500" subText={d.sub2}/></div></div>)))}</div></Card></div><Card className="p-6"><SectionTitle title="各案場(客戶)詳細數據" icon={LayoutDashboard} className="mt-0" /><DualBarChart data={customerChartData} color1="bg-emerald-500" color2="bg-amber-500" label1="保養完成率" label2="報修完成率" height={220}/></Card><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card className="p-6"><SectionTitle title="故障設備排行 (TOP 5)" icon={AlertCircle} className="mt-0" /><GenericPieChart data={sortedFaults} /></Card><Card className="p-6"><SectionTitle title="零件更換排行 (TOP 5)" icon={Layers} className="mt-0" /><GenericPieChart data={sortedParts} /></Card></div></div>
    );
};

// -----------------------------------------------------------
// Editor Components (Lists, Staff, Customers) with Import/Export
// -----------------------------------------------------------

const ListEditor = ({ title, items, onUpdate, icon: Icon }) => {
    const [newItem, setNewItem] = useState(''); const [editingIndex, setEditingIndex] = useState(null); const [editingValue, setEditingValue] = useState(''); const { confirm, ConfirmDialog } = useConfirm();
    const [showBatch, setShowBatch] = useState(false); const [batchText, setBatchText] = useState('');

    const handleAdd = () => { if (newItem.trim()) { onUpdate([...items, newItem.trim()]); setNewItem(''); } };
    const handleDelete = (index) => { confirm({ message: `確定要刪除「${items[index]}」嗎？`, onConfirm: () => { onUpdate(items.filter((_, i) => i !== index)); } }); };
    const saveEdit = (index) => { if (editingValue.trim()) { const newItems = [...items]; newItems[index] = editingValue.trim(); onUpdate(newItems); setEditingIndex(null); } };
    const handleBatchAdd = () => {
        if (!batchText.trim()) return;
        const newLines = batchText.split('\n').map(s => s.trim()).filter(s => s !== '');
        const uniqueNew = newLines.filter(line => !items.includes(line));
        if (uniqueNew.length > 0) {
            onUpdate([...items, ...uniqueNew]);
            setBatchText('');
            setShowBatch(false);
        } else {
            alert("沒有發現新的有效項目 (可能都已存在)");
        }
    };

    return (<div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative"><ConfirmDialog />
        <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-slate-700 flex items-center gap-2">{Icon ? <Icon size={16} /> : <List size={16} />} {title}</h4>
            <button onClick={() => setShowBatch(!showBatch)} className={`text-xs px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${showBatch ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`} title="批次從 Excel 貼上"><CopyPlus size={14}/>批次新增</button>
        </div>
        
        {showBatch ? (
            <div className="mb-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <Textarea rows="4" placeholder="請直接從 Excel 複製一整直行的文字，並貼上於此..." value={batchText} onChange={(e) => setBatchText(e.target.value)}></Textarea>
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setShowBatch(false)} className="text-xs text-slate-500 px-3 py-1.5 hover:bg-slate-100 rounded-lg">取消</button>
                    <button onClick={handleBatchAdd} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm font-medium">確認匯入</button>
                </div>
            </div>
        ) : (
            <div className="flex gap-2 mb-3">
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`新增單一${title}...`} onKeyPress={(e) => e.key === 'Enter' && handleAdd()}/>
                <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-1 shrink-0"><Plus size={16} /> 新增</button>
            </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">{items.map((item, index) => (<div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm">{editingIndex === index ? (<div className="flex flex-1 gap-2 items-center"><Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="h-8 py-1"/><button onClick={() => saveEdit(index)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={16}/></button><button onClick={() => setEditingIndex(null)} className="text-red-600 hover:bg-red-50 p-1 rounded"><X size={16}/></button></div>) : (<><span className="text-slate-700 truncate">{item}</span><div className="flex gap-1 shrink-0"><button onClick={() => {setEditingIndex(index); setEditingValue(item)}} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 size={14}/></button><button onClick={() => handleDelete(index)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button></div></>)}</div>))}</div></div>);
};

const StaffListEditor = ({ title, items, onUpdate, icon: Icon }) => {
    const [newItem, setNewItem] = useState(''); 
    const [editingIndex, setEditingIndex] = useState(null); 
    const [editingValue, setEditingValue] = useState(''); 
    const { confirm, ConfirmDialog } = useConfirm();
    const normalizedItems = normalizeStaffList(items);

    const handleAdd = () => { 
        if (newItem.trim()) { 
            if (normalizedItems.some(i => i.name === newItem.trim())) { alert("該人員已存在！"); return; }
            onUpdate([...normalizedItems, { name: newItem.trim(), password: null }]); 
            setNewItem(''); 
        } 
    };
    
    const handleDelete = (index) => { 
        confirm({ message: `確定要刪除「${normalizedItems[index].name}」嗎？這將會清除他的所有登入設定。`, onConfirm: () => { onUpdate(normalizedItems.filter((_, i) => i !== index)); } }); 
    };
    
    const saveEdit = (index) => { 
        if (editingValue.trim()) { 
            if (normalizedItems.some((i, idx) => idx !== index && i.name === editingValue.trim())) { alert("該名稱已被其他人使用！"); return; }
            const newItems = [...normalizedItems]; newItems[index] = { ...newItems[index], name: editingValue.trim() }; 
            onUpdate(newItems); setEditingIndex(null); 
        } 
    };

    const handleResetPassword = (index) => {
        confirm({ title: "重置密碼", message: `確定要清除「${normalizedItems[index].name}」的密碼嗎？\n清除後，他下次登入時需要重新設定新密碼。`, onConfirm: () => { const newItems = [...normalizedItems]; newItems[index] = { ...newItems[index], password: null }; onUpdate(newItems); alert(`已重置 ${normalizedItems[index].name} 的密碼。`); }, isDanger: false });
    };

    const handleExportCSV = () => {
        const header = "人員名稱,登入密碼\n";
        const rows = normalizedItems.map(s => `"${s.name}","${s.password || ''}"`).join('\n');
        const csvContent = "\uFEFF" + header + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `人員名單_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const rows = parseCSV(text);
            if (rows.length < 2) { alert("檔案內容為空或格式不符"); return; }
            
            confirm({
                title: '確認匯入人員名單',
                message: `將匯入 ${rows.length - 1} 筆人員資料。\n若人員已存在將更新密碼（留空則不更改密碼），不同名則新增，是否繼續？`,
                onConfirm: () => {
                    const newStaffs = [...normalizedItems];
                    for(let i=1; i<rows.length; i++) {
                        const row = rows[i];
                        if (row.length < 1 || !row[0]) continue;
                        const name = row[0].trim();
                        const pwd = row[1] ? row[1].trim() : null;
                        if (!name) continue;

                        const existingIdx = newStaffs.findIndex(s => s.name === name);
                        if (existingIdx >= 0) {
                            if (pwd) newStaffs[existingIdx].password = pwd;
                        } else {
                            newStaffs.push({ name, password: pwd });
                        }
                    }
                    onUpdate(newStaffs);
                    alert("匯入完成！");
                },
                isDanger: false
            });
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
            <ConfirmDialog />
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2">{Icon ? <Icon size={16} /> : <Users size={16} />} {title}</h4>
                <div className="flex gap-1">
                    <button onClick={handleExportCSV} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="匯出 CSV"><Download size={16}/></button>
                    <label className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer" title="匯入 CSV">
                        <Upload size={16}/>
                        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                    </label>
                </div>
            </div>
            <div className="flex gap-2 mb-3">
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`新增${title}...`} onKeyPress={(e) => e.key === 'Enter' && handleAdd()}/>
                <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-1 shrink-0"><Plus size={16} /> 新增</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {normalizedItems.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded border border-slate-200 text-sm gap-2">
                        {editingIndex === index ? (
                            <div className="flex flex-1 gap-2 items-center w-full">
                                <Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="h-8 py-1"/>
                                <button onClick={() => saveEdit(index)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg"><Check size={16}/></button>
                                <button onClick={() => setEditingIndex(null)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><X size={16}/></button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <span className="text-slate-800 font-bold truncate">{item.name}</span>
                                    {item.password ? (
                                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1 shrink-0"><Lock size={10}/> 已設密碼</span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shrink-0">未設定</span>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0 justify-end">
                                    {item.password && (
                                        <button onClick={() => handleResetPassword(index)} className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg transition text-xs font-medium border border-transparent hover:border-amber-200 flex items-center gap-1">
                                            <RefreshCw size={12}/> 重置密碼
                                        </button>
                                    )}
                                    <button onClick={() => {setEditingIndex(index); setEditingValue(item.name)}} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-slate-50 rounded-lg transition" title="重新命名"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDelete(index)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-slate-50 rounded-lg transition" title="刪除人員"><Trash2 size={14}/></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {normalizedItems.length === 0 && <div className="text-center text-slate-400 text-sm py-4">尚無人員</div>}
            </div>
        </div>
    );
};

const SettingsPanel = ({ customers, setCustomers, stations, setStations, equipment, setEquipment, specs, setSpecs, serviceItems, setServiceItems, parts, setParts, staffList, setStaffList, cycles, setCycles, checklistTemplate, setChecklistTemplate, orders, importData, schedules, setSchedules, onCancel, user, baseUrl, setBaseUrl, appPermissions, setAppPermissions }) => {
    const [newName, setNewName] = useState(''); const [newAddress, setNewAddress] = useState(''); const [newType, setNewType] = useState('商辦'); const [activeSettingTab, setActiveSettingTab] = useState('customer'); const { confirm, ConfirmDialog } = useConfirm();
    const [showAdminPwd, setShowAdminPwd] = useState(false);
    const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl || ''); const [isUrlDirty, setIsUrlDirty] = useState(false);
    
    useEffect(() => { setLocalBaseUrl(baseUrl || ''); setIsUrlDirty(false); }, [baseUrl]);
    const handleBaseUrlChange = (e) => { setLocalBaseUrl(e.target.value); setIsUrlDirty(true); };
    const handleSaveBaseUrl = () => { setBaseUrl(localBaseUrl); setIsUrlDirty(false); alert("系統網址已更新！"); };
    const handleAddCustomer = () => { if (newName.trim()) { setCustomers([...customers, { name: newName.trim(), address: newAddress.trim(), type: newType }]); setNewName(''); setNewAddress(''); } };
    const handleDeleteCustomer = (index) => { confirm({ title: "刪除客戶", message: `確定要刪除客戶「${customers[index].name}」嗎？`, onConfirm: () => { setCustomers(customers.filter((_, i) => i !== index)); } }); };
    
    const handleExportCustomerCSV = () => {
        const header = "客戶名稱,場域類型,客戶地址\n";
        const rows = customers.map(c => `"${c.name}","${c.type || '商辦'}","${c.address || ''}"`).join('\n');
        const csvContent = "\uFEFF" + header + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', `客戶資料_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleImportCustomerCSV = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const rows = parseCSV(text);
            if (rows.length < 2) { alert("檔案內容為空或格式不符"); return; }
            
            confirm({
                title: '確認匯入客戶資料',
                message: `將匯入 ${rows.length - 1} 筆客戶資料。\n如果名稱已存在，將覆蓋其場域與地址資訊，是否繼續？`,
                onConfirm: () => {
                    const newCusts = [...customers];
                    for(let i=1; i<rows.length; i++) {
                        const row = rows[i];
                        if (row.length < 1 || !row[0]) continue;
                        const name = row[0].trim();
                        const type = row[1] ? row[1].trim() : '商辦';
                        const address = row[2] ? row[2].trim() : '';
                        if (!name) continue;

                        const existingIdx = newCusts.findIndex(c => c.name === name);
                        if (existingIdx >= 0) {
                            newCusts[existingIdx] = { name, type, address };
                        } else {
                            newCusts.push({ name, type, address });
                        }
                    }
                    setCustomers(newCusts);
                    alert("客戶資料匯入完成！");
                },
                isDanger: false
            });
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExport = async () => { 
        try {
            const assetSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'equipment_assets'));
            const invSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'inventory_items'));
            const assetsExport = assetSnap.docs.map(d => ({ ...d.data(), id: d.id }));
            const invExport = invSnap.docs.map(d => ({ ...d.data(), id: d.id }));

            const data = { 
                version: '1.1', 
                timestamp: new Date().toISOString(), 
                orders, customers, stations, equipment, specs, serviceItems, parts, staffList, checklistTemplate, schedules, cycles, appPermissions,
                assets: assetsExport,
                inventory: invExport
            }; 
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); 
            const url = URL.createObjectURL(blob); 
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = `maintenance_system_backup_${new Date().toISOString().slice(0,10)}.json`; 
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); 
        } catch (e) {
            console.error(e);
            alert("匯出失敗，無法讀取資料庫");
        }
    };

    const handleImport = (e) => { 
        const file = e.target.files[0]; if (!file) return; 
        const reader = new FileReader(); 
        reader.onload = (event) => { 
            try { 
                const data = JSON.parse(event.target.result); 
                confirm({ 
                    title: "匯入警告", 
                    message: "警告：匯入將會「完全覆蓋」現有所有資料 (包含工單、資產、庫存)，此操作無法復原。確定要繼續嗎？", 
                    onConfirm: () => { 
                        importData(data); 
                    }, 
                    isDanger: true 
                }); 
            } catch (err) { console.error(err); alert("匯入失敗：檔案格式錯誤"); } 
        }; 
        reader.readAsText(file); e.target.value = ''; 
    };
    
    return (
        <div className="max-w-4xl mx-auto space-y-6"><ConfirmDialog /><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-slate-600" /> 系統設定</h2><button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回總覽</button></div>
            <div className="flex space-x-1 bg-slate-200/50 p-1.5 rounded-xl w-fit flex-wrap"><button onClick={() => setActiveSettingTab('customer')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeSettingTab === 'customer' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>客戶資料管理</button><button onClick={() => setActiveSettingTab('lists')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeSettingTab === 'lists' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>選單項目管理</button><button onClick={() => setActiveSettingTab('permissions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeSettingTab === 'permissions' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>權限與模組</button><button onClick={() => setActiveSettingTab('system')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeSettingTab === 'system' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>系統資料備份</button></div>
            {activeSettingTab === 'customer' && (<Card className="p-6">
                <div className="flex justify-between items-center border-b border-slate-100 mb-6 pb-3">
                    <div className="flex items-center gap-3 text-slate-800 font-bold text-lg tracking-wide"><div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl text-slate-600 shadow-inner"><User size={20} /></div><h3>客戶資料管理</h3></div>
                    <div className="flex gap-2">
                        <button onClick={handleExportCustomerCSV} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1 shadow-sm"><Download size={14}/> 匯出 Excel (CSV)</button>
                        <label className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1 shadow-sm cursor-pointer">
                            <Upload size={14}/> 匯入 Excel (CSV)
                            <input type="file" accept=".csv" onChange={handleImportCustomerCSV} className="hidden" />
                        </label>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100"><div className="w-full md:w-32"><Label>場域類型</Label><Select value={newType} onChange={(e) => setNewType(e.target.value)} options={['商辦', '廠區']} /></div><div className="flex-1"><Label>客戶名稱</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="名稱" /></div><div className="flex-[2]"><Label>客戶地址</Label><Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="地址" /></div><div className="flex items-end"><button onClick={handleAddCustomer} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition flex items-center gap-2 w-full justify-center md:w-auto shadow-md"><Plus size={16} /> 新增</button></div></div><div className="space-y-2">{customers.map((c, i) => (<div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white transition group gap-2"><div className="flex-1 flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${c.type === '廠區' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{c.type || '商辦'}</span><span className="font-medium text-slate-800">{c.name}</span><span className="text-slate-500 text-sm">{c.address}</span></div><button onClick={() => handleDeleteCustomer(i)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button></div>))}</div></Card>)}
            {activeSettingTab === 'lists' && (<Card className="p-6"><SectionTitle title="下拉選單項目管理" icon={Tags} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="col-span-1 md:col-span-2 lg:col-span-3"><ListEditor title="保養檢查項目模板" items={checklistTemplate} onUpdate={setChecklistTemplate} icon={CheckSquare} /></div><StaffListEditor title="人員名單 (含密碼管理)" items={staffList} onUpdate={setStaffList} icon={Users} /><ListEditor title="站別" items={stations} onUpdate={setStations} /><ListEditor title="設備" items={equipment} onUpdate={setEquipment} /><ListEditor title="規格" items={specs} onUpdate={setSpecs} /><ListEditor title="保養週期" items={cycles} onUpdate={setCycles} icon={CalendarClock} /><ListEditor title="工作項目" items={serviceItems} onUpdate={setServiceItems} /><ListEditor title="更換零件清單" items={parts} onUpdate={setParts} /></div></Card>)}
            {activeSettingTab === 'permissions' && (<Card className="p-6"><SectionTitle title="功能模組與權限開關 (全域)" icon={Shield} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><h3 className="font-bold text-slate-700 border-b pb-2">工程師介面模組開放</h3><label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition"><span className="text-sm font-medium">開放工程師檢視「設備資產庫」</span><input type="checkbox" checked={appPermissions.showAssets} onChange={(e) => setAppPermissions({...appPermissions, showAssets: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /></label><label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition"><span className="text-sm font-medium">開放工程師檢視「庫存管理」</span><input type="checkbox" checked={appPermissions.showInventory} onChange={(e) => setAppPermissions({...appPermissions, showInventory: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /></label><label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition"><span className="text-sm font-medium">開放工程師檢視「統計看板」</span><input type="checkbox" checked={appPermissions.showStats} onChange={(e) => setAppPermissions({...appPermissions, showStats: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /></label><label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition"><span className="text-sm font-medium">開放工程師檢視「保養排程」</span><input type="checkbox" checked={appPermissions.showSchedule} onChange={(e) => setAppPermissions({...appPermissions, showSchedule: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /></label></div><div className="space-y-4"><h3 className="font-bold text-slate-700 border-b pb-2">操作權限與安全</h3><label className="flex items-center justify-between p-3 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition border border-red-100"><span className="text-sm font-medium text-red-800">允許「刪除工單」功能</span><input type="checkbox" checked={appPermissions.allowDelete} onChange={(e) => setAppPermissions({...appPermissions, allowDelete: e.target.checked})} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" /></label><div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4"><Label>管理員登入密碼</Label><div className="relative"><Input type={showAdminPwd ? "text" : "password"} value={appPermissions.adminPassword} onChange={(e) => setAppPermissions({...appPermissions, adminPassword: e.target.value})} placeholder="設定管理員密碼..." /><button type="button" onClick={() => setShowAdminPwd(!showAdminPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors" title={showAdminPwd ? "隱藏密碼" : "顯示密碼"}>{showAdminPwd ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><p className="text-xs text-slate-500 mt-2">切換至「管理員」身分時需要的密碼 (預設 admin)。</p></div></div></div></Card>)}
            {activeSettingTab === 'system' && (<Card className="p-6"><SectionTitle title="系統資料備份與還原" icon={Database} className="mt-0" /><div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200"><Label>系統網址 (Base URL)</Label><div className="flex gap-2"><Input value={localBaseUrl} onChange={handleBaseUrlChange} placeholder="https://..." /><button onClick={handleSaveBaseUrl} className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1 ${isUrlDirty ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} disabled={!isUrlDirty}><Save size={16}/> {isUrlDirty ? '儲存設定' : '已儲存'}</button></div><p className="text-xs text-slate-500 mt-2">此網址將用於派工單通知訊息中的連結前綴。</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center space-y-4"><Download size={32} className="text-blue-600" /><h3>匯出備份</h3><button onClick={handleExport} className="bg-white text-blue-600 border border-blue-200 px-6 py-2.5 rounded-xl hover:bg-blue-50 flex items-center gap-2 shadow-sm font-medium"><Download size={18} /> 下載備份檔案</button></div><div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 flex flex-col items-center text-center space-y-4"><Upload size={32} className="text-amber-600" /><h3>匯入還原</h3><div className="relative"><input type="file" accept=".json" onChange={handleImport} className="hidden" id="import-upload" /><label htmlFor="import-upload" className="bg-white text-amber-600 border border-amber-200 px-6 py-2.5 rounded-xl hover:bg-amber-50 flex items-center gap-2 shadow-sm font-medium cursor-pointer"><Upload size={18} /> 選擇檔案匯入</label></div></div></div></Card>)}
        </div>
    );
};

// ... existing components below ...
const ScheduleManager = ({ schedules, setSchedules, onCancel, customers, stations, equipment, staffList, cycles, onCreateDispatch }) => {
    const [isEditing, setIsEditing] = useState(false); const [editIndex, setEditIndex] = useState(null); const [formData, setFormData] = useState(DEFAULT_SCHEDULE_DATA); const { confirm, ConfirmDialog } = useConfirm();
    const [filterMode, setFilterMode] = useState('all');
    useEffect(() => { if (formData.lastMaintenanceDate && formData.cycle) { setFormData(prev => ({...prev, nextMaintenanceDate: calculateNextDate(prev.lastMaintenanceDate, prev.cycle)})); } }, [formData.lastMaintenanceDate, formData.cycle]);
    const handleCustomerChange = (e) => { const selectedName = e.target.value; const customer = customers.find(c => c.name === selectedName); setFormData(prev => ({ ...prev, customerName: selectedName, customerAddress: customer ? customer.address : '', locationType: customer?.type || prev.locationType })); };
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleEdit = (index) => { setFormData(schedules[index]); setEditIndex(index); setIsEditing(true); };
    const handleDelete = (index) => { confirm({ message: "確定要刪除此保養排程嗎？", onConfirm: () => { setSchedules(schedules.filter((_, i) => i !== index)); } }); };
    const handleSave = (e) => { e.preventDefault(); const newSchedules = [...schedules]; if (editIndex !== null) { newSchedules[editIndex] = formData; } else { newSchedules.push(formData); } setSchedules(newSchedules); setIsEditing(false); setEditIndex(null); setFormData(DEFAULT_SCHEDULE_DATA); };
    const getDiffDays = (dateStr) => { if (!dateStr) return 999; const today = new Date(); today.setHours(0,0,0,0); const target = new Date(dateStr); return Math.ceil((target - today) / (1000 * 60 * 60 * 24)); };
    const overdueCount = schedules.filter(s => getDiffDays(s.nextMaintenanceDate) < 0).length;
    const dueSoonCount = schedules.filter(s => { const d = getDiffDays(s.nextMaintenanceDate); return d >= 0 && d <= 7; }).length;
    const totalUrgent = overdueCount + dueSoonCount;
    // 加上 _origIndex 確保排序後仍能對應到原始陣列的正確位置，避免覆蓋錯排程
    const schedulesWithOrigIndex = schedules.map((s, i) => ({...s, _origIndex: i}));
    const filteredSchedules = filterMode === 'urgent' ? schedulesWithOrigIndex.filter(s => getDiffDays(s.nextMaintenanceDate) <= 7) : schedulesWithOrigIndex;
    const sortedSchedules = [...filteredSchedules].sort((a, b) => new Date(a.nextMaintenanceDate) - new Date(b.nextMaintenanceDate));

    return (
        <div className="space-y-6">
            <ConfirmDialog /><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CalendarClock className="text-blue-600" /> 保養排程管理</h2><button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><ArrowLeft size={16} /> 返回總覽</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="p-5 h-full border-t-4 border-t-blue-500">
                        <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">{isEditing ? <Edit2 size={18}/> : <Plus size={18}/>} {isEditing ? '編輯排程' : '新增排程'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><Label required>客戶名稱</Label><DatalistInput listId="customers-list" name="customerName" value={formData.customerName} onChange={handleCustomerChange} options={customers.map(c => c.name)} required placeholder="選擇或手動輸入..." /></div><div><Label>站別/位置</Label><Select name="station" value={formData.station} onChange={handleChange} options={stations} /></div><div><Label>設備名稱</Label><Select name="equipment" value={formData.equipment} onChange={handleChange} options={equipment} /></div><div className="grid grid-cols-2 gap-2"><div><Label required>保養週期</Label><Select name="cycle" value={formData.cycle} onChange={handleChange} options={cycles} required /></div><div><Label required>上次保養日</Label><Input type="date" name="lastMaintenanceDate" value={formData.lastMaintenanceDate} onChange={handleChange} required /></div></div><div><Label>下次保養日 (自動推算)</Label><div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-mono text-center">{formData.nextMaintenanceDate || '-'}</div></div><div><Label>聯絡人</Label><Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} /></div><div><Label>預設負責人</Label><Select name="serviceEngineer" value={formData.serviceEngineer} onChange={handleChange} options={staffList} /></div><div className="pt-4 flex gap-3">{isEditing && (<button type="button" onClick={() => { setIsEditing(false); setEditIndex(null); setFormData(DEFAULT_SCHEDULE_DATA); }} className="flex-1 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition">取消</button>)}<button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 shadow-md font-medium"><Save size={16} /> {isEditing ? '更新排程' : '加入排程'}</button></div>
                        </form>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden h-full flex flex-col">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4"><div className="flex items-center gap-2"><h3 className="font-bold text-slate-700 flex items-center gap-2"><List size={18} /> 排程列表</h3><span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">共 {sortedSchedules.length} 筆</span></div><div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm"><button onClick={() => setFilterMode('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterMode === 'all' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>全部顯示</button><button onClick={() => setFilterMode('urgent')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${filterMode === 'urgent' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>待處理 ({totalUrgent})</button></div></div>
                        {totalUrgent > 0 && filterMode !== 'urgent' && (<div className="bg-amber-50 border-b border-amber-200 p-3 flex items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0"><Bell size={16} /></div><div className="text-sm text-amber-800"><span className="font-bold">提醒：</span> 有 <span className="font-bold text-red-600">{overdueCount}</span> 筆已過期，<span className="font-bold text-amber-600">{dueSoonCount}</span> 筆將在 7 天內到期。</div></div><button onClick={() => setFilterMode('urgent')} className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition">只看待處理</button></div>)}
                        <div className="overflow-y-auto flex-1 p-0">{sortedSchedules.length === 0 ? (<div className="text-center py-12 text-slate-400">{filterMode === 'urgent' ? '目前沒有即狂到期的排程，太棒了！' : '尚無保養排程，請從左側新增。'}</div>) : (<div className="divide-y divide-slate-100">{sortedSchedules.map((item) => { const statusText = getStatusText(item.nextMaintenanceDate); const statusColor = getStatusColor(item.nextMaintenanceDate); const isUrgent = getDiffDays(item.nextMaintenanceDate) <= 7; return (<div key={item._origIndex} className={`p-4 hover:bg-slate-50 transition group ${isUrgent ? 'bg-red-50/30' : ''}`}><div className="flex justify-between items-start mb-2"><div><div className="font-bold text-slate-800 text-lg flex items-center gap-2">{item.customerName}{isUrgent && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full border border-red-200">急</span>}</div><div className="text-sm text-slate-500 flex items-center gap-2 mt-1"><MapPin size={12} /> {item.station || '未指定'} <span className="text-slate-300">|</span> <Wrench size={12} /> {item.equipment || '未指定'}</div></div><div className="text-right"><div className={`text-sm font-bold flex items-center justify-end gap-1 ${statusColor}`}><Clock size={14} />{item.nextMaintenanceDate}</div><div className={`text-xs mt-1 ${statusColor}`}>{statusText}</div></div></div><div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100"><div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">週期: {item.cycle} | 上次: {item.lastMaintenanceDate}</div><div className="flex gap-2"><button onClick={() => onCreateDispatch(item, item._origIndex)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition shadow-sm" title="依據此排程建立工單"><ClipboardList size={14} /> 建立工單</button><button onClick={() => handleEdit(item._origIndex)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={16}/></button><button onClick={() => handleDelete(item._origIndex)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={16}/> </button></div></div></div>); })}</div>)}</div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const FormDispatch = ({ initialData, onSave, onCancel, onConvertToMaintenance, onConvertToRepair, onConvertToConstruction, onConvertToCapa, customers, stations, equipment, specs, serviceItems, staffList, openMessage, baseUrl, assetList, currentIdentity }) => {
    const [formData, setFormData] = useState({ ...DEFAULT_DISPATCH_DATA, ...initialData });
    const [showTaskMenu, setShowTaskMenu] = useState(false);
    const isExistingRecord = formData.id && formData.id !== "系統自動產生";
    const isEngineer = currentIdentity?.type === 'engineer';
    const availableAssets = assetList.filter(a => a.customerName === formData.customerName && (!a.status || a.status === '使用中'));
    const handleCustomerChange = (e) => { const selectedName = e.target.value; const customer = customers.find(c => c.name === selectedName); setFormData(prev => ({ ...prev, customerName: selectedName, customerAddress: customer ? customer.address : '', locationType: customer?.type || prev.locationType, equipment: '', spec: '', assetId: '' })); };
    const handleAssetChange = (e) => { const assetId = e.target.value; const selectedAsset = assetList.find(a => a.id === assetId); if (selectedAsset) { setFormData(prev => ({ ...prev, assetId: assetId, equipment: selectedAsset.name, spec: `${selectedAsset.brand || ''} ${selectedAsset.model || ''}`.trim() || prev.spec, description: selectedAsset.notes ? `${prev.description || ''}\n(設備備註: ${selectedAsset.notes})`.trim() : prev.description })); } else { setFormData(prev => ({ ...prev, assetId: '', equipment: '' })); } };
    const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
    const handleSaveAndPreview = () => { onSave(formData, { stayOnPage: true, onSuccess: (savedData) => { setFormData(savedData); const { text, link } = formatDispatchMessage(savedData, baseUrl); openMessage('派工單通知 (已儲存)', text, link); } }); };
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="max-w-4xl mx-auto flex flex-col relative">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="text-blue-600" /> 派工單</h2>
                <button type="button" onClick={onCancel} className="hidden md:flex bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 items-center gap-2 shadow-sm transition font-medium"><ArrowLeft size={16} /> 返回總覽</button>
            </div>
            <div className="space-y-6 flex-1">
                <Card className="p-6 md:p-8"><SectionTitle title="基本資料" icon={User} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><Label required>填單日期</Label><Input name="date" type="date" value={formData.date} onChange={handleChange} required /></div><div><Label>單號 (自動生成)</Label><Input value={formData.id || "系統自動產生"} disabled /></div><div className={formData.isMultiDay ? "md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" : ""}><div><div className="flex justify-between items-center mb-2"><Label className="mb-0">預定施工日期 {formData.isMultiDay && '(開始)'}</Label><label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 transition"><input type="checkbox" name="isMultiDay" checked={formData.isMultiDay || false} onChange={handleChange} className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />跨日行程</label></div><Input name="constructionDate" type="date" value={formData.constructionDate} onChange={handleChange} /></div>{formData.isMultiDay && (<div className="animate-in fade-in slide-in-from-left-2"><Label>預定完工日 (結束)</Label><Input name="constructionEndDate" type="date" value={formData.constructionEndDate} onChange={handleChange} min={formData.constructionDate} /></div>)}</div><div><Label required>客戶名稱</Label><DatalistInput listId="customers-list" name="customerName" value={formData.customerName} onChange={handleCustomerChange} options={customers.map(c => c.name)} required placeholder="選擇或手動輸入..." /></div><div><Label>場域類型 (自動帶入)</Label><DatalistInput listId="locations-list" name="locationType" value={formData.locationType} onChange={handleChange} options={DEFAULT_LOCATION_TYPES} placeholder="選擇或手動輸入..." /></div><div><Label>客戶地址 (自動帶入)</Label><div className="flex gap-2"><Input name="customerAddress" value={formData.customerAddress} onChange={handleChange} placeholder="選擇客戶後自動帶入，也可手動修改" className="flex-1" />{formData.customerAddress && (<button type="button" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.customerAddress)}`, '_blank')} className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 hover:shadow-sm transition shrink-0 flex items-center justify-center" title="開啟 Google 地圖導航"><MapPin size={18} /></button>)}</div></div><div><Label>聯絡人</Label><Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} /></div><div className="flex items-end gap-2"><div className="flex-1"><Label>聯絡電話/ID</Label><Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} /></div><label className="flex items-center mb-3 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200"><input type="checkbox" name="hasLine" checked={formData.hasLine || false} onChange={handleChange} className="mr-2 w-4 h-4 text-green-500 rounded focus:ring-green-500" /><span className="text-sm font-medium text-slate-700">LINE</span></label></div></div></Card>
                <Card className="p-6 md:p-8"><SectionTitle title="設備與任務" icon={Wrench} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><Label>站別</Label><DatalistInput listId="disp-station" name="station" value={formData.station} onChange={handleChange} options={stations} placeholder="選擇或手動輸入..." /></div>{availableAssets.length > 0 ? (<div><Label>選擇設備資產 ({availableAssets.length} 筆)</Label><select name="assetId" value={formData.assetId || ''} onChange={handleAssetChange} className={`${INPUT_BASE_CLASS} appearance-none cursor-pointer ${INPUT_EDITABLE_CLASS}`}><option value="">-- 請選擇具體設備 --</option>{availableAssets.map(asset => { const w = getWarrantyStatus(asset.warrantyDate); return <option key={asset.id} value={asset.id}>{asset.name} ({asset.brand} {asset.model}) - {w.text}</option>; })}<option value="manual">手動輸入 (不在資產清單中)</option></select></div>) : (<div><Label>設備名稱 (無資產紀錄，請手選)</Label><DatalistInput listId="disp-equip-1" name="equipment" value={formData.equipment} onChange={handleChange} options={equipment} placeholder="選擇或手動輸入..." /></div>)}{(formData.assetId === 'manual' || (availableAssets.length > 0 && !formData.assetId)) && (<div className="animate-in fade-in slide-in-from-top-1"><Label>手動指定設備名稱</Label><DatalistInput listId="disp-equip-2" name="equipment" value={formData.equipment} onChange={handleChange} options={equipment} placeholder="選擇或手動輸入..." /></div>)}<div><Label>設備規格</Label><DatalistInput listId="disp-spec" name="spec" value={formData.spec} onChange={handleChange} options={specs} placeholder="選擇或手動輸入..." /></div><div><Label>工作項目</Label><DatalistInput listId="disp-service" name="serviceItem" value={formData.serviceItem} onChange={handleChange} options={serviceItems} placeholder="選擇或手動輸入..." /></div></div></Card>
                <Card className="p-6 md:p-8"><SectionTitle title="人員與時間" icon={CalendarClock} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><Label>派工人員</Label><Select name="dispatcher" value={formData.dispatcher} onChange={handleChange} options={staffList} /></div><div><Label>報修時間</Label><div className="flex gap-2"><Input name="reportTime" type="datetime-local" value={formData.reportTime} onChange={handleChange} /><button type="button" onClick={() => setFormData({...formData, reportTime: getNowLocalString()})} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-sm font-medium transition shrink-0">現在</button></div></div></div><div className="mt-4"><EngineerTeamSelector staffList={staffList} primary={formData.serviceEngineer} assistants={formData.assistants} onChange={({ primary, assistants }) => setFormData(prev => ({ ...prev, serviceEngineer: primary, assistants }))} /></div></Card>
                <Card className="p-6 md:p-8"><SectionTitle title="狀況描述與照片" icon={FileText} className="mt-0" /><div className="space-y-4"><div><Label>工況描述</Label><Textarea name="description" rows="5" value={formData.description} onChange={handleChange} placeholder="請詳細描述現場狀況..."></Textarea></div><div><PhotoUpload label="異常狀況照片" value={formData.photoIssue} onChange={(val) => setFormData({...formData, photoIssue: val})} /></div></div></Card>
            </div>
            <div className="sticky bottom-[90px] md:bottom-4 z-40 mt-8 bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                    {isExistingRecord && isEngineer && (
                        <div className="relative">
                            <button type="button" onClick={() => setShowTaskMenu(!showTaskMenu)} onBlur={() => setTimeout(() => setShowTaskMenu(false), 200)} className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl text-sm hover:bg-blue-100 flex items-center gap-1.5 transition font-bold shadow-sm">
                                <PlayCircle size={16} /> 執行任務
                            </button>
                            {showTaskMenu && (
                                <div className="absolute left-0 bottom-full mb-3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 min-w-[150px] animate-in slide-in-from-bottom-2 duration-200">
                                    <button type="button" onMouseDown={() => onConvertToMaintenance(formData)} className="text-left px-4 py-3 hover:bg-emerald-50 text-emerald-700 text-sm font-bold border-b border-slate-100 flex items-center gap-2 transition-colors"><Activity size={16} /> 轉為保養單</button>
                                    <button type="button" onMouseDown={() => onConvertToRepair(formData)} className="text-left px-4 py-3 hover:bg-amber-50 text-amber-700 text-sm font-bold border-b border-slate-100 flex items-center gap-2 transition-colors"><Hammer size={16} /> 轉為報修單</button>
                                    <button type="button" onMouseDown={() => onConvertToConstruction(formData)} className="text-left px-4 py-3 hover:bg-indigo-50 text-indigo-700 text-sm font-bold flex items-center gap-2 transition-colors"><PlayCircle size={16} /> 轉為施工單</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" onClick={onCancel} className="md:hidden bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-200 flex items-center gap-1.5 font-medium transition"><ArrowLeft size={16} /> 取消</button>
                    {(!isEngineer || !isExistingRecord) && (
                        <button type="button" onClick={handleSaveAndPreview} className="bg-[#06C755] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-[#05b34c] shadow-md flex items-center gap-1.5 transition font-medium"><MessageCircle size={16} /> 儲存並通知</button>
                    )}
                    {(!isEngineer || !isExistingRecord) && (
                        <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm hover:shadow-lg shadow-md flex items-center gap-2 transition font-medium"><Save size={16} /> 儲存返回</button>
                    )}
                </div>
            </div>
        </form>
    );
};

const UniversalWorkOrderForm = ({ type, initialData, onSave, onCancel, onConvertToCapa, customers, stations, equipment, specs, staffList, parts, openMessage, assetList, inventoryItems, schedules }) => {
    const [formData, setFormData] = useState({ ...initialData });
    const isExistingRecord = formData.id && formData.id !== "系統自動產生";
    const availableAssets = assetList.filter(a => a.customerName === formData.customerName && (!a.status || a.status === '使用中'));

    const config = {
        maintenance: { title: '保養單', icon: Activity, colorClass: 'text-emerald-600', checkboxClass: 'text-emerald-600 focus:ring-emerald-500' },
        repair: { title: '報修單', icon: Hammer, colorClass: 'text-amber-600', checkboxClass: 'text-amber-600 focus:ring-amber-500' },
        construction: { title: '施工單', icon: PlayCircle, colorClass: 'text-indigo-600', checkboxClass: 'text-indigo-600 focus:ring-indigo-500' }
    }[type];

    const findScheduleCycle = (cust, asset, eq) => {
        if (type !== 'maintenance' || !schedules || schedules.length === 0) return '';
        if (asset) { const match = schedules.find(s => s.assetId === asset); if (match && match.cycle) return match.cycle; }
        if (cust && eq) { const match = schedules.find(s => s.customerName === cust && s.equipment === eq); if (match && match.cycle) return match.cycle; }
        if (cust) { const match = schedules.find(s => s.customerName === cust); if (match && match.cycle) return match.cycle; }
        return '';
    };

    const handleChecklistChange = (index, checkType) => {
        if (type !== 'maintenance') return;
        const newChecklist = [...formData.checklist];
        if (checkType === 'ok') { newChecklist[index].ok = !newChecklist[index].ok; if (newChecklist[index].ok) newChecklist[index].ng = false; } 
        else { newChecklist[index].ng = !newChecklist[index].ng; if (newChecklist[index].ng) newChecklist[index].ok = false; }
        setFormData({ ...formData, checklist: newChecklist });
    };

    const handleCustomerChange = (e) => { 
        const selectedName = e.target.value; const customer = customers.find(c => c.name === selectedName); 
        let updates = { customerName: selectedName, customerAddress: customer ? customer.address : '', locationType: customer?.type || formData.locationType, equipment: '', spec: '', assetId: '' };
        if (type === 'maintenance') updates.cycle = findScheduleCycle(selectedName, '', '') || formData.cycle;
        setFormData(prev => ({ ...prev, ...updates })); 
    };

    const handleAssetChange = (e) => { 
        const assetId = e.target.value; const selectedAsset = assetList.find(a => a.id === assetId); 
        if (selectedAsset) { 
            let updates = { assetId: assetId, equipment: selectedAsset.name, spec: `${selectedAsset.brand || ''} ${selectedAsset.model || ''}`.trim() || formData.spec };
            if (type === 'maintenance') updates.cycle = findScheduleCycle(formData.customerName, assetId, selectedAsset.name) || formData.cycle;
            setFormData(prev => ({ ...prev, ...updates })); 
        } else { setFormData(prev => ({ ...prev, assetId: '', equipment: '' })); } 
    };

    const handleChange = (e) => { 
        const { name, value, checked } = e.target; 
        const isCheckbox = e.target.type === 'checkbox';
        setFormData(prev => { 
            const newData = { ...prev, [name]: isCheckbox ? checked : value }; 
            if (name === 'testOk' && checked && type !== 'maintenance') { newData.revisitNeeded = false; } 
            return newData; 
        }); 
    };

    const handleEquipmentChange = (e) => { 
        const eqName = e.target.value; 
        let updates = { equipment: eqName };
        if (type === 'maintenance') updates.cycle = findScheduleCycle(formData.customerName, formData.assetId, eqName) || formData.cycle;
        setFormData(prev => ({ ...prev, ...updates })); 
    };

    const handleAddDismantledPart = () => { 
        if (formData.dismantledPartName && formData.dismantledPartQty) { 
            const newPart = { name: formData.dismantledPartName, model: formData.dismantledPartModel || '', qty: formData.dismantledPartQty }; 
            setFormData(prev => ({ ...prev, dismantledParts: [...(prev.dismantledParts || []), newPart], dismantledPartName: '', dismantledPartModel: '', dismantledPartQty: '' })); 
        } 
    };

    const handleRemoveDismantledPart = (index) => { setFormData(prev => ({ ...prev, dismantledParts: prev.dismantledParts.filter((_, i) => i !== index) })); };
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="max-w-4xl mx-auto flex flex-col relative">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><config.icon className={config.colorClass} /> {config.title}</h2>
                <button type="button" onClick={onCancel} className="hidden md:flex bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 items-center gap-2 shadow-sm transition font-medium"><ArrowLeft size={16} /> 返回總覽</button>
            </div>
            <div className="space-y-6 flex-1">
                <Card className="p-6 md:p-8"><SectionTitle title="基本資料" icon={User} className="mt-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={formData.isMultiDay ? "md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" : ""}>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label className="mb-0" required>日期 {formData.isMultiDay && '(開始)'}</Label>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 transition">
                                        <input type="checkbox" name="isMultiDay" checked={formData.isMultiDay || false} onChange={handleChange} className={`rounded ${config.checkboxClass} w-3.5 h-3.5`} />跨日行程
                                    </label>
                                </div>
                                <Input name="date" type="date" value={formData.date} onChange={handleChange} required />
                            </div>
                            {formData.isMultiDay && (<div className="animate-in fade-in slide-in-from-left-2"><Label>完工日期 (結束)</Label><Input name="endDate" type="date" value={formData.endDate} onChange={handleChange} min={formData.date} /></div>)}
                        </div>
                        <div><Label>單號</Label><Input value={formData.id || "系統自動產生"} disabled /></div>
                        <div><Label required>客戶名稱</Label><DatalistInput listId={`uw-customers-list-${type}`} name="customerName" value={formData.customerName} onChange={handleCustomerChange} options={customers.map(c => c.name)} required placeholder="選擇或手動輸入..." /></div>
                        <div><Label>場域類型</Label><DatalistInput listId={`uw-locations-list-${type}`} name="locationType" value={formData.locationType} onChange={handleChange} options={DEFAULT_LOCATION_TYPES} placeholder="選擇或手動輸入..." /></div>
                        <div><Label>站別</Label><DatalistInput listId={`uw-station-${type}`} name="station" value={formData.station} onChange={handleChange} options={stations} placeholder="選擇或手動輸入..." /></div>
                        
                        {availableAssets.length > 0 ? (
                            <div><Label>選擇設備資產 ({availableAssets.length} 筆)</Label><select name="assetId" value={formData.assetId || ''} onChange={handleAssetChange} className={`${INPUT_BASE_CLASS} appearance-none cursor-pointer ${INPUT_EDITABLE_CLASS}`}><option value="">-- 請選擇具體設備 --</option>{availableAssets.map(asset => { const w = getWarrantyStatus(asset.warrantyDate); return <option key={asset.id} value={asset.id}>{asset.name} ({asset.brand} {asset.model}) - {w.text}</option>; })}<option value="manual">手動輸入 (不在資產清單中)</option></select></div>
                        ) : (
                            <div><Label>設備名稱</Label><DatalistInput listId={`uw-equip-1-${type}`} name="equipment" value={formData.equipment} onChange={handleEquipmentChange} options={equipment} placeholder="選擇或手動輸入..." /></div>
                        )}
                        {(formData.assetId === 'manual' || (availableAssets.length > 0 && !formData.assetId)) && (
                            <div className="animate-in fade-in slide-in-from-top-1"><Label>手動指定設備名稱</Label><DatalistInput listId={`uw-equip-2-${type}`} name="equipment" value={formData.equipment} onChange={handleEquipmentChange} options={equipment} placeholder="選擇或手動輸入..." /></div>
                        )}
                        
                        {type === 'maintenance' ? (
                            <div><Label>保養週期</Label><Input name="cycle" value={formData.cycle} onChange={handleChange} placeholder="例如：半年、季保" /></div>
                        ) : (
                            <div><Label>設備規格</Label><DatalistInput listId={`uw-spec-${type}`} name="spec" value={formData.spec} onChange={handleChange} options={specs} placeholder="選擇或手動輸入..." /></div>
                        )}
                        
                        {type === 'construction' && (
                            <div><Label>專案/工程名稱</Label><Input name="description" value={formData.description} onChange={handleChange} placeholder="例如：冰水主機汰換工程" /></div>
                        )}
                    </div>
                </Card>

                {type === 'maintenance' && (
                    <>
                        <Card className="p-6 md:p-8"><SectionTitle title="檢查項目表 (Checklist)" icon={CheckSquare} className="mt-0" />
                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                                <div className="grid grid-cols-12 bg-slate-50 p-3 text-sm font-bold text-slate-700 border-b border-slate-200"><div className="col-span-8">檢查項目</div><div className="col-span-2 text-center">正常 (OK)</div><div className="col-span-2 text-center">異常 (NG)</div></div>
                                {formData.checklist?.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 items-center transition">
                                        <div className="col-span-8 text-sm text-slate-700 font-medium">{item.name}</div>
                                        <div className="col-span-2 flex justify-center"><input type="checkbox" checked={item.ok || false} onChange={() => handleChecklistChange(index, 'ok')} className={`w-5 h-5 cursor-pointer rounded ${config.checkboxClass}`} /></div>
                                        <div className="col-span-2 flex justify-center"><input type="checkbox" checked={item.ng || false} onChange={() => handleChecklistChange(index, 'ng')} className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer" /></div>
                                    </div>
                                ))}
                                {(!formData.checklist || formData.checklist.length === 0) && <div className="p-4 text-center text-slate-400">無檢查項目 (請至設定添加)</div>}
                            </div>
                        </Card>
                        <Card className="p-6 md:p-8"><SectionTitle title="量測數據" icon={Zap} className="mt-0" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="text-sm font-bold mb-3 text-slate-600 flex items-center gap-2"><Activity size={16}/> 交流電壓 (AC V)</h4><div className="grid grid-cols-3 gap-2"><Input placeholder="R-T" name="ac_rt" value={formData.ac_rt} onChange={handleChange} /><Input placeholder="S-T" name="ac_st" value={formData.ac_st} onChange={handleChange} /><Input placeholder="R-S" name="ac_rs" value={formData.ac_rs} onChange={handleChange} /></div></div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="text-sm font-bold mb-3 text-slate-600 flex items-center gap-2"><Activity size={16}/> 直流電壓 (DC V)</h4><Input placeholder="V" name="dc_v" value={formData.dc_v} onChange={handleChange} /></div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="text-sm font-bold mb-3 text-slate-600 flex items-center gap-2"><Activity size={16}/> 交流電流 (AC A)</h4><div className="grid grid-cols-3 gap-2"><Input placeholder="R" name="ac_r_amp" value={formData.ac_r_amp} onChange={handleChange} /><Input placeholder="S" name="ac_s_amp" value={formData.ac_s_amp} onChange={handleChange} /><Input placeholder="T" name="ac_t_amp" value={formData.ac_t_amp} onChange={handleChange} /></div></div>
                            </div>
                        </Card>
                    </>
                )}

                {type === 'repair' && (
                    <Card className="p-6 md:p-8"><SectionTitle title="故障排除紀錄" icon={Wrench} className="mt-0" />
                        <div className="space-y-4">
                            <div><Label>故障情形描述</Label><Textarea name="description" rows="3" value={formData.description} onChange={handleChange}></Textarea></div>
                            <div><Label>故障原因分析 (Cause)</Label><Textarea name="causeAnalysis" rows="3" value={formData.causeAnalysis} onChange={handleChange} placeholder="請填寫故障主因..."></Textarea></div>
                            <div><Label>解決對策 (Solution)</Label><Textarea name="solution" rows="3" value={formData.solution} onChange={handleChange} placeholder="請填寫處理方式..."></Textarea></div>
                        </div>
                    </Card>
                )}

                {type === 'construction' && (
                    <Card className="p-6 md:p-8"><SectionTitle title="施工內容" icon={Hammer} className="mt-0" />
                        <div className="space-y-4"><div><Label>施作內容詳述</Label><Textarea name="constructionDetails" rows="6" value={formData.constructionDetails} onChange={handleChange} placeholder="請詳細條列施作項目..."></Textarea></div></div>
                    </Card>
                )}

                <Card className="p-6 md:p-8">
                    <SectionTitle title={type === 'construction' ? "材料/零件使用紀錄" : "零件更換紀錄"} icon={Layers} className="mt-0" />
                    <ReplacementPartManager partsList={parts} inventoryItems={inventoryItems} replacedParts={formData.replacedParts} onUpdate={(newParts) => setFormData(prev => ({ ...prev, replacedParts: newParts }))} listIdPrefix={`uw-parts-${type}`} />
                </Card>

                <Card className="p-6 md:p-8">
                    <SectionTitle title="拆回舊品紀錄" icon={Recycle} className="mt-0" />
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                        <div className="flex flex-wrap gap-2 items-end mb-2">
                            <div className="flex-1 min-w-[120px]">
                                <Label>舊品名稱</Label>
                                <DatalistInput listId={`uw-dismantled-parts-${type}`} name="dismantledPartName" value={formData.dismantledPartName || ''} onChange={handleChange} options={parts} placeholder="手動輸入或選擇..." />
                            </div>
                            <div className="w-32"><Label>型號/規格</Label><Input name="dismantledPartModel" value={formData.dismantledPartModel || ''} onChange={handleChange} /></div>
                            <div className="w-20"><Label>數量</Label><Input name="dismantledPartQty" type="number" min="1" value={formData.dismantledPartQty || ''} onChange={handleChange} /></div>
                            <button type="button" onClick={handleAddDismantledPart} className="bg-emerald-600 text-white px-3 py-2.5 rounded-xl hover:bg-emerald-700 mb-0.5 shadow-sm"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-2">
                            {(formData.dismantledParts || []).map((part, index) => (
                                <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-sm shadow-sm">
                                    <span className="font-medium text-slate-700">{part.name} {part.model ? `(${part.model})` : ''} x {part.qty}</span>
                                    <button type="button" onClick={() => handleRemoveDismantledPart(index)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {(formData.dismantledParts || []).length === 0 && <p className="text-center text-slate-400 text-xs py-2">無拆回舊品紀錄</p>}
                        </div>
                        {formData.dismantledDescription && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <Label>舊版文字紀錄 (保留供參考)</Label>
                                <Textarea name="dismantledDescription" rows="2" value={formData.dismantledDescription} onChange={handleChange} readOnly className="bg-slate-100 text-slate-500"></Textarea>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 md:p-8"><SectionTitle title="完工確認" icon={CheckCircle} className="mt-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <EngineerTeamSelector staffList={staffList} primary={formData.serviceEngineer} assistants={formData.assistants} onChange={({ primary, assistants }) => setFormData(prev => ({ ...prev, serviceEngineer: primary, assistants }))} />
                        </div>
                        <div><Label>到達時間</Label><div className="flex gap-2"><Input name="arrivalTime" type="datetime-local" value={formData.arrivalTime} onChange={handleChange} /><button type="button" onClick={() => setFormData({...formData, arrivalTime: getNowLocalString()})} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-sm font-medium transition shrink-0">現在</button></div></div>
                        <div><Label>完工時間</Label><div className="flex gap-2"><Input name="completionTime" type="datetime-local" value={formData.completionTime} onChange={handleChange} min={formData.arrivalTime} /><button type="button" onClick={() => setFormData({...formData, completionTime: getNowLocalString()})} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-sm font-medium transition shrink-0">現在</button></div></div>
                        
                        <div className="flex items-center gap-6 mt-4 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="flex items-center cursor-pointer font-bold text-slate-700">
                                <input type="checkbox" name="testOk" checked={formData.testOk || false} onChange={handleChange} className={`w-5 h-5 mr-3 rounded cursor-pointer ${config.checkboxClass}`} />
                                {type === 'maintenance' ? '保養作業完成確認' : type === 'repair' ? '復歸測試正常 (Test OK)' : '完工驗收正常'}
                            </label>
                            {type !== 'maintenance' && (
                                <div className="flex items-center gap-3 border-l pl-6 border-slate-300">
                                    <span className="text-sm font-medium text-slate-600">後續追蹤：</span>
                                    <label className="flex items-center cursor-pointer hover:bg-slate-200/50 px-2 py-1 rounded transition"><input type="radio" name="revisitNeeded" checked={formData.revisitNeeded === false} onChange={() => setFormData({...formData, revisitNeeded: false})} className="mr-1.5" /> <span className="text-sm font-medium">結案</span></label>
                                    <label className="flex items-center cursor-pointer hover:bg-slate-200/50 px-2 py-1 rounded transition"><input type="radio" name="revisitNeeded" checked={formData.revisitNeeded === true} onChange={() => setFormData({...formData, revisitNeeded: true})} className="mr-1.5" /> <span className="text-sm font-medium">需再訪</span></label>
                                </div>
                            )}
                        </div>

                        {type === 'maintenance' && (
                            <div className="md:col-span-2"><Label>備註說明 / 工況描述</Label><Input name="remarks" value={formData.remarks} onChange={handleChange} /></div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div><Label>{type === 'repair' ? '故障照片 (Before)' : '施工前照片'}</Label><PhotoUpload label="" value={formData.photoBefore} onChange={(val) => setFormData({...formData, photoBefore: val})} /></div>
                        <div><Label>{type === 'repair' ? '完工照片 (After)' : '施工/完工後照片'}</Label><PhotoUpload label="" value={formData.photoAfter} onChange={(val) => setFormData({...formData, photoAfter: val})} /></div>
                    </div>
                </Card>
                <Card className="p-6 md:p-8"><SectionTitle title="簽名確認" icon={Edit2} className="mt-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SignaturePad label="客戶簽名" value={formData.customerSignature} onChange={(val) => setFormData({...formData, customerSignature: val})} />
                        <SignaturePad label="工程師簽名" value={formData.engineerSignature} onChange={(val) => setFormData({...formData, engineerSignature: val})} />
                    </div>
                </Card>
            </div>
            <div className="sticky bottom-[90px] md:bottom-4 z-40 mt-8 bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                    {isExistingRecord && (
                        <button type="button" onClick={() => onConvertToCapa(formData)} className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl text-sm hover:bg-purple-100 flex items-center gap-1.5 transition font-bold shadow-sm" title="延伸開立矯正預防措施單 (CAPA)"><Target size={16} /> 轉開 CAPA</button>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" onClick={onCancel} className="md:hidden bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-200 flex items-center gap-1.5 font-medium transition"><ArrowLeft size={16} /> 取消</button>
                    <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm hover:shadow-lg shadow-md flex items-center gap-2 transition font-medium"><Save size={16} /> 儲存返回</button>
                </div>
            </div>
        </form>
    );
};

const FormCapa = ({ initialData, onSave, onCancel, customers, stations, equipment, specs, staffList, openMessage, assetList }) => {
    const [formData, setFormData] = useState({ ...DEFAULT_CAPA_DATA, ...initialData });
    const availableAssets = assetList.filter(a => a.customerName === formData.customerName && (!a.status || a.status === '使用中'));
    
    const handleCustomerChange = (e) => { const selectedName = e.target.value; const customer = customers.find(c => c.name === selectedName); setFormData(prev => ({ ...prev, customerName: selectedName, customerAddress: customer ? customer.address : '', locationType: customer?.type || prev.locationType, equipment: '', spec: '', assetId: '' })); };
    const handleAssetChange = (e) => { const assetId = e.target.value; const selectedAsset = assetList.find(a => a.id === assetId); if (selectedAsset) { setFormData(prev => ({ ...prev, assetId: assetId, equipment: selectedAsset.name, spec: `${selectedAsset.brand || ''} ${selectedAsset.model || ''}`.trim() || prev.spec })); } else { setFormData(prev => ({ ...prev, assetId: '', equipment: '' })); } };
    const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => { const newData = { ...prev, [name]: type === 'checkbox' ? checked : value }; if (name === 'testOk' && checked) { newData.revisitNeeded = false; } return newData; }); };
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="max-w-4xl mx-auto flex flex-col relative">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Target className="text-purple-600" /> 矯正預防措施單 (CAPA)</h2>
                <button type="button" onClick={onCancel} className="hidden md:flex bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 items-center gap-2 shadow-sm transition font-medium"><ArrowLeft size={16} /> 返回總覽</button>
            </div>
            <div className="space-y-6 flex-1">
                <Card className="p-6 md:p-8"><SectionTitle title="基本資料" icon={User} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className={formData.isMultiDay ? "md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" : ""}><div><div className="flex justify-between items-center mb-2"><Label className="mb-0" required>開立日期 {formData.isMultiDay && '(開始)'}</Label><label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 transition"><input type="checkbox" name="isMultiDay" checked={formData.isMultiDay || false} onChange={handleChange} className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5" />跨日行程</label></div><Input name="date" type="date" value={formData.date} onChange={handleChange} required /></div>{formData.isMultiDay && (<div className="animate-in fade-in slide-in-from-left-2"><Label>完成日期 (結束)</Label><Input name="endDate" type="date" value={formData.endDate} onChange={handleChange} min={formData.date} /></div>)}</div><div><Label>單號 (自動生成)</Label><Input value={formData.id || "系統自動產生"} disabled /></div>{formData.sourceOrderId && (<div className="md:col-span-2 bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-800 text-sm flex items-center gap-2"><LinkIcon size={16}/> 關聯原始工單：<strong>{formData.sourceOrderId}</strong></div>)}<div><Label required>客戶名稱</Label><DatalistInput listId="customers-list" name="customerName" value={formData.customerName} onChange={handleCustomerChange} options={customers.map(c => c.name)} required placeholder="選擇或手動輸入..." /></div><div><Label>場域類型</Label><DatalistInput listId="locations-list" name="locationType" value={formData.locationType} onChange={handleChange} options={DEFAULT_LOCATION_TYPES} placeholder="選擇或手動輸入..." /></div><div><Label>站別</Label><DatalistInput listId="capa-station" name="station" value={formData.station} onChange={handleChange} options={stations} placeholder="選擇或手動輸入..." /></div>{availableAssets.length > 0 ? (<div><Label>選擇設備資產 ({availableAssets.length} 筆)</Label><select name="assetId" value={formData.assetId || ''} onChange={handleAssetChange} className={`${INPUT_BASE_CLASS} appearance-none cursor-pointer ${INPUT_EDITABLE_CLASS}`}><option value="">-- 請選擇具體設備 --</option>{availableAssets.map(asset => { return <option key={asset.id} value={asset.id}>{asset.name} ({asset.brand} {asset.model})</option>; })}<option value="manual">手動輸入 (不在資產清單中)</option></select></div>) : (<div><Label>設備名稱</Label><DatalistInput listId="capa-equip-1" name="equipment" value={formData.equipment} onChange={handleChange} options={equipment} placeholder="選擇或手動輸入..." /></div>)}{(formData.assetId === 'manual' || (availableAssets.length > 0 && !formData.assetId)) && (<div className="animate-in fade-in slide-in-from-top-1"><Label>手動指定設備名稱</Label><DatalistInput listId="capa-equip-2" name="equipment" value={formData.equipment} onChange={handleChange} options={equipment} placeholder="選擇或手動輸入..." /></div>)}<div><Label>設備規格</Label><DatalistInput listId="capa-spec" name="spec" value={formData.spec} onChange={handleChange} options={specs} placeholder="選擇或手動輸入..." /></div></div></Card>
                <Card className="p-6 md:p-8"><SectionTitle title="異常狀況與原因分析" icon={AlertTriangle} className="mt-0" /><div className="space-y-4"><div><Label>異常狀況描述 (Problem)</Label><Textarea name="problemDescription" rows="3" value={formData.problemDescription} onChange={handleChange} placeholder="請描述發生了什麼問題..."></Textarea></div><div><Label>根本原因分析 (Root Cause Analysis)</Label><Textarea name="rootCauseAnalysis" rows="4" value={formData.rootCauseAnalysis} onChange={handleChange} placeholder="分析造成此異常的根本原因為何..."></Textarea></div></div></Card>
                <Card className="p-6 md:p-8"><SectionTitle title="矯正與預防措施計畫" icon={Target} className="mt-0" /><div className="space-y-4"><div><Label>矯正措施 (Corrective Action - 解決當下問題)</Label><Textarea name="correctiveAction" rows="3" value={formData.correctiveAction} onChange={handleChange} placeholder="針對根本原因，採取了什麼行動來修正目前的問題..."></Textarea></div><div><Label>預防措施 (Preventive Action - 防止未來再發生)</Label><Textarea name="preventiveAction" rows="3" value={formData.preventiveAction} onChange={handleChange} placeholder="採取了什麼長期的對策或流程修改，來避免相同的問題再次發生..."></Textarea></div></div></Card>
                <Card className="p-6 md:p-8">
                    <SectionTitle title="負責人與驗證結果" icon={CheckCircle} className="mt-0" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><EngineerTeamSelector staffList={staffList} primary={formData.serviceEngineer} assistants={formData.assistants} onChange={({ primary, assistants }) => setFormData(prev => ({ ...prev, serviceEngineer: primary, assistants }))} labelPrimary="CAPA 負責人" /></div>
                        <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2"><h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Shield size={18} className="text-emerald-600"/> 措施驗證 (Verification)</h4></div>
                        <div><Label>驗證日期</Label><Input name="verificationDate" type="date" value={formData.verificationDate} onChange={handleChange} /></div>
                        <div><Label>驗證人</Label><DatalistInput listId="capa-verifier-list" name="verifier" value={formData.verifier} onChange={handleChange} options={staffList} placeholder="選擇或手動輸入..." /></div>
                        <div className="md:col-span-2"><Label>驗證結果說明</Label><Textarea name="verificationResult" rows="2" value={formData.verificationResult} onChange={handleChange} placeholder="請說明驗證的方法與最終確認的結果..."></Textarea></div>
                        <div className="flex items-center gap-6 mt-4 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="flex items-center cursor-pointer font-bold text-slate-700"><input type="checkbox" name="testOk" checked={formData.testOk || false} onChange={handleChange} className="w-5 h-5 mr-3 text-emerald-600 rounded focus:ring-emerald-500" /> 驗證通過結案</label>
                            <div className="flex items-center gap-3 border-l pl-6 border-slate-300">
                                <span className="text-sm font-medium text-slate-600">後續追蹤：</span>
                                <label className="flex items-center cursor-pointer hover:bg-slate-200/50 px-2 py-1 rounded transition"><input type="radio" name="revisitNeeded" checked={formData.revisitNeeded === false} onChange={() => setFormData({...formData, revisitNeeded: false})} className="mr-1.5" /> <span className="text-sm font-medium">無需追蹤 (結案)</span></label>
                                <label className="flex items-center cursor-pointer hover:bg-slate-200/50 px-2 py-1 rounded transition"><input type="radio" name="revisitNeeded" checked={formData.revisitNeeded === true} onChange={() => setFormData({...formData, revisitNeeded: true})} className="mr-1.5" /> <span className="text-sm font-medium">持續追蹤</span></label>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div><Label>異常/實作前照片</Label><PhotoUpload label="" value={formData.photoBefore} onChange={(val) => setFormData({...formData, photoBefore: val})} /></div>
                        <div><Label>改善後/驗證照片</Label><PhotoUpload label="" value={formData.photoAfter} onChange={(val) => setFormData({...formData, photoAfter: val})} /></div>
                    </div>
                </Card>
                <Card className="p-6 md:p-8"><SectionTitle title="簽名確認" icon={Edit2} className="mt-0" /><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SignaturePad label="客戶/主管簽名" value={formData.customerSignature} onChange={(val) => setFormData({...formData, customerSignature: val})} /><SignaturePad label="負責工程師簽名" value={formData.engineerSignature} onChange={(val) => setFormData({...formData, engineerSignature: val})} /></div></Card>
            </div>
            <div className="sticky bottom-[90px] md:bottom-4 z-40 mt-8 bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-end gap-3 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" onClick={onCancel} className="md:hidden bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-200 flex items-center gap-1.5 font-medium transition"><ArrowLeft size={16} /> 取消</button>
                    <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm hover:shadow-lg shadow-md flex items-center gap-2 transition font-medium"><Save size={16} /> 儲存返回</button>
                </div>
            </div>
        </form>
    );
};

const ReportGenerator = ({ orders, onCancel, preSelectedOrderId }) => {
    const [selectedOrderId, setSelectedOrderId] = useState(preSelectedOrderId || '');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSections, setShowSections] = useState({ header: true, basicInfo: true, staff: true, description: true, checklist: true, constructionDetails: true, measurements: true, parts: true, causeSolution: true, capaAnalysis: true, capaAction: true, capaVerification: true, photos: true, signatures: true });
    const [moveToPage2, setMoveToPage2] = useState(true);
    
    useEffect(() => { if (selectedOrderId) { const order = orders.find(o => o.id === selectedOrderId); setSelectedOrder(order || null); } else { setSelectedOrder(null); } }, [selectedOrderId, orders]);
    
    const handlePrint = () => {
        const content = document.getElementById('report-container');
        if (!content) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) { alert("無法開啟列印視窗，請檢查是否被瀏覽器封鎖。"); return; }
        const doc = printWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>下載報告 - ${selectedOrder?.id || ''}</title>
                <meta charset="utf-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
                    body { font-family: 'Noto Sans TC', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f1f5f9; padding: 20px; }
                    
                    @media print {
                        @page { margin: 15mm; size: A4 portrait; }
                        body { background: white; padding: 0 !important; margin: 0 !important; }
                        #report-container { gap: 0 !important; padding: 0 !important; display: block !important; }
                        .a4-page { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            width: 100% !important; 
                            max-width: 100% !important;
                            min-height: auto !important; 
                            border: none !important;
                            padding: 0 !important; 
                            page-break-after: always;
                            display: block !important;
                        }
                        .a4-page:last-child { page-break-after: auto; }
                        .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
                    }
                </style>
            </head>
            <body class="p-0 md:p-4">
                ${content.outerHTML}
                <script> window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); }; </script>
            </body>
            </html>
        `);
        doc.close();
    };

    const toggleSection = (key) => { setShowSections(prev => ({ ...prev, [key]: !prev[key] })); };
    const filteredOrders = orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const getTheme = (type) => {
        switch(type) {
            case 'maintenance': return { color: 'emerald', hex: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-800' };
            case 'repair': return { color: 'amber', hex: '#d97706', bg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-800' };
            case 'construction': return { color: 'indigo', hex: '#4f46e5', bg: 'bg-indigo-50', border: 'border-indigo-600', text: 'text-indigo-800' };
            case 'capa': return { color: 'purple', hex: '#9333ea', bg: 'bg-purple-50', border: 'border-purple-600', text: 'text-purple-800' };
            default: return { color: 'blue', hex: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-800' };
        }
    };
    
    const theme = selectedOrder ? getTheme(selectedOrder.type) : {};

    // 統一區塊樣式的內部組件
    const SectionBox = ({ title, children }) => (
        <div className={`border ${theme.border} rounded-sm overflow-hidden mb-4 break-inside-avoid`}>
            <div className={`${theme.bg} border-b ${theme.border} p-1.5 text-center font-bold text-sm ${theme.text}`}>{title}</div>
            {children}
        </div>
    );

    const hasPhotos = showSections.photos && selectedOrder && (selectedOrder.photoBefore || selectedOrder.photoAfter || selectedOrder.photoIssue);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 overflow-hidden">
            <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 h-full overflow-hidden">
                <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileOutput className="text-blue-600" /> 報告生成器</h2><button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div><Label>選擇工單</Label><div className="relative mb-2"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-200 outline-none" placeholder="搜尋單號或客戶..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} size={12}><option value="">-- 請選擇 --</option>{filteredOrders.map(o => (<option key={o.id} value={o.id}>{o.date} - {o.customerName} ({o.type === 'maintenance' ? '保養' : o.type === 'repair' ? '報修' : o.type === 'construction' ? '施工' : o.type === 'capa' ? 'CAPA' : '派工'})</option>))}</select></div>
                    {selectedOrder && (<div className="space-y-3 pt-4 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 text-sm">內容篩選設定</h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.header} onChange={() => toggleSection('header')} className="rounded text-blue-600 focus:ring-blue-500" />報告標題與表頭</label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.basicInfo} onChange={() => toggleSection('basicInfo')} className="rounded text-blue-600 focus:ring-blue-500" />基本資料表 (Basic Info)</label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.staff} onChange={() => toggleSection('staff')} className="rounded text-blue-600 focus:ring-blue-500" />人力出工表 (Staff)</label>
                            
                            {selectedOrder.type === 'maintenance' && (<>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.checklist} onChange={() => toggleSection('checklist')} className="rounded text-blue-600 focus:ring-blue-500" />檢查項目紀錄 (Checklist)</label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.measurements} onChange={() => toggleSection('measurements')} className="rounded text-blue-600 focus:ring-blue-500" />量測數據 (Measurements)</label>
                            </>)}
                            
                            {selectedOrder.type === 'construction' && (
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.constructionDetails} onChange={() => toggleSection('constructionDetails')} className="rounded text-blue-600 focus:ring-blue-500" />施工內容詳述 (Details)</label>
                            )}
                            
                            {selectedOrder.type === 'repair' && (
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.causeSolution} onChange={() => toggleSection('causeSolution')} className="rounded text-blue-600 focus:ring-blue-500" />故障情形與分析對策 (Troubleshoot)</label>
                            )}

                            {selectedOrder.type === 'capa' && (<>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.capaAnalysis} onChange={() => toggleSection('capaAnalysis')} className="rounded text-purple-600 focus:ring-purple-500" />根本原因分析 (Root Cause)</label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.capaAction} onChange={() => toggleSection('capaAction')} className="rounded text-purple-600 focus:ring-purple-500" />矯正預防計畫 (Action Plan)</label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.capaVerification} onChange={() => toggleSection('capaVerification')} className="rounded text-purple-600 focus:ring-purple-500" />驗證結果 (Verification)</label>
                            </>)}
                            
                            {['repair', 'maintenance', 'construction'].includes(selectedOrder.type) && (
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.parts} onChange={() => toggleSection('parts')} className="rounded text-blue-600 focus:ring-blue-500" />{selectedOrder.type === 'construction' ? '材料使用紀錄 (Materials)' : '零件更換紀錄 (Parts)'}</label>
                            )}

                            {selectedOrder.type !== 'capa' && <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.description} onChange={() => toggleSection('description')} className="rounded text-blue-600 focus:ring-blue-500" />工況/備註記事 (Remarks)</label>}
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.photos} onChange={() => toggleSection('photos')} className="rounded text-blue-600 focus:ring-blue-500" />現場照片 (Photos)</label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={showSections.signatures} onChange={() => toggleSection('signatures')} className="rounded text-blue-600 focus:ring-blue-500" />簽章欄位 (Signatures)</label>
                            
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer mt-3 pt-3 border-t border-slate-200">
                                <input type="checkbox" checked={moveToPage2} onChange={() => setMoveToPage2(!moveToPage2)} className="rounded text-red-600 focus:ring-red-500" />
                                <span className="font-medium text-red-600">自動將「備註與簽章」移至新頁</span>
                            </label>
                        </div>
                    </div>)}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2"><button onClick={handlePrint} disabled={!selectedOrder} className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Download size={18} /> 列印 / 下載 PDF</button><div className="bg-slate-50 p-2 rounded text-xs text-slate-500 text-center">點擊後請於列印視窗選擇「另存為 PDF」(A4 直式)</div></div>
                </div>
            </div>
            
            {/* 預覽畫面區：使用獨立分頁取代原本的單一長版面 */}
            <div className="flex-1 bg-slate-100 overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar">
                {selectedOrder ? (
                    <div id="report-container" className="flex flex-col items-center gap-8 w-full pb-12">
                        {/* 第 1 頁 (主文件) */}
                        <div className="a4-page bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] text-slate-800 relative box-border flex flex-col border border-slate-200">
                            {showSections.header && (
                                <div className={`border-b-2 ${theme.border} pb-4 mb-6`}>
                                    <h1 className={`text-3xl font-bold text-center mb-2 tracking-wide ${theme.text}`}>{selectedOrder.type === 'maintenance' ? '設備保養維護報告書' : selectedOrder.type === 'repair' ? '設備故障維修報告書' : selectedOrder.type === 'construction' ? '工程施工日報表' : selectedOrder.type === 'capa' ? '矯正與預防措施單 (CAPA)' : '派工單紀錄表'}</h1>
                                    <div className="flex justify-between items-end mt-4 text-sm font-medium">
                                        <div><div>專案名稱：{selectedOrder.customerName}</div><div>工區地點：{selectedOrder.station} / {selectedOrder.locationType || '未指定'}</div></div>
                                        <div className="text-right"><div>{selectedOrder.type === 'dispatch' ? '填單日期' : '開立日期'}：{selectedOrder.date}{selectedOrder.isMultiDay && selectedOrder.endDate ? ` ~ ${selectedOrder.endDate}` : ''}</div>{selectedOrder.type === 'dispatch' && selectedOrder.constructionDate && <div>預定施工日：{selectedOrder.constructionDate}{selectedOrder.isMultiDay && selectedOrder.constructionEndDate ? ` ~ ${selectedOrder.constructionEndDate}` : ''}</div>}<div>單號：{selectedOrder.id}</div>{selectedOrder.sourceOrderId && <div>關聯單號：{selectedOrder.sourceOrderId}</div>}<div className={`mt-1 inline-block px-2 py-0.5 rounded text-xs border ${theme.border} ${theme.bg} ${theme.text}`}>{selectedOrder.status || '進行中'}</div></div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1">
                                {showSections.basicInfo && (
                                    <SectionBox title="機具設備與基本資料">
                                        <div className={`grid grid-cols-2 text-sm divide-x ${theme.border.replace('border-', 'divide-')}`}><div className="p-2"><span className="font-bold mr-2">設備名稱:</span> {selectedOrder.equipment}</div><div className="p-2"><span className="font-bold mr-2">規格/型號:</span> {selectedOrder.spec || '-'}</div></div><div className={`border-t ${theme.border} grid grid-cols-2 text-sm divide-x ${theme.border.replace('border-', 'divide-')}`}><div className="p-2"><span className="font-bold mr-2">聯絡人:</span> {selectedOrder.contactPerson || '-'}</div><div className="p-2"><span className="font-bold mr-2">電話:</span> {selectedOrder.contactPhone || '-'}</div></div>
                                    </SectionBox>
                                )}

                                {showSections.staff && (
                                    <SectionBox title="人力出工統計">
                                        <div className="p-2 text-sm"><div className="grid grid-cols-4 gap-2 mb-2 font-medium border-b border-slate-200 pb-1"><div>職稱/角色</div><div className="col-span-2">姓名</div><div>備註</div></div><div className="grid grid-cols-4 gap-2 mb-1"><div>{selectedOrder.type === 'capa' ? 'CAPA負責人' : '服務工程師'}</div><div className="col-span-2">{selectedOrder.serviceEngineer || '-'}</div><div>主責</div></div>{selectedOrder.assistants && selectedOrder.assistants.map((ast, i) => (<div key={i} className="grid grid-cols-4 gap-2 mb-1"><div>協助人員</div><div className="col-span-2">{ast}</div><div>協助</div></div>))}</div>
                                    </SectionBox>
                                )}

                                {showSections.checklist && selectedOrder.type === 'maintenance' && selectedOrder.checklist && selectedOrder.checklist.length > 0 && (
                                    <SectionBox title="檢查項目紀錄">
                                        <div className="grid grid-cols-2 gap-x-4 p-2">{selectedOrder.checklist.map((item, idx) => (<div key={idx} className="flex items-center justify-between text-xs border-b border-slate-100 py-1.5 break-inside-avoid"><span>{item.name}</span><div className="flex gap-2"><span className={`px-1.5 ${item.ok ? 'font-bold text-slate-900' : 'text-slate-300'}`}>OK</span><span className={`px-1.5 ${item.ng ? 'font-bold text-slate-900' : 'text-slate-300'}`}>NG</span></div></div>))}</div>
                                    </SectionBox>
                                )}

                                {showSections.measurements && selectedOrder.type === 'maintenance' && (
                                    <SectionBox title="量測數據">
                                        <div className="grid grid-cols-4 text-xs divide-x divide-slate-200 p-2 text-center"><div><div className="font-bold text-slate-500 mb-1">電壓 AC R-T</div>{selectedOrder.ac_rt || '-'} V</div><div><div className="font-bold text-slate-500 mb-1">電壓 AC S-T</div>{selectedOrder.ac_st || '-'} V</div><div><div className="font-bold text-slate-500 mb-1">電壓 AC R-S</div>{selectedOrder.ac_rs || '-'} V</div><div><div className="font-bold text-slate-500 mb-1">電壓 DC</div>{selectedOrder.dc_v || '-'} V</div></div><div className="grid grid-cols-3 text-xs divide-x divide-slate-200 border-t border-slate-200 p-2 text-center"><div><div className="font-bold text-slate-500 mb-1">電流 R</div>{selectedOrder.ac_r_amp || '-'} A</div><div><div className="font-bold text-slate-500 mb-1">電流 S</div>{selectedOrder.ac_s_amp || '-'} A</div><div><div className="font-bold text-slate-500 mb-1">電流 T</div>{selectedOrder.ac_t_amp || '-'} A</div></div>
                                    </SectionBox>
                                )}

                                {showSections.constructionDetails && selectedOrder.type === 'construction' && (
                                    <SectionBox title="施工內容詳述">
                                        <div className="p-3 text-sm min-h-[80px] whitespace-pre-line leading-relaxed">{selectedOrder.constructionDetails || '無詳細內容'}</div>
                                    </SectionBox>
                                )}

                                {showSections.causeSolution && selectedOrder.type === 'repair' && (
                                    <SectionBox title="故障情形與分析對策">
                                        <div className="p-3 text-sm border-b border-slate-200"><span className="font-bold block mb-1">故障情形描述 (Problem Description):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.description || '未填寫'}</div></div><div className="p-3 text-sm border-b border-slate-200"><span className="font-bold block mb-1">故障原因分析 (Cause Analysis):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.causeAnalysis || '未填寫'}</div></div><div className="p-3 text-sm"><span className="font-bold block mb-1">解決對策 (Solution):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.solution || '未填寫'}</div></div>
                                    </SectionBox>
                                )}

                                {showSections.capaAnalysis && selectedOrder.type === 'capa' && (
                                    <SectionBox title="異常狀況與原因分析">
                                        <div className="p-3 text-sm border-b border-slate-200"><span className="font-bold block mb-1">異常描述 (Problem Description):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.problemDescription || '未填寫'}</div></div><div className="p-3 text-sm"><span className="font-bold block mb-1">根本原因分析 (Root Cause Analysis):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.rootCauseAnalysis || '未填寫'}</div></div>
                                    </SectionBox>
                                )}

                                {showSections.capaAction && selectedOrder.type === 'capa' && (
                                    <SectionBox title="矯正與預防計畫 (Action Plan)">
                                        <div className="p-3 text-sm border-b border-slate-200"><span className="font-bold block mb-1">矯正措施 (Corrective Action):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.correctiveAction || '未填寫'}</div></div><div className="p-3 text-sm"><span className="font-bold block mb-1">預防措施 (Preventive Action):</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.preventiveAction || '未填寫'}</div></div>
                                    </SectionBox>
                                )}

                                {showSections.capaVerification && selectedOrder.type === 'capa' && (
                                    <SectionBox title="驗證結果 (Verification)">
                                        <div className="p-3 text-sm bg-slate-50 border-b border-slate-200 flex justify-between"><span>驗證人：{selectedOrder.verifier || '未指定'}</span><span>驗證日期：{selectedOrder.verificationDate || '未指定'}</span><span>狀態：<span className="font-bold">{selectedOrder.testOk ? '驗證通過結案' : '持續追蹤'}</span></span></div><div className="p-3 text-sm"><span className="font-bold block mb-1">結果說明:</span><div className="whitespace-pre-line pl-2 text-slate-700">{selectedOrder.verificationResult || '未填寫'}</div></div>
                                    </SectionBox>
                                )}

                                {showSections.parts && ['repair', 'maintenance', 'construction'].includes(selectedOrder.type) && (
                                    <SectionBox title={selectedOrder.type === 'construction' ? '材料進場紀錄' : '更換零件紀錄'}>
                                        <div className="p-2"><table className="w-full text-xs text-left"><thead><tr className="border-b border-slate-300"><th className="pb-1 w-1/2">{selectedOrder.type === 'construction' ? '材料名稱' : '零件名稱'}</th><th className="pb-1 w-1/4">型號/規格</th><th className="pb-1 w-1/6 text-center">數量</th><th className="pb-1 w-1/6 text-right">備註</th></tr></thead><tbody>{selectedOrder.replacedParts && selectedOrder.replacedParts.length > 0 ? (selectedOrder.replacedParts.map((part, i) => (<tr key={i} className="border-b border-slate-100 last:border-0"><td className="py-1.5">{part.name}</td><td className="py-1.5">{part.model || '-'}</td><td className="py-1.5 text-center">{part.qty}</td><td className="py-1.5 text-right">{part.isWarranty && '保固'} {part.isQuote && '報價'} {part.isSecondhand && '二手'}</td></tr>))) : (<tr><td colSpan="4" className="py-2 text-center text-slate-400">無紀錄</td></tr>)}</tbody></table></div>
                                    </SectionBox>
                                )}

                                {!moveToPage2 && showSections.description && selectedOrder.type !== 'capa' && (
                                    <SectionBox title={selectedOrder.type === 'repair' ? "綜合記事與狀態" : "施工內容與記事"}>
                                        <div className="grid grid-cols-1 divide-y divide-slate-200">
                                            {selectedOrder.type !== 'repair' && (<div className="p-2 text-sm"><span className="font-bold block mb-1">工況描述:</span><p className="text-slate-700 whitespace-pre-line pl-2">{selectedOrder.description || '無描述'}</p></div>)}
                                            {(selectedOrder.dismantledParts?.length > 0 || selectedOrder.dismantledDescription) && (
                                                <div className="p-2 text-sm">
                                                    <span className="font-bold block mb-1">拆回舊品紀錄:</span>
                                                    {selectedOrder.dismantledParts?.length > 0 ? (
                                                        <table className="w-full text-xs text-left mt-1 border border-slate-200">
                                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                                <tr><th className="p-1.5">名稱</th><th className="p-1.5">型號/規格</th><th className="p-1.5 text-center">數量</th></tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {selectedOrder.dismantledParts.map((part, i) => (
                                                                    <tr key={i}><td className="p-1.5">{part.name}</td><td className="p-1.5">{part.model || '-'}</td><td className="p-1.5 text-center">{part.qty}</td></tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-slate-700 whitespace-pre-line pl-2">{selectedOrder.dismantledDescription}</p>
                                                    )}
                                                </div>
                                            )}
                                            {selectedOrder.remarks && (<div className="p-2 text-sm"><span className="font-bold block mb-1">綜合記事/備註:</span><p className="text-slate-700 whitespace-pre-line pl-2">{selectedOrder.remarks}</p></div>)}
                                            <div className="p-2 text-sm bg-slate-50 flex justify-between"><span>當前狀態：<span className="font-bold">{selectedOrder.status}</span></span><span>完工測試：{selectedOrder.testOk ? '正常 (OK)' : '未確認'}</span></div>
                                        </div>
                                    </SectionBox>
                                )}
                            </div>

                            {!moveToPage2 && !hasPhotos && showSections.signatures && (
                                <SectionBox title="簽章欄位">
                                    <div className={`grid grid-cols-2 divide-x ${theme.border.replace('border-', 'divide-')}`}><div className="p-2 h-32 flex flex-col justify-between"><span className="font-bold text-sm">客戶簽名:</span>{selectedOrder.customerSignature ? (<img src={selectedOrder.customerSignature} alt="Customer Sig" className="h-20 object-contain self-center" />) : (<div className="h-20 flex items-center justify-center text-slate-300 text-xs italic">未簽署</div>)}</div><div className="p-2 h-32 flex flex-col justify-between"><span className="font-bold text-sm">工程師簽名:</span>{selectedOrder.engineerSignature ? (<img src={selectedOrder.engineerSignature} alt="Engineer Sig" className="h-20 object-contain self-center" />) : (<div className="h-20 flex items-center justify-center text-slate-300 text-xs italic">未簽署</div>)}</div></div>
                                </SectionBox>
                            )}

                            <div className="mt-auto pt-4 text-center text-[10px] text-slate-400 border-t border-slate-200 shrink-0">
                                本報告由 維運派工系統 自動產生 | 建立時間：{new Date().toLocaleString()} | 第 1 頁
                            </div>
                        </div>

                        {/* 第 2 頁 (照片附件與簽名) */}
                        {(hasPhotos || (moveToPage2 && (showSections.description || showSections.signatures))) && (
                            <div className="a4-page bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] text-slate-800 relative box-border flex flex-col border border-slate-200 mt-8 print:mt-0">
                                <div className={`border-b-2 ${theme.border} pb-3 mb-6 shrink-0`}>
                                    <h2 className={`text-xl font-bold ${theme.text}`}>{hasPhotos ? '附件：現場照片與簽核' : '第二頁：備註與簽核'}</h2>
                                    <div className="text-sm text-slate-500 mt-1">單號：{selectedOrder.id} | 專案名稱：{selectedOrder.customerName}</div>
                                </div>

                                <div className="w-full space-y-4">
                                    {moveToPage2 && showSections.description && selectedOrder.type !== 'capa' && (
                                        <SectionBox title={selectedOrder.type === 'repair' ? "綜合記事與狀態" : "施工內容與記事"}>
                                            <div className="grid grid-cols-1 divide-y divide-slate-200">
                                                {selectedOrder.type !== 'repair' && (<div className="p-2 text-sm"><span className="font-bold block mb-1">工況描述:</span><p className="text-slate-700 whitespace-pre-line pl-2">{selectedOrder.description || '無描述'}</p></div>)}
                                                {(selectedOrder.dismantledParts?.length > 0 || selectedOrder.dismantledDescription) && (
                                                    <div className="p-2 text-sm">
                                                        <span className="font-bold block mb-1">拆回舊品紀錄:</span>
                                                        {selectedOrder.dismantledParts?.length > 0 ? (
                                                            <table className="w-full text-xs text-left mt-1 border border-slate-200">
                                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                                    <tr><th className="p-1.5">名稱</th><th className="p-1.5">型號/規格</th><th className="p-1.5 text-center">數量</th></tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {selectedOrder.dismantledParts.map((part, i) => (
                                                                        <tr key={i}><td className="p-1.5">{part.name}</td><td className="p-1.5">{part.model || '-'}</td><td className="p-1.5 text-center">{part.qty}</td></tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <p className="text-slate-700 whitespace-pre-line pl-2">{selectedOrder.dismantledDescription}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {selectedOrder.remarks && (<div className="p-2 text-sm"><span className="font-bold block mb-1">綜合記事/備註:</span><p className="text-slate-700 whitespace-pre-line pl-2">{selectedOrder.remarks}</p></div>)}
                                                <div className="p-2 text-sm bg-slate-50 flex justify-between"><span>當前狀態：<span className="font-bold">{selectedOrder.status}</span></span><span>完工測試：{selectedOrder.testOk ? '正常 (OK)' : '未確認'}</span></div>
                                            </div>
                                        </SectionBox>
                                    )}

                                    {hasPhotos && (
                                        <SectionBox title="現場照片">
                                            <div className="grid grid-cols-2 gap-4 p-4">{selectedOrder.photoIssue && (<div className="flex flex-col items-center gap-1"><div className="w-full aspect-[4/3] border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"><img src={selectedOrder.photoIssue} alt="Issue" className="w-full h-full object-contain" /></div><span className="text-xs font-medium">異常狀況</span></div>)}{selectedOrder.photoBefore && (<div className="flex flex-col items-center gap-1"><div className="w-full aspect-[4/3] border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"><img src={selectedOrder.photoBefore} alt="Before" className="w-full h-full object-contain" /></div><span className="text-xs font-medium">施工前</span></div>)}{selectedOrder.photoAfter && (<div className="flex flex-col items-center gap-1"><div className="w-full aspect-[4/3] border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"><img src={selectedOrder.photoAfter} alt="After" className="w-full h-full object-contain" /></div><span className="text-xs font-medium">完工後</span></div>)}</div>
                                        </SectionBox>
                                    )}
                                    
                                    {(moveToPage2 || hasPhotos) && showSections.signatures && (
                                        <SectionBox title="簽章欄位">
                                            <div className={`grid grid-cols-2 divide-x ${theme.border.replace('border-', 'divide-')}`}><div className="p-2 h-32 flex flex-col justify-between"><span className="font-bold text-sm">客戶簽名:</span>{selectedOrder.customerSignature ? (<img src={selectedOrder.customerSignature} alt="Customer Sig" className="h-20 object-contain self-center" />) : (<div className="h-20 flex items-center justify-center text-slate-300 text-xs italic">未簽署</div>)}</div><div className="p-2 h-32 flex flex-col justify-between"><span className="font-bold text-sm">工程師簽名:</span>{selectedOrder.engineerSignature ? (<img src={selectedOrder.engineerSignature} alt="Engineer Sig" className="h-20 object-contain self-center" />) : (<div className="h-20 flex items-center justify-center text-slate-300 text-xs italic">未簽署</div>)}</div></div>
                                        </SectionBox>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 text-center text-[10px] text-slate-400 border-t border-slate-200 shrink-0">
                                    本報告由 維運派工系統 自動產生 | 建立時間：{new Date().toLocaleString()} | 第 2 頁
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4"><FileText size={64} className="opacity-20" /><p>請從左側選擇工單以預覽報告</p></div>
                )}
            </div>
        </div>
    );
};

const OrderTable = ({ orders, onView, onDelete, allowDelete, onProcessDismantled }) => (
    <>
        <div className="md:hidden space-y-4 p-4">{orders.length === 0 ? (<div className="text-center py-12 text-slate-400">目前沒有工單資料</div>) : orders.map((order) => {
            const constructionAlert = (order.type === 'dispatch' && order.constructionDate && !['已完成', '已結案', '正常'].includes(order.status)) 
                ? getConstructionStatus(order.constructionDate) 
                : null;
            
            return (
            <div key={order.id} onClick={() => onView(order)} className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 active:scale-[0.98] hover:shadow-md relative cursor-pointer"><div><div className="flex justify-between items-start mb-3"><div className="flex gap-2 items-center"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${order.type === 'dispatch' ? 'bg-blue-100 text-blue-700' : order.type === 'maintenance' ? 'bg-emerald-100 text-emerald-700' : order.type === 'construction' ? 'bg-indigo-100 text-indigo-700' : order.type === 'capa' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{order.type === 'dispatch' ? '派工' : order.type === 'maintenance' ? '保養' : order.type === 'construction' ? '施工' : order.type === 'capa' ? 'CAPA' : '報修'}</span><span className="text-xs text-slate-400 font-mono tracking-wider">#{order.id.slice(-4)}</span></div>{getOrderStatusBadge(order)}</div>
            
            <div className="font-extrabold text-slate-800 text-lg mb-1.5 flex items-center gap-2">
                {order.customerName}
                {constructionAlert && (constructionAlert.type === 'today' || constructionAlert.type === 'urgent' || constructionAlert.type === 'overdue') && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${constructionAlert.color} shrink-0`}>
                        {constructionAlert.label}
                    </span>
                )}
            </div>
            
            <div className="text-sm text-slate-500 mb-4 flex items-center gap-2"><Wrench size={14} className="text-slate-400" />{order.equipment || '未指定設備'}</div><div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100/80"><div className="flex items-center gap-3"><span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-blue-500/70" /> {order.date}{order.isMultiDay && order.endDate && ` ~ ${order.endDate.slice(5)}`}</span><span className="flex items-center gap-1.5"><User size={14} className="text-blue-500/70" /> {order.serviceEngineer || '未指派'}</span></div>{((order.dismantledDescription || (order.dismantledParts && order.dismantledParts.length > 0)) && !order.dismantledProcessed && onProcessDismantled) && (<button onClick={(e) => { e.stopPropagation(); onProcessDismantled(order); }} className="text-emerald-600 hover:text-emerald-800 font-bold px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition shadow-sm flex items-center gap-1 text-xs shrink-0"><Recycle size={14} /> 退料處理</button>)}</div></div></div>)
        })}</div>
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-slate-500 bg-slate-50/80 border-b border-slate-200/80 uppercase tracking-wider text-[11px] font-bold"><tr><th className="px-6 py-5">單號</th><th className="px-6 py-5">類型</th><th className="px-6 py-5">狀態</th><th className="px-6 py-5">日期</th><th className="px-6 py-5 hidden lg:table-cell">最後更新</th><th className="px-6 py-5">客戶名稱</th><th className="px-6 py-5 hidden lg:table-cell">場域</th><th className="px-6 py-5 hidden xl:table-cell">工程師</th><th className="px-6 py-5 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100/80">{orders.length === 0 ? (<tr><td colSpan="9" className="text-center py-16 text-slate-400">目前沒有工單資料</td></tr>) : orders.map((order) => {
            const constructionAlert = (order.type === 'dispatch' && order.constructionDate && !['已完成', '已結案', '正常'].includes(order.status)) 
                ? getConstructionStatus(order.constructionDate) 
                : null;

            return (
            <tr key={order.id} className="hover:bg-blue-50/40 transition-colors group"><td className="px-6 py-4 font-mono text-slate-500 text-xs tracking-wider">{order.id}</td><td className="px-6 py-4"><span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${order.type === 'dispatch' ? 'bg-blue-100 text-blue-700' : order.type === 'maintenance' ? 'bg-emerald-100 text-emerald-700' : order.type === 'construction' ? 'bg-indigo-100 text-indigo-700' : order.type === 'capa' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{order.type === 'dispatch' ? '派工' : order.type === 'maintenance' ? '保養' : order.type === 'construction' ? '施工' : order.type === 'capa' ? 'CAPA' : '報修'}</span></td><td className="px-6 py-4">{getOrderStatusBadge(order)}</td>
            <td className="px-6 py-4 font-medium text-slate-600">
                <div>{order.date}{order.isMultiDay && order.endDate && ` ~ ${order.endDate.slice(5)}`}</div>
                {constructionAlert && (constructionAlert.type === 'today' || constructionAlert.type === 'urgent' || constructionAlert.type === 'overdue') && (
                    <div className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded border ${constructionAlert.color}`}>
                        {constructionAlert.label}
                    </div>
                )}
            </td>
            <td className="px-6 py-4 text-xs text-slate-400 hidden lg:table-cell">{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '-'}</td><td className="px-6 py-4 font-bold text-slate-800">{order.customerName}</td><td className="px-6 py-4 text-slate-500 hidden lg:table-cell">{order.locationType || '-'}</td><td className="px-6 py-4 hidden xl:table-cell text-slate-600">{formatEngineerTeam(order.serviceEngineer, order.assistants)}</td><td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">{((order.dismantledDescription || (order.dismantledParts && order.dismantledParts.length > 0)) && !order.dismantledProcessed && onProcessDismantled) && (<button onClick={(e) => { e.stopPropagation(); onProcessDismantled(order); }} className="text-emerald-600 hover:text-emerald-800 font-bold px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition shadow-sm inline-flex items-center gap-1"><Recycle size={16} /> 退料</button>)}<button onClick={(e) => { e.stopPropagation(); onView(order); }} className="text-blue-600 hover:text-blue-800 font-bold px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition shadow-sm">查看</button>{allowDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(order.id); }} className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-xl transition shadow-sm"><Trash2 size={18} /></button>}</td></tr>)
        })}</tbody></table></div>
    </>
);

const WorkCalendar = ({ orders, onView }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    const matchDate = (order, targetDateStr) => {
        if (order.type === 'dispatch' && order.constructionDate) {
            if (order.isMultiDay && order.constructionEndDate) {
                return targetDateStr >= order.constructionDate && targetDateStr <= order.constructionEndDate;
            }
            return order.constructionDate === targetDateStr;
        }
        if (order.isMultiDay && order.endDate) {
            return targetDateStr >= order.date && targetDateStr <= order.endDate;
        }
        return order.date === targetDateStr;
    };

    const renderCalendarCells = () => { 
        const year = currentDate.getFullYear(); 
        const month = currentDate.getMonth(); 
        const daysInMonth = getDaysInMonth(currentDate); 
        const firstDay = getFirstDayOfMonth(currentDate); 
        const cells = []; 
        
        const todayObj = new Date();
        const localTodayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

        for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50 border border-slate-100"></div>); 
        
        for (let day = 1; day <= daysInMonth; day++) { 
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
            
            const daysOrders = orders.filter(o => matchDate(o, dateStr)); 
            
            const isToday = localTodayStr === dateStr; 
            cells.push(
                <div key={day} className={`h-24 md:h-32 border border-slate-200 p-1 flex flex-col hover:bg-slate-50 transition ${isToday ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-200' : 'bg-white'}`}>
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{day}</div>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                        {daysOrders.map(order => { 
                            const isCompleted = ['已完成', '已結案', '正常'].includes(order.status); 
                            return (
                                <button key={order.id} onClick={() => onView(order)} className={`w-full text-left text-[10px] px-1.5 py-1 rounded truncate shadow-sm border-l-2 transition hover:opacity-80 flex items-center gap-1 ${order.type === 'dispatch' ? 'bg-blue-50 border-blue-500 text-blue-800' : order.type === 'maintenance' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : order.type === 'construction' ? 'bg-indigo-50 border-indigo-500 text-indigo-800' : order.type === 'capa' ? 'bg-purple-50 border-purple-500 text-purple-800' : 'bg-amber-50 border-amber-500 text-amber-800'} ${isCompleted ? 'opacity-60 grayscale-[0.3]' : 'opacity-100'}`} title={`${order.customerName} - ${order.equipment}\n狀態: ${order.status}`}>
                                    {isCompleted && <Check size={10} className="shrink-0" />}
                                    <span className={`truncate ${isCompleted ? 'line-through decoration-slate-400 decoration-1' : ''}`}>{order.customerName} {order.serviceEngineer ? `(${order.serviceEngineer})` : ''}</span>
                                </button>
                            ); 
                        })}
                    </div>
                </div>
            ); 
        } 
        return cells; 
    };
    const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
    return (<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"><div className="flex items-center justify-between p-4 border-b"><div className="font-bold text-lg text-slate-800 flex items-center gap-2"><CalendarIcon className="text-blue-600" />{currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月</div><div className="flex gap-1"><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft size={20} /></button><button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm hover:bg-slate-100 rounded-md text-slate-600">今天</button><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronRight size={20} /></button></div></div><div className="grid grid-cols-7 text-center border-b bg-slate-50 text-slate-600 text-sm py-2 font-medium">{WEEKDAYS.map(day => (<div key={day} className={day === '日' || day === '六' ? 'text-red-400' : ''}>{day}</div>))}</div><div className="grid grid-cols-7">{renderCalendarCells()}</div></div>);
};

const WeeklyScheduler = ({ orders, onView }) => {
    const getWeekDates = () => { const today = new Date(); const day = today.getDay(); const diff = today.getDate() - day; const weekDates = []; for (let i = 0; i < 7; i++) { const date = new Date(today); date.setDate(diff + i); weekDates.push(date); } return weekDates; };
    const weekDates = getWeekDates(); 
    
    const matchDate = (order, targetDateStr) => {
        if (order.type === 'dispatch' && order.constructionDate) {
            if (order.isMultiDay && order.constructionEndDate) {
                return targetDateStr >= order.constructionDate && targetDateStr <= order.constructionEndDate;
            }
            return order.constructionDate === targetDateStr;
        }
        if (order.isMultiDay && order.endDate) {
            return targetDateStr >= order.date && targetDateStr <= order.endDate;
        }
        return order.date === targetDateStr;
    };

    const todayObj = new Date();
    const todayStrLocal = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    
    return (
        <div className="mb-6"><h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><LayoutDashboard size={18} className="text-blue-600" /> 本週工單排程</h3><div className="grid grid-cols-7 gap-3 overflow-x-auto pb-4 min-w-[800px] md:min-w-0 px-1">{weekDates.map((date, index) => { 
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; 
            
            const dayOrders = orders.filter(o => matchDate(o, dateStr)); 
            
            const isToday = dateStr === todayStrLocal; 
            return (
                <div key={index} className={`flex flex-col rounded-2xl border p-2 h-44 transition-all ${isToday ? 'bg-blue-50/50 border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-white border-slate-100 shadow-sm hover:border-blue-100'}`}>
                    <div className={`text-center pb-2 border-b border-slate-100/50 mb-2 ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                        <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{WEEKDAYS[date.getDay()]}</div>
                        <div className="text-xl font-bold leading-none mt-1">{date.getDate()}</div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {dayOrders.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-300">無</div>
                        ) : (
                            dayOrders.map(order => (
                                <button key={order.id} onClick={() => onView(order)} className="w-full text-left bg-white border border-slate-100 p-2 rounded-xl shadow-sm hover:shadow-md text-[10px] hover:bg-slate-50 transition group flex flex-col gap-1">
                                    <div className="flex items-center gap-1 font-bold text-slate-700 truncate w-full">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${order.type === 'maintenance' ? 'bg-emerald-500' : order.type === 'repair' ? 'bg-amber-500' : order.type === 'construction' ? 'bg-indigo-500' : order.type === 'capa' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                        <span className="truncate">{order.customerName}</span>
                                    </div>
                                    <div className="text-slate-400 text-[9px] truncate pl-3">{order.station || order.equipment || '一般'}</div>
                                    <div className="pl-3 mt-0.5">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${['已完成', '已結案', '正常'].includes(order.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ['待補全'].includes(order.status) ? 'bg-orange-50 text-orange-700 border-orange-100' : ['待追蹤', '需複查'].includes(order.status) ? 'bg-amber-50 text-amber-700 border-amber-100' : ['進行中'].includes(order.status) ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {order.status || '待處理'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ); 
        })}</div></div>
    );
};

const BottomNav = ({ activeTab, setActiveTab, onFabPress, onFabLongPress, badgeCount, currentIdentity, appPermissions }) => {
    const canShowAssets = currentIdentity?.type === 'admin' || (currentIdentity?.type === 'engineer' && appPermissions?.showAssets);
    const timerRef = useRef(null);
    const isLongPress = useRef(false);

    const handlePointerDown = (e) => {
        isLongPress.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            if (onFabLongPress) onFabLongPress();
            if (navigator.vibrate) navigator.vibrate(50); // 提供短暫震動回饋
        }, 2000); // 長按 2 秒觸發
    };

    const handlePointerUp = (e) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!isLongPress.current) {
            if (onFabPress) onFabPress(); // 如果未滿 2 秒放開，視為短按點擊
        }
    };

    const handlePointerCancel = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 pb-safe pt-2 px-6 flex justify-between items-center z-50 md:hidden h-[84px] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Home size={26} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} /><span className="text-[10px] font-bold">總覽</span></button>
            {canShowAssets && <button onClick={() => setActiveTab('assets')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'assets' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Package size={26} strokeWidth={activeTab === 'assets' ? 2.5 : 2} /><span className="text-[10px] font-bold">資產</span></button>}
            <div className="relative -top-6 mx-auto">
                <button 
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerCancel}
                    onPointerCancel={handlePointerCancel}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_-4px_rgba(79,70,229,0.5)] active:scale-90 transition-all duration-300 border-[3px] border-white touch-none"
                    title="短按查看待辦，長按2秒新增工單"
                >
                    <Plus size={32} strokeWidth={2.5} />
                </button>
            </div>
            {currentIdentity?.type === 'admin' && <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Settings size={26} strokeWidth={activeTab === 'settings' ? 2.5 : 2} /><span className="text-[10px] font-bold">設定</span></button>}
        </div>
    );
};

const LoginScreen = ({ staffList, setStaffList, appPermissions, setCurrentIdentity }) => {
    const [selectedStaff, setSelectedStaff] = useState('');
    const [adminPwd, setAdminPwd] = useState('');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // 工程師密碼相關狀態
    const [loginStep, setLoginStep] = useState('select_user'); // 'select_user', 'enter_password', 'set_password'
    const [staffPwd, setStaffPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [selectedStaffData, setSelectedStaffData] = useState(null);

    const staffNamesOnly = staffList.map(s => s.name);

    const doLogin = (role) => {
        setCurrentIdentity(role);
        try {
            localStorage.setItem('app_identity', JSON.stringify(role));
        } catch (err) {
            console.warn('LocalStorage is not available:', err);
        }
    };

    const handleStaffSelect = () => {
        if (!selectedStaff) {
            alert('請選擇人員');
            return;
        }
        const staffData = staffList.find(s => s.name === selectedStaff);
        if (!staffData) return;
        
        setSelectedStaffData(staffData);
        if (staffData.password) {
            setLoginStep('enter_password');
        } else {
            setLoginStep('set_password');
        }
        setStaffPwd('');
        setConfirmPwd('');
    };

    const handleStaffLogin = () => {
        if (staffPwd === selectedStaffData.password) {
            doLogin({ type: 'engineer', name: selectedStaff });
        } else {
            alert("密碼錯誤");
        }
    };

    const handleSetPassword = async () => {
        if (!staffPwd) { alert("請輸入密碼"); return; }
        if (staffPwd !== confirmPwd) { alert("兩次輸入的密碼不一致"); return; }
        if (staffPwd.length < 4) { alert("密碼長度至少需要 4 碼"); return; }

        // 更新 Firebase 中的人員資料
        const updatedStaffList = staffList.map(s => {
            if (s.name === selectedStaff) {
                return { ...s, password: staffPwd };
            }
            return s;
        });

        await setStaffList(updatedStaffList);
        
        alert("密碼設定成功！已自動登入。");
        doLogin({ type: 'engineer', name: selectedStaff });
    };

    const tryAdminLogin = (e) => {
        e.preventDefault();
        const currentPassword = appPermissions?.adminPassword || DEFAULT_PERMISSIONS.adminPassword;
        
        if (adminPwd === currentPassword || adminPwd === 'admin') {
            doLogin({ type: 'admin', name: '管理員' });
        } else {
            alert("密碼錯誤");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 transition-all duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">維運派工系統</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        {showAdminLogin ? '系統管理員登入' : 
                         loginStep === 'enter_password' ? `嗨，${selectedStaff}` :
                         loginStep === 'set_password' ? `歡迎加入，${selectedStaff}` : '請選擇您的登入身分'}
                    </p>
                </div>

                {!showAdminLogin ? (
                    <>
                        {loginStep === 'select_user' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95">
                                <div>
                                    <Label>我是工程師</Label>
                                    <div className="flex gap-2">
                                        <Select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} options={staffNamesOnly} className="flex-1" />
                                        <button 
                                            onClick={handleStaffSelect} 
                                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 shadow-md font-bold transition flex items-center gap-2"
                                        >
                                            下一步 <ArrowRightCircle size={18} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">進入後僅能看見與您相關的指派工單。</p>
                                </div>
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">或</span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>
                                <button onClick={() => setShowAdminLogin(true)} className="w-full py-3.5 border-2 border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 hover:border-slate-300 font-bold transition flex items-center justify-center gap-2">
                                    <Lock size={18} /> 系統管理員登入
                                </button>
                            </div>
                        )}

                        {loginStep === 'enter_password' && (
                            <div className="space-y-4 animate-in slide-in-from-right-8">
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full"><Lock size={16} className="text-blue-500" /></div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">請輸入您的專屬密碼</div>
                                            <div className="text-xs text-slate-500">忘記密碼請聯絡管理員重置</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label>個人密碼</Label>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            value={staffPwd} 
                                            onChange={(e) => setStaffPwd(e.target.value)} 
                                            placeholder="請輸入密碼..." 
                                            autoFocus 
                                            onKeyPress={(e) => e.key === 'Enter' && handleStaffLogin()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setLoginStep('select_user')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-bold transition">更換人員</button>
                                    <button onClick={handleStaffLogin} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-md font-bold transition">驗證並登入</button>
                                </div>
                            </div>
                        )}

                        {loginStep === 'set_password' && (
                            <div className="space-y-4 animate-in slide-in-from-right-8">
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full"><Shield size={16} className="text-emerald-500" /></div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">首次登入設定</div>
                                            <div className="text-xs text-slate-500">請設定一組您自己的登入密碼，未來將使用此密碼登入。</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label>設定密碼 (至少 4 碼)</Label>
                                    <div className="relative mb-3">
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            value={staffPwd} 
                                            onChange={(e) => setStaffPwd(e.target.value)} 
                                            placeholder="請輸入新密碼..." 
                                            autoFocus 
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <Label>確認密碼</Label>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            value={confirmPwd} 
                                            onChange={(e) => setConfirmPwd(e.target.value)} 
                                            placeholder="請再次輸入密碼..." 
                                            onKeyPress={(e) => e.key === 'Enter' && handleSetPassword()}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setLoginStep('select_user')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-bold transition">取消</button>
                                    <button onClick={handleSetPassword} className="flex-[2] py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-md font-bold transition flex items-center justify-center gap-2"><Save size={18}/> 儲存並登入</button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <form onSubmit={tryAdminLogin} className="space-y-4 animate-in slide-in-from-right-8">
                        <div>
                            <Label>管理員密碼</Label>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    value={adminPwd} 
                                    onChange={(e) => setAdminPwd(e.target.value)} 
                                    placeholder="請輸入密碼 (預設 admin)" 
                                    autoFocus 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                                    title={showPassword ? "隱藏密碼" : "顯示密碼"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-bold transition">返回</button>
                            <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-md font-bold transition">驗證並登入</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardViewMode, setDashboardViewMode] = useState('split'); 
  const [currentOrder, setCurrentOrder] = useState(null);
  const [createType, setCreateType] = useState('派工單');
  const hasHandledDeepLink = useRef(false);
  const hasShownWelcomeAlert = useRef(false); // 新增：用來記錄是否已經顯示過登入歡迎提醒
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleModalObj, setScheduleModalObj] = useState({ isOpen: false, item: null, index: null, selectedDate: '', autoUpdate: true });
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dismantledModalOrder, setDismantledModalOrder] = useState(null);

  const [currentIdentity, setCurrentIdentity] = useState(() => {
      try {
          if (typeof window !== 'undefined') {
              const saved = localStorage.getItem('app_identity');
              return saved ? JSON.parse(saved) : null;
          }
      } catch (e) {
          console.warn('LocalStorage access denied', e);
      }
      return null;
  });

  useEffect(() => {
    const initAuth = async () => { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { await signInAnonymously(auth); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const [customers, setCustomers, loadingCust] = useFirestoreList(user, 'customer_list', DEFAULT_CUSTOMERS);
  const [stations, setStations] = useFirestoreList(user, 'app_stations', DEFAULT_STATIONS);
  const [equipment, setEquipment] = useFirestoreList(user, 'app_equipment', DEFAULT_EQUIPMENT);
  const [specs, setSpecs] = useFirestoreList(user, 'app_specs', DEFAULT_SPECS);
  const [serviceItems, setServiceItems] = useFirestoreList(user, 'app_service_items', DEFAULT_SERVICE_ITEMS);
  const [parts, setParts] = useFirestoreList(user, 'app_parts', DEFAULT_PARTS);
  const [rawStaffList, setStaffList] = useFirestoreList(user, 'app_staff_list', DEFAULT_STAFF_LIST);
  const staffList = normalizeStaffList(rawStaffList); // 確保內部使用的是新版物件結構
  const staffNamesOnly = staffList.map(s => s.name); // 用於原本的下拉選單等只需要名字的地方

  const [cycles, setCycles] = useFirestoreList(user, 'app_cycles', DEFAULT_CYCLES);
  const [checklistTemplate, setChecklistTemplate] = useFirestoreList(user, 'app_checklist_template', DEFAULT_CHECKLIST_TEMPLATE);
  const [schedules, setSchedules] = useFirestoreList(user, 'app_maintenance_schedules', []);
  const [appPermissions, setAppPermissions] = useFirestoreList(user, 'app_global_permissions', DEFAULT_PERMISSIONS);
  const [baseUrl, setBaseUrl] = useFirestoreList(user, 'app_base_url', '');
  const [assetList, loadingAssets] = useCollectionList(user, 'equipment_assets', []);
  const [inventoryItems, loadingInv] = useCollectionList(user, 'inventory_items', []); // 新增：供子表單取用
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'maintenance_orders');
    const q = query(collectionRef); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(data);
    }, (error) => { console.error("Error fetching orders:", error); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (currentIdentity && orders.length > 0 && !hasHandledDeepLink.current && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) { 
            const targetOrder = orders.find(o => o.id === id); 
            if (targetOrder) { 
                confirm({
                    title: "開啟指定工單",
                    message: `偵測到您點擊了通知連結。\n單號：${targetOrder.id}\n客戶：${targetOrder.customerName}\n設備：${targetOrder.equipment || '未指定'}\n\n是否立即開啟此工單？`,
                    onConfirm: () => handleView(targetOrder),
                    isDanger: false
                });
            } 
            hasHandledDeepLink.current = true; 
            // 清除網址列參數，避免重新整理後再次觸發
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, currentIdentity]);

  // 新增：登入時的未完成工單提醒
  useEffect(() => {
      // 若登出，重置提醒標記
      if (!currentIdentity) {
          hasShownWelcomeAlert.current = false;
          return;
      }

      // 只有工程師身分、尚未提醒過，且工單已載入時才執行
      if (currentIdentity.type === 'engineer' && !hasShownWelcomeAlert.current && orders.length > 0) {
          // 篩選出屬於該工程師，且尚未結案的工單
          const myPendingOrders = orders.filter(o => 
              (o.serviceEngineer === currentIdentity.name || o.assistants?.includes(currentIdentity.name)) &&
              !['已完成', '已結案', '正常', '已取消'].includes(o.status)
          );

          if (myPendingOrders.length > 0) {
              hasShownWelcomeAlert.current = true; // 標記為已提醒，避免重複彈出
              
              // 稍微延遲一下，讓畫面先渲染完成再跳出視窗體驗比較好
              setTimeout(() => {
                  confirm({
                      title: "🎉 歡迎登入",
                      message: `嗨，${currentIdentity.name}！\n\n您目前有 ${myPendingOrders.length} 筆未完成的指派工單等待處理。\n祝您今天工作順利！`,
                      onConfirm: () => {}, // 點擊確認不需特別做什麼
                      isDanger: false
                  });
              }, 600);
          } else {
              // 就算沒有待辦工單，也標記為已檢查過
              hasShownWelcomeAlert.current = true;
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdentity, orders]);

  // 新增：登入後鎖定滑鼠右鍵，但允許輸入框
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (currentIdentity) {
        // 允許在輸入框使用右鍵 (以便進行貼上/複製等操作)
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [currentIdentity]);

  const dueSchedulesCount = schedules.filter(s => { if(!s.nextMaintenanceDate) return false; const today = new Date(); today.setHours(0,0,0,0); const target = new Date(s.nextMaintenanceDate); const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24)); return diff <= 7; }).length;

  const canShowAssets = currentIdentity?.type === 'admin' || (currentIdentity?.type === 'engineer' && appPermissions?.showAssets);
  const canShowInventory = currentIdentity?.type === 'admin' || (currentIdentity?.type === 'engineer' && appPermissions?.showInventory);
  const canShowStats = currentIdentity?.type === 'admin' || (currentIdentity?.type === 'engineer' && appPermissions?.showStats);
  const canShowSchedule = currentIdentity?.type === 'admin' || (currentIdentity?.type === 'engineer' && appPermissions?.showSchedule);

  const getFilteredDashboardOrders = () => {
      return orders.filter(order => {
          if (currentIdentity?.type === 'engineer') {
              const isPrimary = order.serviceEngineer === currentIdentity.name;
              const isAssistant = order.assistants?.includes(currentIdentity.name);
              if (!isPrimary && !isAssistant) return false;
          }

          if (statusFilter && order.status !== statusFilter) return false;
          if (searchTerm) { const term = searchTerm.toLowerCase(); const idMatch = order.id?.toLowerCase().includes(term); const custMatch = order.customerName?.toLowerCase().includes(term); const engMatch = order.serviceEngineer?.toLowerCase().includes(term); if (!idMatch && !custMatch && !engMatch) return false; }
          return true;
      });
  };

  const dashboardOrders = getFilteredDashboardOrders();
  
  // 建立僅限當前使用者相關的工單列表 (報告生成器專用)
  const myOrders = currentIdentity?.type === 'engineer' 
      ? orders.filter(o => o.serviceEngineer === currentIdentity.name || o.assistants?.includes(currentIdentity.name))
      : orders;

  const { confirm, ConfirmDialog } = useConfirm();
  const { openMessage, MessageModal } = useMessageModal();
  const generateId = (prefix) => { const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); return `${prefix}-${date}-${random}`; };

  const handleSave = async (data, type, options = {}) => {
    const { stayOnPage = false, onSuccess } = options;
    if (!user) { alert("尚未登入，無法儲存"); return; }
    const dataWithType = { ...data, type: type };
    const newStatus = calculateOrderStatus(dataWithType, type);
    const missing = checkCompleteness(dataWithType, type);
    const isStatusIncomplete = newStatus === '待補全';
    const isIncompleteData = ['dispatch', 'maintenance', 'repair', 'construction', 'capa'].includes(type) && missing.length > 0;
    const shouldWarn = isStatusIncomplete || isIncompleteData;

    const saveOrderToFirestore = async () => {
        const orderId = data.id && data.id !== "系統自動產生" ? data.id : generateId(type === 'dispatch' ? 'WO' : type === 'maintenance' ? 'PM' : type === 'construction' ? 'CM' : type === 'capa' ? 'CAPA' : 'RM');
        const newOrder = { ...data, id: orderId, type: type, status: newStatus, updatedAt: new Date().toISOString() };
        
        const isCompleted = ['已完成', '已結案', '正常'].includes(newStatus);
        if (isCompleted && dataWithType.replacedParts && dataWithType.replacedParts.length > 0 && !dataWithType.inventoryDeducted) {
             try {
                const invColRef = collection(db, 'artifacts', appId, 'public', 'data', 'inventory_items');
                const invSnapshot = await getDocs(invColRef);
                const batch = writeBatch(db);
                let deducted = false;

                dataWithType.replacedParts.forEach(part => {
                    const qty = parseInt(part.qty) || 0;
                    if (qty <= 0) return;
                    
                    const candidates = invSnapshot.docs.map(d => ({...d.data(), id: d.id})).filter(i => i.name === part.name);
                    let target = null;
                    
                    let refinedCandidates = candidates;
                    if (part.isSecondhand) {
                         const secondhandCandidates = candidates.filter(c => c.category === '二手備品');
                         if (secondhandCandidates.length > 0) refinedCandidates = secondhandCandidates;
                    } else {
                         const newCandidates = candidates.filter(c => c.category !== '二手備品');
                         if (newCandidates.length > 0) refinedCandidates = newCandidates;
                    }

                    if (refinedCandidates.length === 1) target = refinedCandidates[0];
                    else if (refinedCandidates.length > 1) {
                        target = refinedCandidates.find(i => i.model === part.model) || refinedCandidates[0];
                    } else if (candidates.length > 0) {
                        target = candidates.find(i => i.model === part.model) || candidates[0];
                    }

                    if (target) {
                        const currentQty = parseInt(target.quantity) || 0;
                        const newQty = currentQty - qty;
                        
                        // 若為二手品，自動從庫存紀錄中移除被選中的序號
                        let newSNs = target.serialNumber || '';
                        if (part.isSecondhand && part.serialNumbers && part.serialNumbers.length > 0) {
                            let availableSNList = newSNs.split(',').map(s => s.trim()).filter(Boolean);
                            part.serialNumbers.forEach(usedSN => {
                                const idx = availableSNList.indexOf(usedSN);
                                if (idx > -1) availableSNList.splice(idx, 1);
                            });
                            newSNs = availableSNList.join(', ');
                        }

                        const logEntry = {
                            date: newOrder.date,
                            orderId: newOrder.id,
                            qty: qty,
                            customer: newOrder.customerName
                        };
                        
                        const targetRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', target.id);
                        batch.update(targetRef, {
                            quantity: newQty,
                            serialNumber: newSNs,
                            usageLog: [...(target.usageLog || []), logEntry]
                        });
                        deducted = true;
                    }
                });

                if (deducted) {
                    newOrder.inventoryDeducted = true;
                    await batch.commit();
                    alert("已自動扣除庫存並記錄使用履歷。");
                }
             } catch (e) {
                 console.error("Inventory deduction error", e);
                 alert("庫存扣除失敗，請檢查網路或稍後再試。");
             }
        }

        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'maintenance_orders', orderId);
        try { await setDoc(docRef, newOrder); if (stayOnPage) { setCurrentOrder(newOrder); if (onSuccess) onSuccess(newOrder); } else { setActiveTab('dashboard'); setCurrentOrder(null); } } catch (e) { console.error("Error saving order:", e); alert("儲存失敗"); }
    };
    
    if (shouldWarn) { 
        let title = "資料完整性確認"; let message = "";
        if (isStatusIncomplete) { message = `此工單將標記為「待補全」，原因如下：\n• ${missing.join('\n• ')}\n\n是否仍要儲存？`; } else { message = `目前工單資料尚有缺漏：\n• ${missing.join('\n• ')}\n\n未完成所有項目仍可儲存。\n是否確認儲存？`; }
        confirm({ title: title, message: message, onConfirm: saveOrderToFirestore, isDanger: false }); 
    } else { saveOrderToFirestore(); }
  };
  
  const handleDelete = (id) => { if (!user) return; confirm({ title: "刪除工單", message: "確定要刪除此工單嗎？此操作無法復原。", onConfirm: async () => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'maintenance_orders', id)); } catch (e) { console.error("Error deleting order:", e); alert("刪除失敗"); } } }); };
  
  const handleImportData = async (importedData) => { 
      if (!user || !importedData) return; 
      try { 
          if (importedData.customers) setCustomers(importedData.customers); 
          if (importedData.stations) setStations(importedData.stations); 
          if (importedData.equipment) setEquipment(importedData.equipment); 
          if (importedData.specs) setSpecs(importedData.specs); 
          if (importedData.serviceItems) setServiceItems(importedData.serviceItems); 
          if (importedData.parts) setParts(importedData.parts); 
          if (importedData.staffList) setStaffList(importedData.staffList); 
          if (importedData.cycles) setCycles(importedData.cycles); 
          if (importedData.checklistTemplate) setChecklistTemplate(importedData.checklistTemplate); 
          if (importedData.schedules) setSchedules(importedData.schedules); 
          if (importedData.appPermissions) setAppPermissions(importedData.appPermissions);

          const importCol = async (colName, items) => { 
              if (!items || items.length === 0) return; 
              // 分批寫入 (Firestore batch limit = 500)
              for (let i = 0; i < items.length; i += 400) { 
                  const chunk = items.slice(i, i + 400); 
                  const batch = writeBatch(db); 
                  chunk.forEach(item => { 
                      if (!item.id) item.id = crypto.randomUUID(); 
                      const docRef = doc(db, 'artifacts', appId, 'public', 'data', colName, item.id); 
                      batch.set(docRef, item); 
                  }); 
                  await batch.commit(); 
              } 
          }; 

          await importCol('maintenance_orders', importedData.orders); 
          await importCol('equipment_assets', importedData.assets); 
          await importCol('inventory_items', importedData.inventory); 

          alert('系統資料匯入成功！'); 
      } catch (e) { 
          console.error("Import failed:", e); 
          alert("匯入失敗"); 
      } 
  };
  
  const handleView = async (order) => { 
      let currentOrderData = { ...order };
      
      // 當工程師開啟「待處理」的工單，且自己是被指派的人員時，自動轉為「已讀取」
      if (order.status === '待處理' && currentIdentity?.type === 'engineer' && 
          (order.serviceEngineer === currentIdentity.name || order.assistants?.includes(currentIdentity.name))) {
          currentOrderData.status = '已讀取';
          try {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'maintenance_orders', order.id);
              await setDoc(docRef, { status: '已讀取', updatedAt: new Date().toISOString() }, { merge: true });
          } catch (e) {
              console.error("更新已讀狀態失敗:", e);
          }
      }

      setCurrentOrder(currentOrderData); 
      if (currentOrderData.type === 'dispatch') setActiveTab('create_dispatch'); 
      if (currentOrderData.type === 'maintenance') setActiveTab('create_maintenance'); 
      if (currentOrderData.type === 'repair') setActiveTab('create_repair'); 
      if (currentOrderData.type === 'construction') setActiveTab('create_construction'); 
      if (currentOrderData.type === 'capa') setActiveTab('create_capa'); 
  };
  
  const handleCreateDispatchFromSchedule = (scheduleItem, index) => {
      setScheduleModalObj({
          isOpen: true,
          item: scheduleItem,
          index: index,
          selectedDate: scheduleItem.nextMaintenanceDate || new Date().toISOString().slice(0, 10),
          autoUpdate: true
      });
  };

  const ScheduleDispatchModal = () => {
      if (!scheduleModalObj.isOpen || !scheduleModalObj.item) return null;
      const { item, index, selectedDate, autoUpdate } = scheduleModalObj;

      const handleConfirm = () => {
          const todayStr = new Date().toISOString().slice(0, 10);
          const newDispatch = { 
              ...DEFAULT_DISPATCH_DATA, 
              date: todayStr, 
              constructionDate: selectedDate, 
              customerName: item.customerName, 
              customerAddress: item.customerAddress, 
              locationType: item.locationType, 
              contactPerson: item.contactPerson, 
              station: item.station, 
              equipment: item.equipment, 
              serviceEngineer: item.serviceEngineer, 
              serviceItem: '保養', 
              cycle: item.cycle, 
              description: `【系統自動建立】\n依據保養排程自動產生。\n保養週期：${item.cycle}\n上次保養日：${item.lastMaintenanceDate}\n原預計保養日：${item.nextMaintenanceDate}\n實際排定施工日：${selectedDate}`, 
              status: '待處理' 
          };

          if (autoUpdate) {
              const futureDate = calculateNextDate(selectedDate, item.cycle);
              const newSchedules = [...schedules];
              newSchedules[index] = { ...item, lastMaintenanceDate: selectedDate, nextMaintenanceDate: futureDate };
              setSchedules(newSchedules);
          }

          setCurrentOrder(newDispatch);
          setActiveTab('create_dispatch');
          setScheduleModalObj({ isOpen: false, item: null, index: null, selectedDate: '', autoUpdate: true });
      };

      return (
          <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                          <CalendarClock size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">建立保養工單</h3>
                  </div>
                  <div className="mb-4 text-sm text-slate-600">
                      為 <span className="font-bold text-slate-800">{item.customerName}</span> 建立保養派工單。您可以調整預定施工日期：
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">預定施工日期</label>
                          <input 
                              type="date" 
                              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-3 bg-white"
                              value={selectedDate}
                              onChange={(e) => setScheduleModalObj({...scheduleModalObj, selectedDate: e.target.value})}
                          />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition">
                          <input 
                              type="checkbox" 
                              checked={autoUpdate} 
                              onChange={(e) => setScheduleModalObj({...scheduleModalObj, autoUpdate: e.target.checked})}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                          />
                          <div className="text-sm font-medium text-slate-700">
                              同時將排程更新至下個週期
                              <div className="text-xs text-slate-500 font-normal mt-0.5">系統將以您選擇的日期推算下一次保養日</div>
                          </div>
                      </label>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setScheduleModalObj({isOpen: false, item: null, index: null, selectedDate: '', autoUpdate: true})} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition font-medium text-sm">取消</button>
                      <button onClick={handleConfirm} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl hover:shadow-md transition font-medium text-sm flex items-center gap-2">
                          確定建立
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const handleConvertToMaintenance = (dispatchData) => { 
      let cycleToUse = dispatchData.cycle || '';
      if (!cycleToUse && schedules.length > 0) {
          if (dispatchData.assetId) { const match = schedules.find(s => s.assetId === dispatchData.assetId); if (match && match.cycle) cycleToUse = match.cycle; }
          if (!cycleToUse && dispatchData.customerName && dispatchData.equipment) { const match = schedules.find(s => s.customerName === dispatchData.customerName && s.equipment === dispatchData.equipment); if (match && match.cycle) cycleToUse = match.cycle; }
          if (!cycleToUse && dispatchData.customerName) { const match = schedules.find(s => s.customerName === dispatchData.customerName); if (match && match.cycle) cycleToUse = match.cycle; }
      }
      const newData = { ...DEFAULT_MAINTENANCE_DATA, ...dispatchData, date: dispatchData.constructionDate || dispatchData.date, endDate: dispatchData.constructionEndDate || '', cycle: cycleToUse, checklist: checklistTemplate.map(item => ({ name: item, ok: false, ng: false })), remarks: dispatchData.description ? `(原工況: ${dispatchData.description})` : '', type: 'maintenance', status: '進行中' }; setCurrentOrder(newData); setActiveTab('create_maintenance'); 
  };
  const handleConvertToRepair = (dispatchData) => { const newData = { ...DEFAULT_REPAIR_DATA, ...dispatchData, date: dispatchData.constructionDate || dispatchData.date, endDate: dispatchData.constructionEndDate || '', causeAnalysis: '', description: dispatchData.description, photoBefore: dispatchData.photoIssue, type: 'repair', status: '進行中' }; setCurrentOrder(newData); setActiveTab('create_repair'); };
  const handleConvertToConstruction = (dispatchData) => { const newData = { ...DEFAULT_CONSTRUCTION_DATA, ...dispatchData, date: dispatchData.constructionDate || dispatchData.date, endDate: dispatchData.constructionEndDate || '', description: dispatchData.description, photoBefore: dispatchData.photoIssue, type: 'construction', status: '進行中' }; setCurrentOrder(newData); setActiveTab('create_construction'); };
  const handleConvertToCapa = (sourceData) => { 
      const newData = { 
          ...DEFAULT_CAPA_DATA, 
          sourceOrderId: sourceData.id, 
          date: sourceData.constructionDate || sourceData.date,
          endDate: sourceData.endDate || sourceData.constructionEndDate || '',
          customerName: sourceData.customerName || '', 
          customerAddress: sourceData.customerAddress || '', 
          locationType: sourceData.locationType || '', 
          contactPerson: sourceData.contactPerson || '', 
          contactPhone: sourceData.contactPhone || '', 
          station: sourceData.station || '', 
          equipment: sourceData.equipment || '', 
          assetId: sourceData.assetId || '', 
          spec: sourceData.spec || '', 
          problemDescription: sourceData.description || sourceData.problemDescription || '', 
          type: 'capa', 
          status: '進行中' 
      }; 
      setCurrentOrder(newData); 
      setActiveTab('create_capa'); 
  };

  const handleFabCreate = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); if (activeTab === 'dashboard') {} else { setActiveTab('dashboard'); } };

  const handleLogout = () => {
      setCurrentIdentity(null);
      try {
          localStorage.removeItem('app_identity');
      } catch (e) {
          console.warn('LocalStorage access denied', e);
      }
      setActiveTab('dashboard');
  };

  const commonFormProps = { currentIdentity, customers, stations, equipment, specs, serviceItems, parts, staffList: staffNamesOnly, onCancel: () => { setActiveTab('dashboard'); setCurrentOrder(null); }, openMessage, baseUrl, assetList, inventoryItems };

  const renderModals = () => (
      <>
          <DismantledProcessingModal isOpen={!!dismantledModalOrder} order={dismantledModalOrder} onClose={() => setDismantledModalOrder(null)} assetList={assetList} />
          {showPendingModal && (
              <div className="fixed inset-0 bg-slate-900/40 z-[10000] flex items-end justify-center sm:items-center backdrop-blur-sm animate-in fade-in duration-200">
                 <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-safe max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 border border-white/20">
                     <div className="flex justify-between items-center mb-4 shrink-0">
                         <div>
                             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Clock className="text-blue-600"/> 未結案 / 今日預定</h3>
                             <p className="text-xs text-slate-500 mt-1">點擊可直接進入該工單</p>
                         </div>
                         <button onClick={() => setShowPendingModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition"><X size={20}/></button>
                     </div>
                     <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                         {dashboardOrders.filter(o => {
                             const isUnresolved = !['已完成', '已結案', '正常', '已取消'].includes(o.status);
                             const todayObj = new Date();
                             const localTodayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
                             const isToday = o.date === localTodayStr || o.constructionDate === localTodayStr;
                             return isUnresolved || isToday;
                         }).length === 0 ? (
                             <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-3">
                                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><CheckCircle size={32}/></div>
                                 <p>目前無待處理工單 🎉</p>
                             </div>
                         ) : (
                             dashboardOrders.filter(o => {
                                 const isUnresolved = !['已完成', '已結案', '正常', '已取消'].includes(o.status);
                                 const todayObj = new Date();
                                 const localTodayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
                                 const isToday = o.date === localTodayStr || o.constructionDate === localTodayStr;
                                 return isUnresolved || isToday;
                             }).map(order => (
                                 <div key={order.id} onClick={() => { handleView(order); setShowPendingModal(false); }} className="mb-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md active:scale-[0.98] transition cursor-pointer group">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-2">
                                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${order.type === 'dispatch' ? 'bg-blue-100 text-blue-700' : order.type === 'maintenance' ? 'bg-emerald-100 text-emerald-700' : order.type === 'construction' ? 'bg-indigo-100 text-indigo-700' : order.type === 'capa' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                                 {order.type === 'dispatch' ? '派工' : order.type === 'maintenance' ? '保養' : order.type === 'construction' ? '施工' : order.type === 'capa' ? 'CAPA' : '報修'}
                                             </span>
                                             <span className="text-xs text-slate-400 font-mono">#{order.id.slice(-4)}</span>
                                         </div>
                                         {getOrderStatusBadge(order)}
                                     </div>
                                     <div className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-700 transition-colors">{order.customerName}</div>
                                     <div className="text-sm text-slate-500 flex items-center gap-2 truncate">
                                         <Wrench size={14} className="text-slate-400"/>
                                         <span className="truncate">{order.equipment || '未指定設備'}</span>
                                     </div>
                                     <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                         <span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-blue-400"/> {order.date}</span>
                                         <span className="flex items-center gap-1.5"><User size={14} className="text-blue-400"/> {order.serviceEngineer || '未指派'}</span>
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                 </div>
              </div>
          )}

          {showCreateModal && (
              <div className="fixed inset-0 bg-slate-900/40 z-[10000] flex items-end justify-center sm:items-center backdrop-blur-sm animate-in fade-in duration-200">
                 <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-safe animate-in slide-in-from-bottom-8 border border-white/20">
                     <div className="flex justify-between items-center mb-6">
                         <div>
                             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plus className="text-blue-600"/> 新增工單</h3>
                             <p className="text-xs text-slate-500 mt-1">請選擇您要建立的工單類型</p>
                         </div>
                         <button onClick={() => setShowCreateModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition"><X size={20}/></button>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         {currentIdentity?.type === 'admin' && (
                             <button onClick={() => { setCurrentOrder(null); setActiveTab('create_dispatch'); setShowCreateModal(false); }} className="flex flex-col items-center gap-3 p-5 bg-white text-blue-700 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:bg-blue-50 active:scale-95 transition group">
                                 <div className="p-3 bg-blue-100 rounded-full group-hover:scale-110 transition-transform"><ClipboardList size={24}/></div>
                                 <span className="font-bold">派工單</span>
                             </button>
                         )}
                         <button onClick={() => { setCurrentOrder(null); setActiveTab('create_maintenance'); setShowCreateModal(false); }} className="flex flex-col items-center gap-3 p-5 bg-white text-emerald-700 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 transition group">
                             <div className="p-3 bg-emerald-100 rounded-full group-hover:scale-110 transition-transform"><Activity size={24}/></div>
                             <span className="font-bold">保養單</span>
                         </button>
                         <button onClick={() => { setCurrentOrder(null); setActiveTab('create_repair'); setShowCreateModal(false); }} className="flex flex-col items-center gap-3 p-5 bg-white text-amber-700 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:bg-amber-50 active:scale-95 transition group">
                             <div className="p-3 bg-amber-100 rounded-full group-hover:scale-110 transition-transform"><Hammer size={24}/></div>
                             <span className="font-bold">報修單</span>
                         </button>
                         <button onClick={() => { setCurrentOrder(null); setActiveTab('create_construction'); setShowCreateModal(false); }} className="flex flex-col items-center gap-3 p-5 bg-white text-indigo-700 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition group">
                             <div className="p-3 bg-indigo-100 rounded-full group-hover:scale-110 transition-transform"><PlayCircle size={24}/></div>
                             <span className="font-bold">施工單</span>
                         </button>
                         <button onClick={() => { setCurrentOrder(null); setActiveTab('create_capa'); setShowCreateModal(false); }} className="flex flex-col items-center gap-3 p-5 bg-white text-purple-700 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:bg-purple-50 active:scale-95 transition group">
                             <div className="p-3 bg-purple-100 rounded-full group-hover:scale-110 transition-transform"><Target size={24}/></div>
                             <span className="font-bold">CAPA單</span>
                         </button>
                     </div>
                 </div>
              </div>
          )}
      </>
  );

  if (!user && loadingCust) { return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-blue-600 font-bold flex flex-col items-center gap-2"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>資料庫連線中...</div></div>; }

  if (!currentIdentity) {
      return <LoginScreen staffList={staffList} setStaffList={setStaffList} appPermissions={appPermissions} setCurrentIdentity={setCurrentIdentity} />;
  }

  const renderContent = () => {
      switch(activeTab) {
          case 'create_dispatch': return <FormDispatch initialData={currentOrder || DEFAULT_DISPATCH_DATA} onSave={(d, opts) => handleSave(d, 'dispatch', opts)} onConvertToMaintenance={handleConvertToMaintenance} onConvertToRepair={handleConvertToRepair} onConvertToConstruction={handleConvertToConstruction} onConvertToCapa={handleConvertToCapa} {...commonFormProps} />;
          case 'create_maintenance':
              let initMaintenance = currentOrder || { ...DEFAULT_MAINTENANCE_DATA }; if(!initMaintenance.replacedParts) initMaintenance.replacedParts = [];
              if(!initMaintenance.dismantledParts) initMaintenance.dismantledParts = [];
              if(!initMaintenance.checklist || initMaintenance.checklist.length === 0) { initMaintenance.checklist = checklistTemplate.map(item => ({ name: item, ok: false, ng: false })); }
              if(!initMaintenance.customerSignature) initMaintenance.customerSignature = ''; if(!initMaintenance.engineerSignature) initMaintenance.engineerSignature = ''; if(!initMaintenance.photoBefore) initMaintenance.photoBefore = ''; if(!initMaintenance.photoAfter) initMaintenance.photoAfter = '';
              return <UniversalWorkOrderForm type="maintenance" initialData={initMaintenance} onSave={(d, opts) => handleSave(d, 'maintenance', opts)} onConvertToCapa={handleConvertToCapa} {...commonFormProps} schedules={schedules} />;
          case 'create_repair':
              let initRepair = currentOrder || { ...DEFAULT_REPAIR_DATA }; if(!initRepair.replacedParts) initRepair.replacedParts = [];
              if(!initRepair.dismantledParts) initRepair.dismantledParts = [];
              if(!initRepair.customerSignature) initRepair.customerSignature = ''; if(!initRepair.engineerSignature) initRepair.engineerSignature = ''; if(!initRepair.photoBefore) initRepair.photoBefore = ''; if(!initRepair.photoAfter) initRepair.photoAfter = '';
              return <UniversalWorkOrderForm type="repair" initialData={initRepair} onSave={(d, opts) => handleSave(d, 'repair', opts)} onConvertToCapa={handleConvertToCapa} {...commonFormProps} />;
          case 'create_construction':
              let initConstruction = currentOrder || { ...DEFAULT_CONSTRUCTION_DATA }; if(!initConstruction.replacedParts) initConstruction.replacedParts = [];
              if(!initConstruction.dismantledParts) initConstruction.dismantledParts = [];
              if(!initConstruction.customerSignature) initConstruction.customerSignature = ''; if(!initConstruction.engineerSignature) initConstruction.engineerSignature = ''; if(!initConstruction.photoBefore) initConstruction.photoBefore = ''; if(!initConstruction.photoAfter) initConstruction.photoAfter = '';
              return <UniversalWorkOrderForm type="construction" initialData={initConstruction} onSave={(d, opts) => handleSave(d, 'construction', opts)} onConvertToCapa={handleConvertToCapa} {...commonFormProps} />;
          case 'create_capa':
              let initCapa = currentOrder || { ...DEFAULT_CAPA_DATA };
              if(!initCapa.customerSignature) initCapa.customerSignature = ''; if(!initCapa.engineerSignature) initCapa.engineerSignature = ''; if(!initCapa.photoBefore) initCapa.photoBefore = ''; if(!initCapa.photoAfter) initCapa.photoAfter = '';
              return <FormCapa initialData={initCapa} onSave={(d, opts) => handleSave(d, 'capa', opts)} {...commonFormProps} />;
          case 'schedule_manager': return <ScheduleManager schedules={schedules} setSchedules={setSchedules} onCancel={() => setActiveTab('dashboard')} customers={customers} stations={stations} equipment={equipment} staffList={staffNamesOnly} cycles={cycles} onCreateDispatch={handleCreateDispatchFromSchedule} />; 
          case 'statistics': return <StatisticsPanel orders={orders} onCancel={() => setActiveTab('dashboard')} />;
          case 'assets': return <AssetManager onCancel={() => setActiveTab('dashboard')} customers={customers} equipmentList={equipment} stations={stations} orders={orders} readOnly={currentIdentity?.type !== 'admin'} />;
          case 'staff_manager': return <StaffManager onCancel={() => setActiveTab('dashboard')} staffList={staffNamesOnly} orders={orders} />;
          case 'report_generator': return <ReportGenerator orders={myOrders} onCancel={() => setActiveTab('dashboard')} preSelectedOrderId={currentOrder?.id} />;
          case 'inventory': return <InventoryManager onCancel={() => setActiveTab('dashboard')} parts={parts} onUpdateParts={setParts} orders={orders} readOnly={currentIdentity?.type !== 'admin'} />;
          case 'settings': return <SettingsPanel customers={customers} setCustomers={setCustomers} stations={stations} setStations={setStations} equipment={equipment} setEquipment={setEquipment} specs={specs} setSpecs={setSpecs} serviceItems={serviceItems} setServiceItems={setServiceItems} parts={parts} setParts={setParts} staffList={staffList} setStaffList={setStaffList} cycles={cycles} setCycles={setCycles} checklistTemplate={checklistTemplate} setChecklistTemplate={setChecklistTemplate} orders={orders} importData={handleImportData} schedules={schedules} setSchedules={setSchedules} onCancel={() => setActiveTab('dashboard')} user={user} baseUrl={baseUrl} setBaseUrl={setBaseUrl} appPermissions={appPermissions} setAppPermissions={setAppPermissions} />; 
          case 'dashboard': default:
              return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-3 tracking-tight">
                            維運管理儀表板
                            {loadingCust && <span className="text-xs font-normal text-slate-400 flex items-center gap-1.5"><div className="w-4 h-4 rounded-full border-[3px] border-slate-200 border-t-blue-500 animate-spin"></div> 同步中</span>}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-sm">
                                <User size={16} className={currentIdentity?.type === 'admin' ? 'text-amber-500' : 'text-blue-500'} />
                                <span className="font-bold text-slate-700">{currentIdentity?.name}</span>
                                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{currentIdentity?.type === 'admin' ? '管理員' : '工程師'}</span>
                                <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-red-500 transition" title="登出切換身分"><LogOut size={16}/></button>
                            </div>
                            
                            <div className="hidden lg:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {canShowAssets && <button onClick={() => setActiveTab('assets')} className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 bg-blue-50/50 hover:bg-blue-100/50 rounded-2xl border border-blue-100 shadow-sm transition-all duration-200 font-bold text-sm"><Package size={18} /> 資產</button>}
                                {canShowInventory && <button onClick={() => setActiveTab('inventory')} className="text-amber-600 hover:text-amber-700 flex items-center gap-2 px-4 py-2 bg-amber-50/50 hover:bg-amber-100/50 rounded-2xl border border-amber-100 shadow-sm transition-all duration-200 font-bold text-sm"><Box size={18} /> 庫存</button>}
                                {currentIdentity?.type === 'admin' && <button onClick={() => setActiveTab('staff_manager')} className="text-purple-600 hover:text-purple-700 flex items-center gap-2 px-4 py-2 bg-purple-50/50 hover:bg-purple-100/50 rounded-2xl border border-purple-100 shadow-sm transition-all duration-200 font-bold text-sm"><Users size={18} /> 人員</button>}
                                {canShowStats && <button onClick={() => setActiveTab('statistics')} className="text-pink-600 hover:text-pink-700 flex items-center gap-2 px-4 py-2 bg-pink-50/50 hover:bg-pink-100/50 rounded-2xl border border-pink-100 shadow-sm transition-all duration-200 font-bold text-sm"><PieChart size={18} /> 統計</button>}
                                <button onClick={() => setActiveTab('report_generator')} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 px-4 py-2 bg-emerald-50/50 hover:bg-emerald-100/50 rounded-2xl border border-emerald-100 shadow-sm transition-all duration-200 font-bold text-sm"><FileOutput size={18} /> 報告</button>
                                {canShowSchedule && <button onClick={() => setActiveTab('schedule_manager')} className="relative text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 bg-blue-50/50 hover:bg-blue-100/50 rounded-2xl border border-blue-100 shadow-sm transition-all duration-200 font-bold text-sm"><CalendarClock size={18} /> 排程{dueSchedulesCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] w-6 h-6 flex items-center justify-center rounded-full animate-pulse border-[3px] border-white shadow-md font-bold">{dueSchedulesCount}</span>}</button>}
                                {currentIdentity?.type === 'admin' && <button onClick={() => setActiveTab('settings')} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 font-bold text-sm"><Settings size={18} /> 設定</button>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Mobile Login Info */}
                    <div className="md:hidden flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm mb-4">
                        <div className="flex items-center gap-2">
                            <User size={16} className={currentIdentity?.type === 'admin' ? 'text-amber-500' : 'text-blue-500'} />
                            <span className="font-bold text-slate-700">{currentIdentity?.name}</span>
                            <span className="text-xs text-slate-400">({currentIdentity?.type === 'admin' ? '管理員' : '工程師'})</span>
                        </div>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 flex items-center gap-1"><LogOut size={14}/> 登出</button>
                    </div>

                    {/* Construction Alerts Panel */}
                    {canShowSchedule && <ConstructionAlertPanel orders={dashboardOrders} onView={handleView} />}

                    <Card className="p-8 border-0 shadow-[0_8px_30px_-4px_rgba(37,99,235,0.1)] bg-gradient-to-br from-white to-blue-50/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>
                        <h3 className="font-extrabold text-xl text-slate-800 mb-6 flex items-center gap-3 relative z-10"><div className="p-2 bg-blue-100/80 border border-blue-200 text-blue-600 rounded-xl"><CopyPlus size={24} strokeWidth={2}/></div> <span className="tracking-wide">建立新工單</span></h3>
                        
                        {currentIdentity?.type === 'admin' ? (
                            <>
                                <div className="flex flex-col md:flex-row items-end gap-5 relative z-10">
                                    <div className="flex-1 w-full"><Label>請選擇工單類型</Label><Select value={createType} onChange={(e) => setCreateType(e.target.value)} options={['派工單', '保養單', '報修單', '施工單', '矯正預防單']} className="bg-white/80 backdrop-blur-sm shadow-sm" /></div>
                                    <div className="w-full md:w-auto"><button onClick={() => { setCurrentOrder(null); if (createType === '派工單') setActiveTab('create_dispatch'); if (createType === '保養單') setActiveTab('create_maintenance'); if (createType === '報修單') setActiveTab('create_repair'); if (createType === '施工單') setActiveTab('create_construction'); if (createType === '矯正預防單') setActiveTab('create_capa'); }} className="w-full bg-blue-600 text-white px-8 py-3.5 rounded-2xl hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all duration-200 font-bold text-base h-[52px]">開始填寫 <ArrowRightCircle size={20} strokeWidth={2.5} /></button></div>
                                </div>
                                <div className="mt-6 pt-5 border-t border-slate-200/50 relative z-10">
                                    {createType === '派工單' && <div className="text-sm text-slate-600 flex items-start gap-3 animate-in fade-in duration-300"><div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0"><ClipboardList size={18}/></div> <span className="pt-1"><strong>派工單 (Dispatch)：</strong>適用於一般任務指派、初始問題通報，或尚未確定具體維修內容的工作分發。</span></div>}
                                    {createType === '保養單' && <div className="text-sm text-slate-600 flex items-start gap-3 animate-in fade-in duration-300"><div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><Activity size={18}/></div> <span className="pt-1"><strong>保養單 (Maintenance)：</strong>適用於例行性巡檢、設備定期保養、電壓電流數值量測與紀錄。</span></div>}
                                    {createType === '報修單' && <div className="text-sm text-slate-600 flex items-start gap-3 animate-in fade-in duration-300"><div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0"><Hammer size={18}/></div> <span className="pt-1"><strong>報修單 (Repair)：</strong>適用於設備故障排除、突發性維修、零件更換與測試紀錄。</span></div>}
                                    {createType === '施工單' && <div className="text-sm text-slate-600 flex items-start gap-3 animate-in fade-in duration-300"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shrink-0"><PlayCircle size={18}/></div> <span className="pt-1"><strong>施工單 (Construction)：</strong>適用於專案工程施作、設備安裝汰換、大型整修工程。</span></div>}
                                    {createType === '矯正預防單' && <div className="text-sm text-slate-600 flex items-start gap-3 animate-in fade-in duration-300"><div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg shrink-0"><Target size={18}/></div> <span className="pt-1"><strong>矯正與預防單 (CAPA)：</strong>適用於嚴重異常發生後，進行根本原因分析、擬定矯正與預防措施的專屬紀錄。</span></div>}
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                <button onClick={() => { setCurrentOrder(null); setActiveTab('create_maintenance'); }} className="flex flex-col items-center text-center justify-start gap-2 p-5 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] transition-all group h-full">
                                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform mb-1"><Activity size={32} /></div>
                                    <span className="font-bold text-slate-700 text-lg">保養單</span>
                                    <span className="text-xs text-slate-500 leading-relaxed px-1">例行性巡檢、設備定期保養、電壓電流數值量測</span>
                                </button>
                                <button onClick={() => { setCurrentOrder(null); setActiveTab('create_repair'); }} className="flex flex-col items-center text-center justify-start gap-2 p-5 bg-white border border-amber-100 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-300 hover:bg-amber-50 active:scale-[0.98] transition-all group h-full">
                                    <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform mb-1"><Hammer size={32} /></div>
                                    <span className="font-bold text-slate-700 text-lg">報修單</span>
                                    <span className="text-xs text-slate-500 leading-relaxed px-1">設備故障排除、突發性維修、零件更換與測試</span>
                                </button>
                                <button onClick={() => { setCurrentOrder(null); setActiveTab('create_construction'); }} className="flex flex-col items-center text-center justify-start gap-2 p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all group h-full">
                                    <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform mb-1"><PlayCircle size={32} /></div>
                                    <span className="font-bold text-slate-700 text-lg">施工單</span>
                                    <span className="text-xs text-slate-500 leading-relaxed px-1">專案工程施作、設備安裝汰換、大型整修工程</span>
                                </button>
                                <button onClick={() => { setCurrentOrder(null); setActiveTab('create_capa'); }} className="flex flex-col items-center text-center justify-start gap-2 p-5 bg-white border border-purple-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 hover:bg-purple-50 active:scale-[0.98] transition-all group h-full">
                                    <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform mb-1"><Target size={32} /></div>
                                    <span className="font-bold text-slate-700 text-lg">CAPA</span>
                                    <span className="text-xs text-slate-500 leading-relaxed px-1">嚴重異常根本原因分析、擬定矯正與預防措施</span>
                                </button>
                            </div>
                        )}
                    </Card>
                    <Card className="p-0 overflow-hidden shadow-lg shadow-slate-200/40 border-0">
                        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white gap-4"><div className="flex items-center gap-4 w-full md:w-auto"><h2 className="font-bold text-slate-700 whitespace-nowrap">工單列表</h2><div className="flex items-center gap-2 w-full md:w-auto"><div className="relative flex-1 md:w-40"><Filter className="absolute left-3 top-3 text-slate-400" size={14} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border-slate-200 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none appearance-none transition"><option value="">所有狀態</option>{STATUS_OPTIONS.map(status => (<option key={status} value={status}>{status}</option>))}</select></div>{(statusFilter || searchTerm) && (<button onClick={() => { setStatusFilter(''); setSearchTerm(''); }} className="text-slate-400 hover:text-red-500 p-2 bg-slate-50 rounded-full hover:bg-red-50 transition" title="清除所有篩選"><X size={16} /></button>)}</div></div><div className="flex items-center gap-3 w-full md:w-auto justify-end"><div className="relative w-full md:w-auto"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋單號、客戶..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm w-full md:w-56 focus:ring-2 focus:ring-blue-200 outline-none transition" /></div><div className="flex bg-slate-100 rounded-xl p-1 shrink-0"><button onClick={() => setDashboardViewMode('split')} className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium ${dashboardViewMode === 'split' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="綜覽模式"><Layout size={16} /></button><button onClick={() => setDashboardViewMode('list')} className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium ${dashboardViewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="列表檢視"><List size={16} /></button><button onClick={() => setDashboardViewMode('calendar')} className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium ${dashboardViewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="行事曆檢視"><CalendarIcon size={16} /></button></div></div></div>
                        {dashboardViewMode === 'split' && (<div className="p-4 bg-slate-50/50"><WeeklyScheduler orders={dashboardOrders} onView={handleView} /><div className="mt-4 border-t border-slate-200 pt-6"><div className="flex justify-between items-center mb-4 px-1"><h4 className="font-bold text-slate-700 flex items-center gap-2"><List size={18} className="text-slate-500"/> 最近更新紀錄</h4><span className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full shadow-sm">顯示 {Math.min(10, dashboardOrders.length)} / {dashboardOrders.length} 筆</span></div><OrderTable orders={dashboardOrders.slice(0, 10)} onView={handleView} onDelete={handleDelete} allowDelete={currentIdentity?.type === 'admin' && appPermissions.allowDelete} onProcessDismantled={currentIdentity?.type === 'admin' ? setDismantledModalOrder : null} />{dashboardOrders.length > 10 && <div className="text-center mt-4"><button onClick={() => setDashboardViewMode('list')} className="text-sm font-medium text-blue-600 hover:text-blue-800 px-4 py-2 hover:bg-blue-50 rounded-lg transition">查看更多...</button></div>}</div></div>)}
                        {dashboardViewMode === 'list' && (<div className="bg-slate-50/50"><OrderTable orders={dashboardOrders} onView={handleView} onDelete={handleDelete} allowDelete={currentIdentity?.type === 'admin' && appPermissions.allowDelete} onProcessDismantled={currentIdentity?.type === 'admin' ? setDismantledModalOrder : null} /></div>)}
                        {dashboardViewMode === 'calendar' && (<div className="p-4 bg-slate-50/50"><WorkCalendar orders={dashboardOrders} onView={handleView} /></div>)}
                    </Card>
                </div>
              );
      }
  };

  return (<><ConfirmDialog /><MessageModal /><ScheduleDispatchModal /><div className="min-h-screen bg-slate-50/50 p-4 pb-32 md:p-8 font-sans text-slate-700 selection:bg-blue-100 selection:text-blue-900">{renderContent()}</div>{renderModals()}<BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onFabPress={() => setShowPendingModal(true)} onFabLongPress={() => setShowCreateModal(true)} badgeCount={dueSchedulesCount} currentIdentity={currentIdentity} appPermissions={appPermissions} /></>);
}