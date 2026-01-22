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

  async saveState(newState: GameRoom, hostId?: string): Promise<void> {
    const payloadToSave: any = { id: this.GAME_ID, payload: newState };

    // If we have a hostId (only when Admin initializes/updates), we save it to the separate column
    // This helps with RLS policies in the future
    if (hostId) {
      payloadToSave.host_id = hostId;
    }

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .upsert(payloadToSave);

    if (error) {
      console.error('Error saving state:', error);
      // If error is 401/403, it means RLS blocked it
      if (error.code === '42501' || error.message?.includes('violates row-level security')) {
         console.warn("Write blocked by RLS. Are you the host?");
      }
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
    console.log("Subscribing to game_state updates...");
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
          console.log("Received Realtime Update:", payload.eventType);
          if (payload.new && (payload.new as any).payload) {
            callback((payload.new as any).payload as GameRoom);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === 'SUBSCRIBED') {
           // Optional: Fetch latest state on successful subscription to ensure sync
           this.getState().then(state => {
             if (state) callback(state);
           });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const localDB = new LocalDB();
