/* KE ad alanının tipi. Bütün oyun dosyaları window.KE'yi sırayla doldurur (src/main.js); burada her dosyanın
   KE'ye koyduğu üyeler listelidir. Listede olmayan bir üyeye yazmak ya da okumak (KE.payofCost gibi bir yazım
   hatası, kaldırılmış bir işlevi çağırmak) tip hatasıdır. Yeni bir KE üyesi eklerken buraya da ekle.
   Motor işlevlerinin parametre tipleri buradan gelir: KE.x = (G, b) => … yazınca G ve b tiplenmiş olur.
   Arayüz ad alanı (KE.UI) bilerek gevşektir: üyeleri listelidir, parametreleri any.
   Üye listesi ilk kez bir betikle (acorn ile bütün KE.X = … atamaları) çıkarıldı. */

/** Sabah eylemi gibi ok/msg döndüren doğrulama sonucu (js/verify.js) */
interface VerifyResult { ok: boolean; note?: string; [k: string]: any }

/** İmparatorluk şartı (KE.empireStatus); ok ve p hesaplanınca eklenir */
interface EmpireReq { id: string; label: string; have: number; need: number; money?: boolean; ok?: boolean; p?: number }

/** Kayıt zarfı (KE.SAVE.envelope) */
interface SaveEnvelope { v: number; app: string; savedAt: string; day: number; tab: string; sum: string; game: string | Game; [k: string]: any }

/** Bordro satırı (KE.payroll) */
interface Payslip {
  id: string; name: string; role: string; base: number; fm: number; brut: number; sgkI: number; issI: number; matrah: number; gv: number;
  damga: number; net: number; sgkV: number; issV: number; yol: number; ikramiye: number; total: number; [k: string]: any;
}

interface KE_U {
  clamp: (v: number, a: number, b: number) => number;
  rnd: (a: number, b: number) => number;
  pick: <T>(a: T[]) => T;
  mode: (G: Game) => ModeData;
  prod: (G: Game, pid: string) => Product | undefined;
}

interface KE_RNG {
  seed: (G: Game, tag: string) => void;
  raw: (n: number) => void;
}

/** Bir yılın bayram ve tatil tablosu (KE.CAL.year); tarih anahtarı 'YYYY-AA-GG' */
interface CalYear {
  holidays: Record<string, string>;
  religious: Record<string, string>;
  ramazans: { start: string; end: string }[];
  /** o yılın ramazanı */
  ramazan?: { start: string; end: string } | null;
}

interface KE_CAL {
  hijriToUtc: (y: number, m: number, d: number) => number;
  utcToHijri: (ms: number) => { y: number; m: number; d: number };
  hijriToJd: (y: number, m: number, d: number) => number;
  OVERRIDES: Record<string, any>;
  monthStart: (hy: number, hm: number) => number;
  year: (gy: number) => CalYear;
  holidayOn: (t: number) => string | null;
  religiousOn: (t: number) => string | null;
  ramazanOn: (t: number) => any;
  bonusMonth: (key: string) => any;
  LAT: number; LON: number; TZ: number;
  sunsetMinute: (t: number) => number;
  ECON_YEARS: Record<number, { asgariBrut: number; gvDilim: [number, number][] }>;
  ECON_GROWTH: number;
  econYear: (y: number) => { asgariBrut: number; gvDilim: [number, number][] };
  applyYear: (y: number) => void;
}

interface KE_ECON {
  asgariBrut: number; sgkIsci: number; issizlikIsci: number; sgkIsveren: number; issizlikIsveren: number; hazineTesvik: number; damga: number;
  /** [üst sınır, oran] dilimleri */
  gvDilim: [number, number][];
  kdvRestoran: number; kdvGida: number; kiraStopaj: number; muhasebeci: number; aylikEnflasyon: number;
  yemekYardimiGunluk: number; yolYardimiAylik: number; bayramIkramiye: number; fazlaMesaiOrani: number; sarfOrani: number;
  /** calendar.js'in uyguladığı yıl */
  year?: number;
}

