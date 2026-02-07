/**
 * CONNECTION MANAGER - Gestion de la connexion temps réel avec PeerJS
 * Gère la communication P2P entre l'animateur et les participants
 */

class ConnectionManager {
    constructor() {
        this.peer = null;
        this.connections = new Map(); // playerId -> connection
        this.isHost = false;
        this.hostConnection = null;
        this.onPlayerJoined = null; // Callback
        this.onPlayerLeft = null; // Callback
        this.onMessageReceived = null; // Callback
        console.log('ConnectionManager initialisé');
    }

    /**
     * Initialise l'animateur avec un code PIN
     * @param {string} pin - Code PIN à 6 chiffres
     * @returns {Promise} Promesse de connexion
     */
    initHost(pin) {
        return new Promise((resolve, reject) => {
            try {
                // Créer le peer avec le PIN comme ID
                this.peer = new Peer('host-' + pin, {
                    config: {
                        'iceServers': [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });

                this.isHost = true;

                this.peer.on('open', (id) => {
                    console.log('Animateur connecté avec ID:', id);
                    this.setupHostListeners();
                    resolve(pin);
                });

                this.peer.on('error', (error) => {
                    console.error('Erreur peer animateur:', error);
                    reject(error);
                });

            } catch (error) {
                console.error('Erreur initialisation animateur:', error);
                reject(error);
            }
        });
    }

    /**
     * Configure les listeners pour l'animateur
     */
    setupHostListeners() {
        this.peer.on('connection', (conn) => {
            console.log('Nouvelle connexion de:', conn.peer);

            conn.on('open', () => {
                console.log('Connexion établie avec:', conn.peer);

                // Stocker la connexion
                this.connections.set(conn.peer, conn);

                // Configurer les listeners de cette connexion
                this.setupConnectionListeners(conn);
            });

            conn.on('error', (error) => {
                console.error('Erreur connexion:', error);
            });
        });
    }

    /**
     * Configure les listeners pour une connexion
     * @param {Object} conn - Connexion PeerJS
     */
    setupConnectionListeners(conn) {
        conn.on('data', (data) => {
            console.log('Message reçu de', conn.peer, ':', data);
            this.handleMessage(conn.peer, data);
        });

        conn.on('close', () => {
            console.log('Connexion fermée:', conn.peer);
            this.connections.delete(conn.peer);
            if (this.onPlayerLeft) {
                this.onPlayerLeft(conn.peer);
            }
        });

        conn.on('error', (error) => {
            console.error('Erreur connexion:', error);
        });
    }

    /**
     * Connecte un participant à l'animateur
     * @param {string} pin - Code PIN du jeu
     * @param {string} nickname - Pseudo du joueur
     * @returns {Promise} Promesse de connexion
     */
    joinAsPlayer(pin, nickname) {
        return new Promise((resolve, reject) => {
            try {
                // Créer un peer avec un ID unique
                const playerId = 'player-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                this.peer = new Peer(playerId, {
                    config: {
                        'iceServers': [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });

                this.isHost = false;

                this.peer.on('open', (id) => {
                    console.log('Joueur connecté avec ID:', id);

                    // Connexion à l'animateur
                    const hostId = 'host-' + pin;
                    const conn = this.peer.connect(hostId);

                    conn.on('open', () => {
                        console.log('Connecté à l\'animateur');
                        this.hostConnection = conn;

                        // Envoyer le pseudo
                        this.sendToHost({
                            type: 'join',
                            nickname: nickname,
                            playerId: id
                        });

                        // Configurer les listeners
                        this.setupPlayerListeners(conn);

                        resolve({ playerId: id, nickname });
                    });

                    conn.on('error', (error) => {
                        console.error('Erreur connexion à l\'animateur:', error);
                        reject(new Error('Impossible de rejoindre le jeu. Vérifiez le code PIN.'));
                    });
                });

                this.peer.on('error', (error) => {
                    console.error('Erreur peer joueur:', error);
                    reject(error);
                });

                // Timeout après 10 secondes
                setTimeout(() => {
                    if (!this.hostConnection) {
                        reject(new Error('Connexion timeout. Vérifiez le code PIN.'));
                    }
                }, 10000);

            } catch (error) {
                console.error('Erreur connexion joueur:', error);
                reject(error);
            }
        });
    }

    /**
     * Configure les listeners pour le joueur
     * @param {Object} conn - Connexion à l'animateur
     */
    setupPlayerListeners(conn) {
        conn.on('data', (data) => {
            console.log('Message reçu de l\'animateur:', data);
            this.handleMessage('host', data);
        });

        conn.on('close', () => {
            console.log('Connexion à l\'animateur fermée');
            if (this.onPlayerLeft) {
                this.onPlayerLeft('host');
            }
        });

        conn.on('error', (error) => {
            console.error('Erreur connexion:', error);
        });
    }

    /**
     * Gère les messages reçus
     * @param {string} from - ID de l'expéditeur
     * @param {Object} data - Données du message
     */
    handleMessage(from, data) {
        if (this.onMessageReceived) {
            this.onMessageReceived(from, data);
        }

        // Traitement spécifique des messages côté animateur
        if (this.isHost && data.type === 'join') {
            if (this.onPlayerJoined) {
                this.onPlayerJoined(from, data.nickname);
            }
        }
    }

    /**
     * Envoie un message à tous les joueurs (animateur seulement)
     * @param {Object} data - Données à envoyer
     */
    broadcastToPlayers(data) {
        if (!this.isHost) {
            console.warn('Seul l\'animateur peut diffuser des messages');
            return;
        }

        console.log(`Diffusion à ${this.connections.size} joueurs:`, data);

        this.connections.forEach((conn, playerId) => {
            try {
                conn.send(data);
            } catch (error) {
                console.error(`Erreur envoi à ${playerId}:`, error);
            }
        });
    }

    /**
     * Envoie un message à un joueur spécifique (animateur seulement)
     * @param {string} playerId - ID du joueur
     * @param {Object} data - Données à envoyer
     */
    sendToPlayer(playerId, data) {
        if (!this.isHost) {
            console.warn('Seul l\'animateur peut envoyer des messages aux joueurs');
            return;
        }

        const conn = this.connections.get(playerId);
        if (conn) {
            try {
                conn.send(data);
            } catch (error) {
                console.error(`Erreur envoi à ${playerId}:`, error);
            }
        } else {
            console.warn(`Joueur ${playerId} non trouvé`);
        }
    }

    /**
     * Envoie un message à l'animateur (joueur seulement)
     * @param {Object} data - Données à envoyer
     */
    sendToHost(data) {
        if (this.isHost) {
            console.warn('L\'animateur ne peut pas s\'envoyer de messages');
            return;
        }

        if (this.hostConnection) {
            try {
                this.hostConnection.send(data);
            } catch (error) {
                console.error('Erreur envoi à l\'animateur:', error);
            }
        } else {
            console.warn('Pas de connexion à l\'animateur');
        }
    }

    /**
     * Récupère le nombre de joueurs connectés
     * @returns {number} Nombre de joueurs
     */
    getPlayerCount() {
        return this.connections.size;
    }

    /**
     * Ferme toutes les connexions
     */
    disconnect() {
        console.log('Déconnexion...');

        // Fermer toutes les connexions
        this.connections.forEach((conn) => {
            conn.close();
        });
        this.connections.clear();

        // Fermer la connexion à l'animateur si joueur
        if (this.hostConnection) {
            this.hostConnection.close();
            this.hostConnection = null;
        }

        // Détruire le peer
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        console.log('Déconnecté');
    }

    /**
     * Génère un code PIN aléatoire
     * @returns {string} Code PIN à 6 chiffres
     */
    static generatePIN() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Vérifie si un code PIN est valide
     * @param {string} pin - Code PIN à vérifier
     * @returns {boolean} Validité du PIN
     */
    static isValidPIN(pin) {
        return /^\d{6}$/.test(pin);
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConnectionManager;
}
