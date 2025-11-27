import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import { VerticalLine, VerticalLinePoint } from "./primitive";
import { VerticalLineOptions } from "./options";

/**
 * Interface for interacting with a vertical line primitive.
 */
export interface IVerticalLinePluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, VerticalLineOptions> {
	/**
	 * Update the point (time) of the vertical line.
	 * @param point - Point with time.
	 */
	setPoint: (point: VerticalLinePoint) => void;

	/**
	 * Get the current point.
	 */
	point: () => VerticalLinePoint;

	/**
	 * Get the current options.
	 */
	options: () => Readonly<VerticalLineOptions>;

	/**
	 * Apply new options to the vertical line.
	 */
	applyOptions: (options: DeepPartial<VerticalLineOptions>) => void;

	/**
	 * Detach the primitive from the series.
	 */
	detach: () => void;
}

class VerticalLinePrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		VerticalLineOptions,
		VerticalLine<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, VerticalLineOptions>,
		IVerticalLinePluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: VerticalLine<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setPoint(point: VerticalLinePoint): void {
		this._primitive.setPoint(point);
	}

	public point(): VerticalLinePoint {
		return this._primitive.point();
	}

	public options(): Readonly<VerticalLineOptions> {
		return this._primitive.options();
	}

	public override applyOptions(
		options: DeepPartial<VerticalLineOptions>
	): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Create a vertical line primitive attached to the provided series.
 *
 * @example
 * ```ts
 * import { createVerticalLine } from "lightweight-charts";
 *
 * const line = createVerticalLine(
 *   series,
 *   { time: 1716768000 },
 *   { lineColor: "#facc15", timeframe: "1d" }
 * );
 * ```
 */
export function createVerticalLine<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	point: VerticalLinePoint,
	options?: DeepPartial<VerticalLineOptions>
): IVerticalLinePluginApi<HorzScaleItem> {
	return new VerticalLinePrimitiveWrapper(
		series,
		new VerticalLine<HorzScaleItem>(point, options)
	);
}

