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
