const gameArea = document.getElementById('game-area');
const lanes = [
    document.getElementById('lane1'),
    document.getElementById('lane2'),
    document.getElementById('lane3'),
    document.getElementById('lane4')
];
const targets = [
    document.getElementById('target1'),
    document.getElementById('target2'),
    document.getElementById('target3'),
    document.getElementById('target4')
];
const scoreValue = document.getElementById('score-value');
const comboValue = document.getElementById('combo-value');
const judgeText = document.getElementById('judge-text');
const startButton = document.getElementById('startButton');

let score = 0;
let combo = 0;
let notes = []; // アクティブなノーツを管理
let gameTimer = null;
let startTime = 0;
const noteSpeed = 3; // ピクセル/フレーム (600pxを約3.3秒で落下)

// サンプル譜面: [時間(ms), レーン(0-3)]
const beatmap = [
    [1000, 0], [1500, 1], [2000, 2], [2500, 3],
    [3000, 0], [3000, 2], [3500, 1], [3500, 3],
    [4000, 0], [4250, 1], [4500, 2], [4750, 3],
    [5500, 0], [5500, 1], [5500, 2], [5500, 3],
];
let beatmapIndex = 0;

// キー設定 (D, F, J, K)
const keyMap = {
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3
};

startButton.addEventListener('click', startGame);

function startGame() {
    score = 0;
    combo = 0;
    beatmapIndex = 0;
    notes = [];
    scoreValue.textContent = 0;
    comboValue.textContent = 0;
    startTime = Date.now();
    startButton.disabled = true;

    // 既存のノーツをクリア
    document.querySelectorAll('.note').forEach(note => note.remove());

    gameTimer = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    const currentTime = Date.now() - startTime;

    // 1. ノーツの生成
    while (beatmapIndex < beatmap.length && beatmap[beatmapIndex][0] <= currentTime + 1800) { // 約3秒前に生成
        createNote(beatmap[beatmapIndex][1]);
        beatmapIndex++;
    }

    // 2. ノーツの移動と削除
    let notesToRemove = [];
    for (const note of notes) {
        // 判定ラインの底Y座標 (600 - 50 = 550)
        const judgeLineY = gameArea.clientHeight - targets[0].offsetTop; 
        const noteTop = note.element.offsetTop + note.speed;
        note.element.style.top = `${noteTop}px`;
        
        // 判定ラインを過ぎたら "Miss"
        if (noteTop > judgeLineY) {
            showJudge("MISS");
            combo = 0;
            notesToRemove.push(note);
            note.element.remove();
        }
    }
    
    // 削除リストに基づいてノーツを削除
    notes = notes.filter(note => !notesToRemove.includes(note));
    comboValue.textContent = combo;

    // ゲーム終了判定
    if (beatmapIndex >= beatmap.length && notes.length === 0) {
        cancelAnimationFrame(gameTimer);
        startButton.disabled = false;
        alert(`ゲーム終了！ スコア: ${score}`);
    } else {
        gameTimer = requestAnimationFrame(gameLoop);
    }
}

function createNote(laneIndex) {
    const note = {
        element: document.createElement('div'),
        lane: laneIndex,
        speed: noteSpeed,
        hit: false // 叩かれたかどうか
    };
    note.element.className = 'note';
    note.element.style.left = `${laneIndex * 100 + 1}px`; // 1pxは枠線分
    gameArea.appendChild(note.element);
    notes.push(note);
}

// 3. キー入力処理
document.addEventListener('keydown', e => {
    if (keyMap.hasOwnProperty(e.key)) {
        const laneIndex = keyMap[e.key];
        checkHit(laneIndex);
        // ターゲットを光らせる
        targets[laneIndex].classList.add('active');
    }
});

document.addEventListener('keyup', e => {
    if (keyMap.hasOwnProperty(e.key)) {
        const laneIndex = keyMap[e.key];
        // 光を消す
        targets[laneIndex].classList.remove('active');
    }
});

function checkHit(laneIndex) {
    // 判定ラインのY座標 (600 - 50 - 50 = 500) から (600 - 50 = 550) の範囲
    const judgeTop = gameArea.clientHeight - targets[0].offsetTop - targets[0].clientHeight;
    const judgeBottom = gameArea.clientHeight - targets[0].offsetTop;

    // Perfect判定の許容範囲 (例: ±30px)
    const perfectRange = 30;

    let hitNote = null;
    
    // そのレーンで一番判定ラインに近いノーツを探す
    for (const note of notes) {
        if (note.lane === laneIndex && !note.hit) {
            const noteTop = note.element.offsetTop;
            const noteBottom = noteTop + note.element.clientHeight;

            // 判定エリアに入っているか
            if (noteBottom > judgeTop && noteTop < judgeBottom) {
                hitNote = note;
                break; // 一番手前のノーツだけ判定
            }
        }
    }

    if (hitNote) {
        const noteCenter = hitNote.element.offsetTop + (hitNote.element.clientHeight / 2);
        const judgeCenter = judgeBottom - (targets[0].clientHeight / 2);
        const diff = Math.abs(noteCenter - judgeCenter);

        if (diff <= perfectRange) {
            showJudge("PERFECT");
            score += 100;
            combo++;
        } else {
            showJudge("GOOD");
            score += 50;
            combo++;
        }
        
        hitNote.hit = true; // 多重判定を防ぐ
        hitNote.element.remove(); // ノーツを消す
        notes = notes.filter(n => n !== hitNote); // リストから削除

        scoreValue.textContent = score;
        comboValue.textContent = combo;
    }
}

function showJudge(text) {
    judgeText.textContent = text;
    judgeText.style.opacity = 1;
    // 0.5秒後にフェードアウト
    setTimeout(() => {
        judgeText.style.opacity = 0;
    }, 500);
}
