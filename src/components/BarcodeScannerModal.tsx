'use client'
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Loader2 } from 'lucide-react'

export function BarcodeScannerModal({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let reader = new BrowserMultiFormatReader()
    let mounted = true

    async function start() {
      try {
        const videoInputDevices = await reader.listVideoInputDevices()
        if (videoInputDevices.length === 0) {
          setError('Nenhuma câmera encontrada.')
          setLoading(false)
          return
        }
        
        // Pega a câmera traseira se houver, ou a primeira
        const backCamera = videoInputDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'))
        const deviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId

        if (!mounted || !videoRef.current) return
        setLoading(false)
        reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText())
            reader.reset()
          }
          if (err && !(err instanceof NotFoundException)) {
            if (process.env.NODE_ENV !== 'production') console.error(err)
          }
        })
      } catch (err: any) {
        if (mounted) {
          setError('Erro ao acessar a câmera: ' + err.message)
          setLoading(false)
        }
      }
    }

    start()

    return () => {
      mounted = false
      reader.reset()
    }
  }, [onScan])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:'400px', background:'var(--surface)', borderRadius:'var(--radius-lg)', overflow:'hidden', border:'2px solid var(--borda)', boxShadow:'4px 4px 0px var(--borda)' }}>
        <div style={{ padding:'1rem', borderBottom:'2px solid var(--borda)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface-alt)' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800 }}>📷 Escanear Código</h3>
          <button onClick={onClose} className="btn-icon"><X size={20}/></button>
        </div>
        
        <div style={{ padding:'1rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'250px', background:'#000', position:'relative' }}>
          {loading && <div style={{ color:'#fff', display:'flex', alignItems:'center', gap:'0.5rem' }}><Loader2 size={20} className="animate-spin"/> Iniciando câmera...</div>}
          {error && <div style={{ color:'var(--vermelho)', textAlign:'center', background:'var(--vermelho-claro)', padding:'1rem', borderRadius:'var(--radius)' }}>{error}</div>}
          
          <video ref={videoRef} style={{ width:'100%', height:'auto', display: (loading || error) ? 'none' : 'block' }} />
          
          {(!loading && !error) && (
            <div style={{ position:'absolute', inset:'1rem', border:'2px dashed rgba(255,255,255,0.5)', borderRadius:'12px', pointerEvents:'none' }} />
          )}
        </div>
        
        <div style={{ padding:'1rem', textAlign:'center', fontSize:'0.85rem', color:'var(--texto-sec)', background:'var(--surface-alt)', borderTop:'2px solid var(--borda)' }}>
          Aponte a câmera para o código de barras
        </div>
      </div>
    </div>
  )
}

export function useHasCamera() {
  const [hasCamera, setHasCamera] = useState(false)
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setHasCamera(devices.some(d => d.kind === 'videoinput'))
      }).catch(() => setHasCamera(false))
    }
  }, [])
  return hasCamera
}
