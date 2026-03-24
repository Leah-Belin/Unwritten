// ── NPCS ─────────────────────────────────────────────────────

const NPCS = [
  {
    id:'mariella', portrait:'images/portraits/mariella.jpg', name:'Mariella', emoji:'👩', col:5, row:5, color:'#c07850',
    scene:'village',
    // 0=Dawn 1=Morning 2=Midday 3=Afternoon 4=Dusk — absent at evening/night (inside bakery)
    schedule:[
      { periods:[1],   col:6,  row:10, radius:2 }, // morning: near bakery
      { periods:[2],   col:20, row:20, radius:3 }, // midday: town square
      { periods:[3],   col:29, row:27, radius:3 }, // afternoon: council hall area
      { periods:[4],   col:6,  row:10, radius:2 }, // dusk: back near bakery
    ],
    lines:[
      '"Welcome back, my joy. Rolls are nearly done — take some to the square when they\'re cool, would you?"',
      '"Market day tomorrow! I need you to fetch me some fresh herbs before then."',
      '"Your father\'s up at the garden. You know how he gets when something new is coming in." She shakes her head fondly.',
      '"Try Sera\'s stall if you need anything — she got a lovely delivery of honey this week."',
      '"Don\'t worry about Kell, my joy. You\'ll sour the dough if you don\'t let go of things that are out of your control."',
      '"It\'s a beautiful day. Go enjoy it."',
    ],
    generalReplies: ['"Yes, Mum."', '"Of course."', '"I will soon."'],
    quest: { id:'mariella_herbs', itemId:'common_herb', itemName:'Common Herb', reward:'chit', rewardColor:'red', rewardAmount:1, line:'"Could you find me some fresh herbs, my joy? The windowsill ones are going dry."' },
    teachesAt: { goodwill:3, recipes:['spiced_rolls','fruit_preserve','morning_tea'], line:'"Come here — let me show you how to do the spiced rolls properly. Your father requests them every single morning."' },
  },
  {
    id:'jaxon', portrait:'images/portraits/jaxon.jpg', name:'Jaxon', emoji:'🧑', col:20, row:20, color:'#507090',
    scene:'village',
    // Dawn & evening: near home. Day: square, forge, inn. Night: inside.
    schedule:[
      { periods:[0],   col:12, row:30, radius:2 }, // dawn: near house
      { periods:[1],   col:20, row:20, radius:4 }, // morning: town square
      { periods:[2],   col:28, row:9,  radius:3 }, // midday: near forge
      { periods:[3],   col:35, row:10, radius:3 }, // afternoon: near inn
      { periods:[4],   col:20, row:20, radius:3 }, // dusk: town square
      { periods:[5],   col:12, row:30, radius:2 }, // evening: near home
    ],
    lines:[
      {
        text: '"Your bread is amazing, Kaida." He\'s looking at her, not at the loaf. "I\'m not sure how you did it."',
        replies: [
          { label: '"It\'s all in the technique."' },
          { label: '"Maybe I\'ll teach you someday."' },
        ],
      },
      '"I\'ve been working on a new bowl. Something with a wider lip — better for soup, I think. You want to see it when it\'s done?" He\'s already grinning before she answers.',
      {
        text: '"I had a competition going with myself this morning." He holds up two near-identical cups. "Which one do you think came out better?"',
        replies: [
          { label: '"The left one."' },
          { label: '"The right one. Definitely."' },
        ],
      },
      '"Market day tomorrow. I always do better when you\'re at the stall next to mine." He says it like it\'s obvious.',
      '"Your mother stopped and looked at my work for a full minute today. Didn\'t say anything, just nodded." He pauses. "I think that\'s good?"',
      '"The clay\'s been good this week. I might actually have something worth selling at festival." He glances over. "Not that your bread ever has trouble moving."',
    ],
    generalReplies: ['"I\'ll keep that in mind."', '"Thanks, Jaxon."', '"I should get going."'],
  },
  {
    id:'sera', name:'Sera', emoji:'🧑‍🦳', col:23, row:21, color:'#907050',
    scene:'village',
    lines:[
      '"Kaida! Just the person. Tell your mother I have fresh coriander — she\'s been asking."',
      '"Market day tomorrow, I\'m run off my feet. Your father always stops for a chat, bless him."',
      '"Lovely weather for the festival coming up. Good for the harvest too, touch wood."',
    ],
    generalReplies: ['"I\'ll pass that on."', '"Good to know."', '"I should get moving."'],
    quest: { id:'sera_bread', itemId:'simple_bread', itemName:'Simple Bread', reward:'chit', rewardColor:'red', rewardAmount:2, line:'"Oh, I don\'t suppose you have any of your mother\'s bread spare? Mine burned this morning, catastrophe."' },
  },
  {
    id:'blacksmith', name:'Kell', emoji:'🧔', col:5, row:5, color:'#605040',
    lines:[
      '"Morning! Good day for it. Whatever \'it\' is."',
      '"Your father\'s the only healer I\'d trust. Fixed my shoulder right up last winter."',
      '"Big order this week. Three new ploughs before festival. My arms are going to fall off."',
    ],
    generalReplies: ['"Sounds about right."', '"Take care of yourself."', '"I won\'t keep you."'],
    teachesAt: { goodwill:2, recipes:['blacksmith_broth'], line:'"You look half-starved. Here — my mother\'s broth. She swore it could fix anything. Mostly true."' },
  },
  {
    id:'elder', name:'Elder Maren', emoji:'👵', col:5, row:4, color:'#806050',
    lines:[
      '"Good morning, child. The council met this week — we\'re planning the harvest ceremony."',
      '"Your father does good work. The village is lucky to have him."',
      '"The old ways keep us safe. There\'s comfort in that, when you\'re my age."',
      '"Writing is not forbidden by us. It is forbidden by the world. We are only wise enough to obey."',
    ],
    generalReplies: ['"I understand."', '"Thank you, Elder."', '"I\'ll bear that in mind."'],
  },
  {
    id:'hesta', portrait:'images/portraits/hesta.jpg', name:'Hesta', emoji:'🧓', col:6, row:36, color:'#7a6050',
    scene:'village',
    schedule:[
      { periods:[0],   col:6,  row:36, radius:2 }, // dawn: near hut
      { periods:[1],   col:20, row:16, radius:3 }, // morning: town hall area
      { periods:[2],   col:29, row:27, radius:3 }, // midday: council hall area
      { periods:[3],   col:6,  row:10, radius:3 }, // afternoon: bakery area
      { periods:[4,5], col:6,  row:36, radius:2 }, // dusk/evening: near hut
    ],
    lines:[
      '"Oh, it\'s you! Come and sit a moment, my knees are giving me trouble today."',
      '"I\'ve been out here forty years. Village hasn\'t changed much. That\'s the way I like it."',
      '"Your father brought me a tonic last month. Slept like a stone. Good man."',
    ],
    generalReplies: ['"Of course."', '"I\'m glad you\'re well."', '"I won\'t stay too long."'],
    teachesAt: { goodwill:2, recipes:['hestas_remedy'], line:'"My grandmother\'s remedy. Don\'t tell your father I said it\'s better than his — but it is."' },
    quest: { id:'hesta_water', itemId:'common_herb', itemName:'Common Herb', reward:'item', rewardItemId:'honey', line:'"Could you fetch me some fresh herbs from the wood\'s edge? My knees won\'t manage it today."' },
  },
  {
    id:'innkeeper', name:'The Innkeeper', emoji:'🧑‍🍳', col:5, row:5, color:'#806858', shop:'inn_stall',
    lines:[
      '"Morning! Festival\'s coming up — half the region will be through that door. Exciting!"',
      '"Your mother\'s rolls are the best thing about market day. Don\'t tell her I said that, she\'ll raise her prices."',
      '"Quiet week. Just the way I like it before the rush."',
    ],
    generalReplies: ['"Good to hear."', '"I can imagine."', '"I\'ll let you get back to it."'],
    teachesAt: { goodwill:2, recipes:['strong_tea'], line:'"My house blend. Travelers come back year after year just for this. Secret\'s in the steep time."' },
    quest: { id:'inn_fruit', itemId:'fruit', itemName:'Fruit', reward:'chit', rewardColor:'red', rewardAmount:2, line:'"I\'m short on fruit for the festival pies. Bring me some and I\'ll see you right."' },
  },
  // Three children — play near fountain by day, head to villager houses at evening
  {
    id:'child1', name:'Children', emoji:'👧', col:20, row:19, color:'#a08060',
    scene:'village',
    schedule:[
      { periods:[0,1,2,3,4], col:20, row:20, radius:3 }, // day: fountain plaza
      { periods:[5],         col:24, row:32, radius:2 }, // evening: near house A
    ],
    lines:[
      'She\'s playing a chasing game around the fountain, shrieking with laughter.',
      'She drags a stick through the dirt — draws a curve — then scuffs it out fast.',
      'She\'s sorting coloured stones into elaborate patterns.',
    ],
    generalReplies: ['"Hello."', '"Can\'t stop — I\'m it!"'],
  },
  {
    id:'child2', name:'Children', emoji:'👧', col:21, row:21, color:'#805040',
    scene:'village',
    schedule:[
      { periods:[0,1,2,3,4], col:20, row:20, radius:3 }, // day: fountain plaza
      { periods:[5],         col:30, row:16, radius:2 }, // evening: near house B
    ],
    lines:[
      'She squeals and ducks behind the fountain.',
      'She\'s arguing about the rules of a game only she fully understands.',
      'She spots you and waves, then immediately forgets you were there.',
    ],
    generalReplies: ['"Hello."', '"You\'re it!"'],
  },
  {
    id:'child3', name:'Children', emoji:'👦', col:19, row:21, color:'#907060',
    scene:'village',
    schedule:[
      { periods:[0,1,2,3,4], col:20, row:20, radius:3 }, // day: fountain plaza
      { periods:[5],         col:16, row:36, radius:2 }, // evening: near house C
    ],
    lines:[
      'He\'s running in wide circles for no clear reason.',
      'He stops, looks very serious for a moment, then runs off again.',
      'He\'s building something out of pebbles. It might be a house.',
    ],
    generalReplies: ['"Hi."', '"Watch this!"'],
  },
  {
    id:'father', portrait:'images/portraits/father.jpg', name:'The Priest', emoji:'👴', col:20, row:20, color:'#c0b090',
    visible: false,
    lines:[
      '"A good harvest this year. Nature is generous when we honor the compact."',
      '"The temple welcomes all who wish to serve. It is a quiet life, but a meaningful one."',
      '"Writing is a sacred responsibility. We treat it with the reverence it deserves."',
    ],
  },
  {
    id:'galen', portrait:'images/portraits/father.jpg', name:'Galen', emoji:'👨', col:12, row:10, color:'#8a7060',
    lines:[
      '"Morning, love. The lavender\'s coming in well this year."',
      '"Don\'t tell your mother I skipped breakfast — I got distracted by the new seedlings."',
      '"There\'s something your grandmother used to say: tend the small things and the large ones take care of themselves."',
      '"I left something in the kitchen for you. Don\'t let it go cold."',
    ],
    generalReplies: ['"I know, Dad."', '"Be careful out here."', '"I won\'t stay long."'],
  },
];

