import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from "fancy-canvas";

import { Coordinate } from "../../model/coordinate";
import {
	IPrimitivePaneRenderer,
	PrimitiveHoveredItem,
} from "../../model/ipane-primitive";
import { LineStyle, setLineStyle } from "../../renderers/draw-line";

import { RectangleExtendMode } from "./options";

export interface RectangleRendererPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export interface RectangleRendererData {
	/** The first anchor point (one corner) */
	p1: RectangleRendererPoint;
	/** The second anchor point (opposite corner) */
	p2: RectangleRendererPoint;
	/** Left x coordinate for drawing (may differ from p1/p2 if extended) */
	drawLeft: number;
	/** Right x coordinate for drawing (may differ from p1/p2 if extended) */
	drawRight: number;
	/** Top y coordinate for drawing */
	drawTop: number;
	/** Bottom y coordinate for drawing */
	drawBottom: number;
	/** Border line color */
	lineColor: string;
	/** Border line width */
	lineWidth: number;
	/** Border line style */
	lineStyle: LineStyle;
	/** Background fill color */
	backgroundColor: string;
	/** Custom label text */
	labelText: string;
	/** Whether to show the label */
	showLabel: boolean;
	/** Label background color */
	labelBackgroundColor: string;
	/** Label text color */
	labelTextColor: string;
	/** Extension mode */
	extendMode: RectangleExtendMode;
	/** External ID for hit test */
	externalId: string;
	/** Chart width for hit test bounds */
	chartWidth: number;
	/** Chart height for hit test bounds */
	chartHeight: number;
	/** Whether the rectangle is selected */
	selected: boolean;
	/** Color of anchor point indicators */
	anchorPointColor: string;
	/** Whether to show the middle line */
	showMiddleLine: boolean;
	/** Color of the middle line */
	middleLineColor: string;
	/** Style of the middle line */
	middleLineStyle: LineStyle;
	/** Width of the middle line */
	middleLineWidth: number;
}

/**
 * Hit test tolerance in pixels - how close the cursor must be to the border to count as a hit
 */
const HIT_TEST_TOLERANCE = 6;

/**
 * Anchor point hit test radius in pixels - size of clickable area around anchor points
 * Slightly larger than visual radius (5px) for easier clicking
 */
const ANCHOR_HIT_RADIUS = 8;

/**
 * Check if a point is near a horizontal line segment
 */
function isNearHorizontalLine(
	px: number,
	py: number,
	x1: number,
	x2: number,
	y: number,
	tolerance: number
): boolean {
	const minX = Math.min(x1, x2);
	const maxX = Math.max(x1, x2);
	return px >= minX && px <= maxX && Math.abs(py - y) <= tolerance;
}

/**
 * Check if a point is near a vertical line segment
 */
function isNearVerticalLine(
	px: number,
	py: number,
	x: number,
	y1: number,
	y2: number,
	tolerance: number
): boolean {
	const minY = Math.min(y1, y2);
	const maxY = Math.max(y1, y2);
	return py >= minY && py <= maxY && Math.abs(px - x) <= tolerance;
}

export class RectangleRenderer implements IPrimitivePaneRenderer {
	private _data: RectangleRendererData | null = null;

	public setData(data: RectangleRendererData): void {
		this._data = data;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useBitmapCoordinateSpace(
			(scope: BitmapCoordinatesRenderingScope) => {
				this._drawImpl(scope);
			}
		);
	}

	public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		if (!this._data) {
			return null;
		}

		const {
			drawLeft,
			drawRight,
			drawTop,
			drawBottom,
			externalId,
			extendMode,
			showMiddleLine,
			selected,
			p1,
			p2,
		} = this._data;

		// When selected, check anchor points first (higher priority than borders)
		if (selected) {
			const anchorResult = this._hitTestAnchorPoints(x, y, p1, p2, externalId);
			if (anchorResult) {
				return anchorResult;
			}
		}

		// Determine which borders to check based on extend mode
		const showLeftBorder = extendMode !== "left" && extendMode !== "both";
		const showRightBorder = extendMode !== "right" && extendMode !== "both";

