// ▼▼▼ ここを先ほどメモした自分のものに書き換えてください ▼▼▼
// （例: const SUPABASE_URL = 'https://abcdefg.supabase.co';）
const SUPABASE_URL = 'https://wgvcgzeaqtrteolxsplj.supabase.co'; 

// （例: const SUPABASE_KEY = 'eyJh...';）
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndmNnemVhcXRydGVvbHhzcGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODEyMTEsImV4cCI6MjA4MTg1NzIxMX0.pYCOptVf_AR7qs1vzshnhPes80f6p8WD3yopSS1t_6s'; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


// データベースから問題を取得する関数
async function fetchQuestions(categories, prefectures) {
    // URLを作成（条件を指定してデータを取るための魔法のURL）
    let url = `${SUPABASE_URL}/rest/v1/questions?select=*`;
    
    // カテゴリ: A or B (カンマ区切りで指定)
    if (categories.length > 0) {
        // "in" フィルタを使うための形式: ("教職教養","一般教養")
        const catStr = categories.map(c => `"${c}"`).join(',');
        url += `&category=in.(${catStr})`;
    }
    
    // 都道府県: A or B
    if (prefectures.length > 0) {
        const prefStr = prefectures.map(p => `"${p}"`).join(',');
        url += `&prefecture=in.(${prefStr})`;
    }

    // データを取得
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            console.error("データ取得エラー:", response.statusText);
            alert("問題の読み込みに失敗しました。URLかキーが間違っている可能性があります。");
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("通信エラー:", error);
        alert("通信エラーが発生しました。");
        return [];
    }
}

// --- 以下、クイズの基本動作 ---

let currentQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongQuestions = [];

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ★ここが変わりました：非同期処理（async/await）になりました
// 出題開始ボタンを押したときの処理
async function startQuiz() {
    const startBtn = document.querySelector('#start-screen button');
    
    // チェックボックスの状態を取得
    const selectedCats = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(e => e.value);
    const selectedPrefs = Array.from(document.querySelectorAll('input[name="prefecture"]:checked')).map(e => e.value);

    // ★追加した部分：もしチェックがゼロなら、ここで止める
    if (selectedCats.length === 0) {
        alert("カテゴリーを少なくとも1つ選択してください。");
        return;
    }
    if (selectedPrefs.length === 0) {
        alert("都道府県を少なくとも1つ選択してください。");
        return;
    }

    // ここから下は今までと同じですが、ボタンの制御を微調整しました
    startBtn.disabled = true;
    startBtn.textContent = "問題を読み込み中...";

    // データベースから問題を取ってくる
    currentQuestions = await fetchQuestions(selectedCats, selectedPrefs);

    startBtn.disabled = false;
    startBtn.textContent = "出題開始";

    if (currentQuestions.length === 0) {
        alert("条件に合う問題がまだ登録されていません。");
        return;
    }

    currentIndex = 0;
    correctCount = 0;
    wrongQuestions = [];
    
    showScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    const q = currentQuestions[currentIndex];
    
    document.getElementById('remaining-count').textContent = currentQuestions.length - currentIndex;
    const rate = currentIndex === 0 ? 0 : Math.round((correctCount / currentIndex) * 100);
    document.getElementById('current-accuracy').textContent = rate;

    // ★ここを追加しました：年度を表示する処理
    // もし年度データがあれば「2024年度」のように表示、なければ空欄にする
    const yearText = q.year ? `${q.year}年度` : '-'; 
    document.getElementById('q-year').textContent = yearText;

    document.getElementById('q-pref').textContent = q.prefecture;
    document.getElementById('q-cat').textContent = q.category;
    document.getElementById('q-text').textContent = q.text;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    document.getElementById('feedback').classList.add('hidden');

    q.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-btn';
        btn.onclick = () => checkAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedIndex, clickedBtn) {
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
        buttons[q.answer].classList.add('correct');
        document.getElementById('feedback-title').textContent = "不正解...";
        document.getElementById('feedback-title').style.color = "red";
        wrongQuestions.push(q);
    }

    document.getElementById('feedback-explanation').textContent = q.explanation;
    document.getElementById('feedback').classList.remove('hidden');
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    showScreen('result-screen');
    document.getElementById('result-correct').textContent = correctCount;
    document.getElementById('result-total').textContent = currentQuestions.length;
    
    // 0で割るエラーを防ぐ
    const total = currentQuestions.length;
    const rate = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    document.getElementById('result-rate').textContent = rate;

    const retryBtn = document.getElementById('retry-btn');
    if (wrongQuestions.length > 0) {
        retryBtn.style.display = 'block';
    } else {
        retryBtn.style.display = 'none';
    }
}

function retryWrong() {
    currentQuestions = [...wrongQuestions];
    currentIndex = 0;
    correctCount = 0;
    wrongQuestions = [];
    showScreen('quiz-screen');
    loadQuestion();
}