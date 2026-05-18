'use client'

interface SkeletonProps {
  className?: string
  style?:     React.CSSProperties
}

/** Terminal-styled panel skeleton */
export function PanelSkeleton({ style }: SkeletonProps) {
  return (
    <div style={{ height:'100%', background:'#0d1117', display:'flex', flexDirection:'column', overflow:'hidden', ...style }}>
      <div style={{ height:26, background:'#0f1520', borderBottom:'0.5px solid #1e2530', padding:'4px 8px', display:'flex', alignItems:'center' }}>
        <div style={{ width:80, height:8, background:'#1e2530', borderRadius:2 }} />
      </div>
      <div style={{ flex:1, padding:8, display:'flex', flexDirection:'column', gap:6 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height:10, background:'#1e2530', borderRadius:2, width:`${50 + (i % 3) * 20}%`, opacity: 0.5 + i * 0.08 }} />
        ))}
      </div>
    </div>
  )
}

/** Chart skeleton with candle bars */
export function ChartSkeleton() {
  return (
    <div style={{ height:'100%', background:'#0a0c0f', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ height:34, background:'#0d1117', borderBottom:'0.5px solid #1e2530' }} />
      <div style={{ flex:1, display:'flex', alignItems:'flex-end', padding:'16px 8px 8px', gap:3 }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.4) * 15 + Math.random() * 10
          const isUp = i % 3 !== 0
          return (
            <div key={i} style={{ flex:1, height:`${h}%`, background:isUp?'#1a7a4a':'#7a1a1a', borderRadius:1, opacity:0.6 }} />
          )
        })}
      </div>
    </div>
  )
}
