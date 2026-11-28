import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtB85MmBILLjXOyJVdOqyU1GyubLF3_n8",
  authDomain: "buildora-b60c2.firebaseapp.com",
  projectId: "buildora-b60c2",
  storageBucket: "buildora-b60c2.firebasestorage.app",
  messagingSenderId: "224316649360",
  appId: "1:224316649360:web:d83f754e421ba144a60d15"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, doc, getDoc, setDoc, runTransaction };

export const DEFAULT_AVATAR = { skin: "#f1c27d", hair: "#3b2a1a", shirt: "#3da5ff", hat: "none" };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function avatarSVG(a = DEFAULT_AVATAR) {
  const hat = a.hat === "cap"
    ? '<rect x="28" y="14" width="44" height="12" rx="5" fill="#e63946" stroke="#1b2a41" stroke-width="3"/><rect x="28" y="22" width="58" height="5" fill="#e63946" stroke="#1b2a41" stroke-width="3"/>'
    : a.hat === "crown"
    ? '<path d="M28 26 L32 8 L41 19 L50 6 L59 19 L68 8 L72 26Z" fill="#ffd23f" stroke="#1b2a41" stroke-width="3"/>'
    : "";
  return '<svg viewBox="0 0 100 130" width="100%" height="100%" role="img" aria-label="Your avatar">' +
    '<rect x="22" y="70" width="56" height="50" rx="8" fill="' + a.shirt + '" stroke="#1b2a41" stroke-width="4"/>' +
    '<rect x="28" y="22" width="44" height="44" rx="10" fill="' + a.skin + '" stroke="#1b2a41" stroke-width="4"/>' +
    '<rect x="28" y="22" width="44" height="14" rx="8" fill="' + a.hair + '" stroke="#1b2a41" stroke-width="3"/>' +
    '<circle cx="41" cy="48" r="3.5" fill="#1b2a41"/><circle cx="59" cy="48" r="3.5" fill="#1b2a41"/>' +
    '<path d="M42 57 Q50 63 58 57" stroke="#1b2a41" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    hat + '</svg>';
}

export async function getProfile(uid) {
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (s.exists()) return s.data();
  } catch (e) {}
  return {};
}

export const validUser = n => /^[a-z0-9_]{3,20}$/.test(n);

export async function usernameTaken(name) {
  return (await getDoc(doc(db, "usernames", name.toLowerCase()))).exists();
}

export async function claimUsername(uid, name) {
  name = name.toLowerCase();
  const nameRef = doc(db, "usernames", name), userRef = doc(db, "users", uid);
  await runTransaction(db, async tx => {
    if ((await tx.get(nameRef)).exists()) throw { code: "app/username-taken" };
    tx.set(nameRef, { uid });
    tx.set(userRef, { username: name }, { merge: true });
  });
}

export async function getAvatar(uid) {
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (s.exists() && s.data().avatar) return s.data().avatar;
  } catch (e) {}
  return DEFAULT_AVATAR;
}

export function say(m) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = m; t.classList.add("show");
  clearTimeout(say.t); say.t = setTimeout(() => t.classList.remove("show"), 2500);
}

export function initHeader() {
  document.querySelector("header")?.remove();
  const body = document.body;
  const content = document.createElement("main"); content.className = "content";
  [...body.childNodes].forEach(n => { if (n.nodeType === 1 && (n.tagName === "SCRIPT" || n.id === "toast")) return; content.appendChild(n); });
  const top = document.createElement("div"); top.className = "topbar";
  top.innerHTML = '<a class="logo" href="index.html"><span class="mark">B</span>Buildora</a>' +
    '<a class="tl" href="index.html">Home</a><a class="tl" href="index.html#games">Games</a>' +
    '<input id="search" type="search" placeholder="Search games" aria-label="Search games"><div class="tr" id="tr"></div>';
  const layout = document.createElement("div"); layout.className = "layout";
  const side = document.createElement("aside"); side.className = "side";
  layout.append(side, content);
  body.prepend(layout); body.prepend(top);

  const q = new URLSearchParams(location.search).get("q");
  const search = document.getElementById("search");
  if (q) search.value = q;
  search.addEventListener("keydown", e => {
    if (e.key === "Enter" && !document.querySelector("#grid")) location.href = "index.html?q=" + encodeURIComponent(search.value);
  });

  const here = location.pathname.split("/").pop() || "index.html";
  onAuthStateChanged(auth, async user => {
    const tr = document.getElementById("tr");
    if (!user) {
      side.style.display = "none"; layout.classList.add("nosidebar");
      tr.innerHTML = '<a href="login.html">Log in</a><a class="btn" href="signup.html">Sign up</a>';
      return;
    }
    side.style.display = ""; layout.classList.remove("nosidebar");
    const profile = await getProfile(user.uid);
    if (!profile.username && here !== "settings.html") { location.href = "settings.html?setup=1"; return; }
    const a = profile.avatar || DEFAULT_AVATAR;
    const items = [["🏠", "Home", "index.html"], ["👤", "Profile", ""], ["👥", "Friends", ""], ["🧍", "Avatar", "avatar.html"], ["⚙️", "Settings", "settings.html"]];
    side.innerHTML = '<a class="who" href="avatar.html"><span class="mini">' + avatarSVG(a) + '</span><b>' + esc(profile.displayName || user.displayName || "Player") + '</b></a>' +
      items.map(i => '<a href="' + (i[2] || "#") + '"' + (i[2] ? "" : ' data-soon="' + i[1] + '"') + (i[2] === here ? ' class="on"' : "") + '><span aria-hidden="true">' + i[0] + '</span>' + i[1] + '</a>').join("");
    side.querySelectorAll("[data-soon]").forEach(l => l.onclick = e => { e.preventDefault(); say(l.dataset.soon + " is coming soon."); });
    tr.innerHTML = '<a href="#" id="out">Log out</a>';
    document.getElementById("out").onclick = e => { e.preventDefault(); signOut(auth); };
  });
}

export async function googleLogin() {
  const res = await signInWithPopup(auth, new GoogleAuthProvider());
  const ref = doc(db, "users", res.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { displayName: (res.user.displayName || "Player").slice(0, 20), avatar: DEFAULT_AVATAR });
  }
  return res.user;
}

export function friendly(err) {
  const m = {
    "app/username-taken": "That username is taken. Try another.",
    "permission-denied": "Couldn’t save. Check your Firestore rules.",
    "auth/invalid-email": "That email doesn’t look right.",
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/popup-closed-by-user": "The Google window was closed. Try again.",
    "auth/unauthorized-domain": "This website isn’t allowed yet. Add it in Firebase under Authentication, Settings, Authorized domains."
  };
  return m[err.code] || "Something went wrong. Try again.";
}