		// Check if near any of the visible border lines
		const nearTop = isNearHorizontalLine(
			x,
			y,
			drawLeft,
			drawRight,
			drawTop,
			HIT_TEST_TOLERANCE
		);
		const nearBottom = isNearHorizontalLine(
			x,
			y,
			drawLeft,
			drawRight,
			drawBottom,
			HIT_TEST_TOLERANCE
		);
		const nearLeft =
			showLeftBorder &&
			isNearVerticalLine(
				x,
				y,
				drawLeft,
				drawTop,
				drawBottom,
				HIT_TEST_TOLERANCE
			);
		const nearRight =
			showRightBorder &&
			isNearVerticalLine(
				x,
				y,
				drawRight,
				drawTop,
				drawBottom,
				HIT_TEST_TOLERANCE
			);

		// Check if near the middle line
		const middleY = (drawTop + drawBottom) / 2;
		const nearMiddle =
			showMiddleLine &&
			isNearHorizontalLine(
				x,
				y,
				drawLeft,
				drawRight,
				middleY,
				HIT_TEST_TOLERANCE
			);

		if (nearTop || nearBottom || nearLeft || nearRight || nearMiddle) {
			return {
				cursorStyle: "pointer",
				externalId: externalId,
				zOrder: "normal",
			};
		}

