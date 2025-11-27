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

export interface TrendLineRendererPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export interface TrendLineRendererData {
	/** The first anchor point */
	p1: TrendLineRendererPoint;
	/** The second anchor point */
	p2: TrendLineRendererPoint;
	/** Extended line start (at chart left edge) */
	extendedStart: TrendLineRendererPoint;
	/** Extended line end (at chart right edge) */
	extendedEnd: TrendLineRendererPoint;
	/** Label text for p1 */
	text1: string;
	/** Label text for p2 */
	text2: string;
	/** Line color */
	lineColor: string;
	/** Line width */
	lineWidth: number;
	/** Line style */
	lineStyle: LineStyle;
	/** Whether to show labels */
	showLabels: boolean;
	/** Label background color */
	labelBackgroundColor: string;
	/** Label text color */
	labelTextColor: string;
	/** Whether to extend to edges */
	extendToEdges: boolean;
	/** External ID for hit test */
	externalId: string;
	/** Chart width for hit test bounds */
	chartWidth: number;
	/** Chart height for hit test bounds */
	chartHeight: number;
	/** Whether the trend line is selected */
	selected: boolean;
	/** Color of anchor point indicators */
	anchorPointColor: string;
}

/**
 * Hit test tolerance in pixels - how close the cursor must be to the line to count as a hit
 */
const HIT_TEST_TOLERANCE = 6;

/**
 * Calculate the distance from a point to a line segment
 */
function distanceToLineSegment(
	px: number,
	py: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number
): number {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const lengthSquared = dx * dx + dy * dy;

	if (lengthSquared === 0) {
		// The segment is a point
		return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
	}

	// Calculate projection of point onto line
	let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
	t = Math.max(0, Math.min(1, t));

	// Find the closest point on the segment
	const closestX = x1 + t * dx;
	const closestY = y1 + t * dy;

	return Math.sqrt(
		(px - closestX) * (px - closestX) + (py - closestY) * (py - closestY)
	);
}

export class TrendLineRenderer implements IPrimitivePaneRenderer {
	private _data: TrendLineRendererData | null = null;

	public setData(data: TrendLineRendererData): void {
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

		const { extendToEdges, p1, p2, extendedStart, extendedEnd, externalId } =
			this._data;

		// Determine which points to use for hit testing
		let lineX1: number | null;
		let lineY1: number | null;
		let lineX2: number | null;
		let lineY2: number | null;

		if (extendToEdges) {
			lineX1 = extendedStart.x;
			lineY1 = extendedStart.y;
			lineX2 = extendedEnd.x;
			lineY2 = extendedEnd.y;
		} else {
			lineX1 = p1.x;
			lineY1 = p1.y;
			lineX2 = p2.x;
			lineY2 = p2.y;
		}

		if (
			lineX1 === null ||
			lineY1 === null ||
			lineX2 === null ||
			lineY2 === null
		) {
			return null;
		}

		const distance = distanceToLineSegment(
			x,
			y,
			lineX1,
			lineY1,
			lineX2,
			lineY2
		);

		if (distance <= HIT_TEST_TOLERANCE) {
			return {
				cursorStyle: "pointer",
				externalId: externalId,
				zOrder: "normal",
			};
		}

		return null;
	}

	private _drawImpl(scope: BitmapCoordinatesRenderingScope): void {
		if (!this._data) {
			return;
		}

		const {
			p1,
			p2,
			extendedStart,
			extendedEnd,
			lineColor,
			lineWidth,
			lineStyle,
			showLabels,
			labelBackgroundColor,
			labelTextColor,
			text1,
			text2,
			extendToEdges,
		} = this._data;

		// Determine which points to draw between
		let drawX1: number | null;
		let drawY1: number | null;
		let drawX2: number | null;
		let drawY2: number | null;

		if (extendToEdges) {
			drawX1 = extendedStart.x;
			drawY1 = extendedStart.y;
			drawX2 = extendedEnd.x;
			drawY2 = extendedEnd.y;
		} else {
			drawX1 = p1.x;
			drawY1 = p1.y;
			drawX2 = p2.x;
			drawY2 = p2.y;
		}

		if (
			drawX1 === null ||
			drawY1 === null ||
			drawX2 === null ||
			drawY2 === null
		) {
			return;
		}

		const ctx = scope.context;
		const horizontalPixelRatio = scope.horizontalPixelRatio;
		const verticalPixelRatio = scope.verticalPixelRatio;

		// Scale coordinates
		const x1Scaled = Math.round(drawX1 * horizontalPixelRatio);
		const y1Scaled = Math.round(drawY1 * verticalPixelRatio);
		const x2Scaled = Math.round(drawX2 * horizontalPixelRatio);
		const y2Scaled = Math.round(drawY2 * verticalPixelRatio);

		// Draw the line
		ctx.save();
		// Scale line width by pixel ratio for consistency with built-in price lines
		ctx.lineWidth = lineWidth * horizontalPixelRatio;
		ctx.strokeStyle = lineColor;
		setLineStyle(ctx, lineStyle);

		ctx.beginPath();
		ctx.moveTo(x1Scaled, y1Scaled);
		ctx.lineTo(x2Scaled, y2Scaled);
		ctx.stroke();
		ctx.restore();

		// Draw labels at the anchor points (not the extended points)
		if (
			showLabels &&
			p1.x !== null &&
			p1.y !== null &&
			p2.x !== null &&
			p2.y !== null
		) {
			const p1XScaled = Math.round(p1.x * horizontalPixelRatio);
			const p1YScaled = Math.round(p1.y * verticalPixelRatio);
			const p2XScaled = Math.round(p2.x * horizontalPixelRatio);
			const p2YScaled = Math.round(p2.y * verticalPixelRatio);

			this._drawLabel(
				scope,
				text1,
				p1XScaled,
				p1YScaled,
				labelBackgroundColor,
				labelTextColor,
				true
			);
			this._drawLabel(
				scope,
				text2,
				p2XScaled,
				p2YScaled,
				labelBackgroundColor,
				labelTextColor,
				false
			);
		}

		// Draw anchor point indicators when selected
		if (
			this._data.selected &&
			p1.x !== null &&
			p1.y !== null &&
			p2.x !== null &&
			p2.y !== null
		) {
			const p1XScaled = Math.round(p1.x * horizontalPixelRatio);
			const p1YScaled = Math.round(p1.y * verticalPixelRatio);
			const p2XScaled = Math.round(p2.x * horizontalPixelRatio);
			const p2YScaled = Math.round(p2.y * verticalPixelRatio);

			this._drawAnchorPoint(
				ctx,
				p1XScaled,
				p1YScaled,
				this._data.anchorPointColor,
				horizontalPixelRatio
			);
			this._drawAnchorPoint(
				ctx,
				p2XScaled,
				p2YScaled,
				this._data.anchorPointColor,
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
		textColor: string,
		isLeft: boolean
	): void {
		const ctx = scope.context;
		const offset = 5 * scope.horizontalPixelRatio;

		ctx.font = "12px Arial";
		const textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = 12 * scope.verticalPixelRatio;
		const padding = offset;
		const boxWidth = textWidth + padding * 2;
		const boxHeight = textHeight + padding;

		// Position box to left or right of anchor point
		const boxX = isLeft ? x - boxWidth - offset : x + offset;
		const boxY = y - boxHeight / 2;

		// Draw background
		ctx.fillStyle = backgroundColor;
		ctx.beginPath();
		ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
		ctx.fill();

		// Draw text
		ctx.fillStyle = textColor;
		ctx.textBaseline = "middle";
		ctx.fillText(text, boxX + padding, y);
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
