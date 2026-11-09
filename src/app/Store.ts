// Store observable mínimo para useSyncExternalStore. Cambios superficiales: solo notifica si algo cambió.

export class Store<T extends object> {
  private snapshot: T
  private readonly listeners = new Set<() => void>()

  constructor(private readonly initial: T) {
    this.snapshot = initial
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): T => this.snapshot

  set(partial: Partial<T>): void {
    const changed = (Object.keys(partial) as Array<keyof T>).some((k) => partial[k] !== this.snapshot[k])
    if (!changed) return
    this.snapshot = {...this.snapshot, ...partial}
    for (const l of this.listeners) l()
  }

  reset(): void {
    this.snapshot = this.initial
    for (const l of this.listeners) l()
  }
}
