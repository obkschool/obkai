// متغيرات عامة للعبة
const API_KEY = "AIzaSyCrAicHcB2IUqkMS846--MFJo6u0UqKbII";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// حالة اللعبة
let gameState = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: [],
    isRevealed: false
};

let currentTopic = "";
let questionsCount = 10;
let difficultyLevel = "متوسط";
let soundEnabled = true;
let isGenerating = false;

// إضافة الأصوات للعبة
const sounds = {
    correct: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3'),
    wrong: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'),
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3'),
    start: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-level-music-689.mp3'),
    complete: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
    next: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3')
};

// العناصر في الصفحة
const topicInput = document.getElementById('topic-input');
const questionsCountSelect = document.getElementById('questions-count');
const difficultyLevelSelect = document.getElementById('difficulty-level');
const startQuizBtn = document.getElementById('start-quiz-btn');
const topicButtons = document.querySelectorAll('.topic-btn');
const loadingSection = document.getElementById('loading');
const loadingTopic = document.getElementById('loading-topic');
const topicSelection = document.getElementById('topic-selection');
const quizArea = document.getElementById('quiz-area');
const resultsSection = document.getElementById('results');
const reviewSection = document.getElementById('review');
const questionNumber = document.getElementById('question-number');
const currentTopicDisplay = document.getElementById('current-topic');
const currentScoreDisplay = document.getElementById('current-score');
const progressBar = document.getElementById('progress-bar');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const backToTopicsBtn = document.getElementById('back-to-topics-btn');
const finalScorePercentage = document.getElementById('final-score-percentage');
const correctAnswers = document.getElementById('correct-answers');
const totalQuestions = document.getElementById('total-questions');
const performanceTitle = document.getElementById('performance-title');
const performanceMessage = document.getElementById('performance-message');
const reviewAnswersBtn = document.getElementById('review-answers-btn');
const newQuizBtn = document.getElementById('new-quiz-btn');
const reviewContainer = document.getElementById('review-container');
const backToResultsBtn = document.getElementById('back-to-results-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log("تم تحميل صفحة الاختبار");
    
    // تحميل الأصوات مسبقًا
    preloadSounds();
    
    // إضافة مستمعات الأحداث
    setupEventListeners();
    
    // تعيين السمة المظلمة/الفاتحة من التخزين المحلي
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    document.body.classList.toggle("light-theme", isLightTheme);
    themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">${isLightTheme ? 'dark_mode' : 'light_mode'}</span>`;
    
    // تعيين حالة الصوت من التخزين المحلي
    soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    soundToggleBtn.innerHTML = `<span class="material-symbols-rounded">${soundEnabled ? 'volume_up' : 'volume_off'}</span>`;
});

// إضافة مستمعات الأحداث
function setupEventListeners() {
    // إعداد أزرار التحكم
    setupControlButtons();
    
    // إعداد زر العودة للمواضيع
    setupReturnButton();
    
    // إعداد زر السؤال التالي
    setupNextButton();
    
    // أزرار المواضيع
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound('click');
            const topic = button.dataset.topic;
            startQuiz(topic);
        });
    });
    
    // زر بدء الاختبار المخصص
    startQuizBtn.addEventListener('click', () => {
        playSound('click');
        const topic = topicInput.value.trim();
        if (topic) {
            questionsCount = parseInt(questionsCountSelect.value);
            difficultyLevel = difficultyLevelSelect.value;
            startQuiz(topic);
        } else {
            showNotification('الرجاء إدخال موضوع للاختبار', 'error');
        }
    });
    
    // زر العودة للمواضيع
    backToTopicsBtn.addEventListener('click', () => {
        playSound('click');
        resetQuiz();
    });
    
    // زر مراجعة الإجابات
    document.getElementById('review-answers-btn').addEventListener('click', () => {
        playSound('click');
        showReview();
    });
    
    // زر العودة للنتائج
    document.getElementById('back-to-results-btn').addEventListener('click', () => {
        playSound('click');
        reviewSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        showNotification('تم العودة إلى صفحة النتائج', 'success');
    });
    
    // زر إعادة الاختبار
    document.getElementById('retry-quiz-btn').addEventListener('click', () => {
        playSound('click');
        retryQuiz();
    });
}

