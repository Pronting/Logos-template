/**
 * Harness Kit：收录 Skills、Commands、MCP、Workflows 等智能体工具相关的条目。
 * 类型目前保持开放，未识别的 type 会归到 other，方便后续继续扩充。
 */
export const HARNESS_TYPES = [
    'skill',
    'command',
    'agent',
    'mcp',
    'prompt',
    'workflow',
    'other',
] as const;

export type HarnessType = (typeof HARNESS_TYPES)[number];

export const HARNESS_TYPE_ICONS: Record<HarnessType, string> = {
    skill: 'fa6-solid:wand-magic-sparkles',
    command: 'fa6-solid:terminal',
    agent: 'fa6-solid:robot',
    mcp: 'fa6-solid:plug',
    prompt: 'fa6-solid:comment-dots',
    workflow: 'fa6-solid:diagram-project',
    other: 'fa6-solid:cube',
};

/** 传给客户端组件的轻量数据 */
export interface HarnessItem {
    id: string;
    title: string;
    description: string;
    type: HarnessType;
    tags: string[];
    link: string;
    source: string;
    author: string;
    version: string;
    icon: string;
    pubDate: string | null;
    pinTop: number;
}
