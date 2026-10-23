/**
 * 首页 Hero 大字内容配置
 *
 * 直接修改下方字符串即可更新首页展示内容。
 * greeting:  问候语（主标题第一行）
 * name:      名字（主标题第二行，加重展示）
 * motto:     座右铭数组，打字机循环展示
 * tags:      顶部 eyebrow 标签数组
 * quote:     大标题下方的一句话
 * quoteAuthor: 该句话的归属（可选）
 * primaryCta / secondaryCta: 双 CTA 按钮
 * particles: 背景粒子参数
 */
export interface HeroCta {
  label: string;
  href: string;
}

export interface HeroParticles {
  /** 粒子数量；过大会影响低端设备 */
  count: number;
  /** 粒子颜色，固定 token 或 'currentColor' 跟随主题 */
  color: string;
  /** 单帧最大位移系数，越小越慢 */
  speed: number;
}

export interface HeroConfig {
  greeting: string;
  name: string;
  motto: string[];
  tags: string[];
  quote: string;
  quoteAuthor?: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  particles: HeroParticles;
}

export const heroConfig: HeroConfig = {
  greeting: "你好，我是",
  name: "Logos",
  motto: [
    "开卷有益",
    "凡我不能创造的，我就不能理解",
    "文章千古事，得失寸心知",
  ],
  tags: ["代码", "阅读", "构建"],
  quote: "代码是写给人看的，顺便让机器执行。",
  quoteAuthor: "H. W. - Knuth spirit",
  primaryCta: { label: "浏览文章", href: "/tech" },
  secondaryCta: { label: "关于我", href: "/about" },
  particles: { count: 40, color: "var(--text-color-70)", speed: 1.1 },
};
