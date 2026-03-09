/**
 * Catalog Data Structure
 * Contains all games and their available cheats
 */

const __catalog_games = {
  pubg_mobile: {
    id        : 'pubg_mobile',
    name      : 'PUBG MOBILE',
    emoji     : '<:pubg:1480374737833037844>',
    platforms: {
      android: {
        id          : 'android',
        name        : 'ANDROID',
        emoji       : '<:android:1480374496119750676>',
        cheats: [
          {
            id          : 'tantedara',
            name        : 'TANTEDARA PLUGIN INDONESIA',
            emoji       : '<:tantedara:1480374560611373116>',
            description: 'Plugin Indonesia untuk PUBG Mobile Android',
            features    : [
              'ESP',
              'Aimbot',
              'Anti-Ban'
            ],
            prices      : [
              { duration: '3 Days',  price: '70k'  },
              { duration: '7 Days',  price: '120k' },
              { duration: '10 Days', price: '150k' },
              { duration: '30 Days', price: '250k' }
            ]
          },
          {
            id          : 'king_android',
            name        : 'KING Android',
            emoji       : '<:kingandroid:1480374529871183872>',
            description: 'Key Suport KING Android ( Non Root & Root )',
            features    : [
              'ESP | AIMBOT',
              'Bullet Tracking',
              'Skin Hack (Full Efect)'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 350.000' }
            ]
          },
          {
            id          : 'shield',
            name        : 'SHIELD',
            emoji       : '<:shield:1480374551094493224>',
            description: 'Global | KR | VN | TW - Loader ( Non Root )',
            features    : [
              'ESP | Aimbot Smoth Aim',
              'Recoil Compensation | Bullet Speed',
              'IPAD View | Hide ESP Recording',
              'Fight Mode (Aim Full power)'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 130.000' },
              { duration: '30 days', price: 'Rp 280.000' }
            ]
          }
        ]
      },
      ios: {
        id          : 'ios',
        name        : 'IOS',
        emoji       : '<:apple:1480382759620055090>',
        cheats      : [
          {
            id          : 'king_ios',
            name        : 'KING iOS',
            emoji       : '<:kingios:1480374517355253762>',
            description: 'PUBG iOS - GL / KR / VNG / TW (IPA)',
            features    : [
              'ESP',
              'Aimbot / Bullet Tracking',
              'Skin Hack Full Efek',
              'Hide ESP Recording ( Menyembunyikan Cheat saat merekam layar / Live )'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 350.000' }
            ]
          },
          {
            id          : 'oasis',
            name        : 'OASIS iOS',
            emoji       : '<:oasis:1480374540189302927>',
            description: 'PUBG Global | Korea | Vietnam - ( IPA )',
            features    : [
              'ESP | Aimbot',
              'Recoil Compensation',
              'Skin & Kill Message',
              'Hide ESP Recording / Live'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 65.000' },
              { duration: '7 days', price: 'Rp 180.000' },
              { duration: '30 days', price: 'Rp 380.000' }
            ]
          }
        ]
      }
    }
  },
  mobile_legends: {
    id    : 'mobile_legends',
    name  : 'MOBILE LEGENDS',
    emoji : '<:mlbb:1480374722607972495>',
    platforms: {
      android: {
        id          : 'android',
        name        : 'ANDROID',
        emoji       : '<:android:1480374496119750676>',
        cheats      : [
          {
            id          : 'morella',
            name        : 'MORELLA MLBB',
            emoji       : '<:morella:1480389787339849811>',
            description: 'Mobile Legends - Android (Non Root & Root)',
            features    : [
              'MapHack',
              'Drone View',
              'Aimbot',
              'Auto Skills',
              'ESP'
            ],
            prices      : [
              { duration: '3 days',  price: 'Rp 30.000' },
              { duration: '7 days',  price: 'Rp 50.000' },
              { duration: '30 days', price: 'Rp 100.000' },
              { duration: '60 days', price: 'Rp 180.000' },
              { duration: '90 days', price: 'Rp 270.000' }
            ]
          },
          {
            id          : 'pulse',
            name        : 'PULSE MLBB',
            emoji       : '<:pulse:1480389802489806889>',
            description: 'Mobile Legends - Android (Non Root & Root)',
            features    : [
              'MapHack',
              'Drone View',
              'Aimbot',
              'Auto Skills',
              'ESP'
            ],
            prices      : [
              { duration: '3 days',  price: 'Rp 30.000' },
              { duration: '7 days',  price: 'Rp 50.000' },
              { duration: '30 days', price: 'Rp 100.000' },
              { duration: '60 days', price: 'Rp 180.000' },
              { duration: '90 days', price: 'Rp 270.000' }
            ]
          }
        ]
      },
      ios: {
        id          : 'ios',
        name        : 'IOS',
        emoji       : '<:apple:1480382759620055090>',
        cheats      : [
          {
            id          : 'fluorite',
            name        : 'FLUORITE MLBB iOS',
            emoji       : '<:fluorite:1480389775151206620>',
            description: 'Mobile Legends - iOS (IPA)',
            features    : [
              'MapHack (Mini Map)',
              'Drone View Camera',
              'Aimbot / Auto Aim Skill (All Hero)',
              'Auto Retribution',
              'ESP Line, Box, Name dll',
              'Info Cooldown',
              'Room Info',
              'Hide ESP Recording'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 50.000' },
              { duration: '7 days', price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 350.000' }
            ]
          }
        ]
      }
    }
  },
  free_fire: {
    id    : 'free_fire',
    name  : 'FREE FIRE',
    emoji : '<:ff:1480374695202394345>',
    platforms: {
      android: {
        id          : 'android',
        name        : 'ANDROID',
        emoji       : '<:android:1480374496119750676>',
        cheats      : [
          {
            id          : 'drip_non_root',
            name        : 'DRIP FF NON ROOT',
            emoji       : '<:dripnorot:1480393370789613588>',
            description: 'Free Fire Max - Android (Non Root)',
            features    : [
              'ESP LINE | Aim Skill',
              'Fly Jump',
              'Aim Skill Cover | Speed Time',
              'Teleport 8M | Auto Swap',
              'GhostHack | Change Fire Color'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 120.000' },
              { duration: '15 days', price: 'Rp 180.000' },
              { duration: '30 days', price: 'Rp 250.000' }
            ]
          },
          {
            id          : 'drip_root',
            name        : 'DRIP FF ROOT',
            emoji       : '<:driprot:1480393381757849741>',
            description: 'Free Fire Max - Android (Root)',
            features    : [
              'ESP',
              'Aimbot',
              'Fly Hack',
              'Speed Hack',
              'Teleport'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 120.000' },
              { duration: '30 days', price: 'Rp 250.000' }
            ]
          },
          {
            id          : 'hg_ff',
            name        : 'HG FF ANDROID',
            emoji       : '<:HGFF:1480393351974097017>',
            description: 'Free Fire Max - Android (Non Root & Root)',
            features    : [
              'ESP',
              'Aimbot',
              'Auto Headshot',
              'Fly Hack',
              'Speed Hack'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days',  price: 'Rp 60.000' },
              { duration: '10 days', price: 'Rp 80.000' },
              { duration: '30 days', price: 'Rp 150.000' }
            ]
          }
        ]
      },
      ios: {
        id          : 'ios',
        name        : 'IOS',
        emoji       : '<:apple:1480382759620055090>',
        cheats      : [
          {
            id          : 'fluorite_ff',
            name        : 'FLUORITE FF iOS',
            emoji       : '<:fluorite:1480389775151206620>',
            description: 'Free Fire - iOS (IPA)',
            features    : [
              'ESP | Line, Box, Name, Health dll',
              'Aimbot Fov / Auto Aim',
              'Less Recoil',
              'Fast Weapon Swap',
              '120FPS',
              'Reset Guest',
              'Hide ESP Recording / Live'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 50.000' },
              { duration: '7 days', price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 350.000' }
            ]
          },
          {
            id          : 'gbd_ff_pro',
            name        : 'GBD FF iOS (PRO)',
            emoji       : '<:gbdff:1480393392923086848>',
            description: 'Free Fire - iOS (IPA) Extra Aim Kill Features',
            features    : [
              'ESP | Line, Box, Name, Health dll',
              'Aimbot Fov / Auto Aim',
              'Extra Aim Kill Features',
              'Less Recoil',
              'Fast Weapon Swap',
              '120FPS',
              'Reset Guest',
              'Hide ESP Recording / Live'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 50.000' },
              { duration: '7 days', price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 280.000' }
            ]
          },
          {
            id          : 'gbd_ff',
            name        : 'GBD FREE FIRE iOS',
            emoji       : '<:gbdffnopro:1480393405199679710>',
            description: 'Free Fire - iOS (IPA)',
            features    : [
              'ESP | Line, Box, Name, Health dll',
              'Aimbot Fov / Auto Aim',
              'Less Recoil',
              'Fast Weapon Swap',
              '120FPS',
              'Reset Guest',
              'Hide ESP Recording / Live'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 120.000' },
              { duration: '30 days', price: 'Rp 250.000' }
            ]
          }
        ]
      }
    }
  },
  valorant_mobile: {
    id    : 'valorant_mobile',
    name  : 'VALORANT MOBILE',
    emoji : '<:valom:1480374754090422393>',
    status: 'coming_soon'
  },
  delta_force_mobile: {
    id    : 'delta_force_mobile',
    name  : 'DELTA FORCE MOBILE',
    emoji : '<:dfm:1480374681549799537>',
    platforms: {
      android: {
        id          : 'android',
        name        : 'ANDROID',
        emoji       : '<:android:1480374496119750676>',
        cheats      : [
          {
            id          : 'xproject',
            name        : 'XPROJECT DFM - ROOT',
            emoji       : '<:xproject:1480395619242868786>',
            description: 'Garena & Global - Android (Root)',
            features    : [
              'ESP | Aimbot',
              'Auto Prediction'
            ],
            prices      : [
              { duration: '7 days',  price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 380.000' }
            ]
          },
          {
            id          : 'zolo',
            name        : 'ZOLO Android',
            emoji       : '<:zolo:1480395652709220382>',
            description: 'Support PUBG & DFM - Android (Non Root & Root)',
            features    : [
              'ESP | Wide View',
              'Aimbot (Temporarly hidden)'
            ],
            prices      : [
              { duration: '1 day',   price: 'Rp 25.000' },
              { duration: '3 days',  price: 'Rp 50.000' },
              { duration: '7 days',  price: 'Rp 80.000' },
              { duration: '14 days', price: 'Rp 120.000' },
              { duration: '30 days', price: 'Rp 180.000' },
              { duration: '60 days', price: 'Rp 250.000' }
            ]
          }
        ]
      },
      ios: {
        id          : 'ios',
        name        : 'IOS',
        emoji       : '<:apple:1480382759620055090>',
        cheats      : [
          {
            id          : 'dragon_dfm',
            name        : 'DRAGON DFM iOS',
            emoji       : '<:dragondfm:1480395579602505749>',
            description: 'DFM Garena & Global - iOS (IPA/Link)',
            features    : [
              'ESP',
              'Aimbot',
              'No Recoil',
              'Speed Hack'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 50.000' },
              { duration: '7 days', price: 'Rp 150.000' },
              { duration: '30 days', price: 'Rp 280.000' }
            ]
          },
          {
            id          : 'ninja_dfm',
            name        : 'NINJA DFM - ROOT',
            emoji       : '<:ninjadfm:1480395601991565312>',
            description: 'Garena & Chinese - Loader (Root)',
            features    : [
              'ESP | Aim Touch',
              'Recoil Compensation',
              'Hide ESP Recording / Live'
            ],
            prices      : [
              { duration: '1 day',  price: 'Rp 40.000' },
              { duration: '7 days', price: 'Rp 120.000' },
              { duration: '30 days', price: 'Rp 280.000' }
            ]
          }
        ]
      }
    }
  },
  blood_strike: {
    id    : 'blood_strike',
    name  : 'BLOOD STRIKE',
    emoji : '<:bloodstrike:1480374640034578534>',
    status: 'coming_soon'
  },
  cod_mobile: {
    id    : 'cod_mobile',
    name  : 'CALL OF DUTY MOBILE',
    emoji : '<:codm:1480374652072235211>',
    status: 'coming_soon'
  },
  ball_pool: {
    id    : 'ball_pool',
    name  : '8 BALL POOL',
    emoji : '<:8bp:1480374598741524603>',
    status: 'coming_soon'
  },
  cross_fire: {
    id    : 'cross_fire',
    name  : 'CROSS FIRE',
    emoji : '<:crossfire:1480374665934405842>',
    status: 'coming_soon'
  },
  honor_of_kings: {
    id    : 'honor_of_kings',
    name  : 'HONOR OF KINGS',
    emoji : '<:hok:1480374708145881088>',
    status: 'coming_soon'
  },
  arena_of_valor: {
    id    : 'arena_of_valor',
    name  : 'ARENA OF VALOR',
    emoji : '<:aovstorenew:1480374628315697163>',
    status: 'coming_soon'
  }
};

/**
 * Get all available games
 * @return {Array} Array of game objects
 */
function get_all_games() {
  return Object.values(__catalog_games);
}

/**
 * Get game by ID
 * @param {string} game_id
 * @return {Object|null} Game object or null
 */
function get_game_by_id(game_id) {
  return __catalog_games[game_id] || null;
}

/**
 * Get platform for a game
 * @param {string} game_id
 * @param {string} platform_id
 * @return {Object|null} Platform object or null
 */
function get_platform(game_id, platform_id) {
  const game = get_game_by_id(game_id);
  if (!game || !game.platforms) {
    return null;
  }
  return game.platforms[platform_id] || null;
}

/**
 * Get cheat details
 * @param {string} game_id
 * @param {string} platform_id
 * @param {string} cheat_id
 * @return {Object|null} Cheat object or null
 */
function get_cheat(game_id, platform_id, cheat_id) {
  const platform = get_platform(game_id, platform_id);
  if (!platform || !platform.cheats) {
    return null;
  }
  return platform.cheats.find(c => c.id === cheat_id) || null;
}

module.exports = {
  __catalog_games,
  get_all_games,
  get_game_by_id,
  get_platform,
  get_cheat
};
