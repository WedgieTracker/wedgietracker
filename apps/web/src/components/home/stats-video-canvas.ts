import {
  type WaveLayer,
  type ConfettiParticle,
  type ShareableStats,
  CONFETTI_COLORS,
  getWedgieDays,
  pickStatusText,
} from "./stats-video-helpers";

export interface FrameContext {
  ctx: CanvasRenderingContext2D;
  waveLayers: WaveLayer[];
  confettiParticles: ConfettiParticle[];
  logoImage: HTMLImageElement | null;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });
}

export function createConfettiParticles(
  width: number,
  height: number,
): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * -3 - 1,
      radius: Math.random() * 5 + 3,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
      opacity: Math.random() * 0.6 + 0.4,
      gravity: 0.08,
      drag: 0.98,
    });
  }
  return particles;
}

function drawConfetti(
  ctx: CanvasRenderingContext2D,
  particles: ConfettiParticle[],
  width: number,
  height: number,
) {
  for (const p of particles) {
    p.vy += p.gravity;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.x += p.vx;
    p.y += p.vy;

    if (p.y > height + p.radius) {
      p.y = -p.radius;
      p.x = Math.random() * width;
      p.vy = Math.random() * -1;
      p.vx = (Math.random() - 0.5) * 4;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWaveLayer(
  ctx: CanvasRenderingContext2D,
  layer: WaveLayer,
  waveLength: number,
  baseY: number,
) {
  const { width, height } = ctx.canvas;

  layer.phase += layer.speedMultiplier * 0.02;
  if (layer.phase > 2 * Math.PI) {
    layer.phase -= 2 * Math.PI;
  }

  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x <= width + 10; x += 10) {
      const dx = (x / waveLength) * 2 * Math.PI + layer.phase + i * Math.PI;
      const yOffsetCalculated = Math.sin(dx) * 40;
      ctx.lineTo(x, baseY + layer.yOffset + yOffsetCalculated);
    }

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    ctx.fillStyle = `rgba(255, 0, 255, ${layer.opacity})`;
    ctx.fill();
  }
}

function drawLogoAndUrlBadge(
  ctx: CanvasRenderingContext2D,
  logoImage: HTMLImageElement | null,
  width: number,
  height: number,
  logoY: number,
  urlBottomOffset: number,
) {
  if (logoImage) {
    const logoWidth = 300;
    const logoHeight = 100;
    const logoX = width / 2 - logoWidth / 2;

    ctx.fillStyle = "rgba(31, 0, 77, 0.75)";
    ctx.beginPath();
    ctx.roundRect(
      logoX - 60,
      logoY - 60,
      logoWidth + 120,
      logoHeight + 120,
      20,
    );
    ctx.fill();
    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
  }

  const urlText = "WEDGIETRACKER.COM";
  ctx.font = "700 24px Inter";
  const textMetrics = ctx.measureText(urlText);
  const padding = 40;
  const buttonWidth = textMetrics.width + padding * 2;
  const buttonHeight = 50;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height - urlBottomOffset;

  ctx.strokeStyle = "rgb(23,0,43)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, buttonHeight / 2);
  ctx.stroke();

  ctx.fillStyle = "rgb(23,0,43)";
  ctx.textAlign = "center";
  ctx.fillText(urlText, width / 2, buttonY + 34);
}

function fitNumberFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxFontSize: number,
  maxWidth: number,
): number {
  let size = maxFontSize;
  ctx.font = `900 ${size}px Inter`;
  while (ctx.measureText(text).width > maxWidth && size > 40) {
    size -= 8;
    ctx.font = `900 ${size}px Inter`;
  }
  return size;
}

