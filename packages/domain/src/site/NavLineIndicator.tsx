// 导航指示线组件
export const NavLineIndicator = ({
  items,
  activeIndex,
  totalHeight,
}: {
  items: Array<{ top: number; height: number; level: number }>
  activeIndex: number
  totalHeight: number
}) => {
  if (items.length === 0 || totalHeight === 0) return null

  const levelIndent = 12
  const baseX = 8
  const segmentHalf = 6

  const getX = (level: number) => baseX + Math.max(0, level - 2) * levelIndent
  const getY = (item: { top: number; height: number }) => item.top + item.height / 2

  const buildPathAndDistances = () => {
    const pathParts: string[] = []
    const itemDistances: number[] = []
    let totalDist = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const x = getX(item.level)
      const y = getY(item)
      const prevItem = items[i - 1]

      if (i === 0) {
        pathParts.push(`M ${x} ${y - segmentHalf}`)
        itemDistances.push(segmentHalf)
        totalDist = segmentHalf
      } else {
        const prevX = getX(prevItem.level)
        const prevY = getY(prevItem)

        if (item.level !== prevItem.level) {
          const connectorStartY = prevY + segmentHalf
          const connectorEndY = y - segmentHalf

          pathParts.push(`L ${prevX} ${connectorStartY}`)
          totalDist += segmentHalf

          pathParts.push(`L ${x} ${connectorEndY}`)
          const dx = x - prevX
          const dy = connectorEndY - connectorStartY
          const connectorLength = Math.sqrt(dx * dx + dy * dy)
          totalDist += connectorLength

          totalDist += segmentHalf
          itemDistances.push(totalDist)
        } else {
          totalDist += Math.abs(y - prevY)
          itemDistances.push(totalDist)
        }
      }

      const nextItem = items[i + 1]
      if (!nextItem || nextItem.level !== item.level) {
        pathParts.push(`L ${x} ${y + segmentHalf}`)
      }
    }

    const totalLength = totalDist + segmentHalf

    return {
      path: pathParts.join(' '),
      itemDistances,
      totalLength,
    }
  }

  const { path, itemDistances, totalLength } = buildPathAndDistances()
  const activeDistance = itemDistances[activeIndex] || 0

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 60,
        height: totalHeight,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <path d={path} fill="none" stroke="#ccc" strokeWidth="1" />
      <path
        d={path}
        fill="none"
        stroke="#0066ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${segmentHalf * 2} ${totalLength}`}
        strokeDashoffset={-(activeDistance - segmentHalf)}
        style={{
          transition: 'stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </svg>
  )
}
