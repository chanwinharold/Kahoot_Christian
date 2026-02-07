/**
 * QUIZ MANAGER - Gestion CRUD des quiz
 * Gère la création, lecture, mise à jour, suppression et import/export des quiz
 */

class QuizManager {
    constructor() {
        this.storageKey = 'quizBibliques';
        this.currentQuiz = null;
        console.log('QuizManager initialisé');
    }

    /**
     * Récupère tous les quiz depuis le localStorage
     * @returns {Array} Liste des quiz
     */
    getAllQuiz() {
        try {
            const quiz = localStorage.getItem(this.storageKey);
            return quiz ? JSON.parse(quiz) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des quiz:', error);
            return [];
        }
    }

    /**
     * Récupère un quiz par son ID
     * @param {string} id - ID du quiz
     * @returns {Object|null} Le quiz ou null
     */
    getQuizById(id) {
        const allQuiz = this.getAllQuiz();
        return allQuiz.find(q => q.id === id) || null;
    }

    /**
     * Sauvegarde un nouveau quiz ou met à jour un existant
     * @param {Object} quiz - Données du quiz
     * @returns {Object} Le quiz sauvegardé
     */
    saveQuiz(quiz) {
        try {
            const allQuiz = this.getAllQuiz();

            // Si pas d'ID, c'est un nouveau quiz
            if (!quiz.id) {
                quiz.id = this.generateId();
                quiz.createdAt = new Date().toISOString();
                allQuiz.push(quiz);
                console.log('Nouveau quiz créé:', quiz.id);
            } else {
                // Mise à jour d'un quiz existant
                const index = allQuiz.findIndex(q => q.id === quiz.id);
                if (index !== -1) {
                    quiz.updatedAt = new Date().toISOString();
                    allQuiz[index] = quiz;
                    console.log('Quiz mis à jour:', quiz.id);
                } else {
                    console.error('Quiz non trouvé pour mise à jour');
                    return null;
                }
            }

            localStorage.setItem(this.storageKey, JSON.stringify(allQuiz));
            return quiz;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du quiz:', error);
            return null;
        }
    }

