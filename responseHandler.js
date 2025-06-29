const responses = new Map([
  ["YOUR WALLET", "NEXT"],
  ["A.PHILIPPINES\nB.USA", "A."],
  ["C.ARGENTINA \nD.COLOMBIA", "D."],
  ["A.AFGHANISTAN\nB.RUSSIA", "B."],
  ["C.BAHRAIN\nD.CANADA", "C."],
  ["A. CHILE\nB. BRAZIL", "B."],
  ["C. GERMANY\nD. LAOS", "C."],
  ["🤩Are you ready?", "YES!😍"],
  ["Your new balance is", "NEXT QUESTION👌"],
  ["Category 1", null],
  ["Category 2", null],
  ["Category 3", null],
  ["❗️NO TYPING, SENDING PICTURES AND SENDING LIKES", null],
  // Add more questions/answers here...
]);

function normalize(text) {
  return text.trim().toLowerCase();
}

function getResponse(message) {
  const msg = normalize(message);
  for (const [pattern, response] of responses) {
    if (msg.includes(normalize(pattern))) {
      return response;
    }
  }
  return null;
}

module.exports = { getResponse };
