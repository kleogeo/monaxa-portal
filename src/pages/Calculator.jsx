import { useState, useEffect } from 'react'
import { Info, ChevronDown, ChevronUp, TrendingDown, TrendingUp, DollarSign,
  Percent, Calculator as CalcIcon, AlertTriangle, BarChart2, Target, Activity,
  Star, Trophy } from 'lucide-react'

function useFavourites() {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calc_favs') || '[]') } catch { return [] }
  })
  const toggle = (id) => setFavs(prev => {
    const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    localStorage.setItem('calc_favs', JSON.stringify(next))
    return next
  })
  return [favs, toggle]
}

function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block ml-1.5">
      <Info size={13} className="text-brand-muted cursor-help hover:text-brand-gold transition-colors"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && <div className="absolute z-50 left-5 top-0 w-64 bg-[#1a1a1a] border border-brand-border rounded-lg p-3 text-xs text-brand-muted leading-relaxed shadow-xl">{text}</div>}
    </div>
  )
}

function Field({ label, value, onChange, tooltip, suffix, type = 'number', options, step }) {
  return (
    <div>
      <label className="flex items-center text-xs text-brand-muted mb-1.5">{label}{tooltip && <Tooltip text={tooltip} />}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input type={type} value={value} onChange={e => onChange(e.target.value)} step={step}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold pr-12" />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs">{suffix}</span>}
        </div>
      )}
    </div>
  )
}