// ── MARKET STALLS ─────────────────────────────────────────────

const MARKET_STALLS = [
  {
    id:'sera_stall', name:"Sera's Stall", emoji:'🧑‍🦳',
    sells:[
      { itemId:'fruit',      cost:{red:1},  label:'Fresh Fruit 🍎' },
      { itemId:'honey',      cost:{red:2},  label:'Local Honey 🍯' },
      { itemId:'spice_herb', cost:{red:1},  label:'Spice Herbs 🌶️' },
      { itemId:'clay_brick', cost:{red:2},  label:'Clay Bricks 🧱 (from the kiln)' },
    ],
    buys:['simple_bread','herb_bundle','spiced_rolls','fruit_preserve'],
  },
  {
    id:'tool_stall', name:'Tool Vendor', emoji:'🔨',
    sells:[
      { itemId:'useful_tool',  cost:{red:2},  label:'Small Tool 🔨' },
      { itemId:'oil',          cost:{red:1},  label:'Pressed Oil 🫙' },
      { itemId:'iron_fitting', cost:{blue:1}, label:'Iron Fittings 🔩' },
      { itemId:'timber',       cost:{red:3},  label:'Dressed Timber 🪵' },
    ],
    buys:['cloth_scrap','timber','stone_block'],
  },
  {
    id:'fabric_stall', name:'Fabric Stall', emoji:'🧵',
    sells:[
      { itemId:'cloth_scrap', cost:{red:1}, label:'Cloth Scrap 🧵' },
    ],
    buys:['fruit','common_herb'],
  },
  {
    // Travelling trader — only appears on market day, sells rare items
    id:'trader_stall', name:'Travelling Trader', emoji:'🧳',
    sells:[
      { itemId:'glass_piece', cost:{gold:1}, label:'Glass Pane 🪟 (rare)' },
      { itemId:'stone_block', cost:{red:2},  label:'Cut Stone 🪨' },
    ],
    buys:['healing_tonic','energy_salve'],
  },
  // Inn sells basic supplies any day
  {
    id:'inn_stall', name:'Inn Supplies', emoji:'🍺',
    sells:[
      { itemId:'fruit',         cost:{red:1}, label:'Bowl of fruit 🍎' },
      { itemId:'grain',         cost:{red:1}, label:'Bag of grain 🌾' },
      { itemId:'simple_bread',  cost:{red:2}, label:'Fresh loaf 🍞' },
      { itemId:'mint_herb',     cost:{red:1}, label:'Fresh mint 🫚' },
      { itemId:'morning_tea',   cost:{red:2}, label:'Morning tea blend 🍵' },
    ],
    buys:['fruit','simple_bread','herb_bundle'],
  },
];
