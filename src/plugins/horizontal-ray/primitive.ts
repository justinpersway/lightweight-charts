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

import { HorizontalRayOptions, horizontalRayOptionsDefaults } from "./options";
import { HorizontalRayPaneView } from "./pane-view";
import {
	HorizontalRayRendererData,
	HorizontalRayRendererPoint,
} from "./renderer";

/**
 * Anchor point for the horizontal ray.
 */
export interface HorizontalRayAnchorPoint {
	/**
	 * Time value (timestamp or other scale item).
	 */
	time: unknown;

	/**
	 * Price value at the anchor.
	 */
	price: number;
}

function mergeOptionsWithDefaults(
	options: DeepPartial<HorizontalRayOptions>
): HorizontalRayOptions {
	return {
		...horizontalRayOptionsDefaults,
		...options,
	};
}

/**
 * HorizontalRay draws a horizontal line from the anchor point to the right edge
 * of the chart.
 */
export class HorizontalRay<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _anchor: HorizontalRayAnchorPoint;
	private _options: HorizontalRayOptions;

	private readonly _paneView: HorizontalRayPaneView;

	public constructor(
		anchor: HorizontalRayAnchorPoint,
		options?: DeepPartial<HorizontalRayOptions>
	) {
		this._anchor = anchor;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new HorizontalRayPaneView();
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
		return this._paneView.renderer().hitTest(x, y);
	}

	public autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		const anchorIndex = this._getAnchorLogicalIndex();
		if (anchorIndex === null) {
			return null;
		}

		if (endTimePoint < anchorIndex) {
			return null;
		}

		return {
			priceRange: {
				minValue: this._anchor.price,
				maxValue: this._anchor.price,
			},
		};
	}

	/**
	 * Apply new options to the horizontal ray.
	 */
	public applyOptions(options: DeepPartial<HorizontalRayOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<HorizontalRayOptions> {
		return this._options;
	}

	/**
	 * Update the anchor point.
	 */
	public setPoint(anchor: HorizontalRayAnchorPoint): void {
		this._anchor = anchor;
		this.requestUpdate();
	}

	/**
	 * Get the current anchor point.
	 */
	public point(): HorizontalRayAnchorPoint {
		return this._anchor;
	}

	private _getAnchorLogicalIndex(): number | null {
		if (!this._chart) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const coordinate = timeScale.timeToCoordinate(
			this._anchor.time as HorzScaleItem
		);
		if (coordinate === null) {
			return null;
		}

		return timeScale.coordinateToLogical(coordinate);
	}

	private _calculateRendererData(): HorizontalRayRendererData | null {
		if (!this._chart || !this._series) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const series = this._series;

		const anchorX = timeScale.timeToCoordinate(
			this._anchor.time as HorzScaleItem
		);
		const anchorY = series.priceToCoordinate(this._anchor.price);

		const anchorPoint: HorizontalRayRendererPoint = {
			x: anchorX,
			y: anchorY,
		};

		const chartWidth = timeScale.width();
		const endPoint: HorizontalRayRendererPoint =
			anchorX === null || anchorY === null
				? { x: null, y: null }
				: {
						x: chartWidth as Coordinate,
						y: anchorY as Coordinate,
				  };

		const priceFormatter = series.priceFormatter();

		return {
			anchor: anchorPoint,
			endPoint,
			priceLabel: priceFormatter.format(this._anchor.price),
			lineColor: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			showPriceLabel: this._options.showPriceLabel,
			labelBackgroundColor: this._options.labelBackgroundColor,
			labelTextColor: this._options.labelTextColor,
			externalId: this._options.externalId,
			chartWidth,
			chartHeight: series.getPane().getHeight(),
			selected: this._options.selected,
			anchorPointColor: this._options.anchorPointColor,
		};
	}
}

/**
 * Factory helper to create a HorizontalRay instance.
 */
export function createHorizontalRay<HorzScaleItem = unknown>(
	anchor: HorizontalRayAnchorPoint,
	options?: DeepPartial<HorizontalRayOptions>
): HorizontalRay<HorzScaleItem> {
	return new HorizontalRay<HorzScaleItem>(anchor, options);
}