interface KE_SAVE {
  KEY: string; BACKUP: string; RACE_KEY: string; TAB: string; VERSION: number; APP: string;
  hash: (str: string) => string;
  migrate: (g: any, from: number) => Game;
  normalize: (g: any) => Game;
  valid: (g: any) => boolean;
  envelope: (G: Game) => SaveEnvelope;
  open: (data: any) => Game;
  lastError: string | null;
  allowRewind: boolean;
  write: (G: Game) => boolean;
  read: () => { game: Game; from: string; warning?: string | null } | null;
  readRace: () => Game | null;
  clearRace: () => void;
  exists: () => boolean;
  clear: () => void;
  exportFile: (G: Game) => void;
  importFile: () => Promise<Game>;
}

interface KE_I18N {
  lang: string;
  dict: Record<string, string>;
  langs: { tr: string; en: string; de: string; [k: string]: string };
  collect: any;
  refreshEntities: () => void;
  normalize: (text: string) => { key: string; parts: any[] };
  t: (text: string, ctx?: any) => string;
  srcOf: (n: Node) => string | null;
  register: (lang: string, dict: Record<string, string>) => void;
  set: (lang: string) => Promise<void>;
  preferred: () => string;
}

interface KE_BRAND {
  id: string; gameName: string; nameParts: string[]; rival: string;
  isDefault: boolean;
  /** [varsayılan ad, marka adı, ekleriyle eşleyen düzenli ifade] */
  swaps: [string, string, RegExp?][];
  swap: (s: string) => string;
  text: (v: any) => any;
  hasOrderLabel: boolean;
  branchName: (districtName: string, fallback: string) => string;
  applyColors: () => void;
  promoFor: (G: Game, goalsDone: number, goalsTotal: number) => any;
  /** brands/<id>.json alanları (renkler, logo, ürün adları…) derlemede gelir */
  [k: string]: any;
}

interface KE_CONFIG {
  applied: any;
  version: number;
  message?: string;
  apply: (c: any) => boolean;
  load: () => Promise<any>;
}

interface KE_SND {
  on: boolean;
  wanted: boolean;
  play: (name: string) => void;
  set: (on: boolean) => boolean;
  toggle: () => boolean;
  unlock: () => void;
}

interface KE_ART {
  dish: (pid: string, cls?: string) => string;
  doner: (kind: string) => string;
  mangal: (n: number) => string;
  smoke: () => string;
  table: (dirty: any, mode?: string) => string;
  register: () => string;
  door: () => string;
  lamp: () => string;
  plant: () => string;
  decor: (did: string) => string;
  animal: (kind: string, opts?: any) => string;
  barn: () => string;
  truck: (label?: string) => string;
  fence: (w: number) => string;
  icon: (name: string, cls?: string) => string;
  logo: () => string;
  storefront: (name: string, color?: string, open?: any) => string;
}

interface KE_MAP {
  POS: Record<string, { x: number; y: number }>;
  PLACES: { id: string; name: string; x: number; y: number; color: string; icon: string; group: string }[];
  place: (id: string) => KE_MAP['PLACES'][number] | undefined;
  routePath: (from: any, to: any) => string;
  render: (opts?: any) => string;
  mount: (frame: any, opts?: any) => void;
  update: (frame: any, opts?: any) => any;
  overlay: (opts?: any) => string;
}

interface KE_SCENE {
  isPortrait: () => boolean;
  tablePos: (n: number) => any[];
  html: (G: Game, b: Branch) => string;
  reset: () => void;
  update: (G: Game, b: Branch, L: Live) => void;
  ownerLook: (G: Game) => Look;
}

interface KE_CLOUD {
  enabled: boolean;
  ready: boolean;
  initFailed: boolean;
  appVersion: string;
  user: any;
  lastError: any;
  consent: () => any;
  needsConsent: () => boolean;
  init: () => Promise<void>;
  connectionFailed: () => boolean;
  retry: () => Promise<any>;
  setConsent: (c: any) => Promise<any>;
  queueSave: (env: any) => void;
  flushSave: () => Promise<boolean>;
  loadSave: () => Promise<any>;
  submitDay: (p: any) => Promise<any>;
  leaderboard: (month: string, mode?: string) => Promise<any>;
  raceBoard: (week: string) => Promise<any>;
  champions: (month: string) => Promise<any>;
  track: (name: string, props?: any) => void;
  flushEvents: () => Promise<void>;
  reportError: (message: any, stack?: any, context?: any) => Promise<void>;
  fetchConfig: () => Promise<any>;
  linkEmail: (email: string) => Promise<void>;
  deleteMyData: () => Promise<void>;
}

