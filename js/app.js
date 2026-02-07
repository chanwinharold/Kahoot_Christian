/**
 * APP.JS - Logique principale de l'application
 * Gère l'interface utilisateur et la coordination entre les modules
 */

// Variables globales
let quizManager, gameEngine, connectionManager;
let currentQuiz = null;
let isHost = false;
let playerId = null;
let playerNickname = null;
let questionTimer = null;

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application démarrée');

    // Détecter la page actuelle
    const path = window.location.pathname;

    if (path.includes('host.html')) {
        initHostPage();
    } else if (path.includes('player.html')) {
        initPlayerPage();
    }
});

/* ============================================
   PAGE ANIMATEUR
   ============================================ */

function initHostPage() {
    console.log('Initialisation page animateur');
    isHost = true;

    // Initialiser les gestionnaires
    quizManager = new QuizManager();
    gameEngine = new GameEngine();
    connectionManager = new ConnectionManager();

    // Charger le quiz de démo si nécessaire
    quizManager.loadDemoQuizIfNeeded();

    // Afficher la liste des quiz
    displayQuizList();

    // Event listeners
    setupHostEventListeners();

    // Mode sombre
    setupDarkMode('toggleTheme');
}

function setupHostEventListeners() {
    // Boutons navigation
    document.getElementById('btnNewQuiz')?.addEventListener('click', createNewQuiz);
    document.getElementById('btnImportQuiz')?.addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput')?.addEventListener('change', importQuizFile);
    document.getElementById('btnBackToList')?.addEventListener('click', () => showSection('quizListSection'));
    document.getElementById('btnBackToListFromLobby')?.addEventListener('click', () => {
        connectionManager.disconnect();
        showSection('quizListSection');
    });
    document.getElementById('btnBackToListFromPodium')?.addEventListener('click', () => {
        connectionManager.disconnect();
        gameEngine.reset();
        showSection('quizListSection');
    });

    // Éditeur de quiz
    document.getElementById('btnSaveQuiz')?.addEventListener('click', saveQuiz);
    document.getElementById('btnAddQuestion')?.addEventListener('click', addQuestion);

    // Jeu
    document.getElementById('btnStartGame')?.addEventListener('click', startGame);
    document.getElementById('btnNextQuestion')?.addEventListener('click', showNextQuestionOrResults);
    document.getElementById('btnContinueFromLeaderboard')?.addEventListener('click', showNextQuestionOrResults);
    document.getElementById('btnNewGame')?.addEventListener('click', () => {
        connectionManager.disconnect();
        gameEngine.reset();
        showSection('quizListSection');
    });
}

