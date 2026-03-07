// ==========================================
// 音频欢迎消息更新（手动替换到 sidepanel.js）
// ==========================================

// 找到 getWelcomeMessage 函数中的 audio 部分（约第429-440行）
// 替换为以下内容：

    audio: `<div class="message assistant">
      <div class="message-avatar">🎵</div>
      <div class="message-content">
        <p>你好！我是 <strong>Gestalt 音频模式</strong>。</p>
        <p>专为 Suno、Udio 等 AI 音乐平台优化提示词。</p>
        <p><strong>选择优化目标：</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>🎨 <strong>歌曲风格</strong> - 优化音乐风格描述 prompt</li>
          <li>📝 <strong>歌词创作</strong> - 优化完整歌词结构</li>
        </ul>
        <p>在下方选择你要优化的类型，然后输入描述即可。</p>
        <div class="quick-prompts">
          <button class="quick-prompt" data-prompt="制作一首轻松的咖啡厅背景音乐">☕ 咖啡厅音乐</button>
          <button class="quick-prompt" data-prompt="赛博朋克风格的电子音乐，适合游戏场景">🎮 游戏音乐</button>
          <button class="quick-prompt" data-prompt="电影预告片风格的史诗级管弦乐">🎬 电影配乐</button>
          <button class="quick-prompt" data-prompt="创作一首关于夏天和青春���流行歌曲">🌸 夏日青春</button>
        </div>
      </div>
    </div>`