/** Arayüz ad alanı (js/ui/*.js): bilerek gevşek, üyeler listelidir. A (eylemler), H (ortak parçalar), C, SCREENS dinamik tablolardır. */
interface KE_UI {
  H: any; SCREENS: Record<string, any>; A: Record<string, any>; C: Record<string, any>;
  screen: string; params: any; ng: any;
  TUT: any[];
  // durum alanları
  quickDayRun: boolean; crewHover: number; holdEvent: boolean; weekRunning: boolean; cloudChecked: boolean; mapZoom: number; mapIdle: boolean;
  saveDirty: boolean; staleTab: boolean; quotaWarned: boolean; pausedByHide: boolean; timer: any; dailyDone: number; reduceMotionMQ: MediaQueryList | null;
  // işlevler (parametreler any)
  guideLevel: (...a: any[]) => any; snapUndo: (...a: any[]) => any; undoChip: (...a: any[]) => any; hall: (...a: any[]) => any; hallAdd: (...a: any[]) => any;
  fillRaceBoard: (...a: any[]) => any; raceCheck: (...a: any[]) => any; empireEnding: (...a: any[]) => any; applyA11y: (...a: any[]) => any; checkCloud: (...a: any[]) => any;
  boot: (...a: any[]) => any; advice: (...a: any[]) => any; adviceCard: (...a: any[]) => any; cityTasks: (...a: any[]) => any; sheetState: (...a: any[]) => any;
  mapLabels: (...a: any[]) => any; mapZoomInit: (...a: any[]) => any; mapRefresh: (...a: any[]) => any; mapMount: (...a: any[]) => any;
  patch: (...a: any[]) => any; isNative: (...a: any[]) => any; calm: (...a: any[]) => any; syncSvgMotion: (...a: any[]) => any; transition: (...a: any[]) => any; hapticOn: (...a: any[]) => any;
  saveSoon: (...a: any[]) => any; flushSave: (...a: any[]) => any; save: (...a: any[]) => any; load: (...a: any[]) => any; hasSave: (...a: any[]) => any; tutor: (...a: any[]) => any;
  toast: (...a: any[]) => any; modal: (...a: any[]) => any; dismissModal: (...a: any[]) => any; closeModal: (...a: any[]) => any; picker: (...a: any[]) => any; go: (...a: any[]) => any;
  handleBack: (...a: any[]) => any; render: (...a: any[]) => any; layoutVars: (...a: any[]) => any; refreshBars: (...a: any[]) => any; courierHtml: (...a: any[]) => any;
  fillRanking: (...a: any[]) => any; privacyModal: (...a: any[]) => any; startLoop: (...a: any[]) => any; stopLoop: (...a: any[]) => any; sceneTick: (...a: any[]) => any;
  confetti: (...a: any[]) => any; tzSync: (...a: any[]) => any;
  // arayüz durumu (eylemlerin yazdığı geçici alanlar)
  a11y: any; closeTab: string | null; crewPick: string | null; guideFrom: string | null; heir: any; heroCast: any; lastMin: number; lastMinB: string;
  lastTracked: any; mapRoute: string; morningEnv: any; mutSeq: number; pendingCloud: any; pickOptions: any; todayRule: string | null; tzh: number; undo: any;
  nativeExit?: (...a: any[]) => any; nativeHaptics?: (...a: any[]) => any;
}

interface KENamespace {
  /** Oynanan oyun (yoksa null) */
  G: Game | null;
  CONTACT: string;

