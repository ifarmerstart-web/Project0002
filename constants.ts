import { Crop } from './types';

export const GRID_SIZE = 4;
export const INITIAL_GOLD = 180; 
export const GAME_DURATION_SECONDS = 180; // 3 minutes
export const MARKET_UPDATE_INTERVAL = 10000; // 10 seconds
export const UNLOCK_COST_BASE = 100;
export const UNLOCK_FISH_COST = 1; // Fish cost to expand land
export const FRESHNESS_DECAY_RATE = 2; 
export const FRESHNESS_TICK_RATE = 2000; 

// Bug Constants
export const BUG_SPAWN_MIN = 15000; 
export const BUG_SPAWN_MAX = 35000; 
export const BUG_TRAVEL_TIME = 5000; 
export const BUG_ATTACK_TIME = 0; 

// UFO Constants
export const UFO_SPAWN_MIN = 25000; 
export const UFO_SPAWN_MAX = 40000; 
export const UFO_HOVER_DURATION = 3000; 
export const UFO_START_TIME_THRESHOLD = 150; // Adjusted for 180s duration
export const UFO_CLICKS_REQUIRED = 2;

// Colors
export const COLORS = {
  GROWTH_FILL: '#32FF7E', 
  FRESH_HIGH: '#0fbcf9', 
  FRESH_MED: '#ff9f1a', 
  FRESH_LOW: '#ff4d4d', 
};

// --- ASSET MAPPING ---
// Replace the values here with your actual local file paths (e.g. '/assets/images/icon-fish.png')
export const ASSET_PATHS = {
  ICONS: {
    FISH: 'https://placehold.co/64x64/0ea5e9/white?text=Fish&font=roboto', // icon-fish.png
    GOLD: 'https://placehold.co/64x64/f59e0b/white?text=G&font=roboto', // icon-gold.png
    TIMER: 'https://placehold.co/64x64/334155/white?text=Time&font=roboto', // icon-timer.png
    LOCK: 'https://placehold.co/64x64/94a3b8/white?text=Lock&font=roboto', // icon-lock.png
    WARNING: 'https://placehold.co/64x64/ef4444/white?text=Warn&font=roboto', // icon-warning.png
    CLOSE: 'https://placehold.co/64x64/64748b/white?text=X&font=roboto', // icon-close.png
    TARGET: 'https://placehold.co/64x64/10b981/white?text=Goal&font=roboto', // icon-target.png
    HAND: 'https://placehold.co/64x64/f97316/white?text=Tap&font=roboto', // icon-tap.png
    TREND_UP: 'https://placehold.co/32x32/ef4444/white?text=^&font=roboto', // icon-trend-up.png
    TREND_DOWN: 'https://placehold.co/32x32/3b82f6/white?text=v&font=roboto', // icon-trend-down.png
    FARM: 'https://placehold.co/64x64/10b981/white?text=Farm&font=roboto', // icon-farm.png
    MARKET: 'https://placehold.co/64x64/3b82f6/white?text=Mkt&font=roboto', // icon-chart.png
    SHOP: 'https://placehold.co/64x64/06b6d4/white?text=Shop&font=roboto', // icon-shop.png
    BAG: 'https://placehold.co/64x64/f59e0b/white?text=Bag&font=roboto', // icon-bag.png
  },
  NPCS: {
    CAT_NEUTRAL: 'https://placehold.co/128x128/facc15/black?text=Cat&font=roboto', // npc-cat-neutral.png
    CAT_HAPPY: 'https://placehold.co/128x128/facc15/black?text=Happy&font=roboto', // npc-cat-happy.png
    CAT_SCARED: 'https://placehold.co/128x128/facc15/black?text=Scared&font=roboto', // npc-cat-scared.png
    CAT_GOLDEN: 'https://placehold.co/128x128/fbbf24/white?text=GoldCat&font=roboto', // npc-cat-golden.png
    BUG: 'https://placehold.co/80x80/a3e635/black?text=Bug&font=roboto', // entity-bug.png
    UFO: 'https://placehold.co/128x128/a855f7/white?text=UFO&font=roboto', // entity-ufo.png
    EXPLOSION: 'https://placehold.co/128x128/ef4444/white?text=Boom&font=roboto', // effect-explosion.png
  },
  ITEMS: {
    GOLDEN_PAW: 'https://placehold.co/64x64/fbbf24/black?text=Paw&font=roboto', // item-golden-paw.png
    INSTANT_GROW: 'https://placehold.co/64x64/3b82f6/white?text=Grow&font=roboto', // item-instant-grow.png
    EMP: 'https://placehold.co/64x64/6366f1/white?text=EMP&font=roboto', // item-emp.png
    BINGO: 'https://placehold.co/64x64/ec4899/white?text=Bingo&font=roboto', // item-bingo-master.png
  },
  STATUS: {
    WITHERED: 'https://placehold.co/64x64/78350f/white?text=Dead&font=roboto', // status-withered.png
    FROZEN: 'https://placehold.co/64x64/bae6fd/black?text=Ice&font=roboto', // status-frozen.png
    SPARKLE: 'https://placehold.co/64x64/fef08a/black?text=*&font=roboto', // effect-sparkle.png
  }
};

