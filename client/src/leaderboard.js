import { db } from './firebase.js';
import {
  collection, query, orderBy, limit,
  getDocs, addDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

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

export async function submitScore(name, score) {
  await addDoc(leaderboardCol(), { name, score, timestamp: serverTimestamp() });

  // Prune anything beyond top 50
  const q = query(leaderboardCol(), orderBy('score', 'desc'));
  const snapshot = await getDocs(q);
  const excess = snapshot.docs.slice(LEADERBOARD_SIZE);
  if (excess.length > 0) {
    await Promise.all(excess.map(doc => deleteDoc(doc.ref)));
  }
}
