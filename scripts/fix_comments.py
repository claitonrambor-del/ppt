#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fase 2 da tradução: normaliza comentários (tw2s) e aplica dicionário zh->pt."""
import os, re, sys
from opencc import OpenCC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cc = OpenCC('tw2s')

CJK = re.compile(r'[\u4e00-\u9fff]')

# Dicionário de comentários (simplificado -> português), ordenado por tamanho na aplicação
COMMENTS = {
    '元素': 'elemento', '文本': 'texto', '文字': 'texto', '图片': 'imagem', '形状': 'forma',
    '线条': 'linha', '图表': 'gráfico', '表格': 'tabela', '视频': 'vídeo', '音频': 'áudio',
    '公式': 'fórmula', '幻灯片': 'slide', '页面': 'página', '画布': 'canvas', '主题': 'tema',
    '背景': 'fundo', '填充': 'preenchimento', '边框': 'borda', '阴影': 'sombra', '颜色': 'cor',
    '颜色列表': 'lista de cores', '渐变': 'gradiente', '滤镜': 'filtro', '模糊': 'desfoque',
    '亮度': 'brilho', '对比度': 'contraste', '灰度': 'nível de cinza', '饱和度': 'saturação',
    '色相': 'matiz', '褐色': 'sépia', '反转': 'inverter', '旋转': 'rotação', '缩放': 'escala',
    '宽度': 'largura', '高度': 'altura', '大小': 'tamanho', '位置': 'posição', '坐标': 'coordenadas',
    '方向': 'direção', '样式': 'estilo', '状态': 'estado', '集合': 'coleção', '列表': 'lista',
    '数据': 'dados', '内容': 'conteúdo', '标题': 'título', '文本框': 'caixa de texto',
    '字号': 'tamanho da fonte', '字体': 'fonte', '行高': 'altura da linha', '行间距': 'entrelinha',
    '字间距': 'espaçamento entre letras', '对齐': 'alinhamento', '对齐方式': 'modo de alinhamento',
    '垂直': 'vertical', '水平': 'horizontal', '默认': 'padrão', '覆盖': 'substituir',
    '内联': 'inline', '选中': 'selecionado', '选区': 'seleção', '选择': 'seleção',
    '单元格': 'célula', '列宽': 'largura da coluna', '行数': 'número de linhas', '列数': 'número de colunas',
    '合并': 'mesclar', '拆分': 'dividir', '删除': 'excluir', '移除': 'remover', '添加': 'adicionar',
    '插入': 'inserir', '复制': 'copiar', '粘贴': 'colar', '剪切': 'recortar', '撤销': 'desfazer',
    '重做': 'refazer', '保存': 'salvar', '导出': 'exportar', '导入': 'importar', '下载': 'baixar',
    '上传': 'enviar', '事件': 'evento', '监听': 'ouvinte', '触发': 'disparar', '执行': 'executar',
    '处理': 'processar', '计算': 'calcular', '判断': 'verificar', '检查': 'verificar',
    '更新': 'atualizar', '修改': 'alterar', '设置': 'definir', '获取': 'obter', '返回': 'retornar',
    '清空': 'limpar', '清屏': 'limpar tela', '开始': 'iniciar', '结束': 'encerrar', '停止': 'parar',
    '暂停': 'pausar', '播放': 'reproduzir', '动画': 'animação', '入场': 'entrada', '退场': 'saída',
    '强调': 'ênfase', '效果': 'efeito', '持续时间': 'duração', '持续时间': 'duração',
    '组合': 'agrupar', '分组': 'grupo', '取消组合': 'desagrupar', '层级': 'camada',
    '置顶': 'trazer para frente', '置底': 'enviar para trás', '上移': 'mover para cima', '下移': 'mover para baixo',
    '锁定': 'bloquear', '解锁': 'desbloquear', '隐藏': 'ocultar', '显示': 'mostrar',
    '裁剪': 'recorte', '蒙版': 'máscara', '透明度': 'opacidade', '圆角': 'canto arredondado',
    '半径': 'raio', '百分比': 'porcentagem', '比例': 'proporção', '范围': 'faixa', '限制': 'limite',
    '最小': 'mínimo', '最大': 'máximo', '缩略图': 'miniatura', '缩略图工具栏': 'barra de miniaturas',
    '放映': 'apresentação', '全屏': 'tela cheia', '备注': 'anotações', '批注': 'anotação',
    '演讲者': 'apresentador', '观众': 'plateia', '黑板': 'quadro-negro', '墨迹': 'traço',
    '橡皮擦': 'borracha', '荧光笔': 'marca-texto', '画笔': 'caneta', '激光笔': 'caneta laser',
    '倒计时': 'contagem regressiva', '计时器': 'cronômetro', '吸管': 'conta-gotas',
    '双击': 'duplo clique', '点击': 'clique', '右键': 'botão direito', '拖拽': 'arrastar', '拖动': 'arrastar',
    '鼠标': 'mouse', '键盘': 'teclado', '按键': 'tecla', '快捷键': 'atalho', '热键': 'atalho',
    '历史': 'histórico', '快照': 'snapshot', '指针': 'ponteiro', '长度': 'comprimento',
    '数据库': 'banco de dados', '索引': 'índice', '标识': 'identificador', '唯一': 'único',
    '元素ID': 'ID do elemento', '格式刷': 'pincel de formato', '富文本': 'texto rico',
    '多选': 'multiseleção', '单选': 'seleção única', '焦点': 'foco', '聚焦': 'focar',
    '缩略': 'miniatura', '可视区域': 'área visível', '可视': 'visível', '网格线': 'linha de grade',
    '网格': 'grade', '标尺': 'régua', '参考线': 'guias', '吸附': 'encaixe', '对齐线': 'linha de alinhamento',
    '超链接': 'hiperlink', '链接': 'link', '网页': 'página web', '地址': 'endereço',
    '视频地址': 'endereço do vídeo', '音频地址': 'endereço do áudio',
    '查找': 'localizar', '替换': 'substituir', '搜索': 'buscar', '关键词': 'palavra-chave',
    '图库': 'biblioteca de imagens', '图片库': 'biblioteca de imagens', '模板': 'modelo', '预置': 'predefinido',
    '自定义': 'personalizado', '随机': 'aleatório', '成功': 'sucesso', '失败': 'falha',
    '错误': 'erro', '警告': 'aviso', '提示': 'dica', '注意': 'atenção', '注意：': 'atenção: ',
    '问题': 'problema', '情况': 'caso', '原因': 'motivo', '方法': 'método', '方式': 'modo',
    '类型': 'tipo', '名称': 'nome', '信息': 'informação', '参数': 'parâmetro', '属性': 'propriedade',
    '配置': 'configuração', '选项': 'opção', '开关': 'interruptor', '按钮': 'botão',
    '图标': 'ícone', '图标颜色': 'cor do ícone', '面板': 'painel', '窗口': 'janela', '菜单': 'menu',
    '工具栏': 'barra de ferramentas', '工具': 'ferramenta', '组件': 'componente', '模块': 'módulo',
    '函数': 'função', '方法名': 'nome do método', '变量': 'variável', '常量': 'constante',
    '字符串': 'string', '数组': 'array', '对象': 'objeto', '结构': 'estrutura', '格式': 'formato',
    '编码': 'codificação', '解码': 'decodificação', '转换': 'conversão', '解析': 'interpretar',
    '生成': 'gerar', '创建': 'criar', '新建': 'novo', '初始化': 'inicializar', '销毁': 'destruir',
    '加载': 'carregar', '渲染': 'renderizar', '绘制': 'desenhar', '绘制中': 'desenhando',
    '重绘': 'redesenhar', '刷新': 'atualizar', '同步': 'sincronizar', '异步': 'assíncrono',
    '请求': 'requisição', '响应': 'resposta', '服务器': 'servidor', '客户端': 'cliente',
    '网络': 'rede', '接口': 'interface', '代理': 'proxy', '跨域': 'cross-origin',
    '字体列表': 'lista de fontes', '主题色': 'cor do tema', '配色': 'paleta de cores',
    '色块': 'bloco de cor', '透明': 'transparente', '不透明': 'opaco',
    '自动': 'automático', '手动': 'manual', '循环': 'loop', '倍速': 'velocidade',
    '预览': 'prévia', '预览全部': 'prévia geral', '封面': 'capa', '海报': 'poster',
    '首帧': 'primeiro quadro', '静音': 'mudo', '音量': 'volume', '音轨': 'faixa de áudio',
    '打印': 'imprimir', '纸张': 'papel', '边距': 'margem', '留白': 'margem',
    '横版': 'paisagem', '竖版': 'retrato', '横向': 'horizontal', '纵向': 'vertical',
    '宽屏': 'widescreen', '标准': 'padrão', '适配': 'adaptar', '适应': 'ajustar',
    '铺满': 'preencher', '拉伸': 'esticar', '压缩': 'comprimir', '裁切': 'recortar',
    '分辨率': 'resolução', '质量': 'qualidade', '压缩率': 'taxa de compressão',
    '文件': 'arquivo', '文件名': 'nome do arquivo', '后缀': 'extensão', '目录': 'diretório',
    '路径': 'caminho', '存储': 'armazenamento', '缓存': 'cache', '内存': 'memória',
    '版本': 'versão', '日期': 'data', '时间': 'tempo', '毫秒': 'milissegundos', '秒': 'segundos',
    '分钟': 'minutos', '小时': 'horas', '天': 'dias',
    '标记': 'marcação', '标注': 'marcação', '未标记': 'sem marcação', '标记类型': 'tipo de marcação',
    '节': 'seção', '章': 'capítulo', '项': 'item', '大纲': 'esboço', '目录页': 'página de sumário',
    '过渡页': 'página de transição', '内容页': 'página de conteúdo', '结束页': 'página de encerramento',
    '副标题': 'subtítulo', '页眉': 'cabeçalho', '页脚': 'rodapé', '正文': 'corpo',
    '序号': 'numeração', '编号': 'numeração', '编号列表': 'lista numerada', '项目符号': 'marcadores',
    '缩进': 'recuo', '首行缩进': 'recuo da primeira linha', '引用': 'citação', '代码': 'código',
    '加粗': 'negrito', '斜体': 'itálico', '下划线': 'sublinhado', '删除线': 'tachado',
    '上标': 'sobrescrito', '下标': 'subscrito', '高亮': 'realce', '高亮色': 'cor de realce',
    '括号': 'parênteses', '竖排': 'texto vertical', '横排': 'texto horizontal',
    '表格样式': 'estilo da tabela', '表头': 'cabeçalho da tabela', '汇总行': 'linha de totais',
    '第一列': 'primeira coluna', '最后一列': 'última coluna', '条纹': 'listrado',
    '行': 'linha', '列': 'coluna', '点': 'ponto', '线段': 'segmento', '端点': 'ponto final',
    '控制点': 'ponto de controle', '锚点': 'âncora', '起点': 'ponto inicial', '终点': 'ponto final',
    '闭合': 'fechar', '平滑': 'suavizar', '贝塞尔': 'Bézier', '弧线': 'arco', '圆弧': 'arco',
    '椭圆': 'elipse', '圆形': 'círculo', '矩形': 'retângulo', '三角形': 'triângulo',
    '多边形': 'polígono', '多边形绘制': 'desenho de polígono', '任意': 'livre',
    '反转方向': 'inverter direção', '交换': 'trocar', '对称': 'simetria', '居中': 'centralizar',
    '分布': 'distribuir', '等间距': 'espaçamento igual', '等比': 'proporção igual',
    '激活': 'ativo', '禁用': 'desativado', '启用': 'ativado', '可用': 'disponível', '有效': 'válido',
    '无效': 'inválido', '为空': 'vazio', '存在': 'existe', '不存在': 'não existe',
    '包含': 'inclui', '排除': 'exclui', '匹配': 'corresponde', '比较': 'comparar',
    '排序': 'ordenar', '过滤': 'filtrar', '遍历': 'percorrer', '循环遍历': 'iterar',
    '递归': 'recursão', '深拷贝': 'cópia profunda', '浅拷贝': 'cópia rasa', '克隆': 'clonar',
    '序列化': 'serialização', '反序列化': 'desserialização', '压缩数据': 'compactar dados',
    '加密': 'criptografar', '解密': 'descriptografar', '签名': 'assinatura', '校验': 'validar',
    '剪贴板': 'área de transferência', '系统剪贴板': 'área de transferência do sistema',
    '右键菜单': 'menu de contexto', '上下文菜单': 'menu de contexto', '气泡菜单': 'menu flutuante',
    '悬浮': 'flutuante', '浮动': 'flutuante', '弹出': 'pop-up', '弹窗': 'janela pop-up',
    '对话框': 'diálogo', '抽屉': 'drawer', '遮罩': 'máscara', '蒙层': 'camada de máscara',
    '滚动': 'rolagem', '滚动条': 'barra de rolagem', '触底': 'tocar o fundo',
    '视口': 'viewport', '视窗': 'viewport', '屏幕': 'tela', '显示器': 'monitor',
    '设备': 'dispositivo', '移动端': 'versão móvel', '手机': 'celular', '平板': 'tablet',
    '触摸': 'toque', '手势': 'gesto', '捏合': 'pinçar', '双指': 'dois dedos',
    '浏览器': 'navegador', '兼容': 'compatibilidade', '支持': 'suporte', '不支持': 'não suportado',
    '权限': 'permissão', '安全': 'segurança', '本地': 'local', '远程': 'remoto', '在线': 'online',
    '离线': 'offline', '云端': 'nuvem', '服务': 'serviço', '资源': 'recurso', '图片链接': 'link da imagem',
    '占位图': 'imagem de espaço reservado', '水印': 'marca d\'água', '缩略': 'miniatura',
    '演示': 'apresentar', '演示文稿': 'apresentação', '演讲': 'palestra', '会议': 'reunião',
    '教学': 'ensino', '课件': 'material didático', '报告': 'relatório', '简历': 'currículo',
    '海报设计': 'design de pôster', '营销': 'marketing', '商业': 'comercial',
    '样式表': 'folha de estilo', '类名': 'nome da classe', '选择器': 'seletor',
    '伪类': 'pseudo-classe', '内联样式': 'estilo inline', '层叠': 'cascata',
    '盒模型': 'box model', '布局': 'layout', '流式': 'fluxo', '弹性': 'flexível',
    '栅格': 'grade', '间距': 'espaçamento', '边距': 'margem', '内边距': 'espaçamento interno',
    '外边距': 'margem externa', '圆角半径': 'raio do canto', '描边宽度': 'espessura do contorno',
    '线条样式': 'estilo da linha', '虚线': 'tracejado', '实线': 'sólido', '点线': 'pontilhado',
    '箭头样式': 'estilo da seta', '无箭头': 'sem seta',
    '形状格式刷': 'pincel de formato de forma', '文字格式刷': 'pincel de formato de texto',
    '格式化': 'formatar', '美化': 'embelezar', '扩写': 'expandir', '精简': 'resumir',
    '润色': 'refinar', '改写': 'reescrever', '续写': 'continuar escrevendo', '翻译': 'traduzir',
    '纠错': 'corrigir', '校正': 'correção', '自动校正': 'correção automática',
    '误操作': 'operação acidental', '防抖': 'debounce', '节流': 'throttle',
    '拖拽复制': 'duplicação por arraste', '拖拽结束': 'fim do arraste', '拖拽中': 'arrastando',
    '松开': 'soltar', '按下': 'pressionar', '抬起': 'soltar', '双击连续使用': 'duplo clique para uso contínuo',
    '连续使用': 'uso contínuo', '开关状态': 'estado do interruptor',
    '重叠': 'sobreposição', '层级关系': 'relação de camadas', '最上层': 'camada superior',
    '最底层': 'camada inferior', '上移一层': 'avançar uma camada', '下移一层': 'recuar uma camada',
    '分组元素': 'elementos agrupados', '组员': 'membro do grupo', '组成员': 'membro do grupo',
    '整体': 'conjunto', '整体范围': 'faixa do conjunto', '整体缩放': 'escala do conjunto',
    '互斥': 'mutuamente exclusivo', '冲突': 'conflito', '优先': 'prioridade', '优先级': 'prioridade',
    '回退': 'reverter', '前进': 'avançar', '跳转': 'saltar', '跳转页面': 'saltar para a página',
    '目标页面': 'página de destino', '当前页': 'página atual', '下一页': 'próxima página',
    '上一页': 'página anterior', '第一页': 'primeira página', '最后一页': 'última página',
    '翻页': 'virar a página', '切换': 'alternar', '切换页面': 'trocar de página',
    '切换动画': 'animação de transição', '过渡动画': 'animação de transição',
    '线性渐变': 'gradiente linear', '径向渐变': 'gradiente radial', '渐变角度': 'ângulo do gradiente',
    '色标': 'marcador de cor', '色值': 'valor de cor', '色板': 'paleta', '取色': 'conta-gotas',
    '吸色': 'capturar cor', '最近使用': 'usadas recentemente', '常用颜色': 'cores frequentes',
    '主题颜色': 'cores do tema', '预设颜色': 'cores predefinidas', '标准色': 'cores padrão',
    '最近颜色': 'cores recentes', '透明色': 'cor transparente',
    '表格数据': 'dados da tabela', '图表数据': 'dados do gráfico', '系列': 'série', '图例': 'legenda',
    '坐标轴': 'eixo', '横轴': 'eixo X', '纵轴': 'eixo Y', '数据标签': 'rótulo de dados',
    '柱状图': 'gráfico de colunas', '条形图': 'gráfico de barras', '折线图': 'gráfico de linhas',
    '面积图': 'gráfico de área', '散点图': 'gráfico de dispersão', '饼图': 'gráfico de pizza',
    '环形图': 'gráfico de rosca', '雷达图': 'gráfico de radar', '平滑曲线': 'curva suave',
    '柱宽': 'largura da coluna', '条宽': 'largura da barra', '圆角柱': 'coluna arredondada',
    '堆叠': 'empilhado', '百分比堆叠': 'empilhado 100%', '极坐标': 'coordenadas polares',
    '禁用状态': 'estado desativado', '只读': 'somente leitura', '可编辑': 'editável',
    '输入框': 'campo de entrada', '数字输入': 'entrada numérica', '文本输入': 'entrada de texto',
    '下拉选择': 'seleção suspensa', '下拉菜单': 'menu suspenso', '滑块': 'controle deslizante',
    '步进': 'incremento', '步长': 'passo', '精度': 'precisão', '小数位': 'casas decimais',
    '取值范围': 'faixa de valores', '越界': 'fora dos limites', '溢出': 'transbordamento',
    '截断': 'truncar', '省略': 'omitir', '换行': 'quebra de linha', '自动换行': 'quebra automática de linha',
    '滚动到': 'rolar até', '定位到': 'posicionar em', '锚定': 'ancorar',
    '重置': 'redefinir', '恢复默认': 'restaurar padrão', '还原': 'restaurar',
    '清空回收站': 'esvaziar lixeira', '回收站': 'lixeira', '垃圾回收': 'coleta de lixo',
    '内存泄漏': 'vazamento de memória', '性能': 'desempenho', '优化': 'otimização',
    '调试': 'depuração', '日志': 'registro', '打印日志': 'exibir registro', '打印输出': 'saída',
    '环境': 'ambiente', '生产环境': 'ambiente de produção', '开发环境': 'ambiente de desenvolvimento',
    '测试': 'teste', '模拟': 'simulação', '真实': 'real', '虚拟': 'virtual',
    '实例': 'instância', '单例': 'singleton', '工厂': 'fábrica', '构造函数': 'construtor',
    '继承': 'herança', '多态': 'polimorfismo', '封装': 'encapsulamento', '接口定义': 'definição de interface',
    '类型定义': 'definição de tipo', '类型声明': 'declaração de tipo', '泛型': 'genérico',
    '枚举': 'enumeração', '接口类型': 'tipo de interface', '可选属性': 'propriedade opcional',
    '必填': 'obrigatório', '选填': 'opcional', '默认值': 'valor padrão', '空值': 'valor nulo',
    '未定义': 'indefinido', '布尔值': 'booleano', '数值': 'valor numérico', '整数': 'inteiro',
    '浮点数': 'ponto flutuante', '正数': 'positivo', '负数': 'negativo', '零': 'zero',
    '像素': 'pixel', '厘米': 'centímetro', '英寸': 'polegada', '磅': 'ponto',
    '倍数': 'múltiplo', '系数': 'coeficiente', '增量': 'incremento', '减量': 'decremento',
    '偏移': 'deslocamento', '偏移量': 'deslocamento', '距离': 'distância', '间距': 'espaçamento',
    '角度': 'ângulo', '弧度': 'radiano', '顺时针': 'sentido horário', '逆时针': 'sentido anti-horário',
    '正弦': 'seno', '余弦': 'cosseno', '正切': 'tangente', '反正切': 'arcotangente',
    '勾股定理': 'teorema de Pitágoras', '斜边': 'hipotenusa', '直角边': 'cateto',
    '圆心': 'centro do círculo', '半径': 'raio', '直径': 'diâmetro', '周长': 'perímetro', '面积': 'área',
    '交点': 'ponto de interseção', '交线': 'linha de interseção', '垂直平分线': 'mediatriz',
    '中点': 'ponto médio', '重心': 'centro de gravidade', '顶点': 'vértice', '边': 'lado',
    '内切': 'inscrito', '外接': 'circunscrito', '相似': 'semelhante', '全等': 'congruente',
    '平移': 'translação', '镜像': 'espelhamento', '翻转': 'espelhar', '倾斜': 'inclinação',
    '扭曲': 'distorção', '变换': 'transformação', '矩阵': 'matriz', '向量': 'vetor',
    '坐标系': 'sistema de coordenadas', '原点': 'origem', '横坐标': 'abscissa', '纵坐标': 'ordenada',
    '四舍五入': 'arredondar', '向上取整': 'arredondar para cima', '向下取整': 'arredondar para baixo',
    '绝对值': 'valor absoluto', '平方': 'quadrado', '开方': 'raiz quadrada', '幂': 'potência',
    '对数': 'logaritmo', '指数': 'expoente', '常数': 'constante', '无穷': 'infinito',
    '未命名': 'sem título', '未标题': 'sem título', '无标题': 'sem título',
    '新添加文本': 'texto adicionado', '新建文本': 'novo texto', '新增': 'adicionado',
}

def is_comment(line: str) -> bool:
    t = line.strip()
    return t.startswith('//') or t.startswith('*') or t.startswith('/*') or (t.startswith('<!--') and t.endswith('-->'))

def translate_text(text: str) -> str:
    items = sorted(COMMENTS.items(), key=lambda kv: -len(kv[0]))
    for zh, pt in items:
        if zh in text:
            text = text.replace(zh, pt)
    return text

changed_files = 0
changed_lines = 0

targets = []
for base, dirs, fnames in os.walk(os.path.join(ROOT, 'src')):
    for fn in fnames:
        if fn.endswith(('.vue', '.ts')):
            targets.append(os.path.join(base, fn))
targets.append(os.path.join(ROOT, 'index.html'))

for path in targets:
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    modified = False
    for i, line in enumerate(lines):
        if not CJK.search(line):
            continue
        if not is_comment(line):
            continue
        new = cc.convert(line)
        new = translate_text(new)
        if new != line:
            lines[i] = new
            modified = True
            changed_lines += 1
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        changed_files += 1

print(f'Arquivos: {changed_files}, linhas de comentário traduzidas: {changed_lines}')
