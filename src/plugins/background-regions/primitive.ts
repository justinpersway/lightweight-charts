import { IChartApiBase } from "../../api/ichart-api";
import { ISeriesApi } from "../../api/iseries-api";
import {
	ISeriesPrimitive,
	SeriesAttachedParameter,
} from "../../api/iseries-primitive-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { Coordinate } from "../../model/coordinate";
import { IPrimitivePaneView } from "../../model/ipane-primitive";
import { SeriesType } from "../../model/series-options";

import {
	BackgroundRegionData,
	BackgroundRegionsOptions,
	backgroundRegionsOptionsDefaults,
} from "./options";
import { BackgroundRegionsPaneView } from "./pane-view";
import { BackgroundRegionRendererData } from "./renderer";

function mergeOptionsWithDefaults(
	options: DeepPartial<BackgroundRegionsOptions>
): BackgroundRegionsOptions {
	return {
		...backgroundRegionsOptionsDefaults,
		...options,
	};
}

/**
 * A primitive that renders colored background regions behind the chart.
 * Each data point specifies a time and color, and the primitive draws
 * full-height colored rectangles for each bar.
 */
export class BackgroundRegions<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _data: BackgroundRegionData[] = [];
	private _options: BackgroundRegionsOptions;

	private _paneView: BackgroundRegionsPaneView;

	public constructor(
		data: BackgroundRegionData[],
		options?: DeepPartial<BackgroundRegionsOptions>
	) {
		this._data = data;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new BackgroundRegionsPaneView();
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
		const rendererData = this._calculateRendererData();
		this._paneView.update(rendererData);
	}

	public hitTest(): null {
		// Background regions are not interactive
		return null;
	}

	/**
	 * Apply new options.
	 */
	public applyOptions(options: DeepPartial<BackgroundRegionsOptions>): void {
		this._options = mergeOptionsWithDefaults({
			...this._options,
			...options,
		});
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<BackgroundRegionsOptions> {
		return this._options;
	}

	/**
	 * Update the region data.
	 */
	public setData(data: BackgroundRegionData[]): void {
		this._data = data;
		this.requestUpdate();
	}

	/**
	 * Get the current region data.
	 */
	public data(): readonly BackgroundRegionData[] {
		return this._data;
	}

	private _calculateRendererData(): {
		regions: BackgroundRegionRendererData[];
		chartHeight: number;
	} {
		if (!this._chart || !this._series || this._data.length === 0) {
			return { regions: [], chartHeight: 0 };
		}

		const timeScale = this._chart.timeScale();
		const chartHeight = this._series.getPane().getHeight();

		// Calculate bar width from the time scale
		// Use the bar spacing to determine width
		const barSpacing = timeScale.options().barSpacing;

		const regions: BackgroundRegionRendererData[] = [];

		for (const point of this._data) {
			const x = timeScale.timeToCoordinate(point.time as HorzScaleItem);
			if (x === null) {
				continue;
			}

			regions.push({
				x: x as Coordinate,
				color: point.color,
				barWidth: barSpacing,
			});
		}

		return { regions, chartHeight };
	}
}

/**
 * Creates a background regions primitive.
 *
 * @param data - Array of region data with time and color.
 * @param options - Optional configuration.
 * @returns A new BackgroundRegions instance.
 */
export function createBackgroundRegionsPrimitive<HorzScaleItem = unknown>(
	data: BackgroundRegionData[],
	options?: DeepPartial<BackgroundRegionsOptions>
): BackgroundRegions<HorzScaleItem> {
	return new BackgroundRegions<HorzScaleItem>(data, options);
}

