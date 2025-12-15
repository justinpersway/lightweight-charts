import { LineStyle, LineWidth } from "../../renderers/draw-line";

/**
 * Options for the HorizontalLine primitive.
 */
export interface HorizontalLineOptions {
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
	 * Whether to show a price label on the price axis.
	 */
	showPriceLabel: boolean;

	/**
	 * External ID for identifying this line in hit test results.
	 */
	externalId: string;

	/**
	 * Whether the line is currently selected.
	 * When true, the anchor point indicator is shown.
	 */
	selected: boolean;

	/**
	 * Color of the anchor point indicator when selected.
	 */
	anchorPointColor: string;

	/**
	 * Distance in pixels from the right edge of the chart to place the anchor point.
	 */
	anchorOffsetFromRight: number;
}

export const horizontalLineOptionsDefaults: HorizontalLineOptions = {
	lineColor: "#f97316",
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
	showPriceLabel: true,
	externalId: "",
	selected: false,
	anchorPointColor: "#2962ff",
	anchorOffsetFromRight: 50,
};

