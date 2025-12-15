import { LineStyle, LineWidth } from "../../renderers/draw-line";

/**
 * Options for the Long Position primitive.
 */
export interface LongPositionOptions {
	/**
	 * Border line color.
	 */
	lineColor: string;

	/**
	 * Border line width in pixels (1-4).
	 */
	lineWidth: LineWidth;

	/**
	 * Border line style (solid, dashed, dotted, etc.).
	 */
	lineStyle: LineStyle;

	/**
	 * Background color for the profit (target) zone.
	 */
	profitBackgroundColor: string;

	/**
	 * Background color for the risk (stop) zone.
	 */
	riskBackgroundColor: string;

	/**
	 * Color of the entry line (middle horizontal line).
	 */
	entryLineColor: string;

	/**
	 * External ID for identifying this drawing in hit test results.
	 */
	externalId: string;

	/**
	 * Whether the drawing is currently selected.
	 * When true, anchor point indicators are shown.
	 */
	selected: boolean;

	/**
	 * Color of the anchor point indicators when selected.
	 */
	anchorPointColor: string;

	/**
	 * Background color for labels.
	 */
	labelBackgroundColor: string;

	/**
	 * Text color for labels.
	 */
	labelTextColor: string;

	/**
	 * Target label background color.
	 */
	targetLabelBackgroundColor: string;

	/**
	 * Stop label background color.
	 */
	stopLabelBackgroundColor: string;
}

export const longPositionOptionsDefaults: LongPositionOptions = {
	lineColor: "#ffffff",
	lineWidth: 1,
	lineStyle: LineStyle.Solid,
	profitBackgroundColor: "rgba(0, 150, 136, 0.3)", // Teal/green with transparency
	riskBackgroundColor: "rgba(239, 83, 80, 0.3)", // Red with transparency
	entryLineColor: "#ffffff",
	externalId: "",
	selected: false,
	anchorPointColor: "#2962ff",
	labelBackgroundColor: "rgba(0, 0, 0, 0.75)",
	labelTextColor: "#ffffff",
	targetLabelBackgroundColor: "rgb(0, 150, 136)", // Solid teal
	stopLabelBackgroundColor: "rgb(239, 83, 80)", // Solid red
};
