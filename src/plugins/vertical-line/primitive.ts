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

import { VerticalLineOptions, verticalLineOptionsDefaults } from "./options";
import { VerticalLinePaneView } from "./pane-view";
import { VerticalLineRendererData } from "./renderer";

/**
 * Anchor point for the vertical line (time only).
 */
export interface VerticalLinePoint {
	/**
	 * Time value (timestamp or other scale item).
	 */
	time: unknown;
}

function mergeOptionsWithDefaults(
	options: DeepPartial<VerticalLineOptions>
): VerticalLineOptions {
	return {
		...verticalLineOptionsDefaults,
		...options,
	};
}

/**
 * Format a timestamp as a human-readable date/time string.
 * Adapts format based on timeframe.
 */
function formatTimeLabel(timestamp: number, timeframe: string): string {
	const date = new Date(timestamp * 1000);

	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	const dayName = dayNames[date.getDay()];
	const day = date.getDate();
	const month = monthNames[date.getMonth()];
	const year = String(date.getFullYear()).slice(-2);

	// Base date format: "Mon 21 Jul '25"
	let label = `${dayName} ${day} ${month} '${year}`;

	// Include time for minute/hour timeframes
	if (timeframe === "1m" || timeframe === "1h") {
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		label += ` ${hours}:${minutes}`;
	}

	return label;
}

/**
 * VerticalLine draws a vertical line from top to bottom of the chart
 * at the specified time.
 */
export class VerticalLine<HorzScaleItem = unknown>
	implements ISeriesPrimitive<HorzScaleItem>
{
	private _chart: IChartApiBase<HorzScaleItem> | null = null;
	private _series: ISeriesApi<SeriesType, HorzScaleItem> | null = null;
	private _requestUpdate?: () => void;

	private _point: VerticalLinePoint;
	private _options: VerticalLineOptions;

	private readonly _paneView: VerticalLinePaneView;

	public constructor(
		point: VerticalLinePoint,
		options?: DeepPartial<VerticalLineOptions>
	) {
		this._point = point;
		this._options = mergeOptionsWithDefaults(options ?? {});
		this._paneView = new VerticalLinePaneView();
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

	/**
	 * Vertical lines do not contribute to autoscaling.
	 */
	public autoscaleInfo(
		_startTimePoint: Logical,
		_endTimePoint: Logical
	): AutoscaleInfo | null {
		return null;
	}

	/**
	 * Apply new options to the vertical line.
	 */
	public applyOptions(options: DeepPartial<VerticalLineOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this.requestUpdate();
	}

	/**
	 * Get the current options.
	 */
	public options(): Readonly<VerticalLineOptions> {
		return this._options;
	}

	/**
	 * Update the point (time).
	 */
	public setPoint(point: VerticalLinePoint): void {
		this._point = point;
		this.requestUpdate();
	}

	/**
	 * Get the current point.
	 */
	public point(): VerticalLinePoint {
		return this._point;
	}

	private _calculateRendererData(): VerticalLineRendererData | null {
		if (!this._chart || !this._series) {
			return null;
		}

		const timeScale = this._chart.timeScale();
		const series = this._series;

		const x = timeScale.timeToCoordinate(
			this._point.time as HorzScaleItem
		) as Coordinate | null;

		const timeLabel = formatTimeLabel(
			this._point.time as number,
			this._options.timeframe
		);

		return {
			x,
			timeLabel,
			lineColor: this._options.lineColor,
			lineWidth: this._options.lineWidth,
			lineStyle: this._options.lineStyle,
			showTimeLabel: this._options.showTimeLabel,
			labelBackgroundColor: this._options.labelBackgroundColor,
			labelTextColor: this._options.labelTextColor,
			externalId: this._options.externalId,
			chartWidth: timeScale.width(),
			chartHeight: series.getPane().getHeight(),
			selected: this._options.selected,
		};
	}
}

/**
 * Factory helper to create a VerticalLine instance.
 */
export function createVerticalLinePrimitive<HorzScaleItem = unknown>(
	point: VerticalLinePoint,
	options?: DeepPartial<VerticalLineOptions>
): VerticalLine<HorzScaleItem> {
	return new VerticalLine<HorzScaleItem>(point, options);
}

