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

import { longPositionOptionsDefaults, LongPositionOptions } from "./options";
import { LongPositionPaneView } from "./pane-view";
import {
	LongPositionRendererData,
	LongPositionRendererPoint,
} from "./renderer";

/**
 * Data for a Long Position drawing.
 */
export interface LongPositionData {
	/**
	 * Entry time (can be a timestamp or other time format based on the chart's time scale).
	 */
	entryTime: unknown;

	/**
	 * Entry price.
	 */
	entryPrice: number;

	/**
	 * Target price.
	 */
	targetPrice: number;

	/**
	 * Stop price.
	 */
	stopPrice: number;

	/**
	 * Width in logical bars from entry.
	 */
	widthBars: number;
}

function mergeOptionsWithDefaults(
	options: DeepPartial<LongPositionOptions>
): LongPositionOptions {
	return {
		...longPositionOptionsDefaults,
		...options,
	};
}

/**
 * A Long Position primitive that draws a risk/reward rectangle with entry, target, and stop levels.
 */
export class LongPosition<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _data: LongPositionData;
	private _options: LongPositionOptions;

	private _paneView: LongPositionPaneView;

	public constructor(
		data: LongPositionData,
		options?: DeepPartial<LongPositionOptions>
	) {
		this._data = data;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new LongPositionPaneView();
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
		// Get the logical index of entry
		const entryIndex = this._getEntryLogicalIndex();
		if (entryIndex === null) {
			return null;
		}

		const endIndex = entryIndex + this._data.widthBars;

		// Check if the drawing is visible in the current range
		if (endTimePoint < entryIndex || startTimePoint > endIndex) {
			return null;
		}

		const minPrice = Math.min(
			this._data.entryPrice,
			this._data.targetPrice,
			this._data.stopPrice
		);
		const maxPrice = Math.max(
			this._data.entryPrice,
			this._data.targetPrice,
			this._data.stopPrice
		);

		return {
			priceRange: {
				minValue: minPrice,
				maxValue: maxPrice,
			},
		};
	}

	/**
	 * Apply new options to the drawing.
	 */
	public applyOptions(options: DeepPartial<LongPositionOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<LongPositionOptions> {
		return this._options;
	}

	/**
	 * Update the drawing data.
	 */
	public setData(data: Partial<LongPositionData>): void {
		this._data = { ...this._data, ...data };
		this.requestUpdate();
	}

	/**
	 * Get the current data.
	 */
	public data(): Readonly<LongPositionData> {
		return this._data;
	}

	/**
	 * Get entry time.
	 */
	public entryTime(): unknown {
		return this._data.entryTime;
	}

	/**
	 * Get entry price.
	 */
	public entryPrice(): number {
		return this._data.entryPrice;
	}

	/**
	 * Get target price.
	 */
	public targetPrice(): number {
		return this._data.targetPrice;
	}

	/**
	 * Get stop price.
	 */
	public stopPrice(): number {
		return this._data.stopPrice;
	}

	/**
	 * Get width in bars.
	 */
	public widthBars(): number {
		return this._data.widthBars;
	}

	private _getEntryLogicalIndex(): number | null {
		if (!this._chart) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const coordinate = timeScale.timeToCoordinate(
			this._data.entryTime as HorzScaleItem
		);
		if (coordinate === null) {
			return null;
		}

		return timeScale.coordinateToLogical(coordinate);
	}

	private _calculateRendererData(): LongPositionRendererData | null {
		if (!this._chart || !this._series) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const series = this._series;

		// Convert entry time to coordinate
		const entryX = timeScale.timeToCoordinate(
			this._data.entryTime as HorzScaleItem
		);
		const entryY = series.priceToCoordinate(this._data.entryPrice);

		if (entryX === null || entryY === null) {
			return null;
		}

		// Calculate right edge using logical coordinates
		const entryLogical = timeScale.coordinateToLogical(entryX);
		if (entryLogical === null) {
			return null;
		}

		const rightLogical = (entryLogical + this._data.widthBars) as Logical;
		const rightX = timeScale.logicalToCoordinate(rightLogical);

		if (rightX === null) {
			return null;
		}

		// Convert prices to coordinates
		const targetY = series.priceToCoordinate(this._data.targetPrice);
		const stopY = series.priceToCoordinate(this._data.stopPrice);

		if (targetY === null || stopY === null) {
			return null;
		}

		const entry: LongPositionRendererPoint = { x: entryX, y: entryY };

		// Calculate chart dimensions
		const chartWidth = timeScale.width();
		const chartHeight = series.getPane().getHeight();

		return {
			entry,
			targetY,
			stopY,
			rightX,
			entryPrice: this._data.entryPrice,
			targetPrice: this._data.targetPrice,
			stopPrice: this._data.stopPrice,
			lineColor: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			profitBackgroundColor: this._options.profitBackgroundColor,
			riskBackgroundColor: this._options.riskBackgroundColor,
			entryLineColor: this._options.entryLineColor,
			externalId: this._options.externalId,
			chartWidth,
			chartHeight,
			selected: this._options.selected,
			anchorPointColor: this._options.anchorPointColor,
			labelBackgroundColor: this._options.labelBackgroundColor,
			labelTextColor: this._options.labelTextColor,
			targetLabelBackgroundColor: this._options.targetLabelBackgroundColor,
			stopLabelBackgroundColor: this._options.stopLabelBackgroundColor,
		};
	}
}

/**
 * Creates a Long Position primitive.
 *
 * @param data - The data for the long position (entry, target, stop, width).
 * @param options - Optional configuration for the drawing.
 * @returns A new LongPosition instance.
 */
export function createLongPositionPrimitive<HorzScaleItem = unknown>(
	data: LongPositionData,
	options?: DeepPartial<LongPositionOptions>
): LongPosition<HorzScaleItem> {
	return new LongPosition<HorzScaleItem>(data, options);
}