  // ---- js/data.js ----
  ECON: KE_ECON;
  DISTRICTS: District[];
  CUSTOMER_TYPES: Record<string, CustomerType>;
  /** saat (10–22) → yoğunluk */
  HOUR_CURVE: Record<string, number>;
  OPEN_HOUR: number;
  CLOSE_HOUR: number;
  REGIONS: Record<string, Region>;
  COSTUMES: Costume[];
  DECOR: DecorItem[];
  CAMPAIGNS: Campaign[];
  FRESH: { cash: number; reputation: number };
  MODES: Record<string, ModeData>;
  REGULARS: Regular[];
  SPECIAL: Record<string, SpecialDay>;
  specialDay: (day: number) => SpecialDay | null;
  FARM_COST: number;
  FARM_MONTHLY: number;
  FARM: Record<string, FarmKind>;
  MASTER_TEMPLATES: Record<string, MasterTemplate[]>;
  TRAITS: Record<string, Trait>;
  ROLES: Record<string, Role>;
  NAMES: Record<string, string[]>;
  SKINS: string[];
  HAIR_COLORS: string[];
  GOALS: Goal[];
  EMPIRE: { branches: number; crowns: number; reputation: number; price: number };
  ERAS: Era[];
  PLACE_ERA: Record<string, number>;
  SIGNATURE: { cost: number[]; days: number; traffic: number; names: string[] };
  FLAGSHIP: { cost: number; traffic: number; chain: number };
  CHARITY: Charity[];
  CONTRACT_KINDS: ContractKind[];
  WEEKLY_KINDS: { kind: string; text: string }[];
  ek: (word: string, kind: string) => string;
  ekSayi: (str: string, kind: string) => string;
  dA: (word: string) => string;
  STATIONS: Station[];
  STEP_STATION: Record<string, string>;
  stepStation: (label: string) => string;

  // ---- js/util.js ----
  U: KE_U;
  branchById: (G: Game, id: string) => Branch | null;
  staffById: (G: Game, id: string) => Staff | null;

  // ---- js/brand.js ----
  BRAND: KE_BRAND;

  // ---- js/calendar.js ----
  CAL: KE_CAL;

  // ---- js/characters.js ----
  portrait: (l: Look, opts?: any) => string;
  figure: (l: Look, opts?: any) => string;
  moodFromValue: (v: number) => 'angry' | 'happy' | 'neutral' | 'sad';
  randomLook: (gender: string, age: string, extra?: any) => Look;
  customerLook: (type: string) => Look;
  staffLook: (s: Staff) => Look;
  CAST: Record<string, CastMember>;
  HUYS: Record<string, { name: string; desc: string }>;
  huyOf: (s: Staff | null | undefined) => string | null;

  // ---- js/art.js, js/sound.js ----
  ART: KE_ART;
  SND: KE_SND;

  // ---- js/economy.js ----
  locale: () => string;
  tl: (v: number) => string;
  num: (v: number, d?: number) => string;
  pct: (v: number, sign?: boolean | number, d?: number) => string;
  AYLAR: string[];
  dateOf: (day: number) => Date;
  dateStr: (day: number) => string;
  weekday: (day: number) => string;
  isWeekend: (day: number) => boolean;
  isMonthEnd: (day: number) => boolean;
  isWeekEnd: (day: number) => boolean;
  monthKey: (day: number) => string;
  monthName: (key: string) => string;
  holidayOf: (day: number) => string | null;
  religiousHolidayOf: (day: number) => string | null;
  /** "YYYY-AA" → o ay bayram ikramiyesi var mı (Proxy) */
  bonusMonths: Record<string, any>;
  TIERS: Tier[];
  modVal: (G: Game, key: string) => number;
  ingPrice: (G: Game, b: Branch, key: string) => number;
  productCost: (G: Game, b: Branch, p: Drink) => number;
  marketPrice: (G: Game, p: Drink) => number;
  taxOn: (cum: number) => number;
  payroll: (G: Game, s: Staff, monthNo: number, opts?: { bonus?: boolean; commit?: boolean }) => Payslip;
  utilities: (G: Game, b: Branch) => number;
  closeMonth: (G: Game, day: number) => any;
  addExtra: (G: Game, key: string, amt: number) => void;
  loanOffer: (amount: number, months: number, rate: number) => LoanOffer;
  LOAN_RATE: number;
  loanOffers: (G: Game) => LoanOffer[];
  LOAN_MAX: number;
  payoffCost: (l: Loan) => number;
  takeLoan: (G: Game, amount: number, months: number) => ActionResult;
  payoffLoan: (G: Game, i: number) => ActionResult;

