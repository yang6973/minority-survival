import {
  restartGameSession,
  prepareNextRound,
  submitPlayerChoice,
  useSharedRevive,
} from "../../game-engine/session-engine/gameSessionEngine.js";

import {
  buildResultNarrative,
} from "../../game-engine/narrative-engine/roundNarrativeEngine.js";

import {
  updateBestStreak,
} from "../../game-engine/retention-engine/recordEngine.js";

import {
  calculateSenseScore,
  buildSenseGrade,
  buildSenseTitle,
} from "../../game-engine/score-engine/senseScoreEngine.js";

import {
  buildLiveCrowdData,
} from "../../game-engine/live-engine/liveCrowdEngine.js";

let isProcessing = false;
let showRoundIntro = true;
let session = null;

let playerNickname =
  localStorage.getItem("minority_nickname") || "";

let playerId =
  localStorage.getItem("minority_player_id") || "";

if (!playerId) {
  playerId =
    crypto.randomUUID?.() ||
    `player_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  localStorage.setItem("minority_player_id", playerId);
}

const SUPABASE_URL =
  "https://wkexiddubandufmkhdxj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_IIaM8TYnhHmZ_0pl9PcKOg_iUGqDLf1";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const DEV_MODE = false;
const HALL_OF_FAME_MIN_STREAK = 5;
const SHARE_REVIVE_MIN_STREAK = 3;

const app = document.getElementById("app");

function render() {
  if (!playerNickname || !session || !session.currentRound) {
    renderNicknameStart();
    return;
  }

  const round = session.currentRound;

  if (round.status === "WAITING_FOR_PLAYER") {
    if (showRoundIntro) {
      renderRoundIntro(round);

      setTimeout(() => {
        showRoundIntro = false;
        render();
      }, 900);

      return;
    }

    renderRound(round);
    return;
  }

  if (!round.survived && !round.scoreSaved) {
    round.scoreSaved = true;

    saveScore(
      session.nickname,
      session.survivalStreak
    );
  }

  renderResult(round);
}

function renderNicknameStart() {
  app.innerHTML = `
    <main class="screen intro-home">
      <section class="home-card nickname-start-card">

        <div class="start-spark">✦</div>

        <p class="intro-copy">
          생각 겹치면 바로 광탈
        </p>

        <h1 class="game-title">
          끼리끼리 <span>광탈</span>
        </h1>

        <p class="intro-sub">
          남들이 몰릴 답을 피하세요.<br />
          꼬고 꼬아야 살아남습니다.
        </p>

        <div class="start-rule-line">
          <span>⚡</span>
          솔직히 고르면 탈락,<br />
          꼬고 꼬아야 살아남습니다.
        </div>

        <div class="nickname-panel">
          <label for="nicknameInput">
            닉네임을 입력해주세요 <small>최대 10자</small>
          </label>

          <input
            id="nicknameInput"
            class="nickname-input"
            maxlength="10"
            placeholder="닉네임 입력"
            value="${playerNickname}"
          />

          <p id="nicknameHelp" class="nickname-help">
            이 닉네임은 랭킹에 표시됩니다.
          </p>
        </div>

        <button id="startBtn" class="start-game-btn">
          게임 시작
        </button>
      </section>
    </main>
  `;

  document.getElementById("startBtn").onclick = async () => {
    const nickname =
      document.getElementById("nicknameInput").value.trim();

    const help =
      document.getElementById("nicknameHelp");

    help.classList.remove("error");

    if (!nickname) {
      help.textContent = "닉네임을 입력해주세요.";
      help.classList.add("error");
      return;
    }

    if (nickname.length < 2) {
      help.textContent = "닉네임은 2자 이상 입력해주세요.";
      help.classList.add("error");
      return;
    }

    const available = await checkNicknameAvailable(nickname);

    if (!available) {
      help.textContent = "이미 사용 중인 닉네임입니다.";
      help.classList.add("error");
      return;
    }

    playerNickname = nickname;

    localStorage.setItem("minority_nickname", nickname);

    startGame();
  };
}

function renderRoundIntro(round) {
  app.innerHTML = `
    <main class="screen intro-screen">
      <section class="intro-card">
        <p>${round.roundNumber}라운드</p>

        <h1>끼리끼리 광탈</h1>

        <span>
          생각이 겹치면 바로 광탈.<br />
          이번 판엔 어디로 몰릴까요?
        </span>
      </section>
    </main>
  `;
}

function getChoiceButtonClass(text) {
  if (!text) {
    return "choice-btn";
  }

  if (text.length >= 24) {
    return "choice-btn choice-btn-xsmall";
  }

  if (text.length >= 16) {
    return "choice-btn choice-btn-small";
  }

  return "choice-btn";
}

function renderRound(round) {
  const liveCrowd = buildLiveCrowdData(round.prediction);

  app.innerHTML = `
    <main class="screen">

      <section class="top-brand-bar">
        <div class="brand-left">
          <span class="rule-spark big">✦</span>

          <p class="rule-main-copy">
            끼리끼리 광탈
          </p>
        </div>

        <div class="mini-status-inline">
          <span>${round.roundNumber}라운드</span>
          <span class="mini-dot"></span>
          <span>연속 생존 ${session.survivalStreak}</span>
        </div>
      </section>

      <section class="signal-card">
        <p class="eyebrow">QUESTION</p>
        <h1>${round.question.text}</h1>
      </section>

      <section class="live-crowd-card">
        <div class="live-row">
          <span>현재 참가자</span>
          <strong>${liveCrowd.participantCount.toLocaleString()}명</strong>
        </div>

        <div class="live-row trend">
          <span>실시간 분위기</span>
          <strong>${liveCrowd.trendMessage}</strong>
        </div>
      </section>

      <section class="boksil-vibe-card">
        <div class="boksil-vibe-top">
          <div class="mini-boksil">
            👀
          </div>

          <div class="boksil-vibe-copy">
            <strong>복실이의 촉</strong>

            <p>
              ${buildBoksilVibeMessage()}
            </p>
          </div>
        </div>

        <div class="mini-crowd-window">
          <div class="mini-crowd-track">
            ${buildRollingCrowdReactionHtml(round)}
          </div>
        </div>
      </section>

      <section class="choice-grid">
        <button class="${getChoiceButtonClass(round.question.optionA)}" data-choice="A">
          ${round.question.optionA}
        </button>

        <button class="${getChoiceButtonClass(round.question.optionB)}" data-choice="B">
          ${round.question.optionB}
        </button>        
      </section>

      <p class="hint">
        정답은 없습니다. 사람들이 어디로 몰릴지 피하세요.
      </p>
    </main>
  `;

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (isProcessing) {
        return;
      }

      isProcessing = true;

      const choice = btn.dataset.choice;

      renderProcessingScreen(choice);

      await wait(1000);

      renderRevealLoading();

      await wait(1800);

      session = submitPlayerChoice(session, choice);

      isProcessing = false;

      render();
    };
  });
}

function renderResult(round) {
  const survived = round.survived;
  const resultNarrative = buildResultNarrative(round);

  const playerPercent =
    round.playerChoice === "A"
      ? round.prediction.predictedA
      : round.prediction.predictedB;

  const crowdLevel = getCrowdLevel(playerPercent, survived);
  const isNearMiss = !survived && playerPercent <= 55;

  const record = updateBestStreak(session.survivalStreak);

  const senseScore = calculateSenseScore(round);
  const senseGrade = buildSenseGrade(senseScore);
  const senseTitle = buildSenseTitle(senseScore);

  const canUseShareRevive =
    !survived &&
    session.survivalStreak >= SHARE_REVIVE_MIN_STREAK &&
    !session.sharedReviveUsed;

  app.innerHTML = `
    <main class="screen result ${survived ? "survived" : "eliminated"}">
      <section class="result-card">
        <p class="eyebrow">
          ${survived ? "SURVIVED" : "OUT"}
        </p>

        <h1>
          ${survived ? "살았어요" : "탈락했어요"}
        </h1>

        <div class="crowd-result">
          <div class="crowd-row">
            <span>A ${round.question.optionA}</span>
            <strong id="percentA">0%</strong>
          </div>

          <div class="bar">
            <div
              class="bar-fill"
              style="width: ${round.prediction.predictedA}%"
            ></div>
          </div>

          <div class="crowd-row">
            <span>B ${round.question.optionB}</span>
            <strong id="percentB">0%</strong>
          </div>

          <div class="bar">
            <div
              class="bar-fill"
              style="width: ${round.prediction.predictedB}%"
            ></div>
          </div>
        </div>

        <div class="result-stats-grid">
          <div class="my-choice-card">
            <p>내 선택</p>

                ${(() => {

                  const selectedText =
                    round.playerChoice === "A"
                      ? round.question.optionA
                      : round.question.optionB;

                  let titleClass = "choice-title";

                  if (selectedText.length >= 22) {
                    titleClass += " xsmall";
                  }
                  else if (selectedText.length >= 16) {
                    titleClass += " small";
                  }

                  return `
                    <strong class="${titleClass}">
                      ${selectedText}
                    </strong>
                  `;

                })()}

          <span>
              <b id="playerPercent">0%</b>가 같은 선택을 했어요
            </span>
          </div>

          <div class="sense-score-card">
            <p>눈치력</p>

            <strong>${senseScore}</strong>

            <span class="sense-title">
              ${senseTitle}
            </span>

            <small>
              ${senseGrade}
            </small>
          </div>
        </div>

        <p class="result-message">
          ${resultNarrative}
        </p>

        ${
          DEV_MODE
            ? `
              <div class="debug-rule-card">
                <p>DEV CHECK</p>
                <span>ROUND TYPE: ${round.roundType}</span>
                <span>MY PERCENT: ${playerPercent}%</span>
                <span>RESULT: ${survived ? "SURVIVED" : "OUT"}</span>
              </div>
            `
            : ""
        }

        <p class="near-message ${isNearMiss ? "near-hit" : ""}">
          ${crowdLevel}
        </p>

        <div class="record-card">
          <div>
            <span>현재 기록</span>
            <strong>${session.survivalStreak}R</strong>
          </div>

          <div>
            <span>최고 기록</span>
            <strong>${record.bestStreak}R</strong>
          </div>
        </div>

        ${
          record.isNewRecord
            ? `<p class="new-record">🔥 최고 기록 갱신!</p>`
            : ""
        }

        <div class="result-actions">
          ${
            survived
              ? `
                <button id="nextBtn">
                  다음 라운드 가기
                </button>
              `
              : `
                <button id="sadBtn" class="secondary-btn sad-btn" disabled>
                  아~! 아쉬워요...
                </button>
              `
          }

          ${
            canUseShareRevive
              ? `
                <button id="shareReviveBtn" class="secondary-btn share-revive-btn">
                  친구와 공유하고 한판 더~!
                </button>
              `
              : ""
          }
        </div>
      </section>
    </main>
  `;

  requestAnimationFrame(() => {
    animatePercentage(
      document.getElementById("percentA"),
      round.prediction.predictedA
    );

    animatePercentage(
      document.getElementById("percentB"),
      round.prediction.predictedB
    );

    animatePercentage(
      document.getElementById("playerPercent"),
      playerPercent
    );
  });

  if (!survived && !canUseShareRevive) {
    setTimeout(() => {
      renderHallOfFame();
    }, 1600);
  }

  const nextBtn = document.getElementById("nextBtn");

  if (nextBtn) {
    nextBtn.onclick = () => {
      session = prepareNextRound(session);
      showRoundIntro = true;
      render();
    };
  }

  const shareReviveBtn =
    document.getElementById("shareReviveBtn");

  if (shareReviveBtn) {
    shareReviveBtn.onclick = async () => {
      shareReviveBtn.disabled = true;
      shareReviveBtn.textContent = "공유 준비 중...";

      const shared = await tryShareResult();

      if (!shared) {
        renderShareFailedCard();
        return;
      }

      const shared = await tryShareResult();

      if (!shared) {
        renderShareFailedCard();
        return;
      }

      renderSharedReviveCard();      
    };
  }
}

function renderSharedReviveCard() {
  app.innerHTML = `
    <main class="screen thinking-screen">
      <section class="thinking-card revive-card">
        <p class="thinking-label">
          LAST CHANCE
        </p>

        <h1>
          한 번 더 살아났어요
        </h1>

        <p class="thinking-message">
          공유 완료!<br />
          이번 기록을 이어서 한 판 더 도전합니다.
        </p>

        <button id="confirmReviveBtn">
          한판 더 하기
        </button>
      </section>
    </main>
  `;

  document.getElementById("confirmReviveBtn").onclick = () => {
    session = useSharedRevive(session);
    showRoundIntro = true;
    render();
  };
}

function buildRollingCrowdReactionHtml(round) {
  const messages = buildCrowdChatMessages(round).slice(0, 6);
  const loopMessages = [...messages, ...messages];

  return loopMessages
    .map((message) => `<p>${message}</p>`)
    .join("");
}

function buildCrowdChatMessages(round) {
  const predictedA = round.prediction.predictedA;
  const predictedB = round.prediction.predictedB;

  const labelSets = [
    ["A", "B"],
    ["첫 번째", "두 번째"],
    ["1번", "2번"],
    ["왼쪽", "오른쪽"],
    ["위", "아래"],
  ];

  const selectedLabels =
    pickRandom(labelSets);

  const optionA = selectedLabels[0];
  const optionB = selectedLabels[1];

  const starters = [
    "이건",
    "솔직히",
    "근데",
    "아니 이거",
    "이번 판",
    "생각보다",
    "다들",
    "오히려",
    "딱 봐도",
    "근데 또",
    "은근",
    "조용히",
    "여기서",
    "이 타이밍에",
    "지금 분위기상",
    "내 촉엔",
    "왠지",
    "이거 보면",
    "반대로 보면",
    "슬슬"
  ];

  const endings = [
    "ㅋㅋ",
    "ㄹㅇ",
    "아닌가?",
    "개어렵네",
    "몰리겠는데",
    "위험함",
    "애매하다",
    "나만 헷갈림?",
    "역심리 올 듯",
    "진짜 모르겠다",
    "살짝 무서움",
    "머리 아픔",
    "답 없어 보임",
    "한쪽 냄새남",
    "이거 함정임?",
    "괜히 불안함",
    "다 꼬는 중",
    "촉 안 옴",
    "이상하게 찝찝함",
    "진짜 눈치 싸움"
  ];

  const topic =
    predictedA > predictedB
      ? [
          `${optionA} 쪽 많이 갈 듯`,
          `${optionA} 너무 뻔한데`,
          `${optionA} 고르면 위험한가`,
          `${optionB}가 오히려 살 길인가`,
          `${optionA} 몰림 냄새남`,
          `${optionB}가 덜 겹칠 수도`,
          `${optionA}는 너무 정직한 선택 같음`,
          `${optionB}로 피해야 하나`
        ]
      : [
          `${optionB} 쪽 많이 갈 듯`,
          `${optionB} 너무 뻔한데`,
          `${optionB} 고르면 위험한가`,
          `${optionA}가 오히려 살 길인가`,
          `${optionB} 몰림 냄새남`,
          `${optionA}가 덜 겹칠 수도`,
          `${optionB}는 너무 정직한 선택 같음`,
          `${optionA}로 피해야 하나`
        ];

  const mixed = [
    "다 꼬아서 생각할 듯",
    "이거 양쪽 갈릴 것 같은데",
    "한쪽으로 확 몰릴 냄새남",
    "다들 똑같이 생각하면 끝임",
    "이건 진짜 눈치 싸움",
    "나만 반대로 가고 싶나",
    "평범하게 고르면 죽을 듯",
    "이거 선택 전에 뇌정지 옴",
    "여기서 솔직하면 바로 끝날 듯",
    "다들 아닌 척 같은 생각할 듯",
    "이 판은 감으로 가면 위험함",
    "왠지 한쪽으로 쓸릴 것 같음",
    "고민할수록 더 모르겠음",
    "너무 당연한 답은 피해야 함",
    "근데 반대로 꼬면 또 위험함",
    "이건 머리 쓰다 망하는 판"
  ];

  const messages = [];

  for (let i = 0; i < 12; i++) {
    const starter = pickRandom(starters);
    const body = pickRandom(i % 2 === 0 ? topic : mixed);
    const ending = pickRandom(endings);

    messages.push(`${starter} ${body} ${ending}`);
  }

  return messages;
}

function buildBoksilVibeMessage() {
  const vibes = [
    "오늘 방 분위기 좀 이상한데…",
    "다들 너무 꼬고 있는 느낌인데?",
    "이번 판은 진짜 헷갈려 보여.",
    "한쪽으로 확 몰릴 냄새남.",
    "다들 눈치 엄청 보는 중.",
    "평범하게 가면 위험할지도?",
    "이번엔 나도 감이 안 와.",
    "조용히 역심리 도는 중인가…",
    "다들 서로 속고 있는 느낌인데?",
    "이번 판 분위기 살짝 무섭다.",
    "이건 고르기 전부터 불안한 판.",
    "뭔가 다들 같은 생각 중인 듯.",
    "조용한데 이상하게 위험해.",
    "이번 판은 촉 믿으면 안 될 수도."
  ];

  return pickRandom(vibes);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getCrowdLevel(playerPercent, survived) {
  if (survived) {
    if (playerPercent >= 45) {
      return "진짜 아슬아슬했어요. 거의 같이 몰릴 뻔했어요.";
    }

    if (playerPercent >= 38) {
      return "적당히 잘 피했어요.";
    }

    return "깔끔하게 몰림을 피했어요.";
  }

  if (playerPercent <= 55) {
    return "거의 생존할 뻔...\n진짜 한 끗 차이였어~!";
  }

  if (playerPercent <= 65) {
    return "생각보다 사람들이 많이 같은 선택을 했어요.";
  }

  return "너무 많이 몰렸어요. 다들 비슷하게 생각했어요.";
}

function startGame() {
  session = restartGameSession();
  session.nickname = playerNickname;
  showRoundIntro = true;
  render();
}

function renderProcessingScreen(choice) {
  app.innerHTML = `
    <main class="screen thinking-screen">
      <section class="thinking-card">
        <p class="thinking-label">
          선택 완료
        </p>

        <h1>
          ${choice === "A" ? "A 선택" : "B 선택"}
        </h1>

        <div class="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <p class="thinking-message">
          참가자 반응 분석 중...
        </p>
      </section>
    </main>
  `;
}

function renderRevealLoading() {
  app.innerHTML = `
    <main class="screen thinking-screen">
      <section class="thinking-card reveal-card">
        <p class="thinking-label">
          실시간 집계 중
        </p>

        <h1>
          어디로 몰렸을까?
        </h1>

        <div class="crowd-flow">
          <div class="runner r1"></div>
          <div class="runner r2"></div>
          <div class="runner r3"></div>
          <div class="runner r4"></div>
          <div class="runner r5"></div>
        </div>

        <p class="thinking-message">
          참가자 선택 비율 계산 중...
        </p>
      </section>
    </main>
  `;
}

function renderShareFailedCard() {
  app.innerHTML = `
    <main class="screen thinking-screen">
      <section class="thinking-card revive-card">
        <p class="thinking-label">
          SHARE CANCELED
        </p>

        <h1>
          공유가 취소됐어요
        </h1>

        <p class="thinking-message">
          공유가 완료되면 한 번 더 도전할 수 있어요.
        </p>

        <button id="backToHallBtn">
          명예의 전당 보기
        </button>
      </section>
    </main>
  `;

  document.getElementById("backToHallBtn").onclick = () => {
    renderHallOfFame();
  };
}

function buildShareText() {
  const messages = [
    `나는 끼리끼리 광탈에서 ${session.survivalStreak}R까지 생존했어.\n사람들 어디 몰릴지 맞히는 거 은근 어렵다.`,
    `끼리끼리 광탈 ${session.survivalStreak}R 생존.\n너도 사람들 몰리는 쪽 피할 수 있나 해봐.`,
    `나 방금 ${session.survivalStreak}R까지 감.\n생각 겹치면 바로 광탈임.`,
    `눈치력 테스트 완료.\n나는 ${session.survivalStreak}R까지 살아남았다.`,
    `다들 같은 생각할 때 반대로 가야 사는 게임.\n나는 ${session.survivalStreak}R까지 갔다.`,
  ];

  return pickRandom(messages);
}

  async function tryShareResult() {
    const shareText = buildShareText();
    const shareUrl = window.location.href;
    const fullText = `${shareText}\n\n${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "끼리끼리 광탈",
          text: shareText,
          url: shareUrl,
        });

        return true;
      }
    } catch (error) {
      console.warn("공유창 실패 또는 취소:", error);
    }

    try {
      await navigator.clipboard.writeText(fullText);

      alert("공유 링크가 복사됐어요. 친구에게 붙여넣기 해주세요.");
      return true;
    } catch (error) {
      console.warn("클립보드 복사 실패:", error);
    }

    prompt("아래 내용을 복사해서 친구에게 보내주세요.", fullText);
    return true;
  }

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function animatePercentage(element, target) {
  if (!element) {
    return;
  }

  let current = 0;

  const duration = 700;
  const stepTime = 16;
  const increment = target / (duration / stepTime);

  const timer = setInterval(() => {
    current += increment;

    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    element.textContent = `${Math.round(current)}%`;
  }, stepTime);
}

