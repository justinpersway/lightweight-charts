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

export interface HorizontalRayRendererPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export interface HorizontalRayRendererData {
	anchor: HorizontalRayRendererPoint;
	endPoint: HorizontalRayRendererPoint;
	priceLabel: string;
	lineColor: string;
	lineWidth: number;
	lineStyle: LineStyle;
	showPriceLabel: boolean;
	labelBackgroundColor: string;
	labelTextColor: string;
	externalId: string;
	chartWidth: number;
	chartHeight: number;
	selected: boolean;
	anchorPointColor: string;
}

const HIT_TEST_TOLERANCE = 6;

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
		return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
	}

	let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
	t = Math.max(0, Math.min(1, t));

	const closestX = x1 + t * dx;
	const closestY = y1 + t * dy;

	return Math.sqrt(
		(px - closestX) * (px - closestX) + (py - closestY) * (py - closestY)
	);
}

export class HorizontalRayRenderer implements IPrimitivePaneRenderer {
	private _data: HorizontalRayRendererData | null = null;

	public setData(data: HorizontalRayRendererData): void {
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

		const { anchor, endPoint, externalId } = this._data;
		if (
			anchor.x === null ||
			anchor.y === null ||
			endPoint.x === null ||
			endPoint.y === null
		) {
			return null;
		}

		const distance = distanceToLineSegment(
			x,
			y,
			anchor.x,
			anchor.y,
			endPoint.x,
			endPoint.y
		);

		if (distance <= HIT_TEST_TOLERANCE) {
			return {
				cursorStyle: "pointer",
				externalId,
				zOrder: "normal",
			};
		}

		// Allow selecting by clicking directly on the anchor point.
		const anchorDistance = Math.sqrt(
			(x - anchor.x) * (x - anchor.x) + (y - anchor.y) * (y - anchor.y)
		);
		if (anchorDistance <= HIT_TEST_TOLERANCE) {
			return {
				cursorStyle: "pointer",
				externalId,
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
			anchor,
			endPoint,
			lineColor,
			lineWidth,
			lineStyle,
			selected,
			anchorPointColor,
		} = this._data;

		if (
			anchor.x === null ||
			anchor.y === null ||
			endPoint.x === null ||
			endPoint.y === null
		) {
			return;
		}

		const ctx = scope.context;
		const hRatio = scope.horizontalPixelRatio;
		const vRatio = scope.verticalPixelRatio;

		const x1 = Math.round(anchor.x * hRatio);
		const y1 = Math.round(anchor.y * vRatio);
		const x2 = Math.round(endPoint.x * hRatio);
		const y2 = Math.round(endPoint.y * vRatio);

		ctx.save();
		ctx.lineWidth = lineWidth * hRatio;
		ctx.strokeStyle = lineColor;
		setLineStyle(ctx, lineStyle);

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.restore();

		if (selected) {
			this._drawAnchorPoint(ctx, x1, y1, anchorPointColor, hRatio);
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

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = color;
		ctx.lineWidth = borderWidth;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(x, y, radius - borderWidth / 2, 0, 2 * Math.PI);
		ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
		ctx.fill();
	}
}
