export interface TeamInfo {
  name: string;
  logo: string;
  score: number;
}

export interface StatItem {
  label: string;
  home: number;
  away: number;
  unit?: string;
}

export interface MotmData {
  name: string;
  photo: string;
  rating: number;
  goals: number;
  assists: number;
}

export interface StandingsData {
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
}

export interface BrandingData {
  handle: string;
  tagline: string;
}

export interface PostMatchInput {
  template: 'post-match-recap';
  match: {
    date: string;
    stadium: string;
    competition: string;
    home: TeamInfo;
    away: TeamInfo;
    stats: StatItem[];
    motm: MotmData;
    standings: StandingsData;
  };
  branding: BrandingData;
}