async function saveScore(nickname, streak) {
  try {
    const { error } = await supabase
      .from("leaderboard")
      .upsert(
        {
          player_id: playerId,
          nickname: nickname,
          best_streak: streak,
          current_streak: streak
        },
        {
          onConflict: "player_id"
        }
      );

    if (error) {
      console.error("점수 저장 실패:", error);
    } else {
      console.log("점수 저장 완료");
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadHallOfFame() {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("nickname, best_streak, created_at")
      .gte("best_streak", HALL_OF_FAME_MIN_STREAK)
      .order("best_streak", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      console.error("명예의 전당 조회 실패:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function renderHallOfFame() {
  const ranking = await loadHallOfFame();

  const myRecord =
    Number(localStorage.getItem("best_streak") || 0);

  const needMore =
    Math.max(0, HALL_OF_FAME_MIN_STREAK - myRecord);

  const mixedRanking =
    buildMixedHallOfFameRanking(ranking);

  const rows = mixedRanking.length
    ? mixedRanking
        .map((item, index) => {
          return `
            <div class="hall-row">
              <span class="hall-rank">${index + 1}위</span>
              <strong>${item.nickname}</strong>
              <em>${item.best_streak}R</em>
            </div>
          `;
        })
        .join("")
    : `
      <div class="hall-empty">
        아직 명예의 전당 입성자가 없어요.<br />
        5라운드 이상 살아남으면 이름이 올라갑니다.
      </div>
    `;

  app.innerHTML = `
    <main class="screen hall-screen">
      <section class="hall-card">
        <p class="eyebrow">
          HALL OF FAME
        </p>

        <h1>
          명예의 전당
        </h1>

        <p class="hall-desc">
          ${HALL_OF_FAME_MIN_STREAK}라운드 이상 살아남은 플레이어만 입성합니다.
        </p>

        <div class="my-hall-record">
          <span>내 최고 기록</span>
          <strong>${myRecord}R</strong>
          <small>
            ${
              myRecord >= HALL_OF_FAME_MIN_STREAK
                ? "명예의 전당 입성 조건을 달성했어요."
                : `입성까지 ${needMore}R 남았어요.`
            }
          </small>
        </div>

        <div class="hall-list">
          ${rows}
        </div>

        <button id="retryBtn" class="start-game-btn">
          처음부터 다시하기
        </button>
      </section>
    </main>
  `;

  document.getElementById("retryBtn").onclick = () => {
    session = restartGameSession();
    session.nickname = playerNickname;
    showRoundIntro = true;
    render();
  };
}

function buildMixedHallOfFameRanking(realRanking) {

  // 실제 데이터 충분하면
  // 실데이터만 사용
  if (realRanking.length >= 10) {
    return realRanking
      .sort((a, b) => b.best_streak - a.best_streak)
      .slice(0, 5);
  }

  const fakeNames = [
    { nickname: "광탈장인", best_streak: 13 },
    { nickname: "눈치999단", best_streak: 12 },
    { nickname: "역심리빌런", best_streak: 11 },
    { nickname: "혼자살아남음", best_streak: 10 },
    { nickname: "몰림감지기", best_streak: 9 },
    { nickname: "소수파헌터", best_streak: 9 },
    { nickname: "뇌지컬러", best_streak: 8 },
    { nickname: "촉좋은사람", best_streak: 8 },
    { nickname: "반대로만감", best_streak: 7 },
    { nickname: "눈치챙김", best_streak: 7 },
    { nickname: "다피해감", best_streak: 6 },
    { nickname: "안겹침", best_streak: 6 },
    { nickname: "소수파감별사", best_streak: 5 },
    { nickname: "혼자다른생각", best_streak: 5 },
  ];

  return [...realRanking, ...fakeNames]
    .sort(() => Math.random() - 0.5)
    .sort((a, b) => b.best_streak - a.best_streak)
    .slice(0, 5);
}

async function checkNicknameAvailable(nickname) {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("player_id")
      .eq("nickname", nickname)
      .limit(1);

    if (error) {
      console.error("닉네임 확인 실패:", error);
      return true;
    }

    if (!data || data.length === 0) {
      return true;
    }

    return data[0].player_id === playerId;
  } catch (err) {
    console.error(err);
    return true;
  }
}

render();