  // ---- js/sim/rng.js ----
  mix: (...xs: any[]) => number;
  RNG: KE_RNG;
  rand: () => number;

  // ---- js/sim/staff.js ----
  STAR_NEED: number[];
  POSITIONS: Record<string, string[]>;
  POS_NAMES: Record<string, string>;
  TASK_NAMES: Record<string, string>;
  wageFor: (spec: Record<string, number>, role: string) => number;
  makeStaff: (G: Game, o: MasterTemplate) => Staff;
  isCook: (s: Staff) => boolean;
  STAFF_GROUPS: Record<string, StaffGroup>;
  staffGroup: (role: string) => string | undefined;
  staffCapsAt: (G: Game, b: Branch | null, eq: Record<string, number>) => Record<string, number>;
  staffCaps: (G: Game, b: Branch) => Record<string, number>;
  canHire: (G: Game, b: Branch, role: string, exceptId?: string) => { ok: boolean; group: string | undefined; used: number; cap: number; hint: string };
  roleName: (G: Game, s: Staff) => string;
  randomMaster: (G: Game) => Staff;
  randomWorker: (G: Game, role: string) => Staff;
  refreshMarket: (G: Game) => void;
  refreshWorkers: (G: Game) => void;
  gainXp: (s: Staff, pid: string, amt: number) => boolean;

  // ---- js/sim/branch.js ----
  makeBranch: (G: Game, districtId: string) => Branch;
  district: (b: Branch) => District | undefined;
  branchStaff: (G: Game, b: Branch) => Staff[];
  equip: <K extends EquipKey>(G: Game, b: Branch, k: K) => ModeEquipment[K]['levels'][number];
  tableCount: (G: Game, b: Branch) => number;
  stations: (G: Game, b: Branch) => number;
  ambience: (G: Game, b: Branch) => { score: number; concept: { style: string; name: string; power?: number } | null };
  isLocked: (G: Game, p: Product) => boolean;
  canMake: (G: Game, b: Branch, p: Product) => boolean;
  hasStock: (b: Branch, p: Drink, count: number) => boolean;
  bestStar: (G: Game, b: Branch, pid: string) => number;
  priceRatio: (G: Game, b: Branch) => number;
  charityLv: (G: Game, id: string) => number;
  priceTolerance: (G: Game, b?: Branch | null) => number;
  expectedCustomers: (G: Game, b: Branch) => number;
  newGame: (opts: any) => Game;

  // ---- js/sim/morning.js ----
  isManaged: (G: Game, b: Branch) => boolean;
  forecastCustomers: (G: Game, b: Branch) => number;
  demandFactor: (G: Game, b: Branch) => number;
  stockNeed: (G: Game, b: Branch, k: string, f?: number | null) => number;
  shortfall: (G: Game, b: Branch) => { cost: number; items: any[]; factor: number };
  STOCK_SAFETY: number;
  STOCK_EVENING: number;
  STOCK_EVENING_FROM: number;
  STOCK_HIST_DAYS: number;
  STOCK_Z: number;
  STOCK_CONV: number;
  stockForecast: (G: Game, b: Branch) => { customers: number; top: any; products: Record<string, number>; drinks: number; items: any[]; short: any[]; ok: boolean };
  topUpToday: (G: Game, b: Branch) => number;
  morning: (G: Game) => void;
  buyExtra: (G: Game, b: Branch, k: string, qty: number) => number;
  makeDaily: (G: Game) => void;
  dailyProgress: (G: Game, final?: boolean) => any;

