/**
 * Bypass Valorant Data Structure
 * Contains all Valorant bypass services
 */

const __bypass_val_services = {
  insolence: {
    id          : 'insolence',
    name        : 'INSOLENCE | VG Emulator',
    emoji       : '<:insolence:1480503171188002928>',
    description: 'VG Emulator - Hardware & Identity Spoofing',
    features    : [
      '**Hardware & Identity Spoofing**',
      '• Play safely on banned PCs — No spoofing, No traces, No hardware flags',
      '• Bypass 152 instantly — Just launch and play, even if you\'re blacklisted',
      '• No more delay bans — Whether 5 mins or 5 hours later, you\'re safe',
      '• Disable all popups — From driver nags, TPM, to OS checks (even works on Windows 7)',
      '• Bypass cheat detection fully — Internal, external, "sext" hacks? Go wild. Zero risk',
      '• 1-Click Setup — You\'ll be inside the game before your coffee is done brewing',
      '',
      '**Additional Features**',
      '• NO NEED TO BUY SPOOFER, CHEATS, NO ANNOYING REINSTALL',
      '• WINDOWS anymore ever ever',
      '• NO NEED RESTART VALO EVERY MATCH!',
      '• LoL EMU INCLUDED AS WELL IN THIS (VALO+LoL)'
    ],
    system      : {
      processors: 'Intel & AMD',
      os        : 'Windows 10-11'
    },
    highlights  : [
      'Fully Undetected & Long Proof',
      'Tournament Ready'
    ],
    prices      : [
      { duration: '30 Days', price_idr: 'Rp 4.500.000', price_usd: '$255' }
    ]
  },
  draskovic: {
    id          : 'draskovic',
    name        : 'DRASKOVIC | EMULATOR VALORANT',
    emoji       : '<:snapcat:1480503160102715412>',
    description: 'Emulator Valorant - Hardware & Identity Spoofing + Cheat Included',
    features    : [
      '**Hardware & Identity Spoofing**',
      '• Bypass POP UP / SC BOOT',
      '• TPM & HVCI Bypass',
      '• Remove Delay Ban',
      '• Can Use Detected Cheat Without Instant Ban',
      '• NO NEED Close Valorant After Pick Agent',
      '• NO Error 102 / NO Random Kick',
      '',
      '**Additional Features**',
      '• Cheat Included'
    ],
    system      : {
      processors: 'Intel & AMD',
      os        : 'Windows 10-11'
    },
    highlights  : [
      'Fully Undetected & Long Proof',
      'Tournament Ready'
    ],
    prices      : [
      { duration: '3 Days',   price_idr: 'Rp 180.000',  price_usd: '$15'  },
      { duration: '7 Days',   price_idr: 'Rp 250.000',  price_usd: '$25'  },
      { duration: '30 Days',  price_idr: 'Rp 550.000',  price_usd: '$40'  },
      { duration: 'Lifetime', price_idr: 'Rp 1.200.000', price_usd: '$80'  }
    ]
  }
};

/**
 * Get all bypass services
 * @return {Array} Array of service objects
 */
function get_all_bypass_services() {
  return Object.values(__bypass_val_services);
}

/**
 * Get service by ID
 * @param {string} service_id
 * @return {Object|null} Service object or null
 */
function get_bypass_service_by_id(service_id) {
  return __bypass_val_services[service_id] || null;
}

module.exports = {
  __bypass_val_services,
  get_all_bypass_services,
  get_bypass_service_by_id
};
