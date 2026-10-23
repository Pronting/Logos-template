/**
 * Service Worker - 图片缓存加速
 *
 * 策略：Cache First（优先从缓存读取，缓存未命中则从网络获取）
 * 适用场景：图片等静态资源，变化频率低
 */

const CACHE_VERSION = 'image-cache-v1'
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 天过期
const CACHE_MAX_ITEMS = 200 // 最多缓存 200 张图片

// 需要缓存的图片域名
const IMAGE_DOMAINS = [
  'avatars.githubusercontent.com',                         // GitHub 头像
  'www.gravatar.com',                                     // Gravatar
  'img2023.cnblogs.com',                                  // 博客园
]

// 图片文件扩展名
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico']

/**
 * 判断请求是否为图片
 */
function isImageRequest(request) {
  const url = new URL(request.url)

  // 检查 destination（现代浏览器支持）
  if (request.destination === 'image') {
    return true
  }

  // 检查 Content-Type 响应头（在 fetch 事件中可用）
  // 注意：这里只能检查 URL，响应头在后续处理

  // 检查文件扩展名
  const pathname = url.pathname.toLowerCase()
  if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true
  }

  // 特殊路径处理：GitHub 头像和 Gravatar
  if (url.hostname === 'avatars.githubusercontent.com' && url.pathname.startsWith('/u/')) {
    return true
  }
  if (url.hostname === 'www.gravatar.com' && url.pathname.startsWith('/avatar/')) {
    return true
  }

  return false
}

/**
 * 判断是否为需要缓存的外部图片
 */
function isCacheableImage(request) {
  const url = new URL(request.url)

  // 只缓存 HTTPS 请求
  if (url.protocol !== 'https:') {
    return false
  }

  // 检查是否为图片请求
  if (!isImageRequest(request)) {
    return false
  }

  // 检查是否在白名单域名中
  return IMAGE_DOMAINS.some((domain) => url.hostname === domain)
}

/**
 * 清理过期缓存和超出数量限制的缓存
 */
async function cleanupCache(cache) {
  const keys = await cache.keys()

  // 如果缓存数量未超限，不清理
  if (keys.length <= CACHE_MAX_ITEMS) {
    return
  }

  // 删除最旧的缓存（FIFO）
  const itemsToDelete = keys.length - CACHE_MAX_ITEMS
  for (let i = 0; i < itemsToDelete; i++) {
    await cache.delete(keys[i])
  }
}

/**
 * 检查缓存响应是否过期
 */
function isCacheExpired(response) {
  const cachedTime = response.headers.get('sw-cached-at')
  if (!cachedTime) {
    return true
  }
  return Date.now() - parseInt(cachedTime, 10) > CACHE_MAX_AGE
}

// ========== 事件监听 ==========

// 安装阶段：跳过等待，立即激活
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      )
    })
  )
  // 立即接管所有客户端
  self.clients.claim()
})

// 请求拦截：Cache First 策略
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 只处理可缓存的图片请求
  if (!isCacheableImage(request)) {
    return
  }

  console.log('[SW] 拦截到图片请求:', request.url)

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // 1. 尝试从缓存读取
      const cachedResponse = await cache.match(request)

      // 2. 如果缓存命中且未过期，直接返回
      if (cachedResponse && !isCacheExpired(cachedResponse)) {
        console.log('[SW] 从缓存返回:', request.url)
        return cachedResponse
      }

      // 3. 缓存未命中或已过期，从网络获取
      try {
        const networkResponse = await fetch(request)

        // 4. 只缓存成功的响应
        if (networkResponse && networkResponse.status === 200) {
          // 额外检查：确认响应确实是图片
          const contentType = networkResponse.headers.get('content-type') || ''
          const isImageResponse = contentType.startsWith('image/')
          if (!isImageResponse) {
            return networkResponse
          }

          // 克隆响应（因为响应流只能读取一次）
          const responseToCache = networkResponse.clone()

          // 添加缓存时间戳
          const headers = new Headers(responseToCache.headers)
          headers.set('sw-cached-at', Date.now().toString())

          const cachedBody = await responseToCache.blob()
          const modifiedResponse = new Response(cachedBody, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
          })

          // 写入缓存
          await cache.put(request, modifiedResponse)
          console.log('[SW] 已缓存图片:', request.url)

          // 清理过量缓存
          await cleanupCache(cache)
        }

        return networkResponse
      } catch (error) {
        // 5. 网络请求失败，返回过期缓存（如果有的话）
        if (cachedResponse) {
          return cachedResponse
        }

        // 6. 都没有，返回错误
        return new Response('Network error', {
          status: 408,
          statusText: 'Request Timeout',
        })
      }
    })
  )
})
