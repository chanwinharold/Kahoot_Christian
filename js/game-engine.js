/**
 * GAME ENGINE - Moteur de jeu
 * Gère la logique du jeu, le système de points, le classement
 */

class GameEngine {
    constructor() {
        this.quiz = null;
        this.currentQuestionIndex = 0;
        this.players = new Map(); // playerId -> {nickname, score, answers}
        this.questionStartTime = null;
        this.questionTimer = null;
        this.state = 'lobby'; // lobby, playing, showingResults, finished
        console.log('GameEngine initialisé');
    }

    /**
     * Initialise une nouvelle partie
     * @param {Object} quiz - Quiz à jouer
     */
    initGame(quiz) {
        this.quiz = quiz;
        this.currentQuestionIndex = 0;
        this.players.clear();
        this.state = 'lobby';
        console.log('Partie initialisée avec quiz:', quiz.title);
    }

    /**
     * Ajoute un joueur
     * @param {string} playerId - ID unique du joueur
     * @param {string} nickname - Pseudo du joueur
     */
    addPlayer(playerId, nickname) {
        if (this.state !== 'lobby') {
            console.warn('Impossible d\'ajouter un joueur, partie déjà commencée');
            return false;
        }

        this.players.set(playerId, {
            id: playerId,
            nickname,
            score: 0,
            answers: []
        });

        console.log(`Joueur ajouté: ${nickname} (${playerId})`);
        return true;
    }

