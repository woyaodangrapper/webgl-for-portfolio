import { Model, Primitive, PrimitiveCollection } from 'cesium'
let hashCache: {
  table: Map<
    number,
    {
      // 主哈希（完整URL的哈希值）
      subHashMap: Map<number, Primitive> // 子哈希（URL部分）到 Primitive 对象的映射
    }
  >
  timestamp: number
  timeoutId: NodeJS.Timeout
} | null = null

const CACHE_LIFETIME = 10000 // 10秒

// 哈希函数：将字符串转换为数字哈希值
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char // Hashing algorithm (like DJB2)
  }
  return hash
}

// 清理缓存
function clearCache(): void {
  if (hashCache && hashCache.timeoutId) {
    clearTimeout(hashCache.timeoutId)
  }
  hashCache = null
  console.log('Cache cleared!')
}

// 重置缓存的定时器
function resetCacheTimer(): void {
  if (hashCache && hashCache.timeoutId) {
    clearTimeout(hashCache.timeoutId)
  }

  if (hashCache) {
    hashCache.timeoutId = setTimeout(() => {
      clearCache()
    }, CACHE_LIFETIME)
  }
}
/**
 * 获取单个 Primitive 对象
 * @param primitives  PrimitiveCollection
 * @param searchUri  要搜索的 URI
 * @description 根据给定的 URI，查找并返回匹配的 Primitive
 * @returns 返回匹配的 Primitive 或 null
 */
export function getPrimitive(
  primitives: PrimitiveCollection | Model[],
  searchUri: string
): Primitive | null {
  const currentTime = Date.now()
  // 如果缓存存在且有效（缓存时间小于10秒），直接使用缓存
  if (hashCache && currentTime - hashCache.timestamp < CACHE_LIFETIME) {
    const hashTable = hashCache.table
    const searchHash = hashString(searchUri)

    // 在缓存哈希表中查找匹配的模型
    if (hashTable.has(searchHash)) {
      const { subHashMap } = hashTable.get(searchHash)!

      // 检查子哈希（scheme, host, port, paths 等）匹配
      const parsedSearch = parseUrl(searchUri)
      const subKeys = ['scheme', 'host', 'port', 'paths']

      for (let key of subKeys) {
        const subValue = parsedSearch[key as keyof typeof parsedSearch]

        // 如果是路径部分（`paths`），可能有多个路径需要匹配
        if (Array.isArray(subValue)) {
          for (const item of subValue) {
            const result = checkSubValue(key, item, subHashMap)
            if (result) return result // 找到匹配的模型直接返回
          }
        } else {
          const result = checkSubValue(key, subValue, subHashMap)
          if (result) return result // 找到匹配的模型直接返回
        }
      }
    }

    return null // 如果没有找到匹配项，返回 null
  }

  // 如果缓存无效，重新构建哈希表
  const newHashTable: Map<number, { subHashMap: Map<number, Primitive> }> = new Map()

  // 构建哈希表，存储所有模型的 URL 哈希值
  for (let index = 0; index < primitives.length; index++) {
    
    const primitive = primitives[index] ?? (primitives as PrimitiveCollection).get(index)
    const { scheme, host, port, paths } = parseUrl(primitive.url)

    // 计算完整 URL 的哈希值
    const fullUrl = `${scheme}://${host}:${port}${paths.join('/')}`
    const fullUrlHash = hashString(fullUrl)

    // 获取主哈希对应的映射
    if (!newHashTable.has(fullUrlHash)) {
      newHashTable.set(fullUrlHash, { subHashMap: new Map() })
    }

    const { subHashMap } = newHashTable.get(fullUrlHash)!

    // 存储各部分的子哈希（scheme, host, port, paths）和对应的 Primitive 对象
    const subKeys = ['scheme', 'host', 'port', 'paths']
    subKeys.forEach((key) => {
      const value = key === 'paths' ? paths.join('/') : { scheme, host, port }[key] // 动态获取值
      if (value === undefined) return // 如果值未定义，跳过
      const subHash = hashString(value)
      subHashMap.set(subHash, primitive)
    })
  }

  // 将新的哈希表和时间戳缓存起来
  hashCache = {
    table: newHashTable,
    timestamp: currentTime,
    timeoutId: setTimeout(() => {
      clearCache()
    }, CACHE_LIFETIME),
  }

  // 对输入的 searchUri 进行哈希处理
  const searchHash = hashString(searchUri)

  // 在哈希表中查找匹配的模型
  if (newHashTable.has(searchHash)) {
    const { subHashMap } = newHashTable.get(searchHash)!

    // 检查子哈希部分匹配
    const parsedSearch = parseUrl(searchUri)
    const subKeys = ['scheme', 'host', 'port', 'paths']
    for (let key of subKeys) {
      const subValue = parsedSearch[key as keyof typeof parsedSearch]

      if (Array.isArray(subValue)) {
        for (const item of subValue) {
          const result = checkSubValue(key, item, subHashMap)
          if (result) return result // 找到匹配的模型直接返回
        }
      } else {
        const result = checkSubValue(key, subValue, subHashMap)
        if (result) return result // 找到匹配的模型直接返回
      }
    }
  }

  return null // 如果没有找到匹配的模型，返回 null

  // 检查子值的匹配
  function checkSubValue(
    key: string,
    subValue: string,
    subHashMap: Map<number, Primitive>
  ): Primitive | null | undefined {
    const subHash = hashString(subValue)
    if (subHashMap.has(subHash)) {
      const primitive = subHashMap.get(subHash)
      console.log(`Found matching primitive at sub URL part: ${key} = ${subValue}`, primitive)
      return primitive // 返回找到的模型
    }
    return null // 如果没有找到匹配项，返回 null
  }
}

/**
 * 获取多个 Primitive 对象
 * @param primitives  PrimitiveCollection
 * @param searchUri  要搜索的 URI 数组
 * @description 根据给定的 URI 数组，查找并返回匹配的 Primitive
 * @returns
 */
export function getPrimitives(
  primitives: PrimitiveCollection | Model[],
  searchUri: string[]
): Promise<Array<Primitive>> {
  return new Promise<Array<Primitive>>((resolve, reject) => {
    const foundPrimitives: Primitive[] = []

    searchUri.forEach((uri) => {
      const primitive = getPrimitive(primitives, uri)
      if (primitive) {
        foundPrimitives.push(primitive)
      }
    })

    if (foundPrimitives.length > 0) {
      resolve(foundPrimitives)
    } else {
      reject(new Error('No matching primitives found'))
    }
  })
}

/**
 * 解析 URL 并返回其组成部分
 * @param url 要解析的 URL 字符串
 * @returns 返回包含 scheme、host、port 和 paths 的对象
 */
function parseUrl(url: string) {
  let scheme = '';
  let host = '';
  let port = '';
  let pathname = '';

  // 如果 URL 包含协议（://），使用完整的 URL
  if (url.includes('://')) {
    const { protocol, hostname, port: urlPort, pathname: urlPath } = new URL(url);
    scheme = protocol.replace(':', '');  // 移除协议冒号
    host = hostname;
    port = urlPort || '';  // 端口为空时为 ''
    pathname = urlPath;
  } else {
    // 如果是路径，仅解析路径部分
    pathname = url;
  }

  return {
    scheme,
    host,
    port,
    paths: pathname.split('/').filter(Boolean),
  };
}