  // ---- js/sim/service.js ----
  MINUTES: number;
  MINUTE_MS: number;
  startService: (G: Game) => void;
  newLive: (G: Game, b: Branch) => Live;
  typeWeights: (G: Game, b: Branch, hour: number, day?: number) => [string, number][];
  productOdds: (G: Game, b: Branch, type: string) => Record<string, number>;
  groupMean: (type: string) => number;
  staffRate: (G: Game, b: Branch, s: Staff) => number;
  cookingStaff: (G: Game, b: Branch) => Staff[];
  setPos: (G: Game, s: Staff, pos: string) => void;
  tick: (G: Game, b: Branch, L: Live) => void;
  tickAll: (G: Game) => void;
  allDone: (G: Game) => boolean;

  // ---- js/sim/player.js ----
  playerCap: (G: Game, b: Branch) => number;
  PLAYER_IDLE: number;
  playerToggle: (G: Game, on: boolean) => void;
  playerTake: (G: Game) => any;
  playerSelect: (G: Game, i: number) => void;
  fireTimes: (p: Product | { prep: number }) => FireTimes;
  TIMED: Record<string, (p: Product | { prep: number }) => FireTimes>;
  ticketSteps: (G: Game, t: any) => string[];
  QUESTS_PER_DAY: number;
  mainBranchId: (G: Game) => string;
  setMainBranch: (G: Game, bid: string) => boolean;
  playerStation: (G: Game, st: string) => any;
  playerStep: (G: Game, label: string) => any;
  playerTick: (G: Game, b: Branch, L: Live) => void;

  // ---- js/sim/close.js ----
  TIP_RULES: Record<string, TipRule>;
  tipShares: (G: Game, b: Branch, rule: string, jar: number) => [Staff, number][];
  closeDeps: () => string[];
  fastForward: (G: Game) => void;
  finishService: (G: Game) => DaySummary;
  finalizeDay: (G: Game, todayRule?: string | null) => DayResult;
  LEDGER_KEEP: number;
  compactLedger: (G: Game) => void;
  championship: (G: Game) => any;

  // ---- js/sim/replay.js ----
  act: (G: Game, a: string, ...x: any[]) => any;
  replayService: (G: Game, log: any[]) => any;

  // ---- js/midday.js ----
  MIDS: MidEvent[];
  MID_WAIT: number;
  midCost: (G: Game, id: string) => number;
  pickMid: (G: Game) => void;
  midPending: (G: Game) => boolean;
  resolveMid: (G: Game, i: number) => any;
  courierMul: (G: Game) => number;
  courierNeed: (G: Game, b: Branch) => { cost: number; items: Record<string, number> };
  courier: (G: Game, b: Branch) => any;
  RESERVATION: { cost: number; era: number };
  resOn: (b: Branch | null | undefined) => boolean;
  reservationCost: (G: Game) => number;
  buyReservation: (G: Game, b: Branch) => ActionResult;
  INSPECT: { sat: number; lost: number };
  lostShare: (st: Record<string, any>) => number;
  RACE_DAYS: number;
  raceWeek: (now: Date) => string;
  raceSetup: (week: string) => { week: string; seed: number; mode: string; district: string; master: number };
  newRace: (week: string, owner?: string) => Game;
  raceScore: (G: Game) => number;
  raceOver: (G: Game) => boolean;

