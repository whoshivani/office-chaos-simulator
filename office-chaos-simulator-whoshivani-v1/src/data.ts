import { Hat, Outfit } from './types';

export const HATS: Hat[] = [
  {
    id: 'none',
    name: 'Bare Headed',
    description: 'Just your normal, sweaty corporate hair.',
    requiredScore: 0,
    color: '#000000',
    draw: () => {}
  },
  {
    id: 'paper_bag',
    name: 'Paper Bag of Shame',
    description: 'Anonymity is key when throwing airplanes. Unlocks at 1,000 pts.',
    requiredScore: 1000,
    color: '#c2b280',
    draw: (ctx, x, y, r) => {
      ctx.fillStyle = '#d2b48c';
      ctx.fillRect(x - r * 1.1, y - r * 1.8, r * 2.2, r * 1.5);
      // Eye holes
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(x - r * 0.5, y - r * 1.3, r * 0.3, r * 0.3);
      ctx.fillRect(x + r * 0.2, y - r * 1.3, r * 0.3, r * 0.3);
      // Cut edges
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - r * 1.1, y - r * 1.8, r * 2.2, r * 1.5);
    }
  },
  {
    id: 'propeller',
    name: 'Propeller Beanie',
    description: 'Brings high-altitude aviation vibes. Unlocks at 2,500 pts.',
    requiredScore: 2500,
    color: '#e53e3e',
    draw: (ctx, x, y, r) => {
      // Draw red dome cap
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath();
      ctx.arc(x, y - r * 0.8, r * 1.0, Math.PI, 0, false);
      ctx.fill();
      // Draw yellow brim
      ctx.fillStyle = '#ecc94b';
      ctx.fillRect(x - r * 1.1, y - r * 0.9, r * 2.2, r * 0.2);
      // Propeller shaft
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(x - r * 0.1, y - r * 1.8, r * 0.2, r * 0.4);
      // Propeller blades
      ctx.fillStyle = '#3182ce';
      const time = Date.now() * 0.01;
      const bladeLength = r * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.8);
      ctx.lineTo(x + Math.sin(time) * bladeLength, y - r * 1.8 + Math.cos(time) * r * 0.2);
      ctx.moveTo(x, y - r * 1.8);
      ctx.lineTo(x - Math.sin(time) * bladeLength, y - r * 1.8 - Math.cos(time) * r * 0.2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3182ce';
      ctx.stroke();
    }
  },
  {
    id: 'detective',
    name: 'Detective Fedora',
    description: 'For investigating where the stapler went. Unlocks at 5,000 pts.',
    requiredScore: 5000,
    color: '#4a5568',
    draw: (ctx, x, y, r) => {
      // Draw brim
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(x - r * 1.5, y - r * 0.8, r * 3.0, r * 0.25);
      // Draw crown
      ctx.fillStyle = '#4a5568';
      ctx.beginPath();
      ctx.moveTo(x - r * 1.0, y - r * 0.8);
      ctx.lineTo(x - r * 0.9, y - r * 1.7);
      ctx.lineTo(x, y - r * 1.5); // crease
      ctx.lineTo(x + r * 0.9, y - r * 1.7);
      ctx.lineTo(x + r * 1.0, y - r * 0.8);
      ctx.closePath();
      ctx.fill();
      // Red band
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(x - r * 1.0, y - r * 1.0, r * 2.0, r * 0.2);
    }
  },
  {
    id: 'clown_wig',
    name: 'Clown Wig',
    description: 'Corporate humor has never been sillier. Unlocks at 8,000 pts.',
    requiredScore: 8000,
    color: '#ed64a6',
    draw: (ctx, x, y, r) => {
      ctx.fillStyle = '#ed64a6'; // Pink puffy hair
      // Draw fluffy balls of hair around top of head
      ctx.beginPath();
      ctx.arc(x - r * 0.9, y - r * 0.6, r * 0.6, 0, Math.PI * 2);
      ctx.arc(x + r * 0.9, y - r * 0.6, r * 0.6, 0, Math.PI * 2);
      ctx.arc(x - r * 0.5, y - r * 1.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(x + r * 0.5, y - r * 1.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(x, y - r * 1.4, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Red nose
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath();
      ctx.arc(x, y - r * 0.1, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  {
    id: 'golden_crown',
    name: 'King of Chaos Crown',
    description: 'You rule the water cooler kingdom. Unlocks at 12,000 pts.',
    requiredScore: 12000,
    color: '#ecc94b',
    draw: (ctx, x, y, r) => {
      ctx.fillStyle = '#d69e2e'; // Dark gold
      ctx.beginPath();
      ctx.moveTo(x - r * 1.1, y - r * 0.7);
      ctx.lineTo(x - r * 1.2, y - r * 1.8); // Left tip
      ctx.lineTo(x - r * 0.6, y - r * 1.2); // Dip 1
      ctx.lineTo(x, y - r * 2.1); // Center high tip
      ctx.lineTo(x + r * 0.6, y - r * 1.2); // Dip 2
      ctx.lineTo(x + r * 1.2, y - r * 1.8); // Right tip
      ctx.lineTo(x + r * 1.1, y - r * 0.7);
      ctx.closePath();
      ctx.fill();

      // Jewels
      ctx.fillStyle = '#3182ce'; // Blue center jewel
      ctx.beginPath();
      ctx.arc(x, y - r * 1.2, r * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e53e3e'; // Red left jewel
      ctx.beginPath();
      ctx.arc(x - r * 0.7, y - r * 0.9, r * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38a169'; // Green right jewel
      ctx.beginPath();
      ctx.arc(x + r * 0.7, y - r * 0.9, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
];

export const OUTFITS: Outfit[] = [
  {
    id: 'unpaid_intern',
    name: 'Standard Issue Hoodie',
    description: 'The standard issue hoodie. Lightweight and blend-in ready.',
    requiredScore: 0,
    color: '#cbd5e0',
    accentColor: '#4a5568'
  },
  {
    id: 'casual_friday',
    name: 'Casual Friday Polo',
    description: 'A vibrant polo shirt for maximum air ventilation. Unlocks at 1,500 pts.',
    requiredScore: 1500,
    color: '#3182ce',
    accentColor: '#38a169'
  },
  {
    id: 'manager_suit',
    name: 'Middle Manager Suit',
    description: 'Command respect with a necktie that screams overtime. Unlocks at 4,000 pts.',
    requiredScore: 4000,
    color: '#2d3748',
    accentColor: '#ecc94b'
  },
  {
    id: 'hawaiian_chaos',
    name: 'Hawaiian Friday Shirt',
    description: 'Throw airplanes in tropical, colorful style! Unlocks at 7,500 pts.',
    requiredScore: 7500,
    color: '#f56565',
    accentColor: '#ecc94b'
  },
  {
    id: 'executive_gold',
    name: 'Executive Silk Tuxedo',
    description: 'Gold-woven silk. Show the board who really runs the company. Unlocks at 10,000 pts.',
    requiredScore: 10000,
    color: '#d69e2e',
    accentColor: '#1a202c'
  },
  {
    id: 'invisible_intern',
    name: 'Neon Cyber Suit',
    description: 'Luminous fibers that glow with absolute chaos. Unlocks at 15,000 pts.',
    requiredScore: 15000,
    color: '#00ffcc',
    accentColor: '#ff00ff'
  }
];

export const FIRED_REASONS = [
  "Fired for excessive paper aviation.",
  "Promoted to customer.",
  "Too much creativity for accounting.",
  "Caught throwing staplers at the copy machine.",
  "Turned the water cooler into a brown soda dispenser.",
  "Dipped the boss's car keys in hot fresh coffee.",
  "Jammed all 4 office printers in under a single minute.",
  "Slipped the regional director on a major espresso puddle.",
  "Replaced all critical spreadsheets with ascii art of airplanes.",
  "Refused to 'circle back' or 'take this offline'."
];

// 7 Unique Floor Themes to make the progression feel incredibly deep and engaging!
export interface MapLayout {
  floorNumber: number;
  floorName: string;
  floorDesc: string;
  floorBgColor: string;
  gridLineColor: string;
  lightingColor: string;
  width: number;
  height: number;
  obstacles: { type: string; x: number; y: number; w: number; h: number; data?: any }[];
  coworkerSpawns: { x: number; y: number; name: string }[];
  bossPatrolNodes: { x: number; y: number }[];
  missions: { id: string; description: string; targetValue: number }[];
  missionsAlt?: { id: string; description: string; targetValue: number }[];
}

export const MAPS: MapLayout[] = [
  // Floor 1: Reception Lobby
  {
    floorNumber: 1,
    floorName: "1st Floor: Reception Lobby",
    floorDesc: "Spill coffee at the front desk and hit unsuspecting visitors in the wide-open foyer.",
    floorBgColor: "#f8fafc", // Soft lobby slate blue
    gridLineColor: "#cbd5e1",
    lightingColor: "rgba(250, 204, 21, 0.05)", // Soft amber morning sun
    width: 1300,
    height: 900,
    bossPatrolNodes: [
      { x: 150, y: 150 },
      { x: 1150, y: 150 },
      { x: 1150, y: 750 },
      { x: 150, y: 750 },
    ],
    coworkerSpawns: [
      { x: 250, y: 220, name: "Pam (Receptionist)" },
      { x: 650, y: 350, name: "Bob (Visiting Client)" },
      { x: 1050, y: 220, name: "Meredith (Supplier Relations)" },
      { x: 300, y: 680, name: "Ryan (Visiting Temp)" },
      { x: 950, y: 680, name: "Kelly (Customer Relations)" },
      { x: 250, y: 720, name: "Stanley (Sales Analyst)" },
      { x: 1050, y: 720, name: "Phyllis (Audits)" },
    ],
    obstacles: [
      // Outer walls
      { type: 'WALL', x: 0, y: 0, w: 1300, h: 20 },
      { type: 'WALL', x: 0, y: 880, w: 1300, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 900 },
      { type: 'WALL', x: 1280, y: 0, w: 20, h: 900 },

      // Pam and Meredith's Desks (Top Row)
      { type: 'DESK', x: 200, y: 180, w: 80, h: 40 },
      { type: 'COMPUTER', x: 230, y: 180, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 210, y: 195, w: 8, h: 8 },

      { type: 'DESK', x: 1000, y: 180, w: 80, h: 40 },
      { type: 'COMPUTER', x: 1030, y: 180, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1010, y: 195, w: 8, h: 8 },

      // Stanley and Phyllis's Desks (Bottom Row)
      { type: 'DESK', x: 200, y: 680, w: 80, h: 40 },
      { type: 'COMPUTER', x: 230, y: 680, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 210, y: 695, w: 8, h: 8 },

      { type: 'DESK', x: 1000, y: 680, w: 80, h: 40 },
      { type: 'COMPUTER', x: 1030, y: 680, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1010, y: 695, w: 8, h: 8 },

      // Dedicated Coffee Break Desk
      { type: 'DESK', x: 600, y: 90, w: 100, h: 40 },
      { type: 'COFFEE_MUG', x: 650, y: 105, w: 8, h: 8 },

      // Central Reception Desk
      { type: 'DESK', x: 550, y: 400, w: 200, h: 60 },
      { type: 'COMPUTER', x: 600, y: 400, w: 35, h: 18 },
      { type: 'COFFEE_MUG', x: 670, y: 415, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 570, y: 415, w: 8, h: 8 },

      // Waiting Chairs (Lobby seating)
      { type: 'CONFERENCE_CHAIR', x: 250, y: 450, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 300, y: 450, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 950, y: 450, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 1000, y: 450, w: 25, h: 25 },

      // Printers
      { type: 'PRINTER', x: 50, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 1200, y: 800, w: 50, h: 45 },

      // Water Coolers
      { type: 'WATER_COOLER', x: 50, y: 800, w: 30, h: 50 },
      { type: 'WATER_COOLER', x: 1220, y: 50, w: 30, h: 50 },
    ],
    missions: [
      { id: "hit_coworkers_5", description: "Hit 5 confused coworkers", targetValue: 5 },
      { id: "coffee_spills_3", description: "Cause 3 coffee spills", targetValue: 3 },
      { id: "chaos_points_200", description: "Create 200 chaos points total", targetValue: 200 }
    ],
    missionsAlt: [
      { id: "hit_coworkers_8", description: "Hit 8 distracted employees", targetValue: 8 },
      { id: "coffee_spills_5", description: "Cause 5 coffee spills", targetValue: 5 },
      { id: "chaos_points_350", description: "Create 350 chaos points total", targetValue: 350 }
    ]
  },

  // Floor 2: Cubicle Farm
  {
    floorNumber: 2,
    floorName: "2nd Floor: Cubicle Farm",
    floorDesc: "Navigate narrow labyrinthine cubicle pathways. Watch out for coffee cups on partitions!",
    floorBgColor: "#f1f5f9", // Neutral gray/blue tiles
    gridLineColor: "#e2e8f0",
    lightingColor: "rgba(100, 116, 139, 0.04)", // Sterile fluorescent white
    width: 1400,
    height: 1000,
    bossPatrolNodes: [
      { x: 100, y: 100 },
      { x: 1300, y: 100 },
      { x: 1300, y: 900 },
      { x: 700, y: 900 },
      { x: 700, y: 500 },
      { x: 100, y: 500 },
    ],
    coworkerSpawns: [
      { x: 250, y: 250, name: "Dwight (Sales Leader - HR)" },
      { x: 550, y: 250, name: "Angela (Accounting - HR)" },
      { x: 1150, y: 250, name: "Jim (Marketing Guru)" },
      { x: 250, y: 810, name: "Kevin (Finance Expert)" },
      { x: 850, y: 810, name: "Oscar (Audits - HR)" },
      { x: 1150, y: 810, name: "Toby (HR Specialist - HR)" },
    ],
    obstacles: [
      // Outer walls
      { type: 'WALL', x: 0, y: 0, w: 1400, h: 20 },
      { type: 'WALL', x: 0, y: 980, w: 1400, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 1000 },
      { type: 'WALL', x: 1380, y: 0, w: 20, h: 1000 },

      // Cubicles (Partitions)
      { type: 'CUBICLE_WALL', x: 200, y: 150, w: 120, h: 10 },
      { type: 'CUBICLE_WALL', x: 200, y: 150, w: 10, h: 140 },
      { type: 'CUBICLE_WALL', x: 500, y: 150, w: 120, h: 10 },
      { type: 'CUBICLE_WALL', x: 500, y: 150, w: 10, h: 140 },
      { type: 'CUBICLE_WALL', x: 1100, y: 150, w: 120, h: 10 },
      { type: 'CUBICLE_WALL', x: 1100, y: 150, w: 10, h: 140 },

      { type: 'CUBICLE_WALL', x: 200, y: 700, w: 120, h: 10 },
      { type: 'CUBICLE_WALL', x: 200, y: 700, w: 10, h: 140 },
      { type: 'CUBICLE_WALL', x: 800, y: 700, w: 120, h: 10 },
      { type: 'CUBICLE_WALL', x: 800, y: 700, w: 10, h: 140 },
      { type: 'CUBICLE_WALL', x: 1100, y: 700, w: 120, h: 10 },
      { type: 'CUBICLE_WALL', x: 1100, y: 700, w: 10, h: 140 },

      // Desk Objects (Inside Cubicles)
      { type: 'DESK', x: 220, y: 180, w: 80, h: 40 },
      { type: 'COMPUTER', x: 250, y: 180, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 290, y: 195, w: 8, h: 8 },

      { type: 'DESK', x: 520, y: 180, w: 80, h: 40 },
      { type: 'COMPUTER', x: 550, y: 180, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 590, y: 195, w: 8, h: 8 },

      { type: 'DESK', x: 1120, y: 180, w: 80, h: 40 },
      { type: 'COMPUTER', x: 1150, y: 180, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1190, y: 195, w: 8, h: 8 },

      { type: 'DESK', x: 220, y: 740, w: 80, h: 40 },
      { type: 'COMPUTER', x: 250, y: 740, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 295, y: 755, w: 8, h: 8 },

      { type: 'DESK', x: 820, y: 740, w: 80, h: 40 },
      { type: 'COMPUTER', x: 850, y: 740, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 890, y: 755, w: 8, h: 8 },

      { type: 'DESK', x: 1120, y: 740, w: 80, h: 40 },
      { type: 'COMPUTER', x: 1150, y: 740, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1190, y: 755, w: 8, h: 8 },

      // Toby's isolated desk in the middle
      { type: 'DESK', x: 520, y: 460, w: 80, h: 40 },
      { type: 'COMPUTER', x: 550, y: 460, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 525, y: 475, w: 8, h: 8 },

      // Printers
      { type: 'PRINTER', x: 750, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 50, y: 900, w: 50, h: 45 },

      // Water Coolers
      { type: 'WATER_COOLER', x: 950, y: 50, w: 30, h: 50 },
    ],
    missions: [
      { id: "hit_hr_5", description: "Hit HR employees 5 times", targetValue: 5 },
      { id: "break_objects_8", description: "Break 8 office objects", targetValue: 8 },
      { id: "chaos_points_500", description: "Create 500 chaos points", targetValue: 500 }
    ],
    missionsAlt: [
      { id: "jam_servers_3", description: "Jam 3 printers", targetValue: 3 },
      { id: "water_cooler_floods_2", description: "Trigger 2 water cooler floods", targetValue: 2 },
      { id: "chaos_points_600", description: "Create 600 chaos points", targetValue: 600 }
    ]
  },

  // Floor 3: Meeting Rooms
  {
    floorNumber: 3,
    floorName: "3rd Floor: Meeting Rooms",
    floorDesc: "Glass walled conference rooms with large board tables. Disrupt boring corporate syncs!",
    floorBgColor: "#eff6ff", // Premium corporate blue
    gridLineColor: "#dbeafe",
    lightingColor: "rgba(59, 130, 246, 0.04)", // Calming presentation blue
    width: 1500,
    height: 1100,
    bossPatrolNodes: [
      { x: 100, y: 100 },
      { x: 100, y: 1000 },
      { x: 1400, y: 1000 },
      { x: 1400, y: 100 },
      { x: 750, y: 550 },
    ],
    coworkerSpawns: [
      { x: 450, y: 290, name: "Erin (Receptionist)" },
      { x: 1050, y: 290, name: "Gabe (VP of Sales)" },
      { x: 450, y: 850, name: "Creed (Quality Assurance)" },
      { x: 1050, y: 850, name: "Meredith (Supplier Rep)" },
      { x: 550, y: 580, name: "Phyllis (Sales Analyst)" },
    ],
    obstacles: [
      // Outer border walls
      { type: 'WALL', x: 0, y: 0, w: 1500, h: 20 },
      { type: 'WALL', x: 0, y: 1080, w: 1500, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 1100 },
      { type: 'WALL', x: 1480, y: 0, w: 20, h: 1100 },

      // Giant Corporate Boardroom in the very center with glass doors
      { type: 'WALL', x: 500, y: 400, w: 500, h: 20 },
      { type: 'WALL', x: 500, y: 680, w: 500, h: 20 },
      { type: 'WALL', x: 500, y: 400, w: 20, h: 100 },
      { type: 'WALL', x: 500, y: 580, w: 20, h: 120 }, // Gap for left door
      { type: 'DOOR', x: 500, y: 500, w: 20, h: 80 },

      { type: 'WALL', x: 980, y: 400, w: 20, h: 100 },
      { type: 'WALL', x: 980, y: 580, w: 20, h: 120 }, // Gap for right door
      { type: 'DOOR', x: 980, y: 500, w: 20, h: 80 },

      // Boardroom Table
      { type: 'CONFERENCE_TABLE', x: 600, y: 500, w: 300, h: 100 },
      { type: 'COFFEE_MUG', x: 620, y: 510, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 680, y: 510, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 740, y: 510, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 800, y: 510, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 860, y: 510, w: 8, h: 8 },
      { type: 'CONFERENCE_CHAIR', x: 650, y: 460, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 700, y: 460, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 750, y: 460, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 800, y: 460, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 650, y: 615, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 700, y: 615, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 750, y: 615, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 800, y: 615, w: 25, h: 25 },

      // Desks at corners
      { type: 'DESK', x: 400, y: 200, w: 100, h: 50 },
      { type: 'COMPUTER', x: 430, y: 200, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 480, y: 215, w: 8, h: 8 },

      { type: 'DESK', x: 1000, y: 200, w: 100, h: 50 },
      { type: 'COMPUTER', x: 1030, y: 200, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1010, y: 215, w: 8, h: 8 },

      // Side meeting rooms
      { type: 'WALL', x: 20, y: 350, w: 130, h: 15 }, // Left wall segment
      { type: 'WALL', x: 250, y: 350, w: 15, h: 15 },  // Right wall segment
      { type: 'WALL', x: 250, y: 20, w: 15, h: 330 },
      { type: 'DOOR', x: 150, y: 350, w: 100, h: 15 },

      { type: 'PRINTER', x: 50, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 1400, y: 50, w: 50, h: 45 },
      { type: 'WATER_COOLER', x: 740, y: 50, w: 30, h: 50 },
    ],
    missions: [
      { id: "interrupt_meetings_4", description: "Interrupt 4 meetings", targetValue: 4 },
      { id: "hit_distracted_10", description: "Hit 10 distracted employees", targetValue: 10 },
      { id: "combo_chain_5", description: "Chain 5 chaos reactions", targetValue: 5 }
    ],
    missionsAlt: [
      { id: "coffee_spills_6", description: "Splatter coffee 6 times", targetValue: 6 },
      { id: "hit_coworkers_12", description: "Hit 12 coworkers in desks", targetValue: 12 },
      { id: "combo_chain_3", description: "Reach a 3x Chaos Combo", targetValue: 3 }
    ]
  },

  // Floor 4: Cafeteria
  {
    floorNumber: 4,
    floorName: "4th Floor: Corporate Cafeteria",
    floorDesc: "Coffee spill paradise! Vending machines, cafeteria dining tables, and snack counters.",
    floorBgColor: "#fff7ed", // Warm cafeteria orange tiles
    gridLineColor: "#fed7aa",
    lightingColor: "rgba(249, 115, 22, 0.04)", // Warm cafeteria evening glow
    width: 1300,
    height: 950,
    bossPatrolNodes: [
      { x: 100, y: 100 },
      { x: 1200, y: 100 },
      { x: 1200, y: 850 },
      { x: 100, y: 850 },
      { x: 650, y: 475 },
    ],
    coworkerSpawns: [
      { x: 200, y: 200, name: "Lunching Larry" },
      { x: 1100, y: 200, name: "Snacking Sarah" },
      { x: 650, y: 250, name: "Coffee Craving Chris" },
      { x: 300, y: 700, name: "Hungry Harold" },
      { x: 1000, y: 700, name: "Dining Debbie" },
    ],
    obstacles: [
      // Outer walls
      { type: 'WALL', x: 0, y: 0, w: 1300, h: 20 },
      { type: 'WALL', x: 0, y: 930, w: 1300, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 950 },
      { type: 'WALL', x: 1280, y: 0, w: 20, h: 950 },

      // Cafeteria Long Tables
      { type: 'CONFERENCE_TABLE', x: 250, y: 300, w: 180, h: 80 },
      { type: 'COFFEE_MUG', x: 280, y: 320, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 380, y: 320, w: 8, h: 8 },

      { type: 'CONFERENCE_TABLE', x: 850, y: 300, w: 180, h: 80 },
      { type: 'COFFEE_MUG', x: 880, y: 320, w: 8, h: 8 },

      { type: 'CONFERENCE_TABLE', x: 250, y: 600, w: 180, h: 80 },
      { type: 'COFFEE_MUG', x: 280, y: 620, w: 8, h: 8 },

      { type: 'CONFERENCE_TABLE', x: 850, y: 600, w: 180, h: 80 },
      { type: 'COFFEE_MUG', x: 880, y: 620, w: 8, h: 8 },

      // Coffee counter
      { type: 'DESK', x: 500, y: 50, w: 300, h: 50 },
      { type: 'COFFEE_MUG', x: 530, y: 60, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 600, y: 60, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 670, y: 60, w: 8, h: 8 },
      { type: 'COFFEE_MUG', x: 740, y: 60, w: 8, h: 8 },

      // Vending Machines (Styled as Printers)
      { type: 'PRINTER', x: 50, y: 200, w: 50, h: 45 },
      { type: 'PRINTER', x: 50, y: 300, w: 50, h: 45 },
      { type: 'PRINTER', x: 1200, y: 200, w: 50, h: 45 },
      { type: 'PRINTER', x: 1200, y: 300, w: 50, h: 45 },

      // Double Water Coolers
      { type: 'WATER_COOLER', x: 450, y: 50, w: 30, h: 50 },
      { type: 'WATER_COOLER', x: 820, y: 50, w: 30, h: 50 },
      { type: 'WATER_COOLER', x: 50, y: 800, w: 30, h: 50 },
      { type: 'WATER_COOLER', x: 1220, y: 800, w: 30, h: 50 },
    ],
    missions: [
      { id: "food_splatter_5", description: "Splatter 5 coffee spots", targetValue: 5 },
      { id: "water_cooler_floods_3", description: "Trigger 3 water cooler floods", targetValue: 3 },
      { id: "chaos_points_700", description: "Cause 700 chaos points", targetValue: 700 }
    ],
    missionsAlt: [
      { id: "break_objects_6", description: "Break 6 office objects", targetValue: 6 },
      { id: "hit_computers_10", description: "Crash 10 IT computers", targetValue: 10 },
      { id: "throw_airplanes_30", description: "Throw 30 paper airplanes", targetValue: 30 }
    ]
  },

  // Floor 5: HR Department
  {
    floorNumber: 5,
    floorName: "5th Floor: HR Department",
    floorDesc: "Shhh! A highly quiet atmosphere with server racks, filing cabinets, and hyper-vigilant HR reps.",
    floorBgColor: "#f0fdf4", // Serene HR green
    gridLineColor: "#bbf7d0",
    lightingColor: "rgba(34, 197, 94, 0.04)", // Silent HR green
    width: 1400,
    height: 1000,
    bossPatrolNodes: [
      { x: 150, y: 150 },
      { x: 1250, y: 150 },
      { x: 1250, y: 850 },
      { x: 150, y: 850 },
    ],
    coworkerSpawns: [
      { x: 300, y: 250, name: "Toby (Quiet HR Analyst)" },
      { x: 1100, y: 250, name: "Linda (Silent Case Lead)" },
      { x: 600, y: 500, name: "Nate (Policy Compliance)" },
      { x: 300, y: 750, name: "Gail (Incident Investigator)" },
      { x: 1100, y: 750, name: "Milton (Quiet Auditor)" },
    ],
    obstacles: [
      // Outer walls
      { type: 'WALL', x: 0, y: 0, w: 1400, h: 20 },
      { type: 'WALL', x: 0, y: 980, w: 1400, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 1000 },
      { type: 'WALL', x: 1380, y: 0, w: 20, h: 1000 },

      // Filing cabinet maze blocks (Simulated using CUBICLE_WALL)
      { type: 'CUBICLE_WALL', x: 250, y: 150, w: 40, h: 200 },
      { type: 'CUBICLE_WALL', x: 1110, y: 150, w: 40, h: 200 },
      { type: 'CUBICLE_WALL', x: 250, y: 650, w: 40, h: 200 },
      { type: 'CUBICLE_WALL', x: 1110, y: 650, w: 40, h: 200 },

      // HR desks
      { type: 'DESK', x: 550, y: 300, w: 120, h: 50 },
      { type: 'COMPUTER', x: 590, y: 300, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 640, y: 315, w: 8, h: 8 },

      { type: 'DESK', x: 730, y: 300, w: 120, h: 50 },
      { type: 'COMPUTER', x: 770, y: 300, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 810, y: 315, w: 8, h: 8 },

      { type: 'DESK', x: 550, y: 650, w: 120, h: 50 },
      { type: 'COMPUTER', x: 590, y: 650, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 640, y: 665, w: 8, h: 8 },

      { type: 'DESK', x: 730, y: 650, w: 120, h: 50 },
      { type: 'COMPUTER', x: 770, y: 650, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 735, y: 665, w: 8, h: 8 },

      { type: 'DESK', x: 910, y: 300, w: 120, h: 50 },
      { type: 'COMPUTER', x: 950, y: 300, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 990, y: 315, w: 8, h: 8 },

      // Printers
      { type: 'PRINTER', x: 50, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 1300, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 675, y: 800, w: 50, h: 45 },

      // Water Coolers
      { type: 'WATER_COOLER', x: 50, y: 500, w: 30, h: 50 },
      { type: 'WATER_COOLER', x: 1320, y: 500, w: 30, h: 50 },
    ],
    missions: [
      { id: "hit_hr_workers_12", description: "Hit 12 quiet HR workers", targetValue: 12 },
      { id: "break_filing_5", description: "Break 5 HR computers", targetValue: 5 },
      { id: "combo_chain_4", description: "Reach a 4x Chaos Combo", targetValue: 4 }
    ],
    missionsAlt: [
      { id: "jam_servers_3", description: "Jam 3 printers", targetValue: 3 },
      { id: "chaos_points_1000", description: "Cause 1000 total chaos points", targetValue: 1000 },
      { id: "throw_airplanes_35", description: "Throw 35 paper airplanes", targetValue: 35 }
    ]
  },

  // Floor 6: Executive Offices
  {
    floorNumber: 6,
    floorName: "6th Floor: Executive Suites",
    floorDesc: "Heavy luxury mahogany desks, gold-plated trophies, glass windows, and highly alert executives.",
    floorBgColor: "#fff1f2", // Royal crimson/rose red carpet
    gridLineColor: "#fecdd3",
    lightingColor: "rgba(244, 63, 94, 0.05)", // Soft crimson power glow
    width: 1500,
    height: 1100,
    bossPatrolNodes: [
      { x: 150, y: 150 },
      { x: 750, y: 150 },
      { x: 1350, y: 150 },
      { x: 1350, y: 950 },
      { x: 750, y: 550 },
      { x: 150, y: 950 },
    ],
    coworkerSpawns: [
      { x: 300, y: 300, name: "CEO David" },
      { x: 1200, y: 300, name: "VP Charles" },
      { x: 750, y: 300, name: "Board Member Barbara" },
      { x: 300, y: 800, name: "Director Robert" },
      { x: 1200, y: 800, name: "Chairman Thomas" },
    ],
    obstacles: [
      // Outer walls
      { type: 'WALL', x: 0, y: 0, w: 1500, h: 20 },
      { type: 'WALL', x: 0, y: 1080, w: 1500, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 1100 },
      { type: 'WALL', x: 1480, y: 0, w: 20, h: 1100 },

      // Giant CEO mahogany Desk
      { type: 'DESK', x: 600, y: 480, w: 300, h: 80 },
      { type: 'COMPUTER', x: 720, y: 480, w: 40, h: 20 },
      { type: 'COFFEE_MUG', x: 630, y: 500, w: 8, h: 8 },

      // Other executive desks
      { type: 'DESK', x: 250, y: 250, w: 150, h: 60 },
      { type: 'COMPUTER', x: 310, y: 250, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 270, y: 265, w: 8, h: 8 },

      { type: 'DESK', x: 1100, y: 250, w: 150, h: 60 },
      { type: 'COMPUTER', x: 1160, y: 250, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1120, y: 265, w: 8, h: 8 },

      { type: 'DESK', x: 250, y: 750, w: 150, h: 60 },
      { type: 'COMPUTER', x: 310, y: 750, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 270, y: 765, w: 8, h: 8 },

      { type: 'DESK', x: 1100, y: 750, w: 150, h: 60 },
      { type: 'COMPUTER', x: 1160, y: 750, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 1120, y: 765, w: 8, h: 8 },

      // Conference Tables
      { type: 'CONFERENCE_TABLE', x: 600, y: 150, w: 300, h: 80 },
      { type: 'CONFERENCE_CHAIR', x: 650, y: 110, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 750, y: 110, w: 25, h: 25 },
      { type: 'CONFERENCE_CHAIR', x: 850, y: 110, w: 25, h: 25 },

      // Water Coolers
      { type: 'WATER_COOLER', x: 740, y: 1000, w: 30, h: 50 },
      { type: 'PRINTER', x: 50, y: 500, w: 50, h: 45 },
      { type: 'PRINTER', x: 1400, y: 500, w: 50, h: 45 },
    ],
    missions: [
      { id: "break_objects_6", description: "Break 6 office objects", targetValue: 6 },
      { id: "throw_airplanes_40", description: "Throw 40 paper airplanes", targetValue: 40 },
      { id: "chaos_points_1000", description: "Cause 1000 chaos points", targetValue: 1000 }
    ],
    missionsAlt: [
      { id: "hit_coworkers_10", description: "Hit 10 executives", targetValue: 10 },
      { id: "coffee_spills_5", description: "Spill coffee 5 times", targetValue: 5 },
      { id: "chaos_points_1200", description: "Cause 1200 chaos points", targetValue: 1200 }
    ]
  },

  // Floor 7: IT Department & Server Room
  {
    floorNumber: 7,
    floorName: "7th Floor: IT Server Room",
    floorDesc: "Tall buzzing server racks, dangling wires, computers, and double-boss threat: CEO + Boss!",
    floorBgColor: "#fafaf9", // Cleanroom slate stone
    gridLineColor: "#e7e5e4",
    lightingColor: "rgba(168, 85, 247, 0.05)", // Hacker purple/neon glow
    width: 1400,
    height: 1000,
    bossPatrolNodes: [
      { x: 100, y: 100 },
      { x: 1300, y: 100 },
      { x: 1300, y: 900 },
      { x: 100, y: 900 },
    ],
    coworkerSpawns: [
      { x: 250, y: 250, name: "Roy (Server Admin)" },
      { x: 1150, y: 250, name: "Moss (DB Architect)" },
      { x: 700, y: 500, name: "Jen (IT Relations)" },
      { x: 250, y: 750, name: "Richmond (Goth IT Expert)" },
      { x: 1150, y: 750, name: "Alistair (Hardware Lead)" },
    ],
    obstacles: [
      // Outer walls
      { type: 'WALL', x: 0, y: 0, w: 1400, h: 20 },
      { type: 'WALL', x: 0, y: 980, w: 1400, h: 20 },
      { type: 'WALL', x: 0, y: 0, w: 20, h: 1000 },
      { type: 'WALL', x: 1380, y: 0, w: 20, h: 1000 },

      // Tall server rack modules (Simulated as solid barriers)
      { type: 'WALL', x: 200, y: 150, w: 60, h: 250 },
      { type: 'WALL', x: 450, y: 150, w: 60, h: 250 },
      { type: 'WALL', x: 890, y: 150, w: 60, h: 250 },
      { type: 'WALL', x: 1140, y: 150, w: 60, h: 250 },

      { type: 'WALL', x: 200, y: 600, w: 60, h: 250 },
      { type: 'WALL', x: 450, y: 600, w: 60, h: 250 },
      { type: 'WALL', x: 890, y: 600, w: 60, h: 250 },
      { type: 'WALL', x: 1140, y: 600, w: 60, h: 250 },

      // IT Work Desks
      { type: 'DESK', x: 600, y: 200, w: 200, h: 50 },
      { type: 'COMPUTER', x: 640, y: 200, w: 30, h: 15 },
      { type: 'COMPUTER', x: 720, y: 200, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 610, y: 215, w: 8, h: 8 },

      { type: 'DESK', x: 600, y: 750, w: 200, h: 50 },
      { type: 'COMPUTER', x: 640, y: 750, w: 30, h: 15 },
      { type: 'COMPUTER', x: 720, y: 750, w: 30, h: 15 },
      { type: 'COFFEE_MUG', x: 780, y: 765, w: 8, h: 8 },

      // Individual Cubicle Desks & Chairs for Coworkers (Roy, Moss, Jen, Richmond, Alistair)
      { type: 'DESK', x: 220, y: 200, w: 60, h: 40 },
      { type: 'CONFERENCE_CHAIR', x: 238, y: 245, w: 25, h: 25 },
      { type: 'COMPUTER', x: 235, y: 205, w: 30, h: 15 },

      { type: 'DESK', x: 1120, y: 200, w: 60, h: 40 },
      { type: 'CONFERENCE_CHAIR', x: 1138, y: 245, w: 25, h: 25 },
      { type: 'COMPUTER', x: 1135, y: 205, w: 30, h: 15 },

      { type: 'DESK', x: 670, y: 450, w: 60, h: 40 },
      { type: 'CONFERENCE_CHAIR', x: 688, y: 495, w: 25, h: 25 },
      { type: 'COMPUTER', x: 685, y: 455, w: 30, h: 15 },

      { type: 'DESK', x: 220, y: 700, w: 60, h: 40 },
      { type: 'CONFERENCE_CHAIR', x: 238, y: 745, w: 25, h: 25 },
      { type: 'COMPUTER', x: 235, y: 705, w: 30, h: 15 },

      { type: 'DESK', x: 1120, y: 700, w: 60, h: 40 },
      { type: 'CONFERENCE_CHAIR', x: 1138, y: 745, w: 25, h: 25 },
      { type: 'COMPUTER', x: 1135, y: 705, w: 30, h: 15 },

      // High-End Copiers (Printers)
      { type: 'PRINTER', x: 50, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 1300, y: 50, w: 50, h: 45 },
      { type: 'PRINTER', x: 50, y: 900, w: 50, h: 45 },
      { type: 'PRINTER', x: 1300, y: 900, w: 50, h: 45 },

      // Water Coolers
      { type: 'WATER_COOLER', x: 700, y: 50, w: 30, h: 50 },
    ],
    missions: [
      { id: "jam_servers_4", description: "Jam 4 server copiers", targetValue: 4 },
      { id: "hit_computers_15", description: "Crash 15 IT computers", targetValue: 15 },
      { id: "chaos_points_1500", description: "Achieve 1500 chaos points", targetValue: 1500 }
    ],
    missionsAlt: [
      { id: "hit_coworkers_12", description: "Hit 12 board members", targetValue: 12 },
      { id: "water_cooler_floods_4", description: "Trigger 4 water cooler floods", targetValue: 4 },
      { id: "chaos_points_2000", description: "Achieve 2000 chaos points", targetValue: 2000 }
    ]
  }
];

