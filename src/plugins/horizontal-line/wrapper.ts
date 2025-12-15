import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import { HorizontalLine } from "./primitive";
import { HorizontalLineOptions } from "./options";

/**
 * Interface for interacting with a horizontal line primitive.
 */
export interface IHorizontalLinePluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, HorizontalLineOptions> {
	/**
	 * Update the price of the horizontal line.
	 * @param price - New price value.
	 */
	setPrice: (price: number) => void;

	/**
	 * Get the current price.
	 */
	price: () => number;

	/**
	 * Get the current options.
	 */
	options: () => Readonly<HorizontalLineOptions>;

	/**
	 * Apply new options to the horizontal line.
	 */
	applyOptions: (options: DeepPartial<HorizontalLineOptions>) => void;

	/**
	 * Detach the primitive from the series.
	 */
	detach: () => void;
}

class HorizontalLinePrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		HorizontalLineOptions,
		HorizontalLine<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, HorizontalLineOptions>,
		IHorizontalLinePluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: HorizontalLine<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setPrice(price: number): void {
		this._primitive.setPrice(price);
	}

	public price(): number {
		return this._primitive.price();
	}

	public options(): Readonly<HorizontalLineOptions> {
		return this._primitive.options();
	}

	public override applyOptions(
		options: DeepPartial<HorizontalLineOptions>
	): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Create a horizontal line primitive attached to the provided series.
 *
 * @example
 * ```ts
 * import { createHorizontalLinePrimitive } from "lightweight-charts";
 *
 * const line = createHorizontalLinePrimitive(
 *   series,
 *   0.54,
 *   { lineColor: "#facc15" }
 * );
 * ```
 */
export function createHorizontalLinePrimitive<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	price: number,
	options?: DeepPartial<HorizontalLineOptions>
): IHorizontalLinePluginApi<HorzScaleItem> {
	return new HorizontalLinePrimitiveWrapper(
		series,
		new HorizontalLine<HorzScaleItem>(price, options)
	);
}