  // ---- js/progress.js ----
  empirePrice: (G: Game) => number;
  empireStatus: (G: Game) => { req: EmpireReq[]; price: number; ready: boolean; done: boolean };
  lifetime: (G: Game) => Record<string, any>;
  buyRival: (G: Game) => ActionResult;
  goalReward: (G: Game, g: { reward?: number }) => number;
  checkGoals: (G: Game) => Goal[];
  openBranch: (G: Game, districtId: string) => Branch;
  branchCost: (G: Game, d: District) => number;
  eraStatus: (G: Game) => { era: number; cur: Era; next: Era | undefined; req: any[]; ready: boolean };
  /** geçilen dönemler */
  advanceEra: (G: Game) => Era[];
  placeOpen: (G: Game, id: string) => boolean;
  placesOfEra: (n: number) => string[];
  signatureCost: (G: Game) => number;
  startSignature: (G: Game, pid: string) => ActionResult;
  flagshipCost: (G: Game) => number;
  buildFlagship: (G: Game, bid: string) => ActionResult;
  contractOffers: (G: Game) => { id: string; kind: string; name: string; who: string; pid: string; qty: number; pay: number; cost: number; morale: number }[];
  contractTaken: (G: Game) => boolean;
  acceptContract: (G: Game, id: string, bid: string) => ActionResult;
  makeWeekly: (G: Game) => void;
  syncTables: (G: Game, b: Branch) => void;
  hireMaster: (G: Game, b: Branch, id: string) => ActionResult;
  hireWorker: (G: Game, b: Branch, id: string) => ActionResult;
  severance: (s: Staff) => number;
  fireStaff: (G: Game, id: string) => ActionResult;
  buyCostume: (G: Game, sid: string, cid: string) => ActionResult;
  upgradeCost: (G: Game, b: Branch, k: EquipKey) => number | null;
  upgradeEquipment: (G: Game, b: Branch, k: EquipKey) => ActionResult;
  decorCost: (G: Game, it: DecorItem) => number;
  buyDecor: (G: Game, b: Branch, id: string) => ActionResult;
  hygieneCost: (G: Game) => number;
  deepClean: (G: Game, b: Branch) => ActionResult;
  campaignCost: (G: Game, c: Campaign) => number;
  startCampaign: (G: Game, b: Branch, id: string) => ActionResult;
  centralCost: (G: Game) => number;
  buildCentralKitchen: (G: Game) => ActionResult;
  quickWeekOpen: (G: Game) => boolean;
  charityCost: (G: Game, id: string) => number | null;
  donate: (G: Game, id: string) => ActionResult;

  // ---- js/farm.js ----
  farmKinds: (G: Game) => string[];
  farmCost: (G: Game) => number;
  buyFarm: (G: Game) => void;
  penHeads: (pen: Pen) => number;
  penCap: (kind: string, pen: Pen) => number;
  animalPrice: (G: Game, kind: string) => number;
  buyAnimals: (G: Game, kind: string) => number;
  upgradePen: (G: Game, kind: string) => void;
  batchYield: (G: Game, kind: string, count: number) => Record<string, number>;
  slaughter: (G: Game, kind: string) => { heads: number; got: Record<string, number> };
  farmDay: (G: Game) => { feed: number; done: any[] };
  farmCostPerKg: (G: Game, kind: string) => number;

  // ---- js/narrative.js ----
  clock: (min: number) => string;
  writeJournal: (G: Game, S0: any, out?: any) => string;
  writeNews: (G: Game) => { day: number; date: string; issue: number; headlines: any[] };
  canRaise: (G: Game, s: Staff) => boolean;
  raiseBlock: (G: Game, s: Staff) => string;
  raiseStaff: (G: Game, s: Staff) => ActionResult;
  RIVAL_ARC: [string, number, number][];
  rivalNext: (G: Game) => { id: string; step: number; of: number; due: boolean; day: number; era: number } | null;
  EVENTS: GameEvent[];
  rollEvent: (G: Game) => any;
  resolveEvent: (G: Game, idx: number) => string;
  LINES: Record<string, string[]>;
  line: (who: string) => string;

  // ---- js/save.js, js/verify.js ----
  SAVE: KE_SAVE;
  verifyDay: (morningEnvelope: any, log: any, todayRule: any, claim: any) => VerifyResult;
  chainCheck: (prevEnv: any, curEnv: any) => VerifyResult;
  raceCheck: (race: any, morningEnv: any, now?: any) => VerifyResult;
  LOG_MAX: number;
  logCheck: (log: any) => VerifyResult;
  verifyChain: (prevEnd: any, morningEnv: any, log: any, todayRule: any, claim: any, race?: any, now?: any) => VerifyResult;

  // ---- arayüz: js/config.js, js/i18n.js, js/map.js, js/scene.js, js/ui/*.js, src/*.js ----
  CONFIG: KE_CONFIG;
  I18N: KE_I18N;
  MAP: KE_MAP;
  SCENE: KE_SCENE;
  UI: KE_UI;
  haptic: (kind: string) => boolean;
  CLOUD: KE_CLOUD;
}

declare var KE: KENamespace;