function setupFrame(
  frame: FrameContext,
  progress: number,
  stats: ShareableStats,
) {
  const { ctx, waveLayers, confettiParticles } = frame;
  const { width, height } = ctx.canvas;

  const numberAnimationProgress = Math.min(progress * 20, 1);
  const currentTotalWedgies = Math.round(
    stats.totalWedgies * numberAnimationProgress,
  );
  const currentPaceValue = Math.round(
    stats.currentPace * numberAnimationProgress,
  );
  const currentGamesValue = Math.round(
    stats.gamesPlayed * numberAnimationProgress,
  );

  const fillPercentage = Math.min((stats.totalWedgies / 50) * 100, 100);
  const currentFillPercentage = Math.min(
    fillPercentage,
    ((progress * 20) / 2) * 100,
  );

  ctx.fillStyle = "rgb(23,0,43)";
  ctx.fillRect(0, 0, width, height);

  const baseY = height - (currentFillPercentage / 100) * height;

  waveLayers.forEach((layer) => {
    drawWaveLayer(ctx, layer, width * 0.4, baseY);
  });

  if (fillPercentage >= 100 && currentFillPercentage >= fillPercentage) {
    drawConfetti(ctx, confettiParticles, width, height);
  }

  return {
    width,
    height,
    currentTotalWedgies,
    currentPaceValue,
    currentGamesValue,
  };
}

export function drawFrame(
  frame: FrameContext,
  progress: number,
  stats: ShareableStats,
) {
  const {
    width,
    height,
    currentTotalWedgies,
    currentPaceValue,
    currentGamesValue,
  } = setupFrame(frame, progress, stats);
  const { ctx } = frame;

  const statsWidth = width * 0.3;
  const statsHeight = height * 0.4;
  const statsX = (width - statsWidth) / 2;
  const statsY = (height - statsHeight) / 2 + 60;

  ctx.fillStyle = "rgba(31, 0, 77, 0.75)";
  ctx.beginPath();
  ctx.roundRect(statsX, statsY, statsWidth, statsHeight, 20);
  ctx.fill();

  ctx.font = "700 32px Inter";
  ctx.fillStyle = "#EAFF00";
  ctx.textAlign = "center";
  ctx.fillText(
    pickStatusText(stats.totalWedgies, stats.previousRecord),
    width / 2,
    statsY + 60,
  );

  ctx.font = "900 280px Inter";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(23, 0, 43, 0.8)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#EAFF00";
  ctx.fillText(
    currentTotalWedgies.toString(),
    width / 2,
    statsY + statsHeight / 2 + 85,
  );
  ctx.shadowBlur = 0;

  ctx.font = "900 75px Inter";
  ctx.fillText("WEDGIES", width / 2, statsY + statsHeight - 35);

  const statBoxWidth = width * 0.15;
  const statBoxHeight = 200;
  const leftStatX = width * 0.25 - statBoxWidth / 2;
  const rightStatX = width * 0.75 - statBoxWidth / 2;
  const bottomY = (height - statsHeight) / 2 + 180;
  const showPace = stats.currentPace !== stats.totalWedgies;

  ctx.fillStyle = "rgba(31, 0, 77, 0.75)";
  ctx.beginPath();
  ctx.roundRect(leftStatX, bottomY, statBoxWidth, statBoxHeight, 20);
  ctx.roundRect(rightStatX, bottomY, statBoxWidth, statBoxHeight, 20);
  ctx.fill();

  if (showPace) {
    ctx.font = "900 60px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.textAlign = "center";
    ctx.fillText("PACE", width * 0.25, bottomY + 180);
    ctx.font = "900 120px Inter";
    ctx.fillStyle = "#EAFF00";
    ctx.fillText(currentPaceValue.toString(), width * 0.25, bottomY + 120);
  } else {
    ctx.fillStyle = "#EAFF00";
    ctx.textAlign = "center";
    const size = fitNumberFont(
      ctx,
      stats.gamesPlayed.toString(),
      120,
      statBoxWidth - 32,
    );
    const yShift = (120 - size) * 0.35;
    ctx.fillText(
      currentGamesValue.toString(),
      width * 0.25,
      bottomY + 116 - yShift,
    );
    ctx.font = "700 28px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("GAMES", width * 0.25, bottomY + 152);
    ctx.fillText("PLAYED", width * 0.25, bottomY + 182);
  }

  const { daysWithoutWedgie, hasNewWedgie } = getWedgieDays(stats.lastWedgie);

  if (hasNewWedgie) {
    ctx.font = "900 64px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("NEW", width * 0.75, bottomY + 110);
    ctx.font = "900 50px Inter";
    ctx.fillStyle = "#EAFF00";
    ctx.fillText("WEDGIE", width * 0.75, bottomY + 150);
  } else {
    ctx.font = "900 120px Inter";
    ctx.fillStyle = "#EAFF00";
    ctx.fillText(daysWithoutWedgie.toString(), width * 0.75, bottomY + 116);
    ctx.font = "700 28px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("DAYS WITHOUT", width * 0.75, bottomY + 152);
    ctx.fillText("WEDGIES", width * 0.75, bottomY + 182);
  }

  drawLogoAndUrlBadge(ctx, frame.logoImage, width, height, 150, 159);
}

