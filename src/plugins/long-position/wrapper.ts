import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import { LongPositionOptions } from "./options";
import { LongPosition, LongPositionData } from "./primitive";

/**
 * Interface for a Long Position plugin.
 */
export interface ILongPositionPluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, LongPositionOptions> {
	/**
	 * Update the drawing data.
	 * @param data - Partial data to update.
	 */
	setData: (data: Partial<LongPositionData>) => void;

	/**
	 * Get the current data.
	 */
	data: () => Readonly<LongPositionData>;

	/**
	 * Get entry time.
	 */
	entryTime: () => unknown;

	/**
	 * Get entry price.
	 */
	entryPrice: () => number;

	/**
	 * Get target price.
	 */
	targetPrice: () => number;

	/**
	 * Get stop price.
	 */
	stopPrice: () => number;

	/**
	 * Get width in bars.
	 */
	widthBars: () => number;

	/**
	 * Get the current options.
	 */
	options: () => Readonly<LongPositionOptions>;

	/**
	 * Apply new options to the drawing.
	 */
	applyOptions: (options: DeepPartial<LongPositionOptions>) => void;

	/**
	 * Detaches the plugin from the series.
	 */
	detach: () => void;
}

class LongPositionPrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		LongPositionOptions,
		LongPosition<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, LongPositionOptions>,
		ILongPositionPluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: LongPosition<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setData(data: Partial<LongPositionData>): void {
		this._primitive.setData(data);
	}

	public data(): Readonly<LongPositionData> {
		return this._primitive.data();
	}

	public entryTime(): unknown {
		return this._primitive.entryTime();
	}

	public entryPrice(): number {
		return this._primitive.entryPrice();
	}

	public targetPrice(): number {
		return this._primitive.targetPrice();
	}

	public stopPrice(): number {
		return this._primitive.stopPrice();
	}

	public widthBars(): number {
		return this._primitive.widthBars();
	}

	public options(): Readonly<LongPositionOptions> {
		return this._primitive.options();
	}

	public override applyOptions(
		options: DeepPartial<LongPositionOptions>
	): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Creates a Long Position primitive that draws a risk/reward rectangle with entry, target, and stop levels.
 *
 * @param series - The series to which the primitive will be attached.
 * @param data - The data for the long position.
 * @param options - Optional configuration for the drawing.
 *
 * @example
 * ```js
 * import { createLongPosition } from 'lightweight-charts';
 *
 * const longPosition = createLongPosition(
 *   series,
 *   {
 *     entryTime: 1556880900,
 *     entryPrice: 100,
 *     targetPrice: 120,
 *     stopPrice: 90,
 *     widthBars: 20,
 *   },
 *   {
 *     externalId: 'my-long-position',
 *   }
 * );
 *
 * // Update the data
 * longPosition.setData({ targetPrice: 125 });
 *
 * // Update options
 * longPosition.applyOptions({ selected: true });
 *
 * // Detach when done
 * longPosition.detach();
 * ```
 */
export function createLongPosition<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	data: LongPositionData,
	options?: DeepPartial<LongPositionOptions>
): ILongPositionPluginApi<HorzScaleItem> {
	return new LongPositionPrimitiveWrapper(
		series,
		new LongPosition<HorzScaleItem>(data, options)
	);
}
