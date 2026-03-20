'use client'
import React from 'react'
import { YStack, XStack, Text, Progress, Spinner } from 'tamagui'
import Lottie from 'lottie-react'
// 假设你有一个科技感十足的加载动画 json
import loadingAnimation from './assets/loading-tech.json'

const loadingMessages = [
  '正在校准核心组件库...',
  '正在压缩几何图形渲染引擎...',
  '同步全局状态机中，请稍候...',
  '正在优化像素点分布...',
  '正在从云端抓取精美图标...',
  '最后一步：确保一切看起来都很酷...',
  '带宽虽小，但梦想很大，感谢等待...',
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(1)} ${units[i]}`
}

export type LoadingPageProps = {
  /** 已下载字节数 */
  loaded?: number
  /** 总字节数 */
  total?: number
}

const LoadingPage = ({ loaded = 0, total = 0 }: LoadingPageProps) => {
  const progress = total > 0 ? Math.min(Math.round((loaded / total) * 100), 100) : 0
  const messageIndex = Math.min(
    Math.floor((progress / 100) * loadingMessages.length),
    loadingMessages.length - 1
  )
  const displayMessage =
    total > 0
      ? `${loadingMessages[messageIndex]}  (${formatBytes(loaded)} / ${formatBytes(total)})`
      : loadingMessages[0]

  return (
    <YStack
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      backgroundColor="$background"
    >
      <YStack width="100%" maxWidth={500} padding="$8" gap="$4">
        {/* Lottie 动画区域 */}
        <YStack alignItems="center" justifyContent="center" height={200} marginBottom="$4">
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            style={{ width: 180, height: 180 }}
          />
        </YStack>

        {/* 核心提示语 */}
        <YStack gap="$2" marginBottom="$6">
          <Text textAlign="center" fontWeight="800" fontSize="$8" color="$color" letterSpacing={-1}>
            WEB<Text color="#C0FF62">GL</Text> SYSTEM
          </Text>
          <Text textAlign="center" fontSize="$3" opacity={0.7} paddingHorizontal="$4">
            个人开发测试带宽资源不足，感谢您的耐心等待。
          </Text>
        </YStack>

        {/* 进度条区域 */}
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="flex-end">
            <Text fontSize="$2" color="$color" opacity={0.6} flex={1}>
              {displayMessage}
            </Text>
            <Text fontSize="$2" fontWeight="bold" color="#C0FF62">
              {Math.round(progress)}%
            </Text>
          </XStack>

          <Progress value={progress} height={6} backgroundColor="$background">
            <Progress.Indicator backgroundColor="#C0FF62" shadowColor="#C0FF62" shadowRadius="$4" />
          </Progress>
        </YStack>

        {/* 底部点缀 */}
        <XStack marginTop="$8" justifyContent="center" alignItems="center" gap="$2" opacity={0.4}>
          <Spinner size="small" color="$color" />
          <Text fontSize="$1" letterSpacing={2}>
            ESTABLISHING CONNECTION
          </Text>
        </XStack>
      </YStack>

      {/* 背景装饰（模拟图中模糊感） */}
      <YStack
        position="fixed"
        top={-100}
        right={-100}
        width={300}
        height={300}
        backgroundColor="#C0FF62"
        borderRadius={1000}
        opacity={0.01}
        zIndex={-1}
        style={{ filter: 'blur(60px)' }}
      />
    </YStack>
  )
}

export default LoadingPage