function displayQuizList() {
    const quizList = document.getElementById('quizList');
    const allQuiz = quizManager.getAllQuiz();

    if (allQuiz.length === 0) {
        quizList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p>Aucun quiz disponible</p>
                <p>Créez votre premier quiz ou importez-en un</p>
            </div>
        `;
        return;
    }

    quizList.innerHTML = allQuiz.map(quiz => `
        <div class="quiz-card">
            <div class="quiz-card-header">
                <h3>${quiz.title}</h3>
            </div>
            <div class="quiz-info">
                ${quiz.questions.length} question(s)
            </div>
            <div class="quiz-card-actions">
                <button class="btn btn-primary" onclick="launchQuiz('${quiz.id}')">▶ Lancer</button>
                <button class="btn btn-secondary" onclick="editQuiz('${quiz.id}')">✏ Éditer</button>
                <button class="btn btn-secondary" onclick="exportQuiz('${quiz.id}')">📥 Exporter</button>
                <button class="btn btn-danger" onclick="deleteQuiz('${quiz.id}')">🗑 Supprimer</button>
            </div>
        </div>
    `).join('');
}

function createNewQuiz() {
    currentQuiz = quizManager.createEmptyQuiz();
    document.getElementById('quizTitle').value = '';
    document.getElementById('questionsList').innerHTML = '';
    document.getElementById('editorTitle').textContent = 'Nouveau Quiz';
    showSection('quizEditorSection');
}

function editQuiz(quizId) {
    currentQuiz = quizManager.getQuizById(quizId);
    if (!currentQuiz) return;

    document.getElementById('quizTitle').value = currentQuiz.title;
    document.getElementById('editorTitle').textContent = 'Éditer Quiz';
    displayQuestions();
    showSection('quizEditorSection');
}

function displayQuestions() {
    const questionsList = document.getElementById('questionsList');
    if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
        questionsList.innerHTML = '<p class="text-center">Aucune question. Ajoutez-en une!</p>';
        return;
    }

    questionsList.innerHTML = currentQuiz.questions.map((q, index) => `
        <div class="question-card" data-index="${index}">
            <div class="question-card-header">
                <span class="question-number-badge">Question ${index + 1}</span>
                <div class="question-actions">
                    <button class="btn btn-sm btn-danger" onclick="removeQuestion(${index})">🗑 Supprimer</button>
                </div>
            </div>
            <div class="form-group">
                <label>Question</label>
                <input type="text" value="${q.question}" onchange="updateQuestion(${index}, 'question', this.value)">
            </div>
            <div class="form-group">
                <label>Réponses</label>
                <div class="answers-editor">
                    ${q.answers.map((a, aIndex) => `
                        <div class="answer-item">
                            <input type="radio" name="correct-${index}" ${a.isCorrect ? 'checked' : ''}
                                   onchange="setCorrectAnswer(${index}, ${aIndex})">
                            <input type="text" value="${a.text}"
                                   onchange="updateAnswer(${index}, ${aIndex}, this.value)"
                                   placeholder="Réponse ${aIndex + 1}">
                            ${q.answers.length > 2 ? `<button class="btn btn-sm btn-danger" onclick="removeAnswer(${index}, ${aIndex})">✕</button>` : ''}
                        </div>
                    `).join('')}
                </div>
                ${q.answers.length < 4 ? `<button class="btn btn-sm btn-secondary mt-1" onclick="addAnswer(${index})">+ Ajouter réponse</button>` : ''}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Temps limite (secondes)</label>
                    <input type="number" min="10" max="60" value="${q.timeLimit || 30}"
                           onchange="updateQuestion(${index}, 'timeLimit', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>Référence biblique (optionnel)</label>
                    <input type="text" value="${q.reference || ''}"
                           onchange="updateQuestion(${index}, 'reference', this.value)"
                           placeholder="Ex: Jean 6:9">
                </div>
            </div>
        </div>
    `).join('');
}

function addQuestion() {
    if (!currentQuiz.questions) currentQuiz.questions = [];
    currentQuiz.questions.push(quizManager.createEmptyQuestion());
    displayQuestions();
}

function removeQuestion(index) {
    if (confirm('Supprimer cette question?')) {
        currentQuiz.questions.splice(index, 1);
        displayQuestions();
    }
}

function updateQuestion(index, field, value) {
    currentQuiz.questions[index][field] = value;
}

function updateAnswer(questionIndex, answerIndex, value) {
    currentQuiz.questions[questionIndex].answers[answerIndex].text = value;
}

function setCorrectAnswer(questionIndex, answerIndex) {
    currentQuiz.questions[questionIndex].answers.forEach((a, i) => {
        a.isCorrect = (i === answerIndex);
    });
}

function addAnswer(questionIndex) {
    const question = currentQuiz.questions[questionIndex];
    quizManager.addAnswerToQuestion(question);
    displayQuestions();
}

function removeAnswer(questionIndex, answerIndex) {
    const question = currentQuiz.questions[questionIndex];
    quizManager.removeAnswerFromQuestion(question, answerIndex);
    displayQuestions();
}

function saveQuiz() {
    currentQuiz.title = document.getElementById('quizTitle').value;

    const validation = quizManager.validateQuiz(currentQuiz);
    if (!validation.valid) {
        alert('Erreurs:\n' + validation.errors.join('\n'));
        return;
    }

    quizManager.saveQuiz(currentQuiz);
    alert('Quiz sauvegardé!');
    displayQuizList();
    showSection('quizListSection');
}

function deleteQuiz(quizId) {
    if (confirm('Supprimer ce quiz définitivement?')) {
        quizManager.deleteQuiz(quizId);
        displayQuizList();
    }
}

function exportQuiz(quizId) {
    quizManager.downloadQuiz(quizId);
}

function importQuizFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imported = quizManager.importQuiz(e.target.result);
        if (imported) {
            alert('Quiz importé avec succès!');
            displayQuizList();
        }
    };
    reader.readAsText(file);
}

function launchQuiz(quizId) {
    currentQuiz = quizManager.getQuizById(quizId);
    if (!currentQuiz) return;

    gameEngine.initGame(currentQuiz);

    const pin = ConnectionManager.generatePIN();
    document.getElementById('gamePin').textContent = pin;

    connectionManager.initHost(pin).then(() => {
        console.log('Lobby ouvert avec PIN:', pin);
        setupConnectionCallbacks();
        showSection('gameLobbySection');
        updateParticipantsList();
    }).catch(error => {
        alert('Erreur de connexion: ' + error.message);
    });
}

function setupConnectionCallbacks() {
    connectionManager.onPlayerJoined = (playerId, nickname) => {
        console.log('Joueur rejoint:', nickname);
        gameEngine.addPlayer(playerId, nickname);
        updateParticipantsList();

        // Activer le bouton de démarrage
        const btnStart = document.getElementById('btnStartGame');
        if (gameEngine.getPlayers().length > 0) {
            btnStart.disabled = false;
        }
    };

    connectionManager.onPlayerLeft = (playerId) => {
        console.log('Joueur parti:', playerId);
        gameEngine.removePlayer(playerId);
        updateParticipantsList();
    };

    connectionManager.onMessageReceived = (from, data) => {
        handleHostMessage(from, data);
    };
}

function handleHostMessage(from, data) {
    console.log('Message reçu:', data.type);

    if (data.type === 'answer') {
        const result = gameEngine.submitAnswer(from, data.answerIndex);

        // Envoyer le résultat au joueur
        connectionManager.sendToPlayer(from, {
            type: 'answerResult',
            result: result
        });

        // Mettre à jour les stats
        updateQuestionStats();
    }
}

function updateParticipantsList() {
    const players = gameEngine.getPlayers();
    document.getElementById('participantCount').textContent = players.length;

    const list = document.getElementById('participantsList');
    list.innerHTML = players.map(p => `
        <div class="participant-badge">${p.nickname}</div>
    `).join('');
}

function startGame() {
    if (!gameEngine.startGame()) {
        alert('Impossible de démarrer le jeu');
        return;
    }

    connectionManager.broadcastToPlayers({ type: 'gameStart' });
    showSection('gameControlSection');
    startQuestion();
}

function startQuestion() {
    const questionData = gameEngine.startQuestion();
    if (!questionData) return;

    // Afficher la question
    document.getElementById('currentQuestionNum').textContent = questionData.questionIndex + 1;
    document.getElementById('totalQuestions').textContent = questionData.totalQuestions;
    document.getElementById('currentQuestionText').textContent = questionData.question;

    // Référence biblique
    const refElement = document.getElementById('bibleReference');
    if (questionData.reference) {
        refElement.style.display = 'flex';
        document.getElementById('referenceText').textContent = questionData.reference;
    } else {
        refElement.style.display = 'none';
    }

    // Afficher les réponses
    const colors = ['red', 'blue', 'yellow', 'green'];
    document.getElementById('answersDisplay').innerHTML = questionData.answers.map((a, index) => `
        <div class="answer-box ${colors[index]}">${a.text}</div>
    `).join('');

    // Réinitialiser les stats
    document.getElementById('answeredCount').textContent = '0';
    document.getElementById('correctCount').textContent = '0';
    document.getElementById('incorrectCount').textContent = '0';
    document.getElementById('btnNextQuestion').style.display = 'none';

    // Envoyer la question aux joueurs
    connectionManager.broadcastToPlayers({
        type: 'question',
        data: questionData
    });

    // Démarrer le timer
    startQuestionTimer(questionData.timeLimit);
}

function startQuestionTimer(timeLimit) {
    let timeLeft = timeLimit;
    document.getElementById('timerText').textContent = timeLeft;

    const circle = document.getElementById('timerCircle');
    const circumference = 2 * Math.PI * 45;
    circle.style.strokeDasharray = circumference;

    questionTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timerText').textContent = timeLeft;

        const offset = circumference - (timeLeft / timeLimit) * circumference;
        circle.style.strokeDashoffset = offset;

        if (timeLeft <= 0) {
            endQuestion();
        }
    }, 1000);
}

function endQuestion() {
    clearInterval(questionTimer);

    // Afficher la bonne réponse
    const correctIndex = gameEngine.getCorrectAnswerIndex();
    const answerBoxes = document.querySelectorAll('.answer-box');
    if (answerBoxes[correctIndex]) {
        answerBoxes[correctIndex].classList.add('correct');
    }

    // Afficher le bouton suivant
    document.getElementById('btnNextQuestion').style.display = 'block';

    // Notifier les joueurs
    connectionManager.broadcastToPlayers({
        type: 'questionEnd',
        correctIndex: correctIndex
    });
}

function updateQuestionStats() {
    const stats = gameEngine.getQuestionStats();
    if (!stats) return;

    document.getElementById('answeredCount').textContent = stats.answeredCount;
    document.getElementById('correctCount').textContent = stats.correctCount;
    document.getElementById('incorrectCount').textContent = stats.incorrectCount;

    // Si tous ont répondu, terminer la question
    if (gameEngine.allPlayersAnswered()) {
        endQuestion();
    }
}

function showNextQuestionOrResults() {
    showSection('leaderboardSection');
    displayLeaderboard();

    // Envoyer le classement aux joueurs
    connectionManager.broadcastToPlayers({
        type: 'leaderboard',
        data: gameEngine.getLeaderboard()
    });

    // Vérifier s'il y a une prochaine question
    const hasNext = gameEngine.nextQuestion();

    const btnContinue = document.getElementById('btnContinueFromLeaderboard');
    btnContinue.textContent = hasNext ? 'Prochaine Question →' : 'Voir le Podium 🏆';

    btnContinue.onclick = () => {
        if (hasNext) {
            showSection('gameControlSection');
            startQuestion();
        } else {
            showPodium();
        }
    };
}

function displayLeaderboard() {
    const leaderboard = gameEngine.getLeaderboard();
    const list = document.getElementById('leaderboardList');

    list.innerHTML = leaderboard.map(player => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">${player.rank}</div>
            <div class="leaderboard-name">${player.nickname}</div>
            <div class="leaderboard-score">${player.score}</div>
        </div>
    `).join('');
}