export function drawVerticalFrame(
  frame: FrameContext,
  progress: number,
  stats: ShareableStats,
) {
  const {
    width,
    height,
    currentTotalWedgies,
    currentPaceValue,
    currentGamesValue,
  } = setupFrame(frame, progress, stats);
  const { ctx } = frame;

  const statsWidth = width * 0.65;
  const statsHeight = height * 0.3;
  const statsX = (width - statsWidth) / 2;
  const statsY = (height - statsHeight) / 2 - 150;

  ctx.fillStyle = "rgba(31, 0, 77, 0.75)";
  ctx.beginPath();
  ctx.roundRect(statsX, statsY, statsWidth, statsHeight, 20);
  ctx.fill();

  ctx.font = "700 32px Inter";
  ctx.fillStyle = "#EAFF00";
  ctx.textAlign = "center";
  ctx.fillText(
    pickStatusText(stats.totalWedgies, stats.previousRecord),
    width / 2,
    statsY + 85,
  );

  ctx.font = "900 380px Inter";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(23, 0, 43, 0.8)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#EAFF00";
  ctx.fillText(
    currentTotalWedgies.toString(),
    width / 2,
    statsY + statsHeight / 2 + 125,
  );
  ctx.shadowBlur = 0;

  ctx.font = "900 75px Inter";
  ctx.fillText("WEDGIES", width / 2, statsY + statsHeight - 55);

  const statBoxWidth = width * 0.3;
  const statBoxHeight = 250;
  const leftStatX = width * 0.68 - statBoxWidth / 2;
  const rightStatX = width * 0.32 - statBoxWidth / 2;
  const bottomY = (height - statsHeight) / 2 + 550;
  const showPace = stats.currentPace !== stats.totalWedgies;

  ctx.fillStyle = "rgba(31, 0, 77, 0.75)";
  ctx.beginPath();
  ctx.roundRect(rightStatX, bottomY, statBoxWidth, statBoxHeight, 20);
  ctx.roundRect(leftStatX, bottomY, statBoxWidth, statBoxHeight, 20);
  ctx.fill();

  if (showPace) {
    ctx.font = "900 90px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.textAlign = "center";
    ctx.fillText("PACE", width * 0.32, bottomY + 215);
    ctx.font = "900 165px Inter";
    ctx.fillStyle = "#EAFF00";
    ctx.fillText(currentPaceValue.toString(), width * 0.32, bottomY + 155);
  } else {
    ctx.fillStyle = "#EAFF00";
    ctx.textAlign = "center";
    const size = fitNumberFont(
      ctx,
      stats.gamesPlayed.toString(),
      140,
      statBoxWidth - 40,
    );
    const yShift = (140 - size) * 0.35;
    ctx.fillText(
      currentGamesValue.toString(),
      width * 0.32,
      bottomY + 140 - yShift,
    );
    ctx.font = "700 36px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("GAMES", width * 0.32, bottomY + 185);
    ctx.fillText("PLAYED", width * 0.32, bottomY + 225);
  }

  const { daysWithoutWedgie, hasNewWedgie } = getWedgieDays(stats.lastWedgie);

  if (hasNewWedgie) {
    ctx.font = "900 94px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("NEW", width * 0.68, bottomY + 135);
    ctx.font = "900 60px Inter";
    ctx.fillStyle = "#EAFF00";
    ctx.fillText("WEDGIE", width * 0.68, bottomY + 195);
  } else {
    ctx.font = "900 140px Inter";
    ctx.fillStyle = "#EAFF00";
    ctx.fillText(daysWithoutWedgie.toString(), width * 0.68, bottomY + 140);
    ctx.font = "700 36px Inter";
    ctx.fillStyle = "#FF00FF";
    ctx.fillText("DAYS WITHOUT", width * 0.685, bottomY + 185);
    ctx.fillText("WEDGIES", width * 0.685, bottomY + 225);
  }

  drawLogoAndUrlBadge(ctx, frame.logoImage, width, height, 210, 259);
}
