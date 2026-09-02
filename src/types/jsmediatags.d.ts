declare module 'jsmediatags/dist/jsmediatags.min.js' {
  export type MediaTagResult = {
    tags?: Record<
      string,
      unknown
    >
  }

  export type MediaTagError = {
    type?: string
    info?: string
  }

  export type ReadCallbacks = {
    onSuccess: (
      result: MediaTagResult,
    ) => void
    onError: (
      error: MediaTagError,
    ) => void
  }

  const jsmediatags: {
    read: (
      file: File | Blob,
      callbacks: ReadCallbacks,
    ) => void
  }

  export default jsmediatags
}
