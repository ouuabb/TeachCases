<template>
  <div class="home">
    <section class="hero">
      <h1>数据埋点教学项目</h1>
      <p class="subtitle">从零理解数据采集：概念 → SDK → 上报 → 存储 → 可视化</p>
    </section>

    <section class="cards">
      <div class="card" v-for="card in cards" :key="card.title">
        <div class="card-icon">{{ card.icon }}</div>
        <h3>{{ card.title }}</h3>
        <p>{{ card.desc }}</p>
        <router-link :to="card.link" class="card-link">{{ card.linkText }}</router-link>
      </div>
    </section>

    <section class="concepts">
      <h2>什么是数据埋点？</h2>
      <div class="concept-grid">
        <div class="concept-item">
          <h4>埋点 = 数据采集点</h4>
          <p>
            在应用的特定位置"埋"下一个"点"（代码），当用户触发某个行为时，
            采集相关数据并上报给服务端。就像在网页上安装了无数个隐形摄像头。
          </p>
        </div>
        <div class="concept-item">
          <h4>为什么要做埋点？</h4>
          <p>
            没有数据 = 没有依据。产品改版、运营策略、广告投放都需要数据支撑。
            埋点让我们知道：用户从哪来、做了什么、在哪里流失。
          </p>
        </div>
        <div class="concept-item">
          <h4>埋点的数据流向</h4>
          <p>
            前端采集 → SDK加工 → 网络上报 → 后端接收 → 数据存储 → 分析展示
            <br />本项目完整实现了这条链路。
          </p>
        </div>
      </div>
    </section>

    <section class="types">
      <h2>常见埋点类型</h2>
      <div class="type-list">
        <div class="type-item">
          <span class="badge badge-page">页面</span>
          <div>
            <strong>页面浏览 (PV)</strong>
            <p>用户每次访问页面时触发。通过路由监听自动采集。</p>
          </div>
        </div>
        <div class="type-item">
          <span class="badge badge-click">点击</span>
          <div>
            <strong>点击事件</strong>
            <p>用户点击按钮、链接等元素。可以手动或通过装饰器自动采集。</p>
          </div>
        </div>
        <div class="type-item">
          <span class="badge badge-expose">曝光</span>
          <div>
            <strong>元素曝光</strong>
            <p>某个元素进入可视区域。使用 IntersectionObserver 实现。</p>
          </div>
        </div>
        <div class="type-item">
          <span class="badge badge-custom">自定义</span>
          <div>
            <strong>自定义事件</strong>
            <p>业务自定义的事件，如：加入购物车、提交订单、播放视频等。</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      cards: [
        {
          icon: '📦',
          title: '商品页面',
          desc: '模拟电商商品页，演示点击、曝光、自定义事件的采集',
          link: '/product/1',
          linkText: '去体验 →'
        },
        {
          icon: '🔧',
          title: '埋点实操',
          desc: '交互式演示 SDK 的核心功能，可在控制台实时查看数据',
          link: '/tracker-demo',
          linkText: '开始实验 →'
        },
        {
          icon: '📊',
          title: '数据看板',
          desc: '实时查看上报的埋点数据，验证采集结果',
          link: '/dashboard',
          linkText: '查看数据 →'
        }
      ]
    }
  },
  mounted() {
    // 手动上报首页曝光
    if (window.$tracker) {
      window.$tracker.trackExposure('home_hero_section', {
        section: 'hero'
      })
    }
  }
}
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 48px 0 32px;
}

.hero h1 {
  font-size: 32px;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 16px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.card h3 {
  margin-bottom: 8px;
  color: #1a1a2e;
}

.card p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-link {
  color: #4361ee;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.concepts {
  margin-bottom: 40px;
}

.concepts h2, .types h2 {
  font-size: 22px;
  margin-bottom: 16px;
  color: #1a1a2e;
}

.concept-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.concept-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #4361ee;
}

.concept-item h4 {
  margin-bottom: 8px;
  color: #1a1a2e;
}

.concept-item p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  white-space: nowrap;
  margin-top: 2px;
}

.badge-page { background: #4361ee; }
.badge-click { background: #f72585; }
.badge-expose { background: #4cc9f0; color: #333; }
.badge-custom { background: #7209b7; }

.type-item strong {
  display: block;
  margin-bottom: 4px;
}

.type-item p {
  color: #666;
  font-size: 13px;
}
</style>
