/**
 * Secret Realm System Constants
 */

import { RealmType, SecretRealm } from '../types';

export const SECRET_REALMS: SecretRealm[] = [
  // Beginner Zones (Vault Dweller)
  {
    id: 'realm-vault-111',
    name: 'Vault 111 Surroundings',
    description:
      'The area around the vault. Relatively safe, inhabited by radroaches and mole rats. Perfect for new Vault Dwellers.',
    minRealm: RealmType.QiRefining,
    cost: 50,
    riskLevel: 'Low',
    drops: ['Scrap Metal', 'Canned Food', 'Basic Meds'],
  },
  {
    id: 'realm-sanctuary',
    name: 'Sanctuary Hills',
    description: 'An old suburban neighborhood. Good for scavenging household supplies and basic weapons.',
    minRealm: RealmType.QiRefining,
    cost: 60,
    riskLevel: 'Low',
    drops: ['Junk Components', 'Common Chems', 'Pipe Weapons'],
  },
  {
    id: 'realm-concord',
    name: 'Concord Ruins',
    description: 'A small town overrun by Raiders. Watch out for the Deathclaw.',
    minRealm: RealmType.QiRefining,
    cost: 80,
    riskLevel: 'Medium',
    drops: ['Raider Gear', 'Fusion Core', 'Combat Relic'],
  },

  // Intermediate Zones (Wasteland Scavenger - Mercenary Veteran)
  {
    id: 'realm-diamond-city',
    name: 'Diamond City Outskirts',
    description: 'The great green jewel of the Commonwealth. Trade and danger in equal measure.',
    minRealm: RealmType.Foundation,
    cost: 250,
    riskLevel: 'Medium',
    drops: ['Rare Ammo', 'Quality Gear', 'Trade Goods'],
  },
  {
    id: 'realm-super-duper-mart',
    name: 'Super-Duper Mart',
    description: 'An abandoned supermarket. Feral Ghouls lurk in every aisle.',
    minRealm: RealmType.Foundation,
    cost: 300,
    riskLevel: 'Medium',
    drops: ['Preserved Food', 'Medicine', 'Shopping Cart Parts'],
  },
  {
    id: 'realm-corvega',
    name: 'Corvega Assembly Plant',
    description: 'A massive pre-war automobile factory. Now a Raider stronghold.',
    minRealm: RealmType.Foundation,
    cost: 400,
    riskLevel: 'High',
    drops: ['Mechanical Parts', 'Raider Power Armor', 'Factory Schematics'],
  },

  // Advanced Zones (Brotherhood Paladin)
  {
    id: 'realm-west-tek',
    name: 'West-Tek Research Facility',
    description: 'The birthplace of FEV. Super Mutants guard ancient scientific secrets.',
    minRealm: RealmType.GoldenCore,
    cost: 600,
    riskLevel: 'High',
    drops: ['FEV Sample', 'Pre-war Research Data', 'Super Mutant Gear'],
  },
  {
    id: 'realm-mass-fusion',
    name: 'Mass Fusion Building',
    description: 'A pre-war energy company HQ. Contains valuable fusion technology.',
    minRealm: RealmType.GoldenCore,
    cost: 700,
    riskLevel: 'High',
    drops: ['Fusion Core', 'Energy Weapons', 'Nuclear Material'],
  },
  {
    id: 'realm-institute',
    name: 'The Institute',
    description: 'The underground lair of advanced synth technology. Only for the worthy.',
    minRealm: RealmType.GoldenCore,
    cost: 900,
    riskLevel: 'Extreme',
    drops: ['Synth Components', 'Institute Rifle', 'Teleportation Data'],
  },

  // Elite Zones (Enclave General - Cyber-Ascendant)
  {
    id: 'realm-glowing-sea',
    name: 'The Glowing Sea',
    description: 'Ground zero of the nuclear detonation. Extremely high radiation, but rich in rare isotopes.',
    minRealm: RealmType.NascentSoul,
    cost: 1200,
    riskLevel: 'Extreme',
    drops: ['Nuclear Material', 'Radscorpion Venom', 'Quantum Shard'],
  },
  {
    id: 'realm-prydwen',
    name: 'The Prydwen',
    description: "The Brotherhood of Steel's massive airship. Access requires high standing.",
    minRealm: RealmType.NascentSoul,
    cost: 1500,
    riskLevel: 'Extreme',
    drops: ['Power Armor Parts', 'Vertibird Components', 'BoS Tech'],
  },

  // Endgame Zones (Wasteland Legend)
  {
    id: 'realm-enclave-rig',
    name: 'Enclave Oil Rig',
    description: 'The Enclave command center. Only the most elite can breach its defenses.',
    minRealm: RealmType.SpiritSevering,
    cost: 2000,
    riskLevel: 'Extreme',
    drops: ['Enclave Power Armor', 'Orbital Strike Beacon', 'President Keycard'],
  },
  {
    id: 'realm-big-mt',
    name: 'Big MT Research Center',
    description: 'A pre-war research dome filled with insane experiments and legendary tech.',
    minRealm: RealmType.SpiritSevering,
    cost: 2500,
    riskLevel: 'Extreme',
    drops: ['Think Tank Data', 'Lobotomite Gear', 'Forbidden Science'],
  },
];