// تحسين أزرار التحكم
function setupControlButtons() {
    // زر تبديل السمة
    themeToggleBtn.setAttribute('data-tooltip', 'تغيير السمة');
    themeToggleBtn.addEventListener('click', () => {
        playSound('click');
        const isLightTheme = document.body.classList.toggle('light-theme');
        themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">${isLightTheme ? 'dark_mode' : 'light_mode'}</span>`;
        localStorage.setItem('themeColor', isLightTheme ? 'light_mode' : 'dark_mode');
        
        // تحديث حالة الزر النشط
        themeToggleBtn.classList.toggle('active', isLightTheme);
    });
    
    // زر تبديل الصوت
    soundToggleBtn.setAttribute('data-tooltip', 'تشغيل/إيقاف الصوت');
    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggleBtn.innerHTML = `<span class="material-symbols-rounded">${soundEnabled ? 'volume_up' : 'volume_off'}</span>`;
        localStorage.setItem('soundEnabled', soundEnabled);
        
        // تشغيل صوت النقر إذا كان الصوت مفعلاً
        if (soundEnabled) {
            playSound('click');
        }
        
        // تحديث حالة الزر النشط
        soundToggleBtn.classList.toggle('active', soundEnabled);
    });
    
    // تعيين الحالة الأولية للأزرار
    const isLightTheme = localStorage.getItem('themeColor') === 'light_mode';
    document.body.classList.toggle('light-theme', isLightTheme);
    themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">${isLightTheme ? 'dark_mode' : 'light_mode'}</span>`;
    themeToggleBtn.classList.toggle('active', isLightTheme);
    
    soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    soundToggleBtn.innerHTML = `<span class="material-symbols-rounded">${soundEnabled ? 'volume_up' : 'volume_off'}</span>`;
    soundToggleBtn.classList.toggle('active', soundEnabled);
}

// تحسين زر العودة للمواضيع
function setupReturnButton() {
    const returnButtons = document.querySelectorAll('.return-to-topics');
    returnButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound('click');
            resetQuiz();
        });
    });
}

// تحسين زر السؤال التالي
function setupNextButton() {
    nextBtn.addEventListener('click', () => {
        // التحقق من اختيار إجابة قبل الانتقال للسؤال التالي
        if (gameState.userAnswers[gameState.currentQuestionIndex] === null && !gameState.isRevealed) {
            showNotification('الرجاء اختيار إجابة قبل الانتقال للسؤال التالي', 'warning');
            return;
        }
        
        // إذا لم يتم الكشف عن الإجابة بعد، اكشف عنها أولاً
        if (!gameState.isRevealed) {
            revealAnswer();
            
            // تغيير نص الزر إلى "السؤال التالي"
            nextBtn.textContent = gameState.currentQuestionIndex === gameState.questions.length - 1 
                ? 'عرض النتائج' 
                : 'السؤال التالي';
                
            return;
        }
        
        // تشغيل صوت الانتقال
        playSound('next');
        
        // إعادة تعيين حالة الكشف
        gameState.isRevealed = false;
        
        // إذا كان هذا هو السؤال الأخير، انتقل إلى شاشة النتائج
        if (gameState.currentQuestionIndex === gameState.questions.length - 1) {
            showResults();
            return;
        }
        
        // الانتقال إلى السؤال التالي
        gameState.currentQuestionIndex++;
        
        // إعادة تعيين نص الزر
        nextBtn.textContent = 'تحقق من الإجابة';
        nextBtn.disabled = gameState.userAnswers[gameState.currentQuestionIndex] === null;
        
        // تحديث واجهة الاختبار
        updateQuizUI();
    });
}

