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

import { PositionDirection } from "./options";

export interface LongPositionRendererPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export interface LongPositionRendererData {
	/** Entry point (left edge, entry price) */
	entry: LongPositionRendererPoint;
	/** Target price y coordinate */
	targetY: Coordinate | null;
	/** Stop price y coordinate */
	stopY: Coordinate | null;
	/** Right edge x coordinate */
	rightX: Coordinate | null;
	/** Entry price for calculations */
	entryPrice: number;
	/** Target price for calculations */
	targetPrice: number;
	/** Stop price for calculations */
	stopPrice: number;
	/** Border line color */
	lineColor: string;
	/** Border line width */
	lineWidth: number;
	/** Border line style */
	lineStyle: LineStyle;
	/** Profit zone background color */
	profitBackgroundColor: string;
	/** Risk zone background color */
	riskBackgroundColor: string;
	/** Entry line color */
	entryLineColor: string;
	/** External ID for hit test */
	externalId: string;
	/** Chart width for hit test bounds */
	chartWidth: number;
	/** Chart height for hit test bounds */
	chartHeight: number;
	/** Whether the drawing is selected */
	selected: boolean;
	/** Color of anchor point indicators */
	anchorPointColor: string;
	/** Label background color */
	labelBackgroundColor: string;
	/** Label text color */
	labelTextColor: string;
	/** Target label background color */
	targetLabelBackgroundColor: string;
	/** Stop label background color */
	stopLabelBackgroundColor: string;
	/** Direction of the position (long or short) */
	direction: PositionDirection;
}

/**
 * Hit test tolerance in pixels
 */
const HIT_TEST_TOLERANCE = 6;

/**
 * Anchor point hit test radius in pixels
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

/**
 * Check if a point is inside a rectangle
 */
function isInsideRect(
	px: number,
	py: number,
	left: number,
	right: number,
	top: number,
	bottom: number
): boolean {
	return px >= left && px <= right && py >= top && py <= bottom;
}

export class LongPositionRenderer implements IPrimitivePaneRenderer {
	private _data: LongPositionRendererData | null = null;

