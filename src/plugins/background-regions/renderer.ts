import {
	BitmapCoordinatesRenderingScope,
	CanvasRenderingTarget2D,
} from "fancy-canvas";

import { Coordinate } from "../../model/coordinate";
import { IPrimitivePaneRenderer } from "../../model/ipane-primitive";

export interface BackgroundRegionRendererData {
	/** X coordinate for the center of this bar */
	x: Coordinate;
	/** Color for this region */
	color: string;
	/** Width of one bar in pixels */
	barWidth: number;
}

export interface BackgroundRegionsRendererData {
	/** Array of region data to render */
	regions: BackgroundRegionRendererData[];
	/** Chart height for drawing full-height backgrounds */
	chartHeight: number;
}

export class BackgroundRegionsRenderer implements IPrimitivePaneRenderer {
	private _data: BackgroundRegionsRendererData | null = null;

	public setData(data: BackgroundRegionsRendererData): void {
		this._data = data;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useBitmapCoordinateSpace(
			(scope: BitmapCoordinatesRenderingScope) => {
				this._drawImpl(scope);
			}
		);
	}

	public hitTest(): null {
		// Background regions are not interactive
		return null;
	}

	private _drawImpl(scope: BitmapCoordinatesRenderingScope): void {
		if (!this._data || this._data.regions.length === 0) {
			return;
		}

		const ctx = scope.context;
		const horizontalPixelRatio = scope.horizontalPixelRatio;
		const verticalPixelRatio = scope.verticalPixelRatio;

		const chartHeightScaled = Math.round(
			this._data.chartHeight * verticalPixelRatio
		);

		// Group consecutive regions by color for batch drawing
		let currentColor: string | null = null;
		let batchStartX: number | null = null;
		let batchEndX: number | null = null;

		const drawBatch = (): void => {
			if (currentColor !== null && batchStartX !== null && batchEndX !== null) {
				ctx.fillStyle = currentColor;
				ctx.fillRect(
					batchStartX,
					0,
					batchEndX - batchStartX,
					chartHeightScaled
				);
			}
		};

		for (const region of this._data.regions) {
			const halfBarWidth = (region.barWidth * horizontalPixelRatio) / 2;
			const leftX = Math.round(region.x * horizontalPixelRatio - halfBarWidth);
			const rightX = Math.round(region.x * horizontalPixelRatio + halfBarWidth);

			// Only batch if same color AND regions are actually adjacent (within 1.5 bar widths)
			// This prevents drawing a single rectangle across gaps where noise candles exist
			const barWidthScaled = region.barWidth * horizontalPixelRatio;
			const isAdjacent =
				batchEndX !== null && leftX <= batchEndX + barWidthScaled * 0.5;

			if (region.color === currentColor && isAdjacent) {
				// Extend current batch
				batchEndX = rightX;
			} else {
				// Draw previous batch and start new one
				drawBatch();
				currentColor = region.color;
				batchStartX = leftX;
				batchEndX = rightX;
			}
		}

		// Draw final batch
		drawBatch();
	}
}
