
class SoundService {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private isUnlocked = false;

  constructor() {
    this.init();
  }

  private init() {
    /**
     * CONFIGURATION LOCALE DES SONS
     * Place tes fichiers dans le dossier "public/sounds/" de ton projet.
     * Noms requis : ding.mp3, buzzer.mp3, tada.mp3, dice.mp3
     */
    const soundFiles: { [key: string]: string } = {
      ding: '/sounds/ding.mp3',
      buzzer: '/sounds/buzzer.mp3',
      tada: '/sounds/tada.mp3',
      dice_roll: '/sounds/dice.mp3'
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      try {
        const audio = new Audio();
        audio.src = path;
        audio.preload = "auto";
        // On garde une trace pour le déverrouillage
        this.sounds[key] = audio;
      } catch (e) {
        console.error(`Impossible d'initialiser le son local: ${key}`, e);
      }
    });
  }

  /**
   * Déverrouille l'audio sur le premier clic utilisateur.
   * Indispensable pour les navigateurs modernes.
   */
  async unlockAudio() {
    if (this.isUnlocked) return;

    console.log("Tentative de déverrouillage de l'audio...");
    
    const unlockPromises = Object.values(this.sounds).map(audio => {
      // On tente de jouer un court instant et de reset
      return audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(err => {
        // C'est normal si certains fichiers manquent encore au moment du test
        console.log("Audio bypass - attente de fichier:", audio.src);
      });
    });

    await Promise.all(unlockPromises);
    this.isUnlocked = true;
    console.log("🔊 Système audio DZ prêt (Mode Local)");
  }

  /**
   * Joue un son par son nom.
   * Crée un clone pour permettre la superposition (ex: plusieurs buzzers rapides).
   */
  play(name: string) {
    const source = this.sounds[name];
    if (source && source.src) {
      try {
        const playback = source.cloneNode(true) as HTMLAudioElement;
        playback.volume = 0.7;
        playback.play().catch(e => {
          // Si le fichier n'existe pas encore sur le serveur, on l'affiche proprement
          console.warn(`[SoundService] Erreur lecture ${name}: Vérifiez que le fichier existe dans /public/sounds/`, e);
        });
      } catch (err) {
        console.error("Erreur critique playback:", err);
      }
    } else {
      console.warn(`Le son "${name}" n'est pas configuré.`);
    }
  }
}

const soundService = new SoundService();
export default soundService;
