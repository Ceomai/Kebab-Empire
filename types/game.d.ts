/* Oyun durumu tipleri — yalnızca belgeleme ve editör yardımı için (JSDoc'ta {Game}, {Branch}, {Staff}, {Live}, {Loan}).
   Alanların hepsi listelenmedi; her tip ek alanlara açıktır ([k: string]: any), bu yüzden tsc sıkı denetim yapmaz.
   Tanımlar KE.newGame / KE.openBranch / KE.startService'in ürettiği nesnelerden çıkarıldı. */

/** Kredi: KE.takeLoan ile açılır, ay sonunda (KE.closeMonth) taksiti düşer; remaining 0 olunca listeden çıkar */
interface Loan {
  /** çekilen ana para (₺) */
  amount: number;
  /** aylık taksit (₺) */
  monthly: number;
  /** kalan taksit sayısı */
  remaining: number;
}

/** Çalışan (usta, çırak, kasiyer, garson…) */
interface Staff {
  id: string;
  name: string;
  /** 'usta' | 'cirak' | 'kasiyer' | 'garson' | … (KE.POSITIONS anahtarları) */
  role: string;
  /** çalıştığı şubenin kimliği */
  branchId: string;
  /** ürün kimliği → ustalık (0–5) */
  spec: Record<string, number>;
  speed: number;
  quality: number;
  consistency: number;
  /** aylık brüt ücret (₺) */
  wage: number;
  /** 0–100 */
  morale: number;
  /** 0–100 */
  energy: number;
  /** yıl içinde biriken gelir vergisi matrahı (KE.payroll commit eder) */
  cumBase: number;
  /** bu ay aldığı bahşiş (ay sonunda sıfırlanır) */
  tipsMonth: number;
  /** bugün hizmet ettiği müşteri (bahşiş 'performans' kuralı) */
  servedToday: number;
  hiredDay: number;
  /** servis sırasındaki iş (kayıtta her zaman null) */
  task: any;
  [k: string]: any;
}

/** Şube */
interface Branch {
  id: string;
  /** KE.DISTRICTS kimliği */
  district: string;
  name: string;
  /** dükkân kademesi (KE.TIERS dizini) */
  tier: number;
  /** ekipman anahtarı → seviye (cook, cold, prep, service…) */
  equipment: Record<string, number>;
  /** satın alınmış dekor kimlikleri */
  decor: string[];
  /** ürün kimliği → satış fiyatı */
  prices: Record<string, number>;
  /** ürün kimliği → menüde mi */
  menu: Record<string, boolean>;
  /** malzeme → depodaki miktar */
  stock: Record<string, number>;
  /** malzeme → ortalama günlük kullanım */
  usage: Record<string, number>;
  stockLevel: number;
  /** 0–100 */
  cleanliness: number;
  /** aylık kira (₺) */
  rent: number;
  openedDay: number;
  history: any[];
  [k: string]: any;
}

/** Bir şubenin servis sırasındaki canlı durumu (G.live[branchId]); kayda yazılmaz */
interface Live {
  branchId: string;
  /** servis saatinin dakikası (açılıştan beri) */
  minute: number;
  custs: Record<string, any>;
  queue: any[];
  tickets: Ticket[];
  tables: any[];
  /** günün sayaçları: arrivals, served, lost, revenue, tips, satSum, byProduct… */
  stats: Record<string, any>;
  /** sahneye giden görsel olaylar */
  fx: any[];
  /** oyuncunun tezgâh durumu (KE.playerStation) */
  player: PlayerState;
  done: boolean;
  [k: string]: any;
}

/** Mutfak fişi (L.tickets): bir müşterinin bir ürün siparişi */
interface Ticket {
  id: number;
  /** ürün kimliği */
  pid: string;
  count: number;
  /** 'wait' | 'cook' | 'ready' | … */
  state: string;
  /** pişiren çalışanın kimliği ya da 'player' */
  cook?: any;
  menu?: boolean;
  rush?: boolean;
  paket?: boolean;
  [k: string]: any;
}

/** Servisteki müşteri (L.custs): tip, sipariş, masa, sabır… */
type Customer = Record<string, any>;

/** Çalışanın servis sırasındaki işi (s.task) */
interface StaffTask {
  type: string;
  ref: any;
  remain: number;
  total: number;
}

/** Oyuncunun tezgâhta tuttuğu fiş (L.player.slots) */
interface PlayerSlot {
  /** fiş kimliği */
  tid: number | null;
  /** sıradaki tarif adımı */
  step: number;
  errors: number;
  start: number;
  burnt: number;
  /** süreli istasyon ('ates' | 'fritoz'); boşsa null */
  fst?: string | null;
  [k: string]: any;
}

/** Oyuncunun tezgâh durumu (KE.playerStation) */
interface PlayerState {
  active: boolean;
  slots: PlayerSlot[];
  sel: number;
  combo: number;
  [k: string]: any;
}

