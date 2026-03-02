const app = document.getElementById("app");
const TOTAL_QUESTIONS = 10;
const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWX".split("");

let mode = null;
let questions = [];
let current = 0;
let correctCount = 0;
let startTime = 0;

let memoEdges = [];
let memoCorners = [];
let memoEdgeIndex = 0;
let memoCornerIndex = 0;
let memoPhase = "edge"; // edge → corner → input
let memoStartTime = 0;

let memoResult = null;       // 正誤・正答・時間を保持
let memoResultPage = 1;     // 1 or 2
let memoRetryUsed = false;  // try the same attempt 用

function home() {
  app.innerHTML = `
    <h1>Blindfolded Training</h1>
    <button onclick="start('edge')">Edge Training</button>
    <button onclick="start('corner')">Corner Training</button>
    <button onclick="startMemorization()">Memorization Training</button>
  `;
}

function start(selectedMode) {
  mode = selectedMode;
  current = 0;
  correctCount = 0;
  questions = generateQuestions();
  showQuestion();
}

function generateQuestions() {
  const list = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const letter = ALPHABETS[Math.floor(Math.random() * ALPHABETS.length)];
    const variant =
      mode === "edge"
        ? Math.ceil(Math.random() * 2)
        : Math.ceil(Math.random() * 3);

    list.push({
      answer: letter,
      img: `images/${mode}/${mode}_${letter.toLowerCase()}_${variant}.png`
    });
  }
  return list;
}

function showQuestion() {
  if (current === 0) startTime = performance.now();

  const q = questions[current];
  app.innerHTML = `
    <h2>${mode.toUpperCase()} Training (${current + 1}/${TOTAL_QUESTIONS})</h2>
    <img src="${q.img}" />
    <div class="buttons">
      ${ALPHABETS.map(
        a => `<button onclick="guess('${a}')">${a}</button>`
      ).join("")}
    </div>
  `;
}

function guess(letter) {
  const q = questions[current];
  const isCorrect = letter === q.answer;
  if (isCorrect) correctCount++;

  app.innerHTML = `
    <div class="${isCorrect ? "correct" : "wrong"}">
      ${isCorrect ? "✔" : "✖"}
    </div>
    ${!isCorrect ? `<p>正解：${q.answer}</p>` : ""}
  `;

  setTimeout(() => {
    current++;
    if (current < TOTAL_QUESTIONS) {
      showQuestion();
    } else {
      showResult();
    }
  }, 500);
}

function showResult() {
  const time = ((performance.now() - startTime) / 1000).toFixed(2);
  const rate = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

  app.innerHTML = `
    <h2>Result</h2>
    <p>経過時間：${time} 秒</p>
    <p>正答率：${rate} %</p>
    <button onclick="home()">ホームに戻る</button>
  `;
}

function startMemorization() {
  const length = Math.floor(Math.random() * 7) + 10; // 10〜16（1回だけ）

  memoEdges = generateMemoSequence("edge", length);
  memoCorners = generateMemoSequence("corner", length);

  memoEdgeIndex = 0;
  memoCornerIndex = 0;
  memoPhase = "edge";
  memoStartTime = performance.now();
  showMemoImage();
}

function generateMemoSequence(type, length) {
  return Array.from({ length }, () => {
    const letter = ALPHABETS[Math.floor(Math.random() * ALPHABETS.length)];
    const variant =
      type === "edge"
        ? Math.ceil(Math.random() * 2)
        : Math.ceil(Math.random() * 3);

    return {
      letter,
      img: `images/${type}/${type}_${letter.toLowerCase()}_${variant}.png`
    };
  });
}

