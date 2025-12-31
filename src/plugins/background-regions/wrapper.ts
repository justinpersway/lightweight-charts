import { ISeriesApi } from "../../api/iseries-api";

import { DeepPartial } from "../../helpers/strict-type-checks";

import { SeriesType } from "../../model/series-options";

import {
	ISeriesPrimitiveWrapper,
	SeriesPrimitiveAdapter,
} from "../series-primitive-adapter";
import {
	BackgroundRegionData,
	BackgroundRegionsOptions,
} from "./options";
import { BackgroundRegions } from "./primitive";

/**
 * Interface for a background regions plugin.
 */
export interface IBackgroundRegionsPluginApi<HorzScaleItem>
	extends ISeriesPrimitiveWrapper<HorzScaleItem, BackgroundRegionsOptions> {
	/**
	 * Update the region data.
	 * @param data - Array of region data with time and color.
	 */
	setData: (data: BackgroundRegionData[]) => void;

	/**
	 * Get the current region data.
	 */
	data: () => readonly BackgroundRegionData[];

	/**
	 * Get the current options.
	 */
	options: () => Readonly<BackgroundRegionsOptions>;

	/**
	 * Apply new options.
	 */
	applyOptions: (options: DeepPartial<BackgroundRegionsOptions>) => void;

	/**
	 * Detaches the plugin from the series.
	 */
	detach: () => void;
}

class BackgroundRegionsPrimitiveWrapper<HorzScaleItem>
	extends SeriesPrimitiveAdapter<
		HorzScaleItem,
		BackgroundRegionsOptions,
		BackgroundRegions<HorzScaleItem>
	>
	implements
		ISeriesPrimitiveWrapper<HorzScaleItem, BackgroundRegionsOptions>,
		IBackgroundRegionsPluginApi<HorzScaleItem>
{
	public constructor(
		series: ISeriesApi<SeriesType, HorzScaleItem>,
		primitive: BackgroundRegions<HorzScaleItem>
	) {
		super(series, primitive);
	}

	public setData(data: BackgroundRegionData[]): void {
		this._primitive.setData(data);
	}

	public data(): readonly BackgroundRegionData[] {
		return this._primitive.data();
	}

	public options(): Readonly<BackgroundRegionsOptions> {
		return this._primitive.options();
	}

	public override applyOptions(
		options: DeepPartial<BackgroundRegionsOptions>
	): void {
		this._primitive.applyOptions(options);
	}
}

/**
 * Creates a background regions primitive that draws colored backgrounds
 * behind each bar/candle.
 *
 * @param series - The series to which the primitive will be attached.
 * @param data - Array of region data with time and color.
 * @param options - Optional configuration.
 *
 * @example
 * ```js
 * import { createBackgroundRegions } from 'lightweight-charts';
 *
 * const backgrounds = createBackgroundRegions(
 *   series,
 *   [
 *     { time: 1556880900, color: 'rgba(107, 114, 128, 0.15)' },
 *     { time: 1556967300, color: 'rgba(234, 179, 8, 0.15)' },
 *     { time: 1557053700, color: 'rgba(34, 197, 94, 0.15)' },
 *   ],
 *   { externalId: 'my-backgrounds' }
 * );
 *
 * // Update the data
 * backgrounds.setData([...newData]);
 *
 * // Detach when done
 * backgrounds.detach();
 * ```
 */
export function createBackgroundRegions<HorzScaleItem>(
	series: ISeriesApi<SeriesType, HorzScaleItem>,
	data: BackgroundRegionData[],
	options?: DeepPartial<BackgroundRegionsOptions>
): IBackgroundRegionsPluginApi<HorzScaleItem> {
	return new BackgroundRegionsPrimitiveWrapper(
		series,
		new BackgroundRegions<HorzScaleItem>(data, options)
	);
}