export const FISH_MARKET_ITEMS = [
  {
    id: 'golden_paw',
    name: 'Golden Paw',
    emoji: '🐾',
    imageUrl: ASSET_PATHS.ITEMS.GOLDEN_PAW,
    cost: 3,
    description: 'Double all crop selling prices for the next 30 seconds.',
    actionType: 'BUFF_PRICE',
    duration: 30000
  },
  {
    id: 'instant_grow',
    name: 'Instant Grow',
    emoji: '✨',
    imageUrl: ASSET_PATHS.ITEMS.INSTANT_GROW,
    cost: 5,
    description: 'Instantly matures all currently planted crops on the grid.',
    actionType: 'GROWTH'
  },
  {
    id: 'emp_jammer',
    name: 'EMP Jammer',
    emoji: '⚡',
    imageUrl: ASSET_PATHS.ITEMS.EMP,
    cost: 2,
    description: 'Prevents Bugs and UFOs from spawning for 60 seconds.',
    actionType: 'REPELLENT',
    duration: 60000
  },
  {
    id: 'bingo_master',
    name: 'Bingo Master',
    emoji: '🎲',
    imageUrl: ASSET_PATHS.ITEMS.BINGO,
    cost: 8,
    description: 'Permanent Upgrade: Seed Shop focuses 80% on seeds you already have planted.',
    actionType: 'UPGRADE_PERMANENT'
  }
];