// تحديث واجهة الاختبار
function updateQuizUI() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    
    // إخفاء الخيارات أثناء تحميل السؤال
    optionsContainer.style.opacity = "0";
    
    // تحديث رقم السؤال
    questionNumber.textContent = `${gameState.currentQuestionIndex + 1}/${gameState.questions.length}`;
    
    // تحديث شريط التقدم
    const progressPercentage = ((gameState.currentQuestionIndex) / gameState.questions.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    
    // تحديث نص السؤال
    questionText.textContent = currentQuestion.question;
    
    // إنشاء خيارات الإجابة
    optionsContainer.innerHTML = '';
    currentQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        // تأخير ظهور الخيارات للحصول على تأثير متدرج
        optionElement.style.opacity = "0";
        optionElement.style.transform = "translateY(20px)";
        
        // إضافة مستمع الحدث للخيار
        optionElement.addEventListener('click', () => {
            playSound('click');
            selectOption(index);
        });
        
        optionsContainer.appendChild(optionElement);
    });
    
    // إظهار الخيارات بعد تحميل السؤال بالكامل
    setTimeout(() => {
        optionsContainer.style.opacity = "1";
        
        // تطبيق تأثير الظهور المتدرج على كل خيار
        const options = optionsContainer.querySelectorAll('.option');
        options.forEach((option, index) => {
            setTimeout(() => {
                option.style.opacity = "1";
                option.style.transform = "translateY(0)";
            }, 100 * index);
        });
    }, 300);
    
    // تحديث حالة الخيار المحدد إذا كان المستخدم قد اختار إجابة بالفعل
    const userAnswer = gameState.userAnswers[gameState.currentQuestionIndex];
    if (userAnswer !== null) {
        setTimeout(() => {
            const options = optionsContainer.querySelectorAll('.option');
            options[userAnswer].classList.add('selected');
            nextBtn.disabled = false;
        }, 350);
    } else {
        nextBtn.disabled = true;
    }
    
    // تحديث نص زر التالي
    nextBtn.textContent = 'تحقق من الإجابة';
}

// الكشف عن الإجابة الصحيحة
function revealAnswer() {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const userAnswer = gameState.userAnswers[gameState.currentQuestionIndex];
    const correctIndex = currentQuestion.correctIndex;
    
    // تحديث حالة الكشف
    gameState.isRevealed = true;
    
    // تحديث واجهة الخيارات
    const options = optionsContainer.querySelectorAll('.option');
    
    // إضافة الفئات المناسبة للخيارات
    options[correctIndex].classList.add('correct');
    
    if (userAnswer !== correctIndex && userAnswer !== null) {
        options[userAnswer].classList.add('wrong');
    }
    
    // تحديث النتيجة
    if (userAnswer === correctIndex) {
        gameState.score++;
        currentScoreDisplay.textContent = gameState.score;
        playSound('correct');
        showNotification('إجابة صحيحة! أحسنت.', 'success');
    } else {
        playSound('wrong');
        showNotification('إجابة خاطئة. حاول مرة أخرى في السؤال التالي.', 'error');
    }
    
    // تحديث نص زر التالي
    nextBtn.textContent = gameState.currentQuestionIndex === gameState.questions.length - 1 
        ? 'عرض النتائج' 
        : 'السؤال التالي';
}

// تحسين وظيفة اختيار الإجابة
function selectOption(index) {
    // إذا تم الكشف عن الإجابة بالفعل، لا تسمح باختيار خيار آخر
    if (gameState.isRevealed) return;
    
    // تحديث إجابة المستخدم
    gameState.userAnswers[gameState.currentQuestionIndex] = index;
    
    // تحديث واجهة الخيارات
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    options[index].classList.add('selected');
    
    // تفعيل زر التالي
    nextBtn.disabled = false;
    
    // عرض إشعار تأكيد الاختيار
    const optionText = options[index].textContent.substring(0, 30) + (options[index].textContent.length > 30 ? '...' : '');
    showNotification(`تم اختيار: ${optionText}`, 'success', 'تم الاختيار');
}

// تحميل الأصوات مسبقًا
function preloadSounds() {
    for (const sound in sounds) {
        sounds[sound].load();
        sounds[sound].volume = 0.5; // ضبط مستوى الصوت
    }
}

// تشغيل الصوت
function playSound(soundName) {
    if (!soundEnabled) return;
    
    if (sounds[soundName]) {
        sounds[soundName].play().catch(e => console.error("خطأ في تشغيل الصوت:", e));
    }
}

