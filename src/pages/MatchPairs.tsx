import { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDictionaryStore } from '../stores/useDictionaryStore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Volume2, RefreshCw, User, Sword, Shield, Landmark, Trophy, Crown, Sparkles, ChevronDown, BookOpen, CheckCircle2, LockKeyhole, Play, Target, X, type LucideIcon } from 'lucide-react';
import { speechService } from '../utils/speechUtils';
import { soundService } from '../utils/soundUtils';
import { saveRecentActivity } from '../utils/activity';
import type { Word } from '../types';
import styles from './MatchPairs.module.css';
import { ref, get as dbGet, onValue, set as dbSet } from 'firebase/database';
import { db } from '../firebase';

interface MatchItem {
    id: string;
    text: string;
    isOriginal: boolean;
}

interface MatchColumnEntry {
    item: MatchItem | null;
    slotIndex: number;
}

const createMatchColumnItems = (word: Word, isSwapped: boolean) => ({
    left: {
        id: word.id,
        text: isSwapped ? word.translation : word.original,
        isOriginal: !isSwapped
    },
    right: {
        id: word.id,
        text: isSwapped ? word.original : word.translation,
        isOriginal: isSwapped
    }
});

interface AnswerShuffleMove {
    id: string;
    text: string;
    fromSlotIndex: number;
    toSlotIndex: number;
}

interface AnswerFlightRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface AnswerFlightCard {
    id: string;
    text: string;
    from: AnswerFlightRect;
    to: AnswerFlightRect;
    z: number;
}

interface DropdownPosition {
    top: number;
    left: number;
    width: number;
}

type Phase = 'SETUP' | 'PLAY' | 'GAMEOVER';

const PORTRAIT_LAYOUT_MIN_WIDTH = 769;
const PORTRAIT_LAYOUT_MAX_WIDTH = 1180;
const TWO_COLUMN_MIN_CARD_HEIGHT = 64;
const TWO_COLUMN_ROW_GAP = 8;
const REALM_WORLD_WIDTH = 1320;
const REALM_WORLD_HEIGHT = 920;
const REALM_MIN_SCALE = 0.48;
const REALM_MAX_SCALE = 1.65;
const REALM_FIT_PADDING = 72;
const REALM_CAPTURE_ANIMATION_MS = 1200;
const REALM_DEBUG_PLAYER_ID = 'debug-guest';
const REALM_LOCAL_STORAGE_PREFIX = 'benedicti_match_pairs_realm_';
const REALM_EMPEROR_BADGE_SRC = '/assets/match-pairs/ranks/emperor-badge.png';
const REALM_AXIAL_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
];

const sanitizeRealmKeyPart = (value: string) => value.replace(/[.#$/[\]]/g, '_');

const hashString = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash);
};

const REALM_OWNER_PALETTES = [
    {
        top: 'rgba(137, 45, 56, 0.82)',
        bottom: 'rgba(77, 26, 39, 0.88)',
        border: 'rgba(226, 105, 119, 0.44)',
        glow: 'rgba(137, 45, 56, 0.27)'
    },
    {
        top: 'rgba(46, 123, 86, 0.78)',
        bottom: 'rgba(25, 78, 60, 0.88)',
        border: 'rgba(102, 196, 148, 0.4)',
        glow: 'rgba(46, 123, 86, 0.25)'
    },
    {
        top: 'rgba(45, 84, 157, 0.82)',
        bottom: 'rgba(28, 52, 101, 0.9)',
        border: 'rgba(118, 158, 226, 0.42)',
        glow: 'rgba(45, 84, 157, 0.27)'
    },
    {
        top: 'rgba(104, 69, 154, 0.8)',
        bottom: 'rgba(61, 43, 103, 0.88)',
        border: 'rgba(184, 151, 226, 0.4)',
        glow: 'rgba(104, 69, 154, 0.26)'
    },
    {
        top: 'rgba(160, 103, 31, 0.8)',
        bottom: 'rgba(91, 59, 25, 0.88)',
        border: 'rgba(232, 169, 76, 0.42)',
        glow: 'rgba(160, 103, 31, 0.25)'
    },
    {
        top: 'rgba(51, 111, 130, 0.78)',
        bottom: 'rgba(31, 68, 86, 0.88)',
        border: 'rgba(122, 190, 207, 0.38)',
        glow: 'rgba(51, 111, 130, 0.24)'
    }
];

const REALM_EMPEROR_PALETTE = {
    top: 'rgba(246, 191, 66, 0.9)',
    bottom: 'rgba(146, 95, 18, 0.94)',
    border: 'rgba(254, 243, 199, 0.78)',
    glow: 'rgba(245, 158, 11, 0.38)'
};

const getRealmOwnerPalette = (ownerId: string) => REALM_OWNER_PALETTES[hashString(ownerId) % REALM_OWNER_PALETTES.length];

const chooseEvenHomeCellId = (
    edgeCells: RealmCell[],
    usedHomeCellIds: Set<string>,
    participantIndex: number,
    participantCount: number,
    preferredHomeCellId?: string
) => {
    if (edgeCells.length === 0) return '';

    const validEdgeIds = new Set(edgeCells.map(cell => cell.id));
    if (preferredHomeCellId && validEdgeIds.has(preferredHomeCellId) && !usedHomeCellIds.has(preferredHomeCellId)) {
        usedHomeCellIds.add(preferredHomeCellId);
        return preferredHomeCellId;
    }

    const targetIndex = Math.floor((participantIndex * edgeCells.length) / Math.max(1, participantCount));
    const idealGap = Math.max(1, Math.floor(edgeCells.length / Math.max(1, participantCount + 1)));

    for (let gap = idealGap; gap >= 1; gap -= 1) {
        for (let offset = 0; offset < edgeCells.length; offset += 1) {
            const direction = offset % 2 === 0 ? 1 : -1;
            const steps = Math.ceil(offset / 2);
            const candidateIndex = (targetIndex + (direction * steps) + edgeCells.length) % edgeCells.length;
            const candidate = edgeCells[candidateIndex];
            if (usedHomeCellIds.has(candidate.id)) continue;

            const candidateIndexById = new Map(edgeCells.map((cell, index) => [cell.id, index]));
            const hasEnoughGap = Array.from(usedHomeCellIds).every(usedId => {
                const usedIndex = candidateIndexById.get(usedId);
                if (usedIndex === undefined) return true;
                const distance = Math.abs(candidateIndex - usedIndex);
                const circularDistance = Math.min(distance, edgeCells.length - distance);
                return circularDistance >= gap;
            });

            if (hasEnoughGap) {
                usedHomeCellIds.add(candidate.id);
                return candidate.id;
            }
        }
    }

    const fallback = edgeCells.find(cell => !usedHomeCellIds.has(cell.id)) || edgeCells[hashString(`${participantIndex}`) % edgeCells.length];
    usedHomeCellIds.add(fallback.id);
    return fallback.id;
};

const getHexDistance = (
    first: Pick<RealmCell, 'q' | 'r'>,
    second: Pick<RealmCell, 'q' | 'r'>
) => Math.max(
    Math.abs(first.q - second.q),
    Math.abs(first.r - second.r),
    Math.abs((-first.q - first.r) - (-second.q - second.r))
);

const isFallbackRealmPlayerName = (name?: string) => {
    return !name || /^Player [A-Za-z0-9_-]{4,}$/.test(name.trim());
};

const REALM_PROFILE_NAME_FIELDS = [
    'sovereignName',
    'displayName',
    'name',
    'username',
    'nickname',
    'nickName',
    'screenName',
    'fullName'
] as const;

const REALM_BENE_ID_FIELDS = [
    'beneId',
    'beneID',
    'bene_id',
    'value',
    'id',
    'name',
    'displayName',
    'username'
] as const;

const cleanBeneIdDisplayName = (value: string) => {
    const normalized = value.trim();
    const match = normalized.match(/^Bene_(.+)_\d+$/);
    if (!match) return normalized;

    return match[1].replace(/_/g, ' ').trim() || normalized;
};

const normalizeRealmDisplayValue = (
    value: unknown,
    fields: readonly string[] = REALM_PROFILE_NAME_FIELDS
): string => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (!value || typeof value !== 'object') return '';

    const record = value as Record<string, unknown>;
    for (const field of fields) {
        const normalized = normalizeRealmDisplayValue(record[field], fields);
        if (normalized) return normalized;
    }

    return '';
};

const firstRealmDisplayName = (
    values: unknown[],
    fields: readonly string[] = REALM_PROFILE_NAME_FIELDS
) => {
    for (const value of values) {
        const normalized = normalizeRealmDisplayValue(value, fields);
        if (normalized) return normalized;
    }

    return '';
};

const nonFallbackRealmName = (name?: string) => {
    const normalized = normalizeRealmDisplayValue(name);
    return normalized && !isFallbackRealmPlayerName(normalized) ? normalized : '';
};

const isTrustedRealmPlayerRecord = (
    record: Pick<RealmPlayerRecord, 'rankSource' | 'updatedBy'> | undefined,
    uid: string
) => {
    return record?.rankSource === 'self' || record?.updatedBy === uid;
};

const getHighestCompletedRankId = (
    progress: Record<string, unknown>,
    ranks: readonly Pick<Rank, 'id'>[]
) => {
    let highestRankId = 'citizen';

    ranks.forEach(rank => {
        if (progress[rank.id] === true) {
            highestRankId = rank.id;
        }
    });

    return highestRankId;
};

const getValidRankId = (rankId: string | undefined, ranks: readonly Pick<Rank, 'id'>[]) => {
    return rankId && ranks.some(rank => rank.id === rankId) ? rankId : '';
};

interface Rank {
    id: string;
    name: string;
    count: number;
    isDirectionSwapped?: boolean;
    icon: LucideIcon;
    badgeSrc: string;
    description: string;
}

interface RealmCell {
    id: string;
    q: number;
    r: number;
    ring: number;
    x: number;
    y: number;
    state: 'neutral' | 'owned';
    ownerId?: string;
    player?: RealmPlayer;
}

interface RealmPlayer {
    id: string;
    name: string;
    rankId: string;
    rankName: string;
    badgeSrc: string;
    score: number;
    isCurrent: boolean;
    homeCellId: string;
    territoryCells: number;
    territoryPercent: number;
    isDemo?: boolean;
}

interface RealmPlayerRecord {
    id: string;
    name: string;
    rankId: string;
    homeCellId: string;
    updatedAt: number;
    rankSource?: 'self';
    updatedBy?: string;
}

interface RealmParticipant {
    id: string;
    name: string;
    rankId: string;
}

interface RealmConquestState {
    players: Record<string, RealmPlayerRecord>;
    cells: Record<string, string>;
    reviewConquestStarted?: boolean;
}

interface PendingRealmWrite {
    stateKey: string;
    state: RealmConquestState;
    changedCellIds: string[];
    changedPlayerIds: string[];
}

