/**
 * Catalog Data Structure
 * Contains all games and their available cheats
 */

const __catalog_games = {
  pubg_mobile: {
    id        : 'pubg_mobile',
    name      : 'PUBG MOBILE',
    emoji     : '<:pubg:1478923070436806758>',
    platforms: {
      android: {
        id          : 'android',
        name        : 'ANDROID',
        emoji       : '<:android:1479381355342069770>',
        cheats: [
          {
            id          : 'tantedara',
            name        : 'TANTEDARA PLUGIN INDONESIA',
            emoji       : '<:tantedara:1479381425961832500>',
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
            emoji       : '<:kingandroid:1479381392843604106>',
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
            emoji       : '<:shield:1479381416054886531>',
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
        emoji       : '<:ios:1479381366620684470>',
        cheats      : [
          {
            id          : 'king_ios',
            name        : 'KING iOS',
            emoji       : '<:kingios:1479381376523567154>',
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
            emoji       : '<:oasis:1479381403878690900>',
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
    emoji : '<:mlbb:1478923159758438511>',
    status: 'coming_soon'
  },
  free_fire: {
    id    : 'free_fire',
    name  : 'FREE FIRE',
    emoji : '<:ff:1478923235151183970>',
    status: 'coming_soon'
  },
  valorant_mobile: {
    id    : 'valorant_mobile',
    name  : 'VALORANT MOBILE',
    emoji : '<:valom:1478923497559560293>',
    status: 'coming_soon'
  },
  delta_force_mobile: {
    id    : 'delta_force_mobile',
    name  : 'DELTA FORCE MOBILE',
    emoji : '<:dfm:1478923509949530265>',
    status: 'coming_soon'
  },
  blood_strike: {
    id    : 'blood_strike',
    name  : 'BLOOD STRIKE',
    emoji : '<:bloodstrike:1478923684080259365>',
    status: 'coming_soon'
  },
  cod_mobile: {
    id    : 'cod_mobile',
    name  : 'CALL OF DUTY MOBILE',
    emoji : '<:codm:1478923521072562358>',
    status: 'coming_soon'
  },
  ball_pool: {
    id    : 'ball_pool',
    name  : '8 BALL POOL',
    emoji : '<:8bp:1478923764485066832>',
    status: 'coming_soon'
  },
  cross_fire: {
    id    : 'cross_fire',
    name  : 'CROSS FIRE',
    emoji : '<:crossfire:1478924029976121364>',
    status: 'coming_soon'
  },
  honor_of_kings: {
    id    : 'honor_of_kings',
    name  : 'HONOR OF KINGS',
    emoji : '<:hok:1478924442381062174>',
    status: 'coming_soon'
  },
  arena_of_valor: {
    id    : 'arena_of_valor',
    name  : 'ARENA OF VALOR',
    emoji : '<:aovstorenew:1478924461888635053>',
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
