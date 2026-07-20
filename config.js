const CONFIG = {
  // 1. Convex Config (Replaces Supabase)
  convex: {
    url: 'https://canny-bird-190.convex.cloud' // Replace with your actual Convex URL!
  },
  
  // 2. Server Config
  server: {
    ip: 'mazerclub.net',
    icon: 'icon/mazer.png',
    name: 'mazer'
  },
  
  // 3. Discord Config
  discord: {
    url: 'https://discord.gg/RQcJjxctYr', 
    links: [
      { key: 'burberrysmp', label: 'BurberrySMP', icon: 'icon/berry.png', url: 'https://discord.burberry.cc.cd' },
      { key: 'crackedtiers', label: 'CrackedTiers', icon: 'icon/website.png', url: 'https://discord.gg/bBrQ3b5AzQ' }
    ]
  },
  
  // 4. Call To Action Config
  cta: {
    title: 'Ready to Get Ranked?',
    desc: 'Join thousands of cracked players competing on CDTiers. View the leaderboard or jump into our Discord to get tested today.',
    btn1Text: 'View Full Rankings',
    btn1Link: '/index',
    btn2Text: 'Join Discord',
    btn2Link: 'https://discord.gg/bBrQ3b5AzQ' 
  }
};

// Expose to window
window.CONFIG = CONFIG;
console.log('✅ config.js loaded:', CONFIG);
