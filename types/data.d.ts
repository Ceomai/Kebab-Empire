/* Oyun verisi tabloları (js/data.js ve motor dosyalarındaki sabit tablolar) — KE ad alanında kullanılır (types/ke.d.ts). */

/** anahtar → sayı tablosu (malzeme miktarları, ürün porsiyonları…) */
type NumMap = Record<string, number>;

/** Semt (KE.DISTRICTS) */
interface District {
  id: string;
  name: string;
  side: string;
  inspired: string;
  /** aylık kira (₺, 1. gün fiyatıyla) */
  rent: number;
  traffic: number;
  rivals: number;
  /** müşteri tipi → ağırlık */
  mix: Record<string, number>;
  desc: string;
  x: number;
  y: number;
}

/** Müşteri tipi (KE.CUSTOMER_TYPES) */
interface CustomerType {
  name: string;
  takeaway: number;
  eat: number;
  patience: number;
  priceSens: number;
  tip: number;
  /** saat → yoğunluk çarpanı */
  hours: Record<string, number>;
  weekend?: number;
  /** grup büyüklüğü [en az, en çok] */
  group?: [number, number] | number[];
}

/** Yöre kıyafeti (KE.REGIONS) */
interface Region { outfit: string; color: string; accent: string; head: string; note: string }

/** Kostüm (KE.COSTUMES) */
interface Costume { id: string; name: string; cost: number; morale: number; concept: number; desc: string }

/** Dekor öğesi (KE.DECOR) */
interface DecorItem { id: string; name: string; style: string; cost: number; ambience: number; desc: string; seats?: number; morale?: number }

/** Reklam kampanyası (KE.CAMPAIGNS) */
interface Campaign {
  id: string; name: string; cost: number; days: number; icon: string; desc: string;
  /** [değişken anahtarı, çarpan] çiftleri */
  mods?: [string, number][];
  mode?: string; rep?: boolean; sign?: boolean; [k: string]: any;
}

/** Malzeme (ModeData.ingredients) */
interface Ingredient { name: string; unit: string; price: number }

/** İçecek: ürünün sade hâli */
interface Drink { id: string; name: string; base: number; ing: Record<string, number> }

/** Menü ürünü */
interface Product extends Drink {
  prep: number;
  steps: string[];
  requiresSpec?: boolean;
  /** tarif kilidi (görevle açılır) */
  unlock?: number;
}

/** Ekipman seviyesi; alanlar ekipman türüne göre değişir */
interface EquipLevel { name: string; cost: number; stations?: number; speed?: number; quality?: number; waste?: number; patience?: number; queue?: number; tables?: number }
interface EquipGroup<L extends EquipLevel = EquipLevel> { name: string; levels: L[] }
interface ModeEquipment {
  cook: EquipGroup<EquipLevel & { stations: number }>;
  prep: EquipGroup<EquipLevel & { speed: number }>;
  cold: EquipGroup<EquipLevel & { waste: number }>;
  service: EquipGroup<EquipLevel & { patience: number; queue: number; tables: number }>;
}
type EquipKey = keyof ModeEquipment;

/** Oyun modu verisi (KE.MODES.doner / KE.MODES.kebap) */
interface ModeData {
  id: string; name: string; icon: string; tagline: string;
  trafficMul: number; drinkRate: number; cookRole: string;
  ingredients: Record<string, Ingredient>;
  products: Product[];
  drink: Drink;
  /** müşteri tipi → sevdiği ürün kimlikleri */
  favorites: Record<string, string[]>;
  equipment: ModeEquipment;
}

/** Müdavim (KE.REGULARS) */
interface Regular { id: string; name: string; type: string; fav: Record<string, string>; cast?: string; look?: any; says: string[]; [k: string]: any }

/** Özel gün (KE.SPECIAL; KE.specialDay id ekler) */
interface SpecialDay { id?: string; name: string; desc: string; hours: Record<string, number>; types: Record<string, number>; tip?: number; theme: string | null }

