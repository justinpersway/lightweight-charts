import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import { RectangleOptions } from "./options";
import { Rectangle, RectanglePoint } from "./primitive";

/**
 * Interface for a rectangle plugin.
 */
export interface IRectanglePluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, RectangleOptions> {
	/**
	 * Update the anchor points of the rectangle.
	 * @param p1 - The first anchor point (one corner).
	 * @param p2 - The second anchor point (opposite corner).
	 */
	setPoints: (p1: RectanglePoint, p2: RectanglePoint) => void;

	/**
	 * Get the first anchor point.
	 */
	p1: () => RectanglePoint;

	/**
	 * Get the second anchor point.
	 */
	p2: () => RectanglePoint;

	/**
	 * Get the current options.
	 */
	options: () => Readonly<RectangleOptions>;

	/**
	 * Apply new options to the rectangle.
	 */
	applyOptions: (options: DeepPartial<RectangleOptions>) => void;

	/**
	 * Detaches the plugin from the series.
	 */
	detach: () => void;
}

class RectanglePrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		RectangleOptions,
		Rectangle<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, RectangleOptions>,
		IRectanglePluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: Rectangle<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setPoints(p1: RectanglePoint, p2: RectanglePoint): void {
		this._primitive.setPoints(p1, p2);
	}

	public p1(): RectanglePoint {
		return this._primitive.p1();
	}

	public p2(): RectanglePoint {
		return this._primitive.p2();
	}

	public options(): Readonly<RectangleOptions> {
		return this._primitive.options();
	}

	public override applyOptions(options: DeepPartial<RectangleOptions>): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Creates a rectangle primitive that draws a rectangle between two anchor points.
 * The rectangle can optionally extend its horizontal edges to the chart boundaries.
 *
 * @param series - The series to which the primitive will be attached.
 * @param p1 - The first anchor point (one corner) with time and price.
 * @param p2 - The second anchor point (opposite corner) with time and price.
 * @param options - Optional configuration for the rectangle.
 *
 * @example
 * ```js
 * import { createRectangle } from 'lightweight-charts';
 *
 * const rectangle = createRectangle(
 *   series,
 *   { time: 1556880900, price: 100 },
 *   { time: 1556967300, price: 120 },
 *   {
 *     lineColor: '#f97316',
 *     lineWidth: 2,
 *     backgroundColor: 'rgba(249, 115, 22, 0.2)',
 *     extendMode: 'none',
 *     externalId: 'my-rectangle'
 *   }
 * );
 *
 * // Update the anchor points
 * rectangle.setPoints(
 *   { time: 1556880900, price: 105 },
 *   { time: 1556967300, price: 125 }
 * );
 *
 * // Update options
 * rectangle.applyOptions({ backgroundColor: 'rgba(0, 255, 0, 0.2)' });
 *
 * // Detach when done
 * rectangle.detach();
 * ```
 */
export function createRectangle<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	p1: RectanglePoint,
	p2: RectanglePoint,
	options?: DeepPartial<RectangleOptions>
): IRectanglePluginApi<HorzScaleItem> {
	return new RectanglePrimitiveWrapper(
		series,
		new Rectangle<HorzScaleItem>(p1, p2, options)
	);
}