function showPodium() {
    showSection('podiumSection');
    const podium = gameEngine.getPodium();

    // Remplir le podium
    [1, 2, 3].forEach(place => {
        const player = podium[place - 1];
        const element = document.getElementById(`podium${place}`);
        if (player) {
            element.querySelector('.player-name').textContent = player.nickname;
            element.querySelector('.player-score').textContent = player.score;
        } else {
            element.querySelector('.player-name').textContent = '-';
            element.querySelector('.player-score').textContent = '0';
        }
    });

    // Notifier les joueurs
    connectionManager.broadcastToPlayers({
        type: 'gameEnd',
        podium: podium
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
}

/* ============================================
   PAGE JOUEUR
   ============================================ */

function initPlayerPage() {
    console.log('Initialisation page joueur');
    isHost = false;

    connectionManager = new ConnectionManager();
    setupPlayerEventListeners();
    setupDarkMode('toggleThemePlayer');
}

function setupPlayerEventListeners() {
    document.getElementById('btnJoinGame')?.addEventListener('click', joinGame);
    document.getElementById('btnPlayAgain')?.addEventListener('click', () => {
        connectionManager.disconnect();
        location.reload();
    });
}

function joinGame() {
    const pin = document.getElementById('pinInput').value.trim();
    const nickname = document.getElementById('nicknameInput').value.trim();

    if (!ConnectionManager.isValidPIN(pin)) {
        showError('Code PIN invalide (6 chiffres requis)');
        return;
    }

    if (!nickname || nickname.length < 2) {
        showError('Pseudo invalide (minimum 2 caractères)');
        return;
    }

    document.getElementById('btnJoinGame').disabled = true;
    document.getElementById('btnJoinGame').textContent = 'Connexion...';

    connectionManager.joinAsPlayer(pin, nickname)
        .then(data => {
            playerId = data.playerId;
            playerNickname = data.nickname;
            console.log('Connecté en tant que:', playerNickname);

            document.getElementById('playerNickname').textContent = playerNickname;

            setupPlayerConnectionCallbacks();
            showPlayerSection('waitingSection');
        })
        .catch(error => {
            showError(error.message);
            document.getElementById('btnJoinGame').disabled = false;
            document.getElementById('btnJoinGame').textContent = 'Rejoindre';
        });
}

function setupPlayerConnectionCallbacks() {
    connectionManager.onMessageReceived = (from, data) => {
        handlePlayerMessage(data);
    };
}

function handlePlayerMessage(data) {
    console.log('Message reçu:', data.type);

    switch (data.type) {
        case 'gameStart':
            console.log('Le jeu commence!');
            break;

        case 'question':
            displayQuestion(data.data);
            showPlayerSection('playSection');
            break;

        case 'answerResult':
            showAnswerFeedback(data.result);
            break;

        case 'questionEnd':
            // Question terminée
            break;

        case 'leaderboard':
            displayPlayerLeaderboard(data.data);
            showPlayerSection('playerLeaderboardSection');
            break;

        case 'gameEnd':
            displayFinalResults(data.podium);
            showPlayerSection('finalResultSection');
            break;
    }
}

function displayQuestion(questionData) {
    document.getElementById('playQuestionNum').textContent = questionData.questionIndex + 1;
    document.getElementById('playTotalQuestions').textContent = questionData.totalQuestions;
    document.getElementById('playQuestionText').textContent = questionData.question;

    const colors = ['red', 'blue', 'yellow', 'green'];
    const answersHtml = questionData.answers.map((a, index) => `
        <button class="answer-btn ${colors[index]}" onclick="submitAnswer(${index})">
            ${a.text}
        </button>
    `).join('');
    document.getElementById('playAnswers').innerHTML = answersHtml;

    // Timer
    let timeLeft = questionData.timeLimit;
    document.getElementById('playTimer').textContent = timeLeft;

    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('playTimer').textContent = timeLeft;
        if (timeLeft <= 0) clearInterval(timer);
    }, 1000);
}

