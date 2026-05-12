import { PrismaClient, ServiceCategory, BadgeType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // GAMES
  const dsr = await prisma.game.upsert({
    where: { slug: "dark-souls-remastered" },
    update: {},
    create: {
      name: "Dark Souls Remastered",
      slug: "dark-souls-remastered",
      description:
        "Edisi remaster dari Dark Souls klasik dengan visual yang diperbarui.",
      note: "Kesulitan relatif lebih rendah dibanding DS3/ER — harga lebih terjangkau, cocok sebagai entry point.",
      pillBg: "#EEEDFE",
      pillColor: "#3C3489",
      sortOrder: 1,
    },
  });

  const ds2 = await prisma.game.upsert({
    where: { slug: "dark-souls-2" },
    update: {},
    create: {
      name: "Dark Souls 2: Scholar of the First Sin",
      slug: "dark-souls-2",
      description:
        "Seri kedua dengan jumlah boss terbanyak di seluruh seri Souls.",
      note: "Boss paling banyak di seri Souls — paket bundle all boss jadi daya tarik utama.",
      pillBg: "#FAECE7",
      pillColor: "#712B13",
      sortOrder: 2,
    },
  });

  const ds3 = await prisma.game.upsert({
    where: { slug: "dark-souls-3" },
    update: {},
    create: {
      name: "Dark Souls 3 + DLC",
      slug: "dark-souls-3",
      description:
        "Game paling populer di seri — grafis terbaik, boss paling ikonik.",
      note: "Game paling populer di seri — demand tertinggi, terutama Nameless King dan boss DLC.",
      pillBg: "#E6F1FB",
      pillColor: "#0C447C",
      sortOrder: 3,
    },
  });

  const er = await prisma.game.upsert({
    where: { slug: "elden-ring" },
    update: {},
    create: {
      name: "Elden Ring + Shadow of the Erdtree",
      slug: "elden-ring",
      description:
        "Open world Soulslike terluas — kolaborasi FromSoftware dan George R.R. Martin.",
      note: "Game terluas dan terbaru — harga tertinggi karena kompleksitas dan waktu pengerjaan lebih lama.",
      pillBg: "#FAEEDA",
      pillColor: "#633806",
      sortOrder: 4,
    },
  });

  const bmw = await prisma.game.upsert({
    where: { slug: "black-myth-wukong" },
    update: {},
    create: {
      name: "Black Myth: Wukong",
      slug: "black-myth-wukong",
      description:
        "Action RPG berbasis mitologi Tiongkok dengan visual AAA memukau.",
      note: "Game terbaru dengan hype tinggi — tidak ada co-op, joki butuh akses akun lebih dalam.",
      pillBg: "#E1F5EE",
      pillColor: "#085041",
      sortOrder: 5,
    },
  });

  console.log("✓ Games seeded");

  // SERVICES — DSR
  const dsrServices = [
    // Boss Fight
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Per boss (story)",
      detail: "Sif, O&S, Seath, 4 Kings, Gwyn, dll",
      priceUnit: 15000,
      priceBundle: 79000,
      priceBundleLabel: "Hemat 47%",
      estimateMin: 30,
      estimateMax: 90,
      badge: BadgeType.SAVE,
      sortOrder: 1,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Boss DLC (Manus, Kalameet)",
      detail: "Artorias of the Abyss",
      priceUnit: 20000,
      priceBundle: 30000,
      estimateMin: 60,
      estimateMax: 120,
      sortOrder: 2,
    },
    // Item Hunting
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Titanite Slab farming",
      detail: "Dari Darkwraith, drop rate rendah",
      priceUnit: 20000,
      estimateMin: 120,
      estimateMax: 240,
      badge: BadgeType.RARE,
      sortOrder: 3,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Set gear eksklusif boss",
      detail: "Havel, Smough, Ornstein",
      priceUnit: 15000,
      priceUnitLabel: "/ set",
      priceBundle: 35000,
      priceBundleLabel: "3 set",
      estimateMin: 60,
      estimateMax: 120,
      sortOrder: 4,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Covenant item farming",
      detail: "Eye of Death, dll",
      priceUnit: 20000,
      estimateMin: 120,
      estimateMax: 180,
      sortOrder: 5,
    },
    // Grinding
    {
      category: ServiceCategory.GRINDING,
      name: "Soul farming per 10 level",
      detail: "Target SL bebas (max SL 120)",
      priceUnit: 10000,
      priceBundle: 45000,
      priceBundleLabel: "SL 1→120",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 6,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Humanity farming",
      detail: "Untuk kindling & soft humanity",
      priceUnit: 15000,
      estimateMin: 60,
      estimateMax: 120,
      sortOrder: 7,
    },
    // NPC Quest
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Questline NPC (per karakter)",
      detail: "Siegmeyer, Solaire, dll",
      priceUnit: 20000,
      priceBundle: 35000,
      priceBundleLabel: "all NPC",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 8,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Unlock ending alternatif",
      detail: "Dark Lord ending",
      priceUnit: 20000,
      estimateMin: 30,
      estimateMax: 60,
      sortOrder: 9,
    },
  ];

  for (const s of dsrServices) {
    await prisma.service.upsert({
      where: { id: `dsr-${s.sortOrder}` },
      update: {},
      create: {
        id: `dsr-${s.sortOrder}`,
        gameId: dsr.id,
        ...s,
        badge: s.badge ?? null,
        priceUnit: s.priceUnit ?? null,
        priceBundle: s.priceBundle ?? null,
        priceUnitLabel: s.priceUnitLabel ?? null,
        priceBundleLabel: s.priceBundleLabel ?? null,
      },
    });
  }

  // SERVICES — DS2
  const ds2Services = [
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Per boss (base game)",
      detail: "40+ boss tersedia",
      priceUnit: 15000,
      priceBundle: 99000,
      priceBundleLabel: "Hemat 50%",
      estimateMin: 30,
      estimateMax: 90,
      badge: BadgeType.SAVE,
      sortOrder: 1,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Boss DLC (per DLC)",
      detail: "Crown of the Sunken King, dll",
      priceUnit: 20000,
      priceUnitLabel: "/ boss",
      priceBundle: 45000,
      priceBundleLabel: "/ DLC",
      estimateMin: 60,
      estimateMax: 120,
      badge: BadgeType.POPULAR,
      sortOrder: 2,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Darklurker",
      detail: "Covenant boss tersembunyi, proses panjang",
      priceUnit: 35000,
      estimateMin: 120,
      estimateMax: 240,
      badge: BadgeType.RARE,
      sortOrder: 3,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Petrified Dragon Bone farming",
      detail: "Material upgrade tertinggi",
      priceUnit: 25000,
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 4,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Awestones (covenant)",
      detail: "Bell Keeper rank up",
      priceUnit: 25000,
      estimateMin: 180,
      estimateMax: 300,
      sortOrder: 5,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Soul farming per 10 level",
      detail: "Target SM / SL bebas",
      priceUnit: 10000,
      priceBundle: 50000,
      priceBundleLabel: "SL 1→150",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 6,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Bonfire Ascetic service",
      detail: "Respawn boss untuk item NG eksklusif",
      priceUnit: 20000,
      priceUnitLabel: "/ boss",
      estimateMin: 60,
      estimateMax: 120,
      sortOrder: 7,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Questline NPC (per karakter)",
      detail: "Lucatiel, Benhart, Straid",
      priceUnit: 20000,
      priceBundle: 40000,
      priceBundleLabel: "all NPC",
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 8,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Unlock ending alternatif",
      detail: "Aldia ending",
      priceUnit: 20000,
      estimateMin: 30,
      estimateMax: 60,
      sortOrder: 9,
    },
  ];

  for (const s of ds2Services) {
    await prisma.service.upsert({
      where: { id: `ds2-${s.sortOrder}` },
      update: {},
      create: {
        id: `ds2-${s.sortOrder}`,
        gameId: ds2.id,
        ...s,
        badge: s.badge ?? null,
        priceUnit: s.priceUnit ?? null,
        priceBundle: s.priceBundle ?? null,
        priceUnitLabel: s.priceUnitLabel ?? null,
        priceBundleLabel: s.priceBundleLabel ?? null,
      },
    });
  }

  // SERVICES — DS3
  const ds3Services = [
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Per boss (base game)",
      detail: "19 boss utama",
      priceUnit: 20000,
      priceBundle: 99000,
      priceBundleLabel: "Hemat 48%",
      estimateMin: 30,
      estimateMax: 90,
      badge: BadgeType.SAVE,
      sortOrder: 1,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Nameless King",
      detail: "Boss tersulit DS3 — harga khusus",
      priceUnit: 35000,
      estimateMin: 60,
      estimateMax: 180,
      badge: BadgeType.POPULAR,
      sortOrder: 2,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "DLC Ashes of Ariandel",
      detail: "Sister Friede, Champion's Gravetender",
      priceUnit: 25000,
      priceUnitLabel: "/ boss",
      priceBundle: 40000,
      priceBundleLabel: "DLC",
      estimateMin: 60,
      estimateMax: 120,
      sortOrder: 3,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "DLC The Ringed City",
      detail: "Darkeater Midir, Slave Knight Gael",
      priceUnit: 25000,
      priceUnitLabel: "/ boss",
      priceBundle: 45000,
      priceBundleLabel: "DLC",
      estimateMin: 60,
      estimateMax: 180,
      badge: BadgeType.POPULAR,
      sortOrder: 4,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Pale Tongue farming",
      detail: "Roster Mound-Maker covenant",
      priceUnit: 25000,
      estimateMin: 120,
      estimateMax: 300,
      sortOrder: 5,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Vertebra Shackle farming",
      detail: "Covenant Mound-Maker rank up",
      priceUnit: 30000,
      estimateMin: 180,
      estimateMax: 360,
      badge: BadgeType.RARE,
      sortOrder: 6,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Titanite Slab & Chunk",
      detail: "Untuk full upgrade weapon",
      priceUnit: 20000,
      priceBundle: 30000,
      priceBundleLabel: "paket",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 7,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Semua Ring (achievement)",
      detail: "Butuh 2x NG cycle",
      priceBundle: 89000,
      priceBundleLabel: "NG+",
      estimateMin: 2880,
      estimateMax: 5760,
      badge: BadgeType.RARE,
      sortOrder: 8,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Soul farming per 10 level",
      detail: "Target SL 120 / 150",
      priceUnit: 12000,
      priceBundle: 55000,
      priceBundleLabel: "SL→150",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 9,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Questline NPC (per karakter)",
      detail: "Siegward, Yuria, Anri, Greirat",
      priceUnit: 25000,
      priceBundle: 55000,
      priceBundleLabel: "all NPC",
      estimateMin: 120,
      estimateMax: 300,
      sortOrder: 10,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "3 Ending (achievement)",
      detail: "Link Fire, Dark Lord, Usurp the Fire",
      priceUnit: 20000,
      priceUnitLabel: "/ ending",
      priceBundle: 45000,
      priceBundleLabel: "3 ending",
      estimateMin: 30,
      estimateMax: 60,
      sortOrder: 11,
    },
  ];

  for (const s of ds3Services) {
    await prisma.service.upsert({
      where: { id: `ds3-${s.sortOrder}` },
      update: {},
      create: {
        id: `ds3-${s.sortOrder}`,
        gameId: ds3.id,
        ...s,
        badge: s.badge ?? null,
        priceUnit: s.priceUnit ?? null,
        priceBundle: s.priceBundle ?? null,
        priceUnitLabel: s.priceUnitLabel ?? null,
        priceBundleLabel: s.priceBundleLabel ?? null,
      },
    });
  }

  // SERVICES — ELDEN RING
  const erServices = [
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Per boss (story / field)",
      detail: "Margit, Godrick, Rennala, Radahn, dll",
      priceUnit: 20000,
      priceBundle: 139000,
      priceBundleLabel: "Hemat 45%",
      estimateMin: 30,
      estimateMax: 90,
      badge: BadgeType.SAVE,
      sortOrder: 1,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Malenia, Blade of Miquella",
      detail: "Boss paling ikonik & sulit",
      priceUnit: 45000,
      estimateMin: 60,
      estimateMax: 240,
      badge: BadgeType.POPULAR,
      sortOrder: 2,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Boss DLC (per boss)",
      detail: "Messmer, Bayle, Midra, dll",
      priceUnit: 25000,
      priceBundle: 89000,
      priceBundleLabel: "all DLC boss",
      estimateMin: 60,
      estimateMax: 120,
      sortOrder: 3,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "All boss bundle (base + DLC)",
      detail: "Semua boss tanpa terkecuali",
      priceBundle: 199000,
      priceBundleLabel: "Best Value",
      estimateMin: 2880,
      estimateMax: 5760,
      badge: BadgeType.SAVE,
      sortOrder: 4,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Somber Ancient Dragon Stone",
      detail: "Material upgrade +10 somber weapon",
      priceUnit: 25000,
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 5,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Larval Tear farming",
      detail: "Untuk respec build, jumlah terbatas",
      priceUnit: 30000,
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 6,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Legendary Armament set",
      detail: "Semua senjata legendaris (achievement)",
      priceBundle: 79000,
      estimateMin: 180,
      estimateMax: 360,
      sortOrder: 7,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Scadutree Fragment (DLC)",
      detail: "Semua fragment untuk max blessing",
      priceUnit: 35000,
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 8,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Rune farming per 10 level",
      detail: "Target RL bebas (max RL 150)",
      priceUnit: 12000,
      priceBundle: 65000,
      priceBundleLabel: "RL→150",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 9,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Upgrade material lengkap",
      detail: "Semua weapon ke +25/+10",
      priceBundle: 55000,
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 10,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Questline NPC (per karakter)",
      detail: "Ranni, Millicent, Fia, Goldmask, dll",
      priceUnit: 30000,
      priceBundle: 79000,
      priceBundleLabel: "all NPC",
      estimateMin: 120,
      estimateMax: 360,
      sortOrder: 11,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Unlock ending (per ending)",
      detail: "Age of Stars, Frenzied Flame, dll",
      priceUnit: 25000,
      priceUnitLabel: "/ ending",
      priceBundle: 55000,
      priceBundleLabel: "all ending",
      estimateMin: 30,
      estimateMax: 90,
      sortOrder: 12,
    },
  ];

  for (const s of erServices) {
    await prisma.service.upsert({
      where: { id: `er-${s.sortOrder}` },
      update: {},
      create: {
        id: `er-${s.sortOrder}`,
        gameId: er.id,
        ...s,
        badge: s.badge ?? null,
        priceUnit: s.priceUnit ?? null,
        priceBundle: s.priceBundle ?? null,
        priceUnitLabel: s.priceUnitLabel ?? null,
        priceBundleLabel: s.priceBundleLabel ?? null,
      },
    });
  }

  // SERVICES — BLACK MYTH: WUKONG
  const bmwServices = [
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Per boss (per chapter)",
      detail: "Chapter 1–6, boss utama",
      priceUnit: 25000,
      priceBundle: 129000,
      priceBundleLabel: "Hemat 40%",
      estimateMin: 30,
      estimateMax: 120,
      badge: BadgeType.SAVE,
      sortOrder: 1,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Erlang Shen / Yuan-Lang",
      detail: "Secret boss, butuh trigger khusus",
      priceUnit: 45000,
      estimateMin: 60,
      estimateMax: 180,
      badge: BadgeType.SECRET,
      sortOrder: 2,
    },
    {
      category: ServiceCategory.BOSS_FIGHT,
      name: "Paket per chapter",
      detail: "Semua boss dalam 1 chapter",
      priceBundle: 35000,
      priceBundleLabel: "/ chapter",
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 3,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Spirit (enemy soul) farming",
      detail: "Drop rate rendah dari enemy tertentu",
      priceUnit: 30000,
      estimateMin: 120,
      estimateMax: 300,
      badge: BadgeType.RARE,
      sortOrder: 4,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Gear set eksklusif per chapter",
      detail: "Set armor & senjata tiap chapter",
      priceUnit: 25000,
      priceUnitLabel: "/ set",
      priceBundle: 99000,
      priceBundleLabel: "all set",
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 5,
    },
    {
      category: ServiceCategory.ITEM_HUNTING,
      name: "Gourd & vessel tersembunyi",
      detail: "Semua collectible penting",
      priceUnit: 25000,
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 6,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Will farming",
      detail: "Untuk full upgrade skill tree",
      priceUnit: 25000,
      estimateMin: 120,
      estimateMax: 240,
      sortOrder: 7,
    },
    {
      category: ServiceCategory.GRINDING,
      name: "Craft material lengkap",
      detail: "Semua material untuk upgrade senjata",
      priceUnit: 30000,
      estimateMin: 120,
      estimateMax: 300,
      sortOrder: 8,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Unlock secret / true ending",
      detail: "Butuh trigger & collectible khusus",
      priceUnit: 35000,
      estimateMin: 60,
      estimateMax: 180,
      sortOrder: 9,
    },
    {
      category: ServiceCategory.NPC_QUEST,
      name: "Achievement 100%",
      detail: "Semua shrine, boss, collectible",
      priceBundle: 149000,
      priceBundleLabel: "Best Value",
      estimateMin: 2880,
      estimateMax: 5760,
      badge: BadgeType.SAVE,
      sortOrder: 10,
    },
  ];

  for (const s of bmwServices) {
    await prisma.service.upsert({
      where: { id: `bmw-${s.sortOrder}` },
      update: {},
      create: {
        id: `bmw-${s.sortOrder}`,
        gameId: bmw.id,
        ...s,
        badge: s.badge ?? null,
        priceUnit: s.priceUnit ?? null,
        priceBundle: s.priceBundle ?? null,
        priceUnitLabel: s.priceUnitLabel ?? null,
        priceBundleLabel: s.priceBundleLabel ?? null,
      },
    });
  }

  console.log("✓ Services seeded (semua game)");

  // STATIC CONTENT
  const contents = [
    {
      key: "about",
      title: "Tentang Kami",
      body: "# Tentang Jokiwir\n\nJokiwir adalah layanan joki game profesional...",
    },
    {
      key: "faq",
      title: "FAQ",
      body: "# Pertanyaan Umum\n\n**Apa itu layanan joki?**\n...",
    },
    {
      key: "terms",
      title: "Syarat & Ketentuan",
      body: "# Syarat & Ketentuan\n\nDengan menggunakan layanan kami...",
    },
    {
      key: "privacy",
      title: "Kebijakan Privasi",
      body: "# Kebijakan Privasi\n\nKami menghargai privasi Anda...",
    },
    {
      key: "refund",
      title: "Kebijakan Refund",
      body: "# Kebijakan Refund\n\nRefund dapat dilakukan apabila...",
    },
  ];

  for (const c of contents) {
    await prisma.content.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }

  console.log("✓ Static content seeded");
  console.log("\n🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
