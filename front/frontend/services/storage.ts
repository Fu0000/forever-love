import {
  CoupleData,
  User,
  UserFrontend,
  LoveNote,
  Quest,
  Moment,
  IncomingPairRequest,
  OutgoingPairRequest,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://foever-love.chuhaibox.com/api/v1';
const TOKEN_KEY = 'lovesync_auth_token';
const USER_KEY = 'lovesync_current_user_id';
const CLIENT_ID_KEY = 'lovesync_client_user_id';
const COUPLE_ID_KEY = 'lovesync_couple_id';

// Helper for making authenticated requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(
      `API Error: ${response.status} ${response.statusText} - ${errorBody}`,
    ) as Error & { status?: number; body?: string };
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const json = await response.json();
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: unknown }).data;
  }
  return json;
};

// Helper to map backend User to Frontend User
const mapUserToFrontend = (user: User): UserFrontend => ({
  ...user,
  avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`, // Fallback or map
});

const mapCoupleToFrontend = (couple: any): CoupleData => {
  const users = Array.isArray(couple?.users)
    ? (couple.users as User[]).map((user) => mapUserToFrontend(user))
    : [];

  return {
    ...couple,
    users,
    notes: [],
    quests: [],
    moments: [],
  } as CoupleData;
};

const mapNoteFromApi = (note: any): LoveNote => {
  return {
    id: note.id,
    coupleId: note.coupleId ?? '',
    authorId: note.authorId,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    color: note.color ?? undefined,
    mediaUrl: note.media?.url ?? undefined,
    mediaType: note.media?.type ?? undefined,
  };
};

const normalizeQuestStatus = (status?: string) => {
  if (!status) return status;
  return status.toUpperCase();
};

const normalizeQuest = (quest: Quest): Quest => ({
  ...quest,
  status: normalizeQuestStatus(quest.status) as Quest['status'],
});

const clientUserIdPattern = /^user_[A-Za-z0-9_-]{6,64}$/;

const getOrCreateClientUserId = (): string => {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing && clientUserIdPattern.test(existing)) return existing;
  if (existing) {
    localStorage.removeItem(CLIENT_ID_KEY);
  }

  let randomPart = '';
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    randomPart = crypto.randomUUID().replace(/-/g, '');
  } else {
    randomPart = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }

  const clientUserId = `user_${randomPart}`.slice(0, 69);
  localStorage.setItem(CLIENT_ID_KEY, clientUserId);
  return clientUserId;
};

const saveCoupleId = (coupleId: string | null) => {
  if (coupleId) {
    localStorage.setItem(COUPLE_ID_KEY, coupleId);
  } else {
    localStorage.removeItem(COUPLE_ID_KEY);
  }
};

export const storageService = {
  // --- Health Check ---
  checkHealth: async (): Promise<boolean> => {
    try {
      await apiRequest('/health');
      return true;
    } catch (e) {
      console.error("Health check failed", e);
      return false;
    }
  },

  // --- Session Management ---

  saveSession: (userId: string, token?: string) => {
    localStorage.setItem(USER_KEY, userId);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getSession: (): string | null => {
    return localStorage.getItem(USER_KEY);
  },

  clearSession: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(COUPLE_ID_KEY);
  },

  clearLocalIdentity: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(COUPLE_ID_KEY);
    localStorage.removeItem(CLIENT_ID_KEY);
  },

  hasToken: (): boolean => Boolean(localStorage.getItem(TOKEN_KEY)),

  getCurrentUser: async (): Promise<UserFrontend> => {
    const user = await apiRequest('/users/me');
    return mapUserToFrontend(user);
  },

  // --- Auth & User ---

  login: async (user: Partial<UserFrontend>): Promise<{ user: UserFrontend; token: string }> => {
    // Backend expects LoginDto. Assuming it takes name/avatarUrl for auto-registration/update
    // Based on the provided OpenAPI spec, the response for /auth/login is 201 Created.
    // It likely returns the token directly or an object containing it.
    
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        // The backend likely uses a device ID or similar for "login", but since we are web,
        // and this is a demo, we might be sending user details to auto-create.
        // If the backend requires a specific ID, we should generate one and store it.
        // Let's assume we send a generated clientUserId if it's a new user, or just name/avatar.
        // However, standard practice for this kind of "easy login" is sending a device/client ID.
        // Let's try sending a clientUserId generated on the frontend if not present.
        clientUserId: getOrCreateClientUserId(),
        name: user.name,
        avatarUrl: user.avatar
      }),
    });
    
    // The response structure from the provided backend seems to be:
    // { access_token: "..." }
    // We then need to fetch the user details using this token.
    
    const token = response.access_token || response.token;
    
    if (!token) {
        throw new Error("No access token received from login");
    }

    // Save token temporarily to make the next request
    localStorage.setItem(TOKEN_KEY, token);

    // Fetch current user details
    const userResponse = await apiRequest('/users/me');
    const userData = mapUserToFrontend(userResponse);

    return {
      user: userData,
      token: token
    };
  },

  updateUser: async (userId: string, data: Partial<UserFrontend>): Promise<UserFrontend> => {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.avatar) payload.avatarUrl = data.avatar;

    const updatedUser = await apiRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapUserToFrontend(updatedUser);
  },

  // --- Couple Space ---

  createCouple: async (): Promise<CoupleData> => {
    const couple = await apiRequest('/couples', {
      method: 'POST',
      body: JSON.stringify({}), 
    });
    saveCoupleId(couple.id);
    return mapCoupleToFrontend(couple);
  },

  joinCouple: async (pairCode: string): Promise<CoupleData> => {
    const couple = await apiRequest('/couples/join', {
      method: 'POST',
      body: JSON.stringify({ pairCode }), // Changed from coupleId to pairCode based on DB schema
    });
    saveCoupleId(couple.id);
    return mapCoupleToFrontend(couple);
  },

  getCoupleData: async (coupleId: string): Promise<CoupleData | null> => {
    try {
      const couple = await apiRequest(`/couples/${coupleId}`);
      saveCoupleId(couple.id);
      return mapCoupleToFrontend(couple);
    } catch (error) {
      console.error("Failed to load couple data", error);
      return null;
    }
  },

  updateCouple: async (coupleId: string, data: Partial<CoupleData>): Promise<CoupleData> => {
    const payload: any = {};
    if (data.anniversaryDate) payload.anniversaryDate = data.anniversaryDate; // ISO String
    if (data.intimacyScore !== undefined) payload.intimacyScore = data.intimacyScore;

    const updated = await apiRequest(`/couples/${coupleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    
    // Re-fetch to get full structure if needed, or merge
    return { ...updated, users: [] }; // Simplified return, caller usually refreshes or merges
  },

  findCoupleByUserId: async (userId: string, me?: User): Promise<CoupleData | null> => {
    try {
      const savedCoupleId = localStorage.getItem(COUPLE_ID_KEY);
      if (savedCoupleId) {
        const cached = await storageService.getCoupleData(savedCoupleId);
        if (cached) {
          return cached;
        }
        localStorage.removeItem(COUPLE_ID_KEY);
      }

      const currentMe = me ?? (await apiRequest('/users/me'));
      // Assuming /users/me returns the user object which might have a coupleId relation 
      // OR we need to query couples where creatorId or partnerId is me.
      // Since the DB schema doesn't show coupleId on User, we might need a specific endpoint 
      // or the /users/me includes the couple relation.
      // If the API doesn't support this, we rely on local storage of coupleId or the user must re-login/re-join.
      
      // However, typically 'me' endpoint returns relation. 
      // If not, we might need to search. 
      // For this implementation, let's assume `me` has a `couple` object or `coupleId`.
      const coupleId =
        currentMe.activeCoupleId ?? currentMe.coupleId ?? currentMe.homeCoupleId ?? null;
      if (coupleId) {
        return await storageService.getCoupleData(coupleId);
      }
      // Fallback: If the API returns the couple object directly
      if ((currentMe as any).couple?.id) {
        return await storageService.getCoupleData((currentMe as any).couple.id);
      }
      
      return null;
    } catch (e) {
      if ((e as { status?: number })?.status === 401) {
        throw e;
      }
      return null;
    }
  },

  // --- Pair Requests ---

  listIncomingPairRequests: async (): Promise<IncomingPairRequest[]> => {
    const requests = await apiRequest('/couples/requests/incoming?status=pending');
    return Array.isArray(requests) ? (requests as IncomingPairRequest[]) : [];
  },

  listOutgoingPairRequests: async (): Promise<OutgoingPairRequest[]> => {
    const requests = await apiRequest('/couples/requests/outgoing?status=pending');
    return Array.isArray(requests) ? (requests as OutgoingPairRequest[]) : [];
  },

  createPairRequest: async (
    targetClientUserId: string,
  ): Promise<{ request: any; couple: CoupleData }> => {
    const result = await apiRequest('/couples/requests', {
      method: 'POST',
      body: JSON.stringify({ targetClientUserId }),
    });
    if (result?.couple?.id) {
      saveCoupleId(result.couple.id);
      const coupleData = await storageService.getCoupleData(result.couple.id);
      if (coupleData) {
        return { request: result.request, couple: coupleData };
      }
    }
    return result;
  },

  acceptPairRequest: async (
    requestId: string,
  ): Promise<{ request: any; couple: CoupleData }> => {
    const result = await apiRequest(`/couples/requests/${requestId}/accept`, {
      method: 'POST',
    });
    if (result?.couple?.id) {
      saveCoupleId(result.couple.id);
      const coupleData = await storageService.getCoupleData(result.couple.id);
      if (coupleData) {
        return { request: result.request, couple: coupleData };
      }
    }
    return result;
  },

  rejectPairRequest: async (requestId: string): Promise<{ request: any }> => {
    return apiRequest(`/couples/requests/${requestId}/reject`, {
      method: 'POST',
    });
  },

  cancelPairRequest: async (requestId: string): Promise<{ request: any }> => {
    return apiRequest(`/couples/requests/${requestId}/cancel`, {
      method: 'POST',
    });
  },

  // --- Notes ---

  getNotes: async (coupleId: string): Promise<LoveNote[]> => {
    const notes = await apiRequest(`/couples/${coupleId}/notes`);
    return Array.isArray(notes) ? notes.map((note) => mapNoteFromApi(note)) : [];
  },

  createNote: async (coupleId: string, note: Partial<LoveNote>): Promise<LoveNote> => {
    const created = await apiRequest(`/couples/${coupleId}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        content: note.content,
        color: note.color,
        media: note.mediaUrl
          ? {
              url: note.mediaUrl,
              type: note.mediaType ?? 'image',
            }
          : undefined,
      }),
    });
    return mapNoteFromApi(created);
  },

  deleteNote: async (noteId: string): Promise<void> => {
    return apiRequest(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  },

  // --- Quests ---

  getQuests: async (coupleId: string): Promise<Quest[]> => {
    const quests = await apiRequest(`/couples/${coupleId}/quests`);
    return Array.isArray(quests) ? quests.map((quest) => normalizeQuest(quest)) : [];
  },

  createQuest: async (coupleId: string, quest: Partial<Quest>): Promise<Quest> => {
    const created = await apiRequest(`/couples/${coupleId}/quests`, {
      method: 'POST',
      body: JSON.stringify({
        title: quest.title,
        description: quest.description,
        points: quest.points,
        type: quest.type
      }),
    });
    return normalizeQuest(created);
  },

  updateQuest: async (questId: string, data: Partial<Quest>): Promise<Quest> => {
    const updated = await apiRequest(`/quests/${questId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        points: data.points,
        type: data.type,
        status: data.status // ACTIVE or COMPLETED
      }),
    });
    return normalizeQuest(updated);
  },

  completeQuest: async (questId: string): Promise<Quest> => {
    const completed = await apiRequest(`/quests/${questId}/complete`, {
      method: 'POST',
    });
    return normalizeQuest(completed);
  },

  deleteQuest: async (questId: string): Promise<void> => {
    return apiRequest(`/quests/${questId}`, {
      method: 'DELETE',
    });
  },

  // --- Moments ---

  getMoments: async (coupleId: string): Promise<Moment[]> => {
    return apiRequest(`/couples/${coupleId}/moments`);
  },

  createMoment: async (coupleId: string, moment: Partial<Moment>): Promise<Moment> => {
    return apiRequest(`/couples/${coupleId}/moments`, {
      method: 'POST',
      body: JSON.stringify({
        title: moment.title,
        description: moment.description,
        date: moment.date, // ISO Date string
        imageUrl: moment.imageUrl,
        tags: moment.tags
      }),
    });
  },

  deleteMoment: async (momentId: string): Promise<void> => {
    return apiRequest(`/moments/${momentId}`, {
      method: 'DELETE',
    });
  },

  // --- Media Upload ---
  uploadFile: async (file: File): Promise<string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    const json = await response.json();
    const data = json?.data ?? json;
    if (!data?.publicUrl) {
      throw new Error('Upload succeeded but publicUrl missing');
    }
    return data.publicUrl as string;
  }
};