	public setData(data: LongPositionRendererData): void {
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

		const { entry, targetY, stopY, rightX, externalId, selected } = this._data;

		if (
			entry.x === null ||
			entry.y === null ||
			targetY === null ||
			stopY === null ||
			rightX === null
		) {
			return null;
		}

		const left = entry.x;
		const right = rightX;
		const entryY = entry.y;
		const top = Math.min(targetY, entryY, stopY);
		const bottom = Math.max(targetY, entryY, stopY);

		// When selected, check anchor points first (higher priority)
		if (selected) {
			const anchorResult = this._hitTestAnchorPoints(
				x,
				y,
				entry,
				targetY,
				stopY,
				rightX,
				externalId
			);
			if (anchorResult) {
				return anchorResult;
			}
		}

		// Check if near any border or the entry line
		const nearTop = isNearHorizontalLine(
			x,
			y,
			left,
			right,
			top,
			HIT_TEST_TOLERANCE
		);
		const nearBottom = isNearHorizontalLine(
			x,
			y,
			left,
			right,
			bottom,
			HIT_TEST_TOLERANCE
		);
		const nearLeft = isNearVerticalLine(
			x,
			y,
			left,
			top,
			bottom,
			HIT_TEST_TOLERANCE
		);
		const nearRight = isNearVerticalLine(
			x,
			y,
			right,
			top,
			bottom,
			HIT_TEST_TOLERANCE
		);
		const nearEntry = isNearHorizontalLine(
			x,
			y,
			left,
			right,
			entryY,
			HIT_TEST_TOLERANCE
		);

		// Also check if inside the rectangle for easy selection
		const isInside = isInsideRect(x, y, left, right, top, bottom);

		if (
			nearTop ||
			nearBottom ||
			nearLeft ||
			nearRight ||
			nearEntry ||
			isInside
		) {
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
	 * Anchor indices:
	 * 0 = Entry (left, entry price) - moves time + price with OHLC snap
	 * 1 = Target (left, target price) - vertical only, free
	 * 2 = Stop (left, stop price) - vertical only, free
	 * 3 = Width (right, entry price) - horizontal only, free
	 */
	private _hitTestAnchorPoints(
		x: number,
		y: number,
		entry: LongPositionRendererPoint,
		targetY: Coordinate,
		stopY: Coordinate,
		rightX: Coordinate,
		externalId: string
	): PrimitiveHoveredItem | null {
		if (entry.x === null || entry.y === null) {
			return null;
		}

		// Anchor 0: Entry (left edge, entry price)
		const distToEntry = Math.sqrt(
			(x - entry.x) * (x - entry.x) + (y - entry.y) * (y - entry.y)
		);
		if (distToEntry <= ANCHOR_HIT_RADIUS) {
			return {
				cursorStyle: "grab",
				externalId: `${externalId}:anchor:0`,
				zOrder: "normal",
			};
		}

		// Anchor 1: Target (left edge, target price)
		const distToTarget = Math.sqrt(
			(x - entry.x) * (x - entry.x) + (y - targetY) * (y - targetY)
		);
		if (distToTarget <= ANCHOR_HIT_RADIUS) {
			return {
				cursorStyle: "ns-resize",
				externalId: `${externalId}:anchor:1`,
				zOrder: "normal",
			};
		}

		// Anchor 2: Stop (left edge, stop price)
		const distToStop = Math.sqrt(
			(x - entry.x) * (x - entry.x) + (y - stopY) * (y - stopY)
		);
		if (distToStop <= ANCHOR_HIT_RADIUS) {
			return {
				cursorStyle: "ns-resize",
				externalId: `${externalId}:anchor:2`,
				zOrder: "normal",
			};
		}

		// Anchor 3: Width (right edge, entry price)
		const distToWidth = Math.sqrt(
			(x - rightX) * (x - rightX) + (y - entry.y) * (y - entry.y)
		);
		if (distToWidth <= ANCHOR_HIT_RADIUS) {
			return {
				cursorStyle: "ew-resize",
				externalId: `${externalId}:anchor:3`,
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
			entry,
			targetY,
			stopY,
			rightX,
			entryPrice,
			targetPrice,
			stopPrice,
			lineWidth,
			profitBackgroundColor,
			riskBackgroundColor,
			entryLineColor,
			selected,
			anchorPointColor,
			targetLabelBackgroundColor,
			stopLabelBackgroundColor,
			labelTextColor,
		} = this._data;

		if (
			entry.x === null ||
			entry.y === null ||
			targetY === null ||
			stopY === null ||
			rightX === null
		) {
			return;
		}

		const ctx = scope.context;
		const horizontalPixelRatio = scope.horizontalPixelRatio;
		const verticalPixelRatio = scope.verticalPixelRatio;

		// Scale coordinates
		const leftScaled = Math.round(entry.x * horizontalPixelRatio);
		const rightScaled = Math.round(rightX * horizontalPixelRatio);
		const entryYScaled = Math.round(entry.y * verticalPixelRatio);
		const targetYScaled = Math.round(targetY * verticalPixelRatio);
		const stopYScaled = Math.round(stopY * verticalPixelRatio);

		const rectWidth = rightScaled - leftScaled;

		// Draw profit zone (from target to entry)
		const profitTop = Math.min(targetYScaled, entryYScaled);
		const profitBottom = Math.max(targetYScaled, entryYScaled);
		const profitHeight = profitBottom - profitTop;

		ctx.save();
		ctx.fillStyle = profitBackgroundColor;
		ctx.fillRect(leftScaled, profitTop, rectWidth, profitHeight);
		ctx.restore();

		// Draw risk zone (from entry to stop)
		const riskTop = Math.min(entryYScaled, stopYScaled);
		const riskBottom = Math.max(entryYScaled, stopYScaled);
		const riskHeight = riskBottom - riskTop;

		ctx.save();
		ctx.fillStyle = riskBackgroundColor;
		ctx.fillRect(leftScaled, riskTop, rectWidth, riskHeight);
		ctx.restore();

		// Draw entry line (dashed)
		ctx.save();
		ctx.lineWidth = lineWidth * horizontalPixelRatio;
		ctx.strokeStyle = entryLineColor;
		setLineStyle(ctx, LineStyle.Dashed);
		ctx.beginPath();
		ctx.moveTo(leftScaled, entryYScaled);
		ctx.lineTo(rightScaled, entryYScaled);
		ctx.stroke();
		ctx.restore();

		// Calculate percentages and risk/reward based on direction
		const direction = this._data.direction;
		let targetDelta: number;
		let stopDelta: number;
		let targetPct: number;
		let stopPct: number;

		if (direction === "long") {
			// Long: profit when price goes up (target > entry), loss when price goes down (stop < entry)
			targetDelta = targetPrice - entryPrice;
			stopDelta = entryPrice - stopPrice;
			targetPct = (targetDelta / entryPrice) * 100;
			stopPct = (stopDelta / entryPrice) * 100;
		} else {
			// Short: profit when price goes down (target < entry), loss when price goes up (stop > entry)
			targetDelta = entryPrice - targetPrice;
			stopDelta = stopPrice - entryPrice;
			targetPct = (targetDelta / entryPrice) * 100;
			stopPct = (stopDelta / entryPrice) * 100;
		}

		const riskRewardRatio = stopDelta !== 0 ? targetDelta / stopDelta : 0;

		// Draw labels
		// For long: target is above entry, stop is below
		// For short: target is below entry, stop is above
		const targetText = `Target: ${targetDelta.toFixed(2)} (${targetPct.toFixed(
			2
		)}%)`;
		const stopText = `Stop: ${stopDelta.toFixed(2)} (${stopPct.toFixed(2)}%)`;

		if (direction === "long") {
			// Long: target label above targetY, stop label below stopY
			this._drawLabel(
				scope,
				targetText,
				leftScaled + rectWidth / 2,
				targetYScaled - 8 * verticalPixelRatio,
				targetLabelBackgroundColor,
				labelTextColor,
				"bottom"
			);

			this._drawLabel(
				scope,
				stopText,
				leftScaled + rectWidth / 2,
				stopYScaled + 8 * verticalPixelRatio,
				stopLabelBackgroundColor,
				labelTextColor,
				"top"
			);
		} else {
			// Short: target label below targetY (target is below entry), stop label above stopY (stop is above entry)
			this._drawLabel(
				scope,
				targetText,
				leftScaled + rectWidth / 2,
				targetYScaled + 8 * verticalPixelRatio,
				targetLabelBackgroundColor,
				labelTextColor,
				"top"
			);

			this._drawLabel(
				scope,
				stopText,
				leftScaled + rectWidth / 2,
				stopYScaled - 8 * verticalPixelRatio,
				stopLabelBackgroundColor,
				labelTextColor,
				"bottom"
			);
		}

		// Risk/Reward label (center, near entry line)
		const rrText = `Risk/Reward: ${riskRewardRatio.toFixed(2)}`;
		this._drawLabel(
			scope,
			rrText,
			leftScaled + rectWidth / 2,
			entryYScaled,
			"#ffffff",
			"#000000",
			"middle"
		);

		// Draw anchor point indicators when selected
		if (selected) {
			// Anchor 0: Entry (left, entry price)
			this._drawAnchorPoint(
				ctx,
				leftScaled,
				entryYScaled,
				anchorPointColor,
				horizontalPixelRatio
			);

			// Anchor 1: Target (left, target price)
			this._drawAnchorPoint(
				ctx,
				leftScaled,
				targetYScaled,
				anchorPointColor,
				horizontalPixelRatio
			);

			// Anchor 2: Stop (left, stop price)
			this._drawAnchorPoint(
				ctx,
				leftScaled,
				stopYScaled,
				anchorPointColor,
				horizontalPixelRatio
			);

			// Anchor 3: Width (right, entry price)
			this._drawAnchorPoint(
				ctx,
				rightScaled,
				entryYScaled,
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
		textColor: string,
		verticalAlign: "top" | "middle" | "bottom"
	): void {
		const ctx = scope.context;
		const padding = 4 * scope.horizontalPixelRatio;
		const fontSize = 11 * scope.verticalPixelRatio;

		ctx.font = `${fontSize}px Arial`;
		const textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = fontSize;
		const boxWidth = textWidth + padding * 2;
		const boxHeight = textHeight + padding;

		// Center the box horizontally on x
		const boxX = x - boxWidth / 2;
		let boxY: number;
		if (verticalAlign === "top") {
			boxY = y;
		} else if (verticalAlign === "bottom") {
			boxY = y - boxHeight;
		} else {
			boxY = y - boxHeight / 2;
		}

		// Draw background
		ctx.fillStyle = backgroundColor;
		ctx.beginPath();
		ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 3);
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
