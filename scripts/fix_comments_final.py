#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fase 3: traduz TODOS os caracteres chineses restantes em comentários, gramática → pt-BR."""
import os, re
from opencc import OpenCC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cc = OpenCC('tw2s')
CJK = re.compile(r'[\u4e00-\u9fff]')

M = {
 '的': 'do ', '时': 'quando ', '将': '', '到': 'até ', '和': ' e ', '和终': 'e o fim', '为': 'como ',
 '心': 'centro', '该': 'este ', '在': 'em ', '并': ' e ', '选': 'seleci', '当前': 'atual ',
 '成员': 'membro', '色': 'cor', '下': 'sob ', '焦': 'foco', '如果': 'se ', '需要': 'é necessário ',
 '内': 'dentro', '被': 'ser ', '操作': 'opera', '后': 'após ', '根据': 'conforme ', '后的': 'após ',
 '区域': 'área', '键': 'tecla', '则': 'então ', '是否为': 'se é ', '清除': 'limpar',
 '目标': 'alvo', '固定': 'fixo', '所有': 'todos ', '用于': 'usado para ', '从': 'de ',
 '模式': 'modo', '当前操作的': 'em operação', '相': 'relativo', '过': 'passar', '上': 'acima',
 '宽高': 'largura/altura', '起': 'início', '当': 'quando ', '到该': 'até este ', '通过': 'por ',
 '指定的': 'especificado', '普通': 'normal', '尝试': 'tentar', '当前选': 'seleção atual',
 '打': 'abr', '击': 'ar', '如果目标': 'se o alvo', '右': 'direita', '仅': 'somente ',
 '例如': 'ex.: ', '线': 'linha', '端': 'ponta', '最': 'mais ', '纯色': 'cor sólida',
 '命令': 'comando', '本页所有': 'todos desta página', '需要将该': 'é necessário ',
 '进': 'entrar', '一组': 'um grupo', '被选': 'seleci', '后再': 'após ', '且': ' e ',
 '一': 'um ', '住': 'segurar', '为选': 'seleci', '会被': 'será ', '作为': 'como ',
 '终': 'final', '如': 'como ', '如果被操作的': 'se o elemento operado', '已经处在顶层': 'já está no topo',
 '法继续': 'ão pode continuar', '若上层': 'se a camada superior', '则将上述被': 'então o acima ',
 '到该上层': 'a esta camada superior', '上方': 'acima', '待': 'aguardar', '不': 'não ',
 '是否': 'se ', '一个': 'um ', '数': 'número', '指定': 'especificado', '原': 'original',
 '一起': 'junto', '擦除': 'apagar', '原始': 'original', '位': 'posição', '为基础': 'como base',
 '新的': 'novo ', '变化时': 'ao mudar', '须': 'precisa', '过的': 'feito', '顶部': 'topo',
 '等': 'igual', '包括': 'inclui ', '是': 'é ', '上一层的': 'da camada superior', '然后将该': 'então ',
 '不是': 'não é ', '同': 'mesmo', '调整': 'ajustar', '系': 'sistema', '对应': 'correspondente',
 '为被': 'ser ', '均匀排': 'distribuição uniforme', '的目标': 'alvo', '应用': 'aplicar',
 '是否可以': 'se é possível', '否则': 'caso contrário ', '于': 'em ', '参照': 'referência',
 '类': 'tipo', '的绝对': 'absoluto', '以': 'com ', '两个': 'dois ', '中': 'meio',
 '于顶': 'no topo', '于底': 'na base', '层': 'camada', '层后': 'camada', '点': 'ponto',
 '了': '', '着': '', '去': '', '重': 'novo', '新': '', '开': 'abr', '关': 'fechar',
 '个': '', '们': '', '吗': '', '呢': '', '吧': '', '啊': '', '的（': ' (', '（': ' (', '）': ') ',
 '，': ', ', '。': '. ', '；': '; ', '：': ': ', '！': '! ', '？': '? ', '、': ', ',
 '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
 '零': '0', '两': '2', '双': 'duplo', '单': 'único', '第': 'nº ',
 '与': ' e ', '或': ' ou ', '即': 'ou seja, ', '及': ' e ', '以及': ' e ', '但': 'mas ',
 '而': 'enquanto ', '因此': 'portanto ', '所以': 'por isso ', '因为': 'porque ', '由于': 'como ',
 '如果无': 'se não há ', '无法': 'não é possível', '不能': 'não pode', '不可': 'não ',
 '已': 'já ', '未': 'ainda não ', '无': 'sem ', '有': 'há ', '没': 'não há ',
 '其': 'seu ', '其他': 'outros', '此': 'este ', '这些': 'estes ', '那些': 'esses ',
 '之': 'de ', '间': 'entre ', '前': 'antes ', '先': 'primeiro ', '再': 'então ',
 '又': 'também ', '还': 'também ', '也': 'também ', '都': 'todos ', '只': 'apenas ',
 '要': 'deve ', '会': 'vai ', '能': 'pode ', '可': 'pode ', '需': 'precisa ',
 '让': 'permitir ', '使': 'fazer ', '把': '', '给': 'para ', '向': 'para ',
 '往': 'para ', '朝': 'em direção a ', '沿': 'ao longo de ', '顺': 'seguindo ',
 '按': 'pressionar ', '据': 'conforme ', '依': 'conforme ', '靠': 'com base em ',
 '用': 'usar ', '使�用': 'usar ', '使用': 'usar ', '利�用': 'usar ', '利�用': 'usar ',
 '生成': 'gerar', '触发': 'disparar', '执行': 'executar', '处�理': 'processar',
 '判断': 'verificar', '检查': 'verificar', '检测': 'detectar', '获取': 'obter',
 '设置': 'definir', '更新': 'atualizar', '修改': 'alterar', '删除': 'excluir',
 '添加': 'adicionar', '插入': 'inserir', '移除': 'remover', '复制': 'copiar',
 '粘贴': 'colar', '剪切': 'recortar', '保存': 'salvar', '加载': 'carregar',
 '渲染': 'renderizar', '绘制': 'desenhar', '计算': 'calcular', '转换': 'converter',
 '处理': 'processar', '过滤': 'filtrar', '排序': 'ordenar', '遍历': 'percorrer',
 '合并': 'mesclar', '拆分': 'dividir', '替换': 'substituir', '清除': 'limpar',
 '重置': 'redefinir', '恢复': 'restaurar', '撤销': 'desfazer', '重做': 'refazer',
 '开始': 'iniciar', '结束': 'encerrar', '停止': 'parar', '暂停': 'pausar',
 '播放': 'reproduzir', '预览': 'prévia', '显示': 'mostrar', '隐藏': 'ocultar',
 '锁定': 'bloquear', '解锁': 'desbloquear', '启用': 'ativar', '禁用': 'desativar',
 '激活': 'ativar', '选中': 'selecionar', '取消': 'cancelar', '确定': 'confirmar',
 '确认': 'confirmar', '关闭': 'fechar', '打开': 'abrir', '展开': 'expandir',
 '折叠': 'recolher', '滚动': 'rolar', '定位': 'posicionar', '聚焦': 'focar',
 '对齐': 'alinhar', '分布': 'distribuir', '组合': 'agrupar', '分组': 'grupo',
 '置于顶层': 'trazer para frente', '置于底层': 'enviar para trás',
 '上移': 'mover para cima', '下移': 'mover para baixo', '移动': 'mover',
 '拖拽': 'arrastar', '拖动': 'arrastar', '点击': 'clique', '双击': 'duplo clique',
 '右键': 'botão direito', '左键': 'botão esquerdo', '按键': 'pressionar tecla',
 '输入': 'entrada', '输出': 'saída', '上传': 'enviar', '下载': 'baixar',
 '导出': 'exportar', '导入': 'importar', '上传图片': 'enviar imagem',
 '图片': 'imagem', '图像': 'imagem', '视频': 'vídeo', '音频': 'áudio',
 '文本': 'texto', '文字': 'texto', '字体': 'fonte', '字号': 'tamanho da fonte',
 '颜色': 'cor', '背景': 'fundo', '边框': 'borda', '阴影': 'sombra',
 '透明度': 'opacidade', '不透明度': 'opacidade', '蒙版': 'máscara',
 '填充': 'preenchimento', '描边': 'contorno', '轮廓': 'contorno', '渐变': 'gradiente',
 '滤镜': 'filtro', '模糊': 'desfoque', '亮度': 'brilho', '对比度': 'contraste',
 '饱和度': 'saturação', '色相': 'matiz', '灰度': 'tons de cinza', '褐色': 'sépia',
 '旋转': 'rotação', '缩放': 'escala', '翻转': 'espelhar', '裁剪': 'recorte',
 '裁切': 'recorte', '画布': 'canvas', '页面': 'página', '幻灯片': 'slide',
 '主题': 'tema', '模板': 'modelo', '样式': 'estilo', '布局': 'layout',
 '元素': 'elemento', '组件': 'componente', '容器': 'contêiner', '面板': 'painel',
 '工具栏': 'barra de ferramentas', '菜单': 'menu', '按钮': 'botão', '图标': 'ícone',
 '窗口': 'janela', '对话框': 'diálogo', '弹窗': 'pop-up', '提示': 'dica',
 '警告': 'aviso', '错误': 'erro', '成功': 'sucesso', '失败': 'falha',
 '状态': 'estado', '属性': 'propriedade', '参数': 'parâmetro', '选项': 'opção',
 '配置': 'configuração', '数据': 'dados', '内容': 'conteúdo', '列表': 'lista',
 '集合': 'coleção', '数组': 'array', '对象': 'objeto', '函数': 'função',
 '方法': 'método', '变量': 'variável', '常量': 'constante', '值': 'valor',
 '类型': 'tipo', '名称': 'nome', '标题': 'título', '描述': 'descrição',
 '说明': 'nota', '注释': 'comentário', '标记': 'marcação', '标签': 'tag',
 '索引': 'índice', '编号': 'número', '数量': 'quantidade', '大小': 'tamanho',
 '长度': 'comprimento', '宽度': 'largura', '高度': 'altura', '深度': 'profundidade',
 '位置': 'posição', '坐标': 'coordenadas', '方向': 'direção', '角度': 'ângulo',
 '距离': 'distância', '偏移': 'deslocamento', '偏移量': 'deslocamento',
 '范围': 'faixa', '区域': 'área', '边界': 'limite', '边缘': 'borda',
 '中心': 'centro', '顶部': 'topo', '底部': 'base', '左侧': 'esquerda',
 '右侧': 'direita', '前方': 'frente', '后方': 'trás',
 '上边': 'borda superior', '下边': 'borda inferior', '左边': 'borda esquerda', '右边': 'borda direita',
 '水平': 'horizontal', '垂直': 'vertical', '横向': 'horizontal', '纵向': 'vertical',
 '对角': 'diagonal', '交叉': 'cruzamento', '平行': 'paralelo', '垂直于': 'perpendicular a ',
 '比例': 'proporção', '百分比': 'porcentagem', '倍数': 'múltiplo', '系数': 'coeficiente',
 '默认': 'padrão', '自定义': 'personalizado', '自动': 'automático', '手动': 'manual',
 '初始': 'inicial', '最终': 'final', '临时': 'temporário', '固定': 'fixo',
 '动态': 'dinâmico', '静态': 'estático', '全局': 'global', '局部': 'local',
 '当前': 'atual ', '历史': 'histórico', '记录': 'registro', '快照': 'snapshot',
 '版本': 'versão', '时间': 'tempo', '日期': 'data', '顺序': 'ordem',
 '排序方式': 'critério de ordenação', '优先': 'prioridade', '优先级': 'prioridade',
 '条件': 'condição', '规则': 'regra', '逻辑': 'lógica', '算法': 'algoritmo',
 '结构': 'estrutura', '格式': 'formato', '编码': 'codificação', '解码': 'decodificação',
 '加密': 'criptografar', '解密': 'descriptografar', '压缩': 'compactar', '解压': 'descompactar',
 '序列化': 'serialização', '缓存': 'cache', '存储': 'armazenamento', '内存': 'memória',
 '数据库': 'banco de dados', '表': 'tabela', '字段': 'campo', '记录集': 'conjunto de registros',
 '查询': 'consulta', '搜索': 'buscar', '查找': 'localizar', '匹配': 'corresponder',
 '替换为': 'substituir por ', '屏幕': 'tela', '视口': 'viewport', '视窗': 'viewport',
 '分辨率': 'resolução', '全屏': 'tela cheia', '放映': 'apresentação',
 '演讲者': 'apresentador', '观众': 'plateia', '备注': 'anotações', '批注': 'anotação',
 '画笔': 'caneta', '荧光笔': 'marca-texto', '橡皮擦': 'borracha', '墨迹': 'traço',
 '激光笔': 'caneta laser', '计时器': 'cronômetro', '倒计时': 'contagem regressiva',
 '黑板': 'quadro-negro', '白板': 'quadro branco', '笔迹': 'traço', '笔刷': 'pincel',
 '画笔工具': 'ferramenta de caneta', '绘图': 'desenho', '涂鸦': 'rabisco',
 '标尺': 'régua', '网格线': 'linha de grade', '网格': 'grade', '参考线': 'guias',
 '对齐线': 'linha de alinhamento', '吸附': 'encaixe', '辅助线': 'guias auxiliares',
 '缩略图': 'miniatura', '缩略图区域': 'área de miniaturas', '导航': 'navegação',
 '侧边栏': 'barra lateral', '头部': 'cabeçalho', '底部栏': 'barra inferior',
 '页眉': 'cabeçalho', '页脚': 'rodapé', '副标题': 'subtítulo', '正文': 'corpo',
 '封面': 'capa', '目录': 'sumário', '过渡': 'transição', '结束': 'encerramento',
 '章节': 'capítulo', '节': 'seção', '章': 'capítulo', '项': 'item', '条目': 'item',
 '大纲': 'esboço', '结构树': 'árvore', '树': 'árvore',
 '多选': 'multiseleção', '单选': 'seleção única', '框选': 'seleção por retângulo',
 '反选': 'inverter seleção', '全选': 'selecionar tudo', '选择': 'seleção',
 '格式刷': 'pincel de formato', '富文本': 'texto rico', '纯文本': 'texto simples',
 '粗体': 'negrito', '斜体': 'itálico', '下划线': 'sublinhado', '删除线': 'tachado',
 '上标': 'sobrescrito', '下标': 'subscrito', '高亮': 'realce', '背景色': 'cor de fundo',
 '前景色': 'cor de primeiro plano', '行内代码': 'código inline', '代码块': 'bloco de código',
 '引用': 'citação', '列表标记': 'marcador de lista', '编号列表': 'lista numerada',
 '项目符号': 'marcadores', '缩进': 'recuo', '首行缩进': 'recuo da primeira linha',
 '行间距': 'entrelinha', '段间距': 'espaço entre parágrafos', '字间距': 'espaçamento entre letras',
 '行高': 'altura da linha', '段落': 'parágrafo', '字符': 'caractere', '汉字': 'ideograma',
 '单词': 'palavra', '句子': 'frase', '语言': 'idioma', '语种': 'idioma',
 '风格': 'estilo', '主题风格': 'estilo do tema', '配色': 'paleta', '色板': 'paleta',
 '色值': 'valor de cor', '色块': 'bloco de cor', '色标': 'marcador de cor',
 '最近使用': 'usadas recentemente', '常用': 'frequentes', '常用符号': 'símbolos comuns',
 '符号': 'símbolo', '表情': 'emojis', '动植物': 'animais e plantas', '食物': 'comidas',
 '旅行': 'viagem', '活动': 'atividades', '物品': 'objetos', '箭头': 'setas',
 '数学': 'matemática', '字母': 'letras', '希腊字母': 'alfabeto grego',
 '图形': 'formas', '形状': 'forma', '线条': 'linha', '折线': 'polilinha',
 '曲线': 'curva', '直线': 'reta', '线段': 'segmento', '弧线': 'arco',
 '圆弧': 'arco', '椭圆': 'elipse', '圆形': 'círculo', '矩形': 'retângulo',
 '三角形': 'triângulo', '多边形': 'polígono', '星形': 'estrela', '心形': 'coração',
 '图表': 'gráfico', '柱状图': 'gráfico de colunas', '条形图': 'gráfico de barras',
 '折线图': 'gráfico de linhas', '面积图': 'gráfico de área', '散点图': 'gráfico de dispersão',
 '饼图': 'gráfico de pizza', '环形图': 'gráfico de rosca', '雷达图': 'gráfico de radar',
 '图例': 'legenda', '系列': 'série', '类别': 'categoria', '坐标轴': 'eixo',
 '横轴': 'eixo X', '纵轴': 'eixo Y', '数据标签': 'rótulo de dados', '数据系列': 'série de dados',
 '表格': 'tabela', '单元格': 'célula', '表头': 'cabeçalho', '表尾': 'rodapé da tabela',
 '行标题': 'título da linha', '列标题': 'título da coluna', '汇总行': 'linha de totais',
 '主题表格': 'tema da tabela', '条纹': 'listrado', '斑马纹': 'zebrado',
 '边距': 'margem', '内边距': 'espaçamento interno', '外边距': 'margem externa',
 '边框样式': 'estilo da borda', '边框颜色': 'cor da borda', '边框粗细': 'espessura da borda',
 '线条样式': 'estilo da linha', '线条颜色': 'cor da linha', '线条宽度': 'espessura da linha',
 '起点样式': 'estilo do início', '终点样式': 'estilo do fim', '线条方向': 'direção da linha',
 '圆角': 'canto arredondado', '圆角半径': 'raio do canto', '直角': 'canto reto',
 '虚线': 'tracejado', '实线': 'sólido', '点线': 'pontilhado', '波浪线': 'linha ondulada',
 '双向箭头': 'seta dupla', '单向箭头': 'seta simples', '无箭头': 'sem seta',
 '平滑曲线': 'curva suave', '堆叠样式': 'estilo empilhado', '柱宽': 'largura da coluna',
 '链接': 'link', '超链接': 'hiperlink', '网页': 'página web', '网址': 'URL',
 '地址': 'endereço', '视频地址': 'endereço do vídeo', '音频地址': 'endereço do áudio',
 '在线': 'online', '离线': 'offline', '本地': 'local', '远程': 'remoto',
 '服务器': 'servidor', '客户端': 'cliente', '接口': 'API', '请求': 'requisição',
 '响应': 'resposta', '超时': 'tempo esgotado', '重试': 'tentar novamente',
 '浏览器': 'navegador', '剪贴板': 'área de transferência', '系统': 'sistema',
 '设备': 'dispositivo', '移动端': 'móvel', '手机': 'celular', '触摸': 'toque',
 '手势': 'gesto', '捏合': 'pinçar', '键盘': 'teclado', '鼠标': 'mouse',
 '滚轮': 'roda do mouse', '光标': 'cursor', '指针': 'ponteiro', '热区': 'hotzone',
 '快捷键': 'atalho', '热键': 'atalho', '组合键': 'combinação de teclas',
 '修饰键': 'tecla modificadora', '控制键': 'tecla Ctrl', '换档键': 'tecla Shift',
 '切换键': 'tecla Alt', '制表键': 'tecla Tab', '回车键': 'tecla Enter',
 '空格键': 'barra de espaço', '退出键': 'tecla ESC', '删除键': 'tecla Delete',
 '退格键': 'tecla Backspace', '方向键': 'teclas de seta',
 '撤销历史': 'histórico de desfazer', '操作记录': 'registro de operações',
 '操作日志': 'registro de operações', '最大长度': 'comprimento máximo',
 '最小长度': 'comprimento mínimo', '指针位置': 'posição do ponteiro',
 '误操作': 'operação acidental', '防抖': 'debounce', '节流': 'throttle',
 '性能': 'desempenho', '优化': 'otimização', '渲染性能': 'desempenho de renderização',
 '卡顿': 'engasgo', '抖动': 'tremulação', '闪烁': 'piscar', '闪烁问题': 'problema de piscar',
 '未知': 'desconhecido', '异常': 'exceção', '崩溃': 'falha crítica', '挂起': 'suspenso',
 '阻塞': 'bloqueio', '等待': 'aguardar', '延迟': 'atraso', '立即': 'imediatamente',
 '实时': 'em tempo real', '定时': 'temporizado', '循环播放': 'reprodução em loop',
 '自动播放': 'reprodução automática', '静音': 'mudo', '音量': 'volume',
 '倍速': 'velocidade', '播放器': 'reprodutor', '控制条': 'barra de controle',
 '进度条': 'barra de progresso', '封面图': 'imagem de capa', '封面': 'capa',
 '首帧': 'primeiro quadro', '海报': 'pôster', '字幕': 'legenda',
 '演示': 'apresentar', '演示文稿': 'apresentação', '演讲': 'palestra',
 '放映模式': 'modo de apresentação', '编辑模式': 'modo de edição',
 '预览模式': 'modo de prévia', '浏览模式': 'modo de visualização',
 '普通视图': 'visão normal', '演讲者视图': 'visão do apresentador', '观众视图': 'visão da plateia',
 '协作': 'colaboração', '共享': 'compartilhar', '权限': 'permissão',
 '游客': 'visitante', '用户': 'usuário', '账户': 'conta', '登录': 'login',
 '注册': 'registro', '退出登录': 'logout', '个人中心': 'perfil',
 '设置页面': 'página de configurações', '设置中心': 'central de configurações',
 '帮助': 'ajuda', '关于': 'sobre', '反馈': 'feedback', '意见': 'opinião',
 '建议': 'sugestão', '更新日志': 'registro de atualizações', '版本号': 'número da versão',
 '开源': 'código aberto', '许可': 'licença', '协议': 'acordo', '版权': 'direitos autorais',
 '仓库': 'repositório', '项目': 'projeto', '代码仓库': 'repositório de código',
 '问题反馈': 'relatar problema', '缺陷': 'defeito', '功能': 'função',
 '特性': 'característica', '新增功能': 'nova função', '已知问题': 'problemas conhecidos',
 '开发': 'desenvolvimento', '开发者': 'desenvolvedor', '团队': 'equipe',
 '贡献': 'contribuição', '贡献者': 'contribuidor', '社区': 'comunidade',
 '官方': 'oficial', '制作': 'criação', '深度完善': 'refinamento',
 '优化完善': 'melhorias', '重构': 'refatoração', '修复': 'correção',
 '补丁': 'patch', '发布': 'publicação', '上线': 'lançamento', '下线': 'descontinuação',
 '废弃': 'obsoleto', '过时': 'desatualizado', '兼容': 'compatibilidade',
 '浏览器兼容': 'compatibilidade do navegador', '渐进增强': 'melhoria progressiva',
 '优雅降级': 'degradação elegante', '回退方案': 'plano de contingência',
}

def is_comment(line):
    t = line.strip()
    return t.startswith('//') or t.startswith('*') or t.startswith('/*') or (t.startswith('<!--') and t.endswith('-->'))

def translate(text):
    items = sorted(M.items(), key=lambda kv: -len(kv[0]))
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
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()
    modified = False
    for i, line in enumerate(lines):
        if not CJK.search(line):
            continue
        if not is_comment(line):
            continue
        new = translate(cc.convert(line))
        if new != line:
            lines[i] = new
            modified = True
            changed_lines += 1
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        changed_files += 1

print(f'Arquivos: {changed_files}, linhas traduzidas: {changed_lines}')
