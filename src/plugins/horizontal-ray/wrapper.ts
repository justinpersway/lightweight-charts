import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import { HorizontalRay, HorizontalRayAnchorPoint } from "./primitive";
import { HorizontalRayOptions } from "./options";

/**
 * Interface for interacting with a horizontal ray primitive.
 */
export interface IHorizontalRayPluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, HorizontalRayOptions> {
	/**
	 * Update the anchor point of the horizontal ray.
	 * @param point - Anchor point with time and price.
	 */
	setPoint: (point: HorizontalRayAnchorPoint) => void;

	/**
	 * Get the current anchor point.
	 */
	point: () => HorizontalRayAnchorPoint;

	/**
	 * Get the current options.
	 */
	options: () => Readonly<HorizontalRayOptions>;

	/**
	 * Apply new options to the horizontal ray.
	 */
	applyOptions: (options: DeepPartial<HorizontalRayOptions>) => void;

	/**
	 * Detach the primitive from the series.
	 */
	detach: () => void;
}

class HorizontalRayPrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		HorizontalRayOptions,
		HorizontalRay<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, HorizontalRayOptions>,
		IHorizontalRayPluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: HorizontalRay<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setPoint(point: HorizontalRayAnchorPoint): void {
		this._primitive.setPoint(point);
	}

	public point(): HorizontalRayAnchorPoint {
		return this._primitive.point();
	}

	public options(): Readonly<HorizontalRayOptions> {
		return this._primitive.options();
	}

	public override applyOptions(
		options: DeepPartial<HorizontalRayOptions>
	): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Create a horizontal ray primitive attached to the provided series.
 *
 * @example
 * ```ts
 * import { createHorizontalRay } from "lightweight-charts";
 *
 * const ray = createHorizontalRay(
 *   series,
 *   { time: 1716768000, price: 0.54 },
 *   { lineColor: "#facc15" }
 * );
 * ```
 */
export function createHorizontalRay<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	point: HorizontalRayAnchorPoint,
	options?: DeepPartial<HorizontalRayOptions>
): IHorizontalRayPluginApi<HorzScaleItem> {
	return new HorizontalRayPrimitiveWrapper(
		series,
		new HorizontalRay<HorzScaleItem>(point, options)
	);
}
