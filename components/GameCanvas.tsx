
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PUCK_RADIUS, PADDLE_RADIUS, 
  GOAL_SIZE, FRICTION, WALL_BOUNCE, MAX_SPEED, AI_SPEED_FACTOR,
  COLOR_AI, COLOR_PLAYER, COLOR_TABLE_DARK, COLOR_TABLE_LINES
} from '../constants';
import { GameState, Vector } from '../types';

interface Props {
  gameState: GameState;
  onScoreUpdate: (playerScore: number, aiScore: number) => void;
  onGameEnd: (winner: 'PLAYER' | 'AI') => void;
}

export const GameCanvas: React.FC<Props> = ({ gameState, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  
  // Mutable game state for physics loop
  const physicsState = useRef({
    puck: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 0, vy: 0 },
    player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, prevX: CANVAS_WIDTH / 2, prevY: CANVAS_HEIGHT - 100, targetX: CANVAS_WIDTH / 2, targetY: CANVAS_HEIGHT - 100 },
    ai: { x: CANVAS_WIDTH / 2, y: 100, prevX: CANVAS_WIDTH / 2, prevY: 100 },
    isScoring: false
  });

  // Calculate scale based on actual DOM size vs logical size
  const getCanvasScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 1, y: 1 };
    return {
      x: CANVAS_WIDTH / canvas.clientWidth,
      y: CANVAS_HEIGHT / canvas.clientHeight
    };
  };

  const resetPuck = (scorer: 'PLAYER' | 'AI') => {
    physicsState.current.puck = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: scorer === 'PLAYER' ? -6 : 6 // Serve to loser
    };
    physicsState.current.isScoring = false;
  };

  // --- Physics Engine ---
  const updatePhysics = useCallback(() => {
    if (gameState.status !== 'PLAYING') return;

    const state = physicsState.current;
    const { puck, player, ai } = state;

    // --- 1. Update Paddle Positions ---
    
    // Store previous positions
    player.prevX = player.x;
    player.prevY = player.y;
    ai.prevX = ai.x;
    ai.prevY = ai.y;

    // Player Movement (Lerp for smooth input)
    player.x += (player.targetX - player.x) * 0.8; 
    player.y += (player.targetY - player.y) * 0.8;

    // Clamp Player - Restrict to bottom half
    player.y = Math.max(CANVAS_HEIGHT / 2 + PADDLE_RADIUS, Math.min(CANVAS_HEIGHT - PADDLE_RADIUS, player.y));
    player.x = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, player.x));

    // AI Logic (Simple defense/attack)
    let aiTargetX = puck.x;
    let aiTargetY = 100;

    if (puck.y < CANVAS_HEIGHT / 2) {
      // Attack mode if puck is in AI half
      aiTargetX = puck.x;
      aiTargetY = puck.y;
      // Don't go too low (stay in own half)
      if (aiTargetY > CANVAS_HEIGHT / 2 - PADDLE_RADIUS - 10) {
        aiTargetY = CANVAS_HEIGHT / 2 - PADDLE_RADIUS - 10;
      }
    } else {
        // Defense mode
        aiTargetX = puck.x; 
        aiTargetY = 80;
    }

    // Move AI
    ai.x += (aiTargetX - ai.x) * AI_SPEED_FACTOR;
    ai.y += (aiTargetY - ai.y) * AI_SPEED_FACTOR;
    
    // Clamp AI - Restrict to top half
    ai.y = Math.max(PADDLE_RADIUS, Math.min(CANVAS_HEIGHT / 2 - PADDLE_RADIUS, ai.y));
    ai.x = Math.max(PADDLE_RADIUS, Math.min(CANVAS_WIDTH - PADDLE_RADIUS, ai.x));

    // Calculate Paddle Velocities
    const playerVx = player.x - player.prevX;
    const playerVy = player.y - player.prevY;
    const aiVx = ai.x - ai.prevX;
    const aiVy = ai.y - ai.prevY;

    // --- 2. Puck Physics ---
    
    puck.x += puck.vx;
    puck.y += puck.vy;
    puck.vx *= FRICTION;
    puck.vy *= FRICTION;

    // Speed Cap
    const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
    if (speed > MAX_SPEED) {
      puck.vx = (puck.vx / speed) * MAX_SPEED;
      puck.vy = (puck.vy / speed) * MAX_SPEED;
    }

    // --- 3. Collisions ---

    // Wall Collisions
    if (puck.x - PUCK_RADIUS < 0) {
      puck.x = PUCK_RADIUS;
      puck.vx = Math.abs(puck.vx) * WALL_BOUNCE;
    } else if (puck.x + PUCK_RADIUS > CANVAS_WIDTH) {
      puck.x = CANVAS_WIDTH - PUCK_RADIUS;
      puck.vx = -Math.abs(puck.vx) * WALL_BOUNCE;
    }

    // Goal Logic
    const goalLeft = (CANVAS_WIDTH - GOAL_SIZE) / 2;
    const goalRight = (CANVAS_WIDTH + GOAL_SIZE) / 2;

    // Top Wall (AI Goal - Player Scores)
    if (puck.y - PUCK_RADIUS < 0) {
      if (puck.x > goalLeft && puck.x < goalRight) {
        if (!state.isScoring) {
          state.isScoring = true;
          onScoreUpdate(gameState.scores.player + 1, gameState.scores.ai);
          setTimeout(() => resetPuck('PLAYER'), 1000);
        }
      } else {
        puck.y = PUCK_RADIUS;
        puck.vy = Math.abs(puck.vy) * WALL_BOUNCE;
      }
    }
    // Bottom Wall (Player Goal - AI Scores)
    else if (puck.y + PUCK_RADIUS > CANVAS_HEIGHT) {
      if (puck.x > goalLeft && puck.x < goalRight) {
        if (!state.isScoring) {
            state.isScoring = true;
            onScoreUpdate(gameState.scores.player, gameState.scores.ai + 1);
            setTimeout(() => resetPuck('AI'), 1000);
        }
      } else {
        puck.y = CANVAS_HEIGHT - PUCK_RADIUS;
        puck.vy = -Math.abs(puck.vy) * WALL_BOUNCE;
      }
    }

    // --- Strict Paddle Collisions (Fixes Spinning) ---
    const resolveCollision = (paddle: Vector, pVx: number, pVy: number) => {
      const dx = puck.x - paddle.x;
      const dy = puck.y - paddle.y;
      const distSq = dx * dx + dy * dy;
      const minDist = PUCK_RADIUS + PADDLE_RADIUS;
      
      // Check collision
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        // Normalized vector from paddle to puck
        // Handle case where dist is 0 (should rarely happen)
        const nx = dist > 0 ? dx / dist : 1; 
        const ny = dist > 0 ? dy / dist : 0; 
        
        // 1. POSITION CORRECTION (Crucial: Stop sticking)
        // Push puck physically out of the paddle immediately
        const overlap = minDist - dist;
        puck.x += nx * overlap;
        puck.y += ny * overlap;

        // 2. VELOCITY REFLECTION
        // Calculate relative velocity
        const relVx = puck.vx - pVx;
        const relVy = puck.vy - pVy;
        
        // Velocity along normal
        const velAlongNormal = relVx * nx + relVy * ny;

        // Only bounce if moving towards each other (or overlap was fixed)
        if (velAlongNormal < 0) {
          const restitution = 1.3; // High bounciness
          let impulse = -(1 + restitution) * velAlongNormal;
          
          // Clamp impulse to prevent "explosions"
          impulse = Math.min(impulse, MAX_SPEED * 1.5);

          puck.vx += impulse * nx;
          puck.vy += impulse * ny;

          // Add a bit of the paddle's raw velocity
          const smashFactor = 0.3;
          puck.vx += Math.max(-10, Math.min(10, pVx * smashFactor));
          puck.vy += Math.max(-10, Math.min(10, pVy * smashFactor));
        }
      }
    };

    resolveCollision(player, playerVx, playerVy);
    resolveCollision(ai, aiVx, aiVy);

  }, [gameState.status, gameState.scores, onScoreUpdate]);

  // --- Render Loop ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Board
    ctx.fillStyle = COLOR_TABLE_DARK;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // -- Draw Court Details --
    ctx.strokeStyle = COLOR_TABLE_LINES;
    ctx.lineWidth = 4;
    
    // Center Line
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center Dot
    ctx.fillStyle = COLOR_TABLE_LINES;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // -- Goal Areas (Distinct Entrances) --
    const goalW = GOAL_SIZE;
    const goalX = (CANVAS_WIDTH - goalW) / 2;

    const drawGoalZone = (y: number, color: string, isTop: boolean) => {
      // 1. Goal Background Zone (Semi-circle)
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      if (isTop) {
        // AI Goal Zone
        ctx.arc(CANVAS_WIDTH/2, 0, goalW/2 + 20, 0, Math.PI, false);
      } else {
        // Player Goal Zone
        ctx.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT, goalW/2 + 20, Math.PI, 0, false);
      }
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // 2. Goal Line (Thick)
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(goalX, y);
      ctx.lineTo(goalX + goalW, y);
      ctx.stroke();
      ctx.lineCap = 'butt'; // reset

      // 3. Goal Arrows (Visual Guide)
      ctx.fillStyle = color;
      // Draw chevrons indicating goal
      const arrowDir = isTop ? -1 : 1; 
      const arrowBaseY = isTop ? 50 : CANVAS_HEIGHT - 50;
      
      for (let offset of [-40, 0, 40]) {
        const cx = CANVAS_WIDTH / 2 + offset;
        const cy = arrowBaseY;
        
        ctx.beginPath();
        // Triangle pointing into goal
        if (isTop) {
           ctx.moveTo(cx, cy - 15);
           ctx.lineTo(cx + 10, cy);
           ctx.lineTo(cx - 10, cy);
        } else {
           ctx.moveTo(cx, cy + 15);
           ctx.lineTo(cx + 10, cy);
           ctx.lineTo(cx - 10, cy);
        }
        ctx.closePath();
        ctx.fill();
      }
    };

    // AI Goal Area (Top) - Blue
    drawGoalZone(0, COLOR_AI, true);
    
    // Player Goal Area (Bottom) - Red
    drawGoalZone(CANVAS_HEIGHT, COLOR_PLAYER, false);

    // -- Entities --
    const { ai, player, puck } = physicsState.current;
    
    // AI Paddle (Blue)
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLOR_AI;
    ctx.fillStyle = COLOR_AI;
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, PADDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner AI Detail
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, PADDLE_RADIUS * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Player Paddle (Red)
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLOR_PLAYER;
    ctx.fillStyle = COLOR_PLAYER;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PADDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner Player Detail
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PADDLE_RADIUS * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Puck
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

  }, []);

  const loop = useCallback((time: number) => {
    updatePhysics(); 
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [draw, updatePhysics]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  // --- Input Handling ---
  const handleInput = useCallback((clientX: number, clientY: number) => {
    if (gameState.status !== 'PLAYING' && gameState.status !== 'COUNTDOWN') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = getCanvasScale();

    // Target calculation
    let tx = (clientX - rect.left) * scale.x;
    let ty = (clientY - rect.top) * scale.y;

    // Apply strictly bounded logic for input
    // Ensure player paddle stays in bottom half and inside walls
    const minY = CANVAS_HEIGHT / 2 + PADDLE_RADIUS;
    const maxY = CANVAS_HEIGHT - PADDLE_RADIUS;
    const minX = PADDLE_RADIUS;
    const maxX = CANVAS_WIDTH - PADDLE_RADIUS;

    ty = Math.max(minY, Math.min(maxY, ty));
    tx = Math.max(minX, Math.min(maxX, tx));

    physicsState.current.player.targetX = tx;
    physicsState.current.player.targetY = ty;
  }, [gameState.status]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
  }, [handleInput]);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (gameState.status === 'PLAYING' || gameState.status === 'COUNTDOWN') {
       handleInput(e.clientX, e.clientY);
    }
  }, [handleInput, gameState.status]);

  // Reset positions on game start
  useEffect(() => {
    if (gameState.status === 'COUNTDOWN') {
        physicsState.current.player.x = CANVAS_WIDTH / 2;
        physicsState.current.player.y = CANVAS_HEIGHT - 100;
        physicsState.current.player.targetX = CANVAS_WIDTH / 2;
        physicsState.current.player.targetY = CANVAS_HEIGHT - 100;
        physicsState.current.ai.x = CANVAS_WIDTH / 2;
        physicsState.current.ai.y = 100;
        physicsState.current.puck.x = CANVAS_WIDTH / 2;
        physicsState.current.puck.y = CANVAS_HEIGHT / 2;
        physicsState.current.puck.vx = 0;
        physicsState.current.puck.vy = 0;
    }
  }, [gameState.status]);

  return (
    // RWD Container: Maintains aspect ratio but fits within parent container
    <div 
      ref={containerRef}
      className="relative w-full h-full max-h-[85vh] aspect-[4/7] mx-auto rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-slate-700 bg-slate-950"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full block cursor-none touch-none"
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onMouseMove={handleMouse}
        onMouseDown={handleMouse}
      />
      
      {/* Decorative Text */}
      <div className="absolute top-[35%] left-0 right-0 text-center pointer-events-none opacity-20 font-black text-4xl tracking-widest text-[#00f0ff] rotate-180">
        CPU
      </div>
      <div className="absolute bottom-[35%] left-0 right-0 text-center pointer-events-none opacity-20 font-black text-4xl tracking-widest text-[#ff003c]">
        YOU
      </div>
    </div>
  );
};
