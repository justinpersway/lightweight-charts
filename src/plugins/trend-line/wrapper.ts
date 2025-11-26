import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import { TrendLineOptions } from "./options";
import { TrendLine, TrendLinePoint } from "./primitive";

/**
 * Interface for a trend line plugin.
 */
export interface ITrendLinePluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, TrendLineOptions> {
	/**
	 * Update the anchor points of the trend line.
	 * @param p1 - The first anchor point.
	 * @param p2 - The second anchor point.
	 */
	setPoints: (p1: TrendLinePoint, p2: TrendLinePoint) => void;

	/**
	 * Get the first anchor point.
	 */
	p1: () => TrendLinePoint;

	/**
	 * Get the second anchor point.
	 */
	p2: () => TrendLinePoint;

	/**
	 * Get the current options.
	 */
	options: () => Readonly<TrendLineOptions>;

	/**
	 * Apply new options to the trend line.
	 */
	applyOptions: (options: DeepPartial<TrendLineOptions>) => void;

	/**
	 * Detaches the plugin from the series.
	 */
	detach: () => void;
}

class TrendLinePrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		TrendLineOptions,
		TrendLine<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, TrendLineOptions>,
		ITrendLinePluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: TrendLine<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setPoints(p1: TrendLinePoint, p2: TrendLinePoint): void {
		this._primitive.setPoints(p1, p2);
	}

	public p1(): TrendLinePoint {
		return this._primitive.p1();
	}

	public p2(): TrendLinePoint {
		return this._primitive.p2();
	}

	public options(): Readonly<TrendLineOptions> {
		return this._primitive.options();
	}

	public override applyOptions(options: DeepPartial<TrendLineOptions>): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Creates a trend line primitive that draws a line through two anchor points.
 * The line can optionally extend to the edges of the chart.
 *
 * @param series - The series to which the primitive will be attached.
 * @param p1 - The first anchor point with time and price.
 * @param p2 - The second anchor point with time and price.
 * @param options - Optional configuration for the trend line.
 *
 * @example
 * ```js
 * import { createTrendLine } from 'lightweight-charts';
 *
 * const trendLine = createTrendLine(
 *   series,
 *   { time: 1556880900, price: 100 },
 *   { time: 1556967300, price: 110 },
 *   {
 *     lineColor: '#f97316',
 *     lineWidth: 2,
 *     lineStyle: LineStyle.Solid,
 *     extendToEdges: true,
 *     externalId: 'my-trend-line'
 *   }
 * );
 *
 * // Update the anchor points
 * trendLine.setPoints(
 *   { time: 1556880900, price: 105 },
 *   { time: 1556967300, price: 115 }
 * );
 *
 * // Update options
 * trendLine.applyOptions({ lineColor: '#00ff00' });
 *
 * // Detach when done
 * trendLine.detach();
 * ```
 */
export function createTrendLine<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	p1: TrendLinePoint,
	p2: TrendLinePoint,
	options?: DeepPartial<TrendLineOptions>
): ITrendLinePluginApi<HorzScaleItem> {
	return new TrendLinePrimitiveWrapper(
		series,
		new TrendLine<HorzScaleItem>(p1, p2, options)
	);
}
