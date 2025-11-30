import { LineStyle, LineWidth } from "../../renderers/draw-line";

/**
 * Extension mode for the rectangle.
 * - "none": Rectangle is drawn only between the two anchor points
 * - "left": Rectangle extends from left edge of chart to the right anchor point
 * - "right": Rectangle extends from left anchor point to right edge of chart
 * - "both": Rectangle extends from left edge to right edge of chart
 */
export type RectangleExtendMode = "none" | "left" | "right" | "both";

/**
 * Options for the Rectangle primitive.
 */
export interface RectangleOptions {
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
	 * Background fill color (supports alpha for transparency).
	 */
	backgroundColor: string;

	/**
	 * Custom label text to display in the rectangle.
	 */
	labelText: string;

	/**
	 * Whether to show the label.
	 */
	showLabel: boolean;

	/**
	 * Background color for the label.
	 */
	labelBackgroundColor: string;

	/**
	 * Text color for the label.
	 */
	labelTextColor: string;

	/**
	 * Extension mode for the rectangle's horizontal edges.
	 */
	extendMode: RectangleExtendMode;

	/**
	 * External ID for identifying this rectangle in hit test results.
	 */
	externalId: string;

	/**
	 * Whether the rectangle is currently selected.
	 * When true, anchor point indicators are shown.
	 */
	selected: boolean;

	/**
	 * Color of the anchor point indicators when selected.
	 */
	anchorPointColor: string;

	/**
	 * Whether to show a middle line through the vertical center of the rectangle.
	 */
	showMiddleLine: boolean;

	/**
	 * Color of the middle line.
	 */
	middleLineColor: string;

	/**
	 * Style of the middle line (solid, dashed, dotted, etc.).
	 */
	middleLineStyle: LineStyle;

	/**
	 * Width of the middle line in pixels (1-4).
	 */
	middleLineWidth: LineWidth;
}

export const rectangleOptionsDefaults: RectangleOptions = {
	lineColor: "#f97316",
	lineWidth: 2,
	lineStyle: LineStyle.Solid,
	backgroundColor: "rgba(249, 115, 22, 0.2)",
	labelText: "",
	showLabel: false,
	labelBackgroundColor: "rgba(255, 255, 255, 0.85)",
	labelTextColor: "rgb(0, 0, 0)",
	extendMode: "right",
	externalId: "",
	selected: false,
	anchorPointColor: "#2962ff",
	showMiddleLine: false,
	middleLineColor: "#f97316",
	middleLineStyle: LineStyle.Dashed,
	middleLineWidth: 1,
};