function showMemoImage() {
  let currentItem;
  let message = "";
  let isLastCorner = false;
  let isFirstEdge = false;

  if (memoPhase === "edge") {
    currentItem = memoEdges[memoEdgeIndex];
    if (memoEdgeIndex === memoEdges.length - 1) message = "last of edge";
    if (memoEdgeIndex === 0) isFirstEdge = true;
  } else if (memoPhase === "corner") {
    currentItem = memoCorners[memoCornerIndex];
    if (memoCornerIndex === memoCorners.length - 1) {
      message = "last of corner";
      isLastCorner = true;
    }
  }

  app.innerHTML = `
    <h2>Memorization Training</h2>
    <p>${message}</p>
    <img src="${currentItem.img}" />

    <div>
      ${
        memoPhase !== "edge" || !isFirstEdge
          ? `<button onclick="memoBack()">back</button>`
          : ""
      }

      ${
        memoPhase === "corner" && isLastCorner
          ? `<button onclick="showMemoInput()">input answer</button>`
          : `<button onclick="memoNext()">Next</button>`
      }

      <button onclick="recheckEdge()">recheck edge</button>
      <button onclick="recheckCorner()">recheck corner</button>
    </div>
  `;
}

function memoNext() {
  if (memoPhase === "edge") {
    memoEdgeIndex++;
    if (memoEdgeIndex >= memoEdges.length) {
      memoPhase = "corner";
      memoCornerIndex = 0;
    }
  } else if (memoPhase === "corner") {
    memoCornerIndex++;
    if (memoCornerIndex >= memoCorners.length) {
      memoPhase = "input";
      showMemoInput();
      return;
    }
  }
  showMemoImage();
}

function recheckEdge() {
  memoPhase = "edge";
  memoEdgeIndex = 0;
  showMemoImage();
}

function recheckCorner() {
  memoPhase = "corner";
  memoCornerIndex = 0;
  showMemoImage();
}

function showMemoInput() {
  app.innerHTML = `
    <h2>Input Answer</h2>
    <div>
      <label>Edge：</label>
      <input id="edgeAnswer" />
    </div>
    <div>
      <label>Corner：</label>
      <input id="cornerAnswer" />
    </div>
    <button onclick="checkMemoAnswer()">answer</button>
  `;
}

function checkMemoAnswer() {
  const edgeInput =
    document.getElementById("edgeAnswer").value.toUpperCase();
  const cornerInput =
    document.getElementById("cornerAnswer").value.toUpperCase();

  const correctEdge = memoEdges.map(e => e.letter).join("");
  const correctCorner = memoCorners.map(c => c.letter).join("");

  const isCorrect =
    edgeInput === correctEdge && cornerInput === correctCorner;

  const time = ((performance.now() - memoStartTime) / 1000).toFixed(2);

  memoResult = {
    isCorrect,
    correctEdge,
    correctCorner,
    edgeInput,
    cornerInput,
    time
  };

  memoResultPage = 1;
  memoRetryUsed = false;

  showMemoResultPage1();
}

function showMemoResultPage1() {
  const r = memoResult;

  app.innerHTML = `
    <h2>Result</h2>
    <div class="${r.isCorrect ? "correct" : "wrong"}">
      ${r.isCorrect ? "✔" : "✖"}
    </div>
    <p>経過時間：${r.time} 秒</p>

    <button onclick="showMemoResultPage2()">show answer</button>

    ${
      !r.isCorrect && !memoRetryUsed
        ? `<button onclick="retrySameAttempt()">try the same attempt</button>`
        : ""
    }

    <button onclick="home()">ホームに戻る</button>
  `;
}

function showMemoResultPage2() {
  memoResultPage = 2;
  const r = memoResult;

  app.innerHTML = `
    <h2>Answer</h2>
    <p>正答 Edge：${r.correctEdge}</p>
    <p>正答 Corner：${r.correctCorner}</p>
    <p>あなたの回答 Edge：${r.edgeInput}</p>
    <p>あなたの回答 Corner：${r.cornerInput}</p>

    <button onclick="showMemoResultPage1()">back</button>
    <button onclick="home()">ホームに戻る</button>
  `;
}

function retrySameAttempt() {
  memoRetryUsed = true;
  memoPhase = "edge";
  memoEdgeIndex = 0;
  memoCornerIndex = 0;
  showMemoImage();
}

function memoBack() {
  if (memoPhase === "edge" && memoEdgeIndex > 0) {
    memoEdgeIndex--;
  } else if (memoPhase === "corner" && memoCornerIndex > 0) {
    memoCornerIndex--;
  }
  showMemoImage();
}

home();