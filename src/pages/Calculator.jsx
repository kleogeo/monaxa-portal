import { useState } from 'react'
import { Info, ChevronDown, ChevronUp, TrendingDown, TrendingUp, DollarSign, Percent, Calculator as CalcIcon, AlertTriangle, BarChart2, Target, Activity } from 'lucide-react'

// ─── Tooltip helper ───────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block ml-1.5">
      <Info
        size={13}
        className="text-brand-muted cursor-help hover:text-brand-gold transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute z-50 left-5 top-0 w-64 bg-[#1a1a1a] border border-brand-border rounded-lg p-3 text-xs text-brand-muted leading-relaxed shadow-xl">
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────
function Field({ label, value, onChange, tooltip, suffix, type = 'number', options }) {
  return (
    <div>
      <label className="flex items-center text-xs text-brand-muted mb-1.5">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold pr-12"
          />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs">{suffix}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Result box ───────────────────────────────────────────────────
function Result({ label, value, highlight, tooltip, sub }) {
  return (
    <div className={`rounded-lg p-3 border ${highlight ? 'bg-brand-gold/10 border-brand-gold/30' : 'bg-brand-dark border-brand-border'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-muted flex items-center">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </span>
        <span className={`text-sm font-bold font-display ${highlight ? 'text-brand-gold' : 'text-white'}`}>{value}</span>
      </div>
      {sub && <p className="text-xs text-brand-muted mt-1">{sub}</p>}
    </div>
  )
}

// ─── Calculator card ──────────────────────────────────────────────
function CalcCard({ title, icon: Icon, color = 'text-brand-gold', children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={color} />
          <span className="text-white font-medium text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-brand-border pt-4 space-y-3">{children}</div>}
    </div>
  )
}

// ─── Formatting helpers ───────────────────────────────────────────
const fmt = (n, d = 2) => isNaN(n) || !isFinite(n) ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtP = (n, d = 2) => isNaN(n) || !isFinite(n) ? '—' : `${fmt(n, d)}%`

// ═══════════════════════════════════════════════════════════════════
// CALCULATOR MODULES
// ═══════════════════════════════════════════════════════════════════

function PipValueCalc() {
  const [lotSize, setLotSize] = useState(1)
  const [pipSize, setPipSize] = useState(0.0001)
  const [contractSize, setContractSize] = useState(100000)
  const [accountCcy, setAccountCcy] = useState('USD')
  const [quoteCcy, setQuoteCcy] = useState('USD')
  const [rate, setRate] = useState(1)

  const pipValueQuote = lotSize * contractSize * pipSize
  const pipValueAccount = quoteCcy === accountCcy ? pipValueQuote : pipValueQuote / rate

  return (
    <CalcCard title="Pip Value" icon={Activity} color="text-blue-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} tooltip="Number of lots traded. 1 standard lot = 100,000 units." />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} tooltip="Size of one pip. For most pairs = 0.0001. For JPY pairs = 0.01." />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} tooltip="Units per lot. Standard = 100,000. Mini = 10,000. Micro = 1,000." />
        <Field label="Quote Currency Rate" value={rate} onChange={setRate} tooltip="Exchange rate of the quote currency to your account currency. If both are the same, leave as 1." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Pip Value (Quote CCY)" value={`${fmt(pipValueQuote, 4)}`} tooltip="Pip value in the quote currency of the pair." />
        <Result label="Pip Value (Account CCY)" value={`$${fmt(pipValueAccount, 4)}`} highlight tooltip="Formula: Lot × Contract Size × Pip Size ÷ Exchange Rate" />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">Lot Size × Contract Size × Pip Size / Rate</span></p>
    </CalcCard>
  )
}

function LotSizeCalc() {
  const [balance, setBalance] = useState(10000)
  const [riskPct, setRiskPct] = useState(1)
  const [slPips, setSlPips] = useState(20)
  const [pipValue, setPipValue] = useState(10)

  const riskAmount = (balance * riskPct) / 100
  const lotSize = riskAmount / (slPips * pipValue)

  return (
    <CalcCard title="Lot Size (Risk-Based)" icon={Target} color="text-green-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account Balance" value={balance} onChange={setBalance} suffix="$" tooltip="Your total trading account balance." />
        <Field label="Risk %" value={riskPct} onChange={setRiskPct} suffix="%" tooltip="Percentage of balance you're willing to risk per trade. Industry standard: 1–2%." />
        <Field label="Stop Loss (pips)" value={slPips} onChange={setSlPips} tooltip="Distance from entry to stop loss in pips." />
        <Field label="Pip Value (per lot)" value={pipValue} onChange={setPipValue} suffix="$" tooltip="Value of 1 pip for 1 standard lot in your account currency." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Risk Amount" value={`$${fmt(riskAmount)}`} tooltip="Balance × Risk %" />
        <Result label="Lot Size" value={fmt(lotSize, 4)} highlight tooltip="Formula: Risk Amount ÷ (SL Pips × Pip Value per Lot)" />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">(Balance × Risk%) ÷ (SL Pips × Pip Value)</span></p>
    </CalcCard>
  )
}

function MarginCalc() {
  const [tradeSize, setTradeSize] = useState(100000)
  const [leverage, setLeverage] = useState(30)
  const [price, setPrice] = useState(1.1000)
  const [ccy, setCcy] = useState('USD')

  const margin = (tradeSize * price) / leverage
  const marginPct = (1 / leverage) * 100

  return (
    <CalcCard title="Margin Required" icon={DollarSign} color="text-yellow-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Trade Size (units)" value={tradeSize} onChange={setTradeSize} tooltip="Total position size in base currency units." />
        <Field label="Leverage" value={leverage} onChange={setLeverage} tooltip="Leverage ratio (e.g. 30 = 30:1). CySEC max retail forex = 30:1." />
        <Field label="Entry Price" value={price} onChange={setPrice} tooltip="Current price of the instrument at entry." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Margin Required" value={`$${fmt(margin)}`} highlight tooltip="Formula: (Trade Size × Price) ÷ Leverage" />
        <Result label="Margin %" value={fmtP(marginPct)} tooltip="1 ÷ Leverage × 100" />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">(Units × Price) ÷ Leverage</span></p>
    </CalcCard>
  )
}

function MarginLevelCalc() {
  const [equity, setEquity] = useState(10000)
  const [usedMargin, setUsedMargin] = useState(1000)

  const marginLevel = (equity / usedMargin) * 100
  const status = marginLevel >= 200 ? { label: 'Safe', color: 'text-green-400' } :
    marginLevel >= 120 ? { label: 'Warning', color: 'text-yellow-400' } :
    marginLevel >= 100 ? { label: 'Margin Call Zone', color: 'text-orange-400' } :
    { label: 'Stop Out Risk', color: 'text-red-400' }

  return (
    <CalcCard title="Margin Level %" icon={Percent} color="text-orange-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equity" value={equity} onChange={setEquity} suffix="$" tooltip="Balance + floating P&L of all open positions." />
        <Field label="Used Margin" value={usedMargin} onChange={setUsedMargin} suffix="$" tooltip="Total margin locked in open positions." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Margin Level" value={fmtP(marginLevel)} highlight tooltip="Formula: (Equity ÷ Used Margin) × 100. Margin call typically at 100%, stop out at 50%." />
        <Result label="Status" value={<span className={status.color}>{status.label}</span>} />
      </div>
      <div className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2 space-y-1">
        <p>Formula: <span className="text-white">(Equity ÷ Used Margin) × 100</span></p>
        <p>🟢 &gt;200% Safe &nbsp; 🟡 120–200% Warning &nbsp; 🔴 &lt;100% Margin Call</p>
      </div>
    </CalcCard>
  )
}

function SlippageCalc() {
  const [expected, setExpected] = useState(1.1000)
  const [executed, setExecuted] = useState(1.1003)
  const [lotSize, setLotSize] = useState(1)
  const [contractSize, setContractSize] = useState(100000)
  const [pipSize, setPipSize] = useState(0.0001)

  const slipPips = Math.abs((executed - expected) / pipSize)
  const slipCost = slipPips * lotSize * contractSize * pipSize
  const slipPct = Math.abs((executed - expected) / expected) * 100

  return (
    <CalcCard title="Slippage" icon={AlertTriangle} color="text-red-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected Price" value={expected} onChange={setExpected} tooltip="The price you intended to enter at (requested price)." />
        <Field label="Executed Price" value={executed} onChange={setExecuted} tooltip="The actual fill price you received from the broker." />
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} tooltip="Number of lots in the trade." />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} tooltip="0.0001 for most pairs, 0.01 for JPY pairs." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Slippage (pips)" value={fmt(slipPips, 1)} highlight tooltip="|Executed − Expected| ÷ Pip Size" />
        <Result label="Cost ($)" value={`$${fmt(slipCost)}`} tooltip="Slippage Pips × Lot × Contract Size × Pip Size" />
        <Result label="Slippage %" value={fmtP(slipPct, 4)} tooltip="|Executed − Expected| ÷ Expected × 100" />
      </div>
    </CalcCard>
  )
}

function SwapCalc() {
  const [lotSize, setLotSize] = useState(1)
  const [swapRate, setSwapRate] = useState(-2.5)
  const [days, setDays] = useState(1)
  const [contractSize, setContractSize] = useState(100000)
  const [price, setPrice] = useState(1.1)

  // Swap = Lot × Contract Size × Price × (Swap Rate / 100) / 360 × Days
  const swapCost = lotSize * contractSize * price * (swapRate / 100) / 360 * days

  return (
    <CalcCard title="Swap / Overnight Fee" icon={Activity} color="text-purple-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} tooltip="Number of lots held overnight." />
        <Field label="Swap Rate (annual %)" value={swapRate} onChange={setSwapRate} suffix="%" tooltip="Annual swap rate as shown in MT4/MT5. Can be negative (cost) or positive (credit)." />
        <Field label="Days Held" value={days} onChange={setDays} tooltip="Number of nights the position is held. Wednesday triple swap (×3) is applied automatically by MT4/MT5." />
        <Field label="Current Price" value={price} onChange={setPrice} tooltip="Current market price of the instrument." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label={`Swap (${days} night${days > 1 ? 's' : ''})`} value={`$${fmt(swapCost)}`} highlight tooltip="Formula: Lots × Contract Size × Price × (Rate/100) ÷ 360 × Days" sub={swapCost < 0 ? 'Cost to you' : 'Credit to you'} />
        <Result label="Per Night" value={`$${fmt(swapCost / days)}`} />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Formula: <span className="text-white">Lots × Contract Size × Price × (Rate/100) ÷ 360 × Days</span></p>
    </CalcCard>
  )
}

function SpreadCalc() {
  const [ask, setAsk] = useState(1.10050)
  const [bid, setBid] = useState(1.10030)
  const [lotSize, setLotSize] = useState(1)
  const [pipSize, setPipSize] = useState(0.0001)
  const [contractSize, setContractSize] = useState(100000)

  const spreadPips = (ask - bid) / pipSize
  const spreadCost = spreadPips * lotSize * contractSize * pipSize

  return (
    <CalcCard title="Spread Cost" icon={BarChart2} color="text-cyan-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ask Price" value={ask} onChange={setAsk} tooltip="The price to buy (always higher than bid)." />
        <Field label="Bid Price" value={bid} onChange={setBid} tooltip="The price to sell (always lower than ask)." />
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Spread (pips)" value={fmt(spreadPips, 1)} highlight tooltip="(Ask − Bid) ÷ Pip Size" />
        <Result label="Cost ($)" value={`$${fmt(spreadCost)}`} tooltip="Spread Pips × Lot × Contract Size × Pip Size" />
      </div>
    </CalcCard>
  )
}

function PnLCalc() {
  const [direction, setDirection] = useState('buy')
  const [entry, setEntry] = useState(1.1000)
  const [exit, setExit] = useState(1.1050)
  const [lotSize, setLotSize] = useState(1)
  const [contractSize, setContractSize] = useState(100000)
  const [pipSize, setPipSize] = useState(0.0001)

  const priceDiff = direction === 'buy' ? exit - entry : entry - exit
  const pips = priceDiff / pipSize
  const pnl = pips * lotSize * contractSize * pipSize

  return (
    <CalcCard title="Profit / Loss" icon={TrendingUp} color="text-green-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Direction" value={direction} onChange={setDirection} options={[{ value: 'buy', label: 'Buy (Long)' }, { value: 'sell', label: 'Sell (Short)' }]} />
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} />
        <Field label="Entry Price" value={entry} onChange={setEntry} />
        <Field label="Exit Price" value={exit} onChange={setExit} />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} />
        <Field label="Contract Size" value={contractSize} onChange={setContractSize} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Result label="Pips" value={fmt(pips, 1)} />
        <Result label="P&L" value={`${pnl >= 0 ? '+' : ''}$${fmt(pnl)}`} highlight />
        <Result label="Status" value={<span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>{pnl >= 0 ? 'Profit' : 'Loss'}</span>} />
      </div>
    </CalcCard>
  )
}

function BreakevenCalc() {
  const [entry, setEntry] = useState(1.1000)
  const [commission, setCommission] = useState(7)
  const [spread, setSpread] = useState(1)
  const [swap, setSwap] = useState(0)
  const [lotSize, setLotSize] = useState(1)
  const [pipValue, setPipValue] = useState(10)

  const totalCostDollar = commission + (spread * pipValue * lotSize) + Math.abs(swap)
  const breakEvenPips = totalCostDollar / (pipValue * lotSize)
  const breakEvenPrice = entry + breakEvenPips * 0.0001

  return (
    <CalcCard title="Break Even Price" icon={Target} color="text-yellow-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Entry Price" value={entry} onChange={setEntry} tooltip="Your entry price." />
        <Field label="Commission ($)" value={commission} onChange={setCommission} suffix="$" tooltip="Round-trip commission paid to broker." />
        <Field label="Spread (pips)" value={spread} onChange={setSpread} tooltip="Spread cost in pips at entry." />
        <Field label="Swap ($)" value={swap} onChange={setSwap} suffix="$" tooltip="Overnight swap cost if held." />
        <Field label="Pip Value (per lot)" value={pipValue} onChange={setPipValue} suffix="$" tooltip="Value of 1 pip per 1 standard lot." />
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Total Cost" value={`$${fmt(totalCostDollar)}`} tooltip="Commission + Spread Cost + Swap" />
        <Result label="Break Even (pips)" value={fmt(breakEvenPips, 1)} highlight tooltip="Total Cost ÷ (Pip Value × Lots)" />
        <Result label="Break Even Price" value={fmt(breakEvenPrice, 5)} highlight />
      </div>
    </CalcCard>
  )
}

function RiskRewardCalc() {
  const [entry, setEntry] = useState(1.1000)
  const [sl, setSl] = useState(1.0950)
  const [tp, setTp] = useState(1.1100)
  const [pipSize, setPipSize] = useState(0.0001)

  const risk = Math.abs(entry - sl) / pipSize
  const reward = Math.abs(tp - entry) / pipSize
  const rr = reward / risk
  const winRateNeeded = (1 / (1 + rr)) * 100

  return (
    <CalcCard title="Risk / Reward Ratio" icon={BarChart2} color="text-indigo-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Entry Price" value={entry} onChange={setEntry} />
        <Field label="Stop Loss" value={sl} onChange={setSl} tooltip="Your stop loss price level." />
        <Field label="Take Profit" value={tp} onChange={setTp} tooltip="Your take profit price level." />
        <Field label="Pip Size" value={pipSize} onChange={setPipSize} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Risk (pips)" value={fmt(risk, 1)} tooltip="|Entry − SL| ÷ Pip Size" />
        <Result label="Reward (pips)" value={fmt(reward, 1)} tooltip="|TP − Entry| ÷ Pip Size" />
        <Result label="R:R Ratio" value={`1 : ${fmt(rr, 2)}`} highlight tooltip="Reward Pips ÷ Risk Pips. Aim for ≥1:2." />
        <Result label="Min Win Rate Needed" value={fmtP(winRateNeeded)} tooltip="1 ÷ (1 + R:R) × 100. The win rate needed to break even at this R:R." />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Min Win Rate = <span className="text-white">1 ÷ (1 + R:R) × 100</span></p>
    </CalcCard>
  )
}

function DrawdownCalc() {
  const [peak, setPeak] = useState(10000)
  const [trough, setTrough] = useState(8500)
  const [balance, setBalance] = useState(10000)
  const [dd, setDd] = useState(20)

  const drawdownAmt = peak - trough
  const drawdownPct = (drawdownAmt / peak) * 100
  const recoveryNeeded = (drawdownPct / (100 - drawdownPct)) * 100
  const balanceAfter = balance * (1 - dd / 100)
  const recoverTo = balance * (1 / (1 - dd / 100)) - balance

  return (
    <CalcCard title="Drawdown & Recovery" icon={TrendingDown} color="text-red-400">
      <div className="border border-brand-border rounded-lg p-3 mb-3">
        <p className="text-xs text-brand-gold font-medium mb-2">From Peak to Trough</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peak Balance ($)" value={peak} onChange={setPeak} tooltip="Highest account balance reached (equity peak)." />
          <Field label="Trough Balance ($)" value={trough} onChange={setTrough} tooltip="Lowest account balance after peak." />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Result label="Drawdown $" value={`$${fmt(drawdownAmt)}`} />
          <Result label="Drawdown %" value={fmtP(drawdownPct)} highlight tooltip="(Peak − Trough) ÷ Peak × 100" />
          <Result label="Recovery Needed" value={fmtP(recoveryNeeded)} tooltip="How much % gain needed to get back to peak. Formula: DD% ÷ (100% − DD%) × 100" sub="To get back to peak" />
        </div>
      </div>
      <div className="border border-brand-border rounded-lg p-3">
        <p className="text-xs text-brand-gold font-medium mb-2">Recovery Calculator</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starting Balance ($)" value={balance} onChange={setBalance} />
          <Field label="Drawdown %" value={dd} onChange={setDd} suffix="%" tooltip="Percentage of balance lost." />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Result label="Balance After DD" value={`$${fmt(balanceAfter)}`} />
          <Result label="Gain Needed to Recover" value={fmtP(recoverTo / balanceAfter * 100)} highlight tooltip="If you lose 50%, you need 100% gain to recover." />
        </div>
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Recovery = <span className="text-white">DD% ÷ (1 − DD%) — e.g. 50% loss needs 100% gain</span></p>
    </CalcCard>
  )
}

function MarginCallCalc() {
  const [balance, setBalance] = useState(10000)
  const [usedMargin, setUsedMargin] = useState(1000)
  const [mcLevel, setMcLevel] = useState(100)
  const [soLevel, setSoLevel] = useState(50)

  const marginCallEquity = usedMargin * (mcLevel / 100)
  const stopOutEquity = usedMargin * (soLevel / 100)
  const maxLoss = balance - marginCallEquity
  const maxLossPct = (maxLoss / balance) * 100

  return (
    <CalcCard title="Margin Call / Stop Out" icon={AlertTriangle} color="text-orange-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account Balance ($)" value={balance} onChange={setBalance} />
        <Field label="Used Margin ($)" value={usedMargin} onChange={setUsedMargin} tooltip="Total margin locked in open trades." />
        <Field label="Margin Call Level %" value={mcLevel} onChange={setMcLevel} suffix="%" tooltip="Margin level % at which broker issues margin call. Typically 100%." />
        <Field label="Stop Out Level %" value={soLevel} onChange={setSoLevel} suffix="%" tooltip="Margin level % at which broker closes positions. Typically 50% for retail." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Margin Call at Equity" value={`$${fmt(marginCallEquity)}`} tooltip="Used Margin × (MC Level / 100)" />
        <Result label="Stop Out at Equity" value={`$${fmt(stopOutEquity)}`} tooltip="Used Margin × (SO Level / 100)" />
        <Result label="Max Affordable Loss" value={`$${fmt(maxLoss)}`} highlight tooltip="Balance − Margin Call Equity" />
        <Result label="Max Loss %" value={fmtP(maxLossPct)} highlight />
      </div>
    </CalcCard>
  )
}

function WinRateCalc() {
  const [wins, setWins] = useState(60)
  const [losses, setLosses] = useState(40)
  const [avgWin, setAvgWin] = useState(150)
  const [avgLoss, setAvgLoss] = useState(100)

  const total = Number(wins) + Number(losses)
  const winRate = (wins / total) * 100
  const profitFactor = (wins * avgWin) / (losses * avgLoss)
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
  const totalPnl = wins * avgWin - losses * avgLoss

  return (
    <CalcCard title="Win Rate & Expectancy" icon={TrendingUp} color="text-green-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Winning Trades" value={wins} onChange={setWins} tooltip="Number of winning trades in your sample." />
        <Field label="Losing Trades" value={losses} onChange={setLosses} tooltip="Number of losing trades in your sample." />
        <Field label="Avg Win ($)" value={avgWin} onChange={setAvgWin} suffix="$" tooltip="Average profit per winning trade." />
        <Field label="Avg Loss ($)" value={avgLoss} onChange={setAvgLoss} suffix="$" tooltip="Average loss per losing trade." />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Win Rate" value={fmtP(winRate)} highlight tooltip="Wins ÷ Total Trades × 100" />
        <Result label="Profit Factor" value={fmt(profitFactor, 2)} highlight tooltip="(Wins × Avg Win) ÷ (Losses × Avg Loss). >1 = profitable. >1.5 = good." />
        <Result label="Expectancy per Trade" value={`$${fmt(expectancy)}`} highlight tooltip="(Win Rate × Avg Win) − (Loss Rate × Avg Loss). Should be positive." />
        <Result label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${fmt(totalPnl)}`} />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Expectancy = <span className="text-white">(WR × Avg Win) − (LR × Avg Loss)</span></p>
    </CalcCard>
  )
}

function KellyCalc() {
  const [winRate, setWinRate] = useState(55)
  const [rr, setRr] = useState(1.5)
  const [balance, setBalance] = useState(10000)

  const w = winRate / 100
  const l = 1 - w
  const kelly = ((w * rr) - l) / rr
  const kellyPct = kelly * 100
  const halfKelly = kellyPct / 2
  const riskAmount = balance * (halfKelly / 100)

  return (
    <CalcCard title="Kelly Criterion" icon={CalcIcon} color="text-pink-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Win Rate %" value={winRate} onChange={setWinRate} suffix="%" tooltip="Your historical win rate percentage." />
        <Field label="Risk/Reward Ratio" value={rr} onChange={setRr} tooltip="Average R:R ratio of your trades (e.g. 1.5 = 1:1.5)." />
        <Field label="Account Balance ($)" value={balance} onChange={setBalance} suffix="$" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Full Kelly %" value={fmtP(Math.max(0, kellyPct))} tooltip="Formula: ((W × R) − L) ÷ R. Theoretically optimal bet size." />
        <Result label="Half Kelly %" value={fmtP(Math.max(0, halfKelly))} highlight tooltip="Half Kelly is the practical recommendation — reduces volatility while preserving growth." />
        <Result label="Risk Amount (Half K)" value={`$${fmt(Math.max(0, riskAmount))}`} highlight />
        {kelly <= 0 && <Result label="⚠️ Warning" value="Edge is negative" sub="Your strategy is not profitable at these parameters" />}
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Kelly = <span className="text-white">((WR × R:R) − LR) ÷ R:R</span></p>
    </CalcCard>
  )
}

function CommissionCalc() {
  const [lotSize, setLotSize] = useState(1)
  const [commPerLot, setCommPerLot] = useState(7)
  const [trades, setTrades] = useState(1)
  const [type, setType] = useState('roundtrip')

  const perTrade = type === 'roundtrip' ? commPerLot : commPerLot / 2
  const totalComm = lotSize * perTrade * trades

  return (
    <CalcCard title="Commission Cost" icon={DollarSign} color="text-blue-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lot Size" value={lotSize} onChange={setLotSize} tooltip="Size of each trade in lots." />
        <Field label="Commission per Lot" value={commPerLot} onChange={setCommPerLot} suffix="$" tooltip="Broker's commission per lot. Some charge per side, some round-trip." />
        <Field label="Number of Trades" value={trades} onChange={setTrades} tooltip="How many trades to calculate total for." />
        <Field label="Type" value={type} onChange={setType} options={[{ value: 'roundtrip', label: 'Round Trip (open+close)' }, { value: 'oneside', label: 'One Side Only' }]} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Per Trade" value={`$${fmt(lotSize * perTrade)}`} />
        <Result label={`Total (${trades} trades)`} value={`$${fmt(totalComm)}`} highlight />
      </div>
    </CalcCard>
  )
}

function RecoveryFactorCalc() {
  const [netProfit, setNetProfit] = useState(5000)
  const [maxDD, setMaxDD] = useState(2000)
  const [balance, setBalance] = useState(10000)
  const [ddPct, setDdPct] = useState(20)

  const recoveryFactor = netProfit / maxDD
  const returnPct = (netProfit / balance) * 100

  return (
    <CalcCard title="Recovery Factor & Return" icon={TrendingUp} color="text-teal-400">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Net Profit ($)" value={netProfit} onChange={setNetProfit} suffix="$" tooltip="Total profit generated over the period." />
        <Field label="Max Drawdown ($)" value={maxDD} onChange={setMaxDD} suffix="$" tooltip="Largest peak-to-trough decline in dollar terms." />
        <Field label="Starting Balance ($)" value={balance} onChange={setBalance} suffix="$" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Result label="Recovery Factor" value={fmt(recoveryFactor, 2)} highlight tooltip="Net Profit ÷ Max Drawdown. >3 is excellent, >1.5 is acceptable." sub={recoveryFactor >= 3 ? '✅ Excellent' : recoveryFactor >= 1.5 ? '🟡 Acceptable' : '🔴 Poor'} />
        <Result label="Return on Balance" value={fmtP(returnPct)} highlight tooltip="Net Profit ÷ Starting Balance × 100" />
      </div>
      <p className="text-xs text-brand-muted bg-brand-dark rounded px-3 py-2">Recovery Factor = <span className="text-white">Net Profit ÷ Max Drawdown (aim &gt;1.5)</span></p>
    </CalcCard>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Position Sizing', value: 'sizing' },
  { label: 'Costs', value: 'costs' },
  { label: 'Risk', value: 'risk' },
  { label: 'Performance', value: 'perf' },
]

export default function Calculator() {
  const [activeCategory, setActiveCategory] = useState('all')

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Trading Calculator</h1>
        <p className="text-brand-muted text-sm mt-1">Full suite — all formulas use correct industry-standard equations</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === c.value ? 'bg-brand-gold text-black' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl px-4 py-3 text-xs text-brand-muted flex items-start gap-2">
        <Info size={13} className="text-brand-gold mt-0.5 flex-shrink-0" />
        <span>Click any calculator to expand it. Hover the <Info size={10} className="inline" /> icons for formula explanations. All calculations are live — results update as you type.</span>
      </div>

      {/* Calculators */}
      <div className="space-y-3">
        {/* Position Sizing */}
        {(activeCategory === 'all' || activeCategory === 'sizing') && (
          <>
            <p className="text-xs text-brand-muted uppercase tracking-widest pt-1">Position Sizing</p>
            <PipValueCalc />
            <LotSizeCalc />
            <MarginCalc />
          </>
        )}

        {/* Costs */}
        {(activeCategory === 'all' || activeCategory === 'costs') && (
          <>
            <p className="text-xs text-brand-muted uppercase tracking-widest pt-2">Trade Costs</p>
            <SlippageCalc />
            <SwapCalc />
            <SpreadCalc />
            <CommissionCalc />
            <BreakevenCalc />
          </>
        )}

        {/* Risk */}
        {(activeCategory === 'all' || activeCategory === 'risk') && (
          <>
            <p className="text-xs text-brand-muted uppercase tracking-widest pt-2">Risk Management</p>
            <MarginLevelCalc />
            <MarginCallCalc />
            <DrawdownCalc />
            <RiskRewardCalc />
            <PnLCalc />
          </>
        )}

        {/* Performance */}
        {(activeCategory === 'all' || activeCategory === 'perf') && (
          <>
            <p className="text-xs text-brand-muted uppercase tracking-widest pt-2">Performance Analysis</p>
            <WinRateCalc />
            <KellyCalc />
            <RecoveryFactorCalc />
          </>
        )}
      </div>
    </div>
  )
}
