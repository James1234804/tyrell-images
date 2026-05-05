 // ============================================
// TYRELL IMAGES — DASHBOARD BACKEND
// ============================================

const SUPABASE_URL = 'https://vptslajbeatotdgyalff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHNsYWpiZWF0b3RkZ3lhbGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDE2NDIsImV4cCI6MjA5MzQ3NzY0Mn0.T-Kc17Jg7UC5r6RHGzv4Ep7QtRGEUEXKV03jvXHdqEU';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTH
// ============================================

async function loginClient(username, password) {
  try {
    const { data, error } = await db
      .from('clients')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) return { success: false, error: 'Invalid username or password.' };
    return { success: true, client: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================
// CLIENTS
// ============================================

async function addClient(name, username, password) {
  try {
    const { data: existing } = await db
      .from('clients')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) return { success: false, error: 'Username already taken. Choose another.' };

    const { data, error } = await db
      .from('clients')
      .insert([{ name, username, password }])
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, client: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function getClients() {
  try {
    const { data, error } = await db
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

async function removeClient(id) {
  try {
    const { data: photos } = await db
      .from('photos')
      .select('file_name')
      .eq('client_id', id);

    if (photos && photos.length) {
      const paths = photos.map(p => p.file_name);
      await db.storage.from('photos').remove(paths);
      await db.from('photos').delete().eq('client_id', id);
    }

    const { error } = await db.from('clients').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================
// PHOTOS — using direct fetch for upload
// ============================================

async function uploadPhoto(clientId, file) {
  try {
    const uniqueName = `${clientId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    console.log('Uploading:', uniqueName);

    // Use direct fetch instead of SDK to avoid browser blocking
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/photos/${uniqueName}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': file.type,
        'x-upsert': 'true'
      },
      body: file
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const err = await response.text();
      console.log('Upload error:', err);
      return { success: false, error: `Upload failed: ${response.status}` };
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/photos/${uniqueName}`;
    console.log('File URL:', fileUrl);

    const { error: dbError } = await db
      .from('photos')
      .insert([{
        client_id: clientId,
        file_url: fileUrl,
        file_name: file.name
      }]);

    console.log('DB insert error:', dbError);
    if (dbError) return { success: false, error: dbError.message };
    return { success: true };
  } catch (e) {
    console.log('Exception:', e);
    return { success: false, error: e.message };
  }
}

async function getPhotos(clientId = null) {
  try {
    let query = db
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

async function removePhoto(id) {
  try {
    const { data: photo } = await db
      .from('photos')
      .select('file_url, client_id, file_name')
      .eq('id', id)
      .single();

    if (photo) {
      const path = `${photo.client_id}/${photo.file_url.split('/').pop()}`;
      await db.storage.from('photos').remove([path]);
    }

    const { error } = await db.from('photos').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