function Result({ label, value, highlight, tooltip, sub, warn }) {
  return (
    <div className={`rounded-lg p-3 border ${warn ? 'bg-red-400/10 border-red-400/30' : highlight ? 'bg-brand-gold/10 border-brand-gold/30' : 'bg-brand-dark border-brand-border'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-muted flex items-center">{label}{tooltip && <Tooltip text={tooltip} />}</span>
        <span className={`text-sm font-bold font-display ${warn ? 'text-red-400' : highlight ? 'text-brand-gold' : 'text-white'}`}>{value}</span>
      </div>
      {sub && <p className="text-xs text-brand-muted mt-1">{sub}</p>}
    </div>
  )
}

function CalcCard({ id, title, icon: Icon, color = 'text-brand-gold', favs, onToggleFav, children }) {
  const [open, setOpen] = useState(false)
  const isFav = favs.includes(id)
  return (
    <div className={`bg-brand-surface border rounded-xl overflow-hidden transition-colors ${isFav ? 'border-brand-gold/40' : 'border-brand-border'}`}>
      <div className="flex items-center">
        <button onClick={() => setOpen(!open)} className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <Icon size={16} className={color} />
            <span className="text-white font-medium text-sm">{title}</span>
            {isFav && <span className="text-brand-gold text-[10px] bg-brand-gold/10 border border-brand-gold/20 px-1.5 py-0.5 rounded-full">starred</span>}
          </div>
          {open ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
        </button>
        <button onClick={() => onToggleFav(id)} title={isFav ? 'Remove favourite' : 'Add to favourites'}
          className={`px-4 py-4 transition-colors ${isFav ? 'text-brand-gold' : 'text-brand-border hover:text-brand-muted'}`}>
          <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
      {open && <div className="px-5 pb-5 border-t border-brand-border pt-4 space-y-3">{children}</div>}
    </div>
  )
}

const fmt  = (n, d = 2) => isNaN(n) || !isFinite(n) ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtP = (n, d = 2) => isNaN(n) || !isFinite(n) ? '—' : `${fmt(n, d)}%`

const INSTRUMENTS = [
  { value: 'forex',    label: 'Forex Major/Minor', contractSize: 100000, pipSize: 0.0001 },
  { value: 'forexJPY', label: 'Forex JPY pair',    contractSize: 100000, pipSize: 0.01   },
  { value: 'xauusd',  label: 'XAU/USD (Gold)',     contractSize: 100,    pipSize: 0.01   },
  { value: 'xagusd',  label: 'XAG/USD (Silver)',   contractSize: 5000,   pipSize: 0.001  },
  { value: 'oil',     label: 'Oil (WTI/Brent)',    contractSize: 1000,   pipSize: 0.01   },
  { value: 'us30',    label: 'US30 (Dow Jones)',    contractSize: 1,      pipSize: 1      },
  { value: 'nas100',  label: 'NAS100 (Nasdaq)',     contractSize: 1,      pipSize: 1      },
  { value: 'spx500',  label: 'SPX500 (S&P 500)',   contractSize: 1,      pipSize: 0.1    },
  { value: 'btcusd',  label: 'BTC/USD (Bitcoin)',  contractSize: 1,      pipSize: 1      },
  { value: 'custom',  label: 'Custom',             contractSize: 100000, pipSize: 0.0001 },
]

function useInst(defaultInst) {
  const [inst, setInst] = useState(defaultInst)
  const [contractSize, setContractSize] = useState(INSTRUMENTS.find(i => i.value === defaultInst)?.contractSize || 100000)
  const [pipSize, setPipSize] = useState(INSTRUMENTS.find(i => i.value === defaultInst)?.pipSize || 0.0001)
  useEffect(() => {
    const p = INSTRUMENTS.find(i => i.value === inst)
    if (p && inst !== 'custom') { setContractSize(p.contractSize); setPipSize(p.pipSize) }
  }, [inst])
  return { inst, setInst, contractSize, setContractSize, pipSize, setPipSize }
}

const INST_OPTIONS = INSTRUMENTS.map(i => ({ value: i.value, label: i.label }))

// ── 1. PIP VALUE ──────────────────────────────────────────────────
function PipValueCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize, pipSize, setPipSize } = useInst('forex')
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const pipValueQuote = volume * contractSize * pipSize
  const pipValueAcct  = pipValueQuote / rate
  return (
    <CalcCard id="pipvalue" title="Pip Value" icon={Activity} color="text-blue-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" tooltip="1.0 = standard, 0.1 = mini, 0.01 = micro" />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} tooltip="Units per lot — auto-fills per instrument" />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} step="0.0001" tooltip="Forex = 0.0001, JPY/Gold = 0.01" />
        <Field label="Quote→Account Rate" value={rate} onChange={setRate} tooltip="Leave 1 if quote CCY = account CCY" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Pip Value (Quote CCY)" value={fmt(pipValueQuote, 4)} tooltip="Volume × Contract Size × Pip Size" />
        <Result label="Pip Value (Acct CCY)" value={`$${fmt(pipValueAcct, 4)}`} highlight tooltip="÷ Quote→Account Rate" />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">Volume × Contract Size × Pip Size ÷ Rate</span></p>
    </CalcCard>
  )
}

// ── 2. LOT SIZE ───────────────────────────────────────────────────
function LotSizeCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize, pipSize, setPipSize } = useInst('forex')
  const [balance, setBalance] = useState(10000)
  const [riskPct, setRiskPct] = useState(1)
  const [slPips, setSlPips] = useState(20)
  const [rate, setRate] = useState(1)
  const riskAmt       = (balance * riskPct) / 100
  const pipValPerLot  = (contractSize * pipSize) / rate
  const lotSize       = riskAmt / (slPips * pipValPerLot)
  return (
    <CalcCard id="lotsize" title="Lot Size (Risk-Based)" icon={Target} color="text-green-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Account Balance ($)" value={balance} onChange={setBalance} suffix="$" />
        <Field label="Risk %" value={riskPct} onChange={setRiskPct} suffix="%" tooltip="1–2% recommended per trade" />
        <Field label="Stop Loss (pips)" value={slPips} onChange={setSlPips} />
        <Field label="Quote→Account Rate" value={rate} onChange={setRate} tooltip="Leave 1 if same currency" />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} step="0.0001" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Risk Amount" value={`$${fmt(riskAmt)}`} />
        <Result label="Pip Value / Lot" value={`$${fmt(pipValPerLot, 4)}`} />
        <Result label="Lot Size" value={fmt(lotSize, 4)} highlight tooltip="Risk Amount ÷ (SL Pips × Pip Value per Lot)" />
        <Result label="Rounded (2dp)" value={fmt(Math.floor(lotSize * 100) / 100, 2)} />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">(Balance × Risk%) ÷ (SL Pips × Pip Value per Lot)</span></p>
    </CalcCard>
  )
}

// ── 3. MARGIN (+ REVERSE LEVERAGE) ───────────────────────────────
function MarginCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize } = useInst('forex')
  const [mode, setMode] = useState('margin')
  const [volume, setVolume] = useState(1)
  const [price, setPrice] = useState(1.1000)
  const [leverage, setLeverage] = useState(30)
  const [marginInput, setMarginInput] = useState(3667)
  const [balance, setBalance] = useState(10000)
  const [rate, setRate] = useState(1)

  const posVal   = (volume * contractSize * price) / rate
  const margin   = posVal / leverage
  const mPct     = (1 / leverage) * 100
  const freeMgn  = balance - margin
  const mOfBal   = (margin / balance) * 100
  const impLev   = posVal / marginInput
  const impMPct  = (1 / impLev) * 100

  return (
    <CalcCard id="margin" title="Margin Required" icon={DollarSign} color="text-yellow-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="flex gap-2 mb-1">
        {[['margin','Find Margin'],['leverage','Find Leverage']].map(([v,l]) => (
          <button key={v} onClick={() => setMode(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${mode === v ? 'bg-brand-gold text-black' : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" tooltip="1.0 = standard lot" />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} tooltip="Auto-fills: XAUUSD=100oz · Forex=100,000 · US30=1" />
        <Field label="Entry Price" value={price} onChange={setPrice} step="0.00001" />
        <Field label="Quote→Account Rate" value={rate} onChange={setRate} tooltip="1 if quote CCY = account CCY" />
        {mode === 'margin'
          ? <Field label="Leverage" value={leverage} onChange={setLeverage} tooltip="CySEC limits — Forex Major:30:1 · Gold:20:1 · Index:20:1 · Crypto:2:1" />
          : <Field label="Available Margin ($)" value={marginInput} onChange={setMarginInput} suffix="$" tooltip="Enter the margin you have to find implied leverage" />
        }
        <Field label="Account Balance ($)" value={balance} onChange={setBalance} suffix="$" />
      </div>
      {mode === 'margin' ? (
        <>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Result label="Position Value" value={`$${fmt(posVal)}`} tooltip="Volume × Contract Size × Price ÷ Rate" />
            <Result label="Margin Required" value={`$${fmt(margin)}`} highlight tooltip="Position Value ÷ Leverage" />
            <Result label="Margin %" value={fmtP(mPct)} tooltip="1 ÷ Leverage × 100" />
            <Result label="Free Margin" value={`$${fmt(freeMgn)}`} warn={freeMgn < 0} />
            <Result label="Margin of Balance" value={fmtP(mOfBal)} />
          </div>
          <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">(Volume × Contract Size × Price ÷ Rate) ÷ Leverage</span></p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Result label="Position Value" value={`$${fmt(posVal)}`} />
            <Result label="Implied Leverage" value={`${fmt(impLev, 1)}:1`} highlight tooltip="Position Value ÷ Margin" />
            <Result label="Margin %" value={fmtP(impMPct)} />
            <Result label="Free Margin" value={`$${fmt(balance - marginInput)}`} warn={balance - marginInput < 0} />
          </div>
          <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Reverse: <span className="text-white">Leverage = (Volume × Contract Size × Price) ÷ Margin</span></p>
        </>
      )}
      <div className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">
        <p className="text-brand-gold font-medium mb-1">CySEC Retail Max Leverage</p>
        <p>Forex Major: 30:1 · Forex Minor: 20:1 · Gold: 20:1 · Major Index: 20:1 · Commodity: 10:1 · Crypto: 2:1</p>
      </div>
    </CalcCard>
  )
}

// ── 4. MARGIN LEVEL ───────────────────────────────────────────────
function MarginLevelCalc({ favs, onToggleFav }) {
  const [equity, setEquity] = useState(10000)
  const [usedMargin, setUsedMargin] = useState(1000)
  const ml = (equity / usedMargin) * 100
  const status = ml >= 200 ? { l: 'Safe', c: 'text-green-400' } : ml >= 120 ? { l: 'Warning Zone', c: 'text-yellow-400' } : ml >= 100 ? { l: 'Margin Call Zone', c: 'text-orange-400' } : { l: 'Stop Out Risk', c: 'text-red-400' }
  return (
    <CalcCard id="marginlevel" title="Margin Level %" icon={Percent} color="text-orange-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equity ($)" value={equity} onChange={setEquity} suffix="$" tooltip="Balance + all floating P&L" />
        <Field label="Used Margin ($)" value={usedMargin} onChange={setUsedMargin} suffix="$" tooltip="Sum of margin locked in all open positions" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Margin Level" value={fmtP(ml)} highlight tooltip="(Equity ÷ Used Margin) × 100" />
        <Result label="Status" value={<span className={status.c}>{status.l}</span>} />
      </div>
      <div className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">
        <p>Formula: <span className="text-white">(Equity ÷ Used Margin) × 100</span></p>
        <p className="mt-0.5">🟢 &gt;200% Safe · 🟡 120% Warning · 🟠 100% Margin Call · 🔴 Below SO% Stop Out</p>
      </div>
    </CalcCard>
  )
}

// ── 5. SLIPPAGE ───────────────────────────────────────────────────
function SlippageCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize, pipSize, setPipSize } = useInst('forex')
  const [expected, setExpected] = useState(1.1000)
  const [executed, setExecuted] = useState(1.1003)
  const [volume, setVolume] = useState(1)
  const slipPips = Math.abs((executed - expected) / pipSize)
  const slipCost = slipPips * volume * contractSize * pipSize
  const slipPct  = Math.abs((executed - expected) / expected) * 100
  return (
    <CalcCard id="slippage" title="Slippage" icon={AlertTriangle} color="text-red-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Expected Price" value={expected} onChange={setExpected} step="0.00001" />
        <Field label="Executed Price" value={executed} onChange={setExecuted} step="0.00001" />
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} step="0.0001" />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1">
        <Result label="Slippage (pips)" value={fmt(slipPips, 1)} highlight />
        <Result label="Cost ($)" value={`$${fmt(slipCost)}`} highlight tooltip="Pips × Volume × Contract Size × Pip Size" />
        <Result label="Slippage %" value={fmtP(slipPct, 4)} />
      </div>
    </CalcCard>
  )
}

// ── 6. SWAP ───────────────────────────────────────────────────────
function SwapCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize } = useInst('forex')
  const [volume, setVolume] = useState(1)
  const [swapRate, setSwapRate] = useState(-2.5)
  const [days, setDays] = useState(1)
  const [price, setPrice] = useState(1.1)
  const swapPerDay = volume * contractSize * price * (swapRate / 100) / 360
  const swapTotal  = swapPerDay * days
  return (
    <CalcCard id="swap" title="Swap / Overnight Fee" icon={Activity} color="text-purple-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} />
        <Field label="Swap Rate (annual %)" value={swapRate} onChange={setSwapRate} suffix="%" tooltip="From MT5 spec. Negative = you pay." />
        <Field label="Days Held" value={days} onChange={setDays} tooltip="Wed = ×3. Enter actual calendar nights." />
        <Field label="Current Price" value={price} onChange={setPrice} step="0.00001" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Per Night" value={`$${fmt(swapPerDay)}`} sub={swapPerDay < 0 ? 'You pay' : 'You receive'} />
        <Result label={`Total (${days} night${days > 1 ? 's' : ''})`} value={`$${fmt(swapTotal)}`} highlight sub={swapTotal < 0 ? 'Total cost' : 'Total credit'} />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">Volume × Contract Size × Price × (Rate/100) ÷ 360 × Days</span></p>
    </CalcCard>
  )
}

// ── 7. SPREAD ─────────────────────────────────────────────────────
function SpreadCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize, pipSize, setPipSize } = useInst('forex')
  const [ask, setAsk] = useState(1.10050)
  const [bid, setBid] = useState(1.10030)
  const [volume, setVolume] = useState(1)
  const spreadPips = (ask - bid) / pipSize
  const spreadCost = spreadPips * volume * contractSize * pipSize
  return (
    <CalcCard id="spread" title="Spread Cost" icon={BarChart2} color="text-cyan-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Ask Price" value={ask} onChange={setAsk} step="0.00001" tooltip="Price to buy" />
        <Field label="Bid Price" value={bid} onChange={setBid} step="0.00001" tooltip="Price to sell" />
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} step="0.0001" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Spread (pips)" value={fmt(spreadPips, 1)} highlight tooltip="(Ask − Bid) ÷ Pip Size" />
        <Result label="Spread Cost ($)" value={`$${fmt(spreadCost)}`} highlight tooltip="Spread Pips × Volume × Contract Size × Pip Size" />
      </div>
    </CalcCard>
  )
}

// ── 8. P&L ────────────────────────────────────────────────────────
function PnLCalc({ favs, onToggleFav }) {
  const { inst, setInst, contractSize, setContractSize, pipSize, setPipSize } = useInst('forex')
  const [direction, setDirection] = useState('buy')
  const [entry, setEntry] = useState(1.1000)
  const [exit, setExit] = useState(1.1050)
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const diff = direction === 'buy' ? exit - entry : entry - exit
  const pips = diff / pipSize
  const pnl  = (pips * volume * contractSize * pipSize) / rate
  return (
    <CalcCard id="pnl" title="Profit / Loss" icon={TrendingUp} color="text-green-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Direction" value={direction} onChange={setDirection} options={[{ value: 'buy', label: 'Buy (Long)' }, { value: 'sell', label: 'Sell (Short)' }]} />
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" />
        <Field label="Entry Price" value={entry} onChange={setEntry} step="0.00001" />
        <Field label="Exit Price" value={exit} onChange={setExit} step="0.00001" />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} />
        <Field label="Quote→Account Rate" value={rate} onChange={setRate} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1">
        <Result label="Pips" value={fmt(pips, 1)} />
        <Result label="P&L" value={`${pnl >= 0 ? '+' : ''}$${fmt(pnl)}`} highlight />
        <Result label="Status" value={<span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>{pnl >= 0 ? 'Profit' : 'Loss'}</span>} />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">Pips × Volume × Contract Size × Pip Size ÷ Rate</span></p>
    </CalcCard>
  )
}

// ── 9. BREAK EVEN ─────────────────────────────────────────────────
function BreakevenCalc({ favs, onToggleFav }) {
  const { inst, setInst, pipSize, setPipSize } = useInst('forex')
  const [entry, setEntry] = useState(1.1000)
  const [commission, setCommission] = useState(7)
  const [spreadPips, setSpreadPips] = useState(1)
  const [swap, setSwap] = useState(0)
  const [volume, setVolume] = useState(1)
  const [pipValue, setPipValue] = useState(10)
  const spreadCost = spreadPips * pipValue * volume
  const totalCost  = Number(commission) + spreadCost + Math.abs(swap)
  const bePips     = totalCost / (pipValue * volume)
  const bePrice    = Number(entry) + bePips * pipSize
  return (
    <CalcCard id="breakeven" title="Break Even Price" icon={Target} color="text-yellow-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Entry Price" value={entry} onChange={setEntry} step="0.00001" />
        <Field label="Commission ($)" value={commission} onChange={setCommission} suffix="$" tooltip="Round-trip commission total" />
        <Field label="Spread (pips)" value={spreadPips} onChange={setSpreadPips} />
        <Field label="Swap ($)" value={swap} onChange={setSwap} suffix="$" />
        <Field label="Pip Value (per lot)" value={pipValue} onChange={setPipValue} suffix="$" />
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Total Cost" value={`$${fmt(totalCost)}`} />
        <Result label="Break Even (pips)" value={fmt(bePips, 1)} highlight />
        <Result label="Break Even Price" value={fmt(bePrice, 5)} highlight />
      </div>
    </CalcCard>
  )
}

// ── 10. RISK / REWARD ─────────────────────────────────────────────
function RiskRewardCalc({ favs, onToggleFav }) {
  const { inst, setInst, pipSize, setPipSize } = useInst('forex')
  const [entry, setEntry] = useState(1.1000)
  const [sl, setSl] = useState(1.0950)
  const [tp, setTp] = useState(1.1100)
  const risk   = Math.abs(entry - sl) / pipSize
  const reward = Math.abs(tp - entry) / pipSize
  const rr     = reward / risk
  const minWR  = (1 / (1 + rr)) * 100
  return (
    <CalcCard id="rr" title="Risk / Reward Ratio" icon={BarChart2} color="text-indigo-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Instrument" value={inst} onChange={setInst} options={INST_OPTIONS} /></div>
        <Field label="Entry Price" value={entry} onChange={setEntry} step="0.00001" />
        <Field label="Stop Loss" value={sl} onChange={setSl} step="0.00001" />
        <Field label="Take Profit" value={tp} onChange={setTp} step="0.00001" />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} step="0.0001" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Risk (pips)" value={fmt(risk, 1)} />
        <Result label="Reward (pips)" value={fmt(reward, 1)} />
        <Result label="R:R Ratio" value={`1 : ${fmt(rr, 2)}`} highlight tooltip="Aim for at least 1:2" />
        <Result label="Min Win Rate Needed" value={fmtP(minWR)} tooltip="1 ÷ (1 + R:R) × 100" />
      </div>
    </CalcCard>
  )
}

// ── 11. DRAWDOWN ──────────────────────────────────────────────────
function DrawdownCalc({ favs, onToggleFav }) {
  const [peak, setPeak] = useState(10000)
  const [trough, setTrough] = useState(8500)
  const [balance, setBalance] = useState(10000)
  const [dd, setDd] = useState(20)
  const ddAmt  = peak - trough
  const ddPct  = (ddAmt / peak) * 100
  const recov  = (ddPct / (100 - ddPct)) * 100
  const balAft = balance * (1 - dd / 100)
  const gain   = (dd / (100 - dd)) * 100
  return (
    <CalcCard id="drawdown" title="Drawdown & Recovery" icon={TrendingDown} color="text-red-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="border border-brand-border rounded-lg p-3 mb-2">
        <p className="text-xs text-brand-gold font-medium mb-2">Peak → Trough</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peak Balance ($)" value={peak} onChange={setPeak} />
          <Field label="Trough Balance ($)" value={trough} onChange={setTrough} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Result label="Drawdown $" value={`$${fmt(ddAmt)}`} />
          <Result label="Drawdown %" value={fmtP(ddPct)} highlight />
          <Result label="Recovery Needed" value={fmtP(recov)} highlight sub="To return to peak" tooltip="DD% ÷ (100% − DD%)" />
        </div>
      </div>
      <div className="border border-brand-border rounded-lg p-3">
        <p className="text-xs text-brand-gold font-medium mb-2">Recovery Calculator</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starting Balance ($)" value={balance} onChange={setBalance} />
          <Field label="Drawdown %" value={dd} onChange={setDd} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Result label="Balance After DD" value={`$${fmt(balAft)}`} />
          <Result label="Gain to Recover" value={fmtP(gain)} highlight tooltip="50% loss needs 100% gain to recover" />
        </div>
      </div>
    </CalcCard>
  )
}

// ── 12. MARGIN CALL / STOP OUT ────────────────────────────────────
function MarginCallCalc({ favs, onToggleFav }) {
  const [balance, setBalance] = useState(10000)
  const [usedMargin, setUsedMargin] = useState(1000)
  const [mcLevel, setMcLevel] = useState(100)
  const [soLevel, setSoLevel] = useState(50)
  const mcEq    = usedMargin * (mcLevel / 100)
  const soEq    = usedMargin * (soLevel / 100)
  const maxLoss = balance - mcEq
  const mlPct   = (maxLoss / balance) * 100
  const floatSO = soEq - balance
  return (
    <CalcCard id="mc" title="Margin Call / Stop Out" icon={AlertTriangle} color="text-orange-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account Balance ($)" value={balance} onChange={setBalance} />
        <Field label="Used Margin ($)" value={usedMargin} onChange={setUsedMargin} tooltip="Total margin in open trades" />
        <Field label="Margin Call Level %" value={mcLevel} onChange={setMcLevel} suffix="%" tooltip="Typically 100%" />
        <Field label="Stop Out Level %" value={soLevel} onChange={setSoLevel} suffix="%" tooltip="Monaxa retail default: 50%" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Margin Call Equity" value={`$${fmt(mcEq)}`} tooltip="Used Margin × MC% / 100" />
        <Result label="Stop Out Equity" value={`$${fmt(soEq)}`} warn={soEq > balance} />
        <Result label="Max Loss Before MC" value={`$${fmt(maxLoss)}`} highlight />
        <Result label="Max Loss %" value={fmtP(mlPct)} highlight />
        <Result label="Float P&L at Stop Out" value={`$${fmt(floatSO)}`} warn={floatSO < 0} tooltip="Floating loss needed to trigger stop out" />
      </div>
    </CalcCard>
  )
}

// ── 13. WIN RATE ──────────────────────────────────────────────────
function WinRateCalc({ favs, onToggleFav }) {
  const [wins, setWins] = useState(60)
  const [losses, setLosses] = useState(40)
  const [avgWin, setAvgWin] = useState(150)
  const [avgLoss, setAvgLoss] = useState(100)
  const total  = Number(wins) + Number(losses)
  const wr     = (wins / total) * 100
  const lr     = 100 - wr
  const pf     = (wins * avgWin) / (losses * avgLoss)
  const exp    = (wr / 100) * avgWin - (lr / 100) * avgLoss
  const tPnl   = wins * avgWin - losses * avgLoss
  return (
    <CalcCard id="winrate" title="Win Rate & Expectancy" icon={TrendingUp} color="text-green-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Winning Trades" value={wins} onChange={setWins} />
        <Field label="Losing Trades" value={losses} onChange={setLosses} />
        <Field label="Avg Win ($)" value={avgWin} onChange={setAvgWin} suffix="$" />
        <Field label="Avg Loss ($)" value={avgLoss} onChange={setAvgLoss} suffix="$" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Win Rate" value={fmtP(wr)} highlight />
        <Result label="Profit Factor" value={fmt(pf, 2)} highlight
          sub={pf >= 2 ? '✅ Excellent' : pf >= 1.5 ? '🟡 Good' : pf >= 1 ? '⚠️ Marginal' : '🔴 Unprofitable'}
          tooltip="Gross Profit ÷ Gross Loss. >1.5 good, >2 excellent." />
        <Result label="Expectancy / Trade" value={`$${fmt(exp)}`} highlight tooltip="(WR × Avg Win) − (LR × Avg Loss)" />
        <Result label="Total P&L" value={`${tPnl >= 0 ? '+' : ''}$${fmt(tPnl)}`} />
      </div>
    </CalcCard>
  )
}

// ── 14. KELLY ─────────────────────────────────────────────────────
function KellyCalc({ favs, onToggleFav }) {
  const [winRate, setWinRate] = useState(55)
  const [rr, setRr] = useState(1.5)
  const [balance, setBalance] = useState(10000)
  const w = winRate / 100, l = 1 - w
  const kelly = ((w * rr) - l) / rr
  const kPct  = kelly * 100
  const hk    = kPct / 2
  const amt   = balance * (Math.max(0, hk) / 100)
  return (
    <CalcCard id="kelly" title="Kelly Criterion" icon={CalcIcon} color="text-pink-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Win Rate %" value={winRate} onChange={setWinRate} suffix="%" />
        <Field label="Avg R:R" value={rr} onChange={setRr} tooltip="Average reward ÷ average risk" />
        <Field label="Account Balance ($)" value={balance} onChange={setBalance} suffix="$" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Full Kelly %" value={fmtP(Math.max(0, kPct))} tooltip="Theoretical max — too volatile in practice" />
        <Result label="Half Kelly % (use this)" value={fmtP(Math.max(0, hk))} highlight />
        <Result label="Risk Amount (Half Kelly)" value={`$${fmt(amt)}`} highlight />
        {kelly <= 0 && <Result label="Warning" value="Negative edge" sub="Not profitable at these parameters" warn />}
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Kelly = <span className="text-white">((WR × R:R) − LR) ÷ R:R</span></p>
    </CalcCard>
  )
}

// ── 15. COMMISSION ────────────────────────────────────────────────
function CommissionCalc({ favs, onToggleFav }) {
  const [volume, setVolume] = useState(1)
  const [commPerLot, setCommPerLot] = useState(7)
  const [trades, setTrades] = useState(1)
  const [type, setType] = useState('roundtrip')
  const perTrade  = type === 'roundtrip' ? commPerLot : commPerLot / 2
  const totalComm = volume * perTrade * trades
  return (
    <CalcCard id="commission" title="Commission Cost" icon={DollarSign} color="text-blue-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Volume (lots)" value={volume} onChange={setVolume} step="0.01" />
        <Field label="Commission per Lot ($)" value={commPerLot} onChange={setCommPerLot} suffix="$" tooltip="Check if per side or round-trip" />
        <Field label="Number of Trades" value={trades} onChange={setTrades} />
        <Field label="Type" value={type} onChange={setType} options={[{ value: 'roundtrip', label: 'Round Trip' }, { value: 'oneside', label: 'One Side Only' }]} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Per Trade" value={`$${fmt(volume * perTrade)}`} />
        <Result label={`Total (${trades} trade${trades > 1 ? 's' : ''})`} value={`$${fmt(totalComm)}`} highlight />
      </div>
    </CalcCard>
  )
}

// ── 16. RECOVERY FACTOR ───────────────────────────────────────────
function RecoveryFactorCalc({ favs, onToggleFav }) {
  const [netProfit, setNetProfit] = useState(5000)
  const [maxDD, setMaxDD] = useState(2000)
  const [balance, setBalance] = useState(10000)
  const rf  = netProfit / maxDD
  const ret = (netProfit / balance) * 100
  return (
    <CalcCard id="recovery" title="Recovery Factor & Return" icon={TrendingUp} color="text-teal-400" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Net Profit ($)" value={netProfit} onChange={setNetProfit} suffix="$" />
        <Field label="Max Drawdown ($)" value={maxDD} onChange={setMaxDD} suffix="$" />
        <Field label="Starting Balance ($)" value={balance} onChange={setBalance} suffix="$" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Result label="Recovery Factor" value={fmt(rf, 2)} highlight
          sub={rf >= 3 ? '✅ Excellent' : rf >= 1.5 ? '🟡 Acceptable' : '🔴 Poor'}
          tooltip="Net Profit ÷ Max Drawdown — aim >1.5" />
        <Result label="Return on Balance" value={fmtP(ret)} highlight />
      </div>
    </CalcCard>
  )
}

// ── 17. PROP CHALLENGE ────────────────────────────────────────────
const PROP_FIRMS = [
  { value: 'ftmo',   label: 'FTMO',                  phases: [{ name: 'Challenge', pt: 10, dl: 5, tl: 10, min: 4, max: 30 }, { name: 'Verification', pt: 5, dl: 5, tl: 10, min: 4, max: 60 }] },
  { value: 'mff',    label: 'My Forex Funds (Rapid)', phases: [{ name: 'Phase 1', pt: 8,  dl: 5, tl: 12, min: 0, max: 30 }, { name: 'Phase 2', pt: 5, dl: 5, tl: 12, min: 0, max: 60 }] },
  { value: 'e8',     label: 'E8 Funding',             phases: [{ name: 'Evaluation', pt: 8, dl: 5, tl: 8,  min: 0, max: 0  }] },
  { value: 'fte',    label: 'Funded Trading Plus',    phases: [{ name: 'Phase 1', pt: 8,  dl: 4, tl: 8,  min: 0, max: 0  }, { name: 'Phase 2', pt: 5, dl: 4, tl: 8, min: 0, max: 0 }] },
  { value: 'apex',   label: 'Apex Trader Funding',    phases: [{ name: 'Evaluation', pt: 6, dl: 3, tl: 6,  min: 0, max: 0  }] },
  { value: 'tff',    label: 'The Funded Trader',      phases: [{ name: 'Phase 1', pt: 8,  dl: 5, tl: 10, min: 0, max: 30 }, { name: 'Phase 2', pt: 5, dl: 5, tl: 10, min: 0, max: 60 }] },
  { value: 'fxify',  label: 'FXIFY',                  phases: [{ name: 'Phase 1', pt: 10, dl: 5, tl: 10, min: 0, max: 30 }, { name: 'Phase 2', pt: 5, dl: 5, tl: 10, min: 0, max: 60 }] },
  { value: 'custom', label: 'Custom / Other',         phases: [{ name: 'Phase 1', pt: 10, dl: 5, tl: 10, min: 0, max: 30 }] },
]

function PropChallengeCalc({ favs, onToggleFav }) {
  const [firm, setFirm] = useState('ftmo')
  const [pi, setPi] = useState(0)
  const [accSize, setAccSize] = useState(10000)
  const [curBal, setCurBal] = useState(10000)
  const [dayBal, setDayBal] = useState(10000)
  const [days, setDays] = useState(0)
  const [cPT, setCPT] = useState(10), [cDL, setCDL] = useState(5), [cTL, setCTL] = useState(10)
  const [cMin, setCMin] = useState(0), [cMax, setCMax] = useState(30)

  const fd    = PROP_FIRMS.find(f => f.value === firm)
  const ph    = fd.phases[Math.min(pi, fd.phases.length - 1)]
  const ptPct = firm === 'custom' ? cPT : ph.pt
  const dlPct = firm === 'custom' ? cDL : ph.dl
  const tlPct = firm === 'custom' ? cTL : ph.tl
  const minD  = firm === 'custom' ? cMin : ph.min
  const maxD  = firm === 'custom' ? cMax : ph.max

  const ptAmt = accSize * ptPct / 100
  const dlAmt = accSize * dlPct / 100
  const tlAmt = accSize * tlPct / 100

  const tPnL  = curBal - accSize
  const tPct  = (tPnL / accSize) * 100
  const dPnL  = curBal - dayBal
  const dPct  = (dPnL / accSize) * 100

  const dUsed = (Math.abs(Math.min(0, dPnL)) / dlAmt) * 100
  const tUsed = (Math.abs(Math.min(0, tPnL)) / tlAmt) * 100

  const dLeft = dlAmt + Math.min(0, dPnL)
  const tLeft = tlAmt + Math.min(0, tPnL)
  const pLeft = ptAmt - Math.max(0, tPnL)

  const dBreach = dPnL <= -dlAmt
  const tBreach = tPnL <= -tlAmt
  const hit     = tPnL >= ptAmt
  const passed  = hit && !dBreach && !tBreach && (minD === 0 || days >= minD) && (maxD === 0 || days <= maxD)
  const safeR   = Math.min(dLeft, tLeft) * 0.5

  const sLabel = dBreach ? '❌ Daily Limit Breached — FAILED' : tBreach ? '❌ Max Drawdown Breached — FAILED' :
    passed ? '✅ Target Reached — PASS' : (dUsed > 80 || tUsed > 80) ? '⚠️ Danger Zone — Reduce Size' :
    dUsed > 50 ? '🟡 Caution — Past Half Daily Limit' : '🟢 On Track'
  const sStyle = dBreach || tBreach ? 'bg-red-400/10 border-red-400/30 text-red-400' :
    passed ? 'bg-green-400/10 border-green-400/30 text-green-400' :
    (dUsed > 80 || tUsed > 80) ? 'bg-orange-400/10 border-orange-400/30 text-orange-400' :
    'bg-brand-gold/5 border-brand-gold/20 text-brand-gold'

  return (
    <CalcCard id="prop" title="Prop Firm Challenge Tracker" icon={Trophy} color="text-brand-gold" favs={favs} onToggleFav={onToggleFav}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-brand-muted mb-1.5 block">Firm</label>
          <select value={firm} onChange={e => { setFirm(e.target.value); setPi(0) }}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold">
            {PROP_FIRMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        {firm !== 'custom' && fd.phases.length > 1 && (
          <div>
            <label className="text-xs text-brand-muted mb-1.5 block">Phase</label>
            <select value={pi} onChange={e => setPi(Number(e.target.value))}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold">
              {fd.phases.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {firm === 'custom' ? (
        <div className="border border-brand-border rounded-lg p-3 space-y-3">
          <p className="text-xs text-brand-gold font-medium">Custom Rules</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Profit Target %" value={cPT} onChange={setCPT} suffix="%" />
            <Field label="Max Daily Loss %" value={cDL} onChange={setCDL} suffix="%" />
            <Field label="Max Total Loss %" value={cTL} onChange={setCTL} suffix="%" />
            <Field label="Min Trading Days" value={cMin} onChange={setCMin} />
            <Field label="Max Days (0=none)" value={cMax} onChange={setCMax} />
          </div>
        </div>
      ) : (
        <div className="bg-brand-dark border border-brand-border rounded-lg p-3">
          <p className="text-xs text-brand-gold font-medium mb-2">{ph.name} — Official Rules</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><p className="text-brand-muted">Profit Target</p><p className="text-green-400 font-bold text-sm">{ptPct}%</p><p className="text-brand-muted">${fmt(ptAmt)}</p></div>
            <div><p className="text-brand-muted">Max Daily Loss</p><p className="text-red-400 font-bold text-sm">{dlPct}%</p><p className="text-brand-muted">${fmt(dlAmt)}</p></div>
            <div><p className="text-brand-muted">Max Total Loss</p><p className="text-red-400 font-bold text-sm">{tlPct}%</p><p className="text-brand-muted">${fmt(tlAmt)}</p></div>
            {minD > 0 && <div><p className="text-brand-muted">Min Days</p><p className="text-white font-bold text-sm">{minD}</p></div>}
            {maxD > 0 && <div><p className="text-brand-muted">Max Days</p><p className="text-white font-bold text-sm">{maxD}</p></div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Account Size ($)" value={accSize} onChange={setAccSize} suffix="$" tooltip="Starting challenge balance" />
        <Field label="Current Balance ($)" value={curBal} onChange={setCurBal} suffix="$" tooltip="Your balance right now" />
        <Field label="Day Start Balance ($)" value={dayBal} onChange={setDayBal} suffix="$" tooltip="Balance at start of today's session" />
        <Field label="Trading Days Done" value={days} onChange={setDays} tooltip="Days traded so far this phase" />
      </div>

      <div className={`rounded-lg p-3 border text-center ${sStyle}`}>
        <p className="font-bold text-sm">{sLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Result label="Total P&L" value={`${tPnL >= 0 ? '+' : ''}$${fmt(tPnL)} (${fmtP(tPct)})`} highlight={tPnL > 0} warn={tBreach} />
        <Result label="Daily P&L" value={`${dPnL >= 0 ? '+' : ''}$${fmt(dPnL)} (${fmtP(dPct)})`} highlight={dPnL > 0} warn={dBreach} />
        <Result label="Daily Loss Remaining" value={`$${fmt(Math.max(0, dLeft))}`} warn={dLeft < dlAmt * 0.25} highlight={dLeft >= dlAmt * 0.7} sub={`${fmtP(dUsed)} of limit used`} />
        <Result label="Total Loss Remaining" value={`$${fmt(Math.max(0, tLeft))}`} warn={tLeft < tlAmt * 0.25} highlight={tLeft >= tlAmt * 0.7} sub={`${fmtP(tUsed)} of limit used`} />
        <Result label="Profit Still Needed" value={pLeft > 0 ? `$${fmt(pLeft)}` : '✅ Target hit!'} highlight={pLeft <= 0} />
        <Result label="Safe Risk / Trade" value={`$${fmt(Math.max(0, safeR))}`} highlight tooltip="50% of smaller remaining buffer — suggested max risk per trade" />
        {minD > 0 && <Result label="Min Days Progress" value={`${days} / ${minD}`} highlight={days >= minD} />}
        {maxD > 0 && <Result label="Days Remaining" value={`${Math.max(0, maxD - days)}`} warn={maxD - days < 3} />}
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">
        <span className="text-brand-gold font-medium">Note: </span>
        Daily drawdown rules vary — FTMO uses floating equity, others use closed balance. Always verify with the firm's exact terms.
      </p>
    </CalcCard>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────
const CATEGORIES = [
  { label: '★ Favourites', value: 'favs' },
  { label: 'All', value: 'all' },
  { label: 'Position Sizing', value: 'sizing' },
  { label: 'Trade Costs', value: 'costs' },
  { label: 'Risk', value: 'risk' },
  { label: 'Performance', value: 'perf' },
  { label: '🏆 Prop', value: 'prop' },
]

export default function Calculator() {
  const [cat, setCat] = useState('all')
  const [favs, toggleFav] = useFavourites()
  const p = { favs, onToggleFav: toggleFav }
  const vis = (c, id) => cat === 'favs' ? favs.includes(id) : cat === 'all' || cat === c
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Trading Calculator</h1>
        <p className="text-brand-muted text-sm mt-1">Instrument-aware · Correct formulas · Reverse calculations · Prop challenge tracker</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCat(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cat === c.value ? 'bg-brand-gold text-black' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'}`}>
            {c.label}
            {c.value === 'favs' && favs.length > 0 && <span className="ml-1.5 bg-brand-gold/20 text-brand-gold text-[10px] rounded-full px-1.5 py-0.5">{favs.length}</span>}
          </button>
        ))}
      </div>
      {cat === 'favs' && favs.length === 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-xl px-5 py-8 text-center">
          <Star size={20} className="text-brand-muted mx-auto mb-2" />
          <p className="text-brand-muted text-sm">No favourites yet — click the ★ on any calculator to pin it here.</p>
        </div>
      )}
      <div className="space-y-3">
        {vis('sizing', 'pipvalue')    && <PipValueCalc {...p} />}
        {vis('sizing', 'lotsize')     && <LotSizeCalc {...p} />}
        {vis('sizing', 'margin')      && <MarginCalc {...p} />}
        {vis('risk',   'marginlevel') && <MarginLevelCalc {...p} />}
        {vis('costs',  'slippage')    && <SlippageCalc {...p} />}
        {vis('costs',  'swap')        && <SwapCalc {...p} />}
        {vis('costs',  'spread')      && <SpreadCalc {...p} />}
        {vis('risk',   'pnl')         && <PnLCalc {...p} />}
        {vis('costs',  'breakeven')   && <BreakevenCalc {...p} />}
        {vis('risk',   'rr')          && <RiskRewardCalc {...p} />}
        {vis('risk',   'drawdown')    && <DrawdownCalc {...p} />}
        {vis('risk',   'mc')          && <MarginCallCalc {...p} />}
        {vis('perf',   'winrate')     && <WinRateCalc {...p} />}
        {vis('perf',   'kelly')       && <KellyCalc {...p} />}
        {vis('costs',  'commission')  && <CommissionCalc {...p} />}
        {vis('perf',   'recovery')    && <RecoveryFactorCalc {...p} />}
        {vis('prop',   'prop')        && <PropChallengeCalc {...p} />}
      </div>
    </div>
  )
}
