export const HOT_LIST_SOURCES = [
  { id: 'douyin', name: '抖音热搜', icon: '🎵' },
  { id: 'weibo', name: '微博热搜', icon: '🔴' },
  { id: 'bilibili', name: 'B站热搜', icon: '📺' },
  { id: 'zhihu', name: '知乎热榜', icon: '❓' },
  { id: 'baidu', name: '百度热搜', icon: '🔍' },
  { id: 'toutiao', name: '头条热榜', icon: '📰' },
  { id: 'today-in-history', name: '历史上的今天', icon: '📅' },
  { id: 'quark', name: '夸克热点', icon: '🌪️' },
  { id: 'rednote', name: '小红书', icon: '📕' },
] as const

export type HotListSourceId = (typeof HOT_LIST_SOURCES)[number]['id']
