import { LineStyle, LineWidth } from "../../renderers/draw-line";

/**
 * Options for the TrendLine primitive.
 */
export interface TrendLineOptions {
	/**
	 * Line color.
	 */
	lineColor: string;

	/**
	 * Line width in pixels (1-4).
	 */
	lineWidth: LineWidth;

	/**
	 * Line style (solid, dashed, dotted, etc.).
	 */
	lineStyle: LineStyle;

	/**
	 * Whether to show price labels at the anchor points.
	 */
	showLabels: boolean;

	/**
	 * Background color for labels.
	 */
	labelBackgroundColor: string;

	/**
	 * Text color for labels.
	 */
	labelTextColor: string;

	/**
	 * Whether to extend the line to the edges of the chart.
	 * When true, the line is extrapolated beyond the anchor points.
	 * When false, the line is drawn only between the two anchor points.
	 */
	extendToEdges: boolean;

	/**
	 * External ID for identifying this trend line in hit test results.
	 */
	externalId: string;

	/**
	 * Whether the trend line is currently selected.
	 * When true, anchor point indicators are shown.
	 */
	selected: boolean;

	/**
	 * Color of the anchor point indicators when selected.
	 */
	anchorPointColor: string;
}

export const trendLineOptionsDefaults: TrendLineOptions = {
	lineColor: "#f97316",
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
	showLabels: false,
	labelBackgroundColor: "rgba(255, 255, 255, 0.85)",
	labelTextColor: "rgb(0, 0, 0)",
	extendToEdges: true,
	externalId: "",
	selected: false,
	anchorPointColor: "#2962ff",
};