function submitAnswer(answerIndex) {
    // Désactiver les boutons
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);

    // Envoyer la réponse
    connectionManager.sendToHost({
        type: 'answer',
        answerIndex: answerIndex
    });
}

function showAnswerFeedback(result) {
    const feedback = document.getElementById('answerFeedback');
    const icon = document.getElementById('feedbackIcon');
    const text = document.getElementById('feedbackText');
    const points = document.getElementById('feedbackPoints');

    if (result.isCorrect) {
        icon.textContent = '✓';
        icon.style.color = 'var(--color-success)';
        text.textContent = 'Bonne réponse!';
        points.textContent = `+${result.points} points`;
    } else {
        icon.textContent = '✗';
        icon.style.color = 'var(--color-danger)';
        text.textContent = 'Mauvaise réponse';
        points.textContent = '0 point';
    }

    feedback.style.display = 'block';

    setTimeout(() => {
        feedback.style.display = 'none';
    }, 3000);
}

function displayPlayerLeaderboard(leaderboard) {
    const myData = leaderboard.find(p => p.id === playerId);

    if (myData) {
        document.getElementById('playerRank').textContent = myData.rank;
        document.getElementById('playerScore').textContent = myData.score;
    }

    const top5 = leaderboard.slice(0, 5);
    document.getElementById('topPlayersList').innerHTML = top5.map(p => `
        <div class="leaderboard-item ${p.id === playerId ? 'highlight' : ''}">
            <div class="leaderboard-rank">${p.rank}</div>
            <div class="leaderboard-name">${p.nickname}</div>
            <div class="leaderboard-score">${p.score}</div>
        </div>
    `).join('');
}

function displayFinalResults(podium) {
    const myRank = podium.findIndex(p => p.id === playerId) + 1;
    const myData = podium.find(p => p.id === playerId);

    let medal = '🎉';
    let message = 'Félicitations pour ta participation!';

    if (myRank === 1) {
        medal = '🥇';
        message = 'Incroyable! Tu es le champion! 🏆';
    } else if (myRank === 2) {
        medal = '🥈';
        message = 'Excellent travail! Deuxième place! 🎉';
    } else if (myRank === 3) {
        medal = '🥉';
        message = 'Bravo! Tu es sur le podium! 👏';
    }

    document.getElementById('finalMedal').textContent = medal;
    document.getElementById('finalRank').textContent = myData ? myRank : '-';
    document.getElementById('finalScore').textContent = myData ? myData.score : '0';
    document.getElementById('finalMessage').textContent = message;
}

function showPlayerSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
}

function showError(message) {
    const errorDiv = document.getElementById('joinError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/* ============================================
   MODE SOMBRE
   ============================================ */

function setupDarkMode(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    // Charger la préférence
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️';
    }

    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        btn.textContent = isDark ? '☀️' : '🌙';
    });
}
