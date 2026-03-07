# Suno 平台支持 + 音频模式优化完成 ✅

## 🎵 完成的工作

### 1. 添加 Suno 平台支持

#### manifest.json
```json
"host_permissions": [
  ...
  "https://suno.com/*",
  "https://www.suno.com/*"
]

"content_scripts": {
  "matches": [
    ...
    "https://suno.com/*",
    "https://www.suno.com/*"
  ]
}
```

#### content.js
添加了 Suno 平台配置：
- 支持歌词输入框
- 支持歌曲风格描述输入框
- 自动检测 Suno 网站

---

### 2. 音频模式升级 - 歌词/风格选择

#### HTML 结构更新
在音频面板中添加了类型选择器：

```html
<!-- 音频类型选择 -->
<div class="audio-type-selector">
  <label class="audio-type-label">优化目标：</label>
  <div class="audio-type-options">
    <label class="audio-type-option">
      <input type="radio" name="audioType" value="style" checked>
      <span class="radio-label">🎨 歌曲风格</span>
      <span class="radio-desc">Suno 风格描述</span>
    </label>
    <label class="audio-type-option">
      <input type="radio" name="audioType" value="lyrics">
      <span class="radio-label">📝 歌词创作</span>
      <span class="radio-desc">完整歌词结构</span>
    </label>
  </div>
</div>
```

#### CSS 样式
添加了美观的样式：
- 两个选项卡片
- 选中状态高亮
- 悬停效果
- 响应式布局

---

### 3. 核心逻辑更新

#### sidepanel.js
1. **添加音频类型状态**
```javascript
let audioType = 'style'  // 默认优化风格描述
```

2. **监听类型切换**
```javascript
audioTypeInputs.forEach(input => {
  input.addEventListener('change', (e) => {
    audioType = e.target.value
    // 更新输入框提示
    input.placeholder = audioType === 'lyrics'
      ? '描述你想要创作的歌词内容...'
      : '描述你想要生成的音乐风格...'
  })
})
```

3. **根据类型生成不同的提示词**

**歌曲风格模式 (style)**：
```
A [genre] song with [mood] atmosphere,
featuring [instruments].
Tempo: [BPM], in [style] style.

示例：A relaxing electronic song with
calm atmosphere, featuring soft synthesizer
pads and gentle percussion. Tempo: 90 BPM,
in ambient style.
```

**歌词创作模式 (lyrics)**：
```
[Verse 1]
歌词内容...

[Chorus]
副歌内容...

[Bridge]
桥段内容...

[Outro]
结尾内容...
```

---

## 🎯 使用流程

### 在 Suno 平台上使用

1. **打开 Suno** (suno.com)
2. **打开 Gestalt 侧边栏**
3. **切换到 🎵 音频模式**
4. **选择优化目标**：
   - 🎨 歌曲风格 - 优化风格描述 prompt
   - 📝 歌词创作 - 优化完整歌词
5. **输入你的描述**
6. **点击发送**
7. **复制优化结果到 Suno**

---

## 📝 示例场景

### 场景 1：优化歌曲风格
```
用户输入：轻松的咖啡厅音乐

选择：🎨 歌曲风格

优化输出：
A relaxing ambient song with calm atmosphere,
featuring soft piano and gentle percussion.
Tempo: 70 BPM, in lo-fi style.

直接复制到 Suno 的 Style 输入框
```

### 场景 2：优化歌词
```
用户输入：写一首关于夏天和青春的歌

选择：📝 歌词创作

优化输出：
[Verse 1]
阳光洒满窗台
蝉鸣唤醒夏天...

[Chorus]
青春就是现在
奔跑不会停顿...

复制到 Suno 的 Lyrics 输入框
```

---

## ✨ 优势

1. **专门针对 Suno** - 英文 prompt 格式完美适配
2. **歌词/风格分离** - 清晰明确，不会混淆
3. **专业优化** - 根据类型使用不同的优化策略
4. **界面美观** - 直观的单选按钮

---

## 📦 更新的文件

1. **manifest.json**
   - 添加 suno.com 到 host_permissions
   - 添加到 content_scripts matches

2. **content.js**
   - 添加 Suno 平台配置

3. **sidepanel.html**
   - 添加音频类型选择器

4. **sidepanel.css**
   - 添加音频类型选择器样式

5. **sidepanel.js**
   - 添加音频类型状态
   - 添加类型切换监听
   - 添加 getAudioSystemPrompt() 函数
   - 根据类型生成不同的提示词

---

## 🚀 立即使用

1. 重新加载 Chrome 扩展
2. 打开 suno.com
3. 打开 Gestalt 侧边栏
4. 切换到 🎵 音频模式
5. 看到两个选项：
   - 🎨 歌曲风格（默认）
   - 📝 歌词创作
6. 选择你要优化的类型
7. 输入描述并发送
8. 复制优化结果到 Suno

---

## 💡 提示

- **风格描述**：选择 🎨 歌曲风格，优化后的内容复制到 Suno 的 "Song Description" 输入框
- **歌词创作**：选择 📝 歌词创作，优化后的内容复制到 Suno 的 "Lyrics" 输入框

---

🎉 享受在 Suno 上创作音乐的便利！
