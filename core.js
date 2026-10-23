/* Kilaw Smile v3 — inti permainan (tanpa UI) */
(function (root) {
  'use strict';
  var KEY = 'kilawgame_save_v3';

  var SPOTS = [
    { x: 205, y: 150, rx: 36, ry: 26 }, { x: 305, y: 142, rx: 32, ry: 24 }, { x: 252, y: 205, rx: 42, ry: 28 },
    { x: 172, y: 238, rx: 28, ry: 32 }, { x: 342, y: 236, rx: 30, ry: 34 }, { x: 215, y: 296, rx: 32, ry: 36 },
    { x: 306, y: 304, rx: 30, ry: 38 }, { x: 196, y: 362, rx: 24, ry: 32 }, { x: 318, y: 366, rx: 24, ry: 32 }
  ];

  // ---------------------------------------------------------------- alat (dibeli dengan uang)
  var TAPU = [
    { id: 'sikat',    name: 'Sikat Gigi',       icon: '🪥', base: 30,     rate: 1.18, add: 1,      desc: 'Daya ketuk +1 per level.' },
    { id: 'elektrik', name: 'Sikat Elektrik',   icon: '⚡', base: 1300,   rate: 1.17, add: 25,     desc: 'Daya ketuk +25 per level.' },
    { id: 'scaler',   name: 'Scaler Genggam',   icon: '🔧', base: 27000,  rate: 1.16, add: 200,    desc: 'Daya ketuk +200 per level.' },
    { id: 'laser',    name: 'Laser Dental',     icon: '🔦', base: 5e5,    rate: 1.16, add: 1500,   desc: 'Daya ketuk +1,5K per level.' },
    { id: 'plasma',   name: 'Plasma Pembersih', icon: '🔮', base: 1e7,    rate: 1.15, add: 12000,  desc: 'Daya ketuk +12K per level.' },
    { id: 'nano',     name: 'Nano-Bot Kuman',   icon: '🤖', base: 2e8,    rate: 1.15, add: 90000,  desc: 'Daya ketuk +90K per level.' }
  ];
  var TAP_MILES = [10, 20, 30, 40, 50];
  var GENS = [
    { id: 'asisten',  name: 'Asisten Gigi',        icon: '🧑‍⚕️', base: 120,    rate: 1.15, dps: 1.7,    desc: 'Membersihkan noda pelan-pelan.' },
    { id: 'scaler',   name: 'Scaler Ultrasonik',   icon: '🔊',    base: 1200,   rate: 1.15, dps: 10,     desc: 'Getaran halus meluruhkan noda.' },
    { id: 'kursi',    name: 'Kursi Dental',        icon: '💺',    base: 8300,   rate: 1.15, dps: 60,     desc: 'Pasien nyaman, kerja lebih cepat.' },
    { id: 'rontgen',  name: 'Rontgen Digital',     icon: '🩻',    base: 66000,  rate: 1.15, dps: 365,    desc: 'Tindakan tepat sasaran.' },
    { id: 'autoklaf', name: 'Ruang Steril',        icon: '🧼',    base: 6e5,    rate: 1.15, dps: 2100,   desc: 'Alat selalu siap pakai.' },
    { id: 'lab',      name: 'Lab Gigi Tiruan',     icon: '🦷',    base: 6e6,    rate: 1.15, dps: 13000,  desc: 'Tim lab bekerja paralel.' },
    { id: 'cabang',   name: 'Klinik Cabang',       icon: '🏥',    base: 8.3e7,  rate: 1.15, dps: 83000,  desc: 'Pasien dari kota sebelah.' },
    { id: 'rsgm',     name: 'Rumah Sakit Gigi',    icon: '🏨',    base: 1.3e9,  rate: 1.15, dps: 530000, desc: 'Layanan lengkap satu atap.' },
    { id: 'fkg',      name: 'Fakultas Kedokteran Gigi', icon: '🎓', base: 2e10, rate: 1.15, dps: 3.3e6, desc: 'Mencetak dokter gigi baru.' }
  ];
  var GEN_MILES = [10, 20, 30, 40, 50];
  var TAP_MAX = 50, GEN_MAX = 50; // batas level alat; level terakhir = bonus ×3
  // kompensasi karena level dibatasi: alat tingkat tinggi diberi daya lebih besar per level (+25% per tingkat)
  TAPU.forEach(function (it, i) { it.add = Math.round(it.add * (1 + i * 0.25)); it.desc = 'Daya ketuk +' + fmt(it.add) + ' per level.'; });
  GENS.forEach(function (it, i) { it.dps = Math.round(it.dps * (1 + i * 0.25) * 10) / 10; });

  // ---------------------------------------------------------------- pohon skill
  // [id, induk, ikon, nama, biaya SP, efek, catatan]
  var CAT = { r: '#B8E0D8', d: '#2FBBA6', i: '#E3AE4E', l: '#8BD66B', c: '#7C9CFF', h: '#E2727B', a: '#C39BFF', s: '#FF9E5E', x: '#FFD84A' };
  var CAT_NAME = { r: 'Awal', d: 'Damage', i: 'Penghasilan', l: 'Hoki', c: 'Tempo', h: 'Kekerasan Noda', a: 'Otomatis', s: 'Spesial', x: 'Legenda' };
  var RAW = [
    ['r0', null, '🌱', 'Awal Baru', 1, { dmgPct: 0.5, income: 0.25 }, 'Pembuka pohon. Dari sini hanya tiga jalur yang terlihat: Damage, Penghasilan, dan Hoki. Jalur lain tersembunyi di dalamnya dan baru muncul bila syarat lintas jalur terpenuhi.'],

    ['d1', 'r0', '✊', 'Genggaman Mantap', 1, { dmgFlat: 2 }],
    ['d2', 'd1', '💪', 'Otot Jari', 2, { dmgPct: 0.15 }],
    ['d3', 'd1', '🔨', 'Tangan Berat', 2, { dmgFlat: 4 }],
    ['d4', 'd2', '🪨', 'Sikat Baja', 3, { dmgPct: 0.2 }],
    ['d5', 'd3', '⚒️', 'Kepalan Besi', 3, { dmgFlat: 10 }],
    ['d6', 'd4', '🥊', 'Pukulan Berat', 4, { dmgMult: 1.5 }],
    ['d7', 'd5', '🦾', 'Otot Baja', 4, { dmgPct: 0.3 }],
    ['d8', 'd6', '🔱', 'Palu Dewa', 5, { dmgFlat: 30 }],
    ['d9', 'd7', '🗿', 'Tangan Titan', 6, { dmgMult: 2 }],

    ['i1', 'r0', '💰', 'Tarif Dokter', 1, { income: 0.2 }],
    ['i2', 'i1', '📦', 'Paket Perawatan', 2, { bonus: 0.3 }],
    ['i3', 'i1', '⭐', 'Pasien VIP', 2, { income: 0.25 }],
    ['i4', 'i2', '🛡️', 'Asuransi', 3, { bonus: 0.5 }],
    ['i5', 'i3', '💎', 'Layanan Premium', 3, { income: 0.35 }],
    ['i6', 'i5', '🎰', 'Pasien Dermawan', 4, { jackpot: 0.06 }, 'Peluang noda yang hilang memberi uang ×5. Hoki menambah peluangnya.'],
    ['i7', 'i4', '🏢', 'Franchise', 5, { incomeMult: 1.5 }],
    ['i8', 'i6', '🏦', 'Klinik Elit', 6, { incomeMult: 2 }],

    ['l1', 'r0', '🍀', 'Jimat Hoki', 1, { luck: 0.05 }],
    ['l2', 'l1', '🐞', 'Kaki Empat Daun', 2, { luck: 0.05 }],
    ['l3', 'l1', '🎯', 'Mata Elang', 2, { crit: 0.08 }],
    ['l4', 'l2', '🌈', 'Pelangi', 3, { luck: 0.1 }],
    ['l5', 'l3', '🔥', 'Bidikan Tajam', 3, { critMult: 1 }],
    ['l6', 'l4', '⚡', 'Tuah Instan', 4, { instant: 0.03 }, 'Noda yang tinggal sedikit (sisa ≤ 15 ketukan) bisa langsung hilang. Hoki menambah peluangnya. Pada Geraham hanya ¼.'],
    ['l7', 'l2', '🎁', 'Pasien Baik Hati', 3, { spLuck: 0.05 }, 'Peluang mendapat +1 SP tambahan saat gigi bersih. Hoki menambah peluangnya.'],
    ['l8', 'l6', '👑', 'Dewi Fortuna', 6, { luck: 0.15, instant: 0.04 }],
    ['l9', 'l7', '🌠', 'Bintang Jatuh', 5, { spLuck: 0.1 }],
    ['l10', 'l5', '💥', 'Kritis Dewa', 5, { crit: 0.1, critMult: 1.5 }],

    ['c1', 'r0', '🏃', 'Jari Lincah', 1, { cd: 0.1 }, 'Cooldown ketukan lebih singkat, jadi ketukan lebih sering dihitung.'],
    ['c2', 'c1', '👟', 'Refleks', 2, { cd: 0.1 }],
    ['c3', 'c1', '⚡', 'Kombo Cepat', 2, { combo: 1 }, 'Ketuk beruntun (jeda < 0,8 detik) menambah bonus daya hingga ×2.'],
    ['c4', 'c2', '🐆', 'Tangan Kilat', 3, { cd: 0.15 }],
    ['c5', 'c3', '🔗', 'Kombo Maks', 3, { comboMax: 50 }, 'Batas bonus kombo naik hingga ×3.'],
    ['c6', 'c4', '⏱️', 'Waktu Melambat', 4, { cd: 0.15 }],
    ['c7', 'c5', '🎼', 'Irama Kombo', 4, { dmgPct: 0.2 }],
    ['c8', 'c6', '💫', 'Kecepatan Cahaya', 6, { cd: 0.2 }],

    ['h1', 'r0', '🧪', 'Noda Rapuh', 1, { hard: 0.05 }, 'Nyawa semua noda berkurang, jadi lebih cepat bersih. Uang per noda tetap.'],
    ['h2', 'h1', '🧴', 'Pelarut Lemah', 2, { hard: 0.07 }],
    ['h3', 'h1', '↪️', 'Sisa Pukulan', 2, { overkill: 1 }, 'Kelebihan daya saat noda hilang pindah ke noda berikutnya.'],
    ['h4', 'h2', '🫧', 'Busa Aktif', 3, { hard: 0.08 }],
    ['h5', 'h3', '🔀', 'Percikan', 3, { chain: 0.15 }, 'Tiap ketukan juga mengenai noda lain sebesar 15% dayanya.'],
    ['h6', 'h4', '⚗️', 'Asam Lembut', 4, { hard: 0.1 }],
    ['h7', 'h5', '⛓️', 'Rantai Pukulan', 4, { chain: 0.25 }, 'Percikan ke noda lain +25% daya.'],
    ['h8', 'h6', '☢️', 'Pelarut Super', 6, { hard: 0.12 }],

    ['a1', 'r0', '🧑‍⚕️', 'Asisten Cekatan', 1, { dpsPct: 0.25 }],
    ['a2', 'a1', '🤖', 'Auto-Ketuk', 2, { auto: 1 }, 'Mengetuk noda otomatis 1× per detik.'],
    ['a3', 'a1', '🏷️', 'Diskon Supplier', 2, { costDisc: 0.1 }],
    ['a4', 'a2', '🕑', 'Jam Kerja Panjang', 3, { offCap: 7200, offEff: 0.75 }, 'Saat game ditutup: hasil sampai 2 jam, efisiensi 75%.'],
    ['a5', 'a2', '⚙️', 'Auto Cepat', 3, { auto: 1 }],
    ['a6', 'a3', '🏪', 'Waralaba', 4, { dpsMult: 1.5 }],
    ['a7', 'a4', '🌙', 'Shift Malam', 4, { offCap: 28800, offEff: 1 }, 'Saat game ditutup: hasil sampai 8 jam, efisiensi 100%.'],
    ['a8', 'a5', '🦿', 'Tim Super', 5, { auto: 2, dpsPct: 0.3 }],
    ['a9', 'a6', '🏭', 'Konglomerat', 6, { dpsMult: 2 }],

    ['s1', 'r0', '🪥', 'Sikat Geser', 2, { sweep: 0.5 }, 'Geser jari melintasi noda ikut membersihkannya: 0,5 ketukan tiap sapuan.'],
    ['s2', 's1', '↔️', 'Sapuan Panjang', 2, { sweep: 1 }, 'Daya sapuan menjadi 1 ketukan penuh.'],
    ['s3', 's1', '🌊', 'Aliran Sapuan', 3, { fever: 1 }, '10 sapuan beruntun memicu Mode Demam: daya ×2 selama 8 detik.'],
    ['s4', 's2', '🫧', 'Gelombang', 3, { wave: 1 }, 'Setiap 25 sapuan melepas gelombang: 20 detik daya otomatis ke noda.'],
    ['s5', 's3', '💃', 'Tarian Jari', 4, { feverDur: 6, feverMult: 3 }, 'Mode Demam jadi ×3 selama 14 detik.'],
    ['s6', 's4', '🎆', 'Ledakan ke-50', 4, { mega: 1 }, 'Setiap ketukan ke-50 bernilai ×25.'],
    ['s7', 's6', '🌪️', 'Sapu Jagat', 5, { sweepCrit: 1 }, 'Sapuan juga bisa kritis dan ikut menghitung ketukan ke-50.'],
    ['s8', 's5', '🌀', 'Tenaga Dalam', 5, { tapDps: 0.05 }, 'Tiap ketukan juga menambah 5% dari daya otomatis per detik.'],

    // ---- v5: cabang dalam (terkabut). Muncul hanya bila jumlah skill di kategorinya cukup.
    ['d10', 'd8', '🎯', 'Pembasmi Noda Sekarat', 6, { exec: 3 }, 'Noda dengan sisa nyawa ≤ 25% menerima daya ×3.', { c: 'd', n: 7 }],
    ['d11', 'd9', '🌋', 'Amukan Titan', 8, { dmgMult: 2.5 }, '', { c: 'd', n: 8 }],
    ['d12', 'd10', '🪞', 'Gema Pukulan', 7, { echo: 0.1 }, 'Peluang ketukan menghantam dua kali (×2). Hoki menambah peluangnya.', { c: 'd', n: 9 }],
    ['l11', 'l9', '🪙', 'Gigi Emas', 6, { goldTooth: 0.08 }, 'Peluang gigi bersih memberi bonus uang ×4. Hoki menambah peluangnya.', { c: 'l', n: 7 }],
    ['l12', 'l10', '🎲', 'Dadu Takdir', 8, { luck: 0.2, echo: 0.08 }, 'Hoki besar dan tambahan peluang Gema Pukulan.', { c: 'l', n: 9 }],
    ['i9', 'i8', '🏆', 'Dinasti Klinik', 8, { incomeMult: 2.5, goldTooth: 0.05 }, '', { c: 'i', n: 7 }],
    ['c9', 'c8', '♾️', 'Kombo Abadi', 7, { comboMax: 100 }, 'Batas bonus kombo naik hingga ×5.', { c: 'c', n: 7 }],
    ['h9', 'h8', '🕸️', 'Reaksi Berantai', 7, { chain: 0.4 }, '', { c: 'h', n: 7 }],
    ['a10', 'a9', '🏙️', 'Klinik 24 Jam', 7, { offCap: 86400, offEff: 1 }, 'Saat game ditutup: hasil sampai 24 jam, efisiensi 100%.', { c: 'a', n: 8 }],
    ['s9', 's7', '🧼', 'Badai Sabun', 7, { feverMult: 5, feverDur: 6 }, 'Mode Demam jadi ×5 selama 14 detik.', { c: 's', n: 6 }]
  ];

  // ---- v6: skill receh (kipas cabang 3+) -------------------------------------
  var RECEH = [
    ['d13', 'd1', '👍', 'Jempol Kuat', 1, { dmgFlat: 1 }], ['d14', 'd1', '🦴', 'Urat Tangan', 1, { dmgPct: 0.05 }],
    ['d15', 'd3', '🤜', 'Buku Jari Keras', 2, { dmgFlat: 3 }], ['d16', 'd3', '🧤', 'Sarung Tangan', 2, { dmgPct: 0.08 }],
    ['d17', 'd5', '⛓️', 'Gelang Besi', 3, { dmgFlat: 6 }], ['d18', 'd5', '🏋️', 'Beban Latihan', 3, { dmgPct: 0.1 }],
    ['d19', 'd4', '🥊', 'Latihan Tinju', 3, { dmgPct: 0.08 }], ['d20', 'd4', '🪨', 'Urat Baja', 3, { dmgFlat: 8 }],
    ['i10', 'i1', '🪙', 'Tips Kecil', 1, { income: 0.08 }], ['i11', 'i1', '💳', 'Kartu Member', 1, { bonus: 0.1 }], ['i12', 'i1', '🏷️', 'Promo Pagi', 2, { income: 0.1 }],
    ['i13', 'i3', '🔁', 'Pelanggan Tetap', 2, { income: 0.1 }], ['i14', 'i3', '📄', 'Brosur', 2, { bonus: 0.15 }],
    ['i15', 'i5', '🖼️', 'Dekor Klinik', 3, { income: 0.12 }], ['i16', 'i5', '😁', 'Poster Senyum', 3, { bonus: 0.2 }],
    ['l13', 'l1', '🪙', 'Koin Keberuntungan', 1, { luck: 0.02 }], ['l14', 'l1', '🐇', 'Kaki Kelinci', 1, { spLuck: 0.02 }], ['l15', 'l1', '📅', 'Tanggal Cantik', 1, { crit: 0.02 }],
    ['l16', 'l2', '🧲', 'Tapal Kuda', 2, { luck: 0.03 }], ['l17', 'l2', '🕯️', 'Lilin Harapan', 2, { spLuck: 0.03 }],
    ['l18', 'l3', '🔍', 'Lensa Jeli', 2, { crit: 0.03 }], ['l19', 'l3', '🎯', 'Jari Gesit', 2, { critMult: 0.15 }],
    ['l20', 'l5', '👁️', 'Mata Tajam', 3, { crit: 0.03 }],
    ['c10', 'c3', '🌬️', 'Napas Teratur', 2, { dmgFlat: 2 }], ['c11', 'c3', '🎵', 'Ritme Tenang', 2, { dmgPct: 0.05 }],
    ['h10', 'h1', '🧼', 'Sabun Wangi', 2, { hard: 0.02 }], ['h11', 'h1', '🪥', 'Sikat Lembut', 2, { hard: 0.03 }],
    ['a11', 'a1', '☕', 'Kopi Pagi', 2, { dpsPct: 0.08 }], ['a12', 'a1', '🪑', 'Kursi Nyaman', 2, { costDisc: 0.03 }]
  ];
  // ---- skill penggabung: terbuka bila SEMUA induk dimiliki; biaya SP + Rp -------
  // [id, [induk...], ikon, nama, SP, Rp, efek, catatan]
  var JOINS = [
    // tingkat A: dua skill receh bersaudara (SP 4 + Rp 2.000)
    ['d21', ['d17', 'd18'], '🏗️', 'Latihan Beban', 4, 2000, { dmgPct: 0.35 }, 'Daya ketuk +35%.'],
    ['d23', ['d15', 'd16'], '🥊', 'Kepalan Ganda', 4, 2000, { dmgFlat: 12, dmgPct: 0.15 }, ''],
    ['i21', ['i15', 'i16'], '⭐', 'Klinik Berbintang', 4, 2000, { incomeMult: 1.4 }, ''],
    ['l21', ['l13', 'l14'], '☘️', 'Jimat Dua Daun', 4, 2000, { luck: 0.08, crit: 0.03 }, ''],
    ['l22', ['l18', 'l19'], '🔭', 'Bidikan Sempurna', 4, 2000, { crit: 0.06, critMult: 0.3 }, ''],
    ['c12', ['c10', 'c11'], '🫁', 'Napas Panjang', 4, 2000, { dmgPct: 0.15, comboMax: 25 }, ''],
    ['h12', ['h10', 'h11'], '🫧', 'Sabun Super', 4, 2000, { hard: 0.06 }, ''],
    ['a13', ['a11', 'a12'], '🛋️', 'Shift Santai', 4, 2000, { dpsPct: 0.25 }, ''],
    // tingkat B: dua skill menengah yang bersebelahan (SP 7 + Rp 15.000)
    ['x1', ['l6', 'l9'], '🎁', 'Rezeki Nomplok', 7, 15000, { jackpot: 0.08, goldTooth: 0.1, spLuck: 0.05 }, ''],
    ['x5', ['h4', 'd10'], '🧨', 'Noda Runtuh', 7, 15000, { hard: 0.1, exec: 5 }, 'Noda sekarat (≤25%) menerima daya ×5.'],
    ['x6', ['a7', 'a8'], '🤖', 'Auto Jagoan', 7, 15000, { tapDps: 0.15, dpsMult: 2 }, ''],
    ['x4', ['s2', 'l20'], '🌟', 'Sapu Emas', 7, 15000, { goldTooth: 0.15, sweep: 2 }, ''],
    ['c13', ['c4', 'c5'], '🌪️', 'Jari Badai', 7, 15000, { dmgPct: 0.3, comboMax: 50 }, ''],
    // tingkat C: dua puncak jalur (SP 10 + Rp 120.000)
    ['d22', ['d9', 'c11'], '☄️', 'Tinju Meteor', 10, 120000, { dmgMult: 3 }, 'Damage bertemu Tempo.'],
    ['x3', ['i6', 'i7'], '🏦', 'Mesin Uang', 10, 120000, { incomeMult: 3, dpsMult: 1.5 }, ''],
    ['x2', ['l10', 's2'], '🎯', 'Teknik Presisi', 10, 120000, { crit: 0.1, critMult: 2, dmgPct: 0.25 }, 'Hoki bertemu Spesial.'],
    // puncak: dua skill gabungan (SP 12 + Rp 500.000)
    ['x7', ['x2', 'x4'], '👑', 'Legenda Gigi Putih', 12, 500000, { dmgMult: 2, incomeMult: 2, luck: 0.2, echo: 0.15 }, 'Puncak pohon.']
  ];
  // jembatan rahasia: empat jalur lain dipindah ke dalam tiga jalur utama, tak terlihat sampai syarat lintas jalur terpenuhi
  var BRIDGE = {
    c1: ['d2', [{ c: 'd', n: 3 }]],
    h1: ['d4', [{ c: 'd', n: 4 }, { c: 'l', n: 2 }]],
    a1: ['i3', [{ c: 'i', n: 3 }]],
    s1: ['l3', null, false] // Sikat Geser: mekanik inti, langsung terbuka setelah Mata Elang
  };
  var TREE = RAW.concat(RECEH).map(function (r) {
    var b = BRIDGE[r[0]], nd = b ? b[1] : (r[7] ? [r[7]] : null), p = b ? b[0] : r[1];
    return { id: r[0], parent: p, parents: p ? [p] : [], icon: r[2], name: r[3], cost: r[4], rp: 0, fx: r[5], note: r[6] || '', cat: r[0].charAt(0), need: nd, sec: b ? b[2] !== false : false, join: false };
  }).concat(JOINS.map(function (j) {
    return { id: j[0], parent: j[1][0], parents: j[1], icon: j[2], name: j[3], cost: j[4], rp: j[5], fx: j[6], note: j[7] || '', cat: j[0].charAt(0), need: null, sec: false, join: true };
  }));
  var NODE = {}, KIDS = {}, TKIDS = {};
  TREE.forEach(function (n) { NODE[n.id] = n; KIDS[n.id] = []; TKIDS[n.id] = []; });
  TREE.forEach(function (n) { n.parents.forEach(function (p) { KIDS[p].push(n.id); }); if (n.parent && !n.join) TKIDS[n.parent].push(n.id); });

  function pct(v) { return String(Math.round(v * 1000) / 10).replace('.', ',') + '%'; }
  function num(v) { return String(v).replace('.', ','); }
  var FXTXT = {
    dmgFlat: function (v) { return '+' + num(v) + ' daya ketuk'; },
    dmgPct: function (v) { return '+' + pct(v) + ' daya ketuk'; },
    dmgMult: function (v) { return 'Daya ketuk ×' + num(v); },
    crit: function (v) { return '+' + pct(v) + ' peluang kritis'; },
    critMult: function (v) { return '+' + num(v) + ' pengali kritis'; },
    luck: function (v) { return '+' + pct(v) + ' hoki'; },
    hard: function (v) { return '−' + pct(v) + ' kekerasan noda'; },
    cd: function (v) { return '−' + pct(v) + ' cooldown ketuk'; },
    income: function (v) { return '+' + pct(v) + ' uang tiap noda hilang'; },
    bonus: function (v) { return '+' + pct(v) + ' bonus gigi bersih'; },
    incomeMult: function (v) { return 'Semua uang ×' + num(v); },
    dpsPct: function (v) { return '+' + pct(v) + ' daya otomatis'; },
    dpsMult: function (v) { return 'Daya otomatis ×' + num(v); },
    costDisc: function (v) { return '−' + pct(v) + ' harga alat'; },
    auto: function (v) { return '+' + num(v) + ' auto-ketuk/dtk'; },
    instant: function (v) { return '+' + pct(v) + ' peluang noda langsung hilang'; },
    spLuck: function (v) { return '+' + pct(v) + ' peluang SP tambahan'; },
    jackpot: function (v) { return '+' + pct(v) + ' peluang noda ×5 uang'; },
    comboMax: function (v) { return '+' + num(v) + ' batas kombo'; },
    tapDps: function (v) { return '+' + pct(v) + ' daya otomatis ke ketukan'; },
    chain: function (v) { return '+' + pct(v) + ' percikan ke noda lain'; },
    sweep: function (v) { return 'Daya sapuan ' + num(v) + ' ketukan'; },
    feverDur: function (v) { return '+' + num(v) + ' dtk Mode Demam'; },
    feverMult: function (v) { return 'Mode Demam ×' + num(v); },
    exec: function (v) { return 'Noda sekarat (≤25%) daya ×' + num(v); },
    echo: function (v) { return '+' + pct(v) + ' peluang pukulan ganda'; },
    goldTooth: function (v) { return '+' + pct(v) + ' peluang Gigi Emas (×4 uang)'; }
  };
  function describe(n) {
    var out = [];
    Object.keys(n.fx).forEach(function (k) { if (FXTXT[k]) out.push(FXTXT[k](n.fx[k])); });
    return { lines: out, note: n.note };
  }

  // tata letak radial: tiap cabang mendapat sudut sesuai jumlah daunnya
  var POS = null;
  function layout() {
    if (POS) return POS;
    var leaves = {};
    // bobot sudut = 1/kedalaman untuk tiap daun, supaya jarak busur antar daun merata (daun dalam butuh sudut lebih kecil)
    (function count(id, dep) {
      var k = TKIDS[id]; if (!k.length) { leaves[id] = 1 / Math.max(1, dep); return leaves[id]; }
      var t = 0; k.forEach(function (c) { t += count(c, dep + 1); }); leaves[id] = t; return t;
    })('r0', 0);
    POS = { r0: { x: 0, y: 0, a: 0, d: 0 } };
    var R = 165;
    (function place(id, a0, a1, depth) {
      var cur = a0, tot = leaves[id];
      TKIDS[id].forEach(function (c) {
        var span = (a1 - a0) * leaves[c] / tot, mid = cur + span / 2, r = (depth + 1) * R;
        POS[c] = { x: Math.cos(mid) * r, y: Math.sin(mid) * r, a: mid, d: depth + 1 };
        place(c, cur, cur + span, depth + 1); cur += span;
      });
    })('r0', -Math.PI / 2, Math.PI * 1.5, 0);
    // longgarkan node yang saling menumpuk (cabang kipas padat di dekat pusat)
    var rid = Object.keys(POS).filter(function (i) { return i !== 'r0'; });
    for (var it = 0; it < 200; it++) {
      var moved = false;
      for (var i = 0; i < rid.length; i++) for (var j = i + 1; j < rid.length; j++) {
        var A = POS[rid[i]], B = POS[rid[j]], dx = B.x - A.x, dy = B.y - A.y, dd = Math.hypot(dx, dy);
        if (dd >= 76) continue;
        if (dd < 0.01) { dx = 1; dy = 0.3; dd = 1.04; }
        var f = (76 - dd) / 2 * 0.5 / dd; A.x -= dx * f; A.y -= dy * f; B.x += dx * f; B.y += dy * f; moved = true;
      }
      if (!moved) break;
    }
    rid.forEach(function (i) { POS[i].a = Math.atan2(POS[i].y, POS[i].x); });
    // node penggabung: di titik tengah induknya, digeser ke ruang kosong terdekat
    TREE.forEach(function (n) {
      if (!n.join) return;
      var sx = 0, sy = 0, dm = 0;
      n.parents.forEach(function (p) { sx += POS[p].x; sy += POS[p].y; dm = Math.max(dm, POS[p].d); });
      sx /= n.parents.length; sy /= n.parents.length;
      var best = null, ol = Math.hypot(sx, sy) || 1; sx += sx / ol * 85; sy += sy / ol * 85;
      for (var rho = 0; rho <= 700 && !best; rho += 24) {
        for (var k = 0; k < 16 && !best; k++) {
          var ang = k * Math.PI / 8 + rho * 0.37, x = sx + Math.cos(ang) * rho, y = sy + Math.sin(ang) * rho, ok = Math.hypot(x, y) > R * 1.5;
          for (var id in POS) { if (ok && Math.hypot(POS[id].x - x, POS[id].y - y) < 80) ok = false; }
          if (ok) best = { x: x, y: y, a: Math.atan2(y, x), d: dm + 1 };
        }
      }
      POS[n.id] = best || { x: sx, y: sy, a: 0, d: dm + 1 };
    });
    return POS;
  }

  // ---------------------------------------------------------------- parameter keseimbangan
  var P = { hp0: 100, hpGrow: 1.18, stainReward: 0.05, toothBonus: 0.025, bossEvery: 10, prestigeAt: 25, luckRange: 15, bossHp: 1.35, bossStains: 8,
    baseDmg: 2, baseCd: 0.30, spExp: 0.8, starOffset: 9, rpScale: 1,
    softCap: 50, askStep: 50, hardCap: 200 }; // softCap: saran Renovasi pertama; hardCap: level maksimum mutlak

  var S, D;
  var T = { clock: 0, nextTap: 0, combo: 0, comboAt: -9, feverUntil: -1, flow: 0, flowAt: -9, autoAcc: 0, clearUntil: -1, buyQty: 1 };
  var fxHook = function () {};
  var G = { onFx: function (t, x, e) { fxHook(t, x, e); }, setFx: function (f) { fxHook = f; } };

  function toothSpec(n) {
    var boss = (n % P.bossEvery) === (P.bossEvery - 1);
    var hp = P.hp0 * Math.pow(P.hpGrow, n) * (boss ? P.bossHp : 1);
    var k = boss ? P.bossStains : Math.min(7, 3 + Math.floor(n / 8));
    return { n: n, boss: boss, k: k, hp: hp, stainReward: hp * P.stainReward * (boss ? 2 : 1), bonus: k * hp * P.toothBonus * (boss ? 4 : 1) };
  }
  function fresh() {
    return { v: 3, money: 0, moneyTotal: 0, teeth: 0, teethTotal: 0, taps: 0, scrubs: 0, crits: 0, stainsCleared: 0,
      tapLv: TAPU.map(function () { return 0; }), gens: GENS.map(function () { return 0; }),
      skills: {}, perm: {}, stars: 0, starsEarned: 0, prestiges: 0, spSpent: 0, spBonus: 0, mega: 0, wave: 0, cur: null,
      tutOff: false, tut: 0, askAt: P.softCap, best: 0, trophies: {}, title: '', started: Date.now(), saved: Date.now(), settings: { vibrate: true } };
  }
  function owned(id) { return !!(S.skills[id] || S.perm[id]); }

  function derive() {
    var d = { dmgFlat: 0, dmgPct: 0, dmgMult: 1, crit: 0, critMult: 1.5, luck: 0, hard: 0, cd: 0, income: 0, bonus: 0, incomeMult: 1,
      dpsPct: 0, dpsMult: 1, costDisc: 0, auto: 0, instant: 0, spLuck: 0, jackpot: 0, comboMax: 50, tapDps: 0, chain: 0, echo: 0, goldTooth: 0, exec: 1,
      sweep: 0, feverDur: 8, feverMult: 2, offCap: 1800, offEff: 0.5,
      fever: false, wave: false, mega: false, overkill: false, combo: false, sweepCrit: false };
    var ADD = { dmgFlat: 1, dmgPct: 1, crit: 1, critMult: 1, luck: 1, hard: 1, cd: 1, income: 1, bonus: 1, dpsPct: 1, costDisc: 1, auto: 1, instant: 1, spLuck: 1, jackpot: 1, comboMax: 1, tapDps: 1, chain: 1, feverDur: 1, echo: 1, goldTooth: 1 };
    var MUL = { dmgMult: 1, dpsMult: 1, incomeMult: 1 };
    var SET = { exec: 1, sweep: 1, feverMult: 1, offCap: 1, offEff: 1 };
    var FLAG = { fever: 1, wave: 1, mega: 1, overkill: 1, combo: 1, sweepCrit: 1 };
    TREE.forEach(function (n) {
      if (!owned(n.id)) return;
      Object.keys(n.fx).forEach(function (k) {
        var v = n.fx[k];
        if (ADD[k]) d[k] += v; else if (MUL[k]) d[k] *= v; else if (SET[k]) d[k] = Math.max(d[k], v); else if (FLAG[k]) d[k] = true;
      });
    });
    d.critChance = Math.min(0.75, d.crit + d.luck * 0.5);
    d.critMulti = 2.5 + d.critMult - 1.5;           // dasar ×2,5; skill menambah
    d.hardF = Math.max(0.4, 1 - d.hard);
    d.cdSec = Math.max(0.07, P.baseCd * (1 - Math.min(0.75, d.cd)));
    d.instChance = d.instant > 0 ? Math.min(0.4, d.instant + d.luck * 0.2) : 0;
    d.spChance = Math.min(0.5, d.spLuck + d.luck * 0.2);
    d.jackChance = d.jackpot > 0 ? Math.min(0.5, d.jackpot + d.luck * 0.15) : 0;
    d.cost = Math.max(0.4, 1 - d.costDisc);
    d.echoChance = d.echo > 0 ? Math.min(0.4, d.echo + d.luck * 0.2) : 0;
    d.goldChance = d.goldTooth > 0 ? Math.min(0.5, d.goldTooth + d.luck * 0.15) : 0;
    d.dpsF = (1 + d.dpsPct) * d.dpsMult;
    return d;
  }

  // ---------------------------------------------------------------- rumus
  function mult(n, miles) { var m = 1; for (var i = 0; i < miles.length; i++) if (n >= miles[i]) m *= (i === miles.length - 1 ? 3 : 2); return m; }
  function tapBaseDamage() {
    var b = P.baseDmg + D.dmgFlat;
    for (var i = 0; i < TAPU.length; i++) b += S.tapLv[i] * TAPU[i].add * mult(S.tapLv[i], TAP_MILES);
    return b;
  }
  function genDps(i) { return S.gens[i] * GENS[i].dps * mult(S.gens[i], GEN_MILES); }
  function dps() { var t = 0; for (var i = 0; i < GENS.length; i++) t += genDps(i); return t * D.dpsF; }
  function feverOn() { return T.clock < T.feverUntil; }
  function comboMult() { return D.combo ? 1 + Math.min(T.combo, D.comboMax) * 0.02 : 1; }
  function tapDamage() {
    var b = tapBaseDamage() * (1 + D.dmgPct) * D.dmgMult;
    b += D.tapDps * dps();
    b *= comboMult();
    if (feverOn()) b *= D.feverMult;
    return b;
  }
  function item(kind, i) { return kind === 'tap' ? TAPU[i] : GENS[i]; }
  function lvl(kind, i) { return kind === 'tap' ? S.tapLv[i] : S.gens[i]; }
  function itemMax(kind) { return kind === 'tap' ? TAP_MAX : GEN_MAX; }
  function room(kind, i) { return Math.max(0, itemMax(kind) - lvl(kind, i)); }
  function itemCost(kind, i, qty) {
    if (qty < 1 || qty > room(kind, i)) return Infinity;
    var it = item(kind, i), n = lvl(kind, i);
    return it.base * D.cost * Math.pow(it.rate, n) * (Math.pow(it.rate, qty) - 1) / (it.rate - 1);
  }
  function maxQty(kind, i) { var q = 0; while (q < 1000 && itemCost(kind, i, q + 1) <= S.money) q++; return q; }
  function isUnlocked(kind, i) { var it = item(kind, i); return lvl(kind, i) > 0 || S.moneyTotal >= it.base * 0.5 || S.money >= itemCost(kind, i, 1); }

  function spRun() { return Math.floor(Math.pow(S.teeth, P.spExp) + 1e-9); }
  function spEarned() { return spRun() + S.spBonus; }
  function spAvail() { return spEarned() - S.spSpent; }
  function spNextTooth() { return Math.ceil(Math.pow(spRun() + 1, 1 / P.spExp) - 1e-9); }
  // bintang naik sebagai akar kuadrat kedalaman: 25 gigi = 4, 40 = 5, 60 = 7, 100 = 9, 130 = 11
  function starsGain() { return S.teeth >= P.prestigeAt ? Math.floor(Math.sqrt(S.teeth - P.starOffset)) : 0; }
  function stainMoney(spec) { return spec.stainReward * (1 + D.income) * D.incomeMult; }
  function toothMoney(spec) { return spec.bonus * (1 + D.income + D.bonus) * D.incomeMult; }
  function moneyPerDamage() {
    var sp = toothSpec(S.teeth);
    return (stainMoney(sp) * sp.k + toothMoney(sp)) / (sp.hp * D.hardF * sp.k);
  }

  function addMoney(x) { S.money += x; S.moneyTotal += x; }

  // ---------------------------------------------------------------- gigi & noda
  // jenis noda (darah): lembek (s), biasa (n), keras (h). Awal permainan banyak yang lembek sebagai penolong.
  var KIND = { s: { hp: 0.6, rw: 0.8 }, n: { hp: 1, rw: 1 }, h: { hp: 2.2, rw: 2.6 } };
  function pickKind(n) {
    if (n === 0) return 's';
    var w = n < 15 ? [0.55, 0.40] : n < 50 ? [0.25, 0.50] : [0.15, 0.40], r = Math.random();
    return r < w[0] ? 's' : r < w[0] + w[1] ? 'n' : 'h';
  }
  function newTooth() {
    var nn = Math.min(S.teeth, P.hardCap - 1), spec = toothSpec(nn), idx = SPOTS.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    idx = idx.slice(0, spec.k);
    S.cur = { n: nn, boss: spec.boss, hard: D.hardF, stains: idx.map(function (p) {
      var k = pickKind(nn), hp = spec.hp * KIND[k].hp * D.hardF; return { p: p, k: k, hp: hp, max: hp };
    }) };
    T.clearUntil = -1;
  }
  // kekerasan noda berubah (skill dibeli): skala ulang nyawa noda yang ada
  function applyHardness() {
    if (!S.cur) return;
    var r = D.hardF / (S.cur.hard || 1);
    if (Math.abs(r - 1) < 1e-9) return;
    S.cur.stains.forEach(function (s) { s.hp *= r; s.max *= r; });
    S.cur.hard = D.hardF;
  }
  function weakest(excl) {
    var best = -1, bh = Infinity, st = S.cur.stains;
    for (var i = 0; i < st.length; i++) if (i !== excl && st[i].hp > 0 && st[i].hp < bh) { bh = st[i].hp; best = i; }
    return best;
  }
  function remainingHp() { var t = 0; S.cur.stains.forEach(function (s) { if (s.hp > 0) t += s.hp; }); return t; }
  function totalHp() { var t = 0; S.cur.stains.forEach(function (s) { t += s.max; }); return t; }
  function progress() { var tot = totalHp(); return tot > 0 ? 1 - remainingHp() / tot : 0; }

  function completeTooth() {
    var sp = toothSpec(S.cur.n), before = spEarned(), b = toothMoney(sp), gold = false;
    if (D.goldChance > 0 && Math.random() < D.goldChance) { b *= 4; gold = true; }
    addMoney(b);
    if (S.teeth < P.hardCap) S.teeth++;
    S.teethTotal++; S.best = Math.max(S.best || 0, S.teeth);
    var lucky = false;
    if (D.spChance > 0 && Math.random() < D.spChance) { S.spBonus++; lucky = true; }
    var gained = spEarned() - before;
    T.clearUntil = T.clock + 0.75;
    G.onFx('clean', (gold ? '🪙 Gigi Emas! ' : '✨ ') + (sp.boss ? 'Geraham bersih!' : 'Gigi bersih!') + ' +Rp ' + fmt(b) + (gained > 0 ? '  +' + gained + ' SP' : '') + (lucky ? ' 🍀' : ''), { sp: gained, bonus: b, lucky: lucky });
    if (S.teeth >= S.askAt) {
      var capHit = S.teeth >= P.hardCap;
      S.askAt = capHit ? 1e9 : S.askAt + P.askStep;
      G.onFx('limit', '', { level: S.teeth, cap: capHit, gain: starsGain() });
    }
    checkTrophies();
  }
  function damageStain(i, dmg) {
    var s = S.cur.stains[i];
    if (!s || s.hp <= 0 || T.clearUntil >= 0) return dmg;
    var used = Math.min(dmg, s.hp);
    s.hp -= used;
    if (s.hp <= 1e-9) {
      s.hp = 0; S.stainsCleared++;
      var sp = toothSpec(S.cur.n), m = stainMoney(sp) * (KIND[s.k] || KIND.n).rw, jack = false;
      if (D.jackChance > 0 && Math.random() < D.jackChance) { m *= 5; jack = true; }
      addMoney(m);
      G.onFx(jack ? 'jackpot' : 'stainGone', (jack ? '🎰 ' : '+') + 'Rp ' + fmt(m), { i: i, money: m });
      if (S.cur.stains.every(function (x) { return x.hp <= 0; })) completeTooth();
    }
    return dmg - used;
  }
  function spread(dmg) {
    var guard = 0;
    while (dmg > 1e-9 && guard++ < 30 && T.clearUntil < 0) { var i = weakest(); if (i < 0) break; dmg = damageStain(i, dmg); }
  }

  // ---------------------------------------------------------------- aksi
  function luckyClear(i, dmg) {
    if (D.instChance <= 0) return false;
    var st = S.cur.stains[i];
    if (!st || st.hp > dmg * P.luckRange) return false;
    return Math.random() < D.instChance * (S.cur.boss ? 0.25 : 1);
  }
  function afterHit(i, dealt, over) {
    if (D.overkill && over > 1e-9) spread(over);
    if (D.chain > 0 && T.clearUntil < 0) { var j = weakest(i); if (j >= 0) damageStain(j, dealt * D.chain); }
  }
  function boost(i, dmg) {
    var st = S.cur.stains[i];
    if (st && D.exec > 1 && st.hp <= st.max * 0.25) dmg *= D.exec;
    if (D.echoChance > 0 && Math.random() < D.echoChance) dmg *= 2;
    return dmg;
  }
  // kembalikan -1 bila ketukan ditolak karena cooldown
  function doTap(i, auto, pos) {
    if (T.clearUntil >= 0) return 0;
    if (!auto) { if (T.clock + 1e-9 < T.nextTap) return -1; T.nextTap = T.clock + D.cdSec; }
    if (i === undefined || i < 0) i = weakest();
    if (i < 0) return 0;
    if (D.combo && !auto) { T.combo = (T.clock - T.comboAt <= 0.8) ? T.combo + 1 : 1; T.comboAt = T.clock; }
    var dmg = tapDamage(), tag = 'tap';
    S.taps++;
    if (!auto && D.critChance > 0 && Math.random() < D.critChance) { dmg *= D.critMulti; tag = 'crit'; S.crits++; }
    if (D.mega) { S.mega++; if (S.mega >= 50) { S.mega = 0; dmg *= 25; tag = 'mega'; } }
    dmg = boost(i, dmg);
    if (!auto && luckyClear(i, dmg)) { dmg = Math.max(dmg, S.cur.stains[i].hp); tag = 'instant'; }
    var over = damageStain(i, dmg);
    G.onFx(tag, tag === 'instant' ? '🍀 Hoki!' : fmt(dmg - over), { i: i, pos: pos, auto: !!auto });
    afterHit(i, dmg - over, over);
    return dmg - over;
  }
  function doScrub(i, pos) {
    if (!D.sweep || T.clearUntil >= 0) return 0;
    var dmg = tapDamage() * D.sweep, tag = 'sweep';
    S.scrubs++;
    if (D.sweepCrit) {
      if (Math.random() < D.critChance) { dmg *= D.critMulti; tag = 'crit'; S.crits++; }
      if (D.mega) { S.mega++; if (S.mega >= 50) { S.mega = 0; dmg *= 25; tag = 'mega'; } }
    }
    dmg = boost(i, dmg);
    if (luckyClear(i, dmg)) { dmg = Math.max(dmg, S.cur.stains[i].hp); tag = 'instant'; }
    var over = damageStain(i, dmg);
    G.onFx(tag, tag === 'instant' ? '🍀 Hoki!' : fmt(dmg - over), { i: i, pos: pos });
    if (D.fever) {
      T.flow = (T.clock - T.flowAt <= 1.2) ? T.flow + 1 : 1; T.flowAt = T.clock;
      if (T.flow >= 10 && !feverOn()) { T.feverUntil = T.clock + D.feverDur; T.flow = 0; G.onFx('fever', '🔥 Mode Demam ×' + D.feverMult + '!'); }
    }
    if (D.wave) { S.wave++; if (S.wave >= 25) { S.wave = 0; var w = dps() * 20; if (w > 0) { spread(w); G.onFx('wave', '🫧 Gelombang!'); } } }
    afterHit(i, dmg - over, over);
    return dmg - over;
  }

  function buyItem(kind, i, qty) {
    var q = qty === 'max' ? maxQty(kind, i) : Math.min(qty, room(kind, i));
    if (q < 1) return false;
    var c = itemCost(kind, i, q);
    if (S.money < c) return false;
    S.money -= c;
    if (kind === 'tap') S.tapLv[i] += q; else S.gens[i] += q;
    return true;
  }

  // ---------------------------------------------------------------- pohon: beli, permanen, tampil
  function parentOwned(id) { return NODE[id].parents.every(owned); }
  function rpOf(n) { return n.rp ? Math.round(n.rp * P.rpScale) : 0; }
  function hasOwnedBelow(id) { return KIDS[id].some(function (c) { return owned(c) || hasOwnedBelow(c); }); }
  // tampil: dimiliki, atau induknya dimiliki (bisa dibeli), atau leluhur dari node yang dimiliki (jalur)
  function visible(id) { return owned(id) || parentOwned(id) && (NODE[id].parent !== null || true) || hasOwnedBelow(id); }
  function countCat(c) { var k = 0; TREE.forEach(function (t) { if (t.cat === c && t.id !== 'r0' && owned(t.id)) k++; }); return k; }
  function needGap(n) { return (n.need || []).reduce(function (a, q) { return a + Math.max(0, q.n - countCat(q.c)); }, 0); }
  function needMet(n) { return !n.need || n.need.every(function (q) { return countCat(q.c) >= q.n; }); }
  function nodeState(id) {
    if (S.perm[id]) return 'perm';
    if (S.skills[id]) return 'owned';
    if (parentOwned(id)) return needMet(NODE[id]) ? 'open' : (NODE[id].sec && needGap(NODE[id]) > 1 ? 'hidden' : 'locked');
    if (NODE[id].join && NODE[id].parents.some(owned)) return 'ghost';
    if (hasOwnedBelow(id)) return 'ghost';
    return 'hidden';
  }
  function canBuySkill(id) { var n = NODE[id]; return !!n && !owned(id) && parentOwned(id) && needMet(n) && spAvail() >= n.cost && S.money >= rpOf(n); }
  function availableSkills() {
    var n = 0;
    TREE.forEach(function (t) { if (canBuySkill(t.id)) n++; });
    return n;
  }
  function afterTreeChange() { D = derive(); applyHardness(); }
  function buySkill(id) {
    if (!canBuySkill(id)) return false;
    S.skills[id] = 1; S.spSpent += NODE[id].cost; S.money -= rpOf(NODE[id]); afterTreeChange();
    return true;
  }
  // 1 bintang = 1 skill permanen (menggantikan biaya SP berapa pun). Skill yang dibeli dengan SP dijadikan permanen & SP-nya dikembalikan.
  function canMakePerm(id) {
    var n = NODE[id]; if (!n || S.perm[id] || S.stars < 1) return false;
    return !!S.skills[id] || (parentOwned(id) && needMet(n));
  }
  function allPerm() { return TREE.every(function (n) { return !!S.perm[n.id]; }); }
  // ---------------------------------------------------------------- kode developer (uji kondisi akhir)
  // Format mirip NIK:  SY - TTT II - S A - DDMMYY - XXXX
  //   TTT = level gigi (001-200), II = level semua alat (00-50), S = semua skill permanen (0/1),
  //   A = semua pencapaian (0/1, otomatis ikut S), DDMMYY = tanggal pembuatan, XXXX = tanda tangan 4 huruf.
  // Buat kodenya lewat kode-dev.html. Catatan: ini game sisi-klien, jadi hanya penghalang tebak-tebakan, bukan keamanan sungguhan.
  var DEV_SALT = 'ShimaYuu~Kilaw~2026', DEV_ALPHA = 'BCDFGHJKLMNPQRSTVWXZ';
  function devSig(body) {
    var h = 2166136261, s = DEV_SALT + body + DEV_SALT, out = '';
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    for (var k = 0; k < 4; k++) { out += DEV_ALPHA.charAt(h % 20); h = Math.floor(h / 20); }
    return out;
  }
  function pad0(n, w) { return ('000000' + n).slice(-w); }
  function makeDevCode(o) {
    o = o || {};
    var t = Math.max(0, Math.min(P.hardCap, Math.floor(+o.teeth || 0))), it = Math.max(0, Math.min(50, Math.floor(+o.items || 0)));
    var sk = (o.skills || o.achv) ? 1 : 0, ac = o.achv ? 1 : 0, d = new Date(), dt = String(o.date || pad0(d.getDate(), 2) + pad0(d.getMonth() + 1, 2) + pad0(d.getFullYear() % 100, 2)).replace(/\D/g, '').slice(0, 6);
    var body = 'SY' + pad0(t, 3) + pad0(it, 2) + sk + ac + pad0(dt, 6);
    return body.slice(0, 2) + '-' + body.slice(2, 7) + '-' + body.slice(7, 9) + '-' + body.slice(9) + '-' + devSig(body);
  }
  function devCode(txt) {
    var s = String(txt).toUpperCase().replace(/[^A-Z0-9]/g, '');
    var m = /^SY(\d{3})(\d{2})([01])([01])(\d{2})(\d{2})(\d{2})([A-Z]{4})$/.exec(s);
    if (!m || devSig(s.slice(0, 15)) !== m[8]) return null;
    var t = +m[1], it = +m[2], sk = m[3] === '1', ac = m[4] === '1';
    if (t > P.hardCap || it > 50 || +m[5] < 1 || +m[5] > 31 || +m[6] < 1 || +m[6] > 12) return null;
    if (t > 0) { S.teeth = t; S.best = Math.max(S.best || 0, t); S.askAt = t >= P.hardCap ? 1e9 : Math.max(P.softCap, (Math.floor(t / P.askStep) + 1) * P.askStep); }
    if (it > 0) { S.tapLv = TAPU.map(function () { return Math.min(TAP_MAX, it); }); S.gens = GENS.map(function () { return Math.min(GEN_MAX, it); }); }
    if (sk || ac) { TREE.forEach(function (n) { S.perm[n.id] = 1; }); S.skills = {}; S.spSpent = 0; }
    if (ac) {
      S.best = Math.max(S.best || 0, P.hardCap); S.teethTotal = Math.max(S.teethTotal, 1000); S.crits = Math.max(S.crits, 500);
      S.stainsCleared = Math.max(S.stainsCleared, 5000); S.moneyTotal = Math.max(S.moneyTotal, 1e12); S.prestiges = Math.max(S.prestiges, 10);
    }
    S.cur = null; D = derive(); ensureTooth(); applyHardness(); checkTrophies(true); save();
    return { teeth: t, items: it, skills: sk || ac, achv: ac };
  }
  // ---------------------------------------------------------------- trofi & gelar
  var TROPHIES = [
    { id: 't1', icon: '🦷', name: 'Gigi Pertama', desc: 'Bersihkan 1 gigi.', title: 'Magang', ok: function () { return S.teethTotal >= 1; } },
    { id: 't2', icon: '🧽', name: 'Seratus Gigi', desc: 'Bersihkan 100 gigi sepanjang masa.', title: 'Asisten Dokter', ok: function () { return S.teethTotal >= 100; } },
    { id: 't3', icon: '🏥', name: 'Seribu Gigi', desc: 'Bersihkan 1.000 gigi sepanjang masa.', title: 'Dokter Gigi', ok: function () { return S.teethTotal >= 1000; } },
    { id: 't4', icon: '🎯', name: 'Gigi ke-25', desc: 'Capai gigi ke-25 dalam satu putaran.', title: '', ok: function () { return S.best >= 25; } },
    { id: 't5', icon: '🏅', name: 'Gigi ke-50', desc: 'Capai gigi ke-50 dalam satu putaran.', title: 'Spesialis', ok: function () { return S.best >= 50; } },
    { id: 't6', icon: '🥇', name: 'Gigi ke-100', desc: 'Capai gigi ke-100 dalam satu putaran.', title: 'Konsultan', ok: function () { return S.best >= 100; } },
    { id: 't7', icon: '👑', name: 'Level Maksimum', desc: 'Capai gigi ke-' + P.hardCap + '.', title: 'Dokter Legendaris', ok: function () { return S.best >= P.hardCap; } },
    { id: 't8', icon: '🏗️', name: 'Renovasi Pertama', desc: 'Lakukan 1 kali Renovasi.', title: 'Pembaru', ok: function () { return S.prestiges >= 1; } },
    { id: 't9', icon: '🏛️', name: 'Lima Renovasi', desc: 'Lakukan 5 kali Renovasi.', title: 'Arsitek Klinik', ok: function () { return S.prestiges >= 5; } },
    { id: 't10', icon: '🌆', name: 'Sepuluh Renovasi', desc: 'Lakukan 10 kali Renovasi.', title: 'Maestro Renovasi', ok: function () { return S.prestiges >= 10; } },
    { id: 't11', icon: '💥', name: 'Kritis 500×', desc: 'Dapatkan 500 ketukan kritis.', title: 'Tangan Dingin', ok: function () { return S.crits >= 500; } },
    { id: 't12', icon: '🧼', name: 'Pemburu Noda', desc: 'Bersihkan 5.000 noda.', title: 'Pemburu Noda', ok: function () { return S.stainsCleared >= 5000; } },
    { id: 't13', icon: '💰', name: 'Triliuner', desc: 'Kumpulkan Rp 1T sepanjang masa.', title: 'Konglomerat', ok: function () { return S.moneyTotal >= 1e12; } },
    { id: 't14', icon: '⭐', name: 'Separuh Jalan', desc: 'Jadikan separuh skill permanen.', title: 'Penjelajah Skill', ok: function () { return Object.keys(S.perm).length >= TREE.length / 2; } },
    { id: 't15', icon: '🏆', name: 'Semua Skill Permanen', desc: 'Jadikan semua skill permanen.', title: 'Legenda Gigi Putih', ok: function () { return allPerm(); } },
    { id: 't16', icon: '🌸', name: 'Tamat Sejati', desc: 'Pencapaian rahasia.', title: 'Penjaga Senyum', secret: true, ok: function () { return TROPHIES.every(function (q) { return q.id === 't16' || !!S.trophies[q.id]; }); } }
  ];
  var TIER_PTS = { bronze: 10, silver: 25, gold: 50, platinum: 100 };
  var TIER_NAME = { bronze: 'Perunggu', silver: 'Perak', gold: 'Emas', platinum: 'Platinum' };
  var ACH_CATS = [['journey', 'Perjalanan'], ['level', 'Level'], ['reno', 'Renovasi'], ['skill', 'Skill'], ['secret', 'Rahasia']];
  var META = {
    t1: ['journey', 'bronze', function () { return S.teethTotal; }, 1],
    t2: ['journey', 'bronze', function () { return S.teethTotal; }, 100],
    t3: ['journey', 'silver', function () { return S.teethTotal; }, 1000],
    t11: ['journey', 'bronze', function () { return S.crits; }, 500],
    t12: ['journey', 'silver', function () { return S.stainsCleared; }, 5000],
    t13: ['journey', 'gold', function () { return S.moneyTotal; }, 1e12],
    t4: ['level', 'bronze', function () { return S.best; }, 25],
    t5: ['level', 'silver', function () { return S.best; }, 50],
    t6: ['level', 'gold', function () { return S.best; }, 100],
    t7: ['level', 'gold', function () { return S.best; }, P.hardCap],
    t8: ['reno', 'bronze', function () { return S.prestiges; }, 1],
    t9: ['reno', 'silver', function () { return S.prestiges; }, 5],
    t10: ['reno', 'gold', function () { return S.prestiges; }, 10],
    t14: ['skill', 'silver', function () { return Object.keys(S.perm).length; }, Math.ceil(TREE.length / 2)],
    t15: ['skill', 'platinum', function () { return Object.keys(S.perm).length; }, TREE.length],
    t16: ['secret', 'platinum', function () { return S.trophies.t16 ? 1 : 0; }, 1]
  };
  TROPHIES.forEach(function (t) { var m = META[t.id]; t.cat = m[0]; t.tier = m[1]; t.cur = m[2]; t.goal = m[3]; t.pts = TIER_PTS[m[1]]; });
  function achvPoints() { var g = 0, all = 0; TROPHIES.forEach(function (t) { all += t.pts; if (S.trophies[t.id]) g += t.pts; }); return { got: g, all: all }; }
  function checkTrophies(silent) {
    if (!S.trophies) S.trophies = {};
    var again = true;
    while (again) {
      again = false;
      TROPHIES.forEach(function (t) {
        if (S.trophies[t.id] || !t.ok()) return;
        S.trophies[t.id] = Date.now(); again = true;
        if (!silent) G.onFx('trophy', '🏆 Trofi: ' + t.name + (t.title ? ' · gelar “' + t.title + '”' : ''), { id: t.id });
      });
    }
  }
  function titleNow() {
    var pick = '', chosen = '';
    TROPHIES.forEach(function (t) { if (S.trophies[t.id] && t.title) { pick = t.title; if (t.id === S.title) chosen = t.title; } });
    return chosen || pick || 'Calon Dokter';
  }
  function setTitle(id) { if (!id || (S.trophies[id] && TROPHIES.some(function (t) { return t.id === id && t.title; }))) { S.title = id || ''; return true; } return false; }
  function makePerm(id) {
    if (!canMakePerm(id)) return false;
    S.stars -= 1;
    if (S.skills[id]) { delete S.skills[id]; S.spSpent = Math.max(0, S.spSpent - NODE[id].cost); }
    S.perm[id] = 1; afterTreeChange();
    checkTrophies();
    return true;
  }
  function prestige() {
    var g = starsGain(); if (g < 1) return false;
    var f = fresh();
    f.perm = S.perm; f.stars = S.stars + g; f.starsEarned = S.starsEarned + g; f.prestiges = S.prestiges + 1;
    f.teethTotal = S.teethTotal; f.moneyTotal = S.moneyTotal; f.started = S.started; f.settings = S.settings; f.crits = S.crits;
    f.stainsCleared = S.stainsCleared; f.tutOff = S.tutOff; f.tut = S.tut; f.best = S.best; f.trophies = S.trophies; f.title = S.title;
    S = f; D = derive(); T.combo = 0; T.feverUntil = -1; T.nextTap = 0; newTooth(); checkTrophies();
    return true;
  }
  function offlineGain(sec) {
    var capped = Math.min(sec, D.offCap), gain = dps() * capped * D.offEff * moneyPerDamage();
    if (gain > 0) addMoney(gain);
    return { gain: gain, secs: capped, full: sec };
  }

  function step(dt) {
    T.clock += dt;
    if (T.clearUntil >= 0 && T.clock >= T.clearUntil) { newTooth(); G.onFx('newTooth', ''); }
    if (T.clearUntil < 0) {
      var p = dps();
      if (p > 0) spread(p * dt);
      if (D.auto) {
        T.autoAcc += dt * D.auto; var n = 0;
        while (T.autoAcc >= 1 && n < 20 && T.clearUntil < 0) { T.autoAcc -= 1; doTap(undefined, true); n++; }
        if (T.autoAcc > 20) T.autoAcc = 0;
      }
    }
    if (T.combo && T.clock - T.comboAt > 0.8) T.combo = 0;
  }
  function sync(t) { if (t > T.clock) T.clock = t; }

  // ---------------------------------------------------------------- simpan
  function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1000) return String(n < 100 ? +n.toFixed(1) : Math.floor(n));
    var u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'], e = Math.floor(Math.log10(n) / 3);
    if (e >= u.length) return n.toExponential(2).replace('+', '');
    var v = n / Math.pow(1000, e);
    return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)) + u[e];
  }
  function normalize(o) {
    if (!o || typeof o !== 'object' || o.v !== 3) throw new Error('Format simpanan tidak dikenal.');
    var f = fresh();
    for (var k in f) if (o[k] !== undefined) f[k] = o[k];
    ['money', 'moneyTotal', 'teeth', 'teethTotal', 'taps', 'scrubs', 'crits', 'stainsCleared', 'stars', 'starsEarned', 'prestiges', 'spSpent', 'spBonus', 'mega', 'wave', 'best'].forEach(function (k) {
      f[k] = isFinite(+f[k]) && +f[k] >= 0 ? +f[k] : 0;
    });
    f.tapLv = TAPU.map(function (_, i) { return Math.min(TAP_MAX, Math.max(0, Math.floor(+(o.tapLv && o.tapLv[i]) || 0))); });
    f.gens = GENS.map(function (_, i) { return Math.min(GEN_MAX, Math.max(0, Math.floor(+(o.gens && o.gens[i]) || 0))); });
    f.teeth = Math.min(f.teeth, P.hardCap); f.best = Math.max(f.best, f.teeth);
    var tr = {}; TROPHIES.forEach(function (t) { if (o.trophies && +o.trophies[t.id] > 0) tr[t.id] = +o.trophies[t.id]; });
    f.trophies = tr; f.title = TROPHIES.some(function (t) { return t.id === o.title && tr[t.id]; }) ? o.title : '';
    f.tut = o.tut === undefined ? ((f.teethTotal >= 5 || f.prestiges > 0) ? 99 : 0) : Math.max(0, Math.floor(+o.tut || 0));
    f.askAt = +o.askAt > 0 ? Math.min(+o.askAt, 1e9) : (f.teeth >= P.hardCap ? 1e9 : Math.max(P.softCap, (Math.floor(f.teeth / P.askStep) + 1) * P.askStep));
    var sk = {}, pm = {};
    TREE.forEach(function (n) { if (o.skills && o.skills[n.id]) sk[n.id] = 1; if (o.perm && o.perm[n.id]) pm[n.id] = 1; });
    f.skills = sk; f.perm = pm; f.tutOff = !!o.tutOff;
    f.settings = { vibrate: !(o.settings && o.settings.vibrate === false) };
    var cur = o.cur;
    if (cur && Array.isArray(cur.stains) && cur.stains.length) {
      f.cur = { n: Math.max(0, Math.floor(+cur.n || 0)), boss: !!cur.boss, hard: +cur.hard > 0 ? +cur.hard : 1, stains: cur.stains.slice(0, 9).map(function (s) {
        var mx = Math.max(1e-6, +s.max || 1); return { p: Math.max(0, Math.min(8, Math.floor(+s.p || 0))), k: (s.k === 's' || s.k === 'h') ? s.k : 'n', max: mx, hp: Math.max(0, Math.min(mx, +s.hp || 0)) };
      }) };
    } else f.cur = null;
    return f;
  }
  function save() { S.saved = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* abaikan */ } }
  function load() { try { var raw = localStorage.getItem(KEY); return raw ? normalize(JSON.parse(raw)) : null; } catch (e) { return null; } }
  function exportCode() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
  function ensureTooth() { if (!S.cur || S.cur.stains.every(function (s) { return s.hp <= 0; })) newTooth(); }
  function importCode(code) { code = String(code).trim(); S = normalize(JSON.parse(decodeURIComponent(escape(atob(code))))); D = derive(); ensureTooth(); applyHardness(); checkTrophies(true); save(); }
  function init() { S = load() || fresh(); D = derive(); ensureTooth(); applyHardness(); checkTrophies(true); }
  function reset() { S = fresh(); D = derive(); newTooth(); save(); }

  root.KGCore = {
    SPOTS: SPOTS, TAPU: TAPU, GENS: GENS, TREE: TREE, NODE: NODE, KIDS: KIDS, CAT: CAT, CAT_NAME: CAT_NAME, P: P, TAP_MILES: TAP_MILES, GEN_MILES: GEN_MILES,
    T: T, G: G, KIND: KIND, itemMax: itemMax, room: room, allPerm: allPerm, TROPHIES: TROPHIES, devCode: devCode, makeDevCode: makeDevCode, ACH_CATS: ACH_CATS, TIER_NAME: TIER_NAME, achvPoints: achvPoints, titleNow: titleNow, setTitle: setTitle, get S() { return S; }, get D() { return D; },
    init: init, reset: reset, save: save, exportCode: exportCode, importCode: importCode, fmt: fmt, step: step, sync: sync,
    doTap: doTap, doScrub: doScrub, buyItem: buyItem, itemCost: itemCost, maxQty: maxQty, lvl: lvl, item: item, isUnlocked: isUnlocked,
    owned: owned, rpOf: rpOf, countCat: countCat, nodeState: nodeState, availableSkills: availableSkills, canBuySkill: canBuySkill, buySkill: buySkill, canMakePerm: canMakePerm, makePerm: makePerm, describe: describe, layout: layout,
    spAvail: spAvail, spEarned: spEarned, spNextTooth: spNextTooth, spRun: spRun, starsGain: starsGain, prestige: prestige, offlineGain: offlineGain,
    dps: dps, tapDamage: tapDamage, tapBaseDamage: tapBaseDamage, genDps: genDps, mult: mult, toothSpec: toothSpec, spec: function () { return toothSpec(S.cur.n); },
    progress: progress, remainingHp: remainingHp, totalHp: totalHp, weakest: weakest, feverOn: feverOn, comboMult: comboMult, moneyPerDamage: moneyPerDamage,
    derive: function () { D = derive(); applyHardness(); return D; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
