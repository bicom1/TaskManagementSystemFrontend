import { createElement } from 'react';
import { useThemeStore } from './theme';

/*
 * Chart colors for the current appearance. Recharts takes colors as SVG
 * attributes, which don't reliably resolve CSS variables, so charts read the
 * palette from here instead of the stylesheet. Light values are the originals.
 */
const PALETTES = {
  light: {
    grid: '#ececed',
    tick: '#8a8a93',
    primary: '#6f64c4',
    secondary: '#8f83d4',
    deep: '#4a4090',
    soft: '#e9e7f7',
    neutral: '#8a8a93',
    strong: '#3d3d3d',
  },
  dark: {
    grid: '#2a2a33',
    tick: '#9494a1',
    primary: '#8f86de',
    secondary: '#b3adf5',
    deep: '#6258c2',
    // Bars and legend text need to stand off the page, so the "soft" series is
    // a mid violet here rather than the pale lavender used on white.
    soft: '#6a60b8',
    neutral: '#7c7c89',
    strong: '#d0d0d8',
  },
};

// Recharts' built-in tooltip and legend are styled for white pages.
const DARK_TOOLTIP = {
  contentStyle: {
    backgroundColor: '#18181e',
    border: '1px solid #36363f',
    borderRadius: 10,
    color: '#ededf1',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
  },
  labelStyle: { color: '#ededf1', fontWeight: 600 },
  itemStyle: { color: '#d0d0d8' },
  cursor: { fill: 'rgba(255, 255, 255, 0.05)', stroke: '#36363f' },
};

export function useChartTheme() {
  const mode = useThemeStore((s) => s.resolved);
  const c = PALETTES[mode] || PALETTES.light;
  return {
    ...c,
    pie: [c.primary, c.secondary, c.deep, c.soft, c.neutral, c.strong],
    /** Axis tick props: <XAxis tick={chart.tickProps(12)} /> */
    tickProps: (fontSize = 12) => ({ fill: c.tick, fontSize }),
    /** Pie slice labels: drawn in the slice's own color by default, too dark on a dark page. */
    pieLabel: { fill: c.tick, fontSize: 12 },
    /** Spread onto <Tooltip {...chart.tooltip} /> */
    tooltip: mode === 'dark' ? DARK_TOOLTIP : {},
    /**
     * Spread onto <Legend {...chart.legend} />. Recharts paints each label in its
     * series color, which is unreadable at both ends — pale lavender on white
     * measured 1.2:1, deep violet on the dark page not much better.
     */
    legend: {
      wrapperStyle: { color: c.tick },
      formatter: (value) =>
        createElement('span', { style: { color: mode === 'dark' ? '#b6b6c1' : '#55555f' } }, value),
    },
  };
}
