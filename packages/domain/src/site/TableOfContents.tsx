import { useEffect, useRef, useState } from 'react'
import { NavLineIndicator } from './NavLineIndicator'
import { TakeoutIcon } from '../icons/TakeoutIcon'
import { BentoIcon } from '../icons/BentoIcon'
function hexToRgba(hex: string, alpha: number) {
  // 去掉 # 号
  const cleanHex = hex.replace(/^#/, '')

  // 解析 3 位或 6 位 hex
  const bigint = parseInt(
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex,
    16
  )

  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
// 按钮组件
const StyledButton = ({
  children,
  icon,
  color = '#0066ff',
  onClick,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  color?: string
  onClick?: () => void
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      width: 'fit-content',
      padding: '4px 12px',
      backgroundColor: hexToRgba(color, 0.15),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${hexToRgba(color, 0.4)}`,
      borderRadius: '20px',
      color: color,
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    }}
  >
    <span>{children}</span>
    <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
  </button>
)
// 右侧导航组件
export const TableOfContents = ({
  headings,
}: {
  headings: Array<{ id: string; title: string; level: number }>
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [itemData, setItemData] = useState<Array<{ top: number; height: number; level: number }>>(
    []
  )
  const [containerHeight, setContainerHeight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 测量容器和项目位置
  useEffect(() => {
    if (!containerRef.current || headings.length === 0) return

    const measurePositions = () => {
      const container = containerRef.current
      if (!container) return

      const items = container.querySelectorAll('[data-nav-item]')
      const data: Array<{ top: number; height: number; level: number }> = []

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const level = headings[index]?.level ?? 2
        data.push({
          top: rect.top - containerRect.top,
          height: rect.height,
          level,
        })
      })

      setItemData(data)
      setContainerHeight(container.scrollHeight)
    }

    requestAnimationFrame(measurePositions)

    window.addEventListener('resize', measurePositions)
    return () => window.removeEventListener('resize', measurePositions)
  }, [headings])

  return (
    <>
      <aside
        style={{
          position: 'fixed',
          right: 20,
          top: 35,
          width: 240,
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          padding: '16px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h4
          style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#333',
          }}
        >
          Contents
        </h4>
        <div ref={containerRef} style={{ position: 'relative', paddingLeft: 24, marginBottom: 24 }}>
          <NavLineIndicator
            items={itemData}
            activeIndex={activeIndex}
            totalHeight={containerHeight}
          />
          {headings.map(({ id, title, level }, index) => (
            <div
              key={`${id}-${index}`}
              data-nav-item
              style={{
                paddingLeft: Math.max(0, level - 2) * 12,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveIndex(index)
                  const el = document.getElementById(id)
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  textDecoration: 'none',
                  fontSize: level === 2 ? '14px' : '13px',
                  color: index === activeIndex ? '#0066ff' : level === 2 ? '#555' : '#777',
                  fontWeight: level === 2 ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0066ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    index === activeIndex ? '#0066ff' : level === 2 ? '#555' : '#777'
                }}
              >
                {title}
              </a>
            </div>
          ))}
        </div>
      </aside>

      {/* 按钮区域 - 悬浮在 aside 下方 */}
      <div
        style={{
          position: 'fixed',
          right: 20,
          top: 'calc(80px + min(70vh, 500px))',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: 'fit-content',
        }}
      >
        <StyledButton
          color="#44cf8c"
          icon={<BentoIcon scale={0.75} color="#44cf8c" />}
          onClick={() => {
            window.location.href = '/gis'
          }}
        >
          C
        </StyledButton>
        <StyledButton
          color="#ef4444"
          icon={<TakeoutIcon scale={0.75} />}
          onClick={() => {
            window.location.href = '/'
          }}
        >
          T
        </StyledButton>
      </div>
    </>
  )
}
