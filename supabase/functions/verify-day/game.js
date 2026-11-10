// OTOMATİK ÜRETİLİR: node scripts/build-edge.mjs — elle düzenleme.
const window = globalThis;
globalThis.window = globalThis;

// ---- js/data.js ----
/* Kebab Empire — oyun verisi
   Bütün içerik (ürünler, ustalar, semtler, ekipman, dekor, ekonomi ayarları) burada durur.
   Mod'a özel her şey KE.MODES[mod] altındadır; motor tek, veri ikidir. */
window.KE = window.KE || {};

/* ---------- Ekonomi ayar tablosu (Türkiye'ye yakın, yuvarlanmış) ----------
   Not: 2026 değerleri tahminidir. Güncel resmi oranlar çıktığında yalnızca bu tablo güncellenir. */
KE.ECON = {
  asgariBrut: 33030,          // aylık brüt asgari ücret (TL)
  sgkIsci: 0.14,              // SGK işçi payı
  issizlikIsci: 0.01,         // işsizlik sigortası işçi payı
  sgkIsveren: 0.2075,         // SGK işveren payı (teşviksiz)
  issizlikIsveren: 0.02,      // işsizlik sigortası işveren payı
  hazineTesvik: 0.05,         // 5 puanlık hazine teşviki (zamanında ödemede düşülür)
  damga: 0.00759,             // damga vergisi
  gvDilim: [                  // ücretliler için kümülatif gelir vergisi dilimleri
    [190000, 0.15], [400000, 0.20], [1500000, 0.27], [5300000, 0.35], [Infinity, 0.40]
  ],
  kdvRestoran: 0.10,          // yeme-içme hizmetlerinde KDV
  kdvGida: 0.01,              // temel gıda alımlarında KDV (indirilecek)
  kiraStopaj: 0.20,           // işyeri kirası stopajı
  muhasebeci: 7500,           // aylık muhasebeci ücreti
  aylikEnflasyon: 0.022,      // malzeme ve menü fiyat endeksi aylık artışı
  yemekYardimiGunluk: 0,      // personele yemek dükkândan veriliyor
  yolYardimiAylik: 1800,      // personel başına yol yardımı
  bayramIkramiye: 0.5,        // bayram ikramiyesi = brüt maaşın oranı
  fazlaMesaiOrani: 0.3,       // haftada ~10 saat fazla mesai (%50 zamlı) ≈ brüt ücretin %30'u
  sarfOrani: 0.06             // ambalaj, peçete, yağ, tüp gibi sarf malzemeleri (cironun oranı)
};

/* ---------- Semtler (İstanbul'dan esinlenen hayali şehir) ---------- */
KE.DISTRICTS = [
  { id: 'kadiceşme', name: 'Kadıçeşme', side: 'Anadolu', inspired: 'Kadıköy', rent: 95000, traffic: 135, rivals: 3,
    mix: { ogrenci: 3, gece: 3, beyaz: 1, aile: 1, turist: 1, isci: 0.5, gurme: 0.5 },
    desc: 'Çarşısı hiç uyumayan, genç ve hareketli bir semt. Gece çıkışı kalabalığı bol.', x: 690, y: 420 },
  { id: 'sultanpazari', name: 'Sultanpazarı', side: 'Avrupa', inspired: 'Eminönü / Sultanahmet', rent: 150000, traffic: 150, rivals: 4,
    mix: { turist: 4, gurme: 1.5, isci: 1.5, beyaz: 1, aile: 1, ogrenci: 0.5, gece: 0.3 },
    desc: 'Tarihi çarşının göbeği. Turistler ve gurmeler otantik lezzet arar.', x: 420, y: 395 },
  { id: 'kulealti', name: 'Kulealtı', side: 'Avrupa', inspired: 'Levent / Maslak', rent: 220000, traffic: 165, rivals: 4,
    mix: { beyaz: 5, gurme: 1, turist: 0.5, aile: 0.3, ogrenci: 0.3, gece: 0.3, isci: 0.5 },
    desc: 'Plazalar arasında öğle arası yarışı. Hız her şeydir, fiyat ikinci planda.', x: 470, y: 150 },
  { id: 'bostansahil', name: 'Bostansahil', side: 'Anadolu', inspired: 'Caddebostan', rent: 160000, traffic: 125, rivals: 2,
    mix: { aile: 4, beyaz: 1, gurme: 1, turist: 0.5, ogrenci: 0.5, gece: 1 },
    desc: 'Sahil yolu, hafta sonu kalabalığı ve uzun aile sofraları.', x: 760, y: 520 },
  { id: 'merterli', name: 'Merterli Sanayi', side: 'Avrupa', inspired: 'Merter / İkitelli', rent: 60000, traffic: 120, rivals: 2,
    mix: { isci: 5, beyaz: 1, ogrenci: 0.3, aile: 0.3, gece: 0.3, gurme: 0.1 },
    desc: 'Atölyeler, inşaatlar, toptancılar. Bol porsiyon ve hızlı servis ister.', x: 180, y: 330 },
  { id: 'kampustepe', name: 'Kampüstepe', side: 'Avrupa', inspired: 'Avcılar / Beyazıt', rent: 55000, traffic: 125, rivals: 3,
    mix: { ogrenci: 6, gece: 1.5, aile: 0.3, beyaz: 0.3, isci: 0.5, gurme: 0.1 },
    desc: 'Üniversite yokuşu. Bütçe dar, iştah geniş.', x: 110, y: 470 },
  { id: 'besiktepe', name: 'Beşiktepe', side: 'Avrupa', inspired: 'Beşiktaş', rent: 130000, traffic: 140, rivals: 3,
    mix: { ogrenci: 2, gece: 2, beyaz: 2, aile: 1, turist: 1, isci: 0.5, gurme: 0.5 },
    desc: 'Çarşı, iskele ve stat. Maç günleri sokaklar dolup taşar.', x: 545, y: 255 }
];

/* ---------- Müşteri tipleri ---------- */
KE.CUSTOMER_TYPES = {
  ogrenci: { name: 'Öğrenci', takeaway: 0.45, eat: 12, patience: 22, priceSens: 0.9, tip: 0.01, hours: { 12: 1.2, 13: 1.2, 18: 1.2, 19: 1.2, 21: 1.1 } },
  beyaz:   { name: 'Beyaz yaka', takeaway: 0.5, eat: 14, patience: 14, priceSens: 0.35, tip: 0.035, hours: { 12: 2.6, 13: 2.4, 14: 0.8, 18: 1.2, 19: 0.8, 20: 0.4, 21: 0.2, 22: 0.1 } },
  aile:    { name: 'Aile', takeaway: 0.05, eat: 25, patience: 32, priceSens: 0.55, tip: 0.04, hours: { 10: 0.3, 11: 0.5, 13: 1.2, 18: 1.4, 19: 1.8, 20: 1.6, 22: 0.3 }, weekend: 1.8, group: [2, 4] },
  gurme:   { name: 'Gurme', takeaway: 0, eat: 30, patience: 40, priceSens: 0.1, tip: 0.1, hours: { 13: 1.2, 19: 1.5, 20: 1.5 } },
  turist:  { name: 'Turist', takeaway: 0.15, eat: 20, patience: 26, priceSens: 0.25, tip: 0.07, hours: { 11: 1.2, 12: 1.4, 13: 1.4, 14: 1.2, 17: 1.1, 18: 1.2 } },
  isci:    { name: 'İnşaat ekibi', takeaway: 0.25, eat: 14, patience: 12, priceSens: 0.75, tip: 0.01, hours: { 10: 0.6, 11: 1, 12: 2.8, 13: 2.2, 14: 0.4, 17: 0.9, 18: 0.6, 19: 0.3, 20: 0.1, 21: 0.05, 22: 0.05 }, group: [2, 3] },
  gece:    { name: 'Gece çıkışı', takeaway: 0.55, eat: 10, patience: 15, priceSens: 0.5, tip: 0.03, hours: { 10: 0.05, 11: 0.05, 12: 0.2, 13: 0.2, 14: 0.2, 15: 0.2, 16: 0.2, 17: 0.3, 18: 0.4, 19: 0.6, 20: 1, 21: 2.2, 22: 3.4 } }
};

/* Saatlik genel yoğunluk eğrisi (10:00–23:00) */
KE.HOUR_CURVE = { 10: 0.45, 11: 0.75, 12: 1.6, 13: 1.5, 14: 0.85, 15: 0.5, 16: 0.5, 17: 0.7, 18: 1.0, 19: 1.4, 20: 1.3, 21: 0.95, 22: 0.7 };
KE.OPEN_HOUR = 10; KE.CLOSE_HOUR = 23;

/* ---------- Yöreler ---------- */
KE.REGIONS = {
  'Adana':        { outfit: 'salvar', color: '#c0392b', accent: '#f4d03f', head: 'none', note: 'şalvar ve kırmızı kuşak' },
  'Şanlıurfa':    { outfit: 'yelek', color: '#5b3a29', accent: '#d35400', head: 'pusi', note: 'puşi ve işlemeli yelek' },
  'Gaziantep':    { outfit: 'yelek', color: '#2e4053', accent: '#c9a227', head: 'takke', note: 'yelek ve işlemeli takke' },
  'Bursa':        { outfit: 'beyazceket', color: '#f8f9f9', accent: '#922b21', head: 'none', note: 'beyaz ceket ve papyon' },
  'Erzurum':      { outfit: 'yelek', color: '#1b2631', accent: '#7d6608', head: 'kalpak', note: 'koyu yelek ve kalpak' },
  'Hatay':        { outfit: 'gomlek', color: '#117a65', accent: '#f0b27a', head: 'none', note: 'yeşil keten gömlek' },
  'Kahramanmaraş':{ outfit: 'yelek', color: '#6e2c00', accent: '#f5cba7', head: 'takke', note: 'kahve yelek' },
  'Tokat':        { outfit: 'yelek', color: '#4a235a', accent: '#d7bde2', head: 'none', note: 'mor yazma yelek' },
  'İstanbul':     { outfit: 'beyazceket', color: '#f8f9f9', accent: '#1f618d', head: 'none', note: 'klasik beyaz ceket' },
  'Malatya':      { outfit: 'yelek', color: '#935116', accent: '#f9e79f', head: 'none', note: 'kayısı tonlu yelek' }
};

/* ---------- Kostümler ---------- */
KE.COSTUMES = [
  { id: 'temel',   name: 'Temel önlük',     cost: 0,     morale: 0,  concept: 0, desc: 'Herkesin ilk günü giydiği sade önlük.' },
  { id: 'markali', name: 'Markalı önlük',   cost: 2400,  morale: 6,  concept: 1, desc: 'Dükkân logolu, cepli, kaliteli kumaş.' },
  { id: 'sef',     name: 'Şef ceketi',      cost: 5200,  morale: 10, concept: 1, desc: 'Çift düğmeli, nefes alan şef ceketi.' },
  { id: 'yoresel', name: 'Yöresel kostüm',  cost: 8500,  morale: 14, concept: 2, desc: 'Çalışanın memleketine özel kıyafet. Uyumlu ürünlerde ek bahşiş.' }
];

/* ---------- Dekor (tarzlar: geleneksel, modern, sokak, lüks) ---------- */
KE.DECOR = [
  { id: 'cini',      name: 'Çini pano',           style: 'geleneksel', cost: 18000, ambience: 6, desc: 'El boyaması İznik motifli duvar panosu.' },
  { id: 'bakir',     name: 'Bakır sahan duvarı',  style: 'geleneksel', cost: 22000, ambience: 7, desc: 'Parlak bakır sahanlar ve cezveler.' },
  { id: 'nostalji',  name: 'Nostaljik fotoğraflar', style: 'geleneksel', cost: 7000, ambience: 3, desc: 'Eski İstanbul ve ustaların siyah beyaz kareleri.' },
  { id: 'kilim',     name: 'Kilim minderli köşe', style: 'geleneksel', cost: 16000, ambience: 5, desc: 'Yer sofrası havasında rahat bir köşe.' },
  { id: 'neon',      name: 'Neon tabela',         style: 'sokak',      cost: 12000, ambience: 4, desc: '"Gece de açığız" diye parlayan tabela.' },
  { id: 'grafiti',   name: 'Duvar resmi',         style: 'sokak',      cost: 9000,  ambience: 4, desc: 'Mahalleli bir sanatçının döner temalı duvar resmi.' },
  { id: 'taburet',   name: 'Bar taburesi sırası', style: 'sokak',      cost: 11000, ambience: 3, desc: 'Cama karşı hızlı yeme tezgâhı.' },
  { id: 'menuekran', name: 'Dijital menü ekranı', style: 'modern',     cost: 26000, ambience: 5, desc: 'Fotoğraflı, hareketli menü panoları.' },
  { id: 'bitki',     name: 'Canlı bitki duvarı',  style: 'modern',     cost: 15000, ambience: 5, desc: 'Yeşil, ferah, fotoğraf çekilesi bir köşe.' },
  { id: 'aydinlatma',name: 'Sarkıt aydınlatma',   style: 'modern',     cost: 13000, ambience: 4, desc: 'Sıcak tonlu sarkıt lambalar.' },
  { id: 'mermer',    name: 'Mermer tezgâh',       style: 'lüks',       cost: 48000, ambience: 9, desc: 'Damarlı beyaz mermer, pirinç detaylar.' },
  { id: 'kadife',    name: 'Kadife oturma grubu', style: 'lüks',       cost: 38000, ambience: 8, desc: 'Bordo kadife koltuklar.' },
  { id: 'dismasa',   name: 'Dış masalar',         style: 'sokak',      cost: 14000, ambience: 4, seats: 2, desc: 'Kaldırımda ek oturma alanı. Kapasite artar.' },
  { id: 'dinlenme',  name: 'Personel dinlenme odası', style: 'personel', cost: 30000, ambience: 0, morale: 2, desc: 'Çalışanların günlük moralini artırır.' },
  { id: 'klima',     name: 'Mutfak kliması',      style: 'personel',   cost: 24000, ambience: 1, morale: 1.5, desc: 'Sıcak mutfakta yorgunluğu azaltır.' }
];

/* ---------- Reklam kampanyaları (Reklam Ajansı) ---------- */
KE.CAMPAIGNS = [
  { id: 'ilan', name: 'El ilanı dağıtımı', cost: 6000, days: 4, icon: 'map', desc: 'Sanayi ve konut sokaklarına ilan. Müşteri +%12, işçi ve aile +%30.', mods: [['traffic', 1.12], ['type:isci', 1.3], ['type:aile', 1.3]] },
  { id: 'sosyal', name: 'Sosyal medya kampanyası', cost: 14000, days: 7, icon: 'heart', desc: 'Kısa videolar ve fenomen paylaşımları. Müşteri +%18, öğrenci ve gece +%50.', mods: [['traffic', 1.18], ['type:ogrenci', 1.5], ['type:gece', 1.5]] },
  { id: 'radyo', name: 'Radyo reklamı', cost: 24000, days: 7, icon: 'bolt', desc: 'Sabah trafiğinde jingle. Bütün şubelerde müşteri +%10, beyaz yaka +%30.', mods: [['traffic', 1.1], ['type:beyaz', 1.3]] },
  { id: 'blog', name: 'Gurme blog daveti', cost: 10000, days: 5, icon: 'star', desc: 'Yemek yazarlarına tadım. Gurme +%60. Usta ★4 ve üstüyse itibar +4.', mods: [['type:gurme', 1.6]], rep: true },
  { id: 'tadim', name: 'Tadım menüsü', cost: 12000, days: 7, icon: 'chef', mode: 'kebap', desc: 'Meze, ara sıcak ve tatlı eşliğinde tadım tabağı. Hesap ortalaması +%12, gurme +%30. Müşteri sayısını artırmaz; dolu dükkânda da kazandırır.', mods: [['spend', 1.12], ['type:gurme', 1.3]] },
  { id: 'tabela', name: 'Işıklı tabela yenileme', cost: 20000, days: 0, icon: 'store', desc: 'Seçili şubede kalıcı olarak müşteri +%6. Şube başına bir kez.', sign: true }
];

/* ---------- Yeni oyunun başlangıç kasası ve itibarı (newGame ve sunucu zinciri aynı değeri kullanır) ---------- */
KE.FRESH = { cash: 450000, reputation: 30 };

/* ---------- Mod tanımları ---------- */
KE.MODES = {
  doner: {
    id: 'doner', name: 'Dönerci', icon: '🥙',
    tagline: 'Hızlı servis, kalabalık kuyruk, gece yarısına kadar dönen ocak.',
    trafficMul: 1.2, drinkRate: 0.62,
    cookRole: 'Döner ustası',
    ingredients: {
      et:      { name: 'Dana döner eti', unit: 'kg', price: 760 },
      tavuk:   { name: 'Tavuk döner eti', unit: 'kg', price: 270 },
      kuzu:    { name: 'Kuzu eti (cağ)', unit: 'kg', price: 920 },
      lavas:   { name: 'Lavaş', unit: 'adet', price: 6 },
      ekmek:   { name: 'Somun ekmek', unit: 'adet', price: 12 },
      pide:    { name: 'Tırnak pide', unit: 'adet', price: 15 },
      pilav:   { name: 'Pilavlık pirinç', unit: 'kg', price: 72 },
      sebze:   { name: 'Domates, marul, soğan', unit: 'kg', price: 48 },
      tereyag: { name: 'Tereyağı', unit: 'kg', price: 620 },
      yogurt:  { name: 'Yoğurt', unit: 'kg', price: 92 },
      kadayif: { name: 'Künefe seti (kadayıf, peynir)', unit: 'adet', price: 95 },
      ayran:   { name: 'Ayran', unit: 'adet', price: 14 }
    },
    products: [
      { id: 'tavuk_durum', name: 'Tavuk Dürüm', base: 210, prep: 3, ing: { tavuk: 0.15, lavas: 1, sebze: 0.05 }, steps: ['Lavaş', 'Tavuk', 'Domates-marul', 'Sos', 'Sar'] },
      { id: 'et_durum', name: 'Et Dürüm', base: 320, prep: 3, ing: { et: 0.13, lavas: 1, sebze: 0.05 }, steps: ['Lavaş', 'Et', 'Soğan', 'Domates', 'Sar'] },
      { id: 'ekmek_arasi', name: 'Yarım Ekmek Döner', base: 290, prep: 3, ing: { et: 0.12, ekmek: 1, sebze: 0.04 }, steps: ['Ekmek', 'Et', 'Domates', 'Turşu'] },
      { id: 'iskender', name: 'İskender', base: 560, prep: 6, ing: { et: 0.16, pide: 1, tereyag: 0.03, yogurt: 0.1 }, steps: ['Pide', 'Et', 'Domates sosu', 'Yoğurt', 'Kızgın tereyağı'] },
      { id: 'pilav_ustu', name: 'Pilav Üstü Döner', base: 430, prep: 4, ing: { et: 0.15, pilav: 0.12, sebze: 0.05 }, steps: ['Pilav', 'Et', 'Közlenmiş biber', 'Servis'] },
      { id: 'tavuk_porsiyon', name: 'Tavuk Porsiyon', base: 300, prep: 4, ing: { tavuk: 0.2, pilav: 0.12, sebze: 0.05 }, steps: ['Pilav', 'Tavuk', 'Salata', 'Servis'] },
      { id: 'cag', name: 'Cağ Kebabı', base: 520, prep: 5, ing: { kuzu: 0.15, lavas: 1, sebze: 0.05 }, requiresSpec: true, steps: ['Şişi çevir', 'Kes', 'Lavaş', 'Soğan', 'Servis'] },
      { id: 'tantuni', name: 'Tantuni', base: 290, prep: 3, unlock: 40, ing: { et: 0.11, lavas: 1, sebze: 0.06 }, steps: ['Saç yağla', 'Eti sotele', 'Lavaş', 'Maydanoz-soğan', 'Sar'] },
      { id: 'kunefe', name: 'Künefe', base: 330, prep: 4, unlock: 60, ing: { kadayif: 1 }, steps: ['Kadayıf', 'Peynir', 'Kadayıf', 'Fırına ver', 'Şerbet', 'Fıstık'] }
    ],
    drink: { id: 'ayran', name: 'Ayran', base: 45, ing: { ayran: 1 } },
    favorites: {
      ogrenci: ['tavuk_durum', 'tantuni', 'tavuk_porsiyon', 'ekmek_arasi'],
      beyaz: ['iskender', 'tantuni', 'pilav_ustu', 'et_durum'],
      aile: ['iskender', 'kunefe', 'pilav_ustu', 'tavuk_porsiyon'],
      gurme: ['cag', 'kunefe', 'iskender'],
      turist: ['iskender', 'kunefe', 'et_durum', 'cag'],
      isci: ['ekmek_arasi', 'et_durum', 'pilav_ustu'],
      gece: ['et_durum', 'tantuni', 'tavuk_durum', 'ekmek_arasi']
    },
    equipment: {
      cook:    { name: 'Döner ocağı', levels: [
        { name: 'Tek gazlı ocak', stations: 2, cost: 0 },
        { name: 'Elektrikli çift ocak', stations: 3, cost: 65000 },
        { name: 'Üçlü profesyonel ocak', stations: 4, cost: 140000 },
        { name: 'Dört ocaklı döner hattı', stations: 5, cost: 260000 } ] },
      prep:    { name: 'Hazırlık', levels: [
        { name: 'El bıçağı', speed: 1.0, cost: 0 },
        { name: 'Elektrikli döner bıçağı', speed: 1.15, cost: 28000 },
        { name: 'Döner kesme robotu', speed: 1.3, cost: 95000 } ] },
      cold:    { name: 'Soğutma', levels: [
        { name: 'Tezgâh altı dolap', waste: 0.06, cost: 0 },
        { name: 'Dik tip endüstriyel dolap', waste: 0.035, cost: 25000 },
        { name: 'Soğuk oda', waste: 0.015, cost: 65000 } ] },
      service: { name: 'Servis', levels: [
        { name: 'Klasik tezgâh ve 4 masa', patience: 1.0, queue: 8, tables: 4, cost: 0 },
        { name: 'Self servis tezgâh ve 6 masa', patience: 1.15, queue: 10, tables: 6, cost: 35000 },
        { name: 'Sipariş ekranı ve 8 masa', patience: 1.3, queue: 12, tables: 8, cost: 85000 } ] }
    }
  },
  kebap: {
    id: 'kebap', name: 'Kebapçı', icon: '🍢',
    tagline: 'Közün başında usta işi, masaya oturan müşteri, yüksek hesap.',
    trafficMul: 0.74, drinkRate: 0.8,
    cookRole: 'Kebap ustası',
    ingredients: {
      kiyma:   { name: 'Zırh kıyması', unit: 'kg', price: 820 },
      kuzu:    { name: 'Kuzu şişlik', unit: 'kg', price: 920 },
      ciger:   { name: 'Kuzu ciğeri', unit: 'kg', price: 520 },
      lavas:   { name: 'Lavaş', unit: 'adet', price: 6 },
      hamur:   { name: 'Lahmacun hamuru', unit: 'adet', price: 8 },
      sebze:   { name: 'Közlük sebze, yeşillik', unit: 'kg', price: 50 },
      patlican:{ name: 'Patlıcan', unit: 'kg', price: 62 },
      yogurt:  { name: 'Yoğurt', unit: 'kg', price: 92 },
      komur:   { name: 'Mangal kömürü', unit: 'kg', price: 32 },
      bulgur:  { name: 'İnce bulgur', unit: 'kg', price: 64 },
      kadayif: { name: 'Künefe seti (kadayıf, peynir)', unit: 'adet', price: 95 },
      ayran:   { name: 'Ayran / şalgam', unit: 'adet', price: 15 }
    },
    products: [
      { id: 'adana', name: 'Adana Kebap', base: 620, prep: 7, ing: { kiyma: 0.2, lavas: 1, sebze: 0.1, komur: 0.15 }, steps: ['Şişe sar', 'Közde çevir', 'Lavaşa al', 'Sumaklı soğan', 'Servis'] },
      { id: 'urfa', name: 'Urfa Kebap', base: 620, prep: 7, ing: { kiyma: 0.2, lavas: 1, sebze: 0.1, komur: 0.15 }, steps: ['Şişe sar', 'Közde çevir', 'Lavaşa al', 'Közlenmiş biber', 'Servis'] },
      { id: 'kuzu_sis', name: 'Kuzu Şiş', base: 700, prep: 8, ing: { kuzu: 0.2, lavas: 1, sebze: 0.1, komur: 0.15 }, steps: ['Şişe diz', 'Közde çevir', 'Lavaşa al', 'Domates', 'Servis'] },
      { id: 'beyti', name: 'Beyti', base: 720, prep: 9, ing: { kiyma: 0.2, lavas: 2, yogurt: 0.1, komur: 0.15 }, steps: ['Közde pişir', 'Lavaşa sar', 'Dilimle', 'Domates sosu', 'Yoğurt'] },
      { id: 'ali_nazik', name: 'Ali Nazik', base: 690, prep: 9, ing: { kiyma: 0.18, patlican: 0.3, yogurt: 0.15, komur: 0.1 }, steps: ['Patlıcan közle', 'Yoğurtla ez', 'Kebap', 'Tereyağı'] },
      { id: 'lahmacun', name: 'Lahmacun', base: 140, prep: 4, ing: { hamur: 1, kiyma: 0.05, sebze: 0.05 }, requiresSpec: true, steps: ['Hamuru aç', 'İç harç', 'Fırına ver', 'Maydanoz-limon'] },
      { id: 'ciger', name: 'Ciğer Şiş', base: 540, prep: 6, ing: { ciger: 0.2, lavas: 1, sebze: 0.1, komur: 0.1 }, requiresSpec: true, steps: ['Şişe diz', 'Közde çevir', 'Lavaşa al', 'Soğan-maydanoz'] },
      { id: 'icli_kofte', name: 'İçli Köfte', base: 360, prep: 5, unlock: 40, ing: { kiyma: 0.08, bulgur: 0.1, sebze: 0.03 }, steps: ['Bulgur hamuru', 'İç harç', 'Kapat', 'Kızart', 'Servis'] },
      { id: 'kunefe', name: 'Künefe', base: 330, prep: 4, unlock: 60, ing: { kadayif: 1, komur: 0.05 }, steps: ['Kadayıf', 'Peynir', 'Kadayıf', 'Közde pişir', 'Şerbet', 'Fıstık'] }
    ],
    drink: { id: 'ayran', name: 'Ayran / Şalgam', base: 55, ing: { ayran: 1 } },
    favorites: {
      ogrenci: ['lahmacun', 'icli_kofte', 'adana', 'urfa'],
      beyaz: ['beyti', 'icli_kofte', 'adana', 'kuzu_sis'],
      aile: ['ali_nazik', 'kunefe', 'kuzu_sis', 'lahmacun'],
      gurme: ['ciger', 'kunefe', 'urfa', 'kuzu_sis'],
      turist: ['adana', 'kunefe', 'beyti', 'lahmacun'],
      isci: ['lahmacun', 'adana', 'urfa'],
      gece: ['adana', 'lahmacun', 'ciger']
    },
    equipment: {
      cook:    { name: 'Mangal', levels: [
        { name: 'Kömür mangalı', stations: 2, cost: 0 },
        { name: 'Uzun ocakbaşı mangalı', stations: 3, cost: 70000 },
        { name: 'Bakır ocakbaşı tezgâhı', stations: 4, cost: 150000 },
        { name: 'Odun fırını ve çift ocakbaşı', stations: 5, cost: 280000 } ] },
      prep:    { name: 'Hazırlık', levels: [
        { name: 'Kıyma makinesi', speed: 1.0, quality: 0, cost: 0 },
        { name: 'Zırh tezgâhı (el kıyması)', speed: 1.05, quality: 0.4, cost: 32000 },
        { name: 'Zırh tezgâhı ve hazırlık mutfağı', speed: 1.25, quality: 0.6, cost: 105000 } ] },
      cold:    { name: 'Soğutma', levels: [
        { name: 'Tezgâh altı dolap', waste: 0.06, cost: 0 },
        { name: 'Dik tip endüstriyel dolap', waste: 0.035, cost: 25000 },
        { name: 'Soğuk oda', waste: 0.015, cost: 65000 } ] },
      service: { name: 'Salon', levels: [
        { name: '5 masalık salon', patience: 1.0, queue: 6, tables: 5, cost: 0 },
        { name: '7 masa ve yer sofrası köşesi', patience: 1.15, queue: 8, tables: 7, cost: 45000 },
        { name: '9 masalık geniş salon', patience: 1.3, queue: 10, tables: 9, cost: 110000 } ] }
    }
  }
};

/* ---------- Müdavimler ----------
   Her birinin sevdiği bir yemek ve kendine has bir sözü var. İyi ağırlanan müdavimin gönlü (0–10) dolar;
   5'te yanına arkadaşını getirir, 8'de mahallede dükkânı över (itibar ve müşteri). */
KE.REGULARS = [
  { id: 'ayse', name: 'Ayşe Teyze', type: 'aile', fav: { doner: 'iskender', kebap: 'ali_nazik' }, cast: 'ayse', says: ['Ellerine sağlık evladım!', 'Tıpkı rahmetlinin yaptığı gibi.', 'Torunlarımı da getireceğim.'] },
  { id: 'kemal', name: 'Emekli Kemal Bey', type: 'aile', fav: { doner: 'pilav_ustu', kebap: 'kuzu_sis' }, look: { gender: 'e', age: 'yasli', skin: '#e8b98f', hairColor: '#c9c9c9', hair: 'kel', facial: 'gurbiyik', glasses: true, head: 'kasket', hatColor: '#4e342e', outfit: 'hirka', outfitColor: '#5d6d7e', shirt: '#fdfefe' }, says: ['Gazetemi de okurum, yemeğimi de yerim.', 'Bu dükkânı babanın zamanından bilirim.'] },
  { id: 'elif', name: 'Öğrenci Elif', type: 'ogrenci', fav: { doner: 'tavuk_durum', kebap: 'lahmacun' }, look: { gender: 'k', age: 'genc', skin: '#f3d2b3', hairColor: '#6b4423', hair: 'uzun', facial: 'none', glasses: true, head: 'none', outfit: 'tisort', outfitColor: '#7d3c98', accent: '#f4d03f', print: true }, says: ['Final haftası beni siz kurtarıyorsunuz!', 'Bütün sınıfa önerdim.'] },
  { id: 'hakan', name: 'Şantiye Şefi Hakan', type: 'isci', fav: { doner: 'ekmek_arasi', kebap: 'adana' }, look: { gender: 'e', age: 'orta', skin: '#c68b5c', hairColor: '#1c1410', hair: 'kisa', facial: 'sakal', glasses: false, head: 'baret', outfit: 'reflektif' }, says: ['Ekip seni soruyor usta!', 'Doyurdun, Allah da seni doyursun.'] },
  { id: 'selin', name: 'Avukat Selin', type: 'beyaz', fav: { doner: 'et_durum', kebap: 'beyti' }, look: { gender: 'k', age: 'orta', skin: '#e8b98f', hairColor: '#2b1d14', hair: 'topuz', facial: 'none', glasses: false, head: 'none', outfit: 'takim', outfitColor: '#1b2631', accent: '#c0392b' }, says: ['On dakikam var, yine de buraya geldim.', 'Ofiste herkese anlattım.'] },
  { id: 'mario', name: 'Gezgin Marco', type: 'turist', fav: { doner: 'iskender', kebap: 'adana' }, look: { gender: 'e', age: 'orta', skin: '#f5dcc4', hairColor: '#b5651d', hair: 'dalgali', facial: 'kirli', glasses: false, head: 'gunes', hatColor: '#fdebd0', outfit: 'gomlek', outfitColor: '#48c9b0', camera: true }, says: ['Çok lezzetli! Teşekkürler!', 'Blogumda yazacağım, söz.'] }
];

/* ---------- Özel günler ---------- */
KE.SPECIAL = {
  bayram: { name: 'Bayram', desc: 'Bayramlıklarıyla aileler sokakta. Bahşişler bol, herkes güler yüzlü.', hours: {}, types: { aile: 1.9, turist: 1.2, gece: 0.6 }, tip: 1.3, theme: 'bayram' },
  mac: { name: 'Maç akşamı', desc: 'Derbi günü. Akşam taraftarlar akın eder, Beşiktepe yerinden oynar.', hours: { 19: 1.3, 20: 1.6, 21: 2.0, 22: 2.2 }, types: { gece: 1.9, ogrenci: 1.3 }, theme: 'mac' },
  cuma: { name: 'Cuma', desc: 'Cuma namazından sonra öğle kalabalığı her zamankinden büyük.', hours: { 13: 1.5, 14: 1.4 }, types: { isci: 1.2 }, theme: null }
};
KE.specialDay = function (day) {
  const d = KE.dateOf(day);
  const iso = d.toISOString().slice(0, 10);
  if (KE.religiousHolidayOf(day)) return Object.assign({ id: 'bayram' }, KE.SPECIAL.bayram, { name: KE.religiousHolidayOf(day) });
  if (d.getUTCDay() === 6 && Math.floor(day / 7) % 2 === 0) return Object.assign({ id: 'mac' }, KE.SPECIAL.mac);
  if (d.getUTCDay() === 5) return Object.assign({ id: 'cuma' }, KE.SPECIAL.cuma);
  return null;
};

/* ---------- Besi çiftliği ----------
   Hayvanlar parti halinde alınır, her gün yem yer, olgunlaşınca kesimhaneye gider; et çiftlik deposundan
   her sabah şubelere sevk edilir. Kendi etimizle pişen ürünlerde kalite +0.25. */
KE.FARM_COST = 650000;
KE.FARM_MONTHLY = 38000;   // bakıcı ücreti, enerji, veteriner
KE.FARM = {
  dana:  { name: 'Dana', unit: 'baş', young: 44000, feed: 1050, days: 24, batch: 1, caps: [8, 16, 24], upCost: [0, 160000, 300000],
           yield: { doner: { et: 135 }, kebap: { kiyma: 135 } }, desc: 'Döner ve kıyma için besi danası. Uzun büyür, çok et verir.' },
  kuzu:  { name: 'Kuzu', unit: 'baş', young: 7400, feed: 230, days: 14, batch: 1, caps: [24, 48, 72], upCost: [0, 90000, 170000],
           yield: { doner: { kuzu: 15 }, kebap: { kuzu: 11, kiyma: 4, ciger: 0.9 } }, desc: 'Şiş, cağ ve ciğer için kuzu.' },
  tavuk: { name: 'Tavuk', unit: 'adet', young: 60, feed: 19, days: 8, batch: 50, caps: [300, 600, 900], upCost: [0, 60000, 120000],
           yield: { doner: { tavuk: 1.05 } }, modes: ['doner'], desc: 'Tavuk döner için kümes. Hızlı döner, ucuz beslenir.' }
};

/* ---------- Usta şablonları (her mod için hazır ustalar; pazarda rastgele olanlar da üretilir) ---------- */
KE.MASTER_TEMPLATES = {
  doner: [
    { name: 'İsmail Usta', region: 'Bursa', gender: 'e', age: 'yasli', spec: { iskender: 5, ekmek_arasi: 3, et_durum: 4 }, speed: 0.85, quality: 0.95, consistency: 0.9, waste: 0.6, teach: 0.8, trait: 'mukemmel' },
    { name: 'Kadir Usta', region: 'Erzurum', gender: 'e', age: 'orta', spec: { cag: 5, et_durum: 3 }, speed: 0.9, quality: 0.9, consistency: 0.85, waste: 0.7, teach: 0.5, trait: 'gosterisci' },
    { name: 'Selim Usta', region: 'İstanbul', gender: 'e', age: 'genc', spec: { tavuk_durum: 4, tavuk_porsiyon: 4, et_durum: 2 }, speed: 1.25, quality: 0.7, consistency: 0.8, waste: 0.5, teach: 0.4, trait: 'hizli' },
    { name: 'Nermin Usta', region: 'Tokat', gender: 'k', age: 'orta', spec: { pilav_ustu: 4, et_durum: 4, ekmek_arasi: 3 }, speed: 1.05, quality: 0.85, consistency: 0.95, waste: 0.4, teach: 0.9, trait: 'sabirli' },
    { name: 'Hasan Usta', region: 'Malatya', gender: 'e', age: 'yasli', spec: { et_durum: 3, ekmek_arasi: 3, iskender: 2, pilav_ustu: 3 }, speed: 1.0, quality: 0.8, consistency: 0.9, waste: 0.5, teach: 0.95, trait: 'sabirli' },
    { name: 'Çırak Burak', region: 'İstanbul', gender: 'e', age: 'genc', role: 'cirak', spec: { tavuk_durum: 2, et_durum: 1 }, speed: 0.95, quality: 0.5, consistency: 0.55, waste: 1.2, teach: 0.1, trait: 'hevesli' }
  ],
  kebap: [
    { name: 'Mahmut Usta', region: 'Adana', gender: 'e', age: 'orta', spec: { adana: 5, beyti: 3 }, speed: 1.0, quality: 0.95, consistency: 0.85, waste: 0.6, teach: 0.6, trait: 'gosterisci' },
    { name: 'Halil Usta', region: 'Şanlıurfa', gender: 'e', age: 'yasli', spec: { urfa: 5, ciger: 5 }, speed: 0.9, quality: 0.95, consistency: 0.9, waste: 0.8, teach: 0.8, trait: 'mukemmel' },
    { name: 'Hüseyin Usta', region: 'Gaziantep', gender: 'e', age: 'orta', spec: { ali_nazik: 4, beyti: 4, lahmacun: 5 }, speed: 1.0, quality: 0.85, consistency: 0.85, waste: 0.6, teach: 0.7, trait: 'sabirli' },
    { name: 'Fatma Usta', region: 'Gaziantep', gender: 'k', age: 'orta', spec: { lahmacun: 5, ali_nazik: 3 }, speed: 1.2, quality: 0.85, consistency: 0.95, waste: 0.4, teach: 0.9, trait: 'hizli' },
    { name: 'Ramazan Usta', region: 'Kahramanmaraş', gender: 'e', age: 'orta', spec: { kuzu_sis: 4, adana: 2, urfa: 2 }, speed: 1.0, quality: 0.8, consistency: 0.95, waste: 0.35, teach: 0.5, trait: 'sabirli' },
    { name: 'Çırak Mehmet', region: 'Hatay', gender: 'e', age: 'genc', role: 'cirak', spec: { adana: 1, lahmacun: 1, kuzu_sis: 1 }, speed: 0.95, quality: 0.5, consistency: 0.55, waste: 1.2, teach: 0.1, trait: 'hevesli' }
  ]
};

KE.TRAITS = {
  mukemmel:   { name: 'Mükemmeliyetçi', desc: 'Yavaş ama kusursuz. Kalite +0.3, hız -%8.', quality: 0.3, speed: -0.08 },
  gosterisci: { name: 'Gösterişçi', desc: 'Müşteri izlerken coşar. Bahşiş +%20, morali düşünce performansı da düşer.', tip: 0.2 },
  hizli:      { name: 'Seri', desc: 'Kuyruk eritmede rakipsiz. Hız +%10.', speed: 0.1 },
  sabirli:    { name: 'Sabırlı', desc: 'Moral dalgalanmalarından az etkilenir, çırak yetiştirmede iyidir.', moraleStable: 0.5, teachBonus: 0.3 },
  huysuz:     { name: 'Huysuz', desc: 'İyi günde iyidir. Moral 40\'ın altına inince kalite sert düşer.', grumpy: true },
  'hevesli':  { name: 'Hevesli', desc: 'Hızlı öğrenir. Deneyim kazancı +%50.', xp: 0.5 },
  sohbet:     { name: 'Sohbet ehli', desc: 'Müşteriyle hemen kaynaşır. Servisteyken bahşiş +%15.', tip: 0.15 }
};

/* ---------- Diğer roller ---------- */
KE.ROLES = {
  usta:     { name: 'Usta', cooks: true },
  cirak:    { name: 'Çırak', cooks: true },
  kasiyer:  { name: 'Kasiyer', baseWage: 36000, desc: 'Kasada siparişi ve ödemeyi alır. Gerekirse servise de geçer.' },
  garson:   { name: 'Garson / Komi', baseWage: 35000, desc: 'Hazır yemeği tezgâhtan alıp masaya götürür, masaları toplar. Sohbeti bahşişi artırır.' },
  kurye:    { name: 'Kurye', baseWage: 40000, desc: 'Paket siparişleri getirir ve taşır. Mutfağa ek iş, kasaya ek ciro.' },
  temizlik: { name: 'Temizlik görevlisi', baseWage: 33030, desc: 'Salonu temiz tutar, kirli masaları toplar. Denetimde hayat kurtarır.' },
  mudur:    { name: 'Şube müdürü', baseWage: 70000, desc: 'Ekibi yoğunluğa göre kendisi yönetir, mola düzenini kurar, herkesi biraz hızlandırır.' }
};

/* ---------- İsim ve görünüm havuzları ---------- */
KE.NAMES = {
  e: ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'Murat', 'Ömer', 'Yusuf', 'Emre', 'Burak', 'Cem', 'Kemal', 'Serkan', 'Tarık', 'Orhan', 'Volkan', 'Kerem', 'Can', 'Sinan', 'Erkan', 'Recep', 'Halil', 'Yasin', 'Barış', 'Onur', 'Deniz', 'Uğur', 'Levent'],
  k: ['Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Esra', 'Büşra', 'Derya', 'Gül', 'Selin', 'Nur', 'Sevgi', 'Nermin', 'Hülya', 'Seda', 'Ebru', 'Aslı', 'Pınar', 'Tuğba', 'Gizem', 'Nazlı', 'Yeşim']
};
KE.SKINS = ['#f3d2b3', '#e8b98f', '#d9a273', '#c68b5c', '#a86f45', '#8a5634', '#f5dcc4'];
KE.HAIR_COLORS = ['#1c1410', '#2b1d14', '#4a2f1d', '#6b4423', '#8d5a2b', '#a0a0a0', '#d8d8d8', '#b5651d'];

/* ---------- Hikâye hedefleri ---------- */
KE.GOALS = [
  { id: 'ilkhafta', name: 'İlk haftayı kârla kapat', desc: 'İlk 7 günün toplam net sonucu artıda olsun.', reward: 25000 },
  { id: 'itibar50', name: 'Mahallenin gözdesi', desc: 'İtibarı 50\'ye çıkar.', reward: 30000 },
  { id: 'usta5', name: 'Usta yetiştir', desc: 'Bir çırağı mentor yanında yetiştirip ustalığa terfi ettir.', reward: 30000 },
  { id: 'kostum', name: 'Takım ruhu', desc: 'Bütün çalışanlarına temel önlük dışında bir kostüm giydir.', reward: 15000 },
  { id: 'konsept', name: 'Konsept sahibi', desc: 'Bir şubede aynı tarzdan 3 dekor öğesiyle konsept bonusunu aç.', reward: 30000 },
  { id: 'ciftlik', name: 'Kendi etimiz', desc: 'Besi çiftliğini satın al.', reward: 40000 },
  { id: 'sampiyon', name: 'Semt şampiyonu', desc: 'Bir ay sonunda semtinde "Lüks Kebap"ı geride bırak.', reward: 50000 },
  { id: 'sube2', name: 'İkinci şube', desc: 'Başka bir semtte ikinci dükkânını aç.', reward: 60000 },
  { id: 'ciro1m', name: 'Milyonluk ay', desc: 'Bir ayda 1.000.000 ₺ konsolide ciroya ulaş.', reward: 80000 },
  { id: 'itibar80', name: 'Şehrin efsanesi', desc: 'İtibarı 80\'e çıkar.', reward: 100000 },
  { id: 'sube4', name: 'Kebab Empire', desc: 'Dört şubeli bir zincir kur.', reward: 250000 },
  { id: 'taclar3', name: 'Üç taç', desc: 'Üç ayrı semtte semt şampiyonluğu kazan.', reward: 300000 },
  { id: 'sube7', name: 'Şehrin her köşesinde', desc: 'Yedi semtin hepsinde bir dükkânın olsun.', reward: 400000 },
  { id: 'imparator', name: 'Kebap İmparatoru', desc: '"Lüks Kebap" zincirini satın al ve şehrin tek kebap imparatoru ol.', reward: 0, final: true }
];
/* Oyun sonu: "Lüks Kebap" zincirini satın almak için şartlar */
KE.EMPIRE = { branches: 7, crowns: 3, reputation: 80, price: 75000000 };

/* ---------- Dönemler: oyun dört bölüm hâlinde açılır ----------
   Her dönemin üç şartı vardır; hepsi tamamlanınca bir sonraki döneme geçilir ve yeni yerler açılır. */
KE.ERAS = [
  { n: 1, name: 'Mahalle dükkânı', story: 'Babadan kalan dükkânı ayağa kaldır, mahallenin güvenini kazan.',
    req: [{ id: 'hafta', label: 'Bir haftayı kârla kapat' }, { id: 'ay1', label: 'Bir ayı kârla kapat' }, { id: 'rep40', label: 'İtibar 40' }, { id: 'upg', label: 'Bir ekipmanı yükselt' }] },
  { n: 2, name: 'Semtin yıldızı', story: 'Adını semtte duyur, yeni dükkânlar aç. "Lüks Kebap" seni fark etti.',
    req: [{ id: 'sube4', label: 'Dört şubeli zincir' }, { id: 'ciro5m', label: 'Bir ayda 5 milyon ₺ ciro', mode: 'doner' }, { id: 'ciro4m', label: 'Bir ayda 4 milyon ₺ ciro', mode: 'kebap' }, { id: 'rep65', label: 'İtibar 65' }] },
  { n: 3, name: 'Şehrin zinciri', story: 'Şehrin dört bir yanına yayıl. Büyük yatırımlar ve toplu siparişler artık senin işin.',
    req: [{ id: 'sube6', label: 'Altı şubeli zincir' }, { id: 'taclar2', label: 'İki semtte taç kazan' }, { id: 'imza2', label: 'İmza tarifi 2. seviyeye çıkar' }, { id: 'kontrat6', label: 'On toplu sipariş teslim et' }] },
  { n: 4, name: 'İmparatorluk yolu', story: 'Son hesaplaşma: "Lüks Kebap"ı satın al, şehrin tek kebap imparatoru ol.', req: [] }
];
/* Hangi yer hangi dönemde açılır (listede olmayan yerler baştan açık) */
KE.PLACE_ERA = { ajans: 2, subeler: 2, ciftlik: 3 };

/* ---------- Büyük yatırımlar (3. dönem) ---------- */
KE.SIGNATURE = { cost: [300000, 800000, 2000000], days: 10, traffic: 0.08, names: ['Usta işi', 'Şehrin tarifi', 'Efsane tarif'] };
KE.FLAGSHIP = { cost: 2500000, traffic: 1.15, chain: 1.05 };
/* ---------- Vakıf ve sponsorluk (3. dönem): geç oyunun para yutağı, kalıcı küçük etkiler ---------- */
KE.CHARITY = [
  { id: 'takim', name: 'Mahalle takımı sponsorluğu', icon: 'users', cost: [3000000, 8000000, 18000000], desc: 'Formalarda zincirin adı. Her seviye bütün şubelerde müşteri +%2.' },
  { id: 'okul', name: 'Okul bağışı', icon: 'book', cost: [2500000, 7000000, 16000000], desc: 'Mahalle okuluna kütüphane ve burs. Her seviye itibar +3 ve müşterinin fiyat toleransı +%1.' },
  { id: 'asevi', name: 'Aşevi', icon: 'heart', cost: [2000000, 6000000, 14000000], desc: 'Her akşam kapıda sıcak yemek. Her seviye itibarın tepede aşınmasını %25 azaltır; ekip morali +3.' }
];
KE.CONTRACT_KINDS = [
  { id: 'stadyum', name: 'Stadyum maç günü', who: 'Kulüp yönetimi', qty: [300, 600], morale: 8 },
  { id: 'fabrika', name: 'Fabrika yemekhanesi', who: 'Merterli Tekstil', qty: [200, 400], morale: 5 },
  { id: 'dugun', name: 'Düğün salonu', who: 'Bostansahil Düğün Sarayı', qty: [150, 300], morale: 6 },
  { id: 'festival', name: 'Sokak festivali standı', who: 'Belediye kültür müdürlüğü', qty: [250, 500], morale: 7 },
  { id: 'plaza', name: 'Plaza toplantı ikramı', who: 'Kulealtı Finans', qty: [120, 250], morale: 4 },
  { id: 'kampus', name: 'Kampüs bahar şenliği', who: 'Öğrenci birliği', qty: [300, 550], morale: 7 }
];
/* Haftalık meydan okuma türleri */
KE.WEEKLY_KINDS = [
  { kind: 'served', text: 'Bu hafta {t} müşteriye servis yap' },
  { kind: 'match', text: 'Bu hafta {t} kez "Ellerine sağlık!" duy' },
  { kind: 'player', text: 'Bu hafta tezgâhta kendin {t} sipariş hazırla' },
  { kind: 'tips', text: 'Bu hafta {t} bahşiş topla' },
  { kind: 'sat', text: 'Haftanın memnuniyet ortalaması %{t} ve üstü olsun' }
];

/* ---------- Türkçe ek uyumu: özel isimlere kesme işaretiyle ek ----------
   KE.ek('Burak', 'in') → "Burak'ın" · KE.ek('İsmail Usta', 'e') → "İsmail Usta'ya" · KE.ek('Kulealtı', 'de') → "Kulealtı'nda" */
KE.ek = function (word, kind) {
  const w = String(word || ''), lower = w.toLocaleLowerCase('tr');
  const vs = lower.match(/[aeıioöuü]/g); const v = vs ? vs[vs.length - 1] : 'e';
  const last = lower.slice(-1), vowelEnd = /[aeıioöuü]/.test(last), hard = /[çfhkpsşt]/.test(last);
  // istisnalar: ince okunan alıntı isimler (Kemal'in), iyelikli birleşik adlar (Kulealtı'nda, Usta Pazarı'na)
  const thin = /(kemal|cemal|celal|bilal|hilal|ikbal|kemal bey)$/.test(lower);
  const poss = /(.altı|pazarı|bürosu|kahvesi|çiftliği|ajansı|ofisi|sanayi)$/.test(lower) && !/sanayi$/.test(lower);
  const back = !thin && 'aıou'.includes(v), round = 'ouöü'.includes(v);
  const i4 = back ? (round ? 'u' : 'ı') : (round ? 'ü' : 'i'), a2 = back ? 'a' : 'e';
  const d = hard ? 't' : 'd';
  const s = { in: (vowelEnd ? 'n' : '') + i4 + 'n', e: (poss ? 'n' : vowelEnd ? 'y' : '') + a2, de: (poss ? 'n' : '') + (poss ? 'd' : d) + a2, den: (poss ? 'nd' : d) + a2 + 'n', le: (vowelEnd ? 'y' : '') + 'l' + a2, i: (poss ? 'n' : vowelEnd ? 'y' : '') + i4 }[kind];
  return w + "'" + s;
};
/* Sayıya ek: söylenişin son kelimesine göre (15:38 → "otuz sekiz" → 15:38'de, 14:00 → "on dört" → 14:00'te) */
KE.ekSayi = function (str, kind) {
  const W1 = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'], W10 = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  const parts = String(str).split(/[:.]/).map(Number);
  let n = parts.length > 1 && parts[1] !== 0 ? parts[1] : parts[0];
  n = Math.abs(Math.round(n)) % 100;
  const word = n === 0 ? 'sıfır' : n % 10 ? W1[n % 10] : W10[n / 10];
  const suf = KE.ek(word, kind).slice(word.length + 1);
  return str + "'" + suf;
};
/* "de/da" bağlacı: önceki kelimeye uyar (Tavuk Dürüm de, Tavuk Porsiyon da) */
KE.dA = function (word) { const vs = String(word).toLocaleLowerCase('tr').match(/[aeıioöuü]/g); const v = vs ? vs[vs.length - 1] : 'e'; return word + ('aıou'.includes(v) ? ' da' : ' de'); };

/* Tezgâh istasyonları: her tarif adımı birinde yapılır. "ates" süreli istasyondur (pişir ya da ısıt, sonra al):
   dönercide lavaş/ekmek ızgarada ısıtılır, kebapçıda şiş közde pişer. */
KE.STATIONS = [
  { id: 'hamur', name: 'Hamur', ic: 'bread', key: '1' },
  { id: 'et', name: 'Et', ic: 'meat', key: '2' },
  { id: 'ates', name: 'Ateş', ic: 'fire', key: '3' },
  { id: 'sebze', name: 'Sebze', ic: 'leaf', key: '4' },
  { id: 'sos', name: 'Sos', ic: 'drop', key: '5' },
  { id: 'servis', name: 'Servis', ic: 'tray', key: '6' },
  { id: 'fritoz', name: 'Fritöz', ic: 'fries', key: '7' }
];
KE.STEP_STATION = {
  'Lavaş': 'ates', 'Ekmek': 'ates', 'Pide': 'ates', 'Pilav': 'hamur', 'Lavaşa al': 'hamur', 'Hamuru aç': 'hamur', 'Bulgur hamuru': 'hamur', 'Kadayıf': 'hamur',
  'Et': 'et', 'Tavuk': 'et', 'Kes': 'et', 'Dilimle': 'et', 'Şişe sar': 'et', 'Şişe diz': 'et', 'Kebap': 'et', 'İç harç': 'et', 'Peynir': 'et', 'Kapat': 'et',
  'Közde çevir': 'ates', 'Közde pişir': 'ates', 'Şişi çevir': 'ates', 'Kızart': 'ates', 'Fırına ver': 'ates', 'Patlıcan közle': 'ates', 'Eti sotele': 'ates', 'Saç yağla': 'sos',
  'Domates-marul': 'sebze', 'Soğan': 'sebze', 'Domates': 'sebze', 'Turşu': 'sebze', 'Közlenmiş biber': 'sebze', 'Salata': 'sebze', 'Maydanoz-soğan': 'sebze', 'Sumaklı soğan': 'sebze', 'Maydanoz-limon': 'sebze', 'Soğan-maydanoz': 'sebze',
  'Sos': 'sos', 'Domates sosu': 'sos', 'Yoğurt': 'sos', 'Yoğurtla ez': 'sos', 'Tereyağı': 'sos', 'Kızgın tereyağı': 'sos', 'Şerbet': 'sos', 'Fıstık': 'sos',
  'Sar': 'servis', 'Servis': 'servis', 'Lavaşa sar': 'servis',
  'Patates': 'fritoz'
};
KE.stepStation = (label) => KE.STEP_STATION[label] || 'servis';


// ---- js/util.js ----
/* Kebab Empire — ortak yardımcılar (KE.U)
   Motor ve arayüz dosyalarının hepsi buradakileri kullanır; aynı küçük işlevler dosya dosya yeniden yazılmaz.
   DİKKAT — rastgelelik kaynağı: KE.U.rnd ve KE.U.pick oyunun tohumlu akışından (KE.rand, js/sim/rng.js) çeker;
   oyun sonucunu etkileyen her karar bunlarla verilir. Yalnızca görünüşü etkileyen seçimler (kıyafet, saç rengi…)
   tohumsuz Math.random kullanır (bkz. characters.js pickCosmetic), yoksa yeniden oynatma bozulur. */
window.KE = window.KE || {};
(function () {
  /** v değerini [a, b] aralığına sıkıştırır
   * @param {number} v
   * @param {number} a alt sınır
   * @param {number} b üst sınır
   * @returns {number}
   */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  KE.U = {
    clamp,
    /** [a, b) aralığında tohumlu rastgele sayı
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    rnd: (a, b) => a + KE.rand() * (b - a),
    /** dizinin tohumlu rastgele bir elemanı
     * @template T
     * @param {T[]} a
     * @returns {T}
     */
    pick: (a) => a[Math.floor(KE.rand() * a.length)],
    /** oyunun mod verisi (döner / kebap)
     * @param {Game} G
     * @returns {any} KE.MODES[G.mode]: products, equipment…
     */
    mode: (G) => KE.MODES[G.mode],
    /** ürün kimliğinden ürün verisi
     * @param {Game} G
     * @param {string} pid ürün kimliği
     * @returns {any} ürün (bulunamazsa undefined)
     */
    prod: (G, pid) => KE.MODES[G.mode].products.find((x) => x.id === pid)
  };
  /* Kimlikten şube / çalışan: bulunamazsa null döner (eski ya da silinmiş kimlik hata fırlatmasın) */
  /** @type {(G: Game, id: string) => Branch | null} */
  KE.branchById = (G, id) => (G && G.branches.find((x) => x.id === id)) || null;
  /** @type {(G: Game, id: string) => Staff | null} */
  KE.staffById = (G, id) => (G && G.staff.find((x) => x.id === id)) || null;
})();


// ---- js/calendar.js ----
/* Kebab Empire — takvim: dini ve resmî bayramlar, Ramazan, iftar saati, yıllık ekonomi ayarları.
   Hiçbir tarih elle yazılmaz: hicri tarihler tablo usulü (aritmetik) hicri takvimden, iftar saati
   İstanbul'un gün batımından hesaplanır. Diyanet'in ilan ettiği tarihlerle bir gün kayma olabilecek
   yıllar için KE.CAL.OVERRIDES kullanılır (uzaktan ayarla da güncellenebilir). */
(function () {
  /** @type {any} */
  const C = KE.CAL = {};
  const DAY = 86400000;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);

  /* ---------- Hicri ↔ Miladi (tablo usulü, 30 yıllık döngü) ---------- */
  const EPOCH = 1948439.5; // 1 Muharrem 1 (Julyen gün sayısı)
  const jdToMs = (jd) => (jd - 2440587.5) * DAY;
  const msToJd = (ms) => ms / DAY + 2440587.5;
  C.hijriToUtc = (y, m, d) => jdToMs(d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + EPOCH - 1);
  C.utcToHijri = function (ms) {
    const jd = Math.floor(msToJd(ms)) + 0.5;
    const y = Math.floor((30 * (jd - EPOCH) + 10646) / 10631);
    const m = Math.min(12, Math.ceil((jd - (29 + C.hijriToJd(y, 1, 1))) / 29.5) + 1);
    const d = jd - C.hijriToJd(y, m, 1) + 1;
    return { y, m, d };
  };
  C.hijriToJd = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + EPOCH - 1;

  /* Diyanet takvimiyle bilinen farklar: { 'H1447-9': '2026-02-19' } biçiminde ayın ilk günü */
  C.OVERRIDES = {
    'H1447-9': '2026-02-19', 'H1447-10': '2026-03-20', 'H1447-12': '2026-05-18',
    'H1448-9': '2027-02-08', 'H1448-10': '2027-03-09', 'H1448-12': '2027-05-07'
  };
  /* Hicri ayın ilk gününün UTC zaman damgası */
  C.monthStart = function (hy, hm) {
    const o = C.OVERRIDES['H' + hy + '-' + hm];
    return o ? Date.parse(o + 'T00:00:00Z') : C.hijriToUtc(hy, hm, 1);
  };

  /* ---------- Bir yılın bayram ve tatil tablosu (önbellekli) ---------- */
  const NATIONAL = [['01-01', 'Yılbaşı'], ['04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'], ['05-01', 'Emek ve Dayanışma Günü'], ['05-19', 'Gençlik ve Spor Bayramı'], ['07-15', 'Demokrasi ve Millî Birlik Günü'], ['08-30', 'Zafer Bayramı'], ['10-29', 'Cumhuriyet Bayramı']];
  const cache = {};
  C.year = function (gy) {
    if (cache[gy]) return cache[gy];
    const out = { holidays: {}, religious: {}, ramazans: [] };
    NATIONAL.forEach(([md, n]) => { out.holidays[gy + '-' + md] = n; });
    const lo = Date.UTC(gy, 0, 1), hi = Date.UTC(gy + 1, 0, 1);
    const h0 = C.utcToHijri(lo).y;
    for (let hy = h0 - 1; hy <= h0 + 1; hy++) {
      const ram = C.monthStart(hy, 9), sev = C.monthStart(hy, 10), zil = C.monthStart(hy, 12);
      if (ram < hi && sev > lo) out.ramazans.push({ start: iso(ram), end: iso(sev - DAY) });
      for (let i = 0; i < 3; i++) { const t = sev + i * DAY; if (t >= lo && t < hi) out.religious[iso(t)] = out.holidays[iso(t)] = 'Ramazan Bayramı'; }
      for (let i = 9; i < 13; i++) { const t = zil + i * DAY; if (t >= lo && t < hi) out.religious[iso(t)] = out.holidays[iso(t)] = 'Kurban Bayramı'; }
    }
    out.ramazan = out.ramazans.find((r) => r.start.slice(0, 4) === String(gy)) || out.ramazans[0] || null;
    return (cache[gy] = out);
  };
  C.holidayOn = (t) => C.year(new Date(t).getUTCFullYear()).holidays[iso(t)] || null;
  C.religiousOn = (t) => C.year(new Date(t).getUTCFullYear()).religious[iso(t)] || null;
  /* Ramazan'daysa { start, end, dayNo } */
  C.ramazanOn = function (t) {
    const s = iso(t);
    for (const r of C.year(new Date(t).getUTCFullYear()).ramazans) {
      if (s >= r.start && s <= r.end) return Object.assign({ dayNo: Math.round((Date.parse(s) - Date.parse(r.start)) / DAY) + 1 }, r);
    }
    return null;
  };
  /* Ayda bayram var mı (ikramiye için): ay anahtarı → bayram adı */
  C.bonusMonth = function (key) {
    const [y, m] = key.split('-').map(Number);
    const hol = C.year(y).religious;
    const k = Object.keys(hol).find((d) => +d.slice(5, 7) === m);
    return k ? hol[k] : null;
  };

  /* ---------- Gün batımı (NOAA yaklaşımı), İstanbul: 41.01K, 28.98D, UTC+3 ---------- */
  C.LAT = 41.0082; C.LON = 28.9784; C.TZ = 3;
  C.sunsetMinute = function (t) {
    const d = new Date(t);
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const n = Math.floor((t - start) / DAY);
    const rad = Math.PI / 180;
    const g = 2 * Math.PI / 365 * (n - 1 + 0.5);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(C.LAT * rad) * Math.cos(decl)) - Math.tan(C.LAT * rad) * Math.tan(decl)) / rad;
    const utcMin = 720 - 4 * (C.LON - ha) - eq;
    return Math.round(utcMin + C.TZ * 60 + 2); // +2 dk Diyanet temkini
  };

  /* ---------- Yıllık ekonomi ayarları ----------
     Bilinen yıllar elle; sonrası son bilinen yıldan yıllık artışla türetilir. */
  C.ECON_YEARS = {
    2026: { asgariBrut: 33030, gvDilim: [[190000, 0.15], [400000, 0.20], [1500000, 0.27], [5300000, 0.35], [Infinity, 0.40]] }
  };
  C.ECON_GROWTH = 1.27; // bilinmeyen yıllar için asgari ücret ve dilim artışı
  C.econYear = function (y) {
    if (C.ECON_YEARS[y]) return C.ECON_YEARS[y];
    const known = Object.keys(C.ECON_YEARS).map(Number).filter((k) => k < y).sort((a, b) => b - a)[0] || 2026;
    const base = C.ECON_YEARS[known], k = Math.pow(C.ECON_GROWTH, y - known);
    return { asgariBrut: Math.round(base.asgariBrut * k / 10) * 10, gvDilim: base.gvDilim.map(([lim, r]) => [lim === Infinity ? Infinity : Math.round(lim * k / 1000) * 1000, r]) };
  };
  /* Oyunun içinde bulunduğu yılın ayarlarını KE.ECON'a uygula */
  C.applyYear = function (y) {
    const e = C.econYear(y);
    KE.ECON.asgariBrut = e.asgariBrut;
    KE.ECON.gvDilim = e.gvDilim;
    KE.ECON.year = y;
  };
})();


// ---- js/characters.js ----
/* Kebab Empire — SVG karakter oluşturucu
   Katmanlı parçalar: saç (arka), gövde ve kıyafet, boyun, kulak, yüz, saç (ön), kaş, göz, burun, ağız, bıyık/sakal, gözlük, başlık.
   KE.portrait: göğüs hizası portre. KE.figure: tam boy (yürür, tepsi taşır).
   Çizgi dili: yarı saydam koyu kahve kontur, yumuşak ten gölgesi, saçta parlama. */
(function () {
  let uid = 0;
  /* görünüş seçimi: tohumsuz Math.random (oyun sonucunu etkilemez, yeniden oynatmaya girmez) */
  const pickCosmetic = (a) => a[Math.floor(Math.random() * a.length)];
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  const INK = '#3b2417';
  const OL = `stroke="${INK}" stroke-opacity=".5" stroke-width="1.5" stroke-linejoin="round"`;

  function hairBack(l) {
    const c = l.hairColor;
    if (l.head === 'basortusu') return '';
    if (l.hair === 'uzun') return `<path d="M33 52 Q29 22 60 20 Q91 22 87 52 L91 102 Q60 112 29 102 Z" fill="${shade(c, -12)}" ${OL}/>`;
    if (l.hair === 'topuz') return `<circle cx="60" cy="21" r="10.5" fill="${c}" ${OL}/><path d="M54 17 q6 -4 12 0" stroke="${shade(c, 45)}" stroke-width="2" fill="none" opacity=".7"/>`;
    return '';
  }
  function hairFront(l) {
    const c = l.hairColor, hl = shade(c, 50);
    if (['basortusu', 'pusi', 'kalpak', 'kask', 'sefsapka', 'baret'].includes(l.head) && l.hair !== 'uzun') {
      return l.head === 'sefsapka' || l.head === 'kalpak' ? `<path d="M36 53 Q37 44 42 42 L42 53Z M84 53 Q83 44 78 42 L78 53Z" fill="${c}"/>` : '';
    }
    const shine = (d) => `<path d="${d}" stroke="${hl}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`;
    switch (l.hair) {
      case 'kel': return `<path d="M35 57 Q34 46 39 41 L42 59Z M85 57 Q86 46 81 41 L78 59Z" fill="${c}" ${OL}/><ellipse cx="52" cy="34" rx="7" ry="3" fill="#fff" opacity=".22"/>`;
      case 'dalgali': return `<path d="M34 55 Q28 29 50 25 Q60 19 72 25 Q92 29 86 55 Q83 42 76 40 Q72 47 64 41 Q58 47 50 41 Q44 47 38 43 Z" fill="${c}" ${OL}/>` + shine('M48 29 q8 -4 16 0');
      case 'uzun': return `<path d="M35 53 Q35 27 60 26 Q85 27 85 53 Q78 35 62 37 Q50 37 42 44 Z" fill="${c}" ${OL}/>` + shine('M46 32 q10 -5 22 -1');
      case 'topuz': return `<path d="M35 53 Q35 27 60 27 Q85 27 85 53 Q80 37 60 36 Q40 37 35 53Z" fill="${c}" ${OL}/>` + shine('M46 32 q12 -5 26 0');
      case 'yan': return `<path d="M34 55 Q33 27 62 26 Q87 28 86 53 Q82 37 70 35 Q52 33 44 39 Q38 43 34 55Z" fill="${c}" ${OL}/>` + shine('M50 30 q12 -4 24 1');
      default: return `<path d="M35 53 Q34 27 60 26 Q86 27 85 53 Q81 37 60 35 Q39 37 35 53Z" fill="${c}" ${OL}/>` + shine('M46 31 q12 -5 26 0');
    }
  }
  function headwear(l, id) {
    const a = l.accent || '#c0392b';
    switch (l.head) {
      case 'sefsapka':
        return `<path d="M38 44 L82 44 L80 34 Q91 26 83 15 Q77 5 66 11 Q60 1 52 9 Q41 3 37 15 Q29 26 40 34Z" fill="#fdfefe" ${OL}/><rect x="38" y="37" width="44" height="8" rx="2" fill="#eef1f2" ${OL}/><path d="M50 14 q4 8 2 18 M66 12 q-2 10 0 20" stroke="#dfe4e6" stroke-width="2" fill="none"/>`;
      case 'kasket': { const h = l.hatColor || '#5d4037'; return `<path d="M34 47 Q34 25 60 24 Q86 25 86 45 Q70 38 50 40 Z" fill="${h}" ${OL}/><path d="M33 47 Q26 50 30 52 Q46 47 60 46 Q48 44 33 47Z" fill="${shade(h, -25)}" ${OL}/><path d="M40 40 Q60 33 82 40" stroke="${shade(h, 30)}" fill="none" stroke-width="1.5"/>`; }
      case 'bone': { const h = l.hatColor || '#2471a3'; return `<path d="M35 47 Q35 23 60 23 Q85 23 85 47 Z" fill="${h}" ${OL}/><path d="M60 47 Q79 44 98 51 Q85 56 60 51Z" fill="${shade(h, -25)}" ${OL}/><circle cx="60" cy="24" r="2.5" fill="${shade(h, 30)}"/>`; }
      case 'gunes': { const h = l.hatColor || '#f5cba7'; return `<ellipse cx="60" cy="37" rx="39" ry="7.5" fill="${h}" ${OL}/><path d="M40 37 Q40 17 60 17 Q80 17 80 37Z" fill="${h}" ${OL}/><rect x="40" y="31" width="40" height="5" fill="${a}"/>`; }
      case 'baret': return `<path d="M33 46 Q33 19 60 19 Q87 19 87 46Z" fill="#f4d03f" ${OL}/><rect x="29" y="43" width="62" height="6" rx="3" fill="#d4ac0d" ${OL}/><path d="M60 19 V44" stroke="#d4ac0d" stroke-width="4"/><path d="M44 28 q6 -6 12 -6" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/>`;
      case 'kask': { const h = l.hatColor || '#c0392b'; return `<path d="M29 62 Q27 16 60 16 Q93 16 91 62 L82 62 Q82 40 60 40 Q38 40 38 62Z" fill="${h}" ${OL}/><path d="M38 47 Q60 39 82 47" stroke="#fdfefe" stroke-width="3" fill="none" opacity=".75"/><path d="M42 26 q8 -6 18 -6" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>`; }
      case 'takke': return `<path d="M37 41 Q39 23 60 23 Q81 23 83 41 Z" fill="${a}" ${OL}/><path d="M39 37 h42" stroke="${shade(a, 60)}" stroke-width="2" stroke-dasharray="3 2"/><path d="M48 30 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3" stroke="${shade(a, 60)}" stroke-width="1.4" fill="none"/>`;
      case 'kalpak': return `<path d="M35 45 L37 17 Q60 9 83 17 L85 45 Q60 39 35 45Z" fill="#2c2420" ${OL}/><path d="M38 23 Q60 17 82 23 M37 31 Q60 25 83 31 M37 39 Q60 33 83 39" stroke="#4d3d33" fill="none" stroke-width="1.6"/>`;
      case 'pusi': {
        const pid = 'p' + id;
        return `<defs><pattern id="${pid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fdfefe"/><rect width="3" height="3" fill="#b03a2e"/><rect x="3" y="3" width="3" height="3" fill="#b03a2e"/></pattern></defs>` +
          `<path d="M32 55 Q29 21 60 19 Q91 21 88 55 Q84 40 60 38 Q36 40 32 55Z" fill="url(#${pid})" ${OL}/><path d="M33 47 Q60 35 87 47" stroke="#7b241c" stroke-width="3.5" fill="none"/><path d="M84 50 q8 10 4 24" stroke="#b03a2e" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      }
      case 'basortusu': {
        const c = l.scarf || '#8e44ad';
        return `<path d="M29 60 Q25 16 60 16 Q95 16 91 60 Q93 88 80 98 Q70 106 60 106 Q50 106 40 98 Q27 88 29 60 Z M38 57 Q40 32 60 32 Q80 32 82 57 Q82 79 72 87 Q60 93 48 87 Q38 79 38 57Z" fill="${c}" fill-rule="evenodd" ${OL}/>` +
          `<path d="M42 28 Q60 21 78 28" stroke="${shade(c, 45)}" stroke-width="1.6" fill="none" stroke-dasharray="2 3"/><path d="M36 40 q-3 20 4 40" stroke="${shade(c, -30)}" stroke-width="2" fill="none" opacity=".5"/>`;
      }
      default: return '';
    }
  }
  function face(l, mood, gid) {
    const dark = '#2a1a12';
    const browY = l.head === 'basortusu' ? 47 : 46;
    let brows, mouth, extra = '';
    if (mood === 'happy') {
      brows = `<path d="M45 ${browY} Q51 ${browY - 4.5} 56 ${browY - 0.5}" /><path d="M64 ${browY - 0.5} Q69 ${browY - 4.5} 75 ${browY}" />`;
      mouth = `<path d="M50 71 Q60 83 70 71 Q60 75 50 71Z" fill="#8e2a22" stroke="${dark}" stroke-width="1.4"/><path d="M53 72.5 Q60 74.5 67 72.5" stroke="#fdfefe" stroke-width="2.2" fill="none"/><path d="M55 78 q5 2.5 10 0" stroke="#e57373" stroke-width="2" fill="none"/>`;
    } else if (mood === 'sad') {
      brows = `<path d="M45 ${browY - 2.5} L56 ${browY + 1}" /><path d="M64 ${browY + 1} L75 ${browY - 2.5}" />`;
      mouth = `<path d="M52 77 Q60 70.5 68 77" fill="none" stroke="${dark}" stroke-width="2"/>`;
    } else if (mood === 'angry') {
      brows = `<path d="M45 ${browY - 3.5} L56 ${browY + 2}" /><path d="M64 ${browY + 2} L75 ${browY - 3.5}" />`;
      mouth = `<path d="M52 76 Q60 71 68 76 L52 76Z" fill="#8e2a22" stroke="${dark}" stroke-width="1.6"/>`;
      extra = `<path d="M78 40 l5 -3 m-3 6 l6 -1" stroke="#e74c3c" stroke-width="1.8"/>`;
    } else {
      brows = `<path d="M45 ${browY} L56 ${browY - 1.2}" /><path d="M64 ${browY - 1.2} L75 ${browY}" />`;
      mouth = `<path d="M53 73.5 Q60 77 67 73.5" fill="none" stroke="${dark}" stroke-width="2"/>`;
    }
    const browColor = l.age === 'yasli' ? '#8d8d8d' : shade(l.hairColor || dark, -10);
    const hc = l.age === 'yasli' ? '#c9c9c9' : (l.hairColor || dark);
    let fh = '';
    if (l.facial === 'biyik') fh = `<path d="M49 69 Q54 64 60 67 Q66 64 71 69 Q66 72 60 70 Q54 72 49 69Z" fill="${hc}" ${OL}/>`;
    if (l.facial === 'gurbiyik') fh = `<path d="M44 71 Q51 61 60 66 Q69 61 76 71 Q73 76 66 72.5 Q60 71.5 54 72.5 Q47 76 44 71Z" fill="${hc}" ${OL}/>`;
    if (l.facial === 'sakal') fh = `<path d="M36 60 Q37 90 60 94 Q83 90 84 60 Q81 75 72 79 Q60 85 48 79 Q39 75 36 60Z" fill="${hc}" ${OL}/><path d="M50 69 Q55 65 60 67 Q65 65 70 69 Q65 71 60 70 Q55 71 50 69Z" fill="${hc}"/>`;
    if (l.facial === 'kirli') fh = `<path d="M38 62 Q40 89 60 92 Q80 89 82 62 Q80 81 60 85 Q40 81 38 62Z" fill="${hc}" opacity=".28"/>`;
    const wr = l.age === 'yasli' ? `<path d="M48 40 Q60 37 72 40 M50 36.5 Q60 34 70 36.5" stroke="#00000026" fill="none"/><path d="M42 58 l-3 2 M78 58 l3 2 M46 63 q-2 3 -1 5 M74 63 q2 3 1 5" stroke="#00000033" fill="none"/>` : '';
    const lash = l.gender === 'k' ? `<path d="M47 53 l-2 -2 M73 53 l2 -2" stroke="${dark}" stroke-width="1.4"/>` : '';
    const glasses = l.glasses ? `<g fill="#ffffff22" stroke="#2c3e50" stroke-width="1.9"><rect x="43.5" y="50" width="15" height="12" rx="5"/><rect x="61.5" y="50" width="15" height="12" rx="5"/><path d="M58.5 55 h3 M43.5 54 l-7 -2 M76.5 54 l7 -2" fill="none"/></g>` : '';
    return `<ellipse cx="45" cy="66" rx="4.8" ry="3" fill="#f07c6c" opacity="${mood === 'happy' ? 0.42 : 0.2}"/><ellipse cx="75" cy="66" rx="4.8" ry="3" fill="#f07c6c" opacity="${mood === 'happy' ? 0.42 : 0.2}"/>` +
      `<g stroke="${browColor}" stroke-width="2.8" fill="none" stroke-linecap="round">${brows}</g>` +
      `<g class="ke-eye"><ellipse cx="51" cy="56" rx="2.9" ry="3.5" fill="${dark}"/><ellipse cx="69" cy="56" rx="2.9" ry="3.5" fill="${dark}"/><circle cx="52.1" cy="54.8" r="1.1" fill="#fff"/><circle cx="70.1" cy="54.8" r="1.1" fill="#fff"/></g>${lash}` +
      `<path d="M60 58 Q56.5 65.5 59 67.5 Q62 68.6 64 66.6" fill="none" stroke="${shade(l.skin, -55)}" stroke-width="1.7" stroke-linecap="round"/>` +
      extra + wr + fh + mouth + glasses;
  }
  function headGroup(l, id, mood) {
    const skin = l.skin, gid = 'sk' + id;
    return `<defs><radialGradient id="${gid}" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${shade(skin, 14)}"/><stop offset=".75" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -22)}"/></radialGradient></defs>` +
      `<ellipse cx="35.5" cy="58" rx="5.2" ry="7.2" fill="${shade(skin, -12)}" ${OL}/><ellipse cx="84.5" cy="58" rx="5.2" ry="7.2" fill="${shade(skin, -12)}" ${OL}/><path d="M35 55 q2 3 0 6 M85 55 q-2 3 0 6" stroke="${shade(skin, -45)}" stroke-width="1.2" fill="none"/>` +
      `<ellipse cx="60" cy="56" rx="24.5" ry="27.5" fill="url(#${gid})" ${OL}/>` +
      hairFront(l) + face(l, mood, gid) + headwear(l, id);
  }

  /* ---------- Göğüs portresi: kıyafet ---------- */
  function outfit(l) {
    const o = l.outfit, c = l.outfitColor || '#c0392b', a = l.accent || '#f4d03f';
    const torso = (fill) => `<path d="M8 132 Q10 100 40 92 L80 92 Q110 100 112 132 Z" fill="${fill}" ${OL}/><path d="M20 132 Q22 108 38 100" stroke="#000" stroke-opacity=".08" stroke-width="8" fill="none"/>`;
    const collar = (fill) => `<path d="M47 92 L60 106 L73 92 L68 90 L60 99 L52 90Z" fill="${fill}" ${OL}/>`;
    switch (o) {
      case 'onluk':
        return torso(l.shirt || '#ecf0f1') + collar(shade(l.shirt || '#ecf0f1', -25)) +
          `<path d="M40 104 L80 104 L85 132 L35 132Z" fill="${c}" ${OL}/><path d="M42 104 L48 92 M78 104 L72 92" stroke="${c}" stroke-width="3.5"/><path d="M44 116 h32" stroke="#000" stroke-opacity=".08" stroke-width="2"/>` +
          (l.logo ? `<circle cx="60" cy="117" r="7.5" fill="${a}" ${OL}/><path d="M56 117 h8 M60 113 v8" stroke="${c}" stroke-width="2"/>` : '');
      case 'sef':
        return torso('#fbfcfc') + `<path d="M47 92 L60 101 L73 92" fill="none" stroke="#d5d8dc" stroke-width="3.5"/><path d="M60 101 L60 132" stroke="#e5e8e8" stroke-width="2"/>` +
          `<g fill="${a}"><circle cx="52" cy="108" r="2.2"/><circle cx="52" cy="119" r="2.2"/><circle cx="68" cy="108" r="2.2"/><circle cx="68" cy="119" r="2.2"/></g><path d="M44 94 h32" stroke="${a}" stroke-width="2.5"/>`;
      case 'yelek':
        return torso('#f4f6f6') + collar('#d5dbdb') +
          `<path d="M14 132 Q16 102 40 94 L54 132Z" fill="${c}" ${OL}/><path d="M106 132 Q104 102 80 94 L66 132Z" fill="${c}" ${OL}/>` +
          `<g fill="${a}"><circle cx="34" cy="108" r="1.8"/><circle cx="40" cy="116" r="1.8"/><circle cx="44" cy="125" r="1.8"/><circle cx="86" cy="108" r="1.8"/><circle cx="80" cy="116" r="1.8"/><circle cx="76" cy="125" r="1.8"/></g>` +
          `<path d="M28 104 Q38 112 46 130 M92 104 Q82 112 74 130" stroke="${a}" stroke-width="1.4" fill="none" opacity=".8"/>`;
      case 'salvar':
        return torso('#fdfefe') + collar('#d5dbdb') +
          `<path d="M16 132 Q18 104 40 95 L50 132Z" fill="#1c2833" ${OL}/><path d="M104 132 Q102 104 80 95 L70 132Z" fill="#1c2833" ${OL}/>` +
          `<rect x="22" y="121" width="76" height="11" fill="${c}" ${OL}/><path d="M22 125 h76 M22 129 h76" stroke="${a}" stroke-width="1.2"/>`;
      case 'beyazceket':
        return torso('#fbfcfc') + `<path d="M46 92 L58 116 L52 132 M74 92 L62 116 L68 132" stroke="#c9cdce" stroke-width="2" fill="none"/>` +
          `<path d="M51 95 L60 100 L51 105Z M69 95 L60 100 L69 105Z" fill="${a}" ${OL}/><circle cx="60" cy="100" r="2.2" fill="${shade(a, -30)}"/>`;
      case 'gomlek':
        return torso(c) + `<path d="M46 92 L60 104 L74 92 L70 89 L60 98 L50 89Z" fill="${shade(c, 25)}" ${OL}/><path d="M60 104 V132" stroke="${shade(c, -30)}" stroke-width="1.5"/>` +
          `<g fill="${shade(c, -40)}"><circle cx="60" cy="112" r="1.4"/><circle cx="60" cy="122" r="1.4"/></g><path d="M34 112 h12 v8 h-12z" fill="none" stroke="${shade(c, -25)}" stroke-width="1.2"/>`;
      case 'takim':
        return torso(c) + `<path d="M48 92 L60 120 L72 92Z" fill="#fdfefe" ${OL}/><path d="M58 98 L62 98 L63.5 118 L60 122 L56.5 118Z" fill="${a}" ${OL}/>` +
          `<path d="M46 92 L58 122 M74 92 L62 122" stroke="${shade(c, -35)}" stroke-width="2.4"/><path d="M84 108 h10" stroke="#fdfefe" stroke-width="3"/>`;
      case 'mont':
        return torso(c) + `<path d="M44 92 Q60 102 76 92 L76 99 Q60 109 44 99Z" fill="${shade(c, -30)}" ${OL}/><path d="M60 103 V132" stroke="${shade(c, 45)}" stroke-width="2.4"/>` +
          `<rect x="28" y="112" width="13" height="3.5" rx="1.5" fill="${a}"/><rect x="79" y="112" width="13" height="3.5" rx="1.5" fill="${a}"/>`;
      case 'reflektif':
        return torso('#5d6d7e') + `<path d="M24 132 Q26 104 44 96 L76 96 Q94 104 96 132Z" fill="#f39c12" ${OL}/>` +
          `<rect x="26" y="114" width="68" height="5.5" fill="#f7f9f9" opacity=".95"/><path d="M60 96 V132" stroke="#d68910" stroke-width="2"/>`;
      case 'hirka':
        return torso(c) + `<path d="M50 92 Q60 100 70 92 L66 132 L54 132Z" fill="${l.shirt || '#f2f3f4'}" ${OL}/>` +
          `<g fill="${shade(c, -40)}"><circle cx="52" cy="110" r="1.6"/><circle cx="53" cy="122" r="1.6"/></g><path d="M24 118 q8 4 16 0" stroke="${shade(c, 30)}" stroke-width="1.6" fill="none"/>`;
      default:
        return torso(c) + `<path d="M48 92 Q60 102 72 92" fill="none" stroke="${shade(c, -35)}" stroke-width="3"/>` +
          (l.print ? `<circle cx="60" cy="117" r="8.5" fill="none" stroke="${a}" stroke-width="2.6"/><path d="M56 117 l3 3 l5 -6" stroke="${a}" stroke-width="2" fill="none"/>` : '');
    }
  }

  KE.portrait = function (l, opts) {
    opts = opts || {};
    const id = ++uid;
    const mood = opts.mood || 'neutral';
    const neck = shade(l.skin, -20);
    const camera = l.camera ? `<path d="M40 94 L60 118 L80 94" stroke="#212f3d" stroke-width="2" fill="none"/><rect x="51" y="113" width="18" height="12" rx="2" fill="#212f3d"/><circle cx="60" cy="119" r="4" fill="#85929e" stroke="#212f3d"/>` : '';
    const scarfNeck = l.neckScarf ? `<path d="M44 90 Q60 100 76 90 L78 98 Q60 108 42 98Z" fill="${l.neckScarf}" ${OL}/>` : '';
    return `<svg class="ke-portrait ${opts.cls || ''}" viewBox="0 0 120 132" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" role="img" aria-label="${opts.label || 'karakter'}">` +
      hairBack(l) + outfit(l) +
      `<path d="M50 76 h20 v16 q-10 6 -20 0z" fill="${neck}"/><path d="M50 80 q10 6 20 0" stroke="#000" stroke-opacity=".12" stroke-width="4" fill="none"/>` +
      scarfNeck + camera + headGroup(l, id, mood) + `</svg>`;
  };

  /* ---------- Tam boy figür ---------- */
  function bodyOutfit(l, pose) {
    const o = l.outfit, c = l.outfitColor || '#c0392b', a = l.accent || '#f4d03f';
    const pants = o === 'salvar' ? '#1c2833' : o === 'takim' ? shade(c, -10) : o === 'reflektif' ? '#34495e' : l.pants || '#3d4b5c';
    const shirt = ['onluk', 'yelek', 'salvar'].includes(o) ? (l.shirt || '#f4f6f6') : o === 'sef' || o === 'beyazceket' ? '#fbfcfc' : o === 'reflektif' ? '#5d6d7e' : c;
    const sleeve = o === 'tisort' ? 'short' : 'long';
    const skin = l.skin;
    const walk = pose === 'walk';
    let s = '';
    /* bacaklar */
    if (l.skirt) {
      s += `<path d="M34 170 L86 170 L94 236 L26 236Z" fill="${l.skirtColor || shade(c, -20)}" ${OL}/><g class="legs"><ellipse cx="46" cy="241" rx="9" ry="4.5" fill="#2c2420"/><ellipse cx="74" cy="241" rx="9" ry="4.5" fill="#2c2420"/></g>`;
    } else {
      const wide = o === 'salvar';
      s += `<g class="leg legL"><path d="M${wide ? 30 : 37} 168 h${wide ? 30 : 22} l-2 64 h-17z" fill="${pants}" ${OL}/><ellipse cx="47" cy="236" rx="11" ry="5" fill="#2c2420" ${OL}/></g>`;
      s += `<g class="leg legR"><path d="M${wide ? 60 : 61} 168 h${wide ? 30 : 22} l-3 64 h-17z" fill="${shade(pants, -8)}" ${OL}/><ellipse cx="74" cy="236" rx="11" ry="5" fill="#2c2420" ${OL}/></g>`;
    }
    /* gövde */
    s += `<path d="M28 104 Q30 94 44 92 L76 92 Q90 94 92 104 L94 174 Q60 182 26 174 Z" fill="${shirt}" ${OL}/>`;
    switch (o) {
      case 'onluk': s += `<path d="M38 106 L82 106 L86 ${l.skirt ? 200 : 214} L34 ${l.skirt ? 200 : 214}Z" fill="${c}" ${OL}/><path d="M40 106 L47 93 M80 106 L73 93" stroke="${c}" stroke-width="3.5"/><path d="M36 150 h48" stroke="#000" stroke-opacity=".1" stroke-width="3"/>` + (l.logo ? `<circle cx="60" cy="126" r="8" fill="${a}" ${OL}/><path d="M56 126 h8 M60 122 v8" stroke="${c}" stroke-width="2"/>` : ''); break;
      case 'sef': s += `<path d="M60 100 V176" stroke="#e1e5e6" stroke-width="2"/><g fill="${a}"><circle cx="51" cy="114" r="2.2"/><circle cx="51" cy="130" r="2.2"/><circle cx="51" cy="146" r="2.2"/><circle cx="69" cy="114" r="2.2"/><circle cx="69" cy="130" r="2.2"/><circle cx="69" cy="146" r="2.2"/></g>`; break;
      case 'yelek': s += `<path d="M28 104 Q30 94 44 92 L54 172 L27 172Z" fill="${c}" ${OL}/><path d="M92 104 Q90 94 76 92 L66 172 L93 172Z" fill="${c}" ${OL}/><path d="M33 110 Q42 130 46 166 M87 110 Q78 130 74 166" stroke="${a}" stroke-width="1.6" fill="none"/>`; break;
      case 'salvar': s += `<path d="M28 104 Q30 94 44 92 L50 150 L28 150Z" fill="#1c2833" ${OL}/><path d="M92 104 Q90 94 76 92 L70 150 L92 150Z" fill="#1c2833" ${OL}/><rect x="25" y="156" width="70" height="16" rx="3" fill="${c}" ${OL}/><path d="M25 161 h70 M25 166 h70" stroke="${a}" stroke-width="1.4"/><path d="M84 168 l6 18 l-8 -2z" fill="${c}"/>`; break;
      case 'beyazceket': s += `<path d="M46 92 L58 130 L52 176 M74 92 L62 130 L68 176" stroke="#c9cdce" stroke-width="2" fill="none"/><path d="M51 96 L60 101 L51 106Z M69 96 L60 101 L69 106Z" fill="${a}" ${OL}/>`; break;
      case 'takim': s += `<path d="M48 92 L60 128 L72 92Z" fill="#fdfefe"/><path d="M58 98 L62 98 L63.5 124 L60 128 L56.5 124Z" fill="${a}"/><path d="M46 92 L58 132 L56 176 M74 92 L62 132 L64 176" stroke="${shade(c, -35)}" stroke-width="2.4" fill="none"/>`; break;
      case 'mont': s += `<path d="M60 100 V176" stroke="${shade(c, 45)}" stroke-width="2.6"/><path d="M28 150 h64" stroke="${shade(c, -25)}" stroke-width="2"/><rect x="30" y="118" width="13" height="4" rx="1.5" fill="${a}"/><rect x="77" y="118" width="13" height="4" rx="1.5" fill="${a}"/>`; break;
      case 'reflektif': s += `<path d="M30 100 L90 100 L92 172 L28 172Z" fill="#f39c12" ${OL}/><rect x="29" y="126" width="62" height="6" fill="#fdfefe"/><rect x="29" y="148" width="62" height="6" fill="#fdfefe"/>`; break;
      case 'hirka': s += `<path d="M28 104 Q30 94 44 92 L54 196 L24 194Z" fill="${c}" ${OL}/><path d="M92 104 Q90 94 76 92 L66 196 L96 194Z" fill="${c}" ${OL}/>`; break;
      case 'gomlek': s += `<path d="M46 92 L60 104 L74 92 L70 89 L60 98 L50 89Z" fill="${shade(c, 25)}" ${OL}/><path d="M60 104 V174" stroke="${shade(c, -30)}" stroke-width="1.5"/><rect x="26" y="166" width="68" height="7" fill="#3b2a20" opacity=".85"/>`; break;
      default: s += (l.print ? `<circle cx="60" cy="128" r="10" fill="none" stroke="${a}" stroke-width="3"/>` : '');
    }
    return { legsTorso: s, shirt, sleeve, skin, walk };
  }
  KE.figure = function (l, opts) {
    opts = opts || {};
    const id = ++uid;
    const mood = opts.mood || 'neutral';
    const pose = opts.pose || 'stand';
    const B = bodyOutfit(l, pose);
    const arm = (side, up) => {
      const sx = side === 'L' ? 30 : 90;
      const ex = side === 'L' ? 22 : 98;
      const col = (l.outfit === 'yelek' || l.outfit === 'onluk' || l.outfit === 'salvar') ? B.shirt : (l.outfit === 'reflektif' ? '#5d6d7e' : B.shirt);
      if (up) return `<path d="M${sx} 104 Q104 118 100 134" stroke="${col}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${sx} 104 Q104 118 100 134" stroke="${INK}" stroke-opacity=".25" stroke-width="15" fill="none" stroke-linecap="round" style="mix-blend-mode:multiply"/><circle cx="100" cy="136" r="6" fill="${B.skin}" ${OL}/>`;
      const short = B.sleeve === 'short';
      return `<g class="arm arm${side}"><path d="M${sx} 104 L${ex} 164" stroke="${short ? B.skin : col}" stroke-width="12" stroke-linecap="round"/>${short ? `<path d="M${sx} 104 L${(sx + ex) / 2} 128" stroke="${col}" stroke-width="13" stroke-linecap="round"/>` : ''}<circle cx="${ex}" cy="167" r="6" fill="${B.skin}" ${OL}/></g>`;
    };
    const tray = opts.tray ? `<g class="tray"><ellipse cx="102" cy="132" rx="22" ry="5" fill="#bdc3c7" ${OL}/>${opts.trayDish ? `<g transform="translate(86 104) scale(.5)">${opts.trayDish}</g>` : ''}</g>` : '';
    return `<svg class="ke-figure ${pose === 'walk' ? 'walking' : ''} ${opts.cls || ''}" viewBox="0 -4 124 252" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" role="img" aria-label="${opts.label || 'karakter'}">` +
      `<ellipse cx="60" cy="242" rx="34" ry="6" fill="#000" opacity=".16"/>` +
      hairBack(l) + arm('L') + (opts.tray ? '' : arm('R')) + B.legsTorso +
      `<path d="M50 76 h20 v16 q-10 6 -20 0z" fill="${shade(l.skin, -20)}"/>` +
      (opts.tray ? arm('R', true) + tray : '') +
      headGroup(l, id, mood) + `</svg>`;
  };
  KE.moodFromValue = (v) => v >= 72 ? 'happy' : v >= 45 ? 'neutral' : v >= 25 ? 'sad' : 'angry';

  /* Görünüm üreticiler */
  KE.randomLook = function (gender, age, extra) {
    const male = gender === 'e';
    const l = {
      gender, age,
      skin: pickCosmetic(KE.SKINS),
      hairColor: age === 'yasli' ? pickCosmetic(['#9e9e9e', '#bdbdbd', '#d0d0d0']) : pickCosmetic(KE.HAIR_COLORS.slice(0, 5)),
      hair: male ? pickCosmetic(age === 'yasli' ? ['kel', 'kisa', 'kel'] : ['kisa', 'dalgali', 'yan', 'kisa']) : pickCosmetic(['uzun', 'topuz', 'uzun', 'dalgali']),
      facial: male ? pickCosmetic(age === 'genc' ? ['none', 'none', 'kirli', 'biyik'] : ['biyik', 'gurbiyik', 'sakal', 'kirli', 'none']) : 'none',
      glasses: Math.random() < (age === 'yasli' ? 0.45 : 0.15),
      head: 'none', outfit: 'tisort', outfitColor: pickCosmetic(['#c0392b', '#2471a3', '#229954', '#d68910', '#7d3c98', '#1abc9c', '#34495e']),
      accent: pickCosmetic(['#f4d03f', '#fdfefe', '#ec7063', '#5dade2'])
    };
    l.pants = pickCosmetic(['#2e3b4e', '#3d4b5c', '#4a3b2f', '#22313f', '#5b6770', '#1f4e79']);
    if (!male && age !== 'genc' && Math.random() < 0.5) { l.skirt = true; l.skirtColor = pickCosmetic(['#5b2c6f', '#1a5276', '#7b241c', '#4d5656', '#145a32']); }
    if (!male && Math.random() < 0.45) { l.head = 'basortusu'; l.scarf = pickCosmetic(['#8e44ad', '#16a085', '#c0392b', '#2e86c1', '#d35400', '#784212', '#1f618d', '#b7950b']); }
    return Object.assign(l, extra || {});
  };

  KE.customerLook = function (type) {
    const r = Math.random();
    let gender = r < 0.55 ? 'e' : 'k', age = pickCosmetic(['genc', 'orta', 'orta', 'yasli']);
    if (type === 'ogrenci' || type === 'gece') age = 'genc';
    if (type === 'isci') gender = Math.random() < 0.9 ? 'e' : 'k';
    const l = KE.randomLook(gender, age);
    switch (type) {
      case 'ogrenci': l.outfit = pickCosmetic(['tisort', 'mont', 'tisort']); l.print = true; if (l.head === 'none' && Math.random() < 0.3) { l.head = 'bone'; l.hatColor = pickCosmetic(['#2471a3', '#c0392b', '#1e8449', '#212f3d']); } break;
      case 'beyaz': l.outfit = pickCosmetic(['takim', 'gomlek']); l.outfitColor = pickCosmetic(['#1b2631', '#2e4053', '#5d6d7e', '#aed6f1', '#fdfefe']); l.accent = pickCosmetic(['#922b21', '#1f618d', '#7d3c98']); l.glasses = Math.random() < 0.35; break;
      case 'aile': l.outfit = pickCosmetic(['gomlek', 'hirka', 'tisort']); l.age = age === 'genc' ? 'orta' : age; break;
      case 'gurme': l.outfit = pickCosmetic(['gomlek', 'takim']); l.glasses = true; l.outfitColor = pickCosmetic(['#4a235a', '#0e6655', '#6e2c00', '#1b2631']); l.neckScarf = Math.random() < 0.5 ? '#c0392b' : null; break;
      case 'turist': l.skin = pickCosmetic(['#f5dcc4', '#f3d2b3', '#e8b98f', '#8a5634', '#c68b5c']); l.hairColor = pickCosmetic(['#e3c16f', '#b5651d', '#2b1d14', '#d4a76a']); if (l.head === 'basortusu') l.head = 'none'; if (Math.random() < 0.5) { l.head = 'gunes'; l.hatColor = pickCosmetic(['#f5cba7', '#fdebd0', '#d5f5e3']); } l.camera = Math.random() < 0.6; l.outfit = pickCosmetic(['tisort', 'gomlek']); l.outfitColor = pickCosmetic(['#48c9b0', '#f5b041', '#5dade2', '#f1948a']); break;
      case 'isci': l.outfit = 'reflektif'; if (Math.random() < 0.6 && l.head !== 'basortusu') l.head = 'baret'; break;
      case 'gece': l.outfit = pickCosmetic(['mont', 'tisort']); l.outfitColor = pickCosmetic(['#17202a', '#512e5f', '#7b241c', '#0b5345']); l.print = true; break;
    }
    return l;
  };

  /* Çalışan görünümü: rol + kostüm + yöre */
  KE.staffLook = function (s) {
    const l = Object.assign({}, s.look);
    const reg = KE.REGIONS[s.region] || KE.REGIONS['İstanbul'];
    const brand = '#c0392b';
    l.head = l.head === 'basortusu' ? 'basortusu' : 'none';
    const keepScarf = l.head === 'basortusu';
    switch (s.costume) {
      case 'yoresel':
        l.outfit = reg.outfit; l.outfitColor = reg.color; l.accent = reg.accent;
        if (!keepScarf && reg.head !== 'none') l.head = reg.head;
        break;
      case 'sef':
        l.outfit = 'sef'; l.accent = brand; if (!keepScarf) l.head = 'sefsapka'; break;
      case 'markali':
        l.outfit = 'onluk'; l.outfitColor = brand; l.accent = '#f4d03f'; l.logo = true; l.shirt = '#fdfefe'; break;
      default:
        l.outfit = 'onluk'; l.outfitColor = '#f2f3f4'; l.shirt = s.role === 'temizlik' ? '#5dade2' : '#d6eaf8'; l.logo = false;
    }
    if (s.costume === 'temel' || s.costume === 'markali') {
      if (s.role === 'kurye') { l.outfit = 'mont'; l.outfitColor = s.costume === 'markali' ? brand : '#e67e22'; l.accent = '#f4d03f'; }
      if (s.role === 'mudur') { l.outfit = 'takim'; l.outfitColor = '#1b2631'; l.accent = brand; }
      if (s.role === 'kasiyer' || s.role === 'garson') { l.outfit = 'gomlek'; l.outfitColor = s.costume === 'markali' ? brand : '#34495e'; }
    }
    return l;
  };

  /* Sabit hikâye karakterleri */
  KE.CAST = {
    zeynep: { name: 'Zeynep Hanım', role: 'Muhasebeci', look: { gender: 'k', age: 'orta', skin: '#e8b98f', hairColor: '#2b1d14', hair: 'topuz', facial: 'none', glasses: true, head: 'none', outfit: 'gomlek', outfitColor: '#1f618d' } },
    ayse: { name: 'Ayşe Teyze', role: 'Müdavim', look: { gender: 'k', age: 'yasli', skin: '#e8b98f', hairColor: '#bdbdbd', hair: 'uzun', facial: 'none', glasses: true, head: 'basortusu', scarf: '#7d3c98', outfit: 'hirka', outfitColor: '#922b21', shirt: '#f5eef8' } },
    riza: { name: 'Kasap Rıza', role: 'Tedarikçi', look: { gender: 'e', age: 'orta', skin: '#d9a273', hairColor: '#1c1410', hair: 'kisa', facial: 'gurbiyik', glasses: false, head: 'none', outfit: 'onluk', outfitColor: '#fbfcfc', shirt: '#c0392b' } },
    bulent: { name: 'Bülent Bey', role: 'Belediye müfettişi', look: { gender: 'e', age: 'orta', skin: '#f3d2b3', hairColor: '#4a2f1d', hair: 'yan', facial: 'biyik', glasses: true, head: 'none', outfit: 'takim', outfitColor: '#5d6d7e', accent: '#1f618d' } },
    emre: { name: 'Kurye Emre', role: 'Kurye', look: { gender: 'e', age: 'genc', skin: '#c68b5c', hairColor: '#1c1410', hair: 'kisa', facial: 'kirli', glasses: false, head: 'kask', hatColor: '#e74c3c', outfit: 'mont', outfitColor: '#e67e22', accent: '#f4d03f' } },
    rakip: { name: 'Cüneyt Bey', role: '"Lüks Kebap" sahibi', look: { gender: 'e', age: 'orta', skin: '#f3d2b3', hairColor: '#1c1410', hair: 'yan', facial: 'kirli', glasses: false, head: 'none', outfit: 'takim', outfitColor: '#4a235a', accent: '#d4ac0d' } },
    banker: { name: 'Sevim Hanım', role: 'Banka şube müdürü', look: { gender: 'k', age: 'orta', skin: '#f3d2b3', hairColor: '#6b4423', hair: 'uzun', facial: 'none', glasses: false, head: 'none', outfit: 'takim', outfitColor: '#1b4f72', accent: '#fdfefe' } },
    ajans: { name: 'Deniz', role: 'Reklam ajansı', look: { gender: 'e', age: 'genc', skin: '#e8b98f', hairColor: '#2b1d14', hair: 'dalgali', facial: 'kirli', glasses: true, head: 'none', outfit: 'tisort', outfitColor: '#f39c12', accent: '#fdfefe', print: true } },
    terzi: { name: 'Terzi Nuri', role: 'Terzi', look: { gender: 'e', age: 'yasli', skin: '#e8b98f', hairColor: '#d0d0d0', hair: 'kel', facial: 'biyik', glasses: true, head: 'none', outfit: 'yelek', outfitColor: '#6e2c00', accent: '#f5cba7' } },
    dekor: { name: 'Gül Hanım', role: 'Dekoratör', look: { gender: 'k', age: 'orta', skin: '#c68b5c', hairColor: '#1c1410', hair: 'dalgali', facial: 'none', glasses: false, head: 'none', outfit: 'gomlek', outfitColor: '#117a65' } },
    buro: { name: 'Tuğba Hanım', role: 'Eleman bürosu', look: { gender: 'k', age: 'genc', skin: '#e8b98f', hairColor: '#4a2f1d', hair: 'topuz', facial: 'none', glasses: true, head: 'basortusu', scarf: '#1f618d', outfit: 'gomlek', outfitColor: '#fdfefe' } },
    lonca: { name: 'Lonca Şeyhi Rauf Usta', role: 'Usta pazarı', look: { gender: 'e', age: 'yasli', skin: '#d9a273', hairColor: '#d0d0d0', hair: 'kel', facial: 'sakal', glasses: false, head: 'takke', accent: '#7d6608', outfit: 'yelek', outfitColor: '#4a235a' } }
  };
  /* Aynı görünüş + aynı ayarlar için çizimi bir kez üret (sahne her dakika yeniden sorar) */
  const memo = (fn) => { const cache = new Map(); return function (l, opts) { const k = JSON.stringify([l, opts || null]); let v = cache.get(k); if (v === undefined) { v = fn(l, opts); if (cache.size > 400) cache.clear(); cache.set(k, v); } return v; }; };
  KE.portrait = memo(KE.portrait);
  KE.figure = memo(KE.figure);
})();

/* ---------- Ustaların huyu: kimliğinden türetilir (kayda yazılmaz, her yerde aynı çıkar) ---------- */
KE.HUYS = {
  izinci: { name: 'Ailesine düşkün', desc: 'Ara sıra izin ister; izin verilirse çok sevinir.' },
  hirsli: { name: 'Hırslı', desc: 'Başka yerlerin tekliflerini dinler, yarışmalara can atar.' },
  sadik: { name: 'Sadık', desc: 'Başka yere gözü yok; morali zor bozulur.' }
};
KE.huyOf = function (s) {
  if (!s || !(s.role === 'usta' || s.role === 'cirak')) return null;
  const id = String(s.id || s.name || '');
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return ['izinci', 'hirsli', 'sadik'][h % 3];
};


// ---- js/economy.js ----
/* Kebab Empire — ekonomi: para biçimi, takvim, fiyatlar, bordro, aylık kapanış */
(function () {
  const E = () => KE.ECON;
  /* Sayı ve para biçimi seçili dile göre (para birimi her dilde TL) */
  const LOC = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE' };
  KE.locale = () => LOC[(KE.I18N && KE.I18N.lang) || 'tr'] || 'tr-TR';
  const fmts = {};
  const fmt = (d) => { const k = KE.locale() + d; return fmts[k] || (fmts[k] = new Intl.NumberFormat(KE.locale(), { maximumFractionDigits: d, minimumFractionDigits: d })); };
  KE.tl = (v) => (v < 0 ? '−' : '') + fmt(0).format(Math.round(Math.abs(v))) + ' ₺';
  KE.num = (v, d) => fmt(d || 0).format(v);
  /* yüzde, dile göre: TR "%74", EN "74%", DE "74 %"; v yüzde değeri (74), sign: işaretli (+12%) */
  const pfmts = {};
  KE.pct = (v, sign, d) => { const k = KE.locale() + (sign ? 's' : '') + (d || 0); const f = pfmts[k] || (pfmts[k] = new Intl.NumberFormat(KE.locale(), { style: 'percent', maximumFractionDigits: d || 0, minimumFractionDigits: d || 0, signDisplay: sign ? 'exceptZero' : 'auto' })); return f.format((+v || 0) / 100); };

  /* ---------- Takvim: 1. gün = 2 Mart 2026 Pazartesi ---------- */
  const START = Date.UTC(2026, 2, 2);
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  KE.AYLAR = AYLAR;
  KE.dateOf = (day) => new Date(START + (day - 1) * 86400000);
  KE.dateStr = (day) => { const d = KE.dateOf(day); return `${d.getUTCDate()}${KE.locale() === 'de-DE' ? '.' : ''} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  KE.weekday = (day) => GUNLER[KE.dateOf(day).getUTCDay()];
  KE.isWeekend = (day) => { const w = KE.dateOf(day).getUTCDay(); return w === 0 || w === 6; };
  KE.isMonthEnd = (day) => KE.dateOf(day + 1).getUTCMonth() !== KE.dateOf(day).getUTCMonth();
  KE.isWeekEnd = (day) => KE.dateOf(day).getUTCDay() === 0;
  KE.monthKey = (day) => { const d = KE.dateOf(day); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  KE.monthName = (key) => { const [y, m] = key.split('-'); return AYLAR[+m - 1] + ' ' + y; };
  /* Bayramlar ve resmî tatiller calendar.js'te hesaplanır */
  KE.holidayOf = (day) => KE.CAL.holidayOn(KE.dateOf(day).getTime());
  KE.religiousHolidayOf = (day) => KE.CAL.religiousOn(KE.dateOf(day).getTime());
  KE.bonusMonths = new Proxy({}, { get: (_, key) => (typeof key === 'string' && /^\d{4}-\d{2}$/.test(key) ? KE.CAL.bonusMonth(key) : undefined) });

  /* ---------- Fiyatlar ---------- */
  KE.TIERS = [
    { name: 'Ekonomik', mul: 0.82, quality: -0.6, desc: 'Ucuz ama müşteri farkı anlar.' },
    { name: 'Standart', mul: 1.0, quality: 0, desc: 'Mahallenin alıştığı kalite.' },
    { name: 'Premium', mul: 1.3, quality: 0.7, desc: 'Seçme et, günlük sebze. Gurmeler bayılır.' }
  ];
  KE.modVal = (G, key) => G.mods.filter((m) => m.key === key).reduce((a, m) => a * m.mult, 1);
  KE.ingPrice = (G, b, key) => {
    const ing = KE.MODES[G.mode].ingredients[key];
    return ing.price * G.priceIndex * KE.TIERS[b.tier].mul * KE.modVal(G, 'ing:' + key) * KE.modVal(G, 'ing') * (G.centralKitchen ? 0.88 : 1);
  };
  KE.productCost = (G, b, p) => Object.entries(p.ing).reduce((a, [k, q]) => a + q * KE.ingPrice(G, b, k), 0);
  KE.marketPrice = (G, p) => Math.round(p.base * G.priceIndex / 5) * 5;

  /* ---------- Gelir vergisi ---------- */
  function taxOn(cum) {
    let tax = 0, prev = 0;
    for (const [lim, rate] of E().gvDilim) {
      if (cum <= prev) break;
      tax += (Math.min(cum, lim) - prev) * rate;
      prev = lim;
    }
    return tax;
  }
  KE.taxOn = taxOn;

  /* Bir çalışanın aylık bordrosu. monthNo: yıl içindeki ay (1–12). commit=true ise kümülatif matrah güncellenir. */
  KE.payroll = function (G, s, monthNo, opts) {
    opts = opts || {};
    const e = E();
    const fm = Math.round(s.wage * e.fazlaMesaiOrani);
    const brut = s.wage + fm;
    const sgkI = brut * e.sgkIsci, issI = brut * e.issizlikIsci;
    const matrah = brut - sgkI - issI;
    const cum = s.cumBase || 0;
    let gv = taxOn(cum + matrah) - taxOn(cum);
    const aMatrah = e.asgariBrut * (1 - e.sgkIsci - e.issizlikIsci);
    const aCum = aMatrah * (monthNo - 1);
    const gvIstisna = Math.min(gv, taxOn(aCum + aMatrah) - taxOn(aCum));
    gv = Math.max(0, gv - gvIstisna);
    const damga = Math.max(0, brut * e.damga - e.asgariBrut * e.damga);
    const net = brut - sgkI - issI - gv - damga;
    const tesvik = G.payLate ? 0 : e.hazineTesvik;
    const sgkV = brut * (e.sgkIsveren - tesvik), issV = brut * e.issizlikIsveren;
    const yol = e.yolYardimiAylik;
    const ikramiye = opts.bonus ? Math.round(brut * e.bayramIkramiye) : 0;
    const total = brut + sgkV + issV + yol + ikramiye;
    if (opts.commit) s.cumBase = cum + matrah;
    return { id: s.id, name: s.name, role: s.role, base: s.wage, fm, brut, sgkI, issI, matrah, gv, gvIstisna, damga, net, sgkV, issV, tesvik: brut * tesvik, yol, ikramiye, tips: s.tipsMonth || 0, total };
  };

  KE.utilities = (G, b) => {
    const eq = b.equipment;
    return Math.round((26000 + eq.cook * 7500 + eq.cold * 3500 + eq.service * 2500 + (b.decor.includes('klima') ? 2500 : 0)) * G.priceIndex);
  };

  /** Ay sonu kapanışı. Nakitten düşer, ay raporunu döndürür.
   * @param {Game} G
   * @param {number} day ayın son günü
   * @returns {any} ay raporu (G.ledger.months'a da eklenir)
   */
  KE.closeMonth = function (G, day) {
    const key = KE.monthKey(day);
    const monthNo = KE.dateOf(day).getUTCMonth() + 1;
    const bonus = !!KE.bonusMonths[key];
    const days = G.ledger.days.filter((d) => d.month === key);
    const sum = (f) => days.reduce((a, d) => a + (f(d) || 0), 0);
    const revenue = sum((d) => d.revenue), purchases = sum((d) => d.purchases), tips = sum((d) => d.tips);
    const extras = G.monthExtras || {};
    const kdvOut = revenue * E().kdvRestoran / (1 + E().kdvRestoran);
    const kdvIn = purchases * E().kdvGida / (1 + E().kdvGida);
    const kdv = Math.max(0, kdvOut - kdvIn);
    const payroll = G.staff.map((s) => KE.payroll(G, s, monthNo, { commit: true, bonus }));
    const personnel = payroll.reduce((a, p) => a + p.total, 0);
    const branches = G.branches.map((b) => {
      const bd = days.filter((d) => d.branchId === b.id);
      const bs = (f) => bd.reduce((a, d) => a + (f(d) || 0), 0);
      const staffCost = payroll.filter((p) => G.staff.find((s) => s.id === p.id).branchId === b.id).reduce((a, p) => a + p.total, 0);
      const rent = b.rent;
      const util = KE.utilities(G, b);
      const rev = bs((d) => d.revenue), pur = bs((d) => d.purchases);
      return { id: b.id, name: b.name, revenue: rev, purchases: pur, tips: bs((d) => d.tips), customers: bs((d) => d.served), rent, util, staffCost,
        result: rev / (1 + E().kdvRestoran) - pur - staffCost - rent - util };
    });
    const rent = branches.reduce((a, b) => a + b.rent, 0);
    const util = branches.reduce((a, b) => a + b.util, 0);
    const accountant = E().muhasebeci + Math.max(0, G.branches.length - 1) * 2500;
    const farmFixed = G.farm ? Math.round(KE.FARM_MONTHLY * G.priceIndex) : 0;
    const loan = G.loans.reduce((a, l) => a + (l.remaining > 0 ? l.monthly : 0), 0);
    const opex = personnel + rent + util + accountant + kdv + loan + farmFixed;
    const report = {
      key, name: KE.monthName(key), bonus: bonus ? KE.bonusMonths[key] : null, revenue, purchases, tips, kdvOut, kdvIn, kdv,
      payroll, personnel, farmFixed, farm: extras.farm || 0, rent, rentNet: rent * (1 - E().kiraStopaj), stopaj: rent * E().kiraStopaj, util, accountant, loan,
      ads: extras.ads || 0, capex: extras.capex || 0, fines: extras.fines || 0, other: extras.other || 0,
      branches, customers: sum((d) => d.served),
      net: revenue - kdv - purchases - personnel - rent - util - accountant - loan - farmFixed - (extras.farm || 0) - (extras.ads || 0) - (extras.fines || 0) - (extras.other || 0)
    };
    G.cash -= opex;
    G.loans.forEach((l) => { if (l.remaining > 0) { l.remaining -= 1; } });
    G.loans = G.loans.filter((l) => l.remaining > 0);
    G.staff.forEach((s) => { s.tipsMonth = 0; });
    if (monthNo === 12) G.staff.forEach((s) => { s.cumBase = 0; });
    G.ledger.months.push(report);
    G.monthExtras = { ads: 0, capex: 0, fines: 0, other: 0, farm: 0 };
    G.priceIndex *= 1 + E().aylikEnflasyon;
    if (monthNo === 12) { KE.CAL.applyYear(KE.dateOf(day + 1).getUTCFullYear()); G.staff.forEach((s) => { if (s.wage < KE.ECON.asgariBrut) s.wage = KE.ECON.asgariBrut; }); }
    return report;
  };

  KE.addExtra = (G, key, amt) => { G.monthExtras = G.monthExtras || {}; G.monthExtras[key] = (G.monthExtras[key] || 0) + amt; };

  /** Kredi: anüite
   * @param {number} amount
   * @param {number} months
   * @param {number} rate aylık faiz
   * @returns {LoanOffer}
   */
  KE.loanOffer = (amount, months, rate) => {
    const m = amount * rate / (1 - Math.pow(1 + rate, -months));
    return { amount, months, rate, monthly: Math.round(m), total: Math.round(m * months) };
  };
  KE.LOAN_RATE = 0.034;
  /** Bankanın bugünkü kredi teklifleri (arayüz ve sunucu doğrulaması aynı listeyi kullanır)
   * @param {Game} G
   * @returns {LoanOffer[]} bugünkü teklifler (fiyat endeksine göre)
   */
  KE.loanOffers = (G) => [[300000, 12], [750000, 24], [1500000, 36]].map(([a, m]) => KE.loanOffer(Math.round(a * G.priceIndex / 1000) * 1000, m, KE.LOAN_RATE));
  KE.LOAN_MAX = 3;
  /** Krediyi erken kapatma bedeli: kalan taksitlerin %93'ü (arayüz, motor ve sunucu zinciri aynı formülü kullanır)
   * @param {Loan} l
   * @returns {number} erken kapatma bedeli (₺)
   */
  KE.payoffCost = (l) => Math.round(l.monthly * l.remaining * 0.93);
  /** Bankanın bugünkü tekliflerinden birini kullan (en fazla 3 kredi)
   * @param {Game} G
   * @param {number} amount bugünkü tekliflerden birinin tutarı
   * @param {number} months o teklifin vadesi
   * @returns {ActionResult}
   */
  KE.takeLoan = function (G, amount, months) {
    const o = KE.loanOffers(G).find((x) => x.amount === amount && x.months === months);
    if (!o) return { ok: false };
    if (G.loans.length >= KE.LOAN_MAX) return { ok: false, msg: 'En fazla 3 kredi kullanabilirsin.' };
    G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months });
    G.cash += o.amount;
    return { ok: true, msg: `${KE.tl(o.amount)} hesabına geçti.`, amount: o.amount };
  };
  /** Krediyi erken kapat: bedel kasadan düşer, kredi listeden çıkar
   * @param {Game} G
   * @param {number} i G.loans dizini
   * @returns {ActionResult} cost: ödenen bedel
   */
  KE.payoffLoan = function (G, i) {
    const l = G.loans[i];
    if (!l) return { ok: false };
    const pay = KE.payoffCost(l);
    if (G.cash < pay) return { ok: false, msg: 'Kasada yeterli para yok.' };
    G.cash -= pay; KE.addExtra(G, 'other', pay);
    G.loans.splice(i, 1);
    return { ok: true, msg: 'Kredi kapatıldı.', cost: pay };
  };
})();


// ---- js/sim/rng.js ----
/* Kebab Empire — simülasyon motoru (1/8): tohumlu rastgelelik
   Motor dosyaları sırayla yüklenir: rng → staff → branch → morning → service → player → close → replay.
   Bütün şubeler aynı anda, dakika dakika çalışır.
   Akış: müşteri gelir → kasada sipariş verir (kasiyer/garson) → usta pişirir → komi/garson masaya götürür
   → müşteri yer, bahşiş bırakır ve çıkar → masa toplanır. Ustalar yalnızca pişirir. */
(function () {
  /* ---------- Tohumlu rastgelelik ----------
     Oyun sonucunu etkileyen her rastgele karar KE.rand() ile verilir. Akış her gün ve evre için
     oyunun tohumundan yeniden kurulur; aynı tohum + aynı oyuncu hamleleri = birebir aynı gün. */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  KE.mix = mix;
  function mix(...xs) { let h = 2166136261; xs.forEach((x) => { String(x).split('').forEach((c) => { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }); h ^= 0x9e37; }); return h >>> 0; }
  let stream = mulberry32(1);
  KE.RNG = { seed: (G, tag) => { stream = mulberry32(mix(G.seed || 1, G.day, tag)); }, raw: (n) => { stream = mulberry32(n); } };
  KE.rand = () => stream();
})();


// ---- js/sim/staff.js ----
/* Kebab Empire — simülasyon motoru (2/8): personel
   Pozisyonlar, çalışan üretimi, kadro sınırı, usta/eleman pazarı ve tecrübe (yıldız) kazanımı. */
(function () {
  const { clamp, rnd, pick, mode: MODE } = KE.U;
  KE.STAR_NEED = [0, 40, 120, 300, 650, 1300];

  /* ---------- Görevler ve pozisyonlar ---------- */
  KE.POSITIONS = {
    usta: ['ocak', 'mola'], cirak: ['ocak', 'mola'],
    kasiyer: ['kasa', 'servis', 'mola'], garson: ['servis', 'kasa', 'mola'],
    temizlik: ['temizlik', 'servis', 'mola'], kurye: ['paket', 'mola'],
    mudur: ['yonetim', 'kasa', 'servis', 'mola']
  };
  KE.POS_NAMES = { ocak: 'Ocakbaşı', kasa: 'Kasa', servis: 'Servis', temizlik: 'Temizlik', paket: 'Paket', yonetim: 'Yönetim', mola: 'Mola' };
  KE.TASK_NAMES = { cook: 'Pişiriyor', order: 'Sipariş alıyor', deliver: 'Servis ediyor', clear: 'Masa topluyor', clean: 'Temizlik', paket: 'Paket yolda' };

  /* ---------- Personel üretimi ---------- */
  KE.wageFor = (spec, role) => {
    if (role === 'cirak') return KE.ECON.asgariBrut;
    const stars = Object.values(spec);
    const max = Math.max(1, ...stars);
    return Math.round((40000 + 9500 * (max - 1) + 3500 * (stars.length - 1)) / 500) * 500;
  };
  KE.makeStaff = function (G, o) {
    const id = 's' + (G.nextId++);
    const gender = o.gender || (KE.rand() < 0.8 ? 'e' : 'k');
    const age = o.age || pick(['genc', 'orta', 'orta', 'yasli']);
    const s = {
      id, name: o.name, role: o.role, region: o.region || pick(Object.keys(KE.REGIONS)), gender, age,
      spec: Object.assign({}, o.spec || {}), xp: {}, speed: o.speed || 1, quality: o.quality || 0.8, consistency: o.consistency || 0.8,
      waste: o.waste || 0.6, teach: o.teach || 0.5, friendly: o.friendly || rnd(0.4, 0.9), skill: o.skill || rnd(0.4, 0.9),
      trait: o.trait || null, wage: o.wage || KE.wageFor(o.spec || {}, o.role), morale: o.morale || 66, costume: 'temel',
      branchId: o.branchId, look: o.look || KE.randomLook(gender, age), cumBase: 0, tipsMonth: 0, tipsTotal: 0, hiredDay: G.day,
      mentorId: null, servedToday: 0, servedTotal: 0, energy: 100, pos: null, task: null
    };
    if (s.look.gender !== gender) s.look = KE.randomLook(gender, age);
    s.pos = KE.POSITIONS[s.role][0];
    return s;
  };
  KE.isCook = (s) => s.role === 'usta' || s.role === 'cirak';

  /* ---------- Kadro sınırı: dükkân büyüdükçe artar ----------
     Mutfak (usta + çırak): ocak yeri + 1 · Salon (kasiyer + garson/komi): masa sayısının yarısı
     Destek (kurye + temizlik): salon seviyesi + 1 · Müdür: 1. Sınırı ocak ve salon yükseltmeleri açar. */
  KE.STAFF_GROUPS = {
    mutfak: { name: 'Mutfak', roles: ['usta', 'cirak'], up: 'cook' },
    salon: { name: 'Salon', roles: ['kasiyer', 'garson'], up: 'service' },
    destek: { name: 'Paket ve temizlik', roles: ['kurye', 'temizlik'], up: 'service' },
    yonetim: { name: 'Yönetim', roles: ['mudur'], up: null }
  };
  KE.staffGroup = (role) => Object.keys(KE.STAFF_GROUPS).find((g) => KE.STAFF_GROUPS[g].roles.includes(role));
  KE.staffCapsAt = (G, b, eq) => {
    const M = KE.MODES[G.mode].equipment;
    const st = M.cook.levels[eq.cook].stations, tables = M.service.levels[eq.service].tables;
    const fl = b && b.flagship ? 1 : 0;
    return { mutfak: st + 1 + fl, salon: Math.ceil((tables + 4 * fl) / 2), destek: eq.service + 1, yonetim: 1 };
  };
  KE.staffCaps = (G, b) => KE.staffCapsAt(G, b, b.equipment);
  /** Bu şubede bu rolden biri daha çalışabilir mi? { ok, group, used, cap, hint } */
  KE.canHire = function (G, b, role, exceptId) {
    const group = KE.staffGroup(role);
    const cap = KE.staffCaps(G, b)[group];
    const used = KE.branchStaff(G, b).filter((s) => s.id !== exceptId && KE.staffGroup(s.role) === group).length;
    const g = KE.STAFF_GROUPS[group];
    let hint = '';
    if (used >= cap && g.up) {
      const eq = KE.MODES[G.mode].equipment[g.up];
      const next = eq.levels[b.equipment[g.up] + 1];
      hint = next ? (g.up === 'cook' ? 'Yer açmak için Mobilya ve Dekor\'dan ocağı büyüt ya da kadrodan birini çıkar.' : 'Yer açmak için Mobilya ve Dekor\'dan salonu büyüt ya da kadrodan birini çıkar.') : 'Bu şube en büyük hâlinde: kadrodan birini çıkar ya da başka şubeye ata.';
    } else if (used >= cap) hint = 'Her şubede bir müdür olabilir. Yenisini almak için mevcut müdürü çıkar.';
    return { ok: used < cap, group, used, cap, hint };
  };
  KE.roleName = (G, s) => s.role === 'usta' ? KE.MODES[G.mode].cookRole : s.role === 'garson' ? (G.mode === 'doner' ? 'Komi' : 'Garson') : KE.ROLES[s.role].name;

  KE.randomMaster = function (G) {
    const mode = MODE(G);
    const prods = mode.products.map((p) => p.id);
    const n = pick([1, 1, 2, 2, 2, 3]);
    const spec = {};
    const lvl = KE.rand();
    for (let i = 0; i < n; i++) {
      const p = pick(prods);
      spec[p] = clamp(Math.round(rnd(1.6, lvl < 0.15 ? 5.4 : lvl < 0.5 ? 4.4 : 3.6)), 1, 5);
    }
    const gender = KE.rand() < 0.78 ? 'e' : 'k';
    const max = Math.max(...Object.values(spec));
    const role = max <= 2 && KE.rand() < 0.6 ? 'cirak' : 'usta';
    const taken = new Set(G.staff.map((x) => x.name.replace(/^Çırak /, '').replace(/ Usta$/, '')).concat((G.market || []).map((x) => x.name.replace(/^Çırak /, '').replace(/ Usta$/, ''))));
    let first = pick(KE.NAMES[gender]);
    for (let i = 0; i < 12 && taken.has(first); i++) first = pick(KE.NAMES[gender]);
    const s = KE.makeStaff(G, {
      name: role === 'cirak' ? 'Çırak ' + first : first + ' Usta', role, gender, spec,
      age: role === 'cirak' ? 'genc' : pick(['orta', 'orta', 'yasli', 'genc']),
      speed: rnd(0.8, 1.25), quality: rnd(0.6, 0.98), consistency: rnd(0.6, 0.97), waste: rnd(0.35, 1.1), teach: rnd(0.2, 0.95),
      trait: pick(['mukemmel', 'gosterisci', 'hizli', 'sabirli', 'huysuz', 'hevesli', 'sohbet', null])
    });
    s.fee = role === 'cirak' ? 0 : Math.round(s.wage * (0.3 + max * 0.18) / 500) * 500;
    return s;
  };
  KE.randomWorker = function (G, role) {
    const gender = KE.rand() < 0.6 ? 'e' : 'k';
    const first = pick(KE.NAMES[gender]);
    const s = KE.makeStaff(G, {
      name: first, role, gender, age: role === 'mudur' ? pick(['orta', 'yasli']) : pick(['genc', 'genc', 'orta']),
      speed: rnd(0.8, 1.25), friendly: rnd(0.3, 1), skill: rnd(0.3, 1), trait: pick(['sohbet', 'hizli', 'sabirli', 'huysuz', null, null])
    });
    const base = KE.ROLES[role].baseWage;
    s.wage = Math.max(KE.ECON.asgariBrut, Math.round(base * (0.85 + (role === 'mudur' ? s.skill : s.friendly) * 0.3) / 500) * 500);
    return s;
  };

  KE.refreshMarket = function (G) {
    const used = new Set(G.staff.map((s) => s.name));
    const tmpl = KE.MASTER_TEMPLATES[G.mode].filter((t) => !used.has(t.name) && t.role !== 'cirak');
    G.market = [];
    if (tmpl.length && KE.rand() < 0.7) {
      const t = pick(tmpl);
      const s = KE.makeStaff(G, Object.assign({}, t, { role: 'usta' }));
      const max = Math.max(...Object.values(s.spec));
      s.fee = Math.round(s.wage * (0.3 + max * 0.18) / 500) * 500;
      G.market.push(s);
    }
    while (G.market.length < 5) G.market.push(KE.randomMaster(G));
  };
  KE.refreshWorkers = function (G) {
    G.workers = [];
    ['kasiyer', 'garson', 'garson', 'kurye', 'temizlik', 'mudur', 'kasiyer', 'kurye'].forEach((r) => G.workers.push(KE.randomWorker(G, r)));
  };

  KE.gainXp = function (s, pid, amt) {
    if (!amt) return false;
    const cur = s.spec[pid] || 0;
    if (cur >= 5) return false;
    s.xp[pid] = (s.xp[pid] || 0) + amt;
    const need = KE.STAR_NEED[cur + 1];
    if (s.xp[pid] >= need) { s.xp[pid] -= need; s.spec[pid] = cur + 1; s.levelUps = (s.levelUps || []).concat([{ pid, star: cur + 1 }]); return true; }
    return false;
  };
})();


// ---- js/sim/branch.js ----
/* Kebab Empire — simülasyon motoru (3/8): şube ve yeni oyun
   Şube kurulumu, ekipman/masa/ocak, ortam (dekor konsepti), menü, fiyat toleransı ve beklenen müşteri. */
(function () {
  const MODE = KE.U.mode;
  /* ---------- Şube ---------- */
  KE.makeBranch = function (G, districtId) {
    const d = KE.DISTRICTS.find((x) => x.id === districtId);
    const mode = MODE(G);
    const b = {
      id: 'b' + (G.nextId++), district: districtId, name: KE.BRAND ? KE.BRAND.branchName(d.name, d.name + ' ' + (G.mode === 'doner' ? 'Dönercisi' : 'Ocakbaşı')) : d.name + ' ' + (G.mode === 'doner' ? 'Dönercisi' : 'Ocakbaşı'),
      tier: 1, equipment: { cook: 0, prep: 0, cold: 0, service: 0 }, decor: [], prices: {}, menu: {}, stock: {}, usage: {},
      stockLevel: 1.15, cleanliness: 72, rent: Math.round(d.rent * G.priceIndex), openedDay: G.day, history: [], autoStaff: true
    };
    mode.products.forEach((p) => { b.prices[p.id] = KE.marketPrice(G, p); b.menu[p.id] = true; });
    b.prices[mode.drink.id] = KE.marketPrice(G, mode.drink);
    const est = d.traffic * mode.trafficMul * 0.75;
    Object.keys(mode.ingredients).forEach((k) => {
      let per = 0;
      mode.products.forEach((p) => { per += (p.ing[k] || 0) / mode.products.length; });
      per += (mode.drink.ing[k] || 0) * mode.drinkRate;
      b.usage[k] = per * est * 1.2;
      b.stock[k] = 0;
    });
    return b;
  };
  KE.district = (b) => KE.DISTRICTS.find((x) => x.id === b.district);
  KE.branchStaff = (G, b) => G.staff.filter((s) => s.branchId === b.id);
  KE.equip = (G, b, k) => MODE(G).equipment[k].levels[b.equipment[k]];
  KE.tableCount = (G, b) => KE.equip(G, b, 'service').tables + (b.decor.includes('dismasa') ? 2 : 0) + (b.flagship ? 4 : 0);
  /* ocak yeri: ekipman + amiral dükkânın fazladan ocağı */
  KE.stations = (G, b) => KE.equip(G, b, 'cook').stations + (b.flagship ? 1 : 0);

  KE.ambience = function (G, b) {
    let a = 0; const styles = {};
    b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (!d) return; a += d.ambience; if (d.style !== 'personel') styles[d.style] = (styles[d.style] || 0) + 1; });
    let concept = null;
    const top = Object.entries(styles).sort((x, y) => y[1] - x[1])[0];
    if (top && top[1] >= 3) {
      const names = { geleneksel: G.mode === 'kebap' ? 'Otantik Ocakbaşı' : 'Esnaf Lokantası Ruhu', sokak: 'Sokak Lezzeti', modern: 'Modern Büfe', 'lüks': 'Lüks Salon' };
      concept = { style: top[0], name: names[top[0]] };
      const st = KE.branchStaff(G, b);
      const costumed = st.filter((s) => s.costume !== 'temel').length;
      const yoresel = st.filter((s) => s.costume === 'yoresel').length;
      concept.power = 1 + (st.length ? costumed / st.length : 0) * 0.5 + (top[0] === 'geleneksel' && yoresel ? 0.4 : 0);
    }
    return { score: a, concept };
  };

  KE.isLocked = (G, p) => !!(p.unlock && !(G.flags && G.flags['tarif_' + p.id]));
  KE.canMake = function (G, b, p) {
    if (!b.menu[p.id] || KE.isLocked(G, p)) return false;
    if (p.requiresSpec && !KE.branchStaff(G, b).some((s) => KE.isCook(s) && (s.spec[p.id] || 0) >= 1)) return false;
    return true;
  };
  KE.hasStock = (b, p, count) => Object.entries(p.ing).every(([k, q]) => (b.stock[k] || 0) >= q * count - 1e-9);
  KE.bestStar = function (G, b, pid) {
    let best = 0;
    KE.branchStaff(G, b).forEach((s) => { if (KE.isCook(s)) best = Math.max(best, s.spec[pid] || 0); });
    return best;
  };

  /* Menünün piyasaya göre ortalama fiyat oranı (1 = piyasa) ve itibara bağlı fiyat toleransı */
  KE.priceRatio = function (G, b) {
    const ps = MODE(G).products.filter((p) => b.menu[p.id] && !KE.isLocked(G, p) && b.prices[p.id] != null);
    return ps.length ? ps.reduce((a, p) => a + b.prices[p.id] / KE.marketPrice(G, p), 0) / ps.length : 1;
  };
  KE.charityLv = (G, id) => (G.charity && G.charity[id]) || 0;
  KE.priceTolerance = (G, b) => 1.02 + (G.stars || 0) * 0.03 + KE.charityLv(G, 'okul') * 0.01 + Math.max(0, G.reputation - 50) / 400 + (G.signature && !G.signature.family ? G.signature.level * 0.04 : 0) + (b && b.flagship ? 0.1 : 0);
  KE.expectedCustomers = function (G, b) {
    const d = KE.district(b);
    const mode = MODE(G);
    const repF = 0.45 + G.reputation / 100 * 0.9;
    const amb = KE.ambience(G, b);
    const ambF = 1 + Math.min(0.35, amb.score / 120) + (amb.concept ? 0.08 * amb.concept.power : 0);
    const wk = KE.isWeekend(G.day) ? 1.18 : 1;
    const hol = KE.holidayOf(G.day) ? 1.25 : 1;
    const emp = G.flags && G.flags.empire;
    const rival = 1 - Math.min(0.25, Math.max(0, d.rivals - (emp ? 1 : 0)) * 0.03 + (!emp && G.rival.district === d.id ? G.rival.power / 400 : 0));
    const ad = KE.modVal(G, 'traffic') * KE.modVal(G, 'traffic:' + b.id) * (b.signBoost || 1);
    const sp = KE.specialDay(G.day);
    const mac = sp && sp.id === 'mac' && b.district === 'besiktepe' ? 1.3 : 1;
    const loyal = 1 + 0.025 * Object.values(G.regulars || {}).filter((r) => r.loyalty >= 8).length;
    const champ = b.championUntil && G.day <= b.championUntil ? 1.06 : 1;
    const sig = 1 + (G.signature ? G.signature.level * KE.SIGNATURE.traffic : 0);
    /* ucuz fiyat kapıdan daha çok müşteri getirir, pahalı fiyat biraz azaltır (±%12) */
    const pr = 1 + Math.max(-0.12, Math.min(0.12, (1 - KE.priceRatio(G, b)) * 0.6));
    const flag = b.flagship ? KE.FLAGSHIP.traffic : G.branches.some((x) => x.flagship) ? KE.FLAGSHIP.chain : 1;
    return (1 + (G.stars || 0) * 0.03) * (1 + KE.charityLv(G, 'takim') * 0.02) * d.traffic * mode.trafficMul * repF * ambF * wk * rival * ad * mac * loyal * champ * sig * flag * pr * (emp ? 1.1 : 1) * (sp && sp.id === 'bayram' ? 1.15 : 1) * (hol && !sp ? 1.25 : 1);
  };

  /* ---------- Yeni oyun ---------- */
  KE.newGame = function (opts) {
    KE.CAL.applyYear(KE.dateOf(1).getUTCFullYear());
    const seed0 = opts.seed || (Math.floor(Math.random() * 2147483646) + 1);
    KE.RNG.raw(seed0);
    const G = {
      v: 3, seed: seed0, actionLog: [], saveId: 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), mode: opts.mode, owner: opts.owner || 'Patron', shopName: opts.shopName, day: 1, cash: KE.FRESH.cash, reputation: KE.FRESH.reputation,
      priceIndex: 1, nextId: 1, staff: [], branches: [], activeBranch: null, loans: [], mods: [], tipRule: 'esit',
      ledger: { days: [], months: [] }, monthExtras: { ads: 0, capex: 0, fines: 0, other: 0, farm: 0 }, journal: [], news: [], goals: {},
      phase: 'morning', rival: { power: 20, district: null }, market: [], workers: [], flags: {}, centralKitchen: false,
      eventLog: [], pendingEvent: null, payLate: false, lastSummary: null, speed: 1, farm: null, tut: opts.tut ? 0 : 99,
      era: 1, eraLog: { 1: 1 }, gen: 1, weekly: null, stories: {}
    };
    const lg = opts.legacy;
    if (lg) {
      G.gen = lg.gen; G.legacy = { gen: lg.gen, from: lg.from, owner: lg.owner };
      G.rival.power += 15 * (lg.gen - 1);
      if (lg.sigPid) G.signature = { pid: lg.sigPid, level: 1, family: true };
    }
    KE.G = G;
    G.regulars = {};
    KE.REGULARS.forEach((r) => { G.regulars[r.id] = { loyalty: 0, visits: 0 }; });
    const b = KE.makeBranch(G, opts.district);
    b.name = opts.shopName || b.name;
    G.branches.push(b); G.activeBranch = b.id;
    const t = opts.master;
    const m0 = KE.makeStaff(G, Object.assign({}, t, { role: t.role || 'usta', branchId: b.id }));
    if (lg && lg.spec) { m0.spec = Object.assign({}, lg.spec); m0.wage = KE.wageFor(m0.spec, 'usta'); m0.heir = true; }
    G.staff.push(m0);
    const cirak = KE.MASTER_TEMPLATES[G.mode].find((x) => x.role === 'cirak');
    G.staff.push(KE.makeStaff(G, Object.assign({}, cirak, { branchId: b.id, morale: 70 })));
    const ks = KE.randomWorker(G, 'kasiyer'); ks.branchId = b.id; G.staff.push(ks);
    const gs = KE.randomWorker(G, 'garson'); gs.branchId = b.id; G.staff.push(gs);
    KE.refreshMarket(G); KE.refreshWorkers(G);
    KE.morning(G);
    return G;
  };
})();


// ---- js/sim/morning.js ----
/* Kebab Empire — simülasyon motoru (4/8): sabah
   Müdürlü şubenin sabah ayarı, talep tahmini, stok tamamlama (çiftlik sevkiyatı dahil), sabah hazırlığı ve günün hedefleri. */
(function () {
  const MODE = KE.U.mode;
  /* ---------- Sabah: çiftlikten sevkiyat ve stok tamamlama ---------- */
  /* Müdürlü şube kendi sabah ayarını yapar: stok seviyesi dünkü bitenlere ve fireye, fiyatlar haftada bir piyasaya göre */
  KE.isManaged = (G, b) => b.managed !== false && KE.branchStaff(G, b).some((s) => s.role === 'mudur');
  function manage(G, b) {
    const sum = G.lastSummary && G.lastSummary.day === G.day - 1 && G.lastSummary.branches[b.id];
    const notes = [];
    if (sum) {
      const so = Object.keys(sum.stats.stockouts || {}).length;
      if (so && b.stockLevel < 1.5) { b.stockLevel = Math.min(1.5, Math.round((b.stockLevel + 0.1) * 100) / 100); notes.push('stok'); }
      else if (!so && sum.wasteVal > sum.stats.revenue * 0.04 && b.stockLevel > 1.15) { b.stockLevel = Math.max(1.15, Math.round((b.stockLevel - 0.05) * 100) / 100); notes.push('fire'); }
    }
    if (G.day % 7 === 1) {
      let moved = false;
      /* hedef: piyasa × müşterinin katlanacağı prim (itibar, imza tarif, amiral dükkân) */
      const prem = Math.max(1, Math.min(1.15, KE.priceTolerance(G, b) - 0.02));
      MODE(G).products.forEach((p) => { if (b.prices[p.id] == null) return; const np = Math.round((b.prices[p.id] + KE.marketPrice(G, p) * prem) / 2 / 5) * 5; if (np !== b.prices[p.id]) { b.prices[p.id] = np; moved = true; } });
      if (moved) notes.push('fiyat');
    }
    /* müdür: kapasite yetmiyorsa ve yer varsa bürodan bir kasiyer ya da garson alır */
    if (sum && sum.stats.arrivals > 40 && KE.lostShare(sum.stats) >= 0.15 && G.cash > 1500000) {
      const st = KE.branchStaff(G, b), front = st.filter((s) => s.role === 'kasiyer' || s.role === 'garson');
      const role = front.filter((s) => s.role === 'kasiyer').length <= front.filter((s) => s.role === 'garson').length ? 'kasiyer' : 'garson';
      const w = (G.workers || []).filter((x) => x.role === role || (x.role === 'kasiyer' || x.role === 'garson')).sort((a, c) => (c.speed || 0) - (a.speed || 0))[0];
      if (w && KE.canHire(G, b, w.role).ok) { w.branchId = b.id; w.hiredDay = G.day; G.staff.push(w); G.workers = G.workers.filter((x) => x !== w); notes.push('eleman'); b.mgrHired = w.name; }
    }
    b.managedNote = notes;
  }
  /* Bugünün talebi / son günlerin ortalaması. Sabah siparişi buna göre büyür ya da küçülür. */
  /* özel günün saatlik çarpanları (cuma öğlesi, maç akşamı) dahil günlük müşteri tahmini */
  KE.forecastCustomers = function (G, b) {
    const sp = KE.specialDay(G.day), C = KE.HOUR_CURVE;
    const sum = Object.values(C).reduce((a, v) => a + v, 0);
    const h = sp && sp.hours ? Object.keys(C).reduce((a, k) => a + C[k] * (sp.hours[k] || 1), 0) / sum : 1;
    return KE.expectedCustomers(G, b) * h;
  };
  KE.demandFactor = function (G, b) {
    const h = (b.expHist || []).slice(0, -1);
    if (h.length < 2) return 1;
    const avg = h.reduce((a, x) => a + x, 0) / h.length;
    return avg > 0 ? Math.round(Math.max(0.85, Math.min(1.6, KE.forecastCustomers(G, b) / avg)) * 100) / 100 : 1;
  };
  KE.stockNeed = (G, b, k, f) => (b.usage[k] || 0) * b.stockLevel * (f == null ? KE.demandFactor(G, b) : f);
  function fillStock(G, b, f) {
    let cost = 0, farm = 0;
    Object.keys(b.usage).forEach((k) => {
      let need = Math.max(0, KE.stockNeed(G, b, k, f) - (b.stock[k] || 0));
      if (need > 0 && G.farm && G.farm.store[k] > 0) {
        const take = Math.min(need, G.farm.store[k]);
        G.farm.store[k] -= take; b.stock[k] = (b.stock[k] || 0) + take; need -= take; farm += take; G.farm.bonus = G.farm.bonus || {}; G.farm.bonus[k] = true; G.farm.shipped += take;
      }
      if (need > 0) { cost += need * KE.ingPrice(G, b, k); b.stock[k] = (b.stock[k] || 0) + need; }
    });
    G.cash -= cost;
    return { cost, farm };
  }
  /* Sabah, kepenk açılmadan: bugünün ihtiyacına göre eksikleri tamamla (kampanya, stok ayarı sonrası) */
  KE.shortfall = function (G, b) {
    const f = KE.demandFactor(G, b);
    let cost = 0; const items = [];
    Object.keys(b.usage).forEach((k) => { const q = KE.stockNeed(G, b, k, f) - (b.stock[k] || 0); if (q > 0.01) { items.push(k); cost += q * KE.ingPrice(G, b, k); } });
    return { cost, items, factor: f };
  };
  /* Sabah kontrol listesi için gerçekçi stok tahmini (motoru değiştirmez, yalnızca okur):
     bugünkü müşteri tahmini × gelen kapıdaki fazlalık payı × dünkü ürün karışımı (en çok satan ağır basar).
     Her malzeme için saatlik yoğunluk eğrisine göre bitiş saati hesaplanır; kapanıştan önce bitecekse eksiktir. */
  KE.STOCK_SAFETY = 1.15;
  KE.stockForecast = function (G, b) {
    const M = MODE(G), sp = KE.specialDay(G.day), C = KE.HOUR_CURVE;
    const on = M.products.filter((p) => b.menu[p.id] && !(KE.isLocked && KE.isLocked(G, p)));
    const cust = KE.forecastCustomers(G, b) * KE.STOCK_SAFETY;
    const sum = G.lastSummary && G.lastSummary.branches && G.lastSummary.branches[b.id];
    const by = (sum && sum.stats.byProduct) || {};
    const tot = on.reduce((a, p) => a + (by[p.id] || 0), 0);
    const share = {};
    on.forEach((p) => { share[p.id] = tot >= 20 ? (by[p.id] || 0) / tot : 1 / (on.length || 1); });
    const top = on.slice().sort((a, c) => share[c.id] - share[a.id])[0];
    const hours = Object.keys(C).map(Number).sort((a, c) => a - c);
    const w = hours.map((h) => C[h] * (sp && sp.hours ? (sp.hours[h] || 1) : 1));
    const wSum = w.reduce((a, x) => a + x, 0) || 1;
    const items = [];
    Object.keys(b.usage).forEach((k) => {
      let per = (M.drink.ing[k] || 0) * M.drinkRate;
      on.forEach((p) => { per += share[p.id] * (p.ing[k] || 0); });
      const need = cust * per, have = b.stock[k] || 0;
      if (need <= 0) return;
      let acc = 0, outHour = null;
      for (let i = 0; i < hours.length; i++) { acc += need * w[i] / wSum; if (acc > have + 1e-9) { outHour = hours[i]; break; } }
      items.push({ k, need, have, outHour });
    });
    const short = items.filter((x) => x.outHour != null).sort((a, c) => a.outHour - c.outHour);
    return { customers: cust, top: top ? top.id : null, items, short, ok: !short.length };
  };
  KE.topUpToday = function (G, b) {
    if (G.phase !== 'morning') return 0;
    const r = fillStock(G, b, KE.demandFactor(G, b));
    G.today[b.id].purchases += r.cost; G.today[b.id].farmKg = (G.today[b.id].farmKg || 0) + r.farm;
    return r.cost;
  };
  KE.morning = function (G) {
    KE.RNG.seed(G, 'morning');
    G.today = {};
    if (G.farm) G.farm.bonus = {};
    G.branches.forEach((b) => { if (KE.isManaged(G, b)) manage(G, b); else b.managedNote = null; });
    /* dün acil kurye çağrıldıysa sabah siparişi kendiliğinden "Bol"a geçer */
    G.branches.forEach((b) => { b.bolNote = false; if (b.courierUsed) { b.courierUsed = false; if (b.stockLevel < 1.5) { b.stockLevel = 1.5; b.bolNote = true; } } });
    G.branches.forEach((b) => {
      /* talep tahmini: bugünün beklenen müşterisi son günlerin ortalamasına göre (özel gün, hafta sonu, kampanya) */
      const e = KE.forecastCustomers(G, b);
      b.expHist = (b.expHist || []).concat([Math.round(e * 10) / 10]).slice(-8);
      const r = fillStock(G, b, KE.demandFactor(G, b));
      G.today[b.id] = { purchases: r.cost, farmKg: r.farm };
    });
    KE.makeDaily(G);
    if (!G.weekly) KE.makeWeekly(G);
    if (!G.regulars) { G.regulars = {}; KE.REGULARS.forEach((r) => { G.regulars[r.id] = { loyalty: 0, visits: 0 }; }); }
    G.regularVisits = [];
    const openB = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    if (openB.length) KE.REGULARS.forEach((r) => {
      const st = G.regulars[r.id];
      if (KE.rand() < 0.3 + st.loyalty * 0.04) G.regularVisits.push({ rid: r.id, branchId: openB[st.visits % openB.length === 0 ? 0 : Math.floor(KE.rand() * openB.length)].id, minute: 60 + Math.floor(KE.rand() * 600) });
    });
    G.staff.forEach((s) => { s.energy = 100; s.task = null; if (s.prevPos) { s.pos = s.prevPos; delete s.prevPos; } if (!KE.POSITIONS[s.role].includes(s.pos) || s.pos === 'mola') s.pos = KE.POSITIONS[s.role][0]; });
    /* ekip bu hafta hangi bahşiş kuralını istiyor */
    if (!G.tipWish || G.tipWish.until < G.day) {
      const st = G.staff, cir = st.filter((s) => s.role === 'cirak' && s.mentorId).length, usta = st.filter((s) => s.role === 'usta').length;
      /* "Eşit" zaten varsayılan: seyrek istenir; çıraklı ekipler ustaya ağırlık, kalabalık ekipler performans ister */
      const opts = ['esit', 'performans', 'performans'].concat(cir ? ['usta', 'usta'] : ['usta']).concat(usta >= 3 ? ['usta'] : []).concat(st.length >= 8 ? ['performans'] : []);
      let left = 0; while (left < 6 && !KE.isWeekEnd(G.day + left)) left++;
      G.tipWish = { rule: opts[Math.floor(KE.rand() * opts.length)], until: G.day + left, days: 0, hits: 0 };
    }
    /* rehber müfettişi: tepedeki zincire habersiz gelir */
    /* müfettiş bir gün önceden belirlenir: rezervasyonlu şubeye gelecekse defterde adı görünür */
    G.inspect = G.inspectNext && G.inspectNext.day === G.day && G.branches.some((x) => x.id === G.inspectNext.bid) ? { bid: G.inspectNext.bid } : null;
    if (G.inspectNext && G.inspectNext.day <= G.day) G.inspectNext = null;
    if (!G.inspect && !G.inspectNext && (G.era || 1) >= 3 && G.reputation >= 88 && (G.stars || 0) < 3 && G.day - (G.lastInspect || 0) > 45 && openB.length && KE.rand() < 0.06) {
      G.inspectNext = { bid: openB[Math.floor(KE.rand() * openB.length)].id, day: G.day + 1 }; G.lastInspect = G.day + 1;
    }
    G.phase = 'morning';
  };
  KE.buyExtra = function (G, b, k, qty) {
    const c = qty * KE.ingPrice(G, b, k);
    G.cash -= c; b.stock[k] = (b.stock[k] || 0) + qty;
    G.today[b.id].purchases += c;
    return c;
  };

  /* ---------- Günün hedefleri ---------- */
  KE.makeDaily = function (G) {
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    const exp = open.reduce((a, b) => a + KE.expectedCustomers(G, b), 0);
    if (!exp) { G.daily = []; return; }
    const reward = Math.round(5000 * G.priceIndex * (1 + 0.6 * (open.length - 1)) / 500) * 500;
    const pool = [
      { kind: 'served', target: Math.max(20, Math.round(exp * 0.92 / 5) * 5), text: (t) => `${t} müşteriye servis yap` },
      { kind: 'sat', target: 78, text: (t) => `Ortalama memnuniyet %${t} ve üstü` },
      { kind: 'nocold', target: 0, text: () => 'Tezgâhta hiç tabak soğumasın' },
      { kind: 'lost', target: 4, text: (t) => `En fazla ${t} müşteri kaçır` },
      { kind: 'tips', target: Math.max(500, Math.round(exp * 14 * G.priceIndex / 100) * 100), text: (t) => `${KE.tl(t)} bahşiş topla` },
      { kind: 'match', target: Math.max(4, Math.round(exp * 0.08)), text: (t) => `${t} kez "Ellerine sağlık!" duy` }
    ];
    const others = pool.slice(1).sort(() => KE.rand() - 0.5).slice(0, 2);
    G.daily = [pool[0]].concat(others).map((g) => ({ kind: g.kind, target: g.target, text: g.text(g.target), reward }));
    /* bonus: tezgâha geçip kendin hazırla (isteğe bağlı) */
    G.daily.push({ kind: 'player', target: 6, text: 'Bonus: tezgâhta kendin 6 sipariş hazırla', reward: reward * 2, bonus: true });
  };
  function dailyTotals(G) {
    const t = { served: 0, satS: 0, satN: 0, cold: 0, lost: 0, tips: 0, match: 0, player: 0 };
    G.branches.forEach((b) => {
      const S = G.live && G.live[b.id] ? G.live[b.id].stats : (G.lastSummary && G.lastSummary.branches[b.id] ? G.lastSummary.branches[b.id].stats : null);
      if (!S) return;
      t.served += S.served; t.satS += S.satSum; t.satN += S.satN; t.cold += S.cold; t.lost += S.lost; t.tips += S.tips; t.match += S.matches; t.player += S.playerServed || 0;
    });
    return t;
  }
  /* Her hedef için: değer, ilerleme (0–1) ve durum (açık, tamam, kaçtı) */
  KE.dailyProgress = function (G, final) {
    const t = dailyTotals(G);
    return (G.daily || []).map((g) => {
      let v, p, state;
      if (g.kind === 'served') { v = t.served; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'tips') { v = t.tips; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'match') { v = t.match; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'player') { v = t.player; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'sat') { v = t.satN ? t.satS / t.satN : 0; p = t.satN ? v / g.target : 0; state = !t.satN ? 'open' : v >= g.target ? (final ? 'done' : 'ok') : 'open'; }
      else if (g.kind === 'nocold') { v = t.cold; p = v ? 0 : 1; state = v > 0 ? 'fail' : final ? 'done' : 'ok'; }
      else { v = t.lost; p = Math.max(0, 1 - v / (g.target + 1)); state = v > g.target ? 'fail' : final ? 'done' : 'ok'; }
      if (final && state !== 'done') state = 'fail';
      return Object.assign({}, g, { value: v, p: Math.max(0, Math.min(1, p)), state });
    });
  };
})();


// ---- js/sim/service.js ----
/* Kebab Empire — simülasyon motoru (5/8): servis
   Müşteri gelişi, sipariş seçimi, çalışanların görevleri, memnuniyet/bahşiş, otomatik ekip ve dakikalık adım. */
(function () {
  const { clamp, rnd, pick, mode: MODE, prod: prodOf } = KE.U;
  KE.MINUTES = (KE.CLOSE_HOUR - KE.OPEN_HOUR) * 60;
  KE.MINUTE_MS = 400; // 1× hızda bir oyun dakikası

  /* ---------- Servis ---------- */
  KE.startService = function (G) {
    KE.pickMid(G);
    KE.RNG.seed(G, 'svc');
    G.dayLog = [];
    G.phase = 'service';
    G.live = {};
    G.branches.forEach((b) => {
      const L = G.live[b.id] = KE.newLive(G, b);
      if (!KE.branchStaff(G, b).some(KE.isCook)) { L.done = true; L.closed = true; }
    });
  };
  KE.newLive = function (G, b) {
    KE.branchStaff(G, b).forEach((s) => { s.servedToday = 0; s.tipsToday = 0; s.tasksToday = 0; s.minEnergy = 100; s.task = null; s.home = s.offDay === G.day; if (s.home) s.pos = 'mola'; });
    const expected = KE.expectedCustomers(G, b);
    const curveSum = Object.values(KE.HOUR_CURVE).reduce((a, v) => a + v, 0);
    const tables = [];
    for (let i = 0; i < KE.tableCount(G, b); i++) tables.push({ id: i, occ: null, dirty: false, by: null });
    return {
      branchId: b.id, minute: 0, custs: {}, queue: [], tickets: [], tables, nextId: 1, spawnAcc: 0, paketAcc: 0, expected, curveSum,
      stats: { arrivals: 0, served: 0, lost: 0, lostPrice: 0, lostWait: 0, lostFull: 0, lostStock: 0, lostFood: 0, revenue: 0, card: 0, cash: 0, tips: 0,
        satSum: 0, satN: 0, matches: 0, byProduct: {}, hourly: new Array(14).fill(0), hourlyCust: new Array(14).fill(0), stockouts: {}, byType: {},
        repDelta: 0, best: null, playerServed: 0, gurmeHappy: 0, paket: 0, paketRev: 0, cold: 0 },
      fx: [], player: { active: false, tid: null, step: 0, errors: 0, start: 0, slots: [], sel: 0, combo: 0 }, done: false,
      special: KE.specialDay(G.day)
    };
  };

  function availableProducts(G, b) { return MODE(G).products.filter((p) => KE.canMake(G, b, p)); }

  function chooseType(G, b, hour) {
    const d = KE.district(b);
    const mode = MODE(G);
    const weights = [];
    Object.entries(KE.CUSTOMER_TYPES).forEach(([t, ct]) => {
      let w = (d.mix[t] || 0.1) * ((ct.hours && ct.hours[hour]) || 1);
      if (KE.isWeekend(G.day) && ct.weekend) w *= ct.weekend;
      let best = 0;
      (mode.favorites[t] || []).forEach((pid) => { const p = prodOf(G, pid); if (p && KE.canMake(G, b, p)) best = Math.max(best, Math.max(1, KE.bestStar(G, b, pid))); });
      w *= Math.max(0.6, 1 + 0.15 * (best - 2));
      if (t === 'gurme') w *= best >= 5 ? 1.6 : best >= 4 ? 1 : 0.25;
      w *= KE.modVal(G, 'type:' + t);
      const sp = KE.specialDay(G.day);
      if (sp && sp.types[t]) w *= sp.types[t];
      weights.push([t, w]);
    });
    let r = KE.rand() * weights.reduce((a, x) => a + x[1], 0);
    for (const [t, w] of weights) { if ((r -= w) <= 0) return t; }
    return weights[0][0];
  }
  function chooseProduct(G, b, type, count) {
    const avail = availableProducts(G, b);
    if (!avail.length) return { p: null };
    const favs = (MODE(G).favorites[type] || []).map((id) => avail.find((p) => p.id === id)).filter(Boolean);
    let p = null;
    if (favs.length && KE.rand() < 0.72) {
      const w = favs.map((_, i) => 3 - i); let r = KE.rand() * w.reduce((a, x) => a + x, 0);
      for (let i = 0; i < favs.length; i++) { if ((r -= w[i]) <= 0) { p = favs[i]; break; } }
    }
    if (!p && G.signature && KE.rand() < 0.08 * G.signature.level) p = avail.find((x) => x.id === G.signature.pid) || null;
    if (!p) p = pick(avail);
    if (!KE.hasStock(b, p, count)) {
      const alt = avail.filter((x) => KE.hasStock(b, x, count));
      return { p: alt.length ? pick(alt) : null, stockMiss: p };
    }
    return { p };
  }
  function lose(L, c, reason, text) {
    L.stats.lost += c.count; L.stats[reason] += c.count;
    if (c.regular && KE.G && KE.G.regulars) { const r = KE.G.regulars[c.regular]; r.loyalty = Math.max(0, r.loyalty - 2); (L.stats.regulars = L.stats.regulars || []).push({ id: c.regular, gain: -2 }); }
    if (text) L.fx.push({ t: 'bad', cid: c.id, text });
  }

  function spawn(G, b, L) {
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    const spH = L.special && L.special.hours[hour] ? L.special.hours[hour] : 1;
    const burst = (L.boost && L.minute < L.boost.until ? L.boost.mult : 1) * (L.rain && L.minute < L.rain.until ? L.rain.mult : 1);
    const res = KE.resOn(b);
    /* rezervasyonlu şube: kapıdan gelenin bir kısmı yer ayırtmadan gelmez (×0,97) */
    const rate = L.expected * (KE.HOUR_CURVE[hour] || 0.3) * spH * burst * (res ? 0.97 : 1) / L.curveSum / 60;
    (G.regularVisits || []).filter((v) => v.branchId === b.id && v.minute === L.minute).forEach((v) => spawnRegular(G, b, L, v.rid));
    L.spawnAcc += rate * rnd(0.6, 1.4);
    while (L.spawnAcc >= 1) {
      L.spawnAcc -= 1;
      const type = chooseType(G, b, hour);
      const ct = KE.CUSTOMER_TYPES[type];
      const count = ct.group && KE.rand() < 0.55 ? Math.round(rnd(ct.group[0], ct.group[1])) : 1;
      L.stats.arrivals += count;
      const id = L.nextId++;
      const c = { id, type, count, look: KE.customerLook(type), arrive: L.minute };
      if (L.queue.length >= KE.equip(G, b, 'service').queue + (b.flagship ? 4 : 0)) {
        /* rezervasyonda dolu saat önceden söylenir: kaçan müşteri sayılmaz, kibarca başka saate yönlendirilir */
        if (res) { L.stats.turned = (L.stats.turned || 0) + c.count; L.fx.push({ t: 'pass', cid: id }); continue; }
        lose(L, c, 'lostFull', 'Çok kalabalık!'); L.fx.push({ t: 'pass', cid: id }); continue;
      }
      const ch = chooseProduct(G, b, type, count);
      if (ch.stockMiss && L.stats.stockouts[ch.stockMiss.id] == null) L.stats.stockouts[ch.stockMiss.id] = L.minute;
      if (!ch.p) { lose(L, c, 'lostStock', 'Hepsi bitmiş!'); continue; }
      const p = ch.p;
      const price = b.prices[p.id];
      const ratio = price / KE.marketPrice(G, p);
      /* fiyat: piyasanın üstü, müşteri tipine göre kademeli kaçırır; itibar yüksekse tolerans artar */
      /* piyasanın 2,5 katından pahalıya hiç kimse almaz (sınırsız fiyat açığı kapalı) */
      const pLeave = ratio >= 2.5 ? 1 : Math.min(0.95, Math.max(0, (ratio - KE.priceTolerance(G, b)) * 3.5 * ct.priceSens));
      if (pLeave > 0 && KE.rand() < pLeave) { lose(L, c, 'lostPrice', 'Çok pahalı!'); L.fx.push({ t: 'pass', cid: id }); continue; }
      const take = (ct.takeaway || 0) * (G.mode === 'kebap' ? 0.4 : 1);
      Object.assign(c, {
        pid: p.id, price, ratio, state: 'queue', wait: 0, takeaway: KE.rand() < take,
        patience: ct.patience * KE.equip(G, b, 'service').patience * (G.mode === 'kebap' ? 1.5 : 1) * KE.modVal(G, 'patience') * (res ? 1.6 : 1),
        eat: (ct.eat || 15) * (G.mode === 'kebap' ? 1.6 : 1) * rnd(0.8, 1.2)
      });
      L.custs[id] = c; L.queue.push(id);
    }
  }
  function spawnRegular(G, b, L, rid) {
    const R = KE.REGULARS.find((x) => x.id === rid);
    const st = G.regulars[rid];
    const ct = KE.CUSTOMER_TYPES[R.type];
    const count = st.loyalty >= 5 ? 2 : 1;
    let p = KE.MODES[G.mode].products.find((x) => x.id === R.fav[G.mode]);
    if (!p || !KE.canMake(G, b, p) || !KE.hasStock(b, p, count)) { const ch = chooseProduct(G, b, R.type, count); p = ch.p; }
    if (!p) return;
    /* müdavim de fiyata bakar: piyasanın iki katından pahalıysa o gün gelmez, gönlü biraz kırılır */
    if (b.prices[p.id] / KE.marketPrice(G, p) > 2) { st.loyalty = Math.max(0, st.loyalty - 1); return; }
    const look = R.look || KE.CAST[R.cast].look;
    const id = L.nextId++;
    L.stats.arrivals += count;
    L.custs[id] = { id, type: R.type, count, look, arrive: L.minute, pid: p.id, price: b.prices[p.id], ratio: 1, state: 'queue', wait: 0, takeaway: false,
      patience: ct.patience * 1.4 * KE.equip(G, b, 'service').patience, eat: (ct.eat || 15) * (G.mode === 'kebap' ? 1.6 : 1), regular: rid };
    L.queue.push(id);
    L.fx.push({ t: 'regular', cid: id, text: R.name + ' geldi!' });
  }
  function spawnPaket(G, b, L) {
    const kuryes = KE.branchStaff(G, b).filter((s) => s.role === 'kurye').length;
    if (!kuryes || L.minute > KE.MINUTES - 30) return;
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    L.paketAcc += L.expected * 0.16 * (0.6 + G.reputation / 100) * (KE.HOUR_CURVE[hour] || 0.3) / L.curveSum / 60 * Math.min(1.6, 0.8 + kuryes * 0.4);
    while (L.paketAcc >= 1) {
      L.paketAcc -= 1;
      const avail = availableProducts(G, b).filter((p) => KE.hasStock(b, p, 1) && b.prices[p.id] / KE.marketPrice(G, p) <= 1.6);
      if (!avail.length) return;
      const p = pick(avail);
      L.tickets.push({ id: L.nextId++, cid: null, pid: p.id, count: 1, state: 'wait', paket: true, created: L.minute });
    }
  }

  /* Hız: çalışanın bir dakikada yaptığı iş */
  KE.staffRate = function (G, b, s) {
    const tr = KE.TRAITS[s.trait] || {};
    const e = s.energy;
    const energyMul = e >= 45 ? 1 : 0.62 + e / 45 * 0.38;
    const mgr = KE.branchStaff(G, b).find((x) => x.role === 'mudur' && x.pos === 'yonetim');
    let r = s.speed * (1 + (tr.speed || 0)) * (0.82 + s.morale * 0.0036) * energyMul * (mgr ? 1.03 + mgr.skill * 0.06 : 1) * (b.cleanliness < 35 ? 0.93 : 1);
    if (KE.isCook(s)) r *= KE.equip(G, b, 'prep').speed;
    return r;
  };
  KE.cookingStaff = function (G, b) {
    const L = G.live && G.live[b.id];
    const down = L && L.stationDown && (L.stationDownUntil == null || L.minute < L.stationDownUntil) ? L.stationDown : 0;
    const stations = Math.max(1, KE.stations(G, b) - down);
    return KE.branchStaff(G, b).filter((s) => KE.isCook(s) && s.pos === 'ocak').slice(0, stations);
  };

  function cookQuality(G, b, s, pid) {
    const tier = KE.TIERS[b.tier], prep = KE.equip(G, b, 'prep');
    const tr = KE.TRAITS[s.trait] || {};
    const star = Math.max(1, s.spec[pid] || 0);
    let q = star + tier.quality + (prep.quality || 0) + (tr.quality || 0) + (1 - s.consistency) * rnd(-2, 0.6) + (s.quality - 0.8);
    if (tr.grumpy && s.morale < 40) q -= 1.2;
    if (s.morale < 30) q -= 0.5;
    if (s.energy < 20) q -= 0.4;
    if (G.farm && G.farm.bonus && Object.keys(prodOf(G, pid).ing).some((k) => G.farm.bonus[k])) q += 0.25;
    return clamp(q, 0, 6);
  }

  function findTask(G, b, L, s, cooking) {
    const T = (type, ref, work) => ({ type, ref, remain: work, total: work });
    if (s.pos === 'ocak') {
      if (!cooking.includes(s)) return null;
      /* oyuncu tezgâhtaysa ve elinde boş yer varsa yeni fiş önce ona düşer */
      const pfree = L.player.active && !L.player.afk && (!(L.player.slots || []).length || L.minute - (L.player.tap || 0) <= 2) && (L.player.slots || []).length < KE.playerCap(G, b);
      const waiting = L.tickets.filter((t) => t.state === 'wait' && !(pfree && L.minute - t.created < 2));
      let best = null, score = -1e9;
      waiting.slice(0, 5).forEach((t, i) => {
        const p = prodOf(G, t.pid), star = s.spec[t.pid] || 0;
        if (p.requiresSpec && star < 1) return;
        const sc = star * 2 - i * 1.4 + (L.minute - t.created) / 4;
        if (sc > score) { score = sc; best = t; }
      });
      if (!best) return null;
      const p = prodOf(G, best.pid);
      if (!KE.hasStock(b, p, best.count)) {
        if (L.stats.stockouts[p.id] == null) L.stats.stockouts[p.id] = L.minute;
        cancelTicket(G, b, L, best, p.name + ' bitti!');
        return null;
      }
      Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * best.count; });
      best.state = 'cook'; best.cook = s.id;
      return T('cook', best.id, p.prep * (1 + 0.45 * (best.count - 1)));
    }
    if (s.pos === 'kasa') {
      const free = L.tables.find((t) => !t.occ && !t.dirty);
      const id = L.queue.find((cid) => { const c = L.custs[cid]; return c && !c.ordering && (c.takeaway || free); });
      if (id == null) return null;
      const c = L.custs[id];
      c.ordering = s.id;
      if (!c.takeaway) { free.occ = c.id; c.table = free.id; }
      return T('order', id, 0.9 + 0.25 * (c.count - 1));
    }
    if (s.pos === 'servis' || s.pos === 'temizlik') {
      if (s.pos === 'servis') {
        const ready = L.tickets.filter((t) => t.state === 'ready' && !t.paket && !t.by).sort((a, c) => a.readyAt - c.readyAt)[0];
        if (ready) { ready.by = s.id; return T('deliver', ready.id, 1.4); }
      }
      const dirty = L.tables.find((t) => t.dirty && !t.by);
      if (dirty) { dirty.by = s.id; return T('clear', dirty.id, 1); }
      if (s.pos === 'temizlik') return T('clean', null, 6);
      return null;
    }
    if (s.pos === 'paket') {
      const ready = L.tickets.find((t) => t.state === 'ready' && t.paket && !t.by);
      if (ready) { ready.by = s.id; return T('paket', ready.id, 20); }
      return null;
    }
    return null;
  }

  function cancelTicket(G, b, L, t, text) {
    L.tickets.splice(L.tickets.indexOf(t), 1);
    if (t.cid != null) {
      const c = L.custs[t.cid];
      if (c) { refund(L, c); lose(L, c, 'lostStock', text); removeCust(L, c, false); }
    }
  }
  function refund(L, c) {
    if (c.paid) { L.stats.revenue -= c.paid; L.stats.card -= c.paid; const h = Math.min(13, Math.floor(c.orderedAt / 60)); L.stats.hourly[h] -= c.paid; c.paid = 0; }
  }
  function removeCust(L, c, dirty) {
    if (c.table != null) { const t = L.tables[c.table]; if (t) { t.occ = null; t.dirty = !!dirty; t.by = null; } }
    const qi = L.queue.indexOf(c.id); if (qi > -1) L.queue.splice(qi, 1);
    delete L.custs[c.id];
  }

  function finishTask(G, b, L, s, task) {
    const S = L.stats;
    s.tasksToday++;
    if (task.type === 'cook') {
      const t = L.tickets.find((x) => x.id === task.ref);
      if (!t) return;
      t.state = 'ready'; t.readyAt = L.minute; t.q = cookQuality(G, b, s, t.pid); t.cookName = s.name; t.cookId = s.id;
      const tr = KE.TRAITS[s.trait] || {};
      const p = prodOf(G, t.pid);
      KE.gainXp(s, t.pid, t.count * (1 + (tr.xp || 0)) * (p.requiresSpec && !s.spec[t.pid] ? 0 : 1));
      s.servedToday += t.count; s.servedTotal += t.count;
      L.fx.push({ t: 'ready', sid: s.id, pid: t.pid });
    } else if (task.type === 'order') {
      const c = L.custs[task.ref];
      if (!c) return;
      const qi = L.queue.indexOf(c.id); if (qi > -1) L.queue.splice(qi, 1);
      const p = prodOf(G, c.pid);
      if (!KE.hasStock(b, p, c.count)) {
        const alt = availableProducts(G, b).filter((x) => KE.hasStock(b, x, c.count));
        if (L.stats.stockouts[p.id] == null) L.stats.stockouts[p.id] = L.minute;
        if (!alt.length) { lose(L, c, 'lostStock', p.name + ' kalmamış!'); removeCust(L, c, false); return; }
        c.pid = pick(alt).id; c.price = b.prices[c.pid]; c.ratio = c.price / KE.marketPrice(G, prodOf(G, c.pid));
      }
      const drinks = KE.rand() < MODE(G).drinkRate ? c.count : 0;
      if (drinks) Object.entries(MODE(G).drink.ing).forEach(([k, q]) => { b.stock[k] = Math.max(0, (b.stock[k] || 0) - q * drinks); });
      const pay = (c.price * c.count + drinks * b.prices[MODE(G).drink.id]) * KE.modVal(G, 'spend') * (KE.resOn(b) ? 1.05 : 1);
      c.paid = pay; c.orderedAt = L.minute; c.orderBy = s.id; c.state = c.takeaway ? 'pickup' : 'seat'; c.wait = 0;
      S.revenue += pay;
      if (KE.rand() < 0.66) S.card += pay; else S.cash += pay;
      const h = Math.min(13, Math.floor(L.minute / 60));
      S.hourly[h] += pay; S.hourlyCust[h] += c.count;
      L.tickets.push({ id: L.nextId++, cid: c.id, pid: c.pid, count: c.count, state: 'wait', created: L.minute });
      s.servedToday += c.count * 0.5;
      L.fx.push({ t: 'pay', cid: c.id, text: '+' + KE.tl(pay) });
    } else if (task.type === 'deliver') {
      const t = L.tickets.find((x) => x.id === task.ref);
      if (!t) return;
      L.tickets.splice(L.tickets.indexOf(t), 1);
      const c = L.custs[t.cid];
      if (!c) return;
      serveCustomer(G, b, L, c, t, s);
      s.servedToday += c.count;
    } else if (task.type === 'clear') {
      const t = L.tables[task.ref];
      if (t) { t.dirty = false; t.by = null; }
      b.cleanliness = clamp(b.cleanliness + 0.15, 0, 100);
    } else if (task.type === 'clean') {
      b.cleanliness = clamp(b.cleanliness + 1.2, 0, 100);
    } else if (task.type === 'paket') {
      const t = L.tickets.find((x) => x.id === task.ref);
      if (!t) return;
      L.tickets.splice(L.tickets.indexOf(t), 1);
      const pay = b.prices[t.pid];
      S.revenue += pay; S.card += pay; S.paket += 1; S.paketRev += pay;
      S.byProduct[t.pid] = (S.byProduct[t.pid] || 0) + 1;
      const h = Math.min(13, Math.floor(L.minute / 60)); S.hourly[h] += pay;
      S.repDelta += ((t.q || 3) - 3) * 0.02;
      s.servedToday += 1;
    }
  }

  /* Müşteriye yemeği ver: memnuniyet ve itibar */
  function serveCustomer(G, b, L, c, t, server) {
    const mode = MODE(G);
    const ct = KE.CUSTOMER_TYPES[c.type];
    const S = L.stats;
    const coolWait = L.minute - t.readyAt;
    let q = (t.q == null ? 3 : t.q) - Math.max(0, coolWait - 3) * 0.22;
    if (coolWait > 3) S.cold += 1;
    const st = KE.branchStaff(G, b);
    const amb = KE.ambience(G, b);
    const orderer = st.find((x) => x.id === c.orderBy);
    const friendly = ((orderer ? orderer.friendly * (0.7 + orderer.morale / 200) : 0.4) + server.friendly * (0.7 + server.morale / 200)) / 2;
    const total = L.minute - c.arrive;
    const speedScore = 16 * clamp(1 - total / (c.patience * 2.2), -0.6, 1);
    /* müşterinin katlandığı prim (itibar, imza, amiral) memnuniyeti düşürmez */
    const er = c.ratio - (KE.priceTolerance(G, b) - 1.02);
    const pricePen = er > 1 ? (er - 1) * 70 * ct.priceSens : -(1 - er) * 25 * ct.priceSens;
    const star = t.cookId === 'player' ? 4 : ((st.find((x) => x.id === t.cookId) || { spec: {} }).spec[c.pid] || 1);
    const match = (mode.favorites[c.type] || []).includes(c.pid) && star >= 4 && q >= 4;
    let sat = 35 + q * 8.5 + speedScore + Math.min(10, amb.score / 5) + (amb.concept ? 4 * amb.concept.power : 0) + friendly * 7 + (b.cleanliness - 50) / 10 - pricePen + (match ? 8 : 0);
    sat = clamp(sat, 0, 100);
    c.sat = sat; c.match = match; c.server = server.id; c.cookId = t.cookId; c.served = L.minute;
    S.served += c.count; S.satSum += sat * c.count; S.satN += c.count;
    S.byProduct[c.pid] = (S.byProduct[c.pid] || 0) + c.count;
    S.byType[c.type] = (S.byType[c.type] || 0) + c.count;
    S.repDelta += (sat - 67) / 2600 * c.count * (c.type === 'gurme' ? 3 : 1);
    if (match) S.matches += c.count;
    if (c.type === 'gurme' && sat > 85) S.gurmeHappy++;
    if (t.cookId === 'player') S.playerServed += c.count;
    L.fx.push({ t: 'served', cid: c.id, sat, match, text: match ? 'Ellerine sağlık!' : sat > 84 ? 'Harika!' : sat > 62 ? 'Güzel' : sat > 45 ? 'İdare eder' : 'Bir daha gelmem' });
    if (c.regular) {
      const R = KE.REGULARS.find((x) => x.id === c.regular), r = G.regulars[c.regular];
      const gain = sat > 84 ? 2 : sat > 66 ? 1 : sat < 52 ? -2 : 0;
      const before = r.loyalty;
      r.loyalty = clamp(r.loyalty + gain, 0, 10); r.visits++;
      if (before < 8 && r.loyalty >= 8) { G.reputation = clamp(G.reputation + 1.5, 0, 100); r.praised = G.day; }
      (S.regulars = S.regulars || []).push({ id: c.regular, gain });
      L.fx.push({ t: 'regular', cid: c.id, text: gain >= 0 ? R.says[Math.floor(KE.rand() * R.says.length)] : 'Bu sefer olmadı evladım…' });
    }
    if (c.takeaway) { leave(G, b, L, c); }
    else { c.state = 'eat'; c.eatLeft = c.eat; }
  }
  function leave(G, b, L, c) {
    const ct = KE.CUSTOMER_TYPES[c.type];
    const st = KE.branchStaff(G, b);
    const server = st.find((x) => x.id === c.server);
    const cook = st.find((x) => x.id === c.cookId);
    const sat = c.sat || 0;
    const satMul = sat < 50 ? 0 : sat < 68 ? 0.45 : sat < 84 ? 1 : 1.7;
    let mul = satMul * (c.match ? 1.4 : 1);
    if (server) { const tr = KE.TRAITS[server.trait] || {}; mul *= (1 + (tr.tip || 0)) * (0.7 + server.friendly * 0.6) * (0.8 + server.morale / 250); }
    if (cook) { const tr = KE.TRAITS[cook.trait] || {}; mul *= 1 + (tr.tip || 0) * 0.5; if (cook.costume === 'yoresel' && c.match) mul *= 1.12; }
    if (c.cookId === 'player') mul *= 1.25;
    if (L.special && L.special.tip) mul *= L.special.tip;
    if (c.regular) mul *= 1.3;
    const tip = Math.round((c.paid || 0) * ct.tip * mul / 5) * 5;
    L.stats.tips += tip;
    if (!L.stats.best || tip > L.stats.best.tip) L.stats.best = { tip, type: c.type, pid: c.pid };
    if (tip > 0) L.fx.push({ t: 'tip', cid: c.id, text: 'Bahşiş ' + KE.tl(tip) });
    b.cleanliness = clamp(b.cleanliness - 0.25 * c.count, 0, 100);
    removeCust(L, c, !c.takeaway);
  }

  /* Pozisyon değiştir: elindeki iş bırakılır */
  KE.setPos = function (G, s, pos) {
    if (!KE.POSITIONS[s.role].includes(pos)) return;
    const L = G.live && G.live[s.branchId];
    if (L && s.task) releaseTask(L, s);
    s.pos = pos;
  };
  function releaseTask(L, s) {
    const t = s.task;
    s.task = null;
    if (!t) return;
    if (t.type === 'cook') { const k = L.tickets.find((x) => x.id === t.ref); if (k) { k.state = 'wait'; k.cook = null; } }
    if (t.type === 'deliver' || t.type === 'paket') { const k = L.tickets.find((x) => x.id === t.ref); if (k) k.by = null; }
    if (t.type === 'clear') { const k = L.tables[t.ref]; if (k) k.by = null; }
    if (t.type === 'order') { const c = L.custs[t.ref]; if (c) { c.ordering = null; if (c.table != null) { L.tables[c.table].occ = null; c.table = null; } } }
  }

  /* Otomatik ekip yönetimi: müdür varsa sık ve akıllı, yoksa yalnızca yorgunluğa bakar */
  function autoStaff(G, b, L) {
    const st = KE.branchStaff(G, b);
    const mgr = st.find((s) => s.role === 'mudur');
    const every = mgr ? 8 : 30;
    if (L.minute % every !== 0) return;
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    const peak = (KE.HOUR_CURVE[hour] || 0) >= 1;
    const cooks = st.filter(KE.isCook);
    const pending = L.tickets.filter((t) => t.state === 'wait').length;
    /* aynı işi yapan başka biri çalışıyorsa molaya gönder (müdürsüz şubede de bir görev hiç boş kalmaz) */
    const sameJob = (s, x) => (KE.isCook(s) ? KE.isCook(x) : x.role === s.role);
    st.forEach((s) => { if (s.energy < (mgr ? 22 : 12) && s.pos !== 'mola') { const same = st.filter((x) => sameJob(s, x) && x !== s && x.pos !== 'mola'); if (same.length || (mgr && !peak)) KE.setPos(G, s, 'mola'); } });
    st.forEach((s) => { if (s.pos === 'mola' && !s.home && s.energy >= (mgr ? 85 : 80)) KE.setPos(G, s, KE.POSITIONS[s.role][0]); });
    /* müdür olmasa da: kasada iki kişi varken servis boş kalmaz, kasa boşken servisteki biri kasaya geçer */
    const fr = st.filter((s) => (s.role === 'kasiyer' || s.role === 'garson') && s.pos !== 'mola' && !s.home);
    const ks = fr.filter((s) => s.pos === 'kasa'), sv = fr.filter((s) => s.pos === 'servis');
    if (!ks.length && sv.length > 0 && fr.length) { const x = sv.find((s) => s.role === 'kasiyer') || sv.find((s) => !s.task) || sv[0]; KE.setPos(G, x, 'kasa'); }
    else if (!sv.length && ks.length > 1) { const x = ks.find((s) => s.role === 'garson' && !s.task) || ks.find((s) => s.role === 'garson') || ks[ks.length - 1]; if (KE.POSITIONS[x.role].includes('servis')) { KE.setPos(G, x, 'servis'); } }
    if (!mgr) return;
    const stations = KE.stations(G, b);
    const working = cooks.filter((s) => s.pos === 'ocak');
    if (pending >= 2 || peak) cooks.filter((s) => s.pos === 'mola' && !s.home && s.energy > 40).slice(0, Math.max(0, stations - working.length)).forEach((s) => KE.setPos(G, s, 'ocak'));
    else if (working.length > 1 && pending === 0) { const tired = working.filter((s) => !s.task).sort((a, c) => a.energy - c.energy)[0]; if (tired && tired.energy < 70) KE.setPos(G, tired, 'mola'); }
    const front = st.filter((s) => ['kasiyer', 'garson', 'mudur'].includes(s.role) && s.pos !== 'mola' && s.role !== 'mudur');
    const queue = L.queue.length, ready = L.tickets.filter((t) => t.state === 'ready' && !t.paket).length, dirty = L.tables.filter((t) => t.dirty).length;
    const kasa = front.filter((s) => s.pos === 'kasa'), servis = front.filter((s) => s.pos === 'servis');
    if (!kasa.length && front.length) KE.setPos(G, front.find((s) => s.role === 'kasiyer') || front[0], 'kasa');
    else if (!servis.length && front.length > 1) KE.setPos(G, front.find((s) => s.pos === 'kasa' && s.role === 'garson') || kasa[kasa.length - 1], 'servis');
    else if (ready + dirty > 3 && kasa.length > 1) KE.setPos(G, kasa.find((s) => !s.task) || kasa[0], 'servis');
    else if (queue > 4 && servis.length > 1 && ready + dirty < 2) KE.setPos(G, servis.find((s) => !s.task) || servis[0], 'kasa');
  }

  /* Bir dakikalık adım */
  KE.tick = function (G, b, L) {
    if (L.done) return;
    const closing = L.minute >= KE.MINUTES - 20;
    if (!closing) { spawn(G, b, L); spawnPaket(G, b, L); }
    if (b.autoStaff) autoStaff(G, b, L);
    if (L.player.active && b.id === G.activeBranch) while (KE.playerTake(G));
    const st = KE.branchStaff(G, b);
    const cooking = KE.cookingStaff(G, b);
    st.forEach((s) => {
      if (s.pos === 'mola') { s.energy = Math.min(100, s.energy + 0.75); return; }
      if (s.task) {
        s.task.remain -= KE.staffRate(G, b, s);
        if (s.task.remain <= 0) { const t = s.task; s.task = null; finishTask(G, b, L, s, t); }
      }
      if (!s.task) s.task = findTask(G, b, L, s, cooking);
      const drain = s.task ? (KE.isCook(s) ? 0.115 : s.task.type === 'paket' ? 0.08 : 0.1) : 0.025;
      s.energy = Math.max(0, s.energy - drain * (G.mode === 'kebap' && KE.isCook(s) ? 1.15 : 1));
      s.minEnergy = Math.min(s.minEnergy, s.energy);
    });
    Object.values(L.custs).forEach((c) => {
      if (c.state === 'queue') {
        c.wait++;
        if (!c.ordering && c.wait > c.patience) { lose(L, c, 'lostWait', 'Bekletmeyin bizi!'); L.stats.repDelta -= 0.015 * c.count; removeCust(L, c, false); }
      } else if (c.state === 'seat' || c.state === 'pickup') {
        c.wait++;
        if (c.wait > c.patience * 1.9) {
          const t = L.tickets.find((x) => x.cid === c.id);
          if (t && t.state === 'cook' && !(t.cook === 'player' && c.wait > c.patience * 2.6)) return;
          if (t) L.tickets.splice(L.tickets.indexOf(t), 1);
          st.forEach((s) => { if (s.task && s.task.type === 'deliver' && t && s.task.ref === t.id) s.task = null; });
          refund(L, c); lose(L, c, 'lostFood', 'Yemek gelmedi!'); L.stats.repDelta -= 0.08 * c.count; removeCust(L, c, false);
        }
      } else if (c.state === 'eat') {
        c.eatLeft -= 1;
        if (c.eatLeft <= 0) leave(G, b, L, c);
      }
    });
    KE.playerTick(G, b, L);
    L.minute += 1;
    const busy = L.queue.length || Object.values(L.custs).some((c) => c.state !== 'eat') || L.tickets.some((t) => !t.paket || t.by);
    if (L.minute >= KE.MINUTES && !busy) {
      Object.values(L.custs).forEach((c) => leave(G, b, L, c));
      L.tickets = []; L.done = true;
    } else if (L.minute >= KE.MINUTES + 60) {
      Object.values(L.custs).forEach((c) => { if (c.state === 'eat') leave(G, b, L, c); else { refund(L, c); lose(L, c, 'lostWait', null); removeCust(L, c, false); } });
      L.tickets = []; L.done = true;
    }
    if (L.done) st.forEach((s) => { s.task = null; });
  };
  KE.tickAll = function (G) {
    const M = G.mid;
    if (M && M.choice == null) {
      const L = G.live[M.bid];
      if (L && L.minute >= M.minute + KE.MID_WAIT) {
        /* süre doldu: müdürü olan şubede kararı müdür verir (en iyi seçenek), yoksa güvenli seçenek */
        const D = KE.MIDS.find((x) => x.id === M.id), b = G.branches.find((x) => x.id === M.bid);
        const mgr = b && KE.branchStaff(G, b).some((s) => s.role === 'mudur');
        KE.resolveMid(G, mgr ? D.mgr : D.def); if (mgr) M.byMgr = true;
      }
    }
    G.branches.forEach((b) => { const L = G.live[b.id]; if (L) KE.tick(G, b, L); });
  };
  KE.allDone = (G) => G.branches.every((b) => !G.live[b.id] || G.live[b.id].done);
})();


// ---- js/sim/player.js ----
/* Kebab Empire — simülasyon motoru (6/8): oyuncu tezgâhta */
(function () {
  const { clamp, mode: MODE, prod: prodOf } = KE.U;
  /* ---------- Oyuncu tezgâhta ----------
     Overcooked usulü: oyuncu aynı anda 2 (hazırlık ekipmanı 2+ ise 3) sipariş tutar. Her tarif adımı bir
     istasyonda yapılır; istasyona dokunmak, o istasyonu sıradaki adım olarak bekleyen siparişi (önce seçili olanı)
     ilerletir. Ateş istasyonu süreli: et ateşe konur, pişince alınır; geç kalınırsa yanar. Hatasız ve hızlı
     siparişler kombo yapar. Bütün süreler oyun dakikasıyla ölçülür, böylece günlük yeniden oynatılabilir. */
  const slotsOf = (P) => P.slots || (P.slots = []);
  KE.playerCap = (G, b) => (b.equipment.prep >= 2 ? 3 : 2);
  /* oyuncu bu kadar dakika hiçbir istasyona dokunmazsa elindeki (dokunulmamış) fişler ustalara döner ve oyuncu,
     bir istasyona dokunana dek yeni fiş almaz. Çalışan oyuncunun bekleyen ikinci fişi geri alınmaz. */
  KE.PLAYER_IDLE = 12;
  /* slot görünümü eski alanlara yansır (tid/step/errors): sahne, testler ve eski günlükler bunlara bakar */
  function syncSelectedSlot(P) {
    const sl = slotsOf(P);
    if (P.sel == null || P.sel >= sl.length) P.sel = 0;
    const s = sl[P.sel];
    P.tid = s ? s.tid : null; P.step = s ? s.step : 0; P.errors = s ? s.errors : 0; P.start = s ? s.start : 0;
  }
  /* fişi ustalara geri ver; hiç dokunulmamışsa malzemesi depoya döner (çifte harcama olmasın) */
  function releaseSlot(G, b, L, sl) {
    const t = L.tickets.find((x) => x.id === sl.tid);
    if (t && t.state === 'cook' && t.cook === 'player') {
      t.state = 'wait'; t.cook = null;
      if (sl.step === 0 && sl.fire == null) { const p = prodOf(G, t.pid); Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] = (b.stock[k] || 0) + q * t.count; }); }
    }
    const P = L.player;
    P.slots.splice(P.slots.indexOf(sl), 1);
  }
  KE.playerToggle = function (G, on) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    on = !!on;
    if (on === !!P.active) return;
    if (!on) slotsOf(P).slice().forEach((sl) => releaseSlot(G, b, L, sl));
    Object.assign(P, { active: on, slots: [], sel: 0, combo: on ? P.combo || 0 : 0, tap: L.minute, afk: false });
    if (on && !P.quest && (P.questsDone || 0) < KE.QUESTS_PER_DAY && b.id === KE.mainBranchId(G)) newQuest(G, b, P);
    syncSelectedSlot(P);
  };
  KE.playerTake = function (G) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    /* eli boşsa hemen fiş gelir; ikinci/üçüncü fiş yalnızca son 2 dakikada istasyona dokunan (hızlı çalışan) oyuncuya */
    if (!P.active || slotsOf(P).length >= KE.playerCap(G, b) || P.afk || (slotsOf(P).length && L.minute - (P.tap || 0) > 2)) return null;
    const t = L.tickets.find((x) => x.state === 'wait' && !x.noPlayer);
    if (!t) return null;
    const p = prodOf(G, t.pid);
    if (!KE.hasStock(b, p, t.count)) return null;
    Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * t.count; });
    t.state = 'cook'; t.cook = 'player';
    flagTicket(G, L, t);
    if (t.firstTake == null) t.firstTake = L.minute;
    P.slots.push({ tid: t.id, step: 0, errors: 0, start: L.minute, fire: null, fst: null, burnt: 0, touch: L.minute });
    syncSelectedSlot(P);
    return t;
  };
  KE.playerSelect = function (G, i) {
    const P = G.live[G.activeBranch].player;
    if (Number.isInteger(i) && i >= 0 && i < slotsOf(P).length) P.sel = i;
    syncSelectedSlot(P);
  };
  /* Pişme süreleri (dakika): ürünün hazırlık süresinin yarısı, en az 2; pişince 5 dakika içinde alınmalı */
  KE.fireTimes = (p) => ({ cook: Math.max(2, Math.round(p.prep * 0.5)), grace: 5 });
  /* süreli istasyonlar: ateş (ürüne göre) ve fritöz (patates hep 3 dk, 4 dk içinde alınmalı) */
  KE.TIMED = { ates: (p) => KE.fireTimes(p), fritoz: () => ({ cook: 3, grace: 4 }) };
  const timedOf = (sl, p) => KE.TIMED[sl.fst || 'ates'](p || { prep: 4 });
  /* menü siparişinde ürünün tarifine "Patates" (fritöz) eklenir */
  KE.ticketSteps = (G, t) => { const p = prodOf(G, t.pid); return t.menu ? p.steps.concat(['Patates']) : p.steps; };
  /* Özel fişler oyuncunun aldığı anda belirlenir (fiş numarası ve güne göre, rastgelelik yok: yeniden oynatılır).
     Menü: + patates, bitince menü bahşişi. Acele: hızlı biterse acele bahşişi. Gurme müşteri: hatasız biterse itibar. */
  function flagTicket(G, L, t) {
    if (t.flagged) return;
    t.flagged = true;
    t.menu = (t.id * 7 + G.day * 3) % 4 === 0;
    t.rush = !t.menu && (t.id * 13 + G.day) % 6 === 0;
    const c = t.cid != null ? L.custs[t.cid] : null;
    t.gurme = !!(c && c.type === 'gurme');
  }
  /* Tezgâh görevi: art arda N siparişi hatasız bitir, ödül bahşiş kavanozuna */
  KE.QUESTS_PER_DAY = 3;
  /* Görevler yalnızca ana şubede: oyuncu başına günde tek sınır. Ana şube sabah değiştirilebilir. */
  KE.mainBranchId = (G) => (G.branches.some((x) => x.id === G.mainBranch) ? G.mainBranch : G.branches[0].id);
  KE.setMainBranch = function (G, bid) {
    if (G.phase !== 'morning' || !G.branches.some((x) => x.id === bid)) return false;
    G.mainBranch = bid;
    return true;
  };
  function newQuest(G, b, P) {
    /* günde en fazla 3 görev ve yalnızca ana şubede: tezgâh ödülü sınırsız büyümesin */
    if ((P.questsDone || 0) >= KE.QUESTS_PER_DAY || b.id !== KE.mainBranchId(G)) { P.quest = null; return; }
    const n = (P.questN = (P.questN || 0) + 1);
    const ps = MODE(G).products.filter((x) => b.menu[x.id]);
    const avg = ps.reduce((a, x) => a + (b.prices[x.id] || x.base), 0) / Math.max(1, ps.length);
    const need = 3 + (n % 3);
    P.quest = { need, done: 0, reward: Math.round((avg * need * 0.4) / 5) * 5 };
  }
  function finishSlot(G, b, L, sl, p, t) {
    const P = L.player;
    const took = L.minute - sl.start;
    const par = p.prep + (t.menu ? 3 : 0);
    const slow = took > par * 2.6 ? 1 : took > par * 1.7 ? 0.4 : 0;
    const clean = !sl.errors && !sl.burnt && !slow;
    const combo = clean ? Math.min(5, (P.combo || 0) + 1) : 0;
    t.state = 'ready'; t.readyAt = L.minute; t.cookId = 'player'; t.cookName = G.owner;
    t.q = clamp(5 - sl.errors * 0.9 - sl.burnt * 1.4 - slow + Math.min(0.6, 0.15 * combo) + KE.TIERS[b.tier].quality + (KE.equip(G, b, 'prep').quality || 0), 0, 6);
    P.combo = combo; P.best = Math.max(P.best || 0, combo); P.done = (P.done || 0) + 1;
    L.fx.push({ t: 'ready', sid: 'player', pid: t.pid });
    if (combo >= 2) L.fx.push({ t: 'combo', sid: 'player', text: 'Kombo ×' + combo });
    /* özel fiş ödülleri */
    const price = (b.prices[t.pid] || p.base) * t.count, S = L.stats;
    const bonus = (f, text) => { const v = Math.round((price * f) / 5) * 5; if (v > 0) { S.tips += v; S.tezgahBonus = (S.tezgahBonus || 0) + v; L.fx.push({ t: 'tip', sid: 'player', text: text + ' +' + KE.tl(v) }); } };
    if (t.menu) bonus(0.25, 'Menü');
    if (t.rush && L.minute - (t.firstTake != null ? t.firstTake : sl.start) <= par * 1.25 && !sl.errors) bonus(0.3, 'Acele');
    if (t.gurme) {
      if (clean) { S.repDelta += 0.05; L.fx.push({ t: 'regular', sid: 'player', text: 'Gurme beğendi!' }); }
      else S.repDelta -= 0.02;
    }
    if (P.quest) {
      if (clean) P.quest.done++; else P.quest.done = 0;
      if (P.quest.done >= P.quest.need) {
        S.tips += P.quest.reward; S.tezgahBonus = (S.tezgahBonus || 0) + P.quest.reward; P.questsDone = (P.questsDone || 0) + 1;
        L.fx.push({ t: 'regular', sid: 'player', text: 'Görev tamam! +' + KE.tl(P.quest.reward) });
        newQuest(G, b, P);
      }
    }
    P.slots.splice(P.slots.indexOf(sl), 1);
    if (P.sel >= P.slots.length) P.sel = 0;
  }
  /** İstasyona dokun: sonuç { ok, done?, fire?, wait?, burnt? } */
  KE.playerStation = function (G, st) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    const sl = slotsOf(P);
    if (!P.active || !KE.STATIONS.some((x) => x.id === st)) return { ok: false, none: true };
    /* herhangi bir dokunuş oyuncunun başında olduğunu gösterir: boşta işareti kalkar, eli boşsa hemen fiş alır */
    P.tap = L.minute;
    if (P.afk) { P.afk = false; while (KE.playerTake(G)); syncSelectedSlot(P); return { ok: true, woke: true }; }
    if (!sl.length) { syncSelectedSlot(P); return { ok: false, none: true }; }
    const order = sl.map((_, i) => (i + (P.sel || 0)) % sl.length);
    let res = null;
    /* süreli istasyonda (ateş, fritöz) önce pişmiş olanı al */
    if (KE.TIMED[st]) for (const i of order) {
      const s = sl[i];
      if (s.fire == null || (s.fst || 'ates') !== st) continue;
      if (L.minute < s.fire) { res = res || { ok: true, wait: true }; continue; }
      const t = L.tickets.find((x) => x.id === s.tid);
      const p = t && prodOf(G, t.pid);
      const burnt = L.minute > s.fire + timedOf(s, p).grace;
      if (burnt) s.burnt++;
      s.fire = null; s.fst = null; s.step++; s.touch = L.minute;
      P.sel = i;
      if (t && s.step >= KE.ticketSteps(G, t).length) { finishSlot(G, b, L, s, p, t); syncSelectedSlot(P); return { ok: true, done: true, burnt }; }
      syncSelectedSlot(P);
      return { ok: true, burnt };
    }
    for (const i of order) {
      const s = sl[i];
      if (s.fire != null) continue;
      const t = L.tickets.find((x) => x.id === s.tid);
      if (!t) continue;
      const p = prodOf(G, t.pid), steps = KE.ticketSteps(G, t);
      if (KE.stepStation(steps[s.step]) !== st) continue;
      P.sel = i; s.touch = L.minute;
      if (KE.TIMED[st]) { s.fst = st; s.fire = L.minute + KE.TIMED[st](p).cook; syncSelectedSlot(P); return { ok: true, fire: true }; }
      s.step++;
      if (s.step >= steps.length) { finishSlot(G, b, L, s, p, t); syncSelectedSlot(P); return { ok: true, done: true }; }
      syncSelectedSlot(P);
      return { ok: true };
    }
    if (res) return res;
    const s = sl[P.sel || 0];
    if (s) s.errors++;
    P.combo = 0;
    if (P.quest) P.quest.done = 0;
    syncSelectedSlot(P);
    return { ok: false };
  };
  /* eski hamle: adım adı → istasyonu */
  KE.playerStep = (G, label) => KE.playerStation(G, KE.stepStation(label));
  /* her dakika: ateşte unutulan yanar, bekleyen müşteri giderse sipariş düşer */
  function playerTick(G, b, L) {
    const P = L.player;
    if (!P.active || !P.slots || !P.slots.length) return;
    P.slots.slice().forEach((s) => {
      const t = L.tickets.find((x) => x.id === s.tid);
      if (!t || t.state !== 'cook') { P.slots.splice(P.slots.indexOf(s), 1); return; }
      const p = prodOf(G, t.pid);
      /* el sürülmeyen fiş ustalara döner: başlanmamışsa 4 dakika, yarım kalmışsa 20 dakika sonra (paket de dahil) */
      /* başlanmamış fişin müşterisi sabırsızlanıyorsa ustalara devret (yavaş oyuncu müşteri kaçırmasın) */
      const cu = t.cid != null ? L.custs[t.cid] : null;
      if (s.fire == null && cu && s.step === 0 && cu.wait > cu.patience * 1.2) { releaseSlot(G, b, L, s); t.noPlayer = true; return; }
      if (s.fire == null && L.minute - (P.tap || 0) >= KE.PLAYER_IDLE && L.minute - s.touch >= (s.step === 0 ? KE.PLAYER_IDLE : KE.PLAYER_IDLE * 3)) { releaseSlot(G, b, L, s); P.afk = true; return; }
      if (s.fire != null && L.minute > s.fire + timedOf(s, p).grace + 4) {
        /* kömür oldu: malzeme gitti, sipariş baştan ustaya döner */
        P.slots.splice(P.slots.indexOf(s), 1);
        t.state = 'wait'; t.cook = null; t.noPlayer = true; P.combo = 0; P.burned = (P.burned || 0) + 1;
        L.fx.push({ t: 'bad', sid: 'player', text: 'Yandı!' });
      }
    });
    syncSelectedSlot(P);
  }
  KE.playerTick = playerTick;
})();


// ---- js/sim/close.js ----
/* Kebab Empire — simülasyon motoru (7/8): servis sonu ve gün kapanışı */
(function () {
  const { clamp, mode: MODE, prod: prodOf } = KE.U;
  /* ---------- Servis sonu: kalan dakikaları hızla oynat, fire ve tüketimi hesapla ---------- */
  KE.fastForward = function (G) {
    if (G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false);
    let guard = 0;
    while (!KE.allDone(G) && guard++ < 1200) KE.tickAll(G);
  };
  KE.finishService = function (G) {
    KE.fastForward(G);
    G.phase = 'closing';
    const summary = { day: G.day, branches: {} };
    G.branches.forEach((b) => {
      const L = G.live[b.id];
      const S = L.stats;
      const st = KE.branchStaff(G, b);
      const cold = KE.equip(G, b, 'cold');
      const cooks = st.filter(KE.isCook);
      const wasteMul = cooks.length ? cooks.reduce((a, s) => a + s.waste, 0) / cooks.length : 1;
      let wasteVal = 0;
      Object.keys(b.stock).forEach((k) => {
        const lost = b.stock[k] * cold.waste * wasteMul;
        wasteVal += lost * KE.ingPrice(G, b, k);
        b.stock[k] -= lost;
      });
      const usedToday = {};
      Object.keys(b.usage).forEach((k) => { usedToday[k] = 0; });
      Object.entries(S.byProduct).forEach(([pid, n]) => { const p = prodOf(G, pid); if (p) Object.entries(p.ing).forEach(([k, q]) => { usedToday[k] += q * n; }); });
      Object.entries(MODE(G).drink.ing).forEach(([k, q]) => { usedToday[k] += q * S.served * MODE(G).drinkRate; });
      /* stok bittiyse talep o günkü satıştan büyüktür: tahmini düşürme, yukarı çek (aksi hâlde stok-müşteri sarmalı) */
      const short = Object.keys(S.stockouts).length > 0;
      Object.keys(b.usage).forEach((k) => { b.usage[k] = short ? Math.max(b.usage[k], usedToday[k] * 1.3) : b.usage[k] * 0.6 + usedToday[k] * 0.4; });
      summary.branches[b.id] = { name: b.name, stats: S, paket: S.paket, paketRev: S.paketRev, wasteVal, purchases: G.today[b.id].purchases, sat: S.satN ? S.satSum / S.satN : 0, expected: L.expected };
    });
    G.lastSummary = summary;
    return summary;
  };

  KE.TIP_RULES = {
    esit: { name: 'Eşit paylaşım', desc: 'Kavanoz herkese eşit bölünür. Ekip morali dengeli artar.' },
    usta: { name: 'Ustaya ağırlık', desc: 'Ustalar iki pay alır. Ustalar keyiflenir, çıraklar ustalarından %30 daha hızlı öğrenir; diğerleri biraz bozulur.' },
    performans: { name: 'Performansa göre', desc: 'Kim çok iş çıkardıysa o çok alır. Rekabet yaratır.' },
    kasa: { name: 'Kasaya al', desc: 'Bahşiş işletmeye kalır. Ekip ay sonu primi sözüyle idare eder; kısa vadede nakit sağlar ama moral ve itibar zamanla düşer.' }
  };
  KE.tipShares = function (G, b, rule, jar) {
    const st = KE.branchStaff(G, b);
    if (rule === 'kasa' || !st.length) return st.map((s) => [s, 0]);
    const w = st.map((s) => [s, rule === 'usta' ? (s.role === 'usta' ? 2 : 1) : rule === 'performans' ? Math.max(0.2, s.servedToday) : 1]);
    const tot = w.reduce((a, x) => a + x[1], 0);
    return w.map(([s, v]) => [s, jar * v / tot]);
  };
  /* ---------- Gün kapanışı: KE.finalizeDay ----------
     Alt adımlar aşağıda tanımlı sırayla çağrılır. Sıra önemlidir: tohumlu akış ('close') bu sırayla tüketilir
     (ör. istifa zarları şube sırasıyla atılır) ve sunucu aynı sırayla yeniden oynatır; adımların yeri değişmemeli.

     Geç bağlanan bağımlılıklar: aşağıdakiler motor dosyalarından SONRA yüklenen dosyalarda tanımlıdır ve
     yalnızca gün kapanışında çağrılır (yüklenirken değil), bu yüzden doğrudan KE üzerinden okunur:
       narrative.js → KE.writeJournal, KE.writeNews, KE.rollEvent
       progress.js  → KE.checkGoals, KE.advanceEra
       midday.js    → KE.lostShare
       farm.js      → KE.farmDay  (İSTEĞE BAĞLI: çiftlik dosyası yüklenmemişse adım atlanır)
     Zorunlu olanlar eksikse oyun yüklenişi hatalıdır; KE.closeDeps() hangilerinin eksik olduğunu söyler. */
  const LATE = { writeJournal: 'narrative', writeNews: 'narrative', rollEvent: 'narrative', checkGoals: 'progress', advanceEra: 'progress', lostShare: 'midday' };
  KE.closeDeps = () => Object.keys(LATE).filter((k) => typeof KE[k] !== 'function').map((k) => 'KE.' + k + ' (' + LATE[k] + '.js)');

  /* 1. Günün hamle günlüğünü sakla, kapanış akışını tohumla */
  function beginClose(G) {
    KE.RNG.seed(G, 'close');
    G.actionLog = (G.actionLog || []).concat([{ day: G.day, log: G.dayLog || [] }]).slice(-7);
    G.dayLog = [];
  }
  /* 2. Rehber müfettişinin kararı (yıldız ya da itibar kaybı) */
  function inspectorVerdict(G, S0, out) {
    if (!(G.inspect && S0.branches[G.inspect.bid])) return;
    const sm = S0.branches[G.inspect.bid], st = sm.stats, b = G.branches.find((x) => x.id === G.inspect.bid);
    const lost = st.arrivals ? KE.lostShare(st) : 1;
    const pass = sm.sat >= KE.INSPECT.sat && lost < KE.INSPECT.lost;
    if (pass) { G.stars = (G.stars || 0) + 1; G.reputation = Math.min(100, G.reputation + 3); } else G.reputation = Math.max(0, G.reputation - 5);
    out.inspect = { pass, stars: G.stars || 0, branch: b ? b.name : '', sat: Math.round(sm.sat), lost: Math.round(lost * 100) };
    G.inspect = null;
  }
  /* 3. Ekibin bahşiş isteği: hafta sonunda günlerin yarısında bile karşılanmadıysa ekip küser */
  function tallyTipWish(G, rule, out) {
    const TW = G.tipWish;
    if (!TW) return;
    TW.days = (TW.days || 0) + 1; if (rule === TW.rule) TW.hits = (TW.hits || 0) + 1;
    TW.missed = G.day >= TW.until && TW.hits * 2 < TW.days;
    if (G.day >= TW.until) out.tipWishEnd = { rule: TW.rule, hits: TW.hits, days: TW.days, missed: TW.missed };
  }
  /* 4a. Bahşiş paylaşımı ve günlük moral değişimi */
  function tipsAndMorale(G, b, st, S, rule, out) {
    if (rule === 'kasa') G.cash += S.tips;
    const shares = {};
    KE.tipShares(G, b, rule, S.tips).forEach(([s, v]) => { shares[s.id] = v; });
    const perf = st.slice().sort((a, c) => c.servedToday - a.servedToday);
    const amb = KE.ambience(G, b);
    const limit = G.mode === 'doner' ? 70 : 60;
    st.forEach((s) => {
      const tr = KE.TRAITS[s.trait] || {};
      const before = s.morale;
      let dm = (62 - s.morale) * 0.1;
      const share = shares[s.id] || 0;
      s.tipsMonth += share; s.tipsTotal += share; s.tipsToday = share;
      dm += Math.min(5, share / (s.wage / 30) * 6);
      /* kasaya alınan bahşiş: ekip payını görmez ama ay sonu primi sözüyle moralin bir kısmı korunur */
      if (rule === 'kasa') dm += Math.min(5, (S.tips / Math.max(1, st.length)) / (s.wage / 30) * 6) * 0.6 - 0.5;
      if (rule === 'usta') dm += s.role === 'usta' ? 3 : -1;
      if (rule === 'performans') dm += s === perf[0] ? 4 : s === perf[perf.length - 1] ? -2.5 : 0.5;
      if (G.tipWish && rule === G.tipWish.rule) dm += 1.5;
      if (G.tipWish && G.tipWish.missed) dm -= 2;
      if (s.servedToday > limit * 1.6) dm -= 5; else if (s.servedToday > limit) dm -= 2;
      if (s.minEnergy < 10) dm -= 6; else if (s.minEnergy < 25) dm -= 3; else if (s.minEnergy > 55) dm += 1;
      b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d && d.morale) dm += d.morale * 0.5; });
      dm += KE.COSTUMES.find((x) => x.id === s.costume).morale * 0.06;
      if (amb.concept && s.costume !== 'temel') dm += 0.6;
      if (G.payLate) dm -= 3;
      if (dm < 0 && tr.moraleStable) dm *= 1 - tr.moraleStable;
      if (dm < 0 && KE.huyOf(s) === 'sadik') dm *= 0.7;
      s.morale = clamp(s.morale + dm, 0, 100);
      s.moraleDelta = s.morale - before;
      if (s.levelUps && s.levelUps.length) { s.levelUps.forEach((u) => out.levelUps.push({ name: s.name, pid: u.pid, star: u.star })); s.levelUps = []; }
    });
  }
  /* 4b. Çıraklar mentor ustalarından öğrenir */
  function mentorApprentices(st, rule, out) {
    st.filter((s) => s.mentorId).forEach((c) => {
      const m = st.find((x) => x.id === c.mentorId);
      if (!m) { c.mentorId = null; return; }
      const tm = KE.TRAITS[m.trait] || {}, tc = KE.TRAITS[c.trait] || {};
      Object.entries(m.spec).forEach(([pid, star]) => {
        if ((c.spec[pid] || 0) >= star - 1) return;
        if (KE.gainXp(c, pid, m.teach * 4 * (1 + (tm.teachBonus || 0)) * (1 + (tc.xp || 0)) * (rule === 'usta' ? 1.3 : 1))) out.levelUps.push({ name: c.name, pid, star: c.spec[pid], mentor: m.name });
      });
    });
  }
  /* 4c. Morali dibe vuran istifa eder (tohumlu zar) */
  function rollQuits(b, st, out) {
    st.forEach((s) => { if (s.morale < 18 && KE.rand() < 0.3) { out.quits.push({ name: s.name, role: s.role, branch: b.name }); s.quit = true; } });
  }
  /* 4d. Kasa ve defter: ciro, sarf, sabit giderin günlük payı, şube geçmişi */
  function bookDay(G, b, st, sum, rule, out) {
    const S = sum.stats;
    const fixed = (b.rent + KE.utilities(G, b) + st.reduce((a, s) => a + s.wage * (1 + KE.ECON.fazlaMesaiOrani) * 1.2 + KE.ECON.yolYardimiAylik, 0)) / 30;
    const sarf = S.revenue * KE.ECON.sarfOrani;
    G.cash -= sarf;
    const purchases = sum.purchases + sarf;
    G.cash += S.revenue;
    const entry = {
      day: G.day, date: KE.dateStr(G.day), month: KE.monthKey(G.day), branchId: b.id, revenue: S.revenue, card: S.card, cash: S.cash,
      purchases, sarf, waste: sum.wasteVal, tips: S.tips, tipRule: rule, served: S.served, lost: S.lost, arrivals: S.arrivals, sat: sum.sat,
      byProduct: S.byProduct, hourly: S.hourly, hourlyCust: S.hourlyCust, paket: S.paket, paketRev: S.paketRev, fixed, farmKg: G.today[b.id].farmKg || 0,
      net: S.revenue / (1 + KE.ECON.kdvRestoran) - purchases - fixed, stockouts: S.stockouts
    };
    G.ledger.days.push(entry);
    b.history.push({ day: G.day, revenue: S.revenue, net: entry.net, sat: sum.sat });
    out.branches[b.id] = entry;
  }
  /* 4. Her şube sırayla kapanır */
  function closeBranch(G, b, S0, rule, out) {
    const sum = S0.branches[b.id];
    const st = KE.branchStaff(G, b);
    tipsAndMorale(G, b, st, sum.stats, rule, out);
    mentorApprentices(st, rule, out);
    rollQuits(b, st, out);
    b.cleanliness = clamp(b.cleanliness - 3, 5, 100);
    bookDay(G, b, st, sum, rule, out);
  }
  /* 5. İstifa edenler ayrılır, günün itibar değişimi uygulanır */
  function applyReputation(G, S0) {
    G.staff = G.staff.filter((s) => !s.quit);
    const totalRep = G.branches.reduce((a, b) => a + S0.branches[b.id].stats.repDelta, 0);
    let dRep = clamp(totalRep, -2, 1.5);
    if (dRep > 0 && G.reputation > 55) dRep *= Math.max(0.08, 1 - (G.reputation - 55) / 50);
    G.reputation = clamp(G.reputation + dRep, 0, 100);
    /* tepede kalmak emek ister: 70'in üstünde itibar her gün biraz aşınır */
    if (G.reputation > 70) G.reputation = clamp(G.reputation - (G.reputation - 70) * (G.reputation - 70) / 600 * (1 - 0.25 * KE.charityLv(G, 'asevi')), 0, 100);
  }
  /* 6. Gün sonu günlüğü (narrative.js) */
  function journal(G, S0, out) {
    out.journal = KE.writeJournal(G, S0, out);
    G.journal.unshift({ day: G.day, date: KE.dateStr(G.day), text: out.journal });
    if (G.journal.length > 60) G.journal.length = 60;
  }
  /* 7. Günlük işler: geçici etkiler, çiftlik, günün hedefleri, yeni tarifler, müdavimler */
  function dailyTicks(G, S0, out) {
    G.mods.forEach((m) => { m.days -= 1; }); G.mods = G.mods.filter((m) => m.days > 0);
    if (KE.farmDay) out.farm = KE.farmDay(G); /* isteğe bağlı: farm.js yüklüyse */
    out.daily = KE.dailyProgress(G, true);
    out.daily.forEach((g) => { if (g.state === 'done') { G.cash += g.reward; G.reputation = clamp(G.reputation + (G.reputation > 70 ? 0.05 : 0.4), 0, 100); } });
    out.unlocks = [];
    KE.MODES[G.mode].products.filter((p) => p.unlock && !G.flags['tarif_' + p.id] && G.reputation >= p.unlock).forEach((p) => {
      G.flags['tarif_' + p.id] = true; out.unlocks.push(p);
      G.branches.forEach((b) => { b.menu[p.id] = true; b.prices[p.id] = KE.marketPrice(G, p); Object.entries(p.ing).forEach(([k, q]) => { b.usage[k] = Math.max(b.usage[k] || 0, KE.expectedCustomers(G, b) * 0.1 * q); }); });
    });
    out.regulars = [];
    G.branches.forEach((b) => (S0.branches[b.id].stats.regulars || []).forEach((x) => out.regulars.push(x)));
  }
  /* 8. Toplu sipariş teslimi ve imza tarifin bitmesi */
  function deliveries(G, out) {
    if (G.contract && G.contract.day === G.day) {
      const c = G.contract, net = c.pay - c.cost;
      G.cash += net; KE.addExtra(G, 'other', -net);
      const cb = G.branches.find((x) => x.id === c.branchId) || G.branches[0];
      KE.branchStaff(G, cb).forEach((s) => { s.morale = clamp(s.morale - c.morale, 0, 100); });
      G.reputation = clamp(G.reputation + 1, 0, 100);
      G.flags.contracts = (G.flags.contracts || 0) + 1;
      out.contract = Object.assign({ net }, c); G.contract = null;
    }
    if (G.sigWork && G.day >= G.sigWork.ready) { G.signature = { pid: G.sigWork.pid, level: G.sigWork.level }; out.signature = G.signature; G.sigWork = null; }
  }
  /* 9. Haftalık meydan okuma */
  function weeklyChallenge(G, S0, out) {
    if (!G.weekly) return;
    const W = G.weekly, a = W.acc;
    G.branches.forEach((b) => { const S = S0.branches[b.id].stats; a.served += S.served; a.match += S.matches; a.player += S.playerServed || 0; a.tips += S.tips; a.satS += S.satSum; a.satN += S.satN; });
    const val = W.kind === 'sat' ? (a.satN ? a.satS / a.satN : 0) : a[W.kind];
    W.value = val;
    const end = KE.isWeekEnd(G.day);
    if (!W.done && val >= W.target && (W.kind !== 'sat' || end)) { W.done = true; G.cash += W.reward; G.reputation = clamp(G.reputation + 1, 0, 100); out.weeklyDone = Object.assign({}, W); }
    if (end) { out.weeklyEnd = Object.assign({}, W); G.weekly = null; }
  }
  /* 10. Dönem işleri: kârlı hafta, ay sonu şampiyonluğu, hedefler, dönemler, ay kapanışı, hafta sonu gazetesi ve pazar */
  function periodTicks(G, out) {
    if (G.day >= 7 && G.ledger.days.filter((d) => d.day > G.day - 7).reduce((x, d) => x + d.net, 0) > 0) G.flags.profitWeek = G.flags.profitWeek || G.day;
    if (KE.isMonthEnd(G.day)) out.champions = KE.championship(G);
    out.goals = KE.checkGoals(G);
    out.eras = KE.advanceEra(G);
    if (KE.isMonthEnd(G.day)) out.month = KE.closeMonth(G, G.day);
    if (KE.isWeekEnd(G.day)) { out.news = KE.writeNews(G); G.news.unshift(out.news); KE.refreshMarket(G); KE.refreshWorkers(G); if (!G.flags.empire) G.rival.power += 3; }
  }
  /* 11. Ertesi güne geç: kayıt sıkıştırma, yeni gün, olay kartı, sabah */
  function nextMorning(G) {
    if (G.tipWish && G.tipWish.missed) G.tipWish.missed = false;
    KE.compactLedger(G);
    G.payLate = G.cash < 0;
    G.day += 1;
    G.pendingEvent = KE.rollEvent(G);
    G.live = null;
    KE.morning(G);
  }
  KE.finalizeDay = function (G, todayRule) {
    beginClose(G);
    const S0 = G.lastSummary;
    const out = { levelUps: [], quits: [], branches: {} };
    const rule = todayRule || G.tipRule;
    inspectorVerdict(G, S0, out);
    tallyTipWish(G, rule, out);
    G.branches.forEach((b) => closeBranch(G, b, S0, rule, out));
    applyReputation(G, S0);
    journal(G, S0, out);
    dailyTicks(G, S0, out);
    deliveries(G, out);
    weeklyChallenge(G, S0, out);
    periodTicks(G, out);
    nextMorning(G);
    return out;
  };

  /* Kayıt büyümesin: ayrıntılı gün satırları son 12 hafta ve içinde bulunulan ay için tutulur,
     eskileri ömür boyu toplamlara (arşiv) katlanır; aylık özetler zaten ayrı saklanır.
     Gün kapanışında yapılır, sunucunun yeniden oynatmasıyla birebir aynıdır. */
  KE.LEDGER_KEEP = 84;
  KE.compactLedger = function (G) {
    const cut = G.day - KE.LEDGER_KEEP, cur = KE.monthKey(G.day);
    const old = (d) => d.day <= cut && d.month !== cur;
    if (G.ledger.days.length && old(G.ledger.days[0])) {
      const A = G.ledger.archive = G.ledger.archive || { days: 0, revenue: 0, served: 0, tips: 0, byProduct: {} };
      G.ledger.days.filter(old).forEach((d) => { A.days++; A.revenue += d.revenue || 0; A.served += d.served || 0; A.tips += d.tips || 0; Object.entries(d.byProduct || {}).forEach(([k, v]) => { A.byProduct[k] = (A.byProduct[k] || 0) + v; }); });
      G.ledger.days = G.ledger.days.filter((d) => !old(d));
    }
    G.branches.forEach((b) => { if (b.history && b.history.length > 120) b.history = b.history.slice(-120); });
    if (G.news && G.news.length > 26) G.news = G.news.slice(0, 26);
    if (G.eventLog && G.eventLog.length > 400) G.eventLog = G.eventLog.slice(-400);
  };

  /* Ay sonu semt şampiyonluğu: şubenin ay ortalaması memnuniyeti "Lüks Kebap"ın semtteki çıtasını geçerse */
  KE.championship = function (G) {
    const key = KE.monthKey(G.day);
    let repWins = 0;
    return G.branches.map((b) => {
      const days = G.ledger.days.filter((d) => d.month === key && d.branchId === b.id);
      const served = days.reduce((a, d) => a + d.served, 0);
      const sat = served ? days.reduce((a, d) => a + d.sat * d.served, 0) / served : 0;
      const bar = Math.round(Math.min(86, (G.mode === 'kebap' ? 68 : 72) + G.rival.power * 0.08) + (G.rival.district === b.district ? 4 : 0) - (b.flagship ? 3 : 0));
      const won = served >= 250 && sat >= bar;
      if (won) { b.championUntil = G.day + 30; b.champions = (b.champions || 0) + 1; G.flags.champ = true; if (repWins++ < 3) G.reputation = clamp(G.reputation + 1, 0, 100); }
      return { id: b.id, name: b.name, district: KE.district(b).name, sat, bar, won, served };
    });
  };
})();


// ---- js/sim/replay.js ----
/* Kebab Empire — simülasyon motoru (8/8): oyuncu hamlelerinin kaydı ve yeniden oynatma */
(function () {
  /* ---------- Oyuncu hamleleri: kayıt ve yeniden oynatma ----------
     Servis sırasında sonucu etkileyen her oyuncu hamlesi { m: dakika, a: ad, x: argümanlar } olarak
     günlüğe yazılır. Sabah durumu + tohum + günlük ile gün birebir yeniden oynatılabilir. */
  const ACTS = {
    setPos: (G, sid, pos) => { const s = G.staff.find((x) => x.id === sid); if (s) KE.setPos(G, s, pos); const b = s && G.branches.find((x) => x.id === s.branchId); if (b && G.phase === 'service') b.autoStaff = false; },
    autoStaff: (G, bid, on) => { const b = G.branches.find((x) => x.id === bid); if (b) b.autoStaff = !!on; },
    active: (G, bid) => { if (bid !== G.activeBranch && G.live && G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false); G.activeBranch = bid; },
    ptoggle: (G, on) => KE.playerToggle(G, !!on),
    ptake: (G) => KE.playerTake(G),
    pstep: (G, label) => KE.playerStep(G, label),
    pst: (G, st) => KE.playerStation(G, st),
    psel: (G, i) => KE.playerSelect(G, i),
    mid: (G, i) => KE.resolveMid(G, i),
    courier: (G, bid) => KE.courier(G, G.branches.find((x) => x.id === bid))
  };
  /* servis saati: kapalı (ustasız) şubenin dakikası 0'da kalır, açık olanlardan okunur */
  /* günü bitmiş şubenin saati durur; günlük dakikası hâlâ çalışan bir şubeden okunmalı, yoksa gün sonundaki
     hamleler yeniden oynatmada erken uygulanır */
  const clockL = (G) => { const ls = G.branches.map((b) => G.live[b.id]).filter((L) => L && !L.closed); return ls.find((L) => !L.done) || ls[0] || G.live[G.branches[0].id]; };
  KE.act = function (G, a, ...x) {
    const L = G.phase === 'service' && G.live ? clockL(G) : null;
    const m = L ? L.minute : 0;
    const r = ACTS[a](G, ...x);
    if (L && (a !== 'ptake' || r)) (G.dayLog = G.dayLog || []).push({ m, a, x });
    return r;
  };
  /* Sabah durumundaki (servis öncesi) bir oyunu, günlükteki hamlelerle sonuna kadar oynatır */
  KE.replayService = function (G, log) {
    KE.startService(G);
    const q = (log || []).slice();
    let guard = 0;
    while (!KE.allDone(G) && guard++ < 2000) {
      const m = clockL(G).minute;
      while (q.length && q[0].m <= m) { const e = q.shift(); if (Object.prototype.hasOwnProperty.call(ACTS, e.a)) ACTS[e.a](G, ...(Array.isArray(e.x) ? e.x : [])); }
      KE.tickAll(G);
    }
    KE.finishService(G);
    return G.lastSummary;
  };
})();


// ---- js/midday.js ----
/* Kebab Empire — servisin içindeki kararlar ve hizmetler: gün ortası olayları, acil kurye,
   rezervasyon defteri ve haftalık yarış. Motor (js/sim/) bunları KE üzerinden çağırır. */
(function () {
  const KE = window.KE;
  const { clamp, rnd, pick, mode: MODE } = KE.U;
  const mix = KE.mix;

  /* ---------- Gün ortası kararları ----------
     Servisin ortasında küçük bir olay: oyuncu seçer ya da süre dolunca güvenli seçenek uygulanır.
     Seçim eylem günlüğüne yazılır, sunucu aynı dakikada aynı seçimi yeniden oynatır. */
  KE.MID_WAIT = 40;
  const frontOf = (G, b) => KE.branchStaff(G, b).filter((s) => ['kasiyer', 'garson'].includes(s.role));
  KE.MIDS = [
    { id: 'otobus', def: 1, mgr: 0, ic: 'users', title: 'Turist otobüsü kapıda',
      text: (G, b) => `Bir rehber, ${b.name} önünde durdu: "Kırk kişilik grubum aç, alabilir misiniz?"`,
      choices: () => [{ label: 'Buyursunlar', desc: 'Yarım saat kapı hiç durmaz (müşteri ×2,2). Yetişemezsen kaçanlar itibar götürür.' }, { label: 'Kibarca geri çevir', desc: 'Gün normal akışında sürer.' }] },
    { id: 'ariza', def: 1, mgr: 0, ic: 'fire', title: 'Ocaklardan biri söndü', cond: (G, b) => KE.stations(G, b) >= 2,
      text: () => 'Tüp bağlantısı kaçırıyor; ocak kendiliğinden söndü. Usta ellerini sildi, sana bakıyor.',
      choices: (G) => [{ label: 'Tamirci çağır · ' + KE.tl(KE.midCost(G, 'ariza')), desc: 'Çoğu zaman on dakikada gelir; bazen trafiğe takılır ve ocak bir saat soğuk kalır.' }, { label: 'İdare edelim', desc: 'Kapanışa kadar bir ocak eksik pişirilir.' }] },
    { id: 'fenalik', def: 0, mgr: 0, ic: 'heart', title: 'Bir çalışan fenalaştı', cond: (G, b) => frontOf(G, b).length >= 3,
      text: (G, b, M) => { const s = G.staff.find((x) => x.id === M.sid); return `${s ? s.name : 'Kasiyer'} bembeyaz oldu, tezgâha tutundu: "Bir şeyim yok patron, geçer."`; },
      choices: () => [{ label: 'Eve gönder', desc: 'Bugün çalışmaz; ekip bunu görür, herkesin morali +4.' }, { label: 'Biraz dayansın', desc: 'Çalışmaya devam eder ama morali −10, enerjisi −30.' }] },
    { id: 'yagmur', def: 1, mgr: 0, ic: 'clock', title: 'Sağanak bastırdı',
      text: (G, b) => `${b.name} önünde sokak bir anda boşaldı; yoldan geçenler saçak altına kaçıyor.`,
      choices: (G) => [{ label: 'Tente aç, çay ikram et · ' + KE.tl(KE.midCost(G, 'yagmur')), desc: 'İki saat boyunca müşteri yalnızca %15 azalır; bugün gelecek müdavimlerin gönlü +1.' }, { label: 'Bekleyelim', desc: 'İki saat boyunca müşteri %40 azalır.' }] }
  ];
  KE.midCost = (G, id) => Math.round((id === 'ariza' ? 4500 : 2500) * G.priceIndex / 100) * 100;
  KE.pickMid = function (G) {
    KE.RNG.seed(G, 'mid');
    G.mid = null;
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    if (G.day <= 3 || !open.length || KE.rand() >= 0.35) return;
    const b = open[Math.floor(KE.rand() * open.length)];
    const opts = KE.MIDS.filter((m) => !m.cond || m.cond(G, b));
    const m = opts[Math.floor(KE.rand() * opts.length)];
    const fr = frontOf(G, b);
    G.mid = { id: m.id, bid: b.id, minute: 150 + Math.floor(KE.rand() * 420), sid: m.id === 'fenalik' ? fr[Math.floor(KE.rand() * fr.length)].id : null, choice: null };
  };
  KE.midPending = (G) => { const M = G.mid; const L = M && G.live && G.live[M.bid]; return !!(M && M.choice == null && L && !L.done && L.minute >= M.minute); };
  KE.resolveMid = function (G, i) {
    const M = G.mid; const L = M && G.live && G.live[M.bid];
    if (!M || M.choice != null || !L) return null;
    M.choice = i; M.at = L.minute;
    const b = G.branches.find((x) => x.id === M.bid);
    const pay = (c) => { G.cash -= c; KE.addExtra(G, 'other', c); };
    if (M.id === 'otobus' && i === 0) L.boost = { until: L.minute + 30, mult: 2.2 };
    if (M.id === 'ariza') {
      if (i === 0) { pay(KE.midCost(G, 'ariza')); if (KE.rand() < 0.3) { M.late = true; L.stationDown = 1; L.stationDownUntil = L.minute + 60; } }
      else L.stationDown = 1;
    }
    if (M.id === 'fenalik') {
      const s = G.staff.find((x) => x.id === M.sid);
      if (s && i === 0) {
        s.home = true; KE.setPos(G, s, 'mola');
        KE.branchStaff(G, b).forEach((x) => { if (x !== s) x.morale = clamp(x.morale + 4, 0, 100); });
        /* kasa boş kalmasın: servisteki biri kasaya geçer */
        const st = KE.branchStaff(G, b);
        if (!st.some((x) => x.pos === 'kasa')) { const r = st.find((x) => !x.home && KE.POSITIONS[x.role].includes('kasa')); if (r) { r.prevPos = r.pos; KE.setPos(G, r, 'kasa'); } }
      }
      if (s && i === 1) { s.morale = clamp(s.morale - 10, 0, 100); s.energy = Math.max(0, s.energy - 30); }
    }
    if (M.id === 'yagmur') {
      if (i === 0) { pay(KE.midCost(G, 'yagmur')); (G.regularVisits || []).filter((v) => v.branchId === M.bid && v.minute >= L.minute).forEach((v) => { const r = G.regulars[v.rid]; if (r) r.loyalty = clamp(r.loyalty + 1, 0, 10); }); }
      L.rain = { until: L.minute + 120, mult: i === 0 ? 0.85 : 0.6 };
    }
    return M;
  };
  /* Acil kurye: gün ortasında biten malzemeyi 1,5 katı fiyatına getirir (günde bir kez) */
  /* günün kalanında beklenen talebin payı (saatlik eğriye göre) */
  const restShare = (L) => {
    const C = KE.HOUR_CURVE, sum = Object.values(C).reduce((a, v) => a + v, 0);
    const h = KE.OPEN_HOUR + (L ? L.minute : 0) / 60;
    return Object.keys(C).reduce((a, k) => a + C[k] * Math.max(0, Math.min(1, +k + 1 - h)), 0) / sum;
  };
  KE.courierMul = (G) => G.mode === 'doner' ? 1.3 : 1.5;
  KE.courierNeed = function (G, b) {
    let cost = 0; const items = {};
    const L = G.live && G.live[b.id], rest = restShare(L), f = KE.demandFactor(G, b);
    Object.keys(b.usage).forEach((k) => {
      const want = b.usage[k] * f * rest * 1.1, have = b.stock[k] || 0;
      /* yalnızca günün kalanına yetmeyecek malzeme, kalanın ihtiyacı kadar */
      if (have < want * 0.6) { const q = want - have; items[k] = q; cost += q * KE.ingPrice(G, b, k) * KE.courierMul(G); }
    });
    return { cost, items };
  };
  KE.courier = function (G, b) {
    const L = b && G.live && G.live[b.id];
    if (!L || L.courier || L.done) return 0;
    const n = KE.courierNeed(G, b);
    if (!n.cost) return 0;
    Object.entries(n.items).forEach(([k, q]) => { b.stock[k] = (b.stock[k] || 0) + q; });
    G.cash -= n.cost; G.today[b.id].purchases += n.cost; L.courier = true; b.courierUsed = true;
    return n.cost;
  };

  /* ---------- Rezervasyon defteri ----------
     Şube başına bir kez alınır, sabah açılıp kapatılabilir. Açıkken: dolu saatte gelen müşteri kaçmış sayılmaz
     (başka saate yönlendirilir), yer ayırtan müşteri daha sabırlıdır, masada biraz daha çok harcar;
     ama yer ayırtmadan gelen kalabalığın bir kısmı hiç gelmez. Rehber müfettişi de yer ayırtır: bir gün önceden görünür. */
  KE.RESERVATION = { cost: 180000, era: 2 };
  KE.resOn = (b) => !!(b && b.reservation && b.resOn !== false);
  KE.reservationCost = (G) => Math.round(KE.RESERVATION.cost * G.priceIndex / 1000) * 1000;
  KE.buyReservation = function (G, b) {
    if ((G.era || 1) < KE.RESERVATION.era) return { ok: false, msg: 'Rezervasyon defteri 2. dönemde açılır.' };
    if (b.reservation) return { ok: false, msg: 'Bu şubede zaten var.' };
    const c = KE.reservationCost(G);
    if (G.cash < c) return { ok: false, msg: 'Kasada yeterli para yok.' };
    G.cash -= c; KE.addExtra(G, 'capex', c); b.reservation = true; b.resOn = true;
    return { ok: true, cost: c };
  };
  KE.INSPECT = { sat: 84, lost: 0.15 };
  /* müfettişin saydığı kayıp: beklemekten, yer bulamadan ya da yemek gelmeden gidenler (rezervasyonla yönlendirilenler sayılmaz) */
  KE.lostShare = (st) => st.arrivals ? (st.lostWait + st.lostFull + st.lostFood) / st.arrivals : 0;


  /* ---------- Haftalık yarış: herkes aynı hafta aynı tohumla, aynı semtte, aynı ustayla 7 gün oynar ---------- */
  KE.RACE_DAYS = 7;
  KE.raceWeek = function (now) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const wd = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - wd);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const w = Math.ceil(((d.getTime() - y0.getTime()) / 864e5 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
  };
  KE.raceSetup = function (week) {
    let h = 7; for (let i = 0; i < week.length; i++) h = (h * 131 + week.charCodeAt(i)) % 2147483629;
    const n = Number(week.slice(-2));
    const mode = n % 2 ? 'kebap' : 'doner';
    const masters = KE.MASTER_TEMPLATES[mode].filter((t) => t.role !== 'cirak');
    return { week, seed: h + 1, mode, district: KE.DISTRICTS.at((n * 3) % KE.DISTRICTS.length).id, master: (n * 5) % masters.length };
  };
  KE.newRace = function (week, owner) {
    const R = KE.raceSetup(week);
    const masters = KE.MASTER_TEMPLATES[R.mode].filter((t) => t.role !== 'cirak');
    const G = KE.newGame({ mode: R.mode, district: R.district, master: masters.at(R.master), seed: R.seed, owner: owner || 'Patron', shopName: 'Yarış Dükkânı' });
    G.race = { week, days: KE.RACE_DAYS }; G.tut = 99;
    return G;
  };
  KE.raceScore = (G) => Math.round(G.ledger.days.filter((d) => d.day <= KE.RACE_DAYS).reduce((a, d) => a + d.revenue, 0));
  KE.raceOver = (G) => !!(G.race && G.day > KE.RACE_DAYS);

})();


// ---- js/progress.js ----
/* Kebab Empire — uzun vadeli ilerleme: imparatorluk, dönemler, büyük yatırımlar (imza tarif,
   amiral dükkân, toplu siparişler), vakıf ve haftalık meydan okuma. */
(function () {
  const KE = window.KE;
  const { clamp, rnd, pick, mode: MODE } = KE.U;
  const mix = KE.mix;

  /* ---------- Oyun sonu: imparatorluk ---------- */
  KE.empirePrice = (G) => Math.round(KE.EMPIRE.price * G.priceIndex / 100000) * 100000;
  KE.empireStatus = function (G) {
    const E = KE.EMPIRE, price = KE.empirePrice(G);
    const crowns = G.branches.filter((b) => (b.champions || 0) > 0).length;
    const req = [
      { id: 'branches', label: 'Her semtte bir dükkân', have: G.branches.length, need: E.branches },
      { id: 'crowns', label: 'Semt şampiyonluğu tacı', have: crowns, need: E.crowns },
      { id: 'rep', label: 'İtibar', have: Math.round(G.reputation), need: E.reputation },
      { id: 'cash', label: 'Satın alma bedeli', have: Math.max(0, Math.round(G.cash)), need: price, money: true }
    ];
    if ((G.era || 1) < 4) req.unshift({ id: 'era', label: 'İmparatorluk yolu dönemi', have: G.era || 1, need: 4 });
    req.forEach((r) => { r.ok = r.have >= r.need; r.p = Math.min(1, r.have / r.need); });
    return { req, price, ready: req.every((r) => r.ok), done: !!(G.flags && G.flags.empire) };
  };
  /* Bütün oyun boyunca toplamlar (bitiş ekranı için) */
  KE.lifetime = function (G) {
    const days = G.ledger.days, A = G.ledger.archive || { revenue: 0, served: 0, tips: 0, byProduct: {} };
    const byProduct = Object.assign({}, A.byProduct);
    days.forEach((d) => Object.entries(d.byProduct || {}).forEach(([k, v]) => { byProduct[k] = (byProduct[k] || 0) + v; }));
    const best = Object.entries(byProduct).sort((a, c) => c[1] - a[1])[0];
    return { days: G.day - 1, revenue: A.revenue + days.reduce((a, d) => a + (d.revenue || 0), 0), served: A.served + days.reduce((a, d) => a + (d.served || 0), 0), tips: A.tips + days.reduce((a, d) => a + (d.tips || 0), 0), branches: G.branches.length, staff: G.staff.length, crowns: G.branches.reduce((a, b) => a + (b.champions || 0), 0), duels: (G.rival && G.rival.wins) || 0, duelsLost: (G.rival && G.rival.losses) || 0, gen: G.gen || 1, bestProduct: best ? best[0] : null, bestCount: best ? best[1] : 0 };
  };
  KE.buyRival = function (G) {
    const st = KE.empireStatus(G);
    if (st.done) return { ok: false, msg: 'Zincir zaten senin.' };
    if (!st.ready || G.phase !== 'morning') return { ok: false, msg: 'Şartlar henüz tamam değil.' };
    G.cash -= st.price;
    KE.addExtra(G, 'capex', st.price);
    G.flags.empire = G.day;
    G.rival.power = 0; G.rival.district = null;
    G.reputation = clamp(G.reputation + 5, 0, 100);
    G.staff.forEach((s) => { s.morale = clamp(s.morale + 15, 0, 100); });
    const goals = KE.checkGoals(G);
    return { ok: true, goals, life: KE.lifetime(G) };
  };
  /* Hedef ödülü enflasyonla ve zincirin büyüklüğüyle büyür */
  KE.goalReward = (G, g) => Math.round((g.reward || 0) * G.priceIndex * (1 + 0.5 * (G.branches.length - 1)) / 1000) * 1000;
  KE.checkGoals = function (G) {
    const done = [];
    const test = {
      ilkhafta: () => G.day >= 7 && G.ledger.days.filter((d) => d.day <= 7).reduce((a, d) => a + d.net, 0) > 0,
      itibar50: () => G.reputation >= 50,
      usta5: () => !!G.flags.promoted,
      kostum: () => G.staff.length > 0 && G.staff.every((s) => s.costume !== 'temel'),
      konsept: () => G.branches.some((b) => KE.ambience(G, b).concept),
      sube2: () => G.branches.length >= 2,
      ciftlik: () => !!G.farm,
      sampiyon: () => !!G.flags.champ,
      ciro1m: () => G.ledger.months.some((m) => m.revenue >= 1000000),
      itibar80: () => G.reputation >= 80,
      sube4: () => G.branches.length >= 4,
      taclar3: () => G.branches.filter((b) => (b.champions || 0) > 0).length >= 3,
      sube7: () => G.branches.length >= KE.DISTRICTS.length,
      imparator: () => !!(G.flags && G.flags.empire)
    };
    KE.GOALS.forEach((g) => { if (!G.goals[g.id] && test[g.id] && test[g.id]()) { G.goals[g.id] = G.day; const r = KE.goalReward(G, g); G.cash += r; done.push(Object.assign({}, g, { reward: r })); } });
    return done;
  };

  KE.openBranch = function (G, districtId) {
    const d = KE.DISTRICTS.find((x) => x.id === districtId);
    const cost = KE.branchCost(G, d);
    const b = KE.makeBranch(G, districtId);
    G.branches.push(b);
    G.cash -= cost;
    KE.addExtra(G, 'capex', cost);
    let c = 0;
    Object.keys(b.usage).forEach((k) => { const q = b.usage[k] * b.stockLevel; c += q * KE.ingPrice(G, b, k); b.stock[k] = q; });
    G.cash -= c;
    G.today[b.id] = { purchases: c, farmKg: 0 };
    return b;
  };
  KE.branchCost = (G, d) => Math.round((d.rent * 3 + 350000) * G.priceIndex / 1000) * 1000;
  /* ---------- Dönemler ---------- */
  const ERA_TEST = {
    hafta: (G) => !!(G.flags.profitWeek || (G.goals && G.goals.ilkhafta)),
    ay1: (G) => G.ledger.months.some((m) => m.net > 0),
    rep40: (G) => G.reputation >= 40,
    upg: (G) => G.branches.some((b) => Object.values(b.equipment).some((v) => v > 0)),
    sampiyon: (G) => !!G.flags.champ,
    sube3: (G) => G.branches.length >= 3,
    sube4: (G) => G.branches.length >= 4,
    ciro5m: (G) => G.ledger.months.some((m) => m.revenue >= 5000000),
    ciro4m: (G) => G.ledger.months.some((m) => m.revenue >= 4000000),
    ciro3m: (G) => G.ledger.months.some((m) => m.revenue >= 3000000),
    rep65: (G) => G.reputation >= 65,
    sube6: (G) => G.branches.length >= 6,
    taclar2: (G) => G.branches.filter((b) => (b.champions || 0) > 0).length >= 2 || !!G.flags.legacyImza,
    taclar3: (G) => G.branches.filter((b) => (b.champions || 0) > 0).length >= 3 || !!G.flags.legacyImza,
    imza2: (G) => !!(G.signature && !G.signature.family && G.signature.level >= 2) || !!G.flags.legacyImza,
    kontrat6: (G) => (G.flags.contracts || 0) >= 10 || !!G.flags.legacyImza,
    imza: (G) => !!(G.signature && !G.signature.family) || !!G.flags.legacyImza
  };
  KE.eraStatus = function (G) {
    const n = G.era || 1, cur = KE.ERAS[n - 1];
    const req = cur.req.filter((r) => !r.mode || r.mode === G.mode).map((r) => Object.assign({}, r, { ok: !!ERA_TEST[r.id](G) }));
    return { era: n, cur, next: KE.ERAS[n] || null, req, ready: req.length > 0 && req.every((r) => r.ok) };
  };
  KE.advanceEra = function (G) {
    const out = [];
    while ((G.era || 1) < KE.ERAS.length && KE.eraStatus(G).ready) { G.era = (G.era || 1) + 1; (G.eraLog = G.eraLog || {})[G.era] = G.day; out.push(KE.ERAS[G.era - 1]); }
    return out;
  };
  KE.placeOpen = (G, id) => !G || (G.era || 1) >= (KE.PLACE_ERA[id] || 1);
  KE.placesOfEra = (n) => Object.keys(KE.PLACE_ERA).filter((k) => KE.PLACE_ERA[k] === n);

  /* ---------- Büyük yatırımlar (3. dönemden itibaren) ---------- */
  KE.signatureCost = function (G) {
    const lv = G.signature && !G.signature.family ? G.signature.level : 0;
    return lv >= KE.SIGNATURE.cost.length ? null : Math.round(KE.SIGNATURE.cost[lv] * G.priceIndex / 1000) * 1000;
  };
  KE.startSignature = function (G, pid) {
    if ((G.era || 1) < 3) return { ok: false, msg: 'İmza tarif 3. dönemde açılır.' };
    if (G.sigWork) return { ok: false, msg: 'Ar-Ge mutfağı zaten çalışıyor.' };
    const cost = KE.signatureCost(G);
    if (cost == null) return { ok: false, msg: 'Tarif zaten efsane seviyesinde.' };
    if (G.signature && !G.signature.family && G.signature.pid !== pid) return { ok: false, msg: 'İmza tarif bir kez seçilir.' };
    if (G.cash < cost) return { ok: false, msg: 'Kasa yetmiyor.' };
    G.cash -= cost; KE.addExtra(G, 'capex', cost);
    const lv = G.signature && !G.signature.family ? G.signature.level : 0;
    G.sigWork = { pid, level: lv + 1, ready: G.day + KE.SIGNATURE.days };
    return { ok: true };
  };
  KE.flagshipCost = (G) => Math.round(KE.FLAGSHIP.cost * G.priceIndex / 1000) * 1000;
  KE.buildFlagship = function (G, bid) {
    if ((G.era || 1) < 3) return { ok: false, msg: 'Amiral dükkân 3. dönemde açılır.' };
    if (G.branches.some((b) => b.flagship)) return { ok: false, msg: 'Zaten bir amiral dükkânın var.' };
    const b = G.branches.find((x) => x.id === bid); const cost = KE.flagshipCost(G);
    if (!b || G.cash < cost) return { ok: false, msg: 'Kasa yetmiyor.' };
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.flagship = G.day;
    return { ok: true };
  };
  /* Haftalık toplu sipariş teklifleri: oyunun tohumundan ve haftasından türetilir (her yerde aynı) */
  const weekOf = (G) => Math.floor((G.day - 1) / 7);
  KE.contractOffers = function (G) {
    if ((G.era || 1) < 3 || !G.branches.length) return [];
    const wk = weekOf(G), prods = MODE(G).products.filter((p) => !KE.isLocked(G, p)), b0 = G.branches[0];
    const seen = {};
    return [0, 1, 2, 3].map((i) => {
      const h = mix(G.seed, wk, 'ct', i);
      const k = KE.CONTRACT_KINDS[h % KE.CONTRACT_KINDS.length];
      if (seen[k.id]) return null; seen[k.id] = 1;
      const qty = Math.round((k.qty[0] + ((h >>> 8) % 1000) / 1000 * (k.qty[1] - k.qty[0])) / 10) * 10;
      const p = prods[(h >>> 4) % prods.length];
      const pay = Math.round(qty * KE.marketPrice(G, p) * 1.5 / 1000) * 1000;
      const cost = Math.round(qty * KE.productCost(G, b0, p) / 1000) * 1000;
      return { id: wk + '-' + i, kind: k.id, name: k.name, who: k.who, pid: p.id, qty, pay, cost, morale: k.morale };
    }).filter(Boolean).slice(0, 3);
  };
  KE.contractTaken = (G) => G.contractWeek === weekOf(G);
  KE.acceptContract = function (G, id, bid) {
    if (G.phase !== 'morning') return { ok: false, msg: 'Toplu sipariş sabah kabul edilir.' };
    if (KE.contractTaken(G)) return { ok: false, msg: 'Bu hafta zaten bir toplu sipariş aldın.' };
    const o = KE.contractOffers(G).find((x) => x.id === id);
    const b = G.branches.find((x) => x.id === bid) || G.branches[0];
    if (!o) return { ok: false, msg: 'Teklif bulunamadı.' };
    if (!KE.branchStaff(G, b).some(KE.isCook)) return { ok: false, msg: 'Bu şubede usta yok.' };
    G.contract = Object.assign({}, o, { day: G.day, branchId: b.id }); G.contractWeek = weekOf(G);
    return { ok: true };
  };

  /* ---------- Haftalık meydan okuma ---------- */
  KE.makeWeekly = function (G) {
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    if (!open.length) { G.weekly = null; return; }
    let left = 1; while (left < 7 && !KE.isWeekEnd(G.day + left - 1)) left++;
    const exp = open.reduce((a, b) => a + KE.expectedCustomers(G, b), 0) * left;
    const kinds = KE.WEEKLY_KINDS.filter((x) => G.day > 7 || x.kind !== 'player');
    const k = kinds[mix(G.seed, G.day, 'wk') % kinds.length];
    const target = { served: Math.round(exp * 0.95 / 10) * 10, match: Math.max(10, Math.round(exp * 0.09)), player: Math.max(6, left * 3), tips: Math.round(exp * 18 * G.priceIndex / 500) * 500, sat: 82 }[k.kind];
    const reward = Math.round(30000 * G.priceIndex * (1 + 0.3 * (open.length - 1)) / 1000) * 1000;
    G.weekly = { start: G.day, kind: k.kind, target, text: k.text.replace('{t}', k.kind === 'tips' ? KE.tl(target) : String(target)), reward, value: 0, done: false, acc: { served: 0, match: 0, player: 0, tips: 0, satS: 0, satN: 0 } };
  };

  /* ---------- Sabah ekonomisi: işe alma, kıyafet, ekipman, dekor, hijyen, reklam, merkezi mutfak ----------
     Hepsi { ok, msg, ... } döndürür; arayüz yalnızca çağırır, mesajı gösterir ve yeniden çizer. */
  const NO_CASH = 'Kasada yeterli para yok.';
  /** Servisin ortasında masa sayısı arttıysa (salon yükseltmesi, dış masalar) canlı salona yeni masaları ekle
   * @param {Game} G
   * @param {Branch} b
   */
  KE.syncTables = function (G, b) {
    const L = G.live && G.live[b.id];
    if (!L) return;
    while (L.tables.length < KE.tableCount(G, b)) L.tables.push({ id: L.tables.length, occ: null, dirty: false, by: null });
  };
  /** Usta pazarından işe al (transfer ücreti kasadan)
   * @param {Game} G
   * @param {Branch} b işe alınacağı şube
   * @param {string} id usta pazarındaki (G.market) çalışanın kimliği
   * @returns {ActionResult} başarılıysa staff alanı yeni çalışandır
   */
  KE.hireMaster = function (G, b, id) {
    const s = G.market.find((x) => x.id === id);
    if (!s) return { ok: false };
    const ch = KE.canHire(G, b, s.role || 'usta');
    if (!ch.ok) return { ok: false, msg: `Mutfak kadrosu dolu: ${ch.used}/${ch.cap}`, hint: ch.hint };
    if (G.cash < (s.fee || 0)) return { ok: false, msg: NO_CASH };
    G.cash -= s.fee || 0; if (s.fee) KE.addExtra(G, 'other', s.fee);
    s.branchId = b.id; s.hiredDay = G.day; delete s.fee;
    G.staff.push(s); G.market = G.market.filter((x) => x.id !== s.id);
    return { ok: true, msg: `${s.name} ekibe katıldı!`, staff: s };
  };
  /** İş ilanlarından işe al (ücretsiz)
   * @param {Game} G
   * @param {Branch} b işe alınacağı şube
   * @param {string} id iş ilanlarındaki (G.workers) çalışanın kimliği
   * @returns {ActionResult}
   */
  KE.hireWorker = function (G, b, id) {
    const s = G.workers.find((x) => x.id === id);
    if (!s) return { ok: false };
    const ch = KE.canHire(G, b, s.role);
    if (!ch.ok) return { ok: false, msg: `${KE.STAFF_GROUPS[ch.group].name} kadrosu dolu: ${ch.used}/${ch.cap}`, hint: ch.hint };
    s.branchId = b.id; s.hiredDay = G.day;
    G.staff.push(s); G.workers = G.workers.filter((x) => x.id !== s.id);
    return { ok: true, msg: `${s.name} işe başladı.`, staff: s };
  };
  /** İşten çıkarma: iki haftalık brüt ücret tazminat (yasal yükümlülük: kasa eksiye düşse de ödenir); şubedeki ekibin morali −4
   * @param {Staff} s
   * @returns {number} tazminat (₺)
   */
  KE.severance = (s) => s.wage / 2;
  /**
   * @param {Game} G
   * @param {string} id çalışan kimliği
   * @returns {ActionResult} cost: ödenen tazminat
   */
  KE.fireStaff = function (G, id) {
    const s = G.staff.find((x) => x.id === id);
    if (!s) return { ok: false };
    const pay = KE.severance(s);
    G.cash -= pay; KE.addExtra(G, 'other', pay);
    G.staff = G.staff.filter((x) => x.id !== s.id);
    G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; if (x.branchId === s.branchId) x.morale = clamp(x.morale - 4, 0, 100); });
    return { ok: true, msg: `${s.name} ayrıldı.`, cost: pay };
  };
  /** Kıyafet: moral artar, kostüm hedefi kontrol edilir
   * @param {Game} G
   * @param {string} sid çalışan kimliği
   * @param {string} cid KE.COSTUMES kimliği
   * @returns {ActionResult}
   */
  KE.buyCostume = function (G, sid, cid) {
    const s = G.staff.find((x) => x.id === sid), c = KE.COSTUMES.find((x) => x.id === cid);
    if (!s || !c) return { ok: false };
    // önceki davranış korunur: kıyafet için kasa denetimi yoktu (kasa eksiye düşebilir)
    G.cash -= c.cost; if (c.cost) KE.addExtra(G, 'capex', c.cost);
    s.costume = c.id; s.morale = clamp(s.morale + c.morale, 0, 100);
    const goals = KE.checkGoals(G);
    return { ok: true, msg: `${s.name} yeni kıyafetine bayıldı!`, cost: c.cost, goals };
  };
  /** Ekipmanı bir seviye yükselt
   * @param {Game} G
   * @param {Branch} b
   * @param {string} k ekipman anahtarı
   * @returns {number|null} bir sonraki seviyenin bedeli; son seviyedeyse null
   */
  KE.upgradeCost = (G, b, k) => { const next = MODE(G).equipment[k].levels[b.equipment[k] + 1]; return next ? next.cost * G.priceIndex : null; };
  /**
   * @param {Game} G
   * @param {Branch} b
   * @param {string} k ekipman anahtarı
   * @returns {ActionResult}
   */
  KE.upgradeEquipment = function (G, b, k) {
    const eq = MODE(G).equipment[k];
    const next = eq && eq.levels[b.equipment[k] + 1];
    if (!next) return { ok: false };
    const cost = next.cost * G.priceIndex;
    if (G.cash < cost) return { ok: false, msg: NO_CASH };
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.equipment[k] += 1;
    if (k === 'service') KE.syncTables(G, b);
    return { ok: true, msg: `${next.name} kuruldu. Dükkân değişti!`, cost };
  };
  /** Dekor al; konsept açıldıysa haber ver
   * @param {Game} G
   * @param {{ cost: number }} it KE.DECOR öğesi
   * @returns {number}
   */
  KE.decorCost = (G, it) => it.cost * G.priceIndex;
  /**
   * @param {Game} G
   * @param {Branch} b
   * @param {string} id KE.DECOR kimliği
   * @returns {ActionResult} concept: açılan konsept (varsa)
   */
  KE.buyDecor = function (G, b, id) {
    const it = KE.DECOR.find((x) => x.id === id);
    if (!it) return { ok: false };
    if (b.decor.includes(it.id)) return { ok: false, msg: 'Bu şubede zaten var.' };
    const cost = KE.decorCost(G, it);
    if (G.cash < cost) return { ok: false, msg: NO_CASH };
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.decor.push(it.id);
    if (it.id === 'dismasa') KE.syncTables(G, b);
    const concept = KE.ambience(G, b).concept;
    const goals = KE.checkGoals(G);
    return { ok: true, msg: concept ? `Konsept açıldı: ${concept.name}!` : `${it.name} yerleştirildi.`, concept, cost, goals };
  };
  /** Belediye: hijyen eğitimi ve derin temizlik (temizlik +30)
   * @param {Game} G
   * @returns {number}
   */
  KE.hygieneCost = (G) => 12000 * G.priceIndex;
  /**
   * @param {Game} G
   * @param {Branch} b
   * @returns {ActionResult}
   */
  KE.deepClean = function (G, b) {
    if (!b) return { ok: false };
    const c = KE.hygieneCost(G);
    // önceki davranış korunur: hijyen için kasa denetimi yoktu (kirli dükkân eksi kasada da temizletilebilir)
    G.cash -= c; KE.addExtra(G, 'other', c);
    b.cleanliness = clamp(b.cleanliness + 30, 0, 100);
    return { ok: true, msg: 'Dükkân pırıl pırıl.', cost: c };
  };
  /** Reklam kampanyası (KE.CAMPAIGNS); tabela şubede kalıcıdır
   * @param {Game} G
   * @param {{ cost: number }} c KE.CAMPAIGNS öğesi
   * @returns {number}
   */
  KE.campaignCost = (G, c) => Math.round(c.cost * G.priceIndex);
  /**
   * @param {Game} G
   * @param {Branch} b
   * @param {string} id KE.CAMPAIGNS kimliği
   * @returns {ActionResult}
   */
  KE.startCampaign = function (G, b, id) {
    const c = KE.CAMPAIGNS.find((x) => x.id === id);
    if (!c || !b) return { ok: false };
    if (c.sign && b.signBoost) return { ok: false, msg: 'Bu şubede zaten var.' };
    const cost = KE.campaignCost(G, c);
    if (G.cash < cost) return { ok: false, msg: NO_CASH };
    G.cash -= cost; KE.addExtra(G, 'ads', cost);
    if (c.sign) { b.signBoost = 1.06; return { ok: true, msg: 'Yeni tabela gece gündüz parlıyor.', cost }; }
    c.mods.forEach(([k, m]) => G.mods.push({ key: k, mult: m, days: c.days, label: c.name, camp: c.id }));
    if (c.rep) { const best = Math.max(...MODE(G).products.map((p) => KE.bestStar(G, b, p.id))); G.reputation = clamp(G.reputation + (best >= 4 ? 4 : 1), 0, 100); }
    return { ok: true, msg: `${c.name} başladı.`, cost };
  };
  /** Merkezi mutfak: malzeme maliyeti şubelerde düşer
   * @param {Game} G
   * @returns {number}
   */
  KE.centralCost = (G) => 450000 * G.priceIndex;
  /**
   * @param {Game} G
   * @returns {ActionResult}
   */
  KE.buildCentralKitchen = function (G) {
    if (G.centralKitchen) return { ok: false };
    const c = KE.centralCost(G);
    if (G.cash < c) return { ok: false, msg: NO_CASH };
    G.cash -= c; KE.addExtra(G, 'capex', c);
    G.centralKitchen = true;
    return { ok: true, msg: 'Merkezi mutfak kuruldu.', cost: c };
  };
  /** Geç oyun: bütün semtlerde şube açıldıktan sonra haftayı tek tuşla geç
   * @param {Game} G
   * @returns {boolean}
   */
  KE.quickWeekOpen = (G) => G.branches.length >= KE.DISTRICTS.length;

  /* ---------- Vakıf ve sponsorluk ---------- */
  KE.charityCost = (G, id) => { const c = KE.CHARITY.find((x) => x.id === id), lv = KE.charityLv(G, id); return lv >= c.cost.length ? null : Math.round(c.cost.at(lv) * G.priceIndex / 10000) * 10000; };
  KE.donate = function (G, id) {
    if ((G.era || 1) < 3) return { ok: false, msg: 'Vakıf 3. dönemde açılır.' };
    if (G.phase !== 'morning') return { ok: false, msg: 'Bağış sabah yapılır.' };
    const cost = KE.charityCost(G, id);
    if (cost == null) return { ok: false, msg: 'Bu bağış en üst seviyede.' };
    if (G.cash < cost) return { ok: false, msg: 'Kasada yeterli para yok.' };
    G.cash -= cost; KE.addExtra(G, 'other', cost);
    G.charity = G.charity || {}; G.charity[id] = KE.charityLv(G, id) + 1;
    G.flags.donated = (G.flags.donated || 0) + cost;
    if (id === 'okul') G.reputation = clamp(G.reputation + 3, 0, 100);
    if (id === 'asevi') G.staff.forEach((s) => { s.morale = clamp(s.morale + 3, 0, 100); });
    return { ok: true, cost, level: G.charity[id] };
  };
})();


// ---- js/farm.js ----
/* Kebab Empire — besi çiftliği */
(function () {
  const { clamp } = KE.U;
  KE.farmKinds = (G) => Object.keys(KE.FARM).filter((k) => !KE.FARM[k].modes || KE.FARM[k].modes.includes(G.mode));
  KE.farmCost = (G) => Math.round(KE.FARM_COST * G.priceIndex / 1000) * 1000;
  KE.buyFarm = function (G) {
    const cost = KE.farmCost(G);
    G.cash -= cost; KE.addExtra(G, 'capex', cost);
    G.farm = { pens: {}, store: {}, auto: true, bonus: {}, shipped: 0, opened: G.day };
    KE.farmKinds(G).forEach((k) => { G.farm.pens[k] = { level: 0, batches: [] }; });
  };
  KE.penHeads = (pen) => pen.batches.reduce((a, x) => a + x.count, 0);
  KE.penCap = (kind, pen) => KE.FARM[kind].caps[pen.level];
  KE.animalPrice = (G, kind) => Math.round(KE.FARM[kind].young * G.priceIndex);
  KE.buyAnimals = function (G, kind) {
    const F = KE.FARM[kind], pen = G.farm.pens[kind];
    const n = Math.min(F.batch, KE.penCap(kind, pen) - KE.penHeads(pen));
    if (n <= 0) return 0;
    const cost = KE.animalPrice(G, kind) * n;
    G.cash -= cost; KE.addExtra(G, 'farm', cost);
    pen.batches.push({ count: n, age: 0 });
    return cost;
  };
  KE.upgradePen = function (G, kind) {
    const pen = G.farm.pens[kind];
    const cost = Math.round(KE.FARM[kind].upCost[pen.level + 1] * G.priceIndex);
    G.cash -= cost; KE.addExtra(G, 'capex', cost);
    pen.level += 1;
  };
  KE.batchYield = function (G, kind, count) {
    const y = KE.FARM[kind].yield[G.mode] || {};
    const out = {};
    Object.entries(y).forEach(([k, v]) => { out[k] = v * count; });
    return out;
  };
  KE.slaughter = function (G, kind) {
    const pen = G.farm.pens[kind];
    const F = KE.FARM[kind];
    const ready = pen.batches.filter((x) => x.age >= F.days);
    let heads = 0;
    const got = {};
    ready.forEach((x) => {
      heads += x.count;
      Object.entries(KE.batchYield(G, kind, x.count)).forEach(([k, v]) => { G.farm.store[k] = (G.farm.store[k] || 0) + v; got[k] = (got[k] || 0) + v; });
    });
    pen.batches = pen.batches.filter((x) => x.age < F.days);
    return { heads, got };
  };
  /* Gün sonunda: yem, büyüme, otomatik kesim ve yeniden alım */
  KE.farmDay = function (G) {
    if (!G.farm) return null;
    let feed = 0;
    const done = [];
    KE.farmKinds(G).forEach((kind) => {
      const pen = G.farm.pens[kind], F = KE.FARM[kind];
      pen.batches.forEach((x) => { x.age += 1; feed += x.count * F.feed * G.priceIndex; });
      if (G.farm.auto) {
        const r = KE.slaughter(G, kind);
        if (r.heads) done.push({ kind, heads: r.heads, got: r.got });
        /* talebe göre alım: depodaki + yetişmekte olan et, (büyüme süresi + 2) günlük talebi karşılamıyorsa yeni parti al */
        const y = KE.batchYield(G, kind, 1);
        let guard = 0;
        while (guard++ < 30 && KE.penHeads(pen) + F.batch <= KE.penCap(kind, pen) && G.cash > 250000) {
          const main = Object.keys(y).sort((a, c) => y[c] - y[a])[0];
          const short = [main].some((k) => {
            const demand = G.branches.reduce((a, b) => a + (b.usage[k] || 0), 0);
            const pipe = (G.farm.store[k] || 0) + pen.batches.reduce((a, x) => a + x.count * y[k], 0);
            return pipe < demand * (F.days + 2);
          });
          if (!short) break;
          KE.buyAnimals(G, kind);
        }
      }
    });
    G.cash -= feed; KE.addExtra(G, 'farm', feed);
    return { feed, done };
  };
  KE.farmCostPerKg = function (G, kind) {
    const F = KE.FARM[kind];
    const y = Object.values(F.yield[G.mode] || {}).reduce((a, v) => a + v, 0);
    return y ? (F.young + F.feed * F.days) * G.priceIndex / y : 0;
  };
})();


// ---- js/narrative.js ----
/* Kebab Empire — anlatı: gün sonu günlüğü, mahalle gazetesi, olay kartları, karakter repliği */
(function () {
  const { clamp, pick } = KE.U;
  const pname = (G, pid) => { const m = KE.MODES[G.mode]; const p = m.products.find((x) => x.id === pid); return p ? p.name : m.drink.name; };
  const clock = (min) => { const h = KE.OPEN_HOUR + Math.floor(min / 60), m = min % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };
  KE.clock = clock;

  /* ---------- Gün sonu günlüğü ---------- */
  KE.writeJournal = function (G, S0, out) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const sum = S0.branches[b.id];
    const S = sum.stats;
    const st = KE.branchStaff(G, b);
    const cooks = st.filter(KE.isCook).sort((a, c) => c.servedToday - a.servedToday);
    const lead = cooks[0];
    const parts = [];
    const wd = KE.weekday(G.day);
    const hol = KE.holidayOf(G.day);
    const weather = pick(['Hava güneşliydi', 'Sabah çiseledi, öğlene doğru açtı', 'Lodos vardı, martılar alçaktan uçuyordu', 'Serin ama berrak bir gündü', 'Boğazdan ılık bir rüzgâr esiyordu', 'Gökyüzü kurşuni, sokak ıslaktı']);
    parts.push(hol ? `${hol}, ${wd}. ${/Ramazan|Kurban/.test(hol) ? 'Sokaklar bayramlıklarla doluydu.' : 'Sokaklar bayraklarla süslenmişti.'}` : `${wd}. ${weather}.`);
    if (lead) {
      const opener = G.mode === 'doner'
        ? pick([`${lead.name} sabah erkenden gelip ocağı yaktı, ilk yaprağı ustalıkla kesti.`, `${lead.name} döneri şişe dizerken radyoda eski bir şarkı çalıyordu.`, `${lead.name} bıçağı bileyleyip "Haydi bismillah" dedi.`])
        : pick([`${lead.name} kömürü erkenden tutuşturdu, köz kıvamını bekledi.`, `${lead.name} zırhla kıymayı çekerken dükkâna mis gibi kokular yayıldı.`, `${lead.name} şişleri sıraya dizip "Bugün işimiz rast gitsin" dedi.`]);
      parts.push(opener);
    }
    const peakH = S.hourlyCust.indexOf(Math.max(...S.hourlyCust));
    if (S.served > 0) {
      const topType = Object.entries(S.byType).sort((a, c) => c[1] - a[1])[0];
      const typeLine = topType ? { ogrenci: 'en çok öğrenciler geldi', beyaz: 'plaza çalışanları kapıyı aşındırdı', aile: 'aileler masaları doldurdu', gurme: 'gurmeler tabakları fotoğrafladı', turist: 'turistler haritalarıyla kapıda belirdi', isci: 'inşaat ekipleri kalabalık geldi', gece: 'en kalabalık grup gece çıkışı müşterileriydi' }[topType[0]] : 'müşteriler geldi';
      parts.push(`En yoğun saat ${KE.OPEN_HOUR + peakH}:00 civarıydı. Gün boyunca ${typeLine}.`);
    } else parts.push('Kapıdan neredeyse kimse girmedi. Sessizlik insanın içine işliyordu.');
    const so = Object.entries(S.stockouts || {}).sort((a, c) => a[1] - c[1]);
    if (so.length) parts.push(`${pname(G, so[0][0])} ${KE.ekSayi(clock(so[0][1]), 'de')} bitti${so.length > 1 ? `, ardından ${KE.dA(pname(G, so[1][0]))} tükendi` : ''}. Yarın stoğu artırmak lazım.`);
    const top = Object.entries(S.byProduct).sort((a, c) => c[1] - a[1])[0];
    if (top) parts.push(`Günün yıldızı ${pname(G, top[0])} oldu: ${top[1]} porsiyon.`);
    if (S.matches > 3 && lead) parts.push(`"Ellerine sağlık usta!" sesi gün boyu ${S.matches} kez yankılandı.`);
    if (S.best && S.best.tip > 0) parts.push(`En cömert bahşişi bir ${KE.CUSTOMER_TYPES[S.best.type].name.toLowerCase()} müşteri bıraktı: ${KE.tl(S.best.tip)}.`);
    if (S.lostWait > 4) parts.push(`${S.lostWait} müşteri beklemekten sıkılıp gitti; kapıdan çıkarken söylendiklerini duydum.`);
    if (S.lostPrice > 4) parts.push(`${S.lostPrice} kişi menüye bakıp "Bu ne fiyat!" diyerek döndü.`);
    if (S.playerServed) parts.push(`Bugün ${S.playerServed} siparişi tezgâha geçip kendi ellerimle hazırladım.`);
    if (S.gurmeHappy) parts.push('Bir gurme çıkarken defterine bir şeyler not etti, gülümsüyordu.');
    if (out.levelUps.length) { const u = out.levelUps[0]; parts.push(`${u.name} ${pname(G, u.pid)} yapımında ustalaştı (★${u.star})${u.mentor ? `; ${KE.ek(u.mentor, 'in')} emeği büyük` : ''}.`); }
    if (out.quits.length) parts.push(`Akşam ${out.quits[0].name} önlüğünü çıkarıp "Ben bu işi bırakıyorum" dedi. Moral meselesini hafife almamalıydım.`);
    const sat = sum.sat;
    parts.push(sat > 80 ? 'Kepenk inerken içim rahattı; mahalle memnun.' : sat > 65 ? 'Fena bir gün değildi, ama daha iyisini yapabiliriz.' : sat > 0 ? 'Kepenk indirirken kafamda yarın neyi düzelteceğimin listesi vardı.' : 'Yarın her şey farklı olacak.');
    return parts.join(' ');
  };

  /* ---------- Mahalle gazetesi ---------- */
  KE.writeNews = function (G) {
    const week = G.ledger.days.filter((d) => d.day > G.day - 7);
    const rev = week.reduce((a, d) => a + d.revenue, 0);
    const sat = week.length ? week.reduce((a, d) => a + d.sat, 0) / week.length : 0;
    const b = G.branches[0];
    const h = [];
    if (G.flags.empire && G.day - G.flags.empire < 7) h.push({ title: `"Lüks Kebap" artık ${G.shopName || G.branches[0].name} zincirinin`, body: `Şehrin en büyük iki kebap zinciri tek çatı altında birleşti. Cüneyt Bey veda ederken "Ocağın hakkını verdin" dedi. Mahalle esnafı ilk kez aynı tabelanın altında toplanıyor.` });
    if (sat > 80) h.push({ title: `${b.name} mahallenin dilinde`, body: `Haftanın memnuniyet ortalaması %${Math.round(sat)}. Komşular "Böyle ${G.mode === 'doner' ? 'döner' : 'kebap'} yıllardır yenmedi" diyor.` });
    else if (sat > 60) h.push({ title: `${b.name} istikrarlı bir hafta geçirdi`, body: `Haftalık ciro ${KE.tl(rev)}. Esnaf, dükkânın kendini toparladığını söylüyor.` });
    else h.push({ title: `${b.name} zorlu bir hafta geçirdi`, body: 'Müşteriler bekleme sürelerinden ve fiyatlardan şikâyetçi. Esnaf "Toparlanırlar" diyor.' });
    const champ = G.branches.find((x) => x.championUntil && x.championUntil - G.day >= 23);
    if (champ) h.unshift({ title: `${KE.ek(KE.district(champ).name, 'in')} şampiyonu: ${champ.name}`, body: '"Lüks Kebap" bu ay semtte geride kaldı. Komşular kutlamaya pide getirdi.' });
    const praised = KE.REGULARS.find((R) => G.regulars && G.regulars[R.id] && G.regulars[R.id].praised > G.day - 7);
    if (praised) h.push({ title: `${praised.name}: "Şehrin en güzel sofrası"`, body: `${praised.type === 'turist' ? 'Şehre her gelişinde uğrayan' : 'Yıllardır müdavim olan'} ${praised.name}, dükkânı herkese öneriyor.` });
    const st5 = G.staff.find((s) => Object.values(s.spec).some((v) => v >= 5));
    if (st5) h.push({ title: `Usta sohbeti: ${st5.name}`, body: `${st5.region} kökenli ${st5.role === 'cirak' ? 'genç çırak' : 'usta'}, mesleğin inceliklerini anlattı: "Sabır, ${G.mode === 'doner' ? 'keskin bıçak' : 'köz'} ve iyi malzeme. Gerisi el alışkanlığı."` });
    const city = [
      { title: 'Vapur seferlerine yaz tarifesi', body: 'Belediye yeni seferlerin iskele çevresindeki esnafa canlılık getireceğini açıkladı.' },
      { title: 'Halde et fiyatları yine hareketli', body: `Toptancılar kırmızı ette aylık %${KE.num(KE.ECON.aylikEnflasyon * 100, 1)} civarı artış bekliyor.` },
      { title: 'Beşiktepe\'de derbi heyecanı', body: 'Maç günü stat çevresindeki dükkânlar gece yarısına kadar açık kalacak.' },
      { title: 'Sultanpazarı\'nda turist rekoru', body: 'Tarihi çarşıyı bu hafta on binlerce ziyaretçi gezdi.' },
      { title: 'Kampüstepe\'de final haftası', body: 'Öğrenciler kütüphaneden çıkmıyor; gece paket siparişleri patladı.' },
      { title: 'Asgari ücret tartışması sürüyor', body: 'Esnaf temsilcileri yeni yılda bordro maliyetlerinin artacağını hatırlattı.' }
    ];
    h.push(pick(city));
    const rivalLines = [
      { title: '"Lüks Kebap" yeni şube peşinde', body: 'Cüneyt Bey zincirini büyütmek için semt semt dolaşıyor.' },
      { title: 'Rakipten indirim kampanyası', body: '"Lüks Kebap" bu hafta öğrencilere %20 indirim yaptı.' }
    ];
    const stg = (G.rival && G.rival.stage) || 0;
    const arcNews = [null,
      { title: '"Lüks Kebap" yeni semtte', body: `Cüneyt Bey: "Bu şehirde iki kebapçıya yer yok." Esnaf ${G.shopName || b.name} ile rakibin kapışmasını merakla izliyor.` },
      { title: 'Fiyat savaşı kızışıyor', body: '"Lüks Kebap" indirimlerini sürdürüyor. Ekonomistler: "Küçük esnaf için zor günler."' },
      { title: 'Usta transferleri gündemde', body: 'Cüneyt Bey şehrin en iyi ustalarını toplamaya çalışıyor. Loncada konuşulan tek konu bu.' },
      { title: 'Semtlerde taç savaşı', body: 'Rakip zincir mermer salonlarıyla şampiyonluk peşinde. Mahalleli taraf tutmaya başladı.' },
      { title: 'Sosyal medyada iftira dalgası', body: 'Sahte hesaplardan esnafa yönelik paylaşımlar savcılığa taşındı.' },
      { title: 'Cüneyt Bey\'in teklifi geri çevrildi', body: `${G.owner || 'Patron'} zarfı açmadan iade etti. Şehrin konuştuğu soru: kim kimi satın alacak?` }];
    if (!G.flags.empire && arcNews[stg] && G.day - ((G.rival && G.rival.last) || 0) < 10) h.splice(1, 0, arcNews[stg]);
    else h.push(pick(rivalLines));
    return { day: G.day, date: KE.dateStr(G.day), issue: Math.ceil(G.day / 7), headlines: h };
  };

  /* ---------- Olay kartları ---------- */
  const ev = [];
  const branch = (G) => G.branches.find((x) => x.id === G.activeBranch);
  const staffOf = (G) => KE.branchStaff(G, branch(G));
  /* Zam: kişi başı 60 günde bir, rol tavanını aşmadan */
  const RAISE_CAP = { usta: 3.0, mudur: 2.4, cirak: 1.35, kasiyer: 1.6, garson: 1.6, temizlik: 1.45, kurye: 1.55 };
  const canRaise = (G, s) => G.day - (s.raisedDay || s.hiredDay || 0) >= 60 && s.wage < KE.ECON.asgariBrut * (RAISE_CAP[s.role] || 1.6) * G.priceIndex;
  const raise = (G, x, k) => { x.wage = Math.min(Math.round(x.wage * k / 100) * 100, Math.round(KE.ECON.asgariBrut * (RAISE_CAP[x.role] || 1.6) * G.priceIndex / 100) * 100); x.raisedDay = G.day; };
  KE.canRaise = canRaise;
  /* Zam neden verilemiyor? null: verilebilir */
  KE.raiseBlock = function (G, s) {
    if (canRaise(G, s)) return null;
    if (s.wage >= KE.ECON.asgariBrut * (RAISE_CAP[s.role] || 1.6) * G.priceIndex) return 'Tavan maaşta';
    return `Zam için ${60 - (G.day - (s.raisedDay || s.hiredDay || 0))} gün daha`;
  };
  /* Oyuncunun verdiği %10 zam: 60 günde bir, rol tavanını aşmadan; moral +12 */
  KE.raiseStaff = function (G, s) {
    if (!s) return { ok: false, msg: 'Çalışan bulunamadı.' };
    const why = KE.raiseBlock(G, s);
    if (why) return { ok: false, msg: `${s.name}: ${why}.` };
    raise(G, s, 1.1);
    s.morale = clamp(s.morale + 12, 0, 100);
    return { ok: true, msg: `${s.name}: "Sağ ol patron!" Yeni brüt: ${KE.tl(s.wage)}` };
  };

  ev.push({ id: 'rakipTeklif', who: 'rakip', w: 1.2,
    when: (G) => !G.flags.empire && staffOf(G).some((s) => s.role === 'usta' && s.morale < 55 && canRaise(G, s)),
    build: (G) => { const s = staffOf(G).filter((x) => x.role === 'usta' && canRaise(G, x)).sort((a, c) => a.morale - c.morale)[0];
      return { title: `${KE.ek(s.name, 'e')} rakipten teklif!`, text: `"Lüks Kebap" sahibi Cüneyt Bey, ${KE.ek(s.name, 'e')} %30 daha fazla maaş teklif etmiş. Usta kararsız görünüyor ve seninle konuşmak istiyor.`, ctx: { sid: s.id },
        choices: [
          { label: 'Maaşına %15 zam yap', desc: 'Moral +22, maaş +%15', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); raise(G, x, 1.15); x.morale = clamp(x.morale + 22, 0, 100); return `${x.name} kaldı: "Bu dükkân benim de dükkânım."`; } },
          { label: 'Oturup gönlünü al', desc: '%55 ihtimalle kalır', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); if (KE.rand() < 0.55) { x.morale = clamp(x.morale + 10, 0, 100); return `Uzun bir çay sohbeti işe yaradı. ${x.name} kalıyor.`; } G.staff = G.staff.filter((y) => y.id !== x.id); G.rival.power += 8; return `${x.name} teşekkür edip rakibe geçti. Ocağın başı boş kaldı.`; } },
          { label: 'Gitmek isteyen gider', desc: 'Usta ayrılır', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); G.staff = G.staff.filter((y) => y.id !== x.id); G.rival.power += 8; return `${x.name} ayrıldı. Usta pazarında yeni birini bulmalısın.`; } }
        ] }; } });

  ev.push({ id: 'denetim', who: 'bulent', w: 1,
    build: (G) => { const b = branch(G);
      return { title: 'Belediye denetimi kapıda', text: `Bülent Bey evrak çantasıyla içeri girdi: "Rutin hijyen denetimi." Temizlik puanın şu an ${Math.round(b.cleanliness)}.`, ctx: {},
        choices: [
          { label: 'Denetime hemen gir', desc: 'Temizlik puanına göre sonuç', run: (G) => { const b = branch(G); if (b.cleanliness >= cleanBar(G)) { G.reputation = clamp(G.reputation + 2, 0, 100); return '"Her şey yolunda, kolay gelsin." Denetimden temiz çıktın. İtibar +2.'; } const fine = fineOf(G, Math.round(18000 * G.priceIndex)); G.cash -= fine; KE.addExtra(G, 'fines', fine); G.reputation = clamp(G.reputation - 3, 0, 100); return `Tezgâh altı ve davlumbazda eksikler bulundu. ${KE.tl(fine)} idari para cezası. İtibar −3.`; } },
          { label: 'Yarım saat bekletip acil temizlik yap', desc: `${KE.tl(6000)} ekstra mesai`, run: (G) => { const b = branch(G); G.cash -= 6000; KE.addExtra(G, 'other', 6000); b.cleanliness = clamp(b.cleanliness + 25, 0, 100); if (b.cleanliness >= cleanBar(G)) return 'Ekip seferber oldu. Denetim sorunsuz geçti.'; const fine = fineOf(G, Math.round(9000 * G.priceIndex)); G.cash -= fine; KE.addExtra(G, 'fines', fine); return `Yetişmedi. Daha hafif bir ceza: ${KE.tl(fine)}.`; } }
        ] }; } });

  ev.push({ id: 'yemekYazari', who: 'ayse', w: 0.8,
    when: (G) => G.mode && KE.MODES[G.mode].products.some((p) => KE.bestStar(G, branch(G), p.id) >= 4),
    build: (G) => { const b = branch(G); const p = KE.MODES[G.mode].products.filter((x) => KE.bestStar(G, b, x.id) >= 4).sort((a, c) => KE.bestStar(G, b, c.id) - KE.bestStar(G, b, a.id))[0];
      return { title: 'Ünlü yemek yazarı geldi!', text: `Ayşe Teyze fısıldadı: "Bak bak, köşedeki masada oturan o meşhur yemek yazarı!" Yazar ${p.name} sipariş etti ve tabağı silip süpürdü.`, ctx: { pid: p.id },
        choices: [
          { label: 'İkramımızdır deyip künefe gönder', desc: `${KE.tl(400)}, itibar +6, 5 gün gurme akını`, run: (G) => { G.cash -= 400; G.reputation = clamp(G.reputation + 6, 0, 100); G.mods.push({ key: 'type:gurme', mult: 2.2, days: 5, label: 'Yemek yazısı' }); return 'Ertesi gün köşe yazısı çıktı: "Şehrin en dürüst lezzeti." Gurmeler yolda.'; } },
          { label: 'Normal davran', desc: 'İtibar +3', run: (G) => { G.reputation = clamp(G.reputation + 3, 0, 100); G.mods.push({ key: 'type:gurme', mult: 1.5, days: 3, label: 'Yemek yazısı' }); return 'Yazı kısa ama olumlu çıktı.'; } }
        ] }; } });

  ev.push({ id: 'kavanoz', who: 'zeynep', w: 0.6,
    build: (G) => ({ title: 'Bahşiş kavanozu kayboldu', text: 'Zeynep Hanım kasayı sayarken fark etti: dün akşamki bahşiş kavanozu yerinde yok. Ekip birbirine kuşkuyla bakıyor.', ctx: {},
      choices: [
        { label: 'Kasadan herkese öde', desc: `${KE.tl(4500)}, moral +6`, run: (G) => { G.cash -= 4500; KE.addExtra(G, 'other', 4500); staffOf(G).forEach((s) => { s.morale = clamp(s.morale + 6, 0, 100); }); return '"Patron bizi yarı yolda bırakmadı." Ekip rahatladı.'; } },
        { label: 'Soruşturma başlat', desc: 'Moral −5, kavanoz belki bulunur', run: (G) => { staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 5, 0, 100); }); return KE.rand() < 0.5 ? 'Kavanoz depoda, un çuvallarının arkasında bulundu. Komi yanlışlıkla kaldırmış.' : 'Kavanoz bulunamadı. Ortam gergin.'; } },
        { label: 'Boş ver', desc: 'Moral −8', run: (G) => { staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 8, 0, 100); }); return 'Ekip sessizce işine döndü ama kırgınlar.'; } }
      ] }) });

  ev.push({ id: 'zamTalebi', who: null, w: 1,
    when: (G) => staffOf(G).some((s) => s.morale < 62 && G.day - s.hiredDay > 10 && canRaise(G, s)),
    build: (G) => { const s = staffOf(G).filter((x) => x.morale < 62 && G.day - x.hiredDay > 10 && canRaise(G, x)).sort((a, c) => a.morale - c.morale)[0];
      return { title: `${s.name} zam istiyor`, text: `${s.name}: "Patron, kira arttı, mutfak masrafı arttı. Bir el atabilir misin?" Brüt maaşı şu an ${KE.tl(s.wage)}.`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: '%10 zam yap', desc: 'Moral +18', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); raise(G, x, 1.1); x.morale = clamp(x.morale + 18, 0, 100); return `${x.name}: "Sağ ol patron, hakkını helal et."`; } },
          { label: 'Şimdilik olmaz', desc: 'Moral −10', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 10, 0, 100); return `${x.name} başını öne eğdi: "Anladım."`; } }
        ] }; } });

  ev.push({ id: 'etZammi', who: 'riza', w: 1,
    build: (G) => ({ title: 'Kasap Rıza\'dan zam haberi', text: '"Kusura bakma kardeşim, halde fiyatlar uçtu. Bu hafta et kalemlerine %15 zam yapmak zorundayım."', ctx: {},
      choices: [
        { label: 'Pazarlık et', desc: '%50 ihtimalle %5\'e iner', run: (G) => { if (KE.rand() < 0.5) { G.mods.push({ key: 'ing', mult: 1.05, days: 7, label: 'Et zammı' }); return '"Senin hatırın için %5 olsun." Rıza sözünün eri.'; } G.mods.push({ key: 'ing', mult: 1.15, days: 7, label: 'Et zammı' }); return '"Elimden gelen bu kadar." Zam %15 kaldı.'; } },
        { label: 'Kabul et', desc: '7 gün malzeme +%12, ilişki iyi', run: (G) => { G.mods.push({ key: 'ing', mult: 1.12, days: 7, label: 'Et zammı' }); return 'Rıza memnun. "Senin için en iyi parçaları ayıracağım." Zam %12\'de kaldı.'; } }
      ] }) });

  ev.push({ id: 'influencer', who: 'ajans', w: 0.7,
    build: (G) => ({ title: 'Sosyal medya fenomeni geldi', text: 'Yüz binlerce takipçisi olan bir fenomen telefonunu tezgâha doğrulttu: "Bugün bu dükkânı deniyoruz!"', ctx: {},
      choices: [
        { label: 'Ustayı kameraya çıkar', desc: 'Kalite iyiyse 5 gün +%30 müşteri', run: (G) => { const b = branch(G); const best = Math.max(...KE.MODES[G.mode].products.map((p) => KE.bestStar(G, b, p.id))); if (best >= 3) { G.mods.push({ key: 'traffic', mult: 1.3, days: 5, label: 'Viral video' }); G.mods.push({ key: 'type:ogrenci', mult: 1.4, days: 5, label: 'Viral video' }); G.reputation = clamp(G.reputation + 3, 0, 100); return 'Video bir gecede milyon izlendi. Kuyruk sokağın köşesine kadar uzayacak.'; } G.reputation = clamp(G.reputation - 3, 0, 100); return '"Eh işte..." yorumu viral oldu. İtibar −3.'; } },
        { label: 'Kibarca reddet', desc: 'Bir şey olmaz', run: () => 'Fenomen omuz silkip başka dükkâna gitti.' }
      ] }) });

  /* ---------- Ustaların huyları: ekip yönetimi küçük hikâyelere döner ---------- */
  ev.push({ id: 'ustaIzin', who: null, w: (G) => staffOf(G).some((s) => KE.huyOf(s) === 'izinci') ? 1.8 : 1.0,
    when: (G) => staffOf(G).filter(KE.isCook).length >= 2,
    build: (G) => { const cooks = staffOf(G).filter(KE.isCook); const u = cooks.find((s) => KE.huyOf(s) === 'izinci') || cooks.sort((a, c) => a.morale - c.morale)[0];
      return { title: `${u.name} izin istiyor`, text: `${u.name} önlüğünü katlarken lafı dolandırdı: "Patron, memlekette kızımın nişanı var. Bugün bir çıkabilsem..."`, ctx: { sid: u.id }, who: u,
        choices: [
          { label: 'Git, gönlün rahat olsun', desc: 'Bugün çalışmaz; morali +15', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); x.morale = clamp(x.morale + 15, 0, 100); x.pos = 'mola'; x.offDay = G.day; return `${x.name} elini öptü: "Sağ ol patron, bunu unutmam."`; } },
          { label: 'Bugün olmaz, kalabalık var', desc: 'Çalışır ama morali −8', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); x.morale = clamp(x.morale - 8, 0, 100); return `${x.name} başını salladı, ama bütün gün suratı asık.`; } }
        ] }; } });
  ev.push({ id: 'ustaKavga', who: null, w: 1.0,
    when: (G) => staffOf(G).some((s) => s.role === 'cirak' && s.mentorId),
    build: (G) => { const c = staffOf(G).find((s) => s.role === 'cirak' && s.mentorId); const m = G.staff.find((x) => x.id === c.mentorId) || c;
      return { title: 'Mutfakta gerginlik', text: `${m.name} ile çırağı ${c.name} sabah sabah atıştı. "Bana bıçak tutmayı öğretmiyor, bulaşık yaptırıyor!" diyor ${c.name.split(' ').slice(-1)[0]}.`, ctx: { sid: c.id, mid: m.id }, who: m,
        choices: [
          { label: 'İkisini çaya oturt', desc: 'İkisinin de morali +5', run: (G, ctx) => { [ctx.sid, ctx.mid].forEach((id) => { const x = G.staff.find((y) => y.id === id); if (x) x.morale = clamp(x.morale + 5, 0, 100); }); return 'Bir demlik çay bitti, iki taraf da biraz yumuşadı. Usta bıçağı çırağa uzattı.'; } },
          { label: 'Ustanın arkasında dur', desc: 'Usta +6, çırak −10', run: (G, ctx) => { const a = G.staff.find((y) => y.id === ctx.mid), c = G.staff.find((y) => y.id === ctx.sid); if (a) a.morale = clamp(a.morale + 6, 0, 100); if (c) c.morale = clamp(c.morale - 10, 0, 100); return 'Usta memnun; çırak sessizce bulaşığa döndü.'; } },
          { label: 'Çırağı başka ustaya ver', desc: 'Mentor bırakılır, çırak +6', run: (G, ctx) => { const c = G.staff.find((y) => y.id === ctx.sid); if (c) { c.mentorId = null; c.morale = clamp(c.morale + 6, 0, 100); } return 'Çırak artık mentorsuz. Usta Pazarı\'ndaki Kadrom sekmesinden yeni bir mentor seçebilirsin.'; } }
        ] }; } });
  /* sadık usta başka yere bakmaz; hırslı usta teklifleri dinler */
  const tempted = (G) => staffOf(G).filter((s) => s.role === 'usta' && KE.huyOf(s) !== 'sadik' && Math.max(...Object.values(s.spec)) >= 4);
  ev.push({ id: 'ustaTeklif', who: null, w: (G) => tempted(G).some((s) => KE.huyOf(s) === 'hirsli') ? 1.8 : 1.0,
    when: (G) => tempted(G).length > 0,
    build: (G) => { const u = tempted(G).sort((a, c) => Number(KE.huyOf(c) === 'hirsli') - Number(KE.huyOf(a) === 'hirsli') || Math.max(...Object.values(c.spec)) - Math.max(...Object.values(a.spec)))[0];
      return { title: `${KE.ek(u.name, 'e')} göz koyan var`, text: `Karşı sokaktaki otelin şefi ${KE.ek(u.name, 'i')} yemeğe çıkarmış. "Bana iki katını veriyorlar patron, ama ben buraya alıştım..." diyor.`, ctx: { sid: u.id }, who: u,
        choices: [
          { label: '%15 zam yap', desc: 'Maaş +%15, moral +12', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); x.wage = Math.round(x.wage * 1.15 / 100) * 100; x.morale = clamp(x.morale + 12, 0, 100); return `${x.name} gülümsedi: "Bu dükkânın ekmeğini yedim, bir yere gitmem."`; } },
          { label: 'Gönlünü al, zam yok', desc: 'Moral −6; morali 35\'in altına inerse kaçabilir', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); x.morale = clamp(x.morale - 6, 0, 100); return `${x.name} "Peki" dedi, ama aklı otelde.`; } }
        ] }; } });

  ev.push({ id: 'cirakHata', who: null, w: 0.8,
    when: (G) => staffOf(G).some((s) => s.role === 'cirak'),
    build: (G) => { const c = staffOf(G).find((s) => s.role === 'cirak');
      return { title: `${c.name} bir tepsi yaktı`, text: `${c.name} dalgınlıkla ${G.mode === 'doner' ? 'pilav tenceresini' : 'bir şiş dolusu kebabı'} yaktı. Mutfak duman içinde, herkes sana bakıyor.`, ctx: { sid: c.id }, who: c,
        choices: [
          { label: 'Ustanın yanına ver, öğret', desc: 'En iyi usta mentor olur, moral +4', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); const m = staffOf(G).filter((s) => s.role === 'usta').sort((a, c) => c.teach - a.teach)[0]; if (m) { x.mentorId = m.id; x.morale = clamp(x.morale + 4, 0, 100); return `${m.name} çırağın omzuna dokundu: "Gel bakalım, ${G.mode === 'doner' ? 'yaprak böyle kesilir' : 'köz böyle okunur'}."`; } return 'Ortada öğretecek usta yok. Bir usta işe al.'; } },
          { label: 'Sert uyar', desc: 'Moral −10, hata payı düşer', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); x.morale = clamp(x.morale - 10, 0, 100); x.consistency = Math.min(0.95, x.consistency + 0.05); return `${x.name} kızardı, bir daha olmayacağına söz verdi.`; } }
        ] }; } });

  ev.push({ id: 'macGunu', who: null, w: 0.7, mode: 'doner',
    build: (G) => ({ title: 'Yarın derbi var!', text: 'Beşiktepe\'de büyük maç. Taraftarlar maç öncesi ve sonrası sokaklara taşacak. Gece kalabalığı bekleniyor.', ctx: {},
      choices: [
        { label: 'Stoku ikiye katla', desc: 'Gece müşterisi +%120, 1 gün', run: (G) => { G.branches.forEach((b) => { b.stockBoost = 1; Object.keys(b.usage).forEach((k) => { b.stock[k] += b.usage[k] * 0.6; G.cash -= b.usage[k] * 0.6 * KE.ingPrice(G, b, k); }); }); G.mods.push({ key: 'type:gece', mult: 2.2, days: 1, label: 'Derbi' }); G.mods.push({ key: 'traffic', mult: 1.2, days: 1, label: 'Derbi' }); return 'Depo tıklım tıklım. Haydi bakalım!'; } },
        { label: 'Normal hazırlan', desc: 'Gece müşterisi +%120 ama stok normal', run: (G) => { G.mods.push({ key: 'type:gece', mult: 2.2, days: 1, label: 'Derbi' }); G.mods.push({ key: 'traffic', mult: 1.2, days: 1, label: 'Derbi' }); return 'Bakalım stok yetecek mi...'; } }
      ] }) });

  ev.push({ id: 'dugun', who: null, w: 0.7, mode: 'kebap',
    build: (G) => { const amt = Math.round(160 * 620 * G.priceIndex * 0.85);
      return { title: 'Düğün siparişi', text: `Mahalleden bir aile kızlarının kına gecesi için 160 porsiyon kebap istiyor. Teklif: ${KE.tl(amt)}. Ekip gece yarısına kadar çalışmak zorunda kalacak.`, ctx: { amt },
        choices: [
          { label: 'Kabul et', desc: 'Büyük ciro, moral −8, itibar +4', run: (G, c) => { const b = branch(G); const cost = 160 * KE.productCost(G, b, KE.MODES.kebap.products[0]); G.cash += c.amt - cost; KE.addExtra(G, 'other', -(c.amt - cost)); staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 8, 0, 100); }); G.reputation = clamp(G.reputation + 4, 0, 100); return `Kına gecesi efsane oldu. Net kazanç ${KE.tl(c.amt - cost)}. Ekip yorgun ama gururlu.`; } },
          { label: 'Kibarca reddet', desc: 'Bir şey olmaz', run: () => 'Aile anlayışla karşıladı, başka bir ocakbaşına gittiler.' }
        ] }; } });

  ev.push({ id: 'komurKrizi', who: 'riza', w: 0.6, mode: 'kebap',
    build: (G) => ({ title: 'Kömür krizi', text: 'Toptancıda mangal kömürü kalmadı. Elde kalanların fiyatı iki katına çıktı.', ctx: {},
      choices: [
        { label: 'Pahalı da olsa kömür al', desc: '7 gün kömür ×2', run: (G) => { G.mods.push({ key: 'ing:komur', mult: 2, days: 7, label: 'Kömür krizi' }); return 'Közün tadından taviz yok.'; } },
        { label: 'Bir haftalığına gaza geç', desc: '7 gün müşteri memnuniyeti düşer', run: (G) => { G.mods.push({ key: 'patience', mult: 0.85, days: 7, label: 'Gazlı ocak' }); G.reputation = clamp(G.reputation - 2, 0, 100); return 'Müdavimler farkı hemen anladı: "Usta, bunda köz tadı yok."'; } }
      ] }) });

  ev.push({ id: 'ogrenciIndirim', who: null, w: 0.6,
    when: (G) => ['kampustepe', 'kadiceşme', 'besiktepe'].includes(branch(G).district),
    build: (G) => ({ title: 'Öğrenci birliği teklifi', text: 'Üniversitenin öğrenci kulübü bir anlaşma öneriyor: öğrenci kartına %10 indirim, karşılığında kampüs panolarında reklam.', ctx: {},
      choices: [
        { label: 'Anlaşmayı imzala', desc: '14 gün öğrenci +%60, fiyat algısı iyileşir', run: (G) => { G.mods.push({ key: 'type:ogrenci', mult: 1.6, days: 14, label: 'Öğrenci anlaşması' }); G.mods.push({ key: 'ing', mult: 1.03, days: 14, label: 'Öğrenci indirimi' }); return 'Kampüs panolarında logon parlıyor.'; } },
        { label: 'Teşekkürler, gerek yok', desc: 'Bir şey olmaz', run: () => 'Kulüp başkanı kartını bırakıp gitti.' }
      ] }) });

  ev.push({ id: 'rakipSemt', who: 'rakip', w: 0.5,
    when: (G) => !G.flags.empire && G.rival.district !== branch(G).district && G.day > 10,
    build: (G) => ({ title: '"Lüks Kebap" semtine geliyor', text: 'Cüneyt Bey sokağın karşısındaki dükkânı kiralamış. Altın harfli tabelası şimdiden asıldı. "Bu semtte yer var mı bakalım" diyor sırıtarak.', ctx: {},
      choices: [
        { label: 'Reklama yüklen', desc: `${KE.tl(25000)}, 7 gün müşteri +%15`, run: (G) => { G.rival.district = branch(G).district; G.rival.wins = (G.rival.wins || 0) + 1; G.cash -= 25000; KE.addExtra(G, 'ads', 25000); G.mods.push({ key: 'traffic', mult: 1.15, days: 7, label: 'Karşı kampanya' }); return 'Mahalleyi el ilanıyla donattık. "Asıl lezzet burada!"'; } },
        { label: 'Kalitemize güveniyoruz', desc: 'Rakip semtte, müşteri biraz azalır', run: (G) => { G.rival.district = branch(G).district; G.rival.losses = (G.rival.losses || 0) + 1; return 'Müdavimler sözünü verdi: "Biz seni bırakmayız."'; } }
      ] }) });

  /* ---------- Ek olaylar ---------- */
  const pay = (G, amt) => { G.cash -= amt; KE.addExtra(G, 'other', amt); };
  const earn = (G, amt) => { G.cash += amt; KE.addExtra(G, 'other', -amt); };
  const moraleAll = (G, d) => staffOf(G).forEach((s) => { s.morale = clamp(s.morale + d, 0, 100); });
  const rep = (G, d) => { G.reputation = clamp(G.reputation + d, 0, 100); };
  const P = (G, v) => Math.round(v * G.priceIndex / 100) * 100;
  /* Avukat Selin'in hikâyesi bitince cezalar yarıya iner; Muhtar Kemal Bey denetimde eşiği düşürür */
  const fineOf = (G, v) => (G.flags && G.flags.lawyer ? Math.round(v / 2 / 100) * 100 : v);
  const cleanBar = (G) => (G.flags && G.flags.muhtar ? 45 : 55);

  ev.push({ id: 'elektrik', who: 'emre', w: 0.7,
    build: (G) => ({ title: 'Elektrik kesintisi', text: 'Sokakta trafo arızası var; elektrik akşama kadar gelmeyebilir. Emre bir jeneratörcünün numarasını buldu.', ctx: {},
      choices: [
        { label: 'Jeneratör kirala', desc: `${KE.tl(P(G, 9000))}, servis aksamaz`, run: (G) => { pay(G, P(G, 9000)); return 'Jeneratör homurdandı ama dükkân ışıl ışıl. Komşular bile sıraya girdi.'; } },
        { label: 'Bekle, gelince açarız', desc: '1 gün müşteri −%35', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.65, days: 1, label: 'Elektrik kesintisi' }); return 'Öğlen boyunca karanlıkta bekledik; elektrik ikindiye doğru geldi.'; } }
      ] }) });

  ev.push({ id: 'turOtobusu', who: 'ajans', w: 0.6, when: (G) => ['sultanpazari', 'besiktepe', 'kadiceşme'].includes(branch(G).district),
    build: (G) => ({ title: 'Tur otobüsü kapıda', text: 'Bir tur rehberi, kırk kişilik grubunu yarın öğlen dükkâna getirmek istiyor. Tek şartı: grup menüsünde %15 indirim.', ctx: {},
      choices: [
        { label: 'Grup menüsünü kabul et', desc: '1 gün turist +%180, itibar +2', run: (G) => { G.mods.push({ key: 'type:turist', mult: 2.8, days: 1, label: 'Tur grubu' }); rep(G, 2); return 'Kırk kişi kırk ayrı dilde "çok güzel" dedi. Rehber her hafta geleceğini söyledi.'; } },
        { label: 'Bu sefer olmaz', desc: 'Bir şey olmaz', run: () => 'Rehber kartını bıraktı, karşıdaki lokantaya yöneldi.' }
      ] }) });

  ev.push({ id: 'mahalleTakimi', who: 'ayse', w: 0.6,
    build: (G) => ({ title: 'Mahalle takımına sponsor', text: 'Ayşe Teyze\'nin torununun oynadığı mahalle futbol takımının forması yok. Dükkânın adı forma göğsünde yazsın mı?', ctx: {},
      choices: [
        { label: 'Formaları biz yaptıralım', desc: `${KE.tl(P(G, 12000))}, itibar +4, 10 gün aile +%20`, run: (G) => { pay(G, P(G, 12000)); rep(G, 4); G.mods.push({ key: 'type:aile', mult: 1.2, days: 10, label: 'Forma sponsoru' }); return 'Çocuklar ilk maçı formalarla kazandı. Veliler maçtan sonra dükkâna akın etti.'; } },
        { label: 'Bir kasa ayran gönder', desc: `${KE.tl(P(G, 1500))}, itibar +1`, run: (G) => { pay(G, P(G, 1500)); rep(G, 1); return 'Ayranlar devre arasında bitti. Teşekkür kartı geldi.'; } }
      ] }) });

  ev.push({ id: 'ustaHasta', who: null, w: 0.7, when: (G) => staffOf(G).some((s) => KE.isCook(s)),
    build: (G) => { const s = staffOf(G).filter(KE.isCook).sort((a, c) => a.energy - c.energy)[0];
      return { title: `${s.name} hastalandı`, text: `${s.name} sabah ateşler içinde geldi: "Bir şeyim yok usta, çalışırım." Sesi kısık, gözleri yorgun.`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: 'Eve gönder, dinlensin', desc: 'Bugün ustasız çalışırsın, moral +10', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale + 10, 0, 100); x.pos = 'mola'; G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.85, days: 1, label: 'Usta hasta' }); return `${x.name} gönülsüzce gitti. Ertesi gün turp gibi döndü.`; } },
          { label: 'Bugün idare etsin', desc: 'Moral −8, kalite düşebilir', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 8, 0, 100); x.energy = Math.min(x.energy, 55); return `${x.name} gün boyu öksürerek çalıştı. Ekip biraz kırgın.`; } }
        ] }; } });

  ev.push({ id: 'kiraArtisi', who: 'zeynep', w: 0.45, when: (G) => G.day > 40,
    build: (G) => { const b = branch(G); const inc = Math.round(b.rent * 0.25 / 1000) * 1000;
      return { title: 'Ev sahibi kira artışı istiyor', text: `Ev sahibi telefonda: "Piyasa uçtu, kirayı ${KE.tl(inc)} artırmam lazım." Zeynep Hanım sözleşmeye bakıyor: yıllık artış TÜFE ile sınırlı.`, ctx: { inc },
        choices: [
          { label: 'Sözleşmeyi hatırlat', desc: 'Kira %10 artar, ev sahibi biraz bozulur', run: (G) => { const b = branch(G); b.rent = Math.round(b.rent * 1.1 / 1000) * 1000; return 'Ev sahibi homurdandı ama sözleşmeye uydu. Kira %10 arttı.'; } },
          { label: 'İstediğini ver', desc: `Kira +${KE.tl(inc)}, itibar +1 (iyi komşu)`, run: (G, c) => { const b = branch(G); b.rent += c.inc; rep(G, 1); return 'Ev sahibi memnun, kapının önüne iki saksı çiçek bıraktı.'; } }
        ] }; } });

  ev.push({ id: 'dolapArizasi', who: 'emre', w: 0.55,
    build: (G) => ({ title: 'Soğutucu arızalandı', text: 'Sabah dolabın içi ılıktı. Servisçi bugün gelebilir ama acil ücret istiyor.', ctx: {},
      choices: [
        { label: 'Acil servisi çağır', desc: `${KE.tl(P(G, 7500))}`, run: (G) => { pay(G, P(G, 7500)); return 'Kompresör değişti, dolap yine buz gibi.'; } },
        { label: 'Yarına kadar idare et', desc: 'Stokun %30\'u bozulur', run: (G) => { const b = branch(G); Object.keys(b.stock).forEach((k) => { b.stock[k] *= 0.7; }); return 'Etin bir kısmını atmak zorunda kaldık. Ders aldık.'; } }
      ] }) });

  ev.push({ id: 'tvProgrami', who: 'ajans', w: 0.4, when: (G) => G.reputation >= 45,
    build: (G) => ({ title: 'Televizyondan davet', text: 'Sabah kuşağındaki yemek programı ustanı canlı yayına çağırıyor. Bir günlüğüne dükkândan ayrılması gerekecek.', ctx: {},
      choices: [
        { label: 'Ustayı yayına gönder', desc: 'Bugün müşteri −%15, sonra 7 gün +%30, itibar +5', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.85, days: 1, label: 'Usta televizyonda' }); G.mods.push({ key: 'traffic', mult: 1.3, days: 8, label: 'Televizyon etkisi' }); rep(G, 5); return 'Usta kameraya göz kırptı, telefonlar susmadı. "Televizyondaki dükkân burası mı?"'; } },
        { label: 'Dükkân boş kalmaz', desc: 'Bir şey olmaz', run: () => 'Yapımcı başka bir ustayı aradı.' }
      ] }) });

  ev.push({ id: 'komsuSikayet', who: 'bulent', w: 0.55,
    build: (G) => ({ title: 'Komşudan duman şikâyeti', text: 'Üst kattaki komşu belediyeye dilekçe vermiş: "Davlumbazın dumanı camımdan giriyor." Bülent Bey uyarıyor.', ctx: {},
      choices: [
        { label: 'Karbon filtre taktır', desc: `${KE.tl(P(G, 14000))}, temizlik +10`, run: (G) => { pay(G, P(G, 14000)); const b = branch(G); b.cleanliness = clamp(b.cleanliness + 10, 0, 100); return 'Filtre takıldı, komşu bir tabak baklava getirdi.'; } },
        { label: 'Komşuya bir tepsi gönder', desc: `${KE.tl(P(G, 800))}, %50 ihtimalle ceza`, run: (G) => { pay(G, P(G, 800)); if (KE.rand() < 0.5) return 'Komşu yumuşadı, dilekçesini geri çekti.'; const fine = fineOf(G, P(G, 9000)); G.cash -= fine; KE.addExtra(G, 'fines', fine); return `Dilekçe işleme girdi: ${KE.tl(fine)} ceza.`; } }
      ] }) });

  ev.push({ id: 'stajyer', who: 'buro', w: 0.5,
    build: (G) => ({ title: 'Meslek lisesinden stajyer', text: 'Aşçılık bölümünden bir öğrenci staj yeri arıyor. Okul öğle yemeğini ve sigortayı karşılıyor.', ctx: {},
      choices: [
        { label: 'Stajyeri al', desc: 'Ekip morali +5, 15 gün servis hızlanır', run: (G) => { moraleAll(G, 5); G.mods.push({ key: 'patience', mult: 1.1, days: 15, label: 'Stajyer desteği' }); return 'Stajyer ilk gün tabak taşıdı, ikinci gün soğan doğradı. Ekip ona abilik yapıyor.'; } },
        { label: 'Şu an bakamayız', desc: 'Bir şey olmaz', run: () => 'Okula teşekkür edip başka dönem için söz verdin.' }
      ] }) });

  ev.push({ id: 'toptanFirsat', who: 'riza', w: 0.6,
    build: (G) => { const amt = P(G, 20000);
      return { title: 'Toptan alım fırsatı', text: `Rıza: "Elimde fazla mal var. İki haftalık siparişini peşin ödersen %12 indirim yaparım." Peşinat: ${KE.tl(amt)}.`, ctx: { amt },
        choices: [
          { label: 'Peşin öde', desc: `${KE.tl(amt)}, 14 gün malzeme −%12`, run: (G, c) => { pay(G, c.amt); G.mods.push({ key: 'ing', mult: 0.88, days: 14, label: 'Toptan alım' }); return 'Depo doldu, maliyetler düştü. Rıza memnun.'; } },
          { label: 'Nakit elde kalsın', desc: 'Bir şey olmaz', run: () => 'Rıza omuz silkti: "Sen bilirsin kardeşim."' }
        ] }; } });

  ev.push({ id: 'cuzdan', who: null, w: 0.5,
    build: (G) => ({ title: 'Masada unutulan cüzdan', text: 'Kapanışta bir masanın altında dolu bir cüzdan bulundu. İçinde bir kimlik ve epey nakit var.', ctx: {},
      choices: [
        { label: 'Sahibini bul, teslim et', desc: 'İtibar +3, ekip morali +4', run: (G) => { rep(G, 3); moraleAll(G, 4); return 'Sahibi ertesi gün çiçekle geldi; mahallede hikâyesi anlatılıyor.'; } },
        { label: 'Karakola bırak', desc: 'İtibar +1', run: (G) => { rep(G, 1); return 'Tutanak tutuldu, cüzdan sahibine ulaştı.'; } }
      ] }) });

  ev.push({ id: 'sokakKedisi', who: 'ayse', w: 0.5,
    build: (G) => ({ title: 'Dükkânın kedisi', text: 'Bir sokak kedisi birkaç gündür kapının önünde uyuyor. Müşteriler fotoğrafını çekiyor, bazıları sevmiyor.', ctx: {},
      choices: [
        { label: 'Mama kabı koy, adını Köfte koy', desc: '10 gün öğrenci ve turist +%15', run: (G) => { G.mods.push({ key: 'type:ogrenci', mult: 1.15, days: 10, label: 'Kedi Köfte' }); G.mods.push({ key: 'type:turist', mult: 1.15, days: 10, label: 'Kedi Köfte' }); return 'Köfte artık dükkânın maskotu. Sosyal medyada kendi hesabı bile var.'; } },
        { label: 'Hayvanseverlere haber ver', desc: 'İtibar +1', run: (G) => { rep(G, 1); return 'Gönüllüler kediyi aşılattı, yakındaki parka bir kulübe kurdu.'; } }
      ] }) });

  ev.push({ id: 'yolCalismasi', who: 'bulent', w: 0.5,
    build: (G) => ({ title: 'Kapının önünde yol çalışması', text: 'Belediye kaldırımı söktü; bir hafta sürecekmiş. Yaya trafiği düşecek.', ctx: {},
      choices: [
        { label: 'Yön tabelası ve paket kampanyası', desc: `${KE.tl(P(G, 5000))}, kayıp yarıya iner`, run: (G) => { pay(G, P(G, 5000)); G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.88, days: 6, label: 'Yol çalışması' }); return '"Kazıya rağmen açığız!" tabelası işe yaradı.'; } },
        { label: 'Sabret', desc: '6 gün müşteri −%25', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.75, days: 6, label: 'Yol çalışması' }); return 'Toz toprak içinde bir hafta geçti.'; } }
      ] }) });

  ev.push({ id: 'vergiDenetimi', who: 'zeynep', w: 0.4, when: (G) => G.day > 30,
    build: (G) => ({ title: 'Vergi incelemesi', text: 'Vergi müfettişi son üç ayın kayıtlarını istiyor. Zeynep Hanım: "Defterler tamam ama bir hafta mesai lazım."', ctx: {},
      choices: [
        { label: 'Muhasebeciye ek mesai öde', desc: `${KE.tl(P(G, 8000))}, sorunsuz`, run: (G) => { pay(G, P(G, 8000)); return 'İnceleme temiz kapandı. Müfettiş giderken "Defterleriniz örnek" dedi.'; } },
        { label: 'Kendin hazırla', desc: '%40 ihtimalle usulsüzlük cezası', run: (G) => { if (KE.rand() < 0.6) return 'Gece yarılarına kadar fatura sıraladın; inceleme temiz çıktı.'; const fine = fineOf(G, P(G, 15000)); G.cash -= fine; KE.addExtra(G, 'fines', fine); return `Birkaç fiş eksik çıktı: ${KE.tl(fine)} usulsüzlük cezası.`; } }
      ] }) });

  ev.push({ id: 'yeniTarif', who: 'lonca', w: 0.5, when: (G) => staffOf(G).some(KE.isCook),
    build: (G) => { const s = staffOf(G).filter(KE.isCook).sort((a, c) => Number(c.role === 'usta') - Number(a.role === 'usta') || c.morale - a.morale)[0];
      return { title: `${KE.ek(s.name, 'in')} yeni tarif fikri`, text: `${s.name}: "Memleketin usulü bir sos denesek? Bir hafta tadım yaparız, beğenilirse menüde kalır."`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: 'Dene, malzemesini al', desc: `${KE.tl(P(G, 4000))}, usta morali +15, 7 gün gurme +%40`, run: (G, c) => { pay(G, P(G, 4000)); const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale + 15, 0, 100); G.mods.push({ key: 'type:gurme', mult: 1.4, days: 7, label: 'Yeni sos' }); return 'Sos tuttu! Gurmeler tarifini soruyor, usta sır vermiyor.'; } },
          { label: 'Klasikten şaşmayalım', desc: 'Usta morali −5', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 5, 0, 100); return 'Usta "Peki" dedi ama biraz bozuldu.'; } }
        ] }; } });

  ev.push({ id: 'kermes', who: 'ayse', w: 0.5,
    build: (G) => ({ title: 'Okul kermesi', text: 'Mahalle okulu kütüphane için kermes düzenliyor. Ayşe Teyze dükkândan bir stant bekliyor.', ctx: {},
      choices: [
        { label: 'Stant kur, gelir okula', desc: `${KE.tl(P(G, 6000))} malzeme, itibar +4, 7 gün aile +%15`, run: (G) => { pay(G, P(G, 6000)); rep(G, 4); G.mods.push({ key: 'type:aile', mult: 1.15, days: 7, label: 'Kermes' }); return 'Stant ilk bir saatte tükendi. Okul müdürü teşekkür plaketi gönderdi.'; } },
        { label: 'Bağış yap', desc: `${KE.tl(P(G, 2500))}, itibar +2`, run: (G) => { pay(G, P(G, 2500)); rep(G, 2); return 'Bağış makbuzu panoya asıldı.'; } }
      ] }) });

  ev.push({ id: 'gazeteRoportaj', who: 'ajans', w: 0.5, when: (G) => G.reputation >= 35,
    build: (G) => ({ title: 'Yerel gazeteden röportaj', text: 'Mahalle gazetesi "Esnafın hikâyesi" köşesi için seninle konuşmak istiyor. Fotoğraf için ekibin de gelmesini istiyorlar.', ctx: {},
      choices: [
        { label: 'Ekiple birlikte poz ver', desc: 'Ekip morali +8, 7 gün müşteri +%10', run: (G) => { moraleAll(G, 8); G.mods.push({ key: 'traffic', mult: 1.1, days: 7, label: 'Gazete röportajı' }); return 'Fotoğraf kasanın arkasına asıldı. Ekip gururlu.'; } },
        { label: 'Yalnız konuş', desc: '7 gün müşteri +%6', run: (G) => { G.mods.push({ key: 'traffic', mult: 1.06, days: 7, label: 'Gazete röportajı' }); return 'Röportaj çıktı; birkaç yeni yüz "Gazetede gördük" dedi.'; } }
      ] }) });

  ev.push({ id: 'paketPlatform', who: 'emre', w: 0.45, when: (G) => G.staff.some((s) => s.role === 'kurye'),
    build: (G) => ({ title: 'Paket platformu teklifi', text: 'Bir sipariş uygulaması dükkânı ana sayfada öne çıkarmayı teklif ediyor: bir hafta boyunca, cironun %8\'i komisyon.', ctx: {},
      choices: [
        { label: 'Öne çıkalım', desc: '7 gün müşteri +%18, malzeme +%8', run: (G) => { G.mods.push({ key: 'traffic', mult: 1.18, days: 7, label: 'Platform vitrini' }); G.mods.push({ key: 'ing', mult: 1.08, days: 7, label: 'Platform komisyonu' }); return 'Telefonlar ve tabletler aynı anda ötüyor. Emre motoru hiç durdurmadı.'; } },
        { label: 'Kendi müşterimiz yeter', desc: 'Bir şey olmaz', run: () => 'Uygulamanın satış temsilcisi bir broşür bıraktı.' }
      ] }) });

  ev.push({ id: 'ustaYarismasi', who: 'lonca', w: 0.4, when: (G) => G.mode && KE.MODES[G.mode].products.some((p) => KE.bestStar(G, branch(G), p.id) >= 3),
    build: (G) => ({ title: 'Ustalar yarışması', text: 'Lonca bu ay şehrin ustalarını yarıştırıyor. Katılım ücreti var; birinci olanın dükkânı bütün şehirde konuşulacak.', ctx: {},
      choices: [
        { label: 'Ustamızı yarıştıralım', desc: `${KE.tl(P(G, 5000))}, yıldıza göre şans`, run: (G) => { pay(G, P(G, 5000)); const b = branch(G); const best = Math.max(...KE.MODES[G.mode].products.map((p) => KE.bestStar(G, b, p.id))); if (KE.rand() < 0.15 + best * 0.12) { rep(G, 7); G.mods.push({ key: 'traffic', mult: 1.2, days: 10, label: 'Yarışma birinciliği' }); moraleAll(G, 10); return 'Birinci olduk! Kupa vitrinde, kuyruk sokağın sonunda.'; } rep(G, 1); return 'Kıl payı ikinci olduk. Jüri "Seneye sizi bekleriz" dedi.'; } },
        { label: 'Bu yıl izleyelim', desc: 'Bir şey olmaz', run: () => 'Yarışmayı tribünden izledin; rakiplerin tekniklerini not ettin.' }
      ] }) });


  /* ---------- Rakip hikâyesi: "Lüks Kebap" sırayla hamle yapar ----------
     Her hamle bir olay kartıdır; seçimin "düello" sonucunu (kazandın / kaybettin) ve rakibin gücünü değiştirir.
     Rakip gücü semt şampiyonluğu çıtasını yükseltir; rakibin yerleştiği semtte müşteri azalır. */
  const duel = (G, won, power) => { const R = G.rival; if (won) R.wins = (R.wins || 0) + 1; else R.losses = (R.losses || 0) + 1; R.power = Math.max(0, R.power + (power || 0)); };
  const bestCook = (G) => G.staff.filter((s) => s.role === 'usta').sort((a, c) => Object.values(c.spec).reduce((x, y) => x + y, 0) - Object.values(a.spec).reduce((x, y) => x + y, 0))[0];

  ev.push({ id: 'rk_fiyat', who: 'rakip', w: 0, arc: true,
    build: (G) => ({ title: 'Fiyat savaşı başladı', text: 'Cüneyt Bey bütün şubelerinde fiyatları %20 indirdi. Vitrinine kocaman "Şehrin en ucuzu" yazdırmış. Müşterilerin bir kısmı şimdiden karşıya bakıyor.', ctx: {},
      choices: [
        { label: 'Biz de fiyat indirelim', desc: 'Bütün fiyatlar −%10, müşteri kaybı yok', run: (G) => { G.branches.forEach((b) => Object.keys(b.prices).forEach((k) => { b.prices[k] = Math.max(5, Math.round(b.prices[k] * 0.9 / 5) * 5); })); duel(G, true, 2); return 'Fiyatları indirdik. Kâr marjı inceldi ama kimse karşıya geçmedi. Cüneyt Bey bu kadar hızlı karşılık beklemiyordu.'; } },
        { label: 'Kaliteyle cevap ver', desc: `${KE.tl(P(G, 15000))}, 10 gün sabır +%15, ustan iyiyse itibar +2`, run: (G) => { pay(G, P(G, 15000)); G.mods.push({ key: 'patience', mult: 1.15, days: 10, label: 'Kalite kampanyası' }); const b = branch(G); const best = Math.max(...KE.MODES[G.mode].products.map((p) => KE.bestStar(G, b, p.id))); if (best >= 3) { rep(G, 2); duel(G, true, 0); return '"Ucuz etin yahnisi yavan olur." Müşteriler farkı tadınca geri döndü.'; } G.mods.push({ key: 'traffic', mult: 0.92, days: 10, label: 'Fiyat savaşı' }); duel(G, false, 4); return 'Kampanya iyiydi ama tabaktaki fark yeterince belli olmadı. Bir kısım müşteri ucuza kaçtı.'; } },
        { label: 'Görmezden gel', desc: '10 gün müşteri −%18', run: (G) => { G.mods.push({ key: 'traffic', mult: 0.82, days: 10, label: 'Fiyat savaşı' }); duel(G, false, 6); return 'Kuyruk kısaldı. Cüneyt Bey gazeteye "Esnaf dayanamıyor" diye demeç verdi.'; } }
      ] }) });

  ev.push({ id: 'rk_usta', who: 'rakip', w: 0, arc: true, when: (G) => !!bestCook(G),
    build: (G) => { const s = bestCook(G);
      return { title: `Cüneyt Bey ${KE.ek(s.name, 'in')} peşinde`, text: `Rakip, en iyi ustan ${KE.ek(s.name, 'e')} yalnızca maaş değil, yeni şubesinde ortaklık teklif etmiş. "Bu sefer ciddi" diyor usta, gözünü kaçırarak.`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: 'Kâr payı primi ver', desc: `${KE.tl(P(G, 60000))}, moral +25, maaş +%10`, run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); if (!x) return 'Usta zaten gitmiş.'; pay(G, P(G, 60000)); raise(G, x, 1.1); x.morale = clamp(x.morale + 25, 0, 100); duel(G, true, 0); return `${x.name} primi cebine koydu: "Ortaklık dediğin böyle olur." Cüneyt Bey eli boş döndü.`; } },
          { label: 'Vicdanına bırak', desc: 'Moral 60 ve üstüyse kalır', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); if (!x) return 'Usta zaten gitmiş.'; if (x.morale >= 60) { x.morale = clamp(x.morale + 10, 0, 100); duel(G, true, 0); return `${x.name}: "Bu ocağı sen yaktın, ben söndürmem." Kaldı.`; } G.staff = G.staff.filter((y) => y.id !== x.id); duel(G, false, 10); return `${x.name} önlüğünü katlayıp bıraktı. Karşı dükkânın camında yüzünü gördük.`; } },
          { label: 'Yolu açık olsun', desc: 'Usta gider, rakip güçlenir', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); if (x) G.staff = G.staff.filter((y) => y.id !== x.id); duel(G, false, 10); return 'Usta gitti. Usta Pazarı\'nda yeni bir isim aramak gerek.'; } }
        ] }; } });

  ev.push({ id: 'rk_tac', who: 'rakip', w: 0, arc: true,
    build: (G) => { const b = G.branches.find((x) => x.championUntil) || branch(G); const d = KE.district(b);
      return { title: `${KE.ek(d.name, 'de')} taç savaşı`, text: `"Lüks Kebap" ${KE.ek(d.name, 'de')}ki şubesine yeni bir şef ve mermer salon getirdi. Hedefleri belli: bu ay semtin tacını senden almak.`, ctx: { bid: b.id },
        choices: [
          { label: 'Semtte lezzet festivali düzenle', desc: `${KE.tl(P(G, 40000))}, 14 gün şube müşterisi +%25, itibar +2`, run: (G, c) => { pay(G, P(G, 40000)); G.mods.push({ key: 'traffic:' + c.bid, mult: 1.25, days: 14, label: 'Lezzet festivali' }); rep(G, 2); G.rival.district = KE.district(G.branches.find((x) => x.id === c.bid)).id; duel(G, true, 6); return 'Festival üç gün sürdü; semtin bütün sofraları bizim dükkândan doldu.'; } },
          { label: 'Müdavimlerine güven', desc: 'Sadık müdavimin çoksa taç kalır', run: (G, c) => { G.rival.district = KE.district(G.branches.find((x) => x.id === c.bid)).id; const loyal = Object.values(G.regulars || {}).filter((r) => r.loyalty >= 6).length; if (loyal >= 2) { duel(G, true, 8); return 'Ayşe Teyze kapıda nöbet tutar gibi: "Bizim dükkân burası." Müdavimler kımıldamadı.'; } duel(G, false, 14); return 'Müdavimlerin azdı; yenilik merakı ağır bastı. Çıta yükseldi.'; } }
        ] }; } });

  ev.push({ id: 'rk_karalama', who: 'rakip', w: 0, arc: true,
    build: (G) => ({ title: 'Karalama kampanyası', text: 'Sosyal medyada sahte hesaplar "Bu dükkânda bayat et kullanılıyor" diye paylaşım yapıyor. Arkasında kimin olduğunu herkes tahmin ediyor.', ctx: {},
      choices: [
        { label: 'Kapını denetime aç', desc: 'Temizlik 60 ve üstüyse itibar +4', run: (G) => { const b = branch(G); if (b.cleanliness >= 60) { rep(G, 4); duel(G, true, -8); return 'Belediye ekibi canlı yayında mutfağı gezdi: "Pırıl pırıl." İftira geri tepti.'; } rep(G, -5); duel(G, false, 6); return 'Denetimde tezgâh altı kirli çıktı. Paylaşımlar haklı çıkmış gibi oldu. İtibar −5.'; } },
        { label: 'Ajansla karşı kampanya', desc: `${KE.tl(P(G, 30000))}, itibar +1, 7 gün müşteri +%10`, run: (G) => { G.cash -= P(G, 30000); KE.addExtra(G, 'ads', P(G, 30000)); rep(G, 1); G.mods.push({ key: 'traffic', mult: 1.1, days: 7, label: 'Karşı kampanya' }); duel(G, true, 0); return 'Ustanın döner kestiği videolar karalamayı bastırdı.'; } },
        { label: 'Sessiz kal', desc: 'İtibar −4', run: (G) => { rep(G, -4); duel(G, false, 4); return 'Söylenti bir hafta dolaştı. Bazı müşteriler sorarak girdi.'; } }
      ] }) });

  ev.push({ id: 'rk_teklif', who: 'rakip', w: 0, arc: true,
    build: (G) => ({ title: 'Cüneyt Bey zincirini almak istiyor', text: `Cüneyt Bey bir akşam kapıda belirdi, masaya bir zarf koydu: "Bütün şubelerine ${KE.tl(G.branches.reduce((a, b) => a + KE.branchCost(G, KE.district(b)), 0) * 2)} veririm. Yorulmadın mı?"`, ctx: {},
      choices: [
        { label: '"Bu ocak satılık değil"', desc: 'Ekip morali +10, rakip öfkelenir', run: (G) => { G.staff.forEach((s) => { s.morale = clamp(s.morale + 10, 0, 100); }); G.flags.rivalRefused = G.day; duel(G, true, 10); return 'Zarfı açmadan geri verdin. Mutfaktan alkış koptu. Cüneyt Bey kapıdan çıkarken "Görüşeceğiz" dedi.'; } },
        { label: '"Asıl ben seni alırım"', desc: 'Son hedefi ilan et, itibar +2', run: (G) => { G.flags.rivalRefused = G.day; rep(G, 2); duel(G, true, 12); return 'Cüneyt Bey güldü, sonra gülmeyi kesti: "O gün gelirse anahtarları kendi elimle veririm." Bütün şehir bu cümleyi konuşuyor.'; } }
      ] }) });

  /* sıradaki rakip hamlesi: [olay, en erken gün, en düşük dönem] */
  KE.RIVAL_ARC = [['rakipSemt', 14, 1], ['rk_fiyat', 35, 1], ['rk_usta', 60, 2], ['rk_tac', 90, 2], ['rk_karalama', 120, 2], ['rk_teklif', 150, 3]];
  KE.rivalNext = function (G) {
    if (G.flags.empire) return null;
    const st = (G.rival && G.rival.stage) || 0, a = KE.RIVAL_ARC[st];
    if (!a) return null;
    const e = ev.find((x) => x.id === a[0]);
    const due = G.day >= a[1] && (G.era || 1) >= a[2] && G.day - ((G.rival && G.rival.last) || 0) >= 18 && (!e.when || e.when(G));
    return { id: a[0], step: st + 1, of: KE.RIVAL_ARC.length, due, day: a[1], era: a[2] };
  };

  /* ---------- Müdavim hikâyeleri: gönül arttıkça bölüm bölüm ilerler ---------- */
  const story = (rid, n, minLoyal, build) => ev.push({ id: `st_${rid}_${n}`, who: null, w: 2.2, story: rid, step: n,
    when: (G) => G.regulars && G.regulars[rid] && G.regulars[rid].loyalty >= minLoyal && ((G.stories || {})[rid] || 0) === n - 1 && G.day - ((G.stories || {})[rid + '_d'] || 0) >= 8,
    build });
  const loyal = (G, rid, d) => { const r = G.regulars[rid]; r.loyalty = clamp(r.loyalty + d, 0, 10); };
  const done = (G, rid, n) => { G.stories = G.stories || {}; G.stories[rid] = n; G.stories[rid + '_d'] = G.day; };

  story('selin', 1, 3, (G) => ({ title: 'Avukat Selin\'in zor davası (1/3)', text: 'Avukat Selin her zamanki dürümünü yerken dosyalara gömülmüş: "Mahallenin eski fırıncısını tahliye etmek istiyorlar. Gece gündüz çalışıyorum."', ctx: {},
    choices: [
      { label: 'Öğle yemeği bizden', desc: 'Selin\'in gönlü +2', run: (G) => { loyal(G, 'selin', 2); done(G, 'selin', 1); return '"Bu davayı kazanırsak ilk kutlama burada." Selin dosyaları toparlayıp koştu.'; } },
      { label: 'İyi şanslar dile', desc: 'Gönül +1', run: (G) => { loyal(G, 'selin', 1); done(G, 'selin', 1); return 'Selin gülümsedi: "Sağ ol, ihtiyacım vardı."'; } }
    ] }));
  story('selin', 2, 6, (G) => ({ title: 'Selin\'in davası: duruşma günü (2/3)', text: 'Selin telaşla geldi: "Yarın duruşma var, fırıncı Hüsnü Amca\'ya tanıklık edecek esnaf lazım. Sen yıllardır komşususun."', ctx: {},
    choices: [
      { label: 'Tanıklık et', desc: 'Yarım gün dükkândan uzak: 1 gün müşteri −%15, itibar +3', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.85, days: 1, label: 'Duruşma' }); rep(G, 3); loyal(G, 'selin', 2); done(G, 'selin', 2); return 'Mahkeme salonunda Hüsnü Amca elini sıktı. Mahalle bunu unutmayacak.'; } },
      { label: 'Dilekçe yaz, imzala', desc: 'Gönül +1', run: (G) => { loyal(G, 'selin', 1); done(G, 'selin', 2); return 'Esnaf imzalarıyla dolu dilekçe dosyaya girdi.'; } }
    ] }));
  story('selin', 3, 8, (G) => ({ title: 'Selin davayı kazandı! (3/3)', text: 'Selin kapıdan "Kazandık!" diye girdi, arkasında Hüsnü Amca ve yarım mahalle. "Bundan sonra senin bütün sözleşmelerine ben bakarım, hem de bedava."', ctx: {},
    choices: [
      { label: 'Herkese ikram!', desc: `${KE.tl(P(G, 5000))}, itibar +4, 60 gün beyaz yaka +%15`, run: (G) => { pay(G, P(G, 5000)); rep(G, 4); G.mods.push({ key: 'type:beyaz', mult: 1.15, days: 60, label: 'Selin\'in tavsiyesi' }); G.flags.lawyer = G.day; done(G, 'selin', 3); return 'Kutlama gece yarısına kadar sürdü. Selin artık dükkânın avukatı: cezalar ve sözleşmeler dert değil.'; } }
    ] }));

  story('kemal', 1, 3, (G) => ({ title: 'Emekli Kemal Bey\'in fotoğrafları (1/3)', text: `Kemal Bey sararmış bir zarf çıkardı: "Bu dükkânın 1974'teki hâli. Baban o zaman çıraktı." Fotoğrafta genç bir adam ${G.mode === 'doner' ? 'döner kesiyor' : 'şiş çeviriyor'}.`, ctx: {},
    choices: [
      { label: 'Duvara asalım', desc: 'Ekip morali +5, Kemal Bey\'in gönlü +2', run: (G) => { moraleAll(G, 5); loyal(G, 'kemal', 2); done(G, 'kemal', 1); return 'Fotoğraf kasanın üstüne asıldı. Müşteriler önünde durup soruyor.'; } },
      { label: 'Kemal Bey\'e geri ver', desc: 'Gönül +1', run: (G) => { loyal(G, 'kemal', 1); done(G, 'kemal', 1); return '"Sende dursun aslında..." dedi ama zarfı cebine koydu.'; } }
    ] }));
  story('kemal', 2, 6, (G) => ({ title: 'Kemal Bey\'in muhtarlık adaylığı (2/3)', text: 'Kemal Bey heyecanlı: "Muhtarlığa aday oluyorum. Seçim bürosu olarak dükkânın arka masasını kullanabilir miyim?"', ctx: {},
    choices: [
      { label: 'Arka masa senin', desc: '10 gün aile müşterisi +%20, gönül +2', run: (G) => { G.mods.push({ key: 'type:aile', mult: 1.2, days: 10, label: 'Seçim bürosu' }); loyal(G, 'kemal', 2); done(G, 'kemal', 2); return 'Arka masa çay ve seçim broşürleriyle doldu; mahalleli her gün uğruyor.'; } },
      { label: 'Esnaf tarafsız kalmalı', desc: 'Gönül −1', run: (G) => { loyal(G, 'kemal', -1); done(G, 'kemal', 2); return 'Kemal Bey anlayışla başını salladı ama biraz bozuldu.'; } }
    ] }));
  story('kemal', 3, 8, (G) => ({ title: 'Muhtar Kemal Bey (3/3)', text: 'Seçim sonuçları açıklandı: Kemal Bey muhtar! İlk işi dükkânın önüne bank ve çiçeklik koydurmak oldu. "Mahallenin kalbi burası" dedi.', ctx: {},
    choices: [
      { label: 'Kutlama lokması dağıt', desc: `${KE.tl(P(G, 4000))}, itibar +4, şube temizliği +15`, run: (G) => { pay(G, P(G, 4000)); rep(G, 4); G.branches.forEach((b) => { b.cleanliness = clamp(b.cleanliness + 15, 0, 100); }); G.flags.muhtar = G.day; done(G, 'kemal', 3); return 'Muhtarlık artık denetimlerde bizim yanımızda; sokak her sabah süpürülüyor.'; } }
    ] }));

  story('elif', 1, 3, (G) => ({ title: 'Öğrenci Elif\'in bursu (1/3)', text: 'Elif masada ders çalışıyor, gözleri yorgun: "Burs sınavı yaklaşıyor ama akşamları kafede çalışmak zorundayım."', ctx: {},
    choices: [
      { label: 'Akşamları yemeği bizden', desc: `${KE.tl(P(G, 3000))}, Elif\'in gönlü +3`, run: (G) => { pay(G, P(G, 3000)); loyal(G, 'elif', 3); done(G, 'elif', 1); return 'Elif gözleri dolarak teşekkür etti: "Bunu unutmayacağım."'; } },
      { label: 'Yarı zamanlı iş teklif et', desc: '15 gün servis sabrı +%10, gönül +2', run: (G) => { G.mods.push({ key: 'patience', mult: 1.1, days: 15, label: 'Elif kasada' }); loyal(G, 'elif', 2); done(G, 'elif', 1); return 'Elif hafta sonları kasada; müşteriler güler yüzüne bayıldı.'; } }
    ] }));
  story('elif', 2, 6, (G) => ({ title: 'Elif\'in sosyal medya fikri (2/3)', text: 'Elif telefonunu uzattı: "Kampüste herkes yemek videosu çekiyor. Ustanın döner kesişini çeksem, patlar bence!"', ctx: {},
    choices: [
      { label: 'Çek bakalım!', desc: '10 gün öğrenci +%35, gönül +2', run: (G) => { G.mods.push({ key: 'type:ogrenci', mult: 1.35, days: 10, label: 'Elif\'in videosu' }); loyal(G, 'elif', 2); done(G, 'elif', 2); return 'Video kampüste elden ele dolaştı; akşamları masa bulmak zorlaştı.'; } },
      { label: 'Usta kameradan çekinir', desc: 'Gönül +1', run: (G) => { loyal(G, 'elif', 1); done(G, 'elif', 2); return 'Elif omuz silkti: "Peki, ama fikrim aklında olsun."'; } }
    ] }));
  story('elif', 3, 8, (G) => ({ title: 'Elif mezun oldu! (3/3)', text: 'Elif diplomasıyla geldi: "Bursu kazandım, bitirdim de! İlk maaşımla ilk yemeği burada yiyeceğim demiştim." Şimdi büyük bir ajansta çalışıyor.', ctx: {},
    choices: [
      { label: 'Mezuniyet sofrası kur', desc: `${KE.tl(P(G, 4000))}, itibar +3, 60 gün öğrenci +%15`, run: (G) => { pay(G, P(G, 4000)); rep(G, 3); G.mods.push({ key: 'type:ogrenci', mult: 1.15, days: 60, label: 'Elif\'in hikâyesi' }); G.flags.elif = G.day; done(G, 'elif', 3); return 'Elif\'in hikâyesi kampüs gazetesine çıktı: "Bir döner dükkânı bir hayatı değiştirdi."'; } }
    ] }));

  KE.EVENTS = ev;
  const ARC_IDS = () => KE.RIVAL_ARC.map((a) => a[0]);
  KE.rollEvent = function (G) {
    if (G.day < 3) return null;
    const nx = KE.rivalNext(G);
    if (nx && nx.due && KE.rand() < 0.6) {
      const e = ev.find((x) => x.id === nx.id);
      const card = e.build(G);
      G.eventLog.push(e.id); G.rival.stage = nx.step; G.rival.last = G.day;
      return { id: e.id, who: e.who, title: card.title, text: card.text, ctx: card.ctx, whoStaff: card.who ? card.who.id : null, rival: nx.step, choices: card.choices.map((c) => ({ label: c.label, desc: c.desc })) };
    }
    if (KE.rand() > 0.42) return null;
    const arc = ARC_IDS();
    const pool = ev.filter((e) => !e.arc && arc.indexOf(e.id) === -1 && (!e.mode || e.mode === G.mode) && (!e.when || e.when(G)) && G.eventLog.slice(-4).indexOf(e.id) === -1);
    if (!pool.length) return null;
    const wOf = (x) => typeof x.w === 'function' ? x.w(G) : x.w;
    let tot = pool.reduce((a, e) => a + wOf(e), 0), r = KE.rand() * tot;
    let e = pool[0];
    for (const x of pool) { if ((r -= wOf(x)) <= 0) { e = x; break; } }
    const card = e.build(G);
    G.eventLog.push(e.id);
    return { id: e.id, who: e.who, title: card.title, text: card.text, ctx: card.ctx, whoStaff: card.who ? card.who.id : null, story: e.story ? { rid: e.story, step: e.step } : null, choices: card.choices.map((c) => ({ label: c.label, desc: c.desc })) };
  };
  KE.resolveEvent = function (G, idx) {
    KE.RNG.seed(G, 'event' + idx);
    const pe = G.pendingEvent;
    if (!pe) return '';
    const e = ev.find((x) => x.id === pe.id);
    let card;
    try { card = e.build(G); } catch (err) { card = null; }
    let msg = '';
    if (card && card.choices[idx]) msg = card.choices[idx].run(G, pe.ctx) || '';
    G.pendingEvent = null;
    return msg;
  };

  /* ---------- Karakter replikleri ---------- */
  KE.LINES = {
    zeynep: ['Rakamlar yalan söylemez, patron. Ama bazen insanı üzer.', 'Bordroyu hazırladım. SGK primlerini gününde yatırırsak 5 puanlık teşviki kaçırmayız.', 'Fireyi azaltırsak ay sonunda fark edersin.', 'KDV beyannamesi ayın 28\'inde, unutmayalım.'],
    ayse: ['Evladım, dürümün tuzu tam kararında. Ellerine sağlık.', 'Benim zamanımda döner odun ateşinde pişerdi, ama seninki de fena değil.', 'Fiyatları biraz yükseltmişsin gibi, emekliyiz biz.', 'Ustana iyi bak, iyi usta altın değerindedir.'],
    riza: ['En iyi parçayı sana ayırdım kardeşim.', 'Premium etle ustan şov yapar, söyleyeyim.', 'Halde fiyatlar her hafta oynuyor, ben ne yapayım.', 'Otomatik siparişini her sabah yediye kadar getiriyorum.'],
    bulent: ['Tezgâh altı temizliği her gün yapılacak.', 'Davlumbaz filtreleri haftada bir değişmeli.', 'Personelin portör muayeneleri tam mı?'],
    emre: ['Abi paketler sıcak gidiyor, müşteri memnun.', 'Yağmurlu günler bizim bayramımız.', 'Motorun lastiği eskidi, ama idare ederiz.'],
    banker: ['Esnaf kredisinde aylık faiz şu an %3,4 civarında.', 'Nakit akışı her şeydir. Şube açmadan önce üç aylık kira kenarda olmalı.'],
    ajans: ['Doğru semte doğru kampanya, kuyruğun yarısı reklamdan gelir.', 'Gençlere sosyal medya, ailelere tabela, işçilere el ilanı.'],
    terzi: ['Yöresel kostüm ustanın memleketine göre dikilir; kumaşı ben seçerim.', 'Güzel giyinen usta daha çok bahşiş alır, otuz yıllık tecrübe.'],
    dekor: ['Aynı tarzdan üç parça koyarsan dükkânın bir kimliği olur.', 'Mermer pahalıdır ama gurmeler görünce gözleri parlar.'],
    buro: ['Kasiyer olmazsa ustalar hem sipariş alır hem pişirir; her şey yavaşlar.', 'Temizlikçi masrafına bakma, denetim cezası daha pahalı.'],
    lonca: ['Her usta bir ekoldür. Uzmanlığına göre müşteri gelir.', 'Çırağı iyi bir ustanın yanına ver, üç ayda adam olur.', 'Pazarda her pazartesi yeni ustalar olur.'],
    rakip: ['Bu şehirde tek bir kebap imparatorluğu olur, o da benimki.', 'Ustanı bir gün ben de isterim, haberin olsun.']
  };
  KE.line = (who) => pick(KE.LINES[who] || ['...']);
})();


// ---- js/save.js ----
/* Kebab Empire — kayıt sistemi
   Zarf: { v, app, savedAt, day, sum, game }. Eski kayıtlar sürüm sürüm göç ettirilir.
   Ana kayıt bozulursa son sağlam yedekten açılır. Dosyaya dışa/içe aktarma ve bulut kaydı aynı zarfı kullanır. */
(function () {
  /** @type {any} */
  const S = KE.SAVE = {};
  S.KEY = 'kebab-empire-save-v2';
  S.BACKUP = 'kebab-empire-save-backup';
  S.RACE_KEY = 'kebab-empire-race';
  /* bu sekmenin kimliği: başka sekmenin yazdığı kaydı kendi yazdığımızdan ayırmak için */
  S.TAB = 't' + Math.random().toString(36).slice(2, 9);
  S.VERSION = 4;
  S.APP = 'kebab-empire';

  /* Basit sağlama toplamı (FNV-1a): bozulmayı ve elle oynanmış dosyayı fark etmek için */
  S.hash = function (str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  /* Göçler: MIGRATIONS[n] oyunu n. sürümden n+1'e taşır */
  const MIGRATIONS = {
    /* 1 → 2: zarfsız eski kayıtlar; eksik alanları tamamla */
    1: (g) => {
      if (g.tut == null) g.tut = 99;
      if (!g.regulars) { g.regulars = {}; KE.REGULARS.forEach((r) => { g.regulars[r.id] = { loyalty: 0, visits: 0 }; }); }
      (g.staff || []).forEach((s) => { if (s.energy == null) s.energy = 100; if (!s.pos) s.pos = KE.POSITIONS[s.role][0]; });
      return g;
    },
    /* 2 → 3: tohumlu rastgelelik ve eylem günlüğü */
    2: (g) => {
      if (g.seed == null) g.seed = Math.floor(Math.random() * 2147483646) + 1;
      if (!g.actionLog) g.actionLog = [];
      if (!g.saveId) g.saveId = 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      return g;
    },
    /* 3 → 4: dönemler, rakip hikâyesi, haftalık meydan okuma, nesil. Eski oyun ulaştığı döneme sessizce yerleşir. */
    3: (g) => {
      g.gen = g.gen || 1; g.stories = g.stories || {}; g.weekly = g.weekly || null; g.flags = g.flags || {};
      g.rival = Object.assign({ power: 20, district: null }, g.rival || {});
      if (g.rival.stage == null) g.rival.stage = g.day > 40 ? 1 : 0;
      if (!g.era) { g.era = 1; try { KE.advanceEra(g); } catch (e) { /* eksik veri: 1. dönemde kal */ } }
      return g;
    }
  };
  S.migrate = function (g, from) {
    let v = from || 1;
    while (v < S.VERSION) { if (MIGRATIONS[v]) g = MIGRATIONS[v](g); v++; }
    return g;
  };

  /* Yüklemeden sonra her zaman yapılan tutarlılık düzeltmeleri */
  S.normalize = function (g) {
    KE.CAL.applyYear(KE.dateOf(g.day).getUTCFullYear());
    if (g.phase === 'service') g.phase = 'morning';
    if (g.phase === 'closing' && !g.lastSummary) g.phase = 'morning';
    g.live = null;
    (g.staff || []).forEach((s) => { s.task = null; if (s.energy == null) s.energy = 100; if (!s.pos) s.pos = KE.POSITIONS[s.role][0]; });
    /* Dönemlerden önce başlamış oyunlar (dönem kaydı yok): imza tarif şartı o sistemden önce
       ilerlemiş zincirlere sayılmaz; oyun ulaştığı döneme yerleşir, imparatorluk kurulmuşsa son dönemdedir. */
    if (g.flags && !g.eraLog) {
      g.eraLog = {};
      if ((g.branches || []).length >= 5 || g.flags.empire) g.flags.legacyImza = true;
      g.era = g.era || 1;
      if (KE.advanceEra) { try { KE.advanceEra(g); } catch (e) { /* eksik veri */ } }
    }
    if (g.flags && g.flags.empire && (g.era || 1) < 4) g.era = 4;
    (g.branches || []).forEach((b) => { if (b.stockLevel < 1.15) b.stockLevel = 1.15; });
    return g;
  };
  S.valid = (g) => !!(g && typeof g === 'object' && Array.isArray(g.branches) && g.branches.length && Array.isArray(g.staff) && typeof g.day === 'number' && g.mode && KE.MODES[g.mode]);

  S.envelope = function (G) {
    const body = JSON.stringify(Object.assign({}, G, { live: null }));
    /* zarf oyunun anlık kopyasını taşır: bulut kaydı birkaç saniye sonra gönderilir ve bu arada
       canlı oyun (şubeler, ekip) değişebilir; ortak nesneler sağlama toplamını bozardı */
    const game = JSON.parse(body);
    return { v: S.VERSION, app: S.APP, savedAt: new Date().toISOString(), day: G.day, tab: S.TAB, sum: S.hash(body), game };
  };
  /* Zarf ya da çıplak oyun: sürümü bul, göç ettir, doğrula */
  S.open = function (data) {
    if (!data || typeof data !== 'object') throw new Error('Kayıt okunamadı.');
    let g, v;
    if (data.app === S.APP && data.game) {
      g = data.game; v = data.v || 2;
      if (data.sum && S.hash(JSON.stringify(g)) !== data.sum) throw new Error('Kayıt dosyası bozulmuş ya da elle değiştirilmiş.');
      if (v > S.VERSION) throw new Error('Bu kayıt oyunun daha yeni bir sürümünden. Sayfayı yenileyip tekrar dene.');
    } else { g = data; v = 1; }
    g = S.migrate(g, v);
    if (!S.valid(g)) throw new Error('Kayıtta oyun bilgisi eksik.');
    return S.normalize(g);
  };

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } }
  };
  S.lastError = null;

  /* Son yazdığımız kaydın metni ve künyesi: bir sonraki yazışta eski kaydı yeniden ayrıştırmamak için.
     Yuvadaki metin bununla birebir aynı değilse (başka sekme, elle değişiklik) eskisi gibi ayrıştırılır. */
  let last = null;
  S.write = function (G) {
    /* zarf, JSON.stringify(S.envelope(G)) ile bayt bayt aynıdır; oyun gövdesi bir kez dizgeye çevrilir */
    const body = JSON.stringify(Object.assign({}, G, { live: null }));
    const head = { v: S.VERSION, app: S.APP, savedAt: new Date().toISOString(), day: G.day, tab: S.TAB, sum: S.hash(body) };
    const txt = JSON.stringify(head).slice(0, -1) + ',"game":' + body + '}';
    /* haftalık yarış ayrı yuvada durur: ana oyunun kaydına dokunmaz, buluta kayıt olarak gitmez */
    if (G.race) { if (!store.set(S.RACE_KEY, txt)) { S.lastError = 'quota'; return false; } S.lastError = null; return true; }
    /* Gün değiştiyse eski sağlam kaydı yedeğe al */
    const prev = store.get(S.KEY);
    if (prev) {
      let p = null;
      if (last && last.txt === prev) p = last.p;
      else { try { const o = JSON.parse(prev); p = o && { day: o.day, game: o.game && { day: o.game.day, saveId: o.game.saveId } }; } catch (e) { /* bozuk eskiyi yedeklemeyiz */ } }
      /* aynı oyunun daha ileri bir gününü eski bir günle ezme (ör. başka sekmede ilerlemiş oyun) */
      if (p && p.game && p.game.saveId === G.saveId && p.day > G.day && !S.allowRewind) { S.lastError = 'stale'; return false; }
      if (p && (p.day || (p.game && p.game.day)) !== G.day) store.set(S.BACKUP, prev);
    }
    S.allowRewind = false;
    if (!store.set(S.KEY, txt)) { last = null; S.lastError = 'quota'; return false; }
    last = { txt, p: { day: G.day, game: { day: G.day, saveId: G.saveId } } };
    S.lastError = null;
    if (KE.CLOUD && KE.CLOUD.queueSave && KE.CLOUD.ready) KE.CLOUD.queueSave(Object.assign(head, { game: JSON.parse(body) }));
    return true;
  };
  /* { game, from: 'main'|'backup', warning } ya da null */
  S.read = function () {
    for (const [k, from] of [[S.KEY, 'main'], [S.BACKUP, 'backup']]) {
      const raw = store.get(k);
      if (!raw) continue;
      try { return { game: S.open(JSON.parse(raw)), from, warning: from === 'backup' ? 'Son kayıt bozuktu; bir önceki günün yedeğinden açıldı.' : null }; }
      catch (e) { S.lastError = e.message; }
    }
    return null;
  };
  S.readRace = function () { const raw = store.get(S.RACE_KEY); if (!raw) return null; try { return S.open(JSON.parse(raw)); } catch (e) { return null; } };
  S.clearRace = () => store.del(S.RACE_KEY);
  S.exists = () => !!(store.get(S.KEY) || store.get(S.BACKUP));
  S.clear = () => { store.del(S.KEY); store.del(S.BACKUP); };

  /* Dosyaya dışa aktarma */
  S.exportFile = function (G) {
    const env = S.envelope(G);
    const blob = new Blob([JSON.stringify(env, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const name = (G.shopName || 'kebab-empire').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-gun-${G.day}.kebab.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  /* Dosyadan içe aktarma: Promise<game> */
  S.importFile = function () {
    return new Promise((resolve, reject) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return reject(new Error('Dosya seçilmedi.'));
        if (f.size > 5e6) return reject(new Error('Dosya çok büyük.'));
        const r = new FileReader();
        r.onload = () => { try { resolve(S.open(JSON.parse(String(r.result)))); } catch (e) { reject(e); } };
        r.onerror = () => reject(new Error('Dosya okunamadı.'));
        r.readAsText(f);
      };
      inp.click();
    });
  };
})();


// ---- js/verify.js ----
/* Kebab Empire — gün doğrulama (sunucuda ve testte aynı kod)
   Sabah durumu + oyuncu hamleleri + bahşiş kuralı ile günü yeniden oynatır ve iddia edilen
   sonucu karşılaştırır. Rastgelelik tohumlu olduğundan sonuç birebir aynı çıkmalıdır. */
(function () {
  /* Günü yeniden oynatır; sonuçla birlikte gün sonu durumunu (G) da döndürür (verifyChain ikinci kez oynatmasın) */
  function replayDay(morningEnvelope, log, todayRule, claim) {
    let G;
    try { G = KE.SAVE.open(morningEnvelope); } catch (e) { return { r: { ok: false, note: 'sabah kaydı açılamadı: ' + e.message } }; }
    if (G.phase !== 'morning') return { r: { ok: false, note: 'kayıt sabah evresinde değil' } };
    if (claim.day != null && claim.day !== G.day) return { r: { ok: false, note: 'gün uyuşmuyor' } };
    const S = KE.replayService(G, log || []);
    KE.finalizeDay(G, todayRule || G.tipRule);
    const got = { served: 0, revenue: 0 };
    Object.values(S.branches).forEach((b) => { got.served += b.stats.served; got.revenue += b.stats.revenue; });
    got.revenue = Math.round(got.revenue);
    got.reputation = Math.round(G.reputation * 10) / 10;
    const same = got.served === claim.served && Math.abs(got.revenue - Math.round(claim.revenue)) <= 1 && Math.abs(got.reputation - Math.round(claim.reputation * 10) / 10) <= 0.1;
    return { r: { ok: same, got, note: same ? 'doğrulandı' : `uyuşmadı: sunucu ${JSON.stringify(got)}` }, G };
  }
  KE.verifyDay = (morningEnvelope, log, todayRule, claim) => replayDay(morningEnvelope, log, todayRule, claim).r;
  /* ---------- Zincir: sabah kaydı bir önceki doğrulanmış günün sonundan mı türedi? ----------
     Sabah oyuncunun yapabildikleri: harcamak, kredi çekmek, olay kartını çözmek, hedef ödülü almak,
     işe almak/çıkarmak, fiyat ve menü ayarı. Bunların hiçbiri kasayı ya da itibarı aşağıdaki
     sınırların üstüne çıkaramaz; ustaların yıldızı ve deneyimi sabah artamaz; geçmiş değişemez. */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  KE.chainCheck = function (prevEnv, curEnv) {
    let P, Cu;
    try { Cu = KE.SAVE.open(clone(curEnv)); } catch (e) { return { ok: false, note: 'sabah kaydı açılamadı' }; }
    if (!prevEnv) {
      // zincirin ilk halkası: yeni başlamış bir oyun olmalı
      if (Cu.day !== 1) return { ok: false, note: 'zincir yok: sıralama yalnızca bulut açıkken başlanan oyunlarda geçerli' };
      if (Cu.cash > KE.FRESH.cash + 1 || Cu.reputation > KE.FRESH.reputation || Cu.ledger.days.length || Cu.branches.length !== 1) return { ok: false, note: 'ilk gün kaydı yeni oyun değil' };
      return { ok: true };
    }
    try { P = KE.SAVE.open(clone(prevEnv)); } catch (e) { return { ok: false, note: 'önceki gün açılamadı' }; }
    const bad = (n) => ({ ok: false, note: 'zincir kırık: ' + n });
    if (P.seed !== Cu.seed || P.saveId !== Cu.saveId || P.mode !== Cu.mode) return bad('farklı oyun');
    if (P.day !== Cu.day) return bad('gün atlanmış');
    // olay kartı en iyi seçenekle ne kadar kazandırabilirdi?
    let maxCash = P.cash, maxRep = P.reputation;
    if (P.pendingEvent) {
      P.pendingEvent.choices.forEach((_, i) => { const g = KE.SAVE.open(clone(prevEnv)); try { KE.resolveEvent(g, i); } catch (e) { /* yok */ } maxCash = Math.max(maxCash, g.cash); maxRep = Math.max(maxRep, g.reputation); });
    }
    if (Cu.flags && Cu.flags.empire && !(P.flags && P.flags.empire)) maxRep += 5; // imparatorluk satın alımı
    // okul bağışı sabah itibar verir (seviye başına +3); bağış seviyesi geri gidemez
    const okul = ((Cu.charity || {}).okul || 0) - ((P.charity || {}).okul || 0);
    if (Object.entries(P.charity || {}).some(([k, v]) => ((Cu.charity || {})[k] || 0) < v)) return bad('bağış geri alınmış');
    if (okul > 0) maxRep += 3 * okul;
    // yeni krediler (öncekilerle eşleşmeyenler) bankanın o günkü tekliflerinden biri olmalı
    const oldLoans = (P.loans || []).slice(), offers = KE.loanOffers(P);
    const same = (a, b) => a.amount === b.amount && a.monthly === b.monthly && a.remaining === b.remaining;
    let newLoans = 0;
    for (const l of Cu.loans || []) {
      const i = oldLoans.findIndex((o) => same(o, l));
      if (i >= 0) { oldLoans.splice(i, 1); continue; }
      if (!offers.some((o) => o.amount === l.amount && o.monthly === l.monthly && o.months === l.remaining)) return bad('kredi teklifle uyuşmuyor');
      newLoans += l.amount;
    }
    // listeden çıkan krediler: vadesi bitmiş (kalan 0) ya da erken kapatılmış olmalı; kapatma bedeli kasadan düşmüş olmalı
    const paidOff = oldLoans.reduce((a, l) => a + (l.remaining > 0 ? KE.payoffCost(l) : 0), 0);
    const goalCash = Object.keys(Cu.goals || {}).filter((k) => !(P.goals || {})[k]).reduce((a, k) => a + KE.goalReward(Cu, KE.GOALS.find((g) => g.id === k) || {}), 0);
    const cashCap = maxCash + newLoans + goalCash + 1;
    if (Cu.cash > cashCap) return bad('kasa açıklanamayan biçimde arttı');
    if (Cu.cash > cashCap - paidOff) return bad('kredi silinmiş');
    if (Cu.reputation > maxRep + 0.6) return bad('itibar artmış');
    if (Cu.contract && JSON.stringify(Cu.contract) !== JSON.stringify(P.contract)) {
      const o = KE.contractOffers(P).find((x) => x.id === Cu.contract.id);
      if (!o || o.pay !== Cu.contract.pay || o.cost !== Cu.contract.cost || o.qty !== Cu.contract.qty || Cu.contract.day !== Cu.day || KE.contractTaken(P)) return bad('toplu sipariş uydurulmuş');
    }
    if ((Cu.era || 1) !== (P.era || 1)) return bad('dönem değişmiş');
    if (Cu.weekly && P.weekly && JSON.stringify(Cu.weekly) !== JSON.stringify(P.weekly)) return bad('haftalık hedef değişmiş');
    if (Cu.ledger.days.length !== P.ledger.days.length || JSON.stringify(Cu.ledger.days.slice(-1)) !== JSON.stringify(P.ledger.days.slice(-1))) return bad('geçmiş değişmiş');
    for (const s of Cu.staff) {
      const o = P.staff.find((x) => x.id === s.id);
      if (!o) continue;
      for (const [pid, st] of Object.entries(s.spec || {})) if (st > ((o.spec || {})[pid] || 0)) return bad('usta yıldızı artmış');
      for (const [pid, xp] of Object.entries(s.xp || {})) if (xp > ((o.xp || {})[pid] || 0) + 1e-6) return bad('deneyim artmış');
      for (const k of ['speed', 'quality', 'consistency', 'skill', 'friendly']) if ((s[k] || 0) > (o[k] || 0) + 1e-9) return bad('yetenek artmış');
    }
    return { ok: true };
  };
  /* Doğrulama + zincir; başarıda bir sonraki halkanın başlangıcı olacak gün sonu kaydını döndürür */
  /* Haftalık yarış: gün gerçekten o haftanın tohumuyla, o semtte ve o modda başlamış bir yarış oyunundan mı?
     (yoksa oyuncu sıradan bir oyunun en iyi tohumunu yarışa sokabilirdi) */
  KE.raceCheck = function (race, morningEnv, now) {
    if (!race) return { ok: true };
    const g = morningEnv && morningEnv.game;
    if (!g || !g.race || g.race.week !== race) return { ok: false, note: 'yarış kaydı değil' };
    const R = KE.raceSetup(race);
    if (g.seed !== R.seed || g.mode !== R.mode || !g.branches || !g.branches[0] || g.branches[0].district !== R.district) return { ok: false, note: 'yarış tohumu uyuşmuyor' };
    if (g.day > KE.RACE_DAYS) return { ok: false, note: 'yarış 7 günle sınırlı' };
    if (now) { const cur = KE.raceWeek(now), prev = KE.raceWeek(new Date(now.getTime() - 7 * 864e5)); if (race !== cur && race !== prev) return { ok: false, note: 'yarış haftası geçti' }; }
    return { ok: true };
  };
  /* Hamle günlüğü: biçim ve boyut sınırı (sunucuyu ağır yeniden oynatmaya zorlamasın) */
  KE.LOG_MAX = 20000;
  KE.logCheck = function (log) {
    if (log == null) return { ok: true };
    if (!Array.isArray(log)) return { ok: false, note: 'günlük dizi değil' };
    if (log.length > KE.LOG_MAX) return { ok: false, note: 'günlük çok uzun' };
    for (const e of log) if (!e || typeof e !== 'object' || typeof e.m !== 'number' || typeof e.a !== 'string' || (e.x != null && !Array.isArray(e.x))) return { ok: false, note: 'günlük kaydı bozuk' };
    return { ok: true };
  };
  KE.verifyChain = function (prevEnd, morningEnv, log, todayRule, claim, race, now) {
    const lc = KE.logCheck(log);
    if (!lc.ok) return lc;
    const rc = KE.raceCheck(race, morningEnv, now);
    if (!rc.ok) return rc;
    const c = KE.chainCheck(prevEnd, morningEnv);
    if (!c.ok) return c;
    const { r, G } = replayDay(clone(morningEnv), log, todayRule, claim);
    if (!r.ok) return r;
    // gün sonu durumu (ertesi sabah, oyuncu müdahalesinden önce): doğrulamada oynatılan günün kendisi
    return Object.assign(r, { end: KE.SAVE.envelope(G) });
  };
})();


export const GAME = globalThis.KE;