    /**
     * Retire un joueur
     * @param {string} playerId - ID du joueur
     */
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            console.log(`Joueur retiré: ${player.nickname}`);
            this.players.delete(playerId);
        }
    }

    /**
     * Récupère la liste des joueurs
     * @returns {Array} Liste des joueurs
     */
    getPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * Démarre la partie
     * @returns {boolean} Succès du démarrage
     */
    startGame() {
        if (this.players.size === 0) {
            console.warn('Aucun joueur, impossible de démarrer');
            return false;
        }

        if (!this.quiz || this.quiz.questions.length === 0) {
            console.warn('Quiz invalide, impossible de démarrer');
            return false;
        }

        this.state = 'playing';
        console.log('Partie démarrée');
        return true;
    }

    /**
     * Récupère la question actuelle
     * @returns {Object|null} Question actuelle
     */
    getCurrentQuestion() {
        if (!this.quiz || this.currentQuestionIndex >= this.quiz.questions.length) {
            return null;
        }
        return this.quiz.questions[this.currentQuestionIndex];
    }

    /**
     * Démarre une question
     * @returns {Object} Données de la question (sans réponse correcte)
     */
    startQuestion() {
        const question = this.getCurrentQuestion();
        if (!question) {
            console.error('Aucune question à démarrer');
            return null;
        }

        this.questionStartTime = Date.now();
        console.log(`Question ${this.currentQuestionIndex + 1} démarrée`);

        // Retourne la question sans indiquer la bonne réponse
        return {
            questionIndex: this.currentQuestionIndex,
            totalQuestions: this.quiz.questions.length,
            question: question.question,
            answers: question.answers.map((a, index) => ({
                index,
                text: a.text
            })),
            timeLimit: question.timeLimit,
            reference: question.reference || ''
        };
    }

    /**
     * Enregistre la réponse d'un joueur
     * @param {string} playerId - ID du joueur
     * @param {number} answerIndex - Index de la réponse choisie
     * @returns {Object} Résultat de la réponse
     */
    submitAnswer(playerId, answerIndex) {
        const player = this.players.get(playerId);
        if (!player) {
            console.error('Joueur non trouvé:', playerId);
            return null;
        }

        const question = this.getCurrentQuestion();
        if (!question) {
            console.error('Question non trouvée');
            return null;
        }

        // Vérifier si le joueur a déjà répondu
        const existingAnswer = player.answers.find(a => a.questionIndex === this.currentQuestionIndex);
        if (existingAnswer) {
            console.warn('Joueur a déjà répondu à cette question');
            return existingAnswer.result;
        }

        // Calculer le temps de réponse
        const responseTime = Date.now() - this.questionStartTime;
        const timeLimit = question.timeLimit * 1000;

        // Vérifier si la réponse est correcte
        const isCorrect = question.answers[answerIndex]?.isCorrect === true;

        // Calculer les points
        let points = 0;
        if (isCorrect) {
            // Points de base
            points = 1000;

            // Bonus de vitesse (jusqu'à 500 points)
            const speedBonus = Math.max(0, 500 - Math.floor((responseTime / timeLimit) * 500));
            points += speedBonus;

            player.score += points;
        }

        // Enregistrer la réponse
        const result = {
            questionIndex: this.currentQuestionIndex,
            answerIndex,
            isCorrect,
            points,
            responseTime,
            timestamp: Date.now()
        };

        player.answers.push({ questionIndex: this.currentQuestionIndex, result });

        console.log(`${player.nickname} a répondu: ${isCorrect ? 'Correct' : 'Incorrect'} (+${points} pts)`);

        return result;
    }

    /**
     * Récupère les statistiques de la question actuelle
     * @returns {Object} Statistiques
     */
    getQuestionStats() {
        const question = this.getCurrentQuestion();
        if (!question) return null;

        let answeredCount = 0;
        let correctCount = 0;
        let incorrectCount = 0;

        this.players.forEach(player => {
            const answer = player.answers.find(a => a.questionIndex === this.currentQuestionIndex);
            if (answer) {
                answeredCount++;
                if (answer.result.isCorrect) {
                    correctCount++;
                } else {
                    incorrectCount++;
                }
            }
        });

        return {
            totalPlayers: this.players.size,
            answeredCount,
            correctCount,
            incorrectCount,
            answersDistribution: this.getAnswersDistribution()
        };
    }

    /**
     * Récupère la distribution des réponses
     * @returns {Array} Distribution par réponse
     */
    getAnswersDistribution() {
        const question = this.getCurrentQuestion();
        if (!question) return [];

        const distribution = question.answers.map(() => 0);

        this.players.forEach(player => {
            const answer = player.answers.find(a => a.questionIndex === this.currentQuestionIndex);
            if (answer && answer.result.answerIndex !== undefined) {
                distribution[answer.result.answerIndex]++;
            }
        });

        return distribution;
    }

    /**
     * Passe à la question suivante
     * @returns {boolean} true s'il reste des questions, false si fini
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.quiz.questions.length) {
            this.state = 'finished';
            console.log('Quiz terminé');
            return false;
        }
        console.log(`Passage à la question ${this.currentQuestionIndex + 1}`);
        return true;
    }

    /**
     * Récupère le classement
     * @returns {Array} Classement des joueurs
     */
    getLeaderboard() {
        const leaderboard = Array.from(this.players.values())
            .map(player => ({
                id: player.id,
                nickname: player.nickname,
                score: player.score
            }))
            .sort((a, b) => b.score - a.score);

        // Ajouter le rang
        leaderboard.forEach((player, index) => {
            player.rank = index + 1;
        });

        return leaderboard;
    }

    /**
     * Récupère le classement d'un joueur spécifique
     * @param {string} playerId - ID du joueur
     * @returns {Object|null} Position et score du joueur
     */
    getPlayerRank(playerId) {
        const leaderboard = this.getLeaderboard();
        return leaderboard.find(p => p.id === playerId) || null;
    }

    /**
     * Récupère le top 3 du podium
     * @returns {Array} Top 3 des joueurs
     */
    getPodium() {
        const leaderboard = this.getLeaderboard();
        return leaderboard.slice(0, 3);
    }

    /**
     * Récupère l'index de la réponse correcte
     * @returns {number} Index de la réponse correcte
     */
    getCorrectAnswerIndex() {
        const question = this.getCurrentQuestion();
        if (!question) return -1;
        return question.answers.findIndex(a => a.isCorrect);
    }

    /**
     * Vérifie si tous les joueurs ont répondu
     * @returns {boolean} true si tous ont répondu
     */
    allPlayersAnswered() {
        let answeredCount = 0;
        this.players.forEach(player => {
            const answer = player.answers.find(a => a.questionIndex === this.currentQuestionIndex);
            if (answer) {
                answeredCount++;
            }
        });
        return answeredCount === this.players.size;
    }

    /**
     * Réinitialise le moteur de jeu
     */
    reset() {
        this.quiz = null;
        this.currentQuestionIndex = 0;
        this.players.clear();
        this.questionStartTime = null;
        this.state = 'lobby';
        console.log('GameEngine réinitialisé');
    }

    /**
     * Récupère l'état actuel du jeu
     * @returns {Object} État du jeu
     */
    getGameState() {
        return {
            state: this.state,
            currentQuestionIndex: this.currentQuestionIndex,
            totalQuestions: this.quiz ? this.quiz.questions.length : 0,
            playerCount: this.players.size
        };
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}
