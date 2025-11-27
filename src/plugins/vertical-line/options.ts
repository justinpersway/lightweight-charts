import { LineStyle, LineWidth } from "../../renderers/draw-line";

/**
 * Options for the VerticalLine primitive.
 */
export interface VerticalLineOptions {
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
	 * Whether to show a time label on the time axis.
	 */
	showTimeLabel: boolean;

	/**
	 * Background color for the time label.
	 */
	labelBackgroundColor: string;

	/**
	 * Text color for the time label.
	 */
	labelTextColor: string;

	/**
	 * External ID for identifying this line in hit test results.
	 */
	externalId: string;

	/**
	 * Whether the line is currently selected.
	 */
	selected: boolean;

	/**
	 * Timeframe hint for formatting the time label.
	 * - "1m" or "1h": includes time (e.g., "Mon 21 Jul '25 14:30")
	 * - "1d" or other: date only (e.g., "Mon 21 Jul '25")
	 */
	timeframe: string;
}

export const verticalLineOptionsDefaults: VerticalLineOptions = {
	lineColor: "#f97316",
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
	showTimeLabel: true,
	labelBackgroundColor: "rgba(255, 255, 255, 0.85)",
	labelTextColor: "rgb(0, 0, 0)",
	externalId: "",
	selected: false,
	timeframe: "1d",
};