// بدء الاختبار
async function startQuiz(topic) {
    currentTopic = topic;
    loadingTopic.textContent = topic;
    
    // إظهار شاشة التحميل
    topicSelection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    
    try {
        // توليد الأسئلة
        const questions = await generateQuizQuestions(topic, questionsCount, difficultyLevel);
        
        if (questions.length === 0) {
            throw new Error("لم يتم توليد أسئلة");
        }
        
        // تحديث حالة اللعبة
        gameState.questions = questions;
        gameState.currentQuestionIndex = 0;
        gameState.score = 0;
        gameState.userAnswers = Array(questions.length).fill(null);
        gameState.isRevealed = false;
        
        // إظهار منطقة الاختبار
        loadingSection.classList.add('hidden');
        quizArea.classList.remove('hidden');
        
        // تحديث واجهة المستخدم
        updateQuizUI();
        
        // تحديث معلومات الاختبار
        currentTopicDisplay.textContent = topic;
        questionNumber.textContent = `1/${questions.length}`;
        currentScoreDisplay.textContent = "0";
        
        // تشغيل صوت بدء الاختبار
        playSound('start');
        
    } catch (error) {
        console.error("خطأ في بدء الاختبار:", error);
        alert("حدث خطأ أثناء إنشاء الاختبار. الرجاء المحاولة مرة أخرى.");
        loadingSection.classList.add('hidden');
        topicSelection.classList.remove('hidden');
    }
}

// إظهار النتائج
function showResults() {
    quizArea.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    const totalCorrect = gameState.userAnswers.filter((answer, index) => 
        answer === gameState.questions[index].correctIndex
    ).length;
    
    const percentage = Math.round((totalCorrect / gameState.questions.length) * 100);
    
    finalScorePercentage.textContent = `${percentage}%`;
    correctAnswers.textContent = totalCorrect;
    totalQuestions.textContent = gameState.questions.length;
    
    // تحديد رسالة الأداء
    if (percentage >= 90) {
        performanceTitle.textContent = "ممتاز!";
        performanceMessage.textContent = "أداء رائع! لديك فهم عميق لهذا الموضوع.";
    } else if (percentage >= 70) {
        performanceTitle.textContent = "جيد جداً!";
        performanceMessage.textContent = "أداء جيد جداً! تحتاج فقط إلى بعض التحسينات البسيطة.";
    } else if (percentage >= 50) {
        performanceTitle.textContent = "جيد";
        performanceMessage.textContent = "أداء جيد، ولكن هناك مجال للتحسين.";
    } else {
        performanceTitle.textContent = "تحتاج إلى تحسين";
        performanceMessage.textContent = "لا بأس، يمكنك دائماً المحاولة مرة أخرى والتحسن!";
    }
    
    playSound('complete');
}

// إظهار مراجعة الإجابات
function showReview() {
    resultsSection.classList.add('hidden');
    reviewSection.classList.remove('hidden');
    
    reviewContainer.innerHTML = '';
    
    gameState.questions.forEach((question, index) => {
        const userAnswer = gameState.userAnswers[index];
        const isCorrect = userAnswer === question.correctIndex;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'review-question';
        questionDiv.textContent = `${index + 1}. ${question.question}`;
        
        const answerDiv = document.createElement('div');
        answerDiv.className = 'review-answer';
        
        const userAnswerSpan = document.createElement('span');
        userAnswerSpan.className = `answer-text ${isCorrect ? 'correct' : 'wrong'}`;
        userAnswerSpan.textContent = userAnswer !== null ? 
            `إجابتك: ${question.options[userAnswer]}` : 
            'لم تجب على هذا السؤال';
        
        if (!isCorrect && userAnswer !== null) {
            const correctAnswerSpan = document.createElement('span');
            correctAnswerSpan.className = 'answer-text correct';
            correctAnswerSpan.textContent = `الإجابة الصحيحة: ${question.options[question.correctIndex]}`;
            answerDiv.appendChild(correctAnswerSpan);
        }
        
        answerDiv.appendChild(userAnswerSpan);
        reviewItem.appendChild(questionDiv);
        reviewItem.appendChild(answerDiv);
        reviewContainer.appendChild(reviewItem);
    });
}