const generateCrops = (): Crop[] => {
  const categories = ['Vegetable', 'Fruit', 'Flower', 'Fantasy'] as const;
  const emojis = ['🥕', '🥔', '🌽', '🍅', '🍆', '🥦', '🥬', '🥒', '🌶️', '🫑', '🧅', '🧄', '🍠', '🥜', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', 'Lime', 'Papaya', 'Fig', 'Plum', 'Apricot', 'Pomegranate', 'Raspberry', 'Blackberry', 'Cranberry', 'Date', 'Guava', 'Lychee', 'Dragonfruit', 'Passionfruit', 'Sunflower', 'Rose', 'Tulip', 'Hibiscus', 'Sakura', 'Daisy', 'Lavender', 'Orchid', 'Lily', 'Lotus', 'Dandelion', 'Poppy', 'Marigold', 'Jasmine', 'Violet', 'Daffodil', 'Peony', 'Chrysanthemum', 'Begonia', 'Petunia', 'Starfruit', 'Moonberry', 'Fire Weed', 'Ice Root', 'Gold Leaf', 'Void Melon', 'Thunder Nut', 'Ghost Pepper', 'Mana Herb', 'Dragon Scale', 'Phoenix Bloom', 'Crystal Rose', 'Shadow Shroom', 'Light Bulb', 'Time Vine', 'Gravity Gourd', 'Nebula Nectar', 'Plasma Pod', 'Quantum Corn', 'Ether Apple'];
  
  const crops: Crop[] = [];
  const names = [
    "Carrot", "Potato", "Corn", "Tomato", "Eggplant", "Broccoli", "Lettuce", "Cucumber", "Chili", "Bell Pepper", 
    "Onion", "Garlic", "Sweet Potato", "Radish", "Pumpkin", "Spinach", "Kale", "Zucchini", "Asparagus", "Celery",
    "Peas", "Beans", "Cauliflower", "Beetroot", "Turnip", "Parsnip", "Yam", "Okra", "Artichoke", "Leek",
    "Apple", "Pear", "Orange", "Lemon", "Banana", "Watermelon", "Grape", "Strawberry", "Blueberry", "Melon",
    "Cherry", "Peach", "Mango", "Pineapple", "Coconut", "Kiwi", "Lime", "Papaya", "Fig", "Plum",
    "Apricot", "Pomegranate", "Raspberry", "Blackberry", "Cranberry", "Date", "Guava", "Lychee", "Dragonfruit", "Passionfruit",
    "Sunflower", "Rose", "Tulip", "Hibiscus", "Sakura", "Daisy", "Lavender", "Orchid", "Lily", "Lotus",
    "Dandelion", "Poppy", "Marigold", "Jasmine", "Violet", "Daffodil", "Peony", "Chrysanthemum", "Begonia", "Petunia",
    "Starfruit", "Moonberry", "Fire Weed", "Ice Root", "Gold Leaf", "Void Melon", "Thunder Nut", "Ghost Pepper", "Mana Herb", "Dragon Scale",
    "Phoenix Bloom", "Crystal Rose", "Shadow Shroom", "Light Bulb", "Time Vine", "Gravity Gourd", "Nebula Nectar", "Plasma Pod", "Quantum Corn", "Ether Apple"
  ];

  names.forEach((name, index) => {
    let category: Crop['category'] = 'Vegetable';
    if (index >= 30 && index < 60) category = 'Fruit';
    if (index >= 60 && index < 80) category = 'Flower';
    if (index >= 80) category = 'Fantasy';

    const originalGrowthTime = 10 + Math.floor(index * 2.5);
    // Apply 0.8 factor for faster gameplay
    const baseGrowthTime = Math.max(4, Math.floor(originalGrowthTime * 0.8 * 0.8));
    const seedPrice = 10 + Math.floor(index * 5);
    const sellMultiplier = 1.6 + (index * 0.015);
    const baseSellPrice = Math.floor(seedPrice * sellMultiplier);

    // Placeholder image path - replace with `assets/crops/${name.toLowerCase().replace(/ /g, '-')}.png` in production
    const imageUrl = `https://placehold.co/128x128/transparent/transparent?text=${name.substring(0,3)}&font=roboto`; 

    crops.push({
      id: `crop_${index}`,
      name,
      emoji: emojis[index % emojis.length],
      imageUrl,
      growthTime: Math.min(180, Math.floor(baseGrowthTime * 0.9)), 
      seedPrice,
      baseSellPrice,
      category
    });
  });

  return crops;
};

export const CROPS = generateCrops();

export const GET_UNLOCK_TIME = (x: number, y: number): number => {
  return 0; 
};

export const CAT_QUOTES = [
  "야옹.. 너도 야근하니? 난 늘 야근이야.", "주식 창은 보지 마, 농사에 집중해.",
  "오늘 점심 뭐 먹지.. 생선구이?", "한강 물 따뜻하니?", "월급은 통장을 스칠 뿐이지.",
  "부장님 몰래 하는 게임이 제일 재밌지?", "이번 빙고 터지면 나 사표 쓴다.",
  "물고기 5마리만 빌려줄래? 내일 갚을게.", "내 꿈은 갓생이 아니라 그냥 생선이야.",
  "코인 상장 폐지 당해본 적 있어? 난 있어.", "퇴근하고 싶다.. 출근 안 했지만.",
  "빙고 한 줄이면 인생 역전이야!", "거북목 조심해, 집사야.", "금융 치료가 필요해 보여.",
  "내일은 상한가 가즈아!", "고양이가 나라를 구한다.", "너 눈 밑에 다크서클이 무릎까지 내려왔어.",
  "이거 수확해서 언제 집 사니?", "적당히 벌고 아주 잘 놀자.", "인생은 원래 혼자야, 냥.",
  "떡상 가즈아!", "오늘 날씨.. 츄르 먹기 딱 좋네.", "회사 가기 싫다.. 너도 그렇지?",
  "빙고 마스터가 되면 나 맛있는 거 사줄 거야?", "이 밭이 내 강남 아파트가 될 거야.",
  "나만 고양이 없어.. 아, 나 고양이지.", "존버는 반드시 승리한다.", "일개미처럼 일만 하지 말고 냥이처럼 즐겨.",
  "익절은 항상 옳다.", "손절은 빠르게, 수확은 느긋하게.", "벌레 잡는 게 주식 방어보다 쉽네.",
  "월요병 치료제는 물고기뿐이야.", "복권 1등 되면 이 농장 나 줄 거야?", "인생 한 방이야, 빙고를 노려!",
  "잠깐 쉬었다 해, 냥.", "너 방금 하품했지?", "나 졸려.. 대신 농사 좀 지어줘.",
  "커피 한 잔 마시고 올래?", "수확물 신선도가 네 열정보다 높네.", "부자 되면 나 기억해라.",
  "갓생 살기 힘들다..", "주식 공부보다 농사가 적성에 맞을지도?", "파이어족이 머지않았어.",
  "오늘 운세는 '물고기 대박'이야.", "비료 살 돈 아껴서 츄르 사자.", "너 손가락 되게 빠르다?",
  "외계인이 오면 나부터 지켜줘.", "이 농장 시세가 꽤 올랐네.", "농부의 아침은 물고기로 시작하지.",
  "야옹, 그냥 불러봤어."
];