
import { GameRoom } from '../types';

/**
 * LocalDB - Service de synchronisation simplifié pour le mode "Plateau TV".
 * Dans cette version, l'animateur diffuse l'état du jeu.
 */
class LocalDB {
  private state: GameRoom | null = null;
  private readonly STORAGE_KEY = 'FAMILLE_DZ_SHOW_STATE';

  async getState(): Promise<GameRoom | null> {
    const local = localStorage.getItem(this.STORAGE_KEY);
    return local ? JSON.parse(local) : null;
  }

  async saveState(newState: GameRoom): Promise<void> {
    this.state = newState;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
    
    // Synchro instantanée entre onglets sur le même appareil (Régie -> Plateau)
    const bc = new BroadcastChannel('dz_show_sync');
    bc.postMessage(newState);
  }

  async reset(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = null;
  }
}

export const localDB = new LocalDB();
