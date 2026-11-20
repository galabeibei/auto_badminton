import { describe, expect, it } from 'vitest';
import { generateSessionMatches, planAutoSessionRefill } from './autoEngine';
import { makeTestMatch, makeTestPlayer } from './testHelpers';
import { MatchMode } from './types';

describe('generateSessionMatches', () => {
  it('returns nothing for fewer than 4 players', () => {
    const pool = [makeTestPlayer({ id: 'a' }), makeTestPlayer({ id: 'b' })];
    expect(generateSessionMatches(pool, MatchMode.SIMILAR, 0)).toEqual([]);
  });

  it('drops the remainder that does not fill a full match of 4', () => {
    const pool = Array.from({ length: 7 }, (_, i) => makeTestPlayer({ id: `p${i}`, mmr: 1000 + i }));
    const matches = generateSessionMatches(pool, MatchMode.SIMILAR, 0);
    expect(matches).toHaveLength(1);
  });

  it('SIMILAR groups strongest-with-strongest, weakest-with-weakest', () => {
    const pool = [
      makeTestPlayer({ id: 'top1', mmr: 2000 }),
      makeTestPlayer({ id: 'top2', mmr: 1900 }),
      makeTestPlayer({ id: 'bot1', mmr: 1000 }),
      makeTestPlayer({ id: 'bot2', mmr: 900 }),
    ];

    const [match] = generateSessionMatches(pool, MatchMode.SIMILAR, 0);
    const ids = [...match.team1.players, ...match.team2.players].map((p) => p.id).sort();
    expect(ids).toEqual(['bot1', 'bot2', 'top1', 'top2'].sort());
  });

  it('BALANCED folds strongest with weakest so every match has similar total strength', () => {
    // 8 players: 2 groups of 4. Fold pairing => group0 = [top1, top2, bot2, bot1], group1 = [mid1, mid2, ...]
    const pool = [
      makeTestPlayer({ id: 'p0', mmr: 2000 }), // strongest
      makeTestPlayer({ id: 'p1', mmr: 1800 }),
      makeTestPlayer({ id: 'p2', mmr: 1600 }),
      makeTestPlayer({ id: 'p3', mmr: 1400 }),
      makeTestPlayer({ id: 'p4', mmr: 1200 }),
      makeTestPlayer({ id: 'p5', mmr: 1000 }),
      makeTestPlayer({ id: 'p6', mmr: 800 }),
      makeTestPlayer({ id: 'p7', mmr: 600 }), // weakest
    ];

    const matches = generateSessionMatches(pool, MatchMode.BALANCED, 0);
    expect(matches).toHaveLength(2);

    const group0Ids = [...matches[0].team1.players, ...matches[0].team2.players].map((p) => p.id).sort();
    // Fold group 0 = strongest two + weakest two = p0, p1, p7, p6
    expect(group0Ids).toEqual(['p0', 'p1', 'p6', 'p7'].sort());

    const group1Ids = [...matches[1].team1.players, ...matches[1].team2.players].map((p) => p.id).sort();
    expect(group1Ids).toEqual(['p2', 'p3', 'p4', 'p5'].sort());
  });

  it('tags every generated match with the given sessionId and a resolved (non-mixed) mode', () => {
    const pool = Array.from({ length: 4 }, (_, i) => makeTestPlayer({ id: `p${i}` }));
    const matches = generateSessionMatches(pool, MatchMode.BALANCED, 7);
    expect(matches[0].sessionId).toBe(7);
    expect(matches[0].mode).toBe(MatchMode.BALANCED);
    expect(matches[0].isManual).toBeFalsy();
  });
});

