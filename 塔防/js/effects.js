let effects = [];

// 生成波紋特效（強化版，可指定線寬）
function spawnWaveEffect(x, y, maxRadius, duration, color, lineWidth = 2) {
  effects.push({
    type: 'wave',
    x, y, maxRadius,
    currentRadius: 0,
    duration, timer: duration,
    color, lineWidth
  });
}

// 生成浮動文字特效（向上飄並淡出）
function spawnFloatingText(x, y, text, color, duration = 40) {
  effects.push({
    type: 'text',
    x, y, text, color,
    duration, timer: duration,
    offsetY: 0
  });
}

function updateEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    const ef = effects[i];
    ef.timer--;
    if (ef.timer <= 0) {
      effects.splice(i, 1);
      continue;
    }
    if (ef.type === 'wave') {
      const progress = 1 - (ef.timer / ef.duration);
      ef.currentRadius = ef.maxRadius * progress;
    } else if (ef.type === 'text') {
      ef.offsetY = (1 - ef.timer / ef.duration) * -20; // 向上飄 20px
    }
  }
}

function drawEffects(ctx) {
  for (let ef of effects) {
    if (ef.type === 'wave') {
      const alpha = (ef.timer / ef.duration) * 0.5;
      ctx.strokeStyle = ef.color.replace(/[\d.]+\)$/, alpha.toFixed(2) + ')');
      ctx.lineWidth = ef.lineWidth;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.currentRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ef.type === 'text') {
      const alpha = ef.timer / ef.duration;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ef.color;
      ctx.font = 'bold 14px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText(ef.text, ef.x, ef.y + ef.offsetY);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  }
}