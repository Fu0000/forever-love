export interface User {
  id: string;
  clientUserId?: string | null;
  name: string;
  avatarUrl?: string | null; // backend returns nullable
  coupleId?: string | null;
  homeCoupleId?: string | null;
  activeCoupleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend compatibility alias
export interface UserFrontend extends User {
  avatar: string; // Alias for avatarUrl for frontend compatibility
}

export interface LoveNote {
  id: string;
  coupleId: string;
  authorId: string;
  content: string;
  color?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string; // ISO Date string
  updatedAt?: string;
}

export interface Moment {
  id: string;
  coupleId: string;
  title: string;
  description?: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  imageUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export type QuestStatus = 'ACTIVE' | 'COMPLETED';

export interface Quest {
  id: string;
  coupleId: string;
  title: string;
  description?: string;
  points: number;
  type: 'service' | 'gift' | 'quality_time' | 'words';
  status: QuestStatus;
  createdBy: string; // Changed from creatorId
  createdAt: string; // ISO Date string
  updatedAt?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// The shared state of the couple
export interface CoupleData {
  id: string;
  pairCode: string; // Added pairCode
  creatorId: string;
  partnerId?: string;
  anniversaryDate?: string; // ISO Date string
  intimacyScore: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Frontend aggregated data (not in DB table directly, but fetched via API)
  notes: LoveNote[];
  moments: Moment[];
  quests: Quest[];
  users: UserFrontend[]; // Should contain 1 or 2 users
}

// Local session state
export interface AppState {
  currentUserId: string | null;
  coupleData: CoupleData | null;
}

export type PairRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export interface PairRequestUserLite {
  id: string;
  clientUserId: string | null;
  name: string;
  avatarUrl: string | null;
}

export interface IncomingPairRequest {
  id: string;
  coupleId: string;
  status: PairRequestStatus;
  createdAt: string;
  respondedAt: string | null;
  fromUser: PairRequestUserLite;
}

export interface OutgoingPairRequest {
  id: string;
  coupleId: string;
  status: PairRequestStatus;
  createdAt: string;
  respondedAt: string | null;
  toUser: PairRequestUserLite;
}