describe('planAutoSessionRefill', () => {
  const players = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}`, mmr: 1000 + i * 10 }));

  it('plans each session with different quartets instead of repeating the first', () => {
    const pool = Array.from({ length: 8 }, (_, i) => makeTestPlayer({ id: `p${i}`, mmr: 1800 - i * 50 }));

    const { newMatches } = planAutoSessionRefill({
      players: pool,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 0,
    });

    const quartets = (sessionId: number) =>
      newMatches
        .filter((m) => m.sessionId === sessionId)
        .map((m) => [...m.team1.players, ...m.team2.players].map((p) => p.id).sort().join(","))
        .sort();

    expect(quartets(0)).not.toEqual(quartets(1));
  });

  it('rotates who sits out when the pool does not divide by four', () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeTestPlayer({ id: `p${i}`, mmr: 1800 - i * 50 }));

    const { newMatches } = planAutoSessionRefill({
      players: pool,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 0,
    });

    const benched = (sessionId: number) => {
      const playing = new Set(
        newMatches
          .filter((m) => m.sessionId === sessionId)
          .flatMap((m) => [...m.team1.players, ...m.team2.players].map((p) => p.id)),
      );
      return pool.filter((p) => !playing.has(p.id)).map((p) => p.id);
    };

    expect(benched(0)).toHaveLength(2);
    expect(benched(1)).toHaveLength(2);
    // Whoever sat out the first session gets to play the next one: ties used to
    // be broken by rating, which benched the two weakest players every time.
    expect(benched(1)).not.toEqual(benched(0));
    expect(benched(0).some((id) => benched(1).includes(id))).toBe(false);
  });

  it('does nothing when fewer than 4 active players exist', () => {
    const resting = players.map((p) => ({ ...p, isActive: false }));
    const result = planAutoSessionRefill({
      players: resting,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 0,
    });
    expect(result.newMatches).toEqual([]);
    expect(result.nextSessionCounter).toBe(0);
  });

  it('fills the buffer up to AUTO_SESSION_BUFFER (2) sessions from empty', () => {
    const result = planAutoSessionRefill({
      players,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 0,
    });

    const sessionIds = new Set(result.newMatches.map((m) => m.sessionId));
    expect(sessionIds.size).toBe(2);
    expect(result.nextSessionCounter).toBe(2);
  });

  it('does nothing when the buffer is already full', () => {
    const existing = planAutoSessionRefill({
      players,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 0,
    }).newMatches;

    const result = planAutoSessionRefill({
      players,
      systemQueue: existing,
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 2,
    });

    expect(result.newMatches).toEqual([]);
  });

  it('alternates SIMILAR/BALANCED for MIXED mode using match-count balance (decision D1)', () => {
    const result = planAutoSessionRefill({
      players,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.MIXED,
      sessionCounter: 0,
    });

    const modesBySession = new Map<number, MatchMode>();
    result.newMatches.forEach((m) => modesBySession.set(m.sessionId, m.mode));

    const modes = Array.from(modesBySession.values());
    expect(modes).toContain(MatchMode.SIMILAR);
    expect(modes).toContain(MatchMode.BALANCED);
  });

  it('plans from sessionCounter when nothing is queued yet', () => {
    const result = planAutoSessionRefill({
      players,
      systemQueue: [],
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 5,
    });
    const sessionIds = Array.from(new Set(result.newMatches.map((m) => m.sessionId))).sort();
    expect(sessionIds[0]).toBe(5);
  });

  it('continues from the highest queued sessionId when it is ahead of sessionCounter', () => {
    // Simulates the queue already holding a higher session than the counter
    // would suggest (e.g. earlier sessions were fully drained/played).
    // Session 5 holds every active player, so there is no gap to backfill.
    const staleQueue = [
      makeTestMatch({
        id: 'existing',
        players: [players[0], players[1], players[2], players[3]],
        sessionId: 5,
      }),
      makeTestMatch({
        id: 'existing2',
        players: [players[4], players[5], players[6], players[7]],
        sessionId: 5,
      }),
    ];

    const result = planAutoSessionRefill({
      players,
      systemQueue: staleQueue,
      history: [],
      activeMatches: [],
      mode: MatchMode.SIMILAR,
      sessionCounter: 2,
    });

    const sessionIds = Array.from(new Set(result.newMatches.map((m) => m.sessionId))).sort();
    expect(sessionIds[0]).toBe(6);
    expect(result.nextSessionCounter).toBe(7);
  });

  describe('backfilling a session that lost matches', () => {
    const twelve = Array.from({ length: 12 }, (_, i) =>
      makeTestPlayer({ id: `q${i}`, mmr: 1500 - i * 25 }),
    );
    const matchOf = (ids: number[], sessionId: number, id: string) =>
      makeTestMatch({ id, sessionId, players: ids.map((i) => twelve[i]) });

    it('gives the stranded players a match in that same session', () => {
      // Session 3 was planned as three matches; the other two were dropped
      // when a player went 休息, leaving eight people with nothing to play.
      const result = planAutoSessionRefill({
        players: twelve,
        systemQueue: [matchOf([0, 1, 2, 3], 3, 'survivor')],
        history: [],
        activeMatches: [],
        mode: MatchMode.SIMILAR,
        sessionCounter: 4,
      });

      const backfilled = result.newMatches.filter((m) => m.sessionId === 3);
      expect(backfilled).toHaveLength(2);
      const ids = backfilled.flatMap((m) => [...m.team1.players, ...m.team2.players].map((p) => p.id));
      expect(ids).toHaveLength(8);
      expect(ids).not.toContain('q0'); // already has a match in session 3
    });

    it('leaves a full session alone, wherever its players currently are', () => {
      const result = planAutoSessionRefill({
        players: twelve,
        systemQueue: [matchOf([0, 1, 2, 3], 3, 'queued')],
        history: [matchOf([4, 5, 6, 7], 3, 'played')],
        activeMatches: [matchOf([8, 9, 10, 11], 3, 'playing')],
        mode: MatchMode.SIMILAR,
        sessionCounter: 4,
      });

      expect(result.newMatches.filter((m) => m.sessionId === 3)).toEqual([]);
    });

    it('counts a match pulled back off a court (重排) as still filling its slot', () => {
      // "重排" turns the match into a manual one but keeps its session, so the
      // four players in it must not be handed a replacement match as well.
      const requeued = { ...matchOf([4, 5, 6, 7], 3, 'requeued'), isManual: true };

      const result = planAutoSessionRefill({
        players: twelve,
        systemQueue: [matchOf([0, 1, 2, 3], 3, 'queued')],
        manualQueue: [requeued],
        history: [],
        activeMatches: [matchOf([8, 9, 10, 11], 3, 'playing')],
        mode: MatchMode.SIMILAR,
        sessionCounter: 4,
      });

      expect(result.newMatches.filter((m) => m.sessionId === 3)).toEqual([]);
    });

    it('backfills even when the session buffer is otherwise full', () => {
      const result = planAutoSessionRefill({
        players: twelve,
        systemQueue: [
          matchOf([0, 1, 2, 3], 3, 'survivor'),
          matchOf([0, 1, 2, 3], 4, 'next-a'),
          matchOf([4, 5, 6, 7], 4, 'next-b'),
          matchOf([8, 9, 10, 11], 4, 'next-c'),
        ],
        history: [],
        activeMatches: [],
        mode: MatchMode.SIMILAR,
        sessionCounter: 5,
      });

      expect(result.newMatches.every((m) => m.sessionId === 3)).toBe(true);
      expect(result.newMatches).toHaveLength(2);
      expect(result.nextSessionCounter).toBe(5); // no new session was opened
    });
  });
});
