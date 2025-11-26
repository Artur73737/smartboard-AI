
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { ToolType, Stroke, BoardElement, ElementType, ElementState } from '../types';
import MathOverlay from './MathOverlay';

interface WhiteboardProps {
    tool: ToolType;
    color: string;
    strokes: Stroke[];
    setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
    elements: BoardElement[];
    setElements: React.Dispatch<React.SetStateAction<BoardElement[]>>;
    onSaveHistory: () => void;
    onAnalyzeGroup: (strokes: Stroke[], bounds: { x: number, y: number, width: number, height: number }) => void;
}

export interface WhiteboardRef {
    getSnapshot: (specificStrokes?: Stroke[]) => string | null;
    getBounds: (specificStrokes?: Stroke[]) => { x: number, y: number, width: number, height: number } | null;
}

// Button Config - Minimal
const BTN_SIZE = 24;
const BTN_GAP = 12;
const TEXT_HEIGHT = 40;

const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(({ tool, color, strokes, setStrokes, elements, setElements, onSaveHistory, onAnalyzeGroup }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);

    // Animation State Refs
    const animationStatesRef = useRef<{ [id: string]: number }>({}); // Stores startTime for each element
    const rafIdRef = useRef<number | null>(null);

    // Viewport State (Infinite Canvas)
    const [zoom, setZoom] = useState(1);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

    // Refs for Event Listeners
    const zoomRef = useRef(zoom);
    const viewOffsetRef = useRef(viewOffset);

    // Sync refs with state
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { viewOffsetRef.current = viewOffset; }, [viewOffset]);

    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [dragInfo, setDragInfo] = useState<{ id: string, startX: number, startY: number, initialElX: number, initialElY: number } | null>(null);
    const [hoverCursor, setHoverCursor] = useState<string>('default');
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // --- Helpers: Coordinate Systems ---

    const toWorld = (sx: number, sy: number) => ({
        x: (sx - viewOffset.x) / zoom,
        y: (sy - viewOffset.y) / zoom
    });

    const calculateStrokeBounds = (targetStrokes: Stroke[] = strokes) => {
        if (targetStrokes.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        targetStrokes.forEach(stroke => {
            stroke.points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
        });

        if (minX === Infinity) return null;
        return { x: minX - 20, y: minY - 20, width: (maxX - minX) + 40, height: (maxY - minY) + 40 };
    };

    useImperativeHandle(ref, () => ({
        getSnapshot: (specificStrokes?: Stroke[]) => {
            const targetStrokes = specificStrokes || strokes;
            const bounds = calculateStrokeBounds(targetStrokes);
            if (!bounds) return null;

            const tempCanvas = document.createElement('canvas');
            const padding = 40;
            tempCanvas.width = bounds.width + padding * 2;
            tempCanvas.height = bounds.height + padding * 2;

            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                ctx.translate(-bounds.x + padding, -bounds.y + padding);
                // Pass true to force black eraser for snapshot
                targetStrokes.forEach(stroke => drawStroke(ctx, stroke, true));
                return tempCanvas.toDataURL('image/png');
            }
            return null;
        },
        getBounds: calculateStrokeBounds
    }));

    // --- Native Wheel Handler ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const currentZoom = zoomRef.current;
            const currentOffset = viewOffsetRef.current;

            if (e.ctrlKey) {
                const intensity = 0.1;
                const delta = -Math.sign(e.deltaY);
                const newZoom = Math.min(Math.max(currentZoom + delta * intensity, 0.1), 5);
                const mouseWorldX = (e.clientX - currentOffset.x) / currentZoom;
                const mouseWorldY = (e.clientY - currentOffset.y) / currentZoom;
                const newOffsetX = e.clientX - mouseWorldX * newZoom;
                const newOffsetY = e.clientY - mouseWorldY * newZoom;

                setZoom(newZoom);
                setViewOffset({ x: newOffsetX, y: newOffsetY });
            } else {
                setViewOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            canvas.removeEventListener('wheel', onWheel);
        };
    }, []);

    // --- Rendering Logic ---

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && gridCanvasRef.current) {
                const w = window.innerWidth;
                const h = window.innerHeight;
                canvasRef.current.width = w;
                canvasRef.current.height = h;
                gridCanvasRef.current.width = w;
                gridCanvasRef.current.height = h;
                // Immediate redraw on resize
                renderCanvas();
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Main Effect trigger
    useEffect(() => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        renderCanvas();
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [strokes, elements, currentStroke, zoom, viewOffset]);


    const renderCanvas = () => {
        const canvas = canvasRef.current;
        const gridCanvas = gridCanvasRef.current;
        if (!canvas || !gridCanvas) return;

        const ctx = canvas.getContext('2d');
        const gridCtx = gridCanvas.getContext('2d');
        if (!ctx || !gridCtx) return;

        // --- 1. Render Grid Layer (Background) ---
        gridCtx.setTransform(1, 0, 0, 1, 0, 0);
        gridCtx.fillStyle = '#000000'; // Black background
        gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

        // Apply Transform for Grid
        gridCtx.setTransform(zoom, 0, 0, zoom, viewOffset.x, viewOffset.y);
        drawGrid(gridCtx, gridCanvas.width, gridCanvas.height);


        // --- 2. Render Main Layer (Content) ---
        // Clear transparently
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply Transform for Content
        ctx.setTransform(zoom, 0, 0, zoom, viewOffset.x, viewOffset.y);

        // Elements & Animation Logic
        let isAnimating = false;
        const now = Date.now();
        const ANIMATION_DURATION = 800; // ms

        elements.forEach(el => {
            let progress = 1;

            // Handle Graph Animation
            if (el.type === ElementType.GRAPH && el.state === ElementState.RESOLVED) {
                if (!animationStatesRef.current[el.id]) {
                    animationStatesRef.current[el.id] = now;
                }
                const elapsed = now - animationStatesRef.current[el.id];
                progress = Math.min(elapsed / ANIMATION_DURATION, 1);

                // Ease out cubic
                progress = 1 - Math.pow(1 - progress, 3);

                if (progress < 1) isAnimating = true;
            }

            drawElement(ctx, el, progress);
        });

        // Strokes
        strokes.forEach(stroke => drawStroke(ctx, stroke));
        if (currentStroke) drawStroke(ctx, currentStroke);

        // Loop if needed
        if (isAnimating) {
            rafIdRef.current = requestAnimationFrame(renderCanvas);
        }
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, screenW: number, screenH: number) => {
        ctx.fillStyle = '#1c1c1e'; // Gray dots
        const gap = 40;
        const dotSize = 1.5;
        const tl = toWorld(0, 0);
        const br = toWorld(screenW, screenH);
        const startX = Math.floor(tl.x / gap) * gap;
        const startY = Math.floor(tl.y / gap) * gap;

        for (let x = startX; x < br.x; x += gap) {
            for (let y = startY; y < br.y; y += gap) {
                ctx.beginPath();
                ctx.arc(x, y, dotSize / Math.sqrt(zoom), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const drawLucideCheck = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
        ctx.beginPath();
        const s = size * 0.6;
        const x = cx - s / 2;
        const y = cy - s / 2;
        ctx.moveTo(x + s * 0.9, y + s * 0.1);
        ctx.lineTo(x + s * 0.35, y + s * 0.9);
        ctx.lineTo(x, y + s * 0.55);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const drawLucideX = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
        ctx.beginPath();
        const s = size * 0.5;
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy + s);
        ctx.moveTo(cx + s, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const drawCurvedArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, opacity: number) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.strokeStyle = '#0A84FF';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.moveTo(fromX, fromY);
        const cpX = (fromX + toX) / 2 + 10;
        const cpY = (fromY + toY) / 2 - 40;
        ctx.quadraticCurveTo(cpX, cpY, toX, toY);
        ctx.stroke();

        const angle = Math.atan2(toY - cpY, toX - cpX);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        ctx.restore();
    };

    const drawElement = (ctx: CanvasRenderingContext2D, el: BoardElement, animationProgress: number) => {
        ctx.save();
        ctx.font = "32px 'Architects Daughter'";
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';

        const metrics = ctx.measureText(el.content);
        const textWidth = metrics.width;

        // Only render text if NO LaTeX is available (LaTeX is rendered by MathOverlay)
        if (!el.latex) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
            ctx.shadowBlur = 10;
            ctx.fillText(el.content, el.x, el.y);
            ctx.shadowBlur = 0;
        }

        if (el.state === ElementState.PENDING_DECISION) {
            // Calculate button position based on content type
            let contentHeight = TEXT_HEIGHT;

            // For LaTeX content, estimate height based on type
            if (el.latex) {
                if (el.latex.includes('\\begin{cases}')) {
                    // Systems are taller - count lines for accurate spacing
                    const lines = (el.latex.match(/\\\\/g) || []).length + 1;
                    contentHeight = lines * 65 + 30; // Even more spacing per line + extra padding
                } else if (el.latex.includes('\\frac')) {
                    // Fractions are taller
                    contentHeight = 60;
                } else {
                    contentHeight = 45;
                }
            }

            const btnY = el.y + contentHeight + 15;
            const btn1X = el.x + 15;
            const btn2X = btn1X + BTN_SIZE + BTN_GAP;
            drawLucideCheck(ctx, btn1X, btnY + BTN_SIZE / 2, BTN_SIZE, '#0A84FF');
            drawLucideX(ctx, btn2X, btnY + BTN_SIZE / 2, BTN_SIZE, '#636366');

        } else if (el.state === ElementState.RESOLVED) {
            if (el.type === ElementType.GRAPH && el.graphData) {
                const graphY = el.y + TEXT_HEIGHT + 3;
                const graphW = 400;
                const graphH = 280;

                // Draw Graph with animation progress
                drawGraphOnCanvas(ctx, el.graphData, el.x, graphY, graphW, graphH, animationProgress);

                // Draw Arrow (fade in)
                const startX = el.x + textWidth + 10;
                const startY = el.y + 15;
                const endX = el.x + graphW / 2;
                const endY = graphY;
                drawCurvedArrow(ctx, startX, startY, endX, endY, animationProgress);

            } else if (el.solution && !el.solutionLatex) {
                // Only render solution as text if NO LaTeX solution is available
                ctx.fillStyle = '#0A84FF';
                ctx.font = "32px 'Architects Daughter'";
                let prefix = "";
                const content = el.content.trim();
                const solution = el.solution.trim();
                if (content.includes("=") && !content.endsWith("=")) {
                    prefix = ", ";
                } else if (!content.endsWith("=")) {
                    prefix = " = ";
                }
                ctx.fillText(prefix + solution, el.x + textWidth, el.y);
            }
        }
        ctx.restore();
    };

    const drawGraphOnCanvas = (ctx: CanvasRenderingContext2D, data: { x: number, y: number }[], x: number, y: number, w: number, h: number, progress: number) => {
        ctx.save();

        // Background and Border (Always visible)
        ctx.fillStyle = '#101012';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 16);
        ctx.fill();
        ctx.lineWidth = 1 / zoom;
        ctx.strokeStyle = '#2c2c2e';
        ctx.stroke();

        const pad = 40;
        const plotX = x + pad;
        const plotY = y + 20;
        const plotW = w - pad * 1.5;
        const plotH = h - pad * 1.5;

        if (data.length === 0) { ctx.restore(); return; }

        let minX = Math.min(...data.map(d => d.x));
        let maxX = Math.max(...data.map(d => d.x));
        let minY = Math.min(...data.map(d => d.y));
        let maxY = Math.max(...data.map(d => d.y));

        const rangeX = Math.abs(maxX - minX) || 10;
        const rangeY = Math.abs(maxY - minY) || 10;
        minX -= rangeX * 0.1;
        maxX += rangeX * 0.1;
        minY -= rangeY * 0.1;
        maxY += rangeY * 0.1;

        const mapX = (val: number) => plotX + ((val - minX) / (maxX - minX)) * plotW;
        const mapY = (val: number) => plotY + plotH - ((val - minY) / (maxY - minY)) * plotH;

        // Draw Grid & Axes (Always visible)
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#2C2C2E';
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#8E8E93';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const stepX = rangeX / 5;
        for (let i = 0; i <= 5; i++) {
            const val = minX + stepX * i;
            const px = mapX(val);
            ctx.beginPath(); ctx.moveTo(px, plotY); ctx.lineTo(px, plotY + plotH); ctx.stroke();
            ctx.fillText(val.toFixed(1), px, plotY + plotH + 15);
        }

        const stepY = rangeY / 5;
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const val = minY + stepY * i;
            const py = mapY(val);
            ctx.beginPath(); ctx.moveTo(plotX, py); ctx.lineTo(plotX + plotW, py); ctx.stroke();
            ctx.fillText(val.toFixed(1), plotX - 10, py);
        }

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#636366';
        const originX = mapX(0);
        const originY = mapY(0);
        if (minX <= 0 && maxX >= 0) { ctx.beginPath(); ctx.moveTo(originX, plotY); ctx.lineTo(originX, plotY + plotH); ctx.stroke(); }
        if (minY <= 0 && maxY >= 0) { ctx.beginPath(); ctx.moveTo(plotX, originY); ctx.lineTo(plotX + plotW, originY); ctx.stroke(); }

        // --- ANIMATED LINE RENDERING ---
        // Apply clipping mask for the "Wipe" effect based on progress
        ctx.save();
        ctx.beginPath();
        // Clip rectangle that grows from left to right
        ctx.rect(x, y, w * progress, h);
        ctx.clip();

        ctx.beginPath();
        ctx.strokeStyle = '#0A84FF';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#0A84FF';
        ctx.shadowBlur = 12;

        const sorted = [...data].sort((a, b) => a.x - b.x);
        if (sorted.length > 0) {
            ctx.moveTo(mapX(sorted[0].x), mapY(sorted[0].y));
            for (let i = 1; i < sorted.length; i++) {
                ctx.lineTo(mapX(sorted[i].x), mapY(sorted[i].y));
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore(); // Remove clip
        ctx.restore(); // Remove local transform
    };

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, forceBlackEraser: boolean = false) => {
        if (stroke.points.length < 1) return;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.width;

        if (stroke.tool === ToolType.ERASER) {
            if (forceBlackEraser) {
                // Used for Snapshot (Vision AI requires black background)
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = '#000000';
            } else {
                // Used for Live Render (Transparent stroke reveals grid)
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        }

        // --- Arrow Rendering ---
        if (stroke.tool === ToolType.ARROW && stroke.points.length > 1) {
            const p1 = stroke.points[0];
            const p2 = stroke.points[stroke.points.length - 1];

            // Draw Line
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Draw Arrowhead
            const headLen = 20;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            ctx.beginPath();
            // Tip
            ctx.moveTo(p2.x, p2.y);
            // Wing 1
            ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
            // Back to tip
            ctx.moveTo(p2.x, p2.y);
            // Wing 2
            ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();

            // Reset composite
            ctx.globalCompositeOperation = 'source-over';
            return;
        }

        // --- Freehand Rendering ---
        if (stroke.points.length < 2) {
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect(stroke.points[0].x, stroke.points[0].y, 1, 1);
            ctx.globalCompositeOperation = 'source-over';
            return;
        }
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            const midPoint = { x: p1.x + (p2.x - p1.x) / 2, y: p1.y + (p2.y - p1.y) / 2 };
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        // Reset composite
        ctx.globalCompositeOperation = 'source-over';
    };

    // --- Interaction Logic ---

    const hitTestElement = (wx: number, wy: number, el: BoardElement): 'BUTTON_OK' | 'BUTTON_CANCEL' | 'BODY' | null => {
        if (el.state === ElementState.PENDING_DECISION) {
            // Calculate button position EXACTLY as in rendering
            let contentHeight = TEXT_HEIGHT;

            // For LaTeX content, estimate height based on type (same as rendering)
            if (el.latex) {
                if (el.latex.includes('\\begin{cases}')) {
                    const lines = (el.latex.match(/\\\\/g) || []).length + 1;
                    contentHeight = lines * 65 + 30;
                } else if (el.latex.includes('\\frac')) {
                    contentHeight = 60;
                } else {
                    contentHeight = 45;
                }
            }

            const btnY = el.y + contentHeight + 15;
            const btn1X = el.x + 15;
            const btn2X = btn1X + BTN_SIZE + BTN_GAP;

            const r = BTN_SIZE / 1.2;
            const cy = btnY + BTN_SIZE / 2;
            if (Math.hypot(wx - btn1X, wy - cy) < r) return 'BUTTON_OK';
            if (Math.hypot(wx - btn2X, wy - cy) < r) return 'BUTTON_CANCEL';
        }

        const textWidth = el.content.length * 15 + (el.solution ? el.solution.length * 15 : 0) + 50;
        const height = (el.type === ElementType.GRAPH && el.state === ElementState.RESOLVED) ? 350 : 60;

        if (wx >= el.x && wx <= el.x + textWidth && wy >= el.y && wy <= el.y + height) {
            return 'BODY';
        }

        return null;
    };

    // Clustering Algorithm
    const findConnectedStrokes = (startStroke: Stroke, allStrokes: Stroke[]): Stroke[] => {
        const group: Set<Stroke> = new Set([startStroke]);
        const queue: Stroke[] = [startStroke];

        const getStrokeBounds = (s: Stroke) => {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            s.points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            return { minX, maxX, minY, maxY };
        };

        const isNear = (s1: Stroke, s2: Stroke) => {
            const b1 = getStrokeBounds(s1);
            const b2 = getStrokeBounds(s2);
            const margin = 100; // 100px proximity threshold
            return !(b2.minX > b1.maxX + margin ||
                b2.maxX < b1.minX - margin ||
                b2.minY > b1.maxY + margin ||
                b2.maxY < b1.minY - margin);
        };

        while (queue.length > 0) {
            const current = queue.shift()!;
            for (const s of allStrokes) {
                if (!group.has(s) && isNear(current, s)) {
                    group.add(s);
                    queue.push(s);
                }
            }
        }
        return Array.from(group);
    };

    const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
        const { clientX, clientY } = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
        const worldPos = toWorld(clientX, clientY);

        // Find stroke hit
        const hitStroke = strokes.find(stroke => {
            // Simple hit test on points
            return stroke.points.some(p => Math.hypot(p.x - worldPos.x, p.y - worldPos.y) < 20);
        });

        if (hitStroke) {
            const connectedGroup = findConnectedStrokes(hitStroke, strokes);
            const bounds = calculateStrokeBounds(connectedGroup);
            if (bounds) {
                onAnalyzeGroup(connectedGroup, bounds);
            }
        }
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const { clientX, clientY } = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
        const worldPos = toWorld(clientX, clientY);
        setLastMousePos({ x: clientX, y: clientY });

        // Check for middle mouse button (wheel click) for panning
        if ('button' in e && e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            return;
        }

        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            const hit = hitTestElement(worldPos.x, worldPos.y, el);

            if (hit === 'BUTTON_OK') {
                onSaveHistory(); // Save before modifying
                setElements(prev => prev.map(item => item.id === el.id ? { ...item, state: ElementState.RESOLVED } : item));
                return;
            }
            if (hit === 'BUTTON_CANCEL') {
                onSaveHistory(); // Save before deleting
                setElements(prev => prev.filter(item => item.id !== el.id));
                return;
            }
            if (hit === 'BODY') {
                onSaveHistory(); // Save before dragging
                setDragInfo({
                    id: el.id,
                    startX: clientX,
                    startY: clientY,
                    initialElX: el.x,
                    initialElY: el.y
                });
                return;
            }
        }

        if (tool === ToolType.POINTER) {
            setIsPanning(true);
            return;
        }

        onSaveHistory(); // Save before drawing
        setIsDrawing(true);
        setCurrentStroke({
            points: [{ x: worldPos.x, y: worldPos.y }],
            color,
            width: tool === ToolType.ERASER ? 25 : 3,
            tool
        });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        const { clientX, clientY } = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
        const worldPos = toWorld(clientX, clientY);

        if (dragInfo) {
            const dx = (clientX - dragInfo.startX) / zoom;
            const dy = (clientY - dragInfo.startY) / zoom;
            setElements(prev => prev.map(el =>
                el.id === dragInfo.id
                    ? { ...el, x: dragInfo.initialElX + dx, y: dragInfo.initialElY + dy }
                    : el
            ));
            return;
        }

        if (isPanning) {
            const dx = clientX - lastMousePos.x;
            const dy = clientY - lastMousePos.y;
            setViewOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: clientX, y: clientY });
            return;
        }
        setLastMousePos({ x: clientX, y: clientY });

        if (isDrawing && currentStroke) {
            if (tool === ToolType.ARROW) {
                // Elastic banding for Arrow: Start point fixed, end point updates
                const newStroke = { ...currentStroke, points: [currentStroke.points[0], { x: worldPos.x, y: worldPos.y }] };
                setCurrentStroke(newStroke);
            } else {
                // Freehand
                const newStroke = { ...currentStroke, points: [...currentStroke.points, { x: worldPos.x, y: worldPos.y }] };
                setCurrentStroke(newStroke);
            }
            return;
        }

        let cursor = tool === ToolType.POINTER ? 'default' : 'crosshair';
        if (!isDrawing && !isPanning) {
            for (let i = elements.length - 1; i >= 0; i--) {
                const hit = hitTestElement(worldPos.x, worldPos.y, elements[i]);
                if (hit === 'BODY') {
                    cursor = 'move';
                    break;
                }
                if (hit) {
                    cursor = 'pointer';
                    break;
                }
            }
        }
        setHoverCursor(cursor);
    };

    const handlePointerUp = () => {
        if (dragInfo) {
            setDragInfo(null);
            return;
        }
        if (isPanning) {
            setIsPanning(false);
            return;
        }
        if (isDrawing && currentStroke) {
            setStrokes(prev => [...prev, currentStroke]);
            setIsDrawing(false);
            setCurrentStroke(null);
        }
    };

    return (
        <>
            <canvas
                ref={gridCanvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full touch-none"
                style={{ cursor: hoverCursor }}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
            />

            {/* Math Overlay for LaTeX rendering */}
            <MathOverlay elements={elements} zoom={zoom} viewOffset={viewOffset} />

            {/* Zoom Indicator */}
            <div className="absolute bottom-6 right-6 pointer-events-none select-none z-10 animate-in fade-in duration-300">
                <div className="bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl text-[10px] font-medium tracking-wider text-gray-400 flex items-center gap-2">
                    <span>ZOOM</span>
                    <span className="text-white">{Math.round(zoom * 100)}%</span>
                </div>
            </div>
        </>
    );
});

export default Whiteboard;