    /**
     * Supprime un quiz
     * @param {string} id - ID du quiz à supprimer
     * @returns {boolean} Succès de la suppression
     */
    deleteQuiz(id) {
        try {
            const allQuiz = this.getAllQuiz();
            const filteredQuiz = allQuiz.filter(q => q.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filteredQuiz));
            console.log('Quiz supprimé:', id);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du quiz:', error);
            return false;
        }
    }

    /**
     * Exporte un quiz en JSON
     * @param {string} id - ID du quiz à exporter
     * @returns {string} JSON du quiz
     */
    exportQuiz(id) {
        const quiz = this.getQuizById(id);
        if (!quiz) {
            console.error('Quiz non trouvé pour export');
            return null;
        }

        // Nettoyer les métadonnées internes avant export
        const cleanQuiz = {
            title: quiz.title,
            questions: quiz.questions
        };

        return JSON.stringify(cleanQuiz, null, 2);
    }

    /**
     * Importe un quiz depuis JSON
     * @param {string} jsonString - Chaîne JSON du quiz
     * @returns {Object|null} Le quiz importé ou null en cas d'erreur
     */
    importQuiz(jsonString) {
        try {
            const quiz = JSON.parse(jsonString);

            // Validation du format
            if (!quiz.title || !Array.isArray(quiz.questions)) {
                throw new Error('Format de quiz invalide');
            }

            // Validation des questions
            for (const question of quiz.questions) {
                if (!question.question || !Array.isArray(question.answers)) {
                    throw new Error('Format de question invalide');
                }
                if (question.answers.length < 2 || question.answers.length > 4) {
                    throw new Error('Nombre de réponses invalide (2-4 requis)');
                }
                const correctAnswers = question.answers.filter(a => a.isCorrect);
                if (correctAnswers.length !== 1) {
                    throw new Error('Exactement une réponse correcte requise');
                }
            }

            // Sauvegarder le quiz importé
            const savedQuiz = this.saveQuiz(quiz);
            console.log('Quiz importé avec succès:', savedQuiz.id);
            return savedQuiz;
        } catch (error) {
            console.error('Erreur lors de l\'import du quiz:', error);
            alert('Erreur d\'import: ' + error.message);
            return null;
        }
    }

    /**
     * Télécharge un quiz en fichier JSON
     * @param {string} id - ID du quiz à télécharger
     */
    downloadQuiz(id) {
        const json = this.exportQuiz(id);
        if (!json) return;

        const quiz = this.getQuizById(id);
        const filename = `${quiz.title.replace(/[^a-z0-9]/gi, '_')}.json`;

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Quiz téléchargé:', filename);
    }

    /**
     * Crée un quiz vide
     * @returns {Object} Quiz vide
     */
    createEmptyQuiz() {
        return {
            title: '',
            questions: []
        };
    }

    /**
     * Crée une question vide
     * @returns {Object} Question vide
     */
    createEmptyQuestion() {
        return {
            question: '',
            answers: [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false }
            ],
            timeLimit: 30,
            reference: ''
        };
    }

    /**
     * Ajoute une réponse à une question
     * @param {Object} question - Question à modifier
     * @returns {Object} Question modifiée
     */
    addAnswerToQuestion(question) {
        if (question.answers.length >= 4) {
            console.warn('Maximum 4 réponses par question');
            return question;
        }
        question.answers.push({ text: '', isCorrect: false });
        return question;
    }

    /**
     * Retire une réponse d'une question
     * @param {Object} question - Question à modifier
     * @param {number} index - Index de la réponse à retirer
     * @returns {Object} Question modifiée
     */
    removeAnswerFromQuestion(question, index) {
        if (question.answers.length <= 2) {
            console.warn('Minimum 2 réponses par question');
            return question;
        }
        question.answers.splice(index, 1);
        return question;
    }

    /**
     * Valide un quiz avant sauvegarde
     * @param {Object} quiz - Quiz à valider
     * @returns {Object} {valid: boolean, errors: Array}
     */
    validateQuiz(quiz) {
        const errors = [];

        if (!quiz.title || quiz.title.trim() === '') {
            errors.push('Le titre du quiz est requis');
        }

        if (!quiz.questions || quiz.questions.length === 0) {
            errors.push('Le quiz doit contenir au moins une question');
        }

        quiz.questions.forEach((q, index) => {
            if (!q.question || q.question.trim() === '') {
                errors.push(`Question ${index + 1}: Le texte est requis`);
            }

            if (!q.answers || q.answers.length < 2) {
                errors.push(`Question ${index + 1}: Au moins 2 réponses requises`);
            }

            if (q.answers) {
                const hasCorrect = q.answers.some(a => a.isCorrect);
                if (!hasCorrect) {
                    errors.push(`Question ${index + 1}: Une réponse correcte est requise`);
                }

                const emptyAnswers = q.answers.filter(a => !a.text || a.text.trim() === '');
                if (emptyAnswers.length > 0) {
                    errors.push(`Question ${index + 1}: Toutes les réponses doivent avoir un texte`);
                }
            }

            if (!q.timeLimit || q.timeLimit < 10 || q.timeLimit > 60) {
                errors.push(`Question ${index + 1}: Temps limite invalide (10-60s)`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Génère un ID unique
     * @returns {string} ID unique
     */
    generateId() {
        return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Charge le quiz de démonstration s'il n'y a aucun quiz
     */
    loadDemoQuizIfNeeded() {
        const allQuiz = this.getAllQuiz();
        if (allQuiz.length === 0) {
            console.log('Aucun quiz trouvé, chargement du quiz de démonstration');
            // Le quiz de démo sera chargé depuis sample-quiz.json via fetch
            this.loadDemoQuiz();
        }
    }

    /**
     * Charge le quiz de démonstration depuis le fichier JSON
     */
    async loadDemoQuiz() {
        try {
            const response = await fetch('data/sample-quiz.json');
            const demoQuiz = await response.json();
            this.saveQuiz(demoQuiz);
            console.log('Quiz de démonstration chargé');
        } catch (error) {
            console.error('Erreur lors du chargement du quiz de démonstration:', error);
        }
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizManager;
}