/** Besi hayvanı türü (KE.FARM) */
interface FarmKind {
  name: string; unit: string; young: number; feed: number; days: number; batch: number;
  caps: number[]; upCost: number[];
  /** mod → malzeme → baş başına kg */
  yield: Record<string, Record<string, number>>;
  modes?: string[]; desc: string;
}

/** Usta şablonu (KE.MASTER_TEMPLATES) — KE.makeStaff seçenekleri */
interface MasterTemplate { name: string; region?: string; gender?: string; age?: string; role?: string; spec?: Record<string, number>; speed?: number; quality?: number; consistency?: number; waste?: number; teach?: number; trait?: string | null; [k: string]: any }

/** Usta özelliği (KE.TRAITS) */
interface Trait { name: string; desc: string; quality?: number; speed?: number; tip?: number; moraleStable?: number; teachBonus?: number; grumpy?: boolean; xp?: number }

/** Rol (KE.ROLES) */
interface Role { name: string; cooks?: boolean; baseWage?: number; desc?: string }

/** Hikâye hedefi (KE.GOALS) */
interface Goal { id: string; name: string; desc: string; reward: number; final?: boolean }

/** Dönem (KE.ERAS) */
interface Era { n: number; name: string; story: string; req: { id: string; label: string; mode?: string }[] }

/** Vakıf/sponsorluk (KE.CHARITY) */
interface Charity { id: string; name: string; icon: string; cost: number[]; desc: string }

/** Toplu sipariş türü (KE.CONTRACT_KINDS) */
interface ContractKind { id: string; name: string; who: string; qty: number[]; morale: number }

/** Tezgâh istasyonu (KE.STATIONS) */
interface Station { id: string; name: string; ic: string; key: string }

/** Dükkân kademesi (KE.TIERS) */
interface Tier { name: string; mul: number; quality: number; desc: string }

/** Kadro grubu (KE.STAFF_GROUPS) */
interface StaffGroup { name: string; roles: string[]; up: EquipKey | null }

/** Karakter görünüşü (KE.randomLook, KE.portrait) */
interface Look { gender?: string; age?: string; skin?: string; hairColor?: string; hair?: string; [k: string]: any }

/** Sabit hikâye karakteri (KE.CAST) */
interface CastMember { name: string; role: string; look: Look }

/** Öğle olayı (KE.MIDS) */
interface MidEvent {
  id: string; def: number; mgr: number; ic: string; title: string;
  cond?: (G: Game, b: Branch) => boolean;
  /** M: G.mid (olayın canlı durumu) */
  text: (G: Game, b: Branch, M?: any) => string;
  choices: (G: Game, b?: Branch) => { label: string; desc: string; [k: string]: any }[];
  [k: string]: any;
}

/** Olay kartı seçeneği: run seçimi uygular, oyuncuya gösterilecek metni döndürür; c: kartın ctx'i */
interface EventChoice { label: string; desc: string; run: (G: Game, c: any) => string | void; [k: string]: any }
/** Olay kartı (GameEvent.build) */
interface EventCard { title: string; text: string; ctx?: any; who?: Staff | null; choices: EventChoice[]; [k: string]: any }
/** Sabah olayı (KE.EVENTS) — narrative.js'te tanımlanır */
interface GameEvent {
  id: string;
  /** konuşan karakter (KE.CAST anahtarı) */
  who: string | null;
  /** seçilme ağırlığı */
  w: number | ((G: Game) => number);
  when?: (G: Game) => boolean;
  build: (G: Game) => EventCard;
  mode?: string; arc?: boolean;
  /** müdavim hikâyesi: müdavim kimliği ve adım */
  story?: string; step?: number;
  [k: string]: any;
}

/** Bahşiş kuralı (KE.TIP_RULES) */
interface TipRule { name: string; desc: string }

/** Pişme süresi (KE.TIMED, KE.fireTimes) */
interface FireTimes { cook: number; grace: number }
