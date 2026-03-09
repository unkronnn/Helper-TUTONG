/**
 * PC Catalog Data Structure
 * Contains all PC games and their available cheats
 */

const __pc_catalog_games = {
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
