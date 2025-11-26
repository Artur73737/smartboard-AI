// MathOverlay Component - Renders math expressions using KaTeX
import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { BoardElement, ElementState, ElementType } from '../types';

interface MathOverlayProps {
        elements: BoardElement[];
        zoom: number;
        viewOffset: { x: number; y: number };
}

const MathOverlay: React.FC<MathOverlayProps> = ({ elements, zoom, viewOffset }) => {
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
                if (!containerRef.current) return;

                // Clear previous renders
                containerRef.current.innerHTML = '';

                elements.forEach((el) => {
                        // Render main content if LaTeX is available (including GRAPH types)
                        if (el.latex) {
                                const contentWidth = renderMath(el.latex, el.x, el.y, '#ffffff', containerRef.current!);

                                // Render solution if resolved and LaTeX is available
                                if (el.state === ElementState.RESOLVED && el.solutionLatex) {
                                        let offsetX = el.x + contentWidth + 15;

                                        // Add "= " for math expressions (not equations or systems)
                                        const isEquation = el.content.includes('=');
                                        const isSystem = el.solutionLatex.includes(','); // System solutions have comma

                                        if (!isEquation && !isSystem && el.type !== ElementType.GRAPH) {
                                                // Render "= " as text
                                                const equalsSpan = document.createElement('span');
                                                equalsSpan.style.position = 'absolute';
                                                equalsSpan.style.left = `${offsetX * zoom + viewOffset.x}px`;
                                                equalsSpan.style.top = `${el.y * zoom + viewOffset.y}px`;
                                                equalsSpan.style.fontSize = `${32 * zoom}px`;
                                                equalsSpan.style.color = '#0A84FF';
                                                equalsSpan.style.fontFamily = "'Architects Daughter', cursive";
                                                equalsSpan.style.pointerEvents = 'none';
                                                equalsSpan.textContent = '= ';
                                                containerRef.current!.appendChild(equalsSpan);

                                                offsetX += 30; // Space for "= "
                                        }

                                        renderMath(el.solutionLatex, offsetX, el.y, '#0A84FF', containerRef.current!);
                                }
                        } else if (el.state === ElementState.RESOLVED && el.solutionLatex) {
                                // If no content LaTeX but has solution LaTeX
                                const contentWidth = el.content.length * 19;
                                let offsetX = el.x + contentWidth + 15;

                                const isEquation = el.content.includes('=');
                                const isSystem = el.solutionLatex.includes(',');

                                if (!isEquation && !isSystem && el.type !== ElementType.GRAPH) {
                                        // Render "= " as text
                                        const equalsSpan = document.createElement('span');
                                        equalsSpan.style.position = 'absolute';
                                        equalsSpan.style.left = `${offsetX * zoom + viewOffset.x}px`;
                                        equalsSpan.style.top = `${el.y * zoom + viewOffset.y}px`;
                                        equalsSpan.style.fontSize = `${32 * zoom}px`;
                                        equalsSpan.style.color = '#0A84FF';
                                        equalsSpan.style.fontFamily = "'Architects Daughter', cursive";
                                        equalsSpan.style.pointerEvents = 'none';
                                        equalsSpan.textContent = '= ';
                                        containerRef.current!.appendChild(equalsSpan);

                                        offsetX += 30;
                                }

                                renderMath(el.solutionLatex, offsetX, el.y, '#0A84FF', containerRef.current!);
                        }
                });
        }, [elements, zoom, viewOffset]);

        const renderMath = (
                latex: string,
                worldX: number,
                worldY: number,
                color: string,
                container: HTMLElement
        ): number => {
                try {
                        const mathElement = document.createElement('span');
                        mathElement.className = 'math-element';
                        mathElement.style.position = 'absolute';
                        mathElement.style.pointerEvents = 'none';
                        mathElement.style.userSelect = 'none';
                        mathElement.style.color = color;
                        mathElement.style.fontFamily = "'Architects Daughter', cursive";
                        mathElement.style.whiteSpace = 'nowrap';

                        // Calculate screen position
                        const screenX = worldX * zoom + viewOffset.x;
                        const screenY = worldY * zoom + viewOffset.y;

                        mathElement.style.left = `${screenX}px`;
                        mathElement.style.top = `${screenY}px`;
                        mathElement.style.fontSize = `${32 * zoom}px`;
                        mathElement.style.transformOrigin = 'left top';

                        // Render LaTeX using KaTeX
                        katex.render(latex, mathElement, {
                                throwOnError: false,
                                displayMode: latex.includes('\\begin{cases}'),
                                output: 'html',
                                trust: false,
                        });

                        container.appendChild(mathElement);

                        // Return actual width for positioning
                        return mathElement.getBoundingClientRect().width / zoom;
                } catch (error) {
                        console.error('KaTeX rendering error:', error, latex);
                        return estimateWidth(latex);
                }
        };

        // Estimate width for positioning (fallback)
        const estimateWidth = (latex: string): number => {
                // More accurate estimation based on LaTeX content
                if (latex.includes('\\frac')) return latex.length * 25;
                if (latex.includes('\\begin{cases}')) return latex.length * 15;
                return latex.length * 20;
        };

        return (
                <div
                        ref={containerRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 2 }}
                />
        );
};

export default MathOverlay;
