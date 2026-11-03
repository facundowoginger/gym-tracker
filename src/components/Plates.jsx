// Faint weight-plate outlines used as background decoration on calm screens
// (opening screen, empty screens, workout summary). The parent needs position: relative.
const Plate = ({ style }) => (
  <svg className="plate" style={style} viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="4" />
  </svg>
)

export default function Plates() {
  return (
    <div className="plates" aria-hidden="true">
      <Plate style={{ width: 300, right: -110, top: -90, opacity: 0.12 }} />
      <Plate style={{ width: 200, left: -90, bottom: 40, opacity: 0.08 }} />
    </div>
  )
}
