import {useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react'
import {
  PLACEMENT_LABELS,
  SCALE_LABELS,
  parseArOptions,
  serializeArOptions,
  type ArOptions,
} from '../ar/arOptions'
import {arStore} from '../ar/arStore'
import {assessCapabilities, probeEnvironment} from '../ar/DeviceCapabilities'
import type {IARAdapter} from '../ar/IARAdapter'
import {requestMotionPermission} from '../ar/motionPermission'
import type {SpatialController} from '../ar/SpatialController'
import {CreditsScreen} from '../ui/screens/CreditsScreen'
import {ExpedientePanel} from '../ui/screens/ExpedientePanel'
import {IntroScreen} from '../ui/screens/IntroScreen'
import {SessionHud} from '../ui/screens/SessionHud'
import type {ExpedienteController} from './controllers/ExpedienteController'
import {gameStore} from './gameStore'
import type {SlamSessionKind} from './sessionFactory'

type Screen = 'intro' | 'session' | 'credits'
type SessionKind = SlamSessionKind | 'fallback'

// Three.js + adaptadores + controladores se cargan aparte: la portada pinta sin esperar al 3D.
// XR8.Threejs necesita el namespace completo de THREE en window, así que no admite tree-shaking.
const loadSlamSession = () => import('./sessionFactory')
const loadFallbackAdapter = () => import('../ar/FallbackARAdapter')

function reportLoadFailure(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  arStore.log(`ERROR al cargar el módulo 3D: ${msg}`)
  arStore.dispatch({type: 'FAILED', error: 'No se pudo cargar el módulo 3D. Revisa la conexión y recarga la página.'})
}

function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Falta #${id} en index.html`)
  return el as T
}

export function App() {
  const snap = useSyncExternalStore(arStore.subscribe, arStore.getSnapshot)
  const report = useMemo(() => assessCapabilities(probeEnvironment()), [])
  const [screen, setScreen] = useState<Screen>('intro')
  const [kind, setKind] = useState<SessionKind>('expediente')
  const [options, setOptions] = useState<ArOptions>(() => parseArOptions(window.location.search))
  const [expediente, setExpediente] = useState<ExpedienteController | null>(null)
  const adapterRef = useRef<IARAdapter | null>(null)
  const controllerRef = useRef<SpatialController | null>(null)
  // XR8 no documenta reinicios en la misma página tras stop(); por seguridad se recarga.
  const [slamUsed, setSlamUsed] = useState(false)

  // La variante vive en la URL: reiniciar el SLAM recarga la página y debe conservarla.
  const changeOptions = useCallback((next: ArOptions) => {
    setOptions(next)
    const url = `${window.location.pathname}${serializeArOptions(next)}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }, [])

  const stopSession = useCallback(() => {
    adapterRef.current?.shutdown()
    adapterRef.current = null
    controllerRef.current = null
    setExpediente(null)
    gameStore.reset()
    setScreen('intro')
  }, [])

  // Liberar cámara al cerrar/ocultar la pestaña definitivamente.
  useEffect(() => {
    const onPageHide = () => adapterRef.current?.shutdown()
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  // Precarga del chunk 3D en segundo plano tras pintar la portada.
  useEffect(() => {
    const id = window.setTimeout(() => {
      void (report.slamCandidate ? loadSlamSession() : loadFallbackAdapter()).catch(() => undefined)
    }, 300)
    return () => window.clearTimeout(id)
  }, [report.slamCandidate])

  const startSlam = useCallback(
    async (sessionKind: SlamSessionKind) => {
      if (slamUsed) {
        window.location.reload()
        return
      }
      // Primera operación asíncrona del gesto: requisito de iOS para el permiso de movimiento.
      const motion = await requestMotionPermission()
      arStore.log(`Permiso de movimiento: ${motion}`)
      setSlamUsed(true)
      setKind(sessionKind)
      setScreen('session')
      arStore.dispatch({type: 'START', mode: 'slam'})
      if (motion === 'denied') {
        arStore.dispatch({
          type: 'FAILED',
          error:
            'Permiso de movimiento denegado. El seguimiento espacial lo necesita: recarga la página y acéptalo, ' +
            'o usa el modo compatible.',
        })
        return
      }
      try {
        const {createSlamSession} = await loadSlamSession()
        const {adapter, controller} = createSlamSession(
          sessionKind,
          getElement<HTMLCanvasElement>('camerafeed'),
          options,
        )
        adapterRef.current = adapter
        controllerRef.current = controller
        if (sessionKind === 'expediente') setExpediente(controller as ExpedienteController)
        await adapter.initialize()
      } catch (err) {
        reportLoadFailure(err)
      }
    },
    [slamUsed, options],
  )

  const answerAnchor = useCallback((moved: boolean) => {
    arStore.patch({anchorCheck: null})
    arStore.log(
      moved
        ? 'Ancla: el jugador indica que el contenido SE DESPLAZÓ'
        : 'Ancla: el jugador confirma que el contenido SIGUE en su sitio',
    )
    controllerRef.current?.onAnchorAnswer(moved)
  }, [])

  const startFallback = useCallback(async () => {
    adapterRef.current?.shutdown()
    adapterRef.current = null
    controllerRef.current = null
    setExpediente(null)
    setKind('fallback')
    setScreen('session')
    arStore.dispatch({type: 'START', mode: 'fallback'})
    try {
      const {FallbackARAdapter} = await loadFallbackAdapter()
      const adapter = new FallbackARAdapter(getElement('fallback-layer'), arStore)
      adapterRef.current = adapter
      await adapter.initialize()
    } catch (err) {
      reportLoadFailure(err)
    }
  }, [])

  if (screen === 'credits') {
    return <CreditsScreen onBack={() => setScreen('intro')} />
  }

  if (screen === 'session') {
    const isExpediente = kind === 'expediente'
    const trackingOk = snap.tracking.mode === 'slam' && snap.tracking.quality !== 'failed'
    return (
      <SessionHud
        snap={snap}
        placement={options.placement}
        variantLabel={
          isExpediente
            ? `Expediente · escala ${SCALE_LABELS[options.scale].toLowerCase()}`
            : `${PLACEMENT_LABELS[options.placement]} · ${SCALE_LABELS[options.scale]} · ${Math.round(
                options.cubeSize * 100,
              )} cm`
        }
        anchorSubject={isExpediente ? 'Lo que marcaste' : 'El cubo'}
        onConfirmAnchor={() => answerAnchor(false)}
        onReplaceAnchor={() => answerAnchor(true)}
        canRecenter={kind === 'anchor-test' && trackingOk}
        {...(isExpediente && expediente && trackingOk ? {onRecalibrate: () => expediente.recalibrate()} : {})}
        canFallback={report.fallbackAvailable}
        onRecenter={() => adapterRef.current?.recenter()}
        onStop={stopSession}
        onSwitchToFallback={() => void startFallback()}
      >
        {isExpediente && expediente ? (
          <ExpedientePanel controller={expediente} trackingNormal={snap.tracking.quality === 'normal'} />
        ) : null}
      </SessionHud>
    )
  }

  return (
    <IntroScreen
      report={report}
      options={options}
      log={snap.log}
      onOptionsChange={changeOptions}
      slamNeedsReload={slamUsed}
      onStartExpediente={() => void startSlam('expediente')}
      onStartAnchorTest={() => void startSlam('anchor-test')}
      onStartFallback={() => void startFallback()}
      onCredits={() => setScreen('credits')}
    />
  )
}
