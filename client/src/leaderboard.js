import { db } from './firebase.js';
import {
  collection, query, orderBy, limit,
  getDocs, addDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import leoProfanity from 'leo-profanity';

leoProfanity.loadDictionary();

// Normalize common leet-speak substitutions before profanity check.
// Two passes handle ambiguous chars like '!' which can stand for 'i' or 'e'.
function normalizeLeet(str, bangAsE = false) {
  return str
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(bangAsE ? /[3!]/g : /3/g, 'e')
    .replace(bangAsE ? /[1|]/g : /[1|!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7+]/g, 't');
}

function isProfane(name) {
  return (
    leoProfanity.check(name) ||
    leoProfanity.check(normalizeLeet(name)) ||
    leoProfanity.check(normalizeLeet(name, true))
  );
}

const LEADERBOARD_SIZE = 50;
const leaderboardCol = () => collection(db, 'leaderboard');

export async function getTopScores() {
  const q = query(leaderboardCol(), orderBy('score', 'desc'), limit(LEADERBOARD_SIZE));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function isTopScore(score) {
  const top = await getTopScores();
  if (top.length < LEADERBOARD_SIZE) return true;
  return score > top[top.length - 1].score;
}

export async function submitScore(name, score, avatarUrl = null) {
  if (isProfane(name)) throw new Error('inappropriate_name');
  await addDoc(leaderboardCol(), { name, score, avatarUrl, timestamp: serverTimestamp() });

  const q = query(leaderboardCol(), orderBy('score', 'desc'));
  const snapshot = await getDocs(q);
  const excess = snapshot.docs.slice(LEADERBOARD_SIZE);
  if (excess.length > 0) {
    await Promise.all(excess.map(doc => deleteDoc(doc.ref)));
  }
}
