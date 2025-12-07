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

export interface VerticalLineRendererData {
	x: Coordinate | null;
	timeLabel: string;
	lineColor: string;
	lineWidth: number;
	lineStyle: LineStyle;
	showTimeLabel: boolean;
	labelBackgroundColor: string;
	labelTextColor: string;
	externalId: string;
	chartWidth: number;
	chartHeight: number;
	selected: boolean;
	/** Color of the anchor point */
	anchorPointColor: string;
	/** Distance from bottom edge for anchor point */
	anchorOffsetFromBottom: number;
}

const HIT_TEST_TOLERANCE = 6;
/**
 * Anchor point hit test radius in pixels - size of clickable area around anchor points
 * Slightly larger than visual radius (5px) for easier clicking
 */
const ANCHOR_HIT_RADIUS = 8;
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 4;
const LABEL_FONT_SIZE = 11;
const LABEL_BOTTOM_MARGIN = 4;

export class VerticalLineRenderer implements IPrimitivePaneRenderer {
	private _data: VerticalLineRendererData | null = null;

	public setData(data: VerticalLineRendererData): void {
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
		if (!this._data || this._data.x === null) {
			return null;
		}

		const {
			x: lineX,
			externalId,
			chartHeight,
			selected,
			anchorOffsetFromBottom,
		} = this._data;

		// When selected, check anchor point first (higher priority than line)
		if (selected) {
			const anchorY = chartHeight - anchorOffsetFromBottom;
			const anchorResult = this._hitTestAnchorPoint(
				x,
				y,
				lineX,
				anchorY,
				externalId
			);
			if (anchorResult) {
				return anchorResult;
			}
		}

		// Check if cursor is near the vertical line
		const distance = Math.abs(x - lineX);
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
		if (!this._data || this._data.x === null) {
			return;
		}

		const {
			x,
			lineColor,
			lineWidth,
			lineStyle,
			chartHeight,
			showTimeLabel,
			timeLabel,
			labelBackgroundColor,
			labelTextColor,
			selected,
			anchorPointColor,
			anchorOffsetFromBottom,
		} = this._data;

		const ctx = scope.context;
		const hRatio = scope.horizontalPixelRatio;
		const vRatio = scope.verticalPixelRatio;

		const scaledX = Math.round(x * hRatio);
		const scaledTop = 0;
		const scaledBottom = Math.round(chartHeight * vRatio);

		// Draw the vertical line
		ctx.save();
		ctx.lineWidth = lineWidth * hRatio;
		ctx.strokeStyle = lineColor;
		setLineStyle(ctx, lineStyle);

		ctx.beginPath();
		ctx.moveTo(scaledX, scaledTop);
		ctx.lineTo(scaledX, scaledBottom);
		ctx.stroke();
		ctx.restore();

		// Draw the time label at the bottom
		if (showTimeLabel && timeLabel) {
			this._drawTimeLabel(
				ctx,
				scaledX,
				scaledBottom,
				timeLabel,
				labelBackgroundColor,
				labelTextColor,
				lineColor,
				hRatio,
				vRatio
			);
		}

		// Draw anchor point indicator when selected
		if (selected) {
			const anchorY = chartHeight - anchorOffsetFromBottom;
			const anchorYScaled = Math.round(anchorY * vRatio);
			this._drawAnchorPoint(
				ctx,
				scaledX,
				anchorYScaled,
				anchorPointColor,
				hRatio
			);
		}
	}

	private _drawTimeLabel(
		ctx: CanvasRenderingContext2D,
		x: number,
		bottom: number,
		label: string,
		bgColor: string,
		textColor: string,
		borderColor: string,
		hRatio: number,
		vRatio: number
	): void {
		const fontSize = Math.round(LABEL_FONT_SIZE * vRatio);
		ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

		const textMetrics = ctx.measureText(label);
		const textWidth = textMetrics.width;
		const textHeight = fontSize;

		const paddingX = LABEL_PADDING_X * hRatio;
		const paddingY = LABEL_PADDING_Y * vRatio;
		const bottomMargin = LABEL_BOTTOM_MARGIN * vRatio;

		const boxWidth = textWidth + paddingX * 2;
		const boxHeight = textHeight + paddingY * 2;
		const boxX = x - boxWidth / 2;
		const boxY = bottom - boxHeight - bottomMargin;

		// Draw background with border color
		ctx.save();
		ctx.fillStyle = borderColor;
		ctx.beginPath();
		ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 3 * hRatio);
		ctx.fill();

		// Draw inner background
		const borderWidth = 1 * hRatio;
		ctx.fillStyle = bgColor;
		ctx.beginPath();
		ctx.roundRect(
			boxX + borderWidth,
			boxY + borderWidth,
			boxWidth - borderWidth * 2,
			boxHeight - borderWidth * 2,
			2 * hRatio
		);
		ctx.fill();

		// Draw text
		ctx.fillStyle = textColor;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, x, boxY + boxHeight / 2);
		ctx.restore();
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
