/// <reference types="_build-time-constants" />

import {
	customStyleDefaults,
	seriesOptionsDefaults,
} from "./api/options/series-options-defaults";
import { CustomSeriesOptions } from "./model/series-options";

export { LineStyle, LineType } from "./renderers/draw-line";

export { TrackingModeExitMode } from "./model/chart-model";
export { CrosshairMode } from "./model/crosshair";
export { MismatchDirection } from "./model/plot-list";
export { PriceScaleMode } from "./model/price-scale";
export {
	PriceLineSource,
	LastPriceAnimationMode,
} from "./model/series-options";
export { ColorType } from "./model/layout-options";

export {
	isBusinessDay,
	isUTCTimestamp,
} from "./model/horz-scale-behavior-time/types";
export { TickMarkType } from "./model/horz-scale-behavior-time/types";
export const customSeriesDefaultOptions: CustomSeriesOptions = {
	...seriesOptionsDefaults,
	...customStyleDefaults,
};
export type {
	ICustomSeriesPaneView,
	ICustomSeriesPaneRenderer,
	CustomBarItemData,
	CustomData,
} from "./model/icustom-series";

export {
	createChart,
	createChartEx,
	defaultHorzScaleBehavior,
} from "./api/create-chart";
export { createYieldCurveChart } from "./api/create-yield-curve-chart";
export { createOptionsChart } from "./api/create-options-chart";

export { lineSeries as LineSeries } from "./model/series/line-series";
export { baselineSeries as BaselineSeries } from "./model/series/baseline-series";
export { areaSeries as AreaSeries } from "./model/series/area-series";
export { barSeries as BarSeries } from "./model/series/bar-series";
export { candlestickSeries as CandlestickSeries } from "./model/series/candlestick-series";
export { histogramSeries as HistogramSeries } from "./model/series/histogram-series";
/*
	Plugins
*/
export { createTextWatermark } from "./plugins/text-watermark/primitive";
export { createImageWatermark } from "./plugins/image-watermark/primitive";
export { createSeriesMarkers } from "./plugins/series-markers/wrapper";
export { createUpDownMarkers } from "./plugins/up-down-markers-plugin/wrapper";
export { createTrendLine } from "./plugins/trend-line/wrapper";
export type { ITrendLinePluginApi } from "./plugins/trend-line/wrapper";
export type { TrendLineOptions } from "./plugins/trend-line/options";
export type { TrendLinePoint } from "./plugins/trend-line/primitive";
export { createHorizontalRay } from "./plugins/horizontal-ray/wrapper";
export type { IHorizontalRayPluginApi } from "./plugins/horizontal-ray/wrapper";
export type { HorizontalRayOptions } from "./plugins/horizontal-ray/options";
export type { HorizontalRayAnchorPoint } from "./plugins/horizontal-ray/primitive";
export { createVerticalLine } from "./plugins/vertical-line/wrapper";
export type { IVerticalLinePluginApi } from "./plugins/vertical-line/wrapper";
export type { VerticalLineOptions } from "./plugins/vertical-line/options";
export type { VerticalLinePoint } from "./plugins/vertical-line/primitive";
export { createRectangle } from "./plugins/rectangle/wrapper";
export type { IRectanglePluginApi } from "./plugins/rectangle/wrapper";
export type {
	RectangleOptions,
	RectangleExtendMode,
} from "./plugins/rectangle/options";
export type { RectanglePoint } from "./plugins/rectangle/primitive";
export { createHorizontalLinePrimitive } from "./plugins/horizontal-line/wrapper";
export type { IHorizontalLinePluginApi } from "./plugins/horizontal-line/wrapper";
export type { HorizontalLineOptions } from "./plugins/horizontal-line/options";

/**
 * Returns the current version as a string. For example `'3.3.0'`.
 */
export function version(): string {
	return process.env.BUILD_VERSION;
}
