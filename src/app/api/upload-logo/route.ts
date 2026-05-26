import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'logos'
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the calling user via their session cookie
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    // 2. Parse the multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const empresaId = formData.get('empresaId') as string | null

    if (!file || !empresaId) {
      return NextResponse.json({ error: 'Arquivo ou empresaId ausente.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 2MB.' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG, WEBP ou SVG.' }, { status: 400 })
    }

    // 3. Use the admin client (bypasses RLS) for storage operations
    const admin = createAdminClient()

    // 4. Ensure the bucket exists (idempotent — safe to call even if it already exists)
    const { data: buckets } = await admin.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error: createBucketErr } = await admin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_SIZE_BYTES,
        allowedMimeTypes: allowedTypes,
      })
      if (createBucketErr) {
        console.error('[upload-logo] Erro ao criar bucket:', createBucketErr)
        return NextResponse.json({ error: 'Falha ao criar bucket de armazenamento.' }, { status: 500 })
      }
    }

    // 5. Build a deterministic file path scoped to the company
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${empresaId}/logo-${Date.now()}.${ext}`

    // 6. Convert File to ArrayBuffer then Buffer for Node.js upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 7. Upload (upsert: true replaces existing files at the same path)
    const { error: uploadErr } = await admin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadErr) {
      console.error('[upload-logo] Erro no upload:', uploadErr)
      return NextResponse.json({ error: 'Falha no upload: ' + uploadErr.message }, { status: 500 })
    }

    // 8. Get the public URL (bucket is public)
    const { data: urlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno no servidor.'
    console.error('[upload-logo] Exceção:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
