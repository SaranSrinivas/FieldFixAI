import { AlertIcon, CompassIcon, FilmIcon, GearIcon, LightbulbIcon, ScanIcon, WrenchIcon } from './components/icons'

export const KIND_META = {
  machine: { icon: CompassIcon, label: 'Machine', badge: 'border-sky-500/40 bg-sky-500/10 text-sky-300', bar: 'bg-sky-400' },
  component: { icon: GearIcon, label: 'Component', badge: 'border-violet-500/40 bg-violet-500/10 text-violet-300', bar: 'bg-violet-400' },
  animation: { icon: FilmIcon, label: 'Animation', badge: 'border-amber-500/40 bg-amber-500/10 text-amber-300', bar: 'bg-amber-400' },
}
export const DEFAULT_KIND_META = { icon: CompassIcon, label: 'Catalog', badge: 'border-slate-600/40 bg-slate-700/20 text-slate-300', bar: 'bg-slate-400' }

export const SUGGESTION_THEME = {
  causes: {
    icon: LightbulbIcon,
    ring: 'border-slate-700',
    iconBg: 'bg-slate-800 text-slate-300',
    itemBorder: 'border-slate-800',
  },
  temporary_fixes: {
    icon: WrenchIcon,
    ring: 'border-emerald-800/60',
    iconBg: 'bg-emerald-500/15 text-emerald-300',
    itemBorder: 'border-emerald-900/50',
  },
  diagnostics: {
    icon: ScanIcon,
    ring: 'border-sky-800/60',
    iconBg: 'bg-sky-500/15 text-sky-300',
    itemBorder: 'border-sky-900/50',
  },
  safety_notes: {
    icon: AlertIcon,
    ring: 'border-amber-700/60',
    iconBg: 'bg-amber-500/15 text-amber-300',
    itemBorder: 'border-amber-900/50',
  },
}
