import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Stage,
  Layer as KonvaLayer,
  Rect,
  Circle,
  Text as KonvaText,
  Image as KonvaImage,
  Group,
  Line,
  RegularPolygon,
  Transformer,
} from 'react-konva';
import Konva from 'konva';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  Shield,
  Sliders,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { mmToPx, pxToMm, calculateCanvasPxSize } from '../utils/units';
import { generateBarcodeDataUrl, generateQRCodeDataUrl } from '../utils/barcodes';
import { Layer, SmartGuide } from '../types';
import { TopRuler, LeftRuler } from './Rulers';

export const CanvasWorkspace: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const {
    currentTemplate,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    resetView,
    selectedLayerIds,
    selectLayer,
    updateLayer,
    updateLayerLive,
    gridSettings,
    snapSettings,
    showRulers,
    showGuides,
    showSafeZones,
    setCursorPosMm,
    activeSmartGuides,
    setActiveSmartGuides,
    updateGuide,
    nudgeSelectedLayers,
    deleteSelectedLayers,
    activeMobileSheet,
  } = useTemplateStore();

  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [draggingGuideId, setDraggingGuideId] = useState<string | null>(null);
  const [mobileNudgeStep, setMobileNudgeStep] = useState<number>(0.1);
  const [showMobilePad, setShowMobilePad] = useState<boolean>(true);

  // Gesture handling refs
  const lastTouchDistRef = useRef<number | null>(null);
  const lastTouchMidRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // ResizeObserver for responsive layout
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: Math.max(260, entry.contentRect.width),
          height: Math.max(260, entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const cardWidthMm = currentTemplate.cardWidth;
  const cardHeightMm = currentTemplate.cardHeight;

  // Responsive mobile screen detection
  const isMobileScreen = containerDimensions.width < 1024;
  const effectiveShowRulers = !isMobileScreen && showRulers;

  // When mobile drawer is open, reserve lower viewport space so canvas card stays 100% visible above drawer
  const sheetHeightReserve = isMobileScreen && activeMobileSheet ? Math.min(320, containerDimensions.height * 0.44) : 0;

  // Calculate base screen dimensions for card, leaving margin for smooth viewing
  const horizontalPadding = effectiveShowRulers ? 60 : isMobileScreen ? 16 : 32;
  const verticalPadding = effectiveShowRulers ? 60 : isMobileScreen ? 16 : 32;

  const maxAvailableW = Math.max(200, containerDimensions.width - horizontalPadding);
  const maxAvailableH = Math.max(120, containerDimensions.height - sheetHeightReserve - verticalPadding);

  const { pxWidth: baseWidthPx, pxHeight: baseHeightPx, dpi } = calculateCanvasPxSize(
    cardWidthMm,
    cardHeightMm,
    maxAvailableW,
    maxAvailableH
  );

  const cardWidthPx = baseWidthPx * zoom;
  const cardHeightPx = baseHeightPx * zoom;

  // Preload Image layers, Barcodes, QR codes, Background
  useEffect(() => {
    const imagesToLoad: Record<string, string> = {};

    if (currentTemplate.background?.type === 'image' && currentTemplate.background.src) {
      imagesToLoad['__bg__'] = currentTemplate.background.src;
    }

    currentTemplate.layers.forEach((l) => {
      if (l.type === 'image' && l.src) {
        imagesToLoad[l.id] = l.src;
      }
    });

    // Asynchronously generate Barcode & QR Code images
    const generateDynamicCodes = async () => {
      for (const l of currentTemplate.layers) {
        if (l.type === 'barcode') {
          const url = await generateBarcodeDataUrl(
            l.barcodeType,
            l.data,
            l.lineColor,
            l.backgroundColor,
            l.includeText
          );
          if (url) imagesToLoad[l.id] = url;
        } else if (l.type === 'qrcode') {
          const url = await generateQRCodeDataUrl(l.data, l.colorDark, l.colorLight);
          if (url) imagesToLoad[l.id] = url;
        }
      }

      // Load all into Image elements
      const newLoaded: Record<string, HTMLImageElement> = {};
      const promises = Object.entries(imagesToLoad).map(([key, src]) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            newLoaded[key] = img;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        });
      });

      await Promise.all(promises);
      setLoadedImages((prev) => ({ ...prev, ...newLoaded }));
    };

    generateDynamicCodes();
  }, [currentTemplate]);

  // Update Transformer selection
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const nodes: Konva.Node[] = [];

    selectedLayerIds.forEach((id) => {
      const node = stage.findOne('#' + id);
      if (node) nodes.push(node);
    });

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedLayerIds, currentTemplate.layers, zoom]);

  // Handle stage mouse movement for Cursor Position tracking in mm
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const pxPerMm = cardWidthPx / cardWidthMm;
      const xMm = Number((pointer.x / pxPerMm).toFixed(2));
      const yMm = Number((pointer.y / pxPerMm).toFixed(2));

      setCursorPosMm({
        x: Math.max(0, Math.min(cardWidthMm, xMm)),
        y: Math.max(0, Math.min(cardHeightMm, yMm)),
      });
    },
    [cardWidthPx, cardWidthMm, cardHeightMm, setCursorPosMm]
  );

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => prev * zoomFactor);
    }
  };

  // Multi-touch gestures: Pinch-to-zoom, Two-finger Pan, and Double-tap to fit
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      lastTouchDistRef.current = dist;
      lastTouchMidRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        resetView();
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const mid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      // 1. Pinch to zoom
      if (lastTouchDistRef.current && lastTouchDistRef.current > 0) {
        const factor = dist / lastTouchDistRef.current;
        if (Math.abs(factor - 1) > 0.008) {
          setZoom((prev) => Math.min(4.0, Math.max(0.25, prev * factor)));
        }
      }
      lastTouchDistRef.current = dist;

      // 2. Two-finger Pan
      if (lastTouchMidRef.current) {
        const dx = mid.x - lastTouchMidRef.current.x;
        const dy = mid.y - lastTouchMidRef.current.y;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }
      lastTouchMidRef.current = mid;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      lastTouchDistRef.current = null;
      lastTouchMidRef.current = null;
    }
  };

  // Magnetic Snapping position calculator for Konva dragBoundFunc
  const getDragBoundFunc = useCallback(
    (layerId: string) => {
      return (pos: { x: number; y: number }) => {
        const pxPerMm = cardWidthPx / cardWidthMm;
        const snapThresholdPx = snapSettings.thresholdMm * pxPerMm;

        let newX = pos.x;
        let newY = pos.y;

        const layer = currentTemplate.layers.find((l) => l.id === layerId);
        if (!layer) return pos;

        const nodeW = layer.width * pxPerMm;
        const nodeH = layer.height * pxPerMm;

        const nodeCenterX = newX + nodeW / 2;
        const nodeCenterY = newY + nodeH / 2;

        // 1. Center Snapping
        if (snapSettings.snapToCenter) {
          const cardCenterX = cardWidthPx / 2;
          const cardCenterY = cardHeightPx / 2;

          if (Math.abs(nodeCenterX - cardCenterX) < snapThresholdPx) {
            newX = cardCenterX - nodeW / 2;
          }
          if (Math.abs(nodeCenterY - cardCenterY) < snapThresholdPx) {
            newY = cardCenterY - nodeH / 2;
          }
        }

        // 2. Guide Snapping
        if (snapSettings.snapToGuides && showGuides) {
          currentTemplate.guides.forEach((g) => {
            if (g.hidden) return;
            const guidePx = g.position * pxPerMm;
            if (g.type === 'vertical') {
              if (Math.abs(newX - guidePx) < snapThresholdPx) {
                newX = guidePx;
              } else if (Math.abs(newX + nodeW - guidePx) < snapThresholdPx) {
                newX = guidePx - nodeW;
              }
            } else if (g.type === 'horizontal') {
              if (Math.abs(newY - guidePx) < snapThresholdPx) {
                newY = guidePx;
              } else if (Math.abs(newY + nodeH - guidePx) < snapThresholdPx) {
                newY = guidePx - nodeH;
              }
            }
          });
        }

        // 3. Grid Snapping
        if (snapSettings.snapToGrid && gridSettings.enabled) {
          const gridSizePx = gridSettings.sizeMm * pxPerMm;
          const snappedX = Math.round(newX / gridSizePx) * gridSizePx;
          const snappedY = Math.round(newY / gridSizePx) * gridSizePx;

          if (Math.abs(newX - snappedX) < snapThresholdPx) newX = snappedX;
          if (Math.abs(newY - snappedY) < snapThresholdPx) newY = snappedY;
        }

        // 4. Object Snapping
        if (snapSettings.snapToObjects) {
          currentTemplate.layers.forEach((other) => {
            if (other.id === layerId || other.hidden) return;
            const otherX = other.x * pxPerMm;
            const otherY = other.y * pxPerMm;
            const otherW = other.width * pxPerMm;
            const otherH = other.height * pxPerMm;

            if (Math.abs(newX - otherX) < snapThresholdPx) newX = otherX;
            if (Math.abs(newX + nodeW - (otherX + otherW)) < snapThresholdPx) newX = otherX + otherW - nodeW;
            if (Math.abs(newY - otherY) < snapThresholdPx) newY = otherY;
            if (Math.abs(newY + nodeH - (otherY + otherH)) < snapThresholdPx) newY = otherY + otherH - nodeH;
          });
        }

        return { x: newX, y: newY };
      };
    },
    [cardWidthPx, cardWidthMm, cardHeightPx, snapSettings, gridSettings, showGuides, currentTemplate]
  );

  // Smart guides & real-time store update during drag
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, layerId: string) => {
      const node = e.target;
      const pxPerMm = cardWidthPx / cardWidthMm;

      const newX = node.x();
      const newY = node.y();

      const newXMm = newX / pxPerMm;
      const newYMm = newY / pxPerMm;

      // Real-time update X, Y layer coordinates in store
      updateLayerLive(layerId, {
        x: Math.max(0, newXMm),
        y: Math.max(0, newYMm),
      });

      // Visual Smart Guides calculation
      const snapThresholdPx = snapSettings.thresholdMm * pxPerMm;
      const nodeW = node.width() * node.scaleX();
      const nodeH = node.height() * node.scaleY();
      const nodeCenterX = newX + nodeW / 2;
      const nodeCenterY = newY + nodeH / 2;
      const guides: SmartGuide[] = [];

      if (snapSettings.snapToCenter) {
        const cardCenterX = cardWidthPx / 2;
        const cardCenterY = cardHeightPx / 2;
        if (Math.abs(nodeCenterX - cardCenterX) < snapThresholdPx) {
          guides.push({ type: 'x', position: cardCenterX, label: 'Canvas Center X' });
        }
        if (Math.abs(nodeCenterY - cardCenterY) < snapThresholdPx) {
          guides.push({ type: 'y', position: cardCenterY, label: 'Canvas Center Y' });
        }
      }

      if (snapSettings.snapToGuides && showGuides) {
        currentTemplate.guides.forEach((g) => {
          if (g.hidden) return;
          const guidePx = g.position * pxPerMm;
          if (
            g.type === 'vertical' &&
            (Math.abs(newX - guidePx) < snapThresholdPx || Math.abs(newX + nodeW - guidePx) < snapThresholdPx)
          ) {
            guides.push({ type: 'x', position: guidePx });
          } else if (
            g.type === 'horizontal' &&
            (Math.abs(newY - guidePx) < snapThresholdPx || Math.abs(newY + nodeH - guidePx) < snapThresholdPx)
          ) {
            guides.push({ type: 'y', position: guidePx });
          }
        });
      }

      setActiveSmartGuides(guides);

      // Keep transformer selection handles attached and visible during move
      if (transformerRef.current) {
        transformerRef.current.forceUpdate();
        transformerRef.current.getLayer()?.batchDraw();
      }
    },
    [cardWidthPx, cardWidthMm, cardHeightPx, snapSettings, showGuides, currentTemplate, updateLayerLive, setActiveSmartGuides]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, layerId: string) => {
      const node = e.target;
      const pxPerMm = cardWidthPx / cardWidthMm;

      const newXMm = Number((node.x() / pxPerMm).toFixed(2));
      const newYMm = Number((node.y() / pxPerMm).toFixed(2));

      updateLayer(layerId, {
        x: Math.max(0, newXMm),
        y: Math.max(0, newYMm),
      });

      setActiveSmartGuides([]);

      if (transformerRef.current) {
        transformerRef.current.forceUpdate();
        transformerRef.current.getLayer()?.batchDraw();
      }
    },
    [cardWidthPx, cardWidthMm, updateLayer, setActiveSmartGuides]
  );

  const handleTransformEnd = useCallback(
    (layerId: string) => {
      const stage = stageRef.current;
      if (!stage) return;
      const node = stage.findOne('#' + layerId);
      if (!node) return;

      const pxPerMm = cardWidthPx / cardWidthMm;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      const newXMm = Number((node.x() / pxPerMm).toFixed(2));
      const newYMm = Number((node.y() / pxPerMm).toFixed(2));
      const newWMm = Number(((node.width() * scaleX) / pxPerMm).toFixed(2));
      const newHMm = Number(((node.height() * scaleY) / pxPerMm).toFixed(2));
      const newRotation = Number(node.rotation().toFixed(1));

      updateLayer(layerId, {
        x: Math.max(0, newXMm),
        y: Math.max(0, newYMm),
        width: Math.max(1, newWMm),
        height: Math.max(1, newHMm),
        rotation: newRotation,
      });
    },
    [cardWidthPx, cardWidthMm, updateLayer]
  );

  // Keyboard Arrow Key Nudge Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (selectedLayerIds.length === 0) return;

      const step = e.shiftKey ? 1.0 : 0.1; // 1.0mm coarse, 0.1mm fine

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelectedLayers(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelectedLayers(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelectedLayers(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelectedLayers(0, step);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedLayers();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerIds, nudgeSelectedLayers, deleteSelectedLayers]);

  // Render Card Safe Zones Overlay (Bleed, Cut, Safe Area)
  const renderSafeZones = () => {
    if (!showSafeZones) return null;
    const pxPerMm = cardWidthPx / cardWidthMm;
    const safeMarginPx = 3.0 * pxPerMm; // 3mm safe zone margin
    const cr80RadiusPx = 3.18 * pxPerMm; // 3.18mm corner radius

    return (
      <Group listening={false}>
        {/* Cut Boundary Line (Green) */}
        <Rect
          x={0}
          y={0}
          width={cardWidthPx}
          height={cardHeightPx}
          stroke="#22c55e"
          strokeWidth={1.5}
          dash={[6, 4]}
          cornerRadius={cr80RadiusPx}
          listening={false}
        />
        {/* Safe Zone Boundary Line (Blue) */}
        <Rect
          x={safeMarginPx}
          y={safeMarginPx}
          width={Math.max(1, cardWidthPx - safeMarginPx * 2)}
          height={Math.max(1, cardHeightPx - safeMarginPx * 2)}
          stroke="#3b82f6"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      </Group>
    );
  };

  // Render Grid lines
  const renderGridLines = () => {
    if (!gridSettings.enabled) return null;
    const pxPerMm = cardWidthPx / cardWidthMm;
    const stepPx = gridSettings.sizeMm * pxPerMm;

    const verticalLines: React.ReactNode[] = [];
    const horizontalLines: React.ReactNode[] = [];

    for (let x = stepPx; x < cardWidthPx; x += stepPx) {
      verticalLines.push(
        <Line
          key={`vgrid_${x}`}
          points={[x, 0, x, cardHeightPx]}
          stroke={gridSettings.color}
          strokeWidth={0.5}
          opacity={gridSettings.opacity}
          dash={[2, 2]}
        />
      );
    }

    for (let y = stepPx; y < cardHeightPx; y += stepPx) {
      horizontalLines.push(
        <Line
          key={`hgrid_${y}`}
          points={[0, y, cardWidthPx, y]}
          stroke={gridSettings.color}
          strokeWidth={0.5}
          opacity={gridSettings.opacity}
          dash={[2, 2]}
        />
      );
    }

    return (
      <Group id="grid_group" listening={false}>
        {verticalLines}
        {horizontalLines}
      </Group>
    );
  };

  // Render Guides
  const renderGuides = () => {
    if (!showGuides) return null;
    const pxPerMm = cardWidthPx / cardWidthMm;

    return currentTemplate.guides.map((guide) => {
      if (guide.hidden) return null;
      const posPx = guide.position * pxPerMm;

      if (guide.type === 'horizontal') {
        return (
          <Line
            key={guide.id}
            points={[0, posPx, cardWidthPx, posPx]}
            stroke={guide.color || '#3b82f6'}
            strokeWidth={1}
            dash={[4, 4]}
            draggable={!guide.locked}
            onDragEnd={(e) => {
              const newPosMm = Number((e.target.y() / pxPerMm).toFixed(2));
              updateGuide(guide.id, { position: Math.max(0, Math.min(cardHeightMm, newPosMm)) });
              e.target.y(0);
            }}
          />
        );
      } else {
        return (
          <Line
            key={guide.id}
            points={[posPx, 0, posPx, cardHeightPx]}
            stroke={guide.color || '#3b82f6'}
            strokeWidth={1}
            dash={[4, 4]}
            draggable={!guide.locked}
            onDragEnd={(e) => {
              const newPosMm = Number((e.target.x() / pxPerMm).toFixed(2));
              updateGuide(guide.id, { position: Math.max(0, Math.min(cardWidthMm, newPosMm)) });
              e.target.x(0);
            }}
          />
        );
      }
    });
  };

  // Render Smart Guides
  const renderSmartGuides = () => {
    return activeSmartGuides.map((guide, idx) => {
      if (guide.type === 'x') {
        return (
          <Line
            key={`sg_${idx}`}
            points={[guide.position, 0, guide.position, cardHeightPx]}
            stroke="#ef4444"
            strokeWidth={1.5}
            listening={false}
          />
        );
      } else {
        return (
          <Line
            key={`sg_${idx}`}
            points={[0, guide.position, cardWidthPx, guide.position]}
            stroke="#ef4444"
            strokeWidth={1.5}
            listening={false}
          />
        );
      }
    });
  };

  const pxPerMm = cardWidthPx / cardWidthMm;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={() => resetView()}
      className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none p-1 sm:p-4"
      style={{ touchAction: 'none' }}
    >
      {/* Centered Canvas Container with Pan offset and Double-Tap reset */}
      <div
        className="flex flex-col items-center justify-center max-w-full max-h-full transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y - (sheetHeightReserve / 2)}px)`,
        }}
      >
        {effectiveShowRulers && (
          <div className="flex items-center">
            {/* Top-Left Corner Box */}
            <div className="w-6 h-6 bg-slate-800 border-r border-b border-slate-700 flex items-center justify-center text-[9px] font-mono text-slate-400">
              mm
            </div>
            <TopRuler stageWidthPx={cardWidthPx} stageHeightPx={cardHeightPx} scale={1} />
          </div>
        )}

        <div className="flex items-start">
          {effectiveShowRulers && <LeftRuler stageWidthPx={cardWidthPx} stageHeightPx={cardHeightPx} scale={1} />}

          {/* Canvas Card Container with Real CR80 Rounded Corners */}
          <div
            className="relative bg-white shadow-2xl overflow-hidden border border-slate-700/80 transition-shadow duration-150"
            style={{
              width: cardWidthPx,
              height: cardHeightPx,
              borderRadius: `${Math.round(3.18 * pxPerMm)}px`,
              touchAction: 'none',
            }}
          >
            <Stage
              ref={stageRef}
              width={cardWidthPx}
              height={cardHeightPx}
              onMouseMove={handleMouseMove}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  selectLayer('', false);
                }
              }}
              onTouchStart={(e) => {
                if (e.target === e.target.getStage()) {
                  selectLayer('', false);
                }
              }}
            >
              {/* Background Layer */}
              <KonvaLayer>
                {currentTemplate.background?.type === 'color' ? (
                  <Rect
                    width={cardWidthPx}
                    height={cardHeightPx}
                    fill={currentTemplate.background.color || '#ffffff'}
                    cornerRadius={3.18 * pxPerMm}
                  />
                ) : loadedImages['__bg__'] ? (
                  <KonvaImage
                    image={loadedImages['__bg__']}
                    width={cardWidthPx}
                    height={cardHeightPx}
                  />
                ) : (
                  <Rect
                    width={cardWidthPx}
                    height={cardHeightPx}
                    fill="#ffffff"
                    cornerRadius={3.18 * pxPerMm}
                  />
                )}

                {/* Grid */}
                {renderGridLines()}
              </KonvaLayer>

              {/* Elements Layer */}
              <KonvaLayer>
                {currentTemplate.layers.map((layer) => {
                  if (layer.hidden) return null;

                  const xPx = layer.x * pxPerMm;
                  const yPx = layer.y * pxPerMm;
                  const wPx = layer.width * pxPerMm;
                  const hPx = layer.height * pxPerMm;

                  const commonProps = {
                    id: layer.id,
                    x: xPx,
                    y: yPx,
                    rotation: layer.rotation || 0,
                    opacity: layer.opacity ?? 1,
                    draggable: !layer.locked,
                    dragBoundFunc: getDragBoundFunc(layer.id),
                    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                      e.cancelBubble = true;
                      selectLayer(layer.id, e.evt.shiftKey);
                    },
                    onTap: (e: Konva.KonvaEventObject<TouchEvent>) => {
                      e.cancelBubble = true;
                      selectLayer(layer.id, false);
                    },
                    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
                      e.cancelBubble = true;
                      const evt = e.evt as MouseEvent | TouchEvent;
                      const isShift = Boolean(evt && evt.shiftKey);
                      if (!selectedLayerIds.includes(layer.id)) {
                        selectLayer(layer.id, isShift);
                      }
                    },
                    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => handleDragMove(e, layer.id),
                    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, layer.id),
                    onTransformEnd: () => handleTransformEnd(layer.id),
                  };

                  if (layer.type === 'text') {
                    const fontSizePx = layer.fontSize * pxPerMm;
                    const weight = layer.fontWeight ?? (layer.fontStyle?.includes('bold') ? 700 : 400);
                    const isItalic = layer.fontStyle?.includes('italic');
                    const computedStyle = `${weight}${isItalic ? ' italic' : ''}`;

                    return (
                      <KonvaText
                        {...commonProps}
                        key={layer.id}
                        width={wPx}
                        text={layer.text}
                        fontFamily={layer.fontFamily || 'Helvetica'}
                        fontSize={fontSizePx}
                        fontStyle={computedStyle}
                        textDecoration={layer.textDecoration === 'underline' ? 'underline' : ''}
                        fill={layer.color || '#000000'}
                        align={layer.align || 'left'}
                        letterSpacing={layer.letterSpacing ? layer.letterSpacing * pxPerMm : 0}
                      />
                    );
                  }

                  if (layer.type === 'image' || layer.type === 'barcode' || layer.type === 'qrcode') {
                    const imgObj = loadedImages[layer.id];
                    return (
                      <KonvaImage
                        {...commonProps}
                        key={layer.id}
                        image={imgObj}
                        width={wPx}
                        height={hPx}
                      />
                    );
                  }

                  if (layer.type === 'placeholder') {
                    return (
                      <Group {...commonProps} key={layer.id}>
                        <Rect
                          width={wPx}
                          height={hPx}
                          fill={layer.backgroundColor || '#f1f5f9'}
                          stroke={layer.borderColor || '#1e3a8a'}
                          strokeWidth={2}
                          dash={[4, 4]}
                        />
                        <KonvaText
                          width={wPx}
                          height={hPx}
                          text={`{{${layer.placeholderKey}}}\n(${layer.label})`}
                          fontFamily="sans-serif"
                          fontSize={Math.max(10, hPx / 8)}
                          fill="#64748b"
                          align="center"
                          verticalAlign="middle"
                        />
                      </Group>
                    );
                  }

                  if (layer.type === 'shape') {
                    if (layer.shapeType === 'rectangle') {
                      return (
                        <Rect
                          {...commonProps}
                          key={layer.id}
                          width={wPx}
                          height={hPx}
                          fill={layer.fill || 'rgba(0,0,0,0)'}
                          stroke={layer.stroke || 'transparent'}
                          strokeWidth={layer.strokeWidth ? layer.strokeWidth * pxPerMm : 0}
                          cornerRadius={layer.borderRadius ? layer.borderRadius * pxPerMm : 0}
                        />
                      );
                    }
                    if (layer.shapeType === 'circle') {
                      return (
                        <Group {...commonProps} key={layer.id}>
                          <Circle
                            x={wPx / 2}
                            y={hPx / 2}
                            radius={Math.min(wPx, hPx) / 2}
                            fill={layer.fill || 'rgba(0,0,0,0)'}
                            stroke={layer.stroke || 'transparent'}
                            strokeWidth={layer.strokeWidth ? layer.strokeWidth * pxPerMm : 0}
                          />
                        </Group>
                      );
                    }
                    if (layer.shapeType === 'line') {
                      return (
                        <Group {...commonProps} key={layer.id}>
                          <Line
                            points={[0, hPx / 2, wPx, hPx / 2]}
                            stroke={layer.stroke || layer.fill || '#000000'}
                            strokeWidth={Math.max(2, layer.strokeWidth ? layer.strokeWidth * pxPerMm : 2)}
                            hitStrokeWidth={Math.max(15, layer.strokeWidth ? layer.strokeWidth * pxPerMm : 15)}
                          />
                        </Group>
                      );
                    }
                    if (layer.shapeType === 'polygon') {
                      return (
                        <Group {...commonProps} key={layer.id}>
                          <RegularPolygon
                            x={wPx / 2}
                            y={hPx / 2}
                            sides={layer.polygonSides || 5}
                            radius={Math.min(wPx, hPx) / 2}
                            fill={layer.fill || 'rgba(0,0,0,0)'}
                            stroke={layer.stroke || 'transparent'}
                            strokeWidth={layer.strokeWidth ? layer.strokeWidth * pxPerMm : 0}
                          />
                        </Group>
                      );
                    }
                  }

                  return null;
                })}

                {/* Transformer handles */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) return oldBox;
                    return newBox;
                  }}
                  anchorSize={8}
                  anchorCornerRadius={2}
                  borderStroke="#3b82f6"
                  borderDash={[3, 3]}
                />

                {/* Guides & Smart Guides */}
                {renderGuides()}
                {renderSmartGuides()}
                {renderSafeZones()}
              </KonvaLayer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Mobile Floating Precision Directional Pad */}
      {selectedLayerIds.length > 0 && showMobilePad && (
        <div className="absolute bottom-20 lg:bottom-4 right-3 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2 flex flex-col items-center gap-1">
          <div className="flex items-center justify-between w-full px-1 text-[10px] text-slate-400 font-mono">
            <span>PAD ({mobileNudgeStep}mm)</span>
            <button
              onClick={() => setMobileNudgeStep((s) => (s === 0.1 ? 1.0 : 0.1))}
              className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded font-semibold text-[9px]"
              title="Toggle Step Size"
            >
              {mobileNudgeStep === 0.1 ? 'Fine' : 'Coarse'}
            </button>
          </div>

          {/* D-Pad Buttons */}
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              onClick={() => nudgeSelectedLayers(0, -mobileNudgeStep)}
              className="w-8 h-8 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow transition-colors"
              title="Move Up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div />

            <button
              onClick={() => nudgeSelectedLayers(-mobileNudgeStep, 0)}
              className="w-8 h-8 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow transition-colors"
              title="Move Left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center text-slate-500 text-[10px] font-bold">
              <Move className="w-3.5 h-3.5" />
            </div>
            <button
              onClick={() => nudgeSelectedLayers(mobileNudgeStep, 0)}
              className="w-8 h-8 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow transition-colors"
              title="Move Right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div />
            <button
              onClick={() => nudgeSelectedLayers(0, mobileNudgeStep)}
              className="w-8 h-8 bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow transition-colors"
              title="Move Down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <div />
          </div>
        </div>
      )}
    </div>
  );
};
