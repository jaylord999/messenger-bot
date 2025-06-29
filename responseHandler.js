
const lastMessagePerSender = new Map();

function normalize(text) {
  return text.trim().toLowerCase().replace(/\.$/, '');
}

function getResponse(previousMessage, currentMessage) {
  if (currentMessage.includes("❗️NO TYPING, SENDING PICTURES AND SENDING LIKES")) return null;

  if (currentMessage.includes("Category 1") ||
      currentMessage.includes("Category 2") ||
      currentMessage.includes("Category 3")) return null;

  if (currentMessage.includes("Your new balance is")) return "NEXT QUESTION👌";

  if (currentMessage === "🤩Are you ready?") {
    if (previousMessage === "📶Network cleared!") return "YES!😍";
    if (previousMessage === "📶Network verified!") return "AS ALWAYS!😊";
    return null;
  }

  const questionDataMap = new Map([
    ["YOUR WALLET", "NEXT"],
    ["A.PHILIPPINES\nB.USA", "A."],
    ["C.ARGENTINA \nD.COLOMBIA", "D."],
    ["A.AFGHANISTAN\nB.RUSSIA", "B."],
    ["C.BAHRAIN\nD.CANADA", "C."],
    ["A. CHILE\nB. BRAZIL", "B."],
    ["C. GERMANY\nD. LAOS", "C."],
    ["C. JAPAN\nD. KOREA", "C."],
    ["A. MALAYSIA\nB. INDONESIA", "A."],
    ["C. UKRAINE\nD. SPAIN", "D."],
    ["A. THAILAND\nB. CHILE", "B."],
    ["B. MOUNT OLYMPUS", "B."],
    ["C. HERMES", "C."],
    ["A. PERSEUS", "A."],
    ["D. APHRODITE", "D."],
    ["C. TROY", "C."],
    ["B. METIS", "B."],
    ["A. CETO", "A."],
    ["C. CRONUS", "C."],
    ["D. RHEA", "D."],
    ["A. POSEIDON", "A."],
    ["HOWL", "B."],
    ["NEIGH", "A."],
    ["SNORT", "B."],
    ["HISS", "B."],
    ["BUZZ", "A."],
    ["CHIRP", "B."],
    ["MOO", "A."],
    ["MEOW", "B."],
    ["WOOF", "D."],
    ["ROAR", "C."],
    ["c. You will regret your mistakes.", "C"],
    ["c. Friendship is rare.", "B"],
    ["c. Regret will never come.", "A"],
    ["c. Education will change the future.", "A"],
    ["c. She is ignoring your help.", "C"],
    ["c. Time is a gift.", "A"],
    ["c. Deceptive", "B"],
    ["c. Tidy", "B"],
    ["c. Normal", "C"],
    ["c. Dark", "B"],
    ["c. Confident", "C"],
    ["c. Unhappy", "C"],
    ["c. Excited", "A"],
    ["c. Quickie", "C"],
    ["c. Hard", "A"],
    ["c. Bad", "A"],
    ["c. Happy", "C"],
    ["c. Sad", "B"],
    ["c. Soft", "B"],
    ["c. Afraid", "A"],
    ["c. Mean", "A"],
    ["c. Idle", "B"],
    ["c. Noisy", "B"],
    ["c. Slow", "A"],
    ["c. Angry", "B"],
    ["c. Narrow", "A"],
    ["c. The project is finished.", "B"],
    ["c. We traveled together.", "A"],
    ["c. The book is outside the bag.", "B"],
    ["c. The line outside is closed.", "B"],
    ["c. I will learn many things tomorrow.", "A"],
    ["c. He borrowed new shoes.", "B"],
    ["c. Trust in others is the key to success.", "B"],
    ["c. You need to eat.", "B"],
    ["c. Life is full of challenges.", "C"],
    ["c. Finish early tomorrow.", "B"],
    ["c. Success requires happiness.", "A"],
    ["c. Study only when needed.", "A"],
    ["c. The food is there.", "C"],
    ["c. Hard work leads to failure.", "A"],
    ["c. Total Eclipse of the Heart", "B"],
    ["c. Balete Drive", "C"],
    ["c. Dumadating pagkatapos ang event", "B"],
    ["c. Manananggal", "B"],
    ["c. Shamcey Supsup", "A"],
    ["c. Mawawala ang suwerte", "C"],
    ["c. Tricycle", "A"],
    ["c. Dahil mas cute pakinggan", "C"],
    ["c. Luksong Tinik", "A"],
    ["c. MassKara Festival", "C"],
    ["c. Jollibee", "B"],
    ["c. Barbecue na tenga ng baboy", "B"],
    ["c. Para makapag-exercise", "B"],
    ["c. Pumipilit umintindi", "A"],
    ["c. Para makaiwas sa bayad", "A"],
    ["c. Roberto Del Rosario", "A"],
    ["c. Nakakahiya!", "C"],
    ["c. Agawan Base", "B"],
    ["c. Pampaganda ng boses", "A"],
    ["c. Endless Love", "A"]
  ]);

  for (const [key, value] of questionDataMap.entries()) {
    if (normalize(currentMessage).includes(normalize(key))) {
      return value.toUpperCase();
    }
  }

  return null;
}

function processMessage(senderId, currentMessage) {
  const previousMessage = lastMessagePerSender.get(senderId);
  const response = getResponse(previousMessage, currentMessage);
  lastMessagePerSender.set(senderId, currentMessage);
  return response;
}

module.exports = { processMessage };
