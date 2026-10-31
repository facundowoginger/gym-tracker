// Weights are stored in kg. These helpers convert for display and input.
const KG_PER_LB = 0.45359237

export const toDisplay = (kg, unit) => (unit === 'lbs' ? kg / KG_PER_LB : kg)
export const fromInput = (value, unit) => (unit === 'lbs' ? value * KG_PER_LB : value)

// Rounds to at most one decimal and adds the unit, e.g. "82.5 kg".
export function formatWeight(kg, unit) {
  const value = Math.round(toDisplay(kg, unit) * 10) / 10
  return `${value} ${unit}`
}