/** Bütün oyun durumu (kodda G); KE.newGame üretir, KE.SAVE yazar/okur */
interface Game {
  /** kayıt şeması sürümü */
  v: number;
  /** tohumlu rastgelelik kökü */
  seed: number;
  /** yeniden oynatma için oyuncu eylemleri */
  actionLog: any[];
  saveId: string;
  /** 'doner' | 'kebap' */
  mode: string;
  owner: string;
  shopName: string;
  /** oyun günü (1 = başlangıç) */
  day: number;
  cash: number;
  /** 0–100 */
  reputation: number;
  /** enflasyon çarpanı (ay sonunda artar) */
  priceIndex: number;
  staff: Staff[];
  branches: Branch[];
  activeBranch: string;
  loans: Loan[];
  /** 'esit' | 'usta' | 'performans' | 'kasa' (KE.TIP_RULES) */
  tipRule: string;
  /** gün satırları (days), ay raporları (months), sıkıştırılmış eski günler (archive) */
  ledger: {
    days: any[];
    months: any[];
    archive?: { days: number; revenue: number; served: number; tips: number; byProduct: Record<string, number> };
  };
  /** ay içi ek giderler: ads, capex, fines, other, farm */
  monthExtras: Record<string, number>;
  /** 'morning' | 'service' | 'closing' */
  phase: string;
  rival: { power: number; district: string | null; stage?: number; [k: string]: any };
  flags: Record<string, any>;
  /** besi çiftliği (KE.buyFarm) ya da null */
  farm: FarmState | null;
  /** servis sırasında şube kimliği → canlı durum; kayıtta null */
  live?: Record<string, Live> | null;
  era: number;
  gen: number;
  /** sıradaki kimlik sayacı (çalışan, şube) */
  nextId: number;
  /** süreli etkiler: kampanya, olay, zam… (key: 'traffic' | 'ing' | 'type:…' …) */
  mods: Mod[];
  /** müdavim kimliği → gönül durumu */
  regulars: Record<string, RegularState>;
  /** usta pazarı ve eleman bürosu adayları */
  market: Staff[];
  workers: Staff[];
  journal: any[];
  news: any[];
  goals: Record<string, any>;
  eventLog: string[];
  pendingEvent: any;
  payLate: boolean;
  centralKitchen: boolean;
  lastSummary: any;
  weekly: any;
  stories: Record<string, any>;
  /** imza tarif (yoksa null/undefined) */
  signature?: { pid: string; level: number; family?: boolean; [k: string]: any } | null;
  /** servis hamleleri günlüğü (KE.act) */
  dayLog?: { m: number; a: string; x: any[] }[];
  /** bugünkü müdavim ziyaretleri */
  regularVisits?: any[];
  /** öğle olayı */
  mid?: any;
  charity?: Record<string, number>;
  stars?: number;
  [k: string]: any;
}

/** Besi çiftliği (G.farm) */
interface FarmState {
  /** hayvan türü → ağıl */
  pens: Record<string, Pen>;
  /** malzeme → çiftlik deposundaki et (kg) */
  store: Record<string, number>;
  [k: string]: any;
}
/** Ağıl: seviye ve yetişmekte olan partiler */
interface Pen {
  level: number;
  batches: { count: number; age: number; [k: string]: any }[];
}

/** Bir şubenin gün sayaçları (L.stats): arrivals, served, lost…, revenue, tips, byProduct, stockouts… */
type DayStats = Record<string, any>;

/** Gün özeti (KE.finishService → G.lastSummary) */
interface DaySummary {
  day: number;
  branches: Record<string, { name: string; stats: DayStats; sat: number; [k: string]: any }>;
  [k: string]: any;
}

/** Gün kapanışının sonucu (KE.finalizeDay): arayüzün kapanış ekranı bunu gösterir */
interface DayResult {
  levelUps: any[];
  quits: any[];
  branches: Record<string, any>;
  [k: string]: any;
}

/** Süreli etki (G.mods): KE.modVal anahtarın çarpanlarını çarpar */
interface Mod {
  key: string;
  mult: number;
  days: number;
  label?: string;
  [k: string]: any;
}

/** Müdavimin gönül durumu (G.regulars) */
interface RegularState {
  loyalty: number;
  visits: number;
  [k: string]: any;
}

/** Bankanın kredi teklifi (KE.loanOffer / KE.loanOffers) */
interface LoanOffer {
  amount: number;
  months: number;
  /** aylık faiz */
  rate: number;
  monthly: number;
  total: number;
}

/** Sabah eylemlerinin (KE.hireMaster, KE.buyDecor, KE.takeLoan…) sonucu: arayüz msg'yi bildirir, ok değilse hiçbir şey değişmemiştir */
interface ActionResult {
  ok: boolean;
  /** oyuncuya gösterilecek ileti (yoksa sessiz başarısızlık) */
  msg?: string;
  /** harcanan tutar (₺) */
  cost?: number;
  [k: string]: any;
}
