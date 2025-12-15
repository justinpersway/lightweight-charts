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

export interface HorizontalLineRendererData {
	/** Y coordinate of the line */
	y: Coordinate | null;
	/** Line color */
	lineColor: string;
	/** Line width */
	lineWidth: number;
	/** Line style */
	lineStyle: LineStyle;
	/** External ID for hit test */
	externalId: string;
	/** Chart width */
	chartWidth: number;
	/** Whether the line is selected */
	selected: boolean;
	/** Color of the anchor point */
	anchorPointColor: string;
	/** Distance from right edge for anchor point */
	anchorOffsetFromRight: number;
}

const HIT_TEST_TOLERANCE = 6;

/**
 * Anchor point hit test radius in pixels - size of clickable area around anchor points
 * Slightly larger than visual radius (5px) for easier clicking
 */
const ANCHOR_HIT_RADIUS = 8;

export class HorizontalLineRenderer implements IPrimitivePaneRenderer {
	private _data: HorizontalLineRendererData | null = null;

	public setData(data: HorizontalLineRendererData): void {
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
			y: lineY,
			externalId,
			chartWidth,
			selected,
			anchorOffsetFromRight,
		} = this._data;

		if (lineY === null) {
			return null;
		}

		// When selected, check anchor point first (higher priority than line)
		if (selected) {
			const anchorX = chartWidth - anchorOffsetFromRight;
			const anchorResult = this._hitTestAnchorPoint(
				x,
				y,
				anchorX,
				lineY,
				externalId
			);
			if (anchorResult) {
				return anchorResult;
			}
		}

		// Check if cursor is near the horizontal line
		const distance = Math.abs(y - lineY);
		if (distance <= HIT_TEST_TOLERANCE) {
			return {
				cursorStyle: "pointer",
				externalId,
				zOrder: "normal",
			};
		}

		return null;
	}

	/**
	 * Test if the given point hits the anchor point.
	 * Returns a PrimitiveHoveredItem with anchor index encoded in externalId if hit.
	 */
	private _hitTestAnchorPoint(
		x: number,
		y: number,
		anchorX: number,
		anchorY: number,
		externalId: string
	): PrimitiveHoveredItem | null {
		const dist = Math.sqrt(
			(x - anchorX) * (x - anchorX) + (y - anchorY) * (y - anchorY)
		);
		if (dist <= ANCHOR_HIT_RADIUS) {
			return {
				cursorStyle: "grab",
				externalId: `${externalId}:anchor:0`,
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
			y: lineY,
			lineColor,
			lineWidth,
			lineStyle,
			chartWidth,
			selected,
			anchorPointColor,
			anchorOffsetFromRight,
		} = this._data;

		if (lineY === null) {
			return;
		}

		const ctx = scope.context;
		const hRatio = scope.horizontalPixelRatio;
		const vRatio = scope.verticalPixelRatio;

		const yScaled = Math.round(lineY * vRatio);
		const x1Scaled = 0;
		const x2Scaled = Math.round(chartWidth * hRatio);

		// Draw the horizontal line
		ctx.save();
		ctx.lineWidth = lineWidth * hRatio;
		ctx.strokeStyle = lineColor;
		setLineStyle(ctx, lineStyle);

		ctx.beginPath();
		ctx.moveTo(x1Scaled, yScaled);
		ctx.lineTo(x2Scaled, yScaled);
		ctx.stroke();
		ctx.restore();

		// Draw anchor point indicator when selected
		if (selected) {
			const anchorX = chartWidth - anchorOffsetFromRight;
			const anchorXScaled = Math.round(anchorX * hRatio);
			this._drawAnchorPoint(
				ctx,
				anchorXScaled,
				yScaled,
				anchorPointColor,
				hRatio
			);
		}
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