export default function MatchPairs() {
    const { dictId } = useParams<{ dictId: string }>();
    const [searchParams] = useSearchParams();
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const { language, t } = useLanguage();

    const RANKS = useMemo<Rank[]>(() => [
        { id: 'citizen', name: t('ranks.citizen.name'), count: 4, icon: User, badgeSrc: '/assets/match-pairs/ranks/citizen-badge.png', description: `4 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.citizen.desc')}` },
        { id: 'knight', name: t('ranks.knight.name'), count: 4, isDirectionSwapped: true, icon: Sword, badgeSrc: '/assets/match-pairs/ranks/knight-badge.png', description: `4 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.knight.desc')}` },
        { id: 'baron', name: t('ranks.baron.name'), count: 5, icon: Shield, badgeSrc: '/assets/match-pairs/ranks/baron-badge.png', description: `5 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.baron.desc')}` },
        { id: 'count', name: t('ranks.count.name'), count: 5, isDirectionSwapped: true, icon: Landmark, badgeSrc: '/assets/match-pairs/ranks/count-badge.png', description: `5 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.count.desc')}` },
        { id: 'duke', name: t('ranks.duke.name'), count: 6, icon: Trophy, badgeSrc: '/assets/match-pairs/ranks/duke-badge.png', description: `6 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.duke.desc')}` },
        { id: 'king', name: t('ranks.king.name'), count: 7, icon: Crown, badgeSrc: '/assets/match-pairs/ranks/king-badge.png', description: `7 ${t('games.pairwords.pairsCount', { count: '' })}: ${t('ranks.king.desc')}` },
    ], [t]);

    const fetchWords = useDictionaryStore(state => state.fetchWords);
    const fetchSharedWords = useDictionaryStore(state => state.fetchSharedWords);
    const fetchDictionaries = useDictionaryStore(state => state.fetchDictionaries);
    const answerWordLeitner = useDictionaryStore(state => state.answerWordLeitner);
    const dictionaries = useDictionaryStore(state => state.dictionaries);
    const storeWords = useDictionaryStore(state => state.words);
    const loading = useDictionaryStore(state => state.loading);

    const [allWordsPool, setAllWordsPool] = useState<Word[]>([]);
    const [leftColumn, setLeftColumn] = useState<(MatchItem | null)[]>([]);
    const [rightColumn, setRightColumn] = useState<(MatchItem | null)[]>([]);

    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
    const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
    const [newlyAppearingIds, setNewlyAppearingIds] = useState<Set<string>>(new Set());
    const [isAnswerShuffleLocked, setIsAnswerShuffleLocked] = useState(false);
    const [answerHiddenSlotIndices, setAnswerHiddenSlotIndices] = useState<Set<number>>(new Set());
    const [answerFlightCards, setAnswerFlightCards] = useState<AnswerFlightCard[]>([]);
    const [useTabletFourColumnLayout, setUseTabletFourColumnLayout] = useState(false);
    const [realmPan, setRealmPan] = useState({ x: -320, y: -220 });
    const [realmScale, setRealmScale] = useState(0.72);
    const [selectedRealmPlayer, setSelectedRealmPlayer] = useState<RealmPlayer | null>(null);
    const [realmState, setRealmState] = useState<RealmConquestState>({ players: {}, cells: {} });
    const [realmStateLoadKey, setRealmStateLoadKey] = useState<string | null>(null);
    const [realmParticipants, setRealmParticipants] = useState<RealmParticipant[]>([]);
    const [isConquestMode, setIsConquestMode] = useState(false);
    const [capturedRealmCellIds, setCapturedRealmCellIds] = useState<Set<string>>(new Set());

    const [isEliteMode, setIsEliteMode] = useState(() => {
        const saved = localStorage.getItem('benedicti_match_elite');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const [score, setScore] = useState(0);
    const [totalPairs, setTotalPairs] = useState(0);

    const nextWordIndex = useRef(0);

    const [phase, setPhase] = useState<Phase>('SETUP');
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
    const [isDictSelectorOpen, setIsDictSelectorOpen] = useState(false);
    const [dictDropdownPosition, setDictDropdownPosition] = useState<DropdownPosition | null>(null);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [isMobileSetupOpen, setIsMobileSetupOpen] = useState(false);
    const ANSWER_FLIGHT_MS = 820;

    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState(0);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const answerShuffleTimeoutRef = useRef<number | null>(null);
    const answerFlightStageRef = useRef<HTMLDivElement | null>(null);
    const dictSelectorRef = useRef<HTMLDivElement | null>(null);
    const completionProgressHandledRef = useRef(false);
    const realmCaptureAnimationTimeoutsRef = useRef<number[]>([]);
    const pendingRealmWriteRef = useRef<PendingRealmWrite | null>(null);
    const realmViewportRef = useRef<HTMLDivElement | null>(null);
    const realmDragRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        startPan: { x: number; y: number };
    } | null>(null);
    const realmPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const realmPinchRef = useRef<{
        distance: number;
        centerX: number;
        centerY: number;
        scale: number;
        pan: { x: number; y: number };
    } | null>(null);
    const realmScaleRef = useRef(0.72);
    const realmInitialFitKeyRef = useRef<string | null>(null);

    const [perfectRanks, setPerfectRanks] = useState<Record<string, boolean>>({});
    const isTemporaryAdminRealmKing = searchParams.get('adminRealm') === 'king';

    const effectivePerfectRanks = useMemo(() => {
        if (!isTemporaryAdminRealmKing) return perfectRanks;

        // Temporary debug/admin shortcut for realm QA; remove when real admin tooling exists.
        const nextRanks = { ...perfectRanks };
        for (const rank of RANKS) {
            nextRanks[rank.id] = true;
            if (rank.id === 'king') break;
        }
        return nextRanks;
    }, [isTemporaryAdminRealmKing, perfectRanks, RANKS]);

    const playableWords = useMemo(() => {
        return storeWords.filter(word => word.original.trim() && word.translation.trim());
    }, [storeWords]);

    const currentDictionary = useMemo(() => {
        return dictionaries.find(dictionary => dictionary.id === (dictId || 'default'));
    }, [dictId, dictionaries]);

    const activeDictionaryName = useMemo(() => {
        if (!currentUser || dictId === 'default' || !dictId) {
            return t('common.defaultDict');
        }

        return currentDictionary?.name || '...';
    }, [currentDictionary, currentUser, dictId, t]);

    const realmOwnerUid = useMemo(() => {
        const activeDictId = dictId || 'default';
        if (!currentDictionary || activeDictId === 'default') return '';
        return currentDictionary.userId || '';
    }, [currentDictionary, dictId]);

    const realmKey = useMemo(() => {
        const activeDictId = dictId || 'default';

        if (activeDictId === 'default') {
            return `shared_${sanitizeRealmKeyPart(activeDictId)}`;
        }

        if (!currentDictionary) {
            return '';
        }

        if (currentDictionary.isShared) {
            return `shared_${sanitizeRealmKeyPart(activeDictId)}`;
        }

        const ownerId = currentDictionary.isTeacherDict
            ? realmOwnerUid
            : (realmOwnerUid || currentUser?.uid || 'guest');

        return `owner_${sanitizeRealmKeyPart(ownerId)}_dict_${sanitizeRealmKeyPart(activeDictId)}`;
    }, [currentDictionary, currentUser, dictId, realmOwnerUid]);
    const realmDebugStorageKey = useMemo(() => {
        const reviewFreshKey = searchParams.get('reviewFresh');
        return `${REALM_LOCAL_STORAGE_PREFIX}${realmKey}${reviewFreshKey ? `_review_${sanitizeRealmKeyPart(reviewFreshKey)}_home_seed_v2` : ''}`;
    }, [realmKey, searchParams]);
    const isFreshReviewDebugRealm = isTemporaryAdminRealmKing && !currentUser && Boolean(searchParams.get('reviewFresh'));
    const realmStateKey = currentUser
        ? `firebase:${realmKey}`
        : `local:${realmDebugStorageKey}`;
    const isRealmStateReady = realmStateLoadKey === realmStateKey;

    const currentRealmPlayerId = currentUser?.uid || REALM_DEBUG_PLAYER_ID;
    const currentRealmPlayerName = firstRealmDisplayName([
        userProfile?.sovereignName,
        userProfile?.displayName,
        currentUser?.displayName,
        userProfile?.name,
        userProfile?.username,
        userProfile?.nickname,
        userProfile?.nickName,
        userProfile?.screenName,
        userProfile?.fullName,
        currentUser?.email?.split('@')[0]
    ]) || (language === 'ru' ? 'Гость' : 'Guest');

    const resolveRealmDisplayName = useCallback(async (uid: string, persistedRecord?: RealmPlayerRecord) => {
        if (uid === currentUser?.uid) {
            return firstRealmDisplayName([
                userProfile?.sovereignName,
                userProfile?.displayName,
                currentUser.displayName,
                userProfile?.name,
                userProfile?.username,
                userProfile?.nickname,
                userProfile?.nickName,
                userProfile?.screenName,
                userProfile?.fullName,
                currentUser.email?.split('@')[0],
                nonFallbackRealmName(persistedRecord?.name)
            ]) || `Player ${uid.slice(0, 6)}`;
        }

        let profileName = '';
        let profileBeneId = '';
        let beneId = '';

        try {
            const profileSnapshot = await dbGet(ref(db, `users/${uid}/profile`));
            if (profileSnapshot.exists()) {
                const profile = profileSnapshot.val();
                profileName = normalizeRealmDisplayValue(profile, REALM_PROFILE_NAME_FIELDS);
                profileBeneId = cleanBeneIdDisplayName(normalizeRealmDisplayValue(profile, ['beneId']));
            }
        } catch (error) {
            console.warn('Failed to read realm participant private profile:', error);
        }

        try {
            const beneIdSnapshot = await dbGet(ref(db, `shared/uid_to_beneid/${uid}`));
            beneId = beneIdSnapshot.exists()
                ? cleanBeneIdDisplayName(normalizeRealmDisplayValue(beneIdSnapshot.val(), REALM_BENE_ID_FIELDS))
                : '';
        } catch (error) {
            console.warn('Failed to read realm participant shared BeneID:', error);
        }

        return firstRealmDisplayName([
            profileName,
            profileBeneId,
            beneId,
            isTrustedRealmPlayerRecord(persistedRecord, uid)
                ? nonFallbackRealmName(persistedRecord?.name)
                : ''
        ]) || `Player ${uid.slice(0, 6)}`;
    }, [currentUser, userProfile]);

    const resolveRealmParticipantRankId = useCallback((uid: string, persistedRecord?: RealmPlayerRecord) => {
        if (uid === REALM_DEBUG_PLAYER_ID && isTemporaryAdminRealmKing) {
            return 'king';
        }

        if (uid === currentUser?.uid) {
            return getHighestCompletedRankId(effectivePerfectRanks, RANKS);
        }

        const trustedPersistedRank = isTrustedRealmPlayerRecord(persistedRecord, uid)
            ? getValidRankId(persistedRecord?.rankId, RANKS)
            : '';
        if (trustedPersistedRank) return trustedPersistedRank;

        return 'citizen';
    }, [RANKS, currentUser, effectivePerfectRanks, isTemporaryAdminRealmKing]);

    useEffect(() => {
        realmScaleRef.current = realmScale;
    }, [realmScale]);

    useEffect(() => {
        let isActive = true;

        const loadRealmParticipants = async () => {
            if (!realmKey || !isRealmStateReady) {
                setRealmParticipants([]);
                return;
            }

            const existingPlayerIds = Object.keys(realmState.players)
                .filter(uid => currentUser || uid === REALM_DEBUG_PLAYER_ID || !uid.startsWith('demo-'));

            if (!currentUser) {
                if (!isTemporaryAdminRealmKing) {
                    setRealmParticipants([]);
                    return;
                }

                const debugIds = Array.from(new Set([currentRealmPlayerId, ...existingPlayerIds]));
                const debugParticipants = debugIds.map(uid => ({
                    id: uid,
                    name: realmState.players[uid]?.name || currentRealmPlayerName,
                    rankId: uid === REALM_DEBUG_PLAYER_ID
                        ? 'king'
                        : getValidRankId(realmState.players[uid]?.rankId, RANKS) || 'citizen'
                }));
                if (isActive) setRealmParticipants(debugParticipants);
                return;
            }

            const activeDictId = dictId || 'default';
            const participantIds = new Set<string>([currentUser.uid, ...existingPlayerIds]);

            try {
                const ownerUid = activeDictId !== 'default' ? realmOwnerUid : '';

                if (ownerUid) {
                    participantIds.add(ownerUid);
                    const studentsSnapshot = await dbGet(ref(db, `shared/relations/teacher_students/${ownerUid}`));
                    if (studentsSnapshot.exists()) {
                        Object.keys(studentsSnapshot.val() || {}).forEach(uid => participantIds.add(uid));
                    }
                }

                const participants = await Promise.all(
                    Array.from(participantIds)
                        .filter(uid => uid && !uid.startsWith('demo-'))
                        .sort((a, b) => {
                            if (realmOwnerUid) {
                                if (a === realmOwnerUid) return -1;
                                if (b === realmOwnerUid) return 1;
                            }
                            return a.localeCompare(b);
                        })
                        .map(async uid => ({
                            id: uid,
                            name: await resolveRealmDisplayName(uid, realmState.players[uid]),
                            rankId: resolveRealmParticipantRankId(uid, realmState.players[uid])
                        }))
                );

                if (isActive) {
                    setRealmParticipants(participants);
                }
            } catch (error) {
                console.warn('Failed to load Match Pairs realm participants:', error);
                const fallbackParticipant = {
                    id: currentUser.uid,
                    name: currentRealmPlayerName,
                    rankId: getHighestCompletedRankId(effectivePerfectRanks, RANKS)
                };
                if (isActive) setRealmParticipants([fallbackParticipant]);
            }
        };

        loadRealmParticipants();

        return () => {
            isActive = false;
        };
    }, [
        currentDictionary,
        currentRealmPlayerId,
        currentRealmPlayerName,
        currentUser,
        dictId,
        isRealmStateReady,
        isTemporaryAdminRealmKing,
        realmOwnerUid,
        realmKey,
        realmState.players,
        resolveRealmDisplayName,
        resolveRealmParticipantRankId,
        RANKS,
        effectivePerfectRanks
    ]);

    const clampRealmScale = useCallback((scale: number) => {
        return Math.min(REALM_MAX_SCALE, Math.max(REALM_MIN_SCALE, scale));
    }, []);

    const clampRealmPan = useCallback((nextPan: { x: number; y: number }, scale?: number) => {
        const viewport = realmViewportRef.current;
        if (!viewport) return nextPan;

        const rect = viewport.getBoundingClientRect();
        const activeScale = scale ?? realmScaleRef.current;
        const scaledWidth = REALM_WORLD_WIDTH * activeScale;
        const scaledHeight = REALM_WORLD_HEIGHT * activeScale;
        const minX = Math.min(0, rect.width - scaledWidth);
        const minY = Math.min(0, rect.height - scaledHeight);
        const maxX = scaledWidth < rect.width ? (rect.width - scaledWidth) / 2 : 0;
        const maxY = scaledHeight < rect.height ? (rect.height - scaledHeight) / 2 : 0;

        return {
            x: Math.min(maxX, Math.max(minX, nextPan.x)),
            y: Math.min(maxY, Math.max(minY, nextPan.y))
        };
    }, []);

    const baseRealmCells = useMemo<RealmCell[]>(() => {
        const targetCells = Math.min(96, Math.max(42, playableWords.length + 6));
        const fullRingCellCount = (ringRadius: number) => 1 + (3 * ringRadius * (ringRadius + 1));
        let completeRadius = 0;

        while (
            fullRingCellCount(completeRadius) < targetCells ||
            completeRadius * 6 < 6
        ) {
            completeRadius += 1;
        }

        const coordinates: Array<{ q: number; r: number }> = [{ q: 0, r: 0 }];

        for (let radius = 1; radius <= completeRadius; radius += 1) {
            let q = -radius;
            let r = radius;

            REALM_AXIAL_DIRECTIONS.forEach(direction => {
                for (let step = 0; step < radius; step += 1) {
                    coordinates.push({ q, r });
                    q += direction.q;
                    r += direction.r;
                }
            });
        }

        const cells = coordinates.map(({ q, r }) => {
            const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
            const hexSize = 41;
            const x = (REALM_WORLD_WIDTH / 2) + (Math.sqrt(3) * hexSize * (q + r / 2));
            const y = (REALM_WORLD_HEIGHT / 2) + (1.5 * hexSize * r);

            return {
                id: `${q}:${r}`,
                q,
                r,
                ring,
                x,
                y,
                state: 'neutral' as const
            };
        });

        return cells;
    }, [playableWords.length]);

    const realmEdgeCells = useMemo(() => {
        if (baseRealmCells.length === 0) return [];

        const outerRing = Math.max(...baseRealmCells.map(cell => cell.ring));
        return baseRealmCells
            .filter(cell => cell.ring === outerRing)
            .sort((a, b) => {
                const centerX = REALM_WORLD_WIDTH / 2;
                const centerY = REALM_WORLD_HEIGHT / 2;
                return Math.atan2(a.y - centerY, a.x - centerX) - Math.atan2(b.y - centerY, b.x - centerX);
            });
    }, [baseRealmCells]);

    const realmPlayers = useMemo<RealmPlayer[]>(() => {
        const rankById = new Map(RANKS.map(rank => [rank.id, rank]));
        const citizenRank = rankById.get('citizen') || RANKS[0];
        const usedHomeCellIds = new Set<string>();
        const territoryCounts = new Map<string, number>();

        Object.values(realmState.cells).forEach(ownerId => {
            territoryCounts.set(ownerId, (territoryCounts.get(ownerId) || 0) + 1);
        });

        const participants = realmParticipants.length > 0
            ? realmParticipants
            : [{
                id: currentRealmPlayerId,
                name: currentRealmPlayerName,
                rankId: isTemporaryAdminRealmKing ? 'king' : getHighestCompletedRankId(effectivePerfectRanks, RANKS)
            }];

        return participants.map((participant, index) => {
            const rank = rankById.get(participant.rankId) || citizenRank;
            const homeCellId = chooseEvenHomeCellId(
                realmEdgeCells,
                usedHomeCellIds,
                index,
                participants.length
            );
            const territoryCells = territoryCounts.get(participant.id) || 0;
            const territoryPercent = baseRealmCells.length > 0
                ? Math.round((territoryCells / baseRealmCells.length) * 100)
                : 0;

            return {
                id: participant.id,
                name: participant.name,
                rankId: rank.id,
                rankName: rank.name,
                badgeSrc: rank.badgeSrc,
                score: territoryCells,
                isCurrent: participant.id === currentRealmPlayerId,
                homeCellId,
                territoryCells,
                territoryPercent
            };
        });
    }, [
        RANKS,
        baseRealmCells.length,
        currentRealmPlayerId,
        currentRealmPlayerName,
        effectivePerfectRanks,
        isTemporaryAdminRealmKing,
        realmEdgeCells,
        realmParticipants,
        realmState
    ]);

    const currentRealmPlayer = useMemo(() => {
        return realmPlayers.find(player => player.isCurrent) || null;
    }, [realmPlayers]);

    const realmEmperorPlayerId = useMemo(() => {
        if (realmPlayers.length === 0) return '';

        const highestTerritoryCount = Math.max(...realmPlayers.map(player => player.territoryCells));
        if (highestTerritoryCount <= 1) return '';

        const leaders = realmPlayers.filter(player => player.territoryCells === highestTerritoryCount);
        return leaders.length === 1 ? leaders[0].id : '';
    }, [realmPlayers]);

    const realmEmperorPlayer = useMemo(() => {
        return realmEmperorPlayerId
            ? realmPlayers.find(player => player.id === realmEmperorPlayerId) || null
            : null;
    }, [realmEmperorPlayerId, realmPlayers]);

    const getRealmDisplayStatus = useCallback((player?: RealmPlayer | null) => {
        if (!player) return t('games.pairwords.realmKing');
        return player.id === realmEmperorPlayerId
            ? t('games.pairwords.realmEmperor')
            : player.rankName;
    }, [realmEmperorPlayerId, t]);

    const realmCells = useMemo<RealmCell[]>(() => {
        const playerByCellId = new Map<string, RealmPlayer>();

        realmPlayers.forEach(player => {
            if (player.homeCellId) {
                playerByCellId.set(player.homeCellId, player);
            }
        });

        return baseRealmCells.map(cell => {
            const ownerId = realmState.cells[cell.id];
            return {
                ...cell,
                state: ownerId ? 'owned' as const : 'neutral' as const,
                ownerId,
                player: playerByCellId.get(cell.id)
            };
        });
    }, [baseRealmCells, realmPlayers, realmState.cells]);

    useEffect(() => {
        let isActive = true;
        let unsubscribeRealm: (() => void) | undefined;

        const applyPendingRealmWrite = (snapshotState: RealmConquestState) => {
            const pendingWrite = pendingRealmWriteRef.current;
            if (!pendingWrite || pendingWrite.stateKey !== realmStateKey) return snapshotState;

            const mergedState: RealmConquestState = {
                players: { ...snapshotState.players },
                cells: { ...snapshotState.cells },
                reviewConquestStarted: snapshotState.reviewConquestStarted || pendingWrite.state.reviewConquestStarted
            };

            pendingWrite.changedPlayerIds.forEach(playerId => {
                const playerRecord = pendingWrite.state.players[playerId];
                if (playerRecord) {
                    mergedState.players[playerId] = playerRecord;
                }
            });

            pendingWrite.changedCellIds.forEach(cellId => {
                const ownerId = pendingWrite.state.cells[cellId];
                if (ownerId) {
                    mergedState.cells[cellId] = ownerId;
                    return;
                }
                delete mergedState.cells[cellId];
            });

            return mergedState;
        };

        const loadRealmState = async () => {
            setRealmStateLoadKey(null);
            setRealmState({ players: {}, cells: {} });

            if (!realmKey) {
                return;
            }

            if (!currentUser) {
                if (!isTemporaryAdminRealmKing) {
                    setRealmState({ players: {}, cells: {} });
                    return;
                }

                try {
                    const savedState = localStorage.getItem(realmDebugStorageKey);
                    if (!isActive) return;
                    setRealmState(savedState
                        ? JSON.parse(savedState) as RealmConquestState
                        : { players: {}, cells: {} });
                    setRealmStateLoadKey(realmStateKey);
                } catch (error) {
                    console.warn('Failed to load local Match Pairs realm state:', error);
                    if (isActive) {
                        setRealmState({ players: {}, cells: {} });
                        setRealmStateLoadKey(realmStateKey);
                    }
                }
                return;
            }

            const realmRef = ref(db, `matchPairsRealms/${realmKey}`);
            unsubscribeRealm = onValue(realmRef, snapshot => {
                if (!isActive) return;
                const snapshotValue = snapshot.val() || {};
                const snapshotState = {
                    players: snapshotValue.players || {},
                    cells: snapshotValue.cells || {},
                    reviewConquestStarted: snapshotValue.reviewConquestStarted
                };
                setRealmState(applyPendingRealmWrite(snapshotState));
                setRealmStateLoadKey(realmStateKey);
            }, error => {
                console.warn('Failed to load Match Pairs realm state:', error);
                if (isActive) {
                    setRealmState({ players: {}, cells: {} });
                    setRealmStateLoadKey(realmStateKey);
                }
            });
        };

        loadRealmState();

        return () => {
            isActive = false;
            unsubscribeRealm?.();
        };
    }, [currentUser, isTemporaryAdminRealmKing, realmDebugStorageKey, realmKey, realmStateKey]);

    const persistRealmState = useCallback((
        nextState: RealmConquestState,
        changedCellIds: string[],
        changedPlayerIds: string[] = Object.keys(nextState.players)
    ) => {
        if (!realmKey) return;

        setRealmState(nextState);

        if (currentUser) {
            const writes: Array<Promise<void>> = [];
            const pendingWrite: PendingRealmWrite = {
                stateKey: realmStateKey,
                state: nextState,
                changedCellIds: [...changedCellIds],
                changedPlayerIds: [...changedPlayerIds]
            };
            pendingRealmWriteRef.current = pendingWrite;

            changedPlayerIds
                .map(playerId => nextState.players[playerId])
                .filter((playerRecord): playerRecord is RealmPlayerRecord => Boolean(playerRecord) && !playerRecord.id.startsWith('demo-'))
                .forEach(playerRecord => {
                writes.push(dbSet(
                    ref(db, `matchPairsRealms/${realmKey}/players/${playerRecord.id}`),
                    playerRecord
                ));
            });

            changedCellIds.forEach(cellId => {
                writes.push(dbSet(
                    ref(db, `matchPairsRealms/${realmKey}/cells/${cellId}`),
                    nextState.cells[cellId] || null
                ));
            });

            Promise.all(writes).catch(error => {
                console.warn('Failed to save Match Pairs realm state:', error);
            }).finally(() => {
                if (pendingRealmWriteRef.current === pendingWrite) {
                    pendingRealmWriteRef.current = null;
                }
            });
            return;
        }

        if (isTemporaryAdminRealmKing) {
            localStorage.setItem(
                realmDebugStorageKey,
                JSON.stringify(nextState)
            );
        }
    }, [currentUser, isTemporaryAdminRealmKing, realmDebugStorageKey, realmKey, realmStateKey]);

    useEffect(() => {
        if (!realmKey || !isRealmStateReady || realmPlayers.length === 0) return;

        const nextPlayers = { ...realmState.players };
        const shouldKeepOnlyHomes = isFreshReviewDebugRealm && !realmState.reviewConquestStarted;
        const nextCells = shouldKeepOnlyHomes ? {} : { ...realmState.cells };
        const changedCellIds: string[] = [];
        const changedPlayerIds: string[] = [];
        const realmEdgeCellIds = new Set(realmEdgeCells.map(cell => cell.id));
        let didChange = false;

        if (shouldKeepOnlyHomes && Object.keys(realmState.cells).length > 0) {
            didChange = true;
        }

        realmPlayers.forEach(player => {
            if (!player.homeCellId) return;

            const existingRecord = realmState.players[player.id];
            const shouldSelfPublishPlayer = player.id === currentRealmPlayerId;

            if (shouldSelfPublishPlayer) {
                const nextPlayerRecord: RealmPlayerRecord = {
                    id: player.id,
                    name: player.name,
                    rankId: player.rankId,
                    homeCellId: player.homeCellId,
                    updatedAt: existingRecord?.updatedAt || Date.now(),
                    rankSource: 'self',
                    updatedBy: player.id
                };

                if (
                    existingRecord?.name !== nextPlayerRecord.name ||
                    existingRecord?.rankId !== nextPlayerRecord.rankId ||
                    existingRecord?.homeCellId !== nextPlayerRecord.homeCellId ||
                    existingRecord?.rankSource !== nextPlayerRecord.rankSource ||
                    existingRecord?.updatedBy !== nextPlayerRecord.updatedBy
                ) {
                    nextPlayers[player.id] = {
                        ...nextPlayerRecord,
                        updatedAt: Date.now()
                    };
                    changedPlayerIds.push(player.id);
                    didChange = true;
                }

                if (
                    existingRecord?.homeCellId &&
                    existingRecord.homeCellId !== player.homeCellId &&
                    realmEdgeCellIds.has(existingRecord.homeCellId) &&
                    nextCells[existingRecord.homeCellId] === player.id
                ) {
                    delete nextCells[existingRecord.homeCellId];
                    changedCellIds.push(existingRecord.homeCellId);
                    didChange = true;
                }
            }

            if (nextCells[player.homeCellId] !== player.id) {
                nextCells[player.homeCellId] = player.id;
                changedCellIds.push(player.homeCellId);
                didChange = true;
            }
        });

        if (!didChange) return;

        persistRealmState({
            players: nextPlayers,
            cells: nextCells,
            reviewConquestStarted: realmState.reviewConquestStarted
        }, changedCellIds, changedPlayerIds);
    }, [
        currentRealmPlayerId,
        persistRealmState,
        isRealmStateReady,
        isFreshReviewDebugRealm,
        realmKey,
        realmEdgeCells,
        realmPlayers,
        realmState
    ]);

    const fitRealmBounds = useCallback((bounds: { minX: number; minY: number; maxX: number; maxY: number }) => {
        const viewport = realmViewportRef.current;
        if (!viewport) return;

        const rect = viewport.getBoundingClientRect();
        const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
        const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
        const nextScale = clampRealmScale(Math.min(
            (rect.width - REALM_FIT_PADDING) / boundsWidth,
            (rect.height - REALM_FIT_PADDING) / boundsHeight
        ));
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        realmScaleRef.current = nextScale;
        setRealmScale(nextScale);
        setRealmPan(clampRealmPan({
            x: (rect.width / 2) - (centerX * nextScale),
            y: (rect.height / 2) - (centerY * nextScale)
        }, nextScale));
    }, [clampRealmPan, clampRealmScale]);

    const centerCurrentRealmKingdom = useCallback(() => {
        const currentPlayer = realmPlayers.find(player => player.isCurrent);
        if (!currentPlayer) return;

        const fallbackCell = realmCells.find(cell => cell.player?.id === currentPlayer.id);
        const ownedCells = realmCells.filter(cell => cell.ownerId === currentPlayer.id);
        const cellsToFit = fallbackCell ? [fallbackCell, ...ownedCells] : ownedCells;

        if (cellsToFit.length === 0) return;

        fitRealmBounds({
            minX: Math.min(...cellsToFit.map(cell => cell.x)) - 70,
            minY: Math.min(...cellsToFit.map(cell => cell.y)) - 78,
            maxX: Math.max(...cellsToFit.map(cell => cell.x)) + 70,
            maxY: Math.max(...cellsToFit.map(cell => cell.y)) + 78
        });
    }, [fitRealmBounds, realmCells, realmPlayers]);

    const realmInitialFitKey = useMemo(() => {
        const currentPlayer = realmPlayers.find(player => player.isCurrent);
        if (!currentPlayer) return '';

        const fallbackCell = realmCells.find(cell => cell.player?.id === currentPlayer.id);
        const ownedCells = realmCells.filter(cell => cell.ownerId === currentPlayer.id);
        const cellsToFit = fallbackCell ? [fallbackCell, ...ownedCells] : ownedCells;

        if (cellsToFit.length === 0) return '';

        const cellKey = cellsToFit
            .map(cell => cell.id)
            .sort()
            .join(',');

        return `${dictId || 'default'}:${playableWords.length}:${currentPlayer.id}:${cellKey}`;
    }, [dictId, playableWords.length, realmCells, realmPlayers]);

    useEffect(() => {
        if (!effectivePerfectRanks.king || !realmInitialFitKey) {
            realmInitialFitKeyRef.current = null;
            return;
        }

        if (realmInitialFitKeyRef.current === realmInitialFitKey) return;
        realmInitialFitKeyRef.current = realmInitialFitKey;

        const frame = window.requestAnimationFrame(() => {
            centerCurrentRealmKingdom();
        });

        return () => window.cancelAnimationFrame(frame);
    }, [centerCurrentRealmKingdom, effectivePerfectRanks.king, realmInitialFitKey]);

    const markRealmCellCaptured = useCallback((cellId: string) => {
        setCapturedRealmCellIds(previousIds => {
            const nextIds = new Set(previousIds);
            nextIds.add(cellId);
            return nextIds;
        });

        const timeoutId = window.setTimeout(() => {
            setCapturedRealmCellIds(previousIds => {
                if (!previousIds.has(cellId)) return previousIds;
                const nextIds = new Set(previousIds);
                nextIds.delete(cellId);
                return nextIds;
            });
            realmCaptureAnimationTimeoutsRef.current = realmCaptureAnimationTimeoutsRef.current.filter(id => id !== timeoutId);
        }, REALM_CAPTURE_ANIMATION_MS);

        realmCaptureAnimationTimeoutsRef.current.push(timeoutId);
    }, []);

    useEffect(() => () => {
        realmCaptureAnimationTimeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
        realmCaptureAnimationTimeoutsRef.current = [];
    }, []);

    const applyRealmCapture = useCallback(() => {
        if (!realmKey || !currentRealmPlayer) return false;

        const cellById = new Map(realmCells.map(cell => [cell.id, cell]));
        const homeCell = cellById.get(currentRealmPlayer.homeCellId);
        if (!homeCell) return false;

        const ownedCells = realmCells.filter(cell => cell.ownerId === currentRealmPlayer.id);
        const sourceCells = ownedCells.length > 0 ? ownedCells : [homeCell];
        const sourceIds = new Set(sourceCells.map(cell => cell.id));
        const protectedHomeCellIds = new Set<string>([currentRealmPlayer.homeCellId]);
        realmPlayers.forEach(player => {
            if (player.homeCellId) protectedHomeCellIds.add(player.homeCellId);
        });
        Object.values(realmState.players).forEach(playerRecord => {
            if (playerRecord?.homeCellId) protectedHomeCellIds.add(playerRecord.homeCellId);
        });
        realmCells.forEach(cell => {
            if (cell.player?.homeCellId) protectedHomeCellIds.add(cell.player.homeCellId);
        });

        const isProtectedHomeCell = (cell: RealmCell | undefined) => {
            return Boolean(cell && (protectedHomeCellIds.has(cell.id) || cell.player));
        };

        const getAdjacentCandidates = (allowOwnedByOtherPlayers: boolean) => {
            const candidates = new Map<string, RealmCell>();

            sourceCells.forEach(sourceCell => {
                REALM_AXIAL_DIRECTIONS.forEach(direction => {
                    const candidate = cellById.get(`${sourceCell.q + direction.q}:${sourceCell.r + direction.r}`);
                    if (!candidate || sourceIds.has(candidate.id)) return;
                    if (isProtectedHomeCell(candidate)) return;

                    if (!allowOwnedByOtherPlayers && candidate.ownerId) return;
                    if (allowOwnedByOtherPlayers && (!candidate.ownerId || candidate.ownerId === currentRealmPlayer.id)) return;

                    candidates.set(candidate.id, candidate);
                });
            });

            return Array.from(candidates.values()).sort((a, b) => (
                getHexDistance(a, homeCell) - getHexDistance(b, homeCell)
                || a.ring - b.ring
                || a.id.localeCompare(b.id)
            ));
        };

        const captureTarget = getAdjacentCandidates(false)[0] || getAdjacentCandidates(true)[0];
        if (!captureTarget) return false;
        if (isProtectedHomeCell(captureTarget)) return false;

        const nextState: RealmConquestState = {
            players: {
                ...realmState.players,
                [currentRealmPlayer.id]: {
                    id: currentRealmPlayer.id,
                    name: currentRealmPlayer.name,
                    rankId: currentRealmPlayer.rankId,
                    homeCellId: currentRealmPlayer.homeCellId,
                    rankSource: 'self',
                    updatedBy: currentRealmPlayer.id,
                    updatedAt: Date.now()
                }
            },
            cells: {
                ...realmState.cells,
                [captureTarget.id]: currentRealmPlayer.id
            },
            reviewConquestStarted: isFreshReviewDebugRealm ? true : realmState.reviewConquestStarted
        };

        persistRealmState(nextState, [captureTarget.id], [currentRealmPlayer.id]);
        markRealmCellCaptured(captureTarget.id);
        return true;
    }, [currentRealmPlayer, markRealmCellCaptured, persistRealmState, realmCells, realmKey, realmPlayers, realmState]);

    const applyRealmShrink = useCallback(() => {
        if (!realmKey || !currentRealmPlayer) return false;

        const cellById = new Map(realmCells.map(cell => [cell.id, cell]));
        const homeCell = cellById.get(currentRealmPlayer.homeCellId);
        if (!homeCell) return false;

        const ownedCells = realmCells
            .filter(cell => cell.ownerId === currentRealmPlayer.id && cell.id !== currentRealmPlayer.homeCellId)
            .sort((a, b) => (
                getHexDistance(b, homeCell) - getHexDistance(a, homeCell)
                || b.ring - a.ring
                || b.id.localeCompare(a.id)
            ));

        const shrinkTarget = ownedCells[0];
        if (!shrinkTarget) return false;

        const nextCells = { ...realmState.cells };
        delete nextCells[shrinkTarget.id];

        persistRealmState({
            ...realmState,
            cells: nextCells
        }, [shrinkTarget.id], []);
        return true;
    }, [currentRealmPlayer, persistRealmState, realmCells, realmKey, realmState]);

    const zoomRealmAtPoint = useCallback((viewportX: number, viewportY: number, nextScale: number) => {
        const clampedScale = clampRealmScale(nextScale);
        const worldX = (viewportX - realmPan.x) / realmScale;
        const worldY = (viewportY - realmPan.y) / realmScale;
        const nextPan = {
            x: viewportX - (worldX * clampedScale),
            y: viewportY - (worldY * clampedScale)
        };

        realmScaleRef.current = clampedScale;
        setRealmScale(clampedScale);
        setRealmPan(clampRealmPan(nextPan, clampedScale));
    }, [clampRealmPan, clampRealmScale, realmPan, realmScale]);

    const handleRealmWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
        event.preventDefault();

        const rect = event.currentTarget.getBoundingClientRect();
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        zoomRealmAtPoint(event.clientX - rect.left, event.clientY - rect.top, realmScale * zoomFactor);
    }, [realmScale, zoomRealmAtPoint]);

    const handleRealmPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('[data-realm-castle-marker="true"]')) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        realmPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (realmPointersRef.current.size === 2) {
            const rect = event.currentTarget.getBoundingClientRect();
            const points = Array.from(realmPointersRef.current.values());
            const [first, second] = points;
            realmPinchRef.current = {
                distance: Math.hypot(second.x - first.x, second.y - first.y),
                centerX: ((first.x + second.x) / 2) - rect.left,
                centerY: ((first.y + second.y) / 2) - rect.top,
                scale: realmScale,
                pan: realmPan
            };
            realmDragRef.current = null;
            return;
        }

        realmDragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startPan: realmPan
        };
    }, [realmPan, realmScale]);

    const handleRealmPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        if (realmPointersRef.current.has(event.pointerId)) {
            realmPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }

        if (realmPinchRef.current && realmPointersRef.current.size >= 2) {
            event.preventDefault();
            const viewport = realmViewportRef.current;
            if (!viewport) return;

            const rect = viewport.getBoundingClientRect();
            const points = Array.from(realmPointersRef.current.values()).slice(0, 2);
            const [first, second] = points;
            const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
            const centerX = ((first.x + second.x) / 2) - rect.left;
            const centerY = ((first.y + second.y) / 2) - rect.top;
            const pinch = realmPinchRef.current;
            const nextScale = clampRealmScale(pinch.scale * (distance / pinch.distance));
            const worldX = (pinch.centerX - pinch.pan.x) / pinch.scale;
            const worldY = (pinch.centerY - pinch.pan.y) / pinch.scale;

            realmScaleRef.current = nextScale;
            setRealmScale(nextScale);
            setRealmPan(clampRealmPan({
                x: centerX - (worldX * nextScale),
                y: centerY - (worldY * nextScale)
            }, nextScale));
            return;
        }

        const drag = realmDragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;

        event.preventDefault();
        setRealmPan(clampRealmPan({
            x: drag.startPan.x + event.clientX - drag.startX,
            y: drag.startPan.y + event.clientY - drag.startY
        }));
    }, [clampRealmPan]);

    const handleRealmPointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        realmPointersRef.current.delete(event.pointerId);
        realmPinchRef.current = null;

        if (realmDragRef.current?.pointerId === event.pointerId) {
            realmDragRef.current = null;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, []);

    useEffect(() => {
        const loadPerfectRanks = async () => {
            const activeDictId = dictId || 'default';
            
            // 1. Load from localStorage as fallback
            const localData: Record<string, boolean> = {};
            RANKS.forEach(rank => {
                const isPerfect = localStorage.getItem(`benedicti_match_perfect_${activeDictId}_${rank.id}`) === 'true';
                if (isPerfect) {
                    localData[rank.id] = true;
                }
            });
            setPerfectRanks(localData);

            // 2. Load from Firebase and merge
            if (currentUser) {
                try {
                    const path = `users/${currentUser.uid}/matchPairsProgress/${activeDictId}`;
                    const snapshot = await dbGet(ref(db, path));
                    if (snapshot.exists()) {
                        const fbData = snapshot.val() as Record<string, boolean>;
                        setPerfectRanks(prev => ({
                            ...prev,
                            ...fbData
                        }));
                        // Sync to localStorage
                        Object.entries(fbData).forEach(([rankId, value]) => {
                            if (value) {
                                localStorage.setItem(`benedicti_match_perfect_${activeDictId}_${rankId}`, 'true');
                            } else {
                                localStorage.removeItem(`benedicti_match_perfect_${activeDictId}_${rankId}`);
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Failed to load progression from Firebase:', e);
                }
            }
        };

        loadPerfectRanks();
    }, [currentUser, dictId, RANKS]);

    const resultTitle = useMemo(() => {
        const isRu = language === 'ru';
        if (errors === 0) {
            return isRu ? "🏆 Идеальный результат!" : "🏆 Perfect Score!";
        } else if (errors <= 3) {
            return isRu ? "🎉 Отличная работа!" : "🎉 Great Job!";
        } else if (errors <= 10) {
            return isRu ? "👍 Хорошая попытка!" : "👍 Good Effort!";
        } else {
            return isRu ? "💪 Нужно больше тренироваться!" : "💪 Keep Practicing!";
        }
    }, [errors, language]);

    const resultMessage = useMemo(() => {
        if (errors === 0) {
            return t('games.pairwords.conqueredRank', { rank: selectedRank?.name || '' });
        } else {
            return language === 'ru' 
                ? "Для покорения ранга завершите игру без ошибок." 
                : "To conquer the rank, complete the game without errors.";
        }
    }, [errors, selectedRank, language, t]);

    // Track activity
    useEffect(() => {
        if (dictId && dictId !== 'default' && dictionaries.length > 0) {
            const currentDict = dictionaries.find(d => d.id === dictId);
            if (currentDict) {
                saveRecentActivity({
                    dictId,
                    dictName: currentDict.name,
                    mode: 'match-pairs'
                });
            }
        }
    }, [dictId, dictionaries]);

    // Initial Load
    useEffect(() => {
        fetchDictionaries(currentUser?.uid);
    }, [currentUser, fetchDictionaries]);

    useEffect(() => {
        const loadWords = async () => {
            setHasAttemptedLoad(false);
            if (dictId === 'default' || !dictId) {
                await fetchWords(currentUser?.uid, 'default');
            } else if (dictId) {
                await fetchWords(currentUser?.uid, dictId);
            }
            setHasAttemptedLoad(true);
        };
        loadWords();
    }, [dictId, currentUser, fetchWords, fetchSharedWords]);

    const handleDictionaryChange = (newDictId: string) => {
        localStorage.setItem('lastUsedDictId', newDictId);
        navigate(`/play/match-pairs/${newDictId}`);
        setIsDictSelectorOpen(false);
    };

    const updateDictDropdownPosition = useCallback(() => {
        const selector = dictSelectorRef.current;
        if (!selector) return;

        const rect = selector.getBoundingClientRect();
        const width = Math.min(420, window.innerWidth - 24);
        setDictDropdownPosition({
            top: rect.bottom + 8 + window.scrollY,
            left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)) + window.scrollX,
            width
        });
    }, []);

    useEffect(() => {
        if (!isDictSelectorOpen) {
            setDictDropdownPosition(null);
            return;
        }

        updateDictDropdownPosition();
        window.addEventListener('resize', updateDictDropdownPosition);
        window.addEventListener('scroll', updateDictDropdownPosition, true);

        return () => {
            window.removeEventListener('resize', updateDictDropdownPosition);
            window.removeEventListener('scroll', updateDictDropdownPosition, true);
        };
    }, [isDictSelectorOpen, updateDictDropdownPosition]);

    // Setup session
    const startLevel = useCallback((rank: Rank, options?: { conquestMode?: boolean }) => {
        const now = Date.now();
        const dueWords = playableWords.filter(w => !w.isLearned && (!w.nextReview || w.nextReview <= now));
        const otherWords = playableWords.filter(w => w.isLearned || (w.nextReview && w.nextReview > now));

        const shuffledDue = [...dueWords].sort(() => Math.random() - 0.5);
        const shuffledOther = [...otherWords].sort(() => Math.random() - 0.5);
        const pool = [...shuffledDue, ...shuffledOther];

        if (pool.length < rank.count) {
            alert(t('games.pairwords.notEnoughWords', { rank: rank.name, count: rank.count }));
            return;
        }

        // Take only 15 words for the session
        const poolForSession = pool.slice(0, 15);

        setAllWordsPool(poolForSession);
        setTotalPairs(poolForSession.length);
        setScore(0);
        setErrors(0);
        setTimer(0);
        startTimeRef.current = Date.now();
        setMatchedIds(new Set());
        setCorrectIds(new Set());
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setWrongIds(new Set());
        completionProgressHandledRef.current = false;
        setNewlyAppearingIds(new Set());
        setIsAnswerShuffleLocked(false);
        setAnswerHiddenSlotIndices(new Set());
        setAnswerFlightCards([]);
        if (answerShuffleTimeoutRef.current) {
            window.clearTimeout(answerShuffleTimeoutRef.current);
            answerShuffleTimeoutRef.current = null;
        }

        setSelectedRank(rank);
        setIsConquestMode(options?.conquestMode === true);

        // Pick initial batch based on rank
        const initialBatch = poolForSession.slice(0, rank.count);
        nextWordIndex.current = rank.count;

        const left = initialBatch.map(w => createMatchColumnItems(w, rank.isDirectionSwapped === true).left)
            .sort(() => Math.random() - 0.5);
        const right = initialBatch.map(w => createMatchColumnItems(w, rank.isDirectionSwapped === true).right)
            .sort(() => Math.random() - 0.5);

        setLeftColumn(left);
        setRightColumn(right);
        setPhase('PLAY');
    }, [playableWords, t]);

    useEffect(() => {
        localStorage.setItem('benedicti_match_elite', JSON.stringify(isEliteMode));
    }, [isEliteMode]);

    const isAllDone = matchedIds.size === allWordsPool.length && allWordsPool.length > 0;

    const updateTabletColumnFit = useCallback(() => {
        if (typeof window === 'undefined' || phase !== 'PLAY' || isAllDone) {
            setUseTabletFourColumnLayout(false);
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortraitTablet = width >= PORTRAIT_LAYOUT_MIN_WIDTH && width <= PORTRAIT_LAYOUT_MAX_WIDTH && height >= width;
        if (!isPortraitTablet) {
            setUseTabletFourColumnLayout(false);
            return;
        }

        const stage = answerFlightStageRef.current;
        if (!stage) {
            setUseTabletFourColumnLayout(false);
            return;
        }

        const visibleRows = Math.max(
            leftColumn.filter(Boolean).length,
            rightColumn.filter(Boolean).length
        );
        if (visibleRows <= 0) {
            setUseTabletFourColumnLayout(false);
            return;
        }

        const stageHeight = stage.getBoundingClientRect().height;
        const requiredTwoColumnHeight =
            (visibleRows * TWO_COLUMN_MIN_CARD_HEIGHT) +
            (Math.max(visibleRows - 1, 0) * TWO_COLUMN_ROW_GAP);

        setUseTabletFourColumnLayout(requiredTwoColumnHeight > stageHeight);
    }, [isAllDone, leftColumn, phase, rightColumn]);

    useEffect(() => {
        updateTabletColumnFit();

        const stage = answerFlightStageRef.current;
        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateTabletColumnFit)
            : null;

        if (stage) {
            resizeObserver?.observe(stage);
        }
        window.addEventListener('resize', updateTabletColumnFit);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateTabletColumnFit);
        };
    }, [updateTabletColumnFit]);

    useEffect(() => {
        if (!isAllDone || !selectedRank || completionProgressHandledRef.current) {
            return;
        }

        completionProgressHandledRef.current = true;
        const activeDictId = dictId || 'default';
        const isRealmConquestAttempt = isConquestMode && selectedRank.id === 'king';

        if (errors === 0) {
            if (!isTemporaryAdminRealmKing) {
                setPerfectRanks(prev => ({
                    ...prev,
                    [selectedRank.id]: true
                }));

                localStorage.setItem(`benedicti_match_perfect_${activeDictId}_${selectedRank.id}`, 'true');

                if (currentUser) {
                    const path = `users/${currentUser.uid}/matchPairsProgress/${activeDictId}/${selectedRank.id}`;
                    dbSet(ref(db, path), true).catch(e => {
                        console.warn('Failed to save progression to Firebase:', e);
                    });
                }
            }

            if (isRealmConquestAttempt) {
                applyRealmCapture();
                setIsConquestMode(false);
                setPhase('SETUP');
            }

            return;
        }

        if (isRealmConquestAttempt && applyRealmShrink()) {
            setIsConquestMode(false);
            setPhase('SETUP');
            return;
        }

        setIsConquestMode(false);

        if (isTemporaryAdminRealmKing) {
            return;
        }

        const selectedRankIndex = RANKS.findIndex(rank => rank.id === selectedRank.id);
        if (selectedRankIndex === -1) {
            return;
        }

        const ranksToClear = RANKS.slice(selectedRankIndex);

        setPerfectRanks(prev => {
            const next = { ...prev };
            ranksToClear.forEach(rank => {
                delete next[rank.id];
            });
            return next;
        });

        ranksToClear.forEach(rank => {
            localStorage.removeItem(`benedicti_match_perfect_${activeDictId}_${rank.id}`);
        });

        if (currentUser) {
            Promise.all(ranksToClear.map(rank => {
                const path = `users/${currentUser.uid}/matchPairsProgress/${activeDictId}/${rank.id}`;
                return dbSet(ref(db, path), false);
            })).catch(e => {
                console.warn('Failed to demote progression in Firebase:', e);
            });
        }
    }, [
        RANKS,
        applyRealmCapture,
        applyRealmShrink,
        isAllDone,
        errors,
        selectedRank,
        dictId,
        currentUser,
        isConquestMode,
        isTemporaryAdminRealmKing
    ]);

    // Timer logic
    useEffect(() => {
        if (phase === 'PLAY' && !isAllDone) {
            // Ensure we have a start time if we just moved to PLAY
            if (!startTimeRef.current) startTimeRef.current = Date.now();

            timerRef.current = window.setInterval(() => {
                if (startTimeRef.current) {
                    const elapsed = Date.now() - startTimeRef.current;
                    setTimer(elapsed);
                }
            }, 50); // Update every 50ms for smoothness without overhead
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            if (phase === 'SETUP') startTimeRef.current = null;
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, isAllDone]);

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        const tenths = Math.floor((ms % 1000) / 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
    };

    const selectAnswerShuffleIndices = useCallback((availableIndices: number[], replacementIndex: number) => {
        const otherIndices = availableIndices
            .filter(index => index !== replacementIndex)
            .map(index => ({
                index,
                distance: Math.abs(index - replacementIndex)
            }))
            .sort((a, b) => b.distance - a.distance || a.index - b.index)
            .slice(0, 2)
            .map(({ index }) => index);

        return [replacementIndex, ...otherIndices].sort((a, b) => a - b);
    }, []);

    const shuffleReplacementAnswerSide = useCallback((column: (MatchItem | null)[], replacementPairId: string) => {
        const replacementIndex = column.findIndex(item => item?.id === replacementPairId);
        if (replacementIndex === -1) {
            return { nextColumn: column, shuffledIds: new Set<string>(), moves: [] };
        }

        const availableIndices = column
            .map((item, index) => item ? index : -1)
            .filter(index => index !== -1);
        const targetIndices = selectAnswerShuffleIndices(availableIndices, replacementIndex);
        const targetItems = targetIndices.map(index => column[index]);
        const shuffledItems = targetItems.length > 1
            ? [...targetItems.slice(1), targetItems[0]]
            : targetItems;
        const nextColumn = [...column];
        const moves: AnswerShuffleMove[] = [];

        targetIndices.forEach((index, itemIndex) => {
            nextColumn[index] = shuffledItems[itemIndex];

            const item = targetItems[itemIndex];
            if (!item) return;

            const destinationIndex = targetIndices[shuffledItems.findIndex(shuffledItem => shuffledItem?.id === item.id)];
            moves.push({
                id: item.id,
                text: item.text,
                fromSlotIndex: index,
                toSlotIndex: destinationIndex
            });
        });

        return {
            nextColumn,
            shuffledIds: new Set(targetItems.flatMap(item => item ? [item.id] : [])),
            moves
        };
    }, [selectAnswerShuffleIndices]);

    const getVisibleAnswerSlotRect = useCallback((slotIndex: number): AnswerFlightRect | null => {
        const stage = answerFlightStageRef.current;
        if (!stage) return null;

        const stageRect = stage.getBoundingClientRect();
        const slots = Array.from(stage.querySelectorAll<HTMLElement>(`[data-answer-slot-index="${slotIndex}"]`));
        const visibleSlot = slots.find(slot => {
            const rect = slot.getBoundingClientRect();
            const style = window.getComputedStyle(slot);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none';
        });

        if (!visibleSlot) return null;

        const rect = visibleSlot.getBoundingClientRect();
        return {
            x: rect.left - stageRect.left,
            y: rect.top - stageRect.top,
            width: rect.width,
            height: rect.height
        };
    }, []);

    const startAnswerShuffleFlight = useCallback((nextColumn: (MatchItem | null)[], moves: AnswerShuffleMove[]) => {
        const meaningfulMoves = moves.filter(move => move.fromSlotIndex !== move.toSlotIndex);
        if (meaningfulMoves.length === 0) {
            setRightColumn(nextColumn);
            return false;
        }

        const flightCards = meaningfulMoves.map((move, index) => {
            const from = getVisibleAnswerSlotRect(move.fromSlotIndex);
            const to = getVisibleAnswerSlotRect(move.toSlotIndex);

            if (!from || !to) return null;

            return {
                id: move.id,
                text: move.text,
                from,
                to,
                z: 20 + index
            };
        });

        if (flightCards.some(card => card === null)) {
            setRightColumn(nextColumn);
            return false;
        }

        const hiddenSlots = new Set<number>();
        meaningfulMoves.forEach(move => {
            hiddenSlots.add(move.fromSlotIndex);
            hiddenSlots.add(move.toSlotIndex);
        });

        setAnswerFlightCards(flightCards as AnswerFlightCard[]);
        setAnswerHiddenSlotIndices(hiddenSlots);
        setIsAnswerShuffleLocked(true);

        if (answerShuffleTimeoutRef.current) {
            window.clearTimeout(answerShuffleTimeoutRef.current);
            answerShuffleTimeoutRef.current = null;
        }

        answerShuffleTimeoutRef.current = window.setTimeout(() => {
            setRightColumn(nextColumn);
            setAnswerFlightCards([]);
            setAnswerHiddenSlotIndices(new Set());
            setIsAnswerShuffleLocked(false);
            answerShuffleTimeoutRef.current = null;
        }, ANSWER_FLIGHT_MS);

        return true;
    }, [ANSWER_FLIGHT_MS, getVisibleAnswerSlotRect]);

    const replaceWordOnPlace = (oldId: string) => {
        setMatchedIds(prev => {
            const next = new Set(prev);
            next.add(oldId);
            return next;
        });
        setCorrectIds(prev => {
            const next = new Set(prev);
            next.delete(oldId);
            return next;
        });

        // Pick next word from pool
        const nextWord = allWordsPool[nextWordIndex.current];
        nextWordIndex.current += 1;
        const nextWordItems = nextWord
            ? createMatchColumnItems(nextWord, selectedRank?.isDirectionSwapped === true)
            : null;

        if (nextWord) {
            // Mark new word as currently appearing (non-clickable, fading in)
            setNewlyAppearingIds(prev => {
                const next = new Set(prev);
                next.add(nextWord.id);
                return next;
            });

            // Remove from newlyAppearingIds after 1 second (1000ms)
            setTimeout(() => {
                setNewlyAppearingIds(prev => {
                    const next = new Set(prev);
                    next.delete(nextWord.id);
                    return next;
                });
            }, 1000);
        }

        const nextLeftColumn = leftColumn.map(item =>
            item?.id === oldId
                ? (nextWordItems?.left || null)
                : item
        );
        const replacedRightColumn = rightColumn.map(item =>
            item?.id === oldId
                ? (nextWordItems?.right || null)
                : item
        );

        setLeftColumn(nextLeftColumn);

        if (nextWord) {
            const { nextColumn, moves } = shuffleReplacementAnswerSide(replacedRightColumn, nextWord.id);
            const didStartFlight = startAnswerShuffleFlight(nextColumn, moves);

            if (!didStartFlight) {
                setAnswerHiddenSlotIndices(new Set());
                setAnswerFlightCards([]);
                setIsAnswerShuffleLocked(false);
            }
        } else {
            setRightColumn(replacedRightColumn);
        }
    };

    const checkMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Correct logic
            soundService.playSuccessSound();
            setCorrectIds(prev => new Set([...prev, leftId]));
            setScore(prev => prev + 1);
            setSelectedLeftId(null);
            setSelectedRightId(null);

            // Record Leitner correct review
            const matchedWord = allWordsPool.find(w => w.id === leftId);
            if (matchedWord && currentUser) {
                answerWordLeitner(currentUser.uid, matchedWord, true);
            }

            // Wait 600ms and transition
            setTimeout(() => {
                setCorrectIds(prev => {
                    const next = new Set(prev);
                    next.delete(leftId);
                    return next;
                });
                
                replaceWordOnPlace(leftId);
            }, 600);
        } else {
            // Wrong
            soundService.playErrorSound();
            setErrors(prev => prev + 1);
            setWrongIds(new Set([leftId, rightId]));

            // Record Leitner incorrect review for both words involved in the incorrect match
            const leftWord = allWordsPool.find(w => w.id === leftId);
            const rightWord = allWordsPool.find(w => w.id === rightId);
            if (leftWord && currentUser) {
                answerWordLeitner(currentUser.uid, leftWord, false);
            }
            if (rightWord && currentUser) {
                answerWordLeitner(currentUser.uid, rightWord, false);
            }

            setTimeout(() => {
                setWrongIds(new Set());
                setSelectedLeftId(null);
                setSelectedRightId(null);
            }, 800);
        }
    };

    const handleChoice = (id: string, isLeftColumn: boolean, selectedItemIsOriginal: boolean) => {
        if (matchedIds.has(id) || correctIds.has(id)) return;

        const word = allWordsPool.find(w => w.id === id);
        const dict = dictionaries.find(d => d.id === dictId);
        const speakSelectedItem = () => {
            if (!word) return;
            if (selectedItemIsOriginal) {
                speechService.speak(word.original, dict?.sourceLang || 'en');
                return;
            }
            speechService.speak(word.translation, dict?.targetLang || 'ru');
        };

        if (isLeftColumn) {
            setSelectedLeftId(id);

            // Play sound only if it's the first selection OR a correct match
            const isMatch = selectedRightId === id;
            if (word && (!selectedRightId || isMatch)) {
                speakSelectedItem();
            }

            if (selectedRightId) checkMatch(id, selectedRightId);
        } else {
            setSelectedRightId(id);

            // Play sound only if it's the first selection OR a correct match
            const isMatch = selectedLeftId === id;
            if (word && (!selectedLeftId || isMatch)) {
                speakSelectedItem();
            }

            if (selectedLeftId) checkMatch(selectedLeftId, id);
        }
    };

    const isInitialLoading = loading && storeWords.length === 0;

    const toColumnEntries = (items: (MatchItem | null)[]): MatchColumnEntry[] => (
        items.map((item, slotIndex) => ({ item, slotIndex }))
    );

    const renderMatchCard = (entry: MatchColumnEntry, idx: number, isOriginal: boolean, keyPrefix: string) => {
        const item = entry.item;
        const isAnswerLocked = !isOriginal && isAnswerShuffleLocked;
        const isAnswerSlotHidden = !isOriginal && answerHiddenSlotIndices.has(entry.slotIndex);
        const cardStyle: CSSProperties = {
            animationDelay: newlyAppearingIds.has(item?.id || '') ? `${idx * 40}ms` : '0ms'
        };

        const className = `${styles.card}
            ${(isOriginal ? selectedLeftId : selectedRightId) === item?.id ? styles.selected : ''}
            ${item && correctIds.has(item.id) ? styles.correct : ''}
            ${item && wrongIds.has(item.id) && (isOriginal ? selectedLeftId : selectedRightId) === item.id ? styles.wrong : ''}
            ${item && isOriginal && newlyAppearingIds.has(item.id) ? styles.appearing : ''}
            ${isAnswerSlotHidden ? styles.answerSlotHidden : ''}
            ${isAnswerLocked ? styles.answerMotionLocked : ''}`;

        return item ? (
            isOriginal ? (
                <button
                    key={`${keyPrefix}-${item.id}`}
                    style={cardStyle}
                    className={className}
                    onClick={() => handleChoice(item.id, isOriginal, item.isOriginal)}
                    disabled={newlyAppearingIds.has(item.id)}
                >
                    {isEliteMode && item.isOriginal ? <Volume2 size={24} /> : item.text}
                </button>
            ) : (
                <button
                    key={`${keyPrefix}-${item.id}`}
                    data-answer-slot-index={entry.slotIndex}
                    style={cardStyle}
                    className={className}
                    onClick={() => handleChoice(item.id, isOriginal, item.isOriginal)}
                    disabled={isAnswerLocked}
                >
                    {isEliteMode && item.isOriginal ? <Volume2 size={24} /> : item.text}
                </button>
            )
        ) : <div key={`${keyPrefix}-empty-${entry.slotIndex}-${idx}`} className={styles.emptySlot} />;
    };

    const renderMatchColumn = (entries: MatchColumnEntry[], isOriginal: boolean, keyPrefix: string) => (
        <div className={styles.column}>
            {entries.map((entry, idx) => renderMatchCard(entry, idx, isOriginal, keyPrefix))}
        </div>
    );

    const renderAnswerFlightLayer = () => (
        <div className={styles.answerFlightLayer} aria-hidden="true">
            {answerFlightCards.map(card => (
                <motion.div
                    key={`${card.id}-${card.from.x}-${card.to.x}-${card.to.y}`}
                    className={`${styles.card} ${styles.answerFlightCard}`}
                    initial={{
                        x: card.from.x,
                        y: card.from.y,
                        zIndex: card.z
                    }}
                    animate={{
                        x: card.to.x,
                        y: card.to.y,
                        zIndex: card.z
                    }}
                    transition={{
                        x: { duration: ANSWER_FLIGHT_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                        y: { duration: ANSWER_FLIGHT_MS / 1000, ease: [0.22, 1, 0.36, 1] }
                    }}
                    style={{
                        width: card.from.width,
                        height: card.from.height
                    }}
                >
                    {card.text}
                </motion.div>
            ))}
        </div>
    );

    const leftColumnEntries = toColumnEntries(leftColumn);
    const rightColumnEntries = toColumnEntries(rightColumn);
    const tabletSplitIndex = Math.ceil(leftColumnEntries.length / 2);
    const tabletLeftFirst = leftColumnEntries.slice(0, tabletSplitIndex);
    const tabletLeftSecond = leftColumnEntries.slice(tabletSplitIndex);
    const tabletRightFirst = rightColumnEntries.slice(0, tabletSplitIndex);
    const tabletRightSecond = rightColumnEntries.slice(tabletSplitIndex);

    const renderSetup = () => {
        const isRu = language === 'ru';
        const completedRanks = RANKS.filter(rank => effectivePerfectRanks[rank.id]).length;
        const hasReachedKing = effectivePerfectRanks.king === true;
        const kingRank = RANKS.find(rank => rank.id === 'king');
        const availableRanks = RANKS.filter((rank, index) => {
            const isPreviousPerfect = index === 0 || effectivePerfectRanks[RANKS[index - 1].id] === true;
            return playableWords.length >= rank.count && isPreviousPerfect;
        }).length;

        const rankViews = RANKS.map((rank, index) => {
            const isPreviousPerfect = index === 0 || effectivePerfectRanks[RANKS[index - 1].id] === true;
            const hasEnoughWords = playableWords.length >= rank.count;
            const isLocked = !hasEnoughWords || !isPreviousPerfect;
            const isPerfect = effectivePerfectRanks[rank.id] === true;

            let lockReason = '';
            if (!hasEnoughWords) {
                lockReason = isRu
                    ? `Нужно ${rank.count} слов`
                    : `Needs ${rank.count} words`;
            } else if (!isPreviousPerfect) {
                lockReason = isRu
                    ? `Нужен идеальный ранг "${RANKS[index - 1].name}"`
                    : `Requires perfect "${RANKS[index - 1].name}" rank`;
            }

            const statusLabel = isPerfect
                ? (isRu ? 'Идеально' : 'Perfect')
                : isLocked
                    ? (isRu ? 'Закрыто' : 'Locked')
                    : (isRu ? 'Готово' : 'Ready');

            return {
                rank,
                index,
                isLocked,
                isPerfect,
                statusLabel,
                lockReason,
            };
        });

        const renderRealmShell = () => (
            <div className={styles.realmShell}>
                <section className={styles.realmPlayerPanel} aria-label={t('games.pairwords.realmPlayerPanel')}>
                    <div className={styles.realmPanelHeader}>
                        <span>{t('games.pairwords.realmPlayerPanel')}</span>
                        <strong>{getRealmDisplayStatus(currentRealmPlayer)}</strong>
                    </div>
                    <div className={styles.realmCastleSigil}>
                        <Landmark size={34} />
                    </div>
                    <h2>{currentRealmPlayer?.name || t('games.pairwords.realmPlaceholder')}</h2>
                    <p>{t('games.pairwords.realmCastleDesc', { dict: activeDictionaryName })}</p>
                    <div className={styles.realmStatList}>
                        <div>
                            <span>{t('games.pairwords.realmRank')}</span>
                            <strong>{getRealmDisplayStatus(currentRealmPlayer)}</strong>
                        </div>
                        <div>
                            <span>{t('games.pairwords.realmCastle')}</span>
                            <strong>{currentRealmPlayer?.name || t('games.pairwords.realmPlaceholder')}</strong>
                        </div>
                        <div>
                            <span>{t('games.pairwords.realmTerritory')}</span>
                            <strong>{currentRealmPlayer?.territoryCells || 0} / {realmCells.length}</strong>
                        </div>
                        <div>
                            <span>{t('games.pairwords.realmTerritoryPercentLabel')}</span>
                            <strong>{currentRealmPlayer?.territoryPercent || 0}%</strong>
                        </div>
                        <div>
                            <span>{t('games.pairwords.realmDictionary')}</span>
                            <strong>{activeDictionaryName}</strong>
                        </div>
                    </div>
                </section>

                <section
                    className={styles.realmMapPanel}
                    aria-label={t('games.pairwords.realmMap')}
                    onClick={() => setSelectedRealmPlayer(null)}
                >
                    <div
                        ref={realmViewportRef}
                        className={styles.realmViewport}
                        onWheel={handleRealmWheel}
                        onPointerDown={handleRealmPointerDown}
                        onPointerMove={handleRealmPointerMove}
                        onPointerUp={handleRealmPointerEnd}
                        onPointerCancel={handleRealmPointerEnd}
                    >
                        <div
                            className={styles.realmWorld}
                            style={{
                                width: REALM_WORLD_WIDTH,
                                height: REALM_WORLD_HEIGHT,
                                transform: `translate3d(${realmPan.x}px, ${realmPan.y}px, 0) scale(${realmScale})`
                            }}
                        >
                            <div className={styles.realmWorldBackdrop} />
                            {realmCells.map(cell => {
                                const ownerPalette = cell.ownerId
                                    ? (cell.ownerId === realmEmperorPlayerId ? REALM_EMPEROR_PALETTE : getRealmOwnerPalette(cell.ownerId))
                                    : null;
                                const hexStyle = {
                                    left: cell.x,
                                    top: cell.y,
                                    ...(ownerPalette ? {
                                        '--realm-owner-top': ownerPalette.top,
                                        '--realm-owner-bottom': ownerPalette.bottom,
                                        '--realm-owner-border': ownerPalette.border,
                                        '--realm-owner-glow': ownerPalette.glow
                                    } : {})
                                } as CSSProperties;

                                return (
                                    <div
                                        key={cell.id}
                                        data-realm-castle-marker={cell.player ? 'true' : undefined}
                                        className={`${styles.realmHex} ${styles[`realmHex${cell.state[0].toUpperCase()}${cell.state.slice(1)}`]} ${cell.ownerId === currentRealmPlayer?.id ? styles.realmHexOwnedCurrent : ''} ${cell.ownerId && cell.ownerId !== currentRealmPlayer?.id ? styles.realmHexOwnedOther : ''} ${capturedRealmCellIds.has(cell.id) ? styles.realmHexCaptured : ''} ${cell.player ? styles.realmHexPlayer : ''}`}
                                        style={hexStyle}
                                        onPointerDown={(event) => {
                                            if (!cell.player) return;
                                            event.stopPropagation();
                                        }}
                                        onClick={(event) => {
                                            if (!cell.player) return;
                                            event.stopPropagation();
                                            setSelectedRealmPlayer(cell.player);
                                        }}
                                    >
                                        {cell.player && (
                                            <button
                                                type="button"
                                                data-realm-castle-marker="true"
                                                className={`${styles.realmPlayerMarker} ${cell.player.isCurrent ? styles.currentRealmPlayerMarker : ''}`}
                                                aria-label={cell.player.name}
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedRealmPlayer(cell.player || null);
                                                }}
                                            >
                                                <img
                                                    src={cell.player.id === realmEmperorPlayerId ? REALM_EMPEROR_BADGE_SRC : cell.player.badgeSrc}
                                                    alt=""
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedRealmPlayer && (
                        <div
                            className={styles.realmPlayerPopup}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                className={styles.realmPopupClose}
                                onClick={() => setSelectedRealmPlayer(null)}
                                aria-label={t('common.close')}
                            >
                                <X size={16} />
                            </button>
                            <img src={selectedRealmPlayer.badgeSrc} alt="" aria-hidden="true" />
                            <div>
                                <span>{selectedRealmPlayer.name}</span>
                                <strong>{getRealmDisplayStatus(selectedRealmPlayer)}</strong>
                                <small>{t('games.pairwords.realmDictionary')}: {activeDictionaryName}</small>
                                <small>{selectedRealmPlayer.territoryCells} / {realmCells.length} · {t('games.pairwords.realmTerritoryPercent', { percent: selectedRealmPlayer.territoryPercent })}</small>
                            </div>
                        </div>
                    )}

                    <div className={styles.realmMapHud}>
                        <button
                            type="button"
                            className={styles.realmCenterButton}
                            onClick={centerCurrentRealmKingdom}
                        >
                            <Target size={18} />
                            {t('games.pairwords.realmYourKingdom')}
                        </button>
                        <button
                            type="button"
                            className={styles.realmActionButton}
                            onClick={(event) => {
                                event.stopPropagation();
                                if (currentRealmPlayer?.rankId !== 'king') return;
                                if (kingRank) startLevel(kingRank, { conquestMode: true });
                            }}
                            disabled={!kingRank || loading || !realmKey || currentRealmPlayer?.rankId !== 'king'}
                        >
                            <Play size={18} />
                            {t('games.pairwords.realmConquerTerritory')}
                        </button>
                    </div>
                </section>

                <aside className={styles.realmStatusPanel} aria-label={t('games.pairwords.realmStatusPanel')}>
                    <div className={styles.realmPanelHeader}>
                        <span>{t('games.pairwords.realmStatusPanel')}</span>
                        <strong>{t('games.pairwords.realmPlayers')}</strong>
                    </div>
                    <div className={`${styles.realmStatusBadge} ${realmEmperorPlayer ? styles.realmStatusBadgeEmperor : ''}`}>
                        <Crown size={24} />
                        <div>
                            <span>{realmEmperorPlayer ? t('games.pairwords.realmEmperor') : t('games.pairwords.realmKing')}</span>
                            {realmEmperorPlayer && (
                                <strong className={styles.realmEmperorName}>{realmEmperorPlayer.name}</strong>
                            )}
                            <small>{t('games.pairwords.realmOccupiedCells', {
                                count: Object.keys(realmState.cells).length,
                                total: realmCells.length
                            })}</small>
                        </div>
                    </div>
                    <div className={styles.realmLeaderboard}>
                        {realmPlayers.map((player, index) => (
                            <div key={player.id} className={player.isCurrent ? styles.currentRealmLeader : ''}>
                                <span>{index + 1}. {player.name}</span>
                                <strong>{player.territoryPercent}%</strong>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        );

        const dictionaryOptions = (
            <div
                className={`${styles.dictOptions} ${styles.dictOptionsPortal}`}
                style={dictDropdownPosition ? {
                    top: dictDropdownPosition.top,
                    left: dictDropdownPosition.left,
                    width: dictDropdownPosition.width
                } : undefined}
            >
                <button
                    type="button"
                    className={`${styles.dictTab} ${dictId === 'default' ? styles.activeTab : ''}`}
                    onClick={() => handleDictionaryChange('default')}
                >
                    {t('common.defaultDict')}
                </button>
                {dictionaries
                    .filter(d => d.id !== 'default' && !d.name.includes('English 2500'))
                    .map(d => (
                        <button
                            type="button"
                            key={d.id}
                            className={`${styles.dictTab} ${dictId === d.id ? styles.activeTab : ''}`}
                            onClick={() => handleDictionaryChange(d.id)}
                        >
                            {d.name}
                        </button>
                    ))}
            </div>
        );

        return (
        <div className={`${styles.setupShell} ${loading ? styles.setupLoading : ''}`}>
            <div className={`${styles.setupContainer} ${loading ? styles.setupLoading : ''} ${phase !== 'SETUP' ? styles.compactSetup : ''}`}>
                <div className={styles.setupToolbar}>
                    <div className={styles.toolbarTitleRow}>
                        <button type="button" onClick={() => navigate('/games')} className={styles.backButtonInline} title={t('common.back')}>
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className={styles.royalTitle}>{t('games.pairwords.title')}</h1>
                            <p className={styles.setupSubtitle}>{t('games.pairwords.description')}</p>
                        </div>
                        <button
                            type="button"
                            className={`${styles.mobileSetupToggle} ${isMobileSetupOpen ? styles.open : ''}`}
                            onClick={() => setIsMobileSetupOpen(!isMobileSetupOpen)}
                            aria-label={isRu ? 'Показать настройки' : 'Show settings'}
                        >
                            <ChevronDown size={24} />
                        </button>
                    </div>

                    <div className={`${styles.setupControls} ${isMobileSetupOpen ? styles.open : ''}`}>
                        <div className={styles.dictSelector} ref={dictSelectorRef}>
                            <button
                                type="button"
                                className={styles.selectorHeader}
                                onClick={() => {
                                    if (!isDictSelectorOpen) {
                                        updateDictDropdownPosition();
                                    }
                                    setIsDictSelectorOpen(!isDictSelectorOpen);
                                }}
                            >
                                <span className={styles.selectorLabel}>{t('common.dictionary')}</span>
                                <span className={styles.activeDictName}>
                                    {activeDictionaryName}
                                </span>
                                <ChevronDown size={18} className={`${styles.chevron} ${isDictSelectorOpen ? styles.open : ''}`} />
                            </button>

                            {isDictSelectorOpen && typeof document !== 'undefined' && createPortal(dictionaryOptions, document.body)}
                        </div>

                        <div className={styles.difficultyContainer}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={isEliteMode}
                                    onChange={(e) => setIsEliteMode(e.target.checked)}
                                    className={styles.hiddenCheckbox}
                                />
                                <div className={`${styles.customToggle} ${isEliteMode ? styles.active : ''}`}>
                                    <div className={styles.toggleThumb} />
                                </div>
                                <span className={styles.toggleText}>
                                    {isEliteMode ? t('games.pairwords.eliteMode') : t('games.pairwords.normalMode')}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.setupSummary}>
                    <div className={styles.summaryItem}>
                        <BookOpen size={18} />
                        <span className={styles.summaryLabel}>{isRu ? 'Слов' : 'Words'}</span>
                        <strong>{playableWords.length}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                        <Target size={18} />
                        <span className={styles.summaryLabel}>{isRu ? 'Доступно' : 'Open'}</span>
                        <strong>{availableRanks}/{RANKS.length}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                        <CheckCircle2 size={18} />
                        <span className={styles.summaryLabel}>{isRu ? 'Идеально' : 'Perfect'}</span>
                        <strong>{completedRanks}</strong>
                    </div>
                </div>
            </div>

            {hasReachedKing ? renderRealmShell() : (
            <div className={styles.setupBody}>
                <aside className={styles.rankPath} aria-label={isRu ? 'Прогресс рангов' : 'Rank progress'}>
                    {rankViews.map(({ rank, index, isLocked, isPerfect, statusLabel }) => (
                        <div
                            key={rank.id}
                            className={`${styles.pathStep} ${isLocked ? styles.lockedPath : ''} ${isPerfect ? styles.perfectPath : ''} ${!isLocked && !isPerfect ? styles.readyPath : ''}`}
                        >
                            <div className={styles.pathMarker}>
                                <img className={styles.pathBadge} src={rank.badgeSrc} alt="" aria-hidden="true" />
                                {isPerfect && <CheckCircle2 className={styles.pathStateIcon} size={13} />}
                                {isLocked && <LockKeyhole className={styles.pathStateIcon} size={13} />}
                            </div>
                            <div className={styles.pathCopy}>
                                <span>{rank.name}</span>
                                <small>{statusLabel}</small>
                            </div>
                            <span className={styles.pathCount}>{index + 1}</span>
                        </div>
                    ))}
                </aside>

                <div className={styles.rankGrid}>
                    {rankViews.map(({ rank, index, isLocked, isPerfect, statusLabel, lockReason }) => (
                            <button
                                type="button"
                                key={rank.id}
                                className={`${styles.rankCard} ${isLocked ? styles.locked : ''} ${isPerfect ? styles.perfect : ''} ${!isLocked && !isPerfect ? styles.ready : ''}`}
                                onClick={() => !isLocked && startLevel(rank)}
                                disabled={loading || isLocked}
                            >
                                <div className={styles.rankBadgeStage}>
                                    <img className={styles.rankBadge} src={rank.badgeSrc} alt="" aria-hidden="true" />
                                    <span className={styles.rankLevelCue}>{index + 1}</span>
                                    {isPerfect && <CheckCircle2 className={styles.rankStateIcon} size={18} />}
                                    {isLocked && <LockKeyhole className={styles.rankStateIcon} size={18} />}
                                </div>
                                <div className={styles.rankDetails}>
                                    <div className={styles.rankTitleRow}>
                                        <h3 className={styles.rankName}>{rank.name}</h3>
                                        <span className={`${styles.rankStatus} ${isLocked ? styles.statusLocked : ''} ${isPerfect ? styles.statusPerfect : ''}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div className={styles.rankDetailSub}>
                                        {isLocked ? (
                                            <span className={styles.lockReasonText}>{lockReason}</span>
                                        ) : (
                                            <>
                                                <span>{rank.description}</span>
                                                <span className={styles.rankAction}>
                                                    <Play size={14} /> {isRu ? 'Начать' : 'Start'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                </div>
            </div>
            )}

            {playableWords.length === 0 && !loading && (
                <div className={styles.noWordsWarning}>
                    {t('games.pairwords.noWords')}
                </div>
            )}
        </div>
        );
    };



    const isRealmSetup = phase === 'SETUP' && effectivePerfectRanks.king === true;

    return (
        <div className={`${styles.container} ${phase === 'PLAY' ? styles.gameplayContainer : ''} ${isRealmSetup ? styles.realmContainer : ''}`}>
            {isInitialLoading && (
                <button onClick={() => navigate('/games')} className={styles.floatingBackButton} title={t('common.back')}>
                    <ArrowLeft size={24} />
                </button>
            )}

            {isInitialLoading || !hasAttemptedLoad ? (
                <div className={styles.loading}>{t('common.loading')}</div>
            ) : phase === 'SETUP' ? (
                renderSetup()
            ) : allWordsPool.length === 0 ? (
                <div className={styles.empty}>
                    <h2>🎉 {t('common.allLearned')}</h2>
                    <p>{t('games.flashcards.sessionComplete')}</p>
                    <button onClick={() => setPhase('SETUP')} className={styles.retryButton}>
                        {t('common.restart')}
                    </button>
                    <button onClick={() => navigate('/games')} className={styles.backButton}>
                        {t('common.back')}
                    </button>
                </div>
            ) : (
                <>
                    <header className={styles.header}>
                        <button onClick={() => setPhase('SETUP')} className={styles.backButton} title={t('common.back')}>
                            <ArrowLeft size={24} />
                        </button>
                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('games.pairwords.score')}</span>
                                <span className={styles.statValue}>{score} / {totalPairs}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('common.time')}</span>
                                <span className={styles.statValue}>{formatTime(timer)}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>{t('common.errors')}</span>
                                <span className={styles.statValue} style={{ color: errors > 0 ? '#ef4444' : 'inherit' }}>{errors}</span>
                            </div>
                        </div>
                        <div className={styles.currentRankLabel}>
                            {selectedRank?.icon && <selectedRank.icon size={18} />}
                            <span>{selectedRank?.name}</span>
                        </div>
                    </header>

                    <div className={styles.gameArea}>
                        {!isAllDone && (
                            <>
                                <div className={styles.gameControls}>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${(matchedIds.size / totalPairs) * 100}%` }} />
                                    </div>
                                </div>

                                <div
                                    className={`${styles.answerFlightStage} ${useTabletFourColumnLayout ? styles.tabletFourColumnLayout : ''}`}
                                    ref={answerFlightStageRef}
                                >
                                    <div className={`${styles.columns} ${styles.desktopColumns}`}>
                                        {renderMatchColumn(leftColumnEntries, true, 'left')}
                                        {renderMatchColumn(rightColumnEntries, false, 'right')}
                                    </div>

                                    <div className={`${styles.columns} ${styles.tabletColumns}`}>
                                        {renderMatchColumn(tabletLeftFirst, true, 'tablet-left-a')}
                                        {renderMatchColumn(tabletRightFirst, false, 'tablet-right-a')}
                                        {renderMatchColumn(tabletLeftSecond, true, 'tablet-left-b')}
                                        {renderMatchColumn(tabletRightSecond, false, 'tablet-right-b')}
                                    </div>
                                    {renderAnswerFlightLayer()}
                                </div>
                            </>
                        )}
                    </div>

                    {isAllDone && (
                        <div className={styles.resultsOverlay}>
                            <div className={styles.results}>
                                <div className={styles.successIcon}>
                                    <Sparkles size={64} />
                                </div>
                                <h2>{resultTitle}</h2>
                                <p>{resultMessage}</p>

                                <div className={styles.finalStatsGrid}>
                                    <div className={styles.finalStatCard}>
                                        <div className={styles.finalStatLabel}>{t('common.score')}</div>
                                        <div className={styles.finalStatValue}>{score}</div>
                                    </div>
                                    <div className={styles.finalStatCard}>
                                        <div className={styles.finalStatLabel}>{t('common.time')}</div>
                                        <div className={styles.finalStatValue}>{formatTime(timer)}</div>
                                    </div>
                                    <div className={styles.finalStatCard}>
                                        <div className={styles.finalStatLabel}>{t('common.errors')}</div>
                                        <div className={styles.finalStatValue} style={{ color: errors > 0 ? '#ef4444' : 'inherit' }}>{errors}</div>
                                    </div>
                                </div>
                                <button onClick={() => setPhase('SETUP')} className={styles.restartButton}>
                                    <RefreshCw size={20} /> {t('common.playAgain')}
                                </button>
                                <button onClick={() => navigate('/games')} className={styles.menuButton}>
                                    {t('common.menu')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
