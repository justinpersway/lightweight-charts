import { IChartApiBase } from "../../api/ichart-api";
import { ISeriesApi } from "../../api/iseries-api";
import {
	ISeriesPrimitive,
	SeriesAttachedParameter,
} from "../../api/iseries-primitive-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import {
	IPrimitivePaneView,
	PrimitiveHoveredItem,
} from "../../model/ipane-primitive";
import { AutoscaleInfo, SeriesType } from "../../model/series-options";
import { Logical } from "../../model/time-data";

import { rectangleOptionsDefaults, RectangleOptions } from "./options";
import { RectanglePaneView } from "./pane-view";
import { RectangleRendererData, RectangleRendererPoint } from "./renderer";

/**
 * A point on the rectangle with time and price coordinates.
 */
export interface RectanglePoint {
	/**
	 * Time value (can be a timestamp or other time format based on the chart's time scale).
	 */
	time: unknown;

	/**
	 * Price value.
	 */
	price: number;
}

function mergeOptionsWithDefaults(
	options: DeepPartial<RectangleOptions>
): RectangleOptions {
	return {
		...rectangleOptionsDefaults,
		...options,
	};
}

/**
 * A rectangle primitive that draws a rectangle between two anchor points (opposite corners).
 * The rectangle can optionally extend its horizontal edges to the chart boundaries.
 */
export class Rectangle<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _p1: RectanglePoint;
	private _p2: RectanglePoint;
	private _options: RectangleOptions;

	private _paneView: RectanglePaneView;

	public constructor(
		p1: RectanglePoint,
		p2: RectanglePoint,
		options?: DeepPartial<RectangleOptions>
	) {
		this._p1 = p1;
		this._p2 = p2;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new RectanglePaneView();
	}

	public attached(param: SeriesAttachedParameter<HorzScaleItem>): void {
		this._chart = param.chart;
		this._series = param.series;
		this._requestUpdate = param.requestUpdate;
		this.requestUpdate();
	}

	public detached(): void {
		this._chart = null;
		this._series = null;
		this._requestUpdate = undefined;
	}

	public requestUpdate(): void {
		if (this._requestUpdate) {
			this._requestUpdate();
		}
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return [this._paneView];
	}

	public updateAllViews(): void {
		const data = this._calculateRendererData();
		if (data) {
			this._paneView.update(data);
		}
	}

	public hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		return this._paneView.renderer()?.hitTest(x, y) ?? null;
	}

	public autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		// Get the indices of both points
		const p1Index = this._getPointLogicalIndex(this._p1);
		const p2Index = this._getPointLogicalIndex(this._p2);

		if (p1Index === null || p2Index === null) {
			return null;
		}

		const minIndex = Math.min(p1Index, p2Index);
		const maxIndex = Math.max(p1Index, p2Index);

		// Check if the rectangle is visible in the current range
		if (endTimePoint < minIndex || startTimePoint > maxIndex) {
			return null;
		}

		const minPrice = Math.min(this._p1.price, this._p2.price);
		const maxPrice = Math.max(this._p1.price, this._p2.price);

		return {
			priceRange: {
				minValue: minPrice,
				maxValue: maxPrice,
			},
		};
	}

	/**
	 * Apply new options to the rectangle.
	 */
	public applyOptions(options: DeepPartial<RectangleOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<RectangleOptions> {
		return this._options;
	}

	/**
	 * Update the anchor points.
	 */
	public setPoints(p1: RectanglePoint, p2: RectanglePoint): void {
		this._p1 = p1;
		this._p2 = p2;
		this.requestUpdate();
	}

	/**
	 * Get the first anchor point.
	 */
	public p1(): RectanglePoint {
		return this._p1;
	}

	/**
	 * Get the second anchor point.
	 */
	public p2(): RectanglePoint {
		return this._p2;
	}

	private _getPointLogicalIndex(point: RectanglePoint): number | null {
		if (!this._chart) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const coordinate = timeScale.timeToCoordinate(point.time as HorzScaleItem);
		if (coordinate === null) {
			return null;
		}

		return timeScale.coordinateToLogical(coordinate);
	}

	private _calculateRendererData(): RectangleRendererData | null {
		if (!this._chart || !this._series) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const series = this._series;

		// Convert anchor points to coordinates
		const x1 = timeScale.timeToCoordinate(this._p1.time as HorzScaleItem);
		const y1 = series.priceToCoordinate(this._p1.price);
		const x2 = timeScale.timeToCoordinate(this._p2.time as HorzScaleItem);
		const y2 = series.priceToCoordinate(this._p2.price);

		const p1: RectangleRendererPoint = { x: x1, y: y1 };
		const p2: RectangleRendererPoint = { x: x2, y: y2 };

		// Calculate chart dimensions
		const chartWidth = timeScale.width();
		const chartHeight = series.getPane().getHeight();

		// Calculate drawing bounds based on extend mode
		let drawLeft: number;
		let drawRight: number;
		let drawTop: number;
		let drawBottom: number;

		if (x1 === null || y1 === null || x2 === null || y2 === null) {
			return null;
		}

		// Calculate base bounds
		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);

		// Apply extension mode
		switch (this._options.extendMode) {
			case "left":
				drawLeft = 0;
				drawRight = maxX;
				break;
			case "right":
				drawLeft = minX;
				drawRight = chartWidth;
				break;
			case "both":
				drawLeft = 0;
				drawRight = chartWidth;
				break;
			case "none":
			default:
				drawLeft = minX;
				drawRight = maxX;
				break;
		}

		drawTop = minY;
		drawBottom = maxY;

		return {
			p1,
			p2,
			drawLeft,
			drawRight,
			drawTop,
			drawBottom,
			lineColor: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			backgroundColor: this._options.backgroundColor,
			labelText: this._options.labelText,
			showLabel: this._options.showLabel,
			labelBackgroundColor: this._options.labelBackgroundColor,
			labelTextColor: this._options.labelTextColor,
			extendMode: this._options.extendMode,
			externalId: this._options.externalId,
			chartWidth,
			chartHeight,
			selected: this._options.selected,
			anchorPointColor: this._options.anchorPointColor,
			showMiddleLine: this._options.showMiddleLine,
			middleLineColor: this._options.middleLineColor,
			middleLineStyle: this._options.middleLineStyle,
			middleLineWidth: this._options.middleLineWidth,
		};
	}
}

/**
 * Creates a rectangle primitive.
 *
 * @param p1 - The first anchor point (one corner) with time and price.
 * @param p2 - The second anchor point (opposite corner) with time and price.
 * @param options - Optional configuration for the rectangle.
 * @returns A new Rectangle instance.
 */
export function createRectanglePrimitive<HorzScaleItem = unknown>(
	p1: RectanglePoint,
	p2: RectanglePoint,
	options?: DeepPartial<RectangleOptions>
): Rectangle<HorzScaleItem> {
	return new Rectangle<HorzScaleItem>(p1, p2, options);
}
