'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children:  ReactNode
  fallback?: ReactNode
  onError?:  (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:16, background:'#0a0c0f', gap:8 }}>
          <span style={{ fontSize:10, color:'#ef4444', letterSpacing:'1px' }}>COMPONENT ERROR</span>
          <span style={{ fontSize:9, color:'#5a6373', maxWidth:300, textAlign:'center' }}>
            {this.state.error.message}
          </span>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ fontSize:9, color:'#f0b429', background:'transparent', border:'0.5px solid #f0b429', padding:'3px 10px', borderRadius:2, cursor:'pointer', fontFamily:'inherit' }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