		return null;
	}

	/**
	 * Test if the given point hits one of the anchor points.
	 * Returns a PrimitiveHoveredItem with anchor index encoded in externalId if hit.
	 */
	private _hitTestAnchorPoints(
		x: number,
		y: number,
		p1: RectangleRendererPoint,
		p2: RectangleRendererPoint,
		externalId: string
	): PrimitiveHoveredItem | null {
		// Check anchor point 1 (first corner)
		if (p1.x !== null && p1.y !== null) {
			const distToP1 = Math.sqrt(
				(x - p1.x) * (x - p1.x) + (y - p1.y) * (y - p1.y)
			);
			if (distToP1 <= ANCHOR_HIT_RADIUS) {
				return {
					cursorStyle: "grab",
					externalId: `${externalId}:anchor:0`,
					zOrder: "normal",
				};
			}
		}

		// Check anchor point 2 (second corner)
		if (p2.x !== null && p2.y !== null) {
			const distToP2 = Math.sqrt(
				(x - p2.x) * (x - p2.x) + (y - p2.y) * (y - p2.y)
			);
			if (distToP2 <= ANCHOR_HIT_RADIUS) {
				return {
					cursorStyle: "grab",
					externalId: `${externalId}:anchor:1`,
					zOrder: "normal",
				};
			}
		}

		return null;
	}

	private _drawImpl(scope: BitmapCoordinatesRenderingScope): void {
		if (!this._data) {
			return;
		}

		const {
			drawLeft,
			drawRight,
			drawTop,
			drawBottom,
			lineColor,
			lineWidth,
			lineStyle,
			backgroundColor,
			labelText,
			showLabel,
			labelBackgroundColor,
			labelTextColor,
			extendMode,
			selected,
			anchorPointColor,
			p1,
			p2,
		} = this._data;

		const ctx = scope.context;
		const horizontalPixelRatio = scope.horizontalPixelRatio;
		const verticalPixelRatio = scope.verticalPixelRatio;

		// Scale coordinates
		const leftScaled = Math.round(drawLeft * horizontalPixelRatio);
		const rightScaled = Math.round(drawRight * horizontalPixelRatio);
		const topScaled = Math.round(drawTop * verticalPixelRatio);
		const bottomScaled = Math.round(drawBottom * verticalPixelRatio);

		const rectWidth = rightScaled - leftScaled;
		const rectHeight = bottomScaled - topScaled;

		// Draw background fill
		ctx.save();
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(leftScaled, topScaled, rectWidth, rectHeight);
		ctx.restore();

		// Determine which borders to draw based on extend mode
		const showLeftBorder = extendMode !== "left" && extendMode !== "both";
		const showRightBorder = extendMode !== "right" && extendMode !== "both";

		// Draw borders individually (excluding extended sides)
		ctx.save();
		ctx.lineWidth = lineWidth * horizontalPixelRatio;
		ctx.strokeStyle = lineColor;
		setLineStyle(ctx, lineStyle);

		// Top border (always drawn)
		ctx.beginPath();
		ctx.moveTo(leftScaled, topScaled);
		ctx.lineTo(rightScaled, topScaled);
		ctx.stroke();

		// Bottom border (always drawn)
		ctx.beginPath();
		ctx.moveTo(leftScaled, bottomScaled);
		ctx.lineTo(rightScaled, bottomScaled);
		ctx.stroke();

		// Left border (only if not extended left or both)
		if (showLeftBorder) {
			ctx.beginPath();
			ctx.moveTo(leftScaled, topScaled);
			ctx.lineTo(leftScaled, bottomScaled);
			ctx.stroke();
		}

		// Right border (only if not extended right or both)
		if (showRightBorder) {
			ctx.beginPath();
			ctx.moveTo(rightScaled, topScaled);
			ctx.lineTo(rightScaled, bottomScaled);
			ctx.stroke();
		}

		ctx.restore();

		// Draw middle line if enabled
		if (this._data.showMiddleLine) {
			const middleY = Math.round((topScaled + bottomScaled) / 2);

			ctx.save();
			ctx.lineWidth = this._data.middleLineWidth * horizontalPixelRatio;
			ctx.strokeStyle = this._data.middleLineColor;
			setLineStyle(ctx, this._data.middleLineStyle);

			ctx.beginPath();
			ctx.moveTo(leftScaled, middleY);
			ctx.lineTo(rightScaled, middleY);
			ctx.stroke();

			ctx.restore();
		}

		// Draw label if enabled and text is provided
		if (showLabel && labelText.length > 0) {
			this._drawLabel(
				scope,
				labelText,
				leftScaled + rectWidth / 2,
				topScaled + 10 * verticalPixelRatio,
				labelBackgroundColor,
				labelTextColor
			);
		}

		// Draw anchor point indicators when selected (only the 2 defining corners)
		if (
			selected &&
			p1.x !== null &&
			p1.y !== null &&
			p2.x !== null &&
			p2.y !== null
		) {
			const p1XScaled = Math.round(p1.x * horizontalPixelRatio);
			const p1YScaled = Math.round(p1.y * verticalPixelRatio);
			const p2XScaled = Math.round(p2.x * horizontalPixelRatio);
			const p2YScaled = Math.round(p2.y * verticalPixelRatio);

			// Draw only the two defining corners (p1 and p2)
			this._drawAnchorPoint(
				ctx,
				p1XScaled,
				p1YScaled,
				anchorPointColor,
				horizontalPixelRatio
			);
			this._drawAnchorPoint(
				ctx,
				p2XScaled,
				p2YScaled,
				anchorPointColor,
				horizontalPixelRatio
			);
		}
	}

	private _drawLabel(
		scope: BitmapCoordinatesRenderingScope,
		text: string,
		x: number,
		y: number,
		backgroundColor: string,
		textColor: string
	): void {
		const ctx = scope.context;
		const padding = 5 * scope.horizontalPixelRatio;

		ctx.font = `${12 * scope.verticalPixelRatio}px Arial`;
		const textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = 12 * scope.verticalPixelRatio;
		const boxWidth = textWidth + padding * 2;
		const boxHeight = textHeight + padding;

		// Center the box horizontally on x
		const boxX = x - boxWidth / 2;
		const boxY = y;

		// Draw background
		ctx.fillStyle = backgroundColor;
		ctx.beginPath();
		ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
		ctx.fill();

		// Draw text
		ctx.fillStyle = textColor;
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText(text, x, boxY + boxHeight / 2);
	}

	private _drawAnchorPoint(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		color: string,
		pixelRatio: number
	): void {
		const radius = 5 * pixelRatio;
		const borderWidth = 2 * pixelRatio;

		// Draw outer circle (border)
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = color;
		ctx.lineWidth = borderWidth;
		ctx.stroke();

		// Draw inner fill (transparent/dark center)
		ctx.beginPath();
		ctx.arc(x, y, radius - borderWidth / 2, 0, 2 * Math.PI);
		ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
		ctx.fill();
	}
}
