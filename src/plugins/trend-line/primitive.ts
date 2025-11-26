import { IChartApiBase } from "../../api/ichart-api";
import { ISeriesApi } from "../../api/iseries-api";
import {
	ISeriesPrimitive,
	SeriesAttachedParameter,
} from "../../api/iseries-primitive-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { Coordinate } from "../../model/coordinate";
import {
	IPrimitivePaneView,
	PrimitiveHoveredItem,
} from "../../model/ipane-primitive";
import { AutoscaleInfo, SeriesType } from "../../model/series-options";
import { Logical } from "../../model/time-data";

import { trendLineOptionsDefaults, TrendLineOptions } from "./options";
import { TrendLinePaneView } from "./pane-view";
import { TrendLineRendererData, TrendLineRendererPoint } from "./renderer";

/**
 * A point on the trend line with time and price coordinates.
 */
export interface TrendLinePoint {
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
	options: DeepPartial<TrendLineOptions>
): TrendLineOptions {
	return {
		...trendLineOptionsDefaults,
		...options,
	};
}

/**
 * A trend line primitive that draws a line between two anchor points.
 * The line can optionally extend to the edges of the chart.
 */
export class TrendLine<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _p1: TrendLinePoint;
	private _p2: TrendLinePoint;
	private _options: TrendLineOptions;

	private _paneView: TrendLinePaneView;

	public constructor(
		p1: TrendLinePoint,
		p2: TrendLinePoint,
		options?: DeepPartial<TrendLineOptions>
	) {
		this._p1 = p1;
		this._p2 = p2;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new TrendLinePaneView();
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

		// Check if the trend line is visible in the current range
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
	 * Apply new options to the trend line.
	 */
	public applyOptions(options: DeepPartial<TrendLineOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<TrendLineOptions> {
		return this._options;
	}

	/**
	 * Update the anchor points.
	 */
	public setPoints(p1: TrendLinePoint, p2: TrendLinePoint): void {
		this._p1 = p1;
		this._p2 = p2;
		this.requestUpdate();
	}

	/**
	 * Get the first anchor point.
	 */
	public p1(): TrendLinePoint {
		return this._p1;
	}

	/**
	 * Get the second anchor point.
	 */
	public p2(): TrendLinePoint {
		return this._p2;
	}

	private _getPointLogicalIndex(point: TrendLinePoint): number | null {
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

	private _calculateRendererData(): TrendLineRendererData | null {
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

		const p1: TrendLineRendererPoint = { x: x1, y: y1 };
		const p2: TrendLineRendererPoint = { x: x2, y: y2 };

		// Calculate chart dimensions
		const chartWidth = timeScale.width();
		const chartHeight = series.getPane().getHeight();

		// Calculate extended line endpoints if needed
		let extendedStart: TrendLineRendererPoint = { x: x1, y: y1 };
		let extendedEnd: TrendLineRendererPoint = { x: x2, y: y2 };

		if (
			this._options.extendToEdges &&
			x1 !== null &&
			y1 !== null &&
			x2 !== null &&
			y2 !== null
		) {
			const extended = this._calculateExtendedLine(
				x1,
				y1,
				x2,
				y2,
				chartWidth,
				chartHeight
			);
			extendedStart = {
				x: extended.x1 as Coordinate,
				y: extended.y1 as Coordinate,
			};
			extendedEnd = {
				x: extended.x2 as Coordinate,
				y: extended.y2 as Coordinate,
			};
		}

		const priceFormatter = series.priceFormatter();

		return {
			p1,
			p2,
			extendedStart,
			extendedEnd,
			text1: priceFormatter.format(this._p1.price),
			text2: priceFormatter.format(this._p2.price),
			lineColor: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			showLabels: this._options.showLabels,
			labelBackgroundColor: this._options.labelBackgroundColor,
			labelTextColor: this._options.labelTextColor,
			extendToEdges: this._options.extendToEdges,
			externalId: this._options.externalId,
			chartWidth,
			chartHeight,
			selected: this._options.selected,
			anchorPointColor: this._options.anchorPointColor,
		};
	}

	/**
	 * Calculate the line extended from p1 through p2 to the chart edge.
	 * The line starts at p1 and extends in the direction of p2 to the edge.
	 * This creates a "ray" behavior rather than extending in both directions.
	 */
	private _calculateExtendedLine(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		chartWidth: number,
		chartHeight: number
	): { x1: number; y1: number; x2: number; y2: number } {
		const dx = x2 - x1;
		const dy = y2 - y1;

		// Handle vertical line (infinite slope)
		if (Math.abs(dx) < 0.0001) {
			// Extend in the direction from p1 to p2
			if (dy > 0) {
				// Going down (y increases downward in canvas)
				return { x1, y1, x2: x1, y2: chartHeight };
			} else {
				// Going up
				return { x1, y1, x2: x1, y2: 0 };
			}
		}

		// Handle horizontal line (zero slope)
		if (Math.abs(dy) < 0.0001) {
			// Extend in the direction from p1 to p2
			if (dx > 0) {
				// Going right
				return { x1, y1, x2: chartWidth, y2: y1 };
			} else {
				// Going left
				return { x1, y1, x2: 0, y2: y1 };
			}
		}

		const slope = dy / dx;
		const intercept = y1 - slope * x1;

		// Find intersections with chart boundaries
		// Calculate y at x=0 and x=chartWidth
		const yAtLeft = intercept;
		const yAtRight = slope * chartWidth + intercept;

		// Calculate x at y=0 and y=chartHeight
		const xAtTop = -intercept / slope;
		const xAtBottom = (chartHeight - intercept) / slope;

		// Collect all valid intersection points in the direction from p1 to p2
		const intersections: Array<{ x: number; y: number }> = [];

		// Left edge (x = 0)
		if (yAtLeft >= 0 && yAtLeft <= chartHeight) {
			intersections.push({ x: 0, y: yAtLeft });
		}

		// Right edge (x = chartWidth)
		if (yAtRight >= 0 && yAtRight <= chartHeight) {
			intersections.push({ x: chartWidth, y: yAtRight });
		}

		// Top edge (y = 0)
		if (xAtTop >= 0 && xAtTop <= chartWidth) {
			intersections.push({ x: xAtTop, y: 0 });
		}

		// Bottom edge (y = chartHeight)
		if (xAtBottom >= 0 && xAtBottom <= chartWidth) {
			intersections.push({ x: xAtBottom, y: chartHeight });
		}

		// Filter to only intersections in the direction from p1 to p2
		// A point is in the right direction if (point - p1) has the same sign as (p2 - p1)
		const directionalIntersections = intersections.filter((p) => {
			const toPx = p.x - x1;
			const toPy = p.y - y1;
			// Check if the intersection is in the same direction as p2 from p1
			// Using dot product: if positive, same direction
			const dotProduct = toPx * dx + toPy * dy;
			return dotProduct > 0;
		});

		// Find the intersection point that is furthest from p1 in the direction of p2
		let furthestPoint = { x: x2, y: y2 };
		let maxDistance = 0;

		for (const p of directionalIntersections) {
			const distance = Math.sqrt(
				(p.x - x1) * (p.x - x1) + (p.y - y1) * (p.y - y1)
			);
			if (distance > maxDistance) {
				maxDistance = distance;
				furthestPoint = p;
			}
		}

		// Return p1 as start, and the furthest intersection as end
		return { x1, y1, x2: furthestPoint.x, y2: furthestPoint.y };
	}
}

/**
 * Creates a trend line primitive.
 *
 * @param p1 - The first anchor point with time and price.
 * @param p2 - The second anchor point with time and price.
 * @param options - Optional configuration for the trend line.
 * @returns A new TrendLine instance.
 */
export function createTrendLine<HorzScaleItem = unknown>(
	p1: TrendLinePoint,
	p2: TrendLinePoint,
	options?: DeepPartial<TrendLineOptions>
): TrendLine<HorzScaleItem> {
	return new TrendLine<HorzScaleItem>(p1, p2, options);
}
