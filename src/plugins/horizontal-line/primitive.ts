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

import {
	HorizontalLineOptions,
	horizontalLineOptionsDefaults,
} from "./options";
import { HorizontalLinePaneView } from "./pane-view";
import { HorizontalLineRendererData } from "./renderer";

function mergeOptionsWithDefaults(
	options: DeepPartial<HorizontalLineOptions>
): HorizontalLineOptions {
	return {
		...horizontalLineOptionsDefaults,
		...options,
	};
}

/**
 * HorizontalLine draws a horizontal line across the entire chart width at a given price.
 * When selected, shows a draggable anchor point at a fixed offset from the right edge.
 */
export class HorizontalLine<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _price: number;
	private _options: HorizontalLineOptions;

	private readonly _paneView: HorizontalLinePaneView;

	public constructor(
		price: number,
		options?: DeepPartial<HorizontalLineOptions>
	) {
		this._price = price;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new HorizontalLinePaneView();
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
		_startTimePoint: Logical,
		_endTimePoint: Logical
	): AutoscaleInfo | null {
		// Always include this price in the autoscale range
		return {
			priceRange: {
				minValue: this._price,
				maxValue: this._price,
			},
		};
	}

	/**
	 * Apply new options to the horizontal line.
	 */
	public applyOptions(options: DeepPartial<HorizontalLineOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<HorizontalLineOptions> {
		return this._options;
	}

	/**
	 * Update the price.
	 */
	public setPrice(price: number): void {
		this._price = price;
		this.requestUpdate();
	}

	/**
	 * Get the current price.
	 */
	public price(): number {
		return this._price;
	}

	private _calculateRendererData(): HorizontalLineRendererData | null {
		if (!this._chart || !this._series) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const series = this._series;

		const y = series.priceToCoordinate(this._price);

		return {
			y: y as Coordinate | null,
			lineColor: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			externalId: this._options.externalId,
			chartWidth: timeScale.width(),
			selected: this._options.selected,
			anchorPointColor: this._options.anchorPointColor,
			anchorOffsetFromRight: this._options.anchorOffsetFromRight,
		};
	}
}

/**
 * Factory helper to create a HorizontalLine instance.
 */
export function createHorizontalLinePrimitive<HorzScaleItem = unknown>(
	price: number,
	options?: DeepPartial<HorizontalLineOptions>
): HorizontalLine<HorzScaleItem> {
	return new HorizontalLine<HorzScaleItem>(price, options);
}
