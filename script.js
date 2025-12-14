// サンプル問題データ（本来はデータベースから取得しますが、今はここに書きます）
const allQuestions = [
    {
        id: 1,
        category: "教職教養",
        prefecture: "東京都",
        text: "日本国憲法第26条において、すべて国民は、法律の定めるところにより、その能力に応じて、ひとしく何を受ける権利を有するか。",
        options: ["教育", "生活保護", "勤労の機会", "財産権"],
        answer: 0, // 0番目(教育)が正解
        explanation: "正解は「教育」です。日本国憲法第26条第1項の規定です。"
    },
    {
        id: 2,
        category: "教職教養",
        prefecture: "大阪府",
        text: "学習指導要領の法的拘束力について、判例（伝習館高校事件）はどのように解しているか。",
        options: ["法的拘束力はない", "大綱的基準としての法的拘束力がある", "完全な法的拘束力がある", "単なる助言に過ぎない"],
        answer: 1,
        explanation: "最高裁は、学習指導要領には「大綱的基準」としての法的拘束力があるとしています。"
    },
    {
        id: 3,
        category: "一般教養",
        prefecture: "北海道",
        text: "次のうち、夏目漱石の作品ではないものはどれか。",
        options: ["こころ", "坊っちゃん", "舞姫", "吾輩は猫である"],
        answer: 2,
        explanation: "「舞姫」は森鴎外の作品です。"
    }
];

let currentQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongQuestions = []; // 間違えた問題を保存するリスト

// 画面切り替え用関数
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// 出題開始ボタン
function startQuiz() {
    // 選択されたチェックボックスの値を取得
    const selectedCats = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(e => e.value);
    const selectedPrefs = Array.from(document.querySelectorAll('input[name="prefecture"]:checked')).map(e => e.value);

    // 条件に合う問題を抽出
    currentQuestions = allQuestions.filter(q => 
        selectedCats.includes(q.category) && selectedPrefs.includes(q.prefecture)
    );

    if (currentQuestions.length === 0) {
        alert("条件に合う問題がありませんでした。");
        return;
    }

    // 変数を初期化
    currentIndex = 0;
    correctCount = 0;
    wrongQuestions = [];
    
    // クイズ画面へ
    showScreen('quiz-screen');
    loadQuestion();
}

// 問題を表示する
function loadQuestion() {
    const q = currentQuestions[currentIndex];
    
    // 画面表示の更新
    document.getElementById('remaining-count').textContent = currentQuestions.length - currentIndex;
    const rate = currentIndex === 0 ? 0 : Math.round((correctCount / currentIndex) * 100);
    document.getElementById('current-accuracy').textContent = rate;

    document.getElementById('q-pref').textContent = q.prefecture;
    document.getElementById('q-cat').textContent = q.category;
    document.getElementById('q-text').textContent = q.text;

    // 選択肢ボタンの生成
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // 前の選択肢を消す
    document.getElementById('feedback').classList.add('hidden'); // 解説を隠す

    q.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-btn';
        btn.onclick = () => checkAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

// 答え合わせ
function checkAnswer(selectedIndex, clickedBtn) {
    // ボタンを無効化（連打防止）
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    const q = currentQuestions[currentIndex];
    const isCorrect = selectedIndex === q.answer;

    if (isCorrect) {
        clickedBtn.classList.add('correct');
        document.getElementById('feedback-title').textContent = "正解！";
        document.getElementById('feedback-title').style.color = "green";
        correctCount++;
    } else {
        clickedBtn.classList.add('incorrect');
        // 正解のボタンも光らせる
        buttons[q.answer].classList.add('correct');
        document.getElementById('feedback-title').textContent = "不正解...";
        document.getElementById('feedback-title').style.color = "red";
        
        // 間違えた問題をリストに追加
        wrongQuestions.push(q);
    }

    document.getElementById('feedback-explanation').textContent = q.explanation;
    document.getElementById('feedback').classList.remove('hidden');
}

// 次の問題へ
function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}

// 結果表示
function showResult() {
    showScreen('result-screen');
    document.getElementById('result-correct').textContent = correctCount;
    document.getElementById('result-total').textContent = currentQuestions.length;
    document.getElementById('result-rate').textContent = Math.round((correctCount / currentQuestions.length) * 100);

    const retryBtn = document.getElementById('retry-btn');
    if (wrongQuestions.length > 0) {
        retryBtn.style.display = 'block';
    } else {
        retryBtn.style.display = 'none';
    }
}

// 間違えた問題だけ再挑戦
function retryWrong() {
    currentQuestions = [...wrongQuestions]; // 間違えた問題リストをコピーして現在の問題セットにする
    currentIndex = 0;
    correctCount = 0;
    wrongQuestions = []; // さらに間違えた場合のために空にする
    showScreen('quiz-screen');
    loadQuestion();
}