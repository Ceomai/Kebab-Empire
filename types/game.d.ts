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
  tickets: any[];
  tables: any[];
  /** günün sayaçları: arrivals, served, lost, revenue, tips, satSum, byProduct… */
  stats: Record<string, any>;
  /** sahneye giden görsel olaylar */
  fx: any[];
  /** oyuncunun tezgâh durumu (KE.playerStation) */
  player: { active: boolean; slots: any[]; sel: number; combo: number; [k: string]: any };
  done: boolean;
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
  ledger: { days: any[]; months: any[]; archive?: { days: number; revenue: number; served: number; tips: number; byProduct: Record<string, number> } };
  /** ay içi ek giderler: ads, capex, fines, other, farm */
  monthExtras: Record<string, number>;
  /** 'morning' | 'service' | 'closing' */
  phase: string;
  rival: { power: number; district: string | null; stage?: number; [k: string]: any };
  flags: Record<string, any>;
  /** besi çiftliği (KE.buyFarm) ya da null */
  farm: any;
  /** servis sırasında şube kimliği → canlı durum; kayıtta null */
  live?: Record<string, Live> | null;
  era: number;
  gen: number;
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
