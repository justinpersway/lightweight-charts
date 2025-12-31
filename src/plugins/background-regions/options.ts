/**
 * A single background region data point.
 */
export interface BackgroundRegionData {
	/**
	 * Time value for this region (matches a candle's time).
	 */
	time: unknown;

	/**
	 * Background color for this region (supports alpha for transparency).
	 */
	color: string;
}

/**
 * Options for the BackgroundRegions primitive.
 */
export interface BackgroundRegionsOptions {
	/**
	 * External ID for identifying this primitive.
	 */
	externalId: string;
}

export const backgroundRegionsOptionsDefaults: BackgroundRegionsOptions = {
	externalId: "",
};

