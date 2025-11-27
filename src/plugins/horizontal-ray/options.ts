import { LineStyle, LineWidth } from "../../renderers/draw-line";

/**
 * Options for the HorizontalRay primitive.
 */
export interface HorizontalRayOptions {
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
	 * Whether to show a price label next to the anchor point.
	 */
	showPriceLabel: boolean;

	/**
	 * Background color for the price label.
	 */
	labelBackgroundColor: string;

	/**
	 * Text color for the price label.
	 */
	labelTextColor: string;

	/**
	 * External ID for identifying this ray in hit test results.
	 */
	externalId: string;

	/**
	 * Whether the ray is currently selected.
	 * When true, the anchor point indicator is shown.
	 */
	selected: boolean;

	/**
	 * Color of the anchor point indicator when selected.
	 */
	anchorPointColor: string;
}

export const horizontalRayOptionsDefaults: HorizontalRayOptions = {
	lineColor: "#f97316",
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
	showPriceLabel: true,
	labelBackgroundColor: "rgba(255, 255, 255, 0.85)",
	labelTextColor: "rgb(0, 0, 0)",
	externalId: "",
	selected: false,
	anchorPointColor: "#2962ff",
};
