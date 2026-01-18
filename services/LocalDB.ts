import { GameRoom } from '../types';
import { supabase } from './supabase';

/**
 * SupabaseDB - Service de synchronisation via Supabase.
 * Remplace l'ancienne implémentation LocalDB.
 */
class LocalDB {
  private readonly TABLE_NAME = 'game_state';
  private readonly GAME_ID = 'live-dz';

  async getState(): Promise<GameRoom | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('payload')
        .eq('id', this.GAME_ID)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 means row not found
          console.error('Error fetching state:', error);
        }
        return null;
      }
      return data?.payload as GameRoom || null;
    } catch (e) {
      console.error('Supabase error:', e);
      return null;
    }
  }

  async saveState(newState: GameRoom): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .upsert({ id: this.GAME_ID, payload: newState });

    if (error) {
      console.error('Error saving state:', error);
    }
  }

  async reset(): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', this.GAME_ID);

    if (error) {
      console.error('Error resetting state:', error);
    }
  }

  subscribe(callback: (state: GameRoom) => void): () => void {
    const channel = supabase
      .channel('game_state_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.TABLE_NAME,
          filter: `id=eq.${this.GAME_ID}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).payload) {
            callback((payload.new as any).payload as GameRoom);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const localDB = new LocalDB();
