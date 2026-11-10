<template>
  <div class="dashboard-dialog">
    <div class="dashboard-head">
      <div>
        <div class="dialog-title">Dashboard</div>
        <div class="subtitle">Quantidade de obras de defeito por setor</div>
      </div>
      <Button size="small" :disabled="loading" @click="load()">
        <i-icon-park-outline:refresh class="icon" /> Atualizar
      </Button>
    </div>

    <div class="loading" v-if="loading">Carregando dados...</div>

    <div class="empty" v-else-if="!stats.totalProjects">
      Nenhuma obra salva ainda.
      <br />
      Salve uma obra com os setores selecionados para ver os gráficos aqui.
    </div>

    <template v-else>
      <div class="summary">
        <div class="summary-card">
          <span class="label">Obras salvas</span>
          <strong class="value">{{ stats.totalProjects }}</strong>
        </div>
        <div class="summary-card">
          <span class="label">Setores com obras</span>
          <strong class="value">{{ sectorsWithWorks }}</strong>
        </div>
        <div class="summary-card">
          <span class="label">Obras sem setor</span>
          <strong class="value">{{ stats.withoutSector }}</strong>
        </div>
        <div class="summary-card">
          <span class="label">Setor com mais obras</span>
          <strong class="value name" :title="topSector">{{ topSector }}</strong>
          <span class="hint" v-if="topSectorCount">{{ topSectorCount }} obra(s)</span>
        </div>
      </div>

      <div class="charts">
        <div class="chart-card">
          <div class="chart-title">Obras por setor</div>
          <div class="chart" ref="barChartRef"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">Distribuição por setor</div>
          <div class="chart" ref="pieChartRef" v-if="hasSectorData"></div>
          <div class="chart-empty" v-else>
            Nenhuma obra tem setor atribuído.
          </div>
        </div>
      </div>

      <div class="note">
        Uma obra pode pertencer a mais de um setor, por isso ela é contada em cada um deles.
      </div>
    </template>

    <div class="btns">
      <Button @click="emit('close')">Fechar</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { useMainStore } from '@/store'
import { getSectorStats, type SectorStats } from '@/utils/sectorStats'

import Button from '@/components/Button.vue'

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  SVGRenderer,
])

const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()

const stats = ref<SectorStats>({
  totalProjects: 0,
  withoutSector: 0,
  sectors: [],
})
const loading = ref(true)

const barChartRef = useTemplateRef<HTMLDivElement>('barChartRef')
const pieChartRef = useTemplateRef<HTMLDivElement>('pieChartRef')

let barChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const sectorsWithWorks = computed(() => stats.value.sectors.filter(sector => sector.count > 0).length)
const hasSectorData = computed(() => sectorsWithWorks.value > 0)
const topSector = computed(() => stats.value.sectors.find(sector => sector.count > 0)?.name || '—')
const topSectorCount = computed(() => stats.value.sectors.find(sector => sector.count > 0)?.count || 0)

const renderCharts = () => {
  barChart?.dispose()
  pieChart?.dispose()
  barChart = null
  pieChart = null

  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value, null, { renderer: 'svg' })
    barChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: 8,
        right: 16,
        top: 24,
        bottom: 8,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: stats.value.sectors.map(sector => sector.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#dcdcdc' } },
        axisLabel: {
          color: '#666',
          interval: 0,
          rotate: stats.value.sectors.length > 5 ? 30 : 0,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#eee' } },
      },
      series: [{
        type: 'bar',
        data: stats.value.sectors.map(sector => sector.count),
        barMaxWidth: 46,
        itemStyle: {
          color: '#5b9bd5',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#666',
        },
      }],
    })
  }

  if (pieChartRef.value && hasSectorData.value) {
    pieChart = echarts.init(pieChartRef.value, null, { renderer: 'svg' })
    pieChart.setOption({
      color: ['#5b9bd5', '#ed7d31', '#a5a5a5', '#ffc000', '#4472c4', '#70ad47', '#8165a0', '#47acc5'],
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} obra(s) ({d}%)',
      },
      legend: {
        bottom: 0,
        type: 'scroll',
        textStyle: { color: '#666', fontSize: 11 },
      },
      series: [{
        type: 'pie',
        radius: ['40%', '64%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        data: stats.value.sectors
          .filter(sector => sector.count > 0)
          .map(sector => ({ name: sector.name, value: sector.count })),
      }],
    })
  }
}

const resizeCharts = () => {
  barChart?.resize()
  pieChart?.resize()
}

const load = async () => {
  loading.value = true
  try {
    stats.value = await getSectorStats()
  }
  finally {
    loading.value = false
  }

  await nextTick()
  renderCharts()
}

onMounted(() => {
  mainStore.setDisableHotkeysState(true)
  load()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  mainStore.setDisableHotkeysState(false)
  window.removeEventListener('resize', resizeCharts)
  barChart?.dispose()
  pieChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard-dialog {
  width: 100%;
  max-height: 80vh;
  overflow: auto;
  font-size: 13px;
  line-height: 1.675;
}
.dashboard-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding-right: 24px;
}
.dialog-title {
  font-size: 17px;
  font-weight: 700;
}
.subtitle {
  font-size: 12px;
  color: $textSecondaryColor;
}
.summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid $borderColor;
  border-radius: $borderRadiusMd;
  background-color: #fafbfc;

  .label {
    font-size: 12px;
    color: $textSecondaryColor;
  }
  .value {
    font-size: 24px;
    line-height: 1.3;
    font-weight: 700;
    color: #333;
  }
  .value.name {
    font-size: 15px;
    line-height: 1.9;
    color: $themeColor;
    @include ellipsis-oneline();
  }
  .hint {
    font-size: 11px;
    color: $textSecondaryColor;
  }
}
.charts {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 12px;
}
.chart-card {
  min-width: 0;
  padding: 12px 14px 8px;
  border: 1px solid $borderColor;
  border-radius: $borderRadiusMd;
}
.chart-title {
  font-size: 13px;
  font-weight: 700;
  color: #444;
}
.chart {
  width: 100%;
  height: 280px;
}
.chart-empty {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  text-align: center;
}
.note {
  margin-top: 10px;
  font-size: 11px;
  color: $textSecondaryColor;
}
.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  color: $textSecondaryColor;
  text-align: center;
  line-height: 1.8;
}
.btns {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
.icon {
  margin-right: 3px;
}
</style>
