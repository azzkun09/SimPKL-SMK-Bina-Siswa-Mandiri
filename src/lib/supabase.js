import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cenrfpctxbcigrvpfmel.supabase.co';
const supabaseAnonKey = 'sb_publishable_G9XyW3TzQD6sY77QeOkpTw_GOcATUyb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);