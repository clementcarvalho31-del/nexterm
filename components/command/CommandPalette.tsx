'use client'
import { useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { useTerminalStore }    from '@/store/terminal'
import { useWorkspaceManager } from '@/workspace/manager'
import { AnimatePresence, motion } from 'framer-motion'
import type { WidgetId } from '@/workspace/types'

interface Cmd {
  id: string; label: string; description?: string
  action: 'select_symbol' | 'add_widget' | 'load_preset' | 'toggle_squawk'
  value?: string
}

const COMMANDS: Cmd[] = [
  { id:'eurusd',  label:'EUR/USD',      description:'Switch chart to Euro/Dollar',      action:'select_symbol', value:'EUR/USD' },
  { id:'gbpusd',  label:'GBP/USD',      description:'Switch chart to Pound/Dollar',     action:'select_symbol', value:'GBP/USD' },
  { id:'usdjpy',  label:'USD/JPY',      description:'Switch chart to Dollar/Yen',       action:'select_symbol', value:'USD/JPY' },
  { id:'audusd',  label:'AUD/USD',      description:'Switch chart to Aussie/Dollar',    action:'select_symbol', value:'AUD/USD' },
  { id:'dxy',     label:'DXY',          description:'US Dollar Index chart',            action:'select_symbol', value:'DXY'     },
  { id:'gold',    label:'GOLD',         description:'XAU/USD gold chart',               action:'select_symbol', value:'GOLD'    },
  { id:'wc-chart',label:'Add Chart',    description:'Add a new chart panel',            action:'add_widget',    value:'chart'        },
  { id:'wc-news', label:'Add News Feed',description:'Add macro news feed panel',        action:'add_widget',    value:'news-feed'    },
  { id:'wc-cot',  label:'Add COT',      description:'Add COT positioning panel',        action:'add_widget',    value:'cot'          },
  { id:'wc-cal',  label:'Add Calendar', description:'Add economic calendar',            action:'add_widget',    value:'calendar'     },
  { id:'wc-nfp',  label:'Add Event Trades',description:'Add news trading scenarios',   action:'add_widget',    value:'newsplay'     },
  { id:'wc-world',label:'Add Worldbook',description:'Add macro country dashboard',      action:'add_widget',    value:'worldbook'    },
  { id:'wc-yld',  label:'Add Yields',   description:'Add yield curve panel',            action:'add_widget',    value:'yields'       },
  { id:'wc-flow', label:'Add Flows',    description:'Add institutional flow tracker',   action:'add_widget',    value:'flows'        },
  { id:'wc-ai',   label:'Add AI Copilot',description:'Add AI assistant panel',         action:'add_widget',    value:'copilot'      },
  { id:'wc-liq',  label:'Add Liquidity',description:'Add liquidity tracker',            action:'add_widget',    value:'liquidity'    },
  { id:'p1',      label:'Layout: Focused Chart',  description:'Load preset layout',    action:'load_preset',   value:'focused-chart'    },
  { id:'p2',      label:'Layout: Dual Chart',     description:'Load preset layout',    action:'load_preset',   value:'dual-chart'       },
  { id:'p3',      label:'Layout: Quad Chart',     description:'Load preset layout',    action:'load_preset',   value:'quad-chart'       },
  { id:'p4',      label:'Layout: News Trading',   description:'Load preset layout',    action:'load_preset',   value:'news-trading'     },
  { id:'p5',      label:'Layout: Macro Analysis', description:'Load preset layout',    action:'load_preset',   value:'macro-analysis'   },
  { id:'squawk',  label:'Toggle Squawk',description:'Enable/disable audio squawk',      action:'toggle_squawk' },
]

export function CommandPalette() {
  const commandOpen    = useTerminalStore(s => s.commandOpen)
  const setCommandOpen = useTerminalStore(s => s.setCommandOpen)
  const setSymbol      = useTerminalStore(s => s.setSelectedSymbol)
  const toggleSquawk   = useTerminalStore(s => s.toggleSquawk)
  const addWidget      = useWorkspaceManager(s => s.addWidget)
  const loadPreset     = useWorkspaceManager(s => s.loadPreset)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(!commandOpen) }
      if (e.key === 'Escape' && commandOpen) setCommandOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [commandOpen, setCommandOpen])

  const run = useCallback((cmd: Cmd) => {
    setCommandOpen(false)
    switch (cmd.action) {
      case 'select_symbol': setSymbol(cmd.value!); break
      case 'add_widget':    addWidget(cmd.value as WidgetId); break
      case 'load_preset':   loadPreset(cmd.value!); break
      case 'toggle_squawk': toggleSquawk(); break
    }
  }, [setCommandOpen, setSymbol, addWidget, loadPreset, toggleSquawk])

  const groups = [
    { label:'Pairs',    items: COMMANDS.filter(c => c.action === 'select_symbol') },
    { label:'Add widget', items: COMMANDS.filter(c => c.action === 'add_widget')  },
    { label:'Layouts',  items: COMMANDS.filter(c => c.action === 'load_preset')   },
    { label:'Actions',  items: COMMANDS.filter(c => c.action === 'toggle_squawk') },
  ]

  return (
    <AnimatePresence>
      {commandOpen && (
        <div
          style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:80, background:'rgba(0,0,0,0.72)' }}
          onClick={() => setCommandOpen(false)}
        >
          <motion.div
            initial={{ opacity:0, y:-14, scale:0.96 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-8, scale:0.97 }}
            transition={{ duration:.13 }}
            style={{ width:560 }}
            onClick={e => e.stopPropagation()}
          >
            <Command style={{ background:'#0f1520', border:'1px solid #2a3444', borderRadius:4, overflow:'hidden', fontFamily:"'Courier New',monospace" }}>
              <div style={{ borderBottom:'0.5px solid #1e2530', padding:'7px 12px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:10, color:'#5a6373', fontWeight:700 }}>⌘</span>
                <Command.Input autoFocus placeholder="Search pairs, layouts, widgets…"
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:11, fontFamily:'inherit' }} />
                <kbd style={{ fontSize:8, color:'#3d4a5a', border:'0.5px solid #2a3444', padding:'2px 5px', borderRadius:2 }}>ESC</kbd>
              </div>
              <Command.List style={{ maxHeight:380, overflowY:'auto' }}>
                <Command.Empty style={{ padding:'16px 12px', fontSize:10, color:'#5a6373', textAlign:'center' }}>No results.</Command.Empty>
                {groups.map(g => (
                  <Command.Group key={g.label} heading={g.label} style={{ padding:'2px 0' }}>
                    {g.items.map(cmd => (
                      <Command.Item
                        key={cmd.id}
                        value={`${cmd.label} ${cmd.description ?? ''}`}
                        onSelect={() => run(cmd)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 12px', cursor:'pointer', fontSize:11, color:'#c8cdd6' }}
                      >
                        <span style={{ color:'#f0b429', fontWeight:700, minWidth:130, fontSize:10 }}>{cmd.label}</span>
                        {cmd.description && <span style={{ color:'#5a6373', fontSize:9 }}>{cmd.description}</span>}
                        <span style={{ marginLeft:'auto', fontSize:8, color:'#2a3444', border:'0.5px solid #2a3444', padding:'1px 4px', borderRadius:2 }}>↵</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
