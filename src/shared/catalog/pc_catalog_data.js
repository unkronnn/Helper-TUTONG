/**
 * PC Catalog Data Structure
 * Contains all PC games and their available cheats
 */

const __pc_catalog_games = {
  apex_legends: {
    id          : 'apex_legends',
    name        : 'APEX LEGENDS',
    emoji       : '<:apexlegend:1480454585004064969>',
    description: 'Apex Legends - PC Game',
    cheats      : [
      {
        id          : 'btg_apex',
        name        : 'BTG : APEX LEGEND',
        emoji       : '<:btg:1480454682492010587>',
        description: 'A premium product for the game Apex Legend from Break The Game group',
        features    : [
          '**Visual**',
          '• Skeleton players',
          '• 2D Boxes Players',
          '• Filled Boxes Players',
          '• Lines Players',
          '• Distance Players',
          '• NickNames Players',
          '• Distance to draw Items',
          '• Draw spectators count',
          '• Armor Bar',
          '• Text background',
          '• Distance to draw ESP',
          '',
          '**Aim**',
          '• Enable Aim Bot',
          '• Aim Bone',
          '• FOV Size',
          '• Button',
          '• Distance',
          '• Aim Speed',
          '• Draw Aim FOV',
          '',
          '**Loot**',
          '• Resource, BackPacks, Food',
          '• Weapon, Ammo, Traps',
          '• Hemps, Barrels, Medical Items',
          '• Container, Doors, Boxes',
          '• Deployables, Turrets, Stashes',
          '• Vehicles, Tools, Clothes, Animals',
          '',
          '**Others**',
          '• Show/hide program menu',
          '• Language switching'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2, 25H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT',
          bios      : 'UEFI',
          type      : 'External'
        },
        additional  : [
          'Supported Resolutions: Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Steam'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 96.250', price_usd: '$5.50'  },
          { duration: '7 DAY',  price_idr: 'IDR 218.750', price_usd: '$13.00' },
          { duration: '30 DAY', price_idr: 'IDR 506.750', price_usd: '$30.00' }
        ]
      },
      {
        id          : 'ancient_apex',
        name        : 'ANCIENT : APEX LEGEND',
        emoji       : '<:ancien:1480441500700643390>',
        description: 'A premium product for the game Apex Legend from Ancient group',
        features    : [
          '**Aim (Aimbot)**',
          '• Enable, Ignore Knocked, Aim Only Visible',
          '• Draw FOV, FOV (slider), Aim Bind',
          '• Smooth (slider), Second Aim Bind',
          '• Second Smooth (slider)',
          '',
          '**Aim (Misc)**',
          '• Lock Target',
          '• Aim Bone (Head, Neck, Chest, Stomach, Nearest)',
          '• RCS Pitch (slider), RCS Yaw (slider)',
          '',
          '**Aim (Triggerbot)**',
          '• Enable, Trigger Bind',
          '• Trigger Delay (slider)',
          '• Trigger Distance (slider)',
          '',
          '**Visual (ESP)**',
          '• Render Distance (slider)',
          '• Draw Box, Knocked, Skeleton, Glow',
          '• Draw Name, Distance, Health, Shield',
          '• Draw Weapon, Offscreen, Info, Seer',
          '',
          '**Visual (Style)**',
          '• Box Type, Text Background, Kills',
          '• Draw Rank, Lvl, Team',
          '• Offscreen Range, Glow Type',
          '• Skeleton Thickness, Seer Type',
          '• Seer Distance, Weapon Type',
          '',
          '**Loot (ESP)**',
          '• Enable, Draw Icon, Name, Lobe, Glow',
          '• Draw Death Box, Distance, Render Distance',
          '',
          '**Loot (Style)**',
          '• Text Background, Icon Size',
          '• Icon Type, Glow Type',
          '',
          '**Loot (Category)**',
          '• Weapon, Gear, Regen, Attachment, Ammo',
          '• Special, Smart Loot',
          '',
          '**Misc**',
          '• FOV Changer, Auto Grapple',
          '• Auto Wall Jump, Auto Super Glide',
          '• Auto Tap Strafe, Big Map Radar',
          '• Spectator Count, Battle Mode Key',
          '• FOV Scale, FPS Limit, Show FPS',
          '',
          '**Config**',
          '• Save cfg, Load cfg, Create cfg'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2)',
          graphics  : 'Nvidia & AMD (1000 series+)',
          disk      : 'GPT',
          bios      : 'UEFI',
          type      : 'External'
        },
        additional  : [
          'Supported Resolutions: Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Steam & EA App',
          'In-built Spoofer: Yes'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 60.500', price_usd: '$3.50'  },
          { duration: '7 DAY',  price_idr: 'IDR 276.500', price_usd: '$16.00' },
          { duration: '30 DAY', price_idr: 'IDR 540.250', price_usd: '$32.00' }
        ]
      },
      {
        id          : 'phoenix_apex',
        name        : 'PHOENIX : APEX GLOW',
        emoji       : '<:phoenix:1480454623470031001>',
        description: 'A premium product for the game Apex Legend from Phoenix group',
        features    : [
          '**Visual**',
          '• X-ray (wallhack)'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT & MBR',
          bios      : 'UEFI & Legacy',
          type      : 'Internal'
        },
        additional  : [
          'Supported Resolutions: Fullscreen, Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: No',
          'Game Client: Steam, Origin & EA',
          'In-built Spoofer: Yes'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 30.000', price_usd: '$1.80'  },
          { duration: '7 DAY',  price_idr: 'IDR 100.500', price_usd: '$6.00'  },
          { duration: '30 DAY', price_idr: 'IDR 230.000', price_usd: '$13.00' }
        ]
      },
      {
        id          : 'fecurity_apex',
        name        : 'FECERITY : APEX LEGEND',
        emoji       : '<:fecurity:1480441522456494101>',
        description: 'A premium product for the game Apex Legend from Fecurity group',
        features    : [
          '**Aim**',
          '• Enable/disable checkbox',
          '• Aim at shoot, Visible check',
          '• Enemy only',
          '• Controllable horizontal & vertical speed (0 - 30°)',
          '• Changeable FOV (0 - 15°)',
          '• Recoil compensation, Draw FOV',
          '• Target switch delay',
          '• Unique hitbox system',
          '',
          '**Visual (Players)**',
          '• Enable/disable checkbox',
          '• Enemy only, Box, Box outline',
          '• Health, Shield, Skeleton',
          '• Maximum distance',
          '• Player info (nickname, distance, weapon)',
          '',
          '**Visual (Loot)**',
          '• Enable/disable checkbox',
          '• Maximum distance',
          '• Categories (ammo, shotguns, snipers, etc.)',
          '• Loot ESP keybind',
          '',
          '**Visual (Misc)**',
          '• Nightmode, Nightmode factor (0 - 5)',
          '• Camera FOV changer (0 - 5.5)',
          '• Freecam, Freecam keybind',
          '',
          '**Misc**',
          '• Developer Mode, Menu Key, Menu DPI',
          '• Force Reload, Cache Delay',
          '• Different distance units (meters, yards, feet)'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2, 25H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT & MBR',
          bios      : 'UEFI',
          type      : 'Hybrid'
        },
        additional  : [
          'Supported Resolutions: Fullscreen, Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Steam, Origin & EA',
          'In-built Spoofer: Yes'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 80.000', price_usd: '$4.50'  },
          { duration: '7 DAY',  price_idr: 'IDR 341.500', price_usd: '$20.00' },
          { duration: '30 DAY', price_idr: 'IDR 582.750', price_usd: '$35.00' }
        ]
      },
      {
        id          : 'lexy_apex',
        name        : 'LEXY : APEX LEGEND',
        emoji       : '<:lex:1480454610115231764>',
        description: 'A premium product for the game Apex Legend from Lexy group',
        features    : [
          '**Features**',
          '• Please check the available media for a list of features!'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT & MBR',
          bios      : 'UEFI & Legacy',
          type      : 'External'
        },
        additional  : [
          'Supported Resolutions: Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Steam & Epic Games',
          'In-built Spoofer: Yes'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 144.500', price_usd: '$8.50'  },
          { duration: '7 DAY',  price_idr: 'IDR 411.000', price_usd: '$24.00' },
          { duration: '30 DAY', price_idr: 'IDR 935.500', price_usd: '$56.00' }
        ]
      },
      {
        id          : 'stern_apex',
        name        : 'STERN : APEX LEGEND',
        emoji       : '<:stern:1480454633733488781>',
        description: 'A premium product for the game Apex Legend from Stern group',
        features    : [
          '**Aim**',
          '• Aimbot, Visibility check',
          '• Changeable Bone, Custom FOV',
          '• Custom Smooth, Circle FOV',
          '• Ignore Knocked, Maximum Distance',
          '',
          '**Visual**',
          '• 2D Box ESP, Corner Box ESP',
          '• Seer Health, Skeleton',
          '• Distance ESP, Name ESP',
          '• Health Bar, Shield Bar',
          '• Tracers ESP, Player Glow',
          '• Visible Check',
          '',
          '**Misc**',
          '• Spectator Count, Skin Changer',
          '• Freecam, Instant Grapple'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT',
          bios      : 'UEFI',
          type      : 'External'
        },
        additional  : [
          'Supported Resolutions: Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Steam & Epic Games'
        ],
        prices      : [
          { duration: '1 DAY',   price_idr: 'IDR 81.000',   price_usd: '$4.55'  },
          { duration: '7 DAY',   price_idr: 'IDR 182.500',  price_usd: '$10.27' },
          { duration: '30 DAY',  price_idr: 'IDR 370.750',  price_usd: '$21.68' },
          { duration: 'LIFETIME', price_idr: 'IDR 1.931.250', price_usd: '$112.96' }
        ]
      }
    ]
  },
  arc_raiders: {
    id          : 'arc_raiders',
    name        : 'ARC RAIDERS',
    emoji       : '<:arcraiders:1480441487920463922>',
    description: 'Arc Raiders - PC Game',
    cheats      : [
      {
        id          : 'fecurity_arc',
        name        : 'FECERITY : ARC RAIDERS',
        emoji       : '<:fecurity:1480441522456494101>',
        description: 'A premium product for the game ARC Raiders from Fecurity group',
        features    : [
          '**Aim**',
          '• Aim at shoot',
          '• Visible only',
          '• Enemy only',
          '• Recoil compensation',
          '• Draw FOV',
          '• Unique hitbox system',
          '• Controllable speed (0 - 30°)',
          '• Changeable fov (0 - 15°)',
          '',
          '**Visual**',
          '• Enemy only',
          '• Box',
          '• Box outline',
          '• Health',
          '• Skeleton',
          '• Maximum Distance',
          '• Player info'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT & MBR',
          bios      : 'UEFI',
          type      : 'Hybrid'
        },
        additional  : [
          'Supported AIO/Bundle: The Finals',
          'Supported Resolutions: Fullscreen, Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'In-built Spoofer: Yes'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 100.000', price_usd: '$6.00'   },
          { duration: '7 DAY',  price_idr: 'IDR 512.000', price_usd: '$30.00'  },
          { duration: '30 DAY', price_idr: 'IDR 1.082.250', price_usd: '$65.00' }
        ]
      },
      {
        id          : 'crooked_arc',
        name        : 'CROOKED ARM\'S : ARC RAIDERS',
        emoji       : '<:crocked:1480441511391793184>',
        description: 'A premium product for the game Arc Raiders from Crooked Arm\'s group',
        features    : [
          '**Players**',
          '• Only visible',
          '• My team players',
          '• Name, Line, Health',
          '• Box type, Skeleton',
          '• Size line skeleton',
          '• Skeleton draw distance',
          '• Distance, Display distance',
          '',
          '**Bots**',
          '• 3D Box',
          '• Name & Distance',
          '• Display distance',
          '',
          '**Aimbot**',
          '• Enable human aimbot (Danger)',
          '• Visibility check',
          '• Aiming at knocked players',
          '• Lock target',
          '• Target switch delay',
          '• AIM Preset',
          '• Smooth, Jitter, Inertia',
          '• Draw fov circle',
          '• Bones selection (Head, Neck, Body, etc.)',
          '',
          '**Radar**',
          '• Enable radar',
          '• Show robots',
          '• Position & Size controls',
          '',
          '**Loot**',
          '• Containers, Raiders, Arc',
          '• All item types supported',
          '• Display distance'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2, 25H2)',
          graphics  : 'Nvidia & AMD',
          disk      : 'GPT',
          bios      : 'UEFI',
          type      : 'External'
        },
        additional  : [
          'Supported Resolutions: Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Steam & Official Launcher',
          'Run from flash drive: Yes'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 116.750', price_usd: '$7.00'  },
          { duration: '7 DAY',  price_idr: 'IDR 445.250', price_usd: '$26.00' },
          { duration: '31 DAY', price_idr: 'IDR 822.750', price_usd: '$49.00' }
        ]
      },
      {
        id          : 'ancient_arc',
        name        : 'ANCIENT : ARC RAIDERS',
        emoji       : '<:ancien:1480441500700643390>',
        description: 'A premium product for the game Arc Raiders from Ancient group',
        features    : [
          '**Aimbot**',
          '• Enable',
          '• Aim Key',
          '• Aim Type: Mouse; Memory',
          '• Smooth (slider)',
          '• Draw Fov',
          '• Fov Radius (slider)',
          '• Prediction',
          '• Prediction Dot',
          '• Target Line',
          '• Target Lock',
          '• Vischeck',
          '• Max Aim Distance',
          '• Target Bones',
          '',
          '**Visual (Players)**',
          '• Name (visible and invisible color)',
          '• Box (visible and invisible color)',
          '• Skeleton (visible and invisible color)',
          '• Squad (visible and invisible color)',
          '• Distance (visible and invisible color)',
          '• Health, Armor',
          '• Max Distance',
          '• Enable Arrows',
          '• Battle Mode key',
          '',
          '**Visual Loot**',
          '• Dropped items, Corpse, Salvage',
          '• Carryable, Supply Station',
          '• Draw Dot, Name, Color',
          '• Draw Distance',
          '',
          '**Radar**',
          '• Enable Radar',
          '• Radar Scale',
          '• Max Show Distance',
          '',
          '**World (Crates, Drones)**',
          '• Enable',
          '• Draw Dot, Name, Color',
          '• Draw Distance',
          '',
          '**Config**',
          '• Add, Load, Share, Delete'
        ],
        system      : {
          processors: 'Intel & AMD',
          os        : 'Windows 10 (all build) & 11 (build 21H2, 22H2, 23H2, 24H2, 25H2)',
          graphics  : 'Nvidia & AMD (1000 series+)',
          disk      : 'GPT',
          bios      : 'UEFI',
          type      : 'External'
        },
        additional  : [
          'Supported Resolutions: Borderless & Windowed',
          'Supported Game Mode: Any',
          'StreamProof: Yes',
          'Game Client: Any Platform'
        ],
        prices      : [
          { duration: '1 DAY',  price_idr: 'IDR 80.500', price_usd: '$4.50'  },
          { duration: '7 DAY',  price_idr: 'IDR 368.500', price_usd: '$22.00' },
          { duration: '30 DAY', price_idr: 'IDR 720.250', price_usd: '$43.00' }
        ]
      }
    ]
  }
};

/**
 * Get all available PC games
 * @return {Array} Array of game objects
 */
function get_all_pc_games() {
  return Object.values(__pc_catalog_games);
}

/**
 * Get PC game by ID
 * @param {string} game_id
 * @return {Object|null} Game object or null
 */
function get_pc_game_by_id(game_id) {
  return __pc_catalog_games[game_id] || null;
}

/**
 * Get cheat details for PC game
 * @param {string} game_id
 * @param {string} cheat_id
 * @return {Object|null} Cheat object or null
 */
function get_pc_cheat(game_id, cheat_id) {
  const game = get_pc_game_by_id(game_id);
  if (!game || !game.cheats) {
    return null;
  }
  return game.cheats.find(c => c.id === cheat_id) || null;
}

module.exports = {
  __pc_catalog_games,
  get_all_pc_games,
  get_pc_game_by_id,
  get_pc_cheat
};