// توليد أسئلة الاختبار
async function generateQuizQuestions(topic, count, difficulty) {
    if (isGenerating) return [];
    isGenerating = true;
    
    try {
        const prompt = `
        أنشئ ${count} أسئلة اختيار من متعدد عن موضوع "${topic}" بمستوى صعوبة "${difficulty}".
        
        لكل سؤال، قدم 4 خيارات مع تحديد الإجابة الصحيحة.
        
        قم بتنسيق الإجابة بالشكل التالي:
        
        [
          {
            "question": "نص السؤال هنا؟",
            "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
            "correctIndex": 0
          }
        ]
        
        ملاحظة: correctIndex هو رقم الخيار الصحيح (0 للخيار الأول، 1 للخيار الثاني، إلخ).
        قدم الإجابة بتنسيق JSON فقط بدون أي نص إضافي.
        `;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالذكاء الاصطناعي: ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        // استخراج JSON من النص
        const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
        if (!jsonMatch) {
            throw new Error("لم يتم العثور على بيانات JSON صالحة في الاستجابة");
        }
        
        const jsonText = jsonMatch[0];
        const questions = JSON.parse(jsonText);
        
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("تنسيق الأسئلة غير صحيح");
        }
        
        return questions;
    } catch (error) {
        console.error("خطأ في توليد أسئلة الاختبار:", error);
        
        // إنشاء أسئلة افتراضية في حالة الفشل
        return generateDefaultQuestions(topic, count);
    } finally {
        isGenerating = false;
    }
}

// توليد أسئلة افتراضية في حالة فشل API
function generateDefaultQuestions(topic, count) {
    const questions = [];
    
    // أسئلة افتراضية حسب الموضوع
    if (topic.includes("رياضيات") || topic.includes("حساب")) {
        questions.push(
            {
                question: "ما هو ناتج 5 × 7؟",
                options: ["25", "35", "30", "40"],
                correctIndex: 1
            },
            {
                question: "ما هو ناتج 12 + 8؟",
                options: ["18", "20", "22", "24"],
                correctIndex: 1
            },
            {
                question: "ما هو ناتج 36 ÷ 4؟",
                options: ["6", "8", "9", "12"],
                correctIndex: 2
            }
        );
    } else if (topic.includes("تاريخ") || topic.includes("إسلامي")) {
        questions.push(
            {
                question: "في أي عام كانت الهجرة النبوية؟",
                options: ["622 م", "632 م", "610 م", "630 م"],
                correctIndex: 0
            },
            {
                question: "من هو أول خليفة للمسلمين؟",
                options: ["عمر بن الخطاب", "أبو بكر الصديق", "عثمان بن عفان", "علي بن أبي طالب"],
                correctIndex: 1
            },
            {
                question: "في أي معركة انتصر المسلمون رغم قلة عددهم؟",
                options: ["معركة أحد", "معركة بدر", "معركة حنين", "معركة الخندق"],
                correctIndex: 1
            }
        );
    } else {
        // أسئلة افتراضية لأي موضوع آخر
        for (let i = 1; i <= count; i++) {
            questions.push({
                question: `سؤال ${i} عن ${topic}؟`,
                options: [
                    `الخيار الأول للسؤال ${i}`,
                    `الخيار الثاني للسؤال ${i}`,
                    `الخيار الثالث للسؤال ${i}`,
                    `الخيار الرابع للسؤال ${i}`
                ],
                correctIndex: Math.floor(Math.random() * 4)
            });
        }
    }
    
    // التأكد من أن عدد الأسئلة يساوي العدد المطلوب
    while (questions.length > count) {
        questions.pop();
    }
    
    while (questions.length < count) {
        const index = questions.length + 1;
        questions.push({
            question: `سؤال ${index} عن ${topic}؟`,
            options: [
                `الخيار الأول للسؤال ${index}`,
                `الخيار الثاني للسؤال ${index}`,
                `الخيار الثالث للسؤال ${index}`,
                `الخيار الرابع للسؤال ${index}`
            ],
            correctIndex: Math.floor(Math.random() * 4)
        });
    }
    
    return questions;
} 